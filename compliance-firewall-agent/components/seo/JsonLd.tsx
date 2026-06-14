import type { JsonLdSchema } from "@/lib/seo/structured-data";

interface JsonLdProps {
  /** A single schema object or an array of them. */
  schema: JsonLdSchema | JsonLdSchema[];
}

/**
 * Renders one or more Schema.org JSON-LD blocks.
 *
 * Server component — emits <script type="application/ld+json"> tags. Used in
 * the root layout (site-wide entities) and on individual pages (page-scoped
 * FAQPage / HowTo / BreadcrumbList).
 */
/**
 * Escape "<" so a value containing "</script>" can never break out of the
 * script tag. Content here is internally defined (no user input), but this is
 * the recommended hardening for inline JSON-LD.
 */
function serialize(schema: JsonLdSchema): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

export function JsonLd({ schema }: JsonLdProps) {
  const schemas = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemas.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialize(entry) }}
        />
      ))}
    </>
  );
}
