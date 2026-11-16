import subprocess, json

clips = [
    "s2_ashari_kalb",
    "s2_ashari_tifla",
    "s2_quburi_sahaba",
    "s2_shia_istislam"
]

info = {}
for c in clips:
    path = f"public/{c}_cut.mp4"
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-show_entries", "stream=nb_frames,r_frame_rate", "-of", "json", path]
    out = subprocess.check_output(cmd).decode("utf-8")
    data = json.loads(out)
    dur = float(data["format"]["duration"])
    nb = int(data["streams"][0].get("nb_frames") or round(dur * 30))
    info[c] = {"duration": round(dur, 2), "frames": nb}
    print(f"{c}: duration={dur:.2f}s, frames={nb}")

with open(".tmp/cuts_info.json", "w", encoding="utf-8") as f:
    json.dump(info, f, indent=2)

