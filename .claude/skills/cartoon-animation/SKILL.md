---
name: cartoon-animation
description: Plan, create, and animate story-driven cartoon videos with distinct settings, characters, sentence-timed actions, and purposeful movement.
---

# Cartoon animation

Create a moving story from the spoken content, not a slideshow of character images. Follow the project's `PREFERENCES.md`, `MONTAGE_BRIEF.md`, and `WORKFLOW_CHECKLIST.md`; those rules override examples here.

## Cartoon art direction is independent

Use a colourful story-film palette appropriate to the characters and setting, with distinct clothing, skin, architecture, wood, textiles, sky and props. Do not impose the monochrome lesson-video `brand.ts` palette on a cartoon. Keep the film visually cohesive and test text contrast; the reusable starting palette is `src/cartoon/palette.ts`.

Judge cartoon quality by storytelling, acting, contact, staging, continuity and timing. The lecture template's overlay-kind quota is not a cartoon quality gate. Apply only the shared content, source, resource and approval rules that actually concern the cartoon; do not copy lesson metadata or source-video layouts into the story by default.

Use [Claude Animation Base: local adaptation](references/claude-animation-base.md) when planning character acting, object handling, or a hand-drawn look. It translates the user's reference into the existing Remotion workflow; it does not make its character design, palette, facial features, constant motion, or renderer the project's defaults.

For code-drawn illustration detail, articulated characters, grounded walking, or reproducible frames, use [Hanif's animation skill: local adaptation](references/hanif-animation-detail.md). It complements the acting reference with material layers, rig review, and render-order checks.

For the user's painted-film quality reference, use [Paint MV: visual direction](references/paint-mv-visual-direction.md): cohesive watercolor rendering, shared character/set design, and action-driven scene connections timed to speech. For cut-paper style or physical bone rigs, use [Papermotion integration](references/papermotion-integration.md) and the project-local `papermotion` skill. Its stateful simulation requires a different frame-export strategy from pure Remotion animation.

## Plan before building

Use the actual audio and its word-aligned transcript. Do not estimate sentence timing from the written script or reuse approximate timing from an earlier scene. Correct uncertain transcript words by listening, or omit them from displayed captions until verified. Before producing or moving assets, make a compact storyboard with one row per sentence:

| Time / sentence | Setting | Visible character | Speaker / narrator | Action and prop | Camera / composition | Existing or needed asset |
|---|---|---|---|---|---|---|

Define the scene inventory (locations, background layouts, character designs and poses) and animation plan. Check that every sentence has a visual that conveys its meaning. A pose swap or new text card alone is not a new scene.

## Build scenes that read clearly

- Give each distinct workplace or location its own background and composition. For example, a stocker works among shelves; a cashier stays at the register and belt. Do not stage every character against the same background and camera angle.
- Make the speaker and action readable. Use a meaningful cut, camera reframe, or change of activity at each sentence boundary. For a long sentence, add short cutaways for its distinct actions or objects.
- Keep character identity, clothing, scale, lighting, and proportions consistent across poses. Reuse approved artwork where it fits; create new assets only for a clear gap in the storyboard.
- For detailed code-drawn assets, specify the material's base, texture, and edge treatment before drawing it. Give the focal character or prop the most readable detail; simplify distant textures. Use a consistent ground origin, test joint bends and near/far limb order, and match stride to travel so planted feet do not skate.
- Animate the task itself: reach and place a product, move an item along a belt, scan it, carry a box, hand something over, or leave the location. Use small purposeful movement to support the action; do not rely on continuous idle swaying.
- Block readable key poses before in-betweens. Stage the important event, then its reaction; give each enough time to be understood within the spoken interval. Use anticipation, curved paths, weight, and staggered settling where they clarify the action.
- For object handling, plan reach → grip → move → contact → release. While held, attach the prop to the hand's transform; after release, anchor it to the shelf, counter, or other destination. Inspect consecutive frames around contact, not only attractive stills.
- Drive speaking gestures from the active speaker's voiced word intervals. Other characters must not gesture as if speaking. Mark narrated action cutaways explicitly: the visible actor performs the task while the narrator is off-screen. Pause speech gestures in audio gaps.
- Prefer layered cutouts, pose variants, hand/prop rigs, and Remotion frame-based motion. A still illustration is acceptable only as a brief establishing shot or when the narration describes a still object.
- Keep drawn overlays inside `<Gfx>` and ensure they do not cover faces or other important character details.

## Character and asset constraints

- Preserve the user's character and environment details.
- **No eyes rule (user order 2026-10-27):** Never draw eyes on any character or drawn entity. All drawn characters, people, and creatures must have NO eyes (no pupils, no sclera/whites, no eye sockets). Facial expressions are conveyed through head tilt, eyebrows/forehead lines, mouth movement, and body gestures.
- Avoid unrequested characters, logos, labels, and readable text. Required text must be exact and appear at the spoken moment.
- For a named product, use a checked reference for its silhouette and a real, legible brand asset. Show the product/brand at its own word onset; do not reveal a row of brands before they are named. Check readability at the delivered aspect ratio and mobile size. Never invent a branded label or replace it with generic text when the brand is required.
- Reveal selected captions word by word from the audio timestamps. Do not show future words or add unrequested quotations, religious texts, facts, or concluding sayings. If the user explicitly requests the cited source text, fetch it from its source, preserve the verified wording, identify it as a source quotation, and display its citation at the reference cue. Do not claim the speaker recited the full displayed quotation or invent a hadith grading.
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
