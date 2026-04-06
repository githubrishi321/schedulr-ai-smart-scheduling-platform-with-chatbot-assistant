/**
 * @fileoverview Bookings API — GET all & POST create
 * GET /api/bookings — authenticated user's booking history
 * POST /api/bookings — create a new booking (public endpoint)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isSlotAvailable } from '@/lib/availability';
import { getCalendarClient, createCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmation } from '@/lib/email';

/**
 * GET /api/bookings
 * Returns all bookings for the authenticated user (host perspective).
 * Includes upcoming and past bookings with event type info.
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        event_types (
          id,
          title,
          duration,
          color,
          location
        )
      `)
      .eq('host_id', session.user.id)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

/**
 * POST /api/bookings
 * Creates a new booking. This is a PUBLIC endpoint (guests book without auth).
 * Process:
 *   1. Validate slot availability
 *   2. Create booking in Supabase
 *   3. Create Google Calendar event if host has connected Google
 *   4. Send confirmation emails
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      eventTypeId,
      startTime,
      endTime,
      guestName,
      guestEmail,
      guestTimezone,
      notes,
      answers,
    } = body;

    // Validate required fields
    if (!eventTypeId || !startTime || !endTime || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'eventTypeId, startTime, endTime, guestName, and guestEmail are required' },
        { status: 400 }
      );
    }

    // Fetch event type and host info
    const { data: eventType, error: etError } = await supabaseAdmin
      .from('event_types')
      .select(`
        *,
        users (
          id,
          name,
          email,
          timezone,
          google_access_token,
          google_refresh_token
        )
      `)
      .eq('id', eventTypeId)
      .eq('is_active', true)
      .single();

    if (etError || !eventType) {
      return NextResponse.json({ error: 'Event type not found or inactive' }, { status: 404 });
    }

    const host = eventType.users;

    // Step 1: Validate slot is still available
    const available = await isSlotAvailable(host.id, startTime, endTime);
    if (!available) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another time.' },
        { status: 409 }
      );
    }

    // Step 2: Create booking in Supabase
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        event_type_id: eventTypeId,
        host_id: host.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_timezone: guestTimezone || host.timezone,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
        answers: answers || {},
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Step 3: Create Google Calendar event if host has Google connected
    let googleEventId = null;
    if (host.google_access_token) {
      try {
        const calClient = getCalendarClient(
          host.google_access_token,
          host.google_refresh_token
        );
        googleEventId = await createCalendarEvent(calClient, {
          title: `${eventType.title} with ${guestName}`,
          startTime,
          endTime,
          guestEmail,
          guestName,
          location: eventType.location || '',
          description: `Scheduled via Schedulr\n\nGuest: ${guestName}\nEmail: ${guestEmail}${notes ? `\nNotes: ${notes}` : ''}`,
        });

        if (googleEventId) {
          await supabaseAdmin
            .from('bookings')
            .update({ google_event_id: googleEventId })
            .eq('id', booking.id);
        }
      } catch (calErr) {
        console.warn('Google Calendar event creation failed:', calErr);
      }
    }

    // Step 4: Send confirmation emails
    try {
      await sendBookingConfirmation({
        hostEmail: host.email,
        guestEmail,
        guestName,
        hostName: host.name,
        eventTitle: eventType.title,
        startTime,
        endTime,
        timezone: guestTimezone || host.timezone || 'UTC',
        location: eventType.location,
        bookingId: booking.id,
      });
    } catch (emailErr) {
      console.warn('Email sending failed:', emailErr);
    }

    return NextResponse.json({
      booking: { ...booking, google_event_id: googleEventId },
      eventType: {
        title: eventType.title,
        duration: eventType.duration,
        location: eventType.location,
        color: eventType.color,
      },
      host: {
        name: host.name,
        email: host.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
