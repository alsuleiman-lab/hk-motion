import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

def print_range(start_s, end_s, title):
    print(f"\n================ {title} ({start_s}s -> {end_s}s) ================")
    sub = [s for s in segs if start_s <= s["start"] <= end_s]
    for s in sub:
        m = int(s["start"] // 60)
        sec = int(s["start"] % 60)
        print(f"[{m:02d}:{sec:02d}] {s['text']}")

# Let's inspect the transition boundaries
inspect_zones = [
    (0, 100, "INTRO & START CALLER 1"),
    (1250, 1360, "TRANSITION CALLER 1 -> CALLER 2"),
    (1750, 1830, "TRANSITION CALLER 2 -> CALLER 3"),
    (2120, 2200, "TRANSITION CALLER 3 -> CALLER 4"),
    (2670, 2750, "TRANSITION CALLER 4 -> CALLER 5"),
    (2880, 2960, "TRANSITION CALLER 5 -> CALLER 6"),
    (4360, 4440, "TRANSITION CALLER 6 -> CALLER 7"),
    (4960, 5030, "TRANSITION CALLER 7 -> CALLER 8"),
    (5680, 5730, "END OF CALLER 8 & STREAM OUTRO")
]

with open(r"temp_debate\call_transitions_detail.txt", "w", encoding="utf-8") as out:
    for z_st, z_en, label in inspect_zones:
        out.write(f"\n================ {label} ({z_st}s -> {z_en}s) ================\n")
        sub = [s for s in segs if z_st <= s["start"] <= z_en]
        for s in sub:
            m = int(s["start"] // 60)
            sec = int(s["start"] % 60)
            out.write(f"[{m:02d}:{sec:02d}] ({s['start']:.1f}s - {s['end']:.1f}s): {s['text']}\n")

print("Wrote call_transitions_detail.txt")

