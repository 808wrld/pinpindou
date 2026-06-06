import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { generatePattern } from '@/lib/pattern/generate'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { SpecLabel } from '@/components/decor/SpecLabel'

const SIZE_PRESETS = [16, 29, 48, 58, 64] as const
const PALETTE_IDS = ['manyoujiang', 'perler', 'hama'] as const
const PALETTE_LABELS: Record<(typeof PALETTE_IDS)[number], { 'zh-CN': string; en: string }> = {
  manyoujiang: { 'zh-CN': '漫游酱', en: 'Manyou' },
  perler: { 'zh-CN': 'Perler', en: 'Perler' },
  hama: { 'zh-CN': 'Hama', en: 'Hama' },
}

export function TuneStep() {
  const { t, i18n } = useTranslation()
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
  const isZh = i18n.language.startsWith('zh')

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
        colorCap: tune.colorCap,
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

  const ditherLabel =
    tune.dither === 'floyd-steinberg' ? 'F-S' : tune.dither === 'ordered-4x4' ? 'BAYER' : 'NONE'
  const paletteLabel = PALETTE_LABELS[tune.paletteId][isZh ? 'zh-CN' : 'en']

  const beads = tune.targetW * tune.targetH
  const colorsUsed = useMemo(() => {
    if (!cells) return 0
    const s = new Set<number>()
    for (const row of cells) for (const c of row) s.add(c)
    return s.size
  }, [cells])

  const paletteSize = palette?.colors.length ?? 30
  const cap = tune.colorCap ?? paletteSize

  return (
    <div className="grid gap-10 md:grid-cols-[280px_1fr] animate-specimen-in">
      {/* Left control rail */}
      <div className="space-y-8">
        <ControlGroup label={t('tune.size')}>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => setTune({ targetW: s, targetH: s })}
                className={`font-display font-medium text-base py-2.5 border border-ink ${
                  tune.targetW === s ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'
                }`}
              >
                {s}
                <span className="text-mute mx-0.5">×</span>
                {s}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label={t('tune.palette')}>
          <select
            value={tune.paletteId}
            onChange={(e) => setTune({ paletteId: e.target.value as (typeof PALETTE_IDS)[number] })}
            className="spec-select w-full"
          >
            {PALETTE_IDS.map((id) => (
              <option key={id} value={id}>
                {PALETTE_LABELS[id][isZh ? 'zh-CN' : 'en']}
              </option>
            ))}
          </select>
        </ControlGroup>

        <ControlGroup label={`${t('tune.colorCap')} · ${cap}`}>
          <input
            type="range"
            min={4}
            max={paletteSize}
            step={1}
            value={cap}
            onChange={(e) => setTune({ colorCap: parseInt(e.target.value, 10) })}
          />
          <div className="mt-2 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-label text-mute">
            <span>4</span>
            <button
              onClick={() => setTune({ colorCap: null })}
              className="hover:text-accent"
            >
              {t('tune.colorCap.unlimited')}
            </button>
            <span>{paletteSize}</span>
          </div>
        </ControlGroup>

        <ControlGroup label={t('tune.dither')}>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'floyd-steinberg', 'ordered-4x4'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTune({ dither: m })}
                className={`font-mono text-[10px] uppercase tracking-label py-2.5 border border-ink ${
                  tune.dither === m ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'
                }`}
              >
                {m === 'floyd-steinberg' ? 'F-S' : m === 'none' ? t('tune.dither.none') : 'BAYER'}
              </button>
            ))}
          </div>
        </ControlGroup>
      </div>

      {/* Right: stats + preview + BOM */}
      <div className="space-y-6">
        {/* Stats cards — dimensions / beads / colors / mode */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border border-ink">
          <StatCard label={t('tune.size')} value={`${tune.targetW}×${tune.targetH}`} />
          <StatCard label={isZh ? '豆数' : 'BEADS'} value={beads.toLocaleString()} />
          <StatCard
            label={isZh ? '颜色' : 'COLORS'}
            value={`${colorsUsed}`}
            sub={cap < paletteSize ? `≤ ${cap}` : isZh ? '不限' : 'free'}
          />
          <StatCard label={t('tune.dither')} value={ditherLabel} />
        </div>

        <div className="flex items-baseline justify-between">
          <SpecLabel>{t('tune.preview')}</SpecLabel>
          <span className="font-mono text-[10px] uppercase tracking-label text-mute">
            {busy ? '◌ generating' : '● ready'}
          </span>
        </div>

        {cells && palette && (
          <div className="relative inline-block bg-paper-2 border border-ink p-4 md:p-6 max-w-full">
            <CornerMarks inset={-1} size={14} />
            <div className="overflow-auto">
              <PatternCanvas
                cells={cells}
                palette={palette}
                cellSize={Math.max(8, Math.floor(560 / cells[0].length))}
              />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-ink-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>SPEC №001</span>
              <span className="text-rule">·</span>
              <span>
                {tune.targetW} × {tune.targetH}
              </span>
              <span className="text-rule">·</span>
              <span>{paletteLabel}</span>
              <span className="text-rule">·</span>
              <span>{ditherLabel}</span>
            </p>
          </div>
        )}

        {cells && palette && <BomTable cells={cells} palette={palette} />}
      </div>
    </div>
  )
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SpecLabel>{label}</SpecLabel>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-paper-2 p-4 md:p-5">
      <div className="font-mono text-[10px] uppercase tracking-label text-mute">{label}</div>
      <div className="mt-2 font-display text-3xl md:text-4xl leading-none text-ink">{value}</div>
      {sub && <div className="mt-1 font-mono text-[10px] uppercase tracking-label text-mute">{sub}</div>}
    </div>
  )
}
