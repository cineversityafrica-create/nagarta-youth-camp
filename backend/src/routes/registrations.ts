import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

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
    age: z.number().int().min(8).max(25),
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

    if (data.type === 'SELF') {
      const reg = await prisma.registration.create({
        data: { userId, type: 'SELF', notes: data.notes, referenceCode: generateRefCode() },
      });
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
        referenceCode: generateRefCode(),
      },
    });
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
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(regs);
  } catch (err) {
    console.error('[registrations/my]', err);
    return res.status(500).json({ error: 'Failed to load registrations. Please try again.' });
  }
});

export default router;
