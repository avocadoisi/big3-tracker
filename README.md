# Strength Log

BIG3（スクワット・ベンチプレス・デッドリフト）の履歴、現在値、推移を表示する静的サイトです。実績は `data.csv`、目標点（マイルストーン）は `milestones.csv` に保存され、GitHubへpushするとGitHub Pagesの表示も更新されます。

https://avocadoisi.github.io/big3-tracker/


## Training Plan

`plan.html` は現在のトレーニング計画(kgの表)と、時代ごとの歩みのページです。現在の方式は `plan.js` の `CURRENT` で決め、組み方の解説は `programs/` の方式ページ(現在は `programs/dup.html`)にあります。

- 基準日 2026/10/5 (Mon) を cycle1 / week1 / day1 とし、`data.csv` の各種目の最大値を max として計画を算出します。
- 重量は 2.5kg 単位に丸め、丸め後の重量でもルールを検証します。

方式の追加方法や拡張指針は [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照してください。
