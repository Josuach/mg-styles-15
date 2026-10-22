# 欧洲手札 — 3 s sample score, locked to the timing in film.js.
# Felt piano + soft string pad in E major; ink-drop thump on frame 0, piano notes under the four title characters,
# an air swell through the camera push, a musette (accordion) phrase for 巴黎, a pen whisper that follows the draw,
# glockenspiel on the antenna tip. Plain numpy so it runs without the full mgaudio stack.
import os, glob, re
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, '..', '..', 'lib', 'audio', 'samples')
SR, DUR = 48000, 3.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)

NAMES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def midi(name):
    m = re.match(r'([A-G]#?)(-?\d)', name); return 12 * (int(m.group(2)) + 1) + NAMES[m.group(1)]

def bank(folder, pat):
    out = {}
    for f in sorted(glob.glob(os.path.join(SAMPLES, folder, '*.flac'))):
        m = re.search(pat, os.path.basename(f))
        if m: out.setdefault(midi(m.group(1)), f)
    return out
PIANO = bank('piano', r'GPiano_sus_([A-G]#?\d)_v2')
PIANO.update({k: v for k, v in bank('piano', r'GPiano_sus_([A-G]#?\d)_v3').items() if k not in PIANO})
GLOCK = bank('glock', r'glock_medium_([A-G]#?\d)_')

_cache = {}
def load(f):
    if f not in _cache:
        a, sr = sf.read(f, always_2d=True)
        a = a.mean(axis=1)
        if sr != SR: a = signal.resample_poly(a, SR, sr)
        _cache[f] = a / (np.abs(a).max() + 1e-9)
    return _cache[f]

def note(bank_, m, length=2.5):
    k = min(bank_, key=lambda x: abs(x - m))
    a = load(bank_[k])[: int(SR * length * 2)]
    ratio = 2 ** ((m - k) / 12)
    idx = np.arange(0, len(a) - 1, ratio)
    out = np.interp(idx, np.arange(len(a)), a)[: int(SR * length)]
    fade = min(len(out), int(SR * 0.08))
    out[-fade:] *= np.linspace(1, 0, fade)
    return out

def place(x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * gain * gl * 1.414
    R[i:i + len(x)] += x * gain * gr * 1.414

def db(x): return 10 ** (x / 20)
def tt(n): return np.arange(n) / SR

# felt piano: soften the attack with a low-pass
def felt(x): return signal.sosfilt(signal.butter(2, 2600, 'low', fs=SR, output='sos'), x)

# 0.00 ink drop: low E + B, plus a soft thump
place(felt(note(PIANO, midi('E2'), 3.0)), 0.0, db(-6), -0.15)
place(felt(note(PIANO, midi('B2'), 3.0)), 0.0, db(-12), 0.15)
th = np.sin(2 * np.pi * 62 * tt(int(SR * 0.35))) * np.exp(-tt(int(SR * 0.35)) * 16)
place(th, 0.0, db(-8))

# title characters (0.22 + i·0.11): Emaj9 arpeggio
for i, n in enumerate(['G#4', 'B4', 'D#5', 'F#5']):
    place(felt(note(PIANO, midi(n), 2.4)), 0.22 + i * 0.11, db(-15 - i), -0.4 + i * 0.25)

# string pad: Emaj9 → Amaj9 at the push, detuned saws through a slow low-pass
def pad(notes, t0, t1, gain):
    n = int((t1 - t0) * SR); x = np.zeros(n); tv = tt(n)
    for m in notes:
        f = 440 * 2 ** ((m - 69) / 12)
        for d in (-0.06, 0.0, 0.07):
            ph = rng.uniform(0, 1)
            x += signal.sawtooth(2 * np.pi * f * (1 + d / 100 * 6) * tv + ph * 2 * np.pi)
    x = signal.sosfilt(signal.butter(2, 1400, 'low', fs=SR, output='sos'), x) / (len(notes) * 3)
    env = np.minimum(1, tv / 0.6) * np.minimum(1, (t1 - t0 - tv) / 0.4)
    return x * env * gain
place(pad([52, 59, 63, 66, 68], 0.05, 1.7, 1), 0.05, db(-20), -0.2)
place(pad([45, 57, 61, 64, 68, 71], 1.45, 3.0, 1), 1.45, db(-19), 0.2)

# air swell through the camera push (1.12–2.02)
n = int(SR * 1.0); w = rng.standard_normal(n)
w = signal.sosfilt(signal.butter(2, [500, 4000], 'band', fs=SR, output='sos'), w)
env = np.sin(np.pi * np.clip(tt(n) / 1.0, 0, 1)) ** 2
place(w * env, 1.08, db(-30), 0.3)

# musette phrase for 巴黎: two reeds a few cents apart, gentle bellows tremolo
def reed(m, dur):
    n = int(SR * dur); tv = tt(n); f = 440 * 2 ** ((m - 69) / 12)
    x = sum(signal.square(2 * np.pi * f * (1 + c / 1200) * tv, duty=0.42) for c in (-7, 0, 9)) / 3
    x = signal.sosfilt(signal.butter(2, 2200, 'low', fs=SR, output='sos'), x)
    env = np.minimum(1, tv / 0.025) * np.minimum(1, (dur - tv) / 0.06) * (1 + 0.12 * np.sin(2 * np.pi * 5.5 * tv))
    return x * env
for t0, m, d in [(1.55, 'B4', 0.22), (1.78, 'E5', 0.22), (2.01, 'D#5', 0.18), (2.2, 'B4', 0.5)]:
    place(reed(midi(m), d), t0, db(-24), 0.25)

# pen whisper following the draw (tower 1.5–2.78, tail 2.74–3.0); loudness ∝ eased speed
n = N; tv = tt(n)
def speed(t, a, b):
    u = np.clip((t - a) / (b - a), 0, 1); return np.sin(np.pi * u) * ((t > a) & (t < b))
sp = speed(tv, 1.5, 2.78) * 0.8 + speed(tv, 2.74, 3.25) * 1.0 + speed(tv, 0.22, 0.75) * 0.35
hiss = signal.sosfilt(signal.butter(2, [2500, 9000], 'band', fs=SR, output='sos'), rng.standard_normal(n))
grain = 0.7 + 0.3 * np.abs(signal.sosfilt(signal.butter(1, 40, 'low', fs=SR, output='sos'), rng.standard_normal(n))) * 4
place(hiss * sp * np.clip(grain, 0, 1.4), 0.0, db(-31))

# glock on the antenna tip
place(note(GLOCK, midi('B5'), 1.6), 2.76, db(-17), 0.35)

# master: gentle tail fade, loudness to −14 LUFS, peak ceiling −1 dBFS
mix = np.stack([L, R], axis=1)
mix *= np.minimum(1, (DUR - tt(N)) / 0.05)[:, None]
meter = pyln.Meter(SR)
mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
peak = np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max()
if peak > db(-1.0):
    # soft-knee limiter on the overs, then re-check
    lim = db(-1.2)
    mix = np.where(np.abs(mix) > lim * 0.7, np.sign(mix) * (lim * 0.7 + (lim * 0.3) * np.tanh((np.abs(mix) - lim * 0.7) / (lim * 0.3))), mix)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'audio.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
print(f'loudness {meter.integrated_loudness(mix):.2f} LUFS, true peak ≈ {tp:.2f} dBTP')
