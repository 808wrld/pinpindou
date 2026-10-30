import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { go } from '@/app/navigation'
import { PatternCanvas } from '@/features/preview/PatternCanvas'
import { buildSymbolMap } from '@/features/preview/symbols'
import { BomTable } from '@/features/bom/BomTable'
import { downloadPatternPng } from './downloadPng'
import { downloadPatternPdf } from './downloadPdf'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'
import { SpecLabel } from '@/components/decor/SpecLabel'
import { PreviewPaper, ToggleGroup } from '@/features/preview/PreviewPaper'
import { StatCards } from '@/features/preview/StatCards'
import { usePreviewScale } from '@/features/preview/usePreviewScale'
import { PALETTE_LABELS, ditherLabel } from '@/features/preview/paletteLabels'
import { computeBomWithTotal } from '@/features/bom/computeBom'

const SYMBOLS_CELL_PX = 20
const SOLID_CELL_PX = 14

type RenderMode = 'symbols' | 'solid'
type SourceView = 'pattern' | 'original'
type ExportKind = 'pdf' | 'png'

export function ExportStep() {
  const { t, i18n } = useTranslation()
  const cells = useAppStore((s) => s.cells)
  const tune = useAppStore((s) => s.tune)
  const image = useAppStore((s) => s.image)
  // Use the palette the cells were generated with, which can differ from
  // tune.paletteId if the palette was switched just before leaving Tune.
  const paletteId = useAppStore((s) => s.cellsPaletteId) ?? tune.paletteId
  const [palette, setPalette] = useState<Palette | null>(null)
  const [renderMode, setRenderMode] = useState<RenderMode>('symbols')
  const [sourceView, setSourceView] = useState<SourceView>('pattern')
  const [exporting, setExporting] = useState<ExportKind | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'
  const isZh = lang === 'zh-CN'

  useEffect(() => {
    void loadPalette(paletteId).then(setPalette)
  }, [paletteId])

  const symbolMap = useMemo(
    () => (cells ? buildSymbolMap(cells) : new Map<number, string>()),
    [cells],
  )
  const naturalCellSize = renderMode === 'symbols' ? SYMBOLS_CELL_PX : SOLID_CELL_PX
  const naturalWidth = (cells?.[0]?.length ?? tune.targetW) * naturalCellSize
  const { ref: previewWrapRef, scalePct } = usePreviewScale(naturalWidth, [cells, sourceView])

  if (!image) return null
  if (!cells || cells.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center animate-specimen-in" role="status">
        <p className="font-mono text-xs uppercase tracking-label text-mute">{t('export.empty')}</p>
        <button
          type="button"
          onClick={() => go('tune')}
          className="font-mono text-xs uppercase tracking-label px-4 py-2 border border-ink hover:bg-paper-2"
        >
          ← {t('export.backToTune')}
        </button>
      </div>
    )
  }
  if (!palette || palette.id !== paletteId) return null

  // The grid size is whatever was generated (the short side follows the crop).
  const gridW = cells[0].length
  const gridH = cells.length
  const { total } = computeBomWithTotal(cells)
  const dLabel = ditherLabel(tune.dither, isZh)
  const paletteLabel = PALETTE_LABELS[paletteId][lang]
  const colorsUsed = symbolMap.size
  const modeLabel =
    sourceView === 'original'
      ? t('mode.original')
      : renderMode === 'symbols'
        ? t('mode.symbols')
        : t('mode.solid')

  async function runExport(kind: ExportKind) {
    if (!cells || !palette || exporting) return
    setExporting(kind)
    setExportError(null)
    try {
      if (kind === 'pdf') await downloadPatternPdf(cells, palette, lang)
      else await downloadPatternPng(cells, palette)
    } catch (err) {
      console.error('Export failed:', err)
      setExportError(t('export.error', { message: err instanceof Error ? err.message : String(err) }))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px] animate-specimen-in">
      {/* LEFT: header + stats + preview + legend */}
      <div className="space-y-5">
        <div className="flex items-baseline justify-between">
          <SpecLabel>{t('tune.previewLabel')}</SpecLabel>
          <span className="font-mono text-[11px] uppercase tracking-label text-mute">
            {t('tune.summary', { w: gridW, h: gridH, beads: total.toLocaleString(), colors: colorsUsed })}
          </span>
        </div>

        <StatCards
          entries={[
            { label: t('stats.size'), value: `${gridW}×${gridH}`, sub: t('stats.size.sub') },
            { label: t('stats.beads'), value: total.toLocaleString(), sub: t('stats.beads.sub') },
            { label: t('stats.colors'), value: `${colorsUsed}`, sub: t('stats.colors.sub') },
            { label: t('stats.mode'), value: modeLabel, sub: t('stats.mode.sub', { pct: scalePct, dither: dLabel }) },
          ]}
        />

        <PreviewPaper
          title={sourceView === 'original' ? t('preview.original') : t('preview.full')}
          subtitle={
            sourceView === 'original' ? t('preview.originalSub') : t('preview.fitSub', { palette: paletteLabel })
          }
          scalePct={scalePct}
          contentRef={previewWrapRef}
          controls={
            <>
              <ToggleGroup<SourceView>
                value={sourceView}
                onChange={setSourceView}
                options={[
                  { value: 'pattern', label: t('toggle.pattern') },
                  { value: 'original', label: t('toggle.original') },
                ]}
              />
              {sourceView === 'pattern' && (
                <ToggleGroup<RenderMode>
                  value={renderMode}
                  onChange={setRenderMode}
                  options={[
                    { value: 'symbols', label: t('toggle.symbols') },
                    { value: 'solid', label: t('toggle.solid') },
                  ]}
                />
              )}
            </>
          }
        >
          {sourceView === 'pattern' ? (
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
            <div className="border-[2px] border-ink inline-block max-w-full">
              <img src={image.dataUrl} className="max-h-[60vh] block max-w-full" alt="" />
            </div>
          )}
        </PreviewPaper>

        <BomTable cells={cells} palette={palette} symbolMap={symbolMap} />
      </div>

      {/* RIGHT: ORDER FORM panel */}
      <aside className="space-y-5">
        <div className="border border-ink bg-paper-2 p-5">
          <SpecLabel>{t('export.label')}</SpecLabel>
          <dl className="mt-5 space-y-3 font-mono text-xs text-ink-2">
            <RowKV k={t('export.kv.dimensions')} v={`${gridW} × ${gridH}`} />
            <RowKV k={t('export.kv.palette')} v={paletteLabel} />
            <RowKV k={t('export.kv.dither')} v={dLabel} />
            <RowKV k={t('export.kv.colors')} v={`${colorsUsed}`} />
            <RowKV k={t('export.kv.beads')} v={total.toLocaleString()} />
          </dl>
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => void runExport('pdf')}
              disabled={exporting !== null}
              aria-busy={exporting === 'pdf'}
              className="w-full bg-accent text-paper border border-ink py-3 font-mono text-xs uppercase tracking-label hover:bg-accent-2 disabled:opacity-60 disabled:cursor-wait flex items-center justify-between px-4"
            >
              <span>{exporting === 'pdf' ? t('export.busy') : t('export.download.pdf')}</span>
              <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={() => void runExport('png')}
              disabled={exporting !== null}
              aria-busy={exporting === 'png'}
              className="w-full bg-paper text-ink border border-ink py-3 font-mono text-xs uppercase tracking-label hover:bg-paper-3 disabled:opacity-60 disabled:cursor-wait flex items-center justify-between px-4"
            >
              <span>{exporting === 'png' ? t('export.busy') : t('export.download.png')}</span>
              <span aria-hidden>→</span>
            </button>
          </div>
          {exportError && (
            <p role="alert" className="mt-4 border border-accent bg-paper p-3 font-mono text-[11px] text-accent">
              ✕ {exportError}
            </p>
          )}
          <p className="mt-4 font-mono text-[11px] uppercase tracking-label text-mute leading-relaxed">
            {t('export.note')}
          </p>
        </div>
      </aside>
    </div>
  )
}

function RowKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-rule pb-1.5">
      <dt className="uppercase tracking-label text-mute">{k}</dt>
      <dd className="font-display text-base font-semibold text-ink">{v}</dd>
    </div>
  )
}
