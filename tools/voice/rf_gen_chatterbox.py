# -*- coding: utf-8 -*-
# THE RECITATION-FIX VOICE (user's choice 2026-11-21, gta6 «ستة. جيد… أضيفه للموتور»): Chatterbox multilingual (ResembleAI, local, t3 v3),
# zero-shot from HIS OWN recitation just before the wrong words. Called by tools/recitation_fix.mjs; run with the Chatterbox venv:
#   S:\AI_Tools\VoiceWorkflow\.chatterbox-venv\Scripts\python.exe tools/voice/rf_gen_chatterbox.py <job.json>
# job: ref (wav made by the caller from the cut audio), to (the correct words with tashkeel), seeds, exaggeration, cfg, dir.
# Writes <dir>/raw_s<seed>.wav for each seed. The chosen setting on gta6: exaggeration 0.4, cfg 0.3, seed 23.
import inspect
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
os.environ.setdefault("HF_HOME", r"S:\AI_Tools\VoiceWorkflow\.chatterbox-models")
os.environ.setdefault("HF_HUB_OFFLINE", "1")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rf_common import job  # noqa: E402

J = job(sys.argv[1])
import torch  # noqa: E402
import torchaudio  # noqa: E402
from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # noqa: E402

text = J["to"]
try:  # the mandatory Arabic text pipeline (skill arabic-tts-pronunciation): full tashkeel + pausal form
    sys.path.insert(0, os.path.expanduser(r"~\.claude\skills\arabic-tts-pronunciation"))
    from tts_text import prepare_for_tts
    text = prepare_for_tts(text)
except Exception as e:  # noqa: BLE001
    print("prepare_for_tts unavailable, text used as given:", repr(e)[:120], flush=True)
# the bundled multilingual tokenizer drops hamza-bearing alefs (VoiceWorkflow/chatterbox_worker.py): plain alef
text = text.translate(str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا"}))
print("TEXT:", text, flush=True)
kw = {"t3_model": "v3"} if "t3_model" in inspect.signature(ChatterboxMultilingualTTS.from_pretrained).parameters else {}
m = ChatterboxMultilingualTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu", **kw)
for sd in J["seeds"]:
    torch.manual_seed(int(sd))
    a = m.generate(text, language_id="ar", audio_prompt_path=J["ref"], exaggeration=float(J["exaggeration"]), cfg_weight=float(J["cfg"]))
    out = os.path.join(J["dir"], f"raw_s{sd}.wav")
    torchaudio.save(out, a.detach().cpu(), m.sr)
    print("GEN", out, round(a.shape[-1] / m.sr, 2), flush=True)
