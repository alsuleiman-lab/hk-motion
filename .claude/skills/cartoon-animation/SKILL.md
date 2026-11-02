---
name: cartoon-animation
description: Plan, create, and animate story-driven cartoon videos with distinct settings, characters, sentence-timed actions, and purposeful movement.
---

# Cartoon animation

## Fixed delivery format

Always make cartoons portrait-only at 9:16. Every visual scene, including opening and ending, must be cartoon artwork: no live footage, source-video inserts, photographic portraits, or B-roll. Original narration, captions, and verified text rendered in code are allowed. Do not ask about portrait/landscape or real-footage options; ask only for a title when it is missing. This cartoon-specific rule overrides shared montage defaults that request photographs of named people.

Create a moving story from the spoken content, not a slideshow of character images. Follow the project's `PREFERENCES.md`, `MONTAGE_BRIEF.md`, and `WORKFLOW_CHECKLIST.md`; those rules override examples here.

## Cartoon art direction is independent

Use a colourful story-film palette appropriate to the characters and setting, with distinct clothing, skin, architecture, wood, textiles, sky and props. Do not impose the monochrome lesson-video `brand.ts` palette on a cartoon. Keep the film visually cohesive and test text contrast; the reusable starting palette is `src/cartoon/palette.ts`.

Judge cartoon quality by storytelling, acting, contact, staging, continuity and timing. The lecture template's overlay-kind quota is not a cartoon quality gate. Apply only the shared content, source, resource and approval rules that actually concern the cartoon; do not copy lesson metadata or source-video layouts into the story by default.

Use [Claude Animation Base: local adaptation](references/claude-animation-base.md) when planning character acting, object handling, or a hand-drawn look. It translates the user's reference into the existing Remotion workflow; it does not make its character design, palette, facial features, constant motion, or renderer the project's defaults.

