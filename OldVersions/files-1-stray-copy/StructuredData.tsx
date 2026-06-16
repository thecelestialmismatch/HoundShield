// components/StructuredData.tsx
// Drop this into your root layout.tsx inside <head>

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HoundShield",
    url: "https://houndshield.com",
    description:
      "Local-only AI prompt compliance firewall for CMMC Level 2, HIPAA, and SOC 2. OpenAI-compatible proxy. Scans locally in under 10ms. C3PAO-ready PDF evidence.",
    contactPoint: { "@type": "ContactPoint", email: "hello@houndshield.com", contactType: "sales" },
    sameAs: ["https://github.com/thecelestialmismatch/HoundShield"],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function ProductSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HoundShield",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Docker, Linux, macOS, Windows",
    url: "https://houndshield.com",
    description:
      "OpenAI-compatible AI proxy for CMMC Level 2 compliance. Scans prompts locally in under 10ms. Generates C3PAO-ready PDF evidence mapped to all 110 NIST SP 800-171 Rev 2 controls.",
    offers: [
      { "@type": "Offer", name: "CMMC AI Risk Assessment Report", price: "499", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", priceType: "OneTime" } },
      { "@type": "Offer", name: "Starter", price: "299", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" } },
      { "@type": "Offer", name: "Pro", price: "799", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" } },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Can defense contractors use ChatGPT?", acceptedAnswer: { "@type": "Answer", text: "Commercial ChatGPT is not authorized for CUI handling under DFARS 7012 / CMMC SC.3.177. Using it without controls creates a potential CUI spillage event requiring incident reporting. Defense contractors can use ChatGPT for non-CUI work, but must have an audit trail and access controls in place for anything touching Controlled Unclassified Information." } },
      { "@type": "Question", name: "What NIST 800-171 controls apply to AI prompt monitoring?", acceptedAnswer: { "@type": "Answer", text: "Controls 3.1.20 (external systems), 3.8 (media protection), 3.13 (system and communications protection including SC.3.177 for cryptographic mechanisms), and 3.14 (system and information integrity). HoundShield maps every detection event to the specific control family implicated." } },
      { "@type": "Question", name: "Is HoundShield CUI-safe?", acceptedAnswer: { "@type": "Answer", text: "Mode B (self-hosted Docker) is CUI-safe — all scanning runs on your hardware and nothing leaves your network. Mode A (hosted trial at proxy.houndshield.com) is NOT CUI-safe and should only be used for non-CUI evaluation." } },
      { "@type": "Question", name: "How does HoundShield compare to Microsoft Purview or GCC High?", acceptedAnswer: { "@type": "Answer", text: "Microsoft GCC High with Copilot is a valid CMMC-compliant path but costs $149,000–$200,000/year and requires full M365 migration — viable only for organizations with 200+ employees who are already Microsoft shops. HoundShield works with any AI tool (ChatGPT, Claude, Copilot, Cursor) and costs under $1,500/month." } },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
