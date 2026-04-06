/**
 * @fileoverview Single Event Type API — GET, PUT, DELETE
 * GET /api/event-types/[id]
 * PUT /api/event-types/[id] — update (owner only)
 * DELETE /api/event-types/[id] — soft delete (set is_active = false)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/event-types/[id]
 * Returns a single event type by ID.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data: eventType, error } = await supabaseAdmin
      .from('event_types')
      .select('*, users(name, username, avatar_url, timezone)')
      .eq('id', id)
      .single();

    if (error || !eventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    return NextResponse.json({ eventType });
  } catch (error) {
    console.error('GET /api/event-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch event type' }, { status: 500 });
  }
}

/**
 * PUT /api/event-types/[id]
 * Updates an event type. Only the owning user can update.
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('event_types')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      description,
      duration,
      color,
      location,
      is_active,
      buffer_before,
      buffer_after,
      max_bookings_per_day,
      questions,
    } = body;

    const { data: updated, error } = await supabaseAdmin
      .from('event_types')
      .update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(color !== undefined && { color }),
        ...(location !== undefined && { location }),
        ...(is_active !== undefined && { is_active }),
        ...(buffer_before !== undefined && { buffer_before: parseInt(buffer_before) }),
        ...(buffer_after !== undefined && { buffer_after: parseInt(buffer_after) }),
        ...(max_bookings_per_day !== undefined && {
          max_bookings_per_day: max_bookings_per_day ? parseInt(max_bookings_per_day) : null,
        }),
        ...(questions !== undefined && { questions }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ eventType: updated });
  } catch (error) {
    console.error('PUT /api/event-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update event type' }, { status: 500 });
  }
}

/**
 * DELETE /api/event-types/[id]
 * Soft-deletes an event type by setting is_active = false.
 * Only the owning user can delete.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('event_types')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('event_types')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Event type deleted' });
  } catch (error) {
    console.error('DELETE /api/event-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete event type' }, { status: 500 });
  }
}
