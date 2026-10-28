import subprocess
import os
import sys

SOURCE = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8\source.mp4"
PUB = r"s:\AI_Tools\Remotion_Workspace\public"
WORK = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8"

os.makedirs(PUB, exist_ok=True)
os.makedirs(WORK, exist_ok=True)

def run_cmd(cmd):
    print("Running:", cmd)
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"Error running cmd: {res.returncode}")
        sys.exit(res.returncode)

# -------------------------------------------------------------
# CLIP 1: سراج يرد على نفسه (الشمس)
# Segments:
# 1) 1504.0 - 1512.2 (سراج يتحدى: هل تعتقد أن الشمس تتوقف عن الجريان نعم أم لا؟)
# 2) 1653.0 - 1657.8 (الشيخ: اسمعوا يا إخوة إيش رح أجيب لكم الآن...)
# 3) 1724.8 - 1730.0 (الشيخ: لما ادعى الإسلام ها هو كان يرد على الملحدين... خلينا نسمع رده!)
# 4) 1746.2 - 1756.2 (سراج القديم: وهذا الادعاء لا يستقيم بل هو ادعاء سقيم...)
# 5) 1761.0 - 1782.5 (سراج القديم: ففي الحديث لا يوجد أي إشارة لأن الشمس تتوقف عن الجريان بل فقط يوم القيامة...)
# 6) 1802.5 - 1813.2 (سراج القديم: فليس في الحديث أنها تتوقف الآن أو تتوقف كل يوم... أما أنها تسجد فلا يقتضي توقفها...)
# 7) 1839.0 - 1842.3 (سراج القديم: ولا يفهم ذلك أحد فيه ذرة عقل!)
# 8) 1842.3 - 1846.0 (الشيخ: شكل العقل راح لما رجعت للإلحاد!)
# 9) 1784.8 - 1788.0 (الشيخ: نسيت هالمعلومة شكلك لما رجعت للإلحاد؟ ذكرتها لما كنت منافق فقط؟)
# 10) 1888.2 - 1890.2 (الشيخ: شفت شلون لما يكون واحد يفهم؟)
# 11) 1901.8 - 1906.5 (سراج: سجل إجابتي إنه هذا خارج محل النزاع!)
# -------------------------------------------------------------
c1_cuts = [
    (1504.0, 1512.2),
    (1653.0, 1657.8),
    (1724.8, 1730.0),
    (1746.2, 1756.2),
    (1761.0, 1782.5),
    (1802.5, 1813.2),
    (1839.0, 1842.3),
    (1842.3, 1846.0),
    (1784.8, 1788.0),
    (1888.2, 1890.2),
    (1901.8, 1906.5),
]

def render_cut(cuts, out_path):
    # Build filter_complex for seamless cut and join
    inputs = ""
    filter_parts = []
    for i, (st, en) in enumerate(cuts):
        dur = en - st
        inputs += f" -ss {st} -t {dur} -i \"{SOURCE}\""
        filter_parts.append(f"[{i}:v:0][{i}:a:0]")
    
    n = len(cuts)
    fc = "".join(filter_parts) + f"concat=n={n}:v=1:a=1[outv][outa]"
    cmd = f'ffmpeg -y {inputs} -filter_complex "{fc}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k "{out_path}"'
    run_cmd(cmd)

print("Cutting Clip 1...")
c1_out = os.path.join(PUB, "stream_clip1_sun.mp4")
render_cut(c1_cuts, c1_out)

# -------------------------------------------------------------
# CLIP 2: التعدد ومصادر الدخل
# Segments:
# 1) 8657.0 - 8666.0 (السؤال: مو ناوي تعدد؟ الشيخ: إيش دخل الموضوع نحن عم نحكي على شبهات الملاحدة...)
# [Skip Fajr Ad: 8666 - 8696.6]
# 2) 8696.6 - 8776.5 (الشيخ: ليش تنامون برة يعني عادي... اللي ما يعدد غلطان... تعدد مصادر دخلك... التعدد زين!)
# 3) 8785.0 - 8793.5 (الشيخ يضحك: طيب هذا خارج الموضوع طلعتونا عن الموضوع خلونا نعود للموضوع الأساسي!)
# -------------------------------------------------------------
c2_cuts = [
    (8657.0, 8666.0),
    (8696.6, 8776.5),
    (8785.0, 8793.5),
]

print("Cutting Clip 2...")
c2_out = os.path.join(PUB, "stream_clip2_taaddud.mp4")
render_cut(c2_cuts, c2_out)

# -------------------------------------------------------------
# CLIP 3: هل تشرق الشمس أم تشرق الأرض؟
# 7015.5 - 7107.0 (الشيخ: طلعت الشمس وغربت... بالإنجليزية Sunrise... إلخ)
# -------------------------------------------------------------
c3_cuts = [
    (7015.5, 7107.0)
]

print("Cutting Clip 3...")
c3_out = os.path.join(PUB, "stream_clip3_sunrise.mp4")
render_cut(c3_cuts, c3_out)

# -------------------------------------------------------------
# CLIP 4: المخلوق الوحيد فوق العرش
# 7114.7 - 7180.5 (الشيخ: كتاب إن رحمتي سبقت غضبي... وجلوس النبي صلى الله عليه وسلم...)
# -------------------------------------------------------------
c4_cuts = [
    (7114.7, 7180.5)
]

print("Cutting Clip 4...")
c4_out = os.path.join(PUB, "stream_clip4_throne.mp4")
render_cut(c4_cuts, c4_out)

print("All 4 clips cut successfully!")
