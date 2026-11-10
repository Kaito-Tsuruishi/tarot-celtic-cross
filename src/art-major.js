// 大アルカナの絵柄。1 枚ずつ、象徴になる物を組み合わせた場面として描く。人が主役の札は、顔を描かない簡略な人の形（person / limb）を置く。
// 色は c1=金、c2=その札の元素の色（火=朱 水=青緑 風=鋼 地=緑金）。
const ArtMajor = (() => {
  const { f, el, at, plate, spline, DROP, star4D, starD } = ArtKit;
  const { staff, cup, sword, coin } = ArtMinor.glyph;
  const C1 = (d) => plate(el(d, 'c1'));
  const C2 = (d) => plate(el(d, 'c2'));
  const blk = (d) => el(d, 'blk');
  const dot = (x, y, r) => `M${f(x - r)},${f(y)} a${r},${r} 0 1 0 ${r * 2},0 a${r},${r} 0 1 0 ${-r * 2},0`;
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // ───────── 共通の部品 ─────────
  // 小さな星の並び。下の線を紙色で抜いてから金で刷る
  const stars = (pts, s = 3.2) => `${el(pts.map(([x, y]) => dot(x, y, s * 0.75)).join(' '), 'ko')}${C1(pts.map(([x, y]) => star4D(x, y, s)).join(' '))}`;
  const drop = (b, x, y, rot = 0, sc = 1, fill = 'c1') => at(x, y, `<path class="ko" style="stroke-width:2.4" d="${DROP}"/>${plate(el(DROP, fill))}${el(DROP, 'ink hair')}`, rot, sc);
  // 光を放つ円盤
  const sun = (b, x, y, r, fill = 'c1', n = 16) => `<circle class="ko" cx="${x}" cy="${y}" r="${r + 9}"/>${b.rays(x, y, r + 3, r + 8.5, n, 'ink fine', 0, r + 6)}${b.tinted(b.circleD(x, y, r), fill, 'ink')}`;
  // 王冠。(x, y) は帯の中央、w は幅
  const crown = (b, x, y, w, fill = 'c1') => {
    const h = w / 2, d = b.polyD([[x - h * 0.92, y], [x - h, y - h * 0.84], [x - h * 0.56, y - h * 0.4], [x - h * 0.3, y - h * 1.02], [x, y - h * 0.48], [x + h * 0.3, y - h * 1.02], [x + h * 0.56, y - h * 0.4], [x + h, y - h * 0.84], [x + h * 0.92, y]], true, 0.25);
    const pearls = [[-h, -h * 0.92], [-h * 0.3, -h * 1.1], [h * 0.3, -h * 1.1], [h, -h * 0.92]].map(([dx, dy]) => dot(x + dx, y + dy, Math.max(0.8, w * 0.052))).join(' ');
    return `${b.tinted(d, fill, 'ink', 2.4)}${blk(pearls)}${b.poly(rect(x - h * 0.96, y - 0.4, x + h * 0.96, y + h * 0.3), 'body fine', true)}`;
  };
  // 銃眼のある塔。(x, y) は足元の中央
  const tower = (b, x, y, w, h) => {
    const a = w / 2, t = y - h, m = w * 0.28;
    return `${b.poly([[x - a, y], [x - a, t + 5], [x - a - 1.4, t + 5], [x - a - 1.4, t], [x - m - 1, t], [x - m - 1, t + 2.6], [x - m / 2, t + 2.6], [x - m / 2, t], [x + m / 2, t], [x + m / 2, t + 2.6], [x + m + 1, t + 2.6], [x + m + 1, t], [x + a + 1.4, t], [x + a + 1.4, t + 5], [x + a, t + 5], [x + a, y]], 'body')}
      ${b.line(x, t + 9.5, x, t + 14, 'ink bold')}${b.lines([[x + a - 2.6, t + 7, x + a - 2.6, y - 1], [x + a - 1.4, t + 7, x + a - 1.4, y - 1]])}`;
  };
  // 簡略な人の形。(x, feet) は足元の中央、h は身長。robe=衣の色 hem=裾の半幅 skirt=裾の位置（どちらも身長比）
  // 返り値の robe / head を、腕や持ち物と重ねる順に並べて使う
  const person = (b, x, feet, h, { robe = 'c1', hem = 0.2, skirt = 1, head = 'body' } = {}) => {
    const r = h * 0.095, top = feet - h, ys = top + 2 * r + h * 0.03, s = h * 0.15, m = h * hem, yh = top + h * skirt;
    const d = `M${f(x - s)},${f(ys)} Q${f(x)},${f(ys - h * 0.035)} ${f(x + s)},${f(ys)} L${f(x + m)},${f(yh)} Q${f(x)},${f(yh + h * 0.02)} ${f(x - m)},${f(yh)} Z`;
    return { r, top, ys, s, m, robe: b.tinted(d, robe, 'ink', 2), head: `<circle class="ko" cx="${f(x)}" cy="${f(top + r)}" r="${f(r + 1.1)}"/>${b.circle(x, top + r, r, head)}` };
  };
  // 腕や脚。pts は付け根から先までの点。sleeve は色（s1=金 s2=元素の色 dark=墨、省略で紙色）。end は先に付けるもの
  const limb = (b, pts, sleeve = '', end = 'hand') => {
    const d = `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')}`, [ex, ey] = pts[pts.length - 1];
    const tip = end === 'hand' ? b.circle(ex, ey, 2, 'body fine') : end === 'foot' ? blk(`M${f(ex - 3)},${f(ey + 1.6)} a3,1.5 0 1 0 6,0 a3,1.5 0 1 0 -6,0`) : '';
    return `<path class="limb" d="${d}"/><path class="limb-in ${sleeve}" d="${d}"/>${tip}`;
  };
  const rod = (x1, y1, x2, y2, w = 2.8) => `<path class="rod" style="stroke-width:${w}" d="M${x1},${y1} L${x2},${y2}"/><path class="rod-in" style="stroke-width:${f(w - 1.4)}" d="M${x1},${y1} L${x2},${y2}"/>`;
  const FEATHER = 'M0,0 C4,-9.6 12,-15 20,-16 C18.4,-9.2 11.6,-3 1.4,1 Z';
  const feather = (b, x, y, rot, sc = 1) => at(x, y, `${b.tinted(FEATHER, 'lite', 'ink fine', 2)}<path class="ink hair" d="M1,0.4 C6,-6.6 12,-11.6 19,-15.4 M7,-5 L5.6,-9 M11,-8.4 L10,-12.2 M9.4,-4 L13.6,-4.6 M13.4,-7.6 L17,-8.6"/>`, rot, sc);
  const LEMNISCATE = 'M0,0 C-6,-8 -16,-8 -16,0 C-16,8 -6,8 0,0 C6,-8 16,-8 16,0 C16,8 6,8 0,0 Z';
  const BIRD = 'M0,0 C-3,-5 -8,-6 -10,-3 C-6,-3 -3,-1 0,3 C3,-1 6,-3 10,-3 C8,-6 3,-5 0,0 Z';
  // ───────── 0〜10 ─────────
  // 0 愚者: 棒の先に荷物の包みを下げて肩に担ぎ、花を手に崖の縁へ踏み出す旅人。風に乗る羽根、遠くの山と太陽
  function fool(b) {
    const cliff = b.polyD([[13, 111], [56, 104], [74, 107], [80, 116], [74, 127], [79, 141], [72, 157], [13, 157]], false, 0.4);
    const peaks = b.polyD([[13, 100], [22, 90], [28, 95], [38, 82], [48, 94], [56, 104]], false, 0.4);
    const wind = [[118, 80, 107], [128, 84, 107], [139, 80, 104], [149, 78, 107]].map(([y, x0, x1]) => spline([[x0, y], [x0 + 7, y - 2.4], [x0 + 14, y + 1.6], [x1, y - 1]])).join(' ');
    const P = person(b, 55, 104.6, 45, { robe: 'c1', hem: 0.2, skirt: 0.68 });
    return `${sun(b, 27, 47, 9)}${el('M84,40 q3,-3 6,0 q3,-3 6,0 M70,50 q2.4,-2.4 4.8,0 q2.4,-2.4 4.8,0', 'ink fine')}
      ${b.hatch(`${peaks} L56,112 L13,112 Z`, 'c2-ln', 45, 2.3, [12, 80, 58, 112])}${el(peaks, 'ink fine')}
      ${el(wind, 'c2-ln heavy')}${feather(b, 86, 104, 24)}${feather(b, 96, 132, 62, 0.6)}
      ${el(`${cliff} Z`, 'body')}${b.lines([[62, 114, 74, 112], [58, 124, 70, 123], [62, 134, 74, 133], [56, 145, 72, 145]])}
      ${blk([[20, 123], [27, 119], [34, 117.6], [41, 113.6]].map(([x, y]) => `M${x},${y} a2.2,1.1 -12 1 0 4.4,-0.9 a2.2,1.1 -12 1 0 -4.4,0.9`).join(' '))}
      ${b.dashes([[18, 134, 12], [34, 142, 10], [20, 150, 14], [44, 130, 8]])}
      ${rod(60, 79, 82, 56)}
      ${b.tinted('M82,57 C77,60 74,66 75.6,71 C77.4,76 88,76 89.6,71 C91,66 87,60 82,57 Z', 'c2', 'ink', 2)}
      <path class="rod-in" style="stroke-width:1" d="M77.4,66 Q82.6,68.6 88,66 M76.6,70.6 Q82.6,73.2 88.8,70.6"/>
      ${b.tinted('M82,57.4 L77.6,53.6 L80.4,58.6 Z M82,57.4 L87,54.6 L83.8,59 Z', 'c2', 'ink fine')}
      ${limb(b, [[52, 89], [48, 104]], 's2', 'foot')}${limb(b, [[58, 89], [62.6, 104.6]], 's2', 'foot')}
      ${P.robe}<path class="ink fine" d="M49,80 H61"/>
      ${limb(b, [[60.6, 72], [66.4, 77], [64.6, 71.4]])}
      <path class="ink fine" d="M40,71.6 L40,63"/>${b.floret(40, 61, 5, 3.8, 'lite')}${limb(b, [[49.4, 72], [44.6, 75.6], [40, 72.6]])}
      ${P.head}${b.tinted('M50,61.6 L55,53 L60,61.6 Z', 'c2', 'ink fine')}${feather(b, 57.6, 56, -34, 0.4)}`;
  }

  // 1 魔術師: 机に杯・剣・金貨を並べ、片手で杖を掲げ、もう片方の手で机を指す人。頭上に無限の輪と花綱
  function magician(b) {
    const drape = 'M24,118 L24,130 Q33,136.6 42,130 Q51,136.6 60,130 Q69,136.6 78,130 Q87,136.6 96,130 L96,118 Z';
    const garland = [[14, 54], [30, 40], [60, 35], [90, 40], [106, 54]];
    const leaves = [[20, 48, -160], [22, 47, -40], [42, 37.4, -150], [46, 36.6, -20], [74, 36.6, -160], [78, 37.4, -30], [98, 47, -140], [100, 48, -20]].map(([x, y, r]) => b.leaf(x, y, r, 0.9, 'c2 wash')).join('');
    const P = person(b, 60, 114, 52, { robe: 'c2', hem: 0.2 });
    return `${b.curve(garland, 'ink fine')}${leaves}${b.floret(30, 40, 5, 4.4)}${b.floret(60, 35, 5, 4.4)}${b.floret(90, 40, 5, 4.4)}
      ${at(60, 51.6, `${el(LEMNISCATE, 'ko')}${el(LEMNISCATE, 'ink bold')}`, 0, 0.56)}
      ${P.robe}<path class="body fine" d="M57.4,74 L62.6,74 L63.6,114 L56.4,114 Z"/>${C1('M52.4,91 H67.6 V94.4 H52.4 Z')}<path class="ink fine" d="M52.4,91 H67.6 V94.4 H52.4 Z"/>
      ${b.rays(79.4, 47, 5, 9, 10, 'ink hair', 0.3, 7)}${at(78.4, 52, staff(b, 0, 0, 0.42), 12)}${limb(b, [[66.6, 76], [73, 68], [77, 59]], 's2')}
      ${limb(b, [[53.4, 76], [47, 88], [44.6, 100]], 's2')}${P.head}<path class="ink fine" d="M55.4,63.4 Q60,65.4 64.6,63.4"/>
      ${b.hatch(drape, 'c2-ln', 90, 2.2, [22, 116, 98, 138])}${el(drape, 'ink')}
      ${b.poly(rect(20, 112, 100, 118), 'body', true)}${b.poly(rect(26, 133, 31, 152), 'body', true)}${b.poly(rect(89, 133, 94, 152), 'body', true)}
      ${cup(b, 29, 101, 0.82)}${coin(b, 91, 104, 0.8)}${at(62, 109.4, sword(b, 0, 0, 30, 0.62), 90)}
      ${b.line(13, 152, 107, 152)}${b.dashes([[38, 155.4, 12], [66, 155.4, 14]])}`;
  }

  // 2 女教皇: 黒と白の柱の間、帳の前に座って書物を抱える人。頭に三相の月、足元に三日月
  function priestess(b) {
    const veil = 'M33,52 H87 V108 Q80.2,116 73.5,108 Q66.8,116 60,108 Q53.2,116 46.5,108 Q39.8,116 33,108 Z';
    const fruits = [[40, 62], [80, 62], [40, 78], [80, 78], [38, 96], [82, 96]];
    const moon = 'M-8.4,-5.4 A6,6 0 1 0 -8.4,5.4 A4.6,4.6 0 1 1 -8.4,-5.4 Z', horns = 'M50,136.6 A10.4,10.4 0 0 0 70,136.6 A12,7.6 0 0 1 50,136.6 Z';
    const P = person(b, 60, 147, 86, { robe: 'c2', hem: 0.25 });
    return `${b.hatch(veil, 'c2-ln', 0, 2.3, [32, 50, 88, 116])}${el(veil, 'ink')}
      ${fruits.map(([x, y]) => `${b.tinted(b.circleD(x, y, 3.6, 0.2), 'c1', 'ink fine', 1.6)}<path class="ink hair" d="M${x - 1.2},${y - 3.4} L${x},${y - 5} L${x + 1.2},${y - 3.4}"/>`).join('')}
      ${el('M20,52 H32 V141 H20 Z', 'blk')}<path class="rod-in" style="stroke-width:0.8" d="M23.4,56 V137"/>${b.poly(rect(17.6, 46, 34.4, 52), 'body', true)}${b.poly(rect(17.6, 141, 34.4, 147), 'body', true)}
      ${b.poly(rect(88, 52, 100, 141), 'body', true)}${b.poly(rect(85.6, 46, 102.4, 52), 'body', true)}${b.poly(rect(85.6, 141, 102.4, 147), 'body', true)}${b.lines([[91, 56, 91, 137], [97, 56, 97, 137]])}
      ${P.robe}<path class="rod-in" style="stroke-width:1" d="M60,84 V144 M52,100 L45,143 M68,100 L75,143"/>
      ${b.tinted(b.polyD(rect(52, 100, 68, 112), true, 0.3), 'c1', 'ink', 1.6)}<path class="ink hair" d="M54,103 H66 M54,106 H66 M54,109 H66"/>
      ${limb(b, [[48, 86], [45, 99], [53, 107]], 's2')}${limb(b, [[72, 86], [75, 99], [67, 107]], 's2')}
      ${P.head}<path class="body fine" d="M52,72 C50,64 55,60.4 60,60.4 C65,60.4 70,64 68,72 C66,67.6 63,66 60,66 C57,66 54,67.6 52,72 Z"/>
      ${at(60, 55.4, `${b.tinted(b.circleD(0, 0, 5, 0.2), 'c1', 'ink')}<g transform="translate(-21 0)">${C1(moon)}${el(moon, 'ink fine')}</g><g transform="translate(21 0) scale(-1 1)">${C1(moon)}${el(moon, 'ink fine')}</g>`, 0, 0.66)}
      ${b.tinted(horns, 'c1', 'ink fine', 1.6)}
      ${b.line(13, 147, 107, 147)}${b.waves([[152, 0], [156.4, 4]], 'c2-ln heavy', 20, 100)}`;
  }

  // 3 女帝: 葉の環を背に、星の冠を戴いて笏を掲げる人。足元に実る麦
  function empress(b) {
    const wreath = Array.from({ length: 18 }, (_, i) => {
      const a = i * 20, r = (a * Math.PI) / 180;
      return b.leaf(60 + Math.cos(r) * 29, 88 + Math.sin(r) * 29, a + (i % 2 ? 58 : 122), 1.05, 'c2 wash');
    }).join('');
    const arc = Array.from({ length: 7 }, (_, i) => { const a = ((208 + i * 20.6) * Math.PI) / 180; return [60 + Math.cos(a) * 44, 92 + Math.sin(a) * 44]; });
    const wheat = [[18, 132], [32, 126], [46, 133], [74, 133], [88, 126], [102, 132]].map(([x, y]) => {
      const ear = [0, 5.4, 10.8].map((dy) => b.leaf(x, y + dy, -62, 0.62, 'c1') + b.leaf(x, y + dy, -118, 0.62, 'c1')).join('');
      return `${b.line(x, 157, x, y - 2, 'ink fine')}${ear}${at(x, y - 3, `${C1('M0,0 C-1.6,-2 -1.4,-5 0,-6.4 C1.4,-5 1.6,-2 0,0 Z')}${el('M0,0 C-1.6,-2 -1.4,-5 0,-6.4 C1.4,-5 1.6,-2 0,0 Z', 'ink hair')}`)}`;
    }).join('');
    const P = person(b, 60, 130, 64, { robe: 'lite', hem: 0.3 });
    return `${stars(arc, 3.6)}${b.circle(60, 88, 29, 'ink fine')}${wreath}
      ${b.tinted('M34,130 C34,125 86,125 86,130 C86,135.6 34,135.6 34,130 Z', 'c2', 'ink', 2)}
      ${P.robe}${C2([[52, 94], [66, 96], [47, 110], [60, 108], [72, 112], [54, 122], [67, 123]].map(([x, y]) => dot(x, y, 1.5)).join(' '))}<path class="ink fine" d="M50,88 Q60,91 70,88"/>
      ${rod(81, 100, 82, 60, 2.6)}${b.tinted(b.circleD(82, 58, 3.4, 0.2), 'c1', 'ink fine')}${limb(b, [[69, 82], [77, 88], [81.4, 80]])}
      ${limb(b, [[51, 82], [44, 94], [52, 102]])}
      ${P.head}${crown(b, 60, 67.4, 12)}
      ${wheat}${b.dashes([[14, 154, 8], [38, 152, 8], [64, 153, 9], [92, 152, 8]])}`;
  }

  // 4 皇帝: 山並みを背に玉座に座り、笏と宝珠を手にした人。足元は市松の床
  function emperor(b) {
    const range = b.polyD([[13, 96], [21, 82], [27, 89], [36, 72], [45, 88], [60, 96], [75, 88], [84, 72], [93, 89], [99, 80], [107, 96]], false, 0.4);
    const back = 'M36,124 V52 Q60,39 84,52 V124', panel = 'M41.5,124 V56.5 Q60,46.5 78.5,56.5 V124 Z';
    const spiral = (cx, dir) => spline(Array.from({ length: 15 }, (_, i) => {
      const t = i / 14, a = Math.PI / 2 + t * Math.PI * 3.1, r = 6.6 * (1 - t * 0.84);
      return [cx - dir * Math.cos(a) * r, 45.4 + Math.sin(a) * r];
    }));
    const tiles = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) tiles.push(`M${f(13 + c * 11.75)},${r ? 148 : 140} h11.75 v${r ? 9 : 8} h-11.75 Z`);
    const arm = (x) => `${b.poly([[x - 4.2, 124], [x - 4.2, 99.5], [x + 4.2, 99.5], [x + 4.2, 124]], 'body')}${b.circle(x, 97, 3.7, 'body')}${blk(dot(x, 97, 1))}`;
    const P = person(b, 60, 124, 64, { robe: 'c2', hem: 0.25 });
    return `${b.hatch(`${range} L107,100 L13,100 Z`, 'c2-ln', 45, 2.2, [12, 64, 108, 100])}${el(range, 'ink fine')}${b.line(13, 96.4, 107, 96.4, 'ink fine')}
      ${b.dashes([[16, 106, 9], [20, 117, 7], [15, 127, 8], [95, 105, 9], [93, 116, 7], [97, 127, 8]])}
      ${el(back, 'body bold')}${b.hatch(panel, 'c2-ln', 90, 2.2, [40, 44, 80, 126])}${el(panel, 'ink fine')}
      ${el(spiral(36, -1), 'ink')}${el(spiral(84, 1), 'ink')}${arm(34)}${arm(86)}
      ${P.robe}<path class="rod-in" style="stroke-width:1" d="M60,78 V122 M53,92 L48,122 M67,92 L72,122"/>${C1('M51,90 H69 V93.4 H51 Z')}<path class="ink fine" d="M51,90 H69 V93.4 H51 Z"/>
      ${rod(77, 118, 77, 60, 2.6)}${b.tinted(b.circleD(77, 58, 3.4, 0.2), 'c1', 'ink fine')}${limb(b, [[68.6, 78], [75, 88], [77, 97]], 's2')}
      ${limb(b, [[51.4, 78], [45, 88], [44, 98]], 's2')}${b.tinted(b.circleD(44, 92.6, 5.4, 0.2), 'c1', 'ink', 1.6)}<path class="ink hair" d="M38.8,92.6 Q44,94.6 49.2,92.6 M44,87.4 V92.8"/>
      ${P.head}<path class="body fine" d="M55.4,68.4 L64.6,68.4 L60,77 Z"/>${crown(b, 60, 61.4, 13)}
      ${b.poly(rect(26, 124, 94, 132), 'body', true)}${b.poly(rect(19, 132, 101, 140), 'body', true)}${b.lines([[29, 128, 91, 128], [22, 136, 98, 136]])}
      ${b.clip('M13,140 H107 V157 H13 Z', C2(tiles.join(' ')))}${b.line(13, 140, 107, 140)}${b.line(13, 148, 107, 148, 'ink hair')}`;
  }

  // 5 教皇: 壁龕の下に立ち、片手を上げ、三重の十字の杖を持つ人。頭に三重冠、足元に交差する鍵
  function hierophant(b) {
    const arch = 'M22,150 V76 A38,38 0 0 1 98,76 V150', lunette = 'M24,76 A36,36 0 0 1 96,76 Z';
    const tiara = 'M51.4,75 C50,63 54.6,53.6 60,51.6 C65.4,53.6 70,63 68.6,75 Z';
    const key = (fill) => `<path class="rod" style="stroke-width:3.4" d="M0,-6 L0,-56"/><path class="rod-in" style="stroke-width:1.9" d="M0,-6 L0,-56"/>
      ${b.tinted('M0,-57 h8 v4.4 h-3.4 v3 h3.4 v4.4 h-8 Z', fill, 'ink fine')}${b.tinted(b.circleD(0, 0, 6.4, 0.2), fill, 'ink')}<circle class="ko" cx="0" cy="0" r="3"/>${b.circle(0, 0, 3, 'ink fine')}`;
    const P = person(b, 60, 150, 78, { robe: 'c1', hem: 0.24 });
    return `${b.hatch(lunette, 'c2-ln', 45, 2.4, [22, 38, 98, 78])}${el(arch, 'ink bold')}${b.line(24, 76, 96, 76, 'ink fine')}
      ${b.poly(rect(15, 150, 105, 156.4), 'body', true)}${b.lines([[30, 84, 30, 150], [90, 84, 90, 150]])}
      ${rod(38, 150, 38, 60, 2.6)}<path class="ink" d="M34,65 H42 M32,71 H44 M30,77 H46"/>
      ${P.robe}<path class="body fine" d="M57.4,90 L62.6,90 L63.4,150 L56.6,150 Z"/><path class="ink fine" d="M58.4,100 H61.6 M60,98.4 V101.6 M58.4,114 H61.6 M60,112.4 V115.6"/>
      ${limb(b, [[49.4, 93], [43, 100], [38.6, 104]])}${limb(b, [[70.6, 93], [78, 99], [81, 89]])}
      ${at(51, 152, key('c1'), 40, 0.4)}${at(69, 152, key('lite'), -40, -0.4, 0.4)}
      ${P.head}<path class="ko" style="stroke-width:2.4" d="${tiara}"/>${b.tinted(tiara, 'c1', 'ink')}<path class="ink fine" d="M53.4,59.6 Q60,62 66.6,59.6 M52,65 Q60,67.6 68,65 M51.4,70.4 Q60,73 68.6,70.4"/>
      ${blk(dot(60, 49.4, 1.8))}`;
  }

  // 6 恋人: 枝を寄せ合う二本の木の下で手を取り合う二人。頭上に太陽と組み合う二つの輪
  function lovers(b) {
    const tree = (dir) => {
      const X = (x) => 60 + dir * x;
      const trunk = [[36, 152], [35, 128], [31, 104], [22, 84], [8, 70]].map(([x, y]) => [X(x), y]);
      const leaves = [[33, 112, 200], [30, 100, 150], [27, 92, 210], [22, 84, 140], [17, 78, 215], [12, 73, 150], [6, 70, 225], [26, 86, 300], [16, 74, 320], [34, 120, 160]]
        .map(([x, y, r]) => b.leaf(X(x), y, dir > 0 ? r : 180 - r, 1.15, 'c2 wash')).join('');
      return `${b.curve(trunk, 'ink bold')}${b.curve([[34, 118], [40, 108], [42, 98]].map(([x, y]) => [X(x), y]), 'ink')}${b.leaf(X(42), 98, dir > 0 ? 250 : -70, 1.1, 'c2 wash')}${b.leaf(X(41), 104, dir > 0 ? 320 : -140, 1, 'c2 wash')}${leaves}`;
    };
    const ring = (cx) => `<circle class="rod" style="stroke-width:3.4" cx="${cx}" cy="86" r="6.4"/><circle class="c1-ln" style="stroke-width:2;opacity:1" cx="${cx}" cy="86" r="6.4"/>`;
    const A = person(b, 47, 140, 40, { robe: 'c2', hem: 0.22 }), B = person(b, 73, 140, 40, { robe: 'lite', hem: 0.22 });
    return `${sun(b, 60, 49, 9)}${tree(-1)}${tree(1)}${ring(55.6)}${ring(64.4)}
      ${b.curve([[13, 141], [34, 138.6], [60, 140], [86, 138.6], [107, 141]])}
      <path class="ink fine" d="M55,157 C55,149 46,144 30,142.4 M65,157 C65,149 74,144 90,142.4"/>${b.dashes([[16, 150, 10], [94, 150, 10]])}
      ${limb(b, [[42, 110], [39.6, 119], [40.4, 127]], 's2')}${limb(b, [[78, 110], [80.4, 119], [79.6, 127]])}
      ${A.robe}${B.robe}<path class="ink fine" d="M42.6,119 H51.4 M68.6,119 H77.4"/>
      ${limb(b, [[52, 110], [56.6, 117], [60, 119.6]], 's2')}${limb(b, [[68, 110], [63.4, 117], [60, 119.6]])}
      ${A.head}${B.head}<path class="body fine" d="M68.6,104 C68,98.6 78,98.6 77.4,104 C76,101.6 70,101.6 68.6,104 Z"/>`;
  }

  // 7 戦車: 星の天蓋を掲げた車に立ち、黒と白の二頭の馬の手綱を取る人
  function chariot(b) {
    const drape = 'M29,36 H91 V47 Q84.8,53.4 78.6,47 Q72.4,53.4 66.2,47 Q60,53.4 53.8,47 Q47.6,53.4 41.4,47 Q35.2,53.4 29,47 Z';
    const car = 'M35,96 H85 V121 Q60,129.6 35,121 Z', wing = 'M55.6,108 C50,102.6 44,103.6 39.6,108 C45,108 50,110.8 55.6,110 Z';
    const horse = b.curveD([[-9, 0], [-6.4, -7], [-5, -13], [-11, -9.4], [-15, -12], [-12.4, -18.6], [-4, -27], [0.6, -29], [3.6, -34.6], [6, -28], [9.6, -20], [11.4, -10], [10.4, 0]], true, 0.2);
    const steed = (x, dir, dark) => at(x, 152, `<path class="ko" style="stroke-width:2.4" d="${horse}"/>${el(horse, dark ? 'blk' : 'body')}
      <circle class="${dark ? 'lite' : 'blk'}" cx="-4.6" cy="-21" r="1.1"/>
      <path class="${dark ? 'rod-in' : 'ink hair'}" style="stroke-width:0.7" d="M3,-29 C6,-24 8,-17 8.6,-9 M5.6,-26 L9,-27 M7.4,-20 L10.8,-20.6 M8.4,-13 L11.6,-13 M-13.6,-15 L-8,-12 M-8,-12 L-5.6,-16"/>`, 0, dir * 1.15, 1.15);
    const tyre = (x) => `${b.ellipse(x, 112, 4.6, 15, 'body bold')}${b.lines([[x, 98, x, 126], [x - 4, 105, x + 4, 119], [x - 4, 119, x + 4, 105]], 'ink fine', 0.1)}`;
    const P = person(b, 60, 104, 50, { robe: 'c1', hem: 0.2 });
    return `${stars([[20, 58], [101, 62], [17, 86], [103, 88], [22, 40], [98, 40]])}
      ${tyre(29)}${tyre(91)}${rod(31, 48, 36, 97, 2.4)}${rod(89, 48, 84, 97, 2.4)}
      ${b.tinted(drape, 'c2', 'ink', 2)}${el([[41, 41.6], [53.6, 41], [66.4, 41], [79, 41.6]].map(([x, y]) => star4D(x, y, 2.6)).join(' '), 'lite')}
      ${P.robe}<path class="body fine" d="M57.4,72 h5.2 v5.2 h-5.2 Z"/><path class="ink fine" d="M54.4,86 H65.6"/>
      ${b.tinted(car, 'c2', 'ink', 2)}<path class="rod-in" style="stroke-width:1.2" d="M38,99.6 H82"/>
      ${el(wing, 'body fine')}<g transform="translate(120 0) scale(-1 1)">${el(wing, 'body fine')}</g>${b.tinted(b.circleD(60, 108, 4.2, 0.2), 'c1', 'ink', 1.4)}
      ${limb(b, [[53.6, 68], [48, 80], [50, 92]], 's2')}${limb(b, [[66.4, 68], [72, 80], [70, 92]], 's2')}
      ${P.head}${b.tinted('M54.8,57.4 Q60,50 65.2,57.4 Z', 'c2', 'ink fine')}
      <path class="ink fine" d="M50,92 C42,104 34,118 30,134 M70,92 C78,104 86,118 90,134"/>
      ${steed(40, 1, true)}${steed(80, -1, false)}
      ${b.line(13, 152, 107, 152)}${b.dashes([[16, 155.6, 10], [54, 155.6, 12], [94, 155.6, 10]])}`;
  }

  // 8 力: 目を閉じた獅子の顔と、その首に掛けた花綱。頭上に無限の輪
  function strength(b) {
    const petal = 'M0,-5.4 C6,-4.6 12,-2.4 15.4,0 C12,2.4 6,4.6 0,5.4 Z';
    const mane = Array.from({ length: 14 }, (_, i) => {
      const a = (i * 360) / 14 - 90, r = (a * Math.PI) / 180;
      return at(60 + Math.cos(r) * 17, 90 + Math.sin(r) * 17, `${C1(petal)}${el(petal, 'ink fine')}`, a, i % 2 ? 1 : 0.86);
    }).join('');
    const chain = [[22, 112], [34, 128], [48, 137], [60, 139.6], [72, 137], [86, 128], [98, 112]];
    return `${at(60, 43, `${el(LEMNISCATE, 'ink bold')}`, 0, 0.62)}
      ${b.curve(chain, 'ink fine')}${[[27, 119, 60], [41, 133, 30], [79, 133, 150], [93, 119, 120]].map(([x, y, r]) => b.leaf(x, y, r, 1, 'c2 wash') + b.leaf(x, y, r + 180, 1, 'c2 wash')).join('')}
      ${mane}${b.circle(47.4, 76, 4.6, 'body')}${b.circle(72.6, 76, 4.6, 'body')}
      <circle class="ko" cx="60" cy="90" r="18.6"/>${b.circle(60, 90, 17.6, 'body')}
      <path class="ink" d="M48.6,87 q3.6,3.4 7.2,0 M64.2,87 q3.6,3.4 7.2,0"/><path class="ink fine" d="M47,82 q5,-2.6 9.6,-0.4 M63.4,81.6 q4.6,-2.2 9.6,0.4 M60,98 L60,101 M60,101 q-4.4,4.6 -8.6,1 M60,101 q4.4,4.6 8.6,1"/>
      ${blk(`M56.4,93.4 L63.6,93.4 L60,98 Z ${[[51, 97.6], [48.6, 100.4], [53, 100.6], [69, 97.6], [71.4, 100.4], [67, 100.6]].map(([x, y]) => dot(x, y, 0.7)).join(' ')}`)}
      ${[[34, 128], [48, 137], [60, 139.6], [72, 137], [86, 128]].map(([x, y]) => `<circle class="ko" cx="${x}" cy="${y}" r="5"/>${b.floret(x, y, 5, 4.6, 'c2')}`).join('')}`;
  }

  // 9 隠者: 夜の山を背に、頭巾をかぶって杖をつき、星の灯りを掲げる人
  function hermit(b) {
    const peak = b.polyD([[13, 142], [28, 118], [38, 126], [52, 100], [66, 118], [80, 104], [92, 116], [107, 132]], false, 0.5);
    const hood = 'M44.6,84 C43.6,70 48,60.6 56,59 C64,60.6 68.4,70 67.4,84 Z', lamp = 'M77,86 L89,86 L90.6,99 L75.4,99 Z';
    const P = person(b, 56, 152, 92, { robe: 'c2', hem: 0.2 });
    return `${b.hatch(`${peak} L107,31 L13,31 Z`, 'c2-ln', 0, 2.3, [12, 30, 108, 134])}
      ${stars([[24, 44], [38, 62], [86, 42], [100, 60], [76, 54], [20, 78], [96, 84]], 2.8)}
      ${el(`${peak} L107,157 L13,157 Z`, 'body')}<path class="ink hair" d="M24,124 L28,128 L31,124 M77,109 L80,113 L83,109"/>${b.dashes([[18, 146, 9], [84, 140, 10], [90, 150, 9]])}
      ${rod(35, 153, 38, 50, 3)}
      ${P.robe}<path class="rod-in" style="stroke-width:1" d="M56,92 V150 M48,104 L43,150 M64,104 L69,150"/>
      ${limb(b, [[45, 86], [39.6, 93], [37.4, 99]], 's2')}
      <circle class="ko" cx="83" cy="92" r="13"/>${b.rays(83, 92, 13.6, 19.6, 14, 'ink hair', 0.2, 16.6)}
      ${b.tinted(lamp, 'lite', 'ink', 0)}${C1(starD(83, 92.4, 4.6, 6, 0.56))}${el(starD(83, 92.4, 4.6, 6, 0.56), 'ink hair')}${blk('M75.6,86 L83,80.6 L90.4,86 Z M74.6,99 H91.4 V101.4 H74.6 Z')}
      ${limb(b, [[67, 86], [76, 86], [83, 79]], 's2')}
      ${b.tinted(hood, 'c2', 'ink', 2)}${b.circle(56.4, 72.4, 5.6, 'body fine')}<path class="body fine" d="M51.6,75.4 C53.6,79.6 59.2,79.6 61.2,75.4 L56.4,90 Z"/>`;
  }

  // 10 運命の輪: 台に据えた輪と、それにつかまって昇る者・頂に座る者・降りていく者。回る向きの矢印、空に太陽と月
  function wheel(b) {
    const ring = (r) => Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4 + Math.PI / 8).map((a) => [60 + Math.cos(a) * r, 100 + Math.sin(a) * r]);
    const spokes = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return [60 + Math.cos(a) * 7, 100 + Math.sin(a) * 7, 60 + Math.cos(a) * 21.6, 100 + Math.sin(a) * 21.6]; });
    const joints = ring(22).map(([x, y], i) => { const [x2, y2] = ring(27)[i]; return [x, y, x2, y2]; });
    const moon = 'M2.6,-5 A5.4,5.4 0 1 0 2.6,5 A4,4 0 1 1 2.6,-5 Z';
    // 輪にしがみつく小さな人。足元が (x, y)、rot で傾ける。legs を渡すと短い衣に脚を付ける
    const rider = (x, y, rot, robe, sleeve, arms, legs = [], extra = '') => {
      const P = person(b, 0, 0, 44, { robe, hem: legs.length ? 0.2 : 0.22, skirt: legs.length ? 0.64 : 1 });
      return at(x, y, `${legs.map((pts) => limb(b, pts, 'dark', '')).join('')}${P.robe}${arms.map((pts) => limb(b, pts, sleeve)).join('')}${P.head}${extra}`, rot, 0.62);
    };
    const tiara = 'M-5.4,-43 L-6.4,-50 L-3,-46.6 L0,-52 L3,-46.6 L6.4,-50 L5.4,-43 Z';
    // 輪の外側に沿う矢印。角度 a0 から a1 へ時計回りに進む
    const arrow = (a0, a1) => {
      const P = (deg, r = 31.6) => [60 + Math.cos((deg * Math.PI) / 180) * r, 100 + Math.sin((deg * Math.PI) / 180) * r];
      const [hx, hy] = P(a1), [bx, by] = P(a1 - 9, 34.6), [cx, cy] = P(a1 - 9, 28.6);
      return `${el(spline(Array.from({ length: 6 }, (_, i) => P(a0 + ((a1 - 9 - a0) * i) / 5))), 'ink fine')}${blk(`M${f(hx)},${f(hy)} L${f(bx)},${f(by)} L${f(cx)},${f(cy)} Z`)}`;
    };
    return `${sun(b, 24, 45, 5.6, 'c1', 12)}${at(97, 45, `${C1(moon)}${el(moon, 'ink fine')}`)}
      ${rod(60, 100, 42, 153, 3.4)}${rod(60, 100, 78, 153, 3.4)}${b.poly(rect(34, 152, 86, 156.6), 'body', true)}
      <circle class="ko" cx="60" cy="100" r="28.4"/>${b.circle(60, 100, 27, 'body bold')}${b.circle(60, 100, 22, 'ink')}${b.lines(joints, 'ink hair', 0.1)}${C2(ring(24.5).map(([x, y]) => dot(x + 3.2, y - 3.2, 1.2)).join(' '))}
      ${b.lines(spokes, 'ink', 0.15)}${b.circle(60, 100, 7, 'body')}${b.tinted(b.circleD(60, 100, 3.2, 0.2), 'c1', 'ink')}
      ${rider(60, 74.6, 0, 'c1', 's1', [[[-6, -33], [-10, -24], [-7, -15]], [[6, -33], [10, -24], [7, -15]]], [], b.tinted(tiara, 'c2', 'ink fine'))}
      ${rider(25, 121, 12, 'c2', 's2', [[[-6, -33], [-3, -42], [3, -49]], [[6, -33], [11, -40], [15, -47]]], [[[-3, -17], [-6, -8], [-4, 0]], [[3, -17], [7, -9], [4, -1]]])}
      ${rider(95, 131, -12, 'lite', '', [[[6, -33], [1, -27], [-7, -24]], [[-6, -33], [-12, -31], [-16, -25]]], [[[-3, -17], [-7, -9], [-4, -1]], [[3, -17], [6, -8], [4, 0]]])}
      ${arrow(-64, -24)}${arrow(110, 143)}
      ${b.line(13, 156.6, 107, 156.6)}${b.dashes([[15, 150, 9], [96, 150, 9]])}`;
  }

  // ───────── 11〜21 ─────────
  // 11 正義: 二本の柱と帳を背に座り、片手に立てた剣、片手に天秤を持つ人
  function justice(b) {
    const veil = 'M23,36 H97 V88 Q89.6,96 82.2,88 Q74.8,96 67.4,88 Q60,96 52.6,88 Q45.2,96 37.8,88 Q30.4,96 23,88 Z';
    const pan = (x) => { const d = `M${x - 7},110 H${x + 7} C${x + 7},115.6 ${x + 3.6},118.6 ${x},118.6 C${x - 3.6},118.6 ${x - 7},115.6 ${x - 7},110 Z`; return `${b.lines([[x, 94, x - 6.4, 110], [x, 94, x + 6.4, 110]], 'ink fine', 0.15)}${b.tinted(d, 'c1', 'ink', 1.6)}`; };
    const post = (x) => `${b.poly(rect(x - 3, 40, x + 3, 152), 'body', true)}${b.circle(x, 36.6, 3.4, 'body')}`;
    const P = person(b, 60, 152, 84, { robe: 'c2', hem: 0.24 });
    return `${b.hatch(veil, 'c2-ln', 90, 2.3, [22, 34, 98, 98])}${el(veil, 'ink fine')}${post(20)}${post(100)}
      ${P.robe}<path class="rod-in" style="stroke-width:1" d="M60,90 V150 M52,104 L46,150 M68,104 L74,150"/>${C1('M49,106 H71 V109.6 H49 Z')}<path class="ink fine" d="M49,106 H71 V109.6 H49 Z"/>
      <path class="ko" style="stroke-width:10" d="M84,58 L84,104"/>${sword(b, 84, 106, 66, 0.8)}${limb(b, [[72, 90], [80, 102], [84, 113]], 's2')}
      ${pan(28)}${pan(48)}<path class="ko" style="stroke-width:4.4" d="M28,94 Q38,90 48,94"/><path class="ink bold" d="M28,94 Q38,90 48,94"/><path class="ink" d="M38,92 V86"/>
      ${limb(b, [[48, 90], [42, 94], [38, 86]], 's2')}
      ${P.head}${crown(b, 60, 69.6, 13)}${b.line(13, 152, 107, 152)}${b.dashes([[30, 155.6, 12], [78, 155.6, 12]])}`;
  }

  // 12 吊るされた男: 二本の木に渡した梁から片足で逆さに下がる人。頭のまわりに光
  function hanged(b) {
    const trunk = (x, dir) => `${b.poly(rect(x - 3.2, 50, x + 3.2, 150), 'body', true)}${b.lines([[x - 1, 60, x - 1, 146]])}
      ${[[72, -50], [96, -40], [120, -56]].map(([y, r]) => `<path class="ink" d="M${x + dir * 3.2},${y} l${dir * 5},-3.4"/>${b.leaf(x + dir * 8.2, y - 3.4, dir > 0 ? r : 180 - r, 1.05, 'c2 wash')}${b.leaf(x + dir * 8.2, y - 3.4, dir > 0 ? r + 70 : 110 - r, 0.9, 'c2 wash')}`).join('')}`;
    return `${b.waves([[151, 0], [155.6, 4]], 'c2-ln heavy')}${trunk(23, 1)}${trunk(97, -1)}
      ${b.poly(rect(15, 43.6, 105, 50), 'body', true)}${b.lines([[20, 46.8, 100, 46.8]])}
      ${b.line(60, 50, 60, 66, 'ink fine')}${blk(dot(60, 66.4, 1.5))}
      <circle class="ko" cx="60" cy="130" r="14.6"/>${b.rays(60, 130, 8.6, 14.6, 14, 'ink fine', 0.22, 12)}${plate('<circle class="c1 wash" cx="60" cy="130" r="8.4"/>')}
      ${b.tinted('M63,98 L74.4,87 L65.6,76 L62,78.8 L68.6,87 L59.6,95 Z', 'lite', 'ink', 2)}
      ${b.tinted('M57.8,66 L62.2,66 L63.4,98 L56.6,98 Z', 'c2', 'ink')}
      <path class="body" d="M51.4,104 L44,113.4 L51.4,120 M68.6,104 L76,113.4 L68.6,120"/>
      ${b.tinted('M53.6,97 H66.4 L69.4,122.4 H50.6 Z', 'c1', 'ink')}<path class="ink fine" d="M52.6,104 H67.4"/>
      ${b.circle(60, 129, 6.2, 'body')}<path class="ink hair" d="M55.4,133 L54.6,138 M58,135 L57.6,140 M62,135 L62.4,140 M64.6,133 L65.4,138"/>`;
  }

  // 13 死神: 黒い衣をまとい大鎌を持つ骸骨。川の向こうに昇る太陽、足元に白い花と落ちた冠
  function death(b) {
    const blade = 'M72,43 C54,38 36,45 24,63 C38,54.4 54,50.6 70,50.4 Z', half = 'M72,104 A12,12 0 0 1 96,104 Z';
    const hood = 'M35.6,92 C34.6,80 39.6,70 47,66.6 C54.4,70 59.4,80 58.4,92 Z';
    const rays = Array.from({ length: 7 }, (_, i) => { const a = Math.PI + ((i + 0.5) * Math.PI) / 7; return [84 + Math.cos(a) * 15, 104 + Math.sin(a) * 15, 84 + Math.cos(a) * (i % 2 ? 19 : 22), 104 + Math.sin(a) * (i % 2 ? 19 : 22)]; });
    const tiny = (x) => b.poly([[x - 2.4, 104], [x - 2.4, 93], [x - 3.4, 93], [x - 3.4, 90.6], [x + 3.4, 90.6], [x + 3.4, 93], [x + 2.4, 93], [x + 2.4, 104]], 'body fine');
    const P = person(b, 47, 152, 82, { robe: 'blk', hem: 0.24 });
    return `${b.lines(rays, 'ink fine', 0.2)}${b.tinted(half, 'c1', 'ink')}${tiny(68)}${tiny(100)}${b.line(13, 104, 107, 104)}
      ${b.waves([[113, 0], [118, 4], [123, 0]], 'c2-ln heavy')}${b.line(13, 108.6, 107, 108.6, 'ink fine')}${b.line(13, 127, 107, 127, 'ink fine')}
      ${b.dashes([[16, 134, 9], [74, 133, 9], [72, 153.6, 10], [98, 152, 8]])}
      <path class="ink fine" d="M96,151 C96,145 96.6,141 97.4,138"/>${b.leaf(96.2, 147, -150, 1, 'c2 wash')}${b.leaf(96.4, 144, -30, 1, 'c2 wash')}<circle class="ko" cx="97.6" cy="135" r="6.6"/>${b.floret(97.6, 135, 5, 6.2, 'lite')}
      ${at(82, 148.6, crown(b, 0, 0, 14), -22)}
      ${P.robe}<path class="rod-in" style="stroke-width:0.8" d="M47,96 V150 M39,104 L33,149 M55,104 L61,149"/>
      <path class="ko" style="stroke-width:5.4" d="M66,153 L72,44"/>${rod(66, 153, 72, 44, 3.2)}${b.tinted(blade, 'lite', 'ink bold', 2)}<path class="ink hair" d="M68,47 C54,45 40,51 30,60"/>
      ${limb(b, [[57, 92], [63, 99], [68.4, 100]], 'dark')}
      <path class="ko" style="stroke-width:2.4" d="${hood}"/>${el(hood, 'blk')}${b.circle(47, 80.4, 5.6, 'body fine')}
      ${blk(`${dot(44.8, 79.6, 1.2)} ${dot(49.2, 79.6, 1.2)} M46.4,82.4 L47,81 L47.6,82.4 Z`)}<path class="ink hair" d="M44.6,84.4 H49.4 M46,83.6 V85.2 M48,83.6 V85.2"/>`;
  }

  // 14 節制: 上の杯から下の杯へ注がれる流れ。空に太陽、水辺に花
  function temperance(b) {
    const flow = [-2.2, 0, 2.2].map((o) => spline([[57 + o, 67 - o * 0.6], [66 + o, 72 - o * 0.5], [74 + o * 0.8, 86], [79 + o * 0.6, 104]])).join(' ');
    const iris = (x, y) => `<path class="ink fine" d="M${x},${y + 18} L${x},${y + 2}"/>${b.leaf(x, y + 14, -130, 1.1, 'c2 wash')}${b.leaf(x, y + 14, -50, 1.1, 'c2 wash')}
      ${at(x, y, `${C2('M0,2 C-4,-1 -4,-6 0,-9 C4,-6 4,-1 0,2 Z M0,2 C-6,2 -9,-1 -9,-4 C-5,-4 -2,-2 0,2 Z M0,2 C6,2 9,-1 9,-4 C5,-4 2,-2 0,2 Z')}${el('M0,2 C-4,-1 -4,-6 0,-9 C4,-6 4,-1 0,2 Z M0,2 C-6,2 -9,-1 -9,-4 C-5,-4 -2,-2 0,2 Z M0,2 C6,2 9,-1 9,-4 C5,-4 2,-2 0,2 Z', 'ink fine')}`)}`;
    return `${sun(b, 90, 50, 9, 'c2')}
      ${b.poly(rect(20, 40, 34, 54), 'body', true)}${C2('M27,43 L32,51.4 L22,51.4 Z')}${el('M27,43 L32,51.4 L22,51.4 Z', 'ink hair')}
      ${at(41, 71, cup(b, 0, 0, 1.2), 38)}${el(flow, 'c1-ln heavy')}${cup(b, 80, 117, 1.2)}
      ${b.curve([[13, 141], [36, 139], [60, 141], [84, 139], [107, 141]])}${b.waves([[146.4, 4], [151, 0], [155.6, 4]], 'c1-ln heavy')}
      ${iris(24, 122)}${iris(36, 128)}${b.dashes([[92, 136, 10], [54, 137, 8]])}`;
  }

  // 15 悪魔: 黒い台座に座る、角とこうもりの翼を持つ者。頭上に逆さの星、足元へゆるく垂れる二本の鎖
  function devil(b) {
    const horn = 'M46.6,58 C32,56 24,42 37,28 C32.6,40 40,47.6 54,49.6 Z', star = starD(60, 41, 6.4, 5, 0.42, 90), FLAME = 'M0,0 C-3,-3 -1,-7 2,-10 C2,-6 6,-5 4,0 Z';
    const wing = 'M54,70 C45,61 34,58 21,62 C26.4,66 27.6,71 25.6,78 C31,74.6 36,76 40,81.6 C43,77 48,76 54,79 Z';
    const chain = (dir) => {
      const X = (x) => 60 + dir * x, pts = [[5, 131.6], [11, 135.6], [17.6, 138.6], [24.4, 140.6], [31, 141.6]];
      const links = pts.map(([x, y], i) => `<ellipse class="body fine" cx="${X(x)}" cy="${y}" rx="3" ry="1.9" transform="rotate(${dir * (36 - i * 7)} ${X(x)} ${y})"/>`).join('');
      return `${links}<path class="ink bold" d="M${X(33)},${137} A6.4,6.4 0 1 ${dir > 0 ? 1 : 0} ${X(43)},${146}"/>`;
    };
    const wings = `<path class="ko" style="stroke-width:3" d="${wing}"/>${el(wing, 'body')}<path class="ink hair" d="M53,71 C44,65 34,62.6 23.6,63 M53,72 C45,69.6 40.6,74 40,80.6 M52,71 C43,68 31,69.6 26.6,76.6"/>`;
    const horns = `<path class="ko" style="stroke-width:5" d="${horn}"/>${el(horn, 'body')}`;
    const P = person(b, 60, 104, 46, { robe: 'c2', hem: 0.26 });
    return `${b.hatch('M13,31 H107 V98 H13 Z', 'c2-ln', 45, 2.6)}${b.hatch('M13,31 H107 V98 H13 Z', 'c2-ln', -45, 2.6)}${b.line(13, 98, 107, 98, 'ink fine')}
      <circle class="ko" cx="60" cy="41" r="8"/>${C1(star)}${el(star, 'ink fine')}
      ${wings}<g transform="translate(120 0) scale(-1 1)">${wings}</g>
      ${el('M42,104 H78 L80.6,128 H39.4 Z', 'blk')}<path class="rod-in" style="stroke-width:0.8" d="M44,110 H76 M43.4,124 H76.6"/>${b.circle(60, 129.6, 3.6, 'body')}
      ${P.robe}<path class="ink fine" d="M53,84 Q60,87 67,84"/>
      ${limb(b, [[54, 70], [47, 80], [45.6, 90]], 's2')}${rod(46, 86, 42, 99, 2.4)}${at(41.6, 100, `${C1(FLAME)}${el(FLAME, 'ink hair')}`, 190, 1.1)}
      ${limb(b, [[66, 70], [73.4, 64], [77, 56]], 's2')}
      ${at(60, 62, `<g transform="translate(-60 -62)">${horns}<g transform="translate(120 0) scale(-1 1)">${horns}</g></g>`, 0, 0.46)}${P.head}
      ${blk(`${dot(58.2, 62, 0.8)} ${dot(61.8, 62, 0.8)}`)}<path class="ink hair" d="M57.6,65.4 Q60,67 62.4,65.4"/>
      ${chain(-1)}${chain(1)}${b.line(13, 148.6, 107, 148.6)}${b.dashes([[18, 153, 10], [52, 153.6, 14], [90, 153, 10]])}`;
  }

  // 16 塔: 稲妻に打たれて冠が落ち、窓から炎を上げる塔
  function towerStruck(b) {
    const bolt = 'M19,33 L31,33 L52,55 L46,57 L58,71 L36,56 L42,54 Z', FLAME = 'M0,0 C-3,-3 -1,-7 2,-10 C2,-6 6,-5 4,0 Z';
    const win = (x, y) => `${blk(`M${x - 2.6},${y + 4} V${y - 1} A2.6,2.6 0 0 1 ${x + 2.6},${y - 1} V${y + 4} Z`)}${at(x - 0.6, y - 2.6, `${C2(FLAME)}${el(FLAME, 'ink hair')}`, 8, 0.9)}`;
    const bricks = [[49, 90, 58, 90], [62, 96, 72, 96], [48, 110, 56, 110], [64, 126, 73, 126], [50, 130, 60, 130], [58, 78, 66, 78]];
    return `${b.hatch('M13,31 H107 V126 H13 Z', 'c2-ln', -45, 3)}
      <path class="ko" style="stroke-width:4" d="M46,140 L48,74 H72 L74,140 Z"/>
      ${b.poly([[30, 157], [35, 144], [46, 139], [74, 139], [85, 145], [92, 157]], 'body', true)}${b.lines([[38, 148, 48, 146], [72, 147, 84, 150], [44, 153, 58, 152]])}
      ${b.poly([[46, 139], [48, 74], [72, 74], [74, 139]], 'body', true)}
      ${b.poly([[44, 74], [44, 66], [49, 66], [49, 69.6], [54, 69.6], [54, 66], [59.4, 66], [59.4, 69.6], [64.6, 69.6], [64.6, 66], [70, 66], [70, 69.6], [76, 69.6], [76, 74]], 'body', true)}
      ${b.lines(bricks)}<path class="ink fine" d="M60,74 L57,84 L62,90 L58,100"/>
      ${win(60, 86)}${win(54, 104)}${win(66, 118)}
      ${b.tinted(bolt, 'c1', 'ink', 2.4)}
      ${at(88, 58, crown(b, 0, 0, 17), 28)}
      ${[[24, 82, -20], [31, 106, 14], [22, 128, -10], [94, 84, 18], [99, 108, -14], [90, 128, 10]].map(([x, y, r]) => drop(b, x, y, r, 1.1)).join('')}`;
  }

  // 17 星: 大きな八芒星と七つの小さな星。水辺に傾けた水差しから水が注がれ、丘の木に鳥がとまる
  function star(b) {
    const big = starD(60, 58, 18, 8, 0.44), jug = 'M-6,-8 C-9.4,-2 -8.4,6 -4,9.4 L4,9.4 C8.4,6 9.4,-2 6,-8 L4.4,-12.4 L-4.4,-12.4 Z';
    const shore = [[13, 122], [34, 119], [56, 124], [78, 114], [107, 104]];
    const pour = [-2, 0, 2].map((o) => spline([[50 + o, 108], [45 + o, 114], [43 + o * 0.6, 122], [42 + o * 0.4, 131]])).join(' ');
    return `${b.rays(60, 58, 21, 27, 16, 'ink hair', 0.2, 24)}${b.tinted(big, 'c1', 'ink', 2)}${b.circle(60, 58, 4, 'body fine')}
      ${stars([[24, 46], [38, 36], [82, 36], [96, 46], [26, 72], [94, 72], [60, 88]], 3.6)}
      ${b.waves([[130, 0], [135.6, 4], [141, 0], [146.6, 4], [152, 0]], 'c2-ln heavy')}
      <path class="ko" d="${spline(shore)} L107,157 L60,157 C66,146 62,134 56,124 Z"/>${b.curve(shore)}<path class="ink" d="M56,124 C62,134 66,146 60,157"/>
      ${b.dashes([[72, 132, 10], [84, 124, 8], [78, 146, 12], [94, 138, 8]])}
      <path class="ink" d="M95,108 L95,86"/>${[[95, 100, -150], [95, 100, -30], [95, 94, -160], [95, 94, -20], [95, 88, -140], [95, 88, -40], [95, 86, -90]].map(([x, y, r]) => b.leaf(x, y, r, 1.1, 'c2 wash')).join('')}${at(95, 74.6, blk('M-3.4,0.4 C-1.4,-3 2,-3.2 3.2,-1 L5.6,-1.6 L3.4,0.6 C2,2.4 -1.4,2.4 -3.4,0.4 Z'))}
      ${el(pour, 'c2-ln heavy')}${at(60, 108, `${b.tinted(jug, 'c1', 'ink', 2)}<path class="ink" d="M6.4,-6 C12,-6 12,3 7.4,4.4"/><path class="ink hair" d="M-7.6,-1 H7.6"/>`, -68)}
      ${b.ellipse(42, 134, 7, 2.2, 'body fine')}${b.ellipse(42, 134, 3.4, 1, 'ink hair')}`;
  }

  // 18 月: 夜空の月としずく、丘に立つ二つの塔、水辺から塔の間へ延びる道
  function moon(b) {
    const hills = spline([[13, 101], [22, 94.5], [34, 94.5], [46, 100], [60, 104], [74, 100], [86, 94.5], [98, 94.5], [107, 101]]);
    const pathL = [[58.6, 104], [55.5, 111], [61, 119], [52.5, 129], [49, 139]], pathR = [[61.4, 104], [60.5, 111], [68.5, 119], [64, 129], [71, 139]];
    const road = `${spline(pathL)} L71,139 ${spline(pathR.slice().reverse()).replace(/^M[^C]+/, '')} Z`;
    return `${b.hatch(`${hills} L107,31 L13,31 Z`, 'c2-ln', 0, 2.3, [12, 30, 108, 106])}
      <circle class="lite" cx="60" cy="60" r="27.5"/>${stars([[22, 42], [36, 36], [88, 38], [100, 50], [20, 66], [101, 72], [78, 33]], 2.6)}
      ${b.rays(60, 60, 18, 25.5, 16, 'ink fine', 0, 22)}
      ${plate('<circle class="c1" cx="60" cy="60" r="14.5"/>')}${b.clip('M45.5,60 a14.5,14.5 0 1 0 29,0 a14.5,14.5 0 1 0 -29,0', `<circle class="lite" cx="66.2" cy="57.6" r="12.2"/>${b.circle(66.2, 57.6, 12.2, 'ink fine')}`)}${b.circle(60, 60, 14.5)}
      ${[54, 72, 90, 108, 126].map((deg, i) => { const a = (deg * Math.PI) / 180, r = i % 2 ? 31 : 34; return drop(b, 60 + Math.cos(a) * r, 60 + Math.sin(a) * r, deg - 90); }).join('')}
      ${el(hills, 'ink')}${tower(b, 28, 95, 12, 25)}${tower(b, 92, 95, 12, 25)}
      ${plate(el(road, 'c1 wash'))}${b.curve(pathL, 'ink fine')}${b.curve(pathR, 'ink fine')}
      ${b.dashes([[20, 110, 9], [32, 121, 7], [18, 130, 10], [84, 112, 9], [96, 124, 8], [82, 131, 7], [36, 104, 5], [90, 103, 5]])}
      ${b.curve([[13, 139.4], [30, 138.6], [49, 139.4], [71, 139.2], [90, 138.6], [107, 139.4]])}${b.waves([[144, 0], [149, 4], [154, 0]], 'c2-ln heavy')}
      ${b.ellipse(60, 147.5, 10, 3.2, 'body fine')}${b.ellipse(60, 147.5, 6, 1.9, 'ink fine')}${b.ellipse(60, 147.5, 2.4, 0.8, 'ink fine')}`;
  }

  // 19 太陽: まっすぐな光と揺らぐ光を交互に放つ太陽。石垣の向こうに花が並び、手前に旗がなびく
  function sunCard(b) {
    const beams = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 360) / 16, r = (a * Math.PI) / 180;
      if (i % 2) return at(60 + Math.cos(r) * 19, 64 + Math.sin(r) * 19, el('M0,0 C3,-2.4 5,2.4 8,0 C10,-1.6 11,0.6 12,0', 'c2-ln heavy'), a);
      return at(60 + Math.cos(r) * 18.6, 64 + Math.sin(r) * 18.6, `${C1('M0,-3.2 L14,0 L0,3.2 Z')}${el('M0,-3.2 L14,0 L0,3.2 Z', 'ink fine')}`, a);
    }).join('');
    const flower = (x, y) => `<path class="ink fine" d="M${x},${y + 4} L${x},112"/>${b.leaf(x, y + 10, -40, 0.9, 'c2 wash')}<circle class="ko" cx="${x}" cy="${y}" r="7.6"/>${b.floret(x, y, 8, 7.4)}${b.circle(x, y, 2.6, 'body fine')}${blk(dot(x, y, 0.9))}`;
    const flag = 'M61,131 C69,127 77,135.6 87,130.6 L89,143 C79,148 71,139.6 63,144 Z';
    const bricks = [[22, 112.6, 22, 117.4], [40, 112.6, 40, 117.4], [58, 112.6, 58, 117.4], [76, 112.6, 76, 117.4], [94, 112.6, 94, 117.4], [31, 117.4, 31, 122.6], [49, 117.4, 49, 122.6], [67, 117.4, 67, 122.6], [85, 117.4, 85, 122.6], [103, 117.4, 103, 122.6], [22, 122.6, 22, 128], [40, 122.6, 40, 128], [58, 122.6, 58, 128], [76, 122.6, 76, 128], [94, 122.6, 94, 128]];
    return `${beams}${b.tinted(b.circleD(60, 64, 15.4), 'c1', 'ink bold')}
      <path class="ink" d="M52.6,61.6 q2.8,-2.6 5.6,0 M61.8,61.6 q2.8,-2.6 5.6,0 M53,68.6 Q60,74 67,68.6"/>
      ${flower(24, 101)}${flower(46, 97)}${flower(74, 97)}${flower(96, 101)}
      ${b.poly(rect(13, 112, 107, 128), 'body', true)}${b.lines([[13, 117.4, 107, 117.4], [13, 122.6, 107, 122.6], ...bricks])}
      <path class="rod" style="stroke-width:2.8" d="M48,156 L61,130"/><path class="rod-in" style="stroke-width:1.4" d="M48,156 L61,130"/>${b.tinted(flag, 'c2', 'ink', 2)}
      ${b.dashes([[16, 136, 10], [22, 148, 12], [74, 152, 12], [94, 138, 9]])}`;
  }

  // 20 審判: 雲の間から吹き下ろす旗付きのらっぱと、開いた箱から飛び立つ三羽の鳥
  function judgement(b) {
    const cloud = 'M13,33 H107 V46 Q101,54.6 94,47 Q88,56.6 80,48 Q73,57.6 66,49 Q59,57.6 52,49 Q45,56.6 38,48 Q31,55.6 24,47 Q18,53.6 13,46 Z';
    const horn = 'M77.2,49 L79.6,51.6 L53,76.4 L44,95 L30.6,81 L49.6,72.4 Z', flag = 'M70,59.4 L58,70.6 L58,88 L70,76.8 Z';
    const box = (x, y) => `${b.poly([[x - 9, y - 1], [x - 12, y - 9], [x + 6, y - 9], [x + 9, y - 1]], 'body fine', true)}${b.poly(rect(x - 9, y - 1, x + 9, y + 8), 'body', true)}${b.lines([[x - 9, y + 3.4, x + 9, y + 3.4]])}`;
    const bird = (x, y, sc) => at(x, y, `<path class="ko" style="stroke-width:2" d="${BIRD}"/>${el(BIRD, 'body fine')}`, 0, sc);
    return `${b.waves([[141, 0], [146.4, 4], [152, 0]], 'ink hair')}
      ${el(cloud, 'body')}<path class="ink hair" d="M20,40 q4,-4 8,0 M44,38 q5,-5 10,0 M70,40 q4,-4 8,0 M92,38 q4,-4 8,0"/>
      ${b.lines([[28, 92, 20, 100], [34, 97, 30, 108], [41, 100, 42, 111], [24, 86, 14, 90]], 'ink fine')}
      ${b.tinted(flag, 'c2', 'ink', 2)}<path class="rod-in" style="stroke-width:1.5" d="M64,65 L64,82.4 M58.6,79 L69.4,69"/>
      ${b.tinted(horn, 'c1', 'ink', 2.4)}${b.ellipse(37.4, 88, 9.6, 3.4, 'ink fine').replace('<path', '<path transform="rotate(46 37.4 88)"')}
      ${box(28, 133)}${box(60, 126)}${box(92, 133)}${bird(28, 113, 1)}${bird(60, 103, 1.15)}${bird(92, 113, 1)}`;
  }

  // 21 世界: 葉の環に囲まれた地球。上下をリボンで結び、四隅に四つのスートの紋
  function world(b) {
    const wreath = Array.from({ length: 26 }, (_, i) => {
      const a = (i * 360) / 26, r = (a * Math.PI) / 180, x = 60 + Math.cos(r) * 31, y = 94 + Math.sin(r) * 45;
      const tangent = (Math.atan2(Math.cos(r) * 45, -Math.sin(r) * 31) * 180) / Math.PI;
      return b.leaf(x, y, tangent + (i % 2 ? -32 : 32) + 180, 1.15, 'c2 wash');
    }).join('');
    const bow = (y) => `${b.tinted(`M60,${y} l-8,-4.4 l0,8.8 Z M60,${y} l8,-4.4 l0,8.8 Z`, 'c1', 'ink fine', 2)}${blk(dot(60, y, 1.6))}`;
    return `${b.ellipse(60, 94, 31, 45, 'ink fine')}${wreath}${bow(49)}${bow(139)}
      ${b.tinted(b.circleD(60, 94, 17.6), 'c1 wash', 'ink bold', 2)}${b.ellipse(60, 94, 8, 17.6, 'ink fine')}
      <path class="ink fine" d="M42.4,94 H77.6 M45,84.6 Q60,88.6 75,84.6 M45,103.4 Q60,99.4 75,103.4"/>
      ${C1('M52,83 C55,81 59,82 60,85 C58,88 61,90 59,93 C55,94 52,91 53,88 Z M64,96 C67,95 70,97 70,100 C68,103 65,104 63,101 Z')}
      ${staff(b, 23, 47, 0.42)}${cup(b, 97, 46, 0.56)}${sword(b, 23, 146, 22, 0.5)}${coin(b, 97, 146, 0.62)}`;
  }

  const SCENES = [fool, magician, priestess, empress, emperor, hierophant, lovers, chariot, strength, hermit, wheel, justice, hanged, death, temperance, devil, towerStruck, star, moon, sunCard, judgement, world];
  return { scene: (rank, brush) => SCENES[rank](brush) };
})();
