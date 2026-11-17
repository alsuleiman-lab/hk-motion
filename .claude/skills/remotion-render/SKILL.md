---
name: remotion-render
description: رندر وتصدير فيديوهات هذا المشروع على كرت الشاشة (القواعد §11)؛ tools/gpu_render.mjs وطابور الرندر، عرضي ثم طولي، رندر واحد في وقت واحد، بإذن صريح. (Export a Remotion video)
version: 4.0.535
---

# الرندر (المرحلة ١١) — المختصر الملزم

> **إذن الرندر منفصل** (جواب المستخدم 2026-11-17): بعد رابط المراجعة أطلب إذنه بالرندر دائماً، وموافقته على المراجعة ليست إذناً.

- **بإذن صريح فقط** (عدا الدروس والبثوث بعد اعتماد أول مشروع). «رندر» = الآن، بلا تعديل أدوات أثناءه. أقيس مساحة القرص قبله (≥ 25 غيغا بعد الذروة).
- **عبر طابور الرندر دائماً:** `node tools/render_queue.mjs add --spec <المشروع> --comp <التركيبة> --orient L|R --dest "<المجلد>" [--title "…"] [--bumper end|start]` ثم `node tools/render_queue.mjs run` (عامل واحد يرفض الثاني). الطابور يفحص قبول المهمة (التغطية والشبكة والتنويع)، ويرندر على كرت الشاشة، ويلحق الفاصل في موضعه، ويفحص الارتجاف على الملف، وينسخ إلى «جاهز». العرضي ثم الطولي، رندر واحد في وقت واحد.
- **بعد كل ملف:** `node tools/final_review.mjs <الملف> --name <المشروع>` (المقياس الواحد للقص، بوابة الصوت على الملفات الحالية، الارتجاف لهذا الملف بعينه، قمة الصوت) ونظرة على إطار من أول تقسيم شاشة ومن المنتصف. عندها فقط «✅ انتهيتُ من المونتاج» + رابط المشاهدة، ثم «هل تعتمده؟» بالنقر.
- الفشل يُشخَّص ويُصلَح ويُعاد، لا يُتوقف عنده. إن قال إنه سينام: السبات بعد خلو الطابور والجلسات.
- **بوابة المهارة:** تمّ = كل صيغة مختارة في «جاهز» باسمها الصحيح (`<العنوان> #محمد_بن_شمس_الدين`، والعرضي يزيد «-» في آخره) والفحص النهائي نجح عليها.

> ما يلي التفاصيل التقنية للمحرّك (منسوخة من المهارة الحالية).


## المحرّك المعتمد: الرندر كله على كرت الشاشة (أمر المستخدم 2026-11-12: «يجب نقل كل شيء إلى طريقتنا الجديدة»)

الرندر النهائي = **`tools/gpu_render.mjs`**، وهو بديل مباشر لـ `hybrid_any.mjs` بالوسائط نفسها والمخرجات نفسها:
- تقرير JSON، وخلط الصوت، والفاصل للرندر الكامل، وقفل الرندر، والأولوية المنخفضة؛
- إعدادات NVENC نفسها حرفياً.

**كيف يعمل:**
- Electron خارج الشاشة يرسم الرسوم على كرت الشاشة، ويخرج كل إطار نسيجاً مشتركاً ينسخه `tools/gpu/bridge.dll` إلى CUDA؛
- PyNvVideoCodec يفكّ الفيديو إلى CUDA مباشرة: h264/av1 بـ SimpleDecoder، و**VP9 بـ `tools/gpu/nvseq.py`** (2026-11-12: SimpleDecoder كان يعطي في VP9 الإطار التالي ويزداد انزياحه عند الإطارات المخفية «superframes»؛ الجديد يعدّ الصور بترتيب خروجها من إطار مفتاحي معروف بتوقيت حزمته، ومطابق لـ ffmpeg بتاً بتاً، `tools/gpu/check_seqdecoder.py`)، وما سواها بقارئ ffmpeg؛
- `tools/gpu_compositor.py` يرصّ الطبقات ويرمّز.

