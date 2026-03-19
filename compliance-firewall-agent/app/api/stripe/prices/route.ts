import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

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
        const p: any = await stripe.prices.retrieve(id);
        const amount = p?.unit_amount ?? null; // in cents
        const currency = p?.currency ?? 'usd';
        return { id, amount, currency };
      } catch (e) {
        return { id, amount: null, currency: null };
      }
    })
  );

  // Return amounts in human-friendly units where possible (default to cents if needed)
  return NextResponse.json({ prices: results.map(r => ({ ...r, amount: r.amount !== null ? Math.round(r.amount / 100) : null })) });
}
