// 大アルカナの絵柄。1 枚ずつ、象徴になる物を組み合わせた場面として描く。人物は、姿勢が意味を持つ「吊るされた男」だけ簡略な形で描く。
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
  const FEATHER = 'M0,0 C4,-9.6 12,-15 20,-16 C18.4,-9.2 11.6,-3 1.4,1 Z';
  const feather = (b, x, y, rot, sc = 1) => at(x, y, `${b.tinted(FEATHER, 'lite', 'ink fine', 2)}<path class="ink hair" d="M1,0.4 C6,-6.6 12,-11.6 19,-15.4 M7,-5 L5.6,-9 M11,-8.4 L10,-12.2 M9.4,-4 L13.6,-4.6 M13.4,-7.6 L17,-8.6"/>`, rot, sc);
  const LEMNISCATE = 'M0,0 C-6,-8 -16,-8 -16,0 C-16,8 -6,8 0,0 C6,-8 16,-8 16,0 C16,8 6,8 0,0 Z';
  const BIRD = 'M0,0 C-3,-5 -8,-6 -10,-3 C-6,-3 -3,-1 0,3 C3,-1 6,-3 10,-3 C8,-6 3,-5 0,0 Z';
  // 四大元素の記号（火・水・風・地）
  const element = (kind, x, y, s) => {
    const up = kind === 'fire' || kind === 'air', h = s * 0.87, tip = up ? y - h / 2 : y + h / 2, base = up ? y + h / 2 : y - h / 2;
    const bar = kind === 'air' || kind === 'earth' ? ` M${f(x - s * 0.36)},${f(y + (up ? -0.04 : 0.04) * s)} H${f(x + s * 0.36)}` : '';
    const tri = `M${f(x)},${f(tip)} L${f(x + s / 2)},${f(base)} L${f(x - s / 2)},${f(base)} Z`;
    return `${el(tri, 'c1 wash')}${el(tri + bar, 'ink fine')}`;
  };

  // ───────── 0〜10 ─────────
  // 0 愚者: 崖の縁に立てた旅の荷物と足あと、風に乗る羽根、遠くの山と太陽
  function fool(b) {
    const cliff = b.polyD([[13, 111], [56, 104], [74, 107], [80, 116], [74, 127], [79, 141], [72, 157], [13, 157]], false, 0.4);
    const peaks = b.polyD([[13, 100], [22, 90], [28, 95], [38, 82], [48, 94], [56, 104]], false, 0.4);
    const wind = [[118, 80, 107], [128, 84, 107], [139, 80, 104], [149, 78, 107]].map(([y, x0, x1]) => spline([[x0, y], [x0 + 7, y - 2.4], [x0 + 14, y + 1.6], [x1, y - 1]])).join(' ');
    return `${sun(b, 90, 50, 10)}
      ${b.hatch(`${peaks} L56,112 L13,112 Z`, 'c2-ln', 45, 2.3, [12, 80, 58, 112])}${el(peaks, 'ink fine')}
      ${el(wind, 'c2-ln heavy')}${feather(b, 86, 104, 24)}${feather(b, 96, 132, 62, 0.6)}
      ${el(`${cliff} Z`, 'body')}${b.lines([[62, 114, 74, 112], [58, 124, 70, 123], [62, 134, 74, 133], [56, 145, 72, 145]])}
      ${blk([[22, 122], [28, 118], [35, 117], [41, 113], [48, 112.4]].map(([x, y]) => `M${x},${y} a2.2,1.1 -12 1 0 4.4,-0.9 a2.2,1.1 -12 1 0 -4.4,0.9`).join(' '))}
      <path class="rod" style="stroke-width:2.8" d="M56,105 L74,60"/><path class="rod-in" style="stroke-width:1.4" d="M56,105 L74,60"/>
      ${b.tinted('M70,60 L66.4,54.6 L72,56.6 Z M76,57.4 L79.6,52 L80.4,58.4 Z', 'c1', 'ink fine')}
      ${b.tinted(b.curveD([[67, 62], [70, 58.4], [76, 57.6], [81.6, 61], [83, 68], [79, 74.4], [72, 75.4], [67, 70.6]], true, 0.4), 'c1', 'ink', 2)}
      ${blk([[71, 64], [76, 62.6], [79, 67], [74, 68.4], [72.4, 72], [77.6, 71.6]].map(([x, y]) => dot(x, y, 0.7)).join(' '))}
      ${b.floret(30, 106, 5, 3.6)}${b.dashes([[18, 134, 12], [34, 142, 10], [20, 150, 14], [44, 130, 8]])}
      ${el('M30,42 q3,-3 6,0 q3,-3 6,0 M48,52 q2.4,-2.4 4.8,0 q2.4,-2.4 4.8,0', 'ink fine')}`;
  }

  // 1 魔術師: 机に並ぶ杯・剣・金貨と、その上に掲げた杖。頭上に無限の輪と花綱
  function magician(b) {
    const drape = 'M24,118 L24,130 Q33,136.6 42,130 Q51,136.6 60,130 Q69,136.6 78,130 Q87,136.6 96,130 L96,118 Z';
    const garland = [[14, 54], [30, 40], [60, 35], [90, 40], [106, 54]];
    const leaves = [[20, 48, -160], [22, 47, -40], [42, 37.4, -150], [46, 36.6, -20], [74, 36.6, -160], [78, 37.4, -30], [98, 47, -140], [100, 48, -20]].map(([x, y, r]) => b.leaf(x, y, r, 0.9, 'c2 wash')).join('');
    return `${b.curve(garland, 'ink fine')}${leaves}${b.floret(30, 40, 5, 4.4)}${b.floret(60, 35, 5, 4.4)}${b.floret(90, 40, 5, 4.4)}
      ${b.rays(60, 58, 20, 25, 14, 'ink hair', 0.2, 22.5)}${at(60, 58, `${el(LEMNISCATE, 'ko')}${el(LEMNISCATE, 'ink bold')}`)}
      ${staff(b, 60, 92, 0.86)}
      ${b.hatch(drape, 'c2-ln', 90, 2.2, [22, 116, 98, 138])}${el(drape, 'ink')}
      ${b.poly(rect(20, 112, 100, 118), 'body', true)}${b.poly(rect(26, 133, 31, 152), 'body', true)}${b.poly(rect(89, 133, 94, 152), 'body', true)}
      ${cup(b, 29, 101, 0.82)}${coin(b, 91, 104, 0.8)}${at(57, 109.4, sword(b, 0, 0, 30, 0.62), 90)}
      ${b.line(13, 152, 107, 152)}${b.dashes([[38, 155.4, 12], [66, 155.4, 14]])}`;
  }

  // 2 女教皇: 黒と白の二本の柱、その間に掛かる帳、台に置いた書物、頭上に三相の月
  function priestess(b) {
    const veil = 'M33,52 H87 V108 Q80.2,116 73.5,108 Q66.8,116 60,108 Q53.2,116 46.5,108 Q39.8,116 33,108 Z';
    const fruits = [[42, 64], [60, 60], [78, 64], [51, 80], [69, 80], [42, 96], [60, 96], [78, 96]];
    const pillar = (x, cls) => `${b.poly(rect(x - 6, 52, x + 6, 141), cls, true)}${b.poly(rect(x - 8.4, 46, x + 8.4, 52), 'body', true)}${b.poly(rect(x - 8.4, 141, x + 8.4, 147), 'body', true)}`;
    const moon = 'M-8.4,-5.4 A6,6 0 1 0 -8.4,5.4 A4.6,4.6 0 1 1 -8.4,-5.4 Z';
    return `${b.hatch(veil, 'c2-ln', 0, 2.3, [32, 50, 88, 116])}${el(veil, 'ink')}
      ${fruits.map(([x, y]) => `${b.tinted(b.circleD(x, y, 3.6, 0.2), 'c1', 'ink fine', 1.6)}<path class="ink hair" d="M${x - 1.2},${y - 3.4} L${x},${y - 5} L${x + 1.2},${y - 3.4}"/>`).join('')}
      ${el('M20,52 H32 V141 H20 Z', 'blk')}<path class="rod-in" style="stroke-width:0.8" d="M23.4,56 V137"/>${b.poly(rect(17.6, 46, 34.4, 52), 'body', true)}${b.poly(rect(17.6, 141, 34.4, 147), 'body', true)}
      ${pillar(94, 'body')}${b.lines([[91, 56, 91, 137], [97, 56, 97, 137]])}
      ${at(60, 39, `${b.tinted(b.circleD(0, 0, 5, 0.2), 'c1', 'ink')}<g transform="translate(-21 0)">${C1(moon)}${el(moon, 'ink fine')}</g><g transform="translate(21 0) scale(-1 1)">${C1(moon)}${el(moon, 'ink fine')}</g>`)}
      ${b.poly(rect(47, 128, 73, 147), 'body', true)}${b.lines([[51, 132, 51, 147], [69, 132, 69, 147]])}
      ${b.tinted(b.polyD(rect(44, 119, 76, 128), true, 0.3), 'c2', 'ink', 1.6)}<path class="rod-in" style="stroke-width:1.5" d="M46,125.4 H74"/><path class="ink hair" d="M46,124 H74"/>
      ${b.line(13, 147, 107, 147)}${b.waves([[152, 0], [156.4, 4]], 'c2-ln heavy', 20, 100)}`;
  }

  // 3 女帝: 葉の環に包まれた柘榴、弧を描く星、足元に実る麦
  function empress(b) {
    const wreath = Array.from({ length: 18 }, (_, i) => {
      const a = i * 20, r = (a * Math.PI) / 180;
      return b.leaf(60 + Math.cos(r) * 27, 88 + Math.sin(r) * 27, a + (i % 2 ? 58 : 122), 1.05, 'c2 wash');
    }).join('');
    const arc = Array.from({ length: 7 }, (_, i) => { const a = ((208 + i * 20.6) * Math.PI) / 180; return [60 + Math.cos(a) * 43, 90 + Math.sin(a) * 43]; });
    const wheat = [[18, 132], [32, 124], [46, 130], [60, 122], [74, 130], [88, 124], [102, 132]].map(([x, y]) => {
      const ear = [0, 5.4, 10.8].map((dy) => b.leaf(x, y + dy, -62, 0.62, 'c1') + b.leaf(x, y + dy, -118, 0.62, 'c1')).join('');
      return `${b.line(x, 157, x, y - 2, 'ink fine')}${ear}${at(x, y - 3, `${C1('M0,0 C-1.6,-2 -1.4,-5 0,-6.4 C1.4,-5 1.6,-2 0,0 Z')}${el('M0,0 C-1.6,-2 -1.4,-5 0,-6.4 C1.4,-5 1.6,-2 0,0 Z', 'ink hair')}`)}`;
    }).join('');
    const calyx = 'M55.4,76.6 L56.6,71 L60,75 L63.4,71 L64.6,76.6 Z';
    return `${stars(arc, 3.6)}${b.circle(60, 88, 27, 'ink fine')}${wreath}
      ${b.tinted(b.circleD(60, 89, 13.5), 'c1', 'ink', 2)}${b.tinted(calyx, 'c1', 'ink fine')}
      ${b.ellipse(60, 91, 6.2, 8.4, 'body fine')}${blk([[60, 85.6], [57.4, 89], [62.6, 89], [60, 92.4], [57.6, 95.6], [62.4, 95.6]].map(([x, y]) => dot(x, y, 1)).join(' '))}
      ${wheat}${b.dashes([[14, 154, 8], [38, 152, 8], [64, 153, 9], [92, 152, 8]])}`;
  }

  // 4 皇帝: 山並みを背にした玉座。背板に王冠と交差する笏、座面に宝珠、足元は市松の床
  function emperor(b) {
    const range = b.polyD([[13, 96], [21, 82], [27, 89], [36, 72], [45, 88], [60, 96], [75, 88], [84, 72], [93, 89], [99, 80], [107, 96]], false, 0.4);
    const back = 'M36,124 V52 Q60,39 84,52 V124', panel = 'M41.5,124 V56.5 Q60,46.5 78.5,56.5 V124 Z';
    const spiral = (cx, dir) => spline(Array.from({ length: 15 }, (_, i) => {
      const t = i / 14, a = Math.PI / 2 + t * Math.PI * 3.1, r = 6.6 * (1 - t * 0.84);
      return [cx - dir * Math.cos(a) * r, 45.4 + Math.sin(a) * r];
    }));
    const sceptre = (x1, y1, x2, y2) => `<path class="rod" style="stroke-width:3.4" d="M${x1},${y1} L${x2},${y2}"/><path class="rod-in" style="stroke-width:1.9" d="M${x1},${y1} L${x2},${y2}"/>${b.tinted(b.circleD(x2, y2, 3, 0.2), 'c1', 'ink fine')}${blk(dot(x1, y1, 1.6))}`;
    const tiles = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) tiles.push(`M${f(13 + c * 11.75)},${r ? 148 : 140} h11.75 v${r ? 9 : 8} h-11.75 Z`);
    const studs = [45.5, 55.2, 64.8, 74.5].map((x) => `M${x},115.2 l2.1,2.1 l-2.1,2.1 l-2.1,-2.1 Z`).join(' ');
    const arm = (x) => `${b.poly([[x - 4.2, 124], [x - 4.2, 99.5], [x + 4.2, 99.5], [x + 4.2, 124]], 'body')}${b.circle(x, 97, 3.7, 'body')}${blk(dot(x, 97, 1))}`;
    return `${b.hatch(`${range} L107,100 L13,100 Z`, 'c2-ln', 45, 2.2, [12, 64, 108, 100])}${el(range, 'ink fine')}${b.line(13, 96.4, 107, 96.4, 'ink fine')}
      ${b.dashes([[16, 106, 9], [20, 117, 7], [15, 127, 8], [95, 105, 9], [93, 116, 7], [97, 127, 8]])}
      ${el(back, 'body bold')}${b.hatch(panel, 'c2-ln', 90, 2.2, [40, 44, 80, 126])}${el(panel, 'ink fine')}
      ${el(spiral(36, -1), 'ink')}${el(spiral(84, 1), 'ink')}
      ${sceptre(43, 110, 74, 77)}${sceptre(77, 110, 46, 77)}${crown(b, 60, 71, 25)}
      <circle class="ko" cx="60" cy="100" r="10.6"/>${b.tinted(b.circleD(60, 100, 9), 'c1', 'ink')}
      <path class="ink fine" d="M51.2,100 Q60,103.4 68.8,100 M60,91 Q62.4,95.6 60,101.6"/><path class="body fine" d="M60,86.2 l2.3,2.4 l-2.3,2.4 l-2.3,-2.4 Z"/>
      ${b.poly([[38, 124], [38, 109.5], [82, 109.5], [82, 124]], 'body')}${C1(studs)}${el(studs, 'ink hair')}${arm(34)}${arm(86)}
      ${b.poly(rect(26, 124, 94, 132), 'body', true)}${b.poly(rect(19, 132, 101, 140), 'body', true)}${b.lines([[29, 128, 91, 128], [22, 136, 98, 136]])}
      ${b.clip('M13,140 H107 V157 H13 Z', C2(tiles.join(' ')))}${b.line(13, 140, 107, 140)}${b.line(13, 148, 107, 148, 'ink hair')}`;
  }

  // 5 教皇: 壁龕の下に三重冠と、交差する金と銀の鍵
  function hierophant(b) {
    const arch = 'M22,150 V76 A38,38 0 0 1 98,76 V150', lunette = 'M24,76 A36,36 0 0 1 96,76 Z';
    const tiara = 'M50.4,71 C49,58 54,48 60,46 C66,48 71,58 69.6,71 Z';
    const key = (fill) => `<path class="rod" style="stroke-width:3.4" d="M0,-6 L0,-56"/><path class="rod-in" style="stroke-width:1.9" d="M0,-6 L0,-56"/>
      ${b.tinted('M0,-57 h8 v4.4 h-3.4 v3 h3.4 v4.4 h-8 Z', fill, 'ink fine')}${b.tinted(b.circleD(0, 0, 6.4, 0.2), fill, 'ink')}<circle class="ko" cx="0" cy="0" r="3"/>${b.circle(0, 0, 3, 'ink fine')}`;
    return `${b.hatch(lunette, 'c2-ln', 45, 2.4, [22, 38, 98, 78])}${el(arch, 'ink bold')}${b.line(24, 76, 96, 76, 'ink fine')}
      ${b.poly(rect(15, 150, 105, 156.4), 'body', true)}${b.lines([[30, 84, 30, 150], [90, 84, 90, 150]])}
      ${at(40, 132, key('c1'), 41)}${at(80, 132, key('lite'), -41, -1, 1)}
      <path class="ko" style="stroke-width:2.4" d="${tiara}"/>${b.tinted(tiara, 'c1', 'ink')}<path class="ink fine" d="M52.4,54.6 Q60,57.4 67.6,54.6 M50.8,60.6 Q60,63.6 69.2,60.6 M50.2,66.6 Q60,69.6 69.8,66.6"/>
      ${blk(dot(60, 43.4, 2))}${b.poly(rect(48.6, 70.4, 71.4, 74.6), 'body fine', true)}
      <path class="body fine" d="M50,74.6 L47,88 L52,86.6 L53.6,74.6 Z M70,74.6 L73,88 L68,86.6 L66.4,74.6 Z"/>`;
  }

  // 6 恋人: 枝を寄せ合う二本の木の下で組み合う二つの輪。頭上に太陽、足元で道が分かれる
  function lovers(b) {
    const tree = (dir) => {
      const X = (x) => 60 + dir * x;
      const trunk = [[36, 152], [35, 128], [31, 104], [22, 84], [8, 70]].map(([x, y]) => [X(x), y]);
      const leaves = [[33, 112, 200], [30, 100, 150], [27, 92, 210], [22, 84, 140], [17, 78, 215], [12, 73, 150], [6, 70, 225], [26, 86, 300], [16, 74, 320], [34, 120, 160]]
        .map(([x, y, r]) => b.leaf(X(x), y, dir > 0 ? r : 180 - r, 1.15, 'c2 wash')).join('');
      return `${b.curve(trunk, 'ink bold')}${b.curve([[34, 118], [40, 108], [42, 98]].map(([x, y]) => [X(x), y]), 'ink')}${b.leaf(X(42), 98, dir > 0 ? 250 : -70, 1.1, 'c2 wash')}${b.leaf(X(41), 104, dir > 0 ? 320 : -140, 1, 'c2 wash')}${leaves}`;
    };
    const ring = (cx) => `<circle class="rod" style="stroke-width:4.6" cx="${cx}" cy="108" r="13"/><circle class="c1-ln" style="stroke-width:3;opacity:1" cx="${cx}" cy="108" r="13"/>`;
    const arcD = 'M57.6,95.2 A13,13 0 0 1 64.3,103.6';
    return `${sun(b, 60, 49, 9)}${tree(-1)}${tree(1)}
      ${ring(51)}${ring(69)}<path class="rod" style="stroke-width:4.6" d="${arcD}"/><path class="c1-ln" style="stroke-width:3;opacity:1" d="${arcD}"/>
      ${b.curve([[13, 141], [34, 138.6], [60, 140], [86, 138.6], [107, 141]])}
      <path class="ink fine" d="M55,157 C55,149 46,144 30,142.4 M65,157 C65,149 74,144 90,142.4 M60,152 C59,147.6 52,145 44,144 M60,152 C61,147.6 68,145 76,144"/>
      ${b.dashes([[16, 150, 10], [94, 150, 10]])}`;
  }

  // 7 戦車: 星空の下を右へ駆ける車。大きな車輪、前へ伸びる轅と手綱、道の脇を流れる川
  function chariot(b) {
    const car = 'M24,97 H66 C73,99 76,106 73,114 H24 Z', canopy = 'M19,74 Q47,58 77,74 L77,79 Q47,65 19,79 Z';
    const moon = 'M4,-7.4 A8,8 0 1 0 4,7.4 A6,6 0 1 1 4,-7.4 Z';
    const spokes = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 + 0.2; return [46 + Math.cos(a) * 3.6, 123 + Math.sin(a) * 3.6, 46 + Math.cos(a) * 14, 123 + Math.sin(a) * 14]; });
    return `${stars([[20, 42], [36, 50], [54, 40], [72, 50], [100, 40], [102, 70], [88, 84]])}${at(90, 56, `<circle class="ko" cx="0" cy="0" r="9.6"/>${C1(moon)}${el(moon, 'ink fine')}`)}
      <path class="rod" style="stroke-width:3" d="M72,110 L107,103"/><path class="rod-in" style="stroke-width:1.6" d="M72,110 L107,103"/>
      <path class="ink hair" d="M66,92 C80,94 94,92 107,87 M66,95 C80,98 94,97 107,93"/>
      ${b.lines([[29, 97, 29, 77], [63, 97, 63, 76]], 'ink')}
      ${b.tinted(canopy, 'c1', 'ink', 2)}${el([24, 31, 38, 45, 52, 59, 66, 72].map((x) => `M${x},${f(79 - (1 - ((x - 48) / 29) ** 2) * 7)} v3.4`).join(' '), 'ink fine')}
      ${b.tinted(car, 'c2', 'ink', 2)}<path class="rod-in" style="stroke-width:1.2" d="M28,101 H64 C68,102.4 70,106 69,110"/>${C1(star4D(47, 106, 3.8))}
      <circle class="ko" cx="46" cy="123" r="18.6"/>${b.circle(46, 123, 17, 'body bold')}${b.circle(46, 123, 14, 'ink fine')}${b.lines(spokes, 'ink fine', 0.15)}${b.tinted(b.circleD(46, 123, 3.6, 0.2), 'c1', 'ink')}
      ${b.line(13, 140.4, 107, 140.4)}${b.dashes([[14, 128, 9], [17, 134, 11], [15, 121, 6], [68, 136, 8], [84, 135, 10]])}
      ${b.waves([[147, 0], [152, 4], [156.6, 0]], 'c2-ln heavy')}`;
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

  // 9 隠者: 夜の山の頂へ向かう道と、杖の先に下げた星の灯り
  function hermit(b) {
    const peak = b.polyD([[13, 142], [32, 114], [43, 122], [62, 88], [79, 110], [89, 102], [107, 130]], false, 0.5);
    const body = 'M51,69 L69,69 L71.4,88 L48.6,88 Z';
    return `${b.hatch(`${peak} L107,31 L13,31 Z`, 'c2-ln', 0, 2.3, [12, 30, 108, 132])}
      ${stars([[24, 44], [38, 58], [86, 42], [98, 64], [78, 68], [20, 76]], 2.8)}
      ${el(`${peak} L107,157 L13,157 Z`, 'body')}<path class="ink hair" d="M56,98 L60,104 L64,99 L67.6,105 M28,120 L32,124 L35,120 M85,108 L89,113 L92,108"/>
      <path class="ink fine" style="stroke-dasharray:2.4 2.4" d="M30,156 C40,150 58,148 62,140 C66,132 48,130 52,122 C55,116 62,114 62,106"/>
      <path class="rod" style="stroke-width:3" d="M36,152 L45,52"/><path class="rod-in" style="stroke-width:1.6" d="M36,152 L45,52"/><path class="ink" d="M45,52 C46,45 56,45 60,51 L60,60"/>
      <circle class="ko" cx="60" cy="78" r="15.6"/>${b.rays(60, 78, 16.6, 24, 16, 'ink hair', 0.2, 20.6)}
      ${b.tinted(body, 'lite', 'ink', 0)}${C1(starD(60, 78.6, 6.4, 6, 0.56))}${el(starD(60, 78.6, 6.4, 6, 0.56), 'ink hair')}
      ${blk('M49.6,69 L60,61.4 L70.4,69 Z M48,88 H72 V91 H48 Z')}${b.circle(60, 60.4, 1.6, 'body fine')}`;
  }

  // 10 運命の輪: 八本の輻を持つ輪。上に戴く冠と下に落ちた冠、四隅に四大元素の記号
  function wheel(b) {
    const spokes = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return [60 + Math.cos(a) * 10, 94 + Math.sin(a) * 10, 60 + Math.cos(a) * 25.4, 94 + Math.sin(a) * 25.4]; });
    const studs = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 + Math.PI / 8; return dot(60 + Math.cos(a) * 28.4, 94 + Math.sin(a) * 28.4, 1.5); }).join(' ');
    const arrow = (a0, a1) => {
      const P = (deg, r = 36.4) => [60 + Math.cos((deg * Math.PI) / 180) * r, 94 + Math.sin((deg * Math.PI) / 180) * r];
      const pts = Array.from({ length: 7 }, (_, i) => P(a0 + ((a1 - a0) * i) / 6)), [hx, hy] = P(a1), [bx, by] = P(a1 - 7, 39.4), [cx, cy] = P(a1 - 7, 33.4);
      return `${el(spline(pts), 'ink fine')}${el(`M${f(hx)},${f(hy)} L${f(bx)},${f(by)} L${f(cx)},${f(cy)} Z`, 'blk')}`;
    };
    return `${element('fire', 22, 43, 11)}${element('water', 98, 43, 11)}${element('air', 22, 147, 11)}${element('earth', 98, 147, 11)}
      ${arrow(-148, -112)}${arrow(32, 68)}
      ${b.circle(60, 94, 31, 'body bold')}${b.circle(60, 94, 25.6, 'ink fine')}${C2(studs)}
      ${b.lines(spokes.filter((_, i) => i % 2 === 0), 'ink', 0.15)}${b.lines(spokes.filter((_, i) => i % 2), 'ink fine', 0.15)}
      ${b.circle(60, 94, 10, 'body')}${b.tinted(b.circleD(60, 94, 4.4, 0.2), 'c1', 'ink')}
      ${crown(b, 60, 56, 17)}${at(60, 132.6, crown(b, 0, 0, 17, 'c2'), 180)}`;
  }

  // ───────── 11〜21 ─────────
  // 11 正義: まっすぐ立てた剣を支柱にした天秤。背後に二本の柱と帳
  function justice(b) {
    const veil = 'M23,36 H97 V88 Q89.6,96 82.2,88 Q74.8,96 67.4,88 Q60,96 52.6,88 Q45.2,96 37.8,88 Q30.4,96 23,88 Z';
    const pan = (x) => { const d = `M${x - 10.4},100 H${x + 10.4} C${x + 10.4},108 ${x + 5.4},112.4 ${x},112.4 C${x - 5.4},112.4 ${x - 10.4},108 ${x - 10.4},100 Z`; return `${b.lines([[x, 70, x - 9.6, 100], [x, 70, x, 100], [x, 70, x + 9.6, 100]], 'ink fine', 0.15)}${b.tinted(d, 'c1', 'ink', 2)}`; };
    const post = (x) => `${b.poly(rect(x - 3, 40, x + 3, 152), 'body', true)}${b.circle(x, 36.6, 3.4, 'body')}`;
    return `${b.hatch(veil, 'c2-ln', 90, 2.3, [22, 34, 98, 98])}${el(veil, 'ink fine')}${post(20)}${post(100)}
      <path class="ko" style="stroke-width:12" d="M60,46 L60,126"/>${sword(b, 60, 128, 86)}
      <path class="ko" style="stroke-width:5" d="M28,70 Q60,62 92,70"/><path class="ink bold" d="M28,70 Q60,62 92,70"/>${b.tinted(b.circleD(60, 66, 3.6, 0.2), 'c1', 'ink')}
      ${pan(28)}${pan(92)}${b.line(13, 152, 107, 152)}${b.dashes([[30, 155.6, 12], [78, 155.6, 12]])}`;
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

  // 13 死神: 立てかけた大鎌、川の向こうに昇る太陽、足元に白い花と落ちた冠
  function death(b) {
    const blade = 'M70,40 C52,35 33,43 21,62 C36,52.4 52,48.4 68,47.4 Z', half = 'M72,104 A12,12 0 0 1 96,104 Z';
    const rays = Array.from({ length: 7 }, (_, i) => { const a = Math.PI + ((i + 0.5) * Math.PI) / 7; return [84 + Math.cos(a) * 15, 104 + Math.sin(a) * 15, 84 + Math.cos(a) * (i % 2 ? 19 : 22), 104 + Math.sin(a) * (i % 2 ? 19 : 22)]; });
    const tiny = (x) => b.poly([[x - 2.4, 104], [x - 2.4, 93], [x - 3.4, 93], [x - 3.4, 90.6], [x + 3.4, 90.6], [x + 3.4, 93], [x + 2.4, 93], [x + 2.4, 104]], 'body fine');
    return `${b.lines(rays, 'ink fine', 0.2)}${b.tinted(half, 'c1', 'ink')}${tiny(68)}${tiny(100)}${b.line(13, 104, 107, 104)}
      ${b.waves([[113, 0], [118, 4], [123, 0]], 'c2-ln heavy')}${b.line(13, 108.6, 107, 108.6, 'ink fine')}${b.line(13, 127, 107, 127, 'ink fine')}
      ${b.dashes([[16, 134, 10], [70, 133, 9], [20, 150, 12], [62, 152, 10], [94, 151, 9]])}
      <path class="ink fine" d="M88,150 C88,144 89,140 90,137"/>${b.leaf(88.4, 146, -150, 1, 'c2 wash')}${b.leaf(88.8, 143, -30, 1, 'c2 wash')}<circle class="ko" cx="90" cy="134" r="7"/>${b.floret(90, 134, 5, 6.6, 'lite')}
      ${at(52, 146, crown(b, 0, 0, 15), -24)}
      <path class="ko" style="stroke-width:5.4" d="M31,152 L70,41"/><path class="rod" style="stroke-width:3.2" d="M31,152 L70,41"/><path class="rod-in" style="stroke-width:1.7" d="M31,152 L70,41"/>
      ${b.tinted(blade, 'lite', 'ink bold', 2)}<path class="ink hair" d="M66,44 C52,42 38,48 27,58"/>`;
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

  // 15 悪魔: 角のある逆さ星の紋と、黒い台座から足元へゆるく垂れる二本の鎖
  function devil(b) {
    const horn = 'M46.6,58 C32,56 24,42 37,28 C32.6,40 40,47.6 54,49.6 Z', star = starD(60, 64, 10.4, 5, 0.42, 90);
    const chain = (dir) => {
      const X = (x) => 60 + dir * x, pts = [[5, 131.6], [11, 135.6], [17.6, 138.6], [24.4, 140.6], [31, 141.6]];
      const links = pts.map(([x, y], i) => `<ellipse class="body fine" cx="${X(x)}" cy="${y}" rx="3" ry="1.9" transform="rotate(${dir * (36 - i * 7)} ${X(x)} ${y})"/>`).join('');
      return `${links}<path class="ink bold" d="M${X(33)},${137} A6.4,6.4 0 1 ${dir > 0 ? 1 : 0} ${X(43)},${146}"/>`;
    };
    return `${b.hatch('M13,31 H107 V98 H13 Z', 'c2-ln', 45, 2.6)}${b.hatch('M13,31 H107 V98 H13 Z', 'c2-ln', -45, 2.6)}
      <path class="ko" style="stroke-width:3" d="${horn}"/><g transform="translate(120 0) scale(-1 1)"><path class="ko" style="stroke-width:3" d="${horn}"/></g>
      ${el(horn, 'body')}<g transform="translate(120 0) scale(-1 1)">${el(horn, 'body')}</g><path class="ink hair" d="M32,44 C36,50 42,53 49,54 M88,44 C84,50 78,53 71,54"/>
      <circle class="ko" cx="60" cy="64" r="16.4"/>${b.circle(60, 64, 14.6, 'body bold')}${C1(star)}${el(star, 'ink fine')}
      ${b.line(13, 98, 107, 98, 'ink fine')}
      ${el('M42,104 H78 L80.6,128 H39.4 Z', 'blk')}${b.poly([[44.6, 99.6], [75.4, 99.6], [78, 104], [42, 104]], 'body', true)}
      <path class="rod-in" style="stroke-width:0.8" d="M44,108 H76 M43.4,124 H76.6"/>${b.circle(60, 129.6, 3.6, 'body')}
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
