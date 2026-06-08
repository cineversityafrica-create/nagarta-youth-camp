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
      description: 'Save $25! Register early and unlock exclusive savings',
      features: commonFeatures,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      shadow: 'shadow-emerald-300/50',
      badge: '🐦 EARLY BIRD - SAVE $25',
    },
    {
      name: 'Regular Package',
      price: '260',
      featured: false,
      description: 'Standard registration price after early bird ends',
      features: commonFeatures,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      shadow: 'shadow-emerald-300/50',
      badge: 'REGULAR PRICE',
    },
  ];

  const paymentMethods = [
    {
      name: 'Visa / Mastercard',
      slug: 'visa',
      description: 'Pay securely with any credit or debit card',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="2" y="6" width="20" height="14" rx="2" strokeWidth="2" />
          <path strokeWidth="2" strokeLinecap="round" d="M2 10h20M6 16h2M10 16h4" />
        </svg>
      ),
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      shadow: 'shadow-blue-400/50',
    },
    {
      name: 'Bank Transfer',
      slug: 'bank',
      description: 'Direct bank deposit or wire transfer',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
      ),
      gradient: 'from-purple-500 via-violet-600 to-fuchsia-700',
      shadow: 'shadow-purple-400/50',
    },
  ];

  return (
    <section className={`relative overflow-hidden rounded-2xl ${compact ? 'py-8' : 'py-24'}`} style={{
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
        <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-6 ${compact ? 'mb-8' : 'mb-20 max-w-5xl mx-auto'}`}>
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 ${tier.shadow}`}
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: tier.featured
                  ? '0 25px 50px -12px rgba(251, 146, 60, 0.5), 0 0 0 4px rgba(251, 191, 36, 0.3)'
                  : '0 20px 40px -10px rgba(16, 185, 129, 0.4), 0 0 0 3px rgba(45, 212, 191, 0.2)',
              }}
            >
              {/* Badge */}
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r ${tier.gradient} text-white text-xs font-bold tracking-widest shadow-lg`}>
                {tier.badge}
              </div>

              {/* Card content */}
              <div className="text-center mb-6 pt-2">
                <h3 className="font-serif text-3xl font-bold text-maroon mb-2">{tier.name}</h3>
                <p className="text-sm text-burgundy/70 mb-6">{tier.description}</p>

                {/* Price with optional strikethrough original */}
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

              {/* Features list */}
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

              {/* CTA Button */}
              <a
                href="/register"
                className={`block w-full text-center py-4 rounded-2xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r ${tier.gradient} hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
                style={{
                  boxShadow: tier.featured
                    ? '0 10px 30px rgba(251, 146, 60, 0.5)'
                    : '0 10px 30px rgba(16, 185, 129, 0.4)',
                }}
              >
                Reserve a Spot
              </a>
            </div>
          ))}
        </div>

        {/* Payment Methods Section */}
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-2 mb-4 rounded-full bg-white shadow-lg" style={{
            boxShadow: '0 10px 30px rgba(168, 85, 247, 0.3)'
          }}>
            <span className="text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              💳 Payment Options
            </span>
          </div>
          <h3 className="font-serif text-3xl md:text-5xl font-bold text-maroon italic mb-3">
            Pay Your Way
          </h3>
          <p className="text-lg text-burgundy/80 max-w-2xl mx-auto">
            Choose your preferred payment method - all secure & convenient
          </p>
        </div>

        {/* Payment Method Cards */}
        <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-6 ${compact ? '' : 'max-w-3xl mx-auto'}`}>
          {paymentMethods.map((method, idx) => (
            <a
              key={idx}
              href={`/payment/${method.slug}`}
              className={`group relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:scale-105 cursor-pointer ${method.shadow} block`}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

              {/* Icon container */}
              <div className={`relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500`}>
                {method.icon}
              </div>

              {/* Content */}
              <div className="text-center relative">
                <h4 className="font-serif text-xl font-bold text-maroon mb-3">{method.name}</h4>
                <p className="text-sm text-burgundy/70 leading-relaxed mb-4">{method.description}</p>

                {/* Bottom indicator */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${method.gradient} bg-opacity-10`} style={{
                  background: `linear-gradient(to right, ${method.gradient.includes('blue') ? '#dbeafe' : method.gradient.includes('purple') ? '#ede9fe' : '#fce7f3'}, ${method.gradient.includes('blue') ? '#c7d2fe' : method.gradient.includes('purple') ? '#ddd6fe' : '#fbcfe8'})`
                }}>
                  <svg className={`w-4 h-4 ${method.gradient.includes('blue') ? 'text-blue-600' : method.gradient.includes('purple') ? 'text-purple-600' : 'text-pink-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-xs font-bold tracking-wider ${method.gradient.includes('blue') ? 'text-blue-700' : 'text-purple-700'}`}>
                    CLICK TO PAY →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Trust badges at bottom */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 md:gap-12 px-8 py-6 rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" />
              </svg>
              <span className="text-sm font-bold text-burgundy">100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 17.5L5 12l1.5-1.5L10.5 14.5l7-7L19 9l-8.5 8.5z" />
              </svg>
              <span className="text-sm font-bold text-burgundy">Verified Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.5 2c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z" />
              </svg>
              <span className="text-sm font-bold text-burgundy">Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
