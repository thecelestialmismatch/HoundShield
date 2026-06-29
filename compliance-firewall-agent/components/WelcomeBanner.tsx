'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

/**
 * Post-signup welcome banner. Shows once when a freshly created account lands on
 * /console?welcome=true, and is dismissible. useSearchParams must live behind a
 * Suspense boundary in the App Router, hence the wrapper.
 */
function WelcomeBannerInner() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || params.get('welcome') !== 'true') return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] px-4 py-3 text-sm text-[var(--hs-ink,#0A1420)]"
    >
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--hs-success,#059669)]" />
        <span>
          Your account is ready. Let&apos;s check your CMMC posture — start with your SPRS score below.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss welcome message"
        className="flex-shrink-0 rounded-md p-1 text-[var(--hs-ink-tertiary,#2E4150)] transition-colors hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function WelcomeBanner() {
  return (
    <Suspense fallback={null}>
      <WelcomeBannerInner />
    </Suspense>
  );
}
