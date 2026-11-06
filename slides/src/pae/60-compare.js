/* ═════════ PAE-Minas · section 7: comparison of all models, maps, choice guide, workflow, summary ═════════ */

/* One shared experiment: spatial block CV (out-of-fold scores) and a fit on all data (maps), computed in small
   chunks so the page stays responsive. Results arrive model by model; slides re-render as they come in. */
const CM = (() => {
  const D = AREA.data({ unlabeled: 1200, seed: 3 }), X = D.X, y = D.y, valid = AREA.mine.map(v => !v);
  // folds: 3 km blocks; positives follow the block of their deposit's centroid, so a deposit is never split
  const nb = Math.ceil(AREA.NX * AREA.CELL / 3), blockOfXY = (x, y) => Math.floor((AREA.NY * AREA.CELL - y) / 3) * nb + Math.floor(x / 3);
  const blocks = [...new Set(D.cells.map(k => AREA.block(k, 3)))], r = rng(2);
  for (let i = blocks.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; }
  const foldOfBlock = new Map(blocks.map((b, i) => [b, i % 5]));
  const folds = D.cells.map((k, i) => { if (y[i] && AREA.dep[k] >= 0) { const d = AREA.DEP[AREA.dep[k]]; const b = blockOfXY(d.cx, d.cy); if (foldOfBlock.has(b)) return foldOfBlock.get(b); } return foldOfBlock.get(AREA.block(k, 3)); });
  // standardization fitted on the training rows only, inside each fit
  const std = fit => (Xtr, ytr) => { const S = ML.standardize(Xtr), m = fit(S.Z, ytr); return { predict: x => m.predict(S.apply(x)) }; };
  const svmFit = std((Z, yy) => { const r2 = rng(9), P = [], U = []; yy.forEach((v, i) => (v ? P : U).push(i)); for (let i = U.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [U[i], U[j]] = [U[j], U[i]]; }
    const idx = P.concat(U.slice(0, 300)); return ML.svm(idx.map(i => Z[i]), idx.map(i => yy[i]), { C: 1, gamma: 0.3, classWeight: "balanced" }); });
  const MODELS = [
    { key: "lr", name: "Regresión logística", tok: "--accent", fit: std((Z, yy) => ML.logistic(Z, yy, { iters: 400, l2: 0.01 })) },
    { key: "tree", name: "Árbol de decisión", tok: "--ok", dash: "4 3", fit: (A, b) => ML.tree(A, b, { maxDepth: 5, minLeaf: 3 }) },
    { key: "rf", name: "Random Forest", tok: "--ok", fit: (A, b) => ML.forest(A, b, { nTrees: 60, maxDepth: 8 }) },
    { key: "pu", name: "RF + PU bagging", tok: "--data", fit: (A, b) => ML.puBagging(A, b, { K: 10, ratio: 5 }) },
    { key: "xgb", name: "XGBoost (por nivel)", tok: "--sw", fit: (A, b) => ML.boost(A, b, { nRounds: 120, eta: 0.1, maxDepth: 3 }) },
    { key: "lgbm", name: "LightGBM (por hoja)", tok: "--mag", fit: (A, b) => ML.boost(A, b, { nRounds: 120, eta: 0.1, growth: "leaf", numLeaves: 8, maxDepth: 6 }) },
    { key: "svm", name: "SVM RBF", tok: "--arch", fit: svmFit },
    { key: "mlp", name: "Red neuronal (MLP)", tok: "--cool", fit: std((Z, yy) => ML.mlp(Z, yy, { hidden: 12, epochs: 120, classWeight: "balanced" })) },
    { key: "woe", name: "Pesos de evidencia", tok: "--muted", fit: (A, b) => ML.weightsOfEvidence(A, b, { thresholds: [1.5, 1.25, 0.1, 3, 120], above: [1, 1, 0, 0, 1] }) },
    { key: "oc", name: "SVM de una clase", tok: "--lw", fit: std((Z, yy) => ML.oneClassSVM(Z.filter((_, i) => yy[i]), { nu: 0.2, gamma: 0.3 })) }];
  const res = {}, listeners = [];
  const undiscovered = new Uint8Array(AREA.N); AREA.DEP.forEach(d => { if (!d.known) d.cells.forEach(k => undiscovered[k] = 1); });
  const pct = score => { const cells = [...Array(AREA.N).keys()].filter(k => valid[k]).sort((a, b) => score[a] - score[b]), out = new Float64Array(AREA.N); cells.forEach((k, i) => out[k] = i / (cells.length - 1)); return out; };
  // the work list: for each model, 5 folds then the full fit
  const jobs = []; MODELS.forEach(M => { for (let f = 0; f < 5; f++) jobs.push([M, f]); jobs.push([M, "all"]); });
  let started = false, done = 0;
  function start() {
    if (started) return; started = true;
    const step = () => {
      if (!jobs.length) return;
      const [M, f] = jobs.shift(), R = res[M.key] || (res[M.key] = { oof: Array(y.length).fill(NaN) });
      if (f === "all") {
        const m = M.fit(X, y), score = new Float64Array(AREA.N);
        for (let k = 0; k < AREA.N; k++) score[k] = valid[k] ? m.predict(AREA.row(k, D.feats)) : 0;
        R.score = score; R.rank = pct(score); R.curve = ML.successRate(score, undiscovered, valid); R.cap10 = ML.capture(R.curve, 0.1); R.cap5 = ML.capture(R.curve, 0.05);
        const ok = R.oof.map((v, i) => [v, y[i]]).filter(a => !isNaN(a[0]));
        R.pr = ML.prAuc(ok.map(a => a[0]), ok.map(a => a[1])); R.roc = ML.auc(ok.map(a => a[0]), ok.map(a => a[1])); R.done = true;
      } else {
        const tr = [], te = []; folds.forEach((v, i) => (v === f ? te : tr).push(i));
        if (te.length && tr.some(i => y[i])) { const m = M.fit(tr.map(i => X[i]), tr.map(i => y[i])); te.forEach(i => R.oof[i] = m.predict(X[i])); }
      }
      done++; listeners.forEach(fn => fn());
      setTimeout(step, 0);
    };
    setTimeout(step, 30);
  }
  return { D, MODELS, res, start, onUpdate: fn => listeners.push(fn), progress: () => done / (MODELS.length * 6), valid, undiscovered };
})();

