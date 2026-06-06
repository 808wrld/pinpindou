# pinpindou · 拼拼豆 — Design Spec

**Date**: 2026-06-06
**Status**: Draft (awaiting user review)
**Author**: noah + Claude
**Scope**: v1 — first releasable version

---

## 1. Purpose

A web app that converts uploaded images into printable perler-bead (拼豆) patterns.

**Goal class** (decided): **public product on top of a clone**. References:
- https://github.com/bad-superman/perler-pattern-generator
- https://pindou.amz-tools.xyz/

**Differentiation thesis**: Existing tools are accurate-enough but English-only and palette-limited. pinpindou ships with (a) perceptually-accurate color matching (CIEDE2000 + dithering), (b) a Chinese-market palette (漫游酱) alongside Perler/Hama, (c) Chinese-first bilingual UI, and (d) outputs that match what手作 hobbyists actually want (BOM + printable PDF).

**Target user**: 拼豆手作爱好者 (DIY hobbyists) — primarily mainland China (via 小红书 / B 站 inflow) and English-speaking secondary market.

**v1 acceptance** (must all be true to ship):
- User can upload → preprocess → generate → download PNG/PDF without leaving the page
- Three palettes available: 漫游酱, Perler, Hama
- Three dither modes: none / Floyd-Steinberg / ordered 4×4
- CIEDE2000-based color matching (not RGB Euclidean)
- zh-CN (default) and en UI, switchable at runtime
- Bead-count list (BOM) generated and exportable as text + embedded in PDF
- Works on mobile (iOS Safari + Android Chrome), tested
- 64×64 + Floyd-Steinberg generation completes in ≤300 ms on an M1 / mid-tier Android
- Repo lives on GitHub; no public deployment in v1

**Out of scope for v1** (deferred):
- v2: 小红书 9:16 export, symbol-grid mode, multi-board auto-split, URL share
- v3: Manual cell editor (undo/redo/erase), advanced image editing (saturation, background removal)

---

## 2. Architecture

### 2.1 Tech stack (locked)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 19 + TypeScript | Matches reference project; large ecosystem |
| Build | Vite | Static output, GitHub Pages-ready |
| UI | Tailwind CSS + shadcn/ui (on demand) | Fast responsive layouts |
| State | Zustand | Lighter than Redux, more debuggable than Context |
| Image processing | Canvas 2D API | Browser-native, zero deps |
| Heavy compute | Web Worker | Keep main thread responsive |
| PDF | `pdf-lib` | Pure-frontend multi-page PDF |
| i18n | `react-i18next` | zh-CN default + en |
| Test | Vitest + Testing Library + Playwright | Vite-native + e2e |
| Lint/Format | ESLint + Prettier | Standard |
| Deploy | None in v1 (GitHub repo only) | `dist/` ready for future Pages |

### 2.2 Core data flow

```
File
  └→ ImageBitmap
       └→ [Worker: Preprocess]   crop / brightness / contrast / box-scale to grid
             └→ [Worker: Quantize]     palette map (CIEDE2000) + dither
                   └→ BeadPattern { width, height, paletteId, cells: number[][] }
                         ├→ Canvas preview (grid + zoom/pan)
                         ├→ BOM (color → count)
                         ├→ PDF export (paged + coords + legend)
                         └→ PNG export (single sheet)
```

### 2.3 Directory layout

