/* ═════════ PAE-Minas · section 1: the problem ═════════ */

/* highlight the current section in the header (data-sec starts with the section number) */
{
  const goBase = go;
  go = function (i) {
    goBase(i);
    const n = (slides[cur].dataset.sec || "").split(" ")[0];
    $$("nav.series .mod").forEach(b => b.classList.toggle("on", b.querySelector("span").textContent === n));
  };
}

/* cover: lithology, deposits, mine; cards that jump to each section */
demo("cover", () => {
  const cards = [["s-problema", "1 · El problema", "Capas, etiquetas positivas y no etiquetadas, fugas."], ["s-logistica", "2 · Regresión logística", "Sigmoide, odds, varias variables, ajuste, regularización, desbalance."],
    ["s-validacion", "3 · Validación y mapas", "Bloques espaciales, mapa de prospectividad, curva de éxito, de la regresión a una red."],
    ["s-bosques", "4 · Árboles y Random Forest", "Cortes, profundidad, votos, importancia, PU bagging."], ["s-boosting", "5 · Boosting: XGBoost y LightGBM", "Árboles en secuencia, tasa de aprendizaje, crecimiento por nivel u hoja."],
    ["s-svm", "6 · SVM y otros", "Margen, núcleo RBF, SVM de una clase, pesos de evidencia, MaxEnt."], ["s-comparacion", "7 · Comparación", "Todos los modelos con validación espacial; flujo de trabajo."]];
  $("#pcCards").innerHTML = cards.map(([id, t, d]) => `<button class="pick" type="button" data-go="${id}"><b>${t}</b><span>${d}</span></button>`).join("");
  function render() {
    VIZ.map($("#pcMap"), AREA.lith, { color: v => VIZ.lith(v) });
    $("#pcLeg").innerHTML = VIZ.LITHNAME.map((n, i) => `<span><i style="background:${VIZ.lith(i)};border:1px solid var(--line)"></i>${n}</span>`).join("") + `<span><i style="background:var(--lw)"></i>Depósito conocido</span>`;
  }
  render(); return render;
});

/* the layers, with a hover readout of every value at a cell */
demo("s-problema", () => {
  const LAY = [["lith", "Litología"], ["elev", "Elevación"], ["slope", "Pendiente"], ["distUM", "Dist. a ultramáficas"], ["mag", "Magnetometría"], ["ferric", "Hierro férrico B4/B2"], ["clay", "Arcillas/OH B11/B12"], ["ndvi", "NDVI"]];
  $("#ppLayer").innerHTML = LAY.map(([k, n], i) => `<button class="chip" data-v="${k}" aria-pressed="${i === 0}">${n}</button>`).join("");
  let layer = "lith", sel = -1;
  chips($("#ppLayer"), v => { layer = v; render(); });
  const fmtCell = k => { const F = AREA.F, i = k % AREA.NX, j = Math.floor(k / AREA.NX);
    return `celda (${i}, ${j}) · ${VIZ.LITHNAME[AREA.lith[k]]}\n` + ["elev", "slope", "distUM", "mag", "ferric", "clay", "ndvi"].map(f => `${F[f].es.padEnd(26)} ${fmt(AREA.L[f][k], F[f].d)} ${F[f].unit}`).join("\n")
      + `\n${AREA.mine[k] ? "mina (enmascarada)" : AREA.known[k] ? "→ depósito conocido (positivo)" : "→ no etiquetada"}`; };
  function render() {
    const f = AREA.F[layer], m = VIZ.map($("#ppMap"), AREA.L[layer], { color: layer === "lith" ? v => VIZ.lith(v) : VIZ.layerColor(layer), points: sel >= 0 ? [{ k: sel, color: css("--fg") }] : null });
    if (layer === "lith") $("#ppLeg").innerHTML = `<div class="legend">${VIZ.LITHNAME.map((n, i) => `<span><i style="background:${VIZ.lith(i)};border:1px solid var(--line)"></i>${n}</span>`).join("")}</div>`;
    else VIZ.legend($("#ppLeg"), { color: VIZ.layerColor(layer), min: VIZ.RANGE[layer][0], max: VIZ.RANGE[layer][1], label: `${f.es}${f.unit ? " (" + f.unit + ")" : ""}`, digits: f.d });
    const tip = $("#ppTip");
    m.canvas.addEventListener("mousemove", e => { const k = m.cellAt(e); if (k < 0) return; tip.style.display = "block"; tip.textContent = fmtCell(k);
      const r = $("#ppWrap").getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.style.left = Math.min(x + 14, r.width - 230) + "px"; tip.style.top = Math.min(y + 14, r.height - 150) + "px"; });
    m.canvas.addEventListener("mouseleave", () => tip.style.display = "none");
    m.canvas.addEventListener("click", e => { sel = m.cellAt(e); render(); });
    $("#ppCell").textContent = sel >= 0 ? fmtCell(sel) : "Haz clic en una celda para fijar sus valores aquí.";
  }
  render(); return render;
});

