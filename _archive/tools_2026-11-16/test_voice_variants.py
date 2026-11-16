# -*- coding: utf-8 -*-
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure HF_HOME points to silma models
os.environ["HF_HOME"] = r"S:\AI_Tools\VoiceWorkflow\.silma-models"
os.environ["PYTHONIOENCODING"] = "utf-8"

sys.path.insert(0, r"S:\AI_Tools\VoiceWorkflow")
from silma_worker import import_silma

SilmaTTS = import_silma()
print("Loading SilmaTTS (force_tashkeel=False)...", flush=True)
model = SilmaTTS(enable_normalizer=False, force_tashkeel=False)

ref_file = r"S:\AI_Tools\Remotion_Workspace\render_work\ref_sheikh.wav"
ref_text = "وزارة الثقافة التي من المفترض أن تعبر عن ثقافة الشعب السوري"

out_dir = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\voice_tests"
os.makedirs(out_dir, exist_ok=True)

tests = [
    (
        "var1_comma",
        "قَالَ عُمَرُ بْنُ الْخَطَّابِ: لَا، حَظَّ فِي الْإِسْلَامِ لِمَنْ تَرَكَ الصَّلَاةَ.",
        0.82
    ),
    (
        "var2_nocomma",
        "قَالَ عُمَرُ بْنُ الْخَطَّابِ: لَا حَظَّ فِي الْإِسْلَامِ لِمَنْ تَرَكَ الصَّلَاةَ.",
        0.82
    ),
    (
        "var3_pause",
        "قَالَ عُمَرُ بْنُ الْخَطَّابِ.\nلَا حَظَّ فِي الْإِسْلَامِ لِمَنْ تَرَكَ الصَّلَاةَ.",
        0.80
    )
]

for name, text, spd in tests:
    wav_path = os.path.join(out_dir, f"{name}.wav")
    print(f"\n--- Generating {name} ---", flush=True)
    print(f"Text: {text}", flush=True)
    model.infer(
        ref_file=ref_file,
        ref_text=ref_text,
        gen_text=text,
        file_wave=wav_path,
        normalize_numbers=False,
        force_tashkeel=False,
        speed=spd,
        cfg_strength=2.2
    )
    print(f"Saved to {wav_path}", flush=True)

print("\nAll variations generated successfully!", flush=True)

