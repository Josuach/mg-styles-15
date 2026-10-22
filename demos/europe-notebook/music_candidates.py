# 欧洲手札 — three gentler score candidates on the same cue sheet as audio.py (see film.js).
# Why: the first score was harsh — saw-wave brass, square-wave reed and cow bell, cabasa, a constant 1.8–6.5 kHz pencil
# hiss and a tanh soft-clipper that distorted every peak on the way to −14 LUFS. These candidates use sampled or soft
# additive timbres only, keep the sound design sparse and low, and master with a look-ahead limiter (no clipping).
#   A  钢琴手札  — felt piano + string pad, D major, 72 bpm. Calm and warm.
#   B  八音盒    — music-box waltz (glockenspiel + kalimba, softened) over harp and pad, G major, 3/4, 90 bpm.
#   C  咖啡馆华尔兹 — soft accordion waltz with dark pizzicato bass and nylon-guitar chords, F major, 3/4, 150 bpm.
# Each writes out/music/<letter>.wav. Shared rules: the bed is silent for the 奥斯维辛 stop apart from one very low
# note; the theme returns softly at 蒙达尔纪; the final chord lands on the end card and rings out. Times come from cues.json.
import os, glob, re, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, '..', '..', 'lib', 'audio', 'samples')
SR = 48000
# the one cue sheet: cues.js → cues.json (node tools/dump_cues.mjs)
import json
CUES = json.load(open(os.path.join(HERE, 'cues.json')))
DUR = float(CUES['dur'])
N = int(SR * DUR)
STOPS = {st['key']: st for st in CUES['stops']}
SILENCE = (STOPS['auschwitz']['start'], STOPS['auschwitz']['end'])
CARD = CUES['T']['card']
RETURN = STOPS['montargis']['start'] + 0.2               # the theme comes back at 蒙达尔纪
YEARS = [y[0] for y in CUES['years'][1:4]]              # 2023, 2024, 2025 flips (2026 is the 奥斯维辛 stop)
LABELS = [st['label'] for st in CUES['stops'] if st['key'] != 'auschwitz']
DRAWS = [tuple(st['draw']) for st in CUES['stops']]

NAMES = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
         'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def midi(name):
    m = re.match(r'([A-G][#b]?)(-?\d)', name); return 12 * (int(m.group(2)) + 1) + NAMES[m.group(1)]
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def bank(folder, pat):
    out = {}
    for f in sorted(glob.glob(os.path.join(SAMPLES, folder, '*.flac'))):
        m = re.search(pat, os.path.basename(f))
        if m: out.setdefault(midi(m.group(1)), f)
    return out
PIANO = bank('piano', r'GPiano_sus_([A-G]#?\d)_v2'); PIANO.update({k: v for k, v in bank('piano', r'GPiano_sus_([A-G]#?\d)_v3').items() if k not in PIANO})
GLOCK = bank('glock', r'glock_medium_([A-G]#?\d)_')
KALIMBA = bank('kalimba', r'Main_([A-G]#?\d)_')
HARP = bank('harp', r'KSHarp_([A-G]#?\d)_')
VIBES = bank('vibraphone', r'Vibes_\w+?_([A-G]#?\d)_')

_cache = {}
def load(f):
    if f not in _cache:
        a, sr = sf.read(f, always_2d=True); a = a.mean(axis=1)
        if sr != SR: a = signal.resample_poly(a, SR, sr)
        _cache[f] = a / (np.abs(a).max() + 1e-9)
    return _cache[f]
def note(bank_, m, length=1.5, fade=0.08):
    k = min(bank_, key=lambda x: abs(x - m))
    a = load(bank_[k])[: int(SR * length * 2.5) + 10]
    idx = np.arange(0, len(a) - 1, 2 ** ((m - k) / 12))
    out = np.interp(idx, np.arange(len(a)), a)[: int(SR * length)].copy()
    fd = min(len(out), int(SR * fade)); out[-fd:] *= np.linspace(1, 0, fd)
    return np.pad(out, (0, int(SR * length) - len(out)))       # short samples: pad so layers line up
def db(x): return 10 ** (x / 20)
def tt(n): return np.arange(n) / SR
def lp(x, hi, order=2): return signal.sosfilt(signal.butter(order, hi, 'low', fs=SR, output='sos'), x)
def bp(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)

