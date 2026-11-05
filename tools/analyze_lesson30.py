import json, os, re

words_path = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\words.json"
out_dir = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30"

def analyze():
    if not os.path.exists(words_path):
        print("words.json not found yet.")
        return

    with open(words_path, "r", encoding="utf-8") as f:
        words = json.load(f)

    print(f"Loaded {len(words)} words.")
    total_duration = words[-1]["e"] if words else 0
    print(f"Total speech duration: {total_duration/60:.2f} minutes")

    # Group words into sentence / breath chunks
    chunks = []
    cur_words = []
    cur_start = None

    for i, w in enumerate(words):
        if cur_start is None:
            cur_start = w["s"]
        cur_words.append(w["w"])

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

    # Save full readable transcript
    transcript_file = os.path.join(out_dir, "transcript.txt")
    with open(transcript_file, "w", encoding="utf-8") as f:
        for c in chunks:
            f.write(f"[{c['start']:07.2f} -> {c['end']:07.2f}] {c['text']}\n")
    print(f"Full transcript written to {transcript_file}")

    # Search for Hadith headers, chapters, questions
    hadith_patterns = [
        re.compile(r"(باب\s+[\u0621-\u064A\s]+)"),
        re.compile(r"(حديث\s+(?:رقم\s*)?\d+)"),
        re.compile(r"(حدثنا\s+[\u0621-\u064A\s]+)"),
        re.compile(r"(قال\s+أبو\s+عيسى)"),
        re.compile(r"(قال\s+الترمذي)"),
        re.compile(r"(مسألة|فائدة|فائدة\s+مهمة|سؤال|يسأل|حكم|هل\s+يجوز|هل\s+يصح)"),
    ]

    highlights = []
    for c in chunks:
        found_tags = []
        for pat in hadith_patterns:
            m = pat.findall(c["text"])
            if m:
                found_tags.extend(m)
        if found_tags:
            highlights.append({
                "start": c["start"],
                "end": c["end"],
                "tags": found_tags,
                "text": c["text"]
            })

    summary_file = os.path.join(out_dir, "topics_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(highlights, f, ensure_ascii=False, indent=2)
    print(f"Found {len(highlights)} topical highlights, saved to {summary_file}")

if __name__ == "__main__":
    analyze()

