---
name: remotion-render
description: Export a Remotion video
version: 4.0.535
---

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

For this Remotion workspace, read `PREFERENCES.md` and `WORKFLOW_CHECKLIST.md` before rendering. Follow the montage skill for authorization: final renders require explicit permission, except the separate Antigravity lessons-and-streams workflow. Use the project's render scripts and output directly to the selected `جاهز` folder.

- The host uses an NVIDIA RTX 3090. Use `-hwaccel cuda` for supported input codecs. Prefer NVENC for delivery: preview H.264 uses `h264_nvenc -preset p4 -cq 23`; final H.264 uses `h264_nvenc -preset p7 -rc vbr -cq 19 -b:v 0`. Use HEVC or AV1 NVENC only when the available encoder supports that codec.
- When streams need no filters or re-encoding, use `-c copy`. For alpha output, CPU encoding is allowed: `prores_ks` with `yuva444p10le`, or `libvpx-vp9` with `yuva420p`.
- CPU-bound FFmpeg operations, including alpha encoding and software filters, use `-threads 4`. Launch long conversions at below-normal priority. Use `scale_cuda` only for simple scaling with CUDA output frames.
- For Node API renders, pass `ffmpegOverride: nvencOverride` from `tools/nvenc.mjs` and `concurrency: 3`; `remotion.config.ts` does not configure the Node API. CLI renders use the project config (currently concurrency 6; reduce to 4 if the machine stutters).
- Before shell work, run `source tools/env.sh`; work on S and export the final video directly to G (user order 2026-10-21; Antigravity's lessons path keeps its own folder rules). After each operation, run `node tools/clean_temp.mjs`. Follow `PREFERENCES.md` for render order (landscape before portrait, sequentially).

## المراقب الآلي الدائم (2026-10-21)

## ONE render at a time (user order 2026-10-22)
Never run two renders at the same time (two videos, two orientations, or a video and its cover). Render strictly in sequence; if the user asks for parallel renders by mistake, warn them and decline. Check that no other render process is alive first, and kill a stopped batch's whole process tree. `tools/render_final.mjs` refuses to start while `.tmp/render.lock` holds a live PID; any new render script must use the same lock. Keep `.agents/skills/remotion-render/SKILL.md` in sync.

## من مهارات Remotion الرسمية (remotion-dev/skills، منسوخة 2026-10-22؛ لم تُنسخ مهارتهم `remotion-render` حتى لا تحل محل هذه)
- **عدة لقطات بنداء واحد:** `npx remotion render <id> out/frames --frames=0,30,90 --image-format=png` (حزمة واحدة، وتوازٍ داخلي) — أسرع من تشغيل `still` لكل إطار.
- لقطة واحدة: `npx remotion still <id> out.png --frame=N`؛ وللفيديو الشفاف انظر `transparent-videos.md` الرسمي (في المستودع المنسوخ `scratch/ext_repos/remotion-skills/skills/remotion-render/`).
- **صور المعاينة السريعة عندنا:** `node tools/stills.mjs <id> <outDir> name:frame …` (متصفح واحد مشترك + حزمة مخزَّنة + أصول بالروابط الصلبة؛ التوازي أبطأ عندنا فالافتراضي إطار بعد إطار).

## الرندر النهائي بالإطارات المستخرجة (أمر المستخدم 2026-10-25: «استمر عليها واعمل عليها في المستقبل»)
الافتراضي لكل رندر نهائي لفيديو الشيخ: (1) استخرج إطارات القص صوراً: `ffmpeg -hwaccel cuda -i public/<cut>.mp4 -fps_mode passthrough -frame_pts 1 -q:v 3 -threads 4 public/<project>/fr/f_%06d.jpg` وتحقق من إطار واحد (PSNR=inf مقابل `select=eq(n\,N)`)؛ (2) مشغّل الفيديو الأساسي يعرض الصورة `f_<startFrom+frame>` حين `inputProps {"frames":true}` أثناء الرندر فقط (مثال: `BFrame`/`BV` في `src/Badawi.tsx`، و`KhVideo` في `src/KhKit.tsx`)؛ (3) `RENDER_PROPS='{"frames":true}' node tools/render_chunked.mjs … --audio-file public/<project>_audio.wav`. مقيس على البدوي: ×2.5 (3.5 د بدل 8.8 لكل 3000 إطار). المجلد `fr` يُحذف مع مؤقتات المشروع عند الاعتماد. لا تجرّب مدى في مجلد أجزاء رندر جارٍ بلا `--keep` (يُحذف المجلد بعد النجاح).

