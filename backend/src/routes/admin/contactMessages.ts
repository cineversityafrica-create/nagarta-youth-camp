import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', async (_req, res) => {
  return res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.patch('/:id/resolve', async (req, res) => {
  const msg = await prisma.contactMessage.update({ where: { id: req.params.id }, data: { resolved: true } });
  return res.json(msg);
});

router.delete('/:id', async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

export default router;