لا لقطة شاشة، ولا PNG، ولا نقل للإطار إلى المعالج. التقرير الكامل بالأرقام: `docs/gpu_render_report.md`.

**كل أدوات الرندر صارت تستدعيه (2026-11-12):**
- `render_job.sh` (الطابور)، و`tools/gpu/render_project.sh`؛
- `render_clip.mjs` (معاينة، `SCALE=0.5` يصغّر على الكرت)، و`render_trial.mjs --frames A-B`، و`render_silent.mjs` (التعليق الصامت)، و`judder_probe.mjs`؛
- و`hybrid_parallel.mjs` صار يمرّر الأمر إليه.
- القديم (`render_final`/`render_chunked`/`npx remotion render`) ممنوع إلا بنص المستخدم.

**خيارات `gpu_render`:**
- `--props '<json>'` (أو `RENDER_PROPS`): خصائص التركيبة؛
- `--scale 0.5`: نسخة مصغّرة؛
- `--start/--end`: مقطع؛
- `--no-bumper`؛
- `--frames "f,f,…" --frames-dir <dir>` (2026-11-13): لقطات متفرقة فقط في تشغيل واحد، كل لقطة صورة `gp_<frame>.png`، بلا فيديو ولا صوت، وبكسلاتها مطابقة لرندر الفيديو. لوحة الإطارات (`tools/grid_sheet.mjs`) تستعملها: 29 لقطة من مونتاج 10 دقائق في 32 ثانية بدل 139 بالمتصفح (أمر المستخدم: «شغلة الإطارات بدنا ننقلها»). `--browser` يعيد الطريقة القديمة، وهي البديل التلقائي إن فشل المحرك. تفريغ الكلام يبقى كما هو بقرار المستخدم (التفريغ الجماعي جُرّب: أسرع بأربعين ثانية فقط مع فروق في الكلمات)؛
- `BUMPER_AT`/`BUMPER_ID`/`BUMPER_POSITION`: موضع الفاصل ومعرّفه، كما في `render_job.sh`.

**أي تركيبة:** ما فيه `<HybridHost>` تُوضع فيديوهاته على الكرت؛ وما ليس فيه يُرسم كله طبقةَ رسوم فوق الأسود، كما يفعل Remotion (68–70 dB مقارنةً بـ Remotion)، ومنه الكرتون (رسوم SVG كلها، مطابق تماماً).

**مشروع مؤرشف أو مادة مرجعية (الكرتون، المعامل):** `--props '{"showArchive":true}'` أو `'{"showReference":true}'` يظهرها للرندر وحده (`src/archive.ts`)، دون تعديل الملف ولا تغيير قائمة Studio.

**فحص المكتبة كلها:** `node tools/gpu/all_comps_check.mjs [--ids A,B]`:
- يرندر مقطعاً قصيراً من كل تركيبة بالمحرّك الجديد، ولقطات Remotion للإطارات نفسها؛
- ويقارن بينها، ويسجّل كل فيديو ما زال يفكّه المتصفح؛
- النتيجة في `.tmp/gpu_render/allcomps/summary.md`، مع لوحات لما تحت 40 dB؛
- ينتظر قفل الرندر قبل كل تركيبة.

**إصلاحات 2026-11-13:**
- **النجوم:** الخلفية المزخرفة (`KhBg`) نجومها تتحرك؛ تُرندر أجزاؤها الثلاثة مرة واحدة، ويحرّك المركِّب النجوم كل إطار. كانت مجمّدة في الهجين.
- **الصوت مع `--procs 2`:** كانت العملية الثانية تفقد سجلات صوتها (ثغرة في `electron_worker.cjs`)، فأُصلحت.
- **الثواني الأولى صامتة في الأربعة (2026-11-13، عاد الخلل):** كانت العمليات تُقتل قبل أن تكتب سجلات صوتها. الآن `gpu_render` ينتظر خروج العمال (حتى 60 ث) و**يرفض التركيب إن نقص سجل صوت لأي إطار**، والطابور بـ`--procs 1`. بعد كل رندر `final_review` يفحص السكتات (لا يُعذَر منها إلا ما وقع داخل الفاصل)، ولا يُسلَّم فيديو قبل نجاحه.
- **التوقيت:** الإطار المختار من المقطع هو الأقرب إلى الوقت، كما يفعل Remotion.

