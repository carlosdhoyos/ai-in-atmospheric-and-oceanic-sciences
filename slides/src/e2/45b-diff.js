/* ═════════ Earth-2 · 5b StormScope · part D · diffusion models from scratch ═════════
   Why a generative model, the forward (noising) process, the optimal denoiser, the arrow (score) field in a two-pixel
   world, a tiny diffusion model trained live in the browser (hand-written MLP, backprop and Adam), sampling,
   conditioning on the past, and the EDM recipe. Every field is a toy. StormScope numbers: Pathak et al. 2026
   (arXiv:2601.17268); EDM settings: Karras et al. 2022, labelled as EDM defaults where the paper does not state them. */

const SDF = (() => {
  const SDATA = 0.5, SMIN = 0.002, SMAX = 80; // EDM defaults (Karras et al. 2022, Table 1)
  const fs = s => s < .01 ? fmt(s, 4) : s < .1 ? fmt(s, 3) : s < 10 ? fmt(s, 2) : fmt(s, 1);
  const LUT = new Map();
  const lut = f => { if (!LUT.has(f)) { const L = new Uint8ClampedArray(768); for (let i = 0; i < 256; i++) L.set(CM.rgb(f, i / 255), i * 3); LUT.set(f, L); } return LUT.get(f); };
  const rgbOf = tok => { const d = document.createElement("canvas").getContext("2d"); d.fillStyle = css(tok) || "#888"; d.fillRect(0, 0, 1, 1); return [...d.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  // a canvas with one pixel per cell; mask(v) → true paints --well
  function paint(vals, nx, ny, { color = CM.precip, lo = 0, hi = 60, mask = null } = {}) {
    const c = document.createElement("canvas"); c.width = nx; c.height = ny;
    const g = c.getContext("2d"), im = g.createImageData(nx, ny), L = lut(color), w = rgbOf("--well");
    for (let k = 0; k < nx * ny; k++) { const v = vals[k], o = k * 4;
      if (mask && mask(v)) { im.data[o] = w[0]; im.data[o + 1] = w[1]; im.data[o + 2] = w[2]; }
      else { const t = Math.round(clamp((v - lo) / (hi - lo || 1), 0, 1) * 255) * 3; im.data[o] = L[t]; im.data[o + 1] = L[t + 1]; im.data[o + 2] = L[t + 2]; }
      im.data[o + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }
  const url = c => c.toDataURL();
  const dbz = (f, nx, ny) => paint(f, nx, ny, { color: CM.precip, lo: 0, hi: 60, mask: v => v < 5 });
  // SVG text; "_{…}" (or _θ, _σ, _i) becomes a subscript
  function txt(p, x, y, s, a = {}) {
    const t = el("text", { x, y, ...a }, p), str = String(s), re = /_\{([^}]*)\}|_([θσi])(?![A-Za-z])/g; let last = 0, m;
    while ((m = re.exec(str))) { if (m.index > last) el("tspan", {}, t, str.slice(last, m.index)); el("tspan", { "baseline-shift": "sub", "font-size": "72%" }, t, m[1] ?? m[2]); last = re.lastIndex; }
    if (last < str.length) el("tspan", {}, t, str.slice(last));
    return t;
  }
  function img(p, href, x, y, w, h) { const i = el("image", { x, y, width: w, height: h, preserveAspectRatio: "none" }, p); i.setAttribute("href", href); return i; }
  // hi-dpi canvas filling its host's width with a W × H aspect; reused between renders
  function canvas(host, W, H) {
    let c = host.querySelector("canvas"); const r = Math.min(2, window.devicePixelRatio || 1);
    if (!c || c._W !== W || c._H !== H) { c = document.createElement("canvas"); c._W = W; c._H = H; c.width = W * r; c.height = H * r;
      Object.assign(c.style, { width: "100%", height: "auto", display: "block", borderRadius: "8px" }); host.innerHTML = ""; host.appendChild(c); }
    const g = c.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, W, H); return { c, g };
  }
  const at = (c, e) => { const b = c.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * c._W, (e.clientY - b.top) / b.height * c._H]; };
  // toy storm cells {x, y (cell units), I (dBZ), R (cells)}: a flat-topped core plus a wider area of light rain; max-combined
  function storm(nx, ny, cells) {
    const f = new Float32Array(nx * ny);
    for (const c of cells) { if (!c) continue; const r3 = 5 * c.R, i0 = Math.max(0, Math.floor(c.x - r3)), i1 = Math.min(nx - 1, Math.ceil(c.x + r3)), j0 = Math.max(0, Math.floor(c.y - r3)), j1 = Math.min(ny - 1, Math.ceil(c.y + r3));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = (i + .5 - c.x) / c.R, dy = (j + .5 - c.y) / c.R, r2 = dx * dx + dy * dy;
        const v = Math.max(c.I * Math.exp(-.5 * Math.pow(r2, 1.5)), .5 * c.I * Math.exp(-r2 / 8)); if (v > f[j * nx + i]) f[j * nx + i] = v; } }
    return f;
  }
  // a square toy radar scene (n × n, 6 km cells) normalised to mean 0 and standard deviation σ_data
  const BIG = new Map();
  function bigStorm(n) {
    if (BIG.has(n)) return BIG.get(n);
    const r = rng(4242), cells = [], q = n / 128;
    for (let k = 0; k < 16; k++) cells.push({ x: n * (.08 + .84 * r()), y: n * (.08 + .84 * r()), I: 36 + 20 * r(), R: q * (1.6 + 6 * r() * r()) });
    const f = storm(n, n, cells), b = FFT.noise2(n, { beta: 4, seed: 7 });
    for (let k = 0; k < f.length; k++) { const s = 13 + 8 * b[k]; if (s > 12 && s > f[k]) f[k] = s; }
    const m = mean(f), s = sd(Array.from(f)), x = Float32Array.from(f, v => (v - m) / s * SDATA), dry = (0 - m) / s * SDATA;
    const out = { x, dry, lo: Math.min(...x), hi: Math.max(...x) }; BIG.set(n, out); return out;
  }
  // noise fields with a seed
  const noise = (n, seed) => { const r = rng(seed); return Float32Array.from({ length: n }, () => gauss(r)); };
  // canvas arrow
  function arrow(g, x0, y0, x1, y1, col, w = 1.5, head = 5) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); g.strokeStyle = col; g.fillStyle = col;
    if (L < 1.2) { g.beginPath(); g.arc(x0, y0, 1.3, 0, 7); g.fill(); return; }
    const ux = dx / L, uy = dy / L, h = Math.min(head, L * .55);
    g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - ux * h * .6, y1 - uy * h * .6); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - h * ux + h * .5 * uy, y1 - h * uy - h * .5 * ux); g.lineTo(x1 - h * ux - h * .5 * uy, y1 - h * uy + h * .5 * ux); g.closePath(); g.fill();
  }
  /* Gaussian mixtures in 2-D: { mu: [[x, y]…], w: [weights], s: component std, cls: [class per component] }.
     Exact denoiser: E[x | x_σ] with x_σ = x + σ n. Returns [d1, d2]; resp (optional array) gets the posterior weights. */
  function gmmD(G, y1, y2, sig, resp) {
    const v = G.s * G.s + sig * sig, a = G.s * G.s / v, K = G.mu.length, e = gmmD.e && gmmD.e.length >= K ? gmmD.e : (gmmD.e = new Float64Array(Math.max(K, 64)));
    let mx = -Infinity;
    for (let k = 0; k < K; k++) { const d1 = y1 - G.mu[k][0], d2 = y2 - G.mu[k][1]; e[k] = G.lw[k] - (d1 * d1 + d2 * d2) / (2 * v); if (e[k] > mx) mx = e[k]; }
    let Z = 0, o1 = 0, o2 = 0;
    for (let k = 0; k < K; k++) { const p = Math.exp(e[k] - mx); Z += p; o1 += p * (G.mu[k][0] + a * (y1 - G.mu[k][0])); o2 += p * (G.mu[k][1] + a * (y2 - G.mu[k][1])); if (resp) resp[k] = p; }
    if (resp) for (let k = 0; k < K; k++) resp[k] /= Z;
    return [o1 / Z, o2 / Z];
  }
  // density of noisy data p_σ (up to a constant)
  function gmmP(G, y1, y2, sig) { const v = G.s * G.s + sig * sig; let p = 0;
    for (let k = 0; k < G.mu.length; k++) { const d1 = y1 - G.mu[k][0], d2 = y2 - G.mu[k][1]; p += G.w[k] * Math.exp(-(d1 * d1 + d2 * d2) / (2 * v)); } return p / v; }
  function gmm(mu, w, s, cls) { const W = w.reduce((a, b) => a + b, 0), ww = w.map(v => v / W); return { mu, w: ww, lw: ww.map(Math.log), s, cls: cls || mu.map(() => 0) }; }
  function gmmDraw(G, r) { let u = r(), k = 0; while (k < G.w.length - 1 && u > G.w[k]) { u -= G.w[k]; k++; } return [G.mu[k][0] + G.s * gauss(r), G.mu[k][1] + G.s * gauss(r), k]; }
  // the toy distributions (two-pixel storms: class 0 = storm over A, 1 = over B, 2 = no storm)
  const DIST = {
    storms: () => gmm([[1, 0], [0, 1], [0, 0]], [1, 1, 2], .08, [0, 1, 2]),
    ring: () => gmm(Array.from({ length: 40 }, (_, k) => [.5 + .75 * Math.cos(k * Math.PI / 20), .5 + .75 * Math.sin(k * Math.PI / 20)]), new Array(40).fill(1), .045),
    moons: () => { const mu = []; for (let k = 0; k < 20; k++) { const t = Math.PI * k / 19; mu.push([.5 + .55 * (Math.cos(t) - .5), .5 + .55 * (Math.sin(t) - .25)]); mu.push([.5 + .55 * (1 - Math.cos(t) - .5), .5 + .55 * (.5 - Math.sin(t) - .25)]); }
      return gmm(mu, new Array(40).fill(1), .045); },
  };
  const CLS = ["--lw", "--cool", "--ok"], CLSN = ["storm over A", "storm over B", "no storm"];
  // the plane [-0.7, 1.7]² on a W × W canvas (y up)
  const LO = -.7, HI = 1.7;
  const plane = (W, pad = 0) => ({ X: v => pad + (v - LO) / (HI - LO) * (W - 2 * pad), Y: v => W - pad - (v - LO) / (HI - LO) * (W - 2 * pad), iX: p => LO + (p - pad) / (W - 2 * pad) * (HI - LO), iY: p => LO + (W - pad - p) / (W - 2 * pad) * (HI - LO) });
  // shade a density on the plane (dens(x, y) → value ≥ 0), from --well to the token colour
  const SHADE = new Map();
  function shade(g, W, dens, tok = "--cool", res = 80, gamma = .5, key = null) {
    const P = plane(W), k0 = key && key + "|" + tok + "|" + res + "|" + gamma + "|" + css("--well");
    if (k0 && SHADE.has(k0)) { g.imageSmoothingEnabled = true; g.drawImage(SHADE.get(k0), 0, 0, W, W); grid0(g, W, P); return P; }
    const c = document.createElement("canvas"); c.width = res; c.height = res;
    const cg = c.getContext("2d"), im = cg.createImageData(res, res), a = rgbOf("--well"), b = rgbOf(tok), V = new Float64Array(res * res); let mx = 0;
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) { const v = dens(LO + (i + .5) / res * (HI - LO), HI - (j + .5) / res * (HI - LO)); V[j * res + i] = v; if (v > mx) mx = v; }
    for (let k = 0; k < res * res; k++) { const t = Math.pow(V[k] / (mx || 1), gamma) * .85, o = k * 4; for (let q = 0; q < 3; q++) im.data[o + q] = a[q] + (b[q] - a[q]) * t; im.data[o + 3] = 255; }
    cg.putImageData(im, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(c, 0, 0, W, W);
    if (k0) { if (SHADE.size > 300) SHADE.clear(); SHADE.set(k0, c); }
    grid0(g, W, P); return P;
  }
  // dashed lines at pixel values 0 and 1
  function grid0(g, W, P) {
    g.strokeStyle = css("--line"); g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath();
    [0, 1].forEach(v => { g.moveTo(P.X(v), 0); g.lineTo(P.X(v), W); g.moveTo(0, P.Y(v)); g.lineTo(W, P.Y(v)); }); g.stroke(); g.setLineDash([]);
  }
  function axisLabels(g, W, P, a = "pixel A", b = "pixel B") {
    g.fillStyle = css("--muted"); g.font = "11px " + css("--f-mono"); g.textAlign = "center";
    [0, 1].forEach(v => { g.fillText(v, P.X(v), W - 5); }); g.textAlign = "left"; [0, 1].forEach(v => g.fillText(v, 4, P.Y(v) - 4));
    g.font = "12px " + css("--f-body"); g.textAlign = "right"; g.fillText(a + " →", W - 6, W - 5); g.textAlign = "left"; g.fillText("↑ " + b, 4, 14);
  }
  // EDM pre-conditioning (Karras et al. 2022, Table 1)
  const pre = (s, sd0 = SDATA) => { const q = s * s + sd0 * sd0; return { skip: sd0 * sd0 / q, out: s * sd0 / Math.sqrt(q), cin: 1 / Math.sqrt(q), cn: Math.log(s) / 4, lam: q / (s * sd0) ** 2 }; };
  // EDM time steps: N values from smax to smin (ρ schedule), then 0
  function sched(N, smax, smin, rho = 7) { const a = smax ** (1 / rho), b = smin ** (1 / rho), out = [];
    for (let i = 0; i < N; i++) out.push(N === 1 ? smax : (a + i / (N - 1) * (b - a)) ** rho); out.push(0); return out; }
  return { SDATA, SMIN, SMAX, fs, paint, url, dbz, txt, img, canvas, at, storm, bigStorm, noise, arrow, gmmD, gmmP, gmm, gmmDraw, DIST, CLS, CLSN, plane, shade, axisLabels, pre, sched, rgbOf, lut, LO, HI };
})();

