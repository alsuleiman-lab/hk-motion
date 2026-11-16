import json

segments = json.load(open('.tmp/stream_full_segments.json', encoding='utf-8'))

def inspect(t0, t1, title):
    print(f"\n==================== {title} [{t0//60:02d}:{t0%60:02d} to {t1//60:02d}:{t1%60:02d}] ====================")
    lines = []
    for s in segments:
        if t0 <= s['s'] <= t1:
            m, sc = divmod(int(s['s']), 60)
            lines.append(f"[{m:02d}:{sc:02d}] {s['text']}")
    print("\n".join(lines))

inspect(2680, 2880, "CANDIDATE 1: Caller Trapped: 'ممكن يكون عرش'")
inspect(4150, 4400, "CANDIDATE 2: Takfiri & Ahmad al-Sharaa: 'تتمضحك'")
inspect(1770, 2030, "CANDIDATE 3: Yasaq & Genghis Khan (29m - 33m)")
inspect(3000, 3300, "CANDIDATE 4: Stream 50m - 55m")

