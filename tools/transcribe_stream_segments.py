import sys, os, json, time

cublas_dir = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\Lib\site-packages\nvidia\cublas\bin"
cudnn_dir = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\Lib\site-packages\nvidia\cudnn\bin"
if os.path.exists(cublas_dir):
    os.environ["PATH"] = cublas_dir + os.pathsep + os.environ["PATH"]
    try: os.add_dll_directory(cublas_dir)
    except: pass
if os.path.exists(cudnn_dir):
    os.environ["PATH"] = cudnn_dir + os.pathsep + os.environ["PATH"]
    try: os.add_dll_directory(cudnn_dir)
    except: pass

from faster_whisper import WhisperModel

target_wav = r".tmp\stream_audio.wav"
output_json = r".tmp\stream_full_segments.json"

t0 = time.time()
print("Loading Whisper model small on CUDA...")
model = WhisperModel("small", device="cuda", compute_type="float16")

print("Transcribing full stream audio...")
segs, info = model.transcribe(target_wav, language="ar", beam_size=1)

results = []
for s in segs:
    text = s.text.strip()
    if text:
        results.append({
            "s": round(s.start, 2),
            "e": round(s.end, 2),
            "text": text
        })
        if len(results) % 50 == 0:
            print(f"[{s.end/60:.1f}m / {info.duration/60:.1f}m]: {text[:50]}...")

with open(output_json, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

mins = (time.time() - t0) / 60
print(f"DONE! Transcribed {len(results)} segments in {mins:.1f} minutes -> {output_json}")

