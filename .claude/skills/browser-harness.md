---
name: browser-harness
description: CDP browser automation via browser-harness-js. Use for competitive intelligence scraping, automated UI testing, and live demo verification. Invoked when the user needs to automate browser actions or scrape JS-rendered pages.
user-invocable: true
---

# Browser Harness Skill

Drive Chrome via the Chrome DevTools Protocol (CDP) using browser-harness-js.
Built on: https://github.com/browser-use/browser-harness-js

## When to Use

- Scraping JS-rendered competitor pages (Nightfall, Strac, Cyberhaven pricing pages)
- Automated UI testing for the HoundShield dashboard
- Live demo verification: confirm the proxy blocks ChatGPT requests end-to-end
- CMMC-AB marketplace scraping for C3PAO contact lists
- Any page that WebFetch cannot load because it requires JavaScript execution

## Setup (one-time)

```bash
npx skills add https://github.com/browser-use/browser-harness-js --skill cdp browser-harness-js
```

Or install directly:
```bash
npm install -g browser-harness-js
```

Start a Chrome instance with remote debugging enabled:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &
# Linux:
google-chrome --remote-debugging-port=9222 &
```

## Usage

```bash
# Navigate to a page
browser-harness-js 'await session.Page.navigate({url:"https://marketplace.cmmcab.org/s/find-a-c3pao"})'

# Get all text content
browser-harness-js 'const {result} = await session.Runtime.evaluate({expression:"document.body.innerText"}); return result.value'

# Click an element
browser-harness-js 'await session.Input.dispatchMouseEvent({type:"mousePressed", x:500, y:300, button:"left", clickCount:1})'

# Take a screenshot
browser-harness-js 'const {data} = await session.Page.captureScreenshot({format:"png"}); require("fs").writeFileSync("/tmp/screenshot.png", Buffer.from(data, "base64"))'
```

## HoundShield-Specific Tasks

### Scrape CMMC-AB C3PAO Directory
```bash
browser-harness-js '
  await session.Page.navigate({url:"https://marketplace.cmmcab.org/s/find-a-c3pao"});
  await new Promise(r => setTimeout(r, 2000));
  const {result} = await session.Runtime.evaluate({expression:"document.body.innerText"});
  return result.value;
'
```

### Monitor Competitor Pricing Changes
```bash
# Run weekly to track Nightfall/Strac pricing changes
browser-harness-js '
  await session.Page.navigate({url:"https://nightfall.ai/pricing"});
  await new Promise(r => setTimeout(r, 1500));
  const {result} = await session.Runtime.evaluate({expression:"document.querySelector(\"[data-pricing], .pricing, #pricing\")?.innerText || document.body.innerText.slice(0,3000)"});
  return result.value;
'
```

### Verify Proxy Block (HoundShield Demo Test)
```bash
# Confirm ChatGPT traffic is intercepted before sending demo
browser-harness-js '
  await session.Page.navigate({url:"https://chat.openai.com"});
  await new Promise(r => setTimeout(r, 2000));
  const {result} = await session.Runtime.evaluate({expression:"document.title"});
  return result.value;
'
```

## Environment Variables
- `CDP_REPL_PORT`: CDP server port (default 9876)
- `CDP_REPL_LOG`: Log file path (default /tmp/browser-harness-js.log)
