// 欧洲手札 / Drawn Across Europe — 3 s style sample (opening + the 巴黎 hero stop).
// Every frame is a pure function of t. Canvas 2D; path lengths measured once through a hidden SVG.
const W = 1920, H = 1080, FPS = 30, DUR = 3;
window.DEMO = { width: W, height: H, fps: FPS, duration: DUR, motionBlur: { samples: 10, shutter: 0.5 } };

const PAPER = '#F3EDE2', INK = '#1F2A44', VERM = '#D9482B';
const CN = '"Songti SC", "STSong", serif', EN = '"PT Serif", Georgia, serif';

// ---------- timing (seconds) ----------
const T = {
  dot: [0.0, 0.32],          // ink dot lands on Paris
  coast: [0.04, 1.45],       // coastline draws on, radiating from Paris
  title: [0.22, 1.05],       // title writes on
  titleOut: [1.32, 1.7],
  push: [1.12, 2.02],        // camera push into Paris
  tower: [1.5, 2.78],        // the pen draws the Eiffel Tower
  label: [2.18, 2.6],
  tail: [2.74, 3.0],         // the tail leaves toward 尼斯
  year: [0.45, 0.85],
};

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (r, t) => clamp((t - r[0]) / (r[1] - r[0]));
function bezier(x1, y1, x2, y2) {          // CSS cubic-bezier as a function of x
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) { const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= (X(s) - x) / d; }
    return Y(clamp(s));
  };
}
const ease = bezier(0.65, 0, 0.35, 1);
const easeOut = bezier(0.22, 1, 0.36, 1);
const overshoot = (u) => { const c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const svg = document.getElementById('svg');
function measure(d) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d); svg.appendChild(el);
  return el;
}

// ---------- map ----------
const land = await (await fetch('/demos/22-hud/assets/land-50m.json')).json();
const geo = topojson.feature(land, land.objects.land);
const proj = d3.geoConicEqualArea().parallels([43, 62]).rotate([-10, 0])
  .fitExtent([[120, 70], [W - 120, H - 50]], { type: 'MultiPoint', coordinates: [[-10, 35], [30, 35], [-10, 61], [30, 61]] });
proj.clipExtent([[-400, -400], [W + 400, H + 400]]);
const gpath = d3.geoPath(proj);
const PARIS = proj([2.3522, 48.8566]);
const NICE = proj([7.262, 43.7102]);

// one ring per polygon, each with its own draw-on delay (distance from Paris)
const rings = [];
for (const f of geo.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) {
    const d = gpath({ type: 'Polygon', coordinates: [p[0]] });
    if (!d) continue;
    const el = measure(d), L = el.getTotalLength();
    if (L < 14) continue;
    const b = el.getBBox();
    if (b.x > W + 300 || b.y > H + 300 || b.x + b.width < -300 || b.y + b.height < -300) continue;
    // start the stroke at the point nearest Paris so each coast "grows" outward
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const dist = Math.hypot(cx - PARIS[0], cy - PARIS[1]);
    rings.push({ p2d: new Path2D(d), L, dist });
  }
}
const maxDist = Math.max(...rings.map((r) => r.dist));

