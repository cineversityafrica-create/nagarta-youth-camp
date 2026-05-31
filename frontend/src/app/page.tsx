import { getSiteContent, getActivities, getSchedule } from '@/lib/api';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import LogoWatermark from '@/components/LogoWatermark';
import QuickFacts from '@/components/QuickFacts';
import ExperienceSection from '@/components/ExperienceSection';
import AboutSection from '@/components/AboutSection';
import ScheduleSection from '@/components/ScheduleSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export const revalidate = 60;

// Default values — used when the DB is empty or the backend is unreachable
const CONTENT_DEFAULTS: Record<string, string> = {
  hero_eyebrow: 'DEC 19 – 23 · 2026 · ACCRA',
  hero_heading: 'Arise & Lead',
  hero_subheading: 'A transformative 5-day experience',
  hero_urgency: 'Limited Spots Available — Register Now, Before You Lose the Spot!',
  about_heading: 'Shaping the Leaders of Tomorrow',
  about_para1: 'NAGARTA Youth Camp is a premier leadership development experience for young people aged 13–25.',
  about_para2: 'Founded on the conviction that great leaders are built, not born.',
  about_para3: 'Every session is intentionally designed to draw out courage, discipline, and vision.',
  camp_dates: '19th – 23rd December 2026',
  camp_location: 'Accra, Ghana',
  camp_venue: 'Premium University Campus',
  camp_duration: '5 Days',
  cta_heading: 'Your spot is waiting.',
  contact_email: 'info@nagartacamp.com',
  contact_phone: '+233 20 000 0000',
  contact_address: 'Accra, Ghana',
  social_instagram: 'https://instagram.com/nagartacamp',
  social_facebook: 'https://facebook.com/nagartacamp',
  social_twitter: 'https://x.com/nagartacamp',
  social_tiktok: 'https://tiktok.com/@nagartacamp',
};

export default async function HomePage() {
  const [rawContent, activities, schedule] = await Promise.all([
    getSiteContent(),
    getActivities(),
    getSchedule(),
  ]);

  // Merge: API data wins, but defaults fill in any missing keys
  const content = { ...CONTENT_DEFAULTS, ...rawContent };

  return (
    <>
      <LogoWatermark />
      <Header />
      <main>
        <HeroSection
          eyebrow={content.hero_eyebrow}
          heading={content.hero_heading}
          subheading={content.hero_subheading}
          urgency={content.hero_urgency}
        />
        <QuickFacts
          location={content.camp_location}
          duration={content.camp_duration}
          venue={content.camp_venue}
        />
        <ExperienceSection activities={activities} />
        <AboutSection
          heading={content.about_heading}
          para1={content.about_para1}
          para2={content.about_para2}
          para3={content.about_para3}
        />
        <ScheduleSection days={schedule} />
        <TestimonialsSection />
        <CTASection heading={content.cta_heading} />
      </main>
      <Footer content={content} />
    </>
  );
}
