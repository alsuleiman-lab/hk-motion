---
name: remotion-render
description: Export a Remotion video
version: 4.0.535
---

> **HYBRID ONLY (user order 2026-11-09):** every final render = `node tools/hybrid_any.mjs --comp <Id> --out <file>`. `render_final`/`render_chunked`/`render_clip` refuse to run (`tools/hybrid_gate.mjs`, hook), and a failed hybrid is FIXED, never replaced by the old path. A composition the hybrid cannot draw is ported to `HybridHost`/`VSlot`. Old path only when the user's current message asks for it (`LEGACY_RENDER_USER_OK="<his words>"`).

> **HYBRID SPEED — nothing is decoded in Chrome (user 2026-11-12: «5 إطارات للثانية قليل جداً»).** Measured on SaintRambal-L: plain spans 15.4 fps, but spans where he is isolated over a background clip 2.6 fps (more browsers did not help: 7 browsers = 2.4 fps; the cost is Chrome seeking videos per frame, not CPU).
> 1. Every video in the hybrid "top"/"bg" layer is a `<VSlot>` (GPU compositor, NVDEC) — never `OffthreadVideo`/`<Video>`/`ClipVideo`. `BgClip` (src/GazaFx.tsx) does this; a new video component must too.
> 2. His isolated cut-out is cut on the GPU (2026-11-12, user: «نقل العزل كله إلى كرت الشاشة»): `MaskedVideo gpu` → a masked `<VSlot matte={{src, startFrom, floor}}>`; the compositor (`tools/hybrid_generic.py`) decodes the matte as one more NVDEC stream, alpha = matte red, the bottom `floor` kept whole (same as the WebGL shader). The BgClip veil is `fx.veil` on the clip's slot (the CSS radial gradient, computed by the compositor), because the Chrome layer is always ABOVE every video. EVERY window is cut on the GPU (user: «لا اريد التفادي» — no exception): graphics that lie UNDER him (`pmap`, `full`, `treefx` overlapping a window — `underHim()` in MontageSpec.tsx, wrapped in `<UnderHim from to>`) are drawn in a second transparent layer `{hybrid:"under"}` only for their frames (`node tools/window_frames.mjs <p> under L|R` → `hybrid_any --under "a-b,…"`, sent with bit 31 on the PNG socket, `HY_UNDER=1`); the compositor stacks plain videos → under layer → masked cut-outs → top layer. `render_job.sh` does this automatically. Without `--under` the compositor warns and draws nothing under him (never hangs). Isolation spans: 2.6 → 6.4 (JPEG) → 12 fps (GPU), output checked frame-exact by edge correlation.
> 4. **Seek bug fixed (2026-11-12):** the compositor's ffmpeg readers run with `-fps_mode passthrough`; without it a stream started mid-file got its first frame twice, so partial/patch renders, clip cards and restarted streams were ONE FRAME EARLY. Check frame timing with edge correlation against the source frame (`--dump dir:frames`), not with plain pixel difference.
> 3. Keep `--browsers 3 --conc 3` (5 or 7 browsers measured slower). Benchmark a slow span with `hybrid_any --start A --end B` before guessing; compare a plain span with an isolated one.
> **Where the time goes (measured 2026-11-12, SaintRambal-L, 25 127 frames, i9-10900K 10 cores/20 threads):** the graphics layer is CPU-bound — 3×3 tabs drive the CPU to 70–99 % and stop at ~17–20 fps whatever the browser count, GL backend (angle/swangle/vulkan) or process count (3 separate processes = 22 fps together); chrome-for-testing is slower (5–6 fps); PNG vs JPEG is the same; Remotion already uses `optimizeForSpeed` screenshots. Per frame: React/seek ≈ 20 ms, screenshot pipeline ≈ 90 ms. Each block start costs ≈ 5 s (incl. a 2 s `gallery gx measure` wait in `GxLayer` when an item is not drawn at the block's first frame). Isolation spans: 6.4 fps (Chrome draws the cut-out canvas every frame).
> **Repeated frames:** 92–97 % of calm-span graphics frames repeat, but the user REJECTED frame skip/reuse (2026-11-12) — do not propose or build it.

## General rendering strategy

Render a video using:

```
npx remotion render
```

Full list of options: https://www.remotion.dev/docs/cli/render.md

Render a still using:

```
npx remotion still
```

Full list of options: https://www.remotion.dev/docs/cli/still.md

To render several frames as images in one call, use `render --frames`:

```
npx remotion render [composition-id] out/frames --frames=0,30,90 --image-format=png
```

See https://www.remotion.dev/docs/cli/render.md#--frames for more options.

## Transparent videos

See [Transparent videos](./transparent-videos.md) for rendering out a video with transparency.

## Workspace rendering rules

For this Remotion workspace, read `PREFERENCES.md` and `WORKFLOW_CHECKLIST.md` before rendering. Follow the montage skill for authorization: final renders require explicit permission, except the separate lessons-and-streams workflow (after its first project is approved). Use the project's render scripts and output directly to the selected `جاهز` folder.

- The host uses an NVIDIA RTX 3090. Use `-hwaccel cuda` for supported input codecs. Prefer NVENC for delivery: preview H.264 uses `h264_nvenc -preset p4 -cq 23`; final H.264 uses `h264_nvenc -preset p7 -rc vbr -cq 19 -b:v 0`. Use HEVC or AV1 NVENC only when the available encoder supports that codec.
- Remotion Node renders through `tools/render_chunked.mjs` pass `videoBitrate` (default `16M`, override with `RENDER_BITRATE`); hardware encoding without it yields ≈2 Mbps. Measure the final file with `ffprobe -show_entries stream=bit_rate` (must be ≥ 10 Mbps, target ≈ 16 Mbps) and delete `render_work/chunked_<id>` before a re-render so old low-bitrate parts are not reused (R-RENDER-QUALITY.1).
- When streams need no filters or re-encoding, use `-c copy`. For alpha output, CPU encoding is allowed: `prores_ks` with `yuva444p10le`, or `libvpx-vp9` with `yuva420p`.
- CPU-bound FFmpeg operations, including alpha encoding and software filters, use `-threads 4`. Launch long conversions at below-normal priority. Use `scale_cuda` only for simple scaling with CUDA output frames.
- For Node API renders, pass `ffmpegOverride: nvencOverride` from `tools/nvenc.mjs` and `concurrency: 3`; `remotion.config.ts` does not configure the Node API. CLI renders use the project config (currently concurrency 6; reduce to 4 if the machine stutters).
- Before shell work, run `source tools/env.sh`; work on S and export the final video directly to G (user order 2026-10-21; the lessons-and-streams path keeps its own folder rules). After each operation, run `node tools/clean_temp.mjs`. Follow `PREFERENCES.md` for render order (landscape before portrait, sequentially).

## المراقب الآلي الدائم (2026-10-21)

## ONE render at a time (user order 2026-10-22)
Never run two renders at the same time (two videos, two orientations, or a video and its cover). Render strictly in sequence; if the user asks for parallel renders by mistake, warn them and decline. Check that no other render process is alive first, and kill a stopped batch's whole process tree. `tools/render_final.mjs` refuses to start while `.tmp/render.lock` holds a live PID; any new render script must use the same lock. Keep `.agents/skills/remotion-render/SKILL.md` in sync.

## من مهارات Remotion الرسمية (remotion-dev/skills، منسوخة 2026-10-22؛ لم تُنسخ مهارتهم `remotion-render` حتى لا تحل محل هذه)
- **عدة لقطات بنداء واحد:** `npx remotion render <id> out/frames --frames=0,30,90 --image-format=png` (حزمة واحدة، وتوازٍ داخلي) — أسرع من تشغيل `still` لكل إطار.
- لقطة واحدة: `npx remotion still <id> out.png --frame=N`؛ وللفيديو الشفاف انظر `transparent-videos.md` الرسمي (في المستودع المنسوخ `scratch/ext_repos/remotion-skills/skills/remotion-render/`).
- **صور المعاينة السريعة عندنا:** `node tools/stills.mjs <id> <outDir> name:frame …` (متصفح واحد مشترك + حزمة مخزَّنة + أصول بالروابط الصلبة؛ التوازي أبطأ عندنا فالافتراضي إطار بعد إطار).

## الرندر النهائي بالإطارات المستخرجة (أمر المستخدم 2026-10-25: «استمر عليها واعمل عليها في المستقبل»)
الافتراضي لكل رندر نهائي لفيديو الشيخ: (1) استخرج إطارات القص صوراً: `ffmpeg -hwaccel cuda -i public/<cut>.mp4 -fps_mode passthrough -frame_pts 1 -q:v 3 -threads 4 public/<project>/fr/f_%06d.jpg` وتحقق من إطار واحد (PSNR=inf مقابل `select=eq(n\,N)`)؛ (2) مشغّل الفيديو الأساسي يعرض الصورة `f_<startFrom+frame>` حين `inputProps {"frames":true}` أثناء الرندر فقط (مثال: `BFrame`/`BV` في `src/Badawi.tsx`، و`KhVideo` في `src/KhKit.tsx`)؛ (3) `RENDER_PROPS='{"frames":true}' node tools/render_chunked.mjs … --audio-file public/<project>_audio.wav`. مقيس على البدوي: ×2.5 (3.5 د بدل 8.8 لكل 3000 إطار). المجلد `fr` يُحذف مع مؤقتات المشروع عند الاعتماد. لا تجرّب مدى في مجلد أجزاء رندر جارٍ بلا `--keep` (يُحذف المجلد بعد النجاح).

