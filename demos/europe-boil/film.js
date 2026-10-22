// 欧洲手札 / Drawn Across Europe — 3 s style sample in 逐帧手绘 / line boil (opening + the 巴黎 hero stop).
// Same beats as demos/europe-sample, re-done as hand-inked cels: 24 fps animated on twos (threes for the end hold),
// variable-width brush, off-register colour fills, paper tooth.
// v3 — no line boil anywhere: every shape gets its hand-drawn wobble once, in its own local space, and keeps it, so
// nothing shimmers while it holds or while the camera moves.
// v2 — a calmer hand: no overshoot, squash or smear; things ink in and settle. The tower follows the real proportions
// (platforms at 19 % / 38 % / 92 % of the height) with a second, finer pen for the lattice details.
// Brush / boil primitives come from the 05-cel-boil engine.
import { PAL, hs, hr, clamp, lerp, E, arclen, resample, prefix, circlePts, boil, inkStroke, inkLoop, fillShape, hatch }
  from '/demos/05-cel-boil/js/engine.js';

const W = 1920, H = 1080, FPS = 24, DUR = 3;
window.DEMO = { width: W, height: H, fps: FPS, duration: DUR, motionBlur: { samples: 1, shutter: 0.5 } };

const PENCIL = '#6b5446';
const CN = '"Hannotate SC", "HanziPen SC", "Kaiti SC", serif';

// ---------- exposure sheet (frames @24): [from, to, exposure] — twos throughout, threes on the end hold ----------
const SCHED = [[0, 69, 2], [69, 72, 3]];
function drawing(f) {
  let id = 0;
  for (const [a, b, s] of SCHED) {
    if (f >= b) { id += Math.ceil((b - a) / s); continue; }
    const k = Math.floor((f - a) / s);
    return { fq: a + k * s, id: id + k, step: s };
  }
  return { fq: 71, id, step: 3 };
}

// ---------- timing (seconds, read on the exposed frame; hit times match audio.py) ----------
const T = {
  drop: [0, 0.3],            // the ink blot bleeds open on Paris
  coast: [0.17, 1.42],
  title: 0.25,               // char i inks in at title + i·(4 frames)
  sub: [0.83, 1.1],
  titleOut: [1.25, 1.55],
  year: [0.5, 0.85],
  push: [1.08, 2.0],
  tower: [1.5, 2.67],
  fill: [2.25, 2.55],
  label: 2.17,
  tail: [2.67, 3.0],
  spark: 2.75,
};
const inv = (a, b, x) => clamp((x - a) / (b - a));
const prog = (r, t) => inv(r[0], r[1], t);
const io = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
// gentle arrival: fade + a few px of settle, never past the rest pose
const settle = (t, t0, d = 0.33) => { const u = inv(t0, t0 + d, t); return { a: E.out2(u), k: E.out3(u), on: u > 0 }; };

const svg = document.getElementById('svg');
function measure(d) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d); svg.appendChild(el); return el;
}
function sample(el, step = 1.6) {
  const L = el.getTotalLength(), n = Math.max(2, Math.ceil(L / step)), out = [];
  for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((L * i) / n); out.push([p.x, p.y]); }
  return out;
}

// ---------- map (world = wide-view pixels) ----------
const land = await (await fetch('/demos/22-hud/assets/land-50m.json')).json();
const geo = topojson.feature(land, land.objects.land);
const proj = d3.geoConicEqualArea().parallels([43, 62]).rotate([-10, 0])
  .fitExtent([[120, 70], [W - 120, H - 50]], { type: 'MultiPoint', coordinates: [[-10, 35], [30, 35], [-10, 61], [30, 61]] });
proj.clipExtent([[-400, -400], [W + 400, H + 400]]);
const PARIS = proj([2.3522, 48.8566]);
const rings = [];
{
  let cur = null;
  const sink = {
    moveTo(x, y) { cur = [[x, y]]; rings.push(cur); }, lineTo(x, y) { cur.push([x, y]); },
    closePath() { if (cur) cur.push([cur[0][0], cur[0][1]]); }, arc() {},
  };
  d3.geoPath(proj, sink)(geo);
}
const coast = rings.map((r) => {
  const pts = boil(resample(r, 2.2), 7, 0.55, 18);   // hand-traced wobble, baked once: the background plate never boils
  const L = arclen(pts).at(-1);
  let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
  return { pts, L, dist: Math.hypot(cx - PARIS[0], cy - PARIS[1]) };
}).filter((r) => r.L > 14);
const maxDist = Math.max(...coast.map((r) => r.dist));

