import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteContent } from '@/lib/api';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Refund Policy — NAGARTA Youth Camp',
  description: 'How refunds work for NAGARTA Youth Camp registrations, including cancellation timelines.',
};

export default async function RefundsPage() {
  const siteContent = await getSiteContent().catch(() => ({} as Record<string, string>));

  return (
    <LegalShell title="Refund Policy" effectiveDate="July 8, 2026" siteContent={siteContent}>
      <p>
        Nagarta Youth Camp strives to provide a fair and transparent refund process for all
        participants.
      </p>

      <h2>Registration Fees</h2>
      <p>
        Camp registration secures a participant&apos;s place in our five (5) day youth camp and covers
        planning, accommodation (where applicable), meals, programme materials, staffing, and other
        operational expenses.
      </p>

      <h2>Participant Cancellation</h2>
      <ul>
        <li>
          Cancellation <strong>30 days or more</strong> before the camp start date: Eligible for a full
          refund, less any non-refundable payment processing fees.
        </li>
        <li>
          Cancellation <strong>15–29 days</strong> before the camp start date: Eligible for a 50%
          refund.
        </li>
        <li>
          Cancellation <strong>less than 15 days</strong> before the camp start date: No refund will
          normally be provided.
        </li>
      </ul>

      <h2>Failure to Attend</h2>
      <p>
        Participants who fail to attend the camp without prior notice are not eligible for a refund.
      </p>

      <h2>Participant Removal</h2>
      <p>
        Participants dismissed for violating camp rules or engaging in misconduct are not eligible for
        any refund.
      </p>

      <h2>Camp Cancellation</h2>
      <p>
        If Nagarta Youth Camp cancels a programme due to reasons within our control, participants may
        choose either:
      </p>
      <ul>
        <li>A full refund; or</li>
        <li>A transfer of their registration to a future camp.</li>
      </ul>

      <h2>Force Majeure</h2>
      <p>
        Where events beyond our reasonable control (including natural disasters, public health
        emergencies, government restrictions, or other unforeseen events) affect camp operations,
        Nagarta Youth Camp may reschedule the programme or offer alternative arrangements. Refund
        decisions will be made based on the specific circumstances.
      </p>

      <h2>Refund Processing</h2>
      <p>
        Approved refunds will normally be processed to the original payment method within{' '}
        <strong>7–14 business days</strong>, depending on the payment provider and financial
        institution.
      </p>

      <h2>Contact</h2>
      <p>
        For refund requests or questions, please <Link href="/contact">contact us</Link> using the
        contact details provided on our website.
      </p>
    </LegalShell>
  );
}
