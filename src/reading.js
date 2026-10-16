// 総合リーディングの組み立て。根拠: docs/research-notes.md
const Reading = (() => {
  const SUIT_JA = { wands: 'ワンド', cups: 'カップ', swords: 'ソード', pentacles: 'ペンタクル' };
  const SUIT_THEME = {
    wands: '情熱や行動、意志の向け方',
    cups: '感情や愛情、人とのつながり',
    swords: '考え方や判断、言葉のやり取り',
    pentacles: 'お金や仕事、体や暮らしといった現実面',
  };
  const SUIT_MISSING = {
    wands: '「やってみる」という行動の熱',
    cups: '気持ちの面に目を向けること',
    swords: '冷静に考えて言葉にすること',
    pentacles: '現実的な足場やお金・体の面',
  };
  const GENRE_SUIT = { love: 'cups', relation: 'cups', work: 'pentacles', money: 'pentacles', health: 'pentacles', general: null };
  const RANK_THEME = {
    1: '始まりと種', 2: '選択と均衡', 3: '成長と協力', 4: '安定と足場', 5: '変化と葛藤',
    6: '調和と回復', 7: '試練と見直し', 8: '前進と力', 9: '到達の目前', 10: '完結と次の周期',
  };
  const RANK_LABEL = { 1: 'エース', 11: 'ペイジ', 12: 'ナイト', 13: 'クイーン', 14: 'キング' };
  const POS = {
    1: '現状', 2: '障害・課題', 3: '顕在意識・目標', 4: '潜在意識・土台', 5: '過去',
    6: '近い未来', 7: '本人の姿勢', 8: '周囲の環境', 9: '願望と恐れ', 10: '最終結果',
  };

  // カードの基調（正位置での重さ）。-1=重い / 0=中立 / 1=明るい
  const HEAVY = new Set(['major-13', 'major-15', 'major-16', 'major-18', 'wands-05', 'wands-10', 'cups-05', 'swords-03', 'swords-05', 'swords-07', 'swords-08', 'swords-09', 'swords-10', 'pentacles-05']);
  const NEUTRAL = new Set(['major-02', 'major-09', 'major-12', 'wands-02', 'wands-07', 'wands-09', 'cups-04', 'cups-07', 'cups-08', 'swords-02', 'swords-04', 'swords-06', 'pentacles-04', 'pentacles-07']);
  function tone(c) {
    const base = HEAVY.has(c.card.id) ? -1 : NEUTRAL.has(c.card.id) ? 0 : 1;
    if (!c.rev) return base;
    return base === 1 ? 0 : base === -1 ? 0 : -0.5; // 逆位置は「弱まり」「峠越え」として中立寄りに
  }

  function rnd(n) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  }
  const pick = (arr) => arr[rnd(arr.length)];
  const kw = (c) => pick(c.rev ? c.card.keywords.rev : c.card.keywords.up);
  const name = (c) => `${c.card.nameJa}${c.rev ? '（逆位置）' : ''}`;
  const nameIn = (c) => `${c.card.nameJa}${c.rev ? 'の逆位置' : ''}`; // 括弧の中で使う形
  // 2 枚の基調の組み合わせ: 'high'=どちらも明るい / 'low'=どちらも重い・弱い / 'mixed'=向きが違う
  function duo(a, b) {
    const ta = tone(a), tb = tone(b);
    if (Math.abs(ta - tb) >= 1) return 'mixed';
    return (ta + tb) / 2 >= 0.5 ? 'high' : 'low';
  }

  function countSection(spread) {
    const out = [];
    const majors = spread.filter((c) => c.card.arcana === 'major');
    const minors = spread.filter((c) => c.card.arcana === 'minor');
    const revs = spread.filter((c) => c.rev);
    const courts = spread.filter((c) => c.card.arcana === 'minor' && c.card.rank >= 11);

    // 大アルカナの枚数
    if (majors.length >= 6) {
      out.push(pick([
        `大アルカナが ${majors.length} 枚と多く、この件は日々の努力や工夫の範囲を超えた、大きな流れの中にあります。自分で動かせる部分と、時が運んでくる部分とを分けて考えることが大切です。`,
        `10 枚のうち ${majors.length} 枚が大アルカナです。人生の節目にあたる大きなテーマが動いており、小手先の対応より、流れそのものを受け止める姿勢が求められています。`,
      ]));
    } else if (majors.length >= 4) {
      out.push(pick([
        `大アルカナが ${majors.length} 枚あり、この件は単なる日常の一コマではなく、ひとつの節目にあたるテーマを含んでいます。`,
        `${majors.length} 枚の大アルカナが出ています。自分の意思だけでは動かしにくい要素が関わっており、その分、向き合う価値のあるテーマだと言えます。`,
      ]));
    } else if (majors.length <= 1) {
      out.push(pick([
        `小アルカナが中心の展開です。この件は日常のレベルで動いており、あなたの日々の選択や行動で流れを変えていける余地が大きいでしょう。`,
        `大アルカナがほとんど出ていません。運命的な出来事というより、普段の行動の積み重ねが結果を左右する展開です。`,
      ]));
    }

    // スートの偏り・欠け（小アルカナのみで集計）
    const suitCount = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
    minors.forEach((c) => { suitCount[c.card.suit]++; });
    const dominant = Object.entries(suitCount).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1])[0];
    if (dominant) {
      const [s, n] = dominant;
      out.push(pick([
        `${SUIT_JA[s]}が ${n} 枚出ています。${SUIT_THEME[s]}がこの件の中心にあります。`,
        `小アルカナのうち ${n} 枚が${SUIT_JA[s]}です。テーマの核は${SUIT_THEME[s]}にあると読めます。`,
      ]));
    }
    if (minors.length >= 6) {
      const missing = Object.keys(suitCount).filter((s) => suitCount[s] === 0);
      if (missing.length) {
        const s = missing.includes(GENRE_SUIT[spread.genre]) ? GENRE_SUIT[spread.genre] : missing[0];
        out.push(pick([
          `一方で${SUIT_JA[s]}が 1 枚も出ていません。${SUIT_MISSING[s]}が、いまは視野から抜けているのかもしれません。`,
          `${SUIT_JA[s]}が見当たりません。${SUIT_MISSING[s]}を意識して補うと、全体のバランスが整いやすくなります。`,
        ]));
      }
    }

    // 逆位置の枚数
    if (revs.length >= 8) {
      out.push(pick([
        `逆位置が ${revs.length} 枚と大半を占めています。物事の見通しが立ちにくく、エネルギーが外ではなく内側で動いている時期です。結論を急がず、まず自分の中で何が起きているかを整理することが先になります。`,
        `${revs.length} 枚が逆位置です。流れが表に出にくく、全体に滞りや遅れを感じやすいでしょう。いまは判断を固めるより、様子を見ながら足元を整える段階です。`,
      ]));
    } else if (revs.length >= 6) {
      out.push(pick([
        `逆位置が ${revs.length} 枚あります。物事が思うように進まなかったり、気持ちが内向きになったりしやすい流れです。遅れそのものを悪く捉えず、準備の時間として使う視点が助けになります。`,
        `${revs.length} 枚が逆位置で、エネルギーがやや内側にこもっています。表に出ない部分で状況は動いているので、焦って外に働きかけるより、内側の声を聞く時間を取るとよいでしょう。`,
      ]));
    } else if (revs.length <= 1) {
      out.push(pick([
        `逆位置がほとんどなく、各カードの力が素直に表に出ています。流れはつかみやすく、カードの示す方向に乗っていきやすい展開です。`,
        `正位置がそろっていて、物事が表立って動いている状態です。隠れた要素は少なく、見えているものをそのまま受け取って差し支えありません。`,
      ]));
    }

    // コートカード
    if (courts.length >= 4) {
      const names = courts.map((c) => c.card.nameJa).join('、');
      out.push(`コートカードが ${courts.length} 枚（${names}）も出ており、この件には多くの人物が関わっています。それぞれの立場や思惑を見分けることが、状況を読み解く手がかりになります。`);
    } else if (courts.length >= 3) {
      const names = courts.map((c) => c.card.nameJa).join('、');
      out.push(pick([
        `コートカードが ${courts.length} 枚（${names}）出ています。自分ひとりの問題ではなく、周りの人の存在や影響が大きいと読めます。`,
        `${names}と、人物を表すカードが ${courts.length} 枚あります。鍵を握るのは他人の動きや関わり方で、その人たちとどう向き合うかが問われています。`,
      ]));
    } else if (courts.length === 0) {
      out.push(pick([
        `人物を表すコートカードは出ていません。この件は他人の思惑よりも、あなた自身の内面や行動が中心になっています。`,
        `コートカードがなく、登場人物は少なめです。誰かに左右される展開ではなく、自分の中で答えを出していく流れです。`,
      ]));
    }

    // 同じ数字の重複（小アルカナの数札のみ）
    const rankCount = {};
    minors.filter((c) => c.card.rank <= 10).forEach((c) => { rankCount[c.card.rank] = (rankCount[c.card.rank] || 0) + 1; });
    const repeated = Object.entries(rankCount).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
    if (repeated) {
      const [r, n] = repeated;
      const label = RANK_LABEL[r] || r;
      out.push(pick([
        `${label}のカードが ${n} 枚出ています。「${RANK_THEME[r]}」というテーマが、この件全体で強調されています。`,
        `数字の ${label} が ${n} 回も重なりました。${RANK_THEME[r]}が繰り返し示されており、ここに目を向けることが鍵になります。`,
      ]));
    }
    return out;
  }

  function pairSection(spread) {
    const c = (p) => spread.find((x) => x.pos === p);
    const out = [];
    const c1 = c(1), c2 = c(2), c3 = c(3), c4 = c(4), c5 = c(5), c6 = c(6), c7 = c(7), c8 = c(8), c9 = c(9), c10 = c(10);

    // 1 と 2: 状況と課題
    if (tone(c2) === 1) {
      out.push(pick([
        `現状の「${kw(c1)}」に対して、課題の位置には${name(c2)}という本来は良い意味のカードが出ています。障害は深刻ではないか、あるいは良いものがこの件では裏目に出ているのかもしれません。`,
        `いまの空気は「${kw(c1)}」です。課題に${name(c2)}が出ていますが、これは乗り越えにくい壁というより、良いはずのものが絡まって進みにくくしている形と読めます。`,
      ]));
    } else {
      out.push(pick([
        `現状を包んでいるのは「${kw(c1)}」の空気で、そこに「${kw(c2)}」という課題が重なっています。この二つをひとまとめに見ることで、何が引っかかっているのかが見えてきます。`,
        `${name(c1)}が示す「${kw(c1)}」の状況に、${name(c2)}の「${kw(c2)}」が立ちはだかっています。課題の性質をはっきりさせることが、最初の一歩です。`,
      ]));
    }

    // 5 → 1 → 6: 時間の流れ
    out.push(pick([
      `時間の流れで見ると、過去の「${kw(c5)}」が過ぎ、いまは「${kw(c1)}」のただ中にあり、これから「${kw(c6)}」が働き始めます。`,
      `過去の${name(c5)}から、現在の${name(c1)}を経て、近い未来には${name(c6)}へと流れが向かっています。「${kw(c5)}」から「${kw(c6)}」への変化として受け止めてみてください。`,
    ]));

    // 3 と 4: 顕在意識と潜在意識
    const d34 = duo(c3, c4);
    if (d34 === 'mixed' || c3.rev !== c4.rev) {
      out.push(pick([
        `意識している目標は「${kw(c3)}」、心の奥にあるのは「${kw(c4)}」です。頭で目指しているものと、根っこで感じているものの間にずれがあり、そのずれ自体がこの件の本質に触れています。`,
        `表の目標（${nameIn(c3)}）と土台（${nameIn(c4)}）の向きが少し違っています。「${kw(c3)}」を目指しながら、心の奥では「${kw(c4)}」が働いている。両方を認めることから整理が始まります。`,
      ]));
    } else if (d34 === 'high') {
      out.push(pick([
        `意識している目標「${kw(c3)}」と、心の奥にある「${kw(c4)}」は方向がそろっています。頭と心が同じ方を向いているので、迷いは少なく、動き出せば力が出やすいでしょう。`,
        `目指しているもの（${nameIn(c3)}）と土台（${nameIn(c4)}）にずれは少なく、「${kw(c4)}」という根っこが「${kw(c3)}」という目標をしっかり支えています。`,
      ]));
    } else {
      out.push(pick([
        `意識している目標「${kw(c3)}」も、心の奥の「${kw(c4)}」も、どちらも重さや迷いを含んでいます。頭と心は同じ方を向いていますが、その向き自体が疲れている可能性があり、目標の立て方から見直す余地があります。`,
        `目標（${nameIn(c3)}）と土台（${nameIn(c4)}）は食い違ってはいませんが、どちらにも滞りがにじんでいます。「${kw(c4)}」という根っこを認めたうえで、「${kw(c3)}」という目標を小さく組み直すと動きやすくなります。`,
      ]));
    }

    // 7 と 8: 本人の姿勢と周囲
    const d78 = duo(c7, c8);
    const t78 = d78 === 'high' ? [
      `あなた自身は「${kw(c7)}」という姿勢で臨み、周囲からは「${kw(c8)}」の影響を受けています。内と外の向きは近く、周りの空気を味方にしやすい状態です。`,
      `本人の姿勢（${nameIn(c7)}）と周囲の環境（${nameIn(c8)}）は噛み合っています。「${kw(c7)}」の構えのまま、周囲の「${kw(c8)}」を受け取って進んでかまいません。`,
    ] : d78 === 'low' ? [
      `あなた自身は「${kw(c7)}」という姿勢で、周囲も「${kw(c8)}」という空気です。内と外が同じ重さを抱えていて、互いに引きずられやすい状態なので、どちらか一方だけでも軽くする工夫が突破口になります。`,
      `本人の姿勢（${nameIn(c7)}）と周囲の環境（${nameIn(c8)}）は、どちらも滞りを含んでいます。周りのせいにも自分のせいにもせず、「${kw(c7)}」という構えを少しだけ変えてみることから流れが動きます。`,
    ] : [
      `あなたは「${kw(c7)}」という姿勢でいますが、周囲は「${kw(c8)}」という空気です。内と外の温度差があるので、周りの反応を自分の価値と結びつけすぎないことが大切です。`,
      `本人の姿勢（${nameIn(c7)}）と周囲の環境（${nameIn(c8)}）の向きが違っています。「${kw(c8)}」という外の影響を踏まえつつ、「${kw(c7)}」という自分の構えをどこまで通すかが分かれ目です。`,
    ];
    out.push(pick(t78));

    // 9 と 10: 願望と恐れ、結果
    const t10 = tone(c10);
    if (t10 >= 1) {
      out.push(pick([
        `願望と恐れの位置には「${kw(c9)}」が出ています。最終結果の${name(c10)}は明るい方向を示しており、望みに近い形へ向かう流れです。期待は結果を引き寄せる力にもなるので、恐れより望みの方を意識して持っていてください。`,
        `「${kw(c9)}」という思いを抱えながら、結末には${name(c10)}が示されています。恐れていた形ではなく、望んでいた方向に流れが寄っていくでしょう。`,
      ]));
    } else if (t10 <= -0.5) {
      out.push(pick([
        `願望と恐れの位置の「${kw(c9)}」と、最終結果の${name(c10)}を並べると、心配していた方向に流れが寄りやすい暗示があります。ただし結果は固定されたものではなく、ここまでの 9 枚、特に本人の姿勢を変えることで動かせる部分です。`,
        `「${kw(c9)}」という思いが、結末の${name(c10)}に影を落としている可能性があります。恐れを抱えたまま動くと、その形をなぞりやすくなります。不安を一度言葉にして外に出すことが、流れを変える入口になります。`,
      ]));
    } else {
      out.push(pick([
        `願望と恐れの位置には「${kw(c9)}」、最終結果には${name(c10)}が出ています。結末はまだ良くも悪くも定まっておらず、望みと恐れのどちらを強く持つかで色が変わる段階です。`,
        `「${kw(c9)}」という思いと、結末の${name(c10)}は、直接的な一致も不一致も示していません。期待や不安がそのまま結果を決めるのではなく、どう動くかに委ねられています。`,
      ]));
    }

    // 3 と 10: 目標と結果（補助に 4 と 10）
    const d310 = duo(c3, c10);
    const t310 = d310 === 'high' ? [
      `目指している「${kw(c3)}」と、結末の「${kw(c10)}」は近い位置にあります。いま描いている形は、この状況で手の届く最善の形とそう遠くありません。根っこにある「${kw(c4)}」が、その土台として効いています。`,
      `目標（${nameIn(c3)}）と最終結果（${nameIn(c10)}）の方向はそろっています。思い描いている形へ進んで差し支えなく、土台の${nameIn(c4)}がその歩みを下から支えます。`,
    ] : d310 === 'low' ? [
      `目指している「${kw(c3)}」も、結末の「${kw(c10)}」も、重さを含んだまま同じ方向を向いています。このまま進むと目標ごと重さを引き受ける形になるので、根っこの「${kw(c4)}」に立ち返って、目標そのものを軽く組み直すことが結末を変える鍵です。`,
      `目標（${nameIn(c3)}）と最終結果（${nameIn(c10)}）は食い違っていませんが、どちらにも滞りがあります。着地点を動かすには、土台の${nameIn(c4)}が示す根っこの部分から手を入れる必要があります。`,
    ] : [
      `目指している「${kw(c3)}」と、結末に示された「${kw(c10)}」には距離があります。目標そのものを疑うというより、たどり着く形が想像と少し違うと受け止めてください。根っこの「${kw(c4)}」が、その違いの理由を語っています。`,
      `目標（${nameIn(c3)}）と最終結果（${nameIn(c10)}）は同じ方向を向いていません。描いている理想と実際の着地点がずれやすいので、土台にある${nameIn(c4)}を見直すことが、結末を近づける手がかりになります。`,
    ];
    out.push(pick(t310));

    // 10 枚目の特記
    if (c10.card.arcana === 'major') {
      out.push(pick([
        `最終結果に大アルカナの${name(c10)}が出ている点は、特に重く受け止めてよいでしょう。この結末は、細かな行動よりも大きな流れに根ざしています。`,
        `結末の位置に大アルカナが現れました。${c10.card.nameJa}の示すテーマは、この件の帰結として強く働きます。`,
      ]));
    } else if (c10.card.rank >= 11) {
      out.push(pick([
        `最終結果にコートカードの${name(c10)}が出ています。事の行方は、このカードが表す人物、あるいはあなた自身がこの資質をどう発揮するかに委ねられています。`,
        `結末の位置に人物を表す${c10.card.nameJa}が現れました。この件の決着は、その人物の出方次第という面が強く、相手を見極めることが結末を左右します。`,
      ]));
    }
    return out;
  }

  function build(spread, genre) {
    spread.genre = genre;
    const c10 = spread.find((x) => x.pos === 10);
    return {
      counts: countSection(spread),
      pairs: pairSection(spread),
      final: {
        card: c10,
        text: c10.rev ? c10.card.genres[genre].rev : c10.card.genres[genre].up,
      },
    };
  }

  return { build, POS };
})();
