/* ───────── Module 6 · Optimization: a small 3 → H → 1 network on the student table, trained step by step ───────── */
const OPT = (() => {
  const S = DS.students, keys = ["absences", "grade", "estrato"];
  const ACT = { tanh: { f: Math.tanh, d: (q, h) => 1 - h * h, name: "tanh" }, relu: { f: relu, d: q => +(q > 0), name: "ReLU" },
    sigm: { f: sigm, d: (q, h) => h * (1 - h), name: "sigmoid" }, none: { f: q => q, d: () => 1, name: "none" } };
  // standardize with the training students only, so held-out students never leak into the scaling
  function data(test = []) {
    const tr = S.map((_, k) => k).filter(k => !test.includes(k)), mu = keys.map(k => mean(tr.map(i => S[i][k]))), sg = keys.map(k => sd(tr.map(i => S[i][k])));
    const z = v => v.map((x, i) => (x - mu[i]) / sg[i]);
    return { tr, te: test, z, X: S.map(s => z(keys.map(k => s[k]))), Y: S.map(s => s.attrition) };
  }
  function init(H, seed, scale = 0.8) { const r = rng(seed); return { W1: Array.from({ length: H }, () => keys.map(() => scale * gauss(r))), b1: new Array(H).fill(0), W2: Array.from({ length: H }, () => scale * gauss(r)), b2: 0 }; }
  function fwd(net, x, act) { const q = net.W1.map((rw, j) => rw.reduce((a, w, i) => a + w * x[i], net.b1[j])), h = q.map(ACT[act].f); return { q, h, p: sigm(h.reduce((a, v, j) => a + v * net.W2[j], net.b2)) }; }
  // one full-batch gradient step on the training students; returns the gradient (for showing one weight's update)
  function step(net, D, act, lr) {
    const H = net.W1.length, A = ACT[act], g = { W1: net.W1.map(rw => rw.map(() => 0)), b1: new Array(H).fill(0), W2: new Array(H).fill(0), b2: 0 }, n = D.tr.length;
    D.tr.forEach(k => { const x = D.X[k], { q, h, p } = fwd(net, x, act), d = p - D.Y[k];
      g.b2 += d / n; h.forEach((v, j) => { g.W2[j] += d * v / n; const dh = d * net.W2[j] * A.d(q[j], v) / n; g.b1[j] += dh; x.forEach((xi, i) => g.W1[j][i] += dh * xi); }); });
    net.W1.forEach((rw, j) => { rw.forEach((w, i) => rw[i] -= lr * g.W1[j][i]); net.b1[j] -= lr * g.b1[j]; net.W2[j] -= lr * g.W2[j]; }); net.b2 -= lr * g.b2;
    return g;
  }
  const loss = (net, D, idx, act) => -mean(idx.map(k => { const p = fwd(net, D.X[k], act).p; return D.Y[k] ? Math.log(Math.max(p, 1e-9)) : Math.log(Math.max(1 - p, 1e-9)); }));
  const right = (net, D, idx, act) => idx.filter(k => (fwd(net, D.X[k], act).p > .5) === !!D.Y[k]).length;
  const clone = net => JSON.parse(JSON.stringify(net));
  // probability map over absences × grade (estrato fixed at 2), with the students as dots (squares = held out)
  function map(host, net, act, D, { W = 460, H = 220, est = 2, labels = true } = {}) {
    const svg = svgIn(host, W, H + (labels ? 18 : 2)), nx = 46, ny = 20, a0 = 0, a1 = 30, g0 = 1, g1 = 5, mx = lin(a0, a1, labels ? 26 : 2, W - 2), my = lin(g0, g1, H, 2);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const p = fwd(net, D.z([a0 + (i + .5) * (a1 - a0) / nx, g0 + (j + .5) * (g1 - g0) / ny, est]), act).p;
      el("rect", { x: mx(a0 + i * (a1 - a0) / nx), y: my(g0 + (j + 1) * (g1 - g0) / ny), width: (mx(a1) - mx(a0)) / nx + .5, height: H / ny + .5, fill: div(p - .5, .5) }, svg);
    }
    S.forEach((s, k) => { const x = mx(s.absences), y = my(s.grade), o = { fill: s.attrition ? css("--fg") : css("--bg"), stroke: css("--fg"), "stroke-width": 1.3 };
      if (D.te.includes(k)) el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, ...o, stroke: css("--sw"), "stroke-width": 2 }, svg); else el("circle", { cx: x, cy: y, r: 4, ...o }, svg); });
    if (labels) { [0, 10, 20].forEach(t => el("text", { x: mx(t), y: H + 14, "text-anchor": "middle", class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, t));
      [1, 2, 3, 4].forEach(t => el("text", { x: 22, y: my(t) + 4, "text-anchor": "end", class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, t));
      el("text", { x: W - 2, y: H + 14, "text-anchor": "end", "font-size": 11, fill: css("--muted") }, svg, "absences →"); el("text", { x: 28, y: 12, "font-size": 11, fill: css("--fg") }, svg, "grade"); }
  }
  // loss curves on a log scale: series = [{ v: [...], col, label }], every point is one recorded step
  function curves(host, series, { W = 460, H = 130, every = 1, n, marks = [] } = {}) {
    const svg = svgIn(host, W, H), all = series.flatMap(s => s.v).filter(v => v > 0), lo = Math.floor(Math.log10(Math.min(...all, 1))), hi = Math.ceil(Math.log10(Math.max(...all, 1)));
    const N = Math.max(n || 0, ...series.map(s => s.v.length)) - 1 || 1;
    const A = axes(svg, { W, H, m: { l: 40, r: 34, t: 10, b: 22 }, x0: 0, x1: N * every, y0: lo, y1: hi, xt: [0, N * every], xf: v => v ? fmtN(v) + " steps" : "0", yt: [lo, hi], yf: v => "1e" + v });
    marks.forEach(([st, label, col]) => { el("line", { x1: A.x(st), x2: A.x(st), y1: 10, y2: H - 22, stroke: css(col), "stroke-dasharray": "4 3" }, svg); el("text", { x: A.x(st) + 4, y: 20, "font-size": 11, fill: css(col) }, svg, label); });
    series.forEach(s => s.v.length && el("path", { d: path(s.v.map((v, i) => [A.x(i * every), A.y(Math.log10(Math.max(v, 1e-6)))])), stroke: css(s.col), "stroke-width": 2, fill: "none" }, svg));
    let ly = H - 30; series.forEach(s => { el("text", { x: 48, y: ly, "font-size": 11, fill: css(s.col) }, svg, "— " + s.label); ly -= 14; });
  }
  return { S, keys, ACT, data, init, fwd, step, loss, right, clone, map, curves };
})();

