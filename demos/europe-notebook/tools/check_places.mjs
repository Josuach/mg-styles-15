// Verify every route place lies inside its country.
// usage: node tools/check_places.mjs <path to world-atlas countries-10m.json>   (npm package world-atlas@2, ISC; data: Natural Earth, PD)
import fs from 'node:fs';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { PLACES } from '../places.js';
const ISO = { FR: 250, MC: 492, BE: 56, NL: 528, CH: 756, DE: 276, CZ: 203, SK: 703, HU: 348, AT: 40, GB: 826, DK: 208, SE: 752,
  FI: 246, NO: 578, SM: 674, IT: 380, VA: 336, AD: 20, ES: 724, PT: 620, SI: 705, HR: 191, BA: 70, LU: 442, RO: 642, BG: 100, RS: 688, PL: 616 };
const topo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const feats = topojson.feature(topo, topo.objects.countries).features;
let bad = 0;
for (const [, zh, en, lat, lon, cc] of PLACES) {
  const f = feats.find((x) => +x.id === ISO[cc]);
  // world-atlas 10m does not cut the Vatican out of Italy, so the Vatican passes when it sits on that country's own centroid
  const ok = f && (d3.geoContains(f, [lon, lat]) || (cc === 'VA' && d3.geoDistance(d3.geoCentroid(f), [lon, lat]) < 1e-5));
  let near = '';
  if (!ok) { const hit = feats.find((x) => x.properties.name !== 'Maldives' && d3.geoContains(x, [lon, lat]));   // skip an antimeridian artefact
    near = hit ? `inside ${hit.properties.name}` : 'in no country (sea?)'; bad++; }
  if (!ok) console.log(`✗ ${zh} ${en} ${cc} ${near}`);
}
console.log(`${PLACES.length} places, ${new Set(PLACES.map((p) => p[5])).size} countries, ${bad} outside`);
