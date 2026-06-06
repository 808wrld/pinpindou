# Perler palette — provenance

v1 ships a 30-color subset of the standard Perler bead range.

**RGB sources** (cross-checked):
- Perler official color chart PDF (publicly available on perlerbeads.com)
- Community-maintained reference at hama-bead-pattern-maker / similar projects

**Discrepancies**: noted in `scripts/palette-diff.ts` output. Hex values rounded to nearest integer sRGB.

**Expanding**: add objects to `src/palettes/perler.json#colors` and re-run `npm run build:palettes`.
