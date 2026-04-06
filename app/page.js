import Link from 'next/link';
import { Calendar, Clock, Link2, Zap, Shield, Bot, ArrowRight, Check, Menu } from 'lucide-react';

const FEATURES = [
  { icon: Calendar, title: 'Smart Calendar Sync', desc: 'Connect Google Calendar and block busy times automatically. Never double-book again.' },
  { icon: Clock, title: 'Flexible Availability', desc: 'Set your working hours, buffer times, and date-specific rules. You\'re always in control.' },
  { icon: Link2, title: 'Shareable Booking Link', desc: 'One beautiful link for all your event types. Share it anywhere — email, LinkedIn, website.' },
  { icon: Bot, title: 'AI Scheduling Assistant', desc: 'Powered by Groq LLaMA 3.3 70B. Ask in plain English to manage your schedule hands-free.' },
  { icon: Shield, title: 'Timezone Intelligent', desc: 'Guests book in their timezone, you see it in yours. date-fns-tz handles all conversions.' },
  { icon: Zap, title: 'Instant Email Confirmations', desc: 'Beautiful confirmation emails with calendar invites sent automatically to both parties.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#F0F0FF]">
      {/* Nav */}
      <nav className="border-b border-[#2E2E50] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold font-['Syne']">
            <Calendar className="w-6 h-6 text-[#6366F1]" />
            Schedulr
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#8888AA] hover:text-[#F0F0FF] transition-colors">Sign in</Link>
            <Link href="/register" className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <Zap className="w-3.5 h-3.5" />
          Powered by Groq LLaMA 3.3 70B AI
        </div>
        <h1 className="font-['Syne'] text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
          Scheduling that<br />
          <span className="gradient-text">works for you</span>
        </h1>
        <p className="text-[#8888AA] text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Share your booking link. Let people pick a time. Get back to doing what matters. 
          Schedulr handles the rest — with built-in AI assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-500/20">
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#1A1A2E] border border-[#2E2E50] text-[#F0F0FF] font-semibold px-8 py-4 rounded-xl hover:bg-[#252540] transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-['Syne'] text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-[#8888AA] text-center mb-12">No credit card required. Free to get started.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-6 card-hover">
              <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#6366F1]" />
              </div>
              <h3 className="font-semibold font-['Syne'] mb-2">{title}</h3>
              <p className="text-[#8888AA] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="font-['Syne'] text-3xl font-bold text-center mb-12">Up and running in 3 steps</h2>
        <div className="space-y-6">
          {[
            { n: 1, title: 'Create your event types', desc: 'Set up 30-min calls, 1-hour consultations, or any meeting format with custom durations, buffers, and questions.' },
            { n: 2, title: 'Set your availability', desc: 'Define your working hours once. Connect Google Calendar to automatically block busy times.' },
            { n: 3, title: 'Share your link', desc: 'Share schedulr.app/yourusername and let people book directly. You\'ll get email confirmations and calendar events instantly.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-white font-bold font-['Syne'] shrink-0">
                {n}
              </div>
              <div>
                <h3 className="font-semibold font-['Syne'] text-lg mb-1">{title}</h3>
                <p className="text-[#8888AA] text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-[#6366F1] to-[#EC4899] rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-3xl" />
          <div className="relative z-10">
            <h2 className="font-['Syne'] text-3xl font-bold text-white mb-4">Ready to simplify scheduling?</h2>
            <p className="text-white/80 mb-8">Join and start sharing your booking link in minutes.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#6366F1] font-bold px-8 py-4 rounded-xl hover:opacity-95 transition-opacity">
              Create your free account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2E2E50] py-8 text-center text-sm text-[#8888AA]">
        <div className="flex items-center justify-center gap-1 mb-2 font-['Syne'] font-bold">
          <Calendar className="w-4 h-4 text-[#6366F1]" />
          Schedulr
        </div>
        <p>© {new Date().getFullYear()} Schedulr. Built with Next.js, Supabase &amp; Groq AI.</p>
      </footer>
    </div>
  );
}
