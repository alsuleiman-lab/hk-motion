import json, sys
sys.stdout.reconfigure(encoding='utf-8')

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    words = json.load(f)

cur = []
st = 0
for w in words:
    if not cur:
        st = w["s"]
    cur.append(w["w"])
    if len(cur) >= 6:
        print(f"{st:.2f} -> {w['e']:.2f}: {' '.join(cur)}")
        cur = []
if cur:
    print(f"{st:.2f} -> {words[-1]['e']:.2f}: {' '.join(cur)}")
