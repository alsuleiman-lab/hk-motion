import os
import sys
import json
import time
import ctypes
import subprocess
from pathlib import Path

# Fix stdout/stderr encoding on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except:
    pass

# Set process priority to BelowNormal (Rule 8: حماية موارد الجهاز ومنع التقطيع)
try:
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x00004000)
    print("Process priority set to BelowNormal.")
except Exception as e:
    pass

ROOT = Path("s:/AI_Tools/Remotion_Workspace")
READY_BASE = Path(r"C:\Users\mshms\Videos\جاهز\بثوث")
PORTRAIT_DIR = READY_BASE / "طولي"
LANDSCAPE_DIR = READY_BASE / "عرضي"
SOURCE_VIDEO = r"C:\Users\mshms\Videos\بث للحوار مع المخالفين.mp4"
TEMP_DIR = ROOT / "render_work" / "debate_calls"
TEMP_DIR.mkdir(parents=True, exist_ok=True)
PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
LANDSCAPE_DIR.mkdir(parents=True, exist_ok=True)

# 8 Calls Specification
CALLS = [
    {
        "id": 1,
        "title": "حوار_حول_صفة_العلم_والسمع_والبصر_الشيخ_محمد_بن_شمس_الدين",
        "start": 56.5,
        "end": 1327.0,
        "topic": "مناقشة صفة العلم والسمع والبصر هل هما علمان"
    },
    {
        "id": 2,
        "title": "الشفاعة_في_الحدود_وحكم_المرتد_وقصة_ابن_أبي_سرح_الشيخ_محمد_بن_شمس_الدين",
        "start": 1327.5,
        "end": 1776.0,
        "topic": "الشفاعة في الحدود وحكم المرتد وقصة ابن أبي سرح"
    },
    {
        "id": 3,
        "title": "مسألة_الحاكمية_وتكفير_الحكام_والقوانين_الوضعية_الشيخ_محمد_بن_شمس_الدين",
        "start": 1778.0,
        "end": 2146.5,
        "topic": "الحاكمية وتكفير الحكام والقوانين الوضعية"
    },
    {
        "id": 4,
        "title": "علم_الله_الأزلي_وعلمه_عند_وقوع_الشيء_الشيخ_محمد_بن_شمس_الدين",
        "start": 2146.9,
        "end": 2681.6,
        "topic": "علم الله الأزلي وعلمه عند وقوع الشيء"
    },
    {
        "id": 5,
        "title": "متصل_شيعي_يسأل_عن_حديث_الأطيط_والاستواء_على_العرش_الشيخ_محمد_بن_شمس_الدين",
        "start": 2699.0,
        "end": 2907.4,
        "topic": "حديث الأطيط والجلوس على الكرسي والاستواء وعقيدة الشيعة"
    },
    {
        "id": 6,
        "title": "حوار_مطول_مع_أبو_موسى_حول_السلفية_والأشاعرة_الشيخ_محمد_بن_شمس_الدين",
        "start": 2908.4,
        "end": 4401.0,
        "topic": "حوار مطول مع أبو موسى حول السلفية والأشاعرة وتكفير العلماء"
    },
    {
        "id": 7,
        "title": "مناقشة_مع_متصل_أشعري_حول_صفات_الله_والوجود_الشيخ_محمد_بن_شمس_الدين",
        "start": 4402.6,
        "end": 4992.0,
        "topic": "مناقشة صفات الله والوجود والفاصل بين الخالق والمخلوق مع متصل أشعري"
    },
    {
        "id": 8,
        "title": "منهج_السلف_ومسألة_خلق_القرآن_وتكفير_المأمون_الشيخ_محمد_بن_شمس_الدين",
        "start": 4993.0,
        "end": 5693.0,
        "topic": "منهج السلف ومسائل خلق القرآن وتكفير المأمون وأخذ العلم"
    }
]

