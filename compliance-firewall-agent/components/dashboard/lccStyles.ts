/**
 * Live Command Center — scoped styles, ported 1:1 from the approved
 * Direction-A "Live Command Center (After-Login Dashboard)" spec.
 * Every selector is namespaced under `.hs-lcc` and keyframes are renamed
 * (lcc*) so nothing leaks into the rest of the app.
 */
export const LCC_CSS = `
.hs-lcc{
  /* Same light Steel & Cream palette as the marketing site (mapped onto the
     site's --hs-* tokens, with fallbacks so the console is self-sufficient). */
  --bg: var(--hs-surface-1, #F5F8FB);
  --panel: var(--hs-surface-0, #FFFFFF);
  --panel2: var(--hs-surface-1, #F5F8FB);
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
  --f-disp:'Fraunces',serif; --f:'DM Sans',system-ui,sans-serif; --f-mono:'JetBrains Mono',monospace;
  --r:14px; --r-sm:10px;
  font-family:var(--f);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;
}
.hs-lcc *{margin:0;padding:0;box-sizing:border-box}
.hs-lcc .mono{font-family:var(--f-mono)}
.hs-lcc .shell{display:grid;grid-template-columns:244px 1fr;min-height:100vh}

.hs-lcc .side{background:var(--panel2);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:16px 12px;position:sticky;top:0;height:100vh;overflow:auto}
.hs-lcc .brand{display:flex;align-items:center;gap:.55rem;padding:.4rem .5rem 1.1rem}
.hs-lcc .brand img{height:30px;width:auto;mix-blend-mode:multiply;transition:transform .3s cubic-bezier(.22,.61,.36,1);transform-origin:center;animation:hs-logo-idle 4.5s ease-in-out infinite}
.hs-lcc .brand:hover img,.hs-lcc .brand img:hover,.hs-lcc .brand:active img,.hs-lcc .brand img:active{animation:none;transform:rotate(-4deg) scale(1.06)}
@media (prefers-reduced-motion: reduce){.hs-lcc .brand img{animation:none;transition:none}.hs-lcc .brand:hover img,.hs-lcc .brand img:hover{transform:none}}
.hs-lcc .brand span{font-family:var(--f-disp);font-weight:600;font-size:1.18rem}
.hs-lcc .brand span b{color:var(--brand)}
.hs-lcc .gh{font-family:var(--f-mono);font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mut2);margin:1rem .6rem .35rem}
.hs-lcc .slink{display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;border-radius:var(--r-sm);font-size:.88rem;font-weight:500;color:var(--mut);cursor:pointer;transition:all .15s;position:relative;width:100%;text-align:left;background:none;border:none;font-family:var(--f)}
.hs-lcc .slink svg{width:17px;height:17px}
.hs-lcc .slink:hover{background:var(--hover);color:var(--text)}
.hs-lcc .slink.on{background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand);font-weight:600}
.hs-lcc .slink.on::before{content:"";position:absolute;left:-12px;top:8px;bottom:8px;width:3px;border-radius:3px;background:var(--brand)}
.hs-lcc .slink .pp{margin-left:auto;font-family:var(--f-mono);font-size:.62rem;font-weight:700;background:var(--badbg);color:var(--bad);padding:.05rem .35rem;border-radius:5px}
.hs-lcc .side-foot{margin-top:auto;padding:.7rem;border-top:1px solid var(--line);display:flex;align-items:center;gap:.6rem}
.hs-lcc .av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--brand),var(--bright));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.82rem;flex-shrink:0}
.hs-lcc .side-foot .nm{font-size:.84rem;font-weight:600}.hs-lcc .side-foot .sub{font-size:.72rem;color:var(--mut2)}
.hs-lcc .side-link{display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;border-radius:var(--r-sm);font-size:.84rem;font-weight:500;color:var(--mut);text-decoration:none;transition:all .15s}
.hs-lcc .side-link:hover{background:var(--hover);color:var(--bright)}
.hs-lcc .side-link svg{width:16px;height:16px}

.hs-lcc .main{overflow:auto;height:100vh}
.hs-lcc .top{position:sticky;top:0;z-index:20;background:rgba(250,252,255,.82);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);padding:14px 26px;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.hs-lcc .top h1{font-family:var(--f-disp);font-size:1.4rem;font-weight:600}
.hs-lcc .top .crumb{font-size:.74rem;color:var(--mut2)}
.hs-lcc .top-right{display:flex;align-items:center;gap:.8rem}
.hs-lcc .clock{font-family:var(--f-mono);font-size:.82rem;color:var(--mut);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.4rem .7rem}
.hs-lcc .statpill{display:inline-flex;align-items:center;gap:.45rem;font-size:.76rem;font-weight:600;color:var(--ok);background:var(--okbg);border:1px solid color-mix(in srgb,var(--ok) 28%,transparent);border-radius:999px;padding:.35rem .7rem}
.hs-lcc .dot{width:7px;height:7px;border-radius:50%;background:var(--ok);animation:lccPulse 1.8s infinite}
.hs-lcc .dot.b{background:var(--brand)}
@keyframes lccPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 60%,transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}

.hs-lcc .body{padding:24px 26px 60px}
.hs-lcc .atab{display:none}.hs-lcc .atab.on{display:block;animation:lccFade .35s ease}
@keyframes lccFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.hs-lcc .ops{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:.7rem 16px;font-size:.84rem;color:var(--mut);margin-bottom:18px}
.hs-lcc .ops b{color:var(--text);font-family:var(--f-mono);font-weight:600}
.hs-lcc .ops .sep{color:var(--mut2)}

.hs-lcc .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.hs-lcc .kpi{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;transition:border-color .2s}
.hs-lcc .kpi:hover{border-color:var(--line2)}
.hs-lcc .kpi .l{font-size:.76rem;color:var(--mut2);display:flex;align-items:center;gap:.4rem}
.hs-lcc .kpi .l svg{width:13px;height:13px}
.hs-lcc .kpi .n{font-family:var(--f-disp);font-size:1.9rem;font-weight:600;margin-top:.3rem;font-variant-numeric:tabular-nums}
.hs-lcc .kpi .d{font-size:.73rem;margin-top:.15rem;color:var(--mut)}
.hs-lcc .kpi .d.up{color:var(--ok)}.hs-lcc .kpi .d.dn{color:var(--bad)}
.hs-lcc .bump{animation:lccBump .45s ease}@keyframes lccBump{0%{transform:translateY(2px);opacity:.55}100%{transform:none;opacity:1}}

.hs-lcc .row{display:grid;gap:16px;margin-bottom:16px}
.hs-lcc .r-2-1{grid-template-columns:1.55fr 1fr}
.hs-lcc .r-3-2{grid-template-columns:1.45fr 1fr}
.hs-lcc .panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.hs-lcc .ph{padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.hs-lcc .ph h3{font-size:.98rem;font-weight:600}
.hs-lcc .ph .mono{font-size:.7rem;color:var(--mut2)}
.hs-lcc .live-tag{display:inline-flex;align-items:center;gap:.35rem;font-family:var(--f-mono);font-size:.66rem;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.08em}
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
.hs-lcc .tag.block{background:var(--badbg);color:var(--bad)}.hs-lcc .tag.pass{background:var(--okbg);color:var(--ok)}.hs-lcc .tag.quar{background:var(--warnbg);color:var(--warn)}
.hs-lcc .feed-row .what{flex:1;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-lcc .feed-row .eng{font-family:var(--f-mono);font-size:.68rem;color:var(--mut2)}
.hs-lcc .feed-row .lat{font-family:var(--f-mono);font-size:.7rem;color:var(--mut2);width:42px;text-align:right}
.hs-lcc .feed-row.fresh{animation:lccFresh 1.4s ease}
@keyframes lccFresh{0%{background:color-mix(in srgb,var(--brand) 16%,transparent)}100%{background:transparent}}

.hs-lcc .eng{display:grid;grid-template-columns:92px 1fr 40px;align-items:center;gap:12px;padding:.4rem 0;font-size:.82rem;color:var(--mut)}
.hs-lcc .bar{height:8px;border-radius:99px;background:var(--track);overflow:hidden}
.hs-lcc .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--bright),var(--orange));border-radius:99px;transition:width .8s ease}
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
.hs-lcc .st.met{background:var(--okbg);color:var(--ok)}.hs-lcc .st.part{background:var(--warnbg);color:var(--warn)}.hs-lcc .st.gap{background:var(--badbg);color:var(--bad)}

.hs-lcc .btn{display:inline-flex;align-items:center;gap:.45rem;font-weight:600;font-size:.85rem;padding:.6rem 1rem;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:all .18s;font-family:var(--f)}
.hs-lcc .btn svg{width:15px;height:15px}
.hs-lcc .btn-p{background:var(--brand);color:#fff}.hs-lcc .btn-p:hover{background:var(--bright)}
.hs-lcc .btn-g{background:transparent;border-color:var(--line);color:var(--text)}.hs-lcc .btn-g:hover{border-color:var(--brand);color:var(--bright)}
.hs-lcc .btn-sm{padding:.4rem .7rem;font-size:.78rem}

.hs-lcc .cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.hs-lcc .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:20px;transition:all .2s}
.hs-lcc .card:hover{border-color:var(--line2);transform:translateY(-3px)}
.hs-lcc .card .ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--brand) 16%,transparent);color:var(--bright);margin-bottom:.8rem}
.hs-lcc .card .ic svg{width:19px;height:19px}
.hs-lcc .card h4{font-size:1rem;font-weight:600;margin-bottom:.3rem}.hs-lcc .card p{font-size:.84rem;color:var(--mut)}

.hs-lcc .gw{display:flex;align-items:center;justify-content:space-between;gap:.6rem;background:var(--panel2);border:1px dashed var(--line2);border-radius:10px;padding:.65rem .85rem;font-family:var(--f-mono);font-size:.8rem}
.hs-lcc .gw button{border:none;background:var(--brand);color:#fff;border-radius:7px;padding:.32rem .6rem;font-size:.7rem;font-weight:700;cursor:pointer}
.hs-lcc .usebar{height:8px;border-radius:99px;background:var(--track);overflow:hidden;margin-top:.35rem}
.hs-lcc .usebar i{display:block;height:100%;background:var(--brand);border-radius:99px}

.hs-lcc .brain{display:flex;flex-direction:column;height:460px}
.hs-lcc .blog{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}
.hs-lcc .bub{max-width:80%;padding:.65rem .9rem;border-radius:13px;font-size:.86rem;line-height:1.5}
.hs-lcc .bub.u{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:4px}
.hs-lcc .bub.b{align-self:flex-start;background:var(--panel2);border:1px solid var(--line);border-bottom-left-radius:4px}
.hs-lcc .bub.b .src{display:block;margin-top:.4rem;font-family:var(--f-mono);font-size:.64rem;color:var(--mut2)}
.hs-lcc .chips{display:flex;gap:.4rem;flex-wrap:wrap;padding:0 14px 12px}
.hs-lcc .chips button{font-size:.74rem;border:1px solid var(--line);background:var(--panel2);color:var(--mut);border-radius:99px;padding:.3rem .6rem;cursor:pointer}
.hs-lcc .chips button:hover{border-color:var(--brand);color:var(--bright)}
.hs-lcc .bin{display:flex;gap:.5rem;padding:14px;border-top:1px solid var(--line)}
.hs-lcc .bin input{flex:1;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:.6rem .8rem;color:var(--text);font-family:var(--f);font-size:.88rem;outline:none}
.hs-lcc .bin input:focus{border-color:var(--brand)}

.hs-lcc .note{font-size:.78rem;color:var(--mut2);margin-top:14px}
.hs-lcc .burger{display:none}
@media(max-width:1000px){
  .hs-lcc .shell{grid-template-columns:1fr}
  .hs-lcc .side{position:fixed;left:0;top:0;bottom:0;z-index:60;width:244px;transform:translateX(-100%);transition:transform .25s ease}
  .hs-lcc .side.open{transform:none}
  .hs-lcc .kpis{grid-template-columns:1fr 1fr}
  .hs-lcc .r-2-1,.hs-lcc .r-3-2{grid-template-columns:1fr}
  .hs-lcc .cards3{grid-template-columns:1fr}
  .hs-lcc .burger{display:inline-flex}
}
`
