"use client";

const TICKER_ITEMS = [
  { color: "bg-emerald-400", text: "ALLOWED · user prompt scanned · 0 threats detected · 12ms" },
  { color: "bg-red-400", text: "BLOCKED · API key detected in prompt · sk-proj-*** · 8ms" },
  { color: "bg-amber-400", text: "FLAGGED · SSN pattern detected · 123-**-**** · 14ms" },
  { color: "bg-emerald-400", text: "ALLOWED · code review prompt · clean · 9ms" },
  { color: "bg-red-400", text: "BLOCKED · Credit card PAN detected · 4111-****-****-1111 · 11ms" },
  { color: "bg-emerald-400", text: "ALLOWED · summarize document · no CUI · 7ms" },
  { color: "bg-amber-400", text: "FLAGGED · internal IP address detected · 192.168.1.* · 13ms" },
  { color: "bg-red-400", text: "BLOCKED · password string detected in prompt · 16ms" },
  { color: "bg-emerald-400", text: "ALLOWED · GPT request forwarded · clean · 6ms" },
  { color: "bg-red-400", text: "BLOCKED · medical record keywords · HIPAA · 18ms" },
  { color: "bg-amber-400", text: "FLAGGED · financial data pattern · Q4 revenue figures · 10ms" },
  { color: "bg-emerald-400", text: "ALLOWED · technical documentation query · 0 threats · 8ms" },
];

export function TickerSection() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="relative bg-white border-t border-b border-gray-200 py-3 overflow-hidden">
      <div className="flex gap-12 animate-marquee whitespace-nowrap" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0 text-gray-500 text-[13px]">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.color}`} />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
