'use client';

/**
 * Gateway API keys — the real one.
 *
 * WHAT THIS REPLACES, and why it is not a cosmetic change:
 *
 * This section used to render `kls_${user.id}` — a string derived from the
 * signed-in user's id, never stored anywhere, never hashed into `api_keys` —
 * behind a Reveal button and a Copy button, over the caption "Include this key
 * in the x-api-key header of your gateway requests".
 *
 * `resolveApiKey` hashes an incoming key and looks it up in `api_keys`. That
 * value was never in the table, so the gateway answered every request made
 * with it `401 Invalid API key`. A customer following the product's own
 * instructions, to the letter, could not send a single prompt through the
 * gateway — which is why `compliance_events` was empty, which is why the
 * Command Center dashboard had nothing to show.
 *
 * Every key listed here now exists in `api_keys`; the raw value is shown once,
 * at creation, and is unrecoverable afterwards because only its SHA-256 hash
 * was stored. If a key is on this screen, it works.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

/** The customer-facing gateway origin. Same value the Overview's activation
 *  checklist sends people here to find. */
export const GATEWAY_BASE_URL = 'https://proxy.houndshield.com/v1';

export interface GatewayKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Copy-to-clipboard that reports the real outcome. A "Copied!" that fires
 *  when the write rejected is the fake-success pattern this codebase keeps
 *  deleting (tasks/lessons.md 2026-07-12). */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('ok');
    } catch {
      setState('fail');
    }
    setTimeout(() => setState('idle'), 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      title={state === 'fail' ? 'Copy failed — select and copy manually' : label}
      aria-label={label}
      className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white transition-all shrink-0"
    >
      {state === 'ok' ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : state === 'fail' ? (
        <AlertCircle className="w-4 h-4 text-red-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export function GatewayKeys() {
  const [keys, setKeys] = useState<GatewayKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Specifically "the LIST could not be read" — distinct from `error`, which
   *  also carries a failed mint or revoke. Only this one may suppress the
   *  empty state; a failed mint must not hide the keys you already have. */
  const [loadFailed, setLoadFailed] = useState(false);
  /** The one and only time a raw key is ever in the DOM. */
  const [freshKey, setFreshKey] = useState<string | null>(null);

  /** Bumped to re-run the load effect after a mint or a revoke. */
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const ac = new AbortController();
    // setState lives inside the async body, never synchronously in the effect —
    // same shape as useOperatorTelemetry, and it keeps the cascading-render
    // lint rule satisfied for the right reason rather than by suppression.
    void (async () => {
      try {
        const res = await fetch('/api/gateway/keys', {
          cache: 'no-store',
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`keys ${res.status}`);
        const body = await res.json();
        setKeys(Array.isArray(body.keys) ? body.keys : []);
        setError(null);
        setLoadFailed(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Distinct from "you have no keys": never render an empty list when the
        // truth is that we could not ask.
        setError('Could not load your gateway keys.');
        setLoadFailed(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [nonce]);

  const create = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/gateway/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Gateway key' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Could not issue a key.');
      setFreshKey(body.key as string);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue a key.');
    } finally {
      setCreating(false);
    }
  }, [reload]);

  const revoke = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const res = await fetch(`/api/gateway/keys?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Could not revoke that key.');
        reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not revoke that key.');
      }
    },
    [reload]
  );

  const active = keys.filter((k) => k.is_active);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Gateway URL</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-xs break-all">
            {GATEWAY_BASE_URL}
          </code>
          <CopyButton value={GATEWAY_BASE_URL} label="Copy gateway URL" />
        </div>
      </div>

      {/* The raw key, shown exactly once. */}
      {freshKey && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
            <KeyRound className="w-4 h-4" /> Your new key — copy it now
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-emerald-200 font-mono text-xs break-all">
              {freshKey}
            </code>
            <CopyButton value={freshKey} label="Copy API key" />
          </div>
          <p className="text-[11px] text-slate-400">
            Only its hash is stored, so this is the last time it can be displayed. Lost a key?
            Revoke it and create another.
          </p>
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Verify it end to end
            </div>
            <pre className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-300 font-mono text-[11px] overflow-x-auto">
{`curl ${GATEWAY_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer ${freshKey}" \\
  -H "x-provider-api-key: $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"My SSN is 123-45-6789"}]}'`}
            </pre>
            <p className="text-[11px] text-slate-400">
              That prompt is blocked by design — and the block lands on your dashboard as a real
              event within seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFreshKey(null)}
            className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2"
          >
            I&apos;ve saved it — hide
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Keys {loading ? '' : `(${active.length} active)`}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 px-4 py-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        ) : loadFailed ? (
          // "We could not ask" is not "you have none". Rendering the empty
          // state here would tell an operator with ten live keys that they
          // have zero — the banner above already says what actually happened.
          null
        ) : keys.length === 0 ? (
          <p className="text-xs text-slate-400 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/10">
            No keys yet. Create one to point an OpenAI-compatible client at your gateway — every
            prompt it sends is scanned locally and recorded in your audit log.
          </p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/10"
              >
                <KeyRound
                  className={`w-4 h-4 shrink-0 ${k.is_active ? 'text-brand-500' : 'text-slate-600'}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-slate-300 truncate">{k.key_prefix}</code>
                    {!k.is_active && (
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-white/10 rounded px-1.5 py-0.5">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {k.name} · created {formatDate(k.created_at)} · last used{' '}
                    {k.last_used_at ? formatDate(k.last_used_at) : 'never'}
                  </div>
                </div>
                {k.is_active && (
                  <button
                    type="button"
                    onClick={() => revoke(k.id)}
                    aria-label={`Revoke key ${k.key_prefix}`}
                    title="Revoke"
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={create}
        disabled={creating}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-200 text-brand-500 text-sm font-medium hover:bg-brand-500/20 transition-all disabled:opacity-50"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {creating ? 'Creating…' : 'Create gateway key'}
      </button>
    </div>
  );
}
