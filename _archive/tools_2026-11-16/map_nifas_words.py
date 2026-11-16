import json

with open(r'S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\words.json', 'r', encoding='utf-8') as f:
    orig_words = json.load(f)

with open(r'S:\AI_Tools\Remotion_Workspace\public\nifas_40_map.json', 'r', encoding='utf-8') as f:
    cut_map = json.load(f)

segments = cut_map['segments']
# Raw video was extracted from 24.0s of original video
RAW_OFFSET = 24.0

def map_time(t_orig):
    t_raw = t_orig - RAW_OFFSET
    for seg in segments:
        if seg['a'] <= t_raw <= seg['b']:
            return round(seg['n'] + (t_raw - seg['a']), 2)
    # If in a cut silence, find nearest
    for i, seg in enumerate(segments):
        if t_raw < seg['a']:
            return round(seg['n'], 2)
    return round(cut_map['duration'], 2)

cut_words = []
for w in orig_words:
    # Filter words belonging to this clip
    if 24.0 <= w['s'] <= 504.0:
        new_s = map_time(w['s'])
        new_e = map_time(w['e'])
        if new_e > new_s:
            cut_words.append({
                's': new_s,
                'e': new_e,
                'w': w['w'],
                'p': w['p']
            })

with open(r'S:\AI_Tools\Remotion_Workspace\public\nifas_40_words.json', 'w', encoding='utf-8') as f:
    json.dump(cut_words, f, ensure_ascii=False, indent=2)

print(f"Mapped {len(cut_words)} words to cut timeline (duration: {cut_map['duration']}s)")
print("First word:", cut_words[0])
print("Last word:", cut_words[-1])

