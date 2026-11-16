with open('src/MontageSpec.tsx', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'case "(full|tphoto|scholar|pic)":', text):
    start = m.start()
    print("--------------------------------------------------")
    print(text[start:start+400])

