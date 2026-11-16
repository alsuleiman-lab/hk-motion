import numpy as np

# audio16k.wav is 16-bit PCM, 16000 Hz mono
sr = 16000
with open("render_work/debate_jobeX3sJVhM/audio16k.wav", "rb") as f:
    f.seek(44) # skip wav header
    
    def get_rms(start_sec, duration):
        f.seek(44 + int(start_sec * sr) * 2)
        raw = f.read(int(duration * sr) * 2)
        data = np.frombuffer(raw, dtype=np.int16)
        if len(data) == 0: return 0
        return np.sqrt(np.mean(data.astype(np.float32)**2))

    print("6102.5 -> 6105.0:")
    for t in np.arange(6102.0, 6105.0, 0.25):
        print(f"t={t:.2f}s: rms={get_rms(t, 0.25):.1f}")

    print("\n6133.0 -> 6135.5 (before أذلك الله):")
    for t in np.arange(6133.0, 6135.5, 0.25):
        print(f"t={t:.2f}s: rms={get_rms(t, 0.25):.1f}")

    print("\n6180.0 -> 6182.5 (around لا حول ولا قوة إلا بالله):")
    for t in np.arange(6180.0, 6182.5, 0.25):
        print(f"t={t:.2f}s: rms={get_rms(t, 0.25):.1f}")

    print("\n6221.5 -> 6224.5 (around ما هذا يا رجل):")
    for t in np.arange(6221.5, 6224.5, 0.25):
        print(f"t={t:.2f}s: rms={get_rms(t, 0.25):.1f}")
