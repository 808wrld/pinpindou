import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas, buildSymbolMap } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { downloadPatternPng } from './downloadPng'
import { downloadPatternPdf } from './downloadPdf'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'
import { SpecLabel } from '@/components/decor/SpecLabel'
import { computeBomWithTotal } from '@/features/bom/computeBom'

const PALETTE_LABELS = {
  manyoujiang: { 'zh-CN': '漫游酱', en: 'Manyou' },
  perler: { 'zh-CN': 'Perler', en: 'Perler' },
  hama: { 'zh-CN': 'Hama', en: 'Hama' },
} as const

type RenderMode = 'symbols' | 'solid'
type SourceView = 'pattern' | 'original'

export function ExportStep() {
  const { t, i18n } = useTranslation()
  const cells = useAppStore((s) => s.cells)
  const tune = useAppStore((s) => s.tune)
  const image = useAppStore((s) => s.image)
  const [palette, setPalette] = useState<Palette | null>(null)
  const [renderMode, setRenderMode] = useState<RenderMode>('symbols')
  const [sourceView, setSourceView] = useState<SourceView>('pattern')
  const [scalePct, setScalePct] = useState(100)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'
  const isZh = lang === 'zh-CN'

  useEffect(() => {
    void loadPalette(tune.paletteId).then(setPalette)
  }, [tune.paletteId])

  const symbolMap = useMemo(() => (cells ? buildSymbolMap(cells) : new Map<number, string>()), [cells])
  const naturalCellSize = renderMode === 'symbols' ? 20 : 14
  const naturalWidth = (cells?.[0]?.length ?? tune.targetW) * naturalCellSize

  useLayoutEffect(() => {
    const el = previewWrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (!w || !naturalWidth) return
      setScalePct(Math.min(100, Math.round((w / naturalWidth) * 100)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [naturalWidth, cells, sourceView])

  if (!cells || !palette || !image) return null

  const { total } = computeBomWithTotal(cells)
  const ditherLabel =
    tune.dither === 'floyd-steinberg'
      ? 'F-S'
      : tune.dither === 'ordered-4x4'
        ? 'BAYER'
        : isZh
          ? '无'
          : 'NONE'
  const paletteLabel = PALETTE_LABELS[tune.paletteId][lang]
  const colorsUsed = symbolMap.size
  const modeLabel =
    sourceView === 'original'
      ? isZh
        ? '原图对照'
        : 'Original'
      : renderMode === 'symbols'
        ? isZh
          ? '符号图纸'
          : 'Symbol grid'
        : isZh
          ? '纯色预览'
          : 'Solid preview'

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px] animate-specimen-in">
      {/* LEFT: header + stats + preview + legend */}
      <div className="space-y-5">
        <div className="flex items-baseline justify-between">
          <SpecLabel>{isZh ? '图纸预览' : 'Pattern preview'}</SpecLabel>
          <span className="font-mono text-[10px] uppercase tracking-label text-mute">
            {tune.targetW}×{tune.targetH} · {total.toLocaleString()} {isZh ? '颗豆' : 'beads'} · {colorsUsed} {isZh ? '色' : 'colors'}
          </span>
        </div>

        {/* 4 Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label={isZh ? '尺寸' : 'SIZE'}
            value={`${tune.targetW}×${tune.targetH}`}
            sub={isZh ? '按当前图纸精度生成' : 'at current precision'}
          />
          <StatCard
            label={isZh ? '豆数' : 'BEADS'}
            value={total.toLocaleString()}
            sub={isZh ? '预计用豆总量' : 'total beads needed'}
          />
          <StatCard
            label={isZh ? '颜色' : 'COLORS'}
            value={`${colorsUsed}`}
            sub={isZh ? '已匹配拼豆色号' : 'matched colors'}
          />
          <StatCard
            label={isZh ? '模式' : 'MODE'}
            value={modeLabel}
            sub={`${scalePct}% ${isZh ? '适配显示' : 'fit'} · ${ditherLabel}`}
          />
        </div>

        {/* Preview paper */}
        <div className="border border-ink bg-paper-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink">
            <div>
              <div className="font-display text-lg leading-tight">
                {sourceView === 'original' ? (isZh ? '原图对比' : 'Original') : isZh ? '整体图纸' : 'Full pattern'}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-label text-mute mt-0.5">
                {sourceView === 'original'
                  ? isZh
                    ? '上传的源图片'
                    : 'Uploaded source'
                  : isZh
                    ? `已缩放到当前区域 · ${paletteLabel}`
                    : `Fit to view · ${paletteLabel}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex border border-ink">
                <button
                  onClick={() => setSourceView('pattern')}
                  className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
                    sourceView === 'pattern' ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
                  }`}
                >
                  {isZh ? '图纸' : 'PATTERN'}
                </button>
                <button
                  onClick={() => setSourceView('original')}
                  className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
                    sourceView === 'original' ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
                  }`}
                >
                  {isZh ? '原图' : 'ORIGINAL'}
                </button>
              </div>
              {sourceView === 'pattern' && (
                <div className="flex border border-ink">
                  <button
                    onClick={() => setRenderMode('symbols')}
                    className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
                      renderMode === 'symbols' ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {isZh ? '符号' : 'SYMBOLS'}
                  </button>
                  <button
                    onClick={() => setRenderMode('solid')}
                    className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
                      renderMode === 'solid' ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {isZh ? '纯色' : 'SOLID'}
                  </button>
                </div>
              )}
              <span className="font-mono text-xs text-accent font-semibold">{scalePct}%</span>
            </div>
          </div>

          <div ref={previewWrapRef} className="px-5 py-5 bg-paper">
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
          </div>
        </div>

        {/* Legend */}
        <BomTable cells={cells} palette={palette} symbolMap={symbolMap} />
      </div>

      {/* RIGHT: ORDER FORM panel */}
      <aside className="space-y-5">
        <div className="border border-ink bg-paper-2 p-5">
          <SpecLabel>{isZh ? '导出' : 'EXPORT'}</SpecLabel>
          <dl className="mt-5 space-y-3 font-mono text-xs text-ink-2">
            <RowKV k={isZh ? '尺寸' : 'DIMENSIONS'} v={`${tune.targetW} × ${tune.targetH}`} />
            <RowKV k={isZh ? '调色板' : 'PALETTE'} v={paletteLabel} />
            <RowKV k={isZh ? '抖动' : 'DITHER'} v={ditherLabel} />
            <RowKV k={isZh ? '色数' : 'COLORS'} v={`${colorsUsed}`} />
            <RowKV k={isZh ? '豆数' : 'BEADS'} v={total.toLocaleString()} />
          </dl>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => downloadPatternPdf(cells, palette, lang)}
              className="w-full bg-accent text-paper border border-ink py-3 font-mono text-xs uppercase tracking-label hover:bg-accent-2 flex items-center justify-between px-4"
            >
              <span>{t('export.download.pdf')}</span>
              <span>→</span>
            </button>
            <button
              onClick={() => downloadPatternPng(cells, palette)}
              className="w-full bg-paper text-ink border border-ink py-3 font-mono text-xs uppercase tracking-label hover:bg-paper-3 flex items-center justify-between px-4"
            >
              <span>{t('export.download.png')}</span>
              <span>→</span>
            </button>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-mute leading-relaxed">
            {isZh
              ? 'PNG 适合屏幕分享；PDF 多页带坐标，适合打印拼豆作业。'
              : 'PNG for sharing; PDF is paged with coords for printing.'}
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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-paper-2 border border-rule px-4 py-3.5">
      <div className="font-mono text-[10px] uppercase tracking-label text-mute">{label}</div>
      <div className="mt-1.5 font-display leading-none text-ink truncate text-3xl md:text-[2rem]">{value}</div>
      {sub && <div className="mt-1.5 font-mono text-[10px] uppercase tracking-label text-mute">{sub}</div>}
    </div>
  )
}
