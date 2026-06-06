export function boxScale(
  src: Uint8ClampedArray,
  sw: number,
  sh: number,
  tw: number,
  th: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(tw * th * 4)
  const xRatio = sw / tw
  const yRatio = sh / th
  for (let ty = 0; ty < th; ty++) {
    const y0 = Math.floor(ty * yRatio)
    const y1 = Math.max(y0 + 1, Math.floor((ty + 1) * yRatio))
    for (let tx = 0; tx < tw; tx++) {
      const x0 = Math.floor(tx * xRatio)
      const x1 = Math.max(x0 + 1, Math.floor((tx + 1) * xRatio))
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let y = y0; y < y1 && y < sh; y++) {
        for (let x = x0; x < x1 && x < sw; x++) {
          const si = (y * sw + x) * 4
          r += src[si]
          g += src[si + 1]
          b += src[si + 2]
          a += src[si + 3]
          n++
        }
      }
      const ti = (ty * tw + tx) * 4
      out[ti] = Math.round(r / n)
      out[ti + 1] = Math.round(g / n)
      out[ti + 2] = Math.round(b / n)
      out[ti + 3] = Math.round(a / n)
    }
  }
  return out
}