### حين يطلب المستخدم «رندر» (بالترتيب، لا تتخطَّ شيئاً)

1. **الإذن.** الرندر النهائي بإذن المستخدم كما في القواعد القائمة، ولا يُبدأ قبل نجاح `node tools/stage.mjs check …` وبوابة الصوت (`montage_guard`).
2. **رندر واحد فقط.**
   - انظر إلى `.tmp/render.lock` و`node tools/render_queue.mjs ls`؛
   - إن كان رندر آخر يعمل فانتظره، ولا تكسر القفل ولا توقف رندراً لم تبدأه؛
   - لا تغيّر حالة مهمة في الطابور إلا بأمر المستخدم.
3. **المساحة.** `df -h /s`: يجب أن تبقى المساحة الحرة على S ≥ 25 GB **بعد** ذروة الرندر.
   - الذروة نحو 8 GB لفيديو 14 دقيقة (الحزمة، والفيديو قبل الصوت، والناتج، والفاصل)، ونحو 4 GB لفيديو 6 دقائق؛
   - إن لم تكفِ فلا تبدأ، وأخبر المستخدم بما يشغل المساحة، ولا تحذف إلا ملفاتك أو بإذنه.
4. **الأمر (العرضي أولاً ثم الطولي، بالتتابع):**
   ```bash
   source tools/env.sh
   under=$(node tools/window_frames.mjs <المشروع> under L)    # و R للطولي
   node tools/gpu_render.mjs --comp <Id> --out <file.mp4> ${under:+--under "$under"} --procs 1 --windows 3 --name <المشروع>
   ```
   أو المشروع كله باتجاهيه بالخطوات نفسها وفحص الارتجاف:
   ```bash
   bash tools/gpu/render_project.sh <المشروع> <Id-L> <Id> <مجلد الإخراج>
   ```
   - `--procs 1 --windows 3` هو الأفضل المقيس؛ عمليتان لا تفيدان، لأن المركِّب هو السقف.
   - أول تشغيل يبني `tools/gpu/bridge.dll` بـ VS 2022 تلقائياً.
5. **بعد الرندر: اقرأ التقرير** `render_work/gpu_render_<Id>_<وقت>.json`:
   - `chromeVideo` يجب أن يكون **فارغاً**. إن لم يكن، ففيه أسماء الفيديوهات التي فكّها Chromium بالمعالج (ببطء)، والمكوّن الذي يعرضها يجب نقله إلى `VSlot` (انظر «حين تعمل مونتاج»). أخبر المستخدم بها صراحة.
   - إذا ظهر في السجل `WARNING: the compositing functions … differ from tools/hybrid_generic.py` فالهجين تغيّر: انقل التغيير إلى `gpu_compositor.py` قبل الوثوق بالشكل.
   - المقاييس: `fpsGraphicsPlusComposite`، و`cpuDuringRender`، و`graphics.stale`.
6. **فحص الارتجاف** (أمر 2026-11-15: يُقاس في لحظات حرة لا يُزاح فيها وجهه، `tools/free_windows.mjs`، بالحدّ نفسه 96%؛ فإن لم توجد رجع إلى النوافذ الآتية) بأوامر `render_job.sh` نفسها:
   - 10 نوافذ ← 14 نافذة ← `--at <نافذة حرة> --len 90`؛
   - على الملف قبل الفاصل (`.tmp/bumper_orig/<الاسم>.mp4`)؛
   - و`ffprobe`: الإطارات والمدة والصوت، والمعدل ≥ 14 Mbps.
