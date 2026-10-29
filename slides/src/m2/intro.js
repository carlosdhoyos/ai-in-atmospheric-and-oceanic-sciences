/* ═════════ MODULE 2 · intro: list, datasets, inductive bias, geometric view ═════════ */
const OPS2 = [
  ["Foundations", [["01", "Weighted sum (the neuron)", "op-wsum"], ["02", "Element-wise operations", "op-elem"], ["03", "Activation functions", "op-act"], ["03", "Softmax", "op-softmax"]]],
  ["Connecting values", [["04", "Dense (fully connected)", "op-dense"], ["05", "Convolution in 1D", "op-conv1d"], ["05", "Convolution in 2D", "op-conv2d"], ["05", "Learned vs fixed filters", "op-conv-learned"], ["05", "Channels: how filters combine", "op-channels"],
    ["06", "Dilated convolution", "op-dilated"], ["07", "Transposed convolution", "op-tconv"], ["08", "Depthwise separable conv.", "op-sep"], ["08b", "1×1 convolution", "op-1x1"],
    ["09", "Recurrence (simple RNN)", "op-rnn"], ["10", "Gated recurrence (LSTM, GRU)", "op-lstm"], ["10", "Inside the LSTM cell", "op-lstm-steps"], ["11", "Self-attention", "op-self"], ["11", "Self-attention step by step", "op-self-steps"], ["11b", "Multi-head attention", "op-mha"], ["11b", "Multi-head attention step by step", "op-mha-steps"],
    ["11c", "Causal masking", "op-causal"], ["12", "Cross-attention", "op-cross"], ["13", "Graph message passing", "op-graph"]]],
  ["Summarizing and resizing", [["14", "Pooling", "op-pool"], ["15", "Upsampling and downsampling", "op-resample"], ["16", "Flatten and reshape", "op-flatten"]]],
  ["Representing inputs", [["17", "Embedding lookup", "op-embed"], ["18", "Positional encoding", "op-pos"]]],
  ["Stabilizing", [["19", "Batch normalization", "op-bn"], ["20", "Layer normalization", "op-ln"]]],
  ["Wiring", [["21", "Residual connections", "op-res"], ["22", "Concatenation", "op-concat"], ["23", "Gating", "op-gate"]]],
  ["Training only", [["24", "Dropout", "op-dropout"]]],
  ["Modern extras", [["25", "Mixture of experts", "op-moe"], ["26", "State space models", "op-ssm"], ["27", "Fourier neural operators", "op-fno"]]],
];
(function () {
  const exists = id => !!document.getElementById(id);
  const cover = $("#inCover");
  if (cover) cover.innerHTML = OPS2.map(([g, ops]) => `<button class="c-arch" data-go="${ops[0][2]}"><div class="n">${ops[0][0]}–${ops[ops.length - 1][0]}</div><div class="t">${g}</div><div class="d">${[...new Set(ops.map(o => o[1]))].join(", ")}.</div></button>`).join("");
  const list = $("#inList");
  if (list) list.innerHTML = OPS2.map(([g, ops]) => `<div class="card" style="padding:12px 14px"><h4 style="font-size:14px;color:var(--arch);margin-bottom:6px">${g}</h4>${ops.map(([n, t, id]) =>
    `<button class="pick" data-go="${id}" type="button" style="padding:4px 8px;border-left-width:1px;margin:3px 0;font-size:13px${exists(id) ? "" : ";opacity:.5"}"><span><span class="opnum">${n}</span>${t}</span></button>`).join("")}</div>`).join("");
})();

