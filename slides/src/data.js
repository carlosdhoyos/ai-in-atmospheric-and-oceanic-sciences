/* ═════════ PART 1 · DATA FOUNDATION demos ═════════ */
const erf = x => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
const corr = (a, b) => { const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db); };

/* pipeline overview */
demo("d-pipeline", () => {
  const S = [
    ["Acquire", "d-acq", "Measurement and acquisition", "Collect data from platforms and sensors, each with its own resolution and biases.", "Gauges, radar and satellite rainfall for the same basin."],
    ["QA/QC", "d-qc", "Quality control", "Detect errors, gaps, outliers and inconsistencies.", "A temperature sensor stuck at the same value for days; a student aged 150."],
    ["Types & encoding", "d-enc", "Data types and encoding", "Numerical or categorical, and how categories become numbers.", "One-hot for municipality, ordinal for estrato."],
    ["Transform", "d-trans", "Transformations", "Scale, normalize, standardize, log-transform; turn text and images into numbers.", "Rescale income and age; log-transform daily rainfall."],
    ["Missing data", "d-missing", "Missing data", "Ask why values are missing, then drop, impute, interpolate or flag.", "Gap-filling a rain gauge from neighbouring stations."],
    ["Split", "d-splits", "Data splits", "Training, validation and test sets; split by time for climate data.", "Train on 1981–2010, validate on 2011–2015, test on 2016–2020."],
    ["Leakage check", "d-leak", "Data leakage", "Remove anything the model would not know at prediction time.", "\"Account frozen\" in a fraud model is set after fraud is confirmed."],
    ["Reduce & select", "d-dimred", "Dimensionality reduction", "Compress many correlated inputs into a few informative ones.", "EOFs of sea surface temperature capture ENSO."],
    ["Balance & augment", "d-imb", "Imbalance and augmentation", "Handle rare events; create realistic new training examples.", "0.1% fraud; SMOTE for rare attrition cases."],
    ["Labels, bias, governance", "d-labels", "Labels, bias, privacy, lineage, governance", "Who defines the target, who is represented, who may use the data, which version trained the model.", "Ley 1581 de 2012; a reanalysis version change."],
  ];
  let sel = 0;
  const W = 1000, H = 150, bw = 178, bh = 46, gx = 22;
  function render() {
    const svg = svgIn($("#pipeFig"), W, H);
    el("defs", {}, svg).innerHTML = `<marker id="pa" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="${css("--muted")}"/></marker>`;
    S.forEach((s, i) => {
      const row = i < 5 ? 0 : 1, col = row ? i - 5 : i, x = 10 + col * (bw + gx), y = 14 + row * 76;
      const g = el("g", { tabindex: 0, role: "button", "aria-label": s[2], style: "cursor:pointer" }, svg);
      el("rect", { x, y, width: bw, height: bh, rx: 12, fill: i === sel ? css("--data") : css("--card"), stroke: i === sel ? css("--data") : css("--line") }, g);
      el("text", { x: x + 12, y: y + 18, "font-size": 11, class: "mono", fill: i === sel ? css("--bg") : css("--muted") }, g, String(i + 1).padStart(2, "0"));
      el("text", { x: x + 12, y: y + 35, "font-size": 14, "font-weight": 600, fill: i === sel ? css("--bg") : css("--fg") }, g, s[0]);
      if (col < 4) el("line", { x1: x + bw + 2, y1: y + bh / 2, x2: x + bw + gx - 3, y2: y + bh / 2, stroke: css("--muted"), "marker-end": "url(#pa)" }, svg);
      g.addEventListener("click", () => { sel = i; render(); });
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); sel = i; render(); } });
    });
    el("path", { d: `M${10 + 4 * (bw + gx) + bw / 2} ${14 + bh} V${14 + bh + 15} H${10 + bw / 2} V${90 - 2}`, fill: "none", stroke: css("--muted"), "marker-end": "url(#pa)" }, svg);
    el("text", { x: W - 8, y: H - 6, "text-anchor": "end", class: "mut", "font-size": 12 }, svg, "→ a table of numbers enters the network (Part 2)");
    const s = S[sel];
    $("#pipeCard").innerHTML = `<p class="kicker k-data">Stage ${sel + 1} of 10</p><h4 style="font-size:20px;margin-bottom:6px"></h4><p></p><p class="note"><b>Example:</b> <span></span></p><button class="btn" data-go="${s[1]}" type="button">Go to this topic →</button>`;
    const c = $("#pipeCard"); c.querySelector("h4").textContent = s[2]; c.querySelectorAll("p")[1].textContent = s[3]; c.querySelector(".note span").textContent = s[4];
  }
  render(); return render;
});

/* acquisition: gauge vs radar vs satellite */
demo("d-acq", () => {
  const r = rng(7), N = 60, truth = [];
  for (let i = 0; i < N; i++) truth.push(r() < 0.38 ? -Math.log(1 - r()) * 11 : 0);
  const gauge = truth.map(v => Math.max(0, v * (1 + 0.12 * gauss(r)))),
    radar = truth.map(v => Math.max(0, v * 1.22 + (v > 0 ? 1.5 * gauss(r) : 0))),
    sat = truth.map((v, i) => { const s = (truth[i - 1] || 0) * 0.25 + v * 0.5 + (truth[i + 1] || 0) * 0.25; return s < 2.5 ? 0 : s * 0.72; });
  const src = { gauge: ["Gauge", "--fg", gauge], radar: ["Radar", "--lw", radar], sat: ["Satellite", "--cool", sat] };
  const on = new Set(["gauge", "radar", "sat"]);
  $$("#acqChips button").forEach(b => b.addEventListener("click", () => {
    on.has(b.dataset.v) ? on.delete(b.dataset.v) : on.add(b.dataset.v); b.setAttribute("aria-pressed", on.has(b.dataset.v)); render();
  }));
  function render() {
    const W = 520, H = 220, svg = svgIn($("#acqFig"), W, H), top = Math.ceil(Math.max(...gauge, ...radar) / 10) * 10;
    const { x, y } = axes(svg, { W, H, x0: 0, x1: N - 1, y0: 0, y1: top, xt: [0, 10, 20, 30, 40, 50], yt: [0, top / 2, top], xl: "day", yl: "mm/day" });
    for (const k of ["gauge", "radar", "sat"]) if (on.has(k)) {
      const [, c, v] = src[k];
      if (k === "gauge") v.forEach((u, i) => u > 0 && el("rect", { x: x(i) - 2.5, y: y(u), width: 5, height: y(0) - y(u), fill: css(c), opacity: .75 }, svg));
      else el("path", { d: path(v.map((u, i) => [x(i), y(u)])), fill: "none", stroke: css(c), "stroke-width": 1.8 }, svg);
    }
    $("#acqRead").innerHTML = ["gauge", "radar", "sat"].map(k => {
      const v = src[k][2], tot = v.reduce((a, b) => a + b, 0), g = gauge.reduce((a, b) => a + b, 0);
      return `<div><span>${src[k][0]} total</span><b style="color:${css(src[k][1])}">${fmtN(tot)} mm</b><span>${k === "gauge" ? "reference" : `r = ${fmt(corr(v, gauge))} · bias ${tot >= g ? "+" : ""}${fmtN((tot / g - 1) * 100)}%`}</span></div>`;
    }).join("");
  }
  render(); return render;
});

