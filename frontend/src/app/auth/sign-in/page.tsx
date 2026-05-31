'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login, ApiError } from '@/lib/api';
import { saveAuth } from '@/lib/auth';

type TabMode = 'PARENT' | 'CAMPER';

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabMode>('PARENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSlowConnection(false);
    setLoading(true);

    // After 8 seconds, show a "server may be starting up" hint
    const slowTimer = setTimeout(() => setSlowConnection(true), 8000);

    try {
      const { token, user } = await login(email, password);
      clearTimeout(slowTimer);
      saveAuth(token, user);
      if (user.role === 'PARENT') router.push('/dashboard/parent');
      else if (user.role === 'CAMPER') router.push('/dashboard/camper');
      else router.push('/');
    } catch (err: unknown) {
      clearTimeout(slowTimer);
      setSlowConnection(false);

      if (err instanceof ApiError) {
        // HTTP error with a real status code from the server
        if (err.status === 401) {
          setError('Incorrect email or password. Please try again.');
        } else if (err.status === 403) {
          setError('Your account has been suspended. Please contact support.');
        } else if (err.status === 400) {
          setError('Please enter a valid email and password.');
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
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex justify-center hover:opacity-80 transition-opacity">
            <Image src="/logo-full.png" alt="NAGARTA" width={72} height={72} className="object-contain" />
          </Link>
          <p className="text-beige/60 text-sm tracking-wider mt-3">Youth Camp 2026</p>
        </div>

        <div className="bg-cream rounded-xl p-8 shadow-2xl">
          <h1 className="font-serif text-2xl font-semibold text-maroon mb-1 italic">Welcome back</h1>
          <p className="text-sm text-burgundy mb-6">Sign in to your account</p>

          {/* Tabs */}
          <div className="flex border border-beige rounded-lg overflow-hidden mb-6">
            {(['PARENT', 'CAMPER'] as TabMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTab(mode)}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                  tab === mode
                    ? 'bg-burgundy text-gold'
                    : 'bg-white text-maroon/60 hover:bg-beige'
                }`}
              >
                {mode === 'PARENT' ? 'Parent' : 'Camper'}
              </button>
            ))}
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
              <label className="block label-caps text-burgundy mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block label-caps text-burgundy mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-maroon/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-gold hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-xs text-beige/40 hover:text-gold transition-colors">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
