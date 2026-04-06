'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Clock, ListOrdered, Settings, Calendar, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Event Types', href: '/event-types', icon: CalendarDays },
  { name: 'Availability', href: '/availability', icon: Clock },
  { name: 'Bookings', href: '/bookings', icon: ListOrdered },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1A1A2E] rounded-lg border border-[#2E2E50] text-[#F0F0FF]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen
        w-64 bg-[#1A1A2E] border-r border-[#2E2E50]
        flex flex-col transition-transform text-[#F0F0FF]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold font-['Syne']">
            <Calendar className="w-6 h-6 text-[#6366F1]" />
            Schedulr
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#6366F1]/10 text-[#6366F1]' 
                    : 'text-[#8888AA] hover:bg-[#252540] hover:text-[#F0F0FF]'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#6366F1]' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2E2E50]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-[#8888AA] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
