"""Stitch free (public-domain / NASA / USGS) satellite tiles into ONE mosaic jpg + register it in public/airspace/layers.json.
usage: python -I tools/map_mosaic.py <name> <source> <z> <lon0> <lat0> <lon1> <lat1> [--date 2026-06-15] [--q 88]
  source: usgs | bm (NASA Blue Marble, z<=8) | modis (NASA true colour, z<=9, needs --date) | viirs (NASA true colour, z<=9, needs --date)
  lon0,lat0 = west,north ; lon1,lat1 = east,south (snapped outward to whole tiles)
layers.json entry: {name,file,z,x0,y0,w,h}  (x0,y0 = top-left of the mosaic in world pixels at zoom z, 256 px tiles, web-mercator)"""
import sys, os, json, math, io
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from PIL import Image, ImageStat

name, src, z = sys.argv[1], sys.argv[2], int(sys.argv[3])
lon0, lat0, lon1, lat1 = map(float, sys.argv[4:8])
a = sys.argv[8:]
date = a[a.index("--date") + 1] if "--date" in a else "2026-06-15"
Q = int(a[a.index("--q") + 1]) if "--q" in a else 88
URL = {
    "usgs": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
    "bm": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/2004-08/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",
    "modis": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/" + date + "/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg",
    "viirs": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/" + date + "/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg",
}[src]
n = 2 ** z
def tx(lon): return int(math.floor((lon + 180) / 360 * n))
def ty(lat):
    r = math.radians(lat)
    return int(math.floor((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n))
x0, x1, y0, y1 = tx(lon0), tx(lon1), ty(lat0), ty(lat1)
W, H = (x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256
print(f"{name}: {x1-x0+1}x{y1-y0+1} tiles = {W}x{H}px")
if W * H > 60_000_000: sys.exit("too large (>60 Mpx) — lower z or the box")
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))   # transparent where the source has no data (USGS serves pure-black tiles over open ocean)
def get(t):
    x, y = t
    u = URL.format(z=z, x=x, y=y)
    for k in range(3):
        try:
            with urlopen(Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
                return t, Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception:
            pass
    return t, None
miss = 0
with ThreadPoolExecutor(8) as ex:
    for (x, y), im in ex.map(get, [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]):
        if im is None: miss += 1; continue
        if max(ImageStat.Stat(im).mean) < 9: miss += 1; continue   # black "no data" tile → stay transparent
        img.paste(im.convert("RGBA"), ((x - x0) * 256, (y - y0) * 256))
os.makedirs("public/airspace", exist_ok=True)
fn = f"public/airspace/{name}.webp"
img.save(fn, "WEBP", quality=Q)
old = f"public/airspace/{name}.jpg"
if os.path.exists(old): os.remove(old)
lf = "public/airspace/layers.json"
L = json.load(open(lf, encoding="utf-8")) if os.path.exists(lf) else []
L = [l for l in L if l["name"] != name] + [{"name": name, "file": f"airspace/{name}.webp", "z": z, "x0": x0 * 256, "y0": y0 * 256, "w": W, "h": H}]
json.dump(L, open(lf, "w", encoding="utf-8"), indent=1)
print(f"saved {fn} ({os.path.getsize(fn)//1024} KB), missing tiles: {miss}")
