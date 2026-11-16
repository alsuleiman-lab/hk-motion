# -*- coding: utf-8 -*-
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

sys.path.insert(0, r'S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project')

import torch
import torchaudio
from omnivoice.models.omnivoice import OmniVoice

model_path = r'S:\AI_Tools\VoiceStudio_Runtime\models\models--k2-fsa--OmniVoice\snapshots\c5fdb5ccb189668d56333f77ba2629f4cd7535f4'
device = 'cuda' if torch.cuda.is_available() else 'cpu'

print(f"Loading OmniVoice model from {model_path} on {device}...", flush=True)
model = OmniVoice.from_pretrained(model_path, device_map=device, dtype=torch.float16)

text = "قال عمر بن الخطاب: لا حظ في الإسلام لمن ترك الصلاة"
instruct = "male, middle-aged, moderate pitch"
out_wav = r'S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\quote_omnivoice.wav'
os.makedirs(os.path.dirname(out_wav), exist_ok=True)

print(f"Synthesizing quote: '{text}'...", flush=True)
with torch.no_grad():
    audios = model.generate(
        text=text,
        instruct=instruct,
        speed=0.88,
        guidance_scale=2.0,
        num_step=32,
    )

torchaudio.save(out_wav, audios[0].cpu(), model.sampling_rate)
print(f"Successfully generated to {out_wav}!", flush=True)
