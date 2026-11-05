import json, os, subprocess, sys

LESSON_VIDEO = r"C:\Users\mshms\Videos\شرح جامع الترمذي - 30.mp4"
TMP_DIR = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30"
PUBLIC_DIR = r"S:\AI_Tools\Remotion_Workspace\public"
SPECS_DIR = r"S:\AI_Tools\Remotion_Workspace\data\specs"
WORDS_FILE = os.path.join(TMP_DIR, "words.json")
BELOW_NORMAL = 0x00004000

os.makedirs(TMP_DIR, exist_ok=True)
os.makedirs(SPECS_DIR, exist_ok=True)

with open(WORDS_FILE, "r", encoding="utf-8") as f:
    all_words = json.load(f)

# Topics specification with clean Arabic metadata and pose assignments
TOPICS = [
    {
        "id": "tawaf_nisa",
        "title": "هل يجوز للرجل أن يطوف على نسائه بغسل واحد؟ وما حكم العدل بينهن؟",
        "short_title": "طواف الرجل على نسائه بغسل واحد وحكم العدل بينهن",
        "line1": "طواف الرجل على نسائه",
        "line2": "بغسل واحد وحكم العدل بينهن",
        "sheikh_pose": "cov/sheikh_poses/07_sheikh_brown_hands_clasped.png",
        "raw_start": 510.0,
        "raw_end": 1520.0,
        "reel_start": 985.0,
        "reel_end": 1150.0,
        "items_template": [
            {"t": "word", "text": "جامع الترمذي: باب ما جاء في الرجل يطوف على نسائه بغسل واحد", "at": 1.5, "until": 8.0, "x": 540, "y": 1420, "size": 38},
            {"t": "nameTag", "at": 15.0, "x": 540, "y": 1360, "dur": 2.4},
            {"t": "torn", "text": "حديث أنس رضي الله عنه: أن النبي ﷺ كان يطوف على نسائه بغسل واحد", "at": 25.0, "until": 45.0, "y": 1460, "size": 38},
            {"t": "word", "text": "جواز الجمع بين الجماع بغسل واحد في ليلة واحدة", "at": 55.0, "until": 70.0, "x": 540, "y": 1420, "size": 42, "tone": "gold"},
            {"t": "blur", "text": "الوضوء بين الجماعين مستحب وليس بواجب", "at": 85.0, "until": 110.0, "y": 1500, "size": 38},
            {"t": "torn", "text": "حكم العدل بين الزوجات: واجب قطعي لا يسقط", "at": 140.0, "until": 170.0, "y": 1450, "size": 40},
            {"t": "word", "text": "النبي ﷺ أعدل الناس وسيعدل بين نسائه قطعاً", "at": 210.0, "until": 235.0, "x": 540, "y": 1420, "size": 42, "tone": "gold"}
        ]
    },
    {
        "id": "wudu_awd",
        "title": "حكم الوضوء عند العود للجماع: هل هو واجب؟ وهل يشمل المرأة؟",
        "short_title": "حكم الوضوء عند العود للجماع وهل يشمل المرأة",
        "line1": "حكم الوضوء عند العود للجماع",
        "line2": "هل هو واجب؟ وهل يشمل المرأة؟",
        "sheikh_pose": "cov/sheikh_poses/03_sheikh_brown_gesture_point.png",
        "raw_start": 1520.0,
        "raw_end": 1835.0,
        "reel_start": 1590.0,
        "reel_end": 1755.0,
        "items_template": [
            {"t": "word", "text": "جامع الترمذي: باب ما جاء إذا أراد أن يعود توضأ", "at": 1.5, "until": 8.0, "x": 540, "y": 1420, "size": 40},
            {"t": "nameTag", "at": 12.0, "x": 540, "y": 1360, "dur": 2.4},
            {"t": "torn", "text": "حديث أبي سعيد الخدري: «إذا أتى أحدكم أهله ثم أراد أن يعود فليتوضأ»", "at": 20.0, "until": 40.0, "y": 1460, "size": 38},
            {"t": "word", "text": "جمهور العلماء: الوضوء بين الجماعين مستحب وليس بواجب", "at": 50.0, "until": 68.0, "x": 540, "y": 1420, "size": 40, "tone": "gold"},
            {"t": "blur", "text": "فائدة الوضوء: أنشط للعود وأنظف وأطيب", "at": 80.0, "until": 105.0, "y": 1500, "size": 38},
            {"t": "torn", "text": "هل يشمل الحكم المرأة؟ نعم بالقياس والمشاركة في الحكم", "at": 120.0, "until": 145.0, "y": 1450, "size": 38}
        ]
    },
    {
        "id": "khala_salah",
        "title": "إذا أقيمت الصلاة وحضرك الخلاء: هل تقدم قضاء الحاجة؟ وهل تقطع صلاتك؟",
        "short_title": "إذا أقيمت الصلاة وحضرك الخلاء هل تقدمه وتقطع صلاتك",
        "line1": "إذا أقيمت الصلاة وحضرك الخلاء",
        "line2": "هل تقدم قضاء الحاجة وتقطع صلاتك؟",
        "sheikh_pose": "cov/sheikh_poses/10_sheikh_brown_hands_raised_exclaim.png",
        "raw_start": 1835.0,
        "raw_end": 2530.0,
        "reel_start": 2070.0,
        "reel_end": 2220.0,
        "items_template": [
            {"t": "word", "text": "جامع الترمذي: باب ما جاء إذا أقيمت الصلاة ووجد أحدكم الخلاء", "at": 1.5, "until": 8.0, "x": 540, "y": 1420, "size": 38},
            {"t": "nameTag", "at": 12.0, "x": 540, "y": 1360, "dur": 2.4},
            {"t": "torn", "text": "حديث ثوبان وابن عمر: «إذا أقيمت الصلاة ووجد أحدكم الخلاء فليبدأ بالخلاء»", "at": 22.0, "until": 45.0, "y": 1460, "size": 36},
            {"t": "word", "text": "تقديم الخلاء على الصلاة دفعاً لمدافعة الأخبثين والخشوع", "at": 55.0, "until": 75.0, "x": 540, "y": 1420, "size": 40, "tone": "gold"},
            {"t": "blur", "text": "لا صلاة بحضرة طعام ولا وهو يدافعه الأخبثان", "at": 90.0, "until": 115.0, "y": 1500, "size": 38},
            {"t": "torn", "text": "لو دخلت في الصلاة ثم احتجت للخلاء بشدة: يجوز قطع الصلاة", "at": 135.0, "until": 165.0, "y": 1450, "size": 38}
        ]
    },
    {
        "id": "mawti_aqsam",
        "title": "حديث يطهره ما بعده: الأقسام الأربعة لما يداس عليه في الطريق من النجاسة والقذر",
        "short_title": "الأقسام الأربعة لما يداس عليه في الطريق من النجاسة والقذر",
        "line1": "حديث يطهره ما بعده",
        "line2": "الأقسام الـ 4 لما يداس عليه في الطريق",
        "sheikh_pose": "cov/sheikh_poses/06_sheikh_brown_hands_open_explain.png",
        "raw_start": 2530.0,
        "raw_end": 3230.0,
        "reel_start": 3080.0,
        "reel_end": 3225.0,
        "items_template": [
            {"t": "word", "text": "جامع الترمذي: باب ما جاء في وطء المكان القذر", "at": 1.5, "until": 8.0, "x": 540, "y": 1420, "size": 40},
            {"t": "nameTag", "at": 12.0, "x": 540, "y": 1360, "dur": 2.4},
            {"t": "torn", "text": "حديث أم سلمة: سألت امرأة عن ذيل ثوبها تمشي في المكان القذر فقال: «يطهره ما بعده»", "at": 20.0, "until": 45.0, "y": 1460, "size": 36},
            {"t": "word", "text": "الأقسام الأربعة للموضع القذر: جاف رطب رطب جاف", "at": 60.0, "until": 85.0, "x": 540, "y": 1420, "size": 42, "tone": "gold"},
            {"t": "blur", "text": "إذا كانت الأرض رطبة بنجاسة لا تطهر إلا بالماء", "at": 100.0, "until": 125.0, "y": 1500, "size": 38},
            {"t": "torn", "text": "إذا كان الأذى يابساً ومشى على أرض طاهرة جافة فإنه يتطهر بالاحتكاك", "at": 140.0, "until": 170.0, "y": 1450, "size": 36}
        ]
    }
]

