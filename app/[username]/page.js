import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { Clock, MapPin, ArrowRight, Calendar } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `Book with ${username} | Schedulr` };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name, username, avatar_url, timezone')
    .eq('username', username)
    .single();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-['Syne'] text-[#F0F0FF] mb-2">User not found</h1>
          <p className="text-[#8888AA]">The booking page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { data: eventTypes } = await supabaseAdmin
    .from('event_types')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen bg-[#0F0F1A] font-sans antialiased text-[#F0F0FF]">
      {/* Header */}
      <div className="bg-[#1A1A2E] border-b border-[#2E2E50] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-24 h-24 rounded-2xl mx-auto mb-5 object-cover shadow-lg border border-[#2E2E50]" loading="lazy" />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-3xl font-bold font-['Syne'] text-white mx-auto mb-5 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              {getInitials(user.name)}
            </div>
          )}
          <h1 className="text-3xl font-bold font-['Syne'] text-[#F0F0FF]">{user.name}</h1>
          <p className="text-[#8888AA] mt-2 text-sm max-w-sm mx-auto bg-[#0F0F1A] py-1 px-3 rounded-full border border-[#2E2E50]">{user.timezone}</p>
        </div>
      </div>

      {/* Event Types */}
      <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
        <h2 className="text-xl font-bold font-['Syne'] text-[#F0F0FF] mb-6">Select a meeting type</h2>

        {!eventTypes || eventTypes.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1A2E] rounded-3xl border border-[#2E2E50] border-dashed shadow-2xl">
            <Calendar className="w-12 h-12 text-[#2E2E50] mx-auto mb-4" />
            <p className="text-[#8888AA] font-medium">No active meeting types available right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventTypes.map(et => (
              <Link
                key={et.id}
                href={`/${username}/${et.slug}`}
                className="block bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-6 hover:border-[#6366F1] hover:bg-[#6366F1]/5 transition-all duration-300 group shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-4 h-4 rounded-full mt-1.5 shrink-0 shadow-md" style={{ backgroundColor: et.color, boxShadow: `0 0 10px ${et.color}` }} />
                    <div>
                      <h3 className="text-lg font-bold font-['Syne'] text-[#F0F0FF] group-hover:text-[#6366F1] transition-colors">{et.title}</h3>
                      {et.description && <p className="text-[#8888AA] text-sm mt-1.5 leading-relaxed">{et.description}</p>}
                      <div className="flex items-center gap-5 mt-4 text-xs font-medium text-[#8888AA]">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#6366F1]" />{et.duration} min</span>
                        {et.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#6366F1]" />{et.location}</span>}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#2E2E50] group-hover:text-[#6366F1] transition-colors mt-2 shrink-0 group-hover:translate-x-1 duration-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-10 text-xs text-[#8888AA]">
        Powered by <a href="/" className="text-[#6366F1] hover:text-[#EC4899] font-bold transition-colors">Schedulr</a>
      </div>
    </div>
  );
}
