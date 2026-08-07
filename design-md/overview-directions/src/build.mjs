import { writeFileSync, mkdirSync } from 'node:fs'
import { A } from './a-ledger.mjs'
import { B } from './b-console.mjs'
import { C } from './c-brief.mjs'

const OUT = '/tmp/claude-0/-home-user-HoundShield/a9fd7b7f-a9fe-56cc-88e9-ffe22df8662c/scratchpad/demos/out'
mkdirSync(OUT, { recursive: true })

const page = (title, body) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>*{margin:0;padding:0}html,body{width:100%;overflow-x:hidden}</style>
</head><body>${body}</body></html>`

for (const [name, title, body] of [
  ['a-ledger', 'A · Audit Ledger', A],
  ['b-console', 'B · Operator Console', B],
  ['c-brief', 'C · Executive Brief', C],
]) {
  writeFileSync(`${OUT}/${name}.html`, page(title, body), 'utf8')
  console.log('wrote', name)
}
