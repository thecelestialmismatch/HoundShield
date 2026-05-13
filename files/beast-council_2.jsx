import { useState } from "react";

const FRAMED_QUESTION = `A solo founder called The Celestial has built "THE BEAST" — an 800+ line master AI operating prompt synthesizing three standards:

THE GARRY STANDARD: The marginal cost of completeness is near zero with AI. Never defer. Never offer a workaround when the real fix exists. The standard is "holy shit, that's done." Boil the ocean.

THE WEALTH STANDARD: Every output connects to revenue this week, this month. Fast revenue beats theoretically elegant revenue.

THE LLM COUNCIL: Every critical decision runs through 5 advisors, anonymized peer review, then a Chairman who makes the call. No committee. One decision.

THE BEAST STRUCTURE:
• Phase -1: Six kill filters (Why Now, 10x Test, Thiel Secret, Painkiller Filter, 14-Day MVP Constraint, Founder-Problem Fit) — every idea clears all six or dies
• Phase 0: Adversarial problem archaeology — 10 raw pain signals from Reddit/HN/G2/ProductHunt, secondary graveyard research, tertiary money flows
• Phase 0.5: Council checkpoint #1 — problem selection gate (5 advisors + peer review + Chairman)
• Phase 1: Select exactly 3 winning ideas
• Sections A through O (15 deep analysis sections PER idea): Problem Brief, Product Definition, Pressure Test, Per-Idea Council gate #2, Competitive Intelligence, GTM, Pricing Architecture, Financial Model, Growth Engine, Unit Economics, 90-Day Roadmap, Genius Insights, Moat Architecture, Adversarial Stress Test, Exit Landscape
• Phase 2: Final Council gate #3 — scoring matrix + 5 advisors + peer review + Chairman picks ONE WINNER
• Phase 3: 8 ship-ready execution assets (cold DM, landing page, discovery call, Week 1 DoD, Day 30 metric, investor narrative, first hire profile, 90-day kill protocol)
ESTIMATED SCOPE: Multiple weeks of AI sessions before writing one line of product code.

THE CELESTIAL'S CURRENT REALITY:
• Mid-game on Kaelus.ai — live codebase, CMMC Level 2 AI compliance firewall/security gateway for US defense contractors
• Stack: Next.js 15, React 19, TypeScript, Supabase, Stripe, PostHog. Sub-10ms ML scanning latency requirement.
• 80+ research links audited April 2026. Full execution package: sprint plans, session templates, roadmaps, persistent state files.
• Parallel concepts in orbit: LeakWall (broader AI data leakage prevention), several product pivots from March 2026
• Context: solo founder, zero budget, maximum velocity, treats Claude as co-founder

THE QUESTION: Should The Celestial deploy THE BEAST as their primary operating framework right now — as-is, surgically (3-4 targeted sections only), or set aside entirely? What are the structural fatal flaws in the framework as built? What would make it actively dangerous to use at this stage?

STAKES: This framework governs how a solo founder with finite cognitive bandwidth allocates focused execution time. Wrong answer = months lost to structured drift. Right answer = defensible conviction on whether to keep building Kaelus, pivot to LeakWall, or restart from Phase -1.`;

const ADVISORS = [
  {
    id: "contrarian",
    name: "The Contrarian",
    style: "Actively looks for what's wrong, what's missing, what will fail. Assumes the framework has a fatal flaw and hunts for it. Not a pessimist — the friend who saves you from a bad decision by asking the questions you're avoiding. If everything looks solid, dig deeper.",
    color: "#E24B4A"
  },
  {
    id: "firstprinciples",
    name: "The First Principles Thinker",
    style: "Ignores the surface-level question and asks: what are we actually trying to solve here? Strips every assumption. Rebuilds from the ground up. Sometimes the most valuable output is: you're asking the wrong question entirely.",
    color: "#7F77DD"
  },
  {
    id: "expansionist",
    name: "The Expansionist",
    style: "Looks for upside everyone else is missing. What could be bigger? What adjacent opportunity is hiding? What's being undervalued? Doesn't care about risk — that's the Contrarian's job. Only cares about what happens if this works even better than expected.",
    color: "#1D9E75"
  },
  {
    id: "outsider",
    name: "The Outsider",
    style: "Has zero context about this field, this founder, or this project history. Responds purely to what's in front of them. Catches the curse of knowledge: things that are obvious to insiders but confusing to everyone else. The most underrated advisor on any council.",
    color: "#BA7517"
  },
  {
    id: "executor",
    name: "The Executor",
    style: "Only cares about one thing: can this be done, and what's the fastest path? Ignores theory, strategy, and big-picture thinking. Every idea through the lens of: what do you do Monday morning? If it sounds brilliant but has no clear first step, says so bluntly.",
    color: "#185FA5"
  }
];

async function callAPI(system, userMsg) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMsg }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

