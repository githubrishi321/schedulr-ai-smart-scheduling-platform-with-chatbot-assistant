'use client';

import { useSession } from 'next-auth/react';
import { Bell, Plus, ExternalLink, Copy } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Header({ user }) {
  const bookingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/${user?.username}`
    : '';

  const copyLink = () => {
    if (user?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/${user.username}`);
      toast.success('Booking link copied!');
    }
  };

  return (
    <header className="h-16 bg-[#0F0F1A] border-b border-[#2E2E50] flex items-center justify-between px-6 md:px-8 shrink-0">
      {/* Left — spacer for mobile menu button */}
      <div className="w-8 md:w-0" />

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto">
        {user?.username && (
          <button
            onClick={copyLink}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#8888AA] hover:text-[#F0F0FF] bg-[#1A1A2E] border border-[#2E2E50] rounded-lg px-3 py-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy booking link
          </button>
        )}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none">
          {user?.image ? (
            <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" loading="lazy" />
          ) : (
            getInitials(user?.name || 'User')
          )}
        </div>
      </div>
    </header>
  );
}
