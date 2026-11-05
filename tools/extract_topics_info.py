import json

words_file = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\words.json"
with open(words_file, "r", encoding="utf-8") as f:
    words = json.load(f)

# Find exact time offsets
# Topic 2: طواف النبي على نسائه بغسل واحد والرد على شبهة العدل
# starts around line 29: 511.8s, ends around 1520s
# Core question & debate on justice starts ~980s to ~1335s, full chapter is 511s to 1520s (16.8 mins)
# Topic 3: إذا أراد أن يعود توضأ: 1520s to 1835s (5.25 mins)
# Topic 4: إذا أقيمت الصلاة ووجد أحدكم الخلاء: 1835s to 2530s (11.58 mins)
# Topic 5: الوضوء من الموطئ والأقسام الأربعة: 2530s to 3230s (11.66 mins)

topics = [
    {
        "id": "tawaf_nisa",
        "title": "هل يجوز للرجل أن يطوف على نسائه بغسل واحد؟ وما حكم العدل بينهن؟",
        "short_title": "طواف الرجل على نسائه بغسل واحد وحكم العدل بينهن",
        "raw_start": 510.0,
        "raw_end": 1520.0,
        "reel_start": 985.0, # The core question on justice and how he answers it
        "reel_end": 1150.0,
    },
    {
        "id": "wudu_awd",
        "title": "حكم الوضوء عند العود للجماع: هل هو واجب؟ وهل يشمل المرأة؟",
        "short_title": "حكم الوضوء عند العود للجماع وهل يشمل المرأة",
        "raw_start": 1520.0,
        "raw_end": 1835.0,
        "reel_start": 1590.0,
        "reel_end": 1755.0,
    },
    {
        "id": "khala_salah",
        "title": "إذا أقيمت الصلاة وحضرك الخلاء: هل تقدم قضاء الحاجة؟ وهل تقطع صلاتك؟",
        "short_title": "إذا أقيمت الصلاة وحضرك الخلاء هل تقدمه وتقطع صلاتك",
        "raw_start": 1835.0,
        "raw_end": 2530.0,
        "reel_start": 2070.0,
        "reel_end": 2220.0,
    },
    {
        "id": "mawti_aqsam",
        "title": "حديث يطهره ما بعده: الأقسام الأربعة لما يداس عليه في الطريق من النجاسة والقذر",
        "short_title": "الأقسام الأربعة لما يداس عليه في الطريق من النجاسة والقذر",
        "raw_start": 2530.0,
        "raw_end": 3230.0,
        "reel_start": 3080.0,
        "reel_end": 3225.0,
    }
]

print(json.dumps(topics, ensure_ascii=False, indent=2))
with open(r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\topics_defined.json", "w", encoding="utf-8") as f:
    json.dump(topics, f, ensure_ascii=False, indent=2)

