import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { go } from '@/app/navigation'
import { validateFile } from './validate'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { DotRow } from '@/components/decor/DotRow'
import { SpecLabel } from '@/components/decor/SpecLabel'

export function UploadStep() {
  const { t, i18n } = useTranslation()
  const setImage = useAppStore((s) => s.setImage)
  const setCrop = useAppStore((s) => s.setCrop)
  const [err, setErr] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isZh = i18n.language.startsWith('zh')

  async function handleFile(file: File) {
    const v = validateFile(file)
    if (v) {
      if (v.code === 'type') setErr(t('upload.err.type'))
      if (v.code === 'size') setErr(t('upload.err.size', { size: v.size }))
      return
    }
    setErr(null)
    try {
      const dataUrl = await readAsDataUrl(file)
      const dims = await imageSize(dataUrl)
      setImage({ dataUrl, width: dims.w, height: dims.h, name: file.name })
      const side = Math.min(dims.w, dims.h)
      setCrop({
        x: Math.floor((dims.w - side) / 2),
        y: Math.floor((dims.h - side) / 2),
        w: side,
        h: side,
      })
      go('crop')
    } catch {
      setErr(t('upload.err.decode'))
    }
  }

  const beadColors = ['#E63946', '#264653', '#E63946', '#E9C46A', '#E63946', '#2A9D8F', '#E63946', '#F4A261', '#E63946']

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1fr] items-center animate-specimen-in">
      <div>
        <SpecLabel>SPEC №000 · SOURCE INPUT</SpecLabel>
        <h2 className="mt-6 font-display font-black leading-[0.92] text-6xl md:text-7xl">
          {isZh ? (
            <>
              你想
              <br />
              <span className="text-accent">拼</span>什么？
            </>
          ) : (
            <>
              What will
              <br />
              you <span className="text-accent">bead</span>?
            </>
          )}
        </h2>
        <p className="mt-8 font-display-body text-base md:text-lg text-ink-2 max-w-md leading-relaxed">
          {isZh
            ? '一张图片，经由 CIEDE2000 色彩匹配与 Lab 空间抖动，转译为可拼的珠子图纸。'
            : 'One image, translated through CIEDE2000 color matching and Lab-space dithering into a beadable pattern.'}
        </p>
        <div className="mt-10 max-w-xs">
          <DotRow count={20} />
        </div>
      </div>

      <div className="relative">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) void handleFile(f)
          }}
          className={`relative bg-paper-2 border border-ink p-10 md:p-16 cursor-pointer transition-colors ${
            dragging ? 'bg-paper-3' : 'hover:bg-paper-3'
          }`}
        >
          <CornerMarks inset={-1} size={12} />
          <div className="flex flex-col items-center text-center gap-6">
            {/* Bead icon: 3x3 grid of dots */}
            <div className="grid grid-cols-3 gap-2">
              {beadColors.map((bg, i) => (
                <span
                  key={i}
                  className="block h-4 w-4 rounded-full border border-ink"
                  style={{ background: bg }}
                />
              ))}
            </div>
            <p className="font-display text-2xl md:text-3xl font-semibold">{t('upload.drop')}</p>
            <p className="font-mono text-[10px] uppercase tracking-label text-mute">
              {t('upload.formats')}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
          />
        </div>
        {err && (
          <p className="mt-4 border border-accent bg-paper p-3 font-mono text-[11px] text-accent">
            ✕ {err}
          </p>
        )}
      </div>
    </div>
  )
}

function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(f)
  })
}
function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}
