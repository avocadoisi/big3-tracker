# 開発資料

## ページ構成

| page | 役割 |
|---|---|
| `index.html` / `app.js` | 記録とグラフ |
| `plan.html` / `plan.js` | 今回・次回の計画(kgの表)、終了したサイクル(折りたたみ)、時代ごとの歩み |
| `cycles.js` | サイクル履歴(番号、開始日、max)。最後が今回、それより前がアーカイブ |
| `simulator.html` / `simulator.js` / `optimizer.js` | DUPシミュレータ(UIと、DOM非依存の最適化ロジック) |
| `programs/<id>.html` | 方式ごとの解説(template、設計ルール、ルールの検証) |
| `common.js` | 共通ヘルパと `PROGRAMS` レジストリ |
| `programs/555.html` | 過去の方式の例。計算を持たない静的な解説のみ(js不要) |
| `programs/<id>.js` | 方式の定義(template、検証)。`PROGRAMS.<id>` に登録 |

`plan.html` は「今回・次回の計画」「終了したサイクル」「時代の履歴」を持つ。組み方の解説は方式ページに置き、plan からリンクする。

## 方式(program)のインターフェース

`programs/<id>.js` で `PROGRAMS.<id>` に次を登録する。

```js
PROGRAMS.dup = {
  id, name, page,                 // page は plan.html から見たパス (programs/dup.html)
  template,                       // [week][day][liftIndex(S,B,D)] = { p: 強度%, r: rep, s: set }
  schemeRows(),                   // 強度ごとの { p, r, s } 一覧(方式ページの表用)
  validate(),                     // 丸め前のルール検証 -> [[説明, ok], ...]
  validateRounded(max),           // 丸め後(2.5kg単位)のルール検証
};
```

重量は `kgOf(cell, max)`(max x % を 2.5kg に丸める)、丸め後の総負荷は `kgLoad`、template上の総負荷は `load` を使う。

## 方式を切り替える・追加する手順

1. `programs/<id>.js` を作り、`PROGRAMS.<id>` を登録する。
2. `programs/<id>.html` を作る(`programs/dup.html` を雛形にし、末尾で `renderProgramPage(PROGRAMS.<id>)` を呼ぶ)。
3. `plan.html` に `<script src="programs/<id>.js">` を足す。
4. `plan.js` の `CURRENT` を変え、`cycles.js` に新しいサイクル(開始日と max)を足す。
5. `plan.html` の「時代ごとの歩み」に新しい時代(採用理由と方式ページへのリンク)を足す。過去の方式のページと js は残す。

## サイクルを進める手順

1. 終わったサイクルの記録を `data.csv` に足す。
2. `cycles.js` の末尾に新しいサイクルを足す。開始日は前サイクルの開始日 + 4週、max は前サイクルの max + `CYCLE_INCREASE`(種目ごとの増加量)。
3. 終わったサイクルは自動で `plan.html` の「終了したサイクル」に折りたたまれる。`cycles.js` からは消さない(アーカイブはここが保存先)。
4. 増加量を変えるときは `cycles.js` の `CYCLE_INCREASE` を変える。サイクルごとに変えたい場合は増加量をサイクルの要素に持たせる。

## 今後の拡張指針: 線形ピリオダイゼーション

現在は未採用。採用する場合は上の手順に沿って足す。

- `programs/linear.js` / `programs/linear.html` を追加する。周期は長い(例: 8〜12週)ので、`template` の週数を増やすだけで済む。`rows` は週数・日数に依存しない。
- 線形は「週が進むほど強度が上がり、rep が減る」ので、DUP の `validate`(総負荷が強度で単調に減る、など)はそのまま使えない。方式ごとにルールと検証を持つ構成にしている理由はここにある。
- 共通で守るルール(2.5kg単位、丸め後に検証する)は `common.js` のヘルパを使う。
- 開始日と max は `cycles.js` で決める。サイクルごとに max を見直す場合も `cycles.js` の変更で足りる。

過去の方式で計算が不要なもの(例: `programs/555.html`)は、静的なhtmlだけでよい。`PROGRAMS` への登録は、plan.html で計画表を出す方式だけ行う。