// ---------- the Eiffel Tower, one continuous line ----------
// local units: base centre at (0,0), y up = negative; ~400 tall. Each piece: [d, speed] (retrace pieces run faster).
const TOWER_PIECES = [
  ['M 0 0 L -100 0', 1],                                         // ground line out of the Paris dot
  ['M -104 0 C -84 -26 -62 -64 -52 -112', 1],                    // left leg to level 1 (flared)
  ['M -52 -112 C -44 -150 -36 -180 -29 -205', 1],                // to level 2
  ['M -29 -205 C -18 -270 -10 -326 -6 -362', 1],                 // to the top
  ['M -6 -362 L 0 -404 L 6 -362', 1.3],                          // antenna
  ['M 6 -362 C 10 -326 18 -270 29 -205', 1],
  ['M 29 -205 C 36 -180 44 -150 52 -112', 1],
  ['M 52 -112 C 62 -64 84 -26 104 0', 1],                        // right foot
  ['M 104 0 L 64 0', 1.2],
  ['M 64 0 C 58 -48 32 -74 0 -76 C -32 -74 -58 -48 -64 0', 1],   // the arch
  ['M -64 0 L -104 0', 2.6],                                     // retrace to the left foot
  ['M -104 0 C -84 -26 -62 -64 -52 -112', 3.2],                  // retrace up the left leg
  ['M -52 -112 L -62 -112 L 62 -112', 1.15],                     // level-1 platform (overhangs)
  ['M 62 -112 L 52 -112 C 44 -150 36 -180 29 -205', 3.2],        // retrace up the right leg
  ['M 29 -205 L 37 -205 L -37 -205', 1.15],                      // level-2 platform
  ['M -37 -205 L -29 -205 C -18 -270 -10 -326 -6 -362', 3.2],    // retrace to the top
  ['M -6 -362 L -11 -362 L 11 -362 L 6 -362 L 0 -404', 1.3],     // top deck, back to the antenna tip
];
const TOWER_H = 404;
const pieces = TOWER_PIECES.map(([d, speed]) => { const el = measure(d); return { el, d, L: el.getTotalLength(), speed, p2d: new Path2D(d) }; });
const towerCost = pieces.reduce((a, p) => a + p.L / p.speed, 0);
const towerLen = pieces.reduce((a, p) => a + p.L, 0);
// tail toward Nice (local units, from the antenna tip): swoops right and down
const TAIL_D = 'M 0 -404 C 60 -470 190 -470 260 -380 C 320 -300 330 -160 400 -60';
const tailEl = measure(TAIL_D), tailL = tailEl.getTotalLength(), tail2d = new Path2D(TAIL_D);

// cost-weighted draw: drawn length + pen tip for progress u∈[0,1]
function towerAt(u) {
  let c = u * towerCost, drawn = 0;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i], pc = p.L / p.speed;
    if (c <= pc) {
      const l = (c / pc) * p.L, pt = p.el.getPointAtLength(l);
      return { i, l, tip: [pt.x, pt.y] };
    }
    c -= pc; drawn += p.L;
  }
  const last = pieces[pieces.length - 1], pt = last.el.getPointAtLength(last.L);
  return { i: pieces.length - 1, l: last.L, tip: [pt.x, pt.y] };
}

// ---------- camera ----------
const Z1 = 3.1;                                             // zoom at the hero stop
const TOWER_SCALE = 1 / Z1 * 0.95;                          // tower ≈ 0.95 × 404 px tall on screen at Z1
const towerTop = [PARIS[0], PARIS[1] - TOWER_H * TOWER_SCALE];
const camWide = [W / 2, H / 2];
const camHero = [PARIS[0] + 34 / Z1, (PARIS[1] + towerTop[1]) / 2 + 8 / Z1];
function camera(t) {
  const u = ease(prog(T.push, t));
  // zoom interpolates in log space so the push feels constant
  let z = Math.exp(lerp(Math.log(1.0), Math.log(Z1), u));
  z *= 1 + 0.018 * prog([0, T.push[0]], t);                 // slow drift-in before the push
  let c = [lerp(camWide[0], camHero[0], u), lerp(camWide[1], camHero[1], u)];
  // as the tail leaves, the camera starts to lean toward Nice
  const lean = ease(prog([2.7, 3.2], t));
  c = [c[0] + lean * 70 / Z1, c[1] + lean * 26 / Z1];
  return { z, c };
}
const toScreen = (cam, p) => [(p[0] - cam.c[0]) * cam.z + W / 2, (p[1] - cam.c[1]) * cam.z + H / 2];

