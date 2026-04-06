'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ChevronLeft, ChevronRight, Clock, MapPin, Check, ArrowLeft } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

const STEP_LABELS = ['Pick a Date', 'Pick a Time', 'Your Details', 'Confirmed'];

function CalendarView({ selectedDate, onSelectDate, userId, eventTypeId, timezone }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState(new Set());
  const [checkingDates, setCheckingDates] = useState(false);

  useEffect(() => {
    const checkMonth = async () => {
      setCheckingDates(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end }).filter(d => !isBefore(d, startOfDay(new Date())));
      const available = new Set();
      await Promise.all(
        days.slice(0, 10).map(async (day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const res = await fetch(`/api/calendar/slots?userId=${userId}&eventTypeId=${eventTypeId}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`);
          const data = await res.json();
          if (data.slots?.length > 0) available.add(dateStr);
        })
      );
      setAvailableDates(available);
      setCheckingDates(false);
    };
    checkMonth();
  }, [currentMonth, userId, eventTypeId, timezone]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth));
  const today = startOfDay(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(m => addDays(startOfMonth(m), -1))} className="p-1.5 rounded-lg hover:bg-[#2E2E50] text-[#8888AA] hover:text-[#F0F0FF] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-[#F0F0FF]">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(m => addDays(endOfMonth(m), 1))} className="p-1.5 rounded-lg hover:bg-[#2E2E50] text-[#8888AA] hover:text-[#F0F0FF] transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-[#8888AA] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isPast = isBefore(day, today);
          const isAvail = availableDates.has(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={dateStr}
              disabled={isPast || (!isAvail && !checkingDates)}
              onClick={() => onSelectDate(day)}
              className={`
                w-full aspect-square rounded-xl text-sm transition-all flex items-center justify-center
                ${isSelected ? 'bg-[#6366F1] text-white font-bold' : ''}
                ${!isSelected && isAvail ? 'bg-[#2E2E50]/30 hover:bg-[#6366F1]/20 text-[#F0F0FF] cursor-pointer font-medium border border-transparent hover:border-[#6366F1]/40' : ''}
                ${!isSelected && isPast ? 'text-[#8888AA]/40 cursor-not-allowed opacity-50' : ''}
                ${!isSelected && !isAvail && !isPast ? 'text-[#8888AA]/60 cursor-not-allowed bg-[#1A1A2E]' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingPage() {
  const params = useParams();
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guestTimezone, setGuestTimezone] = useState('UTC');
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setGuestTimezone(tz);
  }, []);

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const res = await fetch(`/api/public/event-type?username=${params.username}&slug=${params.eventSlug}`);
        const data = await res.json();
        setEventType(data.eventType);
        setUser(data.user);
      } catch { } finally { setLoading(false); }
    };
    fetchEventType();
  }, [params]);

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/calendar/slots?userId=${user?.id}&eventTypeId=${eventType?.id}&date=${dateStr}&timezone=${encodeURIComponent(guestTimezone)}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setStep(1);
    } catch { } finally { setLoadingSlots(false); }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !form.name || !form.email) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          startTime: selectedSlot.startUTC,
          endTime: selectedSlot.endUTC,
          guestName: form.name,
          guestEmail: form.email,
          guestTimezone,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBooking(data);
      setStep(3);
    } catch (e) {
      alert(e.message || 'Booking failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading || !eventType) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] text-[#F0F0FF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#F0F0FF] animate-fade-in pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
        {/* Header styling adjusted to match dashboard */}
        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2E2E50] overflow-hidden mb-6 shadow-2xl">
          <div className="p-6 md:p-8 border-b border-[#2E2E50]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {getInitials(user?.name || '')}
              </div>
              <div>
                <p className="text-sm text-[#8888AA] mb-0.5">{user?.name}</p>
                <h1 className="text-2xl font-bold font-['Syne'] text-[#F0F0FF]">{eventType.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-5 text-sm text-[#8888AA]">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#6366F1]" />{eventType.duration} minutes</span>
              {eventType.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#6366F1]" />{eventType.location}</span>}
            </div>
            {eventType.description && <p className="mt-4 text-sm text-[#8888AA] leading-relaxed">{eventType.description}</p>}
          </div>

          {/* Step indicator */}
          {step < 3 && (
            <div className="px-6 py-4 bg-[#0F0F1A]/50 flex gap-6 sm:gap-8 text-xs sm:text-sm overflow-x-auto">
              {STEP_LABELS.slice(0, 3).map((label, i) => (
                <div key={i} className={`flex items-center gap-2 whitespace-nowrap font-medium transition-colors ${step === i ? 'text-[#6366F1]' : i < step ? 'text-[#8888AA]' : 'text-[#8888AA]/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${step === i ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20' : i < step ? 'bg-[#2E2E50] text-[#F0F0FF]' : 'bg-[#1A1A2E] border border-[#2E2E50] text-[#8888AA]/50'}`}>
                    {i < step ? <Check className="w-3 h-3 text-[#10B981]" /> : i + 1}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 0: Calendar */}
        {step === 0 && (
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2E2E50] p-6 md:p-8 animate-fade-in shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="font-semibold text-[#F0F0FF] font-['Syne'] text-lg">Select a date</h2>
              <select
                value={guestTimezone}
                onChange={e => setGuestTimezone(e.target.value)}
                className="text-sm bg-[#0F0F1A] border border-[#2E2E50] text-[#F0F0FF] rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#6366F1] focus:border-transparent cursor-pointer"
              >
                {['UTC','Asia/Kolkata','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney'].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <CalendarView
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              userId={user?.id}
              eventTypeId={eventType.id}
              timezone={guestTimezone}
            />
          </div>
        )}

        {/* Step 1: Time Slots */}
        {step === 1 && (
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2E2E50] p-6 md:p-8 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(0)} className="p-2 rounded-xl bg-[#2E2E50]/50 hover:bg-[#2E2E50] transition-colors text-[#F0F0FF]">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-[#F0F0FF] font-['Syne'] text-lg">{selectedDate && format(selectedDate, 'EEEE, MMMM d')}</h2>
            </div>
            {loadingSlots ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" /></div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 bg-[#0F0F1A] border border-[#2E2E50] border-dashed rounded-2xl">
                 <Clock className="w-10 h-10 text-[#2E2E50] mx-auto mb-3" />
                 <p className="text-[#8888AA] text-sm">No available slots on this day. Try another date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedSlot(slot); setStep(2); }}
                    className="py-3 px-4 bg-[#0F0F1A] border border-[#2E2E50] rounded-xl text-sm font-medium text-[#F0F0FF] hover:border-[#6366F1] hover:bg-[#6366F1]/10 hover:text-[#6366F1] transition-all"
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details form */}
        {step === 2 && (
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2E2E50] p-6 md:p-8 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="p-2 rounded-xl bg-[#2E2E50]/50 hover:bg-[#2E2E50] transition-colors text-[#F0F0FF]">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-semibold text-[#F0F0FF] font-['Syne'] text-lg">Your Details</h2>
                {selectedSlot && (
                  <p className="text-sm text-[#8888AA] mt-1">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d')} · {selectedSlot.start} – {selectedSlot.end}
                  </p>
                )}
              </div>
            </div>
            
            <form onSubmit={handleConfirm} className="space-y-5">
              <Input 
                label="Full Name *" 
                required 
                value={form.name} 
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Jane Doe" 
              />
              <Input 
                type="email" 
                label="Email Address *" 
                required 
                value={form.email} 
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="jane@example.com" 
              />
              <Textarea 
                label="Notes (optional)" 
                rows={3} 
                value={form.notes} 
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Anything you'd like to share before the meeting?" 
              />
              
              <Button type="submit" loading={submitting} className="w-full mt-4">
                Confirm Booking
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && booking && (
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2E2E50] p-8 md:p-12 text-center animate-fade-in shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <Check className="w-10 h-10 text-[#10B981]" />
            </div>
            <h2 className="text-3xl font-bold text-[#F0F0FF] font-['Syne'] mb-3">Booking Confirmed!</h2>
            <p className="text-[#8888AA] mb-8">A calendar invitation has been sent to <span className="text-[#F0F0FF] font-medium">{form.email}</span>.</p>
            
            <div className="bg-[#0F0F1A] border border-[#2E2E50] rounded-xl p-5 text-left text-sm text-[#F0F0FF] space-y-3 mb-8 mx-auto max-w-md">
              <div className="flex justify-between items-center pb-3 border-b border-[#2E2E50]/50"><span className="text-[#8888AA]">Event</span><span className="font-medium">{eventType.title}</span></div>
              <div className="flex justify-between items-center pb-3 border-b border-[#2E2E50]/50"><span className="text-[#8888AA]">Date</span><span className="font-medium">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span></div>
              <div className="flex justify-between items-center pb-3 border-b border-[#2E2E50]/50"><span className="text-[#8888AA]">Time</span><span className="font-medium text-[#6366F1]">{selectedSlot?.start} ({guestTimezone})</span></div>
              {eventType.location && <div className="flex justify-between items-center"><span className="text-[#8888AA]">Location</span><span className="font-medium">{eventType.location}</span></div>}
            </div>
          </div>
        )}
      </div>
      
      {/* Branding footer */}
      <div className="text-center pb-8 text-xs text-[#8888AA]">
        Powered by <a href="/" className="text-[#6366F1] hover:text-[#EC4899] font-semibold transition-colors">Schedulr</a>
      </div>
    </div>
  );
}