// ---------- the Eiffel Tower ----------
// Local units, base centre (0,0), y up = negative, antenna tip at −404 (≈330 m → 1.22 px/m): first platform at 57 m (−70),
// second at 115 m (−141), top deck at 276 m (−338); base 125 m wide. Strokes are inked in this order, like an illustrator:
// contour first (main pen), then platforms, then lattice with a finer pen. [d, width, speed, boilAmp]
const MAIN = 4.6, MID = 3.2, FINE = 1.9;
const EDGE_L = 'M -78 0 C -64 -22 -51 -47 -43 -70 L -41 -78 C -35 -102 -29 -124 -25 -141 L -24 -146 C -17 -216 -12 -288 -9 -338';
const EDGE_R = 'M 9 -338 C 12 -288 17 -216 24 -146 L 25 -141 C 29 -124 35 -102 41 -78 L 43 -70 C 51 -47 64 -22 78 0';
const TOP = 'M -9 -338 L -13 -338 L -13 -346 L -4 -346 L -2.4 -378 L 0 -404 L 2.4 -378 L 4 -346 L 13 -346 L 13 -338 L 9 -338';
const ARCH = 'M 47 0 C 44 -26 28 -46 0 -48 C -28 -46 -44 -26 -47 0';
let scallops = 'M -44 -78';
for (let x = -44; x < 44; x += 11) scallops += ` Q ${x + 5.5} -71.5 ${x + 11} -78`;
const mastX = (y) => 24 + (y + 146) / (-338 + 146) * (9 - 24) * (1 - 0.18 * Math.sin(Math.PI * (y + 146) / (-338 + 146)));
const lattice = [];
for (const [y0, y1] of [[-146, -196], [-196, -244], [-244, -292]]) {
  lattice.push([`M ${-mastX(y0) + 2} ${y0} L ${mastX(y1) - 2} ${y1}`, FINE, 2.6, 0.7]);
  lattice.push([`M ${mastX(y0) - 2} ${y0} L ${-mastX(y1) + 2} ${y1}`, FINE, 2.6, 0.7]);
  lattice.push([`M ${-mastX(y1)} ${y1} L ${mastX(y1)} ${y1}`, FINE, 2.6, 0.7]);
}
const STROKES = [
  ['M 0 0 L -96 0', MAIN, 1, 1.1],                                    // ground line out of the Paris dot
  [EDGE_L, MAIN, 1, 1.1],                                             // left contour, foot to top deck
  [TOP, MID, 1.1, 0.8],                                               // top deck + antenna
  [EDGE_R, MAIN, 1, 1.1],                                             // right contour down to the foot
  ['M 96 0 L 0 0', MAIN, 1.6, 1.1],                                   // ground line back to the dot
  [ARCH, MID, 1.1, 1.0],                                              // the great arch
  ['M -50 -70 L 50 -70', MID, 1.5, 0.9],                              // first platform
  ['M 47 -78 L -47 -78', FINE + 0.6, 1.8, 0.8],
  [scallops, FINE, 2.2, 0.6],                                         // the arched frieze under the first-floor rail
  ['M -30 -141 L 30 -141', MID, 1.6, 0.9],                            // second platform
  ['M 28 -146 L -28 -146', FINE + 0.6, 1.8, 0.8],
  ['M -22 -78 C -14 -98 -7 -116 0 -132 C 7 -116 14 -98 22 -78', FINE + 0.6, 1.8, 0.8],   // the gap between the legs
  ...lattice,
];
const strokes = STROKES.map(([d, w, speed, amp], i) => { const el = measure(d); return { L: el.getTotalLength(), w, speed, pts: boil(sample(el), 11 + i, amp * 0.9, 40) }; });
const towerCost = strokes.reduce((a, s) => a + s.L / s.speed, 0);
const edgeL = sample(measure(EDGE_L)), edgeR = sample(measure(EDGE_R)), topPts = sample(measure(TOP));
const silhouette = boil([...edgeL, ...topPts, ...edgeR], 18, 1.2, 44);          // closes along the ground from the right foot to the left
const archHole = boil(sample(measure(ARCH)), 18, 1.2, 44);
const gapHole = boil(sample(measure('M -22 -78 C -14 -98 -7 -116 0 -132 C 7 -116 14 -98 22 -78')), 18, 1.2, 44);
const shadeSide = [[0, -404], ...edgeR.slice(), [47, 0], [0, -48], [0, -404]];
const TAIL = boil(sample(measure('M 0 -404 C 60 -470 190 -470 260 -380 C 320 -300 330 -160 400 -60'), 3), 19, 0.9, 40);
// unit shapes (radius 10) with their wobble baked in; scaled and placed per frame
const BLOT = boil(circlePts(0, 0, 10, 30), 21, 0.9, 30), CORE = boil(circlePts(0, 0, 10, 18), 22, 0.7, 30);
const SPECK = boil(circlePts(0, 0, 10, 10), 23, 0.6, 20), RIPPLE = boil(circlePts(0, 0, 10, 48), 24, 0.25, 12);
const STAR = (() => { const s = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? 3.2 : 10; s.push([Math.cos(a) * r, Math.sin(a) * r]); } return boil(resample([...s, s[0]], 0.8, true), 25, 0.3, 10); })();
const place = (shape, c, r) => shape.map(([x, y]) => [c[0] + (x * r) / 10, c[1] + (y * r) / 10]);

