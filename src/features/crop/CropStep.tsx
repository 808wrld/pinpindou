import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { SpecLabel } from '@/components/decor/SpecLabel'
import { applyBrightnessContrast } from '@/lib/image/brightnessContrast'

// I6: dropped the '∞ free' chip — it was a dead button (clicking it changed
// active state but did nothing visible because the centering effect bails
// when ratio is null, and there's no drag UI yet). v2 will bring back a
// free-form crop with handles.
const ASPECTS = [
  { id: '1_1', ratio: 1 / 1, glyph: '1∶1' },
  { id: '2_1', ratio: 2 / 1, glyph: '2∶1' },
  { id: '1_2', ratio: 1 / 2, glyph: '1∶2' },
]

const MAX_FRAME = 400

export function CropStep() {
  const { t } = useTranslation()
  const image = useAppStore((s) => s.image)
  const crop = useAppStore((s) => s.crop)
  const setCrop = useAppStore((s) => s.setCrop)
  const preprocess = useAppStore((s) => s.preprocess)
  const setBrightness = useAppStore((s) => s.setBrightness)
  const setContrast = useAppStore((s) => s.setContrast)
  const [aspect, setAspect] = useState('1_1')

  // I5: frame size derived from container width, capped at MAX_FRAME.
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [frame, setFrame] = useState(MAX_FRAME)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setFrame(Math.min(MAX_FRAME, el.clientWidth))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!image || !crop) return
    const a = ASPECTS.find((x) => x.id === aspect)
    if (!a) return
    const maxW = image.width
    const maxH = image.height
    let w = Math.min(maxW, maxH * a.ratio)
    let h = w / a.ratio
    if (h > maxH) {
      h = maxH
      w = h * a.ratio
    }
    const x = Math.max(0, Math.floor((maxW - w) / 2))
    const y = Math.max(0, Math.floor((maxH - h) / 2))
    setCrop({ x, y, w: Math.floor(w), h: Math.floor(h) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, image])

  // C1: preview canvas runs the SAME brightness/contrast math as the worker
  // pipeline, so what the user sees matches what gets quantized downstream.
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas || !image) return
    canvas.width = frame
    canvas.height = frame
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#EFE7D2' // paper-2
    ctx.fillRect(0, 0, frame, frame)
    const img = new Image()
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight
      let dw: number, dh: number, dx: number, dy: number
      if (ratio >= 1) {
        dw = frame
        dh = frame / ratio
        dx = 0
        dy = (frame - dh) / 2
      } else {
        dh = frame
        dw = frame * ratio
        dx = (frame - dw) / 2
        dy = 0
      }
      ctx.fillStyle = '#EFE7D2'
      ctx.fillRect(0, 0, frame, frame)
      ctx.drawImage(img, dx, dy, dw, dh)
      if (preprocess.brightness !== 0 || preprocess.contrast !== 0) {
        const imageData = ctx.getImageData(0, 0, frame, frame)
        applyBrightnessContrast(imageData.data, preprocess.brightness, preprocess.contrast)
        ctx.putImageData(imageData, 0, 0)
      }
    }
    img.src = image.dataUrl
  }, [image, preprocess.brightness, preprocess.contrast, frame])

  if (!image || !crop) return null

  // Crop overlay coords: where the source image actually sits inside the frame,
  // and where the crop rectangle sits inside that.
  const imgRatio = image.width / image.height
  let renderedW: number, renderedH: number, offsetX: number, offsetY: number
  if (imgRatio >= 1) {
    renderedW = frame
    renderedH = frame / imgRatio
    offsetX = 0
    offsetY = (frame - renderedH) / 2
  } else {
    renderedH = frame
    renderedW = frame * imgRatio
    offsetX = (frame - renderedW) / 2
    offsetY = 0
  }
  const scale = renderedW / image.width

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: offsetX + crop.x * scale,
    top: offsetY + crop.y * scale,
    width: crop.w * scale,
    height: crop.h * scale,
    border: '1.5px solid var(--accent)',
    boxShadow: '0 0 0 9999px rgba(247, 241, 227, 0.55)',
    pointerEvents: 'none',
  }

  return (
    <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] animate-specimen-in">
      <div>
        <SpecLabel>SPEC №001 · ORIGINAL</SpecLabel>
        <div ref={wrapRef} className="relative mt-4 inline-block border border-ink bg-paper-2 overflow-hidden" style={{ width: frame, height: frame }}>
          <CornerMarks inset={-1} size={14} />
          <canvas
            ref={previewCanvasRef}
            style={{ width: frame, height: frame, display: 'block', position: 'absolute', inset: 0 }}
          />
          <div style={overlayStyle} />
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <span
              key={c}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                border: '1.5px solid var(--accent)',
                background: 'var(--paper)',
                pointerEvents: 'none',
                [c.includes('t') ? 'top' : 'bottom']:
                  (c.includes('t') ? overlayStyle.top : undefined) ??
                  (c.includes('t')
                    ? undefined
                    : `calc(100% - ${Number(overlayStyle.top) + Number(overlayStyle.height)}px - 5px)`),
                [c.includes('l') ? 'left' : 'right']:
                  c.includes('l') ? Number(overlayStyle.left) - 4 : undefined,
                ...(c === 'tl' && { top: Number(overlayStyle.top) - 4, left: Number(overlayStyle.left) - 4 }),
                ...(c === 'tr' && { top: Number(overlayStyle.top) - 4, left: Number(overlayStyle.left) + Number(overlayStyle.width) - 4 }),
                ...(c === 'bl' && { top: Number(overlayStyle.top) + Number(overlayStyle.height) - 4, left: Number(overlayStyle.left) - 4 }),
                ...(c === 'br' && { top: Number(overlayStyle.top) + Number(overlayStyle.height) - 4, left: Number(overlayStyle.left) + Number(overlayStyle.width) - 4 }),
              }}
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-ink-2">
          {image.width} × {image.height} · {image.name} →{' '}
          <span className="text-accent">
            {crop.w} × {crop.h}
          </span>
        </p>
      </div>

      <div className="space-y-10">
        <div>
          <SpecLabel>{t('crop.aspect')}</SpecLabel>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspect(a.id)}
                className={`relative font-display text-2xl py-3 border border-ink transition ${
                  aspect === a.id ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'
                }`}
              >
                {a.glyph}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SpecLabel>{t('crop.brightness')}</SpecLabel>
              <span className="font-mono text-xs text-ink">
                {preprocess.brightness >= 0 ? '+' : ''}
                {preprocess.brightness.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={preprocess.brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SpecLabel>{t('crop.contrast')}</SpecLabel>
              <span className="font-mono text-xs text-ink">
                {preprocess.contrast >= 0 ? '+' : ''}
                {preprocess.contrast.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={preprocess.contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <button
          onClick={() => {
            setBrightness(0)
            setContrast(0)
            setAspect('1_1')
          }}
          className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-accent"
        >
          ↻ {t('crop.reset')}
        </button>
      </div>
    </div>
  )
}
