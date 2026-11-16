import json

def check_clip(clip_name, spec_file):
    print(f"\n=======================================================")
    print(f"=== {clip_name} ===")
    print(f"=======================================================")
    with open(f".tmp/{clip_name}_words.json", encoding="utf-8") as f:
        words = json.load(f)
    with open(f"data/specs/{spec_file}.json", encoding="utf-8") as f:
        spec = json.load(f)
    
    items = spec.get("items", [])
    for it in items:
        t = it.get("t")
        at = it.get("at", 0)
        until = it.get("until", 0)
        text = it.get("text", "")
        # find what words are spoken around 'at'
        spoken_at = [w['w'] for w in words if abs(w['s'] - at) < 1.5 or (w['s'] <= at <= w['e'])]
        print(f"Item [{t}] at={at:.1f}s until={until:.1f}s: '{text}'")
        print(f"   --> Words spoken around {at:.1f}s: {' '.join(spoken_at[:10])}")

check_clip("s2_ashari_kalb", "s2_ashari_kalb_reel")
check_clip("s2_ashari_tifla", "s2_ashari_tifla_reel")
check_clip("s2_quburi_sahaba", "s2_quburi_sahaba_reel")
check_clip("s2_shia_istislam", "s2_shia_istislam_reel")