```
pinpindou/                          # repo will be renamed at scaffold time
├── src/
│   ├── app/                        # root layout, hash router, i18n provider
│   ├── features/
│   │   ├── upload/
│   │   ├── preprocess/
│   │   ├── pattern/                # BeadPattern generation (calls Workers)
│   │   ├── preview/
│   │   ├── bom/
│   │   └── export/
│   ├── palettes/
│   │   ├── manyoujiang.json
│   │   ├── perler.json
│   │   ├── hama.json
│   │   └── generated/              # Lab-augmented, build-time generated
│   ├── workers/
│   │   ├── preprocess.worker.ts
│   │   └── quantize.worker.ts
│   ├── lib/                        # ciede2000, dither, pdf, box-scale, etc.
│   ├── i18n/                       # zh-CN.json, en.json
│   ├── components/ui/              # shadcn primitives
│   └── store/                      # Zustand slices
├── public/
├── tests/
├── scripts/
│   ├── build-palettes.ts           # adds Lab values to palette JSONs
│   └── palette-diff.ts             # compares two palette sources
├── docs/
│   ├── superpowers/specs/          # this file
│   └── palettes/                   # provenance docs per palette
└── (vite/tsconfig/tailwind/eslint/prettier/playwright configs)
```

---

## 3. Core algorithms

### 3.1 Preprocess worker (`preprocess.worker.ts`)

```ts
type PreprocessParams = {
  crop: { x: number; y: number; w: number; h: number }   // pixels in source image
  brightness: number     // -1..1
  contrast: number       // -1..1
  targetGrid: { w: number; h: number }
}
```

Steps:
1. Crop the source `ImageBitmap`.
2. Apply brightness/contrast: `out = (in - 0.5) * (1 + contrast) + 0.5 + brightness`, clamped to [0, 1].
3. Downscale to `targetGrid` using **box average** (per output pixel: average all source pixels covered). Box averaging beats bilinear at small target sizes for detail preservation.

Output: `Uint8ClampedArray` (RGBA), `length = w*h*4`.

### 3.2 Quantize worker (`quantize.worker.ts`)

Inputs: preprocessed pixels + `palette: PaletteColor[]` + `ditherMode`.

```ts
type PaletteColor = {
  id: string
  name: { 'zh-CN': string; en: string }
  hex: string
  lab: [number, number, number]    // pre-computed at build time
}
type DitherMode = 'none' | 'floyd-steinberg' | 'ordered-4x4'
```

**Color matching**: convert each pixel sRGB → Lab; for each palette color compute ΔE₀₀ (CIEDE2000); pick min.

- `src/lib/color/ciede2000.ts` is a pure function, unit-test coverage 100%.
- Palette Lab values are pre-computed by `scripts/build-palettes.ts` and read at runtime.

**Dither modes**:
- `none` — nearest-match only.
- `floyd-steinberg` — error diffusion (7/16, 3/16, 5/16, 1/16) **in Lab space**, not RGB.
- `ordered-4x4` — Bayer matrix threshold; suited for pixel-art style.

**Performance target**: 64×64 × 150-color palette × CIEDE2000 < **200 ms** on M1. If exceeded, add a KD-tree / octree palette index.

Output:
```ts
type BeadPattern = {
  width: number
  height: number
  paletteId: string
  cells: number[][]              // [y][x] → palette color index
  meta: { generatedAt: number; sourceHash: string }
}
```

### 3.3 Palette format

`src/palettes/*.json` (source, hand-curated):
```json
{
  "id": "manyoujiang",
  "name": { "zh-CN": "漫游酱", "en": "Manyou" },
  "version": "2024-12",
  "source": "see docs/palettes/manyoujiang.md",
  "colors": [
    { "id": "M01", "name": { "zh-CN": "纯白", "en": "Pure White" }, "hex": "#FFFFFF" }
  ]
}
```

Build step (`scripts/build-palettes.ts`) reads sources, computes Lab values, writes `src/palettes/generated/*.json` imported at runtime.

**Palette data sourcing**:
- v1 palettes: 漫游酱 (primary), Perler (international), Hama (international)
- 漫游酱 RGB data: sourced from official/distributor color cards + cross-checked against 小红书/B 站 color charts; provenance recorded in `docs/palettes/manyoujiang.md`; `palette-diff` script visualizes discrepancies between sources for manual calibration.

### 3.4 BOM (bead-count list)

Computed from `cells[][]` as `Map<paletteIndex, count>`, sorted by count desc.

