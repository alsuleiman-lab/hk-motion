import json

words = json.load(open("render_work/downloaded_shorts/words.json", encoding="utf-8"))
with open("render_work/downloaded_shorts/chunks.txt", "w", encoding="utf-8") as f:
    for i in range(0, len(words), 12):
        chunk = words[i:i+12]
        text = " ".join(w["w"] for w in chunk)
        f.write(f"{chunk[0]['s']:.2f}s - {chunk[-1]['e']:.2f}s: {text}\n")

print(f"Wrote {len(words)} words to chunks.txt")

