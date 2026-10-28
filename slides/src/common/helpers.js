/* ───────── helpers shared by several modules ───────── */
const erf = x => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
const corr = (a, b) => { const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db); };

const heat = (v, lo, hi) => { // sequential: well → accent
  const t = clamp((v - lo) / (hi - lo || 1), 0, 1); return `color-mix(in srgb, ${css("--accent")} ${Math.round(t * 100)}%, ${css("--well")})`; };
const div = (v, m) => { // diverging around zero
  const t = clamp(Math.abs(v) / (m || 1), 0, 1); return `color-mix(in srgb, ${css(v >= 0 ? "--pos" : "--neg")} ${Math.round(t * 85)}%, ${css("--well")})`; };
function gridSVG(host, M, { cell = 26, colorFn, label = true, hi = null, onCell = null, digits = 0 } = {}) {
  const R = M.length, C = M[0].length, svg = svgIn(host, C * cell + 2, R * cell + 2);
  M.forEach((row, i) => row.forEach((v, j) => {
    const g = el("g", onCell ? { style: "cursor:pointer" } : {}, svg);
    el("rect", { x: 1 + j * cell, y: 1 + i * cell, width: cell - 2, height: cell - 2, rx: 4, fill: colorFn(v), stroke: hi && hi(i, j) ? css("--fg") : "none", "stroke-width": 2 }, g);
    if (label) el("text", { x: 1 + j * cell + cell / 2 - 1, y: 1 + i * cell + cell / 2 + 4, "text-anchor": "middle", "font-size": cell > 30 ? 12 : 10, class: "mono" }, g, fmt(v, digits));
    if (onCell) { g.addEventListener("mouseenter", () => onCell(i, j)); g.addEventListener("click", () => onCell(i, j)); }
  }));
  return svg;
}
function solve(A, b) { // Gaussian elimination with partial pivoting (small systems)
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) continue; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => Math.abs(r[i]) < 1e-12 ? 0 : r[n] / r[i]);
}
const arrowDefs = (svg, id, color) => { el("defs", {}, svg).innerHTML = `<marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" fill="${color}"/></marker>`; };
function bindQuiz(hostSel, scoreSel, Q, opts) {
  const host = $(hostSel), ans = {};
  Q.forEach(([name, right, why], i) => {
    const row = document.createElement("div"); row.className = "q";
    row.innerHTML = `<div><b style="font-weight:500"></b></div><div class="opts">${opts.map(o => `<button class="chip" type="button" data-o="${o}" aria-pressed="false" style="padding:4px 10px;font-size:12.5px">${o}</button>`).join("")}</div><div class="fb" hidden></div>`;
    row.querySelector("b").textContent = name;
    const bs = $$("button", row);
    bs.forEach(b => b.addEventListener("click", () => {
      press(bs, b); ans[i] = b.dataset.o === right; row.classList.toggle("right", ans[i]); row.classList.toggle("wrong", !ans[i]);
      const fb = row.querySelector(".fb"); fb.hidden = false; fb.textContent = (ans[i] ? "Yes. " : `No: ${right.toLowerCase()}. `) + why;
      $(scoreSel).textContent = `${Object.values(ans).filter(Boolean).length} / ${Object.keys(ans).length}`;
    }));
    host.appendChild(row);
  });
}

