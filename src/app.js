// 画面制御。ジャンル選択 → シャッフル → 10 枚配置 → 1 枚ずつめくる → 総合リーディング
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
  const $ = (id) => document.getElementById(id);

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

  // --- ジャンル選択 ---
  function renderGenres() {
    const ul = $('genre-list');
    ul.innerHTML = '';
    for (const g of GENRES) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'genre-btn';
      b.dataset.genre = g.id;
      b.innerHTML = `<span class="name">${g.name}</span><span class="en">${g.en}</span><span class="desc">${g.desc}</span>`;
      b.addEventListener('click', () => start(g.id));
      li.appendChild(b);
      ul.appendChild(li);
    }
    const ol = $('positions-list');
    ol.innerHTML = POSITIONS.map((p) => `<li><b>${p.name}</b>：${p.desc}</li>`).join('');
  }

  // --- スプレッド ---
  function start(genreId) {
    state.genre = genreId;
    state.spread = draw();
    state.next = 0;
    state.busy = false;
    const g = GENRES.find((x) => x.id === genreId);
    $('genre-chip').textContent = `${g.name}の占い`;
    $('health-notice').hidden = genreId !== 'health';
    $('screen-genre').hidden = true;
    $('screen-spread').hidden = false;
    $('reading').innerHTML = '';
    $('summary').hidden = true;
    $('summary-body').innerHTML = '';
    renderSpread();
    updateStatus();
    window.scrollTo({ top: 0, behavior: REDUCED.matches ? 'auto' : 'smooth' });
    $('btn-flip').focus({ preventScroll: true });
  }

  function renderSpread() {
    const root = $('spread');
    root.innerHTML = '';
    state.spread.forEach((c, i) => {
      const p = POSITIONS[i];
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.pos = String(c.pos);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card';
      btn.dataset.pos = String(c.pos);
      btn.setAttribute('aria-label', `${c.pos} 枚目：${p.name}。まだめくっていません`);
      btn.innerHTML = `<div class="card-inner">
        <div class="card-face back">${Art.back()}</div>
        <div class="card-face front${c.rev ? ' is-reversed' : ''}">${Art.face(c.card, c.pos)}</div>
      </div>`;
      btn.addEventListener('click', () => flip(c.pos));
      slot.appendChild(btn);
      const label = document.createElement('span');
      label.className = 'pos-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = String(c.pos);
      slot.appendChild(label);
      root.appendChild(slot);
      if (!REDUCED.matches) {
        btn.classList.add('is-dealing');
        btn.style.animationDelay = `${i * 70}ms`;
        btn.querySelector('.card-inner').style.animationDelay = `${i * 70}ms`;
        btn.addEventListener('animationend', () => btn.classList.remove('is-dealing'), { once: true });
      }
    });
    markNext();
  }

  function markNext() {
    document.querySelectorAll('.card').forEach((b) => {
      const pos = Number(b.dataset.pos);
      const isNext = pos === state.next + 1;
      b.classList.toggle('is-next', isNext);
      b.disabled = !isNext && pos > state.next;
      if (pos > state.next) {
        const p = POSITIONS[pos - 1];
        b.setAttribute('aria-label', isNext ? `${pos} 枚目：${p.name}。めくる` : `${pos} 枚目：${p.name}。順番にめくってください`);
      }
    });
  }

  function updateStatus() {
    const btn = $('btn-flip');
    if (state.next >= 10) {
      $('status-text').textContent = '10 枚すべてをめくりました。';
      btn.hidden = true;
      $('status-hint').hidden = true;
      return;
    }
    const p = POSITIONS[state.next];
    $('status-text').textContent = `${state.next + 1} 枚目「${p.name}」をめくってください。`;
    btn.hidden = false;
    btn.textContent = state.next === 0 ? '1 枚目をめくる' : '次のカードをめくる';
  }

  function flip(pos) {
    if (state.busy || pos !== state.next + 1) return;
    const c = state.spread[pos - 1];
    const btn = document.querySelector(`.card[data-pos="${pos}"]`);
    state.busy = true;
    btn.classList.add('is-flipped');
    btn.classList.remove('is-next');
    btn.disabled = true;
    const p = POSITIONS[pos - 1];
    btn.setAttribute('aria-label', `${pos} 枚目：${p.name}。${c.card.nameJa}、${c.rev ? '逆位置' : '正位置'}`);
    const after = () => {
      state.next = pos;
      appendEntry(c);
      markNext();
      updateStatus();
      state.busy = false;
      if (state.next >= 10) showSummary();
      else $('btn-flip').focus({ preventScroll: true });
    };
    if (REDUCED.matches) after();
    else setTimeout(after, 520);
  }

  function appendEntry(c) {
    const p = POSITIONS[c.pos - 1];
    const text = c.rev ? c.card.genres[state.genre].rev : c.card.genres[state.genre].up;
    const kws = c.rev ? c.card.keywords.rev : c.card.keywords.up;
    const li = document.createElement('li');
    li.className = 'entry';
    li.id = `entry-${c.pos}`;
    li.innerHTML = `
      <div class="pos">${c.pos}　${p.name}</div>
      <p class="pos-desc">${p.desc}</p>
      <div class="card-line">
        <h3>${c.card.nameJa}</h3>
        <span class="en">${c.card.nameEn.toUpperCase()}</span>
        <span class="badge ${c.rev ? 'rev' : 'up'}">${c.rev ? '逆位置' : '正位置'}</span>
      </div>
      <ul class="keywords" aria-label="キーワード">${kws.map((k) => `<li>${k}</li>`).join('')}</ul>
      <p class="text">${text}</p>`;
    $('reading').appendChild(li);
    li.scrollIntoView({ block: 'nearest', behavior: REDUCED.matches ? 'auto' : 'smooth' });
  }

  function showSummary() {
    const r = Reading.build(state.spread, state.genre);
    const c = r.final.card;
    const paras = [...r.counts, ...r.pairs].map((t) => `<p>${t}</p>`).join('');
    $('summary-body').innerHTML = `
      ${paras}
      <div class="final">
        <div class="pos">10　最終結果</div>
        <div class="card-line">
          <h3>${c.card.nameJa}</h3>
          <span class="en">${c.card.nameEn.toUpperCase()}</span>
          <span class="badge ${c.rev ? 'rev' : 'up'}">${c.rev ? '逆位置' : '正位置'}</span>
        </div>
        <p class="text">${r.final.text}</p>
      </div>`;
    const s = $('summary');
    s.hidden = false;
    s.setAttribute('tabindex', '-1');
    s.focus({ preventScroll: true });
    s.scrollIntoView({ block: 'start', behavior: REDUCED.matches ? 'auto' : 'smooth' });
  }

  function backToGenres() {
    $('screen-spread').hidden = true;
    $('screen-genre').hidden = false;
    state.genre = null;
    window.scrollTo({ top: 0, behavior: 'auto' });
    const first = document.querySelector('.genre-btn');
    if (first) first.focus({ preventScroll: true });
  }

  // --- 初期化 ---
  renderGenres();
  $('btn-flip').addEventListener('click', () => flip(state.next + 1));
  $('btn-again').addEventListener('click', () => start(state.genre));
  $('btn-again-2').addEventListener('click', () => start(state.genre));
  $('btn-change').addEventListener('click', backToGenres);
  $('btn-change-2').addEventListener('click', backToGenres);
})();
