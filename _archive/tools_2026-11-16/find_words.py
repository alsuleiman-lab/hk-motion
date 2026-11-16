with open("s:/AI_Tools/Remotion_Workspace/transcript_readable.txt", encoding="utf-8") as f:
    text = f.read()

words_to_find = ["تراب", "صعيد", "جراثيم", "بكتيريا", "طهارة", "طب", "علم", "أطباء", "اكتشف", "دراسة", "أبحاث", "أثر", "حكمة", "نظافة", "جلد", "يد", "وجه", "مسح", "جنابة", "عشر", "سنين"]

for w in words_to_find:
    count = text.count(w)
    print(f"Word '{w}': {count} occurrences")
