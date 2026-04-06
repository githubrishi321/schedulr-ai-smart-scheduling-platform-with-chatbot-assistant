/**
 * @fileoverview Google Calendar API helper functions
 * All functions use the googleapis npm package
 */

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar client using stored OAuth tokens.
 * @param {string} accessToken - User's Google access token
 * @param {string} refreshToken - User's Google refresh token
 * @returns {import('googleapis').calendar_v3.Calendar} Authenticated calendar client
 */
export function getCalendarClient(accessToken, refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Retrieves busy time slots from the user's primary Google Calendar.
 * @param {import('googleapis').calendar_v3.Calendar} client - Authenticated calendar client
 * @param {string} timeMin - ISO start time string
 * @param {string} timeMax - ISO end time string
 * @returns {Promise<Array<{start: string, end: string}>>} Array of busy time periods
 */
export async function getCalendarEvents(client, timeMin, timeMax) {
  try {
    const response = await client.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      },
    });

    return response.data.calendars?.primary?.busy || [];
  } catch (error) {
    console.error('Error fetching Google Calendar busy slots:', error);
    return [];
  }
}

/**
 * Creates a new event on the user's primary Google Calendar.
 * @param {import('googleapis').calendar_v3.Calendar} client - Authenticated calendar client
 * @param {Object} eventDetails - Event details object
 * @param {string} eventDetails.title - Event title
 * @param {string} eventDetails.startTime - ISO start time string
 * @param {string} eventDetails.endTime - ISO end time string
 * @param {string} eventDetails.guestEmail - Guest's email address
 * @param {string} eventDetails.guestName - Guest's full name
 * @param {string} [eventDetails.location] - Meeting location or link
 * @param {string} [eventDetails.description] - Event description
 * @returns {Promise<string|null>} Google Calendar event ID or null on failure
 */
export async function createCalendarEvent(client, {
  title,
  startTime,
  endTime,
  guestEmail,
  guestName,
  location,
  description,
}) {
  try {
    const event = await client.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description: description || `Scheduled via Schedulr`,
        location: location || '',
        start: { dateTime: startTime, timeZone: 'UTC' },
        end: { dateTime: endTime, timeZone: 'UTC' },
        attendees: [{ email: guestEmail, displayName: guestName }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      },
      sendUpdates: 'all',
    });

    return event.data.id || null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

/**
 * Deletes an event from the user's primary Google Calendar.
 * @param {import('googleapis').calendar_v3.Calendar} client - Authenticated calendar client
 * @param {string} eventId - Google Calendar event ID to delete
 * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
 */
export async function deleteCalendarEvent(client, eventId) {
  try {
    await client.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}
