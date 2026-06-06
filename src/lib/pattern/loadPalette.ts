import type { Palette } from './types'

const cache = new Map<string, Palette>()

export async function loadPalette(id: 'manyoujiang' | 'perler' | 'hama'): Promise<Palette> {
  if (cache.has(id)) return cache.get(id)!
  let mod: { default: unknown }
  switch (id) {
    case 'manyoujiang':
      mod = await import('@/palettes/generated/manyoujiang.json')
      break
    case 'perler':
      mod = await import('@/palettes/generated/perler.json')
      break
    case 'hama':
      mod = await import('@/palettes/generated/hama.json')
      break
  }
  const p = mod.default as Palette
  cache.set(id, p)
  return p
}
