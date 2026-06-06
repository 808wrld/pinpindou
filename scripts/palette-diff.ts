import { readFileSync } from 'node:fs'
import { hexToLab } from '../src/lib/color/lab'
import { ciede2000 } from '../src/lib/color/ciede2000'

const [a, b] = process.argv.slice(2)
if (!a || !b) {
  console.error('usage: tsx scripts/palette-diff.ts <a.json> <b.json>')
  process.exit(1)
}
const A = JSON.parse(readFileSync(a, 'utf8'))
const B = JSON.parse(readFileSync(b, 'utf8'))
const idxB = new Map<string, { hex: string }>()
for (const c of B.colors) idxB.set(c.id, c)
for (const c of A.colors) {
  const m = idxB.get(c.id)
  if (!m) { console.log(`${c.id} only in A`); continue }
  const dE = ciede2000(hexToLab(c.hex), hexToLab(m.hex))
  console.log(`${c.id}\tΔE=${dE.toFixed(2)}\t${c.hex} vs ${m.hex}`)
}
