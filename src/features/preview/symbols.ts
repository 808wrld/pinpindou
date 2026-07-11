/**
 * Symbol assignment + luminance helpers used by the symbol-grid preview.
 * Lives in its own module so PatternCanvas.tsx only exports components
 * (keeps react-refresh happy and HMR stable).
 */
import { hexToRgb } from '@/lib/color/lab'

export function hexLuma(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255)
}

export const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789◆●■▲★✦✚✕'

/** Build a frequency-ranked symbol map: most-used palette index → 'A', next → 'B', etc. */
export function buildSymbolMap(cells: number[][]): Map<number, string> {
  const counts = new Map<number, number>()
  for (const row of cells) for (const c of row) counts.set(c, (counts.get(c) ?? 0) + 1)
  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([i]) => i)
  const map = new Map<number, string>()
  ordered.forEach((idx, i) => map.set(idx, SYMBOLS[i] ?? '?'))
  return map
}
