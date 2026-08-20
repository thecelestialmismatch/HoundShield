import type { Metadata } from 'next'
import { FooterV3 } from '@/components/layout/FooterV3'
import { NavV3 } from '@/components/layout/NavV3'
import { EvidenceIntakePublic } from '@/components/landing/EvidenceIntakePublic'

export const metadata: Metadata = {
  title: 'Browser-Local Evidence Intake',
  description: 'Review selected text-based PDFs in your browser with page references, human approval, and a local provenance manifest. Document data is not uploaded by this page.',
  alternates: { canonical: '/evidence-intake' },
  openGraph: {
    title: 'Browser-Local Evidence Intake',
    description: 'Human-reviewed, browser-local PDF evidence intake. Selected document data is not uploaded by this page.',
  },
}

export default function EvidenceIntakePage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />
      <main className="page">
        <EvidenceIntakePublic />
      </main>
      <FooterV3 />
    </div>
  )
}