// ---------- camera ----------
const Z1 = 2.9, TS = 1.15 / Z1, TOWER_H = 404;
const camWide = [W / 2, H / 2];
const camHero = [PARIS[0] + 40 / Z1, PARIS[1] - (TOWER_H * TS) / 2 + 10 / Z1];
function camera(t) {
  const u = io(prog(T.push, t));
  const z = Math.exp(lerp(0, Math.log(Z1), u)) * (1 + 0.02 * prog([0, T.push[0]], t));
  const lean = io(prog([2.67, 3.2], t));
  return { z, c: [lerp(camWide[0], camHero[0], u) + lean * 60 / Z1, lerp(camWide[1], camHero[1], u) + lean * 22 / Z1] };
}
const scr = (cam, p) => [(p[0] - cam.c[0]) * cam.z + W / 2, (p[1] - cam.c[1]) * cam.z + H / 2];
const towerScr = (cam, p) => scr(cam, [PARIS[0] + p[0] * TS, PARIS[1] + p[1] * TS]);

// ---------- paper ----------
const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const PAPER = await load('/demos/05-cel-boil/assets/paper_base.jpg');
const TOOTH = await load('/demos/05-cel-boil/assets/paper_tooth.png');

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
await document.fonts.load(`700 120px ${CN}`, '欧洲手札巴黎');
await document.fonts.load(`400 26px ${CN}`, 'DRAWN ACROSS EUROPE PARIS 2022.10');
await document.fonts.ready;

