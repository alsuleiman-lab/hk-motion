# Head anchor of a cut-out PNG for ThumbPro (skill thumbnail-design): prints {headX, headTop, headW, srcW} for the Cutout prop.
# usage: python tools/cutout_head.py public/cov/x.png   (python = C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe)
# headTop = first opaque row; headW/headX = opaque span 6% of the height below it (the skull, above the ears).
import sys, json
import numpy as np
from PIL import Image
a = np.array(Image.open(sys.argv[1]).convert("RGBA"))[:, :, 3] > 128
ys, xs = np.where(a)
top = int(ys.min())
row = np.where(a[min(a.shape[0] - 1, top + int(0.06 * a.shape[0]))])[0]
print(json.dumps({"src": sys.argv[1].replace("\\", "/").split("public/")[-1], "headX": int((row.min() + row.max()) / 2), "headTop": top, "headW": int(row.max() - row.min()), "srcW": int(a.shape[1])}))
