'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { signOutEverywhere } from '@/lib/auth/sign-out'

/**
 * Provider-agnostic sign-out for the after-login console. The console had NO
 * way to end a session (the only sign-out lived on a command-center subpage) —
 * a dashboard a customer cannot leave is a trust smell on a security product.
 *
 * The provider split this used to carry inline now lives in
 * `lib/auth/sign-out.ts`, because the settings page grew a second copy that
 * forgot the Better Auth branch entirely. One implementation, two call sites.
 * On failure it still degrades honestly (visible "failed — retry" label, no
 * redirect) — never a fake success.
 */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'busy' | 'failed'>('idle')

  const onClick = async () => {
    if (state === 'busy') return
    setState('busy')
    try {
      await signOutEverywhere()
      router.push('/login')
      router.refresh()
    } catch {
      setState('failed')
    }
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={state === 'busy'}>
      {state === 'busy' ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <LogOut />}
      {state === 'failed' ? 'Sign out failed — retry' : 'Sign out'}
    </button>
  )
}
