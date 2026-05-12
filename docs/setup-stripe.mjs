import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function main() {
  console.log('Setting up Stripe products and prices...');
  
  const products = [
    {
      name: 'Pro',
      description: 'Advanced features for professionals',
      monthlyPrice: 2900, // $29.00
      annualPrice: 29000, // $290.00
    },
    {
      name: 'Enterprise',
      description: 'Full capabilities for scaling teams',
      monthlyPrice: 9900,
      annualPrice: 99000,
    },
    {
      name: 'Agency',
      description: 'Unlimited access for agencies with multiple clients',
      monthlyPrice: 29900,
      annualPrice: 299000,
    }
  ];

  for (const prod of products) {
    const stripeProduct = await stripe.products.create({
      name: prod.name,
      description: prod.description,
    });
    
    const monthlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: prod.monthlyPrice,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    
    const annualPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: prod.annualPrice,
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    
    const prefix = prod.name.toUpperCase();
    console.log(`STRIPE_${prefix}_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_${prefix}_ANNUAL_PRICE_ID=${annualPrice.id}`);
  }
}

main().catch(console.error);