/* QA/QC checks */
demo("d-qc", () => {
  const r = rng(11), N = 120, v = [];
  for (let i = 0; i < N; i++) v.push(+(29 + 2.5 * Math.sin(i / 19) + 1.1 * gauss(r)).toFixed(1));
  for (let i = 40; i < 48; i++) v[i] = 27.3;          // stuck sensor
  v[70] = +(v[69] + 11.5).toFixed(1);                 // spike
  v[88] = -99;                                        // missing code stored as a value
  for (let i = 100; i < 105; i++) v[i] = null;        // gap
  let mode = chips($("#qcChips"), () => render());
  const k = slider("qcK", x => fmt(x, 1) + "×", () => render());
  function flags() {
    const range = new Set(), flat = new Set(), spike = new Set();
    v.forEach((u, i) => { if (u != null && (u < -10 || u > 50)) range.add(i); });
    for (let i = 0; i < N; i++) { let j = i; while (j + 1 < N && v[j + 1] != null && v[j + 1] === v[i]) j++; if (j - i >= 3) for (let q = i; q <= j; q++) flat.add(q); i = Math.max(i, j); }
    const d = []; for (let i = 1; i < N; i++) if (v[i] != null && v[i - 1] != null && !range.has(i) && !range.has(i - 1)) d.push(Math.abs(v[i] - v[i - 1]));
    const med = d.slice().sort((a, b) => a - b)[d.length >> 1];
    for (let i = 1; i < N; i++) if (v[i] != null && v[i - 1] != null && !range.has(i) && !range.has(i - 1) && Math.abs(v[i] - v[i - 1]) > k() * med * 1.4826 * 1.2) spike.add(i);
    return { range, flat, spike };
  }
  function render() {
    const m = mode(), F = flags(), W = 520, H = 220, svg = svgIn($("#qcFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: 0, x1: N - 1, y0: 18, y1: 44, xt: [0, 30, 60, 90, 119], yt: [20, 30, 40], xl: "day", yl: "°C" });
    let seg = [];
    const flush = () => { if (seg.length > 1) el("path", { d: path(seg), fill: "none", stroke: css("--fg"), "stroke-width": 1.4, opacity: .8 }, svg); seg = []; };
    v.forEach((u, i) => { if (u == null || u < 0) { flush(); return; } seg.push([x(i), y(u)]); }); flush();
    el("rect", { x: x(100), y: 12, width: x(104) - x(100), height: H - 38, fill: css("--well") }, svg);
    el("text", { x: x(102), y: 26, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "gap");
    el("circle", { cx: x(88), cy: y(18) - 4, r: 4, fill: css("--muted") }, svg);
    el("text", { x: x(88) + 7, y: y(18) - 1, class: "mut mono", "font-size": 11 }, svg, "−99");
    const show = { range: m === "range" || m === "all", flat: m === "flat" || m === "all", spike: m === "spike" || m === "all" };
    const col = { range: "--lw", flat: "--sw", spike: "--arch" };
    for (const kk of ["flat", "spike", "range"]) if (show[kk]) F[kk].forEach(i => {
      const yy = v[i] < 0 ? y(18) - 4 : y(v[i]);
      el("circle", { cx: x(i), cy: yy, r: 5.5, fill: "none", stroke: css(col[kk]), "stroke-width": 2 }, svg);
    });
    const gaps = v.filter(u => u == null).length;
    $("#qcRead").innerHTML = `<div><span>Range</span><b class="c-lw">${show.range ? F.range.size : "–"}</b></div><div><span>Flatline</span><b class="c-sw">${show.flat ? F.flat.size : "–"}</b></div><div><span>Spike</span><b class="c-arch">${show.spike ? F.spike.size : "–"}</b></div><div><span>Gap days</span><b>${gaps}</b></div>`;
  }
  render(); return render;
});

/* data types quiz */
demo("d-types", () => {
  const Q = [["Daily rainfall (mm)", "Continuous", "Any non-negative value: 0, 0.2, 13.7 mm."], ["Number of failed courses", "Discrete", "A count: 0, 1, 2…"],
    ["Municipality", "Nominal", "Labels with no natural order."], ["Socioeconomic estrato (1–6)", "Ordinal", "Ordered levels; the gaps between them are not equal amounts of income."],
    ["Blood type", "Nominal", "A, B, AB, O: no order."], ["Hospital visits last year", "Discrete", "A count."],
    ["Satisfaction score 1–5", "Ordinal", "Ordered, but 4 is not 'twice' 2."], ["Household income (COP)", "Continuous", "Treated as continuous; usually log-transformed."],
    ["Season: dry / normal / wet", "Ordinal", "Ordered by rainfall."]];
  const opts = ["Continuous", "Discrete", "Nominal", "Ordinal"], ans = {};
  const host = $("#typesQuiz");
  Q.forEach(([name, right, why], i) => {
    const row = document.createElement("div"); row.className = "q";
    row.innerHTML = `<div><b style="font-weight:500"></b></div><div class="opts">${opts.map(o => `<button class="chip" type="button" data-o="${o}" aria-pressed="false" style="padding:4px 10px;font-size:12.5px">${o}</button>`).join("")}</div><div class="fb" hidden></div>`;
    row.querySelector("b").textContent = name;
    const bs = $$("button", row);
    bs.forEach(b => b.addEventListener("click", () => {
      press(bs, b); ans[i] = b.dataset.o === right; row.classList.toggle("right", ans[i]); row.classList.toggle("wrong", !ans[i]);
      const fb = row.querySelector(".fb"); fb.hidden = false; fb.textContent = (ans[i] ? "Yes. " : `Not quite: ${right}. `) + why;
      $("#typesScore").textContent = `${Object.values(ans).filter(Boolean).length} / ${Object.keys(ans).length}`;
    }));
    host.appendChild(row);
  });
});

/* encoding */
demo("d-enc", () => {
  const recs = [["Ana", "Medellín", 3], ["Luis", "Turbo", 1], ["Sara", "Envigado", 5], ["Juan", "Bello", 2], ["Eva", "Rionegro", 4], ["Tomás", "Medellín", 6]];
  const munis = ["Bello", "Envigado", "Medellín", "Rionegro", "Turbo"];
  const gv = chips($("#encVar"), () => render()), gk = chips($("#encKind"), () => render());
  function render() {
    const v = gv(), k = gk(); let head, rows, cols;
    if (v === "muni") {
      if (k === "onehot") { head = ["Student", "Municipality", ...munis.map(m => "is_" + m)]; rows = recs.map(r => [r[0], r[1], ...munis.map(m => +(m === r[1]))]); cols = munis.length; }
      else { head = ["Student", "Municipality", "code"]; rows = recs.map(r => [r[0], r[1], munis.indexOf(r[1]) + 1]); cols = 1; }
    } else {
      if (k === "onehot") { head = ["Student", "Estrato", ...[1, 2, 3, 4, 5, 6].map(e => "e" + e)]; rows = recs.map(r => [r[0], r[2], ...[1, 2, 3, 4, 5, 6].map(e => +(e === r[2]))]); cols = 6; }
      else { head = ["Student", "Estrato", "estrato_rank"]; rows = recs.map(r => [r[0], r[2], r[2]]); cols = 1; }
    }
    $("#encTable").innerHTML = `<table class="tb"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, j) => `<td class="${j > 1 ? "n" : ""}" style="${j > 1 && c === 1 && head.length > 3 ? "color:var(--accent);font-weight:600" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const msg = {
      "muni-onehot": ["green", "<b>Good fit.</b> Five columns, no order implied. With 125 municipalities you would get 125 mostly-zero columns; that is where embeddings help."],
      "muni-ordinal": ["red", "<b>Problem.</b> Codes 1–5 tell the model that Turbo (5) is \"more\" than Bello (1) and that Medellín sits halfway between them. That order does not exist."],
      "estrato-onehot": ["amber", "<b>Works, but wasteful.</b> Six columns and the order is lost: the model must learn on its own that estrato 5 is close to 6."],
      "estrato-ordinal": ["green", "<b>Good fit.</b> One column keeps the natural order 1 &lt; 2 &lt; … &lt; 6. Note the steps are ranks, not equal income gaps."],
    }[v + "-" + k];
    const w = $("#encWarn"); w.className = "callout " + msg[0]; w.innerHTML = msg[1];
    $("#encRead").innerHTML = `<div><span>Columns fed to the network</span><b>${cols}</b></div>`;
  }
  render();
});

/* transformations: scaling scatter + log histogram */
demo("d-trans", () => {
  const r = rng(5), P = [];
  for (let i = 0; i < 40; i++) { const age = 18 + Math.floor(r() * 45); P.push([Math.round((1.3 + 0.09 * (age - 18) + Math.exp(0.6 * gauss(r)) * 0.8) * 1e6), age]); }
  P[0] = [2_100_000, 22]; P[1] = [2_300_000, 61];
  const rain = []; const r2 = rng(9); for (let i = 0; i < 365; i++) rain.push(r2() < 0.55 ? 0 : -Math.log(1 - r2()) * 9 * (r2() < 0.08 ? 3 : 1));
  const gs = chips($("#trScale"), () => scatter()), gl = chips($("#trLog"), () => hist());
  function tf(m) {
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    if (m === "raw") return P.map(p => [p[0], p[1]]);
    if (m === "minmax") { const [a, b, c, d] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; return P.map(p => [(p[0] - a) / (b - a), (p[1] - c) / (d - c)]); }
    const [mx, sx, my, sy] = [mean(xs), sd(xs), mean(ys), sd(ys)]; return P.map(p => [(p[0] - mx) / sx, (p[1] - my) / sy]);
  }
  function scatter() {
    const m = gs(), T = tf(m), W = 520, H = 250, svg = svgIn($("#trScatter"), W, H);
    const xs = T.map(p => p[0]), ys = T.map(p => p[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    // same units on both axes: the true geometry the network's distances and gradients see
    const span = Math.max(x1 - x0, (y1 - y0) * (W - 60) / (H - 40)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    x0 = cx - span / 2; x1 = cx + span / 2; const vs = span * (H - 40) / (W - 60); y0 = cy - vs / 2; y1 = cy + vs / 2;
    const f = m === "raw" ? (v => (v / 1e6).toFixed(1) + "M") : (v => fmt(v, 1));
    const { x, y } = axes(svg, { W, H, m: { l: 46, r: 14, t: 14, b: 26 }, x0, x1, y0, y1, xt: [x0 + span * 0.1, cx, x1 - span * 0.1], yt: [], xf: f, xl: m === "raw" ? "income (COP)" : "income (scaled)" });
    el("text", { x: 46, y: 12, class: "mut", "font-size": 11 }, svg, m === "raw" ? "age (years), drawn to the same scale" : "age (scaled), same scale");
    T.forEach((p, i) => el("circle", { cx: x(p[0]), cy: y(p[1]), r: i < 2 ? 6 : 3.5, fill: i < 2 ? css("--data") : css("--muted"), opacity: i < 2 ? 1 : .55 }, svg));
    el("line", { x1: x(T[0][0]), y1: y(T[0][1]), x2: x(T[1][0]), y2: y(T[1][1]), stroke: css("--data"), "stroke-dasharray": "4 3" }, svg);
    const dx = (T[1][0] - T[0][0]) ** 2, dy = (T[1][1] - T[0][1]) ** 2;
    $("#trCalc").innerHTML = `Two students: 22 vs 61 years old, incomes 2.1M vs 2.3M COP.\nsquared distance = Δincome² + Δage²\n               = <span class="k">${dx.toExponential(2)}</span> + <span class="k">${dy.toExponential(2)}</span>\nincome share of the distance: <span class="${dx / (dx + dy) > 0.9 ? "r" : "g"}">${fmt(100 * dx / (dx + dy), 1)}%</span>${m === "raw" ? "  ← a 39-year age gap counts for almost nothing" : ""}`;
  }
  function hist() {
    const m = gl(), vals = rain.map(v => m === "log" ? Math.log1p(v) : v), W = 520, H = 220, svg = svgIn($("#trHist"), W, H);
    const top = m === "log" ? 5 : 100, bw = m === "log" ? 0.25 : 5, nb = Math.round(top / bw), cnt = new Array(nb).fill(0);
    vals.forEach(v => cnt[Math.min(nb - 1, Math.floor(v / bw))]++);
    const ymax = Math.max(...cnt);
    const { x, y } = axes(svg, { W, H, x0: 0, x1: top, y0: 0, y1: ymax, xt: m === "log" ? [0, 1, 2, 3, 4, 5] : [0, 20, 40, 60, 80, 100], yt: [0, Math.round(ymax / 2), ymax], xl: m === "log" ? "log(1 + mm)" : "mm/day", yl: "days" });
    cnt.forEach((c, i) => c && el("rect", { x: x(i * bw) + 1, y: y(c), width: x(bw) - x(0) - 2, height: y(0) - y(c), fill: css("--data"), opacity: .8 }, svg));
  }
  const render = () => { scatter(); hist(); };
  render(); return render;
});

/* unstructured: tokenizer + pixel grid */
demo("d-unstr", () => {
  const vocab = new Map(); ["<pad>", "<unk>"].forEach((t, i) => vocab.set(t, i));
  const inp = $("#tokIn");
  function tok() {
    const toks = inp.value.toLowerCase().match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
    toks.forEach(t => { if (!vocab.has(t)) vocab.set(t, vocab.size); });
    $("#tokOut").innerHTML = toks.map(t => `<span class="cell"></span>`).join(`<span class="arrow"> </span>`);
    $$("#tokOut .cell").forEach((c, i) => c.textContent = toks[i]);
    $("#tokIds").innerHTML = toks.map(t => `<span class="cell out">${vocab.get(t)}</span>`).join(`<span class="arrow"> </span>`);
  }
  inp.addEventListener("input", tok); tok();
  const cv = $("#pxCanvas"), ctx = cv.getContext("2d"), G = 8, px = new Array(G * G).fill(0);
  const cloud = [0,0,0,0,0,0,0,0, 0,0,0,.4,.6,.2,0,0, 0,0,.5,1,1,.8,.2,0, 0,.3,1,1,1,1,.7,0, .2,.9,1,1,1,1,1,.3, 0,.4,.8,.9,.9,.8,.5,0, 0,0,.2,.6,.3,.5,.1,0, 0,0,0,.3,0,.4,0,0];
  function draw() {
    const s = cv.width / G; ctx.clearRect(0, 0, cv.width, cv.height);
    const fg = css("--fg"), line = css("--line");
    for (let i = 0; i < G * G; i++) { ctx.globalAlpha = px[i]; ctx.fillStyle = fg; ctx.fillRect((i % G) * s, Math.floor(i / G) * s, s, s); }
    ctx.globalAlpha = 1; ctx.strokeStyle = line; ctx.lineWidth = 1;
    for (let k = 1; k < G; k++) { ctx.beginPath(); ctx.moveTo(k * s, 0); ctx.lineTo(k * s, cv.height); ctx.moveTo(0, k * s); ctx.lineTo(cv.width, k * s); ctx.stroke(); }
    let t = ""; for (let rr = 0; rr < G; rr++) t += px.slice(rr * G, rr * G + G).map(v => v.toFixed(1)).join(" ") + "\n";
    $("#pxNums").textContent = t;
  }
  let down = false;
  const paint = e => { const b = cv.getBoundingClientRect(), c = Math.floor((e.clientX - b.left) / b.width * G), rr = Math.floor((e.clientY - b.top) / b.height * G);
    if (c >= 0 && c < G && rr >= 0 && rr < G) { px[rr * G + c] = Math.min(1, px[rr * G + c] + 0.5); draw(); } };
  cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); paint(e); });
  cv.addEventListener("pointermove", e => down && paint(e));
  cv.addEventListener("pointerup", () => down = false);
  $("#pxClear").onclick = () => { px.fill(0); draw(); };
  $("#pxDemo").onclick = () => { cloud.forEach((v, i) => px[i] = v); draw(); };
  cloud.forEach((v, i) => px[i] = v); draw();
  return draw;
});

/* gray zone: embeddings */
demo("d-gray", () => {
  const T = [
    ["Data foundation", "Tokenization and pixel arrays follow fixed rules: the same sentence always gives the same token IDs. No weights are learned, so this is data preparation."],
    ["Network", "A learned embedding layer is a table of trainable weights, updated by gradient descent with the rest of the model. It is part of the architecture."],
    ["Either", "Frozen pretrained embeddings (for example word vectors or a satellite foundation model's features) are fixed numbers computed by another model. Used as inputs, they act like engineered features; if you later fine-tune them, they move into the network."],
  ];
  let sel = 0; const bs = $$("#grayPicks .pick");
  bs.forEach(b => b.addEventListener("click", () => { sel = +b.dataset.v; press(bs, b); render(); }));
  function render() {
    const W = 520, H = 170, svg = svgIn($("#grayFig"), W, H);
    const zone = (x, w, label, col, on) => { el("rect", { x, y: 30, width: w, height: 110, rx: 14, fill: on ? css(col + "-soft") : css("--well"), stroke: on ? css(col) : css("--line"), "stroke-width": on ? 2 : 1 }, svg);
      el("text", { x: x + w / 2, y: 20, "text-anchor": "middle", "font-weight": 600, fill: on ? css(col) : css("--muted") }, svg, label); };
    zone(10, 230, "Data foundation", "--data", sel !== 1); zone(280, 230, "Network (trainable)", "--arch", sel !== 0);
    el("text", { x: 260, y: 90, "text-anchor": "middle", class: "mut", "font-size": 20 }, svg, "→");
    const xs = [125, 395, 260][sel], lbl = ["token IDs", "embedding table", "frozen vectors"][sel];
    el("rect", { x: xs - 70, y: 66, width: 140, height: 44, rx: 10, fill: css("--card"), stroke: css("--accent"), "stroke-width": 2 }, svg);
    el("text", { x: xs, y: 93, "text-anchor": "middle", "font-weight": 600 }, svg, lbl);
    $("#grayText").innerHTML = `<b>${T[sel][0]}.</b> ${T[sel][1]}`;
  }
  render(); return render;
});

/* missing data mechanisms */
demo("d-missing", () => {
  const r = rng(21), N = 400, S = [];
  for (let i = 0; i < N; i++) { const rural = r() < 0.3; S.push({ rural, risk: clamp(48 + (rural ? 9 : 0) + 14 * gauss(r), 0, 100), u: r() }); }
  const gm = chips($("#misMech"), () => render()), rate = slider("misRate", v => v + "%", () => render());
  function render() {
    const m = gm(), p = rate() / 100;
    const ranks = S.map(s => s.risk).sort((a, b) => a - b);
    S.forEach(s => {
      let q = p;
      if (m === "mar") q = p * (s.rural ? 2.0 : 0.57);
      if (m === "mnar") q = p * 2 * (ranks.indexOf(s.risk) / N) ** 1.5 * 1.25;
      s.miss = s.u < clamp(q, 0, 0.98);
    });
    const obs = S.filter(s => !s.miss), trueM = mean(S.map(s => s.risk)), obsM = obs.length ? mean(obs.map(s => s.risk)) : NaN;
    // MAR correction: average within urban/rural, then weight by the known population shares
    const grp = g => obs.filter(s => s.rural === g).map(s => s.risk), share = S.filter(s => s.rural).length / N;
    const corrM = grp(true).length && grp(false).length ? share * mean(grp(true)) + (1 - share) * mean(grp(false)) : NaN;
    const W = 520, H = 200, svg = svgIn($("#misFig"), W, H), bw = 5, nb = 20, all = new Array(nb).fill(0), ob = new Array(nb).fill(0);
    S.forEach(s => { const b = Math.min(nb - 1, Math.floor(s.risk / bw)); all[b]++; if (!s.miss) ob[b]++; });
    const ymax = Math.max(...all);
    const { x, y } = axes(svg, { W, H, x0: 0, x1: 100, y0: 0, y1: ymax, xt: [0, 25, 50, 75, 100], yt: [0, ymax], xl: "risk score", yl: "students" });
    all.forEach((c, i) => { el("rect", { x: x(i * bw) + 1, y: y(c), width: x(bw) - x(0) - 2, height: y(0) - y(c), fill: "none", stroke: css("--muted"), "stroke-dasharray": "3 2" }, svg);
      el("rect", { x: x(i * bw) + 1, y: y(ob[i]), width: x(bw) - x(0) - 2, height: y(0) - y(ob[i]), fill: css("--data"), opacity: .8 }, svg); });
    [[trueM, "--fg", "true mean"], [obsM, "--lw", "observed"]].forEach(([v, c, t], k) => { if (isNaN(v)) return;
      el("line", { x1: x(v), x2: x(v), y1: 14, y2: H - 26, stroke: css(c), "stroke-width": 2 }, svg);
      el("text", { x: x(v) + (k ? -4 : 4), y: 24 + 12 * k, "text-anchor": k ? "end" : "start", "font-size": 11, fill: css(c) }, svg, t); });
    const bias = obsM - trueM;
    $("#misRead").innerHTML = `<div><span>True mean</span><b>${fmt(trueM, 1)}</b></div><div><span>Mean of answers</span><b class="${Math.abs(bias) > 1 ? "c-lw" : "c-ok"}">${fmt(obsM, 1)}</b></div><div><span>Bias</span><b class="${Math.abs(bias) > 1 ? "c-lw" : "c-ok"}">${bias >= 0 ? "+" : ""}${fmt(bias, 1)}</b></div>` +
      (m === "mar" ? `<div><span>Reweighted by rural share</span><b class="c-ok">${fmt(corrM, 1)}</b></div>` : "");
  }
  render(); return render;
});

/* gap filling */
demo("d-gapfill", () => {
  const r = rng(33), N = 60, base = [], A = [], B = [], C = [];
  for (let i = 0; i < N; i++) base.push(r() < 0.45 ? -Math.log(1 - r()) * 10 : 0);
  base.forEach(b => { A.push(Math.max(0, b * 1.0 + (b ? 1.6 * gauss(r) : 0))); B.push(Math.max(0, b * 0.85 + (b ? 1.6 * gauss(r) : 0))); C.push(Math.max(0, b * 1.2 + (b ? 2 * gauss(r) : 0))); });
  const g0 = 24, g1 = 35, inGap = i => i >= g0 && i <= g1;
  const gm = chips($("#gfChips"), () => render());
  function fill(m) {
    const obs = A.map((v, i) => inGap(i) ? null : v), out = A.slice();
    if (m === "mean") { const mu = mean(obs.filter(v => v != null)); for (let i = g0; i <= g1; i++) out[i] = mu; }
    if (m === "interp") { const a = A[g0 - 1], b = A[g1 + 1]; for (let i = g0; i <= g1; i++) out[i] = a + (b - a) * (i - g0 + 1) / (g1 - g0 + 2); }
    if (m === "nbr") { // least squares A ≈ βB·B + βC·C on observed days (no intercept)
      let bb = 0, cc = 0, bc = 0, ab = 0, ac = 0;
      for (let i = 0; i < N; i++) if (!inGap(i)) { bb += B[i] ** 2; cc += C[i] ** 2; bc += B[i] * C[i]; ab += A[i] * B[i]; ac += A[i] * C[i]; }
      const det = bb * cc - bc * bc, kb = (ab * cc - ac * bc) / det, kc = (ac * bb - ab * bc) / det;
      for (let i = g0; i <= g1; i++) out[i] = Math.max(0, kb * B[i] + kc * C[i]);
    }
    return out;
  }
  function render() {
    const m = gm(), F = fill(m), W = 520, H = 220, svg = svgIn($("#gfFig"), W, H), top = Math.ceil(Math.max(...A, ...B, ...C) / 10) * 10;
    const { x, y } = axes(svg, { W, H, x0: 0, x1: N - 1, y0: 0, y1: top, xt: [0, 15, 30, 45, 59], yt: [0, top / 2, top], xl: "day", yl: "mm/day" });
    el("rect", { x: x(g0 - 0.5), y: 12, width: x(g1 + 0.5) - x(g0 - 0.5), height: H - 38, fill: css("--well") }, svg);
    el("text", { x: x((g0 + g1) / 2), y: 26, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "gap in station A");
    [[B, "--cool"], [C, "--sw"]].forEach(([s, c]) => el("path", { d: path(s.map((v, i) => [x(i), y(v)])), fill: "none", stroke: css(c), "stroke-width": 1.1, opacity: .7 }, svg));
    A.forEach((v, i) => { if (inGap(i)) { el("rect", { x: x(i) - 3, y: y(v), width: 6, height: y(0) - y(v), fill: "none", stroke: css("--fg"), "stroke-dasharray": "2 2" }, svg);
      el("rect", { x: x(i) - 3, y: y(F[i]), width: 6, height: y(0) - y(F[i]), fill: css("--data"), opacity: .85 }, svg); }
      else v > 0 && el("rect", { x: x(i) - 3, y: y(v), width: 6, height: y(0) - y(v), fill: css("--fg"), opacity: .7 }, svg); });
    let se = 0, tt = 0, tf = 0; for (let i = g0; i <= g1; i++) { se += (F[i] - A[i]) ** 2; tt += A[i]; tf += F[i]; }
    $("#gfRead").innerHTML = `<div><span>Error in the gap (RMSE)</span><b class="${m === "nbr" ? "c-ok" : "c-lw"}">${fmt(Math.sqrt(se / (g1 - g0 + 1)), 1)} mm</b></div><div><span>Gap total: true / filled</span><b>${fmtN(tt)} / ${fmtN(tf)} mm</b></div>`;
    $("#gfRead").insertAdjacentHTML("afterend", "");
  }
  const legend = document.createElement("div"); legend.className = "legend";
  legend.innerHTML = `<span><i style="background:var(--fg)"></i>Station A</span><span><i style="background:var(--data)"></i>Filled values</span><span><i style="background:var(--cool)"></i>Station B</span><span><i style="background:var(--sw)"></i>Station C</span>`;
  $("#gfFig").after(legend);
  render(); return render;
});

/* data splits */
demo("d-splits", () => {
  const r = rng(44), N = 365, s = [0];
  for (let i = 1; i < N; i++) s.push(0.9 * s[i - 1] + gauss(r));
  const perm = s.map((_, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  const gm = chips($("#spMode"), () => render()), tr = slider("spTrain", v => v + "%", () => render()), va = slider("spVal", v => v + "%", () => render());
  function render() {
    let t = tr(), v = va(); if (t + v > 90) v = 90 - t;
    const nT = Math.round(N * t / 100), nV = Math.round(N * v / 100), lab = new Array(N);
    if (gm() === "time") for (let i = 0; i < N; i++) lab[i] = i < nT ? 0 : i < nT + nV ? 1 : 2;
    else perm.forEach((idx, k) => lab[idx] = k < nT ? 0 : k < nT + nV ? 1 : 2);
    const W = 520, H = 210, svg = svgIn($("#spFig"), W, H), cols = ["--data", "--sw", "--lw"];
    const lo = Math.min(...s), hi = Math.max(...s);
    const { x, y } = axes(svg, { W, H, m: { l: 30, r: 12, t: 10, b: 40 }, x0: 0, x1: N - 1, y0: lo, y1: hi, xt: [0, 90, 181, 273, 364], xf: d => ["Jan", "Apr", "Jul", "Oct", "Dec"][[0, 90, 181, 273, 364].indexOf(d)] });
    el("path", { d: path(s.map((u, i) => [x(i), y(u)])), fill: "none", stroke: css("--muted"), "stroke-width": 1 }, svg);
    s.forEach((u, i) => { el("circle", { cx: x(i), cy: y(u), r: 1.8, fill: css(cols[lab[i]]) }, svg); el("rect", { x: x(i) - .8, y: H - 34, width: 1.8, height: 10, fill: css(cols[lab[i]]) }, svg); });
    let adj = 0, nTest = 0; for (let i = 0; i < N; i++) if (lab[i] === 2) { nTest++; if (lab[i - 1] === 0 || lab[i + 1] === 0) adj++; }
    $("#spRead").innerHTML = `<div><span>Train / val / test</span><b>${t} / ${v} / ${100 - t - v}%</b></div><div><span>Test days next to a training day</span><b class="${adj / nTest > 0.1 ? "c-lw" : "c-ok"}">${fmtN(100 * adj / nTest)}%</b></div>`;
  }
  const lg = document.createElement("div"); lg.className = "legend";
  lg.innerHTML = `<span><i style="background:var(--data)"></i>Training</span><span><i style="background:var(--sw)"></i>Validation</span><span><i style="background:var(--lw)"></i>Test</span>`;
  $("#spFig").after(lg);
  render(); return render;
});

/* leakage audit */
demo("d-leak", () => {
  // [feature, days relative to prediction time (negative = known before), real predictive value, apparent value if leaky]
  const C = {
    fraud: { t: "transaction", F: [["Amount", 0, .08], ["Merchant category", 0, .05], ["Hour of day", 0, .04], ["Transactions last 30 days", -15, .07], ["Account frozen", 12, 0, .35], ["Chargeback filed", 30, 0, .3]],
      note: "\"Account frozen\" and \"chargeback filed\" are set only after fraud is confirmed. In historical data they almost equal the label." },
    health: { t: "first visit", F: [["Age", -300, .05], ["Symptoms reported", 0, .1], ["Blood pressure", 0, .05], ["Family history", -200, .06], ["Medication prescribed", 5, 0, .35], ["Specialist referral", 10, 0, .25]],
      note: "\"Medication prescribed\" exists only after a diagnosis. The model learns to read the doctor's decision, not to anticipate it." },
    att: { t: "start of year", F: [["Previous year's grades", -120, .09], ["Estrato", -300, .04], ["Distance to school", -200, .05], ["Previous absences", -60, .07], ["Final-year attendance", 250, 0, .38], ["Withdrawal paperwork", 200, 0, .3]],
      note: "Final-year attendance is not known at the start of the year. Students who leave stop attending, so it reveals the answer." },
  };
  let cs = "fraud"; const on = {};
  const bs = $$("#lkCases .pick");
  bs.forEach(b => b.addEventListener("click", () => { cs = b.dataset.v; press(bs, b); render(); }));
  for (const k in C) on[k] = new Set(C[k].F.map((_, i) => i));
  function render() {
    const c = C[cs], W = 520, H = 250, svg = svgIn($("#lkFig"), W, H), x = lin(-320, 320, 30, W - 20);
    el("line", { x1: 30, x2: W - 20, y1: 30, y2: 30, class: "ax" }, svg);
    el("rect", { x: x(0), y: 34, width: W - 20 - x(0), height: H - 40, fill: css("--lw-soft") }, svg);
    el("line", { x1: x(0), x2: x(0), y1: 20, y2: H - 6, stroke: css("--fg"), "stroke-width": 2 }, svg);
    el("text", { x: x(0), y: 14, "text-anchor": "middle", "font-size": 11.5, "font-weight": 600 }, svg, "prediction time: " + c.t);
    el("text", { x: 34, y: 46, class: "mut", "font-size": 11 }, svg, "known before");
    el("text", { x: W - 24, y: 46, "text-anchor": "end", "font-size": 11, fill: css("--lw") }, svg, "known only after");
    c.F.forEach((f, i) => {
      const yy = 62 + i * 30, leak = f[1] > 0, sel = on[cs].has(i), w = Math.max(90, f[0].length * 6.6 + 18);
      // known before (or at) prediction time: right-aligned left of the line; known after: right of it, farther the later
      const bx = leak ? clamp(x(0) + 8 + f[1] * 0.25, x(0) + 8, W - 22 - w) : clamp(x(0) - 8 - w + f[1] * 0.25, 32, x(0) - 8 - w);
      const g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-pressed": sel }, svg);
      el("rect", { x: bx, y: yy - 13, width: w, height: 24, rx: 12, fill: sel ? css(leak ? "--lw" : "--data") : css("--card"), stroke: css(leak ? "--lw" : "--data") }, g);
      el("text", { x: bx + w / 2, y: yy + 3.5, "text-anchor": "middle", "font-size": 12, fill: sel ? css("--bg") : css("--fg") }, g, f[0]);
      const tog = () => { sel ? on[cs].delete(i) : on[cs].add(i); render(); };
      g.addEventListener("click", tog); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); tog(); } });
    });
    let real = 0.55, test = 0.55;
    c.F.forEach((f, i) => { if (!on[cs].has(i)) return; real += f[2]; test += f[1] > 0 ? f[3] : f[2]; });
    const leaky = c.F.some((f, i) => f[1] > 0 && on[cs].has(i));
    if (leaky) real -= 0.06; // the model leaned on the leak and learned less from honest features
    test = Math.min(test, 0.99); real = Math.min(real, 0.99);
    $("#lkRead").innerHTML = `<div><span>Score on the test set</span><b class="${leaky ? "c-sw" : ""}">${fmt(test, 2)}</b></div><div><span>Score after deployment</span><b class="${leaky ? "c-lw" : "c-ok"}">${fmt(real, 2)}</b></div>`;
    $("#lkNote").textContent = (leaky ? "Leaky features are in: the test score is inflated. " : "No leaky features: test and deployment agree. ") + c.note;
  }
  render(); return render;
});

/* scaler leakage */
demo("d-leak-scale", () => {
  const r = rng(52), Y = [], T = [];
  for (let yr = 1980; yr <= 2024; yr++) { Y.push(yr); T.push(25.2 + 0.03 * (yr - 1980) + 0.22 * gauss(r)); }
  const gm = chips($("#lsMode"), () => render()), sp = slider("lsSplit", v => v, () => render());
  function render() {
    const s = sp(), tr = T.filter((_, i) => Y[i] < s), te = T.filter((_, i) => Y[i] >= s);
    const mu = gm() === "train" ? mean(tr) : mean(T), sg = gm() === "train" ? sd(tr) : sd(T);
    const Z = T.map(v => (v - mu) / sg), W = 520, H = 220, svg = svgIn($("#lsFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: 1980, x1: 2024, y0: -3, y1: 5, xt: [1980, 1990, 2000, 2010, 2020], yt: [-2, 0, 2, 4], xl: "year", yl: "z-score" });
    el("rect", { x: x(s - 0.5), y: 12, width: x(2024.5) - x(s - 0.5), height: H - 38, fill: css("--lw-soft") }, svg);
    el("text", { x: x(s) + 4, y: 24, "font-size": 11, fill: css("--lw") }, svg, "test period");
    el("line", { x1: 40, x2: W - 12, y1: y(0), y2: y(0), stroke: css("--muted"), "stroke-dasharray": "4 3" }, svg);
    Z.forEach((z, i) => el("circle", { cx: x(Y[i]), cy: y(z), r: 3.4, fill: css(Y[i] < s ? "--data" : "--lw") }, svg));
    const shift = mean(T) - mean(tr);
    $("#lsRead").innerHTML = `<div><span>Mean used by the scaler</span><b>${fmt(mu, 2)} °C</b></div><div><span>Test mean in z units</span><b class="${gm() === "train" ? "c-ok" : "c-lw"}">${fmt(mean(te.map(v => (v - mu) / sg)), 2)}</b></div><div><span>Future information in μ</span><b class="${gm() === "train" ? "c-ok" : "c-lw"}">${gm() === "train" ? "0.00" : "+" + fmt(shift, 2)} °C</b></div>`;
  }
  render(); return render;
});

/* PCA rotation */
demo("d-dimred", () => {
  const r = rng(61), P = [];
  for (let i = 0; i < 220; i++) { const a = gauss(r), b = gauss(r); P.push([0.9 * a + 0.25 * b, 0.75 * a - 0.3 * b]); }
  const mx = mean(P.map(p => p[0])), my = mean(P.map(p => p[1]));
  const sxx = mean(P.map(p => (p[0] - mx) ** 2)), syy = mean(P.map(p => (p[1] - my) ** 2)), sxy = mean(P.map(p => (p[0] - mx) * (p[1] - my)));
  const pc1 = (0.5 * Math.atan2(2 * sxy, sxx - syy)) * 180 / Math.PI, tot = sxx + syy;
  const ang = slider("pcaAng", v => v + "°", () => render());
  $("#pcaSnap").onclick = () => { const a = $("#pcaAng"); a.value = Math.round((pc1 + 180) % 180); a.dispatchEvent(new Event("input")); };
  function render() {
    const t = ang() * Math.PI / 180, u = [Math.cos(t), Math.sin(t)], W = 420, H = 300, svg = svgIn($("#pcaFig"), W, H);
    const { x, y } = axes(svg, { W, H, m: { l: 34, r: 10, t: 10, b: 26 }, x0: -3.2, x1: 3.2, y0: -2.3, y1: 2.3, xt: [-2, 0, 2], yt: [-2, 0, 2], xl: "SST anomaly, cell 1 (°C)", yl: "cell 2 (°C)" });
    P.forEach(p => { const proj = (p[0] - mx) * u[0] + (p[1] - my) * u[1];
      el("line", { x1: x(p[0]), y1: y(p[1]), x2: x(mx + proj * u[0]), y2: y(my + proj * u[1]), stroke: css("--line"), "stroke-width": .7 }, svg);
      el("circle", { cx: x(p[0]), cy: y(p[1]), r: 2.6, fill: css("--data"), opacity: .7 }, svg); });
    el("line", { x1: x(mx - 3.4 * u[0]), y1: y(my - 3.4 * u[1]), x2: x(mx + 3.4 * u[0]), y2: y(my + 3.4 * u[1]), stroke: css("--arch"), "stroke-width": 2.5 }, svg);
    const v = sxx * u[0] ** 2 + syy * u[1] ** 2 + 2 * sxy * u[0] * u[1];
    $("#pcaRead").innerHTML = `<div><span>Variance captured by this axis</span><b class="${v / tot > 0.9 ? "c-ok" : ""}">${fmtN(100 * v / tot)}%</b></div><div><span>Best possible (PC1)</span><b class="c-arch">${fmtN(100 * (tot / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2)) / tot)}% at ${fmtN((pc1 + 180) % 180)}°</b></div>`;
  }
  render(); return render;
});

/* class imbalance */
demo("d-imb", () => {
  const PREV = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 20, 25, 30, 40, 50], N = 10000, mn = 0.32, sn = 0.12, mp = 0.66, sp = 0.13;
  const pv = slider("imPrev", v => PREV[v] + "%", () => render()), th = slider("imThr", v => fmt(v, 2), () => render());
  function render() {
    const p = PREV[pv()] / 100, t = th(), nP = N * p, nN = N - nP;
    const TP = nP * (1 - Phi((t - mp) / sp)), FP = nN * (1 - Phi((t - mn) / sn)), FN = nP - TP, TN = nN - FP;
    const W = 520, H = 190, svg = svgIn($("#imFig"), W, H), dens = (v, m, s, n) => n * Math.exp(-0.5 * ((v - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)) / 100;
    const ymax = Math.max(dens(mn, mn, sn, nN), dens(mp, mp, sp, nP));
    const { x, y } = axes(svg, { W, H, x0: 0, x1: 1, y0: 0, y1: ymax, xt: [0, .25, .5, .75, 1], yt: [], xl: "classifier score", yl: "cases" });
    const xs = Array.from({ length: 101 }, (_, i) => i / 100);
    el("path", { d: path(xs.map(v => [x(v), y(dens(v, mn, sn, nN))])) + `L${x(1)} ${y(0)}L${x(0)} ${y(0)}Z`, fill: css("--cool-soft"), stroke: css("--cool") }, svg);
    el("path", { d: path(xs.map(v => [x(v), y(dens(v, mp, sp, nP))])) + `L${x(1)} ${y(0)}L${x(0)} ${y(0)}Z`, fill: css("--lw-soft"), stroke: css("--lw"), "stroke-width": 2 }, svg);
    const zoom = Math.max(1, Math.round(nN / nP / 4));
    if (zoom > 1) { el("path", { d: path(xs.map(v => [x(v), y(dens(v, mp, sp, nP) * zoom)])), fill: "none", stroke: css("--lw"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: W - 14, y: y(dens(mp, mp, sp, nP) * zoom) - 8, "text-anchor": "end", "font-size": 11, fill: css("--lw") }, svg, `rare class, zoomed ×${fmtN(zoom)} to show its shape`); }
    el("line", { x1: x(t), x2: x(t), y1: 8, y2: H - 26, stroke: css("--fg"), "stroke-width": 2 }, svg);
    el("text", { x: x(t) + 4, y: 18, "font-size": 11 }, svg, "flag as positive →");
    const cm = [[TN, FP], [FN, TP]].map(rr => rr.map(v => fmtN(v)));
    $("#imCM").innerHTML = `<table class="tb"><thead><tr><th></th><th>Pred. no</th><th>Pred. yes</th></tr></thead><tbody><tr><td>Actual no</td><td class="n">${cm[0][0]}</td><td class="n" style="color:var(--sw)">${cm[0][1]}</td></tr><tr><td>Actual yes</td><td class="n" style="color:var(--lw)">${cm[1][0]}</td><td class="n" style="color:var(--ok)">${cm[1][1]}</td></tr></tbody></table>`;
    const acc = (TP + TN) / N, prec = TP / (TP + FP || 1), rec = TP / (nP || 1), f1 = 2 * prec * rec / (prec + rec || 1);
    $("#imRead").innerHTML = `<div><span>Accuracy</span><b>${fmt(100 * acc, 1)}%</b></div><div><span>"Always no"</span><b class="c-sw">${fmt(100 * (1 - p), 1)}%</b></div><div><span>Precision</span><b>${fmt(prec, 2)}</b></div><div><span>Recall</span><b class="${rec < 0.5 ? "c-lw" : "c-ok"}">${fmt(rec, 2)}</b></div><div><span>F1</span><b>${fmt(f1, 2)}</b></div>`;
  }
  const lg = document.createElement("div"); lg.className = "legend";
  lg.innerHTML = `<span><i style="background:var(--cool)"></i>Normal cases</span><span><i style="background:var(--lw)"></i>Rare event (fraud, attrition, disease)</span>`;
  $("#imFig").after(lg);
  render(); return render;
});

/* augmentation: image transforms + SMOTE */
demo("d-aug", () => {
  const G = 12, base = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const d1 = Math.hypot(i - 4.5, j - 4), d2 = Math.hypot(i - 7, j - 7.5);
    base.push(clamp(Math.max(1 - d1 / 3.6, 0.85 - d2 / 2.8, 0), 0, 1));
  }
  let img = base.slice(), log = [];
  const cv = $("#augCanvas"), ctx = cv.getContext("2d"), r = rng(71);
  const at = (a, i, j) => (i < 0 || j < 0 || i >= G || j >= G) ? 0 : a[i * G + j];
  const ops = {
    flip: a => a.map((_, k) => at(a, Math.floor(k / G), G - 1 - k % G)),
    rot: a => a.map((_, k) => at(a, G - 1 - k % G, Math.floor(k / G))),
    crop: a => { const di = Math.round(r() * 4 - 2), dj = Math.round(r() * 4 - 2); return a.map((_, k) => at(a, Math.floor(k / G) - di, k % G - dj)); },
    bright: a => { const f = 0.6 + r() * 0.7; return a.map(v => clamp(v * f, 0, 1)); },
    noise: a => a.map(v => clamp(v + 0.12 * gauss(r), 0, 1)),
  };
  const names = { flip: "flipped left–right", rot: "rotated 90°", crop: "shifted a few pixels", bright: "brightness changed", noise: "sensor noise added" };
  $$("#augBtns button").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.v; if (v === "reset") { img = base.slice(); log = []; } else { img = ops[v](img); log.push(names[v]); } draw();
  }));
  function draw() {
    const s = cv.width / G, c1 = css("--cool"), c2 = css("--sw"), c3 = css("--lw");
    ctx.fillStyle = css("--well"); ctx.fillRect(0, 0, cv.width, cv.height);
    for (let k = 0; k < G * G; k++) { const v = img[k]; if (v < 0.05) continue; ctx.fillStyle = v < 0.4 ? c1 : v < 0.7 ? c2 : c3; ctx.globalAlpha = 0.35 + 0.65 * v; ctx.fillRect((k % G) * s, Math.floor(k / G) * s, s, s); }
    ctx.globalAlpha = 1;
    $("#augLog").innerHTML = log.length ? `<b>Same label ("convective cell")</b>, new example: ${log.join(", ")}.` : "The original example. Each transform makes a new training image with the same label.";
  }
  // SMOTE
  const rs = rng(73), maj = [], min = [];
  for (let i = 0; i < 140; i++) maj.push([gauss(rs) * 1.1, gauss(rs) * 1.1]);
  for (let i = 0; i < 12; i++) min.push([2.1 + gauss(rs) * 0.55, 1.6 + gauss(rs) * 0.55]);
  let syn = [];
  $("#smoteAdd").onclick = () => { for (let k = 0; k < 10; k++) { const a = min[Math.floor(rs() * min.length)];
    const nb = min.filter(p => p !== a).sort((p, q) => Math.hypot(p[0] - a[0], p[1] - a[1]) - Math.hypot(q[0] - a[0], q[1] - a[1])).slice(0, 3);
    const b = nb[Math.floor(rs() * nb.length)], t = rs(); syn.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a, b]); } smote(); };
  $("#smoteReset").onclick = () => { syn = []; smote(); };
  function smote() {
    const W = 420, H = 230, svg = svgIn($("#smoteFig"), W, H);
    const { x, y } = axes(svg, { W, H, m: { l: 20, r: 10, t: 10, b: 20 }, x0: -3.5, x1: 4, y0: -3.2, y1: 3.4, xt: [], yt: [] });
    maj.forEach(p => el("circle", { cx: x(p[0]), cy: y(p[1]), r: 3, fill: css("--muted"), opacity: .45 }, svg));
    syn.slice(-10).forEach(p => el("line", { x1: x(p[2][0]), y1: y(p[2][1]), x2: x(p[3][0]), y2: y(p[3][1]), stroke: css("--lw"), "stroke-width": .8, opacity: .45 }, svg));
    min.forEach(p => el("circle", { cx: x(p[0]), cy: y(p[1]), r: 4.5, fill: css("--lw") }, svg));
    syn.forEach(p => el("circle", { cx: x(p[0]), cy: y(p[1]), r: 4, fill: css("--bg"), stroke: css("--lw"), "stroke-width": 1.8 }, svg));
    el("text", { x: W - 10, y: 18, "text-anchor": "end", "font-size": 12, fill: css("--lw") }, svg, `rare class: ${min.length} real + ${syn.length} synthetic`);
    el("text", { x: 26, y: H - 26, "font-size": 12, class: "mut" }, svg, `common class: ${maj.length}`);
  }
  const render = () => { draw(); smote(); };
  render(); return render;
});

