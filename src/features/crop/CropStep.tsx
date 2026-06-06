import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'

const ASPECTS = [
  { id: '1_1', ratio: 1 / 1 },
  { id: '2_1', ratio: 2 / 1 },
  { id: '1_2', ratio: 1 / 2 },
  { id: 'free', ratio: null as number | null },
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
    width: 320,
    height: 320,
    backgroundImage: `url(${image.dataUrl})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    filter: `brightness(${1 + preprocess.brightness}) contrast(${1 + preprocess.contrast})`,
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      <div style={previewStyle} className="rounded border bg-slate-100" />
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">{t('crop.aspect')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspect(a.id)}
                className={`rounded border px-3 py-1 text-xs ${aspect === a.id ? 'bg-slate-900 text-white' : 'bg-white'}`}
              >
                {t(`crop.aspect.${a.id}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm">
            {t('crop.brightness')} ({preprocess.brightness.toFixed(2)})
          </label>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={preprocess.brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm">
            {t('crop.contrast')} ({preprocess.contrast.toFixed(2)})
          </label>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={preprocess.contrast}
            onChange={(e) => setContrast(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <button
          onClick={() => {
            setBrightness(0)
            setContrast(0)
            setAspect('1_1')
          }}
          className="rounded border px-3 py-1 text-xs"
        >
          {t('crop.reset')}
        </button>
      </div>
    </div>
  )
}
