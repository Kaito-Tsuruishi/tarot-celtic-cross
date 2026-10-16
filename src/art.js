// カード絵柄の SVG 生成。ライダー版の絵柄は使わず、数字・スート記号・抽象モチーフで構成する。
const Art = (() => {
  const W = 120, H = 200;
  const CX = W / 2, CY = H / 2 - 8;
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const RANK_LABEL = { 1: 'A', 11: 'P', 12: 'N', 13: 'Q', 14: 'K' };
  const SUIT_NAME = { wands: 'WANDS', cups: 'CUPS', swords: 'SWORDS', pentacles: 'PENTACLES' };
  // スートの差し色（羊皮紙の上のインク）
  const SUIT_COLOR = { wands: '#9b3f2a', cups: '#2f5d6b', swords: '#4b5363', pentacles: '#5a6a2a', major: '#8c6a28' };

  // スート記号。原点中心、おおよそ 24px 四方。.ink=主線 .tint=差し色の面
  const SUIT_GLYPH = {
    wands: '<line x1="0" y1="-9" x2="0" y2="11"/><path class="tint" d="M0,-14 L3.6,-8.5 L0,-4 L-3.6,-8.5 Z"/><line x1="-3.5" y1="11" x2="3.5" y2="11"/><line x1="-2" y1="2" x2="2" y2="2" class="fine"/>',
    cups: '<path d="M-8,-8 Q-8,5 0,5 Q8,5 8,-8 Z"/><path class="tint" d="M-6,-4 Q-6,3 0,3 Q6,3 6,-4 Z"/><line x1="0" y1="5" x2="0" y2="10"/><path d="M-5,11 Q0,9 5,11"/>',
    swords: '<path d="M0,-13 L2.6,-5 L2.6,5 L-2.6,5 L-2.6,-5 Z"/><line x1="0" y1="-10" x2="0" y2="4" class="fine"/><path class="tint" d="M-7,5.5 L7,5.5 L5.5,7.5 L-5.5,7.5 Z"/><line x1="0" y1="7.5" x2="0" y2="11.5"/><circle cx="0" cy="13" r="1.6" class="f"/>',
    pentacles: '<circle cx="0" cy="0" r="10.5"/><circle cx="0" cy="0" r="8.3" class="fine"/><path class="tint" d="M0,-7 L4.1,5.7 L-6.7,-2.2 L6.7,-2.2 L-4.1,5.7 Z"/>',
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

  // 数札の背景（スートごとの薄い地模様）
  const PIP_BG = {
    wands: `<g class="bg">${[-30, -10, 10, 30].map((x) => `<line x1="${CX + x}" y1="${CY - 62}" x2="${CX + x}" y2="${CY + 62}"/>`).join('')}</g>`,
    cups: `<g class="bg">${[-45, -25, -5, 15, 35, 55].map((y) => `<path d="M${CX - 40},${CY + y} q10,-5 20,0 t20,0 t20,0"/>`).join('')}</g>`,
    swords: `<g class="bg">${[-40, -20, 0, 20, 40].map((y) => `<path d="M${CX - 38},${CY + y + 8} L${CX},${CY + y - 6} L${CX + 38},${CY + y + 8}"/>`).join('')}</g>`,
    pentacles: `<g class="bg">${[-40, -20, 0, 20, 40].flatMap((y) => [-30, -10, 10, 30].map((x) => `<circle cx="${CX + x}" cy="${CY + y}" r="1.1"/>`)).join('')}</g>`,
  };

  // コートカードの冠（ペイジ → キングで装飾が増える）
  const COURT_CROWN = {
    11: '<circle cx="0" cy="-36" r="3.2"/>',
    12: '<path d="M-10,-31 L0,-41 L10,-31"/><circle cx="0" cy="-45" r="1.6" class="f"/>',
    13: '<path d="M-10,-32 A11,11 0 0 0 10,-32 A13,13 0 0 1 -10,-32 Z"/><circle cx="-7" cy="-41" r="1.3" class="f"/><circle cx="0" cy="-43" r="1.3" class="f"/><circle cx="7" cy="-41" r="1.3" class="f"/>',
    14: '<path d="M-11,-30 L-11,-41 L-5.5,-35 L0,-44 L5.5,-35 L11,-41 L11,-30 Z"/><circle cx="-11" cy="-42" r="1.4" class="f"/><circle cx="0" cy="-45.5" r="1.6" class="f"/><circle cx="11" cy="-42" r="1.4" class="f"/><line x1="-11" y1="-27" x2="11" y2="-27" class="fine"/>',
  };
  const COURT_BAND = {
    11: '',
    12: '<line x1="-26" y1="40" x2="26" y2="40" class="fine"/>',
    13: '<line x1="-30" y1="40" x2="30" y2="40" class="fine"/><circle cx="-30" cy="40" r="1.4" class="f"/><circle cx="30" cy="40" r="1.4" class="f"/>',
    14: '<line x1="-32" y1="38" x2="32" y2="38" class="fine"/><line x1="-32" y1="42" x2="32" y2="42" class="fine"/><circle cx="-34" cy="40" r="1.6" class="f"/><circle cx="34" cy="40" r="1.6" class="f"/>',
  };

  // 大アルカナの背景パターン（薄い金のインク）
  const rings = (n, step = 9, r0 = 10) => Array.from({ length: n }, (_, i) => `<circle cx="0" cy="0" r="${r0 + i * step}"/>`).join('');
  const rays = (n, r1 = 14, r2 = 48, phase = 0) => Array.from({ length: n }, (_, i) => {
    const a = phase + (i * 2 * Math.PI) / n;
    return `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}"/>`;
  }).join('');
  const hlines = (ys) => ys.map((y) => `<line x1="-42" y1="${y}" x2="42" y2="${y}"/>`).join('');
  const vlines = (xs) => xs.map((x) => `<line x1="${x}" y1="-56" x2="${x}" y2="56"/>`).join('');
  const waves = (ys) => ys.map((y) => `<path d="M-42,${y} q10,-5 20,0 t20,0 t20,0 t20,0"/>`).join('');
  const lattice = () => {
    const out = [];
    for (let k = -60; k <= 60; k += 15) {
      out.push(`<line x1="${k - 60}" y1="60" x2="${k + 60}" y2="-60"/>`);
      out.push(`<line x1="${k - 60}" y1="-60" x2="${k + 60}" y2="60"/>`);
    }
    return out.join('');
  };
  const raysArc = (n, a0, a1, r1, r2) => Array.from({ length: n }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / (n - 1);
    return `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}"/>`;
  }).join('');
  const grid = () => `${hlines([-45, -30, -15, 0, 15, 30, 45])}${vlines([-30, -15, 0, 15, 30])}`;
  const arches = () => [-28, 0, 28].map((x) => `<path d="M${x - 12},56 L${x - 12},-20 A12,12 0 0 1 ${x + 12},-20 L${x + 12},56"/>`).join('');
  const dots = (pts, r = 1.6) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" class="f"/>`).join('');
  const star4 = (x, y, s) => `<path d="M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z"/>`;
  const star8 = (x, y, s) => `<path d="M${x},${y - s} L${x + s * 0.2},${y - s * 0.2} L${x + s},${y} L${x + s * 0.2},${y + s * 0.2} L${x},${y + s} L${x - s * 0.2},${y + s * 0.2} L${x - s},${y} L${x - s * 0.2},${y - s * 0.2} Z M${x + s * 0.6},${y - s * 0.6} L${x + s * 0.25},${y} L${x + s * 0.6},${y + s * 0.6} L${x},${y + s * 0.25} L${x - s * 0.6},${y + s * 0.6} L${x - s * 0.25},${y} L${x - s * 0.6},${y - s * 0.6} L${x},${y - s * 0.25} Z"/>`;

  // 大アルカナのモチーフ: bg=地模様（金・細） main=主モチーフ（墨） sub=副モチーフ（金）
  const MAJOR = [
    { // 0 愚者: 開いた円と一歩、足跡
      bg: rays(12, 30, 54), main: '<path d="M26,-8 A26,26 0 1 1 10,-24"/><circle cx="20" cy="-26" r="3.5" class="f"/>',
      sub: dots([[30, -36], [36, -44], [40, -54]], 1.4),
    },
    { // 1 魔術師: 無限記号、机の上の 4 つの道具
      bg: rings(3, 10, 12), main: '<path d="M-26,0 C-26,-14 -8,-14 0,0 C8,14 26,14 26,0 C26,-14 8,-14 0,0 C-8,14 -26,14 -26,0 Z"/>',
      sub: '<line x1="-30" y1="34" x2="30" y2="34"/><line x1="-24" y1="28" x2="-24" y2="18"/><path d="M-10,20 q0,8 4,8 q4,0 4,-8 Z"/><path d="M10,18 L10,30 M7,27 L13,27"/><circle cx="24" cy="24" r="4"/>',
    },
    { // 2 女教皇: 二本の柱と三日月、帳
      bg: hlines([-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50]), main: '<rect x="-27" y="-30" width="9" height="60"/><rect x="18" y="-30" width="9" height="60"/><path d="M8,-10 A11,11 0 1 0 8,10 A8,8 0 1 1 8,-10 Z" class="f"/>',
      sub: '<rect x="-8" y="22" width="16" height="6"/>',
    },
    { // 3 女帝: 円と下向き三角、穂
      bg: waves([-44, -30, -16, -2, 12, 26, 40]), main: '<circle cx="0" cy="0" r="27"/><path d="M-18,-10 L18,-10 L0,20 Z"/><circle cx="0" cy="-1" r="3" class="f"/>',
      sub: '<path d="M-34,44 l0,-18 M-34,30 l-4,-5 M-34,30 l4,-5 M-34,37 l-4,-5 M-34,37 l4,-5"/><path d="M34,44 l0,-18 M34,30 l-4,-5 M34,30 l4,-5 M34,37 l-4,-5 M34,37 l4,-5"/>',
    },
    { // 4 皇帝: 二重の四角と三角、四隅の点
      bg: grid(), main: '<rect x="-25" y="-25" width="50" height="50"/><rect x="-16" y="-16" width="32" height="32"/><path d="M-10,8 L0,-9 L10,8 Z" class="f"/>',
      sub: dots([[-32, -32], [32, -32], [-32, 32], [32, 32]], 2),
    },
    { // 5 教皇: 三重の横木、二つの鍵
      bg: arches(), main: '<line x1="0" y1="-32" x2="0" y2="28"/><line x1="-12" y1="-20" x2="12" y2="-20"/><line x1="-17" y1="-8" x2="17" y2="-8"/><line x1="-22" y1="4" x2="22" y2="4"/>',
      sub: '<circle cx="-14" cy="40" r="3.5"/><line x1="-14" y1="43.5" x2="-14" y2="52"/><line x1="-14" y1="50" x2="-10" y2="50"/><circle cx="14" cy="40" r="3.5"/><line x1="14" y1="43.5" x2="14" y2="52"/><line x1="14" y1="50" x2="18" y2="50"/>',
    },
    { // 6 恋人: 重なる二つの円、上の光
      bg: rays(16, 32, 56), main: '<circle cx="-11" cy="2" r="20"/><circle cx="11" cy="2" r="20"/><circle cx="0" cy="2" r="2.5" class="f"/>',
      sub: '<path d="M-14,-40 A14,14 0 0 1 14,-40"/><circle cx="0" cy="-44" r="2" class="f"/>',
    },
    { // 7 戦車: 山形と二つの輪、星
      bg: lattice(), main: '<path d="M-24,12 L0,-22 L24,12"/><circle cx="-16" cy="22" r="7"/><circle cx="16" cy="22" r="7"/><line x1="-9" y1="22" x2="9" y2="22"/>',
      sub: star4(0, -40, 6),
    },
    { // 8 力: 円を包む二つの弧、上の無限記号
      bg: rings(4, 9, 12), main: '<path d="M-20,-22 A30,30 0 0 0 -20,26"/><path d="M20,-22 A30,30 0 0 1 20,26"/><circle cx="0" cy="2" r="8"/>',
      sub: '<path d="M-9,-42 C-9,-47 -3,-47 0,-42 C3,-37 9,-37 9,-42 C9,-47 3,-47 0,-42 C-3,-37 -9,-37 -9,-42 Z"/>',
    },
    { // 9 隠者: 灯りと杖、灯りの光
      bg: rays(10, 20, 54, Math.PI / 10), main: '<path d="M0,-24 L14,-16 L14,0 L0,8 L-14,0 L-14,-16 Z"/><line x1="0" y1="8" x2="0" y2="34"/>',
      sub: star4(0, -8, 4),
    },
    { // 10 運命の輪: 八本の輻、外の目盛り
      bg: rings(2, 12, 33), main: '<circle cx="0" cy="0" r="27"/><circle cx="0" cy="0" r="6"/><line x1="0" y1="-27" x2="0" y2="27"/><line x1="-27" y1="0" x2="27" y2="0"/><line x1="-19" y1="-19" x2="19" y2="19"/><line x1="19" y1="-19" x2="-19" y2="19"/>',
      sub: '<line x1="0" y1="-42" x2="0" y2="-36"/><line x1="0" y1="36" x2="0" y2="42"/><line x1="-42" y1="0" x2="-36" y2="0"/><line x1="36" y1="0" x2="42" y2="0"/>',
    },
    { // 11 正義: 天秤、台座
      bg: vlines([-36, -24, -12, 0, 12, 24, 36]), main: '<line x1="0" y1="-30" x2="0" y2="26"/><line x1="-26" y1="-18" x2="26" y2="-18"/><path d="M-26,-18 L-26,0 M-33,0 L-19,0 A7,7 0 0 0 -33,0 Z"/><path d="M26,-18 L26,0 M19,0 L33,0 A7,7 0 0 0 19,0 Z"/>',
      sub: '<line x1="-14" y1="30" x2="14" y2="30"/><line x1="-10" y1="34" x2="10" y2="34"/>',
    },
    { // 12 吊るされた男: 逆さの振り子、光輪
      bg: hlines([-50, -36, -22, 36, 50]), main: '<line x1="-26" y1="-30" x2="26" y2="-30"/><line x1="0" y1="-30" x2="0" y2="2"/><circle cx="0" cy="12" r="10"/><path d="M-8,30 L0,22 L8,30"/>',
      sub: '<circle cx="0" cy="12" r="15" class="fine"/>',
    },
    { // 13 死神: 地平線に沈む／昇る円、花
      bg: raysArc(9, -Math.PI + 0.3, -0.3, 26, 56).replace(/y1="(-?[0-9.]+)"/g, (m, v) => `y1="${(+v + 6).toFixed(1)}"`).replace(/y2="(-?[0-9.]+)"/g, (m, v) => `y2="${(+v + 6).toFixed(1)}"`), main: '<line x1="-30" y1="6" x2="30" y2="6"/><path d="M-20,6 A20,20 0 0 1 20,6"/><path d="M-30,20 Q-15,14 0,20 T30,20"/>',
      sub: dots([[0, 36], [-5, 40], [5, 40], [-3, 46], [3, 46]], 1.5),
    },
    { // 14 節制: 砂時計、左右の杯
      bg: waves([-44, -32, -20, 20, 32, 44]), main: '<path d="M-18,-28 L18,-28 L0,-2 Z"/><path d="M-18,28 L18,28 L0,2 Z"/><line x1="0" y1="-2" x2="0" y2="2"/>',
      sub: '<path d="M-36,-6 q0,8 5,8 q5,0 5,-8 Z"/><path d="M26,-6 q0,8 5,8 q5,0 5,-8 Z"/>',
    },
    { // 15 悪魔: 逆さの五芒星、鎖の環
      bg: lattice(), main: '<circle cx="0" cy="0" r="27"/><path d="M0,22 L-6.7,-1.5 L12.6,13 L-12.6,13 L6.7,-1.5 Z"/>',
      sub: '<ellipse cx="-10" cy="42" rx="5" ry="3"/><ellipse cx="0" cy="42" rx="5" ry="3"/><ellipse cx="10" cy="42" rx="5" ry="3"/>',
    },
    { // 16 塔: 塔と亀裂、散る火花
      bg: rays(7, 40, 60, Math.PI / 2 + 0.3), main: '<rect x="-14" y="-30" width="28" height="60"/><line x1="-14" y1="-18" x2="14" y2="-18" class="fine"/><path d="M-14,-30 L-6,-30 L-10,-22 L-2,-22 L-8,-12" class="z"/><path d="M8,-36 L2,-26 L8,-24 L0,-14" class="z"/>',
      sub: dots([[-26, -24], [-30, -10], [26, -20], [30, -4], [-24, 10], [26, 14]], 1.3),
    },
    { // 17 星: 八芒星、小さな星と水面
      bg: rays(8, 34, 58, Math.PI / 8), main: star8(0, -6, 30),
      sub: `${dots([[-30, -40], [30, -36], [-36, 10], [36, 14], [-14, -44], [16, -46], [34, -14]], 1.4)}<path d="M-30,44 q8,-4 16,0 t16,0 t16,0"/>`,
    },
    { // 18 月: 三日月と波、遠い二つの塔
      bg: rings(3, 10, 24), main: '<path d="M6,-26 A26,26 0 1 0 6,26 A20,20 0 1 1 6,-26 Z"/><path d="M-30,36 Q-20,30 -10,36 T10,36 T30,36"/>',
      sub: '<rect x="-38" y="14" width="6" height="14"/><rect x="32" y="14" width="6" height="14"/>',
    },
    { // 19 太陽: 円と光、地上の花
      bg: rings(3, 9, 20), main: '<circle cx="0" cy="-4" r="14"/><g class="rays"><line x1="0" y1="-24" x2="0" y2="-34"/><line x1="0" y1="16" x2="0" y2="26"/><line x1="-20" y1="-4" x2="-30" y2="-4"/><line x1="20" y1="-4" x2="30" y2="-4"/><line x1="14" y1="-18" x2="21" y2="-25"/><line x1="-14" y1="10" x2="-21" y2="17"/><line x1="14" y1="10" x2="21" y2="17"/><line x1="-14" y1="-18" x2="-21" y2="-25"/></g>',
      sub: `<line x1="-36" y1="44" x2="36" y2="44"/>${dots([[-24, 38], [-8, 36], [8, 36], [24, 38]], 1.8)}`,
    },
    { // 20 審判: 立ち上がる三本、上の角笛
      bg: rays(9, 36, 60, Math.PI / 2 + 0.35), main: '<line x1="-30" y1="26" x2="30" y2="26"/><path d="M-18,26 L-18,-4 M-24,2 L-18,-6 L-12,2"/><path d="M0,26 L0,-18 M-7,-10 L0,-20 L7,-10"/><path d="M18,26 L18,-4 M12,2 L18,-6 L24,2"/>',
      sub: '<path d="M-6,-40 L10,-46 L10,-34 Z"/><line x1="-6" y1="-40" x2="-16" y2="-40"/>',
    },
    { // 21 世界: 二重の輪と四隅、中央の星
      bg: rings(2, 14, 36), main: '<ellipse cx="0" cy="0" rx="20" ry="30"/><ellipse cx="0" cy="0" rx="14" ry="23"/>',
      sub: `${dots([[-28, -28], [28, -28], [-28, 28], [28, 28]], 2)}${star4(0, 0, 6)}`,
    },
  ];

  // 四隅の飾り（スートごと）
  const CORNER = {
    wands: '<path d="M0,-4 L2,-1 L0,2 L-2,-1 Z" class="f"/>',
    cups: '<path d="M-3,-1 q3,-3 6,0"/>',
    swords: '<path d="M-3,1 L0,-2 L3,1"/>',
    pentacles: '<circle cx="0" cy="0" r="1.6"/>',
    major: star4(0, 0, 3),
  };

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function frame(uid, kind) {
    const c = CORNER[kind];
    const corners = [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]]
      .map(([x, y]) => `<g class="ink corner-mark" transform="translate(${x} ${y})">${c}</g>`).join('');
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
    <rect class="rule thin" x="9" y="9" width="${W - 18}" height="${H - 18}" rx="2"/>
    ${corners}`;
  }

  function face(card, uid) {
    const isMajor = card.arcana === 'major';
    const kind = isMajor ? 'major' : card.suit;
    const color = SUIT_COLOR[kind];
    let corner, suitMark = '', body, titleEn;
    if (isMajor) {
      corner = ROMAN[card.rank];
      const m = MAJOR[card.rank];
      body = `<g transform="translate(${CX} ${CY})">
        <g class="bg">${m.bg}</g>
        <g class="ink motif">${m.main}</g>
        <g class="sub">${m.sub}</g>
      </g>`;
      titleEn = card.nameEn.toUpperCase();
    } else {
      corner = RANK_LABEL[card.rank] || String(card.rank);
      const g = SUIT_GLYPH[card.suit];
      suitMark = `<g class="ink" transform="translate(${W - 18} 19) scale(0.55)">${g}</g>`;
      if (card.rank <= 10) {
        body = PIP_BG[card.suit] + PIPS[card.rank].map(([x, y, s]) =>
          `<g class="ink" transform="translate(${CX + x} ${CY + y}) scale(${s})">${g}</g>`).join('');
      } else {
        body = `<g transform="translate(${CX} ${CY + 4})">
          <g class="bg">${rings(2, 8, 30)}</g>
          <g class="ink">
            <circle cx="0" cy="0" r="30" class="halo"/>
            ${COURT_CROWN[card.rank]}
            ${COURT_BAND[card.rank]}
            <g transform="translate(0 2) scale(1.9)">${g}</g>
          </g>
        </g>`;
      }
      titleEn = SUIT_NAME[card.suit];
    }
    return `<svg class="card-art ${isMajor ? 'is-major' : 'is-minor'}" style="--suit:${color}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${frame(uid, kind)}
      <text class="corner" x="16" y="25">${esc(corner)}</text>
      ${suitMark}
      ${body}
      <line class="title-rule" x1="30" y1="${H - 38}" x2="${W - 30}" y2="${H - 38}"/>
      <text class="title" x="${CX}" y="${H - 26}" text-anchor="middle">${esc(card.nameJa)}</text>
      <text class="title-en" x="${CX}" y="${H - 15}" text-anchor="middle">${esc(titleEn)}</text>
    </svg>`;
  }

  function back() {
    const weave = [];
    for (let k = -200; k <= 320; k += 12) {
      weave.push(`<line x1="${k}" y1="0" x2="${k + 200}" y2="200"/>`);
      weave.push(`<line x1="${k + 200}" y1="0" x2="${k}" y2="200"/>`);
    }
    const ring = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 16;
      return `<circle cx="${(CX + Math.cos(a) * 36).toFixed(1)}" cy="${(H / 2 + Math.sin(a) * 36).toFixed(1)}" r="1.1"/>`;
    }).join('');
    return `<svg class="card-art back" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs><clipPath id="back-clip"><rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="3"/></clipPath></defs>
      <rect class="night" x="0" y="0" width="${W}" height="${H}" rx="7"/>
      <g class="weave" clip-path="url(#back-clip)">${weave.join('')}</g>
      <rect class="brass" x="5" y="5" width="${W - 10}" height="${H - 10}" rx="4"/>
      <rect class="brass thin" x="9" y="9" width="${W - 18}" height="${H - 18}" rx="3"/>
      <circle class="medal" cx="${CX}" cy="${H / 2}" r="31"/>
      <circle class="brass" cx="${CX}" cy="${H / 2}" r="26"/>
      <g class="brass dots">${ring}</g>
      <g class="brass" transform="translate(${CX} ${H / 2})">
        ${star8(0, 0, 18)}
        <circle cx="0" cy="0" r="3"/>
      </g>
      <g class="brass" transform="translate(${CX} 22)">${star4(0, 0, 4)}</g>
      <g class="brass" transform="translate(${CX} ${H - 22})">${star4(0, 0, 4)}</g>
    </svg>`;
  }

  return { face, back };
})();
