import subprocess
import os

SOURCE = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8\source.mp4"
PUB = r"s:\AI_Tools\Remotion_Workspace\public"
WORK = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8"

out_video = os.path.join(PUB, "stream_clip5_danger.mp4")
out_audio = os.path.join(WORK, "c5_audio16k.wav")

# Cut 5430.0 to 5530.0 (100.0s)
# 01:30:30 to 01:32:10
cmd_cut = f'ffmpeg -y -ss 5430.0 -t 100.0 -i "{SOURCE}" -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k "{out_video}"'
print("Cutting video...")
subprocess.run(cmd_cut, shell=True, check=True)

# Extract audio 16k mono
cmd_audio = f'ffmpeg -y -i "{out_video}" -vn -ar 16000 -ac 1 -c:a pcm_s16le "{out_audio}"'
print("Extracting audio...")
subprocess.run(cmd_audio, shell=True, check=True)

print("Video and audio ready for Clip 5!")
