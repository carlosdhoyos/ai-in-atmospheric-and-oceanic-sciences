/* ═════════ PAE-Minas · section 2: logistic regression ═════════
   Everything lives in a block so helper names do not collide with other sections. */
{
  const F5 = ["ferric", "clay", "distUM", "slope", "mag"];
  const FCOL = { ferric: "--lw", clay: "--sw", distUM: "--data", slope: "--arch", mag: "--mag" };
  const sig = z => 1 / (1 + Math.exp(-clamp(z, -35, 35)));
  const logit = p => Math.log(p / (1 - p));
  const memo = f => { let v; return () => v || (v = f()); };
  const SUP = { "-": "⁻", "+": "", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const fmtE = v => { if (v >= 100 && v < 1e5) return fmtN(v); if (v >= 0.01 && v < 100) return fmt(v, v < 1 ? 3 : 2);
    const [m, e] = v.toExponential(1).split("e"); return m.replace(".", ",") + "·10" + [...e].map(c => SUP[c]).join(""); };
  // fit on standardized columns; also return the same model in original units
  const fitStd = (X, y, opts = {}) => {
    const S = ML.standardize(X), m = ML.logistic(S.Z, y, { lr: 1, iters: 2500, tol: 1e-10, ...opts });
    const raw = { b0: m.b0 - m.b.reduce((a, b, j) => a + b * S.mu[j] / S.sd[j], 0), b: m.b.map((b, j) => b / S.sd[j]) };
    return { S, m, raw, p: x => m.predict(S.apply(x)) };
  };
  // 1-D tables on B4/B2: the known positives plus a sample of unlabeled cells
  const T1 = {};
  const d1 = u => T1[u] || (T1[u] = (() => { const D = AREA.data({ feats: ["ferric"], unlabeled: u, seed: 3 }), r = rng(5);
    return { x: D.X.map(v => v[0]), y: D.y, cells: D.cells, jit: D.y.map(() => (r() - 0.5) * 0.1) }; })());
  // the section's modelling table: 100 known positives + 1 200 unlabeled cells, five features
  const TAB = memo(() => AREA.data({ unlabeled: 1200, seed: 1 }));
  const FIT5 = memo(() => fitStd(TAB().X, TAB().y, { l2: 0.01 }));                       // a light L2: see the regularization slide
  const TAB2 = memo(() => ({ X: TAB().X.map(r => [r[0], r[2]]), y: TAB().y }));          // ferric, distUM
  const FIT2 = memo(() => fitStd(TAB2().X, TAB2().y, { iters: 4000 }));
  const ptsBy = (X, y, every = 1) => X.map((r, i) => ({ x: r[0], y: r[1], cls: y[i] })).filter((p, i) => p.cls || i % every === 0);
  const nm = f => AREA.F[f].es;

  /* ───────── opener: roadmap ───────── */
  demo("s-logistica", () => {
    const R = [["lr-lineal", "¿Por qué no una recta?", "Predicciones fuera de [0, 1]."], ["lr-sigmoide", "La sigmoide", "β₀, β₁ y la probabilidad de una celda."],
      ["lr-odds", "Odds y log-odds", "El modelo es lineal en log-odds."], ["lr-multiple", "Varias variables", "z término a término; e^β multiplica las odds."],
      ["lr-frontera", "Frontera de decisión", "Umbral y recta en el plano."], ["lr-ajuste", "Máxima verosimilitud", "Descenso de gradiente en vivo."],
      ["lr-estandar", "Estandarización", "Coeficientes comparables, ajuste rápido."], ["lr-regular", "Regularización L1/L2", "Pocos positivos: penaliza."],
      ["lr-desbalance", "Desbalance", "Exactitud engañosa, PR vs ROC, pesos de clase."]];
    $("#lrRoadCard").innerHTML = R.map(([id, t, d], i) => `<button class="pick" type="button" data-go="${id}" style="display:block;width:100%;padding:6px 12px"><b style="font-size:14px">${i + 1}. ${t}</b> <span>· ${d}</span></button>`).join("");
    return () => {};
  });

  /* ───────── a 1-D strip: B4/B2 on x, 0/1 (jittered) on y ───────── */
  const XR = [0.9, 2.0];
  function strip(host, d, { W = 480, H = 270, yr = [-0.15, 1.15], yt = [0, 0.5, 1] } = {}) {
    const svg = svgIn(host, W, H), A = axes(svg, { W, H, m: { l: 40, r: 12, t: 14, b: 30 }, x0: XR[0], x1: XR[1], y0: yr[0], y1: yr[1], xt: [1, 1.2, 1.4, 1.6, 1.8, 2], yt,
      xf: v => fmt(v, 1), yf: v => fmt(v, 1), xl: "B4/B2 (hierro férrico)", yl: "p" });
    return { svg, ...A };
  }
  const dots = (svg, A, d, hiFn) => { const g = el("g", {}, svg);
    d.x.forEach((x, i) => { if (d.y[i]) return; el("circle", { cx: A.x(x), cy: A.y(d.jit[i]), r: 2.6, fill: css("--cool"), opacity: .5 }, g); });
    d.x.forEach((x, i) => { if (!d.y[i]) return; el("circle", { cx: A.x(x), cy: A.y(1 + d.jit[i]), r: 3.6, fill: css("--lw"), opacity: .9, stroke: css("--bg"), "stroke-width": .8 }, g); });
    return g; };

  /* ───────── why not linear regression ───────── */
  demo("lr-lineal", () => {
    let u = 100; chips($("#lrLinU"), v => { u = +v; render(); });
    function render() {
      const d = d1(u), mx = mean(d.x), my = mean(d.y); let sxy = 0, sxx = 0;
      d.x.forEach((v, i) => { sxy += (v - mx) * (d.y[i] - my); sxx += (v - mx) ** 2; });
      const b = sxy / sxx, a = my - b * mx, yh = d.x.map(v => a + b * v), yr = [-0.75, 1.75];
      const P = strip($("#lrLinFig"), d, { yr, yt: [-0.5, 0, 0.5, 1, 1.5], H: 300 }), { svg, x, y } = P, rose = css("--rose");
      el("rect", { x: x(XR[0]), y: y(yr[1]), width: x(XR[1]) - x(XR[0]), height: y(1) - y(yr[1]), fill: rose, opacity: .09 }, svg);
      el("rect", { x: x(XR[0]), y: y(0), width: x(XR[1]) - x(XR[0]), height: y(yr[0]) - y(0), fill: rose, opacity: .09 }, svg);
      el("text", { x: x(XR[0]) + 6, y: y(yr[1]) + 14, "font-size": 11, fill: rose }, svg, "p > 1: imposible");
      el("text", { x: x(XR[0]) + 6, y: y(yr[0]) - 6, "font-size": 11, fill: rose }, svg, "p < 0: imposible");
      dots(svg, P, d);
      // the line: in-range part in the foreground colour, out-of-range parts in rose
      const xa = (0 - a) / b, xb = (1 - a) / b, seg = (x0, x1, col, w) => { x0 = clamp(x0, XR[0], XR[1]); x1 = clamp(x1, XR[0], XR[1]); if (x1 > x0) el("line", { x1: x(x0), y1: y(clamp(a + b * x0, yr[0], yr[1])), x2: x(x1), y2: y(clamp(a + b * x1, yr[0], yr[1])), stroke: css(col), "stroke-width": w }, svg); };
      seg(XR[0], xa, "--rose", 3); seg(xa, xb, "--fg", 2.2); seg(xb, XR[1], "--rose", 3);
      d.x.forEach((v, i) => { if (yh[i] < 0 || yh[i] > 1) el("circle", { cx: x(v), cy: y(clamp(yh[i], yr[0], yr[1])), r: 3.2, fill: "none", stroke: rose, "stroke-width": 1.5 }, svg); });
      el("text", { x: x(1.93), y: y(clamp(a + b * 1.93, yr[0], yr[1])) - 8, "text-anchor": "end", "font-size": 12, fill: css("--fg"), class: "mono" }, svg, `ŷ = ${fmt(a, 2)} + ${fmt(b, 2)}·x`);
      const lo = yh.filter(v => v < 0).length, hi = yh.filter(v => v > 1).length;
      $("#lrLinRead").innerHTML = `<div><span>ŷ &lt; 0</span><b class="c-lw">${lo}</b></div><div><span>ŷ &gt; 1</span><b class="c-lw">${hi}</b></div><div><span>Rango de ŷ</span><b>${fmt(Math.min(...yh), 2)} a ${fmt(Math.max(...yh), 2)}</b></div><div><span>Pendiente</span><b>${fmt(b, 2)}</b></div>`;
    }
    render(); return render;
  });

  /* ───────── the sigmoid with β0, β1 sliders, hover, fit ───────── */
  demo("lr-sigmoide", () => {
    const d = d1(100), mle = fitStd(d.x.map(v => [v]), d.y, { iters: 4000 }).raw, gb0 = slider("lrB0", v => fmt(v, 1), () => render()), gb1 = slider("lrB1", v => fmt(v, 1), () => render());
    const set = (id, v) => { const r = $("#" + id); r.value = v; r.dispatchEvent(new Event("input")); };
    $("#lrSigFit").addEventListener("click", () => { set("lrB0", mle.b0.toFixed(1)); set("lrB1", mle.b[0].toFixed(1)); });
    const ll = (b0, b1) => -mean(d.x.map((x, i) => { const p = sig(b0 + b1 * x); return d.y[i] ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12)); }));
    const llMin = ll(mle.b0, mle.b[0]);
    let hov = null;   // { x, i } cursor position on the B4/B2 axis, i = index of the hovered point or −1
    VIZ.quiz($("#lrSigQuiz"), [{ q: "Con β₁ > 0, una celda con B4/B2 = −β₀/β₁ recibe p =", opts: ["0", "0,5", "1", "depende de β₁"], right: 1,
      why: "Ahí z = 0 y σ(0) = 0,5: es el punto medio de la curva. β₁ solo cambia lo empinada que es; β₀ la desplaza." }]);
    function render() {
      const b0 = gb0(), b1 = gb1(), P = strip($("#lrSigFig"), d, { H: 250 }), { svg, x, y } = P;
      dots(svg, P, d);
      const xs = Array.from({ length: 121 }, (_, k) => XR[0] + k * (XR[1] - XR[0]) / 120);
      el("path", { d: path(xs.map(v => [x(v), y(sig(b0 + b1 * v))])), fill: "none", stroke: css("--accent"), "stroke-width": 2.6 }, svg);
      if (b1 > 0) { const xm = -b0 / b1; if (xm > XR[0] && xm < XR[1]) { el("line", { x1: x(xm), x2: x(xm), y1: y(0), y2: y(1), stroke: css("--muted"), "stroke-dasharray": "3 3" }, svg); el("text", { x: x(xm) + 4, y: y(1) + 30, "font-size": 10.5, fill: css("--muted") }, svg, "z = 0, p = 0,5"); } }
      const hg = el("g", {}, svg), hit = el("rect", { x: x(XR[0]), y: 0, width: x(XR[1]) - x(XR[0]), height: y(-0.15), fill: "transparent" }, svg);
      const drawHover = () => { hg.innerHTML = ""; if (!hov) return;
        const xv = hov.i >= 0 ? d.x[hov.i] : hov.x, p = sig(b0 + b1 * xv);
        el("line", { x1: x(xv), x2: x(xv), y1: y(-0.15), y2: y(1.15), stroke: css("--muted"), "stroke-width": 1 }, hg);
        el("circle", { cx: x(xv), cy: y(p), r: 5, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 1.5 }, hg);
        if (hov.i >= 0) el("circle", { cx: x(xv), cy: y((d.y[hov.i] ? 1 : 0) + d.jit[hov.i]), r: 6, fill: "none", stroke: css("--fg"), "stroke-width": 2 }, hg);
        const right = x(xv) < 300, lab = (hov.i >= 0 ? (d.y[hov.i] ? "laterita conocida · " : "no etiquetada · ") : "") + `B4/B2 = ${fmt(xv, 2)} → p = ${fmt(p, 3)}`;
        el("text", { x: x(xv) + (right ? 8 : -8), y: clamp(y(p) - 8, 14, 230), "text-anchor": right ? "start" : "end", "font-size": 12, class: "mono", fill: css("--fg") }, hg, lab);
        drawZ(b0 + b1 * xv); };
      hit.addEventListener("mousemove", e => { const r = svg.getBoundingClientRect(), sc = 480 / r.width, px = (e.clientX - r.left) * sc, py = (e.clientY - r.top) * sc;
        let best = -1, bd = 64; d.x.forEach((v, i) => { const dd = (x(v) - px) ** 2 + (y((d.y[i] ? 1 : 0) + d.jit[i]) - py) ** 2; if (dd < bd) { bd = dd; best = i; } });
        hov = { x: XR[0] + (px - x(XR[0])) / (x(XR[1]) - x(XR[0])) * (XR[1] - XR[0]), i: best }; drawHover(); readout(); });
      hit.addEventListener("mouseleave", () => { hov = null; drawHover(); drawZ(null); readout(); });
      // σ(z) on its own axis, with the window of z the data occupy
      const drawZ = zh => { const W = 480, H = 110, s = svgIn($("#lrSigZFig"), W, H), A = axes(s, { W, H, m: { l: 40, r: 12, t: 8, b: 26 }, x0: -10, x1: 10, y0: 0, y1: 1, xt: [-10, -5, 0, 5, 10], yt: [0, 0.5, 1], xf: v => fmt(v, 0), yf: v => fmt(v, 1), xl: "z" });
        const za = clamp(b0 + b1 * XR[0], -10, 10), zb = clamp(b0 + b1 * XR[1], -10, 10);
        el("rect", { x: A.x(Math.min(za, zb)), y: 8, width: Math.max(2, Math.abs(A.x(zb) - A.x(za))), height: H - 34, fill: css("--accent"), opacity: .08 }, s);
        el("text", { x: A.x(Math.min(za, zb)) + 4, y: 20, "font-size": 10.5, fill: css("--accent") }, s, "z de los datos");
        el("path", { d: path(Array.from({ length: 101 }, (_, k) => { const z = -10 + k * 0.2; return [A.x(z), A.y(sig(z))]; })), fill: "none", stroke: css("--accent"), "stroke-width": 2 }, s);
        if (zh != null) el("circle", { cx: A.x(clamp(zh, -10, 10)), cy: A.y(sig(zh)), r: 5, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 1.5 }, s); };
      const readout = () => { const L = ll(b0, b1), p = hov ? sig(b0 + b1 * (hov.i >= 0 ? d.x[hov.i] : hov.x)) : null;
        $("#lrSigRead").innerHTML = `<div><span>Log-loss</span><b class="${L - llMin < 0.01 ? "c-ok" : ""}">${fmt(L, 3)}</b></div><div><span>Mínimo (MLE)</span><b class="c-ok">${fmt(llMin, 3)}</b></div><div><span>p en el cursor</span><b>${p == null ? "—" : fmt(p, 3)}</b></div>`; };
      drawHover(); if (!hov) drawZ(null); readout();
    }
    render(); return render;
  });

  /* ───────── odds and log-odds converter ───────── */
  demo("lr-odds", () => {
    let L = logit(0.2); const b1 = fitStd(d1(100).x.map(v => [v]), d1(100).y, { iters: 4000 }).raw.b[0];
    const R = { P: $("#lrOdP"), O: $("#lrOdO"), Lg: $("#lrOdL") };
    const sync = () => { const p = sig(L); R.P.value = p; R.O.value = L / Math.LN10; R.Lg.value = L;
      R.P.parentElement.querySelector("output").textContent = fmt(p, 3); R.O.parentElement.querySelector("output").textContent = fmtE(Math.exp(L)); R.Lg.parentElement.querySelector("output").textContent = fmt(L, 2); };
    R.P.addEventListener("input", () => { L = logit(clamp(+R.P.value, 0.001, 0.999)); render(); });
    R.O.addEventListener("input", () => { L = +R.O.value * Math.LN10; render(); });
    R.Lg.addEventListener("input", () => { L = +R.Lg.value; render(); });
    chips($("#lrOdPick"), v => { L = logit(+v); render(); }); $$("#lrOdPick button").forEach(b => b.setAttribute("aria-pressed", "false"));
    function render() {
      sync();
      const p = sig(L), o = Math.exp(L), W = 480, H = 300, svg = svgIn($("#lrOdFig"), W, H), x0 = 60, x1 = W - 20, acc = css("--accent"), mut = css("--muted");
      const rows = [
        { y: 40, lab: "p", ticks: [0, 0.25, 0.5, 0.75, 1], pos: v => x0 + v * (x1 - x0), f: v => fmt(v, 2), v: p },
        { y: 120, lab: "odds", ticks: [-3, -2, -1, 0, 1, 2, 3], pos: v => x0 + (v + 3) / 6 * (x1 - x0), f: v => v < 0 ? "1/" + fmtN(10 ** -v) : fmtN(10 ** v), v: clamp(Math.log10(o), -3, 3), note: "escala logarítmica" },
        { y: 200, lab: "log-odds", ticks: [-7, -3.5, 0, 3.5, 7], pos: v => x0 + (v + 7) / 14 * (x1 - x0), f: v => fmt(v, 1), v: clamp(L, -7, 7) }];
      const mk = rows.map(r => [r.pos(r.v), r.y]);
      el("path", { d: path(mk), fill: "none", stroke: acc, "stroke-dasharray": "4 3", "stroke-width": 1.4 }, svg);
      rows.forEach(r => {
        el("line", { x1: x0, x2: x1, y1: r.y, y2: r.y, class: "ax" }, svg);
        el("text", { x: x0 - 10, y: r.y + 4, "text-anchor": "end", "font-size": 13, "font-weight": 600, fill: css("--fg") }, svg, r.lab);
        r.ticks.forEach(t => { el("line", { x1: r.pos(t), x2: r.pos(t), y1: r.y - 4, y2: r.y + 4, stroke: mut }, svg); el("text", { x: r.pos(t), y: r.y + 18, "text-anchor": "middle", class: "mono", "font-size": 10.5, fill: mut }, svg, r.f(t)); });
        if (r.note) el("text", { x: x1, y: r.y - 10, "text-anchor": "end", "font-size": 10.5, fill: mut }, svg, r.note);
        el("circle", { cx: r.pos(r.v), cy: r.y, r: 7, fill: acc, stroke: css("--bg"), "stroke-width": 2 }, svg);
      });
      // linear in log-odds, S-shaped in p: a tiny sigmoid with the current point
      const g0 = 238, gh = 50, gx = v => x0 + (v + 7) / 14 * (x1 - x0), gy = v => g0 + gh - v * gh;
      el("path", { d: path(Array.from({ length: 71 }, (_, k) => { const z = -7 + k * 0.2; return [gx(z), gy(sig(z))]; })), fill: "none", stroke: mut, "stroke-width": 1.4 }, svg);
      el("circle", { cx: gx(clamp(L, -7, 7)), cy: gy(p), r: 4.5, fill: acc }, svg);
      el("text", { x: x0 - 10, y: g0 + 30, "text-anchor": "end", "font-size": 11, fill: mut }, svg, "p(log-odds)");
      const words = o >= 1 ? `${fmt(o, o < 10 ? 1 : 0)} a 1 a favor` : `1 a ${fmt(1 / o, 1 / o < 10 ? 1 : 0)} (en contra)`;
      $("#lrOdRead").innerHTML = `<div><span>p</span><b>${fmt(p, 3)}</b></div><div><span>odds</span><b>${fmtE(o)}</b></div><div><span>log-odds</span><b>${fmt(L, 2)}</b></div>`;
      $("#lrOdNote").innerHTML = `En palabras: <b>${words}</b>. Ejemplo con la sigmoide ajustada (β₁ ≈ ${fmt(b1, 1)} por unidad de B4/B2): +0,1 en B4/B2 suma ${fmt(b1 * 0.1, 2)} a los log-odds y multiplica las odds por e<sup>${fmt(b1 * 0.1, 2)}</sup> = ${fmt(Math.exp(b1 * 0.1), 2)}; desde aquí, p pasaría de ${fmt(p, 3)} a ${fmt(sig(L + b1 * 0.1), 3)}.`;
    }
    render(); return render;
  });

  /* ───────── multiple logistic regression: z built term by term ───────── */
  demo("lr-multiple", () => {
    const M = FIT5(), RG = { ferric: [0.9, 2.0, 0.01], clay: [1.05, 1.4, 0.005], distUM: [0, 3, 0.05], slope: [0, 15, 0.1], mag: [-60, 320, 5] };
    $("#lrMulCtl").innerHTML = F5.map(f => `<div class="ctl" style="margin:4px 0"><label for="lrMul_${f}" style="font-size:13px">${nm(f)}</label><input id="lrMul_${f}" type="range" min="${RG[f][0]}" max="${RG[f][1]}" step="${RG[f][2]}"><output></output></div>`).join("");
    let focus = "distUM";
    const get = {}; F5.forEach(f => { get[f] = slider("lrMul_" + f, v => fmt(v, AREA.F[f].d) + (AREA.F[f].unit ? " " + AREA.F[f].unit : ""), () => { focus = f; cell = -1; render(); }); });
    const score = new Float64Array(AREA.N); for (let k = 0; k < AREA.N; k++) score[k] = M.p(AREA.row(k, F5));
    // example cells: best-scored known positive, the reddest soil far from ultramafics, a steep ultramafic slope
    const argmax = (f) => { let b = -1, bv = -Infinity; for (let k = 0; k < AREA.N; k++) if (!AREA.mine[k]) { const v = f(k); if (v > bv) { bv = v; b = k; } } return b; };
    const EX = [["Laterita conocida", argmax(k => AREA.known[k] ? score[k] : -1)], ["Suelo rojo", argmax(k => AREA.redSoil[k] * (AREA.distUM[k] > 1) + 0.01 * AREA.ferric[k])],
      ["Ultramáfica en ladera", argmax(k => AREA.lith[k] === 1 ? AREA.slope[k] : -1)]];
    $("#lrMulEx").innerHTML = EX.map(([n, k], i) => `<button class="chip" data-v="${i}" aria-pressed="${i === 0}">${n}</button>`).join("");
    let cell = EX[0][1];
    const setCell = k => { cell = k; F5.forEach(f => { const r = $("#lrMul_" + f); r.value = AREA.L[f][k]; r.parentElement.querySelector("output").textContent = fmt(+r.value, AREA.F[f].d) + (AREA.F[f].unit ? " " + AREA.F[f].unit : ""); }); };
    chips($("#lrMulEx"), v => { setCell(EX[+v][1]); render(); });
    setCell(cell);
    const q1 = M.m.b[2], q2 = M.m.b[0];
    VIZ.quiz($("#lrMulQuiz"), [{ q: `Estandarizadas: β(distancia) = ${fmt(q1, 2)}, β(hierro) = ${fmt(q2, 2)}. ¿Cuál pesa más?`,
      opts: [`La distancia: ÷${fmt(Math.exp(-q1), 1)} por desv. est.`, "El hierro: su β es positivo", "No se pueden comparar"], right: 0,
      why: `Estandarizadas, importa |β|: +1 desv. est. de distancia divide las odds por ${fmt(Math.exp(-q1), 1)}; de hierro, las multiplica por ${fmt(Math.exp(q2), 1)}. El signo da la dirección, no la fuerza.` }]);
    function render() {
      const xv = F5.map(f => get[f]()), zs = M.S.apply(xv), terms = F5.map((f, j) => M.m.b[j] * zs[j]), z = M.m.b0 + terms.reduce((a, b) => a + b, 0), p = sig(z);
      // waterfall of z
      const W = 480, rowH = 22, rows = [["β₀ (intercepto)", M.m.b0, null]].concat(F5.map((f, j) => [nm(f), terms[j], f])), H = (rows.length + 1) * rowH + 30, svg = svgIn($("#lrMulFig"), W, H);
      const lo = -16, hi = 8, L0 = 150, X = lin(lo, hi, L0, W - 52);
      [-15, -10, -5, 0, 5].forEach(t => { el("line", { x1: X(t), x2: X(t), y1: 2, y2: H - 22, class: "grid" }, svg); el("text", { x: X(t), y: H - 8, "text-anchor": "middle", class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, fmt(t, 0)); });
      el("line", { x1: X(0), x2: X(0), y1: 2, y2: H - 22, stroke: css("--muted") }, svg);
      let run = 0;
      rows.forEach(([lab, v, f], r) => { const y0 = 4 + r * rowH, a = run, b = run + v, xa = X(clamp(Math.min(a, b), lo, hi)), xb = X(clamp(Math.max(a, b), lo, hi));
        el("text", { x: L0 - 8, y: y0 + 15, "text-anchor": "end", "font-size": 11.5, fill: css("--fg"), "font-weight": f === focus ? 600 : 400 }, svg, lab);
        el("rect", { x: xa, y: y0 + 3, width: Math.max(1.5, xb - xa), height: rowH - 8, rx: 3, fill: css(v >= 0 ? "--pos" : "--neg"), opacity: f === focus ? 1 : .7 }, svg);
        el("text", { x: Math.min(xb + 4, W - 48), y: y0 + 15, class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, (v >= 0 ? "+" : "") + fmt(v, 2));
        if (r) el("line", { x1: X(clamp(a, lo, hi)), x2: X(clamp(a, lo, hi)), y1: y0 - 4, y2: y0 + 3, stroke: css("--muted"), "stroke-dasharray": "2 2" }, svg);
        run = b; });
      const yz = 4 + rows.length * rowH;
      el("text", { x: L0 - 8, y: yz + 15, "text-anchor": "end", "font-size": 12, "font-weight": 600, fill: css("--accent") }, svg, "z total");
      el("line", { x1: X(0), x2: X(clamp(z, lo, hi)), y1: yz + 11, y2: yz + 11, stroke: css("--accent"), "stroke-width": 3 }, svg);
      el("circle", { cx: X(clamp(z, lo, hi)), cy: yz + 11, r: 5, fill: css("--accent") }, svg);
      el("text", { x: X(clamp(z, lo, hi)) + (z > 2 ? -8 : 8), y: yz + 15, "text-anchor": z > 2 ? "end" : "start", class: "mono", "font-size": 11.5, fill: css("--accent") }, svg, `z = ${fmt(z, 2)}`);
      // z → σ → p
      const s = svgIn($("#lrMulSigFig"), W, 74), Xs = lin(lo, hi, L0, W - 52), Ys = lin(0, 1, 62, 8);
      el("text", { x: L0 - 8, y: 16, "text-anchor": "end", "font-size": 12, fill: css("--fg") }, s, "p = σ(z)");
      el("text", { x: L0 - 8, y: 46, "text-anchor": "end", "font-size": 22, class: "mono", fill: css("--accent") }, s, fmt(p, 3));
      el("path", { d: path(Array.from({ length: 97 }, (_, k) => { const t = lo + k * 0.25; return [Xs(t), Ys(sig(t))]; })), fill: "none", stroke: css("--muted"), "stroke-width": 1.6 }, s);
      el("line", { x1: Xs(clamp(z, lo, hi)), x2: Xs(clamp(z, lo, hi)), y1: 0, y2: Ys(sig(z)), stroke: css("--accent"), "stroke-dasharray": "3 3" }, s);
      el("circle", { cx: Xs(clamp(z, lo, hi)), cy: Ys(sig(z)), r: 5.5, fill: VIZ.prob(p), stroke: css("--fg"), "stroke-width": 1.2 }, s);
      // interpretation of the focused coefficient
      const j = F5.indexOf(focus), b = M.m.b[j], F = AREA.F[focus], o = p / (1 - p), rawStep = focus === "mag" ? 50 : focus === "slope" ? 1 : focus === "distUM" ? 0.5 : 0.1, br = M.raw.b[j];
      $("#lrMulCalc").innerHTML = `<b>Un aumento de 1 unidad en x<sub>j</sub> multiplica las odds por e<sup>β<sub>j</sub></sup>.</b> <b>${nm(focus)}</b>: 1 unidad estandarizada = ${fmt(M.S.sd[j], F.d + 1)} ${F.unit} → odds × e<sup>${fmt(b, 2)}</sup> = <b>${fmtE(Math.exp(b))}</b>
        (+${fmt(rawStep, rawStep < 1 ? (rawStep < 0.5 ? 2 : 1) : 0)} ${F.unit || "unidades"} → × ${fmtE(Math.exp(br * rawStep))}). Esta celda: odds ${fmtE(o)} → ${fmtE(o * Math.exp(b))}, p ${fmt(p, 3)} → ${fmt(sig(z + b), 3)}.`;
      const mp = VIZ.map($("#lrMulMap"), score, { points: cell >= 0 ? [{ k: cell, color: "#fff", r: 4.5 }] : null, scale: 4 });
      mp.canvas.addEventListener("click", e => { const k = mp.cellAt(e); if (k < 0 || AREA.mine[k]) return; setCell(k); $$("#lrMulEx button").forEach(x => x.setAttribute("aria-pressed", "false")); render(); });
    }
    render(); return render;
  });

  /* the exact line b0 + b1·x + b2·y = 0 inside the plot box (VIZ.scatter's contour is a staircase on its grid) */
  const boundary = (sc, c0, b, xr, yr) => {
    const P = []; const add = (x, y) => { if (x >= xr[0] - 1e-9 && x <= xr[1] + 1e-9 && y >= yr[0] - 1e-9 && y <= yr[1] + 1e-9) P.push([x, y]); };
    if (b[1]) { add(xr[0], -(c0 + b[0] * xr[0]) / b[1]); add(xr[1], -(c0 + b[0] * xr[1]) / b[1]); }
    if (b[0]) { add(-(c0 + b[1] * yr[0]) / b[0], yr[0]); add(-(c0 + b[1] * yr[1]) / b[0], yr[1]); }
    if (P.length < 2) return;
    P.sort((p, q) => p[0] - q[0]);
    el("line", { x1: sc.X(P[0][0]), y1: sc.Y(P[0][1]), x2: sc.X(P[P.length - 1][0]), y2: sc.Y(P[P.length - 1][1]), stroke: css("--fg"), "stroke-width": 2.5 }, sc.svg);
  };

  /* ───────── decision boundary in 2-D, threshold slider ───────── */
  demo("lr-frontera", () => {
    const M = FIT2(), D = TAB2(), YMAX = 1.5, gt = slider("lrBdThr", v => fmt(v, 2), () => render()), pts = ptsBy(D.X, D.y, 1).filter(q => q.y <= YMAX), pr = D.X.map(M.p);
    $("#lrBdOff").textContent = fmtN(D.X.filter(r => r[1] > YMAX).length);
    let hp = null;
    function render() {
      const t = gt(), xr = [0.9, 2.0], yr = [0, YMAX];
      const sc = VIZ.scatter($("#lrBdFig"), pts, { xr, yr, xl: "B4/B2 (hierro férrico)", bg: (x, y) => M.p([x, y]), W: 480, H: 320, nx: 48, ny: 32, xf: v => fmt(v, 2), xt: [1, 1.2, 1.4, 1.6, 1.8, 2], yt: [0, 0.5, 1, 1.5],
        onHover: (x, y) => { hp = M.p([x, y]); const b = $("#lrBdRead b[data-h]"); if (b) b.textContent = fmt(hp, 3); } });
      boundary(sc, M.raw.b0 - logit(t), M.raw.b, xr, yr);
      VIZ.legend($("#lrBdLeg"), { width: 260 });
      const tp = pr.filter((p, i) => p >= t && D.y[i]).length, fl = pr.filter((p, i) => p >= t && !D.y[i]).length;
      $("#lrBdRead").innerHTML = `<div><span>Positivos sobre el umbral</span><b class="c-lw">${tp} / 100</b></div><div><span>No etiquetadas marcadas</span><b style="color:var(--cool)">${fl} / 1 200</b></div><div><span>p en el cursor</span><b data-h>${hp == null ? "—" : fmt(hp, 3)}</b></div>`;
      const { b0, b } = M.raw, c = logit(t);
      $("#lrBdCalc").innerHTML = `<span class="m">frontera: β₀ + β₁·B4/B2 + β₂·dist = logit(umbral)</span>\n${fmt(b0, 1)} + ${fmt(b[0], 2)}·B4/B2 ${b[1] < 0 ? "−" : "+"} ${fmt(Math.abs(b[1]), 2)}·dist = <span class="k">${fmt(c, 2)}</span>\n<span class="k">B4/B2 = ${fmt((c - b0) / b[0], 2)} ${b[1] < 0 ? "+" : "−"} ${fmt(Math.abs(b[1] / b[0]), 2)}·dist</span>   (una recta)`;
    }
    render(); return render;
  });

  /* ───────── gradient descent, animated ───────── */
  demo("lr-ajuste", slide => {
    const D = TAB2(), S = ML.standardize(D.X), best = FIT2(), Lmin = best.m.hist[best.m.hist.length - 1], pts = ptsBy(D.X, D.y, 3).filter(q => q.y <= 1.5);
    const glr = slider("lrGdLr", v => fmt(10 ** v, 10 ** v < 0.1 ? 3 : 2), () => {});
    let m = ML.logisticInit(2), timer = null;
    const step = n => { for (let k = 0; k < n; k++) ML.logisticStep(m, S.Z, D.y, { lr: 10 ** glr() }); };
    const stop = () => { clearInterval(timer); timer = null; $("#lrGdPlay").textContent = "▶ Reproducir"; };
    $("#lrGdStep").addEventListener("click", () => { stop(); step(5); render(); });
    $("#lrGdReset").addEventListener("click", () => { stop(); m = ML.logisticInit(2); render(); });
    $("#lrGdPlay").addEventListener("click", () => {
      if (timer) { stop(); return; }
      $("#lrGdPlay").textContent = "❚❚ Pausa";
      timer = setInterval(() => { if (!slide.classList.contains("on") || m.hist.length >= 1500) { stop(); return; } step(m.hist.length < 20 ? 1 : m.hist.length < 200 ? 4 : 10); render(); }, 70);
    });
    function render() {
      const pr = (x, y) => sig(m.b0 + m.b[0] * (x - S.mu[0]) / S.sd[0] + m.b[1] * (y - S.mu[1]) / S.sd[1]);
      const sc = VIZ.scatter($("#lrGdFig"), pts, { xr: [0.9, 2.0], yr: [0, 1.5], xl: "B4/B2", bg: pr, W: 480, H: 240, nx: 40, ny: 24, xf: v => fmt(v, 2), xt: [1, 1.2, 1.4, 1.6, 1.8, 2], yt: [0, 0.5, 1, 1.5] });
      boundary(sc, m.b0 - m.b[0] * S.mu[0] / S.sd[0] - m.b[1] * S.mu[1] / S.sd[1], [m.b[0] / S.sd[0], m.b[1] / S.sd[1]], [0.9, 2.0], [0, 1.5]);
      const h = m.hist, n = h.length, cur = n ? h[n - 1] : Math.LN2, top = Math.max(0.75, ...h.slice(0, 1));
      const c = VIZ.curves($("#lrGdLoss"), [{ pts: h.map((v, i) => [i, v]), col: "--accent", label: "log-loss" }, { pts: [[0, Lmin], [Math.max(100, n), Lmin]], col: "--ok", dash: "4 4", label: "mínimo" }],
        { xr: [0, Math.max(100, n)], yr: [0, top], W: 480, H: 150, xl: "iteración", yl: "", xf: v => fmtN(v), yf: v => fmt(v, 2), yt: [0, 0.25, 0.5, 0.75], legendAt: "tr" });
      if (h.some(v => v > top)) el("text", { x: 50, y: 24, "font-size": 11, fill: css("--rose") }, c.svg, "fuera de escala: oscila");
      $("#lrGdRead").innerHTML = `<div><span>Iteración</span><b>${n}</b></div><div><span>Log-loss</span><b class="${cur - Lmin < 0.002 ? "c-ok" : ""}">${fmt(cur, 3)}</b></div><div><span>Coef. intercepto · fe · dist</span><b style="font-size:19px">${fmt(m.b0, 2)} · ${fmt(m.b[0], 2)} · ${fmt(m.b[1], 2)}</b></div>`;
    }
    render(); return render;
  });

  /* ───────── standardization: coefficients and convergence ───────── */
  demo("lr-estandar", () => {
    const D = TAB(), M = FIT5(), S = M.S;
    let mode = "raw"; chips($("#lrStMode"), v => { mode = v; render(); });
    const glr = slider("lrStLr", v => fmtE(10 ** v), () => render());
    // largest stable step ≈ 2 / Lipschitz constant of the log-loss gradient, L ≤ ¼ λmax(X̃ᵀX̃ / n) (X̃ with a column of ones)
    const lmax = X => { const d = X[0].length + 1, n = X.length; let v = Array(d).fill(1);
      for (let it = 0; it < 60; it++) { const w = Array(d).fill(0); X.forEach(r => { const xr = [1, ...r]; let s = 0; for (let j = 0; j < d; j++) s += xr[j] * v[j]; for (let j = 0; j < d; j++) w[j] += xr[j] * s / n; }); const nr = Math.hypot(...w); v = w.map(x => x / nr); if (it === 59) return nr; } };
    const stable = { raw: 2 / (0.25 * lmax(D.X)), std: 2 / (0.25 * lmax(S.Z)) };
    const run = (X, lr) => { const m = ML.logisticInit(5); for (let t = 0; t < 300; t++) ML.logisticStep(m, X, D.y, { lr }); return m.hist; };
    const Lmin = ML.logistic(S.Z, D.y, { lr: 3, iters: 3000, tol: 0 }).hist.pop();      // unpenalized minimum (≈)
    function render() {
      const lr = 10 ** glr(), hr = run(D.X, lr), hs = run(S.Z, lr);
      const c = VIZ.curves($("#lrStFig"), [{ pts: hr.map((v, i) => [i, v]), col: "--rose", label: "unidades originales" }, { pts: hs.map((v, i) => [i, v]), col: "--accent", label: "estandarizadas" }, { pts: [[0, Lmin], [300, Lmin]], col: "--ok", dash: "4 4", label: "mínimo" }],
        { xr: [0, 300], yr: [0, 1], W: 480, H: 220, xl: "iteración", xf: v => fmtN(v), yf: v => fmt(v, 1), xt: [0, 100, 200, 300], yt: [0, 0.5, 1], legendAt: "tr" });
      if (hr.some(v => v > 1)) el("text", { x: 50, y: 24, "font-size": 11, fill: css("--rose") }, c.svg, "curva cruda fuera de escala: diverge u oscila");
      const last = h => h[h.length - 1];
      $("#lrStRead").innerHTML = `<div><span>Final, original</span><b style="color:var(--rose)">${last(hr) > 5 ? "&gt; 5" : fmt(last(hr), 3)}</b></div><div><span>Final, estandarizada</span><b>${fmt(last(hs), 3)}</b></div>`;
      $("#lrStStable").innerHTML = `Tasa máxima estable ≈ 2 / L (L: curvatura máxima de la log-loss): <b>${fmtE(stable.raw)}</b> en unidades originales frente a <b>${fmt(stable.std, 1)}</b> estandarizadas, unas ${fmtN(stable.std / stable.raw)} veces mayor.`;
      // the same converged model in both unit systems
      const items = F5.map((f, j) => ({ label: nm(f) + (mode === "raw" && AREA.F[f].unit ? ` (por ${AREA.F[f].unit})` : ""), v: mode === "raw" ? M.raw.b[j] : M.m.b[j], col: FCOL[f] }));
      $("#lrStBarsT").textContent = mode === "raw" ? "Coeficientes por unidad original (mismo modelo)" : "Coeficientes por desviación estándar (mismo modelo)";
      VIZ.bars($("#lrStBars"), items, { signed: true, labelW: 200, W: 460, digits: mode === "raw" ? 3 : 2 });
      $("#lrStNote").innerHTML = mode === "raw"
        ? `Arcilla ${fmt(M.raw.b[1], 1)} por unidad y magnetometría ${fmt(M.raw.b[4], 4)} por nT: los tamaños reflejan las unidades, no la importancia. Las predicciones son idénticas en ambos casos.`
        : `Ahora cada barra es el efecto de +1 desviación estándar: la distancia a ultramáficas domina y luego el hierro férrico. Desviaciones: ${F5.map((f, j) => `${{ ferric: "B4/B2", clay: "B11/B12", distUM: "distancia", slope: "pendiente", mag: "magnetometría" }[f]} ${fmt(S.sd[j], AREA.F[f].d + 1)}${AREA.F[f].unit ? " " + AREA.F[f].unit : ""}`).join(" · ")}.`;
    }
    render(); return render;
  });

  /* ───────── L1 vs L2: coefficient path over λ ───────── */
  demo("lr-regular", () => {
    const D = TAB(), S = FIT5().S, lams = Array.from({ length: 36 }, (_, i) => -3 + i * 0.1);
    const truthIdx = [], tv = []; for (let k = 0; k < AREA.N; k++) if (!AREA.mine[k]) { truthIdx.push(S.apply(AREA.row(k, F5))); tv.push(AREA.truth[k]); }
    const PATH = {};
    const path_ = pen => PATH[pen] || (PATH[pen] = (() => {    // warm-started along the λ grid, from strong to weak penalty
      const m = ML.logisticInit(5), out = [];
      lams.slice().reverse().forEach(lg => { const lam = 10 ** lg, o = pen === "l1" ? { l1: lam } : { l2: lam }, lr = pen === "l2" ? Math.min(3, 1 / lam) : 3;
        for (let t = 0; t < 220; t++) ML.logisticStep(m, S.Z, D.y, { lr, ...o });
        const p = S.Z.map(z => sig(m.b0 + z.reduce((a, v, j) => a + v * m.b[j], 0))), pt = truthIdx.map(z => sig(m.b0 + z.reduce((a, v, j) => a + v * m.b[j], 0)));
        out.unshift({ b: m.b.slice(), b0: m.b0, ll: ML.logloss(p, D.y), auc: ML.auc(pt, tv), prauc: ML.prAuc(pt, tv) }); });
      return out; })());
    let pen = "l1"; chips($("#lrRgPen"), v => { pen = v; render(); });
    const gl = slider("lrRgLam", v => fmtE(10 ** v), () => render());
    function render() {
      const P = path_(pen), i = clamp(Math.round((gl() + 3) / 0.1), 0, lams.length - 1), r = P[i], mx = Math.max(...P[0].b.map(Math.abs));
      VIZ.curves($("#lrRgFig"), F5.map((f, j) => ({ pts: P.map((q, k) => [lams[k], q.b[j]]), col: FCOL[f], label: nm(f) })),
        { xr: [-3, 0.5], yr: [-3, 1.6], W: 480, H: 300, xl: "λ (escala log)", yl: "β (estandarizado)", xt: [-3, -2, -1, 0], yt: [-3, -2, -1, 0, 1], xf: v => ["0,001", "0,01", "0,1", "1"][v + 3], yf: v => fmt(v, 0), marks: [[lams[i], "λ actual", "--fg"]], legendAt: "br" });
      VIZ.bars($("#lrRgBars"), F5.map((f, j) => ({ label: nm(f), v: r.b[j], col: FCOL[f] })), { signed: true, labelW: 170, W: 440, rowH: 21, max: mx, digits: 2 });
      const nz = r.b.filter(v => Math.abs(v) > 1e-9).length;
      $("#lrRgRead").innerHTML = `<div><span>Coeficientes ≠ 0</span><b>${nz} / 5</b></div><div><span>Log-loss (tabla)</span><b>${fmt(r.ll, 3)}</b></div><div><span>PR-AUC vs verdad</span><b class="c-ok">${fmt(r.prauc, 2)}</b></div>`;
      // λ above which each coefficient stays at exactly 0: the order in which L1 switches variables off
      const off = F5.map((f, j) => { let k = P.length - 1; while (k > 0 && Math.abs(P[k - 1].b[j]) < 1e-9) k--; return { f, k }; }).sort((a, b) => a.k - b.k);
      const flips = F5.filter((f, j) => P.some(q => q.b[j] > 1e-9) && P.some(q => q.b[j] < -1e-9)).map(f => nm(f).toLowerCase());
      const cap = t => t[0].toUpperCase() + t.slice(1);
      const tail = `${flips.length ? ` ${cap(flips.join(" y "))} cambia de signo: con λ grande sustituye a la distancia, con la que está correlacionada.` : ""} Con λ pequeño la distancia sale de la escala: los positivos casi se separan y, sin penalización, su β crece sin límite. El PR-AUC (contra la verdad sintética) baja un poco: se gana estabilidad y simplicidad, no puntaje.`;
      $("#lrRgNote").innerHTML = pen === "l1"
        ? `L1 deja coeficientes en <b>exactamente 0</b>. Al subir λ se apagan primero <b>${nm(off[0].f).toLowerCase()}</b> (λ ≈ ${fmtE(10 ** lams[off[0].k])}) y <b>${nm(off[1].f).toLowerCase()}</b>; la última es ${nm(off[4].f).toLowerCase()}.` + tail
        : "L2 encoge todos los coeficientes hacia 0, pero ninguno llega a 0 exacto, y reparte el peso entre variables correlacionadas." + tail;
    }
    render(); return render;
  });

  /* ───────── imbalance: threshold, confusion matrix, PR vs ROC, class weights ───────── */
  demo("lr-desbalance", () => {
    const D = AREA.data({}), n = D.y.length, P = D.y.reduce((a, b) => a + b, 0), FITS = {};
    const fit = w => FITS[w] || (FITS[w] = (() => { const f = fitStd(D.X, D.y, { iters: 1200, classWeight: w === "balanced" ? "balanced" : null }), p = f.S.Z.map(f.m.predict);
      const thin = c => c.filter((_, i) => i % 4 === 0 || i === c.length - 1);
      return { p, pr: thin(ML.prCurve(p, D.y)), roc: thin(ML.rocCurve(p, D.y)), auc: ML.auc(p, D.y), prauc: ML.prAuc(p, D.y) }; })());
    let w = "none"; chips($("#lrImW"), v => { w = v; render(); });
    const gt = slider("lrImThr", v => fmt(v, 2), () => render());
    function render() {
      const F = fit(w), t = gt(), C = ML.confusion(F.p, D.y, t), hidden = F.p.filter((p, i) => p >= t && !D.y[i] && AREA.truth[D.cells[i]]).length;
      const cellS = (v, lab, tok) => `<td style="padding:6px 10px;border:1px solid var(--line);text-align:center"><div class="mono" style="font-size:20px;color:var(${tok})">${fmtN(v)}</div><div class="note" style="margin:0;font-size:11.5px">${lab}</div></td>`;
      $("#lrImTable").innerHTML = `<table style="border-collapse:collapse;font-size:13px;margin-top:6px"><tr><td></td><th style="padding:4px 8px;font-weight:500">marcada (p ≥ ${fmt(t, 2)})</th><th style="padding:4px 8px;font-weight:500">no marcada</th></tr>
        <tr><th style="padding:4px 8px;font-weight:500;text-align:right">laterita conocida</th>${cellS(C.tp, "verdadero positivo", "--lw")}${cellS(C.fn, "falso negativo", "--muted")}</tr>
        <tr><th style="padding:4px 8px;font-weight:500;text-align:right">no etiquetada</th>${cellS(C.fp, "«falso» positivo", "--cool")}${cellS(C.tn, "verdadero negativo", "--muted")}</tr></table>`;
      $("#lrImRead").innerHTML = `<div><span>Exactitud</span><b>${fmt(100 * C.accuracy, 1)} %</b></div><div><span>«Todo 0»</span><b style="color:var(--muted)">${fmt(100 * (n - P) / n, 1)} %</b></div><div><span>Precisión</span><b class="c-sw">${fmt(C.precision, 2)}</b></div><div><span>Recall</span><b class="c-lw">${fmt(C.recall, 2)}</b></div>`;
      const dot = (c, x, y, tok) => el("circle", { cx: c.x(x), cy: c.y(y), r: 6, fill: css(tok), stroke: css("--bg"), "stroke-width": 2 }, c.svg);
      const cp = VIZ.curves($("#lrImPrFig"), [{ pts: F.pr, col: "--accent", label: `PR-AUC ${fmt(F.prauc, 2)}` }, { pts: [[0, P / n], [1, P / n]], col: "--muted", dash: "4 4", label: "azar" }],
        { W: 260, H: 230, xl: "recall", yl: "precisión", legendAt: "tr" });
      dot(cp, C.recall, C.precision, "--lw");
      const cr = VIZ.curves($("#lrImRocFig"), [{ pts: F.roc, col: "--accent", label: `ROC-AUC ${fmt(F.auc, 3)}` }], { W: 260, H: 230, xl: "tasa de falsos positivos", yl: "recall", diag: true });
      dot(cr, C.fpr, C.recall, "--lw");
      const other = fit(w === "none" ? "balanced" : "none"), at = (q, th) => { const c = ML.confusion(q.p, D.y, th); return 100 * (c.tp + c.fp) / n; }, mine = w === "none" ? F : other, bal = w === "none" ? other : F;
      $("#lrImNote").innerHTML = `Área marcada: <b>${fmt(100 * (C.tp + C.fp) / n, 1)} %</b>. ${hidden ? `De los ${fmtN(C.fp)} «falsos» positivos, <b>${hidden}</b> son laterita real aún sin descubrir (verdad sintética). ` : ""}`
        + `Con umbral 0,5 se marca el ${fmt(at(mine, 0.5), 1)} % del área sin pesos y el ${fmt(at(bal, 0.5), 1)} % con pesos balanceados (cada positivo pesa ~${fmtN((n - P) / P)} veces más): los pesos suben todas las p, así que mueven sobre todo el umbral efectivo; el orden cambia poco (PR-AUC ${fmt(mine.prauc, 2)} sin pesos, ${fmt(bal.prauc, 2)} con pesos).`;
    }
    render(); return render;
  });

  /* ───────── recap quiz ───────── */
  demo("lr-repaso", () => {
    VIZ.quiz($("#lrRepQuiz"), [
      { q: "En una tabla con 2 % de positivos, un modelo tiene 98 % de exactitud. ¿Qué concluyes?", opts: ["Es excelente", "Nada: «todo 0» también da 98 %", "Está sobreajustado"], right: 1, why: "Con clases tan desbalanceadas la exactitud la domina la clase mayoritaria; mira precisión, recall y PR-AUC." },
      { q: "Activas pesos de clase balanceados. ¿Qué cambia sobre todo?", opts: ["El orden de las celdas", "El nivel de las p (qué marca un umbral fijo)", "Nada"], right: 1, why: "Los pesos suben todas las p (el intercepto y algo los coeficientes); el ranking, y con él PR-AUC y ROC-AUC, cambia poco." },
      { q: "Una celda no etiquetada recibe p = 0,9. ¿Es un error del modelo?", opts: ["Sí, un falso positivo", "No necesariamente: puede ser laterita sin descubrir", "Solo si está lejos de la mina"], right: 1, why: "No etiquetado no significa negativo (datos PU). Esas celdas son justamente los blancos de exploración que se buscan." }]);
    return () => {};
  });
}
