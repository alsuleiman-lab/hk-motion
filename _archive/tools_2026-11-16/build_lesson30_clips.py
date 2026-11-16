import os, sys, subprocess, json, shutil

SOURCE = r"C:\Users\mshms\Videos\شرح جامع الترمذي - 30.mp4"
PYTHON310 = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\python.exe"
ROOT = r"S:\AI_Tools\Remotion_Workspace"
TMP = os.path.join(ROOT, ".tmp")
PUBLIC = os.path.join(ROOT, "public")

CLIPS = [
    {
        "name": "tawaf_nisa",
        "start": "984.0",
        "to": "1150.0",
        "title": "طواف الرجل على نسائه بغسل واحد وحكم العدل بينهن"
    },
    {
        "name": "wudu_awd",
        "start": "1595.0",
        "to": "1750.0",
        "title": "حكم الوضوء عند العود للجماع وهل يشمل المرأة"
    },
    {
        "name": "khala_salah",
        "start": "2070.0",
        "to": "2220.0",
        "title": "إذا أقيمت الصلاة وحضرك الخلاء هل تقدمه وتقطع صلاتك"
    },
    {
        "name": "mawti_aqsam",
        "start": "3135.0",
        "to": "3230.0",
        "title": "الأقسام الأربعة لما يداس عليه في الطريق من النجاسة والقذر"
    }
]

def run_cmd(cmd, desc):
    print(f"\n--- {desc} ---")
    subprocess.run(cmd, check=True)

for clip in CLIPS:
    name = clip["name"]
    raw_slice = os.path.join(TMP, f"raw_{name}.mp4")
    cut_mp4 = os.path.join(PUBLIC, f"{name}_cut.mp4")
    words_json = os.path.join(PUBLIC, f"{name}_words.json")

    # Step 1: Extract raw slice
    cmd_extract = [
        "ffmpeg", "-hide_banner", "-v", "error", "-y", "-threads", "4",
        "-ss", clip["start"], "-to", clip["to"],
        "-i", SOURCE,
        "-c:v", "copy", "-c:a", "copy",
        raw_slice
    ]
    run_cmd(cmd_extract, f"Extracting raw slice for {name} ({clip['start']} to {clip['to']})")

    # Step 2: Cut silences > 0.4s to ~0.25s
    cmd_cut = [
        "node", os.path.join(ROOT, "tools", "auto_cut.mjs"),
        raw_slice, name
    ]
    run_cmd(cmd_cut, f"Cutting silences for {name}")

    # Step 3: Transcribe cut video directly
    cmd_transcribe = [
        PYTHON310, os.path.join(ROOT, "tools", "transcribe_words.py"),
        cut_mp4, words_json
    ]
    run_cmd(cmd_transcribe, f"Transcribing cut video for {name}")

    print(f"DONE processing {name}!")

print("\nALL 4 CLIPS CUT AND TRANSCRIBED SUCCESSFULLY!")

