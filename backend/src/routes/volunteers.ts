import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Mirrors the camper code shape (NAG…) so staff can tell the two apart at a
// glance while both scan identically at the station.
function generateVolRefCode(): string {
  const digits = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
  const letters = Array.from({ length: 4 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');
  return `VOL${digits}${letters}`;
}

// POST /api/volunteers — submit a volunteer application. The full questionnaire
// is stored as-is in `data`; a few identity fields are pulled out as columns.
router.post('/', async (req, res) => {
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim();
    if (fullName.length < 2 || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide your full name and a valid email address.' });
    }
    const phone = String(body.mobile || body.phone || '').trim() || null;
    const skills = Array.isArray(body.skills) ? (body.skills as string[]).join(', ') : (body.skills ? String(body.skills) : null);

    // Retry on the astronomically unlikely chance of a code collision
    let created: { referenceCode: string | null } | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      try {
        created = await prisma.volunteerApplication.create({
          data: { fullName, email, phone, skills, data: body as object, referenceCode: generateVolRefCode() },
          select: { referenceCode: true },
        });
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code !== 'P2002' || attempt === 4) throw e; // P2002 = unique constraint
      }
    }

    return res.status(201).json({
      success: true,
      referenceCode: created?.referenceCode ?? null,
      message: 'Application received. Thank you for volunteering!',
    });
  } catch (err) {
    console.error('[volunteers/post]', err);
    return res.status(500).json({ error: 'Failed to submit your application. Please try again.' });
  }
});

export default router;