// boiled hand-lettering: each glyph gets its own small wobble per drawing; red off-register shadow under the ink
function letter(ch, x, y, size, seed, o = {}) {
  const { weight = 700, shadow = true, alpha = 1, color = PAL.ink, spacing = 0 } = o;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${CN}`; ctx.letterSpacing = `${spacing}px`;
  ctx.translate(x + hr(-1.1, 1.1, seed, 1), y + hr(-1.1, 1.1, seed, 2));
  ctx.rotate(hr(-0.012, 0.012, seed, 3));
  if (shadow) { ctx.fillStyle = PAL.red; ctx.fillText(ch, size * 0.04, size * 0.04); }
  ctx.fillStyle = color; ctx.fillText(ch, 0, 0);
  ctx.restore();
}

window.renderAt = async (t) => {
  const f = Math.min(71, Math.floor(t * FPS + 1e-6));
  const D = drawing(f), tq = D.fq / FPS;
  const seed = 100;                                  // one fixed seed: no line boil
  const cam = camera(tq);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.cream; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.55; ctx.drawImage(PAPER, 0, 0, W, H); ctx.globalAlpha = 1;   // softened paper grain

  // coastline: soft pencil on the background plate, draws on outward from Paris; static like a painted BG (only the cels boil)
  const cu = prog(T.coast, tq);
  ctx.save();
  ctx.strokeStyle = PENCIL; ctx.globalAlpha = 0.34; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const r of coast) {
    const u = io(clamp((cu - (r.dist / maxDist) * 0.55) / 0.45));
    if (u <= 0) continue;
    let pts = (u < 1 ? prefix(r.pts, u) : r.pts).map((p) => scr(cam, p));
    if (!pts.some((p) => p[0] > -50 && p[0] < W + 50 && p[1] > -50 && p[1] < H + 50)) continue;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  ctx.restore();

  // ---- the ink blot on Paris: bleeds open over a few drawings, a thin ripple spreads and fades ----
  const P = scr(cam, PARIS), k = cam.z;
  const du = E.out3(prog(T.drop, tq));
  if (du > 0) {
    const r = 9.5 * Math.min(1.25, Math.sqrt(k)) * du;
    fillShape(ctx, place(BLOT, P, r), PAL.ink, { amp: 0 });
    if (du > 0.5) fillShape(ctx, place(CORE, [P[0] + 1.5, P[1] - 1.5], r * 0.48), PAL.red, { amp: 0 });
    for (let i = 0; i < 2; i++) {          // two tiny specks of ink, as a real nib leaves
      const a = 0.9 + i * 2.6, d = 24 + i * 9;
      const q = scr(cam, [PARIS[0] + Math.cos(a) * d, PARIS[1] + Math.sin(a) * d]);
      fillShape(ctx, place(SPECK, q, (1.5 + i * 0.6) * Math.min(1.6, Math.sqrt(k)) * du), PAL.ink, { amp: 0 });
    }
    const ru = inv(0.08, 0.75, tq);
    if (ru > 0 && ru < 1) {
      ctx.save(); ctx.globalAlpha = 0.7 * (1 - ru);
      inkLoop(ctx, place(RIPPLE, P, (14 + 60 * E.out2(ru)) * Math.sqrt(k)), { seed, w: 1.8, amp: 0 });
      ctx.restore();
    }
  }

  // ---- the tower ----
  const tu = io(prog(T.tower, tq));
  let tip = null;
  if (tu > 0) {
    // colour fill: off-register sunny yellow, washes up from the base (no overshoot)
    const fu = E.out3(prog(T.fill, tq));
    if (fu > 0) {
      const top = -404 * fu;
      ctx.save();
      ctx.beginPath(); { const a = towerScr(cam, [-200, top]), b = towerScr(cam, [200, 10]); ctx.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); } ctx.clip();
      const ring = (pts) => pts.map((p) => towerScr(cam, p)).map((p) => [p[0] + 6, p[1] - 4]);
      ctx.beginPath();
      for (const poly of [ring(silhouette), ring(archHole), ring(gapHole)]) poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.fillStyle = PAL.yel; ctx.fill('evenodd');
      ctx.clip('evenodd');
      if (fu > 0.6) {                      // red pencil shading on the shadow side
        ctx.globalAlpha = (fu - 0.6) / 0.4;
        hatch(ctx, shadeSide.map((p) => towerScr(cam, p)), { seed, gap: 9, ang: -1.1, w: 1.3, color: PAL.pencil, amp: 0 });
      }
      ctx.restore();
    }
    let c = tu * towerCost;
    for (let i = 0; i < strokes.length; i++) {
      const s = strokes[i], sc = s.L / s.speed;
      const frac = clamp(c / sc); c -= sc;
      if (frac <= 0) break;
      const pts = (frac < 1 ? prefix(s.pts, frac) : s.pts).map((q) => towerScr(cam, q));
      if (pts.length > 1) inkStroke(ctx, pts, { dense: true, seed: seed * 7 + i, w: s.w, amp: 0, t0: 3, t1: 3, jit: 0.22, heavy: 0.35, min: 0.55 });
      if (frac < 1) tip = pts.at(-1);
    }
  }

  // ---- the tail eases out toward Nice; a small star settles on the antenna ----
  const lu = io(prog(T.tail, tq));
  if (lu > 0) {
    const pts = prefix(TAIL, lu * 0.6).map((q) => towerScr(cam, q));
    if (pts.length > 1) { inkStroke(ctx, pts, { dense: true, seed: seed + 41, w: 4.4, amp: 0, t0: 4, t1: 30, min: 0.2 }); tip = pts.at(-1); }
  }
  const sp = settle(tq, T.spark, 0.25);
  if (sp.on) {
    const c0 = towerScr(cam, [0, -404]), R = 22 * (0.8 + 0.2 * sp.k);
    const dense = place(STAR, c0, R);
    ctx.save(); ctx.globalAlpha = sp.a;
    fillShape(ctx, dense, PAL.yel, { amp: 0, dx: 3, dy: -2 });
    inkLoop(ctx, dense, { seed, w: 2.6, amp: 0 });
    ctx.restore();
  }
  if (tip && tu < 1) fillShape(ctx, place(SPECK, tip, 3.4), PAL.ink, { amp: 0 });   // wet ink bead at the nib

  // ---- label ----
  const lb = settle(tq, T.label);
  if (lb.on) {
    const b = towerScr(cam, [122, -100]), dy = 6 * (1 - lb.k);
    letter('巴', b[0], b[1] + dy, 64, seed + 1, { alpha: lb.a });
    letter('黎', b[0] + 68, b[1] + dy, 64, seed + 2, { alpha: lb.a });
    const uu = inv(T.label + 0.08, T.label + 0.4, tq);
    if (uu > 0) inkStroke(ctx, prefix([[b[0] - 4, b[1] + 20], [b[0] + 68, b[1] + 23], [b[0] + 134, b[1] + 18]], E.out3(uu)), { seed: seed + 5, w: 3.6, amp: 0, color: PAL.red, t0: 6, t1: 20 });
    const sb = settle(tq, T.label + 0.25);
    if (sb.on) letter('PARIS · 2022.10', b[0], b[1] + 56, 22, seed + 6, { weight: 400, shadow: false, alpha: 0.75 * sb.a, spacing: 3 });
  }

  // ---- title (hand-lettered 手札体): each character inks in and settles, then holds still ----
  const ta = 1 - prog(T.titleOut, tq);
  if (ta > 0 && tq >= T.title) {
    const chars = ['欧', '洲', '手', '札'], x0 = 104, y0 = 236, size = 124;
    for (let i = 0; i < 4; i++) {
      const s = settle(tq, T.title + i * (4 / 24));
      if (s.on) letter(chars[i], x0 + i * 132, y0 + 8 * (1 - s.k), size, 300 + i * 11, { alpha: ta * s.a });
    }
    const uu = prog(T.sub, tq);
    if (uu > 0) {
      ctx.save(); ctx.globalAlpha = ta;
      inkStroke(ctx, prefix([[x0, y0 + 34], [x0 + 260, y0 + 38], [x0 + 520, y0 + 31]], E.out3(uu)), { seed: 309, w: 4.2, amp: 1.0, color: PAL.red, t0: 8, t1: 40 });
      ctx.restore();
      letter('DRAWN ACROSS EUROPE', x0 + 4, y0 + 86, 28, 313, { weight: 400, shadow: false, alpha: ta * E.out2(uu), spacing: 7 });
    }
  }

  // ---- year: a red pencil ring is drawn around it, then the numerals ink in ----
  const yu = prog(T.year, tq);
  if (yu > 0) {
    const cx = W - 170, cy = 112;
    const ring = circlePts(cx, cy, 44, 64, 96);
    inkStroke(ctx, prefix([...ring, ring[0], ring[1], ring[2]], E.out3(yu)), { dense: true, seed: seed + 21, w: 3.4, amp: 1.1, color: PAL.red, t0: 6, t1: 14 });
    const s = settle(tq, T.year[0] + 0.12);
    if (s.on) letter('2022', cx - 62, cy + 16 + 5 * (1 - s.k), 46, seed + 22, { shadow: false, alpha: s.a });
  }

  // paper tooth multiply: one fixed sheet (a changing sheet made the whole frame flicker at 12 Hz)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28;
  ctx.drawImage(TOOTH, 120, 90, W, H, 0, 0, W, H);
  ctx.restore();
};

const Q = new URLSearchParams(location.search);
await window.renderAt(Q.has('t') ? +Q.get('t') : 0);
window.__ready = true;
