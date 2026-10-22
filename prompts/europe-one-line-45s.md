# 线条动画 · 欧洲手札 Drawn Across Europe（45 秒）

**基于**：[02-line-art.md](02-line-art.md)（ATELIER LINEA「一笔画」）· 改动：时长 10 秒 → 45 秒；创意种子换成 2022–2026 欧洲旅行记录（81 站 · 29 国 · 15 次旅行 · 22 个主角站）

**数据来源**：https://jh-europe-traveled-map.fly.dev/ （2026-10-22 读取）

## 怎么用

1. 新建一个空文件夹，在里面打开一个能写代码、能执行命令的 AI 助手（例如 Claude Code）。本机需要 Node、Chrome 和 ffmpeg。
2. 把下面「提示词」整段复制进去发送。
3. 想换标题：改 `Creative seed` 里 `Title` 那一行。想换主角站、文案或配色：改分镜表和配色；`Route data` 是完整行程，一般不用动。不要删 `Signature features` 那一段。
4. 成片出来后，另开一个 AI 用 [rubric.md](../rubric.md) 评审，把意见贴回去再改一轮。

## 提示词

```text
You are the director, motion designer, engineer and sound designer of ONE 45-second motion-design film.
The goal is the most classic, yet most stunning form of this style — award-shortlist / high-end commercial quality. A clean,
template-looking result is a fail. Benchmarks: Buck, ManvsMachine, Ordinary Folk, Giant Ant, Territory Studio, Apple keynote
motion, Pentagram motion identities, top Behance/Motionographer features, top 抖音/B站 designer accounts.

# Style
线条动画 Line Art / Line Animation

# Output (fixed)
- 1920×1080, 30 fps, exactly 45.000 s (1350 frames), H.264 MP4 with stereo AAC audio (48 kHz), mastered to −14 LUFS
  integrated, true peak ≤ −1 dBTP. Final file: video.mp4.

# Suggested technical route
HTML: SVG paths + stroke-dashoffset (getTotalLength) + GSAP; a virtual camera that follows the pen tip.
Map: Natural Earth 1:50m coastlines and country borders (public domain) via topojson-client + d3-geo, projected with a
conic equal-area projection centred on Europe (roughly 25°W–35°E, 34°N–62°N). Geocode every place in Route data yourself and
verify each one lands inside the right country before animating.
(You may choose a better route if it clearly raises quality; say why.)

# Creative seed
A personal travel log drawn as ONE continuous line. From October 2022 to January 2026 one traveller visited 81 places in
29 European countries over 15 trips. The whole film is a single pen line that walks the route in date order, lights every
place it passes, and at 22 hero stops draws that place's landmark.

Title: 欧洲手札 / Drawn Across Europe

Look
- Warm paper ground (#F3EDE2) with subtle fibre texture; one deep ink-navy line (#1F2A44), constant ~3 px, round caps, a
  softly glowing pen tip that leads the draw. A single accent: vermilion (#D9482B) for the "you are here" dot.
- The map itself is line art too: coastlines and borders are drawn on at the start in hairline ink at ~20 % opacity, so the
  route line always stays the hero.
- Visited places are small ink dots that pop on (slight overshoot) the moment the line reaches them; non-hero places show no
  label.
- A small year counter in the top-right corner (thin serif numerals) flips 2022 → 2023 → 2024 → 2025 → 2026 at the cue times.

Story beats (cue sheet — keep these hit times; ±0.2 s is fine if it lands better on the music)
| Time        | Year | Hero stop      | What the line draws                                   | Sound accent        |
| 0.0–2.0 s   |      | —              | Ink dot lands on paper; Europe's coastline draws on; the title writes on (Chinese large, English small beneath) | felt piano note, paper whisper |
| 2.0–3.6 s   | 2022 | 巴黎           | Eiffel Tower                                          | accordion phrase    |
| 3.6–5.2 s   | 2022 | 尼斯           | Promenade des Anglais coast curve + parasols          | wave                |
| 5.2–6.8 s   | 2023 | 圣米歇尔山      | Abbey island rising from the tide                      | bell                |
| 6.8–8.4 s   | 2023 | 风车村          | Windmill; the sails start turning                     | clog steps          |
| 8.4–10.0 s  | 2023 | 库肯霍夫花园    | Rows of tulips opening one after another              | glockenspiel sparkle|
| 10.0–11.6 s | 2023 | 少女峰          | Snow peak + cog-railway train                         | cow bell            |
| 11.6–13.2 s | 2023 | 布达佩斯        | Heroes' Square: the central column + the curved colonnades | cimbalom phrase |
| 13.2–14.8 s | 2023 | 哈尔施塔特      | Lakeside village with its mirrored reflection         | water drop          |
| 14.8–16.4 s | 2023 | 新天鹅堡        | Neuschwanstein's towers on the cliff                  | harp glissando      |
| 16.4–18.0 s | 2024 | 剑桥           | King's College Chapel + a punt on the river           | choir "ah"          |
| 18.0–19.6 s | 2024 | 伦敦           | Big Ben                                               | clock chime         |
| 19.6–21.2 s | 2024 | 哥本哈根        | Nyhavn row houses                                     | seagull             |
| 21.2–22.8 s | 2024 | 斯德哥尔摩      | Stockholm City Hall (home of the Nobel banquet): tower with three crowns on the waterfront | brass fanfare |
| 22.8–24.4 s | 2024 | 威尼斯          | Gondola gliding along a canal                         | oar stroke          |
| 24.4–26.0 s | 2024 | 罗马           | Spanish Steps + the Barcaccia fountain                | fountain splash     |
| 26.0–27.6 s | 2024 | 巴塞罗那        | Sagrada Família spires                                | Spanish guitar strum|
| 27.6–29.2 s | 2024 | 格拉纳达        | Alhambra: the arcade of the Court of the Lions        | oud phrase          |
| 29.2–30.8 s | 2025 | 杜布罗夫尼克    | City walls + red roofs                                | sea wind            |
| 30.8–32.4 s | 2025 | 卢森堡市        | Old town on the gorge + the big arch bridge           | string pizzicato    |
| 32.4–34.0 s | 2025 | 布朗镇          | Bran Castle on its rock                               | low organ           |
| 34.0–36.4 s | 2026 | 奥斯维辛        | Birkenau: railway tracks running into the gatehouse (see "The 奥斯维辛 stop" below) | music stops; only the pen |
| 36.4–38.2 s | 2026 | 蒙达尔纪        | Small canal bridge; the line returns to France and closes the loop | main theme returns softly |
| 38.2–45.0 s |      | —              | Camera dollies out to the whole map: all 81 dots lit, the landmark icons, the full route; end card held with living micro-motion | final chord, chime on the end card |

Year flips: 2023 at 5.2 s, 2024 at 16.4 s, 2025 at 29.2 s, 2026 at 34.0 s.

How a hero stop works
- The line arrives at the city dot, the camera pushes in, and the same line keeps going and draws the landmark rising out of
  the map at that point (about 1/3 of frame height while in focus). A thin serif label with the Chinese place name fades up
  beside it.
- After the hold the line's tail leaves the landmark toward the next stop; the landmark shrinks into a small icon pinned to
  its dot and dims to ~35 %. The tail of each landmark is the start of the next route segment — never lift the pen.
- Between hero stops the camera travels with the tip at map scale; the line follows smooth arcs (not straight rulers), and
  every non-hero place in Route data lights up as the tip passes it, in date order, each with a tiny soft tick (kalimba or
  pizzicato) that follows the music's grid.
- Long jumps (e.g. 伦敦 → 汉堡, 卢森堡 → 蒂米什瓦拉) are fast eased sweeps with motion blur, not dead travel.
- Twenty-two similar stops can turn monotonous: vary the camera move (push, pan, tilt-up, rack along the line), the landmark's
  scale and the draw direction; let neighbouring stops of the same trip (风车村 → 库肯霍夫花园, 剑桥 → 伦敦, 威尼斯 → 罗马)
  chain into each other without the camera pulling back.

The 奥斯维辛 stop (a memorial site — handle with restraint)
- The line slows down and draws the railway tracks of Auschwitz-Birkenau running into the gatehouse. No gate inscription,
  no people, no barbed-wire spectacle.
- The music stops completely; only the pen-on-paper sound and, at most, one very low sustained note remain. No sound accent.
- The label 奥斯维辛 is set in grey. When the line moves on, the drawing fades out instead of shrinking into an icon; only a
  grey dot stays on the map.
- At 蒙达尔纪 the music comes back softly and then builds to the end card.

Hero moment: the final pull-back (from 38.2 s) — the whole route reads at once as one drawing, composed as a poster.
LINE-TO-FILL moment: on the end card, the outline of Europe floods with a very light ink wash from the final dot.

Sound: felt piano + soft strings; one more instrument layer joins at each year flip so the score builds through the film. A
pen-on-paper whisper whose loudness follows tip speed. Per-stop accents as listed, kept small and musical (in key, on the
beat) — never a sound-effect collage.

On-screen text (OFL serif such as Noto Serif SC / Source Han Serif for Chinese, a matching OFL serif for English):
- Title: 欧洲手札 (large) / Drawn Across Europe (small, letter-spaced, beneath)
- Hero labels: the 22 place names exactly as in the table
- End card: 3 年 · 29 国 · 81 站 (first line) and 2022.10 — 2026.01 (second line, smaller)

Landmarks must be your own simplified line drawings, not traces of photos; all drawn with the same constant-width line.

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
route data, the title and the 22 hero stops, and the result must remain the CANONICAL, instantly-recognisable form of this
style and must hit its signature features below.

# Signature features and key techniques (the result is judged against these)
以单色细线为唯一造型语言，线条自我描绘（draw-on）、延伸、转折并变形为下一个图形，一笔连成整支片子。极简高级感强，常见于奢侈品、金融、建筑类品牌片和 logo 动画。
视觉特征 等宽细线, 单色或双色, 大量负空间, 线条连续生长, 线面转换瞬间
关键技法 核心是 stroke 描绘：AE 用 Trim Paths 0→100%，Web 端用 SVG stroke-dasharray/dashoffset
线宽全片恒定（2~4px），转角处让描绘速度略减速，用 easeInOut cubic-bezier(0.65,0,0.35,1)
'一笔画'叙事：上一图形的尾线即下一图形的起线，路径提前在 Illustrator 里连好
线转面：描完轮廓后用同路径的 fill 从锚点扩展填充
配合微小的端点圆头（round cap）与路径抖动可增加手绘感

# How to work
1. Treatment. Write down one clear idea: a hook in the first 0.5 s (never open on more than 0.3 s of empty or black), an
   escalation, one unmistakable hero moment (here: the final pull-back at ~85 % of the runtime), and a composed end frame
   held ~2–3 s with living micro-motion. Map every signature feature above to a moment. Keep one cue sheet (beats and hit
   times) that both the picture and the sound read from.
2. Key frames before motion. Build the look, render stills at 24+ key times (at least one per hero stop) and actually
   look at them. Each still should be poster-worthy: composition, hierarchy, negative space, type set properly (kerning,
   line-height, weight contrast, CJK punctuation, ~5 % safe margins). Iterate until nothing looks default, generic, cramped
   or "AI-template".
3. Motion. Build the choreography and preview at low resolution. Step through the fastest moves frame by frame: spacing,
   easing, arcs, overlap, anticipation and follow-through, motion blur. No unintended dead spans; the energy follows the music.
4. Sound. Write genre-correct music and sound design locked to the cue sheet. Check that visual hits land on audio onsets.
   Master to the output spec.
5. Final. Render at full resolution (motion blur where apt), then check: exactly 45.00 s, resolution, fps, audio present and at
   the right loudness, no black frames, no fallback fonts or tofu, no clipped elements at the frame edges, no shimmer on thin
   lines, no gradient banding, every place dot in the right country. Fix and repeat until you would submit it to a festival.
6. Write an honest self-critique: what is strongest, what is weakest, what you would do with more time.

# Rules
- Rendering must be deterministic: every frame is a pure function of time t. Seeded randomness only; physics and particles
  precomputed or closed-form; no real-time clocks; no state-triggered CSS transitions. A reliable route: a web page that can
  draw any time t on request, captured frame by frame with a headless browser and encoded with ffmpeg.
- Assets: only CC0 / public domain / OFL / Apache / free-for-commercial-use. Record each source and licence in CREDITS.md.
- On-screen text must be correct and natural: idiomatic Chinese, proper CJK punctuation, no typos.

# Craft checklist (what a jury looks for)
- Style authenticity: an expert names the style in one second; every signature technique is present and executed correctly.
- Motion craft: purposeful easing (no linear unless mechanical by design), overlap and stagger, anticipation and
  follow-through, arcs, squash and stretch where the style allows, consistent physics, motion blur where apt; transitions
  carried by elements, not crossfades.
- Rhythm: hits locked to the music; contrast between busy and calm; no monotony across 22 similar stops — vary camera
  moves, landmark scale and draw direction.
- Design: strong composition, grid, typographic hierarchy, controlled palette; texture and finishing (grain, glow, vignette)
  only where the style wants it; nothing looks accidental.
- Technical polish: no jitter (unless intended), no popping, no aliasing, no banding, no fallback fonts, no half-loaded images.
- Sound: genre-correct, musical, synced, mastered.

# Before you deliver, score yourself honestly
1–10 on style fidelity, concept wow, motion craft, design & typography, finish & texture, sound & sync, technical
(6 = template-level, 8 = high-end agency, 9 = award shortlist). Aim for 9; fix whatever scores lowest first.

# Deliver
video.mp4, plus a short report: the concept in two sentences; a beat sheet with timecodes; how each signature feature is
realised; the tech route; check numbers (duration, resolution, fps, loudness, true peak); your honest top-3 weaknesses.
```
