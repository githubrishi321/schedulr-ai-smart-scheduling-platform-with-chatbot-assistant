/**
 * @fileoverview Availability calculation engine
 * Computes open time slots by combining user rules, existing bookings,
 * blocked times, and Google Calendar busy periods.
 */

import { supabaseAdmin } from './supabase';
import { getCalendarClient, getCalendarEvents } from './google-calendar';
import {
  parseISO,
  addMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isBefore,
  isAfter,
  format,
  parse,
} from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Returns an array of available time slots for a given user, date, and duration.
 * Considers: availability rules, existing bookings, blocked times, Google Calendar.
 *
 * @param {string} userId - Supabase user ID of the host
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {number} duration - Duration of the event in minutes
 * @param {string} guestTimezone - IANA timezone string for the guest (e.g. "America/New_York")
 * @returns {Promise<Array<{start: string, end: string, startUTC: string, endUTC: string}>>}
 */
export async function getAvailableSlots(userId, date, duration, guestTimezone) {
  // 1. Fetch host user info (for timezone & Google tokens)
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('timezone, google_access_token, google_refresh_token')
    .eq('id', userId)
    .single();

  if (!user) return [];

  const hostTimezone = user.timezone || 'UTC';

  // 2. Determine the day of week for the given date
  const dateObj = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = dateObj.getDay(); // 0=Sun ... 6=Sat

  // 3. Fetch availability rules for this day
  const { data: rules } = await supabaseAdmin
    .from('availability')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (!rules || rules.length === 0) return [];

  // 4. Build UTC range for the full day in the host's timezone
  const dayStartInHostTz = fromZonedTime(`${date}T00:00:00`, hostTimezone);
  const dayEndInHostTz = fromZonedTime(`${date}T23:59:59`, hostTimezone);

  // 5. Fetch existing bookings that overlap this day
  const { data: existingBookings } = await supabaseAdmin
    .from('bookings')
    .select('start_time, end_time')
    .eq('host_id', userId)
    .eq('status', 'confirmed')
    .gte('start_time', dayStartInHostTz.toISOString())
    .lte('start_time', dayEndInHostTz.toISOString());

  // 6. Fetch blocked times that overlap this day
  const { data: blockedTimes } = await supabaseAdmin
    .from('blocked_times')
    .select('start_time, end_time')
    .eq('user_id', userId)
    .gte('start_time', dayStartInHostTz.toISOString())
    .lte('end_time', dayEndInHostTz.toISOString());

  // 7. Fetch Google Calendar busy slots
  let googleBusySlots = [];
  if (user.google_access_token) {
    try {
      const calClient = getCalendarClient(
        user.google_access_token,
        user.google_refresh_token
      );
      googleBusySlots = await getCalendarEvents(
        calClient,
        dayStartInHostTz.toISOString(),
        dayEndInHostTz.toISOString()
      );
    } catch (e) {
      console.warn('Google Calendar fetch failed; continuing without it');
    }
  }

  // 8. Combine all busy periods
  const busyPeriods = [
    ...(existingBookings || []).map(b => ({
      start: parseISO(b.start_time),
      end: parseISO(b.end_time),
    })),
    ...(blockedTimes || []).map(b => ({
      start: parseISO(b.start_time),
      end: parseISO(b.end_time),
    })),
    ...googleBusySlots.map(b => ({
      start: parseISO(b.start),
      end: parseISO(b.end),
    })),
  ];

  const availableSlots = [];
  const now = new Date();

  // 9. For each availability rule, generate slots in 15-min increments
  for (const rule of rules) {
    // Parse rule times in host timezone
    const ruleStart = fromZonedTime(
      `${date}T${rule.start_time}`,
      hostTimezone
    );
    const ruleEnd = fromZonedTime(
      `${date}T${rule.end_time}`,
      hostTimezone
    );

    let slotStart = new Date(ruleStart);

    while (true) {
      const slotEnd = addMinutes(slotStart, duration);

      // Stop if slot would exceed rule end time
      if (isAfter(slotEnd, ruleEnd)) break;

      // Skip slots in the past (with 15-min buffer)
      if (isAfter(addMinutes(now, 15), slotEnd)) {
        slotStart = addMinutes(slotStart, 15);
        continue;
      }

      // Check if slot overlaps any busy period
      const isConflict = busyPeriods.some(
        busy =>
          isBefore(slotStart, busy.end) && isAfter(slotEnd, busy.start)
      );

      if (!isConflict) {
        // Convert to guest timezone for display
        const guestTz = guestTimezone || hostTimezone;
        availableSlots.push({
          startUTC: slotStart.toISOString(),
          endUTC: slotEnd.toISOString(),
          start: formatInTimeZone(slotStart, guestTz, 'h:mm a'),
          end: formatInTimeZone(slotEnd, guestTz, 'h:mm a'),
        });
      }

      slotStart = addMinutes(slotStart, 15); // 15-min increment
    }
  }

  return availableSlots;
}

/**
 * Checks whether a specific time slot is available for a user.
 * @param {string} userId - Supabase user ID of the host
 * @param {string} startTime - ISO 8601 start time string (UTC)
 * @param {string} endTime - ISO 8601 end time string (UTC)
 * @returns {Promise<boolean>} True if the slot is free, false if there's a conflict
 */
export async function isSlotAvailable(userId, startTime, endTime) {
  const start = parseISO(startTime);
  const end = parseISO(endTime);

  // Check bookings
  const { data: conflictingBookings } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('host_id', userId)
    .eq('status', 'confirmed')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (conflictingBookings && conflictingBookings.length > 0) return false;

  // Check blocked times
  const { data: conflictingBlocks } = await supabaseAdmin
    .from('blocked_times')
    .select('id')
    .eq('user_id', userId)
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (conflictingBlocks && conflictingBlocks.length > 0) return false;

  return true;
}
