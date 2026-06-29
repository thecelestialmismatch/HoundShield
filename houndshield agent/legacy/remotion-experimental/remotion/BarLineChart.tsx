"use client";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from "remotion";

const DATA = [
  { month: "Jan", revenue: 8000,  conversion: 2.1 },
  { month: "Feb", revenue: 12000, conversion: 2.8 },
  { month: "Mar", revenue: 15000, conversion: 3.2 },
  { month: "Apr", revenue: 11000, conversion: 2.9 },
  { month: "May", revenue: 18000, conversion: 3.8 },
  { month: "Jun", revenue: 22000, conversion: 4.2 },
];

const MAX_REVENUE   = 22000;
const MAX_CONV      = 5.0;
const BG            = "#1A1A2E";
const LINE_COLOR    = "#0B84F3";
const STAGGER       = 10;
const BAR_START     = 5;

export const BarLineChart = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ── Layout ─────────────────────────────────────────────────────
  const PL = 130, PR = 110, PT = 140, PB = 100;
  const chartW = width  - PL - PR;
  const chartH = height - PT - PB;
  const colW   = chartW / DATA.length;
  const barW   = Math.round(colW * 0.46);

  // ── Bar spring progress (staggered) ────────────────────────────
  const barProg = DATA.map((_, i) =>
    spring({ frame: frame - (BAR_START + i * STAGGER), fps, config: { damping: 200 }, durationInFrames: 30 })
  );

  // ── Positions ──────────────────────────────────────────────────
  const xPos = DATA.map((_, i) => PL + colW * i + colW / 2);
  const lineY = DATA.map(d => PT + chartH - (d.conversion / MAX_CONV) * chartH);

  // ── Progressive line path ───────────────────────────────────────
  const lineProgress = interpolate(frame, [BAR_START + STAGGER, 108], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let linePath = "";
  const totalSeg = DATA.length - 1;
  for (let i = 0; i < DATA.length; i++) {
    if (i === 0) {
      linePath += `M ${xPos[0]} ${lineY[0]}`;
    } else {
      const seg = Math.min(1, Math.max(0, lineProgress * totalSeg - (i - 1)));
      if (seg > 0) {
        const x = xPos[i - 1] + (xPos[i] - xPos[i - 1]) * seg;
        const y = lineY[i - 1] + (lineY[i] - lineY[i - 1]) * seg;
        linePath += ` L ${x} ${y}`;
      }
    }
  }

  // ── Pulsing dot position ────────────────────────────────────────
  const tipSeg  = Math.min(totalSeg - 0.001, lineProgress * totalSeg);
  const tipIdx  = Math.floor(tipSeg);
  const tipFrac = tipSeg - tipIdx;
  const tipX    = tipIdx < totalSeg ? xPos[tipIdx] + (xPos[tipIdx + 1] - xPos[tipIdx]) * tipFrac : xPos[totalSeg];
  const tipY    = tipIdx < totalSeg ? lineY[tipIdx] + (lineY[tipIdx + 1] - lineY[tipIdx]) * tipFrac : lineY[totalSeg];
  const dotPulse   = Math.sin(frame * 0.22) * 0.45 + 1.0;
  const dotOpacity = interpolate(lineProgress, [0.05, 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── Fade-ins ────────────────────────────────────────────────────
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const axisOpacity  = interpolate(frame, [3, 20], [0, 1], { extrapolateRight: "clamp" });

  const yRevTicks  = [0, 5000, 10000, 15000, 20000];
  const yConvTicks = [0, 1, 2, 3, 4, 5];

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="dotGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#818CF8" stopOpacity="1" />
            <stop offset="100%" stopColor="#3730A3" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="barHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#A5B4FC" stopOpacity="1" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* ── Title ── */}
        <text x={width / 2} y={58} textAnchor="middle" fill="white"
          fontSize={38} fontWeight="700" fontFamily="system-ui, sans-serif"
          opacity={titleOpacity} letterSpacing={0.5}>
          Monthly Revenue &amp; Conversion Rate
        </text>
        <text x={width / 2} y={98} textAnchor="middle" fill="#64748B"
          fontSize={22} fontFamily="system-ui, sans-serif" opacity={titleOpacity}>
          Jan – Jun 2025
        </text>

        {/* ── Grid lines + left Y axis (revenue) ── */}
        {yRevTicks.map(tick => {
          const y = PT + chartH - (tick / MAX_REVENUE) * chartH;
          return (
            <g key={`rev-${tick}`} opacity={axisOpacity}>
              <line x1={PL} y1={y} x2={PL + chartW} y2={y}
                stroke="#1E2A4A" strokeWidth={1} strokeDasharray="6,6" />
              <text x={PL - 14} y={y + 6} textAnchor="end"
                fill="#475569" fontSize={18} fontFamily="monospace">
                ${(tick / 1000).toFixed(0)}K
              </text>
            </g>
          );
        })}

        {/* ── Right Y axis (conversion %) ── */}
        {yConvTicks.map(tick => {
          const y = PT + chartH - (tick / MAX_CONV) * chartH;
          return (
            <text key={`conv-${tick}`} x={PL + chartW + 14} y={y + 6}
              fill="#0B84F3" fontSize={18} fontFamily="monospace" opacity={axisOpacity}>
              {tick}%
            </text>
          );
        })}

        {/* ── Axis lines ── */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + chartH} stroke="#334155" strokeWidth={2} opacity={axisOpacity} />
        <line x1={PL} y1={PT + chartH} x2={PL + chartW} y2={PT + chartH} stroke="#334155" strokeWidth={2} opacity={axisOpacity} />
        <line x1={PL + chartW} y1={PT} x2={PL + chartW} y2={PT + chartH} stroke="#1E3A5F" strokeWidth={2} opacity={axisOpacity} strokeDasharray="4,4" />

        {/* ── Bars ── */}
        {DATA.map((d, i) => {
          const x       = xPos[i] - barW / 2;
          const fullH   = (d.revenue / MAX_REVENUE) * chartH;
          const currH   = fullH * barProg[i];
          const y       = PT + chartH - currH;
          const capH    = Math.min(currH, 8);

          return (
            <g key={d.month}>
              <rect x={x} y={y} width={barW} height={currH}
                fill="url(#barGrad)" rx={7} />
              {/* glowing top cap */}
              <rect x={x + 2} y={y} width={barW - 4} height={capH}
                fill="#A5B4FC" rx={4} opacity={barProg[i] * 0.7} />
              {/* value label */}
              <text x={xPos[i]} y={y - 14} textAnchor="middle"
                fill="white" fontSize={22} fontWeight="700" fontFamily="monospace"
                opacity={barProg[i]}>
                ${(d.revenue / 1000).toFixed(0)}K
              </text>
              {/* month label */}
              <text x={xPos[i]} y={PT + chartH + 46} textAnchor="middle"
                fill="#94A3B8" fontSize={24} fontFamily="system-ui, sans-serif"
                opacity={axisOpacity}>
                {d.month}
              </text>
            </g>
          );
        })}

        {/* ── Conversion line (glowing blue) ── */}
        {linePath && (
          <path d={linePath} stroke={LINE_COLOR} strokeWidth={4.5} fill="none"
            filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* ── Data point dots on line ── */}
        {DATA.map((_, i) => {
          const dotVisible = lineProgress * totalSeg >= i - 0.1;
          if (!dotVisible) return null;
          return (
            <circle key={`dot-${i}`} cx={xPos[i]} cy={lineY[i]}
              r={5} fill={LINE_COLOR} opacity={0.9} />
          );
        })}

        {/* ── Pulsing tip dot ── */}
        {lineProgress > 0.04 && (
          <g opacity={dotOpacity} filter="url(#dotGlow)">
            <circle cx={tipX} cy={tipY} r={14 * dotPulse}
              fill="none" stroke={LINE_COLOR} strokeWidth={2} opacity={0.35} />
            <circle cx={tipX} cy={tipY} r={8} fill={LINE_COLOR} />
            <circle cx={tipX} cy={tipY} r={3.5} fill="white" />
          </g>
        )}

        {/* ── Legend ── */}
        <g opacity={axisOpacity}>
          <rect x={PL} y={PT + chartH + 68} width={22} height={22} fill="url(#barGrad)" rx={4} />
          <text x={PL + 30} y={PT + chartH + 85} fill="#94A3B8" fontSize={20} fontFamily="system-ui">
            Monthly Revenue
          </text>
          <line x1={PL + 218} y1={PT + chartH + 79} x2={PL + 248} y2={PT + chartH + 79}
            stroke={LINE_COLOR} strokeWidth={3.5} filter="url(#glow)" />
          <circle cx={PL + 233} cy={PT + chartH + 79} r={5} fill={LINE_COLOR} />
          <text x={PL + 258} y={PT + chartH + 85} fill="#94A3B8" fontSize={20} fontFamily="system-ui">
            Conversion Rate
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