/* the running datasets */
demo("op-data", () => {
  const gf = chips($("#inFieldPick"), () => field());
  const notes = { temp: "Annual mean temperature: 28 °C on the coasts, cooling 6.5 °C per km of elevation in the Andes.", precip: "Annual precipitation: very wet Pacific coast, dry Guajira peninsula in the north, wet Amazon in the south-east.", elev: "Three cordilleras running south-west to north-east." };
  function daily() {
    const W = 520, H = 150, svg = svgIn($("#inDaily"), W, H), R = DS.daily.rain, T = DS.daily.tmax;
    const { x, y } = axes(svg, { W, H, m: { l: 34, r: 34, t: 10, b: 22 }, x0: 0, x1: 364, y0: 0, y1: 60, xt: [0, 90, 181, 273, 364], xf: v => ["Jan", "Apr", "Jul", "Oct", "Dec"][[0, 90, 181, 273, 364].indexOf(v)], yt: [0, 30, 60], yl: "rain mm/day" });
    R.forEach((v, i) => v > 0 && el("rect", { x: x(i) - .6, y: y(Math.min(v, 60)), width: 1.6, height: y(0) - y(Math.min(v, 60)), fill: css("--cool") }, svg));
    const yt = lin(18, 32, H - 22, 10);
    el("path", { d: path(T.map((v, i) => [x(i), yt(v)])), fill: "none", stroke: css("--lw"), "stroke-width": 1, opacity: .8 }, svg);
    el("text", { x: W - 2, y: 18, "text-anchor": "end", "font-size": 11, fill: css("--lw") }, svg, "tmax °C");
  }
  function monthly() {
    const W = 520, H = 140, svg = svgIn($("#inMonthly"), W, H), R = DS.monthly.rain, Q = DS.monthly.streamflow;
    const { x, y } = axes(svg, { W, H, m: { l: 34, r: 34, t: 10, b: 22 }, x0: -0.5, x1: 59.5, y0: 0, y1: 450, xt: [0, 12, 24, 36, 48], xf: v => "year " + (v / 12 + 1), yt: [0, 200, 400], yl: "rain mm/month" });
    el("rect", { x: x(23.5), y: 10, width: x(35.5) - x(23.5), height: H - 32, fill: css("--sw-soft") }, svg);
    R.forEach((v, i) => el("rect", { x: x(i) - 3, y: y(v), width: 6, height: y(0) - y(v), fill: css("--cool"), opacity: .7 }, svg));
    const yq = lin(0, Math.max(...Q) * 1.1, H - 22, 10);
    el("path", { d: path(Q.map((v, i) => [x(i), yq(v)])), fill: "none", stroke: css("--arch"), "stroke-width": 2 }, svg);
    el("text", { x: W - 2, y: 18, "text-anchor": "end", "font-size": 11, fill: css("--arch") }, svg, "streamflow");
  }
  function field() {
    const k = gf(), F = DS[k], vals = F.flat().filter(v => v != null), lo = Math.min(...vals), hi = Math.max(...vals);
    fieldSVG($("#inField"), F, { cell: 13, color: v => k === "temp" ? `color-mix(in srgb, ${css("--lw")} ${Math.round(100 * (v - lo) / (hi - lo))}%, ${css("--cool")})` : heat(v, lo, hi) });
    $("#inFieldNote").textContent = notes[k] + ` Range ${fmtN(lo)}–${fmtN(hi)} ${k === "temp" ? "°C" : k === "precip" ? "mm/yr" : "m"}.`;
  }
  function students() {
    $("#inStudents").innerHTML = `<table class="tb"><thead><tr><th>#</th><th>Absences</th><th>Grade</th><th>Estrato</th><th>Municipality</th><th>Left?</th></tr></thead><tbody>${DS.students.slice(0, 6).map(s =>
      `<tr><td class="n">${s.id}</td><td class="n">${s.absences}</td><td class="n">${fmt(s.grade, 1)}</td><td class="n">${s.estrato}</td><td>${s.municipality}</td><td>${s.attrition ? "yes" : "no"}</td></tr>`).join("")}</tbody></table><p class="note" style="margin:6px 0 0">First 6 of 20 students.</p>`;
  }
  const render = () => { daily(); monthly(); field(); students(); };
  render(); return render;
});

demo("op-bias", () => {
  const vals = [3, 0, 12, 1, 10, 0, 2], days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], gE = [[0, 3], [1, 2], [2, 5], [3, 4], [4, 6], [0, 6], [1, 5]];
  let op = "dense", tgt = 4; const bs = $$("#inBiasPicks .pick");
  bs.forEach(b => b.addEventListener("click", () => { op = b.dataset.v; press(bs, b); render(); }));
  function render() {
    const W = 520, H = 250, svg = svgIn($("#inBiasFig"), W, H), x = i => 50 + i * 70, yIn = 205, yOut = 40, yH = 125;
    arrowDefs(svg, "ib", css("--arch"));
    { const mk = svg.querySelector("marker"); mk.setAttribute("markerUnits", "userSpaceOnUse"); mk.setAttribute("markerWidth", 9); mk.setAttribute("markerHeight", 9); } // same arrowhead size on thick lines
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
    $("#inBiasRead").innerHTML = `<div><span>Weights involved</span><b class="c-arch" style="font-size:18px">${nw}</b></div><p class="note" style="flex-basis:100%;margin:0">${note}</p>`;
  }
  render(); return render;
});


