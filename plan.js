// 現在採用している方式。切り替えるときは programs/<id>.js を追加して、この定数と plan.html のscriptを変える。
const CURRENT = "dup";
const CYCLE_WEEKS = 4;

// cycles.js の最後が今回のサイクル。その max に CYCLE_INCREASE を足したものが次回。
const currentCycle = CYCLES.at(-1);
const pastCycles = CYCLES.slice(0, -1);
const nextCycle = {
  cycle: currentCycle.cycle + 1,
  program: currentCycle.program,
  start: shiftDays(currentCycle.start, CYCLE_WEEKS * 7),
  max: Object.fromEntries(LIFTS.map((l) => [l, currentCycle.max[l] + CYCLE_INCREASE[l]])),
};

function shiftDays(date, days) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const slash = (date) => date.replaceAll("-", "/");
function weekLabel(w, start) {
  const d = new Date(`${start}T12:00:00`);
  d.setDate(d.getDate() + w * 7);
  return `week${w + 1}<br><small>${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}〜</small>`;
}
// 方式がテンプレートを持つ場合だけ計画表を返す(555 のような静的ページのみの方式は空)
// 終了したサイクルは cycles.js に固定した template(当時のセル)で描く。無ければ現在の方式の template。
// 当時のセル(cycles.js の template)か、方式の現在の template。方式が見つからなければ空
function templateOf(c) {
  const program = PROGRAMS[c.program];
  return c.template || (program && program.template);
}
function planTable(c) {
  const template = templateOf(c);
  return template ? head + rows({ template }, (w) => weekLabel(w, c.start), (cell, i) => `${kgOf(cell, c.max[LIFTS[i]])}kg x ${cell.r}r x ${cell.s}s`) : "";
}
function cycleInfo(c) {
  const program = PROGRAMS[c.program];
  const page = program ? program.page : `programs/${c.program}.html`;
  const name = program ? program.name : c.program.toUpperCase();
  return `cycle${c.cycle} / ${slash(c.start)} (Mon) 開始 ・ 方式: <a href="${page}">${name}</a><br>max: S ${c.max.squat}kg / B ${c.max.bench}kg / D ${c.max.deadlift}kg`;
}
function maxLabel(c) { return `S ${c.max.squat} / B ${c.max.bench} / D ${c.max.deadlift}`; }
function increaseLabel(prev, c) { return prev ? LIFTS.map((l) => `${SHORT[l]}${c.max[l] - prev.max[l] >= 0 ? "+" : ""}${c.max[l] - prev.max[l]}`).join(" / ") : "—"; }

const program = PROGRAMS[CURRENT];
$("program-info").innerHTML = `現在の方式: <a href="${program.page}">${program.name}</a>(組み方・template・ルールはリンク先)`;
$("base-info").innerHTML = `${cycleInfo(currentCycle)}<br>セルは「kg x rep x set」`;
$("plan-table").innerHTML = planTable(currentCycle);

$("next-base-info").innerHTML = `${cycleInfo(nextCycle)}<br>今回のmaxからの増加: ${LIFTS.map((l) => `${SHORT[l]}+${CYCLE_INCREASE[l]}kg`).join(" / ")}<br>セルは「kg x rep x set」`;
$("next-plan-table").innerHTML = planTable(nextCycle);

// 終了したサイクルは折りたたんで残す(新しい順)
$("archive").innerHTML = pastCycles.slice().reverse().map((c) => {
  const table = planTable(c);
  return `<details class="archive"><summary>cycle${c.cycle} ${slash(c.start)}〜 / max ${maxLabel(c)}</summary><p class="note">${cycleInfo(c)}</p>${table ? `<div class="table-wrap"><table class="big">${table}</table></div>` : `<p class="note">このサイクルの計画表は方式ページを参照。</p>`}</details>`;
}).join("") || `<p class="note">終了したサイクルはまだありません。</p>`;
$("archive-info").textContent = pastCycles.length ? "終了したサイクル(クリックで開く)。maxと計画は当時のまま。" : "";

