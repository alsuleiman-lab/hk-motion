import json

words_path = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

def get_text_range(start_sec, end_sec):
    sub = [w["w"] for w in words if start_sec <= w["s"] <= end_sec]
    return " ".join(sub)

ranges = [
    ("كم تمكث النفساء وأقوال العلماء", 19, 480),
    ("طواف النبي صلى الله عليه وسلم على نسائه بغسل واحد وكيف جمع بين ذلك وبين العدل", 806, 1340),
    ("مسألة العدل بين الزوجات وكيف كان يطوف النبي صلى الله عليه وسلم على نسائه", 960, 1340),
    ("إذا أراد أن يعود للجماع فهل يجب الوضوء؟ وهل يشمل المرأة؟", 1520, 1835),
    ("إذا أقيمت الصلاة وأنت تدافع الأخبثين فماذا تقدم؟ وهل تقطع صلاتك؟", 1835, 2506),
    ("حكم وضوء وطهارة من وطئ على القذر والنجاسة في الطريق (الأقسام الأربعة البديعة)", 2506, 3250)
]

for title, s, e in ranges:
    dur = (e - s) / 60
    txt = get_text_range(s, e)
    print(f"=== {title} ===")
    print(f"Time: {s//60:02d}:{s%60:02d} -> {e//60:02d}:{e%60:02d} ({dur:.2f} mins, {len(txt.split())} words)")
    print(txt[:250] + "...\n")

