import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

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

    await prisma.volunteerApplication.create({
      data: { fullName, email, phone, skills, data: body as object },
    });
    return res.status(201).json({ success: true, message: 'Application received. Thank you for volunteering!' });
  } catch (err) {
    console.error('[volunteers/post]', err);
    return res.status(500).json({ error: 'Failed to submit your application. Please try again.' });
  }
});

export default router;