/* ───────── 1 · why a generative model ───────── */
demo("sd-why", () => {
  const NX = 70, NY = 40, X1 = 47, r = rng(11);
  let K = 3, none = false, pick = null, nDraw = 0;
  const pastU = SDF.url(SDF.dbz(SDF.storm(NX, NY, [{ x: 18, y: 20, I: 48, R: 4 }]), NX, NY));
  const sS = slider("sdWhS", v => fmt(100 * v, 0) + " %", () => { pick = null; render(); });
  chips($("#sdWhK"), v => { K = +v; pick = null; render(); });
  chips($("#sdWhNone"), v => { none = v === "1"; pick = null; render(); });
  $("#sdWhDraw").onclick = () => { pick = Math.floor(r() * (K + (none ? 1 : 0))); nDraw++; render(); };
  function futs() {
    const s = sS(), out = [];
    for (let k = 0; k < K; k++) { const o = K === 1 ? 0 : 2 * k / (K - 1) - 1; out.push({ c: { x: X1 - 3 * Math.abs(o) * s, y: 20 + 15 * o * s, I: 50, R: 4 }, lab: K === 1 ? "the future" : `#${k + 1}` }); }
    if (none) out.push({ c: null, lab: "no storm" });
    return out.map(o => ({ ...o, f: SDF.storm(NX, NY, [o.c]) }));
  }
  const area = f => f.reduce((a, v) => a + (v >= 30 ? 36 : 0), 0), peak = f => f.reduce((a, v) => Math.max(a, v), 0);
  function render() {
    const F = futs(), n = F.length, M = new Float32Array(NX * NY); F.forEach(o => o.f.forEach((v, k) => { M[k] += v / n; }));
    const W = 1000, H = 252, svg = svgIn($("#sdWhFig"), W, H); arrowDefs(svg, "sdWhAr", css("--muted"));
    const T = (x, y, s, a) => SDF.txt(svg, x, y, s, a), box = (x, y, w, h, tok, sw = 2) => el("rect", { x, y, width: w, height: h, rx: 4, fill: "none", stroke: css(tok), "stroke-width": sw }, svg);
    T(10, 40, "Past (now)", { "font-size": 14, "font-weight": 600 });
    SDF.img(svg, pastU, 10, 52, 175, 100); box(10, 52, 175, 100, "--fg");
    T(10, 172, "one storm, moving east", { "font-size": 12, fill: css("--muted") });
    el("line", { x1: 192, y1: 102, x2: 226, y2: 102, stroke: css("--muted"), "stroke-width": 2, "marker-end": "url(#sdWhAr)" }, svg);
    T(234, 18, "Possible futures (equally likely)", { "font-size": 14, "font-weight": 600 });
    const cols = n <= 3 ? 1 : 2, rows = Math.ceil(n / cols), h = Math.min(64, (214 - (rows - 1) * 8) / rows), w = h * 1.75, y0 = 30 + (214 - rows * h - (rows - 1) * 8) / 2;
    F.forEach((o, k) => { const c = k % cols, rr = Math.floor(k / cols), x = 234 + c * (w + 12), y = y0 + rr * (h + 8);
      SDF.img(svg, SDF.url(SDF.dbz(o.f, NX, NY)), x, y, w, h); box(x, y, w, h, k === pick ? "--accent" : "--line", k === pick ? 3 : 1.2);
      T(x + 5, y + 14, o.lab, { "font-size": 12, "font-weight": 600, stroke: css("--bg"), "stroke-width": 3, "paint-order": "stroke" }); });
    const xr = 234 + cols * (w + 12) + 6;
    el("path", { d: `M${xr} 102 C ${xr + 30} 102, 560 72, 592 72`, fill: "none", stroke: css("--lw"), "stroke-width": 2, "marker-end": "url(#sdWhAr)" }, svg);
    el("path", { d: `M${xr} 112 C ${xr + 30} 112, 560 194, 592 194`, fill: "none", stroke: css("--accent"), "stroke-width": 2, "marker-end": "url(#sdWhAr)" }, svg);
    T(600, 16, "Trained with MSE: the average", { "font-size": 14, "font-weight": 600, fill: css("--lw") });
    SDF.img(svg, SDF.url(SDF.dbz(M, NX, NY)), 600, 24, 175, 100); box(600, 24, 175, 100, "--lw", 2.5);
    T(600, 142, "Generative model: one sample", { "font-size": 14, "font-weight": 600, fill: css("--accent") });
    if (pick != null && pick < n) { SDF.img(svg, SDF.url(SDF.dbz(F[pick].f, NX, NY)), 600, 150, 175, 100); box(600, 150, 175, 100, "--accent", 2.5); }
    else { el("rect", { x: 600, y: 150, width: 175, height: 100, rx: 4, fill: css("--well"), stroke: css("--line") }, svg); T(687, 205, "press 🎲 Draw a sample", { "font-size": 12, "text-anchor": "middle", fill: css("--muted") }); }
    const one = F.find(o => o.c), pk1 = one ? peak(one.f) : 0, a1 = one ? area(one.f) : 0, pkM = peak(M), aM = area(M);
    const R = (y, lab, val, tok) => { T(792, y, lab, { "font-size": 12, fill: css("--muted") }); T(992, y, val, { "font-size": 15, "text-anchor": "end", class: "mono", fill: css(tok), "font-weight": 600 }); };
    R(46, "peak", fmt(pkM, 0) + " dBZ", "--lw"); R(68, "area ≥ 30 dBZ", fmtN(aM) + " km²", "--lw");
    T(792, 96, pkM < 30 ? "below 30 dBZ: the storm is gone" : pkM < pk1 - 3 ? "weaker and wider than any future" : "same as each future", { "font-size": 12, fill: css(pkM < pk1 - 3 ? "--lw" : "--muted"), "font-weight": 600 });
    T(792, 114, "(each future: " + fmt(pk1, 0) + " dBZ, " + fmtN(a1) + " km²)", { "font-size": 11.5, fill: css("--muted") });
    if (pick != null && pick < n) { const f = F[pick].f; R(176, "peak", fmt(peak(f), 0) + " dBZ", "--accent"); R(198, "area ≥ 30 dBZ", fmtN(area(f)) + " km²", "--accent");
      T(792, 224, F[pick].c ? "a full-strength storm: plausible" : "no storm: also plausible", { "font-size": 12, fill: css("--accent"), "font-weight": 600 }); }
    $("#sdWhCnt").textContent = nDraw ? `${nDraw} drawn · each sample is one of the ${n} futures` : "";
    // south–north cut at the futures' longitude
    const Wc = 560, Hc = 170, cs = svgIn($("#sdWhCut"), Wc, Hc), A = axes(cs, { W: Wc, H: Hc, m: { l: 40, r: 110, t: 18, b: 26 }, x0: 0, x1: NY * 6, y0: 0, y1: 60, xt: [0, 60, 120, 180, 240], yt: [0, 30, 60], xl: "south → north (km)", yl: "" });
    el("line", { x1: A.x(0), x2: A.x(NY * 6), y1: A.y(30), y2: A.y(30), stroke: css("--muted"), "stroke-dasharray": "4 3" }, cs);
    const cut = f => Array.from({ length: NY }, (_, j) => [A.x((NY - 1 - j + .5) * 6), A.y(f[j * NX + X1])]);
    F.forEach(o => el("path", { d: path(cut(o.f)), fill: "none", stroke: css("--muted"), "stroke-width": 1.2, opacity: .7 }, cs));
    if (pick != null && pick < n) el("path", { d: path(cut(F[pick].f)), fill: "none", stroke: css("--accent"), "stroke-width": 3 }, cs);
    el("path", { d: path(cut(M)), fill: "none", stroke: css("--lw"), "stroke-width": 3 }, cs);
    [["— each future", "--muted", 22], ["— MSE average", "--lw", 40], ["— a sample", "--accent", 58], ["- - 30 dBZ", "--muted", 76]].forEach(([s, t, y]) => SDF.txt(cs, Wc - 104, y, s, { "font-size": 12, fill: css(t), "font-weight": 600 }));
    SDF.txt(cs, 44, 10, "dBZ", { "font-size": 11, fill: css("--muted") });
  }
  render(); return render;
});

