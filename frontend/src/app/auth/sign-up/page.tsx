'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { register, ApiError } from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSlowConnection(false);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    // After 8 seconds, show a "server may be starting up" hint
    const slowTimer = setTimeout(() => setSlowConnection(true), 8000);

    try {
      const { token, user } = await register({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        role: 'PARENT',
      });
      clearTimeout(slowTimer);
      saveAuth(token, user);
      router.push('/dashboard/parent');
    } catch (err: unknown) {
      clearTimeout(slowTimer);
      setSlowConnection(false);

      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('This email is already registered. Please sign in instead.');
        } else if (err.status === 400) {
          setError('Please check your details — make sure the email is valid and the password is at least 8 characters.');
        } else {
          setError('Something went wrong on the server. Please try again shortly.');
        }
      } else if (err instanceof Error && err.name === 'AbortError') {
        setError('The server took too long to respond. Please try again — it may still be starting up.');
      } else {
        setError('Could not connect to the server. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-maroon flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex justify-center hover:opacity-80 transition-opacity">
            <Image src="/logo-full.png" alt="NAGARTA" width={72} height={72} className="object-contain" />
          </Link>
          <p className="text-beige/60 text-sm tracking-wider mt-3">Youth Camp 2026</p>
        </div>

        <div className="bg-cream rounded-xl p-8 shadow-2xl">
          <h1 className="font-serif text-2xl font-semibold text-maroon mb-1 italic">Create an account</h1>
          <p className="text-sm text-burgundy mb-6">Join NAGARTA 2026</p>

          {/* Single account type */}
          <div className="flex items-center justify-center gap-2 mb-6 py-2.5 rounded-lg bg-burgundy text-gold text-xs font-semibold tracking-wider uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.7" />
            </svg>
            Parent / Guardian Account
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {slowConnection && !error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded px-4 py-3 text-sm mb-4">
              ⏳ The server is starting up — this can take up to 60 seconds. Please wait…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block label-caps text-burgundy mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                placeholder="Ama Mensah"
                className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block label-caps text-burgundy mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block label-caps text-burgundy mb-1.5">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+233 20 000 0000"
                className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block label-caps text-burgundy mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block label-caps text-burgundy mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-maroon font-semibold py-3 rounded-lg tracking-wider uppercase text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-maroon/60 mt-6">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-gold hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
