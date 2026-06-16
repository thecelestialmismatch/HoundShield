import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | HoundShield",
  description: "HoundShield security architecture, data handling, and compliance roadmap.",
};

export default function SecurityPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold mb-2">Security</h1>
      <p className="text-gray-500 mb-10 text-lg">
        What we store, what we don't, and how our architecture works.
      </p>

      {/* Data Handling */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Data handling</h2>
        <div className="space-y-3">
          {[
            { label: "Prompt content", value: "Never stored on HoundShield servers. In Mode B (Docker), scanning runs on your hardware and prompt content never leaves your network." },
            { label: "CUI / PHI / PII", value: "Never transmitted to or stored at houndshield.com in any form. Mode A is explicitly non-CUI. Mode B is the required mode for CUI environments." },
            { label: "What does leave your network (Mode B)", value: "License key validation (hashed), scan count for billing, no prompt content, no detection results." },
            { label: "Audit logs", value: "SHA-256 hash-chained, append-only, stored locally on your infrastructure in Mode B. Tamper-evident. Independently verifiable without HoundShield infrastructure." },
          ].map((item) => (
            <div key={item.label} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">{item.label}</p>
              <p className="text-sm text-gray-600">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detection integrity */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Detection pattern integrity</h2>
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 font-mono text-sm">
          <p className="text-gray-500 mb-2">SHA-256 hash of shipped detection pattern corpus:</p>
          <p className="text-gray-800 break-all">Published with each release at github.com/thecelestialmismatch/HoundShield/releases</p>
          <p className="text-gray-500 mt-3 text-xs">Verify locally: sha256sum detection/patterns/*.json</p>
        </div>
      </section>

      {/* Brain AI */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Brain AI — important restriction</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-yellow-900 mb-2">⚠ Do not input CUI into Brain AI</p>
          <p className="text-sm text-yellow-800">
            Brain AI uses the OpenRouter API, which routes to commercial LLM endpoints (OpenAI, Anthropic, etc.)
            that are not FedRAMP-authorized. Any CUI input to Brain AI constitutes a CMMC spillage event
            requiring incident reporting under DFARS 252.204-7012. Brain AI is designed for non-CUI
            gap analysis only. Your own API key is used — no data is stored by HoundShield.
          </p>
        </div>
      </section>

      {/* Compliance roadmap */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Compliance roadmap</h2>
        <div className="space-y-2">
          {[
            { status: "in-progress", label: "SOC 2 Type I", target: "Q3 2026" },
            { status: "planned", label: "SOC 2 Type II", target: "Q1 2027" },
            { status: "planned", label: "CMMC Level 2 self-assessment (HoundShield as vendor)", target: "Q4 2026" },
            { status: "planned", label: "AWS GovCloud deployment option", target: "Q1 2027" },
            { status: "planned", label: "FedRAMP Moderate equivalent", target: "2027" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === "in-progress" ? "bg-amber-400" : "bg-gray-200"}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{item.target}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p className="text-sm text-gray-600 mb-2">
          Security issues: <a href="mailto:security@houndshield.com" className="text-blue-600 underline">security@houndshield.com</a>
        </p>
        <p className="text-sm text-gray-600">
          Responsible disclosure policy and PGP key published at{" "}
          <span className="font-mono text-gray-800">houndshield.com/.well-known/security.txt</span>
        </p>
      </section>
    </main>
  );
}
