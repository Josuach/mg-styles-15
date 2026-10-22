# 欧洲手札 — 45 s score, locked to the cue sheet in film.js (same numbers below).
# A light, warm bed in E major at 120 bpm: pizzicato walking bass + soft marimba off-beats; one more layer joins at each
# year flip (2023 kalimba arpeggios, 2024 vibraphone pads + cabasa, 2025 harp). Gentle sound design on the drawings:
# ink drop, marimba notes under the title characters, woodblock as the year ring is drawn, a pencil scribble gated at 12 Hz
# (the drawings change on twos), a soft whoosh on camera moves, a soft "fwump" as colour washes in, and one small accent
# per hero stop, in key. At 奥斯维辛 the music stops completely: only the pen and one very low sustained note.
# At 蒙达尔纪 the theme returns softly and builds to the final chord and the glockenspiel on the end card.
import os, glob, re
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, '..', '..', 'lib', 'audio', 'samples')
SR, DUR = 48000, 45.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
MUS = np.zeros((2, N)); SFX = np.zeros((2, N)); LOW = np.zeros((2, N))

# ---------------------------------------------------------------- cue sheet (mirrors film.js)
HEROES = [  # name, start, end
    ('paris', 2.0, 3.6), ('nice', 3.6, 5.2), ('msm', 5.2, 6.8), ('mill', 6.8, 8.4), ('tulips', 8.4, 10.0),
    ('jungfrau', 10.0, 11.6), ('budapest', 11.6, 13.2), ('hallstatt', 13.2, 14.8), ('neusch', 14.8, 16.4),
    ('cambridge', 16.4, 18.0), ('london', 18.0, 19.6), ('cph', 19.6, 21.2), ('stockholm', 21.2, 22.8),
    ('venice', 22.8, 24.4), ('rome', 24.4, 26.0), ('sagrada', 26.0, 27.6), ('alhambra', 27.6, 29.2),
    ('dubrovnik', 29.2, 30.8), ('luxembourg', 30.8, 32.4), ('bran', 32.4, 34.0), ('auschwitz', 34.0, 36.4),
    ('montargis', 36.4, 38.2)]
def stop_times(key, s, e):
    c = dict(arrive=s + 0.3, draw=(s + 0.28, s + 1.0), fill=s + 0.82, label=s + 0.72, detail=s + 1.0, leave=e - 0.45)
    if key == 'paris': c.update(arrive=0.0, draw=(1.5, 2.67), fill=2.25, label=2.17, detail=2.75)
    if key == 'auschwitz': c.update(draw=(34.3, 35.7), fill=None, label=35.25, detail=None)
    if key == 'montargis': c.update(leave=38.2)
    return c
CUE = {k: stop_times(k, s, e) for k, s, e in HEROES}
YEAR_FLIPS = [5.2, 16.4, 29.2]           # 2026 (34.0) is the 奥斯维辛 stop: no accent there
SILENCE = (34.0, 36.4)
CARD = 40.2
BEAT = 0.5

# ---------------------------------------------------------------- helpers
NAMES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def midi(name):
    m = re.match(r'([A-G]#?)(-?\d)', name); return 12 * (int(m.group(2)) + 1) + NAMES[m.group(1)]
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def bank(folder, pat):
    out = {}
    for f in sorted(glob.glob(os.path.join(SAMPLES, folder, '*.flac'))):
        m = re.search(pat, os.path.basename(f))
        if m: out.setdefault(midi(m.group(1)), f)
    return out
MARIMBA = bank('marimba', r'Outrigger_([A-G]#?\d)_')
KALIMBA = bank('kalimba', r'Main_([A-G]#?\d)_')
GLOCK = bank('glock', r'glock_\w+?_([A-G]#?\d)_')
HARP = bank('harp', r'KSHarp_([A-G]#?\d)_')
VIBES = bank('vibraphone', r'Vibes_hard_([A-G]#?\d)_')
PIANO = bank('piano', r'GPiano_sus_([A-G]#?\d)_v2')

