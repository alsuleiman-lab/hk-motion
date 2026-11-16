"""Cut the silences out of a VIDEO (rule: pause > 0.4 s -> short) and re-time its word list. Same idea as tools/voice_cut.py but keeps the picture.
Usage: python tools/media_cut.py <in.mp4> <words.json> <out.mp4> <out_words.json> [--padstart 100] [--padend 180] [--minsil 400] [--fps 30] [--scale 1280]
 - speech segments by Silero VAD, joined with ffmpeg (trim/atrim + concat, 30 fps, h264 crf 16 + aac); --scale W upscales a low-res source to W px wide (lanczos)
 - words.json = [{s,e,w}] from tools/transcribe_words.py of the SAME audio; output words are re-timed on the cut media"""
import sys, json, subprocess
from faster_whisper.audio import decode_audio
from faster_whisper.vad import get_speech_timestamps, VadOptions

src, wj, out, outw = sys.argv[1:5]
a = sys.argv[5:]
opt = lambda n, d: int(a[a.index("--" + n) + 1]) if "--" + n in a else d
ps, pe, ms, fps, scale = opt("padstart", 100), opt("padend", 180), opt("minsil", 400), opt("fps", 30), opt("scale", 0)
audio = decode_audio(src, sampling_rate=16000)
total = len(audio) / 16000
ts = get_speech_timestamps(audio, VadOptions(threshold=0.35, min_silence_duration_ms=ms, speech_pad_ms=0, min_speech_duration_ms=120))
seg = [[max(0, t["start"] / 16000 - ps / 1000), min(total, t["end"] / 16000 + pe / 1000)] for t in ts]
merged = []
for s, e in seg:
    if merged and s <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], e)
    else:
        merged.append([s, e])
vf = f",scale={scale}:-2:flags=lanczos" if scale else ""
parts = []
for i, (s, e) in enumerate(merged):
    parts.append(f"[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS,fps={fps}{vf}[v{i}];[0:a]atrim={s:.3f}:{e:.3f},asetpts=N/SR/TB[a{i}]")
fc = ";".join(parts) + ";" + "".join(f"[v{i}][a{i}]" for i in range(len(merged))) + f"concat=n={len(merged)}:v=1:a=1[v][a]"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-c:a", "aac", "-b:a", "160k", out], check=True)
maps, n = [], 0.0
for s, e in merged:
    maps.append((s, e, n)); n += e - s
def m(t):
    for s, e, off in maps:
        if t < s: return round(off, 3)
        if t <= e: return round(off + t - s, 3)
    return round(n, 3)
words = json.load(open(wj, encoding="utf8"))
json.dump({"duration": round(n, 3), "words": [{"w": w["w"], "s": m(w["s"]), "e": m(w["e"])} for w in words], "segments": [[round(s, 2), round(e, 2)] for s, e, _ in maps]}, open(outw, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"{len(merged)} segments, {total:.1f}s -> {n:.1f}s")
