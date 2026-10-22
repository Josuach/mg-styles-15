# 欧洲手札 — 3 s cel / line-boil sample score, locked to the timing in film.js.
# Playful bed (pizzicato bass walking at 120 bpm, marimba off-beats) + cartoon SFX synced to the drawings:
# smear zip + ink plop, marimba pops under the title characters, woodblock on the year stamp, pencil scribble gated at
# 12 Hz (the drawings change on twos), a musette phrase for 巴黎, fwump on the colour fill, slide-whistle whip, glock ting.
import os, glob, re
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, '..', '..', 'lib', 'audio', 'samples')
SR, DUR = 48000, 3.0
N = int(SR * DUR)
rng = np.random.default_rng(5)
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
MARIMBA = bank('marimba', r'Outrigger_([A-G]#?\d)_')
KALIMBA = bank('kalimba', r'Main_([A-G]#?\d)_')
GLOCK = bank('glock', r'glock_medium_([A-G]#?\d)_')

_cache = {}
def load(f):
    if f not in _cache:
        a, sr = sf.read(f, always_2d=True); a = a.mean(axis=1)
        if sr != SR: a = signal.resample_poly(a, SR, sr)
        _cache[f] = a / (np.abs(a).max() + 1e-9)
    return _cache[f]
def note(bank_, m, length=1.5):
    k = min(bank_, key=lambda x: abs(x - m))
    a = load(bank_[k])[: int(SR * length * 2)]
    idx = np.arange(0, len(a) - 1, 2 ** ((m - k) / 12))
    out = np.interp(idx, np.arange(len(a)), a)[: int(SR * length)]
    fade = min(len(out), int(SR * 0.05)); out[-fade:] *= np.linspace(1, 0, fade)
    return out
def wav(path):
    return load(os.path.join(SAMPLES, path))

