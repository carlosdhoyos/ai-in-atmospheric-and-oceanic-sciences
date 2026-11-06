/* ═════════ PAE-Minas · a small machine-learning library, written for clarity rather than speed ═════════
   Everything works on plain arrays: X = array of rows (arrays of numbers), y = array of 0/1, w = optional sample weights.
   Models return objects with a predict(x) → probability (or score) for one row.

   ML.standardize(X)                       → { Z, mu, sd, apply(x) }
   ML.logistic(X, y, opts)                 → logistic regression by gradient descent; L1 (proximal) or L2; class weights
   ML.logisticInit(d) / ML.logisticStep(m, X, y, opts)   one step at a time, for animations
   ML.tree(X, y, opts)                     → CART classification tree (Gini), with feature importance
   ML.forest(X, y, opts)                   → Random Forest: bootstrap + random feature subsets; OOB score; importance
   ML.puBagging(X, y, opts)                → PU bagging: many models, each on all positives + a fresh unlabeled sample
                                              (model "logistic" expects standardized X)
   ML.boost(X, y, opts)                    → gradient boosting on log-loss with 2nd-order trees (XGBoost-style),
                                              histogram splits; growth 'depth' (XGBoost) or 'leaf' (LightGBM)
   ML.svm(X, y, opts)                      → soft-margin SVM by SMO, linear or RBF kernel, class-weighted C
   ML.oneClassSVM(X, opts)                 → ν one-class SVM with an RBF kernel (positives only)
   ML.mlp(X, y, opts)                      → one hidden layer, ReLU, sigmoid output, Adam, dropout, weight decay
   ML.weightsOfEvidence(X, y, opts)        → classic mineral-prospectivity baseline on binarized evidence layers
   Metrics: ML.logloss, ML.confusion, ML.prCurve, ML.rocCurve, ML.auc, ML.prAuc, ML.successRate, ML.capture
   Validation: ML.groupFolds, ML.blockFolds, ML.crossVal                                                        */
