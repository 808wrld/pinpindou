export type BomEntry = { index: number; count: number }

export function computeBom(cells: number[][]): BomEntry[] {
  const counts = new Map<number, number>()
  for (const row of cells) for (const c of row) counts.set(c, (counts.get(c) ?? 0) + 1)
  return [...counts.entries()]
    .map(([index, count]) => ({ index, count }))
    .sort((a, b) => b.count - a.count)
}

export function computeBomWithTotal(cells: number[][]): { bom: BomEntry[]; total: number } {
  const bom = computeBom(cells)
  const total = bom.reduce((acc, e) => acc + e.count, 0)
  return { bom, total }
}
