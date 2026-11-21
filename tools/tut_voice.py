# توليد صوت «شيخ الردود» بنموذج «فويس تت» المعتمد (أمر المستخدم 2026-11-21: «هذا التت خلاص احنا راح نعتمده»).
# يقرأ النص المصحَّح من texts.json الذي تحفظه صفحة التصحيح (tools/text_review.mjs) بعد ضغط المستخدم «تمّ التصحيح».
#   "S:/AI_Tools/VoiceStudio_Runtime/VoiceStudio/project/.venv/Scripts/python.exe" -X utf8 tools/tut_voice.py <texts.json> <مجلد الناتج> [--ids a,b] [--seeds 7,21]
# الناتج: <مجلد>/<id>_s<seed>.wav لكل نص ولكل بذرة؛ يُختار الأقرب للنص بالتفريغ الكبير ثم يسمعه المستخدم.
import os, sys, json, argparse
_cd = r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project\.venv\Lib\site-packages\cudnn8_compat\nvidia\cudnn\bin"
if os.path.isdir(_cd): os.add_dll_directory(_cd); os.environ["PATH"] = _cd + os.pathsep + os.environ.get("PATH", "")
import torch, torchaudio
from omnivoice.models.omnivoice import OmniVoice
ap = argparse.ArgumentParser(); ap.add_argument("texts"); ap.add_argument("out"); ap.add_argument("--ids", default=""); ap.add_argument("--seeds", default="7,21")
ap.add_argument("--ref", default=r"S:\AI_Tools\Remotion_Workspace\data\voices\rudood_short.wav"); ap.add_argument("--ref_text", default=r"S:\AI_Tools\Remotion_Workspace\data\voices\rudood_short.txt")
a = ap.parse_args()
rows = json.load(open(a.texts, encoding="utf-8")); only = [x for x in a.ids.split(",") if x]
os.makedirs(a.out, exist_ok=True)
rt = open(a.ref_text, encoding="utf-8").read()
m = OmniVoice.from_pretrained(r"S:\AI_Tools\voicetut\model", device_map="cuda", dtype=torch.float16)
for r in rows:
    if only and r["id"] not in only: continue
    for seed in [int(s) for s in a.seeds.split(",")]:
        torch.manual_seed(seed)
        w = m.generate(text=r["text"], language="arz", ref_audio=a.ref, ref_text=rt, num_step=48, guidance_scale=2.5, speed=1.0)[0].cpu()
        p = os.path.join(a.out, f"{r['id']}_s{seed}.wav")
        torchaudio.save(p, w.unsqueeze(0) if w.dim() == 1 else w, m.sampling_rate)
        print("ok", r["id"], seed, round(w.shape[-1] / m.sampling_rate, 2), flush=True)