/* labels: agreement and kappa */
demo("d-labels", () => {
  const ag = slider("lbAgree", v => v + "%", () => render()), pr = slider("lbPrev", v => v + "%", () => render());
  function render() {
    const po = ag() / 100, p = pr() / 100, N = 200, d = 1 - po;
    let yy = Math.max(0, p - d / 2), nn = Math.max(0, 1 - p - d / 2); const s = yy + nn + d; yy /= s; nn /= s;
    const pe = p * p + (1 - p) * (1 - p), k = (po - pe) / (1 - pe);
    const nY = Math.round(N * yy), nD = Math.round(N * d), W = 520, H = 120, svg = svgIn($("#lbFig"), W, H);
    for (let i = 0; i < N; i++) { const c = i < nY ? "--lw" : i < nY + nD ? "--sw" : "--data", cx = 12 + (i % 40) * 12.6, cy = 12 + Math.floor(i / 40) * 20;
      el("circle", { cx, cy, r: 4.6, fill: i < nY + nD && i >= nY ? "none" : css(c), stroke: css(c), "stroke-width": 1.6 }, svg); }
    $("#lbRead").innerHTML = `<div><span>Raw agreement</span><b>${fmtN(po * 100)}%</b></div><div><span>Expected by chance</span><b>${fmtN(pe * 100)}%</b></div><div><span>Cohen's κ</span><b class="${k < 0.6 ? "c-lw" : "c-ok"}">${fmt(k, 2)}</b></div>`;
  }
  const lg = document.createElement("div"); lg.className = "legend";
  lg.innerHTML = `<span><i style="background:var(--lw)"></i>Both: disease</span><span><i style="background:var(--data)"></i>Both: healthy</span><span><i style="border:2px solid var(--sw);background:none"></i>They disagree</span>`;
  $("#lbFig").after(lg);
  render(); return render;
});

