import os, sys, json
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
model = WhisperModel("small", device="cuda", compute_type="float16")

# Transcribe without vad_filter and with initial_prompt
segs, info = model.transcribe("public/shia_insult_v2_audio16k.wav", language="ar", word_timestamps=True,
                              initial_prompt="إذا سألك فكيف لا يلد ولا يولد لأنه حيوان من الحيوانات قبحك الله لعنة الله عليك",
                              vad_filter=False)

words = []
for s in segs:
    print(f"Segment: [{s.start:.2f} -> {s.end:.2f}] {s.text}")
    for w in s.words:
        words.append({
            "w": w.word.strip(),
            "s": round(w.start, 2),
            "e": round(w.end, 2),
            "p": round(w.probability, 2)
        })

with open("public/shia_insult_v2_words.json", "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=2)

print(f"Total words: {len(words)}")

