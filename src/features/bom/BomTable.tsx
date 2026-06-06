import { useTranslation } from 'react-i18next'
import type { Palette } from '@/lib/pattern/types'
import { computeBomWithTotal } from './computeBom'

export function BomTable({ cells, palette }: { cells: number[][]; palette: Palette }) {
  const { t, i18n } = useTranslation()
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'
  const { bom, total } = computeBomWithTotal(cells)
  return (
    <div className="rounded border bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">{t('export.bom.title')}</h3>
        <button
          onClick={() => copyText(toText(bom, palette, lang))}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          {t('export.bom.copy')}
        </button>
      </div>
      <ul className="max-h-72 divide-y overflow-auto text-xs">
        {bom.map((e) => {
          const c = palette.colors[e.index]
          return (
            <li key={e.index} className="flex items-center justify-between px-3 py-1">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded border"
                  style={{ background: c.hex }}
                />
                <span>
                  {c.id} {c.name[lang]}
                </span>
              </span>
              <b>×{e.count}</b>
            </li>
          )
        })}
      </ul>
      <div className="border-t px-3 py-2 text-xs text-slate-600">
        {t('export.bom.total', { n: total })}
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
    /* ignore */
  }
}