/* outliers: keep or remove */
demo("d-outliers", () => {
  const r = rng(81), Y = [], V = [];
  for (let i = 0; i < 20; i++) { Y.push(2005 + i); V.push(Math.round(62 + 16 * gauss(r))); }
  V[9] = 178; V[15] = 412;  // a confirmed record storm, and a decimal-shift recording error (41.2 → 412)
  const why = { 9: "2014: confirmed by radar and three neighbouring gauges. A real extreme.", 15: "2020: neighbours recorded 40–45 mm. A decimal-shift recording error (41.2 → 412)." };
  const removed = new Set(), z = slider("olZ", v => fmt(v, 1), () => render());
  function render() {
    const med = V.slice().sort((a, b) => a - b)[10], mad = 1.4826 * V.map(v => Math.abs(v - med)).sort((a, b) => a - b)[10];
    const W = 520, H = 230, svg = svgIn($("#olFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: 2004.5, x1: 2024.5, y0: 0, y1: 450, xt: [2005, 2010, 2015, 2020, 2024], yt: [0, 100, 200, 300, 400], xl: "year", yl: "mm/day" });
    el("line", { x1: 40, x2: W - 12, y1: y(med + z() * mad), y2: y(med + z() * mad), stroke: css("--sw"), "stroke-dasharray": "5 4" }, svg);
    el("text", { x: W - 14, y: y(med + z() * mad) - 4, "text-anchor": "end", "font-size": 11, fill: css("--sw") }, svg, "flag threshold");
    V.forEach((v, i) => {
      const fl = (v - med) / mad > z(), rm = removed.has(i);
      const g = el("g", { style: fl ? "cursor:pointer" : "" }, svg);
      el("circle", { cx: x(Y[i]), cy: y(v), r: fl ? 7 : 4.5, fill: rm ? "none" : css(fl ? "--sw" : "--data"), stroke: css(fl ? "--sw" : "--data"), "stroke-width": 2 }, g);
      if (fl) { el("text", { x: x(Y[i]) + 10, y: y(v) + 4, "font-size": 11.5 }, g, rm ? "removed (click to keep)" : "click to remove");
        g.addEventListener("click", () => { rm ? removed.delete(i) : removed.add(i); render(); }); }
    });
    const keep = V.filter((_, i) => !removed.has(i)), mu = mean(keep), s = sd(keep), K = -Math.sqrt(6) / Math.PI * (0.5772 + Math.log(Math.log(100 / 99)));
    const notes = [...removed].map(i => why[i] ? (i === 15 ? "Removing 2020 is right: " : "Removing 2014 is wrong: ") + why[i] : "").filter(Boolean);
    $("#olRead").innerHTML = `<div><span>Years kept</span><b>${keep.length}</b></div><div><span>Mean annual maximum</span><b>${fmtN(mu)} mm</b></div><div><span>100-year design storm (Gumbel)</span><b class="c-data">${fmtN(mu + K * s)} mm</b></div>` +
      (notes.length ? `<p class="note" style="flex-basis:100%;margin:0">${notes.join(" ")}</p>` : "");
  }
  render(); return render;
});

/* bias and representativeness */
demo("d-bias", () => {
  const r = rng(91), pop = (n, rural) => Array.from({ length: n }, () => { const a = r() * 30; return [a, clamp(6 + (rural ? 2.3 : 1.1) * a + 5 * gauss(r), 0, 100), rural]; });
  const urbanPool = pop(400, false), ruralPool = pop(400, true), testU = pop(200, false), testR = pop(200, true);
  const sh = slider("biRural", v => v + "%", () => render());
  function render() {
    const n = 200, nr = Math.round(n * sh() / 100), S = urbanPool.slice(0, n - nr).concat(ruralPool.slice(0, nr));
    const mx = mean(S.map(p => p[0])), my = mean(S.map(p => p[1])), b = S.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / S.reduce((s, p) => s + (p[0] - mx) ** 2, 0), a = my - b * mx;
    const mae = T => mean(T.map(p => Math.abs(a + b * p[0] - p[1])));
    const W = 520, H = 230, svg = svgIn($("#biFig"), W, H);
    const { x, y } = axes(svg, { W, H, x0: 0, x1: 30, y0: 0, y1: 90, xt: [0, 10, 20, 30], yt: [0, 30, 60, 90], xl: "absences in previous year", yl: "risk score" });
    S.forEach(p => el("circle", { cx: x(p[0]), cy: y(p[1]), r: 2.8, fill: css(p[2] ? "--sw" : "--cool"), opacity: .65 }, svg));
    el("line", { x1: x(0), y1: y(a), x2: x(30), y2: y(a + b * 30), stroke: css("--fg"), "stroke-width": 2.5 }, svg);
    el("line", { x1: x(0), y1: y(6), x2: x(30), y2: y(6 + 2.3 * 30), stroke: css("--sw"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
    el("text", { x: x(30) - 4, y: y(6 + 2.3 * 30) + 14, "text-anchor": "end", "font-size": 11, fill: css("--sw") }, svg, "true rural trend");
    el("text", { x: x(30) - 4, y: y(a + b * 30) - 6, "text-anchor": "end", "font-size": 11 }, svg, "model fit");
    $("#biRead").innerHTML = `<div><span>Error on urban students</span><b>${fmt(mae(testU), 1)}</b></div><div><span>Error on rural students</span><b class="${mae(testR) > 1.5 * mae(testU) ? "c-lw" : "c-ok"}">${fmt(mae(testR), 1)}</b></div>`;
  }
  const lg = document.createElement("div"); lg.className = "legend";
  lg.innerHTML = `<span><i style="background:var(--cool)"></i>Urban</span><span><i style="background:var(--sw)"></i>Rural</span>`;
  $("#biFig").after(lg);
  render(); return render;
});

/* privacy: k-anonymity */
demo("d-privacy", () => {
  const R = [["Ana Gómez", "1.017.234.551", 15, "F", "Medellín", "Valle de Aburrá"], ["Luis Pérez", "1.020.118.903", 16, "M", "Bello", "Valle de Aburrá"],
    ["Sara Ríos", "1.036.552.117", 15, "F", "Envigado", "Valle de Aburrá"], ["Juan Mesa", "1.001.774.320", 17, "M", "Turbo", "Urabá"],
    ["Eva Toro", "1.040.221.660", 16, "F", "Apartadó", "Urabá"], ["Tomás Gil", "1.019.903.448", 15, "M", "Medellín", "Valle de Aburrá"],
    ["Lina Ruiz", "1.028.667.012", 17, "F", "Rionegro", "Oriente"], ["Mateo Vélez", "1.033.110.785", 16, "M", "Marinilla", "Oriente"],
    ["Paula Cano", "1.022.540.399", 15, "F", "Bello", "Valle de Aburrá"], ["Diego Mora", "1.031.884.226", 17, "M", "Turbo", "Urabá"]];
  const gs = chips($("#pvSteps"), () => render());
  function render() {
    const st = +gs(), band = a => a <= 15 ? "14–15" : "16–17";
    const rows = R.map(r => ({ name: st >= 1 ? "—" : r[0], id: st >= 1 ? "—" : r[1], age: st >= 2 ? band(r[2]) : r[2], sex: r[3], place: st >= 3 ? r[5] : r[4] }));
    const key = o => [o.age, o.sex, o.place].join("|"), cnt = {};
    rows.forEach(o => cnt[key(o)] = (cnt[key(o)] || 0) + 1);
    const k = st === 0 ? 1 : Math.min(...rows.map(o => cnt[key(o)])), uniq = rows.filter(o => cnt[key(o)] === 1).length;
    $("#pvTable").innerHTML = `<table class="tb"><thead><tr><th>Name</th><th>ID number</th><th>Age</th><th>Sex</th><th>${st >= 3 ? "Subregion" : "Municipality"}</th><th>Group size</th></tr></thead><tbody>${rows.map(o => {
      const u = cnt[key(o)] === 1 || st === 0; return `<tr style="${u ? "background:var(--lw-soft)" : ""}"><td>${o.name}</td><td class="mono">${o.id}</td><td>${o.age}</td><td>${o.sex}</td><td>${o.place}</td><td class="n">${st === 0 ? "named" : cnt[key(o)]}</td></tr>`; }).join("")}</tbody></table>`;
    $("#pvRead").innerHTML = `<div><span>k-anonymity</span><b class="${k < 2 ? "c-lw" : "c-ok"}">k = ${k}</b></div><div><span>Students still unique</span><b class="${uniq ? "c-lw" : "c-ok"}">${st === 0 ? R.length : uniq}</b></div>`;
  }
  render();
});

/* lineage graph */
demo("d-lineage", () => {
  const N = { g: ["Gauge network", 3, 20, 30], e: ["ERA5 reanalysis", 1, 20, 150], q: ["QC script", 2, 185, 30], rg: ["Regridding", 1, 185, 150],
    f: ["Feature table", 7, 350, 90], s: ["Train/test split", 2, 350, 200], m: ["Model run", 12, 515, 90], rep: ["Skill report", 12, 515, 200] };
  const E = [["g", "q"], ["e", "rg"], ["q", "f"], ["rg", "f"], ["f", "s"], ["s", "m"], ["f", "m"], ["m", "rep"]];
  const stale = new Set(), src = new Set(["g", "e"]);
  let msg = "Two sources feed everything. Click one to publish a new version.";
  const down = k => E.filter(e => e[0] === k).flatMap(e => [e[1], ...down(e[1])]);
  function render() {
    const W = 660, H = 250, svg = svgIn($("#lnFig"), W, H), bw = 130, bh = 46;
    el("defs", {}, svg).innerHTML = `<marker id="la" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="${css("--muted")}"/></marker>`;
    E.forEach(([a, b]) => { const A = N[a], B = N[b]; el("path", { d: `M${A[2] + bw} ${A[3] + bh / 2} C${A[2] + bw + 25} ${A[3] + bh / 2} ${B[2] - 25} ${B[3] + bh / 2} ${B[2] - 2} ${B[3] + bh / 2}`, fill: "none", stroke: css(stale.has(b) ? "--sw" : "--muted"), "marker-end": "url(#la)" }, svg); });
    for (const k in N) {
      const [t, v, x, y] = N[k], st = stale.has(k), g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
      el("rect", { x, y, width: bw, height: bh, rx: 10, fill: st ? css("--sw-soft") : css("--card"), stroke: css(st ? "--sw" : src.has(k) ? "--data" : "--line"), "stroke-width": st || src.has(k) ? 2 : 1 }, g);
      el("text", { x: x + 10, y: y + 19, "font-size": 12.5, "font-weight": 600 }, g, t);
      el("text", { x: x + 10, y: y + 36, "font-size": 11.5, class: "mono", fill: css(st ? "--sw" : "--muted") }, g, (k === "m" || k === "rep" ? "run #" : "v") + v + (st ? " · stale" : ""));
      const act = () => {
        if (src.has(k)) { N[k][1]++; down(k).forEach(d => stale.add(d)); msg = `${t} is now v${N[k][1]}. ${stale.size} downstream steps are stale and must be rebuilt before you compare skill. Click a stale step to rebuild it.`; }
        else if (st) { const ups = E.filter(e => e[1] === k).map(e => e[0]); if (ups.some(u => stale.has(u))) { msg = `Rebuild ${ups.filter(u => stale.has(u)).map(u => N[u][0]).join(" and ")} first.`; } else { stale.delete(k); N[k][1]++; msg = stale.size ? `${t} rebuilt. ${stale.size} step(s) still stale.` : "Everything is rebuilt. The new skill report records exactly which versions produced it."; } }
        render();
      };
      g.addEventListener("click", act); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); act(); } });
    }
    $("#lnNote").textContent = msg;
  }
  render(); return render;
});

/* governance roles */
demo("d-gov", () => {
  const R = [
    ["Data owner", "Accountable for a dataset: decides who may use it and for what. Often a director of a health secretariat or an education office.", ["Decision-making", "Regulation", "Domain knowledge"]],
    ["Data steward", "Day-to-day caretaker: keeps definitions, documentation and quality rules up to date, and answers \"what does this column mean?\".", ["Organization", "Documentation", "Communication", "Domain knowledge"]],
    ["Data governance analyst", "Designs the policies and processes: access requests, retention periods, data catalogues, classification of sensitive data.", ["Process design", "Policy", "Communication"]],
    ["Data quality lead", "Defines and monitors quality checks (the QA/QC of this deck at institutional scale), and tracks issues to their fix.", ["QA/QC", "Metrics", "Process design"]],
    ["Privacy and AI compliance specialist", "Checks that data use and models follow Ley 1581 de 2012, GDPR or sector rules; runs impact assessments and audits for bias.", ["Regulation", "Ethics", "Risk assessment", "Communication"]],
  ];
  const host = $("#govRoles");
  R.forEach((r, i) => { const b = document.createElement("button"); b.className = "pick"; b.type = "button"; b.setAttribute("aria-pressed", i === 1); b.innerHTML = `<b></b><span></span>`;
    b.querySelector("b").textContent = r[0]; b.querySelector("span").textContent = r[1].split(":")[0].split(".")[0] + "."; host.appendChild(b); });
  const bs = $$(".pick", host);
  const show = i => { press(bs, bs[i]); $("#govTitle").textContent = R[i][0]; $("#govText").textContent = R[i][1]; $("#govSkills").innerHTML = R[i][2].map(s => `<span class="tag t-data">${s}</span>`).join(""); };
  bs.forEach((b, i) => b.addEventListener("click", () => show(i)));
  show(1);
});
