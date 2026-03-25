"use client";

import { useState } from "react";
import { Shield, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface AnchorBadgeProps {
  eventId: string;
  txHash?: string | null;
  chain?: string;
  compact?: boolean;
}

export function AnchorBadge({ eventId, txHash, chain = "base-sepolia", compact = false }: AnchorBadgeProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  const explorerBase = chain === "base"
    ? "https://basescan.org/tx/"
    : "https://sepolia.basescan.org/tx/";

  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/blockchain/verify?eventId=${eventId}`);
      const data = await res.json();
      setVerified(data.verified ?? false);
    } catch {
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  }

  if (!txHash) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Shield className="w-3 h-3" />
        Not anchored
      </span>
    );
  }

  const shortTx = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          verified === true
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : verified === false
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-brand-400/10 text-brand-400 border border-brand-400/20"
        }`}
      >
        {verified === true ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : verified === false ? (
          <XCircle className="w-3 h-3" />
        ) : (
          <Shield className="w-3 h-3" />
        )}
        {compact ? "On-chain" : `Anchored: ${shortTx}`}
      </span>

      {!compact && (
        <>
          <a
            href={`${explorerBase}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-brand-400 transition-colors"
            title="View on BaseScan"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="text-xs text-slate-500 hover:text-brand-400 transition-colors disabled:opacity-50"
            title="Verify on-chain"
          >
            {verifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Verify"
            )}
          </button>
        </>
      )}
    </span>
  );
}
