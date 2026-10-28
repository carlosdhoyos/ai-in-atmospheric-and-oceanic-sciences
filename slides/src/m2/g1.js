/* ═════════ Module 2 · group g1: weighted sum, element-wise, activations, softmax, dense ═════════ */

/* 01 · weighted sum (the neuron) */
demo("op-wsum", () => {
  const ga = chips($("#g1wsAct"), () => render());
  const ids = ["g1wsX1", "g1wsX2", "g1wsW1", "g1wsW2", "g1wsB"], g = ids.map(id => slider(id, v => fmt(v, id.includes("X") ? 2 : 1), () => render()));
  const EX = [0.8, 0.5, 2, 3, -2];
  $("#g1wsReset").onclick = () => ids.forEach((id, k) => { const s = $("#" + id); s.value = EX[k]; s.dispatchEvent(new Event("input")); });
  // 60 synthetic days: humidity and pressure drop (both scaled 0–1); rain when 2h + 3p − 2 plus noise is positive
  const r = rng(101), days = Array.from({ length: 60 }, () => { const h = r(), p = r(); return { h, p, rain: 2 * h + 3 * p - 2 + 0.7 * gauss(r) > 0 }; });
  function render() {
    const [x1, x2, w1, w2, b] = g.map(f => f()), sig = ga() === "sig", z = w1 * x1 + w2 * x2 + b, p = sigm(z);
    const wc = w => css(w >= 0 ? "--pos" : "--neg");
    /* neuron diagram */
    const W = 520, H = 200, svg = svgIn($("#g1wsFig"), W, H); arrowDefs(svg, "g1wsAr", css("--muted"));
    const ins = [[70, 50, x1, w1, "humidity", "w₁"], [70, 150, x2, w2, "pressure drop", "w₂"]];
    ins.forEach(([cx, cy, v, w, , wl]) => {
      el("line", { x1: cx + 24, y1: cy, x2: 232, y2: 100, stroke: wc(w), "stroke-width": 0.8 + 1.6 * Math.abs(w), opacity: Math.abs(w) < 0.05 ? .25 : .85, "stroke-linecap": "round" }, svg);
      el("text", { x: 168, y: cy < 100 ? cy + 6 : cy + 4, "text-anchor": "middle", class: "mono", style: `font-size:${12}px`, fill: wc(w) }, svg, `${wl} = ${fmt(w, 1)}`);
    });
    ins.forEach(([cx, cy, v, , lbl]) => {
      el("circle", { cx, cy, r: 24, fill: css("--card"), stroke: css("--data") }, svg);
      el("text", { x: cx, y: cy + 5, "text-anchor": "middle", class: "mono", style: `font-size:${13 }px`}, svg, fmt(v, 2));
      el("text", { x: cx, y: cy + (cy < 100 ? -32 : 40), "text-anchor": "middle", class: "mut", style: `font-size:${11.5 }px`}, svg, lbl);
    });
    el("circle", { cx: 260, cy: 100, r: 28, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
    el("text", { x: 260, y: 96, "text-anchor": "middle", style: `font-size:${18 }px`}, svg, "Σ");
    el("text", { x: 260, y: 116, "text-anchor": "middle", class: "mono", style: `font-size:${12 }px`}, svg, fmt(z, 2));
    el("text", { x: 260, y: 150, "text-anchor": "middle", class: "mut", style: `font-size:${11.5 }px`}, svg, "+ b = " + fmt(b, 1));
    el("line", { x1: 290, y1: 100, x2: 340, y2: 100, stroke: css("--muted"), "marker-end": "url(#g1wsAr)" }, svg);
    el("rect", { x: 344, y: 74, width: 70, height: 52, rx: 10, fill: css("--card"), stroke: css("--line") }, svg);
    const fx = Array.from({ length: 41 }, (_, i) => -4 + i * 0.2);
    el("path", { d: path(fx.map(v => [379 + v * 7.5, sig ? 116 - sigm(v) * 32 : 100 - v * 4])), fill: "none", stroke: css("--arch"), "stroke-width": 1.8 }, svg);
    el("text", { x: 379, y: 142, "text-anchor": "middle", class: "mut", style: `font-size:${11.5 }px`}, svg, sig ? "sigmoid" : "none");
    el("line", { x1: 416, y1: 100, x2: 446, y2: 100, stroke: css("--muted"), "marker-end": "url(#g1wsAr)" }, svg);
    const out = sig ? p : z;
    el("circle", { cx: 480, cy: 100, r: 30, fill: css("--arch"), stroke: css("--arch") }, svg);
    el("text", { x: 480, y: 105, "text-anchor": "middle", class: "mono", style: `font-size:${14}px`, fill: css("--bg") }, svg, fmt(out, 2));
    el("text", { x: 480, y: 150, "text-anchor": "middle", style: `font-size:${12}px`, fill: css("--arch") }, svg, sig ? fmt(100 * p, 0) + "% rain" : "rain score");
    $("#g1wsCalc").innerHTML = `z = ${fmt(w1, 1)}×${fmt(x1, 2)} + ${fmt(w2, 1)}×${fmt(x2, 2)} + (${fmt(b, 1)}) = ${fmt(w1 * x1, 2)} + ${fmt(w2 * x2, 2)} − ${fmt(-b, 1)} = <span class="k">${fmt(z, 2)}</span>\n` +
      (sig ? `p = σ(${fmt(z, 2)}) = 1 / (1 + e<sup>${fmt(-z, 2)}</sup>) = <span class="g">${fmt(p, 2)}</span>  <span class="m">(${fmt(100 * p, 0)}% chance of rain)</span>`
        : `<span class="m">no activation: the output is z itself, an unbounded score (linear regression)</span>`);
    /* scatter with the decision line w1·h + w2·p + b = 0 */
    const SW = 420, SH = 270, sv = svgIn($("#g1wsScat"), SW, SH);
    const ax = axes(sv, { W: SW, H: SH, m: { l: 40, r: 12, t: 14, b: 30 }, x0: 0, x1: 1, y0: 0, y1: 1, xt: [0, .25, .5, .75, 1], yt: [0, .5, 1], xl: "humidity x₁", yl: "pressure drop x₂", xf: v => fmt(v, 2), yf: v => fmt(v, 1) });
    const f = (h, q) => w1 * h + w2 * q + b;
    // clip the unit square to the half-plane f > 0 (one Sutherland–Hodgman pass)
    const sq = [[0, 0], [1, 0], [1, 1], [0, 1]], poly = [], seg = [];
    sq.forEach((P, i) => {
      const Q = sq[(i + 1) % 4], fp = f(...P), fq = f(...Q);
      if (fp > 0) poly.push(P);
      if ((fp > 0) !== (fq > 0)) { const t = fp / (fp - fq), X = [P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]; poly.push(X); seg.push(X); }
    });
    if (poly.length > 2) el("path", { d: path(poly.map(([h, q]) => [ax.x(h), ax.y(q)])) + "Z", fill: css("--arch-soft"), stroke: "none" }, sv);
    let ok = 0;
    days.forEach(d => {
      const pred = f(d.h, d.p) > 0; ok += pred === d.rain;
      el("circle", { cx: ax.x(d.h), cy: ax.y(d.p), r: 4.2, fill: css(d.rain ? "--cool" : "--sw"), opacity: .85, stroke: pred === d.rain ? "none" : css("--fg"), "stroke-width": 1.2 }, sv);
    });
    if (seg.length === 2) el("line", { x1: ax.x(seg[0][0]), y1: ax.y(seg[0][1]), x2: ax.x(seg[1][0]), y2: ax.y(seg[1][1]), stroke: css("--arch"), "stroke-width": 2.4 }, sv);
    el("circle", { cx: ax.x(x1), cy: ax.y(x2), r: 8, fill: "none", stroke: css("--fg"), "stroke-width": 2 }, sv);
    el("text", { x: ax.x(x1) + (x1 > .75 ? -12 : 12), y: ax.y(x2) + 4, "text-anchor": x1 > .75 ? "end" : "start", style: `font-size:${11.5}px`, "font-weight": 600 }, sv, "today");
    el("text", { x: SW - 14, y: 28, "text-anchor": "end", class: "mono", style: `font-size:${12}px`, fill: css("--arch") }, sv, `${ok} / 60 days right`);
  }
  render(); return render;
});

/* 02 · element-wise operations on the gridded fields */
demo("op-elem", () => {
  const R = DS.mask.length, C = DS.mask[0].length;
  const map2 = (A, B, fn) => A.map((row, i) => row.map((v, j) => v == null ? null : fn(v, B ? B[i][j] : null, i, j)));
  // synthetic helpers: a full field with sea cells filled (for the mask), a warming field, a west→east row, a wrong-shape field
  const full = DS.temp.map((row, i) => row.map((v, j) => v == null ? +(27.5 - 0.08 * i + 0.05 * j).toFixed(1) : v));
  const warm = DS.elev.map((row, i) => row.map((e, j) => DS.mask[i][j] ? +(0.5 + 1.5 * e / 3000).toFixed(1) : null));
  const rowB = Array.from({ length: C }, (_, j) => +(-1 + 2 * j / (C - 1)).toFixed(1));
  const bad = Array.from({ length: R }, () => new Array(C - 1).fill(1));
  const OPS = {
    add: { A: DS.temp, u: "°C", d: 1, cfg: [-3, 3, 0.5, 1], sym: "+", name: "temperature" },
    scale: { A: DS.precip, u: "mm/yr", d: 0, cfg: [0, 2, 0.1, 0.5], sym: "×", name: "rainfall" },
    mask: { A: full, B: DS.mask, u: "°C", d: 1, sym: "×", name: "temperature incl. sea" },
    field: { A: DS.temp, B: warm, u: "°C", d: 1, sym: "+", name: "temperature" },
    row: { A: DS.temp, B: [rowB], u: "°C", d: 1, sym: "+", name: "temperature" },
    bad: { A: DS.temp, B: bad, u: "°C", d: 1, sym: "+", name: "temperature" },
  };
  let op = "add", hov = [8, 6], shown = Infinity, timer = null;
  const ctl = $("#g1elCtl"), cs = $("#g1elC");
  const gc = slider("g1elC", v => fmt(v, op === "scale" ? 1 : 1), () => render());
  chips($("#g1elOp"), v => {
    op = v; stop(); const c = OPS[op].cfg; ctl.style.visibility = c ? "visible" : "hidden";
    if (c) { [cs.min, cs.max, cs.step, cs.value] = c; cs.dispatchEvent(new Event("input")); } else render();
  });
  function stop() { if (timer) cancelAnimationFrame(timer); timer = null; shown = Infinity; }
  $("#g1elPlay").onclick = () => {
    stop(); shown = 0; let last = 0;
    const step = t => { if (t - last > 16) { last = t; shown += 2; hov = [Math.floor(Math.min(shown, R * C - 1) / C), Math.min(shown, R * C - 1) % C]; render(); }
      if (shown < R * C) timer = requestAnimationFrame(step); else { timer = null; shown = Infinity; render(); } };
    timer = requestAnimationFrame(step);
  };
  function render() {
    const o = OPS[op], c = gc(), A = o.A, broadcastRow = op === "row";
    const Bfull = op === "add" || op === "scale" ? null : broadcastRow ? A.map(() => rowB) : o.B;
    const out = op === "bad" ? null : op === "add" ? map2(A, null, v => v + c) : op === "scale" ? map2(A, null, v => v * c)
      : op === "mask" ? map2(A, Bfull, (v, b) => v * b) : map2(A, Bfull, (v, b) => v + b);
    const vals = [...A.flat(), ...(out ? out.flat() : [])].filter(v => v != null && !(op === "mask" && v === 0));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const colA = v => op === "mask" && v === 0 ? css("--line") : heat(v, lo, hi);
    const cell = 11, mw = C * cell, gap = 34, W = 3 * mw + 2 * gap, top = 18, H = top + R * cell + 4;
    const svg = svgIn($("#g1elFig"), W, H);
    const titles = [o.name + " (18 × 14)", op === "add" || op === "scale" ? "one number" : op === "mask" ? "land mask (0 or 1)" : op === "field" ? "warming field (synthetic)" : op === "row" ? "one row (1 × 14)" : "a field (18 × 13)", op === "bad" ? "error" : "output (18 × 14)"];
    const drawMap = (k, F, colFn, opac = () => 1) => {
      const x0 = k * (mw + gap);
      el("text", { x: x0 + mw / 2, y: 12, "text-anchor": "middle", class: "mut", style: `font-size:${11 }px`}, svg, titles[k]);
      F.forEach((row, i) => row.forEach((v, j) => {
        if (v == null) return;
        const isH = hov[0] === i && hov[1] === j;
        const rc = el("rect", { x: x0 + j * cell, y: top + i * cell, width: cell - 1, height: cell - 1, rx: 1.5, fill: colFn(v, i, j), opacity: opac(i, j), stroke: isH ? css("--fg") : "none", "stroke-width": 1.6, style: "cursor:pointer" }, svg);
        const on = () => { if (timer) return; hov = [i, j]; render(); };
        rc.addEventListener("mouseenter", on); rc.addEventListener("click", on);
      }));
    };
    drawMap(0, A, colA);
    // operator panel
    const x1 = mw + gap;
    if (!Bfull) {
      el("rect", { x: x1 + mw / 2 - 30, y: top + R * cell / 2 - 22, width: 60, height: 44, rx: 10, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
      el("text", { x: x1 + mw / 2, y: top + R * cell / 2 + 6, "text-anchor": "middle", class: "mono", style: `font-size:${18 }px`}, svg, fmt(c, 1));
      el("text", { x: x1 + mw / 2, y: top + R * cell / 2 + 40, "text-anchor": "middle", class: "mut", style: `font-size:${10.5 }px`}, svg, "broadcast to every cell");
    } else if (op === "mask") drawMap(1, Bfull, v => v ? css("--ok") : css("--well"));
    else if (op === "row") drawMap(1, Bfull, v => div(v, 1.2), i => i === 0 ? 1 : 0.28);
    else if (op === "bad") drawMap(1, Bfull, () => css("--lw-soft"));
    else drawMap(1, Bfull, v => heat(v, 0, 2.2));
    // operator symbols
    [[mw + gap / 2, o.sym], [2 * mw + 1.5 * gap, "="]].forEach(([x, s]) => el("text", { x, y: top + R * cell / 2 + 7, "text-anchor": "middle", style: `font-size:${22}px`, fill: css("--arch") }, svg, s));
    if (out) {
      const idx = (i, j) => i * C + j;
      drawMap(2, out, (v, i, j) => idx(i, j) > shown ? css("--well") : colA(v));
    } else {
      const x2 = 2 * (mw + gap);
      el("rect", { x: x2, y: top, width: mw, height: R * cell, rx: 6, fill: css("--lw-soft"), stroke: css("--lw"), "stroke-dasharray": "4 3" }, svg);
      el("text", { x: x2 + mw / 2, y: top + R * cell / 2 - 4, "text-anchor": "middle", style: `font-size:${12}px`, fill: css("--lw"), "font-weight": 600 }, svg, "shapes do not match");
      el("text", { x: x2 + mw / 2, y: top + R * cell / 2 + 14, "text-anchor": "middle", class: "mono", style: `font-size:${11}px`, fill: css("--lw") }, svg, "(18,14) vs (18,13)");
    }
    // cell readout
    const [i, j] = hov, a = A[i][j], u = o.u, d = o.d;
    let line;
    if (op === "bad") line = `<span class="r">ValueError: operands could not be broadcast together with shapes (18,14) (18,13)</span>\n<span class="m">Lucky: this one fails loudly. A (14,) row would have been stretched silently.</span>`;
    else if (a == null) line = `<span class="m">cell (row ${i + 1}, col ${j + 1}) is sea: no data in this field</span>\n `;
    else {
      const bv = Bfull ? Bfull[i][j] : c, ov = out[i][j];
      const shape = op === "add" || op === "scale" ? "(18,14) " + o.sym + " () → (18,14): the number is broadcast" : op === "row" ? "(18,14) + (14,) → (18,14): the row is copied down all 18 rows" : `(18,14) ${o.sym} (18,14) → (18,14): shapes match`;
      line = `cell (row ${i + 1}, col ${j + 1}): ${fmt(a, d)} ${o.sym} ${fmt(bv, op === "mask" ? 0 : 1)} = <span class="k">${fmt(ov, d)} ${u}</span>\n<span class="m">${shape}</span>`;
    }
    $("#g1elCalc").innerHTML = line;
  }
  render(); return render;
});

/* 03 · activation functions, applied to a temperature anomaly map */
demo("op-act", () => {
  const dnum = f => x => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
  const F = {
    relu: [relu, "ReLU", "max(0, x)", x => x > 0 ? 1 : 0, "[0, ∞)"], sigmoid: [sigm, "Sigmoid", "1 / (1 + e⁻ˣ)", x => sigm(x) * (1 - sigm(x)), "(0, 1)"],
    tanh: [Math.tanh, "Tanh", "tanh(x)", x => 1 - Math.tanh(x) ** 2, "(−1, 1)"], gelu: [gelu, "GELU", "x · Φ(x), smooth ReLU", dnum(gelu), "≈ [−0.17, ∞)"],
  };
  $("#g1acTable").innerHTML = `<thead><tr><th>Function</th><th>Formula</th><th>f(−2)</th><th>f(0)</th><th>f(3)</th><th>Range</th></tr></thead><tbody>${Object.values(F).map(([f, n, fo, , rg]) =>
    `<tr><td>${n}</td><td class="mono" style="font-size:12px">${fo}</td><td class="n">${fmt(f(-2), 2)}</td><td class="n">${fmt(f(0), 2)}</td><td class="n">${fmt(f(3), 2)}</td><td class="mono" style="font-size:12px">${rg}</td></tr>`).join("")}</tbody>`;
  const ga = chips($("#g1acPick"), () => render()), xs = $("#g1acX"), gx = slider("g1acX", v => fmt(v, 1), () => render());
  // anomaly = temperature minus its mean over land
  const land = DS.temp.flat().filter(v => v != null), m = mean(land), An = DS.temp.map(row => row.map(v => v == null ? null : +(v - m).toFixed(1)));
  const amax = Math.max(...land.map(v => Math.abs(v - m)));
  let hov = null;
  const W = 520, H = 200, M = { l: 34, r: 12, t: 12, b: 24 }, X0 = -4, X1 = 4;
  // drag the input point along the curve
  const host = $("#g1acFig"); let drag = false;
  const setX = e => { const b = host.getBoundingClientRect(), vx = (e.clientX - b.left) / b.width * W; xs.value = clamp(Math.round((X0 + (vx - M.l) / (W - M.l - M.r) * (X1 - X0)) * 10) / 10, X0, X1); xs.dispatchEvent(new Event("input")); };
  host.addEventListener("pointerdown", e => { drag = true; host.setPointerCapture(e.pointerId); setX(e); });
  host.addEventListener("pointermove", e => drag && setX(e));
  host.addEventListener("pointerup", () => drag = false); host.addEventListener("pointercancel", () => drag = false);
  function render() {
    const k = ga(), [f, n, , df] = F[k], xv = gx(), svg = svgIn(host, W, H);
    const { x, y } = axes(svg, { W, H, m: M, x0: X0, x1: X1, y0: -1.5, y1: 4, xt: [-4, -2, 0, 2, 4], yt: [-1, 0, 1, 2, 3, 4] });
    el("line", { x1: x(0), x2: x(0), y1: M.t, y2: H - M.b, class: "ax" }, svg);
    const curve = g => path(Array.from({ length: 161 }, (_, i) => { const v = X0 + i * 0.05; return [x(v), y(clamp(g(v), -1.5, 4))]; }));
    Object.entries(F).forEach(([kk, [g]]) => kk !== k && el("path", { d: curve(g), fill: "none", stroke: css("--line"), "stroke-width": 1.2 }, svg));
    el("path", { d: curve(df), fill: "none", stroke: css("--sw"), "stroke-width": 1.4, "stroke-dasharray": "4 3" }, svg);
    el("path", { d: curve(f), fill: "none", stroke: css("--arch"), "stroke-width": 2.6 }, svg);
    el("line", { x1: x(xv), x2: x(xv), y1: y(0), y2: y(clamp(f(xv), -1.5, 4)), stroke: css("--accent"), "stroke-dasharray": "3 3" }, svg);
    el("circle", { cx: x(xv), cy: y(clamp(f(xv), -1.5, 4)), r: 8, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 2 }, svg);
    el("text", { x: M.l + 6, y: M.t + 12, style: `font-size:${11.5}px`, fill: css("--arch") }, svg, `${n}(x)`);
    el("text", { x: M.l + 6, y: M.t + 27, style: `font-size:${11.5}px`, fill: css("--sw") }, svg, "slope (gradient), dashed");
    el("text", { x: M.l + 6, y: M.t + 44, class: "mono", style: `font-size:${12}px`, fill: css("--accent") }, svg, `${n}(${fmt(xv, 1)}) = ${fmt(f(xv), 3)} · slope ${fmt(df(xv), 3)}`);
    /* anomaly map before → after */
    const out = An.map(row => row.map(v => v == null ? null : f(v)));
    const outMax = k === "sigmoid" ? 0.5 : k === "tanh" ? 1 : amax, centre = k === "sigmoid" ? 0.5 : 0;
    const cell = 13, R = An.length, C = An[0].length, mw = C * cell, gap = 70, MW = 2 * mw + gap, MH = 16 + R * cell + 2;
    const sv = svgIn($("#g1acMap"), MW, MH); arrowDefs(sv, "g1acAr", css("--arch"));
    const draw = (x0, Fm, colFn, title) => {
      el("text", { x: x0 + mw / 2, y: 11, "text-anchor": "middle", class: "mut", style: `font-size:${11 }px`}, sv, title);
      Fm.forEach((row, i) => row.forEach((v, j) => {
        if (v == null) return; const isH = hov && hov[0] === i && hov[1] === j;
        const rc = el("rect", { x: x0 + j * cell, y: 16 + i * cell, width: cell - 1, height: cell - 1, rx: 2, fill: colFn(v), stroke: isH ? css("--fg") : "none", "stroke-width": 1.6, style: "cursor:pointer" }, sv);
        const on = () => { hov = [i, j]; render(); }; rc.addEventListener("mouseenter", on); rc.addEventListener("click", on);
      }));
    };
    draw(0, An, v => div(v, amax), "anomaly (°C)");
    el("line", { x1: mw + 10, x2: mw + gap - 10, y1: 16 + R * cell / 2, y2: 16 + R * cell / 2, stroke: css("--arch"), "stroke-width": 1.6, "marker-end": "url(#g1acAr)" }, sv);
    el("text", { x: mw + gap / 2, y: 16 + R * cell / 2 - 8, "text-anchor": "middle", style: `font-size:${12}px`, fill: css("--arch") }, sv, n);
    draw(mw + gap, out, v => div(v - centre, outMax), k === "sigmoid" ? "output (colour centred on 0.5)" : "output");
    const flat = land.map(v => v - m), dead = flat.filter(v => Math.abs(df(v)) < 0.05).length;
    const h = hov && An[hov[0]][hov[1]];
    $("#g1acRead").innerHTML = `<div><span>${k === "relu" ? "Cells set to 0" : "Cells with slope < 0.05"}</span><b class="${dead / flat.length > 0.3 ? "c-lw" : "c-arch"}">${dead} / ${flat.length}</b></div>` +
      (h != null ? `<div><span>Hovered cell</span><b class="c-arch" style="font-size:18px">${fmt(h, 1)} °C → ${fmt(f(h), 3)}</b></div>` : `<div><span>Anomaly range</span><b class="c-arch" style="font-size:18px">${fmt(Math.min(...flat), 1)} to +${fmt(Math.max(...flat), 1)} °C</b></div>`);
  }
  render(); return render;
});

/* 03 · softmax and its dependence on scale */
demo("op-softmax", () => {
  const ids = ["g1smA", "g1smB", "g1smC", "g1smS"], g = ids.slice(0, 3).map(id => slider(id, v => fmt(v, 1), () => render()));
  const gs = slider("g1smS", v => "×" + fmt(10 ** v, 10 ** v < 1 ? 2 : 1), () => render());
  const set = (vals) => vals.forEach((v, k) => { const s = $("#" + ids[k]); s.value = v; s.dispatchEvent(new Event("input")); });
  $("#g1smEx1").onclick = () => set([2, 1, 0, 0]); $("#g1smEx2").onclick = () => set([2, 1, 0, 1]); $("#g1smEx3").onclick = () => set([2, 1, 0, -1]);
  const lbl = ["Dry", "Normal", "Wet"], col = ["--sw", "--ok", "--cool"];
  function render() {
    const s = 10 ** gs(), z = g.map(f => f() * s), p = softmax(z), es = z.map(v => Math.exp(v));
    const W = 520, H = 188, svg = svgIn($("#g1smFig"), W, H);
    [["score z", 70], ["e^z", 160], ["probability p = e^z / Σ", 250]].forEach(([t, x]) => el("text", { x, y: 12, class: "mut", style: `font-size:${11 }px`}, svg, t));
    p.forEach((v, i) => {
      const y0 = 22 + i * 48;
      el("text", { x: 0, y: y0 + 22, style: `font-size:${13 }px`}, svg, lbl[i]);
      el("rect", { x: 66, y: y0 + 4, width: 70, height: 28, rx: 6, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: 101, y: y0 + 23, "text-anchor": "middle", class: "mono", style: `font-size:${13 }px`}, svg, fmt(z[i], 1));
      el("rect", { x: 156, y: y0 + 4, width: 76, height: 28, rx: 6, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
      el("text", { x: 194, y: y0 + 23, "text-anchor": "middle", class: "mono", style: `font-size:${12 }px`}, svg, es[i] > 1e5 ? es[i].toExponential(1) : fmt(es[i], es[i] < 10 ? 2 : 0));
      el("rect", { x: 250, y: y0 + 4, width: 220, height: 28, rx: 6, fill: css("--well") }, svg);
      el("rect", { x: 250, y: y0 + 4, width: Math.max(1, 220 * v), height: 28, rx: 6, fill: css(col[i]) }, svg);
      el("text", { x: 478, y: y0 + 23, class: "mono", style: `font-size:${13 }px`}, svg, fmt(v, 2));
    });
    const sum = es.reduce((a, b) => a + b, 0);
    el("text", { x: 66, y: 180, class: "mut mono", style: `font-size:${11.5 }px`}, svg, `Σ e^z = ${sum > 1e5 ? sum.toExponential(2) : fmt(sum, 2)} · probabilities sum to ${fmt(p.reduce((a, b) => a + b, 0), 2)}`);
    /* probability of each class as the scale changes */
    const CW = 520, CH = 150, cv = svgIn($("#g1smCurve"), CW, CH), raw = g.map(f => f());
    const { x, y } = axes(cv, { W: CW, H: CH, m: { l: 34, r: 12, t: 10, b: 24 }, x0: -1, x1: 1, y0: 0, y1: 1, xt: [-1, -0.5, 0, 0.5, 1], yt: [0, 0.5, 1], xf: v => "×" + fmt(10 ** v, v < 0 ? (v < -0.6 ? 1 : 2) : v > 0.6 ? 0 : 1), yf: v => fmt(v, 1) });
    const L = Array.from({ length: 101 }, (_, i) => -1 + i * 0.02).map(l => [l, softmax(raw.map(v => v * 10 ** l))]);
    [0, 1, 2].forEach(c => el("path", { d: path(L.map(([l, q]) => [x(l), y(q[c])])), fill: "none", stroke: css(col[c]), "stroke-width": 2.2 }, cv));
    el("line", { x1: x(gs()), x2: x(gs()), y1: 10, y2: CH - 24, stroke: css("--fg"), "stroke-dasharray": "3 3" }, cv);
    el("text", { x: CW - 12, y: CH - 30, "text-anchor": "end", class: "mut", style: `font-size:${11 }px`}, cv, "scale × (log axis)");
  }
  render(); return render;
});

/* 04 · dense layer. The network, its fitting and the shared selection live in G1DN, used by op-dense and op-dense-fit */
const G1DN = (() => {
  const S = DS.students, keys = ["absences", "grade", "estrato"];
  const mu = keys.map(k => mean(S.map(s => s[k]))), sg = keys.map(k => sd(S.map(s => s[k])));
  const z = v => keys.map((k, i) => (v[i] - mu[i]) / sg[i]), X = S.map(s => z(keys.map(k => s[k]))), Y = S.map(s => s.attrition);
  // hidden activations and their slopes (in terms of z, or of the neuron's value h)
  const ACT = { tanh: { f: Math.tanh, d: (q, h) => 1 - h * h, name: "tanh" }, relu: { f: relu, d: q => +(q > 0), name: "ReLU" },
    sigm: { f: sigm, d: (q, h) => h * (1 - h), name: "sigmoid" }, none: { f: q => q, d: () => 1, name: "none" } };
  const state = { H: 3, act: "tanh", stu: 14, sel: 0 }, cache = {};
  // fit a 3 → H (activation) → 1 (sigmoid) network to the 20 students by plain gradient descent (deterministic, a few ms)
  function fit(H, act) {
    const key = H + act; if (cache[key]) return cache[key];
    const A = ACT[act], r = rng(300 + H), W1 = Array.from({ length: H }, () => keys.map(() => 0.8 * gauss(r))), b1 = new Array(H).fill(0), W2 = Array.from({ length: H }, () => 0.8 * gauss(r));
    let b2 = 0; const lr = 0.3, lam = 0.01, n = X.length;
    for (let it = 0; it < 1500; it++) {
      const gW1 = W1.map(rw => rw.map(() => 0)), gb1 = new Array(H).fill(0), gW2 = new Array(H).fill(0); let gb2 = 0;
      X.forEach((x, s) => {
        const q = W1.map((rw, j) => rw.reduce((a, w, i) => a + w * x[i], b1[j])), h = q.map(A.f), p = sigm(h.reduce((a, v, j) => a + v * W2[j], b2)), d = p - Y[s];
        gb2 += d; h.forEach((v, j) => { gW2[j] += d * v; const dh = d * W2[j] * A.d(q[j], v); gb1[j] += dh; x.forEach((xi, i) => gW1[j][i] += dh * xi); });
      });
      W1.forEach((rw, j) => { rw.forEach((w, i) => rw[i] -= lr * (gW1[j][i] / n + lam * w)); b1[j] -= lr * gb1[j] / n; W2[j] -= lr * (gW2[j] / n + lam * W2[j]); });
      b2 -= lr * gb2 / n;
    }
    return cache[key] = { W1, b1, W2, b2 };
  }
  const fwd = (net, x, act) => { const z1 = net.W1.map((rw, j) => rw.reduce((a, w, i) => a + w * x[i], net.b1[j])), h = z1.map(ACT[act].f), z2 = h.reduce((a, v, j) => a + v * net.W2[j], net.b2); return { z1, h, z2, p: sigm(z2) }; };
  return { S, keys, mu, sg, z, X, Y, ACT, state, fit, fwd };
})();

demo("op-dense", () => {
  const { S, keys, X, ACT, state: st, fit } = G1DN, fwd = (net, x) => G1DN.fwd(net, x, st.act);
  let view = "net";
  const gh = slider("g1dnH", v => v, v => { st.H = v; render(); });
  const ga = $$("#g1dnAct button.chip");
  ga.forEach(b => b.addEventListener("click", () => { st.act = b.dataset.v; render(); }));
  chips($("#g1dnView"), v => { view = v; render(); });
  function table(net) {
    $("#g1dnTable").innerHTML = `<style>#g1dnTable th{position:sticky;top:0;background:var(--bg);z-index:1}</style><table class="tb" style="font-size:12.5px"><thead><tr><th>#</th><th>Absences</th><th>Grade</th><th>Estrato</th><th>Left?</th><th>Model p</th></tr></thead><tbody>${S.map((s, k) =>
      `<tr data-k="${k}" style="cursor:pointer;${k === st.stu ? "background:var(--arch-soft);font-weight:600" : ""}"><td class="n">${s.id}</td><td class="n">${s.absences}</td><td class="n">${fmt(s.grade, 1)}</td><td class="n">${s.estrato}</td><td>${s.attrition ? "yes" : "no"}</td><td class="n">${fmt(fwd(net, X[k]).p, 2)}</td></tr>`).join("")}</tbody></table>`;
    const box = $("#g1dnTable"), tr = box.querySelector(`tr[data-k="${st.stu}"]`); if (tr) box.scrollTop = Math.max(0, tr.offsetTop - 70);
    $$("#g1dnTable tr[data-k]").forEach(tr => tr.addEventListener("click", () => { st.stu = +tr.dataset.k; render(); }));
  }
  /* the same arithmetic as a matrix product: W (rows = neurons) × x + b = z, then f(z) */
  function matrix(svg, M, v, b, zz, out, colLab, fname, rowLab, selRow) {
    const R = M.length, C = M[0].length, cs = Math.min(40, 210 / Math.max(R, v.length), 230 / (C + 4)), y0 = 40, mx = Math.max(...M.flat().map(Math.abs)) || 1;
    const cell = (x, y, val, fill, on, dg = 2) => { el("rect", { x, y, width: cs - 2, height: cs - 2, rx: 3, fill, stroke: on ? css("--fg") : "none", "stroke-width": 2 }, svg);
      if (cs >= 24) el("text", { x: x + cs / 2 - 1, y: y + cs / 2 + 3.5, "text-anchor": "middle", class: "mono", style: `font-size:${cs >= 36 ? 11 : 9.5}px` }, svg, fmt(val, dg)); };
    const colY = n => y0 + (R * cs - n * cs) / 2;
    let x = 40;
    el("text", { x: x + C * cs / 2, y: y0 - 22, "text-anchor": "middle", style: "font-size:11.5px", fill: css("--fg") }, svg, `W (${R} × ${C})`);
    colLab.forEach((l, i) => el("text", { x: x + i * cs + cs / 2, y: y0 - 6, "text-anchor": "middle", style: "font-size:10px", fill: css("--muted") }, svg, l));
    M.forEach((row, r) => { row.forEach((w, c) => cell(x + c * cs, y0 + r * cs, w, div(w, mx), r === selRow)); el("text", { x: x - 6, y: y0 + r * cs + cs / 2 + 3, "text-anchor": "end", style: "font-size:10px", fill: css(r === selRow ? "--fg" : "--muted") }, svg, rowLab(r)); });
    x += C * cs + 10; el("text", { x: x + 4, y: y0 + R * cs / 2 + 4, style: "font-size:15px", fill: css("--muted") }, svg, "×"); x += 18;
    el("text", { x: x + cs / 2, y: y0 - 22, "text-anchor": "middle", style: "font-size:11.5px", fill: css("--fg") }, svg, "x");
    v.forEach((val, i) => cell(x, colY(v.length) + i * cs, val, css("--data-soft"), selRow >= 0));
    x += cs + 8; el("text", { x: x + 2, y: y0 + R * cs / 2 + 4, style: "font-size:15px", fill: css("--muted") }, svg, "+"); x += 16;
    el("text", { x: x + cs / 2, y: y0 - 22, "text-anchor": "middle", style: "font-size:11.5px", fill: css("--fg") }, svg, "b");
    b.forEach((val, r) => cell(x, y0 + r * cs, val, css("--sw-soft"), r === selRow));
    x += cs + 8; el("text", { x: x + 2, y: y0 + R * cs / 2 + 4, style: "font-size:15px", fill: css("--muted") }, svg, "="); x += 16;
    el("text", { x: x + cs / 2, y: y0 - 22, "text-anchor": "middle", style: "font-size:11.5px", fill: css("--fg") }, svg, "z");
    zz.forEach((val, r) => cell(x, y0 + r * cs, val, css("--well"), r === selRow));
    x += cs + 8; el("text", { x: x + 2, y: y0 + R * cs / 2 + 4, style: "font-size:12px", fill: css("--muted") }, svg, fname + " →"); x += fname.length * 7 + 22;
    el("text", { x: x + cs / 2, y: y0 - 22, "text-anchor": "middle", style: "font-size:11.5px", fill: css("--fg") }, svg, "out");
    out.forEach((val, r) => cell(x, y0 + r * cs, val, css("--arch-soft"), r === selRow));
  }
  function render() {
    const H = st.H, net = fit(H, st.act); if (st.sel >= H) st.sel = H - 1; const sel = st.sel;
    $("#g1dnH").value = H; $("#g1dnH").parentElement.querySelector("output").textContent = H; press(ga, ga.find(b => b.dataset.v === st.act));
    const x = X[st.stu], f = fwd(net, x), s = S[st.stu];
    table(net);
    const W = 520, HH = view === "mat" ? 0 : 270, xi = 110, xh = 290, xo = 450;
    let svg;
    if (view === "mat") {
      const rows = sel === -1 ? Math.max(1, H) : Math.max(H, 3), cs = Math.min(40, 210 / rows, 230 / ((sel === -1 ? H : 3) + 4)), MH = 40 + rows * cs + 26;
      svg = svgIn($("#g1dnFig"), W, MH);
      if (sel === -1) matrix(svg, [net.W2], f.h, [net.b2], [f.z2], [f.p], f.h.map((_, j) => "h" + (j + 1)), "σ", () => "out", 0);
      else matrix(svg, net.W1, x, net.b1, f.z1, f.h, ["abs.", "grade", "estr."], st.act === "none" ? "none" : ACT[st.act].name, r => "neuron " + (r + 1), sel);
      el("text", { x: 40, y: MH - 6, style: "font-size:11px", fill: css("--muted") }, svg, sel === -1 ? "Layer 2: one row (the output neuron) times the hidden values." : "Layer 1: one row of W per hidden neuron; each row times the same input x. Outlined: the clicked neuron.");
    } else {
    svg = svgIn($("#g1dnFig"), W, HH);
    const yi = i => 70 + i * 70, yh = j => H === 1 ? 140 : 24 + j * (210 / (H - 1)), yo = 140;
    const m1 = Math.max(...net.W1.flat().map(Math.abs)), m2 = Math.max(...net.W2.map(Math.abs));
    const wc = w => css(w >= 0 ? "--pos" : "--neg");
    net.W1.forEach((rw, j) => rw.forEach((w, i) => el("line", { x1: xi + 22, y1: yi(i), x2: xh - 18, y2: yh(j), stroke: wc(w), "stroke-width": 0.6 + 4 * Math.abs(w) / m1, opacity: sel === j ? .95 : .16 }, svg)));
    net.W2.forEach((w, j) => el("line", { x1: xh + 18, y1: yh(j), x2: xo - 24, y2: yo, stroke: wc(w), "stroke-width": 0.6 + 4 * Math.abs(w) / m2, opacity: sel === -1 ? .95 : .16 }, svg));
    const raw = [s.absences, fmt(s.grade, 1), s.estrato];
    keys.forEach((k, i) => {
      el("circle", { cx: xi, cy: yi(i), r: 22, fill: css("--card"), stroke: css("--data") }, svg);
      el("text", { x: xi, y: yi(i) + 4, "text-anchor": "middle", class: "mono", style: `font-size:12px` }, svg, fmt(x[i], 2));
      el("text", { x: xi - 30, y: yi(i) - 2, "text-anchor": "end", style: `font-size:12px` }, svg, k);
      el("text", { x: xi - 30, y: yi(i) + 13, "text-anchor": "end", class: "mut mono", style: `font-size:11px` }, svg, "raw " + raw[i]);
    });
    const node = (cx, cy, r, v, on, idx, lab) => {
      const g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": lab }, svg);
      el("circle", { cx, cy, r, fill: on ? css("--arch") : css("--arch-soft"), stroke: css("--arch"), "stroke-width": on ? 2 : 1 }, g);
      el("text", { x: cx, y: cy + 4, "text-anchor": "middle", class: "mono", style: `font-size:${H > 6 && idx >= 0 ? 10 : 11.5}px`, fill: on ? css("--bg") : css("--fg") }, g, fmt(v, 2));
      const pick = () => { st.sel = idx; render(); };
      g.addEventListener("click", pick); g.addEventListener("keydown", e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick()));
    };
    const rh = H > 6 ? 14 : 18;
    f.h.forEach((v, j) => node(xh, yh(j), rh, v, sel === j, j, "hidden neuron " + (j + 1)));
    node(xo, yo, 24, f.p, sel === -1, -1, "output neuron");
    el("text", { x: xo, y: yo + 42, "text-anchor": "middle", style: `font-size:12px` }, svg, "attrition p");
    el("text", { x: xh, y: HH - 2, "text-anchor": "middle", class: "mut", style: `font-size:11px` }, svg, `${H} hidden (${ACT[st.act].name})`);
    el("text", { x: xi, y: HH - 2, "text-anchor": "middle", class: "mut", style: `font-size:11px` }, svg, "3 inputs (z-scores)");
    el("text", { x: xo, y: HH - 2, "text-anchor": "middle", class: "mut", style: `font-size:11px` }, svg, "1 output (sigmoid)");
    }
    /* neuron picker for the matrix view (the network view picks by clicking circles) */
    $("#g1dnPick").innerHTML = view === "mat" ? `<span class="mut" style="font-size:13px;align-self:center">Neuron:</span>` + f.h.map((_, j) => `<button class="chip" data-j="${j}" aria-pressed="${sel === j}">${j + 1}</button>`).join("") + `<button class="chip" data-j="-1" aria-pressed="${sel === -1}">output</button>` : "";
    $$("#g1dnPick button").forEach(b => b.addEventListener("click", () => { st.sel = +b.dataset.j; render(); }));
    if (sel >= 0) {
      const rw = net.W1[sel];
      $("#g1dnCalc").innerHTML = `hidden ${sel + 1}: z = ${rw.map((w, i) => `${fmt(w, 2)}×(${fmt(x[i], 2)})`).join(" + ")} + ${fmt(net.b1[sel], 2)} = <span class="k">${fmt(f.z1[sel], 2)}</span>\n         ${st.act === "none" ? "no activation: h = z" : ACT[st.act].name + "(" + fmt(f.z1[sel], 2) + ")"} = <span class="g">${fmt(f.h[sel], 2)}</span>`;
    } else {
      const terms = net.W2.map((w, j) => `${fmt(w, 1)}×(${fmt(f.h[j], 2)})`), shown = terms.length > 4 ? terms.slice(0, 3).concat("…") : terms;
      $("#g1dnCalc").innerHTML = `output: z = ${shown.join(" + ")} + ${fmt(net.b2, 2)} = <span class="k">${fmt(f.z2, 2)}</span>\n        σ(${fmt(f.z2, 2)}) = <span class="g">${fmt(f.p, 2)}</span> <span class="m">(student ${s.id} ${s.attrition ? "did" : "did not"} leave)</span>`;
    }
    const p1 = 3 * H + H, p2 = H + 1;
    $("#g1dnRead").innerHTML = `<div><span>Layer 1: 3 × ${H} + ${H}</span><b class="c-arch">${p1}</b></div><div><span>Layer 2: ${H} × 1 + 1</span><b class="c-arch">${p2}</b></div><div><span>Total parameters</span><b>${p1 + p2}</b></div>`;
  }
  DEMOS["op-dense"].onShow = render;   // the next slide can change the shared student and settings
  render(); return render;
});

/* 04 · what the dense network has learned: the probability map, what-if sliders and how much each input moves p */
demo("op-dense-fit", () => {
  const { S, keys, X, Y, ACT, state: st, fit, z } = G1DN;
  const ga = $$("#g1dfAct button.chip");
  ga.forEach(b => b.addEventListener("click", () => { st.act = b.dataset.v; render(); }));
  slider("g1dfH", v => v, v => { st.H = v; render(); });
  const sel = $("#g1dfStu");
  sel.innerHTML = S.map((s, k) => `<option value="${k}">Student ${s.id} (${s.attrition ? "left" : "stayed"})</option>`).join("");
  sel.addEventListener("change", () => { st.stu = +sel.value; load(); render(); });
  const ids = ["g1dfA", "g1dfG", "g1dfE"], fmts = [v => v, v => fmt(v, 1), v => v];
  ids.forEach((id, i) => slider(id, fmts[i], () => render()));
  let loaded = -1;
  function load() { const s = S[st.stu]; ids.forEach((id, i) => { const r = $("#" + id); r.value = s[keys[i]]; r.parentElement.querySelector("output").textContent = fmts[i](+r.value); }); loaded = st.stu; }
  $("#g1dfReset").addEventListener("click", () => { load(); render(); });
  function render() {
    if (loaded !== st.stu) load();
    sel.value = st.stu; $("#g1dfH").value = st.H; $("#g1dfH").parentElement.querySelector("output").textContent = st.H; press(ga, ga.find(b => b.dataset.v === st.act));
    const H = st.H, act = st.act, net = fit(H, act), s = S[st.stu], v = ids.map(id => +$("#" + id).value), p = G1DN.fwd(net, z(v), act).p, p0 = G1DN.fwd(net, X[st.stu], act).p;
    const changed = v.some((x, i) => Math.abs(x - s[keys[i]]) > 1e-9);
    /* the map over absences × grade at the what-if estrato */
    const MW = 480, MH = 250, ms = svgIn($("#g1dfMap"), MW, MH + 24), nx = 48, ny = 20, a0 = 0, a1 = 30, g0 = 1, g1 = 5;
    const mx = lin(a0, a1, 34, MW - 4), my = lin(g0, g1, MH, 4);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const ab = a0 + (i + .5) * (a1 - a0) / nx, gr = g0 + (j + .5) * (g1 - g0) / ny, pz = G1DN.fwd(net, z([ab, gr, v[2]]), act).p;
      el("rect", { x: mx(a0 + i * (a1 - a0) / nx), y: my(g0 + (j + 1) * (g1 - g0) / ny), width: (MW - 38) / nx + .5, height: MH / ny + .5, fill: div(pz - .5, .5) }, ms);
    }
    S.forEach((t, k) => el("circle", { cx: mx(t.absences), cy: my(t.grade), r: 4, fill: t.attrition ? css("--fg") : css("--bg"), stroke: css("--fg"), "stroke-width": 1.2, opacity: t.estrato === v[2] ? 1 : .45 }, ms));
    if (changed) el("line", { x1: mx(s.absences), y1: my(s.grade), x2: mx(v[0]), y2: my(v[1]), stroke: css("--fg"), "stroke-dasharray": "3 3" }, ms);
    el("circle", { cx: mx(s.absences), cy: my(s.grade), r: 8, fill: "none", stroke: css("--fg"), "stroke-width": 2 }, ms);
    el("path", { d: `M${mx(v[0])} ${my(v[1]) - 9} L${mx(v[0]) + 8} ${my(v[1]) + 6} L${mx(v[0]) - 8} ${my(v[1]) + 6} Z`, fill: css("--sw"), stroke: css("--bg"), "stroke-width": 1.5 }, ms);
    [0, 10, 20].forEach(t => el("text", { x: mx(t), y: MH + 15, "text-anchor": "middle", class: "mono", style: "font-size:10.5px", fill: css("--muted") }, ms, t));
    [1, 2, 3, 4].forEach(t => el("text", { x: 28, y: my(t) + 4, "text-anchor": "end", class: "mono", style: "font-size:10.5px", fill: css("--muted") }, ms, t));
    el("text", { x: MW - 4, y: MH + 15, "text-anchor": "end", style: "font-size:11px", fill: css("--muted") }, ms, "absences →");
    el("text", { x: 0, y: 10, style: "font-size:11px", fill: css("--muted") }, ms, "grade");
    /* fit quality, and how much each input moves this prediction */
    const P = X.map(x => G1DN.fwd(net, x, act).p), right = P.filter((q, k) => (q > .5) === !!Y[k]).length;
    const ll = -mean(P.map((q, k) => Y[k] ? Math.log(Math.max(q, 1e-9)) : Math.log(Math.max(1 - q, 1e-9))));
    const nud = [[0, 5, "+5 absences"], [1, 0.5, "+0.5 grade"], [2, 1, "+1 estrato"]].map(([i, d, l]) => { const w = v.slice(); w[i] += d; return [l, G1DN.fwd(net, z(w), act).p - p]; });
    $("#g1dfRead").innerHTML = `<div><span>p(leave), ${changed ? "what if" : "student " + s.id}</span><b class="${p > .5 ? "c-lw" : "c-ok"}">${fmt(p, 2)}</b></div>`
      + (changed ? `<div><span>Real student</span><b>${fmt(p0, 2)}</b></div>` : "");
    $("#g1dfFit").innerHTML = `<div><span>Students right</span><b class="c-ok" style="font-size:20px">${right} / 20</b></div><div><span>Training log-loss</span><b class="c-lw" style="font-size:20px">${fmt(ll, 2)}</b></div>`;
    $("#g1dfNudge").innerHTML = `<b>How much each input moves p here</b><br>` + nud.map(([l, d]) => `${l.padEnd(13, " ")} → p ${d >= 0 ? "+" : "−"}${fmt(Math.abs(d), 2)}`).join("<br>").replace(/ /g, "&nbsp;").replace(/&nbsp;→/g, " →")
      + `<br><span class="m">one input at a time, the others kept</span>`;
    $("#g1dfNote").textContent = `Red: likely to leave; blue: likely to stay, at estrato ${v[2]} (dots at other estratos are faded). Ring: the real student; triangle: the what-if. `
      + (act === "none" ? "With no activation the boundary is a straight line, whatever the number of neurons: plain logistic regression."
        : `${ACT[act].name} bends let the boundary curve${H >= 6 ? "; with this many neurons it wraps around individual students: overfitting" : ""}.`);
  }
  DEMOS["op-dense-fit"].onShow = render;
  render(); return render;
});

