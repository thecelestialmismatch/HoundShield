import { D, ROWS, fmt } from './data.mjs'

/**
 * DEMO C — "Executive Brief", grounded in design-md/vercel.
 *
 * Structural idea: the page opens with a SENTENCE, not a grid. A Privacy
 * Officer or a CISO who opens this on a phone between meetings gets the verdict
 * in one line, three numbers that justify it, and then progressive disclosure —
 * each subsystem is a block with one number, one sentence, and a way in.
 * Built mobile-first: the single column IS the design, and desktop just widens
 * it, which is why nothing has to un-squeeze at 375px.
 *
 * Vercel rules applied verbatim: canvas #fafafa / card #ffffff / ink #171717,
 * display weight 600 with aggressive negative tracking (-2.4px at 48px), mono
 * eyebrows at 12px, 100px pill CTAs, and stacked micro-shadows + inset hairline
 * ring — never a single heavy drop shadow.
 */

const STATE = {
  ok:   { fg: '#0070f3', bg: '#eaf3ff', label: 'Nominal' },
  warn: { fg: '#9b6829', bg: '#fdf4e3', label: 'Attention' },
  act:  { fg: '#ee0000', bg: '#f7d4d6', label: 'Action' },
}
const groups = [...new Set(ROWS.map((r) => r.group))]
const maxH = Math.max(...D.hourly.map(([t]) => t))

