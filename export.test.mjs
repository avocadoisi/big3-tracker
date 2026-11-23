// 計画のエクスポートのテスト。`node --test` で実行する
import assert from 'node:assert/strict';
import test from 'node:test';
import './export.js'; // 副作用で globalThis.PlanExport を置く

const { addDays, planRows, toImport } = globalThis.PlanExport;

const cycle = { start: '2026-11-02', max: { squat: 152.5, bench: 105, deadlift: 185 } };
const template = [
  [
    [{ p: 80, r: 4, s: 5 }, { p: 70, r: 8, s: 3 }, { p: 60, r: 10, s: 3 }],
    [{ p: 60, r: 10, s: 3 }, { p: 80, r: 4, s: 5 }, { p: 70, r: 8, s: 3 }],
  ],
];

test('addDays: 月をまたいでも日付が繰り上がる', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-11-02', 7), '2026-11-09');
});

test('planRows: 日付は開始日 + week * 7 + day', () => {
  const rows = planRows(cycle, template);
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.slice(0, 3).map((row) => row.date), ['2026-11-02', '2026-11-02', '2026-11-02']);
  assert.deepEqual(rows.slice(3).map((row) => row.date), ['2026-11-03', '2026-11-03', '2026-11-03']);
});

test('planRows: 種目だけ・日だけを選べる', () => {
  const bench = planRows(cycle, template, { lift: 'bench' });
  assert.deepEqual(bench.map((row) => row.date), ['2026-11-02', '2026-11-03']);
  assert.ok(bench.every((row) => row.lift === 'bench'));

  const day2 = planRows(cycle, template, { week: 0, day: 1 });
  assert.deepEqual(day2.map((row) => row.lift), ['squat', 'bench', 'deadlift']);
  assert.ok(day2.every((row) => row.date === '2026-11-03'));
});

test('planRows: 重量は 2.5kg に丸め、rep と set はセルのまま', () => {
  const bench = planRows(cycle, template, { lift: 'bench' });
  assert.equal(bench[0].kg, 72.5); // 105 * 70% = 73.5 -> 72.5
  assert.equal(bench[0].reps, 8);
  assert.equal(bench[0].sets, 3);
  assert.equal(bench[1].kg, 85); // 105 * 80% = 84 -> 85
});

test('toImport: rep x set を1セット=1レコードに展開する', () => {
  const now = Date.UTC(2026, 10, 1, 0, 0, 0);
  const data = toImport(planRows(cycle, template, { lift: 'bench' }), now);

  assert.equal(data.schemaVersion, 1);
  assert.equal(data.exportedAt, '2026-11-01T00:00:00.000Z');
  assert.deepEqual(data.exercises, [
    { id: 'plan-bench', name: 'ベンチプレス', bodyPart: '胸', archived: false },
  ]);
  assert.equal(data.workoutSets.length, 8); // 3set + 5set
  assert.equal(new Set(data.workoutSets.map((set) => set.id)).size, 8);
  assert.deepEqual(data.metricDefs, []);
  assert.deepEqual(data.metricLogs, []);

  const [first] = data.workoutSets;
  assert.deepEqual(
    { date: first.date, exerciseId: first.exerciseId, weight: first.weight, reps: first.reps },
    { date: '2026-11-02', exerciseId: 'plan-bench', weight: 72.5, reps: 8 },
  );
  assert.ok(data.workoutSets.every((set, i) => set.createdAt === now + i));
});

test('toImport: 同じ計画を2回作ってもセットの id は変わらない', () => {
  const rows = planRows(cycle, template);
  const first = toImport(rows, 1).workoutSets.map((set) => set.id);
  const second = toImport(rows, 2).workoutSets.map((set) => set.id);
  assert.deepEqual(first, second);
});
