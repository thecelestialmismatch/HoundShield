import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { LEGAL_ENTITY } from "@/lib/legal/entity";
import { A11Y_GATE_MIN_SCORE, A11Y_MEASURED_RANGE } from "@/lib/legal/accessibility";

export const metadata: Metadata = {
  title: "Accessibility Statement | HoundShield",
  description:
    "HoundShield's accessibility posture: what we measure, what those measurements do and do not prove, known limitations, and how to report a barrier.",
  alternates: { canonical: "/accessibility" },
};

/**
 * Accessibility statement — EN 301 549 / WCAG 2.1 AA framing, as expected by
 * the European Accessibility Act (Directive (EU) 2019/882) and by ADA Title III
 * and Section 508 practice in the US.
 *
 * THE HONESTY CONSTRAINT. It would be easy, and is extremely common, to write
 * "HoundShield is fully conformant with WCAG 2.1 Level AA". We have not done
 * the work that claim requires: no manual audit, no screen-reader testing, no
 * third-party assessment. What we have is an automated Lighthouse gate in CI.
 * Automated tooling detects a minority of WCAG failure modes — it cannot judge
 * whether alt text is meaningful, whether focus order is logical, or whether a
 * control is operable with a screen reader.
 *
 * So this page claims PARTIAL conformance and says exactly what evidence backs
 * it. Publishing an unverified conformance claim to buyers who procure against
 * Section 508 would be the same category of error as the fabricated
 * testimonials removed in #275 — and this one would be a representation made to
 * a federal customer.
 */
export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Accessibility Statement</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">
          Our conformance posture, the evidence behind it, and how to report a barrier.
        </p>

        <div className="prose-dark space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Conformance status
            </h2>
            <p>
              HoundShield&rsquo;s public website is{" "}
              <strong className="text-[var(--hs-ink)]">partially conformant</strong> with{" "}
              <a
                href="https://www.w3.org/TR/WCAG21/"
                className="text-brand-700 hover:text-brand-700"
                rel="noopener noreferrer"
                target="_blank"
              >
                WCAG 2.1 Level AA
              </a>
              , the standard referenced by EN 301 549 and by the European Accessibility Act
              (Directive (EU) 2019/882), and used as the benchmark under ADA Title III and Section
              508 in the United States.
            </p>
            <p className="mt-3">
              &ldquo;Partially conformant&rdquo; is the accurate term and we are using it
              deliberately rather than claiming full conformance. It means most of the standard is
              met and some of it has not been verified.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              What we actually measure
            </h2>
            <p>
              Every pull request runs an automated Lighthouse accessibility audit against the
              homepage, <Link href="/pricing" className="text-brand-700 hover:text-brand-700">/pricing</Link>,{" "}
              <Link href="/controls" className="text-brand-700 hover:text-brand-700">/controls</Link> and the blog. It is a{" "}
              <strong className="text-[var(--hs-ink)]">hard gate</strong>: below a score of{" "}
              {A11Y_GATE_MIN_SCORE} the build fails and the change does not merge.
            </p>
            <p className="mt-3">
              Measured range at the time of writing: {A11Y_MEASURED_RANGE}. The threshold is set
              below the measured floor so ordinary run-to-run variance does not produce a
              randomly-red check — a check people learn to ignore is worse than no check.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              What that does <em>not</em> prove
            </h2>
            <p>
              Automated tooling catches a minority of the ways a page can fail WCAG. It can confirm
              that an image has an <code>alt</code> attribute; it cannot judge whether the text is
              meaningful. It checks colour contrast ratios; it cannot tell you whether the focus
              order makes sense, whether a custom control announces its state to a screen reader,
              or whether an error message is reachable by the person who triggered it.
            </p>
            <p className="mt-3">We have <strong className="text-[var(--hs-ink)]">not</strong> yet carried out:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>a manual WCAG 2.1 AA audit,</li>
              <li>testing with screen readers or other assistive technology,</li>
              <li>a third-party accessibility assessment or VPAT.</li>
            </ul>
            <p className="mt-3">
              Until those exist, treat this statement as evidence of an automated floor, not of
              full conformance. If you are procuring against Section 508 and need a VPAT, contact
              us and say so — we would rather tell you where we are than have you discover it
              later.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Known limitations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                The signed-in Command Center includes data-dense dashboards and charts. Chart
                content is conveyed visually; equivalent non-visual presentation has not been
                verified.
              </li>
              <li>
                A decorative cursor effect is applied on devices with a fine pointer. It is
                cosmetic and does not gate any function, but it has not been assessed for motion
                sensitivity.
              </li>
              <li>
                PDF reports generated by the product have not been tested for tagged-PDF
                accessibility.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Reporting a barrier
            </h2>
            <p>
              Email{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.legalEmail}`}
                className="text-brand-700 hover:text-brand-700"
              >
                {LEGAL_ENTITY.legalEmail}
              </a>{" "}
              with the page and what went wrong. We aim to respond within five business days. If
              something blocks you from completing a purchase or reading a policy, say so and we
              will send you the same information in a format that works — that is not a
              workaround we resent, it is the point.
            </p>
            <p className="mt-3">
              Under the European Accessibility Act you may also escalate to the enforcement body in
              your EU member state if our response is inadequate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Other policies</h2>
            <p>
              See the{" "}
              <Link href="/legal" className="text-brand-700 hover:text-brand-700">
                legal index
              </Link>{" "}
              for every published policy.
            </p>
          </section>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
