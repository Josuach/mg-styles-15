// Write cues.json (for the Python score scripts) from cues.js, the one cue sheet.  usage: node tools/dump_cues.mjs
import fs from 'node:fs';
import { HEROES, YEARS, T, END, DUR, stopCues } from '../cues.js';
const stops = HEROES.map((h) => ({ key: h[5], zh: h[0], start: h[2], end: h[3], ...stopCues(h) }));
const json = JSON.stringify({ stops, years: YEARS, T, end: END, dur: DUR }, (k, v) => (v === Infinity ? null : v), 1);
fs.writeFileSync(new URL('../cues.json', import.meta.url), json + '\n');
console.log(`cues.json: ${stops.length} stops, end ${END} s, card ${T.card} s, film ${DUR} s`);
