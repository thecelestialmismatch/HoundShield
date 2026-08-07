import { D, ROWS, fmt } from './data.mjs'

/**
 * DEMO B — "Operator Console", grounded in design-md/linear.app.
 *
 * Structural idea: a tool you live in, not a report you read. Left column is a
 * LIVE STREAM that never stops moving; right column is a stack of compact
 * subsystem cards with counts. Rows are 28–32px, not 64px cards — density is
 * the point. Every destination carries a keyboard hint.
 *
 * Linear rules applied verbatim: four-step surface ladder (#010102 → #0f1011 →
 * #141516 → #18191a), 1px hairlines (#23252a / #34343a), NO drop shadows at
 * all, lavender #5e6ad2 reserved for focus/brand/one CTA, 8px button radius,
 * never pure black.
 */

const OUT = {
  blocked: { fg: '#ff6b6b', bg: 'rgba(255,107,107,.12)', label: 'Blocked' },
  held:    { fg: '#e0b341', bg: 'rgba(224,179,65,.12)',  label: 'Held' },
  passed:  { fg: '#27a644', bg: 'rgba(39,166,68,.12)',   label: 'Passed' },
}
const STATE = { ok: '#27a644', warn: '#e0b341', act: '#ff6b6b' }

const groups = [...new Set(ROWS.map((r) => r.group))]
const maxH = Math.max(...D.hourly.map(([t]) => t))

