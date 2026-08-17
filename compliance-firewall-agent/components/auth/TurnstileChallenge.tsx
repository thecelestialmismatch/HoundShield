'use client';

import { useEffect, useId, useRef, useState } from 'react';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileChallengeProps {
  onToken: (token: string) => void;
  onExpired?: () => void;
}

const SCRIPT_ID = 'cloudflare-turnstile-script';

/**
 * Loads Turnstile only after a route asks for a challenge. No CAPTCHA script is
 * loaded on ordinary sign-in/reset traffic. The verification token is still
 * meaningless until the server exchanges it using TURNSTILE_SECRET_KEY.
 */
export function TurnstileChallenge({ onToken, onExpired }: TurnstileChallengeProps) {
  const containerId = useId().replace(/:/g, '');
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    if (!siteKey) {
      setUnavailable(true);
      return;
    }

    const render = () => {
      const element = document.getElementById(containerId);
      if (!element || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(element, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onExpired?.(),
        'error-callback': () => setUnavailable(true),
      });
      setReady(true);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.turnstile) {
      render();
    } else if (existing) {
      existing.addEventListener('load', render, { once: true });
      existing.addEventListener('error', () => setUnavailable(true), { once: true });
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => setUnavailable(true);
      document.head.appendChild(script);
    }

    return () => {
      if (widgetId.current && window.turnstile?.remove) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [containerId, onExpired, onToken, siteKey]);

  if (unavailable) {
    return (
      <p className="text-xs text-red-600" role="alert">
        Security verification is unavailable. Please try again later.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--hs-border)] bg-white p-3" aria-live="polite">
      <p className="mb-2 text-xs text-[var(--hs-ink-secondary)]">Complete the security check to continue.</p>
      <div id={containerId} />
      {!ready && <p className="mt-2 text-xs text-[var(--hs-ink-tertiary)]">Loading security check…</p>}
    </div>
  );
}
