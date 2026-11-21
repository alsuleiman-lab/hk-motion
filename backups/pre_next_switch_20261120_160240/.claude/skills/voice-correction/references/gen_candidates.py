# -*- coding: utf-8 -*-
import sys, os, io, json, inspect, subprocess
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project")
sys.path.insert(0, r"C:\Users\mshms\.claude\skills\arabic-tts-pronunciation")
import torch, torchaudio
_cd = r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project\.venv\Lib\site-packages\cudnn8_compat\nvidia\cudnn\bin"
if os.path.isdir(_cd):
    os.add_dll_directory(_cd); os.environ["PATH"] = _cd + os.pathsep + os.environ.get("PATH", "")
from omnivoice.models.omnivoice import OmniVoice
from tts_text import prepare_for_tts
D = r"S:\AI_Tools\Remotion_Workspace\.tmp\voicefix"
FF = r"C:\Users\mshms\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
text = sys.argv[1]
tag = sys.argv[2]
refs = sys.argv[3].split(",")
seeds = [int(x) for x in sys.argv[4].split(",")]
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
prep = prepare_for_tts(text)
print("TEXT:", text); print("PREP:", prep, flush=True)
m = OmniVoice.from_pretrained(r"S:\AI_Tools\VoiceStudio_Runtime\models\models--k2-fsa--OmniVoice\snapshots\c5fdb5ccb189668d56333f77ba2629f4cd7535f4", device_map="cuda", dtype=torch.float16)
SIG = inspect.signature(m.generate).parameters
for r in refs:
    rt = open(os.path.join(D, f"ref{r}.txt"), encoding="utf-8").read().strip()
    for sd in seeds:
        torch.manual_seed(sd)
        kw = dict(text=prep, ref_audio=os.path.join(D, f"ref{r}.wav"), ref_text=rt, speed=speed)
        if "num_step" in SIG: kw["num_step"] = 32
        with torch.no_grad():
            a = m.generate(**kw)
        raw = os.path.join(D, f"{tag}_{r}_{sd}_raw.wav"); out = os.path.join(D, f"{tag}_{r}_{sd}.wav")
        torchaudio.save(raw, a[0].cpu(), m.sampling_rate)
        subprocess.run([FF, "-y", "-loglevel", "error", "-i", raw, "-af", "silenceremove=start_periods=1:start_duration=0.03:start_threshold=-42dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-42dB:start_silence=0.03,areverse", out])
        print("GEN", r, sd, out, flush=True)
