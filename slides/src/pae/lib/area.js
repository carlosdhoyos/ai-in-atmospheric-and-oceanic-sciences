/* ═════════ PAE-Minas · the synthetic study area (seeded: every viewer sees the same map) ═════════
   A stylised 13.5 × 9 km window loosely modelled on the Cerro Matoso setting (Córdoba, Colombia):
   NE-trending ultramafic (serpentinized peridotite) bodies forming low plateaus, Cretaceous–Tertiary
   sediments around them, and a river with its alluvium to the east. Ni-laterite develops on the flat
   tops of the ultramafic bodies. Nothing here is real data.

   AREA.NX × AREA.NY cells of AREA.CELL km; cell k = j * NX + i, row j = 0 is the north edge.
   Layers (Float64Array, one value per cell):
     lith       0 sediments · 1 ultramafic · 2 alluvium
     elev       elevation (m)               slope   slope (degrees)
     distUM     distance to the ultramafic contact (km), 0 inside the body
     mag        magnetic anomaly (nT)
     ndvi       NDVI from the dry-season Sentinel-2 median
     ferric     ferric iron ratio B4/B2      clay   clay/OH ratio B11/B12
   Labels and masks (Uint8Array or Int16Array):
     truth      1 where Ni-laterite really is (unknown in practice)
     dep        deposit id of each true laterite cell (−1 elsewhere)
     known      1 where a laterite cell belongs to a known deposit (the positive labels)
     mine       1 for the active pit, tailings and plant (masked out)
   AREA.data(opts) returns a modelling table; see below. */
