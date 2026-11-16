# -*- coding: utf-8 -*-
import sys
import os
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

desktop_dir = r"C:\Users\mshms\Desktop\أصوات_المشهد_للاختيار"
local_dir = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\اختر_الصوت"
os.makedirs(desktop_dir, exist_ok=True)
os.makedirs(local_dir, exist_ok=True)

os.environ["HF_HOME"] = r"S:\AI_Tools\VoiceWorkflow\.silma-models"
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.path.insert(0, r"S:\AI_Tools\VoiceWorkflow")
from silma_worker import import_silma

SilmaTTS = import_silma()
silma_model = SilmaTTS(enable_normalizer=False, force_tashkeel=False)

ref_sheikh = r"S:\AI_Tools\Remotion_Workspace\render_work\ref_sheikh.wav"
ref_sheikh_text = "وزارة الثقافة التي من المفترض أن تعبر عن ثقافة الشعب السوري"

ref_nazih = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\ref_nazih.wav"
ref_nazih_text = "أتباع فوزي الكركري يبلغون الآن نحو مليوني مريد ينتشرون في مصر"

text_with_tashkeel = "قَالَ عُمَرُ بْنُ الْخَطَّابِ: لَا، حَظَّ فِي الْإِسْلَامِ لِمَنْ تَرَكَ الصَّلَاةَ."

silma_variants = [
    (
        "06_سيلمـا_وثائقي_نزيه_الأحدب_فخم.wav",
        ref_nazih,
        ref_nazih_text,
        text_with_tashkeel,
        0.82
    ),
    (
        "07_سيلمـا_وثائقي_نزيه_هادئ_جداً.wav",
        ref_nazih,
        ref_nazih_text,
        text_with_tashkeel,
        0.75
    ),
    (
        "08_سيلمـا_إلقاء_عربي_فصيح_متأنٍ.wav",
        ref_sheikh,
        ref_sheikh_text,
        text_with_tashkeel,
        0.82
    ),
    (
        "09_سيلمـا_إلقاء_بطيء_وقور_للأثر.wav",
        ref_sheikh,
        ref_sheikh_text,
        text_with_tashkeel,
        0.74
    ),
    (
        "10_سيلمـا_وثائقي_مسرّع_خفيف_1.1x.wav",
        ref_nazih,
        ref_nazih_text,
        text_with_tashkeel,
        0.90
    )
]

for filename, rf, rft, gt, spd in silma_variants:
    print(f"جاري توليد: {filename}...", flush=True)
    dest_local = os.path.join(local_dir, filename)
    dest_desktop = os.path.join(desktop_dir, filename)
    silma_model.infer(
        ref_file=rf,
        ref_text=rft,
        gen_text=gt,
        file_wave=dest_local,
        normalize_numbers=False,
        force_tashkeel=False,
        speed=spd,
        cfg_strength=2.2
    )
    shutil.copyfile(dest_local, dest_desktop)
    print(f"تم بنجاح -> {filename}", flush=True)

print("اكتملت أصوات SILMA الخمسة بنجاح!", flush=True)

