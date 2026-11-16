with open('src/MontageSpec.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'case\s+["\']hadith["\']', text)]
for m in matches:
    print(text[m:m+400])