demo("s-comparacion", slide => {
  let sortBy = "pr"; chips($("#cmSort"), v => { sortBy = v; render(); });
  function render() {
    const rows = CM.MODELS.filter(M => CM.res[M.key] && CM.res[M.key].done).map(M => ({ M, R: CM.res[M.key] })), key = { pr: "pr", roc: "roc", cap: "cap10" }[sortBy];
    rows.sort((a, b) => b.R[key] - a.R[key]);
    const p = CM.progress();
    $("#cmProg").textContent = p < 1 ? `Entrenando… ${fmtN(100 * p)} % (${rows.length} de ${CM.MODELS.length} modelos listos). Todo corre en tu navegador.` : `Listo: ${CM.MODELS.length} modelos × 5 particiones + un ajuste completo cada uno, en tu navegador.`;
    const best = k => Math.max(...rows.map(r => r.R[k]));
    $("#cmTable").innerHTML = `<table class="tb" style="font-size:13px"><thead><tr><th>Modelo</th><th style="text-align:right">PR-AUC</th><th style="text-align:right">ROC-AUC</th><th style="text-align:right">Captura 10 %</th></tr></thead><tbody>`
      + rows.map(({ M, R }) => `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(${M.tok});margin-right:6px"></span>${M.name}</td>`
        + ["pr", "roc", "cap10"].map(k => `<td class="n"${R[k] === best(k) ? ' style="font-weight:700;color:var(--ok)"' : ""}>${k === "cap10" ? fmtN(100 * R[k]) + " %" : fmt(R[k], 3)}</td>`).join("") + `</tr>`).join("")
      + (rows.length < CM.MODELS.length ? `<tr><td colspan="4" class="mut">… ${CM.MODELS.length - rows.length} modelos en cola</td></tr>` : "") + `</tbody></table>`;
    const byPr = rows.slice().sort((a, b) => b.R.pr - a.R.pr), trees = ["rf", "pu", "xgb", "lgbm"].map(k => CM.res[k]).filter(R => R && R.done);
    $("#cmFind").innerHTML = p < 1 ? "" : `<b>Lo que muestra esta tabla.</b> Con solo 7 depósitos conocidos y cada uno evaluado fuera del entrenamiento, gana <b>${byPr[0].M.name}</b> (PR-AUC ${fmt(byPr[0].R.pr, 2)}); los ensambles de árboles quedan cerca de ${fmt(mean(trees.map(R => R.pr)), 2)}: aprenden detalles de cada depósito que no se transfieren. Con más depósitos suelen pasar adelante. El ROC-AUC, en cambio, apenas los distingue (${fmt(Math.min(...rows.map(r => r.R.roc)), 2)}–${fmt(Math.max(...rows.map(r => r.R.roc)), 2)}).`;
  }
  CM.onUpdate(() => { if (slide.classList.contains("on")) render(); });
  CM.start(); render(); return render;
});

