import { ciede2000 } from './ciede2000'

type Lab = [number, number, number]

export function nearestPaletteIndex(lab: Lab, palette: readonly Lab[]): number {
  let bestIdx = 0
  let bestDe = Infinity
  for (let i = 0; i < palette.length; i++) {
    const de = ciede2000(lab, palette[i])
    if (de < bestDe) {
      bestDe = de
      bestIdx = i
    }
  }
  return bestIdx
}
