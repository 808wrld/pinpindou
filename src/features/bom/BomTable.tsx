import { useTranslation } from 'react-i18next'
import type { Palette } from '@/lib/pattern/types'
import { computeBomWithTotal } from './computeBom'
import { hexLuma } from '@/features/preview/PatternCanvas'

export function BomTable({
  cells,
  palette,
  symbolMap,
}: {
  cells: number[][]
  palette: Palette
  symbolMap?: Map<number, string>
}) {
  const { t, i18n } = useTranslation()
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'
  const { bom, total } = computeBomWithTotal(cells)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <p className="font-mono text-[10px] uppercase tracking-label text-ink-2 flex items-center gap-2">
          <span className="inline-block w-3 h-px bg-ink-2" />
          {t('export.bom.title')} · {t('export.bom.total', { n: total })}
        </p>
        <button
          onClick={() => copyText(toText(bom, palette, lang))}
          className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-accent"
        >
          ⧉ {t('export.bom.copy')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {bom.map((e) => {
          const c = palette.colors[e.index]
          const letter = symbolMap?.get(e.index) ?? ''
          const luma = hexLuma(c.hex)
          return (
            <div
              key={e.index}
              className="flex items-center gap-3 border border-rule bg-paper-2 px-3 py-2.5 hover:border-ink transition"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center border border-ink/30 font-mono text-xs font-bold"
                style={{ background: c.hex, color: luma > 0.6 ? '#1d1a23' : '#fffaf1' }}
              >
                {letter}
              </div>
              <div className="flex-1 truncate text-sm text-ink" title={c.name[lang]}>
                {c.name[lang]}
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums text-ink-2">{e.count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toText(
  bom: { index: number; count: number }[],
  palette: Palette,
  lang: 'zh-CN' | 'en',
): string {
  return bom
    .map((e) => {
      const c = palette.colors[e.index]
      return `${c.id} ${c.name[lang]} ×${e.count}`
    })
    .join('\n')
}

async function copyText(s: string) {
  try {
    await navigator.clipboard.writeText(s)
  } catch {
    /* noop */
  }
}
