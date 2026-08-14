import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { LEGAL_DOCUMENTS } from "@/lib/legal/index-registry";
import { controllerDisclosure, isEntityEstablished, LEGAL_ENTITY } from "@/lib/legal/entity";

export const metadata: Metadata = {
  title: "Legal | HoundShield",
  description:
    "Every HoundShield legal document in one place — privacy, cookies, terms, refunds, DPA, sub-processors, acceptable use and accessibility — with the regulation each one answers to.",
  alternates: { canonical: "/legal" },
};

/**
 * One page a buyer, a privacy officer or a procurement reviewer can be sent to.
 *
 * Rendered from lib/legal/index-registry.ts, and a guard test walks every entry
 * and fails if any has no page behind it. On a legal index a dead link is the
 * defect itself: it advertises a policy that does not exist.
 *
 * The provider-identification block below is the EU e-Commerce Directive Art. 5
 * disclosure. It prints `controllerDisclosure()` — which currently states,
 * truthfully, that the business is not yet incorporated — rather than a
 * fabricated entity. See lib/legal/entity.ts for why that is a deliberate
 * choice and not an oversight.
 */
export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Legal</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">
          Every published policy, and the regulation each one answers to.
        </p>

        <ul className="space-y-4">
          {LEGAL_DOCUMENTS.map((doc) => (
            <li
              key={doc.href}
              className="rounded-2xl border border-[var(--hs-border)] bg-white p-5"
            >
              <Link
                href={doc.href}
                className="text-base font-semibold text-[var(--hs-ink)] hover:text-brand-700"
              >
                {doc.title}
              </Link>
              <p className="mt-1 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                {doc.summary}
              </p>
              <p className="mt-2 text-xs text-[var(--hs-ink-tertiary)]">
                <span className="font-medium">
                  {doc.basis === "statutory" ? "Required by" : "Published by choice"}
                </span>
                {doc.basis === "statutory" ? ": " : " — "}
                {doc.required.join(" · ")}
              </p>
            </li>
          ))}
        </ul>

        <section className="mt-12 rounded-2xl border border-[var(--hs-border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
            Who operates this service
          </h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
            {controllerDisclosure()}
          </p>
          {!isEntityEstablished() && (
            <p className="mt-3 text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
              We publish this rather than a placeholder because a named, contactable operator is
              what GDPR Art. 13(1)(a), the EU e-Commerce Directive Art. 5 and CCPA each require,
              and stating the position plainly is more useful to you than an invented company
              name.
            </p>
          )}
          <p className="mt-3 text-sm text-[var(--hs-ink-secondary)]">
            Contact:{" "}
            <a
              href={`mailto:${LEGAL_ENTITY.legalEmail}`}
              className="text-brand-700 hover:text-brand-700"
            >
              {LEGAL_ENTITY.legalEmail}
            </a>
          </p>
        </section>
      </main>
      <FooterV3 />
    </div>
  );
}
