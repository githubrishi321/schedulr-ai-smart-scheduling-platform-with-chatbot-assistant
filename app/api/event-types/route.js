/**
 * @fileoverview Event Types API — GET all & POST create
 * GET /api/event-types — fetch all for authenticated user
 * POST /api/event-types — create new event type with auto-generated slug
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';

/**
 * GET /api/event-types
 * Returns all event types belonging to the authenticated user.
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: eventTypes, error } = await supabaseAdmin
      .from('event_types')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ eventTypes });
  } catch (error) {
    console.error('GET /api/event-types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/event-types
 * Creates a new event type for the authenticated user.
 * Auto-generates a unique slug from the title.
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      duration,
      color,
      location,
      buffer_before,
      buffer_after,
      max_bookings_per_day,
      questions,
    } = body;

    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Title and duration are required' },
        { status: 400 }
      );
    }

    // Auto-generate slug and ensure uniqueness
    let slug = generateSlug(title);
    const { data: existingSlugs } = await supabaseAdmin
      .from('event_types')
      .select('slug')
      .eq('user_id', session.user.id)
      .like('slug', `${slug}%`);

    if (existingSlugs && existingSlugs.length > 0) {
      slug = `${slug}-${existingSlugs.length + 1}`;
    }

    const { data: eventType, error } = await supabaseAdmin
      .from('event_types')
      .insert({
        user_id: session.user.id,
        title,
        slug,
        description: description || null,
        duration: parseInt(duration),
        color: color || '#6366F1',
        location: location || null,
        buffer_before: parseInt(buffer_before) || 0,
        buffer_after: parseInt(buffer_after) || 0,
        max_bookings_per_day: max_bookings_per_day ? parseInt(max_bookings_per_day) : null,
        questions: questions || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ eventType }, { status: 201 });
  } catch (error) {
    console.error('POST /api/event-types error:', error);
    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 500 }
    );
  }
}
