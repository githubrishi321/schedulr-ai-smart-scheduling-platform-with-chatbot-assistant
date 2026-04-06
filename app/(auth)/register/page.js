'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Mail, Lock, User, UserCircle, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Password strength (0-4)
  const [strength, setStrength] = useState(0);

  // Validate password strength whenever it changes
  useEffect(() => {
    let score = 0;
    const p = formData.password;
    if (p.length > 7) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    setStrength(score);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For username, only allow alphanumeric and convert to lowercase
    if (name === 'username') {
      const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      setFormData(prev => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success - Redirect to login
      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-[#2E2E50]';
    if (strength === 1) return 'bg-[#EF4444]';
    if (strength === 2) return 'bg-[#F59E0B]';
    if (strength === 3) return 'bg-[#10B981]';
    return 'bg-[#4F46E5]';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0F0F1A] text-[#F0F0FF]">
      {/* Left side — Branding / Hero */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#6366F1] to-[#EC4899] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white mb-16">
            <Calendar className="w-8 h-8" />
            Schedulr
          </Link>
          
          <h1 className="font-['Syne'] text-5xl font-bold text-white leading-tight mb-6">
            Join the scheduling<br />revolution.
          </h1>
          <p className="text-white/80 text-lg max-w-md leading-relaxed">
            Create your account in seconds. Start taking control of your time with a beautifully crafted booking link.
          </p>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © {new Date().getFullYear()} Schedulr. All rights reserved.
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right side — Register Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        {/* Mobile header view */}
        <div className="md:hidden flex items-center gap-2 text-2xl font-bold tracking-tight mb-12">
          <Calendar className="w-8 h-8 text-[#6366F1]" />
          <span>Schedulr</span>
        </div>

        <div className="w-full max-w-md mx-auto py-12">
          <h2 className="font-['Syne'] text-3xl font-bold mb-2">Create an account</h2>
          <p className="text-[#8888AA] mb-8">Start your free scheduling journey today.</p>

          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#8888AA] mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#8888AA]" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-[#1A1A2E] border border-[#2E2E50] rounded-xl text-white placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all duration-200"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8888AA] mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#8888AA]" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-[#1A1A2E] border border-[#2E2E50] rounded-xl text-white placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all duration-200"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8888AA] mb-1.5">Username (URL)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-[#8888AA]" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-[#1A1A2E] border border-[#2E2E50] rounded-xl text-white placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all duration-200"
                  placeholder="janedoe"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-xs text-[#8888AA]">schedulr.app/</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8888AA] mb-1.5">Password</label>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#8888AA]" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-[#1A1A2E] border border-[#2E2E50] rounded-xl text-white placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all duration-200"
                  placeholder="Create a strong password"
                />
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                        strength >= level ? getStrengthColor() : 'bg-[#2E2E50]'
                      }`}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:opacity-90 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 mt-8"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#8888AA]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#6366F1] hover:text-[#EC4899] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
