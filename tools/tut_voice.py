# توليد صوت «شيخ الردود» بنموذج «فويس تت» المعتمد (أمر المستخدم 2026-11-21: «هذا التت خلاص احنا راح نعتمده»).
# يقرأ النص المصحَّح من texts.json الذي تحفظه صفحة التصحيح (tools/text_review.mjs) بعد ضغط المستخدم «تمّ التصحيح».
#   "S:/AI_Tools/VoiceStudio_Runtime/VoiceStudio/project/.venv/Scripts/python.exe" -X utf8 tools/tut_voice.py <texts.json> <مجلد الناتج> [--ids a,b] [--seeds 7,21]
# الناتج: <مجلد>/<id>_s<seed>.wav لكل نص ولكل بذرة؛ يُختار الأقرب للنص بالتفريغ الكبير ثم يسمعه المستخدم.
#
# التوليد مقطعاً مقطعاً (تنبيه المستخدم 2026-11-21: «يقطع في مواضع ليس فيها فواصل، ومو مضبوط الكلام»): النموذج من عائلة OmniVoice
# يخطئ ويضع سكتات داخل الجملة إذا وُلّد نص طويل (> ~12ث) دفعة واحدة. فيُقطع النص عند علامات الترقيم وحدها، ويُولَّد كل مقطع وحده،
# وتُضغط أي سكتة داخل المقطع إلى 0.05ث، ثم تُوصل المقاطع بسكتة 0.25ث بعد كل علامة و0.5ث بعد النقطة، وضجيج غرفة خافت تحت الكل.
import os, sys, json, re, argparse
_cd = r"S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project\.venv\Lib\site-packages\cudnn8_compat\nvidia\cudnn\bin"
if os.path.isdir(_cd): os.add_dll_directory(_cd); os.environ["PATH"] = _cd + os.pathsep + os.environ.get("PATH", "")
import numpy as np, torch, torchaudio
from omnivoice.models.omnivoice import OmniVoice
ap = argparse.ArgumentParser(); ap.add_argument("texts"); ap.add_argument("out"); ap.add_argument("--ids", default=""); ap.add_argument("--seeds", default="7,21")
ap.add_argument("--ref", default=r"S:\AI_Tools\Remotion_Workspace\data\voices\rudood_short.wav"); ap.add_argument("--ref_text", default=r"S:\AI_Tools\Remotion_Workspace\data\voices\rudood_short.txt")
ap.add_argument("--whole", action="store_true", help="النص كله دفعة واحدة (الطريقة القديمة)")
a = ap.parse_args()
PAUSE = {"،": 0.25, ",": 0.25, "؛": 0.25, ";": 0.25, ":": 0.25, "؟": 0.3, "?": 0.3, "!": 0.3, ".": 0.5, "": 0.0}   # «!» لا يُقطع عنده، فوقفته تأتي فقط إن كان آخر النص

# تطبيع ثابت قبل التوليد (تنبيه المستخدم 2026-11-21): الصلاة على النبي مشكولةً يسكت النموذج بين «عليه» و«وسلم» (قيس: ٠٫٤٨ث)،
# وبلا تشكيل أقصر سكتة؛ و«إله» بألف خفية لا ينطق النموذج ألفها، فتُكتب «إلاه» (كالرحمان ولاكن في مهارة النطق).
DIAC = "[ً-ْٰ]*"
# العبارات المأثورة تُكتب بلا تشكيل: مشكولةً يفصل النموذج بين كلماتها (قيس «سبحانه وتعالى» 2026-11-21: مشكولةً 0.50–0.58ث، بلا تشكيل 0.40–0.44ث)
FORMULAS = ["صلى الله عليه وسلم", "سبحانه وتعالى", "تبارك وتعالى", "عز وجل", "جل جلاله", "رضي الله عنه", "رضي الله عنهم", "رضي الله عنها", "رحمه الله", "عليه السلام"]
def _phrase(p): return r"(?<![ء-ي])" + (r"\s+").join(DIAC.join(ch for ch in w) + DIAC for w in p.split()) + r"(?![ء-ي])"
def normalize(t):
    for p in FORMULAS: t = re.sub(_phrase(p), p, t)
    t = re.sub(r"(?<![ء-ي])([إأا]" + DIAC + "ل" + DIAC + ")ه(" + DIAC + r")(?=\s|[،,.؟?!]|$)", lambda m: "إِلاه" + m.group(2), t)   # بكسرة تحت الهمزة: بدونها سُمعت «الله» (فحص 2026-11-21)
    return t

