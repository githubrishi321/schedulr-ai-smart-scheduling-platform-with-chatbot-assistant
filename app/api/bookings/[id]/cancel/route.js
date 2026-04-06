/**
 * @fileoverview Booking cancellation API
 * POST /api/bookings/[id]/cancel — cancel a booking, delete GCal event, send email
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getCalendarClient, deleteCalendarEvent } from '@/lib/google-calendar';
import { sendCancellationEmail } from '@/lib/email';

/**
 * POST /api/bookings/[id]/cancel
 * Cancels a confirmed booking. Can be triggered by the host (authenticated)
 * or via a cancellation token link (future feature).
 *
 * Actions:
 * 1. Updates booking status to 'cancelled'
 * 2. Deletes Google Calendar event if one exists
 * 3. Sends cancellation email to guest
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { cancellationReason } = body;

    // Fetch the booking with host and event type info
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        event_types (title, location),
        users!bookings_host_id_fkey (
          name,
          email,
          timezone,
          google_access_token,
          google_refresh_token
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Authorization: allow host (authenticated) or check cancellation token
    if (session?.user?.id && session.user.id !== booking.host_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 409 });
    }

    // Step 1: Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellationReason || null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    const host = booking.users;

    // Step 2: Delete Google Calendar event
    if (booking.google_event_id && host?.google_access_token) {
      try {
        const calClient = getCalendarClient(
          host.google_access_token,
          host.google_refresh_token
        );
        await deleteCalendarEvent(calClient, booking.google_event_id);
      } catch (calErr) {
        console.warn('Failed to delete Google Calendar event:', calErr);
      }
    }

    // Step 3: Send cancellation email to guest
    try {
      await sendCancellationEmail({
        guestEmail: booking.guest_email,
        guestName: booking.guest_name,
        eventTitle: booking.event_types?.title || 'Meeting',
        startTime: booking.start_time,
        timezone: booking.guest_timezone || host?.timezone || 'UTC',
      });
    } catch (emailErr) {
      console.warn('Failed to send cancellation email:', emailErr);
    }

    return NextResponse.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('POST /api/bookings/[id]/cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
