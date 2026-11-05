// サイクルの履歴。最後の要素が今回のサイクル、それより前はアーカイブ(plan.html で折りたたんで表示)。
// max はサイクル開始時に決める(最終週の高強度日の体感と data.csv の記録から)。data.csv は実際の記録。
// 終了したサイクルは template(当時のセル { p, r, s })を持たせて計画を固定する。無い場合は現在の方式の template で組み直す。
const CYCLES = [
  {
    cycle: 1, program: "dup", start: "2026-10-05", max: { squat: 150, bench: 100, deadlift: 180 },
    // 当時のセル。強度%だけでなく rep x set も固定する(SCHEME を変えても過去の計画は変わらない)。
    template: [
      [
        [{ p: 80, r: 4, s: 5 }, { p: 70, r: 8, s: 3 }, { p: 60, r: 10, s: 3 }],
        [{ p: 60, r: 10, s: 3 }, { p: 80, r: 4, s: 5 }, { p: 70, r: 8, s: 3 }],
      ],
      [
        [{ p: 70, r: 8, s: 3 }, { p: 65, r: 9, s: 3 }, { p: 80, r: 4, s: 5 }],
        [{ p: 60, r: 10, s: 3 }, { p: 85, r: 3, s: 6 }, { p: 65, r: 9, s: 3 }],
      ],
      [
        [{ p: 85, r: 3, s: 6 }, { p: 65, r: 9, s: 3 }, { p: 60, r: 10, s: 3 }],
        [{ p: 60, r: 10, s: 3 }, { p: 70, r: 8, s: 3 }, { p: 85, r: 3, s: 6 }],
      ],
      [
        [{ p: 80, r: 4, s: 5 }, { p: 60, r: 10, s: 3 }, { p: 65, r: 9, s: 3 }],
        [{ p: 65, r: 9, s: 3 }, { p: 85, r: 3, s: 6 }, { p: 80, r: 4, s: 5 }],
      ],
    ],
  },
  // 実施中・次回のサイクルは方式の template をそのまま使う(template は書かない)。
  { cycle: 2, program: "dup", start: "2026-11-02", max: { squat: 152.5, bench: 105, deadlift: 185 } },
];
// 次のサイクルの max は、今回の max にこの増加量(kg)を足して plan.js が組み立てる。
const CYCLE_INCREASE = { squat: 2.5, bench: 2.5, deadlift: 5 };
