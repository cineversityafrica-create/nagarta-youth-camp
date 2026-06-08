'use client';

interface PricingSectionProps {
  compact?: boolean; // Use compact layout for sidebar use
}

export default function PricingSection({ compact = false }: PricingSectionProps) {
  // Common features for ALL packages (same content)
  const commonFeatures = [
    'Full 5-day camp access',
    'NAGARTA Branded Packing List',
    'Camp T-shirt & merchandise',
    'All meals included',
    'Activity materials',
    'Mentorship sessions',
    'Certificate of completion',
    'Awards Night participation',
  ];

  const tiers = [
    {
      name: 'Early Bird',
      price: '235',
      originalPrice: '260',
      featured: true,
      description: 'Save $25! Register early',
      features: commonFeatures,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      badge: '🐦 EARLY BIRD',
    },
    {
      name: 'Regular Package',
      price: '260',
      featured: false,
      description: 'Standard registration',
      features: commonFeatures,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      badge: 'REGULAR',
    },
  ];

  const paymentMethods = [
    {
      name: 'Visa / Mastercard',
      slug: 'visa',
      gradient: 'from-blue-500 to-indigo-700',
    },
    {
      name: 'Bank Transfer',
      slug: 'bank',
      gradient: 'from-purple-500 to-fuchsia-700',
    },
  ];

  // COMPACT VERSION (used in sidebar)
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            💎 Pricing
          </span>
          <h3 className="font-serif text-lg font-bold text-maroon italic mt-1">Choose Your Package</h3>
        </div>

        {/* Compact Pricing Cards */}
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className="relative rounded-xl p-4 bg-white border-2"
            style={{
              borderColor: tier.featured ? '#10b981' : '#e5e7eb',
              boxShadow: tier.featured
                ? '0 10px 20px -8px rgba(16, 185, 129, 0.4)'
                : '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Mini Badge */}
            {tier.featured && (
              <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r ${tier.gradient} text-white text-[10px] font-bold tracking-wider shadow-md`}>
                {tier.badge}
              </div>
            )}

            <div className="flex items-center justify-between mb-3 pt-1">
              <div>
                <h4 className="font-bold text-maroon text-sm">{tier.name}</h4>
                <p className="text-xs text-burgundy/60">{tier.description}</p>
              </div>
              <div className="text-right">
                {tier.originalPrice && (
                  <div className="text-xs text-gray-400 line-through">${tier.originalPrice}</div>
                )}
                <div className={`text-2xl font-bold bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                  ${tier.price}
                </div>
              </div>
            </div>

            {/* Compact features list */}
            <ul className="space-y-1.5 mb-3">
              {tier.features.slice(0, 4).map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-burgundy">{feature}</span>
                </li>
              ))}
              <li className="text-[10px] text-burgundy/50 pl-5">+ {tier.features.length - 4} more benefits</li>
            </ul>
          </div>
        ))}

        {/* Compact Payment Methods */}
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-burgundy/60 text-center mb-2">
            💳 Payment Options
          </p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method, idx) => (
              <a
                key={idx}
                href={`/payment/${method.slug}`}
                className={`block text-center py-2 px-2 rounded-lg bg-gradient-to-r ${method.gradient} text-white text-[10px] font-bold tracking-wider hover:shadow-md transition-all hover:scale-105`}
              >
                {method.name}
              </a>
            ))}
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-burgundy/60">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">256-bit SSL Encrypted</span>
        </div>
      </div>
    );
  }

  // FULL VERSION (original beautiful version)
  return (
    <section className="relative py-24 overflow-hidden rounded-2xl" style={{
      background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 25%, #fce7f3 50%, #ddd6fe 75%, #cffafe 100%)'
    }}>
      {/* Animated bright background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 mb-4 rounded-full bg-white shadow-lg" style={{
            boxShadow: '0 10px 30px rgba(251, 146, 60, 0.3)'
          }}>
            <span className="text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              💎 Pricing & Payment
            </span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-maroon italic mb-4">
            Reserve Your Spot
          </h2>
          <p className="text-lg text-burgundy/80 max-w-2xl mx-auto">
            Choose the package that works best for your family. Secure payment options available.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 max-w-5xl mx-auto">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-2 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: tier.featured
                  ? '0 25px 50px -12px rgba(16, 185, 129, 0.5), 0 0 0 4px rgba(45, 212, 191, 0.3)'
                  : '0 20px 40px -10px rgba(16, 185, 129, 0.4), 0 0 0 3px rgba(45, 212, 191, 0.2)',
              }}
            >
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r ${tier.gradient} text-white text-xs font-bold tracking-widest shadow-lg`}>
                {tier.badge}
              </div>

              <div className="text-center mb-6 pt-2">
                <h3 className="font-serif text-3xl font-bold text-maroon mb-2">{tier.name}</h3>
                <p className="text-sm text-burgundy/70 mb-6">{tier.description}</p>

                {tier.originalPrice && (
                  <div className="mb-1">
                    <span className="text-2xl text-gray-400 line-through font-semibold">
                      ${tier.originalPrice}
                    </span>
                    <span className="ml-2 text-xs font-bold text-rose-500 bg-rose-100 px-2 py-1 rounded-full">
                      SAVE ${parseInt(tier.originalPrice) - parseInt(tier.price)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className={`text-7xl font-bold bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                    ${tier.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">per camper</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-md`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-burgundy font-medium text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/register"
                className={`block w-full text-center py-4 rounded-2xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r ${tier.gradient} hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                Reserve a Spot
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
