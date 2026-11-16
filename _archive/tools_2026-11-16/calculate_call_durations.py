import json

with open(r"temp_debate\vad.json", "r", encoding="utf-8") as f:
    vad_data = json.load(f)

gaps = vad_data["gaps"] # [start, duration]

# Calls definitions based on transcript boundaries:
# Note: include the greetings and natural wrap-up of each call
calls = [
    {
        "id": 1,
        "caller": "المتصل الأول (مناقشة صفة العلم والسمع والبصر هل هما علمان)",
        "start": 56.5,
        "end": 1279.0
    },
    {
        "id": 2,
        "caller": "المتصل الثاني (الشفاعة في الحدود وحكم المرتد وقصة ابن أبي سرح)",
        "start": 1328.0,
        "end": 1775.0
    },
    {
        "id": 3,
        "caller": "المتصل الثالث (الحاكمية وتكفير الحكام والقوانين الوضعية)",
        "start": 1778.0,
        "end": 2144.0
    },
    {
        "id": 4,
        "caller": "المتصل الرابع (علم الله الأزلي وعلمه عند وقوع الشيء)",
        "start": 2146.0,
        "end": 2680.0
    },
    {
        "id": 5,
        "caller": "المتصل الخامس (حديث الأطيط والجلوس على الكرسي والاستواء)",
        "start": 2699.0,
        "end": 2907.0
    },
    {
        "id": 6,
        "caller": "المتصل السادس (أبو موسى - مناقشة مفصلة في السلفية والأثرية وتكفير الأشاعرة)",
        "start": 2908.0,
        "end": 4402.0
    },
    {
        "id": 7,
        "caller": "المتصل السابع (متصل أشعري - مناقشة صفات الله والوجود والفاصل بين الخالق والمخلوق)",
        "start": 4402.0,
        "end": 4991.0
    },
    {
        "id": 8,
        "caller": "المتصل الثامن (منهج السلف ومسائل خلق القرآن وتكفير المأمون وأخذ العلم)",
        "start": 4993.0,
        "end": 5693.0
    }
]

KEEP = 0.25
MIN_SILENCE = 0.40

for c in calls:
    st = c["start"]
    et = c["end"]
    raw_dur = et - st
    
    # Gaps inside this call
    call_gaps = []
    removed_silence = 0.0
    for g_st, g_dur in gaps:
        g_en = g_st + g_dur
        # Check overlap with call window
        if g_en <= st or g_st >= et:
            continue
        # Clamped gap inside call
        o_st = max(st, g_st)
        o_en = min(et, g_en)
        o_dur = o_en - o_st
        if o_dur > MIN_SILENCE:
            to_remove = o_dur - KEEP
            removed_silence += to_remove
            call_gaps.append((o_st, o_dur))
            
    net_dur = raw_dur - removed_silence
    c["raw_dur"] = round(raw_dur, 2)
    c["net_dur"] = round(net_dur, 2)
    c["removed_silence"] = round(removed_silence, 2)
    c["format"] = "طولي (Vertical 9:16)" if net_dur < 120.0 else "عرضي (Horizontal 16:9)"

with open(r"temp_debate\call_durations_summary.json", "w", encoding="utf-8") as out:
    json.dump(calls, out, ensure_ascii=False, indent=2)

print("Call durations summary:")
for c in calls:
    print(f"Call {c['id']}: Raw {c['raw_dur']/60:.1f}m -> Net {c['net_dur']/60:.1f}m ({c['net_dur']}s) => {c['format']}")