_cache = {}
def load(f):
    if f not in _cache:
        a, sr = sf.read(f, always_2d=True); a = a.mean(axis=1)
        if sr != SR: a = signal.resample_poly(a, SR, sr)
        _cache[f] = a / (np.abs(a).max() + 1e-9)
    return _cache[f]
def note(bank_, m, length=1.5):
    k = min(bank_, key=lambda x: abs(x - m))
    a = load(bank_[k])[: int(SR * length * 2.5)]
    idx = np.arange(0, len(a) - 1, 2 ** ((m - k) / 12))
    out = np.interp(idx, np.arange(len(a)), a)[: int(SR * length)]
    fade = min(len(out), int(SR * 0.05)); out[-fade:] *= np.linspace(1, 0, fade)
    return out
def wav(path): return load(os.path.join(SAMPLES, path))
def db(x): return 10 ** (x / 20)
def tt(n): return np.arange(n) / SR
def bp(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, hi): return signal.sosfilt(signal.butter(2, hi, 'low', fs=SR, output='sos'), x)
def hp(x, lo): return signal.sosfilt(signal.butter(2, lo, 'high', fs=SR, output='sos'), x)
def sweep(f0, f1, dur, shape=1.0):
    n = int(SR * dur); u = (tt(n) / dur) ** shape
    return np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** u) / SR)
def place(x, t, gain=1.0, pan=0.0, bus=None):
    bus = SFX if bus is None else bus
    i = int(round(t * SR))
    if i >= N or i < 0: return
    x = x[: N - i]
    bus[0, i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
    bus[1, i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4) * 1.414
def muted(t): return SILENCE[0] - 0.05 <= t < SILENCE[1]
def mus(x, t, gain, pan=0.0):
    if not muted(t): place(x, t, gain, pan, MUS)
def q8(t): return round(t / (BEAT / 2)) * (BEAT / 2)     # nearest 8th note: accents land on the grid

def pizz(m, dur=0.45, damp=0.994, bright=1800):
    f = hz(m); p = int(SR / f); n = int(SR * dur)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * damp
    out = lp(out, bright) * np.exp(-tt(n) * (5 if damp < 0.998 else 2.2))
    return out / (np.abs(out).max() + 1e-9)
def bell(m, dur=2.0, partials=((1, 1), (2.76, 0.45), (5.4, 0.25), (8.93, 0.12), (0.5, 0.3))):
    n = int(SR * dur); tv = tt(n); f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * r * tv) * np.exp(-tv * (1.4 + r * 0.9)) for r, a in partials)
    return x * np.minimum(1, tv / 0.003)
def reed(m, dur):
    n = int(SR * dur); tv = tt(n); f = hz(m)
    x = sum(signal.square(2 * np.pi * f * (1 + c / 1200) * tv, duty=0.42) for c in (-7, 0, 9)) / 3
    env = np.minimum(1, tv / 0.02) * np.minimum(1, (dur - tv) / 0.05) * (1 + 0.15 * np.sin(2 * np.pi * 6 * tv))
    return lp(x, 2400) * env
def brass(m, dur):
    n = int(SR * dur); tv = tt(n); f = hz(m)
    x = signal.sawtooth(2 * np.pi * f * tv) + 0.5 * signal.sawtooth(2 * np.pi * f * 1.003 * tv)
    env = np.minimum(1, tv / 0.04) * np.minimum(1, (dur - tv) / 0.08)
    cut = 600 + 2200 * np.minimum(1, tv / 0.08)
    out = np.zeros(n); zi = None
    for a in range(0, n, 480):                     # time-varying low-pass, block-wise
        sos = signal.butter(2, cut[a], 'low', fs=SR, output='sos')
        if zi is None: zi = signal.sosfilt_zi(sos) * 0
        out[a:a + 480], zi = signal.sosfilt(sos, x[a:a + 480], zi=zi)
    return out * env
