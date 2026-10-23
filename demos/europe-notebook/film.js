// 欧洲手札 / Drawn Across Europe — 69 s hand-inked travel sketchbook, animated on twos, NO line boil.
// Grown from the approved 3 s sample (demos/europe-boil): same paper, pencil coastline, brush, Eiffel Tower, title and
// calm motion. An ink line walks the 81 places in date order, one line per trip (the pen lifts between trips); at 22
// hero stops it draws the landmark, colours
// it in (off-register flat fills, red-pencil hatching), labels it, then shrinks it to an icon pinned on its dot.
// Every shape's hand wobble is baked once in its own local space; afterwards it is only transformed — nothing shimmers.
// Brush primitives come from the 05-cel-boil engine.
import { PAL, hs, hr, clamp, lerp, E, arclen, resample, prefix, circlePts, boil, outline, fillPoly, polyPath, N3, sstep }
  from '/demos/05-cel-boil/js/engine.js';
import { PLACES } from './places.js';
import { L as LM } from './landmarks.js';
import { HEROES, YEARS, T, HOLD3, stopCues, END, FPS, DUR } from './cues.js';

const W = 1920, H = 1080;
window.DEMO = { width: W, height: H, fps: FPS, duration: DUR, motionBlur: { samples: 1, shutter: 0.5 } };

// ---------- palette: six colours + paper, each also as a 50 % tint mixed with the paper ----------
const COL = { ink: '#1c1613', red: '#e5402b', yel: '#ffc425', blue: '#3f7fb8', green: '#5a9e5f', sand: '#d4a96a', paper: '#f4e9d0' };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
for (const k of ['ink', 'red', 'yel', 'blue', 'green', 'sand']) {
  const a = hex(COL[k]), b = hex(COL.paper);
  COL[k + 'T'] = `rgb(${a.map((v, i) => Math.round((v + b[i]) / 2)).join(',')})`;
}
const PENCIL = '#6b5446';
// route + place-dot style. The landmarks carry the colour; the route and dots step back so the stops stand out.
//   sepia (default): a warm sepia pencil line, dashed, hollow sepia rings for places, small sepia dots under the icons
//   reddash: a muted red dashed line (classic travel-map look), hollow red rings
//   ink: the first version (brown-black brush, solid ink dots)
const RSTYLE = new URLSearchParams(location.search).get('rs') || 'sepia';
const ROUTE_INK = { sepia: '#9c8572', reddash: '#c4604a', ink: '#4a3b33' }[RSTYLE];
// lettering accents: the off-register shadow under hand-lettering, the brush underlines, the ring round the year.
//   red: tomato red (first version) · terracotta: a muted brick red · sepia: warm brown, monochrome with the route
//   blue: fountain-pen blue · navy: navy lettering with sandstone shadow and underline, navy ring
const ACC = {
  red: { text: '#1c1613', shadow: '#e5402b', line: '#e5402b', ring: '#e5402b' },
  terracotta: { text: '#1c1613', shadow: '#c46a4e', line: '#b85a3e', ring: '#b85a3e' },
  sepia: { text: '#2a211c', shadow: '#cfae8c', line: '#9c7a5c', ring: '#9c7a5c' },
  blue: { text: '#1c1613', shadow: '#9dbbdb', line: '#3f7fb8', ring: '#3f7fb8' },
  navy: { text: '#24365a', shadow: '#e2c393', line: '#c99a5a', ring: '#24365a' },
}[new URLSearchParams(location.search).get('ac') || 'sepia'];         // chosen: warm sepia, the whole set
const SEA = '#9dbbdb';                // the sea wash: a pale tint of the palette's sea blue
// end-card wording (the dates sit underneath, so the years are not repeated)
const END_CARD = {
  a: ['29 国', '·', '81 站'],
  b: ['15 次出发', '·', '29 国', '·', '81 站'],
  c: ['29 个国家', '·', '81 处风景'],
  d: ['一路走过', '29 国', '81 站'],
  old: ['3 年', '·', '29 国', '·', '81 站'],
  e: ['81 站', '·', '29 国'],
  f: ['29 国', '·', '81 站', '·', '15 次启程'],
  g: ['走过 29 国，', '停留 81 站'],
  h: ['81 个地方，', '29 个国家'],
  i: ['29 国 81 站，', '未完待续'],
  j: ['81 站，', '还在继续'],
}[new URLSearchParams(location.search).get('ec') || 'c'];            // chosen: 29 个国家 · 81 处风景
const CLEAN = new URLSearchParams(location.search).has('clean');   // ?clean: no end card (for still cards built from the map)
const DOT_INK = { sepia: '#8f7663', reddash: '#c4604a', ink: '#1c1613' }[RSTYLE];
const CN = '"LXGW Marker Gothic"', LAT = '"Caveat"';
const PEN = { M: 4.6, S: 3.2, F: 1.9 }, SPEED = { M: 1, S: 1.5, F: 2.4 };

// ---------- exposure sheet (frames @24): twos throughout, threes on the end hold ----------
function exposed(f) { return f < HOLD3 ? f - (f % 2) : HOLD3 + Math.floor((f - HOLD3) / 3) * 3; }

const inv = (a, b, x) => clamp((x - a) / (b - a));
const prog = (r, t) => inv(r[0], r[1], t);
const io = E.io3;
const settle = (t, t0, d = 0.33) => { const u = inv(t0, t0 + d, t); return { a: E.out2(u), k: E.out3(u), on: u > 0 }; };

// per-stop timing: arrive → draw (contour, structure, details) → colour washes up → label → one calm detail → leave
const STOPS = HEROES.map((h, k) => {
  const [zh, placeName, s, e, line, key, o] = h;
  return { k, zh, placeName, s, e, line, key, o, lm: LM[key], ...stopCues(h) };
});

// ---------- svg path sampling ----------
const svg = document.getElementById('svg');
function measure(d) { const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', d); svg.appendChild(el); return el; }
function sample(d, step = 1.6) {
  const el = measure(d), Lt = el.getTotalLength(), n = Math.max(2, Math.ceil(Lt / step)), out = [];
  for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((Lt * i) / n); out.push([p.x, p.y]); }
  return out;
}
const subpaths = (d) => d.trim().split(/(?=M)/).map((x) => x.trim()).filter(Boolean);

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
  const pts = boil(resample(r, 2.2), 7, 0.55, 18);   // hand-traced wobble, baked once
  const Lc = arclen(pts).at(-1);
  let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  return { pts, L: Lc, dist: Math.hypot(cx - PARIS[0], cy - PARIS[1]), bb: [x0, y0, x1, y1] };
}).filter((r) => r.L > 14);
const maxDist = Math.max(...coast.map((r) => r.dist));
// country borders: Natural Earth 1:50m admin-0, interior boundaries only; a lighter, dashed pencil on the same plate
const countries = await (await fetch('/demos/europe-notebook/assets/countries-50m.json')).json();
const borders = [];
{
  const raw = [];
  let cur = null;
  const sink = { moveTo(x, y) { cur = [[x, y]]; raw.push(cur); }, lineTo(x, y) { cur.push([x, y]); }, closePath() {}, arc() {} };
  d3.geoPath(proj, sink)(topojson.mesh(countries, countries.objects.countries, (a, b) => a !== b));
  for (const r of raw) {
    const pts = boil(resample(r, 2.2), 9, 0.4, 18);
    if (pts.length < 2) continue;
    const Lb = arclen(pts).at(-1);
    if (Lb < 6) continue;
    let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
    borders.push({ pts, L: Lb, dist: Math.hypot(cx - PARIS[0], cy - PARIS[1]), bb: bbOf(pts) });
  }
}

