# python -I scratch/lab_probe/sheet.py → scratch/lab_probe/sheet_<o>_<section>.jpg : every still of a section in a grid, the id written above each
import json, os, sys, cv2, numpy as np

OUT = "scratch/lab_probe/out"
lab = json.load(open("data/elements_lab.json", encoding="utf8"))
only = set(sys.argv[1:])
for o, cols, cw in (("land", 4, 480), ("port", 6, 240)):
    for sec in ("text", "image", "move", "transition", "bg"):
        tiles = []
        for m in lab:
            if m.get("section") != sec or (only and m["id"] not in only):
                continue
            f = os.path.join(OUT, f"{o}_{m['id']}.jpg")
            if not os.path.exists(f):
                continue
            im = cv2.imread(f)
            h = int(im.shape[0] * cw / im.shape[1])
            im = cv2.resize(im, (cw, h), interpolation=cv2.INTER_AREA)
            lab_bar = np.full((26, cw, 3), 255, np.uint8)
            cv2.putText(lab_bar, f"{m['id']} [{m.get('mode')}:{m['slot'][o]}]", (4, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
            tiles.append(np.vstack([lab_bar, im]))
        if not tiles:
            continue
        th = max(t.shape[0] for t in tiles)
        tiles = [np.vstack([t, np.full((th - t.shape[0], cw, 3), 230, np.uint8)]) if t.shape[0] < th else t for t in tiles]
        while len(tiles) % cols:
            tiles.append(np.full((th, cw, 3), 230, np.uint8))
        rows = [np.hstack([np.pad(t, ((3, 3), (3, 3), (0, 0)), constant_values=200) for t in tiles[i:i + cols]]) for i in range(0, len(tiles), cols)]
        cv2.imwrite(f"scratch/lab_probe/sheet_{o}_{sec}.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
        print(o, sec, len(tiles))
