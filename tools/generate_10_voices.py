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

# Quote texts
text_with_tashkeel = "قَالَ عُمَرُ بْنُ الْخَطَّابِ: لَا، حَظَّ فِي الْإِسْلَامِ لِمَنْ تَرَكَ الصَّلَاةَ."
text_simple = "قال عمر بن الخطاب: لا، حظ في الإسلام لمن ترك الصلاة."

print("==================================================", flush=True)
print(" توليد 10 أصوات متنوعة من محركات الجهاز للاختيار ", flush=True)
print("==================================================", flush=True)

# -----------------------------------------------------------------------------
# Part 1: VoiceStudio (OmniVoice) Variations
# -----------------------------------------------------------------------------
print("\n>>> بدء محرك VoiceStudio (OmniVoice)...", flush=True)
sys.path.insert(0, r'S:\AI_Tools\VoiceStudio_Runtime\VoiceStudio\project')
import torch
import torchaudio
from omnivoice.models.omnivoice import OmniVoice

model_path = r'S:\AI_Tools\VoiceStudio_Runtime\models\models--k2-fsa--OmniVoice\snapshots\c5fdb5ccb189668d56333f77ba2629f4cd7535f4'
device = 'cuda' if torch.cuda.is_available() else 'cpu'

omni_model = OmniVoice.from_pretrained(model_path, device_map=device, dtype=torch.float16)

omni_variants = [
    (
        "01_فويس_ستوديو_وثائقي_منخفض.wav",
        "male, middle-aged, low pitch",
        0.85,
        138541875
    ),
    (
        "02_فويس_ستوديو_شيخ_وقور.wav",
        "male, elderly, low pitch",
        0.82,
        20261031
    ),
    (
        "03_فويس_ستوديو_وثائقي_رخيم_عميق.wav",
        "male, middle-aged, very low pitch",
        0.85,
        99887766
    ),
    (
        "04_فويس_ستوديو_معلق_هادئ.wav",
        "male, middle-aged, moderate pitch",
        0.85,
        44332211
    ),
    (
        "05_فويس_ستوديو_جهوري_قوي.wav",
        "male, low pitch",
        0.88,
        55667788
    )
]

with torch.no_grad():
    for filename, instruct, spd, sd in omni_variants:
        print(f"جاري توليد: {filename} (instruct: {instruct}, speed: {spd})...", flush=True)
        torch.manual_seed(sd)
        audios = omni_model.generate(
            text=text_simple,
            instruct=instruct,
            speed=spd,
            guidance_scale=2.2,
            num_step=32,
        )
        dest_local = os.path.join(local_dir, filename)
        dest_desktop = os.path.join(desktop_dir, filename)
        torchaudio.save(dest_local, audios[0].cpu(), omni_model.sampling_rate)
        shutil.copyfile(dest_local, dest_desktop)
        print(f"تم بنجاح -> {filename}", flush=True)

# Free VRAM from OmniVoice before running SILMA
del omni_model
torch.cuda.empty_cache()
print("تم تفريغ ذاكرة كرت الشاشة لمحرك SILMA.", flush=True)

# -----------------------------------------------------------------------------
# Part 2: SILMA AI (VoiceWorkflow) Variations
# -----------------------------------------------------------------------------
print("\n>>> بدء محرك SILMA AI (VoiceWorkflow)...", flush=True)
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
    print(f"جاري توليد: {filename} (speed: {spd})...", flush=True)
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

print("\n==================================================", flush=True)
print(f"اكتمل توليد الـ 10 أصوات بنجاح تام وحفظت على سطح المكتب في:")
print(desktop_dir, flush=True)
print("==================================================", flush=True)

