"use client";

const TRUSTED_COMPANIES = [
  { initials: "DT", name: "DefenseTech Systems" },
  { initials: "AS", name: "AeroShield Corp" },
  { initials: "FD", name: "Federal Dynamics" },
  { initials: "PS", name: "Precision Systems" },
  { initials: "OD", name: "Orbital Defense" },
  { initials: "SN", name: "SecureNet Gov" },
  { initials: "CG", name: "CyberGuard Federal" },
  { initials: "SS", name: "Signal Systems Inc" },
  { initials: "IR", name: "Iron Ridge Solutions" },
  { initials: "VD", name: "Volt Defense Group" },
];

export function TrustedMarquee() {
  const doubled = [...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES];

  return (
    <div className="py-16 border-b border-white/[0.06] bg-[#07070b] overflow-hidden">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-8">
        Trusted by industry leaders worldwide
      </p>
      <div className="relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #07070b 0%, transparent 100%)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #07070b 0%, transparent 100%)" }}
        />
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {doubled.map((company, i) => (
            <div key={i} className="flex items-center gap-3 px-8 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400 tracking-tight">
                  {company.initials}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
