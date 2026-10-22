// 欧洲手札 — the 22 landmark drawings, in local units: base centre (0,0) sits on the city dot, y up is negative.
// Each drawing is a list of pen strokes (SVG path data) in illustrator order — contour (pen M), structure (S), details (F) —
// plus flat colour fills, red-pencil shade regions and at most one small calm motion (`parts`, `ripple`, `star`, `custom`).
// stroke: [d, pen, opts]   opts: { g: layer, part, alpha, speed }
// fill:   [d | [outer, ...holes], colour, opts]   colour: palette name, '…T' = 50 % tint, 'paper' = knock-out to the paper
// shade:  [d, opts]
// Layers (g) draw in order — each layer's fills, then its ink — so a later layer covers the one behind it.
// Proportions are sketched from the real buildings (heights/widths noted per drawing); everything is my own simplification.

const f = (n) => +n.toFixed(1);
const P = (pts) => 'M ' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ');
const Z = (pts) => P(pts) + ' Z';
const rect = (x0, y0, x1, y1) => Z([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
const mirror = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => `${f(-x)} ${y}`);
const join = (...ds) => ds.map((d, i) => (i ? d.replace(/^M/, 'L') : d)).join(' ');
const arch = (x0, x1, yb, yt) => `M ${x0} ${yb} L ${x0} ${f(yt + (x1 - x0) * 0.45)} Q ${f((x0 + x1) / 2)} ${f(yt - (x1 - x0) * 0.1)} ${x1} ${f(yt + (x1 - x0) * 0.45)} L ${x1} ${yb}`;
const circ = (cx, cy, r, ry = r) => `M ${f(cx - r)} ${cy} A ${r} ${ry} 0 1 0 ${f(cx + r)} ${cy} A ${r} ${ry} 0 1 0 ${f(cx - r)} ${cy} Z`;
const wave = (x, y, n = 2, a = 10) => { let d = `M ${x} ${y}`; for (let i = 0; i < n; i++) d += ` q ${a} ${-a * 0.6} ${2 * a} 0`; return d; };
const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [0, 1].map((k) => v * v * v * p0[k] + 3 * v * v * u * p1[k] + 3 * v * u * u * p2[k] + u * u * u * p3[k]); };

export const L = {};

// ---------------------------------------------------------------- 巴黎 · Eiffel Tower (the approved sample drawing)
// 330 m → 404 units; platforms at 57 / 115 / 276 m (19 % / 38 % / 92 % of the height), base 125 m.
{
  const EDGE_L = 'M -78 0 C -64 -22 -51 -47 -43 -70 L -41 -78 C -35 -102 -29 -124 -25 -141 L -24 -146 C -17 -216 -12 -288 -9 -338';
  const EDGE_R = 'M 9 -338 C 12 -288 17 -216 24 -146 L 25 -141 C 29 -124 35 -102 41 -78 L 43 -70 C 51 -47 64 -22 78 0';
  const TOP = 'M -9 -338 L -13 -338 L -13 -346 L -4 -346 L -2.4 -378 L 0 -404 L 2.4 -378 L 4 -346 L 13 -346 L 13 -338 L 9 -338';
  const ARCH = 'M 47 0 C 44 -26 28 -46 0 -48 C -28 -46 -44 -26 -47 0';
  const GAP = 'M -22 -78 C -14 -98 -7 -116 0 -132 C 7 -116 14 -98 22 -78';
  let scallops = 'M -44 -78';
  for (let x = -44; x < 44; x += 11) scallops += ` Q ${x + 5.5} -71.5 ${x + 11} -78`;
  const mastX = (y) => 24 + (y + 146) / (-338 + 146) * (9 - 24) * (1 - 0.18 * Math.sin(Math.PI * (y + 146) / (-338 + 146)));
  const lattice = [];
  for (const [y0, y1] of [[-146, -196], [-196, -244], [-244, -292]]) {
    lattice.push([`M ${f(-mastX(y0) + 2)} ${y0} L ${f(mastX(y1) - 2)} ${y1}`, 'F', { speed: 2.6 }]);
    lattice.push([`M ${f(mastX(y0) - 2)} ${y0} L ${f(-mastX(y1) + 2)} ${y1}`, 'F', { speed: 2.6 }]);
    lattice.push([`M ${f(-mastX(y1))} ${y1} L ${f(mastX(y1))} ${y1}`, 'F', { speed: 2.6 }]);
  }
  L.paris = {
    strokes: [
      ['M 0 0 L -96 0', 'M'], [EDGE_L, 'M'], [TOP, 'S', { speed: 1.1 }], [EDGE_R, 'M'], ['M 96 0 L 0 0', 'M', { speed: 1.6 }],
      [ARCH, 'S', { speed: 1.1 }], ['M -50 -70 L 50 -70', 'S'], ['M 47 -78 L -47 -78', 'F', { speed: 1.8 }],
      [scallops, 'F', { speed: 2.2 }], ['M -30 -141 L 30 -141', 'S'], ['M 28 -146 L -28 -146', 'F', { speed: 1.8 }],
      [GAP, 'F', { speed: 1.8 }], ...lattice,
    ],
    fills: [[[join(EDGE_L, TOP, EDGE_R) + ' Z', ARCH + ' Z', GAP + ' Z'], 'yel']],
    shade: [['M 0 -404 ' + EDGE_R.replace(/^M/, 'L') + ' L 47 0 L 0 -48 Z']],
    star: [0, -404],
  };
}

// ---------------------------------------------------------------- 尼斯 · Promenade des Anglais, the Baie des Anges
{
  const shore = 'M -262 -60 C -60 -60 80 -100 150 -170 C 165 -186 175 -194 186 -200';
  const prom = 'M -262 -20 C -60 -22 100 -64 196 -168';
  const hill = 'M 128 -200 C 150 -236 185 -262 215 -262 C 240 -262 256 -246 264 -232';
  const parasols = [[-214, -26, 1.0], [-140, -30, 0.92], [-66, -38, 0.82], [4, -52, 0.72], [64, -72, 0.6]];
  const strokes = [
    ['M -262 0 L 262 0', 'M'], [prom, 'M'], [shore, 'M'], ['M -262 -200 L 150 -200', 'S'], [hill, 'S'],
    ['M 205 0 C 210 -60 202 -120 214 -170', 'S'],
  ];
  const fills = [['M -262 -200 L 186 -200 C 175 -194 165 -186 150 -170 C 80 -100 -60 -60 -262 -60 Z', 'blue']];
  for (const [x, y, s] of parasols) {
    const top = y - 44 * s, r = 27 * s;
    const canopy = `M ${f(x - r)} ${f(top)} C ${f(x - r * 0.8)} ${f(top - 18 * s)} ${f(x + r * 0.8)} ${f(top - 18 * s)} ${f(x + r)} ${f(top)}`;
    const hem = `M ${f(x + r)} ${f(top)} Q ${f(x + r * 0.5)} ${f(top + 5 * s)} ${x} ${f(top)} Q ${f(x - r * 0.5)} ${f(top + 5 * s)} ${f(x - r)} ${f(top)}`;
    strokes.push([canopy + ' ' + hem.replace(/^M [^Q]+/, ''), 'S'], [`M ${x} ${f(top - 13 * s)} L ${x} ${y}`, 'F']);
    fills.push([canopy + ' ' + hem.replace(/^M [^Q]+/, '') + ' Z', 'red']);
  }
  strokes.push(
    ['M 214 -170 C 186 -186 164 -178 150 -154', 'F'], ['M 214 -170 C 238 -190 258 -184 270 -166', 'F'],
    ['M 214 -170 C 200 -200 182 -208 166 -204', 'F'], ['M 214 -170 C 232 -204 250 -210 262 -204', 'F'],
    [wave(-200, -150, 2, 9), 'F'], [wave(-60, -170, 2, 8), 'F'], [wave(60, -186, 2, 6), 'F'], [wave(-230, -96, 2, 8), 'F'], [wave(-100, -110, 2, 8), 'F'],
    ['M -262 -20 L 262 -20', 'F'],
  );
  for (let x = -250; x <= 250; x += 20) strokes.push([`M ${x} -20 L ${x} 0`, 'F', { speed: 4 }]);
  L.nice = { strokes, fills, shade: [[hill + ' L 264 -200 L 128 -200 Z']], ripple: [-150, -130, 0.7] };
}

