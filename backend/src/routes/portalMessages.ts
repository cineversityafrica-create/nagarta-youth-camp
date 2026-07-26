import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/portal-messages — the signed-in parent's personal inbox.
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.portalMessage.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, readAt: true, createdAt: true },
    });
    return res.json(messages);
  } catch (err) {
    console.error('[portal-messages/get]', err);
    return res.status(500).json({ error: 'Failed to load your messages.' });
  }
});

// POST /api/portal-messages/:id/read — mark one as read. Scoped to the owner so
// a parent can never touch another parent's message.
router.post('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await prisma.portalMessage.updateMany({
      where: { id: req.params.id, userId: req.user!.userId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.json({ success: true, updated: result.count });
  } catch (err) {
    console.error('[portal-messages/read]', err);
    return res.status(500).json({ error: 'Could not update the message.' });
  }
});

export default router;
