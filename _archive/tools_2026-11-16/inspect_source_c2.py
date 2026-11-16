import os, sys, subprocess
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel

SOURCE = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8\source.mp4"
cmd = f'ffmpeg -ss 8655 -t 30 -i "{SOURCE}" -vn -c:a pcm_s16le -ar 16000 .tmp/c2_inspect.wav -y'
subprocess.run(cmd, shell=True)

model = WhisperModel("small", device="cuda", compute_type="float16")
segments, info = model.transcribe(".tmp/c2_inspect.wav", language="ar", word_timestamps=True)

with open(".tmp/c2_inspect_words.txt", "w", encoding="utf-8") as out:
    for seg in segments:
        out.write(f"SEG: {seg.start+8655:.2f} - {seg.end+8655:.2f}: {seg.text}\n")
        for w in seg.words:
            out.write(f"   {w.start+8655:.2f} - {w.end+8655:.2f}: {w.word}\n")

print("Done writing to .tmp/c2_inspect_words.txt")
