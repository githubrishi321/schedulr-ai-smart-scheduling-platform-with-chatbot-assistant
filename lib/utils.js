/**
 * @fileoverview Utility helper functions for Schedulr
 * Includes class merging, date formatting, slug generation, and string helpers
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Merges Tailwind CSS class names, resolving conflicts correctly.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 * @param {...(string|undefined|null|false|Record<string,boolean>)} classes - Class values to merge
 * @returns {string} Merged class string
 */
export function cn(...classes) {
  return twMerge(clsx(...classes));
}

/**
 * Formats a date-time value as a time string in the specified timezone.
 * @param {string|Date} date - ISO string or Date object
 * @param {string} timezone - IANA timezone (e.g., "America/New_York")
 * @returns {string} Formatted time string (e.g., "3:30 PM")
 */
export function formatTime(date, timezone) {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(d, timezone, 'h:mm a');
  } catch {
    return String(date);
  }
}

/**
 * Formats a date-time value as a readable date string in the specified timezone.
 * @param {string|Date} date - ISO string or Date object
 * @param {string} timezone - IANA timezone (e.g., "Europe/London")
 * @returns {string} Formatted date string (e.g., "Monday, March 30, 2026")
 */
export function formatDate(date, timezone) {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(d, timezone, 'EEEE, MMMM d, yyyy');
  } catch {
    return String(date);
  }
}

/**
 * Generates a URL-safe slug from a text string.
 * Removes special characters, replaces spaces with hyphens, lowercases.
 * @param {string} text - Input text (e.g., "30 Minute Coffee Chat!")
 * @returns {string} URL-safe slug (e.g., "30-minute-coffee-chat")
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts initials from a full name string.
 * Returns up to 2 characters (first + last name initials).
 * @param {string} name - Full name (e.g., "John Doe")
 * @returns {string} Initials (e.g., "JD")
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a pluralized string based on count.
 * @param {number} count - The count to check
 * @param {string} singular - Singular form of the word
 * @param {string} [plural] - Plural form (defaults to singular + "s")
 * @returns {string} e.g., "1 booking" or "5 bookings"
 */
export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : (plural || singular + 's')}`;
}

/**
 * Safely truncates a string to a given max length with ellipsis.
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
}

/**
 * Returns the greeting based on current hour.
 * @returns {string} "Good morning" | "Good afternoon" | "Good evening"
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
