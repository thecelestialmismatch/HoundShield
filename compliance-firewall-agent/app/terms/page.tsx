import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";

export const metadata: Metadata = {
  title: "Terms of Service | Hound Shield",
  description: "Terms and conditions for using the Hound Shield compliance platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07070b]">
      <ScrollProgressBar />
      <Navbar variant="dark" />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 11, 2026</p>

        <div className="prose-dark space-y-8 text-sm text-slate-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Hound Shield ("the Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">2. Description of Service</h2>
            <p>Hound Shield provides an AI compliance firewall and CMMC readiness platform that helps organizations monitor, classify, and secure their AI API traffic. The Service includes compliance assessments, SPRS scoring, AI-powered remediation guidance, and document generation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must provide accurate and current information during registration</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">4. Subscription and Billing</h2>
            <p>Paid subscriptions are billed in advance on a monthly or annual basis through Stripe. You may cancel at any time, and cancellation takes effect at the end of your current billing period. Refunds are available within 30 days of initial purchase per our money-back guarantee.</p>
            <p className="mt-2">We reserve the right to change pricing with 30 days notice. Existing subscribers will be grandfathered at their current rate for the remainder of their billing period.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
              <li>Exceed your plan's usage limits through automated means</li>
              <li>Share your account credentials with unauthorized users</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">6. Compliance Disclaimer</h2>
            <p><strong className="text-slate-300">Important:</strong> Hound Shield is a compliance readiness tool, not a certification authority. Our CMMC assessments, SPRS scores, and generated documents are for self-assessment and preparation purposes only. They do not constitute legal advice or guarantee certification by a C3PAO (CMMC Third-Party Assessor Organization). You should consult with qualified compliance professionals for official certification guidance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">7. Data Ownership</h2>
            <p>You retain all rights to your data. Hound Shield does not claim ownership of your content, assessment responses, or compliance documents. You grant us a limited license to process your data solely for providing the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Hound Shield shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">9. Termination</h2>
            <p>We may terminate or suspend your account at any time for violation of these terms. Upon termination, your right to use the Service ceases immediately. We will make your data available for export for 30 days following termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes via email or through the Service. Continued use after changes take effect constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">11. Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:info@houndshield.com" className="text-brand-400 hover:text-brand-300">info@houndshield.com</a>. For enterprise legal inquiries, reach our team at <a href="mailto:admin@houndshield.com" className="text-brand-400 hover:text-brand-300">admin@houndshield.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <Link href="/privacy" className="text-sm text-brand-400 hover:text-brand-300">
            Read our Privacy Policy &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
