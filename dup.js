const $ = (id) => document.getElementById(id);
const START = "2026-10-05";
const SCHEME = { 85: [3, 6], 80: [4, 5], 70: [8, 3], 65: [9, 3], 60: [10, 3] };
// [week][day] = [s, b, d] intensity
const TEMPLATE = [
  [[80, 70, 60], [60, 80, 70]],
  [[70, 65, 85], [85, 70, 65]],
  [[65, 85, 70], [70, 65, 85]],
  [[80, 70, 60], [60, 80, 70]],
];
const LIFTS = ["squat", "bench", "deadlift"], CODES = { S: "squat", B: "bench", D: "deadlift" };
const load = (p) => { const [r, s] = SCHEME[p]; return (p * r * s) / 100; };
const tCell = (p) => { const [r, s] = SCHEME[p]; return `${p}% x ${r}r x ${s}s = ${load(p).toFixed(2)}`; };
const round = (kg) => Math.round(kg / 2.5) * 2.5;
const pCell = (p, max) => { const [r, s] = SCHEME[p], kg = round((max * p) / 100); return `${kg}kg x ${r}r x ${s}s = ${kg * r * s}`; };
const head = "<tr><th>week</th><th>day</th><th>s</th><th>b</th><th>d</th></tr>";
function rows(fn) { return TEMPLATE.map((days, w) => days.map((ints, d) => `<tr>${d === 0 ? `<th rowspan="2">${fn.week(w)}</th>` : ""}<th>day${d + 1}</th>${ints.map((p, i) => `<td>${fn.cell(p, i)}</td>`).join("")}</tr>`).join("")).join(""); }
function weekLabel(w) { const d = new Date(`${START}T12:00:00`); d.setDate(d.getDate() + w * 7); return `week${w + 1}<br><small>${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}〜</small>`; }

$("template-table").innerHTML = head + rows({ week: (w) => `week${w + 1}`, cell: (p) => tCell(p) });
$("scheme-table").innerHTML = "<tr><th>強度</th><th>rep x set</th><th>総負荷</th></tr>" + Object.keys(SCHEME).sort((a, b) => b - a).map((p) => `<tr><td>${p}%</td><td>${SCHEME[p][0]}r x ${SCHEME[p][1]}s</td><td>${load(p).toFixed(2)}</td></tr>`).join("");

const cells = TEMPLATE.flat(2), loads = cells.map(load), dayTotals = TEMPLATE.flat().map((d) => d.reduce((s, p) => s + load(p), 0));
const ps = Object.keys(SCHEME).map(Number).sort((a, b) => b - a);
const reps = Object.values(SCHEME).map((v) => v[0]);
const ratio = (a) => Math.min(...a) / Math.max(...a);
const checks = [
  [`rep ${Math.min(...reps)}〜${Math.max(...reps)}(3〜10の範囲内)`, Math.min(...reps) >= 3 && Math.max(...reps) <= 10],
  ["2day/週 x 4週間", TEMPLATE.length === 4 && TEMPLATE.every((w) => w.length === 2)],
  ["3種目がすべて重い日がない(各dayに85/80%は最大1種目)", TEMPLATE.flat().every((d) => d.filter((p) => p >= 80).length <= 1)],
  [`セルの総負荷ゆらぎ: ${Math.min(...loads).toFixed(2)}〜${Math.max(...loads).toFixed(2)}(最小/最大 = ${(ratio(loads) * 100).toFixed(0)}%)`, ratio(loads) >= 0.8],
  [`dayの合計: ${Math.min(...dayTotals).toFixed(2)}〜${Math.max(...dayTotals).toFixed(2)}(最小/最大 = ${(ratio(dayTotals) * 100).toFixed(0)}%)`, ratio(dayTotals) >= 0.8],
  ["強度が高いほど総負荷が少ない(単調)", ps.every((p, i) => i === 0 || load(p) > load(ps[i - 1]))],
];
$("checks").innerHTML = checks.map(([t, ok]) => `<li>${ok ? "OK" : "NG"}: ${t}</li>`).join("");

fetch("data.csv").then((r) => r.text()).then((text) => {
  const max = {};
  text.trim().split(/\r?\n/).slice(1).forEach((line) => { const [, c, kg] = line.split(",").map((v) => v.trim()); if (CODES[c] && kg !== "") max[CODES[c]] = Math.max(max[CODES[c]] || 0, Number(kg)); });
  $("base-info").innerHTML = `基準日: ${START.replaceAll("-", "/")} (Mon) = cycle1 / week1 / day1<br>現時点のmax: S ${max.squat}kg / B ${max.bench}kg / D ${max.deadlift}kg(data.csvの最大値を1RMとして使用)<br>セルは「kg x rep x set = 総負荷(kg)」`;
  $("plan-table").innerHTML = head + rows({ week: weekLabel, cell: (p, i) => pCell(p, max[LIFTS[i]]) });
}).catch(() => { $("base-info").textContent = "data.csv の読み込みに失敗しました"; });