demo("cm-maps", slide => {
  const show = new Set(["lr", "rf", "xgb", "woe"]);
  $("#cmPick").innerHTML = CM.MODELS.map(M => `<button class="chip" data-v="${M.key}" aria-pressed="${show.has(M.key)}" style="border-color:var(${M.tok})">${M.name}</button>`).join("");
  $$("#cmPick button").forEach(b => b.addEventListener("click", () => { const k = b.dataset.v; show.has(k) ? show.delete(k) : show.add(k); b.setAttribute("aria-pressed", show.has(k)); render(); }));
  const MAPS = ["lr", "tree", "rf", "pu", "xgb", "lgbm", "svm", "mlp", "woe"];
  function render() {
    const grid = $("#cmGrid"); grid.innerHTML = "";
    MAPS.forEach(key => { const M = CM.MODELS.find(m => m.key === key), R = CM.res[key], cell = document.createElement("div");
      cell.innerHTML = `<div></div><p class="note" style="margin:2px 0 0;font-size:11.5px;color:var(${M.tok})">${M.name}</p>`; grid.appendChild(cell);
      if (R && R.done) VIZ.map(cell.firstChild, R.rank, { valid: CM.valid, deposits: "all", scale: 3, river: false, color: v => VIZ.prob((v - 0.8) / 0.2) });
      else cell.firstChild.innerHTML = `<div style="aspect-ratio:3/2;background:var(--well);border-radius:8px;display:grid;place-items:center;font-size:11px;color:var(--muted)">entrenando…</div>`; });
    const ready = CM.MODELS.filter(M => show.has(M.key) && CM.res[M.key] && CM.res[M.key].done);
    VIZ.curves($("#cmCurve"), ready.map(M => ({ pts: CM.res[M.key].curve, col: M.tok, label: M.name, dash: M.dash })), { xr: [0, 0.3], xt: [0, 0.05, 0.1, 0.2, 0.3], xf: v => fmtN(100 * v) + " %", yf: v => fmtN(100 * v) + " %", xl: "área señalada", yl: "laterita no descubierta capturada", marks: [[0.1, "10 %", "--muted"]], H: 220 });
    $("#cmRead").innerHTML = ready.map(M => `<div><span>${M.name}: 5 % · 10 %</span><b style="color:var(${M.tok});font-size:18px">${fmtN(100 * CM.res[M.key].cap5)} · ${fmtN(100 * CM.res[M.key].cap10)} %</b></div>`).join("");
    const all = MAPS.map(k => CM.res[k]).filter(R => R && R.done);
    if (all.length >= 2) {
      const cons = new Float64Array(AREA.N); for (let k = 0; k < AREA.N; k++) cons[k] = all.filter(R => R.rank[k] >= 0.9).length / all.length;
      VIZ.map($("#cmCons"), cons, { valid: CM.valid, deposits: "all", river: false });
      const full = [...Array(AREA.N).keys()].filter(k => cons[k] === 1).length, split = [...Array(AREA.N).keys()].filter(k => cons[k] > 0 && cons[k] < 0.5).length;
      $("#cmConsNote").textContent = `${full} celdas están en el 10 % superior de los ${all.length} modelos: objetivos firmes. ${split} celdas solo aparecen en menos de la mitad: allí la decisión depende del modelo, buenas candidatas para verificar en campo.`;
    }
  }
  CM.onUpdate(() => { if (slide.classList.contains("on")) render(); });
  CM.start(); render(); return render;
});

