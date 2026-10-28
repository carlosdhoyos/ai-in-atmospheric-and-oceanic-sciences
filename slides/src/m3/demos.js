/* ───────── Module 3 · Layers ───────── */

/* what a layer is: open the package and see its operations */
demo("l-what", () => {
  // stages: [label, parameters owned (0 = fixed function)]
  const T = {
    dense: { inp: "4 numbers", out: "3 numbers", st: [["Weighted sum W·x", 12], ["Add bias b", 3], ["ReLU", 0]], f: "y = ReLU(W·x + b)   W: 3 × 4, b: 3", ops: "op-wsum" },
    conv: { inp: "28 × 28 × 1 image", out: "28 × 28 × 16 maps", st: [["Slide 16 filters of 3 × 3", 144], ["Add one bias per filter", 16], ["ReLU", 0]], f: "map_k = ReLU(filter_k ∗ image + b_k)   k = 1 … 16", ops: "op-conv2d" },
    pool: { inp: "4 × 4 temperature grid", out: "2 × 2 grid", st: [["Max over each 2 × 2 window", 0]], f: "y = max of each 2 × 2 block   (no weights)", ops: "op-pool" },
    rnn: { inp: "3 days × 1 value", out: "3 hidden states", st: [["Input weight w·xₜ", 1], ["Memory weight u·hₜ₋₁", 1], ["Add bias", 1], ["tanh", 0], ["Repeat every step, same weights", 0]], f: "hₜ = tanh(u·hₜ₋₁ + w·xₜ + b)", ops: "op-rnn" },
    attn: { inp: "7 words × 64", out: "7 words × 64", st: [["Query, key, value projections", 3 * (64 * 64 + 64)], ["Scores q·k / √d", 0], ["Softmax", 0], ["Weighted average of values", 0], ["Output projection", 64 * 64 + 64]], f: "out = W_o · softmax(QKᵀ/√d) V", ops: "op-mha" },
    norm: { inp: "64 features", out: "64 features", st: [["Mean and spread over features", 0], ["(x − μ) / σ", 0], ["Learned scale γ", 64], ["Learned shift β", 64]], f: "y = γ · (x − μ)/σ + β", ops: "op-ln" },
  };
  let k = "dense"; chips($("#lwPick"), v => { k = v; render(); });
  function render() {
    const t = T[k], n = t.st.length + 2, rh = 32, gap = 12, W = 500, H = n * (rh + gap), svg = svgIn($("#lwFig"), W, H);
    arrowDefs(svg, "lw", css("--muted"));
    const rows = [["in: " + t.inp, -1], ...t.st, ["out: " + t.out, -1]];
    el("rect", { x: 30, y: rh + gap / 2, width: W - 60, height: t.st.length * (rh + gap), rx: 14, fill: "none", stroke: css("--arch"), "stroke-dasharray": "6 4" }, svg);
    el("text", { x: W - 40, y: rh + gap / 2 + 16, "text-anchor": "end", "font-size": 11, fill: css("--arch") }, svg, "the layer");
    rows.forEach(([lbl, p], i) => {
      const y = i * (rh + gap) + (i ? gap / 2 : 0), io = p < 0, col = io ? "--data" : p ? "--arch" : "--muted", x = io ? 60 : 90, w = io ? W - 120 : W - 180;
      el("rect", { x, y, width: w, height: rh, rx: 8, fill: `color-mix(in srgb, var(${col}) ${p ? 16 : 8}%, var(--card))`, stroke: css(col) }, svg);
      el("text", { x: x + 12, y: y + 21, "font-size": 13 }, svg, lbl);
      if (!io) el("text", { x: x + w - 10, y: y + 21, "text-anchor": "end", class: "mono", "font-size": 12, fill: css(p ? "--arch" : "--muted") }, svg, p ? fmtN(p) + " weights" : "fixed");
      if (i < rows.length - 1) el("line", { x1: W / 2, y1: y + rh, x2: W / 2, y2: y + rh + gap - 1, stroke: css("--muted"), "marker-end": "url(#lw)" }, svg);
    });
    const tot = t.st.reduce((s, r) => s + r[1], 0);
    $("#lwCalc").innerHTML = `${t.f}<br><a href="operations.html#${t.ops}">See the operation in Module 2 →</a>`;
    $("#lwRead").innerHTML = `<div><span>Trainable parameters</span><b class="c-arch">${fmtN(tot)}</b></div><div><span>Operations inside</span><b>${t.st.length}</b></div>`;
  }
  render(); return render;
});

