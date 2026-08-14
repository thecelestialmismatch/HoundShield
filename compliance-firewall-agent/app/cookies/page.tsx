import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { STORED_ITEMS, itemsByCategory, type StoredItem } from "@/lib/legal/cookies";
import { LEGAL_ENTITY } from "@/lib/legal/entity";
import { CookieSettingsButton } from "./CookieSettingsButton";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Every cookie and browser-storage item HoundShield sets, what it is for, how long it lasts, and how to change your choice. Analytics stays off until you opt in.",
  alternates: { canonical: "/cookies" },
};

/**
 * The inventory the consent banner asks about.
 *
 * ePrivacy Art. 5(3) and GDPR Art. 13 require clear and comprehensive
 * information about what is stored. The banner was already correct — analytics
 * off until opt-in, "Accept essential" offered alongside "Accept all" — but it
 * linked to a two-sentence privacy clause that named nothing, and consent to an
 * unnamed set is not informed consent.
 *
 * Every row is rendered from lib/legal/cookies.ts, which carries an in-repo
 * evidence path per item, so this page cannot list a cookie the code does not
 * set.
 */
function ItemTable({ items }: { items: readonly StoredItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--hs-border)]">
            <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Name</th>
            <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Set by</th>
            <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Purpose</th>
            <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Type</th>
            <th className="py-2 font-semibold text-[var(--hs-ink)]">Lasts</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="border-b border-[var(--hs-border-subtle)] align-top">
              <td className="py-3 pr-4 font-mono text-xs text-[var(--hs-ink)]">{item.name}</td>
              <td className="py-3 pr-4">{item.provider}</td>
              <td className="py-3 pr-4">{item.purpose}</td>
              <td className="py-3 pr-4 whitespace-nowrap">
                {item.storage === "cookie" ? "Cookie" : "Local storage"}
              </td>
              <td className="py-3">{item.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicyPage() {
  const essential = itemsByCategory("essential");
  const analytics = itemsByCategory("analytics");

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Cookie Policy</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">
          Everything HoundShield stores in your browser — {STORED_ITEMS.length} items in total.
        </p>

        <div className="prose-dark space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <p className="text-base text-[var(--hs-ink)]">
              Two of these are strictly necessary and one is optional. Nothing in the optional
              category is stored, and the analytics library is not even loaded, unless you choose
              &ldquo;Accept all&rdquo;.
            </p>
            <p className="mt-3">
              <strong className="text-[var(--hs-ink)]">Your prompt content is never tracked</strong>,
              in any mode, with or without consent. In Mode B the scanner runs inside your own
              network and prompt text never reaches HoundShield at all — see the{" "}
              <Link href="/security" className="text-brand-700 hover:text-brand-700">
                Security
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Strictly necessary — no consent required
            </h2>
            <p className="mb-4">
              These make the site function. Under ePrivacy Art. 5(3) they are exempt from the
              consent requirement, because without them a service you asked for cannot be
              delivered. Turning them off is not offered because it would mean turning off signing
              in.
            </p>
            <ItemTable items={essential} />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Analytics — off until you opt in
            </h2>
            <p className="mb-4">
              Set only after you choose &ldquo;Accept all&rdquo;. If you choose &ldquo;Accept
              essential&rdquo;, or make no choice at all, the analytics library is never
              initialised, so nothing below is written.
            </p>
            <ItemTable items={analytics} />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Changing your mind
            </h2>
            <p>
              Use the button below and the consent banner reopens, with the same
              &ldquo;Cookie settings&rdquo; control you saw on your first visit. Clearing this
              site&rsquo;s data in your browser has the same effect. Refusing
              analytics costs you nothing: every feature works identically either way, and we do
              not treat a refusal as a reason to ask again on the next page.
            </p>
            <CookieSettingsButton />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              What we do not do
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>No advertising, retargeting or cross-site tracking cookies.</li>
              <li>No selling or sharing of personal information — there is nothing to opt out of under CCPA/CPRA because the sale of personal information does not occur.</li>
              <li>
                No Stripe cookies on this domain. Checkout is Stripe-hosted, so any cookies it uses
                are set on Stripe&rsquo;s own domain under Stripe&rsquo;s policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Questions</h2>
            <p>
              Email{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.legalEmail}`}
                className="text-brand-700 hover:text-brand-700"
              >
                {LEGAL_ENTITY.legalEmail}
              </a>
              . See also our{" "}
              <Link href="/privacy" className="text-brand-700 hover:text-brand-700">
                Privacy Policy
              </Link>
              ,{" "}
              <Link href="/subprocessors" className="text-brand-700 hover:text-brand-700">
                Sub-processors
              </Link>{" "}
              and the{" "}
              <Link href="/legal" className="text-brand-700 hover:text-brand-700">
                full legal index
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
