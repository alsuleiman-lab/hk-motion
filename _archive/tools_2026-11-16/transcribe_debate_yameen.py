import os, sys, json, time, ctypes

try:
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x00004000) # BelowNormal
except:
    pass

torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel

def main():
    video_path = r"public\debate_yameen_cut.mp4"
    out_words = r"public\debate_yameen_words.json"
    out_segments = r"public\debate_yameen_segments.json"

    print("Loading faster-whisper on GPU...")
    model = WhisperModel("medium", device="cuda", compute_type="float16")
    
    print(f"Transcribing {video_path}...")
    t0 = time.time()
    segments, info = model.transcribe(
        video_path,
        language="ar",
        beam_size=5,
        word_timestamps=True
    )

    all_words = []
    seg_list = []
    for s in segments:
        seg_list.append({
            "start": round(s.start, 3),
            "end": round(s.end, 3),
            "text": s.text.strip()
        })
        for w in (s.words or []):
            all_words.append({
                "word": w.word.strip(),
                "start": round(w.start, 3),
                "end": round(w.end, 3),
                "prob": round(w.probability, 3)
            })

    with open(out_words, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)

    with open(out_segments, "w", encoding="utf-8") as f:
        json.dump(seg_list, f, ensure_ascii=False, indent=2)

    print(f"Done! {len(all_words)} words in {time.time() - t0:.1f}s. Saved to {out_words}")

if __name__ == "__main__":
    main()
