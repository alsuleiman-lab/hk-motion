import json

with open("render_work/lessons/o29nNfDl5_U/words.json", encoding="utf-8") as f:
    words = json.load(f)

with open("render_work/lessons/o29nNfDl5_U/vad.json", encoding="utf-8") as f:
    vad = json.load(f)

# Let's inspect sentences around:
# Video 1: 1321s to 1864s (Ibn Taymiyyah)
# Video 2: 60s to 200s (Jahm ibn Safwan)
# Video 3: 3000s to 3240s (Ibn Khuzaymah)

def get_text(st, en):
    sub = [w for w in words if st <= w["s"] <= en]
    return " ".join(w["w"] for w in sub)

v1_text = get_text(1321, 1864)
v2_text = get_text(60, 205)
v3_text = get_text(3085, 3245)

with open("scratch_v1_text.txt", "w", encoding="utf-8") as f:
    f.write(f"V1 (Duration: {(1864-1321)/60:.2f} min):\n" + v1_text)

with open("scratch_v2_text.txt", "w", encoding="utf-8") as f:
    f.write(f"V2 (Duration: {(205-60)/60:.2f} min):\n" + v2_text)

with open("scratch_v3_text.txt", "w", encoding="utf-8") as f:
    f.write(f"V3 (Duration: {(3245-3085)/60:.2f} min):\n" + v3_text)

print("Generated scratch files for V1, V2, V3.")
