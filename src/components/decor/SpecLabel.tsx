import type { ReactNode } from 'react'

export function SpecLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-label text-ink-2 flex items-center gap-2">
      <span className="inline-block w-3 h-px bg-ink-2" />
      {children}
    </p>
  )
}
