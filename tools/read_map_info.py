import json

with open("public/s2_ashari_kufr_deen_map.json", encoding="utf-8") as f:
    d = json.load(f)
    print("Map keys:", d.keys() if isinstance(d, dict) else len(d))
    if isinstance(d, dict):
        print("duration:", d.get("duration"))
        print("cuts count:", len(d.get("cuts", [])))
        print("segments count:", len(d.get("segments", [])))