def get_duration_frames(filepath):
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", filepath]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    dur = float(res.stdout.strip())
    return round(dur * 30)

for topic in TOPICS:
    tid = topic["id"]
    print(f"\n==========================================")
    print(f"Processing Topic: {topic['title']}")
    print(f"==========================================")
    
    # 1. Extract raw slice for landscape
    raw_mp4 = os.path.join(TMP_DIR, f"{tid}_raw.mp4")
    start_s = topic["raw_start"]
    dur_s = topic["raw_end"] - topic["raw_start"]
    
    if not os.path.exists(raw_mp4) or os.path.getsize(raw_mp4) < 1000:
        print(f"Extracting raw slice ({start_s}s -> {topic['raw_end']}s, {dur_s}s)...")
        cmd = [
            "ffmpeg", "-y", "-ss", str(start_s), "-t", str(dur_s),
            "-i", LESSON_VIDEO,
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k", "-threads", "4",
            raw_mp4
        ]
        subprocess.run(cmd, check=True, creationflags=BELOW_NORMAL)
        print(f"Extracted {raw_mp4}")
    else:
        print(f"Raw slice already exists: {raw_mp4}")

    # 2. Run auto_cut.mjs on raw slice
    cut_mp4 = os.path.join(PUBLIC_DIR, f"{tid}_cut.mp4")
    map_json = os.path.join(PUBLIC_DIR, f"{tid}_map.json")
    if not os.path.exists(cut_mp4) or os.path.getsize(cut_mp4) < 1000:
        print(f"Running auto_cut.mjs on {raw_mp4} with name '{tid}'...")
        cmd = ["node", "tools/auto_cut.mjs", raw_mp4, tid]
        subprocess.run(cmd, check=True, creationflags=BELOW_NORMAL)
        print(f"Generated {cut_mp4}")
    else:
        print(f"Cut already exists: {cut_mp4}")

    # 3. Map words to cut timeline
    words_cut_json = os.path.join(PUBLIC_DIR, f"{tid}_words.json")
    if os.path.exists(map_json):
        with open(map_json, "r", encoding="utf-8") as f:
            map_data = json.load(f)
        segments = map_data["segments"]
        
        def map_time(t_raw_rel):
            for seg in segments:
                a = seg["a"]
                b = seg["b"]
                n = seg["n"]
                if a <= t_raw_rel <= b:
                    return n + (t_raw_rel - a)
                elif t_raw_rel < a:
                    return n
            last = segments[-1]
            return last["n"] + (last["b"] - last["a"])

        topic_words = [w for w in all_words if w["s"] >= start_s and w["e"] <= topic["raw_end"]]
        mapped_words = []
        for w in topic_words:
            w_rel_s = w["s"] - start_s
            w_rel_e = w["e"] - start_s
            c_s = map_time(w_rel_s)
            c_e = map_time(w_rel_e)
            if c_e > c_s:
                mapped_words.append({
                    "w": w["w"],
                    "s": round(c_s, 2),
                    "e": round(c_e, 2)
                })
        
        with open(words_cut_json, "w", encoding="utf-8") as f:
            json.dump(mapped_words, f, ensure_ascii=False, indent=2)
        print(f"Mapped {len(mapped_words)} words to {words_cut_json}")

    # 4. Extract Reel cut
    reel_cut_mp4 = os.path.join(PUBLIC_DIR, f"{tid}_reel_cut.mp4")
    reel_words_json = os.path.join(PUBLIC_DIR, f"{tid}_reel_words.json")
    
    r_start_rel = topic["reel_start"] - start_s
    r_end_rel = topic["reel_end"] - start_s
    
    if os.path.exists(map_json) and (not os.path.exists(reel_cut_mp4) or os.path.getsize(reel_cut_mp4) < 1000):
        cut_r_start = map_time(r_start_rel)
        cut_r_end = map_time(r_end_rel)
        cut_r_dur = cut_r_end - cut_r_start
        print(f"Extracting Reel from cut video: {cut_r_start:.2f}s -> {cut_r_end:.2f}s ({cut_r_dur:.2f}s)...")
        cmd = [
            "ffmpeg", "-y", "-ss", str(cut_r_start), "-t", str(cut_r_dur),
            "-i", cut_mp4,
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k", "-threads", "4",
            reel_cut_mp4
        ]
        subprocess.run(cmd, check=True, creationflags=BELOW_NORMAL)
        print(f"Generated Reel: {reel_cut_mp4}")
        
        reel_words = []
        for w in mapped_words:
            if w["s"] >= cut_r_start and w["e"] <= cut_r_end:
                reel_words.append({
                    "w": w["w"],
                    "s": round(w["s"] - cut_r_start, 2),
                    "e": round(w["e"] - cut_r_start, 2)
                })
        with open(reel_words_json, "w", encoding="utf-8") as f:
            json.dump(reel_words, f, ensure_ascii=False, indent=2)
        print(f"Mapped {len(reel_words)} words to {reel_words_json}")

    # 5. Build Spec files
    land_frames = get_duration_frames(cut_mp4)
    land_spec = {
        "id": f"{tid.replace('_', '-').title()}-L",
        "title": topic["title"],
        "frames": land_frames,
        "cut": f"{tid}_cut.mp4",
        "showTitleBar": False,
        "cams": [{"from": 0, "to": 9999, "cx": 1496}],
        "items": [
            {
                "t": "cover",
                "style": "paper",
                "kit": {
                    "line1": topic["line1"],
                    "line2": topic["line2"],
                    "sheikh": topic["sheikh_pose"]
                }
            }
        ] + topic["items_template"]
    }
    land_spec_file = os.path.join(SPECS_DIR, f"{tid}.json")
    with open(land_spec_file, "w", encoding="utf-8") as f:
        json.dump(land_spec, f, ensure_ascii=False, indent=2)
    print(f"Saved Landscape spec: {land_spec_file} ({land_frames} frames)")

    reel_frames = get_duration_frames(reel_cut_mp4)
    reel_spec = {
        "id": f"{tid.replace('_', '-').title()}-R",
        "title": topic["title"],
        "frames": reel_frames,
        "cut": f"{tid}_reel_cut.mp4",
        "showTitleBar": False,
        "cams": [{"from": 0, "to": 9999, "cx": 1496}],
        "items": [
            {
                "t": "cover",
                "style": "paper",
                "kit": {
                    "line1": topic["line1"],
                    "line2": topic["line2"],
                    "sheikh": topic["sheikh_pose"]
                }
            }
        ] + [it for it in topic["items_template"] if it.get("at", 0) <= (reel_frames / 30)]
    }
    reel_spec_file = os.path.join(SPECS_DIR, f"{tid}_reel.json")
    with open(reel_spec_file, "w", encoding="utf-8") as f:
        json.dump(reel_spec, f, ensure_ascii=False, indent=2)
    print(f"Saved Reel spec: {reel_spec_file} ({reel_frames} frames)")

print("\nAll remaining topics processed and configured successfully!")
