import json

# Corrected list of words with accurate timestamps from all_words_v2.txt
raw_words = [
  {"w": "إذا", "s": 0.00, "e": 0.28, "spk": "shia"},
  {"w": "سألك", "s": 0.28, "e": 0.68, "spk": "shia"},
  {"w": "فكيف", "s": 0.68, "e": 1.28, "spk": "shia"},
  {"w": "لا", "s": 1.28, "e": 1.50, "spk": "shia"},
  {"w": "يلد", "s": 1.50, "e": 2.46, "spk": "shia"},
  {"w": "ولا", "s": 2.46, "e": 2.64, "spk": "shia"},
  {"w": "يولد؟", "s": 2.64, "e": 3.04, "spk": "shia"},
  {"w": "إذا", "s": 3.04, "e": 3.36, "spk": "shia"},
  {"w": "سألك:", "s": 3.36, "e": 3.84, "spk": "shia"},
  {"w": "إن", "s": 3.84, "e": 4.08, "spk": "shia"},
  {"w": "ربك", "s": 4.08, "e": 4.48, "spk": "shia"},
  {"w": "يجب", "s": 4.48, "e": 4.82, "spk": "shia"},
  {"w": "أن", "s": 4.82, "e": 4.94, "spk": "shia"},
  {"w": "يلد", "s": 4.94, "e": 5.36, "spk": "shia"},
  {"w": "لأنه", "s": 5.36, "e": 5.74, "spk": "shia"},
  {"w": "حيوان", "s": 5.74, "e": 6.16, "spk": "shia"},
  {"w": "من", "s": 6.16, "e": 6.30, "spk": "shia"},
  {"w": "الحيوانات!", "s": 6.30, "e": 7.10, "spk": "shia"},

  {"w": "قبحك", "s": 7.10, "e": 8.14, "spk": "sheikh"},
  {"w": "الله", "s": 8.14, "e": 8.54, "spk": "sheikh"},
  {"w": "يا", "s": 8.54, "e": 8.82, "spk": "sheikh"},
  {"w": "كافر!", "s": 8.82, "e": 9.42, "spk": "sheikh"},
  {"w": "لعنة", "s": 9.42, "e": 10.04, "spk": "sheikh"},
  {"w": "الله", "s": 10.04, "e": 10.30, "spk": "sheikh"},
  {"w": "عليك!", "s": 10.30, "e": 10.96, "spk": "sheikh"},

  {"w": "لعنة", "s": 15.50, "e": 16.00, "spk": "sheikh"},
  {"w": "الله", "s": 16.00, "e": 16.30, "spk": "sheikh"},
  {"w": "عليك", "s": 16.30, "e": 16.70, "spk": "sheikh"},
  {"w": "يا", "s": 16.70, "e": 16.90, "spk": "sheikh"},
  {"w": "كافر!", "s": 16.90, "e": 19.72, "spk": "sheikh"},

  {"w": "لعنة", "s": 27.50, "e": 28.20, "spk": "sheikh"},
  {"w": "الله", "s": 28.20, "e": 28.60, "spk": "sheikh"},
  {"w": "عليك", "s": 28.60, "e": 29.30, "spk": "sheikh"},
  {"w": "يا", "s": 29.30, "e": 29.70, "spk": "sheikh"},
  {"w": "كافر!", "s": 29.70, "e": 30.34, "spk": "sheikh"},

  {"w": "كم", "s": 30.34, "e": 30.60, "spk": "sheikh"},
  {"w": "ملحد", "s": 30.60, "e": 31.04, "spk": "sheikh"},
  {"w": "ناظرت؟", "s": 31.04, "e": 32.28, "spk": "sheikh"},

  {"w": "لم", "s": 32.28, "e": 32.54, "spk": "sheikh"},
  {"w": "يتجرأ", "s": 32.54, "e": 33.10, "spk": "sheikh"},
  {"w": "واحد", "s": 33.10, "e": 33.40, "spk": "sheikh"},
  {"w": "منهم", "s": 33.40, "e": 33.72, "spk": "sheikh"},
  {"w": "على", "s": 33.72, "e": 33.90, "spk": "sheikh"},
  {"w": "الله", "s": 33.90, "e": 34.16, "spk": "sheikh"},
  {"w": "سبحانه", "s": 34.16, "e": 34.58, "spk": "sheikh"},
  {"w": "وتعالى", "s": 34.58, "e": 34.82, "spk": "sheikh"},
  {"w": "هذه", "s": 34.82, "e": 35.04, "spk": "sheikh"},
  {"w": "الجرأة!", "s": 35.04, "e": 35.56, "spk": "sheikh"},

  {"w": "قبحه", "s": 35.56, "e": 36.28, "spk": "sheikh"},
  {"w": "الله", "s": 36.28, "e": 36.64, "spk": "sheikh"},
  {"w": "وأذله", "s": 36.64, "e": 37.66, "spk": "sheikh"},
  {"w": "وأهانه،", "s": 37.66, "e": 38.46, "spk": "sheikh"},
  {"w": "عابد", "s": 38.46, "e": 38.92, "spk": "sheikh"},
  {"w": "العدم!", "s": 38.92, "e": 39.60, "spk": "sheikh"},

  {"w": "جرأة", "s": 40.34, "e": 40.74, "spk": "sheikh"},
  {"w": "عجيبة!", "s": 40.74, "e": 41.30, "spk": "sheikh"},
  {"w": "جرأة", "s": 41.30, "e": 42.10, "spk": "sheikh"},
  {"w": "عجيبة!", "s": 42.10, "e": 42.98, "spk": "sheikh"},
  {"w": "والأعجب:", "s": 42.98, "e": 43.72, "spk": "sheikh"},

  {"w": "كلما", "s": 43.72, "e": 44.02, "spk": "sheikh"},
  {"w": "عرضت", "s": 44.02, "e": 44.20, "spk": "sheikh"},
  {"w": "له", "s": 44.20, "e": 44.48, "spk": "sheikh"},
  {"w": "نصاً", "s": 44.48, "e": 44.64, "spk": "sheikh"},
  {"w": "من", "s": 44.64, "e": 45.08, "spk": "sheikh"},
  {"w": "عنده", "s": 45.08, "e": 45.64, "spk": "sheikh"},

  {"w": "يقول", "s": 45.64, "e": 46.10, "spk": "sheikh"},
  {"w": "لك:", "s": 46.10, "e": 46.26, "spk": "sheikh"},
  {"w": "أنا", "s": 46.26, "e": 46.38, "spk": "sheikh"},
  {"w": "ما", "s": 46.38, "e": 46.52, "spk": "sheikh"},
  {"w": "أرضى", "s": 46.52, "e": 46.76, "spk": "sheikh"},
  {"w": "به!", "s": 46.76, "e": 46.96, "spk": "sheikh"},

  {"w": "هذا", "s": 46.96, "e": 47.30, "spk": "sheikh"},
  {"w": "مؤول،", "s": 47.30, "e": 48.66, "spk": "sheikh"},
  {"w": "هذا", "s": 48.66, "e": 48.90, "spk": "sheikh"},
  {"w": "مدري", "s": 48.90, "e": 49.24, "spk": "sheikh"},
  {"w": "إيش!", "s": 49.24, "e": 49.70, "spk": "sheikh"},

  {"w": "ما", "s": 49.70, "e": 49.86, "spk": "sheikh"},
  {"w": "هذا", "s": 49.86, "e": 50.10, "spk": "sheikh"},
  {"w": "يا", "s": 50.10, "e": 50.26, "spk": "sheikh"},
  {"w": "رجل؟! ", "s": 50.26, "e": 50.70, "spk": "sheikh"}
]

