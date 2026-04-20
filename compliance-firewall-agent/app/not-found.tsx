import { Logo } from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070b] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Logo className="w-12 h-12 mb-6 mx-auto" />
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-slate-400 mb-8">
          This page doesn't exist. It might have been moved or the URL is incorrect.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hound Shield
        </Link>
      </div>
    </div>
  );
}