// ---------- places and the route (smooth arcs between places; drawn trip by trip) ----------
const PL = PLACES.map(([date, zh, en, lat, lon, cc, trip], i) => ({ i, date, zh, en, cc, trip, w: proj([lon, lat]) }));
for (const st of STOPS) { st.pi = PL.findIndex((p) => p.zh === st.placeName); st.dot = PL[st.pi].w; PL[st.pi].hero = st; }
const ROUTE = [];          // dense world polyline
const SAT = [];            // route arclength at each place
{
  const stops = PL.map((p) => p.w);
  let acc = 0; ROUTE.push(stops[0]); SAT.push(0);
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sg = hs(i, 3) < 0.5 ? -1 : 1, bend = (0.035 + 0.035 * hs(i, 4)) * sg;   // a gentle hand curve, not a bulge
    const c = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend];
    const n = Math.max(2, Math.ceil(d / 1.2));
    for (let k = 1; k <= n; k++) {
      const u = k / n, v = 1 - u;
      const p = [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
      acc += Math.hypot(p[0] - ROUTE.at(-1)[0], p[1] - ROUTE.at(-1)[1]); ROUTE.push(p);
    }
    SAT.push(acc);
  }
}
const RCUM = arclen(ROUTE);
function routeAt(s) {          // [index of the first route point past s, the interpolated point at s]
  let lo = 1, hi = RCUM.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (RCUM[m] < s) lo = m + 1; else hi = m; }
  const a = ROUTE[lo - 1], b = ROUTE[lo], u = (s - RCUM[lo - 1]) / Math.max(1e-9, RCUM[lo] - RCUM[lo - 1]);
  return [lo, [lerp(a[0], b[0], clamp(u)), lerp(a[1], b[1], clamp(u))]];
}
function routeRange(s0, s1) {
  const [i0, p0] = routeAt(s0), [i1, p1] = routeAt(s1);
  return [p0, ...ROUTE.slice(i0, i1), p1];
}
// one line per trip: [route arclength where the pen goes down, where it lifts]; between trips nothing is drawn
const TRIPS = [];
for (const p of PL) { const tr = TRIPS.at(-1); if (tr && tr.id === p.trip) tr.s1 = SAT[p.i]; else TRIPS.push({ id: p.trip, s0: SAT[p.i], s1: SAT[p.i] }); }
// head of the line (route arclength) at time t: parked on a hero dot, eased sweeps between hero stops
function headS(t) {
  let s = 0;
  for (let k = 0; k < STOPS.length; k++) {
    const st = STOPS[k];
    if (t < st.arrive) break;
    s = SAT[st.pi];
    const nx = STOPS[k + 1];
    if (nx && t >= st.leave) s = lerp(SAT[st.pi], SAT[nx.pi], io(inv(st.leave, nx.arrive, t)));
  }
  return s;
}
// time each place is reached
for (const p of PL) {
  let t = 0; while (t < T.card && headS(t) < SAT[p.i] - 1e-6) t += 1 / 480;
  p.at = t;
}

// ---------- landmarks: sample once, bake the hand wobble in local space ----------
let seedN = 1;
function prepLandmark(lm) {
  const strokes = [], fills = [], shade = [];
  for (const [d, pen, o = {}] of lm.strokes) for (const sp of subpaths(d)) {
    const pts = boil(sample(sp), 40 + seedN++, 0.8, 40);
    const Ls = arclen(pts).at(-1);
    strokes.push({ pts, L: Ls, w: PEN[pen], pen, speed: o.speed ?? SPEED[pen], g: o.g ?? 0, part: o.part, alpha: o.alpha ?? 1, seed: seedN });
  }
  for (const [d, c, o = {}] of lm.fills) {
    const rings = (Array.isArray(d) ? d : [d]).flatMap(subpaths).map((sp) => boil(sample(sp, 2), 300 + seedN++, 1.0, 44));
    fills.push({ rings, c, g: o.g ?? 0, part: o.part });
  }
  for (const [d] of lm.shade || []) shade.push(sample(d, 2));
  let cost = 0; for (const s of strokes) cost += s.L / s.speed;
  // bounding box (parts at rest)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of strokes) {
    const xf = partXf(lm, s.part, 0);
    for (const p0 of s.pts) { const p = xf(p0); x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  }
  if (lm.tulips) for (const tp of lm.tulips) { y0 = Math.min(y0, tp.y - tp.r * 1.3); }
  const groups = Math.max(...strokes.map((s) => s.g), ...fills.map((f) => f.g), 0) + 1;
  return { ...lm, S: strokes, F: fills, SH: shade, cost, bb: [x0, y0, x1, y1], groups };
}
function partXf(lm, part, tl) {
  if (!part) return (p) => p;
  const { rot = 0, x = 0, y = 0, pivot = [0, 0] } = lm.parts[part](tl);
  const c = Math.cos(rot), s = Math.sin(rot);
  return (p) => { const dx = p[0] - pivot[0], dy = p[1] - pivot[1]; return [x + dx * c - dy * s, y + dx * s + dy * c]; };
}
for (const st of STOPS) st.L = prepLandmark(st.lm);

// hero scale + framing (world px per local unit), icon scale
for (const st of STOPS) {
  const [x0, y0, x1, y1] = st.L.bb, bw = x1 - x0, bh = y1 - y0;
  const z = st.o.z, frac = st.o.frac ?? 0.42;
  st.z = z;
  st.sH = Math.min((frac * H) / (bh * z), (0.5 * W) / (bw * z));
  st.ib = Math.max(bh, bw * 0.75);       // icon size is set in screen px per frame (see iconS)
  st.pin = st.o.pin || [0, 0];
  const cxL = st.dot[0] + ((x0 + x1) / 2) * st.sH, cyL = st.dot[1] + ((y0 + y1) / 2) * st.sH;
  st.cam = { z, c: [cxL + (st.o.side * 170) / z, cyL + 12 / z] };
}

