import os, sys, subprocess

# Ensure output directory exists
out_dir = r"S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30"
os.makedirs(out_dir, exist_ok=True)

video_src = r"C:\Users\mshms\Videos\شرح جامع الترمذي - 30.mp4"
audio_dst = os.path.join(out_dir, "audio16k.wav")

BELOW_NORMAL = 0x00004000

if os.path.exists(audio_dst) and os.path.getsize(audio_dst) > 1000000:
    print(f"Audio already extracted: {audio_dst} ({os.path.getsize(audio_dst)/(1024*1024):.1f} MB)")
else:
    print(f"Extracting 16kHz audio from {video_src} -> {audio_dst}")
    cmd = [
        "ffmpeg", "-y",
        "-threads", "4",
        "-i", video_src,
        "-vn",
        "-ar", "16000",
        "-ac", "1",
        audio_dst
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=BELOW_NORMAL)
    stdout, stderr = proc.communicate()
    if proc.returncode != 0:
        print("FFmpeg error:", stderr.decode('utf-8', errors='ignore'))
        sys.exit(proc.returncode)
    print(f"Extracted audio successfully: {audio_dst} ({os.path.getsize(audio_dst)/(1024*1024):.1f} MB)")

