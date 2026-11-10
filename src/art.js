// カード絵柄の SVG 生成。ライダー版の絵柄は使わず、数札の組み方・紋章・象徴的な場面で構成する。
const Art = (() => {
  const W = 120, H = 200;
  const { f, hash, makeBrush, star4D } = ArtKit;
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const RANK_LABEL = { 1: 'A', 11: 'P', 12: 'N', 13: 'Q', 14: 'K' };
  const SUIT_NAME = { wands: 'WANDS', cups: 'CUPS', swords: 'SWORDS', pentacles: 'PENTACLES' };
  // 大アルカナの 2 色目は、その札の元素に対応するスートの色
  const ELEMENT_SUIT = { fire: 'wands', water: 'cups', air: 'swords', earth: 'pentacles' };
  // 札の名前がこの字数を超えたら、枠に収まるよう字を小さくする
  const TITLE_FIT = 8;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function frame(uid) {
    return `<defs>
      <filter id="paper-${uid}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${uid}" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35 0 0 0 0 0.27 0 0 0 0 0.16 0 0 0 0.10 0"/>
        <feComposite in2="SourceGraphic" operator="over"/>
      </filter>
    </defs>
    <rect class="paper" x="0" y="0" width="${W}" height="${H}" rx="7"/>
    <rect class="grain" x="0" y="0" width="${W}" height="${H}" rx="7" filter="url(#paper-${uid})"/>
    <rect class="rule" x="5" y="5" width="${W - 10}" height="${H - 10}" rx="4"/>
    <path class="rule thin" d="M13.5,9 H106.5 A4.5,4.5 0 0 0 111,13.5 V186.5 A4.5,4.5 0 0 0 106.5,191 H13.5 A4.5,4.5 0 0 0 9,186.5 V13.5 A4.5,4.5 0 0 0 13.5,9 Z"/>
    <path class="c1" d="${[[10.6, 10.6], [109.4, 10.6], [10.6, 189.4], [109.4, 189.4]].map(([x, y]) => `M${x - 1.1},${y} a1.1,1.1 0 1 0 2.2,0 a1.1,1.1 0 1 0 -2.2,0`).join(' ')}"/>`;
  }

  function face(card, uid) {
    const isMajor = card.arcana === 'major';
    const brush = makeBrush(hash(card.id), uid);
    let body, head, titleEn, inks;
    if (isMajor) {
      const numeral = ROMAN[card.rank], half = numeral.length * 3.4 + 6;
      body = ArtMajor.scene(card.rank, brush);
      head = `<text class="numeral" x="60" y="25.5" text-anchor="middle">${numeral}</text>
        <path class="title-rule" d="M24,21.6 H${f(60 - half)} M${f(60 + half)},21.6 H96"/>`;
      titleEn = card.nameEn.toUpperCase();
      inks = `--suit:var(--suit-major);--suit2:var(--suit-${ELEMENT_SUIT[Reading.elementOf(card)]})`;
    } else {
      body = card.rank <= 10 ? ArtMinor.pips(card.suit, card.rank, brush) : ArtMinor.court(card.suit, card.rank, brush);
      head = `<text class="corner" x="16" y="25">${esc(RANK_LABEL[card.rank] || String(card.rank))}</text>`;
      titleEn = SUIT_NAME[card.suit];
      inks = `--suit:var(--suit-${card.suit})`;
    }
    return `<svg class="card-art ${isMajor ? 'is-major' : 'is-minor'}" style="${inks}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${frame(uid)}
      ${head}
      ${body}
      <path class="title-rule" d="M26,${H - 38} H${W - 26}"/>
      <text class="title" x="60" y="${H - 25.5}" text-anchor="middle"${card.nameJa.length > TITLE_FIT ? ` style="font-size:${f((10.5 * TITLE_FIT) / card.nameJa.length)}px"` : ''}>${esc(card.nameJa)}</text>
      <text class="title-en" x="60" y="${H - 15}" text-anchor="middle">${esc(titleEn)}</text>
    </svg>`;
  }

  // 組紐。point(s) は中心線上の位置と法線 [x, y, nx, ny] を返す。
  // 上下を入れ替えても同じ柄になるよう、waves（交差の数）は 4 の倍数にする
  function braid(point, len, waves, amp) {
    const STEP = 0.3, total = waves * Math.PI;
    const strand = (sign, a0, a1) => {
      const pts = [];
      for (let ph = a0; ph <= a1 + 1e-6; ph += STEP) {
        const [x, y, nx, ny] = point(((ph / total) * len + len) % len);
        const o = sign * amp * Math.sin(ph);
        pts.push(`${f(x + nx * o)},${f(y + ny * o)}`);
      }
      return `M${pts.join(' L')}`;
    };
    const over = Array.from({ length: waves }, (_, n) => strand(n % 2 ? -1 : 1, n * Math.PI - 0.62, n * Math.PI + 0.62)).join(' ');
    return `<path class="back-line" d="${strand(1, 0, total)} ${strand(-1, 0, total)}"/><path class="back-gap" d="${over}"/><path class="back-line butt" d="${over}"/>`;
  }
  // 角丸の四角形の中心線
  function roundRect(x0, y0, x1, y1, r) {
    const w = x1 - x0 - 2 * r, h = y1 - y0 - 2 * r, q = (Math.PI * r) / 2;
    const corner = (cx, cy, a0) => (s) => { const a = a0 + s / r; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]; };
    const segs = [
      [w, (s) => [x0 + r + s, y0, 0, -1]], [q, corner(x1 - r, y0 + r, -Math.PI / 2)],
      [h, (s) => [x1, y0 + r + s, 1, 0]], [q, corner(x1 - r, y1 - r, 0)],
      [w, (s) => [x1 - r - s, y1, 0, 1]], [q, corner(x0 + r, y1 - r, Math.PI / 2)],
      [h, (s) => [x0, y1 - r - s, -1, 0]], [q, corner(x0 + r, y0 + r, Math.PI)],
    ];
    const len = segs.reduce((t, [l]) => t + l, 0);
    return { len, point: (s) => { let u = s; for (const [l, fn] of segs) { if (u <= l) return fn(u); u -= l; } return segs[0][1](0); } };
  }
  const star8D = (x, y, s) => `M${x},${y - s} L${x + s * 0.2},${y - s * 0.2} L${x + s},${y} L${x + s * 0.2},${y + s * 0.2} L${x},${y + s} L${x - s * 0.2},${y + s * 0.2} L${x - s},${y} L${x - s * 0.2},${y - s * 0.2} Z M${x + s * 0.6},${y - s * 0.6} L${x + s * 0.25},${y} L${x + s * 0.6},${y + s * 0.6} L${x},${y + s * 0.25} L${x - s * 0.6},${y + s * 0.6} L${x - s * 0.25},${y} L${x - s * 0.6},${y - s * 0.6} L${x},${y - s * 0.25} Z`;

  function buildBack() {
    let weave = '';
    for (let k = -200; k <= 320; k += 9) weave += `M${k},0 L${k + 200},200 M${k + 200},0 L${k},200 `;
    const border = roundRect(16, 16, W - 16, H - 16, 7);
    const ring = { len: 2 * Math.PI * 29, point: (s) => { const a = s / 29; return [60 + Math.cos(a) * 29, 100 + Math.sin(a) * 29, Math.cos(a), Math.sin(a)]; } };
    return `<svg class="card-art back" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs><clipPath id="back-clip"><rect x="7" y="7" width="${W - 14}" height="${H - 14}" rx="3"/></clipPath></defs>
      <rect class="stock" x="0" y="0" width="${W}" height="${H}" rx="7"/>
      <rect class="field" x="7" y="7" width="${W - 14}" height="${H - 14}" rx="3"/>
      <path class="weave" clip-path="url(#back-clip)" d="${weave}"/>
      <rect class="back-line thin" x="10" y="10" width="${W - 20}" height="${H - 20}" rx="2"/>
      <rect class="back-band" x="12.6" y="12.6" width="${W - 25.2}" height="${H - 25.2}" rx="9"/>
      ${braid(border.point, border.len, 76, 2.5)}
      <rect class="back-line thin" x="21.6" y="21.6" width="${W - 43.2}" height="${H - 43.2}" rx="3"/>
      <circle class="medal" cx="60" cy="100" r="34"/>
      ${braid(ring.point, ring.len, 24, 2.6)}
      <circle class="back-line thin" cx="60" cy="100" r="24"/>
      <path class="back-line" d="${star8D(60, 100, 18)}"/><circle class="back-line" cx="60" cy="100" r="3"/>
      <path class="back-line" d="${star4D(60, 44, 5)} ${star4D(60, 156, 5)}"/>
    </svg>`;
  }
  let backSvg = '';
  function back() {
    if (!backSvg) backSvg = buildBack();
    return backSvg;
  }

  return { face, back };
})();
