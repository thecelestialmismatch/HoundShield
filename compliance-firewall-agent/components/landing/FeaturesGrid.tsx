'use client'

import { useState } from 'react'
import { ShieldCheck, FileText, Zap, Brain, Grid2x2, Activity } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  body: string
  control: string
}

const FEATURES: Feature[] = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Local Scanning',
    body: 'Every prompt is classified on your hardware before it leaves. No cloud hop. No third-party eyes on your data.',
    control: 'SC.3.177',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'C3PAO-Ready PDF',
    body: 'One-click audit export your assessor can accept the day of the visit. Evidence-ready, formatted for DIBCAC review.',
    control: 'CA.3.162',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Zero-Friction Deploy',
    body: 'One proxy URL change. Works with ChatGPT, Copilot, Claude, and every OpenAI-compatible client. Live in minutes.',
    control: 'CM.2.061',
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'OODA Engine',
    body: 'Real-time Observe–Orient–Decide–Act loop surfaces violations as they happen and logs every decision for your audit trail.',
    control: 'AU.2.041',
  },
  {
    icon: <Grid2x2 className="w-5 h-5" />,
    title: '16 CUI Patterns',
    body: 'Covering ITAR, EAR, PHI, PII, and classified markings. Regex + semantic dual-layer detection under 10ms.',
    control: 'MP.2.120',
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'Brain AI',
    body: 'On-device knowledge graph answers "what controls do I still need?" without sending your gap analysis to any cloud.',
    control: 'AT.2.056',
  },
]

export function FeaturesGrid() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section
      id="features"
      className="py-24 bg-[var(--hs-surface-1)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-3 font-[var(--font-body)]">
            WHAT&apos;S INSIDE
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] tracking-tight mb-4 font-[var(--font-display)]">
            Built for the audit. Not for the demo.
          </h2>
          <p className="text-base text-[var(--hs-ink-secondary)] max-w-xl mx-auto font-[var(--font-body)]">
            Every feature maps to a NIST SP 800-171 Rev 2 control.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, idx) => (
            <div
              key={feature.control}
              className="feature-card"
              data-hovered={hoveredIdx === idx ? 'true' : 'false'}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              data-testid={`feature-card-${idx}`}
            >
              {/* Always-visible: icon + title */}
              <div className="flex items-center gap-3 mb-0">
                <div className="flex-shrink-0 w-9 h-9 rounded-[var(--radius-md)] bg-[var(--hs-mist)] flex items-center justify-center text-[var(--hs-steel-dark)]">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[var(--hs-ink)] text-sm font-[var(--font-body)]">
                  {feature.title}
                </h3>
              </div>

              {/* Hover-expand: body + control tag */}
              <div className="feature-expand-wrap">
                <div className="feature-expand-inner">
                  <p className="feature-body mt-3 text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">
                    {feature.body}
                  </p>
                  <span className="feature-control-tag inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider font-[var(--font-mono)] text-[var(--hs-steel-dark)] bg-[var(--hs-mist)] border border-[var(--hs-border)]">
                    {feature.control}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
