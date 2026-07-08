import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteContent } from '@/lib/api';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — NAGARTA Youth Camp',
  description: 'How NAGARTA Youth Camp collects, uses, and protects your personal information.',
};

export default async function PrivacyPage() {
  const siteContent = await getSiteContent().catch(() => ({} as Record<string, string>));

  return (
    <LegalShell title="Privacy Policy" effectiveDate="July 8, 2026" siteContent={siteContent}>
      <p>
        Nagarta Youth Camp respects your privacy and is committed to protecting your personal
        information.
      </p>

      <h2>Information We Collect</h2>
      <p>We may collect:</p>
      <ul>
        <li>Full name</li>
        <li>Date of birth or age</li>
        <li>Parent or guardian information (where applicable)</li>
        <li>Email address</li>
        <li>Telephone number</li>
        <li>Residential address</li>
        <li>Emergency contact information</li>
        <li>Medical information relevant to participant safety</li>
        <li>Payment information processed securely through our payment provider</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Process registrations.</li>
        <li>Communicate camp updates.</li>
        <li>Organize participant activities.</li>
        <li>Ensure participant safety.</li>
        <li>Process payments.</li>
        <li>Improve our programmes and services.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>Sharing of Information</h2>
      <p>We do not sell or rent your personal information.</p>
      <p>We may share information only with:</p>
      <ul>
        <li>Payment service providers.</li>
        <li>Medical personnel during emergencies.</li>
        <li>Government authorities where legally required.</li>
        <li>Trusted service providers assisting in camp operations under appropriate confidentiality obligations.</li>
      </ul>

      <h2>Data Security</h2>
      <p>
        We implement appropriate administrative, technical, and organizational safeguards to protect
        your information against unauthorized access, disclosure, alteration, or destruction.
      </p>

      <h2>Cookies</h2>
      <p>
        Our website may use cookies to improve functionality, remember preferences, analyze website
        traffic, and enhance user experience.
      </p>
      <p>
        You may disable cookies through your browser settings, although some website features may not
        function properly.
      </p>

      <h2>Children&apos;s Privacy</h2>
      <p>
        Since Nagarta Youth Camp serves young people, we collect information from minors only with
        parental or guardian authorization where required.
      </p>

      <h2>Your Rights</h2>
      <p>You may request to:</p>
      <ul>
        <li>Access your personal information.</li>
        <li>Correct inaccurate information.</li>
        <li>Request deletion where legally permissible.</li>
        <li>Withdraw consent where applicable.</li>
      </ul>

      <h2>Policy Updates</h2>
      <p>
        This Privacy Policy may be updated periodically. The latest version will always be available on
        our website.
      </p>

      <h2>Contact</h2>
      <p>
        Questions regarding this Privacy Policy may be directed to Nagarta Youth Camp via our{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalShell>
  );
}