/* operations → layers → blocks → families */
demo("l-hier", () => {
  const OPS = [["Connecting values", ["Dense", "Convolution", "Recurrence", "Attention", "Message passing"]],
    ["Summarizing and resizing", ["Pooling", "Down / upsampling", "Embedding lookup", "Flatten"]],
    ["Shaping the signal", ["Activation", "Normalization"]],
    ["Wiring tricks", ["Residual", "Concatenation", "Gating"]],
    ["Training only", ["Dropout"]]];
  const L = [["Operations", OPS.flatMap(g => g[1])],
    ["Layers", ["Dense layer", "Conv layer", "Pooling layer", "Flatten layer", "LSTM / GRU layer", "Attention layer", "Graph layer", "Embedding layer", "Norm layer", "Dropout layer"]],
    ["Blocks", ["Residual block", "Transformer block", "Encoder", "Decoder"]],
    ["Families", ["MLP", "CNN", "RNN / LSTM", "Transformer", "Graph network", "U-Net", "Autoencoder"]]];
  const E = [["Dense", "Dense layer"], ["Dense", "Attention layer"], ["Dense", "LSTM / GRU layer"], ["Convolution", "Conv layer"], ["Recurrence", "LSTM / GRU layer"], ["Attention", "Attention layer"], ["Message passing", "Graph layer"],
    ["Pooling", "Pooling layer"], ["Down / upsampling", "Pooling layer"], ["Down / upsampling", "Conv layer"], ["Embedding lookup", "Embedding layer"], ["Flatten", "Flatten layer"],
    ["Activation", "Dense layer"], ["Activation", "Conv layer"], ["Activation", "LSTM / GRU layer"], ["Normalization", "Norm layer"], ["Gating", "LSTM / GRU layer"], ["Dropout", "Dropout layer"],
    ["Residual", "Residual block"], ["Residual", "Transformer block"], ["Concatenation", "Decoder"],
    ["Conv layer", "Residual block"], ["Norm layer", "Residual block"], ["Attention layer", "Transformer block"], ["Dense layer", "Transformer block"], ["Norm layer", "Transformer block"], ["Dropout layer", "Transformer block"],
    ["Conv layer", "Encoder"], ["Pooling layer", "Encoder"], ["Conv layer", "Decoder"], ["Dense layer", "Encoder"], ["Dense layer", "Decoder"],
    ["Dense layer", "MLP"], ["Dropout layer", "MLP"], ["Residual block", "CNN"], ["Conv layer", "CNN"], ["Pooling layer", "CNN"], ["Flatten layer", "CNN"], ["LSTM / GRU layer", "RNN / LSTM"], ["Dense layer", "RNN / LSTM"],
    ["Embedding layer", "Transformer"], ["Transformer block", "Transformer"], ["Graph layer", "Graph network"], ["Dense layer", "Graph network"], ["Encoder", "U-Net"], ["Decoder", "U-Net"], ["Encoder", "Autoencoder"], ["Decoder", "Autoencoder"]];
  // description, and where to go: "op-…" = Module 2 slide, "l-…" = this module, null = coming next
  const D = {
    "Dense": ["Every input connects to every output with its own weight.", "op-wsum"], "Convolution": ["A small filter of shared weights slides over the input.", "op-conv2d"],
    "Recurrence": ["Processes a sequence step by step, carrying a hidden state.", "op-rnn"], "Attention": ["Scores every pair, softmaxes the scores, takes a weighted average.", "op-self"],
    "Message passing": ["Each node aggregates messages from its graph neighbours.", "op-graph"], "Pooling": ["Summarizes a neighbourhood with its max or mean.", "op-pool"],
    "Down / upsampling": ["Changes resolution: strided convolution, interpolation, transposed convolution.", "op-resample"], "Embedding lookup": ["A category ID picks a row of learnable numbers.", "op-embed"],
    "Flatten": ["Lays a grid out as one long list.", "op-flatten"], "Activation": ["A simple nonlinear function on each value: ReLU, sigmoid, tanh, GELU.", "op-act"],
    "Normalization": ["Rescales values to a healthy range: batch norm or layer norm.", "op-bn"], "Residual": ["output = input + layer(input).", "op-res"],
    "Concatenation": ["Stacks outputs side by side, as in U-Net skips.", "op-concat"], "Gating": ["Multiplies a signal by a learned value between 0 and 1, like a valve.", "op-gate"],
    "Dropout": ["In training only, switches off a random fraction of values.", "op-dropout"],
    "Dense layer": ["Matrix multiply + bias + activation.", "l-types"], "Conv layer": ["Several filters, each producing a feature map.", "l-types"], "Pooling layer": ["No weights; shrinks and summarizes.", "l-types"],
    "Flatten layer": ["No weights; turns a grid into a vector for dense layers.", "l-shapes"], "LSTM / GRU layer": ["A composite layer: gates and memory, the same weights at every step.", "l-composite"],
    "Attention layer": ["Several heads in parallel; Q, K, V and output projections are dense operations.", "l-what"], "Graph layer": ["Message passing with learned weights on the messages.", "op-graph"],
    "Embedding layer": ["A lookup table of learnable vectors.", "l-types"], "Norm layer": ["Normalization with a learned scale and shift.", "l-what"], "Dropout layer": ["No weights; active only in training.", "l-trainable"],
    "Residual block": ["A few layers plus a skip: output = x + block(x).", null], "Transformer block": ["Attention, then a small dense network, each with normalization and a residual connection.", null],
    "Encoder": ["Layers that compress the input into a smaller representation.", null], "Decoder": ["Layers that expand a representation back to an output.", null],
    "MLP": ["Dense layers stacked.", null], "CNN": ["Conv and pooling layers, then dense layers.", null], "RNN / LSTM": ["Recurrent layers over a sequence, then a dense output.", null],
    "Transformer": ["Embeddings, then a stack of transformer blocks.", null], "Graph network": ["Stacked graph layers over stations, meshes or molecules.", null],
    "U-Net": ["An encoder and a decoder with skips between matching levels.", null], "Autoencoder": ["Squeezes the input through a bottleneck and rebuilds it.", null],
  };
  let sel = "LSTM / GRU layer";
  const neigh = (n, up) => E.filter(e => (up ? e[0] : e[1]) === n).map(e => up ? e[1] : e[0]);
  const reach = (n, up, acc = new Set()) => { neigh(n, up).forEach(m => { if (!acc.has(m)) { acc.add(m); reach(m, up, acc); } }); return acc; };
  function render() {
    const W = 1000, colW = 250, rh = 24, gap = 4, gh = 19, pos = {};
    let y = 30;
    OPS.forEach(([g, items]) => { pos["§" + g] = [10, y + 13]; y += gh; items.forEach(it => { pos[it] = [10, y]; y += rh + gap; }); });
    const H = Math.max(y, 30 + gh + 10 * (rh + gap)) + 4, svg = svgIn($("#lhFig"), W, H);
    L.slice(1).forEach(([, items], c) => items.forEach((it, r) => pos[it] = [(c + 1) * colW + 10, 30 + gh + r * (rh + gap)]));
    L.forEach(([t], c) => el("text", { x: c * colW + 10, y: 16, class: "mono", "font-size": 12, fill: css(c === 1 ? "--accent" : "--arch") }, svg, (c + 2) + " · " + t.toUpperCase()));
    OPS.forEach(([g]) => el("text", { x: 12, y: pos["§" + g][1], class: "mut", "font-size": 10.5, "font-style": "italic" }, svg, g));
    const on = new Set([sel, ...reach(sel, true), ...reach(sel, false)]);
    E.forEach(([a, b]) => { const A = pos[a], B = pos[b], act = on.has(a) && on.has(b);
      el("path", { d: `M${A[0] + 200} ${A[1] + rh / 2} C${A[0] + 225} ${A[1] + rh / 2} ${B[0] - 25} ${B[1] + rh / 2} ${B[0]} ${B[1] + rh / 2}`, fill: "none", stroke: css(act ? "--arch" : "--line"), "stroke-width": act ? 1.8 : 1, opacity: act ? 1 : .55 }, svg); });
    L.flatMap(l => l[1]).forEach(it => { const [x, yy] = pos[it], isS = it === sel, act = on.has(it);
      const g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": it }, svg);
      el("rect", { x, y: yy, width: 200, height: rh, rx: 9, fill: isS ? css("--arch") : act ? css("--arch-soft") : css("--card"), stroke: css(act ? "--arch" : "--line") }, g);
      el("text", { x: x + 12, y: yy + 16.5, "font-size": 13, "font-weight": isS ? 600 : 400, fill: isS ? css("--bg") : css("--fg") }, g, it);
      const pick = () => { sel = it; render(); };
      g.addEventListener("click", pick); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); pick(); } }); });
    const lvl = L.findIndex(l => l[1].includes(sel)), parts = [...reach(sel, false)], users = [...reach(sel, true)], to = D[sel][1];
    const grp = lvl === 0 ? " · " + OPS.find(g => g[1].includes(sel))[0].toLowerCase() : "";
    const go = !to ? `<p class="note">Module ${lvl + 2} takes this apart. Coming next.</p>`
      : to.startsWith("op-") ? `<a class="btn" href="operations.html#${to}">Open in Module 2 →</a>` : `<button class="btn" type="button" data-go="${to}">Go to the slide →</button>`;
    $("#hierCard").innerHTML = `<p class="kicker k-arch">${L[lvl][0].replace(/s$/, "")}${grp}</p><h4 style="font-size:19px"></h4><p class="d"></p>` +
      (parts.length ? `<p class="note"><b>Built from:</b> ${parts.join(", ")}.</p>` : "") + (users.length ? `<p class="note"><b>Used in:</b> ${users.join(", ")}.</p>` : "") + go;
    $("#hierCard h4").textContent = sel; $("#hierCard .d").textContent = D[sel][0];
  }
  render(); return render;
});

