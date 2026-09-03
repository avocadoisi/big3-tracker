const lifts = ["squat", "bench", "deadlift"];
const codes = { S: "squat", B: "bench", D: "deadlift" };
const shortCodes = { squat: "S", bench: "B", deadlift: "D" };
const labels = { total: "TOTAL", squat: "SQUAT", bench: "BENCH", deadlift: "DEADLIFT" };
const $ = (id) => document.getElementById(id);
let entries = [], milestones = [], selectedLift = "total";
function time(date) { return new Date(`${date}T12:00:00`).getTime(); }
function formatDate(date) { return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`)); }
function monthLabel(timestamp) { return new Intl.DateTimeFormat("ja-JP", { year: "2-digit", month: "2-digit" }).format(new Date(timestamp)); }
function sorted(items) { return [...items].sort((a, b) => time(a.date) - time(b.date)); }
function monthlyRecords(items) {
  const months = new Map();
  sorted(items).forEach((entry) => months.set(entry.date.slice(0, 7), entry));
  return [...months.values()];
}
function totalRecords(items, goals = false) {
  if (goals) { const byDate = new Map(); items.forEach((entry) => { if (!byDate.has(entry.date)) byDate.set(entry.date, {}); byDate.get(entry.date)[entry.lift] = entry; }); return [...byDate].flatMap(([date, values]) => lifts.every((lift) => values[lift]) ? [{ date, kg: lifts.reduce((sum, lift) => sum + values[lift].kg, 0), details: values }] : []); }
  const best = {}; return sorted(items).flatMap((entry) => { if (!best[entry.lift] || entry.kg > best[entry.lift].kg) best[entry.lift] = entry; return lifts.every((lift) => best[lift]) ? [{ date: entry.date, kg: lifts.reduce((sum, lift) => sum + best[lift].kg, 0), details: { ...best } }] : []; });
}
function recordsFor(items, lift, goals = false) { return lift === "total" ? totalRecords(items, goals) : sorted(items.filter((entry) => entry.lift === lift)); }
function renderSummary() { let total = 0, count = 0; lifts.forEach((lift) => { const records = recordsFor(entries, lift), current = records.at(-1), previous = records.at(-2), value = current?.kg; if (value != null) { total += value; count++; } $(`${lift}-current`).innerHTML = value != null ? `${value}<small>kg</small>` : `--<small>kg</small>`; $(`${lift}-change`).textContent = previous && value != null ? `${value - previous.kg >= 0 ? "+" : ""}${(value - previous.kg).toFixed(1)}kg` : ""; }); $("total-value").innerHTML = `${total}<span>kg</span>`; $("total-detail").textContent = count === 3 ? "LATEST" : ""; $("updated-label").textContent = entries.length ? `LAST ${formatDate(sorted(entries).at(-1).date).toUpperCase()}` : ""; }
function renderChart() {
  const records = monthlyRecords(recordsFor(entries, selectedLift)), goalRecords = monthlyRecords(recordsFor(milestones, selectedLift, true)), chart = $("progress-chart"), empty = $("empty-chart"); chart.innerHTML = ""; $("chart-title").textContent = labels[selectedLift]; if (!records.length && !goalRecords.length) { empty.hidden = false; empty.textContent = "NO DATA"; return; } empty.hidden = true;
  const now = Date.now(), all = [...records, ...goalRecords], values = all.map((entry) => entry.kg), start = new Date(Math.min(...all.map((entry) => time(entry.date)), now)), end = new Date(Math.max(...all.map((entry) => time(entry.date)), now)); start.setDate(1); end.setMonth(end.getMonth() + 1, 1); const first = start.getTime(), last = end.getTime(), width = 720, height = 280, pad = { top: 18, right: 16, bottom: 32, left: 43 }, low = Math.max(0, Math.floor((Math.min(...values) - 1) / 25) * 25), high = Math.ceil((Math.max(...values) + 1) / 25) * 25 || 25, x = (date) => pad.left + ((time(date) - first) / (last - first)) * (width - pad.left - pad.right), xTime = (stamp) => pad.left + ((stamp - first) / (last - first)) * (width - pad.left - pad.right), y = (value) => pad.top + (high - value) * ((height - pad.top - pad.bottom) / (high - low)); let svg = "";
  for (let value = low; value <= high; value += 25) { const py = y(value); svg += `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${py}" y2="${py}"/><text class="axis-label" x="0" y="${py + 4}">${value}</text>`; }
  const monthCount = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth(); const labelStep = Math.max(1, Math.ceil(monthCount / 8)); let monthIndex = 0;
  for (const month = new Date(start); month < end; month.setMonth(month.getMonth() + 1)) { if (monthIndex % labelStep === 0) svg += `<text class="axis-label" text-anchor="middle" x="${xTime(month.getTime())}" y="${height - 4}">${monthLabel(month.getTime())}</text>`; monthIndex++; }
  const nowX = xTime(now); svg += `<line class="today-line" x1="${nowX}" x2="${nowX}" y1="${pad.top}" y2="${height - pad.bottom}"/>`; const color = selectedLift === "total" ? "squat" : selectedLift, line = records.map((entry) => `${x(entry.date)},${y(entry.kg)}`); if (line.length > 1) svg += `<polyline class="line-${color}" points="${line.join(" ")}"/>`; records.forEach((entry) => { svg += `<circle class="dot-${color}" cx="${x(entry.date)}" cy="${y(entry.kg)}" r="4"/>`; }); goalRecords.forEach((entry) => { const px = x(entry.date), py = y(entry.kg); svg += `<rect class="milestone" x="${px - 5}" y="${py - 5}" width="10" height="10" transform="rotate(45 ${px} ${py})"/>`; }); chart.innerHTML = svg;
}
function parseCsv(text) { return text.trim().split(/\r?\n/).slice(1).map((line) => line.split(",").map((value) => value.trim())).filter(([date, code, kg]) => date && codes[code] && kg !== "").map(([date, code, kg]) => ({ date, code, lift: codes[code], kg: Number(kg) })).filter((entry) => Number.isFinite(entry.kg)); }
document.querySelectorAll(".chart-tab").forEach((button) => button.addEventListener("click", () => { selectedLift = button.dataset.lift; document.querySelectorAll(".chart-tab").forEach((tab) => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active); }); renderChart(); }));
Promise.all([fetch("data.csv"), fetch("milestones.csv")]).then(async ([data, goals]) => { if (!data.ok || !goals.ok) throw new Error("DATA ERROR"); return [await data.text(), await goals.text()]; }).then(([dataText, goalsText]) => { entries = parseCsv(dataText); milestones = parseCsv(goalsText); renderSummary(); renderChart(); }).catch((error) => { $("empty-chart").textContent = error.message; $("empty-chart").hidden = false; });
