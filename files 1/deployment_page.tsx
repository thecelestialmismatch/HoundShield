import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Modes | HoundShield",
  description: "Three deployment modes. Only Mode B and C are CUI-safe for DFARS 7012 / SC.3.177.",
};

const modes = [
  {
    label: "A", name: "Hosted Trial",
    endpoint: "proxy.houndshield.com",
    cuiSafe: false, setupTime: "60 seconds",
    rightFor: "Evaluation and demos only — do not route CUI through this mode",
    warning: "The management plane runs on Vercel, which is not FedRAMP-authorized. Do not route CUI prompts through Mode A. It does not satisfy DFARS 7012 or SC.3.177.",
    steps: [
      "Sign up at houndshield.com/signup",
      'Set base_url: "https://proxy.houndshield.com/v1"',
      "Run a test prompt — non-CUI only",
    ],
  },
  {
    label: "B", name: "Self-Hosted Docker",
    endpoint: "localhost:8080 (your infrastructure)",
    cuiSafe: true, setupTime: "10 minutes",
    rightFor: "CUI-handling contractors, CMMC Level 2, DFARS 7012 compliance",
    warning: null,
    steps: [
      "docker pull houndshield/proxy:latest",
      "docker run -p 8080:8080 -e HOUNDSHIELD_LICENSE_KEY=$KEY houndshield/proxy:latest",
      'Set base_url: "http://localhost:8080/v1"',
      "All scanning runs on your hardware. Zero data leaves your network.",
    ],
  },
  {
    label: "C", name: "Air-Gapped",
    endpoint: "Your isolated network",
    cuiSafe: true, setupTime: "Contact sales",
    rightFor: "IL-5+, classified environments, full network isolation",
    warning: null,
    steps: [
      "Contact enterprise@houndshield.com",
      "Offline install package provided on encrypted media",
      "No external network calls of any kind",
    ],
  },
];

export default function DeploymentPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold mb-2">Deployment Modes</h1>
      <p className="text-gray-500 mb-10 text-lg">
        Mode B and C are the only CUI-safe options. Your C3PAO assessor will ask about this.
      </p>
      <div className="space-y-6">
        {modes.map((m) => (
          <div key={m.label} className={`border rounded-xl p-6 ${m.cuiSafe ? "border-green-200 bg-green-50/30" : "border-yellow-200 bg-yellow-50/30"}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold bg-gray-100 rounded px-2 py-1">Mode {m.label}</span>
                <h2 className="text-xl font-semibold">{m.name}</h2>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${m.cuiSafe ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                {m.cuiSafe ? "✓ CUI-Safe" : "⚠ Non-CUI Only"}
              </span>
            </div>
            {m.warning && (
              <div className="mb-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-900">
                <strong>Important:</strong> {m.warning}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Endpoint</span><p className="font-mono text-gray-800 mt-0.5">{m.endpoint}</p></div>
              <div><span className="text-gray-500">Setup time</span><p className="font-semibold mt-0.5">{m.setupTime}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Right for</span><p className="mt-0.5">{m.rightFor}</p></div>
            </div>
            <ol className="space-y-1.5">
              {m.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="font-mono text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                  <span className="font-mono text-gray-700">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <div className="mt-10 border border-gray-200 rounded-xl p-6 bg-gray-50">
        <h3 className="font-semibold mb-2">SC.3.177 Compliance Note</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          NIST 800-171 Rev 2 SC.3.177 requires cryptographic protection of CUI in transit. 
          Routing CUI through any third-party cloud — including Mode A — does not satisfy this control 
          for CMMC Level 2. Mode B keeps all scanning inside your boundary. Mode C provides complete isolation.
          Any competitor product that routes your prompts through their cloud infrastructure has the same problem.
        </p>
      </div>
    </main>
  );
}
