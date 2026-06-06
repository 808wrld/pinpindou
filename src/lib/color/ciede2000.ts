type Lab = [number, number, number]

const deg = (r: number) => (r * 180) / Math.PI
const rad = (d: number) => (d * Math.PI) / 180

export function ciede2000(lab1: Lab, lab2: Lab, kL = 1, kC = 1, kH = 1): number {
  const [L1, a1, b1] = lab1
  const [L2, a2, b2] = lab2

  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cbar = (C1 + C2) / 2
  const Cbar7 = Math.pow(Cbar, 7)
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))))

  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1)
  const C2p = Math.hypot(a2p, b2)

  const h1p = hAng(b1, a1p)
  const h2p = hAng(b2, a2p)

  const dLp = L2 - L1
  const dCp = C2p - C1p

  let dhp = 0
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p
    if (Math.abs(diff) <= 180) dhp = diff
    else if (diff > 180) dhp = diff - 360
    else dhp = diff + 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2))

  const Lbar = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let hbarp: number
  if (C1p * C2p !== 0) {
    const sum = h1p + h2p
    if (Math.abs(h1p - h2p) <= 180) hbarp = sum / 2
    else if (sum < 360) hbarp = (sum + 360) / 2
    else hbarp = (sum - 360) / 2
  } else {
    hbarp = h1p + h2p
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63))

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2))
  const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)))
  const Lbar50sq = Math.pow(Lbar - 50, 2)
  const Sl = 1 + (0.015 * Lbar50sq) / Math.sqrt(20 + Lbar50sq)
  const Sc = 1 + 0.045 * Cbarp
  const Sh = 1 + 0.015 * Cbarp * T
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc

  return Math.sqrt(
    Math.pow(dLp / (kL * Sl), 2) +
      Math.pow(dCp / (kC * Sc), 2) +
      Math.pow(dHp / (kH * Sh), 2) +
      Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh)),
  )
}

function hAng(b: number, ap: number): number {
  if (b === 0 && ap === 0) return 0
  const h = deg(Math.atan2(b, ap))
  return h >= 0 ? h : h + 360
}
