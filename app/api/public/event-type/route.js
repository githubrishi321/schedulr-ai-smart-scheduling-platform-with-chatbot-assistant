/**
 * @fileoverview Public API — fetch event type and host info by username + slug
 * GET /api/public/event-type?username=&slug=
 * Used by the public booking page — no auth required.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const slug = searchParams.get('slug');

    if (!username || !slug) {
      return NextResponse.json({ error: 'username and slug are required' }, { status: 400 });
    }

    // Get host user by username
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, username, avatar_url, timezone')
      .eq('username', username)
      .single();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get event type by user_id + slug
    const { data: eventType } = await supabaseAdmin
      .from('event_types')
      .select('*')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!eventType) return NextResponse.json({ error: 'Event type not found' }, { status: 404 });

    return NextResponse.json({ user, eventType });
  } catch (error) {
    console.error('GET /api/public/event-type error:', error);
    return NextResponse.json({ error: 'Failed to fetch event type' }, { status: 500 });
  }
}
