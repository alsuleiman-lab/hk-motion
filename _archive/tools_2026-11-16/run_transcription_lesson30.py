import os, sys, subprocess

py_exe = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\python.exe"
script = r"S:\AI_Tools\Remotion_Workspace\tools\transcribe_words.py"
wav_path = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\audio16k.wav"
words_json = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\words.json"

BELOW_NORMAL = 0x00004000

if os.path.exists(words_json) and os.path.getsize(words_json) > 1000:
    print(f"Words JSON already exists: {words_json} ({os.path.getsize(words_json)/(1024*1024):.2f} MB)")
else:
    print(f"Starting Whisper large-v3 transcription on RTX 3090 (BelowNormal priority)...")
    cmd = [py_exe, script, wav_path, words_json]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='ignore', creationflags=BELOW_NORMAL)
    for line in proc.stdout:
        print(line, end='', flush=True)
    proc.wait()
    if proc.returncode != 0:
        print("Transcription failed with code", proc.returncode)
        sys.exit(proc.returncode)
    print(f"Transcription complete: {words_json}")

