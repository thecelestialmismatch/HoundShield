"use client";

import { Shield, Cloud, Database, Globe, Lock, Zap, Server, Cpu, Layers, CodeXml } from "lucide-react";

const brands = [
    { name: "Fortune 500 Banks", icon: Shield },
    { name: "Cloud Platforms", icon: Cloud },
    { name: "Healthcare Systems", icon: Database },
    { name: "Global Enterprises", icon: Globe },
    { name: "Government Agencies", icon: Lock },
    { name: "AI Startups", icon: Zap },
    { name: "Data Centers", icon: Server },
    { name: "Chip Manufacturers", icon: Cpu },
    { name: "SaaS Platforms", icon: Layers },
    { name: "Dev Tools", icon: CodeXml },
];

export function TrustedBy() {
    const doubled = [...brands, ...brands];

    return (
        <section className="py-16 relative overflow-hidden border-y border-white/[0.04]">
            <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-[0.2em] text-white/25 font-semibold">
                    Trusted by industry leaders worldwide
                </p>
            </div>

            <div className="relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0c0c10] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0c0c10] to-transparent z-10" />

                {/* Scrolling marquee */}
                <div className="flex animate-marquee">
                    {doubled.map((brand, i) => {
                        const Icon = brand.icon;
                        return (
                            <div
                                key={`${brand.name}-${i}`}
                                className="flex items-center gap-3 px-8 py-3 shrink-0"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-white/20" />
                                </div>
                                <span className="text-sm font-medium text-white/20 whitespace-nowrap">
                                    {brand.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
