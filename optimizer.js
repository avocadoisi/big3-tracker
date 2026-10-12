// 最適化ロジック。DOM非依存(common.js の load/kgLoad/ratio/round を使用)。
const OPT = { P: [85, 80, 70, 65, 60], R: [3, 10], S: [3, 6], MIN_RATIO: 0.8, BASE: { 85: [3, 6], 80: [4, 5], 70: [8, 3], 65: [9, 3], 60: [10, 3] } };
const BASE_T = [[80, 70, 60], [60, 80, 70], [70, 65, 85], [85, 70, 65], [65, 85, 70], [70, 65, 85], [80, 70, 60], [60, 80, 70]];
const mono = (a) => a.every((v, i) => i === 0 || v > a[i - 1]);

// スキーム(強度ごとの rep x set)を単調鎖の枝刈りDFSで厳密に探索する。
// 満たすチェック数(丸め後を含む)最大、同点は基準表との差が小さいものを返す。
function checkScheme(scheme, lifts, max) {
  const loads = scheme.map(load), checks = [
    [`rep ${OPT.R[0]}〜${OPT.R[1]}、set ${OPT.S[0]}〜${OPT.S[1]}の範囲内`, scheme.every((c) => c.r >= OPT.R[0] && c.r <= OPT.R[1] && c.s >= OPT.S[0] && c.s <= OPT.S[1])],
    [`セルの総負荷 最小/最大 = ${(ratio(loads) * 100).toFixed(0)}%`, ratio(loads) >= OPT.MIN_RATIO],
    ["強度が高いほど総負荷が少ない(単調)", mono(loads)],
    ["強度が下がるほど rep 非減少・set 非増加", scheme.every((c, i) => i === 0 || (c.r >= scheme[i - 1].r && c.s <= scheme[i - 1].s))],
  ];
  lifts.forEach((l) => {
    const tl = scheme.map((c) => kgLoad(c, max[l]));
    checks.push([`(丸め後) ${SHORT[l]}: 総負荷 最小/最大 = ${(ratio(tl) * 100).toFixed(0)}%`, ratio(tl) >= OPT.MIN_RATIO]);
    checks.push([`(丸め後) ${SHORT[l]}: 強度が高いほど総負荷が少ない`, mono(tl)]);
  });
  return checks;
}
function bestScheme(lifts, max) {
  const cands = [];
  for (let r = OPT.R[0]; r <= OPT.R[1]; r++) for (let s = OPT.S[0]; s <= OPT.S[1]; s++) cands.push([r, s]);
  const baseDist = (scheme) => scheme.reduce((d, c) => d + Math.abs(c.r - OPT.BASE[c.p][0]) + Math.abs(c.s - OPT.BASE[c.p][1]), 0);
  let best = null;
  const eps = [];
  // 85%から60%へ。rep非減少・set非増加・総負荷増加で枝刈り。
  (function dfs(i, acc) {
    if (i === OPT.P.length) { eps.push(acc.slice()); return; }
    for (const [r, s] of cands) {
      const c = { p: OPT.P[i], r, s }, prev = acc[i - 1];
      if (prev && !(r >= prev.r && s <= prev.s && load(c) > load(prev))) continue;
      acc.push(c); dfs(i + 1, acc); acc.pop();
    }
  })(0, []);
  // 単調鎖が見つかる場合のみ。無ければ基準表を採用。
  const pool = eps.length ? eps : [OPT.P.map((p) => ({ p, r: OPT.BASE[p][0], s: OPT.BASE[p][1] }))];
  for (const sch of pool) {
    const checks = checkScheme(sch, lifts, max), n = checks.filter((x) => x[1]).length, d = baseDist(sch);
    if (!best || n > best.n || (n === best.n && d < best.d)) best = { sch, checks, n, d };
  }
  return best;
}

// 配置: 山登り法(近似)。day内80%以上は最大1種目、day合計の比≥0.8、強度の偏りを小さく、基準表に近づける。
function placementScore(grid, scheme, k) {
  const byP = Object.fromEntries(scheme.map((c) => [c.p, c]));
  let pen = 0;
  const days = grid.map((d) => d.reduce((s, p) => s + load(byP[p]), 0));
  grid.forEach((d) => { pen += Math.max(0, d.filter((p) => p >= 80).length - 1) * 1000; });
  if (ratio(days) < OPT.MIN_RATIO) pen += 500 + (OPT.MIN_RATIO - ratio(days)) * 1000;
  for (let l = 0; l < k; l++) { const cnt = OPT.P.map((p) => grid.filter((d) => d[l] === p).length); pen += (Math.max(...cnt) - Math.min(...cnt)) * 5; }
  grid.forEach((d, s) => d.forEach((p, l) => { if (p !== (BASE_T[s % BASE_T.length][l])) pen += 1; }));
  return pen;
}
function placeCells(scheme, k, n) {
  let grid = Array.from({ length: n }, (_, s) => Array.from({ length: k }, (_, l) => BASE_T[s % BASE_T.length][l]));
  let cur = placementScore(grid, scheme, k), improved = true;
  while (improved) {
    improved = false;
    for (let s = 0; s < n; s++) for (let l = 0; l < k; l++) for (const p of OPT.P) {
      if (grid[s][l] === p) continue;
      const old = grid[s][l]; grid[s][l] = p;
      const sc = placementScore(grid, scheme, k);
      if (sc < cur) { cur = sc; improved = true; } else grid[s][l] = old;
    }
  }
  return grid;
}

function generatePlan(lifts, max, sessions) {
  const { sch, checks } = bestScheme(lifts, max), byP = Object.fromEntries(sch.map((c) => [c.p, c]));
  const grid = placeCells(sch, lifts.length, sessions), cells = grid.map((d) => d.map((p) => byP[p]));
  const days = cells.map((d) => d.reduce((s, c) => s + load(c), 0));
  const extra = [
    [`2day/週 x ${sessions / 2}週間`, true],
    ["各dayに80%以上は最大1種目", cells.every((d) => d.filter((c) => c.p >= 80).length <= 1)],
    [`dayの合計 最小/最大 = ${(ratio(days) * 100).toFixed(0)}%`, ratio(days) >= OPT.MIN_RATIO],
  ];
  return { sessions: cells, scheme: sch, checks: checks.concat(extra) };
}
