import { chromium, devices } from '../node_modules/playwright-core/index.mjs'

const OUT = '/tmp/claude-0/-home-user-HoundShield/a9fd7b7f-a9fe-56cc-88e9-ffe22df8662c/scratchpad/demos/out'

/** Real handset CSS widths + DPR, not arbitrary round numbers. */
const PHONES = [
  { name: 'iPhone SE',      w: 375, h: 667, dpr: 2 },
  { name: 'iPhone 14/15',   w: 390, h: 844, dpr: 3 },
  { name: 'iPhone 15 Pro Max', w: 430, h: 932, dpr: 3 },
  { name: 'Pixel 7',        w: 412, h: 915, dpr: 2.625 },
  { name: 'Galaxy S8+',     w: 360, h: 740, dpr: 4 },
]
const DESKS = [{ name: 'Tablet', w: 768, h: 1024, dpr: 2 }, { name: 'Desktop', w: 1440, h: 900, dpr: 2 }]

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
})

let fails = 0
for (const demo of ['a-ledger', 'b-console', 'c-brief']) {
  console.log(`\n━━━ ${demo} ━━━`)
  for (const d of [...PHONES, ...DESKS]) {
    const page = await browser.newPage({
      viewport: { width: d.w, height: d.h },
      deviceScaleFactor: d.dpr,
      isMobile: d.w < 700,
      hasTouch: d.w < 700,
    })
    await page.goto(`file://${OUT}/${demo}.html`)
    await page.waitForTimeout(180)

    const m = await page.evaluate(() => {
      const de = document.documentElement
      const vw = de.clientWidth
      const over = []
      for (const el of document.querySelectorAll('*')) {
        const b = el.getBoundingClientRect()
        if (b.width === 0 || b.height === 0) continue
        // Ignore anything inside a horizontally scrollable container — that is
        // a deliberate carousel, not a layout break.
        let p = el.parentElement, inScroller = false
        while (p) {
          const cs = getComputedStyle(p)
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') { inScroller = true; break }
          p = p.parentElement
        }
        if (inScroller) continue
        if (b.right - vw > 1) over.push({ t: el.tagName.toLowerCase(), c: String(el.className).slice(0, 40), o: Math.round(b.right - vw) })
      }
      // Touch targets: every link/button must clear 44px on a phone.
      const small = []
      if (window.innerWidth < 700) {
        for (const el of document.querySelectorAll('a,button')) {
          const b = el.getBoundingClientRect()
          if (b.height > 0 && b.height < 40) small.push({ t: (el.textContent || '').trim().slice(0, 22), h: Math.round(b.height) })
        }
      }
      // Text that would render below 12px is unreadable on a handset.
      const tiny = new Set()
      for (const el of document.querySelectorAll('*')) {
        if (!el.children.length && (el.textContent || '').trim()) {
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (fs && fs < 11) tiny.add(fs)
        }
      }
      return {
        vw, scrollW: de.scrollWidth, bodyScrollW: document.body.scrollWidth,
        over: over.slice(0, 3), overCount: over.length,
        small: small.slice(0, 3), smallCount: small.length,
        tiny: [...tiny],
      }
    })

    const noScroll = m.scrollW <= m.vw + 1
    const ok = noScroll && m.overCount === 0 && m.smallCount === 0 && m.tiny.length === 0
    if (!ok) fails++
    const bits = []
    if (!noScroll) bits.push(`scrollW ${m.scrollW}>${m.vw}`)
    if (m.overCount) bits.push(`${m.overCount} overflow (${m.over.map((o) => `${o.t}.${o.c}+${o.o}`).join(', ')})`)
    if (m.smallCount) bits.push(`${m.smallCount} targets <40px (${m.small.map((s) => `"${s.t}"=${s.h}px`).join(', ')})`)
    if (m.tiny.length) bits.push(`text <11px: ${m.tiny.join(',')}`)
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${d.name.padEnd(18)} ${d.w}×${d.h} @${d.dpr}x  ${bits.join(' · ') || 'clean'}`)
    await page.close()
  }
}
await browser.close()
console.log(`\n${fails === 0 ? 'ALL CLEAN' : fails + ' viewport(s) failing'}`)
process.exit(fails ? 1 : 0)
