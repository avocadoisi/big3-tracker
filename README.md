# Strength Log

BIG3（スクワット・ベンチプレス・デッドリフト）の履歴、現在値、推移を表示する静的サイトです。実績は `data.csv`、目標点（マイルストーン）は `milestones.csv` に保存され、GitHubへpushするとGitHub Pagesの表示も更新されます。

https://avocadoisi.github.io/big3-tracker/


## Training Plan

`plan.html` は現在のトレーニング計画(kgの表)と、時代ごとの歩みのページです。現在の方式は `plan.js` の `CURRENT` で決め、組み方の解説は `programs/` の方式ページ(現在は `programs/dup.html`)にあります。

- サイクル(4週)ごとの開始日と max は `cycles.js` に記録します。最後の要素が今回のサイクルで、その max に `CYCLE_INCREASE`(現在は S+2.5kg / B+2.5kg / D+5kg)を足したものが次回の計画です。
- `data.csv` は実際の記録、`cycles.js` はサイクル開始時に決めた max。終了したサイクルは `plan.html` の「終了したサイクル」に折りたたんで残ります。終了したサイクルは強度%(template)も `cycles.js` に固定するので、方式の template を変えても当時の計画のまま残ります。
- 重量は 2.5kg 単位に丸め、丸め後の重量でもルールを検証します。

方式の追加方法や拡張指針は [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照してください。

## License

MIT — [LICENSE](LICENSE)