def place(x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N: return
    x = x[: N - i]
    L[i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
    R[i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4) * 1.414
def db(x): return 10 ** (x / 20)
def tt(n): return np.arange(n) / SR
def bp(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, hi): return signal.sosfilt(signal.butter(2, hi, 'low', fs=SR, output='sos'), x)
def sweep(f0, f1, dur, shape=1.0):
    n = int(SR * dur); u = (tt(n) / dur) ** shape
    f = f0 * (f1 / f0) ** u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# pizzicato: Karplus–Strong pluck
def pizz(m, dur=0.45):
    f = 440 * 2 ** ((m - 69) / 12); p = int(SR / f); n = int(SR * dur)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.994
    out = lp(out, 1800) * np.exp(-tt(n) * 5)
    return out / (np.abs(out).max() + 1e-9)

BEAT = 0.5
for i, m in enumerate(['E2', 'B2', 'E2', 'G#2', 'A2', 'C#3']):          # walking bass on the beats
    place(pizz(midi(m)), i * BEAT, db(-9), -0.1)
for i in range(6):                                                    # marimba off-beats: E6 → A6 colour
    chord = ['G#4', 'B4'] if i < 3 else ['A4', 'C#5']
    for c in chord: place(note(MARIMBA, midi(c), 0.6), i * BEAT + BEAT / 2, db(-22), 0.3)

# f0 smear zip + f1 ink plop and spatter ticks
place(sweep(1600, 400, 0.045) * np.hanning(int(SR * 0.045)), 0.0, db(-20), 0.1)
n = int(SR * 0.3)
plop = sweep(420, 90, 0.3, 0.6) * np.exp(-tt(n) * 14) + bp(rng.standard_normal(n), 300, 1800) * np.exp(-tt(n) * 40) * 0.4
place(plop, 1 / 24, db(-6))
for i in range(5):
    place(note(MARIMBA, midi('C6') + i, 0.15) * 0.5, 1 / 24 + 0.03 + i * 0.022, db(-26), -0.6 + i * 0.3)

# title pops (every 4 frames from 0.25 s): marimba arpeggio, each with a tiny pop
for i, m in enumerate(['E5', 'G#5', 'B5', 'E6']):
    t0 = 0.25 + i * 4 / 24
    place(note(MARIMBA, midi(m), 0.8), t0, db(-14), -0.5 + i * 0.25)
    place(sweep(300, 900, 0.04) * np.hanning(int(SR * 0.04)), t0, db(-24))
# subtitle underline swish
place(bp(rng.standard_normal(int(SR * 0.25)), 2000, 7000) * np.hanning(int(SR * 0.25)), 0.83, db(-30), -0.3)
# year stamp: woodblock
place(wav('woodblock/wood_click_mp.flac')[: int(SR * 0.3)], 0.5, db(-14), 0.6)

# pencil scribble, gated at 12 Hz like the drawings (coast 0.17–1.42, tower 1.5–2.67)
n = N; tv = tt(n)
gate = (0.55 + 0.45 * (np.floor(tv * 12) % 2)) * (0.8 + 0.2 * np.sin(2 * np.pi * 31 * tv))
env = 0.35 * ((tv > 0.17) & (tv < 1.42)) + 0.9 * ((tv > 1.5) & (tv < 2.67))
env = lp(env, 30)
scrib = bp(rng.standard_normal(n), 1800, 6500) * gate * env
place(scrib, 0.0, db(-31), 0.15)

# camera push whoosh (1.08–2.0)
n = int(SR * 0.95)
place(bp(rng.standard_normal(n), 400, 3000) * np.sin(np.pi * tt(n) / 0.95) ** 2, 1.08, db(-27), -0.2)

# musette phrase for 巴黎
def reed(m, dur):
    n = int(SR * dur); tv = tt(n); f = 440 * 2 ** ((m - 69) / 12)
    x = sum(signal.square(2 * np.pi * f * (1 + c / 1200) * tv, duty=0.42) for c in (-7, 0, 9)) / 3
    env = np.minimum(1, tv / 0.02) * np.minimum(1, (dur - tv) / 0.05) * (1 + 0.15 * np.sin(2 * np.pi * 6 * tv))
    return lp(x, 2400) * env
for t0, m, d in [(1.5, 'B4', 0.24), (1.75, 'E5', 0.24), (2.0, 'D#5', 0.22), (2.25, 'B4', 0.4)]:
    place(reed(midi(m), d), t0, db(-23), 0.2)

# label pop: kalimba
place(note(KALIMBA, midi('E5'), 1.0), 2.17 - 2 / SR * 0, db(-15), 0.4)
place(note(KALIMBA, midi('B5'), 1.0), 2.17 + 2 / 24, db(-17), 0.5)
# colour-fill fwump
n = int(SR * 0.25)
place(sweep(140, 70, 0.25) * np.exp(-tt(n) * 10) + bp(rng.standard_normal(n), 200, 900) * np.exp(-tt(n) * 18) * 0.5, 2.25, db(-12))
# tail whip: slide whistle up + swish, sparkle ting
place(sweep(700, 1700, 0.17, 0.7) * np.hanning(int(SR * 0.17)), 2.67, db(-24), 0.4)
place(bp(rng.standard_normal(int(SR * 0.16)), 2500, 9000) * np.hanning(int(SR * 0.16)), 2.67, db(-26), 0.5)
place(note(GLOCK, midi('B6'), 1.2), 2.75, db(-16), 0.3)
place(note(GLOCK, midi('E7'), 1.0), 2.75 + 2 / 24, db(-20), 0.4)

# master: tail fade, −14 LUFS, soft limit under −1 dBTP
mix = np.stack([L, R], axis=1)
mix *= np.minimum(1, (DUR - tt(N)) / 0.06)[:, None]
meter = pyln.Meter(SR)
for _ in range(3):   # normalise, limit, re-normalise until both specs hold
    mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
    lim = db(-1.3); knee = lim * 0.6
    a = np.abs(mix)
    mix = np.where(a > knee, np.sign(mix) * (knee + (lim - knee) * np.tanh((a - knee) / (lim - knee))), mix)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'audio.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
print(f'loudness {meter.integrated_loudness(mix):.2f} LUFS, true peak ≈ {tp:.2f} dBTP')
