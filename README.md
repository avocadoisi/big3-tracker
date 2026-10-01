# Strength Log

BIG3（スクワット・ベンチプレス・デッドリフト）の履歴、現在値、推移を表示する静的サイトです。実績は `data.csv`、目標点（マイルストーン）は `milestones.csv` に保存され、GitHubへpushするとGitHub Pagesの表示も更新されます。

https://avocadoisi.github.io/big3-tracker/


## Training Plan

`dup.html` は DUP（Daily Undulating Periodization）のトレーニング計画ページです。

- 基準日 2026/10/5 (Mon) を cycle1 / week1 / day1 とし、`data.csv` の各種目の最大値を max として計画を算出します。
- 週2day x 4週間を1サイクルとし、rep は 3〜10、重量は 2.5kg 単位に丸めます。
- 総負荷（% x rep x set）は強度が違ってもほぼ同じにし（ゆらぎ20%以内）、強度が高いほど少なくします。丸め後の重量でも同じ条件を検証します。
- テンプレート、根拠、背景はページ内に記載しています。計画ロジックは `dup.js` にあります。
