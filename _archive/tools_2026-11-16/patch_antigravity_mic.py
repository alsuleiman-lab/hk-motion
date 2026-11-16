import os

p = r'C:\Users\mshms\AppData\Local\Programs\Antigravity IDE\resources\app\extensions\agy\vscode\extension.js'
with open(p, 'r', encoding='utf-8') as f:
    text = f.read()

target1 = 'm.set("enableMicrophone","false")'
repl1 = 'm.set("enableMicrophone","true")'

target2 = 'allow="clipboard-read; clipboard-write"'
repl2 = 'allow="clipboard-read; clipboard-write; microphone"'

if target1 in text and target2 in text:
    text = text.replace(target1, repl1, 1)
    text = text.replace(target2, repl2, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS: Patched enableMicrophone and iframe allow microphone!')
else:
    print('FAILED: target1 found:', target1 in text, 'target2 found:', target2 in text)

