import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nagartacamp.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026!';
  const adminName = process.env.ADMIN_NAME || 'Camp Administrator';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        name: adminName,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Site content (key-value pairs)
  const siteContentData = [
    // Hero
    { key: 'hero_eyebrow', value: 'DEC 19 – 23 · 2026 · ACCRA', label: 'Hero Eyebrow Text', group: 'hero' },
    { key: 'hero_heading', value: 'Arise & Lead', label: 'Hero Main Heading', group: 'hero' },
    { key: 'hero_subheading', value: 'A transformative 5-day experience', label: 'Hero Sub-heading', group: 'hero' },
    { key: 'hero_urgency', value: 'Limited Spots Available — Register Now, Before You Lose the Spot!', label: 'Hero Urgency Line', group: 'hero' },
    // About
    { key: 'about_heading', value: 'Shaping the Leaders of Tomorrow', label: 'About Section Heading', group: 'about' },
    { key: 'about_para1', value: 'NAGARTA Youth Camp is a premier leadership development experience designed for young people aged 13–25. Set against the vibrant backdrop of Accra, Ghana, our five-day immersive programme combines rigorous leadership training, outdoor adventures, and spiritual formation to forge the next generation of African leaders.', label: 'About Paragraph 1', group: 'about' },
    { key: 'about_para2', value: 'Founded on the conviction that great leaders are built, not born, NAGARTA brings together coaches, mentors, and experienced facilitators from across the continent. Participants leave not just with new skills, but with a transformed mindset and a lifelong network of peers who share their values.', label: 'About Paragraph 2', group: 'about' },
    { key: 'about_para3', value: 'Every session, every drill, every evening campfire is intentionally designed to draw out courage, discipline, and vision. This is not a holiday — it is a launchpad.', label: 'About Paragraph 3', group: 'about' },
    // Camp Details
    { key: 'camp_dates', value: '19th – 23rd December 2026', label: 'Camp Dates', group: 'details' },
    { key: 'camp_location', value: 'Accra, Ghana', label: 'Camp Location', group: 'details' },
    { key: 'camp_venue', value: 'Premium University Campus', label: 'Camp Venue', group: 'details' },
    { key: 'camp_duration', value: '5 Days', label: 'Camp Duration', group: 'details' },
    { key: 'camp_capacity', value: '200', label: 'Total Capacity (spots)', group: 'details' },
    // CTA Banner
    { key: 'cta_heading', value: 'Your spot is waiting.', label: 'CTA Banner Heading', group: 'cta' },
    // Contact
    { key: 'contact_email', value: 'info@nagartacamp.com', label: 'Contact Email', group: 'contact' },
    { key: 'contact_phone', value: '+233 20 000 0000', label: 'Contact Phone', group: 'contact' },
    { key: 'contact_address', value: 'Accra, Ghana', label: 'Contact Address', group: 'contact' },
    // Social
    { key: 'social_instagram', value: 'https://instagram.com/nagartacamp', label: 'Instagram URL', group: 'social' },
    { key: 'social_facebook', value: 'https://facebook.com/nagartacamp', label: 'Facebook URL', group: 'social' },
    { key: 'social_twitter', value: 'https://x.com/nagartacamp', label: 'X (Twitter) URL', group: 'social' },
    { key: 'social_tiktok', value: 'https://tiktok.com/@nagartacamp', label: 'TikTok URL', group: 'social' },
    // SEO
    { key: 'meta_title', value: 'NAGARTA Youth Camp 2026 — Arise & Lead', label: 'Meta Title', group: 'seo' },
    { key: 'meta_description', value: 'A transformative 5-day leadership camp for youth aged 13–25. 19–23 December 2026, Accra, Ghana. Limited spots available.', label: 'Meta Description', group: 'seo' },
  ];

  for (const item of siteContentData) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value, label: item.label, group: item.group },
      create: item,
    });
  }
  console.log('Site content seeded.');

  // Activities
  const activities = [
    { title: 'Leadership Seminars', subtitle: 'World-class facilitators deliver high-impact sessions on influence, vision, and character.', iconName: 'presentation', displayOrder: 1 },
    { title: 'Outdoor Adventures', subtitle: 'Rope courses, orienteering, and team challenges that forge resilience and trust.', iconName: 'mountain', displayOrder: 2 },
    { title: 'Discipline & Drills', subtitle: 'Structured physical training sessions that instil focus, perseverance, and order.', iconName: 'shield', displayOrder: 3 },
    { title: 'Mentorship & Life Skills', subtitle: 'One-on-one and small-group mentoring from industry leaders across Ghana and Africa.', iconName: 'users', displayOrder: 4 },
    { title: 'Faith Sessions', subtitle: 'Morning devotionals and evening reflections to anchor purpose and build inner strength.', iconName: 'heart', displayOrder: 5 },
    { title: 'Competitions & Talent Showcase', subtitle: 'Debates, oratory contests, creative arts, and talent performances — every gift celebrated.', iconName: 'trophy', displayOrder: 6 },
    { title: 'Awards Night', subtitle: 'A gala ceremony honoring excellence, growth, and outstanding leadership among campers.', iconName: 'star', displayOrder: 7 },
  ];

  await prisma.activity.deleteMany();
  for (const activity of activities) {
    await prisma.activity.create({ data: activity });
  }
  console.log('Activities seeded.');

  // Schedule
  const scheduleDays = [
    { dayNumber: 1, date: 'Saturday, 19 December', title: 'Arrival & Orientation', summary: 'Welcome ceremony, campus tour, team assignments, icebreakers, and opening ceremony with keynote address.' },
    { dayNumber: 2, date: 'Sunday, 20 December', title: 'Identity & Vision', summary: 'Morning devotional, leadership seminar on personal identity, outdoor adventure activities, and evening reflections.' },
    { dayNumber: 3, date: 'Monday, 21 December', title: 'Character & Courage', summary: 'Discipline drills at dawn, character formation seminar, mentorship sessions, talent showcase auditions, team competitions.' },
    { dayNumber: 4, date: 'Tuesday, 22 December', title: 'Service & Influence', summary: 'Community service project, seminar on servant leadership, life skills workshop, group debates, and evening campfire.' },
    { dayNumber: 5, date: 'Wednesday, 23 December', title: 'Commissioning & Awards', summary: 'Final leadership challenge, testimonies and celebration, grand Awards Night gala, commissioning ceremony, and departure.' },
  ];

  await prisma.scheduleDay.deleteMany();
  for (const day of scheduleDays) {
    await prisma.scheduleDay.create({ data: day });
  }
  console.log('Schedule seeded.');

  // Announcements
  const announcements = [
    { title: 'Registration Now Open!', body: 'We are thrilled to announce that registration for NAGARTA Youth Camp 2026 is officially open. Spots are limited to 200 participants — secure your place today. Early registrants will receive a welcome kit upon arrival.', published: true, targetRole: null },
    { title: 'Packing List Released', body: 'The official NAGARTA 2026 packing list is now available. All campers and parents are advised to review the list carefully. Remember: comfortable athletic wear is required for Discipline & Drills sessions. The full list is attached to your registration confirmation.', published: true, targetRole: null },
    { title: 'Scholarship Applications Open', body: 'A limited number of full and partial scholarships are available for deserving young leaders who demonstrate exceptional potential but face financial constraints. Contact us at scholarships@nagartacamp.com with a short motivation letter and an academic reference by 30 November 2026.', published: true, targetRole: null },
  ];

  await prisma.announcement.deleteMany();
  for (const ann of announcements) {
    await prisma.announcement.create({ data: ann });
  }
  console.log('Announcements seeded.');

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
