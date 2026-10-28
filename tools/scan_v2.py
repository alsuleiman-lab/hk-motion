import json

with open("public/lesson58_v2_words.json", encoding="utf-8") as f:
    words = json.load(f)

lines = [f"Total words in V2: {len(words)}"]
cur = 0
chunk = []
for w in words:
    chunk.append(w["w"])
    if w["e"] - cur >= 20.0:
        lines.append(f"[{cur:.1f}s - {w['e']:.1f}s]: {' '.join(chunk)}")
        cur = w["e"]
        chunk = []
if chunk:
    lines.append(f"[{cur:.1f}s - {words[-1]['e']:.1f}s]: {' '.join(chunk)}")

with open("scratch_v2_breakdown.txt", "w", encoding="utf-8") as out:
    out.write("\n".join(lines))

print("V2 breakdown saved.")