def cut_silence_for_call(call_info):
    cid = call_info["id"]
    title = call_info["title"]
    st = call_info["start"]
    en = call_info["end"]
    raw_dur = en - st

    print(f"\n{'='*70}")
    print(f"🎬 معالجة المكالمة [{cid}/8]: {title}")
    print(f"📌 الموضوع: {call_info['topic']}")
    print(f"⏱️ التوقيت الأصلي: {st:.1f}s -> {en:.1f}s (المدة الخام: {raw_dur/60:.1f} دقيقة)")
    print(f"{'='*70}")

    out_portrait = PORTRAIT_DIR / f"{title}.mp4"
    out_landscape = LANDSCAPE_DIR / f"{title}.mp4"
    for candidate in [out_landscape, out_portrait]:
        if candidate.exists() and candidate.stat().st_size > 1024 * 1024:
            print(f"[{cid}] ✔️ الملف موجود بالفعل في ({candidate.parent.name}) بحجم {candidate.stat().st_size / 1024 / 1024:.1f} MB - تخطي.")
            probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(candidate)], stdout=subprocess.PIPE, text=True)
            net_dur = float(probe.stdout.strip())
            return {
                "id": cid,
                "title": title,
                "topic": call_info["topic"],
                "raw_dur": raw_dur,
                "net_dur": net_dur,
                "format": "طولي (9:16)" if net_dur < 120.0 else "عرضي (16:9)",
                "out_file": str(candidate),
                "size_mb": round(candidate.stat().st_size / 1024 / 1024, 1)
            }

    # Step 1: Extract call raw chunk fast with stream copy
    raw_chunk = TEMP_DIR / f"call_{cid}_raw.mp4"
    t0 = time.time()
    print(f"[{cid}] 1/3 استخراج المقطع الخام للمكالمة...", flush=True)
    extract_cmd = [
        "ffmpeg", "-y", "-threads", "4",
        "-ss", str(st), "-to", str(en),
        "-i", SOURCE_VIDEO,
        "-c", "copy",
        str(raw_chunk)
    ]
    res = subprocess.run(extract_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error extracting chunk: {res.stderr}", flush=True)
        return False
    print(f"[{cid}] تم استخراج المقطع في {time.time()-t0:.1f}ث.", flush=True)

    # Step 2: Detect silences using ffmpeg silencedetect (noise=-35dB, d=0.4)
    print(f"[{cid}] 2/3 كشف السكتات (> 0.4 ثانية)...")
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(raw_chunk)], stdout=subprocess.PIPE, text=True)
    chunk_dur = float(probe.stdout.strip())

    sd_cmd = [
        "ffmpeg", "-hide_banner", "-i", str(raw_chunk),
        "-af", "silencedetect=noise=-35dB:d=0.4",
        "-vn", "-f", "null", "-"
    ]
    sd_res = subprocess.run(sd_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    
    sil = []
    import re
    for m in re.finditer(r"silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)", sd_res.stderr):
        sil.append((float(m.group(1)), float(m.group(2))))

    print(f"[{cid}] تم رصد {len(sil)} سكتة أطول من 0.4 ثانية.")

    # Calculate removal intervals (shorten pauses > 0.4s to ~0.25s)
    KEEP = 0.25
    MIN = 0.4
    rem = []
    for s_start, s_dur in sil:
        if s_dur <= MIN:
            continue
        if s_start < 0.01:
            rem.append([0.0, max(0.0, s_dur - 0.12)])
        elif s_start + s_dur >= chunk_dur - 0.05:
            rem.append([s_start + KEEP, chunk_dur])
        else:
            rem.append([s_start + KEEP / 2, s_start + s_dur - KEEP / 2])

    rem.sort(key=lambda x: x[0])
    merged = []
    for r in rem:
        if merged and r[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], r[1])
        else:
            merged.append(list(r))

    # Keep intervals
    keep = []
    cur = 0.0
    for a, b in merged:
        if a > cur:
            keep.append([round(cur, 3), round(a, 3)])
        cur = b
    if cur < chunk_dur:
        keep.append([round(cur, 3), round(chunk_dur, 3)])

    S = [k for k in keep if k[1] - k[0] > 0.05]
    net_dur = sum(b - a for a, b in S)
    print(f"[{cid}] تقليص المدة بعد إزالة السكتات: {chunk_dur:.1f}ث -> {net_dur:.1f}ث ({net_dur/60:.2f} دقيقة)")

    # Check orientation rule
    is_vertical = net_dur < 120.0
    orient_str = "طولي (9:16)" if is_vertical else "عرضي (16:9)"
    print(f"[{cid}] الصيغة المعتمدة: {orient_str} (المعيار: < 2 دقيقة طولي، الباقي عرضي)")

    # Step 3: Render final cut to C:\Users\mshms\Videos\جاهز\بثوث\(طولي أو عرضي)\<title>.mp4
    out_final = (PORTRAIT_DIR if is_vertical else LANDSCAPE_DIR) / f"{title}.mp4"
    print(f"[{cid}] 3/3 جاري الرندر النهائي عبر كرت الشاشة RTX 3090...")
    print(f"    المسار النهائي: {out_final}")

    # Build filter complex for ffmpeg
    v_parts = []
    a_parts = []
    for i, (a, b) in enumerate(S):
        dur = b - a
        if is_vertical:
            # Crop center 1080x1920 (aspect 9:16)
            # Source is 1920x1080. For vertical, crop 607x1080 centered on Sheikh and scale to 1080x1920
            v_parts.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS,crop=608:1080:656:0,scale=1080:1920[v{i}]")
        else:
            v_parts.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]")
        a_parts.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={(dur-0.008):.3f}:d=0.008[a{i}]")

    cat_str = "".join(f"[v{i}][a{i}]" for i in range(len(S))) + f"concat=n={len(S)}:v=1:a=1[v][a]"
    filter_script = TEMP_DIR / f"filter_call_{cid}.txt"
    with open(filter_script, "w", encoding="utf-8") as f:
        f.write(";\n".join(v_parts + a_parts + [cat_str]))

    t1 = time.time()
    render_cmd = [
        "ffmpeg", "-hide_banner", "-v", "error", "-y",
        "-threads", "4",
        "-hwaccel", "cuda",
        "-i", str(raw_chunk),
        "-/filter_complex", str(filter_script),
        "-map", "[v]", "-map", "[a]",
        "-r", "30",
        "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "16", "-b:v", "0", "-g", "30", "-bf", "0", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(out_final)
    ]
    render_res = subprocess.run(render_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if render_res.returncode != 0:
        print(f"Error rendering: {render_res.stderr}", flush=True)
        return False

    elapsed = time.time() - t1
    print(f"[{cid}] ✅ تم إنجاز المكالمة بنجاح ورندرها في {elapsed:.1f}ث! الحجم: {out_final.stat().st_size / 1024 / 1024:.1f} MB")
    
    # Clean up intermediate raw chunk
    try:
        raw_chunk.unlink(missing_ok=True)
        filter_script.unlink(missing_ok=True)
    except:
        pass

    return {
        "id": cid,
        "title": title,
        "topic": call_info["topic"],
        "raw_dur": raw_dur,
        "net_dur": net_dur,
        "format": orient_str,
        "out_file": str(out_final),
        "size_mb": round(out_final.stat().st_size / 1024 / 1024, 1)
    }

def main():
    print("==================================================================")
    print("🚀 بدء معالجة وتقطيع بث الحوار مع المخالفين كاملاً (8 مكالمات)")
    print(f"📁 مجلد الإخراج: {READY_BASE} (طولي / عرضي)")
    print("==================================================================")

    call_index = int(sys.argv[1]) if len(sys.argv) > 1 else None

    results = []
    for c in CALLS:
        if call_index is not None and c["id"] != call_index:
            continue
        res = cut_silence_for_call(c)
        if res:
            results.append(res)

    print("\n" + "="*70)
    print("🎉 ملخص إنجاز معالجة المكالمات:")
    print("="*70)
    for r in results:
        print(f"✔️ مكالمة {r['id']}: {r['title']}")
        print(f"   المدة الصافية: {r['net_dur']/60:.2f} دقيقة ({r['format']}) | الحجم: {r['size_mb']} MB")
        print(f"   المسار: {r['out_file']}")

    # Save summary manifest
    summary_path = ROOT / "render_work" / "debate_calls_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
