/**
 * @fileoverview Availability API — GET and PUT
 * GET /api/availability — fetch rules for authenticated user
 * PUT /api/availability — update all availability rules
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/availability
 * Returns all availability rules for the authenticated user.
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: availability, error } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('user_id', session.user.id)
      .order('day_of_week', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('GET /api/availability error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

/**
 * PUT /api/availability
 * Replaces all availability rules for the authenticated user.
 * Accepts an array of day rules: [{ day_of_week, start_time, end_time, is_active }]
 */
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Rules must be an array' },
        { status: 400 }
      );
    }

    // Delete all existing rules and re-insert
    const { error: deleteError } = await supabaseAdmin
      .from('availability')
      .delete()
      .eq('user_id', session.user.id);

    if (deleteError) throw deleteError;

    if (rules.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('availability')
        .insert(
          rules.map(rule => ({
            user_id: session.user.id,
            day_of_week: rule.day_of_week,
            start_time: rule.start_time,
            end_time: rule.end_time,
            is_active: rule.is_active !== false,
          }))
        );

      if (insertError) throw insertError;
    }

    // Fetch and return updated rules
    const { data: updated } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('user_id', session.user.id)
      .order('day_of_week', { ascending: true });

    return NextResponse.json({ availability: updated });
  } catch (error) {
    console.error('PUT /api/availability error:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
