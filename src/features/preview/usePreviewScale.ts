import { useLayoutEffect, useRef, useState, type DependencyList, type RefObject } from 'react'

/**
 * Watches a wrapper element and computes how much its content needs to be
 * scaled down to fit (clientWidth / naturalWidth, capped at 100%).
 * Used to render the small "56%" zoom badge above pattern previews.
 */
export function usePreviewScale(
  naturalWidth: number,
  extraDeps: DependencyList = [],
): { ref: RefObject<HTMLDivElement | null>; scalePct: number } {
  const ref = useRef<HTMLDivElement | null>(null)
  const [scalePct, setScalePct] = useState(100)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (!w || !naturalWidth) return
      setScalePct(Math.min(100, Math.round((w / naturalWidth) * 100)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naturalWidth, ...extraDeps])
  return { ref, scalePct }
}
