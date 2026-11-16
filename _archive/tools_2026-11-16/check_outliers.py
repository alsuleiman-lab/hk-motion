import json

with open('.tmp/face_analysis/face_stats.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for clip_name, samples in data.items():
    print(f'=== Outliers in {clip_name} ===')
    outliers = []
    for s in samples:
        for f in s['faces']:
            if f['w'] >= 100 and (f['cx'] < 700 or f['cx'] > 1200):
                outliers.append((s['sec'], f['cx'], f['cy'], f['w'], f['h']))
    print(f'Count: {len(outliers)}')
    for sec, cx, cy, w, h in outliers[:10]:
        print(f'  t={sec}s, cx={cx}, cy={cy}, w={w}, h={h}')

