import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas, buildSymbolMap } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { generatePattern } from '@/lib/pattern/generate'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'
import { SpecLabel } from '@/components/decor/SpecLabel'

const SIZE_PRESETS = [16, 29, 48, 58, 64] as const
const PALETTE_IDS = ['manyoujiang', 'perler', 'hama'] as const
const PALETTE_LABELS: Record<(typeof PALETTE_IDS)[number], { 'zh-CN': string; en: string }> = {
  manyoujiang: { 'zh-CN': '漫游酱', en: 'Manyou' },
  perler: { 'zh-CN': 'Perler', en: 'Perler' },
  hama: { 'zh-CN': 'Hama', en: 'Hama' },
}

type RenderMode = 'symbols' | 'solid'

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
  const [scalePct, setScalePct] = useState(100)
  const timer = useRef<number | null>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
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

  const symbolMap = useMemo(() => (cells ? buildSymbolMap(cells) : new Map<number, string>()), [cells])
  const colorsUsed = symbolMap.size

  // Canvas natural pixel dimensions vs displayed dimensions → "56%" scale badge.
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
  }, [naturalWidth, cells])

  if (!image || !crop) return null

  const ditherLabel =
    tune.dither === 'floyd-steinberg' ? 'F-S' : tune.dither === 'ordered-4x4' ? 'BAYER' : isZh ? '无' : 'NONE'
  const paletteLabel = PALETTE_LABELS[tune.paletteId][isZh ? 'zh-CN' : 'en']
  const beads = tune.targetW * tune.targetH
  const paletteSize = palette?.colors.length ?? 30
  const cap = tune.colorCap ?? paletteSize
  const modeLabel = renderMode === 'symbols' ? (isZh ? '符号图纸' : 'Symbol grid') : (isZh ? '纯色预览' : 'Solid preview')

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr] animate-specimen-in">
      {/* Left control rail */}
      <div className="space-y-7">
        <ControlGroup label={t('tune.size')}>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => setTune({ targetW: s, targetH: s })}
                className={`font-display text-base py-2.5 border border-ink ${
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
            <button onClick={() => setTune({ colorCap: null })} className="hover:text-accent">
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

      {/* Right: preview panel */}
      <div className="space-y-5">
        {/* Header bar */}
        <div className="flex items-baseline justify-between">
          <SpecLabel>{isZh ? '图纸预览' : 'Pattern preview'}</SpecLabel>
          <span className="font-mono text-[10px] uppercase tracking-label text-mute">
            {tune.targetW}×{tune.targetH} · {beads.toLocaleString()} {isZh ? '颗豆' : 'beads'} · {colorsUsed} {isZh ? '色' : 'colors'}
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
            value={beads.toLocaleString()}
            sub={isZh ? '预计用豆总量' : 'total beads needed'}
          />
          <StatCard
            label={isZh ? '颜色' : 'COLORS'}
            value={`${colorsUsed}`}
            sub={isZh ? `已匹配色号 ≤ ${cap}` : `matched ≤ ${cap}`}
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
              <div className="font-display text-lg leading-tight">{isZh ? '整体图纸' : 'Full pattern'}</div>
              <div className="font-mono text-[10px] uppercase tracking-label text-mute mt-0.5">
                {isZh ? `已缩放到当前区域 · ${paletteLabel}` : `Fit to view · ${paletteLabel}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
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
              <span className="font-mono text-xs text-accent font-semibold">{scalePct}%</span>
            </div>
          </div>

          <div ref={previewWrapRef} className="px-5 py-5 bg-paper">
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
              <div className="h-64 flex items-center justify-center text-mute font-mono text-xs uppercase tracking-label">
                {busy ? (isZh ? '生成中…' : 'generating…') : (isZh ? '等待生成' : 'waiting')}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {cells && palette && <BomTable cells={cells} palette={palette} symbolMap={symbolMap} />}
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
    <div className="bg-paper-2 border border-rule px-4 py-3.5">
      <div className="font-mono text-[10px] uppercase tracking-label text-mute">{label}</div>
      <div className="mt-1.5 font-display leading-none text-ink truncate text-3xl md:text-[2rem]">{value}</div>
      {sub && <div className="mt-1.5 font-mono text-[10px] uppercase tracking-label text-mute">{sub}</div>}
    </div>
  )
}
