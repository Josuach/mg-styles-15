# 欧洲手札 / Drawn Across Europe — credits and licences

Everything on screen is drawn by code at render time (`film.js`, `landmarks.js`). The 24 landmarks are my own simplified
drawings, built from the real buildings' proportions (noted in `landmarks.js`), not traced from photos.

| Asset | Used for | Source | Licence |
|---|---|---|---|
| LXGW Marker Gothic (霞鹜漫黑) 1.001 | Chinese hand-lettering: title, place names, years, end card | `google/fonts`, `ofl/lxgwmarkergothic/LXGWMarkerGothic-Regular.ttf` (raw.githubusercontent.com), converted to WOFF2 unchanged → `assets/fonts/europe/LXGWMarkerGothic-Regular.woff2` | SIL OFL 1.1 (`assets/fonts/europe/OFL-LXGWMarkerGothic.txt`) |
| Caveat 2.000 (variable, wght 400–700) | Latin lettering: DRAWN ACROSS EUROPE, label lines | `google/fonts`, `ofl/caveat/Caveat[wght].ttf`, converted to WOFF2 unchanged → `assets/fonts/europe/Caveat-Variable.woff2` | SIL OFL 1.1 (`assets/fonts/europe/OFL-Caveat.txt`) |
| Natural Earth 1:50m land (via `demos/22-hud/assets/land-50m.json`, world-atlas) | coastlines | naturalearthdata.com / npm `world-atlas` | public domain (data); ISC (packaging) |
| Natural Earth 1:10m admin-0 countries (npm `world-atlas@2.0.2`) | `tools/check_places.mjs` only: verifies each place lies in its country (not shipped) | npm | public domain (data); ISC (packaging) |
| Natural Earth 1:50m admin-0 countries (npm `world-atlas@2.0.2`) → `assets/countries-50m.json` | country borders on the map | npm | public domain (data); ISC (packaging) |
| Paper plates `paper_base.jpg`, `paper_tooth.png` | paper grain and tooth | `demos/05-cel-boil/assets`, built by `demos/05-cel-boil/tools/gen_paper.py` from ambientCG Paper001 | CC0 |
| Brush primitives | variable-width ink stroke, wobble, fills | `demos/05-cel-boil/js/engine.js` (this repo) | MIT (repo licence) |
| Instrument samples: marimba, kalimba, glockenspiel, harp, vibraphone, piano, cabasa, woodblock | score (`audio.py`) | VCSL via `lib/audio/samples` (this repo) | CC0 |
| Everything else in the score (pizzicato, bells, reed, brass, choir, SFX) | score | synthesised in `audio.py` | — |
| d3 7.9.0, topojson-client 3.1.0, simplex-noise 4.0.3 | projection, topology, noise | npm | ISC / ISC / MIT |

Route data: the traveller's own log at https://jh-europe-traveled-map.fly.dev/ (read 2026-10-22). Places were geocoded by
hand (`places.js`); `node tools/check_places.mjs <world-atlas>/countries-10m.json` → "81 places, 29 countries, 0 outside".
