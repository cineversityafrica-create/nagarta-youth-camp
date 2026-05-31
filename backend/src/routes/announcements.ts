import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const announcements = await prisma.announcement.findMany({
      where: {
        published: true,
        OR: [{ targetRole: null }, { targetRole: role }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(announcements);
  } catch (err) {
    console.error('[announcements/get]', err);
    return res.status(500).json({ error: 'Failed to load announcements.' });
  }
});

export default router;
