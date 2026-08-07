import { chromium } from '../node_modules/playwright-core/index.mjs'
const S = '/tmp/claude-0/-home-user-HoundShield/a9fd7b7f-a9fe-56cc-88e9-ffe22df8662c/scratchpad'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
})

for (const demo of ['a-ledger', 'b-console', 'c-brief']) {
  for (const v of [
    { tag: '390', width: 390, height: 844, dpr: 3, mobile: true },
    { tag: '1440', width: 1440, height: 1000, dpr: 2, mobile: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: v.dpr,
      isMobile: v.mobile,
      hasTouch: v.mobile,
    })
    await page.goto(`file://${S}/demos/out/${demo}.html`)
    await page.waitForTimeout(250)
    const w = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth])
    await page.screenshot({ path: `${S}/demo-${demo}-${v.tag}.png`, fullPage: true })
    console.log(`${demo} @${v.tag}: clientWidth=${w[0]} scrollWidth=${w[1]} ${w[0] >= w[1] ? 'OK' : 'OVERFLOW'}`)
    await page.close()
  }
}
await browser.close()
