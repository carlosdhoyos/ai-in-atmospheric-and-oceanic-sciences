/* Module 2 · group g5: batch norm, layer norm, residual, concatenation, gating, dropout (guide sections 19–24) */
(function () {
  const nf = v => (Math.abs(v - Math.round(v)) < 1e-9 ? fmt(v, 0) : fmt(v, 2)); // 8 → "8", 1.45 → "1.45"
  const sup = n => String(n).split("").map(c => (c === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c])).join("");
  const sci = v => { if (v === 0) return "0"; if (Math.abs(v) >= 0.01 && Math.abs(v) < 1000) return fmt(v, 2); const [m, e] = v.toExponential(1).split("e"); return m + "×10" + sup(+e); };
  const txt = (svg, x, y, s, a = {}) => el("text", Object.assign({ x, y, "font-size": 11.5 }, a), svg, s);

  /* ───────── 19 · Batch normalization ───────── */
  demo("op-bn", () => {
    const RAIN = DS.daily.rain, N = RAIN.length, eps = 1e-3, mom = 0.1, r = rng(519);
    const popM = mean(RAIN), popS = sd(RAIN);
    const gB = slider("g5bnB", v => v + " days", () => { draw(); render(); });
    const gM = chips($("#g5bnMode"), () => render());
    let batch = [], runM = 0, runV = 1, steps = 0;
    function draw() {
      batch = Array.from({ length: gB() }, () => RAIN[Math.floor(r() * N)]);
      const m = mean(batch), v = sd(batch) ** 2;
      runM = (1 - mom) * runM + mom * m; runV = (1 - mom) * runV + mom * v; steps++;
    }
    // warm-up: 60 training batches of 32 days fill the running averages
    for (let i = 0; i < 60; i++) { const b = Array.from({ length: 32 }, () => RAIN[Math.floor(r() * N)]); runM = 0.9 * runM + 0.1 * mean(b); runV = 0.9 * runV + 0.1 * sd(b) ** 2; }
    draw();
    $("#g5bnNext").onclick = () => { draw(); render(); };

    function calc() {
      const x = [0, 10, 20], m = mean(x), s = sd(x), z = x.map(v => (v - m) / Math.sqrt(s * s + eps));
      $("#g5bnCalc").innerHTML = `rain x = [0, 10, 20] mm\nmean = (0 + 10 + 20) / 3 = <span class="k">10</span> mm\nstd  = √((100 + 0 + 100) / 3) = <span class="k">${fmt(s, 2)}</span> mm\nx̂ = (x − 10) / 8.16 = [<span class="g">${z.map(v => fmt(v, 2)).join(", ")}</span>]\n<span class="m">no units left; then y = γ x̂ + β with learned γ, β</span>`;
    }
    function hist(svg, vals, x0, y0, W, H, lo, hi, nb, color, title, tickF) {
      const bw = (hi - lo) / nb, cnt = Array(nb).fill(0);
      vals.forEach(v => cnt[clamp(Math.floor((v - lo) / bw), 0, nb - 1)]++);
      const fr = cnt.map(c => c / vals.length), ym = Math.max(0.5, ...fr), cw = W / nb;
      txt(svg, x0, y0 - 6, title, { class: "mut" });
      el("line", { x1: x0, x2: x0 + W, y1: y0 + H, y2: y0 + H, class: "ax" }, svg);
      fr.forEach((f, i) => { if (f > 0) el("rect", { x: x0 + i * cw + 1, y: y0 + H - f / ym * H, width: cw - 2, height: f / ym * H, rx: 2, fill: css(color) }, svg); });
      tickF.forEach(([v, lab]) => txt(svg, x0 + (v - lo) / (hi - lo) * W, y0 + H + 14, lab, { "text-anchor": "middle", class: "mut mono", "font-size": 10.5 }));
    }
    function render() {
      const pred = gM() === "pred", m = mean(batch), s = sd(batch), bm = pred ? runM : m, bv = pred ? runV : s * s;
      const z = batch.map(v => (v - bm) / Math.sqrt(bv + eps));
      const W = 520, H = 300, svg = svgIn($("#g5bnFig"), W, H);
      hist(svg, batch, 10, 22, 235, 110, 0, 60, 12, "--cool", `before: rain (mm), ${batch.length} days`, [[0, "0"], [20, "20"], [40, "40"], [60, "60+"]]);
      hist(svg, z, 275, 22, 235, 110, -2, 6, 16, "--arch", "after: normalized (no units)", [[-2, "≤−2"], [0, "0"], [2, "2"], [4, "4"], [6, "6+"]]);
      // noise of the batch mean: 60 batches of the chosen size
      const rr = rng(1000 + batch.length), y0 = 190, sx = lin(0, 20, 20, W - 20);
      txt(svg, 10, y0 - 12, `batch means: 60 batches of ${batch.length} days`, { class: "mut" });
      el("line", { x1: sx(0), x2: sx(20), y1: y0 + 60, y2: y0 + 60, class: "ax" }, svg);
      [0, 5, 10, 15, 20].forEach(v => txt(svg, sx(v), y0 + 74, v + (v === 20 ? "+ mm" : ""), { "text-anchor": "middle", class: "mut mono", "font-size": 10.5 }));
      for (let k = 0; k < 60; k++) {
        const bmk = mean(Array.from({ length: batch.length }, () => RAIN[Math.floor(rr() * N)]));
        el("circle", { cx: sx(Math.min(bmk, 20)), cy: y0 + 8 + rr() * 44, r: 3.2, fill: css("--cool"), opacity: .55 }, svg);
      }
      el("line", { x1: sx(popM), x2: sx(popM), y1: y0 - 2, y2: y0 + 60, stroke: css("--fg"), "stroke-dasharray": "3 3" }, svg);
      el("circle", { cx: sx(Math.min(m, 20)), cy: y0 + 30, r: 6, fill: "none", stroke: css("--lw"), "stroke-width": 2 }, svg);
      txt(svg, W - 10, y0 - 12, `dashed: whole year ${fmt(popM, 1)} mm`, { "text-anchor": "end", "font-size": 10.5 });
      txt(svg, W - 190, y0 - 12, "ring: this batch", { "text-anchor": "end", "font-size": 10.5, fill: css("--lw") });
      const dry = batch.filter(v => v === 0).length;
      $("#g5bnRead").innerHTML = `<div><span>${pred ? "Running mean" : "Batch mean"}</span><b class="c-arch">${fmt(bm, 1)} mm</b></div><div><span>${pred ? "Running std" : "Batch std"}</span><b class="c-arch">${fmt(Math.sqrt(bv), 1)} mm</b></div><div><span>Dry days in batch</span><b>${dry} / ${batch.length}</b></div><div><span>Mean after</span><b>${fmt(mean(z), 2)}</b></div>`
        + (!pred && s === 0 ? `<div><span>All equal</span><b class="c-sw">ε saves it</b></div>` : "");
      calc();
    }
    render(); return render;
  });

  /* ───────── 20 · Layer normalization ───────── */
  demo("op-ln", () => {
    const T = [[2, 4, 6], [4, 9, 1], [6, 14, 5]], eps = 1e-5;
    const gG = slider("g5lnG", v => fmt(v, 1), () => render()), gBt = slider("g5lnBt", v => fmt(v, 1), () => render());
    const gM = chips($("#g5lnMode"), () => render()), gN = chips($("#g5lnBatch"), () => render());
    let sel = 0;
    const norm = a => { const m = mean(a), s = sd(a); return { m, s, z: a.map(v => (v - m) / Math.sqrt(s * s + eps)) }; };
    function render() {
      const layer = gM() === "layer", nB = +gN(), X = T.slice(0, nB), g = gG(), b = gBt();
      if (layer && sel >= nB) sel = 0;
      // normalized table
      const Z = X.map(row => row.slice());
      if (layer) X.forEach((row, i) => { Z[i] = norm(row).z; });
      else for (let j = 0; j < 3; j++) { const z = norm(X.map(r => r[j])).z; z.forEach((v, i) => { Z[i][j] = v; }); }
      const Y = Z.map(row => row.map(v => g * v + b));
      const W = 520, cw = 56, ch = 34, H = 70 + 3 * ch + 20, x0 = 66, x1 = 330, y0 = 46, svg = svgIn($("#g5lnFig"), W, H);
      arrowDefs(svg, "g5lnA", css("--muted"));
      txt(svg, x0, 16, "input table", { class: "mut" }); txt(svg, x1, 16, `output: γ x̂ + β`, { class: "mut" });
      [x0, x1].forEach(xx => [0, 1, 2].forEach(j => txt(svg, xx + j * cw + cw / 2 - 2, y0 - 8, "feat " + (j + 1), { "text-anchor": "middle", class: "mut", "font-size": 10.5 })));
      const cell = (xx, i, j, v, fill, pick) => {
        const gr = el("g", pick ? { style: "cursor:pointer", tabindex: 0 } : {}, svg);
        el("rect", { x: xx + j * cw, y: y0 + i * ch, width: cw - 4, height: ch - 4, rx: 6, fill, stroke: css("--line") }, gr);
        txt(gr, xx + j * cw + cw / 2 - 2, y0 + i * ch + ch / 2 + 2, nf(+v.toFixed(2)), { "text-anchor": "middle", class: "mono", "font-size": 12 });
        if (pick) { const f = () => { sel = layer ? i : j; render(); }; gr.addEventListener("click", f); gr.addEventListener("keydown", e => { if (e.key === "Enter") f(); }); }
      };
      for (let i = 0; i < 3; i++) {
        txt(svg, x0 - 8, y0 + i * ch + ch / 2 + 2, "ex " + (i + 1), { "text-anchor": "end", class: "mut", "font-size": 11, opacity: i < nB ? 1 : .35 });
        for (let j = 0; j < 3; j++) {
          if (i >= nB) { el("rect", { x: x0 + j * cw, y: y0 + i * ch, width: cw - 4, height: ch - 4, rx: 6, fill: "none", stroke: css("--line"), "stroke-dasharray": "3 3" }, svg); continue; }
          cell(x0, i, j, T[i][j], heat(T[i][j], 0, 18), true);
          cell(x1, i, j, Y[i][j], div(Z[i][j], 1.6), false);
        }
      }
      if (nB === 1) txt(svg, x0 + 1.5 * cw, y0 + 2 * ch, "not in the batch", { "text-anchor": "middle", class: "mut", "font-size": 10.5 });
      // highlight every group (dashed) and the selected one (solid)
      const box = (xx, k, solid) => {
        const a = layer ? { x: xx - 4, y: y0 + k * ch - 4, width: 3 * cw + 4, height: ch + 4 } : { x: xx + k * cw - 4, y: y0 - 4, width: cw + 4, height: nB * ch + 4 };
        el("rect", Object.assign(a, { rx: 9, fill: solid ? css("--arch-soft") : "none", stroke: css("--arch"), "stroke-width": solid ? 2.5 : 1, "stroke-dasharray": solid ? "none" : "4 3" }), svg);
      };
      const ng = layer ? nB : 3;
      for (let k = 0; k < ng; k++) { box(x0, k, k === sel); box(x1, k, k === sel); }
      // re-draw text above highlight fills is not needed: the fills are translucent
      el("line", { x1: x0 + 3 * cw + 8, x2: x1 - 14, y1: y0 + 1.5 * ch - 2, y2: y0 + 1.5 * ch - 2, stroke: css("--muted"), "stroke-width": 1.5, "marker-end": "url(#g5lnA)" }, svg);
      txt(svg, (x0 + 3 * cw + x1) / 2, y0 + 1.5 * ch - 10, layer ? "per row" : "per column", { "text-anchor": "middle", "font-size": 11, fill: css("--arch") });
      txt(svg, x0, H - 4, layer ? "Click a row: one example, all its features." : "Click a column: one feature, all examples in the batch.", { class: "mut", "font-size": 11 });
      const vec = layer ? X[sel] : X.map(r => r[sel]), nr = norm(vec), out = nr.z.map(v => g * v + b);
      $("#g5lnCalc").innerHTML = `${layer ? "row " + (sel + 1) + " (one example)" : "column " + (sel + 1) + " (one feature)"}: [${vec.join(", ")}]\nmean ${nf(+nr.m.toFixed(2))} · std ${fmt(nr.s, 2)}\nx̂ = [${nr.z.map(v => fmt(v, 2)).join(", ")}]\n× ${fmt(g, 1)} + ${fmt(b, 1)} = [<span class="k">${out.map(v => fmt(v, 2)).join(", ")}</span>]`;
      $("#g5lnNote").textContent = layer
        ? (nB === 1 ? "Layer norm with a batch of one: the row still has 3 values with a spread, so it works exactly as before." : "Layer norm: each example is normalized on its own. Other rows do not affect it.")
        : (nB === 1 ? "Batch norm with a batch of one: each column holds a single value, its std is 0, so every x̂ is 0 and the output is just β. The information is gone." : "Batch norm: each feature is normalized across the 3 examples. The result for one example depends on the others in the batch.");
    }
    render(); return render;
  });

  /* ───────── 21 · Residual connections ───────── */
  demo("op-res", () => {
    const gX = slider("g5rsX", v => fmt(v, 1), () => calc()), gF = slider("g5rsF", v => fmt(v, 1), () => calc());
    const gL = slider("g5rsL", v => v, () => render()), gW = slider("g5rsW", v => fmt(v, 2), () => render());
    const n = 16, LMAX = 120, alpha = 0.2, R = rng(2121);
    const base = Array.from({ length: LMAX }, () => Array.from({ length: n }, () => Array.from({ length: n }, () => gauss(R) / Math.sqrt(n))));
    const h0 = Array.from({ length: n }, () => gauss(R));
    const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    function sim(L, s, skip) {
      const hs = [h0.slice()], ds = [];
      for (let l = 0; l < L; l++) {
        const h = hs[l], W = base[l], t = W.map(row => Math.tanh(s * row.reduce((a, w, k) => a + w * h[k], 0)));
        ds.push(t.map(v => 1 - v * v));
        hs.push(skip ? h.map((v, i) => v + alpha * t[i]) : t);
      }
      let g = Array(n).fill(1); const gs = Array(L + 1); gs[L] = rms(g);
      for (let l = L - 1; l >= 0; l--) {
        const W = base[l], d = ds[l], u = g.map((v, i) => v * d[i] * s * (skip ? alpha : 1));
        const back = Array.from({ length: n }, (_, k) => u.reduce((a, v, i) => a + v * W[i][k], 0));
        g = skip ? g.map((v, k) => v + back[k]) : back; gs[l] = rms(g);
      }
      const s0 = rms(h0);
      return { sig: hs.map(h => rms(h) / s0), grad: gs.map(v => v / gs[L]) };
    }
    function calc() {
      const x = gX(), f = gF();
      $("#g5rsCalc").innerHTML = `output = x + layer(x) = ${fmt(x, 1)} + ${fmt(f, 1)} = <span class="k">${fmt(x + f, 1)}</span>\n<span class="m">layer(x) = 0 → output = x: the identity comes for free</span>`;
    }
    function render() {
      calc();
      const L = gL(), s = gW(), A = sim(L, s, true), B = sim(L, s, false), all = [...A.sig, ...A.grad, ...B.sig, ...B.grad].map(v => Math.log10(Math.max(v, 1e-16)));
      const lo = Math.max(-16, Math.floor(Math.min(...all))), hi = Math.max(1, Math.ceil(Math.max(...all)));
      // stack strip: one box per layer, brightness = signal size
      const W = 520, sv = svgIn($("#g5rsStack"), W, 62), bw = (W - 92) / L;
      [["with skips", A, "--ok"], ["without", B, "--lw"]].forEach(([lab, S, c], k) => {
        txt(sv, 0, 18 + k * 28, lab, { class: "mut", "font-size": 11 });
        for (let l = 1; l <= L; l++) {
          const t = clamp((Math.log10(Math.max(S.sig[l], 1e-16)) + 4) / 4, 0, 1);
          el("rect", { x: 88 + (l - 1) * bw, y: 6 + k * 28, width: Math.max(1, bw - (bw > 4 ? 1.5 : 0)), height: 20, rx: bw > 6 ? 3 : 0, fill: `color-mix(in srgb, ${css(c)} ${Math.round(8 + 92 * t)}%, ${css("--well")})` }, sv);
        }
      });
      const H = 200, svg = svgIn($("#g5rsFig"), W, H), step = hi - lo > 10 ? 4 : hi - lo > 5 ? 2 : 1, yt = [];
      for (let v = lo; v <= hi; v++) if ((v - lo) % step === 0 || v === 0) yt.push(v);
      const ax = axes(svg, { W, H, m: { l: 52, r: 12, t: 24, b: 26 }, x0: 0, x1: L, y0: lo, y1: hi, xt: [0, Math.round(L / 2), L], yt, yf: v => v === 0 ? "1" : "10" + sup(v), xl: "layer" });
      txt(svg, 0, 10, "size relative to the input (log scale)", { class: "mut", "font-size": 11 });
      const line = (vals, c, dash) => el("path", { d: path(vals.map((v, l) => [ax.x(l), ax.y(clamp(Math.log10(Math.max(v, 1e-16)), lo, hi))])), fill: "none", stroke: css(c), "stroke-width": 2.2, "stroke-dasharray": dash ? "5 4" : "none" }, svg);
      line(B.sig, "--lw", false); line(B.grad, "--lw", true); line(A.sig, "--ok", false); line(A.grad, "--ok", true);
      const two = (a, b) => `<b><span style="font:inherit;color:var(--ok);letter-spacing:0;text-transform:none">${sci(a)}</span> <span style="font:inherit;color:var(--muted);letter-spacing:0;text-transform:none">vs</span> <span style="font:inherit;color:var(--lw);letter-spacing:0;text-transform:none">${sci(b)}</span></b>`;
      $("#g5rsRead").innerHTML = `<div><span>Signal at layer ${L}: skips vs none</span>${two(A.sig[L], B.sig[L])}</div><div><span>Gradient at layer 1</span>${two(A.grad[0], B.grad[0])}</div>`;
    }
    render(); return render;
  });

  /* ───────── 22 · Concatenation ───────── */
  demo("op-concat", () => {
    const R = rng(2222), gM = chips($("#g5ccMode"), () => render());
    const SAT = ["IR 10.8 µm", "IR 12 µm", "WV 6.2 µm", "WV 7.3 µm", "VIS 0.6 µm", "cloud top", "cloud frac", "IR trend"].map(n => ({ n, v: +(gauss(R) * 0.9).toFixed(1), on: true, k: "s" }));
    const STA = ["rain", "tmax", "humidity", "wind"].map(n => ({ n, v: +(gauss(R) * 0.9).toFixed(1), on: true, k: "t" }));
    const Wd = Array.from({ length: 12 }, () => Array.from({ length: 4 }, () => gauss(R) * 0.6));
    const unetSkip = [true, true, true];
    function block(svg, x, y, f, w, onClick) {
      const c = f.k === "s" ? "--cool" : "--sw", g = el("g", onClick ? { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": f.n } : {}, svg);
      el("rect", { x, y, width: w - 3, height: 26, rx: 5, fill: f.on || !onClick ? css(c) : "none", stroke: css(c), "stroke-dasharray": f.on || !onClick ? "none" : "3 2", opacity: f.on || !onClick ? .9 : .7 }, g);
      el("text", { x: x + (w - 3) / 2, y: y + 17, "text-anchor": "middle", class: "mono", "font-size": Math.min(11, w / 3.4), fill: f.on || !onClick ? css("--bg") : css("--muted") }, g, fmt(f.v, 1));
      el("title", {}, g, f.n);
      if (onClick) { g.addEventListener("click", onClick); g.addEventListener("keydown", e => { if (e.key === "Enter") onClick(); }); }
    }
    function wiring() {
      const add = gM() === "add", W = 560, H = 300, svg = svgIn($("#g5ccFig"), W, H), bx = 92, cw = 38, so = 8; // station row starts after the 8 satellite slots
      txt(svg, 0, 26, "satellite (8)", { class: "mut" }); txt(svg, 0, 66, "station (4)", { class: "mut" });
      SAT.forEach((f, i) => block(svg, bx + i * cw, 8, f, cw, () => { f.on = !f.on; render(); }));
      STA.forEach((f, i) => block(svg, bx + (so + i) * cw, 48, f, cw, () => { f.on = !f.on; render(); }));
      const a = SAT.filter(f => f.on), b = STA.filter(f => f.on);
      let joined = null, msg = "";
      if (!add) joined = [...a, ...b];
      else if (a.length === b.length && a.length) joined = a.map((f, i) => ({ v: +(f.v + b[i].v).toFixed(1), k: "m", on: true, n: f.n + " + " + b[i].n }));
      else msg = a.length + b.length ? `Cannot add ${a.length} values to ${b.length} values.` : "Nothing selected.";
      txt(svg, 0, 146, add ? "sum" : "joined", { class: "mut" });
      if (!joined) {
        txt(svg, bx, 140, msg, { fill: css("--lw"), "font-size": 13 });
        txt(svg, bx, 160, "Turn off satellite blocks until both sides have the same size,", { class: "mut", "font-size": 11.5 });
        txt(svg, bx, 176, "or project the satellite features to 4 values first (dense layer or 1×1 conv).", { class: "mut", "font-size": 11.5 });
        return { a: a.length, b: b.length, out: 0 };
      }
      const jw = Math.min(cw, (W - bx - 4) / Math.max(1, joined.length)), y1 = 128;
      // dashed guides from sources to their place in the joined vector
      if (!add) joined.forEach((f, i) => { const src = f.k === "s" ? SAT.indexOf(f) : so + STA.indexOf(f), sy = f.k === "s" ? 34 : 74;
        el("line", { x1: bx + src * cw + cw / 2 - 1.5, y1: sy, x2: bx + i * jw + jw / 2 - 1.5, y2: y1, stroke: css(f.k === "s" ? "--cool" : "--sw"), "stroke-width": 1, opacity: .45, "stroke-dasharray": "3 3" }, svg); });
      else a.forEach((f, i) => { [[SAT.indexOf(f), 34, "--cool"], [so + STA.indexOf(b[i]), 74, "--sw"]].forEach(([src, sy, c]) =>
        el("line", { x1: bx + src * cw + cw / 2 - 1.5, y1: sy, x2: bx + i * jw + jw / 2 - 1.5, y2: y1, stroke: css(c), "stroke-width": 1, opacity: .45, "stroke-dasharray": "3 3" }, svg)); });
      // dense layer of 4 neurons; line thickness = |weight|
      const ny = 262, nx = j => bx + 40 + j * ((W - bx - 80) / 3);
      joined.forEach((f, i) => { const xi = bx + i * jw + jw / 2 - 1.5;
        for (let j = 0; j < 4; j++) { const w = Wd[i][j]; el("line", { x1: xi, y1: y1 + 26, x2: nx(j), y2: ny - 12, stroke: css(w >= 0 ? "--pos" : "--neg"), "stroke-width": (0.4 + 2.4 * Math.min(1, Math.abs(w))).toFixed(2), opacity: .5 }, svg); } });
      joined.forEach((f, i) => {
        if (f.k === "m") { const x = bx + i * jw; el("rect", { x, y: y1, width: jw - 3, height: 26, rx: 5, fill: css("--arch") }, svg); el("text", { x: x + (jw - 3) / 2, y: y1 + 17, "text-anchor": "middle", class: "mono", "font-size": 10.5, fill: css("--bg") }, svg, fmt(f.v, 1)); }
        else block(svg, bx + i * jw, y1, f, jw, null);
      });
      for (let j = 0; j < 4; j++) el("circle", { cx: nx(j), cy: ny, r: 12, fill: css("--arch"), opacity: .85 }, svg);
      txt(svg, 0, ny + 4, "dense (4)", { class: "mut" });
      txt(svg, W, H - 4, "line width = |weight| · warm +, cool −", { "text-anchor": "end", class: "mut", "font-size": 10.5 });
      return { a: a.length, b: b.length, out: joined.length };
    }
    function unet() {
      const W = 560, H = 300, svg = svgIn($("#g5ccFig"), W, H); arrowDefs(svg, "g5ccA", css("--muted"));
      const lev = [[64, 16, 95], [32, 32, 175], [16, 64, 225]], bott = [8, 128, 262], hgt = s => s * 1.6, wid = c => 4 * Math.log2(c) - 6;
      const ex = [30, 100, 180], dx = [W - 70, W - 150, W - 240], bxx = W / 2 - wid(128) / 2, mk = { stroke: css("--muted"), "stroke-width": 1.3, "marker-end": "url(#g5ccA)" };
      lev.forEach(([s, c, cy], k) => {
        const h = hgt(s), w = wid(c), on = unetSkip[k], wu = wid(c), wc = on ? wid(c) + 1 : 0;
        el("rect", { x: ex[k], y: cy - h / 2, width: w, height: h, rx: 3, fill: css("--cool"), opacity: .85 }, svg);
        txt(svg, ex[k] + w / 2, cy + h / 2 + 13, `${s}×${s}×${c}`, { "text-anchor": "middle", class: "mono", "font-size": 10.5 });
        el("rect", { x: dx[k], y: cy - h / 2, width: wu, height: h, rx: 3, fill: css("--arch"), opacity: .85 }, svg);
        if (on) el("rect", { x: dx[k] + wu + 1, y: cy - h / 2, width: wc - 1, height: h, rx: 3, fill: css("--cool"), opacity: .85 }, svg);
        txt(svg, dx[k] + (wu + wc) / 2, cy + h / 2 + 13, on ? `${s}×${s}×(${c}+${c})` : `${s}×${s}×${c}`, { "text-anchor": "middle", class: "mono", "font-size": 10.5 });
        // down / up arrows between levels
        const nx = k < 2 ? [ex[k + 1], lev[k + 1][2] - hgt(lev[k + 1][0]) / 2, dx[k + 1] + wid(lev[k + 1][1])] : [bxx, bott[2] - hgt(8) / 2, dx[2] + wid(64) / 2];
        if (k < 2) {
          el("line", Object.assign({ x1: ex[k] + w, y1: cy + h / 2 - 4, x2: nx[0] - 2, y2: nx[1] - 2 }, mk), svg);
          el("line", Object.assign({ x1: nx[2] + 2, y1: nx[1] - 2, x2: dx[k] - 2, y2: cy + h / 2 - 4 }, mk), svg);
        } else {
          el("line", Object.assign({ x1: ex[k] + w, y1: cy + h / 2 - 2, x2: bxx - 3, y2: bott[2] }, mk), svg);
          el("line", Object.assign({ x1: bxx + wid(128) + 3, y1: bott[2], x2: dx[k] - 2, y2: cy + h / 2 - 2 }, mk), svg);
        }
        // skip arrow (clickable)
        const g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": "toggle skip " + (k + 1) }, svg);
        const ya = k === 0 ? cy - 30 : cy - 6;
        el("line", { x1: ex[k] + w + 4, x2: dx[k] - 6, y1: ya, y2: ya, stroke: on ? css("--cool") : css("--line"), "stroke-width": on ? 2.2 : 1.4, "stroke-dasharray": on ? "none" : "4 4", "marker-end": "url(#g5ccA)" }, g);
        el("rect", { x: ex[k] + w + 4, y: ya - 9, width: dx[k] - ex[k] - w - 10, height: 18, fill: "transparent" }, g);
        el("rect", { x: W / 2 - 32, y: ya - 9, width: 64, height: 16, rx: 8, fill: css("--card"), stroke: css(on ? "--cool" : "--line") }, g);
        txt(g, W / 2, ya + 3, on ? "concat" : "cut", { "text-anchor": "middle", "font-size": 10.5, fill: on ? css("--cool") : css("--muted") });
        const f = () => { unetSkip[k] = !unetSkip[k]; render(); };
        g.addEventListener("click", f); g.addEventListener("keydown", e => { if (e.key === "Enter") f(); });
      });
      el("rect", { x: bxx, y: bott[2] - hgt(8) / 2, width: wid(128), height: hgt(8), rx: 3, fill: css("--muted") }, svg);
      txt(svg, W / 2, bott[2] + 22, "8×8×128", { "text-anchor": "middle", class: "mono", "font-size": 10.5 });
      txt(svg, ex[0], 14, "encoder (downsample)", { class: "mut", "font-size": 11 });
      txt(svg, W - 4, 14, "decoder (upsample)", { "text-anchor": "end", class: "mut", "font-size": 11 });
      return null;
    }
    function render() {
      const mode = gM();
      if (mode === "unet") {
        unet();
        const c = [16, 32, 64];
        $("#g5ccCalc").innerHTML = `Click a skip arrow to cut it.\n` + c.map((ch, k) => { const s = [64, 32, 16][k]; return `${s}×${s}: upsampled ${ch} ch ${unetSkip[k] ? `+ encoder ${ch} ch = <span class="k">${2 * ch} ch</span>` : `<span class="r">only, fine detail from the encoder is lost</span>`}`; }).join("\n");
        return;
      }
      const r = wiring(), add = mode === "add";
      $("#g5ccCalc").innerHTML = !r.out ? `<span class="r">addition needs equal sizes</span> · ${r.a} satellite vs ${r.b} station\n<span class="m">concatenation would give ${r.a} + ${r.b} = ${r.a + r.b}</span>`
        : add ? `add: ${r.a} + ${r.b} values element by element → <span class="k">${r.out}</span> values (size stays)\ndense weights = ${r.out} × 4 + 4 = <span class="k">${r.out * 4 + 4}</span>`
          : `concatenate: ${r.a} + ${r.b} = <span class="k">${r.out}</span> features (size grows)\ndense weights = ${r.out} × 4 + 4 = <span class="k">${r.out * 4 + 4}</span>`;
    }
    render(); return render;
  });

  /* ───────── 23 · Gating ───────── */
  demo("op-gate", () => {
    const D0 = 90, rain = DS.daily.rain.slice(D0, D0 + 90), rmax = Math.max(...rain);
    const gM = chips($("#g5gtMode"), () => { $("#g5gtFixed").hidden = gM() !== "fixed"; $("#g5gtSig").hidden = gM() === "fixed"; render(); });
    const gG = slider("g5gtG", v => fmt(v, 2), () => render()), gW = slider("g5gtW", v => fmt(v, 2), () => render()), gB = slider("g5gtB", v => fmt(v, 1), () => render());
    function render() {
      const fixed = gM() === "fixed", gate = rain.map(x => fixed ? gG() : sigm(gW() * x + gB())), out = rain.map((x, i) => x * gate[i]);
      const W = 520, H = 230, m = { l: 40, r: 40, t: 22, b: 28 }, svg = svgIn($("#g5gtFig"), W, H);
      const ax = axes(svg, { W, H, m, x0: 0, x1: 90, y0: 0, y1: Math.ceil(rmax / 10) * 10, xt: [0, 30, 60, 89], xf: v => ["1 Apr", "1 May", "31 May", "29 Jun"][[0, 30, 60, 89].indexOf(v)], yt: [0, 20, 40, 60, 80].filter(v => v <= rmax + 20), yl: "mm/day" });
      const gy = lin(0, 1, H - m.b, m.t), bw = (W - m.l - m.r) / 90;
      [0, 0.5, 1].forEach(v => txt(svg, W - m.r + 6, gy(v) + 4, fmt(v, 1), { class: "mono", "font-size": 10.5, fill: css("--sw") }));
      txt(svg, W - m.r + 6, 8, "gate g", { fill: css("--sw"), "font-size": 11 });
      rain.forEach((x, i) => {
        if (x > 0) el("rect", { x: ax.x(i) + 0.5, y: ax.y(x), width: bw - 1, height: ax.y(0) - ax.y(x), fill: css("--well"), stroke: css("--muted"), "stroke-width": .6 }, svg);
        if (out[i] > 0.05) el("rect", { x: ax.x(i) + 1.2, y: ax.y(out[i]), width: Math.max(1, bw - 2.4), height: ax.y(0) - ax.y(out[i]), fill: css("--arch") }, svg);
      });
      el("path", { d: path(gate.map((g, i) => [ax.x(i) + bw / 2, gy(g)])), fill: "none", stroke: css("--sw"), "stroke-width": 1.6, opacity: .9 }, svg);
      const tin = rain.reduce((a, b) => a + b, 0), tout = out.reduce((a, b) => a + b, 0);
      $("#g5gtRead").innerHTML = `<div><span>Rain in</span><b>${fmtN(tin)} mm</b></div><div><span>Passed</span><b class="c-arch">${fmtN(tout)} mm</b></div><div><span>Share passed</span><b class="c-sw">${fmt(100 * tout / tin, 0)}%</b></div>`;
      if (fixed) { const g = gG(); $("#g5gtCalc").innerHTML = `y = g × x = ${fmt(g, 2)} × 20 mm = <span class="k">${fmt(20 * g, 2)} mm</span> (${fmt(100 * g, 0)}% passes)\n<span class="m">the same g for every day</span>`; }
      else {
        const w = gW(), b = gB(), ex = [0, 5, 20, 40];
        $("#g5gtCalc").innerHTML = `g = sigmoid(${fmt(w, 2)} × x ${b < 0 ? "−" : "+"} ${fmt(Math.abs(b), 1)})\n` + ex.map(x => { const g = sigm(w * x + b); return `x = ${String(x).padStart(2)} mm → g = ${fmt(g, 2)} → y = <span class="k">${fmt(g * x, 2)}</span> mm`; }).join("\n");
      }
    }
    render(); return render;
  });

  /* ───────── 24 · Dropout ───────── */
  demo("op-dropout", slide => {
    const R = rng(2424), gR = slider("g5doR", v => fmt(v, 2), () => { render(); }), gM = chips($("#g5doMode"), () => { if (gM() === "pred") stop(); render(); });
    const sizes = [5, 8, 8, 1], X = [0.8, 0.3, 1.0, 0.5, 0.7];
    const Ws = sizes.slice(1).map((n, l) => Array.from({ length: n }, () => Array.from({ length: sizes[l] }, () => gauss(R) * 0.7)));
    let masks = sizes.map(n => Array(n).fill(1)), exMask = [1, 0, 1, 0], steps = 0, sumAcc = 0, timer = null;
    function newDraw() {
      const p = gR();
      masks = sizes.map((n, l) => Array.from({ length: n }, () => (l === 1 || l === 2) ? +(R() >= p) : 1));
      exMask = [4, 2, 6, 8].map(() => +(R() >= p)); steps++;
    }
    function forward(train) {
      const p = gR(), s = train ? 1 / (1 - p) : 1, acts = [X.slice()];
      for (let l = 1; l < sizes.length; l++) {
        const prev = acts[l - 1], a = Ws[l - 1].map(row => row.reduce((t, w, k) => t + w * prev[k], 0.1));
        acts.push(a.map((v, i) => { const y = l < sizes.length - 1 ? relu(v) : v; return (train && (l === 1 || l === 2)) ? y * masks[l][i] * s : y; }));
      }
      return acts;
    }
    newDraw(); exMask = [1, 0, 1, 0]; sumAcc = forward(true)[1].reduce((a, b) => a + b, 0);
    function step() { newDraw(); sumAcc += forward(true)[1].reduce((a, b) => a + b, 0); render(); }
    function stop() { clearInterval(timer); timer = null; $("#g5doPlay").textContent = "Play"; }
    $("#g5doStep").onclick = () => { if (gM() === "train") step(); };
    $("#g5doPlay").onclick = () => {
      if (timer) return stop();
      if (gM() !== "train") return;
      $("#g5doPlay").textContent = "Pause";
      timer = setInterval(() => { if (!slide.classList.contains("on")) return stop(); step(); }, 650);
    };
    function render() {
      const p = gR(), train = gM() === "train", s = 1 / (1 - p), acts = forward(train), full = forward(false);
      const W = 520, H = 250, xs = [50, 190, 330, 470], cy = 118, dy = 26, ys = n => Array.from({ length: n }, (_, i) => cy + (i - (n - 1) / 2) * dy);
      const svg = svgIn($("#g5doFig"), W, H), on = (l, i) => !train || masks[l][i] === 1;
      for (let l = 1; l < sizes.length; l++) {
        const y0 = ys(sizes[l - 1]), y1 = ys(sizes[l]);
        Ws[l - 1].forEach((row, i) => row.forEach((w, k) => {
          if (!on(l, i) || !on(l - 1, k)) return;
          el("line", { x1: xs[l - 1] + 10, y1: y0[k], x2: xs[l] - 10, y2: y1[i], stroke: css(w >= 0 ? "--pos" : "--neg"), "stroke-width": (0.3 + 2 * Math.min(1, Math.abs(w))).toFixed(2), opacity: .5 }, svg);
        }));
      }
      sizes.forEach((n, l) => ys(n).forEach((y, i) => {
        const x = xs[l], off = !on(l, i), a = acts[l][i];
        if (off) {
          el("circle", { cx: x, cy: y, r: 10, fill: "none", stroke: css("--line"), "stroke-width": 1.5, "stroke-dasharray": "2 2" }, svg);
          el("path", { d: `M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}`, stroke: css("--muted"), "stroke-width": 1.4 }, svg);
        } else el("circle", { cx: x, cy: y, r: 10, fill: css(l === 0 ? "--cool" : l === 3 ? "--ok" : "--arch"), opacity: (0.35 + 0.65 * clamp(Math.abs(a) / 2, 0, 1)).toFixed(2) }, svg);
      }));
      ["input", "hidden 1 + dropout", "hidden 2 + dropout", "output"].forEach((t, l) => txt(svg, xs[l], H - 6, t, { "text-anchor": "middle", class: "mut", "font-size": 11 }));
      const nOn = train ? masks[1].concat(masks[2]).filter(Boolean).length : 16;
      const sFull = full[1].reduce((a, b) => a + b, 0), sNow = acts[1].reduce((a, b) => a + b, 0);
      $("#g5doRead").innerHTML = `<div><span>Active</span><b class="c-arch">${nOn} / 16</b></div><div><span>Scale</span><b>${train ? "×" + fmt(s, 2) : "none"}</b></div><div><span>Layer-1 sum now</span><b>${fmt(sNow, 2)}</b></div><div><span>avg, ${steps} steps</span><b class="c-ok">${steps ? fmt(sumAcc / steps, 2) : "–"}</b></div><div><span>no dropout</span><b>${fmt(sFull, 2)}</b></div>`;
      const x = [4, 2, 6, 8], y = x.map((v, i) => train ? v * exMask[i] * s : v);
      $("#g5doCalc").innerHTML = train
        ? `rate ${fmt(p, 2)} → scale 1 / (1 − ${fmt(p, 2)}) = <span class="k">${nf(+s.toFixed(2))}</span>\nx    = [4, 2, 6, 8]   sum 20\nmask = [${exMask.join(", ")}]\ny    = [<span class="k">${y.map(v => nf(+v.toFixed(2))).join(", ")}</span>]   sum ${nf(+y.reduce((a, b) => a + b, 0).toFixed(2))}\n<span class="m">expected y = (1 − rate) × x × scale = x, so the expected sum is 20</span>`
        : `prediction: dropout is off\ny = x = [4, 2, 6, 8]   sum 20`;
    }
    render(); return render;
  });
})();
