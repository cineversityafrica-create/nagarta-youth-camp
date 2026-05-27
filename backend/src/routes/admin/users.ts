import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true, role: true, suspended: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(users);
});

router.patch('/:id', async (req, res) => {
  const schema = z.object({
    role: z.enum(['PARENT', 'CAMPER', 'ADMIN']).optional(),
    suspended: z.boolean().optional(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });

  const data: { role?: string; suspended?: boolean } = {};
  if (result.data.role) data.role = result.data.role;
  if (typeof result.data.suspended === 'boolean') data.suspended = result.data.suspended;

  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, email: true, name: true, role: true, suspended: true } });
  return res.json(user);
});

router.delete('/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

export default router;
