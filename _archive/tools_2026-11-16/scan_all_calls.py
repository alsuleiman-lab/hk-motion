import json

segments = json.load(open('.tmp/stream_full_segments.json', encoding='utf-8'))

# Let's inspect the entire stream from 47:00 to 69:00 and 73:00 to 95:00
# to find all debate calls
print("Scanning for all calls...")

# Print segments where someone else talks (callers often have different dialect or say "ألو", "شيخنا", "السلام عليكم")
greetings = []
for i, s in enumerate(segments):
    t = s['text']
    sec = s['s']
    if any(w in t for w in ["السلام عليكم", "سلام عليكم", "ألو", "الو", "شيخنا", "حياك الله يا", "تفضل يا", "أهلاً وسهلاً"]):
        m, sc = divmod(int(sec), 60)
        greetings.append((sec, f"[{m:02d}:{sc:02d}] {t}"))

for g in greetings:
    print(g[1])

