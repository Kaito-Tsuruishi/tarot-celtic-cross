#!/usr/bin/env node
// 解釈データ(JSON)の機械チェック。使い方: node scripts/validate.js data/*.json
const fs = require('fs');
const path = require('path');

const GENRES = ['general', 'love', 'work', 'money', 'relation', 'health'];
const SUITS = ['wands', 'cups', 'swords', 'pentacles'];
const SUIT_JA = { wands: 'ワンド', cups: 'カップ', swords: 'ソード', pentacles: 'ペンタクル' };
const SUIT_EN = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles' };
const MAJOR = [
  ['愚者', 'The Fool'], ['魔術師', 'The Magician'], ['女教皇', 'The High Priestess'], ['女帝', 'The Empress'],
  ['皇帝', 'The Emperor'], ['教皇', 'The Hierophant'], ['恋人', 'The Lovers'], ['戦車', 'The Chariot'],
  ['力', 'Strength'], ['隠者', 'The Hermit'], ['運命の輪', 'Wheel of Fortune'], ['正義', 'Justice'],
  ['吊るされた男', 'The Hanged Man'], ['死神', 'Death'], ['節制', 'Temperance'], ['悪魔', 'The Devil'],
  ['塔', 'The Tower'], ['星', 'The Star'], ['月', 'The Moon'], ['太陽', 'The Sun'],
  ['審判', 'Judgement'], ['世界', 'The World'],
];
const RANK_JA = { 1: 'エース', 11: 'ペイジ', 12: 'ナイト', 13: 'クイーン', 14: 'キング' };
const RANK_EN = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

// 期待される78枚の定義
const EXPECTED = {};
MAJOR.forEach(([ja, en], i) => {
  EXPECTED[`major-${String(i).padStart(2, '0')}`] = { nameJa: ja, nameEn: en, arcana: 'major', suit: null, rank: i };
});
for (const s of SUITS) {
  for (let r = 1; r <= 14; r++) {
    const ja = RANK_JA[r] || String(r);
    EXPECTED[`${s}-${String(r).padStart(2, '0')}`] = {
      nameJa: `${SUIT_JA[s]}の${ja}`, nameEn: `${RANK_EN[r]} of ${SUIT_EN[s]}`, arcana: 'minor', suit: s, rank: r,
    };
  }
}

const HEALTH_NG = ['病気', '病名', 'がん', '癌', '腫瘍', '手術', '入院', '死', '診断', '発症', '感染', 'うつ病', '障害', '余命', '治療', '薬'];
const LEN_MIN = 60, LEN_MAX = 120, LEN_HARD_MIN = 50, LEN_HARD_MAX = 140;

const errors = [], warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);
const allTexts = []; // {where, text}

function checkText(where, text, { health = false } = {}) {
  if (typeof text !== 'string' || !text.trim()) { err(`${where}: 文字列が空`); return; }
  const len = [...text].length;
  if (len < LEN_HARD_MIN || len > LEN_HARD_MAX) err(`${where}: 文字数 ${len}（${LEN_HARD_MIN}〜${LEN_HARD_MAX} 必須）`);
  else if (len < LEN_MIN || len > LEN_MAX) warn(`${where}: 文字数 ${len}（目安 ${LEN_MIN}〜${LEN_MAX}）`);
  if (!/[。！？]$/.test(text)) err(`${where}: 文末が「。」で終わっていない`);
  const sentences = text.split(/[。！？]/).filter(Boolean).length;
  if (sentences < 2 || sentences > 3) warn(`${where}: 文の数 ${sentences}（2文構成が基本）`);
  if (/\n/.test(text)) err(`${where}: 改行を含む`);
  if (health) {
    for (const ng of HEALTH_NG) if (text.includes(ng)) err(`${where}: 健康ジャンルの禁止語「${ng}」を含む`);
  }
  allTexts.push({ where, text });
}

function checkCard(c, file) {
  const id = c && c.id;
  const where = `${file} ${id || '(id なし)'}`;
  const exp = EXPECTED[id];
  if (!exp) { err(`${where}: 未知の id`); return; }
  for (const k of ['nameJa', 'nameEn', 'arcana', 'suit', 'rank']) {
    if (c[k] !== exp[k]) err(`${where}: ${k} が "${c[k]}"（期待 "${exp[k]}"）`);
  }
  for (const o of ['up', 'rev']) {
    const kw = c.keywords && c.keywords[o];
    if (!Array.isArray(kw) || kw.length < 3 || kw.length > 5) err(`${where}: keywords.${o} は 3〜5 個`);
    else kw.forEach((w, i) => { if (typeof w !== 'string' || [...w].length < 1 || [...w].length > 8) err(`${where}: keywords.${o}[${i}] の長さが不正`); });
    checkText(`${where} meaning.${o}`, c.meaning && c.meaning[o]);
  }
  if (!c.genres) { err(`${where}: genres がない`); return; }
  for (const g of GENRES) {
    if (!c.genres[g]) { err(`${where}: genres.${g} がない`); continue; }
    for (const o of ['up', 'rev']) checkText(`${where} genres.${g}.${o}`, c.genres[g][o], { health: g === 'health' });
  }
  const extra = Object.keys(c.genres).filter((g) => !GENRES.includes(g));
  if (extra.length) err(`${where}: 余計なジャンル ${extra.join(',')}`);
}

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node scripts/validate.js data/*.json'); process.exit(2); }
const seen = new Set();
let count = 0;
for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { err(`${f}: JSON パース失敗: ${e.message}`); continue; }
  if (!Array.isArray(arr)) { err(`${f}: トップレベルは配列`); continue; }
  for (const c of arr) {
    if (c && c.id) { if (seen.has(c.id)) err(`${f} ${c.id}: id 重複`); seen.add(c.id); }
    checkCard(c, path.basename(f));
    count++;
  }
}
// 完全一致の重複
const byText = new Map();
for (const { where, text } of allTexts) {
  if (byText.has(text)) err(`本文が完全一致: ${byText.get(text)} と ${where}`);
  else byText.set(text, where);
}
// 冒頭 18 文字一致（似すぎの警告）
const byHead = new Map();
for (const { where, text } of allTexts) {
  const head = [...text].slice(0, 18).join('');
  if (byHead.has(head)) warn(`冒頭が同じ: ${byHead.get(head)} と ${where}`);
  else byHead.set(head, where);
}
if (files.length && count === 78) {
  const missing = Object.keys(EXPECTED).filter((id) => !seen.has(id));
  if (missing.length) err(`不足カード: ${missing.join(', ')}`);
}

for (const w of warns) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(`\n${count} 枚 / 本文 ${allTexts.length} 件 / WARN ${warns.length} / ERROR ${errors.length}`);
process.exit(errors.length ? 1 : 0);
