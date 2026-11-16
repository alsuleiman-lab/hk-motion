import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Let's write out a complete breakdown of every 30 seconds or speech cluster
with open(r"temp_debate\readable_stream_flow.txt", "w", encoding="utf-8") as out:
    for s in segs:
        m = int(s["start"] // 60)
        sec = int(s["start"] % 60)
        out.write(f"[{m:02d}:{sec:02d}] ({s['start']:.1f}s - {s['end']:.1f}s): {s['text']}\n")

print("Wrote readable_stream_flow.txt")

