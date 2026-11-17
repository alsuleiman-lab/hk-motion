"""Word timeline of the CUT audio with Whisper large-v3 → .tmp/<p>/cut_words_large.json ([{w,s,e}], cut seconds) + cut_text_large.txt (segments). usage: python tools/words_cut_large.py <p>"""
import os, sys, json, subprocess
torch_lib = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/Lib/site-packages/torch/lib"  # cublas DLL for faster-whisper on the GPU (python -I ignores PATH)
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib); os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
p = sys.argv[1]; T = f".tmp/{p}"
subprocess.run(["ffmpeg","-v","error","-y","-i",f"public/{p}_cut.mp4","-vn","-ac","1","-ar","16000",f"{T}/cut16k.wav"],check=True)
m = WhisperModel("large-v3", device="cuda", compute_type="float16", local_files_only=True)
segs,_ = m.transcribe(f"{T}/cut16k.wav", language="ar", word_timestamps=True, vad_filter=True, beam_size=8, best_of=5, temperature=[0.0, 0.2], condition_on_previous_text=False)
W=[]; L=[]
for s in segs:
    L.append(f"[{s.start:.1f}-{s.end:.1f}] {s.text.strip()}")
    for w in s.words: W.append({"w": w.word.strip(), "s": round(w.start,2), "e": round(w.end,2)})
json.dump(W, open(f"{T}/cut_words_large.json","w",encoding="utf-8"), ensure_ascii=False)
open(f"{T}/cut_text_large.txt","w",encoding="utf-8").write("\n".join(L))
print("\n".join(L))
