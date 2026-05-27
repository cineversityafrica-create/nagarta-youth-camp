import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', async (_req, res) => {
  const items = await prisma.siteContent.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  return res.json(items);
});

router.put('/:key', async (req, res) => {
  const schema = z.object({ value: z.string() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });

  const item = await prisma.siteContent.update({
    where: { key: req.params.key },
    data: { value: result.data.value },
  });
  return res.json(item);
});

export default router;
