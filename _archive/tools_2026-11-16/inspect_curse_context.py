import json

with open(r'render_work\debate_jobeX3sJVhM\segments.json', 'r', encoding='utf-8') as f:
    segs = json.load(f)

with open(r'render_work\debate_jobeX3sJVhM\hook_and_scene.txt', 'w', encoding='utf-8') as out:
    for s in segs:
        if 6060 <= s['start'] <= 6260:
            m_s, sec_s = int(s['start'] // 60), s['start'] % 60
            m_e, sec_e = int(s['end'] // 60), s['end'] % 60
            out.write(f"ID {s['id']}: [{m_s:02d}:{sec_s:05.2f} -> {m_e:02d}:{sec_e:05.2f}] {s['text']}\n")

print("Dumped segments to hook_and_scene.txt")

