import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CropAspectId } from '@/lib/image/crop'

export type Step = 'upload' | 'crop' | 'tune' | 'export'
export type DitherMode = 'none' | 'floyd-steinberg' | 'ordered-4x4'
export type PaletteId = 'manyoujiang' | 'perler' | 'hama'

export type AppState = {
  step: Step
  image: { dataUrl: string; width: number; height: number; name: string } | null
  crop: { x: number; y: number; w: number; h: number } | null
  cropAspect: CropAspectId
  preprocess: { brightness: number; contrast: number }
  tune: {
    // Size preset = the pattern's LONG side. The short side follows the crop's
    // aspect ratio (see patternDims); targetH mirrors targetW for old saves.
    targetW: number
    targetH: number
    paletteId: PaletteId
    dither: DitherMode
    colorCap: number | null
  }
  cells: number[][] | null
  // Palette the cells index into. tune.paletteId can change before the new
  // pattern is ready, so the two must not be assumed to match.
  cellsPaletteId: PaletteId | null
  // True from the moment tune inputs change until the matching pattern is ready.
  generating: boolean
}

export type AppActions = {
  setStep: (s: Step) => void
  setImage: (img: AppState['image']) => void
  setCrop: (c: AppState['crop']) => void
  setCropAspect: (a: CropAspectId) => void
  setBrightness: (v: number) => void
  setContrast: (v: number) => void
  setTune: (patch: Partial<AppState['tune']>) => void
  setCells: (c: number[][] | null, paletteId?: PaletteId | null) => void
  setGenerating: (g: boolean) => void
  reset: () => void
}

export function defaultState(): AppState {
  return {
    step: 'upload',
    image: null,
    crop: null,
    cropAspect: '1_1',
    preprocess: { brightness: 0, contrast: 0 },
    tune: {
      targetW: 29,
      targetH: 29,
      paletteId: 'manyoujiang',
      // Default to no dither — clean for cartoons / pixel art (most user input).
      // Floyd-Steinberg is better for photos; user can switch in the UI.
      dither: 'none',
      // Default 16-color cap keeps output clean even with F-S; user can raise
      // up to the full palette size (~30 in v1) or drop down to 4.
      colorCap: 16,
    },
    cells: null,
    cellsPaletteId: null,
    generating: false,
  }
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...defaultState(),
      setStep: (step) => set({ step }),
      setImage: (image) => set({ image }),
      setCrop: (crop) => set({ crop }),
      setCropAspect: (cropAspect) => set({ cropAspect }),
      setBrightness: (v) => set((s) => ({ preprocess: { ...s.preprocess, brightness: v } })),
      setContrast: (v) => set((s) => ({ preprocess: { ...s.preprocess, contrast: v } })),
      setTune: (patch) => set((s) => ({ tune: { ...s.tune, ...patch } })),
      setCells: (cells, paletteId = null) =>
        set({ cells, cellsPaletteId: cells ? paletteId : null }),
      setGenerating: (generating) => set({ generating }),
      reset: () => set(defaultState()),
    }),
    {
      // v2: bumped so v1's stale dither/colorCap defaults are wiped on upgrade.
      name: 'pinpindou-v2',
      storage: createJSONStorage(() => localStorage),
      // Only persist tune preferences (palette / size / dither).
      // Image, crop, preprocess, step are session-only — refresh starts clean.
      partialize: (s) => ({ tune: s.tune }),
    },
  ),
)
