# Schedulr — Smart Scheduling Platform

A full-stack, production-ready scheduling platform (Calendly clone) built with Next.js 14, Supabase, NextAuth.js v5, Google Calendar API, Groq AI, and Resend email.

## Features

- **Authentication**: Google OAuth + Email/Password (bcrypt) via NextAuth.js v5
- **Event Types**: Create unlimited bookable event types with custom durations, colors, locations, and questions
- **Public Booking Pages**: Beautiful 3-step booking flow (Calendar ? Time Slots ? Guest Details)
- **Smart Availability**: Weekly schedule editor with day toggles and time range pickers
- **Google Calendar Sync**: Read busy times, create/delete calendar events on booking
- **Timezone Support**: Auto-detect guest timezone, display slots in local time, store UTC
- **Email Confirmations**: HTML booking confirmation emails via Resend to host and guest
- **AI Assistant**: Groq LLaMA 3.3 70B floating chat widget for schedule management
- **Bookings Dashboard**: Filter by upcoming/past/cancelled, cancel with one click
- **24-Hour Reminders**: Vercel Cron job sends reminder emails before meetings
- **Mobile Responsive**: Works at 375px, 768px, and 1280px breakpoints

## Tech Stack Justification

| Technology | Why |
|---|---|
| **Next.js 14 App Router** | SSR, file-based routing, API routes in one codebase, Vercel-optimised. Server Components reduce client JS bundle. |
| **Supabase (PostgreSQL)** | Managed PostgreSQL with Row Level Security, real-time subscriptions, built-in auth SDK, free tier for development. |
| **NextAuth.js v5** | Battle-tested auth library — supports Google OAuth + credentials, built-in CSRF protection, JWT session management. |
| **date-fns-tz** | Lightweight (tree-shakeable), immutable, modern timezone handling. Safer than moment.js which is 67KB+ and deprecated. |
| **Tailwind CSS v4** | Utility-first, zero CSS file bloat, mobile-first responsive design, dark mode via class strategy. |
| **Resend** | Developer-friendly email API, excellent deliverability, React email template support, generous free tier. |
| **Groq API (LLaMA 3.3 70B)** | 100% FREE — no credit card required. Fastest LLM inference available. OpenAI-compatible API format. LLaMA 3.3 70B delivers excellent reasoning for scheduling tasks. Easy to swap models in future. |

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/schedulr.git
cd schedulr

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# 4. Run Supabase SQL
# Copy supabase/schema.sql and paste into your Supabase SQL Editor ? Run

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random secret for JWT signing (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 in dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL from Settings ? API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side admin use only) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `GROQ_API_KEY` | **FREE** from [console.groq.com](https://console.groq.com) — no credit card! |
| `RESEND_API_KEY` | Resend transactional email API key |
| `FROM_EMAIL` | Sender email address (must be verified in Resend) |
| `CRON_SECRET` | Random secret to authenticate cron job requests |

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Paste the contents of `supabase/schema.sql`
4. Click **Run**

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project ? Enable **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application)
4. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

## Groq API Setup (FREE)

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up with GitHub or Google (no credit card needed)
3. Create an API key
4. Add to `.env.local` as `GROQ_API_KEY`

## AI Assistant — How It Works

The AI chatbot in the dashboard is powered by **Groq API** using the `llama-3.3-70b-versatile` model.

**What it can do:**
- Answer questions: "What meetings do I have tomorrow?"
- Suggest meeting times based on your availability
- Generate event type descriptions
- Parse natural language availability rules

**How it works:**
1. User types a message in the floating chat widget
2. Frontend sends `POST /api/ai/assistant` with the message + conversation history
3. Backend loads user's upcoming bookings + event types as context
4. Groq API is called with a structured system prompt including the context
5. Response is returned and displayed in the chat

## Security

- All dashboard routes protected by NextAuth session middleware
- API routes validate session before processing requests
- Passwords hashed with bcrypt (10 rounds)
- All inputs validated with Zod schemas
- HTTP security headers configured in `next.config.mjs`
- Supabase Row Level Security enabled on all tables
- Service role key only used server-side (never exposed to client)

## Deployment to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Import repository in Vercel dashboard
# vercel.com ? New Project ? Import Git Repository

# 3. Add all environment variables in Vercel dashboard
# Settings ? Environment Variables

# 4. Deploy!
```

Cron jobs are automatically configured via `vercel.json` (requires Vercel Pro for sub-hourly schedules).

## Architecture

```
app/
+-- (auth)/          ? Login, Register pages
+-- (dashboard)/     ? Protected host-facing pages
+-- [username]/      ? Public booking profile + booking flow
+-- api/             ? All API routes

lib/                 ? Business logic (auth, calendar, availability, email, AI)
components/          ? Reusable React components
supabase/            ? Database schema SQL
```

## Assumptions

1. Google Calendar OAuth must be set up by the user in Google Cloud Console
2. Cron reminders require Vercel Pro for sub-hourly (default: hourly)
3. Email delivery requires a verified sender domain in Resend
4. Platform assumes 1:1 meetings (not group bookings)
5. Groq free tier has rate limits; upgrade for high-traffic production use

## Known Limitations & Future Improvements

- [ ] Outlook Calendar integration (Microsoft Graph API)
- [ ] Group bookings / round-robin scheduling
- [ ] Recurring event types
- [ ] Custom cancellation/reschedule pages
- [ ] SMS reminders via Twilio
- [ ] Team workspace with multiple hosts
- [ ] Booking analytics and reporting
- [ ] Custom domains for booking pages

## Development Notes

**LLM used:** Groq API (free tier) with `llama-3.3-70b-versatile` model — chosen because it is completely free, requires no credit card, delivers the fastest inference speeds of any LLM API, and uses an OpenAI-compatible format making integration trivial.

**Key decisions:**
1. Supabase over raw PostgreSQL — managed service with free tier, excellent DX, built-in auth
2. NextAuth v5 (beta) — latest version with App Router support, stable enough for production
3. All times stored as UTC, displayed using date-fns-tz — eliminates DST edge cases
4. Service role key only on server — anon key safe to expose to browser via NEXT_PUBLIC_
