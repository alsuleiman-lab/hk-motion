import json

with open("s:/AI_Tools/Remotion_Workspace/segments_125.json", encoding="utf-8") as f:
    data = json.load(f)

# Find segments where "أطباء" or "علم" or "اكتشف" or "طب" or "تراب" or "صعيد" appears
targets = ["أطباء", "اطباء", "طبيب", "اكتشف", "دراسة", "علمي", "إعجاز", "اعجاز", "تراب", "صعيد", "جراثيم", "بكتيريا", "فيروس", "أبحاث"]

results = []
for i, s in enumerate(data):
    txt = s["text"]
    for t in targets:
        if t in txt:
            # get context (before and after)
            start_idx = max(0, i - 2)
            end_idx = min(len(data), i + 3)
            context = " ".join([data[j]["text"] for j in range(start_idx, end_idx)])
            results.append({
                "target": t,
                "time": f"{s['start']} -> {s['end']}",
                "text": txt,
                "context": context
            })
            break

with open("s:/AI_Tools/Remotion_Workspace/target_matches.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Found {len(results)} matches.")
