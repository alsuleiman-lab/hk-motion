# -*- coding: utf-8 -*-
# --apply of tools/recitation_fix.mjs: the chosen candidate into the cut audio (critical-rules 17), by the same rf_common.build as the preview.
#   python tools/voice/rf_splice.py <job.json> <candidate.wav> <out.wav>
# Writes the whole new cut audio (same rate and channels as .tmp/<p>/cut_audio.wav) and prints {n, m, cand_at, cand_len, tail, silence_after} as JSON.
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rf_common import SR, active_db, job, level, read, read_wav, splice_into, trim, wav_info, write  # noqa: E402

J = job(sys.argv[1]); cand_p, out = sys.argv[2], sys.argv[3]
sr, ch, _ = wav_info(J["cut_audio"])
if sr != SR:
    raise SystemExit(f"rf_splice: the cut audio is {sr} Hz, expected {SR}")
orig = read_wav(J["cut_audio"])
his = read_wav(J["cut_audio"], J["first_s"], J["last_e"]); his = his.mean(1) if his.ndim > 1 else his
cand = level(trim(read(cand_p)), active_db(his)[0])
new, info = splice_into(J, cand, orig if orig.ndim > 1 else orig[:, None])
write(out, new if ch > 1 else new[:, 0])
info.update(old_len=round(len(orig) / SR, 4), new_len=round(len(new) / SR, 4), act_db=round(active_db(cand)[0], 1), target_db=round(active_db(his)[0], 1))
print(json.dumps(info))
