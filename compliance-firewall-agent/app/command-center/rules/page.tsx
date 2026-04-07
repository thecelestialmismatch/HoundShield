"use client";

/**
 * Firewall Rules Page
 *
 * Full CRUD interface for managing policy_rules.
 * Features:
 *   - Create rules via regex pattern or predefined sensitive data type
 *   - Edit rule name, description, pattern, risk level, and action
 *   - Enable / disable rules without deleting them
 *   - Delete rules with confirmation
 *   - One-click compliance template packs (HIPAA, SOC 2)
 *   - Status indicators for each rule
 *
 * Routes:
 *   GET  /api/rules        - list all rules
 *   POST /api/rules        - create rule
 *   PUT  /api/rules/[id]   - update rule
 *   DELETE /api/rules/[id] - delete rule
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Package,
  X,
  Save,
  RefreshCw,
  Filter,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RuleAction = "ALLOW" | "WARN" | "BLOCK" | "QUARANTINE";
type PatternType = "REGEX" | "KEYWORD" | "SEMANTIC";
type RuleCategory = "PII" | "FINANCIAL" | "STRATEGIC" | "IP" | "HIPAA_PHI";

interface PolicyRule {
  id: string;
  created_at: string;
  updated_at: string;
  category: RuleCategory;
  name: string;
  description: string | null;
  pattern: string;
  pattern_type: PatternType;
  risk_level: RiskLevel;
  threshold: number;
  action: RuleAction;
  is_active: boolean;
  seed_hash: string | null;
}

interface RuleFormData {
  name: string;
  description: string;
  category: RuleCategory;
  pattern: string;
  pattern_type: PatternType;
  risk_level: RiskLevel;
  action: RuleAction;
  threshold: number;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Compliance template packs
// ---------------------------------------------------------------------------

const HIPAA_TEMPLATE_RULES: Omit<RuleFormData, "is_active">[] = [
  {
    name: "HIPAA: Social Security Numbers",
    description: "Detects SSN patterns in LLM prompts per HIPAA Safe Harbor de-identification.",
    category: "PII",
    pattern: String.raw`\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 0.9,
  },
  {
    name: "HIPAA: Medical Record Numbers",
    description: "Blocks transmission of medical record identifiers.",
    category: "HIPAA_PHI",
    pattern: String.raw`\b(?:MRN|medical record|patient id)[:\s]+[\w\d-]+\b`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 0.85,
  },
  {
    name: "HIPAA: Health Plan Beneficiary Numbers",
    description: "Prevents leakage of insurance member identifiers.",
    category: "HIPAA_PHI",
    pattern: String.raw`\b(?:member\s?id|policy\s?number|group\s?number|beneficiary)[:\s]+[\w\d-]+\b`,
    pattern_type: "REGEX",
    risk_level: "HIGH",
    action: "QUARANTINE",
    threshold: 0.8,
  },
  {
    name: "HIPAA: Diagnosis and Procedure Codes",
    description: "Flags ICD-10 and CPT codes indicating clinical data.",
    category: "HIPAA_PHI",
    pattern: String.raw`\b[A-Z]\d{2}(?:\.\d{1,4})?\b|\b\d{5}(?:-\d{2})?\b`,
    pattern_type: "REGEX",
    risk_level: "HIGH",
    action: "WARN",
    threshold: 0.75,
  },
  {
    name: "HIPAA: Prescription Drug Identifiers",
    description: "Detects NDC codes and Rx identifiers.",
    category: "HIPAA_PHI",
    pattern: String.raw`\b\d{4,5}-\d{4}-\d{2}\b|\bRx\s*#?\s*\d{6,}\b`,
    pattern_type: "REGEX",
    risk_level: "HIGH",
    action: "BLOCK",
    threshold: 0.85,
  },
];

const SOC2_TEMPLATE_RULES: Omit<RuleFormData, "is_active">[] = [
  {
    name: "SOC 2: API Keys and Secrets",
    description: "Detects hardcoded API keys, tokens, and secrets per CC6.1.",
    category: "IP",
    pattern: String.raw`(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)["\s:=]+[A-Za-z0-9+/]{20,}`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 0.95,
  },
  {
    name: "SOC 2: AWS Credentials",
    description: "Blocks transmission of AWS access keys per CC6.1.",
    category: "IP",
    pattern: String.raw`AKIA[0-9A-Z]{16}|(?:aws_secret_access_key|AWS_SECRET)[:\s=]+[A-Za-z0-9+/]{40}`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 0.99,
  },
  {
    name: "SOC 2: Database Connection Strings",
    description: "Prevents leakage of connection strings with credentials.",
    category: "STRATEGIC",
    pattern: String.raw`(?:postgresql|mysql|mongodb|redis):\/\/[^:\s]+:[^@\s]+@`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 0.99,
  },
  {
    name: "SOC 2: Private Keys (PEM)",
    description: "Blocks PEM private key material per CC6.1 encryption requirements.",
    category: "IP",
    pattern: String.raw`-----BEGIN (?:RSA |EC |DSA |)?PRIVATE KEY-----`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 1.0,
  },
  {
    name: "SOC 2: Credit Card Numbers",
    description: "Flags PAN data per CC6.1 payment data controls.",
    category: "FINANCIAL",
    pattern: String.raw`\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6011\d{12})\b`,
    pattern_type: "REGEX",
    risk_level: "CRITICAL",
    action: "BLOCK",
    threshold: 0.95,
  },
];

// ---------------------------------------------------------------------------
// Predefined sensitive data types for rule builder
// ---------------------------------------------------------------------------

const PREDEFINED_PATTERNS: { label: string; category: RuleCategory; pattern: string; description: string }[] = [
  { label: "Email Addresses", category: "PII", pattern: String.raw`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`, description: "Detects email addresses" },
  { label: "Phone Numbers (US)", category: "PII", pattern: String.raw`\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b`, description: "Detects US phone numbers" },
  { label: "IP Addresses", category: "STRATEGIC", pattern: String.raw`\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b`, description: "Detects IPv4 addresses" },
  { label: "JWT Tokens", category: "IP", pattern: String.raw`eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`, description: "Detects JSON Web Tokens" },
  { label: "GitHub Tokens", category: "IP", pattern: String.raw`ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}`, description: "Detects GitHub personal access tokens" },
  { label: "Social Security Numbers", category: "PII", pattern: String.raw`\b\d{3}-\d{2}-\d{4}\b`, description: "Detects US Social Security Numbers" },
  { label: "IBAN / Bank Accounts", category: "FINANCIAL", pattern: String.raw`\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b`, description: "Detects IBAN bank account numbers" },
  { label: "Slack Tokens", category: "IP", pattern: String.raw`xox[baprs]-(?:\d+-)+[a-z0-9]+`, description: "Detects Slack API tokens" },
];

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/20",
};

const ACTION_COLORS: Record<RuleAction, string> = {
  ALLOW: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  WARN: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  BLOCK: "text-red-400 bg-red-400/10 border-red-400/20",
  QUARANTINE: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

// ---------------------------------------------------------------------------
// Default form
// ---------------------------------------------------------------------------

const DEFAULT_FORM: RuleFormData = {
  name: "",
  description: "",
  category: "PII",
  pattern: "",
  pattern_type: "REGEX",
  risk_level: "HIGH",
  action: "BLOCK",
  threshold: 0.8,
  is_active: true,
};

// ---------------------------------------------------------------------------
// RuleModal: Create / Edit form
// ---------------------------------------------------------------------------

function RuleModal({
  rule,
  onSave,
  onClose,
  loading,
}: {
  rule?: PolicyRule | null;
  onSave: (data: RuleFormData) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<RuleFormData>(
    rule
      ? {
          name: rule.name,
          description: rule.description ?? "",
          category: rule.category,
          pattern: rule.pattern,
          pattern_type: rule.pattern_type,
          risk_level: rule.risk_level,
          action: rule.action,
          threshold: rule.threshold,
          is_active: rule.is_active,
        }
      : DEFAULT_FORM
  );
  const [patternError, setPatternError] = useState<string | null>(null);

  const set = <K extends keyof RuleFormData>(key: K, value: RuleFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validatePattern = (pattern: string, type: PatternType) => {
    if (type !== "REGEX") {
      setPatternError(null);
      return;
    }
    try {
      new RegExp(pattern);
      setPatternError(null);
    } catch {
      setPatternError("Invalid regex pattern");
    }
  };

  const handlePatternChange = (value: string) => {
    set("pattern", value);
    validatePattern(value, form.pattern_type);
  };

  const handlePredefined = (preset: typeof PREDEFINED_PATTERNS[0]) => {
    setForm((prev) => ({
      ...prev,
      pattern: preset.pattern,
      category: preset.category,
      description: prev.description || preset.description,
      name: prev.name || preset.label,
      pattern_type: "REGEX",
    }));
    setPatternError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patternError) return;
    await onSave(form);
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400/50 focus:ring-1 focus:ring-brand-400/20 transition-colors";
  const labelClass = "block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {rule ? "Edit Rule" : "New Firewall Rule"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>Rule Name *</label>
            <input
              className={inputClass}
              placeholder="e.g. Block SSNs in prompts"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="What does this rule protect against?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Predefined patterns */}
          <div>
            <label className={labelClass}>Quick-fill from predefined types</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_PATTERNS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePredefined(p)}
                  className="px-2.5 py-1 text-xs rounded-md bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-brand-400/40 hover:bg-brand-400/10 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern + type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Pattern *</label>
              <input
                className={`${inputClass} font-mono text-xs ${patternError ? "border-red-400/50" : ""}`}
                placeholder={form.pattern_type === "REGEX" ? String.raw`\b\d{3}-\d{2}-\d{4}\b` : "keyword or phrase"}
                value={form.pattern}
                onChange={(e) => handlePatternChange(e.target.value)}
                required
              />
              {patternError && (
                <p className="mt-1 text-xs text-red-400">{patternError}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={inputClass}
                value={form.pattern_type}
                onChange={(e) => {
                  set("pattern_type", e.target.value as PatternType);
                  validatePattern(form.pattern, e.target.value as PatternType);
                }}
              >
                <option value="REGEX">Regex</option>
                <option value="KEYWORD">Keyword</option>
                <option value="SEMANTIC">Semantic</option>
              </select>
            </div>
          </div>

          {/* Category + Risk Level + Action */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set("category", e.target.value as RuleCategory)}
              >
                <option value="PII">PII</option>
                <option value="FINANCIAL">Financial</option>
                <option value="STRATEGIC">Strategic</option>
                <option value="IP">IP / Secrets</option>
                <option value="HIPAA_PHI">HIPAA PHI</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Risk Level</label>
              <select
                className={inputClass}
                value={form.risk_level}
                onChange={(e) => set("risk_level", e.target.value as RiskLevel)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Action</label>
              <select
                className={inputClass}
                value={form.action}
                onChange={(e) => set("action", e.target.value as RuleAction)}
              >
                <option value="ALLOW">Allow</option>
                <option value="WARN">Warn</option>
                <option value="BLOCK">Block</option>
                <option value="QUARANTINE">Quarantine</option>
              </select>
            </div>
          </div>

          {/* Threshold */}
          <div>
            <label className={labelClass}>
              Confidence Threshold: {Math.round(form.threshold * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={form.threshold}
              onChange={(e) => set("threshold", parseFloat(e.target.value))}
              className="w-full accent-brand-400"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>0% (always trigger)</span>
              <span>100% (high certainty only)</span>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_active ? "bg-brand-500" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  form.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-white/60">
              {form.is_active ? "Rule is active" : "Rule is disabled"}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!patternError}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {rule ? "Save Changes" : "Create Rule"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FirewallRulesPage() {
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PolicyRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [templateLoading, setTemplateLoading] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // API calls
  // ---------------------------------------------------------------------------

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rules");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch (err) {
      showToast(`Failed to load rules: ${err instanceof Error ? err.message : "Unknown error"}`, false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const createRule = async (form: RuleFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Create failed");
      }
      await fetchRules();
      setModalOpen(false);
      showToast("Rule created.");
    } catch (err) {
      showToast(`${err instanceof Error ? err.message : "Create failed"}`, false);
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (form: RuleFormData) => {
    if (!editingRule) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Update failed");
      }
      await fetchRules();
      setEditingRule(null);
      showToast("Rule updated.");
    } catch (err) {
      showToast(`${err instanceof Error ? err.message : "Update failed"}`, false);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: PolicyRule) => {
    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch {
      showToast("Failed to toggle rule", false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setRules((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
      showToast("Rule deleted.");
    } catch {
      showToast("Failed to delete rule", false);
    }
  };

  const applyTemplate = async (name: string, templateRules: Omit<RuleFormData, "is_active">[]) => {
    setTemplateLoading(name);
    let created = 0;
    let skipped = 0;
    for (const t of templateRules) {
      const exists = rules.some((r) => r.name === t.name);
      if (exists) { skipped++; continue; }
      try {
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...t, is_active: true }),
        });
        if (res.ok) created++;
      } catch {
        // continue on individual failures
      }
    }
    await fetchRules();
    setTemplateLoading(null);
    showToast(
      `${name} pack applied: ${created} rules created${skipped > 0 ? `, ${skipped} already existed` : ""}.`
    );
  };

  // ---------------------------------------------------------------------------
  // Filtered view
  // ---------------------------------------------------------------------------

  const filtered = rules.filter((r) => {
    const matchSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.pattern.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "ALL" || r.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const activeCount = rules.filter((r) => r.is_active).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#07070b] p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${
              toast.ok
                ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-200"
                : "bg-red-900/80 border-red-500/30 text-red-200"
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Firewall Rules</h1>
            <p className="text-sm text-white/40">
              {activeCount} active rules. Custom detection patterns for your compliance boundary.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Template Packs */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-white">Compliance Template Packs</span>
          <span className="ml-auto text-xs text-white/30">One-click install. Rules won&apos;t duplicate.</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { name: "HIPAA", rules: HIPAA_TEMPLATE_RULES, color: "text-sky-400 border-sky-400/30 hover:bg-sky-400/10", desc: `${HIPAA_TEMPLATE_RULES.length} rules — PHI de-identification` },
            { name: "SOC 2", rules: SOC2_TEMPLATE_RULES, color: "text-violet-400 border-violet-400/30 hover:bg-violet-400/10", desc: `${SOC2_TEMPLATE_RULES.length} rules — CC6.1 secrets/credentials` },
          ].map(({ name, rules: templateRules, color, desc }) => (
            <button
              key={name}
              onClick={() => applyTemplate(name, templateRules)}
              disabled={templateLoading === name}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border bg-white/[0.02] text-sm font-medium transition-colors disabled:opacity-50 ${color}`}
            >
              {templateLoading === name ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              <span>{name}</span>
              <span className="text-xs opacity-50">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400/40 transition-colors"
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-400/40 transition-colors"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="PII">PII</option>
            <option value="FINANCIAL">Financial</option>
            <option value="STRATEGIC">Strategic</option>
            <option value="IP">IP / Secrets</option>
            <option value="HIPAA_PHI">HIPAA PHI</option>
          </select>
        </div>
        <button
          onClick={fetchRules}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/10 text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={() => { setEditingRule(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-white/40 text-sm">
            {rules.length === 0
              ? "No rules yet. Apply a compliance pack or create your first rule."
              : "No rules match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rule) => (
            <motion.div
              key={rule.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                rule.is_active
                  ? "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
                  : "bg-white/[0.01] border-white/[0.03] opacity-50"
              }`}
            >
              {/* Active indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.is_active ? "bg-emerald-400" : "bg-white/20"}`} />

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{rule.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border font-medium ${RISK_COLORS[rule.risk_level]}`}>
                    {rule.risk_level}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border font-medium ${ACTION_COLORS[rule.action]}`}>
                    {rule.action}
                  </span>
                  <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                    {rule.category}
                  </span>
                </div>
                {rule.description && (
                  <p className="text-xs text-white/40 mt-0.5 truncate">{rule.description}</p>
                )}
                <code className="text-xs text-brand-300/60 font-mono mt-1 block truncate">
                  {rule.pattern.length > 80 ? rule.pattern.slice(0, 80) + "…" : rule.pattern}
                </code>
              </div>

              {/* Threshold */}
              <div className="text-xs text-white/30 flex-shrink-0">
                {Math.round(rule.threshold * 100)}%
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleRule(rule)}
                  title={rule.is_active ? "Disable rule" : "Enable rule"}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  {rule.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setEditingRule(rule); setModalOpen(true); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(rule.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-[#0d0d14] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Delete Rule</h3>
                  <p className="text-xs text-white/40">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-5">
                Are you sure you want to delete{" "}
                <span className="text-white font-medium">
                  {rules.find((r) => r.id === deleteConfirm)?.name}
                </span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteRule(deleteConfirm)}
                  className="flex-1 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <RuleModal
            rule={editingRule}
            onSave={editingRule ? updateRule : createRule}
            onClose={() => { setModalOpen(false); setEditingRule(null); }}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
