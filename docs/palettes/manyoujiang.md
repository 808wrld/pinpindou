# 漫游酱 palette — provenance

v1 ships a 30-color **starter** subset. The full 漫游酱 catalog has ~150 colors;
expanding the JSON is a follow-up data task.

**RGB sources** (cross-checked, v1 starter):
- 漫游酱官方淘宝色卡图（按色号截图后取色）
- 小红书手作博主整理的色号对照表（多个来源取众数）

**Calibration**: 由于色卡图片在不同光照/屏幕下显示偏差较大，starter 数据
预期 ΔE 误差 ~3。`scripts/palette-diff.ts` 提供两套数据对比工具，便于后续校准。

**Expanding**: add objects to `src/palettes/manyoujiang.json#colors` and re-run
`npm run build:palettes`. Recommend documenting每个新增色号的 RGB 来源.