# Group into clean, rhythmic reading chunks (max 4-5 words or punctuation)
chunks = []
cur_words = []
for w in raw_words:
    if not cur_words:
        cur_words.append(w)
        continue
    
    prev = cur_words[-1]
    same_spk = (w["spk"] == cur_words[0]["spk"])
    gap = w["s"] - prev["e"]
    is_punct = prev["w"].endswith(("!", "؟", "؛", ":", "،", "؟!"))
    is_max = len(cur_words) >= 5

    if (not same_spk) or (gap > 0.6) or is_punct or is_max:
        chunks.append({
            "speaker": cur_words[0]["spk"],
            "start": round(cur_words[0]["s"], 2),
            "end": round(cur_words[-1]["e"] + 0.1, 2),
            "text": " ".join([x["w"] for x in cur_words]),
            "words": [{"w": x["w"], "s": round(x["s"], 2), "e": round(x["e"], 2)} for x in cur_words]
        })
        cur_words = [w]
    else:
        cur_words.append(w)

if cur_words:
    chunks.append({
        "speaker": cur_words[0]["spk"],
        "start": round(cur_words[0]["s"], 2),
        "end": round(cur_words[-1]["e"] + 0.1, 2),
        "text": " ".join([x["w"] for x in cur_words]),
        "words": [{"w": x["w"], "s": round(x["s"], 2), "e": round(x["e"], 2)} for x in cur_words]
    })

with open("src/shia_insult_v2_captions.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"Generated {len(chunks)} caption chunks in src/shia_insult_v2_captions.json")

