with open(r'C:\Users\mshms\AppData\Local\Programs\Antigravity IDE\resources\app\out\jetskiAgent\main.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = 8716682
print(text[idx-1000:idx+1000])

