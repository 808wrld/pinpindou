/**
 * Grid size of a pattern for a given crop.
 *
 * The size preset is the pattern's LONG side; the short side follows the
 * crop's aspect ratio, so a 2:1 crop at preset 48 becomes 48 × 24 instead of
 * being squashed into a 48 × 48 square.
 */
export function patternDims(
  longSide: number,
  crop: { w: number; h: number },
): { w: number; h: number } {
  const side = Math.max(1, Math.round(longSide))
  if (!(crop.w > 0) || !(crop.h > 0)) return { w: side, h: side }
  if (crop.w >= crop.h) {
    return { w: side, h: Math.max(1, Math.round((side * crop.h) / crop.w)) }
  }
  return { w: Math.max(1, Math.round((side * crop.w) / crop.h)), h: side }
}
