'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Copy, ExternalLink, ToggleLeft, ToggleRight, Edit, Trash2, Clock, MapPin, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

function EventTypeCard({ eventType, username, onToggle, onDelete }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${username || ''}/${eventType.slug}`);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-5 card-hover flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: eventType.color }} />
          <div>
            <h3 className="font-semibold text-[#F0F0FF]">{eventType.title}</h3>
            {eventType.description && (
              <p className="text-xs text-[#8888AA] mt-0.5 line-clamp-2">{eventType.description}</p>
            )}
          </div>
        </div>
        <Badge variant={eventType.is_active ? 'success' : 'default'}>
          {eventType.is_active ? 'Active' : 'Off'}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#8888AA]">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {eventType.duration} min
        </span>
        {eventType.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {eventType.location}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[#2E2E50]">
        <button onClick={copyLink} className="flex items-center gap-1.5 text-xs text-[#8888AA] hover:text-[#F0F0FF] transition-colors" title="Copy link">
          <Copy className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a
          href={`/${username}/${eventType.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#8888AA] hover:text-[#F0F0FF] transition-colors ml-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview
        </a>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onToggle(eventType)} className="p-1.5 rounded-lg hover:bg-[#252540] text-[#8888AA] hover:text-[#F0F0FF] transition-colors" title="Toggle">
            {eventType.is_active ? <ToggleRight className="w-4 h-4 text-[#10B981]" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <Link href={`/event-types/${eventType.id}/edit`} className="p-1.5 rounded-lg hover:bg-[#252540] text-[#8888AA] hover:text-[#F0F0FF] transition-colors" title="Edit">
            <Edit className="w-4 h-4" />
          </Link>
          <button onClick={() => onDelete(eventType.id)} className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#8888AA] hover:text-[#EF4444] transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventTypesPage() {
  const { data: session } = useSession();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEventTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/event-types');
      const data = await res.json();
      setEventTypes(data.eventTypes || []);
    } catch {
      toast.error('Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEventTypes(); }, []);

  const handleToggle = async (et) => {
    try {
      const res = await fetch(`/api/event-types/${et.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !et.is_active }),
      });
      if (res.ok) {
        setEventTypes(prev => prev.map(e => e.id === et.id ? { ...e, is_active: !e.is_active } : e));
        toast.success(`Event type ${!et.is_active ? 'activated' : 'deactivated'}`);
      }
    } catch {
      toast.error('Failed to update event type');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event type? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/event-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEventTypes(prev => prev.filter(e => e.id !== id));
        toast.success('Event type deleted');
      }
    } catch {
      toast.error('Failed to delete event type');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Syne']">Event Types</h1>
          <p className="text-[#8888AA] text-sm mt-1">Create and manage your bookable event types</p>
        </div>
        <Link href="/event-types/new">
          <Button><Plus className="w-4 h-4" /> New Event Type</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : eventTypes.length === 0 ? (
        <div className="text-center py-20 bg-[#1A1A2E] border border-[#2E2E50] border-dashed rounded-2xl">
          <CalendarDays className="w-12 h-12 text-[#2E2E50] mx-auto mb-4" />
          <h3 className="font-semibold text-[#F0F0FF] mb-2">No event types yet</h3>
          <p className="text-[#8888AA] text-sm mb-6">Create your first event type to start accepting bookings</p>
          <Link href="/event-types/new">
            <Button><Plus className="w-4 h-4" /> Create Event Type</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventTypes.map(et => (
            <EventTypeCard key={et.id} eventType={et} username={session?.user?.username} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
