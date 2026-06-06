export type StatEntry = { label: string; value: string; sub?: string }

export function StatCards({ entries }: { entries: StatEntry[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {entries.map((e) => (
        <StatCard key={e.label} {...e} />
      ))}
    </div>
  )
}

export function StatCard({ label, value, sub }: StatEntry) {
  return (
    <div className="bg-paper-2 border border-rule px-4 py-3.5">
      <div className="font-mono text-[10px] uppercase tracking-label text-mute">{label}</div>
      <div className="mt-1.5 font-display leading-none text-ink truncate text-3xl md:text-[2rem]">
        {value}
      </div>
      {sub && <div className="mt-1.5 font-mono text-[10px] uppercase tracking-label text-mute">{sub}</div>}
    </div>
  )
}
