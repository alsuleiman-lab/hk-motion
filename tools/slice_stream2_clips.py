import subprocess, os

clips = [
    {
        "id": "s2_ashari_kalb",
        "start": 686.0,
        "duration": 200.0,
    },
    {
        "id": "s2_ashari_tifla",
        "start": 1150.0,
        "duration": 150.0,
    },
    {
        "id": "s2_quburi_sahaba",
        "start": 2950.0,
        "duration": 198.0,
    },
    {
        "id": "s2_shia_istislam",
        "start": 3422.0,
        "duration": 166.0,
    }
]

src_video = r"C:\Users\mshms\Videos\بث للحوار مع المخالفين (2).mp4"
os.makedirs("public", exist_ok=True)

for c in clips:
    out_raw = f"public/{c['id']}_raw.mp4"
    print(f"\n--- Slicing {c['id']} ({c['start']}s for {c['duration']}s) -> {out_raw} ---")
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(c["start"]),
        "-i", src_video,
        "-t", str(c["duration"]),
        "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-threads", "4",
        out_raw
    ]
    p = subprocess.Popen(cmd)
    p.wait()
    if p.returncode == 0:
        sz = os.path.getsize(out_raw) / (1024 * 1024)
        print(f"Slice created successfully: {out_raw} ({sz:.1f} MB)")
    else:
        print(f"Error slicing {c['id']}")

