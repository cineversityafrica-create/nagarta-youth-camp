import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();
router.use(authenticate, requireAdmin);

const schema = z.object({
  title: z.string().min(2),
  subtitle: z.string(),
  iconName: z.string().default('star'),
  displayOrder: z.number().int().default(0),
});

router.get('/', async (_req, res) => {
  return res.json(await prisma.activity.findMany({ orderBy: { displayOrder: 'asc' } }));
});

router.post('/', async (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });
  return res.status(201).json(await prisma.activity.create({ data: result.data }));
});

router.put('/:id', async (req, res) => {
  const result = schema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });
  return res.json(await prisma.activity.update({ where: { id: req.params.id }, data: result.data }));
});

router.delete('/:id', async (req, res) => {
  await prisma.activity.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

export default router;
