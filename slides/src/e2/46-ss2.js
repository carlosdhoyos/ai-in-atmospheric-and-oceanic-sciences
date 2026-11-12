/* ═════════ Earth-2 · 5b StormScope step by step · part B ═════════
   Inside the network (tokens, neighborhood attention, one DiT block), diffusion (training, sampling), ensembles,
   verification (FSS, storm objects), results as reported, cost and scaling, limitations and Colombia, recap and quiz.
   Every field here is a toy; numbers on the slides come from Pathak et al. 2026, arXiv:2601.17268. */

const SB = (() => {
  /* ── toy storm world: 64 × 112 pixels of 6 km (384 × 672 km), reflectivity in dBZ, time in minutes ── */
  const NX = 112, NY = 64, KM = 6, U = 0.6, V = -0.12; // steering wind in km per minute (east, north is −y)

  /* colour lookup tables and painting */
  const LUT = new Map();
  const lut = f => { if (!LUT.has(f)) { const L = new Uint8ClampedArray(768); for (let i = 0; i < 256; i++) L.set(CM.rgb(f, i / 255), i * 3); LUT.set(f, L); } return LUT.get(f); };
  const rgbOf = tok => { const d = document.createElement("canvas").getContext("2d"); d.fillStyle = css(tok) || "#888"; d.fillRect(0, 0, 1, 1); return [...d.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const GRAY = CM.ramp(["#05070c", "#2a2f38", "#8a8f99", "#ffffff"]);
  // a canvas with one pixel per cell; mask(v) → paint --well
  function paint(vals, nx, ny, { color = CM.vir, lo = 0, hi = 1, mask = null } = {}) {
    const c = document.createElement("canvas"); c.width = nx; c.height = ny;
    const g = c.getContext("2d"), img = g.createImageData(nx, ny), L = lut(color), w = rgbOf("--well");
    for (let k = 0; k < nx * ny; k++) { const v = vals[k], o = k * 4;
      if (mask && mask(v)) { img.data[o] = w[0]; img.data[o + 1] = w[1]; img.data[o + 2] = w[2]; }
      else { const t = Math.round(clamp((v - lo) / (hi - lo || 1), 0, 1) * 255) * 3; img.data[o] = L[t]; img.data[o + 1] = L[t + 1]; img.data[o + 2] = L[t + 2]; }
      img.data[o + 3] = 255; }
    g.putImageData(img, 0, 0); return c;
  }
  // categorical canvas: cat[k] = index into rgb list (null = well)
  function paintCat(cat, nx, ny, cols) {
    const c = document.createElement("canvas"); c.width = nx; c.height = ny;
    const g = c.getContext("2d"), img = g.createImageData(nx, ny);
    for (let k = 0; k < nx * ny; k++) { const col = cols[cat[k]], o = k * 4; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; }
    g.putImageData(img, 0, 0); return c;
  }
  const dbz = (f, nx = NX, ny = NY) => paint(f, nx, ny, { color: CM.precip, lo: 0, hi: 60, mask: v => v < 5 });
  const url = c => c.toDataURL();
  // show a small canvas scaled up, with overlay, click and hover in cell units
  function view(host, src, nx, ny, { overlay = null, onCell = null, onHover = null, S = null, maxW = null } = {}) {
    const s = S || Math.max(1, Math.ceil(640 / nx)), cv = document.createElement("canvas"); cv.width = nx * s; cv.height = ny * s;
    const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, cv.width, cv.height);
    if (overlay) overlay(g, s);
    Object.assign(cv.style, { width: "100%", height: "auto", display: "block", borderRadius: "8px" }); if (maxW) cv.style.maxWidth = maxW + "px";
    host.innerHTML = ""; host.appendChild(cv);
    const at = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * nx), Math.floor((e.clientY - r.top) / r.height * ny)]; };
    if (onCell) { cv.style.cursor = "crosshair"; cv.addEventListener("click", e => { const [i, j] = at(e); if (i >= 0 && j >= 0 && i < nx && j < ny) onCell(i, j); }); }
    if (onHover) { cv.addEventListener("mousemove", e => { const [i, j] = at(e); onHover(i, j, e); }); cv.addEventListener("mouseleave", () => onHover(-1, -1)); }
    return cv;
  }
  // a dBZ colour bar with ticks every 10 dBZ
  function dbzBar(host, W = 300, label = "toy reflectivity (dBZ)") {
    const svg = svgIn(host, W, 32), n = 60; svg.style.maxWidth = W + "px";
    for (let i = 0; i < n; i++) el("rect", { x: 6 + i * (W - 12) / n, y: 3, width: (W - 12) / n + .6, height: 9, fill: i < 5 ? css("--well") : CM.precip((i + .5) / n) }, svg);
    for (let d = 0; d <= 60; d += 10) el("text", { x: 6 + d / 60 * (W - 12), y: 24, "font-size": 10.5, class: "mono", "text-anchor": "middle", fill: css("--muted") }, svg, d);
    el("text", { x: W / 2, y: 32, "font-size": 10, "text-anchor": "middle", fill: css("--muted") }, svg, "");
    if (label) el("title", {}, svg, label);
  }

  /* the world: base cells (seen at t = 0, shared by every realisation) + future births + an optional MCS */
  const BASES = new Map();
  function base(day) {
    if (BASES.has(day)) return BASES.get(day);
    const r = rng(9001 + 37 * day), C = [];
    for (let k = 0; k < 20; k++) C.push({ x: -40 + 680 * r(), y: 20 + 344 * r(), pk: 40 + 18 * r(), R: 11 + 10 * r(), a0: -60 + 150 * r(), life0: 80 + 110 * r(), u: U + .14 * (r() - .5), v: V + .14 * (r() - .5) });
    const ax = 170 + 130 * r(), ay = 150 + 90 * r();
    for (let k = 0; k < 6; k++) C.push({ x: ax + 80 * (r() - .5), y: ay + 90 * (r() - .5), pk: 44 + 12 * r(), R: 11 + 7 * r(), a0: 10 + 40 * r(), life0: 90 + 60 * r(), u: U, v: V });
    const B = { C, ax, ay }; BASES.set(day, B); return B;
  }
  // one realisation; o.spread < 1 with o.ref makes members share part of their randomness ("too alike"); o.wet adds dBZ
  function real(day, seed, o = {}) {
    const B = base(day), r = rng(seed), s = o.spread ?? 1, ref = o.ref || null, wet = o.wet || 0;
    let G = B.C.map(() => [gauss(r), gauss(r), gauss(r), gauss(r)]);
    let slots = Array.from({ length: 60 }, () => ({ on: r() < .5, t: 360 * r(), x: -180 + 790 * r(), y: 25 + 334 * r(), pk: 42 + 17 * r(), R: 10 + 9 * r(), life: 50 + 90 * r() }));
    const coin = r(), keep = Array.from({ length: 61 }, () => r());
    let agg = o.agg ?? coin < .4;
    if (ref) { const c = Math.sqrt(1 - s * s); G = G.map((g, k) => g.map((v, j) => s * v + c * ref.G[k][j])); slots = slots.map((sl, k) => keep[k] < s ? sl : ref.slots[k]); agg = keep[60] < s ? agg : ref.agg; }
    const cells = B.C.map((c, k) => ({ ...c, lifeP: c.life0 * Math.exp(.3 * G[k][0]), dpk: 4 * G[k][1], u: c.u + .06 * G[k][2], v: c.v + .06 * G[k][3] }));
    return { G, slots, agg, cells, B, wet };
  }
  function put(f, cx, cy, I, sx, sy) {
    if (I < 3) return; const i0 = Math.max(0, Math.floor((cx - 3 * sx) / KM)), i1 = Math.min(NX - 1, Math.ceil((cx + 3 * sx) / KM)), j0 = Math.max(0, Math.floor((cy - 3 * sy) / KM)), j1 = Math.min(NY - 1, Math.ceil((cy + 3 * sy) / KM));
    for (let j = j0; j <= j1; j++) { const dy = ((j + .5) * KM - cy) / sy; for (let i = i0; i <= i1; i++) { const dx = ((i + .5) * KM - cx) / sx, v = I * Math.exp(-.5 * (dx * dx + dy * dy)); if (v > f[j * NX + i]) f[j * NX + i] = v; } }
  }
  // a convective cell: a core plus a wider area of light rain (trailing slightly behind the motion)
  const cell = (f, x, y, I, R) => { put(f, x - .4 * R, y, .5 * I, 2.4 * R, 1.7 * R); put(f, x, y, I, R, .85 * R); };
  function field(re, t) {
    const f = new Float32Array(NX * NY), ramp = Math.min(1, t / 120), wet = re.wet * Math.min(1, t / 60);
    for (const c of re.cells) { const ph = c.a0 / c.life0 + t / c.lifeP; if (ph <= 0 || ph >= 1) continue; const e = Math.pow(Math.sin(Math.PI * ph), .6), R = c.R * (.7 + .3 * e) * (1 + wet / 25);
      cell(f, c.x + c.u * t, c.y + c.v * t, (c.pk + c.dpk * ramp + wet) * e, R); }
    for (const s of re.slots) { if (!s.on || t <= s.t) continue; const ph = (t - s.t) / s.life; if (ph >= 1) continue; const e = Math.pow(Math.sin(Math.PI * ph), .6), R = s.R * (.7 + .3 * e) * (1 + wet / 25);
      cell(f, s.x + U * t, s.y + V * t, (s.pk + wet) * e, R); }
    if (re.agg) { const g = clamp((t - 70) / 150, 0, 1);
      if (g > 0) { const cx = re.B.ax + U * t + 20, cy = re.B.ay + V * t, sx = 16 + 62 * g, sy = 12 + 30 * g;
        put(f, cx, cy, 33 * g + wet, sx, sy);
        for (let j = 0; j < 7; j++) put(f, cx + .5 * sx - Math.abs(j - 3) * 7 * g, cy + (j - 3) * (5 + 15 * g), (45 + 7 * Math.sin(j * 1.7 + t / 25)) * g + wet, 7 + 5 * g, 7 + 5 * g); } }
    for (let k = 0; k < f.length; k++) if (f[k] > 62) f[k] = 62;
    return f;
  }
  // shift a field by (dx, dy) km with bilinear sampling (zero outside)
  function advect(f, dx, dy) {
    const o = new Float32Array(NX * NY), sx = dx / KM, sy = dy / KM, g = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NY) ? 0 : f[j * NX + i];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const x = i - sx, y = j - sy, x0 = Math.floor(x), y0 = Math.floor(y), a = x - x0, b = y - y0;
      o[j * NX + i] = (1 - a) * (1 - b) * g(x0, y0) + a * (1 - b) * g(x0 + 1, y0) + (1 - a) * b * g(x0, y0 + 1) + a * b * g(x0 + 1, y0 + 1); }
    return o;
  }
  // ensembles: truth + 24 members for a toy day; mode: cal | alike | wet
  const ENS = new Map(), FC = new Map();
  function ens(day, mode = "cal") {
    const key = day + mode; if (ENS.has(key)) return ENS.get(key);
    const truth = real(day, 777 + day, { agg: day % 2 === 0 ? true : null }), ref = real(day, 5003 + day);
    const opt = mode === "alike" ? { spread: .3, ref } : mode === "wet" ? { wet: 6 } : {};
    const E = { truth, mem: Array.from({ length: 24 }, (_, m) => real(day, 100 * day + 11 + m, opt)) }; ENS.set(key, E); return E;
  }
  function ensFields(day, mode, t) {
    const key = `${day}|${mode}|${t}`; if (FC.has(key)) return FC.get(key);
    if (FC.size > 80) FC.clear();
    const E = ens(day, mode), out = { truth: field(E.truth, t), mem: E.mem.map(m => field(m, t)) }; FC.set(key, out); return out;
  }

  /* toy CONUS-wide satellite scene on the 128 × 224 token grid (and derived channels) */
  let SCENE = null;
  function scene() {
    if (SCENE) return SCENE;
    const n = 256, W = 224, H = 128, a = FFT.noise2(n, { beta: 3.4, seed: 41 }), b = FFT.noise2(n, { beta: 2.3, seed: 42 }), z = FFT.noise2(n, { beta: 5, seed: 43 });
    const ir = new Float32Array(W * H), vis = new Float32Array(W * H), wv = new Float32Array(W * H), rad = new Float32Array(W * H), lat = new Float32Array(W * H), lon = new Float32Array(W * H), sza = new Float32Array(W * H), z5 = new Float32Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, q = j * n + i, c = a[q] + .4 * b[q] + .5 * Math.sin(i / W * 7 + j / H * 2), cl = clamp((c - .1) / 1.3, 0, 1);
      let tb = 294 - 24 * j / H - 82 * Math.pow(cl, 1.2); if (b[q] > 1.3 && cl > .45) tb -= 18 * (b[q] - 1.3);
      ir[k] = clamp(tb, 196, 300); vis[k] = .12 + .85 * Math.pow(cl, .8); wv[k] = 250 - 10 * (z[q] + .6 * a[q]) - 14 * cl;
      rad[k] = ir[k] < 232 ? clamp((232 - ir[k]) * 1.9, 0, 62) : 0; lat[k] = 50 - 25 * j / H; lon[k] = -125 + 58 * i / W;
      sza[k] = clamp(Math.cos((i / W - .25) * 2.2 + .25 * (j / H - .5)), 0, 1); z5[k] = 5520 + 300 * j / H + 70 * z[q]; }
    const grs = new Float32Array(W * H), R = 5; // GFS-like smooth reflectivity: a box blur of the toy radar
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let s = 0, c = 0; for (let b = Math.max(0, j - R); b <= Math.min(H - 1, j + R); b++) for (let a = Math.max(0, i - R); a <= Math.min(W - 1, i + R); a++) { s += rad[b * W + a]; c++; } grs[j * W + i] = 1.6 * s / c; }
    SCENE = { W, H, ir, vis, wv, rad, lat, lon, sza, z5, grs }; return SCENE;
  }
  const irPaint = (vals, nx, ny) => paint(vals, nx, ny, { color: GRAY, lo: 300, hi: 196 });

  /* 24 toy futures for the diffusion slides: truth + 23 members of day 0 at +120 min, scaled dBZ / 60 */
  let FUT = null;
  function futures() {
    if (FUT) return FUT;
    const F = ensFields(0, "cal", 120), X = [F.truth, ...F.mem.slice(0, 23)].map(f => Float32Array.from(f, v => v / 60));
    const E = ens(0, "cal"), past = [60, 80, 100].map(t => field(E.truth, t));
    FUT = { X, past }; return FUT;
  }
  // exact denoiser for a mixture of the futures: posterior-weighted mean
  function denoise(y, s, X) {
    const K = X.length, n = y.length, lw = new Float64Array(K);
    for (let k = 0; k < K; k++) { let d = 0; const x = X[k]; for (let i = 0; i < n; i++) { const e = y[i] - x[i]; d += e * e; } lw[k] = -d / (2 * s * s); }
    let m = -Infinity; for (const v of lw) m = Math.max(m, v); let S = 0; const w = new Float64Array(K); for (let k = 0; k < K; k++) { w[k] = Math.exp(lw[k] - m); S += w[k]; }
    const out = new Float32Array(n); for (let k = 0; k < K; k++) { w[k] /= S; if (w[k] < 1e-9) continue; const x = X[k], a = w[k]; for (let i = 0; i < n; i++) out[i] += a * x[i]; }
    return { d: out, w };
  }
  // EDM schedule (ρ = 7) and constants (EDM defaults; the paper does not state its values)
  const SMIN = 0.002, SMAX = 80, SINT = 1, SD = .5, NSTEP = 100;
  const sched = Array.from({ length: NSTEP }, (_, i) => Math.pow(Math.pow(SMAX, 1 / 7) + i / (NSTEP - 1) * (Math.pow(SMIN, 1 / 7) - Math.pow(SMAX, 1 / 7)), 7)).concat([0]);

  /* objects: 8-connected areas ≥ thr with at least minPx pixels */
  function objects(f, thr = 40, minPx = 4) {
    const lab = new Int32Array(NX * NY).fill(-1), objs = [];
    for (let s = 0; s < NX * NY; s++) { if (f[s] < thr || lab[s] !== -1) continue;
      const px = [], st = [s]; lab[s] = -3;
      while (st.length) { const k = st.pop(); px.push(k); const i = k % NX, j = (k / NX) | 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NX || b >= NY) continue; const q = b * NX + a; if (lab[q] === -1 && f[q] >= thr) { lab[q] = -3; st.push(q); } } }
      if (px.length < minPx) { px.forEach(k => lab[k] = -2); continue; }
      const id = objs.length, set = new Set(px); px.forEach(k => lab[k] = id);
      let cx = 0, cy = 0; px.forEach(k => { cx += (k % NX + .5) * KM; cy += (((k / NX) | 0) + .5) * KM; }); cx /= px.length; cy /= px.length;
      const bd = px.filter(k => { const i = k % NX, j = (k / NX) | 0; return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !set.has((j + b) * NX + i + a) || i + a < 0 || i + a >= NX || j + b < 0 || j + b >= NY); });
      objs.push({ id, px, set, cx, cy, bd, area: px.length * KM * KM }); }
    return { objs, lab };
  }
  function minEdge(A, B) {
    for (const k of A.px) if (B.set.has(k)) return 0;
    let m = Infinity; for (const a of A.bd) { const ai = a % NX, aj = (a / NX) | 0; for (const b of B.bd) { const d = (ai - b % NX) ** 2 + (aj - ((b / NX) | 0)) ** 2; if (d < m) m = d; } }
    return Math.sqrt(m) * KM;
  }
  function match(F, O, dmax = 40) {
    const P = [];
    F.forEach((a, i) => O.forEach((b, j) => { const dc = Math.hypot(a.cx - b.cx, a.cy - b.cy); if (dc > dmax) return; const de = minEdge(a, b); if (de <= dmax) P.push([dc, i, j, de]); }));
    P.sort((p, q) => p[0] - q[0]); const uf = new Set(), uo = new Set(), hits = [];
    P.forEach(([dc, i, j, de]) => { if (uf.has(i) || uo.has(j)) return; uf.add(i); uo.add(j); hits.push({ f: i, o: j, dc, de }); });
    return { hits, fa: F.map((_, i) => i).filter(i => !uf.has(i)), miss: O.map((_, j) => j).filter(j => !uo.has(j)) };
  }
  const scores = (H, M, F) => ({ pod: H + M ? H / (H + M) : NaN, sr: H + F ? H / (H + F) : NaN, csi: H + M + F ? H / (H + M + F) : NaN, fb: H + M ? (H + F) / (H + M) : NaN });

  /* fractions in an n × n window (n odd), clipped at the edges */
  function fractions(bin, n) {
    const W = NX + 1, S = new Float64Array(W * (NY + 1)), h = (n - 1) / 2, out = new Float32Array(NX * NY);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) S[(j + 1) * W + i + 1] = bin[j * NX + i] + S[j * W + i + 1] + S[(j + 1) * W + i] - S[j * W + i];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = Math.max(0, i - h), b = Math.min(NX - 1, i + h), c = Math.max(0, j - h), d = Math.min(NY - 1, j + h);
      out[j * NX + i] = (S[(d + 1) * W + b + 1] - S[c * W + b + 1] - S[(d + 1) * W + a] + S[c * W + a]) / ((b - a + 1) * (d - c + 1)); }
    return out;
  }
  function fss(fb, ob, n) { const P = fractions(fb, n), Q = fractions(ob, n); let a = 0, b = 0; for (let k = 0; k < P.length; k++) { a += (P[k] - Q[k]) ** 2; b += P[k] ** 2 + Q[k] ** 2; } return { v: b ? 1 - a / b : NaN, P, Q }; }

  // stage highlight helper for step diagrams
  const stage = (svg, x, y, w, h, on) => el("rect", { x, y, width: w, height: h, rx: 12, fill: on ? css("--accent") : "none", "fill-opacity": on ? .07 : 0, stroke: css(on ? "--accent" : "--line"), "stroke-width": on ? 2 : 1, "stroke-dasharray": on ? "" : "4 4" }, svg);
  // text with optional subscripts written as x_{t+}
  const txt = (svg, x, y, s, o = {}) => { const t = el("text", Object.assign({ x, y, "font-size": 12, fill: css("--fg") }, o), svg), parts = String(s).split(/(_\{[^}]*\})/);
    if (parts.length === 1) { t.textContent = s; return t; }
    let sh = 0; parts.forEach(q => { if (!q) return; const sub = q.startsWith("_{"); el("tspan", { dy: sub ? 4 - sh : -sh, "font-size": sub ? "78%" : "100%" }, t, sub ? q.slice(2, -1) : q); sh = sub ? 4 : 0; }); return t; };
  const img = (svg, href, x, y, w, h, o = {}) => el("image", Object.assign({ href, x, y, width: w, height: h, preserveAspectRatio: "none", style: "image-rendering:pixelated" }, o), svg);
  const arrow = (svg, x1, y1, x2, y2, id, o = {}) => el("line", Object.assign({ x1, y1, x2, y2, stroke: css("--muted"), "stroke-width": 1.8, "marker-end": `url(#${id})` }, o), svg);
  const sup = s => s; // placeholder for readability
  return { NX, NY, KM, U, V, GRAY, paint, paintCat, dbz, url, view, dbzBar, base, real, field, advect, ens, ensFields, scene, irPaint, futures, denoise,
    SMIN, SMAX, SINT, SD, NSTEP, sched, objects, match, scores, fractions, fss, stage, txt, img, arrow, rgbOf, sup };
})();