// ---------------------------------------------------------------- 圣米歇尔山 · Mont-Saint-Michel at high tide
// rock 80 m, abbey spire to 157 m; island ≈ 1 km wide — drawn compressed to 470 × 400.
{
  const contour = 'M -235 -12 C -206 -28 -186 -44 -162 -56 L -150 -84 L -118 -96 C -100 -120 -92 -150 -78 -170 L -66 -212 L -56 -250 L -26 -262 L -16 -292 L -6 -306 L -3 -340 L 0 -398 L 3 -340 L 6 -306 L 22 -296 L 58 -282 L 66 -244 C 88 -226 104 -200 118 -170 C 140 -140 166 -110 180 -82 C 196 -56 214 -34 238 -12';
  const strokes = [
    ['M -270 -12 C -120 -2 120 -2 270 -12', 'M'], [contour, 'M'],
    ['M -178 -50 L 206 -42', 'S'], ['M 66 -244 L 66 -172 L 118 -170', 'S'], ['M -56 -250 L 58 -270', 'S'], ['M -66 -212 L 104 -200', 'S'],
    ['M -150 -84 L 172 -76', 'F'],
  ];
  for (const x of [-40, -12, 18, 44]) strokes.push([`M ${x} ${f(-256 - (x + 56) * 0.15)} L ${x} -214`, 'F']);
  for (let x = -170; x < 200; x += 18) strokes.push([`M ${x} ${f(-50 + (x + 178) * 0.021)} l 0 -7`, 'F', { speed: 4 }]);
  strokes.push(['M -140 -58 L -128 -72 L -116 -58 L -104 -74 L -92 -60', 'F'], ['M 118 -48 L 130 -64 L 142 -50 L 154 -64 L 166 -48', 'F'],
    ['M 76 -236 L 76 -220 M 90 -226 L 90 -210 M 104 -212 L 104 -196', 'F'],
    ['M -230 14 C -80 24 80 24 230 14', 'F'], [wave(-180, 2, 2, 8), 'F'], [wave(120, 4, 2, 8), 'F'], ['M -6 -306 L 6 -306', 'F']);
  L.msm = {
    strokes,
    fills: [[contour + ' Z', 'sand'], ['M -282 -12 C -120 -2 120 -2 282 -12 C 200 26 -200 26 -282 -12 Z', 'blue']],
    shade: [['M 0 -398 L 3 -340 L 6 -306 L 22 -296 L 58 -282 L 66 -244 C 88 -226 104 -200 118 -170 C 140 -140 166 -110 180 -82 C 196 -56 214 -34 238 -12 L 40 -12 Z']],
    ripple: [-60, 6, 1.0],
  };
}

// ---------------------------------------------------------------- 风车村 · Zaanse Schans smock mill; the sails turn slowly
// stage at ~⅓ of the body height, body tapers ~0.6, sail span ≈ 1.3 × body height.
{
  const hub = [0, -322];
  const strokes = [
    ['M -150 0 L 150 0', 'M'], ['M -95 0 L -95 -100', 'M'], ['M -82 -100 L -50 -298', 'M'],
    ['M -58 -298 C -56 -330 -30 -352 0 -354 C 30 -352 56 -330 58 -298', 'M'], ['M 50 -298 L 82 -100', 'M'], ['M 95 -100 L 95 0', 'M'],
    ['M -58 -298 L 58 -298', 'S'], ['M -134 -100 L 134 -100', 'S'], ['M -134 -122 L 134 -122', 'F'],
    ['M -16 0 L -16 -40 Q 0 -56 16 -40 L 16 0', 'F'], ['M -24 -100 L -14 -298 M 24 -100 L 14 -298', 'F'],
    ['M -8 -224 L 8 -224 L 8 -204 L -8 -204 Z', 'F'],
  ];
  for (const x of [-134, -96, 96, 134]) strokes.push([`M ${x} -100 L ${x} -122`, 'F', { speed: 4 }]);
  const fills = [
    [Z([[-82, -100], [-50, -298], [50, -298], [82, -100]]), 'green'],
    ['M -58 -298 C -56 -330 -30 -352 0 -354 C 30 -352 56 -330 58 -298 Z', 'red'],
    [rect(-95, 0, 95, -100), 'redT'],
  ];
  for (let k = 0; k < 4; k++) {           // sails, around the hub (part 'sails')
    const a = Math.PI / 4 + (k * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a), pt = (r, o) => [r * c - o * s, r * s + o * c];
    strokes.push([P([pt(8, 0), pt(212, 0)]), 'S', { part: 'sails' }]);
    strokes.push([P([pt(52, 4), pt(52, 34), pt(212, 34), pt(212, 4)]), 'F', { part: 'sails' }]);
    for (let r = 84; r < 212; r += 32) strokes.push([P([pt(r, 0), pt(r, 34)]), 'F', { part: 'sails', speed: 4 }]);
    strokes.push([P([pt(52, 19), pt(212, 19)]), 'F', { part: 'sails', speed: 4 }]);
  }
  strokes.push([circ(0, 0, 9), 'S', { part: 'sails' }]);
  L.mill = {
    strokes, fills, shade: [[Z([[0, -100], [0, -298], [50, -298], [82, -100]])]],
    parts: { sails: (tl) => ({ rot: 0.42 * Math.max(0, tl), x: hub[0], y: hub[1] }) },
  };
}

// ---------------------------------------------------------------- 库肯霍夫花园 · rows of tulips opening one after another
{
  const back = [], front = [];
  for (let i = 0; i < 8; i++) back.push({ x: -238 + i * 68, y: -118, h: 74 + (i % 3) * 8, r: 13, c: i % 2 ? 'red' : 'yel' });
  for (let i = 0; i < 7; i++) front.push({ x: -222 + i * 74, y: 0, h: 150 + ((i * 37) % 3) * 14, r: 21, c: i % 2 ? 'yel' : 'red' });
  const strokes = [['M -270 0 L 270 0', 'M'], ['M -262 -118 L 262 -118', 'S']];
  const fills = [];
  const tulips = [];
  for (const row of [back, front]) for (const t of row) {
    const lean = ((t.x * 13) % 7) / 3 - 1;
    const top = [t.x + lean * 6, t.y - t.h];
    strokes.push([`M ${t.x} ${t.y} C ${t.x} ${f(t.y - t.h * 0.5)} ${f(top[0])} ${f(t.y - t.h * 0.6)} ${f(top[0])} ${f(top[1])}`, 'S']);
    const lw = t.r * 1.1, lh = t.h * 0.55, side = t.x % 2 ? 1 : -1;
    const leaf = `M ${t.x} ${t.y} C ${f(t.x + side * lw)} ${f(t.y - lh * 0.3)} ${f(t.x + side * lw * 1.3)} ${f(t.y - lh * 0.8)} ${f(t.x + side * lw * 0.6)} ${f(t.y - lh)} C ${f(t.x + side * lw * 0.5)} ${f(t.y - lh * 0.6)} ${f(t.x + side * 3)} ${f(t.y - lh * 0.3)} ${t.x} ${t.y}`;
    strokes.push([leaf, 'F']);
    fills.push([leaf + ' Z', 'green']);
    tulips.push({ x: top[0], y: top[1], r: t.r, c: t.c });
  }
  L.tulips = { strokes, fills, shade: [], tulips };
}

