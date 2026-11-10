// 小アルカナの絵柄。数札はスートごとの組み方で並べ、コートカードは盾の紋章として描く。
const ArtMinor = (() => {
  const { f, el, at, plate, spline, DROP, starD, star4D } = ArtKit;
  const C1 = (d) => plate(el(d, 'c1'));

  // ───────── スートの紋 ─────────
  const CUP_BOWL = 'M-9.4,-9 C-9.4,-0.5 -5.6,4.4 0,4.4 C5.6,4.4 9.4,-0.5 9.4,-9 Z';
  const CUP_WINE = 'M-8.4,-3.4 C-7.4,1.2 -4.4,3.6 0,3.6 C4.4,3.6 7.4,1.2 8.4,-3.4 Q0,-1.2 -8.4,-3.4 Z';
  const CUP_FOOT = 'M-1.4,9.6 C-1.8,11.8 -4.6,13 -8,13.4 L-8,14.8 L8,14.8 L8,13.4 C4.6,13 1.8,11.8 1.4,9.6 Z';
  // 杯。上下の中心が (x, y) に来る
  const cup = (b, x, y, sc) => at(x, y - 1.5 * sc, `
    ${el(CUP_BOWL, 'body')}${C1(CUP_WINE)}<path class="ink fine" d="M-8.6,-3.4 Q0,-1.2 8.6,-3.4"/>
    ${b.ellipse(0, -9, 9.4, 2.7, 'body')}${plate('<ellipse class="c1" cx="0" cy="-8.8" rx="6.6" ry="1.4"/>')}
    <path class="body fine" d="M-1.5,4.2 L-1.5,6 L1.5,6 L1.5,4.2"/>${b.circle(0, 7.6, 2.3, 'body')}
    ${el(CUP_FOOT, 'body')}<path class="ink hair" d="M-5.4,13.6 L5.4,13.6"/>`, 0, sc);
  const COIN_STAR = starD(0, 0, 6.3);
  const coin = (b, x, y, sc) => at(x, y, `${b.circle(0, 0, 9.6, 'body')}${b.circle(0, 0, 7.5, 'ink fine')}${C1(COIN_STAR)}${el(COIN_STAR, 'ink hair')}`, 0, sc);
  const GUARD = 'M-13,0 Q0,5 13,0 L13,3.8 Q0,8.8 -13,3.8 Z';
  // まっすぐな剣。切っ先が上で、(x, y) は鍔の位置。len は刃の長さ
  const sword = (b, x, y, len, sc = 1) => at(x, y, `
    <path class="body" d="M0,${-len} L3.7,${-len + 9} L3.7,0.6 L-3.7,0.6 L-3.7,${-len + 9} Z"/>
    ${b.line(0, -len + 10, 0, -2, 'ink hair')}
    ${b.tinted(GUARD, 'c1', 'ink', 2)}
    <path class="body fine" d="M-2.1,7.6 L2.1,7.6 L1.7,17 L-1.7,17 Z"/><path class="ink hair" d="M-1.9,10 L1.9,9.4 M-1.8,12.6 L1.8,12 M-1.7,15 L1.7,14.4"/>
    ${b.tinted(b.circleD(0, 20.4, 3.7, 0.2), 'c1', 'ink')}`, 0, sc);
  const BUD = 'M0,5 C-4.4,2.6 -4,-2.4 0,-5.2 C4,-2.4 4.4,2.6 0,5 Z';
  // 芽吹いた杖。上下の中心が (x, y) に来る
  const staff = (b, x, y, sc) => at(x, y, `
    <path class="body" d="M-2.2,-18 L2.2,-18 L1.8,20 L-1.8,20 Z"/><path class="ink hair" d="M-2,-8 L2,-8.8 M-1.9,3 L1.9,2.2 M-1.8,13 L1.8,12.2"/>
    ${leafOn(b, 2, -4, -42)}${leafOn(b, -2, 6, -138)}${at(0, -22, b.tinted(BUD, 'c1', 'ink fine', 2.2))}`, 0, sc);
  const leafOn = (b, x, y, rot, sc = 1) => `${at(x, y, `<path class="ko" style="stroke-width:2.2" d="${ArtKit.LEAF}"/>`, rot, sc)}${b.leaf(x, y, rot, sc)}`;

  // ───────── カップ・ペンタクル（2 列と中央の列に並べる）─────────
  // sc=紋の大きさ side=左右の列の y centre=中央の列の y
  const GRID = {
    2: { sc: 1.45, side: [96], centre: [] },
    3: { sc: 1.3, side: [66], centre: [126] },
    4: { sc: 1.25, side: [64, 128], centre: [] },
    5: { sc: 1.1, side: [58, 134], centre: [96] },
    6: { sc: 1.1, side: [58, 96, 134], centre: [] },
    7: { sc: 0.95, side: [54, 96, 138], centre: [96] },
    8: { sc: 0.88, side: [50, 79, 108, 137], centre: [] },
    9: { sc: 0.88, side: [50, 79, 108, 137], centre: [93.5] },
    10: { sc: 0.84, side: [50, 79, 108, 137], centre: [64.5, 122.5] },
  };
  function grid(n, b, glyph, stem) {
    const g = GRID[n];
    const blocked = (y, pad) => g.centre.some((c) => Math.abs(y - c) < 16 * g.sc + pad);
    return `${stem(b, blocked)}${g.side.map((y) => glyph(b, 34, y, g.sc) + glyph(b, 86, y, g.sc)).join('')}${g.centre.map((y) => glyph(b, 60, y, g.sc)).join('')}`;
  }
  // カップの列の間を通る蔓草。中央の杯に掛からない所に葉と花を付ける
  function vine(b, blocked) {
    const pts = Array.from({ length: 10 }, (_, i) => [i === 0 || i === 9 ? 60 : 60 + (i % 2 ? 2.4 : -2.4), 152 - i * 12.44]);
    const flower = !blocked(96, 9);
    const leaves = pts.slice(1, 9).filter(([, y]) => !blocked(y, 2) && !(flower && Math.abs(y - 96) < 13))
      .map(([x, y]) => b.leaf(x, y, x > 60 ? -28 : -152)).join('');
    const bud = (y, dir) => at(60, y, `${C1(BUD)}${el(BUD, 'ink fine')}`, 0, 0.8, 0.8 * dir);
    return `${b.curve(pts)}${leaves}${bud(38, 1)}${bud(154, -1)}${flower ? `<circle class="ko" cx="60" cy="96" r="9"/>${b.floret(60, 96, 6, 8)}` : ''}`;
  }
  // ペンタクルの列の間を通るまっすぐな茎。葉は左右に対で付ける
  function stalk(b, blocked) {
    const centre = !blocked(96, 7);
    const leaves = [54, 68, 82, 110, 124, 138].filter((y) => !blocked(y, 0))
      .map((y) => b.leaf(60.6, y, -38, 0.9) + b.leaf(59.4, y, -142, 0.9)).join('');
    const gem = (y, r) => { const d = `M60,${y - r} L${60 + r * 0.72},${y} L60,${y + r} L${60 - r * 0.72},${y} Z`; return `${b.tinted(d, 'c1', 'ink fine', 2)}`; };
    return `${b.line(60, 42, 60, 150)}${leaves}${gem(40, 4)}${gem(152, 4)}${centre ? gem(96, 6.4) : ''}`;
  }
  function aceCup(b) {
    const drops = [-2, -1, 0, 1, 2].map((k) => at(60 + k * 11.5, 50 + Math.abs(k) * 4.2, `${C1(DROP)}${el(DROP, 'ink hair')}`, 0, 1.25)).join('');
    return `${b.waves([[148, 0], [153.5, 4]], 'c1-ln heavy', 24, 96)}${b.leaf(22, 132, -62, 1.2)}${b.leaf(22, 132, -112, 1.2)}${b.leaf(98, 132, -118, 1.2)}${b.leaf(98, 132, -68, 1.2)}
      ${drops}${cup(b, 60, 102, 2.75)}`;
  }
  function aceCoin(b) {
    const wreath = Array.from({ length: 18 }, (_, i) => {
      const a = (i * 20 + 10) * (Math.PI / 180), x = 60 + Math.cos(a) * 37.5, y = 96 + Math.sin(a) * 37.5;
      return b.leaf(x, y, i * 20 + 10 + (i % 2 ? 62 : 118), 1.05);
    }).join('');
    const stars = [[22, 44], [98, 44], [22, 148], [98, 148]].map(([x, y]) => `${C1(star4D(x, y, 3.6))}`).join('');
    return `${b.circle(60, 96, 37.5, 'ink fine')}${wreath}${stars}<circle class="ko" cx="60" cy="96" r="30"/>${coin(b, 60, 96, 2.85)}`;
  }

  // ───────── ワンド（斜めに組んだ格子。奇数は中央に 1 本）─────────
  function wands(n, b) {
    if (n === 1) return aceWand(b);
    const m = Math.floor(n / 2), gap = [0, 0, 10.5, 8.2, 7, 6][m], L = 55, thick = m <= 2 ? ' thick' : '';
    const rods = [[0.5, 0.866], [-0.5, 0.866]].map(([ux, uy]) => Array.from({ length: m }, (_, i) => {
      const off = (i - (m - 1) / 2) * gap, cx = 60 + uy * off, cy = 96 - ux * off;
      return { ux, uy, cx, cy, x1: cx - ux * L, y1: cy - uy * L, x2: cx + ux * L, y2: cy + uy * L };
    }));
    const seg = (r, t0, t1) => `M${f(r.cx + r.ux * t0)},${f(r.cy + r.uy * t0)} L${f(r.cx + r.ux * t1)},${f(r.cy + r.uy * t1)}`;
    const band = (d) => `${el(d, `rod${thick}`)}${el(d, `rod-in${thick}`)}`;
    const cap = (x, y) => b.tinted(b.circleD(x, y, thick ? 3.5 : 2.9, 0.2), 'c1', 'ink');
    // 右下がりの棒が上になる交差だけ描き直して、互い違いに編む
    const over = [];
    rods[0].forEach((a, i) => rods[1].forEach((c, k) => {
      if ((i + k) % 2) return;
      const t = ((c.cx - a.cx) * c.uy - (c.cy - a.cy) * c.ux) / (a.ux * c.uy - a.uy * c.ux);
      over.push(seg(a, t - 4.4, t + 4.4));
    }));
    const all = [...rods[0], ...rods[1]];
    const sprouts = all.filter((_, i) => m <= 2 || i % m === 0 || i % m === m - 1).map((r) => {
      const side = r.ux > 0 ? 1 : -1;
      return leafOn(b, r.x1 + r.ux * 10, r.y1 + r.uy * 10, side > 0 ? -70 : -110, 0.8) + leafOn(b, r.x2 - r.ux * 10, r.y2 - r.uy * 10, side > 0 ? 110 : 70, 0.8);
    }).join('');
    const centre = n % 2 ? `${band('M60,41 L60,151')}${cap(60, 41)}${cap(60, 151)}${leafOn(b, 61.6, 62, -40, 0.8)}${leafOn(b, 58.4, 130, 140, 0.8)}` : '';
    const florets = `${b.floret(25, 96, 4, 4.8)}${b.floret(95, 96, 4, 4.8)}${n % 2 === 0 && m <= 2 ? b.floret(60, 54, 4, 4.8) + b.floret(60, 138, 4, 4.8) : ''}`;
    return `${florets}${band(rods[0].map((r) => seg(r, -L, L)).join(' '))}${band(rods[1].map((r) => seg(r, -L, L)).join(' '))}${over.length ? band(over.join(' ')) : ''}
      ${sprouts}${all.map((r) => cap(r.x1, r.y1) + cap(r.x2, r.y2)).join('')}${centre}`;
  }
  function aceWand(b) {
    const staff = b.polyD([[55.6, 150], [56.4, 62], [63.6, 62], [64.6, 150]], true, 0.4);
    return `${b.rays(60, 52, 13, 24, 16, 'ink hair', 0, 19)}
      ${b.curve([[30, 151], [44, 148.6], [60, 150.4], [76, 148.6], [90, 151]])}${b.dashes([[22, 155, 10], [50, 155.6, 8], [70, 155.6, 9], [88, 155, 10]])}
      ${el(staff, 'body')}${b.lines([[56.2, 80, 64, 78.6], [56, 100, 64.2, 98.6], [55.9, 120, 64.3, 118.6], [55.8, 138, 64.4, 136.6]])}
      ${b.leaf(64, 74, -34, 1.7)}${b.leaf(56, 92, -146, 1.7)}${b.leaf(64.2, 112, -30, 1.5)}${b.leaf(55.9, 130, -150, 1.3)}
      ${at(60, 53, `${C1(BUD)}${el(BUD, 'ink')}<path class="ink hair" d="M0,3.6 C-1.4,1 -1.2,-1.6 0,-3.4"/>`, 0, 2.3)}`;
  }

  // ───────── ソード（弧を描く剣を左右から編む。奇数は中央にまっすぐな 1 本）─────────
  function swords(n, b) {
    if (n === 1) return aceSword(b);
    const pairs = Math.floor(n / 2);
    // 剣の端は 2 段に互い違いに並べ、交差が上下の端に集まるよう弧の腹を張らせる
    const arc = (i, side) => {
      const e = 4 + 2.6 * i + b.j(0.2), w = 36 - 6.5 * i + b.j(0.5), y0 = i % 2 ? 36 : 40;
      return Array.from({ length: 31 }, (_, k) => {
        const t = k / 30, x = 60 + e - (e + w) * Math.sin(Math.PI * t) ** 0.6;
        return [side < 0 ? x : 120 - x, y0 + (190 - 2 * y0) * t];
      });
    };
    const band = (d) => `${el(d, 'blade')}${el(d, 'blade-in')}`;
    const lefts = Array.from({ length: pairs }, (_, i) => arc(i, -1));
    const rights = Array.from({ length: pairs }, (_, i) => arc(i, 1));
    const ends = [...lefts, ...rights].flatMap((pts) => [pts[0], pts[30]])
      .map(([x, y]) => b.tinted(b.circleD(x, y < 100 ? y - 1.4 : y + 1.4, 2.3, 0.15), 'c1', 'ink fine')).join('');
    const sprig = (x, y, sx, sy) => at(x, y, `<path class="ink fine" d="M0,0 Q5,-1.5 9,-7"/>${b.leaf(3, -0.8, -70, 0.8)}${b.leaf(5.5, -2.6, 18, 0.8)}${b.leaf(9, -7, -48, 0.7)}`, 0, sx, sy);
    let florets = '';
    if (n % 2 && pairs <= 3) florets = b.floret(46.8, 95, 4, 4.4) + b.floret(73.2, 95, 4, 4.4);
    if (n % 2 === 0 && pairs <= 4) florets = b.floret(60, 95, 4, pairs <= 2 ? 6.4 : 4.8);
    // 下の交差は左の剣を上にして、上の交差と互い違いにする
    return `${sprig(22, 52, 1, 1)}${sprig(98, 52, -1, 1)}${sprig(22, 138, 1, -1)}${sprig(98, 138, -1, -1)}
      ${band(lefts.map((pts) => spline(pts)).join(' '))}${band(rights.map((pts) => spline(pts)).join(' '))}${band(lefts.map((pts) => spline(pts.slice(21))).join(' '))}
      ${ends}${florets}${n % 2 ? sword(b, 60, 124, 64) : ''}`;
  }
  function aceSword(b) {
    const wreath = Array.from({ length: 14 }, (_, i) => {
      const a = (i * 360) / 14, r = (a * Math.PI) / 180;
      return b.leaf(60 + Math.cos(r) * 19, 70 + Math.sin(r) * 19, a + (i % 2 ? 60 : 120), 1.1);
    }).join('');
    return `${b.rays(60, 70, 25, 31, 20, 'ink hair', 0.16, 28)}${b.circle(60, 70, 19, 'ink fine')}${wreath}
      <path class="ko" style="stroke-width:13" d="M60,46 L60,122"/>${sword(b, 60, 124, 86, 1.25)}
      ${b.dashes([[26, 152, 12], [44, 155, 9], [68, 155, 9], [84, 152, 12]])}`;
  }

  // ───────── コートカード ─────────
  const SHIELD = 'M39,76 H81 V101 C81,115 71,125.5 60,131.5 C49,125.5 39,115 39,101 Z';
  const SHIELD_INNER = 'M42,79 H78 V101 C78,113.4 69.4,122.6 60,128 C50.6,122.6 42,113.4 42,101 Z';
  // 盾の地。紋章学で色を線の向きで表す決まりにならい、スートごとに向きを変える
  const FIELD = { wands: [90], cups: [0], swords: [0, 90], pentacles: [45] };
  const CHARGE = {
    wands: (b) => `<path class="ko" style="stroke-width:8.6" d="M60,84 L60,123"/>${staff(b, 60, 104, 1)}`,
    cups: (b) => `${at(60, 99.5, `<path class="ko" style="stroke-width:3" d="${CUP_BOWL} ${CUP_FOOT} M0,-9 L0,13"/><ellipse class="ko" style="stroke-width:3" cx="0" cy="-9" rx="9.4" ry="2.7"/>`, 0, 1.45)}${cup(b, 60, 101.6, 1.45)}`,
    swords: (b) => `<path class="ko" style="stroke-width:11" d="M60,84 L60,122"/><path class="ko" style="stroke-width:6" d="M51,113 L69,113"/>${sword(b, 60, 110, 28, 0.72)}`,
    pentacles: (b) => `<circle class="ko" cx="60" cy="100" r="16.4"/>${coin(b, 60, 100, 1.45)}`,
  };
  const trefoil = (b, x, y) => `<path class="ink fine" d="M${x},${y} L${x},${y - 4.4}"/>${[[0, -7.4], [-2.6, -4.6], [2.6, -4.6]].map(([dx, dy]) => b.tinted(b.circleD(x + dx, y + dy, 2, 0.12), 'c1', 'ink fine')).join('')}`;
  const pearl = (x, y) => `<path class="ink fine" d="M${x},${y} L${x},${y - 3.6}"/><circle class="blk" cx="${x}" cy="${y - 4.8}" r="1.5"/>`;
  const BAND = 'M44.4,63 Q60,60.4 75.6,63 L75,68.6 Q60,66 45,68.6 Z';
  const gems = [50, 60, 70].map((x) => `M${x},63.4 l1.5,1.7 l-1.5,1.7 l-1.5,-1.7 Z`).join(' ');
  // 位ごとのかぶりもの。ペイジ=羽根付きの帽子 ナイト=兜 クイーン=小冠 キング=閉じた王冠
  const HEADGEAR = {
    11: (b) => {
      const dome = 'M48.6,68 C47.6,58 54,53 61,53.6 C68,54.2 72.4,60 71.4,68 Z', plume = 'M67,59.6 C71,50 79,44.6 87,43.6 C85.4,50.4 78.6,56.6 68.4,60.6 Z';
      return `${b.tinted(plume, 'lite', 'ink fine', 2)}<path class="ink hair" d="M68,60 C73,53 79,48 86,44.2 M74,54.6 L72.6,50.6 M78,51.4 L77,47.6 M76.4,55.6 L80.6,55 M80.4,52 L84,51"/>
        ${b.tinted(dome, 'c1', 'ink', 2)}<path class="body" d="M46.6,67.6 Q60,64.8 73.4,67.6 L73.2,71.6 Q60,68.8 46.8,71.6 Z"/>`;
    },
    12: (b) => {
      const plume = 'M60,51 C57.6,45 61.6,39.6 69,39.2 C66,41.8 65.4,45 66.6,47.6 C70,44.4 74.4,44.4 77.6,46.8 C72.4,47 68.6,49.8 66,53.4 Z';
      return `${b.tinted(plume, 'c1', 'ink fine', 2)}
        <path class="ko" style="stroke-width:2.4" d="M49.6,70.4 L49.6,61 C49.6,54 54.6,50.6 60,50.6 C65.4,50.6 70.4,54 70.4,61 L70.4,70.4 Z"/>
        <path class="body" d="M49.6,70.4 L49.6,61 C49.6,54 54.6,50.6 60,50.6 C65.4,50.6 70.4,54 70.4,61 L70.4,70.4 Z"/>
        <path class="blk" d="M52.2,60.6 H67.8 V63.2 H52.2 Z"/><path class="ink fine" d="M60,53 L60,70"/>
        <path class="blk" d="${[54.4, 56.8, 63.2, 65.6].map((x) => `M${x - 0.6},66.8 a0.6,0.6 0 1 0 1.2,0 a0.6,0.6 0 1 0 -1.2,0`).join(' ')}"/>
        <path class="body" d="M47.6,70 H72.4 L74,73.8 H46 Z"/>`;
    },
    13: (b) => `${trefoil(b, 46.5, 63)}${trefoil(b, 60, 62)}${trefoil(b, 73.5, 63)}${pearl(53.2, 62.8)}${pearl(66.8, 62.8)}${el(BAND, 'body')}${el(gems, 'c1')}`,
    14: (b) => {
      const crown = b.polyD([[46, 68], [44.2, 56.6], [50.6, 62.4], [54.6, 53.6], [60, 61.4], [65.4, 53.6], [69.4, 62.4], [75.8, 56.6], [74, 68]], true, 0.25);
      return `${b.tinted(crown, 'c1', 'ink', 2)}
        ${[[44.2, 55.4], [54.6, 52.2], [65.4, 52.2], [75.8, 55.4]].map(([x, y]) => `<circle class="blk" cx="${x}" cy="${y}" r="1.4"/>`).join('')}
        <path class="ink fine" d="M60,61.4 L60,52"/>${b.tinted(b.circleD(60, 49.6, 2.7, 0.15), 'c1', 'ink fine')}<path class="body fine" d="M60,42.6 l1.7,2.1 l-1.7,2.1 l-1.7,-2.1 Z"/>
        <path class="body" d="M44.4,67 Q60,64.4 75.6,67 L75,72.6 Q60,70 45,72.6 Z"/>${el([50, 60, 70].map((x) => `M${x},67.4 l1.5,1.7 l-1.5,1.7 l-1.5,-1.7 Z`).join(' '), 'c1')}`;
    },
  };
  const BOW = `<path class="body fine" d="M60,142 C55,137.6 50.6,139 51.6,142.4 C52.4,145 57,144.4 60,142 C63,144.4 67.6,145 68.4,142.4 C69.4,139 65,137.6 60,142 Z"/>
    <path class="ink fine" d="M59,143 L56.4,149.4 M61,143 L63.6,149.4"/><circle class="blk" cx="60" cy="142.2" r="1.3"/>`;
  // 盾の両脇から立ち上がる枝。tips=枝先に付けるもの
  const spray = (b, dir, tip) => {
    const X = (x) => 60 + dir * x;
    const stem = [[4, 143], [18, 139], [31, 124], [37, 104], [35, 84], [29, 68]].map(([x, y]) => [X(x), y]);
    const leaves = [[14, 141, -24], [14, 141, 46], [27, 130, -52], [27, 130, 14], [35, 113, -78], [35, 113, -10], [36.6, 94, -102], [36.6, 94, -34], [32.6, 76, -124], [32.6, 76, -58]]
      .map(([x, y, r]) => b.leaf(X(x), y, dir > 0 ? r : 180 - r, 0.92)).join('');
    return `${b.curve(stem)}${leaves}${tip(X(28), 63)}`;
  };
  // 位ごとのまわりの飾り。ペイジ=小枝と巻物 ナイト=交差する槍 クイーン=花の枝 キング=外套
  const SURROUND = {
    11: (b) => {
      const twig = (dir) => {
        const X = (x) => 60 + dir * x;
        return `${b.curve([[26, 130], [33, 118], [36, 104]].map(([x, y]) => [X(x), y]))}${[[30, 124, -40], [30, 124, 30], [35, 111, -72], [35, 111, -2], [36, 104, -96]].map(([x, y, r]) => b.leaf(X(x), y, dir > 0 ? r : 180 - r, 0.9)).join('')}`;
      };
      const scroll = 'M34,139 C43,134.6 52,142.6 60,139.6 C68,136.6 77,144.6 86,139.6 L86,147 C77,152 68,144 60,147 C52,150 43,142 34,146.4 Z';
      return `${twig(-1)}${twig(1)}${el(scroll, 'body')}<path class="ink hair" d="M34,139 L30,143.4 L34,146.4 M86,139.6 L90,143.6 L86,147 M42,141.6 L78,144.4"/>`;
    },
    12: (b) => {
      const lance = (dir) => {
        const X = (x) => 60 + dir * x, flag = `M${X(22.4)},56 L${X(38)},52 L${X(34.4)},58.6 L${X(39)},64.6 L${X(19.4)},62 Z`, head = `M${X(27)},46.4 L${X(28.6)},52.6 L${X(24.4)},54.2 Z`;
        return `${b.tinted(flag, 'c1', 'ink fine')}<path class="rod" style="stroke-width:2.8" d="M${X(-30)},150 L${X(25.4)},51"/><path class="rod-in" style="stroke-width:1.4" d="M${X(-30)},150 L${X(25.4)},51"/>${el(head, 'blk')}`;
      };
      return `${lance(-1)}${lance(1)}`;
    },
    13: (b) => `${spray(b, -1, (x, y) => b.floret(x, y, 5, 5.6))}${spray(b, 1, (x, y) => b.floret(x, y, 5, 5.6))}${BOW}`,
    14: (b) => {
      const mantle = 'M46,66 C34,67 27,75 24.6,91 L19,141 C31,147 45,149.6 60,149.6 C75,149.6 89,147 101,141 L95.4,91 C93,75 86,67 74,66 Z';
      const tails = [[30, 96], [27.6, 114], [33, 128], [37, 82], [42, 139], [53, 141], [90, 96], [92.4, 114], [87, 128], [83, 82], [78, 139], [67, 141]]
        .map(([x, y]) => `M${x},${y - 2.2} C${x + 1.5},${y - 0.4} ${x + 1.3},${y + 1.8} ${x},${y + 1.8} C${x - 1.3},${y + 1.8} ${x - 1.5},${y - 0.4} ${x},${y - 2.2} Z`).join(' ');
      const fringe = Array.from({ length: 19 }, (_, i) => { const x = 23 + i * 4.1, y = 149.4 - Math.abs(x - 60) * 0.19; return `M${f(x)},${f(y)} L${f(x - (x - 60) * 0.03)},${f(y + 3.4)}`; }).join(' ');
      return `${b.tinted(mantle, 'c1 wash', 'ink')}<path class="ink hair" d="M41,70 C33,86 30,114 31,144 M79,70 C87,86 90,114 89,144 M20,136 C32,141.6 45,144.2 60,144.2 C75,144.2 88,141.6 100,136"/>
        ${el(fringe, 'ink fine')}${el(tails, 'blk')}`;
    },
  };
  function court(suit, rank, b) {
    const field = FIELD[suit].map((angle) => b.hatch(SHIELD, 'c1-ln', angle, FIELD[suit].length > 1 ? 3 : 2.1, [38, 74, 82, 133])).join('');
    return `${SURROUND[rank](b)}
      <path class="ko" style="stroke-width:5" d="${SHIELD}"/>${field}${el(SHIELD, 'ink bold')}${el(SHIELD_INNER, 'ink hair')}
      ${CHARGE[suit](b)}
      ${HEADGEAR[rank](b)}`;
  }

  const SUIT = {
    wands,
    swords,
    cups: (n, b) => (n === 1 ? aceCup(b) : grid(n, b, cup, vine)),
    pentacles: (n, b) => (n === 1 ? aceCoin(b) : grid(n, b, coin, stalk)),
  };
  return { pips: (suit, rank, brush) => SUIT[suit](rank, brush), court, glyph: { staff, cup, sword, coin } };
})();
