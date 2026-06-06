import { describe, it, expect } from 'vitest'
import { computeBom, computeBomWithTotal } from '@/features/bom/computeBom'

describe('computeBom', () => {
  it('counts cells per palette index', () => {
    const cells = [
      [0, 0, 1],
      [1, 2, 2],
    ]
    const bom = computeBom(cells)
    expect(bom.find((b) => b.index === 0)?.count).toBe(2)
    expect(bom.find((b) => b.index === 1)?.count).toBe(2)
    expect(bom.find((b) => b.index === 2)?.count).toBe(2)
  })
  it('sorted by count desc', () => {
    const bom = computeBom([[0, 0, 0, 1, 2]])
    expect(bom.map((b) => b.index)).toEqual([0, 1, 2])
  })
  it('total is sum of all', () => {
    const cells = [
      [0, 0, 1],
      [1, 2, 2],
    ]
    const { total } = computeBomWithTotal(cells)
    expect(total).toBe(6)
  })
})
