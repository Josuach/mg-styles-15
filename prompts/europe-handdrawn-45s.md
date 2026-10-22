# 手绘插画动画 · 欧洲手札 Drawn Across Europe（45 秒）

**基于**：[05-cel-boil.md](05-cel-boil.md)（逐帧手绘「手作」）的笔刷和一拍二节奏，但**去掉线条抖动（line boil）**，动作以淡入、平稳落定为主。创意种子是 2022–2026 欧洲旅行记录（81 站 · 29 国 · 15 次旅行 · 22 个主角站）。

**样片**：[demos/europe-boil/](../demos/europe-boil/)（3 秒：开场 + 巴黎这一站）就是这份提示词要的画风，在本仓库里跑时可以直接参考它的代码。线条动画版的提示词保留在 [europe-one-line-45s.md](europe-one-line-45s.md)。

**数据来源**：https://jh-europe-traveled-map.fly.dev/ （2026-10-22 读取）

## 怎么用

1. 新建一个空文件夹，在里面打开一个能写代码、能执行命令的 AI 助手（例如 Claude Code）。本机需要 Node、Chrome 和 ffmpeg。如果直接在本仓库里跑，可以复用 `harness/render.mjs`、`demos/05-cel-boil/js/engine.js` 的笔刷，以及 `demos/europe-boil/` 的样片代码。
2. 把下面「提示词」整段复制进去发送。
3. 想换标题：改 `Creative seed` 里 `Title` 那一行。想换主角站、文案或配色：改分镜表和配色；`Route data` 是完整行程，一般不用动。不要删 `Signature features` 那一段。
4. 成片出来后，另开一个 AI 用 [rubric.md](../rubric.md) 评审，把意见贴回去再改一轮。评审时提醒评委：这支片**有意不做 line boil**。

## 提示词

