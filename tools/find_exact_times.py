import json

def inspect_words(file_path, keywords):
    words = json.load(open(file_path, encoding="utf-8"))
    print(f"\n=== {file_path} ===")
    for kw in keywords:
        hits = []
        for i, w in enumerate(words):
            if kw in w["w"]:
                # context window -3 to +5 words
                start_i = max(0, i - 2)
                end_i = min(len(words), i + 6)
                ctx = " ".join([x["w"] for x in words[start_i:end_i]])
                hits.append((w["s"], w["e"], ctx))
        print(f"Keyword '{kw}':")
        for s, e, ctx in hits[:5]:
            print(f"  [{s:.2f}s - {e:.2f}s] {ctx}")

print("CLIP 1:")
inspect_words("src/clip1_words.json", ["تتوقف", "الشمس", "اسمعوا", "مسلما", "سقيم", "سجود", "العقل", "النزاع"])

print("\nCLIP 2:")
inspect_words("src/clip2_captions.json", ["تعدد", "تنامون", "مصادر", "دخلك", "الموضوع"])

print("\nCLIP 3:")
inspect_words("src/clip3_words.json", ["الشمس", "طلعت", "تشرق", "شروق", "الإنجليزية", "Sunrise", "لغة", "الناظر"])

print("\nCLIP 4:")
inspect_words("src/clip4_words.json", ["العرش", "فوق", "رحمتي", "غضبي", "كتاب", "الشمس", "المخلوقات"])

print("\nCLIP 5:")
inspect_words("src/clip5_words.json", ["تسلم", "نريدك", "دراسة", "خطير", "الكفر", "دين", "مناكفات"])
