import os, subprocess, base64

def get_b64(path):
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')

def get_b64_jpg(path):
    with open(path, 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('utf-8')

sheikh_b64 = get_b64('public/sheikh_gallery/brown/sheikh_cov.png')
ms_b64 = get_b64_jpg('public/cov/ms_bukhari.jpg')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141822"/>
      <stop offset="50%" stop-color="#0a0d14"/>
      <stop offset="100%" stop-color="#05070a"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="15" stdDeviation="20" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
    <filter id="rimGlow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffffff" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="15" stdDeviation="25" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
    <style>
      @font-face {{
        font-family: 'Lalezar';
        src: url('thumb_public/fonts/Lalezar-Regular.ttf');
      }}
      @font-face {{
        font-family: 'Almarai';
        src: url('thumb_public/fonts/Almarai-Bold.ttf');
        font-weight: bold;
      }}
      .txt-main {{ font-family: 'Lalezar', sans-serif; font-size: 130px; fill: #ffffff; stroke: #000; stroke-width: 10px; paint-order: stroke fill; text-anchor: end; }}
      .txt-accent {{ font-family: 'Lalezar', sans-serif; font-size: 145px; fill: #ffd23f; stroke: #000; stroke-width: 12px; paint-order: stroke fill; text-anchor: end; }}
      .txt-badge {{ font-family: 'Almarai', sans-serif; font-weight: bold; font-size: 34px; fill: #ffffff; text-anchor: middle; }}
      .txt-sub {{ font-family: 'Almarai', sans-serif; font-weight: bold; font-size: 36px; fill: #f1f5f9; text-anchor: end; }}
    </style>
  </defs>

  <!-- Dark Casefile Background -->
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <!-- Subtle Dossier Grid Lines -->
  <line x1="100" y1="0" x2="100" y2="1080" stroke="#ffffff" stroke-opacity="0.04" stroke-width="2"/>
  <line x1="500" y1="0" x2="500" y2="1080" stroke="#ffffff" stroke-opacity="0.04" stroke-width="2"/>
  <line x1="900" y1="0" x2="900" y2="1080" stroke="#ffffff" stroke-opacity="0.04" stroke-width="2"/>
  <line x1="0" y1="200" x2="1920" y2="200" stroke="#ffffff" stroke-opacity="0.04" stroke-width="2"/>
  <line x1="0" y1="600" x2="1920" y2="600" stroke="#ffffff" stroke-opacity="0.04" stroke-width="2"/>

  <!-- Tilted Evidence Document (Left) -->
  <g transform="translate(120, 100) rotate(-4)" filter="url(#shadow)">
    <!-- Photo Paper Border -->
    <rect x="-15" y="-15" width="670" height="490" fill="#ffffff" rx="8"/>
    <image href="{ms_b64}" x="0" y="0" width="640" height="460" preserveAspectRatio="xMidYMid slice"/>
    <!-- Yellow Highlighter on text -->
    <rect x="60" y="210" width="520" height="65" fill="#ffe600" fill-opacity="0.55" rx="4"/>
    <!-- Red Evidence Tag -->
    <rect x="20" y="20" width="220" height="45" fill="#dc2626" rx="4"/>
    <text x="130" y="52" class="txt-badge">وثيقة الدليل</text>
  </g>

  <!-- Sheikh Cutout (Right) -->
  <g filter="url(#rimGlow)">
    <image href="{sheikh_b64}" x="780" y="30" width="1140" height="1050" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Headline Text Block (Left / Center) -->
  <g transform="translate(1000, 680)">
    <!-- White line -->
    <text x="0" y="0" class="txt-main">لماذا عفا النبي ﷺ</text>
    <!-- Yellow line -->
    <text x="0" y="140" class="txt-accent">عن ابن أبي سرح؟</text>
  </g>

  <!-- Subtitle Tag Card -->
  <g transform="translate(100, 890)" filter="url(#shadow)">
    <rect x="0" y="0" width="910" height="75" fill="#0f172a" fill-opacity="0.95" stroke="#ffd23f" stroke-width="3" rx="10"/>
    <text x="880" y="50" class="txt-sub">كشف شبهة الشفاعة في الحدود وسقوط حد الردة بالتوبة</text>
  </g>

  <!-- Stamp: CASE CLOSED / شبهة ساقطة -->
  <g transform="translate(730, 480) rotate(15)" filter="url(#shadow)">
    <rect x="0" y="0" width="240" height="85" fill="none" stroke="#ef4444" stroke-width="7" rx="8" stroke-dasharray="16,6"/>
    <text x="120" y="55" font-family="'Lalezar', sans-serif" font-size="46" fill="#ef4444" text-anchor="middle">شبهة ساقطة</text>
  </g>

  <!-- Bottom Left Signature -->
  <text x="100" y="1020" font-family="'Lalezar', sans-serif" font-size="38" fill="#94a3b8">محمد بن شمس الدين</text>
</svg>
'''

svg_file = 'temp_debate/style5_casefile.svg'
with open(svg_file, 'w', encoding='utf-8') as f:
    f.write(svg_content)

out_png = os.path.abspath('temp_debate/style5_casefile.png')
inkscape_bin = r'C:\Program Files\Inkscape\bin\inkscape.com'

cmd = [
    inkscape_bin,
    os.path.abspath(svg_file),
    f'--export-filename={out_png}',
    '--export-width=1920',
    '--export-height=1080'
]

res = subprocess.run(cmd, capture_output=True, text=True)
print('Inkscape stdout:', res.stdout)
print('Inkscape stderr:', res.stderr)
print('PNG exists:', os.path.exists(out_png))

if os.path.exists(out_png):
    from PIL import Image
    im = Image.open(out_png)
    im.convert('RGB').save('temp_debate/style5_svg_casefile.jpg', quality=95)
    print('Style 5 successfully converted to JPG!')

