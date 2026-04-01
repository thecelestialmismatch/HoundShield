import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Kaelus.online",
  description: "How Kaelus.online collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07070b]">
      <ScrollProgressBar />
      <Navbar variant="dark" />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 11, 2026</p>

        <div className="prose-dark space-y-8 text-sm text-slate-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">1. Information We Collect</h2>
            <p><strong className="text-slate-300">Account Information:</strong> When you create an account, we collect your name, email address, and company name. If you sign in via OAuth (Google, GitHub, Microsoft), we receive your public profile information from those providers.</p>
            <p className="mt-2"><strong className="text-slate-300">Usage Data:</strong> We collect information about how you interact with the platform, including pages visited, features used, API scan counts, and assessment progress.</p>
            <p className="mt-2"><strong className="text-slate-300">Compliance Data:</strong> When you use the AI compliance firewall, we process API request metadata (prompt hashes, risk classifications, detected entities). We never store raw prompt content in plaintext — quarantined items are encrypted with AES-256.</p>
            <p className="mt-2"><strong className="text-slate-300">Payment Information:</strong> Payment processing is handled entirely by Stripe. We do not store credit card numbers. We retain Stripe customer IDs and subscription status.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain the Kaelus.online platform</li>
              <li>Process CMMC/compliance assessments and generate reports</li>
              <li>Detect and classify sensitive data in AI API traffic</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related notifications (security alerts, billing)</li>
              <li>Improve the platform through anonymized analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>AES-256 encryption for quarantined content at rest</li>
              <li>SHA-256 cryptographic audit trail for all compliance events</li>
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>Row Level Security (RLS) in our database</li>
              <li>Regular security audits and dependency scanning</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">4. Data Sharing</h2>
            <p>We do not sell your data. We share information only with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-slate-300">Supabase:</strong> Database hosting and authentication</li>
              <li><strong className="text-slate-300">Stripe:</strong> Payment processing</li>
              <li><strong className="text-slate-300">Vercel:</strong> Application hosting</li>
              <li><strong className="text-slate-300">OpenRouter:</strong> AI model inference (only when you use AI features)</li>
            </ul>
            <p className="mt-2">We may disclose information if required by law or to protect the rights, safety, or property of Kaelus.online or its users.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">5. Data Retention</h2>
            <p>Compliance event data is retained based on your subscription tier (7 days free, 90 days Pro, unlimited Enterprise/Agency). You can request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access, correct, or delete your personal data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We use anonymous analytics cookies to improve the platform. You can control cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">8. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:admin@kaelus.online" className="text-brand-400 hover:text-brand-300">admin@kaelus.online</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <Link href="/terms" className="text-sm text-brand-400 hover:text-brand-300">
            Read our Terms of Service &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
