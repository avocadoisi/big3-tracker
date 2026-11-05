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
function planTable(c) {
  const program = PROGRAMS[c.program];
  return program ? head + rows(program, (w) => weekLabel(w, c.start), (cell, i) => `${kgOf(cell, c.max[LIFTS[i]])}kg x ${cell.r}r x ${cell.s}s`, c.template || program.template) : "";
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

// サイクルの一覧(時代ごとの歩みの表)
$("cycle-table").innerHTML = "<tr><th>cycle</th><th>期間</th><th>max (S / B / D)</th><th>maxの増加</th></tr>" + [...CYCLES, nextCycle].map((c, i, all) => {
  const prev = i ? all[i - 1] : null;
  const end = shiftDays(shiftDays(c.start, CYCLE_WEEKS * 7), -1);
  const tag = c === currentCycle ? " (今回)" : c === nextCycle ? " (次回)" : "";
  return `<tr><td>cycle${c.cycle}</td><td>${slash(c.start)}〜${slash(end)}${tag}</td><td>${maxLabel(c)}</td><td>${increaseLabel(prev, c)}</td></tr>`;
}).join("");
