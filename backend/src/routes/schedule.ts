import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const days = await prisma.scheduleDay.findMany({ orderBy: { dayNumber: 'asc' } });
  return res.json(days);
});

export default router;
