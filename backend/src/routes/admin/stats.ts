import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();

router.get('/', authenticate, requireAdmin, async (_req, res) => {
  const [totalRegistrations, pendingRegistrations, confirmedRegistrations, totalUsers, recentRegistrations, totalMessages] =
    await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: 'PENDING' } }),
      prisma.registration.count({ where: { status: 'CONFIRMED' } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.registration.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, child: { select: { name: true } } } }),
      prisma.contactMessage.count({ where: { resolved: false } }),
    ]);

  const capacity = parseInt((await prisma.siteContent.findUnique({ where: { key: 'camp_capacity' } }))?.value || '200');
  const spotsRemaining = Math.max(0, capacity - totalRegistrations);

  return res.json({
    totalRegistrations,
    pendingRegistrations,
    confirmedRegistrations,
    totalUsers,
    spotsRemaining,
    capacity,
    unreadMessages: totalMessages,
    recentRegistrations,
  });
});

export default router;
