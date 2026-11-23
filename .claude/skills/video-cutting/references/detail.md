# Detailed cut pipeline

Binding details for `video-cutting`. The main skill is newer where a rule differs; preserve every threshold and operational exception here.

## 1. Source, plan and verification

- The single model and all numeric limits live in `data/cut_rules.json`: maximum gap, retained gap, word margins and frame grid.
- Required chain (user order, 2026-11-18): `stage.mjs prep` → aligned `words_table.py` → `stage.mjs cut` → `cut_model plan` creates `public/<project>_map.json` with `speech`, `clip` and `sound` intervals → cut audio → `audio_gate` → `bleep_words.py` → `audio_clean.mjs` (RNNoise) → `cut_edl`.
- Verify only with `node tools/cut_model.mjs verify <project> [--file <file>]`. It rejects gaps over the limit, cuts inside words and media/map mismatches. The audio gate and final review use this verifier. Do not run legacy `pause_check`, `join_edge_scan` or `join_word_scan` against a model-generated map; they remain only for old maps.
- Displayed clips enter the plan automatically as `clip` intervals from display windows × speaker turns. `--keep a-b` is only for an entire user-requested interval. Intentional sound (adhan, nasheed, applause) uses `--keep-sound a-b`; the audio gate reads these plan types.
- For `--rem a-b`, remove every whole word whose midpoint is inside the range. Speech without a word-table entry is retained and listed as “speech detected by the scanner”.
- `orphan_scan` lists short surviving fragments between removed ranges and hesitant speech. Read each alert in context. Remove a fragment that is incomplete (e.g. isolated «وخذ أكل عادي») or a garbled hesitation (e.g. «وفي آلهة تصل أبو مدري إيش») with `--rem` at genuine silence. Keep complete speech (e.g. «الصوتية كما» from «أو الصوتية… كما خرجت من لسانه», or «بعثية. في» at the end of «ولكنهم بعثية») and explain the keep decision in `orphans_ok.json` (user instruction, 2026-11-18).
- Keep retained intervals in the user's stated order, not original-time order (2026-10-30; reaffirmed 2026-11-18).
- Preserve “do not cut this pause” with `--keep a-b`; then verify with `final_review --max-gap` that this pause is the only one above the usual limit.
- Start every audio measurement by checking the number of channels; a silent channel or mismatched stereo channels corrupt the measurement (reaffirmed 2026-11-18).
- `smooth_dups.py` runs automatically in `cut` and produces `<project>_cut_s.mp4` for building. Whenever a `scale` changes aspect ratio, append `setsar=1`.

## 2. One-pass GPU cut (HK-Motion, user instruction 2026-11-19)

To avoid separate smoothing and a third encode, `stage.mjs cut` calls `tools/cut_build_gpu.py`: decode on the GPU → cut on the 30 fps frame grid → repair duplicate frames using the same algorithm as `smooth_dups.py` → perform one encode. It writes the main `<project>_cut_s.mp4` and the lightweight Studio proxy (`_prev_<version>.mp4/.m4a` registered in `data/preview_proxies.json`) in the same pass. `<project>_cut.mp4` is a hard link to the same file. There is no separate background smoothing or proxy encode. Write to `.part`, then atomically move the completed file. On failure, or with `CUT_BUILD_OLD=1`, use the legacy chain (cut, then background smoothing).

## 3. Bleeps and echo

- Sensitive-word bleeping uses the word level from `data/sensitive_words.json` and mutes the source under the bleep. Use `python tools/bleep_words.py <project> <output.wav>` (user instruction, 2026-11-18).
- If echo is requested, preserve the intended choices: style 2 (“cathedral”, for adhan or solemn speech) or style 6 (“warm/deep”, the default). Store each selected interval in the existing spec's `echo` array as `{from, to, preset}`, using cut-timeline seconds. `tools/mix_audio.mjs` runs `tools/echo_audio.py` for each span and lays the result back under following audio; `tools/render_job.sh` invokes the mixer. Do not use `tools/reverb.mjs` as a substitute. Check the final mixed audio and fail the render if an echo interval or preset is invalid.
- Reduce echo on clips from other speakers (`echo_check.py` + `audio_gate --echo`); the output must not be worse than the original. If 2.5–5 kHz is more than 14 dB below 600–1200 Hz, apply a presence EQ with a peak limiter.

## 4. Displayed-clip sound (user's spoken instruction, 2026-11-18)

The recording has three audio tracks: mix, the Sheikh's microphone and computer audio (the displayed clips). `node tools/clip_audio_fix.mjs <project>` duplicates computer audio to both channels and rebuilds the mix from the microphone plus repaired computer audio. It runs automatically at the end of `stage prep`; the old mix remains as the final track.

When the recording says to remove music from clips, pass `--music`. Use the local UVR MDX-Net model in `S:/AI_Tools/RemoveMusic` on the GPU to keep speech only. Run it after preparation and before cutting.

## 5. Hidden retakes inside ASR (c2598 episode, 2026-11-19)

The user found «هذا ما يشغل السوريين عفواً» at frame 528. The word table contained only the second take because decoding dropped the first attempt and «عفواً». Therefore `redo.txt` and `orders_scan` did not find the marker, and the cut retained it; alignment stretched a word across the hidden take.

After `stage cut`, transcribe the entire cut audio once with the strongest model and no VAD; search the result for «عفو/أعيد/مونتاج». Repeat this on the rendered export before publication (see `checking`).

Repair notes from that case: `cut_block <project> A B` takes boundaries in genuine silence (10 ms RMS below −34 dB in `cut16k.wav`). Correct `cut_words.json` in that interval first, then manually shift `pmap.moves` (cut_block does not shift overlapping moves). For the recording-tail click, use `cut_block --force` on the last 0.17 seconds. Mute an incorrect join using `mute_ranges`.

If the word table contains an ASR error (e.g. it says «إيران» but audio says «إلى»), correct the table. If an extraction requirement still expects the erroneous word, set `skipRequired` with a reason.
