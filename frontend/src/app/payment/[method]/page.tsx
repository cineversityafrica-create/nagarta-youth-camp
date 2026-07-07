'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BankDetails from '@/components/BankDetails';

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const camperName = searchParams.get('camperName') || '';

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
            <p className="text-white/90 text-sm">Complete your payment using the bank details below</p>
          </div>

          <div className="p-6 md:p-8">
            <BankDetails referenceCode={ref} camperName={camperName} compact />

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-burgundy/80 leading-relaxed">
                📌 After making your transfer, keep your payment receipt. NAGARTA will confirm your payment
                and update your child&apos;s status. You can view your registration anytime from your parent portal.
              </p>
            </div>

            <Link
              href="/dashboard/parent"
              className="mt-6 block w-full text-center py-3 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg transition-all"
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
