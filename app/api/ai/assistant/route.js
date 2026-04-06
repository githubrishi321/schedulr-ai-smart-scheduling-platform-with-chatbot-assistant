/**
 * @fileoverview AI Assistant API
 * POST /api/ai/assistant — calls Groq LLaMA with user context and message
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getAISchedulingResponse } from '@/lib/groq';

/**
 * POST /api/ai/assistant
 * Handles AI chat messages from the dashboard.
 * Loads user's upcoming bookings and event types as context for the AI.
 *
 * Request body:
 * - message: string — user's current message
 * - conversationHistory: Array — previous messages in this session
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch user's upcoming bookings as AI context
    const now = new Date().toISOString();
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*, event_types(title)')
      .eq('host_id', session.user.id)
      .eq('status', 'confirmed')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(10);

    // Fetch user's event types as AI context
    const { data: eventTypes } = await supabaseAdmin
      .from('event_types')
      .select('title, duration, slug, is_active')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    // Map bookings to include event type title for context
    const bookingsWithTitle = (bookings || []).map(b => ({
      ...b,
      event_type_title: b.event_types?.title,
    }));

    const aiResponse = await getAISchedulingResponse(
      message,
      {
        bookings: bookingsWithTitle,
        eventTypes: eventTypes || [],
      },
      conversationHistory
    );

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('POST /api/ai/assistant error:', error);
    return NextResponse.json(
      { error: 'AI assistant failed to respond. Please try again.' },
      { status: 500 }
    );
  }
}
