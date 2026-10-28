/* ───────── Module 0 · Overview: one small demo per slide ───────── */

/* 1 · the big idea: one neuron, inputs [2, 3], bias 1, ReLU */
demo("o-idea", () => {
  const X = [2, 3], B = 1, gw1 = slider("oW1", v => fmt(v, 1), () => render()), gw2 = slider("oW2", v => fmt(v, 1), () => render());
  function render() {
    const w = [gw1(), gw2()], z = X[0] * w[0] + X[1] * w[1] + B, a = relu(z), on = z > 0;
    $("#oIdeaCalc").innerHTML = `z = 2 × <span class="k">${fmt(w[0], 1)}</span> + 3 × <span class="k">${fmt(w[1], 1)}</span> + 1 = <b>${fmt(z, 1)}</b><br>`
      + `ReLU(z) = max(0, z) = <span class="${on ? "g" : "r"}">${fmt(a, 1)}</span> <span class="m">· neuron ${on ? "on" : "off"}</span>`;
    const W = 560, H = 230, svg = svgIn($("#oIdeaFig"), W, H), yIn = [70, 160], xs = 300, xo = 470;
    arrowDefs(svg, "oi", css("--muted"));
    X.forEach((x, i) => {
      const col = css(w[i] >= 0 ? "--pos" : "--neg");
      el("line", { x1: 72, y1: yIn[i], x2: xs - 34, y2: 115, stroke: col, "stroke-width": 1 + 3 * Math.abs(w[i]), opacity: .8 }, svg);
      el("circle", { cx: 50, cy: yIn[i], r: 22, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: 50, y: yIn[i] + 5, "text-anchor": "middle", class: "mono", "font-size": 15 }, svg, x);
      el("text", { x: 50, y: yIn[i] + 40, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "x" + (i + 1));
      el("text", { x: 168, y: i ? 160 : 76, "text-anchor": "middle", class: "mono", "font-size": 13, fill: col }, svg, "w" + (i + 1) + " = " + fmt(w[i], 1));
    });
    el("text", { x: xs, y: 196, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "+ bias 1");
    el("circle", { cx: xs, cy: 115, r: 34, fill: css("--arch-soft"), stroke: css("--arch"), "stroke-width": 2 }, svg);
    el("text", { x: xs, y: 110, "text-anchor": "middle", "font-size": 18 }, svg, "Σ");
    el("text", { x: xs, y: 130, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, fmt(z, 1));
    /* ReLU inset: the bend, with the current z marked */
    const rx = lin(-6, 6, 362, 432), ry = lin(0, 6, 150, 82);
    el("rect", { x: 356, y: 76, width: 82, height: 80, rx: 8, fill: css("--well") }, svg);
    el("path", { d: path([[rx(-6), ry(0)], [rx(0), ry(0)], [rx(6), ry(6)]]), stroke: css("--muted"), fill: "none", "stroke-width": 2 }, svg);
    el("circle", { cx: rx(clamp(z, -6, 6)), cy: ry(clamp(a, 0, 6)), r: 5, fill: css(on ? "--ok" : "--lw") }, svg);
    el("text", { x: 397, y: 70, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "ReLU");
    el("line", { x1: xs + 34, y1: 115, x2: 352, y2: 115, stroke: css("--muted"), "marker-end": "url(#oi)" }, svg);
    el("line", { x1: 442, y1: 115, x2: xo - 26, y2: 115, stroke: css("--muted"), "marker-end": "url(#oi)" }, svg);
    el("circle", { cx: xo, cy: 115, r: 24, fill: on ? css("--ok") : css("--card"), stroke: css(on ? "--ok" : "--line"), "stroke-width": 2 }, svg);
    el("text", { x: xo, y: 120, "text-anchor": "middle", class: "mono", "font-size": 14, fill: on ? css("--bg") : css("--muted") }, svg, fmt(a, 1));
    el("text", { x: xo, y: 160, "text-anchor": "middle", "font-size": 12, fill: css(on ? "--ok" : "--lw") }, svg, on ? "on" : "off");
  }
  render(); return render;
});

/* 2 · the map of five levels */
demo("o-map", () => {
  const L = [
    ["1", "Data Foundation", "data-foundation.html", "--data", "Turning the world into a clean table of numbers.", "Rain gauges vs. satellite rainfall; a student table with estrato and municipality.", "Is the table honest: no leakage, no hidden bias, gaps handled?"],
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

/* 3 · data foundation: imputation and two leakage switches on the student table */
demo("o-data", () => {
  const rows = DS.students.filter(s => s.id <= 8 || (s.id >= 13 && s.id <= 16)).map(s => ({ ...s })), test = r => r.id > 8, MISS = [3, 13];
  const train = rows.filter(r => !test(r) && !MISS.includes(r.id)).map(r => r.absences);
  const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const fill = { mean: mean(train), median: med(train), flag: med(train) };
  const risk = r => sigm(-3 + 0.18 * r.abs - 0.9 * (r.grade - 3) - 0.25 * (r.estrato - 3) + (r.rural ? 0.6 : 0)) > 0.5 ? 1 : 0;
  let imp = "mean"; const leak = { split: false, feat: false };
  chips($("#oImp"), v => { imp = v; render(); });
  $$("#oLeak button").forEach(b => b.addEventListener("click", () => { leak[b.dataset.v] = !leak[b.dataset.v]; b.setAttribute("aria-pressed", leak[b.dataset.v]); render(); }));
  function render() {
    rows.forEach(r => { r.miss = MISS.includes(r.id); r.abs = r.miss ? fill[imp] : r.absences; r.pred = leak.feat ? r.attrition : risk(r); });
    const T = rows.filter(test), acc = T.filter(r => r.pred === r.attrition).length / T.length;
    const fitOn = leak.split ? rows.map(r => r.abs) : rows.filter(r => !test(r)).map(r => r.abs);
    const cols = ["id", "absences", "grade", "estrato"].concat(imp === "flag" ? ["was missing"] : [], leak.feat ? ["form filed"] : [], ["attrition", "predicted"]);
    let h = `<table class="tb"><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
    rows.forEach(r => {
      const bg = test(r) ? ` style="background:var(--well)"` : "", hit = r.pred === r.attrition;
      h += `<tr${bg}><td class="n">${r.id}${test(r) ? ' <span class="mut" style="font-size:11px">test</span>' : ""}</td>`
        + `<td class="n"${r.miss ? ' style="color:var(--sw);font-weight:600"' : ""}>${r.miss ? fmt(r.abs, 1) : r.abs}</td><td class="n">${fmt(r.grade, 1)}</td><td class="n">${r.estrato}</td>`
        + (imp === "flag" ? `<td class="n">${+r.miss}</td>` : "") + (leak.feat ? `<td class="n" style="color:var(--lw)">${r.attrition}</td>` : "")
        + `<td class="n">${r.attrition}</td><td class="n" style="color:var(${test(r) ? (hit ? "--ok" : "--lw") : "--muted"})">${r.pred}</td></tr>`;
    });
    $("#oDataTable").innerHTML = h + "</tbody></table>";
    $("#oDataRead").innerHTML = `<div><span>Filled value</span><b class="c-sw">${fmt(fill[imp], 1)}</b></div>`
      + `<div><span>Test accuracy</span><b class="${leak.feat ? "c-lw" : "c-ok"}">${Math.round(acc * 100)}%</b></div>`
      + `<div><span>Scaler μ / σ</span><b>${fmt(mean(fitOn), 1)} / ${fmt(sd(fitOn), 1)}</b></div>`
      + `<div><span>Test rows the scaler saw</span><b class="${leak.split ? "c-lw" : "c-ok"}">${leak.split ? T.length : 0}</b></div>`;
    const notes = [];
    notes.push(imp === "mean" ? "The mean is pulled up by students with many absences." : imp === "median" ? "The median ignores the extreme absence counts." : "The flag lets the model learn whether a missing record itself signals risk.");
    notes.push("Fill values come from the 8 training rows only. Student 13 really missed 12 days; any fill value hides part of that risk.");
    if (leak.split) notes.push("Scaling before the split lets the test rows shape μ and σ: information from the future reaches training. With this tiny linear model the score happens not to move, but the evaluation is no longer clean, and in flexible models the leak can inflate scores.");
    if (leak.feat) notes.push("The withdrawal form is filed after a student leaves, so it reveals the answer: 100% on test, useless in practice.");
    $("#oDataNote").textContent = notes.join(" ");
  }
  render(); return render;
});

/* 4 · operations: a 3 × 3 filter over the temperature map */
demo("o-ops", () => {
  const K = { blur: [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map(r => r.map(v => v / 16)), sharp: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    sx: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], sy: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] };
  let k = "blur"; chips($("#oConvPick"), v => { k = v; render(); });
  const F = DS.temp, R = F.length, C = F[0].length;
  const at = (i, j, c) => (i < 0 || j < 0 || i >= R || j >= C || F[i][j] == null) ? c : F[i][j];
  function render() {
    const M = K[k], O = F.map((row, i) => row.map((v, j) => v == null ? null : M.reduce((s, kr, a) => s + kr.reduce((t, w, b) => t + w * at(i + a - 1, j + b - 1, v), 0), 0)));
    const tc = v => div(v - 20, 9), edge = k === "sx" || k === "sy";
    const mx = Math.max(...O.flat().filter(v => v != null).map(Math.abs));
    $("#oConvK").innerHTML = M.map(r => r.map(v => (k === "blur" ? fmt(v * 16, 0) + "/16" : (v > 0 ? " " : "") + v).padStart(5, " ")).join(" ")).join("<br>").replace(/ /g, "&nbsp;")
      + `<br><span class="m">${{ blur: "averages neighbours: smooths the map", sharp: "centre minus neighbours: boosts contrast", sx: "right minus left: west–east slopes", sy: "below minus above: north–south slopes" }[k]}</span>`;
    fieldSVG($("#oConvIn"), F, { cell: 13, color: tc });
    fieldSVG($("#oConvOut"), O, { cell: 13, color: v => edge ? div(v, mx) : tc(v) });
  }
  render(); return render;
});

/* 5 · layers: stack a small CNN and watch shapes and parameter counts */
demo("o-layers", () => {
  let stack = ["conv", "pool"];
  const btns = $$("#oStackBtns button");
  function shapes() {
    let s = [28, 28, 1]; const out = [{ name: "Input image", shape: s, p: 0 }];
    for (const t of stack) {
      if (t === "conv") { const p = (9 * s[2] + 1) * 8; s = [s[0], s[1], 8]; out.push({ name: "Conv 8 × (3×3), same padding", shape: s, p, f: `(3·3·${out[out.length - 1].shape[2]} + 1) × 8` }); }
      if (t === "pool") { s = [Math.floor(s[0] / 2), Math.floor(s[1] / 2), s[2]]; out.push({ name: "Max pool 2×2", shape: s, p: 0, f: "no weights" }); }
      if (t === "flat") { s = [s[0] * s[1] * s[2]]; out.push({ name: "Flatten", shape: s, p: 0, f: "reshape only" }); }
      if (t === "dense") { const p = (s[0] + 1) * 10; s = [10]; out.push({ name: "Dense 10", shape: s, p, f: `(${fmtN(out[out.length - 1].shape[0])} + 1) × 10` }); }
    }
    return out;
  }
  btns.forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.v;
    if (v === "undo") stack.pop(); else if (v === "reset") stack = []; else stack.push(v);
    render();
  }));
  function render() {
    const L = shapes(), last = L[L.length - 1].shape, flat = last.length === 1, full = stack.length >= 7;
    btns.forEach(b => {
      const v = b.dataset.v;
      b.disabled = v === "undo" || v === "reset" ? !stack.length : full || ((v === "conv" || v === "pool" || v === "flat") ? flat || (v === "pool" && last[0] < 2) : !flat);
    });
    $("#oStackNote").textContent = flat ? "The data is now a flat vector: only dense layers can follow. Remove layers to add convolutions again."
      : "Convolution and pooling keep the grid. Flatten before a dense layer, which needs a vector.";
    const W = 520, rh = 34, H = L.length * (rh + 10) + 4, svg = svgIn($("#oStackFig"), W, H);
    L.forEach((l, i) => {
      const y = 2 + i * (rh + 10), col = i === 0 ? "--data" : l.p ? "--arch" : "--muted";
      el("rect", { x: 2, y, width: W - 4, height: rh, rx: 8, fill: `color-mix(in srgb, var(${col}) 12%, var(--card))`, stroke: css(col) }, svg);
      el("text", { x: 14, y: y + 21, "font-size": 13 }, svg, l.name);
      el("text", { x: 300, y: y + 21, class: "mono", "font-size": 12.5 }, svg, l.shape.join(" × "));
      el("text", { x: W - 14, y: y + 21, "text-anchor": "end", class: "mono", "font-size": 12.5, fill: css(l.p ? "--arch" : "--muted") }, svg, l.p ? fmtN(l.p) + " params" : (l.f || ""));
    });
    const tot = L.reduce((s, l) => s + l.p, 0);
    $("#oStackRead").innerHTML = `<div><span>Output shape</span><b>${last.join(" × ")}</b></div><div><span>Trainable parameters</span><b class="c-arch">${fmtN(tot)}</b></div>`
      + (L.length > 1 && L[L.length - 1].f ? `<div><span>Last layer</span><b style="font-size:16px">${L[L.length - 1].f}</b></div>` : "");
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
    el("circle", { cx: 360, cy: yM, r: 18, fill: css("--card"), stroke: css(on ? "--ok" : "--line") }, svg);
    el("text", { x: 360, y: yM + 6, "text-anchor": "middle", "font-size": 18 }, svg, "+");
    node(480, "output", fmt(y, 1), on ? "--ok" : "--lw");
    el("line", { x1: 106, y1: yM, x2: 182, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
    el("line", { x1: 276, y1: yM, x2: 340, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
    el("line", { x1: 378, y1: yM, x2: 432, y2: yM, stroke: css("--muted"), "marker-end": "url(#ob)" }, svg);
    el("path", { d: `M60 ${yM - 24} C60 20, 360 20, 360 ${yM - 20}`, fill: "none", stroke: css(on ? "--ok" : "--line"), "stroke-width": on ? 3 : 1.5, "stroke-dasharray": on ? "" : "5 5", "marker-end": on ? "url(#obs)" : "" }, svg);
    el("text", { x: 210, y: 36, "text-anchor": "middle", "font-size": 12, fill: css(on ? "--ok" : "--muted") }, svg, on ? "skip connection: x passes straight through" : "skip connection cut");
    $("#oBlockRead").innerHTML = `<div><span>Output</span><b class="${on ? "c-ok" : "c-lw"}">${fmt(y, 1)}</b></div><div><span>Formula</span><b style="font-size:18px">${on ? "x + F(x) = 5 + " + fmt(f, 1) : "F(x) = " + fmt(f, 1)}</b></div>`
      + `<p class="note" style="flex-basis:100%;margin:0">${on ? "The layer only has to learn the small correction; the input is kept. Stacking many such blocks stays easy to train." : "Without the skip, the layer must rebuild the whole value 5 from scratch, and the input is lost."}</p>`;
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
    const W = 480, H = 250, svg = svgIn($("#oBiasFig"), W, H), x = i => 60 + i * 90, yIn = 200, yOut = 40, yH = 122;
    arrowDefs(svg, "obi", css("--arch"));
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
      if (op === "graph") gE.forEach(([a, b]) => el("path", { d: `M${x(a)} ${yIn + 18} Q${(x(a) + x(b)) / 2} ${yIn + 50} ${x(b)} ${yIn + 18}`, fill: "none", stroke: css("--line"), "stroke-dasharray": "3 3" }, svg));
    }
    $("#oBiasNote").textContent = note;
  }
  render(); return render;
});

/* 9 · how it learns: gradient descent on y = w·x + b, temperature vs elevation */
demo("o-learn", () => {
  const P = [[0.1, 27.6], [0.5, 25.1], [1.5, 18.9], [2.2, 14.2], [2.6, 11.6]];
  let w, b, hist, timer = null;
  const gl = slider("oLr", v => fmt(v, 2));
  const loss = () => mean(P.map(([x, y]) => (w * x + b - y) ** 2));
  function reset() { w = 2; b = 10; hist = [loss()]; }
  function step() {
    const lr = gl(), gw = mean(P.map(([x, y]) => 2 * (w * x + b - y) * x)), gb = mean(P.map(([x, y]) => 2 * (w * x + b - y)));
    w -= lr * gw; b -= lr * gb; hist.push(loss());
    if (!isFinite(w) || Math.abs(w) > 1e6) { stop(); reset(); }
  }
  function stop() { clearInterval(timer); timer = null; $("#oTrainPlay").textContent = "Autoplay"; }
  $("#oTrain1").addEventListener("click", () => { step(); render(); });
  $("#oTrainReset").addEventListener("click", () => { stop(); reset(); render(); });
  $("#oTrainPlay").addEventListener("click", () => {
    if (timer) return stop();
    $("#oTrainPlay").textContent = "Pause";
    timer = setInterval(() => { step(); render(); if (hist.length > 300) stop(); }, 90);
  });
  function render() {
    const W = 460, H = 200, svg = svgIn($("#oLearnFig"), W, H);
    const A = axes(svg, { W, H, x0: 0, x1: 3, y0: 0, y1: 32, xt: [0, 1, 2], yt: [0, 10, 20, 30], xl: "elevation (km)", yl: "temperature (°C)" });
    P.forEach(([x, y]) => {
      const yy = w * x + b;
      el("line", { x1: A.x(x), x2: A.x(x), y1: A.y(y), y2: A.y(clamp(yy, -5, 40)), stroke: css("--lw"), "stroke-dasharray": "3 3" }, svg);
      el("circle", { cx: A.x(x), cy: A.y(y), r: 5, fill: css("--data") }, svg);
    });
    const yl = v => A.y(clamp(v, -2, 34));
    el("path", { d: path([[A.x(0), yl(b)], [A.x(3), yl(w * 3 + b)]]), stroke: css("--arch"), "stroke-width": 2.5, fill: "none" }, svg);
    const H2 = 130, s2 = svgIn($("#oLossFig"), W, H2), L = hist.map(v => Math.log10(Math.max(v, 1e-3)));
    const n = Math.max(20, hist.length - 1), top = Math.max(3, Math.ceil(Math.max(...L))), bot = Math.min(-1, Math.floor(Math.min(...L)));
    const B = axes(s2, { W, H: H2, x0: 0, x1: n, y0: bot, y1: top, xt: [0], yt: [bot, Math.round((bot + top) / 2), top], yf: v => "1e" + v, xl: "step", yl: "error (mean squared, log scale)" });
    el("path", { d: path(L.map((v, i) => [B.x(i), B.y(v)])), stroke: css("--lw"), "stroke-width": 2, fill: "none" }, s2);
    el("circle", { cx: B.x(L.length - 1), cy: B.y(L[L.length - 1]), r: 4, fill: css("--lw") }, s2);
    const e = loss(), diverge = hist.length > 3 && e > hist[hist.length - 2] * 1.01;
    $("#oLearnRead").innerHTML = `<div><span>Step</span><b>${hist.length - 1}</b></div><div><span>w (°C per km)</span><b class="c-arch">${fmt(w, 2)}</b></div>`
      + `<div><span>b (°C)</span><b class="c-arch">${fmt(b, 1)}</b></div><div><span>Error</span><b class="c-lw">${e < 0.1 ? fmt(e, 3) : fmt(e, 1)}</b></div>`
      + `<p class="note" style="flex-basis:100%;margin:0">${diverge ? "The error is growing: the step is too large, so each nudge overshoots. Lower the step size and reset." : hist.length < 3 ? "The line starts from a random guess. Press Train." : "w settles near −6.4 °C per km: the network rediscovers the lapse rate."}</p>`;
  }
  reset(); render(); return render;
});
