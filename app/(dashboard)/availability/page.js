'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONES = [
  'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney',
  'Pacific/Auckland', 'America/Toronto', 'America/Vancouver',
];

const DEFAULT_RULES = DAYS.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '17:00',
  is_active: i >= 1 && i <= 5,
}));

export default function AvailabilityPage() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/availability');
        const data = await res.json();
        if (data.availability && data.availability.length > 0) {
          const newRules = DEFAULT_RULES.map(defaultRule => {
            const found = data.availability.find(r => r.day_of_week === defaultRule.day_of_week);
            return found ? { ...found } : defaultRule;
          });
          setRules(newRules);
        }
      } catch {
        toast.error('Failed to load availability');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleDay = (dayIndex) => {
    setRules(prev => prev.map(r => r.day_of_week === dayIndex ? { ...r, is_active: !r.is_active } : r));
  };

  const updateTime = (dayIndex, field, value) => {
    setRules(prev => prev.map(r => r.day_of_week === dayIndex ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Availability saved!');
    } catch {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Syne']">Availability</h1>
          <p className="text-[#8888AA] text-sm mt-1">Set your weekly working hours</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Save
        </Button>
      </div>

      {/* Timezone */}
      <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-5">
        <label className="block text-sm font-medium text-[#8888AA] mb-2">Your Timezone</label>
        <select
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
          className="w-full bg-[#0F0F1A] border border-[#2E2E50] rounded-xl px-4 py-2.5 text-sm text-[#F0F0FF] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz} className="bg-[#0F0F1A]">{tz}</option>
          ))}
        </select>
      </div>

      {/* Weekly schedule */}
      <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl divide-y divide-[#2E2E50]">
        {rules.map((rule) => (
          <div key={rule.day_of_week} className={`flex items-center gap-4 p-4 transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}>
            {/* Toggle */}
            <button
              onClick={() => toggleDay(rule.day_of_week)}
              className={`w-11 h-6 rounded-full relative transition-colors ${rule.is_active ? 'bg-[#6366F1]' : 'bg-[#2E2E50]'}`}
              aria-label={`Toggle ${DAYS[rule.day_of_week]}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${rule.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>

            {/* Day name */}
            <span className="w-24 text-sm font-medium">{DAYS[rule.day_of_week]}</span>

            {/* Time pickers */}
            {rule.is_active ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={rule.start_time}
                  onChange={e => updateTime(rule.day_of_week, 'start_time', e.target.value)}
                  className="bg-[#0F0F1A] border border-[#2E2E50] rounded-lg px-3 py-1.5 text-sm text-[#F0F0FF] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                />
                <span className="text-[#8888AA] text-sm">to</span>
                <input
                  type="time"
                  value={rule.end_time}
                  onChange={e => updateTime(rule.day_of_week, 'end_time', e.target.value)}
                  className="bg-[#0F0F1A] border border-[#2E2E50] rounded-lg px-3 py-1.5 text-sm text-[#F0F0FF] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                />
              </div>
            ) : (
              <span className="text-sm text-[#8888AA] flex-1">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
