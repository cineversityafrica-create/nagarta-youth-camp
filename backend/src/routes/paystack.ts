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
  amount: z.number().positive(),
  currency: z.string().default('GHS'),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  packageType: z.string().optional(),
  reference: z.string().optional(),
  registrationRef: z.string().optional(), // NAGARTA registration reference code
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

    const { email, amount, currency, fullName, phone, packageType, reference, registrationRef } = parsed.data;

    const customReference = reference || `NAGARTA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const response = await axios.post(
      `${PAYSTACK_API}/transaction/initialize`,
      {
        email,
        amount,
        currency,
        reference: customReference,
        callback_url: `${process.env.FRONTEND_URL || 'https://nagartayouthcamp.tech'}/payment/success`,
        metadata: {
          fullName,
          phone,
          packageType,
          registrationRef,
          custom_fields: [
            { display_name: 'Full Name', variable_name: 'full_name', value: fullName },
            { display_name: 'Package', variable_name: 'package', value: packageType || 'N/A' },
            { display_name: 'Camp Reference', variable_name: 'camp_ref', value: registrationRef || 'N/A' },
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

// Verify a payment AND update registration payment status
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
    const isSuccess = data.status === 'success';

    // If payment successful, update the registration
    if (isSuccess && data.metadata?.registrationRef) {
      try {
        const registrationRef = data.metadata.registrationRef;
        const amountInCedis = data.amount / 100;

        // Find registration by reference code
        const registration = await prisma.registration.findFirst({
          where: { referenceCode: registrationRef },
        });

        if (registration) {
          // Update payment status
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
            },
          });

          // Save transaction record
          await prisma.paymentTransaction.create({
            data: {
              registrationId: registration.id,
              amount: Math.round(amountInCedis * 100), // stored in pesewas
              currency: data.currency || 'GHS',
              method: 'VISA',
              reference: data.reference,
              note: `Paystack payment - ${data.metadata?.packageType || 'Package'}`,
            },
          });

          console.log(`[paystack/verify] Registration ${registrationRef} marked as PAID`);
        }
      } catch (dbErr) {
        console.error('[paystack/verify] DB update error:', dbErr);
      }
    }

    return res.json({
      success: isSuccess,
      status: data.status,
      reference: data.reference,
      amount: data.amount / 100,
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

// Webhook endpoint - Paystack POSTs here when payment succeeds
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      console.log(`[paystack/webhook] Payment successful: ${reference} - ${amount / 100} GHS`);

      // Auto-update registration if metadata has our ref
      if (metadata?.registrationRef) {
        const registration = await prisma.registration.findFirst({
          where: { referenceCode: metadata.registrationRef },
        });

        if (registration && registration.paymentStatus !== 'PAID') {
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
            },
          });

          await prisma.paymentTransaction.create({
            data: {
              registrationId: registration.id,
              amount: Math.round((amount / 100) * 100),
              currency: 'GHS',
              method: 'VISA',
              reference,
              note: 'Paystack webhook - auto-confirmed',
            },
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[paystack/webhook]', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
