import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Step = 'upload' | 'crop' | 'tune' | 'export'
export type DitherMode = 'none' | 'floyd-steinberg' | 'ordered-4x4'

export type AppState = {
  step: Step
  image: { dataUrl: string; width: number; height: number; name: string } | null
  crop: { x: number; y: number; w: number; h: number } | null
  preprocess: { brightness: number; contrast: number }
  tune: {
    targetW: number
    targetH: number
    paletteId: 'manyoujiang' | 'perler' | 'hama'
    dither: DitherMode
    colorCap: number | null
  }
  cells: number[][] | null
}

export type AppActions = {
  setStep: (s: Step) => void
  setImage: (img: AppState['image']) => void
  setCrop: (c: AppState['crop']) => void
  setBrightness: (v: number) => void
  setContrast: (v: number) => void
  setTune: (patch: Partial<AppState['tune']>) => void
  setCells: (c: number[][] | null) => void
  reset: () => void
}

export function defaultState(): AppState {
  return {
    step: 'upload',
    image: null,
    crop: null,
    preprocess: { brightness: 0, contrast: 0 },
    tune: {
      targetW: 29,
      targetH: 29,
      paletteId: 'manyoujiang',
      dither: 'floyd-steinberg',
      colorCap: null,
    },
    cells: null,
  }
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...defaultState(),
      setStep: (step) => set({ step }),
      setImage: (image) => set({ image }),
      setCrop: (crop) => set({ crop }),
      setBrightness: (v) => set((s) => ({ preprocess: { ...s.preprocess, brightness: v } })),
      setContrast: (v) => set((s) => ({ preprocess: { ...s.preprocess, contrast: v } })),
      setTune: (patch) => set((s) => ({ tune: { ...s.tune, ...patch } })),
      setCells: (cells) => set({ cells }),
      reset: () => set(defaultState()),
    }),
    {
      name: 'pinpindou-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        step: s.step,
        image: s.image,
        crop: s.crop,
        preprocess: s.preprocess,
        tune: s.tune,
      }),
    },
  ),
)
