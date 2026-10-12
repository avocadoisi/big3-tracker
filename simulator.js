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
  if (lifts.some((l) => !(max[l] > 0 && max[l] <= 400))) return void ($("sim-message").textContent = "maxは0より大きく400以下で入力してください。");
  if (!(Number.isInteger(sessions) && sessions >= 1 && sessions <= 32)) return void ($("sim-message").textContent = "生成数は1〜32の整数にしてください。");
  $("sim-message").textContent = "";
  renderResult(generatePlan(lifts, max, sessions, Object.fromEntries(lifts.map((l) => [l, $(`name-${l}`).value.trim() || SHORT[l]]))), lifts, max);
}
function renderResult(plan, lifts, max) {
  const name = (l) => $(`name-${l}`).value.trim() || SHORT[l];
  $("sim-table").innerHTML = `<tr><th>session</th>${lifts.map((l) => `<th>${name(l)}</th>`).join("")}</tr>` +
    plan.sessions.map((cells, s) => `<tr><th>day${s + 1}</th>${cells.map((c, i) => `<td>${kgOf(c, max[lifts[i]])}kg x ${c.r}r x ${c.s}s <small>(${c.p}%)</small></td>`).join("")}</tr>`).join("");
  $("sim-checks").innerHTML = li(plan.checks);
}
loadMax().then((m) => Object.assign(DEFAULT_MAX, m)).catch(() => {}).then(() => {
  LIFTS.forEach((l) => { $(`max-${l}`).value = DEFAULT_MAX[l]; });
  run();
});
$("sim-form").addEventListener("submit", (e) => { e.preventDefault(); run(); });
