import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Eye, Users, Zap, Plug, Shield, FileText, Lock, Heart, Briefcase, Globe, Landmark } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import {
  INDUSTRIES,
  getIndustry,
  type ControlStatus,
  type Industry,
} from "../_industries";

/* ─────────────────────────────────────────────────────────────────
 * Industry product pages — verbatim port of the HERMES demo's six
 * `prod-*` views (Direction A). All styling lives in app/hermes.css;
 * content comes from the single source of truth in _industries.ts
 * (already the approved demo copy). SEO JSON-LD preserved.
 * ───────────────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ industry: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const data = getIndustry(industry);
  if (!data) return { title: "Product | HoundShield" };
  const url = `https://houndshield.com/products/${data.slug}`;
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url,
      type: "website",
    },
  };
}

/* Demo status → chip class: everything ships as `st met` except roadmap items. */
const STATUS_CLASS: Record<ControlStatus, string> = {
  Enforced: "st met",
  Live: "st met",
  Logged: "st met",
  Alerted: "st met",
  Roadmap: "st part",
};

/* Demo per-industry head icon (matches the nav mega-menu). */
const HEAD_ICONS: Record<string, React.ElementType> = {
  technology: Lock,
  healthcare: Heart,
  defense: Shield,
  legal: Briefcase,
  global: Globe,
  government: Landmark,
};

const STEP_ICONS = [Plug, Shield, FileText];

function faqJsonLd(data: Industry) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function speakableJsonLd(data: Industry) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.metaTitle,
    url: `https://houndshield.com/products/${data.slug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".prod-sub"],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const data = getIndustry(industry);
  if (!data) notFound();

  const HeadIcon = HEAD_ICONS[data.slug] ?? Shield;

  return (
    <div className="hermes" style={{ minHeight: "100vh" }}>
      <NavV3 />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(data)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd(data)) }}
      />

      <main className="page">
        <div className="section">
          <div className="container">
            <div className="prod-head">
              <div className="ic" style={{ margin: 0 }}><HeadIcon /></div>
              <div className="eyebrow">
                {data.eyebrow}
                {data.comingSoon && <span className="dd-soon" style={{ marginLeft: ".4rem" }}>Coming soon</span>}
              </div>
            </div>
            <h1 className="display prod-h1">{data.h1}</h1>
            <p className="prod-sub">{data.sub}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href={data.primaryCtaHref}>
                {data.comingSoon ? "Join the waitlist" : "Start free"} <ArrowRight />
              </Link>
              <Link className="btn btn-ghost" href="/pricing">See pricing</Link>
            </div>

            <div className="grid-3" style={{ marginTop: 48 }}>
              {[
                { Icon: Eye,   h: "What it is",     b: data.whatItIs },
                { Icon: Users, h: "Who it's for",   b: data.whoFor },
                { Icon: Zap,   h: "How you use it", b: data.howUse },
              ].map(({ Icon, h, b }) => (
                <div className="card" key={h}>
                  <div className="ic"><Icon /></div>
                  <h3>{h}</h3>
                  <p>{b}</p>
                </div>
              ))}
            </div>

            <div className="section-head" style={{ margin: "56px auto 24px" }}>
              <h2 className="display">What it detects for you</h2>
            </div>
            <div className="chip-grid">
              {data.detects.map((d) => (
                <div className="gateway-box" style={{ borderStyle: "solid" }} key={d}>{d}</div>
              ))}
            </div>

            {data.steps.length > 0 && (
              <div className="steps" style={{ marginTop: 48 }}>
                {data.steps.map((s, i) => {
                  const StepIcon = STEP_ICONS[i % STEP_ICONS.length];
                  return (
                    <div className="step" key={s.title}>
                      <div className="num">{String(i + 1).padStart(2, "0")}</div>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.body}</p>
                      </div>
                      <div className="ic"><StepIcon /></div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="section-head" style={{ margin: "56px auto 22px" }}>
              <h2 className="display">{data.frameworkTitle}</h2>
            </div>
            <div className="panel">
              {data.framework.map((row) => (
                <div className="ctrl-row" key={row.control}>
                  <span>
                    <b>{row.control}</b>
                    <br />
                    <span className="map-sub">{row.detail}</span>
                  </span>
                  <span className={STATUS_CLASS[row.status]}>{row.status}</span>
                </div>
              ))}
            </div>

            <div className="section-head" style={{ margin: "48px auto 20px" }}>
              <div className="eyebrow">FAQ</div>
              <h2 className="display">Common questions</h2>
            </div>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <FaqAccordion
                items={data.faqs.map((f) => ({ question: f.q, answer: f.a }))}
              />
            </div>

            <div className="cta-band" style={{ marginTop: 48 }}>
              <h2 className="display">{data.cta.title}</h2>
              <p>{data.cta.body}</p>
              <Link className="btn btn-primary" href={data.cta.href}>
                {data.cta.button} <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  );
}
