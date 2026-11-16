import json

with open('segments_lesson25.json', 'r', encoding='utf-8') as f:
    segs = json.load(f)

with open('readable_lesson25.txt', 'w', encoding='utf-8') as out:
    for s in segs:
        out.write(f"[{s['start']:.1f} -> {s['end']:.1f}] {s['text']}\n")

print("Wrote readable_lesson25.txt")
keywords = ['متزوج', 'زوج', 'جماع', 'حائض', 'عورة', 'استمتاع', 'قبلة', 'مباشرة', 'إزار', 'فوق الإزار', 'تحت الإزار']
for s in segs:
    text = s['text']
    for k in keywords:
        if k in text:
            print(f"MATCH [{s['start']:.1f} -> {s['end']:.1f}]: {text}")
            break
