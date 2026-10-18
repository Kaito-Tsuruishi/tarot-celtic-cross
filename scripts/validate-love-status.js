#!/usr/bin/env node
// 恋愛の状況別の文の検証。使い方: node scripts/validate-love-status.js data/love-status/*.json
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const GROUPS = ['major-a', 'major-b', 'wands', 'cups', 'swords', 'pentacles'];
const FRAMES = ['now', 'obstacle', 'goal', 'inner', 'past', 'future', 'attitude', 'environment', 'hopefear', 'outcome'];

// 元の恋愛の文を key → text で引けるようにする
const SOURCE = {};
for (const g of GROUPS) {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'data', `${g}.json`), 'utf8'));
  for (const c of base) for (const o of ['up', 'rev']) SOURCE[`${c.id}|${o}|now`] = c.genres.love[o];
  for (const f of fs.readdirSync(path.join(root, 'data', 'frames')).filter((x) => x.startsWith(`${g}-`))) {
    for (const c of JSON.parse(fs.readFileSync(path.join(root, 'data', 'frames', f), 'utf8'))) {
      const l = c.frames.love;
      if (!l) continue;
      for (const o of ['up', 'rev']) for (const [k, t] of Object.entries(l[o] || {})) SOURCE[`${c.id}|${o}|${k}`] = t;
    }
  }
}

const NG_COMMON = ['必ず', '絶対', 'してしまいます', 'このカード', '今日', '今週', '来月', '来週'];
const NG_SINGLE = ['交際中', '同居', '結婚生活', '夫婦', '記念日', '倦怠期'];
const NG_COUPLE = ['片思い', '告白', '出会い', 'まだ付き合って'];
const errors = [], warns = [];
const head = (t) => [...t].slice(0, 18).join('');

function checkText(where, text, side, original) {
  if (typeof text !== 'string' || !text.trim()) { errors.push(`${where}: 空`); return; }
  const len = [...text].length;
  if (len < 50 || len > 140) errors.push(`${where}: 文字数 ${len}`);
  else if (len < 60 || len > 120) warns.push(`${where}: 文字数 ${len}（目安 60〜120）`);
  if (!/[。！？]$/.test(text)) errors.push(`${where}: 文末が「。」でない`);
  const n = text.split(/[。！？]/).filter(Boolean).length;
  if (n < 2 || n > 3) warns.push(`${where}: 文の数 ${n}`);
  for (const w of NG_COMMON) if (text.includes(w)) errors.push(`${where}: 禁止語「${w}」`);
  for (const w of side === 'single' ? NG_SINGLE : NG_COUPLE) if (text.includes(w)) errors.push(`${where}: ${side} 版に「${w}」`);
  if (original && text === original) errors.push(`${where}: 元の文と同一`);
  else if (original && head(text) === head(original)) errors.push(`${where}: 元の文と冒頭 18 文字が同じ`);
}

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node scripts/validate-love-status.js <json...>'); process.exit(2); }
const seen = new Set();
let count = 0;
for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { errors.push(`${f}: JSON パース失敗 ${e.message}`); continue; }
  for (const e of arr) {
    count++;
    const where = `${path.basename(f)} ${e.key}`;
    const original = SOURCE[e.key];
    if (!original) { errors.push(`${where}: 未知の key`); continue; }
    if (seen.has(e.key)) errors.push(`${where}: key 重複`);
    seen.add(e.key);
    if (e.side === 'single') checkText(`${where} alt`, e.alt, 'couple', original);
    else if (e.side === 'couple') checkText(`${where} alt`, e.alt, 'single', original);
    else if (e.side === 'both') {
      checkText(`${where} single`, e.single, 'single', original);
      checkText(`${where} couple`, e.couple, 'couple', original);
    } else errors.push(`${where}: side が不正 (${e.side})`);
  }
}
for (const w of warns) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(`\n${count} 件（元の恋愛の文 ${Object.keys(SOURCE).length} 件中）/ WARN ${warns.length} / ERROR ${errors.length}`);
process.exit(errors.length ? 1 : 0);
