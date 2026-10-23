// 回帰テスト。テスト用サーバ（scripts/serve-test.js）が ?selftest を付けたページにだけ差し込む。
// 実際のブラウザの中でアプリを操作し、結果を /__report に送って画面にも表示する。
(async () => {
  const params = new URLSearchParams(location.search);
  if (!params.has('selftest')) return;

  const KEY = 'selftest:v1';
  const POS_NAME = ['現状', '障害・課題', '顕在意識・目標', '潜在意識・土台', '過去', '近い未来', '本人の姿勢', '周囲の環境', '願望と恐れ', '最終結果'];
  const POS_FRAME = { 1: 'now', 2: 'obstacle', 3: 'goal', 4: 'inner', 5: 'past', 6: 'future', 7: 'attitude', 8: 'environment', 9: 'hopefear', 10: 'outcome' };
  const SCENARIOS = [
    { genre: 'general' }, { genre: 'work' }, { genre: 'relation' },
    { genre: 'love', status: 'single' }, { genre: 'love', status: 'couple' },
  ];

  const store = JSON.parse(sessionStorage.getItem(KEY) || 'null') || { phase: 'main', results: [], started: Date.now() };
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(store));
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, timeout = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { if (fn()) return true; await wait(50); }
    return false;
  };
  const check = (name, ok, detail = '') => { store.results.push({ name, ok: !!ok, detail: String(detail) }); };
  const scale = () => (window.visualViewport ? window.visualViewport.scale : 1);
  const noOverflow = (label) => {
    const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
    check(`${label}: 横にはみ出さない`, sw <= iw + 1, `${sw}/${iw}`);
  };
  const sheet = () => $('card-sheet');
  const sheetOpen = () => sheet().open && !sheet().classList.contains('is-closing');
  const busy = () => document.body.classList.contains('is-busy');
  const expectedText = (card, rev, pos, genre, status) => {
    const t = (rev ? card.genres[genre].rev : card.genres[genre].up);
    const v = t[POS_FRAME[pos]] || t.now;
    return v && typeof v === 'object' ? v[status] : v;
  };
  const entryInfo = (pos) => {
    const li = $(`entry-${pos}`);
    const name = li.querySelector('h3').textContent;
    return { li, card: CARDS.find((c) => c.nameJa === name), rev: !!li.querySelector('.badge.rev'), text: li.querySelector('.text').textContent };
  };

  // シートの開閉アニメーションが終わるまで待つ
  async function settle() {
    await until(() => sheet().getAnimations().every((a) => a.playState !== 'running'), 3000);
    await wait(80);
  }

  async function closeSheetByButton() {
    $('sheet-close').click();
    await until(() => !sheet().open, 3000);
  }

  async function startScenario(sc) {
    if ($('screen-genre').hidden) { $('btn-change').click(); await wait(200); }
    document.querySelector(`.genre-btn[data-genre="${sc.genre}"]`).click();
    if (sc.status) {
      await until(() => !$('screen-love-status').hidden, 2000);
      noOverflow(`${sc.genre}: 状況の選択画面`);
      document.querySelector(`#love-status-list .genre-btn[data-status="${sc.status}"]`).click();
    }
    await until(() => !$('screen-spread').hidden && !busy() && !document.querySelector('.deck'), 8000);
  }

  async function runScenario(sc) {
    const label = sc.status ? `${sc.genre}(${sc.status})` : sc.genre;
    await startScenario(sc);
    check(`${label}: 10 枚が配られる`, document.querySelectorAll('.slot:not(.is-undealt)').length === 10 && !document.querySelector('.deck'));
    noOverflow(`${label}: スプレッド`);
    const tb = document.querySelector('.toolbar').getBoundingClientRect();
    check(`${label}: 上のボタン列が画面内`, tb.right <= window.innerWidth + 1, Math.round(tb.right));
    const scale0 = scale();

    for (let pos = 1; pos <= 10; pos++) {
      if (pos === 1) $('btn-flip').click(); else $('sheet-next').click();
      const opened = await until(() => sheetOpen() && !busy() && document.querySelectorAll('.card.is-flipped').length === pos, 8000);
      check(`${label} ${pos} 枚目: めくるとシートが開く`, opened);
      if (!opened) return;
      await settle();
      const r = sheet().getBoundingClientRect();
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      check(`${label} ${pos} 枚目: シートが画面内に収まる`, r.top >= -1 && r.bottom <= window.innerHeight + 1, `${Math.round(r.top)}-${Math.round(r.bottom)}/${window.innerHeight}`);
      check(`${label} ${pos} 枚目: シートの高さが画面の半分以上`, r.height >= vh * 0.5, `${Math.round(r.height)}/${Math.round(vh)}`);
      check(`${label} ${pos} 枚目: 開いても拡大しない`, Math.abs(scale() - scale0) < 0.01, `${scale0}→${scale()}`);
      check(`${label} ${pos} 枚目: 背景のスクロールを固定`, document.body.classList.contains('is-locked'));
      const posName = $('sheet-pos').querySelector('.pos-name').textContent;
      check(`${label} ${pos} 枚目: ポジション名`, posName === POS_NAME[pos - 1], posName);
      const e = entryInfo(pos);
      const exp = expectedText(e.card, e.rev, pos, sc.genre, sc.status);
      check(`${label} ${pos} 枚目: シートの解釈文がポジション専用の文`, document.querySelector('#sheet-body .sheet-text').textContent === exp, e.card.id);
      check(`${label} ${pos} 枚目: ログの解釈文も同じ`, e.text === exp);
    }
    // 10 枚目のシートから総合リーディングへ
    check(`${label}: 10 枚目のボタンが総合リーディングへ`, $('sheet-next').textContent === '総合リーディングを見る' && !$('sheet-next').hidden);
    $('sheet-next').click();
    await until(() => !sheet().open && !busy() && document.body.classList.contains('is-done'), 6000);
    await wait(300);
    const s = $('summary');
    check(`${label}: 総合リーディングが表示される`, !s.hidden && Math.abs(s.getBoundingClientRect().top) < 40, Math.round(s.getBoundingClientRect().top));
    check(`${label}: 並びに 10 枚`, document.querySelectorAll('.strip-item').length === 10);
    check(`${label}: 締めの文が 10 枚目と同じ`, document.querySelector('#summary .final .text').textContent === entryInfo(10).text);
    check(`${label}: 総合リーディングの段落がある`, document.querySelectorAll('#summary-body > p').length >= 5, document.querySelectorAll('#summary-body > p').length);
    check(`${label}: 総合リーディングに未定義の値がない`, !/undefined|NaN|null/.test($('summary-body').textContent));
    check(`${label}: 下の操作バーが消える`, getComputedStyle($('actionbar')).display === 'none');
    noOverflow(`${label}: 総合リーディング`);

    // 総合リーディングの並びから開く → 閉じるだけ・位置が戻る
    window.scrollTo(0, s.offsetTop + 200);
    await wait(200);
    const y0 = Math.round(window.scrollY);
    document.querySelector('.strip-item[data-pos="4"]').click();
    await until(() => sheetOpen(), 3000);
    await settle();
    check(`${label}: 並びから開くと「閉じる」だけ`, $('sheet-next').hidden && $('sheet-close').classList.contains('primary'));
    check(`${label}: 並びから開いても拡大しない`, Math.abs(scale() - scale0) < 0.01, `${scale0}→${scale()}`);
    await closeSheetByButton();
    await wait(200);
    check(`${label}: 閉じると読んでいた位置に戻る`, Math.abs(Math.round(window.scrollY) - y0) <= 2, `${y0}→${Math.round(window.scrollY)}`);
    check(`${label}: 閉じても背景の固定が残らない`, !document.body.classList.contains('is-locked'));
    check(`${label}: 総合リーディングに枠線が出ない`, getComputedStyle(s).outlineStyle === 'none');

    // 上のスプレッドから開く → 総合リーディングへ戻れる
    window.scrollTo(0, 0);
    await wait(200);
    document.querySelector('.card[data-pos="3"]').click();
    await until(() => sheetOpen(), 3000);
    await settle();
    check(`${label}: スプレッドから開くと総合リーディングへのボタン`, !$('sheet-next').hidden && $('sheet-next').textContent === '総合リーディングを見る');
    $('sheet-next').click();
    await until(() => !sheet().open && !busy(), 4000);
    await wait(300);
    check(`${label}: ボタンで総合リーディングへ移動`, Math.abs(s.getBoundingClientRect().top) < 40, Math.round(s.getBoundingClientRect().top));
  }

  async function runMain() {
    noOverflow('テーマ選択');
    // 恋愛 → 戻る
    document.querySelector('.genre-btn[data-genre="love"]').click();
    await until(() => !$('screen-love-status').hidden, 2000);
    $('btn-love-back').click();
    await wait(200);
    check('恋愛の状況選択から戻れる', !$('screen-genre').hidden && $('screen-love-status').hidden);

    for (const sc of SCENARIOS) {
      try { await runScenario(sc); } catch (err) { check(`${sc.genre}${sc.status || ''}: 例外なし`, false, err && err.stack); }
    }

    // もう一度占う
    $('btn-again-2').click();
    await until(() => !busy() && !document.querySelector('.deck'), 8000);
    check('もう一度占うで引き直せる', document.querySelectorAll('.card.is-flipped').length === 0 && $('summary').hidden && !document.body.classList.contains('is-done'));
    check('もう一度占うでも恋愛の状況を保つ', $('genre-chip').textContent.includes('交際中'));

    // 3 枚めくってから再読み込み
    $('btn-flip').click();
    for (let i = 2; i <= 3; i++) { await until(() => sheetOpen() && !busy(), 6000); await wait(300); $('sheet-next').click(); }
    await until(() => sheetOpen() && !busy() && document.querySelectorAll('.card.is-flipped').length === 3, 6000);
    await closeSheetByButton();
    store.phase = 'reload';
    store.beforeReload = { chip: $('genre-chip').textContent, cards: [1, 2, 3].map((p) => entryInfo(p).card.id) };
    save();
    location.reload();
  }

  async function runAfterReload() {
    await wait(800);
    const b = store.beforeReload;
    check('再読み込み: 途中の状態に戻る', !$('screen-spread').hidden && document.querySelectorAll('.card.is-flipped').length === 3);
    check('再読み込み: 同じカード', JSON.stringify([1, 2, 3].map((p) => entryInfo(p).card.id)) === JSON.stringify(b.cards));
    check('再読み込み: 恋愛の状況も戻る', $('genre-chip').textContent === b.chip, $('genre-chip').textContent);
    $('btn-flip').click();
    const ok = await until(() => sheetOpen() && !busy() && document.querySelectorAll('.card.is-flipped').length === 4, 6000);
    check('再読み込み: 続きからめくれる', ok);
    await closeSheetByButton();
    $('btn-change').click();
    await wait(300);
    check('ジャンルを変えるでテーマ選択に戻る', !$('screen-genre').hidden && $('screen-spread').hidden);
    store.phase = 'done';
  }

  if (store.phase === 'main') { sessionStorage.removeItem('celtic-cross:v3'); }
  try {
    if (store.phase === 'main') await runMain();
    else if (store.phase === 'reload') await runAfterReload();
  } catch (err) { check('例外なし', false, err && err.stack); store.phase = 'done'; }
  if (store.phase !== 'done') return;
  save();

  const failed = store.results.filter((r) => !r.ok);
  const report = { ua: navigator.userAgent, viewport: `${window.innerWidth}x${window.innerHeight}`, total: store.results.length, failed: failed.length, seconds: Math.round((Date.now() - store.started) / 1000), failures: failed, results: store.results };
  try { await fetch('/__report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(report) }); } catch (e) { /* 表示だけで済ませる */ }
  sessionStorage.removeItem(KEY);
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:auto 8px 8px 8px;z-index:99999;padding:12px;border-radius:8px;font:14px/1.5 sans-serif;color:#fff;max-height:50vh;overflow:auto;background:' + (failed.length ? '#8e3b36' : '#2e6b3a');
  box.textContent = `回帰テスト: ${report.total - report.failed}/${report.total} 合格（${report.seconds} 秒）` + (failed.length ? '\n' + failed.map((f) => `✗ ${f.name} ${f.detail}`).join('\n') : '');
  box.style.whiteSpace = 'pre-wrap';
  document.body.appendChild(box);
})();