Output channels:
- Screen: table with one-click copy
- PDF: embedded legend on each page footer
- Text export: `漫游酱 M01 纯白 ×123\nM05 浅粉 ×98 ...`

---

## 4. UI/UX (step-wizard flow)

**Pattern**: 4-step wizard with top progress bar and bottom Back/Next bar. Used identically on desktop and mobile; grid narrows on mobile.

| Step | Content | Main controls |
|---|---|---|
| ① Upload | Drag-drop zone + file picker + sample images ("no image? try this") | Accepts JPG/PNG/WebP, max 10 MB |
| ② Crop | Image canvas + crop rectangle + preprocess sliders | Aspect ratio (1:1 default / 2:1 / 1:2 / free); brightness; contrast; reset |
| ③ Tune | Left pane: params; right pane: live bead-pattern preview + BOM summary | Grid size (numeric + presets 16/29/48/58/64); palette dropdown; color cap (optional); dither (3-way) |
| ④ Export | Large preview (toggle: pattern view ⇄ original-comparison) + full BOM + downloads | Download PNG / PDF / copy BOM text |

### 4.1 Routing
Hash routes: `#/upload | #/crop | #/tune | #/export`.
- Browser back button supported.
- Route guard: jumping to `#/tune` or `#/export` without an uploaded image redirects to `#/upload`.

### 4.2 State persistence
- Zustand store + `localStorage` autosave (survives refresh).
- "Start over" button clears state.

### 4.3 Mobile specifics
- Each step is full-screen.
- Fixed bottom Back/Next buttons (large tap targets).
- Top progress shown as four numbered dots ① ② ③ ④.
- Step ③ stacks vertically: preview on top, params below — preview stays visible while user scrolls/edits sliders.

### 4.4 i18n
Top-right 中 / EN toggle; switch is instant; preference saved to `localStorage`. Default = zh-CN.

### 4.5 Defaults & UX details
- Crop aspect default: **1:1** (standard pegboard is square).
- Grid size presets: **16×16 (mini)**, **29×29 (default, standard board)**, **48×48**, **58×58 (two boards)**, **64×64 (cap)**.
- Live-preview debounce: **200 ms** (avoids jank while dragging sliders).
- Step ④ original-vs-pattern comparison view is the seed for v2's share-friendly exports.

---

## 5. Error handling & edge cases

| Case | Handling |
|---|---|
| Unsupported file type (GIF/HEIC/SVG) | Inline error at upload: "Only JPG/PNG/WebP supported." Block advance. |
| File > 10 MB | Inline error with actual size + "compress or crop before retry". |
| Image decode failure | Catch `ImageBitmap` error; toast "Couldn't read image, try another." |
| Transparent PNG | v1: alpha pixels treated as pure white, with visible notice. v2: "keep transparency = empty cell". |
| Extreme aspect ratio (e.g. 1:10) | Default center-crop to 1:1; user adjusts in step ②. |
| Worker fails to load (browser/extension blocked) | Fallback to main-thread sync computation (slower); first-load banner: "Performance reduced." |
| Quantize > 3 s | Progress bar + Cancel button (postMessage cancel flag). |
| Palette JSON fetch fails | Retry once; on fail show toast "Palette load failed, refresh to retry"; log to console. |
| PDF generation fails | Catch; fallback toast "PDF failed, try PNG." |
| `localStorage` full or disabled | Silent fallback to in-memory state; refresh loses work; one-time top toast. |
| User jumps to `#/export` directly | Route guard redirects to `#/upload`. |
| iOS Safari drag-upload unsupported | Auto-fallback to tap-to-select; layout adapts. |
| 64×64 near perf ceiling | Inline caption near size slider: "Large sizes take longer." |
| Long color names overflow | Tailwind `truncate` + tooltip with full name. |

**Global safety net**:
- React `ErrorBoundary` at root → "Something broke. Refresh, or Reset app" (the latter clears `localStorage`).
- Workers wrap their logic in try/catch + `postMessage({ type: 'error', message })`.
- v1 ships **without** Sentry (deferred until user volume justifies it); rely on `console.error` + the error-page UI.

