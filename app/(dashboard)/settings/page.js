'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, Globe, Bell, Trash2 } from 'lucide-react';

const TIMEZONES = [
  'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Singapore', 'Australia/Sydney',
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: '', username: '', timezone: 'Asia/Kolkata', bio: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || '',
        username: session.user.username || '',
        timezone: 'Asia/Kolkata',
        bio: '',
      });
      setLoading(false);
    }
  }, [session]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Syne']">Settings</h1>
        <p className="text-[#8888AA] text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <form onSubmit={handleSave} className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-5 h-5 text-[#6366F1]" />
          <h2 className="font-semibold font-['Syne']">Profile</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-xl font-bold text-white">
            {session?.user?.image
              ? <img src={session.user.image} alt="" className="w-full h-full rounded-2xl object-cover" loading="lazy" />
              : getInitials(form.name)
            }
          </div>
          <div>
            <p className="text-sm font-medium">{session?.user?.email}</p>
            <p className="text-xs text-[#8888AA]">Avatar from {session?.user?.image ? 'Google' : 'initials'}</p>
          </div>
        </div>

        <Input label="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
        <Input label="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))} hint={`Your booking page: schedulr.app/${form.username}`} />
        <Textarea label="Bio" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell guests a bit about yourself" rows={3} />

        <div>
          <label className="block text-sm font-medium text-[#8888AA] mb-1.5 flex items-center gap-1.5">
            <Globe className="w-4 h-4" /> Timezone
          </label>
          <select
            value={form.timezone}
            onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
            className="w-full bg-[#0F0F1A] border border-[#2E2E50] rounded-xl px-4 py-2.5 text-sm text-[#F0F0FF] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-[#0F0F1A]">{tz}</option>)}
          </select>
        </div>

        <Button type="submit" loading={saving}>Save Changes</Button>
      </form>

      {/* Danger Zone */}
      <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-[#EF4444]" />
          <h2 className="font-semibold text-[#EF4444] font-['Syne']">Danger Zone</h2>
        </div>
        <p className="text-sm text-[#8888AA] mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        <Button variant="danger" onClick={() => toast.error('Contact support to delete your account.')}>
          Delete Account
        </Button>
      </div>
    </div>
  );
}