/* watch it train */
demo("opt-watch", () => {
  const D = OPT.data(), all = D.tr;
  let act = "tanh", seed = 1, net, hist, n, timer = null, lastG = null;
  const gH = slider("owH", v => v, () => reset()), gL = slider("owLr", v => fmt(v, 2));
  chips($("#owAct"), v => { act = v; reset(); });
  function reset() { stop(); net = OPT.init(gH(), seed); hist = [OPT.loss(net, D, all, act)]; n = 0; lastG = null; render(); }
  function run(k) { for (let i = 0; i < k; i++) { const w0 = net.W1[0][0]; lastG = { w0, g: OPT.step(net, D, act, gL()).W1[0][0] }; n++; hist.push(OPT.loss(net, D, all, act)); if (!isFinite(hist[hist.length - 1])) break; } }
  function stop() { clearInterval(timer); timer = null; $("#owPlay").textContent = "Play"; }
  $("#owPlay").addEventListener("click", () => { if (timer) return stop(); $("#owPlay").textContent = "Pause"; timer = setInterval(() => { run(5); render(); if (n >= 2000) stop(); }, 40); });
  $("#owStep").addEventListener("click", () => { run(10); render(); });
  $("#owReset").addEventListener("click", () => { seed++; reset(); });
  function render() {
    const H = gH(), L = hist[hist.length - 1];
    OPT.map($("#owMap"), net, act, D, { H: 200 });
    OPT.curves($("#owLoss"), [{ v: hist, col: "--lw", label: "training error" }], { H: 120, n: Math.max(200, hist.length) });
    $("#owRead").innerHTML = `<div><span>Step</span><b>${n}</b></div><div><span>Error</span><b class="c-lw">${fmt(L, 3)}</b></div><div><span>Students right</span><b class="c-ok">${OPT.right(net, D, all, act)} / 20</b></div><div><span>Weights</span><b class="c-arch">${5 * H + 1}</b></div>`;
    $("#owCalc").innerHTML = lastG
      ? `<b>One of the ${5 * H + 1} updates in the last step</b>, the weight from absences to neuron 1:<br>slope ∂E/∂w = <span class="k">${fmt(lastG.g, 4)}</span> (from backpropagation)<br>w ← ${fmt(lastG.w0, 3)} − ${fmt(gL(), 2)} × (${fmt(lastG.g, 4)}) = <span class="g">${fmt(net.W1[0][0], 3)}</span>`
      : `Random start: ${5 * H + 1} weights drawn at random. Press Play or 10 steps.`;
    const grow = hist.length > 3 && hist[hist.length - 1] > hist[hist.length - 4] * 1.02;
    $("#owNote").textContent = grow ? "The error is jumping up: the step size is too large, so steps overshoot. Lower η and start again."
      : n === 0 ? "At the start the map is whatever the random weights give: it has nothing to do with the students yet."
      : n < 150 ? "Early steps: the error falls fast as the map lines up with the obvious pattern (many absences, low grades → leaving)."
      : "Later steps: the error falls slowly as the network fine-tunes around the hard students. More steps always lower the training error, which is not the same as predicting new students (next slide).";
  }
  DEMOS["opt-watch"].onShow = () => {};
  reset(); return render;
});