For code-drawn illustration detail, articulated characters, grounded walking, or reproducible frames, use [Hanif's animation skill: local adaptation](references/hanif-animation-detail.md). It complements the acting reference with material layers, rig review, and render-order checks.

For the user's painted-film quality reference, use [Paint MV: visual direction](references/paint-mv-visual-direction.md): cohesive watercolor rendering, shared character/set design, and action-driven scene connections timed to speech. For cut-paper style or physical bone rigs, use [Papermotion integration](references/papermotion-integration.md) and the project-local `papermotion` skill. Its stateful simulation requires a different frame-export strategy from pure Remotion animation.

For reusable cast designs, use [the local character libraries](references/character-library.md) when their selected style fits the user's reference. The two collections have large-head flat-colour and thin-line designs, with the same motion interface and separate proportions. Do not treat their static PNG poses as completed animation.

## Plan before building

Listen to the complete source audio and check its transcript against what is actually said; do not rely on ASR alone or estimate sentence timing from a script. Correct uncertain words and relationships by replaying the source; ask only if an ambiguity changes who is acting or what the scene means. Before producing or moving assets, define the cast and their story roles, family relationships, stable clothing/scale, speaker vs narrator vs listener behavior, and the required locations and props. Then make a compact storyboard with one row per sentence and timed action:

| Time / sentence | Setting | Visible character | Speaker / narrator | Action and prop | Camera / composition | Existing or needed asset |
|---|---|---|---|---|---|---|

Define a shared scene inventory (locations, background layouts/materials/light, character designs/wardrobe, and props) and animation plan before writing scene code. Check that every sentence has the correct characters doing the literal action in the place named or implied by the audio; important setting details and relationships must read clearly at a glance. Then inspect the storyboard and cast sheet together for continuity before building. A pose swap or new text card alone is not a new scene.

## Build scenes that read clearly

- Give each distinct workplace or location its own background and composition. For story-critical locations, make a custom, professionally illustrated 2D cartoon background with specific architecture, materials, lighting and props; do not economize by using a generic geometric backdrop when the scene depends on a recognizable place. Keep the illustration clearly drawn, never photographic, and leave staging room for the approved animated cast to remain legible. For example, a stocker works among shelves; a cashier stays at the register and belt. Do not stage every character against the same background and camera angle.
- Dress dialogue scenes as intentional rooms or locations with clear furniture, materials, layered lighting, and restrained background props. Keep the default framing close enough for clear faces and readable acting while retaining required characters and counters. If emphasis needs a camera move, use a slow, restrained push that settles and stays; do not rapidly alternate zooming in and out between speakers. Keep counters directly above their characters and inside frame.
- Make the speaker and action readable. Use a meaningful cut, camera reframe, or change of activity at each sentence boundary. For a long sentence, add short cutaways for its distinct actions or objects.
- Keep character identity, clothing, scale, lighting, and proportions consistent across poses and scenes. Keep each character at a stable world scale; achieve a close shot by reframing the whole set rather than arbitrarily resizing one actor. Make the spoken emotion legible in both face and body, and align sitting poses to the actual chair or throne seat. Before the final render, compare a contact sheet of representative scenes to catch scale drift, missed emotions, and floating or standing-on-seat poses; inspect the movement around the key acting beat, not only a still.
- Keep the child's rig height meaningfully smaller than the adult at a shared world scale. Frame close shots by zooming the whole set rather than enlarging only the child. In a conversation, give both actors a clear facing direction and reciprocal eye line, let the listener respond quietly, and move only the speaker's mouth.
- For detailed code-drawn assets, specify the material's base, texture, and edge treatment before drawing it. Give the focal character or prop the most readable detail; simplify distant textures. Use a consistent ground origin, test joint bends and near/far limb order, and match stride to travel so planted feet do not skate.
- Animate the task itself: reach and place a product, move an item along a belt, scan it, carry a box, hand something over, or leave the location. Use small purposeful movement to support the action; do not rely on continuous idle swaying.
- Block readable key poses before in-betweens. Stage the important event, then its reaction; give each enough time to be understood within the spoken interval. Use anticipation, curved paths, weight, and staggered settling where they clarify the action.
- For object handling, plan reach → grip → move → contact → release. While held, attach the prop to the hand's transform; after release, anchor it to the shelf, counter, or other destination. Inspect consecutive frames around contact, not only attractive stills.
- Drive speaking gestures from the active speaker's voiced word intervals. Other characters must not gesture as if speaking. Mark narrated action cutaways explicitly: the visible actor performs the task while the narrator is off-screen. Pause speech gestures in audio gaps.
- For quoted speech inside narration, keep the original narrator audio as the only voice while the visibly quoted character lip-syncs and gestures on the quote's actual word intervals. Close the narrator character's mouth during that quote, stage reciprocal eye-lines and a restrained listener reaction, and return the narrator's speaking action when narration resumes. Never add dubbed dialogue or invent unheard lines.
- Apply user-corrected speaker ranges to the edited Studio frame timeline, including both boundary frames, before automatic source-time cues. Preserve a requested frown while the mouth speaks and closes; lip sync must not restore a smile.
- Make hand acting read as one connected motion: shoulder leads, elbow stays on the lower side of the shoulder-to-wrist line during a raised-hand gesture throughout lift, hold and return, with a stable IK branch and no upward inversion or pop. Keep the wrist, palm and fingers aligned, proportionate and clearly articulated with rounded tips; inspect the hand silhouette at delivery size and correct fused, malformed or glove-like shapes that obscure the intended gesture. Settle into a held pose. Use restrained phrase-level accents, not a hand jerk on every word or syllable. Keep listeners' hands at rest unless their own action calls for movement. Cartoons have no counter, title strip, date, or lecture metadata unless the user explicitly asks for it.
- Prefer layered cutouts, pose variants, hand/prop rigs, and Remotion frame-based motion. A still illustration is acceptable only as a brief establishing shot or when the narration describes a still object.
- Keep drawn overlays inside `<Gfx>` and ensure they do not cover faces or other important character details.

## Character and asset constraints

- Preserve the user's character and environment details.
- **Facial features:** Characters stay faceless by default. When the user explicitly requests retaining the faces of their visual reference, preserve its eyes, eyebrows and smiles for that specific cast. The `cartoon_projects/family_stick` cast preserves the requested reference faces; the mother's niqab continues to conceal the covered parts of her face. Keep purposeful posture and connected hand acting.
- **Independent Dodo family — عائلة دودو:** Use `cartoon_projects/dodo_family/manifest.json` for the six-character Dodo family. Preserve the supplied reference’s large peach heads, dot eyes, small expressive mouth, thick ink outlines and short bodies. It has the same ten motions as Abu Khatt, with its own art and proportions; keep it as a separate library. Preserve its requested facial features, downward elbow bend, speech pauses and the mother’s covered hair and mouth. The legacy PNG poses in `dodo_style` are reference assets, not the articulated family rig.
- **Approved reusable cast — عائلة أبو خط:** Use `cartoon_projects/family_stick/manifest.json` and `rig.ts` when this family is requested or fits a family cartoon. Reuse its six approved characters, faces, colours and motions without redesigning them. Keep the library and its assets after video approval and project cleanup.
- **Abu Khatt family expressions:** The explicitly featured `cartoon_projects/family_stick` cast supports anger through brows, a frown and fists, and speech through mouth opening/closing with restrained phrase-level gestures. Close the mouth and settle hands in pauses. Use actual voiced intervals for narration; silent library demos may use clearly identified sample timing. Allow an angry face while talking. The mother’s niqab always conceals her mouth.
- **Social watermark (user order, every cartoon):** draw the Facebook, Instagram and TikTok icons with the text `@3la_fetra` in one row inside `<Gfx>` on every frame, horizontally centred and vertically inside the fourth fifth of the frame (60–80% of the height, y بين 1152 و1536 at 1080×1920, centre about y 1344). Keep it small and about 70% opaque with no box, never over a face or key prop (reframe the shot instead). It is an explicit request, so it is not an unrequested logo or early label. Cartoon only.
- Avoid unrequested characters, logos, labels, and readable text. Required text must be exact and appear at the spoken moment.
- For a named product, use a checked reference for its silhouette and a real, legible brand asset. Show the product/brand at its own word onset; do not reveal a row of brands before they are named. Check readability at the delivered aspect ratio and mobile size. Never invent a branded label or replace it with generic text when the brand is required.
- Caption every audible word in every cartoon, word-timed from the actual audio. Prefer a data-driven word-level caption list in a reusable overlay, grouped into short readable phrase pages. Place the Arabic RTL caption bar in the top safe area of the frame, keeping characters and important props unobstructed. Reveal each word only at its spoken onset; do not show future words, and clear captions during silence. Verify the caption text against the audio. Captions do not authorize unrequested quotations, religious texts, facts, or concluding sayings; when a source text is requested, fetch and verify it and label it as a quotation.
- When the user asks for a rule on a board behind a character, stage the board physically behind the character and keep its writing in the visible empty area. Preserve word timing and avoid duplicating the same rule in a foreground caption.
- Do not overwrite an existing asset; use a descriptive new filename for a revised pose or background.
- Before sharing a preview, inspect representative frames from every setting and major action, including the middle of the movement. Confirm characters stay in frame, props reach the right character, and cuts match sentence timing.

## Deliverables and limits

- Open the Remotion Studio composition and share its working preview link.
- Do not render a final video until the user explicitly authorizes it.
- Report which scene/action beats are complete and which still lack artwork or motion. Do not describe still images as completed animation.

## Timing audit

Save a JSON plan containing `fps`, `duration`, `characters`, `beats`, `captions`, `entities`, and `assets`. Each beat has `from`, `to`, `actor`, `speaker`, `environment`, `action`, `shot`, and `note`; set `narration: true` when the actor is not the speaker. Entity cues carry `at`, `spokenAt`, and a local `asset` path under `public/`. Caption cues carry a display interval and words with individual `at` times.

For user-requested source texts, add `quotations` entries with `from`, `to`, exact `text`, `book`, `url`, and `byUserRequest: true`; record the narrator, compiler, and source number when available.

Run `node .claude/skills/cartoon-animation/scripts/audit-storyboard.mjs <plan.json> <workspace>`. It checks gaps, overlaps, roles, asset existence, and early labels. It cannot prove transcript accuracy, arm anatomy, art quality, or visual relevance; review those in the preview.

## تصحيحات المستخدم (عائلة أبو خط، 2026-10-30)
- يحتفظ الطفل بطول أصغر بوضوح من البالغ عند مقياس مشهد موحّد؛ لا يُكبَّر وحده ليقارب طول الأب، والتقريب يُجرى على الكادر وبيئته معاً.
- في حوار الأب والبنت يواجه كل منهما الآخر بخط نظر متبادل (الأب ينظر إلى أسفل والبنت إلى أعلى)، مع تعاقب الفم واستجابة هادئة للمستمع.
- تظل الشخصية عابسة عند الكلام والسكون إذا طلب المستخدم العبوس؛ لا تعيد مزامنة الفم الابتسامة.
- تصحيحات أدوار المتحدثين بالإطارات تُطبَّق على خط Studio بعد القص، مع شمول طرفي المجال، وتتقدم على الأدوار المستخرجة آلياً.

## تصحيحات المستخدم (حوار أبو خط «فتنة الممات»، 2026-11-02)
- لا يُعدَّل صوت المتحدثين: أي تغيير خفيف في الطبقة يُشعر السامع أنه ذكاء اصطناعي، فيبقى التسجيل الأصلي كما هو. يُطرح على المستخدم تغيير قوي جداً (تحويل صوت كامل) للنقاش فقط، ولا يُنفَّذ إلا بموافقته.
- أدوار المتكلمين تتبع المعنى: السؤال البلاغي داخل جملة المجيب («دي أخطر فتنة فيهم ليه؟») له، لا للسائل؛ وتُقطَّع الأدوار عند أهدأ لحظة طاقة، فالطاقة تكشف الوقفة التي لا يكشفها التفريغ.
- الطاقية الإسلامية للعم (أبو خط) مدوّرة بيضاء بشريط وخطوط حياكة في `rig.ts`، وتُراجَع بقرب شديد.

## تصحيحات المستخدم (كرتون دودو «سيدنا آدم»، 2026-11-02)
- مشهد الشرح: لوح كبير مثبّت على الجدار، والمعلّم يقف بجانبه ويشير بعصا إلى الكلمة التي تُنطق (تنزلق رأس العصا إلى كل كلمة جديدة)، ولا يحمله بيديه. الكلمات تظهر على اللوح عند نطقها فقط، وتُصفَّر الصفحة عند تبدّل الموضوع.
- جلسة العائلة طبيعية لا جامدة: الأب متمدد على الأريكة ورِجل على رِجل، والأم جالسة على الأرض تطبخ (قدر وبخار وملعقة تتحرك وترتفع عند كلامها)، والابن جالس على وسادة؛ وحين يضيف المستخدم فكرة إخراج ننفّذها ونبتكر تفاصيل صغيرة تخدم الجو.
- النقاب في «عائلة دودو» حافته السفلية خط مستقيم لا قوس دائري (تعديل في `cartoon_projects/dodo_family/rig.ts`).
- «معلومة؟» قالها الأب، والأدوار الخافتة (الأم) تقدير يُعرض على المستخدم بنص صريح لا أن يُقال إنه مؤكد.
