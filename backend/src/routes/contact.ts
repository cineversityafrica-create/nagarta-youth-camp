import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

router.post('/', async (req, res) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    }
    await prisma.contactMessage.create({ data: result.data });
    return res.status(201).json({ success: true, message: 'Message received. We will be in touch.' });
  } catch (err) {
    console.error('[contact/post]', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

export default router;
