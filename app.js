const lifts = ["squat", "bench", "deadlift"];
const codes = { S: "squat", B: "bench", D: "deadlift" };
const labels = { total: "TOTAL", squat: "SQUAT", bench: "BENCH", deadlift: "DEADLIFT" };
const $ = (id) => document.getElementById(id);
let entries = [];
let milestones = [];
let selectedLift = "total";

function formatDate(date) { return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(date.length === 10 ? `${date}T00:00:00` : date)); }
function sorted(items) { return [...items].sort((a, b) => new Date(a.date) - new Date(b.date)); }

function totalRecords(items) {
  const byDate = new Map();
  items.forEach((entry) => { if (!byDate.has(entry.date)) byDate.set(entry.date, {}); byDate.get(entry.date)[entry.lift] = entry.kg; });
  return [...byDate].map(([date, values]) => lifts.every((lift) => values[lift] != null) ? { date, kg: lifts.reduce((sum, lift) => sum + values[lift], 0) } : null).filter(Boolean);
}

function recordsFor(items, lift) { return lift === "total" ? totalRecords(items) : sorted(items.filter((entry) => entry.lift === lift)); }
function latest(lift) { return recordsFor(entries, lift).at(-1); }

function renderSummary() {
  let total = 0; let count = 0;
  lifts.forEach((lift) => {
    const records = recordsFor(entries, lift); const current = records.at(-1); const previous = records.at(-2); const value = current?.kg;
    if (value != null) { total += value; count++; }
    $(`${lift}-current`).innerHTML = value != null ? `${value}<small>kg</small>` : `--<small>kg</small>`;
    $(`${lift}-change`).textContent = previous && value != null ? `${value - previous.kg >= 0 ? "+" : ""}${(value - previous.kg).toFixed(1)}kg` : "";
  });
  $("total-value").innerHTML = `${total}<span>kg</span>`;
  $("total-detail").textContent = count === 3 ? "LATEST" : "";
  $("updated-label").textContent = entries.length ? `LAST ${formatDate(sorted(entries).at(-1).date).toUpperCase()}` : "";
}

function renderChart() {
  const records = recordsFor(entries, selectedLift); const goalRecords = recordsFor(milestones, selectedLift); const dates = [...new Set([...records, ...goalRecords].map((entry) => entry.date))].sort(); const chart = $("progress-chart"); const empty = $("empty-chart"); chart.innerHTML = "";
  $("chart-title").textContent = labels[selectedLift];
  if (dates.length < 2) { empty.hidden = false; empty.textContent = "NO DATA"; return; }
  empty.hidden = true;
  const width = 720, height = 280, pad = { top: 14, right: 16, bottom: 32, left: 43 }; const values = [...records, ...goalRecords].map((entry) => entry.kg);
  const low = Math.max(0, Math.floor((Math.min(...values) - 10) / 10) * 10); const high = Math.ceil((Math.max(...values) + 10) / 10) * 10 || 10;
  const x = (i) => pad.left + i * ((width - pad.left - pad.right) / (dates.length - 1)); const y = (value) => pad.top + (high - value) * ((height - pad.top - pad.bottom) / (high - low)); let svg = "";
  for (let i = 0; i <= 4; i++) { const value = low + ((high - low) * i / 4); const py = y(value); svg += `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${py}" y2="${py}"/><text class="axis-label" x="0" y="${py + 4}">${Math.round(value)}</text>`; }
  dates.forEach((date, i) => { svg += `<text class="axis-label" text-anchor="middle" x="${x(i)}" y="${height - 4}">${formatDate(date)}</text>`; });
  const colorClass = selectedLift === "total" ? "squat" : selectedLift; const points = records.map((entry) => `${x(dates.indexOf(entry.date))},${y(entry.kg)}`); svg += `<polyline class="line-${colorClass}" points="${points.join(" ")}"/>`; records.forEach((entry) => { svg += `<circle class="dot-${colorClass}" cx="${x(dates.indexOf(entry.date))}" cy="${y(entry.kg)}" r="4"/>`; });
  goalRecords.forEach((entry) => { const px = x(dates.indexOf(entry.date)); const py = y(entry.kg); svg += `<rect class="milestone" x="${px - 5}" y="${py - 5}" width="10" height="10" transform="rotate(45 ${px} ${py})"><title>目標: ${entry.kg}kg (${entry.date})</title></rect>`; }); chart.innerHTML = svg;
}

function parseCsv(text) { return text.trim().split(/\r?\n/).slice(1).map((line) => line.split(",").map((value) => value.trim())).filter(([date, code, kg]) => date && codes[code] && kg !== "").map(([date, code, kg]) => ({ date, code, lift: codes[code], kg: Number(kg) })).filter((entry) => Number.isFinite(entry.kg)); }
document.querySelectorAll(".chart-tab").forEach((button) => button.addEventListener("click", () => { selectedLift = button.dataset.lift; document.querySelectorAll(".chart-tab").forEach((tab) => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active); }); renderChart(); }));

Promise.all([fetch("data.csv"), fetch("milestones.csv")])
  .then(async ([dataResponse, milestonesResponse]) => { if (!dataResponse.ok) throw new Error("data.csv を読み込めませんでした"); if (!milestonesResponse.ok) throw new Error("milestones.csv を読み込めませんでした"); return [await dataResponse.text(), await milestonesResponse.text()]; })
  .then(([dataText, milestonesText]) => { entries = parseCsv(dataText); milestones = parseCsv(milestonesText); renderSummary(); renderChart(); })
  .catch((error) => { $("empty-chart").textContent = error.message; $("empty-chart").hidden = false; });