/* output layer by task */
demo("l-roles", () => {
  const T = {
    reg: { out: ["12.4 mm"], act: "none (linear)", n: "1 neuron", txt: "One number, any value. Loss: mean squared error.", ex: "y = w·h + b = 12.4 mm of rain tomorrow" },
    bin: { out: ["0.83"], act: "sigmoid", n: "1 neuron", txt: "A probability between 0 and 1; flag the student above a threshold. Loss: binary cross-entropy.", ex: "z = 1.6 → sigmoid(1.6) = 0.83 probability of attrition" },
    multi: { out: ["0.12", "0.25", "0.63"], act: "softmax", n: "one neuron per class", txt: "Probabilities over classes that sum to 1. Loss: categorical cross-entropy.", ex: "scores [−0.4, 0.3, 1.2] → softmax → dry 0.12, normal 0.25, wet 0.63" },
    map: { out: ["grid"], act: "none, or ReLU so rain ≥ 0", n: "one value per pixel", txt: "A full grid, one value per pixel. Usually the last layer of a U-Net.", ex: "64 × 64 inputs → 128 × 128 output map = 16,384 numbers" },
  };
  let t = "reg"; const bs = $$("#lrPicks .pick");
  bs.forEach(b => b.addEventListener("click", () => { t = b.dataset.v; press(bs, b); render(); }));
  function render() {
    const c = T[t], W = 520, H = 200, svg = svgIn($("#lrFig"), W, H); arrowDefs(svg, "lro", css("--muted"));
    const col = (x, n, lbl, color) => { for (let i = 0; i < n; i++) el("circle", { cx: x, cy: 95 + (i - (n - 1) / 2) * 28, r: 11, fill: css(color), opacity: .8 }, svg); el("text", { x, y: 192, "text-anchor": "middle", "font-size": 11.5, class: "mut" }, svg, lbl); };
    col(40, 5, "input: 5 features", "--data"); col(160, 4, "hidden", "--arch"); col(260, 4, "hidden", "--arch");
    [[60, 140], [180, 240], [280, 340]].forEach(([a, b]) => el("line", { x1: a, y1: 95, x2: b, y2: 95, stroke: css("--muted"), "marker-end": "url(#lro)" }, svg));
    if (t === "map") { for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) el("rect", { x: 360 + j * 16, y: 47 + i * 16, width: 14, height: 14, rx: 2, fill: heat(Math.sin(i / 2) + Math.cos(j / 2) + 1, 0, 3) }, svg); }
    else c.out.forEach((v, i) => { const y = 95 + (i - (c.out.length - 1) / 2) * 40; el("circle", { cx: 372, cy: y, r: 16, fill: css("--ok") }, svg); el("text", { x: 396, y: y + 4, class: "mono", "font-size": 13 }, svg, v + (t === "multi" ? ["  dry", "  normal", "  wet"][i] : "")); });
    el("text", { x: 372, y: 192, "text-anchor": "middle", "font-size": 11.5, class: "mut" }, svg, "output");
    $("#lrCalc").innerHTML = `output: <span class="k">${c.n}</span> · activation: <span class="k">${c.act}</span>\n${c.txt}\n<span class="m">${c.ex}</span>`;
  }
  render(); return render;
});