const ML = (() => {
  const sig = z => 1 / (1 + Math.exp(-clamp(z, -35, 35)));
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const classWeights = (y, mode) => {          // 'balanced' → n / (2 n_c); a number → weight of positives; otherwise 1
    if (mode === "balanced") { const n1 = y.reduce((a, b) => a + b, 0), n0 = y.length - n1; return y.map(v => v ? y.length / (2 * n1) : y.length / (2 * n0)); }
    if (typeof mode === "number") return y.map(v => v ? mode : 1);
    return y.map(() => 1);
  };
  function standardize(X) {
    const d = X[0].length, n = X.length, mu = Array(d).fill(0), sd = Array(d).fill(0);
    X.forEach(x => x.forEach((v, j) => mu[j] += v / n)); X.forEach(x => x.forEach((v, j) => sd[j] += (v - mu[j]) ** 2 / n));
    for (let j = 0; j < d; j++) sd[j] = Math.sqrt(sd[j]) || 1;
    const apply = x => x.map((v, j) => (v - mu[j]) / sd[j]);
    return { Z: X.map(apply), mu, sd, apply };
  }

  /* ───────── logistic regression ───────── */
  const logisticInit = d => ({ b0: 0, b: Array(d).fill(0), hist: [] });
  // one full-batch step; opts: lr, l1, l2 (penalties on b, not b0), weights (array) — returns the weighted log-loss before the step
  function logisticStep(m, X, y, { lr = 0.1, l1 = 0, l2 = 0, weights = null } = {}) {
    const n = X.length, d = m.b.length, g = Array(d).fill(0); let g0 = 0, L = 0, W = 0;
    for (let i = 0; i < n; i++) {
      const w = weights ? weights[i] : 1, p = sig(m.b0 + dot(m.b, X[i])), e = (p - y[i]) * w;
      g0 += e; for (let j = 0; j < d; j++) g[j] += e * X[i][j];
      L -= w * (y[i] ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12))); W += w;
    }
    m.b0 -= lr * g0 / W;
    for (let j = 0; j < d; j++) {
      let v = m.b[j] - lr * (g[j] / W + l2 * m.b[j]);
      if (l1) v = Math.sign(v) * Math.max(0, Math.abs(v) - lr * l1);          // proximal step: exact zeros
      m.b[j] = v;
    }
    const pen = l1 * m.b.reduce((a, v) => a + Math.abs(v), 0) + 0.5 * l2 * m.b.reduce((a, v) => a + v * v, 0);
    m.hist.push(L / W + pen);
    return L / W + pen;
  }
  function logistic(X, y, { lr = 0.3, iters = 600, l1 = 0, l2 = 0, classWeight = null, tol = 1e-7 } = {}) {
    const m = logisticInit(X[0].length), weights = classWeight ? classWeights(y, classWeight) : null;
    for (let t = 0; t < iters; t++) { const L = logisticStep(m, X, y, { lr, l1, l2, weights }); if (t > 10 && Math.abs(m.hist[t - 1] - L) < tol) break; }
    m.z = x => m.b0 + dot(m.b, x); m.predict = x => sig(m.z(x));
    return m;
  }

  /* ───────── CART classification tree (Gini), optional sample weights and random feature subsets ───────── */
  function tree(X, y, { maxDepth = 6, minLeaf = 2, mtry = null, weights = null, idx = null, rng: rr = rng(1) } = {}) {
    const d = X[0].length, W = weights || y.map(() => 1), imp = Array(d).fill(0);
    let nNodes = 0;
    const gini = (w1, w) => { if (w <= 0) return 0; const p = w1 / w; return 2 * p * (1 - p); };
    function grow(ids, depth) {
      let w = 0, w1 = 0; for (const i of ids) { w += W[i]; w1 += W[i] * y[i]; }
      const node = { p: w ? w1 / w : 0, n: ids.length, w, depth, id: nNodes++ };
      if (depth >= maxDepth || ids.length < 2 * minLeaf || w1 === 0 || w1 === w) return node;
      const feats = mtry && mtry < d ? shuffle([...Array(d).keys()], rr).slice(0, mtry) : [...Array(d).keys()];
      let best = null, parent = gini(w1, w) * w;
      for (const f of feats) {
        const s = ids.slice().sort((a, b) => X[a][f] - X[b][f]); let lw = 0, lw1 = 0;
        for (let k = 0; k < s.length - 1; k++) {
          lw += W[s[k]]; lw1 += W[s[k]] * y[s[k]];
          if (k + 1 < minLeaf || s.length - k - 1 < minLeaf || X[s[k]][f] === X[s[k + 1]][f]) continue;
          const g = parent - gini(lw1, lw) * lw - gini(w1 - lw1, w - lw) * (w - lw);
          if (!best || g > best.g) best = { g, f, t: (X[s[k]][f] + X[s[k + 1]][f]) / 2 };
        }
      }
      if (!best || best.g <= 1e-12) return node;
      imp[best.f] += best.g;
      const L = ids.filter(i => X[i][best.f] <= best.t), R = ids.filter(i => X[i][best.f] > best.t);
      return Object.assign(node, { f: best.f, t: best.t, gain: best.g, left: grow(L, depth + 1), right: grow(R, depth + 1) });
    }
    const root = grow(idx || [...X.keys()], 0);
    const leafOf = x => { let nd = root; while (nd.left) nd = x[nd.f] <= nd.t ? nd.left : nd.right; return nd; };
    const total = imp.reduce((a, b) => a + b, 0) || 1;
    return { root, nNodes, predict: x => leafOf(x).p, leafOf, importance: imp.map(v => v / total), rawImportance: imp };
  }

  /* ───────── Random Forest ───────── */
  function forest(X, y, { nTrees = 60, maxDepth = 8, minLeaf = 2, mtry = null, sampleFrac = 1, classWeight = null, seed = 1 } = {}) {
    const n = X.length, d = X[0].length, rr = rng(seed), W = classWeight ? classWeights(y, classWeight) : null;
    const m = mtry || Math.max(1, Math.round(Math.sqrt(d))), trees = [], oobSum = Array(n).fill(0), oobCnt = Array(n).fill(0), imp = Array(d).fill(0);
    for (let t = 0; t < nTrees; t++) {
      const inBag = new Uint8Array(n), idx = [];
      for (let k = 0; k < Math.round(sampleFrac * n); k++) { const i = Math.floor(rr() * n); idx.push(i); inBag[i] = 1; }
      const tr = tree(X, y, { maxDepth, minLeaf, mtry: m, weights: W, idx, rng: rr });
      trees.push(tr); tr.importance.forEach((v, j) => imp[j] += v / nTrees);
      for (let i = 0; i < n; i++) if (!inBag[i]) { oobSum[i] += tr.predict(X[i]); oobCnt[i]++; }
    }
    const predict = x => trees.reduce((s, t) => s + t.predict(x), 0) / trees.length;
    const oob = oobSum.map((s, i) => oobCnt[i] ? s / oobCnt[i] : NaN);
    return { trees, predict, votes: x => trees.map(t => t.predict(x)), oob, importance: imp };
  }

  /* ───────── PU bagging: each bag = all positives + a random unlabeled subset; average; spread = uncertainty ───────── */
  function puBagging(X, y, { K = 20, ratio = 5, model = "forest", opts = {}, seed = 1 } = {}) {
    const rr = rng(seed), P = [], U = []; y.forEach((v, i) => (v ? P : U).push(i));
    const models = [], oobSum = Array(X.length).fill(0), oobCnt = Array(X.length).fill(0);
    for (let k = 0; k < K; k++) {
      const pick = shuffle(U.slice(), rr).slice(0, Math.min(U.length, ratio * P.length)), inBag = new Set(pick), idx = P.concat(pick);
      const Xs = idx.map(i => X[i]), ys = idx.map(i => y[i]);
      const mdl = model === "forest" ? forest(Xs, ys, { nTrees: 25, maxDepth: 6, ...opts, seed: seed * 100 + k })
        : model === "logistic" ? logistic(Xs, ys, opts) : model === "boost" ? boost(Xs, ys, { nRounds: 60, ...opts, seed: seed * 100 + k }) : tree(Xs, ys, { maxDepth: 5, ...opts });
      models.push(mdl);
      for (const i of U) if (!inBag.has(i)) { oobSum[i] += mdl.predict(X[i]); oobCnt[i]++; }
    }
    const scores = x => models.map(m => m.predict(x));
    const predict = x => mean(scores(x));
    return { models, predict, spread: x => sd(scores(x)), scores, oob: oobSum.map((s, i) => oobCnt[i] ? s / oobCnt[i] : NaN) };
  }

  /* ───────── gradient boosting on log-loss, second-order trees on histogram bins ─────────
     growth 'depth' grows level by level up to maxDepth (XGBoost default); 'leaf' always splits the leaf with the
     largest gain until numLeaves (LightGBM default). Records train / eval log-loss per round. */
  function boost(X, y, { nRounds = 100, eta = 0.1, maxDepth = 3, numLeaves = 8, growth = "depth", lambda = 1, gamma = 0, minChildWeight = 1,
    nBins = 32, subsample = 1, colsample = 1, scalePosWeight = 1, seed = 1, evalX = null, evalY = null } = {}) {
    const n = X.length, d = X[0].length, rr = rng(seed), W = y.map(v => v ? scalePosWeight : 1);
    // histogram bins: quantile edges per feature, each value replaced by its bin index
    const edges = [], B = X.map(() => new Uint8Array(d));
    for (let j = 0; j < d; j++) {
      const v = X.map(x => x[j]).sort((a, b) => a - b), e = [];
      for (let q = 1; q < nBins; q++) { const t = v[Math.floor(q * n / nBins)]; if (!e.length || t > e[e.length - 1]) e.push(t); }
      edges.push(e); for (let i = 0; i < n; i++) { let b = 0; while (b < e.length && X[i][j] > e[b]) b++; B[i][j] = b; }
    }
    const binOf = (x, j) => { const e = edges[j]; let b = 0; while (b < e.length && x[j] > e[b]) b++; return b; };
    const p0 = clamp(y.reduce((a, v, i) => a + W[i] * v, 0) / W.reduce((a, b) => a + b, 0), 1e-4, 1 - 1e-4), base = Math.log(p0 / (1 - p0));
    const F = Array(n).fill(base), trees = [], trainLoss = [], evalLoss = [], imp = Array(d).fill(0);
    let Fe = evalX ? evalX.map(() => base) : null;
    const ll = (Fv, yy, ww) => { let s = 0, t = 0; for (let i = 0; i < Fv.length; i++) { const p = sig(Fv[i]), w = ww ? ww[i] : 1; s -= w * (yy[i] ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12))); t += w; } return s / t; };
    const leafVal = (G, H) => -G / (H + lambda), score = (G, H) => G * G / (H + lambda);
    for (let r = 0; r < nRounds; r++) {
      const g = Array(n), h = Array(n);
      for (let i = 0; i < n; i++) { const p = sig(F[i]); g[i] = W[i] * (p - y[i]); h[i] = W[i] * Math.max(p * (1 - p), 1e-6); }
      const rows = subsample < 1 ? [...Array(n).keys()].filter(() => rr() < subsample) : [...Array(n).keys()];
      const cols = colsample < 1 ? shuffle([...Array(d).keys()], rr).slice(0, Math.max(1, Math.round(colsample * d))) : [...Array(d).keys()];
      // best split of a set of rows using the histograms
      const bestSplit = ids => {
        let G = 0, H = 0; for (const i of ids) { G += g[i]; H += h[i]; }
        let best = null;
        for (const j of cols) {
          const nb = edges[j].length + 1, hg = new Float64Array(nb), hh = new Float64Array(nb);
          for (const i of ids) { hg[B[i][j]] += g[i]; hh[B[i][j]] += h[i]; }
          let GL = 0, HL = 0;
          for (let b = 0; b < nb - 1; b++) {
            GL += hg[b]; HL += hh[b]; const GR = G - GL, HR = H - HL;
            if (HL < minChildWeight || HR < minChildWeight) continue;
            const gain = 0.5 * (score(GL, HL) + score(GR, HR) - score(G, H)) - gamma;
            if (gain > 0 && (!best || gain > best.gain)) best = { gain, f: j, bin: b, t: edges[j][b] };
          }
        }
        return { G, H, best };
      };
      const root = { ids: rows, depth: 0 }, leaves = [root];
      Object.assign(root, bestSplit(rows));
      const splitNode = nd => {
        const L = nd.ids.filter(i => B[i][nd.best.f] <= nd.best.bin), R = nd.ids.filter(i => B[i][nd.best.f] > nd.best.bin);
        Object.assign(nd, { f: nd.best.f, bin: nd.best.bin, t: nd.best.t, gain: nd.best.gain });
        imp[nd.f] += nd.gain;
        nd.left = { ids: L, depth: nd.depth + 1, ...bestSplit(L) }; nd.right = { ids: R, depth: nd.depth + 1, ...bestSplit(R) };
        leaves.splice(leaves.indexOf(nd), 1, nd.left, nd.right);
      };
      if (growth === "leaf") {
        while (leaves.length < numLeaves) {
          const cand = leaves.filter(l => l.best && l.depth < maxDepth); if (!cand.length) break;
          splitNode(cand.reduce((a, b) => b.best.gain > a.best.gain ? b : a));
        }
      } else {
        for (let dep = 0; dep < maxDepth; dep++) leaves.filter(l => l.depth === dep && l.best).forEach(splitNode);
      }
      leaves.forEach(l => { l.v = eta * leafVal(l.G, l.H); delete l.ids; });
      const walk = (nd, x) => { while (nd.left) nd = x[nd.f] <= nd.t ? nd.left : nd.right; return nd.v; };
      const tr = { root, leaves: leaves.length, value: x => walk(root, x) };
      trees.push(tr);
      for (let i = 0; i < n; i++) F[i] += tr.value(X[i]);
      trainLoss.push(ll(F, y));
      if (evalX) { for (let i = 0; i < evalX.length; i++) Fe[i] += tr.value(evalX[i]); evalLoss.push(ll(Fe, evalY)); }
    }
    const total = imp.reduce((a, b) => a + b, 0) || 1;
    const margin = (x, upto = trees.length) => { let s = base; for (let t = 0; t < upto; t++) s += trees[t].value(x); return s; };
    return { trees, base, edges, binOf, predict: (x, upto) => sig(margin(x, upto)), margin, trainLoss, evalLoss, importance: imp.map(v => v / total) };
  }

  /* ───────── SVM by SMO (Platt), linear or RBF kernel; class weights scale C per class ───────── */
  function svm(X, y, { C = 1, kernel = "rbf", gamma = 0.5, classWeight = null, tol = 1e-3, maxPasses = 8, maxIter = 4000, seed = 1 } = {}) {
    const n = X.length, t = y.map(v => v ? 1 : -1), rr = rng(seed), Cw = (classWeight ? classWeights(y, classWeight) : y.map(() => 1)).map(w => w * C);
    const K = kernel === "linear" ? (a, b) => dot(a, b) : (a, b) => { let s = 0; for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2; return Math.exp(-gamma * s); };
    const KM = Array.from({ length: n }, (_, i) => new Float64Array(n)); for (let i = 0; i < n; i++) for (let j = i; j < n; j++) KM[i][j] = KM[j][i] = K(X[i], X[j]);
    const a = new Float64Array(n); let b = 0, passes = 0, it = 0;
    const f = i => { let s = b; for (let k = 0; k < n; k++) if (a[k]) s += a[k] * t[k] * KM[k][i]; return s; };
    while (passes < maxPasses && it < maxIter) {
      let changed = 0;
      for (let i = 0; i < n; i++) {
        const Ei = f(i) - t[i];
        if ((t[i] * Ei < -tol && a[i] < Cw[i]) || (t[i] * Ei > tol && a[i] > 0)) {
          let j = Math.floor(rr() * (n - 1)); if (j >= i) j++;
          const Ej = f(j) - t[j], ai = a[i], aj = a[j];
          const L = t[i] !== t[j] ? Math.max(0, aj - ai) : Math.max(0, ai + aj - Cw[i]), H = t[i] !== t[j] ? Math.min(Cw[j], Cw[i] + aj - ai) : Math.min(Cw[j], ai + aj);
          if (L >= H) continue;
          const eta = 2 * KM[i][j] - KM[i][i] - KM[j][j]; if (eta >= 0) continue;
          let nj = clamp(aj - t[j] * (Ei - Ej) / eta, L, H); if (Math.abs(nj - aj) < 1e-6) continue;
          const ni = ai + t[i] * t[j] * (aj - nj);
          const b1 = b - Ei - t[i] * (ni - ai) * KM[i][i] - t[j] * (nj - aj) * KM[i][j], b2 = b - Ej - t[i] * (ni - ai) * KM[i][j] - t[j] * (nj - aj) * KM[j][j];
          a[i] = ni; a[j] = nj; b = ni > 0 && ni < Cw[i] ? b1 : nj > 0 && nj < Cw[j] ? b2 : (b1 + b2) / 2; changed++;
        }
      }
      passes = changed ? 0 : passes + 1; it++;
    }
    const sv = [...Array(n).keys()].filter(i => a[i] > 1e-8);
    const decision = x => sv.reduce((s, i) => s + a[i] * t[i] * K(X[i], x), b);
    return { decision, predict: x => sig(2 * decision(x)), sv, alpha: a, b, onMargin: sv.filter(i => a[i] < Cw[i] - 1e-6) };
  }

  /* ───────── one-class SVM (ν formulation, RBF): learns a boundary around the positives only ───────── */
  function oneClassSVM(X, { nu = 0.2, gamma = 0.5, iters = 3000, seed = 1 } = {}) {
    const n = X.length, rr = rng(seed), Cb = 1 / (nu * n), K = (p, q) => { let s = 0; for (let j = 0; j < p.length; j++) s += (p[j] - q[j]) ** 2; return Math.exp(-gamma * s); };
    const KM = Array.from({ length: n }, (_, i) => Float64Array.from({ length: n }, (_, j) => K(X[i], X[j])));
    const a = new Float64Array(n); let left = 1;                                   // feasible start: fill α up to C, summing to 1
    for (let i = 0; i < n && left > 0; i++) { a[i] = Math.min(Cb, left); left -= a[i]; }
    const grad = i => { let s = 0; for (let k = 0; k < n; k++) s += a[k] * KM[i][k]; return s; };
    for (let t = 0; t < iters; t++) {                                            // pairwise updates keep Σα = 1
      const i = Math.floor(rr() * n), j = Math.floor(rr() * n); if (i === j) continue;
      const gi = grad(i), gj = grad(j), eta = KM[i][i] + KM[j][j] - 2 * KM[i][j]; if (eta <= 1e-12) continue;
      const s = a[i] + a[j]; let ni = clamp(a[i] + (gj - gi) / eta, Math.max(0, s - Cb), Math.min(Cb, s));
      a[j] = s - ni; a[i] = ni;
    }
    const svs = [...Array(n).keys()].filter(i => a[i] > 1e-9), mid = svs.filter(i => a[i] < Cb - 1e-9);
    const g = x => svs.reduce((s, i) => s + a[i] * K(X[i], x), 0);
    const rho = mean((mid.length ? mid : svs).map(i => g(X[i])));
    return { decision: x => g(x) - rho, predict: x => sig(40 * (g(x) - rho)), sv: svs, rho };
  }

  /* ───────── MLP: one hidden ReLU layer, sigmoid output, Adam, dropout, weight decay, class weights ───────── */
  function mlp(X, y, { hidden = 12, epochs = 300, lr = 0.02, dropout = 0, weightDecay = 0, classWeight = null, seed = 1, evalX = null, evalY = null, onEpoch = null } = {}) {
    const n = X.length, d = X[0].length, r = rng(seed), W = classWeight ? classWeights(y, classWeight) : y.map(() => 1);
    const he = s => gauss(r) * Math.sqrt(2 / s);
    const P = { W1: Array.from({ length: hidden }, () => Array.from({ length: d }, () => he(d))), b1: Array(hidden).fill(0), W2: Array.from({ length: hidden }, () => he(hidden)), b2: 0 };
    const M = JSON.parse(JSON.stringify(P)), V = JSON.parse(JSON.stringify(P)); [M, V].forEach(o => { o.W1.forEach(rw => rw.fill(0)); o.b1.fill(0); o.W2.fill(0); o.b2 = 0; });
    const fwd = (x, mask) => { const a = P.W1.map((rw, k) => { const v = relu(dot(rw, x) + P.b1[k]); return mask ? v * mask[k] : v; }); return { a, p: sig(dot(P.W2, a) + P.b2) }; };
    const hist = [], ehist = []; let tstep = 0;
    const loss = (XX, yy) => -mean(XX.map((x, i) => { const p = fwd(x).p; return yy[i] ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12)); }));
    for (let ep = 0; ep < epochs; ep++) {
      const G = JSON.parse(JSON.stringify(M)); G.W1.forEach(rw => rw.fill(0)); G.b1.fill(0); G.W2.fill(0); G.b2 = 0; let Ws = 0;
      for (let i = 0; i < n; i++) {
        const mask = dropout ? Array.from({ length: hidden }, () => r() < dropout ? 0 : 1 / (1 - dropout)) : null, { a, p } = fwd(X[i], mask), e = (p - y[i]) * W[i]; Ws += W[i];
        G.b2 += e; for (let k = 0; k < hidden; k++) { G.W2[k] += e * a[k]; if (a[k] > 0) { const dk = e * P.W2[k] * (mask ? mask[k] : 1); G.b1[k] += dk; for (let j = 0; j < d; j++) G.W1[k][j] += dk * X[i][j]; } }
      }
      tstep++; const b1c = 1 - 0.9 ** tstep, b2c = 1 - 0.999 ** tstep;
      const adam = (getP, setP, gv, mGet, mSet, vGet, vSet, decay) => { const g2 = gv + decay * getP(); const m2 = 0.9 * mGet() + 0.1 * g2, v2 = 0.999 * vGet() + 0.001 * g2 * g2; mSet(m2); vSet(v2); setP(getP() - lr * (m2 / b1c) / (Math.sqrt(v2 / b2c) + 1e-8)); };
      for (let k = 0; k < hidden; k++) {
        for (let j = 0; j < d; j++) adam(() => P.W1[k][j], v => P.W1[k][j] = v, G.W1[k][j] / Ws, () => M.W1[k][j], v => M.W1[k][j] = v, () => V.W1[k][j], v => V.W1[k][j] = v, weightDecay);
        adam(() => P.b1[k], v => P.b1[k] = v, G.b1[k] / Ws, () => M.b1[k], v => M.b1[k] = v, () => V.b1[k], v => V.b1[k] = v, 0);
        adam(() => P.W2[k], v => P.W2[k] = v, G.W2[k] / Ws, () => M.W2[k], v => M.W2[k] = v, () => V.W2[k], v => V.W2[k] = v, weightDecay);
      }
      adam(() => P.b2, v => P.b2 = v, G.b2 / Ws, () => M.b2, v => M.b2 = v, () => V.b2, v => V.b2 = v, 0);
      if (ep % 5 === 0 || ep === epochs - 1) { hist.push([ep, loss(X, y)]); if (evalX) ehist.push([ep, loss(evalX, evalY)]); if (onEpoch) onEpoch(ep); }
    }
    return { P, predict: x => fwd(x).p, hist, ehist };
  }

  /* ───────── weights of evidence: binary evidence layers, W+ and W− per layer, summed in log-odds ───────── */
  function weightsOfEvidence(X, y, { thresholds, above }) {
    const n1 = y.reduce((a, b) => a + b, 0), n0 = y.length - n1, prior = Math.log(n1 / n0);
    const layers = thresholds.map((t, j) => {
      const on = X.map(x => above[j] ? x[j] > t : x[j] <= t);
      const a = on.filter((v, i) => v && y[i]).length, b = on.filter((v, i) => v && !y[i]).length;
      const Wp = Math.log(((a + 0.5) / (n1 + 1)) / ((b + 0.5) / (n0 + 1))), Wm = Math.log(((n1 - a + 0.5) / (n1 + 1)) / ((n0 - b + 0.5) / (n0 + 1)));
      return { t, above: above[j], Wp, Wm, contrast: Wp - Wm };
    });
    const z = x => layers.reduce((s, L, j) => s + ((L.above ? x[j] > L.t : x[j] <= L.t) ? L.Wp : L.Wm), prior);
    return { layers, prior, predict: x => sig(z(x)), z };
  }

  /* ───────── metrics ───────── */
  const logloss = (p, y) => -mean(p.map((v, i) => y[i] ? Math.log(Math.max(v, 1e-12)) : Math.log(Math.max(1 - v, 1e-12))));
  function confusion(p, y, thr = 0.5) {
    let tp = 0, fp = 0, tn = 0, fn = 0; p.forEach((v, i) => v >= thr ? (y[i] ? tp++ : fp++) : (y[i] ? fn++ : tn++));
    const precision = tp + fp ? tp / (tp + fp) : 0, recall = tp + fn ? tp / (tp + fn) : 0;
    return { tp, fp, tn, fn, precision, recall, accuracy: (tp + tn) / p.length, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0, fpr: fp + tn ? fp / (fp + tn) : 0 };
  }
  const order = p => [...p.keys()].sort((a, b) => p[b] - p[a]);
  function rocCurve(p, y) { const o = order(p), P = y.reduce((a, b) => a + b, 0), N = y.length - P; let tp = 0, fp = 0; const pts = [[0, 0]]; o.forEach(i => { y[i] ? tp++ : fp++; pts.push([fp / N, tp / P]); }); return pts; }
  function prCurve(p, y) { const o = order(p), P = y.reduce((a, b) => a + b, 0); let tp = 0, fp = 0; const pts = []; o.forEach(i => { y[i] ? tp++ : fp++; pts.push([tp / P, tp / (tp + fp)]); }); return pts; }
  const auc = (p, y) => { const c = rocCurve(p, y); let s = 0; for (let i = 1; i < c.length; i++) s += (c[i][0] - c[i - 1][0]) * (c[i][1] + c[i - 1][1]) / 2; return s; };
  const prAuc = (p, y) => { const o = order(p), P = y.reduce((a, b) => a + b, 0); let tp = 0, s = 0; o.forEach((i, r) => { if (y[i]) { tp++; s += tp / (r + 1); } }); return P ? s / P : 0; };
  // success-rate curve over the map: cells ranked by score; fraction of target cells captured vs fraction of area flagged
  function successRate(score, target, valid) {
    const cells = [...score.keys()].filter(k => !valid || valid[k]), o = cells.sort((a, b) => score[b] - score[a]), T = o.reduce((s, k) => s + (target[k] ? 1 : 0), 0);
    let c = 0; const pts = [[0, 0]]; o.forEach((k, r) => { if (target[k]) c++; if (r % 10 === 0 || r === o.length - 1) pts.push([(r + 1) / o.length, T ? c / T : 0]); });
    return pts;
  }
  const capture = (curve, frac) => { for (const [a, c] of curve) if (a >= frac) return c; return 1; };
  // how many of the deposits have at least one cell in the top `frac` of the map
  function depositsHit(score, valid, frac) {
    const cells = [...score.keys()].filter(k => !valid || valid[k]).sort((a, b) => score[b] - score[a]), top = new Set(cells.slice(0, Math.round(frac * cells.length)));
    return AREA.DEP.map(d => d.cells.some(k => top.has(k)));
  }

  /* ───────── validation splits ───────── */
  // random folds that ignore space (leaky with spatial data)
  const randomFolds = (n, k, seed = 1) => { const r = rng(seed), f = shuffle([...Array(n).keys()].map(i => i % k), r); return f; };
  // spatial blocks: every block goes to one fold; positives stay with their deposit
  function blockFolds(cells, k, size = 3, seed = 1) {
    const blocks = [...new Set(cells.map(c => AREA.block(c, size)))], r = rng(seed), fb = new Map(shuffle(blocks, r).map((b, i) => [b, i % k]));
    return cells.map(c => fb.get(AREA.block(c, size)));
  }
  // cross-validated scores: fit(Xtr, ytr) → model; returns out-of-fold probabilities
  function crossVal(X, y, folds, fit) {
    const k = Math.max(...folds) + 1, out = Array(X.length).fill(NaN);
    for (let f = 0; f < k; f++) {
      const tr = [], te = []; folds.forEach((v, i) => (v === f ? te : tr).push(i));
      if (!te.length || !tr.some(i => y[i])) continue;
      const m = fit(tr.map(i => X[i]), tr.map(i => y[i]));
      te.forEach(i => out[i] = m.predict(X[i]));
    }
    return out;
  }
  return { sig, dot, shuffle, classWeights, standardize, logistic, logisticInit, logisticStep, tree, forest, puBagging, boost, svm, oneClassSVM, mlp, weightsOfEvidence,
    logloss, confusion, rocCurve, prCurve, auc, prAuc, successRate, capture, depositsHit, randomFolds, blockFolds, crossVal };
})();
