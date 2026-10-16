// 画面制御。ジャンル選択 → シャッフル → 10 枚を配る → 1 枚ずつめくる（拡大シートで読む） → 総合リーディング
(() => {
  const GENRES = [
    { id: 'general', name: '総合', en: 'GENERAL', desc: 'いまの流れ全体を見る' },
    { id: 'love', name: '恋愛', en: 'LOVE', desc: '相手との関係、片思い、パートナーシップ' },
    { id: 'work', name: '仕事', en: 'WORK', desc: '職場、キャリア、取り組んでいること' },
    { id: 'money', name: '金運', en: 'MONEY', desc: '収入と支出、お金との付き合い方' },
    { id: 'relation', name: '人間関係', en: 'RELATIONSHIPS', desc: '友人、家族、周囲との関わり' },
    { id: 'health', name: '健康', en: 'HEALTH', desc: '体調、生活リズム、心身のバランス' },
  ];
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
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED.matches ? 0 : ms));

  const state = { genre: null, spread: [], next: 0, busy: false };

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
  const genreText = (c) => (c.rev ? c.card.genres[state.genre].rev : c.card.genres[state.genre].up);
  const keywordsOf = (c) => (c.rev ? c.card.keywords.rev : c.card.keywords.up);
  function cardLineHtml(c, tag = 'h3') {
    return `<div class="card-line">
      <${tag}>${c.card.nameJa}</${tag}>
      <span class="en">${c.card.nameEn.toUpperCase()}</span>
      <span class="badge ${c.rev ? 'rev' : 'up'}">${orientLabel(c)}</span>
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
    state.busy = true;
    const g = GENRES.find((x) => x.id === genreId);
    $('genre-chip').textContent = `${g.name}の占い`;
    $('health-notice').hidden = genreId !== 'health';
    $('screen-genre').hidden = true;
    $('screen-spread').hidden = false;
    document.body.classList.add('in-spread');
    document.body.classList.remove('is-done');
    $('reading').innerHTML = '';
    $('summary').hidden = true;
    $('summary-body').innerHTML = '';
    $('summary-strip').innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
    renderSpread();
    renderProgress();
    setStatus('カードを切っています…', true);
    await dealSequence();
    state.busy = false;
    markNext();
    updateStatus();
    $('btn-flip').focus({ preventScroll: true });
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
    $('btn-flip').hidden = !!busy;
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
    if (pos <= state.next) { openSheet(state.spread[pos - 1], false); return; }
    flip(pos);
  }

  async function flip(pos) {
    if (state.busy || pos !== state.next + 1) return;
    const c = state.spread[pos - 1];
    const btn = document.querySelector(`.card[data-pos="${pos}"]`);
    state.busy = true;
    btn.classList.add('is-flipped');
    btn.classList.remove('is-next');
    btn.disabled = true;
    setStatus(`${pos} 枚目「${POSITIONS[pos - 1].name}」をめくっています…`, true);
    await wait(FLIP_MS);
    btn.classList.add('is-glow');
    setTimeout(() => btn.classList.remove('is-glow'), 1200);
    state.next = pos;
    appendEntry(c);
    markNext();
    updateStatus();
    state.busy = false;
    if (state.next >= 10) buildSummary();
    openSheet(c, true);
  }

  function appendEntry(c) {
    const p = POSITIONS[c.pos - 1];
    const li = document.createElement('li');
    li.className = 'entry';
    li.id = `entry-${c.pos}`;
    li.innerHTML = `
      <div class="entry-head">
        <div class="pos">${c.pos}　${p.name}</div>
        <p class="pos-desc">${p.desc}</p>
      </div>
      <div class="entry-body">
        ${thumbHtml(c, 100 + c.pos)}
        <div class="entry-main">
          ${cardLineHtml(c)}
          <ul class="keywords" aria-label="キーワード">${keywordsOf(c).map((k) => `<li>${k}</li>`).join('')}</ul>
          <p class="text">${genreText(c)}</p>
        </div>
      </div>`;
    $('reading').appendChild(li);
  }

  // --- 拡大シート ---
  function openSheet(c, fromFlip) {
    const p = POSITIONS[c.pos - 1];
    const dlg = $('card-sheet');
    const isLast = state.next >= 10;
    const nextLabel = isLast ? '総合リーディングを見る' : (c.pos === state.next ? '次のカードをめくる' : 'スプレッドに戻る');
    $('sheet-body').innerHTML = `
      <div class="sheet-pos">
        <span class="pos">${c.pos}　${p.name}</span>
        <p class="pos-desc">${p.desc}</p>
      </div>
      <div class="sheet-card">
        <div class="sheet-art${c.rev ? ' is-reversed' : ''}">${Art.face(c.card, 200 + c.pos)}</div>
        <div class="sheet-main">
          ${cardLineHtml(c, 'h2')}
          <ul class="keywords" aria-label="キーワード">${keywordsOf(c).map((k) => `<li>${k}</li>`).join('')}</ul>
        </div>
      </div>
      <p class="sheet-text">${genreText(c)}</p>
      <p class="sheet-basic"><span>基本の意味</span>${c.rev ? c.card.meaning.rev : c.card.meaning.up}</p>`;
    const nextBtn = $('sheet-next');
    nextBtn.textContent = nextLabel;
    nextBtn.onclick = () => {
      dlg.close();
      if (isLast) {
        goToSummary();
      } else if (c.pos === state.next) {
        flip(state.next + 1);
      }
    };
    $('sheet-close').onclick = () => dlg.close();
    dlg.classList.toggle('from-flip', !!fromFlip);
    if (!dlg.open) dlg.showModal();
    $('sheet-scroll').scrollTop = 0;
    nextBtn.focus({ preventScroll: true });
  }

  function goToSummary() {
    document.body.classList.add('is-done');
    const s = $('summary');
    s.setAttribute('tabindex', '-1');
    s.scrollIntoView({ block: 'start', behavior: REDUCED.matches ? 'auto' : 'smooth' });
    s.focus({ preventScroll: true });
  }

  function buildSummary() {
    const r = Reading.build(state.spread, state.genre);
    const c = r.final.card;
    $('summary-strip').innerHTML = state.spread.map((x) => `
      <button type="button" class="strip-item" data-pos="${x.pos}" aria-label="${x.pos} 枚目 ${POSITIONS[x.pos - 1].name}：${x.card.nameJa}、${orientLabel(x)}">
        ${thumbHtml(x, 300 + x.pos)}<span class="strip-pos">${x.pos}</span>
      </button>`).join('');
    $('summary-strip').querySelectorAll('.strip-item').forEach((b) => {
      b.addEventListener('click', () => openSheet(state.spread[Number(b.dataset.pos) - 1], false));
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
    if (dlg.open) dlg.close();
    $('screen-spread').hidden = true;
    $('screen-genre').hidden = false;
    document.body.classList.remove('in-spread', 'is-done');
    state.genre = null;
    window.scrollTo({ top: 0, behavior: 'auto' });
    const first = document.querySelector('.genre-btn');
    if (first) first.focus({ preventScroll: true });
  }

  // --- 初期化 ---
  renderGenres();
  $('btn-again').addEventListener('click', () => { if (!state.busy) start(state.genre); });
  $('btn-again-2').addEventListener('click', () => { if (!state.busy) start(state.genre); });
  $('btn-change').addEventListener('click', backToGenres);
  $('btn-change-2').addEventListener('click', backToGenres);
  // シートの外側（背景）をタップで閉じる
  $('card-sheet').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
})();
