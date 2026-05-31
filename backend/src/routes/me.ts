import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[me/get]', err);
    return res.status(500).json({ error: 'Failed to load profile. Please try again.' });
  }
});

export default router;
