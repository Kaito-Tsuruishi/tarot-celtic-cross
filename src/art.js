// カード絵柄の SVG 生成。ライダー版の絵柄は使わず、数字・スート記号・抽象モチーフで構成する。
const Art = (() => {
  const W = 120, H = 200;
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const RANK_LABEL = { 1: 'A', 11: 'P', 12: 'N', 13: 'Q', 14: 'K' };
  const SUIT_NAME = { wands: 'WANDS', cups: 'CUPS', swords: 'SWORDS', pentacles: 'PENTACLES' };

  // スート記号。原点中心、おおよそ 24px 四方に収まる。
  const SUIT_GLYPH = {
    wands: '<line x1="0" y1="-10" x2="0" y2="11"/><path d="M0,-13 L3.2,-8 L0,-4.5 L-3.2,-8 Z"/><line x1="-3" y1="11" x2="3" y2="11"/>',
    cups: '<path d="M-8,-7 Q-8,5 0,5 Q8,5 8,-7 Z"/><line x1="0" y1="5" x2="0" y2="10"/><line x1="-5" y1="11" x2="5" y2="11"/>',
    swords: '<path d="M0,-12 L2.6,-5 L2.6,5 L-2.6,5 L-2.6,-5 Z"/><line x1="-7" y1="5.5" x2="7" y2="5.5"/><line x1="0" y1="5.5" x2="0" y2="11"/><circle cx="0" cy="12.5" r="1.4"/>',
    pentacles: '<circle cx="0" cy="0" r="10"/><path d="M0,-7.5 L4.4,6.1 L-7.1,-2.3 L7.1,-2.3 L-4.4,6.1 Z"/>',
  };

  // 小アルカナ（数札）の配置。[x, y, scale]
  const PIPS = {
    1: [[0, 0, 2.2]],
    2: [[0, -26, 1.3], [0, 26, 1.3]],
    3: [[0, -30, 1.2], [-20, 16, 1.2], [20, 16, 1.2]],
    4: [[-20, -30, 1.15], [20, -30, 1.15], [-20, 30, 1.15], [20, 30, 1.15]],
    5: [[-20, -32, 1.1], [20, -32, 1.1], [0, 0, 1.1], [-20, 32, 1.1], [20, 32, 1.1]],
    6: [[-20, -38, 1.05], [20, -38, 1.05], [-20, 0, 1.05], [20, 0, 1.05], [-20, 38, 1.05], [20, 38, 1.05]],
    7: [[-20, -40, 1], [20, -40, 1], [-20, 0, 1], [20, 0, 1], [0, 22, 1], [-20, 42, 1], [20, 42, 1]],
    8: [[-20, -45, 0.95], [20, -45, 0.95], [-20, -15, 0.95], [20, -15, 0.95], [-20, 15, 0.95], [20, 15, 0.95], [-20, 45, 0.95], [20, 45, 0.95]],
    9: [[-22, -40, 0.9], [0, -40, 0.9], [22, -40, 0.9], [-22, 0, 0.9], [0, 0, 0.9], [22, 0, 0.9], [-22, 40, 0.9], [0, 40, 0.9], [22, 40, 0.9]],
    10: [[-20, -50, 0.85], [20, -50, 0.85], [-20, -25, 0.85], [20, -25, 0.85], [-20, 0, 0.85], [20, 0, 0.85], [-20, 25, 0.85], [20, 25, 0.85], [-20, 50, 0.85], [20, 50, 0.85]],
  };

  // コートカードの冠（スート記号の上に置く）
  const COURT_CROWN = {
    11: '<circle cx="0" cy="-34" r="3.5"/>',
    12: '<path d="M-9,-30 L0,-39 L9,-30"/>',
    13: '<path d="M-9,-31 A10,10 0 0 0 9,-31 A12,12 0 0 1 -9,-31 Z"/>',
    14: '<path d="M-10,-29 L-10,-39 L-5,-33 L0,-41 L5,-33 L10,-39 L10,-29 Z"/>',
  };

  // 大アルカナの抽象モチーフ（原点中心、半径 30 程度）
  const MAJOR_MOTIF = [
    '<path d="M26,-8 A26,26 0 1 1 10,-24"/><circle cx="20" cy="-26" r="3.5" class="f"/>',                       // 0 愚者: 開いた円と一歩
    '<path d="M-26,0 C-26,-14 -8,-14 0,0 C8,14 26,14 26,0 C26,-14 8,-14 0,0 C-8,14 -26,14 -26,0 Z"/>',           // 1 魔術師: 無限記号
    '<rect x="-26" y="-28" width="9" height="56"/><rect x="17" y="-28" width="9" height="56"/><path d="M8,-10 A11,11 0 1 0 8,10 A8,8 0 1 1 8,-10 Z" class="f"/>', // 2 女教皇: 二本の柱と三日月
    '<circle cx="0" cy="0" r="27"/><path d="M-18,-10 L18,-10 L0,20 Z"/><circle cx="0" cy="-1" r="3" class="f"/>', // 3 女帝: 円と下向き三角
    '<rect x="-25" y="-25" width="50" height="50"/><rect x="-16" y="-16" width="32" height="32"/><path d="M-10,8 L0,-9 L10,8 Z" class="f"/>', // 4 皇帝: 二重の四角と三角
    '<line x1="0" y1="-30" x2="0" y2="30"/><line x1="-12" y1="-18" x2="12" y2="-18"/><line x1="-17" y1="-6" x2="17" y2="-6"/><line x1="-22" y1="6" x2="22" y2="6"/>', // 5 教皇: 三重の横木
    '<circle cx="-11" cy="0" r="20"/><circle cx="11" cy="0" r="20"/><circle cx="0" cy="0" r="2.5" class="f"/>',  // 6 恋人: 重なる二つの円
    '<path d="M-24,10 L0,-24 L24,10"/><circle cx="-16" cy="20" r="7"/><circle cx="16" cy="20" r="7"/>',          // 7 戦車: 山形と二つの輪
    '<path d="M-20,-24 A30,30 0 0 0 -20,24"/><path d="M20,-24 A30,30 0 0 1 20,24"/><circle cx="0" cy="0" r="8"/>', // 8 力: 円を包む二つの弧
    '<path d="M0,-24 L14,-16 L14,0 L0,8 L-14,0 L-14,-16 Z"/><circle cx="0" cy="-8" r="3.5" class="f"/><line x1="0" y1="8" x2="0" y2="30"/>', // 9 隠者: 灯りと杖
    '<circle cx="0" cy="0" r="27"/><circle cx="0" cy="0" r="6"/><g><line x1="0" y1="-27" x2="0" y2="27"/><line x1="-27" y1="0" x2="27" y2="0"/><line x1="-19" y1="-19" x2="19" y2="19"/><line x1="19" y1="-19" x2="-19" y2="19"/></g>', // 10 運命の輪
    '<line x1="0" y1="-28" x2="0" y2="28"/><line x1="-26" y1="-16" x2="26" y2="-16"/><path d="M-26,-16 L-26,2 M-33,2 L-19,2 A7,7 0 0 0 -33,2 Z"/><path d="M26,-16 L26,2 M19,2 L33,2 A7,7 0 0 0 19,2 Z"/><line x1="-10" y1="28" x2="10" y2="28"/>', // 11 正義: 天秤
    '<line x1="-26" y1="-28" x2="26" y2="-28"/><line x1="0" y1="-28" x2="0" y2="4"/><circle cx="0" cy="14" r="10"/><path d="M-8,30 L0,22 L8,30"/>', // 12 吊るされた男: 逆さの振り子
    '<line x1="-30" y1="6" x2="30" y2="6"/><path d="M-20,6 A20,20 0 0 1 20,6"/><path d="M-30,20 Q-15,14 0,20 T30,20"/>', // 13 死神: 地平線に沈む/昇る円
    '<path d="M-18,-28 L18,-28 L0,-2 Z"/><path d="M-18,28 L18,28 L0,2 Z"/><line x1="0" y1="-2" x2="0" y2="2"/>', // 14 節制: 砂時計
    '<circle cx="0" cy="0" r="27"/><path d="M0,22 L-6.7,-1.5 L12.6,13 L-12.6,13 L6.7,-1.5 Z"/>',                 // 15 悪魔: 逆さの五芒星
    '<rect x="-14" y="-30" width="28" height="60"/><path d="M-14,-30 L-6,-30 L-10,-22 L-2,-22 L-8,-12" class="z"/><path d="M8,-36 L2,-26 L8,-24 L0,-14" class="z"/>', // 16 塔: 塔と亀裂
    '<path d="M0,-30 L5,-5 L30,0 L5,5 L0,30 L-5,5 L-30,0 L-5,-5 Z"/><circle cx="-22" cy="-20" r="2" class="f"/><circle cx="22" cy="-18" r="1.6" class="f"/><circle cx="18" cy="24" r="1.6" class="f"/>', // 17 星
    '<path d="M6,-26 A26,26 0 1 0 6,26 A20,20 0 1 1 6,-26 Z"/><path d="M-30,30 Q-20,24 -10,30 T10,30 T30,30"/>', // 18 月: 三日月と波
    '<circle cx="0" cy="0" r="14"/><g class="rays"><line x1="0" y1="-20" x2="0" y2="-30"/><line x1="0" y1="20" x2="0" y2="30"/><line x1="-20" y1="0" x2="-30" y2="0"/><line x1="20" y1="0" x2="30" y2="0"/><line x1="14" y1="-14" x2="21" y2="-21"/><line x1="-14" y1="14" x2="-21" y2="21"/><line x1="14" y1="14" x2="21" y2="21"/><line x1="-14" y1="-14" x2="-21" y2="-21"/></g>', // 19 太陽
    '<line x1="-30" y1="24" x2="30" y2="24"/><path d="M-18,24 L-18,-6 M-24,0 L-18,-8 L-12,0"/><path d="M0,24 L0,-20 M-7,-12 L0,-22 L7,-12"/><path d="M18,24 L18,-6 M12,0 L18,-8 L24,0"/>', // 20 審判: 立ち上がる三本
    '<ellipse cx="0" cy="0" rx="20" ry="30"/><ellipse cx="0" cy="0" rx="14" ry="23"/><circle cx="-26" cy="-26" r="2" class="f"/><circle cx="26" cy="-26" r="2" class="f"/><circle cx="-26" cy="26" r="2" class="f"/><circle cx="26" cy="26" r="2" class="f"/>', // 21 世界: 輪と四隅
  ];

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
    <rect class="rule thin" x="9" y="9" width="${W - 18}" height="${H - 18}" rx="2"/>`;
  }

  function face(card, uid) {
    let corner, suitMark = '', body, titleEn;
    if (card.arcana === 'major') {
      corner = ROMAN[card.rank];
      body = `<g class="ink motif" transform="translate(${W / 2} ${H / 2 - 8})">${MAJOR_MOTIF[card.rank]}</g>`;
      titleEn = card.nameEn.toUpperCase();
    } else {
      corner = RANK_LABEL[card.rank] || String(card.rank);
      const g = SUIT_GLYPH[card.suit];
      suitMark = `<g class="ink" transform="translate(${W - 18} 19) scale(0.55)">${g}</g>`;
      if (card.rank <= 10) {
        body = PIPS[card.rank].map(([x, y, s]) =>
          `<g class="ink" transform="translate(${W / 2 + x} ${H / 2 - 8 + y}) scale(${s})">${g}</g>`).join('');
      } else {
        body = `<g class="ink" transform="translate(${W / 2} ${H / 2 - 2})">
          <circle cx="0" cy="0" r="30" class="halo"/>
          ${COURT_CROWN[card.rank]}
          <g transform="translate(0 4) scale(1.9)">${g}</g>
        </g>`;
      }
      titleEn = SUIT_NAME[card.suit];
    }
    return `<svg class="card-art" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${frame(uid)}
      <text class="corner" x="16" y="24">${esc(corner)}</text>
      ${suitMark}
      ${body}
      <text class="title" x="${W / 2}" y="${H - 28}" text-anchor="middle">${esc(card.nameJa)}</text>
      <text class="title-en" x="${W / 2}" y="${H - 16}" text-anchor="middle">${esc(titleEn)}</text>
    </svg>`;
  }

  function back() {
    const cells = [];
    for (let y = 14; y < H - 10; y += 14) {
      for (let x = 8 + ((y / 14) % 2) * 7; x < W - 8; x += 14) {
        cells.push(`<path d="M${x},${y - 5} L${x + 5},${y} L${x},${y + 5} L${x - 5},${y} Z"/>`);
      }
    }
    return `<svg class="card-art back" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect class="night" x="0" y="0" width="${W}" height="${H}" rx="7"/>
      <rect class="brass" x="5" y="5" width="${W - 10}" height="${H - 10}" rx="4"/>
      <g class="lattice">${cells.join('')}</g>
      <circle class="medal" cx="${W / 2}" cy="${H / 2}" r="30"/>
      <circle class="brass" cx="${W / 2}" cy="${H / 2}" r="25"/>
      <g class="brass" transform="translate(${W / 2} ${H / 2})">
        <path d="M0,-18 L4,-4 L18,0 L4,4 L0,18 L-4,4 L-18,0 L-4,-4 Z"/>
        <circle cx="0" cy="0" r="3"/>
      </g>
    </svg>`;
  }

  return { face, back };
})();
