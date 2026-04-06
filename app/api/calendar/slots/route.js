/**
 * @fileoverview Calendar slots API — public endpoint for getting available time slots
 * GET /api/calendar/slots?userId=&eventTypeId=&date=YYYY-MM-DD&timezone=
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAvailableSlots } from '@/lib/availability';

/**
 * GET /api/calendar/slots
 * Returns available time slots for a given host, event type, and date.
 * This is a PUBLIC endpoint — no authentication required (used on booking pages).
 *
 * Query params:
 * - userId: host's Supabase user ID
 * - eventTypeId: the event type being booked
 * - date: YYYY-MM-DD format
 * - timezone: guest's IANA timezone string
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const eventTypeId = searchParams.get('eventTypeId');
    const date = searchParams.get('date');
    const timezone = searchParams.get('timezone') || 'UTC';

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Fetch event type to get duration
    let duration = 30; // default
    if (eventTypeId) {
      const { data: eventType } = await supabaseAdmin
        .from('event_types')
        .select('duration')
        .eq('id', eventTypeId)
        .eq('is_active', true)
        .single();

      if (eventType) duration = eventType.duration;
    }

    const slots = await getAvailableSlots(userId, date, duration, timezone);

    return NextResponse.json({ slots, date, timezone });
  } catch (error) {
    console.error('GET /api/calendar/slots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
