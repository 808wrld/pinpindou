import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { SpecLabel } from '@/components/decor/SpecLabel'
import {
  CROP_ASPECTS,
  MAX_CROP_ZOOM,
  aspectRatio,
  cropForAspect,
  cropZoom,
  moveCrop,
  type CropAspectId,
  type CropRect,
} from '@/lib/image/crop'

const MAX_FRAME = 400

type DragState = { pointerId: number; x: number; y: number; crop: CropRect }

export function CropStep() {
  const { t } = useTranslation()
  const image = useAppStore((s) => s.image)
  const crop = useAppStore((s) => s.crop)
  const setCrop = useAppStore((s) => s.setCrop)
  const aspect = useAppStore((s) => s.cropAspect)
  const setCropAspect = useAppStore((s) => s.setCropAspect)
  const preprocess = useAppStore((s) => s.preprocess)
  const setBrightness = useAppStore((s) => s.setBrightness)
  const setContrast = useAppStore((s) => s.setContrast)

  // Responsive frame: observes the grid so the preview shrinks on narrow
  // viewports without breaking the overlay coordinates.
  const colRef = useRef<HTMLDivElement | null>(null)
  const [frame, setFrame] = useState(MAX_FRAME)
  useLayoutEffect(() => {
    const el = colRef.current
    if (!el) return
    const update = () => setFrame(Math.min(MAX_FRAME, el.clientWidth))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dragRef = useRef<DragState | null>(null)

  if (!image || !crop) return null

  const imgRatio = image.width / image.height
  let renderedW: number, offsetX: number, offsetY: number
  if (imgRatio >= 1) {
    renderedW = frame
    const renderedH = frame / imgRatio
    offsetX = 0
    offsetY = (frame - renderedH) / 2
  } else {
    renderedW = frame * imgRatio
    offsetX = (frame - renderedW) / 2
    offsetY = 0
  }
  const scale = renderedW / image.width

  // Crop overlay region (in frame px).
  const ovLeft = offsetX + crop.x * scale
  const ovTop = offsetY + crop.y * scale
  const ovW = crop.w * scale
  const ovH = crop.h * scale

  const ratio = aspectRatio(aspect)
  const zoom = cropZoom(crop, image.width, image.height, ratio)

  const selectAspect = (id: CropAspectId) => {
    setCropAspect(id)
    setCrop(cropForAspect(image.width, image.height, aspectRatio(id)))
  }
  const setZoom = (z: number) => {
    const center = { x: crop.x + crop.w / 2, y: crop.y + crop.h / 2 }
    setCrop(cropForAspect(image.width, image.height, ratio, z, center))
  }
  const endDrag = (pointerId: number) => {
    if (dragRef.current?.pointerId === pointerId) dragRef.current = null
  }

  // NOTE on C1 (preview ↔ worker math mismatch): the CSS `filter` and the
  // worker's `applyBrightnessContrast` use slightly different normalizations.
  // The visual mismatch is small at normal slider values; revisit with a
  // canvas-based preview once we have a reliable in-page <canvas> draw path.
  const previewStyle: React.CSSProperties = {
    width: frame,
    height: frame,
    backgroundImage: `url(${image.dataUrl})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundColor: 'var(--paper-2)',
    filter: `brightness(${1 + preprocess.brightness}) contrast(${1 + preprocess.contrast})`,
  }

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_1fr] animate-specimen-in" ref={colRef}>
      <div>
        <SpecLabel>{t('crop.label.original')}</SpecLabel>
        <div className="relative mt-4 border border-ink bg-paper-2" style={{ width: frame, height: frame }}>
          <CornerMarks inset={-1} size={14} />
          <div style={previewStyle} />
          {/* Crop region + dimmed surround. Drag it (mouse / touch / pen) or
              focus it and use the arrow keys (Shift = bigger steps). */}
          <div
            role="group"
            tabIndex={0}
            aria-label={t('crop.area')}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              dragRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, crop }
            }}
            onPointerMove={(e) => {
              const d = dragRef.current
              if (!d || d.pointerId !== e.pointerId) return
              const dx = (e.clientX - d.x) / scale
              const dy = (e.clientY - d.y) / scale
              setCrop(moveCrop(d.crop, dx, dy, image.width, image.height))
            }}
            onPointerUp={(e) => endDrag(e.pointerId)}
            onPointerCancel={(e) => endDrag(e.pointerId)}
            onKeyDown={(e) => {
              const step = Math.max(1, Math.round(crop.w / 20)) * (e.shiftKey ? 5 : 1)
              const moves: Record<string, [number, number]> = {
                ArrowLeft: [-step, 0],
                ArrowRight: [step, 0],
                ArrowUp: [0, -step],
                ArrowDown: [0, step],
              }
              const move = moves[e.key]
              if (!move) return
              e.preventDefault()
              setCrop(moveCrop(crop, move[0], move[1], image.width, image.height))
            }}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{
              position: 'absolute',
              left: ovLeft,
              top: ovTop,
              width: ovW,
              height: ovH,
              border: '1.5px solid var(--accent)',
              boxShadow: '0 0 0 9999px rgba(247, 241, 227, 0.55)',
              cursor: 'move',
              touchAction: 'none',
            }}
          />
          {/* Four corner ticks on the crop rectangle */}
          {(
            [
              { left: ovLeft - 4, top: ovTop - 4 },
              { left: ovLeft + ovW - 4, top: ovTop - 4 },
              { left: ovLeft - 4, top: ovTop + ovH - 4 },
              { left: ovLeft + ovW - 4, top: ovTop + ovH - 4 },
            ] as const
          ).map((p, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: p.left,
                top: p.top,
                width: 8,
                height: 8,
                border: '1.5px solid var(--accent)',
                background: 'var(--paper)',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-ink-2">
          {image.width} × {image.height} · {image.name} →{' '}
          <span className="text-accent">
            {crop.w} × {crop.h}
          </span>
        </p>
        <p className="mt-1 font-mono text-[11px] tracking-label text-mute">{t('crop.hint')}</p>
      </div>

      <div className="space-y-10">
        <div>
          <SpecLabel>{t('crop.aspect')}</SpecLabel>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {CROP_ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={aspect === a.id}
                onClick={() => selectAspect(a.id)}
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
              <SpecLabel>{t('crop.zoom')}</SpecLabel>
              <span className="font-mono text-xs text-ink">{zoom.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              aria-label={t('crop.zoom')}
              min={1}
              max={MAX_CROP_ZOOM}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </div>

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
              aria-label={t('crop.brightness')}
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
              aria-label={t('crop.contrast')}
              min={-1}
              max={1}
              step={0.05}
              value={preprocess.contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setBrightness(0)
            setContrast(0)
            selectAspect('1_1')
          }}
          className="font-mono text-[11px] uppercase tracking-label text-mute hover:text-accent"
        >
          ↻ {t('crop.reset')}
        </button>
      </div>
    </div>
  )
}
