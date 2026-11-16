import json

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Let's inspect the entire stream to find the distinct callers.
# Let's find segments where caller changes or Sheikh greets/farewells.

print("=== Scanning full stream for distinct calls ===")

# Let's search by reading blocks
# Let's inspect sections:
# Section 1: ~100s - 970s
# Section 2: ~970s - 1140s
# Section 3: ~1140s - 2490s
# Section 4: ~2495s - 3150s
# Section 5: ~3152s - 3588s
# Section 6: ~3588s - end

def show_range(start_s, end_s, step=5):
    sub = [s for s in segs if start_s <= s["start"] <= end_s]
    print(f"\n--- Range {start_s}s to {end_s}s ({len(sub)} segs) ---")
    for s in sub[::step]:
        print(f"[{s['start']:6.1f}s]: {s['text']}")

show_range(140, 970, step=15)
show_range(970, 1200, step=5)
show_range(1200, 2495, step=25)
show_range(2495, 3150, step=15)
show_range(3150, 3600, step=10)
show_range(3600, 4400, step=15)

