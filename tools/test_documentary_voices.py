# -*- coding: utf-8 -*-
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

out_dir = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\doc_tests"
os.makedirs(out_dir, exist_ok=True)

# Test 1: SILMA AI with Nazih Al-Ahdab documentary reference
print("=== 1. Generating SILMA with Nazih Al-Ahdab Documentary Reference ===", flush=True)
os.environ["HF_HOME"] = r"S:\AI_Tools\VoiceWorkflow\.silma-models"
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.path.insert(0, r"S:\AI_Tools\VoiceWorkflow")
from silma_worker import import_silma

SilmaTTS = import_silma()
model_silma = SilmaTTS(enable_normalizer=False, force_tashkeel=False)

ref_file = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\ref_nazih.wav"
ref_text = "أتباع فوزي الكركري يبلغون الآن نحو مليوني مريد ينتشرون في مصر"
quote_text = "قَالَ عُمَرُ بْنُ الْخَطَّابِ: لَا، حَظَّ فِي الْإِسْلَامِ لِمَنْ تَرَكَ الصَّلَاةَ."

silma_out = os.path.join(out_dir, "silma_nazih_documentary.wav")
model_silma.infer(
    ref_file=ref_file,
    ref_text=ref_text,
    gen_text=quote_text,
    file_wave=silma_out,
    normalize_numbers=False,
    force_tashkeel=False,
    speed=0.78,
    cfg_strength=2.2
)
print("Saved SILMA documentary to:", silma_out, flush=True)