/* which model when: the pipeline's table, with this area's numbers, highlighted by need */
demo("cm-guide", () => {
  const G = [
    ["Regresión logística (L1/L2)", "Línea base", "Interpretable (e^β), estable con pocos positivos, rápida.", "Frontera lineal: no ve interacciones.", ["base", "few"], "lr"],
    ["Pesos de evidencia / naive Bayes", "Línea base clásica en prospectividad", "Muy transparente: W+, W−, contraste por capa.", "Supone independencia condicional entre capas.", ["base", "few"], "woe"],
    ["Random Forest", "Principal", "Interacciones, robusto, pesos de clase, PU bagging.", "Mapas en bloques; importancia sesgada con variables correlacionadas.", ["best", "few", "pu"], "rf"],
    ["XGBoost / LightGBM", "Principal", "Suele dar el mejor ranking tabular.", "Más hiperparámetros; sobreajusta si no se frena (parada temprana espacial).", ["best"], "xgb"],
    ["SVM RBF / SVM de una clase", "Alternativa", "Fronteras suaves; la versión de una clase usa solo positivos.", "Hay que estandarizar; costosa con muchas celdas; puntajes sin calibrar.", ["pu"], "svm"],
    ["MaxEnt", "Solo presencias", "Pensado para presencia y fondo (de la ecología): encaja con PU.", "Supuestos de muestreo de las presencias.", ["pu", "few"], null],
    ["Red neuronal (MLP / CNN)", "Enseñanza y contexto espacial", "La CNN ve textura y forma del relieve en parches.", "Con pocos positivos necesita aumento de datos o preentrenamiento.", ["ctx"], "mlp"]];
  const NOTE = { base: "Empieza siempre por una línea base simple e interpretable: si un modelo complejo no la supera con validación espacial, no vale su complejidad.",
    best: "En datos tabulares con suficientes depósitos, los ensambles de árboles (Random Forest, XGBoost, LightGBM) suelen dar el mejor ranking. Aquí, con solo 7 depósitos y validación estricta, la regresión logística los supera: compruébalo siempre con validación espacial.",
    pu: "Sin negativos confiables: PU bagging (con árboles), SVM de una clase o MaxEnt. Evalúa con curvas de captura, no con exactitud.",
    few: "Con menos de ~30 depósitos: pocas variables (≲ 15–20), regularización, árboles poco profundos, y validación dejando un depósito fuera.",
    ctx: "Si la textura o la forma del terreno importan, una CNN pequeña sobre parches de Sentinel-2 + DEM puede ayudar, pero con pocos positivos necesita aumento de datos o un modelo preentrenado." };
  let need = "base"; chips($("#cmNeed"), v => { need = v; render(); });
  function render() {
    $("#cmGuide").innerHTML = `<table class="tb" style="font-size:13px"><thead><tr><th>Modelo</th><th>Papel</th><th>A favor</th><th>En contra</th><th style="text-align:right">PR-AUC aquí</th></tr></thead><tbody>`
      + G.map(([m, role, pro, con, tags, key]) => { const on = tags.includes(need), R = key && CM.res[key];
        return `<tr style="${on ? "background:var(--ok-soft)" : "opacity:.55"}"><td><b>${m}</b></td><td>${role}</td><td>${pro}</td><td>${con}</td><td class="n">${R && R.done ? fmt(R.pr, 3) : key ? "…" : "—"}</td></tr>`; }).join("") + `</tbody></table>`;
    $("#cmGuideNote").textContent = NOTE[need];
  }
  CM.onUpdate(() => render());
  render(); return render;
});