// ---------- camera ----------
const WIDE = { z: 1, c: [W / 2, H / 2] };
let FINAL = { z: 1, c: [W / 2, H / 2] };
const CARD = [1505, 520];          // end-card centre (screen)
{
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of PL) { x0 = Math.min(x0, p.w[0]); y0 = Math.min(y0, p.w[1]); x1 = Math.max(x1, p.w[0]); y1 = Math.max(y1, p.w[1]); }
  y0 -= 60;                                             // room for the icons standing on the northern dots
  // the page as a poster: the whole route on the left two-thirds, the end card in the empty east (centred in its column)
  const z = Math.min(1, (H - 80) / (y1 - y0), 1060 / (x1 - x0));
  FINAL = { z, c: [x0 + (W / 2 - 96) / z, y0 + (H / 2 - 40) / z] };
}
function drift(st, t) {
  const u = io(inv(st.arrive + 0.1, st.leave, t)), { z, c } = st.cam, s = st.o.side;
  if (st.o.move === 'push') return { z: z * (1 + 0.06 * u), c };
  if (st.o.move === 'pan') return { z, c: [c[0] + (s * 34 * u) / z, c[1]] };
  if (st.o.move === 'tilt') return { z, c: [c[0], c[1] - (30 * u) / z] };
  return { z, c };
}
function travelCam(A, B, u, pathBB, chain) {
  const lzA = Math.log(A.z), lzB = Math.log(B.z);
  let dip = 0, bc = [(A.c[0] + B.c[0]) / 2, (A.c[1] + B.c[1]) / 2];
  if (pathBB && !chain) {
    const [x0, y0, x1, y1] = pathBB;
    const zfit = Math.min((W * 0.72) / Math.max(1, x1 - x0), (H * 0.62) / Math.max(1, y1 - y0));
    dip = Math.max(0, (lzA + lzB) / 2 - Math.log(zfit));
    bc = [(x0 + x1) / 2, (y0 + y1) / 2];
  }
  const e = io(u), bump = Math.sin(Math.PI * e), wgt = clamp(dip / 0.5);
  const z = Math.exp(lerp(lzA, lzB, e) - dip * bump);
  const mid = [(A.c[0] + B.c[0]) / 2, (A.c[1] + B.c[1]) / 2];
  return { z, c: [lerp(A.c[0], B.c[0], e) + (bc[0] - mid[0]) * bump * wgt, lerp(A.c[1], B.c[1], e) + (bc[1] - mid[1]) * bump * wgt] };
}
function bbOf(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  return [x0, y0, x1, y1];
}
for (let k = 0; k + 1 < STOPS.length; k++) {
  const a = STOPS[k], b = STOPS[k + 1];
  const seg = ROUTE.slice(RCUM.findIndex((v) => v >= SAT[a.pi]), RCUM.findIndex((v) => v >= SAT[b.pi]) + 1);
  a.pathBB = bbOf(seg.length ? seg : [a.dot, b.dot]);
}
function camera(t) {
  if (t < T.push[0]) return { z: 1 + 0.02 * (t / T.push[0]), c: WIDE.c };
  if (t < T.push[1]) return travelCam({ z: 1.02, c: WIDE.c }, drift(STOPS[0], 0), prog(T.push, t), null, true);
  if (t >= T.pull[0]) return travelCam(drift(STOPS.at(-1), T.pull[0]), FINAL, prog(T.pull, t), null, true);
  for (let k = 0; k < STOPS.length; k++) {
    const st = STOPS[k], nx = STOPS[k + 1];
    if (t < st.leave || !nx) return drift(st, t);
    if (t < nx.arrive + 0.1) return travelCam(drift(st, st.leave), drift(nx, nx.arrive + 0.1), inv(st.leave, nx.arrive + 0.1, t), st.pathBB, nx.o.chain);
  }
  return drift(STOPS.at(-1), t);
}
let CAM = WIDE;
const ICON_PX = 44;
const iconS = (st) => ICON_PX / (st.ib * CAM.z);       // icons keep one size on screen at every zoom
const scr = (p) => [(p[0] - CAM.c[0]) * CAM.z + W / 2, (p[1] - CAM.c[1]) * CAM.z + H / 2];

// ---------- paper ----------
const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const PAPER = await load('/demos/05-cel-boil/assets/paper_base.jpg');
const TOOTH = await load('/demos/05-cel-boil/assets/paper_tooth.png');
const cv = document.getElementById('c'), MAIN = cv.getContext('2d');
const layerCv = document.createElement('canvas'); layerCv.width = W; layerCv.height = H;
const LAYER = layerCv.getContext('2d');
let ctx = MAIN;          // the brush helpers draw into whichever context is current
const ALLTEXT = '欧洲手札' + HEROES.map((h) => h[0]).join('') + '年国站·—0123456789.';
await document.fonts.load(`400 120px ${CN}`, ALLTEXT);
await document.fonts.load(`400 30px ${LAT}`, 'DRAWN ACROSS EUROPE ' + HEROES.map((h) => h[4]).join(' '));
await document.fonts.load(`700 30px ${LAT}`, 'ABC');
await document.fonts.ready;
// ---------- place names: laid out once, so they never jump between frames ----------
// Tier A is placed at the end-card camera (the most zoomed-out view, where space is tightest) and shows at every zoom;
// tier B is placed at 2.2× and fades in only once the camera is that close. Obstacles: dots, the icons standing on the
// hero dots, the year ring and the end card. Text keeps one size on screen, so a layout that fits zoomed out still fits
// zoomed in.
const NAME_PX = 15, HERO_NAME_PX = 17;
// zoomed out, only the hero stops and these well-known places are named; the rest appear when the camera is close
const KNOWN = new Set(['阿姆斯特丹', '布鲁塞尔', '日内瓦', '布拉格', '维也纳', '汉堡', '奥斯陆', '赫尔辛基', '米兰', '佛罗伦萨', '比萨',
  '马德里', '里斯本', '塞维利亚', '华沙', '克拉科夫', '布加勒斯特', '索菲亚', '贝尔格莱德', '萨格勒布', '萨尔茨堡', '摩纳哥城', '斯特拉斯堡']);
