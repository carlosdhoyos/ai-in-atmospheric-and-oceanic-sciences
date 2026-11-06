# PAE-Minas deck: brief for section authors

A standalone interactive HTML deck for the course PAE-Minas: machine learning for Ni-laterite prospectivity around
Cerro Matoso (Córdoba, Colombia), on a **synthetic** study area. Same look and level of interactivity as the
neural-network modules in this repo (see `slides/src/m0`, `slides/src/m2` for examples of slides and demos).

Source documents (read them): the lesson spec
`/root/.claude/uploads/bb5f4182-3098-593c-af4e-854b0c8c52db/957c2769-Spec___Interactive_Multiple_Logistic_Regression_Lesson_Ni-Laterite_Prospecting_1.md`
and the ML pipeline
`/root/.claude/uploads/bb5f4182-3098-593c-af4e-854b0c8c52db/eeb55eab-Cerro_Matoso_Ni-Laterite_Prospectivity___ML_Pipeline_1.md`.

## Files and build

- Write **only** your own `slides/src/pae/NN-name.html` and `slides/src/pae/NN-name.js`. Do not edit anything else
  (not `lib/`, not `00-intro.*`, not `common/`, not the build). If you find a bug or a missing feature in `lib/`,
  work around it inside your own file and report it in your final message.
- Build only your section (plus the intro): `ONLY=NN-name python3 slides/build_pae.py` → `slides/pae-minas/index.html`.
  Copy that file into your own scratch directory before checking (other authors rebuild the same file).
- Check: `node slides/tools/check_deck.js <copy.html> <outdir> <slide ids…>` → JS errors, horizontal overflow,
  empty hosts, duplicate ids, and screenshots (1280 px light) of the listed slides. Look at every screenshot and fix
  overlaps, clipped labels, unreadable text. Also click through your controls with a small Playwright script
  (Chromium is preinstalled; `require('playwright')` works) and check dark mode (`colorScheme: 'dark'`).
- A slide should fit 1280 × 820 with little or no zoom (`fitSlide` shrinks tall slides down to 0.7; avoid needing it).

## Conventions

- **Language:** Spanish on screen; key terms also in English in `<span class="en">(…)</span>`. Decimal comma is
  automatic for `fmt`/`fmtN` (es-CO). Write numbers in text as 13,5 not 13.5.
- **Slide markup:** `<section class="slide" id="…" data-g="a" data-sec="N · Sección · tema">`. Your first slide is
  the section opener with the fixed id given below and kicker `N · Título`. Use `.two` (left text/controls, right
  `.panel` figure), `.chips`, `.ctl` sliders, `.readout`, `.calc`, `.callout`, `.note`, `ul.pts`.
- **Every interactive element gets a one-line `<p class="tryit">…</p>`** (CSS adds "Prueba esto ·").
- **Ids:** prefix every element id with your prefix (below). Slide ids too (except the fixed section opener).
- **Demos:** `demo(slideId, slide => { …; render(); return render; })`. `render` must redraw everything from state
  (it is called again on theme change). Heavy training: do it lazily inside the demo (first show) and cache results;
  keep any single interaction under ~1,5 s. Animations: `setInterval`, and stop when `!slide.classList.contains("on")`.
- **Colours:** css tokens only (`css("--lw")` etc.). Positives warm (`--lw`), unlabeled/negatives cool (`--cool`),
  probability always `VIZ.prob` (viridis). Model colours used across sections: logistic `--accent`, tree/forest
  `--ok`, XGBoost `--sw`, LightGBM `--mag`, SVM `--arch`, MLP `--cool`, weights of evidence `--muted`.
- Helpers available globally: `$ $$ fmt fmtN clamp css el svgIn press chips slider relu sigm softmax mean sd rng gauss
  lin axes path` (common/core.js), `arrowDefs heat div gridSVG solve` (common/helpers.js).
