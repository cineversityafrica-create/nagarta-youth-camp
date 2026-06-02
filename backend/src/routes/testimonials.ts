import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/testimonials
 * Fetch all published testimonials
 */
router.get('/', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(testimonials);
  } catch (err) {
    console.error('[testimonials]', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/**
 * GET /api/admin/testimonials
 * Admin: Fetch all testimonials (published & draft)
 */
router.get('/admin', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    res.json(testimonials);
  } catch (err) {
    console.error('[admin/testimonials]', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

export default router;