/* ───────── 1 · from images to tokens ───────── */
demo("sb-tokens", () => {
  const S = SB.scene(), W = S.W, H = S.H;
  const MODES = {
    sn: { t: "satellite · nowcast", g: [["n", 8, "noisy future x(t) + n", "--accent"], ["sat", 48, "past GOES: 6 × 8 ch.", "--cool"], ["ll", 2, "latitude, longitude", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] },
    sr: { t: "satellite · nearcast", g: [["n", 8, "noisy future x(t) + n", "--accent"], ["sat", 8, "GOES 1 h earlier", "--cool"], ["z5", 1, "GFS Z500", "--muted"], ["ll", 2, "latitude, longitude", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] },
    rn: { t: "radar · nowcast", g: [["nr", 1, "noisy future y(t) + n", "--accent"], ["rad", 6, "past MRMS: 6 frames", "--lw"], ["sat", 48, "GOES: 6 × 8 ch.", "--cool"], ["ll", 2, "latitude, longitude", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] },
    rr: { t: "radar · nearcast", g: [["nr", 1, "noisy future y(t) + n", "--accent"], ["rad", 1, "MRMS 1 h earlier", "--lw"], ["sat", 8, "GOES 1 h earlier", "--cool"], ["gr", 1, "GFS sim. reflectivity", "--muted"], ["ll", 2, "latitude, longitude", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] } };
  // thumbnails (built once)
  const r = rng(5), noisy = Float32Array.from(S.ir, v => v + 22 * gauss(r)), noisyR = Float32Array.from(S.rad, v => v + 22 * gauss(r));
  let IM = null;
  const mkIM = () => ({ n: SB.url(SB.irPaint(noisy, W, H)), sat: SB.url(SB.irPaint(S.ir, W, H)), ll: SB.url(SB.paint(S.lat, W, H, { color: CM.vir, lo: 25, hi: 50 })),
    sz: SB.url(SB.paint(S.sza, W, H, { color: CM.temp, lo: 0, hi: 1 })), z5: SB.url(SB.paint(S.z5, W, H, { color: CM.temp, lo: 5450, hi: 5900 })),
    nr: SB.url(SB.paint(noisyR, W, H, { color: CM.precip, lo: 0, hi: 60 })), rad: SB.url(SB.dbz(S.rad, W, H)), gr: SB.url(SB.dbz(S.grs, W, H)) });
  let step = 0, mode = "sn", p = 4;
  chips($("#sbTkStep"), v => { step = +v; render(); }); chips($("#sbTkMode"), v => { mode = v; render(); }); chips($("#sbTkP"), v => { p = +v; render(); });
  const CARDS = [
    ["① Stack the inputs as channels", "All inputs share the 512 × 896 grid (6 km), so they are simply <b>stacked as channels</b> (<b>dense conditioning</b>): the noisy future being denoised, past observations, lat/lon, cos of the solar zenith angle (day or night) and, for nearcasts, one GFS field (Z500 from ERA5 in training, from GFS at inference)."],
    ["② Cut the stack into patches", "The stack is cut into non-overlapping <b>4 × 4-pixel patches</b>, i.e. 24 × 24 km. 512 / 4 = 128 rows and 896 / 4 = 224 columns of patches. A patch keeps all C channels of its 16 pixels."],
    ["③ Embed each patch", "A <b>strided convolution</b> with kernel 4 and stride 4 is one linear map applied to every patch: C × 4 × 4 numbers → a vector of <b>768</b>. The same weights are used for every patch, wherever it is."],
    ["④ A sequence of tokens", "The 128 × 224 = <b>28,672 tokens</b> of 768 numbers enter 16 transformer blocks (next slides). At the end a linear layer turns each token back into 4 × 4 pixels of the output channels, and the patches are reassembled into the 512 × 896 forecast."]];
  function render() {
    const M = MODES[mode], C = M.g.reduce((s, g) => s + g[1], 0);
    IM = mkIM();
    const svg = svgIn($("#sbTkFig"), 1000, 290); arrowDefs(svg, "sbTkAr", css("--muted"));
    const on = k => step === k, op = k => on(k) ? 1 : .32;
    // stage frames
    [[4, 372], [390, 204], [606, 172], [790, 206]].forEach(([x, w], k) => SB.stage(svg, x, 4, w, 282, on(k)));
    const T = ["① stack: C × 512 × 896", "② patches of " + p + " × " + p + " px", "③ embed: linear map", "④ tokens for the transformer"];
    [16, 400, 618, 802].forEach((x, k) => SB.txt(svg, x, 24, T[k], { "font-size": 13.5, "font-weight": 600, fill: css(on(k) ? "--accent" : "--muted") }));
    // ① stack
    const g1 = el("g", { opacity: op(0) }, svg), n = M.g.length;
    for (let k = n - 1; k >= 0; k--) { const [key, cnt, , col] = M.g[k], x = 18 + 11 * k, y = 156 - 15 * k;
      SB.img(g1, IM[key], x, y, 128, 73); el("rect", { x, y, width: 128, height: 73, fill: "none", stroke: css(col), "stroke-width": 2.6, rx: 3 }, g1);
      if (k === 0) el("text", { x: x + 6, y: y + 67, "font-size": 11, fill: "#fff", "font-weight": 600 }, g1, "+ noise"); }
    M.g.forEach(([, cnt, lab, col], k) => { SB.txt(g1, 236, 70 + 21 * k, String(cnt), { class: "mono", "font-weight": 600, fill: css(col), "font-size": 12.5, "text-anchor": "end" }); SB.txt(g1, 242, 70 + 21 * k, lab, { "font-size": 11.5, fill: css(col) }); });
    el("line", { x1: 214, x2: 366, y1: 70 + 21 * n - 12, y2: 70 + 21 * n - 12, stroke: css("--muted") }, g1);
    SB.txt(g1, 236, 70 + 21 * n + 4, String(C), { class: "mono", "font-weight": 700, "font-size": 13, "text-anchor": "end" }); SB.txt(g1, 242, 70 + 21 * n + 4, "channels (our count)", { "font-size": 11.5, "font-weight": 600 });
    SB.txt(g1, 110, 262, `${C} × 512 × 896`, { "font-size": 15, "font-weight": 700, class: "mono", "text-anchor": "middle" });
    SB.txt(g1, 110, 278, M.t, { "font-size": 11, fill: css("--muted"), "text-anchor": "middle" });
    arrow3(376, 140, 388, "concat");
    // ② patches
    const g2 = el("g", { opacity: op(1) }, svg), ix = 400, iy = 40, iw = 176, ih = 100;
    SB.img(g2, IM.sat, ix, iy, iw, ih); el("rect", { x: ix, y: iy, width: iw, height: ih, fill: "none", stroke: css("--cool"), "stroke-width": 2, rx: 3 }, g2);
    const zx0 = 120, zy0 = 60, zt = 8 * 4 / p; // zoom region: 32 × 32 px = 8 × 8 tokens at p = 4
    const zx = ix + zx0 / W * iw, zy = iy + zy0 / H * ih, zw = 8 / W * iw;
    el("rect", { x: zx - 1, y: zy - 1, width: zw + 2, height: zw + 2, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, g2);
    const bx = 400, by = 160, bw = 106;
    el("line", { x1: zx, y1: zy + zw, x2: bx, y2: by, stroke: css("--accent"), "stroke-width": 1 }, g2); el("line", { x1: zx + zw, y1: zy + zw, x2: bx + bw, y2: by, stroke: css("--accent"), "stroke-width": 1 }, g2);
    // the zoom: 32 × 32 "pixels" made by upsampling 8 × 8 tokens of the toy scene, with patch grid every p pixels
    const crop = new Float32Array(32 * 32), rr = rng(9);
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) { const x = zx0 + (i + .5) / 4 - .5, y = zy0 + (j + .5) / 4 - .5, x0 = Math.floor(x), y0 = Math.floor(y), a = x - x0, b = y - y0, g = (u, v) => S.ir[clamp(v, 0, H - 1) * W + clamp(u, 0, W - 1)];
      crop[j * 32 + i] = (1 - a) * (1 - b) * g(x0, y0) + a * (1 - b) * g(x0 + 1, y0) + (1 - a) * b * g(x0, y0 + 1) + a * b * g(x0 + 1, y0 + 1) + 4 * gauss(rr); }
    SB.img(g2, SB.url(SB.irPaint(crop, 32, 32)), bx, by, bw, bw);
    for (let q = 0; q <= 32; q++) { const c = bx + q * bw / 32, major = q % p === 0;
      if (!major && p > 2) { el("line", { x1: c, x2: c, y1: by, y2: by + bw, stroke: "#fff", "stroke-opacity": .18, "stroke-width": .6 }, g2); el("line", { y1: by + q * bw / 32, y2: by + q * bw / 32, x1: bx, x2: bx + bw, stroke: "#fff", "stroke-opacity": .18, "stroke-width": .6 }, g2); }
      if (major) { el("line", { x1: c, x2: c, y1: by, y2: by + bw, stroke: css("--accent-2"), "stroke-width": 1.6 }, g2); el("line", { y1: by + q * bw / 32, y2: by + q * bw / 32, x1: bx, x2: bx + bw, stroke: css("--accent-2"), "stroke-width": 1.6 }, g2); } }
    el("rect", { x: bx, y: by, width: bw / 32 * p, height: bw / 32 * p, fill: css("--accent"), "fill-opacity": .35, stroke: css("--accent"), "stroke-width": 2 }, g2);
    SB.txt(g2, ix + iw / 2, iy + ih + 13, "one channel (toy IR), 512 × 896 px", { "font-size": 11, fill: css("--muted"), "text-anchor": "middle" });
    [["zoom", "--muted", 11], [`1 patch =`, "--fg", 12], [`${p} × ${p} px`, "--accent", 13], [`= ${6 * p} × ${6 * p} km`, "--fg", 12], [`${512 / p} × ${896 / p}`, "--muted", 11], ["patches", "--muted", 11]].forEach(([s, c, f], k) => SB.txt(g2, 514, 176 + 17 * k, s, { fill: css(c), "font-size": f - .5, "font-weight": k === 2 ? 700 : 400 }));
    arrow3(594, 140, 605, "");
    // ③ embed
    const g3 = el("g", { opacity: op(2) }, svg), px0 = 618, py0 = 108, ps = 46;
    for (let d = 4; d >= 1; d--) el("rect", { x: px0 + 5 * d, y: py0 - 5 * d, width: ps, height: ps, fill: css("--card"), stroke: css(M.g[Math.min(d, n - 1)][3]), "stroke-width": 1.6 }, g3);
    SB.img(g3, SB.url(SB.irPaint(crop.slice(0, 32 * 32).filter((_, k) => (k % 32) < 4 && k < 32 * 4), 4, 4)), px0, py0, ps, ps);
    el("rect", { x: px0, y: py0, width: ps, height: ps, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, g3);
    SB.txt(g3, px0 + 26, py0 + ps + 18, `${p} × ${p} × ${C}`, { class: "mono", "font-size": 12.5, "text-anchor": "middle", "font-weight": 600 });
    SB.txt(g3, px0 + 26, py0 + ps + 34, `= ${fmtN(p * p * C)} numbers`, { "font-size": 11.5, "text-anchor": "middle", fill: css("--muted") });
    arrow(g3, 686, 130, 714, 130, "sbTkAr"); SB.txt(g3, 700, 122, "W", { "font-size": 13, "font-style": "italic", "text-anchor": "middle", "font-weight": 700, fill: css("--accent") });
    const vr = rng(3); for (let q = 0; q < 24; q++) el("rect", { x: 722, y: 46 + q * 7.5, width: 20, height: 7, fill: CM.div(.5 + .45 * Math.tanh(gauss(vr))) }, g3);
    el("rect", { x: 722, y: 46, width: 20, height: 180, fill: "none", stroke: css("--accent"), "stroke-width": 1.6 }, g3);
    SB.txt(g3, 748, 140, "768", { class: "mono", "font-size": 13, "font-weight": 700, fill: css("--accent") });
    SB.txt(g3, 686, 248, "same W for every patch", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") });
    SB.txt(g3, 686, 264, "(strided conv, stride = kernel)", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") });
    arrow3(778, 140, 789, "");
    // ④ tokens
    const g4 = el("g", { opacity: op(3) }, svg), gx = 804, gy = 44, gw = 178, gh = 102, nc = 14, nr = 8;
    for (let a = 0; a < nr; a++) for (let b = 0; b < nc; b++) { let s = 0; for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) s += S.ir[(a * 16 + j) * W + b * 16 + i];
      el("rect", { x: gx + b * gw / nc + .6, y: gy + a * gh / nr + .6, width: gw / nc - 1.2, height: gh / nr - 1.2, rx: 2, fill: SB.GRAY(clamp((300 - s / 256) / 104, 0, 1)) }, g4); }
    el("rect", { x: gx + 6 * gw / nc, y: gy + 3 * gh / nr, width: gw / nc, height: gh / nr, fill: "none", stroke: css("--accent"), "stroke-width": 2.2 }, g4);
    const NT = (512 / p) * (896 / p);
    SB.txt(g4, gx + gw / 2, gy + gh + 18, `${512 / p} × ${896 / p} = ${fmtN(NT)} tokens`, { "font-size": 13, "font-weight": 700, "text-anchor": "middle", class: "mono" });
    SB.txt(g4, gx + gw / 2, gy + gh + 35, "each a vector of 768 numbers", { "font-size": 11.5, "text-anchor": "middle", fill: css("--muted") });
    SB.txt(g4, gx + gw / 2, gy + gh + 52, "(drawn: 1 square = 16 × 16 tokens)", { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted") });
    el("rect", { x: gx + 8, y: 212, width: gw - 16, height: 30, rx: 8, fill: css("--accent"), "fill-opacity": .12, stroke: css("--accent") }, g4);
    SB.txt(g4, gx + gw / 2, 232, "→ 16 DiT blocks (NA 31 × 31)", { "font-size": 12.5, "font-weight": 600, "text-anchor": "middle", fill: css("--accent") });
    SB.txt(g4, gx + gw / 2, 262, "→ linear head, unpatchify", { "font-size": 11.5, "text-anchor": "middle", fill: css("--muted") });
    SB.txt(g4, gx + gw / 2, 278, "→ forecast on 512 × 896", { "font-size": 11.5, "text-anchor": "middle", fill: css("--muted") });
    function arrow3(x1, y, x2, lab) { arrow(svg, x1, y, x2, y, "sbTkAr"); }
    function arrow(host, x1, y1, x2, y2, id) { el("line", { x1, y1, x2, y2, stroke: css("--muted"), "stroke-width": 1.8, "marker-end": `url(#${id})` }, host); }
    // card, tally, readout
    $("#sbTkCard").innerHTML = `<h4 style="color:var(--accent)">${CARDS[step][0]}</h4><p>${CARDS[step][1]}</p>`;
    const NA = NT * Math.min(961, NT), e = v => { const [a, b] = v.toExponential(1).split("e+"); return `${a}·10<sup>${b}</sup>`; };
    $("#sbTkRead").innerHTML = `<div><span>Tokens N</span><b>${fmtN(NT)}</b></div><div><span>Token</span><b>${6 * p} km</b></div><div><span>Numbers in</span><b class="c-data">${fmtN(C * p * p)}</b></div><div><span>Global N²</span><b class="c-lw">${e(NT * NT)}</b></div><div><span>NA N·961</span><b class="c-ok">${e(NA)}</b></div>`;
  }
  render(); return render;
});

/* ───────── 2 · neighborhood attention ───────── */
demo("sb-na", () => {
  const S = SB.scene(), W = S.W, H = S.H, N = W * H; let q = [60, 64], k = 31;
  const Ls = slider("sbNaL", v => v + (v > 1 ? " layers" : " layer"), render);
  chips($("#sbNaK"), v => { k = +v; render(); });
  const start = (c, n) => clamp(c - (k - 1) / 2, 0, n - k);
  function grow(L) { let x0 = q[0], x1 = q[0], y0 = q[1], y1 = q[1]; const out = [];
    for (let l = 0; l < L; l++) { x0 = start(x0, W); x1 = start(x1, W) + k - 1; y0 = start(y0, H); y1 = start(y1, H) + k - 1; out.push([x0, y0, x1, y1]); }
    return out; }
  function toAll() { let n = 0, x0 = q[0], x1 = q[0], y0 = q[1], y1 = q[1];
    while (!(x0 === 0 && y0 === 0 && x1 === W - 1 && y1 === H - 1) && n < 200) { x0 = start(x0, W); x1 = start(x1, W) + k - 1; y0 = start(y0, H); y1 = start(y1, H) + k - 1; n++; }
    return n; }
  const base = SB.irPaint(S.ir, W, H);
  function render() {
    const L = Ls(), F = grow(L), A = css("--accent"), Mg = css("--mag"), Lw = css("--lw");
    SB.view($("#sbNaMap"), base, W, H, { S: 3, onCell: (i, j) => { q = [i, j]; render(); }, overlay: (g, s) => {
      const [fx0, fy0, fx1, fy1] = F[F.length - 1];
      g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, 0, W * s, H * s);
      g.save(); g.beginPath(); g.rect(fx0 * s, fy0 * s, (fx1 - fx0 + 1) * s, (fy1 - fy0 + 1) * s); g.clip(); g.drawImage(base, 0, 0, W * s, H * s); g.restore();
      g.lineWidth = 1.5; g.strokeStyle = Mg; g.setLineDash([5, 4]);
      F.slice(1).forEach(([a, b, c, d]) => g.strokeRect(a * s + .5, b * s + .5, (c - a + 1) * s - 1, (d - b + 1) * s - 1));
      g.setLineDash([]);
      const [a, b, c, d] = F[0]; g.fillStyle = A; g.globalAlpha = .3; g.fillRect(a * s, b * s, (c - a + 1) * s, (d - b + 1) * s); g.globalAlpha = 1; g.lineWidth = 3; g.strokeStyle = A; g.strokeRect(a * s + 1.5, b * s + 1.5, (c - a + 1) * s - 3, (d - b + 1) * s - 3);
      if (L > 1) { g.lineWidth = 3; g.strokeStyle = Mg; g.strokeRect(fx0 * s + 1.5, fy0 * s + 1.5, (fx1 - fx0 + 1) * s - 3, (fy1 - fy0 + 1) * s - 3); }
      g.fillStyle = Lw; g.fillRect(q[0] * s - 2, q[1] * s - 2, s + 4, s + 4); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.strokeRect(q[0] * s - 2, q[1] * s - 2, s + 4, s + 4);
      g.font = "600 13px system-ui, sans-serif"; g.fillStyle = "#fff"; g.fillText("1 token = 24 km", 8, H * s - 10); g.fillRect(118, H * s - 15, s * 10, 3); g.fillText("240 km", 124 + s * 10, H * s - 10);
    } });
    const [fx0, fy0, fx1, fy1] = F[F.length - 1], fw = fx1 - fx0 + 1, fh = fy1 - fy0 + 1;
    $("#sbNaCap").innerHTML = `<b style="color:var(--lw)">■</b> query token (row ${q[1]}, column ${q[0]}) · <b style="color:var(--accent)">■</b> its ${k} × ${k} window in one layer · <b style="color:var(--mag)">- - -</b> what it can depend on after 2, 3, … layers. Click anywhere to move the token.`;
    const nAll = toAll();
    $("#sbNaRead").innerHTML = `<div><span>Window</span><b>${fmtN(k * k)}</b></div><div><span>= km</span><b>${fmtN(k * 24)}</b></div><div><span>After ${L} layer${L > 1 ? "s" : ""}</span><b class="c-arch">${fw} × ${fh}</b></div><div><span>% of domain</span><b class="c-arch">${fmt(100 * fw * fh / N, 0)} %</b></div><div><span>Layers to see all</span><b class="${nAll <= 16 ? "c-ok" : "c-lw"}">${nAll}</b></div>`;
    const glob = N * N, na = N * k * k;
    VIZ.bars($("#sbNaCost"), [{ label: "global: N²", v: glob, col: "--lw" }, { label: `NA: N · ${k}²`, v: na, col: "--ok" }], { W: 420, labelW: 92, digits: 0, rowH: 26 });
    $("#sbNaCost").insertAdjacentHTML("beforeend", `<p class="note" style="margin:2px 0 0">N = 128 × 224 = 28,672 tokens. NA computes <b>${fmt(glob / na, 1)}× fewer</b> scores per layer and head; the receptive field grows by ${k - 1} tokens (${(k - 1) * 24} km) per layer.</p>`);
  }
  render(); return render;
});

/* ───────── 3 · one DiT block ───────── */
demo("sb-block", () => {
  let step = 0; chips($("#sbBkStep"), v => { step = +v; render(); });
  const sS = slider("sbBkS", v => fmt(10 ** v, 10 ** v < .1 ? 3 : 10 ** v < 10 ? 2 : 1), render);
  const r = rng(77), NF = 12, FX = Array.from({ length: NF }, () => .8 + 1.6 * gauss(r)), A = Array.from({ length: NF }, () => [1.2 * gauss(r), 2 * (r() - .5), .6 + r(), 6 * r()]);
  const CARD = [["① Normalise", "<b>LayerNorm</b> rescales each token's 768 numbers to mean 0 and variance 1. Without its own scale and shift: those come from σ in the next step."],
    ["② Condition on the noise level σ", "σ is embedded (EDM uses c<sub>noise</sub> = ¼ ln σ), passed through a small MLP and turned into six vectors of 768: scales <b>γ</b>, shifts <b>β</b> and gates <b>α</b> for the two halves of the block. <b>Adaptive layer norm</b>: the same weights act differently at σ = 50 (mostly noise) and σ = 0.01 (almost clean)."],
    ["③ Neighborhood attention", "Each token attends to its 31 × 31 neighbours (previous slide). Queries, keys and values are linear maps of the modulated tokens; several heads run in parallel. This is the only step that mixes information between places."],
    ["④ Gate and add back", "The attention output is multiplied by the gate <b>α₁</b> and <b>added</b> to the block's input (a <b>residual connection</b>). In adaLN-Zero the gates start at zero, so a fresh block begins as the identity: training starts stable."],
    ["⑤ Normalise and modulate again", "A second LayerNorm, with its own σ-dependent scale γ₂ and shift β₂."],
    ["⑥ MLP: per-token processing", "A two-layer network (768 → 3,072 → 768 in the standard DiT, GELU in between) applied to every token separately. No information moves between tokens here; this is where most of the parameters are."],
    ["⑦ Gate and add back", "Gate α₂, then the second residual addition. The output has the same shape as the input: 28,672 tokens × 768."],
    ["⑧ Repeat 16 times, then the output head", "16 such blocks run one after the other. A final adaptive LayerNorm and a linear layer map each token to 4 × 4 pixels of the output channels; reassembled, this is D<sub>θ</sub>'s guess of the clean 512 × 896 state (or, with EDM pre-conditioning, the correction F<sub>θ</sub>)."]];
  // nodes: [key, label lines, width, step indices that light it]
  const NODES = [["in", ["tokens in", "28,672 × 768"], 84, [7]], ["ln1", ["Layer", "Norm"], 56, [0]], ["m1", ["scale γ₁", "shift β₁"], 66, [1]], ["na", ["Neighborhood", "attention", "31 × 31"], 104, [2]],
    ["g1", ["× gate", "α₁"], 54, [3]], ["p1", ["+"], 30, [3]], ["ln2", ["Layer", "Norm"], 56, [4]], ["m2", ["scale γ₂", "shift β₂"], 66, [4]], ["mlp", ["MLP", "768→3072→768"], 102, [5]], ["g2", ["× gate", "α₂"], 54, [6]], ["p2", ["+"], 30, [6]], ["out", ["tokens out", "× 16 blocks"], 84, [7]]];
  function render() {
    const svg = svgIn($("#sbBkFig"), 1000, 222); arrowDefs(svg, "sbBkAr", css("--muted")); arrowDefs(svg, "sbBkAr2", css("--arch"));
    const gap = (1000 - 8 - NODES.reduce((s, n) => s + n[2], 0)) / (NODES.length - 1), X = {}, Y = 88, Hn = 62; let x = 4;
    NODES.forEach(n => { X[n[0]] = [x, x + n[2]]; x += n[2] + gap; });
    // residual arcs
    const arc = (a, b, on) => { const x1 = (X[a][0] + X[a][1]) / 2, x2 = (X[b][0] + X[b][1]) / 2;
      el("path", { d: `M${x1} ${Y - Hn / 2} V24 H${x2} V${Y - 15 - 2}`, fill: "none", stroke: css(on ? "--accent" : "--muted"), "stroke-width": on ? 2.6 : 1.5, "marker-end": "url(#sbBkAr)", opacity: on ? 1 : .7 }, svg);
      SB.txt(svg, (x1 + x2) / 2, 18, "residual: skip the sub-layer, add back", { "font-size": 11, "text-anchor": "middle", fill: css(on ? "--accent" : "--muted") }); };
    arc("in", "p1", step === 3); arc("p1", "p2", step === 6);
    NODES.forEach((n, i) => { const [x0, x1] = X[n[0]], on = n[3].includes(step), plus = n[0][0] === "p";
      if (i < NODES.length - 1) el("line", { x1: x1 + 1, x2: X[NODES[i + 1][0]][0] - 2, y1: Y, y2: Y, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#sbBkAr)" }, svg);
      const col = n[0] === "na" ? "--cool" : n[0] === "mlp" ? "--data" : n[0][0] === "m" || n[0][0] === "g" ? "--arch" : "--fg";
      if (plus) el("circle", { cx: (x0 + x1) / 2, cy: Y, r: 15, fill: on ? css("--accent") : css("--card"), "fill-opacity": on ? .2 : 1, stroke: css(on ? "--accent" : "--line"), "stroke-width": on ? 2.6 : 1.4 }, svg);
      else el("rect", { x: x0, y: Y - Hn / 2, width: x1 - x0, height: Hn, rx: 10, fill: on ? css("--accent") : css("--card"), "fill-opacity": on ? .14 : 1, stroke: css(on ? "--accent" : col === "--fg" ? "--line" : col), "stroke-width": on ? 2.6 : 1.4 }, svg);
      n[1].forEach((s, k) => SB.txt(svg, (x0 + x1) / 2, Y + (k - (n[1].length - 1) / 2) * 15 + 4.5, s, { "text-anchor": "middle", "font-size": plus ? 20 : k ? 11 : 12.5, "font-weight": k ? 400 : 600, fill: css(k ? "--muted" : col === "--fg" ? "--fg" : col), class: k && /\d/.test(s) ? "mono" : "" })); });
    // σ branch: σ → embedding + MLP (bottom row) → a bus of six vectors → dashed risers into the modulation and gate boxes
    const on2 = step === 1 || step === 4 || step === 3 || step === 6 || step === 7, bus = 160, by = 196, act = step === 1;
    el("rect", { x: 4, y: by - 20, width: 60, height: 40, rx: 10, fill: css("--card"), stroke: css("--arch"), "stroke-width": act ? 2.6 : 1.4 }, svg);
    SB.txt(svg, 34, by + 6, "σ", { "text-anchor": "middle", "font-size": 19, "font-style": "italic", fill: css("--arch"), "font-weight": 600 });
    el("line", { x1: 66, x2: 92, y1: by, y2: by, stroke: css("--arch"), "stroke-width": 1.6, "marker-end": "url(#sbBkAr2)" }, svg);
    el("rect", { x: 96, y: by - 22, width: 176, height: 44, rx: 10, fill: act ? css("--accent") : css("--card"), "fill-opacity": act ? .14 : 1, stroke: css(act ? "--accent" : "--arch"), "stroke-width": act ? 2.6 : 1.4 }, svg);
    SB.txt(svg, 184, by - 4, "embed c_{noise} = ¼ ln σ, MLP", { "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: css("--arch") });
    SB.txt(svg, 184, by + 12, "→ six vectors of 768", { "text-anchor": "middle", "font-size": 10.5, fill: css("--muted") });
    el("path", { d: `M272 ${by} H290 V${bus} H${X.g2[1] + 10}`, fill: "none", stroke: css("--arch"), "stroke-width": on2 ? 2 : 1.3, "stroke-dasharray": "5 4" }, svg);
    [["m1", "γ₁, β₁", [1]], ["g1", "α₁", [3]], ["m2", "γ₂, β₂", [4]], ["g2", "α₂", [6]]].forEach(([key, lab, st]) => { const xm = (X[key][0] + X[key][1]) / 2, on = st.includes(step) || act;
      el("path", { d: `M${Math.max(xm, 290)} ${bus} H${xm} V${Y + Hn / 2 + 4}`, fill: "none", stroke: css("--arch"), "stroke-width": on ? 2.2 : 1.3, "stroke-dasharray": "4 3", "marker-end": "url(#sbBkAr2)" }, svg);
      SB.txt(svg, xm + 6, Y + Hn / 2 + 20, lab, { "font-size": 12, fill: css("--arch"), "font-weight": 600 }); });
    SB.txt(svg, 304, by + 10, "the same six vectors modulate every token · gates α start at zero (adaLN-Zero), so a new block begins as the identity", { "font-size": 11, fill: css("--muted") });
    if (step === 7) { el("rect", { x: X.in[0] - 2, y: 4, width: X.out[1] - X.in[0] + 4, height: Y + Hn / 2 + 2, rx: 14, fill: "none", stroke: css("--accent"), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg); }
    $("#sbBkCard").innerHTML = `<h4 style="color:var(--accent)">${CARD[step][0]}</h4><p>${CARD[step][1]}</p>`;
    $("#sbBkCalc").innerHTML = `<span class="m">parameters per block (our estimate, standard DiT sizes, d = 768)</span>
attention  Q, K, V, out    4 × 768²          = <span class="k">2.36 M</span>
MLP        768→3072→768    2 × 768 × 3,072   = <span class="k">4.72 M</span>
adaLN      σ-emb → 6 × 768 768 × 4,608       = <span class="k">3.54 M</span>
≈ 10.6 M × 16 blocks ≈ <b>170 M</b> <span class="m">· paper: 195 M in total (§4.2.2); the rest is</span>
<span class="m">patch embedding, noise embedding, output head, details not listed</span>`;
    // toy adaLN on one token
    const s = 10 ** sS(), ls = Math.log(s), m = mean(FX), sd0 = sd(FX), xh = FX.map(v => (v - m) / sd0);
    const out = xh.map((v, j) => (1 + .55 * Math.tanh(A[j][0] * (ls - A[j][1]) / 2)) * v + .45 * Math.sin(A[j][2] * ls + A[j][3]));
    const Wb = 460, Hb = 122, bs = svgIn($("#sbBkBars"), Wb, Hb), y0 = 52, sc = 16;
    el("line", { x1: 4, x2: Wb - 4, y1: y0, y2: y0, stroke: css("--line") }, bs);
    xh.forEach((v, j) => { const x = 8 + j * (Wb - 12) / NF, w = (Wb - 12) / NF / 2 - 3;
      el("rect", { x, y: Math.min(y0, y0 - clamp(v, -3, 3) * sc), width: w, height: Math.abs(clamp(v, -3, 3) * sc), fill: css("--muted"), opacity: .55 }, bs);
      el("rect", { x: x + w + 1, y: Math.min(y0, y0 - clamp(out[j], -3, 3) * sc), width: w, height: Math.abs(clamp(out[j], -3, 3) * sc), fill: css("--accent") }, bs); });
    SB.txt(bs, 4, Hb - 4, "■ LayerNorm(x)", { "font-size": 11, fill: css("--muted") });
    SB.txt(bs, 110, Hb - 4, "■ (1 + γ(σ)) · LN(x) + β(σ)", { "font-size": 11, fill: css("--accent") });
    SB.txt(bs, Wb - 4, Hb - 4, "12 of 768 features · toy", { "font-size": 10.5, fill: css("--muted"), "text-anchor": "end" });
  }
  render(); return render;
});

/* ───────── 4 · diffusion training ───────── */
demo("sb-train", () => {
  const F = SB.futures(), X = F.X, x = X[0], n = x.length, rN = rng(31), NZ = Float32Array.from({ length: n }, () => gauss(rN));
  let step = 0, samples = []; const rS = rng(8);
  const draw = m => { for (let i = 0; i < m; i++) samples.push(Math.log10(SB.SMIN) + rS() * (Math.log10(SB.SMAX) - Math.log10(SB.SMIN))); };
  draw(500);
  chips($("#sbTrStep"), v => { step = +v; render(); });
  const sS = slider("sbTrS", v => fmt(10 ** v, 10 ** v < .1 ? 3 : 10 ** v < 10 ? 2 : 1), render);
  $("#sbTrDraw").onclick = () => { draw(500); render(); }; $("#sbTrReset").onclick = () => { samples = []; draw(500); render(); };
  const N = SB.NX, M = SB.NY, past = F.past.map(f => SB.url(SB.dbz(f))), tgt = SB.url(SB.paint(x, N, M, { color: CM.precip, lo: 0, hi: 1, mask: v => v < 5 / 60 }));
  const CARD = [["① A training pair", "From the archive (GOES 2018–2023, MRMS 2020–2023), take the past states x<sub>t−</sub> (6 frames for nowcasts, 1 for nearcasts) and the true next state x<sub>t+</sub>. Millions of such pairs: about 6 M iterations of batch 32."],
    ["② Draw a noise level σ", "σ is drawn <b>uniformly in log σ</b> between σ<sub>min</sub> and σ<sub>max</sub> (right): every decade of noise is trained equally often. (EDM's own default is a log-normal, dashed.)"],
    ["③ Add noise", "Add Gaussian noise of standard deviation σ to the <b>future</b> frame only; the past frames and c stay clean. At σ = 80 the frame is gone; at σ = 0.01 it is untouched."],
    ["④ Denoise", "D<sub>θ</sub> sees the noisy future, the past frames, c and σ, and guesses the clean future. When σ is large the honest best guess is the <b>average of all futures compatible with the past</b>: blurry. As σ falls, the noisy frame itself pins down the details."],
    ["⑤ Weighted squared error", "Loss = λ(σ) ‖D<sub>θ</sub> − x<sub>t+</sub>‖². λ(σ) and the c-factors keep every noise level equally important to the optimiser (Stable AdamW, lr 5·10⁻⁴ → 0 cosine, 32 H100 × ~48 h)."],
    ["⑥ Two experts", "The σ range is split at σ<sub>int</sub>. A <b>coarse expert</b> learns the high-noise regime (where only the large-scale layout can be decided), a <b>fine expert</b> the low-noise regime (convective detail). Each is trained only on its own σ."]];
  function render() {
    const lsig = sS(), s = 10 ** lsig, y = Float32Array.from(x, (v, i) => v + s * NZ[i]), { d, w: wts } = SB.denoise(y, s, X), err = Float32Array.from(d, (v, i) => v - x[i]);
    const coarse = s > SB.SINT, svg = svgIn($("#sbTrFig"), 1000, 200); arrowDefs(svg, "sbTrAr", css("--muted"));
    const on = (...k) => k.includes(step), op = (...k) => on(...k) ? 1 : .32;
    [[0, 230, [0]], [252, 96, [1]], [370, 136, [2]], [528, 170, [3, 5]], [720, 132, [3]], [874, 124, [4]]].forEach(([x0, w, st]) => SB.stage(svg, x0, 4, w, 192, st.includes(step)));
    const T = [[8, "① past + future", [0]], [258, "② draw σ", [1]], [376, "③ add noise", [2]], [534, "④ D_{θ} denoises", [3, 5]], [726, "④ D_{θ}'s guess", [3]], [880, "⑤ loss", [4]]];
    T.forEach(([x0, t, st]) => SB.txt(svg, x0 + 4, 24, t, { "font-size": 13, "font-weight": 600, fill: css(st.includes(step) ? "--accent" : "--muted") }));
    const gA = el("g", { opacity: op(0) }, svg);
    past.forEach((u, k) => { SB.img(gA, u, 12 + 9 * k, 50 + 9 * k, 92, 53); el("rect", { x: 12 + 9 * k, y: 50 + 9 * k, width: 92, height: 53, fill: "none", stroke: css("--lw"), "stroke-width": 1.6 }, gA); });
    SB.txt(gA, 12, 140, "x_{t−} : past frames", { "font-size": 11.5, fill: css("--lw"), "font-weight": 600 }); SB.txt(gA, 12, 155, "(the condition)", { "font-size": 11, fill: css("--muted") });
    SB.img(gA, tgt, 126, 50, 98, 56); el("rect", { x: 126, y: 50, width: 98, height: 56, fill: "none", stroke: css("--fg"), "stroke-width": 2 }, gA);
    SB.txt(gA, 126, 122, "x_{t+} : true future", { "font-size": 11.5, "font-weight": 600 }); SB.txt(gA, 126, 137, "(the target)", { "font-size": 11, fill: css("--muted") });
    const gB = el("g", { opacity: op(1) }, svg), ax = lin(Math.log10(SB.SMIN), Math.log10(SB.SMAX), 264, 338);
    SB.txt(gB, 300, 80, "σ = " + fmt(s, s < .1 ? 3 : 2), { "font-size": 15, "font-weight": 700, "text-anchor": "middle", class: "mono" });
    el("line", { x1: 264, x2: 338, y1: 112, y2: 112, stroke: css("--muted"), "stroke-width": 1.4 }, gB);
    [[SB.SMIN, ".002"], [1, "1"], [SB.SMAX, "80"]].forEach(([v, l]) => { el("line", { x1: ax(Math.log10(v)), x2: ax(Math.log10(v)), y1: 108, y2: 116, stroke: css("--muted") }, gB); SB.txt(gB, ax(Math.log10(v)), 130, l, { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted"), class: "mono" }); });
    el("circle", { cx: ax(lsig), cy: 112, r: 6, fill: css("--accent") }, gB);
    SB.txt(gB, 300, 155, "log-uniform", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") });
    const gC = el("g", { opacity: op(2) }, svg);
    SB.img(gC, SB.url(SB.paint(y, N, M, { color: CM.precip, lo: 0, hi: 1, mask: v => v < 5 / 60 })), 376, 50, 124, 71); el("rect", { x: 376, y: 50, width: 124, height: 71, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, gC);
    SB.txt(gC, 376, 140, "x_{t+} + n,  n ~ N(0, σ²)", { "font-size": 11.5, "font-weight": 600 });
    const gD = el("g", { opacity: op(3, 5) }, svg);
    [["coarse expert", "σ > σ_{int}", coarse, 50], ["fine expert", "σ ≤ σ_{int}", !coarse, 104]].forEach(([a, b, act, y0]) => {
      el("rect", { x: 540, y: y0, width: 146, height: 46, rx: 9, fill: act ? css("--arch") : css("--card"), "fill-opacity": act ? .18 : 1, stroke: css(act ? "--arch" : "--line"), "stroke-width": act ? 2.4 : 1.2 }, gD);
      SB.txt(gD, 613, y0 + 20, a, { "text-anchor": "middle", "font-size": 12.5, "font-weight": 600, fill: css(act ? "--arch" : "--muted") }); SB.txt(gD, 613, y0 + 36, b, { "text-anchor": "middle", "font-size": 11, fill: css("--muted") }); });
    SB.txt(gD, 613, 172, "DiT, 195 M parameters each", { "text-anchor": "middle", "font-size": 11, fill: css("--muted") });
    SB.txt(gD, 613, 187, "inputs: noisy x_{t+}, x_{t−}, c, σ", { "text-anchor": "middle", "font-size": 11, fill: css("--muted") });
    const gE = el("g", { opacity: op(3) }, svg);
    SB.img(gE, SB.url(SB.paint(d, N, M, { color: CM.precip, lo: 0, hi: 1, mask: v => v < 5 / 60 })), 726, 50, 120, 69); el("rect", { x: 726, y: 50, width: 120, height: 69, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, gE);
    const wmax = Math.max(...wts); SB.txt(gE, 726, 138, wmax > .97 ? "≈ the true future" : wmax > .5 ? "mostly one future" : wmax < .1 ? "≈ mean of all futures" : "a few futures mixed", { "font-size": 11.5, "font-weight": 600 });
    SB.txt(gE, 726, 153, "(toy: exact denoiser)", { "font-size": 11, fill: css("--muted") });
    const gF = el("g", { opacity: op(4) }, svg), lam = (s * s + SB.SD ** 2) / (s * SB.SD) ** 2, mse = err.reduce((a, v) => a + v * v, 0) / n;
    SB.img(gF, SB.url(SB.paint(err, N, M, { color: CM.div, lo: -.6, hi: .6 })), 880, 50, 112, 64); el("rect", { x: 880, y: 50, width: 112, height: 64, fill: "none", stroke: css("--line") }, gF);
    SB.txt(gF, 880, 132, "D_{θ} − x_{t+}", { "font-size": 11.5, "font-weight": 600 });
    SB.txt(gF, 880, 150, "λ = " + (lam < 100 ? fmt(lam, 2) : lam.toExponential(1)), { "font-size": 11.5, class: "mono" });
    SB.txt(gF, 880, 166, "mse = " + (mse > 1e-6 ? mse.toExponential(1) : "≈ 0"), { "font-size": 11.5, class: "mono" });
    [[230, 252], [348, 370], [506, 528], [698, 720], [852, 874]].forEach(([a, b]) => el("line", { x1: a + 2, x2: b - 2, y1: 90, y2: 90, stroke: css("--muted"), "stroke-width": 1.8, "marker-end": "url(#sbTrAr)" }, svg));
    $("#sbTrCard").innerHTML = `<h4 style="color:var(--accent)">${CARD[step][0]}</h4><p>${CARD[step][1]}</p>`;
    // histogram
    const Wh = 330, Hh = 168, lo = Math.log10(SB.SMIN), hi = Math.log10(SB.SMAX), nb = 23, bw = (hi - lo) / nb, cnt = new Array(nb).fill(0);
    samples.forEach(v => cnt[Math.min(nb - 1, Math.floor((v - lo) / bw))]++);
    const mu = -1.2 / Math.LN10, sg = 1.2 / Math.LN10, ln = v => samples.length * bw * Math.exp(-.5 * ((v - mu) / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI));
    const mx = Math.max(...cnt, ln(mu)) * 1.05, hs = svgIn($("#sbTrHist"), Wh, Hh), X0 = lin(lo, hi, 6, Wh - 6), Y0 = lin(0, mx, Hh - 30, 34);
    cnt.forEach((c, b) => { const v0 = lo + b * bw, fine = v0 + bw / 2 <= Math.log10(SB.SINT); el("rect", { x: X0(v0) + .6, y: Y0(c), width: X0(v0 + bw) - X0(v0) - 1.2, height: Y0(0) - Y0(c), fill: css(fine ? "--ok" : "--arch"), opacity: .75 }, hs); });
    const pts = []; for (let v = lo; v <= hi + 1e-9; v += .05) pts.push([X0(v), Y0(ln(v))]);
    el("path", { d: path(pts), fill: "none", stroke: css("--muted"), "stroke-width": 1.6, "stroke-dasharray": "4 3" }, hs);
    el("line", { x1: 6, x2: Wh - 6, y1: Hh - 30, y2: Hh - 30, stroke: css("--line") }, hs);
    [[SB.SMIN, "0.002"], [.1, "0.1"], [1, "1"], [10, "10"], [SB.SMAX, "80"]].forEach(([v, l]) => SB.txt(hs, clamp(X0(Math.log10(v)), 16, Wh - 12), Hh - 16, l, { "font-size": 11, "text-anchor": "middle", fill: css("--muted"), class: "mono" }));
    el("line", { x1: X0(0), x2: X0(0), y1: 4, y2: Hh - 30, stroke: css("--fg"), "stroke-width": 1.4, "stroke-dasharray": "5 3" }, hs);
    SB.txt(hs, X0(0) - 5, 14, "← fine expert", { "font-size": 11.5, "text-anchor": "end", fill: css("--ok"), "font-weight": 600 }); SB.txt(hs, X0(0) + 5, 14, "coarse →", { "font-size": 11.5, fill: css("--arch"), "font-weight": 600 });
    SB.txt(hs, X0(0) + 5, 28, "σ_{int} (toy)", { "font-size": 10.5, fill: css("--muted") });
    el("line", { x1: X0(lsig), x2: X0(lsig), y1: 34, y2: Hh - 30, stroke: css("--accent"), "stroke-width": 2.6 }, hs);
    SB.txt(hs, Wh - 6, Hh - 2, "σ (log scale)", { "font-size": 11, "text-anchor": "end", fill: css("--muted") });
    SB.txt(hs, 6, Hh - 2, `${fmtN(samples.length)} draws`, { "font-size": 11, fill: css("--muted") });
    const c2 = SB.SD ** 2, q = Math.sqrt(s * s + c2), fc = samples.filter(v => v > 0).length / samples.length, f3 = v => v < 1e4 ? fmt(v, v < 10 ? 3 : 1) : v.toExponential(1);
    $("#sbTrCalc").innerHTML = `<span class="m">EDM pre-conditioning</span>
<span class="m">σ = ${fmt(s, s < .1 ? 3 : 2)}, σ<sub>d</sub> = 0.5 (σ<sub>data</sub>)</span>
D = c<sub>skip</sub>·x̃ + c<sub>out</sub>·F<sub>θ</sub>(c<sub>in</sub>·x̃)

c<sub>skip</sub> = σ<sub>d</sub>²/(σ²+σ<sub>d</sub>²)
       = <span class="k">${fmt(c2 / (s * s + c2), 3)}</span> <span class="m">input kept</span>
c<sub>out</sub> = σσ<sub>d</sub>/√(σ²+σ<sub>d</sub>²)
       = <span class="k">${fmt(s * SB.SD / q, 3)}</span> <span class="m">correction</span>
c<sub>in</sub> = 1/√(σ²+σ<sub>d</sub>²) = <span class="k">${fmt(1 / q, 3)}</span>
c<sub>noise</sub> = ¼ ln σ = <span class="k">${fmt(Math.log(s) / 4, 2)}</span>
λ(σ) = 1/c<sub>out</sub>² = <span class="k">${f3(lam)}</span>

expert: <b style="color:var(${coarse ? "--arch" : "--ok"})">${coarse ? "coarse" : "fine"}</b>
<span class="m">coarse share of draws: ${fmt(100 * fc, 0)} %</span>`;
  }
  render(); return render;
});

/* ───────── 5 · sampling ───────── */
demo("sb-sample", slide => {
  const F = SB.futures(), X = F.X, n = X[0].length, N = SB.NX, M = SB.NY, sch = SB.sched, TR = new Map();
  let seed = 1, churn = 1, timer = null;
  const iS = slider("sbSmI", v => v + " / 100", render);
  chips($("#sbSmSeed"), v => { seed = +v; stop(); render(); }); chips($("#sbSmChurn"), v => { churn = +v; stop(); render(); });
  function traj() {
    const key = seed + "|" + churn; if (TR.has(key)) return TR.get(key);
    const r = rng(1000 + 17 * seed), xs = [], ds = [], ws = [];
    let x = Float32Array.from({ length: n }, () => sch[0] * gauss(r));
    const D = (y, s) => s > 0 ? SB.denoise(y, s, X) : { d: y, w: null };
    for (let i = 0; i < SB.NSTEP; i++) {
      const t = sch[i], t1 = sch[i + 1], g = churn && t >= .05 && t <= 50 ? Math.min(30 / SB.NSTEP, Math.SQRT2 - 1) : 0, th = t + g * t;
      const xh = g ? Float32Array.from(x, v => v + Math.sqrt(th * th - t * t) * 1.003 * gauss(r)) : x;
      const a0 = SB.denoise(x, t, X), a = g ? D(xh, th) : a0; xs.push(x); ds.push(a0.d); ws.push(a0.w);
      const dd = Float32Array.from(xh, (v, k) => (v - a.d[k]) / th); let nx = Float32Array.from(xh, (v, k) => v + (t1 - th) * dd[k]);
      if (t1 > 0) { const b = D(nx, t1); nx = Float32Array.from(xh, (v, k) => v + (t1 - th) * (.5 * dd[k] + .5 * (nx[k] - b.d[k]) / t1)); }
      x = nx; }
    xs.push(x); ds.push(x); const wl = new Float64Array(24); let best = 0, bd = Infinity; X.forEach((f, k) => { let s = 0; for (let i = 0; i < n; i++) s += (f[i] - x[i]) ** 2; if (s < bd) { bd = s; best = k; } }); wl[best] = 1; ws.push(wl);
    const T = { xs, ds, ws }; TR.set(key, T); return T;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } $("#sbSmPlay").textContent = "▶ Play"; }
  $("#sbSmPlay").onclick = () => { if (timer) { stop(); return; } const R = $("#sbSmI"); if (+R.value >= 100) R.value = 0; $("#sbSmPlay").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!slide.classList.contains("on") || +R.value >= 100) { stop(); return; } R.value = +R.value + 1; R.dispatchEvent(new Event("input")); }, 70); };
  const pc = v => SB.paint(v, N, M, { color: CM.precip, lo: 0, hi: 1, mask: u => u < 5 / 60 });
  function render() {
    const T = traj(), i = iS(), s = sch[i], coarse = s > SB.SINT;
    $("#sbSmA").innerHTML = i < 100 ? `x<sub>i</sub>: the sample at σ = ${fmt(s, s < .1 ? 3 : 2)}` : "x<sub>100</sub>: the finished sample";
    SB.view($("#sbSmX"), pc(T.xs[i]), N, M, { S: 4 }); SB.view($("#sbSmD"), pc(T.ds[i]), N, M, { S: 4 });
    SB.dbzBar($("#sbSmLeg"), 300);
    // schedule
    const Ws = 560, Hs = 118, svg = svgIn($("#sbSmSched"), Ws, Hs), lo = Math.log10(SB.SMIN), hi = Math.log10(SB.SMAX), x = lin(0, 100, 40, Ws - 10), y = lin(lo, hi, Hs - 24, 8);
    const kI = sch.findIndex(v => v <= SB.SINT);
    el("rect", { x: x(0), y: 8, width: x(kI) - x(0), height: Hs - 32, fill: css("--arch"), opacity: .08 }, svg); el("rect", { x: x(kI), y: 8, width: x(100) - x(kI), height: Hs - 32, fill: css("--ok"), opacity: .08 }, svg);
    SB.txt(svg, x(kI / 2), 22, "coarse expert", { "font-size": 11, "text-anchor": "middle", fill: css("--arch"), "font-weight": 600 }); SB.txt(svg, x((kI + 100) / 2), 22, "fine expert", { "font-size": 11, "text-anchor": "middle", fill: css("--ok"), "font-weight": 600 });
    el("line", { x1: x(kI), x2: x(kI), y1: 8, y2: Hs - 24, stroke: css("--fg"), "stroke-dasharray": "4 3" }, svg); SB.txt(svg, x(kI) + 4, Hs - 30, `switch at σ_{int}, step ${kI}`, { "font-size": 10.5, fill: css("--muted") });
    el("path", { d: path(sch.slice(0, 100).map((v, k) => [x(k), y(Math.log10(v))])), fill: "none", stroke: css("--accent"), "stroke-width": 2 }, svg);
    [[80, "80"], [1, "1"], [.002, "0.002"]].forEach(([v, l]) => SB.txt(svg, 36, y(Math.log10(v)) + 4, l, { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }));
    [0, 25, 50, 75, 100].forEach(v => SB.txt(svg, x(v), Hs - 8, v, { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }));
    SB.txt(svg, Ws - 10, Hs - 8, "step", { "font-size": 10.5, "text-anchor": "end", fill: css("--muted") }); SB.txt(svg, 4, 12, "σ", { "font-size": 12, "font-style": "italic", fill: css("--muted") });
    el("circle", { cx: x(Math.min(i, 99)), cy: y(Math.log10(sch[Math.min(i, 99)])), r: 6, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 2 }, svg);
    // weights
    const w = T.ws[i], Ww = 400, Hw = 92, ws = svgIn($("#sbSmW"), Ww, Hw), bw = (Ww - 10) / 24; let top = 0; w.forEach((v, k) => { if (v > w[top]) top = k; });
    w.forEach((v, k) => { el("rect", { x: 5 + k * bw + 1, y: 70 - 62 * v, width: bw - 2, height: Math.max(62 * v, .8), fill: css(k === top && v > .5 ? "--accent" : "--muted"), opacity: k === top ? 1 : .6 }, ws); });
    el("line", { x1: 4, x2: Ww - 4, y1: 70.5, y2: 70.5, stroke: css("--line") }, ws);
    SB.txt(ws, 5, 86, "futures 1 … 24 (bar = posterior weight in D)", { "font-size": 10.5, fill: css("--muted") });
    SB.txt(ws, Ww - 5, 86, w[top] > .5 ? `heading for #${top + 1} (${fmt(100 * w[top], 0)} %)` : "undecided", { "font-size": 11, "text-anchor": "end", fill: css(w[top] > .5 ? "--accent" : "--muted"), "font-weight": 600 });
    $("#sbSmRead").innerHTML = `<div><span>Step</span><b>${i}</b></div><div><span>σ<sub>i</sub></span><b>${i < 100 ? fmt(s, s < .1 ? 3 : 2) : "0"}</b></div><div><span>Expert</span><b class="${coarse ? "c-arch" : "c-ok"}">${i < 100 ? (coarse ? "coarse" : "fine") : "done"}</b></div><div><span>Real time ≈</span><b>${fmt(.33 * i, 0)} s</b></div>`;
    $("#sbSmCard").innerHTML = i === 0 ? "<p><b>Step 0.</b> Pure noise with standard deviation σ<sub>max</sub> = 80. The denoiser can only return the <b>average</b> of everything the past allows: a smooth blob.</p>"
      : s > 5 ? "<p><b>High noise.</b> The guess is still close to the mean of all futures; each step removes a little noise in the direction the denoiser points.</p>"
      : coarse ? "<p><b>Coarse expert.</b> Now the noisy sample favours some futures over others: the large-scale layout (where the big systems go) is being decided.</p>"
      : s > .02 ? "<p><b>Fine expert.</b> The layout is fixed; the remaining steps sharpen the convective detail.</p>"
      : "<p><b>Done.</b> Noise is far below the size of the storms. Another seed starts from other noise and can end on another future: that is how StormScope makes ensemble members.</p>";
  }
  render(); return render;
});

/* ───────── 6 · ensembles and probability ───────── */
demo("sb-ens", () => {
  let thr = 30, mode = "cal", trio = null, cyc = 0; const REL = new Map(), PCM = CM.ramp(["#deebf7", "#9ecae1", "#4292c6", "#2171b5", "#08306b"]);
  const lS = slider("sbEnL", v => v === 0 ? "0 (issue time)" : (v * 10 >= 60 ? fmt(v / 6, v % 6 ? 1 : 0) + " h" : v * 10 + " min"), render);
  chips($("#sbEnThr"), v => { thr = +v; render(); }); chips($("#sbEnMode"), v => { mode = v; render(); });
  const E0 = SB.ens(0, "cal"), agg = E0.mem.map((m, k) => m.agg ? k : -1).filter(k => k >= 0), non = E0.mem.map((m, k) => m.agg ? -1 : k).filter(k => k >= 0);
  const first = [agg[0] ?? 0, non[0] ?? 1, non[1] ?? 2];
  $("#sbEnNext").onclick = () => { cyc = (cyc + 1) % 8; trio = cyc ? [3 * cyc - 3, 3 * cyc - 2, 3 * cyc - 1].map(k => k % 24) : null; render(); };
  function rel(m, th) {
    const key = m + th; if (REL.has(key)) return REL.get(key);
    const out = [60, 180, 360].map(t => { const nb = 10, P = new Float64Array(nb), O = new Float64Array(nb), C = new Float64Array(nb);
      for (let d = 0; d < 4; d++) { const E = SB.ens(d, m), tr = SB.field(E.truth, t), mem = E.mem.map(x => SB.field(x, t));
        for (let k = 0; k < tr.length; k++) { let c = 0; for (const f of mem) if (f[k] >= th) c++; const p = c / 24; if (p === 0 && tr[k] < th) { C[0]++; continue; } const b = Math.min(nb - 1, Math.floor(p * nb)); P[b] += p; O[b] += tr[k] >= th ? 1 : 0; C[b]++; } }
      return Array.from({ length: nb }, (_, b) => C[b] >= 15 ? [P[b] / C[b], O[b] / C[b]] : null).filter(Boolean); });
    REL.set(key, out); return out;
  }
  function render() {
    const L = lS(), t = L * 10, Fd = SB.ensFields(0, "cal", t), T = trio || first;
    const host = $("#sbEnThumbs"); host.innerHTML = "";
    [["Observed (toy)", Fd.truth, E0.truth.agg], ...T.map(k => [`Member ${k + 1}`, Fd.mem[k], E0.mem[k].agg])].forEach(([lab, f, a], j) => {
      const d = document.createElement("div"); d.innerHTML = `<h3 style="margin:0 0 3px;${j ? "" : "color:var(--fg)"}">${lab}${t >= 180 ? ` · <span style="color:var(${a ? "--accent" : "--muted"})">${a ? "MCS" : "no MCS"}</span>` : ""}</h3><div></div>`;
      host.appendChild(d); SB.view(d.lastChild, SB.dbz(f), SB.NX, SB.NY, { S: 3 }); });
    // probability
    const Fm = SB.ensFields(0, mode, t), P = new Float32Array(Fm.truth.length); Fm.mem.forEach(f => f.forEach((v, k) => { if (v >= thr) P[k] += 1 / 24; }));
    const ob = Fm.truth, N = SB.NX, fgc = css("--fg");
    SB.view($("#sbEnP"), SB.paint(P, N, SB.NY, { color: PCM, lo: 0, hi: 1, mask: v => v < .02 }), N, SB.NY, { S: 4, overlay: (g, s) => { g.strokeStyle = fgc; g.lineWidth = 1.6; g.beginPath();
      for (let j = 0; j < SB.NY; j++) for (let i = 0; i < N; i++) { const a = ob[j * N + i] >= thr; if (!a) continue;
        if (i + 1 >= N || ob[j * N + i + 1] < thr) { g.moveTo((i + 1) * s, j * s); g.lineTo((i + 1) * s, (j + 1) * s); } if (i === 0 || ob[j * N + i - 1] < thr) { g.moveTo(i * s, j * s); g.lineTo(i * s, (j + 1) * s); }
        if (j + 1 >= SB.NY || ob[(j + 1) * N + i] < thr) { g.moveTo(i * s, (j + 1) * s); g.lineTo((i + 1) * s, (j + 1) * s); } if (j === 0 || ob[(j - 1) * N + i] < thr) { g.moveTo(i * s, j * s); g.lineTo((i + 1) * s, j * s); } }
      g.stroke(); } });
    VIZ.legend($("#sbEnPL"), { color: PCM, min: 0, max: 1, label: `P(≥ ${thr} dBZ), 24 members · outline: observed`, digits: 0, width: 330 });
    $("#sbEnNote").innerHTML = `<div id="sbEnDb"></div>Thumbnails: dBZ. ${mode === "cal" ? "" : "<b>P map uses the '" + (mode === "alike" ? "too alike" : "too wet") + "' toy ensemble.</b> "}${trio ? "" : "The three members are picked like Fig. 4: one aggregates, two don't."}`;
    SB.dbzBar($("#sbEnDb"), 150);
    // reliability
    const R = rel(mode, thr), cols = ["--accent", "--arch", "--mag"], Wr = 420, Hr = 196, svg = svgIn($("#sbEnRel"), Wr, Hr), X = lin(0, 1, 44, Wr - 120), Y = lin(0, 1, Hr - 28, 10);
    [0, .5, 1].forEach(v => { el("line", { x1: X(0), x2: X(1), y1: Y(v), y2: Y(v), class: "grid" }, svg); SB.txt(svg, X(0) - 6, Y(v) + 4, fmt(v, 1), { "font-size": 10.5, "text-anchor": "end", class: "mono", fill: css("--muted") }); SB.txt(svg, X(v), Hr - 12, fmt(v, 1), { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }); });
    el("line", { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), stroke: css("--muted"), "stroke-dasharray": "5 4", "stroke-width": 1.4 }, svg);
    el("path", { d: `M${X(0)} ${Y(0)} L${X(1)} ${Y(1)} L${X(1)} ${Y(0)} Z`, fill: css("--lw"), opacity: .06 }, svg);
    SB.txt(svg, X(.98), Y(.12), "below: probabilities", { "font-size": 10.5, "text-anchor": "end", fill: css("--lw") }); SB.txt(svg, X(.98), Y(.04), "too high (over-confident)", { "font-size": 10.5, "text-anchor": "end", fill: css("--lw") });
    R.forEach((pts, k) => { el("path", { d: path(pts.map(([p, o]) => [X(p), Y(o)])), fill: "none", stroke: css(cols[k]), "stroke-width": 2.2 }, svg); pts.forEach(([p, o]) => el("circle", { cx: X(p), cy: Y(o), r: 3, fill: css(cols[k]) }, svg)); });
    ["1 h", "3 h", "6 h"].forEach((l, k) => SB.txt(svg, Wr - 112, 26 + 16 * k, "— lead " + l, { "font-size": 11.5, fill: css(cols[k]), "font-weight": 600 }));
    SB.txt(svg, Wr - 112, 82, "- - perfect", { "font-size": 11.5, fill: css("--muted") });
    SB.txt(svg, X(.5), Hr - 0, "forecast probability", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") });
    SB.txt(svg, 4, 8, "observed", { "font-size": 11, fill: css("--muted") });
    SB.txt(svg, Wr - 112, 110, `≥ ${thr} dBZ`, { "font-size": 11.5, "font-weight": 600 }); SB.txt(svg, Wr - 112, 126, "4 toy days pooled", { "font-size": 10.5, fill: css("--muted") });
  }
  render(); return render;
});

/* ───────── 7 · fractions skill score ───────── */
demo("sb-fss", () => {
  const N = SB.NX, M = SB.NY, ob = SB.ensFields(0, "cal", 60).truth; let thr = 30;
  const dS = slider("sbFsD", v => v * 6 + " km", render), nS = slider("sbFsN", v => (2 * v + 1) * 6 + " km", render);
  chips($("#sbFsThr"), v => { thr = +v; render(); });
  function render() {
    const d = dS(), nw = 2 * nS() + 1, fc = SB.advect(ob, d * 6, 0), fb = Uint8Array.from(fc, v => v >= thr ? 1 : 0), obb = Uint8Array.from(ob, v => v >= thr ? 1 : 0);
    const cat = new Uint8Array(N * M); let H = 0, Mi = 0, Fa = 0;
    for (let k = 0; k < cat.length; k++) { const a = fb[k], b = obb[k]; cat[k] = a && b ? 1 : b ? 2 : a ? 3 : 0; if (a && b) H++; else if (b) Mi++; else if (a) Fa++; }
    const cols = [SB.rgbOf("--well"), SB.rgbOf("--ok"), SB.rgbOf("--sw"), SB.rgbOf("--lw")];
    SB.view($("#sbFsCat"), SB.paintCat(cat, N, M, cols), N, M, { S: 4, overlay: (g, s) => { const c = 60, r = c - (nw - 1) / 2; g.strokeStyle = css("--accent"); g.lineWidth = 2; g.strokeRect((50 - (nw - 1) / 2) * s, (32 - (nw - 1) / 2) * s, nw * s, nw * s); } });
    const R = SB.fss(fb, obb, nw), diff = Float32Array.from(R.P, (v, k) => v - R.Q[k]);
    $("#sbFsFT").innerHTML = `P<sub>f</sub> − P<sub>o</sub> in ${nw * 6} km windows`;
    SB.view($("#sbFsFr"), SB.paint(diff, N, M, { color: CM.div, lo: -1, hi: 1 }), N, M, { S: 4 });
    const kk = (c, t) => `<span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:var(${c});margin:0 4px -1px 10px"></span>${t}`;
    $("#sbFsKey").innerHTML = `<span class="note" style="margin:0">${kk("--ok", "hit")}${kk("--sw", "miss (observed only)")}${kk("--lw", "false alarm (forecast only)")} · square: one window · right: <span style="color:#d6604d">red</span> forecast too much, <span style="color:#4393c3">blue</span> too little</span>`;
    // curve of FSS vs window
    const pts = [], f0 = obb.reduce((a, v) => a + v, 0) / obb.length, useful = .5 + f0 / 2;
    for (let w = 0; w <= 15; w++) pts.push([(2 * w + 1) * 6, SB.fss(fb, obb, 2 * w + 1).v]);
    const cv = VIZ.curves($("#sbFsCurve"), [{ pts, col: "--accent", label: `FSS, shift ${d * 6} km`, w: 2.4 }, { pts: [[6, useful], [186, useful]], col: "--muted", dash: "5 4", label: "useful: 0.5 + f₀/2" }],
      { xr: [6, 186], yr: [0, 1], xl: "window (km)", yl: "FSS", W: 420, H: 190, xt: [6, 42, 90, 138, 186], yt: [0, .5, 1], xf: v => fmtN(v), yf: v => fmt(v, 1), marks: [[nw * 6, "", "--accent"]], legendAt: "br" });
    el("circle", { cx: cv.X(nw * 6), cy: cv.Y(R.v), r: 5.5, fill: css("--accent"), stroke: css("--bg"), "stroke-width": 2 }, cv.svg);
    const ok = pts.find(p => p[1] >= useful);
    $("#sbFsRead").innerHTML = `<div><span>Pixel CSI</span><b class="c-lw">${fmt(H + Mi + Fa ? H / (H + Mi + Fa) : 1, 2)}</b></div><div><span>FSS at ${nw * 6} km</span><b>${fmt(R.v, 2)}</b></div><div><span>Base rate f₀</span><b class="c-data">${fmt(f0, 3)}</b></div><div><span>Useful from</span><b class="c-ok">${ok ? ok[0] + " km" : "> 186 km"}</b></div>`;
  }
  render(); return render;
});

/* ───────── 8 · object-based verification ───────── */
demo("sb-objects", () => {
  const N = SB.NX, M = SB.NY, KM = SB.KM; let fcK = "ss", sc = "csi";
  const lS = slider("sbObL", v => v * 10 + " min", render), mS = slider("sbObM", v => v + " km", () => { CUR.clear(); render(); });
  chips($("#sbObF"), v => { fcK = v; render(); }); chips($("#sbObSc"), v => { sc = v; render(); });
  const CUR = new Map();
  const fcst = (day, k, t) => k === "ss" ? SB.ensFields(day, "cal", t).mem[0] : SB.advect(SB.ensFields(day, "cal", 0).truth, SB.U * t, SB.V * t);
  function evalAt(day, k, t) { const o = SB.objects(SB.ensFields(day, "cal", t).truth), f = SB.objects(fcst(day, k, t)); return { o, f, m: SB.match(f.objs, o.objs, mS()) }; }
  function curves() { const key = mS(); if (CUR.has(key)) return CUR.get(key);
    const out = {}; ["ss", "adv"].forEach(k => { out[k] = []; for (let L = 1; L <= 12; L++) { let H = 0, Mi = 0, Fa = 0; for (let d = 0; d < 4; d++) { const e = evalAt(d, k, L * 10); H += e.m.hits.length; Mi += e.m.miss.length; Fa += e.m.fa.length; } out[k].push([L * 10, SB.scores(H, Mi, Fa)]); } });
    CUR.set(key, out); return out; }
  let hov = null;
  function render() {
    const L = lS(), t = L * 10, E = evalAt(0, fcK, t), ob = SB.ensFields(0, "cal", t).truth, fc = fcst(0, fcK, t);
    const g0 = SB.rgbOf("--well"), g1 = SB.rgbOf("--muted"), base = new Uint8Array(N * M), cols = [];
    for (let q = 0; q < 8; q++) cols.push(g0.map((v, c) => Math.round(v + (g1[c] - v) * q / 10)));
    for (let k = 0; k < base.length; k++) base[k] = Math.min(7, Math.floor(Math.max(ob[k], 0) / 8));
    const hitF = new Map(E.m.hits.map(h => [h.f, h])), hitO = new Map(E.m.hits.map(h => [h.o, h])), C = { ok: css("--ok"), sw: css("--sw"), lw: css("--lw"), fg: css("--fg"), ac: css("--accent") };
    const outline = (g, s, o, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath();
      o.px.forEach(k => { const i = k % N, j = (k / N) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (o.set.has((j + b) * N + i + a) && i + a >= 0 && i + a < N) return;
        if (a === 1) { g.moveTo((i + 1) * s, j * s); g.lineTo((i + 1) * s, (j + 1) * s); } if (a === -1) { g.moveTo(i * s, j * s); g.lineTo(i * s, (j + 1) * s); }
        if (b === 1) { g.moveTo(i * s, (j + 1) * s); g.lineTo((i + 1) * s, (j + 1) * s); } if (b === -1) { g.moveTo(i * s, j * s); g.lineTo((i + 1) * s, j * s); } }); });
      g.stroke(); g.setLineDash([]); };
    SB.view($("#sbObMap"), SB.paintCat(base, N, M, cols), N, M, { S: 6, overlay: (g, s) => {
      E.f.objs.forEach((o, i) => { g.fillStyle = hitF.has(i) ? C.ok : C.lw; g.globalAlpha = .45; o.px.forEach(k => g.fillRect((k % N) * s, ((k / N) | 0) * s, s, s)); g.globalAlpha = 1; outline(g, s, o, hitF.has(i) ? C.ok : C.lw, 2); });
      E.o.objs.forEach((o, j) => outline(g, s, o, hitO.has(j) ? C.fg : C.sw, hitO.has(j) ? 2 : 3.2, [5, 3]));
      g.strokeStyle = C.fg; g.lineWidth = 2; E.m.hits.forEach(h => { const a = E.f.objs[h.f], b = E.o.objs[h.o]; g.beginPath(); g.moveTo(a.cx / KM * s, a.cy / KM * s); g.lineTo(b.cx / KM * s, b.cy / KM * s); g.stroke();
        [a, b].forEach(o => { g.beginPath(); g.arc(o.cx / KM * s, o.cy / KM * s, 3.5, 0, 7); g.fillStyle = C.fg; g.fill(); }); });
      if (hov) { g.strokeStyle = C.ac; g.lineWidth = 3; outline(g, s, hov, C.ac, 3.5); }
    }, onHover: (i, j, e) => { const tip = $("#sbObTip");
      if (i < 0) { tip.style.display = "none"; if (hov) { hov = null; render(); } return; }
      const k = j * N + i, fi = E.f.lab[k], oi = E.o.lab[k], o = fi >= 0 ? E.f.objs[fi] : oi >= 0 ? E.o.objs[oi] : null;
      if (!o) { tip.style.display = "none"; if (hov) { hov = null; render(); } return; }
      const isF = fi >= 0, h = isF ? hitF.get(fi) : hitO.get(oi);
      tip.textContent = `${isF ? "forecast" : "observed"} object · ${fmtN(o.area)} km²\n` + (h ? `hit: centroids ${fmt(h.dc, 0)} km apart,\n     closest edges ${fmt(h.de, 0)} km` : isF ? "false alarm: no observed\nobject within the rule" : "miss: no forecast object\nwithin the rule");
      const r = $("#sbObMap").getBoundingClientRect(); tip.style.display = "block"; tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 200) + "px"; tip.style.top = (e.clientY - r.top + 10) + "px";
      if (hov !== o) { hov = o; render(); } } });
    const k = (st, t2) => `<span style="display:inline-block;width:18px;height:10px;margin:0 4px -1px 10px;${st}"></span>${t2}`;
    $("#sbObKey").innerHTML = `<span class="note" style="margin:0">${k(`background:color-mix(in srgb,var(--ok) 45%,transparent);border:2px solid var(--ok)`, "forecast, hit")}${k(`background:color-mix(in srgb,var(--lw) 45%,transparent);border:2px solid var(--lw)`, "false alarm")}${k("border:2px dashed var(--fg)", "observed, matched")}${k("border:3px dashed var(--sw)", "miss")} · grey: observed dBZ</span>`;
    const Hh = E.m.hits.length, Mm = E.m.miss.length, Ff = E.m.fa.length, Sx = SB.scores(Hh, Mm, Ff), f2 = v => isNaN(v) ? "–" : fmt(v, 2);
    $("#sbObRead").innerHTML = `<div><span>Hits</span><b class="c-ok">${Hh}</b></div><div><span>Misses</span><b class="c-sw">${Mm}</b></div><div><span>False al.</span><b class="c-lw">${Ff}</b></div><div><span>POD</span><b>${f2(Sx.pod)}</b></div><div><span>SR</span><b>${f2(Sx.sr)}</b></div><div><span>CSI</span><b>${f2(Sx.csi)}</b></div><div><span>FB</span><b>${f2(Sx.fb)}</b></div>`;
    const Cv = curves(), yr = sc === "fb" ? [0, 2] : [0, 1];
    VIZ.curves($("#sbObCurve"), [{ pts: Cv.ss.map(([x, s]) => [x, s[sc]]).filter(p => !isNaN(p[1])), col: "--accent", label: "generative member (toy)", w: 2.4 }, { pts: Cv.adv.map(([x, s]) => [x, s[sc]]).filter(p => !isNaN(p[1])), col: "--data", label: "advection only (toy)", w: 2.4, dash: "6 4" }].concat(sc === "fb" ? [{ pts: [[10, 1], [120, 1]], col: "--muted", dash: "2 3", label: "ideal FB = 1" }] : []),
      { xr: [10, 120], yr, xl: "lead (min)", yl: sc.toUpperCase() + " · 4 toy days", W: 420, H: 178, xt: [10, 60, 120], yt: sc === "fb" ? [0, 1, 2] : [0, .5, 1], xf: v => fmtN(v), yf: v => fmt(v, 1), marks: [[t, "", "--muted"]], legendAt: sc === "fb" ? "tr" : "tr" });
  }
  render(); return render;
});

/* ───────── 9 · results as reported ───────── */
demo("sb-results", () => {
  const CAT = { b: ["StormScope better", "--accent", .85], s: ["difference significant (95 %)", "--accent", .45], c: ["competitive / comparable", "--accent", .2], l: ["comparable, low skill for all", "--muted", .3],
    x: ["over-confident", "--lw", .5], m: ["mixed", "--sw", .5], i: ["reported, no baseline", "--muted", .14], n: ["not significant", "--sw", .55], "": ["not stated", "--well", 1] };
  const HR = Array.from({ length: 12 }, (_, k) => k + 1), MN = Array.from({ length: 12 }, (_, k) => 10 * (k + 1));
  const SETS = {
    near: { cols: HR, unit: "h", rows: [
      { k: "Radar FSS · 20 dBZ · 18 km", who: "1 member vs HRRR", f: h => h <= 3 ? "b" : h <= 6 ? "c" : "", fig: "Fig. 6b · §2.2.1",
        t: "\"For lead times up to 3 hr, Stormscope deterministic scores surpass the HRRR baseline\" (both 20 dBZ / 18 km and 30 dBZ / 42 km); \"clearly outperforms the HRRR model in the first 3 hrs and maintains competitive skill for the first 5 hrs\". §1 adds: \"statistically significant improvement up to 4 hours and comparable forecasts for 6 hours\". Single member, no ensemble averaging.", go: "sb-fss" },
      { k: "Radar FSS · 30 dBZ · 42 km", who: "1 member vs HRRR", f: h => h <= 3 ? "b" : h <= 6 ? "c" : "", fig: "Fig. 6c · §2.2.1", t: "Same statements as for 20 dBZ: better than HRRR up to 3 h, competitive to about 5 h (§2.2.1), comparable at 6 h (§1). Moderate precipitation threshold, larger 42 km window.", go: "sb-fss" },
      { k: "Paired FSS difference · 20 dBZ", who: "paired t-test, 1–6 h", f: h => h <= 6 ? "s" : "", fig: "Fig. 12 · §6.1", t: "Differences between paired forecasts (StormScope − HRRR) with bootstrapped 95 % confidence intervals: \"statistically significant at a confidence threshold of 0.05 at all lead times\" (1–6 h shown). Significance says the difference is real, not which way it points at each lead; read the sign in Fig. 12." },
      { k: "Paired FSS difference · 30 dBZ", who: "paired t-test, 1–6 h", f: h => h === 4 ? "n" : h <= 6 ? "s" : "", fig: "Fig. 13 · §6.1", t: "For 30 dBZ / 42 km: significant \"at all lead times except 4 hours\"." },
      { k: "Radar CRPS (dBZ)", who: "5 members vs lagged HRRR", f: h => "b", fig: "Fig. 6a · §2.2.1, §3", t: "\"CRPS also outperforms the HRRR lagged ensemble\"; §3: \"systematically outperforms a 5-member lagged-ensemble HRRR baseline\". The lagged ensemble (drawn below) is the HRRR run from t₀ plus the runs from t₀ − 1 h … t₀ − 4 h, valid at the same time. The authors call it a weak probabilistic baseline (§3).", lag: true },
      { k: "IR FSS · 235 K and 225 K · 6 km", who: "1 member vs HRRR Tb", f: h => h <= 3 ? "b" : "", fig: "Fig. 7 · §2.2.1", t: "Clean IR window (10.35 µm): \"over the first 3 hrs the results indicate superior Fractions Skill Score\" for 235 K and 225 K, against HRRR simulated brightness temperature (a 10.7 µm operator, a close but not exact match)." },
      { k: "Reliability · 20 and 30 dBZ", who: "24 members, 1/3/6 h", f: h => [1, 3, 6].includes(h) ? "x" : "", fig: "Fig. 8 · §2.2.1", t: "Curves fall below the diagonal: the model \"tends to systematically overestimate the probability\" of exceeding 20 and 30 dBZ (over-confident), but \"does not deviate dramatically from the 1-to-1 line\" at 1–3 h; \"further tuning of the diffusion model sampler may be necessary\" at longer leads.", go: "sb-ens" },
      { k: "With vs without GFS sim. reflectivity", who: "ablation, radar nearcast", f: h => "b", fig: "Fig. 17 · §6.4", t: "Adding GFS simulated composite reflectivity as conditioning improves FSS (20 dBZ, 18 km, 360 initialisations) \"across all lead times, with the gap being larger at longer lead times\". A comparison of two StormScope variants, not against HRRR." },
      { k: "CRPS of rain rate (mm/h)", who: "24 members", f: h => "i", fig: "Fig. 16 · §6.3", t: "Mean CRPS of the 24-member ensemble over 12 h, after converting dBZ to rain rate with Marshall–Palmer Z = 300 R<sup>1.4</sup>. No baseline on this figure.", zr: true }] },
    now: { cols: MN, unit: "min", rows: [
      { k: "FSS · 40 dBZ · 6 km window", who: "1 member vs pySTEPS, HRRR", f: m => "l", fig: "Fig. 9a · §2.2.2", t: "\"At 6 km spatial scale, the models have comparable, but low skill for forecasting storms of intensity over 40 dBZ.\" 250 initialisations in winter and spring 2024 chosen for strong precipitation.", go: "sb-fss" },
      { k: "FSS · 40 dBZ · 18 km window", who: "1 member vs pySTEPS, HRRR", f: m => m <= 20 ? "c" : "b", fig: "Fig. 9b · §2.2.2", t: "As the window grows \"Stormscope appears to be notably better than pySTEPS after 20-minute lead times\"; it \"detectably exceeds that of pySTEPS and HRRR, especially at the largest pooling sizes\".", go: "sb-fss" },
      { k: "FSS · 40 dBZ · 30 km window", who: "1 member vs pySTEPS, HRRR", f: m => m <= 20 ? "c" : "b", fig: "Fig. 9c · §2.2.2", t: "Same statement; the 30 km window has the highest FSS, \"corresponding to most actionable information content\".", go: "sb-fss" },
      { k: "Objects · POD", who: "1 member vs pySTEPS", f: m => "b", fig: "Fig. 10 · §2.2.2", t: "Probability of detection is \"systematically increased\" relative to pySTEPS. Objects ≥ 40 dBZ, > 108 km², 40 km matching rule (WoFSCast).", go: "sb-objects" },
      { k: "Objects · CSI", who: "1 member vs pySTEPS", f: m => "b", fig: "Fig. 10 · §2.2.2", t: "Critical success index \"systematically increased\".", go: "sb-objects" },
      { k: "Objects · frequency bias", who: "1 member vs pySTEPS", f: m => "b", fig: "Fig. 10 · §2.2.2", t: "\"The Frequency Bias (FB) is notably closer to 1\": about as many storms forecast as observed.", go: "sb-objects" },
      { k: "Objects · success ratio", who: "1 member vs pySTEPS", f: m => "m", fig: "Fig. 10 · §2.2.2", t: "\"Even if the success ratio is not uniformly improved\": per forecast object, not always fewer false alarms.", go: "sb-objects" }] } };
  let set = "near", row = 0;
  chips($("#sbRsSet"), v => { set = v; row = 0; render(); });
  function render() {
    const S = SETS[set], W = 620, rh = 30, lw = 236, top = 30, H = top + S.rows.length * rh + 6, cw = (W - lw - 4) / 12, svg = svgIn($("#sbRsCard2"), W, H);
    S.cols.forEach((c, k) => SB.txt(svg, lw + k * cw + cw / 2, 20, c + (k === 0 ? " " + S.unit : ""), { "font-size": 11, "text-anchor": "middle", class: "mono", fill: css("--muted") }));
    S.rows.forEach((R, r) => { const y = top + r * rh, on = r === row, g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
      el("rect", { x: 0, y: y - 1, width: W, height: rh - 2, rx: 6, fill: on ? css("--accent") : "transparent", "fill-opacity": on ? .08 : 0, stroke: on ? css("--accent") : "none" }, g);
      SB.txt(g, 6, y + 12, R.k, { "font-size": 12, "font-weight": 600 }); SB.txt(g, 6, y + 25, R.who, { "font-size": 10.5, fill: css("--muted") });
      S.cols.forEach((c, k) => { const v = R.f(c), [lab, col, op] = CAT[v]; el("rect", { x: lw + k * cw + 1.5, y: y + 2, width: cw - 3, height: rh - 8, rx: 4, fill: css(col), opacity: op, stroke: v === "" ? css("--line") : "none" }, g);
        if (v === "s") SB.txt(g, lw + k * cw + cw / 2, y + 19, "✓", { "font-size": 12, "text-anchor": "middle", fill: css("--fg") });
        if (v === "n") SB.txt(g, lw + k * cw + cw / 2, y + 19, "×", { "font-size": 13, "text-anchor": "middle", fill: css("--fg") }); });
      g.addEventListener("click", () => { row = r; render(); }); g.addEventListener("keydown", e => { if (e.key === "Enter") { row = r; render(); } }); });
    const used = new Set(); S.rows.forEach(R => S.cols.forEach(c => used.add(R.f(c))));
    $("#sbRsKey").innerHTML = `<div class="note" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin:2px 0 0">${Object.entries(CAT).filter(([k]) => used.has(k)).map(([k, [lab, col, op]]) => `<span><span style="display:inline-block;width:14px;height:11px;border-radius:3px;margin-right:4px;vertical-align:-1px;background:color-mix(in srgb,var(${col}) ${Math.round(op * 100)}%,transparent);${k === "" ? "border:1px solid var(--line)" : ""}"></span>${lab}</span>`).join("")}</div>`;
    const R = S.rows[row];
    $("#sbRsCard").innerHTML = `<h4 style="color:var(--accent)">${R.k}</h4><p class="note" style="margin:0 0 6px">${R.who} · ${R.fig}</p><p>${R.t}</p><div id="sbRsX"></div>${R.go ? `<div class="chips" style="margin:6px 0 0"><button class="chip" type="button" data-go="${R.go}">Try it on the toy →</button></div>` : ""}`;
    if (R.lag) {
      const s2 = svgIn($("#sbRsX"), 340, 128), X = lin(-4, 6, 20, 330); arrowDefs(s2, "sbRsAr", css("--sw"));
      [-4, -2, 0, 2, 4, 6].forEach(v => SB.txt(s2, X(v), 124, (v === 0 ? "t₀" : (v > 0 ? "+" : "") + v + " h"), { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted"), class: "mono" }));
      el("line", { x1: X(3), x2: X(3), y1: 4, y2: 112, stroke: css("--fg"), "stroke-dasharray": "4 3" }, s2); SB.txt(s2, X(3) + 4, 12, "valid time", { "font-size": 10.5, fill: css("--fg") });
      for (let k = 0; k < 5; k++) { const y = 20 + k * 15; el("line", { x1: X(-k), x2: X(3), y1: y, y2: y, stroke: css("--sw"), "stroke-width": 2.4, "marker-end": "url(#sbRsAr)" }, s2); el("circle", { cx: X(-k), cy: y, r: 3.5, fill: css("--sw") }, s2);
        SB.txt(s2, X(-k) - 6, y + 4, k ? `HRRR t₀−${k}h` : "HRRR t₀", { "font-size": 10, "text-anchor": "end", fill: css("--sw") }); }
      el("rect", { x: X(0), y: 94, width: X(3) - X(0), height: 10, rx: 3, fill: css("--accent"), opacity: .8 }, s2); SB.txt(s2, X(0) - 6, 103, "StormScope × 5", { "font-size": 10, "text-anchor": "end", fill: css("--accent") });
    }
    if (R.zr) {
      $("#sbRsX").innerHTML = `<div class="ctl" style="margin:4px 0"><label for="sbRsZ">Reflectivity</label><input type="range" id="sbRsZ" min="10" max="60" step="1" value="40"><output></output></div><div class="calc" id="sbRsZo" style="margin-top:2px"></div>`;
      const zs = slider("sbRsZ", v => v + " dBZ", () => upd()), upd = () => { const d = zs(), Z = 10 ** (d / 10), Rr = (Z / 300) ** (1 / 1.4); $("#sbRsZo").innerHTML = `Z = 10^(${d}/10) = ${fmtN(Z)} mm⁶/m³\nR = (Z / 300)^(1/1.4) = <span class="k">${fmt(Rr, Rr < 10 ? 2 : 1)} mm/h</span>`; }; upd();
    }
  }
  render(); return render;
});

/* ───────── 10 · cost and scaling ───────── */
demo("sb-cost", () => {
  let mode = "now", mods = 1, step = 0;
  chips($("#sbCoMode"), v => { mode = v; render(); }); chips($("#sbCoMod"), v => { mods = +v; render(); }); chips($("#sbCoStep"), v => { step = +v; render(); });
  const nS = slider("sbCoN", v => v, render), sS = slider("sbCoS", v => v, render), gS = slider("sbCoG", v => v, render);
  const TXT = ["<b>① Too big for one GPU.</b> The 3 km satellite nowcast covers 1792 × 1024 ≈ 1.8 M pixels. Training memory exceeds a ~80 GB GPU even at batch size 1, and the memory is mostly <b>activations</b> (one set per token), so sharding parameters (FSDP) alone does not help.",
    "<b>② Split the domain.</b> PhysicsNeMo's ShardTensor cuts the grid into an upper and a lower half; each half goes to one GPU of a <b>domain-parallel</b> pair, which together hold one copy of the model.",
    "<b>③ Most work is local.</b> Patch embedding, LayerNorm, the MLPs and the output head act on each token alone: each GPU runs them on its own half with no communication.",
    "<b>④ Halo exchange for attention.</b> Neighborhood attention near the cut needs tokens from the other half. Only a thin <b>halo</b> (its width set by the NA kernel) is exchanged in each forward and backward pass, not the whole sequence. The loss is summed across the pair.",
    "<b>⑤ A 2 × 4 device mesh.</b> 8 GPUs: 4 data-parallel groups (different samples) × 2 domain shards. Gradients are averaged across the groups as in ordinary data parallelism. Throughput: ~87.5 % of a data-parallel-only run on the same number of GPUs."];
  function render() {
    const N = nS(), Sst = sS(), G = gS(), per = 33 * Sst / 100 * mods, steps = 12, member = steps * per, gpuS = N * member, wall = Math.ceil(N / G) * member, cyc = mode === "now" ? 600 : 3600;
    const t = s => s < 90 ? fmt(s, 0) + " s" : s < 5400 ? fmt(s / 60, 1) + " min" : fmt(s / 3600, 1) + " h";
    $("#sbCoRead").innerHTML = `<div><span>Per member</span><b>${t(member)}</b></div><div><span>GPU time</span><b>${t(gpuS)}</b></div><div><span>Wall clock</span><b class="${wall <= cyc ? "c-ok" : "c-lw"}">${t(wall)}</b></div><div><span>Network passes</span><b>${fmtN(N * steps * Sst * mods)}</b></div>`;
    const W = 460, H = 92, svg = svgIn($("#sbCoBar"), W, H), mx = Math.max(wall, cyc) * 1.08, X = lin(0, mx, 10, W - 10);
    el("rect", { x: 10, y: 22, width: X(wall) - 10, height: 24, rx: 5, fill: css(wall <= cyc ? "--ok" : "--lw"), opacity: .8 }, svg);
    SB.txt(svg, 10, 14, `wall clock: ${N} member${N > 1 ? "s" : ""} on ${G} GPU${G > 1 ? "s" : ""} (${Math.ceil(N / G)} after another per GPU)`, { "font-size": 11.5, fill: css("--muted") });
    el("line", { x1: X(cyc), x2: X(cyc), y1: 16, y2: 54, stroke: css("--fg"), "stroke-width": 2, "stroke-dasharray": "5 3" }, svg);
    SB.txt(svg, X(cyc), 68, mode === "now" ? "next images in 10 min" : "next hourly cycle", { "font-size": 11, "text-anchor": X(cyc) > W - 70 ? "end" : "middle", fill: css("--fg") });
    SB.txt(svg, 10, 86, `12 steps × ${fmt(per, 1)} s (33 s × ${Sst}/100${mods > 1 ? " × 2 models" : ""})`, { "font-size": 11, fill: css("--muted"), class: "mono" });
    // domain-parallel figure
    const F = svgIn($("#sbCoFig"), 470, 236); arrowDefs(F, "sbCoAr", css("--accent"));
    const dx = 12, dy = 26, dw = 300, dh = 171, half = dh / 2, A = css("--cool"), B = css("--data");
    if (step === 0) { el("rect", { x: dx, y: dy, width: dw, height: dh, rx: 6, fill: css("--cool"), "fill-opacity": .15, stroke: css("--cool"), "stroke-width": 2 }, F);
      SB.txt(F, dx + dw / 2, dy + dh / 2 - 6, "1792 × 1024 pixels at 3 km", { "font-size": 13, "font-weight": 600, "text-anchor": "middle" }); SB.txt(F, dx + dw / 2, dy + dh / 2 + 14, "≈ 1.8 M pixels (6 km model: 0.46 M)", { "font-size": 11.5, "text-anchor": "middle", fill: css("--muted") });
      el("rect", { x: 340, y: 40, width: 40, height: 150, rx: 5, fill: "none", stroke: css("--line"), "stroke-width": 1.5 }, F); el("rect", { x: 340, y: 40, width: 40, height: 150, rx: 5, fill: css("--lw"), opacity: .7 }, F);
      el("rect", { x: 340, y: 14, width: 40, height: 26, rx: 5, fill: css("--lw"), opacity: .35, "stroke-dasharray": "3 3", stroke: css("--lw") }, F);
      SB.txt(F, 390, 60, "one GPU", { "font-size": 11.5, "font-weight": 600 }); SB.txt(F, 390, 76, "~80 GB", { "font-size": 11.5, fill: css("--muted") }); SB.txt(F, 390, 26, "overflow", { "font-size": 11.5, fill: css("--lw"), "font-weight": 600 });
      SB.txt(F, 390, 150, "6 km model:", { "font-size": 11, fill: css("--muted") }); SB.txt(F, 390, 165, "~70 GB train,", { "font-size": 11, fill: css("--muted") }); SB.txt(F, 390, 180, "~5 GB infer", { "font-size": 11, fill: css("--muted") });
    } else if (step < 4) {
      el("rect", { x: dx, y: dy, width: dw, height: half - 3, rx: 6, fill: A, "fill-opacity": .16, stroke: A, "stroke-width": 2 }, F);
      el("rect", { x: dx, y: dy + half + 3, width: dw, height: half - 3, rx: 6, fill: B, "fill-opacity": .16, stroke: B, "stroke-width": 2 }, F);
      SB.txt(F, dx + 10, dy + 20, "GPU 0 · upper half", { "font-size": 12.5, "font-weight": 600, fill: A }); SB.txt(F, dx + 10, dy + half + 22, "GPU 1 · lower half", { "font-size": 12.5, "font-weight": 600, fill: B });
      if (step === 2) [[dy + 30, A], [dy + half + 34, B]].forEach(([y, c]) => { SB.txt(F, dx + dw / 2, y + 14, "patch embed · LayerNorm · MLP · head", { "font-size": 11.5, "text-anchor": "middle", fill: c }); SB.txt(F, dx + dw / 2, y + 30, "no communication needed", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") }); });
      if (step === 3) { const hw = 16;
        el("rect", { x: dx, y: dy + half - 3 - hw, width: dw, height: hw, fill: A, opacity: .45 }, F); el("rect", { x: dx, y: dy + half + 3, width: dw, height: hw, fill: B, opacity: .45 }, F);
        for (let k = 0; k < 4; k++) { const x = dx + 40 + k * 70; el("line", { x1: x, x2: x, y1: dy + half - 14, y2: dy + half + 14, stroke: css("--accent"), "stroke-width": 2, "marker-end": "url(#sbCoAr)" }, F); el("line", { x1: x + 12, x2: x + 12, y1: dy + half + 14, y2: dy + half - 14, stroke: css("--accent"), "stroke-width": 2, "marker-end": "url(#sbCoAr)" }, F); }
        el("rect", { x: dx + 200, y: dy + half - 30, width: 48, height: 48, fill: "none", stroke: css("--mag"), "stroke-width": 2.2, "stroke-dasharray": "4 3" }, F);
        SB.txt(F, dx + 224, dy + half + 34, "NA window", { "font-size": 10.5, "text-anchor": "middle", fill: css("--mag") });
        SB.txt(F, 330, dy + half - 8, "halo: copied", { "font-size": 11.5, fill: css("--accent"), "font-weight": 600 }); SB.txt(F, 330, dy + half + 8, "across the cut", { "font-size": 11.5, fill: css("--accent"), "font-weight": 600 });
        SB.txt(F, 330, dy + half + 26, "width ≈ NA kernel", { "font-size": 11, fill: css("--muted") }); }
      if (step === 1) { el("line", { x1: dx - 6, x2: dx + dw + 6, y1: dy + half, y2: dy + half, stroke: css("--fg"), "stroke-width": 2, "stroke-dasharray": "7 4" }, F); SB.txt(F, 330, dy + half + 4, "cut", { "font-size": 12, "font-weight": 600 }); }
    } else {
      SB.txt(F, 10, 18, "domain-parallel pairs (columns) × data-parallel groups", { "font-size": 11.5, fill: css("--muted") });
      for (let gq = 0; gq < 4; gq++) for (let s = 0; s < 2; s++) { const x = 14 + gq * 112, y = 36 + s * 70;
        el("rect", { x, y, width: 96, height: 58, rx: 8, fill: s ? B : A, "fill-opacity": .18, stroke: s ? B : A, "stroke-width": 1.8 }, F);
        SB.txt(F, x + 48, y + 24, `GPU ${2 * gq + s}`, { "font-size": 12.5, "font-weight": 600, "text-anchor": "middle" }); SB.txt(F, x + 48, y + 42, s ? "lower half" : "upper half", { "font-size": 11, "text-anchor": "middle", fill: css("--muted") }); }
      for (let gq = 0; gq < 4; gq++) el("line", { x1: 62 + gq * 112, x2: 62 + gq * 112, y1: 94, y2: 106, stroke: css("--accent"), "stroke-width": 3 }, F);
      el("line", { x1: 14, x2: 458, y1: 186, y2: 186, stroke: css("--arch"), "stroke-width": 2.4, "stroke-dasharray": "6 4" }, F);
      SB.txt(F, 236, 204, "gradients averaged across the 4 groups after each backward pass", { "font-size": 11.5, "text-anchor": "middle", fill: css("--arch") });
      SB.txt(F, 236, 226, "scaling efficiency ≈ 87.5 % (vs data-parallel only)", { "font-size": 12.5, "text-anchor": "middle", "font-weight": 700, fill: css("--ok") });
    }
    $("#sbCoTxt").innerHTML = TXT[step];
  }
  render(); return render;
});

/* ───────── 11 · limitations and Colombia ───────── */
demo("sb-colombia", () => {
  const LIM = [["Sparse synoptic conditioning", "One GFS channel only; denser conditioning \"could uncover additional skill\" (the GFS-reflectivity ablation already helps, §6.4)."],
    ["Parallax", "A tall cloud seen at a slant appears displaced from the rain below it; effects \"at steep viewing angles\" are left for future work."],
    ["No radar-only state-of-the-art claim", "Not compared with NowcastNet (Zhang et al.) or DGMR (Ravuri et al.): \"we do not claim our proposed method is state-of-the-art on the 0–2 hour timescale for radar-only nowcasting\"."],
    ["6 km vs radar's 1–2 km", "pySTEPS can run at the radar's native 1–2 km; a higher-resolution comparison \"would provide a more rigorous baseline\"."],
    ["Weak probabilistic baseline", "A 5-member lagged HRRR ensemble; future work should score against full physics ensembles such as Warn-on-Forecast."]];
  $("#sbCoLim").innerHTML = LIM.map(([a, b]) => `<div class="card" style="padding:7px 12px"><b style="font-size:14px">${a}</b><p style="font-size:13px;margin:2px 0 0;color:var(--muted)">${b}</p></div>`).join("");
  const CHK = [["paper", "Satellite backbone: GOES-East images cover Colombia; the satellite model needs no radar (§4.2.1)."],
    ["paper", "Synoptic conditioning from GFS, or from an AI global model (§4.2.1)."],
    ["ours", "A new grid over Colombia, and years of GOES archive on it for training (CONUS used 2018–2023)."],
    ["ours", "Radar where it exists (IDEAM and others) for a radar model or for verification; elsewhere satellite rain estimates."],
    ["ours", "Fine-tune or retrain with PhysicsNeMo (32 H100 × ~48 h for CONUS, §4.2.2); run with Earth2Studio."],
    ["ours", "Check the tropics: weak synoptic forcing, a strong diurnal cycle, the Andes. Verify with FSS and objects."]];
  $("#sbCoChk").innerHTML = CHK.map(([w, t]) => `<div style="font-size:13px;display:flex;gap:8px;align-items:baseline"><span class="tag ${w === "paper" ? "t-ok" : "t-sw"}" style="flex:none">${w}</span><span>${t}</span></div>`).join("");
  const CITY = [["Bogotá", 4.71, -74.07, 1], ["Barranquilla", 10.96, -74.8, 1], ["Leticia", -4.21, -69.94, 1], ["Miami", 25.76, -80.19, 0], ["Kansas City", 39.1, -94.58, 0], ["Seattle", 47.61, -122.33, 0]];
  let sel = 0; $("#sbPxCity").innerHTML = CITY.map((c, k) => `<button class="chip" type="button" data-v="${k}" aria-pressed="${k === 0}">${c[0]}</button>`).join("");
  chips($("#sbPxCity"), v => { sel = +v; render(); });
  const hS = slider("sbPxH", v => v + " km", render), D = Math.PI / 180;
  const vza = (lat, lon) => { const g = Math.acos(Math.cos(lat * D) * Math.cos((lon + 75.2) * D)), Rs = 42164, Re = 6371, d = Math.sqrt(Rs * Rs + Re * Re - 2 * Rs * Re * Math.cos(g)); return Math.asin(Rs / d * Math.sin(g)); };
  function render() {
    const h = hS(), W = 470, rowH = 22, H = CITY.length * rowH + 30, svg = svgIn($("#sbPxFig"), W, H), lw = 96, mx = 40, X = lin(0, mx, lw, W - 110);
    for (let p = 0; p <= mx; p += 6) { el("line", { x1: X(p), x2: X(p), y1: 2, y2: H - 22, stroke: css("--line"), "stroke-dasharray": p ? "2 3" : "" }, svg); SB.txt(svg, X(p), H - 8, p, { "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }); }
    SB.txt(svg, W - 4, H - 8, "km (grid: 6 km pixels)", { "font-size": 10.5, "text-anchor": "end", fill: css("--muted") });
    CITY.forEach(([n, la, lo, co], k) => { const th = vza(la, lo), s = h * Math.tan(th), y = 4 + k * rowH, on = k === sel, col = co ? "--ok" : "--sw";
      SB.txt(svg, lw - 6, y + 13, n, { "font-size": 12, "text-anchor": "end", "font-weight": on ? 700 : 400, fill: css(on ? "--fg" : "--muted") });
      el("rect", { x: lw, y: y + 3, width: Math.max(1, X(Math.min(s, mx)) - lw), height: rowH - 8, rx: 3, fill: css(col), opacity: on ? .95 : .45 }, svg);
      SB.txt(svg, X(Math.min(s, mx)) + 5, y + 13, `${fmt(s, 1)} km · view ${fmt(th / D, 0)}°`, { "font-size": 11, fill: css(on ? "--fg" : "--muted"), class: "mono" }); });
  }
  render(); return render;
});

/* ───────── 12 · recap and quiz ───────── */
demo("sb-quiz", () => {
  const BX = [["Inputs", "59 × 512 × 896", "channels · sat. nowcast", "sb-tokens", "--cool"], ["Tokens", "28,672 × 768", "4 × 4 patches · 24 km", "sb-tokens", "--accent"], ["16 DiT blocks", "NA 31 × 31", "adaLN(σ) · 195 M param.", "sb-na", "--accent"],
    ["EDM diffusion", "100 steps", "coarse → fine expert", "sb-sample", "--arch"], ["Rollout", "12 × 33 s", "10-min or 1-h steps", "sb-cost", "--muted"], ["Ensemble", "24 members", "P(≥ 30 dBZ) · reliability", "sb-ens", "--mag"], ["Verification", "FSS · objects", "vs HRRR, pySTEPS", "sb-results", "--fg"]];
  function render() {
    const W = 1000, H = 92, svg = svgIn($("#sbQzFig"), W, H), bw = 128, gap = (W - 4 - 7 * bw) / 6; arrowDefs(svg, "sbQzAr", css("--muted"));
    BX.forEach(([a, b, c, go, col], k) => { const x = 2 + k * (bw + gap), g = el("g", { style: "cursor:pointer", "data-go": go, tabindex: 0, role: "button" }, svg);
      el("rect", { x, y: 6, width: bw, height: 80, rx: 12, fill: css("--card"), stroke: css(col === "--fg" ? "--line" : col), "stroke-width": 1.8 }, g);
      SB.txt(g, x + bw / 2, 28, a, { "font-size": 13, "font-weight": 600, "text-anchor": "middle", fill: css(col) }); SB.txt(g, x + bw / 2, 50, b, { "font-size": 12, "text-anchor": "middle", class: "mono", "font-weight": 600 }); SB.txt(g, x + bw / 2, 69, c, { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted") });
      if (k < 6) el("line", { x1: x + bw + 2, x2: x + bw + gap - 3, y1: 46, y2: 46, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#sbQzAr)" }, svg); });
  }
  const Q = [
    { q: "A 512 × 896 grid is cut into 4 × 4 patches. How many tokens?", opts: ["7,168", "28,672", "458,752"], right: 1, why: "512/4 × 896/4 = 128 × 224 = 28,672. With 2 × 2 patches: 4× more tokens, 16× more global attention pairs." },
    { q: "Why neighborhood attention instead of global attention?", opts: ["It is more accurate", "N·961 scores instead of N²", "Images forbid global attention"], right: 1, why: "N = 28,672: global attention needs ~8·10⁸ scores per layer and head, a 31 × 31 window ~30× fewer. Stacked layers still link far-away tokens." },
    { q: "At very high noise σ, the best denoiser output is…", opts: ["the true future", "the mean of all plausible futures", "zero"], right: 1, why: "When the noisy frame says almost nothing, the squared-error optimum is the conditional mean: blurry. Sampling walks from that mean to one sharp member." },
    { q: "Reliability curves below the diagonal (Fig. 8) mean…", opts: ["probabilities too high", "probabilities too low", "perfect calibration"], right: 0, why: "Where the forecast said 60 %, the event happened less often: over-confident. The paper finds this at 20 and 30 dBZ, modest at 1–3 h." },
    { q: "Why does FSS grow with the window size?", opts: ["bigger windows inflate every score", "a near miss is no longer penalised twice", "the threshold changes"], right: 1, why: "At pixel scale a storm displaced by 18 km counts as a miss and a false alarm. Fractions in larger windows reward being close." },
    { q: "24 members × 2-h satellite nowcast, 100 sampling steps, one H100:", opts: ["≈ 7 minutes", "≈ 2.6 hours", "≈ 33 seconds"], right: 1, why: "24 × 12 steps × 33 s = 9,504 s ≈ 2.6 h on one GPU; on 24 GPUs, ~7 min (§4.2.2)." }];
  $("#sbQz").innerHTML = Q.map((_, k) => `<div id="sbQz${k}"></div>`).join("");
  Q.forEach((q, k) => VIZ.quiz($("#sbQz" + k), [q]));
  render(); return render;
});
