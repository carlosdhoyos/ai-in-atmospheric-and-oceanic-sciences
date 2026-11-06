/* ═════════ PAE-Minas · section 3: validation and maps ═════════
   Spatial vs random cross-validation, the prospectivity map, success / prediction-rate curves, and the step from
   logistic regression to a small neural network. Everything is wrapped in an IIFE so no name leaks to other sections. */
(() => {
  const { N, NX, NY, CELL } = AREA;
  const FEATS = ["ferric", "clay", "distUM", "slope", "mag"];
  const VALID = AREA.mine.map(v => !v);
  /* colour helpers: tokens are hex; blend two of them for canvas fills */
  const rgbOf = c => { c = c.trim(); if (c[0] === "#") return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128]; };
  const mix = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return `rgb(${A.map((v, i) => Math.round(v * t + B[i] * (1 - t))).join(",")})`; };
  const pct = v => fmt(100 * v, 0) + " %";
  /* the deposit "anchor": every cell of a known deposit is placed in the block of the deposit's centroid,
     so a deposit never splits across folds */
  const depCell = d => (NY - 1 - Math.floor(d.cy / CELL)) * NX + Math.floor(d.cx / CELL);
  const anchor = k => AREA.known[k] && AREA.dep[k] >= 0 ? depCell(AREA.DEP[AREA.dep[k]]) : k;
  const KNOWN = AREA.DEP.filter(d => d.known);
  const UND = new Uint8Array(N); for (let k = 0; k < N; k++) if (AREA.truth[k] && !AREA.mine[k] && !AREA.DEP[AREA.dep[k]].known) UND[k] = 1;

  /* ───────── shared modelling table and models (lazy, cached) ───────── */
  let TAB = null;
  const table = () => TAB || (TAB = (() => { const D = AREA.data({ feats: FEATS, unlabeled: 1200, seed: 3 }), S = ML.standardize(D.X); return { ...D, S, Z: S.Z }; })());
  const FIT = {
    log: (X, y) => ML.logistic(X, y, { iters: 250, lr: 1, l2: 0.01 }),
    rf: (X, y) => ML.forest(X, y, { nTrees: 30, maxDepth: 8, minLeaf: 2, seed: 2 }),
    rfMap: (X, y) => ML.forest(X, y, { nTrees: 60, maxDepth: 8, minLeaf: 2, seed: 2 })
  };
  // folds for every map cell (so table and map agree): random (table only), spatial blocks, or leave-one-deposit-out
  const FOLDS = {};
  const mapFolds = (mode, size, rep) => {
    const key = `${mode}|${size}|${rep}`; if (FOLDS[key]) return FOLDS[key];
    let f;
    if (mode === "block") f = ML.blockFolds([...Array(N).keys()].map(anchor), 5, size, rep);
    else if (mode === "lodo") f = [...Array(N).keys()].map(k => {
      if (AREA.known[k]) return KNOWN.findIndex(d => d.id === AREA.dep[k]);
      let b = 0, m = 1e9; KNOWN.forEach((d, n) => { const q = (AREA.xk(k) - d.cx) ** 2 + (AREA.yk(k) - d.cy) ** 2; if (q < m) { m = q; b = n; } }); return b; });
    else { const T = table(), rf = ML.randomFolds(T.cells.length, 5, rep); f = Array(N).fill(-1); T.cells.forEach((k, i) => f[k] = rf[i]); }
    return (FOLDS[key] = f);
  };
  const tableFolds = (mode, size, rep) => { const f = mapFolds(mode, size, rep); return table().cells.map(k => f[k]); };
  // capture in the top `frac` of the area, from a table: positives scoring above the (1 − frac) quantile of the unlabeled sample
  const capT = (p, y, frac) => { const u = p.filter((v, i) => !y[i]).sort((a, b) => b - a), t = u[Math.floor(frac * u.length)], P = p.filter((v, i) => y[i]); return P.filter(v => v > t).length / P.length; };
  const CV = {};
  const cvScore = (model, mode, size, rep) => {
    const key = `${model}|${mode}|${size}|${rep}`; if (CV[key]) return CV[key];
    const T = table(), p = ML.crossVal(T.Z, T.y, tableFolds(mode, size, rep), FIT[model]);
    return (CV[key] = { pr: ML.prAuc(p, T.y), cap10: capT(p, T.y, 0.1), cap5: capT(p, T.y, 0.05) });
  };
  // whole-map scores: fitted on the full table, and out-of-fold over 3 km blocks (for the success-rate slide)
  const MAPS = {};
  const mapScore = model => MAPS[model] || (MAPS[model] = (() => {
    const T = table(), m = model === "rf" ? FIT.rfMap(T.Z, T.y) : FIT.log(T.Z, T.y), s = new Float64Array(N);
    for (let k = 0; k < N; k++) s[k] = m.predict(T.S.apply(AREA.row(k, FEATS)));
    const cells = [...Array(N).keys()].filter(k => VALID[k]).sort((a, b) => s[b] - s[a]), rank = new Float64Array(N).fill(NaN);
    for (let r = 0; r < cells.length;) {                                    // 0 = top of the area; ties share their mean rank
      let e = r; while (e + 1 < cells.length && s[cells[e + 1]] === s[cells[r]]) e++;
      for (let q = r; q <= e; q++) rank[cells[q]] = ((r + e) / 2 + 0.5) / cells.length; r = e + 1; }
    return { m, s, rank, order: cells };
  })());
  const OOF = {};
  const oofScore = model => OOF[model] || (OOF[model] = (() => {
    const T = table(), f = mapFolds("block", 3, 1), tf = T.cells.map(k => f[k]), s = new Float64Array(N);
    for (let q = 0; q < 5; q++) {
      const tr = [...tf.keys()].filter(i => tf[i] !== q), m = (model === "rf" ? FIT.rfMap : FIT.log)(tr.map(i => T.Z[i]), tr.map(i => T.y[i]));
      for (let k = 0; k < N; k++) if (f[k] === q) s[k] = m.predict(T.S.apply(AREA.row(k, FEATS)));
    }
    return s;
  })());
  // a tiny task queue: heavy jobs run one per tick so the page stays responsive
  const queue = (jobs, onDone, onEach) => { let i = 0; const tick = () => { if (i >= jobs.length) { onDone && onDone(); return; } jobs[i++](); onEach && onEach(); setTimeout(tick, 0); }; setTimeout(tick, 0); };

  /* ───────── 1 · opener: variogram and positives per deposit ───────── */
  demo("s-validacion", () => {
    const LAY = [["ferric", "B4/B2"], ["clay", "B11/B12"], ["distUM", "Dist. a ultramáficas"], ["slope", "Pendiente"], ["mag", "Magnetometría"], ["truth", "Laterita (verdad)"]];
    $("#vaVgLayer").innerHTML = LAY.map(([k, n], i) => `<button class="chip" data-v="${k}" aria-pressed="${i === 0}">${n}</button>`).join("");
    let layer = "ferric"; chips($("#vaVgLayer"), v => { layer = v; render(); });
    const VG = {}, LAG = 0.25, NB = 32;
    const vario = key => VG[key] || (VG[key] = (() => {
      const v = key === "truth" ? AREA.truth : AREA.L[key], r = rng(5), m = mean([...v]), s2 = sd([...v]) ** 2 || 1, g = Array(NB).fill(0), c = Array(NB).fill(0);
      for (let t = 0; t < 160000; t++) { const a = Math.floor(r() * N), b = Math.floor(r() * N), d = Math.hypot(AREA.xk(a) - AREA.xk(b), AREA.yk(a) - AREA.yk(b)), i = Math.floor(d / LAG); if (i < NB) { g[i] += 0.5 * (v[a] - v[b]) ** 2 / s2; c[i]++; } }
      const pts = g.map((x, i) => [(i + 0.5) * LAG, c[i] ? x / c[i] : NaN]).filter(p => !isNaN(p[1]));
      const range = (pts.find(p => p[1] >= 0.95) || pts[pts.length - 1])[0];
      return { pts, range };
    })());
    function render() {
      const { pts, range } = vario(layer), W = 480, H = 190;
      const C = VIZ.curves($("#vaVgFig"), [{ pts, col: "--accent", w: 2.4 }], { xr: [0, 8], yr: [0, 1.4], W, H, xt: [0, 2, 4, 6, 8], yt: [0, 0.5, 1], xf: v => fmt(v, 0), yf: v => fmt(v, 1), xl: "distancia entre celdas (km)", legendAt: "br" });
      // sill and range markers; the band of block sizes tried on the next slide
      el("rect", { x: C.x(1.5), y: 12, width: C.x(4.5) - C.x(1.5), height: H - 40, fill: css("--ok"), opacity: .08 }, C.svg);
      el("text", { x: C.x(3), y: H - 34, "text-anchor": "middle", "font-size": 10.5, fill: css("--ok") }, C.svg, "bloques de 1,5 a 4,5 km");
      el("line", { x1: C.x(0), x2: C.x(8), y1: C.y(1), y2: C.y(1), stroke: css("--muted"), "stroke-dasharray": "4 3" }, C.svg);
      el("text", { x: C.x(0.1), y: C.y(1) - 5, "font-size": 10.5, fill: css("--muted") }, C.svg, "meseta (sill)");
      el("line", { x1: C.x(range), x2: C.x(range), y1: 12, y2: H - 28, stroke: css("--lw"), "stroke-width": 1.6 }, C.svg);
      el("text", { x: C.x(range) + 4, y: C.y(0.3), "font-size": 11, fill: css("--lw") }, C.svg, `alcance ≈ ${fmt(range, 1)} km`);
      $("#vaVgRead").innerHTML = `<div><span>Alcance de la capa</span><b class="c-lw">${fmt(range, 1)} km</b></div><div><span>Bloque mínimo sugerido</span><b class="c-ok">≥ ${fmt(Math.max(1.5, Math.ceil(range * 2) / 2), 1)} km</b></div>`;
      // positives per known deposit
      const T = table(), cnt = KNOWN.map(d => ({ d, n: T.cells.filter((k, i) => T.y[i] && AREA.dep[k] === d.id).length })).sort((a, b) => b.n - a.n);
      VIZ.bars($("#vaDepFig"), cnt.map(({ d, n }) => ({ label: `depósito ${d.id + 1}${d.id === AREA.mineDeposit ? " (mina)" : ""}`, v: n, col: "--lw" })), { W: 480, rowH: 16, digits: 0, labelW: 130 });
    }
    render(); return render;
  });

  /* ───────── 2 · random vs spatial-block cross-validation ───────── */
  demo("va-cv", () => {
    const FOLDC = ["--accent", "--data", "--sw", "--arch", "--mag", "--ok", "--rose"];
    let mode = "random", rep = 1;
    chips($("#vaCvMode"), v => { mode = v; render(); });
    const gs = slider("vaCvSize", v => fmt(v, 1) + " km", () => render());
    $("#vaCvRep").addEventListener("click", () => { rep = rep % 5 + 1; render(); });
    const reps = m => m === "lodo" ? [1] : [1, 2, 3, 4, 5];
    let pending = null;
    function drawMap() {
      const size = gs(), m = mode, f = mapFolds(m, size, m === "lodo" ? 1 : rep), T = table(), inT = new Uint8Array(N), yOf = new Uint8Array(N); T.cells.forEach((k, i) => { inT[k] = 1; yOf[k] = T.y[i]; });
      const well = css("--well"), cols = FOLDC.map(css);
      // background region of a cell: its own block (or Voronoi cell) — positives may sit in their deposit's fold instead
      const regionOf = m === "block" ? (() => { const g = mapFolds("block", size, rep), r = new Int8Array(N); const bf = new Map(); for (let k = 0; k < N; k++) if (!AREA.known[k]) bf.set(AREA.block(k, size), g[k]); for (let k = 0; k < N; k++) r[k] = bf.has(AREA.block(k, size)) ? bf.get(AREA.block(k, size)) : g[k]; return r; })() : null;
      const color = (v, k) => {
        if (m === "random") return inT[k] ? (yOf[k] ? cols[f[k]] : mix(cols[f[k]], well, .75)) : well;
        const reg = m === "block" ? regionOf[k] : f[k];
        if (AREA.known[k]) return cols[f[k]];
        return inT[k] ? mix(cols[reg], well, .8) : mix(cols[reg], well, .22);
      };
      const mp = VIZ.map($("#vaCvMap"), k => k, { color, deposits: "known" });
      // region borders
      if (m !== "random") {
        const g = mp.canvas.getContext("2d"), s = mp.canvas.width / NX, reg = k => m === "block" ? AREA.block(k, size) : f[k];
        g.save(); g.strokeStyle = css("--fg"); g.globalAlpha = .55; g.lineWidth = 1.2; g.beginPath();
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i;
          if (i < NX - 1 && reg(k) !== reg(k + 1)) { g.moveTo((i + 1) * s, j * s); g.lineTo((i + 1) * s, (j + 1) * s); }
          if (j < NY - 1 && reg(k) !== reg(k + NX)) { g.moveTo(i * s, (j + 1) * s); g.lineTo((i + 1) * s, (j + 1) * s); } }
        g.stroke(); g.restore();
      }
      const nf = m === "lodo" ? KNOWN.length : 5;
      $("#vaCvLeg").innerHTML = Array.from({ length: nf }, (_, q) => `<span><i style="background:${cols[q]}"></i>${m === "lodo" ? "dep. " + (KNOWN[q].id + 1) : "pliegue " + (q + 1)}</span>`).join("");
      const posF = q => T.cells.filter((k, i) => T.y[i] && f[k] === q).length;
      $("#vaCvMapNote").innerHTML = m === "random"
        ? `Puntos de color: las 1 300 celdas de la tabla, repartidas al azar. Cada depósito tiene celdas en los 5 pliegues: el test siempre tiene «vecinas copia» en el entrenamiento.`
        : m === "block" ? `Bloques de ${fmt(size, 1)} km asignados a 5 pliegues; las celdas de un depósito van al pliegue del bloque de su centroide. Positivos por pliegue: ${[0, 1, 2, 3, 4].map(posF).join(" · ")}. Regla: bloque mayor que el alcance del variograma (aquí 1–2,5 km; en datos reales, 2–10 km).`
          : `Un pliegue por depósito conocido; cada celda no etiquetada va con el depósito más cercano. Siete modelos, cada uno sin ver un depósito.`;
    }
    function drawScores() {
      const size = gs(), other = mode === "random" ? "block" : mode, oSize = other === "block" ? size : 0;
      const rows = [["log", "random", "Logística · aleatoria"], ["log", other, `Logística · ${other === "lodo" ? "un depósito fuera" : "bloques " + fmt(size, 1) + " km"}`],
        ["rf", "random", "Bosque · aleatoria"], ["rf", other, `Bosque · ${other === "lodo" ? "un depósito fuera" : "bloques " + fmt(size, 1) + " km"}`]];
      const W = 460, rowH = 30, H = 40 + rows.length * rowH, svg = svgIn($("#vaCvFig"), W, H), L = 158, gap = 46, pw = (W - L - gap - 10) / 2;
      const panels = [["pr", "PR-AUC", 0], ["cap10", "Captura en el 10 % del área", 1]];
      const missing = [];
      panels.forEach(([key, lab, pi]) => {
        const x0 = L + pi * (pw + gap), X = v => x0 + v * pw;
        el("text", { x: x0, y: 12, "font-size": 12, fill: css("--muted") }, svg, lab);
        [0, 0.5, 1].forEach(v => { el("line", { x1: X(v), x2: X(v), y1: 20, y2: H - 16, class: "grid" }, svg); el("text", { x: X(v), y: H - 3, "text-anchor": "middle", class: "mono", "font-size": 11, fill: css("--muted") }, svg, fmt(v, 1)); });
        if (key === "pr") { const base = 100 / 1300; el("line", { x1: X(base), x2: X(base), y1: 20, y2: H - 16, stroke: css("--muted"), "stroke-dasharray": "2 2" }, svg); }
        rows.forEach(([model, m, name], r) => {
          const y = 36 + r * rowH, col = css(model === "log" ? "--accent" : "--ok"), sz = m === "block" ? size : 0, vals = [];
          if (pi === 0) el("text", { x: L - 10, y: y + 4, "text-anchor": "end", "font-size": 12.5, fill: css("--fg") }, svg, name);
          reps(m).forEach(rp => { const key2 = `${model}|${m}|${sz}|${rp}`, R = CV[key2];
            if (!R) { if (pi === 0) missing.push([model, m, sz, rp]); return; }
            vals.push(R[key]);
            el("circle", { cx: X(R[key]), cy: y, r: (rp === rep || m === "lodo") && m === mode ? 6 : 4.2, fill: m === "random" ? "none" : col, stroke: col, "stroke-width": 1.6, opacity: .9 }, svg); });
          if (vals.length === reps(m).length) { const mu = mean(vals); el("line", { x1: X(mu), x2: X(mu), y1: y - 10, y2: y + 10, stroke: css("--fg"), "stroke-width": 2 }, svg);
            el("text", { x: Math.min(X(mu) + 6, x0 + pw - 2), y: y - 8, "font-size": 11.5, class: "mono", fill: css("--fg"), "text-anchor": X(mu) + 30 > x0 + pw ? "end" : "start" }, svg, fmt(mu, 2)); }
          else if (pi === 0) el("text", { x: X(0) + 4, y: y + 4, "font-size": 10.5, fill: css("--muted") }, svg, "calculando…");
        });
      });
      // queue the missing scores: current view first
      if (missing.length && !pending) {
        pending = missing.map(([mo, m, sz, rp]) => () => cvScore(mo, m, sz, rp));
        queue(pending, () => { pending = null; drawScores(); }, () => drawScores());
      }
      const mr = (mo, m) => { const rs = reps(m).map(rp => CV[`${mo}|${m}|${m === "block" ? size : 0}|${rp}`]); return rs.every(Boolean) ? mean(rs.map(r => r.pr)) : null; };
      const a = mr("rf", "random"), b = mr("rf", other), c = mr("log", "random"), d = mr("log", other);
      $("#vaCvNote").innerHTML = a != null && b != null && c != null && d != null
        ? `Media de PR-AUC · bosque: <b>${fmt(a, 2)}</b> aleatoria vs <b>${fmt(b, 2)}</b> ${other === "lodo" ? "un depósito fuera" : "bloques"}; logística: ${fmt(c, 2)} vs ${fmt(d, 2)}. El modelo flexible pierde más: memorizaba vecinas. Línea punteada: PR-AUC al azar (7,7 % de positivos). Captura: positivos por encima del percentil 90 de las no etiquetadas.`
        : "Calculando las validaciones cruzadas (se guardan en caché)…";
    }
    function render() {
      $("#vaCvSizeRow").style.opacity = mode === "block" ? 1 : .45; $("#vaCvSize").disabled = mode !== "block";
      $("#vaCvRep").disabled = mode === "lodo";
      $("#vaCvRepLbl").textContent = mode === "lodo" ? "una sola partición posible (7 pliegues)" : `repetición ${rep} de 5 (otra semilla)`;
      drawMap(); drawScores();
    }
    render(); return render;
  });

  /* ───────── 3 · prospectivity map ───────── */
  demo("va-mapa", () => {
    let model = "log", scale = "p", truth = "known";
    chips($("#vaMpModel"), v => { model = v; $("#vaMpMap").style.opacity = .5; setTimeout(render, 20); });
    chips($("#vaMpScale"), v => { scale = v; render(); });
    chips($("#vaMpTruth"), v => { truth = v; render(); });
    const F = AREA.F, SHORT = { ferric: "Férrico B4/B2", clay: "Arcillas B11/B12", distUM: "Dist. ultramáficas", slope: "Pendiente", mag: "Magnetometría" };
    function render() {
      const M = mapScore(model), val = scale === "p" ? M.s : M.rank.map(r => 1 - r);
      $("#vaMpMap").style.opacity = 1;
      const mp = VIZ.map($("#vaMpMap"), val, { valid: VALID, deposits: truth });
      VIZ.legend($("#vaMpLeg"), { label: scale === "p" ? "probabilidad (no calibrada)" : "percentil del área (1 = lo más alto)", width: 300 });
      const tip = $("#vaMpTip"), wrap = $("#vaMpWrap");
      mp.canvas.addEventListener("mousemove", e => { const k = mp.cellAt(e); if (k < 0) return;
        tip.style.display = "block";
        const st = AREA.mine[k] ? "mina (enmascarada)" : AREA.known[k] ? "depósito conocido (positivo)" : UND[k] && truth === "all" ? "depósito NO descubierto" : "no etiquetada";
        tip.textContent = AREA.mine[k] ? "mina: enmascarada" : `p = ${fmt(M.s[k], 3)}\nentre el ${fmt(100 * M.rank[k], 1)} % más alto del área\n` + FEATS.map(f => `${SHORT[f].padEnd(20)}${fmt(AREA.L[f][k], F[f].d)} ${F[f].unit}`).join("\n") + `\n→ ${st}`;
        const r = wrap.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        tip.style.left = (x > r.width / 2 ? x - 250 : x + 14) + "px"; tip.style.top = Math.min(y + 14, r.height - 130) + "px"; });
      mp.canvas.addEventListener("mouseleave", () => tip.style.display = "none");
      const avgRank = set => mean(set.map(k => M.rank[k]));
      const kn = [...Array(N).keys()].filter(k => AREA.known[k]), un = [...Array(N).keys()].filter(k => UND[k]);
      $("#vaMpRead").innerHTML = `<div><span>Depósitos conocidos</span><b class="c-lw">top ${fmt(100 * avgRank(kn), 1)} %</b></div>`
        + (truth === "all" ? `<div><span>No descubiertos</span><b>top ${fmt(100 * avgRank(un), 1)} %</b></div>` : `<div><span>No descubiertos</span><b style="color:var(--muted)">?</b></div>`)
        + `<div><span>Celdas con p > 0,5</span><b class="${model === "rf" ? "c-ok" : ""}">${pct(M.order.filter(k => M.s[k] > 0.5).length / M.order.length)}</b></div>`;
      $("#vaMpNote").innerHTML = (model === "log"
        ? "La logística da un mapa suave: la probabilidad sube de forma gradual hacia las mesetas ultramáficas con hierro férrico alto."
        : "El bosque da un mapa más «a parches»: muy alto sobre los depósitos que vio al entrenar, con escalones donde cortan sus árboles.")
        + " «Top x %»: percentil medio de sus celdas en el ranking del área.";
    }
    render(); return render;
  });

  /* ───────── 4 · success-rate and prediction-rate curves ───────── */
  demo("va-exito", () => {
    let model = "log";
    chips($("#vaSrModel"), v => { model = v; $("#vaSrMap").style.opacity = .5; setTimeout(render, 20); });
    const gf = slider("vaSrFrac", v => v + " %", () => render());
    const CUR = {};
    const curves = mdl => CUR[mdl] || (CUR[mdl] = (() => {
      const M = mapScore(mdl), O = oofScore(mdl);
      return { M, O, succ: ML.successRate(M.s, AREA.known, VALID), cv: ML.successRate(O, AREA.known, VALID), pred: ML.successRate(M.s, UND, VALID) };
    })());
    const hits = (score, frac, known) => { const h = ML.depositsHit(score, VALID, frac); return AREA.DEP.filter((d, i) => d.known === known && h[i]).length; };
    function render() {
      const C = curves(model), frac = gf() / 100;
      $("#vaSrMap").style.opacity = 1;
      const top = new Set(C.M.order.slice(0, Math.round(frac * C.M.order.length))), well = css("--well");
      VIZ.map($("#vaSrMap"), C.M.s, { valid: VALID, deposits: "all", hi: top, color: (v, k) => top.has(k) ? VIZ.prob(v) : mix(VIZ.prob(v), well, .12) });
      $("#vaSrMapTitle").textContent = `Contorno: el ${gf()} % del área con mayor puntuación · ${model === "log" ? "logística" : "Random Forest"}`;
      const S = [{ pts: C.succ, col: "--lw", label: "conocidos · ajuste (tasa de éxito)" }, { pts: C.cv, col: "--sw", label: "conocidos · bloques 3 km, fuera de pliegue" }, { pts: C.pred, col: "--fg", dash: "5 4", label: "no descubiertos (tasa de predicción)" }];
      const G = VIZ.curves($("#vaSrFig"), S, { W: 480, H: 230, diag: true, xr: [0, 1], yr: [0, 1], xt: [0, 0.1, 0.25, 0.5, 1], yt: [0, 0.5, 1], xf: v => fmt(100 * v, 0) + " %", yf: v => fmt(100 * v, 0) + " %", xl: "área marcada (de mayor a menor puntuación)" });
      el("line", { x1: G.x(frac), x2: G.x(frac), y1: 12, y2: 230 - 28, stroke: css("--accent"), "stroke-dasharray": "3 3" }, G.svg);
      el("text", { x: G.x(frac) + 5, y: G.y(0.08), "font-size": 11, fill: css("--accent") }, G.svg, `${gf()} % del área`);
      S.forEach(s => { const c = ML.capture(s.pts, frac); el("circle", { cx: G.x(frac), cy: G.y(c), r: 4, fill: css(s.col), stroke: css("--bg") }, G.svg); });
      el("text", { x: G.x(0.62), y: G.y(0.5) + 16, "font-size": 10.5, fill: css("--muted") }, G.svg, "azar");
      const row = (name, col, pts, sc, known, nd) => `<tr><td><b style="color:var(${col})">${name}</b></td><td class="n">${pct(ML.capture(pts, 0.05))}</td><td class="n">${pct(ML.capture(pts, 0.1))}</td><td class="n">${pct(ML.capture(pts, frac))}</td><td class="n">${hits(sc, frac, known)} / ${nd}</td></tr>`;
      const nK = KNOWN.length, nU = AREA.DEP.length - nK;
      $("#vaSrTable").innerHTML = `<table class="tb" style="font-size:12.5px"><tr><th>Celdas de laterita</th><th>5 %</th><th>10 %</th><th>En el ${gf()} %</th><th>Depósitos</th></tr>`
        + row("Conocidos · ajuste", "--lw", C.succ, C.M.s, true, nK) + row("Conocidos · validación", "--sw", C.cv, C.O, true, nK) + row("No descubiertos", "--fg", C.pred, C.M.s, false, nU) + `</table>`;
      const s5 = ML.capture(C.succ, 0.05), p5 = ML.capture(C.pred, 0.05), c5 = ML.capture(C.cv, 0.05);
      $("#vaSrMsg").innerHTML = (model === "rf"
        ? `<b>El bosque memoriza:</b> en el 5 % del área captura el ${pct(s5)} de las celdas de los depósitos con los que se entrenó, pero solo el ${pct(p5)} de las de los no descubiertos. `
        : `<b>La logística es rígida:</b> no puede memorizar, así que su tasa de éxito (${pct(s5)} al 5 %) no exagera frente a la de predicción (${pct(p5)}). `)
        + `La curva de los conocidos con <b>validación por bloques</b> (${pct(c5)}) es la estimación honesta que sí se puede calcular en la práctica. La punteada solo existe porque los datos son sintéticos. «Depósitos»: cuántos tienen al menos una celda en el área marcada.`;
    }
    render(); return render;
  });

  /* ───────── 5 · one neuron vs a hidden layer, on two features ───────── */
  const NNF = ["ferric", "distUM"], XR = [1.0, 2.1], YR = [-0.12, 2.0], YT = [0, 0.5, 1, 1.5, 2];
  // cells inside an ultramafic body have distance 0: spread them in a thin band below 0 so they do not overlap (display only)
  const JIT = rng(31), jitY = v => v === 0 ? -0.015 - 0.09 * JIT() : v;
  // VIZ.scatter draws the background as overlapping semi-transparent rects, which shows seams: group them under one opacity
  const smooth = host => { const svg = host.querySelector("svg"), rs = [...svg.querySelectorAll('rect[opacity="0.55"]')]; if (!rs.length) return; const g = el("g", { opacity: .55 }); svg.insertBefore(g, rs[0]); rs.forEach(r => { r.removeAttribute("opacity"); g.appendChild(r); }); };
  let NN2 = null;
  const nnData = () => NN2 || (NN2 = (() => { const D = AREA.data({ feats: NNF, unlabeled: 500, seed: 5 }), S = ML.standardize(D.X); return { ...D, S, Z: S.Z, jy: D.X.map(x => jitY(x[1])) }; })());
  const MLPO = { hidden: 12, lr: 0.03, seed: 2 };
  demo("va-neurona", slide => {
    const D = nnData();
    let arch = "log", frame = null, playing = false, hover = null;
    const LOGF = [], MLPF = {};                         // training snapshots (MLP: same seed, prefix of the same run)
    const EP = [0, 5, 10, 20, 40, 80, 160, 320, 600];
    const logAt = it => { if (!LOGF.length) { const m = ML.logisticInit(2); LOGF.push({ b0: 0, b: [0, 0], it: 0 }); for (let t = 1; t <= 300; t++) { ML.logisticStep(m, D.Z, D.y, { lr: 1 }); LOGF.push({ b0: m.b0, b: m.b.slice(), it: t }); } } return LOGF[Math.min(it, 300)]; };
    const logPred = (F, z) => sigm(F.b0 + F.b[0] * z[0] + F.b[1] * z[1]);
    const mlpAt = ep => MLPF[ep] || (MLPF[ep] = ep === 0 ? ML.mlp(D.Z, D.y, { ...MLPO, epochs: 1, lr: 0 }) : ML.mlp(D.Z, D.y, { ...MLPO, epochs: ep }));
    const full = () => arch === "log" ? { kind: "log", F: logAt(300), it: 300 } : { kind: "mlp", F: mlpAt(600), it: 600 };
    const predictOf = st => st.kind === "log" ? z => logPred(st.F, z) : z => st.F.predict(z);
    chips($("#vaNnArch"), v => { arch = v; frame = null; playing = false; $("#vaNnFig").style.opacity = .5; setTimeout(render, 20); });
    $("#vaNnTrain").addEventListener("click", () => {
      if (playing) return; playing = true; let i = 0;
      const steps = arch === "log" ? [0, 2, 5, 10, 20, 40, 80, 150, 300] : EP, kind = arch;
      const tick = () => {
        if (!slide.classList.contains("on") || arch !== kind || !playing) { playing = false; return; }
        const t = steps[i]; frame = kind === "log" ? { kind, F: logAt(t), it: t } : { kind, F: mlpAt(t), it: t };
        render(); i++;
        if (i < steps.length) setTimeout(tick, 380); else { playing = false; frame = null; render(); }
      };
      tick();
    });
    /* the network diagram, with pulses flowing from inputs to output */
    let pulses = [], anim = null;
    function diagram(st, z) {
      const W = 460, H = 270, svg = svgIn($("#vaNnDiag"), W, H), pos = css("--pos"), neg = css("--neg"), muted = css("--muted");
      arrowDefs(svg, "vaNnArr", muted);
      const inX = 70, inY = [95, 175], edges = [];
      const node = (x, y, r, fill, stroke, label, sub) => { el("circle", { cx: x, cy: y, r, fill, stroke, "stroke-width": 1.6 }, svg); if (label) el("text", { x, y: y + 4, "text-anchor": "middle", "font-size": 12, class: "mono" }, svg, label); if (sub) el("text", { x, y: y + r + 13, "text-anchor": "middle", "font-size": 10.5, fill: muted }, svg, sub); };
      const edge = (x1, y1, x2, y2, w, wmax, lab) => { const sw = 0.6 + 4 * Math.min(1, Math.abs(w) / wmax); el("line", { x1, y1, x2, y2, stroke: w >= 0 ? pos : neg, "stroke-width": sw, opacity: .75 }, svg); edges.push([x1, y1, x2, y2]);
        if (lab) el("text", { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, "text-anchor": "middle", "font-size": 11, class: "mono", fill: w >= 0 ? pos : neg }, svg, lab); };
      const xin = z || [null, null];
      ["B4/B2", "dist. UM"].forEach((n, j) => { node(inX, inY[j], 22, css("--card"), css("--data"), xin[j] == null ? `x${j + 1}` : fmt(xin[j], 1), n); });
      if (st.kind === "log") {
        const F = st.F, sx = 250, sy = 135, wm = Math.max(1, ...F.b.map(Math.abs));
        edge(inX + 22, inY[0], sx - 26, sy - 8, F.b[0], wm, `w₁ = ${fmt(F.b[0], 2)}`); edge(inX + 22, inY[1], sx - 26, sy + 8, F.b[1], wm, `w₂ = ${fmt(F.b[1], 2)}`);
        el("text", { x: sx, y: sy - 44, "text-anchor": "middle", "font-size": 11, class: "mono", fill: muted }, svg, `b = ${fmt(F.b0, 2)}`);
        el("line", { x1: sx, y1: sy - 40, x2: sx, y2: sy - 28, stroke: muted, "marker-end": "url(#vaNnArr)" }, svg);
        const zv = z ? F.b0 + F.b[0] * z[0] + F.b[1] * z[1] : null, p = z ? sigm(zv) : null;
        node(sx, sy, 26, css("--card"), css("--accent"), z ? fmt(zv, 1) : "Σ z", "suma ponderada");
        el("line", { x1: sx + 26, y1: sy, x2: 340, y2: sy, stroke: muted, "stroke-width": 1.6, "marker-end": "url(#vaNnArr)" }, svg); edges.push([sx + 26, sy, 340, sy]);
        // sigmoid glyph
        el("rect", { x: 342, y: sy - 22, width: 44, height: 44, rx: 8, fill: css("--card"), stroke: css("--accent"), "stroke-width": 1.6 }, svg);
        el("path", { d: path(Array.from({ length: 21 }, (_, i) => { const u = -5 + i / 2; return [346 + (u + 5) * 3.6, sy + 16 - 32 * sigm(u)]; })), fill: "none", stroke: css("--accent"), "stroke-width": 2 }, svg);
        el("text", { x: 364, y: sy + 38, "text-anchor": "middle", "font-size": 10.5, fill: muted }, svg, "sigmoide σ");
        el("line", { x1: 388, y1: sy, x2: 412, y2: sy, stroke: muted, "stroke-width": 1.6, "marker-end": "url(#vaNnArr)" }, svg); edges.push([388, sy, 412, sy]);
        node(434, sy, 20, p == null ? css("--card") : VIZ.prob(p), css("--fg"), p == null ? "p" : "", "");
        el("text", { x: 434, y: sy + 36, "text-anchor": "middle", "font-size": 12, class: "mono" }, svg, p == null ? "p" : "p = " + fmt(p, 2));
        el("text", { x: W / 2, y: 22, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css("--accent") }, svg, "regresión logística = una neurona");
        el("text", { x: W / 2, y: H - 8, "text-anchor": "middle", "font-size": 11.5, fill: muted }, svg, "p = σ(b + w₁x₁ + w₂x₂): frontera recta (z = 0)");
      } else {
        const P = st.F.P, h = P.W2.length, hx = 230, hy = i => 44 + i * (190 / (h - 1)), ox = 370, oy = 135;
        const wm1 = Math.max(...P.W1.flat().map(Math.abs)), wm2 = Math.max(...P.W2.map(Math.abs));
        const act = z ? P.W1.map((rw, k) => relu(rw[0] * z[0] + rw[1] * z[1] + P.b1[k])) : null, amax = act ? Math.max(1e-9, ...act) : 1;
        for (let k = 0; k < h; k++) { edge(inX + 22, inY[0], hx - 9, hy(k), P.W1[k][0], wm1); edge(inX + 22, inY[1], hx - 9, hy(k), P.W1[k][1], wm1); edge(hx + 9, hy(k), ox - 24, oy, P.W2[k], wm2); }
        for (let k = 0; k < h; k++) node(hx, hy(k), 9, act ? mix(css("--sw"), css("--well"), act[k] / amax) : css("--card"), css("--sw"), "", "");
        el("text", { x: hx, y: H - 12, "text-anchor": "middle", "font-size": 10.5, fill: muted }, svg, `capa oculta: ${h} ReLU`);
        const p = z ? st.F.predict(z) : null;
        node(ox, oy, 24, css("--card"), css("--cool"), "Σ σ", "");
        el("line", { x1: ox + 24, y1: oy, x2: 412, y2: oy, stroke: muted, "stroke-width": 1.6, "marker-end": "url(#vaNnArr)" }, svg); edges.push([ox + 24, oy, 412, oy]);
        node(434, oy, 20, p == null ? css("--card") : VIZ.prob(p), css("--fg"), "", "");
        el("text", { x: 434, y: oy + 36, "text-anchor": "middle", "font-size": 12, class: "mono" }, svg, p == null ? "p" : "p = " + fmt(p, 2));
        el("text", { x: W / 2, y: 22, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css("--cool") }, svg, "red neuronal: muchas neuronas en paralelo");
      }
      // pulses: a few dots travelling along random edges
      const g = el("g", {}, svg); pulses = Array.from({ length: st.kind === "log" ? 6 : 14 }, (_, i) => ({ e: edges[Math.floor(Math.random() * edges.length)], t: i / 14, c: el("circle", { r: 3, fill: css("--accent"), opacity: .85 }, g) }));
      if (!anim) anim = setInterval(() => {
        if (!slide.classList.contains("on")) { clearInterval(anim); anim = null; return; }
        pulses.forEach(pu => { pu.t += 0.04; if (pu.t > 1) { pu.t = 0; pu.e = edges[Math.floor(Math.random() * edges.length)]; } const [a, b, c, d] = pu.e; pu.c.setAttribute("cx", a + (c - a) * pu.t); pu.c.setAttribute("cy", b + (d - b) * pu.t); });
      }, 40);
    }
    function render() {
      $("#vaNnFig").style.opacity = 1;
      const st = frame || full(), pr = predictOf(st);
      const pts = D.X.map((x, i) => ({ x: x[0], y: D.jy[i], cls: D.y[i] }));
      VIZ.scatter($("#vaNnFig"), pts, { xr: XR, yr: YR, W: 520, H: 340, nx: 52, ny: 34, bg: (x, y) => pr(D.S.apply([x, Math.max(0, y)])), thr: 0.5, xl: "hierro férrico B4/B2", yl: "distancia a ultramáficas (km)", xf: v => fmt(v, 2), yf: v => fmt(v, 1), yt: YT,
        onHover: (x, y) => { y = Math.max(0, y); hover = [x, y]; const z = D.S.apply([x, y]); diagram(st, z); calc(st, x, y, z); } });
      smooth($("#vaNnFig"));
      const z = hover ? D.S.apply(hover) : null; diagram(st, z); calc(st, hover && hover[0], hover && hover[1], z);
      const p = D.Z.map(pr);
      $("#vaNnRead").innerHTML = `<div><span>${st.kind === "log" ? "Iteración" : "Época"}</span><b>${st.it}</b></div><div><span>Log-loss</span><b>${fmt(ML.logloss(p, D.y), 3)}</b></div><div><span>PR-AUC (entrenamiento)</span><b class="${st.kind === "log" ? "" : "c-data"}">${fmt(ML.prAuc(p, D.y), 2)}</b></div><div><span>Parámetros</span><b>${st.kind === "log" ? 3 : 12 * 3 + 13}</b></div>`;
      $("#vaNnEpoch").textContent = playing ? "entrenando…" : st.kind === "log" ? "descenso de gradiente, 300 iteraciones" : "Adam, 600 épocas, 12 neuronas ReLU";
    }
    function calc(st, x, y, z) {
      if (z == null) { $("#vaNnCalc").textContent = "Pasa el cursor por el diagrama de dispersión para ver el cálculo de una celda."; return; }
      if (st.kind === "log") { const F = st.F, zz = F.b0 + F.b[0] * z[0] + F.b[1] * z[1];
        $("#vaNnCalc").innerHTML = `B4/B2 = ${fmt(x, 2)}, dist = ${fmt(y, 2)} km → estandarizadas x = (${fmt(z[0], 2)}, ${fmt(z[1], 2)})\nz = ${fmt(F.b0, 2)} + ${fmt(F.b[0], 2)}·${fmt(z[0], 2)} + ${fmt(F.b[1], 2)}·${fmt(z[1], 2)} = <span class="k">${fmt(zz, 2)}</span>\np = σ(z) = <span class="g">${fmt(sigm(zz), 3)}</span>`; }
      else { const P = st.F.P, a = P.W1.map((rw, k) => relu(rw[0] * z[0] + rw[1] * z[1] + P.b1[k])), on = a.filter(v => v > 0).length;
        $("#vaNnCalc").innerHTML = `x = (${fmt(z[0], 2)}, ${fmt(z[1], 2)}) estandarizadas\nhₖ = ReLU(w·x + b): <span class="k">${on} de ${a.length}</span> neuronas activas (ámbar)\nz = b + Σ vₖ hₖ → p = σ(z) = <span class="g">${fmt(st.F.predict(z), 3)}</span>\nCada ReLU aporta un «pliegue»: la frontera es una línea quebrada.`; }
    }
    $("#vaNnFig").addEventListener("mouseleave", () => { hover = null; render(); });
    render(); return render;
  });

  /* ───────── 6 · logistic vs MLP with few positives: dropout and weight decay; and a CNN patch ───────── */
  demo("va-red", slide => {
    const D = nnData(), HS = [2, 4, 8, 12, 16, 24, 32];
    const west = D.cells.map(k => AREA.xk(k) < 7), r = rng(9);
    const trAll = [...D.Z.keys()].filter(i => west[i]), va = [...D.Z.keys()].filter(i => !west[i]);
    const few = ML.shuffle(trAll.filter(i => D.y[i]), r).slice(0, 16).concat(ML.shuffle(trAll.filter(i => !D.y[i]), r).slice(0, 120));
    const SETS = { few, all: trAll }, Xv = va.map(i => D.Z[i]), yv = va.map(i => D.y[i]);
    let data = "few", drop = 0, wd = 0;
    chips($("#vaRdData"), v => { data = v; later(); });
    chips($("#vaRdDrop"), v => { drop = +v; later(); });
    chips($("#vaRdWd"), v => { wd = +v; later(); });
    const gh = slider("vaRdH", v => HS[v], () => later());
    const LOGM = {}, MLPM = {};
    const logOf = s => LOGM[s] || (LOGM[s] = (() => { const idx = SETS[s], X = idx.map(i => D.Z[i]), y = idx.map(i => D.y[i]); const m = ML.logistic(X, y, { iters: 300, lr: 1 }); return { m, tl: ML.logloss(X.map(m.predict), y), vl: ML.logloss(Xv.map(m.predict), yv), vpr: ML.prAuc(Xv.map(m.predict), yv) }; })());
    const mlpOf = (s, h, dr, w) => { const key = [s, h, dr, w].join("|"); return MLPM[key] || (MLPM[key] = (() => { const idx = SETS[s], X = idx.map(i => D.Z[i]), y = idx.map(i => D.y[i]);
      const m = ML.mlp(X, y, { hidden: h, epochs: 1000, lr: 0.03, dropout: dr, weightDecay: w, evalX: Xv, evalY: yv, seed: 2 }); return { m, tpr: ML.prAuc(X.map(m.predict), y), vpr: ML.prAuc(Xv.map(m.predict), yv) }; })()); };
    let tm = null;
    const later = () => { $("#vaRdMlp").style.opacity = .45; $("#vaRdMlpT").textContent = "Red: entrenando…"; clearTimeout(tm); tm = setTimeout(render, 30); };
    let cnnDep = 0;
    $("#vaRdCnnNext").addEventListener("click", () => { cnnDep = (cnnDep + 1) % KNOWN.length; drawCnn(); });
    function drawCnn() {
      const host = $("#vaRdCnn"); host.innerHTML = ""; host.style.cssText = "display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px";
      const d = KNOWN[cnnDep], ci = clamp(Math.floor(d.cx / CELL) - 8, 0, NX - 16), cj = clamp(NY - 1 - Math.floor(d.cy / CELL) - 8, 0, NY - 16), col = VIZ.layerColor("ferric");
      const T = [["original", (i, j) => [i, j]], ["giro 90°", (i, j) => [j, 15 - i]], ["reflejo", (i, j) => [15 - i, j]], ["giro 180°", (i, j) => [15 - i, 15 - j]]];
      T.forEach(([lab, tf]) => { const box = document.createElement("div"), cv = document.createElement("canvas"); cv.width = cv.height = 64; cv.style.cssText = "width:100%;height:auto;display:block;border-radius:6px;image-rendering:pixelated";
        const g = cv.getContext("2d");
        for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const [a, b] = tf(i, j), k = (cj + b) * NX + ci + a; g.fillStyle = AREA.known[k] ? mix(css("--lw"), col(AREA.ferric[k]), .55) : col(AREA.ferric[k]); g.fillRect(i * 4, j * 4, 4, 4); }
        box.appendChild(cv); const t = document.createElement("div"); t.textContent = lab; t.style.cssText = "font-size:11px;color:var(--muted);text-align:center"; box.appendChild(t); host.appendChild(box); });
    }
    function render() {
      const h = HS[gh()], L = logOf(data), M = mlpOf(data, h, drop, wd), idx = SETS[data];
      const pts = idx.map(i => ({ x: D.X[i][0], y: D.jy[i], cls: D.y[i] }));
      const opts = { xr: XR, yr: YR, W: 520, H: 200, nx: 52, ny: 20, thr: 0.5, xl: "hierro férrico B4/B2", yl: "dist. a ultramáficas (km)", xf: v => fmt(v, 2), yf: v => fmt(v, 1), yt: YT };
      VIZ.scatter($("#vaRdLog"), pts, { ...opts, bg: (x, y) => L.m.predict(D.S.apply([x, Math.max(0, y)])) }); smooth($("#vaRdLog"));
      VIZ.scatter($("#vaRdMlp"), pts, { ...opts, bg: (x, y) => M.m.predict(D.S.apply([x, Math.max(0, y)])) }); smooth($("#vaRdMlp"));
      $("#vaRdMlp").style.opacity = 1;
      $("#vaRdMlpT").textContent = `Red: ${h} ReLU${drop ? " · dropout 0,3" : ""}${wd ? " · weight decay 0,01" : ""}`;
      const tl = M.m.hist, vl = M.m.ehist, ymax = Math.min(1, Math.max(0.3, ...vl.filter(p => p[0] >= 50).map(p => p[1]), L.vl) * 1.1);
      const G = VIZ.curves($("#vaRdLoss"), [{ pts: tl, col: "--cool" }, { pts: vl, col: "--cool", dash: "5 3" }, { pts: [[0, L.vl], [1000, L.vl]], col: "--accent", dash: "2 3", w: 1.6 }],
        { W: 360, H: 150, xr: [0, 1000], yr: [0, ymax], xt: [0, 500, 1000], yt: [0, ymax / 2, ymax], xf: v => fmt(v, 0), yf: v => fmt(v, 2), xl: "época", legendAt: "tr" });
      const best = vl.reduce((a, b) => b[1] < a[1] ? b : a);
      el("circle", { cx: G.x(best[0]), cy: G.y(best[1]), r: 3.5, fill: css("--cool") }, G.svg);
      const over = M.tpr - M.vpr;
      $("#vaRdRead").innerHTML = `<div><span>PR-AUC logística</span><b>${fmt(L.vpr, 2)}</b></div><div><span>Red · entren. → valid.</span><b class="${over > 0.15 ? "c-lw" : "c-ok"}">${fmt(M.tpr, 2)} → ${fmt(M.vpr, 2)}</b></div>`;
      drawCnn();
    }
    render(); return render;
  });
})();
