import Link from "next/link";
import { Shield, Zap, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
          <div className={`relative w-8 h-8 `}>
  <Shield className="w-full h-full text-brand-400" strokeWidth={1.5} />
  <Zap className={`absolute inset-0 m-auto w-4 h-4 text-white`} strokeWidth={2} />
</div>
        </div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-white/40 mb-8">
          This page doesn't exist. It might have been moved or the URL is incorrect.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Kaelus
        </Link>
      </div>
    </div>
  );
}
