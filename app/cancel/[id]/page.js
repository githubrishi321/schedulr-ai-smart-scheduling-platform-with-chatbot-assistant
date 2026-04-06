import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import CancelClientUI from './CancelClientUI';
import { formatDate, formatTime } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Cancel Booking' };

export default async function CancelBookingPage({ params }) {
  const { id } = await params;

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select(`*, event_types(title, users(name))`)
    .eq('id', id)
    .single();

  if (error || !booking) {
    notFound();
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] text-[#F0F0FF] p-6 animate-fade-in">
        <div className="max-w-md w-full bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-8 text-center space-y-4">
           <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-4">
             <Calendar className="w-8 h-8 text-[#EF4444]" />
           </div>
           <h1 className="text-2xl font-bold font-['Syne']">Booking Cancelled</h1>
           <p className="text-[#8888AA]">This booking has already been cancelled.</p>
           <Link href="/" className="inline-block px-6 py-2.5 bg-[#6366F1] text-white rounded-xl hover:opacity-90 transition-opacity mt-4 font-medium">
             Return Home
           </Link>
        </div>
      </div>
    );
  }

  return <CancelClientUI booking={booking} />;
}