const NAMES = [];
{
  const nameOf = (p) => (p.hero ? p.hero.zh : p.zh);
  const sizeOf = (p) => (p.hero ? HERO_NAME_PX : NAME_PX);
  const widthOf = (p) => { ctx.font = `400 ${sizeOf(p)}px ${CN}`; return [...nameOf(p)].reduce((a, ch) => a + ctx.measureText(ch).width * 1.02, 0); };
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const layout = (zc, cc, extra, accepted, onlyKnown = false) => {
    const at = (w) => [(w[0] - cc[0]) * zc + W / 2, (w[1] - cc[1]) * zc + H / 2];
    const obst = [...extra], icons = [];
    for (const p of PL) {
      const c = at(p.w);
      obst.push([c[0] - 7, c[1] - 7, c[0] + 7, c[1] + 7]);
      if (p.hero) icons.push({ i: p.i, tight: [c[0] - 30, c[1] - ICON_PX - 4, c[0] + 30, c[1] + 2], air: [c[0] - 36, c[1] - ICON_PX - 10, c[0] + 36, c[1] + 6] });
    }
    // other places' icons keep a margin of air around them; a hero's own icon only blocks its exact footprint
    const iconHit = (sb, i) => icons.some((o) => hit(o.i === i ? o.tight : o.air, sb));
    for (const n of accepted) { const c = at(PL[n.i].w); obst.push([c[0] + n.box[0], c[1] + n.box[1], c[0] + n.box[2], c[1] + n.box[3]]); }
    const out = [];
    // heroes first, then in visit order
    const order = [...PL.filter((p) => p.hero), ...PL.filter((p) => !p.hero && (!onlyKnown || KNOWN.has(p.zh)))];
    for (const p of order) {
      if (accepted.some((n) => n.i === p.i)) continue;
      const w = widthOf(p), sz = sizeOf(p), c = at(p.w);
      let cands = p.hero
        ? [[9, 7], [-9 - w, 7], [-w / 2, 27], [-w / 2, -ICON_PX - 9], [33, -ICON_PX / 2 + 7], [-33 - w, -ICON_PX / 2 + 7], [9, 27], [-9 - w, 27]]
        : [[9, 7], [-9 - w, 7], [-w / 2, -12], [-w / 2, 26], [9, -9], [-9 - w, -9], [9, 23], [-9 - w, 23]];
      if (p.hero?.key === 'auschwitz') cands = [[-9 - w, 7], [-9 - w, 24], ...cands];   // west of its dot: 克拉科夫 sits just east
      for (const [dx, dy] of cands) {
        const box = [dx - 2, dy - sz * 0.86, dx + w + 2, dy + sz * 0.22];
        const sb = [c[0] + box[0], c[1] + box[1], c[0] + box[2], c[1] + box[3]];
        if (sb[0] < 40 || sb[2] > W - 40 || sb[1] < 30 || sb[3] > H - 30) continue;
        if (obst.some((o) => hit(o, sb)) || iconHit(sb, p.i)) continue;
        obst.push(sb); out.push({ i: p.i, dx, dy, box, text: nameOf(p), size: sz, hero: !!p.hero });
        break;
      }
    }
    return out;
  };
  const endCard = [CARD[0] - 420, CARD[1] - 90, CARD[0] + 420, CARD[1] + 110], yearRing = [W - 280, 50, W - 60, 175];
  const A = layout(FINAL.z, FINAL.c, [endCard, yearRing], [], true);
  for (const n of A) NAMES.push({ ...n, tier: 0 });
  // tier B: checked against tier A at 2.2× around every place (a conservative local test, same as the camera sees there)
  const B = [];
  for (const p of PL) {
    if (A.some((n) => n.i === p.i) || B.some((n) => n.i === p.i)) continue;
    const got = layout(2.2, p.w, [], [...A, ...B]).find((n) => n.i === p.i);
    if (got) B.push(got);
  }
  for (const n of B) NAMES.push({ ...n, tier: 1 });
}
window.FONTS_OK = document.fonts.check(`400 64px ${CN}`, '欧洲手札') && document.fonts.check(`400 30px ${LAT}`, 'PARIS');

// ---------- unit shapes with the wobble baked in ----------
const BLOT = boil(circlePts(0, 0, 10, 30), 21, 0.9, 30), CORE = boil(circlePts(0, 0, 10, 18), 22, 0.7, 30);
const SPECK = boil(circlePts(0, 0, 10, 10), 23, 0.6, 20), RIPPLE = boil(circlePts(0, 0, 10, 48), 24, 0.25, 12);
const STAR = (() => { const s = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? 3.2 : 10; s.push([Math.cos(a) * r, Math.sin(a) * r]); } return boil(resample([...s, s[0]], 0.8, true), 25, 0.3, 10); })();
const DOTS = PL.map((p) => boil(circlePts(0, 0, 10, 22), 500 + p.i, 0.9, 26));
const place = (shape, c, r, ry = r) => shape.map(([x, y]) => [c[0] + (x * r) / 10, c[1] + (y * ry) / 10]);

// ---------- brush: variable-width ink; pressure is keyed to the shape's own arclength (stable under camera moves) ----------
function brush(pts, w, o = {}) {
  const { seed = 1, unit = 1, color = COL.ink, t0 = 3, t1 = 3, min = 0.55, heavy = 0.35, jit = 0.22 } = o;
  if (pts.length < 2) return;
  const P = resample(pts, 2.4);
  if (P.length < 2) return;
  const tot = arclen(P).at(-1);
  const wf = (u, s, i, tx, ty) => {
    let k = 1 + jit * N3(s / unit / 60, seed * 1.37, 3.1);
    k *= 1 + heavy * Math.max(0, ty * 0.55 - tx * 0.83);
    k *= min + (1 - min) * Math.min(sstep(0, t0, s), sstep(0, t1, tot - s));
    return w * k;
  };
  fillPoly(ctx, outline(P, wf), color);
}
function ring(poly, w, o) { brush([...poly, poly[0], poly[1]], w, o); }
function polyFill(rings, color, dx = 0, dy = 0) {
  ctx.beginPath();
  for (const r of rings) r.forEach((p, i) => (i ? ctx.lineTo(p[0] + dx, p[1] + dy) : ctx.moveTo(p[0] + dx, p[1] + dy)));
  ctx.fillStyle = color; ctx.fill('evenodd');
}
function hatchPoly(poly, gap, w, seed) {
  ctx.save();
  ctx.beginPath(); polyPath(ctx, poly); ctx.clip();
  const ang = -1.1, c = Math.cos(ang), s = Math.sin(ang);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 10, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  let k = 0;
  for (let d = -R; d <= R; d += gap, k++) {
    const off = d + (hs(seed, k) - 0.5) * gap * 0.35, px = mx - s * off, py = my + c * off;
    brush([[px - c * R, py - s * R], [px + c * R, py + s * R]], w * (0.8 + 0.4 * hs(seed, k, 2)), { seed: seed * 31 + k, color: COL.red, t0: 8, t1: 8, heavy: 0, jit: 0.3 });
  }
  ctx.restore();
}
function knock(rings) {          // cover with the paper itself (the same static sheet the frame starts from)
  ctx.save();
  ctx.beginPath();
  for (const r of rings) r.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.clip('evenodd');
  ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.55; ctx.drawImage(PAPER, 0, 0, W, H);
  ctx.restore();
}

