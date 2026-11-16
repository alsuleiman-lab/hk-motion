with open('src/MontageSpec.tsx', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'full', text):
    start = m.start()
    print("--------------------------------------------------")
    print(text[max(0, start-50):start+250])

