/**
 * @fileoverview Email sending helpers using Resend
 * Sends booking confirmation and cancellation emails to hosts and guests
 */

import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@schedulr.app';

/**
 * Formats a date-time string for display in emails.
 * @param {string} isoString - ISO 8601 datetime string
 * @param {string} timezone - IANA timezone string
 * @returns {string} Formatted date string
 */
function formatEmailDateTime(isoString, timezone) {
  try {
    return formatInTimeZone(parseISO(isoString), timezone, "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
  } catch {
    return isoString;
  }
}

/**
 * Sends booking confirmation emails to both the host and the guest.
 * @param {Object} params - Email parameters
 * @param {string} params.hostEmail - Host's email address
 * @param {string} params.guestEmail - Guest's email address
 * @param {string} params.guestName - Guest's full name
 * @param {string} params.hostName - Host's full name
 * @param {string} params.eventTitle - Name of the booked event type
 * @param {string} params.startTime - ISO 8601 start time (UTC)
 * @param {string} params.endTime - ISO 8601 end time (UTC)
 * @param {string} params.timezone - Display timezone for both emails
 * @param {string} [params.location] - Meeting location or link
 * @param {string} params.bookingId - Supabase booking UUID (for cancellation link)
 * @returns {Promise<void>}
 */
export async function sendBookingConfirmation({
  hostEmail,
  guestEmail,
  guestName,
  hostName,
  eventTitle,
  startTime,
  endTime,
  timezone,
  location,
  bookingId,
}) {
  const formattedStart = formatEmailDateTime(startTime, timezone);
  const appUrl = process.env.NEXTAUTH_URL || 'https://schedulr.app';

  // Google Calendar add link
  const gcalStart = startTime.replace(/[-:]/g, '').replace('.000Z', 'Z');
  const gcalEnd = endTime.replace(/[-:]/g, '').replace('.000Z', 'Z');
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(`Scheduled via Schedulr\nLocation: ${location || 'TBD'}`)}&location=${encodeURIComponent(location || '')}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Booking Confirmed — Schedulr</title>
    </head>
    <body style="margin:0;padding:0;background:#f8f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.1);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366F1,#EC4899);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Schedulr</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Smart Scheduling, Simplified</p>
        </div>
        <!-- Confirmation Badge -->
        <div style="background:#f0fdf4;padding:20px 40px;text-align:center;border-bottom:1px solid #dcfce7;">
          <div style="font-size:32px;margin-bottom:8px;">✅</div>
          <h2 style="margin:0;color:#15803d;font-size:20px;font-weight:600;">Booking Confirmed!</h2>
        </div>
        <!-- Details -->
        <div style="padding:32px 40px;">
          <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi <strong>${guestName}</strong>, your meeting with <strong>${hostName}</strong> has been confirmed.</p>
          <div style="background:#f8f9ff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <div style="margin-bottom:16px;">
              <p style="margin:0;color:#6b6f8a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">EVENT</p>
              <p style="margin:4px 0 0;color:#111;font-size:16px;font-weight:600;">${eventTitle}</p>
            </div>
            <div style="margin-bottom:16px;">
              <p style="margin:0;color:#6b6f8a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">DATE & TIME</p>
              <p style="margin:4px 0 0;color:#111;font-size:15px;">${formattedStart}</p>
            </div>
            ${location ? `<div style="margin-bottom:16px;">
              <p style="margin:0;color:#6b6f8a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">LOCATION</p>
              <p style="margin:4px 0 0;color:#111;font-size:15px;">${location}</p>
            </div>` : ''}
          </div>
          <!-- CTA Buttons -->
          <div style="margin-top:24px;text-align:center;">
            <a href="${gcalLink}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;margin:6px;">Add to Google Calendar</a>
            <a href="${appUrl}/cancel/${bookingId}" style="display:inline-block;padding:12px 24px;background:#fff;color:#6366F1;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;margin:6px;border:2px solid #6366F1;">Cancel Booking</a>
          </div>
        </div>
        <!-- Footer -->
        <div style="padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Powered by <strong>Schedulr</strong> · <a href="${appUrl}" style="color:#6366F1;text-decoration:none;">schedulr.app</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to guest
  await resend.emails.send({
    from: FROM_EMAIL,
    to: guestEmail,
    subject: `✅ Confirmed: ${eventTitle} with ${hostName}`,
    html: emailHtml,
  });

  // Send notification to host
  await resend.emails.send({
    from: FROM_EMAIL,
    to: hostEmail,
    subject: `New booking: ${guestName} booked "${eventTitle}"`,
    html: emailHtml.replace(
      `Hi <strong>${guestName}</strong>`,
      `Hi <strong>${hostName}</strong>, <strong>${guestName}</strong> has booked a meeting with you`
    ),
  });
}

/**
 * Sends a cancellation notification email to the guest.
 * @param {Object} params - Email parameters
 * @param {string} params.guestEmail - Guest's email address
 * @param {string} params.guestName - Guest's full name
 * @param {string} params.eventTitle - Name of the cancelled event
 * @param {string} params.startTime - ISO 8601 start time (UTC)
 * @param {string} [params.timezone='UTC'] - Display timezone
 * @returns {Promise<void>}
 */
export async function sendCancellationEmail({
  guestEmail,
  guestName,
  eventTitle,
  startTime,
  timezone = 'UTC',
}) {
  const formattedStart = formatEmailDateTime(startTime, timezone);
  const appUrl = process.env.NEXTAUTH_URL || 'https://schedulr.app';

  await resend.emails.send({
    from: FROM_EMAIL,
    to: guestEmail,
    subject: `Cancelled: ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366F1,#EC4899);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">Schedulr</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="color:#ef4444;margin:0 0 16px;">Booking Cancelled</h2>
            <p style="color:#374151;font-size:16px;">Hi <strong>${guestName}</strong>,</p>
            <p style="color:#374151;font-size:16px;">Your booking for <strong>${eventTitle}</strong> scheduled on <strong>${formattedStart}</strong> has been cancelled.</p>
            <p style="color:#374151;font-size:16px;">If you'd like to schedule a new time, please visit <a href="${appUrl}" style="color:#6366F1;">${appUrl}</a>.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Sends a 24-hour reminder email to the guest.
 */
export async function sendBookingReminder({ guestEmail, guestName, hostName, eventTitle, startTime, timezone = 'UTC', location }) {
  const formattedStart = formatEmailDateTime(startTime, timezone);
  const appUrl = process.env.NEXTAUTH_URL || 'https://schedulr.app';
  await resend.emails.send({
    from: FROM_EMAIL,
    to: guestEmail,
    subject: `? Reminder: ${eventTitle} is tomorrow`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8f9ff;font-family:sans-serif;"><div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#6366F1,#EC4899);padding:32px 40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">Schedulr</h1></div><div style="padding:40px;"><h2 style="color:#6366F1;margin:0 0 16px;">? Meeting Reminder</h2><p style="color:#374151;">Hi <strong>${guestName}</strong>, your meeting <strong>${eventTitle}</strong> with <strong>${hostName}</strong> is tomorrow at ${formattedStart}.</p>${location ? `<p style="color:#374151;">?? ${location}</p>` : ''}</div></div></body></html>`,
  });
}
