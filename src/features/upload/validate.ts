export const MAX_BYTES = 10 * 1024 * 1024
export const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * A 10 MB file can still decode to a huge bitmap (well-compressed PNGs reach
 * tens of thousands of pixels per side), which exceeds canvas limits — iOS
 * Safari caps a canvas at ~16.7 MP. Images above MAX_DECODED_PIXELS are
 * rejected; anything with a side above MAX_SIDE is downscaled on load,
 * which is far more detail than a bead pattern can use anyway.
 */
export const MAX_SIDE = 4096
export const MAX_DECODED_PIXELS = 100_000_000

export type ValidationError = { code: 'type' | 'size'; size?: string }

export function validateFile(f: File): ValidationError | null {
  if (!ALLOWED.has(f.type)) return { code: 'type' }
  if (f.size > MAX_BYTES) {
    const mb = (f.size / 1024 / 1024).toFixed(1)
    return { code: 'size', size: `${mb}MB` }
  }
  return null
}

/** Size an image should be scaled to so that neither side exceeds `maxSide`. */
export function fitWithin(w: number, h: number, maxSide = MAX_SIDE): { w: number; h: number } {
  const longest = Math.max(w, h)
  if (longest <= maxSide) return { w, h }
  const scale = maxSide / longest
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) }
}