/* layer types: parameter counts with a worked example each */
demo("l-types", () => {
  const L = [
    ["Dense", [["in", "Inputs", 1, 64, 4], ["out", "Neurons", 1, 64, 3]], v => [v.in * v.out + v.out, `${v.in} × ${v.out} + ${v.out}`, "Weights plus one bias per neuron."],
      "4 inputs → 3 neurons\n= 4 × 3 weights + 3 biases = 15 parameters"],
    ["Convolutional", [["k", "Kernel", 1, 7, 3, 2], ["ci", "Channels in", 1, 64, 1], ["f", "Filters", 1, 64, 16]], v => [v.k * v.k * v.ci * v.f + v.f, `${v.k}·${v.k}·${v.ci}·${v.f} + ${v.f}`, "Independent of the image size: the same filters slide everywhere."],
      "16 filters of 3 × 3 on a 1-channel image\n= 16 × 9 + 16 = 160 parameters\nfor a 28 × 28 image or a 1000 × 1000 one"],
    ["Pooling", [["k", "Window", 2, 4, 2]], v => [0, "0", "No weights: it only summarizes."],
      "2 × 2 max pooling, 4 × 4 temperatures (°C):\n24 26 | 18 17        26 | 18\n25 23 | 16 15   →    ------\n22 21 | 12 14        22 | 14\n20 19 | 13 11\nkeeps the hottest cell of each block"],
    ["Recurrent", [["x", "Inputs per step", 1, 32, 1], ["h", "Units", 1, 128, 1]], v => [v.h * (v.h + v.x) + v.h, `${v.h}×(${v.h}+${v.x}) + ${v.h}`, "Reused at every time step: 30 days or 3,000, the same count. LSTM ×4, GRU ×3."],
      "hₜ = tanh(0.5·hₜ₋₁ + 1·xₜ), h₀ = 0, rain [1, 0, 2]\nh₁ = tanh(1) = 0.76\nh₂ = tanh(0.38) = 0.36\nh₃ = tanh(2.18) = 0.97\nremembers wet days, fades in dry ones"],
    ["Multi-head attention", [["d", "Model width", 8, 512, 64, 8]], v => [4 * v.d * v.d + 4 * v.d, `4 × (${v.d}×${v.d} + ${v.d})`, "Query, key, value and output projections. The number of heads splits the width; it does not change the count."],
      "scores of “it” vs [the, cat, sat, tired] = [0, 3, 1, 2]\nsoftmax → [0.03, 0.64, 0.09, 0.24]\n“it” takes 64% of its meaning from “cat”"],
    ["Embedding", [["v", "Categories", 2, 1000, 125], ["d", "Vector size", 1, 64, 4]], v => [v.v * v.d, `${v.v} × ${v.d}`, "One learnable row per category."],
      "125 municipalities of Antioquia × 4 numbers\n= 500 parameters\nMedellín → row 1 → [0.21, −0.40, 0.88, 0.05]"],
    ["Layer norm", [["f", "Features", 1, 512, 64]], v => [2 * v.f, `2 × ${v.f}`, "A scale γ and a shift β per feature."],
      "[2, 4, 6]: mean 4, spread 1.63\n→ [−1.22, 0, 1.22]\nthen × γ + β, both learned"],
    ["Dropout", [["n", "Neurons", 1, 512, 64], ["r", "Rate %", 0, 90, 30, 5]], v => [0, "0", `No weights. Each training step about ${fmtN(v.n * v.r / 100)} of ${v.n} neurons are switched off; at prediction time, none.`],
      "rate 0.3 on 64 neurons\nswitches off about 19 per training step"],
    ["Flatten", [["h", "Grid rows", 1, 32, 4], ["w", "Grid columns", 1, 32, 4]], v => [0, "0", `No weights: a ${v.h} × ${v.w} grid becomes a list of ${v.h * v.w}.`],
      "4 × 4 grid → list of 16\n[[a b c d] [e f g h] …] → [a b c d e f g h …]"],
  ];
  let sel = 0; const host = $("#ltPicks");
  L.forEach((l, i) => { const b = document.createElement("button"); b.className = "pick"; b.type = "button"; b.setAttribute("aria-pressed", i === 0); b.innerHTML = "<b></b>"; b.querySelector("b").textContent = l[0];
    b.addEventListener("click", () => { sel = i; press($$(".pick", host), b); build(); }); host.appendChild(b); });
  function build() {
    const [n, C, , ex] = L[sel]; $("#ltTitle").textContent = n + " layer";
    $("#ltCtl").innerHTML = C.map(([k, lbl, mn, mx, v, st]) => `<div class="ctl"><label for="lt_${k}">${lbl}</label><input id="lt_${k}" type="range" min="${mn}" max="${mx}" step="${st || 1}" value="${v}"><output></output></div>`).join("");
    C.forEach(([k]) => slider("lt_" + k, v => v, () => calc())); calc();
    $("#ltEx").textContent = ex;
  }
  function calc() {
    const [, C, f] = L[sel], v = {}; C.forEach(([k]) => v[k] = +$("#lt_" + k).value);
    const [p, form, note] = f(v);
    $("#ltFormula").textContent = "parameters = " + form; $("#ltRead").innerHTML = `<div><span>Trainable parameters</span><b class="c-arch">${fmtN(p)}</b></div>`; $("#ltNote").textContent = note;
  }
  build();
});

