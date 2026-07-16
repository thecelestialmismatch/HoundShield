import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/stripe/env';
import { STRIPE_API_VERSION } from '@/lib/stripe/api-version';
import { NextResponse } from 'next/server';

let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripeClient) {
    const key = getStripeSecretKey();
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    stripeClient = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  }
  return stripeClient;
}

export async function GET() {
  const priceIds = [
    'price_1TBZ7XQK7cyCnCHkJfZtFe12',
    'price_1TBZ8tQK7cyCnCHkW0lnkftC',
    'price_1TBZ9VQK7cyCnCHkBPqQ92xH',
    'price_1TBZ9hQK7cyCnCHk7f92iMGx',
    'price_1TBZAKQK7cyCnCHk8QQsdSIK',
    'price_1TBZAYQK7cyCnCHk9vg8PWqO',
    'price_1TBZAnQK7cyCnCHkFbJaRUxq',
    'price_1TBZB0QK7cyCnCHkxghMMYWO',
  ];

  const results = await Promise.all(
    priceIds.map(async (id) => {
      try {
        const s = getStripeClient();
        const p: Stripe.Price = await s.prices.retrieve(id);
        const amount = p?.unit_amount ?? null; // in cents
        const currency = p?.currency ?? 'usd';
        return { id, amount, currency };
      } catch {
        return { id, amount: null, currency: null };
      }
    })
  );

  // Return amounts in human-friendly units where possible (default to cents if needed)
  return NextResponse.json({ prices: results.map(r => ({ ...r, amount: r.amount !== null ? Math.round(r.amount / 100) : null })) });
}
