import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.siteContent.findMany({ orderBy: { group: 'asc' } });
  const map: Record<string, string> = {};
  for (const item of items) {
    map[item.key] = item.value;
  }
  return res.json(map);
});

export default router;
