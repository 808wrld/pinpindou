import { useTranslation } from 'react-i18next'
import { useAppStore, type Step } from '@/store/useAppStore'
import { go } from './Router'
import i18n from './i18n'

const STEPS: Step[] = ['upload', 'crop', 'tune', 'export']

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const step = useAppStore(s => s.step)
  const image = useAppStore(s => s.image)
  const reset = useAppStore(s => s.reset)
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <h1 className="text-base font-bold">{t('app.title')}</h1>
          <p className="text-xs text-slate-500">{t('app.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => i18n.changeLanguage(i18n.language.startsWith('zh') ? 'en' : 'zh-CN')}
            className="rounded border px-2 py-1 text-xs"
          >
            {i18n.language.startsWith('zh') ? t('lang.en') : t('lang.zh')}
          </button>
          {image && (
            <button onClick={() => { reset(); go('upload') }} className="text-xs text-slate-500 hover:text-slate-800">
              {t('nav.reset')}
            </button>
          )}
        </div>
      </header>

      <nav className="flex items-center justify-center gap-3 border-b bg-slate-50 px-4 py-2 text-xs">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => image && go(s)}
            disabled={!image && s !== 'upload'}
            className={`rounded-full px-3 py-1 ${i === stepIdx ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'} disabled:opacity-40`}
          >
            {i + 1}. {t(`step.${s}`)}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4">{children}</main>

      <footer className="flex items-center justify-between border-t bg-white px-4 py-3">
        <button
          onClick={() => stepIdx > 0 && go(STEPS[stepIdx - 1])}
          disabled={stepIdx <= 0}
          className="rounded border px-4 py-2 text-sm disabled:opacity-30"
        >
          {t('nav.back')}
        </button>
        <button
          onClick={() => stepIdx < 3 && go(STEPS[stepIdx + 1])}
          disabled={stepIdx >= 3 || !image}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-30"
        >
          {t('nav.next')}
        </button>
      </footer>
    </div>
  )
}
