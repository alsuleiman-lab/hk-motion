# Round 4: tool fixes (approved by the user on 2026-11-18: «أصلح النص والأدوات كلها»)

Shared rules for every group:
- Other sessions use these tools right now, so keep them backward compatible. Old specs and old projects must still run, with a sensible default when a new field is missing.
- Run `node --check` on every .mjs you touch and `python -m py_compile` on every .py. Run `npx tsc --noEmit -p .` if you touch `src/`.
- Test each change on existing project data. `.tmp/sufi-baath/`, `data/specs/mufti_jordan.json` and `data/specs/umawi_actress.json` exist; read-only tests only, so never overwrite those projects' files. Write test output to `%TEMP%`.
- Keep each file's line endings (CRLF or LF as in `git show HEAD:<file>`).
- Put a short dated comment «(user 2026-11-18, rules review)» on each change.
- Do NOT commit. Report what changed, how it was tested, and anything you could not do.
- Edit only your group's files. If a fix needs a file of another group, report it instead.

## Group A: cut, transcription and checks
Files: `tools/stage.mjs` (cut_words source + answers gate only; the bleep step is already added, do not touch it), `tools/words_drift_check.mjs`, `tools/find_restarts.mjs`, `tools/spec_normalize.mjs`, `tools/writing_place.mjs`, `tools/stream/clip_repair.mjs`, `tools/coverage_check.mjs` (comments only, FIRST_GAP already 1).
1. t14: `cut_words.json` is remapped from `.tmp/<p>/words_table.json` (falling back to `words_vad.json` only if the table is missing). This happens at `stage.mjs` ~224 and ~256 (`remapWords`). Keep the output format `{s,e,w}`.
2. Answers gate (q3): `stage.mjs check` fails while `.tmp/<p>/answers.json` has an answer newer than the last `.tmp/<p>/answers_applied.json` stamp. Print which answer ids are new. Add a tiny `node tools/questions.mjs applied <p>` (Group D owns questions.mjs, so only call it). Write the stamp file directly in stage if needed: `{appliedAt}`.
3. t12/t11: in `words_drift_check.mjs`, «أفوان» is not a marker when the next word is a noun («أفوان الكل» → «أفواه») or «كمّم/كمم» comes before it, and not when the word is «أفغان». «أعيد» or «معليش» alone is not a marker; markers are «عفواً», «عفواً سأعيد» and «مونتاج». In `find_restarts.mjs`, suggestions are only made where a marker is present; a repetition alone is NOT a restart (rhetorical repetition). Remove the reference to the archived `PREFERENCES.md`.
4. First minute 1 s: `spec_normalize.mjs` comment, `writing_place.mjs:91` comment, and the real check in `clip_repair.mjs:18` (0.3 → 1).
5. `clip_repair.mjs:46`: do not force `full:true` on reel verses (d3: the verse is a split screen with the gold panel; full screen only on an explicit request, i.e. a spec item flag `userFull:true`).
6. w5/w15 in `writing_place.mjs:58`: every writing element stays 1.5 s after its last part, with ≥ 0.2 s between two writings in the same slot (replace the 1.0 / 1.8 holds and the −0.15 gap).
7. `spec_normalize.mjs:118-119` (trial #29): write the full list of gaps and failures to `.tmp/<p>/normalize_report.md` instead of truncating it on screen.

## Group B: extraction tools
Files: `tools/names_scan.mjs`, `tools/spec_draft.mjs`, `tools/fetch_images.mjs` (and `tools/fetch_commons.mjs` only for the retry and source log).
1. s10: «عمان»/«عمّان» is the city of Amman (Jordan) when Jordan («الأردن»، «أردني») is mentioned within about 30 s before or after it; otherwise it is Oman (OMN).
2. Maps (round-2 answer): one map per country per video at its first meaningful mention. Later mentions of the same country, its neighbours or its cities become moves on that same map item (pan or zoom keys, or a list of `moves` in the item) — never a new map item. Put the country flag on the country's map (field `flag:true`); a city gets no flag. Nothing automatic inside the hook (the first 30 s of a landscape episode or full portrait, the first 12 s of a reel). Keep old spec fields working.
3. `spec_draft.mjs`:
   - :90, reel verses: no `full:true` (d3).
   - :57, the name card: not inside the hook (≥ 30 s for episodes).
   - Maps per item 2.
4. s9, `fetch_images.mjs`:
   - per-request timeout;
   - on "429" or "too many requests", wait and retry with backoff (3 tries);
   - always write the source page, licence and author next to each picture (a `<name>.source.json` or one `sources.json` per folder);
   - a person photo must contain a face: use OpenCV YuNet `.tmp/models/yunet.onnx` if present (it is used by `tools/blur_faces_video.py`), otherwise skip the check with a warning.

## Group C: engine and elements
Files: `src/MontageSpec.tsx` (PICK_HOLD only), `src/MG.tsx` (MorphContent only), `tools/element_slots.mjs`, `data/element_priority.json`, `tools/el.mjs`, `tools/mix_audio.mjs`.
1. w5: `PICK_HOLD` from 2 to 1.5 in `MontageSpec.tsx` (~701), and the +2 in `element_slots.mjs:17` to 1.5.
2. w8: MorphContent in `MG.tsx` (~327) has no fade in or out (hard cut at from/to). Keep any non-opacity motion.
3. w4 + w13 in `element_slots.mjs`:
   - The one-element rule is checked per AREA, not globally. Landscape areas: writing (bottom key/under slots), right, left, and full or centre panels that take the whole content. Portrait areas: the bottom band and the video/isolation area.
   - Derive each item's area from its grid slot (`data/layout_grids.json`) or kind; an exclusive or full-frame item takes every area.
   - On a clash in the same area, keep the visually more important item (rank) and DROP the lower one (never delay it).
   - Update the `_doc` in `element_priority.json` to say "per area". Keep `--fix`.
4. Stable element ids (round-2 answer):
   - `el.mjs add` gives every new item a stable `id` (short, unique within the spec).
   - `el.mjs set|del` accept `id=<id>` (or `#<id>`) as well as the old index. Index use prints a warning naming the id.
   - `el.mjs items` lists ids.
   - Items without ids get one the first time `el.mjs` saves the spec. Make sure sorting never changes ids.
5. Trial #42: after `el.mjs add` of an item that starts in the first 60 s, run `node tools/coverage_check.mjs data/specs/<p>.json` and print only its first-minute line.
6. t13, echo on one phrase:
   - A spec field `echo: [{from, to, preset?}]` in cut seconds.
   - Applied in `tools/mix_audio.mjs` with the existing echo presets (`tools/echo_audio.py` style 2 or 6) on that range only.
   - Document the field in a comment.

## Group D: render, publish and questions
Files: `tools/render_job.sh`, `tools/render_queue.mjs`, `tools/gpu_render.mjs` (bumper part only), `tools/questions.mjs`.
1. r5, bumper from the montage:
   - The montage writes `spec.bumper = { id?, at?, position: "start"|"end"|"none" }` (the identity skill).
   - `render_job.sh`, `render_queue.mjs` and `gpu_render.mjs` use `spec.bumper` when present and add nothing when `position:"none"`.
   - Fallback when `spec.bumper` is missing (old specs): the current behaviour, with a printed warning "no spec.bumper — legacy default". Kinds paper, ad, explainer and cartoon (spec.kind) default to none.
2. r6, channel hashtag from the montage:
   - The output name comes from `spec.exportTitle` when present, used exactly as written (the montage adds the hashtag and the landscape «-»).
   - Fallback: the current append (already strips a pre-added hashtag).
   - The cartoon (`spec.kind === "cartoon"` or composition prefix `Stick-`/`Dodo-`) gets no hashtag.
3. q3, `questions.mjs`:
   - `add` prints the LAN-IP link (use the logic of `tools/lan_link.mjs` or the first non-internal IPv4) instead of localhost.
   - `add` starts the server in the background if it is not answering on :3110, then tests the link (HTTP 200) and prints ✔ or ✘.
   - New command `node tools/questions.mjs watch <p>`: prints each new answer as it arrives, one line each, by polling `answers.log`, so a Monitor can alert.
   - New command `node tools/questions.mjs applied <p>`: writes `.tmp/<p>/answers_applied.json {appliedAt: now}`.
