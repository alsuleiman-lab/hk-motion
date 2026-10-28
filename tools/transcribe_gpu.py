import sys, os, json

# Add NVIDIA cuBLAS to PATH and DLL directory for CUDA
cublas_dir = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\Lib\site-packages\nvidia\cublas\bin"
cudnn_dir = r"C:\Users\mshms\AppData\Local\Programs\Python\Python310\Lib\site-packages\nvidia\cudnn\bin"
if os.path.exists(cublas_dir):
    os.environ["PATH"] = cublas_dir + os.pathsep + os.environ["PATH"]
    try:
        os.add_dll_directory(cublas_dir)
    except Exception:
        pass
if os.path.exists(cudnn_dir):
    os.environ["PATH"] = cudnn_dir + os.pathsep + os.environ["PATH"]
    try:
        os.add_dll_directory(cudnn_dir)
    except Exception:
        pass

from faster_whisper import WhisperModel

target_wav = sys.argv[1]
output_json = sys.argv[2]

try:
    model = WhisperModel("small", device="cuda", compute_type="float16")
    print("Using CUDA GPU")
except Exception as e:
    print("Falling back to CPU int8:", e)
    model = WhisperModel("small", device="cpu", compute_type="int8")

segs, info = model.transcribe(target_wav, language="ar", word_timestamps=True)
words = []
for s in segs:
    for w in s.words:
        words.append({
            "w": w.word.strip(),
            "s": round(w.start, 2),
            "e": round(w.end, 2),
            "p": round(w.probability, 2)
        })

with open(output_json, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=2)

print(f"Transcribed {len(words)} words -> {output_json} in {info.duration:.1f}s audio.")
