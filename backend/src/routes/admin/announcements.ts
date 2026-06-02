import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { notificationService } from '../../services/NotificationService';

const router = Router();
router.use(authenticate, requireAdmin);

const schema = z.object({
  title: z.string().min(2),
  body: z.string().min(5),
  published: z.boolean().default(true),
  targetRole: z.string().nullable().optional(),
});

router.get('/', async (_req, res) => {
  return res.json(await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/', async (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });

  const announcement = await prisma.announcement.create({ data: result.data });

  // Send announcement emails if published (async, non-blocking)
  if (announcement.published) {
    notificationService.sendAnnouncement(
      announcement.id,
      announcement.title,
      announcement.body,
      announcement.targetRole || null
    ).catch(err => console.error('[announcements/post] Failed to send announcement emails:', err));
  }

  return res.status(201).json(announcement);
});

router.put('/:id', async (req, res) => {
  const result = schema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });
  return res.json(await prisma.announcement.update({ where: { id: req.params.id }, data: result.data }));
});

router.delete('/:id', async (req, res) => {
  await prisma.announcement.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

export default router;
