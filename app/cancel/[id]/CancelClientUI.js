'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea, Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { formatDate, formatTime } from '@/lib/utils';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function CancelClientUI({ booking }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Ask guest for email just to verify they actually own the booking
  // This is a simple extra security measure.
  const [emailVerification, setEmailVerification] = useState('');

  const handleCancel = async () => {
    if (emailVerification.toLowerCase().trim() !== booking.guest_email.toLowerCase()) {
       toast.error('The email addresses do not match.');
       return;
    }
    
    if (!confirm('Are you absolutely sure you want to cancel this booking?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: reason }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess(true);
      toast.success('Your booking has been cancelled.');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] text-[#F0F0FF] p-6 animate-fade-in">
        <div className="max-w-md w-full bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-8 text-center space-y-4">
           <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-4">
             <Calendar className="w-8 h-8 text-[#EF4444]" />
           </div>
           <h1 className="text-2xl font-bold font-['Syne']">Booking Cancelled</h1>
           <p className="text-[#8888AA]">Your appointment has been successfully cancelled. The host has been notified.</p>
        </div>
      </div>
    );
  }

  const hostName = booking.event_types?.users?.name || 'the host';
  const eventTitle = booking.event_types?.title || 'Meeting';
  const tz = booking.guest_timezone || 'UTC';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] text-[#F0F0FF] p-6 animate-fade-in">
      <div className="max-w-xl w-full bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-8 space-y-6">
        
        <div className="flex items-center gap-4 border-b border-[#2E2E50] pb-6">
           <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0">
             <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
           </div>
           <div>
             <h1 className="text-2xl font-bold font-['Syne'] text-[#F0F0FF]">Cancel Booking</h1>
             <p className="text-[#8888AA] text-sm mt-1">You are about to cancel your upcoming appointment.</p>
           </div>
        </div>

        <div className="bg-[#0F0F1A] border border-[#2E2E50] rounded-xl p-5 space-y-3">
          <p className="font-semibold text-lg">{eventTitle} with {hostName}</p>
          <div className="flex items-center gap-2 text-[#8888AA] text-sm">
            <Calendar className="w-4 h-4" />
            {formatDate(booking.start_time, tz)}
          </div>
          <div className="flex items-center gap-2 text-[#8888AA] text-sm">
            <Clock className="w-4 h-4" />
            {formatTime(booking.start_time, tz)} ({tz})
          </div>
        </div>

        <div className="space-y-4 pt-2">
           <Input 
             label="Verify your email address *" 
             placeholder="Enter the email you used to book" 
             value={emailVerification}
             onChange={(e) => setEmailVerification(e.target.value)}
           />
           <Textarea 
             label="Reason for cancellation (optional)" 
             placeholder="Let the host know why you're cancelling..." 
             rows={3} 
             value={reason}
             onChange={(e) => setReason(e.target.value)}
           />
        </div>

        <div className="flex justify-end gap-3 pt-4">
           <Button variant="secondary" onClick={() => router.back()}>Keep Booking</Button>
           <Button variant="danger" loading={loading} onClick={handleCancel}>Cancel Booking</Button>
        </div>

      </div>
    </div>
  );
}
