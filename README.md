# pinpindou · 拼拼豆

Image → perler-bead pattern generator. Bilingual (zh-CN / en).
Spec: [`docs/superpowers/specs/2026-06-06-pinpindou-design.md`](docs/superpowers/specs/2026-06-06-pinpindou-design.md).

## Features (v1)
- 4-step wizard: upload → crop → tune → export
- CIEDE2000 color matching (more accurate than RGB Euclidean)
- 3 dither modes: none / Floyd-Steinberg (Lab space) / ordered Bayer 4×4
- 3 palettes: 漫游酱 (Manyou, ~30 starter colors), Perler, Hama
- Bead-count list (BOM) — exportable as text + embedded in PDF
- Printable PDF + PNG download
- zh-CN default with EN toggle
- Pure-client (no backend), runs in browser via Web Workers

## Stack
React 19 · Vite · TypeScript · Tailwind · Zustand · pdf-lib · react-i18next · Vitest · Playwright

## Local dev
```bash
npm install
npm run dev
# build:
npm run build && npm run preview
# tests:
npm test
npm run e2e
```

## Project structure
- `src/lib/` — pure algorithm code (color, image, dither, pdf) — TDD'd
- `src/workers/` — Web Workers for preprocess + quantize
- `src/features/` — UI by feature (upload / crop / tune / export / preview / bom)
- `src/palettes/` — source palette JSONs; `generated/` is built by `npm run build:palettes`
- `src/i18n/` — translation JSONs
- `docs/palettes/` — provenance for each palette's RGB values

## Adding palette colors
1. Edit `src/palettes/<id>.json` (add to `colors`)
2. Update `docs/palettes/<id>.md` with the source
3. `npm run build:palettes` regenerates `src/palettes/generated/`

## Out of scope (deferred)
- v2: 小红书 share exports, symbol-grid mode, multi-board auto-split, URL share
- v3: manual cell editor

## License
TBD by repo owner.
