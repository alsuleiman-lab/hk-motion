import subprocess, os

def ff_escape(p):
    return os.path.abspath(p).replace('\\', '/').replace(':', '\\:')

font_path = ff_escape('public/fonts/Lalezar-Regular.ttf')
bg_path = os.path.abspath('public/people/azharMosque.jpg')
sh_path = os.path.abspath('public/sheikh_gallery/brown/sheikh_cov.png')
out_path = os.path.abspath('temp_debate/style4_ffmpeg_cinematic.jpg')

def write_txt(filename, text):
    p = os.path.join('temp_debate', filename)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
    return ff_escape(p)

t1_file = write_txt('t1.txt', 'لماذا عفا النبي ﷺ')
t2_file = write_txt('t2.txt', 'عن ابن أبي سرح؟')
t3_file = write_txt('t3.txt', 'كشف شبهة الشفاعة في حد الردة')
t4_file = write_txt('t4.txt', 'محمد بن شمس الدين')

filter_complex = (
    f"[0:v]scale=1920:1080,eq=contrast=1.25:brightness=-0.3:saturation=0.7,gblur=sigma=3[bg];"
    f"[bg]drawbox=x=0:y=0:w=1200:h=1080:color=black@0.7:t=fill[bg_dark];"
    f"[1:v]scale=1920:1080[sh];"
    f"[bg_dark][sh]overlay=0:0[comp];"
    f"[comp]drawtext=fontfile='{font_path}':textfile='{t1_file}':fontsize=130:fontcolor=white:x=100:y=240:borderw=10:bordercolor=black:shadowx=6:shadowy=6:shadowcolor=black@0.8[o1];"
    f"[o1]drawtext=fontfile='{font_path}':textfile='{t2_file}':fontsize=145:fontcolor=0xFFD23F:x=100:y=400:borderw=12:bordercolor=black:shadowx=8:shadowy=8:shadowcolor=black@0.9[o2];"
    f"[o2]drawtext=fontfile='{font_path}':textfile='{t3_file}':fontsize=55:fontcolor=white:x=115:y=620:box=1:boxcolor=black@0.9:boxborderw=18:borderw=4:bordercolor=black[o3];"
    f"[o3]drawtext=fontfile='{font_path}':textfile='{t4_file}':fontsize=40:fontcolor=0xDDDDDD:x=100:y=980:borderw=4:bordercolor=black[outv]"
)

cmd = [
    'ffmpeg', '-y', '-threads', '4',
    '-i', bg_path,
    '-i', sh_path,
    '-filter_complex', filter_complex,
    '-map', '[outv]',
    '-vframes', '1',
    '-q:v', '2',
    out_path
]

res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
if res.returncode == 0:
    print('Style 4 generated successfully via FFmpeg!')
else:
    print('FFmpeg error:', res.stderr[-500:])