function ScanBar({ color, active }) {
  return (
    <div style={{ height: "2px", background: "var(--color-border-tertiary)", borderRadius: "1px", overflow: "hidden", marginTop: "10px" }}>
      {active && (
        <div style={{
          height: "100%", width: "35%", background: color, borderRadius: "1px",
          animation: "scan 1.6s ease-in-out infinite"
        }} />
      )}
    </div>
  );
}

function renderMd(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: "0.4rem" }} />;
    if (line.startsWith('## ')) {
      return <h3 key={i} style={{ fontSize: "14px", fontWeight: 500, margin: "1.25rem 0 0.4rem", color: "var(--color-text-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: "4px" }}>{line.slice(3)}</h3>;
    }
    if (line.startsWith('### ')) {
      return <h4 key={i} style={{ fontSize: "13.5px", fontWeight: 500, margin: "0.875rem 0 0.25rem", color: "var(--color-text-primary)" }}>{line.slice(4)}</h4>;
    }
    if ((line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* '))) {
      const content = line.slice(2);
      const parts = content.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ display: "flex", gap: "8px", margin: "0.15rem 0", paddingLeft: "2px" }}>
          <span style={{ color: "var(--color-text-tertiary)", fontSize: "13px", lineHeight: 1.75, flexShrink: 0 }}>—</span>
          <span style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.75 }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ fontWeight: 500 }}>{p}</strong> : p)}
          </span>
        </div>
      );
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ fontSize: "13.5px", color: "var(--color-text-primary)", lineHeight: 1.75, margin: "0.15rem 0" }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ fontWeight: 500 }}>{p}</strong> : p)}
      </p>
    );
  });
}

