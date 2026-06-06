import { getSiteContent, getActivities, getSchedule, Activity, ScheduleDay } from '@/lib/api';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import LogoWatermark from '@/components/LogoWatermark';
import QuickFacts from '@/components/QuickFacts';
import ExperienceSection from '@/components/ExperienceSection';
import AboutSection from '@/components/AboutSection';
import ScheduleSection from '@/components/ScheduleSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';

export const revalidate = 5; // Re-fetch site content every 5 seconds

// Default values — used when the DB is empty or the backend is unreachable
const CONTENT_DEFAULTS: Record<string, string> = {
  hero_eyebrow: 'DEC 19 – 23 · 2026 · ACCRA',
  hero_heading: 'Arise & Lead',
  hero_subheading: 'A transformative 5-day experience',
  hero_urgency: 'Limited Spots Available — Register Now, Before You Lose the Spot!',
  about_heading: 'Shaping the Leaders of Tomorrow',
  about_para1: 'NAGARTA Youth Camp is a premier leadership development experience for young people aged 12–18.',
  about_para2: 'Founded on the conviction that great leaders are built, and not just born.',
  about_para3: 'Every session is intentionally designed to draw out courage, discipline and vision.',
  camp_dates: '19th – 23rd December 2026',
  camp_location: 'Accra, Ghana',
  camp_venue: 'Premium University Campus',
  camp_duration: '5 Days',
  cta_heading: 'Your spot is waiting.',
  contact_email: 'info@nagartayouthcamp.com',
  contact_phone: '0550 17 17 17 / 0243 60 88 72',
  contact_address: 'Accra, Ghana',
  social_instagram: 'https://instagram.com/nagartacamp',
  social_facebook: 'https://facebook.com/nagartacamp',
  social_twitter: 'https://x.com/nagartacamp',
  social_tiktok: 'https://tiktok.com/@nagartacamp',
};

// Default fallback activities
const DEFAULT_ACTIVITIES: Activity[] = [
  { id: '1', title: 'Leadership Training', subtitle: 'Master the skills of influential leaders', iconName: 'presentation', displayOrder: 0 },
  { id: '2', title: 'Team Building', subtitle: 'Build strong connections and teamwork', iconName: 'users', displayOrder: 1 },
  { id: '3', title: 'Personal Growth', subtitle: 'Develop character and confidence', iconName: 'shield', displayOrder: 2 },
  { id: '4', title: 'Mentorship', subtitle: 'Learn from industry leaders', iconName: 'heart', displayOrder: 3 },
];

// Default fallback schedule
const DEFAULT_SCHEDULE: ScheduleDay[] = [
  { id: '1', dayNumber: 1, date: 'Monday, 19 December', title: 'Orientation & Welcome', summary: 'Arrival, registration, orientation, icebreakers', details: '' },
  { id: '2', dayNumber: 2, date: 'Tuesday, 20 December', title: 'Vision & Purpose', summary: 'Opening ceremony, keynote, vision workshop, talent auditions', details: '' },
  { id: '3', dayNumber: 3, date: 'Wednesday, 21 December', title: 'Character & Courage', summary: 'Discipline drills, character seminar, mentorship, talent showcase', details: '' },
  { id: '4', dayNumber: 4, date: 'Thursday, 22 December', title: 'Service & Influence', summary: 'Community service, leadership workshop, debates, campfire', details: '' },
  { id: '5', dayNumber: 5, date: 'Friday, 23 December', title: 'Commissioning & Awards', summary: 'Leadership challenge, testimonies, Awards Night, departure', details: '' },
];

export default async function HomePage() {
  let rawContent: Record<string, string> = {};
  let activities: Activity[] = DEFAULT_ACTIVITIES;
  let schedule: ScheduleDay[] = DEFAULT_SCHEDULE;

  try {
    rawContent = await getSiteContent();
  } catch (error) {
    console.warn('Failed to fetch site content, using defaults:', error);
  }

  try {
    const fetched = await getActivities();
    if (fetched && fetched.length > 0) activities = fetched;
  } catch (error) {
    console.warn('Failed to fetch activities, using defaults:', error);
  }

  try {
    const fetched = await getSchedule();
    if (fetched && fetched.length > 0) schedule = fetched;
  } catch (error) {
    console.warn('Failed to fetch schedule, using defaults:', error);
  }

  // Merge: API data wins, but defaults fill in any missing keys
  const content: Record<string, string> = { ...CONTENT_DEFAULTS, ...rawContent };

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
        <PricingSection />
        <TestimonialsSection />
        <CTASection heading={content.cta_heading} />
      </main>
      <Footer content={content} />
    </>
  );
}
