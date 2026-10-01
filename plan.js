// 現在採用している方式。切り替えるときは programs/<id>.js を追加して、この定数と plan.html のscriptを変える。
const CURRENT = "dup";
const START = "2026-10-05"; // cycle1 / week1 / day1

const program = PROGRAMS[CURRENT];
function weekLabel(w) { const d = new Date(`${START}T12:00:00`); d.setDate(d.getDate() + w * 7); return `week${w + 1}<br><small>${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}〜</small>`; }

$("program-info").innerHTML = `現在の方式: <a href="${program.page}">${program.name}</a>(組み方・template・ルールはリンク先)`;
loadMax().then((max) => {
  $("base-info").innerHTML = `基準日: ${START.replaceAll("-", "/")} (Mon) = cycle1 / week1 / day1<br>現時点のmax: S ${max.squat}kg / B ${max.bench}kg / D ${max.deadlift}kg(data.csvの最大値を1RMとして使用)<br>セルは「kg x rep x set」`;
  $("plan-table").innerHTML = head + rows(program, weekLabel, (c, i) => `${kgOf(c, max[LIFTS[i]])}kg x ${c.r}r x ${c.s}s`);
}).catch(() => { $("base-info").textContent = "data.csv の読み込みに失敗しました"; });
