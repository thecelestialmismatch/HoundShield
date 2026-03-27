"use client";

import { motion } from "framer-motion";

const ROW_ONE = [
  { initials: "DT", name: "DefenseTech Systems",    sector: "Defense"    },
  { initials: "AS", name: "AeroShield Corp",         sector: "Aerospace"  },
  { initials: "FD", name: "Federal Dynamics",        sector: "Gov"        },
  { initials: "PS", name: "Precision Systems",       sector: "Defense"    },
  { initials: "OD", name: "Orbital Defense",         sector: "DoD"        },
  { initials: "SN", name: "SecureNet Gov",           sector: "Gov"        },
  { initials: "CG", name: "CyberGuard Federal",      sector: "Cyber"      },
  { initials: "SS", name: "Signal Systems Inc",      sector: "Defense"    },
];

const ROW_TWO = [
  { initials: "IR", name: "Iron Ridge Solutions",    sector: "DoD"        },
  { initials: "VD", name: "Volt Defense Group",      sector: "Defense"    },
  { initials: "HC", name: "HealthCore Systems",      sector: "HIPAA"      },
  { initials: "MC", name: "MedCloud Rx",             sector: "Healthcare" },
  { initials: "FT", name: "Fintech Vault",           sector: "SOC 2"      },
  { initials: "LP", name: "LexPro Group",            sector: "Legal"      },
  { initials: "QD", name: "Quantum Defense LLC",     sector: "DoD"        },
  { initials: "NB", name: "NovaBridge Gov",          sector: "Gov"        },
];

const SECTOR_COLORS: Record<string, string> = {
  "Defense":   "text-brand-400/70",
  "DoD":       "text-brand-400/70",
  "Aerospace": "text-indigo-400/70",
  "Gov":       "text-slate-500",
  "HIPAA":     "text-emerald-400/70",
  "Healthcare":"text-emerald-400/70",
  "SOC 2":     "text-indigo-400/70",
  "Legal":     "text-slate-400/70",
  "Cyber":     "text-rose-400/70",
};

const STATS = [
  { value: "23K+",   label: "threats blocked today"   },
  { value: "<10ms",  label: "detection latency"       },
  { value: "99.97%", label: "compliance uptime"       },
  { value: "3-in-1", label: "frameworks, one URL"     },
];

function MarqueeRow({
  items,
  direction = "left",
  speed = 35,
}: {
  items: typeof ROW_ONE;
  direction?: "left" | "right";
  speed?: number;
}) {
  const doubled = [...items, ...items];
  const animate = direction === "left"
    ? { x: ["0%", "-50%"] }
    : { x: ["-50%", "0%"] };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-[#07070b] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-[#07070b] to-transparent" />
      <motion.div
        className="flex w-max"
        animate={animate}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((company, i) => (
          <div key={i} className="flex items-center gap-3 px-6 flex-shrink-0 py-2">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-slate-400 tracking-tight">
                {company.initials}
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-medium text-slate-400 whitespace-nowrap">
                {company.name}
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-wider ${SECTOR_COLORS[company.sector] ?? "text-slate-600"}`}>
                {company.sector}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function TrustedMarquee() {
  return (
    <div className="py-14 border-b border-white/[0.06] bg-[#07070b] overflow-hidden">
      {/* Header */}
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-7">
        Trusted by industry leaders worldwide
      </p>

      {/* Row 1 — left-scroll */}
      <div className="mb-3">
        <MarqueeRow items={ROW_ONE} direction="left" speed={38} />
      </div>

      {/* Row 2 — right-scroll */}
      <MarqueeRow items={ROW_TWO} direction="right" speed={44} />

      {/* Stats strip */}
      <div className="mt-10 mx-auto max-w-3xl px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.05] pt-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-black font-mono text-white mb-0.5">{value}</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
