import json, sys

with open(r"render_work\debate_jobeX3sJVhM\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

out_lines = []
for i in range(0, 105, 5):
    t_start = i * 60
    t_end = (i + 5) * 60
    chunk_segs = [s for s in segs if t_start <= s["start"] < t_end]
    full_text = " ".join(s["text"] for s in chunk_segs)
    out_lines.append(f"### [{i:02d}:00 -> {i+5:02d}:00] ({len(chunk_segs)} segments)")
    out_lines.append(full_text[:400] + "\n")

with open(r"render_work\debate_jobeX3sJVhM\timeline_summary.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))

print("Wrote timeline_summary.txt")
