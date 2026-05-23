import { NextResponse } from 'next/server';

export async function GET() {
  const openrouter = !!process.env.OPENROUTER_API_KEY;
  const anthropic = !!process.env.ANTHROPIC_API_KEY;
  const stripe = !!process.env.STRIPE_SECRET_KEY;
  const supabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resend = !!process.env.RESEND_API_KEY;
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://houndshield.com';
  const _healthMarker = 'HOUNDSHIELD_HEALTH_2026_05_06';

  const allGreen = openrouter && stripe && supabase && resend;

  return NextResponse.json({
    status: allGreen ? 'ok' : 'degraded',
    domain,
    services: {
      openrouter_configured: openrouter,
      anthropic_configured: anthropic,
      stripe_configured: stripe,
      supabase_configured: supabase,
      resend_configured: resend,
    },
    version: '2.0.0',
  }, { status: allGreen ? 200 : 503 });
}