export const B = `
<style>
  .b{--canvas:#010102;--s1:#0f1011;--s2:#141516;--s3:#18191a;
     --line:#23252a;--line2:#34343a;
     --ink:#f7f8f8;--ink2:#d0d6e0;--mut:#8a8f98;--mut2:#62666d;
     --brand:#5e6ad2;--brand-h:#828fff;
     background:var(--canvas);color:var(--ink);min-height:100vh;
     font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .b *{box-sizing:border-box}
  .b .num{font-variant-numeric:tabular-nums}
  .b .wrap{max-width:1280px;margin:0 auto;padding:20px 24px 40px}

  /* Top bar */
  .b .top{height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px;
     border-bottom:1px solid var(--line);margin-bottom:20px}
  .b .top .l{display:flex;align-items:center;gap:12px;min-width:0}
  .b .title{font-size:20px;font-weight:500;letter-spacing:-.4px;white-space:nowrap}
  .b .chip{display:inline-flex;align-items:center;gap:6px;background:var(--s2);color:var(--ink2);
     border-radius:9999px;padding:2px 8px;font-size:12px;white-space:nowrap}
  .b .chip i{width:6px;height:6px;border-radius:99px;background:#27a644;display:block}
  .b .kbd{font-size:11px;color:var(--mut2);background:var(--s1);border:1px solid var(--line);
     border-radius:4px;padding:2px 6px;font-family:ui-monospace,Menlo,monospace}
  /* Linear specifies 8px 14px padding (a 34px control). Density is the whole
     point of this direction on desktop, but a 34px control is not tappable, so
     min-height carries the 44px floor on touch without changing the padding
     the brand rule specifies. */
  .b .btn{font-size:14px;font-weight:500;padding:8px 14px;border-radius:8px;border:1px solid transparent;
     cursor:pointer;font-family:inherit;white-space:nowrap;display:inline-flex;
     align-items:center;justify-content:center}
  .b .btn-p{background:var(--brand);color:#fff}
  .b .btn-s{background:var(--s1);color:var(--ink);border-color:var(--line)}

  /* Metric ribbon — thin, not big cards */
  .b .ribbon{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:20px}
  .b .met{background:var(--s1);border:1px solid var(--line);border-radius:8px;padding:12px 14px;min-width:0}
  .b .met .k{font-size:12px;color:var(--mut);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .b .met .v{font-size:22px;font-weight:500;letter-spacing:-.4px;line-height:1.1}
  .b .met .d{font-size:12px;color:var(--mut2);margin-top:2px}
  .b .met .v.bad{color:#ff6b6b}

  /* Two-column console */
  .b .cols{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;align-items:start}
  .b .card{background:var(--s1);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .b .card-h{display:flex;align-items:center;justify-content:space-between;gap:8px;
     padding:12px 14px;border-bottom:1px solid var(--line)}
  .b .card-h h2{font-size:13px;font-weight:500;letter-spacing:.4px;text-transform:uppercase;color:var(--mut);margin:0}
  .b .card-h .r{font-size:12px;color:var(--mut2)}

  /* Stream rows — 32px, dense */
  .b .ev{display:grid;grid-template-columns:52px 1fr auto auto;gap:10px;align-items:center;
     padding:0 14px;height:34px;border-bottom:1px solid var(--line);font-size:13px;
     text-decoration:none;color:var(--ink2)}
  .b .ev:last-child{border-bottom:0}
  .b .ev:hover{background:var(--s2)}
  .b .ev .t{color:var(--mut2);font-size:12px;font-family:ui-monospace,Menlo,monospace}
  .b .ev .m{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .b .ev .m b{font-weight:400;color:var(--ink)}
  .b .ev .det{color:var(--mut);font-size:12px}
  .b .tag{font-size:11px;border-radius:9999px;padding:2px 8px;white-space:nowrap}
  .b .ms{font-size:12px;color:var(--mut2);font-variant-numeric:tabular-nums;width:34px;text-align:right}

  /* Sparkline strip inside the stream card */
  /* Each column is one hour: grey is what passed, red is the true blocked
     share of that same hour. Colouring the WHOLE bar red above a threshold
     (the first version) read as "this hour was entirely blocked". */
  .b .mini{display:flex;align-items:flex-end;gap:2px;height:44px;padding:12px 14px 0}
  .b .mini u{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%}
  .b .mini i{display:block;background:var(--line2);border-radius:1px}
  .b .mini i.hot{background:#ff6b6b;border-radius:1px 1px 0 0}

  /* Subsystem list — compact rows with counts */
  .b .grp{padding:10px 14px 4px;font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--mut2)}
  .b .sub{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;
     padding:0 14px;height:38px;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink2);font-size:13px}
  .b .sub:last-child{border-bottom:0}
  .b .sub:hover{background:var(--s2);color:var(--ink)}
  .b .sub .n{display:flex;align-items:center;gap:8px;min-width:0}
  .b .sub .n i{width:6px;height:6px;border-radius:99px;flex:0 0 auto}
  .b .sub .n span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .b .sub .v{font-variant-numeric:tabular-nums;color:var(--ink);font-size:13px}
  .b .sub .k{font-size:11px;color:var(--mut2);font-family:ui-monospace,Menlo,monospace;
     border:1px solid var(--line);border-radius:4px;padding:1px 5px;min-width:22px;text-align:center}

  /* Posture block */
  .b .post{padding:14px}
  .b .bar{height:8px;border-radius:99px;background:var(--s3);overflow:hidden;margin:10px 0 6px;position:relative}
  .b .bar i{display:block;height:100%;background:var(--brand);border-radius:99px}
  .b .bar u{position:absolute;top:-3px;width:2px;height:14px;background:var(--ink2);border-radius:2px}
  .b .fam{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:12px}
  /* Direct child only. A bare descendant selector also matched the .c and .q
     children, so every family rendered as two stacked boxes instead of one. */
  .b .fam > div{background:var(--s2);border:1px solid var(--line);border-radius:6px;padding:6px 8px;min-width:0}
  .b .fam .c{font-size:11px;color:var(--mut);font-family:ui-monospace,Menlo,monospace}
  .b .fam .q{font-size:13px;font-variant-numeric:tabular-nums;margin-top:2px}

  /* ── Mobile ─────────────────────────────────────────────────────────────
     One column. The ribbon scrolls horizontally as chips rather than
     shrinking five metrics into unreadable slivers. */
  @media(max-width:1024px){ .b .cols{grid-template-columns:minmax(0,1fr)} }
  @media(max-width:760px){
    .b .wrap{padding:14px 16px 32px}
    .b .title{font-size:17px}
    .b .ribbon{display:flex;overflow-x:auto;gap:8px;margin:0 -16px 16px;padding:0 16px 4px;
       scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
    .b .ribbon::-webkit-scrollbar{display:none}
    .b .met{flex:0 0 46%;scroll-snap-align:start}
    .b .fam{grid-template-columns:repeat(2,minmax(0,1fr))}
    /* Touch beats density on a handset. The 34px stream row and 38px subsystem
       row are correct with a mouse and unusable with a thumb, so both go to the
       44px floor here and only here — desktop keeps the compact console. */
    .b .ev{grid-template-columns:46px 1fr auto;gap:8px;height:auto;min-height:44px;padding:9px 12px}
    .b .ev .det{display:none}
    .b .ev .ms{display:none}
    .b .sub{padding:0 12px;height:auto;min-height:44px}
    .b .sub .k{display:none}
    .b .btn{min-height:44px}
    .b .top .kbd{display:none}
  }
</style>

<div class="b"><div class="wrap">
  <div class="top">
    <div class="l">
      <div class="title">Overview</div>
      <span class="chip"><i></i>Gateway live</span>
      <span class="chip" style="background:transparent;color:var(--mut2)">${D.company}</span>
    </div>
    <div class="l">
      <span class="kbd">⌘K</span>
      <button class="btn btn-s">Export log</button>
      <button class="btn btn-p">Generate report</button>
    </div>
  </div>

  <div class="ribbon">
    <div class="met"><div class="k">Prompts · 7d</div><div class="v num">${fmt(D.events)}</div><div class="d num">${D.uptimePct}% uptime</div></div>
    <div class="met"><div class="k">Blocked</div><div class="v num bad">${D.blocked}</div><div class="d num">${D.blockRatePct}% of traffic</div></div>
    <div class="met"><div class="k">Held for review</div><div class="v num">${D.quarantine}</div><div class="d">oldest 3d</div></div>
    <div class="met"><div class="k">Scan p50</div><div class="v num">${D.scanP50Ms}ms</div><div class="d num">p99 ${D.scanP99Ms}ms</div></div>
    <div class="met"><div class="k">SPRS</div><div class="v num">${D.sprs}</div><div class="d num">target ${D.sprsTarget}</div></div>
  </div>

  <div class="cols">
    <div style="display:grid;gap:20px">
      <div class="card">
        <div class="card-h"><h2>Live stream</h2><div class="r num">${fmt(D.events)} events · ${D.windowDays}d</div></div>
        <div class="mini">${D.hourly.map(([t, bl]) => {
          const h = Math.max(4, (t / maxH) * 100)
          const b = bl ? Math.max(1.5, (bl / t) * h) : 0
          return `<u title="${t} prompts · ${bl} blocked">${b ? `<i class="hot" style="height:${b}%"></i>` : ''}<i style="height:${h - b}%"></i></u>`
        }).join('')}</div>
        <div style="padding:6px 14px 10px;font-size:12px;color:var(--mut2)">24h · red is the blocked share of each hour</div>
        ${D.recent.map((e) => `
          <a class="ev" href="/command-center/events">
            <span class="t">${e.t}</span>
            <span class="m"><b>${e.provider}</b> <span class="det">${e.detected || 'clean'}</span></span>
            <span class="tag" style="color:${OUT[e.outcome].fg};background:${OUT[e.outcome].bg}">${OUT[e.outcome].label}</span>
            <span class="ms">${e.ms}ms</span>
          </a>`).join('')}
        <a class="ev" href="/command-center/realtime" style="color:var(--brand)">
          <span class="t"></span><span class="m">Open Real-Time Feed →</span><span></span><span></span>
        </a>
      </div>

      <div class="card">
        <div class="card-h"><h2>Detected this week</h2><div class="r">mapped to NIST 800-171</div></div>
        ${D.detections.map((d) => `
          <a class="sub" href="/command-center/events">
            <span class="n"><i style="background:${d.trend > 0 ? '#ff6b6b' : d.trend < 0 ? '#27a644' : '#62666d'}"></i><span>${d.name}</span></span>
            <span class="v num">${d.count}</span>
            <span class="k">${d.control.split('-')[0]}</span>
          </a>`).join('')}
      </div>
    </div>

    <div style="display:grid;gap:20px">
      <div class="card">
        <div class="card-h"><h2>Posture</h2><div class="r num">${D.controlsMet}/${D.controlsTotal}</div></div>
        <div class="post">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <div style="font-size:28px;font-weight:500;letter-spacing:-.6px" class="num">${D.sprs}</div>
            <div style="font-size:12px;color:var(--mut)" class="num">was ${D.sprsPrev} · target ${D.sprsTarget}</div>
          </div>
          <div class="bar"><i style="width:${(D.sprs / 110) * 100}%"></i><u style="left:${(D.sprsTarget / 110) * 100}%"></u></div>
          <div style="font-size:12px;color:var(--mut2)">${D.gapsOpen} gaps open · <span style="color:#ff6b6b">${D.gapsCritical} block conditional L2</span></div>
          <div class="fam">
            ${D.families.map((f) => `<div><div class="c">${f.code}</div><div class="q">${f.met}/${f.total}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h2>Subsystems</h2><div class="r">${ROWS.length} sections</div></div>
        ${groups.map((g) => `
          <div class="grp">${g}</div>
          ${ROWS.filter((r) => r.group === g).map((r, i) => `
            <a class="sub" href="${r.href}">
              <span class="n"><i style="background:${STATE[r.state]}"></i><span>${r.label}</span></span>
              <span class="v num">${r.value}</span>
              <span class="k">${'G' + (i + 1)}</span>
            </a>`).join('')}
        `).join('')}
      </div>
    </div>
  </div>
</div></div>
`
