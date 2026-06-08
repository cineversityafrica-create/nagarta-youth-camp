'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentSuccess() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || 'N/A';
  const amount = searchParams.get('amount') || '0';
  const packageName = searchParams.get('package') || 'Package';
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        {/* Success Animation */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 animate-bounce shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-serif font-bold text-maroon mb-3">Payment Successful! 🎉</h1>
        <p className="text-gray-600 mb-6">
          Thank you for registering your camper for NAGARTA Youth Camp 2026!
        </p>

        <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-5 mb-6 text-left">
          <p className="text-sm text-burgundy mb-2">
            <strong>Reference:</strong> <span className="font-mono text-emerald-700">{ref}</span>
          </p>
          <p className="text-sm text-burgundy mb-2">
            <strong>Package:</strong> {packageName}
          </p>
          <p className="text-sm text-burgundy mb-2">
            <strong>Amount Paid:</strong> <span className="text-emerald-700 font-bold">${amount}</span>
          </p>
          {email && (
            <p className="text-sm text-burgundy">
              <strong>Receipt sent to:</strong> {email}
            </p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            ⏰ <strong>What&apos;s next?</strong><br />
            Check your email for confirmation. Camp dates: <strong>Dec 19-23, 2026</strong>
          </p>
        </div>

        <Link
          href="/"
          className="block w-full py-3 rounded-2xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-2xl transition-all"
        >
          Return Home
        </Link>

        <Link
          href="/dashboard/parent"
          className="block mt-3 text-sm text-burgundy/60 hover:text-burgundy underline"
        >
          View My Registrations →
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <p className="text-burgundy">Loading...</p>
      </div>
    }>
      <PaymentSuccess />
    </Suspense>
  );
}
