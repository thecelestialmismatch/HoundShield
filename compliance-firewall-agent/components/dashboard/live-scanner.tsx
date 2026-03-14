"use client";

import { useState, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Zap,
  Clock,
  Eye,
  Trash2,
  Info,
} from "lucide-react";

interface ScanResult {
  risk_level: string;
  confidence: number;
  classifications: string[];
  entities_found: number;
  entities: Array<{
    type: string;
    value_redacted: string;
    confidence: number;
  }>;
  should_block: boolean;
  should_quarantine: boolean;
  processing_time_ms: number;
  ai_classification: {
    top_label: string;
    top_score: number;
    is_sensitive: boolean;
    model: string;
    powered_by: string;
  } | null;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  NONE: { bg: "bg-white/5", text: "text-slate-500", border: "border-white/10", dot: "bg-white/30" },
  LOW: { bg: "bg-info-muted", text: "text-info", border: "border-info/20", dot: "bg-info" },
  MEDIUM: { bg: "bg-warning-muted", text: "text-warning", border: "border-warning/20", dot: "bg-warning" },
  HIGH: { bg: "bg-[#f97316]/10", text: "text-[#f97316]", border: "border-[#f97316]/20", dot: "bg-[#f97316]" },
  CRITICAL: { bg: "bg-danger-muted", text: "text-danger", border: "border-danger/20", dot: "bg-danger" },
};

const EXAMPLE_TEXTS = [
  {
    label: "PII Data",
    text: "Employee record: John Smith, SSN 123-45-6789, born 03/15/1985. Contact: john.smith@acme.com, phone (555) 234-5678. Credit card: 4532-1234-5678-9012",
  },
  {
    label: "API Keys",
    text: "Production config:\nOPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  },
  {
    label: "Financial Data",
    text: "Q4 Revenue Report: Total revenue $45.2M (up 23% YoY). Net profit margin 18.5%. Customer account #12345678 routing 021000021. Board approved acquisition of TechCorp for $120M.",
  },
  {
    label: "Clean Text",
    text: "Please help me write a Python function that sorts a list of numbers using the quicksort algorithm. I'd like it to handle edge cases like empty lists and single elements.",
  },
];

export function LiveScanner() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{ text: string; result: ScanResult; time: Date }>>([]);
  const [copied, setCopied] = useState(false);

  const runScan = useCallback(async () => {
    if (!text.trim() || scanning) return;
    setScanning(true);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
      setScanHistory((prev) => [{ text: text.slice(0, 100), result: data, time: new Date() }, ...prev.slice(0, 9)]);
    } catch {
      setResult({
        risk_level: "NONE",
        confidence: 0,
        classifications: [],
        entities_found: 0,
        entities: [],
        should_block: false,
        should_quarantine: false,
        processing_time_ms: 0,
        ai_classification: null,
      });
    } finally {
      setScanning(false);
    }
  }, [text, scanning]);

  const colors = result ? RISK_COLORS[result.risk_level] || RISK_COLORS.NONE : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Live Compliance Scanner</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Paste any text to scan for sensitive data in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400">
          <Zap className="w-3 h-3" />
          16 detection patterns • 4 risk categories
        </div>
      </div>

      {/* Example buttons */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_TEXTS.map((ex, i) => (
          <button
            key={i}
            onClick={() => {
              setText(ex.text);
              setResult(null);
            }}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-700 hover:border-white/15 transition-all"
          >
            Try: {ex.label}
          </button>
        ))}
      </div>

      {/* Scanner */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">kaelus-scanner</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here to scan for PII, financial data, API keys, strategic information..."
            rows={6}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-white/20 focus:outline-none resize-none font-mono leading-relaxed"
          />
        </div>

        <div className="px-4 py-3 bg-surface-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400">
            <span>{text.length} characters</span>
            {result && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.processing_time_ms}ms
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {text && (
              <button
                onClick={() => {
                  setText("");
                  setResult(null);
                }}
                className="btn-ghost text-[11px] px-3 py-1.5"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
            <button
              onClick={runScan}
              disabled={scanning || !text.trim()}
              className="btn-primary text-[11px] px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-30"
            >
              {scanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              {scanning ? "Scanning..." : "Scan Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && colors && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Risk Level Banner */}
          <div className={`glass-card p-5 border ${colors.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  {result.risk_level === "CRITICAL" || result.risk_level === "HIGH" ? (
                    <ShieldAlert className={`w-5 h-5 ${colors.text}`} />
                  ) : result.risk_level === "NONE" ? (
                    <ShieldCheck className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 ${colors.text}`} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors.dot} ${result.risk_level === "CRITICAL" ? "animate-pulse" : ""}`} />
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {result.risk_level} RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {result.should_block && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-danger-muted text-danger font-medium">
                    BLOCKED
                  </span>
                )}
                {result.should_quarantine && !result.should_block && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-warning-muted text-warning font-medium">
                    QUARANTINED
                  </span>
                )}
                {!result.should_block && !result.should_quarantine && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-success-muted text-success font-medium">
                    ALLOWED
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{result.entities_found}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Entities Found</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{result.classifications.length}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{result.processing_time_ms}ms</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Scan Time</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{Math.round(result.confidence * 100)}%</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Confidence</p>
              </div>
            </div>
          </div>

          {/* Entities */}
          {result.entities.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Detected Entities ({result.entities.length})
              </h3>
              <div className="space-y-2">
                {result.entities.map((entity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-50/50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                        {entity.type}
                      </span>
                      <span className="text-xs text-slate-600 font-mono">{entity.value_redacted}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">
                      {Math.round(entity.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classifications */}
          {result.classifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.classifications.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-500 border border-blue-200"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* AI Classification */}
          {result.ai_classification && (
            <div className="glass-card p-4">
              <h3 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-blue-600" />
                AI Classification (Powered by {result.ai_classification.powered_by})
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-900">{result.ai_classification.top_label}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Score: {Math.round(result.ai_classification.top_score * 100)}%
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${result.ai_classification.is_sensitive ? "bg-danger-muted text-danger" : "bg-success-muted text-success"}`}>
                  {result.ai_classification.is_sensitive ? "Sensitive" : "Safe"}
                </span>
              </div>
            </div>
          )}

          {/* Copy JSON */}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn-ghost text-[11px] px-3 py-1.5 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied JSON" : "Copy Full Result as JSON"}
          </button>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">Recent Scans</h3>
          <div className="space-y-1">
            {scanHistory.map((item, i) => {
              const c = RISK_COLORS[item.result.risk_level] || RISK_COLORS.NONE;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  <span className={`text-[10px] font-medium ${c.text} w-16`}>{item.result.risk_level}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 flex-1 truncate">{item.text}...</span>
                  <span className="text-[10px] text-slate-500">{item.result.processing_time_ms}ms</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
