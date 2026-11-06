import json

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

def print_range(t_start, t_end):
    for s in segs:
        if t_start <= s["start"] <= t_end:
            print(f"[{s['start']:6.1f}s -> {s['end']:6.1f}s] {s['text']}")

print("=== REEL 1 BOUNDS (Ash'ari dog comparison roast) ===")
# Caller starts the syllogism around 657s - 685s
# Ends around 880s - 915s
print_range(655, 715)
print("...")
print_range(865, 915)

print("\n=== REEL 2 BOUNDS (Ash'ari daughter & descent roast) ===")
# Starts around 1150s (أين الله عندك)
# Ends around 1300s (قادر على أن ينزل ولا يكون محدودا) or 1450s (فستكون خارجيا)
print_range(1150, 1205)
print("...")
print_range(1255, 1305)

print("\n=== REEL 3 BOUNDS (Grave worshipper slandering Sahaba) ===")
# Starts around 2950s (هل الصحابة الذين اقترحوا كانوا يعلمون هذا الحديث)
# Ends around 3148s (ثم أنت تقلل أدبك مع صحابة النبي صلى الله عليه وسلم)
print_range(2950, 3010)
print("...")
print_range(3115, 3152)

print("\n=== REEL 4 BOUNDS (Shi'ite caller surrender) ===")
# Starts around 3335s (هل غضب الله عندك هو فرحه... علي بن أبي طالب يثبت الضحك)
# Ends around 3588s (جميل يا شيخ أنا أستسلم وأشكرك... أهلا وسهلا بك)
print_range(3333, 3385)
print("...")
print_range(3555, 3590)

