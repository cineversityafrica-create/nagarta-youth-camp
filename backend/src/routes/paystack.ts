import { Router } from 'express';
import crypto from 'crypto';
import https from 'https';
import { prisma } from '../lib/prisma';

const router = Router();

// Read the secret key defensively. Paystack keys only contain [A-Za-z0-9_], so
// strip every other character anywhere in the value (handles stray whitespace,
// newlines, carriage returns or quotes that sneak in via .env).
function getSecret(): string {
  return (process.env.PAYSTACK_SECRET_KEY || '').replace(/[^A-Za-z0-9_]/g, '');
}

// GET the Paystack API using Node's built-in https so it works on any Node
// version (older Node has no global fetch, which crashed the verify route).
function paystackGet<T = unknown>(path: string, secret: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'api.paystack.co', path, method: 'GET', headers: { Authorization: `Bearer ${secret}` } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data) as T); } catch (e) { reject(e); }
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Paystack request timed out')));
    req.end();
  });
}

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
    const secret = getSecret();
    if (!secret) {
      return res.status(500).json({ error: 'Online payment is not configured. Please use bank transfer.' });
    }

    const reference = (req.body?.reference || '').toString().trim();
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' });

    const body = await paystackGet<{ status?: boolean; data?: PaystackTx }>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      secret,
    );
    const tx = body?.data;
    if (!body?.status || !tx || tx.status !== 'success') {
      // Diagnostics stay in the server log. They previously went back in the
      // response, which exposed the tail of the live secret key to any caller.
      console.warn('[paystack/verify] not successful', {
        paystackStatus: body?.status,
        paystackMessage: (body as { message?: string })?.message,
        dataStatus: tx?.status,
      });
      return res.status(400).json({
        error: 'Payment was not completed. If you were charged, please contact us.',
      });
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
    return res.status(500).json({
      error: 'We could not verify the payment. If you were charged, please contact us.',
    });
  }
});

// Paystack server-to-server webhook — the reliable source of truth. Paystack
// signs the request with the secret key; we verify the signature against the
// raw request body (captured by express.json's verify hook) before trusting it.
router.post('/webhook', async (req, res) => {
  try {
    const secret = getSecret();
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
