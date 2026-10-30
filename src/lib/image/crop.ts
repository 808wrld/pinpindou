export type CropRect = { x: number; y: number; w: number; h: number }

export const CROP_ASPECTS = [
  { id: '1_1', ratio: 1 / 1, glyph: '1∶1' },
  { id: '2_1', ratio: 2 / 1, glyph: '2∶1' },
  { id: '1_2', ratio: 1 / 2, glyph: '1∶2' },
] as const

export type CropAspectId = (typeof CROP_ASPECTS)[number]['id']

/** Highest zoom the crop slider offers (crop side = full side / zoom). */
export const MAX_CROP_ZOOM = 4

export function aspectRatio(id: CropAspectId): number {
  return CROP_ASPECTS.find((a) => a.id === id)?.ratio ?? 1
}

/** Largest crop of the given aspect ratio (w / h) that fits inside the image. */
export function maxCropSize(imgW: number, imgH: number, ratio: number): { w: number; h: number } {
  let w = Math.min(imgW, imgH * ratio)
  let h = w / ratio
  if (h > imgH) {
    h = imgH
    w = h * ratio
  }
  return { w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) }
}

/** Keep a crop inside the image, shrinking it only if it is larger than the image. */
export function clampCrop(c: CropRect, imgW: number, imgH: number): CropRect {
  const w = Math.max(1, Math.min(Math.round(c.w), imgW))
  const h = Math.max(1, Math.min(Math.round(c.h), imgH))
  const x = Math.min(Math.max(0, Math.round(c.x)), imgW - w)
  const y = Math.min(Math.max(0, Math.round(c.y)), imgH - h)
  return { x, y, w, h }
}

/**
 * Crop with the given aspect ratio, `zoom` times smaller than the largest one
 * that fits, centred on `center` (default: image centre) and clamped inside
 * the image.
 */
export function cropForAspect(
  imgW: number,
  imgH: number,
  ratio: number,
  zoom = 1,
  center?: { x: number; y: number },
): CropRect {
  const max = maxCropSize(imgW, imgH, ratio)
  const z = Math.min(MAX_CROP_ZOOM, Math.max(1, zoom))
  const w = Math.max(1, Math.floor(max.w / z))
  const h = Math.max(1, Math.floor(max.h / z))
  const cx = center?.x ?? imgW / 2
  const cy = center?.y ?? imgH / 2
  return clampCrop({ x: cx - w / 2, y: cy - h / 2, w, h }, imgW, imgH)
}

/** Current zoom of a crop relative to the largest crop of the same aspect. */
export function cropZoom(crop: CropRect, imgW: number, imgH: number, ratio: number): number {
  const max = maxCropSize(imgW, imgH, ratio)
  return Math.min(MAX_CROP_ZOOM, Math.max(1, max.w / crop.w))
}

/** The crop moved by (dx, dy) image pixels, kept inside the image. */
export function moveCrop(
  crop: CropRect,
  dx: number,
  dy: number,
  imgW: number,
  imgH: number,
): CropRect {
  return clampCrop({ ...crop, x: crop.x + dx, y: crop.y + dy }, imgW, imgH)
}
