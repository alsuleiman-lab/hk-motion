import json

def analyze_cut(vad_file, total_duration, min_sil=0.35, keep_sil=0.20):
    with open(vad_file, "r") as f:
        data = json.load(f)
    gaps = data["gaps"]
    
    saved_time = 0.0
    for g in gaps:
        start, dur = g
        if dur > min_sil:
            saved_time += (dur - keep_sil)
            
    final_dur = total_duration - saved_time
    print(f"File: {vad_file}")
    print(f"Original duration: {total_duration:.2f}s ({total_duration/60:.2f} min)")
    print(f"Silence saved: {saved_time:.2f}s")
    print(f"Final duration after cutting silences: {final_dur:.2f}s ({final_dur/60:.2f} min)")
    print("-" * 50)

analyze_cut("s:/AI_Tools/Remotion_Workspace/vad_miracle.json", 427.0)
analyze_cut("s:/AI_Tools/Remotion_Workspace/vad_prayer.json", 70.0)
