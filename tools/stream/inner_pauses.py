import sys, numpy as np
from faster_whisper.audio import decode_audio
p=sys.argv[1]; thr=float(sys.argv[2]) if len(sys.argv)>2 else -46
a=decode_audio(f".tmp/{p}/a16k.wav",sampling_rate=16000)
fr=160;n=len(a)//fr
db=20*np.log10(np.array([np.sqrt(np.mean(a[i*fr:(i+1)*fr]**2)+1e-12) for i in range(n)])+1e-9)
out=[];s=None
for i in range(n):
    if db[i]<thr:
        if s is None: s=i
    else:
        if s is not None and (i-s)>=38: out.append((s/100+0.14,i/100-0.14))
        s=None
print(",".join(f"{x:.2f}-{y:.2f}" for x,y in out if y-x>0.08))
