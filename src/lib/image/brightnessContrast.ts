export function applyBrightnessContrast(
  pixels: Uint8ClampedArray,
  brightness: number,
  contrast: number,
): void {
  const c = 1 + contrast
  const b = brightness
  for (let i = 0; i < pixels.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = pixels[i + k]
      const out = (v - 128) * c + 128 + b * 255
      pixels[i + k] = Math.max(0, Math.min(255, Math.round(out)))
    }
  }
}
