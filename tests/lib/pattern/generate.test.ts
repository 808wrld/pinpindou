import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hexToLab } from '@/lib/color/lab'
import type { Palette } from '@/lib/pattern/types'

// Mock the worker bridges. Each test calls vi.mocked(...).mockResolvedValueOnce(...)
// to script pass 1 / pass 2 return values.
vi.mock('@/lib/workers/runPreprocess', () => ({
  runPreprocess: vi.fn(),
}))
vi.mock('@/lib/workers/runQuantize', () => ({
  runQuantize: vi.fn(),
}))

// Image / canvas globals don't exist under jsdom for our purposes; stub loadPixels
// by mocking the whole generate module's image-loading branch. We import after mocks
// are set up.
beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  // Patch the Image global so loadPixels resolves quickly.
  class FakeImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_v: string) {
      queueMicrotask(() => this.onload?.())
    }
  }
  // @ts-expect-error global override for test
  globalThis.Image = FakeImage
  // jsdom returns null from canvas.getContext('2d'); stub a minimal 2d context.
  const fakeCtx = {
    fillStyle: '',
    fillRect: () => {},
    drawImage: () => {},
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
  }
  HTMLCanvasElement.prototype.getContext = function () {
    return fakeCtx as unknown as CanvasRenderingContext2D
  } as typeof HTMLCanvasElement.prototype.getContext
})

function mkPalette(hexes: string[]): Palette {
  return {
    id: 'test',
    name: { 'zh-CN': 't', en: 't' },
    version: 'v',
    source: '',
    colors: hexes.map((hex, i) => ({
      id: `T${String(i + 1).padStart(2, '0')}`,
      name: { 'zh-CN': `c${i}`, en: `c${i}` },
      hex,
      lab: hexToLab(hex),
    })),
  }
}

const BASE_ARGS = {
  imageDataUrl: 'data:image/png;base64,',
  srcW: 4,
  srcH: 4,
  crop: { x: 0, y: 0, w: 4, h: 4 },
  brightness: 0,
  contrast: 0,
  targetW: 4,
  targetH: 4,
  ditherMode: 'none' as const,
}

