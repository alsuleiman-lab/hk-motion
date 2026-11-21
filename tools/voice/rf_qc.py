# -*- coding: utf-8 -*-
# QC of a recitation fix (tools/recitation_fix.mjs), from the gta6 trial's m_qc.py. ComfyUI's Python (faster-whisper large-v3 on the GPU):
#   python tools/voice/rf_qc.py qc <job.json>                         every candidate of <dir>/finalize.json: alone and in context
#   python tools/voice/rf_qc.py words <wav> <from s> <to s> <out.json>  the words (with times, seconds of <wav>) said in that stretch
# A candidate passes when: the transcript of the words alone has every correct word; in context it has them and none of his wrong words;
# its loudness is within 1 dB of his wrong words; its length is within 35 % of theirs; the silence after it is ≤ 0.4 s.
import json
import os
import re
import sys

import torch  # first: it loads the CUDA DLLs ctranslate2 needs

_tl = os.path.join(os.path.dirname(torch.__file__), "lib")
os.add_dll_directory(_tl); os.environ["PATH"] = _tl + os.pathsep + os.environ.get("PATH", "")
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rf_common import ff, job  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

wm = WhisperModel("large-v3", device="cuda", compute_type="float16")
TASH = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")


def norm(s):
    s = TASH.sub("", s)
    s = re.sub("[ٱأإآ]", "ا", s).replace("ء", "").replace("ى", "ي").replace("ة", "ه")
    return re.sub("[^ء-ي ]", " ", s).split()


def tr(p, words=False):
    segs, _ = wm.transcribe(p, language="ar", beam_size=5, word_timestamps=words)
    segs = list(segs)
    if words:
        return [dict(s=round(w.start, 3), e=round(w.end, 3), w=w.word.strip()) for s in segs for w in (s.words or [])]
    return " ".join(s.text.strip() for s in segs)


def has_all(text, want):
    t = norm(text)
    return all(any(x == y or (len(x) > 3 and (x in y or y in x)) for y in t) for x in want)


if sys.argv[1] == "words":
    src, a, b, outp = sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    tmp = outp + ".tmp.wav"
    ff("-ss", str(a), "-to", str(b), "-i", src, "-ac", "1", "-ar", "16000", tmp)
    W = [dict(w, s=round(w["s"] + a, 3), e=round(w["e"] + a, 3)) for w in tr(tmp, True)]
    os.remove(tmp)
    json.dump(dict(text=" ".join(w["w"] for w in W), words=W), open(outp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(" ".join(w["w"] for w in W))
    sys.exit(0)

J = job(sys.argv[2]); D = J["dir"]
cands = json.load(open(os.path.join(D, "finalize.json"), encoding="utf-8"))
want, wrong = norm(J["to"]), [w for w in norm(J["from"]) if w not in norm(J["to"])]
his_dur = J["last_e"] - J["first_s"]
rows, lines = [], []
for c in cands:
    alone, inctx = tr(c["wav"]), tr(c["ctx"])
    ok_words = has_all(alone, want) and has_all(inctx, want) and not any(w in norm(inctx) for w in wrong)
    ok_db = abs(c["act_db"] - c["target_db"]) <= 1.0
    spoken = c["dur"] - 0.06
    ok_dur = abs(spoken - his_dur) / his_dur <= 0.35
    ok_sil = c["silence_after"] <= 0.40 + 1e-6
    ok = ok_words and ok_db and ok_dur and ok_sil
    rows.append(dict(c, alone=alone, inctx=inctx, ok=ok, ok_words=ok_words, ok_db=ok_db, ok_dur=ok_dur, ok_sil=ok_sil, his_dur=round(his_dur, 3)))
    lines.append(f"{'✔' if ok else '✘'} {c['name']:18s} {c['dur']:.2f}ث (هو {his_dur:.2f}) علوّ {c['act_db']} / {c['target_db']} dB، سكتة بعده {c['silence_after']}ث، "
                 f"إطارات {c['n']}→{c['m']} — وحده «{alone}» — في السياق «{inctx}»")
json.dump(rows, open(os.path.join(D, "qc.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open(os.path.join(D, "qc.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("\n".join(lines))