/* dense versus attention: stored weights per slot vs weights computed from this week's content */
demo("op-dvsa", () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], WEEKS = [[3, 0, 12, 1, 10, 0, 2], [14, 1, 0, 0, 11, 2, 0], [0, 1, 0, 2, 1, 0, 1]];
  // the dense layer's trained weights: one fixed number per (output day, input day), mostly local, some negative
  const r = rng(5), Wd = days.map((_, t) => days.map((_, i) => +(0.45 * Math.exp(-Math.abs(t - i) / 1.6) + 0.12 * gauss(r)).toFixed(2)));
  let week = 0, vals = WEEKS[0].slice(), tgt = 4, shuffled = false;
  chips($("#dvWeek"), v => { week = +v; vals = WEEKS[week].slice(); shuffled = false; render(); });
  $("#dvShuffle").addEventListener("click", () => {
    const idx = vals.map((_, i) => i).filter(i => i !== tgt), pool = idx.map(i => vals[i]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    idx.forEach((i, k) => vals[i] = pool[k]); shuffled = true; render();
  });
  function draw(host, ws, kind) {
    const W = 420, H = 168, svg = svgIn(host, W, H), x = i => 30 + i * 60, yIn = 130, yOut = 24;
    arrowDefs(svg, "dv" + kind, css("--arch"));
    { const mk = svg.querySelector("marker"); mk.setAttribute("markerUnits", "userSpaceOnUse"); mk.setAttribute("markerWidth", 8); mk.setAttribute("markerHeight", 8); }
    const mx = Math.max(...ws.map(Math.abs)) || 1;
    ws.forEach((w, i) => {
      const t = Math.abs(w) / mx;
      el("line", { x1: x(i), y1: yIn - 16, x2: x(tgt), y2: yOut + 15, stroke: css(kind === "d" ? (w >= 0 ? "--pos" : "--neg") : "--arch"), "stroke-width": 0.6 + 6 * t, opacity: .35 + .65 * t, "marker-end": `url(#dv${kind})` }, svg);
      const lx = x(i) + (x(tgt) - x(i)) * 0.25, ly = yIn - 16 - (yIn - yOut - 31) * 0.25;
      el("text", { x: lx + (i < tgt ? -4 : i > tgt ? 4 : 8), y: ly, "text-anchor": i < tgt ? "end" : "start", class: "mono", "font-size": 11, fill: css(kind === "d" ? "--muted" : "--arch") }, svg, kind === "d" ? fmt(w, 2) : fmtN(100 * w) + "%");
    });
    vals.forEach((v, i) => {
      el("circle", { cx: x(i), cy: yIn, r: 16, fill: css(v >= 8 ? "--cool-soft" : "--card"), stroke: css(v >= 8 ? "--cool" : "--line") }, svg);
      el("text", { x: x(i), y: yIn + 4, "text-anchor": "middle", class: "mono", "font-size": 12 }, svg, v);
      el("text", { x: x(i), y: yIn + 32, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, days[i]);
      const g = el("g", { style: "cursor:pointer" }, svg);
      el("circle", { cx: x(i), cy: yOut, r: 14, fill: i === tgt ? css("--arch") : css("--card"), stroke: css(i === tgt ? "--arch" : "--line") }, g);
      el("text", { x: x(i), y: yOut + 4, "text-anchor": "middle", "font-size": 10.5, fill: i === tgt ? css("--bg") : css("--muted") }, g, "out");
      g.addEventListener("click", () => { tgt = i; render(); });
    });
  }
  function render() {
    const wd = Wd[tgt], att = softmax(vals.map(v => -Math.abs(v - vals[tgt]) / 2)), D = days[tgt];
    draw($("#dvDenseFig"), wd, "d"); draw($("#dvAttnFig"), att, "a");
    const od = wd.reduce((s, w, i) => s + w * vals[i], 0), oa = att.reduce((s, w, i) => s + w * vals[i], 0);
    const top = att.map((w, i) => [w, i]).filter(([, i]) => i !== tgt).sort((a, b) => b[0] - a[0])[0];
    $("#dvDenseCalc").innerHTML = `out(${D}) = Σ W[${D}, day] × rain = <span class="g">${fmt(od, 2)}</span><span class="m"> · the same ${wd.length} weights every week</span>`;
    $("#dvAttnCalc").innerHTML = `weights = softmax(similarity to ${D}'s ${vals[tgt]} mm) → most to ${days[top[1]]} (${fmtN(100 * top[0])}%)<br>out(${D}) = weighted average = <span class="g">${fmt(oa, 2)}</span> mm`;
    $("#dvNote").textContent = shuffled
      ? `Shuffled: the dense weights stayed with the slots, so its output changed (${fmt(od, 2)}). Attention's weights moved with the rain amounts, so its output is the same as before the shuffle: it does not know the order of the days.`
      : week === 2
        ? "A dry week: dense still uses exactly the same weights. Attention spreads its weight over all the similar dry days."
        : `Compare weeks: the dense lines (left) never change. The attention lines (right) jump to whichever day looks like ${D} this week.`;
  }
  render(); return render;
});

