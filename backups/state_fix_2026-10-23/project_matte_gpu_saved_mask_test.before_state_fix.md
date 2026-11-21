---
name: matte-gpu-saved-mask-test
description: "Saved-mask isolation ADOPTED 2026-10-23 (WebGL MaskedVideo default, CSS MaskedIso + alpha WebM fallbacks) — measured numbers, bugs fixed, what is still unmeasured"
metadata:
  node_type: memory
  type: project
  originSessionId: c6b47149-0b08-4fab-b51f-b758f1f46c51
  modified: 2026-10-23T07:31:10.084Z
---

20 s sample (cut seconds 2.6–22.6 of «تصحيح الحديث بالكشف الصوفي», 600 frames), measured 2026-10-22/23:
- **Making the matte:** old RVM → CPU clean → VP9 alpha = 367 s; `tools/matte_gpu.py` (NVDEC → RVM → GPU clean → NVENC gray) = 35 s, CPU avg 23% vs 39%/99%.
- **Remotion render of the same 20 s (benchmark comps `KhBench-old|css|gl`, `src/KhBench.tsx`, private assets `public/kh/bench/`):** alpha WebM 288 s / 241 s (CPU avg ~85%), CSS-blend MaskedIso 230 s / 232 s (CPU ~70%), **WebGL MaskedVideo 59 s / 63 s / 64 s (CPU ~36%)**. Real montage window A (612 frames, all layers): 160 s.
- **Studio smoothness (8 s playback in an un-throttled headless Chromium; the Browser pane is hidden so rAF is throttled to 1 fps there — never trust its timings):** WebGL 59.8 fps, 0 dropped; CSS 30.4 fps, 0 dropped; old WebM 32.7 fps, 15 frames >40 ms, 98 dropped.
- **Sync on the 12 fastest-motion frames:** WebGL all offset 0; CSS 0 except one +1; old alpha WebM −3 on 4 of 12.
- **Bugs found + fixed:** (1) `onVideoFrame` fires once at mount with no metadata → stale frame accepted (3/20 stills wrong); fix = accept only `metadata.mediaTime` ≈ wanted time while rendering (0/20 after). (2) `tools/matte_cache.mjs` passed `--start/--end` that `matte_gpu.py` ignores → matted the WHOLE video; now trims the window first (backup in `backups/`).
- **Shared-workspace lesson:** other fork sessions edit the same files (`KhMaskTest.tsx` was overwritten, `matte_gpu.py` replaced by another version); put experiments in uniquely named files and check `ls`/timestamps before writing.

**Why:** user conditions 2026-10-22/23: matte saved permanently and reused automatically, frame-exact sync, measured speed/CPU/GPU, verified final export (not only Studio), old system kept as fallback, test files kept.
**How to apply:** per video `node tools/matte_cache.mjs get <master> <a> <b> --map …` → copy to `public/<proj>/mask_X.mp4` → `<IsoGl>` (default) / `ISO_MODE` fallback. Not yet measured: full-video render and the hybrid ffmpeg `alphamerge` final path. Related: [[feedback-matte-check-on-green-every-hook]], [[project_matte_gpu_trial_2026_10_23]].

## Determinism + boundaries (2026-10-23, user's note 1) — all passed
- 50 frames around the starts/ends of windows A–E rendered in 3 orders (2 shuffles + reversed): 0 order-dependent, max diff 0.07/255. Offset of mask vs master = 0 on all 35 in-window frames. Boundary frames (start−1/start, end−1/end+1) switch cleanly room ↔ isolated.
- Studio navigation forward/backward/random jumps on `KhBench-gl` (14 frames): 0 inconsistent visits. The full `KashfHadith` composition crashed a headless Chromium tab ("Target closed") when opened in Studio — cause not investigated (probably many 1.6 GB video elements).
- User decision: WebGL adopted PROVISIONALLY for the five windows (not a general rule); CSS + WebM remain fallbacks. hybrid_full.mjs + alphamerge visual comparison (edges, hands) is to be done at the first full export the user asks for.
