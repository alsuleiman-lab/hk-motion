import json, re

with open("s:/AI_Tools/Remotion_Workspace/segments_125.json", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total segments: {len(data)}")

keywords = ["إعجاز", "اعجاز", "علمي", "علميا", "طب", "طبي", "جنين", "نطفة", "علقة", "ذبابة", "سم", "شفاء", "داء", "أرض", "شمس", "قمر", "فلك", "حديد", "بحر", "جبل", "سماء", "مرض", "علاج", "كبد", "قلب", "دماغ"]

matches = []
for i, s in enumerate(data):
    txt = s["text"]
    for kw in keywords:
        if kw in txt:
            matches.append((i, kw, s))
            break

print(f"Matches count: {len(matches)}")
for i, kw, s in matches:
    print(f"[{s['start']:6.1f} - {s['end']:6.1f}] ({kw}): {s['text']}")
