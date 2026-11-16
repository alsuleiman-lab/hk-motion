import json

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Filter out the hallucinated tail
valid_segs = [s for s in segs if s["start"] < 3800]

print(f"Total valid speech segments: {len(valid_segs)}")

# Let's inspect where calls start and end:
# Call 1: 149s -> ~970s (Ash'ari caller debating about Tahawi, whether Allah is in a direction, and the Sheikh refutes him with the comparison to a dog!)
# Let's check segments between 600s and 950s!
# Call 2: 974s -> 1030s (Supporter / quick greeting)
# Call 3: 1038s -> 1130s (Question about debate with Ash'aris)
# Call 4: 1140s -> ~2490s (Ash'ari / Maturidi or Mu'tazili debating Allah's descent, whether Allah is inside the world or outside, and interpretation of verses)
# Call 5: 2495s -> 3150s (Sufi / Grave worshipper debating building over graves, the tomb of Abu Basir, the expansion of the Prophet's mosque)
# Call 6: 3152s -> 3588s (Shi'ite caller debating Allah's laughter and anger, quoting Bihar al-Anwar and Mustadrak al-Wasa'il, ended with caller saying "أنا أستسلم"!)
# Call 7: 3588s -> 3795s (Supporter Abu Nasser discussing debate with Ash'aris)

print("\n--- Let's inspect the juicy clashes in Call 1 (149s - 970s) ---")
for s in valid_segs:
    if 650 <= s["start"] <= 920:
        print(f"[{s['start']:6.1f}s]: {s['text']}")

print("\n--- Let's inspect Call 4 (1140s - 1800s) ---")
for s in valid_segs:
    if 1250 <= s["start"] <= 1450:
        print(f"[{s['start']:6.1f}s]: {s['text']}")

print("\n--- Let's inspect Call 5 (2495s - 3150s) ---")
for s in valid_segs:
    if 2550 <= s["start"] <= 2850:
        print(f"[{s['start']:6.1f}s]: {s['text']}")

print("\n--- Let's inspect Call 6 (3152s - 3588s) ---")
for s in valid_segs:
    if 3200 <= s["start"] <= 3450:
        print(f"[{s['start']:6.1f}s]: {s['text']}")

