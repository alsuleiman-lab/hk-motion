# -*- coding: utf-8 -*-
"""يفرّغ ملف صوت عربي بنموذج كبير ويقارنه كلمةً كلمة بنص الأصل (بلا تشكيل) ويطبع الفروق وأزمنة الكلمات.
  python tools/ext/asr_check.py <صوت.wav> <نص-الأصل.txt> [<مخرج.json>]
التفريغ لا يميز الحركات: الحكم النهائي على النطق بسمع المستخدم. كلمة ناقصة أو زائدة تُرى هنا."""
import sys, os, re, json, difflib
sys.stdout.reconfigure(encoding="utf-8")
import torch  # يحمّل مكتبات CUDA المرافقة
_tl = os.path.join(os.path.dirname(torch.__file__), "lib")
if os.path.isdir(_tl) and hasattr(os, "add_dll_directory"):
    os.add_dll_directory(_tl)
    os.environ["PATH"] = _tl + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel

wav, txt = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else wav + ".asr.json"
DIAC = re.compile("[ً-ٰٟـ]")
def norm(s):
    s = DIAC.sub("", s)
    s = re.sub("[أإآ]", "ا", s).replace("ى", "ي").replace("ة", "ه")
    s = re.sub(r"[^\w\s]", " ", s)
    return s.split()
ref = norm(open(txt, encoding="utf-8").read())
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
segs, _ = m.transcribe(wav, language="ar", word_timestamps=True, beam_size=5, vad_filter=False)
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
heard = norm(" ".join(x["w"] for x in words))
sm = difflib.SequenceMatcher(a=ref, b=heard)
bad = 0
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op != "equal":
        bad += 1
        print(f"{op}: أصل={' '.join(ref[i1:i2])!r}  مسموع={' '.join(heard[j1:j2])!r}")
print(f"كلمات الأصل {len(ref)} ، المسموعة {len(heard)} ، مواضع الاختلاف {bad}")
json.dump({"words": words, "ref": ref}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
