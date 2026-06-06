/**
 * Symbol assignment + luminance helpers used by the symbol-grid preview.
 * Lives in its own module so PatternCanvas.tsx only exports components
 * (keeps react-refresh happy and HMR stable).
 */

export function hexLuma(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
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
