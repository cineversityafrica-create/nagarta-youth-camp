import { Router } from 'express';
import { z } from 'zod';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { notificationService } from '../../services/NotificationService';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  const registrations = await prisma.registration.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      child: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(registrations);
});

router.get('/export', async (_req, res) => {
  const registrations = await prisma.registration.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      child: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = registrations.map((r) => ({
    Reference: r.referenceCode,
    Type: r.type,
    Status: r.status,
    Payment: r.paymentStatus,
    'Registered By': r.user.name,
    'User Email': r.user.email,
    'User Phone': r.user.phone || '',
    'Child Name': r.child?.name || '',
    'Child Age': r.child?.age || '',
    'Child School': r.child?.school || '',
    'Dietary Needs': r.child?.dietaryNeeds || '',
    'Medical Notes': r.child?.medicalNotes || '',
    'Emergency Contact': r.child?.emergencyContact || '',
    Notes: r.notes || '',
    'Registered On': r.createdAt.toISOString(),
  }));

  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=nagarta-registrations.csv');
  return res.send(csv);
});

router.patch('/:id', async (req, res) => {
  const schema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED']).optional(),
    paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Validation failed' });

  // Fetch the current registration to check for status changes
  const oldReg = await prisma.registration.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } }, child: true },
  });

  if (!oldReg) return res.status(404).json({ error: 'Registration not found' });

  const oldStatus = oldReg.status;
  const newStatus = result.data.status || oldStatus;

  const reg = await prisma.registration.update({ where: { id: req.params.id }, data: result.data });

  // Send status update email if status changed (async, non-blocking)
  if (oldStatus !== newStatus && oldReg.user) {
    notificationService.sendStatusUpdate(
      oldReg.user.id,
      oldReg.child?.name || oldReg.user.name,
      oldReg.user.name,
      oldReg.user.email,
      oldStatus,
      newStatus,
      oldReg.referenceCode,
      oldReg.id
    ).catch(err => console.error('[registrations/patch] Failed to send status update email:', err));
  }

  return res.json(reg);
});

export default router;
