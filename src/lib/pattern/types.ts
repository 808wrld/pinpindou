export type Lab = [number, number, number]
export type PaletteColor = {
  id: string
  name: { 'zh-CN': string; en: string }
  hex: string
  lab: Lab
}
export type Palette = {
  id: string
  name: { 'zh-CN': string; en: string }
  version: string
  source: string
  colors: PaletteColor[]
}
export type BeadPattern = {
  width: number
  height: number
  paletteId: string
  cells: number[][]
  meta: { generatedAt: number; sourceHash: string }
}