// --- クリップボードへエクスポート ---
// 種目(列)と日(行)で絞ったセルを open-workout-memo のインポートJSONにしてコピーする。
const exportTargets = [
  { key: "current", cycle: currentCycle, tag: "今回" },
  { key: "next", cycle: nextCycle, tag: "次回" },
  ...pastCycles.slice().reverse().map((c) => ({ key: `past-${c.cycle}`, cycle: c, tag: "終了" })),
].filter((item) => templateOf(item.cycle));

const exportCycle = $("export-cycle");
const exportLift = $("export-lift");
const exportDay = $("export-day");
const exportStatus = $("export-status");
const exportPreview = $("export-preview");

exportCycle.innerHTML = exportTargets.map((item) => `<option value="${item.key}">cycle${item.cycle.cycle} ${item.tag} / ${slash(item.cycle.start)}〜</option>`).join("");
exportLift.innerHTML = `<option value="">すべて</option>` + LIFTS.map((l) => `<option value="${l}">${SHORT[l]} ${PlanExport.LIFT_INFO[l].name}</option>`).join("");

function exportTarget() {
  return exportTargets.find((item) => item.key === exportCycle.value) || exportTargets[0];
}

// サイクルを変えると週数・日数も変わるので、日の選択肢を作り直す
function renderExportDays() {
  const { cycle } = exportTarget();
  const previous = exportDay.value;
  exportDay.innerHTML = `<option value="">すべて</option>` + templateOf(cycle).flatMap((days, w) => days.map((_, d) => {
    const date = slash(PlanExport.addDays(cycle.start, w * 7 + d));
    return `<option value="${w}-${d}">week${w + 1} day${d + 1} (${date})</option>`;
  })).join("");
  if ([...exportDay.options].some((option) => option.value === previous)) exportDay.value = previous;
}

function exportRows() {
  const { cycle } = exportTarget();
  const [week, day] = exportDay.value ? exportDay.value.split("-").map(Number) : [null, null];
  return PlanExport.planRows(cycle, templateOf(cycle), { lift: exportLift.value || null, week, day });
}

function renderExport() {
  const { tag } = exportTarget();
  const rows = exportRows();
  const sets = rows.reduce((sum, row) => sum + row.sets, 0);

  exportPreview.innerHTML = rows.length
    ? "<tr><th>日付</th><th>week</th><th>day</th><th>種目</th><th>重量</th><th>rep</th><th>set</th></tr>" + rows.map((row) =>
      `<tr><td>${slash(row.date)}</td><td>${row.week}</td><td>${row.day}</td><td>${PlanExport.LIFT_INFO[row.lift].name}</td><td>${row.kg}kg</td><td>${row.reps}</td><td>${row.sets}</td></tr>`).join("")
    : "<tr><td>この条件にセルはありません</td></tr>";
  exportStatus.textContent = `${tag}の計画: ${rows.length}セル / ${sets}セット`;
  $("export-copy").disabled = rows.length === 0;
}

$("export-copy").addEventListener("click", async () => {
  const rows = exportRows();
  if (!rows.length) return;
  const data = PlanExport.toImport(rows);
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    exportStatus.textContent = `コピーしました（${rows.length}セル / ${data.workoutSets.length}セット）`;
  } catch {
    exportStatus.textContent = "コピーできませんでした。ブラウザがクリップボードを許可しているか確認してください。";
  }
});
exportCycle.addEventListener("change", () => { renderExportDays(); renderExport(); });
exportLift.addEventListener("change", renderExport);
exportDay.addEventListener("change", renderExport);
renderExportDays();
renderExport();

// サイクルの一覧(時代ごとの歩みの表)
$("cycle-table").innerHTML = "<tr><th>cycle</th><th>期間</th><th>max (S / B / D)</th><th>maxの増加</th></tr>" + [...CYCLES, nextCycle].map((c, i, all) => {
  const prev = i ? all[i - 1] : null;
  const end = shiftDays(shiftDays(c.start, CYCLE_WEEKS * 7), -1);
  const tag = c === currentCycle ? " (今回)" : c === nextCycle ? " (次回)" : "";
  return `<tr><td>cycle${c.cycle}</td><td>${slash(c.start)}〜${slash(end)}${tag}</td><td>${maxLabel(c)}</td><td>${increaseLabel(prev, c)}</td></tr>`;
}).join("");
