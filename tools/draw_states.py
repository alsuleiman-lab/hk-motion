"""Local vector illustrations of described STATES (user 2026-11-12: «إلستريتور محلي») — drawn by code (PIL, 2x supersampled), flat, faceless, men only, no text.
Used when the local AI generator (ComfyUI) is unavailable or for scenes better drawn than generated.
Usage: python -I tools/draw_states.py <out_dir> [bridge] [ascend] [prostrate]   → <out_dir>/state_<name>.png (1920x1080)"""
import sys, math, os
from PIL import Image, ImageDraw, ImageFilter

W, H, S = 1920, 1080, 2
out_dir = sys.argv[1]
names = sys.argv[2:] or ["bridge", "ascend", "prostrate"]
os.makedirs(out_dir, exist_ok=True)

def canvas(): return Image.new("RGB", (W * S, H * S), (240, 230, 210))
def P(*xy): return [v * S for v in xy]
def grad(img, top, bottom, y0=0, y1=None):
    y1 = y1 or H; d = ImageDraw.Draw(img)
    for y in range(y0 * S, y1 * S):
        t = (y - y0 * S) / max(1, (y1 - y0) * S)
        d.line([(0, y), (W * S, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
def glow(img, cx, cy, r, color, strength=0.9):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for k in range(40, 0, -1):
        rr = r * k / 40; a = int(255 * strength * (1 - k / 40) ** 1.6)
        d.ellipse(P(cx - rr, cy - rr, cx + rr, cy + rr), fill=color + (a,))
    return Image.alpha_composite(img.convert("RGBA"), lay.filter(ImageFilter.GaussianBlur(6 * S))).convert("RGB")
def person_back(d, x, y, h, robe=(250, 248, 240), hair=(60, 45, 35), skin=(196, 150, 112)):
    """a man seen from behind, standing: head, white kurta to the knees, trousers; x,y = feet centre, h = height"""
    u = h / 10
    d.rounded_rectangle(P(x - 0.9 * u, y - 3.0 * u, x - 0.15 * u, y), radius=0.3 * u * S, fill=(235, 232, 222))
    d.rounded_rectangle(P(x + 0.15 * u, y - 3.0 * u, x + 0.9 * u, y), radius=0.3 * u * S, fill=(235, 232, 222))
    d.rounded_rectangle(P(x - 1.6 * u, y - 7.6 * u, x + 1.6 * u, y - 2.6 * u), radius=0.9 * u * S, fill=robe)
    d.rounded_rectangle(P(x - 2.1 * u, y - 7.3 * u, x - 1.3 * u, y - 4.2 * u), radius=0.4 * u * S, fill=robe)
    d.rounded_rectangle(P(x + 1.3 * u, y - 7.3 * u, x + 2.1 * u, y - 4.2 * u), radius=0.4 * u * S, fill=robe)
    d.ellipse(P(x - 0.45 * u, y - 8.1 * u, x + 0.45 * u, y - 7.5 * u), fill=skin)
    d.ellipse(P(x - 1.0 * u, y - 9.9 * u, x + 1.0 * u, y - 7.9 * u), fill=hair)

def bridge():
    img = canvas(); grad(img, (120, 150, 190), (250, 205, 160), 0, 640); grad(img, (120, 160, 175), (70, 105, 125), 640, 1080)
    img = glow(img, 960, 240, 380, (255, 246, 210), 1.0)
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
    for i in range(11):   # soft light rays falling from the glow (alpha, blurred)
        a = math.radians(55 + i * 7)
        dl.polygon(P(960, 240, 960 + 1500 * math.cos(a - 0.02), 240 + 1500 * math.sin(a - 0.02), 960 + 1500 * math.cos(a + 0.02), 240 + 1500 * math.sin(a + 0.02)), fill=(255, 240, 200, 70))
    img = Image.alpha_composite(img.convert("RGBA"), lay.filter(ImageFilter.GaussianBlur(10 * S))).convert("RGB")
    d = ImageDraw.Draw(img)
    for x0, c in [(0, (105, 130, 150)), (1300, (95, 120, 140))]:   # far hills
        d.polygon(P(x0 - 100, 640, x0 + 300, 520, x0 + 700, 600, x0 + 800, 640), fill=c)
    d.rectangle(P(0, 700, W, 760), fill=(150, 125, 100))   # deck
    d.rectangle(P(0, 690, W, 706), fill=(170, 145, 118))
    for x in range(0, W, 480):   # arches
        d.rectangle(P(x, 760, x + 480, 900), fill=(150, 125, 100))
        d.ellipse(P(x + 60, 800, x + 420, 1060), fill=(85, 120, 140))
    for i in range(30):   # parapet posts
        d.rectangle(P(i * 66, 650, i * 66 + 14, 700), fill=(140, 115, 92))
    d.rectangle(P(0, 646, W, 656), fill=(140, 115, 92))
    for i in range(18):   # river glints
        x = (i * 211) % W; y = 940 + (i * 37) % 120
        d.line(P(x, y, x + 60, y), fill=(200, 215, 220), width=3 * S)
    person_back(d, 960, 700, 220)
    return img

def ascend():
    img = canvas(); grad(img, (25, 30, 60), (70, 70, 110), 0, 1080)
    d = ImageDraw.Draw(img)
    for i in range(70):   # stars
        x = (i * 263) % W; y = (i * 151) % 600; d.ellipse(P(x, y, x + 3, y + 3), fill=(230, 230, 250))
    img = glow(img, 960, 420, 520, (255, 240, 190), 0.85)
    d = ImageDraw.Draw(img)
    d.polygon(P(860, 0, 1060, 0, 1180, 1080, 740, 1080), fill=(255, 238, 190))   # the beam
    lay = img.copy(); img = Image.blend(img, lay.filter(ImageFilter.GaussianBlur(30 * S)), 0.35); d = ImageDraw.Draw(img)
    for x, w, h in [(40, 220, 160), (300, 180, 120), (560, 200, 150), (1300, 220, 140), (1560, 180, 170), (1760, 200, 120)]:   # village houses
        d.rectangle(P(x, 1080 - h, x + w, 1080), fill=(35, 35, 55)); d.polygon(P(x - 15, 1080 - h, x + w / 2, 1080 - h - 70, x + w + 15, 1080 - h), fill=(35, 35, 55))
        d.rectangle(P(x + w * 0.4, 1080 - h * 0.6, x + w * 0.6, 1080 - h * 0.35), fill=(240, 200, 120))
    # the man rising (arms up, small, high) and the one coming down (large, landing)
    def lifted(x, y, h, arms_up):
        u = h / 10
        d.rounded_rectangle(P(x - 1.5 * u, y - 7.6 * u, x + 1.5 * u, y - 2.4 * u), radius=0.9 * u * S, fill=(252, 250, 240))
        d.rounded_rectangle(P(x - 0.8 * u, y - 2.8 * u, x + 0.8 * u, y), radius=0.3 * u * S, fill=(238, 235, 225))
        ay = -11.2 if arms_up else -6.5
        d.line(P(x - 1.2 * u, y - 7.0 * u, x - 2.3 * u, y + ay * u * (1 if arms_up else 0.55)), fill=(252, 250, 240), width=int(0.7 * u * S))
        d.line(P(x + 1.2 * u, y - 7.0 * u, x + 2.3 * u, y + ay * u * (1 if arms_up else 0.55)), fill=(252, 250, 240), width=int(0.7 * u * S))
        d.ellipse(P(x - 0.95 * u, y - 9.8 * u, x + 0.95 * u, y - 7.9 * u), fill=(205, 165, 125))   # faceless head
        d.chord(P(x - 0.95 * u, y - 9.9 * u, x + 0.95 * u, y - 8.0 * u), 180, 360, fill=(70, 70, 75))
    lifted(960, 330, 150, True)
    lifted(960, 960, 260, False)
    return img

def prostrate():
    img = canvas(); grad(img, (232, 214, 186), (214, 190, 156), 0, 700); grad(img, (186, 150, 112), (160, 124, 90), 700, 1080)
    d = ImageDraw.Draw(img)
    d.rectangle(P(0, 690, W, 708), fill=(150, 116, 84))
    d.rounded_rectangle(P(1180, 600, 1720, 720), radius=24 * S, fill=(150, 60, 50))   # raised platform + cushion
    d.rounded_rectangle(P(1240, 560, 1660, 630), radius=30 * S, fill=(210, 160, 70))
    # the guru, seated cross-legged (front view, faceless, white hair and beard as a plain shape)
    x, y, u = 1450, 600, 26
    d.ellipse(P(x - 7 * u, y - 2.2 * u, x + 7 * u, y + 1.4 * u), fill=(244, 242, 234))   # crossed legs
    d.rounded_rectangle(P(x - 3.4 * u, y - 10 * u, x + 3.4 * u, y), radius=2 * u * S, fill=(250, 248, 240))   # torso
    d.rounded_rectangle(P(x - 5.2 * u, y - 9.2 * u, x - 2.8 * u, y - 2.2 * u), radius=1.1 * u * S, fill=(250, 248, 240))
    d.rounded_rectangle(P(x + 2.8 * u, y - 9.2 * u, x + 5.2 * u, y - 2.2 * u), radius=1.1 * u * S, fill=(250, 248, 240))
    d.ellipse(P(x - 1.9 * u, y - 14.0 * u, x + 1.9 * u, y - 10.0 * u), fill=(206, 160, 120))
    d.chord(P(x - 2.0 * u, y - 14.4 * u, x + 2.0 * u, y - 10.6 * u), 180, 360, fill=(235, 235, 235))   # white hair
    d.pieslice(P(x - 1.7 * u, y - 12.4 * u, x + 1.7 * u, y - 8.6 * u), 0, 180, fill=(235, 235, 235))   # white beard (no face)
    # the disciple lying face-down, arms stretched toward him (side view)
    fy, l, x0 = 900, 900, 560
    d.rounded_rectangle(P(x0, fy - 110, x0 + l * 0.55, fy), radius=50 * S, fill=(248, 246, 238))   # body
    d.rounded_rectangle(P(x0 - l * 0.3, fy - 70, x0 + 20, fy), radius=34 * S, fill=(236, 233, 223))   # legs
    d.ellipse(P(x0 + l * 0.55 - 20, fy - 112, x0 + l * 0.55 + 105, fy - 4), fill=(70, 55, 45))   # head, face down
    d.rounded_rectangle(P(x0 + l * 0.55 + 80, fy - 56, x0 + l * 0.55 + 400, fy - 12), radius=22 * S, fill=(248, 246, 238))   # stretched arms
    d.ellipse(P(x0 + l * 0.55 + 388, fy - 58, x0 + l * 0.55 + 442, fy - 10), fill=(200, 155, 115))
    return img.crop(P(250, 140, 1770, 995))   # tight frame: both men fill the picture (it is shown small)

for n in names:
    img = {"bridge": bridge, "ascend": ascend, "prostrate": prostrate}[n]()
    img.resize((W, H), Image.LANCZOS).save(os.path.join(out_dir, f"state_{n}.png"))
    print("ok", n)
