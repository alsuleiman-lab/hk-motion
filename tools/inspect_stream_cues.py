import json

def get_text_and_cues(cid, keywords):
    with open(f'public/{cid}_words.json', 'r', encoding='utf-8') as f:
        words = json.load(f)
    text = ' '.join(w['w'] for w in words)
    print(f'=== {cid} ({len(words)} words, dur={words[-1]["e"]}s) ===')
    print('TEXT:', text[:350] + '...\n')
    print('KEY CUES:')
    for kw in keywords:
        matches = [w for w in words if kw in w['w']]
        for m in matches[:2]:
            print(f'  [{kw}]: {m["s"]}s -> {m["e"]}s ("{m["w"]}")')
    print()

get_text_and_cues('stream_ifk_salul', ['الشفاعة', 'الإفك', 'سلول', 'منافق', 'فتنة', 'الضرر', 'يزال'])
get_text_and_cues('stream_sifat_sam3', ['السمع', 'البصر', 'العلم', 'ثلاثة', 'تشغب', 'سيكون'])
get_text_and_cues('stream_iman_makhluq', ['الإيمان', 'مخلوق', 'كفر', 'أحمد', 'البخاري', 'أفعال', 'القرآن'])

