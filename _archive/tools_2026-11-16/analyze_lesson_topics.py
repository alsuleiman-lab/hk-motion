import json
import os

words_path = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\words.json"
out_txt = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\lesson_transcript.txt"
summary_path = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\topics_summary.txt"

with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

# Group words into chunks of ~15-20 seconds or based on pauses > 1.0s
chunks = []
cur_words = []
cur_start = None

for i, w in enumerate(words):
    if cur_start is None:
        cur_start = w["s"]
    cur_words.append(w["w"])
    
    # Check if next word has pause > 1.2s or chunk length > 30s
    pause = False
    if i < len(words) - 1:
        if words[i+1]["s"] - w["e"] > 1.2:
            pause = True
    
    if pause or (w["e"] - cur_start > 25.0):
        chunks.append({
            "start": cur_start,
            "end": w["e"],
            "text": " ".join(cur_words)
        })
        cur_words = []
        cur_start = None

if cur_words:
    chunks.append({
        "start": cur_start,
        "end": words[-1]["e"],
        "text": " ".join(cur_words)
    })

with open(out_txt, "w", encoding="utf-8") as f:
    for c in chunks:
        f.write(f"[{c['start']:.1f} -> {c['end']:.1f}] {c['text']}\n")

print(f"Total chunks: {len(chunks)}, written to {out_txt}")

# Look for hadith keywords, questions, book topics
keywords = ["باب", "حدثنا", "حديث", "الترمذي", "رسول الله", "سؤال", "يسأل", "فائدة", "مسألة", "حكم", "الوضوء", "الغسل", "الصلاة", "الجنابة", "المذي", "المني", "الحيض", "الاستحاضة", "المستحاضة", "طهارة"]
matches = []
for i, c in enumerate(chunks):
    for k in keywords:
        if k in c["text"]:
            matches.append((k, c))
            break

with open(summary_path, "w", encoding="utf-8") as f:
    f.write("KEYWORD HIGHLIGHTS:\n")
    for k, c in matches[:100]:
        f.write(f"[{c['start']:.1f} -> {c['end']:.1f}] ({k}): {c['text']}\n")

print(f"Highlighted {len(matches)} chunks, summary written to {summary_path}")

