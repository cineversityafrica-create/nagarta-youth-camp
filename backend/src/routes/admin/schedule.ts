import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();
router.use(authenticate, requireAdmin);

const schema = z.object({
  dayNumber: z.number().int().min(1).max(10),
  date: z.string(),
  title: z.string().min(2),
  summary: z.string(),
  details: z.string().optional(),
});

router.get('/', async (_req, res) => {
  return res.json(await prisma.scheduleDay.findMany({ orderBy: { dayNumber: 'asc' } }));
});

router.put('/:id', async (req, res) => {
  const result = schema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });
  return res.json(await prisma.scheduleDay.update({ where: { id: req.params.id }, data: result.data }));
});

export default router;