/* train and test: when to stop */
demo("opt-split", () => {
  const SPLITS = [[3, 8, 11, 16, 19], [5, 0, 9, 14, 17], [14, 1, 6, 9, 13]], STEPS = 3000, EVERY = 5, LR = 0.05, act = "tanh";   // small start, small steps: the turn is visible
  let split = 0, D, net, tr, te, n, timer = null;
  const gH = slider("osH", v => v, () => reset());
  chips($("#osSplit"), v => { split = +v; reset(); });
  function reset() { stop(); D = OPT.data(SPLITS[split]); net = OPT.init(gH(), 7, 0.3); tr = [OPT.loss(net, D, D.tr, act)]; te = [OPT.loss(net, D, D.te, act)]; n = 0; render(); }
  function run(k) { for (let i = 0; i < k && n < STEPS; i++) { OPT.step(net, D, act, LR); n++; if (n % EVERY === 0) { tr.push(OPT.loss(net, D, D.tr, act)); te.push(OPT.loss(net, D, D.te, act)); } } }
  function stop() { clearInterval(timer); timer = null; $("#osPlay").textContent = "Play"; }
  $("#osPlay").addEventListener("click", () => { if (timer) return stop(); $("#osPlay").textContent = "Pause"; timer = setInterval(() => { run(25); render(); if (n >= STEPS) stop(); }, 40); });
  $("#osEnd").addEventListener("click", () => { stop(); run(STEPS); render(); });
  $("#osReset").addEventListener("click", reset);
  function render() {
    const best = te.indexOf(Math.min(...te)), bestStep = best * EVERY, rising = n > 100 && te[te.length - 1] > Math.min(...te) * 1.15;
    OPT.curves($("#osCurve"), [{ v: tr, col: "--cool", label: "training students (15)" }, { v: te, col: "--lw", label: "held-out students (5)" }],
      { H: 170, every: EVERY, n: STEPS / EVERY + 1, marks: n > 50 && rising ? [[bestStep, "stop here", "--ok"]] : [] });
    OPT.map($("#osMap"), net, act, D, { H: 170 });
    $("#osRead").innerHTML = `<div><span>Step</span><b>${n}</b></div><div><span>Training error</span><b class="c-cool" style="color:var(--cool)">${fmt(tr[tr.length - 1], 3)}</b></div><div><span>Held-out error</span><b class="c-lw">${fmt(te[te.length - 1], 3)}</b></div>`
      + `<div><span>Right: training / held out</span><b class="c-ok">${OPT.right(net, D, D.tr, act)}/15 · ${OPT.right(net, D, D.te, act)}/5</b></div>`;
    $("#osNote").textContent = n === 0 ? "Press Play: both errors start high, then fall together."
      : rising ? `The held-out error was lowest at step ${bestStep} and has risen since, while the training error keeps falling: the network is memorizing the 15 training students instead of learning the pattern. Early stopping keeps the weights from step ${bestStep}.`
      : split === 2 && n >= STEPS ? "Here the held-out error keeps falling: these 5 students happen to be easy. With only 5 held-out students one split can mislead, which is why practitioners average over several splits (cross-validation)."
      : "Both errors are still falling: keep going." + (gH() <= 2 ? " With so few neurons the network cannot memorize much, so the held-out error may never turn up." : "");
  }
  reset(); return render;
});

/* different random starts */
demo("opt-restart", () => {
  const D = OPT.data(); let act = "tanh", base = 11;
  const gH = slider("orH", v => v, () => render());
  chips($("#orAct"), v => { act = v; render(); });
  $("#orNew").addEventListener("click", () => { base += 4; render(); });
  function render() {
    const host = $("#orGrid"); host.innerHTML = "";
    for (let k = 0; k < 4; k++) {
      const net = OPT.init(gH(), base + k); for (let i = 0; i < 1500; i++) OPT.step(net, D, act, 0.3);
      const card = document.createElement("div"); card.innerHTML = `<div></div><p class="note" style="margin:2px 0 0"></p>`; host.appendChild(card);
      OPT.map(card.firstChild, net, act, D, { W: 230, H: 130, labels: false });
      card.lastChild.textContent = `Start ${base + k}: error ${fmt(OPT.loss(net, D, D.tr, act), 3)}, ${OPT.right(net, D, D.tr, act)}/20 right`;
    }
  }
  render(); return render;
});
