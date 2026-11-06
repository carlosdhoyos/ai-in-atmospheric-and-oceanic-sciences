/* ═════════ PAE-Minas · section 6: SVM, one-class SVM, weights of evidence, MaxEnt ═════════ */
{
  /* ───────── shared helpers (kept inside this block: no globals) ───────── */
  const VALID = [...Array(AREA.N).keys()].filter(k => !AREA.mine[k]);
  const TRUTH = VALID.map(k => AREA.truth[k]);
  const validMask = Uint8Array.from({ length: AREA.N }, (_, k) => AREA.mine[k] ? 0 : 1);
  // whole-map AUC / PR-AUC against the synthetic truth (mine masked)
  const mapScores = score => { const s = VALID.map(k => score[k]); return { auc: ML.auc(s, TRUTH), pr: ML.prAuc(s, TRUTH) }; };
  // percentile rank of each valid cell (0 = lowest, 1 = highest) → for VIZ.prob
  const rankOf = score => { const r = new Float64Array(AREA.N), o = VALID.slice().sort((a, b) => score[a] - score[b]); o.forEach((k, i) => r[k] = i / (o.length - 1)); return r; };
  // undiscovered / known deposits with at least one cell in a set
  const depHit = set => AREA.DEP.map(d => d.cells.some(k => set.has(k)));
  // line w1 x + w2 y = c clipped to a box
  function clipLine(w1, w2, c, xr, yr) {
    const P = [];
    if (Math.abs(w2) > 1e-12) for (const x of xr) { const y = (c - w1 * x) / w2; if (y >= yr[0] - 1e-9 && y <= yr[1] + 1e-9) P.push([x, y]); }
    if (Math.abs(w1) > 1e-12) for (const y of yr) { const x = (c - w2 * y) / w1; if (x >= xr[0] - 1e-9 && x <= xr[1] + 1e-9) P.push([x, y]); }
    return P.length >= 2 ? [P[0], P.reduce((a, p) => Math.hypot(p[0] - P[0][0], p[1] - P[0][1]) > Math.hypot(a[0] - P[0][0], a[1] - P[0][1]) ? p : a, P[1])] : null;
  }
  // VIZ.scatter draws each background cell at opacity .55, so overlapping edges show as a grid; group them instead
  const smoothBg = svg => { const rs = [...svg.children].filter(e => e.tagName === "rect" && e.getAttribute("opacity")); if (!rs.length) return;
    const g = el("g", { opacity: .55, "shape-rendering": "crispEdges" }); svg.insertBefore(g, rs[0]); rs.forEach(r => { r.removeAttribute("opacity"); g.appendChild(r); }); };
  const debounce = (f, ms = 60) => { let t; return () => { clearTimeout(t); t = setTimeout(f, ms); }; };
  const fmtC = v => v >= 1 ? fmt(v, 0) : fmt(v, v >= 0.1 ? 1 : 2);

  /* the 2-D table for the SVM slides: B4/B2 and distance to ultramafics; 60 positives + 180 unlabeled (seeded) */
  const F2 = ["ferric", "distUM"];
  let D2 = null;
  const data2 = () => D2 || (D2 = (() => {
    const D = AREA.data({ feats: F2, unlabeled: 180, seed: 3 }), P = [], U = [];
    D.y.forEach((v, i) => (v ? P : U).push(i));
    const pick = ML.shuffle(P.slice(), rng(5)).slice(0, 60).concat(U), X = pick.map(i => D.X[i]), y = pick.map(i => D.y[i]), S = ML.standardize(X);
    const cellZ = VALID.map(k => S.apply(AREA.row(k, F2)));
    return { X, y, Z: S.Z, S, cellZ, t: y.map(v => v ? 1 : -1) };
  })());
  const XR = [-3, 3.5], YR = [-1.5, 3.5];
  const ptsOf = (Z, y) => Z.map((z, i) => ({ x: z[0], y: z[1], cls: y[i] }));
  const scatterOpts = { xr: XR, yr: YR, xl: "z(B4/B2) →", yl: "↑ z(distancia a ultramáficas)", W: 470, H: 300, xt: [-3, -2, -1, 0, 1, 2, 3], yt: [-1, 0, 1, 2, 3], xf: v => fmt(v, 0), yf: v => fmt(v, 0) };

  /* ───────── opener: the remaining rows of the model table ───────── */
  demo("s-svm", () => {
    const C = [["sv-lin", "--arch", "SVM lineal y RBF", "Alternativa", "Frontera de margen máximo; con núcleo RBF, no lineal. Estandarizar siempre. Da un puntaje, no una probabilidad.", "Cuando hay negativos razonables y pocas variables; buena con pocos datos."],
      ["sv-one", "--arch", "SVM de una clase", "Alternativa PU", "Se entrena solo con los positivos y encierra su nube.", "Cuando no hay negativos fiables; tiende a marcar todo lo que se parece a los depósitos conocidos."],
      ["sv-woe", "--muted", "Pesos de evidencia / naive Bayes", "Línea base clásica", "Capas binarias, pesos W⁺ y W⁻ sumados en log-odds.", "Referencia estándar en prospectividad mineral; supone independencia condicional entre capas."],
      ["sv-maxent", "--data", "MaxEnt", "Solo presencias", "De la ecología: distribución de máxima entropía que reproduce las medias de las presencias.", "Cuando solo hay presencias y un fondo; encaja bien con el problema PU."]];
    $("#svoCards").innerHTML = C.map(([id, tok, t, role, idea, when]) => `<button class="pick" type="button" data-go="${id}" style="border-left-color:var(${tok})"><b>${t} <span class="tag" style="margin-left:6px">${role}</span></b><span>${idea}</span><em>${when}</em></button>`).join("");
    return () => {};
  });

  /* ───────── linear SVM: margin, support vectors, soft margin C ───────── */
  demo("sv-lin", () => {
    const CS = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 100], cache = {};
    const gC = slider("svlC", i => fmtC(CS[i]), debounce(() => render()));
    const fit = i => cache[i] || (cache[i] = (() => {
      const d = data2(), m = ML.svm(d.Z, d.y, { kernel: "linear", C: CS[i] }), w = [0, 0];
      m.sv.forEach(j => { w[0] += m.alpha[j] * d.t[j] * d.Z[j][0]; w[1] += m.alpha[j] * d.t[j] * d.Z[j][1]; });
      const f = d.Z.map(z => w[0] * z[0] + w[1] * z[1] + m.b), viol = f.map((v, j) => d.t[j] * v < 1 - 1e-3), wrong = f.map((v, j) => d.t[j] * v < 0);
      const score = new Float64Array(AREA.N); VALID.forEach((k, n) => score[k] = w[0] * d.cellZ[n][0] + w[1] * d.cellZ[n][1]);
      return { m, w, f, viol, wrong, ...mapScores(score) };
    })());
    function render() {
      const d = data2(), r = fit(gC()), { m, w } = r, on = new Set(m.onMargin), sv = new Set(m.sv);
      const S = VIZ.scatter($("#svlFig"), ptsOf(d.Z, d.y), { ...scatterOpts, bg: (x, y) => sigm(2 * (w[0] * x + w[1] * y + m.b)) }); smoothBg(S.svg);
      const g = el("g", {}, S.svg);
      [[0, "", 2.4], [1, "6 4", 1.4], [-1, "6 4", 1.4]].forEach(([c, dash, sw]) => { const L = clipLine(w[0], w[1], c - m.b, XR, YR); if (!L) return;
        el("line", { x1: S.X(L[0][0]), y1: S.Y(L[0][1]), x2: S.X(L[1][0]), y2: S.Y(L[1][1]), stroke: css(c ? "--arch" : "--fg"), "stroke-width": sw, "stroke-dasharray": dash }, g); });
      d.Z.forEach((z, j) => { if (!sv.has(j)) return; const x = S.X(clamp(z[0], ...XR)), y = S.Y(clamp(z[1], ...YR));
        el("circle", on.has(j) ? { cx: x, cy: y, r: 7, fill: "none", stroke: css("--arch"), "stroke-width": 2 } : { cx: x, cy: y, r: 6.5, fill: "none", stroke: css("--fg"), "stroke-width": 1, "stroke-dasharray": "2 2", opacity: .7 }, g); });
      const nw = Math.hypot(...w), nv = r.viol.filter(Boolean).length, nwr = r.wrong.filter(Boolean).length;
      $("#svlRead").innerHTML = `<div><span>Vectores de soporte</span><b class="c-arch">${m.sv.length}</b></div><div><span>En el borde</span><b>${m.onMargin.length}</b></div><div><span>Invaden la franja</span><b class="c-lw">${nv}</b></div><div><span>Ancho 2/‖w‖ (z)</span><b>${fmt(2 / nw, 2)}</b></div>`;
      $("#svlNote").innerHTML = `${d.y.length} celdas (60 positivos, 180 no etiquetadas al azar). Línea negra: frontera f = 0; violetas discontinuas: bordes de la franja f = ±1. Del lado de los positivos (amarillo) la SVM dice «laterita». ${nwr} puntos quedan del lado equivocado. Mapa completo con esta recta: AUC ${fmt(r.auc, 2)}, PR-AUC ${fmt(r.pr, 2)}.`;
    }
    render(); return render;
  });

  /* ───────── RBF kernel: similarity to each support vector; γ, C, class weights ───────── */
  demo("sv-rbf", () => {
    const GS = [0.1, 0.3, 1, 3, 10, 30], CS = [0.1, 0.3, 1, 3, 10], cache = {};
    let cw = "none", hover = [1.2, -1.0];
    const later = debounce(() => render());
    const gG = slider("svrG", i => fmtC(GS[i]), later), gC = slider("svrC", i => fmtC(CS[i]), later);
    chips($("#svrW"), v => { cw = v; render(); });
    const K = (a, b, g) => Math.exp(-g * ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2));
    const fit = (gi, ci, w) => { const key = `${gi}|${ci}|${w}`; return cache[key] || (cache[key] = (() => {
      const d = data2(), t0 = performance.now(), m = ML.svm(d.Z, d.y, { kernel: "rbf", gamma: GS[gi], C: CS[ci], classWeight: w === "balanced" ? "balanced" : null, maxIter: 1500 }), ms = performance.now() - t0;
      const score = new Float64Array(AREA.N); VALID.forEach((k, n) => score[k] = m.decision(d.cellZ[n]));
      const pos = d.Z.filter((z, j) => d.y[j] && m.decision(z) > 0).length, unl = d.Z.filter((z, j) => !d.y[j] && m.decision(z) > 0).length;
      return { m, ms, pos, unl, ...mapScores(score) };
    })()); };
    let S = null, ov = null;
    function explain() {
      const d = data2(), g = GS[gG()], { m } = fit(gG(), gC(), cw), x = hover;
      const parts = m.sv.map(j => ({ j, k: K(d.Z[j], x, g), c: m.alpha[j] * d.t[j] * K(d.Z[j], x, g) })), f = parts.reduce((s, p) => s + p.c, m.b);
      if (ov) { ov.innerHTML = ""; const px = S.X(clamp(x[0], ...XR)), py = S.Y(clamp(x[1], ...YR));
        parts.filter(p => p.k > 0.02).sort((a, b) => b.k - a.k).slice(0, 40).forEach(p => { const z = d.Z[p.j], sx = S.X(clamp(z[0], ...XR)), sy = S.Y(clamp(z[1], ...YR)), col = css(d.t[p.j] > 0 ? "--lw" : "--cool");
          el("line", { x1: px, y1: py, x2: sx, y2: sy, stroke: col, "stroke-width": 0.6 + 2.4 * p.k, opacity: 0.25 + 0.6 * p.k }, ov);
          el("circle", { cx: sx, cy: sy, r: 3 + 6 * p.k, fill: "none", stroke: col, "stroke-width": 1.6 }, ov); });
        el("circle", { cx: px, cy: py, r: 6, fill: css("--fg"), stroke: css("--bg"), "stroke-width": 2 }, ov); }
      const top = parts.slice().sort((a, b) => Math.abs(b.c) - Math.abs(a.c)).slice(0, 3);
      const raw = d.S.mu.map((mu, i) => mu + d.S.sd[i] * x[i]);
      $("#svrCalc").innerHTML = `celda: B4/B2 ${fmt(raw[0], 2)} · dist. ${fmt(Math.max(0, raw[1]), 2)} km\n` + top.map(p => `<span class="${d.t[p.j] > 0 ? "r" : "m"}">${d.t[p.j] > 0 ? "positivo   " : "no etiq.   "}</span> α ${fmt(m.alpha[p.j], 2).padStart(5)} · K ${fmt(p.k, 2)} → ${p.c >= 0 ? "+" : "−"}${fmt(Math.abs(p.c), 2)}`).join("\n")
        + `\n<span class="m">… ${m.sv.length - 3} más, y b = ${fmt(m.b, 2)}</span>\nf(x) = <span class="k">${fmt(f, 2)}</span> → ${f > 0 ? '<span class="r">lado «laterita»</span>' : "lado «no etiquetado»"} · σ(2f) = ${fmt(sigm(2 * f), 2)}`;
    }
    function render() {
      const d = data2(), r = fit(gG(), gC(), cw), { m } = r, sv = new Set(m.sv);
      S = VIZ.scatter($("#svrFig"), ptsOf(d.Z, d.y), { ...scatterOpts, bg: (x, y) => sigm(2 * m.decision([x, y])), thr: 0.5, onHover: (x, y) => { hover = [x, y]; explain(); } }); smoothBg(S.svg);
      const g = el("g", { "pointer-events": "none" }, S.svg); S.svg.insertBefore(g, S.svg.lastChild);
      d.Z.forEach((z, j) => { if (sv.has(j)) el("circle", { cx: S.X(clamp(z[0], ...XR)), cy: S.Y(clamp(z[1], ...YR)), r: 6, fill: "none", stroke: css("--arch"), "stroke-width": 1.3, opacity: .75 }, g); });
      ov = el("g", { "pointer-events": "none" }, S.svg); S.svg.insertBefore(ov, S.svg.lastChild);
      VIZ.legend($("#svrLeg"), { label: "σ(2 f): puntaje, no probabilidad", width: 260 });
      $("#svrRead").innerHTML = `<div><span>Vectores de soporte</span><b class="c-arch">${m.sv.length}</b></div><div><span>Positivos del lado +</span><b class="c-lw">${r.pos} / 60</b></div><div><span>No etiq. del lado +</span><b>${r.unl} / 180</b></div><div><span>AUC · PR-AUC mapa</span><b>${fmt(r.auc, 2)} · ${fmt(r.pr, 2)}</b></div>`;
      explain();
    }
    render(); return render;
  });

  /* ───────── one-class SVM ─────────
     ML.oneClassSVM uses random pairwise updates for a fixed number of iterations and does not always converge (the
     fraction of positives outside the boundary can exceed ν). This small SMO with maximal-violating-pair selection
     solves the same ν dual to tolerance, so the ν property shown on the slide holds. */
  function ocsvm(X, { nu = 0.1, gamma = 1, eps = 1e-5, maxIt = 20000 } = {}) {
    const n = X.length, C = 1 / (nu * n), K = (p, q) => Math.exp(-gamma * ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2));
    const KM = X.map(a => Float64Array.from(X, b => K(a, b))), a = new Float64Array(n); let left = 1;
    for (let i = 0; i < n && left > 1e-12; i++) { a[i] = Math.min(C, left); left -= a[i]; }
    const G = new Float64Array(n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) G[i] += a[k] * KM[i][k];
    for (let it = 0; it < maxIt; it++) {
      let i = -1, j = -1;
      for (let k = 0; k < n; k++) { if (a[k] < C - 1e-12 && (i < 0 || G[k] < G[i])) i = k; if (a[k] > 1e-12 && (j < 0 || G[k] > G[j])) j = k; }
      if (i < 0 || j < 0 || G[j] - G[i] < eps) break;
      const eta = Math.max(KM[i][i] + KM[j][j] - 2 * KM[i][j], 1e-12), dd = Math.min((G[j] - G[i]) / eta, C - a[i], a[j]);
      a[i] += dd; a[j] -= dd; for (let k = 0; k < n; k++) G[k] += dd * (KM[k][i] - KM[k][j]);
    }
    const sv = [...Array(n).keys()].filter(i => a[i] > 1e-10), free = sv.filter(i => a[i] < C - 1e-10);
    const rho = free.length ? mean(free.map(i => G[i])) : (Math.max(...sv.map(i => G[i])) + Math.min(...sv.map(i => G[i]))) / 2;
    return { decision: x => sv.reduce((s, i) => s + a[i] * K(X[i], x), 0) - rho, sv, rho };
  }
  demo("sv-one", () => {
    const NUS = [0.02, 0.05, 0.1, 0.2, 0.3, 0.5], GS = [0.1, 0.3, 1, 3, 10], cache = {};
    const later = debounce(() => render());
    const gN = slider("svoNu", i => fmt(NUS[i], 2), later), gG = slider("svoG", i => fmtC(GS[i]), later);
    // standardize with the statistics of the whole area (no labels needed for that)
    const mu = F2.map(f => mean(VALID.map(k => AREA.L[f][k]))), sdv = F2.map(f => sd(VALID.map(k => AREA.L[f][k])));
    const zOf = k => F2.map((f, j) => (AREA.L[f][k] - mu[j]) / sdv[j]);
    const posCells = VALID.filter(k => AREA.known[k]), Zp = posCells.map(zOf), cellZ = VALID.map(zOf);
    const YR1 = [-1.5, 2], rb = rng(9), bgPts = ML.shuffle(VALID.filter(k => !AREA.known[k]), rb).slice(0, 300).map(k => { const z = zOf(k); return { x: z[0], y: z[1], cls: 0, r: 2 }; }).filter(p => p.y <= YR1[1] && p.x >= XR[0] && p.x <= XR[1]);
    const fit = (ni, gi) => { const key = ni + "|" + gi; return cache[key] || (cache[key] = (() => {
      const m = ocsvm(Zp, { nu: NUS[ni], gamma: GS[gi] }), score = new Float64Array(AREA.N); VALID.forEach((k, n) => score[k] = m.decision(cellZ[n]));
      const inside = new Set(VALID.filter(k => score[k] >= 0)), out = Zp.filter(z => m.decision(z) < -1e-4).length;
      const lat = VALID.filter(k => AREA.truth[k]), cap = lat.filter(k => inside.has(k)).length / lat.length;
      const s = sd(VALID.map(k => score[k])) || 1;
      return { m, score, inside, out, cap, s, rank: rankOf(score), hit: depHit(inside), ...mapScores(score) };
    })()); };
    function render() {
      const r = fit(gN(), gG()), { m } = r;
      const S = VIZ.scatter($("#svoFig"), bgPts.concat(Zp.map(z => ({ x: z[0], y: z[1], cls: 1 }))), { ...scatterOpts, yr: YR1, yt: [-1, 0, 1, 2], H: 250, bg: (x, y) => sigm(3 * m.decision([x, y]) / r.s), thr: 0.5 }); smoothBg(S.svg);
      const g = el("g", {}, S.svg); m.sv.forEach(i => el("circle", { cx: S.X(clamp(Zp[i][0], ...XR)), cy: S.Y(clamp(Zp[i][1], ...YR1)), r: 6.5, fill: "none", stroke: css("--arch"), "stroke-width": 1.4 }, g));
      VIZ.map($("#svoMap"), r.rank, { valid: validMask, hi: r.inside, deposits: "all" });
      VIZ.legend($("#svoLeg"), { label: "rango del puntaje (0 = más bajo)", width: 260 });
      const und = AREA.DEP.filter(d => !d.known), hitU = und.filter(d => r.hit[d.id]).length;
      $("#svoRead").innerHTML = `<div><span>Positivos fuera (ν = ${fmt(NUS[gN()], 2)})</span><b class="c-lw">${fmt(100 * r.out / Zp.length, 0)} %</b></div><div><span>Vectores de soporte</span><b class="c-arch">${m.sv.length}</b></div><div><span>Área marcada</span><b>${fmt(100 * r.inside.size / VALID.length, 1)} %</b></div><div><span>Laterita real dentro</span><b class="c-ok">${fmt(100 * r.cap, 0)} %</b></div>`;
      $("#svoNote").innerHTML = `Depósitos sin descubrir tocados por la zona marcada: <b>${hitU} de ${und.length}</b>. AUC y PR-AUC del puntaje en el mapa (2 variables, contra la verdad sintética): ${fmt(r.auc, 2)} · ${fmt(r.pr, 2)}. Con solo positivos, el modelo marca todo lo que tiene B4/B2 alto sobre ultramáficas, incluidas celdas sin laterita: sin negativos, no sabe qué <i>no</i> es un depósito.`;
    }
    render(); return render;
  });

  /* ───────── weights of evidence ───────── */
  demo("sv-woe", () => {
    const L = [["ferric", "B4/B2", true], ["clay", "B11/B12", true], ["distUM", "Dist. UM", false], ["slope", "Pendiente", false], ["ndvi", "NDVI", false]];
    const D = AREA.data({ feats: L.map(l => l[0]) }), n1 = D.y.reduce((a, b) => a + b, 0);
    let nd = 0; const later = debounce(() => render(), 40);
    const get = L.map((l, j) => slider("svwT" + j, v => fmt(v, l[0] === "slope" ? 1 : 2) + (l[0] === "distUM" ? " km" : l[0] === "slope" ? "°" : ""), later));
    chips($("#svwNd"), v => { nd = +v; render(); });
    const cor = corr(VALID.map(k => AREA.ferric[k]), VALID.map(k => AREA.ndvi[k]));
    const scoreFor = use => { const thr = use.map(j => get[j]()), m = ML.weightsOfEvidence(D.X.map(x => use.map(j => x[j])), D.y, { thresholds: thr, above: use.map(j => L[j][2]) });
      const z = new Float64Array(AREA.N); VALID.forEach(k => z[k] = m.z(use.map(j => AREA.L[L[j][0]][k]))); return { m, z }; };
    function render() {
      const use = nd ? [0, 1, 2, 3, 4] : [0, 1, 2, 3], { m, z } = scoreFor(use), other = nd ? scoreFor([0, 1, 2, 3]) : scoreFor([0, 1, 2, 3, 4]);
      $("#svwT4").disabled = !nd; $("#svwT4").parentElement.style.opacity = nd ? 1 : .45;
      const rows = m.layers.map((ly, i) => { const j = use[i], on = D.X.map(x => ly.above ? x[j] > ly.t : x[j] <= ly.t), a = on.filter((v, r) => v && D.y[r]).length, area = on.filter(Boolean).length / on.length;
        return `<tr><td>${L[j][1]} ${ly.above ? "&gt;" : "≤"} ${fmt(ly.t, L[j][0] === "slope" ? 1 : 2)}</td><td>${fmt(100 * area, 0)} %</td><td>${a} / ${n1}</td><td style="color:var(--ok)">${fmt(ly.Wp, 2)}</td><td style="color:var(--lw)">${fmt(ly.Wm, 2)}</td><td><b>${fmt(ly.contrast, 2)}</b></td></tr>`; }).join("");
      $("#svwTable").innerHTML = `<table class="sv-tab"><thead><tr><th>Evidencia B</th><th>Área</th><th>Positivos en B</th><th>W⁺</th><th>W⁻</th><th>C</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="note" style="margin:6px 0 0">Previa <span class="en">(prior)</span>: logit P(D) = ln(${n1} / ${fmtN(D.y.length - n1)}) = ${fmt(m.prior, 2)}. Cada celda suma W⁺ si cumple la condición y W⁻ si no.</p>`;
      const post = new Float64Array(AREA.N); let pmax = 0; VALID.forEach(k => { post[k] = sigm(z[k]); pmax = Math.max(pmax, post[k]); });
      VIZ.map($("#svwMap"), k => post[k] / pmax, { valid: validMask, deposits: "all", scale: 4 });
      VIZ.legend($("#svwLeg"), { color: v => VIZ.prob(v / pmax), min: 0, max: pmax, digits: 2, label: "probabilidad posterior", width: 260 });
      const a = mapScores(z), b = mapScores(other.z); let pmaxO = 0; VALID.forEach(k => pmaxO = Math.max(pmaxO, sigm(other.z[k])));
      $("#svwRead").innerHTML = `<div><span>AUC · PR-AUC mapa</span><b>${fmt(a.auc, 2)} · ${fmt(a.pr, 2)}</b></div><div><span>Máx. posterior</span><b class="c-sw">${fmt(pmax, 2)}</b></div>`;
      $("#svwCmp").innerHTML = `${nd ? "Sin" : "Con"} NDVI (mismos umbrales): AUC ${fmt(b.auc, 2)} · PR-AUC ${fmt(b.pr, 2)} · máx. posterior ${fmt(pmaxO, 2)}`;
      $("#svwNote").innerHTML = `<b>Supuesto clave:</b> las capas son <b>condicionalmente independientes</b> dado el depósito (naive Bayes), así que sus pesos se suman. Aquí B4/B2 y NDVI están correlacionados (r = ${fmt(cor, 2)} en el área: la vegetación tapa el hierro); al añadir NDVI se cuenta dos veces parte de la misma evidencia y la probabilidad de las mejores celdas se infla, aunque el <i>orden</i> de las celdas (AUC, PR-AUC) apenas cambie. Mapa: depósitos conocidos (contorno rojo) y sin descubrir (punteado). Datos sintéticos.`;
    }
    render(); return render;
  });

  /* ───────── MaxEnt (simplified): exponential tilt of the background to match presence moments ───────── */
  // maximize λ·μ_P − log Σ_bg exp(λ·f) − β/2 ‖λ‖²   (damped Newton with backtracking)
  function maxent(Fb, Fp, beta = 0.05, iters = 60) {
    const d = Fb[0].length, muP = Array(d).fill(0); Fp.forEach(f => f.forEach((v, j) => muP[j] += v / Fp.length));
    const lin = (f, l) => { let s = 0; for (let j = 0; j < d; j++) s += f[j] * l[j]; return s; };
    const obj = l => { const s = Fb.map(f => lin(f, l)), mx = Math.max(...s); return lin(muP, l) - mx - Math.log(s.reduce((a, v) => a + Math.exp(v - mx), 0)) - beta / 2 * lin(l, l); };
    let lam = Array(d).fill(0), cur = obj(lam), w = null;
    const weights = l => { const s = Fb.map(f => lin(f, l)), mx = Math.max(...s), e = s.map(v => Math.exp(v - mx)), Z = e.reduce((a, b) => a + b, 0); return e.map(v => v / Z); };
    for (let t = 0; t < iters; t++) {
      w = weights(lam); const mu = Array(d).fill(0); Fb.forEach((f, i) => f.forEach((v, j) => mu[j] += w[i] * v));
      const H = Array.from({ length: d }, () => Array(d).fill(0));
      Fb.forEach((f, i) => { for (let a = 0; a < d; a++) for (let b = a; b < d; b++) H[a][b] += w[i] * (f[a] - mu[a]) * (f[b] - mu[b]); });
      for (let a = 0; a < d; a++) { H[a][a] += beta; for (let b = 0; b < a; b++) H[a][b] = H[b][a]; }
      const st = solve(H, muP.map((v, j) => v - mu[j] - beta * lam[j]));
      let step = 1, nl = null; for (; step > 1e-4; step /= 2) { nl = lam.map((v, j) => v + step * st[j]); const o = obj(nl); if (o >= cur - 1e-12) { cur = o; break; } }
      if (step <= 1e-4) break; lam = nl; if (Math.hypot(...st) * step < 1e-7) break;
    }
    return { lam, muP, w: weights(lam) };
  }
  demo("sv-maxent", () => {
    const LAY = ["ferric", "clay", "distUM", "slope", "mag", "ndvi"], FIVE = ["ferric", "clay", "distUM", "slope", "mag"], cache = {};
    $("#svmL").innerHTML = LAY.map((k, i) => `<button class="chip" data-v="${k}" aria-pressed="${i === 0}">${AREA.F[k].es.replace(/ B\d.*$/, "")}</button>`).join("");
    let lay = "ferric", deg = 1;
    chips($("#svmL"), v => { lay = v; render(); }); chips($("#svmF"), v => { deg = +v; render(); });
    const st = Object.fromEntries(LAY.map(f => { const v = VALID.map(k => AREA.L[f][k]); return [f, { mu: mean(v), sd: sd(v), min: Math.min(...v), max: Math.max(...v) }]; }));
    const feat = (keys, q) => k => keys.flatMap(f => { const z = (AREA.L[f][k] - st[f].mu) / st[f].sd; return q === 2 ? [z, z * z] : [z]; });
    const pres = VALID.filter(k => AREA.known[k]);
    const one = (f, q) => cache[f + q] || (cache[f + q] = (() => { const fe = feat([f], q); return maxent(VALID.map(fe), pres.map(fe)); })());
    const five = q => cache["all" + q] || (cache["all" + q] = (() => { const fe = feat(FIVE, q), m = maxent(VALID.map(fe), pres.map(fe)), score = new Float64Array(AREA.N);
      VALID.forEach(k => { const v = fe(k); score[k] = v.reduce((a, x, j) => a + x * m.lam[j], 0); }); return { m, score, rank: rankOf(score), ...mapScores(score) }; })());
    function render() {
      const F = AREA.F[lay], s = st[lay], m = one(lay, deg), nb = 28, lo = s.min, hi = s.max + 1e-9, bw = (hi - lo) / nb, bin = v => clamp(Math.floor((v - lo) / bw), 0, nb - 1);
      const hb = Array(nb).fill(0), hp = Array(nb).fill(0), hm = Array(nb).fill(0);
      VALID.forEach((k, i) => { const b = bin(AREA.L[lay][k]); hb[b] += 1 / VALID.length; hm[b] += m.w[i]; });
      pres.forEach(k => hp[bin(AREA.L[lay][k])] += 1 / pres.length);
      const ymax = Math.min(1, Math.max(...hb, ...hp, ...hm) * 1.08), W = 480, H = 200, svg = svgIn($("#svmFig"), W, H);
      const A = axes(svg, { W, H, m: { l: 40, r: 10, t: 14, b: 30 }, x0: lo, x1: hi, y0: 0, y1: ymax, xt: [lo, (lo + hi) / 2, hi], yt: [0, ymax / 2], xf: v => fmt(v, F.d), yf: v => fmt(v, 2), xl: F.es + (F.unit ? ` (${F.unit})` : "") + " · eje vertical: fracción de celdas" });
      const bx = i => A.x(lo + i * bw), bwid = A.x(lo + bw) - A.x(lo);
      hb.forEach((v, i) => el("rect", { x: bx(i) + .5, y: A.y(v), width: Math.max(bwid - 1, 1), height: A.y(0) - A.y(v), fill: css("--cool"), opacity: .35 }, svg));
      hp.forEach((v, i) => v && el("rect", { x: bx(i) + bwid * .2, y: A.y(Math.min(v, ymax)), width: Math.max(bwid * .6, 1), height: A.y(0) - A.y(Math.min(v, ymax)), fill: css("--lw"), opacity: .8 }, svg));
      el("path", { d: path(hm.map((v, i) => [bx(i) + bwid / 2, A.y(Math.min(v, ymax))])), fill: "none", stroke: css("--data"), "stroke-width": 2.4 }, svg);
      const muB = s.mu, muP = mean(pres.map(k => AREA.L[lay][k])), muM = VALID.reduce((a, k, i) => a + m.w[i] * AREA.L[lay][k], 0);
      [[muB, "--cool", "fondo"], [muP, "--lw", "presencias"]].forEach(([v, tok, lab], i) => { el("line", { x1: A.x(v), x2: A.x(v), y1: 14, y2: H - 30, stroke: css(tok), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
        const right = i ? A.x(v) < W - 90 : A.x(v) < 110; el("text", { x: A.x(v) + (right ? 4 : -4), y: 12 + 13 * i, "text-anchor": right ? "start" : "end", "font-size": 10.5, fill: css(tok) }, svg, "media " + lab); });
      $("#svmH").textContent = `Distribución de ${F.es} (${F.en})`;
      $("#svmRead").innerHTML = `<div><span>Media fondo</span><b style="color:var(--cool)">${fmt(muB, F.d)}</b></div><div><span>Media presencias</span><b class="c-lw">${fmt(muP, F.d)}</b></div><div><span>Media MaxEnt</span><b class="c-data">${fmt(muM, F.d)}</b></div><div><span style="text-transform:none">λ (z${deg === 2 ? ", z²" : ""})</span><b class="c-data">${m.lam.map(v => fmt(v, 2)).join(" · ")}</b></div>`;
      const r = five(deg);
      VIZ.map($("#svmMap"), r.rank, { valid: validMask, deposits: "all", scale: 4 });
      $("#svmRead2").innerHTML = `<div><span>AUC mapa</span><b>${fmt(r.auc, 2)}</b></div><div><span>PR-AUC mapa</span><b>${fmt(r.pr, 2)}</b></div>`;
    }
    render(); return render;
  });
}
