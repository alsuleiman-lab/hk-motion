import json

def find_cues(name, keywords):
    with open(f'public/{name}_words.json', 'r', encoding='utf-8') as f:
        words = json.load(f)
    print(f'=== CUES FOR {name} ===')
    for kw in keywords:
        matches = [w for w in words if kw in w['w']]
        for m in matches[:3]:
            print(f"  [{kw}]: s={m['s']:.2f}, e={m['e']:.2f}, word=\"{m['w']}\"")

find_cues('wars_kalaf', ['قالت', 'نطلي', 'الكلف', 'تصبغ', 'الميلانين', 'الورس', 'السمسم', 'الزعفران', 'علاج'])
find_cues('tawaf_nisa', ['فلانية', 'العدل', 'باطل', 'أعدل', 'غزوة', '11', 'حق'])
find_cues('wudu_awd', ['يعود', 'هناد', 'سعيد', 'أتى', 'الوضوء', 'اللغوي', 'الشرعي', 'خزيمة', 'بارد', 'استحباب'])
find_cues('khala_salah', ['الخلا', 'الجماعة', 'واجبة', 'البر', 'الطمأنينة', 'ركن', 'القلب', 'عائشة', 'الأخبثان'])
find_cues('mawti_aqsam', ['يصيب', 'الغسل', 'إجماع', 'الرطبة', 'اليابسة', 'قذر', 'أعيدها'])

