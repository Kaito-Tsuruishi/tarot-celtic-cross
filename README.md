# ケルト十字タロット

ジャンルを選ぶだけで、ケルト十字（10 枚）のタロット占いができる Web アプリ。1 つの HTML ファイルで完結し、スマホでも遊べる。

## 使い方

公開版: https://kaito-tsuruishi.github.io/tarot-celtic-cross/

ローカルでは `dist/index.html` をブラウザで開くだけで動く。サーバもビルドツールも不要。

main に push すると GitHub Actions（`.github/workflows/pages.yml`）がデータ検証 → ビルド → GitHub Pages へのデプロイを行う。

## 構成

```
data/        解釈データ（JSON、78 枚 × キーワード・基本の意味・4 ジャンル × 正逆）
data/frames/ ポジションの時間枠（内面・過去・未来）別の解釈文。現在枠は data/*.json の文を使う
src/         アプリ本体（index.html = 画面と CSS / art.js = カード絵柄 / reading.js = 総合リーディング / app.js = 画面制御）
scripts/     validate.js = 解釈データの検証 / build.js = 単一 HTML へ結合
dist/        ビルド成果物（index.html）
docs/        引き継ぎ資料・執筆ガイド・総合リーディングの調査ノート
```

## 開発

```bash
node scripts/validate.js data/*.json          # 解釈データの検証（文字数・禁止語・重複・欠け）
node scripts/validate-frames.js data/frames/*.json   # 時間枠別の文の検証（現在枠との重複・決まり文句）
node scripts/build.js                  # dist/index.html を生成
```

解釈文の書き方は `docs/writing-guide.md`、時間枠別の文は `docs/frames-guide.md`、総合リーディングの読み筋の根拠は `docs/research-notes.md` を参照。

## 仕様の要点

- ジャンル: 総合・恋愛・仕事・人間関係
- 78 枚フルデッキ、逆位置あり（各カード 50%）。シャッフルは Fisher–Yates、乱数は `crypto.getRandomValues`
- 10 枚を 1 枚ずつ順番にめくり、ポジション名・カード名・正逆・ジャンル別解釈を表示。解釈文はポジションの時間枠（現在: 1,2,7,8 / 内面: 3,4,9 / 過去: 5 / 未来: 6,10）に合わせて切り替わる。10 枚めくると総合リーディング
- カードの絵柄はオリジナル（番号・スート記号・抽象モチーフ）。ライダー版の絵柄は使っていない
- キーボード操作対応、`prefers-reduced-motion` 対応
