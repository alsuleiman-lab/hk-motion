# Arabic named entities over a word-timed transcript (user 2026-11-11: «من البداية تشتغل صح: مدن، أماكن… يلزمك مكتبات نزّل»).
#   python tools/ner_scan.py <words.json> <out.json>
# words.json = [{w, s, e}, …]. Runs CAMeL-Lab/bert-base-arabic-camelbert-msa-ner (LOC / PERS / ORG / MISC) on windows of ~40 words
# (overlapping by 10) and maps every entity back to the time of its first word. Output: [{type, text, s, e, score}, …] (deduplicated).
import json, sys
from transformers import pipeline

src, out = sys.argv[1], sys.argv[2]
W = json.load(open(src, encoding="utf-8"))
ner = pipeline("ner", model="CAMeL-Lab/bert-base-arabic-camelbert-msa-ner", aggregation_strategy="simple", device=0)
STEP, SIZE = 30, 40
found = {}
for a in range(0, max(1, len(W)), STEP):
    win = W[a:a + SIZE]
    if not win: break
    text, starts = "", []
    for w in win:
        starts.append(len(text)); text += str(w["w"]).strip() + " "
    for ent in ner(text):
        if ent["score"] < 0.6: continue
        st, en = ent["start"], ent["end"]
        i0 = max(i for i, c in enumerate(starts) if c <= st)
        i1 = max(i for i, c in enumerate(starts) if c < en)
        # whole words (the tokenizer splits prefixes: «بالهند» → «الهند»)
        span = win[i0:i1 + 1]
        surface = " ".join(str(x["w"]).strip() for x in span)
        key = (ent["entity_group"], round(span[0]["s"], 1))
        if key not in found or found[key]["score"] < ent["score"]:
            found[key] = {"type": ent["entity_group"], "text": surface, "core": text[st:en].strip(), "s": span[0]["s"], "e": span[-1].get("e", span[-1]["s"]), "score": round(float(ent["score"]), 3)}
res = sorted(found.values(), key=lambda x: x["s"])
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"ner_scan: {len(res)} entities → {out}")
