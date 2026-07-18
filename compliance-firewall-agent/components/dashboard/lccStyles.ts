/**
 * Live Command Center — scoped styles, evolved from the approved Direction-A
 * "Live Command Center (After-Login Dashboard)" spec. Every selector is
 * namespaced under `.hs-lcc` and keyframes are renamed (lcc*) so nothing
 * leaks into the rest of the app.
 *
 * Layout contract: ONE document scroll. The shell grid spans the page, the
 * sidebar is sticky at 100dvh, and `.main` has no height/overflow of its own —
 * the old nested `height:100vh; overflow:auto` produced a scrollbar-inside-a-
 * scrollbar whenever anything rendered above the shell (mobile killer).
 *
 * Font contract: next/font registers the brand typeface (Geist) under HASHED
 * family names, reachable ONLY via var(--font-display)/var(--font-body) (set
 * on <html> in app/layout.tsx). A literal family name here silently falls
 * back to the browser default — that shipped once. Guards:
 * app/__tests__/console-dashboard-contract.test.ts + font-brand-contract.test.ts
 */
export const LCC_CSS = `
.hs-lcc{
  /* AURORA skin (2026-07-18 redesign): the console shares the marketing hero's
     soft slate-blue → pale-sage gradient stage + pastel accent set, so the
     after-login dashboard and the hero window read as one family. Falls back to
     a flat wash so the console is self-sufficient if the site tokens are absent. */
  --bg: var(--hs-aurora-bg, linear-gradient(155deg,#C9D1DB 0%,#D3D8D5 44%,#DFE6D2 100%));
  --panel: var(--hs-surface-0, #FFFFFF);
  --panel2: var(--hs-aurora-glass, rgba(255,255,255,.66));
  /* Pastel data-viz accents (shared with the hero window). */
  --lime: var(--hs-lime, #B6D94E); --peach: var(--hs-peach, #F0B880); --peri: var(--hs-peri, #A9C7EE);
  --soft: 0 2px 12px rgba(56,78,112,.07); --soft-lg: 0 18px 44px rgba(56,78,112,.16);
  --hover: var(--hs-mist-md, rgba(129,166,198,.10));
  --line: var(--hs-border-ink, rgba(15,30,46,.10));
  --line2: var(--hs-border, rgba(129,166,198,.30));
  --text: var(--hs-ink, #0F1E2E);
  --mut: var(--hs-ink-secondary, #3D5166);
  --mut2: var(--hs-ink-tertiary, #6B8299);
  --brand: var(--hs-steel-dark, #5A86A8);
  --bright: var(--hs-steel, #81A6C6);
  --cream: var(--hs-cream, #F3E3D0);
  --track: rgba(15,30,46,.07);
  --ok:#0E9F6E; --okbg:rgba(14,159,110,.12);
  --bad:#E5484D; --badbg:rgba(229,72,77,.12);
  --warn:#D9870B; --warnbg:rgba(217,135,11,.12);
  --orange:#E07B39; --orangebg:rgba(224,123,57,.12);
  /* Text-grade status companions: the base hues sit ~2.5–3.9:1 on their tints —
     fine for bars/icons/large numbers, below AA for small text. Small status
     TEXT always uses these ≥4.5:1 darks (worst offender was the mandatory
     "Do not enter CUI" warning at ~2.5:1). */
  --ok-text:#067A54; --bad-text:#B32732; --warn-text:#8A5200; --orange-text:#9A4B12;
  --f-disp:var(--font-display),system-ui,sans-serif;
  --f:var(--font-body),system-ui,-apple-system,'Segoe UI',sans-serif;
  --f-mono:var(--font-mono),ui-monospace,SFMono-Regular,Menlo,monospace;
  --r:16px; --r-sm:10px;
  font-family:var(--f);background:var(--bg);background-attachment:fixed;color:var(--text);-webkit-font-smoothing:antialiased;
}
/* Scoped reset. :where() keeps it at ZERO specificity so the Tailwind-styled
   panels embedded in the shell (WelcomeBanner, CustomerStatusPanel,
   PlanUnlocksBoard, AssessmentBoard under .cc-light) keep their utility
   spacing — this style tag renders after the global sheet, so a full-strength
   ".hs-lcc *" reset would silently beat every p-/m- utility inside. */
.hs-lcc *{box-sizing:border-box}
:where(.hs-lcc *){margin:0;padding:0}
.hs-lcc .mono{font-family:var(--f-mono)}
.hs-lcc .shell{display:grid;grid-template-columns:248px 1fr;min-height:100dvh}

.hs-lcc .side{background:var(--panel2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:16px 12px;position:sticky;top:0;height:100dvh;overflow-y:auto}
.hs-lcc .brand{display:flex;align-items:center;gap:.55rem;padding:.4rem .5rem 1.1rem}
.hs-lcc .brand img{height:30px;width:auto;mix-blend-mode:multiply;transition:transform .3s cubic-bezier(.22,.61,.36,1);transform-origin:center;animation:hs-logo-idle 4.5s ease-in-out infinite}
.hs-lcc .brand:hover img,.hs-lcc .brand img:hover,.hs-lcc .brand:active img,.hs-lcc .brand img:active{animation:none;transform:rotate(-8deg) scale(1.08)}
.hs-lcc .brand span{font-family:var(--f-disp);font-weight:600;font-size:1.18rem}
.hs-lcc .brand span b{color:var(--brand)}
.hs-lcc .gh{font-family:var(--f-mono);font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mut2);margin:1rem .6rem .35rem}
.hs-lcc .slink{display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;border-radius:var(--r-sm);font-size:.88rem;font-weight:500;color:var(--mut);cursor:pointer;transition:all .15s;position:relative;width:100%;text-align:left;background:none;border:none;font-family:var(--f)}
.hs-lcc .slink svg{width:17px;height:17px}
.hs-lcc .slink:hover{background:var(--hover);color:var(--text)}
.hs-lcc .slink.on{background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand);font-weight:600}
.hs-lcc .slink.on::before{content:"";position:absolute;left:-12px;top:8px;bottom:8px;width:3px;border-radius:3px;background:linear-gradient(180deg,var(--brand),var(--orange))}
.hs-lcc .slink .pp{margin-left:auto;font-family:var(--f-mono);font-size:.62rem;font-weight:700;background:var(--badbg);color:var(--bad-text);padding:.05rem .35rem;border-radius:5px}
.hs-lcc .slink:focus-visible,.hs-lcc .btn:focus-visible,.hs-lcc .chips button:focus-visible,.hs-lcc .bchips button:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.hs-lcc .side-foot{margin-top:auto;padding:.7rem;border-top:1px solid var(--line);display:flex;align-items:center;gap:.6rem}
.hs-lcc .av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--brand),var(--orange));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.82rem;flex-shrink:0}
.hs-lcc .side-foot .nm{font-size:.84rem;font-weight:600}.hs-lcc .side-foot .sub{font-size:.72rem;color:var(--mut2)}
.hs-lcc .side-link{display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;border-radius:var(--r-sm);font-size:.84rem;font-weight:500;color:var(--mut);text-decoration:none;transition:all .15s}
.hs-lcc .side-link:hover{background:var(--hover);color:var(--bright)}
.hs-lcc .side-link svg{width:16px;height:16px}

/* Mobile drawer scrim — tap anywhere outside the open sidebar to close it. */
.hs-lcc .scrim{position:fixed;inset:0;z-index:55;background:rgba(15,30,46,.45);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .25s ease}
.hs-lcc .scrim.on{opacity:1;pointer-events:auto}
@media(min-width:1001px){.hs-lcc .scrim{display:none}}

.hs-lcc .main{min-width:0}
.hs-lcc .top{position:sticky;top:0;z-index:20;background:rgba(250,252,255,.82);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);padding:14px 26px;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.hs-lcc .top h1{font-family:var(--f-disp);font-size:1.4rem;font-weight:600}
.hs-lcc .top .crumb{font-size:.74rem;color:var(--mut2)}
.hs-lcc .top-brand{display:none;align-items:center;flex-shrink:0}
.hs-lcc .top-right{display:flex;align-items:center;gap:.8rem}
.hs-lcc .clock{font-family:var(--f-mono);font-size:.82rem;color:var(--mut);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.4rem .7rem}
.hs-lcc .statpill{display:inline-flex;align-items:center;gap:.45rem;font-size:.76rem;font-weight:600;color:var(--ok-text);background:var(--okbg);border:1px solid color-mix(in srgb,var(--ok) 28%,transparent);border-radius:999px;padding:.35rem .7rem}
.hs-lcc .dot{width:7px;height:7px;border-radius:50%;background:var(--ok);animation:lccPulse 1.8s infinite}
.hs-lcc .dot.b{background:var(--brand)}
@keyframes lccPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 60%,transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}

.hs-lcc .body{padding:24px 26px 60px}
.hs-lcc .atab{display:none}.hs-lcc .atab.on{display:block;animation:lccFade .35s ease}
@keyframes lccFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.hs-lcc .ops{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:.7rem 16px;font-size:.84rem;color:var(--mut);margin-bottom:18px;box-shadow:var(--soft)}
.hs-lcc .ops b{color:var(--text);font-family:var(--f-mono);font-weight:600}
.hs-lcc .ops .sep{color:var(--mut2)}

/* ── Evidence-chain spine — the persistent, uncopyable differentiator ──
   A cream-tinted strip under the top bar: the live SHA-256 audit chain being
   built on the customer's own hardware, one click from the $499 PDF. */
.hs-lcc .spine{position:sticky;top:63px;z-index:19;display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;
  padding:.5rem 26px;border-bottom:1px solid var(--line);
  background:linear-gradient(90deg,color-mix(in srgb,var(--cream) 55%,#fff),var(--panel) 70%);
  font-size:.8rem;color:var(--mut)}
.hs-lcc .spine-ic{width:16px;height:16px;color:var(--ok);flex-shrink:0}
.hs-lcc .spine-txt{flex:1;min-width:0}
.hs-lcc .spine-txt b{color:var(--text);font-weight:600}
.hs-lcc .spine-txt .sep{color:var(--mut2);margin:0 .1rem}
/* Simulated-preview pill — the persistent honesty affordance in the spine.
   A real button (opens Settings → proxy URL), orange-tinted so it reads as
   "heads-up", with AA text on its tint. */
.hs-lcc .spine-sim{flex-shrink:0;font-family:var(--f-mono);font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--orange-text);background:var(--orangebg);border:1px solid color-mix(in srgb,var(--orange) 30%,transparent);border-radius:999px;padding:.22rem .6rem;cursor:pointer;transition:border-color .15s}
.hs-lcc .spine-sim:hover{border-color:var(--orange)}
.hs-lcc .spine-cta{flex-shrink:0}

/* Doberman mark on the Brain surfaces (Overview quick-ask card + Brain header). */
.hs-lcc .brain-mark{height:38px;width:auto;flex-shrink:0;mix-blend-mode:multiply;transition:transform .3s cubic-bezier(.22,.61,.36,1);transform-origin:center;animation:hs-logo-idle 4.5s ease-in-out infinite}
.hs-lcc .brain-mark:hover{animation:none;transform:rotate(-8deg) scale(1.08)}
.hs-lcc .brain-mark.sm{height:20px;vertical-align:-4px;display:inline-block;margin-right:.4rem}

/* CUI warning — compliance requirement: Brain AI routes to a commercial cloud.
   warn-text (not the base hue): the mandated warning was the least readable
   text on the tab at ~2.5:1. */
.hs-lcc .cui-note{display:flex;align-items:center;gap:.45rem;padding:.5rem 18px;font-size:.76rem;color:var(--warn-text);background:var(--warnbg);border-bottom:1px solid var(--line)}
.hs-lcc .cui-note svg{width:14px;height:14px;flex-shrink:0}
.hs-lcc .bub.b{border-left:3px solid var(--brand)}

/* First-run checklist — ends on the PDF (activation driver). */
.hs-lcc .steps{display:flex;flex-direction:column;gap:10px}
.hs-lcc .steprow{display:flex;align-items:center;gap:.8rem;padding:.6rem .2rem;border-bottom:1px solid var(--line)}
.hs-lcc .steprow:last-child{border:none}
.hs-lcc .step-n{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-family:var(--f-mono);font-weight:700;font-size:.8rem;flex-shrink:0;background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand)}
.hs-lcc .steprow.done .step-n{background:var(--okbg);color:var(--ok)}
.hs-lcc .step-body{flex:1;min-width:0;display:flex;flex-direction:column}
.hs-lcc .step-body b{font-size:.9rem;font-weight:600}
.hs-lcc .step-body span{font-size:.78rem;color:var(--mut2)}

/* KPI tiles — each carries its own accent hue as a gradient hairline + icon
   tint, so status reads in colour before you read a single number. */
.hs-lcc .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.hs-lcc .kpi{--accent:var(--brand);position:relative;overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;transition:border-color .2s,box-shadow .2s;box-shadow:var(--soft)}
.hs-lcc .kpi::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 8%,transparent))}
.hs-lcc .kpi:hover{border-color:color-mix(in srgb,var(--accent) 40%,transparent);box-shadow:0 8px 24px -14px color-mix(in srgb,var(--accent) 60%,transparent)}
.hs-lcc .kpi.a-bad{--accent:var(--bad)}
.hs-lcc .kpi.a-ok{--accent:var(--ok)}
.hs-lcc .kpi.a-warn{--accent:var(--warn)}
.hs-lcc .kpi.a-orange{--accent:var(--orange)}
/* KPI tiles are BUTTONS (click → data-source dialog): reset the UA button
   chrome so the tile styling above wins, and give the affordance a focus ring. */
.hs-lcc button.kpi{display:block;width:100%;text-align:left;font-family:var(--f);color:var(--text);cursor:pointer}
.hs-lcc .kpi:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.hs-lcc .kpi-info{position:absolute;top:10px;right:10px;width:13px;height:13px;color:var(--mut2);opacity:.75}
.hs-lcc .kpi:hover .kpi-info{color:var(--accent);opacity:1}
.hs-lcc .kpi .l{font-size:.76rem;color:var(--mut2);display:flex;align-items:center;gap:.4rem}
.hs-lcc .kpi .l svg{width:13px;height:13px;color:var(--accent)}
.hs-lcc .kpi .n{font-family:var(--f-disp);font-size:1.9rem;font-weight:600;margin-top:.3rem;font-variant-numeric:tabular-nums}
.hs-lcc .kpi .d{font-size:.73rem;margin-top:.15rem;color:var(--mut)}
.hs-lcc .kpi .d.up{color:var(--ok-text)}.hs-lcc .kpi .d.dn{color:var(--bad-text)}
.hs-lcc .bump{animation:lccBump .45s ease}@keyframes lccBump{0%{transform:translateY(2px);opacity:.55}100%{transform:none;opacity:1}}

.hs-lcc .row{display:grid;gap:16px;margin-bottom:16px}
.hs-lcc .r-2-1{grid-template-columns:1.55fr 1fr}
.hs-lcc .r-3-2{grid-template-columns:1.45fr 1fr}
.hs-lcc .panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--soft)}
.hs-lcc .ph{padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,color-mix(in srgb,var(--brand) 4%,transparent),transparent)}
.hs-lcc .ph h3{font-size:.98rem;font-weight:600}
.hs-lcc .ph .mono{font-size:.7rem;color:var(--mut2)}
.hs-lcc .live-tag{display:inline-flex;align-items:center;gap:.35rem;font-family:var(--f-mono);font-size:.66rem;font-weight:700;color:var(--ok-text);text-transform:uppercase;letter-spacing:.08em}
.hs-lcc .pad{padding:16px 18px}

.hs-lcc #thru{width:100%;height:170px;display:block}

.hs-lcc .donut-wrap{display:flex;align-items:center;gap:18px;padding:18px}
.hs-lcc .donut{width:130px;height:130px;border-radius:50%;position:relative;flex-shrink:0;transition:background .8s ease}
.hs-lcc .donut::after{content:"";position:absolute;inset:18px;border-radius:50%;background:var(--panel)}
.hs-lcc .donut .c{position:absolute;inset:0;display:grid;place-content:center;text-align:center;z-index:2}
.hs-lcc .donut .c b{font-family:var(--f-disp);font-size:1.5rem;font-weight:600}
.hs-lcc .donut .c span{font-size:.66rem;color:var(--mut2)}
.hs-lcc .legend{display:flex;flex-direction:column;gap:.5rem;font-size:.82rem;flex:1}
.hs-lcc .legend div{display:flex;align-items:center;gap:.5rem}
.hs-lcc .legend i{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.hs-lcc .legend .v{margin-left:auto;font-family:var(--f-mono);color:var(--text)}

.hs-lcc .feed-row{display:flex;align-items:center;gap:.7rem;padding:.6rem 18px;border-bottom:1px solid var(--line);font-size:.83rem}
.hs-lcc .feed-row:last-child{border:none}
.hs-lcc .tag{font-family:var(--f-mono);font-size:.64rem;font-weight:700;padding:.18rem .45rem;border-radius:5px;width:66px;text-align:center;flex-shrink:0}
.hs-lcc .tag.block{background:var(--badbg);color:var(--bad-text)}.hs-lcc .tag.pass{background:var(--okbg);color:var(--ok-text)}.hs-lcc .tag.quar{background:var(--warnbg);color:var(--warn-text)}
.hs-lcc .feed-row .what{flex:1;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-lcc .feed-row .eng{font-family:var(--f-mono);font-size:.68rem;color:var(--mut2)}
.hs-lcc .feed-row .lat{font-family:var(--f-mono);font-size:.7rem;color:var(--mut2);width:42px;text-align:right}
.hs-lcc .feed-row.fresh{animation:lccFresh 1.4s ease}
@keyframes lccFresh{0%{background:color-mix(in srgb,var(--brand) 16%,transparent)}100%{background:transparent}}

.hs-lcc .eng{display:grid;grid-template-columns:92px 1fr 40px;align-items:center;gap:12px;padding:.4rem 0;font-size:.82rem;color:var(--mut)}
.hs-lcc .bar{height:8px;border-radius:99px;background:var(--track);overflow:hidden}
.hs-lcc .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--peri),var(--lime));border-radius:99px;transition:width .8s ease}
.hs-lcc .eng b{text-align:right;font-family:var(--f-mono);color:var(--text);font-weight:600}

.hs-lcc .sprs{display:flex;flex-direction:column;align-items:center;padding:18px}
.hs-lcc .ring{width:150px;height:150px;border-radius:50%;display:grid;place-items:center;position:relative;transition:background .8s ease}
.hs-lcc .ring::before{content:"";position:absolute;inset:13px;border-radius:50%;background:var(--panel)}
.hs-lcc .ring b{position:relative;font-family:var(--f-disp);font-size:2.3rem;font-weight:600}
.hs-lcc .ring small{position:relative;display:block;text-align:center;font-size:.64rem;color:var(--mut2);margin-top:-4px}
.hs-lcc .cap{font-size:.8rem;color:var(--mut);text-align:center;margin-top:.7rem;line-height:1.5}

.hs-lcc .crow{display:flex;align-items:center;justify-content:space-between;padding:.6rem 18px;border-bottom:1px solid var(--line);font-size:.84rem}
.hs-lcc .crow:last-child{border:none}
.hs-lcc .st{font-family:var(--f-mono);font-size:.66rem;font-weight:700;padding:.15rem .45rem;border-radius:5px}
.hs-lcc .st.met{background:var(--okbg);color:var(--ok-text)}.hs-lcc .st.part{background:var(--warnbg);color:var(--warn-text)}.hs-lcc .st.gap{background:var(--badbg);color:var(--bad-text)}

.hs-lcc .btn{display:inline-flex;align-items:center;gap:.45rem;font-weight:600;font-size:.85rem;padding:.6rem 1rem;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:all .18s;font-family:var(--f)}
.hs-lcc .btn svg{width:15px;height:15px}
.hs-lcc .btn-p{background:var(--brand);color:#fff}.hs-lcc .btn-p:hover{background:var(--bright)}
.hs-lcc .btn-g{background:transparent;border-color:var(--line);color:var(--text)}.hs-lcc .btn-g:hover{border-color:var(--brand);color:var(--bright)}
.hs-lcc .btn-sm{padding:.4rem .7rem;font-size:.78rem}

.hs-lcc .cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.hs-lcc .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:20px;transition:all .2s;box-shadow:var(--soft)}
.hs-lcc .card:hover{border-color:var(--line2);transform:translateY(-3px);box-shadow:0 12px 28px -18px rgba(15,30,46,.35)}
.hs-lcc .card .ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--brand) 16%,transparent);color:var(--brand);margin-bottom:.8rem}
.hs-lcc .card .ic svg{width:19px;height:19px}
.hs-lcc .card h4{font-size:1rem;font-weight:600;margin-bottom:.3rem}.hs-lcc .card p{font-size:.84rem;color:var(--mut)}

.hs-lcc .gw{display:flex;align-items:center;justify-content:space-between;gap:.6rem;background:var(--panel2);border:1px dashed var(--line2);border-radius:10px;padding:.65rem .85rem;font-family:var(--f-mono);font-size:.8rem}
.hs-lcc .gw span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-lcc .gw button{border:none;background:var(--brand);color:#fff;border-radius:7px;padding:.32rem .6rem;font-size:.7rem;font-weight:700;cursor:pointer;flex-shrink:0}
/* Static state tag for honest not-configured credential rows (no fake buttons). */
.hs-lcc .gw-tag{flex-shrink:0;font-size:.62rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut2);border:1px solid var(--line);border-radius:6px;padding:.14rem .4rem}
.hs-lcc .usebar{height:8px;border-radius:99px;background:var(--track);overflow:hidden;margin-top:.35rem}
.hs-lcc .usebar i{display:block;height:100%;background:linear-gradient(90deg,var(--peri),var(--lime));border-radius:99px}

/* Brain AI — the flagship surface: warm cream halo, the Doberman mark on the
   panel and on every analyst reply, quick-ask card on the Overview tab. */
.hs-lcc .brainhead{display:flex;align-items:center;gap:.5rem}
.hs-lcc .braincard{display:flex;flex-wrap:wrap;align-items:center;gap:16px;padding:16px 18px;background:linear-gradient(135deg,color-mix(in srgb,var(--cream) 60%,#fff),var(--panel) 65%)}
.hs-lcc .braincard .bc-copy{flex:1;min-width:220px}
.hs-lcc .braincard h3{font-family:var(--f-disp);font-size:1.05rem;font-weight:600}
.hs-lcc .braincard p{font-size:.8rem;color:var(--mut);margin-top:.15rem;line-height:1.45}
.hs-lcc .bchips{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}
.hs-lcc .bchips button{font-size:.74rem;border:1px solid var(--line2);background:var(--panel);color:var(--mut);border-radius:99px;padding:.35rem .7rem;cursor:pointer;transition:all .15s}
.hs-lcc .bchips button:hover{border-color:var(--orange);color:var(--orange);background:var(--orangebg)}
.hs-lcc .brain{display:flex;flex-direction:column;height:460px}
.hs-lcc .blog{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}
.hs-lcc .bub{max-width:80%;padding:.65rem .9rem;border-radius:13px;font-size:.86rem;line-height:1.5}
.hs-lcc .bub.u{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:4px}
.hs-lcc .bub.b{align-self:flex-start;background:var(--panel2);border:1px solid var(--line);border-bottom-left-radius:4px}
.hs-lcc .bub.b .bav{width:15px;height:auto;display:inline-block;vertical-align:-2px;margin-right:.4rem}
.hs-lcc .bub.b .src{display:block;margin-top:.4rem;font-family:var(--f-mono);font-size:.64rem;color:var(--mut2)}
.hs-lcc .chips{display:flex;gap:.4rem;flex-wrap:wrap;padding:0 14px 12px}
.hs-lcc .chips button{font-size:.74rem;border:1px solid var(--line);background:var(--panel2);color:var(--mut);border-radius:99px;padding:.3rem .6rem;cursor:pointer}
.hs-lcc .chips button:hover{border-color:var(--brand);color:var(--bright)}
.hs-lcc .bin{display:flex;gap:.5rem;padding:14px;border-top:1px solid var(--line)}
.hs-lcc .bin input{flex:1;min-width:0;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:.6rem .8rem;color:var(--text);font-family:var(--f);font-size:.88rem;outline:none}
.hs-lcc .bin input:focus{border-color:var(--brand)}

.hs-lcc .note{font-size:.78rem;color:var(--mut2);margin-top:14px}
.hs-lcc .burger{display:none}
.hs-lcc .top-brand{text-decoration:none}
.hs-lcc .top-brand img{height:26px;width:auto}

/* ── Branded hero identity band (Overview) — brand-forward welcome anchor.
   Status chips are Engines / Scan p50 / Regions so they COMPLEMENT (never
   duplicate) the SPRS/scanned/blocked/quarantine KPI tiles below. ── */
.hs-lcc .hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:1.2rem;flex-wrap:wrap;background:linear-gradient(120deg,color-mix(in srgb,var(--brand) 88%,#05121f),var(--brand) 46%,var(--bright));border:1px solid color-mix(in srgb,var(--brand) 40%,transparent);border-radius:var(--r);padding:20px 24px;margin-bottom:16px;box-shadow:0 8px 30px rgba(30,58,90,.14);color:#fff}
.hs-lcc .hero::before{content:"";position:absolute;right:-28px;top:-64px;width:230px;height:230px;background:url(/houndshield-logo.png) no-repeat center/contain;opacity:.10;filter:brightness(0) invert(1);pointer-events:none}
.hs-lcc .hero-l{display:flex;align-items:center;gap:1rem;z-index:1;min-width:0}
.hs-lcc .hero-logo{width:54px;height:54px;border-radius:15px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.34);display:grid;place-items:center;flex-shrink:0;box-shadow:0 6px 18px rgba(5,18,31,.26)}
.hs-lcc .hero-logo img{height:34px;width:auto;filter:brightness(0) invert(1);transition:transform .3s cubic-bezier(.22,.61,.36,1)}
.hs-lcc .hero-logo:hover img{transform:rotate(-8deg) scale(1.08)}
.hs-lcc .hero-org{font-family:var(--f-disp);font-size:1.5rem;font-weight:600;letter-spacing:-.01em;line-height:1.1}
.hs-lcc .hero-tag{font-size:.82rem;color:rgba(255,255,255,.85);margin-top:.2rem;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.hs-lcc .hero-tag .liv{display:inline-flex;align-items:center;gap:.35rem;font-family:var(--f-mono);font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;background:rgba(255,255,255,.16);padding:.16rem .5rem;border-radius:999px}
.hs-lcc .hero-tag .liv .dot{background:#c8f5df}
.hs-lcc .hero-r{display:flex;align-items:stretch;gap:.7rem;z-index:1;flex-wrap:wrap}
.hs-lcc .hero-metric{text-align:right;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:.55rem .85rem;min-width:92px}
/* Hero metrics are buttons too (click → data-source dialog). */
.hs-lcc button.hero-metric{font-family:var(--f);color:#fff;cursor:pointer;transition:border-color .15s,background .15s}
.hs-lcc button.hero-metric:hover{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.18)}
.hs-lcc button.hero-metric:focus-visible{outline:2px solid #fff;outline-offset:2px}
.hs-lcc .hero-metric b{font-family:var(--f-disp);font-size:1.55rem;font-weight:600;display:block;line-height:1;font-variant-numeric:tabular-nums}
.hs-lcc .hero-metric span{font-size:.64rem;color:rgba(255,255,255,.82);text-transform:uppercase;letter-spacing:.08em}
@media (prefers-reduced-motion: reduce){.hs-lcc .hero-logo img{transition:none}.hs-lcc .hero-logo:hover img{transform:none}}

/* ── Tablet & below: sidebar becomes an off-canvas drawer over a scrim.
   visibility (delayed until the slide-out finishes) removes the CLOSED drawer
   from the tab order and the accessibility tree — transform alone left ~11
   invisible controls keyboard-focusable off-screen. ── */
@media(max-width:1000px){
  .hs-lcc .shell{grid-template-columns:1fr}
  .hs-lcc .side{position:fixed;left:0;top:0;bottom:0;z-index:60;width:min(84vw,300px);height:100dvh;transform:translateX(-100%);visibility:hidden;transition:transform .25s ease,visibility 0s .25s;box-shadow:0 0 40px rgba(15,30,46,.22);padding-bottom:calc(16px + env(safe-area-inset-bottom))}
  .hs-lcc .side.open{transform:none;visibility:visible;transition:transform .25s ease,visibility 0s 0s}
  .hs-lcc .kpis{grid-template-columns:1fr 1fr}
  .hs-lcc .r-2-1,.hs-lcc .r-3-2{grid-template-columns:1fr}
  .hs-lcc .cards3{grid-template-columns:1fr 1fr}
  .hs-lcc .burger{display:inline-flex}
  .hs-lcc .top-brand{display:inline-flex}
}
/* ── Phones: comfortable touch targets, decluttered top bar, stacked donut ── */
@media(max-width:640px){
  .hs-lcc .top{padding:10px 14px;gap:.5rem}
  .hs-lcc .body{padding:14px 14px calc(48px + env(safe-area-inset-bottom))}
  .hs-lcc .hero{padding:16px;gap:.9rem}
  .hs-lcc .hero-org{font-size:1.25rem}
  .hs-lcc .hero-logo{width:46px;height:46px}
  .hs-lcc .hero-logo img{height:30px}
  .hs-lcc .hero-r{width:100%}
  .hs-lcc .hero-metric{flex:1;text-align:center;min-width:0}
  .hs-lcc .kpis{gap:10px}
  .hs-lcc .kpi{padding:13px 14px}
  .hs-lcc .kpi .n{font-size:1.5rem}
  .hs-lcc .top h1{font-size:1.08rem}
  .hs-lcc .crumb{display:none}
  .hs-lcc .top-right{gap:.5rem}
  .hs-lcc .top-right .clock{display:none}
  .hs-lcc .slink{padding:.72rem .75rem}
  .hs-lcc .donut-wrap{flex-direction:column;align-items:stretch}
  .hs-lcc .donut{margin:0 auto}
  .hs-lcc .feed-row{padding:.55rem 14px}
  .hs-lcc .feed-row .eng{display:none}
  .hs-lcc .cards3{grid-template-columns:1fr}
  .hs-lcc .bub{max-width:92%}
  /* Spine: stop sticking (top-bar height differs on mobile) and drop the
     boundary/extra segments so the chain + PDF CTA stay on one tidy line. */
  .hs-lcc .spine{position:static;padding:.5rem 14px}
  .hs-lcc .sep-hide{display:none}
  .hs-lcc .braincard{padding:14px}
  .hs-lcc .brain-mark{height:32px}
}
@media(max-width:400px){
  .hs-lcc .top-right .statpill{display:none}
}

/* ── Plan chip — lives inside the hero band's tag row (greet-by-name + plan). ── */
.hs-lcc .plan-chip{display:inline-flex;align-items:center;gap:.4rem;font-weight:700;font-size:.74rem;color:#fff;background:linear-gradient(135deg,var(--brand),var(--orange));border-radius:99px;padding:.28rem .7rem;box-shadow:0 4px 14px -6px var(--orange)}
.hs-lcc .plan-chip svg{width:13px;height:13px}

/* ── Plan & usage panel ── */
.hs-lcc .planbadge{display:inline-flex;align-items:center;gap:.35rem;font-size:.72rem;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--brand),var(--orange));border-radius:99px;padding:.2rem .6rem}
.hs-lcc .planbadge svg{width:12px;height:12px}
.hs-lcc .plan-tag{font-size:.8rem;color:var(--mut);margin-bottom:1rem}
.hs-lcc .usage-block{margin-bottom:1rem}
.hs-lcc .usage-row{display:flex;justify-content:space-between;font-size:.86rem;color:var(--mut)}
.hs-lcc .usage-row b{color:var(--text);font-family:var(--f-mono)}
.hs-lcc .topplan{display:flex;align-items:center;gap:.45rem;margin-top:16px;font-size:.82rem;font-weight:600;color:var(--ok-text);background:var(--okbg);border:1px solid color-mix(in srgb,var(--ok) 26%,transparent);border-radius:var(--r-sm);padding:.6rem .75rem}
.hs-lcc .topplan svg{width:15px;height:15px}

/* ── Feature grid (what your plan unlocks) ── */
.hs-lcc .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.5rem}
.hs-lcc .feat{display:flex;align-items:center;gap:.55rem;padding:.6rem .7rem;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--panel)}
.hs-lcc .feat.off{background:var(--panel2);opacity:.92}
.hs-lcc .feat-ic{width:16px;height:16px;flex-shrink:0}
.hs-lcc .feat-ic.ok{color:var(--ok)}
.hs-lcc .feat-ic.lk{color:var(--mut2)}
.hs-lcc .feat-name{flex:1;font-size:.82rem;font-weight:500;color:var(--text)}
.hs-lcc .feat.off .feat-name{color:var(--mut)}
.hs-lcc .feat-tag{font-family:var(--f-mono);font-size:.62rem;font-weight:700;padding:.1rem .4rem;border-radius:5px}
.hs-lcc .feat-tag.inc{color:var(--ok-text);background:var(--okbg)}
.hs-lcc .feat-tag.lock{color:var(--orange-text);background:var(--orangebg)}

/* ── Brain AI budget meter + typing indicator ── */
.hs-lcc .brain-budget{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;padding:.55rem .8rem;background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-sm);margin:0 0 .7rem}
.hs-lcc .bb-label{display:inline-flex;align-items:center;gap:.35rem;font-size:.74rem;font-weight:700;color:var(--brand)}
.hs-lcc .bb-label svg{width:13px;height:13px;color:var(--orange)}
.hs-lcc .bb-meter{flex:1;min-width:120px;height:7px;border-radius:99px;background:var(--track);overflow:hidden}
.hs-lcc .bb-meter i{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--orange));border-radius:99px;transition:width .4s ease}
.hs-lcc .bb-count{font-family:var(--f-mono);font-size:.68rem;color:var(--mut2)}
.hs-lcc .bub.typing{display:inline-flex;gap:4px;align-items:center;padding:.7rem .9rem}
.hs-lcc .bub.typing .tdot{width:6px;height:6px;border-radius:50%;background:var(--mut2);animation:lcc-typing 1.1s infinite ease-in-out}
.hs-lcc .bub.typing .tdot:nth-child(2){animation-delay:.18s}
.hs-lcc .bub.typing .tdot:nth-child(3){animation-delay:.36s}
@keyframes lcc-typing{0%,60%,100%{opacity:.28;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}

/* ── Overview analytics row (OverviewCharts) — small self-explanatory charts.
   Colors are dataviz-validated on the light panel surface; identity always
   carries a direct label, never color alone. ── */
.hs-lcc .ph-sub{padding:8px 18px 0;font-size:.76rem;line-height:1.45;color:var(--mut2)}
.hs-lcc .ovc-svg{width:100%;height:auto;display:block}
.hs-lcc .ovc-axis{font-family:var(--f-mono);font-size:9px;fill:var(--mut2)}
.hs-lcc .ovc-num{font-family:var(--f-mono);font-size:11px;font-weight:700;fill:var(--text)}
.hs-lcc .ovc-legend{display:flex;gap:1.1rem;flex-wrap:wrap;margin-top:.55rem;font-size:.74rem;color:var(--mut)}
.hs-lcc .ovc-legend span{display:inline-flex;align-items:center;gap:.4rem}
.hs-lcc .ovc-legend i{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.hs-lcc .ovc-legend .ovc-dash{width:14px;height:0;border-top:2px dashed #0E9F6E;border-radius:0}
.hs-lcc .ovc-hrow{display:grid;grid-template-columns:64px 1fr 42px;align-items:center;gap:.6rem;padding:.34rem 0}
.hs-lcc .ovc-hlab{font-size:.8rem;color:var(--mut)}
.hs-lcc .ovc-htrack{height:12px;border-radius:6px;background:var(--track);overflow:hidden}
.hs-lcc .ovc-htrack i{display:block;height:100%;border-radius:6px;transition:width .8s ease}
.hs-lcc .ovc-hval{font-family:var(--f-mono);font-size:.74rem;color:var(--text);text-align:right}
.hs-lcc .ovc-stack{display:flex;gap:2px;height:16px;border-radius:8px;overflow:hidden}
.hs-lcc .ovc-stack i{display:block;height:100%;min-width:6px}
.hs-lcc .ovc-risk-legend{display:grid;grid-template-columns:1fr 1fr;gap:.5rem .9rem;margin-top:.7rem}
.hs-lcc .ovc-risk-legend > div{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:.15rem .5rem}
.hs-lcc .ovc-risk-name{display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;font-weight:600;color:var(--text)}
.hs-lcc .ovc-risk-name i{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.hs-lcc .ovc-risk-legend b{font-family:var(--f-mono);font-size:.76rem;color:var(--text)}
.hs-lcc .ovc-risk-legend small{grid-column:1 / -1;font-size:.68rem;color:var(--mut2)}
@media(max-width:640px){.hs-lcc .ovc-risk-legend{grid-template-columns:1fr}}

/* ── Data provenance — "where does this number come from?" ──
   Source chips: the existing panel-header labels (sample / demo / your
   assessment) become real buttons that open the provenance dialog. A chip
   rendered without a handler stays a plain span (no fake affordance). */
.hs-lcc .src-chip{background:none;border:none;cursor:pointer;text-decoration:underline dotted color-mix(in srgb,currentColor 55%,transparent);text-underline-offset:3px;transition:color .15s}
.hs-lcc .src-chip:hover{color:var(--brand)}
.hs-lcc .live-tag.src-chip:hover{color:var(--ok-text);text-decoration-color:var(--ok-text)}
.hs-lcc .src-chip:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:4px}
.hs-lcc .ops-src{font-family:var(--f-mono);font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut2);margin-left:auto}
/* Feed rows open the feed's provenance on click. */
.hs-lcc #feed .feed-row,.hs-lcc #feedFull .feed-row{cursor:pointer}
.hs-lcc #feed .feed-row:hover,.hs-lcc #feedFull .feed-row:hover{background:var(--hover)}

/* The provenance dialog itself — Steel & Cream, mobile-safe, one scroll. */
.hs-lcc .prov-overlay{position:fixed;inset:0;z-index:80;background:rgba(15,30,46,.5);backdrop-filter:blur(3px);display:grid;place-items:center;padding:18px;padding-bottom:calc(18px + env(safe-area-inset-bottom))}
.hs-lcc .prov-card{width:min(560px,100%);max-height:min(84dvh,720px);overflow-y:auto;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 24px 60px -24px rgba(15,30,46,.45);animation:lccFade .22s ease}
.hs-lcc .prov-head{display:flex;align-items:flex-start;gap:.7rem;padding:16px 18px 12px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,color-mix(in srgb,var(--brand) 5%,transparent),transparent)}
.hs-lcc .prov-ic{width:18px;height:18px;color:var(--brand);flex-shrink:0;margin-top:.2rem}
.hs-lcc .prov-head-txt{flex:1;min-width:0}
.hs-lcc .prov-head h2{font-family:var(--f-disp);font-size:1.08rem;font-weight:600;line-height:1.25}
.hs-lcc .prov-kind{display:inline-block;margin-top:.35rem;font-family:var(--f-mono);font-size:.64rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:.2rem .55rem}
.hs-lcc .prov-kind.k-simulated{color:var(--orange-text);background:var(--orangebg);border:1px solid color-mix(in srgb,var(--orange) 30%,transparent)}
.hs-lcc .prov-kind.k-on-device{color:var(--ok-text);background:var(--okbg);border:1px solid color-mix(in srgb,var(--ok) 28%,transparent)}
.hs-lcc .prov-kind.k-account{color:var(--brand);background:color-mix(in srgb,var(--brand) 12%,transparent);border:1px solid color-mix(in srgb,var(--brand) 30%,transparent)}
.hs-lcc .prov-kind.k-product{color:var(--mut);background:var(--panel2);border:1px solid var(--line)}
.hs-lcc .prov-close{flex-shrink:0;width:30px;height:30px;display:grid;place-items:center;background:none;border:1px solid var(--line);border-radius:8px;color:var(--mut);cursor:pointer;transition:all .15s}
.hs-lcc .prov-close:hover{border-color:var(--brand);color:var(--brand)}
.hs-lcc .prov-close:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.hs-lcc .prov-close svg{width:15px;height:15px}
.hs-lcc .prov-blurb{padding:12px 18px 0;font-size:.8rem;line-height:1.5;color:var(--mut)}
.hs-lcc .prov-rows{padding:6px 18px 4px;display:flex;flex-direction:column}
.hs-lcc .prov-row{padding:.75rem 0;border-bottom:1px solid var(--line)}
.hs-lcc .prov-row:last-child{border:none}
.hs-lcc .prov-row h3{font-family:var(--f-mono);font-size:.64rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mut2);margin-bottom:.3rem}
.hs-lcc .prov-row p{font-size:.86rem;line-height:1.55;color:var(--text)}
.hs-lcc .prov-live{background:color-mix(in srgb,var(--cream) 40%,transparent);border-radius:var(--r-sm);padding:.75rem .8rem;margin:.4rem 0;border-bottom:none}
.hs-lcc .prov-live .btn{margin-top:.65rem}
.hs-lcc .prov-foot{padding:10px 18px 16px;font-size:.72rem;line-height:1.5;color:var(--mut2);border-top:1px solid var(--line)}

@media (prefers-reduced-motion: reduce){
  .hs-lcc .brand img,.hs-lcc .brain-mark{animation:none;transition:none}
  .hs-lcc .prov-card{animation:none}
  .hs-lcc .brand:hover img,.hs-lcc .brand img:hover,.hs-lcc .brain-mark:hover{animation:none;transform:rotate(-8deg) scale(1.08)}
  .hs-lcc .side,.hs-lcc .scrim{transition:none}
  .hs-lcc .atab.on{animation:none}
  .hs-lcc .bub.typing .tdot{animation:none}
  .hs-lcc .bb-meter i{transition:none}
  /* The highest-frequency motion: KPI bump (re-added every ~1.2s), feed-row
     flash (every 2.1s), and the infinite pulsing live dots. */
  .hs-lcc .bump,.hs-lcc .feed-row.fresh,.hs-lcc .dot{animation:none}
}
`
