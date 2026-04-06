'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatTime } from '@/lib/utils';
import { Calendar, Search, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['upcoming', 'past', 'cancelled'];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const now = new Date();
  const filtered = bookings.filter(b => {
    const start = new Date(b.start_time);
    const matchesTab =
      activeTab === 'upcoming' ? start >= now && b.status === 'confirmed' :
      activeTab === 'past' ? start < now && b.status !== 'cancelled' :
      b.status === 'cancelled';
    const matchesSearch = !search ||
      b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) {
        toast.success('Booking cancelled');
        fetchBookings();
      }
    } catch { toast.error('Failed to cancel'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-['Syne']">Bookings</h1>
        <p className="text-[#8888AA] text-sm mt-1">Manage all your scheduled meetings</p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-[#1A1A2E] border border-[#2E2E50] rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-[#6366F1] text-white' : 'text-[#8888AA] hover:text-[#F0F0FF]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="w-full pl-9 pr-4 py-2 bg-[#1A1A2E] border border-[#2E2E50] rounded-xl text-sm text-[#F0F0FF] placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888AA] hover:text-[#F0F0FF]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E2E50]">
                {['Guest', 'Event', 'Date & Time', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Calendar className="w-10 h-10 text-[#2E2E50] mx-auto mb-3" />
                    <p className="text-[#8888AA] text-sm">No {activeTab} bookings found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(booking => (
                  <tr key={booking.id} className="border-b border-[#2E2E50] hover:bg-[#252540]/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{booking.guest_name}</p>
                      <p className="text-xs text-[#8888AA]">{booking.guest_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: booking.event_types?.color || '#6366F1' }} />
                        <span className="text-sm">{booking.event_types?.title || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{formatDate(booking.start_time, 'UTC')}</p>
                      <p className="text-xs text-[#8888AA] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(booking.start_time, 'UTC')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      {booking.status === 'confirmed' && (
                        <Button variant="danger" size="sm" onClick={() => handleCancel(booking.id)}>
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
