import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { notificationService } from '../services/NotificationService';

const router = Router();

function generateRefCode(): string {
  const digits  = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
  const letters = Array.from({ length: 4 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');
  return `NAG${digits}${letters}`;
}

const selfSchema = z.object({
  type: z.literal('SELF'),
  notes: z.string().optional(),
});

const childSchema = z.object({
  type: z.literal('CHILD'),
  child: z.object({
    name: z.string().min(2),
    age: z.number().int().min(12).max(18),
    gender: z.string().optional(),
    school: z.string().optional(),
    dietaryNeeds: z.string().optional(),
    medicalNotes: z.string().optional(),
    emergencyContact: z.string().optional(),
    photo: z.string().optional(),
  }),
  notes: z.string().optional(),
  parentName: z.string().optional(),
  parentAddress: z.string().optional(),
  parentPhone: z.string().optional(),
  // Mother's information
  motherName: z.string().optional(),
  motherAddress: z.string().optional(),
  motherPhone: z.string().optional(),
  motherEmail: z.string().optional(),
  motherEmergencyContact: z.string().optional(),
  // Father's information
  fatherName: z.string().optional(),
  fatherAddress: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEmail: z.string().optional(),
  fatherEmergencyContact: z.string().optional(),
});

const registrationSchema = z.discriminatedUnion('type', [selfSchema, childSchema]);

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = registrationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    }

    const userId = req.user!.userId;
    const data = result.data;

    // Fetch user for email notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (data.type === 'SELF') {
      const reg = await prisma.registration.create({
        data: { userId, type: 'SELF', notes: data.notes, referenceCode: generateRefCode() },
      });

      // Send registration confirmation email (async, non-blocking)
      notificationService.sendRegistrationConfirmation(
        userId,
        user.name,
        user.name,
        user.email,
        reg.referenceCode,
        'SELF',
        reg.id
      ).catch(err => console.error('[registrations] Failed to send confirmation email:', err));

      return res.status(201).json({ referenceCode: reg.referenceCode, status: reg.status });
    }

    const child = await prisma.child.create({
      data: { parentId: userId, ...data.child },
    });
    const reg = await prisma.registration.create({
      data: {
        userId,
        childId: child.id,
        type: 'CHILD',
        notes: data.notes,
        parentName: data.parentName,
        parentAddress: data.parentAddress,
        parentPhone: data.parentPhone,
        // Mother's information
        motherName: data.motherName,
        motherAddress: data.motherAddress,
        motherPhone: data.motherPhone,
        motherEmail: data.motherEmail,
        motherEmergencyContact: data.motherEmergencyContact,
        // Father's information
        fatherName: data.fatherName,
        fatherAddress: data.fatherAddress,
        fatherPhone: data.fatherPhone,
        fatherEmail: data.fatherEmail,
        fatherEmergencyContact: data.fatherEmergencyContact,
        referenceCode: generateRefCode(),
      },
    });

    // Send registration confirmation email (async, non-blocking)
    notificationService.sendRegistrationConfirmation(
      userId,
      data.child.name,
      data.parentName || user.name,
      user.email,
      reg.referenceCode,
      'CHILD',
      reg.id
    ).catch(err => console.error('[registrations] Failed to send confirmation email:', err));

    return res.status(201).json({ referenceCode: reg.referenceCode, status: reg.status });
  } catch (err) {
    console.error('[registrations/post]', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.get('/my', authenticate, async (req: AuthRequest, res) => {
  try {
    const regs = await prisma.registration.findMany({
      where: { userId: req.user!.userId },
      include: {
        child: true,
        transactions: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach amountPaid (in cedis) computed from transactions (stored in pesewas)
    const withTotals = regs.map((r) => ({
      ...r,
      amountPaid: r.transactions.reduce((sum, t) => sum + t.amount, 0) / 100,
    }));

    return res.json(withTotals);
  } catch (err) {
    console.error('[registrations/my]', err);
    return res.status(500).json({ error: 'Failed to load registrations. Please try again.' });
  }
});

export default router;