describe('generatePattern · 2-pass color cap', () => {
  it('remaps cells from reduced palette indices back to ORIGINAL palette indices', async () => {
    const { runPreprocess } = await import('@/lib/workers/runPreprocess')
    const { runQuantize } = await import('@/lib/workers/runQuantize')
    const { generatePattern } = await import('@/lib/pattern/generate')

    vi.mocked(runPreprocess).mockResolvedValue({
      type: 'preprocess:result',
      id: 1,
      pixels: new Uint8ClampedArray(64),
      w: 4,
      h: 4,
    })

    // Pass 1 (full palette, no dither): use original indices 3, 5, 7.
    // Index 3 is the most frequent (8 cells), 5 next (5 cells), 7 last (3 cells).
    const pass1Cells: number[][] = [
      [3, 3, 3, 3],
      [3, 3, 3, 3],
      [5, 5, 5, 5],
      [5, 7, 7, 7],
    ]
    // Pass 2 (reduced palette of [3, 5, 7] in topOrig order): reduced indices 0..2.
    // If implementation is correct, returned cells should have ORIGINAL indices.
    const pass2Cells: number[][] = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [1, 2, 2, 2],
    ]

    vi.mocked(runQuantize)
      .mockResolvedValueOnce({ type: 'quantize:result', id: 1, cells: pass1Cells })
      .mockResolvedValueOnce({ type: 'quantize:result', id: 2, cells: pass2Cells })

    const palette = mkPalette(
      ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#888888'],
    )

    const res = await generatePattern({
      ...BASE_ARGS,
      palette,
      // cap=3 forces a real 2-pass with dither so we exercise the remap path.
      ditherMode: 'floyd-steinberg',
      colorCap: 3,
    })

    expect('cells' in res).toBe(true)
    if ('cells' in res) {
      // Every cell value must be one of the ORIGINAL palette indices [3, 5, 7],
      // never the reduced indices [0, 1, 2].
      const flat = res.cells.flat()
      for (const v of flat) expect([3, 5, 7]).toContain(v)
      // Row-by-row remap check
      expect(res.cells[0]).toEqual([3, 3, 3, 3])
      expect(res.cells[3]).toEqual([5, 7, 7, 7])
    }
  })

  it('I1 fast-path: colorCap=null skips pass 1 and uses the full palette with the user dither', async () => {
    const { runPreprocess } = await import('@/lib/workers/runPreprocess')
    const { runQuantize } = await import('@/lib/workers/runQuantize')
    const { generatePattern } = await import('@/lib/pattern/generate')

    vi.mocked(runPreprocess).mockResolvedValue({
      type: 'preprocess:result',
      id: 1,
      pixels: new Uint8ClampedArray(64),
      w: 4,
      h: 4,
    })

    const cells: number[][] = [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ]
    vi.mocked(runQuantize).mockResolvedValueOnce({
      type: 'quantize:result',
      id: 1,
      cells,
    })

    const palette = mkPalette(['#000', '#F00', '#0F0', '#00F'])
    const res = await generatePattern({
      ...BASE_ARGS,
      palette,
      ditherMode: 'floyd-steinberg',
      colorCap: null,
    })

    // Should be exactly ONE quantize call (no preselect pass).
    expect(vi.mocked(runQuantize)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(runQuantize).mock.calls[0][0].ditherMode).toBe('floyd-steinberg')
    expect('cells' in res && res.cells).toEqual(cells)
  })

  it('fast-path: cap >= palette.length also short-circuits to single pass', async () => {
    const { runPreprocess } = await import('@/lib/workers/runPreprocess')
    const { runQuantize } = await import('@/lib/workers/runQuantize')
    const { generatePattern } = await import('@/lib/pattern/generate')

    vi.mocked(runPreprocess).mockResolvedValue({
      type: 'preprocess:result',
      id: 1,
      pixels: new Uint8ClampedArray(64),
      w: 4,
      h: 4,
    })
    vi.mocked(runQuantize).mockResolvedValueOnce({
      type: 'quantize:result',
      id: 1,
      cells: [[0]],
    })

    const palette = mkPalette(['#000', '#F00', '#0F0', '#00F'])
    await generatePattern({ ...BASE_ARGS, palette, colorCap: 100 })

    expect(vi.mocked(runQuantize)).toHaveBeenCalledTimes(1)
  })

  it('propagates preprocess errors without calling quantize', async () => {
    const { runPreprocess } = await import('@/lib/workers/runPreprocess')
    const { runQuantize } = await import('@/lib/workers/runQuantize')
    const { generatePattern } = await import('@/lib/pattern/generate')

    vi.mocked(runPreprocess).mockResolvedValue({
      type: 'preprocess:error',
      id: 1,
      message: 'boom',
    })

    const palette = mkPalette(['#000'])
    const res = await generatePattern({ ...BASE_ARGS, palette, colorCap: 2 })
    expect('error' in res && res.error).toBe('boom')
    expect(vi.mocked(runQuantize)).not.toHaveBeenCalled()
  })

  it('propagates pass-2 quantize errors', async () => {
    const { runPreprocess } = await import('@/lib/workers/runPreprocess')
    const { runQuantize } = await import('@/lib/workers/runQuantize')
    const { generatePattern } = await import('@/lib/pattern/generate')

    vi.mocked(runPreprocess).mockResolvedValue({
      type: 'preprocess:result',
      id: 1,
      pixels: new Uint8ClampedArray(64),
      w: 4,
      h: 4,
    })

    vi.mocked(runQuantize)
      .mockResolvedValueOnce({ type: 'quantize:result', id: 1, cells: [[3, 5]] })
      .mockResolvedValueOnce({ type: 'quantize:error', id: 2, message: 'pass2 fail' })

    const palette = mkPalette(['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777'])
    const res = await generatePattern({
      ...BASE_ARGS,
      palette,
      ditherMode: 'floyd-steinberg',
      colorCap: 2,
    })
    expect('error' in res && res.error).toBe('pass2 fail')
  })
})
