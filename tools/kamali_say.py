# -*- coding: utf-8 -*-
# Reads a hadith/quote in the approved reference voice (data/voices/kamali.wav, OmniVoice clone, speed 0.95): VoiceStudio python tools/kamali_say.py "<نص مشكول>" <out.wav>; then verify with Whisper before use.
import sys,os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, r'S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project')
import torch, torchaudio
from omnivoice.models.omnivoice import OmniVoice
mp=r'S:\AI_Tools\VoiceStudio_Runtime\models\models--k2-fsa--OmniVoice\snapshots\c5fdb5ccb189668d56333f77ba2629f4cd7535f4'
m=OmniVoice.from_pretrained(mp,device_map='cuda',dtype=torch.float16)
ref=r'S:\AI_Tools\Remotion_Workspace\data\voices\kamali.wav'
rt=open(r'S:\AI_Tools\Remotion_Workspace\data\voices\kamali.txt',encoding='utf-8').read().strip()
text=sys.argv[1]; out=sys.argv[2]
with torch.no_grad():
    a=m.generate(text=text,ref_audio=ref,ref_text=rt,speed=0.95)
torchaudio.save(out,a[0].cpu(),m.sampling_rate)
print('saved',out)
