import { useTranslation } from 'react-i18next'
import { useAppStore, type Step } from '@/store/useAppStore'
import { go } from './navigation'
import i18n from './i18n'
import { CrossMark } from '@/components/decor/CrossMark'

const STEPS: Step[] = ['upload', 'crop', 'tune', 'export']

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const step = useAppStore((s) => s.step)
  const image = useAppStore((s) => s.image)
  const reset = useAppStore((s) => s.reset)
  const stepIdx = STEPS.indexOf(step)
  const isZh = i18n.language.startsWith('zh')

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="grain" />

      {/* HEADER */}
      <header className="border-b border-ink px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-9 w-9 border border-ink flex items-center justify-center bg-paper">
              <span className="block h-3.5 w-3.5 rounded-full bg-accent border border-ink" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl leading-none tracking-tight">
                pin<span className="text-accent">/</span>pin<span className="text-accent">/</span>dou
              </h1>
              <p className="font-display-body italic text-xs text-mute mt-1">{t('app.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => i18n.changeLanguage(isZh ? 'en' : 'zh-CN')}
              className="font-mono text-xs uppercase tracking-label"
            >
              <span className={isZh ? 'text-accent' : 'text-mute'}>中</span>
              <span className="text-mute mx-1.5">/</span>
              <span className={!isZh ? 'text-accent' : 'text-mute'}>EN</span>
            </button>
            {image && (
              <button
                onClick={() => {
                  reset()
                  go('upload')
                }}
                className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-ink"
              >
                ↻ {t('nav.reset')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* STEP INDICATOR */}
      <nav className="border-b border-ink bg-paper px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-6xl items-end justify-center gap-3 md:gap-8">
          {STEPS.map((s, i) => {
            const active = i === stepIdx
            const reachable = !!image || s === 'upload'
            return (
              <div key={s} className="flex items-end gap-3 md:gap-8">
                <button
                  onClick={() => reachable && go(s)}
                  disabled={!reachable}
                  className="group flex flex-col items-center text-center disabled:cursor-not-allowed"
                >
                  <span
                    className={`font-display font-black leading-none text-5xl md:text-6xl ${
                      active ? 'text-ink' : reachable ? 'text-mute group-hover:text-ink-2' : 'text-rule'
                    }`}
                    style={{ fontVariationSettings: '"opsz" 144' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`mt-2 font-mono text-[10px] uppercase tracking-label ${
                      active ? 'text-ink' : 'text-mute'
                    }`}
                  >
                    {t(`step.${s}`)}
                  </span>
                  {active && (
                    <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <span className="pb-7 md:pb-8 text-rule">
                    <CrossMark size={10} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 overflow-auto px-6 py-10 md:px-12 md:py-14">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* FOOTER NAV */}
      <footer className="border-t border-ink px-6 py-4 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => stepIdx > 0 && go(STEPS[stepIdx - 1])}
            disabled={stepIdx <= 0}
            className="font-mono text-xs uppercase tracking-label flex items-center gap-2 disabled:opacity-30"
          >
            <span>←</span>
            {t('nav.back')}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-label text-mute">
            STEP {String(stepIdx + 1).padStart(2, '0')} / 04
          </span>
          <button
            onClick={() => stepIdx < 3 && go(STEPS[stepIdx + 1])}
            disabled={stepIdx >= 3 || !image}
            className="font-mono text-xs uppercase tracking-label flex items-center gap-2 px-4 py-2 bg-accent text-paper border border-ink disabled:opacity-30 disabled:bg-paper disabled:text-mute hover:bg-accent-2"
          >
            {t('nav.next')}
            <span>→</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
