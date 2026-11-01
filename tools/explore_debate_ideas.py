import json, re

with open(r"render_work\debate_jobeX3sJVhM\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

print(f"Total segments: {len(segs)}")

# Let's search for keywords representing strong moments:
keywords = [
    "جمل", "كتبكم", "الكافي", "المجلسي", "بحار الأنوار", "الصدوق", "التوحيد",
    "تحدي", "اتحداك", "اثبت", "أين", "سؤال", "جواب", "أجب", "تهرب",
    "صورة", "يد", "نزول", "عرش", "أين الله", "علو", "رؤية", "عين", "ساق",
    "حيوان", "جسم", "مجسم", "مخلوق", "معطل", "جهمي", "معتزلي", "أشعري",
    "كذب", "تناقض", "إلزام", "لا تقدر", "عاجز", "لماذا لا تجيب"
]

hits = []
for s in segs:
    text = s["text"]
    for kw in keywords:
        if kw in text:
            hits.append((s["start"], s["end"], kw, text))
            break

print(f"Total hits: {len(hits)}")

# Group segments into contiguous blocks or dialogues
# Let's see some time windows:
# 0 -> 15 min (intro / first speeches)
# 15 -> 35 min
# 35 -> 55 min
# 55 -> 75 min
# 75 -> 95 min
# 95 -> 105 min