export default function BeastCouncil() {
  const [phase, setPhase] = useState("idle");
  const [advisorData, setAdvisorData] = useState({});
  const [advisorLoading, setAdvisorLoading] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [verdict, setVerdict] = useState("");
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [error, setError] = useState("");

  async function runCouncil() {
    setPhase("advisors");
    setAdvisorData({});
    setAdvisorLoading(Object.fromEntries(ADVISORS.map(a => [a.id, true])));
    setReviews([]);
    setVerdict("");
    setError("");

    try {
      const advisorPromises = ADVISORS.map(async (adv) => {
        const system = `You are ${adv.name} on an LLM Council. Your thinking style: ${adv.style}

Respond from your angle ONLY. Do not hedge or try to be balanced. Lean fully into your assigned perspective — the other advisors cover the angles you're not covering. Be direct, specific, and blunt. 150-300 words. No preamble. Start your analysis immediately.`;
        const text = await callAPI(system, `Council question:\n\n${FRAMED_QUESTION}`);
        setAdvisorData(prev => ({ ...prev, [adv.id]: text }));
        setAdvisorLoading(prev => ({ ...prev, [adv.id]: false }));
        return { id: adv.id, text };
      });

      const advisorResults = await Promise.all(advisorPromises);
      const rmap = Object.fromEntries(advisorResults.map(r => [r.id, r.text]));

      const shuffled = [...ADVISORS].sort(() => Math.random() - 0.5);
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const anon = shuffled.map((a, i) => ({ letter: letters[i], text: rmap[a.id] }));
      const anonText = anon.map(a => `Response ${a.letter}:\n${a.text}`).join('\n\n---\n\n');

      setPhase("reviews");
      setReviewsLoading(true);

      const reviewPromises = Array.from({ length: 5 }, async (_, idx) => {
        const system = `You are conducting a peer review of an LLM Council session. Evaluate the advisor outputs critically. Be specific. Reference responses by letter. Under 200 words.`;
        const msg = `Council question summary: Solo founder mid-game on a live product (Kaelus.ai) is asking whether their 800-line master operating framework (THE BEAST) should be deployed as-is, surgically, or set aside. Stakes: months of founder time.\n\nAnonymized advisor responses:\n\n${anonText}\n\nAnswer:\n1. Which response is strongest and why? (cite letter)\n2. Which response has the biggest blind spot and what is it? (cite letter)\n3. What did ALL five responses miss?`;
        return callAPI(system, msg);
      });

      const reviewResults = await Promise.all(reviewPromises);
      setReviews(reviewResults);
      setReviewsLoading(false);

      setPhase("chairman");
      setVerdictLoading(true);

      const chairSystem = `You are the Chairman of an LLM Council. Synthesize 5 advisor responses and 5 peer reviews into a final verdict. Be direct. Don't hedge. Give clarity no single perspective could provide. Use exactly this structure with ## headers: "Where the Council Agrees" / "Where the Council Clashes" / "Blind Spots the Council Caught" / "The Recommendation" / "The One Thing to Do First"`;
      const chairMsg = `Council question:\n${FRAMED_QUESTION}\n\nADVISOR RESPONSES:\n\n${ADVISORS.map(a => `${a.name}:\n${rmap[a.id]}`).join('\n\n')}\n\nPEER REVIEWS:\n\n${reviewResults.map((r, i) => `Review ${i + 1}:\n${r}`).join('\n\n')}\n\nProduce the council verdict.`;

      const verdictText = await callAPI(chairSystem, chairMsg);
      setVerdict(verdictText);
      setVerdictLoading(false);
      setPhase("done");

    } catch (e) {
      setError(e.message || "Council failed");
      setPhase("error");
    }
  }

  const phaseMeta = {
    idle: { label: null, color: null },
    advisors: { label: "stage 1 of 3 — advisors deliberating", color: "var(--color-text-tertiary)" },
    reviews: { label: "stage 2 of 3 — peer review", color: "var(--color-text-tertiary)" },
    chairman: { label: "stage 3 of 3 — chairman synthesizing", color: "var(--color-text-tertiary)" },
    done: { label: "council complete", color: "var(--color-text-success)" },
    error: { label: "council error", color: "var(--color-text-danger)" }
  };

  const meta = phaseMeta[phase] || phaseMeta.idle;

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "0.75rem 0 1.5rem" }}>
      <style>{`
        @keyframes scan { 0% { transform: translateX(-250%); } 100% { transform: translateX(400%); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>THE BEAST — Council Session</h2>
          {meta.label && (
            <span style={{ fontSize: "11px", color: meta.color, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
              {meta.label}
            </span>
          )}
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Five adversarial minds · anonymous peer review · one chairman verdict · live API calls
        </p>
      </div>

      {phase === "idle" && (
        <button onClick={runCouncil} style={{ fontSize: "14px", padding: "10px 22px", cursor: "pointer", fontWeight: 500, borderRadius: "var(--border-radius-md)" }}>
          Convene the Council ↗
        </button>
      )}

      {phase !== "idle" && (
        <div style={{ marginBottom: "2rem", animation: "fadeSlide 0.35s ease" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: "0 0 0.75rem", fontFamily: "var(--font-mono)" }}>
            Stage 1 — Five Advisors
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            {ADVISORS.map(adv => (
              <div key={adv.id} style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderLeft: `3px solid ${adv.color}`,
                borderRadius: "var(--border-radius-lg)",
                padding: "1rem 1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: advisorData[adv.id] ? "8px" : 0 }}>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: adv.color, letterSpacing: "0.02em" }}>{adv.name}</span>
                  {advisorLoading[adv.id] && (
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>deliberating...</span>
                  )}
                </div>
                {advisorLoading[adv.id] && <ScanBar color={adv.color} active={true} />}
                {advisorData[adv.id] && (
                  <p style={{ fontSize: "13.5px", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap", animation: "fadeSlide 0.3s ease" }}>
                    {advisorData[adv.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === "reviews" || phase === "chairman" || phase === "done") && (
        <div style={{ marginBottom: "2rem", animation: "fadeSlide 0.35s ease" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: "0 0 0.75rem", fontFamily: "var(--font-mono)" }}>
            Stage 2 — Peer Review (responses anonymized A–E)
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {reviewsLoading
              ? Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem", border: "0.5px solid var(--color-border-tertiary)" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>reviewer {i + 1} / 5</span>
                  <ScanBar color="var(--color-text-tertiary)" active={true} />
                </div>
              ))
              : reviews.map((r, i) => (
                <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem", border: "0.5px solid var(--color-border-tertiary)", animation: "fadeSlide 0.3s ease" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", margin: "0 0 6px", fontFamily: "var(--font-mono)" }}>reviewer {i + 1}</p>
                  <p style={{ fontSize: "13px", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{r}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {(phase === "chairman" || phase === "done") && (
        <div style={{ animation: "fadeSlide 0.35s ease" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: "0 0 0.75rem", fontFamily: "var(--font-mono)" }}>
            Stage 3 — Chairman's Verdict
          </p>
          {verdictLoading ? (
            <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem", border: "0.5px solid var(--color-border-tertiary)" }}>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
                Chairman reading all advisor outputs and peer reviews...
              </p>
              <ScanBar color="var(--color-text-secondary)" active={true} />
            </div>
          ) : verdict ? (
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-primary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem 1.75rem", animation: "fadeSlide 0.4s ease" }}>
              {renderMd(verdict)}
            </div>
          ) : null}
        </div>
      )}

      {phase === "error" && (
        <div style={{ background: "var(--color-background-danger)", border: "0.5px solid var(--color-border-danger)", borderRadius: "var(--border-radius-md)", padding: "1rem", color: "var(--color-text-danger)", fontSize: "13px", marginTop: "1rem" }}>
          <strong>Council error:</strong> {error}
          <div style={{ marginTop: "10px" }}>
            <button onClick={runCouncil} style={{ fontSize: "13px", cursor: "pointer" }}>Retry ↗</button>
          </div>
        </div>
      )}
    </div>
  );
}
