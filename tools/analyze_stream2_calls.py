import json, re

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

print(f"Total segments: {len(segs)}")

# Let's inspect where calls start and end
# Look for call greetings and farewells or transitions
call_starts = []
for i, s in enumerate(segs):
    t = s["text"]
    # Keywords indicating a new caller
    if any(k in t for k in ["السلام عليكم", "مرحبا", "ألو", "الو", "تفضل أخي", "حياك الله", "معنا الأخ", "مساء الخير", "صباح الخير"]):
        call_starts.append((i, s["start"], s["end"], t))

print(f"Potential call start points ({len(call_starts)}):")
for idx, st, en, text in call_starts:
    print(f"  [{st:6.1f}s - seg {idx:4d}]: {text[:80]}")

# Let's also write a helper to dump the full transcript to a readable text file with timestamps
with open(".tmp/stream2_readable.txt", "w", encoding="utf-8") as f:
    for s in segs:
        f.write(f"[{s['start']:6.1f}s -> {s['end']:6.1f}s] {s['text']}\n")

print("\nReadable transcript written to .tmp/stream2_readable.txt")