// ---------- a landmark at a given state ----------
// st: stop, s: world px per local unit, anchor: world point of the base, tu: draw progress 0..1, fu: fill 0..1,
// tl: seconds of detail motion, alpha
function drawLandmark(st, s, anchor, tu, fu, tl, alpha, tq) {
  const lm = st.L, unit = s * CAM.z;
  const rel = unit / (st.sH * st.z);
  const penK = clamp(Math.pow(rel, 0.6), 0.3, 1.25);
  const fineA = sstep(0.12, 0.24, unit);
  const grey = !!lm.grey;
  const T2 = (xf) => (p) => { const q = xf(p); return scr([anchor[0] + q[0] * s, anchor[1] + q[1] * s]); };
  const xfs = {}; const getXf = (part) => (xfs[part || ''] ||= T2(partXf(lm, part, tl)));
  ctx.save(); ctx.globalAlpha = alpha;
  // stroke progress, illustrator order
  let c = tu * lm.cost;
  const frac = lm.S.map((sk) => { const sc = sk.L / sk.speed; const fr = clamp(c / sc); c -= sc; return fr; });
  let tip = null;
  const [bx0, by0, bx1, by1] = lm.bb;
  for (let g = 0; g < lm.groups; g++) {
    const started = lm.S.some((sk, i) => sk.g === g && frac[i] > 0);
    // fills of this layer: paper knock-outs as soon as the layer is being drawn; colour washes up from the base
    for (const fl of lm.F) {
      if (fl.g !== g) continue;
      const xf = getXf(fl.part);
      if (fl.c === 'paper') { if (started) knock(fl.rings.map((r) => r.map(xf))); continue; }
      if (fu <= 0 || grey) continue;
      ctx.save();
      const top = lerp(by1 + 4, by0 - 40, fu), a = scr([anchor[0] + (bx0 - 60) * s, anchor[1] + top * s]), b = scr([anchor[0] + (bx1 + 60) * s, anchor[1] + (by1 + 60) * s]);
      ctx.beginPath(); ctx.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.clip();
      polyFill(fl.rings.map((r) => r.map(xf)), COL[fl.c], 6 * penK, -4 * penK);
      ctx.restore();
    }
    if (g === 0 && fu > 0.6 && !grey && penK > 0.5) {
      ctx.save(); ctx.globalAlpha = alpha * ((fu - 0.6) / 0.4) * clamp((penK - 0.5) / 0.15);
      const xf = getXf(null);
      lm.SH.forEach((poly, i) => hatchPoly(poly.map(xf), 9 * Math.max(0.7, penK), 1.3 * penK, 900 + st.k * 7 + i));
      ctx.restore();
    }
    for (let i = 0; i < lm.S.length; i++) {
      const sk = lm.S[i];
      if (sk.g !== g || frac[i] <= 0) continue;
      const a = sk.pen === 'F' ? fineA : 1;
      if (a <= 0.01) continue;
      const xf = getXf(sk.part);
      const pts = (frac[i] < 1 ? prefix(sk.pts, frac[i]) : sk.pts).map(xf);
      ctx.globalAlpha = alpha * a * sk.alpha * (grey ? 0.85 : 1);
      brush(pts, sk.w * penK * (grey ? 0.8 : 1), { seed: sk.seed, unit, color: grey ? PENCIL : COL.ink, t0: 3 * penK + 1, t1: 3 * penK + 1 });
      if (frac[i] < 1) tip = pts.at(-1);
    }
    ctx.globalAlpha = alpha;
    if (lm.tulips && g === 0) drawTulips(st, getXf(null), tq, penK, unit);
  }
  if (tip && tu < 1) fillPoly(ctx, place(SPECK, tip, 3.2 * Math.max(0.5, penK)), grey ? PENCIL : COL.ink);
  ctx.restore();
}

// 库肯霍夫: the tulip heads ink in along the rows, then open one after another (bud → cup, no overshoot)
function tulipShape(r, o) {
  const P = [[0, 0.9], [0.72, 0.52], [0.86, -0.1], [0.7 + 0.32 * o, -1.0], [0.36, -0.72 + 0.22 * o], [0, -1.05 - 0.12 * o],
    [-0.36, -0.72 + 0.22 * o], [-0.7 - 0.32 * o, -1.0], [-0.86, -0.1], [-0.72, 0.52]];
  return P.map(([x, y]) => [x * r, y * r]);
}
function drawTulips(st, xf, tq, penK, unit) {
  const tp = st.L.tulips, n = tp.length;
  for (let i = 0; i < n; i++) {
    const t = tp[i];
    const ta = st.draw[0] + 0.25 + (0.4 * i) / n;
    const s0 = settle(tq, ta, 0.25);
    if (!s0.on) continue;
    const o = E.io3(inv(st.detail - 0.25 + i * 0.05, st.detail + 0.15 + i * 0.05, tq));
    let poly = resample(tulipShape(t.r, o).map(([x, y]) => [t.x + x, t.y + y]), 2, true);
    poly = boil(poly, 700 + i, 0.6, 30).map(xf);
    ctx.save(); ctx.globalAlpha *= s0.a;
    polyFill([poly], COL[t.c], 5 * penK, -3 * penK);
    ring(poly, 2.6 * penK, { seed: 700 + i, unit, t0: 2, t1: 2 });
    ctx.restore();
  }
}

// ---------- hand-lettering ----------
function letter(ch, x, y, size, seed, o = {}) {
  const { font = CN, weight = 400, shadow = true, alpha = 1, color = ACC.text, spacing = 0, align = 'left' } = o;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.textAlign = align;
  ctx.font = `${weight} ${size}px ${font}`; ctx.letterSpacing = `${spacing}px`;
  ctx.translate(x + hr(-1.1, 1.1, seed, 1), y + hr(-1.1, 1.1, seed, 2));
  ctx.rotate(hr(-0.012, 0.012, seed, 3));
  if (shadow) { ctx.fillStyle = ACC.shadow; ctx.fillText(ch, size * 0.04, size * 0.04); }
  ctx.fillStyle = color; ctx.fillText(ch, 0, 0);
  ctx.restore();
}
function word(str, x, y, size, seed, o = {}) {      // per-character lettering, returns the advance
  ctx.font = `400 ${size}px ${CN}`;
  const adv = [...str].map((ch) => ctx.measureText(ch).width * 1.02);
  const total = adv.reduce((a, b) => a + b, 0);
  let cx = o.align === 'right' ? x - total : o.align === 'center' ? x - total / 2 : x;
  [...str].forEach((ch, i) => { letter(ch, cx, y, size, seed + i, { ...o, align: 'left' }); cx += adv[i]; });
  return { x0: cx - total, x1: cx };
}

// label layout in screen space (shared by the drawing and by the clearing mask)
function labelBox(st) {
  const s = st.sH, [x0, y0, x1, y1] = st.L.bb, side = st.o.side;
  const anc = scr([st.dot[0] + (side > 0 ? x1 : x0) * s, st.dot[1] + lerp(y0, y1, 0.58) * s]);
  let x = anc[0] + side * 40;
  const size = 66;
  ctx.font = `400 ${size}px ${CN}`;
  const tw = [...st.zh].reduce((a, ch) => a + ctx.measureText(ch).width * 1.02, 0);
  ctx.font = `400 30px ${LAT}`; ctx.letterSpacing = '3px';
  const lw = ctx.measureText(st.line).width; ctx.letterSpacing = '0px';
  const bw = Math.max(tw, lw);
  if (side > 0) x = Math.min(x, W - 100 - bw); else x = Math.max(x, 100 + bw);
  const y = clamp(anc[1], 200, H - 140);
  const xl = side > 0 ? x : x - tw;
  return { xl, y, tw, bw, size, side, box: side > 0 ? [xl - 20, y - 70, xl + bw + 20, y + 76] : [xl + tw - bw - 20, y - 70, xl + tw + 20, y + 76] };
}
function screenBB(st, s, anchor) {
  const [x0, y0, x1, y1] = st.L.bb, a = scr([anchor[0] + x0 * s, anchor[1] + y0 * s]), b = scr([anchor[0] + x1 * s, anchor[1] + y1 * s]);
  return [a[0], a[1], b[0], b[1]];
}

