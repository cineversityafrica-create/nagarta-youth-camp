import type { Metadata } from 'next';
import SharePoster from '@/components/SharePoster';

const TITLE = "This isn't just a camp. It's a turning point.";
const DESCRIPTION = 'Five powerful days to build character, discover purpose, and equip your child to lead with confidence. Youths aged 12–18. Limited spaces — secure their place today.';
const IMAGE = '/poster-join.jpg';

export const metadata: Metadata = {
  title: `NAGARTA Youth Camp 2026 — ${TITLE}`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: 'https://nagartayouthcamp.tech/p/join',
    siteName: 'NAGARTA Youth Camp',
    images: [{ url: IMAGE, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
};

export default function JoinSharePage() {
  return <SharePoster image={IMAGE} alt={TITLE} />;
}
