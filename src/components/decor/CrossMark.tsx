export function CrossMark({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <line x1="6" y1="0" x2="6" y2="12" stroke={color} strokeWidth="1.2" />
      <line x1="0" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1.2" />
      <circle cx="6" cy="6" r="1.3" fill={color} />
    </svg>
  )
}