/* Sentinel-2 bands for typical surfaces, and the ratios computed from them */
demo("p-s2", () => {
  const BANDS = [["B2", 490, "azul"], ["B3", 560, "verde"], ["B4", 665, "rojo"], ["B8", 842, "NIR"], ["B8A", 865, "NIR estr."], ["B11", 1610, "SWIR 1"], ["B12", 2190, "SWIR 2"]];
  const SURF = {   // approximate surface reflectance, illustrative only
    lat: ["Laterita (óxidos de Fe)", [0.06, 0.09, 0.17, 0.24, 0.25, 0.33, 0.26], "--lw", "Suelo rojo-pardo de la meseta: el rojo (B4) sube mucho frente al azul (B2) por la hematita y la goethita."],
    sap: ["Saprolito arcilloso", [0.09, 0.12, 0.15, 0.26, 0.27, 0.37, 0.25], "--sw", "Arcillas ricas en Mg y Ni bajo la laterita: absorción de OH en B12, así que B11/B12 sube."],
    red: ["Suelo rojo sobre sedimentos", [0.07, 0.10, 0.17, 0.25, 0.26, 0.31, 0.27], "--mag", "Suelo ferruginoso sin níquel: B4/B2 tan alto como la laterita. Solo la geología (distancia a ultramáficas) lo descarta."],
    veg: ["Pasto y bosque", [0.03, 0.06, 0.04, 0.36, 0.38, 0.19, 0.10], "--ok", "La vegetación absorbe el rojo y refleja el NIR: NDVI alto. Su B11/B12 también es alto: hay que usar solo observaciones de suelo desnudo."],
    mine: ["Mina (suelo removido)", [0.11, 0.15, 0.23, 0.27, 0.28, 0.36, 0.31], "--muted", "Suelo desnudo y removido: cocientes extremos. Por eso se enmascara."] };
  $("#psSurf").innerHTML = Object.entries(SURF).map(([k, s], i) => `<button class="chip" data-v="${k}" aria-pressed="${i === 0}">${s[0]}</button>`).join("");
  let sel = "lat";
  chips($("#psSurf"), v => { sel = v; render(); });
  function render() {
    const W = 480, H = 230, svg = svgIn($("#psFig"), W, H), A = axes(svg, { W, H, m: { l: 40, r: 10, t: 12, b: 34 }, x0: 450, x1: 2250, y0: 0, y1: 0.42, xt: [], yt: [0, 0.2, 0.4], yf: v => fmt(v, 1), yl: "reflectancia" });
    BANDS.forEach(([b, wl, n]) => { el("text", { x: A.x(wl), y: H - 20, "text-anchor": "middle", class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, b); el("text", { x: A.x(wl), y: H - 7, "text-anchor": "middle", "font-size": 9.5, fill: css("--muted") }, svg, n); });
    Object.entries(SURF).forEach(([k, s]) => { const on = k === sel;
      el("path", { d: path(s[1].map((v, i) => [A.x(BANDS[i][1]), A.y(v)])), fill: "none", stroke: css(s[2]), "stroke-width": on ? 3 : 1.2, opacity: on ? 1 : .35 }, svg);
      if (on) s[1].forEach((v, i) => el("circle", { cx: A.x(BANDS[i][1]), cy: A.y(v), r: 4, fill: css(s[2]) }, svg)); });
    const v = SURF[sel][1], fe = v[2] / v[0], cl = v[5] / v[6], nd = (v[3] - v[2]) / (v[3] + v[2]);
    $("#psRead").innerHTML = `<div><span>B4/B2 férrico</span><b style="color:var(--lw)">${fmt(fe, 2)}</b></div><div><span>B11/B12 arcillas</span><b style="color:var(--sw)">${fmt(cl, 2)}</b></div><div><span>NDVI</span><b class="c-ok">${fmt(nd, 2)}</b></div>`;
    $("#psNote").textContent = SURF[sel][3];
  }
  render(); return render;
});

/* labels: what we know vs the synthetic truth, and the exclusion buffer */
demo("p-labels", () => {
  let show = "known"; chips($("#plShow"), v => { show = v; render(); });
  const gb = slider("plBuf", v => fmt(v, 2) + " km", () => render());
  const cnt = a => a.reduce((s, v) => s + (v ? 1 : 0), 0);
  function render() {
    const buf = gb(), D = AREA.data({ buffer: buf }), inTable = new Uint8Array(AREA.N); D.cells.forEach(k => inTable[k] = 1);
    const color = (v, k) => AREA.known[k] ? css("--lw") : show === "all" && AREA.truth[k] ? css("--sw") : inTable[k] ? css("--cool-soft") : css("--well");
    VIZ.map($("#plMap"), k => k, { color, deposits: show === "all" ? "all" : "known" });
    const P = cnt(D.y), U = D.y.length - P, hidden = D.cells.filter((k, i) => !D.y[i] && AREA.truth[k]).length, unknownDeps = AREA.DEP.filter(d => !d.known).length;
    $("#plRead").innerHTML = `<div><span>Positivos (celdas)</span><b style="color:var(--lw)">${P}</b></div><div><span>No etiquetadas</span><b style="color:var(--cool)">${fmtN(U)}</b></div><div><span>% positivos</span><b>${fmt(100 * P / (P + U), 1)} %</b></div>`
      + (show === "all" ? `<div><span>Laterita escondida entre las no etiquetadas</span><b style="color:var(--sw)">${hidden} celdas</b></div>` : "");
    $("#plNote").textContent = show === "all"
      ? `Verdad sintética: ${AREA.DEP.length} depósitos, de los cuales ${unknownDeps} no se han descubierto (contorno punteado, en amarillo). Tratarlos como negativos castiga al modelo justo por encontrarlos: por eso se habla de datos PU y se evalúa con métricas de ranking, no de exactitud.`
      : `Rojo: positivos. Azul claro: celdas no etiquetadas que entran a la tabla de modelado${buf ? `; gris: excluidas por estar a menos de ${fmt(buf, 2)} km de un positivo` : ""}. Rayado: mina, fuera de la tabla.`;
  }
  render(); return render;
});

/* leakage: keep the mine (and label the pit positive) vs mask it */
demo("p-leak", () => {
  const feats = ["ferric", "clay", "distUM", "slope", "mag", "ndvi"], cache = {};
  let mode = "mask"; chips($("#pkMode"), v => { mode = v; render(); });
  const fit = m => cache[m] || (cache[m] = (() => {
    const D = AREA.data({ feats, mask: m === "mask", minePositive: m === "leak", unlabeled: 1500, seed: 4 }), S = ML.standardize(D.X), mdl = ML.logistic(S.Z, D.y, { iters: 700, l2: 0.01 });
    const score = new Float64Array(AREA.N); for (let k = 0; k < AREA.N; k++) score[k] = mdl.predict(S.apply(AREA.row(k, feats)));
    return { mdl, score };
  })());
  function render() {
    const { mdl, score } = fit(mode), valid = mode === "mask" ? AREA.mine.map(v => !v) : null, cells = [...Array(AREA.N).keys()].filter(k => !valid || valid[k]);
    const top = new Set(cells.sort((a, b) => score[b] - score[a]).slice(0, Math.round(0.05 * cells.length)));
    VIZ.map($("#pkMap"), score, { valid, hi: top, mine: mode === "mask", deposits: "all" });
    VIZ.legend($("#pkLeg"), {});
    VIZ.bars($("#pkBars"), feats.map((f, j) => ({ label: AREA.F[f].es, v: mdl.b[j] })), { signed: true, labelW: 170 });
    const inMine = [...top].filter(k => AREA.mine[k]).length, lat = [...Array(AREA.N).keys()].filter(k => AREA.truth[k] && !AREA.mine[k]), got = lat.filter(k => top.has(k)).length;
    $("#pkRead").innerHTML = `<div><span>Del 5 % superior, en la mina</span><b class="${inMine ? "c-lw" : "c-ok"}">${fmt(100 * inMine / top.size, 0)} %</b></div><div><span>Laterita real (fuera de la mina) en ese 5 %</span><b class="${inMine ? "c-lw" : "c-ok"}">${fmt(100 * got / lat.length, 0)} %</b></div>`;
  }
  render(); return render;
});