export const C = `
<style>
  .c{--ink:#171717;--mut:#666;--mut2:#8f8f8f;--canvas:#fafafa;--card:#fff;--soft:#f5f5f5;
     --line:#ebebeb;--link:#0070f3;--err:#ee0000;
     --sh1:0 0 0 1px #00000014;
     --sh2:0px 2px 2px #0000000a,0px 8px 8px -8px #0000000a,0 0 0 1px #00000014;
     background:var(--canvas);color:var(--ink);min-height:100vh;
     font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .c *{box-sizing:border-box}
  .c .num{font-variant-numeric:tabular-nums}
  .c .mono{font-family:ui-monospace,'Geist Mono',Menlo,monospace}
  .c .wrap{max-width:760px;margin:0 auto;padding:32px 16px 56px}
  .c .eyebrow{font-size:12px;line-height:16px;color:var(--mut2);text-transform:uppercase;
     letter-spacing:.4px;margin-bottom:12px}

  /* Verdict */
  .c .verdict{font-size:32px;font-weight:600;line-height:40px;letter-spacing:-1.28px;margin:0 0 12px}
  .c .verdict em{font-style:normal;color:var(--err)}
  .c .lede{font-size:16px;line-height:24px;color:var(--mut);margin:0 0 24px}

  .c .cta{display:flex;gap:8px;margin-bottom:32px;flex-wrap:wrap}
  .c .btn{height:48px;padding:0 20px;border-radius:100px;font-size:16px;font-weight:500;
     border:1px solid var(--line);cursor:pointer;font-family:inherit;display:inline-flex;
     align-items:center;justify-content:center}
  .c .btn-p{background:var(--ink);color:#fff;border-color:var(--ink)}
  .c .btn-s{background:#fff;color:var(--ink)}

  /* Three numbers that justify the verdict */
  .c .three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:32px}
  .c .big{background:var(--card);border-radius:12px;padding:20px;box-shadow:var(--sh1)}
  .c .big .k{font-size:12px;line-height:16px;color:var(--mut2);margin-bottom:8px}
  .c .big .v{font-size:32px;font-weight:600;letter-spacing:-1.28px;line-height:40px}
  .c .big .v.err{color:var(--err)}
  .c .big .m{font-size:14px;line-height:20px;letter-spacing:-.28px;color:var(--mut);margin-top:2px}

  /* Activity */
  .c .panel{background:var(--card);border-radius:12px;padding:24px;box-shadow:var(--sh2);margin-bottom:32px}
  .c .panel h2{font-size:20px;font-weight:600;letter-spacing:-.6px;line-height:28px;margin:0 0 4px}
  .c .panel p{font-size:14px;line-height:20px;letter-spacing:-.28px;color:var(--mut);margin:0 0 16px}
  /* Grey = passed, red = the true blocked share of that hour. */
  .c .spark{display:flex;align-items:flex-end;gap:2px;height:72px}
  .c .spark u{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%}
  .c .spark i{display:block;background:#dcdcdc;border-radius:2px 2px 0 0}
  .c .spark i.hot{background:var(--err);border-radius:2px 2px 0 0}
  .c .axis{display:flex;justify-content:space-between;font-size:12px;color:var(--mut2);margin-top:8px}

  /* Progressive disclosure blocks */
  .c .grp{font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut2);
     margin:0 0 12px}
  .c .blocks{display:grid;gap:8px;margin-bottom:32px}
  .c .blk{background:var(--card);border-radius:8px;padding:16px 20px;box-shadow:var(--sh1);
     display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;
     text-decoration:none;color:inherit;transition:box-shadow .15s}
  .c .blk:hover{box-shadow:var(--sh2)}
  .c .blk .n{font-size:16px;line-height:24px;font-weight:500;min-width:0}
  .c .blk .s{font-size:14px;line-height:20px;letter-spacing:-.28px;color:var(--mut);margin-top:2px}
  .c .blk .v{font-size:24px;font-weight:600;letter-spacing:-.96px;line-height:32px;text-align:right}
  .c .blk .u{font-size:12px;color:var(--mut2);text-align:right}
  .c .pill{font-size:12px;line-height:16px;border-radius:100px;padding:4px 10px;white-space:nowrap}
  .c .arw{color:var(--mut2);font-size:18px}

  /* Detections */
  .c .det{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
  .c .det div{background:var(--soft);border-radius:8px;padding:12px;text-align:center;min-width:0}
  .c .det .q{font-size:24px;font-weight:600;letter-spacing:-.96px}
  .c .det .n{font-size:12px;color:var(--mut);margin-top:2px}
  .c .det .ct{font-size:11px;color:var(--mut2);margin-top:4px}

  /* ── Mobile-first: this column IS the layout. Desktop only widens it. ──── */
  @media(max-width:600px){
    .c .wrap{padding:24px 16px 40px}
    .c .verdict{font-size:26px;line-height:32px;letter-spacing:-.96px}
    .c .three{grid-template-columns:minmax(0,1fr);gap:8px}
    .c .big{display:grid;grid-template-columns:1fr auto;align-items:center;padding:16px 20px}
    .c .big .k{grid-column:1;margin:0;font-size:14px;color:var(--ink)}
    .c .big .v{grid-column:2;grid-row:1;font-size:26px;letter-spacing:-.96px;text-align:right}
    .c .big .m{grid-column:1/-1;font-size:13px}
    .c .panel{padding:20px}
    .c .blk{grid-template-columns:1fr auto;gap:4px 12px;
       grid-template-areas:"n v" "s u" "p a"}
    .c .blk .nn{grid-area:n} .c .blk .s{grid-area:s}
    .c .blk .vv{grid-area:v} .c .blk .u{grid-area:u}
    .c .blk .pw{grid-area:p;margin-top:10px} .c .blk .arw{grid-area:a;margin-top:10px;text-align:right}
    .c .det{grid-template-columns:repeat(2,minmax(0,1fr))}
    .c .cta{flex-direction:column} .c .btn{width:100%}
  }
</style>

<div class="c"><div class="wrap">
  <div class="eyebrow mono">${D.company} · last ${D.windowDays} days · updated ${D.lastUpdate}</div>
  <h1 class="verdict">Your gateway stopped <em>${D.blocked} prompts</em> carrying regulated data this week.</h1>
  <p class="lede">
    Every one was inspected on your own hardware in ${D.scanP50Ms}ms and written to a hash-chained
    audit log. ${D.gapsCritical} control gaps still stand between you and a conditional Level&nbsp;2.
  </p>

  <div class="cta">
    <button class="btn btn-p">Generate C3PAO report</button>
    <button class="btn btn-s">Review ${D.quarantine} held prompts</button>
  </div>

  <div class="three">
    <div class="big"><div class="k">Prompts inspected</div><div class="v num">${fmt(D.events)}</div><div class="m num">${D.uptimePct}% gateway uptime</div></div>
    <div class="big"><div class="k">Blocked before egress</div><div class="v num err">${D.blocked}</div><div class="m num">${D.blockRatePct}% of all traffic</div></div>
    <div class="big"><div class="k">SPRS score</div><div class="v num">${D.sprs}</div><div class="m num">up ${D.sprs - D.sprsPrev} · target ${D.sprsTarget}</div></div>
  </div>

  <div class="panel">
    <h2>When it happened.</h2>
    <p>Twenty-four hours of gateway traffic. The red cap on each hour is the share that was stopped — the tallest caps are where to look first.</p>
    <div class="spark">${D.hourly.map(([t, bl]) => {
      const h = Math.max(5, (t / maxH) * 100)
      const b = bl ? Math.max(2, (bl / t) * h) : 0
      return `<u title="${t} prompts · ${bl} blocked">${b ? `<i class="hot" style="height:${b}%"></i>` : ''}<i style="height:${h - b}%"></i></u>`
    }).join('')}</div>
    <div class="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span></div>
  </div>

  <div class="panel">
    <h2>What it found.</h2>
    <p>Each detection class maps to the NIST 800-171 control an assessor will ask about.</p>
    <div class="det">
      ${D.detections.map((d) => `<div><div class="q num">${d.count}</div><div class="n">${d.name}</div><div class="ct mono">${d.control.split('-')[0]}</div></div>`).join('')}
    </div>
  </div>

  ${groups.map((g) => `
    <div class="grp mono">${g}</div>
    <div class="blocks">
      ${ROWS.filter((r) => r.group === g).map((r) => `
        <a class="blk" href="${r.href}">
          <div class="nn"><div class="n">${r.label}</div></div>
          <div class="s">${r.note}</div>
          <div class="vv"><div class="v num">${r.value}</div></div>
          <div class="u">${r.unit}</div>
          <div class="pw"><span class="pill" style="color:${STATE[r.state].fg};background:${STATE[r.state].bg}">${STATE[r.state].label}</span></div>
          <div class="arw">→</div>
        </a>`).join('')}
    </div>`).join('')}
</div></div>
`
