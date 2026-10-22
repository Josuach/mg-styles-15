# 欧洲手札 — the film's score: candidate A, 钢琴手札 (felt piano + string pad, D major, 72 bpm), chosen by the user from
# music_candidates.py. Reads the cue sheet from cues.json (node tools/dump_cues.mjs) and writes out/audio.wav for
# harness/render.mjs. −14 LUFS integrated, true peak ≤ −1 dBTP; the bed is silent for 奥斯维辛.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from music_candidates import cand_A

if __name__ == '__main__':
    cand_A(os.path.join(HERE, 'out', 'audio.wav'))
