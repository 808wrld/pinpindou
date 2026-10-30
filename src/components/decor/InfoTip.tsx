import { useState, useRef, useLayoutEffect, useId, type ReactNode } from 'react'

const VIEWPORT_GAP = 8

/**
 * Small ⓘ glyph that reveals a popover on hover or focus. The popover is
 * positioned above the glyph by default, flips below if it would be clipped
 * at the top (viewport or the scrolling <main>), and is shifted sideways so
 * it never runs off the left / right edge (the tune controls sit at the
 * screen edge on phones).
 */
export function InfoTip({ children, label = 'info' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false)
  const [flip, setFlip] = useState(false)
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const tipRef = useRef<HTMLSpanElement | null>(null)
  const tipId = useId()

  useLayoutEffect(() => {
    if (!open) return
    const el = wrapRef.current
    const tip = tipRef.current
    if (!el || !tip) return
    const rect = el.getBoundingClientRect()
    // Flip below when the popover doesn't fit above. Measure against the
    // scrolling <main> too: it clips the popover, not just the viewport.
    const clipTop = Math.max(0, el.closest('main')?.getBoundingClientRect().top ?? 0)
    setFlip(rect.top - clipTop < tip.offsetHeight + 12)
    // Measure where the centred popover would land and nudge it back inside.
    const width = tip.offsetWidth
    const centre = rect.left + rect.width / 2
    const left = centre - width / 2
    const right = centre + width / 2
    const maxRight = document.documentElement.clientWidth - VIEWPORT_GAP
    const shift = left < VIEWPORT_GAP ? VIEWPORT_GAP - left : right > maxRight ? maxRight - right : 0
    // margin rather than transform: the -translate-x-1/2 centring stays intact.
    tip.style.marginLeft = `${shift}px`
  }, [open])

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tipId : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rule text-mute hover:text-accent hover:border-accent text-[11px] font-mono leading-none cursor-help"
      >
        i
      </button>
      {open && (
        <span
          ref={tipRef}
          id={tipId}
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 z-50 w-72 max-w-[calc(100vw-16px)] p-3.5 bg-ink text-paper text-xs leading-relaxed font-sans border border-ink shadow-lg normal-case tracking-normal ${
            flip ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          {children}
        </span>
      )}
    </span>
  )
}
