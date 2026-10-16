#!/usr/bin/env node
// data/*.json と src/ を 1 つの HTML (dist/index.html) にまとめる
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const ORDER = ['major-a.json', 'major-b.json', 'wands.json', 'cups.json', 'swords.json', 'pentacles.json'];
const cards = [];
for (const f of ORDER) {
  const p = path.join(root, 'data', f);
  if (!fs.existsSync(p)) { console.warn(`skip (missing): data/${f}`); continue; }
  cards.push(...JSON.parse(fs.readFileSync(p, 'utf8')));
}
console.log(`cards: ${cards.length}`);

// 時間枠別の文（data/frames/*.json）を統合する。無い枠は現在枠の文で埋める
const FRAMES = ['inner', 'past', 'future', 'obstacle', 'goal', 'attitude', 'environment', 'hopefear', 'outcome'];
const framesById = {};
for (const f of fs.readdirSync(path.join(root, 'data', 'frames')).filter((x) => x.endsWith('.json')).sort()) {
  for (const c of JSON.parse(fs.readFileSync(path.join(root, 'data', 'frames', f), 'utf8'))) {
    framesById[c.id] = framesById[c.id] || {};
    for (const [g, v] of Object.entries(c.frames)) {
      const cur = framesById[c.id][g] || { up: {}, rev: {} };
      for (const o of ['up', 'rev']) Object.assign(cur[o], v[o] || {});
      framesById[c.id][g] = cur;
    }
  }
}
let filled = 0, missing = 0;
for (const c of cards) {
  for (const [g, v] of Object.entries(c.genres)) {
    const fr = (framesById[c.id] || {})[g] || {};
    for (const o of ['up', 'rev']) {
      const now = v[o];
      const out = { now };
      for (const k of FRAMES) {
        if (fr[o] && fr[o][k]) { out[k] = fr[o][k]; filled++; } else { out[k] = now; missing++; }
      }
      v[o] = out;
    }
  }
}
console.log(`frames: filled ${filled} / missing ${missing}`);

const dataJs = `const CARDS = ${JSON.stringify(cards)};`;
const html = read('src/index.html')
  .replace('<!--DATA-->', `<script>${dataJs.replace(/<\//g, '<\\/')}</script>`)
  .replace('<!--ART-->', `<script>\n${read('src/art.js')}</script>`)
  .replace('<!--READING-->', `<script>\n${read('src/reading.js')}</script>`)
  .replace('<!--APP-->', `<script>\n${read('src/app.js')}</script>`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log(`dist/index.html: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
