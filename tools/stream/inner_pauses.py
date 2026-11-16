import sys, os, json, numpy as np
from faster_whisper.audio import decode_audio
# وقفات داخل الكلام (طاقة أقل من العتبة 0.38ث فأكثر) تُحذف، لكن لا يُحذف أبداً مدى فيه كلمة منطوقة في تفريغ الأصل (words_vad.json):
# القراءة الهادئة تهبط تحت عتبة الطاقة فكانت تُحذف («مش عارف كيف» في أول مقاطع بث 2026-11-15) — يُطرح من كل مدى ما حول الكلمات.
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
wf=f".tmp/{p}/words_vad.json"
words=[(w["s"],w["e"]) for w in json.load(open(wf,encoding="utf-8"))] if os.path.exists(wf) else []
res=[]
for x,y in out:
    if y-x<=0.08: continue
    segs=[(x,y)]
    for ws,we in words:
        nxt=[]
        for a0,b0 in segs:
            if we+0.05<=a0 or ws-0.05>=b0: nxt.append((a0,b0)); continue
            if ws-0.05>a0: nxt.append((a0,ws-0.05))
            if we+0.05<b0: nxt.append((we+0.05,b0))
        segs=nxt
    res+= [(u,v) for u,v in segs if v-u>0.38]
print(",".join(f"{x:.2f}-{y:.2f}" for x,y in res))
