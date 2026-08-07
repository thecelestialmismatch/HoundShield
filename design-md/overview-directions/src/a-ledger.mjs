import { D, ROWS, fmt } from './data.mjs'

/**
 * DEMO A — "Audit Ledger", grounded in design-md/stripe.
 *
 * Structural idea: the protagonist is a LEDGER, not a card grid. Every
 * subsystem is one row you can scan top-to-bottom like a statement, with the
 * number in tabular figures and a drill link on every row. A C3PAO assessor
 * reads down a column; that is the interaction this design optimises for.
 *
 * Stripe rules applied verbatim: display weight 300 with negative tracking,
 * `tnum` on every numeric cell, pill buttons, 1px #e3e8ee hairlines,
 * rgba(0,55,112,.08) 0 1px 3px card lift, #533afd reserved for one filled
 * button per band.
 */

const STATE = {
  ok:   { dot: '#27a644', label: 'Nominal' },
  warn: { dot: '#9b6829', label: 'Attention' },
  act:  { dot: '#ea2261', label: 'Action needed' },
}

const spark = (vals, w = 96, h = 24, color = '#533afd') => {
  const max = Math.max(...vals), min = Math.min(...vals)
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

const bars = () => {
  const max = Math.max(...D.hourly.map(([t]) => t))
  return D.hourly.map(([t, b], i) => {
    const th = Math.round((t / max) * 100)
    // The blocked segment is a true share of THAT hour's bar. An earlier
    // version floored it at 6% of the chart, which painted a red band across
    // almost every hour and made 1 block look like 11 — a chart that overstates
    // enforcement is the same class of lie as a hardcoded metric.
    const bh = b ? Math.max(1.5, (b / t) * th) : 0
    return `<div class="bar" title="${String(i).padStart(2,'0')}:00 — ${t} prompts, ${b} blocked">
      <div class="bar-t" style="height:${th - bh}%"></div>${bh ? `<div class="bar-b" style="height:${bh}%"></div>` : ''}
    </div>`
  }).join('')
}

const groups = [...new Set(ROWS.map((r) => r.group))]

export const A = `
<style>
  .a{--ink:#0d253d;--ink2:#273951;--mut:#64748d;--canvas:#fff;--soft:#f6f9fc;--line:#e3e8ee;
     --brand:#533afd;--brand-d:#4434d4;--ruby:#ea2261;--ok:#27a644;--warn:#9b6829;
     background:var(--soft);color:var(--ink);min-height:100vh;
     font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-feature-settings:"ss01";
     -webkit-font-smoothing:antialiased}
  .a *{box-sizing:border-box}
  .a .num{font-feature-settings:"tnum";font-variant-numeric:tabular-nums}
  .a .wrap{max-width:1200px;margin:0 auto;padding:24px}

  /* Header band */
  .a .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
  .a h1{font-size:32px;font-weight:300;line-height:1.1;letter-spacing:-.64px;margin:0 0 4px}
  .a .sub{font-size:13px;color:var(--mut);letter-spacing:-.39px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .a .live{display:inline-flex;align-items:center;gap:6px;font-weight:400;color:var(--ok)}
  .a .live i{width:7px;height:7px;border-radius:99px;background:var(--ok);display:block}
  .a .cta{display:flex;gap:8px;flex-wrap:wrap}
  /* Stripe's spec says 8px 16px; that yields a 34px control, under the 44px
     touch minimum. Padding stays as specified and min-height carries the
     accessibility floor, so the brand rule and the tap target both hold. */
  .a .btn{font-size:16px;font-weight:400;line-height:1;padding:8px 16px;min-height:44px;
     border-radius:9999px;border:1px solid transparent;cursor:pointer;white-space:nowrap;
     font-family:inherit;display:inline-flex;align-items:center;justify-content:center}
  .a .btn-p{background:var(--brand);color:#fff}
  .a .btn-s{background:#fff;color:var(--brand);border-color:var(--brand)}

  /* Headline strip */
  .a .strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line);
     border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-bottom:24px}
  .a .cell{background:#fff;padding:20px}
  .a .cell .k{font-size:11px;letter-spacing:.1px;text-transform:uppercase;color:var(--mut);margin-bottom:8px}
  .a .cell .v{font-size:32px;font-weight:300;letter-spacing:-.64px;line-height:1.1}
  .a .cell .m{font-size:13px;color:var(--mut);letter-spacing:-.39px;margin-top:4px}
  .a .cell .v.bad{color:var(--ruby)}

  /* Activity band */
  .a .band{background:#fff;border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:24px;
     box-shadow:rgba(0,55,112,.08) 0 1px 3px}
  .a .band-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:16px}
  .a .band-h h2{font-size:22px;font-weight:300;letter-spacing:-.22px;margin:0}
  .a .band-h .r{font-size:13px;color:var(--mut);letter-spacing:-.39px}
  .a .chart{display:flex;align-items:flex-end;gap:3px;height:120px}
  .a .bar{flex:1;position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;min-width:0}
  .a .bar-t{background:#c7d2fe;border-radius:2px 2px 0 0}
  .a .bar-b{background:var(--ruby);border-radius:2px 2px 0 0;}
  .a .axis{display:flex;justify-content:space-between;font-size:11px;color:var(--mut);margin-top:8px}

  /* The ledger */
  .a .ledger{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;
     box-shadow:rgba(0,55,112,.08) 0 1px 3px}
  .a .lg-h{display:grid;grid-template-columns:1fr 132px 108px 96px 28px;gap:16px;padding:12px 20px;
     background:var(--soft);border-bottom:1px solid var(--line);
     font-size:11px;text-transform:uppercase;letter-spacing:.1px;color:var(--mut)}
  .a .grp{padding:14px 20px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.1px;
     color:var(--mut);background:#fff;border-bottom:1px solid var(--line)}
  .a .row{display:grid;grid-template-columns:1fr 132px 108px 96px 28px;gap:16px;align-items:center;
     padding:14px 20px;border-bottom:1px solid var(--line);text-decoration:none;color:inherit;
     transition:background .12s}
  .a .row:last-child{border-bottom:0}
  .a .row:hover{background:var(--soft)}
  .a .row .lbl{font-size:15px;font-weight:300;letter-spacing:-.1px}
  .a .row .note{font-size:13px;color:var(--mut);letter-spacing:-.39px;margin-top:2px}
  .a .row .val{font-size:22px;font-weight:300;letter-spacing:-.22px;text-align:right}
  .a .row .unit{font-size:11px;color:var(--mut);text-align:right;margin-top:2px}
  .a .st{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink2);letter-spacing:-.39px}
  .a .st i{width:7px;height:7px;border-radius:99px;flex:0 0 auto}
  .a .go{color:var(--mut);text-align:right;font-size:16px;line-height:1}
  .a .spark{width:96px;height:24px;display:block;margin-left:auto}

  /* Detections + families */
  .a .two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:24px}
  .a .kv{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
  .a .kv:last-child{border-bottom:0}
  .a .kv .n{flex:1;font-size:15px;font-weight:300;min-width:0}
  .a .kv .c{font-size:11px;color:var(--mut);font-feature-settings:"tnum"}
  .a .kv .q{font-size:18px;font-weight:300;font-feature-settings:"tnum"}
  .a .trend{font-size:11px;font-feature-settings:"tnum";width:34px;text-align:right}
  .a .up{color:var(--ruby)} .a .dn{color:var(--ok)} .a .fl{color:var(--mut)}
  .a .meter{height:6px;border-radius:99px;background:#eef2f7;overflow:hidden;margin-top:6px}
  .a .meter i{display:block;height:100%;background:var(--brand);border-radius:99px}

  /* ── Mobile: the ledger becomes stacked records, never a squeezed table ── */
  @media(max-width:900px){ .a .two{grid-template-columns:minmax(0,1fr)} }
  @media(max-width:760px){
    .a .wrap{padding:16px}
    .a h1{font-size:26px;letter-spacing:-.26px}
    .a .strip{grid-template-columns:repeat(2,minmax(0,1fr))}
    .a .cell{padding:16px}
    .a .cell .v{font-size:26px}
    .a .lg-h{display:none}
    .a .row{grid-template-columns:1fr auto;gap:4px 12px;padding:14px 16px;
       grid-template-areas:"lbl val" "note unit" "st go"}
    .a .row .lbl{grid-area:lbl} .a .row .note{grid-area:note}
    .a .row .val{grid-area:val;font-size:20px} .a .row .unit{grid-area:unit}
    .a .row .stw{grid-area:st;margin-top:8px} .a .row .go{grid-area:go;margin-top:8px}
    .a .spark{display:none}
    .a .grp{padding:12px 16px 6px}
    .a .band{padding:16px}
    .a .chart{height:88px}
    .a .cta{width:100%} .a .btn{flex:1;text-align:center}
  }
  @media(max-width:380px){ .a .strip{grid-template-columns:minmax(0,1fr)} }
</style>

<div class="a"><div class="wrap">
  <div class="hd">
    <div>
      <h1>Compliance posture</h1>
      <div class="sub">
        <span class="live"><i></i>Gateway live</span><span>·</span>
        <span>${D.company}</span><span>·</span>
        <span class="num">last ${D.windowDays} days, updated ${D.lastUpdate}</span>
      </div>
    </div>
    <div class="cta">
      <button class="btn btn-s">Export audit log</button>
      <button class="btn btn-p">Generate C3PAO report</button>
    </div>
  </div>

  <div class="strip">
    <div class="cell"><div class="k">Prompts inspected</div><div class="v num">${fmt(D.events)}</div><div class="m">on your own hardware</div></div>
    <div class="cell"><div class="k">Blocked before egress</div><div class="v num bad">${D.blocked}</div><div class="m num">${D.blockRatePct}% of traffic</div></div>
    <div class="cell"><div class="k">SPRS score</div><div class="v num">${D.sprs}</div><div class="m num">target ${D.sprsTarget} · was ${D.sprsPrev}</div></div>
    <div class="cell"><div class="k">Held for review</div><div class="v num">${D.quarantine}</div><div class="m">oldest 3 days ago</div></div>
  </div>

  <div class="band">
    <div class="band-h"><h2>24-hour activity</h2><div class="r num">${fmt(D.events)} prompts · ${D.blocked} stopped · p50 ${D.scanP50Ms}ms</div></div>
    <div class="chart">${bars()}</div>
    <div class="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span></div>
  </div>

  <div class="ledger">
    <div class="lg-h"><div>Subsystem</div><div style="text-align:right">Reading</div><div>Status</div><div style="text-align:right">Trend</div><div></div></div>
    ${groups.map((g) => `
      <div class="grp">${g}</div>
      ${ROWS.filter((r) => r.group === g).map((r) => `
        <a class="row" href="${r.href}">
          <div><div class="lbl">${r.label}</div><div class="note">${r.note}</div></div>
          <div><div class="val num">${r.value}</div><div class="unit">${r.unit}</div></div>
          <div class="stw"><span class="st"><i style="background:${STATE[r.state].dot}"></i>${STATE[r.state].label}</span></div>
          <div>${spark(D.sprsHistory.map((v, i) => v + ((r.id.charCodeAt(0) + i * 7) % 9)))}</div>
          <div class="go">›</div>
        </a>`).join('')}
    `).join('')}
  </div>

  <div class="two">
    <div class="band" style="margin:0">
      <div class="band-h"><h2>What was detected</h2><div class="r">mapped to NIST 800-171</div></div>
      ${D.detections.map((d) => `
        <div class="kv">
          <div class="n">${d.name}<div class="c">${d.control}</div></div>
          <div class="q num">${d.count}</div>
          <div class="trend ${d.trend > 0 ? 'up' : d.trend < 0 ? 'dn' : 'fl'}">${d.trend > 0 ? '+' : ''}${d.trend || '—'}</div>
        </div>`).join('')}
    </div>
    <div class="band" style="margin:0">
      <div class="band-h"><h2>Control families</h2><div class="r num">${D.controlsMet}/${D.controlsTotal} met</div></div>
      ${D.families.map((f) => `
        <div class="kv" style="display:block">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <div class="n">${f.code} · ${f.name}</div>
            <div class="c num">${f.met}/${f.total}</div>
          </div>
          <div class="meter"><i style="width:${(f.met / f.total) * 100}%"></i></div>
        </div>`).join('')}
    </div>
  </div>
</div></div>
`
