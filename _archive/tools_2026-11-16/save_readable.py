import json

with open("s:/AI_Tools/Remotion_Workspace/segments_125.json", encoding="utf-8") as f:
    data = json.load(f)

lines = []
for s in data:
    lines.append(f"[{s['start']:6.1f} -> {s['end']:6.1f}] {s['text']}")

with open("s:/AI_Tools/Remotion_Workspace/transcript_readable.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Saved transcript_readable.txt successfully!")
