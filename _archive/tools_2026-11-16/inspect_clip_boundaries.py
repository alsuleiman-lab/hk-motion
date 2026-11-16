import json

words_path = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

out_path = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\inspected_clips.txt"

with open(out_path, "w", encoding="utf-8") as out:
    def inspect(label, st, en):
        sub = [w for w in words if st <= w["s"] <= en]
        if not sub:
            return
        out.write(f"=== {label} ===\n")
        out.write(f"Start: {sub[0]['s']} ({sub[0]['w']}) -> End: {sub[-1]['e']} ({sub[-1]['w']})\n")
        out.write("Full Text:\n" + " ".join(w["w"] for w in sub) + "\n\n")

    inspect("Clip 1: ماذا يطلب الجن من السحرة؟", 764.0, 866.0)
    inspect("Clip 2: هل الدم نجس؟ والرد على شبهة صلاة الصحابة بجراحاتهم", 2130.5, 2265.0)
    inspect("Clip 3: الفرق بين الكاهن والعراف والساحر", 166.5, 286.0)
    inspect("Clip 4: ظفر عمر بن الخطاب مثل كف أحدنا؟!", 2868.5, 2943.0)

print("Done inspecting clips to file.")
