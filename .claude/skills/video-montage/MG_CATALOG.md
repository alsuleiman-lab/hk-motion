# فهرس قطع الموشن (مولَّد آلياً من src/MG.tsx وPortraitKit وSourceFrames وPaperKit وPaperTear وDebateLayouts — لا تعدّله يدوياً)

> يُولَّد بـ`node tools/gen_quickref.mjs`. الزمن بالثواني المطلقة ما لم يُذكر؛ كل قطعة تُوضع داخل `<Gfx>`؛ التفاصيل والضوابط الكاملة لكل قطعة في مهارة motion-graphics وأخواتها، وهنا ما يكفي لاستدعائها دون قراءة طويلة. عدد القطع: 56.

### `MGTheme`
one colour identity (src/brand.ts, user 2026-10-27): whatever `theme` an older composition passes, the brand (steel) is used
`props:` theme: MGThemeName; children: React.ReactNode

### `Gfx`
fast face check (tools/face_fast.mjs): inputProps {gfxOnly:true} paints ONLY the <Gfx> overlays on a transparent page (everything else is visibility:hidden and RV videos are empty boxes, so nothing is decoded); the alpha of each still = where graphics are draw
`props:` children: React.ReactNode

### `PaperBg`
Paper desk background: dot grid, paper noise, red squiggles, corner crop marks, hashtag, barcode + running timecode. `dark` = the navy variant after the iris wipe.
`props:` dark?: boolean; tag?: string

### `Chip`
Orange kinetic caption chip (the reference changes its words every ~1 s with a small pop).
`props:` phrases: { text: string; at: number; color?: string }[]; x: number; y: number; size?: number; at?: number; dur?: number

### `Typewriter`
(بلا وصف: مكوّن أساسي)
`props:` text: string; at: number; cps?: number; style?: React.CSSProperties

### `NoteCard`
Paper note card: slides in from the right (0.33 s, ease-out, fade) and settles with a tiny tilt; header mono label + black tag + typewritten title + grey lines.
`props:` at: number; x: number; y: number; w: number; h: number; rot?: number; label?: string; tag?: string; title?: string; lines?: number; children?: React.ReactNode; fromX?: number; cps?: number; size?: number

### `Strike`
Strike-through line / red X drawn stroke by stroke.
`props:` at: number; x: number; y: number; w: number; color?: string; sw?: number

### `Cross`
(بلا وصف: مكوّن أساسي)
`props:` at: number; x: number; y: number; size: number; color?: string; sw?: number

### `Highlight`
Marker highlight sweeping right→left (Arabic reading direction) behind a word.
`props:` at: number; color?: string; children: React.ReactNode; style?: React.CSSProperties

### `Stamp`
Rubber stamp that slams in (scale 2.2 → 1 with a bounce and tiny tilt).
`props:` at: number; x: number; y: number; text: string; size?: number; color?: string

### `Bars`
Bars that grow one after the other (black / red / green in the reference).
`props:` at: number; x: number; y: number; w: number; h: number; vals?: number[]; colors?: string[]

### `Clock`
A clock whose hands spin fast then ease (reference: the "24 hours" polaroid).
`props:` at: number; size: number

### `DashArc`
`under`: the arc sags below the lower end instead of rising over the top (user 2026-10-31: «اجعل الخط من تحت لحيتي»)
`props:` at: number; x1: number; y1: number; x2: number; y2: number; under?: boolean; lift?: number; dur?: number; color?: string; sw?: number

### `PinnedPhoto`
Photo card pinned with a yellow tape strip, name underneath.
`props:` at: number; x: number; y: number; w: number; h: number; name: string; sub?: string; rot?: number; children?: React.ReactNode

### `GlowCounter`
10a) Glowing gold counter that passes through intermediate values (e.g. 4 → 23 → 36).
`props:` at: number; x: number; y: number; steps: number[]; stepDur?: number; hold?: number; suffix?: string; size?: number

### `EllipseMark`
Gold hand-drawn ellipse around a phrase (draws itself)
`props:` at: number; x: number; y: number; w: number; h: number; color?: string; sw?: number