/* the student workflow from the pipeline, step by step, with links into the deck */
demo("cm-flujo", () => {
  const S = [
    ["Etiquetas y área de estudio", "Cinturón ultramáfico alrededor de Cerro Matoso. Positivos: ocurrencias conocidas, zonas de mena perforadas y laterita cartografiada (SGC, geología publicada), como polígonos de la huella previa a la minería. Decide y documenta qué son tus negativos (confiables o fondo no etiquetado) y usa una zona de exclusión de 1–2 km.", "p-labels"],
    ["Compuestos de Sentinel-2 en Google Earth Engine", "L2A, máscara de nubes (s2cloudless o Cloud Score+), varios años. Mediana de época seca (dic–mar), percentiles p10/p50/p90; cocientes B4/B2, B11/B12, B11/B8A, NDVI, índice de suelo desnudo y fracción de observaciones despejadas; opcional: armónicos del NDVI.", "p-s2"],
    ["Capas estáticas en una grilla común", "Distancia a contactos ultramáficos y a fallas, litología, DEM Copernicus 30 m (pendiente, curvatura, TPI, TWI), magnetometría y radiometría si existen, geoquímica de sedimentos. Enmascara mina, relaves, planta y vías.", "s-problema"],
    ["Línea base: regresión logística + validación espacial", "Variables estandarizadas, regularización, pesos de clase; validación por bloques mayores que el alcance de la autocorrelación (variograma, 2–10 km) o dejando un depósito fuera.", "s-logistica"],
    ["Random Forest y LightGBM con PU bagging", "K bolsas: todos los positivos + una muestra no etiquetada (5–10×); pesos de clase o scale_pos_weight; árboles poco profundos; sin SMOTE en datos espaciales.", "s-bosques"],
    ["Comparar: curvas de captura, SHAP, incertidumbre", "Curva de tasa de éxito y de predicción, PR-AUC, captura en el 5–10 % superior; mapa de incertidumbre (desviación entre bolsas); SHAP para los motores; contrastar con la geología conocida.", "s-comparacion"],
    ["Objetivos para campo", "Zonas del decil superior, sobre todo donde los modelos coinciden y hay poca incertidumbre; verificación en campo y retroalimentación de las etiquetas.", "cm-maps"]];
  let sel = 0;
  function render() {
    $("#cmSteps").innerHTML = S.map((s, i) => `<button class="pick" type="button" data-i="${i}" aria-pressed="${i === sel}"><b><span class="opnum">${i + 1}</span>${s[0]}</b></button>`).join("");
    $$("#cmSteps .pick").forEach(b => b.addEventListener("click", () => { sel = +b.dataset.i; render(); }));
    $("#cmStepT").textContent = `${sel + 1} · ${S[sel][0]}`;
    $("#cmStepD").innerHTML = `<p style="margin:0">${S[sel][1]}</p>`;
    $("#cmStepGo").innerHTML = `<button class="btn" type="button" data-go="${S[sel][2]}">Ver en la presentación →</button>`;
  }
  render(); return render;
});

demo("cm-resumen", () => {
  VIZ.quiz($("#cmQuiz"), [
    { q: "Un modelo da 98 % de exactitud prediciendo «no hay laterita» en todas las celdas. ¿Qué concluyes?", opts: ["Es un buen modelo", "No sirve: con ~2 % de positivos esa exactitud es gratis", "Hay que bajar el umbral a 0,98"], right: 1, why: "Con desbalance, la exactitud premia ignorar la clase rara. Mira PR-AUC y la captura de depósitos." },
    { q: "Un mismo modelo da PR-AUC 0,79 con validación aleatoria y 0,60 con validación por bloques espaciales. ¿Cuál reportas?", opts: ["0,79, es más alta", "0,60: la aleatoria tiene vecinas del entrenamiento en la prueba", "El promedio"], right: 1, why: "Con autocorrelación espacial, las celdas vecinas se parecen: la partición aleatoria mide memoria, no generalización." }]);
});
