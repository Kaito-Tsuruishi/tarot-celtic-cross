#!/usr/bin/env node
// 時間枠別の解釈文の検証。使い方: node scripts/validate-frames.js data/frames/*.json
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const BASE_FILES = ['major-a', 'major-b', 'wands', 'cups', 'swords', 'pentacles'];
const BASE = {};
for (const f of BASE_FILES) {
  const p = path.join(root, 'data', `${f}.json`);
  if (fs.existsSync(p)) for (const c of JSON.parse(fs.readFileSync(p, 'utf8'))) BASE[c.id] = c;
}
const FRAMES = ['inner', 'past', 'future', 'obstacle', 'goal', 'attitude', 'environment', 'hopefear', 'outcome'];
const LEN_MIN = 60, LEN_MAX = 120, LEN_HARD_MIN = 50, LEN_HARD_MAX = 140;
const NG = ['必ず', '絶対', 'してしまいます', 'このカード', '今日', '今週', '来月', '来週'];
const errors = [], warns = [];
const all = [];
const head = (t) => [...t].slice(0, 18).join('');

function checkText(where, text, base) {
  if (typeof text !== 'string' || !text.trim()) { errors.push(`${where}: 空`); return; }
  const len = [...text].length;
  if (len < LEN_HARD_MIN || len > LEN_HARD_MAX) errors.push(`${where}: 文字数 ${len}`);
  else if (len < LEN_MIN || len > LEN_MAX) warns.push(`${where}: 文字数 ${len}（目安 60〜120）`);
  if (!/[。！？]$/.test(text)) errors.push(`${where}: 文末が「。」でない`);
  if (/\n/.test(text)) errors.push(`${where}: 改行`);
  const n = text.split(/[。！？]/).filter(Boolean).length;
  if (n < 2 || n > 3) warns.push(`${where}: 文の数 ${n}`);
  for (const w of NG) if (text.includes(w)) errors.push(`${where}: 禁止語「${w}」`);
  if (base) {
    if (text === base) errors.push(`${where}: 現在枠と同一`);
    else if (head(text) === head(base)) errors.push(`${where}: 現在枠と冒頭 18 文字が同じ`);
    else {
      // 文字の重なりが大きすぎる（時制だけ変えた文）を警告
      const a = new Set([...base]), b = [...text];
      const overlap = b.filter((ch) => a.has(ch)).length / b.length;
      if (overlap > 0.9) warns.push(`${where}: 現在枠と文字の重なり ${(overlap * 100).toFixed(0)}%（時制だけの変更の疑い）`);
    }
  }
  all.push({ where, text });
}

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node scripts/validate-frames.js <json...>'); process.exit(2); }
let cards = 0;
for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { errors.push(`${f}: JSON パース失敗 ${e.message}`); continue; }
  for (const c of arr) {
    cards++;
    const base = BASE[c.id];
    const where0 = `${path.basename(f)} ${c.id}`;
    if (!base) { errors.push(`${where0}: 未知の id`); continue; }
    if (!c.frames) { errors.push(`${where0}: frames がない`); continue; }
    for (const [genre, g] of Object.entries(c.frames)) {
      if (!base.genres[genre]) { errors.push(`${where0}: 未知のジャンル ${genre}`); continue; }
      for (const o of ['up', 'rev']) {
        if (!g[o]) { errors.push(`${where0} ${genre}.${o}: がない`); continue; }
        const present = FRAMES.filter((fr) => fr in g[o]);
        if (!present.length) errors.push(`${where0} ${genre}.${o}: 枠が 1 つもない`);
        for (const fr of present) checkText(`${where0} ${genre}.${o}.${fr}`, g[o][fr], base.genres[genre][o]);
        const extra = Object.keys(g[o]).filter((k) => !FRAMES.includes(k));
        if (extra.length) errors.push(`${where0} ${genre}.${o}: 余計なキー ${extra.join(',')}`);
      }
    }
  }
}
// 決まり文句の使いすぎ（枠ごとに、本文の 3 割を超えたら警告）
const STOCK = {
  inner: ['心の奥', '心のどこか'],
  past: ['名残', '手放', '持ち越', '遠ざか'],
  future: ['これから来', '近づいて', '入ってき', 'これから入'],
  obstacle: ['立ちはだか', '壁', '足かせ'],
  goal: ['理想', '目指して'],
  attitude: ['構え', '姿勢'],
  outcome: ['落ち着き', 'たどり着'],
};
for (const [fr, words] of Object.entries(STOCK)) {
  const texts = all.filter((t) => t.where.endsWith(`.${fr}`));
  if (!texts.length) continue;
  for (const w of words) {
    const n = texts.filter((t) => t.text.includes(w)).length;
    if (n / texts.length > 0.3) warns.push(`${fr}: 「${w}」が ${n}/${texts.length} 件（3 割超）`);
  }
}
const byText = new Map();
for (const { where, text } of all) {
  if (byText.has(text)) errors.push(`完全一致: ${byText.get(text)} と ${where}`); else byText.set(text, where);
}
const byHead = new Map();
for (const { where, text } of all) {
  const h = head(text);
  if (byHead.has(h)) warns.push(`冒頭が同じ: ${byHead.get(h)} と ${where}`); else byHead.set(h, where);
}
for (const w of warns) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(`\n${cards} 枚 / 本文 ${all.length} 件 / WARN ${warns.length} / ERROR ${errors.length}`);
process.exit(errors.length ? 1 : 0);
