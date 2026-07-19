import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { signToken, verifyToken } from '../lib/jwt';
import { AuthRequest } from '../middleware/authenticate';

const router = Router();

// Serve the standalone station page here (under /api/checkin so Nginx routes it
// to the backend without any extra config). URL: /api/checkin/station
router.get('/station', (_req, res) => res.render('checkin'));

// The station unlocks once with a shared passcode (STAFF_PASSCODE); after that
// guardians walk up and check their children in/out. Admins can also use it.
function stationAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyToken(auth.slice(7));
    if (payload.role !== 'STAFF' && payload.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Station access only' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// POST /api/checkin/login  { passcode } -> { token }
router.post('/login', (req, res) => {
  const passcode = (req.body?.passcode || '').toString();
  const expected = (process.env.STAFF_PASSCODE || '').toString();
  if (!expected) return res.status(500).json({ error: 'Check-in is not set up yet. Ask the admin to set a station passcode.' });
  if (!passcode || passcode !== expected) return res.status(401).json({ error: 'Incorrect passcode.' });
  const token = signToken({ userId: 'station', role: 'STAFF', email: 'station' });
  return res.json({ token });
});

// GET /api/checkin/lookup/:ref -> child card + current in/out status
router.get('/lookup/:ref', stationAuth, async (req, res) => {
  try {
    // Match case-insensitively rather than upper-casing the input. Codes from
    // generateRefCode() are upper-case, but the schema falls back to a
    // lower-case cuid() when one is not supplied, and older rows carry those.
    // Upper-casing such a code finds nothing, so its QR fails at the gate.
    const ref = (req.params.ref || '').trim();
    const reg = await prisma.registration.findFirst({
      where: { referenceCode: { equals: ref, mode: 'insensitive' } },
      include: { child: true, user: true, checkLogs: { orderBy: { createdAt: 'desc' }, take: 6 } },
    });

    if (!reg) {
      // Not a camper — try the volunteers, who scan the same way.
      const vol = await prisma.volunteerApplication.findFirst({
        where: { referenceCode: { equals: ref, mode: 'insensitive' } },
        include: { checkLogs: { orderBy: { createdAt: 'desc' }, take: 6 } },
      });
      if (!vol) return res.status(404).json({ error: 'No camper or volunteer found for that code.' });

      const d = (vol.data || {}) as Record<string, unknown>;
      const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : null);
      const lastVol = vol.checkLogs[0];
      return res.json({
        kind: 'VOLUNTEER',
        volunteerId: vol.id,
        referenceCode: vol.referenceCode,
        campId: vol.campId,
        status: vol.status,
        child: {
          name: vol.fullName,
          age: null,
          gender: str('gender'),
          school: vol.skills || null, // the station shows this line beneath the name
          photo: str('photo'),
        },
        onFile: { parentName: str('emgName'), parentPhone: str('emgPhone') || vol.phone },
        currentlyIn: lastVol?.type === 'IN',
        lastEvent: lastVol ? { type: lastVol.type, at: lastVol.createdAt } : null,
      });
    }

    const last = reg.checkLogs[0];
    return res.json({
      kind: 'CAMPER',
      registrationId: reg.id,
      referenceCode: reg.referenceCode,
      campId: reg.campId,
      child: {
        name: reg.child?.name || reg.user.name,
        age: reg.child?.age ?? null,
        gender: reg.child?.gender ?? null,
        school: reg.child?.school ?? null,
        photo: reg.child?.photo ?? null,
      },
      onFile: {
        parentName: reg.motherName || reg.fatherName || reg.parentName || reg.user.name,
        parentPhone: reg.motherPhone || reg.fatherPhone || reg.parentPhone || reg.user.phone || null,
      },
      currentlyIn: last?.type === 'IN',
      lastEvent: last ? { type: last.type, at: last.createdAt } : null,
    });
  } catch (err) {
    console.error('[checkin/lookup]', err);
    return res.status(500).json({ error: 'Lookup failed. Please try again.' });
  }
});

