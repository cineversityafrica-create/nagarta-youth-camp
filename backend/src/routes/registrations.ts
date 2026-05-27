import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

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
  const result = registrationSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
  }

  const userId = req.user!.userId;
  const data = result.data;

  if (data.type === 'SELF') {
    const reg = await prisma.registration.create({
      data: { userId, type: 'SELF', notes: data.notes },
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
    },
  });
  return res.status(201).json({ referenceCode: reg.referenceCode, status: reg.status });
});

router.get('/my', authenticate, async (req: AuthRequest, res) => {
  const regs = await prisma.registration.findMany({
    where: { userId: req.user!.userId },
    include: { child: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(regs);
});

export default router;
