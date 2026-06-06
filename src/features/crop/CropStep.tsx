import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { SpecLabel } from '@/components/decor/SpecLabel'

const ASPECTS = [
  { id: '1_1', ratio: 1 / 1, glyph: '1∶1' },
  { id: '2_1', ratio: 2 / 1, glyph: '2∶1' },
  { id: '1_2', ratio: 1 / 2, glyph: '1∶2' },
  { id: 'free', ratio: null as number | null, glyph: '∞' },
]

export function CropStep() {
  const { t } = useTranslation()
  const image = useAppStore((s) => s.image)
  const crop = useAppStore((s) => s.crop)
  const setCrop = useAppStore((s) => s.setCrop)
  const preprocess = useAppStore((s) => s.preprocess)
  const setBrightness = useAppStore((s) => s.setBrightness)
  const setContrast = useAppStore((s) => s.setContrast)
  const [aspect, setAspect] = useState('1_1')

  useEffect(() => {
    if (!image || !crop) return
    const a = ASPECTS.find((x) => x.id === aspect)
    if (!a?.ratio) return
    const maxW = image.width
    const maxH = image.height
    let w = crop.w
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

  if (!image || !crop) return null

  const previewStyle: React.CSSProperties = {
    aspectRatio: '1 / 1',
    backgroundImage: `url(${image.dataUrl})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundColor: 'var(--paper-2)',
    filter: `brightness(${1 + preprocess.brightness}) contrast(${1 + preprocess.contrast})`,
  }

  return (
    <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] animate-specimen-in">
      <div>
        <SpecLabel>SPEC №001 · ORIGINAL</SpecLabel>
        <div className="relative mt-4 border border-ink bg-paper-2">
          <CornerMarks inset={-1} size={14} />
          <div style={previewStyle} />
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-ink-2">
          {image.width} × {image.height} · {image.name}
        </p>
      </div>

      <div className="space-y-10">
        <div>
          <SpecLabel>{t('crop.aspect')}</SpecLabel>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspect(a.id)}
                className={`relative font-display text-xl py-3 border border-ink transition ${
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
