/* ───────── Module 0 · Overview: one small demo per slide ───────── */

/* 1 · the big idea: one neuron, adjustable inputs, weights, bias and activation */
demo("o-idea", () => {
  const ACT = {
    relu: { f: relu, name: "ReLU", form: "max(0, z)", lo: 0, hi: 6, note: "ReLU: negative sums become 0 (neuron off), positive sums pass unchanged. The most common bend in hidden layers." },
    sigm: { f: sigm, name: "sigmoid", form: "1 / (1 + e⁻ᶻ)", lo: 0, hi: 1, note: "Sigmoid squeezes any sum into 0 to 1, like a probability: z = 0 gives 0.5. Used for yes/no outputs; it flattens out for large |z|." },
    tanh: { f: Math.tanh, name: "tanh", form: "tanh(z)", lo: -1, hi: 1, note: "tanh squeezes the sum into −1 to 1, centred on zero. Used inside recurrent cells such as the LSTM." },
    gelu: { f: gelu, name: "GELU", form: "z · Φ(z)", lo: -0.5, hi: 6, note: "GELU is a smooth ReLU: small negative sums leak through a little. Used in transformers." },
    none: { f: z => z, name: "no activation", form: "z", lo: -6, hi: 6, note: "With no bend the neuron is a straight line. Stacking such neurons gives another straight line, which is why networks need activations." },
  };
  let act = "relu"; chips($("#oAct"), v => { act = v; render(); });
  const g = {}; [["oX1", 1], ["oX2", 1], ["oW1", 1], ["oW2", 1], ["oB", 1]].forEach(([id, d]) => g[id] = slider(id, v => fmt(v, d), () => render()));
  function render() {
    const X = [g.oX1(), g.oX2()], w = [g.oW1(), g.oW2()], B = g.oB(), A = ACT[act];
    const z = X[0] * w[0] + X[1] * w[1] + B, a = A.f(z), frac = (clamp(a, A.lo, A.hi) - A.lo) / (A.hi - A.lo);
    const k = v => `<span class="k">${fmt(v, 1)}</span>`, par = v => v < 0 ? `(${k(v)})` : k(v);
    $("#oIdeaCalc").innerHTML = `z = ${par(X[0])} × ${par(w[0])} + ${par(X[1])} × ${par(w[1])} + ${par(B)} = <b>${fmt(z, 2)}</b><br>`
      + `${act === "none" ? "output" : A.name + "(z)"}${act === "tanh" || act === "none" ? "" : " = " + A.form} = <span class="${a > 0 ? "g" : a < 0 ? "r" : "m"}">${fmt(a, 2)}</span>`
      + (act === "relu" ? ` <span class="m">· neuron ${z > 0 ? "on" : "off"}</span>` : "");
    $("#oIdeaNote").textContent = A.note;
    const W = 560, H = 230, svg = svgIn($("#oIdeaFig"), W, H), yIn = [70, 160], xs = 300, xo = 478;
    arrowDefs(svg, "oi", css("--muted"));
    X.forEach((x, i) => {
      const col = css(w[i] >= 0 ? "--pos" : "--neg");
      el("line", { x1: 72, y1: yIn[i], x2: xs - 34, y2: 115, stroke: col, "stroke-width": 1 + 3 * Math.abs(w[i]), opacity: .8 }, svg);
      el("circle", { cx: 50, cy: yIn[i], r: 22, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: 50, y: yIn[i] + 5, "text-anchor": "middle", class: "mono", "font-size": 14 }, svg, fmt(x, 1));
      el("text", { x: 50, y: yIn[i] + 40, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, "x" + (i + 1));
      el("text", { x: 168, y: i ? 160 : 76, "text-anchor": "middle", class: "mono", "font-size": 13, fill: col }, svg, "w" + (i + 1) + " = " + fmt(w[i], 1));
    });
    el("text", { x: xs, y: 196, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, "+ bias " + fmt(B, 1));
    el("circle", { cx: xs, cy: 115, r: 34, fill: css("--arch-soft"), stroke: css("--arch"), "stroke-width": 2 }, svg);
    el("text", { x: xs, y: 110, "text-anchor": "middle", "font-size": 18 }, svg, "Σ");
    el("text", { x: xs, y: 130, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, fmt(z, 1));
    /* activation inset: the curve, with the current z marked */
    const zr = 6, rx = lin(-zr, zr, 360, 440), ry = lin(A.lo, A.hi, 150, 82), Z = Array.from({ length: 61 }, (_, i) => -zr + i * 2 * zr / 60);
    el("rect", { x: 354, y: 76, width: 92, height: 80, rx: 8, fill: css("--well") }, svg);
    if (A.lo < 0) el("line", { x1: 360, x2: 440, y1: ry(0), y2: ry(0), stroke: css("--line") }, svg);
    el("line", { x1: rx(0), x2: rx(0), y1: 82, y2: 150, stroke: css("--line") }, svg);
    el("path", { d: path(Z.map(v => [rx(v), ry(clamp(A.f(v), A.lo, A.hi))])), stroke: css("--muted"), fill: "none", "stroke-width": 2 }, svg);
    const out = a > 1e-9 ? "--ok" : a < -1e-9 ? "--lw" : "--muted";
    el("circle", { cx: rx(clamp(z, -zr, zr)), cy: ry(clamp(a, A.lo, A.hi)), r: 5, fill: css(out === "--muted" ? "--lw" : out) }, svg);
    el("text", { x: 400, y: 70, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, A.name);
    el("line", { x1: xs + 34, y1: 115, x2: 350, y2: 115, stroke: css("--muted"), "marker-end": "url(#oi)" }, svg);
    el("line", { x1: 448, y1: 115, x2: xo - 26, y2: 115, stroke: css("--muted"), "marker-end": "url(#oi)" }, svg);
    /* output node: fill shows how strongly it fires, relative to the function's range */
    el("circle", { cx: xo, cy: 115, r: 24, fill: `color-mix(in srgb, var(${out === "--muted" ? "--line" : out}) ${Math.round(15 + 60 * (out === "--lw" ? 1 - frac : frac))}%, var(--card))`, stroke: css(out === "--muted" ? "--line" : out), "stroke-width": 2 }, svg);
    el("text", { x: xo, y: 120, "text-anchor": "middle", class: "mono", "font-size": 13 }, svg, fmt(a, 2));
    el("text", { x: xo, y: 160, "text-anchor": "middle", "font-size": 12, fill: css(act === "relu" && out === "--muted" ? "--lw" : out) }, svg, act === "relu" ? (z > 0 ? "on" : "off") : "output");
  }
  render(); return render;
});

/* 2 · the map of five levels */
demo("o-map", () => {
  const L = [
    ["1", "Data Foundation", "data-foundation.html", "--data", "Turning the world into a clean table of numbers.", "Rain gauges vs. satellite rainfall; a station table with gaps where the gauge failed.", "Is the table honest: no leakage, no hidden bias, gaps handled?"],
    ["2", "Operations", "operations.html", "--arch", "The basic mechanisms, about thirty of them.", "A 3 × 3 filter on a temperature map; attention over a sentence.", "Which assumption about the data does each mechanism make?"],
    ["3", "Layers", "layers.html", "--accent", "Operations packaged with trainable weights.", "Conv 8 filters 3 × 3 on a 28 × 28 image: 80 parameters.", "What shape comes out, and how many weights does it cost?"],
    ["4", "Blocks", null, "--sw", "Repeated groups of layers.", "A residual block: output = input + small correction.", "Which group of layers do we repeat, and why does it train well?"],
    ["5", "Architecture Families", null, "--lw", "Whole designs chosen by data shape.", "U-Net for gridded rainfall; graph networks for river stations.", "Which family matches the shape of my data?"]];
  const host = $("#oMap"); let sel = 0;
  L.forEach((l, i) => {
    const a = document.createElement(l[2] ? "a" : "button"); a.className = "pick";
    if (l[2]) a.href = l[2]; else { a.type = "button"; a.title = "Coming next"; }
    a.style.borderLeftColor = `var(${l[3]})`;
    a.innerHTML = `<span class="opnum"></span><b></b><span></span>`;
    a.children[0].textContent = "Level " + l[0]; a.children[1].textContent = l[1]; a.children[2].textContent = l[4] + (l[2] ? "" : " (coming next)");
    const show = () => { sel = i; text(); };
    a.addEventListener("mouseenter", show); a.addEventListener("focus", show); if (!l[2]) a.addEventListener("click", show);
    host.appendChild(a);
  });
  function text() {
    const l = L[sel];
    $$(".pick", host).forEach((b, i) => b.setAttribute("aria-pressed", i === sel ? "true" : "false"));
    $("#oMapText").innerHTML = `<div class="two even" style="gap:18px"><div><h3>Example</h3><p style="margin:0"></p></div><div><h3>Key question</h3><p style="margin:0;font-weight:600"></p></div></div>`;
    const ps = $$("#oMapText p"); ps[0].textContent = l[5]; ps[1].textContent = l[6]; ps[1].style.color = `var(${l[3]})`;
  }
  text(); return text;
});

/* 3 · data foundation: a rain gauge with gaps, imputation and two leakage switches */
demo("o-data", () => {
  // day, rain today (mm, null = gauge failed; true value kept for the note), humidity (%), heavy rain tomorrow (> 20 mm)
  const rows = [[1, 0, 70, 0], [2, 3, 78, 0], [3, 22, 90, 1], [4, 1, 75, 0], [5, null, 93, 1, 38], [6, 8, 82, 0], [7, 0, 68, 0], [8, 20, 89, 1],
    [9, null, 84, 1, 41], [10, 0, 72, 0], [11, 30, 94, 1], [12, 15, 95, 0]].map(([day, rain, rh, y, truth]) => ({ day, rain, rh, y, truth }));
  const test = r => r.day > 8, obs = rows.filter(r => !test(r) && r.rain != null).map(r => r.rain);
  const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const fill = { mean: mean(obs), median: med(obs), flag: med(obs) };
  // the "trained" model: a fixed logistic rule; with the flag column it has also learned that a failed gauge means a storm
  const z = r => -4 + 0.12 * r.r + 0.2 * (r.rh - 80) + (imp === "flag" ? 4 * r.miss : 0);
  let imp = "mean"; const leak = { split: false, feat: false };
  chips($("#oImp"), v => { imp = v; render(); });
  $$("#oLeak button").forEach(b => b.addEventListener("click", () => { leak[b.dataset.v] = !leak[b.dataset.v]; b.setAttribute("aria-pressed", leak[b.dataset.v]); render(); }));
  function render() {
    rows.forEach(r => { r.miss = +(r.rain == null); r.r = r.miss ? fill[imp] : r.rain; r.pred = leak.feat ? r.y : +(z(r) > 0); });
    const T = rows.filter(test), acc = T.filter(r => r.pred === r.y).length / T.length;
    const fitOn = (leak.split ? rows : rows.filter(r => !test(r))).map(r => r.r);
    const cols = ["day", "rain today (mm)", "humidity (%)"].concat(imp === "flag" ? ["gauge failed"] : [], leak.feat ? ["flood alert"] : [], ["heavy rain tomorrow", "predicted"]);
    let h = `<table class="tb"><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
    rows.forEach(r => {
      const hit = r.pred === r.y;
      h += `<tr${test(r) ? ' style="background:var(--well)"' : ""}><td class="n" style="white-space:nowrap">${test(r) ? '<span class="mut" style="font-size:11px">test </span>' : ""}${r.day}</td>`
        + `<td class="n"${r.miss ? ' style="color:var(--sw);font-weight:600"' : ""}>${r.miss ? fmt(r.r, 1) : r.r}</td><td class="n">${r.rh}</td>`
        + (imp === "flag" ? `<td class="n">${r.miss}</td>` : "") + (leak.feat ? `<td class="n" style="color:var(--lw)">${r.y}</td>` : "")
        + `<td class="n">${r.y ? "yes" : "no"}</td><td class="n" style="color:var(${test(r) ? (hit ? "--ok" : "--lw") : "--muted"})">${r.pred ? "yes" : "no"}</td></tr>`;
    });
    $("#oDataTable").innerHTML = h + "</tbody></table>";
    $("#oDataRule").textContent = "Model: heavy rain tomorrow if −4 + 0.12 × rain + 0.2 × (humidity − 80)" + (imp === "flag" ? " + 4 × gauge failed" : "") + " > 0. Green: right on a test day; red: wrong.";
    $("#oDataRead").innerHTML = `<div><span>Filled rain</span><b class="c-sw">${fmt(fill[imp], 1)} mm</b></div>`
      + `<div><span>Test accuracy</span><b class="${leak.feat ? "c-lw" : acc >= .75 ? "c-ok" : "c-sw"}">${Math.round(acc * 100)}%</b></div>`
      + `<div><span>Rain scaler mean / sd</span><b>${fmt(mean(fitOn), 1)} / ${fmt(sd(fitOn), 1)}</b></div>`
      + `<div><span>Test days the scaler saw</span><b class="${leak.split ? "c-lw" : "c-ok"}">${leak.split ? T.length : 0}</b></div>`;
    const n = [];
    n.push(imp === "mean" ? `The mean (${fmt(fill.mean, 1)} mm) is pulled up by the few stormy days; rain is skewed, most days are nearly dry.`
      : imp === "median" ? `The median (${fmt(fill.median, 1)} mm) is a typical day, so the failed days look ordinary.`
      : "Gauges often fail in the heaviest storms (clogged funnels, power cuts), so a gap is itself a sign of a storm. With the flag column the model learns that, and day 9 is caught.");
    if (imp !== "flag") n.push("Day 9 really had 41 mm: any single fill value makes it look like an ordinary day, and the storm is missed. The gaps are not random.");
    n.push("Fill values come from the 8 training days only. Day 12 is humid but stayed below 20 mm: a miss no fill can fix.");
    if (leak.split) n.push("Scaling before the split lets the test days shape the mean and sd: information from the future reaches training. Here the score does not move, but the evaluation is no longer clean; in flexible models such leaks inflate scores.");
    if (leak.feat) n.push("The flood alert is issued after the heavy rain has fallen, so it reveals the answer: 100% on test, useless for a forecast.");
    $("#oDataNote").textContent = n.join(" ");
  }
  render(); return render;
});

/* 4 · operations: a 3 × 3 filter over the temperature map */
demo("o-ops", () => {
  // weights as integers over a divisor, so they read as on paper (2/16, 1/9 …)
  const K = {
    id: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1, "copies the centre cell: output = input", "Identity changes nothing: a filter whose only weight is 1 at the centre."],
    box: [[[1, 1, 1], [1, 1, 1], [1, 1, 1]], 9, "plain average of the 9 cells", "Box blur gives every neighbour the same weight, 1/9: a 3 × 3 moving average."],
    blur: [[[1, 2, 1], [2, 4, 2], [1, 2, 1]], 16, "weighted average, centre counts most: smooths the map", "Gaussian blur softens the sharp edges between cordilleras and valleys, but less crudely than the box."],
    sharp: [[[0, -1, 0], [-1, 5, -1], [0, -1, 0]], 1, "centre minus neighbours: boosts contrast", "Sharpen exaggerates the contrast at the edges of the mountains."],
    sx: [[[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], 1, "right minus left: west–east slopes", "Output: red where it gets warmer towards the east, blue where it gets colder; pale where flat."],
    sy: [[[-1, -2, -1], [0, 0, 0], [1, 2, 1]], 1, "below minus above: north–south slopes", "Output: red where it gets warmer towards the south, blue where it gets colder; pale where flat."],
    diag: [[[-2, -1, 0], [-1, 0, 1], [0, 1, 2]], 1, "lower-right minus upper-left: diagonal slopes", "Output: red where it gets warmer towards the south-east, blue towards the north-west. The cordilleras run SW → NE, so this catches their flanks."],
    lap: [[[0, 1, 0], [1, -4, 1], [0, 1, 0]], 1, "neighbours minus 4 × centre: bumps and dips", "Laplacian ignores even slopes and lights up curvature. Red: the cell is colder than its neighbours (cold peaks and ridge tops). Blue: warmer than its neighbours (valleys between the cordilleras)."],
    emb: [[[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], 1, "centre plus a diagonal slope: a relief-map look", "Emboss keeps the temperature and adds the diagonal slope, so the map looks lit from one side, like shaded relief."],
  };
  let k = "blur"; chips($("#oConvPick"), v => { k = v; render(); });
  const F = DS.temp, R = F.length, C = F[0].length;
  const inside = (i, j) => i >= 0 && j >= 0 && i < R && j < C && F[i][j] != null;
  const at = (i, j, c) => inside(i, j) ? F[i][j] : c;
  const conv = (M, d, i, j) => M.reduce((s, kr, a) => s + kr.reduce((t, w, b) => t + w * at(i + a - 1, j + b - 1, F[i][j]), 0), 0) / d;
  // start on the cell where the west–east slope is steepest, so the first click-free view is interesting
  let sel = [0, 0], best = -1;
  F.forEach((row, i) => row.forEach((v, j) => { if (v == null) return; const g = Math.abs(conv(K.sx[0], 1, i, j)); if (g > best) { best = g; sel = [i, j]; } }));
  const wl = (w, d) => d === 1 ? (w < 0 ? "−" + -w : "" + w) : (w < 0 ? "−" : "") + Math.abs(w) + "/" + d;
  function render() {
    const [M, d, short, legend] = K[k], O = F.map((row, i) => row.map((v, j) => v == null ? null : conv(M, d, i, j)));
    const tc = v => div(v - 20, 9), edge = M.flat().reduce((s, v) => s + v, 0) === 0;
    const mx = Math.max(...O.flat().filter(v => v != null).map(Math.abs));
    $("#oConvK").innerHTML = `<b>Filter weights</b><br>` + M.map(r => r.map(v => wl(v, d).padStart(5, " ")).join(" ")).join("<br>").replace(/ /g, "&nbsp;") + `<br><span class="m">${short}</span>`;
    const win = (i, j) => Math.abs(i - sel[0]) <= 1 && Math.abs(j - sel[1]) <= 1;
    fieldSVG($("#oConvIn"), F, { cell: 13, color: tc, hi: win, hover: false, onCell: (i, j) => { if (F[i][j] != null) { sel = [i, j]; render(); } } });
    fieldSVG($("#oConvOut"), O, { cell: 13, color: v => edge ? div(v, mx) : tc(v), hi: (i, j) => i === sel[0] && j === sel[1] });
    /* the selected cell, worked out: 9 products and their sum */
    const [si, sj] = sel; let ocean = false;
    const rows = M.map((kr, a) => kr.map((w, b) => { const ii = si + a - 1, jj = sj + b - 1, v = at(ii, jj, F[si][sj]); if (!inside(ii, jj)) ocean = true; return { v, w, p: w * v / d, own: inside(ii, jj) }; }));
    const sum = rows.flat().reduce((s, c) => s + c.p, 0);
    $("#oConvPix").innerHTML = `<b>Cell row ${si + 1}, column ${sj + 1}</b> <span class="m">(${fmt(F[si][sj], 1)} °C)</span><br>`
      + rows.map(r => r.map(c => `${c.own ? "" : "<span class=\"m\">"}${fmt(c.v, 1).padStart(4, " ")}${c.own ? "" : "</span>"}×<span class="k">${wl(c.w, d)}</span>`).join("  ")).join("<br>").replace(/ {2}/g, "&nbsp;&nbsp;")
      + `<br>sum = ${d === 1 ? "" : "(… ) / " + d + " = "}<span class="g">${fmt(sum, 2)}</span>${edge ? "" : " °C"} <span class="m">→ the highlighted output cell</span>`
      + (ocean ? `<br><span class="m">Grey values are ocean or off the map: the centre value is reused there.</span>` : "");
    $("#oConvLeg").textContent = (edge ? "Input: red warm, blue cold. " : "Both maps: red warm (lowlands, about 28 °C), blue cold (the Andes). ") + legend;
  }
  render(); return render;
});

/* 5 · layers: stack a small CNN, and open any layer to see where its parameters come from */
demo("o-layers", () => {
  let stack = ["conv", "pool"], sel = 1;
  const btns = $$("#oStackBtns button"), COLS = ["--arch", "--cool", "--sw", "--lw", "--mag", "--data"];
  function layers() {
    let s = [28, 28, 1]; const out = [{ t: "input", name: "Input image", inS: null, shape: s, p: 0 }];
    for (const t of stack) {
      const inS = s;
      if (t === "conv") { s = [s[0], s[1], 8]; out.push({ t, name: "Conv 8 filters 3×3", inS, shape: s, p: (9 * inS[2] + 1) * 8 }); }
      if (t === "pool") { s = [Math.floor(s[0] / 2), Math.floor(s[1] / 2), s[2]]; out.push({ t, name: "Max pool 2×2", inS, shape: s, p: 0 }); }
      if (t === "flat") { s = [s[0] * s[1] * s[2]]; out.push({ t, name: "Flatten", inS, shape: s, p: 0 }); }
      if (t === "dense") { s = [10]; out.push({ t, name: "Dense 10", inS, shape: s, p: (inS[0] + 1) * 10 }); }
    }
    let k = 0; out.forEach(l => { if (l.p) l.col = COLS[k++ % COLS.length]; });
    return out;
  }
  btns.forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.v;
    if (v === "undo") stack.pop(); else if (v === "reset") stack = []; else stack.push(v);
    sel = stack.length; render();
  }));
  const shp = s => s.join(" × ");
  function anatomy(l) {
    const W = 380, H = 175, svg = svgIn($("#oAnatFig"), W, H), r = rng(11);
    arrowDefs(svg, "oan", css("--muted"));
    const sq = (x, y, z, fill, stroke) => el("rect", { x, y, width: z, height: z, rx: 1.5, fill, stroke: stroke || "none", "stroke-width": 1.5 }, svg);
    const txt = (x, y, t, o = {}) => el("text", { x, y, "font-size": 12, fill: css("--muted"), ...o }, svg, t);
    let title = "", calc = "";
    if (l.t === "conv") {
      const cin = l.inS[2], per = 9 * cin, pos = l.inS[0] * l.inS[1];
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) sq(4 + j * 13, 30 + i * 13, 11, css("--well"), (i >= 1 && i <= 3 && j >= 1 && j <= 3) ? css(l.col) : null);
      txt(42, 124, "input", { "text-anchor": "middle" }); txt(42, 139, shp(l.inS), { "text-anchor": "middle", class: "mono" });
      el("line", { x1: 86, y1: 69, x2: 110, y2: 69, stroke: css("--muted"), "marker-end": "url(#oan)" }, svg);
      txt(116, 14, "8 filters, each with its own weights", { fill: css(l.col) });
      for (let f = 0; f < 8; f++) {
        const x0 = 116 + f * 33, y0 = 40, depth = Math.min(cin, 3);
        for (let d = depth - 1; d >= 0; d--) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
          sq(x0 + d * 3 + j * 8, y0 - d * 3 + i * 8, 7, d ? css("--line") : div(r() * 2 - 1, 1));
        if (cin > 1) txt(x0 + 12, y0 + 38, "×" + cin, { "text-anchor": "middle", "font-size": 11 });
        el("circle", { cx: x0 + 11, cy: y0 + 52, r: 5, fill: css("--sw") }, svg);
      }
      txt(116, 122, `each filter: 3 × 3${cin > 1 ? " × " + cin : ""} = ${per} weights`, { fill: css("--fg") });
      el("circle", { cx: 121, cy: 136, r: 5, fill: css("--sw") }, svg); txt(131, 140, "+ 1 bias per filter", { fill: css("--fg") });
      txt(4, 166, `The window slides over all ${fmtN(pos)} positions, always with the same filters.`, { "font-size": 11.5 });
      title = `Conv 8 filters 3×3: where the ${fmtN(l.p)} come from`;
      calc = `one filter: 3 × 3${cin > 1 ? ` × <span class="k">${cin}</span> channels` : ""} = ${per} weights + 1 bias = <b>${per + 1}</b><br>`
        + `8 filters × ${per + 1} = <span class="g">${fmtN(l.p)}</span> parameters<br>`
        + `<span class="m">${cin > 1 ? `With ${cin} input channels each filter has one 3 × 3 slice per channel. ` : ""}The same numbers are reused at every position, so a bigger image needs no more parameters.</span>`;
    } else if (l.t === "dense") {
      const nin = l.inS[0], ys = [26, 42, 58, 74, 106, 122, 138], yo = Array.from({ length: 10 }, (_, k) => 20 + k * 13.5);
      ys.forEach(y => yo.forEach((y2, k) => el("line", { x1: 26, y1: y, x2: 132, y2: y2, stroke: css(k === 0 ? l.col : "--line"), "stroke-width": k === 0 ? 1.4 : .5, opacity: k === 0 ? 1 : .6 }, svg)));
      ys.forEach(y => el("circle", { cx: 20, cy: y, r: 5.5, fill: css("--data") }, svg));
      txt(20, 94, "⋮", { "text-anchor": "middle", "font-size": 16 }); txt(4, 160, `${fmtN(nin)} inputs`);
      yo.forEach((y, k) => el("circle", { cx: 138, cy: y, r: 5, fill: css(k === 0 ? l.col : "--arch-soft"), stroke: css(l.col) }, svg));
      txt(112, 172, "10 neurons");
      txt(150, 24, "← neuron 1 gets one weight", { fill: css(l.col) }); txt(150, 39, `   from every input: ${fmtN(nin)}`, { fill: css(l.col) });
      const mx = 220, my = 70, mw = 120, mh = 70;
      for (let k = 0; k < 10; k++) for (let c = 0; c < 24; c++) el("rect", { x: mx + c * mw / 24, y: my + k * mh / 10, width: mw / 24 - .6, height: mh / 10 - .6, fill: k === 0 ? css(l.col) : div(r() * 2 - 1, 1.3) }, svg);
      for (let k = 0; k < 10; k++) el("rect", { x: mx + mw + 6, y: my + k * mh / 10, width: 8, height: mh / 10 - .6, fill: css("--sw") }, svg);
      txt(mx, my - 8, `weights W: 10 × ${fmtN(nin)}`, { fill: css("--fg") }); txt(mx + mw - 10, my + mh + 15, "bias b: 10", { fill: css("--sw") });
      txt(mx, my + mh + 30, "one row per neuron");
      title = `Dense 10: where the ${fmtN(l.p)} come from`;
      calc = `one neuron: ${fmtN(nin)} weights (one per input) + 1 bias = <b>${fmtN(nin + 1)}</b><br>`
        + `10 neurons × ${fmtN(nin + 1)} = <span class="g">${fmtN(l.p)}</span> parameters<br>`
        + `<span class="m">Every input connects to every neuron, so the count grows with the size of the input. That is why the dense layer usually holds most of the parameters.</span>`;
    } else if (l.t === "pool") {
      const G = [[24, 26, 18, 17], [25, 23, 16, 15], [22, 21, 12, 14], [20, 19, 13, 11]], c = 25;
      G.forEach((row, i) => row.forEach((v, j) => {
        const bi = Math.floor(i / 2) * 2, bj = Math.floor(j / 2) * 2, isMax = v === Math.max(G[bi][bj], G[bi][bj + 1], G[bi + 1][bj], G[bi + 1][bj + 1]);
        const x = 4 + j * c + (j > 1 ? 5 : 0), y = 26 + i * c + (i > 1 ? 5 : 0);
        el("rect", { x, y, width: c - 2, height: c - 2, rx: 4, fill: css(isMax ? "--cool-soft" : "--well"), stroke: isMax ? css("--cool") : "none" }, svg);
        txt(x + 11.5, y + 16, v, { "text-anchor": "middle", class: "mono", fill: css("--fg") });
      }));
      el("line", { x1: 116, y1: 80, x2: 152, y2: 80, stroke: css("--muted"), "marker-end": "url(#oan)" }, svg); txt(134, 72, "max", { "text-anchor": "middle" });
      [[26, 18], [22, 14]].forEach((row, i) => row.forEach((v, j) => { el("rect", { x: 160 + j * 30, y: 52 + i * 30, width: 28, height: 28, rx: 4, fill: css("--cool-soft"), stroke: css("--cool") }, svg); txt(174 + j * 30, 71 + i * 30, v, { "text-anchor": "middle", class: "mono", fill: css("--fg") }); }));
      txt(234, 68, "a fixed rule:", { fill: css("--fg") }); txt(234, 84, "keep the largest of 4"); txt(234, 100, "nothing to learn");
      title = "Max pool 2×2: no parameters";
      calc = `Each 2 × 2 block is replaced by its largest value. The rule is fixed, so there is nothing to learn: <span class="g">0</span> parameters.<br><span class="m">It only shrinks the grid: ${shp(l.inS)} → ${shp(l.shape)}.</span>`;
    } else if (l.t === "flat") {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { el("rect", { x: 4 + j * 25, y: 44 + i * 25, width: 23, height: 23, rx: 3, fill: div((i * 3 + j) / 4 - 1, 1.2) }, svg); txt(15.5 + j * 25, 60 + i * 25, i * 3 + j + 1, { "text-anchor": "middle", class: "mono", fill: css("--fg") }); }
      el("line", { x1: 86, y1: 81, x2: 112, y2: 81, stroke: css("--muted"), "marker-end": "url(#oan)" }, svg);
      for (let k = 0; k < 9; k++) { el("rect", { x: 118 + k * 28, y: 69, width: 26, height: 24, rx: 3, fill: div(k / 4 - 1, 1.2) }, svg); txt(131 + k * 28, 86, k + 1, { "text-anchor": "middle", class: "mono", fill: css("--fg") }); }
      txt(118, 120, "the same numbers in one row: nothing to learn");
      title = "Flatten: no parameters";
      calc = `${shp(l.inS)} = ${fmtN(l.shape[0])} numbers, rearranged into one list so a dense layer can read them: <span class="g">0</span> parameters.`;
    } else {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) sq(4 + j * 15, 24 + i * 15, 13, heat(Math.exp(-((i - 3) ** 2 + (j - 3) ** 2) / 5), 0, 1));
      txt(124, 66, "the data itself:", { fill: css("--fg") }); txt(124, 82, "28 × 28 pixels × 1 channel"); txt(124, 98, "= 784 numbers, nothing to learn");
      title = "Input: no parameters";
      calc = `The input layer is just the data's shape, ${shp(l.shape)}: <span class="g">0</span> parameters.`;
    }
    $("#oAnatT").textContent = title; $("#oAnatCalc").innerHTML = calc;
  }
  function render() {
    const L = layers(), last = L[L.length - 1].shape, flat = last.length === 1, full = stack.length >= 7;
    sel = clamp(sel, 0, L.length - 1);
    btns.forEach(b => {
      const v = b.dataset.v;
      b.disabled = v === "undo" || v === "reset" ? !stack.length : full || ((v === "conv" || v === "pool" || v === "flat") ? flat || (v === "pool" && last[0] < 2) : !flat);
    });
    $("#oStackNote").textContent = flat ? "The data is now a flat list: only dense layers can follow. Remove layers to add convolutions again."
      : "Convolution and pooling keep the grid. Flatten before a dense layer, which needs a list.";
    const W = 480, rh = 30, gap = 8, H = L.length * (rh + gap), svg = svgIn($("#oStackFig"), W, H);
    L.forEach((l, i) => {
      const y = i * (rh + gap), col = i === 0 ? "--data" : l.p ? l.col : "--muted", on = i === sel;
      const g = el("g", { style: "cursor:pointer", role: "button", tabindex: 0, "aria-label": l.name }, svg);
      el("rect", { x: 2, y, width: W - 4, height: rh, rx: 8, fill: `color-mix(in srgb, var(${col}) ${on ? 26 : 10}%, var(--card))`, stroke: css(col), "stroke-width": on ? 2.5 : 1 }, g);
      el("text", { x: 14, y: y + 19, "font-size": 13, "font-weight": on ? 600 : 400 }, g, l.name);
      el("text", { x: 250, y: y + 19, class: "mono", "font-size": 12.5 }, g, shp(l.shape));
      el("text", { x: W - 14, y: y + 19, "text-anchor": "end", class: "mono", "font-size": 12.5, fill: css(l.p ? l.col : "--muted") }, g, l.p ? fmtN(l.p) + " params" : "0");
      const pick = () => { sel = i; render(); };
      g.addEventListener("click", pick); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
    /* share of all parameters, one segment per trainable layer */
    const tot = L.reduce((s, l) => s + l.p, 0), sv = svgIn($("#oShareFig"), W, 48);
    if (!tot) el("text", { x: 0, y: 24, "font-size": 12, fill: css("--muted") }, sv, "No trainable layers yet.");
    let x = 0; L.forEach(l => {
      if (!l.p) return; const w = Math.max(2, (W - 2) * l.p / tot);
      el("rect", { x, y: 2, width: w, height: 24, fill: css(l.col), opacity: .85 }, sv);
      if (w > 70) el("text", { x: x + 6, y: 19, "font-size": 11.5, fill: css("--bg") }, sv, `${l.name.split(" ")[0]} ${fmt(100 * l.p / tot, 1)}%`);
      x += w;
    });
    const big = L.reduce((a, l) => l.p > a.p ? l : a, L[0]);
    if (tot) el("text", { x: 0, y: 44, "font-size": 11.5, fill: css("--muted") }, sv, `${big.name} holds ${fmt(100 * big.p / tot, 1)}% of all ${fmtN(tot)} parameters`);
    $("#oStackRead").innerHTML = `<div><span>Output shape</span><b>${shp(last)}</b></div><div><span>Trainable parameters</span><b class="c-arch">${fmtN(tot)}</b></div>`;
    anatomy(L[sel]);
  }
  render(); return render;
});

/* 6 · blocks: a residual block, input 5 plus a correction */
demo("o-blocks", () => {
  let on = true; chips($("#oSkip"), v => { on = v === "on"; render(); });
  const gc = slider("oCorr", v => (v > 0 ? "+" : "") + fmt(v, 1), () => render());
  function render() {
    const x = 5, f = gc(), y = on ? x + f : f;
    const W = 540, H = 200, svg = svgIn($("#oBlockFig"), W, H), yM = 120;
    arrowDefs(svg, "ob", css("--muted")); arrowDefs(svg, "obs", css("--ok"));
    const node = (cx, txt, sub, col) => { el("rect", { x: cx - 46, y: yM - 24, width: 92, height: 48, rx: 10, fill: `color-mix(in srgb, var(${col}) 12%, var(--card))`, stroke: css(col) }, svg);
      el("text", { x: cx, y: yM - 2, "text-anchor": "middle", "font-size": 13 }, svg, txt); el("text", { x: cx, y: yM + 15, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, sub); };
    node(60, "input x", fmt(x, 1), "--data");
    node(230, "layer F(x)", (f > 0 ? "+" : "") + fmt(f, 1), "--arch");
    if (on) {
      el("circle", { cx: 360, cy: yM, r: 18, fill: css("--card"), stroke: css("--ok") }, svg);
      el("text", { x: 360, y: yM + 6, "text-anchor": "middle", "font-size": 18 }, svg, "+");
      el("line", { x1: 276, y1: yM, x2: 340, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
      el("line", { x1: 378, y1: yM, x2: 432, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
    } else el("line", { x1: 276, y1: yM, x2: 432, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
    node(480, "output", fmt(y, 1), on ? "--ok" : "--lw");
    el("line", { x1: 106, y1: yM, x2: 182, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
    el("path", { d: `M60 ${yM - 24} C60 20, 360 20, 360 ${yM - 20}`, fill: "none", stroke: css(on ? "--ok" : "--line"), "stroke-width": on ? 3 : 1.5, "stroke-dasharray": on ? "" : "5 5", "marker-end": on ? "url(#obs)" : "" }, svg);
    el("text", { x: 210, y: 36, "text-anchor": "middle", "font-size": 12, fill: css(on ? "--ok" : "--muted") }, svg, on ? "shortcut (skip connection): a copy of x goes around the layer" : "shortcut removed: only the layer's path is left");
    const target = x + f, tf = fmt(target, 1);
    $("#oBlockRead").innerHTML = `<div><span>Output</span><b class="${on ? "c-ok" : "c-lw"}">${fmt(y, 1)}</b></div><div><span>Formula</span><b style="font-size:18px">${on ? "x + F(x) = 5 + " + fmt(f, 1) : "F(x) = " + fmt(f, 1)}</b></div>`
      + `<div><span>To output ${tf}, F must learn</span><b class="c-arch" style="font-size:18px">${on ? fmt(f, 1) + " (small)" : tf + " (all of it)"}</b></div>`
      + `<p class="note" style="flex-basis:100%;margin:0">${on ? "The layer only has to learn the small correction; the input passes through unchanged. With F = 0, the block simply copies its input, which is why deep stacks of these blocks train well."
        : `Same layer, shortcut removed: the input 5 is lost and only ${fmt(f, 1)} comes out. A plain layer that should output ${tf} has to learn the whole value itself, not just a small correction.`}</p>`;
    /* the same thing in everyday terms: tomorrow's river level */
    const ch = (f >= 0 ? "+" : "−") + fmt(Math.abs(f), 1) + " m";
    $("#oBlockLay").innerHTML = `<b>In everyday terms: forecasting a river.</b> The river is at <b>5.0 m</b> today (the input x); the block must say how high it will be tomorrow.<br><span style="display:block;height:6px"></span>`
      + (on ? `With the shortcut, the forecaster is handed today's level and only predicts the <b>change</b>, ${ch}, so the forecast is 5.0 ${f >= 0 ? "+" : "−"} ${fmt(Math.abs(f), 1)} = <b>${fmt(y, 1)} m</b>. `
          + (Math.abs(f) < 0.05 ? "Even with no idea at all (change 0) it says “same as today”, 5.0 m: a sensible first guess." : "If it had no idea at all (change 0), it would still say “same as today”, 5.0 m: a sensible first guess.")
        : `Without the shortcut, the forecaster still looks at today's level but must write the <b>whole</b> answer itself. This layer outputs only ${fmt(f, 1)}, so the forecast is <b>${fmt(f, 1)} m</b>. To be right it must learn to say ${tf} m from scratch, and an untrained one that outputs 0 claims the river is dry.`)
      + `<span style="display:block;color:var(--muted);font-size:13.5px;margin-top:6px">Stack 50 blocks: with shortcuts each one adds a small correction to a value that is passed along intact. Without them, every layer must copy everything forward perfectly, like a message whispered down a line of 50 people.</span>`;
  }
  render(); return render;
});

/* 7 · families: choose by the shape of the data */
demo("o-families", () => {
  const F = [
    ["MLP", ["table"], "Dense layers on a feature vector.", "Student attrition from a table of features."],
    ["CNN", ["grid"], "Convolutions over a grid.", "Detecting storms in radar or satellite images."],
    ["U-Net", ["grid", "field"], "Encoder–decoder CNN with skips; grid in, grid out.", "Downscaling rainfall maps; segmenting clouds."],
    ["Autoencoder", ["table", "grid"], "Compress to a small code, then rebuild.", "Anomaly detection in sensor records."],
    ["RNN / LSTM", ["seq"], "Recurrence with memory, step by step.", "Next-day streamflow from past rain and flow."],
    ["Transformer", ["seq"], "Attention: any step can look at any other.", "Long weather sequences; text."],
    ["Graph network", ["graph"], "Message passing along given links.", "River gauges along a network; mesh weather models."],
    ["Neural operator (FNO)", ["field"], "Learns maps between functions, at any resolution.", "Fast surrogates for fluid or ocean models."]];
  let shape = "table"; chips($("#oShape"), v => { shape = v; render(); });
  function render() {
    const host = $("#oFam"); host.innerHTML = "";
    F.forEach(f => {
      const hit = f[1].includes(shape), d = document.createElement("div"); d.className = "card";
      d.style.cssText = `transition:opacity .2s;opacity:${hit ? 1 : .38};${hit ? "border-color:var(--arch);background:color-mix(in srgb,var(--arch) 9%,var(--card))" : ""}`;
      d.innerHTML = `<h4 style="margin:0 0 4px"></h4><p style="margin:0 0 6px;font-size:13.5px"></p><p class="note" style="margin:0"></p>`;
      d.children[0].textContent = f[0]; d.children[1].textContent = f[2]; d.children[2].textContent = "e.g. " + f[3];
      if (hit) d.children[0].style.color = "var(--arch)";
      host.appendChild(d);
    });
  }
  render(); return render;
});

/* 8 · inductive bias: five rainfall days wired five ways */
demo("o-bias", () => {
  const vals = [3, 0, 12, 1, 10], days = ["Mon", "Tue", "Wed", "Thu", "Fri"], gE = [[0, 2], [1, 3], [2, 4], [0, 4]];
  let op = "dense", tgt = 2; chips($("#oBiasPick"), v => { op = v; render(); });
  function render() {
    const W = 480, H = op === "graph" ? 290 : 250, svg = svgIn($("#oBiasFig"), W, H), x = i => 60 + i * 90, yIn = 200, yOut = 40, yH = 122;
    arrowDefs(svg, "obi", css("--arch"));
    { const mk = svg.querySelector("marker"); mk.setAttribute("markerUnits", "userSpaceOnUse"); mk.setAttribute("markerWidth", 9); mk.setAttribute("markerHeight", 9); } // same arrowhead size on thick lines
    let links = [], note = "";
    if (op === "dense") { links = vals.map((_, i) => [i, 1]); note = "Every day feeds the output with its own weight: 5 weights per output, 25 for the layer."; }
    if (op === "conv") { links = [-1, 0, 1].map(d => [tgt + d, 1, d]).filter(l => l[0] >= 0 && l[0] < 5); note = "Only the neighbouring days, with the same 3 weights reused for every output day."; }
    if (op === "attn") { const s = softmax(vals.map(v => -Math.abs(v - vals[tgt]) / 2)); links = vals.map((_, i) => [i, s[i]]); note = "Every day may connect; days with similar rain get more weight. The weights are computed from the content."; }
    if (op === "graph") { const nb = gE.filter(e => e.includes(tgt)).map(e => e[0] === tgt ? e[1] : e[0]); links = [[tgt, 1], ...nb.map(n => [n, 1])]; note = `Only links in the given graph count (think of 5 stations, not days): ${nb.length} neighbour${nb.length === 1 ? "" : "s"} here.`; }
    if (op === "rnn") note = "The output reads only the memory, carried forward one day at a time with the same 2 weights.";
    vals.forEach((v, i) => {
      el("circle", { cx: x(i), cy: yIn, r: 18, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: x(i), y: yIn + 5, "text-anchor": "middle", class: "mono", "font-size": 13 }, svg, v);
      el("text", { x: x(i), y: yIn + 36, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, op === "graph" ? "S" + (i + 1) : days[i]);
      const g = el("g", { style: "cursor:pointer" }, svg);
      el("circle", { cx: x(i), cy: yOut, r: 16, fill: i === tgt ? css("--arch") : css("--card"), stroke: css(i === tgt ? "--arch" : "--line") }, g);
      el("text", { x: x(i), y: yOut + 4, "text-anchor": "middle", "font-size": 11, fill: i === tgt ? css("--bg") : css("--muted") }, g, "out");
      g.addEventListener("click", () => { tgt = i; render(); });
    });
    if (op === "rnn") {
      for (let i = 0; i <= tgt; i++) {
        el("rect", { x: x(i) - 16, y: yH - 13, width: 32, height: 26, rx: 8, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
        el("text", { x: x(i), y: yH + 4, "text-anchor": "middle", "font-size": 11, class: "mono" }, svg, "h" + (i + 1));
        el("line", { x1: x(i), y1: yIn - 18, x2: x(i), y2: yH + 15, stroke: css("--arch"), "marker-end": "url(#obi)" }, svg);
        if (i < tgt) el("line", { x1: x(i) + 16, y1: yH, x2: x(i + 1) - 18, y2: yH, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#obi)" }, svg);
      }
      el("line", { x1: x(tgt), y1: yH - 13, x2: x(tgt), y2: yOut + 18, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#obi)" }, svg);
    } else {
      const wcol = ["--sw", "--arch", "--cool"];
      links.forEach(([i, w, d]) => el("line", { x1: x(i), y1: yIn - 18, x2: x(tgt), y2: yOut + 16, stroke: css(op === "conv" ? wcol[d + 1] : "--arch"), "stroke-width": op === "attn" ? 0.6 + 9 * w : 2, opacity: op === "attn" ? .35 + .65 * w : .85, "marker-end": "url(#obi)" }, svg));
      if (op === "attn") links.forEach(([i, w]) => { if (i !== tgt) el("text", { x: x(i) + (x(tgt) - x(i)) * 0.22 + (i < tgt ? -6 : 6), y: yIn - 18 - (yIn - yOut - 34) * 0.22, "text-anchor": i < tgt ? "end" : "start", class: "mono", "font-size": 11.5, fill: css("--arch") }, svg, fmtN(100 * w) + "%"); });
      if (op === "attn") el("text", { x: x(tgt) + 10, y: (yIn + yOut) / 2 + 30, class: "mono", "font-size": 11.5, fill: css("--arch") }, svg, fmtN(100 * links[tgt][1]) + "%");
      if (op === "graph") gE.forEach(([a, b]) => el("path", { d: `M${x(a)} ${yIn + 44} Q${(x(a) + x(b)) / 2} ${yIn + 44 + 18 * Math.abs(a - b)} ${x(b)} ${yIn + 44}`, fill: "none", stroke: css(a === tgt || b === tgt ? "--arch" : "--muted"), "stroke-width": a === tgt || b === tgt ? 2 : 1, "stroke-dasharray": a === tgt || b === tgt ? "" : "3 3", opacity: a === tgt || b === tgt ? 1 : .6 }, svg));
    }
    $("#oBiasNote").textContent = note;
    /* the same wiring in everyday terms: whom does this day listen to? */
    const D = days[tgt], full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][tgt];
    const nbs = gE.filter(e => e.includes(tgt)).map(e => e[0] === tgt ? e[1] : e[0]).map(i => "S" + (i + 1)).join(" and ");
    const sAttn = softmax(vals.map(v => -Math.abs(v - vals[tgt]) / 2)), top = sAttn.map((w, i) => [w, i]).filter(([, i]) => i !== tgt).sort((a, b) => b[0] - a[0])[0];
    const T = {
      dense: ["A committee with fixed seats.", `To describe ${full}, every day of the week gets a vote, and how much each vote counts was fixed during training. ${D} always listens to Monday by the same amount, whatever the weather that week.`, "Nothing about the data: any day may matter, so it needs the most weights and the most examples to learn them."],
      conv: ["Ask only the next-door neighbours.", `${full} looks only at the day before, itself and the day after, like a 3-day moving average. Every day uses the same three weights, so a pattern learned on one Wednesday works on any day.`, "Nearby days matter most, and the same pattern can happen at any time."],
      rnn: ["Keep a diary.", `Read the week one day at a time and keep a running summary in your head. When you reach ${full} you only have your notes, not the raw numbers, and you have not read the days after it yet.`, "Order matters and only the past counts; old days fade unless the memory keeps them."],
      attn: ["In a meeting, listen to those who sound like you.", `${full} (${vals[tgt]} mm) looks around and listens most to the days that resemble it. Itself counts most (${fmtN(100 * sAttn[tgt])}%), then ${days[top[1]]} with ${vals[top[1]]} mm (${fmtN(100 * top[0])}%); the days that look nothing like it get almost nothing. Next week the rain is different, so the weights are recomputed, unlike the fixed votes of dense.`, "Anything can relate to anything; how much is decided by the content, every time."],
      graph: ["Only talk to the stations you are linked to.", `Think of the five as rain stations along a river. S${tgt + 1} listens only to ${nbs || "no one"}, because the map says they are connected (upstream or downstream), not because they are next in the list.`, "The connections are known in advance and given to the network."],
    }[op];
    $("#oBiasLay").innerHTML = `<b>In everyday terms: ${T[0]}</b><br>${T[1]}<span style="display:block;color:var(--muted);font-size:13.5px;margin-top:6px"><b>Assumption built in:</b> ${T[2]}</span>`;
  }
  render(); return render;
});

/* 9 · how it learns: gradient descent on ŷ = w·x + b, temperature vs elevation */
demo("o-learn", () => {
  const P = [[0.1, 27.6], [0.5, 25.1], [1.5, 18.9], [2.2, 14.2], [2.6, 11.6]], names = ["A", "B", "C", "D", "E"];
  const mx = mean(P.map(p => p[0])), mxx = mean(P.map(p => p[0] ** 2)), mxy = mean(P.map(p => p[0] * p[1])), my = mean(P.map(p => p[1]));
  const wBest = (mxy - mx * my) / (mxx - mx * mx), bBest = my - wBest * mx;          // least-squares answer, for the landscape only
  const lamMax = 2 * ((mxx + 1) + Math.sqrt((mxx - 1) ** 2 + 4 * mx * mx)) / 2, etaMax = 2 / lamMax;   // steps above this overshoot
  let w, b, hist, trail, last, timer = null, rnd = rng(7);
  const gl = slider("oLr", v => fmt(v, 2), () => render());
  $$("#o-learn details.why").forEach(d => d.addEventListener("toggle", fitSlide));   // re-fit the slide when a note opens or closes
  const lossAt = (w, b) => mean(P.map(([x, y]) => (w * x + b - y) ** 2));
  const grads = () => { const e = P.map(([x, y]) => w * x + b - y); return { e, gw: mean(e.map((v, i) => 2 * v * P[i][0])), gb: mean(e.map(v => 2 * v)) }; };
  function reset() { w = +(-4 + 8 * rnd()).toFixed(1); b = +(5 + 15 * rnd()).toFixed(1); hist = [lossAt(w, b)]; trail = [[w, b]]; last = null; }
  function step() {
    const lr = gl(), { gw, gb } = grads(), w0 = w, b0 = b;
    w -= lr * gw; b -= lr * gb; hist.push(lossAt(w, b)); trail.push([w, b]);
    last = { lr, gw, gb, w0, b0 };
    if (!isFinite(w) || Math.abs(w) > 1e6) { stop(); reset(); last = { blown: true }; }
  }
  function stop() { clearInterval(timer); timer = null; $("#oTrainPlay").textContent = "Autoplay"; }
  $("#oTrain1").addEventListener("click", () => { step(); render(); });
  $("#oTrainReset").addEventListener("click", () => { stop(); reset(); render(); });
  $("#oTrainPlay").addEventListener("click", () => {
    if (timer) return stop();
    $("#oTrainPlay").textContent = "Pause";
    timer = setInterval(() => { step(); render(); if (hist.length > 300) stop(); }, 90);
  });
  const f2 = v => (v >= 0 ? "+" : "−") + fmt(Math.abs(v), Math.abs(v) >= 100 ? 0 : 2);
  function render() {
    const { e, gw, gb } = grads(), L = lossAt(w, b), lr = gl();
    /* the four steps, with numbers */
    $("#oLearnSteps").innerHTML =
      `<b>1 · Predict</b> ŷ = w·x + b at each station <span class="m">(w = ${fmt(w, 2)}, b = ${fmt(b, 1)})</span><br>`
      + `<b>2 · Measure</b> errors ŷ − y = [${e.map(v => f2(v)).join(", ")}] °C<br>`
      + `&nbsp;&nbsp;&nbsp;&nbsp;mean squared error E = <span class="r">${L < 0.1 ? fmt(L, 3) : fmt(L, 1)}</span><br>`
      + `<b>3 · Direction</b> ∂E/∂w = mean(2·err·x) = <span class="k">${f2(gw)}</span>, ∂E/∂b = mean(2·err) = <span class="k">${f2(gb)}</span><br>`
      + `<b>4 · Nudge</b> <span class="m">(what Train does next)</span><br>&nbsp;&nbsp;&nbsp;&nbsp;w ← ${fmt(w, 2)} − ${fmt(lr, 2)} × (${f2(gw)}) = <span class="g">${fmt(w - lr * gw, 2)}</span><br>`
      + `&nbsp;&nbsp;&nbsp;&nbsp;b ← ${fmt(b, 2)} − ${fmt(lr, 2)} × (${f2(gb)}) = <span class="g">${fmt(b - lr * gb, 2)}</span>`;
    /* why one point is enough: the formula's slope versus a brute-force check with a tiny nudge */
    const hh = 0.01, Ew = lossAt(w + hh, b), num = (Ew - L) / hh;
    $("#oLearnWhy").innerHTML = `<p>No. The error is a formula of w and b, E = mean((w·x + b − y)²), so calculus gives its slope exactly at the current point: ∂E/∂w = mean(2·err·x) uses only the five errors you see now. One point is enough.</p>`
      + `<p><b>Check by trial:</b> nudge w by ${hh} and recompute the error: E goes from ${fmt(L, 3)} to ${fmt(Ew, 3)}, so the slope ≈ (${fmt(Ew, 3)} − ${fmt(L, 3)}) / ${hh} = <b>${fmt(num, 2)}</b>, almost exactly the formula's <b>${fmt(gw, 2)}</b>.</p>`
      + `<p style="color:var(--muted)">Trial nudges cost one extra calculation per weight, which is hopeless with millions of weights. Real networks use <b>backpropagation</b>: the chain rule applied layer by layer gives every weight's slope in one backward pass.</p>`;
    /* fit chart with error bars labelled */
    const W = 460, H = 190, svg = svgIn($("#oLearnFig"), W, H);
    const A = axes(svg, { W, H, x0: 0, x1: 3, y0: 0, y1: 32, xt: [0, 1, 2], yt: [0, 10, 20, 30], xl: "elevation (km)", yl: "temperature (°C)" });
    const yl = v => A.y(clamp(v, -2, 34));
    el("path", { d: path([[A.x(0), yl(b)], [A.x(3), yl(w * 3 + b)]]), stroke: css("--arch"), "stroke-width": 2.5, fill: "none" }, svg);
    P.forEach(([x, y], i) => {
      el("line", { x1: A.x(x), x2: A.x(x), y1: A.y(y), y2: yl(w * x + b), stroke: css("--lw"), "stroke-dasharray": "3 3" }, svg);
      el("circle", { cx: A.x(x), cy: A.y(y), r: 5, fill: css("--data") }, svg);
      el("text", { x: A.x(x) - 8, y: A.y(y) - 6, "text-anchor": "end", "font-size": 11, fill: css("--muted") }, svg, names[i]);
      if (Math.abs(e[i]) >= 0.05) el("text", { x: A.x(x) + 8, y: (A.y(y) + yl(w * x + b)) / 2 + 4, class: "mono", "font-size": 10.5, fill: css("--lw") }, svg, f2(e[i]));
    });
    /* error per step, log scale */
    const W2 = 230, H2 = 150, s2 = svgIn($("#oLossFig"), W2, H2), Lg = hist.map(v => Math.log10(Math.max(v, 1e-3)));
    const n = Math.max(20, hist.length - 1), top = Math.max(3, Math.ceil(Math.max(...Lg))), bot = Math.min(-1, Math.floor(Math.min(...Lg)));
    const B = axes(s2, { W: W2, H: H2, m: { l: 40, r: 8, t: 10, b: 24 }, x0: 0, x1: n, y0: bot, y1: top, xt: [0, n], yt: [bot, top], yf: v => "1e" + v });
    el("path", { d: path(Lg.map((v, i) => [B.x(i), B.y(v)])), stroke: css("--lw"), "stroke-width": 2, fill: "none" }, s2);
    el("circle", { cx: B.x(Lg.length - 1), cy: B.y(Lg[Lg.length - 1]), r: 4, fill: css("--lw") }, s2);
    /* landscape over (w, b) with the path */
    const W3 = 230, H3 = 150, s3 = svgIn($("#oLandFig"), W3, H3), w0 = -10, w1 = 4, b0 = 5, b1 = 35, nx = 28, ny = 20;
    const X = lin(w0, w1, 30, W3 - 6), Y = lin(b0, b1, H3 - 22, 6), cw = (W3 - 36) / nx, ch = (H3 - 28) / ny;
    const lmin = Math.log10(lossAt(wBest, bBest) + 1e-3), lmax = Math.log10(lossAt(w0, b0));
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const ww = w0 + (i + .5) * (w1 - w0) / nx, bb = b0 + (j + .5) * (b1 - b0) / ny;
      el("rect", { x: 30 + i * cw, y: H3 - 22 - (j + 1) * ch, width: cw + .5, height: ch + .5, fill: heat(lmax - Math.log10(lossAt(ww, bb) + 1e-3), 0, lmax - lmin) }, s3);
    }
    [[w0, "−10"], [-5, "−5"], [0, "0"]].forEach(([v, t]) => el("text", { x: X(v), y: H3 - 8, "text-anchor": "middle", class: "mut mono", "font-size": 10 }, s3, t));
    [[b0, "5"], [b1, "35"]].forEach(([v, t]) => el("text", { x: 26, y: Y(v) + 4, "text-anchor": "end", class: "mut mono", "font-size": 10 }, s3, t));
    el("text", { x: W3 - 6, y: H3 - 8, "text-anchor": "end", "font-size": 10.5, fill: css("--muted") }, s3, "w");
    el("text", { x: 4, y: 72, "font-size": 10.5, fill: css("--muted") }, s3, "b");
    const cp = ([ww, bb]) => [clamp(X(ww), 30, W3 - 6), clamp(Y(bb), 6, H3 - 22)];
    el("text", { x: X(wBest), y: Y(bBest) + 5, "text-anchor": "middle", "font-size": 14, fill: css("--ok") }, s3, "×");
    el("path", { d: path(path_ = trail.map(cp)), stroke: css("--lw"), "stroke-width": 1.6, fill: "none" }, s3);
    path_.forEach((p, i) => i % 5 === 0 && el("circle", { cx: p[0], cy: p[1], r: 1.8, fill: css("--lw") }, s3));
    const cur = cp([w, b]); el("circle", { cx: cur[0], cy: cur[1], r: 4.5, fill: css("--lw"), stroke: css("--fg") }, s3);
    /* readout and an explanation that follows what is happening */
    $("#oLearnRead").innerHTML = `<div><span>Step</span><b>${hist.length - 1}</b></div><div><span>w (°C per km)</span><b class="c-arch">${fmt(w, 2)}</b></div>`
      + `<div><span>b (°C)</span><b class="c-arch">${fmt(b, 1)}</b></div><div><span>Error E</span><b class="c-lw">${L < 0.1 ? fmt(L, 3) : fmt(L, 1)}</b></div>`;
    const grow = hist.length > 2 && hist[hist.length - 1] > hist[hist.length - 2];
    let note;
    if (last && last.blown) note = "The steps overshot so badly that the numbers blew up, so training restarted from a new random point. Use a smaller step size.";
    else if (hist.length === 1) note = `Random start: the line is far from the stations. Step 3 says which way to move: ∂E/∂b ${gb < 0 ? "< 0, so the line is too cold on average and b must go up" : "> 0, so the line is too warm on average and b must go down"}.`;
    else if (grow) note = `The error is growing: each step jumps past the bottom of the valley and lands higher on the other side. With these stations any η above about ${fmt(etaMax, 2)} overshoots; you have ${fmt(lr, 2)}. Lower it and the error falls again, even from far away.`;
    else if (L < 0.02) note = `Converged: the gradient is almost zero, so the steps are tiny. w ≈ ${fmt(wBest, 2)} °C per km, the lapse rate, and b ≈ ${fmt(bBest, 1)} °C at sea level. The network learned them from five numbers.`;
    else if (lr < 0.04) note = "Small steps: safe but slow. The valley is long and flat along one direction, so it takes many steps to reach the bottom.";
    else note = "Each step moves w and b downhill on the landscape. The path first drops quickly into the valley, then slides slowly along its floor towards ×.";
    $("#oLearnNote").textContent = note;
  }
  let path_;
  reset(); w = 2; b = 10; hist = [lossAt(w, b)]; trail = [[w, b]];
  render(); return render;
});

/* 9b · the landscape: one bowl for a line, many valleys for a network; balls follow the exact local slope */
demo("o-landscape", () => {
  const E = {
    bowl: w => 0.5 * (w - 1) ** 2 + 0.3,
    net: w => 0.12 * w * w + Math.sin(2 * w) + 0.45 * Math.sin(0.7 * w + 1) + 1.6,
  };
  let kind = "bowl", balls = [], timer = null;
  chips($("#oBasinKind"), v => { kind = v; balls = []; render(); });
  const gl = slider("oBasinLr", v => fmt(v, 2));
  const dE = w => (E[kind](w + 1e-4) - E[kind](w - 1e-4)) / 2e-4;   // the slope at one point (here numerically; backprop gives it exactly)
  const W0 = -4, W1 = 4, grid = Array.from({ length: 401 }, (_, i) => W0 + i * (W1 - W0) / 400);
  const minima = () => { const f = E[kind], m = []; grid.forEach((w, i) => { if (i && i < grid.length - 1 && f(w) <= f(grid[i - 1]) && f(w) <= f(grid[i + 1])) m.push(w); }); return m; };
  const COL = ["--lw", "--cool", "--sw", "--mag", "--ok", "--arch"];
  function drop(n) {
    for (let k = 0; k < n; k++) { const w = W0 + 0.3 + Math.random() * (W1 - W0 - 0.6); balls.push({ trail: [w], col: COL[balls.length % COL.length] }); }
    if (!timer) timer = setInterval(tick, 60);
  }
  function tick() {
    let moving = false; const lr = gl();
    balls.forEach(b => { const w = b.trail[b.trail.length - 1]; if (b.trail.length > 80) return; const nw = clamp(w - lr * dE(w), W0, W1); if (Math.abs(nw - w) > 1e-4) { b.trail.push(nw); moving = true; } });
    if (!moving) { clearInterval(timer); timer = null; }
    render();
  }
  $("#oBasinOne").addEventListener("click", () => drop(1));
  $("#oBasinTen").addEventListener("click", () => drop(10));
  $("#oBasinClear").addEventListener("click", () => { balls = []; render(); });
  function render() {
    const f = E[kind], ys = grid.map(f), y1 = Math.max(...ys) + 0.3, W = 480, H = 250, svg = svgIn($("#oBasinFig"), W, H);
    const A = axes(svg, { W, H, x0: W0, x1: W1, y0: 0, y1, xt: [-4, -2, 0, 2, 4], yt: [0, Math.round(y1 / 2), Math.round(y1)], xl: "one weight w", yl: "error E" });
    el("path", { d: path(grid.map((w, i) => [A.x(w), A.y(ys[i])])), stroke: css("--muted"), "stroke-width": 2.5, fill: "none" }, svg);
    const ms = minima(), best = ms.reduce((a, w) => f(w) < f(a) ? w : a, ms[0]);
    ms.forEach(w => el("text", { x: A.x(w), y: A.y(f(w)) + 18, "text-anchor": "middle", "font-size": 12, fill: css(w === best ? "--ok" : "--muted") }, svg, w === best ? "lowest" : "valley"));
    balls.forEach(b => {
      el("path", { d: path(b.trail.map(w => [A.x(w), A.y(f(w)) - 6])), stroke: css(b.col), "stroke-width": 1.5, fill: "none", opacity: .7 }, svg);
      el("circle", { cx: A.x(b.trail[0]), cy: A.y(f(b.trail[0])) - 6, r: 3, fill: "none", stroke: css(b.col) }, svg);
      const w = b.trail[b.trail.length - 1]; el("circle", { cx: A.x(w), cy: A.y(f(w)) - 7, r: 6, fill: css(b.col), stroke: css("--bg") }, svg);
    });
    const ends = balls.map(b => b.trail[b.trail.length - 1]), near = w => ms.reduce((a, m) => Math.abs(m - w) < Math.abs(a - w) ? m : a, ms[0]);
    const reached = new Set(ends.map(w => fmt(near(w), 1))), atBest = ends.filter(w => Math.abs(near(w) - best) < 1e-6).length;
    $("#oBasinRead").innerHTML = `<div><span>Balls</span><b>${balls.length}</b></div><div><span>Valleys reached</span><b class="c-arch">${balls.length ? reached.size : 0} of ${ms.length}</b></div><div><span>In the lowest valley</span><b class="${balls.length && atBest < balls.length ? "c-sw" : "c-ok"}">${atBest} of ${balls.length}</b></div>`;
    $("#oBasinNote").textContent = kind === "bowl"
      ? "One bowl: wherever a ball starts, the slope leads it to the same bottom. That is why the line on the previous slide always finds the lapse rate."
      : "The slope is just as exact here, but only local: each ball rolls into the nearest valley, and some valleys are worse than the lowest one. A real network has millions of weights, so its landscape has countless valleys, flat plateaus and saddles. Methods to cope with this (momentum, Adam, schedules, good starts) are the topic of Module 6.";
  }
  render(); return render;
});
