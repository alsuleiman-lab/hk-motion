"""Add a calm reverb/echo to an audio file (approved presets).
Usage: python -I tools/echo_audio.py <in> <out.mp3|wav> [--style 2|6]
  2 = cathedral (solemn, long clear tail)   6 = warm deep (default)
Output length = input + reverb tail; the tail decays to silence, then a 3 s fade (never cut abruptly).
Needs numpy (Inkscape's python has it) and ffmpeg on PATH."""
import numpy as np, wave, sys, subprocess, tempfile, os
SR = 44100
STYLES = {  # rt_low, rt_high, predelay, lowpass, highpass, wet, dry, seeds
    2: (7, 4, .04, 6000, 90, .65, .9, (118, 135)),
    6: (5, 2, .035, 2800, 70, .7, .9, (116, 133)),
}
def band(n, lo, hi, rng):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X * ((f >= lo) & (f < hi)), n)
def make_ir(rt_lo, rt_hi, pd, lp, hp, seed):
    rng = np.random.default_rng(seed); rt = max(rt_lo, rt_hi); n = int(SR * rt * 1.15); t = np.arange(n) / SR
    ir = np.zeros(n)
    for lo, hi, r in ((0, 600, rt_lo), (600, 3000, (rt_lo + rt_hi) / 2), (3000, SR / 2, rt_hi)):
        ir += band(n, lo, hi, rng) * np.exp(-6.9 * t / r)
    X = np.fft.rfft(ir); f = np.fft.rfftfreq(n, 1 / SR)
    X *= 1 / (1 + (f / lp) ** 4); X *= 1 - 1 / (1 + (f / max(hp, 1)) ** 2)
    ir = np.fft.irfft(X, n); ir *= np.minimum(1, t / 0.012)
    for _ in range(14):
        d = int(rng.uniform(0.008, 0.09) * SR); ir[d] += rng.uniform(-1, 1) * 0.9 * np.exp(-d / SR * 3) * np.abs(ir).max() * 3
    return np.concatenate([np.zeros(int(pd * SR)), ir])
def conv(x, h):
    n = len(x) + len(h) - 1; N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(h, N), N)[:n]
def main():
    a = sys.argv[1:]; style = int(a[a.index('--style') + 1]) if '--style' in a else 6
    src, dst = a[0], a[1]; rt_lo, rt_hi, pd, lp, hp, wet, dry, seeds = STYLES[style]
    tmp = tempfile.mkdtemp(dir=os.environ.get('TMP_ECHO_DIR') or None)
    wi, wo = os.path.join(tmp, 'in.wav'), os.path.join(tmp, 'out.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_s16le', wi], check=True)
    w = wave.open(wi); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).astype(np.float32) / 32768; w.close()
    tail = int(SR * max(rt_lo, rt_hi) * 1.2) + SR
    L = [conv(np.concatenate([x[:, c], np.zeros(tail)]), make_ir(rt_lo, rt_hi, pd, lp, hp, seeds[c])) for c in range(2)]
    n = min(map(len, L)); wv = np.stack([l[:n] for l in L], 1)
    wv *= wet * np.sqrt((x ** 2).mean()) / np.sqrt((wv[:len(x)] ** 2).mean())
    out = np.zeros((n, 2), np.float32); out[:len(x)] += x * dry; out += wv
    fl = 3 * SR; out[-fl:] *= ((0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fl))) ** 2)[:, None]
    pk = np.abs(out).max()
    if pk > 0.9: out *= 0.9 / pk
    o = wave.open(wo, 'wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR)
    o.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes()); o.close()
    enc = ['-c:a', 'libmp3lame', '-b:a', '192k'] if dst.lower().endswith('.mp3') else []
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wo, *enc, dst], check=True)
    for f in (wi, wo): os.remove(f)
    os.rmdir(tmp); print('OK', dst, f'{n / SR:.1f}s style={style}')
main()
