// サイクルの履歴。最後の要素が今回のサイクル、それより前はアーカイブ(plan.html で折りたたんで表示)。
// max はサイクル開始時に決める(最終週の高強度日の体感と data.csv の記録から)。data.csv は実際の記録。
// 終了したサイクルは template(当時の強度%の並び)を持たせて計画を固定する。無い場合は現在の方式の template で組み直す。
const CYCLES = [
  {
    cycle: 1, program: "dup", start: "2026-10-05", max: { squat: 150, bench: 100, deadlift: 180 },
    // 当時の強度%。終了したサイクルなので、方式の template を変えても書き換えない。
    template: [
      [[80, 70, 60], [60, 80, 70]],
      [[70, 65, 80], [60, 85, 65]],
      [[85, 65, 60], [60, 70, 85]],
      [[80, 60, 65], [65, 85, 80]],
    ],
  },
  // 実施中・次回のサイクルは方式の template をそのまま使う(template は書かない)。
  { cycle: 2, program: "dup", start: "2026-11-02", max: { squat: 152.5, bench: 105, deadlift: 185 } },
];
// 次のサイクルの max は、今回の max にこの増加量(kg)を足して plan.js が組み立てる。
const CYCLE_INCREASE = { squat: 2.5, bench: 2.5, deadlift: 5 };
