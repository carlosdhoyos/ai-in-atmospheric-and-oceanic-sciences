/* ═════════ PAE-Minas · section 5: boosting (our from-scratch second-order booster, XGBoost-like and LightGBM-like) ═════════ */
{
  /* shared, lazily built: the 5-feature table, one spatial-block validation fold, every map cell as a feature row */
  const BO = (() => {
    let c = null;
    return () => c || (c = (() => {
      const D = AREA.data({ unlabeled: 1200, seed: 1 }), V = 3, folds = ML.blockFolds(D.cells, 4, 3, 2), tr = [], va = [];
      folds.forEach((f, i) => (f === V ? va : tr).push(i));
      const blockFold = new Map(); D.cells.forEach((k, i) => blockFold.set(AREA.block(k, 3), folds[i]));
      const valBlock = []; for (let k = 0; k < AREA.N; k++) if (blockFold.get(AREA.block(k, 3)) === V) valBlock.push(k);
      const rows = [...Array(AREA.N).keys()].map(k => AREA.row(k, D.feats)), validCells = [...Array(AREA.N).keys()].filter(k => !AREA.mine[k]);
      const Xt = tr.map(i => D.X[i]), yt = tr.map(i => D.y[i]), Xv = va.map(i => D.X[i]), yv = va.map(i => D.y[i]);
      const nPos = yt.reduce((a, b) => a + b, 0);
      return { D, Xt, yt, Xv, yv, valBlock, rows, validCells, truthV: validCells.map(k => AREA.truth[k]), valid: AREA.mine.map(v => !v), spw: (yt.length - nPos) / nPos, nPos, nNeg: yt.length - nPos };
    })());
  })();
  const SH = { ferric: "Fe", clay: "Arc", distUM: "dUM", slope: "pend", mag: "mag" };
  const sgn = (v, d = 2) => (v >= 0 ? "+" : "−") + fmt(Math.abs(v), d);
  /* a probability map of a boosted model (optionally truncated at round `upto`), and its ranking vs the synthetic truth */
  const mapScore = (m, upto) => { const B = BO(), s = new Float64Array(AREA.N); for (let k = 0; k < AREA.N; k++) s[k] = m.predict(B.rows[k], upto); return s; };
  const truthMetrics = s => { const B = BO(), p = B.validCells.map(k => s[k]); return { auc: ML.auc(p, B.truthV), pr: ML.prAuc(p, B.truthV) }; };
  /* weighted log-loss curves per round, computed from the trees themselves (works for any scale_pos_weight) */
  function lossCurves(m, X, y, w = 1) {
    const F = X.map(() => m.base), out = [];
    m.trees.forEach(t => {
      let s = 0, W = 0;
      for (let i = 0; i < X.length; i++) { F[i] += t.value(X[i]); const p = ML.sig(F[i]), ww = y[i] ? w : 1; s -= ww * Math.log(Math.max(y[i] ? p : 1 - p, 1e-12)); W += ww; }
      out.push(s / W);
    });
    return out;
  }
  /* a vertical marker on a VIZ.curves chart, label kept inside the plot */
  const vmark = (C, x, label, tok, W, H, y = 24) => { const px = C.x(x), end = px > 0.7 * W;
    el("line", { x1: px, x2: px, y1: 12, y2: H - 28, stroke: css(tok), "stroke-dasharray": "3 3" }, C.svg);
    el("text", { x: end ? px - 4 : px + 4, y, "text-anchor": end ? "end" : "start", "font-size": 10.5, fill: css(tok) }, C.svg, label); };
  const argmin = a => a.reduce((b, v, i) => v < a[b] ? i : b, 0);

  /* a small tree drawing: internal nodes at their depth, leaves on the bottom row.
     open(n): is n drawn as split (default n.left); nodeLab(n), leafTop(n), leafBot(n): strings; hi: the node to frame */
  function drawTree(host, root, { W = 520, H = 170, open = n => !!n.left, nodeLab, leafTop = () => "", leafBot = () => "", leafCol = () => css("--muted"), hi = null, hiCol = "--fg" } = {}) {
    const svg = svgIn(host, W, H), leaves = [], inner = []; let md = 0;
    (function walk(n, d) { n._d = d; if (open(n)) { inner.push(n); md = Math.max(md, d + 1); walk(n.left, d + 1); walk(n.right, d + 1); } else leaves.push(n); })(root, 0);
    const lw = (W - 16) / leaves.length, yLeaf = H - 34, dy = md > 1 ? Math.min(34, (yLeaf - 44) / (md - 1)) : 0;
    leaves.forEach((l, i) => { l._x = 8 + lw * (i + .5); l._y = yLeaf; });
    (function pos(n) { if (open(n)) { pos(n.left); pos(n.right); n._x = (n.left._x + n.right._x) / 2; n._y = 12 + n._d * dy; } })(root);
    inner.forEach(n => [n.left, n.right].forEach((c, s) => {
      el("path", { d: `M${n._x} ${n._y + 8} L${c._x} ${c._y - (open(c) ? 8 : 9)}`, stroke: css("--line"), "stroke-width": 1.4, fill: "none" }, svg);
    }));
    inner.forEach(n => {
      const t = nodeLab(n), w = t.length * 5.6 + 10;
      el("rect", { x: n._x - w / 2, y: n._y - 8, width: w, height: 16, rx: 5, fill: css("--card"), stroke: css("--line") }, svg);
      el("text", { x: n._x, y: n._y + 4, "text-anchor": "middle", "font-size": 10, class: "mono" }, svg, t);
    });
    leaves.forEach(l => {
      const on = l === hi, s = Math.min(lw - 6, 30);
      el("rect", { x: l._x - s / 2, y: l._y - 9, width: s, height: 18, rx: 4, fill: l.col || leafCol(l), opacity: .85, stroke: on ? css(hiCol) : "none", "stroke-width": on ? 3 : 0 }, svg);
      el("text", { x: l._x, y: l._y - 13, "text-anchor": "middle", "font-size": 9.5, class: "mono", fill: on ? css(hiCol) : css("--muted"), "font-weight": on ? 600 : 400 }, svg, leafTop(l));
      el("text", { x: l._x, y: l._y + 22, "text-anchor": "middle", "font-size": 9.5, class: "mono", fill: css("--muted") }, svg, leafBot(l));
    });
    return { svg, leaves, inner, depth: md };
  }

  /* ───────── opener: forest (average of independent deep trees) vs boosting (sum of small sequential trees) ───────── */
  demo("s-boosting", () => {
    const D1 = AREA.data({ feats: ["mag"], unlabeled: 400, seed: 3 });
    const fr = ML.forest(D1.X, D1.y, { nTrees: 30, maxDepth: 4, minLeaf: 5, mtry: 1, seed: 2 });
    const bs = ML.boost(D1.X, D1.y, { nRounds: 30, eta: 0.3, maxDepth: 1, lambda: 1 });
    const gk = slider("boOpK", v => v, () => render()), xs = Array.from({ length: 121 }, (_, i) => -60 + i * 380 / 120);
    // a little tree icon: depth levels, colour token
    const icon = (svg, x, y, depth, tok, on) => {
      const g = el("g", { opacity: on ? 1 : .3 }, svg), sp = depth === 1 ? 9 : 8;
      const nodes = [[x, y]]; let lev = [[x, y]];
      for (let d = 0; d < depth; d++) { const nx = []; lev.forEach(([a, b]) => { const w = sp * 2 ** (depth - d - 1) * 0.5; [[a - w, b + 12], [a + w, b + 12]].forEach(c => { el("line", { x1: a, y1: b, x2: c[0], y2: c[1], stroke: css(tok), "stroke-width": 1.4 }, g); nx.push(c); }); }); lev = nx; nodes.push(...nx); }
      nodes.forEach(([a, b]) => el("circle", { cx: a, cy: b, r: 2.6, fill: css(tok) }, g));
    };
    function render() {
      const k = gk(), W = 460, H = 150, svg = svgIn($("#boOpFig"), W, H); arrowDefs(svg, "boOpAr", css("--muted"));
      el("text", { x: 0, y: 14, "font-size": 12, "font-weight": 600, fill: css("--ok") }, svg, "Bosque aleatorio: en paralelo, se promedia");
      el("text", { x: 0, y: 92, "font-size": 12, "font-weight": 600, fill: css("--sw") }, svg, "Boosting: en secuencia, se suma");
      [0, 1, 2, 3].forEach(i => { const x = 40 + i * 78; icon(svg, x, 26, 3, "--ok", i < k); el("text", { x, y: 76, "text-anchor": "middle", "font-size": 9.5, fill: css("--muted") }, svg, `muestra ${i + 1}`);
      });
      el("line", { x1: 310, y1: 46, x2: 352, y2: 46, stroke: css("--muted"), "marker-end": "url(#boOpAr)" }, svg);
      el("rect", { x: 356, y: 34, width: 100, height: 24, rx: 8, fill: css("--ok-soft"), stroke: css("--ok") }, svg);
      el("text", { x: 406, y: 50, "text-anchor": "middle", "font-size": 11.5 }, svg, `promedio de ${k}`);
      [0, 1, 2, 3].forEach(i => { const x = 30 + i * 82; icon(svg, x, 108, 1, "--sw", i < k);
        el("text", { x, y: 142, "text-anchor": "middle", "font-size": 9.5, fill: css("--muted") }, svg, `árbol ${i + 1}`);
        if (i < 3) { el("line", { x1: x + 14, y1: 114, x2: x + 66, y2: 114, stroke: css("--muted"), "marker-end": "url(#boOpAr)" }, svg); el("text", { x: x + 40, y: 108, "text-anchor": "middle", "font-size": 9, fill: css("--muted") }, svg, "residuo"); } });
      el("line", { x1: 290, y1: 114, x2: 352, y2: 114, stroke: css("--muted"), "marker-end": "url(#boOpAr)" }, svg);
      el("rect", { x: 356, y: 102, width: 100, height: 24, rx: 8, fill: css("--sw-soft"), stroke: css("--sw") }, svg);
      el("text", { x: 406, y: 118, "text-anchor": "middle", "font-size": 11.5 }, svg, `base + η·Σ ${k} árb.`);
      const fC = xs.map(x => [x, mean(fr.trees.slice(0, k).map(t => t.predict([x])))]), bC = xs.map(x => [x, bs.predict([x], k)]);
      const C = VIZ.curves($("#boOpCurve"), [{ pts: fC, col: "--ok", label: `bosque: promedio de ${k} árbol${k > 1 ? "es" : ""} (prof. 4)` }, { pts: bC, col: "--sw", label: `boosting: base + ${k} tocón${k > 1 ? "es" : ""} × η = 0,3` }],
        { xr: [-60, 320], yr: [0, 1], W: 460, H: 190, xl: "anomalía magnética (nT)", yl: "p", xt: [0, 100, 200, 300], xf: v => fmt(v, 0), legendAt: "tl" });
      D1.X.forEach((x, i) => { const px = C.x(clamp(x[0], -60, 320)), pos = D1.y[i];
        el("line", { x1: px, x2: px, y1: pos ? 13 : 156, y2: pos ? 19 : 162, stroke: css(pos ? "--lw" : "--cool"), opacity: pos ? .7 : .35 }, C.svg); });
    }
    render(); return render;
  });

  /* ───────── gradient boosting step by step on two features ───────── */
  demo("bo-pasos", slide => {
    const feats = ["ferric", "mag"], D2 = AREA.data({ feats, unlabeled: 400, seed: 3 }), R = 30, cache = {};
    const xr = [1.0, 2.0], yr = [-60, 320], NM = ["Fe", "mag"], DIG = [2, 0];
    let r = 0, timer = null, sel = -1, view = "res";
    const gEta = slider("boPsEta", v => fmt(v, 2), () => { stop(); render(); });
    const fit = () => { const e = gEta(); return cache[e] || (cache[e] = ML.boost(D2.X, D2.y, { nRounds: R, eta: e, maxDepth: 2, lambda: 1, nBins: 32 })); };
    chips($("#boPsView"), v => { view = v; render(); });
    const stop = () => { clearInterval(timer); timer = null; $("#boPsPlay").textContent = "Reproducir"; };
    $("#boPsStep").onclick = () => { stop(); r = Math.min(R, r + 1); render(); };
    $("#boPsReset").onclick = () => { stop(); r = 0; render(); };
    $("#boPsPlay").onclick = () => {
      if (timer) return stop();
      if (r >= R) r = 0;
      $("#boPsPlay").textContent = "Pausa";
      timer = setInterval(() => { if (!slide.classList.contains("on") || r >= R) return stop(); r++; render(); }, 650);
    };
    // default sample: a positive that the model finds hard (lowest probability after 10 rounds with η = 0,3)
    { const m = fit(); let best = 1; D2.X.forEach((x, i) => { if (!D2.y[i]) return; const p = m.predict(x, 10); if (p < best) { best = p; sel = i; } }); }
    // split lines of a tree inside the scatter (recursive boxes)
    function splits(svg, S, nd, box) {
      if (!nd.left) {
        const [x0, x1, y0, y1] = box, cx = (S.X(x0) + S.X(x1)) / 2, cy = (S.Y(y0) + S.Y(y1)) / 2, w = S.X(x1) - S.X(x0), h = S.Y(y0) - S.Y(y1);
        if (w > 44 && h > 18) { const t = sgn(nd.v, 2), tw = t.length * 6.4 + 8;
          el("rect", { x: cx - tw / 2, y: cy - 9, width: tw, height: 17, rx: 4, fill: css("--card"), opacity: .9 }, svg);
          el("text", { x: cx, y: cy + 4, "text-anchor": "middle", "font-size": 11, class: "mono", fill: css(nd.v >= 0 ? "--pos" : "--neg") }, svg, t); }
        return;
      }
      const [x0, x1, y0, y1] = box, t = clamp(nd.t, nd.f ? y0 : x0, nd.f ? y1 : x1);
      if (nd.f === 0) el("line", { x1: S.X(t), x2: S.X(t), y1: S.Y(y0), y2: S.Y(y1), stroke: css("--fg"), "stroke-width": 2, "stroke-dasharray": "5 3" }, svg);
      else el("line", { x1: S.X(x0), x2: S.X(x1), y1: S.Y(t), y2: S.Y(t), stroke: css("--fg"), "stroke-width": 2, "stroke-dasharray": "5 3" }, svg);
      splits(svg, S, nd.left, nd.f === 0 ? [x0, t, y0, y1] : [x0, x1, y0, t]);
      splits(svg, S, nd.right, nd.f === 0 ? [t, x1, y0, y1] : [x0, x1, t, y1]);
    }
    function render() {
      const m = fit(), e = gEta(), next = r < R ? m.trees[r] : null;
      const S = VIZ.scatter($("#boPsFig"), view === "prob" ? D2.X.map((x, i) => ({ x: x[0], y: x[1], cls: D2.y[i], hi: i === sel })) : [],
        { xr, yr, W: 460, H: 262, xl: "hierro férrico B4/B2", yl: "anomalía magnética (nT)", bg: (x, y) => m.predict([x, y], r), xf: v => fmt(v, 2), yf: v => fmt(v, 0), xt: [1, 1.25, 1.5, 1.75, 2], yt: [0, 100, 200, 300] });
      if (view === "res") {
        const ord = [...D2.X.keys()].sort((a, b) => D2.y[a] - D2.y[b]);
        ord.forEach(i => { const x = D2.X[i], res = D2.y[i] - m.predict(x, r);
          el("circle", { cx: S.X(clamp(x[0], ...xr)), cy: S.Y(clamp(x[1], ...yr)), r: 1.8 + 5 * Math.abs(res), fill: css(res >= 0 ? "--pos" : "--neg"), opacity: .8, stroke: i === sel ? css("--fg") : css("--bg"), "stroke-width": i === sel ? 2.2 : .6 }, S.svg); });
        if (next) splits(S.svg, S, next.root, [xr[0], xr[1], yr[0], yr[1]]);
      }
      S.svg.addEventListener("click", ev => {
        const b = S.svg.getBoundingClientRect(), px = (ev.clientX - b.left) * 460 / b.width, py = (ev.clientY - b.top) * 460 / b.width;
        let bi = -1, bd = 1e9; D2.X.forEach((x, i) => { const d = (S.X(x[0]) - px) ** 2 + (S.Y(x[1]) - py) ** 2; if (d < bd) { bd = d; bi = i; } });
        if (bd < 400) { sel = bi; render(); }
      });
      const L = r ? m.trainLoss[r - 1] : ML.logloss(D2.y.map(() => ML.sig(m.base)), D2.y);
      $("#boPsTitle").innerHTML = `Ronda ${r} de ${R} · fondo: p tras ${r} árbol${r === 1 ? "" : "es"} · log-loss ${fmt(L, 3)}`;
      $("#boPsTreeT").innerHTML = next ? `Árbol ${r + 1}, ajustado a esos residuos · hojas: <span style="text-transform:none">η·w</span>` : "Fin: 30 árboles sumados";
      if (next) drawTree($("#boPsTree"), next.root, { W: 460, H: 112, nodeLab: n => `${NM[n.f]} ≤ ${fmt(n.t, DIG[n.f])}`, leafTop: l => sgn(l.v, 3), leafBot: l => `G ${fmt(l.G, 1)} · H ${fmt(l.H, 1)}`,
        leafCol: l => div(l.v, 0.8) });
      else $("#boPsTree").innerHTML = `<p class="note" style="margin:6px 0">Pulsa «Reiniciar» para volver a la ronda 0.</p>`;
      // the log-odds of the selected sample, built tree by tree
      const x = D2.X[sel], terms = m.trees.slice(0, r).map(t => t.value(x)), F = m.base + terms.reduce((a, b) => a + b, 0), p = ML.sig(F);
      const show = terms.length <= 3 ? terms.map((v, j) => [j, v]) : [[0, terms[0]], [1, terms[1]], null, [terms.length - 1, terms.at(-1)]];
      $("#boPsCalc").innerHTML = `<span class="m">muestra: y = ${D2.y[sel]} (${D2.y[sel] ? "positivo" : "no etiquetada"}) · Fe ${fmt(x[0], 2)} · mag ${fmt(x[1], 0)} nT</span>\n`
        + `F₀ = <span class="k">${sgn(m.base, 3)}</span>  <span class="m">(log-odds de la tasa base ${fmt(100 * ML.sig(m.base), 0)} %)</span>\n`
        + show.map(s => s ? ` + η·árbol${s[0] + 1} = <span class="${s[1] >= 0 ? "g" : "r"}">${sgn(s[1], 3)}</span>` : `   … ${terms.length - 3} árbol${terms.length - 3 > 1 ? "es" : ""} más: ${sgn(terms.slice(2, -1).reduce((a, b) => a + b, 0), 3)}`).join("\n") + (terms.length ? "\n" : "")
        + `F = <b>${sgn(F, 3)}</b> → p = σ(F) = <b>${fmt(p, 3)}</b> · residuo y − p = <span class="${D2.y[sel] - p >= 0 ? "g" : "r"}">${sgn(D2.y[sel] - p, 3)}</span>`
        + (next ? `\nel árbol ${r + 1} le sumará <span class="${next.value(x) >= 0 ? "g" : "r"}">${sgn(next.value(x), 3)}</span> <span class="m">(η = ${fmt(e, 2)})</span>` : "");
    }
    render(); return render;
  });

  /* ───────── XGBoost-like: hyper-parameters, train vs spatial-validation loss, the root split in numbers ───────── */
  demo("bo-xgb", slide => {
    const ids = ["Eta", "N", "D", "L", "G", "M", "S", "C"], F = { Eta: v => fmt(v, 2), N: v => v, D: v => v, L: v => fmt(v, 1), G: v => fmt(v, 2), M: v => fmt(v, 1), S: v => fmt(v, 1), C: v => fmt(v, 1) };
    let tmo = null; const cache = new Map();
    const get = Object.fromEntries(ids.map(k => [k, slider("boXg" + k, F[k], () => { clearTimeout(tmo); tmo = setTimeout(render, 60); })]));
    const fit = () => {
      const o = { eta: get.Eta(), nRounds: get.N(), maxDepth: get.D(), lambda: get.L(), gamma: get.G(), minChildWeight: get.M(), subsample: get.S(), colsample: get.C() }, key = JSON.stringify(o);
      if (!cache.has(key)) {
        const B = BO(), m = ML.boost(B.Xt, B.yt, { ...o, nBins: 32, seed: 3, evalX: B.Xv, evalY: B.yv }), s = mapScore(m);
        cache.set(key, { o, m, s, met: truthMetrics(s) });
      }
      return cache.get(key);
    };
    function render() {
      const B = BO(), { o, m, s, met } = fit(), n = o.nRounds, best = argmin(m.evalLoss), ymax = Math.max(0.3, Math.min(0.6, Math.max(...m.evalLoss) * 1.1));
      const CX = VIZ.curves($("#boXgFig"), [{ pts: m.trainLoss.map((v, i) => [i + 1, v]), col: "--sw", dash: "5 4" }, { pts: m.evalLoss.map((v, i) => [i + 1, v]), col: "--sw", w: 2.6 }],
        { xr: [0, n], yr: [0, ymax], W: 460, H: 150, xl: "ronda", xf: v => fmt(v, 0), yf: v => fmt(v, 2), xt: [0, Math.round(n / 2), n], yt: [0, ymax / 2, ymax] });
      vmark(CX, best + 1, `mínimo de validación: ronda ${best + 1}`, "--fg", 460, 150);
      VIZ.map($("#boXgMap"), s, { valid: B.valid, deposits: "all", hi: B.valBlock, scale: 4 });
      VIZ.legend($("#boXgLeg"), { width: 200 });
      $("#boXgRead").innerHTML = `<div><span>log-loss val. mín.</span><b>${fmt(m.evalLoss[best], 3)}</b></div><div><span>en la ronda</span><b>${best + 1}</b></div>`
        + `<div><span>val. al final</span><b class="${m.evalLoss[n - 1] > 1.15 * m.evalLoss[best] ? "c-lw" : ""}">${fmt(m.evalLoss[n - 1], 3)}</b></div><div><span>AUC / PR-AUC vs verdad</span><b class="c-sw" style="font-size:20px">${fmt(met.auc, 2)} / ${fmt(met.pr, 2)}</b></div>`;
      // the root split of the first tree, in numbers
      const rt = m.trees[0].root, lam = o.lambda, sc = (G, H) => G * G / (H + lam);
      let t = `<span class="m">Raíz del árbol 1 · ${rt.ids ? fmtN(rt.ids.length) + " celdas" : "celdas"} de entrenamiento${o.subsample < 1 ? " (submuestra)" : ""}</span>\nG = ${fmt(Math.abs(rt.G) < 0.005 ? 0 : rt.G, 2)}   H = ${fmt(rt.H, 2)}   <span class="m">${Math.abs(rt.G) < 0.005 ? "(≈ 0: la base ya es la media)" : "→ w = " + fmt(-rt.G / (rt.H + lam), 3)}</span>\n`;
      if (rt.left) {
        const { left: Lf, right: Rt } = rt, f = AREA.F[B.D.feats[rt.f]];
        t += `mejor corte: <span class="k">${f.es} ≤ ${fmt(rt.t, f.d + 1)}</span>\n`
          + `izq.: G<sub>L</sub> = ${fmt(Lf.G, 2)}  H<sub>L</sub> = ${fmt(Lf.H, 2)}  w<sub>L</sub> = ${sgn(-Lf.G / (Lf.H + lam), 3)}\n`
          + `der.: G<sub>R</sub> = ${fmt(Rt.G, 2)}  H<sub>R</sub> = ${fmt(Rt.H, 2)}  w<sub>R</sub> = ${sgn(-Rt.G / (Rt.H + lam), 3)}\n`
          + `ganancia = ½ [${fmt(sc(Lf.G, Lf.H), 2)} + ${fmt(sc(Rt.G, Rt.H), 2)} − ${fmt(sc(rt.G, rt.H), 2)}] − ${fmt(o.gamma, 2)} = <span class="g">${fmt(rt.gain, 2)}</span>`;
      } else t += `<span class="r">ningún corte tiene ganancia positiva (γ o min_child_weight demasiado altos): el árbol es una sola hoja.</span>`;
      $("#boXgCalc").innerHTML = t;
    }
    render(); return render;
  });

  /* ───────── LightGBM-like: histogram bins and leaf-wise vs level-wise growth of one tree ───────── */
  demo("bo-lgbm", () => {
    const B = BO(), D = B.D, o = { nRounds: 1, eta: 1, lambda: 1, minChildWeight: 1, nBins: 32 };
    const leafTrees = {}, leafTree = k => leafTrees[k] || (leafTrees[k] = ML.boost(D.X, D.y, { ...o, growth: "leaf", numLeaves: k, maxDepth: 20 }).trees[0].root);
    const depthRoot = ML.boost(D.X, D.y, { ...o, growth: "depth", maxDepth: 5 }).trees[0].root;
    const bfs = []; { let lev = [depthRoot]; while (lev.length) { const nx = []; lev.forEach(n => { if (n.left) { bfs.push(n); nx.push(n.left, n.right); } }); lev = nx; } }
    const gk = slider("boLgK", v => v, () => render()), gb = slider("boLgB", v => v, () => renderBins());
    const nm = n => `${SH[D.feats[n.f]]} ≤ ${fmt(n.t, AREA.F[D.feats[n.f]].d)}`;
    const cand = n => n.best ? n.best.gain : 0;
    // count rows and positives that reach each displayed leaf
    const counts = (root, open) => { const c = new Map(); D.X.forEach((x, i) => { let n = root; while (open(n)) n = x[n.f] <= n.t ? n.left : n.right; const v = c.get(n) || [0, 0]; v[0]++; v[1] += D.y[i]; c.set(n, v); }); return c; };
    function render() {
      const k = gk();
      // leaf-wise: the tree with k leaves; the next split is the leaf with the largest candidate gain
      const lr = leafTree(k), lOpen = n => !!n.left, lc = counts(lr, lOpen), lLeaves = []; (function w(n) { lOpen(n) ? (w(n.left), w(n.right)) : lLeaves.push(n); })(lr);
      const lNext = lLeaves.filter(l => l.best).reduce((a, b) => !a || b.best.gain > a.best.gain ? b : a, null);
      const lab = c => (n => { const v = c.get(n) || [0, 0]; return `${v[1]}/${v[0]}`; });
      const col = c => (n => { const v = c.get(n) || [0, 1]; return v[1] ? `color-mix(in srgb, ${css("--lw")} ${Math.round(25 + 75 * Math.min(1, v[1] / v[0] / 0.5))}%, ${css("--well")})` : css("--cool-soft"); });
      const T1 = drawTree($("#boLgLeaf"), lr, { W: 480, H: 150, nodeLab: nm, leafTop: l => l.best ? fmt(l.best.gain, 1) : "–", leafBot: lab(lc), leafCol: col(lc), hi: lNext, hiCol: "--mag" });
      // level-wise: the depth-wise tree, splits taken in breadth-first order until k leaves
      const openSet = new Set(bfs.slice(0, k - 1)), dOpen = n => openSet.has(n), dc = counts(depthRoot, dOpen), dNext = bfs[k - 1] || null;
      const T2 = drawTree($("#boLgLevel"), depthRoot, { W: 480, H: 132, open: dOpen, nodeLab: nm, leafTop: l => cand(l) ? fmt(cand(l), 1) : "–", leafBot: lab(dc), leafCol: col(dc), hi: dNext, hiCol: "--sw" });
      const gL = T1.inner.reduce((a, n) => a + n.gain, 0), gD = T2.inner.reduce((a, n) => a + n.gain, 0);
      const withPos = (lv, c) => lv.filter(l => (c.get(l) || [0, 0])[1] > 0).length;
      const two = (a, b) => `<b style="font-size:20px"><span style="color:var(--mag)">${a}</span> <span style="color:var(--muted)">/</span> <span style="color:var(--sw)">${b}</span></b>`;
      $("#boLgRead").innerHTML = `<div><span>Ganancia total hoja / nivel</span>${two(fmt(gL, 1), fmt(gD, 1))}</div><div><span>Profundidad</span>${two(T1.depth, T2.depth)}</div><div><span>Hojas con positivos</span>${two(withPos(T1.leaves, lc), withPos(T2.leaves, dc))}</div>`;
    }
    // histogram bins of the ferric ratio (same quantile rule as ML.boost)
    const fe = D.X.map(x => x[0]), sorted = fe.slice().sort((a, b) => a - b), distinct = new Set(fe).size;
    function renderBins() {
      const nb = gb(), e = []; for (let q = 1; q < nb; q++) { const t = sorted[Math.floor(q * sorted.length / nb)]; if (!e.length || t > e[e.length - 1]) e.push(t); }
      const W = 440, H = 108, svg = svgIn($("#boLgBinFig"), W, H), x0 = 0.95, x1 = 2.0, X = lin(x0, x1, 8, W - 8);
      // fraction of positives per bin as bars
      const lo = [x0, ...e], hi = [...e, x1];
      lo.forEach((a, b) => { const inb = D.X.map((x, i) => i).filter(i => fe[i] > (b ? a : -1e9) && fe[i] <= (b === e.length ? 1e9 : hi[b])), fp = inb.length ? inb.reduce((s, i) => s + D.y[i], 0) / inb.length : 0;
        el("rect", { x: X(a), y: 62 - 44 * Math.min(1, fp / 0.4), width: Math.max(0, X(hi[b]) - X(a) - .5), height: 44 * Math.min(1, fp / 0.4), fill: css("--lw"), opacity: .35 }, svg); });
      fe.forEach((v, i) => { const px = X(clamp(v, x0, x1)); el("line", { x1: px, x2: px, y1: D.y[i] ? 78 : 66, y2: D.y[i] ? 88 : 76, stroke: css(D.y[i] ? "--lw" : "--cool"), opacity: D.y[i] ? .7 : .25 }, svg); });
      e.forEach(t => el("line", { x1: X(t), x2: X(t), y1: 16, y2: 90, stroke: css("--mag"), "stroke-width": 1.2 }, svg));
      [1, 1.25, 1.5, 1.75, 2].forEach(v => el("text", { x: X(v), y: 104, "text-anchor": "middle", "font-size": 10, class: "mono", fill: css("--muted") }, svg, fmt(v, 2)));
      el("text", { x: 8, y: 10, "font-size": 10, fill: css("--muted") }, svg, `barras: % de positivos en cada bin · ${distinct} valores distintos → ${e.length} cortes candidatos`);
    }
    const all = () => { render(); renderBins(); };
    all(); return all;
  });

  /* ───────── few positives: scale_pos_weight, early stopping, greedy vs conservative ───────── */
  demo("bo-pocos", () => {
    const B = BO(), cache = {};
    const SET = { A: { eta: 0.3, maxDepth: 6, lambda: 0, minChildWeight: 0.05 }, B: { eta: 0.1, maxDepth: 2, lambda: 5, minChildWeight: 2, subsample: 0.8, colsample: 0.8 } };
    let spw = "1", stopMode = "all";
    $("#boPcSpwTxt").textContent = `(aquí ${fmtN(B.nNeg)}/${B.nPos} ≈ ${fmt(B.spw, 1)})`;
    chips($("#boPcSpw"), v => { spw = v; render(); }); chips($("#boPcStop"), v => { stopMode = v; render(); });
    const fit = (key, w) => {
      const id = key + w; if (cache[id]) return cache[id];
      const sw = w === "1" ? 1 : B.spw, m = ML.boost(B.Xt, B.yt, { nRounds: 150, nBins: 32, seed: 5, ...SET[key], scalePosWeight: sw });
      const tl = lossCurves(m, B.Xt, B.yt, sw), vl = lossCurves(m, B.Xv, B.yv, sw), best = argmin(vl);
      const sAll = mapScore(m), sBest = mapScore(m, best + 1);
      return cache[id] = { m, tl, vl, best, sAll, sBest, mAll: truthMetrics(sAll), mBest: truthMetrics(sBest) };
    };
    function render() {
      const A = fit("A", spw), C = fit("B", spw), ymax = 0.4, cl = v => Math.min(v, ymax);
      const CP = VIZ.curves($("#boPcFig"), [
        { pts: A.tl.map((v, i) => [i + 1, cl(v)]), col: "--rose", dash: "5 4" }, { pts: A.vl.map((v, i) => [i + 1, cl(v)]), col: "--rose", w: 2.6 },
        { pts: C.tl.map((v, i) => [i + 1, cl(v)]), col: "--sw", dash: "5 4" }, { pts: C.vl.map((v, i) => [i + 1, cl(v)]), col: "--sw", w: 2.6 }],
        { xr: [0, 150], yr: [0, ymax], W: 460, H: 180, xl: "ronda", xt: [0, 50, 100, 150], yt: [0, 0.2, 0.4], xf: v => fmt(v, 0), yf: v => fmt(v, 1), legendAt: "br" });
      if (A.vl[149] > ymax) el("text", { x: 448, y: CP.y(ymax) + 14, "text-anchor": "end", "font-size": 10.5, fill: css("--rose") }, CP.svg, `fuera de escala: ${fmt(A.vl[149], 2)} en la ronda 150 ↑`);
      vmark(CP, A.best + 1, `parada: ${A.best + 1}`, "--rose", 460, 180, 24); vmark(CP, C.best + 1, `parada: ${C.best + 1}`, "--sw", 460, 180, 38);
      const sm = r => stopMode === "best" ? r.sBest : r.sAll;
      VIZ.map($("#boPcMapA"), sm(A), { valid: B.valid, deposits: "all", hi: B.valBlock, scale: 4 });
      VIZ.map($("#boPcMapB"), sm(C), { valid: B.valid, deposits: "all", hi: B.valBlock, scale: 4 });
      VIZ.legend($("#boPcLeg"), { width: 240, label: spw === "1" ? "probabilidad" : "probabilidad (inflada por el peso)" });
      const row = (n, r, c) => { const mt = stopMode === "best" ? r.mBest : r.mAll;
        return `<tr><td style="color:var(${c});font-weight:600">${n}</td><td class="n">${fmt(r.tl[149], 3)}</td><td class="n">${fmt(r.vl[149], 3)}</td><td class="n">${fmt(r.vl[r.best], 3)} · ${r.best + 1}</td><td class="n">${fmt(mt.auc, 2)} / ${fmt(mt.pr, 2)}</td></tr>`; };
      $("#boPcTable").innerHTML = `<table class="tb" style="font-size:12.5px;white-space:nowrap"><tr><th></th><th>entren.</th><th>val.</th><th>val. mín. · ronda</th><th>AUC / PR</th></tr>` + row("Codicioso", A, "--rose") + row("Conservador", C, "--sw") + `</table>`
        + `<p class="note" style="margin:4px 0 0;font-size:12.5px">Log-loss tras 150 rondas${spw === "1" ? "" : ", ponderada con el mismo peso de los positivos"}. AUC y PR-AUC: mapa ${stopMode === "best" ? "con parada temprana" : "con 150 rondas"} frente a la laterita real (sintética).</p>`;
    }
    render(); return render;
  });

  /* ───────── what the model learned: ICE and partial dependence curves, a crude contribution ───────── */
  demo("bo-pdp", () => {
    const B = BO(), D = B.D, m = ML.boost(D.X, D.y, { nRounds: 120, eta: 0.1, maxDepth: 3, lambda: 1, nBins: 32 }), s = mapScore(m);
    const NG = 36, rngs = D.feats.map((f, j) => { const v = D.X.map(x => x[j]).sort((a, b) => a - b); return [v[Math.floor(0.01 * v.length)], v[Math.floor(0.99 * v.length) - 1]]; });
    const med = D.feats.map((f, j) => { const v = D.X.map(x => x[j]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; });
    const grid = rngs.map(([a, b]) => Array.from({ length: NG }, (_, i) => a + i * (b - a) / (NG - 1)));
    const r = rng(9), bg = Array.from({ length: 200 }, () => D.X[Math.floor(r() * D.X.length)]);
    const pd = grid.map((g, j) => g.map(v => mean(bg.map(x => { const z = x.slice(); z[j] = v; return m.predict(z); }))));
    // default cell: the centre of the largest undiscovered deposit
    const und = AREA.DEP.filter(d => !d.known).sort((a, b) => b.cells.length - a.cells.length)[0];
    let sel = und ? und.cells[Math.floor(und.cells.length / 2)] : 0;
    function render() {
      const mp = VIZ.map($("#boPdMap"), s, { valid: B.valid, deposits: "all", points: [{ k: sel, color: css("--fg"), r: 5 }] });
      mp.canvas.addEventListener("click", e => { const k = mp.cellAt(e); if (k >= 0 && !AREA.mine[k]) { sel = k; render(); } });
      VIZ.legend($("#boPdLeg"), { width: 170 });
      const x = B.rows[sel], p = m.predict(x), Fx = m.margin(x);
      const host = $("#boPdGrid"); host.innerHTML = D.feats.map((f, j) => `<div><div class="note" style="margin:0;font-size:12px">${AREA.F[f].es}${AREA.F[f].unit ? " (" + AREA.F[f].unit + ")" : ""}</div><div id="boPdG${j}"></div></div>`).join("");
      const contrib = [];
      D.feats.forEach((f, j) => {
        const ice = grid[j].map(v => { const z = x.slice(); z[j] = v; return [v, m.predict(z)]; }), [a, b] = rngs[j], F = AREA.F[f];
        const C = VIZ.curves($(`#boPdG${j}`), [{ pts: pd[j].map((v, i) => [grid[j][i], v]), col: "--muted", dash: "4 3", w: 1.6 }, { pts: ice, col: "--sw", w: 2.4 }],
          { xr: [a, b], yr: [0, 1], W: 170, H: 104, xt: [a, b], yt: [0, 1], xf: v => fmt(v, F.d), yf: v => fmt(v, 0) });
        const xv = clamp(x[j], a, b); el("circle", { cx: C.x(xv), cy: C.y(p), r: 4.5, fill: css("--fg"), stroke: css("--bg") }, C.svg);
        const z = x.slice(); z[j] = med[j]; contrib.push({ label: F.es, v: Fx - m.margin(z), col: Fx - m.margin(z) >= 0 ? "--pos" : "--neg" });
      });
      // one empty slot in the 3 × 2 grid: a key
      host.insertAdjacentHTML("beforeend", `<div class="note" style="font-size:12px;margin:0;align-self:center"><span style="color:var(--sw)">━</span> esta celda (ICE)<br><span style="color:var(--muted)">╌</span> promedio (dependencia parcial)<br>● valor actual de la celda</div>`);
      VIZ.bars($("#boPdBars"), contrib, { signed: true, labelW: 170, W: 460, rowH: 20, digits: 2 });
      const lab = AREA.mine[sel] ? "mina" : AREA.known[sel] ? "depósito conocido" : AREA.truth[sel] ? "laterita no descubierta" : AREA.redSoil[sel] > 0.3 ? "suelo rojo sobre sedimentos" : VIZ.LITHNAME[AREA.lith[sel]].split(" ")[0].toLowerCase();
      $("#boPdTitle").innerHTML = `Probabilidad al mover cada variable · celda: <span style="color:var(--fg)">${lab}</span>`;
      $("#boPdRead").innerHTML = `<div><span>p</span><b class="c-sw" style="font-size:20px">${fmt(p, 2)}</b></div><div><span>log-odds F</span><b style="font-size:20px">${sgn(Fx, 2)}</b></div>`;
    }
    render(); return render;
  });
}
