import type { Metadata } from 'next';
import SharePoster from '@/components/SharePoster';

const TITLE = 'NAGARTA Youth Camp 2026 — Arise & Lead';
const DESCRIPTION = 'Discover purpose. Build character. Lead with courage. A transformational 5-day journey for youths aged 12–18. 19–23 December 2026, Accra, Ghana.';
const IMAGE = '/poster-arise.jpg';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: 'https://nagartayouthcamp.tech/p/arise',
    siteName: 'NAGARTA Youth Camp',
    images: [{ url: IMAGE, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
};

export default function AriseSharePage() {
  return <SharePoster image={IMAGE} alt={TITLE} />;
}
