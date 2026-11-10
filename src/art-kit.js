// カード絵柄を描く道具。座標はカード面（幅 120 × 高さ 200）で指定する。
// 線の class: ink=墨の線（bold / fine / hair で太さ） body=墨の線＋明るい紙色の面 blk=墨の面 lite=明るい紙色の面
//             ko=地色で下の線を消す c1 / c2=色の面（wash で淡く） c1-ln / c2-ln=色の線
const ArtKit = (() => {
  const f = (n) => String(Math.round(n * 10) / 10);
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const el = (d, cls) => `<path class="${cls}" d="${d}"/>`;
  // 位置・回転・拡大をまとめて指定する。拡大しても線の太さが変わらないよう、倍率の逆数を --k で渡す
  const at = (x, y, inner, rot = 0, sx = 1, sy = sx) => {
    const k = Math.abs(sx);
    return `<g transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${sx !== 1 || sy !== 1 ? ` scale(${sx} ${sy})` : ''}"${k !== 1 ? ` style="--k:${f(100 / k) / 100}"` : ''}>${inner}</g>`;
  };
  // 色の版。墨の版からわずかにずらして刷る
  const plate = (inner) => `<g class="plate">${inner}</g>`;
  const LEAF = 'M0,0 C2.6,-2.4 6.4,-2.6 9,0 C6.4,2.6 2.6,2.4 0,0 Z';
  const DROP = 'M0,-3 C1.9,-0.6 1.7,2.1 0,2.1 C-1.7,2.1 -1.9,-0.6 0,-3 Z';
  const star4D = (x, y, s) => `M${f(x)},${f(y - s)} L${f(x + s * 0.28)},${f(y - s * 0.28)} L${f(x + s)},${f(y)} L${f(x + s * 0.28)},${f(y + s * 0.28)} L${f(x)},${f(y + s)} L${f(x - s * 0.28)},${f(y + s * 0.28)} L${f(x - s)},${f(y)} L${f(x - s * 0.28)},${f(y - s * 0.28)} Z`;
  const starD = (x, y, r, n = 5, inner = 0.42, rot = -90) => `M${Array.from({ length: n * 2 }, (_, i) => {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? r * inner : r;
    return `${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)}`;
  }).join(' L')} Z`;

  // 点列を通る滑らかな曲線
  function spline(pts, closed = false) {
    const n = pts.length;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }

  // 札ごとの筆。手で引いたような揺らぎを付け、同じ札は毎回同じ線になる
  function makeBrush(seed, uid) {
    let s = seed >>> 0, clips = 0;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const AMP = 0.45;
    const j = (a = AMP) => (rnd() - 0.5) * 2 * a;

    // 形（path の d）
    const lineD = (x1, y1, x2, y2, a = AMP) => {
      const k = Math.min(a, Math.hypot(x2 - x1, y2 - y1) * 0.05);
      return `M${f(x1 + j(k))},${f(y1 + j(k))} Q${f((x1 + x2) / 2 + j(k * 1.5))},${f((y1 + y2) / 2 + j(k * 1.5))} ${f(x2 + j(k))},${f(y2 + j(k))}`;
    };
    const polyD = (pts, closed = false, a = 0.3) => {
      const v = pts.map(([x, y]) => [x + j(a * 0.6), y + j(a * 0.6)]);
      const n = v.length;
      let d = `M${f(v[0][0])},${f(v[0][1])}`;
      for (let i = 1; i < (closed ? n + 1 : n); i++) {
        const p = v[(i - 1) % n], q = v[i % n];
        d += ` Q${f((p[0] + q[0]) / 2 + j(a * 0.7))},${f((p[1] + q[1]) / 2 + j(a * 0.7))} ${f(q[0])},${f(q[1])}`;
      }
      return d + (closed ? 'Z' : '');
    };
    const curveD = (pts, closed = false, a = 0.3) => spline(pts.map(([x, y]) => [x + j(a), y + j(a)]), closed);
    const ellipseD = (cx, cy, rx, ry, a = 0.3) => {
      const n = 10, ph = rnd() * Math.PI, k = Math.min(a, Math.min(rx, ry) * 0.1);
      return spline(Array.from({ length: n }, (_, i) => {
        const t = ph + (i * 2 * Math.PI) / n;
        return [cx + Math.cos(t) * (rx + j(k)), cy + Math.sin(t) * (ry + j(k))];
      }), true);
    };
    const circleD = (cx, cy, r, a = 0.3) => ellipseD(cx, cy, r, r, a);

    // 要素
    const line = (x1, y1, x2, y2, cls = 'ink') => el(lineD(x1, y1, x2, y2), cls);
    const poly = (pts, cls = 'ink', closed = false) => el(polyD(pts, closed), cls);
    const curve = (pts, cls = 'ink', closed = false) => el(curveD(pts, closed), cls);
    const circle = (cx, cy, r, cls = 'ink') => el(circleD(cx, cy, r), cls);
    const ellipse = (cx, cy, rx, ry, cls = 'ink') => el(ellipseD(cx, cy, rx, ry), cls);
    const ko = (d, w = 0) => `<path class="ko"${w ? ` style="stroke-width:${w}"` : ''} d="${d}"/>`;
    // 色の面に墨の輪郭を重ねる。gap を渡すとまわりの線も地色で抜く
    const tinted = (d, fill = 'c1', outline = 'ink', gap = 0) => `${ko(d, gap)}${plate(el(d, fill))}${outline ? el(d, outline) : ''}`;
    // 何本もの線を 1 つの要素にまとめる
    const lines = (list, cls = 'ink hair', a = 0.25) => el(list.map(([x1, y1, x2, y2]) => lineD(x1, y1, x2, y2, a)).join(' '), cls);
    const dashes = (list, cls = 'ink hair') => lines(list.map(([x, y, w]) => [x, y, x + w, y]), cls);
    const rays = (cx, cy, r1, r2, n, cls = 'ink fine', phase = 0, r2alt = r2) => lines(Array.from({ length: n }, (_, i) => {
      const a = phase + (i * 2 * Math.PI) / n, r = i % 2 ? r2alt : r2;
      return [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }), cls, 0.2);
    // clipD の形の中を平行線で埋める。angle は 0=横 90=縦 45=右上がり -45=右下がり
    const hatch = (clipD, cls, angle = 0, step = 2.3, box = [10, 28, 110, 160]) => {
      const [x0, y0, x1, y1] = box, h = y1 - y0, id = `h${uid}-${clips++}`;
      const segs = [];
      if (angle === 0) for (let y = y0 + j(0.5); y < y1; y += step) segs.push(lineD(x0, y, x1, y, 0.3));
      else if (angle === 90) for (let x = x0 + j(0.5); x < x1; x += step) segs.push(lineD(x, y0, x, y1, 0.3));
      else for (let x = x0 - h; x < x1; x += step * 1.41) segs.push(angle > 0 ? `M${f(x)},${y1} L${f(x + h)},${y0}` : `M${f(x)},${y0} L${f(x + h)},${y1}`);
      return `<clipPath id="${id}"><path d="${clipD}"/></clipPath><path class="${cls}" clip-path="url(#${id})" d="${segs.join(' ')}"/>`;
    };
    const clip = (clipD, inner) => { const id = `h${uid}-${clips++}`; return `<clipPath id="${id}"><path d="${clipD}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
    const leaf = (x, y, rot, sc = 1, fill = 'c1 wash') => at(x, y, `${el(LEAF, fill)}${el(LEAF, 'ink fine')}<path class="ink hair" d="M0.8,0 L7.6,0"/>`, rot, sc);
    const floret = (x, y, n, r, fill = 'c1') => {
      const d = `M0,-1 C${f(r * 0.5)},${f(-r * 0.45)} ${f(r * 0.5)},${f(-r * 0.95)} 0,${f(-r)} C${f(-r * 0.5)},${f(-r * 0.95)} ${f(-r * 0.5)},${f(-r * 0.45)} 0,-1 Z`;
      const petals = Array.from({ length: n }, (_, i) => `<g transform="rotate(${f((i * 360) / n)})">${el(d, fill)}${el(d, 'ink fine')}</g>`).join('');
      return at(x, y, `${petals}${circle(0, 0, Math.max(1, r * 0.2), 'body fine')}`);
    };
    // 波の列。rows は [y, ずらし] の並び
    const waves = (rows, cls, x0 = 14, x1 = 106, w = 8, hgt = 2.6) => el(rows.map(([y, off = 0]) => {
      let d = `M${f(x0 + off)},${f(y)}`;
      for (let x = x0 + off; x + w <= x1 + 0.1; x += w) d += ` q${f(w / 2)},${f(-hgt + j(0.3))} ${f(w)},0`;
      return d;
    }).join(' '), cls);
    return { j, polyD, curveD, circleD, line, poly, curve, circle, ellipse, tinted, lines, dashes, rays, hatch, clip, leaf, floret, waves };
  }

  return { f, hash, el, at, plate, spline, makeBrush, LEAF, DROP, star4D, starD };
})();
