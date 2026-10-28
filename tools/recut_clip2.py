import subprocess
import os
import sys

SOURCE = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8\source.mp4"
PUB = r"s:\AI_Tools\Remotion_Workspace\public"

# Clip 2 segments:
# 1) 8657.0 - 8671.5 (Complete the sentence up to "الملاحدة")
# 2) 8696.6 - 8776.5 (The advice and punchline on taaddud)
# 3) 8785.0 - 8793.5 (The laugh and closing remark)
c2_cuts = [
    (8657.0, 8671.5),
    (8696.6, 8776.5),
    (8785.0, 8793.5),
]

out_path = os.path.join(PUB, "stream_clip2_taaddud_v2.mp4")

inputs = ""
filter_parts = []
for i, (st, en) in enumerate(c2_cuts):
    dur = en - st
    inputs += f' -ss {st} -t {dur} -i "{SOURCE}"'
    filter_parts.append(f"[{i}:v:0][{i}:a:0]")

n = len(c2_cuts)
fc = "".join(filter_parts) + f"concat=n={n}:v=1:a=1[outv][outa]"
cmd = f'ffmpeg -y {inputs} -filter_complex "{fc}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k "{out_path}"'

print("Running ffmpeg for Clip 2 v2...")
res = subprocess.run(cmd, shell=True)
if res.returncode == 0:
    print("Success! Created stream_clip2_taaddud_v2.mp4")
else:
    print("Failed with return code:", res.returncode)
    sys.exit(1)
