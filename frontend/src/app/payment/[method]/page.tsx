'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_fcb37013accb3e3d1151fd2ae10613fb9c043301';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackConfig) => { openIframe: () => void };
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
}

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
}

function PaymentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const method = params.method as string;
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    amount: '235',
    package: 'Early Bird',
  });

  // Pre-fill from URL params (when redirected from registration)
  useEffect(() => {
    const parentName = searchParams.get('parentName');
    const parentEmail = searchParams.get('parentEmail');
    const parentPhone = searchParams.get('parentPhone');
    const pkg = searchParams.get('package');
    const amount = searchParams.get('amount');

    setFormData((prev) => ({
      ...prev,
      fullName: parentName || prev.fullName,
      email: parentEmail || prev.email,
      phone: parentPhone || prev.phone,
      package: (pkg === 'Regular Package' ? 'Regular Package' : pkg === 'Early Bird' ? 'Early Bird' : prev.package),
      amount: amount || prev.amount,
    }));
  }, [searchParams]);

  const methodConfig = {
    visa: {
      title: 'Card Payment (Visa / Mastercard)',
      icon: '💳',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
      lightGradient: 'from-blue-100 to-indigo-100',
      darkColor: 'text-blue-700',
      borderColor: 'border-blue-300',
    },
    bank: {
      title: 'Bank Transfer',
      icon: '🏦',
      gradient: 'from-purple-500 via-violet-600 to-fuchsia-700',
      bgGradient: 'from-purple-50 via-fuchsia-50 to-pink-50',
      lightGradient: 'from-purple-100 to-fuchsia-100',
      darkColor: 'text-purple-700',
      borderColor: 'border-purple-300',
    },
  };

  const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.visa;

  function loadPaystackScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.PaystackPop) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);

    try {
      // Load Paystack script
      const loaded = await loadPaystackScript();
      if (!loaded || !window.PaystackPop) {
        alert('Failed to load Paystack. Please check your internet and try again.');
        setProcessing(false);
        return;
      }

      // Generate unique reference
      const reference = `NAGARTA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Convert USD to GHS (using 12 as rate, you can adjust)
      const amountInGHS = parseInt(formData.amount) * 12;
      const amountInPesewas = amountInGHS * 100; // Paystack uses lowest currency unit

      // Open Paystack popup
      const paystack = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: formData.email,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        metadata: {
          fullName: formData.fullName,
          phone: formData.phone,
          package: formData.package,
          method,
          custom_fields: [
            { display_name: 'Full Name', variable_name: 'full_name', value: formData.fullName },
            { display_name: 'Phone', variable_name: 'phone', value: formData.phone },
            { display_name: 'Package', variable_name: 'package', value: formData.package },
          ],
        },
        callback: (response: PaystackResponse) => {
          // Payment successful - redirect to success page
          window.location.href = `/payment/success?ref=${response.reference}&amount=${formData.amount}&package=${encodeURIComponent(formData.package)}&email=${encodeURIComponent(formData.email)}`;
        },
        onClose: () => {
          setProcessing(false);
        },
      });

      paystack.openIframe();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Something went wrong. Please try again.');
      setProcessing(false);
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} py-10 px-4`}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-burgundy hover:text-maroon mb-6 font-semibold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div className={`bg-gradient-to-r ${config.gradient} p-8 text-center text-white`}>
            <div className="text-6xl mb-3">{config.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">{config.title}</h1>
            <p className="text-white/90 text-sm">Powered by Paystack • Secure Payment</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            {/* Package Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-burgundy mb-2 uppercase tracking-wider">Select Package</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 ${formData.package === 'Early Bird' ? `${config.borderColor} bg-gradient-to-br ${config.lightGradient}` : 'border-gray-200'} transition-all`}>
                  <input
                    type="radio"
                    name="package"
                    value="Early Bird"
                    checked={formData.package === 'Early Bird'}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value, amount: '235' })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <p className="font-bold text-maroon">🐦 Early Bird</p>
                    <p className="text-2xl font-bold text-orange-600">$235</p>
                    <p className="text-xs text-rose-600 font-semibold">Save $25!</p>
                  </div>
                </label>
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 ${formData.package === 'Regular Package' ? `${config.borderColor} bg-gradient-to-br ${config.lightGradient}` : 'border-gray-200'} transition-all`}>
                  <input
                    type="radio"
                    name="package"
                    value="Regular Package"
                    checked={formData.package === 'Regular Package'}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value, amount: '260' })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <p className="font-bold text-maroon">Regular</p>
                    <p className="text-2xl font-bold text-emerald-600">$260</p>
                    <p className="text-xs text-gray-500">Standard Price</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="parent@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
            </div>

            {/* Amount Summary */}
            <div className={`bg-gradient-to-r ${config.lightGradient} rounded-2xl p-6 mb-6`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-burgundy uppercase tracking-wider">Package</span>
                <span className="text-sm font-bold text-maroon">{formData.package}</span>
              </div>
              <div className="border-t border-burgundy/20 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-maroon uppercase tracking-wider">USD Amount</span>
                  <span className={`text-2xl font-bold ${config.darkColor}`}>${formData.amount}.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-burgundy/70 uppercase tracking-wider">Ghana Cedis</span>
                  <span className="text-sm font-bold text-emerald-700">GH₵ {(parseInt(formData.amount) * 12).toLocaleString()}.00</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-700 mb-1 flex items-center gap-2">
                    🔒 Secured by Paystack
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">PCI-DSS</span>
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your payment is processed securely by Paystack (a Stripe company).
                    Accepts Visa, Mastercard, Bank Transfer, Mobile Money.
                    We never see or store your card details.
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={processing}
              className={`w-full py-5 rounded-2xl text-white font-bold tracking-widest uppercase text-base bg-gradient-to-r ${config.gradient} hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed`}
              style={{ boxShadow: `0 15px 40px rgba(0,0,0,0.2)` }}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Opening Paystack...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  🔐 Pay GH₵{(parseInt(formData.amount) * 12).toLocaleString()} Securely
                </span>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              By clicking &quot;Pay&quot;, you&apos;ll be redirected to Paystack&apos;s secure payment page.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense boundary for useSearchParams
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-burgundy">Loading payment page...</p>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
