import Link from "next/link";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo/structured-data";
import type { FaqItem } from "@/lib/seo/faqs";

interface FaqSectionProps {
  items: FaqItem[];
  /** Question-format heading — the AEO-correct way to title an FAQ block. */
  title?: string;
  eyebrow?: string;
  /** Center the heading (hermes marketing convention) or keep it left-aligned. */
  align?: "center" | "left";
  /** Show the "Still have questions?" contact row under the accordion. */
  contactCta?: boolean;
  className?: string;
}

/**
 * Renders a visible FAQ accordion AND the matching FAQPage JSON-LD together.
 *
 * Coupling the two guarantees the structured data always reflects on-page
 * content — the condition Google requires before it will surface FAQ rich
 * results, PAA answers, or voice responses from a page.
 */
export function FaqSection({
  items,
  title = "Frequently asked questions",
  eyebrow = "FAQ",
  align = "center",
  contactCta = true,
  className = "",
}: FaqSectionProps) {
  if (items.length === 0) return null;

  const centered = align === "center";

  return (
    <section
      aria-labelledby="faq-heading"
      className={`w-full max-w-3xl mx-auto px-6 py-20 ${className}`}
    >
      <JsonLd schema={faqPageSchema(items)} />

      <div className={`mb-10 ${centered ? "text-center" : ""}`}>
        {eyebrow ? (
          <p className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-[var(--hs-steel-dark)] mb-3">
            {eyebrow}
          </p>
        ) : null}

        <h2
          id="faq-heading"
          className="text-[clamp(28px,4vw,40px)] font-editorial font-semibold tracking-tight leading-[1.08] text-[var(--hs-ink)]"
        >
          {title}
        </h2>
      </div>

      <FaqAccordion items={items} />

      {contactCta ? (
        <p
          className={`mt-8 text-[15px] text-[var(--hs-ink-secondary)] ${centered ? "text-center" : ""}`}
        >
          Still have questions?{" "}
          <Link
            href="/contact"
            className="font-semibold text-[var(--hs-steel-dark)] underline underline-offset-4 decoration-[var(--hs-border-strong)] hover:decoration-[var(--hs-steel-dark)] transition-colors"
          >
            Talk to a compliance engineer
          </Link>{" "}
          — we respond within 4 business hours.
        </p>
      ) : null}
    </section>
  );
}
