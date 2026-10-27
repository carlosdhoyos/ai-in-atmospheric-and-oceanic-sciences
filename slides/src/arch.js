/* ═════════ PART 2 · ARCHITECTURE demos ═════════ */
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

/* hierarchy */
demo("a-hier", () => {
  const L = [
    ["Operations", ["Dense", "Convolution", "Recurrence", "Attention", "Pooling", "Message passing"]],
    ["Layers", ["Dense layer", "Conv layer", "Pooling layer", "LSTM layer", "Attention layer", "Graph layer", "Embedding layer", "Norm layer"]],
    ["Blocks", ["Residual block", "Transformer block", "Encoder", "Decoder"]],
    ["Families", ["MLP", "CNN", "RNN / LSTM", "Transformer", "Graph network", "U-Net", "Autoencoder"]],
  ];
  const E = [["Dense", "Dense layer"], ["Dense", "Attention layer"], ["Convolution", "Conv layer"], ["Recurrence", "LSTM layer"], ["Attention", "Attention layer"], ["Pooling", "Pooling layer"], ["Message passing", "Graph layer"],
    ["Conv layer", "Residual block"], ["Norm layer", "Residual block"], ["Attention layer", "Transformer block"], ["Dense layer", "Transformer block"], ["Norm layer", "Transformer block"],
    ["Conv layer", "Encoder"], ["Pooling layer", "Encoder"], ["Conv layer", "Decoder"], ["Dense layer", "Encoder"], ["Dense layer", "Decoder"],
    ["Dense layer", "MLP"], ["Residual block", "CNN"], ["Conv layer", "CNN"], ["Pooling layer", "CNN"], ["LSTM layer", "RNN / LSTM"], ["Dense layer", "RNN / LSTM"],
    ["Embedding layer", "Transformer"], ["Transformer block", "Transformer"], ["Graph layer", "Graph network"], ["Dense layer", "Graph network"], ["Encoder", "U-Net"], ["Decoder", "U-Net"], ["Encoder", "Autoencoder"], ["Decoder", "Autoencoder"]];
  const D = {
    "Dense": "Every input connects to every output with its own weight: activation(W·x + b).", "Convolution": "A small filter of shared weights slides over the input.",
    "Recurrence": "Processes a sequence step by step, carrying a hidden state.", "Attention": "Scores every pair, softmaxes the scores, takes a weighted average.",
    "Pooling": "Summarizes a neighbourhood with its max or mean.", "Message passing": "Each node aggregates messages from its graph neighbours.",
    "Dense layer": "Matrix multiply + bias + activation.", "Conv layer": "Several filters, each producing a feature map.", "Pooling layer": "No weights; shrinks and summarizes.",
    "LSTM layer": "Recurrence with gates; the same weights at every time step.", "Attention layer": "Several attention heads in parallel; Q, K, V projections are dense operations.",
    "Graph layer": "Message passing with learned weights on the messages.", "Embedding layer": "A lookup table of learnable vectors.", "Norm layer": "Rescales values with a learned scale and shift.",
    "Residual block": "A few conv (or dense) layers with normalization, plus a skip: output = x + block(x).", "Transformer block": "Attention, then a small dense network, each wrapped in normalization and a residual connection.",
    "Encoder": "Layers that compress the input into a smaller representation.", "Decoder": "Layers that expand a representation back to an output (a map, a sequence).",
    "MLP": "Dense layers stacked: the original neural network.", "CNN": "Conv and pooling layers (often residual blocks), then dense layers.", "RNN / LSTM": "Recurrent layers over a sequence, then a dense output.",
    "Transformer": "Embeddings, then a stack of transformer blocks. Language models and many new weather models.", "Graph network": "Stacked graph layers over stations, meshes or molecules.",
    "U-Net": "An encoder and a decoder with skip connections between matching levels.", "Autoencoder": "An encoder squeezes the input through a bottleneck; a decoder rebuilds it.",
  };
  let sel = "Transformer block";
  const neigh = (n, up) => E.filter(e => (up ? e[0] : e[1]) === n).map(e => up ? e[1] : e[0]);
  const reach = (n, up, acc = new Set()) => { neigh(n, up).forEach(m => { if (!acc.has(m)) { acc.add(m); reach(m, up, acc); } }); return acc; };
  function render() {
    const W = 1000, colW = 250, rh = 32, H = 50 + 8 * (rh + 4), svg = svgIn($("#hierFig"), W, H), pos = {};
    L.forEach(([t, items], c) => { el("text", { x: c * colW + 10, y: 18, class: "mono", "font-size": 12, fill: css("--arch") }, svg, (c + 1) + " · " + t.toUpperCase());
      items.forEach((it, r) => pos[it] = [c * colW + 10, 32 + r * (rh + 4)]); });
    const on = new Set([sel, ...reach(sel, true), ...reach(sel, false)]);
    E.forEach(([a, b]) => { const A = pos[a], B = pos[b], act = on.has(a) && on.has(b);
      el("path", { d: `M${A[0] + 200} ${A[1] + rh / 2} C${A[0] + 225} ${A[1] + rh / 2} ${B[0] - 25} ${B[1] + rh / 2} ${B[0]} ${B[1] + rh / 2}`, fill: "none", stroke: css(act ? "--arch" : "--line"), "stroke-width": act ? 1.8 : 1, opacity: act ? 1 : .6 }, svg); });
    for (const it in pos) { const [x, y] = pos[it], isS = it === sel, act = on.has(it);
      const g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
      el("rect", { x, y, width: 200, height: rh, rx: 10, fill: isS ? css("--arch") : act ? css("--arch-soft") : css("--card"), stroke: css(act ? "--arch" : "--line") }, g);
      el("text", { x: x + 12, y: y + 21, "font-size": 13.5, "font-weight": isS ? 600 : 400, fill: isS ? css("--bg") : css("--fg") }, g, it);
      const pick = () => { sel = it; render(); };
      g.addEventListener("click", pick); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); pick(); } }); }
    const lvl = L.findIndex(l => l[1].includes(sel)), parts = [...reach(sel, false)], users = [...reach(sel, true)];
    $("#hierCard").innerHTML = `<p class="kicker k-arch">${L[lvl][0].replace(/s$/, "")}</p><h4 style="font-size:19px"></h4><p class="d"></p>` +
      (parts.length ? `<p class="note"><b>Built from:</b> ${parts.join(", ")}.</p>` : "") + (users.length ? `<p class="note" style="margin:0"><b>Used in:</b> ${users.join(", ")}.</p>` : "");
    $("#hierCard h4").textContent = sel; $("#hierCard .d").textContent = D[sel];
  }
  render(); return render;
});

