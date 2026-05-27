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

export default async function HomePage() {
  const [content, activities, schedule] = await Promise.all([
    getSiteContent(),
    getActivities(),
    getSchedule(),
  ]);

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