class Mix:
    def __init__(self, seed):
        self.bed = np.zeros((2, N)); self.fx = np.zeros((2, N)); self.low = np.zeros((2, N)); self.rng = np.random.default_rng(seed)
    def put(self, x, t, gain, pan=0.0, bus='bed'):
        b = getattr(self, bus); i = int(round(t * SR))
        if i >= N or i < 0 or not len(x): return
        x = x[: N - i]
        b[0, i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
        b[1, i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4) * 1.414
    def bed_on(self, t): return not (SILENCE[0] - 0.05 <= t < SILENCE[1])

    # soft, shared sound design: an ink drop, a low paper whisper under every drawing, one low note for 奥斯维辛
    def sound_design(self):
        n = int(SR * 0.35); tv = tt(n)
        plop = np.sin(2 * np.pi * np.cumsum(260 * (70 / 260) ** (tv / 0.35) ** 0.6) / SR) * np.exp(-tv * 12)
        self.put(lp(plop, 900), 0.0, db(-10), 0.0, 'fx')
        env = np.zeros(N); tv = tt(N)
        for a, b in DRAWS: env += ((tv > a) & (tv < b)) * (1.2 if SILENCE[0] <= a < SILENCE[1] else 1.0)
        env += 0.4 * ((tv > 0.17) & (tv < 1.42))
        env = lp(env, 8)
        whisper = bp(self.rng.standard_normal(N), 350, 2600) * env
        self.put(whisper, 0.0, db(-39), 0.1, 'fx')
        n = int(SR * 2.2); x = np.sin(2 * np.pi * hz(midi('D1')) * tt(n)) + 0.3 * np.sin(2 * np.pi * hz(midi('D2')) * tt(n))
        self.put(x * np.minimum(1, tt(n) / 0.6) * np.minimum(1, (2.2 - tt(n)) / 0.6), SILENCE[0] + 0.1, db(-27), 0.0, 'low')

    def master(self, path):
        mute = np.ones(N)
        a0, a1 = int(SR * (SILENCE[0] - 0.3)), int(SR * (SILENCE[0] + 0.15))
        mute[a0:a1] = np.linspace(1, 0, a1 - a0) ** 2; mute[a1:int(SR * SILENCE[1])] = 0
        mix = (self.bed * mute + self.low + self.fx).T
        mix *= np.minimum(1, (DUR - tt(N)) / 1.2)[:, None]
        meter = pyln.Meter(SR)
        for _ in range(3):
            mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
            mix = limiter(mix, db(-2.2))          # headroom for the AAC encode (it overshoots ~1 dB)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        sf.write(path, mix.astype(np.float32), SR, subtype='FLOAT')
        tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
        print(f'{os.path.basename(path)}: {meter.integrated_loudness(mix):.2f} LUFS, true peak ≈ {tp:.2f} dBTP')

def limiter(x, ceil, look=0.005, release=0.08):
    """look-ahead peak limiter: smooth gain reduction instead of clipping"""
    peak = np.abs(x).max(axis=1)
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    w = int(SR * look)
    g = -signal.order_filter(-np.pad(need, (w, w), mode='edge'), np.ones(2 * w + 1), 0)[w:-w]   # running minimum
    k = np.exp(-1 / (SR * release)); out = np.empty_like(g); cur = 1.0
    for i, v in enumerate(g):               # instant attack (already looked ahead), smooth release
        cur = v if v < cur else v + (cur - v) * k
        out[i] = cur
    out = np.convolve(out, np.ones(w) / w, mode='same')
    return x * np.minimum(out, need)[:, None]

# ---------- soft timbres ----------
def pad(m, dur, bright=1100, rng=None):          # string pad: detuned saws, gentle low-pass, slow swell
    n = int(SR * dur); tv = tt(n); f = hz(m); x = np.zeros(n)
    for d in (-0.07, 0.0, 0.08):
        x += signal.sawtooth(2 * np.pi * f * (1 + d / 100 * 5) * tv + (rng.uniform(0, 6.28) if rng is not None else 0))
    x = lp(x, bright, 2) / 3
    return x * np.minimum(1, tv / 0.9) * np.minimum(1, (dur - tv) / 0.9)
def accordion(m, dur, rng):                      # additive reeds, soft spectrum, mild musette beating, bellows swell
    n = int(SR * dur); tv = tt(n); f = hz(m); x = np.zeros(n)
    for cents in (-5, 5):
        ff = f * 2 ** (cents / 1200)
        for h in range(1, 9): x += np.sin(2 * np.pi * ff * h * tv + rng.uniform(0, 6.28)) / h ** 1.7
    x = lp(x, 2600, 2) / 4
    env = np.minimum(1, tv / 0.05) * np.minimum(1, (dur - tv) / 0.12) * (1 + 0.05 * np.sin(2 * np.pi * 4.5 * tv))
    return x * env
def pluck(m, dur, bright, rng, damp=0.996):      # Karplus–Strong, darker than before
    f = hz(m); p = int(SR / f); n = int(SR * dur)
    buf = lp(rng.uniform(-1, 1, p * 4), bright)[-p:]; out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * damp
    out = lp(out, bright) * np.exp(-tt(n) * 2.5)
    return out / (np.abs(out).max() + 1e-9)
def soft(x, hi): return lp(x, hi, 2)

# ============================================================== A 钢琴手札
def cand_A(out=os.path.join(HERE, 'out', 'music', 'A.wav')):
    M = Mix(1); BAR = 60 / 72 * 4; Q = BAR / 4; T0 = 0.42
    chords = [('D', ['D2', 'A2', 'D3', 'F#3'], ['D4', 'F#4', 'A4']), ('Bm', ['B1', 'F#2', 'B2', 'D3'], ['B3', 'D4', 'F#4']),
              ('G', ['G1', 'D2', 'G2', 'B2'], ['B3', 'D4', 'G4']), ('A', ['A1', 'E2', 'A2', 'C#3'], ['C#4', 'E4', 'A4'])]
    P1 = [[(0, 'F#5', 2), (2, 'E5', 1), (3, 'D5', 1)], [(0, 'D5', 2), (2, 'C#5', 1), (3, 'B4', 1)],
          [(0, 'B4', 1.5), (1.5, 'D5', 0.5), (2, 'G5', 2)], [(0, 'F#5', 1), (1, 'E5', 1), (2, 'E5', 2)]]
    P2 = [[(0, 'A5', 2), (2, 'F#5', 1), (3, 'D5', 1)], [(0, 'F#5', 1), (1, 'E5', 1), (2, 'D5', 2)],
          [(0, 'D5', 1), (1, 'E5', 1), (2, 'B4', 2)], [(0, 'C#5', 2), (2, 'E5', 2)]]
    bar = 0
    while True:
        t = T0 + bar * BAR
        if t >= SILENCE[0] - 0.1: break
        name, lh, rh = chords[bar % 4]
        for i in range(8):                                     # left hand: broken chord in 8ths
            tn = t + i * Q / 2
            if tn < SILENCE[0] - 0.1: M.put(soft(note(PIANO, midi(lh[[0, 1, 2, 3, 2, 1, 2, 3][i]]), 1.4), 2800), tn, db(-25 - 2 * (i % 2)), -0.25)
        # melody from bar 2; the phrase alternates
        mel =(P1 if (bar // 4) % 2 == 0 else P2)[bar % 4] if bar >= 1 else []
        for b, n_, d in mel:
            tn = t + b * Q
            if tn < SILENCE[0] - 0.1: M.put(soft(note(PIANO, midi(n_), d * Q + 1.2), 4200), tn, db(-17), 0.15)
        if t >= YEARS[0] - 0.5:                                 # 2023: strings
            for c in rh: M.put(pad(midi(c), BAR + 0.6, 1000, M.rng), t, db(-31), 0.3)
        if t >= YEARS[1] - 0.5:                                 # 2024: a low cello line
            M.put(pad(midi(lh[0]) + 12, BAR + 0.6, 700, M.rng), t, db(-29), -0.3)
        if t >= YEARS[2] - 0.5:                                 # 2025: harp arpeggio up the chord
            for k, c in enumerate(rh + [rh[0][:-1] + str(int(rh[0][-1]) + 1)]):
                M.put(note(HARP, midi(c) + 12, 1.6), t + Q * 2 + k * 0.11, db(-27), -0.35)
        bar += 1
    for tl in LABELS:                                           # as each name inks in: one soft felt-piano chord tone
        if SILENCE[0] <= tl < SILENCE[1]: continue
        k = int(max(0, tl - T0) // BAR) % 4
        x = soft(note(PIANO, midi(chords[k][2][1]) + 12, 1.6), 1800)
        x[: int(SR * 0.025)] *= np.linspace(0, 1, int(SR * 0.025))  # a slower attack: no click, no ping
        M.put(x, tl, db(-33), 0.35)
    # 蒙达尔纪: the melody returns, alone, then the final chord on the end card
    for i, (b, n_, d) in enumerate([(0, 'F#5', 2), (2, 'E5', 1), (3, 'D5', 1), (4, 'D5', 2), (6, 'C#5', 1), (7, 'E5', 1)]):
        M.put(soft(note(PIANO, midi(n_), d * Q + 1.4), 4000), RETURN + b * Q * 0.62, db(-18), 0.1)
    for c, g in [('D2', -14), ('A2', -17), ('D3', -18), ('F#3', -19), ('A3', -20), ('D4', -21), ('F#4', -22), ('A4', -23)]:
        M.put(soft(note(PIANO, midi(c), 4.8, 1.0), 3500), CARD, db(g), 0.0)
    for c in ['D4', 'F#4', 'A4']: M.put(pad(midi(c), 4.8, 900, M.rng), CARD, db(-30), 0.25)
    M.sound_design(); M.master(out)

# ============================================================== B 八音盒
def cand_B(out=os.path.join(HERE, 'out', 'music', 'B.wav')):
    M = Mix(2); BAR = 2.0; E8 = BAR / 6; T0 = 0.42
    chords = [('G', 'G2', ['G3', 'B3', 'D4']), ('Em', 'E2', ['G3', 'B3', 'E4']), ('C', 'C2', ['G3', 'C4', 'E4']), ('D', 'D2', ['F#3', 'A3', 'D4'])]
    MEL = [['D5', 'G5', 'B5', 'A5', 'G5', 'D5'], ['E5', 'G5', 'B5', 'A5', 'G5', 'E5'], ['E5', 'G5', 'C6', 'B5', 'A5', 'G5'],
           ['F#5', 'A5', 'D6', 'C6', 'B5', 'A5'], ['B5', 'A5', 'G5', 'D5', 'G5', 'B5'], ['B5', 'G5', 'E5', 'G5', 'B5', 'E6'],
           ['C6', 'B5', 'A5', 'G5', 'E5', 'G5'], ['A5', 'F#5', 'D5', 'F#5', 'A5', 'D6']]
    PLAY = [1, 0, 1, 1, 1, 0]                    # rests on the 2nd and 6th eighth let it breathe
    def box(m, d): return soft(0.65 * note(GLOCK, m, d) + 0.5 * note(KALIMBA, m - 12, d), 3600)
    bar = 0
    while True:
        t = T0 + bar * BAR
        if t >= SILENCE[0] - 0.1: break
        _, bass, ch = chords[bar % 4]
        M.put(soft(note(HARP, midi(bass) + 12, 2.2), 2200), t, db(-20), -0.2)           # harp bass on 1
        for k in (1, 2):
            if bar >= 2: M.put(soft(note(HARP, midi(ch[k]) + 12, 1.0), 2600), t + k * BAR / 3, db(-28), -0.35)
        for i, m in enumerate(MEL[bar % 8]):
            tn = t + i * E8
            if PLAY[i] and bar >= 1 and tn < SILENCE[0] - 0.1: M.put(box(midi(m), 1.3), tn, db(-21 - 2 * (i % 2)), 0.25)
        if t >= YEARS[0] - 0.5:
            for c in ch: M.put(pad(midi(c) + 12, BAR + 0.6, 900, M.rng), t, db(-32), 0.3)
        if t >= YEARS[1] - 0.5:
            for k in (1, 2):
                for c in ch: M.put(soft(note(PIANO, midi(c) + 12, 0.9), 2600), t + k * BAR / 3, db(-31), 0.1)
        if t >= YEARS[2] - 0.5 and bar % 2 == 0:
            for c in ch: M.put(soft(note(VIBES, midi(c) + 12, 2.6), 3000), t, db(-30), -0.4)
        bar += 1
    for i, m in enumerate(['B5', 'A5', 'G5', 'D5', 'E5', 'G5', 'B5', 'D6', 'G5']):           # 蒙达尔纪: the box alone
        M.put(box(midi(m), 1.6), RETURN + i * E8 * 1.25, db(-20), 0.2)
    for c, g in [('G2', -15), ('D3', -18), ('G3', -19), ('B3', -20), ('D4', -21), ('G4', -22)]:
        M.put(soft(note(PIANO, midi(c), 4.8, 1.0), 3200), CARD, db(g), 0.0)
    for i, m in enumerate(['G5', 'B5', 'D6', 'G6']): M.put(box(midi(m), 3.0), CARD + 0.25 + i * 0.125, db(-22 - i), -0.3 + 0.2 * i)
    M.sound_design(); M.master(out)

# ============================================================== C 咖啡馆华尔兹
def cand_C(out=os.path.join(HERE, 'out', 'music', 'C.wav')):
    M = Mix(3); BEAT = 0.4; BAR = 3 * BEAT; T0 = 0.42
    chords = [('F', 'F2', ['A3', 'C4', 'F4']), ('Dm', 'D2', ['A3', 'D4', 'F4']), ('Bb', 'Bb1', ['Bb3', 'D4', 'F4']), ('C', 'C2', ['G3', 'C4', 'E4'])]
    MEL = [[(0, 'A4', 2), (2, 'C5', 1)], [(0, 'D5', 3)], [(0, 'F5', 1), (1, 'D5', 1), (2, 'Bb4', 1)], [(0, 'C5', 2), (2, 'E4', 1)],
           [(0, 'F4', 1), (1, 'A4', 1), (2, 'C5', 1)], [(0, 'F5', 2), (2, 'E5', 1)], [(0, 'D5', 2), (2, 'Bb4', 1)], [(0, 'C5', 3)]]
    bar = 0
    while True:
        t = T0 + bar * BAR
        if t >= SILENCE[0] - 0.1: break
        _, bass, ch = chords[bar % 4]
        M.put(pluck(midi(bass), 0.9, 700, M.rng, 0.997), t, db(-15), -0.1)              # dark bass on 1
        for k in (1, 2):                                                                 # nylon-guitar chord on 2 and 3
            for j, c in enumerate(ch): M.put(pluck(midi(c), 0.5, 2000, M.rng, 0.994), t + k * BEAT + j * 0.012, db(-27), 0.25)
        if bar >= 2:
            for b, n_, d in MEL[(bar - 2) % 8]:
                tn = t + b * BEAT
                if tn < SILENCE[0] - 0.1: M.put(accordion(midi(n_), d * BEAT * 0.95, M.rng), tn, db(-20), 0.1)
        if t >= YEARS[0] - 0.5 and bar % 2 == 0:
            for b, n_, d in MEL[(bar - 2) % 8][:1]: M.put(soft(note(GLOCK, midi(n_) + 12, 1.0), 3000), t + b * BEAT, db(-31), -0.3)
        if t >= YEARS[1] - 0.5:
            for c in ch: M.put(pad(midi(c), BAR + 0.5, 950, M.rng), t, db(-33), 0.35)
        if t >= YEARS[2] - 0.5 and bar % 2 == 1:
            for k, c in enumerate(ch + [ch[0][:-1] + str(int(ch[0][-1]) + 1)]): M.put(note(HARP, midi(c) + 12, 1.2), t + k * 0.09, db(-29), -0.35)
        bar += 1
    for i, (b, n_, d) in enumerate([(0, 'A4', 2), (2, 'C5', 1), (3, 'D5', 3), (6, 'C5', 2), (8, 'A4', 1), (9, 'C5', 3)]):
        M.put(accordion(midi(n_), d * 0.45 * 0.95, M.rng), RETURN + b * 0.45, db(-20), 0.1)
    for c, g in [('F2', -15), ('C3', -18), ('F3', -19), ('A3', -20), ('C4', -21), ('F4', -22)]:
        M.put(soft(note(PIANO, midi(c), 4.8, 1.0), 3200), CARD, db(g), 0.0)
    M.put(accordion(midi('A4'), 3.6, M.rng) + accordion(midi('F4'), 3.6, M.rng), CARD, db(-24), 0.1)
    M.sound_design(); M.master(out)

if __name__ == '__main__':
    which = sys.argv[1:] or ['A', 'B', 'C']
    for w in which: {'A': cand_A, 'B': cand_B, 'C': cand_C}[w]()
