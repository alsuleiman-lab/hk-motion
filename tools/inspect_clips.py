import json

path = "render_work/lessons/o29nNfDl5_U/words.json"
with open(path, encoding="utf-8") as f:
    words = json.load(f)

def inspect_range(start_sec, end_sec):
    sub = [w for w in words if start_sec <= w["s"] <= end_sec]
    if not sub:
        return ""
    return f"[{sub[0]['s']}s -> {sub[-1]['e']}s ({round((sub[-1]['e']-sub[0]['s'])/60, 2)} min)]: " + " ".join(w["w"] for w in sub)

# Video 1: Ibn Taymiyyah story (~22:00 to 32:00)
# Video 2: Jahm ibn Safwan (~01:00 to 04:00)
# Video 3: Ahl al-Hadith or Ibn Khuzaymah (~38:30 to 42:30 or ~50:00 to 54:00)

with open("scratch_inspect_ranges.txt", "w", encoding="utf-8") as f:
    f.write("=== CANDIDATE 1: Ibn Taymiyyah Story ===\n")
    f.write(inspect_range(22*60, 32*60) + "\n\n")
    f.write("=== CANDIDATE 2: Jahm Ibn Safwan ===\n")
    f.write(inspect_range(1*60, 4*60) + "\n\n")
    f.write("=== CANDIDATE 3: Ibn Khuzaymah ===\n")
    f.write(inspect_range(50*60, 54*60) + "\n\n")
    f.write("=== CANDIDATE 4: Ahl al-Hadith ===\n")
    f.write(inspect_range(38*60+30, 42*60) + "\n\n")

print("Done inspecting ranges.")
