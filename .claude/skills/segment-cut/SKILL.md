---
name: segment-cut
description: Remove a user-specified time or frame range at any stage of a video project. Snap both boundaries between complete words, remove only the requested interval, and shift later media and overlays without rebuilding the rest.
---

# Cut a specified segment

## When to use

Use whenever the user says “cut from second/frame X to Y” or “remove this part” with its boundaries, before the build, after the build, or after a review link.

## Snap both boundaries between complete words

- Convert the user's values to seconds on the timeline they can see: the current cut timeline in Studio; frame number ÷ 30. Studio frame numbers after the bumper include 150 extra frames; subtract them before conversion (user, 2026-11-18).
- Read nearby words in `cut_words.json`. If a boundary falls inside a word or its margin, move it to the nearest inter-word gap so the whole word is kept or removed. Never leave half a word. Follow the user's intent: remove the entire word where deletion begins and ends unless the latter is the first word they explicitly want to keep.
- The remaining gap at the new join must stay within the maximum gap and margins in `data/cut_rules.json`; do not change the surrounding joins.
- Tell the user the adjusted boundaries using the last word before the cut and first word after it.

## Remove only the requested interval

Use the current tool (user instruction, 2026-11-19, “like Premiere Pro”):

`node tools/cut_blocks.mjs <project> start-end[,start-end…] --snap-words`

Times are on the current cut. This is a smart cut without full video re-encoding:

- Snap the boundaries between words, then to the nearest real silence within ±0.5 seconds below −40dB. Check **every** join before touching any file. A rejected cut costs under a second and changes nothing.
- Re-encode only the GOPs containing a join (about one second per join). Copy complete GOPs between them with `tools/cut_splice.py`. All unaffected media stays bit-for-bit unchanged in one MP4 playable by Studio and Remotion. The Studio proxy is cut in the same way.
- If the file was not made by our encoder (fingerprint differs), or a valid graphics card is unavailable, fall back to full encoding. `CUT_BLOCKS_FULL=1` forces full encoding.
- In HK-Motion Studio, choose **Start**, **End**, then **Delete** (see `hk-motion`); this invokes the same tool.
- **Lazy deletion** (2026-11-19): update the cut map, audio and lightweight proxy only; do not edit the heavy cut file (it is now stale). A consumer that needs pixels must build them from the original on demand via `tools/cut_lazy.mjs`. Never assume `<project>_cut_s.mp4` is current after deletion; run `node tools/cut_lazy.mjs ensure <project>` before reading it.
- The older single-range command `cut_block.mjs` still updates the project data, but use the tool above to cut video.

For the legacy one-range data update, use `node tools/cut_block.mjs <project> <start> <end>` (seconds or `f<frame>`), always with `--snap-words` (user decision, 2026-11-17). It prints the words around the join. Read them and, if the nearest boundary leaves a dangling word or broken sentence, retry with `--keep-word` or `--drop-word` so the complete word is retained or removed. Tell the user the adjacent words.

- Everything before the first boundary remains frame-accurate. Everything after the second boundary moves earlier by exactly the removed duration. Nothing inside remains.
- Update together: a versioned cut file (do not replace one Studio currently has open), audio, map, word times, specification (items, zooms, shake, mattes, splits and duration), and frozen review copy.
- Remove an item fully inside the deleted interval; shorten an item that only overlaps its edge, and report the change.
- Add a 12-millisecond audio fade on both sides of the join to prevent clicks without changing duration.
- Preserve the user's requested order of retained segments, even when it is non-chronological (2026-10-30; reiterated 2026-11-18).

## Validate only the affected join

Check the new join itself for excessive silence and mid-word cuts, and inspect a frame at the join. Do not run a full project review for this targeted change.

## Acceptance gate

The requested interval is removed; both boundaries fall between complete words; the join passes the single relevant metric; all later elements move with their words; and everything before the cut remains unchanged. Complete the operation in seconds, not minutes.

Read `references/detail.md` for the binding boundary calculations and examples.
