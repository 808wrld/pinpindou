import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { hexToLab } from '../src/lib/color/lab'

const SRC = resolve('src/palettes')
const OUT = resolve('src/palettes/generated')

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const files = readdirSync(SRC).filter(f => f.endsWith('.json'))
let total = 0
for (const f of files) {
  const raw = JSON.parse(readFileSync(join(SRC, f), 'utf8'))
  raw.colors = raw.colors.map((c: { hex: string }) => ({ ...c, lab: hexToLab(c.hex) }))
  writeFileSync(join(OUT, f), JSON.stringify(raw, null, 2) + '\n')
  total += raw.colors.length
  console.log(`built ${f} (${raw.colors.length} colors)`)
}
console.log(`total: ${total} colors across ${files.length} palettes`)
