// DUPシミュレータのUI。計算は optimizer.js に分離。
const DEFAULT_MAX = { squat: 150, bench: 100, deadlift: 180 };
function readInput() {
  const lifts = LIFTS.filter((l) => document.querySelector(`input[name=lift][value=${l}]`).checked);
  const max = {}; lifts.forEach((l) => { max[l] = Number($(`max-${l}`).value); });
  return { lifts, max, sessions: Number($("sessions").value) };
}
function run() {
  const { lifts, max, sessions } = readInput();
  if (!lifts.length) return void ($("sim-message").textContent = "種目を1つ以上選んでください。");
  if (lifts.some((l) => !(max[l] > 0))) return void ($("sim-message").textContent = "maxを入力してください。");
  if (!(sessions >= 2 && sessions <= 16 && sessions % 2 === 0)) return void ($("sim-message").textContent = "生成数は2〜16の偶数にしてください。");
  $("sim-message").textContent = "";
  renderResult(generatePlan(lifts, max, sessions), lifts, max);
}
function renderResult(plan, lifts, max) {
  const day = (s) => `week${Math.floor(s / 2) + 1} day${(s % 2) + 1}`;
  $("sim-table").innerHTML = `<tr><th>session</th>${lifts.map((l) => `<th>${SHORT[l]}</th>`).join("")}</tr>` +
    plan.sessions.map((cells, s) => `<tr><th>${day(s)}</th>${cells.map((c, i) => `<td>${kgOf(c, max[lifts[i]])}kg x ${c.r}r x ${c.s}s <small>(${c.p}%)</small></td>`).join("")}</tr>`).join("");
  $("sim-checks").innerHTML = li(plan.checks);
}
loadMax().then((m) => Object.assign(DEFAULT_MAX, m)).catch(() => {}).then(() => {
  LIFTS.forEach((l) => { $(`max-${l}`).value = DEFAULT_MAX[l]; });
  run();
});
$("sim-form").addEventListener("submit", (e) => { e.preventDefault(); run(); });
