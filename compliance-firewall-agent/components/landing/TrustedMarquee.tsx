"use client";

const TRUSTED_COMPANIES = [
  { icon: "🛡️", name: "DefenseTech Systems" },
  { icon: "✈️", name: "AeroShield Corp" },
  { icon: "⚙️", name: "Federal Dynamics" },
  { icon: "🔬", name: "Precision Systems" },
  { icon: "🚀", name: "Orbital Defense" },
  { icon: "🔒", name: "SecureNet Gov" },
  { icon: "🌐", name: "CyberGuard Federal" },
  { icon: "📡", name: "Signal Systems Inc" },
  { icon: "🏗️", name: "Iron Ridge Solutions" },
  { icon: "⚡", name: "Volt Defense Group" },
];

export function TrustedMarquee() {
  const doubled = [...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES];

  return (
    <div className="py-16 border-b border-gray-200 bg-[#F7F5F0] overflow-hidden">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-8">
        Trusted by industry leaders worldwide
      </p>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #F7F5F0 0%, transparent 100%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #F7F5F0 0%, transparent 100%)" }} />
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {doubled.map((company, i) => (
            <div key={i} className="flex items-center gap-3 px-8 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                {company.icon}
              </div>
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
