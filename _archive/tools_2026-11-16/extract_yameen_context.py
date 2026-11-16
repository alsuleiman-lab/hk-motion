import json

with open("render_work/debate_jobeX3sJVhM/segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

extracted = []
for s in segs:
    st = s["start"]
    et = s["end"]
    if 3570 <= st <= 3820:
        m = int(st // 60)
        sec = int(st % 60)
        text = s["text"]
        extracted.append(f"[{m:02d}:{sec:02d}] ({st:.1f}s - {et:.1f}s): {text}\n")

with open("yameen_clip_full_exchange.txt", "w", encoding="utf-8") as out:
    out.writelines(extracted)

print(f"Extracted {len(extracted)} lines.")
