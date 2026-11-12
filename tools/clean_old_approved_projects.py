import os, glob

obsolete_prefixes = [
    "wars_kalaf",
    "tawaf_nisa",
    "wudu_awd",
    "khala_salah",
    "mawti_aqsam",
    "abdul_america",
    "tawaf_nawawi",
    "stream_julani_takfir",
    "stream_ifk_salul",
    "stream_sifat_sam3",
    "stream_iman_makhluq"
]

import json
# never delete a project that is still ACTIVE (registered by montage_guard start): another session lost a whole montage to this list (2026-11-06)
try:
    active = set(json.load(open(".tmp/active_montage.json", encoding="utf-8")).get("projects", []))
except Exception:
    active = set()
obsolete_prefixes = [p for p in obsolete_prefixes if p not in active and p != "abdul_america"]

print("=== Checking obsolete files ===")
for pfx in obsolete_prefixes:
    # specs
    for f in glob.glob(f"data/specs/{pfx}*.json"):
        print("Remove spec:", f)
        os.remove(f)
    # public
    for f in glob.glob(f"public/{pfx}*"):
        print("Remove public:", f)
        try:
            if os.path.isdir(f):
                import shutil
                shutil.rmtree(f)
            else:
                os.remove(f)
        except Exception as e:
            print("Error removing", f, e)
    # .tmp
    for f in glob.glob(f".tmp/**/{pfx}*", recursive=True):
        print("Remove tmp:", f)
        try:
            if os.path.isdir(f):
                import shutil
                shutil.rmtree(f)
            else:
                os.remove(f)
        except Exception as e:
            print("Error removing tmp", f, e)

print("Done cleaning files!")
