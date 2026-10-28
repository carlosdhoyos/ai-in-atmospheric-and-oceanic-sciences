/* ───────── shared example datasets (synthetic, seeded: every viewer sees the same numbers) ─────────
   DS.daily      365 days at a Medellín-like station: rain (mm/day), tmax (°C), bimodal rainy seasons (Apr–May, Oct–Nov)
   DS.monthly    60 months: rain (mm/month) and streamflow (m³/s) for a small Andean basin, with a dry El Niño year
   DS.mask       18 × 14 grid (north at the top) with a simplified outline of Colombia (1 = land)
   DS.elev       elevation (m) on that grid: three Andean cordilleras running SW → NE
   DS.temp       annual mean temperature (°C) on the grid: 28 °C minus a lapse rate of 6.5 °C/km
   DS.precip     annual precipitation (mm/yr) on the grid: Pacific coast very wet, Guajira dry, Amazon wet
   DS.students   20 students: absences, grade (0–5), estrato (1–6), municipality, rural, attrition (0/1)
   DS.sentence   the attention example sentence */
const DS = (() => {
  const r = rng(2026), doy = Array.from({ length: 365 }, (_, i) => i);
  const season = d => 0.5 + 0.5 * Math.cos(4 * Math.PI * (d - 120) / 365) * (0.8 + 0.2 * Math.cos(2 * Math.PI * (d - 290) / 365));
  const rain = doy.map(d => r() < 0.25 + 0.45 * season(d) ? -Math.log(1 - r()) * (6 + 10 * season(d)) : 0);
  const tmax = doy.map((d, i) => +(27.5 - 1.6 * season(d) - 0.08 * rain[i] + 0.9 * gauss(r)).toFixed(1));
  const mr = [], q = []; let store = 20;
  for (let m = 0; m < 60; m++) {
    const clim = 160 + 110 * Math.cos(4 * Math.PI * ((m % 12) - 4) / 12), nino = m >= 24 && m < 36 ? 0.45 : 1;
    const p = Math.max(5, clim * nino * (1 + 0.25 * gauss(r))); mr.push(Math.round(p));
    store = 0.82 * store + 0.06 * p; q.push(+store.toFixed(1));
  }
  const MASK = ["..........##..", "........####..", ".....#######..", "...#########..", "..##########..", "..###########.", ".############.", ".#############", ".#############",
    "..############", "..############", "..###########.", "...##########.", "....#########.", ".....######...", "......#####...", "........###...", ".........#...."];
  const mask = MASK.map(s => [...s].map(c => +(c === "#")));
  const ridges = [[[2, 15], [6, 3]], [[4, 15], [8, 2]], [[6, 13], [10, 3]]];
  const dseg = (x, y, [[x1, y1], [x2, y2]]) => { const dx = x2 - x1, dy = y2 - y1, t = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy); };
  const elev = mask.map((row, y) => row.map((m, x) => m ? Math.round(Math.max(...ridges.map((s, k) => [2600, 3000, 2800][k] * Math.exp(-(dseg(x, y, s) ** 2) / 0.9)), 40)) : 0));
  const temp = elev.map((row, y) => row.map((e, x) => mask[y][x] ? +(28 - 6.5 * e / 1000).toFixed(1) : null));
  const precip = mask.map((row, y) => row.map((m, x) => m ? Math.round(1800 + 6500 * Math.exp(-((x - 1) ** 2) / 1.6) * (y > 3 && y < 14 ? 1 : 0.3) + (y > 11 && x > 7 ? 1800 : 0) - (y < 3 ? 1300 : 0) + 250 * gauss(r)) : null));
  const munis = ["Medellín", "Bello", "Envigado", "Rionegro", "Turbo", "Apartadó", "Yarumal", "Caldas"];
  const students = Array.from({ length: 20 }, (_, i) => {
    const rural = ["Turbo", "Apartadó", "Yarumal"].includes(munis[i % 8]), abs = Math.round(clamp(4 + (rural ? 5 : 0) + 5 * gauss(r), 0, 30));
    const grade = +clamp(3.6 - 0.05 * abs + 0.4 * gauss(r), 1, 5).toFixed(1), estrato = clamp(Math.round((rural ? 1.6 : 2.8) + 1.1 * gauss(r)), 1, 6);
    const risk = sigm(-3 + 0.18 * abs - 0.9 * (grade - 3) - 0.25 * (estrato - 3) + (rural ? 0.6 : 0));
    return { id: i + 1, absences: abs, grade, estrato, municipality: munis[i % 8], rural, attrition: +(r() < risk) };
  });
  return { daily: { rain, tmax }, monthly: { rain: mr, streamflow: q }, mask, elev, temp, precip, students, sentence: ["the", "cat", "sat", "because", "it", "was", "tired"] };
})();
/* draw a gridded field (rows of numbers, null = ocean / no data) into an SVG inside host; returns the svg.
   onCell fires on click, and also on hover unless hover is false */
function fieldSVG(host, F, { cell = 16, color = v => heat(v, 0, 1), onCell = null, hi = null, label = false, digits = 0, hover = true } = {}) {
  const R = F.length, C = F[0].length, svg = svgIn(host, C * cell + 2, R * cell + 2);
  F.forEach((row, i) => row.forEach((v, j) => {
    const g = el("g", onCell ? { style: "cursor:pointer" } : {}, svg);
    el("rect", { x: 1 + j * cell, y: 1 + i * cell, width: cell - 1, height: cell - 1, rx: 2, fill: v == null ? "transparent" : color(v), stroke: hi && hi(i, j) ? css("--fg") : "none", "stroke-width": 2 }, g);
    if (label && v != null) el("text", { x: 1 + j * cell + cell / 2, y: 1 + i * cell + cell / 2 + 4, "text-anchor": "middle", "font-size": Math.min(11, cell * 0.4), class: "mono" }, g, fmt(v, digits));
    if (onCell) { if (hover) g.addEventListener("mouseenter", () => onCell(i, j)); g.addEventListener("click", () => onCell(i, j)); }
  }));
  return svg;
}