7. **الوجهة (أمر المستخدم 2026-11-16: «الاعتماد لا علاقة له بالنقل لجاهز»):** كل فيديو مرندر ينجح فحصه يُنسخ إلى «جاهز» فور انتهاء الرندر، بلا انتظار اعتماد ولا سؤال؛ والاعتماد وحده يحرّك الحذف والتنظيف.
8. **إن فشل الرندر الجديد:** يُصلَح السبب ويُعاد. الهجين (`node tools/hybrid_any.mjs …` أو `RENDER_ENGINE=hybrid` في `render_job.sh` على الفرع) احتياط **بإذن المستخدم فقط**، وأخبره بسبب الرجوع.
9. **التنظيف:** احذف ملفاتك المؤقتة الكبيرة بعد التحقق، وشغّل `node tools/clean_temp.mjs`.

**أرقام مقيسة (2026-11-12، i9-10900K وRTX 3090):**

| الفيديو | الهجين | الجديد |
|---|---|---|
| SaintRambal-L (25 107 إطاراً) | 38.1 دقيقة | 8.0 دقائق |
| SaintRambal طولي | 27 دقيقة | 10.2 دقائق |
| FatimaSheikhayn طولي | — | 2.6 دقيقة |
| FatimaSheikhayn-L | — | 13.1 دقيقة قبل نقل الشاشة المقسومة إلى الكرت (2026-11-12)؛ لم يُقس بعده كاملاً |

الشكل مطابق للهجين (≥ 45 dB، والمعتاد ≈ 68)، والتوقيت صحيح بالضبط، والإطارات متطابقة بين رندرين. استثناء: النوافذ المصغّرة المائلة التي كان يرسمها Chromium (الشاشة المقسومة) ≈ 40–41 dB مقارنةً بـ Chromium، والفرق في مرشّح التصغير وحواف دون البكسل، لا يُرى بالعين.

**ما لم يتحقق بعد:**
- معالج الجهاز ≤ 35%: متوسطه 60%، وعمليات الرندر وحدها ≈ 30–34%، وأكبر بند React الخاص بالتركيبة؛
- 60 إطاراً/ث من أول التشغيل إلى آخره: 52–58.

> الأقسام التالية عن الهجين (`hybrid_any`) تبقى مرجعاً للاحتياط، ولقواعد `VSlot` و`UnderHim` التي يشترك فيها المحرّكان.

> **HYBRID (fallback since 2026-11-12; was the only path from 2026-11-09):** final render = `node tools/hybrid_any.mjs --comp <Id> --out <file>`. `render_final`/`render_chunked` refuse to run (`tools/hybrid_gate.mjs`, hook; `render_clip` now runs `gpu_render`), and a failed hybrid is FIXED, never replaced by the old path. A composition the hybrid cannot draw is ported to `HybridHost`/`VSlot`. Old path only when the user's current message asks for it (`LEGACY_RENDER_USER_OK="<his words>"`).

