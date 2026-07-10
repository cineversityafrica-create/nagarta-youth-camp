import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Fees are quoted in USD but charged in cedis (rate $1 = GH₵12). These are the
// server-authoritative amounts in pesewas (GH₵ × 100), used to decide whether a
// verified payment fully covers the camp fee, so a tampered client-side amount
// can never mark a registration as fully PAID.
const USD_TO_GHS = 12;
const PRICE_PESEWAS: Record<string, number> = {
  'Early Bird': 285 * USD_TO_GHS * 100,
  Regular: 310 * USD_TO_GHS * 100,
};
const FULL_FEE_PESEWAS = PRICE_PESEWAS.Regular;

// Verify a Paystack transaction and record it against the registration.
// The frontend charges the card/MoMo via Paystack inline, then sends us the
// transaction reference here; we confirm it with Paystack using the secret key.
router.post('/verify', async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ error: 'Online payment is not configured. Please use bank transfer.' });
    }

    const reference = (req.body?.reference || '').toString().trim();
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' });

    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = (await resp.json()) as {
      status?: boolean;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        reference?: string;
        channel?: string;
        metadata?: { referenceCode?: string; package?: string };
      };
    };

    const tx = body?.data;
    if (!body?.status || !tx || tx.status !== 'success') {
      return res.status(400).json({ error: 'Payment was not completed. If you were charged, please contact us.' });
    }

    const refCode = tx.metadata?.referenceCode;
    const reg = refCode
      ? await prisma.registration.findUnique({ where: { referenceCode: refCode }, include: { transactions: true } })
      : null;
    if (!reg) return res.status(404).json({ error: 'We could not match this payment to a registration.' });

    // Idempotent: never record the same Paystack reference twice
    const already = reg.transactions.find((t) => t.reference === tx.reference);
    if (!already) {
      await prisma.paymentTransaction.create({
        data: {
          registrationId: reg.id,
          amount: tx.amount || 0, // smallest unit (pesewas)
          currency: tx.currency || 'GHS',
          method: 'PAYSTACK',
          reference: tx.reference,
          note: `Paystack ${tx.channel || 'online'}`.trim(),
        },
      });
    }

    // Recompute total and mark PAID only if it covers the expected fee
    const txs = await prisma.paymentTransaction.findMany({ where: { registrationId: reg.id } });
    const totalPaid = txs.reduce((s, t) => s + t.amount, 0);
    const expected = PRICE_PESEWAS[tx.metadata?.package || 'Regular'] || FULL_FEE_PESEWAS;
    const paymentStatus = totalPaid >= expected ? 'PAID' : 'PARTIAL';
    await prisma.registration.update({ where: { id: reg.id }, data: { paymentStatus } });

    return res.json({
      success: true,
      paymentStatus,
      amount: (tx.amount || 0) / 100,
      currency: tx.currency || 'GHS',
    });
  } catch (err) {
    console.error('[paystack/verify]', err);
    return res.status(500).json({ error: 'We could not verify the payment. If you were charged, please contact us.' });
  }
});

export default router;
