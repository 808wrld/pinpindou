import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { generatePattern } from '@/lib/pattern/generate'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'

const SIZE_PRESETS = [16, 29, 48, 58, 64] as const
const PALETTE_IDS = ['manyoujiang', 'perler', 'hama'] as const

export function TuneStep() {
  const { t } = useTranslation()
  const image = useAppStore((s) => s.image)
  const crop = useAppStore((s) => s.crop)
  const preprocess = useAppStore((s) => s.preprocess)
  const tune = useAppStore((s) => s.tune)
  const setTune = useAppStore((s) => s.setTune)
  const setCells = useAppStore((s) => s.setCells)
  const cells = useAppStore((s) => s.cells)
  const [palette, setPalette] = useState<Palette | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    void loadPalette(tune.paletteId).then(setPalette)
  }, [tune.paletteId])

  useEffect(() => {
    if (!image || !crop || !palette) return
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      setBusy(true)
      const res = await generatePattern({
        imageDataUrl: image.dataUrl,
        srcW: image.width,
        srcH: image.height,
        crop,
        brightness: preprocess.brightness,
        contrast: preprocess.contrast,
        targetW: tune.targetW,
        targetH: tune.targetH,
        palette,
        ditherMode: tune.dither,
      })
      if ('cells' in res) setCells(res.cells)
      setBusy(false)
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, crop, preprocess, tune, palette])

  if (!image || !crop) return null

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[260px_1fr]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">{t('tune.size')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZE_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => setTune({ targetW: s, targetH: s })}
                className={`rounded border px-3 py-1 text-xs ${
                  tune.targetW === s && tune.targetH === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-white'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">{t('tune.palette')}</p>
          <select
            value={tune.paletteId}
            onChange={(e) =>
              setTune({ paletteId: e.target.value as (typeof PALETTE_IDS)[number] })
            }
            className="mt-2 w-full rounded border px-2 py-1 text-sm"
          >
            {PALETTE_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-sm font-medium">{t('tune.dither')}</p>
          <div className="mt-2 flex gap-2">
            {(['none', 'floyd-steinberg', 'ordered-4x4'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTune({ dither: m })}
                className={`rounded border px-3 py-1 text-xs ${
                  tune.dither === m ? 'bg-slate-900 text-white' : 'bg-white'
                }`}
              >
                {m === 'floyd-steinberg'
                  ? t('tune.dither.fs')
                  : m === 'none'
                    ? t('tune.dither.none')
                    : t('tune.dither.ordered')}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{t('tune.preview')}</span>
          {busy && <span className="text-xs text-slate-400">…</span>}
        </div>
        {cells && palette && <PatternCanvas cells={cells} palette={palette} />}
        {cells && palette && <BomTable cells={cells} palette={palette} />}
      </div>
    </div>
  )
}
