'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BankDetails from '@/components/BankDetails';
import PaystackButton from '@/components/PaystackButton';
import { getStoredUser } from '@/lib/auth';

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const camperName = searchParams.get('camperName') || '';
  const amount = parseFloat(searchParams.get('amount') || '') || 0;
  const pkg = searchParams.get('pkg') || 'Regular';

  const [email, setEmail] = useState('');
  useEffect(() => {
    const u = getStoredUser<{ email: string }>();
    if (u?.email) setEmail(u.email);
  }, []);

  const paystackEnabled = Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) && amount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-burgundy hover:text-maroon mb-6 font-semibold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-8 text-center text-white">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2">Registration Received!</h1>
            <p className="text-white/90 text-sm">
              {camperName ? `${camperName} is registered. ` : ''}Choose how you&apos;d like to pay
              {amount > 0 ? ` — $${amount} (${pkg})` : ''}.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Reference ticket (also shown inside BankDetails, but keep it visible up top) */}
            {ref && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700/70">Your Reference</p>
                <p className="font-mono font-extrabold text-lg text-amber-800 break-all">{ref}</p>
              </div>
            )}

            {/* ── Option 1: Pay online ── */}
            {paystackEnabled && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">1</span>
                  <h2 className="font-serif text-lg font-bold text-maroon">Pay Online Now</h2>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">Instant</span>
                </div>
                <PaystackButton
                  email={email}
                  amountUsd={amount}
                  referenceCode={ref}
                  packageName={pkg}
                  camperName={camperName}
                />
                <p className="mt-2 text-[11px] text-burgundy/50 text-center">Secure payment by card or mobile money via Paystack.</p>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-beige" />
                  <span className="text-xs font-bold uppercase tracking-wider text-burgundy/40">or</span>
                  <div className="flex-1 h-px bg-beige" />
                </div>
              </div>
            )}

            {/* ── Option 2: Bank transfer ── */}
            <div>
              {paystackEnabled && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">2</span>
                  <h2 className="font-serif text-lg font-bold text-maroon">Pay by Bank Transfer</h2>
                </div>
              )}
              <BankDetails referenceCode={ref} camperName={camperName} compact />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-burgundy/80 leading-relaxed">
                📌 If you pay by bank transfer, keep your receipt — NAGARTA will confirm it and update your
                child&apos;s status. Online payments are confirmed automatically. You can view everything anytime
                in your parent portal.
              </p>
            </div>

            <Link
              href="/dashboard/parent"
              className="block w-full text-center py-3 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-maroon to-burgundy hover:shadow-lg transition-all"
            >
              Go to My Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <p className="text-burgundy">Loading...</p>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
