import re

with open(r'C:\Users\mshms\AppData\Local\Programs\Antigravity IDE\resources\app\out\jetskiAgent\main.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Look for tooltip or title or icon related to mic
for term in ['Microphone', 'Record audio', 'Voice input', 'speech-to-text', 'MicOff', 'MicOn', 'AudioInput']:
    idx = 0
    while True:
        pos = text.lower().find(term.lower(), idx)
        if pos == -1:
            break
        print(f"=== Found '{term}' at {pos} ===")
        print(text[max(0, pos-100):min(len(text), pos+200)])
        idx = pos + len(term)
        if idx > pos + 1000:
            break

