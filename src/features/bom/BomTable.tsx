import { useTranslation } from 'react-i18next'
import type { Palette } from '@/lib/pattern/types'
import { computeBomWithTotal } from './computeBom'
import { SpecLabel } from '@/components/decor/SpecLabel'

export function BomTable({ cells, palette }: { cells: number[][]; palette: Palette }) {
  const { t, i18n } = useTranslation()
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'
  const { bom, total } = computeBomWithTotal(cells)
  return (
    <div className="border border-ink bg-paper-2 p-5 md:p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <SpecLabel>
          {t('export.bom.title')} · {t('export.bom.total', { n: total })}
        </SpecLabel>
        <button
          onClick={() => copyText(toText(bom, palette, lang))}
          className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-accent"
        >
          ⧉ {t('export.bom.copy')}
        </button>
      </div>

      <div className="overflow-x-auto -mx-1">
        <div className="inline-flex gap-1 px-1">
          {bom.map((e) => {
            const c = palette.colors[e.index]
            return (
              <div
                key={e.index}
                className="flex flex-col items-stretch border border-ink bg-paper min-w-[64px]"
              >
                <div className="h-12 border-b border-ink" style={{ background: c.hex }} />
                <div className="px-2 py-1.5 text-center">
                  <div className="font-mono text-[10px] text-ink leading-tight">{c.id}</div>
                  <div className="font-display text-sm font-semibold leading-tight mt-0.5">
                    ×{e.count}
                  </div>
                  <div
                    className="font-mono text-[9px] text-mute leading-tight mt-0.5 truncate"
                    title={c.name[lang]}
                  >
                    {c.name[lang]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
