import json

with open(r"C:\Users\mshms\.gemini\antigravity\brain\46bb4036-61da-4916-b2fa-b0f9b667a86b\.system_generated\logs\transcript.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        idx = data.get("step_index")
        if idx in range(1300, 1315) or idx in range(1595, 1605):
            print(f"=== Step {idx} ({data.get('source')}, {data.get('type')}) ===")
            content = data.get("content")
            if content:
                print(content[:400])

