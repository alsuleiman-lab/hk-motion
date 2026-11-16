---
name: investigative-osint-reel
description: Create vertical investigative Reels/Shorts that explain verified posts, screenshots, maps, and other evidence with clear Remotion scenes. Use for OSINT or evidence-led short videos; follow the project's canonical preferences; never isolate the speaker's background.
---

# Investigative OSINT Reel Style (Remotion)

Use this style for short vertical investigations where the viewer needs to understand a claim and inspect its source. The supplied reference video is a visual example, not a source of reusable branding or a replacement for the project's current rules.

## Before designing

1. Read `PREFERENCES.md` and `WORKFLOW_CHECKLIST.md`, then use `video-montage`, `hook`, and `motion-graphics` for their established responsibilities.
2. Treat `PREFERENCES.md` as canonical when this skill conflicts with a current user preference. In particular, **background isolation is not used at all** (user 2026-10-27).
3. Separate verified evidence from narration. Record for each item what it proves, where it came from, and when it was published. A screenshot alone does not verify its origin.

## Composition

Use a 1080×1920 portrait composition at 30 fps unless the active project or user requests a different frame rate. Keep Arabic typography and layout right-to-left. Preserve the project's existing speaker framing and face/beard safe areas.

### Studio narration

- Keep the speaker's recorded room/background visible by default. The reference video's dark tiled studio is an atmosphere cue, not an instruction to replace the speaker's background, blur it, or isolate him.
- Add only evidence that supports the current spoken point. Use a clean, upright screenshot or source image with restrained framing; avoid tilted 3D cards, piles of decorative cards, or filler icons.
- Use the actual source image as the main visual when the evidence itself is being discussed. Follow the **large source image** rule in `PREFERENCES.md`; keep overlays translucent enough for the image to remain visible and text readable.

### Paper investigation

- The reference uses a pale paper texture, a magnifying-glass motif, source screenshots, and a smaller speaker panel. The paper texture and evidence-review mood can inform the style.
- **Approved exception (user 2026-10-24):** in vertical investigation clips that use this skill, the speaker may appear in a smaller rounded panel in the lower part of the frame, with the evidence above him on pale paper (reference starting values: a speaker card of about 920×750). This exception applies only to this investigative paper mode, not to other videos. Keep the whole beard and face visible and unobstructed, keep headroom, and keep any text or evidence out of the speaker panel.
- Outside this paper mode, preserve the established speaker framing and show the actual source large according to `PREFERENCES.md`. A split/writing board is only for a real text, list, comparison, or number that needs a writing area. The second area must not be filled with a decorative image.
- Use the magnifying glass only as a restrained, relevant transition or inspection cue. Do not repeat a large magnifier in empty space as filler.

## Evidence treatment

- Prefer the full, legible original post, page, map, or recording. Keep the source name, account/context, and date visible when needed to understand the evidence; never invent missing metadata.
- For long screens, pan or zoom within the image to the exact item being discussed. Keep the source recognizable and do not crop away context that changes its meaning.
- A highlight box may mark the exact date, name, line, or location under discussion. Use a shape as well as color so the target remains clear. Choose its stroke against the actual screenshot and confirm at least 3:1 contrast; text callouts need 4.5:1, or 3:1 for large text. Check the final composited frame, including opacity and image variation. Red is a reference motif, not a required token.
- Do not cover the speaker's face or beard, or obscure essential content in the source. Follow all source-image, privacy, and people rules in `PREFERENCES.md` even when the reference video violates them. Do not reuse the reference video’s posts, screenshots, faces, or identifying details as footage/assets; obtain and verify actual source material separately, and blur or omit people according to project rules.
- Use text callouts for concise labels, dates, or a short claim. Place them at speech timing, preserve Arabic RTL, and use a solid or translucent backing only where needed for measured contrast. Do not add persistent captions unless the canonical preference requests them.

## Motion and scene data

Represent the edit as a scene list keyed to the narration and the evidence being examined. Each scene should identify its start/duration, mode, speaker treatment, evidence asset and source, optional crop/pan, and any exact highlight region. Change modes at a meaningful narration/evidence boundary, not on a fixed timer.

- Use a spring for an evidence panel's entrance when it suits the beat. The supplied `damping: 14` and `stiffness: 120` are starting values, not universal constants.
- Use smooth interpolation for camera reframing, pans, and subtle zooms. Reserve a stronger jump zoom (up to the proposed 1.15 scale) for an emphasized statement and keep it brief; do not make every layer bounce.
- Use the 5-frame stagger only for a short related sequence that benefits from it. Do not stagger a stack of evidence cards when that makes the material harder to read.
- Keep changes deliberate and calm. Avoid repeated cuts between studio and paper modes when one continuous evidence view explains the point better.

## Branding and finishing

- Do not copy the reference channel's logos, names, or end card. Use only the user's existing brand assets and established placement; avoid a logo that rotates repeatedly.
- Before review, check the complete vertical frame at normal phone size: source text is legible, each highlight points to the spoken item, mode changes are clear, and no evidence or speaker framing is blocked.
- Apply `video-montage`'s preview and approval process. This skill does not itself authorize a render.
