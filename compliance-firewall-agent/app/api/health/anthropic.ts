import { NextResponse } from 'next/server'
import { getAnthropicApiKey } from '@/lib/secrets-manager'

export async function GET() {
  const apiKey = await getAnthropicApiKey()
  if (!apiKey) {
    return NextResponse.json({ healthy: false, reason: 'Anthropic API key not configured' })
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    })
    if (res.ok) {
      const models = await res.json().catch(() => null)
      return NextResponse.json({ healthy: true, models })
    } else {
      return NextResponse.json({ healthy: false, status: res.status, statusText: res.statusText })
    }
  } catch (err) {
    return NextResponse.json({ healthy: false, error: (err as Error).message })
  }
}