// ---------------------------------------------------------------- 少女峰 · the Jungfrau, with the red cog train climbing
{
  const peak = 'M -280 0 L -232 -70 L -202 -96 L -170 -168 L -132 -206 L -98 -278 L -62 -330 L -30 -400 L 0 -352 L 30 -340 L 70 -282 L 110 -250 L 150 -208 L 190 -150 L 230 -100 L 280 0';
  const ridge = 'M -30 -400 L -40 -330 L -18 -252 L -48 -180 L -26 -102 L -56 -16';
  const track0 = [-120, -6], track1 = [236, -70];
  const ang = Math.atan2(track1[1] - track0[1], track1[0] - track0[0]);
  const strokes = [
    [peak, 'M'], [ridge, 'S'],
    ['M -186 -122 L -158 -112 L -134 -132 L -104 -116', 'F'], ['M 60 -162 L 90 -172 L 120 -150 L 150 -162', 'F'],
    ['M -104 -232 L -84 -216 L -66 -242', 'F'], ['M 6 -300 L 26 -286 L 44 -300', 'F'], ['M -150 -60 L -124 -48 L -100 -66', 'F'],
    [P([track0, track1]), 'S'], [P([[track0[0] + 4, track0[1] + 9], [track1[0] + 4, track1[1] + 9]]), 'F'],
  ];
  for (let u = 0.04; u < 1; u += 0.06) {
    const x = track0[0] + (track1[0] - track0[0]) * u, y = track0[1] + (track1[1] - track0[1]) * u;
    strokes.push([`M ${f(x - 2)} ${f(y - 3)} L ${f(x + 5)} ${f(y + 12)}`, 'F', { speed: 5 }]);
  }
  const train = [
    ['M -36 0 L -36 -26 L 34 -26 L 38 -14 L 38 0 Z', 'S', { part: 'train', g: 1 }],
    ['M -30 -32 L 30 -32', 'F', { part: 'train', g: 1 }],
    ['M -28 -20 L -16 -20 L -16 -10 L -28 -10 Z M -8 -20 L 4 -20 L 4 -10 L -8 -10 Z M 12 -20 L 24 -20 L 24 -10 L 12 -10 Z', 'F', { part: 'train', g: 1 }],
  ];
  L.jungfrau = {
    strokes: [...strokes, ...train],
    fills: [[join(ridge, 'M -30 -400 L 0 -352 L 30 -340 L 70 -282 L 110 -250 L 150 -208 L 190 -150 L 230 -100 L 280 0').replace(/L -30 -400 L 0/, 'L 0') + ' L -56 0 Z', 'blueT'],
      ['M -36 0 L -36 -26 L 34 -26 L 38 -14 L 38 0 Z', 'red', { part: 'train', g: 1 }]],
    shade: [['M -30 -400 L 0 -352 L 30 -340 L 70 -282 L 110 -250 L 150 -208 L 190 -150 L 230 -100 L 280 0 L 60 0 L 20 -200 Z']],
    parts: { train: (tl) => { const u = 0.36 + 0.05 * Math.max(0, tl); return { rot: ang, x: track0[0] + (track1[0] - track0[0]) * u, y: track0[1] + (track1[1] - track0[1]) * u - 4 }; } },
  };
}

