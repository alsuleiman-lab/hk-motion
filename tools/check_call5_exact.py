import json

with open(r"temp_debate\vad.json", "r", encoding="utf-8") as f:
    vad_data = json.load(f)

# Let's inspect all speech segments in Call 5 (2699.9 to 2907.4)
sp = vad_data["speech"]
call5_sp = []
for s, e in sp:
    if e > 2699.9 and s < 2907.4:
        call5_sp.append([max(2699.9, s), min(2907.4, e)])

total_speech = sum(e - s for s, e in call5_sp)
print(f"Call 5 total pure speech: {total_speech:.2f}s ({total_speech/60:.2f} min)")
print(f"Number of speech segments: {len(call5_sp)}")

# If we keep 0.25s padding between speech segments:
net_with_gaps = 0
for i in range(len(call5_sp)):
    s, e = call5_sp[i]
    dur = e - s
    net_with_gaps += dur
    if i < len(call5_sp) - 1:
        next_s = call5_sp[i+1][0]
        actual_gap = next_s - e
        net_with_gaps += min(actual_gap, 0.25)

print(f"Call 5 net duration with 0.25s shortened gaps: {net_with_gaps:.2f}s")

