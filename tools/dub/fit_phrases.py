# -*- coding: utf-8 -*-
# توليد كل جملة مدبلجة بمدة مستهدفة تساوي نافذة نظيرتها الأصلية، ثم قص الأطراف ومعايرة المدة (مهارة dubbing).
#   python tools/dub/fit_phrases.py --phrases <phrases.json> --out <dir> --lang kmr|ckb|… [--profile 2f19374a] [--seed 101] [--suf _b] [--ids 4,8]
# phrases.json = [{id, s, e, t}] (s/e بالثواني على خط الفيديو النهائي، t نص الجملة). الناتج: <dir>/f<id><suf>.wav (أحادي 48k مقصوص) و<dir>/report.json
import sys, os, json, sqlite3, subprocess, argparse
sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("--phrases", required=True); ap.add_argument("--out", required=True); ap.add_argument("--lang", required=True)
ap.add_argument("--profile", default="2f19374a"); ap.add_argument("--seed", type=int, default=101); ap.add_argument("--suf", default=""); ap.add_argument("--ids", default="")
a = ap.parse_args()
sys.path.insert(0, r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project")
import torch, torchaudio
_cd = r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project\.venv\Lib\site-packages\cudnn8_compat\nvidia\cudnn\bin"
if os.path.isdir(_cd):
    os.add_dll_directory(_cd); os.environ["PATH"] = _cd + os.pathsep + os.environ.get("PATH", "")
from omnivoice.models.omnivoice import OmniVoice
os.makedirs(a.out, exist_ok=True)
db = sqlite3.connect(r"S:\AI_Tools\VoiceStudio_Runtime\data\omnivoice.db")
ref, rt = db.execute("select ref_audio_path, ref_text from voice_profiles where id=?", (a.profile,)).fetchone()
ref = os.path.join(r"S:\AI_Tools\VoiceStudio_Runtime\data\voices", ref)
m = OmniVoice.from_pretrained(r"S:\AI_Tools\VoiceStudio_Runtime\models\models--k2-fsa--OmniVoice\snapshots\c5fdb5ccb189668d56333f77ba2629f4cd7535f4", device_map="cuda", dtype=torch.float16)
P = json.load(open(a.phrases, encoding="utf-8")); SR = m.sampling_rate
only = [int(x) for x in a.ids.split(",")] if a.ids else None
FLT = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,afade=t=in:d=0.02,areverse,afade=t=in:d=0.03,areverse"
def gen(t, **kw):
    torch.manual_seed(a.seed)
    with torch.no_grad():
        return m.generate(text=t, language=a.lang, ref_audio=ref, ref_text=rt, num_step=32, **kw)[0].cpu()
def trim(wav, raw, out):
    torchaudio.save(raw, wav, SR)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-af", FLT, "-ar", "48000", "-ac", "1", out], check=True)
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
rp = os.path.join(a.out, "report.json"); rep = json.load(open(rp)) if os.path.exists(rp) else {}
for p in P:
    i = p["id"]
    if only and i not in only: continue
    win = p["e"] - p["s"]; goal = win - 0.04
    raw = f"{a.out}/raw{i:02d}.wav"; outf = f"{a.out}/f{i:02d}{a.suf}.wav"
    w = gen(p["t"], speed=1.0); nat_raw = w.shape[-1] / SR
    nat = trim(w, raw, f"{a.out}/n{i:02d}.wav")
    tgt = nat_raw * goal / nat
    for it in range(3):
        d = trim(gen(p["t"], duration=max(0.7, tgt)), raw, outf)
        if abs(d - goal) < 0.08: break
        tgt = tgt * goal / d
    rep[str(i) + a.suf] = {"win": round(win, 2), "nat": round(nat, 2), "ratio": round(goal / nat, 2), "got": round(d, 2), "err": round(d - goal, 2)}
    print(i, rep[str(i) + a.suf], flush=True)
json.dump(rep, open(rp, "w"))
