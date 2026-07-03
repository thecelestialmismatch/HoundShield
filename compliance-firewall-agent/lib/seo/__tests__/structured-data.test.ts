import { describe, it, expect } from "vitest";
import {
  softwareApplicationSchema,
  organizationSchema,
  websiteSchema,
  faqPageSchema,
  howToSchema,
  breadcrumbSchema,
  BASE_URL,
} from "../structured-data";
import type { FaqItem, HowToStep } from "../faqs";

describe("softwareApplicationSchema", () => {
  const schema = softwareApplicationSchema();

  it("declares a valid SoftwareApplication", () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.name).toBe("HoundShield");
    expect(schema.url).toBe(BASE_URL);
  });

  it("leads with the $499 report offer and matches the pricing tiers", () => {
    const offers = schema.offers as Array<Record<string, unknown>>;
    expect(offers).toHaveLength(6);
    for (const offer of offers) {
      expect(offer["@type"]).toBe("Offer");
      expect(offer.priceCurrency).toBe("USD");
      expect(typeof offer.price).toBe("string");
    }
    // $499 one-time report is the lead product (listed first).
    expect(offers[0].name).toBe("CMMC AI Risk Assessment Report");
    expect(offers[0].price).toBe("499");
    // Tier prices match app/pricing/page.tsx (Free/Pro/Growth/Enterprise/Agency).
    expect(offers.map((o) => o.price)).toEqual(["499", "0", "199", "499", "999", "2499"]);
    // The $2,499 tier is "Agency", not "Federal".
    expect(offers.some((o) => o.name === "Agency")).toBe(true);
    expect(offers.some((o) => o.name === "Federal")).toBe(false);
  });

  it("lists product features", () => {
    const features = schema.featureList as string[];
    expect(features.length).toBeGreaterThan(0);
    expect(features).toContain("CUI detection and blocking");
  });
});

describe("organizationSchema", () => {
  it("declares a valid Organization with logo, contact, and social profile", () => {
    const schema = organizationSchema();
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("HoundShield");
    expect((schema.logo as Record<string, unknown>)["@type"]).toBe("ImageObject");
    expect((schema.contactPoint as Record<string, unknown>).contactType).toBe("Sales");
    // sameAs must carry the verified profile (Knowledge Panel signal).
    expect(schema.sameAs as string[]).toContain("https://x.com/houndshield");
  });
});

describe("websiteSchema", () => {
  it("declares a WebSite with the brand name (site-name signal)", () => {
    const schema = websiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("HoundShield");
    expect(schema.url).toBe(BASE_URL);
    expect((schema.publisher as Record<string, unknown>)["@type"]).toBe("Organization");
  });
});

describe("faqPageSchema", () => {
  const items: FaqItem[] = [
    { question: "What is it?", answer: "A test answer." },
    { question: "How much?", answer: "Free." },
  ];
  const schema = faqPageSchema(items);

  it("declares a FAQPage", () => {
    expect(schema["@type"]).toBe("FAQPage");
  });

  it("maps every item to a Question with an acceptedAnswer", () => {
    const entities = schema.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(items.length);
    entities.forEach((entity, i) => {
      expect(entity["@type"]).toBe("Question");
      expect(entity.name).toBe(items[i].question);
      const answer = entity.acceptedAnswer as Record<string, unknown>;
      expect(answer["@type"]).toBe("Answer");
      expect(answer.text).toBe(items[i].answer);
    });
  });

  it("handles an empty list without throwing", () => {
    expect((faqPageSchema([]).mainEntity as unknown[])).toHaveLength(0);
  });
});

describe("howToSchema", () => {
  const steps: HowToStep[] = [
    { name: "Step one", text: "Do the first thing." },
    { name: "Step two", text: "Do the second thing." },
  ];

  it("numbers steps sequentially from 1", () => {
    const schema = howToSchema({ name: "Install", description: "Setup guide", steps });
    expect(schema["@type"]).toBe("HowTo");
    const renderedSteps = schema.step as Array<Record<string, unknown>>;
    expect(renderedSteps.map((s) => s.position)).toEqual([1, 2]);
    expect(renderedSteps[0]["@type"]).toBe("HowToStep");
    expect(renderedSteps[0].name).toBe("Step one");
  });

  it("includes totalTime only when provided", () => {
    expect(howToSchema({ name: "x", description: "y", steps }).totalTime).toBeUndefined();
    expect(
      howToSchema({ name: "x", description: "y", steps, totalTime: "PT15M" }).totalTime,
    ).toBe("PT15M");
  });
});

describe("breadcrumbSchema", () => {
  it("joins relative paths to BASE_URL and preserves absolute URLs", () => {
    const schema = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Docs", path: "/docs" },
      { name: "External", path: "https://example.com/x" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[0].item).toBe(`${BASE_URL}/`);
    expect(items[1].item).toBe(`${BASE_URL}/docs`);
    expect(items[2].item).toBe("https://example.com/x");
  });
});
