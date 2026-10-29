import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { go } from '@/app/navigation'
import { fitWithin, MAX_DECODED_PIXELS, MAX_SIDE, validateFile } from './validate'
import { cropForAspect } from '@/lib/image/crop'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { DotRow } from '@/components/decor/DotRow'
import { SpecLabel } from '@/components/decor/SpecLabel'

class ImageTooLargeError extends Error {
  readonly w: number
  readonly h: number
  constructor(w: number, h: number) {
    super(`image too large: ${w}x${h}`)
    this.w = w
    this.h = h
  }
}

export function UploadStep() {
  const { t } = useTranslation()
  const setImage = useAppStore((s) => s.setImage)
  const setCrop = useAppStore((s) => s.setCrop)
  const setCropAspect = useAppStore((s) => s.setCropAspect)
  const [err, setErr] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const v = validateFile(file)
    if (v) {
      if (v.code === 'type') setErr(t('upload.err.type'))
      if (v.code === 'size') setErr(t('upload.err.size', { size: v.size }))
      return
    }
    setErr(null)
    try {
      const { dataUrl, w, h } = await loadImage(file)
      setImage({ dataUrl, width: w, height: h, name: file.name })
      setCrop(cropForAspect(w, h, 1))
      setCropAspect('1_1')
      go('crop')
    } catch (e) {
      if (e instanceof ImageTooLargeError) setErr(t('upload.err.dimensions', { w: e.w, h: e.h }))
      else setErr(t('upload.err.decode'))
    }
  }

  const openPicker = () => inputRef.current?.click()

  const beadColors = ['#E63946', '#264653', '#E63946', '#E9C46A', '#E63946', '#2A9D8F', '#E63946', '#F4A261', '#E63946']

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1fr] items-center animate-specimen-in">
      <div>
        <SpecLabel>{t('upload.label')}</SpecLabel>
        <h2 className="mt-6 font-display font-black leading-[0.92] text-6xl md:text-7xl">
          {t('upload.headline.line1')}
          <br />
          {t('upload.headline.before')}
          <span className="text-accent">{t('upload.headline.accent')}</span>
          {t('upload.headline.after')}
        </h2>
        <p className="mt-8 font-display-body text-base md:text-lg text-ink-2 max-w-md leading-relaxed">
          {t('upload.intro')}
        </p>
        <div className="mt-10 max-w-xs">
          <DotRow count={20} />
        </div>
      </div>

      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          aria-label={t('upload.dropzone')}
          aria-describedby={err ? 'upload-error' : undefined}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openPicker()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={(e) => {
            // dragleave also fires when the pointer moves onto a child element;
            // only clear the highlight when it really leaves the drop zone.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) void handleFile(f)
          }}
          className={`relative bg-paper-2 border border-ink p-10 md:p-16 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
            dragging ? 'bg-paper-3' : 'hover:bg-paper-3'
          }`}
        >
          <CornerMarks inset={-1} size={12} />
          <div className="flex flex-col items-center text-center gap-6">
            {/* Bead icon: 3x3 grid of dots */}
            <div className="grid grid-cols-3 gap-2" aria-hidden>
              {beadColors.map((bg, i) => (
                <span
                  key={i}
                  className="block h-4 w-4 rounded-full border border-ink"
                  style={{ background: bg }}
                />
              ))}
            </div>
            <p className="font-display text-2xl md:text-3xl font-semibold">{t('upload.drop')}</p>
            <p className="font-mono text-[11px] uppercase tracking-label text-mute">
              {t('upload.formats')}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = '' // allow picking the same file again
              if (f) void handleFile(f)
            }}
          />
        </div>
        {err && (
          <p
            id="upload-error"
            role="alert"
            className="mt-4 border border-accent bg-paper p-3 font-mono text-[11px] text-accent"
          >
            ✕ {err}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Decode the file and return a data URL no larger than MAX_SIDE per side.
 * Oversized images are downscaled once here, so the crop preview and every
 * pattern generation work on a canvas-safe bitmap.
 */
async function loadImage(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  const dataUrl = await readAsDataUrl(file)
  const img = await decode(dataUrl)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w * h > MAX_DECODED_PIXELS) throw new ImageTooLargeError(w, h)
  const fit = fitWithin(w, h, MAX_SIDE)
  if (fit.w === w && fit.h === h) return { dataUrl, w, h }

  const canvas = document.createElement('canvas')
  canvas.width = fit.w
  canvas.height = fit.h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, fit.w, fit.h)
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
  return { dataUrl: canvas.toDataURL(type, 0.92), w: fit.w, h: fit.h }
}

function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(f)
  })
}

function decode(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}