const AREA = (() => {
  const NX = 90, NY = 60, CELL = 0.15, N = NX * NY;
  const xk = k => (k % NX + 0.5) * CELL, yk = k => (NY - Math.floor(k / NX) - 0.5) * CELL;   // km, y = north
  // smooth random fields: a seeded sum of cosine waves, roughly N(0, 0.5)
  function field(nw, scale, seed) {
    const rr = rng(seed), W = Array.from({ length: nw }, () => { const a = rr() * 2 * Math.PI, f = (0.5 + rr()) / scale; return [f * Math.cos(a), f * Math.sin(a), rr() * 2 * Math.PI, 0.5 + rr()]; });
    return (x, y) => W.reduce((s, [kx, ky, ph, am]) => s + am * Math.cos(kx * x + ky * y + ph), 0) / Math.sqrt(nw);
  }
  const blur = (A, rad) => { // Gaussian blur on the grid, radius in km
    const s = rad / CELL, R = Math.ceil(2.5 * s), ker = Array.from({ length: 2 * R + 1 }, (_, i) => Math.exp(-((i - R) ** 2) / (2 * s * s))), ks = ker.reduce((a, b) => a + b, 0);
    const T = new Float64Array(N), O = new Float64Array(N);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { let a = 0; for (let d = -R; d <= R; d++) a += ker[d + R] * A[j * NX + clamp(i + d, 0, NX - 1)]; T[j * NX + i] = a / ks; }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { let a = 0; for (let d = -R; d <= R; d++) a += ker[d + R] * T[clamp(j + d, 0, NY - 1) * NX + i]; O[j * NX + i] = a / ks; }
    return O;
  };
  const r = rng(4242), n1 = field(14, 0.9, 11), n2 = field(10, 3.0, 12), n3 = field(16, 0.5, 13), n4 = field(10, 1.6, 14), n5 = field(24, 0.25, 15), n6 = field(12, 1.2, 16), n7 = field(12, 1.0, 17), n8 = field(16, 0.45, 18);
  /* geology: three NE-trending ultramafic bodies, a river with alluvium */
  const BODIES = [[5.0, 4.5, 3.4, 1.25], [10.0, 6.7, 2.3, 0.85], [10.9, 2.0, 1.5, 0.62], [1.9, 7.6, 1.1, 0.5], [7.6, 1.3, 1.3, 0.5], [2.6, 1.5, 1.0, 0.45]], ang = 35 * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const riverX = y => 12.7 + 0.45 * Math.sin(y / 1.25) + 0.15 * Math.sin(y / 0.4);
  const lith = new Uint8Array(N), um = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const x = xk(k), y = yk(k);
    const inBody = BODIES.some(([cx, cy, a, b]) => { const u = ((x - cx) * ca + (y - cy) * sa) / a, v = (-(x - cx) * sa + (y - cy) * ca) / b; return u * u + v * v + 0.45 * n1(x, y) < 1; });
    if (inBody) { lith[k] = 1; um[k] = 1; }
    else if (Math.abs(x - riverX(y)) < 0.5 + 0.12 * n3(x, y)) lith[k] = 2;
  }
  /* distance to the ultramafic contact (brute force over ultramafic cells; fast enough on 5,400 cells) */
  const umCells = []; for (let k = 0; k < N; k++) if (um[k]) umCells.push(k);
  const distUM = new Float64Array(N);
  for (let k = 0; k < N; k++) { if (um[k]) continue; const x = xk(k), y = yk(k); let m = 1e9; for (const q of umCells) { const d = (x - xk(q)) ** 2 + (y - yk(q)) ** 2; if (d < m) m = d; } distUM[k] = Math.sqrt(m); }
  /* terrain: the ultramafic bodies stand up as flat-topped plateaus; the river cuts a valley */
  const umSoft = blur(um, 0.35), plateau = umSoft.map(v => 0.5 * (1 + Math.tanh(5 * (v - 0.55)))), elev = new Float64Array(N);
  for (let k = 0; k < N; k++) { const x = xk(k), y = yk(k), dr = x - riverX(y); elev[k] = 75 + 18 * n2(x, y) + 105 * plateau[k] - 28 * Math.exp(-dr * dr / 1.2) + 4 * n3(x, y); }
  const slope = new Float64Array(N);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const e = (a, b) => elev[clamp(b, 0, NY - 1) * NX + clamp(a, 0, NX - 1)], gx = (e(i + 1, j) - e(i - 1, j)) / (2 * CELL * 1000), gy = (e(i, j + 1) - e(i, j - 1)) / (2 * CELL * 1000);
    slope[j * NX + i] = Math.atan(Math.hypot(gx, gy)) * 180 / Math.PI;
  }
  /* magnetics: ultramafic rocks are magnetic */
  const umWide = blur(um, 0.9), mag = new Float64Array(N);
  for (let k = 0; k < N; k++) mag[k] = 35 * n4(xk(k), yk(k)) + 330 * umWide[k] + 12 * gauss(r);
  /* where laterite really is: flat tops of the ultramafic bodies, patchy (weathering, erosion) */
  const latent = new Float64Array(N);
  for (let k = 0; k < N; k++) latent[k] = 0.6 * umSoft[k] - 0.45 * slope[k] + 2.5 * n5(xk(k), yk(k)) - 3 * distUM[k];
  const thr = [...latent].sort((a, b) => b - a)[Math.round(0.042 * N)], truth = new Uint8Array(N);
  for (let k = 0; k < N; k++) truth[k] = +(latent[k] > thr && distUM[k] < 0.25);
  /* deposits = connected patches of laterite (4-neighbours, at least 4 cells) */
  const dep = new Int16Array(N).fill(-1), deposits = [];
  for (let k = 0; k < N; k++) {
    if (!truth[k] || dep[k] >= 0) continue;
    const id = deposits.length, stack = [k], cells = []; dep[k] = id;
    while (stack.length) { const q = stack.pop(), i = q % NX, j = Math.floor(q / NX); cells.push(q);
      [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].forEach(([a, b]) => { if (a < 0 || b < 0 || a >= NX || b >= NY) return; const p = b * NX + a; if (truth[p] && dep[p] < 0) { dep[p] = id; stack.push(p); } }); }
    deposits.push({ id, cells, cx: mean(cells.map(xk)), cy: mean(cells.map(yk)) });
  }
  deposits.forEach(d => { if (d.cells.length < 4) { d.cells.forEach(q => { truth[q] = 0; dep[q] = -1; }); d.dropped = true; } });
  const DEP = deposits.filter(d => !d.dropped).map((d, n) => { d.cells.forEach(q => dep[q] = n); return { ...d, id: n }; });
  /* the mine: active pit on the largest deposit, tailings and plant towards the river */
  const big = DEP.reduce((a, d) => d.cells.length > a.cells.length ? d : a, DEP[0]), mine = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    const x = xk(k), y = yk(k), pit = ((x - big.cx) / 0.55) ** 2 + ((y - big.cy) / 0.38) ** 2 < 1, tail = x > 7.6 && x < 9.0 && y > 3.0 && y < 3.9, plant = x > 7.0 && x < 7.6 && y > 3.3 && y < 3.7;
    if (pit || tail || plant) mine[k] = 1;
  }
  /* which deposits are known: explored ones in the west and centre, plus the mine; others are still undiscovered */
  const rk = rng(77); DEP.forEach(d => { d.known = d === big || (d.cx < 8.5 ? rk() < 0.8 : rk() < 0.25); });
  const known = new Uint8Array(N); DEP.forEach(d => { if (d.known) d.cells.forEach(q => { if (!mine[q]) known[q] = 1; }); });
  /* Sentinel-2 dry-season ratios: iron oxides and clays over laterite, masked partly by vegetation */
  // ferruginous red soils on the sediments: iron oxides but no nickel (a classic false positive for B4/B2)
  const red = new Float64Array(N); for (let k = 0; k < N; k++) red[k] = lith[k] === 0 && distUM[k] > 0.4 ? clamp(2.2 * (n8(xk(k), yk(k)) - 0.35), 0, 1) : 0;
  const redSoil = blur(red, 0.2);
  const latSoft = blur(Float64Array.from(truth), 0.25), ndvi = new Float64Array(N), ferric = new Float64Array(N), clay = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const x = xk(k), y = yk(k);
    ndvi[k] = clamp(0.70 + 0.12 * n6(x, y) - 0.16 * latSoft[k] - 0.08 * umSoft[k] - 0.10 * redSoil[k] + 0.03 * gauss(r), 0.05, 0.92);
    ferric[k] = 1.30 + 0.34 * latSoft[k] + 0.08 * umSoft[k] + 0.32 * redSoil[k] - 0.55 * (ndvi[k] - 0.65) + 0.09 * gauss(r);
    clay[k] = 1.17 + 0.17 * latSoft[k] + 0.04 * (lith[k] === 0) + 0.05 * n7(x, y) + 0.03 * gauss(r);
    if (mine[k]) { ndvi[k] = 0.08 + 0.04 * r(); ferric[k] = 2.25 + 0.15 * gauss(r); clay[k] = 1.42 + 0.05 * gauss(r); }
  }
  /* distance to the nearest known positive, for buffers around labels */
  const knownCells = []; for (let k = 0; k < N; k++) if (known[k]) knownCells.push(k);
  const distKnown = new Float64Array(N);
  for (let k = 0; k < N; k++) { let m = 1e9; const x = xk(k), y = yk(k); for (const q of knownCells) { const d = (x - xk(q)) ** 2 + (y - yk(q)) ** 2; if (d < m) m = d; } distKnown[k] = Math.sqrt(m); }
  const L = { lith, elev, slope, distUM, mag, ndvi, ferric, clay };
  /* features: key, layer, Spanish name, English name, unit, decimals */
  const FEATS = [
    { key: "ferric", es: "Hierro férrico B4/B2", en: "ferric iron ratio", unit: "", d: 2 },
    { key: "clay", es: "Arcillas/OH B11/B12", en: "clay/OH ratio", unit: "", d: 2 },
    { key: "distUM", es: "Distancia a ultramáficas", en: "distance to ultramafics", unit: "km", d: 2 },
    { key: "slope", es: "Pendiente", en: "slope", unit: "°", d: 1 },
    { key: "mag", es: "Anomalía magnética", en: "magnetic anomaly", unit: "nT", d: 0 },
    { key: "ndvi", es: "NDVI", en: "NDVI", unit: "", d: 2 },
    { key: "elev", es: "Elevación", en: "elevation", unit: "m", d: 0 }];
  const F = Object.fromEntries(FEATS.map(f => [f.key, f]));
  /* spatial blocks for validation: square blocks of `size` km, numbered row by row */
  const block = (k, size) => { const nb = Math.ceil(NX * CELL / size); return Math.floor((NY - 1 - Math.floor(k / NX)) * CELL / size) * nb + Math.floor((k % NX) * CELL / size); };
  /* a modelling table.
     feats       feature keys (default: the five of the logistic-regression lesson)
     mask        drop mine cells (default true); false keeps them, labelled positive if minePositive
     buffer      drop unlabeled cells closer than this (km) to a known positive (default 0)
     unlabeled   'all' or a number: random sample of unlabeled cells (seeded)
     seed
     Returns { X, y, cells, group, feats } with y = 1 for known positives, 0 for unlabeled (not true negatives!),
     group = deposit id for positives (keep them together across folds), −1 otherwise. */
  function data({ feats = ["ferric", "clay", "distUM", "slope", "mag"], mask = true, minePositive = false, buffer = 0, unlabeled = "all", seed = 1 } = {}) {
    const pos = [], unl = [];
    for (let k = 0; k < N; k++) {
      if (mine[k] && mask) continue;
      if (known[k] || (mine[k] && minePositive)) pos.push(k);
      else if (distKnown[k] >= buffer) unl.push(k);
    }
    let U = unl;
    if (unlabeled !== "all") { const rr = rng(seed), a = unl.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } U = a.slice(0, unlabeled); }
    const cells = pos.concat(U);
    return { feats, cells, X: cells.map(k => feats.map(f => L[f][k])), y: cells.map((_, i) => +(i < pos.length)), group: cells.map(k => known[k] || mine[k] ? (dep[k] >= 0 ? dep[k] : 999) : -1) };
  }
  const row = (k, feats) => feats.map(f => L[f][k]);
  return { NX, NY, CELL, N, xk, yk, riverX, L, ...L, redSoil, truth, dep, DEP, known, mine, distKnown, FEATS, F, data, row, block, mineDeposit: big.id };
})();
