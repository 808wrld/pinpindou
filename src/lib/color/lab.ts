import { srgbToLinear } from './srgb'

// D65 reference white
const Xn = 95.047,
  Yn = 100.0,
  Zn = 108.883

function f(t: number): number {
  const d = 6 / 29
  return t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r),
    lg = srgbToLinear(g),
    lb = srgbToLinear(b)
  const X = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) * 100
  const Y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750) * 100
  const Z = (lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041) * 100
  const fx = f(X / Xn),
    fy = f(Y / Yn),
    fz = f(Z / Zn)
  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bb = 200 * (fy - fz)
  return [L, a, bb]
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { r, g, b }
}

export function hexToLab(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex)
  return rgbToLab(r, g, b)
}
