import os
import subprocess
import json
import time

SOURCE_VIDEO = r"C:\Users\mshms\Videos\بث للحوار مع المخالفين.mp4"
PYTHON310 = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\python.exe"

CLIPS = [
    {
        "id": "stream_ifk_salul",
        "title": "لماذا لم يقم النبي الحد على عبد الله بن أبي بن سلول في حادثة الإفك؟",
        "start": 1342.0,
        "end": 1506.0
    },
    {
        "id": "stream_sifat_sam3",
        "title": "هل السمع والبصر هما عين العلم؟ إلزام المخالف في صفات الله",
        "start": 518.0,
        "end": 642.0
    },
    {
        "id": "stream_iman_makhluq",
        "title": "لماذا قال الإمام أحمد من قال الإيمان مخلوق فقد كفر؟ وتفريق البخاري",
        "start": 5041.0,
        "end": 5191.0
    }
]

def run_cmd(cmd, desc):
    print(f"\n--- {desc} ---")
    res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"FAILED: {res.stderr}")
        raise RuntimeError(f"Step failed: {desc}")
    print(res.stdout.strip())

def process_clip(c):
    cid = c["id"]
    raw_mp4 = f"public/{cid}_raw.mp4"
    cut_mp4 = f"public/{cid}_cut.mp4"
    words_json = f"public/{cid}_words.json"

    dur = c["end"] - c["start"]
    # 1. Extract raw slice
    extract_cmd = f'ffmpeg -y -ss {c["start"]} -i "{SOURCE_VIDEO}" -t {dur} -c:v libx264 -preset veryfast -crf 18 -threads 4 -c:a aac -b:a 192k "{raw_mp4}"'
    run_cmd(extract_cmd, f"Extracting raw slice for {cid} ({c['start']} to {c['end']})")

    # 2. Silence cutting
    cut_cmd = f'node tools/auto_cut.mjs "{raw_mp4}" {cid}'
    run_cmd(cut_cmd, f"Cutting silences for {cid}")

    # Remove raw slice to save space
    if os.path.exists(raw_mp4):
        os.remove(raw_mp4)

    # 3. Transcribe cut video
    transcribe_cmd = f'"{PYTHON310}" tools/transcribe_gpu.py "{cut_mp4}" "{words_json}"'
    run_cmd(transcribe_cmd, f"Transcribing cut video for {cid}")

    print(f"DONE processing {cid}!\n")

def main():
    t0 = time.time()
    for c in CLIPS:
        process_clip(c)
    print(f"\nALL 3 CLIPS CUT AND TRANSCRIBED SUCCESSFULLY IN {(time.time() - t0)/60:.1f} MINUTES!")

if __name__ == "__main__":
    main()

