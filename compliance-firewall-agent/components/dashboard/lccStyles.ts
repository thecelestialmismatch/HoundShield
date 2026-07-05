/**
 * Live Command Center — scoped styles for the after-login dashboard.
 * Every selector is namespaced under `.hs-lcc` and keyframes are renamed
 * (lcc*) so nothing leaks into the rest of the app.
 *
 * Fonts: reference the app's next/font CSS variables (--font-display /
 * --font-body / --font-mono) so the dashboard renders in the real brand
 * families (Fraunces / DM Sans / JetBrains Mono). Literal family names
 * ('Fraunces', 'DM Sans') are NOT registered by next/font — it hashes them —
 * so referencing them directly silently fell back to serif / system-ui. The
 * var() references pick up whatever the app actually loaded, with literal
 * fallbacks kept as a belt-and-braces last resort.
 *
 * Responsive: desktop grid ≥1001px → off-canvas sidebar + backdrop ≤1000px →
 * condensed single-column phone layout ≤640px, with 100dvh + safe-area insets
 * so it sits correctly under mobile browser chrome and notches.
 */
export const LCC_CSS = `
.hs-lcc{
  /* Light Steel & Cream palette, mapped onto the site's --hs-* tokens with
     fallbacks so the console is self-sufficient. */
  --bg: var(--hs-surface-1, #EEF3F9);
  --bg2: var(--hs-surface-0, #FAFCFF);
  --panel: var(--hs-surface-0, #FFFFFF);
  --panel2: var(--hs-surface-1, #F1F6FB);
  --hover: var(--hs-mist-md, rgba(129,166,198,.12));
  --line: var(--hs-border-ink, rgba(15,30,46,.10));
  --line2: var(--hs-border, rgba(129,166,198,.34));
  --text: var(--hs-ink, #0F1E2E);
  --mut: var(--hs-ink-secondary, #3D5166);
  --mut2: var(--hs-ink-tertiary, #6B8299);
  --brand: var(--hs-steel-dark, #5A86A8);
  --bright: var(--hs-steel, #81A6C6);
  --sky: var(--hs-sky, #A9C9E4);
  --cream: var(--hs-cream, #F3E3D0);
  --cream-deep: var(--hs-cream-deep, #EDD5BC);
  --track: rgba(15,30,46,.07);
  --ok:#0E9F6E; --okbg:rgba(14,159,110,.12);
  --bad:#E5484D; --badbg:rgba(229,72,77,.12);
  --warn:#D9870B; --warnbg:rgba(217,135,11,.12);
  --orange:#E07B39; --orangebg:rgba(224,123,57,.12);
  --violet:#7C6CD9; --violetbg:rgba(124,108,217,.12);
  --grad-brand:linear-gradient(135deg,var(--brand),var(--bright));
  --grad-head:linear-gradient(90deg,var(--brand),var(--bright) 55%,var(--cream-deep));
  --shadow:0 1px 2px rgba(15,30,46,.04),0 4px 16px rgba(15,30,46,.05);
  --shadow-lg:0 8px 30px rgba(30,58,90,.12);
  --f-disp: var(--font-display, 'Fraunces', Georgia, 'Times New Roman', serif);
  --f: var(--font-body, 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif);
  --f-mono: var(--font-mono, 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace);
  --r:16px; --r-sm:11px;
  font-family:var(--f);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.hs-lcc *{margin:0;padding:0;box-sizing:border-box}
.hs-lcc .mono{font-family:var(--f-mono)}
.hs-lcc .shell{display:grid;grid-template-columns:252px 1fr;min-height:100vh;min-height:100dvh}

/* backdrop shown behind the off-canvas sidebar on small screens */
.hs-lcc .side-backdrop{display:none;position:fixed;inset:0;z-index:55;background:rgba(10,20,32,.44);backdrop-filter:blur(2px);border:none;cursor:pointer}
.hs-lcc .side-backdrop.show{display:block;animation:lccFade .2s ease}

.hs-lcc .side{background:linear-gradient(180deg,var(--panel2),var(--bg));border-right:1px solid var(--line);display:flex;flex-direction:column;padding:16px 12px calc(16px + env(safe-area-inset-bottom));position:sticky;top:0;height:100vh;height:100dvh;overflow:auto}
.hs-lcc .brand{display:flex;align-items:center;gap:.55rem;padding:.4rem .5rem 1.1rem}
.hs-lcc .brand img{height:32px;width:auto;mix-blend-mode:multiply;transition:transform .3s cubic-bezier(.22,.61,.36,1);transform-origin:center;animation:hs-logo-idle 4.5s ease-in-out infinite}
.hs-lcc .brand:hover img,.hs-lcc .brand img:hover,.hs-lcc .brand:active img,.hs-lcc .brand img:active{animation:none;transform:rotate(-8deg) scale(1.08)}
@media (prefers-reduced-motion: reduce){.hs-lcc .brand img{animation:none;transition:none}.hs-lcc .brand:hover img,.hs-lcc .brand img:hover{animation:none}}
.hs-lcc .brand span{font-family:var(--f-disp);font-weight:600;font-size:1.22rem;letter-spacing:-.01em}
.hs-lcc .brand span b{background:var(--grad-brand);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hs-lcc .gh{font-family:var(--f-mono);font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mut2);margin:1.1rem .6rem .4rem}
.hs-lcc .slink{display:flex;align-items:center;gap:.65rem;padding:.62rem .7rem;border-radius:var(--r-sm);font-size:.88rem;font-weight:500;color:var(--mut);cursor:pointer;transition:all .16s;position:relative;width:100%;text-align:left;background:none;border:none;font-family:var(--f)}
.hs-lcc .slink svg{width:17px;height:17px;flex-shrink:0}
.hs-lcc .slink:hover{background:var(--hover);color:var(--text)}
.hs-lcc .slink.on{background:color-mix(in srgb,var(--brand) 13%,transparent);color:var(--brand);font-weight:600}
.hs-lcc .slink.on::before{content:"";position:absolute;left:-12px;top:7px;bottom:7px;width:3px;border-radius:0 3px 3px 0;background:var(--grad-brand)}
.hs-lcc .slink .pp{margin-left:auto;font-family:var(--f-mono);font-size:.62rem;font-weight:700;background:var(--badbg);color:var(--bad);padding:.05rem .38rem;border-radius:6px;min-width:20px;text-align:center}
.hs-lcc .side-foot{margin-top:auto;padding:.75rem;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--panel);box-shadow:var(--shadow);display:flex;align-items:center;gap:.6rem}
.hs-lcc .av{width:36px;height:36px;border-radius:10px;background:var(--grad-brand);color:#fff;display:grid;place-items:center;font-weight:700;font-size:.82rem;flex-shrink:0;box-shadow:0 2px 8px color-mix(in srgb,var(--brand) 40%,transparent)}
.hs-lcc .side-foot .nm{font-size:.84rem;font-weight:600}.hs-lcc .side-foot .sub{font-size:.72rem;color:var(--mut2)}
.hs-lcc .side-link{display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;border-radius:var(--r-sm);font-size:.84rem;font-weight:500;color:var(--mut);text-decoration:none;transition:all .15s}
.hs-lcc .side-link:hover{background:var(--hover);color:var(--brand)}
.hs-lcc .side-link svg{width:16px;height:16px}

.hs-lcc .main{overflow:auto;height:100vh;height:100dvh;position:relative}
.hs-lcc .main::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(1100px 460px at 82% -8%,color-mix(in srgb,var(--bright) 14%,transparent),transparent 60%),radial-gradient(900px 420px at -6% 4%,color-mix(in srgb,var(--cream) 30%,transparent),transparent 58%)}
.hs-lcc .top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg2) 82%,transparent);backdrop-filter:blur(16px) saturate(1.2);border-bottom:1px solid var(--line);padding:14px 26px;padding-top:calc(14px + env(safe-area-inset-top));display:flex;align-items:center;justify-content:space-between;gap:1rem}
.hs-lcc .top h1{font-family:var(--f-disp);font-size:1.42rem;font-weight:600;letter-spacing:-.01em;line-height:1.1}
.hs-lcc .top .crumb{font-size:.72rem;color:var(--mut2);font-family:var(--f-mono);letter-spacing:.02em}
.hs-lcc .top-right{display:flex;align-items:center;gap:.75rem}
.hs-lcc .clock{font-family:var(--f-mono);font-size:.82rem;color:var(--mut);background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:.4rem .7rem;box-shadow:var(--shadow)}
.hs-lcc .statpill{display:inline-flex;align-items:center;gap:.45rem;font-size:.76rem;font-weight:600;color:var(--ok);background:var(--okbg);border:1px solid color-mix(in srgb,var(--ok) 30%,transparent);border-radius:999px;padding:.38rem .72rem;white-space:nowrap}
.hs-lcc .dot{width:7px;height:7px;border-radius:50%;background:var(--ok);animation:lccPulse 1.8s infinite;flex-shrink:0}
.hs-lcc .dot.b{background:var(--brand)}
@keyframes lccPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 60%,transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}

.hs-lcc .body{padding:24px 26px calc(60px + env(safe-area-inset-bottom));position:relative;z-index:1}
.hs-lcc .atab{display:none}.hs-lcc .atab.on{display:block;animation:lccFade .35s ease}
@keyframes lccFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.hs-lcc .atab.on,.hs-lcc .side-backdrop.show{animation:none}}

.hs-lcc .ops{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;background:linear-gradient(100deg,var(--panel),color-mix(in srgb,var(--okbg) 40%,var(--panel)));border:1px solid var(--line);border-radius:var(--r);padding:.75rem 16px;font-size:.84rem;color:var(--mut);margin-bottom:18px;box-shadow:var(--shadow)}
.hs-lcc .ops b{color:var(--text);font-family:var(--f-mono);font-weight:600}
.hs-lcc .ops .sep{color:var(--mut2)}

.hs-lcc .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.hs-lcc .kpi{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:17px 18px;transition:transform .2s,box-shadow .2s,border-color .2s;box-shadow:var(--shadow);overflow:hidden}
.hs-lcc .kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--brand);opacity:.9}
.hs-lcc .kpi::after{content:"";position:absolute;right:-30px;top:-30px;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--brand) 12%,transparent),transparent 70%);pointer-events:none}
.hs-lcc .kpi:nth-child(2)::before{background:var(--bad)}.hs-lcc .kpi:nth-child(2)::after{background:radial-gradient(circle,color-mix(in srgb,var(--bad) 12%,transparent),transparent 70%)}
.hs-lcc .kpi:nth-child(3)::before{background:var(--ok)}.hs-lcc .kpi:nth-child(3)::after{background:radial-gradient(circle,color-mix(in srgb,var(--ok) 12%,transparent),transparent 70%)}
.hs-lcc .kpi:nth-child(4)::before{background:var(--warn)}.hs-lcc .kpi:nth-child(4)::after{background:radial-gradient(circle,color-mix(in srgb,var(--warn) 14%,transparent),transparent 70%)}
.hs-lcc .kpi:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:var(--line2)}
.hs-lcc .kpi .l{font-size:.76rem;color:var(--mut2);display:flex;align-items:center;gap:.4rem;font-weight:500}
.hs-lcc .kpi .l svg{width:14px;height:14px;color:var(--brand)}
.hs-lcc .kpi:nth-child(2) .l svg{color:var(--bad)}.hs-lcc .kpi:nth-child(3) .l svg{color:var(--ok)}.hs-lcc .kpi:nth-child(4) .l svg{color:var(--warn)}
.hs-lcc .kpi .n{font-family:var(--f-disp);font-size:2rem;font-weight:600;margin-top:.32rem;font-variant-numeric:tabular-nums;letter-spacing:-.02em;line-height:1}
.hs-lcc .kpi .d{font-size:.73rem;margin-top:.28rem;color:var(--mut)}
.hs-lcc .kpi .d.up{color:var(--ok);font-weight:600}.hs-lcc .kpi .d.dn{color:var(--bad);font-weight:600}
.hs-lcc .bump{animation:lccBump .45s ease}@keyframes lccBump{0%{transform:translateY(2px);opacity:.55}100%{transform:none;opacity:1}}

.hs-lcc .row{display:grid;gap:16px;margin-bottom:16px}
.hs-lcc .r-2-1{grid-template-columns:1.55fr 1fr}
.hs-lcc .r-3-2{grid-template-columns:1.45fr 1fr}
.hs-lcc .panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow)}
.hs-lcc .ph{position:relative;padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:.75rem}
.hs-lcc .ph::after{content:"";position:absolute;left:0;bottom:-1px;width:56px;height:2px;background:var(--grad-head);border-radius:2px}
.hs-lcc .ph h3{font-size:.98rem;font-weight:600;letter-spacing:-.01em}
.hs-lcc .ph .mono{font-size:.7rem;color:var(--mut2)}
.hs-lcc .live-tag{display:inline-flex;align-items:center;gap:.35rem;font-family:var(--f-mono);font-size:.66rem;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.hs-lcc .pad{padding:16px 18px}

.hs-lcc #thru{width:100%;height:170px;display:block}

.hs-lcc .donut-wrap{display:flex;align-items:center;gap:18px;padding:20px}
.hs-lcc .donut{width:132px;height:132px;border-radius:50%;position:relative;flex-shrink:0;transition:background .8s ease;filter:drop-shadow(0 6px 14px rgba(30,58,90,.14))}
.hs-lcc .donut::after{content:"";position:absolute;inset:18px;border-radius:50%;background:var(--panel)}
.hs-lcc .donut .c{position:absolute;inset:0;display:grid;place-content:center;text-align:center;z-index:2}
.hs-lcc .donut .c b{font-family:var(--f-disp);font-size:1.55rem;font-weight:600;font-variant-numeric:tabular-nums}
.hs-lcc .donut .c span{font-size:.66rem;color:var(--mut2)}
.hs-lcc .legend{display:flex;flex-direction:column;gap:.55rem;font-size:.82rem;flex:1;min-width:0}
.hs-lcc .legend div{display:flex;align-items:center;gap:.5rem}
.hs-lcc .legend i{width:11px;height:11px;border-radius:4px;flex-shrink:0}
.hs-lcc .legend .v{margin-left:auto;font-family:var(--f-mono);color:var(--text);font-weight:600}

.hs-lcc .feed-row{display:flex;align-items:center;gap:.7rem;padding:.62rem 18px;border-bottom:1px solid var(--line);font-size:.83rem}
.hs-lcc .feed-row:last-child{border:none}
.hs-lcc .feed-row .tag{font-family:var(--f-mono);font-size:.62rem;font-weight:700;padding:.2rem .45rem;border-radius:6px;width:66px;text-align:center;flex-shrink:0;letter-spacing:.02em}
.hs-lcc .tag.block{background:var(--badbg);color:var(--bad)}.hs-lcc .tag.pass{background:var(--okbg);color:var(--ok)}.hs-lcc .tag.quar{background:var(--warnbg);color:var(--warn)}
.hs-lcc .feed-row .what{flex:1;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.hs-lcc .feed-row .eng{display:inline-block;font-family:var(--f-mono);font-size:.66rem;color:var(--mut2);background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:.1rem .4rem;flex-shrink:0}
.hs-lcc .feed-row .lat{font-family:var(--f-mono);font-size:.7rem;color:var(--mut2);width:42px;text-align:right;flex-shrink:0}
.hs-lcc .feed-row.fresh{animation:lccFresh 1.4s ease}
@keyframes lccFresh{0%{background:color-mix(in srgb,var(--brand) 16%,transparent)}100%{background:transparent}}

.hs-lcc .pad .eng{display:grid;grid-template-columns:104px 1fr 40px;align-items:center;gap:12px;padding:.42rem 0;font-size:.82rem;color:var(--mut)}
.hs-lcc .bar{height:9px;border-radius:99px;background:var(--track);overflow:hidden}
.hs-lcc .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--bright),var(--orange));border-radius:99px;transition:width .8s ease;box-shadow:0 0 8px color-mix(in srgb,var(--bright) 50%,transparent)}
.hs-lcc .pad .eng b{text-align:right;font-family:var(--f-mono);color:var(--text);font-weight:600}

.hs-lcc .sprs{display:flex;flex-direction:column;align-items:center;padding:20px}
.hs-lcc .ring{width:152px;height:152px;border-radius:50%;display:grid;place-items:center;position:relative;transition:background .8s ease;filter:drop-shadow(0 6px 16px rgba(30,58,90,.16))}
.hs-lcc .ring::before{content:"";position:absolute;inset:13px;border-radius:50%;background:var(--panel)}
.hs-lcc .ring b{position:relative;font-family:var(--f-disp);font-size:2.4rem;font-weight:600;font-variant-numeric:tabular-nums;background:var(--grad-brand);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hs-lcc .ring small{position:relative;display:block;text-align:center;font-size:.64rem;color:var(--mut2);margin-top:-4px}
.hs-lcc .cap{font-size:.8rem;color:var(--mut);text-align:center;margin-top:.8rem;line-height:1.55}

.hs-lcc .crow{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.62rem 18px;border-bottom:1px solid var(--line);font-size:.84rem}
.hs-lcc .crow:last-child{border:none}
.hs-lcc .crow:hover{background:var(--hover)}
.hs-lcc .st{font-family:var(--f-mono);font-size:.66rem;font-weight:700;padding:.16rem .48rem;border-radius:6px;white-space:nowrap;flex-shrink:0}
.hs-lcc .st.met{background:var(--okbg);color:var(--ok)}.hs-lcc .st.part{background:var(--warnbg);color:var(--warn)}.hs-lcc .st.gap{background:var(--badbg);color:var(--bad)}

.hs-lcc .btn{display:inline-flex;align-items:center;gap:.45rem;font-weight:600;font-size:.85rem;padding:.62rem 1rem;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:all .18s;font-family:var(--f);text-decoration:none}
.hs-lcc .btn svg{width:15px;height:15px}
.hs-lcc .btn-p{background:var(--grad-brand);color:#fff;box-shadow:0 4px 14px color-mix(in srgb,var(--brand) 34%,transparent)}
.hs-lcc .btn-p:hover{filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 6px 18px color-mix(in srgb,var(--brand) 42%,transparent)}
.hs-lcc .btn-g{background:var(--panel);border-color:var(--line);color:var(--text)}.hs-lcc .btn-g:hover{border-color:var(--brand);color:var(--brand)}
.hs-lcc .btn-sm{padding:.42rem .72rem;font-size:.78rem}

.hs-lcc .cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.hs-lcc .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:20px;transition:all .22s;box-shadow:var(--shadow)}
.hs-lcc .card:hover{border-color:var(--line2);transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.hs-lcc .card .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--grad-brand);color:#fff;margin-bottom:.85rem;box-shadow:0 3px 10px color-mix(in srgb,var(--brand) 34%,transparent)}
.hs-lcc .card .ic svg{width:20px;height:20px}
.hs-lcc .card h4{font-size:1rem;font-weight:600;margin-bottom:.3rem}.hs-lcc .card p{font-size:.84rem;color:var(--mut);line-height:1.55}

.hs-lcc .gw{display:flex;align-items:center;justify-content:space-between;gap:.6rem;background:var(--panel2);border:1px dashed var(--line2);border-radius:10px;padding:.65rem .85rem;font-family:var(--f-mono);font-size:.8rem;overflow:hidden}
.hs-lcc .gw span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-lcc .gw button{border:none;background:var(--brand);color:#fff;border-radius:8px;padding:.34rem .62rem;font-size:.7rem;font-weight:700;cursor:pointer;flex-shrink:0;transition:filter .15s}
.hs-lcc .gw button:hover{filter:brightness(1.08)}
.hs-lcc .usebar{height:9px;border-radius:99px;background:var(--track);overflow:hidden;margin-top:.4rem}
.hs-lcc .usebar i{display:block;height:100%;background:var(--grad-brand);border-radius:99px;transition:width .8s ease}

.hs-lcc .brain{display:flex;flex-direction:column;height:min(64vh,480px)}
.hs-lcc .blog{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
.hs-lcc .bub{max-width:82%;padding:.68rem .95rem;border-radius:15px;font-size:.86rem;line-height:1.55;position:relative;box-shadow:0 1px 3px rgba(15,30,46,.06)}
.hs-lcc .bub.u{align-self:flex-end;background:var(--grad-brand);color:#fff;border-bottom-right-radius:5px}
.hs-lcc .bub.b{align-self:flex-start;background:var(--panel2);border:1px solid var(--line);border-bottom-left-radius:5px}
.hs-lcc .bub.b b{color:var(--brand)}
.hs-lcc .bub.b .src{display:block;margin-top:.45rem;font-family:var(--f-mono);font-size:.62rem;color:var(--mut2);letter-spacing:.02em}
.hs-lcc .bub.typing{display:inline-flex;gap:5px;align-items:center;padding:.75rem .95rem}
.hs-lcc .bub.typing i{width:7px;height:7px;border-radius:50%;background:var(--mut2);display:inline-block;animation:lccBlink 1.2s infinite ease-in-out}
.hs-lcc .bub.typing i:nth-child(2){animation-delay:.18s}.hs-lcc .bub.typing i:nth-child(3){animation-delay:.36s}
@keyframes lccBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.hs-lcc .chips{display:flex;gap:.4rem;flex-wrap:wrap;padding:0 14px 12px}
.hs-lcc .chips button{font-size:.74rem;border:1px solid var(--line);background:var(--panel2);color:var(--mut);border-radius:99px;padding:.32rem .66rem;cursor:pointer;transition:all .15s;font-family:var(--f)}
.hs-lcc .chips button:hover{border-color:var(--brand);color:var(--brand);background:color-mix(in srgb,var(--brand) 8%,var(--panel2))}
.hs-lcc .bin{display:flex;gap:.5rem;padding:14px}
.hs-lcc .bin input{flex:1;min-width:0;background:var(--panel2);border:1px solid var(--line);border-radius:11px;padding:.65rem .85rem;color:var(--text);font-family:var(--f);font-size:.9rem;outline:none;transition:border-color .15s,box-shadow .15s}
.hs-lcc .bin input:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 16%,transparent)}
.hs-lcc .brain-trust{display:flex;align-items:center;gap:.5rem;padding:.6rem 18px;font-size:.72rem;color:var(--mut2);border-top:1px solid var(--line);background:var(--panel2)}
.hs-lcc .brain-trust svg{width:13px;height:13px;color:var(--ok);flex-shrink:0}

.hs-lcc .note{font-size:.78rem;color:var(--mut2);margin-top:14px}
.hs-lcc .burger{display:none}

/* ── Branded hero command band (Overview) ── */
.hs-lcc .hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:1.2rem;flex-wrap:wrap;background:linear-gradient(120deg,color-mix(in srgb,var(--brand) 88%,#05121f),var(--brand) 44%,var(--bright) 96%);border:1px solid color-mix(in srgb,var(--brand) 40%,transparent);border-radius:var(--r);padding:22px 26px;margin-bottom:16px;box-shadow:var(--shadow-lg);color:#fff}
.hs-lcc .hero::before{content:"";position:absolute;right:-30px;top:-70px;width:250px;height:250px;background:url(/houndshield-logo.png) no-repeat center/contain;opacity:.10;filter:brightness(0) invert(1);pointer-events:none}
.hs-lcc .hero::after{content:"";position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(700px 200px at 12% 120%,rgba(255,255,255,.18),transparent 70%);pointer-events:none}
.hs-lcc .hero-l{display:flex;align-items:center;gap:1rem;z-index:1;min-width:0}
.hs-lcc .hero-logo{width:56px;height:56px;border-radius:15px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.34);display:grid;place-items:center;flex-shrink:0;box-shadow:0 6px 18px rgba(5,18,31,.28)}
.hs-lcc .hero-logo img{height:36px;width:auto;filter:brightness(0) invert(1);transition:transform .3s cubic-bezier(.22,.61,.36,1)}
.hs-lcc .hero-logo:hover img{transform:rotate(-8deg) scale(1.08)}
@media (prefers-reduced-motion: reduce){.hs-lcc .hero-logo img{transition:none}.hs-lcc .hero-logo:hover img{transform:none}}
.hs-lcc .hero-org{font-family:var(--f-disp);font-size:1.55rem;font-weight:600;letter-spacing:-.01em;line-height:1.1}
.hs-lcc .hero-tag{font-size:.82rem;color:rgba(255,255,255,.84);margin-top:.2rem;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.hs-lcc .hero-tag .liv{display:inline-flex;align-items:center;gap:.35rem;font-family:var(--f-mono);font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;background:rgba(255,255,255,.16);padding:.16rem .5rem;border-radius:999px}
.hs-lcc .hero-tag .liv .dot{background:#c8f5df}
.hs-lcc .hero-r{display:flex;align-items:stretch;gap:.7rem;z-index:1;flex-wrap:wrap}
.hs-lcc .hero-metric{text-align:right;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:.6rem .9rem;min-width:104px}
.hs-lcc .hero-metric b{font-family:var(--f-disp);font-size:1.7rem;font-weight:600;display:block;line-height:1;font-variant-numeric:tabular-nums}
.hs-lcc .hero-metric span{font-size:.66rem;color:rgba(255,255,255,.82);text-transform:uppercase;letter-spacing:.08em}

/* ── Topbar brand mark (esp. for mobile, where the sidebar is off-canvas) ── */
.hs-lcc .top-logo{height:26px;width:auto;mix-blend-mode:multiply;flex-shrink:0;transition:transform .3s cubic-bezier(.22,.61,.36,1)}
.hs-lcc .top-logo:hover{transform:rotate(-8deg) scale(1.08)}

/* ── Brain AI branding ── */
.hs-lcc .brain-logo{width:26px;height:26px;border-radius:8px;background:var(--grad-brand);display:inline-grid;place-items:center;vertical-align:-7px;margin-right:.15rem;box-shadow:0 2px 7px color-mix(in srgb,var(--brand) 40%,transparent)}
.hs-lcc .brain-logo img{width:17px;height:auto;filter:brightness(0) invert(1);transition:transform .3s cubic-bezier(.22,.61,.36,1)}
.hs-lcc .brain-logo:hover img{transform:rotate(-8deg) scale(1.08)}
.hs-lcc .brow{display:flex;gap:.55rem;align-items:flex-start;align-self:flex-start;max-width:86%}
.hs-lcc .ava-mini{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:grid;place-items:center;background:var(--grad-brand);box-shadow:0 2px 7px color-mix(in srgb,var(--brand) 40%,transparent);margin-top:1px}
.hs-lcc .ava-mini img{width:19px;height:auto;filter:brightness(0) invert(1);transition:transform .3s cubic-bezier(.22,.61,.36,1)}
.hs-lcc .ava-mini:hover img{transform:rotate(-8deg) scale(1.08)}
@media (prefers-reduced-motion: reduce){.hs-lcc .top-logo,.hs-lcc .brain-logo img,.hs-lcc .ava-mini img{transition:none}.hs-lcc .top-logo:hover,.hs-lcc .brain-logo:hover img,.hs-lcc .ava-mini:hover img{transform:none}}

/* ── Tablet / small-laptop: off-canvas sidebar ── */
@media(max-width:1000px){
  .hs-lcc .shell{grid-template-columns:1fr}
  .hs-lcc .side{position:fixed;left:0;top:0;bottom:0;z-index:60;width:252px;transform:translateX(-100%);transition:transform .26s cubic-bezier(.22,.61,.36,1);box-shadow:var(--shadow-lg)}
  .hs-lcc .side.open{transform:none}
  .hs-lcc .kpis{grid-template-columns:1fr 1fr}
  .hs-lcc .r-2-1,.hs-lcc .r-3-2{grid-template-columns:1fr}
  .hs-lcc .cards3{grid-template-columns:1fr 1fr}
  .hs-lcc .burger{display:inline-flex}
}
@media (prefers-reduced-motion: reduce){.hs-lcc .side{transition:none}}

/* ── Phone ── */
@media(max-width:640px){
  .hs-lcc .top{padding:11px 16px;padding-top:calc(11px + env(safe-area-inset-top));gap:.6rem}
  .hs-lcc .top h1{font-size:1.15rem}
  .hs-lcc .top .crumb{display:none}
  .hs-lcc .top-right{gap:.5rem}
  .hs-lcc .clock{display:none}
  .hs-lcc .statpill{font-size:.68rem;padding:.32rem .55rem}
  .hs-lcc .top-right .av{display:none}
  .hs-lcc .body{padding:16px 14px calc(48px + env(safe-area-inset-bottom))}
  .hs-lcc .hero{padding:16px;gap:.9rem}
  .hs-lcc .hero-org{font-size:1.25rem}
  .hs-lcc .hero-logo{width:46px;height:46px}
  .hs-lcc .hero-logo img{height:30px}
  .hs-lcc .hero-r{width:100%}
  .hs-lcc .hero-metric{flex:1;text-align:center;min-width:0}
  .hs-lcc .ops{font-size:.78rem;padding:.65rem 13px}
  .hs-lcc .kpis{gap:11px}
  .hs-lcc .kpi{padding:14px 15px}
  .hs-lcc .kpi .n{font-size:1.7rem}
  .hs-lcc .row{gap:12px;margin-bottom:12px}
  .hs-lcc .cards3{grid-template-columns:1fr}
  .hs-lcc .donut-wrap{flex-direction:column;text-align:center;gap:14px;padding:18px}
  .hs-lcc .legend{width:100%}
  .hs-lcc .ph{padding:12px 15px}
  .hs-lcc .pad,.hs-lcc .feed-row,.hs-lcc .crow{padding-left:15px;padding-right:15px}
  .hs-lcc .feed-row .lat{display:none}
  .hs-lcc .brain{height:min(70vh,440px)}
  .hs-lcc .bub{max-width:90%}
}
@media(max-width:380px){
  .hs-lcc .kpis{grid-template-columns:1fr}
}
`
