"use client";

import { Key, Fingerprint, Lock, Eye, Database, Globe, Server, Terminal } from "lucide-react";

export function DetectionGrid() {
    const patterns = [
        { icon: Key, name: "API Keys", examples: "sk-proj-***, AKIA***" },
        { icon: Fingerprint, name: "SSN / Gov IDs", examples: "123-45-6789" },
        { icon: Lock, name: "Credit Cards", examples: "4111-****-****-1111" },
        { icon: Eye, name: "Medical Data", examples: "Patient names, Diagnosis" },
        { icon: Database, name: "Financial Data", examples: "Q4 Revenue, Mergers" },
        { icon: Globe, name: "Emails/Phones", examples: "user@company.com" },
        { icon: Server, name: "Internal IPs", examples: "192.168.x.x, *.corp" },
        { icon: Terminal, name: "Passwords", examples: "DB passwords, tokens" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {patterns.map((p, i) => {
                const Icon = p.icon;
                // Stagger animation delays for a cool wave effect
                return (
                    <div
                        key={p.name}
                        className="glass-card p-4 md:p-5 group hover:border-brand-500/30 hover:bg-white/[0.03] transition-all duration-300 animate-fade-in relative overflow-hidden"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        {/* Glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10">
                            <Icon className="w-6 h-6 text-brand-400/50 group-hover:text-brand-400 transition-colors duration-300 mb-3" />
                            <h4 className="text-sm md:text-base font-bold text-white mb-1">{p.name}</h4>
                            <p className="text-xs md:text-sm text-white/40 font-mono group-hover:text-emerald-400/80 transition-colors duration-300">{p.examples}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
