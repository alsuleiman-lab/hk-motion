import json

def summarize(name):
    path = f".tmp/{name}_words.json"
    try:
        with open(path, "r", encoding="utf-8") as f:
            words = json.load(f)
        txt = " ".join(w["w"] for w in words)
        print(f"\n=== {name} ({len(words)} words, duration {words[-1]['e']:.1f}s) ===")
        print(f"Start: {txt[:200]}")
        print("...")
        print(f"End: {txt[-200:]}")
    except Exception as e:
        print(f"Error {name}: {e}")

summarize("s2_ashari_kalb")
summarize("s2_ashari_tifla")
summarize("s2_quburi_sahaba")
summarize("s2_shia_istislam")
