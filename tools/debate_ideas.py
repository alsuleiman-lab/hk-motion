import json, re, sys, os

def analyze(json_path, out_path):
    with open(json_path, "r", encoding="utf-8") as f:
        segments = json.load(f)

    with open(out_path, "w", encoding="utf-8") as out:
        out.write(f"Total segments loaded: {len(segments)}\n\n")

        # 1. Curse moment around segments 2650-2720 (101m - 104m)
        out.write("==================================================\n")
        out.write("1. مقطع شتم الله ولعنته (من الدقيقة 101:30 إلى 104:00)\n")
        out.write("==================================================\n")
        for s in segments:
            if 6080 <= s["start"] <= 6240:
                m_s, sec_s = int(s["start"] // 60), int(s["start"] % 60)
                m_e, sec_e = int(s["end"] // 60), int(s["end"] % 60)
                out.write(f"[{m_s:02d}:{sec_s:02d} -> {m_e:02d}:{sec_e:02d}] ({s['id']}): {s['text']}\n")

        # 2. Binding: Camel descent (نزول الله على جمل) around minute 6-10
        out.write("\n==================================================\n")
        out.write("2. مقطع إلزام النزول على جمل من كتب الشيعة (06:30 إلى 10:00)\n")
        out.write("==================================================\n")
        for s in segments:
            if 390 <= s["start"] <= 600:
                m_s, sec_s = int(s["start"] // 60), int(s["start"] % 60)
                m_e, sec_e = int(s["end"] // 60), int(s["end"] % 60)
                out.write(f"[{m_s:02d}:{sec_s:02d} -> {m_e:02d}:{sec_e:02d}] ({s['id']}): {s['text']}\n")

        # 3. Vision of Allah (رؤية الله يوم القيامة) around minute 45-50
        out.write("\n==================================================\n")
        out.write("3. مقطع نفي الرؤية والحجب عن الله (45:00 إلى 48:30)\n")
        out.write("==================================================\n")
        for s in segments:
            if 2700 <= s["start"] <= 2920:
                m_s, sec_s = int(s["start"] // 60), int(s["start"] % 60)
                m_e, sec_e = int(s["end"] // 60), int(s["end"] % 60)
                out.write(f"[{m_s:02d}:{sec_s:02d} -> {m_e:02d}:{sec_e:02d}] ({s['id']}): {s['text']}\n")

        # 4. Search keywords for other embarrassing moments
        out.write("\n==================================================\n")
        out.write("4. مواضع الإحراج والتهرب البارزة\n")
        out.write("==================================================\n")
        pat = re.compile(r"(جاوبني|أجبني|تهرب|ما جاوبت|سألتك|عجزت|سؤال محدد|أجب)", re.IGNORECASE)
        for s in segments:
            if pat.search(s["text"]):
                m_s, sec_s = int(s["start"] // 60), int(s["start"] % 60)
                m_e, sec_e = int(s["end"] // 60), int(s["end"] % 60)
                out.write(f"[{m_s:02d}:{sec_s:02d} -> {m_e:02d}:{sec_e:02d}] ({s['id']}): {s['text']}\n")

    print(f"Report written to {out_path}")

if __name__ == "__main__":
    analyze(r"render_work\debate_jobeX3sJVhM\segments.json", r"render_work\debate_jobeX3sJVhM\report.txt")