/* ───────── 2 · the forward process ───────── */
demo("sd-forward", slide => {
  const n = 128, B = SDF.bigStorm(n), x = B.x, sd0 = SDF.SDATA; let seed = 1, Z = SDF.noise(n * n, seed), scaled = true;
  const spec0 = FFT.spectrum2(Array.from(x), n);
  const sS = slider("sdFwS", v => SDF.fs(10 ** v), () => { syncPre(); render(); });
  const pre = $$("#sdFwPre button");
  pre.forEach(b => b.addEventListener("click", () => { $("#sdFwS").value = b.dataset.v; $("#sdFwS").dispatchEvent(new Event("input")); }));
  const syncPre = () => { const v = sS(); pre.forEach(b => b.setAttribute("aria-pressed", Math.abs(+b.dataset.v - v) < .03 ? "true" : "false")); };
  chips($("#sdFwView"), v => { scaled = v === "1"; render(); });
  $("#sdFwNew").onclick = () => { seed++; Z = SDF.noise(n * n, seed); render(); };
  function render() {
    const s = 10 ** sS(), q = Math.sqrt(s * s + sd0 * sd0), fac = scaled ? sd0 / q : 1, y = Float32Array.from(x, (v, k) => (v + s * Z[k]) * fac);
    $("#sdFwA").innerHTML = `x<sub>σ</sub> = x + σ·n at σ = ${SDF.fs(s)}${scaled ? " (rescaled)" : ""}`;
    const lo = (B.dry + .05) * fac, cv = SDF.paint(y, n, n, { color: CM.precip, lo, hi: B.hi * fac, mask: v => v < lo });
    const host = $("#sdFwImg"), { g } = SDF.canvas(host, 280, 280); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, 280, 280);
    // spectrum
    const sp = FFT.spectrum2(Array.from(x, (v, k) => v + s * Z[k]), n), W = 340, H = 218, svg = svgIn($("#sdFwSpec"), W, H);
    const lx = lin(0, Math.log10(64), 46, W - 10), ly = lin(-6, 4, H - 30, 8), P = (k, p) => [lx(Math.log10(k)), ly(clamp(Math.log10(Math.max(p, 1e-9)), -6, 4))];
    [-6, -4, -2, 0, 2, 4].forEach(e => { el("line", { x1: 46, x2: W - 10, y1: ly(e), y2: ly(e), class: "grid" }, svg); SDF.txt(svg, 42, ly(e) + 4, "1e" + e, { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }); });
    [[1, "768"], [4, "192"], [16, "48"], [64, "12 km"]].forEach(([k, l]) => SDF.txt(svg, lx(Math.log10(k)), H - 14, l, { "font-size": 10.5, "text-anchor": k === 64 ? "end" : "middle", class: "mono", fill: css("--muted") }));
    SDF.txt(svg, W - 10, H - 1, "wavelength: large → small scales", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
    let kx = spec0.findIndex(([, p]) => p < s * s); const kStar = kx < 0 ? null : spec0[kx][0];
    if (kStar != null) el("rect", { x: lx(Math.log10(Math.max(1, kStar - .5))), y: 8, width: W - 10 - lx(Math.log10(Math.max(1, kStar - .5))), height: H - 38, fill: css("--lw"), opacity: .08 }, svg);
    el("line", { x1: 46, x2: W - 10, y1: ly(Math.log10(s * s)), y2: ly(Math.log10(s * s)), stroke: css("--muted"), "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
    SDF.txt(svg, W - 12, ly(Math.log10(s * s)) - 5, "noise σ²", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
    el("path", { d: path(sp.map(([k, p]) => P(k, p))), fill: "none", stroke: css("--accent"), "stroke-width": 2.6 }, svg);
    el("path", { d: path(spec0.map(([k, p]) => P(k, p))), fill: "none", stroke: css("--fg"), "stroke-width": 1.8 }, svg);
    SDF.txt(svg, 52, 22, "— clean x", { "font-size": 12, fill: css("--fg"), "font-weight": 600 }); SDF.txt(svg, 52, 38, "— noisy x + σn", { "font-size": 12, fill: css("--accent"), "font-weight": 600 });
    if (kStar != null) SDF.txt(svg, W - 14, 22, "drowned", { "font-size": 12, "text-anchor": "end", fill: css("--lw"), "font-weight": 600 });
    // histogram
    const Wh = 330, Hh = 218, hs = svgIn($("#sdFwHist"), Wh, Hh), Rr = 3.2 * q * fac, nb = 48, bw = 2 * Rr / nb, c0 = new Float64Array(nb), c1 = new Float64Array(nb);
    for (let k = 0; k < x.length; k++) { const a = Math.floor((x[k] * fac + Rr) / bw), b = Math.floor((y[k] + Rr) / bw); if (a >= 0 && a < nb) c0[a]++; if (b >= 0 && b < nb) c1[b]++; }
    const hx = lin(-Rr, Rr, 10, Wh - 10), mx = Math.max(...c1, ...c0) * 1.05, hy = lin(0, mx, Hh - 30, 44);
    c1.forEach((c, b) => el("rect", { x: hx(-Rr + b * bw) + .5, y: hy(c), width: Math.max(.5, hx(bw) - hx(0) - 1), height: hy(0) - hy(c), fill: css("--accent"), opacity: .55 }, hs));
    el("path", { d: path(Array.from(c0, (c, b) => [[hx(-Rr + b * bw), hy(c)], [hx(-Rr + (b + 1) * bw), hy(c)]]).flat()), fill: "none", stroke: css("--fg"), "stroke-width": 1.6 }, hs);
    const sg = s * fac, gp = []; for (let v = -Rr; v <= Rr; v += Rr / 60) gp.push([hx(v), hy(x.length * bw * Math.exp(-.5 * (v / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI)))]);
    el("path", { d: path(gp.map(([a, b]) => [a, Math.max(b, 2)])), fill: "none", stroke: css("--muted"), "stroke-width": 1.4, "stroke-dasharray": "4 3" }, hs);
    el("line", { x1: 10, x2: Wh - 10, y1: Hh - 30, y2: Hh - 30, stroke: css("--line") }, hs);
    [-Rr, 0, Rr].forEach((v, i) => SDF.txt(hs, hx(v), Hh - 14, fmt(v, Rr < 3 ? 2 : 0), { "font-size": 10.5, "text-anchor": ["start", "middle", "end"][i], class: "mono", fill: css("--muted") }));
    SDF.txt(hs, Wh - 10, Hh - 1, scaled ? "pixel value ÷ √(σ² + σ_{data}²)" : "pixel value", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
    SDF.txt(hs, 12, 14, "— clean x: many dry pixels, a tail of storms", { "font-size": 11.5, fill: css("--fg"), "font-weight": 600 });
    SDF.txt(hs, 12, 29, "■ noisy x + σn", { "font-size": 11.5, fill: css("--accent"), "font-weight": 600 });
    SDF.txt(hs, 120, 29, "- - the noise alone, N(0, σ²)", { "font-size": 11.5, fill: css("--muted") });
    const lam = kStar ? 768 / kStar : null;
    $("#sdFwRead").innerHTML = `<div><span>Noise σ</span><b>${SDF.fs(s)}</b></div><div><span>Signal / noise σ<sub>data</sub>/σ</span><b>${sd0 / s >= 10 ? fmtN(sd0 / s) : fmt(sd0 / s, 2)}</b></div><div><span>Smallest scale above the noise</span><b class="${kStar == null ? "c-ok" : kStar <= 1 ? "c-lw" : ""}">${kStar == null ? "all (≥ 12 km)" : kStar <= 1 ? "none" : "≈ " + fmtN(lam) + " km"}</b></div>`;
  }
  syncPre(); render(); return render;
});

/* ───────── 3 · the optimal denoiser ───────── */
demo("sd-denoiser", () => {
  const NX = 56, NY = 32, n = NX * NY;
  const CELLS = [[{ x: 38, y: 10, I: 52, R: 3.4 }], [{ x: 38, y: 22, I: 52, R: 3.4 }], [{ x: 36, y: 9, I: 46, R: 2.6 }, { x: 37, y: 23, I: 46, R: 2.6 }], [{ x: 38, y: 16, I: 32, R: 2.8 }],
    [{ x: 37, y: 16, I: 56, R: 5.6 }], [{ x: 39, y: 15, I: 50, R: 3.3 }, { x: 13, y: 24, I: 46, R: 2.5 }], [{ x: 24, y: 16, I: 52, R: 3.5 }], []];
  const LAB = ["north track", "south track", "split", "weakened", "grew", "new cell", "slow", "dissipated"];
  const X = CELLS.map(c => Float32Array.from(SDF.storm(NX, NY, c), v => v / 60)), U = X.map(f => SDF.url(SDF.paint(f, NX, NY, { lo: 0, hi: 1, mask: v => v < 5 / 60 })));
  let k = 0, seed = 3, Z = SDF.noise(n, seed);
  const sS = slider("sdDnS", v => SDF.fs(10 ** v), render);
  chips($("#sdDnK"), v => { k = +v; render(); });
  $("#sdDnNew").onclick = () => { seed++; Z = SDF.noise(n, seed); render(); };
  function weights(y, s) { const e = X.map(x => { let d = 0; for (let i = 0; i < n; i++) d += (y[i] - x[i]) ** 2; return -d / (2 * s * s); }), m = Math.max(...e), p = e.map(v => Math.exp(v - m)), Zs = p.reduce((a, b) => a + b, 0); return p.map(v => v / Zs); }
  function render() {
    const s = 10 ** sS(), y = Float32Array.from(X[k], (v, i) => v + s * Z[i]), w = weights(y, s), D = new Float32Array(n);
    X.forEach((x, j) => { for (let i = 0; i < n; i++) D[i] += w[j] * x[i]; });
    const mb = .12, s0 = .25, fac = s0 / Math.sqrt(s * s + s0 * s0), yd = Float32Array.from(y, v => mb + (v - mb) * fac);
    const W = 600, H = 350, svg = svgIn($("#sdDnFig"), W, H); arrowDefs(svg, "sdDnAr", css("--muted"));
    const T = (x, yy, t, a) => SDF.txt(svg, x, yy, t, a);
    T(8, 16, `Noisy input: image #${k + 1} + σ·n`, { "font-size": 13, "font-weight": 600 });
    SDF.img(svg, SDF.url(SDF.paint(yd, NX, NY, { lo: 0, hi: 1, mask: v => v < 5 / 60 })), 8, 24, 240, 137); el("rect", { x: 8, y: 24, width: 240, height: 137, rx: 4, fill: "none", stroke: css("--fg"), "stroke-width": 1.5 }, svg);
    el("line", { x1: 128, x2: 128, y1: 166, y2: 190, stroke: css("--muted"), "stroke-width": 2, "marker-end": "url(#sdDnAr)" }, svg);
    T(136, 183, "D: weighted average", { "font-size": 12, fill: css("--muted") });
    T(8, 210, "Denoiser output D(x_σ; σ)", { "font-size": 13, "font-weight": 600, fill: css("--accent") });
    SDF.img(svg, SDF.url(SDF.paint(D, NX, NY, { lo: 0, hi: 1, mask: v => v < 5 / 60 })), 8, 218, 240, 137 - 6); el("rect", { x: 8, y: 218, width: 240, height: 131, rx: 4, fill: "none", stroke: css("--accent"), "stroke-width": 2.5 }, svg);
    T(272, 16, "The 8 training images and their weights w_i", { "font-size": 13, "font-weight": 600 });
    let top = 0; w.forEach((v, j) => { if (v > w[top]) top = j; });
    w.forEach((v, j) => { const c = j % 4, r = Math.floor(j / 4), x0 = 272 + c * 82, y0 = 26 + r * 86, tw = 74, th = 42;
      SDF.img(svg, U[j], x0, y0, tw, th); el("rect", { x: x0, y: y0, width: tw, height: th, rx: 3, fill: "none", stroke: css(j === k ? "--fg" : "--line"), "stroke-width": j === k ? 2.2 : 1 }, svg);
      T(x0 + 3, y0 + 11, j + 1, { "font-size": 10.5, "font-weight": 600, stroke: css("--bg"), "stroke-width": 3, "paint-order": "stroke" });
      el("rect", { x: x0, y: y0 + th + 5, width: tw, height: 9, rx: 2, fill: css("--well") }, svg);
      el("rect", { x: x0, y: y0 + th + 5, width: Math.max(.8, tw * v), height: 9, rx: 2, fill: css(j === top ? "--accent" : "--muted") }, svg);
      T(x0, y0 + th + 26, (v >= .995 ? "100" : v < .005 ? "0" : fmt(100 * v, 0)) + " %", { "font-size": 11.5, class: "mono", fill: css(j === top ? "--accent" : "--muted"), "font-weight": j === top ? 600 : 400 });
      T(x0 + tw - 3, y0 + th - 4, LAB[j], { "font-size": 10, "text-anchor": "end", fill: css("--fg"), stroke: css("--bg"), "stroke-width": 3, "paint-order": "stroke" }); });
    // effective number of images vs σ
    const x0 = 300, x1 = 590, yA = 230, yB = 322, gx = lin(-2, 1.3, x0, x1), gy = lin(1, 8, yB, yA), pts = [];
    for (let l = -2; l <= 1.3001; l += .066) { const ww = weights(Float32Array.from(X[k], (v, i) => v + 10 ** l * Z[i]), 10 ** l); pts.push([gx(l), gy(1 / ww.reduce((a, b) => a + b * b, 0))]); }
    T(272, 210, "How many images does D mix? (effective number 1/Σw²)", { "font-size": 12.5, "font-weight": 600 });
    [1, 4, 8].forEach(v => { el("line", { x1: x0, x2: x1, y1: gy(v), y2: gy(v), class: "grid" }, svg); T(x0 - 6, gy(v) + 4, v, { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }); });
    [[-2, "0.01"], [-1, "0.1"], [0, "1"], [1, "10"]].forEach(([l, t]) => T(gx(l), yB + 15, t, { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }));
    T(x1, H - 2, "σ (log)", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
    el("path", { d: path(pts), fill: "none", stroke: css("--accent"), "stroke-width": 2.4 }, svg);
    const ne = 1 / w.reduce((a, b) => a + b * b, 0);
    el("circle", { cx: gx(Math.log10(s)), cy: gy(ne), r: 6, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 2 }, svg);
    T(x0 + 6, yA + 2, "← sharp: one image", { "font-size": 11, fill: css("--muted") }); T(x1, yA + 2, "mean of all →", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
    $("#sdDnInfo").innerHTML = `top: #${top + 1} (${fmt(100 * w[top], 0)} %) · mixing ≈ ${fmt(ne, 1)} images`;
  }
  render(); return render;
});

/* ───────── 4 · the arrow field in a two-pixel world ───────── */
demo("sd-field", slide => {
  const r = rng(808), pts = [], cls = [];
  [[1, 0, 0, 6], [0, 1, 1, 6], [0, 0, 2, 12]].forEach(([a, b, c, m]) => { for (let i = 0; i < m; i++) { pts.push([a + .07 * gauss(r), b + .07 * gauss(r)]); cls.push(c); } });
  const G = SDF.gmm(pts, pts.map(() => 1), 0, cls), resp = new Float64Array(pts.length);
  const W = 440, host = $("#sdFdMap"); host.style.maxWidth = "440px"; host.style.margin = "0 auto";
  let parts = [], raf = 0, hov = null;
  const sS = slider("sdFdS", v => SDF.fs(10 ** v), () => render());
  const setS = l => { const R = $("#sdFdS"); R.value = l; R.parentElement.querySelector("output").textContent = SDF.fs(10 ** l); };
  function stepAll() {
    const l = sS(), s = 10 ** l, l1 = Math.max(-2, l - .022), s1 = 10 ** l1;
    parts.forEach(p => { const d = SDF.gmmD(G, p.x, p.y, s); p.x += (s1 - s) * (p.x - d[0]) / s; p.y += (s1 - s) * (p.y - d[1]) / s; p.tr.push([p.x, p.y]); });
    setS(l1); return l1 > -2;
  }
  function loop() { if (!slide.classList.contains("on")) { raf = 0; return; } const more = stepAll(); render(); raf = more ? requestAnimationFrame(loop) : 0; }
  const play = () => { if (!raf) raf = requestAnimationFrame(loop); };
  $("#sdFdDrop").onclick = () => { setS(0); const rr = rng(Date.now() % 1e6); for (let i = 0; i < 20; i++) { const x = .33 + gauss(rr), y = .33 + gauss(rr); parts.push({ x, y, tr: [[x, y]] }); } play(); };
  $("#sdFdClr").onclick = () => { parts = []; render(); };
  $("#sdFdStop").onclick = () => { cancelAnimationFrame(raf); raf = 0; };
  let wired = false;
  function render() {
    const s = 10 ** sS(), { c, g } = SDF.canvas(host, W, W);
    if (!wired) { wired = true;
      c.addEventListener("click", e => { const [a, b] = SDF.at(c, e), P = SDF.plane(W), x = P.iX(a), y = P.iY(b); parts.push({ x, y, tr: [[x, y]] }); if (parts.length > 60) parts.shift(); play(); });
      c.addEventListener("mousemove", e => { const [a, b] = SDF.at(c, e), P = SDF.plane(W); hov = [P.iX(a), P.iY(b)]; if (!raf) render(); });
      c.addEventListener("mouseleave", () => { hov = null; if (!raf) render(); }); }
    const P = SDF.shade(g, W, (x, y) => SDF.gmmP(G, x, y, s), "--muted", 72, .7, "fld" + s);
    // arrows
    const nA = 15, cell = W / nA, ac = css("--fg");
    for (let j = 0; j < nA; j++) for (let i = 0; i < nA; i++) { const px = (i + .5) * cell, py = (j + .5) * cell, x = P.iX(px), y = P.iY(py), d = SDF.gmmD(G, x, y, s);
      const vx = P.X(d[0]) - px, vy = P.Y(d[1]) - py, L = Math.hypot(vx, vy), m = Math.min(L, cell * .92) / (L || 1);
      g.globalAlpha = .75; SDF.arrow(g, px, py, px + vx * m, py + vy * m, ac, 1.3, 5); }
    g.globalAlpha = 1;
    pts.forEach((p, k) => { g.fillStyle = css(SDF.CLS[cls[k]]); g.strokeStyle = css("--bg"); g.lineWidth = 1.2; g.beginPath(); g.arc(P.X(p[0]), P.Y(p[1]), 4, 0, 7); g.fill(); g.stroke(); });
    SDF.axisLabels(g, W, P);
    // particles
    parts.forEach(p => { g.strokeStyle = css("--sw"); g.lineWidth = 2; g.beginPath(); p.tr.forEach(([x, y], i) => i ? g.lineTo(P.X(x), P.Y(y)) : g.moveTo(P.X(x), P.Y(y))); g.stroke();
      g.fillStyle = css("--sw"); g.strokeStyle = css("--bg"); g.beginPath(); g.arc(P.X(p.x), P.Y(p.y), 5.5, 0, 7); g.fill(); g.stroke(); });
    let rd = ["—", "—", "—"];
    if (hov) { const d = SDF.gmmD(G, hov[0], hov[1], s, resp), cw = [0, 0, 0]; resp.forEach((v, k) => { cw[cls[k]] += v; }); rd = cw.map(v => fmt(100 * v, 0) + " %");
      g.setLineDash([4, 3]); g.strokeStyle = css("--accent"); g.lineWidth = 2; g.beginPath(); g.moveTo(P.X(hov[0]), P.Y(hov[1])); g.lineTo(P.X(d[0]), P.Y(d[1])); g.stroke(); g.setLineDash([]);
      g.fillStyle = css("--accent"); g.beginPath(); g.arc(P.X(d[0]), P.Y(d[1]), 6, 0, 7); g.fill();
      g.font = "600 13px " + css("--f-body"); g.textAlign = "left"; g.strokeStyle = css("--bg"); g.lineWidth = 3.5; g.strokeText("D(x; σ)", P.X(d[0]) + 8, P.Y(d[1]) - 6); g.fillText("D(x; σ)", P.X(d[0]) + 8, P.Y(d[1]) - 6); }
    $("#sdFdRead").innerHTML = `<div><span>σ</span><b>${SDF.fs(s)}</b></div>` + rd.map((v, k) => `<div><span>p(${SDF.CLSN[k]})</span><b style="color:var(${SDF.CLS[k]})">${v}</b></div>`).join("");
  }
  render(); return render;
});

/* ───────── 5 · live training: a tiny diffusion model in the browser ───────── */
const SDNET = (() => {
  // 3 inputs (c_in·x1, c_in·x2, c_noise) → H → H (SiLU) → 2 outputs F
  function make(H, seed) {
    const r = rng(seed), o = { W1: 0, b1: 3 * H, W2: 4 * H, b2: 4 * H + H * H, W3: 5 * H + H * H, b3: 7 * H + H * H }, N = 7 * H + H * H + 2;
    const P = new Float64Array(N), Gr = new Float64Array(N), M = new Float64Array(N), V = new Float64Array(N);
    for (let i = 0; i < 3 * H; i++) P[o.W1 + i] = gauss(r) * Math.sqrt(2 / 3);
    for (let i = 0; i < H * H; i++) P[o.W2 + i] = gauss(r) * Math.sqrt(2 / H);
    for (let i = 0; i < 2 * H; i++) P[o.W3 + i] = gauss(r) * .1 / Math.sqrt(H);
    const z1 = new Float64Array(H), a1 = new Float64Array(H), z2 = new Float64Array(H), a2 = new Float64Array(H), g1 = new Float64Array(H), g2 = new Float64Array(H), out = [0, 0];
    let t = 0;
    function fwd(x0, x1, x2) {
      for (let h = 0; h < H; h++) { const z = P[o.W1 + 3 * h] * x0 + P[o.W1 + 3 * h + 1] * x1 + P[o.W1 + 3 * h + 2] * x2 + P[o.b1 + h]; z1[h] = z; a1[h] = z / (1 + Math.exp(-z)); }
      for (let h = 0; h < H; h++) { let z = P[o.b2 + h]; const b = o.W2 + h * H; for (let k = 0; k < H; k++) z += P[b + k] * a1[k]; z2[h] = z; a2[h] = z / (1 + Math.exp(-z)); }
      let u = P[o.b3], v = P[o.b3 + 1]; for (let k = 0; k < H; k++) { u += P[o.W3 + k] * a2[k]; v += P[o.W3 + H + k] * a2[k]; } out[0] = u; out[1] = v; return out;
    }
    // accumulate gradients for dL/dout = (d0, d1), after fwd on the same inputs
    function back(d0, d1, x0, x1, x2) {
      Gr[o.b3] += d0; Gr[o.b3 + 1] += d1;
      for (let k = 0; k < H; k++) { Gr[o.W3 + k] += d0 * a2[k]; Gr[o.W3 + H + k] += d1 * a2[k]; const sg = 1 / (1 + Math.exp(-z2[k])); g2[k] = (d0 * P[o.W3 + k] + d1 * P[o.W3 + H + k]) * sg * (1 + z2[k] * (1 - sg)); }
      g1.fill(0);
      for (let h = 0; h < H; h++) { const gh = g2[h]; if (gh === 0) continue; Gr[o.b2 + h] += gh; const b = o.W2 + h * H; for (let k = 0; k < H; k++) { Gr[b + k] += gh * a1[k]; g1[k] += gh * P[b + k]; } }
      for (let h = 0; h < H; h++) { const sg = 1 / (1 + Math.exp(-z1[h])), gh = g1[h] * sg * (1 + z1[h] * (1 - sg)); Gr[o.b1 + h] += gh; Gr[o.W1 + 3 * h] += gh * x0; Gr[o.W1 + 3 * h + 1] += gh * x1; Gr[o.W1 + 3 * h + 2] += gh * x2; }
    }
    // Adam (Kingma & Ba 2015): β1 = 0.9, β2 = 0.999, ε = 1e-8
    function adam(lr) { t++; const b1 = .9, b2 = .999, c1 = 1 - b1 ** t, c2 = 1 - b2 ** t;
      for (let i = 0; i < N; i++) { const gi = Gr[i]; M[i] = b1 * M[i] + (1 - b1) * gi; V[i] = b2 * V[i] + (1 - b2) * gi * gi; P[i] -= lr * (M[i] / c1) / (Math.sqrt(V[i] / c2) + 1e-8); Gr[i] = 0; } }
    // the denoiser with EDM pre-conditioning
    function D(y1, y2, s) { const c = SDF.pre(s), F = fwd(c.cin * y1, c.cin * y2, c.cn); return [c.skip * y1 + c.out * F[0], c.skip * y2 + c.out * F[1]]; }
    return { N, H, fwd, back, adam, D, P };
  }
  return { make };
})();

demo("sd-live", slide => {
  const SMN = .01, SMX = 4, BATCH = 128;
  let dist = "storms", G = SDF.DIST.storms(), lr = .002, H = 32, net, it, hist, ema, run = false, raf = 0, frameMs = 0, samples = null, sampIt = 0, diverged = false, ex = null, VAL, best;
  const r = rng(2026);
  const sS = slider("sdLvS", v => SDF.fs(10 ** v), () => { if (!run) draw(); });
  function makeVal() { const rv = rng(99), V = []; for (let i = 0; i < 400; i++) { const [x1, x2] = SDF.gmmDraw(G, rv), s = Math.exp(Math.log(SMN) + rv() * Math.log(SMX / SMN)), n1 = gauss(rv), n2 = gauss(rv); V.push([x1, x2, s, x1 + s * n1, x2 + s * n2]); }
    VAL = V; let L = 0; V.forEach(([x1, x2, s, y1, y2]) => { const c = SDF.pre(s), d = SDF.gmmD(G, y1, y2, s); L += (((d[0] - x1) / c.out) ** 2 + ((d[1] - x2) / c.out) ** 2) / 2; }); best = L / V.length; }
  function reset() { net = SDNET.make(H, 7 + H); it = 0; hist = []; ema = null; samples = null; diverged = false; ex = null; makeVal(); }
  function valLoss() { let L = 0; VAL.forEach(([x1, x2, s, y1, y2]) => { const c = SDF.pre(s), d = net.D(y1, y2, s); L += (((d[0] - x1) / c.out) ** 2 + ((d[1] - x2) / c.out) ** 2) / 2; }); return L / VAL.length; }
  // one training iteration: batch of clean points, σ log-uniform, add noise, predict, EDM-weighted squared error, backprop, Adam
  function trainStep() {
    let L = 0;
    for (let b = 0; b < BATCH; b++) {
      const [x1, x2] = SDF.gmmDraw(G, r), s = Math.exp(Math.log(SMN) + r() * Math.log(SMX / SMN)), y1 = x1 + s * gauss(r), y2 = x2 + s * gauss(r), c = SDF.pre(s);
      const t1 = (x1 - c.skip * y1) / c.out, t2 = (x2 - c.skip * y2) / c.out, F = net.fwd(c.cin * y1, c.cin * y2, c.cn), e1 = F[0] - t1, e2 = F[1] - t2;
      L += (e1 * e1 + e2 * e2) / 2;
      if (b === 0) ex = { x1, x2, s, y1, y2, d1: c.skip * y1 + c.out * F[0], d2: c.skip * y2 + c.out * F[1], l: (e1 * e1 + e2 * e2) / 2 };
      net.back(e1 / BATCH, e2 / BATCH, c.cin * y1, c.cin * y2, c.cn);
    }
    net.adam(lr); it++; L /= BATCH;
    if (!isFinite(L) || L > 1e6) diverged = true;
    ema = ema == null ? L : .97 * ema + .03 * L;
  }
  function sampleNow() {
    const rs = rng(5 + it), N = 20, T = SDF.sched(N, SMX, SMN), out = [];
    for (let k = 0; k < 200; k++) { let x = SMX * gauss(rs), y = SMX * gauss(rs);
      for (let i = 0; i < N; i++) { const t = T[i], t1 = T[i + 1], d = net.D(x, y, t), dx = (x - d[0]) / t, dy = (y - d[1]) / t; let nx = x + (t1 - t) * dx, ny = y + (t1 - t) * dy;
        if (t1 > 0) { const d2 = net.D(nx, ny, t1); nx = x + (t1 - t) * (dx + (nx - d2[0]) / t1) / 2; ny = y + (t1 - t) * (dy + (ny - d2[1]) / t1) / 2; }
        x = nx; y = ny; }
      out.push([x, y]); }
    samples = out; sampIt = it;
  }
  function stop() { run = false; cancelAnimationFrame(raf); raf = 0; $("#sdLvPlay").textContent = "▶ Train"; }
  function loop() {
    if (!run || !slide.classList.contains("on")) { stop(); return; }
    const t0 = performance.now(); let k = 0;
    if (!diverged) do { trainStep(); k++; } while (performance.now() - t0 < 11 && k < 40 && !diverged);
    if (it % 4 === 0 || k > 1) hist.push([it, ema, valLoss()]);
    if (hist.length > 400) hist = hist.filter((_, i) => i % 2 === 0 || i === hist.length - 1);
    draw(); frameMs = performance.now() - t0;
    if (diverged) { stop(); draw(); return; }
    raf = requestAnimationFrame(loop);
  }
  $("#sdLvPlay").onclick = () => { if (run) { stop(); return; } if (diverged) reset(); run = true; $("#sdLvPlay").textContent = "❚❚ Pause"; raf = requestAnimationFrame(loop); };
  $("#sdLvReset").onclick = () => { stop(); reset(); draw(); };
  $("#sdLvSamp").onclick = () => { if (diverged) return; sampleNow(); draw(); };
  chips($("#sdLvData"), v => { dist = v; G = SDF.DIST[v](); stop(); reset(); draw(); });
  chips($("#sdLvLr"), v => { lr = +v; draw(); });
  chips($("#sdLvW"), v => { H = +v; stop(); reset(); draw(); });
  // a field panel: background density (truth, faint), arrows D(x; σ) − x
  function field(host, Dfn, tok, s) {
    const W = 300, { g } = SDF.canvas(host, W, W), P = SDF.shade(g, W, (x, y) => SDF.gmmP(G, x, y, s), "--muted", 60, .5, dist + s), nA = 13, cell = W / nA, col = css(tok);
    for (let j = 0; j < nA; j++) for (let i = 0; i < nA; i++) { const px = (i + .5) * cell, py = (j + .5) * cell, d = Dfn(P.iX(px), P.iY(py), s);
      if (!isFinite(d[0]) || !isFinite(d[1])) continue;
      const vx = P.X(d[0]) - px, vy = P.Y(d[1]) - py, L = Math.hypot(vx, vy), m = Math.min(L, cell * .95) / (L || 1); SDF.arrow(g, px, py, px + vx * m, py + vy * m, col, 1.5, 5); }
    SDF.axisLabels(g, W, P, "x₁", "x₂");
  }
  function draw() {
    const s = 10 ** sS();
    field($("#sdLvNet"), (x, y, t) => net.D(x, y, t), "--accent", s);
    field($("#sdLvEx"), (x, y, t) => SDF.gmmD(G, x, y, t), "--fg", s);
    // samples
    const W = 300, { g } = SDF.canvas($("#sdLvSm"), W, W), P = SDF.shade(g, W, (x, y) => SDF.gmmP(G, x, y, .01), "--muted", 60, .5, dist + "clean");
    if (samples) { g.fillStyle = css("--accent"); samples.forEach(([x, y]) => { g.beginPath(); g.arc(clamp(P.X(x), 2, W - 2), clamp(P.Y(y), 2, W - 2), 2.6, 0, 7); g.fill(); }); }
    else { g.fillStyle = css("--muted"); g.font = "13px " + css("--f-body"); g.textAlign = "center"; g.fillText("press 🎲 Sample now", W / 2, W / 2); }
    SDF.axisLabels(g, W, P, "x₁", "x₂");
    $("#sdLvSmH").textContent = samples ? `200 samples · iteration ${fmtN(sampIt)}` : "Samples from the network";
    // loss curve
    const last = hist.length ? hist[hist.length - 1] : null, xmax = Math.max(200, it), lo = best * .95, hi = best * 1.8;
    const ser = [{ pts: hist.map(([i, , v]) => [i, clamp(v, lo, hi)]), col: "--accent", label: "validation loss", w: 2.4 }, { pts: hist.map(([i, e]) => [i, clamp(e, lo, hi)]), col: "--muted", label: "training (avg)", w: 1.2 },
      { pts: [[0, best], [xmax, best]], col: "--ok", label: "best possible", dash: "5 4", w: 1.6 }];
    VIZ.curves($("#sdLvLoss"), ser, { xr: [0, xmax], yr: [lo, hi], W: 300, H: 170, xl: "iterations", yl: "loss", xf: v => fmtN(v), yf: v => fmt(v, 2), legendAt: "tr" });
    $("#sdLvRead").innerHTML = `<div><span>Iterations</span><b>${fmtN(it)}</b></div><div><span>Val. loss</span><b class="${diverged ? "c-lw" : ""}">${diverged ? "diverged" : last ? fmt(last[2], 3) : "—"}</b></div><div><span>Above best</span><b>${last && !diverged ? "+" + fmt(100 * (last[2] / best - 1), 0) + " %" : "—"}</b></div><div><span>Parameters</span><b>${fmtN(net.N)}</b></div><div><span>ms / frame</span><b>${fmt(frameMs, 0)}</b></div>`;
    $("#sdLvCard").innerHTML = diverged ? `<p><b style="color:var(--lw)">Training diverged.</b> The learning rate is too large: Adam's steps overshoot and the loss explodes. Choose a smaller rate and press ▶ (it resets).</p>`
      : ex ? `<p><b>One example from the last batch</b> (iteration ${fmtN(it)}): clean x = (${fmt(ex.x1, 2)}, ${fmt(ex.x2, 2)}) · σ = ${SDF.fs(ex.s)} · noisy x<sub>σ</sub> = (${fmt(ex.y1, 2)}, ${fmt(ex.y2, 2)}) · network's guess D = (${fmt(ex.d1, 2)}, ${fmt(ex.d2, 2)}) · weighted error λ(σ)‖D − x‖²/2 = ${fmt(ex.l, 3)}. Repeat ${BATCH}× per batch, average, backpropagate, one Adam step.</p>`
      : `<p><b>Before training</b> the network's output F is near zero, so D ≈ c<sub>skip</sub>·x: arrows only shrink towards the origin. The loss can never reach 0: the green line is the error of the exact denoiser, which still cannot know the noise.</p>`;
  }
  reset(); draw(); return draw;
});

/* ───────── 6 · sampling ───────── */
demo("sd-sample", slide => {
  const G = SDF.DIST.storms(), SMX = 4, SMN = .01, NS = 80, r0 = rng(31);
  const Z0 = Array.from({ length: NS }, () => [gauss(r0), gauss(r0)]), CH = Array.from({ length: NS }, (_, k) => rng(500 + k));
  let alg = "heun", timer = null, TR = null;
  const nS = slider("sdSmN", v => String(v), () => { stop(); compute(); const R = $("#sdSmI"); R.max = nS(); R.value = nS(); R.parentElement.querySelector("output").textContent = nS(); render(); });
  const iS = slider("sdSmI", v => String(v), () => render());
  chips($("#sdSmAlg"), v => { alg = v; compute(); render(); });
  function compute() {
    const N = nS(), T = SDF.sched(N, SMX, SMN), paths = [], ends = [];
    let evals = 0;
    for (let k = 0; k < NS; k++) { const rr = rng(900 + k); let x = SMX * Z0[k][0], y = SMX * Z0[k][1]; const tr = [[x, y]];
      for (let i = 0; i < N; i++) { const t = T[i], t1 = T[i + 1], gm = alg === "churn" ? Math.min(20 / N, Math.SQRT2 - 1) : 0, th = t * (1 + gm);
        if (gm) { const e = Math.sqrt(th * th - t * t) * 1.003; x += e * gauss(rr); y += e * gauss(rr); }
        const d = SDF.gmmD(G, x, y, th), dx = (x - d[0]) / th, dy = (y - d[1]) / th; let nx = x + (t1 - th) * dx, ny = y + (t1 - th) * dy; if (k === 0) evals++;
        if (alg !== "euler" && t1 > 0) { const d2 = SDF.gmmD(G, nx, ny, t1); nx = x + (t1 - th) * (dx + (nx - d2[0]) / t1) / 2; ny = y + (t1 - th) * (dy + (ny - d2[1]) / t1) / 2; if (k === 0) evals++; }
        x = nx; y = ny; tr.push([x, y]); }
      let c = 3, bd = Infinity; G.mu.forEach((m, j) => { const dd = Math.hypot(x - m[0], y - m[1]); if (dd < bd) { bd = dd; c = j; } }); if (bd > .25) c = 3;
      paths.push(tr); ends.push(c); }
    TR = { paths, ends, T, evals, N };
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } $("#sdSmPlay").textContent = "▶ Play"; }
  $("#sdSmPlay").onclick = () => { if (timer) { stop(); return; } const R = $("#sdSmI"); if (+R.value >= +R.max) R.value = 0; $("#sdSmPlay").textContent = "❚❚ Pause";
    const dt = Math.max(60, Math.min(400, 2400 / +R.max));
    timer = setInterval(() => { if (!slide.classList.contains("on") || +R.value >= +R.max) { stop(); return; } R.value = +R.value + 1; R.dispatchEvent(new Event("input")); }, dt); };
  const COL = [...SDF.CLS, "--muted"];
  function render() {
    const { paths, ends, T, evals, N } = TR, i = Math.min(iS(), N), W = 320, { g } = SDF.canvas($("#sdSmMap"), W, W);
    const P = SDF.shade(g, W, (x, y) => SDF.gmmP(G, x, y, .01), "--muted", 60, .5, "smp");
    paths.forEach((tr, k) => { g.strokeStyle = css(COL[ends[k]]); g.globalAlpha = .35; g.lineWidth = 1.2; g.beginPath(); tr.slice(0, i + 1).forEach(([x, y], j) => j ? g.lineTo(P.X(x), P.Y(y)) : g.moveTo(P.X(x), P.Y(y))); g.stroke(); });
    g.globalAlpha = 1; paths.forEach((tr, k) => { const [x, y] = tr[i]; g.fillStyle = css(COL[ends[k]]); g.strokeStyle = css("--bg"); g.lineWidth = 1; g.beginPath(); g.arc(clamp(P.X(x), 3, W - 3), clamp(P.Y(y), 3, W - 3), 3.6, 0, 7); g.fill(); g.stroke(); });
    SDF.axisLabels(g, W, P);
    g.fillStyle = css("--fg"); g.font = "600 12px " + css("--f-body"); g.textAlign = "right"; g.fillText(i < N ? `step ${i}: σ = ${SDF.fs(T[i])}` : `done (step ${N}, σ = 0)`, W - 8, 16);
    // pixel A vs step
    const Wp = 380, Hp = 250, svg = svgIn($("#sdSmPath"), Wp, Hp), x = lin(0, N, 42, Wp - 10), y = lin(-2.5, 3, Hp - 26, 8), cy = v => y(clamp(v, -2.5, 3));
    [0, 1].forEach(v => el("rect", { x: 42, y: y(v + .2), width: Wp - 52, height: y(v - .2) - y(v + .2), fill: css(v ? "--lw" : "--ok"), opacity: .1 }, svg));
    [-2, 0, 1, 2].forEach(v => SDF.txt(svg, 38, y(v) + 4, v, { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }));
    paths.forEach((tr, k) => el("path", { d: path(tr.map(([a], j) => [x(j), cy(a)])), fill: "none", stroke: css(COL[ends[k]]), "stroke-width": 1.1, opacity: .45 }, svg));
    el("line", { x1: x(i), x2: x(i), y1: 8, y2: Hp - 26, stroke: css("--accent"), "stroke-width": 2 }, svg);
    [[0, "no storm or over B", "--ok"], [1, "storm over A", "--lw"]].forEach(([v, l, t]) => SDF.txt(svg, x(N) - 6, y(v) - 7, l, { "font-size": 11.5, "text-anchor": "end", fill: css(t), "font-weight": 600, stroke: css("--card"), "stroke-width": 4, "paint-order": "stroke" }));
    const tks = N <= 12 ? Array.from({ length: N + 1 }, (_, j) => j) : [0, Math.round(N / 4), Math.round(N / 2), Math.round(3 * N / 4), N];
    tks.forEach(j => SDF.txt(svg, x(j), Hp - 10, j, { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }));
    SDF.txt(svg, 44, Hp - 1, "step (σ: 4 → 0)", { "font-size": 11, fill: css("--muted") }); SDF.txt(svg, 4, 8, "pixel A", { "font-size": 11, fill: css("--muted") });
    const cnt = [0, 0, 0, 0]; ends.forEach(c => cnt[c]++);
    $("#sdSmRead").innerHTML = `<div><span>Network calls</span><b>${evals}</b></div><div><span>Between clusters</span><b class="${cnt[3] > 4 ? "c-lw" : "c-ok"}">${fmt(100 * cnt[3] / NS, 0)} %</b></div><div><span>A · B · none</span><b style="font-size:16px">${[0, 1, 2].map(c => fmt(100 * cnt[c] / NS, 0)).join(" · ")} %</b></div>`;
    $("#sdSmCard").innerHTML = N === 1 && alg !== "churn" ? `<p><b>One step</b> (Euler and Heun are the same here) jumps straight to D(x; σ<sub>max</sub>): the average of everything. All samples land in the middle: blurry, like an MSE forecast.</p>`
      : cnt[3] > 8 ? `<p><b>Too few steps.</b> Each step trusts the slope at one point; with big jumps the samples overshoot or stop between the kinds of future. Target shares: 25 · 25 · 50 %.</p>`
      : alg === "churn" ? `<p><b>Churn</b> adds a little fresh noise before each step and removes it again; this corrects errors made in earlier steps. StormScope uses "stochastic perturbations" too (§4.2.3).</p>`
      : `<p><b>Enough steps.</b> Samples end on the data and in the right proportions (target 25 · 25 · 50 %). The same start noise always gives the same sample: the ODE is deterministic.</p>`;
  }
  compute(); render(); return render;
});

/* ───────── 7 · conditioning ───────── */
demo("sd-cond", slide => {
  let step = 0, mode = "now";
  const NX = 56, NY = 32, rz = SDF.noise(NX * NY, 12);
  const fut = SDF.storm(NX, NY, [{ x: 36, y: 15, I: 50, R: 3.4 }]);
  const noisy = SDF.url(SDF.paint(Float32Array.from(fut, (v, k) => .55 * v / 60 + .45 * (.3 + .35 * rz[k])), NX, NY, { lo: 0, hi: 1, mask: v => v < 5 / 60 }));
  const past = Array.from({ length: 6 }, (_, k) => SDF.url(SDF.dbz(SDF.storm(NX, NY, [{ x: 12 + 4 * k, y: 18 - .5 * k, I: 40 + 2 * k, R: 2.6 + .15 * k }]), NX, NY)));
  const outU = SDF.url(SDF.dbz(fut, NX, NY));
  const grad = (f, cm, lo, hi) => { const a = new Float32Array(NX * NY); for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) a[j * NX + i] = f(i / NX, j / NY); return SDF.url(SDF.paint(a, NX, NY, { color: cm, lo, hi })); };
  const latU = grad((u, v) => 1 - v, CM.vir, 0, 1), lonU = grad(u => u, CM.vir, 0, 1), szaU = grad((u, v) => Math.cos(1.4 * (u - .7)) * (1 - .25 * v), CM.temp, .2, 1.05);
  const z5 = FFT.noise2(64, { beta: 5, seed: 9 }), gfsU = grad((u, v) => z5[Math.floor(v * 32) * 64 + Math.floor(u * 64)] - 1.6 * v, CM.vir, -3, 2);
  chips($("#sdCdStep"), v => { step = +v; diagram(); });
  chips($("#sdCdMode"), v => { mode = v; diagram(); });
  const CARD = [
    ["① The noisy future", "The thing being denoised: the future frame x<sub>t+</sub> plus noise of size σ. At sampling time it starts as pure noise. Satellite model: 8 GOES channels; radar model: 1 MRMS channel (Table 1)."],
    ["② The past states", m => m === "now" ? "Nowcast: the <b>6 previous states, 10 min apart</b> (the past hour) are stacked as extra channels (§4.2.3). They are clean: only the future is noised." : "Nearcast: <b>one state, 1 h earlier</b> (§4.2.3), plus GFS in ⑤. The radar model also gets the satellite frames (§4.2.1, Fig. 11)."],
    ["③ Latitude and longitude", "Two fixed maps that tell the network <b>where</b> each pixel is: storms behave differently over the Rockies than over the Gulf coast (§4.2.2)."],
    ["④ Solar zenith angle", "Computed from the date and time (§4.2.3, 'static or dynamic conditioning c'): visible channels are dark at night, and convection has a daily cycle."],
    ["⑤ GFS, nearcast only", m => m === "near" ? "One GFS channel for large-scale context: <b>500 hPa height</b> for the satellite model, <b>simulated composite reflectivity</b> for the radar model (Table 2, §4.2.1). Kept to a single channel on purpose." : "<b>Not used in nowcast mode</b>: nowcasts need only observations (Table 2). Switch the mode to see it."],
    ["⑥ The noise level σ", "σ is not a picture: it enters every transformer block through the <b>conditional (adaptive) layer norm</b> (§4.2.2), after EDM's c<sub>noise</sub> = ¼ ln σ."],
    ["⑦ Concatenate → D<sub>θ</sub>", "All maps are stacked along the channel axis into one input tensor on the 512 × 896 grid (§4.2.2), then cut into 4 × 4 patches. The network learns D(x<sub>σ</sub>; past, c, σ) and so p(future | past, c)."]];
  function diagram() {
    const W = 1000, H = 200, svg = svgIn($("#sdCdFig"), W, H); arrowDefs(svg, "sdCdAr", css("--muted"));
    const op = (...k) => step === 6 || k.includes(step) ? 1 : .28, T = (p, x, y, s, a) => SDF.txt(p, x, y, s, a);
    const rowY = [6, 45, 84, 123, 162], th = 32, tw = 56;
    const R = (k, tok, label, sub, draw) => { const g = el("g", { opacity: op(k) }, svg), y = rowY[k];
      draw(g, y); T(g, 290, y + 14, label, { "font-size": 13.5, "font-weight": 600, fill: css(tok) }); T(g, 290, y + 29, sub, { "font-size": 11.5, fill: css("--muted") });
      if (step === k) el("rect", { x: 4, y: y - 3, width: 552, height: th + 7, rx: 8, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, svg);
      el("line", { x1: 556, x2: 600, y1: y + th / 2, y2: 100, stroke: css(tok), "stroke-width": 1.6, opacity: op(k) }, svg); };
    const pic = (g, u, x, y, tok, w = tw) => { SDF.img(g, u, x, y, w, th); el("rect", { x, y, width: w, height: th, rx: 3, fill: "none", stroke: css(tok), "stroke-width": 1.6 }, g); };
    R(0, "--accent", "noisy future x_{t+} + σ·n", "8 GOES ch. (satellite model) or 1 MRMS ch. (radar)", (g, y) => pic(g, noisy, 12, y, "--accent"));
    R(1, "--cool", mode === "now" ? "past states x_{t−}: 6 frames, 10 min apart" : "past state x_{t−}: 1 frame, 1 h earlier", mode === "now" ? "the last hour of observations" : "+ satellite frames for the radar model", (g, y) => {
      if (mode === "now") past.forEach((u, k) => pic(g, u, 12 + k * 38, y, "--cool", tw)); else pic(g, past[5], 12, y, "--cool"); });
    R(2, "--muted", "latitude, longitude", "static maps: where each pixel is", (g, y) => { pic(g, latU, 12, y, "--muted"); pic(g, lonU, 74, y, "--muted"); });
    R(3, "--sw", "cos(solar zenith angle)", "from date and time: day / night", (g, y) => pic(g, szaU, 12, y, "--sw"));
    R(4, "--muted", mode === "near" ? "GFS: one coarse NWP channel" : "GFS: not used (nowcast)", mode === "near" ? "z500 (satellite) · sim. reflectivity (radar)" : "observations only", (g, y) => {
      if (mode === "near") pic(g, gfsU, 12, y, "--muted"); else { el("rect", { x: 12, y, width: tw, height: th, rx: 3, fill: "none", stroke: css("--muted"), "stroke-dasharray": "4 3" }, g); T(g, 40, y + 21, "—", { "text-anchor": "middle", fill: css("--muted") }); } });
    // concatenated tensor
    const gC = el("g", { opacity: op(6) }, svg), toks = ["--accent", "--cool", "--muted", "--sw", "--muted"], hs = mode === "near" ? [4, 1, 2, 1, 1] : [4, 6, 2, 1, 0], tot = hs.reduce((a, b) => a + b, 0);
    let yy = 28; hs.forEach((h, k) => { if (!h) return; const hh = 144 * h / tot; el("rect", { x: 604, y: yy, width: 46, height: hh - 1.5, fill: css(toks[k]), opacity: .75 }, gC); yy += hh; });
    el("rect", { x: 604, y: 28, width: 46, height: 144, fill: "none", stroke: css("--fg"), "stroke-width": 1.4 }, gC);
    T(gC, 627, 22, "stack", { "font-size": 12, "text-anchor": "middle", "font-weight": 600 }); T(gC, 627, 188, "channels × 512 × 896", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") });
    el("line", { x1: 654, x2: 716, y1: 100, y2: 100, stroke: css("--muted"), "stroke-width": 2, "marker-end": "url(#sdCdAr)", opacity: op(6) }, svg);
    const gD = el("g", { opacity: op(5, 6) }, svg);
    el("rect", { x: 722, y: 56, width: 130, height: 90, rx: 12, fill: css("--accent"), "fill-opacity": .12, stroke: css("--accent"), "stroke-width": 2.2 }, gD);
    T(gD, 787, 88, "D_θ", { "font-size": 20, "text-anchor": "middle", "font-weight": 700, fill: css("--accent") }); T(gD, 787, 110, "DiT, 16 blocks", { "font-size": 12, "text-anchor": "middle" }); T(gD, 787, 126, "195 M parameters", { "font-size": 11.5, "text-anchor": "middle", fill: css("--muted") });
    const gS = el("g", { opacity: op(5) }, svg);
    el("rect", { x: 752, y: 6, width: 70, height: 26, rx: 13, fill: css("--card"), stroke: css("--arch"), "stroke-width": 1.8 }, gS); T(gS, 787, 24, "σ", { "font-size": 15, "text-anchor": "middle", "font-style": "italic", fill: css("--arch"), "font-weight": 600 });
    el("line", { x1: 787, x2: 787, y1: 33, y2: 52, stroke: css("--arch"), "stroke-width": 2, "marker-end": "url(#sdCdAr)" }, gS); T(gS, 794, 49, "adaLN", { "font-size": 11, fill: css("--arch") });
    if (step === 5) el("rect", { x: 746, y: 2, width: 82, height: 34, rx: 16, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, svg);
    if (step === 6) el("rect", { x: 598, y: 2, width: 260, height: 196, rx: 10, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, svg);
    el("line", { x1: 856, x2: 880, y1: 100, y2: 100, stroke: css("--muted"), "stroke-width": 2, "marker-end": "url(#sdCdAr)" }, svg);
    SDF.img(svg, outU, 884, 70, 108, 62); el("rect", { x: 884, y: 70, width: 108, height: 62, rx: 4, fill: "none", stroke: css("--fg"), "stroke-width": 1.6 }, svg);
    T(svg, 938, 62, "denoised future", { "font-size": 12, "text-anchor": "middle", "font-weight": 600 }); T(svg, 938, 150, "≈ x_{t+}", { "font-size": 12, "text-anchor": "middle", fill: css("--muted") });
    const c = CARD[step], body = typeof c[1] === "function" ? c[1](mode) : c[1];
    $("#sdCdCard").innerHTML = `<h4 style="color:var(--accent)">${c[0]}</h4><p>${body}</p>`;
  }
  // toy: the condition moves and reshapes the target distribution
  const pS = slider("sdCdP", v => v < .35 ? "west (over A)" : v > .65 ? "east (over B)" : "in between", toy), qS = slider("sdCdQ", v => v < .35 ? "weak: may die" : v > .65 ? "strong" : "moderate", toy);
  const NSm = 150, rz2 = rng(77), Z = Array.from({ length: NSm }, () => [gauss(rz2), gauss(rz2)]), TS = SDF.sched(24, 4, .01);
  function cg() { const p = pS(), q = qS(), a = .45 + .7 * q; return SDF.gmm([[a, .03], [.03, a], [0, 0]], [q * (1 - p) + .02, q * p + .02, 1 - q + .02], .08, [0, 1, 2]); }
  function toy() {
    const G = cg(), W = 260, { g } = SDF.canvas($("#sdCdMap"), W, W), P = SDF.shade(g, W, (x, y) => SDF.gmmP(G, x, y, .01), "--accent", 60, .5), cnt = [0, 0, 0];
    Z.forEach(([u, v]) => { let x = 4 * u, y = 4 * v;
      for (let i = 0; i < 24; i++) { const t = TS[i], t1 = TS[i + 1], d = SDF.gmmD(G, x, y, t), dx = (x - d[0]) / t, dy = (y - d[1]) / t; let nx = x + (t1 - t) * dx, ny = y + (t1 - t) * dy;
        if (t1 > 0) { const d2 = SDF.gmmD(G, nx, ny, t1); nx = x + (t1 - t) * (dx + (nx - d2[0]) / t1) / 2; ny = y + (t1 - t) * (dy + (ny - d2[1]) / t1) / 2; } x = nx; y = ny; }
      let c = 0, bd = Infinity; G.mu.forEach((m, j) => { const dd = Math.hypot(x - m[0], y - m[1]); if (dd < bd) { bd = dd; c = j; } }); cnt[c]++;
      g.fillStyle = css(SDF.CLS[c]); g.strokeStyle = css("--bg"); g.lineWidth = 1; g.beginPath(); g.arc(P.X(x), P.Y(y), 3.3, 0, 7); g.fill(); g.stroke(); });
    SDF.axisLabels(g, W, P);
    $("#sdCdRead").innerHTML = [0, 1, 2].map(k => `<div><span>${["over A", "over B", "no storm"][k]}</span><b style="color:var(${SDF.CLS[k]});font-size:17px">${fmt(100 * cnt[k] / NSm, 0)} %</b></div>`).join("");
  }
  function render() { diagram(); toy(); }
  render(); return render;
});

/* ───────── 8 · the EDM recipe ───────── */
demo("sd-edm", () => {
  let step = 0; const SD0 = SDF.SDATA, L0 = Math.log10(SDF.SMIN), L1 = Math.log10(SDF.SMAX), SINT = 1, n = 64, B = SDF.bigStorm(n), Z = SDF.noise(n * n, 21);
  chips($("#sdEdStep"), v => { step = +v; render(); });
  const sS = slider("sdEdS", v => SDF.fs(10 ** v), render);
  const CARD = [
    ["① Pre-conditioning", `D(x<sub>σ</sub>; σ) = <b style="color:var(--data)">c<sub>skip</sub></b>·x<sub>σ</sub> + <b style="color:var(--arch)">c<sub>out</sub></b>·F<sub>θ</sub>(<b style="color:var(--sw)">c<sub>in</sub></b>·x<sub>σ</sub>; c<sub>noise</sub>)<br>c<sub>skip</sub> = σ<sub>d</sub>²/(σ²+σ<sub>d</sub>²), c<sub>out</sub> = σσ<sub>d</sub>/√(σ²+σ<sub>d</sub>²), c<sub>in</sub> = 1/√(σ²+σ<sub>d</sub>²), c<sub>noise</sub> = ¼ ln σ.<br>The network F always sees inputs of size ~1 and outputs of size ~1. At small σ, D mostly <b>keeps the input</b> and F predicts the noise; at large σ, F predicts the clean image itself.`],
    ["② Loss weight λ(σ)", `Eq. (1) multiplies the error by λ(σ) = (σ²+σ<sub>d</sub>²)/(σσ<sub>d</sub>)² = 1/c<sub>out</sub>². Since D − x = c<sub>out</sub>·(F − target), the weighted loss is just ‖F − target‖²: <b>every σ contributes errors of the same size</b>, and no noise level dominates training.`],
    ["③ Which σ to train on", `Each training example draws its own σ. StormScope: <b>uniform in log σ</b> between σ<sub>min</sub> and σ<sub>max</sub> (§4.2.3): each decade equally often. EDM's default instead is log-normal (ln σ ~ N(−1.2, 1.2²)), which focuses on middle σ. The paper does not state σ<sub>min</sub>, σ<sub>max</sub>.`],
    ["④ Two experts", `The σ range is split at σ<sub>int</sub> (§4.2.3; not stated, toy 1 here). A <b style="color:var(--arch)">coarse expert</b> trains only on σ > σ<sub>int</sub> and learns the large-scale layout; a <b style="color:var(--ok)">fine expert</b> trains on σ < σ<sub>int</sub> and learns convective detail. Same architecture, two sets of weights (the idea of eDiff-I, ref. 46).`],
    ["⑤ The sampler", `EDM's ODE sampler with stochastic perturbations (churn), <b>100 steps from σ<sub>max</sub> to σ<sub>min</sub></b>, using the coarse expert first and the fine expert after σ<sub>int</sub> (§4.2.3). Steps are packed towards small σ (ρ = 7, EDM default) where details form. One forecast step takes 33 s on one H100 (§4.2.2).`]];
  const H = ["EDM's scaling coefficients vs σ (σ<sub>data</sub> = 0.5)", "Loss weight λ(σ) and what is left after it", "Density of training σ (per decade of σ)", "Two experts split the σ range at σ<sub>int</sub>", "100-step sampling schedule (ρ = 7)"];
  function render() {
    const l = sS(), s = 10 ** l, c = SDF.pre(s), coarse = s > SINT;
    $("#sdEdCard").innerHTML = `<h4 style="color:var(--accent)">${CARD[step][0]}</h4><p>${CARD[step][1]}</p>`;
    $("#sdEdH").innerHTML = H[step];
    const W = 560, Hh = step === 0 ? 196 : 262, svg = svgIn($("#sdEdFig"), W, Hh), m = { l: 50, r: 14, t: 12, b: 30 }, x = lin(L0, L1, m.l, W - m.r);
    const xt = () => { [[-2, "0.01"], [-1, "0.1"], [0, "1"], [1, "10"], [Math.log10(80), "80"]].forEach(([v, t]) => SDF.txt(svg, x(v), Hh - m.b + 15, t, { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }));
      SDF.txt(svg, W - m.r, Hh - 2, "σ (log scale)", { "font-size": 11, "text-anchor": "end", fill: css("--muted") }); el("line", { x1: m.l, x2: W - m.r, y1: Hh - m.b, y2: Hh - m.b, class: "ax" }, svg); };
    const mark = () => { el("line", { x1: x(l), x2: x(l), y1: m.t, y2: Hh - m.b, stroke: css("--accent"), "stroke-width": 2.2 }, svg); };
    const grid = (y, vals, f) => vals.forEach(v => { el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: "grid" }, svg); SDF.txt(svg, m.l - 6, y(v) + 4, f(v), { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }); });
    const curve = (fn, y, tok, w = 2.4, dash = "") => { const p = []; for (let v = L0; v <= L1 + 1e-9; v += .04) p.push([x(v), y(fn(10 ** v))]); el("path", { d: path(p), fill: "none", stroke: css(tok), "stroke-width": w, "stroke-dasharray": dash }, svg); };
    const lab = (xx, yy, t, tok, a = "start") => SDF.txt(svg, xx, yy, t, { "font-size": 12, fill: css(tok), "font-weight": 600, "text-anchor": a });
    if (step === 0) {
      const y = lin(0, 2.1, Hh - m.b, m.t); grid(y, [0, .5, 1, 1.5, 2], v => fmt(v, 1)); xt();
      el("line", { x1: x(Math.log10(SD0)), x2: x(Math.log10(SD0)), y1: m.t, y2: Hh - m.b, stroke: css("--muted"), "stroke-dasharray": "4 3" }, svg); SDF.txt(svg, x(Math.log10(SD0)) - 4, m.t + 10, "σ = σ_{data}", { "font-size": 10.5, "text-anchor": "end", fill: css("--muted") });
      curve(v => SDF.pre(v).skip, y, "--data"); curve(v => SDF.pre(v).out, y, "--arch"); curve(v => SDF.pre(v).cin, y, "--sw");
      lab(m.l + 6, y(1) - 6, "c_{skip}", "--data"); lab(W - m.r - 4, y(.5) - 6, "c_{out}", "--arch", "end"); lab(m.l + 6, y(2) + 14, "c_{in}", "--sw"); mark();
    } else if (step === 1) {
      const y = lin(-1, 6, Hh - m.b, m.t); grid(y, [0, 2, 4, 6], v => "1e" + v); xt();
      curve(v => Math.log10(SDF.pre(v).lam), y, "--lw"); curve(() => 0, y, "--ok", 2.4, "6 4");
      lab(x(-2.2), y(4.6), "λ(σ) ≈ 1/σ² at small σ", "--lw"); lab(x(.4), y(1.1), "→ 1/σ_{data}² = 4", "--lw"); lab(x(-2.4), y(0) - 8, "λ(σ)·c_{out}² = 1: equal weight on F's error", "--ok"); mark();
    } else {
      const pLU = 1 / (L1 - L0), mu = -1.2 / Math.LN10, sg = 1.2 / Math.LN10, pLN = v => Math.exp(-.5 * ((v - mu) / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI));
      if (step === 2 || step === 3) {
        const y = lin(0, .85, Hh - m.b, m.t); grid(y, [0, .4, .8], v => fmt(v, 1)); xt();
        if (step === 3) { el("rect", { x: x(L0), y: m.t, width: x(0) - x(L0), height: Hh - m.b - m.t, fill: css("--ok"), opacity: .1 }, svg); el("rect", { x: x(0), y: m.t, width: x(L1) - x(0), height: Hh - m.b - m.t, fill: css("--arch"), opacity: .1 }, svg);
          el("line", { x1: x(0), x2: x(0), y1: m.t, y2: Hh - m.b, stroke: css("--fg"), "stroke-width": 1.6, "stroke-dasharray": "5 3" }, svg);
          lab(x(0) - 8, m.t + 16, "← fine expert", "--ok", "end"); lab(x(0) + 8, m.t + 16, "coarse expert →", "--arch"); SDF.txt(svg, x(0) + 8, m.t + 32, "σ_{int} (toy)", { "font-size": 11, fill: css("--muted") });
          el("rect", { x: x(L0), y: y(pLU), width: x(0) - x(L0), height: y(0) - y(pLU), fill: css("--ok"), opacity: .35 }, svg); el("rect", { x: x(0), y: y(pLU), width: x(L1) - x(0), height: y(0) - y(pLU), fill: css("--arch"), opacity: .35 }, svg);
          SDF.txt(svg, x((L0) / 2), y(pLU) - 8, fmt(100 * (0 - L0) / (L1 - L0), 0) + " % of draws", { "font-size": 12, "text-anchor": "middle", fill: css("--ok"), "font-weight": 600 });
          SDF.txt(svg, x(L1 / 2), y(pLU) - 8, fmt(100 * L1 / (L1 - L0), 0) + " % of draws", { "font-size": 12, "text-anchor": "middle", fill: css("--arch"), "font-weight": 600 }); }
        else { const p = [[x(L0), y(0)], [x(L0), y(pLU)], [x(L1), y(pLU)], [x(L1), y(0)]]; el("path", { d: path(p) + "Z", fill: css("--accent"), opacity: .18, stroke: css("--accent"), "stroke-width": 2.4 }, svg);
          curve(v => pLN(Math.log10(v)), y, "--muted", 2, "5 4"); lab(x(1.85), y(pLU) - 8, "log-uniform (paper)", "--accent", "end"); lab(x(mu) + 30, y(pLN(mu)) + 4, "log-normal (EDM default)", "--muted"); }
        mark();
      } else {
        const N = 100, T = SDF.sched(N, SDF.SMAX, SDF.SMIN), xs = lin(0, N, m.l, W - m.r), y = lin(L0, L1, Hh - m.b, m.t), kI = T.findIndex(v => v <= SINT);
        el("rect", { x: xs(0), y: m.t, width: xs(kI) - xs(0), height: Hh - m.b - m.t, fill: css("--arch"), opacity: .08 }, svg); el("rect", { x: xs(kI), y: m.t, width: xs(N) - xs(kI), height: Hh - m.b - m.t, fill: css("--ok"), opacity: .08 }, svg);
        [[80, "80"], [1, "1"], [.01, "0.01"], [.002, ""]].forEach(([v, t]) => { el("line", { x1: m.l, x2: W - m.r, y1: y(Math.log10(v)), y2: y(Math.log10(v)), class: "grid" }, svg); if (t) SDF.txt(svg, m.l - 6, y(Math.log10(v)) + 4, t, { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }); });
        [0, 25, 50, 75, 100].forEach(v => SDF.txt(svg, xs(v), Hh - m.b + 15, v, { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") })); SDF.txt(svg, W - m.r, Hh - 2, "sampling step i", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
        el("path", { d: path(T.slice(0, N).map((v, k) => [xs(k), y(Math.log10(v))])), fill: "none", stroke: css("--accent"), "stroke-width": 2.4 }, svg);
        T.slice(0, N).forEach((v, k) => { if (k % 5 === 0) el("circle", { cx: xs(k), cy: y(Math.log10(v)), r: 2, fill: css("--accent") }, svg); });
        lab(xs(kI / 2), m.t + 16, "coarse expert", "--arch", "middle"); lab(xs((kI + N) / 2), m.t + 16, "fine expert", "--ok", "middle");
        el("line", { x1: xs(kI), x2: xs(kI), y1: m.t, y2: Hh - m.b, stroke: css("--fg"), "stroke-dasharray": "4 3" }, svg); SDF.txt(svg, xs(kI) + 4, Hh - m.b - 8, `switch at step ${kI}`, { "font-size": 11, fill: css("--muted") });
        let ki = 0, bd = Infinity; T.slice(0, N).forEach((v, k) => { const d = Math.abs(Math.log10(v) - l); if (d < bd) { bd = d; ki = k; } });
        el("circle", { cx: xs(ki), cy: y(Math.log10(T[ki])), r: 6.5, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 2 }, svg);
        SDF.txt(svg, xs(ki) + 10, y(Math.log10(T[ki])) - 8, `step ${ki}`, { "font-size": 12, "font-weight": 600, fill: css("--accent") });
      }
    }
    // ① what F sees and has to output (toy storm)
    const host = $("#sdEdImgs");
    if (step === 0) {
      const xv = B.x, inp = Float32Array.from(xv, (v, k) => c.cin * (v + s * Z[k])), tgt = Float32Array.from(xv, (v, k) => (v - c.skip * (v + s * Z[k])) / c.out);
      const cx = (() => { let ax = 0, an = 0, tt = 0, xx = 0, zz = 0; for (let k = 0; k < xv.length; k++) { ax += tgt[k] * xv[k]; an += -tgt[k] * Z[k]; tt += tgt[k] ** 2; xx += xv[k] ** 2; zz += Z[k] ** 2; } return [ax / Math.sqrt(tt * xx), an / Math.sqrt(tt * zz)]; })();
      host.innerHTML = `<div class="sd-g" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:6px"><div><div></div><p class="sd-lab">F's input c<sub>in</sub>·x<sub>σ</sub></p></div><div><div></div><p class="sd-lab">F's target: corr. with clean x <b>${fmt(cx[0], 2)}</b>, with −noise <b>${fmt(cx[1], 2)}</b></p></div><div><div></div><p class="sd-lab">c<sub>skip</sub>·x<sub>σ</sub> + c<sub>out</sub>·F = clean x</p></div></div>`;
      const pans = $$(".sd-g > div > div:first-child", host);
      [[inp, CM.precip, c.cin * (B.dry + .05), c.cin * B.hi, true], [tgt, CM.div, -2.5, 2.5, false], [xv, CM.precip, B.dry + .03, B.hi, true]].forEach(([f, cm, a, b, mk], j) => {
        const { g } = SDF.canvas(pans[j], 160, 160); g.imageSmoothingEnabled = false; g.drawImage(SDF.paint(f, n, n, { color: cm, lo: a, hi: b, mask: mk ? (v => v < a) : null }), 0, 0, 160, 160); });
    } else host.innerHTML = "";
    $("#sdEdRead").innerHTML = `<div><span>c<sub>skip</sub></span><b class="c-data">${fmt(c.skip, 3)}</b></div><div><span>c<sub>out</sub></span><b class="c-arch">${fmt(c.out, 3)}</b></div><div><span>c<sub>in</sub></span><b class="c-sw">${fmt(c.cin, 3)}</b></div><div><span>c<sub>noise</sub></span><b>${fmt(c.cn, 2)}</b></div><div><span>λ(σ)</span><b class="c-lw">${c.lam < 1e4 ? fmt(c.lam, c.lam < 10 ? 2 : 0) : c.lam.toExponential(1)}</b></div><div><span>Expert</span><b class="${coarse ? "c-arch" : "c-ok"}">${coarse ? "coarse" : "fine"}</b></div>`;
  }
  render(); return render;
});
