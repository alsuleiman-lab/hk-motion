import json

with open(r"render_work\debate_jobeX3sJVhM\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

def dump_range(t_start, t_end, filename):
    sub = [s for s in segs if t_start <= s["start"] <= t_end]
    lines = []
    for s in sub:
        lines.append(f"[{s['start']:6.1f} -> {s['end']:6.1f}] {s['text']}")
    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Dumped {len(sub)} segs to {filename}")

dump_range(3600, 3900, r"render_work\debate_jobeX3sJVhM\cand1_hand_in_hand.txt")
dump_range(3400, 3600, r"render_work\debate_jobeX3sJVhM\cand2_listening_now.txt")
dump_range(5400, 5650, r"render_work\debate_jobeX3sJVhM\cand3_quran_taweel.txt")
dump_range(900, 1150, r"render_work\debate_jobeX3sJVhM\cand4_mahasen_hands.txt")

