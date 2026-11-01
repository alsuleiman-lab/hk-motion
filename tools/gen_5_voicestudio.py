# -*- coding: utf-8 -*-
import sys
import os
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

desktop_dir = r"C:\Users\mshms\Desktop\أصوات_المشهد_للاختيار"
local_dir = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\اختر_الصوت"
os.makedirs(desktop_dir, exist_ok=True)
os.makedirs(local_dir, exist_ok=True)

sys.path.insert(0, r'S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project')
import torch
import torchaudio
from omnivoice.models.omnivoice import OmniVoice

model_path = r'S:\AI_Tools\VoiceStudio_Runtime\models\models--k2-fsa--OmniVoice\snapshots\c5fdb5ccb189668d56333f77ba2629f4cd7535f4'
device = 'cuda' if torch.cuda.is_available() else 'cpu'

print(f"تحميل نموذج VoiceStudio (OmniVoice) على {device}...", flush=True)
omni_model = OmniVoice.from_pretrained(model_path, device_map=device, dtype=torch.float16)

text_quote = "قال عمر بن الخطاب: لا حظ في الإسلام لمن ترك الصلاة"

omni_variants = [
    ("01_فويس_ستوديو_وثائقي_منخفض.wav", "male, middle-aged, low pitch", 0.85, 138541875),
    ("02_فويس_ستوديو_شيخ_وقور.wav", "male, elderly, low pitch", 0.82, 20261031),
    ("03_فويس_ستوديو_وثائقي_رخيم_عميق.wav", "male, middle-aged, very low pitch", 0.85, 99887766),
    ("04_فويس_ستوديو_معلق_هادئ.wav", "male, middle-aged, moderate pitch", 0.85, 44332211),
    ("05_فويس_ستوديو_جهوري_قوي.wav", "male, low pitch", 0.88, 55667788)
]

with torch.no_grad():
    for filename, instruct, spd, sd in omni_variants:
        print(f"جاري توليد: {filename}...", flush=True)
        torch.manual_seed(sd)
        audios = omni_model.generate(
            text=text_quote,
            instruct=instruct,
            speed=spd,
            guidance_scale=2.2,
            num_step=32,
        )
        dest_local = os.path.join(local_dir, filename)
        dest_desktop = os.path.join(desktop_dir, filename)
        torchaudio.save(dest_local, audios[0].cpu(), omni_model.sampling_rate)
        shutil.copyfile(dest_local, dest_desktop)
        print(f"تم بنجاح -> {filename}", flush=True)

print("اكتملت أصوات VoiceStudio الخمسة بنجاح!", flush=True)

