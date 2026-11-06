/* ═════════ PAE-Minas · section 4: decision trees, Random Forest, PU bagging ═════════
   Everything sits in a block so that helper names do not collide with other sections. */
{
  const DEF = ["ferric", "clay", "distUM", "slope", "mag"];
  const N = AREA.N, ALL = [...Array(N).keys()], VALID = AREA.mine.map(v => v ? 0 : 1), CELLS = ALL.filter(k => VALID[k]);
  const TRUTH_V = CELLS.map(k => AREA.truth[k]);
  const ROWS = {};                                   // feature rows of every cell, cached per feature list
  const rowsOf = feats => ROWS[feats.join()] || (ROWS[feats.join()] = ALL.map(k => AREA.row(k, feats)));
  /* average precision (PR-AUC) that treats tied scores as one threshold. ML.prAuc ranks ties by array order, and
     AREA.data puts the positives first, so pure-leaf trees (many tied 0/1 scores) would look far too good. */
  const ap = (p, y) => {
    const o = [...p.keys()].sort((a, b) => p[b] - p[a]), P = y.reduce((a, b) => a + b, 0); let tp = 0, fp = 0, s = 0, prev = 0;
    for (let i = 0; i < o.length;) { let j = i; while (j < o.length && p[o[j]] === p[o[i]]) { y[o[j]] ? tp++ : fp++; j++; } const r = tp / P; s += (r - prev) * tp / (tp + fp); prev = r; i = j; }
    return P ? s : 0;
  };
  const apMap = score => ap(CELLS.map(k => score[k]), TRUTH_V);           // vs the synthetic truth, mine excluded
  const topSet = (score, cells, frac) => new Set(cells.slice().sort((a, b) => score[b] - score[a]).slice(0, Math.round(frac * cells.length)));
  // sequential ramp for things that are not probabilities (uncertainty): --well → --mag
  const hexRGB = h => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const ramp = (lo, hi) => { const a = hexRGB(css("--well")), b = hexRGB(css("--mag")); return v => { const t = clamp((v - lo) / (hi - lo), 0, 1); return `rgb(${a.map((x, i) => Math.round(x + t * (b[i] - x))).join(",")})`; }; };
  const later = fn => setTimeout(fn, 30);            // let the browser paint a "calculando…" note before heavy work
  const cellName = k => AREA.mine[k] ? "mina" : AREA.known[k] ? "depósito conocido" : AREA.truth[k] ? "laterita no descubierta" : AREA.lith[k] === 0 && AREA.redSoil[k] > 0.2 ? "suelo rojo sobre sedimentos" : VIZ.LITHNAME[AREA.lith[k]].split(" (")[0].toLowerCase();
  // outline a set of cells on a VIZ.map canvas in a light colour (VIZ's `hi` uses --fg, invisible on dark viridis in light mode)
  const ring = (cv, set, scale = 6) => {
    const lum = h => hexRGB(h).reduce((a, v, i) => a + v * [0.3, 0.59, 0.11][i], 0), c = lum(css("--bg")) > lum(css("--fg")) ? css("--bg") : css("--fg");
    const g = cv.getContext("2d"), NX = AREA.NX, NY = AREA.NY, s = scale, has = (a, b) => a >= 0 && b >= 0 && a < NX && b < NY && set.has(b * NX + a);
    g.save(); g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath();
    set.forEach(k => { const i = k % NX, j = Math.floor(k / NX);
      if (!has(i, j - 1)) { g.moveTo(i * s, j * s); g.lineTo(i * s + s, j * s); } if (!has(i, j + 1)) { g.moveTo(i * s, j * s + s); g.lineTo(i * s + s, j * s + s); }
      if (!has(i - 1, j)) { g.moveTo(i * s, j * s); g.lineTo(i * s, j * s + s); } if (!has(i + 1, j)) { g.moveTo(i * s + s, j * s); g.lineTo(i * s + s, j * s + s); } });
    g.stroke(); g.restore();
  };
  const ij = k => `(${k % AREA.NX}, ${Math.floor(k / AREA.NX)})`;

  /* ───────── opener: a linear model vs a forest on the red-soil trap ───────── */
  demo("s-bosques", () => {
    const D = AREA.data({ feats: DEF, unlabeled: 1200, seed: 3 }), S = ML.standardize(D.X);
    const lg = ML.logistic(S.Z, D.y, { iters: 600 }), fo = ML.forest(D.X, D.y, { nTrees: 60, maxDepth: 6, minLeaf: 3, seed: 2 });
    const M = { log: { name: "Regresión logística", col: "--accent", p: x => lg.predict(S.apply(x)) }, rf: { name: "Random Forest", col: "--ok", p: x => fo.predict(x) } };
    const rows = rowsOf(DEF);
    Object.values(M).forEach(m => { m.score = new Float64Array(N); ALL.forEach(k => m.score[k] = m.p(rows[k])); m.top = topSet(m.score, CELLS, 0.10); });
    // a typical cell on the ultramafic plateau and one on the sediments 0.8 km away (median of the other features)
    const med = (cells, f) => { const v = cells.map(k => AREA.L[f][k]).sort((a, b) => a - b); return v[v.length >> 1]; };
    const um = ALL.filter(k => AREA.lith[k] === 1), sed = ALL.filter(k => AREA.lith[k] === 0 && AREA.distUM[k] > 0.5 && AREA.distUM[k] < 1.2);
    const base = { um: DEF.map(f => f === "distUM" ? 0 : med(um, f)), sed: DEF.map(f => f === "distUM" ? 0.8 : med(sed, f)) };
    const red = ALL.filter(k => VALID[k] && AREA.lith[k] === 0 && AREA.redSoil[k] > 0.2), lat = ALL.filter(k => VALID[k] && AREA.truth[k]);
    let mode = "log"; chips($("#rfOpModel"), v => { mode = v; render(); });
    function render() {
      const m = M[mode];
      ring(VIZ.map($("#rfOpMap"), m.score, { valid: VALID }).canvas, m.top);
      VIZ.legend($("#rfOpLeg"), {});
      const nRed = red.filter(k => m.top.has(k)).length, nLat = lat.filter(k => m.top.has(k)).length;
      $("#rfOpRead").innerHTML = `<div><span>Celdas de suelo rojo en el 10 %</span><b class="${nRed > 20 ? "c-lw" : "c-ok"}">${nRed}</b></div><div><span>Laterita real capturada</span><b class="c-ok">${fmt(100 * nLat / lat.length, 0)} %</b></div>`;
      const prof = b => { const pts = []; for (let fe = 1.1; fe <= 2.101; fe += 0.02) { const x = b.slice(); x[0] = fe; pts.push([fe, m.p(x)]); } return pts; };
      VIZ.curves($("#rfOpFig"), [{ pts: prof(base.um), col: m.col, label: "sobre ultramáficas (d = 0)", w: 2.5 }, { pts: prof(base.sed), col: m.col, label: "sobre sedimentos (d = 0,8 km)", dash: "6 4", w: 2.5 }],
        { xr: [1.1, 2.1], yr: [0, 1], xl: "B4/B2", yl: "p", W: 440, H: 150, xt: [1.2, 1.4, 1.6, 1.8, 2.0], xf: v => fmt(v, 1), legendAt: "tl" });
    }
    render(); return render;
  });

  /* ───────── one tree on two features: the split search and the partition ───────── */
  demo("rf-split", () => {
    const F2 = ["distUM", "ferric"], NM = ["d", "Fe"], XR = [-0.05, 2.0], YR = [0.95, 1.95], MINLEAF = 5;
    const D = AREA.data({ feats: F2, unlabeled: 400, seed: 5 }), X = D.X, y = D.y, jr = rng(9);
    const jit = X.map(x => x[0] === 0 ? 0.06 * jr() : 0);                 // display-only jitter for cells inside the body
    const T = ML.tree(X, y, { maxDepth: 4, minLeaf: MINLEAF });
    const gini = p => 2 * p * (1 - p), nodes = [];
    (function walk(nd, ids, b) {
      nd.ids = ids; nd.b = b; nd.n1 = ids.reduce((s, i) => s + y[i], 0); nodes.push(nd);
      if (!nd.left) return;
      const L = ids.filter(i => X[i][nd.f] <= nd.t), R = ids.filter(i => X[i][nd.f] > nd.t), bl = b.slice(), br = b.slice();
      if (nd.f === 0) { bl[1] = nd.t; br[0] = nd.t; } else { bl[3] = nd.t; br[2] = nd.t; }
      walk(nd.left, L, bl); walk(nd.right, R, br);
    })(T.root, [...X.keys()], [XR[0], XR[1], YR[0], YR[1]]);
    // every candidate threshold of feature f inside a node, with its Gini decrease (CART, min 5 per side)
    const scan = (nd, f) => {
      const s = nd.ids.slice().sort((a, b) => X[a][f] - X[b][f]), n = s.length, n1 = nd.n1, g0 = gini(n1 / n), out = []; let l = 0, l1 = 0;
      for (let k = 0; k < n - 1; k++) {
        l++; l1 += y[s[k]];
        if (X[s[k]][f] === X[s[k + 1]][f] || l < MINLEAF || n - l < MINLEAF) continue;
        out.push([(X[s[k]][f] + X[s[k + 1]][f]) / 2, g0 - l / n * gini(l1 / l) - (n - l) / n * gini((n1 - l1) / (n - l))]);
      }
      return out;
    };
    const bestOf = c => c.reduce((a, q) => !a || q[1] > a[1] ? q : a, null);
    const RANGE = [[0, 2.0, 0.01], [0.95, 1.95, 0.005]], thr = $("#rfSpThr"), out = thr.parentElement.querySelector("output");
    let L = 0, sel = T.root, f = 0, t = 0.6;
    const isLeaf = nd => !nd.left || nd.depth >= L, visible = nd => nd.depth <= L;
    const setRange = () => { const [a, b, s] = RANGE[f]; thr.min = a; thr.max = b; thr.step = s; thr.value = t; };
    chips($("#rfSpFeat"), v => { f = +v; t = f ? 1.75 : 0.6; setRange(); render(); });
    chips($("#rfSpLevel"), v => { L = +v; if (!visible(sel)) sel = T.root; render(); });
    thr.addEventListener("input", () => { t = +thr.value; render(); });
    $("#rfSpBest").addEventListener("click", () => {
      const c = [0, 1].map(q => bestOf(scan(sel, q))), q = c[0] && (!c[1] || c[0][1] >= c[1][1]) ? 0 : 1; if (!c[q]) return;
      f = q; t = c[q][0]; pressF(); setRange(); render();
    });
    const leafAt = (a, b) => { let nd = T.root; while (!isLeaf(nd)) nd = [a, b][nd.f] <= nd.t ? nd.left : nd.right; return nd; };
    const pressF = () => $$("#rfSpFeat button.chip").forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === f));
    // on a new node, jump to its best split (on whichever feature wins) so the curve shows something to compare
    const select = nd => { sel = nd; const c = [0, 1].map(q => bestOf(scan(sel, q))); if (c[0] || c[1]) { f = c[0] && (!c[1] || c[0][1] >= c[1][1]) ? 0 : 1; t = c[f][0]; pressF(); } setRange(); render(); };
    const desc = nd => { const parts = []; let cur = T.root; while (cur !== nd) { const goL = nd.ids.length && X[nd.ids[0]][cur.f] <= cur.t; parts.push(`${NM[cur.f]} ${goL ? "≤" : ">"} ${fmt(cur.t, 2)}`); cur = goL ? cur.left : cur.right; } return parts.length ? parts.join(" y ") : "raíz (todas las celdas)"; };
    setRange();
    function render() {
      out.textContent = fmt(t, f ? 2 : 2) + (f ? "" : " km");
      // the impurity-decrease curve of the selected node, both features on the same y scale
      const C = [scan(sel, 0), scan(sel, 1)], best = C.map(bestOf), gmax = Math.max(0.02, ...C.flat().map(q => q[1])) * 1.12;
      const W = 440, H = 150, svg = svgIn($("#rfSpCurve"), W, H), [lo, hi] = RANGE[f];
      const A = axes(svg, { W, H, m: { l: 44, r: 12, t: 14, b: 28 }, x0: lo, x1: hi, y0: 0, y1: gmax, xt: [lo, (lo + hi) / 2, hi], yt: [0, gmax / 2, gmax], xf: v => fmt(v, 2), yf: v => fmt(v, 2), xl: f ? "umbral de B4/B2" : "umbral de distancia (km)", yl: "ganancia Gini" });
      if (C[f].length) el("path", { d: path(C[f].filter(q => q[0] >= lo && q[0] <= hi).map(([a, g]) => [A.x(a), A.y(g)])), fill: "none", stroke: css("--ok"), "stroke-width": 2 }, svg);
      if (best[f]) { el("circle", { cx: A.x(clamp(best[f][0], lo, hi)), cy: A.y(best[f][1]), r: 5, fill: css("--ok"), stroke: css("--bg") }, svg); el("text", { x: A.x(clamp(best[f][0], lo, hi)) + 7, y: A.y(best[f][1]) - 4, "font-size": 10.5, fill: css("--ok") }, svg, "mejor"); }
      el("line", { x1: A.x(t), x2: A.x(t), y1: 14, y2: H - 28, stroke: css("--fg"), "stroke-dasharray": "4 3" }, svg);
      // the numbers at the current threshold
      const n = sel.ids.length, p = sel.n1 / n, Li = sel.ids.filter(i => X[i][f] <= t), l1 = Li.reduce((s, i) => s + y[i], 0), nR = n - Li.length, r1 = sel.n1 - l1;
      const gL = Li.length ? gini(l1 / Li.length) : 0, gR = nR ? gini(r1 / nR) : 0, gain = gini(p) - Li.length / n * gL - nR / n * gR;
      const bline = [0, 1].map(q => best[q] ? `${NM[q]} ≤ ${fmt(best[q][0], 2)} (${fmt(best[q][1], 3)})` : `${NM[q]}: —`).join(" · ");
      $("#rfSpCalc").innerHTML = `<span class="m">Nodo:</span> ${desc(sel)}\n${fmtN(n)} celdas, ${sel.n1} positivas · p = ${fmt(p, 2)} · Gini = ${fmt(gini(p), 3)}\n`
        + (C[0].length || C[1].length ? `<span class="k">${NM[f]} ≤ ${fmt(t, 2)}</span>: izq ${Li.length} (p ${fmt(Li.length ? l1 / Li.length : 0, 2)}) · der ${nR} (p ${fmt(nR ? r1 / nR : 0, 2)})\nganancia = <b>${fmt(gain, 3)}</b>   <span class="g">mejores: ${bline}</span>`
          : `<span class="m">Nodo puro o con muy pocas celdas (mín. ${MINLEAF} por hoja): no se divide.</span>`);
      // the scatter with the rectangular regions of the visible leaves
      const pts = X.map((x, i) => ({ x: x[0] + jit[i], y: x[1], cls: y[i] }));
      const sc = VIZ.scatter($("#rfSpScat"), pts, { xr: XR, yr: YR, W: 480, H: 250, xl: "d: distancia a ultramáficas (km)", xt: [0, 0.5, 1, 1.5, 2], xf: v => fmt(v, 1), yf: v => fmt(v, 2) });
      const sv = sc.svg, R = b => ({ x: sc.X(b[0]), y: sc.Y(b[3]), width: Math.max(0, sc.X(b[1]) - sc.X(b[0])), height: Math.max(0, sc.Y(b[2]) - sc.Y(b[3])) });
      const leaves = nodes.filter(nd => visible(nd) && isLeaf(nd));
      leaves.forEach(nd => sv.insertBefore(el("rect", { ...R(nd.b), fill: VIZ.prob(nd.p), opacity: 0.42 }), sv.firstChild));
      el("rect", { ...R(sel.b), fill: "none", stroke: css("--accent"), "stroke-width": 2.5 }, sv);
      const sb = sel.b;
      if (f === 0) el("line", { x1: sc.X(t), x2: sc.X(t), y1: sc.Y(sb[2]), y2: sc.Y(sb[3]), stroke: css("--fg"), "stroke-width": 1.6, "stroke-dasharray": "5 3" }, sv);
      else el("line", { x1: sc.X(Math.max(sb[0], XR[0])), x2: sc.X(sb[1]), y1: sc.Y(t), y2: sc.Y(t), stroke: css("--fg"), "stroke-width": 1.6, "stroke-dasharray": "5 3" }, sv);
      const hit = el("rect", { x: sc.X(XR[0]), y: sc.Y(YR[1]), width: sc.X(XR[1]) - sc.X(XR[0]), height: sc.Y(YR[0]) - sc.Y(YR[1]), fill: "transparent", style: "cursor:pointer" }, sv);
      hit.addEventListener("click", e => { const r = sv.getBoundingClientRect(), s = 480 / r.width, px = (e.clientX - r.left) * s, py = (e.clientY - r.top) * s;
        select(leafAt(XR[0] + (px - sc.X(XR[0])) / (sc.X(XR[1]) - sc.X(XR[0])) * (XR[1] - XR[0]), YR[0] + (sc.Y(YR[0]) - py) / (sc.Y(YR[0]) - sc.Y(YR[1])) * (YR[1] - YR[0]))); });
      // the tree diagram: leaves spread in order, parents centred over their children
      const TW = 480, rowH = 36, TH = (L + 1) * rowH + 16, ts = svgIn($("#rfSpTree"), TW, TH), pos = new Map(); let li = 0;
      const place = nd => { if (isLeaf(nd)) { pos.set(nd, (li++ + 0.5)); return; } place(nd.left); place(nd.right); pos.set(nd, (pos.get(nd.left) + pos.get(nd.right)) / 2); };
      place(T.root);
      const nl = li, PX = nd => 10 + pos.get(nd) * (TW - 20) / nl, PY = nd => 14 + nd.depth * rowH;
      nodes.filter(nd => visible(nd) && !isLeaf(nd)).forEach(nd => [nd.left, nd.right].forEach(c => el("line", { x1: PX(nd), y1: PY(nd) + 9, x2: PX(c), y2: PY(c) - 9, stroke: css("--line"), "stroke-width": 1.5 }, ts)));
      nodes.filter(visible).forEach(nd => {
        const g = el("g", { style: "cursor:pointer" }, ts), on = nd === sel, x = PX(nd), yy = PY(nd);
        if (isLeaf(nd)) {
          el("circle", { cx: x, cy: yy, r: 9, fill: VIZ.prob(nd.p), stroke: css(on ? "--accent" : "--bg"), "stroke-width": on ? 3 : 1 }, g);
          el("text", { x, y: yy + 21, "text-anchor": "middle", "font-size": 10, class: "mono", fill: css("--muted") }, g, fmt(nd.p, 2));
        } else {
          el("rect", { x: x - 33, y: yy - 9, width: 66, height: 18, rx: 5, fill: css("--card"), stroke: css(on ? "--accent" : "--line"), "stroke-width": on ? 2.5 : 1 }, g);
          el("text", { x, y: yy + 4, "text-anchor": "middle", "font-size": 10.5, class: "mono" }, g, `${NM[nd.f]} ≤ ${fmt(nd.t, 2)}`);
        }
        g.addEventListener("click", () => select(nd));
      });
    }
    render(); return render;
  });

  /* ───────── depth and overfitting: train vs spatial-block validation ───────── */
  demo("rf-depth", () => {
    const D = AREA.data({ feats: DEF, unlabeled: 1200, seed: 3 }), folds = ML.blockFolds(D.cells, 5, 3, 4), rows = rowsOf(DEF), LEAF = [1, 2, 3, 5, 10, 20, 40], cache = {};
    const gD = slider("rfDpDepth", v => v, () => render()), gL = slider("rfDpLeaf", v => LEAF[v], () => render());
    const nLeaves = nd => nd.left ? nLeaves(nd.left) + nLeaves(nd.right) : 1;
    const fit = ml => cache[ml] || (cache[ml] = Array.from({ length: 10 }, (_, q) => {
      const d = q + 1, opt = { maxDepth: d, minLeaf: ml }, tr = ML.tree(D.X, D.y, opt);
      const cv = ML.crossVal(D.X, D.y, folds, (Xa, ya) => ML.tree(Xa, ya, opt)), ok = [...cv.keys()].filter(i => !isNaN(cv[i]));
      const score = new Float64Array(N); ALL.forEach(k => score[k] = tr.predict(rows[k]));
      return { d, tr, leaves: nLeaves(tr.root), train: ap(D.X.map(x => tr.predict(x)), D.y), cv: ap(ok.map(i => cv[i]), ok.map(i => D.y[i])), truth: apMap(score), score };
    }));
    function render() {
      const R = fit(LEAF[gL()]), r = R[gD() - 1];
      VIZ.map($("#rfDpMap"), r.score, { valid: VALID });
      VIZ.legend($("#rfDpLeg"), {});
      VIZ.curves($("#rfDpCurve"), [{ pts: R.map(q => [q.d, q.train]), col: "--muted", label: "entrenamiento" }, { pts: R.map(q => [q.d, q.cv]), col: "--ok", label: "validación por bloques", w: 3 }, { pts: R.map(q => [q.d, q.truth]), col: "--sw", label: "verdad sintética (mapa)", dash: "5 4" }],
        { xr: [1, 10], yr: [0, 1], xt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], xf: v => v, yt: [0, 0.25, 0.5, 0.75, 1], yf: v => fmt(v, 2), xl: "profundidad máxima", yl: "PR-AUC", W: 440, H: 175, marks: [[r.d, ""]] });
      const bestCV = R.reduce((a, q) => q.cv > a.cv ? q : a, R[0]);
      $("#rfDpRead").innerHTML = `<div><span>Hojas</span><b>${r.leaves}</b></div><div><span>PR-AUC entren.</span><b style="color:var(--muted)">${fmt(r.train, 2)}</b></div><div><span>PR-AUC bloques</span><b class="c-ok">${fmt(r.cv, 2)}</b> </div>`;
      $("#rfDpBest").textContent = `mejor profundidad por bloques: ${bestCV.d} (${fmt(bestCV.cv, 2)})`;
    }
    render(); return render;
  });

  /* ───────── Random Forest: bootstrap, mtry, votes, OOB ───────── */
  demo("rf-forest", () => {
    const D = AREA.data({ feats: DEF, unlabeled: 1200, seed: 3 }), n = D.X.length, rows = rowsOf(DEF), NT = 100, cache = {};
    // our own loop (same recipe as ML.forest) so we can keep each tree's in-bag rows and draw the OOB curve
    const build = mtry => cache[mtry] || (cache[mtry] = (() => {
      const rr = rng(7), preds = [], oS = new Float64Array(n), oC = new Uint16Array(n), oob = [], truth = [], sum = new Float64Array(N), trees = [];
      for (let b = 0; b < NT; b++) {
        const inBag = new Uint8Array(n), idx = []; for (let k = 0; k < n; k++) { const i = Math.floor(rr() * n); idx.push(i); inBag[i] = 1; }
        const tr = ML.tree(D.X, D.y, { maxDepth: 8, minLeaf: 2, mtry, idx, rng: rr }), pr = new Float32Array(N); trees.push(tr);
        for (let k = 0; k < N; k++) { pr[k] = tr.predict(rows[k]); sum[k] += pr[k]; }
        preds.push(pr);
        for (let i = 0; i < n; i++) if (!inBag[i]) { oS[i] += tr.predict(D.X[i]); oC[i]++; }
        const ok = [...Array(n).keys()].filter(i => oC[i]);
        oob.push([b + 1, ap(ok.map(i => oS[i] / oC[i]), ok.map(i => D.y[i]))]); truth.push([b + 1, apMap(sum)]);
      }
      return { preds, oob, truth };
    })());
    const gN = slider("rfFoN", v => v, () => render());
    let mtry = 2, sel = (d => d.cells[Math.floor(d.cells.length / 2)])(AREA.DEP.find(d => !d.known));
    chips($("#rfFoMtry"), v => { mtry = +v; $("#rfFoCurveT").textContent = "Entrenando 100 árboles…"; later(render); });
    $("#rfFoSmall").innerHTML = [0, 1, 2, 3].map(i => `<div><div id="rfFoT${i}"></div><p class="note" style="margin:2px 0 0;text-align:center">Árbol ${i + 1}</p></div>`).join("");
    function render() {
      const F = build(mtry), nt = gN(), avg = new Float64Array(N);
      for (let t = 0; t < nt; t++) { const p = F.preds[t]; for (let k = 0; k < N; k++) avg[k] += p[k] / nt; }
      const m = VIZ.map($("#rfFoMap"), avg, { valid: VALID, points: [{ k: sel, color: css("--fg"), r: 6 }] });
      m.canvas.addEventListener("click", e => { const k = m.cellAt(e); if (k >= 0 && VALID[k]) { sel = k; render(); } });
      VIZ.legend($("#rfFoLeg"), {});
      [0, 1, 2, 3].forEach(i => VIZ.map($("#rfFoT" + i), F.preds[i], { valid: VALID, scale: 2, river: false, mine: false, points: [{ k: sel, color: css("--fg"), r: 3 }] }));
      // votes of the first nt trees at the chosen cell
      const votes = F.preds.slice(0, nt).map(p => p[sel]), hist = Array(10).fill(0); votes.forEach(v => hist[Math.min(9, Math.floor(v * 10))]++);
      const W = 440, H = 105, svg = svgIn($("#rfFoVotes"), W, H), hm = Math.max(...hist, 1), A = axes(svg, { W, H, m: { l: 34, r: 12, t: 12, b: 26 }, x0: 0, x1: 1, y0: 0, y1: hm, xt: [0, 0.5, 1], yt: [0, hm], xf: v => fmt(v, 1), yf: v => v, xl: "voto = proporción de positivos en la hoja", yl: "árboles" });
      hist.forEach((c, b) => c && el("rect", { x: A.x(b / 10) + 1, y: A.y(c), width: A.x(0.1) - A.x(0) - 2, height: A.y(0) - A.y(c), rx: 2, fill: css("--ok"), opacity: 0.85 }, svg));
      const mv = avg[sel]; el("line", { x1: A.x(mv), x2: A.x(mv), y1: 12, y2: H - 26, stroke: css("--fg"), "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      el("text", { x: W - 12, y: 12, "text-anchor": "end", "font-size": 11, fill: css("--fg") }, svg, `línea: media de los votos = p del bosque = ${fmt(mv, 2)}`);
      $("#rfFoVotesT").textContent = `Votos de ${nt} árbol${nt > 1 ? "es" : ""} en la celda ${ij(sel)} · ${cellName(sel)}`;
      VIZ.curves($("#rfFoCurve"), [{ pts: F.oob, col: "--ok", label: "OOB (etiquetas PU)", w: 2.5 }, { pts: F.truth, col: "--sw", label: "mapa vs verdad sintética", dash: "5 4" }],
        { xr: [1, 100], yr: [0.3, 0.9], xt: [1, 25, 50, 75, 100], xf: v => v, yt: [0.3, 0.6, 0.9], yf: v => fmt(v, 1), xl: "árboles", W: 440, H: 120, marks: [[nt, ""]] });
      $("#rfFoCurveT").innerHTML = `PR-AUC con ${nt} árbol${nt > 1 ? "es" : ""} · <span style="color:var(--ok)">OOB ${fmt(F.oob[nt - 1][1], 2)}</span> · <span style="color:var(--sw)">vs verdad ${fmt(F.truth[nt - 1][1], 2)}</span>`;
    }
    render(); return render;
  });

  /* ───────── feature importance and leakage ───────── */
  demo("rf-imp", () => {
    const SETS = { base: { feats: DEF, mask: true }, ndvi: { feats: DEF.concat("ndvi"), mask: true }, leak: { feats: DEF.concat("ndvi"), mask: false, minePositive: true } };
    const SURF = new Set(["ferric", "clay", "ndvi"]), cache = {}, SHORT = { ferric: "B4/B2", clay: "B11/B12", distUM: "Dist. ultram.", slope: "Pendiente", mag: "Magnética", ndvi: "NDVI" };
    let set = "base", cw = "none";
    const fit = (s, w) => cache[s + w] || (cache[s + w] = (() => {
      const c = SETS[s], D = AREA.data({ ...c, unlabeled: 1200, seed: 3 }), d = c.feats.length, classWeight = w === "balanced" ? "balanced" : null;
      const fo = ML.forest(D.X, D.y, { nTrees: 60, maxDepth: 6, minLeaf: 3, classWeight, seed: 2 });
      // permutation importance: each spatial block fold in turn is held out; shuffle one column there; drop in PR-AUC
      const folds = ML.blockFolds(D.cells, 5, 3, 4), r = rng(5), perm = Array(d).fill(0); let cvAP = 0;
      for (let f = 0; f < 5; f++) {
        const tr = [], te = []; folds.forEach((v, i) => (v === f ? te : tr).push(i));
        const yt = te.map(i => D.y[i]); if (!yt.some(v => v)) continue;
        const m = ML.forest(tr.map(i => D.X[i]), tr.map(i => D.y[i]), { nTrees: 40, maxDepth: 6, minLeaf: 3, classWeight, seed: 3 }), Xt = te.map(i => D.X[i]), b = ap(Xt.map(x => m.predict(x)), yt);
        cvAP += b / 5;
        for (let j = 0; j < d; j++) { const col = ML.shuffle(Xt.map(x => x[j]), r); perm[j] += (b - ap(Xt.map((x, i) => { const z = x.slice(); z[j] = col[i]; return m.predict(z); }), yt)) / 5; }
      }
      const rows = rowsOf(c.feats), score = new Float64Array(N); ALL.forEach(k => score[k] = fo.predict(rows[k]));
      return { c, D, fo, perm, cvAP, score };
    })());
    const busy = () => { $("#rfImNote").textContent = "Entrenando el bosque y la validación por bloques…"; later(render); };
    chips($("#rfImSet"), v => { set = v; busy(); });
    chips($("#rfImCW"), v => { cw = v; busy(); });
    function render() {
      const R = fit(set, cw), feats = R.c.feats, lab = f => SHORT[f], col = f => SURF.has(f) ? "--sw" : "--data";
      VIZ.bars($("#rfImBars1"), feats.map((f, j) => ({ label: lab(f), v: R.fo.importance[j], col: col(f) })), { W: 250, labelW: 84, rowH: 22, max: Math.max(0.6, ...R.fo.importance) });
      VIZ.bars($("#rfImBars2"), feats.map((f, j) => ({ label: lab(f), v: Math.max(0, R.perm[j]), col: col(f) })), { W: 250, labelW: 84, rowH: 22, max: Math.max(0.5, ...R.perm), digits: 3 });
      const valid = R.c.mask ? VALID : null, cells = R.c.mask ? CELLS : ALL, top = topSet(R.score, cells, 0.05);
      ring(VIZ.map($("#rfImMap"), R.score, { valid, mine: R.c.mask, deposits: "all" }).canvas, top);
      const nMine = AREA.mine.reduce((a, v) => a + v, 0), inMine = [...top].filter(k => AREA.mine[k]).length, geo = feats.reduce((a, f, j) => a + (SURF.has(f) ? 0 : R.fo.importance[j]), 0), meanP = mean(CELLS.map(k => R.score[k]));
      const topPerm = feats[R.perm.indexOf(Math.max(...R.perm))], n1 = R.D.y.reduce((a, v) => a + v, 0), n0 = R.D.y.length - n1;
      $("#rfImRead").innerHTML = `<div><span>Celdas de mina en el 5 %</span><b class="${inMine ? "c-lw" : "c-ok"}">${R.c.mask ? "— (fuera)" : inMine + " / " + nMine}</b></div><div><span>Peso de la geología</span><b class="c-data">${fmt(100 * geo, 0)} %</b></div><div><span>PR-AUC bloques</span><b class="c-ok">${fmt(R.cvAP, 2)}</b></div><div><span>p media</span><b>${fmt(meanP, 3)}</b></div>`;
      const msg = { base: `Sin fuga. Por impureza el peso se reparte (con mtry = 2 cada corte elige entre dos variables al azar); por permutación en bloques manda <b>${AREA.F[topPerm].es.toLowerCase()}</b>.`,
        ndvi: `El NDVI entra sin dominar: la vegetación tapa el suelo, pero no sustituye a la geología. Por permutación manda <b>${AREA.F[topPerm].es.toLowerCase()}</b>.`,
        leak: `Con la mina como positivo, B4/B2, B11/B12 y NDVI (el «suelo desnudo») se llevan la importancia por impureza, la geología baja a ${fmt(100 * geo, 0)} % y la mina entera entra en el 5 % superior. La permutación en bloques sigue apoyándose en <b>${AREA.F[topPerm].es.toLowerCase()}</b>: la fuga solo «funciona» donde está la mina.` }[set];
      $("#rfImNote").innerHTML = msg + (cw === "balanced" ? ` Con pesos «balanced» cada positivo pesa como ~${fmt(n0 / n1, 0)} no etiquetados: las probabilidades suben (p media), pero el orden del mapa cambia poco; úsalas como ranking.` : "");
    }
    render(); return render;
  });

  /* ───────── PU bagging: bags, mean map, uncertainty, out-of-bag ranking of the unlabeled cells ───────── */
  demo("rf-pu", slide => {
    const D = AREA.data({ feats: DEF }), rows = rowsOf(DEF), P = [], U = []; D.y.forEach((v, i) => (v ? P : U).push(i));
    const hidden = U.filter(i => AREA.truth[D.cells[i]]), isHid = U.map(i => AREA.truth[D.cells[i]]), cache = {};
    const gK = slider("rfPuK", v => v, () => { if (st().bags.length < gK()) play(); else render(); });
    const gR = slider("rfPuR", v => v + "×", () => { if (st().bags.length < gK()) play(); else render(); });
    const st = () => cache[gR()] || (cache[gR()] = { rr: rng(11 + gR()), bags: [] });
    let view = "mean", timer = null;
    chips($("#rfPuView"), v => { view = v; render(); });
    function addBag() {
      const s = st(), ratio = gR(), b = s.bags.length, pos = ML.shuffle([...U.keys()], s.rr).slice(0, ratio * P.length), inB = new Uint8Array(U.length);
      pos.forEach(q => inB[q] = 1);
      const idx = P.concat(pos.map(q => U[q])), m = ML.forest(idx.map(i => D.X[i]), idx.map(i => D.y[i]), { nTrees: 15, maxDepth: 6, minLeaf: 3, seed: 100 + b });
      const pred = new Float32Array(N); for (let k = 0; k < N; k++) pred[k] = m.predict(rows[k]);
      const oob = new Float32Array(U.length).fill(NaN); U.forEach((i, q) => { if (!inB[q]) oob[q] = pred[D.cells[i]]; });
      s.bags.push({ pred, oob });
    }
    function play() {
      clearInterval(timer);
      timer = setInterval(() => {
        if (!slide.classList.contains("on") || st().bags.length >= gK()) { clearInterval(timer); timer = null; render(); return; }
        addBag(); render();
      }, 90);
    }
    $("#rfPuPlay").addEventListener("click", () => { if (st().bags.length >= gK()) { cache[gR()] = null; } play(); });
    $("#rfPuReset").addEventListener("click", () => { clearInterval(timer); timer = null; cache[gR()] = null; addBag(); render(); });
    DEMOS["rf-pu"].onShow = () => { if (st().bags.length < gK()) play(); };
    function render() {
      if (!st().bags.length) addBag();
      const s = st(), nb = Math.min(gK(), s.bags.length), B = s.bags.slice(0, nb), ratio = gR();
      const mu = new Float64Array(N), sdv = new Float64Array(N);
      for (const b of B) for (let k = 0; k < N; k++) { mu[k] += b.pred[k] / nb; sdv[k] += b.pred[k] * b.pred[k] / nb; }
      for (let k = 0; k < N; k++) sdv[k] = Math.sqrt(Math.max(0, sdv[k] - mu[k] * mu[k]));
      if (view === "mean") { VIZ.map($("#rfPuMap"), mu, { valid: VALID, deposits: "all" }); VIZ.legend($("#rfPuLeg"), { label: "probabilidad media de las bolsas" }); }
      else { const c = ramp(0, 0.25); VIZ.map($("#rfPuMap"), sdv, { valid: VALID, deposits: "all", color: c }); VIZ.legend($("#rfPuLeg"), { color: c, min: 0, max: 0.25, digits: 2, label: "desv. estándar" }); }
      // out-of-bag score of each unlabeled cell: mean over the bags that did not train on it
      const oob = U.map((_, q) => { let a = 0, c = 0; for (const b of B) if (!isNaN(b.oob[q])) { a += b.oob[q]; c++; } return c ? a / c : NaN; });
      const scored = [...U.keys()].filter(q => !isNaN(oob[q])).sort((a, b) => oob[b] - oob[a]), nTop = Math.round(0.05 * U.length), hidTop = scored.slice(0, nTop).filter(q => isHid[q]).length;
      const cap = [[0, 0]]; let c = 0; scored.forEach((q, r) => { if (isHid[q]) c++; if (r % 13 === 0 || r === scored.length - 1) cap.push([(r + 1) / U.length, c / hidden.length]); });
      VIZ.curves($("#rfPuCurve"), [{ pts: cap, col: "--ok", label: "PU bagging (OOB)", w: 2.5 }, { pts: [[0, 0], [0.2, 0.2]], col: "--muted", label: "al azar", dash: "4 4" }],
        { xr: [0, 0.2], yr: [0, 1], xt: [0, 0.05, 0.1, 0.15, 0.2], xf: v => fmt(100 * v, 0) + " %", yf: v => fmt(100 * v, 0) + " %", xl: "no etiquetadas marcadas", yl: "laterita oculta hallada", W: 440, H: 130, marks: [[0.05, "5 %"]] });
      $("#rfPuRead").innerHTML = `<div><span>Bolsas</span><b>${nb} / ${gK()}</b></div><div><span>Laterita oculta en el 5 % OOB</span><b class="c-ok">${hidTop} / ${hidden.length}</b></div><div><span>Desv. est. media</span><b style="color:var(--mag)">${fmt(mean(CELLS.map(k => sdv[k])), 3)}</b></div>`;
      $("#rfPuSteps").innerHTML = `<span class="m">para k = 1 … K:</span>\n  bolsa k = <span class="r">${P.length} positivos</span> + <span class="k">${fmtN(ratio * P.length)} no etiquetadas al azar</span>\n  entrenar un bosque · puntuar las ${fmtN(U.length - ratio * P.length)} no etiquetadas que quedaron fuera (OOB)\n<span class="m">mapa = media de las K bolsas · incertidumbre = desviación estándar</span>`;
    }
    addBag(); render(); play();
    return render;
  });
}
