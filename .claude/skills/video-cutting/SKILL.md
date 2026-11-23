---
name: video-cutting
description: Build one transcript-aligned cut plan that removes long pauses, spoken montage blocks, marked retakes and non-speech sounds without splitting words. The same metric is used by cutting, the audio gate and final review.
---

# Silence removal with the single cut model

## 1. Source and shared rule

- **Only timing source:** the aligned transcript in `.tmp/<project>/words_table.json` (see `transcription`). Do not let another tool measure word timing independently.
- **One rule:** `data/cut_rules.json` is the sole source for numeric parameters: maximum inter-word gap (user ceiling 0.40 seconds), retained gap, and margins before and after a word. Elsewhere refer to these settings by name without repeating alternative numbers (user instruction, 2026-11-18).

## 2. Build the plan

Create it with:

`node tools/stage.mjs cut <project> [--rem …] [--keep …] [--keep-sound …]`

- Calculate the plan from words. Keep or remove each word as a whole; never cut inside a word or its margin. The build shortens any gap over the configured maximum so no longer pause remains in the output.
- **Remove (`--rem`, source-time ranges):** spoken «مونتاج … انتهى مونتاج» blocks and failed takes marked «عفواً» / «عفواً سأعيد» (see `montage-orders`), plus non-speech sounds found by review (isolated laugh, throat clear, sneeze, sigh, clicks, doors and ASR hallucinations).
- **Plan segment types** (no manual exceptions): Sheikh speech; a displayed clip with its original audio (display windows × speaker turns, exempt from silence checks); and intentional sound that must remain complete (adhan or nasheed, `--keep-sound`). Use `--keep` only for a complete interval the user specifically asked to preserve.
- Speech detected by the audio scanner but absent from the word table must be kept and reported; never silently delete it.
- A broadcast or lesson is cut once as a whole, then its clips are sliced from that shared cut.
- Keep retained parts in the user's requested order, even if that is not chronological (2026-10-30; reaffirmed 2026-11-18).
- “Do not remove this pause” means apply `--keep` to the full pause and verify the output with `final_review --max-gap` (user instruction, 2026-11-18).

## 3. Verify with one metric

`node tools/cut_model.mjs verify <project> [--file <file>]`

The cutter, audio gate and final review use this same verifier; do not introduce a second metric. For each violation, print its final-video time, type (pause, cut inside word, or file/map mismatch), measured value, limit, adjacent words and corrective action. Never report only “failed” or “stale”.

Before any acoustic measurement, inspect the audio channel count (user instruction, reaffirmed 2026-11-18).

## 4. Fixed processing order

Run this sequence within the cut command (user instruction, 2026-11-18): audio gate (non-speech sounds, join clicks and the shared metric) → bleeping (`sensitive-words`) → RNNoise cleanup → GPU cut build → background motion smoothing → remap words and anchors to cut time (`cut_words.json`). Resolve any audio item marked “review” before building: remove it with `--rem` or record why it stays.

## 5. Prohibited shortcuts

Do not remove the Sheikh's speech or content from displayed clips outside the decisions listed above. Use complete, explicit keep/remove ranges; never patch the generated plan by hand. Change `--rem` and regenerate the plan, or use the targeted `segment-cut` skill for a user-requested segment.

## Acceptance gate

The shared metric has no violation on cut audio; the audio gate passes; there are no open “review” sounds; and words and anchors are mapped to the cut timeline (`words_drift_check` matches them against cut audio).

Read `references/detail.md` for processing stages, output files, sound-channel rules and known exceptions.

## Additional established instructions

- **Displayed-clip audio** (spoken user order, 2026-11-18, «مذيع يقتل أطفاله»): when the sound occupies one channel, duplicate it to both channels in every recording. Preparation does this automatically. If the recording says the clips contain music, remove the music from each clip with the local music-separation tool before cutting.
- **Retake hidden inside ASR** (lesson correction, 2026-11-19): after `stage cut`, transcribe the complete cut audio once with the strongest model and no VAD, then search for «عفو/أعيد/مونتاج» (see `references/detail.md`).
- **Every spoken video passes through cutting** (user instruction, 2026-11-20, «عقيدة المفسّر» reel): silence cutting is mandatory for every video with speech, including clips from another Sheikh, standalone motion, or reels from a URL. Run `stage.mjs prep`, then `stage.mjs cut`, using word-table boundaries for `--rem`. Do not replace it with an audio-threshold silence detector; room noise caused threshold detection to miss many pauses.
