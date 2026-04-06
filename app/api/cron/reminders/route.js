/**
 * @fileoverview Vercel Cron job — 24-hour booking reminder emails
 * GET /api/cron/reminders
 * Runs hourly. Protected by CRON_SECRET Bearer token.
 * Sends reminder emails to guests whose booking is 23–25 hours away.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingReminder } from '@/lib/email';

export async function GET(request) {
  // Security: validate cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find confirmed bookings starting in 23–25 hours that haven't been reminded
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, guest_name, guest_email, guest_timezone, start_time, end_time, notes,
        event_types (title, location, duration),
        users!bookings_host_id_fkey (name, email, timezone)
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('start_time', in23Hours.toISOString())
      .lte('start_time', in25Hours.toISOString());

    if (error) throw error;

    let sentCount = 0;

    for (const booking of bookings || []) {
      try {
        await sendBookingReminder({
          guestEmail: booking.guest_email,
          guestName: booking.guest_name,
          hostName: booking.users?.name,
          eventTitle: booking.event_types?.title,
          startTime: booking.start_time,
          endTime: booking.end_time,
          timezone: booking.guest_timezone || booking.users?.timezone || 'UTC',
          location: booking.event_types?.location,
        });

        // Mark reminder as sent
        await supabaseAdmin
          .from('bookings')
          .update({ reminder_sent: true })
          .eq('id', booking.id);

        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, emailErr);
      }
    }

    console.log(`Cron: sent ${sentCount} reminder emails`);
    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