- Honesty: data are synthetic; say so where results could be mistaken for real ones. Don't claim more than the toy
  shows. Where the toy simplifies (e.g. our "XGBoost" is a from-scratch second-order boosting, not the library), say it.

## Shared library (read `slides/src/pae/lib/*.js` before writing)

- `AREA` (area.js): 90 × 60 cells of 150 m (13,5 × 9 km). Layers `AREA.L.{lith, elev, slope, distUM, mag, ndvi,
  ferric, clay}`; `truth` (real laterite, 3,3 %), `DEP` (11 deposits, 7 known), `known` (positive labels, 100 cells,
  1,9 % of the table), `mine` (mask), `redSoil` (ferruginous soils on sediments: B4/B2 false positives).
  `AREA.data({feats, mask, minePositive, buffer, unlabeled, seed})` → `{X, y, cells, group, feats}` (y = 1 known
  positive, 0 unlabeled). `AREA.row(k, feats)`, `AREA.block(k, sizeKm)`, `AREA.FEATS` / `AREA.F[key]` (Spanish/English
  names, unit, decimals). Default features: `["ferric","clay","distUM","slope","mag"]`.
- `ML` (ml.js): `standardize`, `logistic` / `logisticInit` / `logisticStep` (L1 proximal, L2, class weights),
  `tree` (CART, importance), `forest` (OOB, importance, votes), `puBagging`, `boost` (2nd-order trees on histogram bins;
  `growth:'depth'` XGBoost-like, `'leaf'` LightGBM-like; `eta, maxDepth, numLeaves, lambda, gamma, minChildWeight,
  nBins, subsample, colsample, scalePosWeight, evalX/evalY` → `trainLoss`, `evalLoss`, `predict(x, upto)`),
  `svm` (SMO, linear/RBF, class-weighted C; `sv`, `onMargin`, `decision`), `oneClassSVM`, `mlp`, `weightsOfEvidence`;
  metrics `logloss confusion prCurve rocCurve auc prAuc successRate capture depositsHit`; splits `randomFolds
  blockFolds crossVal`. Rough timings on the 1 300-row table (100 positives + 1 200 unlabeled): logistic 0,6 s (800
  iterations), tree 20 ms, forest(60) 0,3 s, boost(120) 0,3 s, SVM on 400 rows 0,6 s, MLP 0,6 s.
- `VIZ` (viz.js): `map(host, values, {color, valid, deposits, mine, river, hi, points})` (canvas map; returns
  `{canvas, cellAt}`), `legend`, `scatter(host, pts, {xr, yr, bg, thr, onHover})` (2-D scatter with probability
  background and threshold contour), `curves`, `bars`, `quiz(host, [{q, opts, right, why}])`, `prob`, `lith`, `layerColor`.
- Reference results on this area (whole-map AUC / PR-AUC vs the synthetic truth, 5 features, 1 200 unlabeled):
  logistic 0,98 / 0,67 · tree d5 0,96 / 0,54 · forest 0,99 / 0,77 · PU-bagging forest 0,99 / 0,75 · boost 0,99 / 0,72 ·
  SVM-RBF 0,98 / 0,46 · one-class SVM 0,95 / 0,34 · MLP 0,98 / 0,70 · weights of evidence 0,94 / 0,51.
  Random vs spatial-block CV (forest): PR-AUC 0,79 vs 0,60 (random split is optimistic).

## Sections (number · opener id · file · prefix)

1. Problema · `s-problema` · `00-intro` · `p` (done)
2. Regresión logística · `s-logistica` · `10-logistic` · `lr`
3. Validación y mapas · `s-validacion` · `20-validation` · `va`
4. Árboles y bosques · `s-bosques` · `30-forest` · `rf`
5. Boosting · `s-boosting` · `40-boost` · `bo`
6. SVM y otros · `s-svm` · `50-svm` · `sv`
7. Comparación · `s-comparacion` · `60-compare` · `cm` (done by the lead)
