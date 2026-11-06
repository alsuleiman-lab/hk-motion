import glob
import json

def search_text(term):
    print(f"=== Searching for: '{term}' ===")
    files = glob.glob(".tmp/**/*.json", recursive=True)
    matches = []
    for fpath in files:
        if "face" in fpath: continue
        try:
            with open(fpath, encoding="utf-8") as f:
                content = f.read()
                if term in content:
                    print(f"FOUND IN: {fpath}")
                    data = json.loads(content)
                    if isinstance(data, list):
                        for item in data:
                            t = item.get("text", "") or item.get("w", "")
                            if term in t or any(term in str(v) for v in item.values()):
                                matches.append((fpath, item))
                    elif isinstance(data, dict):
                        segs = data.get("segments", [])
                        for s in segs:
                            if term in s.get("text", ""):
                                matches.append((fpath, s))
        except Exception as e:
            pass
    return matches

for term in ["كافر بدينك", "بدينك", "أنا كافر", "دينك"]:
    res = search_text(term)
    if res:
        print(f"Total matches for '{term}': {len(res)}")
        for fpath, m in res[:10]:
            print(f"  [{fpath}] {m.get('start', m.get('s', ''))} -> {m.get('end', m.get('e', ''))}: {m.get('text', m.get('w', ''))}")
        break
