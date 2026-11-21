# -*- coding: utf-8 -*-
"""يولّد صوت نص عربي مشكول بصوت مرجعي من خادم VoiceStudio الجاري (منفذ 8765) بقواعد مهارة arabic-tts-pronunciation:
  python tools/ext/voice_story.py <نص.txt> <مخرج.wav> [--profile kamali] [--speed 0.95] [--steps 32]
ويكتب بجانب المخرج: <مخرج>.chunks.json (المقاطع وأزمنتها) و<مخرج>.qc.txt (تفريغ كل مقطع ومقارنته بالأصل).
الخطوات: تحضير النص (وقف، شدّة…) ← تقطيع عند علامات الترقيم فقط ← توليد كل مقطع ← قص أطراف المقطع وضغط السكتات الداخلية ←
سكتة بعد كل مقطع بحسب العلامة (0.25 ث لكل علامة و0.5 للنقطة) ← ضجيج غرفة −54 dBFS ← تفريغ آلي لكل مقطع للمقارنة.
ملاحظة: الحكم النهائي على النطق بسمع المستخدم (التفريغ لا يميز الحركات)."""
import sys, os, io, json, subprocess, wave, re, argparse
import numpy as np
import requests
import torch, difflib
_tl = os.path.join(os.path.dirname(torch.__file__), "lib")
if os.path.isdir(_tl):
    os.add_dll_directory(_tl); os.environ["PATH"] = _tl + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, r"C:\Users\mshms\.claude\skills\arabic-tts-pronunciation")
from tts_text import prepare_for_tts, split_chunks  # noqa: E402

FF = r"C:\Users\mshms\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
API = "http://127.0.0.1:8765"
SR = 24000
PAUSES = {"،": 0.25, ",": 0.25, "؛": 0.25, ";": 0.25, ":": 0.25, "؟": 0.25, "?": 0.25, "!": 0.25, ".": 0.5, "": 0.0}
TIGHT = ("silenceremove=start_periods=1:start_duration=0.03:start_threshold=-42dB:start_silence=0.04:"
         "stop_periods=-1:stop_duration=0.12:stop_threshold=-38dB:stop_silence=0.06")
TRIM_END = ",areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-42dB:start_silence=0.03,areverse"


DIAC = re.compile("[ً-ٰٟـ]")
_ASR = None
def norm(t):
    t = DIAC.sub("", t)
    t = re.sub("[أإآ]", "ا", t).replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"[^\w\s]", " ", t).split()

def asr_score(pcm, ref_text):
    global _ASR
    if _ASR is None:
        _ASR = WhisperModel("large-v3", device="cuda", compute_type="float16")
    import tempfile
    fn = os.path.join(tempfile.gettempdir(), "vs_take.wav")
    with wave.open(fn, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(pcm, -1, 1) * 32767).astype(np.int16).tobytes())
    segs, _ = _ASR.transcribe(fn, language="ar", beam_size=5, initial_prompt=" ".join(norm(ref_text)[:0]) or None)
    raw_heard = " ".join(s.text for s in segs)
    heard = norm(raw_heard)
    ref = norm(ref_text)
    if re.search(r"\d", raw_heard):
        NUM = ("احدي", "عشرين", "ستين", "ستمئه", "ستميه", "ثمان", "ثمانيه", "عشر", "سبعمئه", "سبعميه", "اربع")
        ref = [w for w in ref if not any(w.lstrip("و") == nw for nw in NUM)]
        heard = [w for w in heard if not re.search(r"\d", w)]
    hit = 0
    used = set()
    for r in ref:
        best, bj = 0, -1
        for j, h in enumerate(heard):
            if j in used: continue
            q = difflib.SequenceMatcher(a=r, b=h).ratio()
            if q > best: best, bj = q, j
        if best >= 0.7: hit += 1; used.add(bj)
    extra = max(0, len(heard) - len(used))
    return (hit - 0.5 * extra) / max(1, len(ref)), " ".join(heard)

def gen(text, profile, speed, steps, seed=None):
    data = {"text": text, "language": "Arabic", "profile_id": profile, "effect_preset": "raw", "num_step": str(steps), "speed": str(speed)}
    if seed is not None: data["seed"] = str(seed)
    r = requests.post(API + "/generate", data=data, timeout=1800)
    r.raise_for_status()
    return r.content


def to_pcm(wav_bytes):
    """يفكّ الصوت ويقصّ الصمت من الطرفين فقط (بلا أي وصلة داخلية) مع إبقاء حواف طبيعية: 60 م.ث قبل الكلام و150 م.ث بعده."""
    p = subprocess.run([FF, "-v", "error", "-i", "pipe:0", "-ar", str(SR), "-ac", "1", "-f", "s16le", "pipe:1"],
                       input=wav_bytes, stdout=subprocess.PIPE, check=True)
    x = np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    win = int(SR * 0.01); n = len(x) // win
    if n < 3: return x
    lvl = 20 * np.log10(np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(axis=1)) + 1e-9)
    on = np.where(lvl > -48)[0]
    if len(on) == 0: return x
    a = max(0, (on[0] - 6) * win); b = min(len(x), (on[-1] + 16) * win)
    return x[a:b].copy()


def squeeze_internal(x, thr_db=-40.0, max_run=0.08, keep=0.05):
    win = int(SR * 0.01)
    n = len(x) // win
    if n < 3:
        return x
    rms = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12)
    quiet = 20 * np.log10(rms) < thr_db
    out, i = [], 0
    while i < n:
        if not quiet[i]:
            out.append(x[i * win:(i + 1) * win]); i += 1; continue
        j = i
        while j < n and quiet[j]: j += 1
        run = (j - i) * 0.01
        if run > max_run and i > 0 and j < n:
            k = int(keep / 0.01)
            out.append(x[i * win:(i + k) * win])
        else:
            out.append(x[i * win:j * win])
        i = j
    out.append(x[n * win:])
    return np.concatenate(out)


