import Link from "next/link";
import {
  Shield,
  Zap,
  Bell,
  BarChart3,
  Users,
  ArrowRight,
  Check,
  Code2,
} from "lucide-react";

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Shield className="h-5 w-5 text-blue-600" />
          AIBudgetGuard
        </Link>
        <div className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
          <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">
            How it works
          </Link>
          <Link href="#pricing" className="hover:text-slate-900 transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-slate-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
          <Zap className="h-3.5 w-3.5" />
          One URL change. Full visibility.
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Stop getting{" "}
          <span className="text-blue-600">surprise AI bills</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AIBudgetGuard is a transparent proxy that sits between your code and OpenAI,
          Anthropic, and Gemini. Real-time cost attribution, hard budget caps, and
          Slack alerts — before the invoice arrives.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border border-slate-200 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            See how it works
          </Link>
        </div>

        {/* Code snippet — before/after */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 text-left text-sm">
          <div className="rounded-xl bg-slate-900 p-5">
            <p className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Before</p>
            <pre className="font-mono text-slate-300 leading-relaxed">
              <span className="text-slate-500">// OpenAI SDK</span>{"\n"}
              <span className="text-blue-300">const</span> client = <span className="text-green-300">new</span> OpenAI({"{"}
              {"\n"}
              {"  "}apiKey: process.env.OPENAI_KEY{"\n"}
              {"}"});
            </pre>
          </div>
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-blue-500/40">
            <p className="mb-3 text-xs font-medium text-blue-400 uppercase tracking-wider">After — one line change</p>
            <pre className="font-mono text-slate-300 leading-relaxed">
              <span className="text-slate-500">// Same SDK, new baseURL</span>{"\n"}
              <span className="text-blue-300">const</span> client = <span className="text-green-300">new</span> OpenAI({"{"}
              {"\n"}
              {"  "}apiKey: process.env.OPENAI_KEY,{"\n"}
              {"  "}<span className="text-yellow-300">baseURL</span>: <span className="text-green-300">&quot;https://aibudgetguard.com/v1&quot;</span>,{"\n"}
              {"  "}<span className="text-yellow-300">defaultHeaders</span>: {"{"}
              {"\n"}
              {"    "}&quot;x-org-id&quot;: <span className="text-green-300">&quot;your-org-id&quot;</span>,{"\n"}
              {"    "}&quot;x-project-id&quot;: <span className="text-green-300">&quot;backend-api&quot;</span>,{"\n"}
              {"  "}{"}"}
              {"\n"}
              {"}"});
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Change one URL",
      body: "Point your OpenAI, Anthropic, or Gemini SDK to aibudgetguard.com/v1. No other code changes needed.",
    },
    {
      n: "02",
      title: "Tag every request",
      body: "Add x-org-id, x-user-id, and x-project-id headers. We attribute every dollar to the right team.",
    },
    {
      n: "03",
      title: "Watch costs in real time",
      body: "Dashboard shows spend by team, project, and model. Alerts fire at 80%. Requests block at your limit.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-slate-50 py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-slate-900">Deploy in under 5 minutes</h2>
        <p className="mt-4 text-center text-slate-600">
          No agents, no sidecars, no infrastructure changes. Just a proxy URL.
        </p>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl bg-white border border-slate-200 p-6">
              <span className="text-4xl font-bold text-blue-100">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Zap,
      title: "Transparent proxy passthrough",
      body: "Fully compatible with every AI SDK. Change baseURL, nothing else. Latency overhead under 10ms.",
    },
    {
      icon: Users,
      title: "Per-team cost attribution",
      body: "Tag requests with x-user-id and x-project-id. See exactly which team, service, or experiment is spending.",
    },
    {
      icon: Shield,
      title: "Hard budget caps",
      body: "Set a monthly limit per org, project, or user. Requests that would exceed the limit get a 429 — instantly.",
    },
    {
      icon: Bell,
      title: "Slack + Teams alerts",
      body: "Get notified at 80% with a soft alert. Critical alert when the limit is hit. Configurable per org.",
    },
    {
      icon: BarChart3,
      title: "Spend dashboard",
      body: "Daily spend charts, project breakdowns, model cost comparison. CSV export. No BI tool required.",
    },
    {
      icon: Code2,
      title: "OpenAI, Anthropic, Gemini",
      body: "Supports GPT-4o, Claude Opus/Sonnet/Haiku, Gemini 2.5 Pro/Flash, and all their model variants.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <f.icon className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
const TIERS = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "For small teams getting AI spend under control.",
    features: [
      "Up to 10 users",
      "3 providers (OpenAI, Anthropic, Google)",
      "1 org-level budget",
      "Email alerts",
      "30-day usage history",
    ],
    cta: "Start free trial",
    href: "/login",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$299",
    period: "/mo",
    description: "For engineering teams with multiple projects.",
    features: [
      "Up to 50 users",
      "All providers",
      "Unlimited budgets (org + project + user)",
      "Slack & Teams alerts",
      "90-day usage history",
      "CSV export",
    ],
    cta: "Start free trial",
    href: "/login",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$999",
    period: "/mo",
    description: "For large orgs with compliance requirements.",
    features: [
      "Unlimited users",
      "All providers",
      "Unlimited budgets",
      "SSO (SAML, OIDC)",
      "1-year usage history",
      "SLA + dedicated support",
    ],
    cta: "Contact us",
    href: "mailto:hello@aibudgetguard.com",
    highlight: false,
  },
] as const;

function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-slate-900">Simple pricing</h2>
        <p className="mt-4 text-center text-slate-600">
          14-day free trial on all plans. No credit card required.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-xl border p-7 flex flex-col ${
                t.highlight
                  ? "border-blue-600 bg-blue-600 text-white ring-2 ring-blue-600"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className={`text-sm font-semibold ${t.highlight ? "text-blue-100" : "text-slate-500"}`}>
                {t.name}
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{t.price}</span>
                <span className={`text-sm ${t.highlight ? "text-blue-200" : "text-slate-500"}`}>
                  {t.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${t.highlight ? "text-blue-100" : "text-slate-600"}`}>
                {t.description}
              </p>
              <ul className="mt-6 space-y-2 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check
                      className={`h-4 w-4 shrink-0 ${t.highlight ? "text-blue-200" : "text-blue-600"}`}
                    />
                    <span className={t.highlight ? "text-blue-50" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                  t.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10 px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Shield className="h-4 w-4 text-blue-600" />
          AIBudgetGuard
        </div>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} AIBudgetGuard. Stop the bill shock.
        </p>
        <div className="flex gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          <a href="mailto:hello@aibudgetguard.com" className="hover:text-slate-900 transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
