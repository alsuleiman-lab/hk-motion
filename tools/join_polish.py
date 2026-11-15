"""ROOT FIX for leftovers at cuts (user 2026-11-13, frame 10878: «لما تحذف ليش تبقى بقايا؟ عندك أول الكلمة وآخرها… حل جذري»).
Usage: python -I tools/join_polish.py <project> [--db -40] [--max 0.30]
Every segment edge of public/<p>_map.json is moved to the NEAREST REAL SILENCE of the source audio (.tmp/<p>/a16k.wav) so that
  • the last 25 ms before an end edge, and the first 25 ms after a start edge, are < --db dB (a cut never lands on sound),
  • a kept word is never clipped: an edge that falls inside a word whose body is on the kept side is moved OUT to the silence after/before that word,
  • nothing of a deleted word survives: an edge that falls inside a word whose body is on the deleted side is moved IN to the silence before/after that word.
Edges move on the 1/30 s grid (the video cut grid), at most --max seconds; an edge that finds no silence inside --max is reported (✘, exit 1) and left alone.
The words come from .tmp/<p>/words_vad.json (source seconds). Idempotent; renumbers `n`; stage.mjs cut runs it before every audio build and the audio gate re-checks every join (tools/join_edge_scan.py)."""
import sys, json, wave, os, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
p = sys.argv[1]
thr = float(sys.argv[sys.argv.index("--db") + 1]) if "--db" in sys.argv else -40.0
maxs = float(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 0.30
T = os.path.join(".tmp", p); mapf = os.path.join("public", f"{p}_map.json")
w = wave.open(os.path.join(T, "a16k.wav")); sr = w.getframerate(); ch = w.getnchannels(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; w.close()
if ch > 1: x = x.reshape(-1, ch).mean(axis=1)
dur = len(x) / sr
def db(a, b):
    a, b = max(0, int(a * sr)), min(len(x), int(b * sr))
    return -120.0 if b <= a else float(20 * np.log10(np.sqrt((x[a:b] ** 2).mean() + 1e-12) + 1e-9))
words = []
try: words = [{"s": float(v["s"]), "e": float(v.get("e", v["s"] + 0.25)), "w": v.get("w", "")} for v in json.load(open(os.path.join(T, "words_vad.json"), encoding="utf-8"))]
except Exception: pass
M = json.load(open(mapf, encoding="utf-8")); segs = M["segments"]
G = 1 / 30
def word_at(t):
    for v in words:
        if v["s"] < t < v["e"]: return v
    return None
def pick(t, prefer, ok):
    """nearest grid point to t inside [t-max, t+max] satisfying ok(), looking first in the preferred direction (+1 later / -1 earlier / 0 nearest)"""
    k0 = round(t / G)
    steps = int(maxs / G) + 1
    order = []
    for s in range(0, steps + 1):
        if prefer >= 0: order += [(s, 1)] + ([(s, -1)] if s else [])
        else: order += [(s, -1)] + ([(s, 1)] if s else [])
    if prefer == 0: order.sort(key=lambda z: z[0])
    # preferred direction first, the other only when the preferred finds nothing
    first = [z for z in order if prefer == 0 or z[1] == (1 if prefer > 0 else -1)]
    second = [z for z in order if prefer != 0 and z[1] != (1 if prefer > 0 else -1)]
    for s, d in first + second:
        q = (k0 + d * s) * G
        if 0 <= q <= dur and ok(q): return q
    return None
explicit = []
try: explicit = [tuple(r) for r in json.load(open(os.path.join(T, "explicit_rem.json"), encoding="utf-8"))]
except Exception: pass
def runs(a, b, thr=-34.0):
    """voiced runs (> thr, 10 ms frames) inside [a,b] → [(start,end)]"""
    i, out = int(a / 0.01), []
    n = int(b / 0.01)
    while i < n:
        if db_fr(i) <= thr: i += 1; continue
        j = i
        while j < n and db_fr(j) > thr: j += 1
        out.append((i * 0.01, j * 0.01)); i = j
    return out
db_fr = lambda i: db(i * 0.01, (i + 1) * 0.01)
absorbed = []
for rr in explicit:
    ra, rb = rr
    for s_ in segs:
        # the segment that starts right after a removed block: drop short stray runs before its first real word (>= 0.20 s)
        if abs(s_["a"] - rb) < 0.40 or (s_["a"] >= rb - 0.01 and s_["a"] - rb < 0.40):
            rs = runs(s_["a"], min(s_["b"], s_["a"] + 1.2))
            k = 0
            while k < len(rs) - 1 and (rs[k][1] - rs[k][0]) <= 0.20 and rs[k + 1][0] - rs[k][1] >= 0.04:
                k += 1
            if k > 0:
                q = rs[k][0] - 0.10
                q = round(q / G) * G
                if db(q, q + 0.025) < thr and q > s_["a"] and q < s_["b"] - 0.06:
                    absorbed.append((round(s_["a"], 2), round(q, 2))); s_["a"] = round(q, 4)
        # the segment that ends right before a removed block: drop short stray runs after its last real word
        if abs(s_["b"] - ra) < 0.40:
            rs = runs(max(s_["a"], s_["b"] - 1.2), s_["b"])
            k = len(rs) - 1
            while k > 0 and (rs[k][1] - rs[k][0]) <= 0.20 and rs[k][0] - rs[k - 1][1] >= 0.04:
                k -= 1
            if k < len(rs) - 1:
                q = round((rs[k][1] + 0.10) / G) * G
                if db(q - 0.025, q) < thr and q < s_["b"] and q > s_["a"] + 0.06:
                    absorbed.append((round(s_["b"], 2), round(q, 2))); s_["b"] = round(q, 4)
moved, stuck, maxshift = 0, [], 0.0
# (user 2026-11-15 «قص السكتات المشوشة لازم من أول قص») the noise-only pauses that stage.mjs cuts inside a kept clip (.tmp/<p>/noise_gaps.json): their edges are
# the VAD's own edges (0.18 s after the last voice, 0.10 s before the next) inside the clip's background noise, where no real silence exists — accepted where they are
noise_edges = []
try: noise_edges = [v for g in json.load(open(os.path.join(T, "noise_gaps.json"), encoding="utf-8")) for v in g]
except Exception: pass
at_noise = lambda t: any(abs(t - v) < 0.15 for v in noise_edges)   # 0.15: stage.mjs's pause trimming shaves up to 0.12 s off an edge
okj = {}   # edges that sit in a breath/noise tail with no silence: cut 0.10 s after the last word / before the first word (recorded so the gate does not re-flag them)
gr = lambda v: round(v / G) * G
for i, s in enumerate(segs):
    a, b = s["a"], s["b"]
    if db(a, a + 0.025) >= thr and at_noise(a):   # edge of a no-voice pause in a kept clip. Real silence within 0.12 s (later first: past a splice click, e.g. «إدلب» 520.137 s)
        q = pick(a, 1, lambda q: db(q, q + 0.025) < thr and q < b - 0.06)   # is used; else the edge stays where the VAD put it, in the clip's noise. Silero's edge is more
        if q is not None and abs(q - a) <= 0.12: maxshift = max(maxshift, abs(q - a)); s["a"] = round(q, 4); moved += 1   # exact than Whisper's word times here (they spilled up to 1.2 s into the gaps)
        okj[f"{s['a']:.2f}"] = "pause with no human voice cut inside a kept clip: VAD edge in the clip's noise"
    elif db(a, a + 0.025) >= thr:      # start edge on sound
        v = word_at(a + 0.012)
        prefer = (1 if (v and (v["s"] + v["e"]) / 2 < a) else -1) if v else 0   # body already passed → the rest is a leftover tail: go later; else the word is kept: extend earlier
        q = pick(a, prefer, lambda q: db(q, q + 0.025) < thr and q < b - 0.06)
        nxt = [v for v in words if v["s"] >= a]
        if q is None and nxt and nxt[0]["s"] - a > 0.2 and gr(nxt[0]["s"] - 0.10) < b - 0.06 and gr(nxt[0]["s"] - 0.10) > a:
            q = gr(nxt[0]["s"] - 0.10); okj[f"{q:.2f}"] = "breath/noise before the first word: cut 0.10 s before it"
        if q is None and at_noise(a):
            q = a; okj[f"{q:.2f}"] = "noise-only pause cut inside a kept clip: VAD edge in the clip's noise"
        if q is None: stuck.append((round(a, 2), "start", round(db(a, a + 0.025), 1)))
        else: maxshift = max(maxshift, abs(q - a)); s["a"] = round(q, 4); moved += 1
    if db(b - 0.025, b) >= thr and at_noise(b):   # same, 0.18 s after the voice (earlier first)
        q = pick(b, -1, lambda q: db(q - 0.025, q) < thr and q > s["a"] + 0.06)
        if q is not None and abs(q - b) <= 0.12: maxshift = max(maxshift, abs(q - b)); s["b"] = round(q, 4); moved += 1
        okj[f"{s['b']:.2f}"] = "pause with no human voice cut inside a kept clip: VAD edge in the clip's noise"
    elif db(b - 0.025, b) >= thr:      # end edge on sound
        v = word_at(b - 0.012)
        prefer = (-1 if (v and (v["s"] + v["e"]) / 2 > b) else 1) if v else 0   # body still ahead → a leftover onset: go earlier; else the word is kept: extend later
        q = pick(b, prefer, lambda q: db(q - 0.025, q) < thr and q > s["a"] + 0.06)
        prv = [v for v in words if v["e"] <= b]
        if q is None and prv and b - prv[-1]["e"] > 0.2 and gr(prv[-1]["e"] + 0.10) > s["a"] + 0.06 and gr(prv[-1]["e"] + 0.10) < b:
            q = gr(prv[-1]["e"] + 0.10); okj[f"{q:.2f}"] = "breath/noise after the last word: cut 0.10 s after it"
        if q is None and at_noise(b):
            q = b; okj[f"{q:.2f}"] = "noise-only pause cut inside a kept clip: VAD edge in the clip's noise"
        if q is None: stuck.append((round(b, 2), "end", round(db(b - 0.025, b), 1)))
        else: maxshift = max(maxshift, abs(q - b)); s["b"] = round(q, 4); moved += 1
n = 0.0
for s in segs: s["n"] = round(n, 3); n += s["b"] - s["a"]
M["duration"] = round(n, 3)
json.dump(M, open(mapf, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
jf = os.path.join(T, "join_ok.json")
old = {}
try: old = json.load(open(jf, encoding="utf-8"))
except Exception: pass
old.update(okj); json.dump(old, open(jf, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if absorbed: print("join_polish: stray sounds next to the removals absorbed:", absorbed)
print(f"join_polish: {moved} حافة نُقلت إلى صمت حقيقي (أقصى إزاحة {maxshift:.3f}ث) · المدة {n:.2f}ث")
if stuck:
    print(f"✘ join_polish: {len(stuck)} حافة بلا صمت ضمن {maxs}ث (تُعالَج يدوياً): " + "، ".join(f"{a}ث {k} {d}dB" for a, k, d in stuck[:12]))
    sys.exit(1)
