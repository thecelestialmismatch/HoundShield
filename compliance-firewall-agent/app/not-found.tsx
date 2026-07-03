import { Logo } from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Logo size={48} className="mb-6 mx-auto" />
        <h1 className="text-6xl font-bold text-[var(--hs-ink)] mb-2">404</h1>
        <p className="text-[var(--hs-ink-secondary)] mb-8">
          This page doesn&apos;t exist. It might have been moved or the URL is incorrect.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to HoundShield
        </Link>
      </div>
    </div>
  );
}
