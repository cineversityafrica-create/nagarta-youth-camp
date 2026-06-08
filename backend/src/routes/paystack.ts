import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_API = 'https://api.paystack.co';

// Initialize a payment
const initSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(), // amount in cents/pesewas
  currency: z.string().default('GHS'),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  packageType: z.string().optional(), // 'Early Bird' or 'Regular Package'
  reference: z.string().optional(), // Optional custom reference
});

router.post('/initialize', async (req, res) => {
  try {
    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ error: 'Paystack not configured. Add PAYSTACK_SECRET_KEY to .env' });
    }

    const parsed = initSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
    }

    const { email, amount, currency, fullName, phone, packageType, reference } = parsed.data;

    const customReference = reference || `NAGARTA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const response = await axios.post(
      `${PAYSTACK_API}/transaction/initialize`,
      {
        email,
        amount, // in pesewas (multiply Ghana cedis by 100)
        currency,
        reference: customReference,
        callback_url: `${process.env.FRONTEND_URL || 'https://nagartayouthcamp.tech'}/payment/success`,
        metadata: {
          fullName,
          phone,
          packageType,
          custom_fields: [
            { display_name: 'Full Name', variable_name: 'full_name', value: fullName },
            { display_name: 'Package', variable_name: 'package', value: packageType || 'N/A' },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference,
    });
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    console.error('[paystack/initialize]', error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.message || 'Failed to initialize payment',
    });
  }
});

// Verify a payment
router.get('/verify/:reference', async (req, res) => {
  try {
    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ error: 'Paystack not configured' });
    }

    const { reference } = req.params;

    const response = await axios.get(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });

    const data = response.data.data;

    return res.json({
      success: data.status === 'success',
      status: data.status,
      reference: data.reference,
      amount: data.amount / 100, // convert from pesewas back to cedis
      currency: data.currency,
      customer: data.customer,
      metadata: data.metadata,
      paid_at: data.paid_at,
    });
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    console.error('[paystack/verify]', error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.message || 'Failed to verify payment',
    });
  }
});

// Webhook endpoint - Paystack will POST here when payment succeeds
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;

    // Verify event is from Paystack (production: verify signature with crypto)
    if (event.event === 'charge.success') {
      const { reference, amount, customer, metadata } = event.data;

      console.log(`[paystack/webhook] Payment successful: ${reference} - ${amount / 100} GHS`);

      // TODO: Save transaction to database
      // await prisma.paymentTransaction.create({ ... })

      // Send confirmation email here if needed
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[paystack/webhook]', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