**Performance budgets** (enforced in CI):
- First-load JS gzip ≤ **150 KB** (excluding palette JSON).
- Upload → first preview frame ≤ **500 ms** (29×29, standard laptop).
- 64×64 + Floyd-Steinberg ≤ **300 ms** (M1 / mid-tier Android).

---

## 6. Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Algorithm layer: `ciede2000`, `floydSteinberg`, `orderedDither`, `boxScale`, `brightnessContrast`, palette loader |
| Component | Vitest + Testing Library | Upload validation, slider debounce, route guards, BOM render |
| Worker | Vitest (mock worker, exercise underlying lib) | Message protocol, timeout, cancel |
| E2E | Playwright | One happy path: upload → crop → tune → download PDF (assert file size > 0, page count correct) |
| Visual regression | None in v1 | Defer to v2 when user volume warrants |

**Test fixtures**: three "golden" images bundled — solid blocks, gradient, complex photo. For each image × each dither mode, snapshot the `cells` array via hash (avoid storing large arrays). Each new palette gets one golden-image snapshot to validate matching quality.

**CI** (GitHub Actions):
- PR: `lint` + `typecheck` + `test` + `build` + `bundle-size` check
- Main branch: also runs `playwright` e2e
- Coverage gates: algorithm layer ≥ **90%**, component layer ≥ **70%**, overall not enforced

**Manual QA checklist** (run before each release):
- Upload 8 representative images (portrait / cartoon / landscape / pixel-art / logo / screenshot / transparent PNG / oversized).
- Spot-check the 9 dither × palette combinations.
- zh-CN ⇄ en switch — no missing strings.
- Test on iOS Safari, Android Chrome, desktop Chrome / Safari / Firefox.

---

## 7. Risks & assumptions

| Risk | Mitigation |
|---|---|
| 漫游酱 RGB data quality varies by source | `palette-diff` script + provenance doc; ship with a note explaining the data source |
| CIEDE2000 ×150 colors slow on low-end mobile | Performance budget enforced in CI; fall back to ΔE76 if budget breached on real devices |
| pdf-lib bundle bloat (~300 KB) | Code-split: only loaded when user reaches step ④ |
| Web Worker support gaps in older Safari | Main-thread fallback already specced; degradation visible to user |
| GitHub repo only (no deploy) means no real-user feedback in v1 | Acceptable — deferred deployment is an explicit user decision; v2 adds deploy |

**Assumptions**:
- User has decided **not** to deploy in v1; only commits to GitHub.
- Project will be renamed from `perler-bead-generator` directory to `pinpindou` at scaffold time.
- Zustand and features-based directory structure accepted as defaults.
- Backend = none; everything client-side. URL-share in v2 will use hash-encoding, still no server.

---

## 8. Decision log (during brainstorming)

| Decision | Choice | Note |
|---|---|---|
| Goal class | Public product on top of clone | Adds market-fit elements over reference |
| v1 / v2 / v3 split | v1 = differentiation + must-haves; v2 = share/symbol/multi-board/URL; v3 = editor | Agreed |
| Primary Chinese palette | 漫游酱 | Best小红书 coverage + data accessibility |
| Architecture | React 19 + Vite + TS + Tailwind | Matches reference; ecosystem |
| Deploy in v1? | No — GitHub repo only | User chose to defer |
| Project name | `pinpindou` | Replaces working name `pindou-gen` |
| State mgmt | Zustand | Default accepted |
| Directory style | Features-based | Default accepted |
| Color matching | CIEDE2000 (not RGB / not ΔE76) | Core differentiation |
| Max grid size | 64×64 | ~4 standard boards; larger goes to v2 multi-board |
| Main UI pattern | B — step wizard (4 steps), same UI desktop & mobile | Newcomer-friendly + 小红书 inflow |
