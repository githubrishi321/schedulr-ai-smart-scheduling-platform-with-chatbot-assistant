/**
 * @fileoverview NextAuth route handler
 * Delegates to handlers exported from lib/auth.js
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