/* inductive bias */
demo("a-bias", () => {
  const vals = [3, 0, 12, 1, 10, 0, 2], days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], gE = [[0, 3], [1, 2], [2, 5], [3, 4], [4, 6], [0, 6], [1, 5]];
  let op = "dense", tgt = 4; const bs = $$("#ibPicks .pick");
  bs.forEach(b => b.addEventListener("click", () => { op = b.dataset.v; press(bs, b); render(); }));
  function render() {
    const W = 520, H = 250, svg = svgIn($("#ibFig"), W, H), x = i => 50 + i * 70, yIn = 205, yOut = 40, yH = 125;
    arrowDefs(svg, "ib", css("--arch"));
    let links = [], note = "", nw = "";
    if (op === "dense") { links = vals.map((_, i) => [i, 1]); note = "Every day feeds every output with its own weight."; nw = "7 per output · 49 in the layer"; }
    if (op === "conv") { links = [-1, 0, 1].map(d => [tgt + d, 1, d]).filter(l => l[0] >= 0 && l[0] < 7); note = "Only the 3 neighbouring days, and the same 3 weights for every output day."; nw = "3, shared by all outputs"; }
    if (op === "attn") { const s = softmax(vals.map(v => -Math.abs(v - vals[tgt]) / 2)); links = vals.map((_, i) => [i, s[i]]); note = "All days can connect; days with similar rainfall get more weight. The weights are computed, not stored."; nw = "computed from content"; }
    if (op === "graph") { const nb = gE.filter(e => e.includes(tgt)).map(e => e[0] === tgt ? e[1] : e[0]); links = [[tgt, 1], ...nb.map(n => [n, 1])]; note = "Only nodes linked in the given graph (think of the 7 as stations, not days)."; nw = `${nb.length} neighbours, shared message weights`; }
    if (op === "rnn") { note = "The output reads only the memory, which carried every earlier day forward one step at a time."; nw = "2 (a, b), reused every step"; }
    vals.forEach((v, i) => {
      el("circle", { cx: x(i), cy: yIn, r: 17, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: x(i), y: yIn + 4, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, v);
      el("text", { x: x(i), y: yIn + 34, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, op === "graph" ? "S" + (i + 1) : days[i]);
      const g = el("g", { style: "cursor:pointer" }, svg);
      el("circle", { cx: x(i), cy: yOut, r: 15, fill: i === tgt ? css("--arch") : css("--card"), stroke: css(i === tgt ? "--arch" : "--line") }, g);
      el("text", { x: x(i), y: yOut + 4, "text-anchor": "middle", "font-size": 11, fill: i === tgt ? css("--bg") : css("--muted") }, g, "out");
      g.addEventListener("click", () => { tgt = i; render(); });
    });
    if (op === "rnn") {
      for (let i = 0; i <= tgt; i++) { el("rect", { x: x(i) - 15, y: yH - 13, width: 30, height: 26, rx: 8, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
        el("text", { x: x(i), y: yH + 4, "text-anchor": "middle", "font-size": 11, class: "mono" }, svg, "h" + (i + 1));
        el("line", { x1: x(i), y1: yIn - 17, x2: x(i), y2: yH + 15, stroke: css("--arch"), "marker-end": "url(#ib)" }, svg);
        if (i < tgt) el("line", { x1: x(i) + 15, y1: yH, x2: x(i + 1) - 17, y2: yH, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#ib)" }, svg); }
      el("line", { x1: x(tgt), y1: yH - 13, x2: x(tgt), y2: yOut + 17, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#ib)" }, svg);
    } else {
      const wcol = ["--sw", "--arch", "--cool"];
      links.forEach(([i, w, d]) => el("line", { x1: x(i), y1: yIn - 17, x2: x(tgt), y2: yOut + 15, stroke: css(op === "conv" ? wcol[d + 1] : "--arch"), "stroke-width": op === "attn" ? 0.6 + 9 * w : 2, opacity: op === "attn" ? .35 + .65 * w : .85, "marker-end": "url(#ib)" }, svg));
      if (op === "graph") gE.forEach(([a, b]) => el("path", { d: `M${x(a)} ${yIn + 17} Q${(x(a) + x(b)) / 2} ${yIn + 60} ${x(b)} ${yIn + 17}`, fill: "none", stroke: css("--line"), "stroke-dasharray": "3 3" }, svg));
    }
    $("#ibRead").innerHTML = `<div><span>Weights involved</span><b class="c-arch" style="font-size:18px">${nw}</b></div><p class="note" style="flex-basis:100%;margin:0">${note}</p>`;
  }
  render(); return render;
});

/* geometric view */
demo("a-geo", () => {
  const G = [["Grid", "Images, gridded climate fields, radar mosaics.", "Translation: a storm is a storm wherever it is on the map.", "Convolution (CNN, U-Net)"],
    ["Sequence", "Daily streamflow, text, hourly load.", "Order matters, and patterns repeat in time.", "Recurrence or attention (LSTM, transformer)"],
    ["Graph", "Station networks, river networks, roads, molecules.", "Relabelling the nodes must not change the answer; only the links matter.", "Message passing (graph networks)"],
    ["Set", "The students in a class, the sensors on a drone, a bag of words.", "Order does not matter at all.", "Operations that ignore order: sum or mean pooling, attention without positions"]];
  let sel = 0; const host = $("#geoCards");
  function pic(svg, k) {
    const c = css("--arch"), m = css("--muted");
    if (k === 0) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) el("rect", { x: 30 + j * 24, y: 8 + i * 18, width: 22, height: 16, rx: 3, fill: (i + j) % 3 ? css("--well") : c, opacity: .8 }, svg);
    if (k === 1) for (let i = 0; i < 6; i++) { el("circle", { cx: 22 + i * 24, cy: 44, r: 8, fill: c, opacity: .3 + i * .12 }, svg); if (i) el("line", { x1: 30 + (i - 1) * 24, x2: 14 + i * 24, y1: 44, y2: 44, stroke: m }, svg); }
    if (k === 2) { const P = [[40, 20], [90, 15], [130, 40], [70, 55], [30, 65], [115, 70]], Ed = [[0, 1], [1, 2], [0, 3], [3, 4], [3, 5], [2, 5], [1, 3]];
      Ed.forEach(([a, b]) => el("line", { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: m }, svg)); P.forEach(p => el("circle", { cx: p[0], cy: p[1], r: 7, fill: c }, svg)); }
    if (k === 3) [[35, 25], [80, 50], [120, 20], [60, 68], [130, 62], [95, 30]].forEach(p => el("circle", { cx: p[0], cy: p[1], r: 8, fill: c, opacity: .75 }, svg));
  }
  G.forEach((g, i) => { const b = document.createElement("button"); b.className = "pick"; b.type = "button"; b.setAttribute("aria-pressed", i === 0);
    b.innerHTML = `<div class="gp"></div><b></b><span></span>`; b.querySelector("b").textContent = g[0]; b.querySelector("span").textContent = g[1];
    b.addEventListener("click", () => { sel = i; press($$(".pick", host), b); text(); }); host.appendChild(b); });
  function render() { $$(".pick", host).forEach((b, i) => pic(svgIn(b.querySelector(".gp"), 160, 80), i)); text(); }
  function text() { $("#geoText").innerHTML = `<div class="two even" style="gap:18px"><div><h3>Symmetry to respect</h3><p style="margin:0"></p></div><div><h3>Operation that fits</h3><p style="margin:0;font-weight:600;color:var(--arch)"></p></div></div>`;
    const ps = $$("#geoText p"); ps[0].textContent = G[sel][2]; ps[1].textContent = G[sel][3]; }
  render(); return render;
});

/* single neuron */
demo("a-neuron", () => {
  const F = { relu: relu, sigmoid: sigm, tanh: Math.tanh, linear: x => x }, NAME = { relu: "ReLU", sigmoid: "sigmoid", tanh: "tanh", linear: "identity" };
  const ga = chips($("#nrAct"), () => render());
  const g = {}; ["x1", "x2", "w1", "w2", "b"].forEach(k => g[k] = slider("nr" + k, v => fmt(v, k[0] === "w" ? 1 : 1), () => render()));
  const setW2 = v => { const s = $("#nrw2"); s.value = v; s.dispatchEvent(new Event("input")); };
  $("#nrA").onclick = () => setW2(-1); $("#nrB").onclick = () => setW2(1);
  function render() {
    const x1 = g.x1(), x2 = g.x2(), w1 = g.w1(), w2 = g.w2(), b = g.b(), a = ga(), z = w1 * x1 + w2 * x2 + b, y = F[a](z);
    const W = 520, H = 200, svg = svgIn($("#nrFig"), W, H); arrowDefs(svg, "nr", css("--muted"));
    const edge = (x0, y0, w, lbl) => { el("line", { x1: x0 + 24, y1: y0, x2: 236, y2: 100, stroke: css(w >= 0 ? "--pos" : "--neg"), "stroke-width": 1 + 3 * Math.abs(w), opacity: .85 }, svg);
      el("text", { x: 96, y: y0 < 100 ? y0 - 14 : y0 + 26, "font-size": 12, class: "mono", fill: css(w >= 0 ? "--pos" : "--neg") }, svg, lbl); };
    edge(50, 50, w1, "w₁ = " + fmt(w1, 1)); edge(50, 150, w2, "w₂ = " + fmt(w2, 1));
    [[50, 50, x1, "x₁"], [50, 150, x2, "x₂"]].forEach(([cx, cy, v, l]) => { el("circle", { cx, cy, r: 24, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: cx, y: cy + 5, "text-anchor": "middle", class: "mono", "font-size": 14 }, svg, fmt(v, 1)); el("text", { x: cx - 32, y: cy + 5, "text-anchor": "end", class: "mut" }, svg, l); });
    el("circle", { cx: 260, cy: 100, r: 28, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
    el("text", { x: 260, y: 96, "text-anchor": "middle", "font-size": 18 }, svg, "Σ"); el("text", { x: 260, y: 116, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, fmt(z, 2));
    el("text", { x: 260, y: 152, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "+ b = " + fmt(b, 1));
    el("line", { x1: 290, y1: 100, x2: 350, y2: 100, stroke: css("--muted"), "marker-end": "url(#nr)" }, svg);
    el("rect", { x: 352, y: 78, width: 64, height: 44, rx: 10, fill: css("--card"), stroke: css("--line") }, svg);
    const fx = Array.from({ length: 21 }, (_, i) => -3 + i * 0.3), sy = v => clamp(F[a](v), -3, 3);
    el("path", { d: path(fx.map(v => [384 + v * 9, 100 - sy(v) * 6])), fill: "none", stroke: css("--arch"), "stroke-width": 1.8 }, svg);
    el("text", { x: 384, y: 136, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, NAME[a]);
    el("line", { x1: 418, y1: 100, x2: 452, y2: 100, stroke: css("--muted"), "marker-end": "url(#nr)" }, svg);
    const fire = Math.abs(y) > 1e-9;
    el("circle", { cx: 482, cy: 100, r: 26, fill: fire ? css("--arch") : css("--card"), stroke: css("--arch") }, svg);
    el("text", { x: 482, y: 105, "text-anchor": "middle", class: "mono", "font-size": 13, fill: fire ? css("--bg") : css("--muted") }, svg, fmt(y, 2));
    el("text", { x: 482, y: 146, "text-anchor": "middle", "font-size": 11.5, fill: css(fire ? "--arch" : "--muted") }, svg, fire ? "fires" : "silent");
    $("#nrCalc").innerHTML = `z = ${fmt(x1, 1)}×${fmt(w1, 1)} + ${fmt(x2, 1)}×${fmt(w2, 1)} + ${fmt(b, 1)} = <span class="k">${fmt(z, 2)}</span>\ny = ${NAME[a]}(${fmt(z, 2)}) = <span class="${fire ? "g" : "m"}">${fmt(y, 3)}</span>`;
  }
  render(); return render;
});

/* dense layer */
demo("a-dense", () => {
  const Wm = [[0.6, 0.4, -0.3], [-0.5, 0.9, 0.7]], bv = [0.1, -0.2], names = ["temp.", "humid.", "wind"], outs = ["rain chance", "fog chance"];
  const ins = ["dnT", "dnH", "dnW"].map(id => slider(id, v => fmt(v, 1), () => render()));
  let hov = 0;
  function render() {
    const x = ins.map(f => f()), z = Wm.map((r, i) => r.reduce((s, w, j) => s + w * x[j], 0) + bv[i]), y = z.map(relu);
    const W = 520, H = 200, svg = svgIn($("#dnFig"), W, H), yi = j => 40 + j * 60, yo = i => 70 + i * 60;
    Wm.forEach((r, i) => r.forEach((w, j) => el("line", { x1: 120, y1: yi(j), x2: 380, y2: yo(i), stroke: css(w >= 0 ? "--pos" : "--neg"), "stroke-width": 0.8 + 3 * Math.abs(w), opacity: i === hov ? .95 : .25 }, svg)));
    x.forEach((v, j) => { el("circle", { cx: 100, cy: yi(j), r: 20, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: 100, y: yi(j) + 4, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, fmt(v, 1)); el("text", { x: 72, y: yi(j) + 4, "text-anchor": "end", class: "mut", "font-size": 12 }, svg, names[j]); });
    y.forEach((v, i) => { const g = el("g", { style: "cursor:pointer" }, svg);
      el("circle", { cx: 400, cy: yo(i), r: 22, fill: i === hov ? css("--arch") : css("--arch-soft"), stroke: css("--arch") }, g);
      el("text", { x: 400, y: yo(i) + 4, "text-anchor": "middle", class: "mono", "font-size": 12, fill: i === hov ? css("--bg") : css("--fg") }, g, fmt(v, 2));
      el("text", { x: 430, y: yo(i) + 4, "font-size": 12, class: "mut" }, g, outs[i]);
      g.addEventListener("mouseenter", () => { hov = i; render(); }); g.addEventListener("click", () => { hov = i; render(); }); });
    $("#dnMat").innerHTML = `<table class="tb"><thead><tr><th>W</th>${names.map(n => `<th>${n}</th>`).join("")}<th>b</th></tr></thead><tbody>${Wm.map((r, i) => `<tr style="${i === hov ? "background:var(--arch-soft)" : ""}"><td>${outs[i]}</td>${r.map((w, j) => `<td><input type="number" step="0.1" min="-3" max="3" value="${w}" data-i="${i}" data-j="${j}" aria-label="weight ${outs[i]} ${names[j]}"></td>`).join("")}<td><input type="number" step="0.1" min="-3" max="3" value="${bv[i]}" data-i="${i}" data-j="b" aria-label="bias ${outs[i]}"></td></tr>`).join("")}</tbody></table>`;
    $$("#dnMat input").forEach(inp => inp.addEventListener("change", () => { const v = parseFloat(inp.value) || 0, i = +inp.dataset.i; if (inp.dataset.j === "b") bv[i] = v; else Wm[i][+inp.dataset.j] = v; render(); }));
    const r = Wm[hov];
    $("#dnCalc").innerHTML = `${outs[hov]}: z = ${r.map((w, j) => `${fmt(w, 1)}×${fmt(x[j], 1)}`).join(" + ")} + ${fmt(bv[hov], 1)} = <span class="k">${fmt(z[hov], 2)}</span>\nReLU(${fmt(z[hov], 2)}) = <span class="g">${fmt(y[hov], 2)}</span>\n<span class="m">parameters: 3 × 2 weights + 2 biases = 8</span>`;
  }
  render(); return render;
});

/* activation functions */
demo("a-act", () => {
  const F = { relu: [relu, "ReLU", "max(0, x)"], sigmoid: [sigm, "Sigmoid", "1 / (1 + e⁻ˣ)"], tanh: [Math.tanh, "Tanh", "(eˣ − e⁻ˣ) / (eˣ + e⁻ˣ)"], gelu: [gelu, "GELU", "x · Φ(x)"] };
  const ga = chips($("#actPick"), () => render()), gx = slider("actX", v => fmt(v, 1), () => render());
  $("#actTable").innerHTML = `<thead><tr><th>Function</th><th>Formula</th><th>x = −2</th><th>x = 0</th><th>x = 3</th><th>Range</th></tr></thead><tbody>${Object.values(F).map(([f, n, fo], i) =>
    `<tr><td>${n}</td><td class="mono" style="font-size:12px">${fo}</td><td class="n">${fmt(f(-2), 2)}</td><td class="n">${fmt(f(0), 2)}</td><td class="n">${fmt(f(3), 2)}</td><td class="mono" style="font-size:12px">${["[0, ∞)", "(0, 1)", "(−1, 1)", "≈ [−0.17, ∞)"][i]}</td></tr>`).join("")}</tbody>`;
  function render() {
    const [f, n] = F[ga()], xv = gx(), W = 520, H = 230, svg = svgIn($("#actFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: -4, x1: 4, y0: -1.5, y1: 4, xt: [-4, -2, 0, 2, 4], yt: [-1, 0, 1, 2, 3, 4] });
    el("line", { x1: x(0), x2: x(0), y1: 12, y2: H - 26, class: "ax" }, svg);
    Object.entries(F).forEach(([k, [g]]) => k !== ga() && el("path", { d: path(Array.from({ length: 161 }, (_, i) => { const v = -4 + i * 0.05; return [x(v), y(clamp(g(v), -1.5, 4))]; })), fill: "none", stroke: css("--line"), "stroke-width": 1.2 }, svg));
    el("path", { d: path(Array.from({ length: 161 }, (_, i) => { const v = -4 + i * 0.05; return [x(v), y(clamp(f(v), -1.5, 4))]; })), fill: "none", stroke: css("--arch"), "stroke-width": 2.6 }, svg);
    el("line", { x1: x(xv), x2: x(xv), y1: y(0), y2: y(clamp(f(xv), -1.5, 4)), stroke: css("--accent"), "stroke-dasharray": "3 3" }, svg);
    el("circle", { cx: x(xv), cy: y(clamp(f(xv), -1.5, 4)), r: 6, fill: css("--accent") }, svg);
    $("#actRead").innerHTML = `<div><span>${n}(${fmt(xv, 1)})</span><b class="c-arch">${fmt(f(xv), 3)}</b></div>`;
  }
  render(); return render;
});

/* why activations matter */
demo("a-whyact", () => {
  const X = Array.from({ length: 101 }, (_, i) => i), T = X.map(v => 60 / (1 + Math.exp(-(v - 55) / 7)));
  const gm = chips($("#waMode"), () => render()), gn = slider("waN", v => v, () => render());
  function render() {
    const n = gn(), lin_ = gm() === "linear", knots = Array.from({ length: n }, (_, i) => 100 * (i + 0.5) / n);
    const feat = v => lin_ ? [1, v] : [1, v, ...knots.map(k => relu(v - k))];
    const Phi_ = X.map(feat), p = Phi_[0].length, A = Array.from({ length: p }, () => new Array(p).fill(0)), bb = new Array(p).fill(0);
    Phi_.forEach((f, r) => { for (let i = 0; i < p; i++) { bb[i] += f[i] * T[r]; for (let j = 0; j < p; j++) A[i][j] += f[i] * f[j]; } });
    for (let i = 0; i < p; i++) A[i][i] += 1e-6;
    const w = solve(A, bb), P = Phi_.map(f => f.reduce((s, v, i) => s + v * w[i], 0));
    const rmse = Math.sqrt(mean(P.map((v, i) => (v - T[i]) ** 2)));
    const W = 520, H = 240, svg = svgIn($("#waFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: 0, x1: 100, y0: -10, y1: 70, xt: [0, 25, 50, 75, 100], yt: [0, 20, 40, 60], xl: "rainfall (mm)", yl: "runoff (mm)" });
    el("path", { d: path(X.map((v, i) => [x(v), y(T[i])])), fill: "none", stroke: css("--muted"), "stroke-width": 6, opacity: .35 }, svg);
    el("path", { d: path(X.map((v, i) => [x(v), y(clamp(P[i], -10, 70))])), fill: "none", stroke: css("--arch"), "stroke-width": 2.4 }, svg);
    if (!lin_) knots.forEach(k => el("line", { x1: x(k), x2: x(k), y1: H - 26, y2: H - 32, stroke: css("--arch") }, svg));
    $("#waRead").innerHTML = `<div><span>Fit error (RMSE)</span><b class="${rmse < 3 ? "c-ok" : "c-lw"}">${fmt(rmse, 1)} mm</b></div><div><span>Shape</span><b class="c-arch" style="font-size:18px">${lin_ ? "one straight line, whatever the size" : n + " bend" + (n > 1 ? "s" : "")}</b></div>`;
  }
  const lg = document.createElement("div"); lg.className = "legend";
  lg.innerHTML = `<span><i style="background:var(--muted);opacity:.5"></i>Target</span><span><i style="background:var(--arch)"></i>Network output</span>`;
  $("#waFig").after(lg);
  render(); return render;
});

/* softmax */
demo("a-softmax", () => {
  const ids = ["smA", "smB", "smC"], g = ids.map(id => slider(id, v => fmt(v, 1), () => render())), gt = slider("smT", v => fmt(v, 1), () => render());
  function render() {
    const z = g.map(f => f()), T = gt(), p = softmax(z, T), W = 520, H = 190, svg = svgIn($("#smFig"), W, H), lbl = ["Dry", "Normal", "Wet"], col = ["--sw", "--ok", "--cool"];
    p.forEach((v, i) => { const y0 = 20 + i * 54; el("text", { x: 0, y: y0 + 22, "font-size": 13 }, svg, lbl[i]);
      el("rect", { x: 70, y: y0, width: 380, height: 34, rx: 8, fill: css("--well") }, svg);
      el("rect", { x: 70, y: y0, width: 380 * v, height: 34, rx: 8, fill: css(col[i]) }, svg);
      el("text", { x: 460, y: y0 + 22, class: "mono", "font-size": 13 }, svg, fmt(v, 2)); });
    el("text", { x: 70, y: 186, class: "mut", "font-size": 11.5 }, svg, `sum = ${fmt(p.reduce((a, b) => a + b, 0), 2)} · scores ÷ T = [${z.map(v => fmt(v / T, 2)).join(", ")}]`);
  }
  render(); return render;
});

/* convolution 1D */
demo("a-conv1d", () => {
  const xs = [0, 2, 8, 3, 0, 0, 5, 12, 4, 1, 0];
  const P = { sum: [1, 1, 1], diff: [-1, 0, 1], smooth: [0.25, 0.5, 0.25] };
  let w = P.sum.slice();
  chips($("#c1Pick"), v => { w = P[v].slice(); build(); render(); });
  const gd = slider("c1Dil", v => v, () => render()), gp = slider("c1Pos", v => v, () => render());
  function build() {
    $("#c1In").innerHTML = xs.map((v, i) => `<input type="number" class="cell" data-i="${i}" value="${v}" min="0" max="99" aria-label="day ${i + 1} rainfall" style="width:3.1em;text-align:center">`).join("");
    $("#c1W").innerHTML = w.map((v, i) => `<input type="number" class="cell out" data-k="${i}" value="${v}" step="0.25" aria-label="filter weight ${i + 1}" style="width:3.6em;text-align:center">`).join("");
    $$("#c1In input").forEach(e => e.addEventListener("input", () => { xs[+e.dataset.i] = parseFloat(e.value) || 0; render(); }));
    $$("#c1W input").forEach(e => e.addEventListener("input", () => { w[+e.dataset.k] = parseFloat(e.value) || 0; render(); }));
  }
  function render() {
    const d = gd(), span = 2 * d, n = xs.length - span, pr = $("#c1Pos"); pr.max = n - 1; const pos = Math.min(gp(), n - 1);
    if (+pr.value > n - 1) { pr.value = n - 1; pr.parentElement.querySelector("output").textContent = n - 1; }
    const out = Array.from({ length: n }, (_, i) => w.reduce((s, wk, k) => s + wk * xs[i + k * d], 0));
    $$("#c1In input").forEach((e, i) => e.classList.toggle("hot", [0, 1, 2].some(k => pos + k * d === i)));
    $("#c1Out").innerHTML = out.map((v, i) => `<span class="cell ${i === pos ? "out" : ""}" style="${i === pos ? "font-weight:600" : ""}">${fmt(v, Number.isInteger(v) ? 0 : 2)}</span>`).join("");
    $("#c1Calc").innerHTML = `output[${pos}] = ${w.map((wk, k) => `${fmt(wk, 2)}×${xs[pos + k * d]}`).join(" + ")} = <span class="k">${fmt(out[pos], 2)}</span>\n<span class="m">days used: ${[0, 1, 2].map(k => pos + k * d + 1).join(", ")} · 3 weights, reused at all ${n} positions</span>`;
  }
  build(); render(); return render;
});

/* convolution 2D */
demo("a-conv2d", () => {
  const N = 10, F = [];
  for (let i = 0; i < N; i++) { F.push([]); for (let j = 0; j < N; j++) F[i].push(Math.round(30 * Math.exp(-((i - 3) ** 2 + (j - 3) ** 2) / 5) + 18 * Math.exp(-((i - 7) ** 2 + (j - 7) ** 2) / 3))); }
  const K = { blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)), ex: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], ey: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], sharp: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], id: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] };
  let k = "blur", hi = [3, 3];
  chips($("#c2Pick"), v => { k = v; render(); });
  function render() {
    const Kk = K[k], O = Array.from({ length: N - 2 }, (_, i) => Array.from({ length: N - 2 }, (_, j) => Kk.reduce((s, r, a) => s + r.reduce((t, w, b) => t + w * F[i + a][j + b], 0), 0)));
    const [hi_, hj] = hi;
    gridSVG($("#c2In"), F, { cell: 24, colorFn: v => heat(v, 0, 30), label: false, hi: (i, j) => i >= hi_ && i < hi_ + 3 && j >= hj && j < hj + 3 });
    const m = Math.max(...O.flat().map(Math.abs));
    gridSVG($("#c2Out"), O, { cell: 30, colorFn: v => (k === "ex" || k === "ey") ? div(v, m) : heat(v, 0, 30), label: false, hi: (i, j) => i === hi_ && j === hj, onCell: (i, j) => { hi = [i, j]; render(); } });
    $("#c2K").innerHTML = `<table class="tb" style="width:auto"><tbody>${Kk.map(r => `<tr>${r.map(v => `<td class="n" style="min-width:3.4em;background:${div(v, 1.5)}">${fmt(v, Number.isInteger(v) ? 0 : 2)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const win = [0, 1, 2].map(a => [0, 1, 2].map(b => F[hi_ + a][hj + b]));
    $("#c2Calc").innerHTML = `window at row ${hi_ + 1}, col ${hj + 1}:\n${win.map((r, a) => r.map((v, b) => `${fmt(Kk[a][b], Number.isInteger(Kk[a][b]) ? 0 : 2)}×${v}`).join(" + ")).join(" +\n")}\n= <span class="k">${fmt(O[hi_][hj], 1)}</span>`;
    $("#c2Read").innerHTML = `<div><span>Parameters per filter</span><b class="c-arch">9 + 1 = 10</b></div><div><span>Positions that reuse them</span><b>${(N - 2) ** 2}</b></div>`;
  }
  render(); return render;
});

/* pooling */
demo("a-pool", () => {
  const G = [[20, 22, 18, 17], [21, 25, 16, 19], [15, 14, 23, 24], [13, 12, 22, 26]], v1 = [10, 13, 11, 4];
  const gk = chips($("#poPick"), () => render());
  function render() {
    const mx = gk() === "max", f = a => mx ? Math.max(...a) : mean(a);
    const O = [0, 1].map(i => [0, 1].map(j => f([G[2 * i][2 * j], G[2 * i][2 * j + 1], G[2 * i + 1][2 * j], G[2 * i + 1][2 * j + 1]])));
    const blk = (i, j) => ((i >> 1) + (j >> 1)) % 2 === 0;
    gridSVG($("#poIn"), G, { cell: 40, colorFn: v => heat(v, 10, 27), hi: null });
    $$("#poIn rect").forEach((r, idx) => { const i = Math.floor(idx / 4), j = idx % 4, win = O[i >> 1][j >> 1]; if (mx && G[i][j] === win) { r.setAttribute("stroke", css("--fg")); r.setAttribute("stroke-width", 2.5); } r.setAttribute("opacity", blk(i, j) ? 1 : .8); });
    gridSVG($("#poOut"), O, { cell: 60, colorFn: v => heat(v, 10, 27), digits: mx ? 0 : 2 });
    const p1 = [f(v1.slice(0, 2)), f(v1.slice(2))];
    $("#poCalc1").innerHTML = `1D: [10, 13, 11, 4] → ${mx ? "max" : "mean"} of each pair → [<span class="k">${p1.map(v => fmt(v, mx ? 0 : 1)).join(", ")}</span>]`;
    $("#poRead").innerHTML = `<div><span>Output shape</span><b>4×4 → 2×2</b></div><div><span>Global ${mx ? "max" : "average"} pooling</span><b class="c-arch">${fmt(f(G.flat()), mx ? 0 : 2)}</b></div><div><span>Weights</span><b>0</b></div>`;
  }
  render(); return render;
});

/* resizing + U-Net */
demo("a-resize", () => {
  const C = [[2, 4, 8, 5], [3, 9, 14, 7], [1, 6, 11, 4], [0, 2, 5, 3]], kT = [[1, 0.7], [0.7, 0.45]];
  const gm = chips($("#rsPick"), () => grids()), gd = slider("unDepth", v => v, () => unet());
  function up(m) {
    if (m === "near") return Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => C[i >> 1][j >> 1]));
    if (m === "tconv") return Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => C[i >> 1][j >> 1] * kT[i % 2][j % 2]));
    return Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => { const y = clamp((i - 0.5) / 2, 0, 3), x = clamp((j - 0.5) / 2, 0, 3), y0 = Math.floor(y), x0 = Math.floor(x), y1 = Math.min(3, y0 + 1), x1 = Math.min(3, x0 + 1), fy = y - y0, fx = x - x0;
      return C[y0][x0] * (1 - fy) * (1 - fx) + C[y0][x1] * (1 - fy) * fx + C[y1][x0] * fy * (1 - fx) + C[y1][x1] * fy * fx; }));
  }
  function grids() {
    gridSVG($("#rsIn"), C, { cell: 44, colorFn: v => heat(v, 0, 14) });
    gridSVG($("#rsOut"), up(gm()), { cell: 22, colorFn: v => heat(v, 0, 14), label: false });
  }
  function unet() {
    const L = gd(), W = 520, H = 260, svg = svgIn($("#unetFig"), W, H); arrowDefs(svg, "un", css("--muted"));
    const lv = Array.from({ length: L + 1 }, (_, i) => ({ s: 64 >> i, c: 16 << i }));
    const bx = (i, side) => { const w = 18 + i * 6, h = 150 / (1 + i * 0.6); return { x: side ? W - 70 - i * 52 - w : 40 + i * 52, y: 30 + i * 46, w, h }; };
    lv.forEach((l, i) => { const enc = bx(i, 0); if (i === L) { enc.x = W / 2 - enc.w / 2; }
      el("rect", { x: enc.x, y: enc.y, width: enc.w, height: enc.h, rx: 5, fill: css(i === L ? "--arch" : "--arch-soft"), stroke: css("--arch") }, svg);
      el("text", { x: enc.x + enc.w / 2, y: enc.y + enc.h + 14, "text-anchor": "middle", "font-size": 10.5, class: "mono" }, svg, `${l.s}×${l.s}×${l.c}`);
      if (i < L) { const dec = bx(i, 1); el("rect", { x: dec.x, y: dec.y, width: dec.w, height: dec.h, rx: 5, fill: css("--cool-soft"), stroke: css("--cool") }, svg);
        el("text", { x: dec.x + dec.w / 2, y: dec.y + dec.h + 14, "text-anchor": "middle", "font-size": 10.5, class: "mono" }, svg, `${l.s}×${l.s}×${l.c}`);
        el("line", { x1: enc.x + enc.w + 4, y1: enc.y + 12, x2: dec.x - 4, y2: dec.y + 12, stroke: css("--sw"), "stroke-dasharray": "5 4", "marker-end": "url(#un)" }, svg);
        const nx = i + 1 === L ? { x: W / 2 - (18 + (i + 1) * 6) / 2, y: 30 + (i + 1) * 46 } : bx(i + 1, 0);
        el("line", { x1: enc.x + enc.w / 2, y1: enc.y + enc.h, x2: nx.x + 4, y2: nx.y - 2, stroke: css("--muted"), "marker-end": "url(#un)" }, svg);
        const nd = i + 1 === L ? { x: W / 2 + (18 + (i + 1) * 6) / 2, y: 30 + (i + 1) * 46 } : (b => ({ x: b.x + b.w, y: b.y }))(bx(i + 1, 1));
        el("line", { x1: nd.x - 4, y1: nd.y - 2, x2: dec.x + dec.w / 2, y2: dec.y + dec.h + 2 > nd.y ? dec.y + dec.h : dec.y + dec.h, stroke: css("--muted"), "marker-end": "url(#un)" }, svg); } });
    el("text", { x: 40, y: 16, "font-size": 11.5, fill: css("--arch") }, svg, "encoder: downsample");
    el("text", { x: W - 30, y: 16, "text-anchor": "end", "font-size": 11.5, fill: css("--cool") }, svg, "decoder: upsample");
    el("text", { x: W / 2, y: H - 4, "text-anchor": "middle", "font-size": 11.5, fill: css("--sw") }, svg, "- - skip connections carry fine detail across");
  }
  const render = () => { grids(); unet(); };
  render(); return render;
});

/* depthwise separable */
demo("a-sep", () => {
  const g = ["dsK", "dsCi", "dsCo"].map(id => slider(id, v => v, () => render()));
  function render() {
    const [k, ci, co] = g.map(f => f()), std = k * k * ci * co, sep = k * k * ci + ci * co, W = 520, H = 110, svg = svgIn($("#dsFig"), W, H), mx = Math.max(std, sep);
    [[std, "Standard", "--lw"], [sep, "Depthwise separable", "--ok"]].forEach(([v, t, c], i) => { el("text", { x: 0, y: 26 + i * 46, "font-size": 12.5 }, svg, t);
      el("rect", { x: 150, y: 10 + i * 46, width: 300 * v / mx, height: 30, rx: 6, fill: css(c), opacity: .85 }, svg);
      el("text", { x: 158 + 300 * v / mx, y: 30 + i * 46, class: "mono", "font-size": 12 }, svg, fmtN(v)); });
    $("#dsRead").innerHTML = `<div><span>Weights saved</span><b class="c-ok">${fmt(100 * (1 - sep / std), 1)}%</b></div><div><span>Ratio</span><b>${fmt(std / sep, 1)}×</b></div>`;
  }
  render(); return render;
});

/* simple RNN */
demo("a-rnn", () => {
  const x = [1, 0, 2, 0, 0, 1, 0, 0];
  const ga = slider("rnA", v => fmt(v, 2), () => render()), gb = slider("rnB", v => fmt(v, 1), () => render());
  function build() { $("#rnIn").innerHTML = x.map((v, i) => `<button class="cell" type="button" data-i="${i}" aria-label="day ${i + 1}: ${v}" style="cursor:pointer;${v ? "border-color:var(--cool);background:var(--cool-soft)" : ""}">${v}</button>`).join("");
    $$("#rnIn button").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i; x[i] = (x[i] + 1) % 3; build(); render(); })); }
  function render() {
    const a = ga(), b = gb(), h = []; let hp = 0;
    x.forEach(v => { hp = Math.tanh(a * hp + b * v); h.push(hp); });
    const W = 520, H = 190, svg = svgIn($("#rnFig"), W, H);
    const { x: X, y: Y } = axes(svg, { W, H, x0: 0.5, x1: x.length + 0.5, y0: 0, y1: 1, xt: x.map((_, i) => i + 1), yt: [0, 0.5, 1], xl: "day", yl: "memory h" });
    x.forEach((v, i) => v && el("rect", { x: X(i + 1) - 10, y: Y(v / 2 * 0.5), width: 20, height: Y(0) - Y(v / 2 * 0.5), fill: css("--cool"), opacity: .3 }, svg));
    el("path", { d: path(h.map((v, i) => [X(i + 1), Y(v)])), fill: "none", stroke: css("--arch"), "stroke-width": 2.4 }, svg);
    h.forEach((v, i) => { el("circle", { cx: X(i + 1), cy: Y(v), r: 5, fill: css("--arch") }, svg); el("text", { x: X(i + 1), y: Y(v) - 10, "text-anchor": "middle", class: "mono", "font-size": 11 }, svg, fmt(v, 2)); });
    let hp2 = 0;
    $("#rnCalc").innerHTML = x.slice(0, 4).map((v, i) => { const z = a * hp2 + b * v, s = `day ${i + 1}: tanh(${fmt(a, 2)}×${fmt(hp2, 2)} + ${fmt(b, 1)}×${v}) = tanh(${fmt(z, 2)}) = <span class="k">${fmt(Math.tanh(z), 2)}</span>`; hp2 = Math.tanh(z); return s; }).join("\n") + `\n<span class="m">… the same a and b at every step</span>`;
  }
  build(); render(); return render;
});

/* LSTM memory */
demo("a-lstm", () => {
  const ga = slider("lsA", v => fmt(v, 2), () => render()), gf = slider("lsF", v => fmt(v, 3), () => render());
  function render() {
    const a = ga(), f = gf(), N = 100, x = Array.from({ length: N }, (_, t) => t >= 0 && t < 10 ? 1 : 0), r = [], c = [];
    let h = 0, cc = 0; x.forEach(v => { h = a * h + (1 - a) * v; cc = f * cc + (1 - f) * v; r.push(h); c.push(cc); });
    const mr = Math.max(...r), mc = Math.max(...c), R = r.map(v => v / mr), Cc = c.map(v => v / mc);
    const W = 520, H = 210, svg = svgIn($("#lsFig2"), W, H);
    const { x: X, y: Y } = axes(svg, { W, H, x0: 0, x1: N - 1, y0: 0, y1: 1.05, xt: [0, 10, 40, 70, 99], yt: [0, 0.5, 1], xl: "day", yl: "memory (share of peak)" });
    el("rect", { x: X(0), y: 12, width: X(10) - X(0), height: H - 38, fill: css("--cool-soft") }, svg);
    el("text", { x: X(5), y: 26, "text-anchor": "middle", "font-size": 11, fill: css("--cool") }, svg, "wet spell");
    el("path", { d: path(R.map((v, i) => [X(i), Y(v)])), fill: "none", stroke: css("--lw"), "stroke-width": 2.2 }, svg);
    el("path", { d: path(Cc.map((v, i) => [X(i), Y(v)])), fill: "none", stroke: css("--arch"), "stroke-width": 2.6 }, svg);
    $("#lsRead2").innerHTML = `<div><span>Simple RNN at day 90</span><b class="c-lw">${fmt(100 * R[90], R[90] < 0.01 ? 2 : 0)}%</b></div><div><span>LSTM cell at day 90</span><b class="c-arch">${fmtN(100 * Cc[90])}%</b></div>`;
  }
  const lg = document.createElement("div"); lg.className = "legend";
  lg.innerHTML = `<span><i style="background:var(--lw)"></i>Simple RNN memory</span><span><i style="background:var(--arch)"></i>LSTM cell state</span>`;
  $("#lsFig2").after(lg);
  render(); return render;
});

/* attention over a sentence */
demo("a-attn", () => {
  const Wd = ["the", "cat", "sat", "because", "it", "was", "tired"];
  const S = [[2, 2, 0, -1, 0, -1, -1], [1, 2, 2, 0, 1, 0, 1], [0, 3, 1, 1, 0, 0, 0], [-1, 0, 2, 1, 0, 1, 2],
    [0, 3, 1, -2, -1, -2, 2], [-1, 1, 0, 0, 2, 1, 3], [-1, 2, 0, 1, 2, 2, 1]];
  let q = 4; const gt = slider("atT", v => fmt(v, 1), () => render());
  function render() {
    const T = gt(), w = softmax(S[q], T), W = 520, H = 220, svg = svgIn($("#atFig"), W, H), x = i => 40 + i * 73;
    Wd.forEach((t, i) => { const g = el("g", { style: "cursor:pointer" }, svg);
      el("rect", { x: x(i) - 33, y: 8, width: 66, height: 30, rx: 15, fill: i === q ? css("--arch") : css("--card"), stroke: css(i === q ? "--arch" : "--line") }, g);
      el("text", { x: x(i), y: 28, "text-anchor": "middle", "font-size": 13, fill: i === q ? css("--bg") : css("--fg") }, g, t);
      g.addEventListener("click", () => { q = i; render(); });
      el("path", { d: `M${x(q)} 40 Q${(x(q) + x(i)) / 2} ${90} ${x(i)} 112`, fill: "none", stroke: css("--arch"), "stroke-width": 0.5 + 10 * w[i], opacity: .25 + .75 * w[i] }, svg);
      el("rect", { x: x(i) - 22, y: 200 - 80 * w[i] - 2, width: 44, height: 80 * w[i] + 2, rx: 4, fill: css("--arch"), opacity: .25 + .75 * w[i] }, svg);
      el("text", { x: x(i), y: 214, "text-anchor": "middle", class: "mono", "font-size": 11 }, svg, fmt(w[i], 2)); });
    const top = w.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0])[0][1];
    $("#atCalc").innerHTML = `query "${Wd[q]}" · scores = [${S[q].join(", ")}]\nsoftmax(scores ÷ ${fmt(T, 1)}) = [${w.map(v => fmt(v, 2)).join(", ")}]\n<span class="m">"${Wd[q]}" takes its meaning mostly from </span><span class="k">"${Wd[top]}"</span>`;
  }
  render(); return render;
});

/* multi-head attention over time */
demo("a-heads", () => {
  const r = rng(101), N = 730, s = []; let e = 0;
  for (let t = 0; t <= N; t++) { e = 0.7 * e + 1.2 * gauss(r); s.push(12 + 9 * Math.sin(2 * Math.PI * (t - 150) / 365) + e); }
  const gh = chips($("#hdPick"), () => render()), gw = slider("hdW", v => v + " d", () => render());
  function render() {
    const wd = gw(), today = N - 1, rec = Array.from({ length: N }, (_, t) => Math.exp(-(today - t) / wd)), sea = Array.from({ length: N }, (_, t) => Math.exp(-((t - (today - 365)) ** 2) / (2 * 8 ** 2)));
    const nz = a => { const z = a.reduce((x, y) => x + y, 0); return a.map(v => v / z); }, R = nz(rec), Se = nz(sea), B = R.map((v, i) => (v + Se[i]) / 2);
    const Wt = { rec: R, sea: Se, both: B }[gh()];
    const fc = w => w.reduce((acc, v, t) => acc + v * s[t + 1], 0);  // each attended day "votes" with what came next
    const Wd = 520, H = 220, svg = svgIn($("#hdFig"), Wd, H), mx = Math.max(...Wt);
    const { x, y } = axes(svg, { W: Wd, H, x0: 0, x1: N, y0: -5, y1: 30, xt: [0, 365, 729], xf: v => ["2 years ago", "1 year ago", "today"][[0, 365, 729].indexOf(v)], yt: [0, 10, 20, 30], yl: "streamflow (m³/s)" });
    el("path", { d: path(s.slice(0, N).map((v, t) => [x(t), y(v)])), fill: "none", stroke: css("--muted"), "stroke-width": 1, opacity: .7 }, svg);
    el("path", { d: `M${x(0)} ${y(-5)} ` + Wt.map((v, t) => `L${x(t).toFixed(1)} ${(y(-5) - 70 * v / mx).toFixed(1)}`).join(" ") + ` L${x(N - 1)} ${y(-5)}Z`, fill: css("--arch-soft"), stroke: css("--arch"), "stroke-width": 1.4 }, svg);
    $("#hdRead").innerHTML = `<div><span>Tomorrow (truth)</span><b>${fmt(s[N], 1)}</b></div><div><span>Head 1 forecast</span><b class="${gh() === "rec" ? "c-arch" : ""}">${fmt(fc(R), 1)}</b></div><div><span>Head 2 forecast</span><b class="${gh() === "sea" ? "c-arch" : ""}">${fmt(fc(Se), 1)}</b></div><div><span>Both heads</span><b class="${gh() === "both" ? "c-arch" : ""}">${fmt(fc(B), 1)}</b></div>`;
  }
  render(); return render;
});

/* graph message passing */
demo("a-graph", () => {
  const P = [[70, 60], [180, 40], [290, 70], [400, 50], [120, 160], [240, 170], [360, 165], [460, 150]], E = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7], [6, 7], [4, 5], [5, 6]];
  const init = [2, 4, 38, 6, 1, 9, 12, 3]; let h = init.slice(), sel = 2, round = 0;
  const ga = slider("gnA", v => fmt(v, 2), () => render());
  const nb = i => E.filter(e => e.includes(i)).map(e => e[0] === i ? e[1] : e[0]);
  $("#gnStep").onclick = () => { const a = ga(); h = h.map((v, i) => a * v + (1 - a) * mean(nb(i).map(j => h[j]))); round++; render(); };
  $("#gnReset").onclick = () => { h = init.slice(); round = 0; render(); };
  function render() {
    const W = 520, H = 220, svg = svgIn($("#gnFig"), W, H), N = nb(sel);
    E.forEach(([a, b]) => { const act = (a === sel || b === sel); el("line", { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: css(act ? "--arch" : "--line"), "stroke-width": act ? 2.5 : 1.2 }, svg); });
    h.forEach((v, i) => { const g = el("g", { style: "cursor:pointer" }, svg);
      el("circle", { cx: P[i][0], cy: P[i][1], r: 22, fill: heat(v, 0, 38), stroke: css(i === sel ? "--fg" : "--line"), "stroke-width": i === sel ? 2.5 : 1 }, g);
      el("text", { x: P[i][0], y: P[i][1] + 4, "text-anchor": "middle", class: "mono", "font-size": 12 }, g, fmt(v, 1));
      el("text", { x: P[i][0], y: P[i][1] + 38, "text-anchor": "middle", class: "mut", "font-size": 10.5 }, g, "S" + (i + 1));
      g.addEventListener("click", () => { sel = i; render(); }); });
    const a = ga(), m = mean(N.map(j => h[j]));
    $("#gnCalc").innerHTML = `round ${round} · station S${sel + 1}: neighbours ${N.map(j => "S" + (j + 1)).join(", ")}\nmessages = [${N.map(j => fmt(h[j], 1)).join(", ")}] → mean ${fmt(m, 2)}\nnext value = ${fmt(a, 2)}×${fmt(h[sel], 1)} + ${fmt(1 - a, 2)}×${fmt(m, 2)} = <span class="k">${fmt(a * h[sel] + (1 - a) * m, 2)}</span>`;
  }
  render(); return render;
});

/* embedding lookup */
demo("a-embed", () => {
  const V = [125, 1100, 10000, 50000, 100000, 250000], D = [4, 8, 16, 64, 256, 768];
  const M = [["Medellín", 1, [1.3, 0.9, -0.2, 0.4]], ["Bello", 5, [1.1, 0.7, -0.1, 0.3]], ["Envigado", 9, [1.4, 1.2, -0.3, 0.6]], ["Itagüí", 13, [1.0, 0.8, 0.0, 0.2]],
    ["Caldas", 17, [0.2, -1.1, 0.7, 0.0]], ["Rionegro", 21, [0.6, 0.4, 0.5, -0.2]], ["Marinilla", 33, [0.5, 0.2, 0.6, -0.3]], ["Turbo", 101, [-1.3, -0.9, 0.2, 1.1]],
    ["Apartadó", 104, [-1.1, -0.7, 0.3, 1.0]], ["Necoclí", 110, [-1.5, -1.0, 0.1, 1.3]], ["Yarumal", 77, [-0.4, -0.6, 0.9, 0.2]], ["Santa Rosa de Osos", 88, [-0.2, -0.5, 1.0, 0.1]]];
  let sel = 4; const gv = slider("emV", i => fmtN(V[i]), () => read()), gd = slider("emD", i => D[i], () => read());
  function read() { const p = V[gv()] * D[gd()];
    $("#emRead").innerHTML = `<div><span>Table size</span><b>${fmtN(V[gv()])} × ${D[gd()]}</b></div><div><span>Parameters</span><b class="c-arch">${p >= 1e6 ? fmt(p / 1e6, 1) + " million" : fmtN(p)}</b></div>` +
      (V[gv()] === 50000 && D[gd()] === 768 ? `<p class="note" style="flex-basis:100%;margin:0">A language model's vocabulary: 38.4 million parameters just for this layer.</p>` : ""); }
  function render() {
    const W = 520, H = 260, svg = svgIn($("#emFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: -1.9, x1: 1.9, y0: -1.4, y1: 1.5, xt: [-1, 0, 1], yt: [-1, 0, 1], xl: "dimension 1", yl: "dimension 2" });
    el("ellipse", { cx: x(1.2), cy: y(0.9), rx: 70, ry: 34, fill: css("--cool-soft"), stroke: "none" }, svg);
    el("ellipse", { cx: x(-1.3), cy: y(-0.85), rx: 60, ry: 30, fill: css("--sw-soft"), stroke: "none" }, svg);
    el("text", { x: x(1.2), y: y(1.4), "text-anchor": "middle", "font-size": 11, fill: css("--cool") }, svg, "Valle de Aburrá (urban)");
    el("text", { x: x(-1.3), y: y(-1.33), "text-anchor": "middle", "font-size": 11, fill: css("--sw") }, svg, "Urabá");
    M.forEach(([n, id, v], i) => { const g = el("g", { style: "cursor:pointer" }, svg);
      el("circle", { cx: x(v[0]), cy: y(v[1]), r: i === sel ? 7 : 5, fill: css(i === sel ? "--arch" : "--fg"), opacity: i === sel ? 1 : .6 }, g);
      el("text", { x: x(v[0]) + 9, y: y(v[1]) + 4, "font-size": 11, "font-weight": i === sel ? 600 : 400 }, g, n);
      g.addEventListener("click", () => { sel = i; render(); }); });
    const [n, id, v] = M[sel];
    $("#emCalc").innerHTML = `${n} → ID ${id} → row ${id} of the table → [<span class="k">${v.map(u => fmt(u, 1)).join(", ")}</span>]\n<span class="m">click a municipality · the 4 numbers are trained like any other weights</span>`;
  }
  read(); render(); return render;
});

/* normalization */
demo("a-norm", () => {
  const gg = slider("nmG", v => fmt(v, 1), () => calc()), gb = slider("nmB", v => fmt(v, 1), () => calc()), gk = chips($("#nmPick"), () => fig());
  function calc() { const x = [2, 4, 6], m = mean(x), s = sd(x), z = x.map(v => (v - m) / s), o = z.map(v => gg() * v + gb());
    $("#nmCalc").innerHTML = `x = [2, 4, 6] · mean ${fmt(m, 0)} · std ${fmt(s, 2)}\nnormalized = [${z.map(v => fmt(v, 2)).join(", ")}]\n× ${fmt(gg(), 1)} + ${fmt(gb(), 1)} = [<span class="k">${o.map(v => fmt(v, 2)).join(", ")}</span>]\n<span class="m">learnable: γ and β, one pair per feature</span>`; }
  function fig() {
    const L = gk() === "layer", W = 520, H = 210, svg = svgIn($("#nmFig"), W, H), R = 4, C = 5, cw = 64, ch = 34, x0 = 120, y0 = 30;
    for (let i = 0; i < R; i++) { el("text", { x: x0 - 10, y: y0 + i * ch + 22, "text-anchor": "end", "font-size": 12, class: "mut" }, svg, "example " + (i + 1));
      for (let j = 0; j < C; j++) { const on = L ? i === 1 : j === 2; el("rect", { x: x0 + j * cw, y: y0 + i * ch, width: cw - 4, height: ch - 4, rx: 6, fill: on ? css("--arch") : css("--well"), opacity: on ? .85 : 1 }, svg); } }
    for (let j = 0; j < C; j++) el("text", { x: x0 + j * cw + cw / 2 - 2, y: y0 - 8, "text-anchor": "middle", "font-size": 11.5, class: "mut" }, svg, "feature " + (j + 1));
    $("#nmNote").textContent = L ? "Layer norm: the features of one example are normalized together. It works the same with a batch of one, so transformers use it." : "Batch norm: one feature is normalized across the examples in the batch. Common in CNNs; it needs reasonably large batches.";
  }
  const render = () => { calc(); fig(); };
  render(); return render;
});

/* wiring tricks */
demo("a-wiring", () => {
  const gx = slider("wrX", v => fmt(v, 1), () => res()), gl = slider("wrL", v => fmt(v, 1), () => res()), gg = slider("wgG", v => fmt(v, 2), () => gate());
  function res() { $("#wrRead").innerHTML = `<div><span>x + layer(x)</span><b class="c-arch">${fmt(gx() + gl(), 1)}</b></div>`; }
  function concat() {
    const W = 300, H = 140, svg = svgIn($("#wcFig"), W, H), a = [0.8, -0.3, 1.2], b = [2.1, 0.4], cell = (x, y, v, c) => { el("rect", { x, y, width: 34, height: 26, rx: 5, fill: css(c), opacity: .9 }, svg); el("text", { x: x + 17, y: y + 17, "text-anchor": "middle", class: "mono", "font-size": 11, fill: css("--bg") }, svg, fmt(v, 1)); };
    el("text", { x: 0, y: 14, "font-size": 11.5, class: "mut" }, svg, "satellite"); a.forEach((v, i) => cell(70 + i * 36, 0, v, "--cool"));
    el("text", { x: 0, y: 50, "font-size": 11.5, class: "mut" }, svg, "station"); b.forEach((v, i) => cell(70 + i * 36, 36, v, "--sw"));
    el("text", { x: 0, y: 112, "font-size": 11.5, class: "mut" }, svg, "joined"); [...a, ...b].forEach((v, i) => cell(70 + i * 36, 98, v, i < 3 ? "--cool" : "--sw"));
    el("text", { x: 260, y: 135, "text-anchor": "end", "font-size": 11, class: "mut" }, svg, "3 + 2 = 5 values");
  }
  function gate() {
    const g = gg(), W = 300, H = 120, svg = svgIn($("#wgFig"), W, H);
    el("text", { x: 0, y: 26, "font-size": 12 }, svg, "signal"); el("rect", { x: 60, y: 10, width: 220, height: 24, rx: 5, fill: css("--cool"), opacity: .85 }, svg);
    el("text", { x: 66, y: 27, class: "mono", "font-size": 11.5, fill: css("--bg") }, svg, "8.0");
    el("text", { x: 0, y: 66, "font-size": 12 }, svg, "× gate"); el("rect", { x: 60, y: 50, width: 220, height: 24, rx: 5, fill: css("--well") }, svg);
    el("rect", { x: 60, y: 50, width: 220 * g, height: 24, rx: 5, fill: css("--arch") }, svg);
    el("text", { x: 0, y: 106, "font-size": 12 }, svg, "output"); el("rect", { x: 60, y: 90, width: Math.max(2, 220 * g), height: 24, rx: 5, fill: css("--ok") }, svg);
    el("text", { x: 66 + 220 * g, y: 107, class: "mono", "font-size": 11.5 }, svg, fmt(8 * g, 2));
  }
  const render = () => { res(); concat(); gate(); };
  render(); return render;
});

/* dropout */
demo("a-dropout", () => {
  const r = rng(131), vals = Array.from({ length: 64 }, () => 0.5 + r() * 3.5); let mask = vals.map(() => r());
  const gr = slider("doR", v => fmt(v, 2), () => render()), gm = chips($("#doMode"), () => render());
  $("#doNext").onclick = () => { mask = vals.map(() => r()); render(); };
  function render() {
    const p = gr(), train = gm() === "train", W = 520, H = 230, svg = svgIn($("#doFig"), W, H), s = 1 / (1 - p || 1);
    const out = vals.map((v, i) => !train ? v : mask[i] < p ? 0 : v * s), mx = 4 / (1 - 0.9) > 40 ? 40 : 40;
    out.forEach((v, i) => { const x = 18 + (i % 16) * 31, y = 26 + Math.floor(i / 16) * 46, off = v === 0;
      el("circle", { cx: x, cy: y, r: 12, fill: off ? "none" : css("--arch"), stroke: css(off ? "--line" : "--arch"), opacity: off ? 1 : .35 + .65 * clamp(v / (4 * s), 0, 1) }, svg);
      if (off) { el("line", { x1: x - 7, y1: y - 7, x2: x + 7, y2: y + 7, stroke: css("--muted") }, svg); el("line", { x1: x + 7, y1: y - 7, x2: x - 7, y2: y + 7, stroke: css("--muted") }, svg); }
      el("text", { x, y: y + 26, "text-anchor": "middle", class: "mono", "font-size": 9 }, svg, off ? "0" : fmt(v, 1)); });
    const on = out.filter(v => v > 0).length;
    $("#doRead").innerHTML = `<div><span>Active neurons</span><b class="c-arch">${on} / 64</b></div><div><span>Mean before</span><b>${fmt(mean(vals), 2)}</b></div><div><span>Mean after</span><b>${fmt(mean(out), 2)}</b></div><div><span>Survivors scaled by</span><b>${train ? "×" + fmt(s, 2) : "no dropout"}</b></div>`;
  }
  render(); return render;
});

/* output layer by task */
demo("a-roles", () => {
  const T = {
    reg: { out: ["12.4 mm"], act: "none (linear)", n: "1 neuron", txt: "One number, any value. Loss: mean squared error.", ex: "y = w·h + b = 12.4 mm of rain tomorrow" },
    bin: { out: ["0.83"], act: "sigmoid", n: "1 neuron", txt: "A probability between 0 and 1. Flag as fraud (or attrition risk) above a threshold. Loss: binary cross-entropy.", ex: "z = 1.6 → sigmoid(1.6) = 0.83 probability of attrition" },
    multi: { out: ["0.12", "0.25", "0.63"], act: "softmax", n: "one neuron per class", txt: "Probabilities over classes that sum to 1. Loss: categorical cross-entropy.", ex: "scores [−0.4, 0.3, 1.2] → softmax → dry 0.12, normal 0.25, wet 0.63" },
    map: { out: ["grid"], act: "none, or ReLU for rain ≥ 0", n: "one value per pixel", txt: "A full grid, one value per pixel: a downscaled precipitation map. Usually the last layer of a U-Net.", ex: "64 × 64 inputs → 128 × 128 output map = 16,384 numbers" },
  };
  let t = "reg"; const bs = $$("#roPicks .pick");
  bs.forEach(b => b.addEventListener("click", () => { t = b.dataset.v; press(bs, b); render(); }));
  function render() {
    const c = T[t], W = 520, H = 200, svg = svgIn($("#roFig"), W, H); arrowDefs(svg, "ro", css("--muted"));
    const col = (x, n, lbl, color) => { for (let i = 0; i < n; i++) el("circle", { cx: x, cy: 100 + (i - (n - 1) / 2) * 30, r: 11, fill: css(color), opacity: .8 }, svg); el("text", { x, y: 190, "text-anchor": "middle", "font-size": 11.5, class: "mut" }, svg, lbl); };
    col(40, 5, "input: 5 features", "--muted"); col(160, 4, "hidden", "--arch"); col(260, 4, "hidden", "--arch");
    el("line", { x1: 60, y1: 100, x2: 140, y2: 100, stroke: css("--muted"), "marker-end": "url(#ro)" }, svg); el("line", { x1: 180, y1: 100, x2: 240, y2: 100, stroke: css("--muted"), "marker-end": "url(#ro)" }, svg);
    el("line", { x1: 280, y1: 100, x2: 340, y2: 100, stroke: css("--muted"), "marker-end": "url(#ro)" }, svg);
    if (t === "map") { for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) el("rect", { x: 360 + j * 16, y: 52 + i * 16, width: 14, height: 14, rx: 2, fill: heat(Math.sin(i / 2) + Math.cos(j / 2) + 1, 0, 3) }, svg); }
    else c.out.forEach((v, i) => { const y = 100 + (i - (c.out.length - 1) / 2) * 40; el("circle", { cx: 372, cy: y, r: 16, fill: css("--ok") }, svg); el("text", { x: 396, y: y + 4, class: "mono", "font-size": 13 }, svg, v + (t === "multi" ? ["  dry", "  normal", "  wet"][i] : "")); });
    el("text", { x: 372, y: 190, "text-anchor": "middle", "font-size": 11.5, class: "mut" }, svg, "output");
    $("#roCalc").innerHTML = `output: <span class="k">${c.n}</span> · activation: <span class="k">${c.act}</span>\n${c.txt}\n<span class="m">${c.ex}</span>`;
  }
  render(); return render;
});

/* parameter counting by layer type */
demo("a-params", () => {
  const L = [
    ["Dense", [["in", "Inputs", 1, 64, 4], ["out", "Neurons", 1, 64, 3]], v => [v.in * v.out + v.out, `${v.in} × ${v.out} + ${v.out}`, "Weights + one bias per neuron. 4 inputs → 3 neurons = 15."]],
    ["Convolutional", [["k", "Kernel", 1, 7, 3, 2], ["ci", "Channels in", 1, 64, 1], ["f", "Filters", 1, 64, 16]], v => [v.k * v.k * v.ci * v.f + v.f, `${v.k}×${v.k}×${v.ci}×${v.f} + ${v.f}`, "Independent of the image size: 16 filters of 3×3 on 1 channel = 160, for a 28×28 image or a 1000×1000 one."]],
    ["Pooling", [["k", "Window", 2, 4, 2]], v => [0, "0", "No weights: it only summarizes."]],
    ["LSTM (recurrent)", [["x", "Inputs per step", 1, 32, 1], ["h", "Units", 1, 128, 32]], v => [4 * (v.h * (v.h + v.x) + v.h), `4 × (${v.h}×(${v.h}+${v.x}) + ${v.h})`, "Four gates, each a dense map from [h, x] to h. Reused at every time step: 30 days or 3,000, same count."]],
    ["Multi-head attention", [["d", "Model width", 8, 512, 64, 8]], v => [4 * v.d * v.d + 4 * v.d, `4 × (${v.d}×${v.d} + ${v.d})`, "Query, key, value and output projections. The number of heads splits the width; it does not change the count."]],
    ["Embedding", [["v", "Categories", 2, 1000, 125], ["d", "Vector size", 1, 64, 4]], v => [v.v * v.d, `${v.v} × ${v.d}`, "One learnable row per category: 125 municipalities × 4 = 500."]],
    ["Layer norm", [["f", "Features", 1, 512, 64]], v => [2 * v.f, `2 × ${v.f}`, "A scale γ and a shift β per feature."]],
    ["Dropout / flatten", [["n", "Values", 1, 512, 64]], v => [0, "0", "No weights. Dropout is active only in training; flatten only rearranges numbers."]],
  ];
  let sel = 0; const host = $("#pcPicks");
  L.forEach((l, i) => { const b = document.createElement("button"); b.className = "pick"; b.type = "button"; b.setAttribute("aria-pressed", i === 0); b.innerHTML = "<b></b>"; b.querySelector("b").textContent = l[0];
    b.addEventListener("click", () => { sel = i; press($$(".pick", host), b); build(); }); host.appendChild(b); });
  host.style.gridTemplateColumns = "repeat(2,minmax(0,1fr))";
  function build() {
    const [n, C] = L[sel]; $("#pcTitle").textContent = n + " layer";
    $("#pcCtl").innerHTML = C.map(([k, lbl, mn, mx, v, st]) => `<div class="ctl"><label for="pc_${k}">${lbl}</label><input id="pc_${k}" type="range" min="${mn}" max="${mx}" step="${st || 1}" value="${v}"><output></output></div>`).join("");
    C.forEach(([k]) => slider("pc_" + k, v => v, () => calc())); calc();
  }
  function calc() {
    const [, C, f] = L[sel], v = {}; C.forEach(([k]) => v[k] = +$("#pc_" + k).value);
    const [p, form, note] = f(v);
    $("#pcFormula").textContent = "parameters = " + form; $("#pcRead").innerHTML = `<div><span>Trainable parameters</span><b class="c-arch">${fmtN(p)}</b></div>`; $("#pcNote").textContent = note;
  }
  build();
});

/* shapes and parameter tracker */
demo("a-shapes", () => {
  const g = {}; [["shF", v => v], ["shK", v => v + "×" + v], ["shP", v => ["none", "2×2", "2× (2×2)"][v]], ["shH", v => v ? v + " neurons" : "none"], ["shC", v => v]].forEach(([id, f]) => g[id] = slider(id, f, () => render()));
  function render() {
    const f = g.shF(), k = g.shK(), pl = g.shP(), hd = g.shH(), c = g.shC(), s = 28 >> pl, flat = s * s * f;
    const rows = [["Input", "28 × 28 × 1", 0, false], [`Conv ${f} filters ${k}×${k}`, `28 × 28 × ${f}`, k * k * f + f, true]];
    for (let i = 0; i < pl; i++) rows.push(["Max pooling 2×2", `${28 >> (i + 1)} × ${28 >> (i + 1)} × ${f}`, 0, false]);
    rows.push(["Flatten", fmtN(flat), 0, false]);
    if (hd) rows.push([`Dense ${hd}, ReLU`, fmtN(hd), flat * hd + hd, true]);
    rows.push([`Dense ${c}, softmax`, fmtN(c), (hd || flat) * c + c, true]);
    const tot = rows.reduce((a, r) => a + r[2], 0);
    $("#shTable").innerHTML = `<table class="tb"><thead><tr><th>Layer</th><th>Output shape</th><th style="text-align:right">Parameters</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="n" style="${r[3] ? "color:var(--arch)" : "color:var(--muted)"}">${fmtN(r[2])}</td></tr>`).join("")}<tr><td><b>Total</b></td><td></td><td class="n"><b>${fmtN(tot)}</b></td></tr></tbody></table>`;
    const W = 520, H = 60, svg = svgIn($("#shBar"), W, H); let x = 0; const cols = ["--cool", "--arch", "--sw", "--lw"];
    rows.filter(r => r[2] > 0).forEach((r, i) => { const w = W * r[2] / tot; el("rect", { x, y: 6, width: Math.max(1, w), height: 26, fill: css(cols[i % 4]), opacity: .85 }, svg);
      if (w > 60) el("text", { x: x + 6, y: 24, "font-size": 11.5, fill: css("--bg") }, svg, `${fmtN(100 * r[2] / tot)}%`); x += w; });
    const last = rows[rows.length - 1][2];
    el("text", { x: 0, y: 52, "font-size": 11.5, class: "mut" }, svg, `Share of parameters by layer · the output layer alone holds ${fmt(100 * last / tot, 1)}%`);
  }
  render(); return render;
});

/* width and depth */
demo("a-width", () => {
  const g = ["wdIn", "wdW", "wdD"].map(id => slider(id, v => v, () => render()));
  $("#wdHier").innerHTML = [["Layer 1", "Edges, short rain bursts"], ["Layer 2", "Corners, textures, a wet week"], ["Layer 3", "Objects, storm systems, a wet season"]].map(([a, b]) => `<div class="card"><h4 style="color:var(--arch)">${a}</h4><p>${b}</p></div>`).join("");
  function render() {
    const [n, w, d] = g.map(f => f()), p = n * w + w + (d - 1) * (w * w + w) + w + 1, W = 520, H = 200, svg = svgIn($("#wdFig"), W, H);
    const cols = [n, ...Array(d).fill(w), 1], xs = cols.map((_, i) => 30 + i * (W - 60) / (cols.length - 1));
    cols.forEach((m, i) => { const shown = Math.min(m, 9), ys = Array.from({ length: shown }, (_, k) => 100 + (k - (shown - 1) / 2) * 18);
      if (i < cols.length - 1) { const nshow = Math.min(cols[i + 1], 9), ys2 = Array.from({ length: nshow }, (_, k) => 100 + (k - (nshow - 1) / 2) * 18);
        ys.forEach(a => ys2.forEach(b => el("line", { x1: xs[i], y1: a, x2: xs[i + 1], y2: b, stroke: css("--line"), "stroke-width": .6 }, svg))); }
      ys.forEach(y => el("circle", { cx: xs[i], cy: y, r: 6, fill: css(i === 0 ? "--muted" : i === cols.length - 1 ? "--ok" : "--arch") }, svg));
      if (m > 9) el("text", { x: xs[i], y: 192, "text-anchor": "middle", "font-size": 10.5, class: "mut mono" }, svg, m);
    });
    $("#wdRead").innerHTML = `<div><span>Parameters</span><b class="c-arch">${fmtN(p)}</b></div><div><span>Of which in hidden→hidden</span><b>${fmtN((d - 1) * (w * w + w))}</b></div>`;
  }
  render(); return render;
});

/* trainable quiz */
demo("a-trainable", () => {
  bindQuiz("#trQuiz", "#trScore", [["Dense layer", "Yes", "Its weights and biases are learned."], ["Convolutional layer", "Yes", "Filter weights and biases."], ["Max pooling", "No", "It only picks the maximum."],
    ["Flatten", "No", "It only rearranges numbers."], ["Dropout", "No", "Random switching, no weights."], ["LSTM layer", "Yes", "Four gates of weights."], ["Multi-head attention", "Yes", "Query, key, value and output projections."],
    ["Embedding layer", "Yes", "The table rows are weights."], ["Batch norm", "Yes", "A learned scale γ and shift β (plus running statistics that are not trained)."], ["ReLU activation", "No", "A fixed function, max(0, x)."]], ["Yes", "No"]);
});

/* families */
demo("a-families", () => {
  const F = [
    ["MLP", ["Dense", "Dense", "Dense"], "Dense layers stacked. Works on tables of features.", ["Climate: rainfall from station predictors", "Health: risk from a set of lab values", "Education: attrition risk from 20 student variables"]],
    ["CNN", ["Conv", "Pool", "Conv", "Pool", "Dense"], "Convolution and pooling, then dense layers. Works on grids.", ["Climate: detecting tropical cyclones in satellite images", "Health: reading X-rays", "Education: reading handwritten exams"]],
    ["RNN / LSTM", ["LSTM", "LSTM", "Dense"], "Recurrent layers over a sequence, then a dense output.", ["Climate: daily streamflow from rainfall (the classic LSTM)", "Health: vital signs over hours", "Education: semester-by-semester grades"]],
    ["Transformer", ["Embed", "Attn+MLP", "Attn+MLP", "Head"], "Embeddings, then transformer blocks (attention + a small MLP, each with a residual connection and normalization).", ["Climate: data-driven global weather models", "Health: clinical notes", "Education: language tutors"]],
    ["Graph network", ["Graph", "Graph", "Dense"], "Message passing over a given graph.", ["Climate: station networks, river networks, weather on a mesh", "Health: molecules for drug discovery", "Education: student–course networks"]],
    ["U-Net", ["Enc", "Enc", "Bottleneck", "Dec", "Dec"], "Encoder–decoder with skip connections; outputs a map the size of the input.", ["Climate: downscaling and nowcasting maps", "Health: segmenting tumours", "Education: segmenting scanned forms"]],
    ["Autoencoder", ["Enc", "Code", "Dec"], "Squeezes the input through a small code and rebuilds it. Used for compression and anomaly detection.", ["Climate: compressing climate fields", "Health: flagging unusual records", "Education: detecting anomalous enrollment records"]],
  ];
  let sel = 0; const host = $("#fmPicks");
  F.forEach((f, i) => { const b = document.createElement("button"); b.className = "pick"; b.type = "button"; b.setAttribute("aria-pressed", i === 0); b.innerHTML = `<b></b>`; b.querySelector("b").textContent = f[0];
    b.addEventListener("click", () => { sel = i; press($$(".pick", host), b); render(); }); host.appendChild(b); });
  host.style.gridTemplateColumns = "repeat(2,minmax(0,1fr))";
  function render() {
    const [n, B, t, ex] = F[sel], W = 520, H = 130, svg = svgIn($("#fmFig"), W, H); arrowDefs(svg, "fm", css("--muted"));
    const bw = Math.min(90, (W - 40) / B.length - 14), sp = (W - 20 - B.length * bw) / Math.max(1, B.length - 1);
    const size = s => n === "U-Net" || n === "Autoencoder" ? ({ Enc: 1, Bottleneck: .55, Code: .45, Dec: 1 }[s] || 1) : 1;
    B.forEach((s, i) => { const x = 10 + i * (bw + sp), h = 80 * size(s), y = 60 - h / 2;
      el("rect", { x, y, width: bw, height: h, rx: 10, fill: css(/Dec|Head/.test(s) ? "--cool-soft" : "--arch-soft"), stroke: css(/Dec|Head/.test(s) ? "--cool" : "--arch") }, svg);
      el("text", { x: x + bw / 2, y: 64, "text-anchor": "middle", "font-size": 12 }, svg, s);
      if (i < B.length - 1) el("line", { x1: x + bw + 2, y1: 60, x2: x + bw + sp - 2, y2: 60, stroke: css("--muted"), "marker-end": "url(#fm)" }, svg); });
    if (n === "U-Net") el("path", { d: `M${10 + bw / 2} ${20} C${10 + bw / 2} 0 ${10 + 4 * (bw + sp) + bw / 2} 0 ${10 + 4 * (bw + sp) + bw / 2} 20`, fill: "none", stroke: css("--sw"), "stroke-dasharray": "5 4" }, svg);
    if (n === "Transformer") el("text", { x: W / 2, y: H - 4, "text-anchor": "middle", "font-size": 11, class: "mut" }, svg, "each block: attention → add & norm → MLP → add & norm");
    $("#fmText").innerHTML = `<b>${n}.</b> ${t}`;
    $("#fmEx").innerHTML = ex.map(e => { const [a, b] = e.split(": "); return `<div class="card"><h4 style="font-size:13px;color:var(--arch)">${a}</h4><p>${b}</p></div>`; }).join("");
  }
  render(); return render;
});
