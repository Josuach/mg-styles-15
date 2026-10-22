// 欧洲手札 — the one cue sheet. film.js imports it; tools/dump_cues.mjs writes cues.json for the score scripts.
// 24 hero stops of 2.5 s (奥斯维辛 3.4 s, 蒙达尔纪 2.8 s) from 2.0 s; then the pull-back and the end card. 69 s in all.
// Each stop: ~0.3 s arriving, ~0.9 s drawing, colour and label, ~0.8 s holding the finished page, ~0.5 s leaving.

export const FPS = 24;
const STOP = 2.5, START = 2.0;

// [label, place, label line, drawing, { side of the label, camera move, zoom, height fraction, chain }]
const LIST = [
  ['巴黎', '巴黎', 'PARIS · 2022.10', 'paris', { side: 1, move: 'pan', z: 2.9 }],
  ['尼斯', '尼斯', 'NICE · 2022.11', 'nice', { side: -1, move: 'pan', z: 2.6, frac: 0.42 }],
  ['圣米歇尔山', '圣米歇尔山', 'MONT-SAINT-MICHEL · 2023.02', 'msm', { side: 1, move: 'tilt', z: 3.1 }],
  ['风车村', '风车村', 'ZAANSE SCHANS · 2023.04', 'mill', { side: -1, move: 'push', z: 3.3 }],
  ['库肯霍夫花园', '库肯霍夫花园', 'KEUKENHOF · 2023.04', 'tulips', { side: 1, move: 'pan', z: 3.3, chain: true, frac: 0.36 }],
  ['少女峰', '少女峰', 'JUNGFRAU · 2023.04', 'jungfrau', { side: -1, move: 'tilt', z: 2.6, frac: 0.46 }],
  ['布达佩斯', '布达佩斯', 'BUDAPEST · 2023.12', 'budapest', { side: 1, move: 'push', z: 2.9 }],
  ['哈尔施塔特', '哈尔施塔特', 'HALLSTATT · 2023.12', 'hallstatt', { side: -1, move: 'pan', z: 3.2, frac: 0.5 }],
  ['新天鹅堡', '施旺高', 'NEUSCHWANSTEIN · 2023.12', 'neusch', { side: 1, move: 'tilt', z: 3.2, chain: true }],
  ['剑桥', '剑桥', 'CAMBRIDGE · 2024.03', 'cambridge', { side: -1, move: 'pan', z: 3.0 }],
  ['伦敦', '伦敦', 'LONDON · 2024.03', 'london', { side: 1, move: 'tilt', z: 3.0, chain: true, frac: 0.44 }],
  ['哥本哈根', '哥本哈根', 'COPENHAGEN · 2024.03', 'cph', { side: -1, move: 'push', z: 2.7, frac: 0.36 }],
  ['斯德哥尔摩', '斯德哥尔摩', 'STOCKHOLM · 2024.03', 'stockholm', { side: 1, move: 'tilt', z: 2.8 }],
  ['威尼斯', '威尼斯', 'VENICE · 2024.04', 'venice', { side: -1, move: 'pan', z: 2.7, frac: 0.38 }],
  ['罗马', '罗马', 'ROME · 2024.04', 'rome', { side: 1, move: 'tilt', z: 2.6, chain: true, frac: 0.46 }],
  ['巴塞罗那', '巴塞罗那', 'BARCELONA · 2024.05', 'sagrada', { side: -1, move: 'tilt', z: 3.0, frac: 0.44 }],
  ['格拉纳达', '格拉纳达', 'GRANADA · 2024.05', 'alhambra', { side: 1, move: 'push', z: 2.8, frac: 0.42 }],
  ['罗卡角', '罗卡角', 'CABO DA ROCA · 2024.05', 'roca', { side: 1, move: 'pan', z: 2.8, frac: 0.42 }],
  ['杜布罗夫尼克', '杜布罗夫尼克', 'DUBROVNIK · 2025.05', 'dubrovnik', { side: -1, move: 'pan', z: 2.7, frac: 0.38 }],
  ['萨拉热窝', '萨拉热窝', 'SARAJEVO · 2025.05', 'sarajevo', { side: 1, move: 'push', z: 2.9, frac: 0.42, chain: true }],
  ['卢森堡市', '卢森堡市', 'LUXEMBOURG · 2025.06', 'luxembourg', { side: -1, move: 'push', z: 3.0, frac: 0.4 }],
  ['布朗镇', '布朗镇', 'BRAN · 2025.12', 'bran', { side: 1, move: 'tilt', z: 3.0 }],
  ['奥斯维辛', '奥斯维辛', 'AUSCHWITZ · 2026.01', 'auschwitz', { side: 1, move: 'none', z: 2.8, frac: 0.36 }],
  ['蒙达尔纪', '蒙达尔纪', 'MONTARGIS · 2026.01', 'montargis', { side: -1, move: 'pan', z: 2.8, frac: 0.34 }],
];

// [label, place, start, end, label line, drawing, opts] — the shape film.js has always used
export const HEROES = [];
{
  let t = START;
  for (const [zh, place, line, key, o] of LIST) {
    const d = key === 'auschwitz' ? 3.4 : key === 'montargis' ? 2.8 : STOP;
    HEROES.push([zh, place, +t.toFixed(3), +(t + d).toFixed(3), line, key, o]);
    t += d;
  }
}
export const END = HEROES.at(-1)[3];                      // the last stop ends; the pull-back starts
export const DUR = Math.round(END + 5.8);                 // pull-back 2.8 s, then the end card holds

// the year shown in the corner flips as the first stop of a new year begins
export const YEARS = [[0.5, '2022']];
for (const h of HEROES) { const y = h[4].match(/(\d{4})\.\d\d$/)[1]; if (y !== YEARS.at(-1)[1]) YEARS.push([h[2], y]); }

export const T = {
  drop: [0, 0.3], coast: [0.17, 1.42], title: 0.25, sub: [0.83, 1.1], titleOut: [1.25, 1.55], year: [0.5, 0.85],
  push: [1.08, 2.0], pull: [END, END + 2.8], yearOut: [END + 1.2, END + 1.7], card: END + 2.0,
};
export const HOLD3 = Math.round((T.card + 0.8) * FPS);   // the end card is inked; from here on threes

// per-stop timing: arrive → draw (contour, structure, details) → colour washes up → label → one calm detail → leave
export function stopCues([zh, place, s, e, line, key]) {
  const c = { arrive: s + 0.3, draw: [s + 0.28, s + 1.15], fill: [s + 0.95, s + 1.3], label: s + 0.85, detail: s + 1.2,
    leave: e - 0.5, shrink: [e - 0.3, e + 0.25], labelOut: [e - 0.45, e - 0.15] };
  if (key === 'paris') Object.assign(c, { arrive: 0, draw: [1.5, 2.67], fill: [2.25, 2.55], label: 2.17, detail: 2.75 });
  if (key === 'auschwitz') Object.assign(c, { draw: [s + 0.3, s + 1.9], fill: null, label: s + 1.4, detail: Infinity,
    shrink: [e - 0.65, e + 0.1], labelOut: [e - 0.7, e - 0.35] });
  if (key === 'montargis') Object.assign(c, { leave: e, shrink: [e + 0.1, e + 0.7], labelOut: [e, e + 0.3] });
  return c;
}
