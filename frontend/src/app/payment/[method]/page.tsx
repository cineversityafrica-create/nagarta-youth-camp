'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const method = params.method as string;
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    amount: '200',
    package: 'Premium Package',
  });

  const methodConfig = {
    visa: {
      title: 'Visa / Mastercard Payment',
      icon: '💳',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
      lightGradient: 'from-blue-100 to-indigo-100',
      darkColor: 'text-blue-700',
      borderColor: 'border-blue-300',
      buttonShadow: 'shadow-blue-400/50',
    },
    bank: {
      title: 'Bank Transfer Payment',
      icon: '🏦',
      gradient: 'from-purple-500 via-violet-600 to-fuchsia-700',
      bgGradient: 'from-purple-50 via-fuchsia-50 to-pink-50',
      lightGradient: 'from-purple-100 to-fuchsia-100',
      darkColor: 'text-purple-700',
      borderColor: 'border-purple-300',
      buttonShadow: 'shadow-purple-400/50',
    },
  };

  const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.visa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    setProcessing(false);
    setStep(2);
  };

  if (step === 2) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-6`}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
          <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 animate-bounce`}>
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-maroon mb-3">Payment Successful! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment of <span className={`font-bold ${config.darkColor}`}>${formData.amount}</span>.
            <br />
            A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>
          </p>
          <div className={`bg-gradient-to-r ${config.lightGradient} rounded-2xl p-4 mb-6`}>
            <p className="text-sm text-burgundy"><strong>Reference:</strong> NAGARTA-{Date.now().toString().slice(-8)}</p>
            <p className="text-sm text-burgundy"><strong>Package:</strong> {formData.package}</p>
          </div>
          <Link
            href="/"
            className={`block w-full py-3 rounded-2xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r ${config.gradient} hover:shadow-2xl transition-all`}
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} py-10 px-4`}>
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-burgundy hover:text-maroon mb-6 font-semibold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.gradient} p-8 text-center text-white`}>
            <div className="text-6xl mb-3">{config.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">{config.title}</h1>
            <p className="text-white/90 text-sm">Complete your secure payment below</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            {/* Package Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-burgundy mb-2 uppercase tracking-wider">Select Package</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 ${formData.package === 'Premium Package' ? `${config.borderColor} bg-gradient-to-br ${config.lightGradient}` : 'border-gray-200'} transition-all`}>
                  <input
                    type="radio"
                    name="package"
                    value="Premium Package"
                    checked={formData.package === 'Premium Package'}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value, amount: '200' })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <p className="font-bold text-maroon">Premium</p>
                    <p className="text-2xl font-bold text-orange-600">$200</p>
                    <p className="text-xs text-gray-500">+ Packing List</p>
                  </div>
                </label>
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 ${formData.package === 'Standard Package' ? `${config.borderColor} bg-gradient-to-br ${config.lightGradient}` : 'border-gray-200'} transition-all`}>
                  <input
                    type="radio"
                    name="package"
                    value="Standard Package"
                    checked={formData.package === 'Standard Package'}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value, amount: '150' })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <p className="font-bold text-maroon">Standard</p>
                    <p className="text-2xl font-bold text-emerald-600">$150</p>
                    <p className="text-xs text-gray-500">Basic Package</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Full Name</label>
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
                <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Phone</label>
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
              <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="parent@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
              />
            </div>

            <div className="border-t-2 border-gray-100 pt-6 mb-6">
              <h3 className={`text-lg font-bold ${config.darkColor} mb-4 flex items-center gap-2`}>
                <span>{config.icon}</span>
                {method === 'visa' ? 'Card Details' : 'Bank Details'}
              </h3>

              {method === 'visa' ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Card Holder Name</label>
                    <input
                      type="text"
                      required
                      value={formData.cardHolder}
                      onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                      placeholder="As shown on card"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                        setFormData({ ...formData, cardNumber: val });
                      }}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={formData.expiryDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                          setFormData({ ...formData, expiryDate: val });
                        }}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">CVV</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
                        placeholder="123"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Bank Name</label>
                    <select
                      required
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
                    >
                      <option value="">Select your bank</option>
                      <option>GCB Bank</option>
                      <option>Ecobank Ghana</option>
                      <option>Absa Bank Ghana</option>
                      <option>Standard Chartered</option>
                      <option>Fidelity Bank</option>
                      <option>Stanbic Bank</option>
                      <option>CalBank</option>
                      <option>Zenith Bank</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={formData.cardHolder}
                      onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                      placeholder="Full name on bank account"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-burgundy mb-1 uppercase tracking-wider">Account Number</label>
                    <input
                      type="text"
                      required
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="Your account number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burgundy focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  <div className={`bg-gradient-to-r ${config.lightGradient} rounded-2xl p-4 mb-4`}>
                    <p className={`text-sm ${config.darkColor} font-semibold mb-1`}>📌 Bank Transfer Details:</p>
                    <p className="text-xs text-burgundy">Account Name: NAGARTA Youth Camp Ltd</p>
                    <p className="text-xs text-burgundy">Account Number: 1234567890</p>
                    <p className="text-xs text-burgundy">Bank: GCB Bank Ghana</p>
                    <p className="text-xs text-burgundy">Branch: Accra Main</p>
                  </div>
                </>
              )}
            </div>

            {/* Amount Summary */}
            <div className={`bg-gradient-to-r ${config.lightGradient} rounded-2xl p-6 mb-6`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-burgundy uppercase tracking-wider">Package</span>
                <span className="text-sm font-bold text-maroon">{formData.package}</span>
              </div>
              <div className="border-t border-burgundy/20 pt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-maroon uppercase tracking-wider">Total Amount</span>
                <span className={`text-3xl font-bold ${config.darkColor}`}>${formData.amount}.00</span>
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
                    🔒 256-bit SSL Encryption
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">SECURE</span>
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your payment information is protected with bank-level encryption. We never store your card details.
                    All transactions are securely processed and PCI-DSS compliant.
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={processing}
              className={`w-full py-5 rounded-2xl text-white font-bold tracking-widest uppercase text-base bg-gradient-to-r ${config.gradient} hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed ${config.buttonShadow}`}
              style={{
                boxShadow: `0 15px 40px rgba(0,0,0,0.2)`,
              }}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  🔐 Pay ${formData.amount} Securely
                </span>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              By clicking &quot;Pay&quot;, you agree to our Terms of Service and Privacy Policy.
              <br />
              All payments are securely encrypted.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
