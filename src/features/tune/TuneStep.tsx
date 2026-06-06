import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas, buildSymbolMap } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { generatePattern } from '@/lib/pattern/generate'
import { loadPalette } from '@/lib/pattern/loadPalette'
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
      if ('cells' in res) {
        setCells(res.cells)
        setErrMsg(null)
      } else {
        // I3: don't leave stale cells on top of new failing settings — clear and surface
        setCells(null)
        setErrMsg(res.error)
        console.error('Pattern generation failed:', res.error)
      }
      setBusy(false)
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
  const naturalWidth = (cells?.[0]?.length ?? tune.targetW) * naturalCellSize
  const { ref: previewWrapRef, scalePct } = usePreviewScale(naturalWidth, [cells])

  if (!image || !crop) return null

  const beads = tune.targetW * tune.targetH
  const paletteSize = palette?.colors.length ?? 30
  const cap = tune.colorCap ?? paletteSize
  const dLabel = ditherLabel(tune.dither, isZh)
  const paletteLabel = PALETTE_LABELS[tune.paletteId][isZh ? 'zh-CN' : 'en']
  const modeLabel = renderMode === 'symbols' ? (isZh ? '符号图纸' : 'Symbol grid') : isZh ? '纯色预览' : 'Solid preview'

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

        <ControlGroup
          label={
            <>
              {t('tune.palette')}
              <InfoTip label={isZh ? '调色板是什么？' : 'What is a palette?'}>
                {isZh ? (
                  <>
                    <p className="mb-2">
                      决定生成的图纸用哪一套<b>实体拼豆色号</b>。下图后照着 BOM 清单买这家
                      的豆子就行。
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">漫游酱</b> · 国内淘宝主流，色号 M01–M30
                      (v1 starter)。
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">Perler</b> · 北美 Perler Beads，30 色 starter。
                    </p>
                    <p>
                      <b className="text-accent">Hama</b> · 欧洲 Hama Midi，30 色 starter。
                    </p>
                    <p className="mt-2 text-paper-3">
                      不同品牌色号互不通用，决定了买什么就跟着图纸走。
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      Picks which <b>physical bead brand</b> the pattern is matched to. After
                      export, buy beads by the BOM from that brand.
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">Manyou</b> (漫游酱) · Chinese market, codes
                      M01–M30 (v1 starter).
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">Perler</b> · North America, 30-color starter.
                    </p>
                    <p>
                      <b className="text-accent">Hama</b> · Europe (Hama Midi), 30-color starter.
                    </p>
                    <p className="mt-2 text-paper-3">
                      Bead codes are not interchangeable across brands.
                    </p>
                  </>
                )}
              </InfoTip>
            </>
          }
        >
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

        <ControlGroup
          label={
            <>
              {t('tune.colorCap')} · {cap}
              <InfoTip label={isZh ? '色数上限是什么？' : 'What is color cap?'}>
                {isZh ? (
                  <>
                    <p className="mb-2">
                      限制最终图纸用到的<b>不同颜色种类数</b>。
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">值越小</b> · 图纸越简笔，买的色种少、成本低，
                      但细节会丢。适合小红书晒图。
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">值越大</b> · 还原越准，但可能很多颜色只用
                      1–2 颗 —— 为了那 2 颗豆专门买一管不划算。
                    </p>
                    <p>
                      <b className="text-accent">不限</b> · 用整个调色板。
                    </p>
                    <p className="mt-2 text-paper-3">
                      算法用频次 top-N 选色，自动把次要的颜色合并到最近的留下的色。
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      Caps how many <b>distinct colors</b> the final pattern can use.
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">Lower</b> · Simpler look, fewer bead packs to buy.
                      Detail collapses; good for shareable patterns.
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">Higher</b> · Closer to source, but you may end up
                      buying a whole pack of a color you only use twice.
                    </p>
                    <p>
                      <b className="text-accent">Unlimited</b> · Uses the whole palette.
                    </p>
                    <p className="mt-2 text-paper-3">
                      The algorithm keeps the top-N most-used colors and remaps the rest to the
                      nearest kept color.
                    </p>
                  </>
                )}
              </InfoTip>
            </>
          }
        >
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

        <ControlGroup
          label={
            <>
              {t('tune.dither')}
              <InfoTip label={isZh ? '抖动是什么？' : 'What is dithering?'}>
                {isZh ? (
                  <>
                    <p className="mb-2">
                      <b>抖动</b>决定颜色不够"匹配"时怎么过渡。
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">无</b> · 最近色直接匹配。卡通、线稿、像素艺术
                      用这个最干净。
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">F-S</b> · Floyd-Steinberg 误差扩散。照片和渐变
                      用这个，过渡更平滑。
                    </p>
                    <p>
                      <b className="text-accent">Bayer</b> · 4×4 有序点阵抖动，复古像素游戏感。
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      <b>Dithering</b> decides how to fake colors the palette doesn’t have exactly.
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">None</b> · Nearest-color match. Cleanest for
                      cartoons, line art, pixel art.
                    </p>
                    <p className="mb-1.5">
                      <b className="text-accent">F-S</b> · Floyd-Steinberg error diffusion. Use for
                      photos and gradients — smoother transitions.
                    </p>
                    <p>
                      <b className="text-accent">Bayer</b> · 4×4 ordered dither, retro pixel-art
                      look.
                    </p>
                  </>
                )}
              </InfoTip>
            </>
          }
        >
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
        <div className="flex items-baseline justify-between">
          <SpecLabel>{isZh ? '图纸预览' : 'Pattern preview'}</SpecLabel>
          <span className="font-mono text-[10px] uppercase tracking-label text-mute">
            {tune.targetW}×{tune.targetH} · {beads.toLocaleString()} {isZh ? '颗豆' : 'beads'} · {colorsUsed} {isZh ? '色' : 'colors'}
          </span>
        </div>

        <StatCards
          entries={[
            { label: isZh ? '尺寸' : 'SIZE', value: `${tune.targetW}×${tune.targetH}`, sub: isZh ? '按当前图纸精度生成' : 'at current precision' },
            { label: isZh ? '豆数' : 'BEADS', value: beads.toLocaleString(), sub: isZh ? '预计用豆总量' : 'total beads needed' },
            { label: isZh ? '颜色' : 'COLORS', value: `${colorsUsed}`, sub: isZh ? `已匹配色号 · ≤ ${cap}` : `matched · ≤ ${cap}` },
            { label: isZh ? '模式' : 'MODE', value: modeLabel, sub: `${scalePct}% ${isZh ? '适配显示' : 'fit'} · ${dLabel}` },
          ]}
        />

        <PreviewPaper
          title={isZh ? '整体图纸' : 'Full pattern'}
          subtitle={isZh ? `已缩放到当前区域 · ${paletteLabel}` : `Fit to view · ${paletteLabel}`}
          scalePct={scalePct}
          contentRef={previewWrapRef}
          controls={
            <ToggleGroup<RenderMode>
              value={renderMode}
              onChange={setRenderMode}
              options={[
                { value: 'symbols', label: isZh ? '符号' : 'SYMBOLS' },
                { value: 'solid', label: isZh ? '纯色' : 'SOLID' },
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
            <div className="h-64 flex items-center justify-center text-mute font-mono text-xs uppercase tracking-label">
              {errMsg
                ? `✕ ${errMsg}`
                : busy
                  ? isZh
                    ? '生成中…'
                    : 'generating…'
                  : isZh
                    ? '等待生成'
                    : 'waiting'}
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
