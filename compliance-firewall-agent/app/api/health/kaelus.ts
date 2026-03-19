import { NextResponse } from 'next/server';

export async function GET() {
  const primary = !!process.env.ANTHROPIC_API_KEY_PRIMARY;
  const secondary = !!process.env.ANTHROPIC_API_KEY_SECONDARY;
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://kaelus.online';
  return NextResponse.json({
    domain,
    anthropic_keys: {
      primary_set: primary,
      secondary_set: secondary
    }
  });
}
