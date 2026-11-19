import sys, os, glob, subprocess
sys.stdout.reconfigure(encoding="utf-8")
import torch
_tl = os.path.join(os.path.dirname(torch.__file__), "lib")
os.add_dll_directory(_tl); os.environ["PATH"] = _tl + os.pathsep + os.environ.get("PATH", "")
_cd = r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project\.venv\Lib\site-packages\cudnn8_compat\nvidia\cudnn\bin"
if os.path.isdir(_cd): os.add_dll_directory(_cd); os.environ["PATH"] = _cd + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
for f in sorted(glob.glob(sys.argv[1])):
    segs, info = m.transcribe(f, language="ar", beam_size=5)
    print(os.path.basename(f), round(info.duration, 2), "|", " ".join(s.text.strip() for s in segs))
