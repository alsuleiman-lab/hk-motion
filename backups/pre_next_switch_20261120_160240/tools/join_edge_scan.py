"""Gate: every join of the cut must sit in real silence on BOTH sides (user 2026-11-13, frame 10878: a 40 ms onset of a deleted word stayed before the join and was heard as «عفواً»;
«لما تحذف ليش تبقى بقايا؟ عندك أول الكلمة وآخرها»).
Usage: python -I tools/join_edge_scan.py <a16k.wav of the SOURCE> <map.json> [--db -40] [--ms 25]
Measured on the SOURCE audio at the map edges (the cut audio is level-evened, so its floor is boosted and says nothing about the cut): for every segment, the first `ms` after its start edge and the last `ms` before its end edge. Voiced (> --db) on EITHER side = a word was cut through
(a leftover onset/tail of a deleted word, or a kept word clipped): ✘ with the join time, the Studio frame (+150 once the 5 s bumper is in) and the words around it.
Both sides are stereo-safe (channels are averaged). Exit 1 when any."""
import sys, json, subprocess, wave, numpy as np, os, tempfile
sys.stdout.reconfigure(encoding="utf-8")
src, mapf = sys.argv[1], sys.argv[2]
db_thr = float(sys.argv[sys.argv.index("--db") + 1]) if "--db" in sys.argv else -40.0
ms = float(sys.argv[sys.argv.index("--ms") + 1]) if "--ms" in sys.argv else 25.0
tmp = None
if not src.lower().endswith(".wav"):
    fd, tmp = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", tmp], check=True); src = tmp
w = wave.open(src); sr = w.getframerate(); ch = w.getnchannels(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; w.close()
if tmp: os.remove(tmp)
if ch > 1: x = x.reshape(-1, ch).mean(axis=1)
db = lambda a, b: 20 * np.log10(np.sqrt((x[max(0, int(a * sr)):max(1, int(b * sr))] ** 2).mean() + 1e-12) + 1e-9)
segs = json.load(open(mapf, encoding="utf-8"))["segments"]
p = os.path.basename(mapf).replace("_map.json", "")
fresh = []
try: fresh = json.load(open(os.path.join(".tmp", p, "drift_fresh.json"), encoding="utf-8"))
except Exception: pass
okf = {}
try: okf = json.load(open(os.path.join(".tmp", p, "join_ok.json"), encoding="utf-8"))   # {"<join sec>": "why this join is fine (his decision)"}
except Exception: pass
m = ms / 1000.0
t, bad = 0.0, []
for i, sg in enumerate(segs):
    cut_t = t; t += sg["b"] - sg["a"]
    pre_s, post_s = db(sg["a"], sg["a"] + m), db(sg["b"] - m, sg["b"])     # this segment's first and last 25 ms (source)
    for lab, val, at_src, at_cut in (("بداية المقطع", pre_s, sg["a"], cut_t), ("نهاية المقطع", post_s, sg["b"], t)):
        if val > db_thr and not (i == 0 and lab == "بداية المقطع") and not (i == len(segs) - 1 and lab == "نهاية المقطع") and not any(abs(float(k) - at_src) < 0.05 for k in okf):
            near = [fw["w"] for fw in fresh if at_cut - 0.6 <= fw["s"] <= at_cut + 0.6]
            bad.append((round(at_cut, 2), lab, round(at_src, 2), round(float(val), 1), " ".join(near[:6])))
mm = lambda v: f"{int(v // 60)}:{v % 60:05.2f}"
if bad:
    print(f"✘ join_edge_scan: {len(bad)} وصلة قُطعت عند صوت (بقية كلمة محذوفة أو كلمة مبتورة) — انقل القطع إلى وادي الصمت بين الكلمتين (cut_block) أو اكتم البقية ≤ 0.12ث (mute_ranges):")
    for a, lab, srcs, v, nw in bad[:40]: print(f"   {mm(a)} ({a}ث، إطار Studio بعد الفاصل {round(a * 30) + 150}) {lab} (المصدر {srcs}ث) {v} dB — حولها: {nw}")
    sys.exit(1)
print(f"✔ join_edge_scan: كل الوصلات ({len(segs) - 1}) عند صمت من الجهتين")
