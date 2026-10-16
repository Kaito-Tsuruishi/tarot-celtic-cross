// 画面制御。ジャンル選択 → シャッフル → 10 枚を配る → 1 枚ずつめくる（拡大シートで読む） → 総合リーディング
(() => {
  const GENRES = [
    { id: 'general', name: '総合', en: 'GENERAL', desc: 'いまの流れ全体を見る' },
    { id: 'love', name: '恋愛', en: 'LOVE', desc: '相手との関係、片思い、パートナーシップ' },
    { id: 'work', name: '仕事', en: 'WORK', desc: '職場、キャリア、取り組んでいること' },
    { id: 'relation', name: '人間関係', en: 'RELATIONSHIPS', desc: '友人、家族、周囲との関わり' },
  ];
  // ポジションごとに使う時間枠。now=いま働いている影響 / inner=意識と心の奥 / past=過ぎ去りつつある影響 / future=これから・結末
  const POS_FRAME = { 1: 'now', 2: 'now', 7: 'now', 8: 'now', 3: 'inner', 4: 'inner', 9: 'inner', 5: 'past', 6: 'future', 10: 'future' };
  const FRAME_LABEL = { now: 'いま働いている影響として', inner: '心の内側の動きとして', past: '過ぎ去りつつある影響として', future: 'これから向かう流れとして' };
  const POSITIONS = [
    { n: 1, name: '現状', desc: 'あなたや物事全体を包んでいる空気。いま働いている影響。' },
    { n: 2, name: '障害・課題', desc: '立ちはだかっているものの性質。良いカードなら障害は深刻ではないか、良いものが裏目に出ていると読む。' },
    { n: 3, name: '顕在意識・目標', desc: '本人が意識している目標や理想。この状況で手が届く最善の形だが、まだ実現していないもの。' },
    { n: 4, name: '潜在意識・土台', desc: '物事の根っこ。すでに現実になって根付いているもの、心の奥にあるもの。' },
    { n: 5, name: '過去', desc: '過ぎ去った、または過ぎ去りつつある影響。' },
    { n: 6, name: '近い未来', desc: 'これから働き始める影響。' },
    { n: 7, name: '本人の姿勢', desc: 'この状況でのあなた自身の立場や態度。' },
    { n: 8, name: '周囲の環境', desc: '周りの人、立場、環境がこの件に与えている影響。' },
    { n: 9, name: '願望と恐れ', desc: '望んでいること、または恐れていること。同じカードがどちらにも読める。' },
    { n: 10, name: '最終結果', desc: 'ほかの 9 枚の影響がたどり着く結末。大アルカナなら特に重く、コートカードならその人物次第と読む。' },
  ];
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SHUFFLE_MS = 1100;
  const DEAL_STEP_MS = 130;
  const DEAL_MS = 560;
  const FLIP_MS = 620;
  const SHEET_CLOSE_MS = 220;
  const AFTER_FLIP_MS = 420;
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED.matches ? 0 : ms));

  const state = { genre: null, spread: [], next: 0, busy: false, seed: 0 };
  function setBusy(v) {
    state.busy = v;
    document.body.classList.toggle('is-busy', v);
  }
  const STORAGE_KEY = 'celtic-cross:v2';

  function saveState() {
    try {
      if (!state.genre) { sessionStorage.removeItem(STORAGE_KEY); return; }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        genre: state.genre,
        next: state.next,
        seed: state.seed,
        done: document.body.classList.contains('is-done'),
        cards: state.spread.map((c) => [c.card.id, c.rev ? 1 : 0]),
      }));
    } catch (e) { /* 保存できない環境では何もしない */ }
  }
  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!GENRES.some((g) => g.id === d.genre) || !Array.isArray(d.cards) || d.cards.length !== 10) return null;
      const spread = d.cards.map(([id, rev], i) => ({ pos: i + 1, card: CARDS.find((c) => c.id === id), rev: rev === 1 }));
      if (spread.some((c) => !c.card)) return null;
      return { genre: d.genre, next: Math.min(10, Math.max(0, d.next | 0)), spread, seed: d.seed >>> 0, done: !!d.done };
    } catch (e) { return null; }
  }

  // crypto.getRandomValues を使った一様乱数
  function randInt(n) {
    const max = Math.floor(0x100000000 / n) * n;
    const a = new Uint32Array(1);
    let v;
    do { crypto.getRandomValues(a); v = a[0]; } while (v >= max);
    return v % n;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function draw() {
    return shuffle(CARDS).slice(0, 10).map((card, i) => ({ pos: i + 1, card, rev: randInt(2) === 1 }));
  }
  const orientLabel = (c) => (c.rev ? '逆位置' : '正位置');
  const genreText = (c) => {
    const t = c.rev ? c.card.genres[state.genre].rev : c.card.genres[state.genre].up;
    return t[POS_FRAME[c.pos]] || t.now;
  };
  const keywordsOf = (c) => (c.rev ? c.card.keywords.rev : c.card.keywords.up);
  function cardLineHtml(c, tag = 'h3') {
    return `<div class="card-line">
      <${tag}>${c.card.nameJa}</${tag}>
      <div class="card-sub"><span class="badge ${c.rev ? 'rev' : 'up'}">${orientLabel(c)}</span><span class="en">${c.card.nameEn.toUpperCase()}</span></div>
    </div>`;
  }
  function thumbHtml(c, uid) {
    return `<div class="thumb${c.rev ? ' is-reversed' : ''}">${Art.face(c.card, uid)}</div>`;
  }

  // --- ジャンル選択 ---
  function renderGenres() {
    const ul = $('genre-list');
    ul.innerHTML = '';
    GENRES.forEach((g, i) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', i);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'genre-btn';
      b.dataset.genre = g.id;
      b.innerHTML = `<span class="name">${g.name}</span><span class="en">${g.en}</span><span class="desc">${g.desc}</span>`;
      b.addEventListener('click', () => start(g.id));
      li.appendChild(b);
      ul.appendChild(li);
    });
    $('positions-list').innerHTML = POSITIONS.map((p) => `<li><b>${p.name}</b>：${p.desc}</li>`).join('');
  }

  // --- 開始・配置 ---
  async function start(genreId) {
    if (state.busy) return;
    state.genre = genreId;
    state.spread = draw();
    state.next = 0;
    state.seed = randInt(0x7fffffff);
    setBusy(true);
    try {
      enterSpread();
      renderSpread();
      renderProgress();
      saveState();
      setStatus('カードを切っています…', true);
      await dealSequence();
    } finally {
      setBusy(false);
    }
    markNext();
    updateStatus();
    $('btn-flip').focus({ preventScroll: true });
  }

  // リロード後に途中の状態へ戻す（演出なし）
  function resume(saved) {
    state.genre = saved.genre;
    state.spread = saved.spread;
    state.next = saved.next;
    state.seed = saved.seed;
    setBusy(false);
    enterSpread();
    renderSpread();
    renderProgress();
    const root = $('spread');
    root.querySelector('.deck').remove();
    root.querySelectorAll('.slot').forEach((slot) => slot.classList.remove('is-undealt'));
    state.spread.slice(0, state.next).forEach((c) => {
      root.querySelector(`.card[data-pos="${c.pos}"]`).classList.add('is-flipped');
      appendEntry(c);
    });
    if (state.next >= 10) {
      buildSummary();
      if (saved.done) document.body.classList.add('is-done');
    }
    markNext();
    updateStatus();
  }

  function enterSpread() {
    const g = GENRES.find((x) => x.id === state.genre);
    $('genre-chip').textContent = `${g.name}の占い`;
    $('screen-genre').hidden = true;
    $('screen-spread').hidden = false;
    document.body.classList.add('in-spread');
    document.body.classList.remove('is-done');
    $('reading').innerHTML = '';
    $('summary').hidden = true;
    $('summary-body').innerHTML = '';
    $('summary-strip').innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderSpread() {
    const root = $('spread');
    root.innerHTML = '';
    const deck = document.createElement('div');
    deck.className = 'deck';
    deck.setAttribute('aria-hidden', 'true');
    deck.innerHTML = Array.from({ length: 6 }, (_, i) => `<div class="deck-card" style="--k:${i}">${Art.back()}</div>`).join('');
    root.appendChild(deck);
    state.spread.forEach((c) => {
      const p = POSITIONS[c.pos - 1];
      const slot = document.createElement('div');
      slot.className = 'slot is-undealt';
      slot.dataset.pos = String(c.pos);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card';
      btn.dataset.pos = String(c.pos);
      btn.disabled = true;
      btn.setAttribute('aria-label', `${c.pos} 枚目：${p.name}。まだめくっていません`);
      btn.innerHTML = `<div class="card-inner">
        <div class="card-face back">${Art.back()}</div>
        <div class="card-face front${c.rev ? ' is-reversed' : ''}">${Art.face(c.card, c.pos)}</div>
      </div>`;
      btn.addEventListener('click', () => onCardClick(c.pos));
      slot.appendChild(btn);
      const label = document.createElement('span');
      label.className = 'pos-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = String(c.pos);
      slot.appendChild(label);
      root.appendChild(slot);
    });
  }

  // 山札を切り、1 枚ずつ所定の位置へ配る
  async function dealSequence() {
    const root = $('spread');
    const deck = root.querySelector('.deck');
    const slots = [...root.querySelectorAll('.slot')];
    if (REDUCED.matches) {
      slots.forEach((s) => s.classList.remove('is-undealt'));
      deck.remove();
      return;
    }
    deck.classList.add('is-shuffling');
    await wait(SHUFFLE_MS);
    deck.classList.remove('is-shuffling');
    setStatus('カードを並べています…', true);
    const d = deck.getBoundingClientRect();
    const dc = { x: d.left + d.width / 2, y: d.top + d.height / 2 };
    slots.forEach((slot, i) => {
      const r = slot.getBoundingClientRect();
      const dx = dc.x - (r.left + r.width / 2);
      const dy = dc.y - (r.top + r.height / 2);
      const rot = slot.dataset.pos === '2' ? 90 : 0;
      slot.style.transition = 'none';
      slot.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.9)`;
      slot.style.transitionDelay = `${i * DEAL_STEP_MS}ms`;
    });
    // 初期位置を確定させてから遷移を開始する
    void root.offsetWidth;
    slots.forEach((slot) => {
      slot.style.transition = '';
      slot.classList.remove('is-undealt');
      slot.classList.add('is-landing');
      slot.style.transform = slot.dataset.pos === '2' ? 'rotate(90deg)' : 'translate(0, 0)';
    });
    deck.classList.add('is-fading');
    await wait(DEAL_STEP_MS * (slots.length - 1) + DEAL_MS + 60);
    slots.forEach((slot) => {
      slot.classList.remove('is-landing');
      slot.style.transform = '';
      slot.style.transitionDelay = '';
    });
    deck.remove();
  }

  // --- 進行 ---
  function renderProgress() {
    $('progress').innerHTML = POSITIONS.map((p) => `<span class="dot" data-pos="${p.n}" title="${p.n} ${p.name}"></span>`).join('');
    updateProgress();
  }
  function updateProgress() {
    document.querySelectorAll('#progress .dot').forEach((d) => {
      const pos = Number(d.dataset.pos);
      d.classList.toggle('is-done', pos <= state.next);
      d.classList.toggle('is-next', pos === state.next + 1);
    });
    $('progress').setAttribute('aria-label', `${state.next} / 10 枚めくりました`);
  }

  function markNext() {
    document.querySelectorAll('.card').forEach((b) => {
      const pos = Number(b.dataset.pos);
      const isNext = pos === state.next + 1;
      const flipped = pos <= state.next;
      b.classList.toggle('is-next', isNext);
      b.disabled = !isNext && !flipped;
      const p = POSITIONS[pos - 1];
      if (flipped) {
        const c = state.spread[pos - 1];
        b.setAttribute('aria-label', `${pos} 枚目：${p.name}。${c.card.nameJa}、${orientLabel(c)}。もう一度見る`);
      } else {
        b.setAttribute('aria-label', isNext ? `${pos} 枚目：${p.name}。めくる` : `${pos} 枚目：${p.name}。順番にめくってください`);
      }
    });
    updateProgress();
  }

  function setStatus(text, busy) {
    $('status-text').textContent = text;
    $('btn-flip').disabled = !!busy;
  }
  function updateStatus() {
    const btn = $('btn-flip');
    if (state.next >= 10) {
      setStatus('10 枚すべてをめくりました。', false);
      btn.textContent = '総合リーディングを見る';
      btn.onclick = () => goToSummary();
      return;
    }
    const p = POSITIONS[state.next];
    setStatus(`次は ${state.next + 1} 枚目「${p.name}」`, false);
    btn.textContent = state.next === 0 ? '1 枚目をめくる' : '次のカードをめくる';
    btn.onclick = () => flip(state.next + 1);
  }

  function onCardClick(pos) {
    if (pos <= state.next) { openSheet(state.spread[pos - 1]); return; }
    flip(pos);
  }

  async function flip(pos) {
    if (state.busy || pos !== state.next + 1) return;
    const c = state.spread[pos - 1];
    const btn = document.querySelector(`.card[data-pos="${pos}"]`);
    setBusy(true);
    try {
      setStatus(`${pos} 枚目「${POSITIONS[pos - 1].name}」をめくっています…`, true);
      await bringIntoView(btn);
      btn.classList.add('is-flipped', 'is-flipping');
      btn.classList.remove('is-next');
      await wait(FLIP_MS);
      btn.classList.remove('is-flipping');
      btn.classList.add('is-glow');
      setTimeout(() => btn.classList.remove('is-glow'), 1200);
      state.next = pos;
      appendEntry(c);
      markNext();
      updateStatus();
      saveState();
      if (state.next >= 10) buildSummary();
      await wait(AFTER_FLIP_MS);
    } finally {
      setBusy(false);
    }
    openSheet(c);
  }

  // カードが画面外（または操作バーの裏）にあれば中央へスクロールし、完了を待つ
  async function bringIntoView(el) {
    const r = el.getBoundingClientRect();
    const top = 56, bottom = window.innerHeight - 100;
    if (r.top >= top && r.bottom <= bottom) return;
    const target = window.scrollY + r.top + r.height / 2 - window.innerHeight / 2;
    await scrollTo(Math.max(0, target));
  }

  // 一定時間で確実に終わるスクロール（タブが背面でも止まらないよう setTimeout で刻む）
  function scrollTo(y, ms = 420) {
    if (REDUCED.matches) { window.scrollTo(0, y); return Promise.resolve(); }
    const from = window.scrollY;
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        const e = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, from + (y - from) * e);
        if (t < 1) setTimeout(step, 16); else resolve();
      };
      step();
    });
  }

  function appendEntry(c) {
    const p = POSITIONS[c.pos - 1];
    const li = document.createElement('li');
    li.className = 'entry';
    li.id = `entry-${c.pos}`;
    li.innerHTML = `
      <div class="pos">${c.pos}　${p.name}</div>
      <div class="entry-body">
        <button type="button" class="thumb-btn" aria-label="${c.card.nameJa}（${orientLabel(c)}）の詳細を見る">${thumbHtml(c, 100 + c.pos)}</button>
        <div class="entry-main">
          ${cardLineHtml(c)}
          <p class="text">${genreText(c)}</p>
        </div>
      </div>`;
    li.querySelector('.thumb-btn').addEventListener('click', () => openSheet(c));
    $('reading').appendChild(li);
  }

  // --- 拡大シート ---
  // シートを開いている間は背景のページをスクロールさせない（iOS では overflow: hidden だけでは効かない）
  let lockedY = null;
  function lockScroll() {
    if (lockedY !== null) return;
    lockedY = window.scrollY;
    document.body.style.top = `-${lockedY}px`;
    document.body.classList.add('is-locked');
  }
  function unlockScroll() {
    if (lockedY === null) return;
    const y = lockedY;
    lockedY = null;
    document.body.classList.remove('is-locked');
    document.body.style.top = '';
    window.scrollTo(0, y);
  }

  async function closeSheet() {
    const dlg = $('card-sheet');
    if (!dlg.open) return;
    if (!REDUCED.matches) {
      dlg.classList.add('is-closing');
      await wait(SHEET_CLOSE_MS);
      dlg.classList.remove('is-closing');
    }
    unlockScroll();
    dlg.close();
  }

  // シートを下に引っ張って閉じる
  function setupSheetDrag() {
    const dlg = $('card-sheet');
    const scroller = $('sheet-scroll');
    let touchId = null, startY = 0, dy = 0, dragging = false, startT = 0, closing = false;
    const CLOSE_PX = 110, CLOSE_VEL = 0.6, START_PX = 8;
    const findTouch = (e) => [...e.changedTouches].find((t) => t.identifier === touchId);
    dlg.addEventListener('touchstart', (e) => {
      if (closing) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      startY = t.clientY;
      startT = performance.now();
      dy = 0;
      dragging = false;
    }, { passive: true });
    dlg.addEventListener('touchmove', (e) => {
      if (closing) return;
      const t = findTouch(e);
      if (!t) return;
      const y = t.clientY - startY;
      if (!dragging) {
        // 本文が上端にあって下へ引いているなら、ブラウザのスクロールに渡さず自分で扱う
        if (y > 0 && scroller.scrollTop <= 0) {
          if (e.cancelable) e.preventDefault();
          if (y > START_PX) {
            dragging = true;
            startY = t.clientY; // ここを基準にして跳ばないようにする
            startT = performance.now();
            dlg.classList.add('is-dragging');
          }
        }
        return;
      }
      dy = Math.max(0, t.clientY - startY);
      dlg.style.transform = `translateY(${dy}px)`;
      dlg.style.setProperty('--drag', Math.min(1, dy / 300));
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    const end = async (e) => {
      if (!findTouch(e)) return;
      touchId = null;
      if (!dragging) return;
      dragging = false;
      dlg.classList.remove('is-dragging');
      const vel = dy / Math.max(1, performance.now() - startT);
      closing = true;
      dlg.classList.add('is-flinging');
      if (dy > CLOSE_PX || vel > CLOSE_VEL) {
        dlg.style.transform = 'translateY(110%)';
        await wait(200);
        dlg.classList.remove('is-flinging');
        dlg.style.transform = '';
        dlg.style.removeProperty('--drag');
        unlockScroll();
        dlg.close();
      } else {
        dlg.style.transform = '';
        dlg.style.removeProperty('--drag');
        await wait(200);
        dlg.classList.remove('is-flinging');
      }
      closing = false;
    };
    dlg.addEventListener('touchend', end);
    dlg.addEventListener('touchcancel', end);
  }

  function openSheet(c) {
    if (state.busy) return;
    const p = POSITIONS[c.pos - 1];
    const dlg = $('card-sheet');
    const isLast = state.next >= 10;
    const nextLabel = isLast ? '総合リーディングを見る' : (c.pos === state.next ? '次のカードをめくる' : 'スプレッドに戻る');
    $('sheet-body').innerHTML = `
      <div class="sheet-pos">${c.pos} 枚目<span class="sep">・</span>${p.name}<span class="frame">${FRAME_LABEL[POS_FRAME[c.pos]]}</span></div>
      <div class="sheet-hero">
        <div class="sheet-art${c.rev ? ' is-reversed' : ''}">${Art.face(c.card, 200 + c.pos)}</div>
        ${cardLineHtml(c, 'h2')}
      </div>
      <p class="sheet-text">${genreText(c)}</p>
      <details class="sheet-more">
        <summary>キーワード・基本の意味・このポジションについて</summary>
        <ul class="keywords" aria-label="キーワード">${keywordsOf(c).map((k) => `<li>${k}</li>`).join('')}</ul>
        <p class="sheet-basic"><span>基本の意味</span>${c.rev ? c.card.meaning.rev : c.card.meaning.up}</p>
        <p class="sheet-basic"><span>${c.pos}　${p.name}</span>${p.desc}</p>
      </details>`;
    const nextBtn = $('sheet-next');
    nextBtn.textContent = nextLabel;
    nextBtn.onclick = async () => {
      await closeSheet();
      if (isLast) {
        goToSummary();
      } else if (c.pos === state.next) {
        flip(state.next + 1);
      }
    };
    $('sheet-close').onclick = () => closeSheet();
    if (!dlg.open) { lockScroll(); dlg.showModal(); }
    $('sheet-scroll').scrollTop = 0;
    nextBtn.focus({ preventScroll: true });
  }

  async function goToSummary() {
    if (state.busy) return;
    document.body.classList.add('is-done');
    saveState();
    const el = $('summary');
    el.setAttribute('tabindex', '-1');
    setBusy(true);
    try {
      await scrollTo(window.scrollY + el.getBoundingClientRect().top - 12);
    } finally {
      setBusy(false);
    }
    el.focus({ preventScroll: true });
  }

  function buildSummary() {
    const r = Reading.build(state.spread, state.genre, state.seed);
    const c = r.final.card;
    $('summary-strip').innerHTML = state.spread.map((x) => `
      <button type="button" class="strip-item" data-pos="${x.pos}" aria-label="${x.pos} 枚目 ${POSITIONS[x.pos - 1].name}：${x.card.nameJa}、${orientLabel(x)}">
        ${thumbHtml(x, 300 + x.pos)}<span class="strip-pos">${x.pos}</span>
      </button>`).join('');
    $('summary-strip').querySelectorAll('.strip-item').forEach((b) => {
      b.addEventListener('click', () => openSheet(state.spread[Number(b.dataset.pos) - 1]));
    });
    const paras = [...r.counts, ...r.pairs].map((t) => `<p>${t}</p>`).join('');
    $('summary-body').innerHTML = `
      ${paras}
      <div class="final">
        <div class="pos">10　最終結果</div>
        <div class="final-body">
          ${thumbHtml(c, 400)}
          <div class="entry-main">
            ${cardLineHtml(c)}
            <p class="text">${r.final.text}</p>
          </div>
        </div>
      </div>`;
    $('summary').hidden = false;
  }

  function backToGenres() {
    if (state.busy) return;
    const dlg = $('card-sheet');
    if (dlg.open) { unlockScroll(); dlg.close(); }
    $('screen-spread').hidden = true;
    $('screen-genre').hidden = false;
    document.body.classList.remove('in-spread', 'is-done');
    state.genre = null;
    saveState();
    window.scrollTo({ top: 0, behavior: 'auto' });
    const first = document.querySelector('.genre-btn');
    if (first) first.focus({ preventScroll: true });
  }

  // --- 初期化 ---
  renderGenres();
  setupSheetDrag();
  const saved = loadState();
  if (saved) resume(saved);
  $('btn-again').addEventListener('click', () => { if (!state.busy) start(state.genre); });
  $('btn-again-2').addEventListener('click', () => { if (!state.busy) start(state.genre); });
  $('btn-change').addEventListener('click', backToGenres);
  $('btn-change-2').addEventListener('click', backToGenres);
  // シートの外側（背景）をタップで閉じる。Esc などで閉じた場合もスクロール固定を解除する
  $('card-sheet').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeSheet(); });
  $('card-sheet').addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });
  $('card-sheet').addEventListener('close', () => {
    unlockScroll();
    if (document.activeElement === document.body || document.activeElement === null) {
      $('btn-flip').focus({ preventScroll: true });
    }
  });
})();
