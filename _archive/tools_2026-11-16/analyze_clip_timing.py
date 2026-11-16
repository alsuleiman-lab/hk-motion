import json

def analyze_transcript(clip_name):
    print(f"\n=======================================================")
    print(f"FULL TRANSCRIPT TIMING FOR: {clip_name}")
    print(f"=======================================================")
    with open(f".tmp/{clip_name}_words.json", encoding="utf-8") as f:
        words = json.load(f)
    
    current_sentence = []
    sentence_start = 0
    for i, w in enumerate(words):
        if not current_sentence:
            sentence_start = w['s']
        current_sentence.append(w['w'])
        if any(p in w['w'] for p in ['.', '!', '؟', '،']) or w['e'] - sentence_start > 4.0:
            print(f"{sentence_start:6.2f} -> {w['e']:6.2f}: {' '.join(current_sentence)}")
            current_sentence = []
            
    if current_sentence:
        print(f"{sentence_start:6.2f} -> {words[-1]['e']:6.2f}: {' '.join(current_sentence)}")

analyze_transcript("s2_ashari_tifla")
analyze_transcript("s2_quburi_sahaba")
analyze_transcript("s2_shia_istislam")
