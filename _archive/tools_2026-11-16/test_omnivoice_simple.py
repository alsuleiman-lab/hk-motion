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

print(f"Loading OmniVoice on {device}...", flush=True)
model = OmniVoice.from_pretrained(model_path, device_map=device, dtype=torch.float16)

# Test with valid instruct items
text = "قال عمر بن الخطاب: لا حظ في الإسلام لمن ترك الصلاة"
instruct = "male, middle-aged, low pitch"

out_dir = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\voicestudio_test"
os.makedirs(out_dir, exist_ok=True)
out_wav = os.path.join(out_dir, "omnivoice_low_pitch.wav")

print(f"Synthesizing quote with VoiceStudio OmniVoice: '{text}'...", flush=True)
with torch.no_grad():
    audios = model.generate(
        text=text,
        instruct=instruct,
        speed=0.85,
        guidance_scale=2.2,
        num_step=32,
    )

torchaudio.save(out_wav, audios[0].cpu(), model.sampling_rate)
print(f"Successfully generated to {out_wav}!", flush=True)

