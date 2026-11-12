/* ═════════ Earth-2 · 5b StormScope · part C · the whole network, end to end ═════════
   1 sc-arch      one denoiser call with the tensor shape at every stage (four models)
   2 sc-params    where the parameters, the operations and the memory go (our estimate, standard DiT sizes)
   3 sc-iter      one training iteration step by step (toy fields), the learning-rate schedule
   4 sc-forecast  one forecast as nested loops: lead steps × σ steps × models (animated)
   5 sc-domain    limited area: an open-boundary toy (storms entering from outside)
   6 sc-region    options for another region, a Colombian box calculator
   Numbers: Pathak et al. 2026, arXiv:2601.17268, or labelled "our estimate" / "toy". */

const SC = (() => {
  const NX = 112, NY = 64;
  const LUT = new Map();
  const lut = f => { if (!LUT.has(f)) { const L = new Uint8ClampedArray(768); for (let i = 0; i < 256; i++) L.set(CM.rgb(f, i / 255), i * 3); LUT.set(f, L); } return LUT.get(f); };
  const rgbOf = tok => { const d = document.createElement("canvas").getContext("2d"); d.fillStyle = css(tok) || "#888"; d.fillRect(0, 0, 1, 1); return [...d.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const GRAY = CM.ramp(["#05070c", "#2a2f38", "#8a8f99", "#ffffff"]);
  function paint(vals, nx = NX, ny = NY, { color = CM.vir, lo = 0, hi = 1, mask = null } = {}) {
    const c = document.createElement("canvas"); c.width = nx; c.height = ny;
    const g = c.getContext("2d"), img = g.createImageData(nx, ny), L = lut(color), w = mask ? rgbOf("--well") : null;
    for (let k = 0; k < nx * ny; k++) { const v = vals[k], o = k * 4;
      if (mask && mask(v)) { img.data[o] = w[0]; img.data[o + 1] = w[1]; img.data[o + 2] = w[2]; }
      else { const t = Math.round(clamp((v - lo) / (hi - lo || 1), 0, 1) * 255) * 3; img.data[o] = L[t]; img.data[o + 1] = L[t + 1]; img.data[o + 2] = L[t + 2]; }
      img.data[o + 3] = 255; }
    g.putImageData(img, 0, 0); return c;
  }
  const url = c => c.toDataURL();

  /* toy storm world: 64 × 112 cells; b(t) in [0, 1] = "cloudiness"; t in toy minutes; cells drift east */
  const CELLS = new Map();
  function cells(seed) {
    if (CELLS.has(seed)) return CELLS.get(seed);
    const r = rng(seed), C = [];
    for (let k = 0; k < 26; k++) C.push({ x: -30 + 150 * r(), y: 5 + 54 * r(), R: 3 + 4.6 * r(), pk: .55 + .45 * r(), b: -260 + 560 * r(), life: 150 + 230 * r(), u: .11 + .05 * (r() - .5), v: -.015 + .03 * (r() - .5) });
    CELLS.set(seed, C); return C;
  }
  function put(f, cx, cy, I, R) {
    const i0 = Math.max(0, Math.floor(cx - 3 * R)), i1 = Math.min(NX - 1, Math.ceil(cx + 3 * R)), j0 = Math.max(0, Math.floor(cy - 3 * R)), j1 = Math.min(NY - 1, Math.ceil(cy + 3 * R));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = i + .5 - cx, dy = j + .5 - cy, v = I * Math.exp(-.5 * (dx * dx + dy * dy) / (R * R)); if (v > f[j * NX + i]) f[j * NX + i] = v; }
  }
  function storm(t, seed = 1) {
    const f = new Float32Array(NX * NY);
    for (const c of cells(seed)) { const ph = (t - c.b) / c.life; if (ph <= 0 || ph >= 1) continue;
      const e = Math.pow(Math.sin(Math.PI * ph), .6), cx = c.x + c.u * t, cy = c.y + c.v * t;
      put(f, cx - .5 * c.R, cy, .38 * c.pk * e, 2.3 * c.R); put(f, cx, cy, c.pk * e, c.R * (.75 + .25 * e)); }
    return f;
  }
  const irPaint = b => paint(Float32Array.from(b, v => 292 - 88 * v), NX, NY, { color: GRAY, lo: 300, hi: 200 });
  const dbz = b => Float32Array.from(b, v => clamp(78 * (v - .18), 0, 62));
  const radPaint = b => paint(dbz(b), NX, NY, { color: CM.precip, lo: 0, hi: 60, mask: v => v < 5 });
  // separable box blur with clamped edges
  function blur(f, r, nx = NX, ny = NY) {
    if (r <= 0) return Float32Array.from(f);
    const a = new Float32Array(nx * ny), o = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let d = -r; d <= r; d++) { const q = i + d; if (q < 0 || q >= nx) continue; s += f[j * nx + q]; n++; } a[j * nx + i] = s / n; }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let d = -r; d <= r; d++) { const q = j + d; if (q < 0 || q >= ny) continue; s += a[q * nx + i]; n++; } o[j * nx + i] = s / n; }
    return o;
  }

  /* svg helpers */
  // text with subscripts written as x_{σ}
  const txt = (svg, x, y, s, o = {}) => { const t = el("text", Object.assign({ x, y, "font-size": 12, fill: css("--fg") }, o), svg), parts = String(s).split(/(_\{[^}]*\})/);
    if (parts.length === 1) { t.textContent = s; return t; }
    let sh = 0; parts.forEach(q => { if (!q) return; const sub = q.startsWith("_{"); el("tspan", { dy: sub ? 4 - sh : -sh, "font-size": sub ? "76%" : "100%" }, t, sub ? q.slice(2, -1) : q); sh = sub ? 4 : 0; }); return t; };
  const img = (svg, href, x, y, w, h, o = {}) => el("image", Object.assign({ href, x, y, width: w, height: h, preserveAspectRatio: "none", style: "image-rendering:pixelated" }, o), svg);
  const line = (svg, x1, y1, x2, y2, mk, o = {}) => el("line", Object.assign({ x1, y1, x2, y2, stroke: css("--muted"), "stroke-width": 1.7, "marker-end": mk ? `url(#${mk})` : "" }, o), svg);
  const box = (svg, x, y, w, h, tok, o = {}) => el("rect", Object.assign({ x, y, width: w, height: h, rx: 9, fill: css("--card"), stroke: css(tok), "stroke-width": 1.6 }, o), svg);
  // stage frame; on = highlighted
  const frame = (svg, x, y, w, h, on, k) => el("rect", { x, y, width: w, height: h, rx: 11, fill: on ? css("--accent") : "transparent", "fill-opacity": on ? .07 : 1, stroke: css(on ? "--accent" : "--line"), "stroke-width": on ? 2.2 : 1, "stroke-dasharray": on ? "" : "4 4", "data-st": k }, svg);
  // a 3-D slab (stack of faces): front face at x, y
  function slab(svg, x, y, w, h, tok, { depth = 3, dx = 5, fill = .14 } = {}) {
    for (let d = depth; d >= 1; d--) el("rect", { x: x + d * dx, y: y - d * dx, width: w, height: h, rx: 3, fill: css("--card"), stroke: css(tok), "stroke-width": 1.1, opacity: .9 }, svg);
    return el("rect", { x, y, width: w, height: h, rx: 3, fill: css(tok), "fill-opacity": fill, stroke: css(tok), "stroke-width": 1.8 }, svg);
  }
  const tag = (k, s) => `<span class="sctag ${k}">${s}</span>`;
  const sci = (v, d = 1) => { if (!v) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e; return `${fmt(m, d)}·10<sup>${e}</sup>`; };
  const big = (v, d = 1) => v >= 1e12 ? fmt(v / 1e12, d) + " T" : v >= 1e9 ? fmt(v / 1e9, d) + " G" : v >= 1e6 ? fmt(v / 1e6, d) + " M" : v >= 1e3 ? fmt(v / 1e3, d) + " k" : fmt(v, 0);

  /* the four models (same channel counts as Part B's sb-tokens: our count from §4.2.2, Table 1, Fig. 11) */
  const MODELS = {
    sn: { t: "satellite nowcast", out: 8, outT: "8 GOES channels", g: [["noisy", 8, "noisy future x_{σ}", "--accent"], ["sat", 48, "6 past GOES × 8 ch", "--cool"], ["ll", 2, "lat, lon", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] },
    sr: { t: "satellite nearcast", out: 8, outT: "8 GOES channels", g: [["noisy", 8, "noisy future x_{σ}", "--accent"], ["sat", 8, "GOES 1 h before", "--cool"], ["z5", 1, "Z500 (ERA5 / GFS)", "--muted"], ["ll", 2, "lat, lon", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] },
    rn: { t: "radar nowcast", out: 1, outT: "1 MRMS channel", g: [["nr", 1, "noisy future y_{σ}", "--accent"], ["rad", 6, "6 past MRMS", "--lw"], ["sat", 48, "6 GOES × 8 ch", "--cool"], ["ll", 2, "lat, lon", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] },
    rr: { t: "radar nearcast", out: 1, outT: "1 MRMS channel", g: [["nr", 1, "noisy future y_{σ}", "--accent"], ["rad", 1, "MRMS 1 h before", "--lw"], ["sat", 8, "GOES 1 h before", "--cool"], ["gr", 1, "GFS sim. reflectivity", "--muted"], ["ll", 2, "lat, lon", "--arch"], ["sz", 1, "cos solar zenith", "--arch"]] } };
  const cin = m => MODELS[m].g.reduce((s, g) => s + g[1], 0);

  /* EDM constants: σ_data and the σ range are not given in the paper; EDM defaults, toy σ_int */
  const SD = .5, SMIN = .002, SMAX = 80, SINT = 1;
  const cIn = s => 1 / Math.sqrt(s * s + SD * SD), cSkip = s => SD * SD / (s * s + SD * SD), cOut = s => s * SD / Math.sqrt(s * s + SD * SD), lam = s => (s * s + SD * SD) / (s * SD) ** 2;
  const sched = S => Array.from({ length: S }, (_, i) => Math.pow(Math.pow(SMAX, 1 / 7) + i / Math.max(1, S - 1) * (Math.pow(SMIN, 1 / 7) - Math.pow(SMAX, 1 / 7)), 7));

  /* parameter / operation / memory estimate with the DiT recipe (heads of 64, adaLN-Zero, 256-frequency σ embedding) */
  function est({ ci, co, d = 768, L = 16, r = 4, pos = 1 }) {
    const N = 28672, h = d / 64, k2 = 961;
    const P = { attn: L * (4 * d * d + 4 * d), mlp: L * (2 * r * d * d + r * d + d), ada: L * (6 * d * d + 6 * d), patch: 16 * ci * d + d, temb: 256 * d + d + d * d + d, head: 2 * d * d + 2 * d + 16 * co * d + 16 * co, pos: pos ? N * d : 0 };
    P.total = P.attn + P.mlp + P.ada + P.patch + P.temb + P.head + P.pos;
    const F = { proj: N * L * 8 * d * d, na: N * L * 4 * k2 * d, mlp: N * L * 4 * r * d * d, io: N * (32 * ci * d + 32 * co * d) };
    F.total = F.proj + F.na + F.mlp + F.io;
    const Mt = { state: 16 * P.total, act: ((12 + 2 * r) * d + h * k2) * 4 * N * L };
    const Mi = { w: 4 * P.total, act: ((4 + r) * d + h * k2) * 4 * N };
    return { P, F, Mt, Mi, N, h };
  }
  const dark = () => { const c = rgbOf("--bg"); return .3 * c[0] + .6 * c[1] + .1 * c[2] < 100; };
  return { NX, NY, GRAY, paint, url, storm, irPaint, dbz, radPaint, blur, txt, img, line, box, frame, slab, tag, sci, big, MODELS, cin, SD, SMIN, SMAX, SINT, cIn, cSkip, cOut, lam, sched, est, rgbOf, dark };
})();

/* ───────── 1 · the whole denoiser, end to end ───────── */
demo("sc-arch", () => {
  const { NX, NY, txt, img, line, box, frame, slab, tag } = SC;
  let step = 0, mode = "sn";
  chips($("#scArStep"), v => { step = +v; render(); });
  chips($("#scArMode"), v => { mode = v; render(); });
  const b = SC.storm(80, 3), r = rng(11), nz = Float32Array.from({ length: NX * NY }, () => gauss(r));
  const lat = new Float32Array(NX * NY), sza = new Float32Array(NX * NY), z5 = new Float32Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; lat[k] = 50 - 25 * j / NY; sza[k] = clamp(Math.cos((i / NX - .3) * 2.1 + .3 * (j / NY - .5)), 0, 1); z5[k] = 5550 + 280 * j / NY + 60 * Math.sin(i / NX * 9 + 1) * Math.cos(j / NY * 3); }
  const thumbs = () => ({ noisy: SC.url(SC.paint(Float32Array.from(b, (v, k) => 292 - 88 * v + 34 * nz[k]), NX, NY, { color: SC.GRAY, lo: 300, hi: 200 })), sat: SC.url(SC.irPaint(b)), rad: SC.url(SC.radPaint(b)),
    nr: SC.url(SC.paint(Float32Array.from(SC.dbz(b), (v, k) => v + 26 * nz[k]), NX, NY, { color: CM.precip, lo: 0, hi: 60 })), ll: SC.url(SC.paint(lat, NX, NY, { color: CM.vir, lo: 25, hi: 50 })),
    sz: SC.url(SC.paint(sza, NX, NY, { color: CM.temp, lo: 0, hi: 1 })), z5: SC.url(SC.paint(z5, NX, NY, { color: CM.temp, lo: 5450, hi: 5900 })), gr: SC.url(SC.radPaint(Float32Array.from(SC.blur(b, 5), v => 1.25 * v))) });
  let IM = null, IMkey = "";
  // token-grid preview: 8 × 14 block means of the toy IR
  const tok = []; for (let a = 0; a < 8; a++) for (let c = 0; c < 14; c++) { let s = 0; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) s += b[(a * 8 + j) * NX + c * 8 + i]; tok.push(s / 64); }
  const cv = (f, s) => { const v = f(s); return v < 1e-3 ? v.toExponential(0) : fmt(v, v < .1 ? 3 : 2); };
  const coef = (nm, f) => `c<sub>${nm}</sub> = ${[80, 1, .01].map(s => cv(f, s)).join(" · ")}`;
  const coefRow = which => `<p class="mono" style="font-size:11.5px;color:var(--muted)">at σ = 80 · 1 · 0.01 (σ<sub>data</sub> = 0.5): ${which.map(([n, f]) => coef(n, f)).join("; ")}</p>`;
  const CARDS = [
    ["① The inputs, all on the 512 × 896 grid", M => `<p><b>${M.t}</b>: ${M.g.map(g => `<b style="color:var(${g[3]})">${g[1]}</b> ${g[2].replace(/_\{(.*?)\}/g, "<sub>$1</sub>")}`).join(" + ")}. The first block is the <b>noisy future</b>: in training the true future plus noise σ·n, in sampling the sampler's current state.</p>
      <p>${tag("p", "paper")}the list of inputs (§4.2.2, Table 1). ${tag("u", "unstated")}per-channel normalisation, lat/lon encoding (we count 2 channels), frame order.</p>`],
    ["② Scale the noisy part, then stack as channels", M => `<p><b>c<sub>in</sub>(σ) = 1/√(σ² + σ<sub>data</sub>²)</b> shrinks the noisy channels to about unit size whatever σ is; then everything is <b>concatenated</b>: <b>${SC.cin(mode)} × 512 × 896</b>.</p>${coefRow([["in", SC.cIn]])}
      <p>${tag("p", "paper")}concatenation (§4.2.2), EDM input pre-conditioning (§4.2.3). ${tag("s", "EDM practice")}c<sub>in</sub> on the noisy channels only. ${tag("u", "unstated")}σ<sub>data</sub>.</p>`],
    ["③ Patch embedding: one strided convolution", M => `<p>Kernel 4 × 4, stride 4: each 24 × 24 km patch's <b>${16 * SC.cin(mode)}</b> numbers (16 pixels × ${SC.cin(mode)} channels) are mapped to <b>768</b> by one shared matrix: <b>${fmtN(16 * SC.cin(mode) * 768 + 768)}</b> weights. Output 768 × 128 × 224.</p>
      <p>${tag("p", "paper")}"strided convolution-based patch embedding, with a patch size of 4 × 4", 768 (§4.2.2).</p>`],
    ["④ A sequence of 28,672 tokens", () => `<p>Flatten 128 × 224: <b>28,672 tokens</b> of 768 numbers, one per 24 × 24 km patch. A transformer does not know where a token sits unless told; here the lat/lon channels label every patch and neighborhood attention uses the 2-D layout.</p>
      <p>${tag("s", "DiT practice")}a fixed 2-D sine-cosine position embedding. ${tag("u", "unstated")}whether StormScope adds one (slide 2: a learned one would fit 195 M).</p>`],
    ["⑤ The noise level σ becomes a vector c", () => `<p>c<sub>noise</sub> = ¼ ln σ → 256 sines and cosines → two-layer MLP → <b>c</b>, 768 numbers per sample. c sets scale, shift and gate in every block and in the head: the same weights act differently at σ = 50 and at σ = 0.01.</p>
      <p>${tag("p", "paper")}"conditioned on the diffusion timestep using the standard conditional layer normalization adopted in DiTs" (§4.2.2). ${tag("u", "unstated")}the embedding itself.</p>`],
    ["⑥ 16 DiT blocks: the shape never changes", () => `<p><b style="color:var(--mag)">adaLN</b> (LayerNorm · (1 + γ) + β, from c) → <b style="color:var(--cool)">neighborhood attention</b> 31 × 31 → gate, add → adaLN → <b style="color:var(--data)">MLP</b> per token → gate, add. 28,672 × 768 in and out. Only attention moves information sideways: ±15 tokens (360 km) per block.</p>
      <p>${tag("p", "paper")}16 blocks, adaLN on σ, NA 31 × 31 (§4.2.2). ${tag("s", "DiT practice")}MLP 3,072 wide, 12 heads of 64, adaLN-Zero. ${tag("u", "unstated")}heads, MLP width.</p>`],
    ["⑦ Output head: each token back to 4 × 4 pixels", M => `<p>A final adaLN and one linear layer per token: 768 → 4 · 4 · ${M.out} = <b>${16 * M.out}</b> numbers, the ${M.outT} for each of the token's 16 pixels.</p>
      <p>${tag("p", "paper")}"projecting and reshaping back to the 512 × 896 grid" (§4.2.2). ${tag("s", "DiT practice")}adaLN + linear, zero-initialised. ${tag("u", "unstated")}the head's details.</p>`],
    ["⑧ Unpatchify: reshape, nothing learned", M => `<p>28,672 × ${16 * M.out} → 128 × 224 × 4 × 4 × ${M.out} → <b>${M.out} × 512 × 896</b>. This raw network output is <b>F<sub>θ</sub></b>.</p>
      <p>${tag("p", "paper")}reshaped back to 512 × 896 (§4.2.2).</p>`],
    ["⑨ Skip and combine: D = c<sub>skip</sub> · x<sub>σ</sub> + c<sub>out</sub> · F<sub>θ</sub>", M => `<p>Large σ: c<sub>skip</sub> ≈ 0, the network draws the clean image itself. Small σ: c<sub>skip</sub> ≈ 1, F<sub>θ</sub> only corrects. <b>D<sub>θ</sub></b> (${M.out} × 512 × 896) feeds the loss (slide 3) or the sampler (slide 4).</p>${coefRow([["skip", SC.cSkip], ["out", SC.cOut]])}
      <p>${tag("p", "paper")}EDM output pre-conditioning (§4.2.3). ${tag("u", "unstated")}σ<sub>data</sub>.</p>`]];
  $("#scArFig").addEventListener("click", e => { const t = e.target.closest("[data-st]"); if (!t) return; step = +t.dataset.st; press($$("#scArStep button.chip"), $$("#scArStep button.chip")[step]); render(); });
  function render() {
    const M = MODELS(), CI = SC.cin(mode), CO = M.out, key = css("--well");
    if (key !== IMkey) { IM = thumbs(); IMkey = key; }
    const svg = svgIn($("#scArFig"), 1000, 300); svg.style.cursor = "default";
    arrowDefs(svg, "scArA", css("--muted")); arrowDefs(svg, "scArM", css("--mag")); arrowDefs(svg, "scArF", css("--fg"));
    const on = k => step === k, G = k => el("g", { opacity: on(k) ? 1 : .42, "data-st": k, style: "cursor:pointer" }, svg);
    [[0, 22, 162, 214], [164, 22, 80, 214], [248, 22, 88, 214], [340, 22, 96, 214], [152, 240, 312, 58], [440, 22, 194, 214], [638, 22, 88, 214], [730, 22, 80, 214], [814, 22, 184, 214]]
      .forEach(([x, y, w, h], k) => frame(svg, x, y, w, h, on(k), k));
    const n = M.g.length, rowY = k => 32 + 32 * k;
    // ① inputs
    const g0 = G(0);
    M.g.forEach(([k, cnt, lab, col], i) => { const y = rowY(i);
      img(g0, IM[k], 8, y, 40, 23); el("rect", { x: 8, y, width: 40, height: 23, fill: "none", stroke: css(col), "stroke-width": 2.2, rx: 2 }, g0);
      txt(g0, 54, y + 10, lab, { "font-size": 11.5, fill: css(col), "font-weight": 600 });
      txt(g0, 54, y + 23, `${cnt} × 512 × 896`, { "font-size": 10.5, class: "mono", fill: css("--muted") }); });
    // ② c_in + concat
    const g1 = G(1), y0 = rowY(0) + 11.5, sx = 190, sy = 40, sw = 44, sh = 168;
    M.g.forEach((g, i) => { const y = rowY(i) + 11.5;
      if (i === 0) { line(g1, 160, y, 162, y); el("circle", { cx: 172, cy: y, r: 9, fill: css("--card"), stroke: css("--mag"), "stroke-width": 1.8 }, g1); txt(g1, 172, y + 4, "×", { "text-anchor": "middle", "font-size": 13, fill: css("--mag"), "font-weight": 700 }); line(g1, 181, y, sx - 2, y, "scArA"); }
      else line(g1, 160, y, sx - 2, clamp(y, sy + 4, sy + sh - 4), "scArA"); });
    slab(g1, sx, sy, sw, sh, "--fg", { depth: 2, dx: 4, fill: 0 });
    let yy = sy; M.g.forEach(([, cnt, , col]) => { const h = sh * cnt / CI; el("rect", { x: sx + 1, y: yy, width: sw - 2, height: Math.max(h, 1.5), fill: css(col), "fill-opacity": .45 }, g1); yy += h; });
    el("rect", { x: sx, y: sy, width: sw, height: sh, rx: 3, fill: "none", stroke: css("--fg"), "stroke-width": 1.8 }, g1);
    txt(g1, sx + sw / 2, sy + sh / 2 + 7, String(CI), { "text-anchor": "middle", "font-size": 20, "font-weight": 700, class: "mono", stroke: css("--card"), "stroke-width": 4, "paint-order": "stroke" });
    txt(g1, 205, 224, `${CI} × 512 × 896`, { "text-anchor": "middle", "font-size": 10.5, class: "mono", "font-weight": 600 });
    txt(g1, 172, y0 + 22, "c_{in}", { "text-anchor": "middle", "font-size": 10.5, fill: css("--mag"), "font-weight": 700, stroke: css("--bg"), "stroke-width": 3, "paint-order": "stroke" });
    // ③ patch embedding
    const g2 = G(2); line(g2, 238, 126, 252, 126, "scArA");
    SC.box(g2, 256, 84, 74, 84, "--accent", { "stroke-width": 2 });
    [["Patch", 12.5, 600, "--fg"], ["embed", 12.5, 600, "--fg"], ["conv 4 × 4", 10.5, 400, "--muted"], ["stride 4", 10.5, 400, "--muted"]].forEach(([s, f, w, c], i) => txt(g2, 293, 103 + 16 * i, s, { "text-anchor": "middle", "font-size": f, "font-weight": w, fill: css(c) }));
    txt(g2, 292, 188, `${16 * CI} → 768`, { "text-anchor": "middle", "font-size": 11, class: "mono", "font-weight": 600 });
    txt(g2, 292, 202, "per 4 × 4 patch", { "text-anchor": "middle", "font-size": 10, fill: css("--muted") });
    // ④ tokens
    const g3 = G(3); line(g3, 332, 126, 346, 126, "scArA");
    const tx = 350, ty = 104, tw = 74, th = 42;
    for (let d = 3; d >= 1; d--) el("rect", { x: tx + 4 * d, y: ty - 4 * d, width: tw, height: th, fill: css("--card"), stroke: css("--accent"), "stroke-width": 1, rx: 2 }, g3);
    tok.forEach((v, q) => { const a = Math.floor(q / 14), c = q % 14; el("rect", { x: tx + c * tw / 14 + .4, y: ty + a * th / 8 + .4, width: tw / 14 - .8, height: th / 8 - .8, fill: SC.GRAY(clamp(v * 1.4, 0, 1)) }, g3); });
    el("rect", { x: tx, y: ty, width: tw, height: th, fill: "none", stroke: css("--accent"), "stroke-width": 1.8, rx: 2 }, g3);
    txt(g3, 388, 70, "768 deep", { "text-anchor": "middle", "font-size": 10, fill: css("--muted") });
    txt(g3, 388, 168, "768 × 128 × 224", { "text-anchor": "middle", "font-size": 10.5, class: "mono" });
    txt(g3, 388, 186, "= 28,672 tokens", { "text-anchor": "middle", "font-size": 11.5, "font-weight": 700 });
    txt(g3, 388, 200, "× 768 numbers", { "text-anchor": "middle", "font-size": 10.5, fill: css("--muted") });
    // ⑤ σ embedding
    const g4 = G(4);
    el("circle", { cx: 172, cy: 269, r: 14, fill: css("--card"), stroke: css("--mag"), "stroke-width": 2 }, g4);
    txt(g4, 172, 275, "σ", { "text-anchor": "middle", "font-size": 17, "font-style": "italic", fill: css("--mag"), "font-weight": 600 });
    line(g4, 186, 269, 214, 269, "scArM", { stroke: css("--mag") });
    SC.box(g4, 216, 250, 214, 38, "--mag");
    txt(g4, 323, 266, "c_{noise} = ¼ ln σ → 256 sin/cos → MLP", { "text-anchor": "middle", "font-size": 11.5, fill: css("--mag"), "font-weight": 600 });
    txt(g4, 323, 281, "→ c: one vector of 768 per sample", { "text-anchor": "middle", "font-size": 10.5, fill: css("--muted") });
    el("path", { d: "M172 255 V" + (y0 + 10), fill: "none", stroke: css("--mag"), "stroke-width": 1.5, "stroke-dasharray": "4 3", "marker-end": "url(#scArM)" }, g4);
    el("path", { d: "M430 269 H838 V142", fill: "none", stroke: css("--mag"), "stroke-width": 1.6, "stroke-dasharray": "5 3", "marker-end": "url(#scArM)" }, g4);
    [[537, 224], [682, 170]].forEach(([x, yt]) => el("path", { d: `M${x} 269 V${yt + 2}`, fill: "none", stroke: css("--mag"), "stroke-width": 1.8, "marker-end": "url(#scArM)" }, g4));
    txt(g4, 548, 262, "c → every block (γ, β, α)", { "font-size": 10.5, fill: css("--mag") });
    txt(g4, 692, 262, "c → head", { "font-size": 10.5, fill: css("--mag") });
    txt(g4, 760, 290, "σ also sets c_{in}, c_{skip}, c_{out} (EDM)", { "text-anchor": "middle", "font-size": 10.5, fill: css("--mag") });
    // ⑥ DiT blocks
    const g5 = G(5); line(g5, 428, 126, 446, 126, "scArA");
    for (let d = 2; d >= 1; d--) el("rect", { x: 448 + 4 * d, y: 34 - 4 * d, width: 178, height: 188, rx: 11, fill: css("--card"), stroke: css("--accent"), "stroke-width": 1 }, g5);
    SC.box(g5, 448, 34, 178, 188, "--accent", { "stroke-width": 2, rx: 11 });
    txt(g5, 537, 53, "16 × DiT block", { "text-anchor": "middle", "font-size": 13.5, "font-weight": 700, fill: css("--accent") });
    const sub = (y, h, tokc, l1, l2) => { SC.box(g5, 462, y, 150, h, tokc, { rx: 7 }); txt(g5, 537, y + (l2 ? 13 : h / 2 + 4), l1, { "text-anchor": "middle", "font-size": 11.5, fill: css(tokc), "font-weight": 600 }); if (l2) txt(g5, 537, y + 26, l2, { "text-anchor": "middle", "font-size": 10, class: "mono", fill: css("--muted") }); };
    sub(62, 24, "--mag", "adaLN: LN · (1 + γ) + β");
    sub(94, 32, "--cool", "neighborhood attention", "31 × 31 tokens");
    txt(g5, 537, 139, "× α₁, + residual", { "text-anchor": "middle", "font-size": 10.5, fill: css("--muted") });
    sub(146, 32, "--data", "adaLN → MLP", "768→3,072→768 (assumed)");
    txt(g5, 537, 192, "× α₂, + residual", { "text-anchor": "middle", "font-size": 10.5, fill: css("--muted") });
    txt(g5, 537, 211, "28,672 × 768 in = out", { "text-anchor": "middle", "font-size": 10.5, class: "mono", "font-weight": 600 });
    // ⑦ head
    const g6 = G(6); line(g6, 628, 126, 642, 126, "scArA");
    SC.box(g6, 644, 84, 76, 84, "--accent", { "stroke-width": 2 });
    [["Output", 12.5, 600, "--fg"], ["head", 12.5, 600, "--fg"], ["adaLN +", 10.5, 400, "--muted"], ["linear", 10.5, 400, "--muted"]].forEach(([s, f, w, c], i) => txt(g6, 682, 103 + 16 * i, s, { "text-anchor": "middle", "font-size": f, "font-weight": w, fill: css(c) }));
    txt(g6, 682, 188, `768 → ${16 * CO}`, { "text-anchor": "middle", "font-size": 11, class: "mono", "font-weight": 600 });
    txt(g6, 682, 202, "per token", { "text-anchor": "middle", "font-size": 10, fill: css("--muted") });
    // ⑧ unpatchify
    const g7 = G(7); line(g7, 722, 126, 738, 126, "scArA");
    slab(g7, 742, 62, 46, 128, "--accent", { depth: CO > 1 ? 3 : 0, dx: 4, fill: .12 });
    txt(g7, 765, 131, "F_{θ}", { "text-anchor": "middle", "font-size": 17, "font-style": "italic", "font-weight": 700, fill: css("--accent") });
    txt(g7, 770, 44, "reshape", { "text-anchor": "middle", "font-size": 10.5, fill: css("--muted") });
    txt(g7, 770, 208, `${CO} × 512 × 896`, { "text-anchor": "middle", "font-size": 10.5, class: "mono", "font-weight": 600 });
    // ⑨ skip + combine
    const g8 = G(8);
    el("path", { d: `M161 ${y0} V13 H838 V108`, fill: "none", stroke: css("--fg"), "stroke-width": 1.6, "marker-end": "url(#scArF)" }, g8);
    txt(g8, 500, 10, "skip connection: the noisy input x_{σ} itself goes straight to the end, weighted by c_{skip}(σ)", { "text-anchor": "middle", "font-size": 11, fill: css("--fg") });
    line(g8, 794, 126, 822, 126, "scArA");
    el("circle", { cx: 838, cy: 126, r: 15, fill: css("--card"), stroke: css("--fg"), "stroke-width": 1.8 }, g8);
    txt(g8, 838, 132, "+", { "text-anchor": "middle", "font-size": 19, "font-weight": 700 });
    txt(g8, 846, 72, "× c_{skip}", { "font-size": 10.5, fill: css("--mag"), "font-weight": 600 });
    txt(g8, 818, 150, "× c_{out}", { "text-anchor": "end", "font-size": 10.5, fill: css("--mag"), "font-weight": 600 });
    line(g8, 853, 126, 868, 126, "scArA");
    slab(g8, 872, 62, 46, 128, "--accent", { depth: CO > 1 ? 3 : 0, dx: 4, fill: .3 });
    txt(g8, 895, 131, "D_{θ}", { "text-anchor": "middle", "font-size": 17, "font-style": "italic", "font-weight": 700, fill: css("--accent") });
    txt(g8, 900, 208, `${CO} × 512 × 896`, { "text-anchor": "middle", "font-size": 10.5, class: "mono", "font-weight": 600 });
    [["denoised", "--fg"], ["future", "--fg"], ["→ loss", "--muted"], ["→ sampler", "--muted"]].forEach(([s, c], i) => txt(g8, 934, 96 + 16 * i + (i > 1 ? 14 : 0), s, { "font-size": 10.5, fill: css(c) }));
    // card and readout
    const C = CARDS[step];
    $("#scArCard").innerHTML = `<h4>${C[0]}</h4>${C[1](M)}`;
    const SH = [[M.g.map(g => g[1]).join(" + ") + " ch", CI * 458752], [`${CI} × 512 × 896`, CI * 458752], ["768 × 128 × 224", 768 * 28672], ["28,672 × 768", 768 * 28672], ["768 (one vector)", 768], ["28,672 × 768", 768 * 28672],
      [`28,672 × ${16 * CO}`, 28672 * 16 * CO], [`${CO} × 512 × 896`, CO * 458752], [`${CO} × 512 × 896`, CO * 458752]][step];
    $("#scArRead").innerHTML = `<div style="flex-basis:100%"><span>Tensor at this stage</span><b>${SH[0]}</b></div><div><span>Numbers</span><b class="c-data">${SC.big(SH[1], SH[1] < 1e6 ? 0 : 1)}</b></div><div><span>fp32 size</span><b class="c-data">${SH[1] * 4 >= 1e6 ? fmt(SH[1] * 4 / 1e6, 0) + " MB" : fmt(SH[1] * 4 / 1e3, 1) + " kB"}</b></div><div><span>Channels in / out</span><b class="c-arch">${CI} / ${CO}</b></div>`;
  }
  const MODELS = () => SC.MODELS[mode];
  render(); return render;
});

