// 共通ヘルパ。方式(program)は programs/*.js が PROGRAMS に登録する。
const $ = (id) => document.getElementById(id);
const PROGRAMS = {};
const LIFTS = ["squat", "bench", "deadlift"], CODES = { S: "squat", B: "bench", D: "deadlift" }, SHORT = { squat: "S", bench: "B", deadlift: "D" };
const UNIT = 2.5, round = (kg) => Math.round(kg / UNIT) * UNIT;
const ratio = (a) => Math.min(...a) / Math.max(...a);
const load = (c) => (c.p * c.r * c.s) / 100;               // template上の総負荷 (% x r x s / 100)
const kgOf = (c, max) => round((max * c.p) / 100);          // 丸め後の重量
const kgLoad = (c, max) => kgOf(c, max) * c.r * c.s;        // 丸め後の総負荷 (kg x r x s)
const head = "<tr><th>week</th><th>day</th><th>s</th><th>b</th><th>d</th></tr>";
// program.template[week][day][liftIndex] = { p, r, s }
function rows(program, weekLabel, cellLabel) {
  return program.template.map((days, w) => days.map((cells, d) => `<tr>${d === 0 ? `<th rowspan="${days.length}">${weekLabel(w)}</th>` : ""}<th>day${d + 1}</th>${cells.map((c, i) => `<td>${cellLabel(c, i)}</td>`).join("")}</tr>`).join("")).join("");
}
function loadMax(base = "") {
  return fetch(`${base}data.csv`).then((r) => r.text()).then((text) => {
    const max = {};
    text.trim().split(/\r?\n/).slice(1).forEach((line) => { const [, c, kg] = line.split(",").map((v) => v.trim()); if (CODES[c] && kg !== "") max[CODES[c]] = Math.max(max[CODES[c]] || 0, Number(kg)); });
    return max;
  });
}
const li = (items) => items.map(([t, ok]) => `<li>${ok ? "OK" : "NG"}: ${t}</li>`).join("");
// 方式ページ(programs/*.html)の共通描画。program.validate(max) が検証結果を返す。
function renderProgramPage(program) {
  $("template-table").innerHTML = head + rows(program, (w) => `week${w + 1}`, (c) => `${c.p}% x ${c.r}r x ${c.s}s = ${load(c).toFixed(2)}`);
  $("scheme-table").innerHTML = "<tr><th>強度</th><th>rep x set</th><th>総負荷</th></tr>" + program.schemeRows().map((c) => `<tr><td>${c.p}%</td><td>${c.r}r x ${c.s}s</td><td>${load(c).toFixed(2)}</td></tr>`).join("");
  $("checks").innerHTML = li(program.validate());
  loadMax("../").then((max) => { $("checks").innerHTML += li(program.validateRounded(max)); }).catch(() => { $("checks").innerHTML += "<li>NG: data.csv の読み込みに失敗(丸め後の検証不可)</li>"; });
}