// ---------- paper ----------
const paper = document.createElement('canvas'); paper.width = W; paper.height = H;
{
  const g = paper.getContext('2d'), R = rng(7);
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), a = img.data;
  for (let i = 0; i < a.length; i += 4) { const n = (R() - 0.5) * 7; a[i] += n; a[i + 1] += n; a[i + 2] += n; }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.05; g.strokeStyle = '#8a7a60'; g.lineWidth = 0.6;
  for (let i = 0; i < 900; i++) {                           // fibres
    const x = R() * W, y = R() * H, a0 = R() * Math.PI * 2, l = 6 + R() * 22;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a0 + 0.6) * l * 0.5, y + Math.sin(a0 + 0.6) * l * 0.5, x + Math.cos(a0) * l, y + Math.sin(a0) * l); g.stroke();
  }
  g.globalAlpha = 1;
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(90,70,40,0)'); v.addColorStop(1, 'rgba(90,70,40,0.16)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}

// ---------- draw ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
await document.fonts.load(`400 120px ${CN}`, '欧洲手札巴黎');
await document.fonts.load(`400 26px ${EN}`, 'DRAWN ACROSS EUROPE 2022');
await document.fonts.ready;

function strokeOn(p2d, L, u, width, alpha) {
  if (u <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.lineWidth = width;
  if (u < 1) { ctx.setLineDash([L * u, L + 10]); ctx.lineDashOffset = 0; }
  ctx.stroke(p2d);
  ctx.restore();
}

function drawTitle(t) {
  const a = 1 - ease(prog(T.titleOut, t));
  if (a <= 0 || t < T.title[0]) return;
  const chars = ['欧', '洲', '手', '札'], x0 = 130, y0 = 420, size = 132, step = 150;
  ctx.save();
  // feathered paper knock-out so the coastline never runs through the title
  ctx.save(); ctx.globalAlpha = a * 0.88 * ease(prog([T.title[0] - 0.1, T.title[0] + 0.3], t));
  ctx.filter = 'blur(28px)'; ctx.fillStyle = PAPER;
  ctx.fillRect(x0 - 50, y0 - size - 40, 4 * step + 70, size + 200); ctx.restore();
  ctx.fillStyle = INK; ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${size}px ${CN}`;
  for (let i = 0; i < 4; i++) {
    const u = easeOut(prog([T.title[0] + i * 0.11, T.title[0] + i * 0.11 + 0.42], t));
    if (u <= 0) continue;
    // ink-wipe reveal top→bottom, slight settle
    ctx.save();
    ctx.globalAlpha = a * Math.min(1, u * 1.4);
    ctx.beginPath(); ctx.rect(x0 + i * step - 10, y0 - size - 10, step + 10, (size + 40) * u); ctx.clip();
    ctx.fillText(chars[i], x0 + i * step, y0 + (1 - u) * 10);
    ctx.restore();
  }
  // hairline rule + English subtitle
  const r = ease(prog([T.title[0] + 0.35, T.title[1] + 0.1], t));
  ctx.globalAlpha = a * 0.8; ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 4, y0 + 46); ctx.lineTo(x0 + 4 + 120 * r, y0 + 46); ctx.stroke();
  const s = easeOut(prog([T.title[0] + 0.5, T.title[1] + 0.25], t));
  ctx.globalAlpha = a * s * 0.85;
  ctx.font = `400 25px ${EN}`; ctx.letterSpacing = '9px';
  ctx.fillText('DRAWN ACROSS EUROPE', x0 + 4, y0 + 96 + (1 - s) * 6);
  ctx.restore();
}

function drawYear(t) {
  const u = easeOut(prog(T.year, t));
  if (u <= 0) return;
  ctx.save();
  ctx.globalAlpha = u * 0.85; ctx.fillStyle = INK; ctx.textAlign = 'right';
  ctx.font = `400 34px ${EN}`; ctx.letterSpacing = '6px';
  ctx.fillText('2022', W - 96, 104 + (1 - u) * 8);
  ctx.globalAlpha = u * 0.5; ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W - 96 - 118, 124); ctx.lineTo(W - 96, 124); ctx.stroke();
  ctx.restore();
}

function penTip(x, y, energy) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
  g.addColorStop(0, `rgba(217,72,43,${0.32 * energy})`); g.addColorStop(1, 'rgba(217,72,43,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

window.renderAt = async (t) => {
  const cam = camera(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(paper, 0, 0);

  // world layer
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.c[0], -cam.c[1]);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // coastline, hairline ink ~22 %; stays a hairline on screen while zooming
  ctx.strokeStyle = INK;
  const cu = prog(T.coast, t);
  for (const r of rings) {
    const delay = (r.dist / maxDist) * 0.55;
    const u = ease(clamp((cu - delay) / 0.45));
    strokeOn(r.p2d, r.L, u, 1.15 / cam.z, 0.24);
  }

  // Paris "you are here" dot: ink drop with overshoot, then a vermilion core that breathes
  const du = prog(T.dot, t);
  if (du > 0) {
    const s = overshoot(du), rr = 7 / cam.z * s;
    const ring = prog([0.04, 0.6], t);
    if (ring > 0 && ring < 1) {
      ctx.save(); ctx.globalAlpha = (1 - ring) * 0.5; ctx.strokeStyle = INK; ctx.lineWidth = 1.2 / cam.z;
      ctx.beginPath(); ctx.arc(PARIS[0], PARIS[1], (8 + 60 * easeOut(ring)) / cam.z, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(PARIS[0], PARIS[1], rr, 0, Math.PI * 2); ctx.fill();
    const breathe = 1 + 0.12 * Math.sin(t * 5.2);
    ctx.fillStyle = VERM; ctx.beginPath(); ctx.arc(PARIS[0], PARIS[1], rr * 0.5 * breathe, 0, Math.PI * 2); ctx.fill();
  }

  // the tower (in local units, scaled into world space)
  const tu = ease(prog(T.tower, t));
  let tipWorld = null;
  if (tu > 0) {
    const at = towerAt(tu);
    ctx.save();
    ctx.translate(PARIS[0], PARIS[1]); ctx.scale(TOWER_SCALE, TOWER_SCALE);
    ctx.strokeStyle = INK; ctx.lineWidth = 3 / (cam.z * TOWER_SCALE);
    for (let i = 0; i < at.i; i++) ctx.stroke(pieces[i].p2d);
    const p = pieces[at.i];
    ctx.setLineDash([at.l, p.L + 10]); ctx.stroke(p.p2d); ctx.setLineDash([]);
    // the tail toward Nice
    const lu = ease(prog(T.tail, t));
    let tip = at.tip;
    if (lu > 0) {
      ctx.setLineDash([tailL * lu * 0.55, tailL + 10]); ctx.stroke(tail2d); ctx.setLineDash([]);
      const q = tailEl.getPointAtLength(tailL * lu * 0.55); tip = [q.x, q.y];
    }
    ctx.restore();
    if (tu < 1 || lu > 0) tipWorld = [PARIS[0] + tip[0] * TOWER_SCALE, PARIS[1] + tip[1] * TOWER_SCALE];
  }
  ctx.restore();

  // screen-space overlays
  if (tipWorld) { const s = toScreen(cam, tipWorld); penTip(s[0], s[1], 1); }

  const lb = easeOut(prog(T.label, t));
  if (lb > 0) {
    const base = toScreen(cam, [PARIS[0] + 150 * TOWER_SCALE, PARIS[1] - 118 * TOWER_SCALE]);
    ctx.save(); ctx.fillStyle = INK; ctx.globalAlpha = lb;
    ctx.font = `400 52px ${CN}`; ctx.letterSpacing = '6px';
    ctx.fillText('巴黎', base[0] + (1 - lb) * 12, base[1]);
    ctx.globalAlpha = lb * 0.6; ctx.font = `400 20px ${EN}`; ctx.letterSpacing = '5px';
    ctx.fillText('PARIS · 2022.10', base[0] + 2 + (1 - lb) * 12, base[1] + 40);
    ctx.restore();
  }

  drawTitle(t);
  drawYear(t);
};

const Q = new URLSearchParams(location.search);
await window.renderAt(Q.has('t') ? +Q.get('t') : 0);
window.__ready = true;
