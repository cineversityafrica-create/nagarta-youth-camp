import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const activities = await prisma.activity.findMany({ orderBy: { displayOrder: 'asc' } });
  return res.json(activities);
});

export default router;
