with open('src/Root.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'<Composition\s+id=[\'"]([^\'"]+)[\'"]', text)
print('Existing compositions:', len(matches))
for m in matches[-15:]:
    print('-', m)

