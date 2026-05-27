import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  const announcements = await prisma.announcement.findMany({
    where: {
      published: true,
      OR: [{ targetRole: null }, { targetRole: role }],
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(announcements);
});

export default router;