def vowel(m, dur):                                  # a soft choir "ah": saw through two formants
    n = int(SR * dur); tv = tt(n); f = hz(m)
    x = signal.sawtooth(2 * np.pi * f * tv * (1 + 0.004 * np.sin(2 * np.pi * 5 * tv)))
    y = bp(x, 650, 1100) + 0.6 * bp(x, 1000, 1400) + 0.3 * lp(x, 400)
    return y * np.minimum(1, tv / 0.25) * np.minimum(1, (dur - tv) / 0.4)
def noise(n): return rng.standard_normal(n)

# ---------------------------------------------------------------- the bed (E major, 120 bpm)
PROG = [('E', ['E2', 'G#2', 'B2', 'D#3'], ['G#4', 'B4', 'E5']), ('C#m', ['C#2', 'E2', 'G#2', 'B1'], ['G#4', 'C#5', 'E5']),
        ('A', ['A1', 'C#2', 'E2', 'A#1'], ['A4', 'C#5', 'E5']), ('B', ['B1', 'D#2', 'F#2', 'D#2'], ['F#4', 'B4', 'D#5'])]
def bar_at(t): return PROG[int(t // 2.0) % 4]
def level(t):
    """bed level: in at the title, a step for each year, out for 奥斯维辛, back softly at 蒙达尔纪 and up to the end card"""
    if t < 0.4: return 0.0
    if t < SILENCE[0]: return 1.0
    if t < SILENCE[1]: return 0.0
    return min(1.0, 0.45 + 0.55 * (t - SILENCE[1]) / (CARD - SILENCE[1]))
t = 0.5
while t < CARD - 1e-6:
    name, bass, chord = bar_at(t)
    b = int(round((t % 2.0) / BEAT))
    g = level(t)
    if g > 0:
        mus(pizz(midi(bass[b])), t, db(-8) * g, -0.1)
        for c in chord[:2]: mus(note(MARIMBA, midi(c), 0.6), t + BEAT / 2, db(-21) * g, 0.3)
        if t >= YEAR_FLIPS[0]:                    # 2023: kalimba arpeggio, 8ths, very soft
            for k, c in enumerate(chord): mus(note(KALIMBA, midi(c) + 12 * (k == 2 and b % 2), 0.5), t + k * 0.125 * (b % 2), db(-29) * g, -0.4)
        if t >= YEAR_FLIPS[1] and b == 0:         # 2024: vibraphone pad on the bar + cabasa 8ths
            for c in chord: mus(note(VIBES, midi(c) - 12, 2.0), t, db(-26) * g, 0.45)
        if t >= YEAR_FLIPS[1]:
            for h in (0, 0.25): mus(wav('cabasa/Cabasa1_Hit_rr1_Mid.flac')[: int(SR * 0.15)], t + h, db(-34 + 4 * (h > 0)) * g, 0.6)
        if t >= YEAR_FLIPS[2] and b == 2:         # 2025: a harp arpeggio every bar
            for k, c in enumerate(chord + [chord[0][:-1] + str(int(chord[0][-1]) + 1)]): mus(note(HARP, midi(c), 1.0), t + k * 0.09, db(-24) * g, -0.3)
    t += BEAT
# the theme returns at 蒙达尔纪: a soft marimba line over the bass
for i, m in enumerate(['B4', 'G#4', 'E4', 'F#4', 'G#4', 'B4', 'C#5', 'B4', 'G#5', 'F#5', 'E5']):
    place(note(MARIMBA, midi(m), 0.9), 36.5 + i * 0.25 * (1 if i < 8 else 2) + (0.5 if i >= 8 else 0), db(-17 + i * 0.4), 0.15, MUS)
# final chord on the end card, rings out
for c, gdb in [('E2', -10), ('B2', -14), ('E3', -14), ('G#3', -16), ('B3', -16), ('E4', -18)]:
    place(note(PIANO, midi(c), 4.6), CARD, db(gdb), 0.0, MUS)
for c in ['G#4', 'B4', 'E5']: place(note(VIBES, midi(c) - 12, 4.0), CARD, db(-22), 0.3, MUS)
place(pizz(midi('E1'), 1.2, 0.998, 900), CARD, db(-8), 0.0, MUS)
for i, m in enumerate(['E6', 'G#6', 'B6', 'E7', 'G#6']):          # glock under the card's inking (every 3 frames)
    place(note(GLOCK, midi(m), 1.6), CARD + i * 3 / 24, db(-19 - i), -0.3 + i * 0.15)
place(note(GLOCK, midi('B6'), 2.2), CARD + 0.7, db(-21), 0.35)

# ---------------------------------------------------------------- opening
n = int(SR * 0.3)
plop = sweep(420, 90, 0.3, 0.6) * np.exp(-tt(n) * 14) + bp(noise(n), 300, 1800) * np.exp(-tt(n) * 40) * 0.4
place(plop, 0.0, db(-6))
for i in range(4): place(note(MARIMBA, midi('B5') + [0, 4, 7, 12][i], 0.15) * 0.5, 0.03 + i * 0.022, db(-28), -0.6 + i * 0.4)
for i, m in enumerate(['E5', 'G#5', 'B5', 'E6']):                 # title characters, every 4 frames from 0.25 s
    place(note(MARIMBA, midi(m), 0.8), 0.25 + i * 4 / 24, db(-14), -0.5 + i * 0.25)
place(bp(noise(int(SR * 0.25)), 2000, 7000) * np.hanning(int(SR * 0.25)), 0.83, db(-30), -0.3)
place(wav('woodblock/wood_click_mp.flac')[: int(SR * 0.3)], 0.5, db(-14), 0.6)     # year ring
for ty in YEAR_FLIPS: place(wav('woodblock/wood_click_mp.flac')[: int(SR * 0.3)], ty, db(-17), 0.6)

# ---------------------------------------------------------------- pencil scribble on twos, following every drawing
tv = tt(N)
env = 0.35 * ((tv > 0.17) & (tv < 1.42))
for k, s, e in HEROES:
    c = CUE[k]; a, b = c['draw']
    env = env + (1.25 if k == 'auschwitz' else 0.9) * ((tv > a) & (tv < b))
env = lp(env, 30)
gate = (0.55 + 0.45 * (np.floor(tv * 12) % 2)) * (0.8 + 0.2 * np.sin(2 * np.pi * 31 * tv))
place(bp(noise(N), 1800, 6500) * gate * env, 0.0, db(-31), 0.15)

# ---------------------------------------------------------------- camera whooshes, colour fwumps, labels
for i, (k, s, e) in enumerate(HEROES):
    c = CUE[k]
    if i + 1 < len(HEROES):                       # travel to the next stop
        a = c['leave']; b = CUE[HEROES[i + 1][0]]['arrive'] + 0.1; d = b - a; n = int(SR * d)
        place(bp(noise(n), 400, 2600) * np.sin(np.pi * tt(n) / d) ** 2, a, db(-31 if HEROES[i + 1][0] != 'auschwitz' else -36), -0.2 + 0.4 * (i % 2))
    if c['fill'] is not None:
        n = int(SR * 0.25)
        place(sweep(140, 70, 0.25) * np.exp(-tt(n) * 10) + bp(noise(n), 200, 900) * np.exp(-tt(n) * 18) * 0.5, c['fill'], db(-15))
    if k != 'auschwitz' and k != 'paris':
        place(note(KALIMBA, midi(['E5', 'G#5', 'B5', 'C#6'][i % 4]), 0.8), q8(c['label']), db(-24), 0.4)
n = int(SR * 0.95)
place(bp(noise(n), 400, 3000) * np.sin(np.pi * tt(n) / 0.95) ** 2, 1.08, db(-27), -0.2)             # push into Paris
n = int(SR * 2.8)
place(bp(noise(n), 300, 2400) * np.sin(np.pi * tt(n) / 2.8) ** 2, 38.2, db(-30), 0.0)                # the final pull-back

# ---------------------------------------------------------------- the per-stop accents (small, in key, on the grid)
def acc(k): return q8(CUE[k]['draw'][1] - 0.15)
for t0, m, d in [(1.5, 'B4', 0.24), (1.75, 'E5', 0.24), (2.0, 'D#5', 0.22), (2.25, 'B4', 0.4)]:         # 巴黎 musette
    place(reed(midi(m), d), t0, db(-22), 0.2)
place(note(GLOCK, midi('B6'), 1.2), 2.75, db(-17), 0.3); place(note(GLOCK, midi('E7'), 1.0), 2.75 + 2 / 24, db(-21), 0.4)   # the star
n = int(SR * 1.2)                                                                                          # 尼斯 wave
place(bp(noise(n), 300, 2500) * np.sin(np.pi * tt(n) / 1.2) ** 3, acc('nice') - 0.4, db(-19), -0.3)
place(bell(midi('E5'), 2.2), acc('msm'), db(-17), 0.2)                                                     # 圣米歇尔山 bell
for i in range(3): place(wav('woodblock/wood_click2_mp.flac')[: int(SR * 0.2)], acc('mill') + i * 0.125, db(-17 - 2 * (i == 1)), -0.4 + 0.4 * i)   # clogs
for i, m in enumerate(['E6', 'G#6', 'B6', 'C#7', 'E7']):                                                   # 库肯霍夫 tulips opening
    place(note(GLOCK, midi(m), 1.0), q8(CUE['tulips']['detail'] - 0.25) + i * 0.125, db(-20 - i), -0.4 + i * 0.2)
cb = bp(signal.square(2 * np.pi * 540 * tt(int(SR * 0.5))) + signal.square(2 * np.pi * 800 * tt(int(SR * 0.5))), 500, 2500) * np.exp(-tt(int(SR * 0.5)) * 9)
place(cb, acc('jungfrau'), db(-24), 0.35); place(cb, acc('jungfrau') + 0.25, db(-29), 0.35)                # 少女峰 cow bell
for i, m in enumerate(['B4', 'C#5', 'B4', 'A4', 'G#4', 'F#4', 'G#4']):                                       # 布达佩斯 cimbalom
    place(pizz(midi(m), 0.6, 0.997, 5000), acc('budapest') - 0.25 + i * 0.0625, db(-19), 0.25)
place(sweep(900, 2000, 0.06, 0.5) * np.hanning(int(SR * 0.06)), acc('hallstatt'), db(-18), -0.2)           # 哈尔施塔特 drop
place(sweep(1300, 2600, 0.05, 0.5) * np.hanning(int(SR * 0.05)), acc('hallstatt') + 0.25, db(-24), 0.2)
for i, m in enumerate(['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5', 'E5', 'G#5', 'B5', 'E6']):            # 新天鹅堡 harp gliss
    place(note(HARP, midi(m), 1.2), acc('neusch') - 0.35 + i * 0.035, db(-21), -0.5 + i * 0.09)
for c in ['E4', 'G#4', 'B4']: place(vowel(midi(c), 1.3), acc('cambridge') - 0.4, db(-23), 0.0)            # 剑桥 choir "ah"
for i, m in enumerate(['G#4', 'E4', 'F#4', 'B3']):                                                          # 伦敦 chime
    place(bell(midi(m), 1.6), acc('london') - 0.5 + i * 0.25, db(-19), 0.1)
n = int(SR * 0.35); f = 1500 + 700 * np.sin(np.pi * tt(n) / 0.35) * (1 + 0.1 * np.sin(2 * np.pi * 18 * tt(n)))
gull = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt(n) / 0.35) ** 2
place(gull, acc('cph'), db(-24), 0.5); place(gull[: int(SR * 0.22)], acc('cph') + 0.375, db(-28), 0.55)  # 哥本哈根 gull
for i, m in enumerate(['E4', 'B4', 'E5']): place(brass(midi(m), 0.22 if i < 2 else 0.6), acc('stockholm') - 0.25 + i * 0.125, db(-22), 0.1)   # fanfare
n = int(SR * 0.7); place(bp(noise(n), 250, 1200) * np.sin(np.pi * tt(n) / 0.7) ** 2, acc('venice') - 0.3, db(-19), -0.3)  # oar
place(sweep(800, 1700, 0.05, 0.5) * np.hanning(int(SR * 0.05)), acc('venice') + 0.4, db(-26), -0.3)
n = int(SR * 0.6); place(bp(noise(n), 1500, 8000) * np.exp(-tt(n) * 6), acc('rome'), db(-24), 0.2)        # 罗马 fountain
for i in range(4): place(sweep(600 + 150 * i, 1400 + 200 * i, 0.04, 0.5) * np.hanning(int(SR * 0.04)), acc('rome') + 0.06 + i * 0.07, db(-28), 0.2)
for i, m in enumerate(['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']):                                              # 巴塞罗那 strum
    place(pizz(midi(m), 1.0, 0.998, 4000), acc('sagrada') + i * 0.018, db(-20), -0.2 + 0.08 * i)
for i, m in enumerate(['B3', 'C#4', 'B3', 'G#3', 'A3', 'G#3', 'E3']):                                      # 格拉纳达 oud
    place(pizz(midi(m), 0.5, 0.996, 2600), acc('alhambra') - 0.3 + i * 0.0833, db(-17), 0.3)
n = int(SR * 1.4); w = bp(noise(n), 200, 1400) * np.sin(np.pi * tt(n) / 1.4) ** 2                          # 杜布罗夫尼克 sea wind
place(w + 0.5 * hp(w, 900), acc('dubrovnik') - 0.6, db(-20), -0.3)
for i, m in enumerate(['E5', 'G#5', 'B5', 'E6']): place(pizz(midi(m), 0.35, 0.99, 3000), acc('luxembourg') - 0.125 + i * 0.125, db(-19), 0.3 - 0.2 * i)   # pizz
org = sum(np.sin(2 * np.pi * hz(midi(m)) * h * tt(int(SR * 1.3))) * a for m in ['E2', 'B2', 'E3'] for h, a in [(1, 1), (2, 0.4), (4, 0.15)])
place(org * np.minimum(1, tt(len(org)) / 0.25) * np.minimum(1, (1.3 - tt(len(org))) / 0.4), acc('bran') - 0.3, db(-26), 0.0)   # 布朗镇 organ
# 奥斯维辛: no accent. One very low sustained note under the pen, then nothing.
n = int(SR * 2.2); place(np.sin(2 * np.pi * hz(midi('E1')) * tt(n)) * np.minimum(1, tt(n) / 0.6) * np.minimum(1, (2.2 - tt(n)) / 0.6), 34.1, db(-24), 0.0, LOW)

# ---------------------------------------------------------------- mix + master: −14 LUFS, true peak ≤ −1 dBTP
mute = np.ones(N)                                    # the bed stops dead for 奥斯维辛, ringing tails included
a0, a1 = int(SR * (SILENCE[0] - 0.02)), int(SR * (SILENCE[0] + 0.1))
mute[a0:a1] = np.linspace(1, 0, a1 - a0); mute[a1:int(SR * SILENCE[1])] = 0
mix = (MUS * mute + LOW + SFX).T
mix *= np.minimum(1, (DUR - tt(N)) / 0.6)[:, None]
meter = pyln.Meter(SR)
for _ in range(4):
    mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
    lim = db(-1.4); knee = lim * 0.6
    a = np.abs(mix)
    mix = np.where(a > knee, np.sign(mix) * (knee + (lim - knee) * np.tanh((a - knee) / (lim - knee))), mix)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'audio.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
seg = mix[int(SR * 34.15):int(SR * 36.35)]
print(f'loudness {meter.integrated_loudness(mix):.2f} LUFS, true peak ≈ {tp:.2f} dBTP, 奥斯维辛 window rms {20*np.log10(np.sqrt((seg**2).mean())+1e-12):.1f} dBFS')
