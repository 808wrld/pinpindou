import { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas } from '@/features/preview/PatternCanvas'
import { buildSymbolMap } from '@/features/preview/symbols'
import { BomTable } from '@/features/bom/BomTable'
import { generatePattern } from '@/lib/pattern/generate'
import { loadPalette } from '@/lib/pattern/loadPalette'
import { patternDims } from '@/lib/pattern/dims'
import type { Palette } from '@/lib/pattern/types'
import { SpecLabel } from '@/components/decor/SpecLabel'
import { InfoTip } from '@/components/decor/InfoTip'
import { PreviewPaper, ToggleGroup } from '@/features/preview/PreviewPaper'
import { StatCards } from '@/features/preview/StatCards'
import { usePreviewScale } from '@/features/preview/usePreviewScale'
import { PALETTE_IDS, PALETTE_LABELS, ditherLabel } from '@/features/preview/paletteLabels'

const SIZE_PRESETS = [16, 29, 48, 58, 64] as const
const SYMBOLS_CELL_PX = 20
const SOLID_CELL_PX = 14

type RenderMode = 'symbols' | 'solid'

const TIP_COMPONENTS = { b: <b />, accent: <b className="text-accent" /> }

/** Paragraphs of an InfoTip, rendered from i18n keys `${prefix}.p1…pN` + `${prefix}.note`. */
function TipBody({ prefix, paragraphs, withNote }: { prefix: string; paragraphs: number; withNote: boolean }) {
  return (
    <>
      {Array.from({ length: paragraphs }, (_, i) => (
        <p key={i} className={i === 0 ? 'mb-2' : i < paragraphs - 1 ? 'mb-1.5' : ''}>
          <Trans i18nKey={`${prefix}.p${i + 1}`} components={TIP_COMPONENTS} />
        </p>
      ))}
      {withNote && (
        <p className="mt-2 text-paper-3">
          <Trans i18nKey={`${prefix}.note`} components={TIP_COMPONENTS} />
        </p>
      )}
    </>
  )
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
  const [renderMode, setRenderMode] = useState<RenderMode>('symbols')
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const timer = useRef<number | null>(null)
  // Incremented whenever the inputs change; a generation whose id is no
  // longer current is discarded, so a slow run for old settings can never
  // overwrite the result for newer ones.
  const generation = useRef(0)
  const isZh = i18n.language.startsWith('zh')

  // Size preset = long side; the short side follows the crop aspect.
  const dims = patternDims(tune.targetW, crop ?? { w: 1, h: 1 })

  useEffect(() => {
    void loadPalette(tune.paletteId).then(setPalette)
  }, [tune.paletteId])

  useEffect(() => {
    if (!image || !crop || !palette) return
    const id = ++generation.current
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      setBusy(true)
      try {
        const res = await generatePattern({
          imageDataUrl: image.dataUrl,
          srcW: image.width,
          srcH: image.height,
          crop,
          brightness: preprocess.brightness,
          contrast: preprocess.contrast,
          targetW: dims.w,
          targetH: dims.h,
          palette,
          ditherMode: tune.dither,
          colorCap: tune.colorCap,
        })
        if (id !== generation.current) return
        if ('cells' in res) {
          setCells(res.cells)
          setErrMsg(null)
        } else {
          // I3: don't leave stale cells on top of new failing settings — clear and surface
          setCells(null)
          setErrMsg(res.error)
          console.error('Pattern generation failed:', res.error)
        }
      } catch (err) {
        if (id !== generation.current) return
        setCells(null)
        setErrMsg(err instanceof Error ? err.message : String(err))
        console.error('Pattern generation failed:', err)
      } finally {
        if (id === generation.current) setBusy(false)
      }
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, crop, preprocess, tune, palette])

  const symbolMap = useMemo(
    () => (cells ? buildSymbolMap(cells) : new Map<number, string>()),
    [cells],
  )
  const colorsUsed = symbolMap.size

  const naturalCellSize = renderMode === 'symbols' ? SYMBOLS_CELL_PX : SOLID_CELL_PX
  const naturalWidth = (cells?.[0]?.length ?? dims.w) * naturalCellSize
  const { ref: previewWrapRef, scalePct } = usePreviewScale(naturalWidth, [cells])

  if (!image || !crop) return null

  const beads = dims.w * dims.h
  const paletteSize = palette?.colors.length ?? 30
  const cap = tune.colorCap ?? paletteSize
  const dLabel = ditherLabel(tune.dither, isZh)
  const paletteLabel = PALETTE_LABELS[tune.paletteId][isZh ? 'zh-CN' : 'en']
  const modeLabel = renderMode === 'symbols' ? t('mode.symbols') : t('mode.solid')

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr] animate-specimen-in">
      {/* Left control rail */}
      <div className="space-y-7">
        <ControlGroup label={t('tune.size')}>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_PRESETS.map((s) => {
              const d = patternDims(s, crop)
              const active = tune.targetW === s
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTune({ targetW: s, targetH: s })}
                  className={`font-display text-base py-2.5 border border-ink ${
                    active ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'
                  }`}
                >
                  {d.w}
                  <span className="text-mute mx-0.5">×</span>
                  {d.h}
                </button>
              )
            })}
          </div>
        </ControlGroup>

        <ControlGroup
          label={
            <>
              {t('tune.palette')}
              <InfoTip label={t('tip.palette.label')}>
                <TipBody prefix="tip.palette" paragraphs={4} withNote />
              </InfoTip>
            </>
          }
        >
          <select
            value={tune.paletteId}
            aria-label={t('tune.palette')}
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

        <ControlGroup
          label={
            <>
              {t('tune.colorCap')} · {cap}
              <InfoTip label={t('tip.colorCap.label')}>
                <TipBody prefix="tip.colorCap" paragraphs={4} withNote />
              </InfoTip>
            </>
          }
        >
          <input
            type="range"
            aria-label={t('tune.colorCap')}
            min={4}
            max={paletteSize}
            step={1}
            value={cap}
            onChange={(e) => setTune({ colorCap: parseInt(e.target.value, 10) })}
          />
          <div className="mt-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-label text-mute">
            <span>4</span>
            <button type="button" onClick={() => setTune({ colorCap: null })} className="hover:text-accent">
              {t('tune.colorCap.unlimited')}
            </button>
            <span>{paletteSize}</span>
          </div>
        </ControlGroup>

        <ControlGroup
          label={
            <>
              {t('tune.dither')}
              <InfoTip label={t('tip.dither.label')}>
                <TipBody prefix="tip.dither" paragraphs={4} withNote={false} />
              </InfoTip>
            </>
          }
        >
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'floyd-steinberg', 'ordered-4x4'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={tune.dither === m}
                onClick={() => setTune({ dither: m })}
                className={`font-mono text-[11px] uppercase tracking-label py-2.5 border border-ink ${
                  tune.dither === m ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'
                }`}
              >
                {m === 'floyd-steinberg' ? 'F-S' : m === 'none' ? t('tune.dither.none') : 'BAYER'}
              </button>
            ))}
          </div>
        </ControlGroup>
      </div>

      {/* Right: preview panel */}
      <div className="space-y-5">
        <div className="flex items-baseline justify-between">
          <SpecLabel>{t('tune.previewLabel')}</SpecLabel>
          <span className="font-mono text-[11px] uppercase tracking-label text-mute">
            {t('tune.summary', { w: dims.w, h: dims.h, beads: beads.toLocaleString(), colors: colorsUsed })}
          </span>
        </div>

        <StatCards
          entries={[
            { label: t('stats.size'), value: `${dims.w}×${dims.h}`, sub: t('stats.size.sub') },
            { label: t('stats.beads'), value: beads.toLocaleString(), sub: t('stats.beads.sub') },
            { label: t('stats.colors'), value: `${colorsUsed}`, sub: t('stats.colors.subCap', { cap }) },
            { label: t('stats.mode'), value: modeLabel, sub: t('stats.mode.sub', { pct: scalePct, dither: dLabel }) },
          ]}
        />

        <PreviewPaper
          title={t('preview.full')}
          subtitle={t('preview.fitSub', { palette: paletteLabel })}
          scalePct={scalePct}
          contentRef={previewWrapRef}
          controls={
            <ToggleGroup<RenderMode>
              value={renderMode}
              onChange={setRenderMode}
              options={[
                { value: 'symbols', label: t('toggle.symbols') },
                { value: 'solid', label: t('toggle.solid') },
              ]}
            />
          }
        >
          {cells && palette ? (
            <div className="border-[2px] border-ink overflow-hidden inline-block max-w-full">
              <PatternCanvas
                cells={cells}
                palette={palette}
                cellSize={naturalCellSize}
                showGrid
                showSymbols={renderMode === 'symbols'}
                symbolMap={symbolMap}
              />
            </div>
          ) : (
            <div
              className="h-64 flex items-center justify-center text-mute font-mono text-xs uppercase tracking-label"
              role="status"
            >
              {errMsg ? `✕ ${errMsg}` : busy ? t('tune.generating') : t('tune.waiting')}
            </div>
          )}
        </PreviewPaper>

        {cells && palette && <BomTable cells={cells} palette={palette} symbolMap={symbolMap} />}
      </div>
    </div>
  )
}

function ControlGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <SpecLabel>{label}</SpecLabel>
      <div className="mt-3">{children}</div>
    </div>
  )
}