// a place dot: the current place is a small red dot; hero places a small filled dot under their icon; the rest hollow rings
function drawDot(p, q, dr, isCur, aus) {
  if (RSTYLE === 'ink') {
    fillPoly(ctx, place(DOTS[p.i], q, dr * (p.hero ? 1.15 : 1)), aus ? PENCIL : COL.ink);
    if (isCur && !aus) fillPoly(ctx, place(CORE, [q[0] + 0.6, q[1] - 0.6], dr * 0.5), COL.red);
    return;
  }
  const r = dr * 0.68;
  if (isCur && !aus) { fillPoly(ctx, place(DOTS[p.i], q, r * 1.2), COL.red); return; }
  if (p.hero) { fillPoly(ctx, place(DOTS[p.i], q, r * 0.85), aus ? PENCIL : DOT_INK); return; }
  ring(place(DOTS[p.i], q, r), 1.3, { seed: 600 + p.i, color: DOT_INK, t0: 1, t1: 1, min: 0.8, heavy: 0 });
}

// ---------- the frame ----------
window.renderAt = async (t) => {
  const f = Math.min(DUR * FPS - 1, Math.floor(t * FPS + 1e-6));
  const tq = exposed(f) / FPS;
  CAM = camera(tq);
  const z = CAM.z;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.55; ctx.drawImage(PAPER, 0, 0, W, H); ctx.globalAlpha = 1;

  // the sea: a pale watercolour wash over everything that is not land, washing in with the coastline, then still
  const cu = prog(T.coast, tq);
  const vx0 = CAM.c[0] - W / 2 / z - 20, vx1 = CAM.c[0] + W / 2 / z + 20, vy0 = CAM.c[1] - H / 2 / z - 20, vy1 = CAM.c[1] + H / 2 / z + 20;
  const seaA = io(clamp((cu - 0.2) / 0.8));
  if (seaA > 0) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    for (const r of coast) {
      if (r.bb[2] < vx0 || r.bb[0] > vx1 || r.bb[3] < vy0 || r.bb[1] > vy1) continue;
      let p = scr(r.pts[0]); ctx.moveTo(p[0], p[1]);
      for (let i = 1; i < r.pts.length; i++) { p = scr(r.pts[i]); ctx.lineTo(p[0], p[1]); }
      ctx.closePath();
    }
    ctx.globalAlpha = 0.34 * seaA; ctx.fillStyle = SEA; ctx.fill('evenodd');
    ctx.restore();
  }

  // coastline: soft pencil on the background plate, draws on outward from Paris during the opening, then holds
  ctx.save();
  ctx.strokeStyle = PENCIL; ctx.globalAlpha = 0.34; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const r of coast) {
    if (r.bb[2] < vx0 || r.bb[0] > vx1 || r.bb[3] < vy0 || r.bb[1] > vy1) continue;
    const u = io(clamp((cu - (r.dist / maxDist) * 0.55) / 0.45));
    if (u <= 0) continue;
    const pts = (u < 1 ? prefix(r.pts, u) : r.pts);
    ctx.beginPath();
    let p = scr(pts[0]); ctx.moveTo(p[0], p[1]);
    for (let i = 1; i < pts.length; i++) { p = scr(pts[i]); ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
  }
  // borders: dash length fixed in world units so the dashes stay put on the map while the camera moves
  ctx.globalAlpha = 0.52; ctx.lineWidth = 1.5; ctx.setLineDash([6 * z, 3.5 * z]); ctx.lineDashOffset = 0;
  for (const r of borders) {
    if (r.bb[2] < vx0 || r.bb[0] > vx1 || r.bb[3] < vy0 || r.bb[1] > vy1) continue;
    const u = io(clamp((cu - (r.dist / maxDist) * 0.55) / 0.45));
    if (u <= 0) continue;
    const pts = (u < 1 ? prefix(r.pts, u) : r.pts);
    ctx.beginPath();
    let p = scr(pts[0]); ctx.moveTo(p[0], p[1]);
    for (let i = 1; i < pts.length; i++) { p = scr(pts[i]); ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // ---- the ink blot on Paris (the hook) ----
  const P0 = scr(PARIS);
  const du = E.out3(prog(T.drop, tq));
  if (du > 0) {
    const r = 9.5 * Math.min(1.25, Math.sqrt(z)) * du;
    const blotA = 1 - prog(STOPS[0].shrink, tq);        // the opening blot gives way to an ordinary dot once Paris is an icon
    if (blotA > 0) { ctx.save(); ctx.globalAlpha = blotA; fillPoly(ctx, place(BLOT, P0, r), COL.ink); ctx.restore(); }
    const spA = 1 - prog(T.titleOut, tq);          // the two ink specks belong to the opening only
    for (let i = 0; i < 2 && spA > 0; i++) {
      const a = 0.9 + i * 2.6, d = 24 + i * 9;
      ctx.save(); ctx.globalAlpha = spA;
      fillPoly(ctx, place(SPECK, scr([PARIS[0] + Math.cos(a) * d, PARIS[1] + Math.sin(a) * d]), (1.5 + i * 0.6) * Math.min(1.6, Math.sqrt(z)) * du), COL.ink);
      ctx.restore();
    }
    const ru = inv(0.08, 0.75, tq);
    if (ru > 0 && ru < 1) { ctx.save(); ctx.globalAlpha = 0.7 * (1 - ru); ring(place(RIPPLE, P0, (14 + 60 * E.out2(ru)) * Math.sqrt(z)), 1.8); ctx.restore(); }
  }

  // ---- route, dots and the earlier icons go on their own layer, so the page can clear around the stop being drawn ----
  let active = null, actVis = 0;
  for (const st of STOPS) if (tq >= st.draw[0] && tq < st.shrink[1]) { active = st; actVis = Math.min(inv(st.draw[0], st.draw[0] + 0.3, tq), 1 - inv(st.shrink[0], st.shrink[1], tq)); }
  ctx = LAYER;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);

  // ---- the route: one ink line per trip; the pen lifts between trips ----
  const hs_ = headS(tq);
  const moving = hs_ > 0 && Math.abs(headS(tq + 1 / 24) - hs_) > 0.01;
  for (const tr of TRIPS) {
    if (tr.s1 <= tr.s0 || hs_ <= tr.s0 + 0.5) continue;
    const end = Math.min(hs_, tr.s1), drawing = moving && hs_ < tr.s1;
    const pts = routeRange(tr.s0, end).map(scr);
    if (RSTYLE === 'reddash') {
      ctx.save(); ctx.strokeStyle = ROUTE_INK; ctx.globalAlpha = 0.8; ctx.lineWidth = clamp(1.4 * Math.pow(z, 0.35), 1.4, 2.4);
      ctx.lineCap = 'round'; ctx.setLineDash([7 * z, 5 * z]);
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); ctx.restore();
    } else if (RSTYLE === 'sepia') {            // sepia pencil, dashed; dash length fixed in world units so it never crawls
      ctx.save(); ctx.strokeStyle = ROUTE_INK; ctx.globalAlpha = 0.9; ctx.lineWidth = clamp(1.5 * Math.pow(z, 0.35), 1.5, 2.5);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([6 * z, 4.5 * z]); ctx.lineDashOffset = 0;
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); ctx.restore();
    } else brush(pts, clamp(1.7 * Math.pow(z, 0.4), 1.7, 3.0), { seed: 41 + tr.id, unit: z, t0: 6, t1: drawing ? 26 : 8, min: 0.35, color: ROUTE_INK });
    if (drawing) fillPoly(ctx, place(SPECK, pts.at(-1), RSTYLE === 'ink' ? 3.4 : 2.6), RSTYLE === 'ink' ? COL.ink : ROUTE_INK);
  }

  // ---- place dots: ink in (fade + a 3 px settle) as the line reaches them; the current place has a red core ----
  let cur = -1;
  for (const p of PL) if (tq >= p.at && p.at < T.card) cur = p.i;
  if (tq >= T.pull[0] + 0.1) cur = -1;
  const dr = 5.2 * clamp(Math.pow(z, 0.32), 1, 1.5);
  for (const p of PL) {
    const sd = settle(tq, p.at, 0.3);
    if (!sd.on) continue;
    const c = scr(p.w), aus = p.hero?.key === 'auschwitz';
    ctx.save(); ctx.globalAlpha = sd.a * (aus ? 0.55 : 1);
    const q = [c[0], c[1] - 3 * (1 - sd.k)];
    drawDot(p, q, dr, p.i === cur, aus);
    ctx.restore();
  }

  // ---- place names: small pencil lettering beside the dots (hero names in ink once their big label has gone) ----
  const tierB = sstep(1.9, 2.4, z);
  for (const n of NAMES) {
    const p = PL[n.i];
    let a = settle(tq, p.at + 0.1, 0.35).a;
    if (p.hero) a = settle(tq, p.hero.labelOut[1], 0.35).a;
    if (n.tier) a *= tierB;
    if (a <= 0.01) continue;
    const c = scr(p.w), aus = p.hero?.key === 'auschwitz';      // its name in grey pencil, like its drawing
    word(n.text, c[0] + n.dx, c[1] + n.dy, n.size, 2000 + n.i * 3, { shadow: false, alpha: a * (n.hero && !aus ? 0.9 : 0.72), color: n.hero && !aus ? COL.ink : PENCIL });
  }

  // ---- landmarks: icons on the layer; then the page clears softly around the active stop; then the active stop ----
  const order = STOPS.filter((st) => tq >= st.draw[0] && st !== active);
  if (active) order.push(active);
  for (const st of order) {
    if (st === active) {
      ctx = MAIN;
      if (actVis > 0) {
        LAYER.save();
        LAYER.globalCompositeOperation = 'destination-out'; LAYER.globalAlpha = 0.86 * actVis; LAYER.filter = 'blur(14px)'; LAYER.fillStyle = '#000';
        const su0 = io(prog(st.shrink, tq)), s0 = Math.exp(lerp(Math.log(st.sH), Math.log(iconS(st)), su0));
        const bb = screenBB(st, s0, [st.dot[0] + st.pin[0] * su0, st.dot[1] + st.pin[1] * su0]);
        LAYER.beginPath(); LAYER.roundRect(bb[0] - 26, bb[1] - 26, bb[2] - bb[0] + 52, bb[3] - bb[1] + 40, 30); LAYER.fill();
        if (tq >= st.label && tq < st.labelOut[1]) { const lb = labelBox(st).box; LAYER.globalAlpha = 0.86 * actVis * (1 - prog(st.labelOut, tq)); LAYER.beginPath(); LAYER.roundRect(lb[0], lb[1], lb[2] - lb[0], lb[3] - lb[1], 24); LAYER.fill(); }
        LAYER.restore();
      }
      if (prog(T.year, tq) > 0) { LAYER.save(); LAYER.globalCompositeOperation = 'destination-out'; LAYER.filter = 'blur(6px)'; LAYER.beginPath(); LAYER.ellipse(W - 170, 112, 90, 52, 0, 0, Math.PI * 2); LAYER.fill(); LAYER.restore(); }
      MAIN.drawImage(layerCv, 0, 0);
      const p = PL[st.pi], c = scr(p.w), aus = st.key === 'auschwitz';
      ctx.save(); ctx.globalAlpha = aus ? 0.55 : 1;
      drawDot(p, c, dr, p.i === cur, aus);
      ctx.restore();
    }
    const su = io(prog(st.shrink, tq));
    // 奥斯维辛 stays on the map too, but only as a grey pencil drawing, a little fainter than the rest
    const s = Math.exp(lerp(Math.log(st.sH), Math.log(iconS(st)), su));
    const anchor = [st.dot[0] + st.pin[0] * su, st.dot[1] + st.pin[1] * su];
    const tu = io(prog(st.draw, tq)), fu = st.fill ? E.out3(prog(st.fill, tq)) : 0;
    const tl = Math.min(tq, st.shrink[0]) - st.draw[0];
    let alpha = st.key === 'auschwitz' ? 1 - 0.3 * su : 1;
    if (st !== active && active && actVis > 0) alpha *= 1 - 0.75 * actVis * overlapK(st, s, anchor, active);
    if (st !== active && active && actVis > 0 && tq >= active.label && tq < active.labelOut[1]) {   // and under its label
      const lb = labelBox(active).box, ib = screenBB(st, s, anchor);
      if (ib[0] < lb[2] && lb[0] < ib[2] && ib[1] < lb[3] && lb[1] < ib[3]) alpha *= 1 - 0.8 * actVis;
    }
    if (st.pin[0] || st.pin[1]) {               // a fine leader from the dot to the pinned icon
      ctx.save(); ctx.globalAlpha = su * alpha * 0.8;
      brush([scr(st.dot), scr(anchor)], 1.3, { seed: 77 + st.k, t0: 2, t1: 2, min: 0.6 });
      ctx.restore();
    }
    drawLandmark(st, s, anchor, tu, fu, tl, alpha, tq);
    // the one calm detail: a star settles on the antenna / a single ripple spreads
    const lm = st.L;
    const unit = s * z;
    if (lm.star && su < 1.01) {
      const sp = settle(tq, st.detail, 0.25);
      if (sp.on) {
        const c0 = scr([anchor[0] + lm.star[0] * s, anchor[1] + lm.star[1] * s]), R = 22 * (0.8 + 0.2 * sp.k) * clamp(unit / (st.sH * st.z), 0.3, 1);
        const dense = place(STAR, c0, R);
        ctx.save(); ctx.globalAlpha = sp.a * alpha;
        fillPoly(ctx, dense.map((p) => [p[0] + 3, p[1] - 2]), COL.yel);
        ring(dense, 2.6 * clamp(R / 22, 0.4, 1));
        ctx.restore();
      }
    }
    if (lm.ripple) {
      const ru = inv(st.detail, st.detail + 1.1, tq);
      if (ru > 0 && ru < 1) {
        const c0 = scr([anchor[0] + lm.ripple[0] * s, anchor[1] + lm.ripple[1] * s]), rr = (8 + 46 * E.out2(ru)) * lm.ripple[2] * unit;
        ctx.save(); ctx.globalAlpha = 0.75 * (1 - ru) * alpha;
        ring(place(RIPPLE, c0, rr, rr * 0.3), 1.7 * clamp(unit, 0.5, 1.2), { unit, t0: 2, t1: 2 });
        ctx.restore();
      }
    }
  }
  if (!active) {
    if (prog(T.year, tq) > 0) { LAYER.save(); LAYER.globalCompositeOperation = 'destination-out'; LAYER.filter = 'blur(6px)'; LAYER.beginPath(); LAYER.ellipse(W - 170, 112, 90, 52, 0, 0, Math.PI * 2); LAYER.fill(); LAYER.restore(); }
    ctx = MAIN; MAIN.drawImage(layerCv, 0, 0);
  }

  // ---- labels ----
  for (const st of STOPS) {
    const lb = settle(tq, st.label);
    const out = 1 - prog(st.labelOut, tq);
    if (!lb.on || out <= 0) continue;
    const grey = st.key === 'auschwitz';
    const { xl, tw, size, side } = labelBox(st), y = labelBox(st).y + 6 * (1 - lb.k);
    const a = lb.a * out;
    word(st.zh, xl, y, size, 1000 + st.k * 17, { alpha: a, shadow: !grey, color: grey ? PENCIL : COL.ink });
    if (!grey) {
      const uu = inv(st.label + 0.08, st.label + 0.4, tq);
      if (uu > 0) { ctx.save(); ctx.globalAlpha = out; brush(prefix([[xl - 4, y + 20], [xl + tw / 2, y + 23], [xl + tw + 4, y + 18]], E.out3(uu)), 3.6, { seed: 1200 + st.k, color: ACC.line, t0: 6, t1: 20 }); ctx.restore(); }
    }
    const sb = settle(tq, st.label + 0.22);
    if (sb.on) letter(st.line, side > 0 ? xl : xl + tw, y + 58, 30, 1300 + st.k, { font: LAT, shadow: false, alpha: (grey ? 0.6 : 0.8) * sb.a * out, spacing: 3, align: side > 0 ? 'left' : 'right', color: grey ? PENCIL : COL.ink });
  }

  // ---- title (hand-lettered): each character inks in and settles, then holds still ----
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
      brush(prefix(resample([[x0, y0 + 34], [x0 + 260, y0 + 38], [x0 + 520, y0 + 31]], 4), E.out3(uu)), 4.2, { seed: 309, color: ACC.line, t0: 8, t1: 40 });
      ctx.restore();
      letter('DRAWN ACROSS EUROPE', x0 + 4, y0 + 88, 36, 313, { font: LAT, weight: 600, shadow: false, alpha: ta * E.out2(uu), spacing: 8 });
    }
  }

  // ---- year: a red pencil ellipse, the numerals ink in; at each flip the old ones fade and the new ones ink in ----
  const yu = prog(T.year, tq), yOut = 1 - prog(T.yearOut, tq);
  if (yu > 0 && yOut > 0) {
    const cx = W - 170, cy = 112;
    const rg = circlePts(cx, cy, 44, 64, 96);
    ctx.save(); ctx.globalAlpha = yOut;
    brush(prefix([...rg, rg[0], rg[1], rg[2]], E.out3(yu)), 3.4, { seed: 121, color: ACC.ring, t0: 6, t1: 14 });
    ctx.restore();
    for (let i = 0; i < YEARS.length; i++) {
      const [ty, label] = YEARS[i];
      const t0 = i === 0 ? T.year[0] + 0.12 : ty + 0.08;
      const s = settle(tq, t0);
      const gone = i + 1 < YEARS.length ? 1 - inv(YEARS[i + 1][0], YEARS[i + 1][0] + 0.2, tq) : 1;
      if (s.on && gone > 0) word(label, cx, cy + 17 + 5 * (1 - s.k), 50, 122 + i * 5, { shadow: false, alpha: s.a * gone * yOut, align: 'center' });
    }
  }

  // ---- end card: hand-lettered, inks in and holds still ----
  const ec = settle(tq, T.card, 0.4);
  if (ec.on && !CLEAN) {
    const cx = CARD[0], cy = CARD[1];
    const parts = END_CARD;
    ctx.font = `400 84px ${CN}`;
    let ws = parts.map((p) => ctx.measureText(p).width), tot = ws.reduce((a, b) => a + b, 0) + 30 * (parts.length - 1);
    const fs = Math.min(84, (84 * 720) / tot);            // fit the card column
    ctx.font = `400 ${fs}px ${CN}`;
    const gap = 30 * fs / 84;
    const gapAfter = (p) => (p.endsWith('，') ? 0 : gap);   // a full-width comma already carries its own space
    ws = parts.map((p) => ctx.measureText(p).width); tot = ws.reduce((a, b) => a + b, 0) + parts.slice(0, -1).reduce((a, p) => a + gapAfter(p), 0);
    let x = cx - tot / 2;
    parts.forEach((p, i) => {
      const s = settle(tq, T.card + i * (3 / 24), 0.33);
      if (s.on) letter(p, x, cy + 6 * (1 - s.k), fs, 1500 + i * 7, { alpha: s.a, shadow: p !== '·' });
      x += ws[i] + gapAfter(p);
    });
    const uu = inv(T.card + 0.5, T.card + 0.9, tq);
    if (uu > 0) brush(prefix(resample([[cx - tot / 2 - 10, cy + 30], [cx, cy + 35], [cx + tot / 2 + 10, cy + 28]], 4), E.out3(uu)), 4.4, { seed: 1600, color: ACC.line, t0: 8, t1: 30 });
    const sb = settle(tq, T.card + 0.7, 0.33);
    if (sb.on) word('2022.10 — 2026.01', cx, cy + 84, 40, 1700, { shadow: false, alpha: 0.85 * sb.a, align: 'center' });
  }

  // paper tooth multiply: one fixed sheet
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28;
  ctx.drawImage(TOOTH, 120, 90, W, H, 0, 0, W, H);
  ctx.restore();
};

// how much an icon sits under the landmark being drawn (0..1), for dimming it
function overlapK(st, s, anchor, act) {
  const box = (S, sc, an) => { const [x0, y0, x1, y1] = S.L.bb; return [an[0] + x0 * sc, an[1] + y0 * sc, an[0] + x1 * sc, an[1] + y1 * sc]; };
  const a = box(st, s, anchor), b = box(act, act.sH, act.dot);
  const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  return clamp((ix * iy) / Math.max(1, (a[2] - a[0]) * (a[3] - a[1])) * 3);
}

window.CUES = { HEROES, YEARS, T, STOPS: STOPS.map((s) => ({ zh: s.zh, s: s.s, arrive: s.arrive, draw: s.draw, fill: s.fill, label: s.label, detail: s.detail, leave: s.leave, shrink: s.shrink })) };
const Q = new URLSearchParams(location.search);
await window.renderAt(Q.has('t') ? +Q.get('t') : 0);
window.__ready = true;
