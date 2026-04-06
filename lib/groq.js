/**
 * @fileoverview Groq AI client configuration and scheduling assistant
 * Uses LLaMA 3.3 70B for intelligent scheduling assistance
 */

import Groq from 'groq-sdk';

/** Initialized Groq SDK client */
export const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Calls the Groq LLaMA 3.3 70B model with the user's message and conversation context.
 * The AI assistant is aware of the user's upcoming bookings and event types.
 *
 * @param {string} userMessage - The user's message to the AI
 * @param {Object} context - Context object with bookings and event types
 * @param {Array} context.bookings - User's upcoming bookings
 * @param {Array} context.eventTypes - User's event type configurations
 * @param {Array} [conversationHistory=[]] - Previous messages in this chat session
 * @returns {Promise<string>} AI assistant response text
 */
export async function getAISchedulingResponse(userMessage, context, conversationHistory = []) {
  const { bookings = [], eventTypes = [] } = context;

  // Build a rich context string for the system prompt
  const bookingsContext = bookings.length > 0
    ? bookings.map(b =>
        `- ${b.guest_name} (${b.guest_email}): "${b.event_type_title || 'Meeting'}" on ${
          new Date(b.start_time).toLocaleString()
        }`
      ).join('\n')
    : 'No upcoming bookings.';

  const eventTypesContext = eventTypes.length > 0
    ? eventTypes.map(e =>
        `- "${e.title}" (${e.duration} min, slug: ${e.slug}, ${e.is_active ? 'active' : 'inactive'})`
      ).join('\n')
    : 'No event types configured.';

  const systemPrompt = `You are Schedulr AI — an intelligent scheduling assistant built into the Schedulr platform (a Calendly-like tool).

Your capabilities:
- Help users understand their current bookings and availability
- Suggest the best meeting times based on patterns
- Help users manage and reschedule bookings
- Answer questions about Schedulr features (event types, availability rules, Google Calendar sync)
- Provide scheduling tips and best practices
- Draft professional meeting invitation messages

Current user context:
📅 Upcoming Bookings:
${bookingsContext}

🗓️ Event Types:
${eventTypesContext}

Communication style:
- Be concise, friendly, and professional
- Use emojis sparingly but effectively
- Format responses clearly with bullet points when listing items
- If asked about something outside scheduling, gently redirect to scheduling topics
- Always assume times are in the user's configured timezone unless specified otherwise`;

  // Build message array with conversation history
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context window
    { role: 'user', content: userMessage },
  ];

  try {
    const chatCompletion = await groqClient.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('AI assistant is temporarily unavailable. Please try again shortly.');
  }
}