// ---------------------------------------------------------------- 布达佩斯 · Heroes' Square: the Millennium column + colonnades
// column 36 m with Archangel Gabriel; the two quarter-circle colonnades ≈ 15 m high, curving towards the viewer.
{
  const cor = [[-334, -150], [-260, -132], [-170, -122], [-96, -120]];
  const base = [[-336, -20], [-262, -34], [-170, -44], [-96, -46]];
  const att = [[-334, -170], [-262, -150], [-170, -139], [-96, -137]];
  const cv = (p) => `M ${p[0][0]} ${p[0][1]} C ${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;
  const left = [[cv(base), 'M'], [cv(cor), 'M'], ['M -334 -150 L -336 -20', 'S'], ['M -96 -120 L -96 -46', 'S'], [cv(att), 'S'], ['M -334 -150 L -334 -170', 'S'], ['M -96 -120 L -96 -137', 'S']];
  for (let i = 1; i < 8; i++) {
    const u = i / 8, a = bez(...cor, u), b = bez(...base, u);
    left.push([`M ${f(a[0] - 3)} ${f(a[1] + 4)} L ${f(b[0] - 3)} ${f(b[1])} M ${f(a[0] + 3)} ${f(a[1] + 4)} L ${f(b[0] + 3)} ${f(b[1])}`, 'F', { speed: 3 }]);
  }
  const chariot = 'M -340 -170 L -336 -190 L -318 -198 L -304 -188 L -300 -170';
  left.push([chariot, 'F']);
  const colFill = `${cv(att)} L -96 -46 C -170 -44 -262 -34 -336 -20 Z`;
  const strokes = [
    ['M -110 0 L 110 0', 'M'],
    ['M -72 0 L -72 -40 L -50 -40 L -50 -64 L 50 -64 L 50 -40 L 72 -40 L 72 0', 'S'],
    ['M -14 -64 L -10 -322', 'M'], ['M 10 -322 L 14 -64', 'M'], ['M -20 -322 L 20 -322 L 16 -334 L -16 -334 Z', 'S'],
    ['M -5 -334 L -4 -370 L 4 -370 L 5 -334', 'S'],
    ['M -4 -362 C -20 -370 -30 -386 -27 -398 C -17 -390 -9 -380 -2 -370', 'F'], ['M 4 -362 C 20 -370 30 -386 27 -398 C 17 -390 9 -380 2 -370', 'F'],
    [circ(0, -376, 4.5), 'F'], ['M 9 -360 L 9 -398 M 4 -390 L 14 -390', 'F'],
    ['M -64 -40 Q -58 -56 -48 -52 M 64 -40 Q 58 -56 48 -52 M -30 -64 L -30 -90 M 30 -64 L 30 -90', 'F'],
    ...left.map(([d, p, o]) => [d, p, { ...(o || {}), g: 0 }]),
    ...left.map(([d, p, o]) => [mirror(d), p, { ...(o || {}), g: 0 }]),
  ];
  for (let y = -110; y > -320; y -= 52) strokes.push([`M ${f(-13 + (y + 64) / 258 * -3 * -1)} ${y} L ${f(13 - (y + 64) / 258 * 3 * -1)} ${y}`, 'F', { speed: 4 }]);
  const gab = 'M -5 -334 L -4 -362 C -20 -370 -30 -386 -27 -398 C -17 -390 -9 -380 -2 -370 L 2 -370 C 9 -380 17 -390 27 -398 C 30 -386 20 -370 4 -362 L 5 -334 Z';
  L.budapest = {
    strokes,
    fills: [[colFill, 'sand'], [mirror(colFill), 'sand'], ['M -14 -64 L -10 -322 L 10 -322 L 14 -64 Z', 'sandT'],
      ['M -20 -322 L 20 -322 L 16 -334 L -16 -334 Z', 'yel'], [gab, 'yel'], [chariot + ' Z', 'yel'], [mirror(chariot) + ' Z', 'yel']],
    shade: [[mirror(colFill)], ['M 0 -64 L 0 -322 L 10 -322 L 14 -64 Z']],
  };
}

// ---------------------------------------------------------------- 哈尔施塔特 · lakeside village and its mirror image
{
  const houses = [[-262, 56, 70, 28], [-206, 50, 92, 26], [-156, 54, 76, 30], [-102, 40, 104, 24], [20, 54, 86, 30], [74, 50, 70, 26], [124, 60, 98, 34], [184, 70, 76, 30]];
  const strokes = [['M -280 0 L 280 0', 'M'], ['M -282 -232 C -226 -330 -150 -304 -100 -250 C -40 -188 40 -232 122 -282 C 182 -322 240 -302 282 -250', 'M']];
  const refl = [];
  const hd = (x0, w, h, r) => `M ${x0} 0 L ${x0} ${-h} L ${f(x0 + w / 2)} ${-h - r} L ${x0 + w} ${-h} L ${x0 + w} 0`;
  for (const [x0, w, h, r] of houses) {
    strokes.push([hd(x0, w, h, r), 'S']);
    strokes.push([`M ${x0 + 12} ${-h + 22} l 9 0 l 0 12 l -9 0 Z M ${x0 + w - 21} ${-h + 22} l 9 0 l 0 12 l -9 0 Z`, 'F', { speed: 4 }]);
    refl.push([hd(x0, w, h * 0.8, r * 0.8).replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => `${x} ${f(-y)}`), 'F', { alpha: 0.55, g: 1 }]);
  }
  // the Evangelical church: nave + slim spire (the village's signature)
  const church = 'M -60 0 L -60 -84 L -14 -84 M -14 0 L -14 -170 L -1 -258 L 12 -170 L 12 0';
  strokes.push([church, 'M'], ['M -14 -170 L 12 -170', 'S'], ['M -6 -140 L -6 -122 L 4 -122 L 4 -140 Z', 'F'], ['M -60 -84 L -37 -104 L -14 -84', 'S']);
  refl.push(['M -14 0 L -14 136 L -1 206 L 12 136 L 12 0', 'F', { alpha: 0.55, g: 1 }]);
  strokes.push(['M -250 40 L -180 40', 'F', { g: 1 }], ['M 60 70 L 160 70', 'F', { g: 1 }], ['M -120 110 L -40 110', 'F', { g: 1 }]);
  L.hallstatt = {
    strokes: [...strokes, ...refl],
    fills: [['M -282 -232 C -226 -330 -150 -304 -100 -250 C -40 -188 40 -232 122 -282 C 182 -322 240 -302 282 -250 L 282 -40 L -282 -40 Z', 'green'],
      ...houses.map(([x0, w, h, r]) => [hd(x0, w, h, r) + ' Z', 'paper']), ['M -60 0 L -60 -84 L -14 -84 L -14 -170 L -1 -258 L 12 -170 L 12 0 Z', 'paper'],
      ['M -282 0 L 282 0 L 282 150 C 120 172 -120 172 -282 150 Z', 'blue', { g: 1 }]],
    shade: [['M 122 -282 C 182 -322 240 -302 282 -250 L 282 -40 L 122 -40 Z']],
    ripple: [70, 40, 1.2],
  };
}

// ---------------------------------------------------------------- 新天鹅堡 · Neuschwanstein on its wooded crag
// main tower ≈ 65 m above the crag; palas with steep slate roof; slim towers with pale-blue cones.
{
  // tree tops along a slope
  const scallop = (a, b, n) => { let d = ''; for (let i = 1; i <= n; i++) { const u = i / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; const px = a[0] + (b[0] - a[0]) * (u - 0.5 / n), py = a[1] + (b[1] - a[1]) * (u - 0.5 / n) - 16; d += ` Q ${f(px)} ${f(py)} ${f(x)} ${f(y)}`; } return d; };
  const hill = 'M -276 0' + scallop([-276, 0], [-206, -40], 3) + scallop([-206, -40], [-150, -122], 4) + ' L 168 -122' + scallop([168, -122], [222, -40], 4) + scallop([222, -40], [276, 0], 3);
  const strokes = [
    ['M -276 0 L 276 0', 'M'], [hill, 'M'],
    ['M -182 -120 L -182 -232 L -92 -232 L -92 -120', 'M'], ['M -40 -120 L -40 -338', 'M'], ['M -10 -338 L -10 -120', 'M'],
    ['M -48 -338 L -25 -404 L -2 -338 Z', 'M'], ['M 30 -120 L 30 -300 L 170 -300 L 170 -120', 'M'],
    ['M 24 -300 L 52 -346 L 148 -346 L 176 -300', 'S'], ['M 148 -346 L 160 -366 L 172 -346', 'S'],
    ['M 6 -120 L 6 -296 M 24 -296 L 24 -150', 'S'], ['M 1 -296 L 15 -350 L 29 -296', 'S'],
    ['M -190 -232 L -190 -258 L -172 -258 L -172 -232 M -102 -232 L -102 -258 L -84 -258 L -84 -232', 'S'],
    ['M -194 -258 L -181 -292 L -168 -258 M -106 -258 L -93 -292 L -80 -258', 'S'],
    ['M -92 -200 L -40 -200 M -10 -210 L 6 -210', 'S'], ['M -48 -338 L -2 -338', 'F'],
  ];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) strokes.push([arch(48 + c * 30, 60 + c * 30, -150 - r * 48, -180 - r * 48), 'F', { speed: 4 }]);
  strokes.push([arch(-30, -20, -270, -296), 'F'], [arch(-30, -20, -210, -236), 'F'], [arch(-150, -124, -120, -170), 'F'],
    ['M -236 -20 l 9 -18 l 9 18 M -214 -46 l 9 -18 l 9 18 M -196 -74 l 9 -18 l 9 18 M 196 -70 l 9 -18 l 9 18 M 214 -44 l 9 -18 l 9 18 M 236 -18 l 9 -18 l 9 18 M -150 -60 l 9 -18 l 9 18 M 120 -40 l 9 -18 l 9 18 M -40 -30 l 9 -18 l 9 18 M 60 -80 l 9 -18 l 9 18', 'F']);
  L.neusch = {
    strokes,
    fills: [[hill + ' Z', 'green'], ['M -48 -338 L -25 -404 L -2 -338 Z', 'blueT'], ['M 24 -300 L 52 -346 L 148 -346 L 160 -366 L 172 -346 L 176 -300 Z', 'blueT'],
      ['M 1 -296 L 15 -350 L 29 -296 Z', 'blueT'], ['M -194 -258 L -181 -292 L -168 -258 Z', 'blueT'], ['M -106 -258 L -93 -292 L -80 -258 Z', 'blueT']],
    shade: [[rect(130, -120, 170, -300)], [rect(-25, -120, -10, -338)]],
  };
}

// ---------------------------------------------------------------- 剑桥 · King's College Chapel from the Backs, a punt on the Cam
// chapel 88 m long × 24 m to the parapet, corner turrets ≈ 44 m: 416 × 150, turrets to −342.
{
  const turret = 'M -232 -50 L -232 -296 C -232 -312 -226 -322 -220 -344 C -214 -322 -208 -312 -208 -296 L -208 -50';
  const strokes = [['M -282 0 L 282 0', 'M'], [turret, 'M'], ['M -208 -200 L 208 -200', 'M'], [mirror(turret), 'M'], ['M -208 -50 L 208 -50', 'S']];
  const bay = 416 / 11;
  for (let k = 1; k < 11; k++) { const x = -208 + k * bay; strokes.push([`M ${f(x)} -50 L ${f(x)} -200 M ${f(x - 3)} -200 L ${f(x)} -226 L ${f(x + 3)} -200`, 'S', { speed: 2 }]); }
  for (let k = 0; k < 11; k++) { const x = -208 + (k + 0.5) * bay; strokes.push([arch(f(x - 11), f(x + 11), -66, -186), 'F', { speed: 3.5 }], [`M ${f(x - 11)} -122 L ${f(x + 11)} -122 M ${f(x)} -66 L ${f(x)} -170`, 'F', { speed: 5 }]); }
  let bat = 'M -208 -200'; for (let x = -208; x < 208; x += 13) bat += ` L ${f(x)} -207 L ${f(x + 6.5)} -207 L ${f(x + 6.5)} -200 L ${f(x + 13)} -200`;
  strokes.push([bat, 'F'], ['M -232 -296 L -208 -296 M 208 -296 L 232 -296', 'F'], ['M -282 56 L 282 56', 'F']);
  const punt = [['M -70 -6 L 70 -6 L 62 6 L -62 6 Z', 'S', { part: 'punt', g: 1 }], ['M 46 -6 L 64 -92', 'F', { part: 'punt', g: 1 }]];
  L.cambridge = {
    strokes: [...strokes, ...punt, ['M -150 30 L -110 30 M 120 40 L 170 40', 'F', { g: 1 }]],
    fills: [['M -232 -50 L -232 -296 C -232 -312 -226 -322 -220 -344 C -214 -322 -208 -312 -208 -296 L -208 -200 L 208 -200 L 208 -296 C 208 -312 214 -322 220 -344 C 226 -322 232 -312 232 -296 L 232 -50 Z', 'sand'],
      [rect(-282, 0, 282, -50), 'green'], [rect(-282, 0, 282, 56), 'blue'],
      ['M -70 -6 L 70 -6 L 62 6 L -62 6 Z', 'ink', { part: 'punt', g: 1 }]],
    shade: [[rect(130, -50, 232, -200)], [mirror(turret).replace(/L 232 -50$/, '') + ' Z']],
    parts: { punt: (tl) => ({ rot: 0, x: -150 + 16 * Math.max(0, tl), y: 26 }) },
  };
}

// ---------------------------------------------------------------- 伦敦 · Big Ben (Elizabeth Tower), with a wing of the Palace
// 96 m: shaft ≈ 55 %, clock stage 55–71 %, belfry, then the steep spire roof; shaft width ≈ 12 % of the height.
{
  const strokes = [
    ['M -210 0 L 70 0', 'M'], ['M -22 0 L -22 -212', 'M'], ['M -30 -212 L -30 -284 L 30 -284 L 30 -212 Z', 'M'], ['M 22 -212 L 22 0', 'M'],
    ['M -28 -312 L -8 -372 L 8 -372 L 28 -312', 'M'], ['M -26 -284 L -26 -312 L 26 -312 L 26 -284', 'S'],
    ['M -8 -372 L -4 -386 L 0 -404 L 4 -386 L 8 -372', 'S'], [circ(0, -248, 21), 'S'],
    ['M -200 0 L -200 -92 L -22 -92', 'S'],
    ['M -30 -212 L -30 -222 M 30 -212 L 30 -222 M -33 -284 L -30 -300 L -27 -284 M 27 -284 L 30 -300 L 33 -284', 'F'],
    ['M -18 -300 L -18 -290 Q -12 -296 -6 -290 L -6 -300 M 6 -300 L 6 -290 Q 12 -296 18 -290 L 18 -300', 'F'],
    ['M -26 -312 L -22 -332 M 26 -312 L 22 -332 M -14 -340 L -14 -326 M 14 -340 L 14 -326', 'F'],
    ['M -9 -10 L -9 -204 M 9 -10 L 9 -204', 'F'], ['M -22 -60 L 22 -60 M -22 -110 L 22 -110 M -22 -160 L 22 -160', 'F'],
    ['M 0 -248 L -9 -256', 'F'],
  ];
  for (let a = 0; a < 12; a++) { const c = Math.cos((a * Math.PI) / 6), s = Math.sin((a * Math.PI) / 6); strokes.push([`M ${f(c * 16)} ${f(-248 + s * 16)} L ${f(c * 19)} ${f(-248 + s * 19)}`, 'F', { speed: 6 }]); }
  for (let x = -190; x < -30; x += 26) strokes.push([`M ${x} -92 L ${x + 3} -112 L ${x + 6} -92 M ${x + 9} -20 L ${x + 9} -50 Q ${x + 13} -58 ${x + 17} -50 L ${x + 17} -20`, 'F', { speed: 4 }]);
  strokes.push(['M 0 -248 L 0 -266', 'F', { part: 'hand' }]);
  L.london = {
    strokes,
    fills: [[['M -30 -212 L -30 -284 L -26 -284 L -26 -312 L -28 -312 L -8 -372 L 8 -372 L 28 -312 L 26 -312 L 26 -284 L 30 -284 L 30 -212 Z', circ(0, -248, 21)], 'yel'],
      [rect(-22, 0, 22, -212), 'sand'], [rect(-200, 0, -22, -92), 'sandT']],
    shade: [[rect(4, 0, 22, -212)], ['M 8 -372 L 28 -312 L 10 -312 Z']],
    parts: { hand: (tl) => ({ rot: 0.35 * Math.max(0, tl), x: 0, y: -248, pivot: [0, -248] }) },
  };
}

// ---------------------------------------------------------------- 哥本哈根 · Nyhavn's painted row houses on the harbour
{
  const H = [[70, -172, 'step', 'red'], [80, -204, 'tri', 'yel'], [72, -182, 'curve', 'blueT'], [84, -216, 'step', 'sand'],
    [74, -188, 'tri', 'redT'], [80, -206, 'curve', 'green'], [80, -176, 'tri', 'yelT']];
  const strokes = [['M -282 0 L 282 0', 'M']], fills = [];
  let x0 = -270;
  for (const [w, h, type, c] of H) {
    const x1 = x0 + w, xm = x0 + w / 2;
    let d;
    if (type === 'tri') d = `M ${x0} 0 L ${x0} ${h} L ${xm} ${h - 36} L ${x1} ${h} L ${x1} 0`;
    else if (type === 'step') d = `M ${x0} 0 L ${x0} ${h} L ${f(x0 + w * 0.2)} ${h} L ${f(x0 + w * 0.2)} ${h - 14} L ${f(x0 + w * 0.36)} ${h - 14} L ${f(x0 + w * 0.36)} ${h - 28} L ${f(x0 + w * 0.64)} ${h - 28} L ${f(x0 + w * 0.64)} ${h - 14} L ${f(x0 + w * 0.8)} ${h - 14} L ${f(x0 + w * 0.8)} ${h} L ${x1} ${h} L ${x1} 0`;
    else d = `M ${x0} 0 L ${x0} ${h} C ${x0} ${h - 20} ${f(xm - 14)} ${h - 18} ${xm} ${h - 38} C ${f(xm + 14)} ${h - 18} ${x1} ${h - 20} ${x1} ${h} L ${x1} 0`;
    strokes.push([d, 'M', { speed: 1.3 }]);
    fills.push([d + ' Z', c]);
    let win = '';
    const cols = w > 76 ? 3 : 2, cw = (w - 16) / cols;
    for (let r = 0; r < 4; r++) for (let k = 0; k < cols; k++) {
      const wx = x0 + 8 + k * cw + cw / 2 - 6, wy = h + 22 + r * 38;
      if (wy > -30) continue;
      win += ` M ${f(wx)} ${f(wy)} l 12 0 l 0 18 l -12 0 Z`;
    }
    strokes.push([win.trim(), 'F', { speed: 5 }], [`M ${f(xm - 8)} 0 L ${f(xm - 8)} -24 L ${f(xm + 8)} -24 L ${f(xm + 8)} 0`, 'F']);
    x0 = x1;
  }
  strokes.push(['M 112 34 L 230 34 L 216 50 L 124 50 Z', 'S', { g: 1 }], ['M 166 34 L 166 -150 M 166 -150 L 226 30 M 166 -120 L 120 32', 'F', { g: 1 }],
    ['M -250 24 L -200 24 M -120 44 L -60 44 M -10 22 L 40 22', 'F', { g: 1 }]);
  fills.push(['M -282 0 L 282 0 L 282 60 L -282 60 Z', 'blue', { g: 1 }], ['M 112 34 L 230 34 L 216 50 L 124 50 Z', 'ink', { g: 1 }]);
  L.cph = { strokes, fills, shade: [[rect(234, 0, 250, -176)]], ripple: [-140, 30, 1.0] };
}

// ---------------------------------------------------------------- 斯德哥尔摩 · Stadshuset: brick tower with the Three Crowns
// tower 106 m vs. the halls ≈ 30 m; lantern + spire with the three gilded crowns.
{
  const crown = (cx, cy, s) => `M ${f(cx - 9 * s)} ${f(cy)} L ${f(cx - 10 * s)} ${f(cy - 10 * s)} L ${f(cx - 5 * s)} ${f(cy - 5 * s)} L ${cx} ${f(cy - 12 * s)} L ${f(cx + 5 * s)} ${f(cy - 5 * s)} L ${f(cx + 10 * s)} ${f(cy - 10 * s)} L ${f(cx + 9 * s)} ${f(cy)} Z`;
  const crowns = [crown(110, -382, 0.9), crown(99, -364, 0.9), crown(121, -364, 0.9)];
  const strokes = [
    ['M -282 0 L 282 0', 'M'], ['M -262 0 L -262 -112 L 70 -112', 'M'], ['M 70 0 L 70 -300 L 150 -300 L 150 0', 'M'],
    ['M -272 -112 L -262 -126 L 70 -126', 'S'], ['M -262 -112 L -262 -170 L -228 -170 L -228 -112', 'S'], ['M -266 -170 L -245 -196 L -224 -170', 'S'],
    ['M 86 -300 L 86 -330 L 134 -330 L 134 -300', 'S'], ['M 84 -330 C 90 -352 130 -352 136 -330', 'S'], ['M 110 -346 L 110 -366', 'F'],
    ['M 64 -300 L 64 -316 L 76 -316 L 76 -300 M 144 -300 L 144 -316 L 156 -316 L 156 -300', 'F'], ['M 70 -286 L 150 -286', 'F'],
    ...crowns.map((d) => [d, 'F']),
  ];
  for (let x = -230; x < 60; x += 30) strokes.push([`M ${x} 0 L ${x} -40 Q ${x + 12} -56 ${x + 24} -40 L ${x + 24} 0`, 'F', { speed: 4 }]);
  for (let x = -224; x < 60; x += 24) strokes.push([`M ${x} -70 l 0 -24 l 10 0 l 0 24`, 'F', { speed: 5 }]);
  for (const y of [-80, -150, -220]) strokes.push([`M 96 ${y} l 0 -36 l 10 0 l 0 36 M 114 ${y} l 0 -36 l 10 0 l 0 36`, 'F', { speed: 4 }]);
  strokes.push(['M -200 26 L -150 26 M 0 40 L 60 40 M 170 22 L 230 22', 'F', { g: 1 }]);
  L.stockholm = {
    strokes,
    fills: [[rect(-262, 0, 70, -112), 'redT'], ['M -272 -112 L -262 -126 L 70 -126 L 70 -112 Z', 'red'], [rect(70, 0, 150, -300), 'red'],
      [rect(-262, -112, -228, -170), 'red'], ...crowns.map((d) => [d, 'yel']), ['M -282 0 L 282 0 L 282 50 L -282 50 Z', 'blue', { g: 1 }]],
    shade: [[rect(124, 0, 150, -300)]],
    ripple: [-60, 22, 1.1],
  };
}

// ---------------------------------------------------------------- 威尼斯 · a gondola gliding down a canal
{
  const strokes = [
    ['M -282 10 L -24 -150', 'M'], ['M 282 10 L 104 -150', 'M'], ['M -282 -310 L -24 -236', 'M'], ['M 282 -296 L 104 -232', 'M'],
    ['M -24 -236 L -24 -150 M 104 -232 L 104 -150', 'S'], ['M -180 -281 L -180 -54 M -96 -257 L -96 -105 M 200 -266 L 200 -64 M 150 -248 L 150 -108', 'S'],
    ['M -36 -150 Q 40 -200 116 -150', 'S'], ['M -36 -164 Q 40 -214 116 -164', 'F'],
  ];
  for (const [x0, x1, yb, yt] of [[-262, -244, -150, -250], [-226, -208, -150, -240], [-160, -146, -120, -222], [-134, -120, -132, -214], [-80, -68, -150, -206], [-56, -46, -158, -200],
    [182, 196, -110, -226], [214, 230, -96, -232], [244, 262, -80, -240], [126, 138, -136, -214], [160, 172, -124, -220]]) strokes.push([arch(x0, x1, yb, yt), 'F', { speed: 4 }]);
  strokes.push(['M -282 -120 L -180 -96 M 282 -110 L 200 -86', 'F'], ['M -200 -20 L -150 -20 M 120 -40 L 180 -40 M 0 -110 L 50 -110', 'F', { g: 1 }]);
  const hull = 'M -150 0 C -100 14 100 14 150 -4 C 162 -16 166 -32 160 -48 L 156 -40 C 150 -24 130 -12 100 -8 C 40 -4 -100 -4 -146 -10 C -160 -14 -166 -24 -164 -34 L -158 -32 C -158 -20 -154 -8 -150 0 Z';
  const g = [[hull, 'M', { part: 'gondola', g: 2 }], ['M 160 -48 L 172 -50 M 158 -40 L 170 -40 M 156 -32 L 168 -30', 'F', { part: 'gondola', g: 2 }],
    ['M -104 -8 L -108 -34 M -108 -34 L -60 26', 'F', { part: 'gondola', g: 2 }], ['M -20 -6 L -20 -22 L 30 -22 L 30 -6', 'F', { part: 'gondola', g: 2 }]];
  L.venice = {
    strokes: [...strokes, ...g],
    fills: [['M -282 10 L -24 -150 L 104 -150 L 282 10 Z', 'blue', { g: 1 }], [hull, 'ink', { part: 'gondola', g: 2 }]],
    shade: [['M 282 -296 L 104 -232 L 104 -150 L 282 10 Z']],
    parts: { gondola: (tl) => ({ rot: 0, x: 40 - 18 * Math.max(0, tl), y: -6 }) },
  };
}

// ---------------------------------------------------------------- 罗马 · the Spanish Steps, Trinità dei Monti and the Barcaccia
{
  const outl = 'M -108 -250 C -150 -212 -116 -172 -168 -142 C -222 -112 -180 -62 -262 -10';
  const steps = 'M -108 -250 C -150 -212 -116 -172 -168 -142 C -222 -112 -180 -62 -262 -10 L 262 -10 C 180 -62 222 -112 168 -142 C 116 -172 150 -212 108 -250 Z';
  const strokes = [
    ['M -282 -10 L 282 -10', 'M'], [outl, 'M'], [mirror(outl), 'M'], ['M -108 -250 L 108 -250', 'S'],
    ['M -86 -250 L -86 -392 M -54 -392 L -54 -250 M 54 -250 L 54 -392 M 86 -392 L 86 -250', 'M'],
    ['M -90 -392 C -88 -414 -52 -414 -50 -392 M 50 -392 C 52 -414 88 -414 90 -392', 'S'], ['M -70 -410 L -70 -424 M 70 -410 L 70 -424', 'F'], ['M -78 -360 l 0 -18 l 16 0 l 0 18 M 62 -360 l 0 -18 l 16 0 l 0 18', 'F'],
    ['M -54 -326 L 54 -326 M -54 -326 L 0 -352 L 54 -326', 'S'], ['M -90 -392 L -50 -392 M 50 -392 L 90 -392', 'F'],
    ['M -6 -250 L -6 -264 L 6 -264 L 6 -250 M -4 -264 L -2 -360 L 0 -370 L 2 -360 L 4 -264', 'S'],
    ['M -30 -250 L -30 -290 Q -20 -302 -10 -290 M 30 -250 L 30 -290 Q 20 -302 10 -290', 'F'],
  ];
  for (const y of [-198, -140, -84]) strokes.push([`M -150 ${y} L 150 ${y}`.replace('-150', f(-150 - (y + 250) * 0.3)).replace(/L 150/, `L ${f(150 + (y + 250) * 0.3)}`), 'S']);
  for (let y = -238; y > -260 + 250; y += 12) { if ([-198, -140, -84].some((v) => Math.abs(v - y) < 6)) continue; const w = 100 + (y + 250) * 0.6; strokes.push([`M ${f(-w)} ${y} L ${f(w)} ${y}`, 'F', { speed: 6 }]); }
  const az = [[-134, -214, 9], [-122, -196, 8], [-130, -178, 9], [-162, -146, 10], [-186, -124, 9], [-192, -100, 10], [-206, -66, 11], [-230, -36, 11], [-104, -240, 8], [-150, -136, 8], [-214, -50, 9]];
  const fills = [[steps, 'sand'], [rect(-86, -250, 86, -392), 'sandT']];
  for (const [x, y, r] of az) for (const s of [1, -1]) {
    const d = `M ${f(s * x - r)} ${y} C ${f(s * x - r)} ${f(y - r * 0.9)} ${f(s * x + r)} ${f(y - r * 0.9)} ${f(s * x + r)} ${y} C ${f(s * x + r * 0.6)} ${f(y + r * 0.5)} ${f(s * x - r * 0.6)} ${f(y + r * 0.5)} ${f(s * x - r)} ${y} Z`;
    fills.push([d, 'redT', { g: 1 }]); strokes.push([d, 'F', { g: 1, speed: 3 }]);
  }
  const boat = 'M -74 0 C -40 22 40 22 74 0 C 52 -12 -52 -12 -74 0 Z';
  strokes.push([boat, 'S', { g: 2 }], ['M -40 -4 C -20 6 20 6 40 -4 M -8 -2 L -8 -24 L 8 -24 L 8 -2 M -60 -4 L -82 -14 M 60 -4 L 82 -14', 'F', { g: 2 }]);
  fills.push([boat, 'paper', { g: 2 }]);
  L.rome = { strokes, fills, shade: [[steps.replace(/^M -108 -250 .*? L 262 -10/, 'M 0 -250 L 0 -10 L 262 -10')]], ripple: [0, 2, 0.6] };
}

// ---------------------------------------------------------------- 巴塞罗那 · Sagrada Família, the four Nativity bell towers
// towers ≈ 100 m (inner pair taller), portal ≈ 40 % of the tower height; mosaic finials in red / green / yellow.
{
  const strokes = [['M -190 0 L 190 0', 'M']], fills = [], shade = [];
  const towers = [[-112, -320, 40], [-40, -400, 44], [40, -400, 44], [112, -320, 40]];
  for (const [xc, top, w] of towers) {
    const yb = -150, n = 12, Lp = [], Rp = [];
    for (let i = 0; i <= n; i++) { const u = i / n, y = yb + (top - yb) * u, hw = (w / 2) * Math.pow(1 - u, 0.55) + 2; Lp.push([xc - hw, y]); Rp.push([xc + hw, y]); }
    strokes.push([P(Lp), 'M'], [P(Rp.slice().reverse()), 'M']);
    fills.push([Z([...Lp, ...Rp.slice().reverse()]), 'yelT']);
    shade.push([Z([[xc, yb], [xc, top], ...Rp.slice().reverse()])]);
    for (let i = 1; i < 8; i++) { const y = yb + (top - yb) * (i / 9), hw = (w / 2) * Math.pow(1 - i / 9, 0.55); strokes.push([`M ${f(xc - hw * 0.5)} ${f(y)} L ${f(xc + hw * 0.5)} ${f(y - 6)}`, 'F', { speed: 5 }]); }
    const fy = top - 4;
    const fin = `M ${xc} ${f(fy - 30)} L ${f(xc + 9)} ${f(fy - 12)} L ${xc} ${fy} L ${f(xc - 9)} ${f(fy - 12)} Z`;
    strokes.push([fin, 'S']);
    fills.push([fin, 'red'], [circ(xc, fy - 34, 5), 'yel'], [circ(xc - 5, fy - 14, 3.5), 'green'], [circ(xc + 5, fy - 18, 3.5), 'yel']);
    strokes.push([circ(xc, fy - 34, 5), 'F']);
  }
  const portal = 'M -164 0 L -164 -116 C -110 -140 -70 -150 -40 -170 M 40 -170 C 70 -150 110 -140 164 -116 L 164 0';
  strokes.push([portal, 'M'], ['M -40 -170 C -24 -196 -10 -230 0 -262 C 10 -230 24 -196 40 -170', 'S'],
    ['M -30 0 L -30 -80 Q 0 -122 30 -80 L 30 0', 'S'], ['M -120 0 L -120 -64 Q -100 -94 -80 -64 L -80 0 M 80 0 L 80 -64 Q 100 -94 120 -64 L 120 0', 'S'],
    ['M -150 -30 q 8 -10 16 0 q 8 10 16 0 M 118 -30 q 8 -10 16 0 q 8 10 16 0 M -14 -130 q 7 -9 14 0 q 7 9 14 0', 'F']);
  fills.push(['M -164 0 L -164 -116 C -110 -140 -70 -150 -40 -170 C -24 -196 -10 -230 0 -262 C 10 -230 24 -196 40 -170 C 70 -150 110 -140 164 -116 L 164 0 Z', 'yelT'],
    ['M -12 -224 L 0 -262 L 12 -224 Z', 'green']);
  L.sagrada = { strokes, fills, shade };
}

// ---------------------------------------------------------------- 格拉纳达 · the Alhambra's Court of the Lions
{
  const strokes = [['M -282 0 L 282 0', 'M'], ['M -270 -200 L 270 -200', 'M'], ['M -270 -40 L 270 -40', 'S'], ['M -270 -200 L -270 -40 M 270 -200 L 270 -40', 'S'],
    ['M -100 -214 L 0 -306 L 100 -214', 'M'], ['M -100 -214 L 100 -214', 'S'], ['M -270 -170 L 270 -170', 'F'], ['M -270 -214 L -100 -214 M 100 -214 L 270 -214', 'F']];
  const cols = [-246, -214, -182, -150, -126, -88, 88, 126, 150, 182, 214, 246];
  for (const x of cols) strokes.push([`M ${x - 2} -40 L ${x - 2} -142 M ${x + 2} -40 L ${x + 2} -142 M ${x - 6} -142 L ${x + 6} -142`, 'F', { speed: 3 }]);
  for (let i = 0; i < cols.length - 1; i++) {
    const a = cols[i] + 4, b = cols[i + 1] - 4;
    if (b - a > 120) continue;
    const m = (a + b) / 2, r = (b - a) / 2;
    strokes.push([`M ${a} -142 L ${a} -150 C ${a} ${f(-150 - r * 1.2)} ${b} ${f(-150 - r * 1.2)} ${b} -150 L ${b} -142`, 'F', { speed: 3 }]);
    strokes.push([`M ${f(m - r * 0.6)} -158 q ${f(r * 0.3)} -8 ${f(r * 0.6)} 0 q ${f(r * 0.3)} -8 ${f(r * 0.6)} 0`, 'F', { speed: 5 }]);
  }
  strokes.push(['M -84 -40 L -84 -160 C -60 -196 60 -196 84 -160 L 84 -40', 'S']);
  // the fountain: dodecagonal basin on twelve lions
  const basin = 'M -64 -50 C -64 -36 64 -36 64 -50 C 64 -64 -64 -64 -64 -50 Z';
  const fl = [[basin, 'S', { g: 1 }], ['M -24 -88 C -24 -80 24 -80 24 -88 Z M 0 -80 L 0 -58 M 0 -88 L 0 -100', 'F', { g: 1 }]];
  for (let i = 0; i < 6; i++) { const x = -54 + i * 21.6; fl.push([`M ${f(x - 8)} -10 L ${f(x - 8)} -30 C ${f(x - 8)} -42 ${f(x + 8)} -42 ${f(x + 8)} -30 L ${f(x + 8)} -10`, 'F', { g: 1 }]); }
  fl.push(['M -80 -10 L 80 -10', 'S', { g: 1 }]);
  const hedgeL = 'M -282 0 C -280 -36 -220 -46 -190 -30 C -170 -44 -130 -40 -126 0 Z';
  L.alhambra = {
    strokes: [...strokes, ...fl, [hedgeL, 'S', { g: 1 }], [mirror(hedgeL), 'S', { g: 1 }]],
    fills: [[rect(-270, -170, 270, -214), 'sand'], ['M -100 -214 L 0 -306 L 100 -214 Z', 'sand'], [rect(-270, -40, 270, 0), 'sandT'],
      ['M -80 -10 L 80 -10 L 64 -50 C 64 -64 -64 -64 -64 -50 L -80 -10 Z', 'paper', { g: 1 }], [basin, 'sand', { g: 1 }],
      [hedgeL, 'green', { g: 1 }], [mirror(hedgeL), 'green', { g: 1 }]],
    shade: [['M 0 -306 L 100 -214 L 0 -214 Z'], [rect(150, -170, 270, -214)]],
  };
}

// ---------------------------------------------------------------- 杜布罗夫尼克 · city walls, red roofs, Minčeta tower, the sea
{
  const wall = 'M -282 -14 L -282 -104 L -60 -112 L 90 -122 L 150 -232 L 150 -282 L 232 -282 L 232 -14';
  const strokes = [['M -282 -14 C -100 -20 100 -14 282 -14', 'M'], [wall, 'M']];
  let cren = 'M -282 -104'; for (let x = -282; x < 88; x += 16) { const y = -104 - (x + 282) * 0.0486; cren += ` L ${f(x)} ${f(y - 7)} L ${f(x + 8)} ${f(y - 7)} L ${f(x + 8)} ${f(y)} L ${f(x + 16)} ${f(y)}`; }
  let cren2 = 'M 150 -282'; for (let x = 150; x < 232; x += 13) cren2 += ` L ${x} -292 L ${x + 6.5} -292 L ${x + 6.5} -282 L ${x + 13} -282`;
  strokes.push([cren, 'S'], [cren2, 'S'], ['M 150 -232 L 232 -232', 'F'], ['M 170 -250 l 0 -14 M 210 -250 l 0 -14 M 190 -150 l 0 -16', 'F']);
  const fills = [];
  const roofs = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) {
    const x0 = -270 + i * 38 + r * 18, by = -110 - (x0 + 282) * 0.0486 - r * 26 - ((i * 7) % 3) * 6;
    if (x0 + 38 > 92) continue;
    const d = `M ${f(x0)} ${f(by)} L ${f(x0 + 8)} ${f(by - 22)} L ${f(x0 + 30)} ${f(by - 22)} L ${f(x0 + 38)} ${f(by)}`;
    roofs.push(d);
  }
  for (const d of roofs.slice().reverse()) { strokes.push([d, 'S', { g: 0, speed: 2 }]); fills.push([d + ' Z', 'red']); }
  strokes.push(['M -40 -150 L -40 -240 L -18 -240 L -18 -150', 'S'], ['M -44 -240 L -29 -280 L -14 -240', 'S'], ['M -36 -210 l 0 -16 l 10 0 l 0 16', 'F'],
    ['M 30 -160 C 32 -196 76 -196 78 -160', 'S'], ['M 54 -190 L 54 -204', 'F'],
    [wave(-220, 12, 2, 9), 'F'], [wave(-40, 24, 2, 9), 'F'], [wave(140, 14, 2, 9), 'F']);
  fills.push(['M -44 -240 L -29 -280 L -14 -240 Z', 'red'], ['M -282 -14 C -100 -20 100 -14 282 -14 L 282 44 L -282 44 Z', 'blue']);
  L.dubrovnik = { strokes, fills, shade: [[rect(200, -14, 232, -282)], ['M -282 -14 L -282 -44 L 150 -48 L 150 -14 Z']] };
}

// ---------------------------------------------------------------- 卢森堡市 · the Adolphe Bridge across the Pétrusse gorge
// one 85 m main arch, span:rise ≈ 2:1 here; the old town's slender cathedral spires behind.
{
  const archO = 'M -160 -40 C -150 -160 -80 -205 0 -206 C 80 -205 150 -160 160 -40';
  const archI = 'M -140 -40 C -132 -146 -70 -186 0 -187 C 70 -186 132 -146 140 -40';
  const strokes = [
    ['M -282 -170 C -200 -120 -120 -40 -40 20 L 40 20 C 120 -40 200 -120 282 -170', 'M'],
    ['M -292 -232 L 292 -232', 'M'], [archO, 'M'], ['M -292 -214 L 292 -214', 'S'], [archI, 'S'],
    ['M -160 -40 L -160 -214 M 160 -40 L 160 -214 M -200 -214 L -200 -96 M 200 -214 L 200 -96', 'S'],
    ['M -280 -150 C -276 -192 -214 -192 -210 -150 M 210 -150 C 214 -192 276 -192 280 -150', 'S'],
    ['M -134 -214 L -134 -170 Q -122 -186 -110 -170 L -110 -214 M 110 -214 L 110 -170 Q 122 -186 134 -170 L 134 -214', 'F'],
  ];
  for (let x = -280; x < 290; x += 18) strokes.push([`M ${x} -232 l 0 -12`, 'F', { speed: 6 }]);
  strokes.push(['M -292 -244 L 292 -244', 'F'],
    ['M -250 -244 L -250 -300 L -243 -344 L -236 -300 L -236 -244 M -214 -244 L -214 -290 L -208 -322 L -202 -290 L -202 -244 M -180 -244 L -180 -284 L -175 -312 L -170 -284 L -170 -244', 'S'],
    ['M -150 -244 L -150 -272 L -120 -272 L -120 -244 M -154 -272 L -135 -290 L -116 -272', 'F'],
    ['M -230 -120 a 14 12 0 1 0 1 0 M 220 -126 a 14 12 0 1 0 1 0 M -100 -10 a 12 10 0 1 0 1 0 M 96 -14 a 12 10 0 1 0 1 0', 'F', { g: 1 }]);
  L.luxembourg = {
    strokes,
    fills: [['M -282 -170 C -200 -120 -120 -40 -40 20 L 40 20 C 120 -40 200 -120 282 -170 L 282 30 L -282 30 Z', 'green'],
      [['M -292 -232 L 292 -232 L 292 -214 L 200 -214 L 200 -96 L 160 -40 L 140 -40 C 132 -146 70 -186 0 -187 C -70 -186 -132 -146 -140 -40 L -160 -40 L -200 -96 L -200 -214 L -292 -214 Z'], 'sand']],
    shade: [['M 0 -206 C 80 -205 150 -160 160 -40 L 200 -96 L 200 -214 L 0 -214 Z']],
  };
}

// ---------------------------------------------------------------- 布朗镇 · Bran Castle on its rock
{
  const rock = 'M -270 0 C -232 -40 -212 -90 -172 -120 L -146 -150 L 152 -150 C 182 -110 210 -60 270 0';
  const strokes = [
    ['M -282 0 L 282 0', 'M'], [rock, 'M'],
    ['M 60 -150 L 60 -290 M 130 -290 L 130 -150', 'M'], ['M 52 -290 L 95 -372 L 138 -290 Z', 'M'],
    ['M -120 -150 L -120 -280 L -60 -280 L -60 -150', 'M'], ['M -128 -280 L -90 -342 L -52 -280 Z', 'M'],
    ['M -60 -240 L 60 -240', 'S'], ['M -66 -240 L -40 -284 L 40 -284 L 66 -240', 'S'],
    ['M -168 -150 L -168 -210 L -132 -210 L -132 -150', 'S'], ['M -172 -210 L -150 -246 L -128 -210 Z', 'S'],
    ['M -100 -250 l 0 -14 l 10 0 l 0 14 M -100 -200 l 0 -14 l 10 0 l 0 14 M 80 -270 l 0 -14 l 10 0 l 0 14 M 100 -220 l 0 -14 l 10 0 l 0 14 M -30 -210 l 0 -12 l 10 0 l 0 12 M 10 -210 l 0 -12 l 10 0 l 0 12', 'F'],
    ['M -60 -190 L 60 -190 M -40 -190 L -40 -174 M 0 -190 L 0 -174 M 30 -190 L 30 -174', 'F'],
    ['M -220 -60 L -190 -80 L -200 -100 M -120 -110 L -96 -126 M 120 -100 L 150 -120 L 140 -136 M 200 -40 L 224 -60', 'F'],
  ];
  L.bran = {
    strokes,
    fills: [['M 52 -290 L 95 -372 L 138 -290 Z', 'red'], ['M -128 -280 L -90 -342 L -52 -280 Z', 'red'], ['M -66 -240 L -40 -284 L 40 -284 L 66 -240 Z', 'red'],
      ['M -172 -210 L -150 -246 L -128 -210 Z', 'red']],
    shade: [[rock.replace(/^M -270 0 .*? L 152 -150/, 'M 40 -150 L 152 -150') + ' L 40 0 Z'], [rect(104, -150, 130, -290)]],
  };
}

// ---------------------------------------------------------------- 奥斯维辛 · Birkenau: the tracks into the gatehouse (grey pencil only)
{
  const strokes = [
    ['M -110 110 L -12 -22', 'S'], ['M 110 110 L 12 -22', 'S'],
    ['M -282 -24 L 282 -24', 'S'], ['M -282 -24 L -282 -82 L -44 -82 M 44 -82 L 282 -82 L 282 -24', 'S'], ['M -290 -82 L -282 -98 L -44 -98 M 44 -98 L 282 -98 L 290 -82', 'S'],
    ['M -44 -24 L -44 -210 L 44 -210 L 44 -24', 'S'], ['M -54 -210 L -30 -252 L 30 -252 L 54 -210', 'S'],
    ['M -24 -24 L -24 -80 Q 0 -104 24 -80 L 24 -24', 'S'],
    ['M -40 -186 L 40 -186 M -30 -200 l 0 -10 M -10 -200 l 0 -10 M 10 -200 l 0 -10 M 30 -200 l 0 -10', 'F'],
  ];
  for (let i = 0; i < 9; i++) { const u = Math.pow(i / 9, 1.5), y = 104 - u * 124, hw = 118 - u * 104; strokes.push([`M ${f(-hw)} ${f(y)} L ${f(hw)} ${f(y)}`, 'F', { speed: 2 }]); }
  for (let x = -262; x < 270; x += 34) { if (Math.abs(x) < 60) continue; strokes.push([`M ${x} -56 l 12 0 l 0 12 l -12 0 Z`, 'F', { speed: 3 }]); }
  L.auschwitz = { strokes, fills: [], shade: [], grey: true };
}

// ---------------------------------------------------------------- 蒙达尔纪 · a small bridge over the canal
{
  const strokes = [
    ['M -282 -40 L -170 -60 M 170 -60 L 282 -40', 'S'], ['M -170 -60 C -80 -95 80 -95 170 -60', 'M'], ['M -100 0 C -90 -66 90 -66 100 0', 'M'],
    ['M -170 -82 C -80 -117 80 -117 170 -82', 'S'], ['M -170 -60 L -170 -82 M 170 -60 L 170 -82', 'S'],
    ['M -100 0 C -90 56 90 56 100 0', 'F', { alpha: 0.55, g: 1 }],
    ['M -282 0 L -100 0 M 100 0 L 282 0', 'S'],
    ['M -250 -40 L -250 -120 L -210 -150 L -170 -120 L -170 -62 M 180 -64 L 180 -130 L 220 -158 L 260 -130 L 260 -44', 'F'],
    ['M -236 -80 l 0 -16 l 10 0 l 0 16 M 206 -90 l 0 -16 l 10 0 l 0 16', 'F'],
    [wave(-200, 30, 2, 9), 'F', { g: 1 }], [wave(140, 40, 2, 9), 'F', { g: 1 }],
  ];
  for (let x = -150; x <= 150; x += 20) { const yb = -60 - 35 * (1 - Math.pow(x / 170, 2)) * 1.0, yt = yb - 22; strokes.push([`M ${x} ${f(yb)} L ${x} ${f(yt)}`, 'F', { speed: 5 }]); }
  const tree = (x, y, r) => `M ${x - r} ${y} C ${x - r * 1.2} ${y - r * 1.4} ${x - r * 0.2} ${y - r * 2} ${x + r * 0.3} ${y - r * 1.7} C ${x + r * 1.3} ${y - r * 1.7} ${x + r * 1.3} ${y - r * 0.3} ${x + r} ${y} Z`;
  const trees = [tree(-190, -140, 40), tree(232, -150, 44), tree(-110, -112, 26)];
  for (const d of trees) strokes.push([d, 'S', { g: 0 }]);
  L.montargis = {
    strokes,
    fills: [['M -250 0 L 250 0 L 236 56 C 80 66 -80 66 -236 56 Z', 'blue', { g: 1 }], ...trees.map((d) => [d, 'green']),
      ['M -170 -60 C -80 -95 80 -95 170 -60 L 170 -82 C 80 -117 -80 -117 -170 -82 Z', 'sandT']],
    shade: [[trees[1]]],
    ripple: [30, 30, 0.55],
  };
}
