export const MAX_BYTES = 10 * 1024 * 1024
export const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type ValidationError = { code: 'type' | 'size'; size?: string }

export function validateFile(f: File): ValidationError | null {
  if (!ALLOWED.has(f.type)) return { code: 'type' }
  if (f.size > MAX_BYTES) {
    const mb = (f.size / 1024 / 1024).toFixed(1)
    return { code: 'size', size: `${mb}MB` }
  }
  return null
}
