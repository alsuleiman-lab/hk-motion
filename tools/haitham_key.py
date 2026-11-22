# يحوّل صور النقش المولّدة (على ورق كريمي) إلى PNG شفاف الخلفية بإزالة الورق المتصل بالحافة فقط (موشن هيثم):
# الداخل الفاتح (بياض عين، لمعة) يبقى معتماً، وظل الرسم يتلاشى بنعومة. bg* يُحفظ كما هو بحجم اللوحة.
#   python tools/haitham_key.py <مجلد الخام> <مجلد الناتج> [--size 640]
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, out = sys.argv[1], sys.argv[2]
size = int(sys.argv[sys.argv.index("--size") + 1]) if "--size" in sys.argv else 640
os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.lower().endswith(".png"): continue
    im = Image.open(os.path.join(src, f)).convert("RGB")
    if f.startswith("bg"):
        im.resize((1080, 1566), Image.LANCZOS).convert("L").convert("RGB").save(os.path.join(out, f), optimize=True); print("bg", f); continue
    a = np.asarray(im).astype(np.float32)
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    paper = np.median(edge, axis=0)
    dist = np.sqrt(((a - paper) ** 2).sum(axis=2))
    near = dist < 42
    lab, n = ndi.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    big = np.bincount(lab.ravel())                      # مناطق داخلية بلون الورق واسعة (داخل الحلقة مثلاً) ثقبٌ لا جسم
    for k in np.where(big > 0.015 * lab.size)[0]:
        if k != 0: bgmask |= (lab == k)
    alpha = np.where(bgmask, np.clip((dist - 7) / 30.0, 0, 1), 1.0)
    alpha = ndi.gaussian_filter(alpha, 0.8)
    if '--mono' in sys.argv:                              # أحادي اللون بلوحة المرجع: حبر #160c06 على بيج #efe6da (قياس بكسلي 2026-11-22)
        g = (a @ np.array([0.299, 0.587, 0.114]) - 25) / 215.0
        g = np.clip(g, 0, 1) ** 1.25
        dark = np.array([22, 12, 6], np.float32); light = np.array([239, 230, 218], np.float32)
        a = dark + (light - dark) * g[..., None]
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    ys, xs = np.where(alpha > 0.3)                      # قصّ على حدود الرسم ثم تربيع بهامش، فيبدو كل بطل بحجمه الحقيقي
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    side = int(max(y1 - y0, x1 - x0) * 1.08); cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0)); full = Image.fromarray(rgba, "RGBA")
    sq.paste(full.crop((x0, y0, x1 + 1, y1 + 1)), ((side - (x1 - x0 + 1)) // 2, (side - (y1 - y0 + 1)) // 2))
    sq.resize((size, size), Image.LANCZOS).save(os.path.join(out, f), optimize=True)
    print("keyed", f, "paper", paper.astype(int).tolist(), "bg%", round(float(bgmask.mean()) * 100))