// POST /api/checkin/:registrationId
//   { type: 'IN'|'OUT', guardianName, guardianAddress, guardianPhone, ghanaCard }
// Records the event, assigns a camp ID number (1–1000) on first check-in, and
// returns the ID-card data for printing.
router.post('/:registrationId', stationAuth, async (req, res) => {
  try {
    const { type, guardianName, guardianAddress, guardianPhone, ghanaCard } = req.body || {};
    if (type !== 'IN' && type !== 'OUT') return res.status(400).json({ error: 'type must be IN or OUT' });

    const reg = await prisma.registration.findUnique({ where: { id: req.params.registrationId }, include: { child: true } });

    // Volunteers sign themselves in and out, so no guardian details are taken.
    if (!reg) {
      const vol = await prisma.volunteerApplication.findUnique({ where: { id: req.params.registrationId } });
      if (!vol) return res.status(404).json({ error: 'Registration not found' });

      let volCampId = vol.campId;
      if (volCampId == null) {
        const maxVol = await prisma.volunteerApplication.aggregate({ _max: { campId: true } });
        volCampId = Math.min((maxVol._max.campId || 0) + 1, 1000);
        await prisma.volunteerApplication.update({ where: { id: vol.id }, data: { campId: volCampId } });
      }

      await prisma.checkLog.create({ data: { volunteerId: vol.id, type } });

      const vd = (vol.data || {}) as Record<string, unknown>;
      return res.status(201).json({
        success: true,
        kind: 'VOLUNTEER',
        type,
        campId: volCampId,
        referenceCode: vol.referenceCode,
        child: {
          name: vol.fullName,
          age: null,
          gender: typeof vd.gender === 'string' ? vd.gender : null,
          photo: typeof vd.photo === 'string' ? vd.photo : null,
        },
      });
    }

    // Campers are released to a guardian, whose details are recorded.
    if (!guardianName || !guardianAddress || !guardianPhone || !ghanaCard) {
      return res.status(400).json({ error: 'Full name, address, contact number and Ghana Card are all required.' });
    }

    // Assign the next camp ID number if this camper doesn't have one yet
    let campId = reg.campId;
    if (campId == null) {
      const max = await prisma.registration.aggregate({ _max: { campId: true } });
      campId = Math.min((max._max.campId || 0) + 1, 1000);
      await prisma.registration.update({ where: { id: reg.id }, data: { campId } });
    }

    await prisma.checkLog.create({
      data: {
        registrationId: reg.id,
        type,
        guardianName: String(guardianName),
        guardianAddress: String(guardianAddress),
        guardianPhone: String(guardianPhone),
        ghanaCard: String(ghanaCard),
      },
    });

    return res.status(201).json({
      success: true,
      kind: 'CAMPER',
      type,
      campId,
      referenceCode: reg.referenceCode,
      child: {
        name: reg.child?.name || 'Camper',
        age: reg.child?.age ?? null,
        gender: reg.child?.gender ?? null,
        photo: reg.child?.photo ?? null,
      },
    });
  } catch (err) {
    console.error('[checkin/record]', err);
    return res.status(500).json({ error: 'Could not record. Please try again.' });
  }
});

// GET /api/checkin/logs -> recent events (station/admin)
router.get('/logs', stationAuth, async (_req, res) => {
  try {
    const logs = await prisma.checkLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { registration: { include: { child: true } }, volunteer: true },
    });
    return res.json(
      logs.map((l) => ({
        id: l.id,
        type: l.type,
        at: l.createdAt,
        kind: l.volunteerId ? 'VOLUNTEER' : 'CAMPER',
        guardianName: l.guardianName,
        guardianPhone: l.guardianPhone,
        camper: l.volunteer ? l.volunteer.fullName : l.registration?.child?.name || 'Camper',
        campId: l.volunteer ? l.volunteer.campId : l.registration?.campId ?? null,
        referenceCode: l.volunteer ? l.volunteer.referenceCode : l.registration?.referenceCode ?? null,
      })),
    );
  } catch (err) {
    console.error('[checkin/logs]', err);
    return res.status(500).json({ error: 'Failed to load logs.' });
  }
});

export default router;