```text
You are the director, motion designer, engineer and sound designer of ONE 45-second motion-design film.
The goal is the most classic, yet most stunning form of this style — award-shortlist / high-end commercial quality. A clean,
template-looking result is a fail. Benchmarks: Buck, Giant Ant, Ordinary Folk, Oliver Jeffers / Sempé-style travel
sketchbooks, Moleskine and travel-journal illustration, top Behance/Motionographer features, top 抖音/B站 designer accounts.

# Style
手绘插画动画 Hand-inked cel illustration, animated on twos — calm, NO line boil.
Built on 逐帧手绘 Cel Animation technique (variable-width ink brush, off-register colour fills, paper, drawings on twos), but
deliberately without line boil, smear frames, squash-and-stretch or bounce. The result should feel like the pages of a
travel sketchbook coming to life, quietly and steadily.

# Output (fixed)
- 1920×1080, 24 fps, exactly 45.000 s (1080 frames), H.264 MP4 with stereo AAC audio (48 kHz), mastered to −14 LUFS
  integrated, true peak ≤ −1 dBTP. Final file: video.mp4.

# Suggested technical route
HTML Canvas2D: custom variable-width brush renderer (centreline + pressure → outline polygon, tapered ends, slight pressure
noise along the arc length). Give every shape its hand-drawn wobble ONCE, in the shape's own local coordinates (seeded noise
displacement baked at load time), then only transform it — so nothing shimmers while it holds or while the camera moves.
Animate on twos: read all animation at the exposed frame (frame − frame % 2); the end hold on threes.
Map: Natural Earth 1:50m coastlines (public domain) via topojson-client + d3-geo, conic equal-area projection centred on
Europe (roughly 25°W–35°E, 34°N–62°N). Geocode every place in Route data yourself and verify each one lands inside the right
country before animating.
(You may choose a better route if it clearly raises quality; say why.)

# Creative seed
A personal travel log drawn into a sketchbook. From October 2022 to January 2026 one traveller visited 81 places in
29 European countries over 15 trips. One continuous ink line walks the route in date order across a pencil map, inks a dot
at every place it passes, and at 22 hero stops draws that place's landmark and colours it in.

Title: 欧洲手札 / Drawn Across Europe

Look
- Paper: warm cream (#F4E9D0) with a softened real paper grain (≈55 % opacity over the flat cream) and a fixed paper-tooth
  multiply (≈28 %). The paper never changes from frame to frame.
- Palette, six colours (plus paper), each also usable as a 50 % tint (mixed with the paper colour) — never any other hue:
  ink #1C1613 (lines, lettering) · tomato red #E5402B (roofs, brick, flowers, label shadows and underlines, shadow hatching) ·
  sunny yellow #FFC425 (iron and gilding: 埃菲尔铁塔, 大本钟, gold details, the star) · sea blue #3F7FB8 (only water: sea, lakes,
  rivers, canals; its tint for sky shadows and slate roofs) · leaf green #5A9E5F (windmills, leaves, hills, gardens, gorges) ·
  sandstone #D4A96A (stone buildings). Tints give pink flowers, pale sky, snow shadows and distant hills without new hues.
- Colour discipline: each landmark uses at most 2–3 colours (only 哥本哈根's row houses may use the full set — they are the
  point of that stop). Neighbouring stops must not share the same dominant colour; follow the colour plan below.
- Map: coastlines in soft col-erase pencil (#6B5446, ≈34 % opacity, ~1.6 px) on a static background plate; they draw on once,
  outward from Paris, during the opening, then never move relative to the paper except with the camera.
- Route line: the ink brush, ~4–5 px, tapered at its ends, travelling in smooth arcs between places.
- Places: each visited place gets a small ink dot that inks in (fade + 2–3 px settle) as the line reaches it. The current
  place has a red core inside the dot.
- Year: top-right, the numerals in hand-lettering inside a red pencil ellipse. At each year flip the old numerals fade out
  and the new ones ink in; the red ellipse stays.

Motion principles (this is what makes it calm — follow strictly)
- NO line boil anywhere: background and foreground stay perfectly still once drawn.
- NO overshoot, bounce, squash-and-stretch, smear frames, elastic easing or speed lines.
- Things arrive by being drawn (stroke draw-on), inking in (fade 0→1 over ~0.3 s with a 4–8 px downward settle), or washing in
  (colour fills rise from the base). Ease-out cubic for arrivals, ease-in-out cubic for camera moves.
- Every drawing is held for two frames; the camera moves on twos as well. End hold on threes.

How a hero stop works
- The line arrives at the city dot; the camera pushes in (ease-in-out) until the landmark will stand ~40–45 % of the frame
  height. The same line then draws the landmark rising out of the map at that point.
- Landmark drawing standard (the most important quality bar):
  1. Real proportions from a reference — sketch the landmark's key proportions first and check them. Example, Eiffel Tower:
     platforms at 19 % / 38 % / 92 % of the height, base width ≈ 0.4 × height, concave leg curves, the great arch between the
     legs, the inverted-V gap between the legs above the first platform, lattice X-bracing on the upper mast.
  2. Three pen widths: main contour ~4.6 px, platforms/structure ~3.2 px, details/lattice ~1.9 px.
  3. Drawing order like an illustrator: contour first (slower), then structure, then details (fastest).
  4. One or two signature details only, not everything — enough that it reads as that exact place, never cluttered.
- Colour: after the contour is down, the fills (per the colour plan) wash up from the base, printed ~6 px off-register (up-right)
  from the ink. Then red-pencil hatching (fine, ~9 px gap) on the shadow side.
- Label: the Chinese place name in hand-lettering (red off-register shadow under ink) beside the landmark, a red brush
  underline draws under it, then a small letter-spaced line beneath, e.g. "PARIS · 2022.10".
- Each stop may have ONE small calm detail motion (the windmill sails turn slowly, a single ripple spreads on water, tulips
  open one by one, a small star settles on a spire) — no bursts, no FX clutter.
- Leaving: the label fades; the landmark scales down (ease-in-out) into a small icon pinned on its dot and stays in full
  colour at ~70 % size of a thumbnail; the tail of the line continues to the next stop — never lift the pen.
- Between hero stops the camera travels with the line at map scale; every non-hero place in Route data inks its dot in date
  order as the line passes. Long jumps (e.g. 伦敦 → 汉堡, 卢森堡 → 蒂米什瓦拉) are smooth eased sweeps, not dead travel.
- Twenty-two similar stops can turn monotonous: vary the camera move (push, pan, tilt-up), the landmark's scale and which side
  the label sits on; let neighbouring stops of the same trip (风车村 → 库肯霍夫花园, 剑桥 → 伦敦, 威尼斯 → 罗马) chain without the
  camera pulling back.

Story beats (cue sheet — keep these hit times; ±0.2 s is fine if it lands better on the music)
| Time        | Year | Hero stop      | Label line                | What the line draws                                   | Sound accent        |
| 0.0–2.0 s   |      | —              |                           | An ink blot bleeds open on Paris; the coastline pencils in outward; the title inks in character by character | ink drop, marimba notes under the four characters |
| 2.0–3.6 s   | 2022 | 巴黎           | PARIS · 2022.10           | Eiffel Tower (see the standard above); a small star settles on the antenna | musette (accordion) phrase |
| 3.6–5.2 s   | 2022 | 尼斯           | NICE · 2022.11            | Promenade des Anglais coast curve + parasols, blue sea | wave                |
| 5.2–6.8 s   | 2023 | 圣米歇尔山      | MONT-SAINT-MICHEL · 2023.02 | Abbey island rising from the tide                   | bell                |
| 6.8–8.4 s   | 2023 | 风车村          | ZAANSE SCHANS · 2023.04   | Windmill; the sails turn slowly                       | clog steps          |
| 8.4–10.0 s  | 2023 | 库肯霍夫花园    | KEUKENHOF · 2023.04       | Rows of tulips opening one after another (red + yellow) | glockenspiel     |
| 10.0–11.6 s | 2023 | 少女峰          | JUNGFRAU · 2023.04        | Snow peak + cog-railway train                         | cow bell            |
| 11.6–13.2 s | 2023 | 布达佩斯        | BUDAPEST · 2023.12        | Heroes' Square: the central column + the curved colonnades | cimbalom phrase |
| 13.2–14.8 s | 2023 | 哈尔施塔特      | HALLSTATT · 2023.12       | Lakeside village with its mirrored reflection, blue lake | water drop       |
| 14.8–16.4 s | 2023 | 新天鹅堡        | NEUSCHWANSTEIN · 2023.12  | Neuschwanstein's towers on the cliff                  | harp glissando      |
| 16.4–18.0 s | 2024 | 剑桥           | CAMBRIDGE · 2024.03       | King's College Chapel + a punt on the blue river      | choir "ah"          |
| 18.0–19.6 s | 2024 | 伦敦           | LONDON · 2024.03          | Big Ben                                               | clock chime         |
| 19.6–21.2 s | 2024 | 哥本哈根        | COPENHAGEN · 2024.03      | Nyhavn row houses on the blue harbour                 | seagull             |
| 21.2–22.8 s | 2024 | 斯德哥尔摩      | STOCKHOLM · 2024.03       | Stockholm City Hall (home of the Nobel banquet): tower with three crowns on the waterfront | brass fanfare |
| 22.8–24.4 s | 2024 | 威尼斯          | VENICE · 2024.04          | Gondola gliding along a blue canal                    | oar stroke          |
| 24.4–26.0 s | 2024 | 罗马           | ROME · 2024.04            | Spanish Steps + the Barcaccia fountain                | fountain splash     |
| 26.0–27.6 s | 2024 | 巴塞罗那        | BARCELONA · 2024.05       | Sagrada Família spires                                | Spanish guitar strum|
| 27.6–29.2 s | 2024 | 格拉纳达        | GRANADA · 2024.05         | Alhambra: the arcade of the Court of the Lions        | oud phrase          |
| 29.2–30.8 s | 2025 | 杜布罗夫尼克    | DUBROVNIK · 2025.05       | City walls + red roofs above the blue sea             | sea wind            |
| 30.8–32.4 s | 2025 | 卢森堡市        | LUXEMBOURG · 2025.06      | Old town on the gorge + the big arch bridge           | string pizzicato    |
| 32.4–34.0 s | 2025 | 布朗镇          | BRAN · 2025.12            | Bran Castle on its rock                               | low organ           |
| 34.0–36.4 s | 2026 | 奥斯维辛        | AUSCHWITZ · 2026.01       | Birkenau: railway tracks running into the gatehouse (see "The 奥斯维辛 stop" below) | music stops; only the pen |
| 36.4–38.2 s | 2026 | 蒙达尔纪        | MONTARGIS · 2026.01       | Small canal bridge; the line returns to France and closes the loop | main theme returns softly |
| 38.2–45.0 s |      | —              |                           | Camera eases out to the whole map: all 81 dots, the 22 landmark icons, the full route; end card held, still | final chord, glock on the end card |

Year flips: 2023 at 5.2 s, 2024 at 16.4 s, 2025 at 29.2 s, 2026 at 34.0 s.

Colour plan (dominant colour first; white = unfilled paper)
巴黎 yellow · 尼斯 blue sea + red parasols · 圣米歇尔山 sandstone + blue tide · 风车村 green + red roof ·
库肯霍夫花园 red and yellow tulips + green leaves · 少女峰 white snow with pale-blue shadows + red train · 布达佩斯 yellow gilding +
sandstone colonnade · 哈尔施塔特 blue lake + green hills · 新天鹅堡 white walls + pale-blue slate roofs + green hill ·
剑桥 sandstone chapel + blue river + green lawn · 伦敦 yellow + sandstone · 哥本哈根 multicolour row houses + blue harbour ·
斯德哥尔摩 red brick + yellow crowns + blue water · 威尼斯 blue canal + ink gondola · 罗马 pink (red tint) azaleas on sandstone
steps · 巴塞罗那 pale-yellow (yellow tint) stone + small red/green/yellow pinnacle mosaics · 格拉纳达 sandstone + green garden ·
杜布罗夫尼克 red roofs + blue sea · 卢森堡市 green gorge + sandstone bridge · 布朗镇 red roofs + white walls ·
奥斯维辛 grey pencil only · 蒙达尔纪 blue canal + green

The 奥斯维辛 stop (a memorial site — handle with restraint)
- All colour drains for this stop: no yellow or blue fill, no red hatching, no red underline, no star. The line slows down
  and draws, in grey pencil only, the railway tracks of Auschwitz-Birkenau running into the gatehouse. No gate inscription,
  no people, no barbed-wire spectacle.
- The music stops completely; only the pen-on-paper sound remains (at most one very low sustained note). No sound accent.
- The label 奥斯维辛 is set in grey with no red shadow. When the line moves on, the drawing fades out instead of becoming an
  icon; only a grey dot stays on the map.
- At 蒙达尔纪 the colour and the music come back softly, then build to the end card.

Hero moment: the final pull-back (from 38.2 s) — the whole sketchbook page reads at once: the route, every dot, every
landmark icon in colour, composed as a poster.
End card (centred, hand-lettered, inks in and holds still): 3 年 · 29 国 · 81 站 (first line, large, red off-register shadow)
and 2022.10 — 2026.01 (second line, smaller), with a red brush underline drawn beneath.

Opening title (0.25–1.25 s, top-left over the empty Atlantic, fades out as the camera pushes in): 欧洲手札 in hand-lettering,
characters inking in one after another (every 4 frames), red off-register shadow, a red brush underline, and DRAWN ACROSS
EUROPE small and letter-spaced beneath. The title holds perfectly still once inked.

Sound: a light, warm bed — pizzicato walking bass (~120 bpm) and soft marimba off-beats in E major, one more instrument layer
joining at each year flip. Gentle sound design synced to the drawings: an ink drop on the opening blot, marimba notes under
the title characters, a woodblock as the year ring is drawn, a pencil scribble whose texture follows the drawings on twos,
a soft whoosh on camera pushes, a soft "fwump" as colour washes in, per-stop accents as listed — kept small and musical
(in key, on the beat).

On-screen text (OFL fonts only: LXGW Marker Gothic / 霞鹜漫黑 for the Chinese hand-lettering, its Latin or Caveat for English):
- Title: 欧洲手札 / DRAWN ACROSS EUROPE
- Hero labels: the 22 Chinese place names exactly as in the table, plus the label lines as listed
- Year numerals; end card as above

Landmarks must be your own simplified drawings, not traces of photos.

Route data (all 81 places, in the order the line visits them; trips separated by "/")
2022-10-27 巴黎 / 2022-11-12 尼斯, 2022-11-12 戛纳, 2022-11-13 摩纳哥城 / 2023-02-18 格朗维尔(Granville),
2023-02-19 圣米歇尔山 / 2023-04-08 布鲁塞尔, 2023-04-09 风车村(Zaanse Schans), 2023-04-09 羊角村(Giethoorn),
2023-04-09 阿姆斯特丹, 2023-04-10 库肯霍夫花园 / 2023-04-29 安纳西, 2023-04-30 依云, 2023-04-30 少女峰, 2023-05-01 伯尔尼,
2023-05-01 蒙特勒, 2023-05-01 日内瓦, 2023-05-02 霞慕尼 / 2023-12-23 海德堡, 2023-12-24 玛丽亚温泉市, 2023-12-25 布拉格,
2023-12-26 布拉迪斯拉发, 2023-12-27 布达佩斯, 2023-12-28 维也纳, 2023-12-29 哈尔施塔特, 2023-12-29 萨尔茨堡,
2023-12-30 Reith bei Seefeld, 2023-12-30 施旺高, 2024-01-01 斯特拉斯堡 / 2024-03-09 剑桥, 2024-03-09 伦敦 /
2024-03-30 汉堡, 2024-03-30 哥本哈根, 2024-03-31 斯德哥尔摩, 2024-04-01 赫尔辛基, 2024-04-03 奥斯陆 /
2024-04-27 圣马力诺城, 2024-04-27 里米尼, 2024-04-28 博洛尼亚, 2024-04-28 米兰, 2024-04-29 威尼斯, 2024-04-30 罗马,
2024-04-30 梵蒂冈城, 2024-05-01 佛罗伦萨, 2024-05-01 比萨 / 2024-05-07 安道尔城, 2024-05-08 巴塞罗那, 2024-05-08 瓦伦西亚,
2024-05-09 格拉纳达, 2024-05-09 马拉加, 2024-05-10 塞维利亚, 2024-05-11 里斯本, 2024-05-11 罗卡角, 2024-05-12 托莱多,
2024-05-13 马德里 / 2025-05-01 卢布尔雅那, 2025-05-02 十六湖公园, 2025-05-02 扎达尔, 2025-05-03 斯普利特,
2025-05-03 杜布罗夫尼克, 2025-05-05 莫斯塔尔, 2025-05-06 萨拉热窝, 2025-05-07 武科瓦尔, 2025-05-07 佩奇,
2025-05-08 希欧福克, 2025-05-08 萨格勒布 / 2025-06-30 卢森堡市 / 2025-12-24 蒂米什瓦拉, 2025-12-25 锡比乌,
2025-12-26 布拉索夫, 2025-12-26 布朗镇, 2025-12-27 布加勒斯特, 2025-12-27 大特尔诺沃, 2025-12-28 普罗夫迪夫,
2025-12-29 索菲亚, 2025-12-29 尼什, 2025-12-30 贝尔格莱德 / 2026-01-17 华沙, 2026-01-18 奥斯维辛, 2026-01-18 克拉科夫 /
2026-01-24 蒙达尔纪
Note: 新天鹅堡 is the landmark of 施旺高 (Schwangau); its hero stop sits on the 施旺高 dot.

You are the director: you may refine the copy, the drawings and the exact beats if you find a stronger idea, but keep the
route data, the title, the 22 hero stops, the six-colour palette and colour plan, and the motion principles above (in particular: no line
boil, no bounce).

# Signature features and key techniques (the result is judged against these)
手绘插画动画：以手绘墨线和平涂色块为造型语言，像一本旅行手账在纸上一页页画出来。和经典逐帧手绘的区别是有意去掉 line boil：画好的东西完全静止，靠「画出来、上色、落定」推进，安静、稳重、温暖。
视觉特征 粗细变化的手绘墨线, 6 色（可用 50% 浅色）平涂且色块轻微错位, 相邻两站主色错开, 红铅笔排线阴影, 纸纹底, 手写字, 一拍二节奏, 画面静止不抖
关键技法 自定义变宽笔刷：中心线 + 压力 → 轮廓多边形，起笔收笔渐细，沿弧长有轻微压力变化
手绘不规则只生成一次：在图形自身坐标系里加一次噪声位移并固定，之后只做变换，保持时与运镜中都不闪动
一拍二：所有动画在曝光帧（偶数帧）上取值，结尾一拍三；运镜同样一拍二
出场方式只用 描线 / 淡入落定 / 色块从底部涨起；禁止 overshoot、squash & stretch、smear、弹性缓动
地标按真实比例 + 三种笔宽（主轮廓 / 结构 / 细节），先轮廓后结构再细节
色块错位约 6 px（右上），阴影面用红铅笔细排线
背景（纸、地图）是一张静止底图，只有前景在画

# How to work
1. Treatment. Write down one clear idea: a hook in the first 0.5 s (never open on more than 0.3 s of empty paper), an
   escalation, one unmistakable hero moment (here: the final pull-back at ~85 % of the runtime), and a composed end frame
   held ~2–3 s, still. Map every signature feature above to a moment. Keep one cue sheet (beats and hit times) that both the
   picture and the sound read from.
2. Key frames before motion. Build the look, render stills at 24+ key times (at least one per hero stop) and actually look
   at them. Check every landmark's proportions against a reference. Each still should be poster-worthy: composition,
   hierarchy, negative space, type set properly (kerning, line-height, CJK punctuation, ~5 % safe margins). Iterate until
   nothing looks default, generic, cramped or "AI-template".
3. Motion. Build the choreography and preview at low resolution. Step through it frame by frame: drawings on twos, spacing,
   easing, no overshoot. Compare consecutive held drawings — a finished element must not change at all (difference ≈ 0).
4. Sound. Write genre-correct music and sound design locked to the cue sheet. Check that visual hits land on audio onsets.
   Master to the output spec.
5. Final. Render at full resolution, then check: exactly 45.00 s, resolution, fps, audio present and at the right
   loudness, no black frames, no fallback fonts or tofu, no clipped elements at the frame edges, no shimmer or boil on any
   held element, no flicker of the paper, every place dot in the right country. Fix and repeat until you would submit it
   to a festival.
6. Write an honest self-critique: what is strongest, what is weakest, what you would do with more time.

# Rules
- Rendering must be deterministic: every frame is a pure function of time t. Seeded randomness only; no real-time clocks;
  no state-triggered CSS transitions. A reliable route: a web page that can draw any time t on request, captured frame by
  frame with a headless browser and encoded with ffmpeg.
- Assets: only CC0 / public domain / OFL / Apache / free-for-commercial-use. Record each source and licence in CREDITS.md.
- On-screen text must be correct and natural: idiomatic Chinese, proper CJK punctuation, no typos.

# Craft checklist (what a jury looks for)
- Style authenticity: it reads at once as a hand-inked travel sketchbook animated on twos; every signature technique above
  is present and executed correctly; nothing boils, bounces or shimmers.
- Drawing quality: landmarks in true proportion, recognisable at a glance, with a clear hierarchy of pen widths.
- Motion craft: purposeful easing, overlap and stagger, calm arrivals; transitions carried by the line and the camera, not
  crossfades.
- Rhythm: hits locked to the music; contrast between busy and calm; no monotony across 22 similar stops.
- Design: strong composition, grid, typographic hierarchy, the six-colour palette and its tints held strictly, 2–3 colours per landmark; paper and finishing
  consistent.
- Technical polish: no jitter, no popping, no aliasing, no banding, no fallback fonts, no half-loaded images.
- Sound: genre-correct, musical, synced, mastered.

# Before you deliver, score yourself honestly
1–10 on style fidelity, concept wow, drawing quality, motion craft, design & typography, finish & texture, sound & sync,
technical (6 = template-level, 8 = high-end agency, 9 = award shortlist). Aim for 9; fix whatever scores lowest first.

# Deliver
video.mp4, plus a short report: the concept in two sentences; a beat sheet with timecodes; how each signature feature is
realised; the tech route; check numbers (duration, resolution, fps, loudness, true peak); your honest top-3 weaknesses.
```
