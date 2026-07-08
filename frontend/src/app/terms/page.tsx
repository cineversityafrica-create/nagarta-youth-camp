import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteContent } from '@/lib/api';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Terms of Service — NAGARTA Youth Camp',
  description: 'The terms governing use of the NAGARTA Youth Camp website and participation in our programmes.',
};

export default async function TermsPage() {
  const siteContent = await getSiteContent().catch(() => ({} as Record<string, string>));

  return (
    <LegalShell title="Terms of Service" effectiveDate="July 8, 2026" siteContent={siteContent}>
      <p>
        Welcome to Nagarta Youth Camp. These Terms of Service govern your use of our website and
        participation in our youth camp programmes. By registering for our camp or using our website,
        you agree to these Terms.
      </p>

      <h2>1. About Nagarta Youth Camp</h2>
      <p>
        Nagarta Youth Camp is a five (5) day youth development programme designed to inspire, educate,
        and empower young people through leadership training, personal development, teamwork,
        recreational activities, and mentorship.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        Participants must meet the age requirements specified for each camp programme. Where
        participants are under 18 years of age, registration must be completed with the consent of a
        parent or legal guardian.
      </p>

      <h2>3. Registration</h2>
      <p>Registration is only confirmed after:</p>
      <ul>
        <li>A completed registration form has been submitted.</li>
        <li>The applicable camp fee has been paid in full or according to any approved payment arrangement.</li>
        <li>Confirmation has been sent by Nagarta Youth Camp.</li>
      </ul>

      <h2>4. Participant Conduct</h2>
      <p>All participants are expected to:</p>
      <ul>
        <li>Treat fellow participants, staff, volunteers, and guests with respect.</li>
        <li>Follow all camp rules and safety instructions.</li>
        <li>Refrain from bullying, discrimination, harassment, violence, or abusive behaviour.</li>
        <li>Avoid possession or use of illegal drugs, alcohol, tobacco products, or dangerous items.</li>
        <li>Respect camp property and facilities.</li>
      </ul>
      <p>
        Nagarta Youth Camp reserves the right to dismiss any participant whose conduct endangers others
        or disrupts camp activities. In such cases, no refund may be issued.
      </p>

      <h2>5. Health and Safety</h2>
      <p>
        Participants must provide accurate medical information during registration, including allergies,
        medications, or medical conditions that may require attention.
      </p>
      <p>
        Parents or guardians authorize Nagarta Youth Camp staff to seek appropriate medical care in the
        event of an emergency if they cannot be reached promptly.
      </p>

      <h2>6. Photography and Media</h2>
      <p>
        During camp activities, photographs and videos may be taken for educational, promotional, and
        documentation purposes.
      </p>
      <p>
        By registering, participants or their parents/guardians consent to the use of such media unless
        they notify Nagarta Youth Camp in writing before the programme begins.
      </p>

      <h2>7. Programme Changes</h2>
      <p>
        Nagarta Youth Camp reserves the right to modify schedules, speakers, venues, activities, or
        programme content when necessary to improve participant experience or respond to unforeseen
        circumstances.
      </p>

      <h2>8. Cancellation</h2>
      <p>
        Nagarta Youth Camp may cancel or postpone a programme due to circumstances beyond our reasonable
        control, including severe weather, government directives, health emergencies, or other
        unforeseen events.
      </p>
      <p>Participants will be informed promptly if such changes occur.</p>

      <h2>9. Limitation of Liability</h2>
      <p>
        While reasonable care is taken to ensure participant safety, Nagarta Youth Camp shall not be
        liable for loss of personal belongings, injuries resulting from failure to follow instructions,
        or events beyond our reasonable control.
      </p>

      <h2>10. Intellectual Property</h2>
      <p>
        All website content, programme materials, logos, graphics, videos, and publications remain the
        property of Nagarta Youth Camp unless otherwise stated. They may not be copied or reproduced
        without written permission.
      </p>

      <h2>11. Governing Law</h2>
      <p>These Terms shall be governed by the laws of the Republic of Ghana.</p>

      <h2>12. Contact Us</h2>
      <p>
        If you have any questions regarding these Terms of Service, please{' '}
        <Link href="/contact">contact us</Link> using the information provided on our website.
      </p>
    </LegalShell>
  );
}
