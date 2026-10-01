// DUP (Daily Undulating Periodization)
(() => {
  const SCHEME = { 85: [3, 6], 80: [4, 5], 70: [8, 3], 65: [9, 3], 60: [10, 3] };
  const c = (p) => ({ p, r: SCHEME[p][0], s: SCHEME[p][1] });
  // [week][day] = [s, b, d] の強度%
  const T = [
    [[80, 70, 60], [60, 80, 70]],
    [[70, 65, 85], [85, 70, 65]],
    [[65, 85, 70], [70, 65, 85]],
    [[80, 70, 60], [60, 80, 70]],
  ];
  const template = T.map((w) => w.map((d) => d.map(c)));
  const ps = Object.keys(SCHEME).map(Number).sort((a, b) => b - a), schemeCells = ps.map(c);
  PROGRAMS.dup = {
    id: "dup", name: "DUP (Daily Undulating Periodization)", page: "programs/dup.html", template,
    schemeRows: () => schemeCells,
    validate() {
      const cells = template.flat(2), loads = cells.map(load), days = template.flat().map((d) => d.reduce((s, x) => s + load(x), 0)), reps = schemeCells.map((x) => x.r);
      return [
        [`rep ${Math.min(...reps)}〜${Math.max(...reps)}(3〜10の範囲内)`, Math.min(...reps) >= 3 && Math.max(...reps) <= 10],
        ["2day/週 x 4週間", template.length === 4 && template.every((w) => w.length === 2)],
        ["3種目がすべて重い日がない(各dayに80%以上は最大1種目)", template.flat().every((d) => d.filter((x) => x.p >= 80).length <= 1)],
        [`セルの総負荷ゆらぎ: ${Math.min(...loads).toFixed(2)}〜${Math.max(...loads).toFixed(2)}(最小/最大 = ${(ratio(loads) * 100).toFixed(0)}%)`, ratio(loads) >= 0.8],
        [`dayの合計: ${Math.min(...days).toFixed(2)}〜${Math.max(...days).toFixed(2)}(最小/最大 = ${(ratio(days) * 100).toFixed(0)}%)`, ratio(days) >= 0.8],
        ["強度が高いほど総負荷が少ない(単調)", schemeCells.every((x, i) => i === 0 || load(x) > load(schemeCells[i - 1]))],
      ];
    },
    validateRounded(max) {
      const out = [];
      LIFTS.forEach((l) => {
        const tl = schemeCells.map((x) => kgLoad(x, max[l]));
        out.push([`${SHORT[l]}: 丸め後の総負荷(kg x r x s) ${Math.min(...tl)}〜${Math.max(...tl)}(最小/最大 = ${(ratio(tl) * 100).toFixed(0)}%)`, ratio(tl) >= 0.8]);
        out.push([`${SHORT[l]}: 丸め後も強度が高いほど総負荷が少ない(強度85→60%: ${tl.join(" < ")})`, tl.every((v, i) => i === 0 || v > tl[i - 1])]);
      });
      out.push([`全重量が${UNIT}kg単位`, LIFTS.every((l) => schemeCells.every((x) => kgOf(x, max[l]) % UNIT === 0))]);
      return out.map(([t, ok]) => [`(丸め後) ${t}`, ok]);
    },
  };
})();
