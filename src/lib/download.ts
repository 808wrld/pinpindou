/**
 * Save a Blob as a file. The temporary link is attached to the document
 * (Firefox ignores clicks on detached links) and the object URL is revoked
 * a little later — revoking it in the same tick as click() can cancel the
 * download in Safari and Firefox.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