/* composite layers: one LSTM or GRU unit, gate by gate */
demo("l-composite", () => {
  let kind = "lstm"; chips($("#lcKind"), v => { kind = v; $("#lcCrow").style.display = v === "lstm" ? "" : "none"; render(); });
  const gx = slider("lcX", v => fmt(v, 1), () => render()), gh = slider("lcH", v => fmt(v, 1), () => render()), gc = slider("lcC", v => fmt(v, 1), () => render());
  // hand-set weights for one unit: input rain x, previous output h
  const lstm = (x, h, c) => { const f = sigm(-0.5 * x + 0.5 * h + 2), i = sigm(1.5 * x + 0.2 * h - 1), g = Math.tanh(1.2 * x + 0.3 * h), o = sigm(0.5 * x + 0.8 * h + 0.5);
    const c2 = f * c + i * g; return { f, i, g, o, c: c2, h: o * Math.tanh(c2) }; };
  const gru = (x, h) => { const z = sigm(1.2 * x + 0.3 * h - 1.5), r = sigm(0.5 * x + 0.5 * h), n = Math.tanh(1.2 * x + 0.8 * r * h); return { z, r, n, h: (1 - z) * h + z * n }; };
  const rain = DS.daily.rain.slice(90, 130).map(v => v / 20);
  function render() {
    const x = gx(), h = gh(), c = gc(), L = kind === "lstm", s = L ? lstm(x, h, c) : gru(x, h);
    const W = 520, H = 210, svg = svgIn($("#lcFig"), W, H), yTop = 40, yG = 125, yIn = 192;
    arrowDefs(svg, "lc", css("--muted"));
    const gate = (cx, name, v, sig, col) => {
      el("rect", { x: cx - 38, y: yG - 24, width: 76, height: 48, rx: 8, fill: css("--card"), stroke: css(col) }, svg);
      const t = sig ? v : (v + 1) / 2; el("rect", { x: cx - 38, y: yG + 24 - 48 * t, width: 76, height: 48 * t, rx: 8, fill: `color-mix(in srgb, var(${col}) 28%, transparent)` }, svg);
      el("text", { x: cx, y: yG - 4, "text-anchor": "middle", "font-size": 12 }, svg, name);
      el("text", { x: cx, y: yG + 14, "text-anchor": "middle", class: "mono", "font-size": 13 }, svg, fmt(v, 2));
      el("line", { x1: cx, y1: yIn - 12, x2: cx, y2: yG + 25, stroke: css("--line") }, svg);
    };
    const node = (cx, sym, v) => { el("circle", { cx, cy: yTop, r: 14, fill: css("--card"), stroke: css("--arch") }, svg); el("text", { x: cx, y: yTop + 5, "text-anchor": "middle", "font-size": 15 }, svg, sym); };
    el("line", { x1: 20, y1: yIn - 12, x2: W - 90, y2: yIn - 12, stroke: css("--line") }, svg);
    el("text", { x: 20, y: yIn + 8, "font-size": 12, class: "mut" }, svg, `inputs: xₜ = ${fmt(x, 1)}, hₜ₋₁ = ${fmt(h, 1)}`);
    if (L) {
      el("text", { x: 14, y: yTop - 20, "font-size": 11.5, class: "mut" }, svg, "cell state (long memory)");
      el("text", { x: 14, y: yTop + 5, class: "mono", "font-size": 12 }, svg, fmt(c, 2));
      el("line", { x1: 50, y1: yTop, x2: 116, y2: yTop, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#lc)" }, svg);
      node(130, "×"); el("line", { x1: 144, y1: yTop, x2: 266, y2: yTop, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#lc)" }, svg);
      node(280, "+"); el("line", { x1: 294, y1: yTop, x2: 420, y2: yTop, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#lc)" }, svg);
      el("text", { x: 426, y: yTop + 5, class: "mono", "font-size": 12, fill: css("--arch") }, svg, "cₜ " + fmt(s.c, 2));
      gate(130, "forget f", s.f, true, "--sw"); gate(225, "input i", s.i, true, "--cool"); gate(320, "candidate g", s.g, false, "--arch"); gate(420, "output o", s.o, true, "--ok");
      el("line", { x1: 130, y1: yG - 25, x2: 130, y2: yTop + 15, stroke: css("--sw"), "marker-end": "url(#lc)" }, svg);
      el("path", { d: `M225 ${yG - 25} L225 80 L280 80 L280 ${yTop + 16}`, fill: "none", stroke: css("--cool"), "marker-end": "url(#lc)" }, svg);
      el("path", { d: `M320 ${yG - 25} L320 80 L280 80`, fill: "none", stroke: css("--arch") }, svg);
      el("text", { x: 470, y: yG + 4, "font-size": 12, class: "mono", fill: css("--ok") }, svg, "hₜ " + fmt(s.h, 2));
      $("#lcCalc").innerHTML = `cₜ = <span class="k">f</span>·cₜ₋₁ + <span class="k">i</span>·g = ${fmt(s.f, 2)}·${fmt(c, 1)} + ${fmt(s.i, 2)}·${fmt(s.g, 2)} = <b>${fmt(s.c, 2)}</b><br>hₜ = <span class="k">o</span>·tanh(cₜ) = ${fmt(s.o, 2)}·${fmt(Math.tanh(s.c), 2)} = <span class="g">${fmt(s.h, 2)}</span>`;
    } else {
      el("text", { x: 14, y: yTop - 20, "font-size": 11.5, class: "mut" }, svg, "hidden state (the only memory)");
      el("text", { x: 14, y: yTop + 5, class: "mono", "font-size": 12 }, svg, fmt(h, 2));
      el("line", { x1: 50, y1: yTop, x2: 146, y2: yTop, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#lc)" }, svg);
      node(160, "×"); el("text", { x: 160, y: yTop - 20, "text-anchor": "middle", class: "mono", "font-size": 11 }, svg, "1 − z");
      el("line", { x1: 174, y1: yTop, x2: 296, y2: yTop, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#lc)" }, svg);
      node(310, "+"); el("line", { x1: 324, y1: yTop, x2: 420, y2: yTop, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#lc)" }, svg);
      el("text", { x: 426, y: yTop + 5, class: "mono", "font-size": 12, fill: css("--ok") }, svg, "hₜ " + fmt(s.h, 2));
      gate(160, "update z", s.z, true, "--sw"); gate(250, "reset r", s.r, true, "--cool"); gate(350, "candidate n", s.n, false, "--arch");
      el("line", { x1: 160, y1: yG - 25, x2: 160, y2: yTop + 15, stroke: css("--sw"), "marker-end": "url(#lc)" }, svg);
      el("path", { d: `M350 ${yG - 25} L350 80 L310 80 L310 ${yTop + 16}`, fill: "none", stroke: css("--arch"), "marker-end": "url(#lc)" }, svg);
      el("path", { d: `M250 ${yG - 25} L250 ${yG - 40} L318 ${yG - 40}`, fill: "none", stroke: css("--cool"), "marker-end": "url(#lc)" }, svg);
      $("#lcCalc").innerHTML = `hₜ = (1 − <span class="k">z</span>)·hₜ₋₁ + <span class="k">z</span>·n = ${fmt(1 - s.z, 2)}·${fmt(h, 1)} + ${fmt(s.z, 2)}·${fmt(s.n, 2)} = <span class="g">${fmt(s.h, 2)}</span><br><span class="m">r decides how much of hₜ₋₁ the candidate n may look at.</span>`;
    }
    /* run the same unit over 40 days of rain */
    const hs = [], cs = []; let hh = 0, cc = 0;
    rain.forEach(v => { const r = L ? lstm(v, hh, cc) : gru(v, hh); hh = r.h; if (L) cc = r.c; hs.push(hh); cs.push(cc); });
    const W2 = 520, H2 = 150, s2 = svgIn($("#lcSeq"), W2, H2);
    const A = axes(s2, { W: W2, H: H2, x0: 0, x1: rain.length - 1, y0: 0, y1: Math.max(2, ...cs, ...rain), xt: [0, 10, 20, 30, 39], yt: [0, 1, 2], xl: "day", xf: v => v + 1 });
    rain.forEach((v, i) => el("rect", { x: A.x(i) - 4, y: A.y(v), width: 8, height: A.y(0) - A.y(v), fill: css("--cool"), opacity: .35 }, s2));
    el("path", { d: path(hs.map((v, i) => [A.x(i), A.y(Math.max(0, v))])), fill: "none", stroke: css("--ok"), "stroke-width": 2 }, s2);
    if (L) el("path", { d: path(cs.map((v, i) => [A.x(i), A.y(Math.max(0, v))])), fill: "none", stroke: css("--arch"), "stroke-width": 2.4 }, s2);
    $("#lcRead").innerHTML = `<div><span>Parameters, 32 units, 1 input</span><b class="c-arch">${L ? "4 × 1,088 = 4,352" : "3 × 1,088 = 3,264"}</b></div>`
      + `<p class="note" style="flex-basis:100%;margin:0">Bars: rain (mm/20). Green: output h${L ? "; violet: cell state c, which keeps the wet spell longer" : ""}. Libraries may add a few extra biases (Keras GRU: 3,360).</p>`;
  }
  render(); return render;
});

/* why activations matter */
demo("l-whyact", () => {
  const X = Array.from({ length: 101 }, (_, i) => i), T = X.map(v => 60 / (1 + Math.exp(-(v - 55) / 7)));
  const gm = chips($("#waMode"), () => render()), gn = slider("waN", v => v, () => render());
  $("#waCollapse").innerHTML = `W₁ = [[1, 2], [0, 1]], W₂ = [[3, 1]]<br>W₂(W₁x) = [[3, 7]]·x <span class="m">← one layer would do</span>`;
  function render() {
    const n = gn(), lin_ = gm() === "linear", knots = Array.from({ length: n }, (_, i) => 100 * (i + 0.5) / n);
    const feat = v => lin_ ? [1, v] : [1, v, ...knots.map(k => relu(v - k))];
    const F = X.map(feat), p = F[0].length, A = Array.from({ length: p }, () => new Array(p).fill(0)), bb = new Array(p).fill(0);
    F.forEach((f, r) => { for (let i = 0; i < p; i++) { bb[i] += f[i] * T[r]; for (let j = 0; j < p; j++) A[i][j] += f[i] * f[j]; } });
    for (let i = 0; i < p; i++) A[i][i] += 1e-6;
    const w = solve(A, bb), P = F.map(f => f.reduce((s, v, i) => s + v * w[i], 0));
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

/* width and depth */
demo("l-width", () => {
  const g = ["wdIn", "wdW", "wdD"].map(id => slider(id, v => v, () => render()));
  $("#wdHier").innerHTML = [["Layer 1", "Edges, short rain bursts"], ["Layer 2", "Corners, textures, a wet week"], ["Layer 3", "Objects, storm systems, a wet season"]].map(([a, b]) => `<div class="card"><h4 style="color:var(--arch)">${a}</h4><p>${b}</p></div>`).join("");
  function render() {
    const [n, w, d] = g.map(f => f()), p = n * w + w + (d - 1) * (w * w + w) + w + 1, W = 520, H = 200, svg = svgIn($("#wdFig"), W, H);
    const cols = [n, ...Array(d).fill(w), 1], xs = cols.map((_, i) => 30 + i * (W - 60) / (cols.length - 1));
    cols.forEach((m, i) => { const shown = Math.min(m, 9), ys = Array.from({ length: shown }, (_, k) => 100 + (k - (shown - 1) / 2) * 18);
      if (i < cols.length - 1) { const nshow = Math.min(cols[i + 1], 9), ys2 = Array.from({ length: nshow }, (_, k) => 100 + (k - (nshow - 1) / 2) * 18);
        ys.forEach(a => ys2.forEach(b => el("line", { x1: xs[i], y1: a, x2: xs[i + 1], y2: b, stroke: css("--line"), "stroke-width": .6 }, svg))); }
      ys.forEach(y => el("circle", { cx: xs[i], cy: y, r: 6, fill: css(i === 0 ? "--data" : i === cols.length - 1 ? "--ok" : "--arch") }, svg));
      if (m > 9) el("text", { x: xs[i], y: 192, "text-anchor": "middle", "font-size": 10.5, class: "mut mono" }, svg, m);
    });
    $("#wdRead").innerHTML = `<div><span>Parameters</span><b class="c-arch">${fmtN(p)}</b></div><div><span>Of which hidden → hidden</span><b>${fmtN((d - 1) * (w * w + w))}</b></div>`;
  }
  render(); return render;
});

/* shapes and parameter tracker */
demo("l-shapes", () => {
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

/* trainable quiz */
demo("l-trainable", () => {
  bindQuiz("#trQuiz", "#trScore", [["Dense layer", "Yes", "Its weights and biases are learned."], ["Convolutional layer", "Yes", "Filter weights and biases."], ["Max pooling", "No", "It only picks the maximum."],
    ["Flatten", "No", "It only rearranges numbers."], ["Dropout", "No", "Random switching, no weights."], ["LSTM layer", "Yes", "Four gates of weights."], ["Multi-head attention", "Yes", "Query, key, value and output projections."],
    ["Embedding layer", "Yes", "The table rows are weights."], ["Batch norm", "Yes", "A learned scale γ and shift β (plus running statistics that are not trained)."], ["ReLU activation", "No", "A fixed function, max(0, x)."]], ["Yes", "No"]);
});

/* running examples: the series' three datasets as stacks of layers */
demo("l-examples", () => {
  const X = {
    rain: { name: "Next-day rain from the last 30 days", rows: [
      ["Input", "30 days × 2", 0, "Each day: rain (mm) and maximum temperature (°C), scaled with training statistics."],
      ["LSTM, 32 units", "32", 4 * (32 * (32 + 2) + 32), "Reads the 30 days in order; its cell state carries wet spells forward. 4 × (32 × (32 + 2) + 32) weights, reused every day."],
      ["Dense 1, ReLU", "1", 33, "Tomorrow's rain in mm; ReLU keeps it at zero or above. 32 + 1 weights."]] },
    field: { name: "Season class from three climate maps", rows: [
      ["Input", "18 × 14 × 3", 0, "Temperature, precipitation and elevation on the Colombia grid; ocean cells set to 0 after scaling."],
      ["Conv 16, 3 × 3, ReLU", "18 × 14 × 16", 3 * 3 * 3 * 16 + 16, "Each filter looks at 3 × 3 cells across all 3 maps: 3·3·3·16 + 16 = 448, whatever the grid size."],
      ["Max pool 2 × 2", "9 × 7 × 16", 0, "Halves the grid; keeps the strongest response in each block. No weights."],
      ["Conv 32, 3 × 3, ReLU", "9 × 7 × 32", 3 * 3 * 16 * 32 + 32, "Combines the 16 first-level patterns into 32 larger ones: 3·3·16·32 + 32 = 4,640."],
      ["Global average pool", "32", 0, "One number per filter: its average over the map. No weights, and no huge flatten."],
      ["Dense 3, softmax", "3", 32 * 3 + 3, "Dry, normal or wet season probabilities. 32 × 3 + 3 = 99."]] },
    stud: { name: "Attrition risk from the student table", rows: [
      ["Input", "3 numbers + 1 ID", 0, "Absences, grade and estrato (scaled), plus the municipality as an ID number."],
      ["Embedding 125 × 4", "4", 500, "The municipality ID picks one of 125 learnable rows of 4 numbers: 500 weights."],
      ["Concatenate", "7", 0, "Puts the 3 numbers and the 4 embedding values side by side."],
      ["Dense 16, ReLU", "16", 7 * 16 + 16, "7 × 16 + 16 = 128 weights."],
      ["Dropout 0.3", "16", 0, "In training, about 5 of the 16 neurons are switched off each step. No weights."],
      ["Dense 1, sigmoid", "1", 17, "The probability that the student leaves. 16 + 1 = 17."]] },
  };
  let ds = "rain", sel = 1;
  chips($("#leData"), v => { ds = v; sel = 1; render(); });
  function render() {
    const D = X[ds], tot = D.rows.reduce((s, r) => s + r[2], 0);
    $("#leTable").innerHTML = `<table class="tb"><thead><tr><th>Layer</th><th>Output shape</th><th style="text-align:right">Parameters</th></tr></thead><tbody>${D.rows.map((r, i) => `<tr data-i="${i}" style="cursor:pointer${i === sel ? ";background:var(--arch-soft)" : ""}"><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="n" style="color:var(${r[2] ? "--arch" : "--muted"})">${fmtN(r[2])}</td></tr>`).join("")}</tbody></table>`;
    $$("#leTable tr[data-i]").forEach(tr => tr.addEventListener("click", () => { sel = +tr.dataset.i; render(); }));
    $("#leRead").innerHTML = `<div><span>Total parameters</span><b class="c-arch">${fmtN(tot)}</b></div><div><span>Task</span><b style="font-size:15px">${D.name}</b></div>`;
    $("#leTitle").textContent = D.rows[sel][0]; $("#leText").textContent = D.rows[sel][3];
    const host = $("#leFig");
    if (ds === "rain") {
      const W = 460, H = 130, svg = svgIn(host, W, H), r = DS.daily.rain.slice(100, 130), A = axes(svg, { W, H, x0: 0, x1: 29, y0: 0, y1: Math.max(...r), xt: [0, 29], xf: v => "day " + (v + 1), yt: [0], yl: "rain (mm), the 30 input days" });
      r.forEach((v, i) => el("rect", { x: A.x(i) - 5, y: A.y(v), width: 10, height: A.y(0) - A.y(v), fill: css("--cool"), opacity: .7 }, svg));
    } else if (ds === "field") {
      host.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap"><div style="width:120px"></div><div style="width:120px"></div><div style="width:120px"></div></div>`;
      const [a, b, c] = host.firstChild.children, lo = v => v;
      fieldSVG(a, DS.temp, { cell: 8, color: v => div(v - 20, 9) }); fieldSVG(b, DS.precip, { cell: 8, color: v => heat(v, 500, 7000) }); fieldSVG(c, DS.elev.map((row, i) => row.map((v, j) => DS.mask[i][j] ? v : null)), { cell: 8, color: v => heat(v, 0, 3000) });
    } else {
      host.innerHTML = `<table class="tb"><thead><tr><th>id</th><th>absences</th><th>grade</th><th>estrato</th><th>municipality</th></tr></thead><tbody>${DS.students.slice(0, 5).map(s => `<tr><td class="n">${s.id}</td><td class="n">${s.absences}</td><td class="n">${fmt(s.grade, 1)}</td><td class="n">${s.estrato}</td><td>${s.municipality}</td></tr>`).join("")}</tbody></table>`;
    }
  }
  render(); return render;
});

/* preview of blocks and families */
demo("l-preview", () => {
  const F = [
    ["MLP", ["Dense", "Dense", "Dense"], "Dense layers stacked. Works on tables of features.", ["Climate: rainfall from station predictors", "Health: risk from a set of lab values", "Education: attrition risk from student variables"]],
    ["CNN", ["Conv", "Pool", "Conv", "Pool", "Dense"], "Convolution and pooling, then dense layers. Works on grids.", ["Climate: tropical cyclones in satellite images", "Health: reading X-rays", "Education: reading handwritten exams"]],
    ["RNN / LSTM", ["LSTM", "LSTM", "Dense"], "Recurrent layers over a sequence, then a dense output.", ["Climate: daily streamflow from rainfall", "Health: vital signs over hours", "Education: semester-by-semester grades"]],
    ["Transformer", ["Embed", "Attn+MLP", "Attn+MLP", "Head"], "Embeddings, then transformer blocks (attention + a small MLP, each with a residual connection and normalization).", ["Climate: data-driven global weather models", "Health: clinical notes", "Education: language tutors"]],
    ["Graph network", ["Graph", "Graph", "Dense"], "Message passing over a given graph.", ["Climate: river networks, weather on a mesh", "Health: molecules", "Education: student–course networks"]],
    ["U-Net", ["Enc", "Enc", "Bottleneck", "Dec", "Dec"], "Encoder–decoder with skip connections; outputs a map the size of the input.", ["Climate: downscaling and nowcasting maps", "Health: segmenting tumours", "Education: segmenting scanned forms"]],
    ["Autoencoder", ["Enc", "Code", "Dec"], "Squeezes the input through a small code and rebuilds it.", ["Climate: compressing climate fields", "Health: flagging unusual records", "Education: anomalous enrollment records"]],
  ];
  let sel = 0; const host = $("#fmPicks");
  F.forEach((f, i) => { const b = document.createElement("button"); b.className = "pick"; b.type = "button"; b.setAttribute("aria-pressed", i === 0); b.innerHTML = `<b></b>`; b.querySelector("b").textContent = f[0];
    b.addEventListener("click", () => { sel = i; press($$(".pick", host), b); render(); }); host.appendChild(b); });
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
