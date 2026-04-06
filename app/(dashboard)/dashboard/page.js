import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getGreeting, formatTime, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { StatsCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AIAssistant from '@/components/ai/AIAssistant';
import {
  CalendarDays, Users, TrendingUp, Clock,
  Plus, Copy, ExternalLink, ArrowRight
} from 'lucide-react';

export const metadata = { title: 'Dashboard' };

async function getDashboardData(userId) {
  const now = new Date().toISOString();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [bookingsRes, eventTypesRes, upcomingRes] = await Promise.all([
    supabaseAdmin.from('bookings').select('id, status, start_time').eq('host_id', userId),
    supabaseAdmin.from('event_types').select('id').eq('user_id', userId).eq('is_active', true),
    supabaseAdmin
      .from('bookings')
      .select('*, event_types(title, color, duration, location)')
      .eq('host_id', userId)
      .eq('status', 'confirmed')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(5),
  ]);

  const allBookings = bookingsRes.data || [];
  const thisWeek = allBookings.filter(b => {
    const t = new Date(b.start_time);
    return t >= weekStart && t <= weekEnd;
  });
  const today = allBookings.filter(b => {
    const t = new Date(b.start_time);
    const d = new Date();
    return t.toDateString() === d.toDateString() && b.status === 'confirmed';
  });
  const cancelled = allBookings.filter(b => b.status === 'cancelled');

  return {
    totalThisWeek: thisWeek.length,
    todayCount: today.length,
    cancelledCount: cancelled.length,
    eventTypeCount: (eventTypesRes.data || []).length,
    upcomingBookings: upcomingRes.data || [],
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData(session.user.id);
  const greeting = getGreeting();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Syne'] text-[#F0F0FF]">
            {greeting}, {session.user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[#8888AA] mt-1 text-sm">
            Here's what's happening with your schedule today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/event-types/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Event Type
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Meetings this week" value={data.totalThisWeek} icon={CalendarDays} color="#6366F1" />
        <StatsCard label="Today's meetings" value={data.todayCount} icon={Clock} color="#10B981" />
        <StatsCard label="Active event types" value={data.eventTypeCount} icon={Users} color="#EC4899" />
        <StatsCard label="Cancellations" value={data.cancelledCount} icon={TrendingUp} color="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2 bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-[#2E2E50]">
            <h2 className="font-semibold font-['Syne']">Upcoming Bookings</h2>
            <Link href="/bookings" className="text-xs text-[#6366F1] hover:text-[#EC4899] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#2E2E50]">
            {data.upcomingBookings.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays className="w-10 h-10 text-[#2E2E50] mx-auto mb-3" />
                <p className="text-[#8888AA] text-sm">No upcoming bookings</p>
                <Link href="/event-types" className="text-[#6366F1] text-sm hover:underline mt-1 inline-block">
                  Share your booking link →
                </Link>
              </div>
            ) : (
              data.upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 flex items-center gap-4">
                  <div
                    className="w-2 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: booking.event_types?.color || '#6366F1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{booking.guest_name}</p>
                    <p className="text-[#8888AA] text-xs truncate">
                      {booking.event_types?.title} · {formatDate(booking.start_time, session.user.timezone || 'UTC')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatTime(booking.start_time, session.user.timezone || 'UTC')}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-5">
          <h2 className="font-semibold font-['Syne'] mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/event-types/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#252540] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 flex items-center justify-center group-hover:bg-[#6366F1]/20 transition-colors">
                <Plus className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-sm font-medium">Create event type</p>
                <p className="text-xs text-[#8888AA]">Add a new booking option</p>
              </div>
            </Link>
            {session.user.username && (
              <a
                href={`/${session.user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#252540] transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EC4899]/10 flex items-center justify-center group-hover:bg-[#EC4899]/20 transition-colors">
                  <ExternalLink className="w-4 h-4 text-[#EC4899]" />
                </div>
                <div>
                  <p className="text-sm font-medium">View public profile</p>
                  <p className="text-xs text-[#8888AA]">See what guests see</p>
                </div>
              </a>
            )}
            <Link href="/availability" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#252540] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center group-hover:bg-[#10B981]/20 transition-colors">
                <Clock className="w-4 h-4 text-[#10B981]" />
              </div>
              <div>
                <p className="text-sm font-medium">Set availability</p>
                <p className="text-xs text-[#8888AA]">Update your working hours</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Assistant floating widget */}
      <AIAssistant />
    </div>
  );
}