### `TimelineCounter`
ONE number is the single source: the counter, the needle, the filled line and the marker pop-ups are all derived from the same valueAt(t) in the same frame. stops = [{ t (seconds after `at`), value, label?, sub? }]: the needle travels start→stop1→stop2… (soft-
`props:` at: number; x: number; y: number; w: number; stops: { t: number; value: number; label?: string; sub?: string }[]; unit?: string; step?: number; size?: number; rtl?: boolean; ink?: string; accent?: string; digits?: "ar" | "en"; labelLift?: number

### `MorphBox`
(بلا وصف: مكوّن أساسي)
`props:` states: MorphState[]; dur?: number; accent?: string; fill?: string; children?: React.ReactNode | ((r: MorphRect) => React.ReactNode)

### `MorphContent`
(بلا وصف: مكوّن أساسي)
`props:` from: number; to?: number; children: React.ReactNode

### `TypeBox`
A card with three dots and a small corner title; a blinking cursor shows first, then the sentence is typed character by character (`cps` chars/s). An optional chip above names the idea. Use for a quoted sentence / verse / a question being "asked". Set `at` = t
`props:` at: number; x: number; y: number; w: number; text: string; title?: string; chip?: string; cps?: number; size?: number; until?: number

### `FlashCut`
(بلا وصف: مكوّن أساسي)
`props:` at: number; x: number; y: number; w: number; h: number; crops: { fx: number; fy: number; zoom: number }[]; beats?: number[]; hud?: string; accent?: string; children: React.ReactNode

### `ConvergeMerge`
N source pills sit on one side; curved lines DRAW from them one after another (0.3 s apart) to ONE result badge; light packets run along the lines; at `mergeAt` (= when the speaker says the shared conclusion / common origin) every pill slides along its own cur
`props:` at: number; mergeAt: number; x: number; y: number; w: number; h: number; sources: string[]; sourceAt?: number[]; result?: string; caption?: string; rtl?: boolean; accent?: string; conv?: number

### `BlurRise`
Each word rises, sharpens and fades in from ONE shared progress p (quint-out): opacity = p, offset = (1-p)·0.38em, blur = (1-p)·0.12em — never separate curves. 3–4 frames between words (stagger 0.12 s), 0.7 s window per word; pass `times` to land each word exa
`props:` at: number; text: string; x?: number; y: number; w?: number; size?: number; stagger?: number; win?: number; color?: string; accentColor?: string; accentWords?: number[]; times?: number[]; align?: "right" | "left" | "center"; bodyBox?: { x: number; w: number }; canvasW?: number

### `PanelToCanvas`
A list panel (put it on the RIGHT) with rows; when the speaker names the chosen items the cursor ticks them one by one (picks[i].check), then each chosen row LIFTS (0.13 s), flies along an arc (220 px up) and MORPHS into a card that lands in `canvas` (put it o
`props:` at: number; panel: { x: number; y: number; w: number; h: number; title: string; button?: string }; canvas: { x: number; y: number; w: number; h: number }; rows: { title: string; sub?: string }[]; picks: { row: number; check: number; fly: number }[]; accent?: string

### `PhoneChips`
A calm product hero for anything shown on a phone (an app, a notification, a chat, a website on mobile): (rings are OPTIONAL and OFF by default — the effect has NO background of its own, the video's background shows; pass rings=[4 colours] only if asked) conce
`props:` at: number; cx?: number; cy?: number; w?: number; h?: number; dur?: number; scroll?: number; screen?: React.ReactNode; notch?: boolean; chips?: { text: string; side: "left" | "right"; at: number; dy?: number }[]; rings?: string[]; accent?: string

### `SakugaMove`
One of the ways a SOURCE CARD (a clip/screenshot/page) can move on screen — best when a source stays > 10 s, but fine for shorter ones too. Phase 1 «على 3»: the card updates only every 3rd frame (≈10 fps flip-book stutter), each step ≥ 30 px, with a ±5° swing,
`props:` at: number; w: number; h: number; from: { x: number; y: number }; mid: { x: number; y: number }; to: { x: number; y: number }; switchAt?: number; sprint?: number; impact?: boolean; name?: string; labels?: [string, string]; labelPos?: { left: number; top: number }; accent?: string; children: React.ReactNode

### `SpotlightCard`
Display of a WRITTEN source: the page dims like a dark theatre (multiply ≈ .9), a warm round spotlight visits 3 stops and LOCKS on the card (pool pulses 6 %), then the round light morphs into a CARD-SHAPED soft light, the card RISES with overshoot, hovers (sin
`props:` at: number; card: { x: number; y: number; w: number; h: number }; lockAt?: number; reseatAt?: number; stops?: [number, number][]; tilt?: number; dark?: number; background?: React.ReactNode; children: React.ReactNode

### `TimelineTravel`
For a biography / history / stages told through the WHOLE video: every time the speaker reaches the next stage this overlay appears over the BOTTOM HALF (dimmed) — the axis slides from the previous station to the new one (slow start → rush → 12 % hard brake), 
`props:` stages: { at: number; date: string; title: string; sub?: string }[]; travel?: number; hold?: number; bandY?: number; spacing?: number; rtl?: boolean; accent?: string; dim?: number; axisK?: number; compact?: boolean

### `CollageAssemble`
A flat bold colour field with paper grain; paper PIECES (cut-out photos, coloured card, shapes) slide in from outside one after another with STOP-MOTION timing (positions update every `step` frames, 2–3), snap into place with a 1–2° wobble that settles, each w
`props:` at?: number; bg?: string; w?: number; h?: number; step?: number; keyline?: string; pieces: { at: number; x: number; y: number; w: number; h: number; rot?: number; from?: "left" | "right" | "top" | "bottom"; node?: React.ReactNode; color?: string; radius?: number; halftone?: boolean; cutout?: boolean }[]

### `HandheldShake`
Wraps the SHEIKH'S camera footage and shakes it like a hand-held camera, ONLY during an interjected (جملة اعتراضية) or sarcastic (جملة تهكمية) sentence — decided from the meaning of the sentence, never for emphasis, never continuous. windows = [{ from, to }] i
`props:` windows: { from: number; to: number }[]; amp?: number; rot?: number; children: React.ReactNode

### `BrushX`
A red hand-brushed X draws itself diagonally over `box` (two strokes, 0.25 s each, slightly translucent, rough edge), holds, then dissolves. Mark a rejected idea/word. NEVER over the speaker's face: give it a `box` on a graphic (a keyword, a photo), not on the
`props:` at: number; x: number; y: number; w: number; h: number; until?: number; color?: string

### `CornerTags`
: two tiny bold white labels in the TOP corners for the whole video (right: the topic/ruling, left: the speaker's name/title). Cheap permanent identity; keep y ≥ 130 in portrait, never over the face.
`props:` right: string[]; left: string[]; y?: number; size?: number

### `RewriteWindow`
A white browser-like window (tiny top bar with a red tab) holding ONE rewrite story: the OLD phrase is written, then STRUCK THROUGH (rough line draws right→left, text fades to 55 %), an ARROW draws from it toward the NEW phrase which is written with a pale-ora
`props:` x: number; y: number; w: number; h?: number; oldText: string; newText: string; oldAt: number; strikeAt: number; newAt: number; extra?: string; rot?: number; until?: number; accent?: string

### `RV`
render from pre-extracted JPEG frames (inputProps {"frames":true}; public/fr/<video name>/f_%06d.jpg, file number = composition frame; PREFERENCES R-RENDER-SPEED.4): no video decoding, exact frame
`props:` src: string; style: React.CSSProperties

### `Only`
quintic smootherstep: zero velocity and acceleration at both ends, so a push-in never jerks (user 2026-11-09)
`props:` from: number; to: number; children: React.ReactNode

### `Word`
Key word (user 2026-10-22: «هذه الأشكال لا تعجبني» → no boxes): bold white text with a dark outline, rising out of a blur, and a hand-drawn marker stroke that sweeps in behind it. tone "gold" = thick gold marker; tone "cream" = thin cream underline stroke. `fl
`props:` text: string; at: number; until: number; x: number; y: number; size?: number; flag?: string; tone?: "gold" | "cream"; font?: string

### `PhoneWin`
phone with a playing clip (the clip file shares the cut's time base). Default: bottom-left, below the beard
`props:` at: number; to: number; src: string; dur: number; cx?: number; cy?: number; w?: number; h?: number; blur?: number

### `SheikhLayers`
phone with a playing clip (the clip file shares the cut's time base). Default: bottom-left, below the beard */ export const PhoneWin: React.FC<{ at: number; to: number; src: string; dur: number; cx?: number; cy?: number; w?: number; h?: number; blur?: number }
`props:` cut: string; cams: Cam[]; zooms?: { from: number; to: number; amt?: number }[]; originY?: number

### `PaperMap`
Paper map: torn paper country on kraft paper, paper name tags, a dashed paper road and a paper car that drives between the two cities in stop-motion
`props:` at: number; until: number; x: number; y: number; w: number; h: number; center: [number, number]; spanLat: number; highlight?: string[]; highlightAt?: Record<string, number>; geo?: "levant" | "world"; pts?: MapPt[]; legs?: MapLeg[]; carSrc?: string; carW?: number; atlas?: boolean

### `PaperScene`
Paper scene: a kraft card where described people/objects (faceless silhouettes) slide in one after another, stop-motion, e.g. a sheikh seated beside a made-up woman
`props:` at: number; until: number; x: number; y: number; w: number; h: number; pieces: { src: string; x: number; y: number; w: number; at: number; rot?: number; from?: "left" | "right" | "top" | "bottom" }[]

### `Marker`
a hand-drawn red marker box that draws itself over a region of a card (relative 0..1 coordinates, placed inside the card)
`props:` at: number; x: number; y: number; w: number; h: number

### `FamilyTree`
a hand-drawn red marker box that draws itself over a region of a card (relative 0..1 coordinates, placed inside the card) */ export const Marker: React.FC<{ at: number; x: number; y: number; w: number; h: number }> = ({ at, x, y, w, h }) => { const f = useCurr
`props:` from: number; until: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number; nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number

### `TreeFx`
a hand-drawn red marker box that draws itself over a region of a card (relative 0..1 coordinates, placed inside the card) */ export const Marker: React.FC<{ at: number; x: number; y: number; w: number; h: number }> = ({ at, x, y, w, h }) => { const f = useCurr
`props:` from: number; until: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number; nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number; titleSize?: number; skin?: "parchment"

### `PopCard`
his isolated cut-out shrunk into a corner (user 2026-10-29, the paper map): the face point `face` of the 1920×1080 frame moves to (cx, cy) and the frame scales to `scale` between `shrinkAt` and +0.6 s
`props:` at: number; x: number; y: number; children: React.ReactNode

### `FullImage`
a source picture FILLS the 1080×1920 frame for a frame range (user 2026-10-23: manuscript full-screen) with a slow push and an optional self-drawing marker; sits in the BASE layers (outside <Gfx>) because it deliberately replaces him for those seconds. Put it 
`props:` src: string; from: number; to: number; origin?: string; marker?: { x: number; y: number; w: number; h: number; at: number }; box?: { x: number; y: number; w: number; h: number; rot?: number; plain?: boolean }

### `CitationTag`
the citation tag: book, volume, page on a small identity label with a pin, swinging in from the corner of the source
`props:` at: number; until?: number; x: number; y: number; book: string; part?: string; page?: string

### `ArticleMock`
demo page content for the browser frame (an article laid out in the identity)
`props:` w: number; img: string; title: string

### `Tape`
a strip of tape
`props:` x: number; y: number; w?: number; rot?: number

### `NewsClip`
a newspaper clipping of a real news screenshot: torn edges, the headline above in ink, the source under it, taped on two corners
`props:` at: number; until?: number; x: number; y: number; w: number; h: number; src: string; headline?: string; source: string; rot?: number

### `TornNote`
a torn note for the key phrase: cream paper strip with ragged ends, the phrase in Zain, one word underlined by hand in BRAND.mark
`props:` at: number; until?: number; x: number; y: number; w: number; text: string; size?: number; underline?: number; rot?: number

### `WordScraps`
a title made of torn paper scraps, one word per scrap (Arabic letters keep their joins), each arriving in stop-motion with its own tilt and stock
`props:` at: number; until?: number; x?: number; y?: number; text: string; size?: number; gap?: number; times?: number[]

### `TornPhoto`
a photo of the person or place in a torn white border with tape and a hand-written-style name strip
`props:` at: number; until?: number; x: number; y: number; w: number; h: number; src: string; name?: string; pos?: string; rot?: number

### `PaperGrain`
paper grain over a paper scene (multiply, faint), so cut-outs and cards read as one sheet of material
`props:` opacity?: number

### `DateCalendar`
(بلا وصف: مكوّن أساسي)
`props:` at: number; until?: number; x: number; y: number; w: number; text: string; sub?: string

### `PaperTear`
(بلا وصف: مكوّن أساسي)
`props:` sheet: React.ReactNode; from?: number; to?: number; peak?: number; direction?: Dir; roughness?: number

### `SculptedBlocks07`
the pasted call shape: <SculptedBlocks07 mainSrc guestSrc title /> (paths relative to public/, or staticFile URLs)
`props:` mainSrc: string; guestSrc: string; title?: string

- **صورة طالعة من الزاوية `peek` (في المعرض: PeekCorner، 2026-11-11):** `{ t: "peek", src: "<p>/peek_x.png", ar: الارتفاع÷العرض, at, until, corner: "bl", say?: "عادي" }` — رأس وكتفان بلا خلفية (قصّ RVM على الصورة الثابتة) تطلع مائلة من الزاوية السفلية اليسرى ثم تنزل؛ `say` فقاعة كلام ورقية من رأسه.
