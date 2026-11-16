import json

with open("render_work/debate_jobeX3sJVhM/segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

with open("render_work/debate_jobeX3sJVhM/recuts.txt", "w", encoding="utf-8") as out:
    for s in segs:
        if 2666 <= s["id"] <= 2720:
            m_s, sec_s = int(s["start"]//60), s["start"]%60
            m_e, sec_e = int(s["end"]//60), s["end"]%60
            out.write(f"ID {s['id']}: [{m_s:02d}:{sec_s:05.2f} -> {m_e:02d}:{sec_e:05.2f}] (start={s['start']}, end={s['end']}) {s['text']}\n")

print("Saved recuts.txt")
