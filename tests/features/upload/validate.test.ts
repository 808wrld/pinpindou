import { describe, it, expect } from 'vitest'
import { validateFile } from '@/features/upload/validate'

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

describe('validateFile', () => {
  it('accepts JPG under 10MB', () => {
    expect(validateFile(makeFile('a.jpg', 'image/jpeg', 1024 * 1024))).toBeNull()
  })
  it('accepts PNG', () => {
    expect(validateFile(makeFile('a.png', 'image/png', 1024))).toBeNull()
  })
  it('accepts WebP', () => {
    expect(validateFile(makeFile('a.webp', 'image/webp', 1024))).toBeNull()
  })
  it('rejects GIF', () => {
    expect(validateFile(makeFile('a.gif', 'image/gif', 1024))?.code).toBe('type')
  })
  it('rejects HEIC', () => {
    expect(validateFile(makeFile('a.heic', 'image/heic', 1024))?.code).toBe('type')
  })
  it('rejects > 10MB', () => {
    expect(validateFile(makeFile('a.jpg', 'image/jpeg', 11 * 1024 * 1024))?.code).toBe('size')
  })
})
