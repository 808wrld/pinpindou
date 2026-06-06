export type PreprocessRequest = {
  type: 'preprocess'
  id: number
  pixels: Uint8ClampedArray
  width: number
  height: number
  crop: { x: number; y: number; w: number; h: number }
  brightness: number
  contrast: number
  targetW: number
  targetH: number
}

export type PreprocessResponse =
  | { type: 'preprocess:result'; id: number; pixels: Uint8ClampedArray; w: number; h: number }
  | { type: 'preprocess:error'; id: number; message: string }

export type QuantizeRequest = {
  type: 'quantize'
  id: number
  pixels: Uint8ClampedArray
  width: number
  height: number
  paletteLab: Float32Array  // length = N*3
  ditherMode: 'none' | 'floyd-steinberg' | 'ordered-4x4'
}

export type QuantizeResponse =
  | { type: 'quantize:result'; id: number; cells: number[][] }
  | { type: 'quantize:error'; id: number; message: string }
