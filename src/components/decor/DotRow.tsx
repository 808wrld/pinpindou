export function DotRow({ count = 24, color = 'var(--ink)' }: { count?: number; color?: string }) {
  return (
    <div className="flex items-center gap-[6px]" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ width: 3, height: 3, borderRadius: 999, background: color }} />
      ))}
    </div>
  )
}