def trim_artifacts(x, thr=-44.0, strong=-30.0, lead=0.12, tail_thr=-42.0, keep_tail=0.08):
    """يقصّ ما يولّده النموذج قبل بداية الكلام (شهيق وهمهمة منخفضة التردد 0.2–0.7ث، سمعها المستخدم «صوتاً قبل كل جملة») وما يلي آخر الكلام.
    بداية الكلام الفعلية = أول نافذة 20ms يزيد فيها نطاق 600–4000Hz عن thr ثلاث نوافذ متتالية ويبلغ خلال 0.3ث بعدها strong؛
    فالهمهمة تقع في النطاق المنخفض وتبقى تحت thr في النطاق الأوسط. يُبقى lead قبلها لحرف رخو. الاختبار: .tmp/onset_test.py."""
    w, hop = 480, 240
    n = (len(x) - w) // hop
    if n < 20: return x
    win = np.hanning(w); f = np.fft.rfftfreq(w, 1 / SR); sel = (f >= 600) & (f < 4000)
    mb = np.array([10 * np.log10((np.abs(np.fft.rfft(x[i * hop:i * hop + w] * win)) ** 2)[sel].sum() / w ** 2 + 1e-12) for i in range(n)])
    on = next((i for i in range(n - 3) if (mb[i:i + 3] > thr).all() and mb[i:i + 30].max() > strong), 0)
    a = max(0, on * hop - int(lead * SR))
    ww = SR // 100
    m = len(x) // ww
    lv = 20 * np.log10(np.sqrt((x[:m * ww].reshape(m, ww) ** 2).mean(axis=1)) + 1e-9)
    off = next((i for i in range(m - 1, 2, -1) if (lv[i - 2:i + 1] > tail_thr).all()), m - 1)
    b = min(len(x), (off + 1 + int(keep_tail * 100)) * ww)
    return x[a:b] if b - a > SR // 2 else x


def fade(x, ms=30):
    f = int(SR * ms / 1000)
    if len(x) > 2 * f:
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, f)); x[:f] *= ramp; x[-f:] *= ramp[::-1]
    return x


def room_tone(n, level_db=-54.0, seed=1):
    rng = np.random.default_rng(seed)
    w = rng.standard_normal(n).astype(np.float32)
    b = np.cumsum(w); b -= np.mean(b)                     # ضجيج وردي تقريبي (تكامل الأبيض)
    b = b - np.convolve(b, np.ones(2000) / 2000, mode="same")
    b *= 10 ** (level_db / 20) / (np.sqrt((b ** 2).mean()) + 1e-9)
    return b


def split_sentences(t):
    """جمل كاملة: يُقطع عند النقطة والنقطتين فقط؛ الفواصل تبقى داخل المقطع فيتولى النموذج وقفاتها الطبيعية."""
    parts = re.split(r"(?<=[.:؟])\s+", t.strip())
    out = []
    for p in parts:
        p = p.strip()
        if not p: continue
        m = re.search(r"[.:؟]$", p)
        out.append((p, m.group(0) if m else ""))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("text"); ap.add_argument("out")
    ap.add_argument("--profile", default="kamali"); ap.add_argument("--speed", type=float, default=0.95); ap.add_argument("--steps", type=int, default=32)
    a = ap.parse_args()
    raw = open(a.text, encoding="utf-8").read().strip()
    chunks = []
    segs = raw.split("‖")          # ‖ = حدّ مقطع يدوي (وقفة قصيرة 0.22ث) لتقصير الجمل الطويلة
    for si, seg in enumerate(segs):
        for p in re.split(r"(?<=\.)\s+", seg.strip()):
            p = p.strip()
            if not p: continue
            mark = "." if p.endswith(".") else ("‖" if si < len(segs) - 1 else "")
            chunks.append((prepare_for_tts(p), mark))
    parts, info, t, qc = [], [], 0.0, []
    for k, (c, mark) in enumerate(chunks):
        best = (-9, None, "")
        for tr in range(5):
            wavb = gen(c, a.profile, a.speed, a.steps, seed=None if tr == 0 else 1000 + 37 * k + tr)
            xx = fade(trim_artifacts(to_pcm(wavb)))
            sc, heard = asr_score(xx, c)
            print(f"   محاولة {tr + 1}: {sc:.2f}")
            if sc > best[0]: best = (sc, xx, heard)
            if sc >= 0.97: break
        x = best[1]
        qc.append({"i": k, "score": round(best[0], 3), "heard": best[2], "tts": c})
        pause = {".": 0.42, "‖": 0.22, ":": 0.2, "؟": 0.42}.get(mark, 0.3)
        info.append({"i": k, "tts": c, "mark": mark, "start": round(t, 3), "end": round(t + len(x) / SR, 3), "pause": pause})
        parts.append(x); parts.append(np.zeros(int(SR * pause), dtype=np.float32))
        t += len(x) / SR + pause
        print(f"[{k + 1}/{len(chunks)}] {len(x) / SR:.2f}s  {c[:48]}")
    y = np.concatenate(parts)
    y = y + room_tone(len(y))
    y = np.clip(y, -1, 1)
    pcm = (y * 32767).astype(np.int16)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    open(a.out + ".qc.txt", "w", encoding="utf-8").write("\n".join(f"{q['i']}\t{q['score']}\t{q['heard']}" for q in qc))
    json.dump({"duration": round(len(y) / SR, 3), "chunks": info, "text": raw}, open(a.out + ".chunks.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"saved {a.out}  {len(y) / SR:.2f}s")


if __name__ == "__main__":
    main()
