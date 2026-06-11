# HoundShield — 3-Minute Demo Script

Audience: Jordan — IT Security Manager at a 50–250 person DoD contractor, CMMC Level 2 deadline November 2026. Run it screen-shared or recorded (Loom).

---

## 0:00 — Cold open (the spill)

> "I want to show you something your engineers did this week — they just don't know it yet."

1. Open ChatGPT in one tab. Paste a fake-but-realistic prompt:
   `"Summarize this proposal section: Contract FA8675-26-C-0042, CAGE 7XYZ1, ITAR-controlled fin actuator specs..."`
2. **Don't press enter.** Say:
   > "Contract number. CAGE code. ITAR marker. The moment this hits OpenAI's servers, it's a DFARS 7012 CUI spill. Your assessor calls this a finding. The DoD calls it grounds for losing the contract."

## 0:45 — The one-line fix

3. Open the quickstart (houndshield.com/docs/quickstart). Show the single change:
   ```
   baseURL: "https://<your-proxy>/v1"
   ```
   > "That's the entire deployment. No agents on laptops, no network re-architecture. Your team keeps using the AI tools they already use."

## 1:15 — The block (the magic moment)

4. Go to houndshield.com/demo. Paste the same prompt. Hit Scan.
5. Watch it flag CUI / contract number / ITAR in real time.
   > "Sixteen detection engines, under ten milliseconds. The prompt never left this machine — that's the point. Every cloud DLP vendor scans your CUI on *their* servers. That's itself a spill. We never see your data. Architecturally can't."

## 2:00 — The evidence (what Jordan actually buys)

6. Open the dashboard → Shield → Reports. Generate the PDF.
   > "This is what your C3PAO asks for: every intercept mapped to its NIST 800-171 control, hash-chained so it's tamper-evident, plus your live SPRS score. You walk into the assessment with evidence instead of promises."

## 2:40 — Close

> "Free tier gets you your SPRS score today — no credit card. If you want the full gateway protecting the whole team before your assessment window, that's $199 a month. When is your C3PAO assessment scheduled?"

**(Always end on that question — it qualifies timeline + budget in one sentence.)**

---

### Objection cheat-sheet

| Objection | Answer |
|---|---|
| "We just block ChatGPT" | Your engineers use it anyway — on personal devices, invisibly. Blocking creates shadow AI; HoundShield makes sanctioned AI safe and logged. |
| "We already have Purview/Nightfall" | Ask them where the scanning happens. If it's their cloud, your CUI is leaving your boundary — that's the violation, not the cure. |
| "Too early, assessment is next year" | SPRS score is filed *now* and DoD primes are already flowing CMMC down into subcontracts. Free tier = zero-cost head start. |
| "Price" | One C3PAO finding remediation costs more than a year of HoundShield. The PDF report alone replaces a $5K consultant artifact. |
