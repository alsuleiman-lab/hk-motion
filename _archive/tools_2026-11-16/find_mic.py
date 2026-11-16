import re

with open(r'C:\Users\mshms\AppData\Local\Programs\Antigravity IDE\resources\app\out\jetskiAgent\main.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pattern = re.compile(r'aria-label=["\'][^"\']*(?:mic|voice|record|audio)[^"\']*["\']', re.I)
for m in pattern.finditer(text):
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 250)
    print("=== Match ===")
    print(text[start:end])

