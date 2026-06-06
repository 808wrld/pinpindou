import type { CSSProperties } from 'react'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

export function CornerMarks({
  inset = 0,
  size = 10,
  color = 'var(--ink)',
}: {
  inset?: number
  size?: number
  color?: string
}) {
  const corners: Corner[] = ['tl', 'tr', 'bl', 'br']
  return (
    <>
      {corners.map((c) => (
        <Arm key={c} corner={c} inset={inset} size={size} color={color} />
      ))}
    </>
  )
}

function Arm({
  corner,
  inset,
  size,
  color,
}: {
  corner: Corner
  inset: number
  size: number
  color: string
}) {
  const wrap: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    pointerEvents: 'none',
  }
  const vertical: CSSProperties = { position: 'absolute', background: color, width: 1.5, height: size }
  const horizontal: CSSProperties = { position: 'absolute', background: color, height: 1.5, width: size }

  switch (corner) {
    case 'tl':
      wrap.top = inset
      wrap.left = inset
      vertical.top = 0
      vertical.left = 0
      horizontal.top = 0
      horizontal.left = 0
      break
    case 'tr':
      wrap.top = inset
      wrap.right = inset
      vertical.top = 0
      vertical.right = 0
      horizontal.top = 0
      horizontal.right = 0
      break
    case 'bl':
      wrap.bottom = inset
      wrap.left = inset
      vertical.bottom = 0
      vertical.left = 0
      horizontal.bottom = 0
      horizontal.left = 0
      break
    case 'br':
      wrap.bottom = inset
      wrap.right = inset
      vertical.bottom = 0
      vertical.right = 0
      horizontal.bottom = 0
      horizontal.right = 0
      break
  }
  return (
    <span style={wrap} aria-hidden>
      <span style={vertical} />
      <span style={horizontal} />
    </span>
  )
}
