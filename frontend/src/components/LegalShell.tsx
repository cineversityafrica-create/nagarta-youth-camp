import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function LegalShell({
  title,
  effectiveDate,
  siteContent,
  children,
}: {
  title: string;
  effectiveDate: string;
  siteContent: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <div className="bg-maroon py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/logo-full.png" alt="NAGARTA" width={40} height={40} className="object-contain" /></Link>
          <Link href="/" className="text-xs text-beige/50 hover:text-gold transition-colors">&larr; Back to home</Link>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <p className="label-caps text-gold tracking-widest2 mb-3">Legal</p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-maroon italic">{title}</h1>
            <div className="gold-divider mx-auto mt-5" />
            <p className="text-xs text-maroon/50 mt-4">Effective Date: {effectiveDate}</p>
          </div>

          <div className="legal-content bg-white rounded-2xl border border-beige p-6 md:p-10 shadow-sm">
            {children}
          </div>

          {/* Cross-link between the two policies */}
          <div className="mt-6 text-center text-xs text-maroon/50">
            <Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
            <span className="mx-2">·</span>
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </main>

      <Footer content={siteContent} />
    </div>
  );
}
