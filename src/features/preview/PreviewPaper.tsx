import type { ReactNode, RefObject } from 'react'

/**
 * The bordered "paper" card used to display a generated pattern (and, on the
 * export step, the original source for comparison). Header bar shows title +
 * subtitle on the left, slot for view-mode toggles + scale badge on the right.
 * The content area is what callers fill with a PatternCanvas, <img>, or empty state.
 */
export function PreviewPaper({
  title,
  subtitle,
  scalePct,
  controls,
  contentRef,
  children,
}: {
  title: string
  subtitle?: string
  scalePct: number
  controls?: ReactNode
  contentRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  return (
    <div className="border border-ink bg-paper-2">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink">
        <div>
          <div className="font-display text-lg leading-tight">{title}</div>
          {subtitle && (
            <div className="font-mono text-[10px] uppercase tracking-label text-mute mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {controls}
          <span className="font-mono text-xs text-accent font-semibold">{scalePct}%</span>
        </div>
      </div>
      <div ref={contentRef} className="px-5 py-5 bg-paper">
        {children}
      </div>
    </div>
  )
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex border border-ink">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
            value === o.value ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