/* ───────── 2 · parameters, operations, memory ───────── */
demo("sc-params", () => {
  let mode = "sn", d = 768, r = 4, pos = 1;
  chips($("#scPaMode"), v => { mode = v; render(); }); chips($("#scPaD"), v => { d = +v; render(); });
  chips($("#scPaR"), v => { r = +v; render(); }); chips($("#scPaPos"), v => { pos = +v; render(); });
  const Ls = slider("scPaL", v => v + (v === 16 ? " (paper)" : ""), render);
  // stacked bar with a legend underneath; returns the y below it
  function sbar(svg, y, segs, max, W, { mark = null, unit = v => SC.big(v), h = 20, title = "" } = {}) {
    const x0 = 4, span = W - 8, X = v => x0 + span * v / max;
    if (title) { SC.txt(svg, x0, y + 11, title, { "font-size": 11.5, "font-weight": 600 }); y += 16; } else if (mark) y += 12;
    el("rect", { x: x0, y, width: span, height: h, rx: 4, fill: css("--well") }, svg);
    let acc = 0; segs.forEach(s => { if (s.v <= 0) return; el("rect", { x: X(acc), y, width: Math.max(1, X(acc + s.v) - X(acc)), height: h, fill: css(s.col), opacity: .85 }, svg); acc += s.v; });
    if (mark) { el("line", { x1: X(mark.v), x2: X(mark.v), y1: y - 5, y2: y + h + 5, stroke: css("--fg"), "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      const right = X(mark.v) > W - 120; SC.txt(svg, X(mark.v) + (right ? -5 : 5), y - 3, mark.lab, { "font-size": 11, "font-weight": 700, "text-anchor": right ? "end" : "start" }); }
    let lx = x0, ly = y + h + 15;
    segs.forEach(s => { if (s.v <= 0 && !s.keep) return; const t = `${s.lab} ${unit(s.v)}`, w = 14 + t.length * 6.1;
      if (lx + w > W) { lx = x0; ly += 15; }
      el("rect", { x: lx, y: ly - 9, width: 9, height: 9, rx: 2, fill: css(s.col) }, svg);
      SC.txt(svg, lx + 12, ly, t, { "font-size": 11, fill: css("--fg") }); lx += w + 8; });
    return ly + 6;
  }
  function render() {
    const L = Ls(), ci = SC.cin(mode), co = SC.MODELS[mode].out, E = SC.est({ ci, co, d, L, r, pos }), P = E.P, F = E.F, W = 600;
    const pseg = [{ v: P.attn, col: "--cool", lab: "attention Q K V O" }, { v: P.mlp, col: "--data", lab: "MLP" }, { v: P.ada, col: "--mag", lab: "adaLN (from σ)" }, { v: P.pos, col: "--muted", lab: "position table", keep: true },
      { v: P.patch, col: "--arch", lab: "patch embed" }, { v: P.temb, col: "--sw", lab: "σ embedding" }, { v: P.head, col: "--accent", lab: "head" }];
    const s1 = svgIn($("#scPaP"), W, 76), m1 = Math.max(P.total, 195e6) * 1.06;
    const h1 = sbar(s1, 4, pseg, m1, W, { mark: { v: 195e6, lab: "paper: 195 M" } }); s1.setAttribute("viewBox", `0 0 ${W} ${h1}`);
    const fseg = [{ v: F.proj, col: "--cool", lab: "Q K V O projections" }, { v: F.na, col: "--accent", lab: "attention scores (31 × 31)" }, { v: F.mlp, col: "--data", lab: "MLP" }, { v: F.io, col: "--arch", lab: "patch + head" }];
    const s2 = svgIn($("#scPaF"), W, 60), h2 = sbar(s2, 4, fseg, F.total * 1.02, W, { unit: v => SC.big(v) + "FLOP" }); s2.setAttribute("viewBox", `0 0 ${W} ${h2}`);
    const s3 = svgIn($("#scPaM"), W, 120), gb = v => fmt(v / 1e9, 1) + " GB";
    let y = sbar(s3, 2, [{ v: E.Mt.state, col: "--arch", lab: "weights + grads + Adam" }, { v: E.Mt.act, col: "--data", lab: "stored activations" }], Math.max(E.Mt.state + E.Mt.act, 70e9) * 1.08, W, { mark: { v: 70e9, lab: "paper: ~70 GB" }, unit: gb, title: "Training (one sample per GPU)", h: 16 });
    y = sbar(s3, y + 2, [{ v: E.Mi.w, col: "--arch", lab: "weights" }, { v: E.Mi.act, col: "--data", lab: "working activations, one block" }], Math.max(E.Mi.w + E.Mi.act, 5e9) * 1.08, W, { mark: { v: 5e9, lab: "paper: ~5 GB" }, unit: gb, title: "Inference", h: 16 });
    s3.setAttribute("viewBox", `0 0 ${W} ${y}`);
    const ok = Math.abs(P.total / 195e6 - 1) < .03, tf = F.total / 1e12, pc = v => fmt(100 * v, 0) + " %";
    $("#scPaIns").innerHTML = `<b>Parameters ≠ compute.</b> adaLN holds ${pc(P.ada / P.total)} of the weights but costs almost nothing (it runs once per sample, not per token); a learned position table would be ${pc(P.pos / P.total)} of the weights and 0 FLOP. The MLP does ${pc(F.mlp / F.total)} of the work; thanks to the 31 × 31 window the attention scores are only ${pc(F.na / F.total)} (global attention would need ~${fmt(28672 / 961, 0)}× more, see <button class="btn scgo" data-go="sb-na" style="padding:0 8px;font-size:12px">sb-na</button>).`;
    $("#scPaRead").innerHTML = `<div><span>Parameters</span><b class="${ok ? "c-ok" : "c-lw"}">${fmt(P.total / 1e6, 1)} M</b></div><div><span>vs paper</span><b class="${ok ? "c-ok" : "c-lw"}">${fmt(100 * P.total / 195e6, 0)} %</b></div><div><span>per call</span><b class="c-data">${fmt(tf, 1)} TFLOP</b></div><div><span>Heads</span><b class="c-arch">${E.h}</b></div>`;
    const per = (4 * d * d + 4 * d) + (2 * r * d * d + r * d + d) + (6 * d * d + 6 * d), M = v => fmt(v / 1e6, 2).padStart(6) + " M";
    $("#scPaCalc").innerHTML = `<span class="m">per block, d = ${d}, MLP ${r} d</span>
attention Q K V O  4 d²     = <span class="k">${M(P.attn / L)}</span>
MLP                2·${r} d²   = <span class="k">${M(P.mlp / L)}</span>
adaLN-Zero         d · 6 d  = <span class="k">${M(P.ada / L)}</span>
× ${L} blocks                 = <span class="k">${M(per * L)}</span>
+ patch, σ-MLP, head        = <span class="k">${M(P.patch + P.temb + P.head)}</span>
+ position table 28,672 · d = <span class="k">${M(P.pos)}</span>
<b>total ≈ ${fmt(P.total / 1e6, 1)} M</b> <span class="m">(paper: 195 M)</span>
<span class="m">100 calls in 33 s ⇒ ≈ ${fmt(tf * 100 / 33, 0)} TFLOP/s achieved (1 call per σ step)</span>`;
  }
  render(); return render;
});

/* ───────── 3 · one training iteration ───────── */
demo("sc-iter", slide => {
  const { NX, NY, txt, img, line, frame } = SC;
  let step = 0, read6 = "it", timer = null, D = null, seed = 7;
  const btns = $$("#scItStep button.chip");
  chips($("#scItStep"), v => { stop(); step = +v; render(); });
  chips($("#scItRead6"), v => { read6 = v; render(); });
  const Is = slider("scItI", v => fmt(v / 100 * 6, 2) + " M", render);
  const T0 = Date.UTC(2018, 0, 1), T1 = Date.UTC(2024, 0, 1), YR = 365.25 * 864e5;
  // the drawn sample: valid time, σ, noise, toy fields
  function draw() {
    const r = rng(seed * 7919 + 13), t = T0 + Math.floor(r() * (T1 - T0) / 6e5) * 6e5, ls = Math.log(SC.SMIN) + r() * (Math.log(SC.SMAX) - Math.log(SC.SMIN)), s = Math.exp(ls);
    const ws = 1 + (seed % 9), past = [0, 10, 20, 30, 40, 50].map(m => SC.storm(30 + m, ws)), tgt = SC.storm(90, ws), X = Float32Array.from(tgt, v => 2 * v - .3);
    const n = Float32Array.from({ length: NX * NY }, () => gauss(r)), xs = Float32Array.from(X, (v, k) => v + s * n[k]);
    // toy denoiser: a blur whose radius grows with σ, shrunk towards the mean (Wiener-like); not the real network
    const rad = clamp(Math.round(1.6 * s), 0, 7), m = mean(Array.from(X)), se = s / (2 * rad + 1), k = SC.SD * SC.SD / (SC.SD * SC.SD + se * se), bl = SC.blur(xs, rad);
    const xh = Float32Array.from(bl, v => m + k * (v - m));
    let mse = 0; for (let q = 0; q < X.length; q++) mse += (xh[q] - X[q]) ** 2; mse /= X.length;
    D = { t: new Date(t), s, past, tgt, X, n, xs, xh, mse };
  }
  draw(); while (D.s < .4 || D.s > 6) { seed++; draw(); }
  $("#scItNew").onclick = () => { seed++; draw(); render(); };
  function stop() { if (timer) clearInterval(timer); timer = null; $("#scItRun").textContent = "▶ Run"; }
  $("#scItRun").onclick = () => { if (timer) { stop(); return; } step = 0; press(btns, btns[0]); render(); $("#scItRun").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!slide.classList.contains("on") || step >= 8) { stop(); return; } step++; press(btns, btns[step]); render(); }, 900); };
  const gray = (f, lo = -1, hi = 2) => SC.url(SC.paint(f, NX, NY, { color: SC.GRAY, lo, hi }));
  const ds = d => d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  const fs = s => fmt(s, s < .1 ? 3 : s < 10 ? 2 : 1);
  function render() {
    const svg = svgIn($("#scItFig"), 1000, 254); arrowDefs(svg, "scItA", css("--muted")); arrowDefs(svg, "scItL", css("--lw"));
    const on = k => step === k, G = k => el("g", Object.assign({ opacity: on(k) ? 1 : .45, "data-st": k, style: "cursor:pointer" }, k >= 4 ? { transform: "translate(0 -12)" } : {}), svg);
    const NB = [[24, 6, 212, 108], [256, 6, 230, 108], [506, 6, 230, 108], [756, 6, 240, 108], [806, 138, 190, 112], [606, 138, 182, 112], [406, 138, 182, 112], [206, 138, 182, 112], [24, 138, 164, 112]];
    NB.forEach(([x, y, w, h], k) => frame(svg, x, y, w, h, on(k), k));
    const T = (k, s) => txt(svg, NB[k][0] + 9, NB[k][1] + 18, s, { "font-size": 12.5, "font-weight": 700, fill: css(on(k) ? "--accent" : "--muted") });
    ["① pick a time t", "② load the frames", "③ draw σ, log-uniform", "④ add noise", "⑤ forward pass", "⑥ weighted loss", "⑦ backward pass", "⑧ all-reduce 32 GPUs", "⑨ Stable AdamW"].forEach((s, k) => T(k, s));
    // flow arrows and the loop
    [[236, 254], [486, 504], [736, 754]].forEach(([a, b]) => line(svg, a, 62, b, 62, "scItA"));
    line(svg, 976, 114, 976, 136, "scItA"); [[806, 788], [606, 588], [406, 388], [206, 190]].forEach(([a, b]) => line(svg, a, 194, b, 194, "scItA"));
    el("path", { d: "M24 224 H10 V40 H22", fill: "none", stroke: css("--muted"), "stroke-width": 1.7, "marker-end": "url(#scItA)" }, svg);
    txt(svg, 7, 132, "next iteration", { "font-size": 10.5, fill: css("--muted"), transform: "rotate(-90 7 132)", "text-anchor": "middle" });
    // ① timeline
    const g0 = G(0), X0 = 36, X1 = 226, yr = v => X0 + (X1 - X0) * (v - 2018) / 7;
    [["GOES", 2018, 2024, "--cool", 34], ["MRMS", 2020, 2024, "--lw", 54]].forEach(([s, a, b2, c, y]) => { el("rect", { x: yr(a), y, width: yr(b2) - yr(a), height: 12, rx: 3, fill: css(c), opacity: .75 }, g0);
      el("rect", { x: yr(2024), y, width: yr(2025) - yr(2024), height: 12, rx: 3, fill: css("--muted"), opacity: .3 }, g0); txt(g0, yr(a) + 4, y + 10, s, { "font-size": 10, fill: "#fff", "font-weight": 700 }); });
    txt(g0, yr(2024.5), 80, "test", { "font-size": 10, "text-anchor": "middle", fill: css("--muted") });
    for (let v = 2018; v <= 2025; v++) txt(g0, yr(v), 91, "’" + String(v).slice(2), { "font-size": 9.5, "text-anchor": "middle", class: "mono", fill: css("--muted") });
    const tv = 2018 + (D.t - T0) / YR; el("line", { x1: yr(tv), x2: yr(tv), y1: 28, y2: 70, stroke: css("--accent"), "stroke-width": 2.5 }, g0);
    txt(g0, 130, 106, "t = " + ds(D.t), { "font-size": 10.5, "text-anchor": "middle", class: "mono", "font-weight": 600, fill: css("--accent") });
    // ② frames
    const g1 = G(1);
    D.past.forEach((f, i) => { const x = 266 + 5 * i, y = 52 - 5 * i; img(g1, SC.url(SC.irPaint(f)), x, y, 56, 32); el("rect", { x, y, width: 56, height: 32, fill: "none", stroke: css("--cool"), "stroke-width": 1.2 }, g1); });
    line(g1, 350, 54, 386, 54, "scItA"); txt(g1, 368, 47, "+10 min", { "font-size": 9.5, "text-anchor": "middle", fill: css("--muted") });
    img(g1, SC.url(SC.irPaint(D.tgt)), 392, 34, 64, 37); el("rect", { x: 392, y: 34, width: 64, height: 37, fill: "none", stroke: css("--fg"), "stroke-width": 2 }, g1);
    txt(g1, 266, 93, "x_{t−}: 6 × 8 × 512 × 896", { "font-size": 10.5, class: "mono", fill: css("--cool") });
    txt(g1, 266, 106, "x_{t+}: 8 × 512 × 896 (target)", { "font-size": 10.5, class: "mono" });
    // ③ σ
    const g2 = G(2), a0 = 520, a1 = 722, lx = v => a0 + (a1 - a0) * (Math.log10(v) - Math.log10(SC.SMIN)) / (Math.log10(SC.SMAX) - Math.log10(SC.SMIN)), ay = 74;
    el("rect", { x: a0, y: ay - 5, width: lx(SC.SINT) - a0, height: 10, fill: css("--data"), opacity: .35 }, g2); el("rect", { x: lx(SC.SINT), y: ay - 5, width: a1 - lx(SC.SINT), height: 10, fill: css("--sw"), opacity: .35 }, g2);
    [0.01, 0.1, 1, 10].forEach(v => { el("line", { x1: lx(v), x2: lx(v), y1: ay - 7, y2: ay + 7, stroke: css("--muted") }, g2); txt(g2, lx(v), ay + 19, String(v), { "font-size": 9.5, class: "mono", "text-anchor": "middle", fill: css("--muted") }); });
    txt(g2, a0 + 2, 104, "fine expert", { "font-size": 10.5, fill: css("--data"), "font-weight": 600 }); txt(g2, a1, 104, "coarse expert", { "font-size": 10.5, fill: css("--sw"), "font-weight": 600, "text-anchor": "end" });
    el("line", { x1: lx(SC.SINT), x2: lx(SC.SINT), y1: ay - 12, y2: ay + 12, stroke: css("--fg"), "stroke-dasharray": "3 2" }, g2);
    el("circle", { cx: lx(D.s), cy: ay, r: 6.5, fill: css("--accent"), stroke: css("--card"), "stroke-width": 2 }, g2);
    txt(g2, clamp(lx(D.s), a0 + 30, a1 - 30), 52, "σ = " + fs(D.s), { "font-size": 12, class: "mono", "font-weight": 700, "text-anchor": "middle", fill: css("--accent") });
    // ④ noise
    const g3 = G(3);
    img(g3, gray(D.X), 766, 36, 56, 32); txt(g3, 828, 57, "+", { "font-size": 16, "font-weight": 700 });
    img(g3, gray(D.n, -3, 3), 842, 36, 56, 32); txt(g3, 904, 57, "=", { "font-size": 16, "font-weight": 700 });
    img(g3, gray(D.xs), 918, 30, 70, 40); el("rect", { x: 918, y: 30, width: 70, height: 40, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, g3);
    txt(g3, 794, 82, "x_{t+}", { "font-size": 11, "text-anchor": "middle" }); txt(g3, 870, 82, "σ · n", { "font-size": 11, "text-anchor": "middle" }); txt(g3, 953, 84, "x_{σ}", { "font-size": 11, "text-anchor": "middle", fill: css("--accent"), "font-weight": 700 });
    txt(g3, 766, 102, "n ~ N(0, 1): 8 × 512 × 896 draws", { "font-size": 10.5, fill: css("--muted") });
    // ⑤ forward
    const g4 = G(4);
    SC.box(g4, 816, 178, 84, 48, "--accent", { "stroke-width": 2 }); txt(g4, 858, 198, "D_{θ}", { "font-size": 15, "font-style": "italic", "font-weight": 700, "text-anchor": "middle", fill: css("--accent") }); txt(g4, 858, 216, "slide 1", { "font-size": 10, "text-anchor": "middle", fill: css("--muted") });
    line(g4, 902, 202, 914, 202, "scItA");
    img(g4, gray(D.xh), 918, 182, 70, 40); el("rect", { x: 918, y: 182, width: 70, height: 40, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, g4);
    txt(g4, 953, 236, "x̂ (toy)", { "font-size": 11, "text-anchor": "middle" });
    txt(g4, 816, 252, "≈ 7.9 TFLOP (our estimate)", { "font-size": 10.5, fill: css("--muted") });
    // ⑥ loss
    const g5 = G(5), lam = SC.lam(D.s);
    txt(g5, 616, 190, "λ(σ) · mean (x̂ − x_{t+})²", { "font-size": 12, "font-weight": 600 });
    txt(g5, 616, 210, `MSE   = ${D.mse < .001 ? D.mse.toExponential(2) : fmt(D.mse, 4)}`, { "font-size": 11, class: "mono" });
    txt(g5, 616, 226, `λ(σ)  = ${lam < 100 ? fmt(lam, 2) : fmtN(lam)}`, { "font-size": 11, class: "mono" });
    txt(g5, 616, 245, `loss  = ${fmt(lam * D.mse, 3)}`, { "font-size": 12, class: "mono", "font-weight": 700, fill: css("--accent") });
    // ⑦ backward
    const g6 = G(6);
    el("path", { d: "M576 214 H420", fill: "none", stroke: css("--lw"), "stroke-width": 2.2, "stroke-dasharray": "6 4", "marker-end": "url(#scItL)" }, g6);
    txt(g6, 498, 194, "∂L/∂θ for all 195 M weights", { "font-size": 11.5, "text-anchor": "middle", "font-weight": 600 });
    txt(g6, 498, 234, "≈ 2 × forward ≈ 16 TFLOP", { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted") });
    txt(g6, 498, 250, "uses the stored activations", { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted") });
    // ⑧ all-reduce
    const g7 = G(7);
    for (let q = 0; q < 32; q++) { const x = 218 + (q % 8) * 15, y = 178 + Math.floor(q / 8) * 15, rr = rng(seed * 31 + q)(); el("rect", { x, y, width: 12, height: 12, rx: 2, fill: css("--card"), stroke: css("--arch") }, g7); el("rect", { x: x + 2, y: y + 10 - 8 * rr, width: 8, height: 8 * rr, fill: css("--lw"), opacity: .8 }, g7); }
    line(g7, 340, 206, 350, 206, "scItA"); txt(g7, 368, 210, "mean", { "font-size": 11, "text-anchor": "middle", "font-weight": 600 });
    txt(g7, 216, 254, "32 GPUs × 1 sample each (our arithmetic)", { "font-size": 10, fill: css("--muted") });
    // ⑨ update
    const g8 = G(8), it = Is() / 100 * 6e6, lr = 5e-4 * .5 * (1 + Math.cos(Math.PI * it / 6e6));
    txt(g8, 34, 192, "θ ← θ − lr · step(m, v)", { "font-size": 11.5, class: "mono" });
    txt(g8, 34, 212, `lr = ${lr.toExponential(1)}`, { "font-size": 12, class: "mono", "font-weight": 700, fill: css("--accent") });
    txt(g8, 34, 230, "cosine 5·10⁻⁴ → 0", { "font-size": 10.5, fill: css("--muted") });
    txt(g8, 34, 246, "then back to ① (~6 M ×)", { "font-size": 10.5, fill: css("--muted") });
    // card
    const ex = D.s > SC.SINT ? "coarse" : "fine", CI = SC.cin("sn");
    const CARD = [
      ["① Pick a random valid time t", `Any 10-minute time in the training years: GOES 2018–2023 for the satellite models, MRMS 2020–2023 for the radar models; 2024 is never seen (test). This draw: <b class="mono">${ds(D.t)}</b> (toy). Each of the 32 GPUs picks its own t, so one iteration sees 32 different times. ${SC.tag("o", "our arithmetic")}6 years × 52,596 ten-minute times ≈ 316 k possible starts.`],
      ["② Load the window around t", `Satellite nowcast: the 6 frames of the hour before (x<sub>t−</sub>, 6 × 8 × 512 × 896) and the true next frame (x<sub>t+</sub>, 8 × 512 × 896), plus lat/lon and cos SZA: ${CI} channels in (slide 1). A nearcast model would load 1 frame an hour earlier and ERA5 Z500 (§4.1.2).`],
      ["③ Draw a noise level σ", `σ uniform in log σ between σ<sub>min</sub> and σ<sub>max</sub> (§4.2.3): every decade of noise gets the same share of training. This draw: <b class="mono">σ = ${fs(D.s)}</b> → the <b style="color:var(--${ex === "coarse" ? "sw" : "data"})">${ex} expert</b> is trained (toy σ<sub>int</sub> = 1). EDM's own default is log-normal around σ ≈ 1.2.`],
      ["④ Add noise to the target", `x<sub>σ</sub> = x<sub>t+</sub> + σ · n with n ~ N(0, I): 8 × 512 × 896 ≈ 3.7 M random numbers. At σ = ${fs(D.s)} the noise is ${D.s > 2 ? "far larger than" : D.s > .3 ? "about as large as" : "much smaller than"} the signal (toy data scaled to σ<sub>data</sub> ≈ 0.5).`],
      ["⑤ Forward pass", `The whole of slide 1: c<sub>in</sub> and concat → patches → 16 blocks → head → c<sub>skip</sub>, c<sub>out</sub>. Output x̂ = D<sub>θ</sub>(x<sub>σ</sub>; x<sub>t−</sub>, c; σ), 8 × 512 × 896. ${SC.tag("t", "toy")}a σ-dependent blur stands in for the network here.`],
      ["⑥ Weighted loss, eq. (1)", `λ(σ) · ‖x̂ − x<sub>t+</sub>‖², averaged over pixels and channels. With EDM's λ(σ) = (σ² + σ<sub>d</sub>²)/(σ σ<sub>d</sub>)², large-σ errors (naturally big) and small-σ errors (naturally tiny) count about equally. Toy numbers: MSE ${D.mse < .001 ? D.mse.toExponential(2) : fmt(D.mse, 4)} × λ ${lam < 100 ? fmt(lam, 2) : fmtN(lam)} = <b>${fmt(lam * D.mse, 3)}</b>.`],
      ["⑦ Backward pass", `Back-propagation computes ∂L/∂θ for every one of the 195 M parameters, re-using the activations stored during the forward pass: these, not the weights, fill most of the ~70 GB of GPU memory (§4.2.2; slide 2). Cost ≈ 2 × the forward pass (standard rule of thumb).`],
      ["⑧ Average the gradients over 32 GPUs", `Data parallelism (§4.2.2): every GPU holds a full copy of the model and processed its own sample; an all-reduce averages the 32 gradients so all copies stay identical. Batch 32 on 32 H100s ⇒ one sample per GPU per iteration (our arithmetic).`],
      ["⑨ Update the weights", `Stable AdamW (Wortsman et al. 2023, paper ref. 48) moves each weight using running averages of its gradient (m) and squared gradient (v); the learning rate follows a cosine from 5 × 10⁻⁴ to 0 (right). Then back to ①, ~6 M times, ~48 h per model (§4.2.3).`]];
    $("#scItCard").innerHTML = `<h4>${CARD[step][0]}</h4><p>${CARD[step][1]}</p>`;
    // learning-rate schedule
    const pts = Array.from({ length: 61 }, (_, i) => [i / 10, 5e-4 * .5 * (1 + Math.cos(Math.PI * i / 60))]);
    VIZ.curves($("#scItLr"), [{ pts, col: "--accent", label: "lr, cosine 5·10⁻⁴ → 0 (paper)" }], { xr: [0, 6], yr: [0, 5.5e-4], W: 470, H: 94, xl: "iterations (M)", yl: "learning rate", xt: [0, 2, 4, 6], yt: [0, 2.5e-4, 5e-4], xf: v => fmt(v, 0), yf: v => v ? v.toExponential(1) : "0", marks: [[it / 1e6, "now", "--lw"]], legendAt: "tr" });
    const steps = read6 === "it" ? 6e6 : 6e6 / 32, ips = steps / (48 * 3600), smp = it / 6e6 * steps * 32, tfg = ips * 3 * 7.9;
    $("#scItRead").innerHTML = `<div><span>lr now</span><b>${lr.toExponential(1)}</b></div><div><span>Samples seen</span><b class="c-data">${SC.big(smp, 0)}</b></div><div><span>Epochs</span><b class="c-data">${fmt(smp / 315576, smp / 315576 < 10 ? 1 : 0)}</b></div><div><span>Steps / s</span><b class="${ips > 5 ? "c-lw" : "c-ok"}">${fmt(ips, 1)}</b></div><div><span>TFLOP/s per GPU</span><b class="${ips > 5 ? "c-lw" : "c-ok"}">${fmtN(tfg)}</b></div>`;
  }
  $("#scItFig").addEventListener("click", e => { const t = e.target.closest("[data-st]"); if (!t) return; stop(); step = +t.dataset.st; press(btns, btns[step]); render(); });
  render(); return render;
});

/* ───────── 4 · one forecast as nested loops ───────── */
demo("sc-forecast", slide => {
  const { NX, NY, txt, img } = SC;
  let mode = "now", models = 2, k = 0, m = 0, i = 0, done = false, timer = null, speed = 4, flash = 0;
  chips($("#scFcMode"), v => { mode = v; reset(); }); chips($("#scFcMod"), v => { models = +v; reset(); }); chips($("#scFcSp"), v => { speed = +v; });
  const Ss = slider("scFcS", v => v, () => reset()), Ms = slider("scFcM", v => v, render), Gs = slider("scFcG", v => v, render);
  const seed = 5, r = rng(99), nz = Float32Array.from({ length: NX * NY }, () => gauss(r));
  const dtToy = () => mode === "now" ? 10 : 22;
  const FC = new Map();
  const fld = lead => { const key = mode + lead; if (!FC.has(key)) FC.set(key, SC.storm(120 + lead * dtToy(), seed)); return FC.get(key); };
  let UR = new Map(), URkey = "";
  const thumb = (lead, kind) => { const key = mode + kind + lead; if (!UR.has(key)) { const f = fld(lead); UR.set(key, SC.url(kind === "s" ? SC.irPaint(f) : SC.radPaint(f))); } return UR.get(key); };
  function reset() { stop(); k = 0; m = 0; i = 0; done = false; render(); }
  function tick() { if (done) return; const S = Ss(); i++; if (i >= S) { if (m === 0 && models === 2) { m = 1; i = 0; } else { k++; m = 0; i = 0; flash = 6; if (k >= 12) done = true; } } }
  function stop() { if (timer) clearInterval(timer); timer = null; $("#scFcPlay").textContent = "▶ Play"; }
  $("#scFcPlay").onclick = () => { if (timer) { stop(); return; } if (done) { k = 0; m = 0; i = 0; done = false; }
    $("#scFcPlay").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!slide.classList.contains("on")) { stop(); return; } for (let q = 0; q < speed; q++) tick(); if (flash > 0) flash--; render(); if (done) stop(); }, 50); };
  $("#scFcI").onclick = () => { stop(); tick(); render(); };
  $("#scFcK").onclick = () => { stop(); if (done) return; const k0 = k; while (!done && k === k0) tick(); flash = 6; render(); };
  $("#scFcR").onclick = reset;
  function code() {
    const now = mode === "now", two = models === 2;
    const L = [["mem", `<span class="k">for</span> member <span class="k">in</span> range(${Ms()}):          <span class="c"># spread over ${Gs()} GPU${Gs() > 1 ? "s" : ""}</span>`],
      ["win", now ? `  window = 6 observed frames        <span class="c"># t0−50 … t0</span>` : `  window = obs. at t0 + GFS field   <span class="c"># 1 frame</span>`],
      ["k", `  <span class="k">for</span> k <span class="k">in</span> range(12):                <span class="c"># lead: ${now ? "10 min" : "1 h"} each</span>`],
      ["x0", `    x = σ_max · noise()             <span class="c"># satellite DiT</span>`],
      ["is", `    <span class="k">for</span> i <span class="k">in</span> range(${Ss()}):             <span class="c"># σ_max → σ_min</span>`],
      ["net", `      net = coarse <span class="k">if</span> σ_i > σ_int <span class="k">else</span> fine`],
      ["sx", `      x = step(net, x, σ_i → σ_i+1 | window)`],
      ...(two ? [["y0", `    y = σ_max · noise()             <span class="c"># radar DiT, sees x</span>`],
        ["ir", `    <span class="k">for</span> i <span class="k">in</span> range(${Ss()}):`],
        ["sy", `      y = step(net_r, y, σ_i → σ_i+1 | window, x)`]] : []),
      ["out", `    save(k, x${two ? ", y" : ""})`],
      ["sl", now ? `    window = window[1:] + [x${two ? ", y" : ""}]   <span class="c"># slide</span>` : `    window = x${two ? ", y" : ""} + next GFS field`]];
    const onK = done ? [] : flash > 0 ? ["out", "sl"] : m === 0 ? (i === 0 ? ["x0", "net", "sx"] : ["net", "sx"]) : (i === 0 ? ["y0", "sy"] : ["sy"]);
    const ctx = done ? [] : ["mem", "k", m === 0 ? "is" : "ir"];
    $("#scFcCode").innerHTML = L.map(([key, s]) => `<span class="ln${onK.includes(key) ? " on" : ctx.includes(key) ? " ctx" : ""}">${s}</span>`).join("");
  }
  function render() {
    if (css("--well") !== URkey) { UR = new Map(); URkey = css("--well"); }
    const S = Ss(), sg = SC.sched(S), now = mode === "now", W = 600, svg = svgIn($("#scFcFig"), W, 252);
    const x0 = 40, cw = (W - x0 - 4) / 12, tw = cw - 5, th = tw * 4 / 7;
    txt(svg, 0, 11, "outer loop: lead steps (toy fields)", { "font-size": 11, fill: css("--muted"), "font-weight": 600 });
    txt(svg, x0 - 6, 18 + th / 2 + 4, "sat", { "font-size": 10.5, "text-anchor": "end", fill: css("--cool"), "font-weight": 600 });
    txt(svg, x0 - 6, 22 + th * 1.5 + 4, "radar", { "font-size": 10.5, "text-anchor": "end", fill: css("--lw"), "font-weight": 600 });
    const cur = (mi) => { const f = fld(k + 1), s = sg[Math.min(i, S - 1)], noisy = Float32Array.from(f, (v, q) => (mi === 0 ? 292 - 88 * v : clamp(78 * (v - .18), 0, 62)) + (mi === 0 ? 45 : 30) * Math.min(s, 3) * nz[q]);
      return SC.url(mi === 0 ? SC.paint(noisy, NX, NY, { color: SC.GRAY, lo: 300, hi: 200 }) : SC.paint(noisy, NX, NY, { color: CM.precip, lo: 0, hi: 60, mask: v => v < 5 })); };
    for (let q = 0; q < 12; q++) { const x = x0 + q * cw;
      [0, 1].forEach(mi => { const y = 18 + mi * (th + 4);
        if (mi === 1 && models === 1) { el("rect", { x, y, width: tw, height: th, rx: 2, fill: "none", stroke: css("--line"), "stroke-dasharray": "2 3" }, svg); return; }
        const fin = q < k || done, act = !done && q === k;
        if (fin) img(svg, thumb(q + 1, mi ? "r" : "s"), x, y, tw, th);
        else if (act && (mi < m || (mi === m && i > 0))) img(svg, mi < m ? thumb(q + 1, mi ? "r" : "s") : cur(mi), x, y, tw, th);
        el("rect", { x, y, width: tw, height: th, rx: 2, fill: "none", stroke: css(act && mi === m ? "--accent" : fin ? (mi ? "--lw" : "--cool") : "--line"), "stroke-width": act && mi === m ? 2.4 : 1, "stroke-dasharray": fin || act ? "" : "2 3" }, svg); });
      txt(svg, x + tw / 2, 18 + 2 * th + 18, now ? "+" + (q + 1) * 10 : "+" + (q + 1) + "h", { "font-size": 9.5, "text-anchor": "middle", class: "mono", fill: css(!done && q === k ? "--accent" : "--muted"), "font-weight": !done && q === k ? 700 : 400 }); }
    txt(svg, W - 2, 11, now ? "minutes after t0" : "hours after t0", { "font-size": 10, "text-anchor": "end", fill: css("--muted") });
    // inner loop
    const iy = 106, bw = (W - x0 - 4) / S, ki = sg.findIndex(s => s <= SC.SINT);
    txt(svg, 0, iy - 6, `inner loop: σ step ${done ? S : i + 1} of ${S} · ${done ? "done" : m === 0 ? "satellite DiT" : "radar DiT"}`, { "font-size": 11, fill: css("--muted"), "font-weight": 600 });
    for (let q = 0; q < S; q++) { const fine = sg[q] <= SC.SINT, past = done || q < i, isCur = !done && q === i;
      el("rect", { x: x0 + q * bw + .3, y: iy + (isCur ? 0 : 4), width: Math.max(.8, bw - .6), height: isCur ? 26 : 18, fill: css(isCur ? "--accent" : fine ? "--data" : "--sw"), opacity: isCur ? 1 : past ? .9 : .22 }, svg); }
    el("line", { x1: x0 + ki * bw, x2: x0 + ki * bw, y1: iy - 2, y2: iy + 30, stroke: css("--fg"), "stroke-dasharray": "3 2" }, svg);
    txt(svg, x0, iy + 40, "σ_{max} = 80", { "font-size": 10, class: "mono", fill: css("--muted") });
    txt(svg, x0 + ki * bw, iy + 40, "σ_{int}: coarse → fine", { "font-size": 10, "text-anchor": "middle", fill: css("--fg") });
    txt(svg, W - 4, iy + 40, "σ_{min} = 0.002", { "font-size": 10, class: "mono", "text-anchor": "end", fill: css("--muted") });
    txt(svg, x0 - 6, iy + 16, "σ", { "font-size": 12, "font-style": "italic", "text-anchor": "end", fill: css("--muted") });
    // window
    const wy = 176; txt(svg, 0, wy - 6, "the window: inputs of the next lead step", { "font-size": 11, fill: css("--muted"), "font-weight": 600 });
    const ww = 66, wh = ww * 4 / 7;
    if (now) for (let j = 0; j < 6; j++) { const lead = k - 5 + j, x = x0 + j * (ww + 10), obs = lead <= 0;
      img(svg, obs ? SC.url(SC.irPaint(fld(lead))) : thumb(lead, "s"), x, wy, ww, wh);
      el("rect", { x, y: wy, width: ww, height: wh, rx: 2, fill: "none", stroke: css(obs ? "--fg" : "--accent"), "stroke-width": 2 }, svg);
      txt(svg, x + ww / 2, wy + wh + 13, (obs ? "obs " : "fcst ") + (lead === 0 ? "t0" : (lead > 0 ? "+" : "−") + Math.abs(lead) * 10), { "font-size": 10, "text-anchor": "middle", fill: css(obs ? "--fg" : "--accent"), "font-weight": 600 }); }
    else { const x = x0; img(svg, k === 0 ? SC.url(SC.irPaint(fld(0))) : thumb(k, "s"), x, wy, ww, wh); el("rect", { x, y: wy, width: ww, height: wh, rx: 2, fill: "none", stroke: css(k === 0 ? "--fg" : "--accent"), "stroke-width": 2 }, svg);
      txt(svg, x + ww / 2, wy + wh + 13, k === 0 ? "obs t0" : "fcst +" + k + "h", { "font-size": 10, "text-anchor": "middle", "font-weight": 600, fill: css(k === 0 ? "--fg" : "--accent") });
      el("rect", { x: x + ww + 10, y: wy, width: ww, height: wh, rx: 2, fill: css("--muted"), "fill-opacity": .18, stroke: css("--muted"), "stroke-width": 2 }, svg);
      txt(svg, x + ww * 1.5 + 10, wy + wh / 2 + 4, "GFS", { "font-size": 12, "text-anchor": "middle", "font-weight": 700, fill: css("--muted") });
      txt(svg, x + ww * 1.5 + 10, wy + wh + 13, "Z500 / sim. refl.", { "font-size": 10, "text-anchor": "middle", fill: css("--muted") });
      txt(svg, x + 2 * ww + 30, wy + 16, "nearcast: one frame 1 h back", { "font-size": 10.5, fill: css("--muted") }); txt(svg, x + 2 * ww + 30, wy + 31, "+ one GFS channel (§4.2.1)", { "font-size": 10.5, fill: css("--muted") }); }
    code();
    // counters
    const per = 12 * models * S, nfe = done ? per : (k * models + m) * S + i, tcall = .33, M = Ms(), G = Gs(), mem = per * tcall, wall = Math.ceil(M / G) * mem;
    const mm = s => s < 60 ? fmt(s, 0) + " s" : s < 7200 ? fmt(s / 60, 1) + " min" : fmt(s / 3600, 1) + " h";
    $("#scFcRead").innerHTML = `<div><span>Lead step</span><b>${Math.min(k + (done ? 0 : 1), 12)}/12</b></div><div><span>Calls · member</span><b class="c-data">${fmtN(nfe)}/${fmtN(per)}</b></div><div><span>GPU time · member</span><b class="c-data">${mm(nfe * tcall)}/${mm(mem)}</b></div><div><span>${M} member${M > 1 ? "s" : ""}, ${G} GPU${G > 1 ? "s" : ""}</span><b class="${wall <= 600 ? "c-ok" : "c-lw"}">${mm(wall)}</b></div><div><span>GPU-hours</span><b class="c-arch">${fmt(M * mem / 3600, M * mem / 3600 < 10 ? 2 : 0)}</b></div>`;
  }
  render(); return render;
});

/* ───────── 5 · global or limited area: an open-boundary toy ───────── */
demo("sc-domain", slide => {
  const DOM = { conus: [5376, 3072, "CONUS 512 × 896 · 3,072 × 5,376 km"], col: [2400, 1800, "Colombia toy 300 × 400 · 1,800 × 2,400 km"], small: [768, 768, "small 128 × 128 · 768 × 768 km"] };
  let dom = "conus", timer = null;
  chips($("#scDoDom"), v => { dom = v; render(); });
  const Us = slider("scDoU", v => v + " m/s", render), As = slider("scDoA", v => ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"][Math.round(v / 22.5) % 16] + " (" + v + "°)", render);
  const Ts = slider("scDoT", v => fmt(v, 1) + " h", render);
  const PTS = new Map();
  const pts = () => { if (PTS.has(dom)) return PTS.get(dom); const [W, H] = DOM[dom], r = rng(dom.length * 97 + 3), X = W / 2 + 4200, Y = H / 2 + 3000, a = [];
    for (let q = 0; q < 900; q++) a.push([(2 * r() - 1) * X, (2 * r() - 1) * Y]); PTS.set(dom, a); return a; };
  function stop() { if (timer) clearInterval(timer); timer = null; $("#scDoPlay").textContent = "▶ Play"; }
  $("#scDoPlay").onclick = () => { if (timer) { stop(); return; } const R = $("#scDoT"); if (+R.value >= 12) R.value = 0; $("#scDoPlay").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!slide.classList.contains("on") || +R.value >= 12) { stop(); return; } R.value = Math.min(12, +R.value + .1); R.dispatchEvent(new Event("input")); }, 40); };
  function render() {
    const [W, H] = DOM[dom], Vw = 600, Vh = 300, s = Math.min(370 / W, 196 / H), cx = Vw / 2, cy = Vh / 2 + 6;
    const U = Us() * 3.6, th = (As() + 180) * Math.PI / 180, u = U * Math.sin(th), v = U * Math.cos(th), T = Ts(), Dx = u * T, Dy = v * T;
    const svg = svgIn($("#scDoMap"), Vw, Vh); arrowDefs(svg, "scDoMk", css("--fg"));
    const X = x => cx + x * s, Y = y => cy - y * s;
    el("rect", { x: 0, y: 0, width: Vw, height: Vh, rx: 8, fill: css("--well") }, svg);
    // domain and trustworthy interior
    el("rect", { x: X(-W / 2), y: Y(H / 2), width: W * s, height: H * s, fill: css("--lw"), "fill-opacity": .3 }, svg);
    const tx0 = Math.max(-W / 2, -W / 2 + Dx), tx1 = Math.min(W / 2, W / 2 + Dx), ty0 = Math.max(-H / 2, -H / 2 + Dy), ty1 = Math.min(H / 2, H / 2 + Dy);
    const frac = Math.max(0, tx1 - tx0) * Math.max(0, ty1 - ty0) / (W * H);
    if (frac > 0) { el("rect", { x: X(tx0), y: Y(ty1), width: (tx1 - tx0) * s, height: (ty1 - ty0) * s, fill: css("--bg") }, svg); el("rect", { x: X(tx0), y: Y(ty1), width: (tx1 - tx0) * s, height: (ty1 - ty0) * s, fill: css("--ok"), "fill-opacity": .16, stroke: css("--ok"), "stroke-width": 1.5, "stroke-dasharray": "5 3" }, svg); }
    el("rect", { x: X(-W / 2), y: Y(H / 2), width: W * s, height: H * s, fill: "none", stroke: css("--fg"), "stroke-width": 2.4 }, svg);
    // storms
    let inSeen = 0, inNew = 0;
    pts().forEach(([px, py]) => { const qx = px + Dx, qy = py + Dy, inside = Math.abs(qx) <= W / 2 && Math.abs(qy) <= H / 2, started = Math.abs(px) <= W / 2 && Math.abs(py) <= H / 2;
      if (X(qx) < -4 || X(qx) > Vw + 4 || Y(qy) < -4 || Y(qy) > Vh + 4) return;
      if (inside && started) inSeen++; if (inside && !started) inNew++;
      if (inside && T > 0) el("line", { x1: X(px), y1: Y(py), x2: X(qx), y2: Y(qy), stroke: css(started ? "--cool" : "--lw"), "stroke-width": 1, opacity: .35 }, svg);
      el("circle", { cx: X(qx), cy: Y(qy), r: inside ? (started ? 3.2 : 4) : 2.4, fill: css(inside ? (started ? "--cool" : "--lw") : "--muted"), opacity: inside ? .95 : .4, stroke: inside && !started ? css("--card") : "none", "stroke-width": 1 }, svg); });
    // labels: wind arrow, scale bar, domain name
    const ax = 52, ay = 46, al = 30;
    el("circle", { cx: ax, cy: ay, r: 34, fill: css("--card"), stroke: css("--line") }, svg);
    if (U > 0) el("line", { x1: ax - al * Math.sin(th) * .8, y1: ay + al * Math.cos(th) * .8, x2: ax + al * Math.sin(th) * .8, y2: ay - al * Math.cos(th) * .8, stroke: css("--fg"), "stroke-width": 2.5, "marker-end": "url(#scDoMk)" }, svg);
    SC.txt(svg, ax, ay + 48, "storm motion", { "font-size": 10.5, "text-anchor": "middle", fill: css("--muted") });
    const sb = 1000 * s; el("line", { x1: Vw - 20 - sb, x2: Vw - 20, y1: Vh - 14, y2: Vh - 14, stroke: css("--fg"), "stroke-width": 3 }, svg);
    SC.txt(svg, Vw - 20 - sb / 2, Vh - 20, "1,000 km", { "font-size": 10.5, "text-anchor": "middle" });
    SC.txt(svg, X(-W / 2) + 4, Y(H / 2) - 6, DOM[dom][2], { "font-size": 11, "font-weight": 600 });
    if (U > 0 && T > 0) { const ex = Math.abs(u) >= Math.abs(v), side = ex ? (u > 0 ? "west" : "east") : (v > 0 ? "south" : "north"), lx = ex ? (u > 0 ? X(-W / 2) + 6 : X(W / 2) - 6) : cx, ly = ex ? cy : (v > 0 ? Y(-H / 2) - 6 : Y(H / 2) + 14);
      SC.txt(svg, lx, ly, "inflow (" + side + ")", { "font-size": 11, "font-weight": 700, fill: css("--lw"), "text-anchor": ex ? (u > 0 ? "start" : "end") : "middle", stroke: css("--card"), "stroke-width": 3, "paint-order": "stroke" }); }
    el("rect", { x: 4, y: Vh - 24, width: 300, height: 19, rx: 6, fill: css("--card"), stroke: css("--line") }, svg);
    SC.txt(svg, 12, Vh - 10, "● seen at t = 0   ● entered later   ● outside the box", { "font-size": 10.5, fill: css("--muted") });
    const lg = svg.lastChild; lg.innerHTML = `<tspan fill="${css("--cool")}">●</tspan> seen at t = 0  <tspan fill="${css("--lw")}">●</tspan> entered later  <tspan fill="${css("--muted")}">●</tspan> outside the box`;
    $("#scDoRead").innerHTML = `<div><span>Moved by</span><b>${fmtN(U * T)} km</b></div><div><span>Trustworthy area</span><b class="${frac > .7 ? "c-ok" : "c-lw"}">${fmt(100 * frac, 0)} %</b></div><div><span>Storms in box: entered</span><b class="c-lw">${inNew} / ${inNew + inSeen}</b></div>`;
  }
  render(); return render;
});

/* ───────── 6 · another region, and Colombia ───────── */
demo("sc-region", () => {
  const OPT = [
    { k: "a", t: "(a) Retrain on a new box", tags: [["p", "paper"], ["e", "Earth2Studio"]], p: "Same network, new data: geostationary imagery over the new box (+ radar where it exists, + Z500 for nearcasts), retrain each model. The backbone needs only the satellite (§4.2.1). Earth2Studio already has a Europe variant on Meteosat Third Generation imagery (StormScopeMeteosatEU)." },
    { k: "b", t: "(b) Grow the box, up to a full disk", tags: [["p", "paper §6.2"]], p: "Domain parallelism splits the grid over GPUs; only neighborhood attention exchanges a halo. Shown for 3 km CONUS (1792 × 1024, ~87.5 % efficiency); it scales \"to larger domains including full disk forecasts\". Adding the upwind Amazon and Caribbean costs GPUs, not a new method." },
    { k: "c", t: "(c) Crop the released CONUS model", tags: [["o", "our reasoning"], ["u", "untested"]], p: "The layers would run on any grid with sides that are multiples of 4 and ≥ 31 tokens (124 cells). But the weights learned CONUS lat/lon, terrain, climate and viewing angles; Colombian inputs (−4 to 13° N) lie outside all it saw. Fine-tune or retrain instead." },
    { k: "d", t: "(d) What a Colombian model would need", tags: [["o", "our checklist"]], p: "GOES-East ABI archive (Colombia is near its 75.2° W sub-point); IDEAM radar where it covers, else satellite only (§4.2.1); ERA5 Z500 to train, GFS or an AI global model to run (§4.2.1); a verification set (stations, radar, satellite rain); ~32 H100 × 48 h per model at CONUS size (§4.2.2), less for a smaller box." }];
  let sel = "a";
  const host = $("#scRgOpt");
  host.innerHTML = OPT.map(o => `<div class="card scopt" data-k="${o.k}" role="button" tabindex="0" aria-pressed="${o.k === sel}"><h4>${o.tags.map(([c, s]) => SC.tag(c, s)).join("")}${o.t}</h4><p>${o.p}</p></div>`).join("");
  $$(".scopt", host).forEach(c => { const f = () => { sel = c.dataset.k; $$(".scopt", host).forEach(x => x.setAttribute("aria-pressed", x === c)); render(); }; c.addEventListener("click", f); c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }); });
  const Ws = slider("scRgW", v => fmtN(v) + " km", render), Hs = slider("scRgH", v => fmtN(v) + " km", render);
  // rough hand-drawn outline of Colombia (lon, lat)
  const COL = [[-77.9, 7.2], [-77.3, 8.6], [-76.8, 8.6], [-76.0, 9.4], [-75.6, 10.4], [-74.8, 11.0], [-74.2, 11.3], [-73.0, 11.6], [-72.2, 12.3], [-71.7, 12.4], [-71.3, 11.8], [-72.3, 11.1], [-72.9, 9.5], [-72.4, 8.0], [-72.3, 7.4], [-70.1, 7.0], [-69.4, 6.1], [-67.8, 6.2], [-67.5, 5.5], [-67.8, 4.5], [-67.3, 3.4], [-67.8, 2.0], [-66.9, 1.2], [-67.1, 1.1], [-69.8, 1.7], [-69.5, 0.7], [-70.0, -0.2], [-69.4, -1.1], [-69.9, -4.2], [-70.7, -3.8], [-72.9, -2.4], [-74.0, -1.0], [-75.3, -0.1], [-77.4, 0.8], [-78.9, 1.4], [-78.0, 2.6], [-77.2, 3.9], [-77.5, 5.6], [-77.4, 6.6]];
  const L0 = -95, L1 = -41, B0 = -9, B1 = 16, Vw = 540, Vh = 250, X = lo => (lo - L0) / (L1 - L0) * Vw, Y = la => (B1 - la) / (B1 - B0) * Vh, C = [-73.5, 4.5];
  function render() {
    const Wk = Ws(), Hk = Hs(), cols = Math.max(4, Math.round(Wk / 6 / 4) * 4), rows = Math.max(4, Math.round(Hk / 6 / 4) * 4), tc = cols / 4, tr = rows / 4, N = tc * tr, ratio = N / 28672;
    const svg = svgIn($("#scRgMap"), Vw, Vh); arrowDefs(svg, "scRgA", css("--muted"));
    el("rect", { x: 0, y: 0, width: Vw, height: Vh, rx: 8, fill: css("--well") }, svg);
    for (let lo = -90; lo <= -45; lo += 5) el("line", { x1: X(lo), x2: X(lo), y1: 0, y2: Vh, stroke: css("--line"), "stroke-width": .7 }, svg);
    for (let la = -5; la <= 15; la += 5) el("line", { x1: 0, x2: Vw, y1: Y(la), y2: Y(la), stroke: css(la === 0 ? "--muted" : "--line"), "stroke-width": la === 0 ? 1 : .7, "stroke-dasharray": la === 0 ? "4 3" : "" }, svg);
    SC.txt(svg, 4, Y(0) - 4, "equator", { "font-size": 10, fill: css("--muted") });
    el("path", { d: path(COL.map(([lo, la]) => [X(lo), Y(la)])) + "Z", fill: css("--fg"), "fill-opacity": .1, stroke: css("--fg"), "stroke-width": 1.4 }, svg);
    SC.txt(svg, X(-72.6), Y(3.2), "COLOMBIA", { "font-size": 11, "font-weight": 700, "text-anchor": "middle", fill: css("--fg"), "letter-spacing": "1" });
    [["Caribbean", -79, 14.2], ["Pacific", -86, 4], ["Amazon", -58, -6], ["Andes", -76.5, 2.2]].forEach(([s, lo, la]) => SC.txt(svg, X(lo), Y(la), s, { "font-size": 10.5, "font-style": "italic", "text-anchor": "middle", fill: css("--muted") }));
    el("circle", { cx: X(-74.07), cy: Y(4.71), r: 3.5, fill: css("--lw") }, svg); SC.txt(svg, X(-74.07) + 6, Y(4.71) + 4, "Bogotá", { "font-size": 10.5, fill: css("--lw") });
    el("path", { d: `M${X(-75.2)} ${Y(0) - 7} l6 10 h-12 z`, fill: css("--cool") }, svg); SC.txt(svg, X(-75.2) - 9, Y(0) + 14, "GOES-East sub-point 75.2° W", { "font-size": 10, fill: css("--cool"), "text-anchor": "end" });
    const dW = cols * 6 / 111.2, dH = rows * 6 / 111.2;
    if (sel === "b") { const cw = 5376 / 111.2, ch = 3072 / 111.2; el("rect", { x: X(C[0] - cw / 2), y: Y(C[1] + ch / 2), width: cw / (L1 - L0) * Vw, height: ch / (B1 - B0) * Vh, fill: "none", stroke: css("--muted"), "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
      SC.txt(svg, X(C[0] - cw / 2) + 4, Y(C[1] + ch / 2) + 13, "a CONUS-sized box (5,376 × 3,072 km), same 6 km", { "font-size": 10, fill: css("--muted") }); }
    el("rect", { x: X(C[0] - dW / 2), y: Y(C[1] + dH / 2), width: dW / (L1 - L0) * Vw, height: dH / (B1 - B0) * Vh, fill: css("--accent"), "fill-opacity": .08, stroke: css("--accent"), "stroke-width": 2.2 }, svg);
    SC.txt(svg, X(C[0] + dW / 2) - 4, Y(C[1] - dH / 2) - 5, `${rows} × ${cols} cells`, { "font-size": 11, "font-weight": 700, "text-anchor": "end", fill: css("--accent"), stroke: css("--card"), "stroke-width": 3, "paint-order": "stroke" });
    const memT = 3 + 67 * ratio, gpus = Math.ceil(memT / 80);
    if (sel === "b" && gpus > 1) for (let q = 1; q < gpus; q++) { const yq = Y(C[1] + dH / 2) + q * dH / (B1 - B0) * Vh / gpus; el("line", { x1: X(C[0] - dW / 2), x2: X(C[0] + dW / 2), y1: yq, y2: yq, stroke: css("--accent"), "stroke-width": 1.5, "stroke-dasharray": "3 3" }, svg); }
    if (sel === "c") { el("line", { x1: X(-98 + 3) + 120, x2: X(-98 + 3) + 120, y1: 40, y2: 6, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#scRgA)" }, svg);
      SC.txt(svg, X(-98 + 3) + 128, 20, "the released model learned CONUS, ≈ 21–53° N, far north of this map", { "font-size": 10.5, fill: css("--lw"), "font-weight": 600 }); }
    if (sel === "a" || sel === "d") SC.txt(svg, Vw - 6, 14, "box centred on 4.5° N, 73.5° W", { "font-size": 10, fill: css("--muted"), "text-anchor": "end" });
    const naOK = Math.min(tc, tr) >= 31;
    $("#scRgRead").innerHTML = `<div><span>Tokens</span><b>${tr} × ${tc}</b></div><div><span>vs CONUS</span><b class="c-data">${fmt(100 * ratio, 0)} %</b></div><div><span>Step time*</span><b class="c-data">${fmt(33 * ratio, ratio < .3 ? 1 : 0)} s</b></div><div><span>Train mem.*</span><b class="${gpus > 1 ? "c-lw" : "c-ok"}">${fmt(memT, 0)} GB${gpus > 1 ? " → " + gpus + " GPUs" : ""}</b></div><div><span>NA window fits</span><b class="${naOK ? "c-ok" : "c-lw"}">${naOK ? "yes" : "no: < 31"}</b></div>`;
  }
  render(); return render;
});