> **HYBRID SPEED — nothing is decoded in Chrome (user 2026-11-12: «5 إطارات للثانية قليل جداً»).** Measured on SaintRambal-L: plain spans 15.4 fps, but spans where he is isolated over a background clip 2.6 fps (more browsers did not help: 7 browsers = 2.4 fps; the cost is Chrome seeking videos per frame, not CPU).
> 1. Every video in the hybrid "top"/"bg" layer is a `<VSlot>` (GPU compositor, NVDEC) — never `OffthreadVideo`/`<Video>`/`ClipVideo`. `BgClip` (src/GazaFx.tsx) does this; a new video component must too.
> 2. His isolated cut-out is cut on the GPU (2026-11-12, user: «نقل العزل كله إلى كرت الشاشة»): `MaskedVideo gpu` → a masked `<VSlot matte={{src, startFrom, floor}}>`; the compositor (`tools/hybrid_generic.py`) decodes the matte as one more NVDEC stream, alpha = matte red, the bottom `floor` kept whole (same as the WebGL shader). The BgClip veil is `fx.veil` on the clip's slot (the CSS radial gradient, computed by the compositor), because the Chrome layer is always ABOVE every video. EVERY window is cut on the GPU (user: «لا اريد التفادي» — no exception): graphics that lie UNDER him (`pmap`, `full`, `treefx` overlapping a window — `underHim()` in MontageSpec.tsx, wrapped in `<UnderHim from to>`) are drawn in a second transparent layer `{hybrid:"under"}` only for their frames (`node tools/window_frames.mjs <p> under L|R` → `hybrid_any --under "a-b,…"`, sent with bit 31 on the PNG socket, `HY_UNDER=1`); the compositor stacks plain videos → under layer → masked cut-outs → top layer. `render_job.sh` does this automatically. Without `--under` the compositor warns and draws nothing under him (never hangs). Isolation spans: 2.6 → 6.4 (JPEG) → 12 fps (GPU), output checked frame-exact by edge correlation.
> 4. **Seek bug fixed (2026-11-12):** the compositor's ffmpeg readers run with `-fps_mode passthrough`; without it a stream started mid-file got its first frame twice, so partial/patch renders, clip cards and restarted streams were ONE FRAME EARLY. Check frame timing with edge correlation against the source frame (`--dump dir:frames`), not with plain pixel difference.
> 3. Keep `--browsers 3 --conc 3` (5 or 7 browsers measured slower). Benchmark a slow span with `hybrid_any --start A --end B` before guessing; compare a plain span with an isolated one.
> **Where the time goes (measured 2026-11-12, SaintRambal-L, 25 127 frames, i9-10900K 10 cores/20 threads):** the graphics layer is CPU-bound — 3×3 tabs drive the CPU to 70–99 % and stop at ~17–20 fps whatever the browser count, GL backend (angle/swangle/vulkan) or process count (3 separate processes = 22 fps together); chrome-for-testing is slower (5–6 fps); PNG vs JPEG is the same; Remotion already uses `optimizeForSpeed` screenshots. Per frame: React/seek ≈ 20 ms, screenshot pipeline ≈ 90 ms. Each block start costs ≈ 5 s (incl. a 2 s `gallery gx measure` wait in `GxLayer` when an item is not drawn at the block's first frame). Isolation spans: 6.4 fps (Chrome draws the cut-out canvas every frame).
> **Repeated frames:** 92–97 % of calm-span graphics frames repeat, but the user REJECTED frame skip/reuse (2026-11-12) — do not propose or build it.

## أخطاء 2026-11-15 («إدلب»، تُتَّبع في كل رندر)
- **قبل الرندر الكامل:** رندر إطار من داخل أول تقسيم شاشة وإطار من منتصف الفيديو (`--start N --end N+3 --no-bumper`) وأنظر إليهما؛ الإطار الأسود يعني خلفية معتمة في غلاف الجذر (`backgroundColor` يجب أن يكون `undefined` في أوضاع `top` و`below` و`under`)، وهو يسوّد الفيديو كله أو مقاطع التقسيم وحدها (طبقات `below`) رغم أن مواضع الفيديو في السجل سليمة.
- **بعد الرندر:** أمسح الناتج كله بحثاً عن مقاطع سوداء، وأعاين إطارات من كل نوع مشهد، ثم أقول «رُندر».
- **رندر واحد فعلاً:** قفل الرندر لا يكفي؛ أتأكد أنه لا `gpu_render.mjs` آخر يعمل (ذاكرة الكرت 24 GB تمتلئ فيظهر `Decode Error occurred for picture` و«no painted frame with marker» وينهار الرندر)؛ `render_project.sh` ينتظر خلو الكرت مرتين متتاليتين قبل كل اتجاه، ومهلة انتظار الرسم في `electron_worker.cjs` صارت دقيقة.
- **الأوامر الطويلة:** `run_in_background` على الأمر نفسه؛ `nohup … &` داخل أداة الأوامر يموت بإنهاء الصدفة فيبدو الرندر «اكتمل» وهو لم يبدأ.

## Workspace rendering rules

For this Remotion workspace, follow `القواعد_العامة.md` و`شجرة_العمليات.md` §11 (binding) and قائمة المراجعة في مهارة `checking` before rendering. Follow the montage skill for authorization: final renders require explicit permission, except the separate lessons-and-streams workflow (after its first project is approved). Use the project's render scripts and output directly to the selected `جاهز` folder.

- The host uses an NVIDIA RTX 3090. Use `-hwaccel cuda` for supported input codecs. Prefer NVENC for delivery: preview H.264 uses `h264_nvenc -preset p4 -cq 23`; final H.264 uses `h264_nvenc -preset p7 -rc vbr -cq 19 -b:v 0`. Use HEVC or AV1 NVENC only when the available encoder supports that codec.
- Measure the final file with `ffprobe -show_entries stream=bit_rate`: it must be ≥ 14 Mbps; below 14 it is re-rendered.
- When streams need no filters or re-encoding, use `-c copy`. For alpha output, CPU encoding is allowed: `prores_ks` with `yuva444p10le`, or `libvpx-vp9` with `yuva420p`.
- CPU-bound FFmpeg operations, including alpha encoding and software filters, use `-threads 4`. Launch long conversions at below-normal priority. Use `scale_cuda` only for simple scaling with CUDA output frames.
- For Node API renders, pass `ffmpegOverride: nvencOverride` from `tools/nvenc.mjs` and `concurrency: 3`; `remotion.config.ts` does not configure the Node API. CLI renders use the project config (currently concurrency 6; reduce to 4 if the machine stutters).
- Before shell work, run `source tools/env.sh`; work on S and export the final video only to جاهز (`C:\Users\mshms\Videos\جاهز`; lessons, streams and cartoons in their sub-folders, مهارة `remotion-render`). After each operation, run `node tools/clean_temp.mjs`. Render order: landscape before portrait, sequentially (مهارة `remotion-render`).

## ONE render at a time (user order 2026-10-22)
Never run two renders at the same time (two videos, two orientations, or a video and its cover). Render strictly in sequence; if the user asks for parallel renders by mistake, warn them and decline. Check that no other render process is alive first, and kill a stopped batch's whole process tree. `tools/gpu_render.mjs` refuses to start while `.tmp/render.lock` holds a live PID (`tools/render_lock.mjs`); any new render script must use the same lock.

## اللقطات الثابتة
- **عبر `stills.mjs` وحده:** `node tools/stills.mjs <id> <outDir> name:frame …` (متصفح واحد مشترك + حزمة مخزَّنة + أصول بالروابط الصلبة؛ التوازي أبطأ عندنا فالافتراضي إطار بعد إطار).

## التفصيل
كل تفصيل هذه المهارة (الأرقام والجداول والأسماء الثابتة) في `references/detail.md` بجانبها، ملزم مثلها؛ يُبحث فيه بـGrep عند الحاجة.

## المراجعة بعد الرندر (قبل الاعتماد)
21. ✔ («remotion-render») الرندر بإذن، على المحرّك الجديد، بعد عيّنة ارتجاف؛ وبعده نظرة على إطار من أول تقسيم شاشة ومن المنتصف، ولا مقاطع سوداء، ومعدل البتات ≥ 14 Mbps؛ و`node tools/final_review.mjs <الملف المرندر> --name <p>` نجح (لا سكتة > 0.40ث، الفاصل، المدة).
22. ✔ («identity») الفاصل في موضعه (قبل أول تحية بعد البداية، أو في آخر الفيديو)، لا عند الثانية 0، وذكرتُ موضعه.
23. ✔ («remotion-render») الملف MP4 في «جاهز» باسمه الصحيح (العرضي بـ«-»)، مدته وإطاراته صحيحة.
24. ✔ («approval») الغلاف العرضي والطولي موجودان ونُظرا بالعين؛ حزمة يوتيوب جاهزة؛ ثم «✅ انتهيتُ من المونتاج» + رابط المشاهدة ثم «هل تعتمده؟».