def chunks(t):
    """المقاطع عند علامات الترقيم وحدها؛ المقطع الأقصر من 3 كلمات يُضم إلى ما بعده (فلا تُولَّد كلمة يتيمة)."""
    t = re.sub(r"[()«»\"“”'\[\]]", "", t)   # الأقواس وعلامات الاقتباس للعين فقط؛ النموذج يقف عندها (تنبيه المستخدم 2026-11-21)
    parts = re.split(r"(?<=[،,؛;:.؟?])\s+", t.strip()); out, cur = [], ""   # «!» نبرة تعجّب لا موضع وقف
    for p in parts:
        cur = (cur + " " + p).strip() if cur else p
        if len(re.sub(r"[()«»]", "", cur).split()) >= 3: out.append(cur); cur = ""
    if cur:
        if out: out[-1] += " " + cur
        else: out.append(cur)
    return [(c, (re.search(r"[،,؛;:.؟?!]$", c) or [""])[0]) for c in out]

def lvl(x, sr, win=0.01):
    w = int(sr * win); n = len(x) // w
    return 20 * np.log10(np.sqrt((x[: n * w].reshape(n, w) ** 2).mean(axis=1)) + 1e-9), w

def trim(x, sr):
    l, w = lvl(x, sr); on = np.where(l > -46)[0]
    if len(on) == 0: return x
    return x[max(0, (on[0] - 6) * w): min(len(x), (on[-1] + 12) * w)]

def squeeze(x, sr, thr=-40.0, max_run=0.08, keep=0.05):
    l, w = lvl(x, sr); n = len(l); quiet = l < thr; out, i = [], 0
    while i < n:
        if not quiet[i]: out.append(x[i * w:(i + 1) * w]); i += 1; continue
        j = i
        while j < n and quiet[j]: j += 1
        out.append(x[i * w:(i + int(keep * 100)) * w] if (j - i) * 0.01 > max_run and 0 < i and j < n else x[i * w:j * w]); i = j
    out.append(x[n * w:]); return np.concatenate(out)

def fade(x, sr, ms=12):
    f = int(sr * ms / 1000)
    if len(x) > 2 * f: r = np.linspace(0, 1, f); x[:f] *= r; x[-f:] *= r[::-1]
    return x

rows = json.load(open(a.texts, encoding="utf-8")); only = [x for x in a.ids.split(",") if x]
os.makedirs(a.out, exist_ok=True)
rt = open(a.ref_text, encoding="utf-8").read()
m = OmniVoice.from_pretrained(r"S:\AI_Tools\voicetut\model", device_map="cuda", dtype=torch.float16); SR = m.sampling_rate
for r in rows:
    if only and r["id"] not in only: continue
    cs = [(re.sub(r"[()«»\"“”'\[\]]", "", normalize(r["text"])), "")] if a.whole else chunks(normalize(r["text"]))
    for seed in [int(s) for s in a.seeds.split(",")]:
        pieces = []
        for k, (c, mark) in enumerate(cs):
            torch.manual_seed(seed * 100 + k)
            w = m.generate(text=c, language="arz", ref_audio=a.ref, ref_text=rt, num_step=48, guidance_scale=2.5, speed=1.0)[0].cpu().numpy().astype(np.float32).reshape(-1)
            if not a.whole: w = fade(squeeze(trim(w, SR), SR), SR)
            pieces += [w, np.zeros(int(SR * PAUSE.get(mark, 0.25)), np.float32)]
        x = np.concatenate(pieces)
        rng = np.random.default_rng(1); b = np.cumsum(rng.standard_normal(len(x)).astype(np.float32)); b -= np.convolve(b, np.ones(2000) / 2000, mode="same")
        x = x + b * (10 ** (-54 / 20) / (np.sqrt((b ** 2).mean()) + 1e-9))
        p = os.path.join(a.out, f"{r['id']}_s{seed}.wav")
        torchaudio.save(p, torch.from_numpy(np.clip(x, -1, 1)).unsqueeze(0), SR)
        print("ok", r["id"], seed, len(cs), "chunks", round(len(x) / SR, 2), flush=True)
