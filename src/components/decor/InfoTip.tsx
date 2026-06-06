import { useState, useRef, useLayoutEffect, type ReactNode } from 'react'

/**
 * Small ⓘ glyph that reveals a popover on hover or focus. The popover is
 * positioned above the glyph by default, flips below if it would overflow
 * the top of the viewport.
 */
export function InfoTip({ children, label = 'info' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false)
  const [flip, setFlip] = useState(false)
  const wrapRef = useRef<HTMLSpanElement | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // If there's not enough room above (200px), flip below.
    setFlip(rect.top < 220)
  }, [open])

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rule text-mute hover:text-accent hover:border-accent text-[10px] font-mono leading-none cursor-help"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 z-50 w-72 p-3.5 bg-ink text-paper text-xs leading-relaxed font-sans border border-ink shadow-lg normal-case tracking-normal ${
            flip ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          {children}
        </span>
      )}
    </span>
  )
}
