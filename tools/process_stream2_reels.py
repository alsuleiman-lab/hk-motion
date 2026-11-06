import os, sys, json, subprocess, time

CLIPS = [
    {
        "id": "s2_ashari_kalb",
        "title": "إحراج متصل أشعري يلزم نفسه والدي كالكلب والشيخ يقصف منطقه الفاسد",
        "sect": "متصل أشعري",
        "sub": "أصلكم الفاسد في نفي العلو",
        "raw_sec": 200.0
    },
    {
        "id": "s2_ashari_tifla",
        "title": "متصل أشعري يحتج بطفلته في نفي العلو والشيخ يقصفه إذا ربك عاجز فهذا إله لا نعبده",
        "sect": "متصل أشعري",
        "sub": "شبهة نزول الرب إلى سماء الدنيا",
        "raw_sec": 150.0
    },
    {
        "id": "s2_quburi_sahaba",
        "title": "قبوري يدافع عن القبور ويصف الصحابة بالجهل والشيخ يقصفه قبحك الله يا قليل الأدب",
        "sect": "متصل قبوري",
        "sub": "سنة اليهود والنصارى في القبور",
        "raw_sec": 198.0
    },
    {
        "id": "s2_shia_istislam",
        "title": "متصل شيعي يجادل في صفات الله فيفحمه الشيخ بروايات أئمته حتى أقر قائلا أنا أستسلم",
        "sect": "متصل شيعي",
        "sub": "صفة الضحك والغضب في كتب الشيعة",
        "raw_sec": 166.0
    }
]

python_whisper = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\python.exe"
python_cv = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\python.exe"

for c in CLIPS:
    cid = c["id"]
    raw_path = f"public/{cid}_raw.mp4"
    cut_path = f"public/{cid}_cut.mp4"
    map_path = f"public/{cid}_map.json"
    wav_path = f".tmp/{cid}_cut.wav"
    words_path = f".tmp/{cid}_words.json"
    face_path = f".tmp/{cid}_face.json"

    print(f"\n=======================================================")
    print(f"Processing Clip: {cid} ({c['title']})")
    print(f"=======================================================")

    # Step 1: Wait for raw slice to exist and finish
    while not os.path.exists(raw_path):
        print(f"Waiting for {raw_path} to be sliced...")
        time.sleep(5)
    
    # Wait until raw file size stabilizes
    last_sz = -1
    while True:
        cur_sz = os.path.getsize(raw_path)
        if cur_sz == last_sz and cur_sz > 1000000:
            break
        last_sz = cur_sz
        time.sleep(2)

    print(f"Raw slice ready: {raw_path} ({os.path.getsize(raw_path)/(1024*1024):.1f} MB)")

    # Step 2: Auto Cut silences (>0.4s -> 0.25s)
    if not os.path.exists(cut_path):
        print(f"Running auto_cut.mjs on {raw_path}...")
        res = subprocess.run(["node", "tools/auto_cut.mjs", raw_path, cid], capture_output=True, text=True)
        print(res.stdout)
        if res.returncode != 0:
            print("auto_cut error:", res.stderr)
            sys.exit(1)
    else:
        print(f"Cut file already exists: {cut_path}")

    # Step 3: Extract 16kHz WAV from cut file
    if not os.path.exists(wav_path):
        print(f"Extracting 16k WAV to {wav_path}...")
        subprocess.run(["ffmpeg", "-y", "-i", cut_path, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", "-threads", "4", wav_path], check=True, capture_output=True)

    # Step 4: Transcribe words with Whisper large-v3 on cut WAV
    if not os.path.exists(words_path):
        print(f"Transcribing words to {words_path}...")
        res = subprocess.run([python_whisper, "tools/transcribe_words.py", wav_path, words_path], capture_output=True, text=True)
        print(res.stdout)
        if res.returncode != 0:
            print("transcribe_words error:", res.stderr)
            sys.exit(1)
    else:
        print(f"Words already transcribed: {words_path}")

    # Step 5: Face track
    if not os.path.exists(face_path):
        print(f"Running face_track.py on {cut_path}...")
        res = subprocess.run([python_cv, "tools/face_track.py", cut_path, face_path], capture_output=True, text=True)
        print(res.stdout)
        if res.returncode != 0:
            print("face_track error:", res.stderr)
    else:
        print(f"Face track already exists: {face_path}")

print("\nAll 4 clips cut, transcribed, and face-tracked successfully!")

