-- ============================================================
-- Schedulr Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Users table (extends NextAuth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Types
CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  color TEXT DEFAULT '#6366F1',
  is_active BOOLEAN DEFAULT TRUE,
  location TEXT,
  buffer_before INTEGER DEFAULT 0,
  buffer_after INTEGER DEFAULT 0,
  max_bookings_per_day INTEGER,
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Availability Rules
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sun, 1=Mon...6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id UUID REFERENCES event_types(id) ON DELETE CASCADE,
  host_id UUID REFERENCES users(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_timezone TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, rescheduled
  notes TEXT,
  answers JSONB DEFAULT '{}',
  google_event_id TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked Times (manual blocks / time off)
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT
);

-- ============================================================
-- Default Availability Trigger (Mon-Fri 9AM-5PM)
-- ============================================================
CREATE OR REPLACE FUNCTION create_default_availability()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO availability (user_id, day_of_week, start_time, end_time)
  VALUES
    (NEW.id, 1, '09:00', '17:00'),
    (NEW.id, 2, '09:00', '17:00'),
    (NEW.id, 3, '09:00', '17:00'),
    (NEW.id, 4, '09:00', '17:00'),
    (NEW.id, 5, '09:00', '17:00');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_default_availability();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, only owner can update
CREATE POLICY "Public users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Event types: active ones are public, owner manages all
CREATE POLICY "Active event types are public" ON event_types FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own event types" ON event_types USING (auth.uid()::text = user_id::text);

-- Availability: public read for booking page
CREATE POLICY "Availability is public" ON availability FOR SELECT USING (true);
CREATE POLICY "Users manage own availability" ON availability USING (auth.uid()::text = user_id::text);

-- Bookings: host and guest can view
CREATE POLICY "Hosts view own bookings" ON bookings FOR SELECT USING (auth.uid()::text = host_id::text);
CREATE POLICY "Public can insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Hosts can update own bookings" ON bookings FOR UPDATE USING (auth.uid()::text = host_id::text);

-- Add reminder_sent column (run separately if table already exists)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
