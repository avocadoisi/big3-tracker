// 計画(cycle)のセルを open-workout-memo のインポート形式へ変換する。DOM に触れない。
// plan.html は PlanExport をそのまま使い、テストは node --test で読む。
(function (root) {
  const LIFT_ORDER = ["squat", "bench", "deadlift"];
  // open-workout-memo の初期の種目名と部位に合わせる（インポートは名前で種目を寄せる）
  const LIFT_INFO = {
    squat: { name: "スクワット", bodyPart: "脚" },
    bench: { name: "ベンチプレス", bodyPart: "胸" },
    deadlift: { name: "デッドリフト", bodyPart: "背中" },
  };
  const UNIT = 2.5;
  // common.js の kgOf と同じ丸め。テストから単体で読めるよう、ここでも持つ
  const round = (kg) => Math.round(kg / UNIT) * UNIT;

  function addDays(date, days) {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // 選んだセルを表の行にする。lift は種目名、week/day は 0 起点で、null は「すべて」
  function planRows(cycle, template, { lift = null, week = null, day = null } = {}) {
    const rows = [];
    template.forEach((days, w) => {
      if (week !== null && w !== week) return;
      days.forEach((cells, d) => {
        if (day !== null && d !== day) return;
        cells.forEach((cell, i) => {
          const name = LIFT_ORDER[i];
          if (lift !== null && name !== lift) return;
          rows.push({
            date: addDays(cycle.start, w * 7 + d),
            week: w + 1,
            day: d + 1,
            lift: name,
            kg: round((cycle.max[name] * cell.p) / 100),
            reps: cell.r,
            sets: cell.s,
          });
        });
      });
    });
    return rows;
  }

  // 1セット=1レコード。id は日付・種目・セット番号から決めるので、同じ計画を何度取り込んでも増えない
  function toImport(rows, now = Date.now()) {
    const workoutSets = [];
    let createdAt = now;
    for (const row of rows) {
      for (let i = 1; i <= row.sets; i += 1) {
        workoutSets.push({
          id: `plan-${row.date}-${row.lift}-${i}`,
          date: row.date,
          exerciseId: `plan-${row.lift}`,
          weight: row.kg,
          reps: row.reps,
          createdAt,
        });
        createdAt += 1;
      }
    }
    const lifts = [...new Set(rows.map((row) => row.lift))];
    return {
      schemaVersion: 1,
      exportedAt: new Date(now).toISOString(),
      exercises: lifts.map((lift) => ({ id: `plan-${lift}`, ...LIFT_INFO[lift], archived: false })),
      workoutSets,
      metricDefs: [],
      metricLogs: [],
    };
  }

  root.PlanExport = { LIFT_ORDER, LIFT_INFO, addDays, planRows, toImport };
})(typeof globalThis !== "undefined" ? globalThis : this);