demo("op-geo", () => {
  const G = [["Grid", "Images, gridded climate fields, radar mosaics.", "Translation: a storm is a storm wherever it is on the map.", "Convolution (CNN, U-Net)"],
    ["Sequence", "Daily streamflow, text, hourly load.", "Order matters, and patterns repeat in time.", "Recurrence or attention (LSTM, transformer)"],
    ["Graph", "Station networks, river networks, roads, molecules.", "Relabelling the nodes must not change the answer; only the links matter.", "Message passing (graph networks)"],
    ["Set", "The students in a class, the sensors on a drone, a bag of words.", "Order does not matter at all.", "Operations that ignore order: sum or mean pooling, attention without positions"]];
  let sel = 0; const host = $("#inGeoCards");
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
  function text() { $("#inGeoText").innerHTML = `<div class="two even" style="gap:18px"><div><h3>Symmetry to respect</h3><p style="margin:0"></p></div><div><h3>Operation that fits</h3><p style="margin:0;font-weight:600;color:var(--arch)"></p></div></div>`;
    const ps = $$("#inGeoText p"); ps[0].textContent = G[sel][2]; ps[1].textContent = G[sel][3]; }
  render(); return render;
});



/* glossary: one line of what each operation is and one of what it is for; rows open the operation's slide */
(function () {
  const G = {
    "op-wsum": ["Multiply each input by a weight, add them up, add a bias: z = w·x + b", "Combine several inputs into one number, each weighted by its importance"],
    "op-elem": ["The same arithmetic on each value separately (add, multiply, mask), with broadcasting", "Adjust, scale, mask or combine arrays of the same shape"],
    "op-act": ["A simple nonlinear function on each value: ReLU, sigmoid, tanh, GELU", "Add bends, so stacked layers model curves instead of one straight line"],
    "op-softmax": ["Turns a list of scores into positive values that sum to 1", "Probabilities over classes, or attention weights"],
    "op-dense": ["Every input connects to every output with its own weight: one matrix multiplication", "Learn any combination of the inputs, with no assumption about structure"],
    "op-conv1d": ["A small filter of shared weights slides along a series", "Detect local patterns (bursts, ramps) anywhere in time, with few weights"],
    "op-conv2d": ["A small filter of shared weights slides across a grid", "Detect local patterns (edges, fronts) anywhere on a map"],
    "op-conv-learned": ["Filter values learned by training, or set by hand (Sobel, finite differences)", "Learn the useful patterns, or build in known physics"],
    "op-channels": ["Each filter makes one map; the maps stack into channels; the next layer reads them all", "Describe each location with many features and combine them layer by layer"],
    "op-dilated": ["A filter with gaps between its taps", "See far back or far away without more weights or layers"],
    "op-tconv": ["A learned “reverse” convolution that spreads each value over a larger output", "Learned upsampling, for example coarse to fine maps"],
    "op-sep": ["Filter each channel on its own, then mix channels with a 1 × 1 convolution", "The job of a normal convolution with far fewer weights"],
    "op-1x1": ["A weighted sum across channels at each pixel, with no spatial neighbours", "Mix variables at each location, or change the number of channels"],
    "op-rnn": ["Read a sequence step by step, carrying a hidden state forward with the same weights", "Model order and short-term memory"],
    "op-lstm": ["Recurrence with learned gates that decide what to keep, add and release", "Remember over long spans (wet seasons, basin storage)"],
    "op-self": ["Each element scores every other, softmaxes the scores, takes a weighted average", "Let anything relate to anything, with weights computed from the content"],
    "op-mha": ["Several attention heads in parallel, each with its own projections, then combined", "Capture several kinds of relation at once"],
    "op-causal": ["Blocks attention to future positions", "No peeking at the future when forecasting or generating"],
    "op-cross": ["One set (queries) attends to another (keys and values)", "Fuse two sources, e.g. a station attending to a satellite field"],
    "op-graph": ["Each node updates from messages sent by its linked neighbours", "Learn on given networks: stations, rivers, meshes"],
    "op-pool": ["Replace each window by its maximum or average; no weights", "Shrink maps, keep the strongest signal, tolerate small shifts"],
    "op-resample": ["Change resolution by stride, pooling, interpolation or learned filters", "Move between coarse and fine grids (encoders, decoders, downscaling)"],
    "op-flatten": ["Rearrange the same numbers into a new shape", "Feed grid data to a dense layer; match the next operation's shape"],
    "op-embed": ["A category ID selects a row of learned numbers", "Turn categories (municipalities, words) into useful vectors"],
    "op-pos": ["Add a pattern that encodes each element's position", "Give attention a sense of order, which it lacks on its own"],
    "op-bn": ["Rescale each feature with the batch's mean and spread, then a learned scale and shift", "Keep values in a healthy range: faster, more stable training"],
    "op-ln": ["The same, but across the features of one example", "Stable training whatever the batch size (transformers, RNNs)"],
    "op-res": ["output = input + layer(input)", "The layer learns only a correction; very deep networks become trainable"],
    "op-concat": ["Place feature sets side by side", "Combine information from different sources or levels (U-Net skips)"],
    "op-gate": ["Multiply a signal by a learned value between 0 and 1", "Let the network decide how much of a signal passes, like a valve"],
    "op-dropout": ["Switch off a random fraction of values at each training step", "Reduce overfitting: no reliance on any single neuron"],
    "op-moe": ["A router sends each input to a few of many expert subnetworks", "Huge capacity while using only a small part per prediction"],
    "op-ssm": ["A linear recurrence (state updated by A, input by B, read by C), optionally input-dependent", "Long sequences at linear cost, cheaper than attention"],
    "op-fno": ["Transform the field to frequencies, weight a few modes, transform back, plus a local path", "Learn global, resolution-independent maps between physical fields"],
  };
  const table = groups => `<style>.gloss tr[data-go]{cursor:pointer}.gloss tr[data-go]:hover td{background:var(--arch-soft)}.gloss td{padding:3px 8px;vertical-align:top}</style>`
    + `<table class="tb gloss" style="font-size:12.8px;line-height:1.3"><thead><tr><th style="width:3em">#</th><th style="width:21%">Operation</th><th>What it is</th><th style="width:33%">What it is for</th></tr></thead><tbody>`
    + groups.map(([g, ops]) => `<tr><td colspan="4" style="padding-top:8px;font-family:var(--f-mono);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--arch)">${g}</td></tr>`
      + ops.filter(([, , id]) => G[id] && document.getElementById(id)).map(([n, t, id]) => `<tr data-go="${id}"><td class="mono" style="color:var(--muted)">${n}</td><td><b style="font-weight:600">${t}</b></td><td>${G[id][0]}</td><td style="color:var(--muted)">${G[id][1]}</td></tr>`).join("")).join("")
    + `</tbody></table>`;
  // three slides of about a dozen rows each: the "connecting values" group is split between dense/convolution and sequences/attention/graphs
  const conn = OPS2[1][1], cut = conn.findIndex(o => o[2] === "op-rnn");
  const parts = [[OPS2[0], ["Connecting values · dense and convolution", conn.slice(0, cut)]],
    [["Connecting values · sequences, attention, graphs", conn.slice(cut)], OPS2[2], OPS2[3]], OPS2.slice(4)];
  ["#inGloss1", "#inGloss2", "#inGloss3"].forEach((id, k) => { const h = $(id); if (h) h.innerHTML = table(parts[k]); });
})();
