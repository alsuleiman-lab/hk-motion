import os, sys, json, re, time, ctypes

# Set BelowNormal priority (Rule 8: حماية موارد الجهاز ومنع التقطيع)
try:
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x00004000)
    print("Process priority set to BelowNormal.")
except Exception as e:
    pass

torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception as e:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel

def main():
    audio_path = sys.argv[1] if len(sys.argv) > 1 else r"render_work\debate_jobeX3sJVhM\audio16k.wav"
    out_json = sys.argv[2] if len(sys.argv) > 2 else r"render_work\debate_jobeX3sJVhM\segments.json"

    print(f"Loading Whisper model on CUDA (RTX 3090)...")
    t0 = time.time()
    model = WhisperModel("medium", device="cuda", compute_type="float16")
    print(f"Model loaded in {time.time() - t0:.1f}s. Starting transcription of {audio_path}...")

    t1 = time.time()
    segments, info = model.transcribe(
        audio_path,
        language="ar",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )

    results = []
    for idx, s in enumerate(segments):
        txt = s.text.strip()
        results.append({
            "id": idx,
            "start": round(s.start, 2),
            "end": round(s.end, 2),
            "text": txt
        })
        if idx % 100 == 0:
            print(f"[{s.start:6.1f}s -> {s.end:6.1f}s] ({len(results)} segs) {txt[:60]}...")

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - t1
    print(f"\nDone! Transcribed {len(results)} segments in {elapsed:.1f}s. Saved to {out_json}")

if __name__ == "__main__":
    main()
