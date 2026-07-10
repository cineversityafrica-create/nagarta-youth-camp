import { Router } from 'express';
import crypto from 'crypto';
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

interface PaystackTx {
  status?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  channel?: string;
  metadata?: { referenceCode?: string; package?: string };
}

// Record a successful, verified Paystack transaction against its registration.
// Idempotent (keyed on the Paystack reference) so the client verify call AND the
// webhook can both call it without double-charging or double-recording.
async function recordPayment(tx: PaystackTx): Promise<{ ok: boolean; paymentStatus?: string }> {
  const refCode = tx.metadata?.referenceCode;
  if (!refCode) return { ok: false };

  const reg = await prisma.registration.findUnique({
    where: { referenceCode: refCode },
    include: { transactions: true },
  });
  if (!reg) return { ok: false };

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

  const txs = await prisma.paymentTransaction.findMany({ where: { registrationId: reg.id } });
  const totalPaid = txs.reduce((s, t) => s + t.amount, 0);
  const expected = PRICE_PESEWAS[tx.metadata?.package || 'Regular'] || FULL_FEE_PESEWAS;
  const paymentStatus = totalPaid >= expected ? 'PAID' : 'PARTIAL';
  await prisma.registration.update({ where: { id: reg.id }, data: { paymentStatus } });

  return { ok: true, paymentStatus };
}

// Client-initiated verify: the browser charges via Paystack inline, then sends
// us the transaction reference; we confirm it with Paystack using the secret key.
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
    const body = (await resp.json()) as { status?: boolean; data?: PaystackTx };
    const tx = body?.data;
    if (!body?.status || !tx || tx.status !== 'success') {
      return res.status(400).json({ error: 'Payment was not completed. If you were charged, please contact us.' });
    }

    const result = await recordPayment(tx);
    if (!result.ok) return res.status(404).json({ error: 'We could not match this payment to a registration.' });

    return res.json({
      success: true,
      paymentStatus: result.paymentStatus,
      amount: (tx.amount || 0) / 100,
      currency: tx.currency || 'GHS',
    });
  } catch (err) {
    console.error('[paystack/verify]', err);
    return res.status(500).json({ error: 'We could not verify the payment. If you were charged, please contact us.' });
  }
});

// Paystack server-to-server webhook — the reliable source of truth. Paystack
// signs the request with the secret key; we verify the signature against the
// raw request body (captured by express.json's verify hook) before trusting it.
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.sendStatus(200);

    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!signature || !raw) return res.sendStatus(401);

    const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    if (expected !== signature) return res.sendStatus(401);

    const event = req.body as { event?: string; data?: PaystackTx };
    if (event?.event === 'charge.success' && event?.data?.status === 'success') {
      await recordPayment(event.data).catch((e) => console.error('[paystack/webhook] record failed', e));
    }

    // Always 200 for a valid signature so Paystack does not retry a handled event
    return res.sendStatus(200);
  } catch (err) {
    console.error('[paystack/webhook]', err);
    return res.sendStatus(200);
  }
});

export default router;
