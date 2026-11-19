"""Find the stray sound behind an audible correction word («عفواً/أعيد/معليش/مونتاج») in the cut and turn it into a permanent drop (user 2026-11-13, frame 10878).
Usage: python -I tools/stray_find.py <project> [--write]
Reads .tmp/<p>/drift_fresh.json (fresh large-model pass over the real cut audio), the cut map and the SOURCE audio. For each correction word heard at cut second t:
  t → source second ts (through the map); the voiced runs (> -34 dB, 10 ms frames) within ±0.7 s of ts that are KEPT by the map and last <= 0.30 s are the candidates
  (a leftover tail/onset of a deleted word, a breath, a click). They are written, expanded by 30 ms, to .tmp/<p>/stray_drops.json (source seconds) — stage.mjs cut passes them
  as extra --rem, so the drop survives every rebuild. A run that sits inside a longer continuous voiced stretch is NOT a candidate (that would be speech)."""
import sys, json, os, wave, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
p = sys.argv[1]; T = os.path.join(".tmp", p)
w = wave.open(os.path.join(T, "a16k.wav")); sr = w.getframerate(); ch = w.getnchannels(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; w.close()
if ch > 1: x = x.reshape(-1, ch).mean(axis=1)
hop = int(sr * 0.01); n = len(x) // hop
db = np.array([20 * np.log10(np.sqrt((x[i * hop:(i + 1) * hop] ** 2).mean()) + 1e-9) for i in range(n)])
segs = json.load(open(os.path.join("public", f"{p}_map.json"), encoding="utf-8"))["segments"]
fresh = json.load(open(os.path.join(T, "drift_fresh.json"), encoding="utf-8"))
BAD = {"عفوا", "عفواً", "عفو", "أعيد", "اعيد", "أعيدها", "معليش", "مونتاج", "منتاج", "موتاج", "أفوان", "أفون", "فون", "فوان"}
norm = lambda z: "".join(c for c in z if c.isalpha())
def to_src(t):
    for s in segs:
        if s["n"] <= t < s["n"] + (s["b"] - s["a"]): return s["a"] + (t - s["n"]), s
    return None, None
def kept(ts): return any(s["a"] <= ts < s["b"] for s in segs)
splits = []
try:
    sp = json.load(open(os.path.join("data", "specs", f"{p}.json"), encoding="utf-8")); splits = sp.get("splits", [])
except Exception: pass
drops = []
for fw in fresh:
    if norm(fw["w"]) not in {norm(b) for b in BAD}: continue
    if any(s["from"] <= fw["s"] <= s["to"] for s in splits): continue
    ts, seg = to_src(fw["s"] + 0.05)
    if ts is None: print(f"· {fw['s']}ث «{fw['w']}»: خارج الخريطة"); continue
    nxt = [g["s"] for g in fresh if g["s"] > fw["s"] + 0.02][:1]
    ts_next = to_src(nxt[0] + 0.02)[0] if nxt else ts + 0.6
    lo, hi = int((ts - 0.1) / 0.01), int(((ts_next if ts_next else ts + 0.6) - 0.01) / 0.01)   # only between the correction word and the next word

    voiced = db > -34; i = max(0, lo); found = []
    while i < min(n, hi):
        if not voiced[i]: i += 1; continue
        j = i
        while j < n and voiced[j]: j += 1
        a, b = i * 0.01, j * 0.01
        if (b - a) <= 0.30 and kept((a + b) / 2): found.append((round(a, 2), round(b, 2), round(float(db[i:j].max()), 1)))
        i = j
    print(f"«{fw['w']}» عند القص {fw['s']}ث (المصدر ≈ {ts:.2f}ث): مرشّحات {found}")
    for a, b, pk in found:
        # a candidate must be isolated: ≥ 40 ms below -45 dB on at least one side before the next voiced run
        i0, i1 = int(round(a / 0.01)), int(round(b / 0.01))
        quiet_r = i1 + 3 <= n and (db[i1:i1 + 3] < -36).all(); quiet_l = i0 >= 3 and (db[i0 - 3:i0] < -36).all()
        if quiet_l and quiet_r: drops.append({"range": [round(a - 0.03, 2), round(b + 0.03, 2)], "why": f"stray sound heard as «{fw['w']}» at cut {fw['s']}s (peak {pk} dB)"})
if "--write" in sys.argv:
    f = os.path.join(T, "stray_drops.json"); old = []
    try: old = json.load(open(f, encoding="utf-8"))
    except Exception: pass
    have = {tuple(d["range"]) for d in old}
    for d in drops:
        if tuple(d["range"]) not in have: old.append(d)
    json.dump(old, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"stray_drops.json: {len(old)} مدى")
else:
    print(json.dumps(drops, ensure_ascii=False))
sys.exit(0 if drops or not any(norm(f_["w"]) in {norm(b) for b in BAD} for f_ in fresh) else 1)
