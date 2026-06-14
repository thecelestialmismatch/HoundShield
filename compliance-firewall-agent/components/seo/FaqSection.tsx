import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo/structured-data";
import type { FaqItem } from "@/lib/seo/faqs";

interface FaqSectionProps {
  items: FaqItem[];
  /** Question-format heading — the AEO-correct way to title an FAQ block. */
  title?: string;
  eyebrow?: string;
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
  eyebrow,
  className = "",
}: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className={`w-full max-w-3xl mx-auto px-6 py-20 ${className}`}
    >
      <JsonLd schema={faqPageSchema(items)} />

      {eyebrow ? (
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--hs-ink-tertiary)] mb-3">
          {eyebrow}
        </p>
      ) : null}

      <h2
        id="faq-heading"
        className="text-[clamp(28px,4vw,44px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-8"
      >
        {title}
      </h2>

      <FaqAccordion items={items} />
    </section>
  );
}
