/* ═════════ Earth-2 · section 5b, part A: StormScope step by step ═════════
   Pipeline, why learn from observations, the inputs, the grid, nowcast vs nearcast, the two-stage design.
   Source: Pathak et al. (NVIDIA, 2026) "Learning Accurate Storm-Scale Evolution from Observations", arXiv:2601.17268.
   Every picture is a toy built here; every number on the slides comes from the paper. All names sit in this block. */
{
  /* colours by modality: satellite, radar, NWP, StormScope model, HRRR, extrapolation, truth */
  const COL = { sat: "--cool", rad: "--lw", nwp: "--muted", mdl: "--accent", hrrr: "--sw", ext: "--data", obs: "--fg" };
  const GREY = CM.ramp(["#0b0d12", "#3a3f4a", "#8a909b", "#ffffff"]);
  const WVC = CM.ramp(["#4a2c12", "#9a6a3a", "#d9c7a6", "#f4f4f4", "#8fc1de", "#2d6fa3", "#123d6b"]);
  const SUN = CM.ramp(["#0d1030", "#2b2d6e", "#7a3f86", "#d0617a", "#f5a25d", "#fbe7a1"]);
  const IRC = CM.ramp(["#121418", "#2b2e34", "#484c53", "#6a6f77", "#8f949c", "#b6bac0", "#dfe2e6", "#86d4ef", "#3484d6", "#3bb24c", "#f1d33c"]);
  const Z5C = CM.ramp(["#3b4b6b", "#6f7f9c", "#a9b3c4", "#d9dde4", "#c9b48f", "#9c7a4c"]);
  const lutC = new Map();
  const lut = fn => { if (!lutC.has(fn)) { const L = new Uint8ClampedArray(768); for (let i = 0; i < 256; i++) L.set(CM.rgb(fn, i / 255), i * 3); lutC.set(fn, L); } return lutC.get(fn); };
  const rgbOf = tok => { const d = document.createElement("canvas").getContext("2d"); d.fillStyle = css(tok); d.fillRect(0, 0, 1, 1); return [...d.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  // a field → PNG data URL (for thumbnails inside SVG); mask(v) → paint --well
  function toURL(v, nx, ny, fn, lo, hi, mask) {
    const cv = document.createElement("canvas"); cv.width = nx; cv.height = ny;
    const g = cv.getContext("2d"), im = g.createImageData(nx, ny), L = lut(fn), w = rgbOf("--well");
    for (let k = 0; k < nx * ny; k++) { const o = k * 4; let c;
      if (mask && mask(v[k])) c = w; else { const t = Math.round(clamp((v[k] - lo) / (hi - lo), 0, 1) * 255) * 3; c = [L[t], L[t + 1], L[t + 2]]; }
      im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255; }
    g.putImageData(im, 0, 0); return cv.toDataURL();
  }

  /* ───────── small drawing helpers ───────── */
  function markers(svg, id) {
    const d = el("defs", {}, svg);
    d.innerHTML = Object.entries(COL).map(([k, tok]) => `<marker id="${id}-${k}" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0 0L8 4L0 8z" fill="${css(tok)}"/></marker>`).join("");
    return k => `url(#${id}-${k})`;
  }
  const line = (svg, d, k, M, o = {}) => el("path", Object.assign({ d, fill: "none", stroke: css(COL[k]), "stroke-width": 2, "marker-end": M(k) }, o), svg);
  const txt = (svg, x, y, s, o = {}) => el("text", Object.assign({ x, y, "font-size": 12, fill: css("--fg") }, o), svg, s);
  // a labelled box: title + sub-lines; on = highlighted stage; click makes it a button
  function box(svg, { x, y, w, h, tok, on = false, dim = false, t, s = [], fs = 14, dash = "", click = null, rx = 10 }) {
    const g = el("g", { opacity: dim ? .32 : 1 }, svg);
    el("rect", { x, y, width: w, height: h, rx, fill: on ? css(tok) : css("--card"), "fill-opacity": on ? .17 : 1, stroke: css(tok), "stroke-width": on ? 3 : 1.4, "stroke-dasharray": dash }, g);
    const top = y + h / 2 - (fs + s.length * 15) / 2 + fs - 1;
    el("text", { x: x + w / 2, y: top, "text-anchor": "middle", "font-size": fs, "font-weight": 600, fill: css(tok === "--muted" ? "--fg" : tok) }, g, t);
    s.forEach((l, i) => el("text", { x: x + w / 2, y: top + 16 + i * 15, "text-anchor": "middle", "font-size": 12, fill: css("--muted") }, g, l));
    if (click) { g.setAttribute("style", "cursor:pointer"); g.setAttribute("tabindex", 0); g.setAttribute("role", "button");
      g.addEventListener("click", click); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); } }); }
    return g;
  }
  // ◀ 1 2 3 … ▶ step control; returns {get, set}
  function stepper(host, labels, onChange) {
    host.classList.add("sa-steps");
    host.innerHTML = `<button class="btn" type="button" data-d="-1" aria-label="Previous stage">◀</button>` +
      labels.map((l, i) => `<button class="chip" type="button" data-i="${i}" title="${l}">${i + 1}</button>`).join("") +
      `<button class="btn" type="button" data-d="1" aria-label="Next stage">▶</button><span class="sa-stl"></span>`;
    let cur = 0; const chs = $$("button.chip", host);
    const set = (i, fire = true) => { cur = clamp(i, 0, labels.length - 1);
      chs.forEach((b, k) => b.setAttribute("aria-pressed", k === cur ? "true" : "false"));
      $(".sa-stl", host).textContent = labels[cur];
      host.querySelector('[data-d="-1"]').disabled = cur === 0; host.querySelector('[data-d="1"]').disabled = cur === labels.length - 1;
      if (fire) onChange(cur); };
    host.addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.disabled) return; set(b.dataset.d ? cur + +b.dataset.d : +b.dataset.i); });
    set(0, false); return { get: () => cur, set };
  }
  // horizontal colour bar with ticks (lo may be > hi for reversed scales)
  function cbar(host, fn, lo, hi, ticks, label, f = v => v) {
    const W = 520, H = 44, svg = svgIn(host, W, H), x = v => 8 + (v - lo) / (hi - lo) * (W - 16), n = 64;
    for (let i = 0; i < n; i++) el("rect", { x: 8 + i * (W - 16) / n, y: 2, width: (W - 16) / n + .6, height: 10, fill: fn((i + .5) / n) }, svg);
    ticks.forEach(v => { el("line", { x1: x(v), x2: x(v), y1: 12, y2: 16, stroke: css("--muted") }, svg);
      el("text", { x: x(v), y: 27, "text-anchor": "middle", "font-size": 11, class: "mono", fill: css("--muted") }, svg, f(v)); });
    if (label) el("text", { x: W - 8, y: 42, "text-anchor": "end", "font-size": 11, fill: css("--muted") }, svg, label);
  }
  const leadTxt = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}`;

  /* ───────── the toy storm world over a CONUS-like box ─────────
     224 × 128 cells (4:7 like the 512 × 896 grid; each toy cell ≈ 4 × 4 real 6 km pixels), lon −125…−66, lat 51…22.
     Storm cells: born at random places and times, drift east-north-east, grow and decay (sin-shaped life),
     leave a cold anvil downstream. Clouds, moisture and surface temperature make the satellite channels.   */
  const WD = (() => {
    const NX = 224, NY = 128, LON = [-125, -66], LAT = [51, 22];
    const lonOf = x => LON[0] + x / NX * (LON[1] - LON[0]), latOf = y => LAT[0] + y / NY * (LAT[1] - LAT[0]);
    const OUT = [[-124.7, 48.4], [-123.9, 46], [-124.2, 42], [-122.4, 37.2], [-120.6, 34.6], [-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.3, 27.8], [-94.5, 29.5], [-90, 29.2], [-89, 30.2], [-85, 29.7], [-83, 29], [-82.5, 27], [-81, 25.2], [-80, 26.5], [-80.5, 28.5], [-81.4, 30.7], [-79, 33.5], [-76, 35], [-76, 37], [-74, 40.5], [-70, 41.5], [-70, 43.5], [-67, 44.8], [-67.8, 47.1], [-69.2, 47.4], [-71, 45], [-75, 45], [-79, 43.3], [-83, 42], [-82.5, 45.3], [-84.5, 46.5], [-89, 48], [-95, 49], [-123, 49]];
    function inPoly(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
    const isLand = (lon, lat) => inPoly(lon, lat, OUT) || (lat > 49 && lon > -123.5) || (lat > 45 && lon > -84 && lon < -67.5) || (lat < 32.6 && lon > -117 + 1.1 * (32.6 - lat) && lon < -97.6);
    // storm cells (positions in base cells, times in hours; t = 0 is "now")
    const R = rng(2601), CELLS = [];
    while (CELLS.length < 72) { const lon = -106 + 33 * R(), lat = 27 + 20 * R(); if (!isLand(lon, lat)) continue;
      const big = CELLS.length < 5;
      CELLS.push({ id: CELLS.length, x: (lon - LON[0]) / (LON[1] - LON[0]) * NX, y: (lat - LAT[0]) / (LAT[1] - LAT[0]) * NY,
        t0: big ? -3 + 5 * R() : -4.5 + 13 * R(), L: big ? 6 + 3 * R() : 1 + 3.5 * R(), A: big ? 52 + 4 * R() : 40 + 17 * R(),
        r: big ? 4.2 + 1.6 * R() : 1.9 + 2.1 * R(), u: 1.25 + 0.35 * gauss(R), v: -0.3 + 0.2 * gauss(R), big }); }
    let LAND = null, NZ = null;
    const land = () => LAND || (LAND = Uint8Array.from({ length: NX * NY }, (_, k) => isLand(lonOf(k % NX + .5), latOf(Math.floor(k / NX) + .5)) ? 1 : 0));
    const noise = () => NZ || (NZ = [1, 2, 3].map(s => FFT.noise2(256, { beta: 3.3, seed: 70 + s })));
    const cache = new Map();
    /* fields at time t (h) on an (NX/f) × (NY/f) grid; jit > 0 perturbs cells (a toy "forecast" whose errors grow with jit) */
    function fields(t, { f = 1, jit = 0, seed = 1 } = {}) {
      const key = [t, f, jit, seed].join("|"); if (cache.has(key)) return cache.get(key);
      const nx = NX / f, ny = NY / f, n = nx * ny, dbz = new Float32Array(n), tD = new Float32Array(n), Ld = land(), N = noise();
      for (const c of CELLS) {
        let dx = 0, dy = 0, da = 1, dt = 0;
        if (jit) { const q = rng(seed * 977 + c.id * 31 + 7); dx = gauss(q) * jit * 1.1; dy = gauss(q) * jit * .7; da = 1 + .12 * jit * gauss(q); dt = .25 * jit * gauss(q); }
        const a0 = t - c.t0 - dt; if (a0 < 0 || a0 > 1.6 * c.L) continue;
        const s = a0 <= c.L ? Math.pow(Math.sin(Math.PI * a0 / c.L), .45) : 0, sa = Math.pow(Math.sin(Math.PI * a0 / (1.6 * c.L)), .6);
        const cx = (c.x + c.u * a0 + dx) / f, cy = (c.y + c.v * a0 + dy) / f, r = c.r * (.75 + .25 * s) / f, A = clamp(c.A * da, 30, 62) * s;
        if (s > 0) { const b = Math.ceil((c.big ? 4.3 : 1.3) * r) + 1;
          for (let j = Math.max(0, Math.floor(cy - b)); j <= Math.min(ny - 1, Math.ceil(cy + b)); j++)
            for (let i = Math.max(0, Math.floor(cx - b)); i <= Math.min(nx - 1, Math.ceil(cx + b)); i++) {
              const d2 = ((i + .5 - cx) ** 2 + (j + .5 - cy) ** 2) / (r * r), v = A - 28 * d2 - (c.big ? 0 : 0);
              if (v > dbz[j * nx + i]) dbz[j * nx + i] = v;
              if (c.big) { const vs = 34 * s - 9 * ((i + .5 - cx + 1.3 * r) ** 2 + (j + .5 - cy) ** 2) / (r * r * 2.2); if (vs > dbz[j * nx + i]) dbz[j * nx + i] = vs; } } }
        const ra = 1.5 * c.r * (c.big ? 1.15 : 1) / f, ax = cx + .9 * c.r / f, b2 = Math.ceil(2.6 * ra);
        for (let j = Math.max(0, Math.floor(cy - b2)); j <= Math.min(ny - 1, Math.ceil(cy + b2)); j++)
          for (let i = Math.max(0, Math.floor(ax - b2)); i <= Math.min(nx - 1, Math.ceil(ax + b2)); i++)
            tD[j * nx + i] += 2.4 * sa * Math.exp(-((i + .5 - ax) ** 2 + (j + .5 - cy) ** 2) / (ra * ra));
      }
      const tM = new Float32Array(n), tL = new Float32Array(n), m1 = new Float32Array(n), m2 = new Float32Array(n), lnd = new Uint8Array(n), lat = new Float32Array(n), lon = new Float32Array(n);
      const sh = Math.round(.8 * t);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, bi = Math.floor((i + .5) * f), bj = Math.floor((j + .5) * f), q = (bj % 256) * 256 + ((bi - sh + 512) % 256);
        lnd[k] = Ld[bj * NX + bi]; lat[k] = latOf(bj + .5); lon[k] = lonOf(bi + .5);
        tM[k] = 1.6 * clamp(N[0][q] - 1.0, 0, 2) * (lat[k] > 38 ? 1 : .4);
        tL[k] = 1.8 * clamp(N[1][q] - .35, 0, 2) * (lnd[k] ? .45 : 1.3);
        m1[k] = N[2][q]; m2[k] = .6 * N[2][q] + .4 * N[1][q]; }
      const F = { nx, ny, f, t, dbz, tD, tM, tL, m1, m2, lnd, lat, lon };
      cache.set(key, F); if (cache.size > 160) cache.delete(cache.keys().next().value);
      return F;
    }
    // cosine of the solar zenith angle (toy: summer, declination 20°)
    const cosz = (lat, lon, utc) => { const D = Math.PI / 180, dec = 20 * D, h = ((utc + lon / 15 - 12) * 15) * D; return Math.sin(lat * D) * Math.sin(dec) + Math.cos(lat * D) * Math.cos(dec) * Math.cos(h); };
    /* one input channel from the fields */
    function channel(key, F, utc = 18) {
      const n = F.nx * F.ny, o = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const eD = 1 - Math.exp(-1.6 * F.tD[k]), eM = 1 - Math.exp(-1.4 * F.tM[k]), eL = 1 - Math.exp(-1.5 * F.tL[k]), mu = cosz(F.lat[k], F.lon[k], utc), day = clamp(mu * 3, 0, 1);
        const Ts = F.lnd[k] ? (289 + 13 * day) - .45 * (F.lat[k] - 28) : 299 - .4 * (F.lat[k] - 25);
        const low = Ts * (1 - eL) + 279 * eL, mid = low * (1 - eM) + 243 * eM, ir = mid * (1 - eD) + 209 * eD;
        const sun = Math.pow(Math.max(mu, 0), .8), cA = 1 - (1 - .85 * eD) * (1 - .6 * eM) * (1 - .62 * eL);
        switch (key) {
          case "b047": o[k] = ((F.lnd[k] ? .08 : .06) * (1 - cA) + .9 * cA + .03) * sun; break;
          case "r064": o[k] = ((F.lnd[k] ? .12 : .035) * (1 - cA) + .9 * cA) * sun; break;
          case "v086": o[k] = ((F.lnd[k] ? .3 + .05 * F.m2[k] : .02) * (1 - cA) + .88 * cA) * sun; break;
          case "s390": o[k] = ir + (day > 0 ? sun * (34 * eL * (1 - eD) * (1 - eM) + 7 * eD) : -4 * eL * (1 - eD)); break;
          case "w619": { const c = 237 - 4.5 * F.m1[k]; o[k] = (c * (1 - .7 * eM)  + 238 * .7 * eM) * (1 - eD) + 209 * eD; break; }
          case "w695": { const c = 247 - 5 * F.m2[k]; o[k] = (c * (1 - eM) + 243 * eM) * (1 - eD) + 209 * eD; break; }
          case "w734": { const c = 255 - 4.5 * F.m2[k] + .18 * (Ts - 290); o[k] = ((c * (1 - .45 * eL) + 270 * .45 * eL) * (1 - eM) + 243 * eM) * (1 - eD) + 209 * eD; break; }
          case "i1035": o[k] = ir; break;
          case "mrms": o[k] = F.dbz[k]; break;
          case "cosz": o[k] = mu; break;
          case "lat": o[k] = F.lat[k]; break;
          case "lon": o[k] = F.lon[k]; break;
          case "z500": o[k] = ATM.z500(F.lon[k] + 360, F.lat[k], 60 + F.t); break;
        }
      }
      if (key === "refc") return gfsRefc(F);
      return o;
    }
    // toy "GFS simulated reflectivity": the reflectivity field smoothed (coarse model) and shifted (position error)
    function gfsRefc(F) {
      const { nx, ny } = F, Z = Float32Array.from(F.dbz, v => v > 0 ? Math.pow(10, v / 10) : 0), r = Math.max(2, Math.round(5 / F.f)), sx = Math.round(4 / F.f), sy = Math.round(-2 / F.f);
      const a = new Float32Array(nx * ny), b = new Float32Array(nx * ny), o = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, c = 0; for (let d = -r; d <= r; d++) { const ii = i + d - sx; if (ii >= 0 && ii < nx) { s += Z[j * nx + ii]; c++; } } a[j * nx + i] = c ? s / c : 0; }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, c = 0; for (let d = -r; d <= r; d++) { const jj = j + d - sy; if (jj >= 0 && jj < ny) { s += a[jj * nx + i]; c++; } } b[j * nx + i] = c ? s / c : 0; }
      for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(b);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let t = 0, n = 0; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di += r) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) { t += c[jj * nx + ii]; n++; } } b[j * nx + i] = t / n; } }
      for (let k = 0; k < nx * ny; k++) o[k] = b[k] > 1 ? 10 * Math.log10(b[k]) - 3 : 0;
      return o;
    }
    return { NX, NY, fields, channel, cosz, isLand, OUT, LON, LAT };
  })();

  // display settings per channel: colour map, range (lo may be > hi), ticks, label, mask
  const SHOW = {
    b047: { fn: GREY, lo: 0, hi: .9, ticks: [0, .2, .4, .6, .8], lab: "reflectance (toy)", f: v => fmt(v, 1) },
    r064: { fn: GREY, lo: 0, hi: .9, ticks: [0, .2, .4, .6, .8], lab: "reflectance (toy)", f: v => fmt(v, 1) },
    v086: { fn: GREY, lo: 0, hi: .9, ticks: [0, .2, .4, .6, .8], lab: "reflectance (toy)", f: v => fmt(v, 1) },
    s390: { fn: GREY, lo: 320, hi: 205, ticks: [310, 290, 270, 250, 230, 210], lab: "brightness temperature (K)", f: v => v },
    w619: { fn: WVC, lo: 262, hi: 212, ticks: [260, 250, 240, 230, 220], lab: "brightness temperature (K) · moist = cold", f: v => v },
    w695: { fn: WVC, lo: 268, hi: 212, ticks: [260, 250, 240, 230, 220], lab: "brightness temperature (K) · moist = cold", f: v => v },
    w734: { fn: WVC, lo: 275, hi: 212, ticks: [270, 260, 250, 240, 230, 220], lab: "brightness temperature (K) · moist = cold", f: v => v },
    i1035: { fn: IRC, lo: 310, hi: 200, ticks: [300, 280, 260, 235, 225, 210], lab: "brightness temperature (K) · coloured < 240 K", f: v => v },
    mrms: { fn: CM.precip, lo: 0, hi: 60, ticks: [0, 10, 20, 30, 40, 50, 60], lab: "reflectivity (dBZ)", f: v => v, mask: v => v < 5 },
    cosz: { fn: SUN, lo: -.6, hi: 1, ticks: [-.5, 0, .5, 1], lab: "cos(solar zenith angle) · < 0 = night", f: v => fmt(v, 1) },
    lat: { fn: CM.vir, lo: 22, hi: 51, ticks: [25, 30, 35, 40, 45, 50], lab: "latitude (°N)", f: v => v },
    lon: { fn: CM.vir, lo: -125, hi: -66, ticks: [-120, -110, -100, -90, -80, -70], lab: "longitude (°E)", f: v => v },
    z500: { fn: Z5C, lo: 5450, hi: 5950, ticks: [5500, 5600, 5700, 5800, 5900], lab: "Z500 (m, toy GFS)", f: v => v },
    refc: { fn: CM.precip, lo: 0, hi: 60, ticks: [0, 10, 20, 30, 40, 50, 60], lab: "simulated reflectivity (dBZ, toy GFS)", f: v => v, mask: v => v < 5 } };

  /* ═════════ slide 1 · ss-intro: the whole pipeline ═════════ */
  demo("ss-intro", () => {
    const S = [
      { t: "Observations", tok: COL.sat, b: ["A", "B"], go: [["The inputs", "sa-inputs"]],
        d: `<b class="sa-sat">GOES-16 ABI</b>: 8 channels from visible to infrared (0.47 to 10.35 µm). <b class="sa-rad">MRMS</b>: the US radar mosaic's maximum composite reflectivity (dBZ). Trained on GOES 2018–2023 and MRMS 2020–2023, tested on 2024 (Table 1, §4.1.1).` },
      { t: "Extra inputs", tok: COL.nwp, b: ["C", "D"], go: [["The inputs", "sa-inputs"], ["Two modes", "sa-modes"]],
        d: `Always: cos(solar zenith angle) and latitude/longitude maps (§4.2.2). <b>Nearcast only</b>: one GFS field, Z500 for the satellite model (ERA5 in training) and simulated composite reflectivity for the radar model (§4.1.2). This is the only physics model in the system.` },
      { t: "Common grid", tok: COL.obs, b: ["E"], go: [["The grid", "sa-grid"]],
        d: `Everything is remapped to NOAA's HRRR 3 km Lambert conformal grid and downsampled to 6 km: a 512 × 896 image per channel, one frame every 10 minutes (§4.1.1, §4.2.2).` },
      { t: "Satellite DiT", tok: COL.mdl, b: ["F"], go: [["Images → tokens", "sb-tokens"]],
        d: `The backbone. A <b>diffusion transformer</b> (DiT): the inputs become 128 × 224 tokens of 768 numbers (4 × 4 patches), pass 16 transformer blocks with 31 × 31 neighbourhood attention (195 M parameters), and the next GOES frame is generated from noise in 100 denoising steps (§4.2.2–4.2.3). It is trained and sampled independently of radar (§4.2.1).` },
      { t: "Radar DiT", tok: COL.mdl, b: ["G"], go: [["Two stages", "sa-multi"]],
        d: `Same architecture, second stage. It is conditioned on the satellite images: observed GOES in training, the <b>satellite forecast</b> at inference (§4.1.2). Because satellite does not depend on radar, the system still works where there is no radar (§4.2.1).` },
      { t: "Forecast frames", tok: COL.sat, b: ["H", "I"], go: [["Two modes", "sa-modes"]],
        d: `<b class="sa-sat">x̃(t)</b>: all 8 GOES channels; <b class="sa-rad">ỹ(t)</b>: composite reflectivity. The nowcast step is 10 min (to 2 h), the nearcast step 1 h (to 12 h) (Table 2).` },
      { t: "Sliding window", tok: COL.mdl, b: ["J"], go: [["Two stages", "sa-multi"]],
        d: `The new frames join the input window and the oldest drops out: an <b>autoregressive</b> rollout (Fig. 11). One step takes ~33 s on one H100 (100 sampling steps, fp32), so 12 steps ≈ 7 min; satellite + radar run in sequence and take longer (§4.2.2).` },
      { t: "Ensemble", tok: COL.mdl, b: ["K"], go: [],
        d: `Diffusion starts from random noise, so each run is a different plausible future: an <b>ensemble member</b>. The paper scores 5 members against a 5-member lagged HRRR ensemble (Fig. 6a) and uses 24 members for reliability and CRPS (Figs. 8, 16).` },
      { t: "Verification", tok: COL.obs, b: ["L"], go: [["Why observations?", "sa-why"]],
        d: `Test year 2024. Nearcast vs <b style="color:var(--sw)">HRRR</b>: 360 initialisations, FSS and CRPS (§2.2.1). Nowcast vs <b style="color:var(--data)">pySTEPS</b> extrapolation: 250 strong-rain cases, FSS at 40 dBZ and storm-object scores (§2.2.2).` }];
    let cur = 0; const st = stepper($("#saPipeSt"), S.map(s => s.t), i => { cur = i; render(); });
    const pick = i => st.set(i);
    function render() {
      const W = 1000, H = 292, svg = svgIn($("#saPipe"), W, H), M = markers(svg, "saM1"), on = k => S[cur].b.includes(k), c = k => () => pick(S.findIndex(s => s.b.includes(k)));
      // arrows first (under the boxes)
      [[39], [104], [164], [224]].forEach(([y], i) => line(svg, `M188 ${y}H219`, ["sat", "rad", "nwp", "nwp"][i], M));
      line(svg, "M366 58H397", "mdl", M); line(svg, "M366 200H397", "mdl", M);
      line(svg, "M490 110V147", "sat", M); txt(svg, 497, 134, "x̃(t)", { fill: css(COL.sat), "font-size": 13, "font-weight": 600 });
      line(svg, "M582 58H613", "sat", M); line(svg, "M582 200H613", "rad", M);
      line(svg, "M748 58H787", "mdl", M); line(svg, "M748 200C770 200 768 110 787 106", "mdl", M); line(svg, "M890 130V147", "obs", M);
      const lp = el("path", { d: "M681 237V276H293V256", fill: "none", stroke: css(COL.mdl), "stroke-width": on("J") ? 4 : 2, "stroke-dasharray": "7 5", "marker-end": M("mdl") }, svg);
      el("path", { d: "M681 237V276H293V256", fill: "none", stroke: "transparent", "stroke-width": 16, style: "cursor:pointer" }, svg).addEventListener("click", c("J"));
      txt(svg, 487, 290, "sliding window: the forecasts become the next inputs (autoregressive)", { "text-anchor": "middle", fill: css(COL.mdl), "font-size": 12.5, "font-weight": on("J") ? 700 : 500 });
      if (on("J")) lp.setAttribute("stroke-dasharray", "");
      box(svg, { x: 2, y: 8, w: 186, h: 62, tok: COL.sat, on: on("A"), t: "GOES-16 ABI", s: ["8 channels · visible + IR"], click: c("A") });
      box(svg, { x: 2, y: 78, w: 186, h: 52, tok: COL.rad, on: on("B"), t: "MRMS radar", s: ["max composite reflectivity"], click: c("B") });
      box(svg, { x: 2, y: 138, w: 186, h: 52, tok: COL.nwp, on: on("C"), dash: "5 4", t: "GFS · nearcast only", s: ["Z500 · sim. reflectivity"], click: c("C") });
      box(svg, { x: 2, y: 198, w: 186, h: 52, tok: COL.nwp, on: on("D"), t: "Computed maps", s: ["cos solar zenith · lat · lon"], click: c("D") });
      box(svg, { x: 222, y: 8, w: 144, h: 242, tok: COL.obs, on: on("E"), t: "Common grid", s: ["HRRR Lambert", "3 km → 6 km", "", "512 × 896", "per channel", "", "every 10 min"], click: c("E") });
      box(svg, { x: 400, y: 8, w: 182, h: 102, tok: COL.mdl, on: on("F"), fs: 15, t: "Satellite DiT", s: ["diffusion transformer", "195 M parameters", "backbone"], click: c("F") });
      box(svg, { x: 400, y: 150, w: 182, h: 100, tok: COL.mdl, on: on("G"), fs: 15, t: "Radar DiT", s: ["same design", "conditioned on the", "satellite forecast"], click: c("G") });
      box(svg, { x: 616, y: 23, w: 132, h: 70, tok: COL.sat, on: on("H"), fs: 16, t: "x̃(t)", s: ["GOES forecast", "8 channels"], click: c("H") });
      box(svg, { x: 616, y: 165, w: 132, h: 70, tok: COL.rad, on: on("I"), fs: 16, t: "ỹ(t)", s: ["radar forecast", "reflectivity"], click: c("I") });
      [2, 1].forEach(k => el("rect", { x: 790 + 6 * k, y: 8 + 6 * k, width: 196, height: 116, rx: 10, fill: css("--card"), stroke: css(COL.mdl), "stroke-width": 1.2, opacity: .6 }, svg));
      box(svg, { x: 790, y: 8, w: 196, h: 116, tok: COL.mdl, on: on("K"), t: "Ensemble", s: ["repeat with new noise", "→ another member", "(5 or 24 in the tests)"], click: c("K") });
      box(svg, { x: 790, y: 150, w: 200, h: 100, tok: COL.obs, on: on("L"), t: "Verification · 2024", s: ["FSS · CRPS · objects", "vs HRRR (nearcast)", "vs pySTEPS (nowcast)"], click: c("L") });
      const s = S[cur];
      $("#saPipeCard").innerHTML = `<h4 style="color:var(${s.tok === COL.nwp ? "--fg" : s.tok})">${cur + 1} · ${s.t}</h4><p>${s.d}</p>` +
        (s.go.length ? `<div class="chips">${s.go.map(([n, id]) => `<button class="chip" type="button" data-go="${id}">${n} →</button>`).join("")}</div>` : "");
    }
    render(); return render;
  });

  /* ═════════ slide 2 · sa-why: the gap and the problems of storm-scale data assimilation ═════════ */
  demo("sa-why", () => {
    const P = [
      { t: "Sparse observations", hi: [0, 1],
        d: "Direct observations are sparse compared with the scales of storms, so a km-scale analysis must fill most of the 3-D state from the model's prior (§1).",
        ss: "StormScope does not build a 3-D state: it works with the images that exist." },
      { t: "Radar is indirect", hi: [0, 1],
        d: "Radar sees echoes from rain and hail (reflectivity), not the wind, temperature and humidity that a model state is made of (§1).",
        ss: "StormScope predicts reflectivity itself, in the radar's own units." },
      { t: "Satellite IR: loose, clear-sky", hi: [0, 1],
        d: "High-resolution geostationary imagers constrain 3-D temperature and humidity only loosely (compared with hyperspectral polar orbiters) and only in clear sky (§1).",
        ss: "For StormScope a cloudy pixel is information, not a gap; it still sees only what the imager sees." },
      { t: "Errors saturate in hours", hi: [3, 4],
        d: "At convective scales errors grow and saturate within hours (§1, ref. 9), so every hour spent assimilating and adjusting is a large part of the useful forecast.",
        ss: "StormScope inherits this limit: by 6–12 h only the large scales match (Fig. 1). Its answer is an ensemble." },
      { t: "Initial shock, spin-up", hi: [2, 3],
        d: "Observation-derived fields do not fit the model's discretised equations, so the model feels an initial shock. At synoptic scales it projects onto fast gravity waves that die out early; at convective scales there is no such separation and error growth is aliased with spin-up (§1).",
        ss: "StormScope has no equations to fit: the first step starts from the observed frames." },
      { t: "The start is filtered", hi: [1, 2],
        d: "So convective-scale systems filter the analysis strongly (e.g. a digital filter, ref. 10): the forecast does not start from the best estimate of now. NOAA publishes state estimates and forecasts as separate products (§1, refs. 5, 11).",
        ss: "StormScope starts from the latest images and can be re-run every few minutes, as new GOES and radar data arrive every 2–4 min (§4.2.1)." }];
    let sel = 0;
    $("#saDA").innerHTML = P.map((p, i) => `<button class="chip" type="button" data-v="${i}"${i ? "" : ' aria-pressed="true"'}>${i + 1} · ${p.t}</button>`).join("");
    chips($("#saDA"), v => { sel = +v; render(); });
    const lead = slider("saLead", v => leadTxt(v * 10), render);
    const sk = { ss: t => .2 + .66 * Math.exp(-t / 3.2), nwp: t => .55 * (1 - .45 * Math.exp(-t / .8)) * Math.exp(-t / 14), ext: t => .86 * Math.exp(-Math.pow(t / 1.2, 1.3)) };
    function leadMsg(h) {
      if (h <= 1 / 3) return "<b>0–20 min.</b> At 40 dBZ with a 6 km window, StormScope, pySTEPS and HRRR all have comparable but low FSS; at the 18 and 30 km windows StormScope pulls clearly ahead of pySTEPS after about 20 min (Fig. 9; 250 strong-rain cases, winter–spring 2024).";
      if (h <= 1) return "<b>20 min – 1 h.</b> FSS at 40 dBZ above pySTEPS and HRRR, most clearly at the largest window (Fig. 9). Storm objects (≥ 40 dBZ): higher POD and CSI and frequency bias closer to 1 than pySTEPS; success ratio not uniformly better (Fig. 10).";
      if (h <= 2) return "<b>1–2 h.</b> End of the nowcast range, where extrapolation methods \"degrade rapidly beyond 1–2 hours\" (Abstract). StormScope keeps the FSS and object-score lead over pySTEPS to 120 min (Figs. 9–10).";
      if (h <= 3) return "<b>2–3 h.</b> A single StormScope member beats HRRR in FSS at 20 dBZ / 18 km and 30 dBZ / 42 km (Fig. 6b,c; 360 initialisations in 2024) and in IR FSS at 235 K and 225 K (Fig. 7). 24-member reliability is reasonable here, though over-confident (Fig. 8).";
      if (h <= 6) return "<b>3–6 h.</b> \"Competitive skill for the first 5 hrs\" (§2.2.1). Paired FSS differences are significant at all leads (20 dBZ / 18 km) and all but 4 h (30 dBZ / 42 km) (Figs. 12–13). 5-member CRPS beats the 5-member lagged HRRR ensemble (Fig. 6a).";
      return "<b>6–12 h.</b> Only the large scales stay coherent with the observations; small-scale memory is lost and members differ in their convection (Fig. 1, 25 Jun 2024). Conditioning on GFS simulated reflectivity improves FSS at every lead, more at long leads (Fig. 17).";
    }
    // mini diagrams, one per problem
    const MINI = [
      svg => { const R = rng(5); el("rect", { x: 10, y: 8, width: 330, height: 150, rx: 8, fill: css("--well") }, svg);
        for (let k = 0; k < 22; k++) el("circle", { cx: 24 + 300 * R(), cy: 20 + 126 * R(), r: 3 + 8 * R(), fill: css(COL.rad), opacity: .45 }, svg);
        [[60, 40], [250, 60], [150, 135], [310, 140]].forEach(([x, y]) => el("path", { d: `M${x} ${y - 8}L${x + 7} ${y + 5}L${x - 7} ${y + 5}Z`, fill: css("--fg") }, svg));
        txt(svg, 356, 40, "● storms: a few km", { fill: css(COL.rad), "font-size": 13 }); txt(svg, 356, 66, "▲ direct observations:", { "font-size": 13 }); txt(svg, 372, 84, "far apart", { "font-size": 13 });
        txt(svg, 356, 116, "the rest of the 3-D state", { fill: css("--muted"), "font-size": 12 }); txt(svg, 356, 132, "comes from the model's prior", { fill: css("--muted"), "font-size": 12 }); },
      svg => { el("path", { d: "M30 150L46 120L62 150Z", fill: css("--muted") }, svg); el("path", { d: "M46 122L300 40L300 120Z", fill: css(COL.rad), opacity: .14 }, svg);
        el("ellipse", { cx: 280, cy: 60, rx: 70, ry: 26, fill: css("--card"), stroke: css("--muted") }, svg);
        for (let k = 0; k < 14; k++) el("line", { x1: 230 + k * 7, x2: 226 + k * 7, y1: 90 + (k % 3) * 8, y2: 100 + (k % 3) * 8, stroke: css(COL.rad), "stroke-width": 2 }, svg);
        txt(svg, 46, 30, "measures: reflectivity Z", { fill: css(COL.rad), "font-size": 13, "font-weight": 600 }); txt(svg, 46, 46, "(echo from rain, hail)", { fill: css(COL.rad), "font-size": 12 });
        txt(svg, 370, 70, "needs: u, v, w ?", { fill: css("--muted"), "font-size": 14 }); txt(svg, 370, 92, "T ?   q ?", { fill: css("--muted"), "font-size": 14 }); txt(svg, 370, 122, "→ indirect", { "font-size": 13, "font-weight": 600 }); },
      svg => { el("line", { x1: 30, x2: 30, y1: 12, y2: 150, stroke: css("--line") }, svg); txt(svg, 26, 20, "height", { "text-anchor": "end", fill: css("--muted"), "font-size": 10, transform: "rotate(-90 26 20)" });
        [[45, "6.2"], [75, "6.9"], [102, "7.3"]].forEach(([y, l], i) => { el("path", { d: `M40 150C${60 + i * 6} ${y + 40} ${90} ${y - 30} ${120 + 10 * i} ${y}C${150} ${y + 20} 120 ${y + 60} 40 ${y + 80}`, fill: css(COL.sat), opacity: .13, stroke: css(COL.sat) }, svg); txt(svg, 132 + 10 * i, y + 4, l + " µm", { fill: css(COL.sat), "font-size": 11 }); });
        txt(svg, 40, 166, "clear sky: broad, blurry layers", { "font-size": 12, fill: css("--muted") });
        el("rect", { x: 230, y: 30, width: 110, height: 34, rx: 14, fill: css("--card"), stroke: css("--muted") }, svg); txt(svg, 285, 52, "cloud top", { "text-anchor": "middle", "font-size": 12 });
        for (let k = 0; k < 9; k++) el("line", { x1: 232 + k * 12, x2: 244 + k * 12, y1: 150, y2: 70, stroke: css("--line") }, svg);
        txt(svg, 285, 112, "hidden", { "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: css("--muted") }); txt(svg, 230, 166, "cloudy: only the top", { "font-size": 12, fill: css("--muted") });
        txt(svg, 370, 70, "loose constraint on", { "font-size": 13 }); txt(svg, 370, 88, "3-D T and q", { "font-size": 13 }); txt(svg, 370, 116, "clear sky only", { "font-size": 13, "font-weight": 600 }); },
      svg => { const X = lin(0, 10, 40, 330), Y = lin(0, 1, 150, 16); el("line", { x1: 40, x2: 330, y1: 150, y2: 150, stroke: css("--line") }, svg); el("line", { x1: 40, x2: 40, y1: 12, y2: 150, stroke: css("--line") }, svg);
        el("path", { d: path(Array.from({ length: 60 }, (_, i) => [X(i / 6), Y(1 - Math.exp(-Math.pow(i / 6 / .9, 1.6)))])), fill: "none", stroke: css(COL.rad), "stroke-width": 2.5 }, svg);
        el("path", { d: path(Array.from({ length: 60 }, (_, i) => [X(i / 6), Y(.85 * (1 - Math.exp(-Math.pow(i / 6 / 7, 1.6))))])), fill: "none", stroke: css(COL.nwp), "stroke-width": 2.5, "stroke-dasharray": "6 4" }, svg);
        txt(svg, 44, 26, "error", { fill: css("--muted"), "font-size": 11 }); txt(svg, 330, 166, "lead time (schematic) →", { "text-anchor": "end", fill: css("--muted"), "font-size": 11 });
        txt(svg, 350, 40, "— convective scales:", { fill: css(COL.rad), "font-size": 13 }); txt(svg, 362, 56, "saturate within hours", { fill: css(COL.rad), "font-size": 12 });
        txt(svg, 350, 92, "- - synoptic scales:", { fill: css("--muted"), "font-size": 13 }); txt(svg, 362, 108, "grow over days", { fill: css("--muted"), "font-size": 12 }); },
      svg => { const X = lin(0, 6, 40, 330), Y = lin(-1, 1.4, 150, 16);
        el("rect", { x: X(0), y: 12, width: X(1.6) - X(0), height: 138, fill: css(COL.hrrr), opacity: .12 }, svg); txt(svg, X(.8), 26, "spin-up", { "text-anchor": "middle", fill: css(COL.hrrr), "font-size": 12, "font-weight": 600 });
        el("line", { x1: 40, x2: 330, y1: 150, y2: 150, stroke: css("--line") }, svg);
        el("path", { d: path(Array.from({ length: 160 }, (_, i) => { const t = i / 160 * 6; return [X(t), Y(.8 * (1 - Math.exp(-t / .8)) + .7 * Math.exp(-t / .5) * Math.sin(9 * t))]; })), fill: "none", stroke: css(COL.nwp), "stroke-width": 2.2 }, svg);
        el("line", { x1: 40, x2: 330, y1: Y(.8), y2: Y(.8), stroke: css("--fg"), "stroke-dasharray": "3 4" }, svg); txt(svg, 330, Y(.8) - 6, "balanced state", { "text-anchor": "end", "font-size": 11, fill: css("--muted") });
        txt(svg, 330, 166, "hours after the start (schematic) →", { "text-anchor": "end", fill: css("--muted"), "font-size": 11 });
        txt(svg, 350, 60, "initial shock:", { "font-size": 13, "font-weight": 600 }); txt(svg, 350, 78, "fields do not fit the", { "font-size": 12, fill: css("--muted") }); txt(svg, 350, 94, "model's equations", { "font-size": 12, fill: css("--muted") });
        txt(svg, 350, 122, "no clean time-scale", { "font-size": 12, fill: css("--muted") }); txt(svg, 350, 138, "separation at storm scale", { "font-size": 12, fill: css("--muted") }); },
      svg => { const X = lin(0, 1, 40, 330), Y = lin(0, 1, 150, 20), xs = Array.from({ length: 120 }, (_, i) => i / 119);
        const sharp = x => .1 + .85 * Math.exp(-(((x - .3) / .03) ** 2)) + .6 * Math.exp(-(((x - .62) / .025) ** 2)) + .45 * Math.exp(-(((x - .75) / .03) ** 2));
        const smooth = x => .1 + .32 * Math.exp(-(((x - .31) / .09) ** 2)) + .3 * Math.exp(-(((x - .68) / .12) ** 2));
        el("line", { x1: 40, x2: 330, y1: 150, y2: 150, stroke: css("--line") }, svg);
        el("path", { d: path(xs.map(x => [X(x), Y(sharp(x))])), fill: "none", stroke: css("--fg"), "stroke-width": 2.2 }, svg);
        el("path", { d: path(xs.map(x => [X(x), Y(smooth(x))])), fill: "none", stroke: css(COL.nwp), "stroke-width": 2.4, "stroke-dasharray": "6 4" }, svg);
        txt(svg, 330, 166, "distance across a storm line →", { "text-anchor": "end", fill: css("--muted"), "font-size": 11 });
        txt(svg, 350, 50, "— best estimate of now", { "font-size": 13 }); txt(svg, 362, 66, "(analysis, e.g. RTMA)", { "font-size": 12, fill: css("--muted") });
        txt(svg, 350, 100, "- - what the forecast", { "font-size": 13, fill: css("--muted") }); txt(svg, 362, 116, "starts from (filtered)", { "font-size": 12, fill: css("--muted") }); }];
    function render() {
      // the two routes
      const W = 1000, H = 126, svg = svgIn($("#saFlow"), W, H), M = markers(svg, "saM2"), hi = P[sel].hi;
      txt(svg, 0, 30, "Physics NWP", { "font-size": 13, "font-weight": 600, fill: css("--muted") }); txt(svg, 0, 46, "(HRRR-like)", { "font-size": 11, fill: css("--muted") });
      txt(svg, 0, 96, "StormScope", { "font-size": 13, "font-weight": 600, fill: css(COL.mdl) });
      const R1 = [["Observations", "sparse, indirect"], ["Data assimilation", "→ analysis"], ["Filter / balance", "digital filter"], ["NWP integration", "spin-up"], ["Forecast state", "u, v, T, q, …"], ["Simulated obs", "e.g. reflectivity"]];
      R1.forEach(([t, s], i) => { const x = 100 + i * 151; box(svg, { x, y: 6, w: 128, h: 50, tok: i === 0 ? COL.obs : COL.nwp, on: hi.includes(i), fs: 12.5, t, s: [s] });
        if (i < 5) line(svg, `M${x + 129} 31H${x + 148}`, "nwp", M); });
      box(svg, { x: 100, y: 72, w: 279, h: 48, tok: COL.sat, fs: 13, t: "GOES + MRMS images (last hour)", s: ["observations, as they are"] });
      box(svg, { x: 460, y: 72, w: 230, h: 48, tok: COL.mdl, fs: 13, on: true, t: "StormScope DiT", s: ["learned from 2018–2023 data"] });
      box(svg, { x: 768, y: 72, w: 229, h: 48, tok: COL.rad, fs: 13, t: "Future GOES + MRMS images", s: ["in the same units"] });
      line(svg, "M381 96H457", "mdl", M); line(svg, "M692 96H765", "mdl", M);
      // schematic skill
      const L = lead() / 6, xs = Array.from({ length: 121 }, (_, i) => i / 10);
      VIZ.curves($("#saSkill"), [
        { pts: xs.map(t => [t, sk.ext(t)]), col: COL.ext, label: "extrapolation (pySTEPS-like)", dash: "5 4" },
        { pts: xs.map(t => [t, sk.nwp(t)]), col: COL.hrrr, label: "NWP with spin-up (HRRR-like)" },
        { pts: xs.map(t => [t, sk.ss(t)]), col: COL.mdl, label: "StormScope", w: 3 }],
        { xr: [0, 12], yr: [0, 1], W: 460, H: 196, xt: [0, 2, 4, 6, 8, 10, 12], yt: [0, 1], xf: v => v + " h", yf: v => v ? "high" : "low", xl: "", yl: "skill (schematic)", marks: [[L, "", COL.obs]], legendAt: "tr" });
      $("#saLeadCard").innerHTML = leadMsg(L);
      // the problem
      const fs = svgIn($("#saDAFig"), 540, 172); MINI[sel](fs);
      $("#saDAText").innerHTML = `${P[sel].d}<br><b class="sa-mdl">StormScope:</b> ${P[sel].ss}`;
    }
    render(); return render;
  });

  /* ═════════ slide 3 · sa-inputs: the 8 ABI channels on a wavelength axis + the other inputs ═════════ */
  demo("sa-inputs", () => {
    const CH = [
      { k: "b047", lam: .47, n: "Blue", lv: 2, kind: "vis", full: "Blue · visible band at 0.47 µm",
        d: "Sunlight reflected by clouds, haze, smoke and dust (air scatters blue light strongly). Clouds bright, ground dark. <b>Day only</b>: black at night. With Red and Veggie it makes the natural-colour composite of Fig. 1." },
      { k: "r064", lam: .64, n: "Red", lv: 2, kind: "vis", full: "Red · visible band at 0.64 µm",
        d: "The classic visible image: cloud texture, growing towers, outflow boundaries, all from reflected sunlight. <b>Day only.</b>" },
      { k: "v086", lam: .86, n: "Veggie", lv: 2, kind: "vis", full: "Veggie · near-IR band at 0.86 µm",
        d: "Reflected near-infrared: vegetation is bright and water very dark, so coasts and lakes stand out. <b>Day only.</b> Third channel of the natural-colour composite (Fig. 1)." },
      { k: "s390", lam: 3.9, n: "Shortwave", lv: 2, kind: "mix", full: "Shortwave window · IR band at 3.90 µm",
        d: "Emitted heat <i>plus</i>, by day, reflected sunlight. At night low cloud and fog look slightly colder than in the 10.35 µm image; by day water clouds look warm. Day and night, but with two personalities." },
      { k: "w619", lam: 6.19, n: "Upper WV", lv: 0, kind: "ir", full: "Upper-level water vapour · IR band at 6.19 µm",
        d: "Emission by water vapour high in the troposphere: moist air looks cold (bright here), dry air warm (brown). Shows jet streams and dry slots; never the ground. Day and night." },
      { k: "w695", lam: 6.95, n: "Mid WV", lv: 1, kind: "ir", full: "Mid-level water vapour · IR band at 6.95 µm",
        d: "Same idea, with the signal coming from lower, in the middle troposphere. Day and night." },
      { k: "w734", lam: 7.34, n: "Lower WV", lv: 2, kind: "ir", full: "Lower-level water vapour · IR band at 7.34 µm",
        d: "Lowest of the three water-vapour layers: low- to mid-level moisture that feeds storms; in very dry air it can almost see the surface. Day and night." },
      { k: "i1035", lam: 10.35, n: "Clean IR", lv: 2, kind: "ir", full: "Clean IR longwave window · IR band at 10.35 µm",
        d: "An atmospheric window: the surface temperature in clear sky, the cloud-top temperature in cloud. Deep convection = very cold tops (Figs. 2, 4); the paper scores it at 235 K and 225 K (Fig. 7). <b>Day and night.</b> Here tops colder than 240 K are coloured." }];
    const OT = {
      mrms: { full: "MRMS maximum composite reflectivity", mod: ["MRMS Radar", COL.rad], use: "Input, Forecast",
        d: "The Multi-Radar Multi-Sensor mosaic of US radars: the strongest echo in each column (dBZ), i.e. rain and hail, not cloud. Interpolated to the 6 km grid every 10 min (§4.1.1). Verified at 20, 30 and 40 dBZ." },
      cosz: { full: "Cosine of the solar zenith angle", mod: ["Computed", COL.nwp], use: "Input",
        d: "Computed from date, time and place (Table 1, §4.2.3). It tells the model where it is day, so visible channels that go black at night are not mistaken for clear skies, and it carries the daily cycle of convection." },
      lat: { full: "Latitude", mod: ["Computed (static)", COL.nwp], use: "Input",
        d: "A fixed map concatenated with the inputs (§4.2.2): it tells the network where each pixel is, so it can learn behaviour that depends on place (coasts, mountains, climate zones)." },
      lon: { full: "Longitude", mod: ["Computed (static)", COL.nwp], use: "Input",
        d: "Same as latitude (§4.2.2). Together with the solar zenith angle it also links local time to position." },
      z500: { full: "GFS 500 hPa geopotential height", mod: ["GFS Model", COL.nwp], use: "Input (Nearcast)",
        d: "Steering flow and the synoptic pattern for the <b>satellite</b> nearcast model. ERA5 Z500 in training, GFS forecasts at inference; 0.25° interpolated to 3 km and then 6 km (§4.1.2). The toy uses the deck's analytic Z500 field." },
      refc: { full: "GFS simulated composite reflectivity", mod: ["GFS Model", COL.nwp], use: "Input (Nearcast)",
        d: "A physics model's hint of where convection forms, for the <b>radar</b> nearcast model. GFS is issued every 6 h, so training uses analyses where available and short forecasts in between (§4.1.2). It improves FSS at all leads (Fig. 17). Toy: smoothed and shifted reflectivity." } };
    let sel = "i1035", utc = 18;
    const other = chips($("#saOther"), v => { sel = v; render(); });
    $$("#saOther button.chip").forEach(b => b.setAttribute("aria-pressed", "false"));
    chips($("#saUtc"), v => { utc = +v; render(); });
    const X = lam => 34 + (Math.log10(lam) - Math.log10(.4)) / (Math.log10(14) - Math.log10(.4)) * 930;
    function render() {
      const W = 1000, H = 178, svg = svgIn($("#saSpec"), W, H), AX = 128;
      const gd = el("defs", {}, svg); gd.innerHTML = `<linearGradient id="saRainbow" x1="0" x2="1"><stop offset="0" stop-color="#6a3db8"/><stop offset=".25" stop-color="#2f6fe0"/><stop offset=".45" stop-color="#2fae5a"/><stop offset=".65" stop-color="#e3c22c"/><stop offset=".82" stop-color="#ef7d22"/><stop offset="1" stop-color="#d0312d"/></linearGradient>`;
      el("rect", { x: X(5.8), y: 14, width: X(7.7) - X(5.8), height: AX - 14, fill: css(COL.sat), opacity: .07 }, svg);
      txt(svg, X(6.7), 10, "water-vapour absorption", { "text-anchor": "middle", "font-size": 11, fill: css("--muted") });
      el("rect", { x: X(9.6), y: 14, width: X(12.5) - X(9.6), height: AX - 14, fill: css("--ok"), opacity: .07 }, svg);
      txt(svg, X(11), 10, "atmospheric window", { "text-anchor": "middle", "font-size": 11, fill: css("--muted") });
      el("line", { x1: X(.4), x2: X(14), y1: AX, y2: AX, stroke: css("--muted"), "stroke-width": 1.5 }, svg);
      el("rect", { x: X(.4), y: AX - 4, width: X(.7) - X(.4), height: 8, fill: "url(#saRainbow)" }, svg);
      [.4, .5, .7, 1, 2, 3, 4, 5, 7, 10, 14].forEach(l => { el("line", { x1: X(l), x2: X(l), y1: AX + 4, y2: AX + 8, stroke: css("--muted") }, svg);
        txt(svg, X(l), AX + 20, l, { "text-anchor": "middle", "font-size": 11, class: "mono", fill: css("--muted") }); });
      txt(svg, 4, AX + 20, "µm", { "font-size": 11, fill: css("--muted") });
      const br = (a, b, y, s, tok) => { el("path", { d: `M${X(a)} ${y - 5}V${y}H${X(b)}V${y - 5}`, fill: "none", stroke: css(tok), "stroke-width": 1.4 }, svg); txt(svg, (X(a) + X(b)) / 2, y + 13, s, { "text-anchor": "middle", "font-size": 12, fill: css(tok), "font-weight": 600 }); };
      br(.42, 1.0, AX + 32, "reflected sunlight → day only", COL.hrrr); br(3.5, 13.5, AX + 32, "emitted heat → day and night", COL.sat);
      const lg = el("g", {}, svg);
      CH.forEach(c => { const x = X(c.lam), y = [10, 46, 82][c.lv] + 4, on = sel === c.k, w = 74, g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
        el("line", { x1: x, x2: x, y1: y + 34, y2: AX - 3, stroke: css(COL.sat), "stroke-width": on ? 2.4 : 1.2, opacity: on ? 1 : .6 }, lg);
        el("circle", { cx: x, cy: AX, r: on ? 6 : 4.5, fill: css(COL.sat) }, g);
        el("rect", { x: x - w / 2, y, width: w, height: 34, rx: 9, fill: css("--bg") }, g);
        el("rect", { x: x - w / 2, y, width: w, height: 34, rx: 9, fill: on ? css(COL.sat) : css("--card"), "fill-opacity": on ? .22 : 1, stroke: css(COL.sat), "stroke-width": on ? 2.6 : 1.2 }, g);
        txt(g, x, y + 15, c.n, { "text-anchor": "middle", "font-size": 12.5, "font-weight": 600, fill: css(c.kind === "vis" ? "--fg" : COL.sat) });
        txt(g, x, y + 29, c.lam + " µm", { "text-anchor": "middle", "font-size": 11, class: "mono", fill: css("--muted") });
        const go = () => { sel = c.k; $$("#saOther button.chip").forEach(b => b.setAttribute("aria-pressed", "false")); render(); };
        g.addEventListener("click", go); g.addEventListener("keydown", e => { if (e.key === "Enter") go(); }); });
      // card
      const c = CH.find(c => c.k === sel), o = OT[sel];
      const head = c ? [c.full, ["Satellite (GOES-16 ABI)", COL.sat], "Input, Forecast"] : [o.full, o.mod, o.use];
      $("#saInCard").innerHTML = `<h4 style="color:var(${head[1][1] === COL.nwp ? "--fg" : head[1][1]})">${head[0]}</h4>
        <p style="margin-bottom:6px"><span class="tag" style="color:var(${head[1][1]})">${head[1][0]}</span> <span class="tag">Use: ${head[2]}</span></p><p>${c ? c.d : o.d}</p>`;
      // image
      const F = WD.fields(0), v = WD.channel(sel, F, utc), D = SHOW[sel];
      const night = c && c.kind === "vis" && utc === 6;
      VIZ.raster($("#saInMap"), v, F.nx, F.ny, { color: D.fn, lo: D.lo, hi: D.hi, smooth: true, mask: D.mask || null,
        overlay: (g, sx) => { g.strokeStyle = "rgba(128,128,128,.55)"; g.lineWidth = 1.2; g.beginPath();
          WD.OUT.concat([WD.OUT[0]]).forEach(([lo, la], i) => { const px = (lo - WD.LON[0]) / (WD.LON[1] - WD.LON[0]) * F.nx * sx, py = (la - WD.LAT[0]) / (WD.LAT[1] - WD.LAT[0]) * F.ny * sx; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); } });
      cbar($("#saInBar"), D.fn, D.lo, D.hi, D.ticks, D.lab, D.f);
      $("#saInNote").innerHTML = `Toy scene at ${String(utc).padStart(2, "0")} UTC` + (night ? " · <b>night: reflected-sunlight channels see nothing</b>" : "") + (sel === "z500" || sel === "refc" ? " · nearcast only" : "") + ". Grey line: the toy US outline.";
    }
    render(); return render;
  });

  /* ═════════ slide 4 · sa-grid: GOES view → HRRR Lambert 3 km → 6 km, every 10 min; resolution toy ═════════ */
  demo("sa-grid", () => {
    const ST = [
      { t: "Geostationary view", tok: COL.sat,
        d: "GOES-16 (GOES-East) images the whole Earth disk from a fixed point over the Equator. Seen from there the US lies on the upper part of the disk and is viewed at a slant, so tall cloud tops appear displaced (<b>parallax</b>); the paper leaves this for future work (§3). Training data: GOES 2018–2023, test 2024 (§4.1.1)." },
      { t: "Remap to HRRR 3 km", tok: COL.obs,
        d: "The raw ABI pixels are remapped to the 3 km <b>Lambert conformal conic</b> grid of NOAA's HRRR model (§4.1.1): a map projection in which the US becomes a rectangle of nearly equal square cells, and forecasts sit on the same grid as the HRRR baseline. At 3 km the domain is 1792 × 1024 points (≈ 1.8 M pixels; §6.2)." },
      { t: "Downsample to 6 km", tok: COL.mdl,
        d: "For the main models the 3 km grid is downsampled to 6 km: <b>512 × 896 = 458,752 pixels</b> per channel (§4.1.1, §4.2.2). Halving the spacing would give 4× the pixels and tokens; the 3 km model needed domain parallelism over several GPUs (§6.2)." },
      { t: "Same grid, every 10 min", tok: COL.rad,
        d: "MRMS radar is interpolated to the same 6 km grid at the same 10-min cadence (§4.1.1). GFS/ERA5 fields at 0.25° are bilinearly interpolated to 3 km and then 6 km (§4.1.2). Every source is now a 512 × 896 image at the same times, so they can simply be stacked as channels." }];
    let cur = 0; const st = stepper($("#saGridSt"), ST.map(s => s.t), i => { cur = i; render(); });
    const SRC = [["GOES-16 ABI · 8 ch", COL.sat, "fixed full-disk view", "remap → HRRR 3 km Lambert → 6 km", "10 min (images every 2–4 min)", [0, 1, 2, 3]],
      ["MRMS reflectivity", COL.rad, "US radar mosaic", "interpolated to the 6 km grid", "10 min", [3]],
      ["GFS / ERA5 (nearcast)", COL.nwp, "0.25° global grid", "bilinear → 3 km → 6 km", "each 1-h step; GFS issued every 6 h", [3]],
      ["cos SZA · lat · lon", COL.nwp, "computed", "directly on the grid", "every frame", [3]]];
    function render() {
      const W = 1000, H = 206, svg = svgIn($("#saGridFig"), W, H), M = markers(svg, "saM4");
      ST.forEach((s, i) => { const x0 = i * 255, on = i === cur, g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
        el("rect", { x: x0 + 1, y: 1, width: 233, height: 204, rx: 12, fill: on ? css(s.tok) : css("--card"), "fill-opacity": on ? .1 : 1, stroke: css(on ? s.tok : "--line"), "stroke-width": on ? 2.8 : 1.2 }, g);
        txt(g, x0 + 117, 21, `${i + 1} · ${s.t}`, { "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css(on ? s.tok : "--fg") });
        g.addEventListener("click", () => st.set(i)); g.addEventListener("keydown", e => { if (e.key === "Enter") st.set(i); });
        if (i < 3) line(svg, `M${x0 + 236} 105H${x0 + 252}`, "obs", M, { "stroke-width": 1.6 }); });
      // 1: the disk seen from GOES-East, with the US
      { const cx = 100, cy = 110, r = 66, D = Math.PI / 180, g = svg;
        el("circle", { cx, cy, r, fill: css("--well"), stroke: css("--muted") }, g);
        [-60, -30, 0, 30, 60].forEach(la => el("line", { x1: cx - r * Math.cos(la * D), x2: cx + r * Math.cos(la * D), y1: cy - r * Math.sin(la * D), y2: cy - r * Math.sin(la * D), stroke: css("--line") }, g));
        [-60, -30, 30, 60].forEach(dl => el("ellipse", { cx, cy, rx: Math.abs(r * Math.sin(dl * D)), ry: r, fill: "none", stroke: css("--line") }, g));
        const pr = ([lo, la]) => [cx + r * Math.cos(la * D) * Math.sin((lo + 75.2) * D), cy - r * Math.sin(la * D)];
        el("path", { d: path(WD.OUT.map(pr)) + "Z", fill: css(COL.sat), "fill-opacity": .3, stroke: css(COL.sat), "stroke-width": 1.4 }, g);
        el("rect", { x: 186, y: 38, width: 14, height: 10, rx: 2, fill: css("--fg") }, g); el("rect", { x: 172, y: 41, width: 12, height: 4, fill: css(COL.sat) }, g); el("rect", { x: 202, y: 41, width: 12, height: 4, fill: css(COL.sat) }, g);
        el("path", { d: `M190 50L${cx + 8} ${cy - 50}M196 50L${cx + 30} ${cy - 26}`, stroke: css(COL.sat), "stroke-dasharray": "3 3", fill: "none" }, g);
        txt(g, 193, 66, "GOES-16", { "text-anchor": "middle", "font-size": 11.5, fill: css(COL.sat) });
        txt(g, 117, 196, "full disk; the US seen on a slant", { "text-anchor": "middle", "font-size": 12, fill: css("--muted") }); }
      // 2: Lambert conformal: arcs of parallels, converging meridians, square grid on top
      { const x0 = 255, cx = x0 + 117, cy = -170, g = svg;
        [250, 275, 300, 325].forEach(R => { const a = 19 * Math.PI / 180; el("path", { d: `M${cx - R * Math.sin(a)} ${cy + R * Math.cos(a)}A${R} ${R} 0 0 0 ${cx + R * Math.sin(a)} ${cy + R * Math.cos(a)}`, fill: "none", stroke: css("--muted"), opacity: .6 }, g); });
        [-20, -10, 0, 10, 20].forEach(d => { const a = d * Math.PI / 180; el("line", { x1: cx + 235 * Math.sin(a), y1: cy + 235 * Math.cos(a), x2: cx + 335 * Math.sin(a), y2: cy + 335 * Math.cos(a), stroke: css("--muted"), opacity: .6 }, g); });
        for (let i = 0; i <= 14; i++) el("line", { x1: x0 + 33 + i * 12, x2: x0 + 33 + i * 12, y1: 58, y2: 154, stroke: css("--fg"), "stroke-width": .7, opacity: .7 }, g);
        for (let j = 0; j <= 8; j++) el("line", { x1: x0 + 33, x2: x0 + 201, y1: 58 + j * 12, y2: 58 + j * 12, stroke: css("--fg"), "stroke-width": .7, opacity: .7 }, g);
        txt(g, x0 + 117, 44, "curved lat/lon → square cells", { "text-anchor": "middle", "font-size": 11.5, fill: css("--muted") });
        txt(g, x0 + 117, 176, "3 km · 1792 × 1024", { "text-anchor": "middle", "font-size": 13, class: "mono", "font-weight": 600 });
        txt(g, x0 + 117, 196, "(≈ 1.8 M pixels)", { "text-anchor": "middle", "font-size": 12, fill: css("--muted") }); }
      // 3: 2 × 2 averaging
      { const x0 = 510, R = rng(3), vals = Array.from({ length: 16 }, () => 5 + 50 * R() * R()), g = svg;
        vals.forEach((v, k) => { const i = k % 4, j = Math.floor(k / 4); el("rect", { x: x0 + 18 + i * 21, y: 60 + j * 21, width: 20, height: 20, fill: CM.precip(v / 60), stroke: css("--card") }, g); });
        line(svg, `M${x0 + 110} 102H${x0 + 132}`, "mdl", M);
        for (let J = 0; J < 2; J++) for (let I = 0; I < 2; I++) { let z = 0; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) z += Math.pow(10, vals[(2 * J + a) * 4 + 2 * I + b] / 10) / 4;
          el("rect", { x: x0 + 138 + I * 42, y: 60 + J * 42, width: 41, height: 41, fill: CM.precip(10 * Math.log10(z) / 60), stroke: css("--card") }, g); }
        txt(g, x0 + 60, 44, "3 km cells", { "text-anchor": "middle", "font-size": 11.5, fill: css("--muted") }); txt(g, x0 + 180, 44, "6 km cells", { "text-anchor": "middle", "font-size": 11.5, fill: css("--muted") });
        txt(g, x0 + 117, 176, "6 km · 512 × 896", { "text-anchor": "middle", "font-size": 13, class: "mono", "font-weight": 600, fill: css(COL.mdl) });
        txt(g, x0 + 117, 196, "458,752 pixels per channel", { "text-anchor": "middle", "font-size": 12, fill: css("--muted") }); }
      // 4: sources onto one stack of frames
      { const x0 = 765, g = svg;
        [["GOES", COL.sat, "sat", 62], ["MRMS", COL.rad, "rad", 92], ["GFS", COL.nwp, "nwp", 122]].forEach(([n, tok, k, y]) => { txt(g, x0 + 10, y + 4, n, { "font-size": 12, "font-weight": 600, fill: css(tok) }); line(svg, `M${x0 + 50} ${y}H${x0 + 94}`, k, M, { "stroke-width": 1.6 }); });
        [2, 1, 0].forEach(k => el("rect", { x: x0 + 100 + k * 16, y: 60 - k * 10, width: 92, height: 72, rx: 5, fill: css("--card"), stroke: css("--fg"), "stroke-width": k ? 1 : 1.6 }, g));
        txt(g, x0 + 146, 100, "512 × 896", { "text-anchor": "middle", "font-size": 12, class: "mono" });
        txt(g, x0 + 162, 152, "frames t−20, t−10, t", { "text-anchor": "middle", "font-size": 11, fill: css("--muted") });
        txt(g, x0 + 117, 176, "one frame every 10 min", { "text-anchor": "middle", "font-size": 13, "font-weight": 600 });
        txt(g, x0 + 117, 196, "all sources on the same grid", { "text-anchor": "middle", "font-size": 12, fill: css("--muted") }); }
      const s = ST[cur]; $("#saGridCard").innerHTML = `<h4 style="color:var(${s.tok})">${cur + 1} · ${s.t}</h4><p>${s.d}</p>`;
      $("#saSrc").innerHTML = `<tr><th>Source</th><th>Native</th><th>To the 6 km grid</th><th>Cadence</th></tr>` + SRC.map(r => { const on = r[5].includes(cur) ? ' class="on"' : "";
        return `<tr><td${on} style="color:var(${r[1] === COL.nwp ? "--fg" : r[1]});font-weight:600;font-size:12.5px">${r[0]}</td><td${on}>${r[2]}</td><td${on}>${r[3]}</td><td${on}>${r[4]}</td></tr>`; }).join("");
    }
    render(); return render;
  });

  /* ═════════ slide 5 · sa-res: what grid spacing does to a storm (toy at 1.5 km, averaged in linear Z) ═════════ */
  demo("sa-res", () => {
    const RS = [3, 6, 12, 24], res = slider("saRes", v => RS[v] + " km", render);
    const MSG = {
      3: "<b>3 km</b>: 1792 × 1024 ≈ 1.8 M pixels per channel, 4× the 6 km grid. NVIDIA trained a 3 km satellite nowcast by splitting each sample over 2 GPUs (domain parallelism, ~87.5 % scaling efficiency; §6.2).",
      6: "<b>6 km</b>: StormScope's grid. An object must cover more than 108 km², i.e. at least 3 pixels of 36 km², to count in the object scores (§2.2.2). pySTEPS could run at the radar's 1–2 km; the paper names this as a limit of its comparison (§3).",
      12: "<b>12 km</b>: 4× fewer pixels again. Small cells merge with their neighbours or fall below 40 dBZ; the squall line survives, thinner and weaker.",
      24: "<b>24 km</b>: only organised systems remain. (The toy scene on the inputs slide uses cells about this size: 224 × 128, the 6 km grid divided by 4.)" };
    // toy storm at 1.5 km over 504 × 288 km: a bowing squall line, trailing stratiform rain, a supercell, small cells
    const FX = 336, FY = 192, DX = 1.5;
    const truth = (() => { const R = rng(77), f = new Float64Array(FX * FY);
      // bowing squall line (leading edge at xl(y)) with stronger cores, trailing stratiform rain behind it
      const xl = y => 300 + 60 * Math.sin(Math.PI * y / 288), cores = Array.from({ length: 11 }, (_, k) => [14 + 26 * k + 6 * R(), 6 + 9 * R()]);
      const cells = Array.from({ length: 15 }, () => ({ x: 25 + 175 * R(), y: 15 + 258 * R(), r: 2.5 + 3 * R(), A: 42 + 10 * R() }));
      cells.push({ x: 440, y: 205, r: 11, A: 62 }, { x: 432, y: 218, r: 7, A: 50 }, { x: 452, y: 188, r: 18, A: 36 });
      for (let j = 0; j < FY; j++) for (let i = 0; i < FX; i++) { const x = (i + .5) * DX, y = (j + .5) * DX, d = x - xl(y);
        const env = Math.min(1, y / 20, (288 - y) / 20), A = 44 + Math.max(...cores.map(([yc, a]) => a * Math.exp(-(((y - yc) / 8) ** 2))));
        let v = env > 0 ? env * (A - 30 * (d / 6.5) ** 2) : -99;
        if (d < -6 && d > -80 && env > 0) v = Math.max(v, env * (31 + 3 * Math.sin(y / 17) + 2 * Math.sin(y / 7 + 1) - 16 * ((d + 40) / 36) ** 2));
        for (const c of cells) v = Math.max(v, c.A - 30 * ((x - c.x) ** 2 + (y - c.y) ** 2) / (c.r * c.r));
        f[j * FX + i] = v; }
      return f; })();
    const coarse = fac => { const nx = FX / fac, ny = FY / fac, o = new Float64Array(nx * ny);
      for (let j = 0; j < FY; j++) for (let i = 0; i < FX; i++) { const v = truth[j * FX + i]; o[Math.floor(j / fac) * nx + Math.floor(i / fac)] += (v > 0 ? Math.pow(10, v / 10) : 0) / (fac * fac); }
      return { nx, ny, v: o.map(z => z > 1 ? 10 * Math.log10(z) : 0) }; };
    const objects = (v, nx, ny, thr) => { const lab = new Int32Array(nx * ny).fill(-1), sizes = []; let n = 0;
      for (let k = 0; k < nx * ny; k++) { if (v[k] < thr || lab[k] >= 0) continue; const q = [k]; lab[k] = n; let s = 0;
        while (q.length) { const p = q.pop(); s++; const i = p % nx, j = (p - i) / nx;
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj, pp = jj * nx + ii;
            if (ii >= 0 && jj >= 0 && ii < nx && jj < ny && lab[pp] < 0 && v[pp] >= thr) { lab[pp] = n; q.push(pp); } } }
        sizes.push(s); n++; }
      return sizes; };
    function render() {
      const km = RS[res()], fac = km / DX, C = coarse(fac), D = SHOW.mrms;
      VIZ.raster($("#saResMap"), C.v, C.nx, C.ny, { color: D.fn, lo: 0, hi: 60, mask: D.mask, smooth: false, round: 6 });
      cbar($("#saResBar"), D.fn, 0, 60, D.ticks, "reflectivity (dBZ) · toy storm, 504 × 288 km");
      const sz = objects(C.v, C.nx, C.ny, 40), a = km * km, big = sz.filter(s => s * a > 108).length, mx = Math.max(...C.v);
      const all = { 3: "1024 × 1792", 6: "512 × 896", 12: "256 × 448", 24: "128 × 224" }[km];
      $("#saResRead").innerHTML = `<div><span>Whole domain</span><b class="c-arch">${all}</b></div><div><span>Peak</span><b class="c-lw">${fmt(mx, 0)} dBZ</b></div><div><span>≥ 40 dBZ, &gt; 108 km²</span><b class="c-ok">${big} object${big === 1 ? "" : "s"}</b></div><div><span>Pixel area</span><b>${a} km²</b></div>`;
      $("#saResCard").innerHTML = MSG[km];
    }
    render(); return render;
  });

  /* ═════════ slide 5 · sa-modes: which frames go in, nowcast vs nearcast ═════════ */
  demo("sa-modes", () => {
    let mode = "now";
    const step = slider("saStep", v => mode === "now" ? `${v} → +${leadTxt(v * 10)}` : `${v} → +${v} h`, render);
    chips($("#saMode"), v => { mode = v; $("#saStep").dispatchEvent(new Event("input")); });
    const T2 = [["Target timescale", "0–2 hours", "0–12 hours"], ["Primary data sources", "Geostationary sat. & radar", "Geostationary sat., radar & GFS"], ["Temporal resolution", "10 minutes", "1 hour"],
      ["NWP conditioning", "None (independent)", "Single-channel GFS"], ["Update frequency", "High (every few minutes)", "Moderate (NWP-dependent)"], ["Conditioning variable", "N/A", "Z500 (GFS) / simulated composite reflectivity (GFS)"],
      ["Input states (§4.2.3)", "6 states, 10 min apart, over the past hour", "1 state, 1 h earlier"]];
    // a stacked "tensor" glyph: n layers offset diagonally
    function tensor(svg, x, y, w, h, n, tok, { dash = "", on = false, op = 1 } = {}) { const d = n > 1 ? 2 : 0;
      for (let i = n - 1; i >= 1; i--) el("rect", { x: x + i * d, y: y - i * d, width: w, height: h, rx: 3, fill: css("--card"), stroke: css(tok), "stroke-width": .9, opacity: op * .9, "stroke-dasharray": dash }, svg);
      el("rect", { x, y, width: w, height: h, rx: 3, fill: css(tok), "fill-opacity": on ? .45 : .16, stroke: css(tok), "stroke-width": on ? 2.6 : 1.2, "stroke-dasharray": dash, opacity: op }, svg); }
    function render() {
      const now = mode === "now", k = step(), dt = now ? 10 : 60, W = 1000, H = 214, svg = svgIn($("#saTime"), W, H), M = markers(svg, "saM5");
      const t0 = now ? -66 : -100, t1 = now ? 126 : 750, X = lin(t0, t1, 112, 992), gw = now ? 30 : 36, out = k * dt;
      const win = now ? Array.from({ length: 6 }, (_, i) => (k - 6 + i) * dt) : [(k - 1) * dt];
      // rows
      txt(svg, 0, 80, "GOES · 8 ch", { "font-size": 12.5, "font-weight": 600, fill: css(COL.sat) }); txt(svg, 0, 122, "MRMS · 1 ch", { "font-size": 12.5, "font-weight": 600, fill: css(COL.rad) });
      if (!now) { txt(svg, 0, 150, "GFS · 1 ch", { "font-size": 12.5, "font-weight": 600, fill: css("--muted") }); txt(svg, 0, 163, "per model", { "font-size": 10.5, fill: css("--muted") }); }
      // axis
      const AY = 174; el("line", { x1: 112, x2: 992, y1: AY, y2: AY, stroke: css("--muted") }, svg);
      for (let t = Math.ceil(t0 / dt) * dt; t <= t1; t += dt) { const big = now ? t % 30 === 0 : t % 120 === 0;
        el("line", { x1: X(t), x2: X(t), y1: AY, y2: AY + (big ? 7 : 4), stroke: css("--muted") }, svg);
        if (big) txt(svg, X(t), AY + 17, now ? (t > 0 ? "+" : "") + t + " min" : (t > 0 ? "+" : "") + t / 60 + " h", { "text-anchor": "middle", "font-size": 11, class: "mono", fill: css("--muted") }); }
      el("line", { x1: X(0), x2: X(0), y1: 26, y2: AY + 2, stroke: css("--fg"), "stroke-dasharray": "3 3" }, svg);
      txt(svg, X(0) + 4, AY + 34, "now = last observation", { "font-size": 11.5, fill: css("--fg") });
      txt(svg, 992, AY + 34, now ? "time (minutes) →" : "time (hours) →", { "text-anchor": "end", "font-size": 11.5, fill: css("--muted") });
      // frames: observations (t ≤ 0) and forecasts (t > 0)
      const frames = now ? Array.from({ length: 18 }, (_, i) => (i - 5) * dt) : Array.from({ length: 13 }, (_, i) => i * dt);
      frames.forEach(t => { const fc = t > 0, inW = win.includes(t), isOut = t === out, later = t > out, op = later ? .25 : (inW || isOut ? 1 : .45), x = X(t) - gw / 2;
        tensor(svg, x, 62, gw, 30, 8, COL.sat, { dash: fc ? "4 3" : "", on: inW || isOut, op });
        tensor(svg, x, 108, gw, 22, 1, COL.rad, { dash: fc ? "4 3" : "", on: inW || isOut, op });
        if (isOut) { el("rect", { x: x - 6, y: 44, width: gw + 18, height: 92, rx: 8, fill: "none", stroke: css(COL.mdl), "stroke-width": 2.6 }, svg);
          txt(svg, X(t) + 3, 40, "x̃, ỹ", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: css(COL.mdl) }); } });
      if (!now) { [(k - 1) * dt].forEach(t => { const x = X(t) - gw / 2;
        el("rect", { x, y: 140, width: gw / 2 - 2, height: 20, rx: 3, fill: css("--muted"), "fill-opacity": .4, stroke: css("--muted"), "stroke-width": 2 }, svg);
        el("rect", { x: x + gw / 2 + 2, y: 140, width: gw / 2 - 2, height: 20, rx: 3, fill: css("--muted"), "fill-opacity": .4, stroke: css("--muted"), "stroke-width": 2, "stroke-dasharray": "3 2" }, svg); });
        frames.filter(t => t !== (k - 1) * dt && t < 12 * 60).forEach(t => { const x = X(t) - gw / 2; el("rect", { x, y: 140, width: gw, height: 20, rx: 3, fill: "none", stroke: css("--muted"), opacity: .35 }, svg); }); }
      // the input window bracket and the arrow to the output
      const wx0 = X(win[0]) - gw / 2 - 8, wx1 = X(win[win.length - 1]) + gw / 2 + 12, nObs = win.filter(t => t <= 0).length;
      el("rect", { x: wx0, y: 48, width: wx1 - wx0, height: now ? 88 : 118, rx: 9, fill: css(COL.mdl), "fill-opacity": .05, stroke: css(COL.mdl), "stroke-width": 1.8, "stroke-dasharray": "6 4" }, svg);
      const ox = X(out), mx = (wx1 + ox) / 2;
      line(svg, `M${(wx0 + wx1) / 2} 48C${(wx0 + wx1) / 2} 18 ${ox - 30} 14 ${ox - 4} 26`, "mdl", M, { "stroke-width": 2.2 });
      const lab = now ? `inputs for step ${k}: 6 frames (${nObs} observed, ${6 - nObs} forecast)` : `inputs for step ${k}: 1 frame (${nObs ? "observed" : "forecast"}) + GFS at +${k - 1} h`;
      const lx = clamp((wx0 + ox) / 2, 300, 700); txt(svg, lx, 12, lab, { "text-anchor": "middle", "font-size": 12.5, "font-weight": 600, fill: css(COL.mdl) });
      // legend
      txt(svg, 0, AY + 34, "solid = observed · dashed = forecast", { "font-size": 11, fill: css("--muted") });
      // table 2
      $("#saT2").innerHTML = `<tr><th></th><th class="${now ? "on" : ""}">Nowcasting</th><th class="${now ? "" : "on"}">Nearcasting</th></tr>` +
        T2.map(r => `<tr><td>${r[0]}</td><td class="${now ? "on" : ""}">${r[1]}</td><td class="${now ? "" : "on"}">${r[2]}</td></tr>`).join("");
      $("#saModeCard").innerHTML = now
        ? `<h4 class="sa-mdl">Nowcast: observations only</h4><p>Input: the last hour as <b>6 × 8 GOES channels</b> and <b>6 × 1 radar frame</b>, each 512 × 896, plus lat/lon and solar zenith. Six frames let the network see motion, growth and decay. No NWP, so a forecast can start as soon as new images arrive (every 2–4 min over the US, §4.2.1).</p>`
        : `<h4 class="sa-mdl">Nearcast: one frame + one GFS field</h4><p>Input: <b>1 × 8 GOES channels</b> and <b>1 radar frame</b> from 1 h earlier, plus <b>one</b> GFS channel at that time: Z500 for the satellite model (ERA5 in training), simulated reflectivity for the radar model (Fig. 11b). Over 12 h the synoptic state changes and storms enter the limited domain; the single channel limits NWP error and latency (§4.2.1).</p>`;
      $("#saModeRead").innerHTML = `<div><span>Lead</span><b>+${now ? leadTxt(out) : out / 60 + " h"}</b></div><div><span>Steps</span><b>${k}</b></div><div><span>Obs. in window</span><b class="c-ok">${nObs} / ${win.length}</b></div><div><span>Sat. time</span><b class="c-arch">≈ ${k * 33 >= 60 ? fmt(k * 33 / 60, 1) + " min" : k * 33 + " s"}</b></div>`;
    }
    render(); return render;
  });

  /* ═════════ slide 6 · sa-multi: satellite DiT → radar DiT, the sliding window, with toy thumbnails ═════════ */
  demo("sa-multi", slide => {
    let mode = "now", radar = true, k = 1, sub = 0, timer = null;
    const SUB = ["Satellite DiT", "Radar DiT", "Slide the window"];
    const K = () => 12, dtH = () => mode === "now" ? 1 / 6 : 1;
    // controls: ◀ [1 2 3] ▶ + step label
    const host = $("#saMSt"); host.classList.add("sa-steps");
    host.innerHTML = `<button class="btn" type="button" data-d="-1" aria-label="Previous">◀</button>` + SUB.map((s, i) => `<button class="chip" type="button" data-i="${i}">${i + 1} · ${s}</button>`).join("") + `<button class="btn" type="button" data-d="1" aria-label="Next">▶</button><span class="sa-stl"></span>`;
    const flat = () => (k - 1) * 3 + sub, setFlat = f => { f = clamp(f, 0, K() * 3 - 1); k = Math.floor(f / 3) + 1; sub = f % 3; if (!radar && sub === 1) sub = 2; render(); };
    host.addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.disabled) return; stop();
      if (b.dataset.d) { let f = flat() + +b.dataset.d; if (!radar && f % 3 === 1) f += +b.dataset.d; setFlat(f); } else { sub = +b.dataset.i; if (!radar && sub === 1) sub = 0; render(); } });
    chips($("#saMMode"), v => { mode = v; k = 1; sub = 0; stop(); render(); });
    chips($("#saRadar"), v => { radar = v === "1"; if (!radar && sub === 1) sub = 2; render(); });
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } $("#saPlay").textContent = "▶ Play"; };
    $("#saPlay").onclick = () => { if (timer) return stop(); if (flat() >= K() * 3 - 1) { k = 1; sub = 0; }
      $("#saPlay").textContent = "❚❚ Pause"; render();
      timer = setInterval(() => { if (!slide.classList.contains("on") || flat() >= K() * 3 - 1) return stop(); let f = flat() + 1; if (!radar && f % 3 === 1) f++; setFlat(f); }, 1100); };
    // thumbnails (toy): GOES clean IR, MRMS reflectivity, GFS Z500, GFS simulated reflectivity at time t (h)
    const TH = new Map();
    function thumb(row, t) {
      const fc = t > 1e-9, key = [row, fmt(t, 3), css("--well")].join("|"); if (TH.has(key)) return TH.get(key);
      const F = WD.fields(+t.toFixed(4), { jit: fc ? Math.min(t, 6) * 1.3 : 0, seed: 11 });
      const ch = row === "sat" ? "i1035" : row === "rad" ? "mrms" : row === "z5" ? "z500" : "refc", D = SHOW[ch];
      const T = row === "z5" || row === "rc" ? WD.fields(+t.toFixed(4)) : F, full = WD.channel(ch, T, 18), cx = 92, cy = 28, cw = 84, chh = 48;
      const v = new Float32Array(cw * chh); for (let j = 0; j < chh; j++) for (let i = 0; i < cw; i++) v[j * cw + i] = full[(j + cy) * T.nx + i + cx];
      let lo = D.lo, hi = D.hi; if (ch === "z500") { lo = Math.min(...v) - 10; hi = Math.max(...v) + 10; }
      const url = toURL(v, cw, chh, D.fn, lo, hi, D.mask);
      TH.set(key, url); if (TH.size > 300) TH.delete(TH.keys().next().value); return url;
    }
    function render() {
      const now = mode === "now", dt = dtH(), rows = now ? ["sat", "rad"] : ["z5", "sat", "rad", "rc"], nW = now ? 6 : 1;
      const RH = 47, TOP = 30, W = 812, H = TOP + rows.length * RH + 54, svg = svgIn($("#saMFig"), W, H), M = markers(svg, "saM6");
      const SW = 72, X0 = 84, tw = 66, th = 38, DX = X0 + 7 * SW + 10, DW = 112, OX = DX + DW + 14;
      const rowY = r => TOP + rows.indexOf(r) * RH, slotT = s => (k - 7 + s) * dt, inWin = s => s >= 7 - nW && s <= 6;
      const RN = { sat: ["GOES", "IR 10.35 µm", COL.sat], rad: ["MRMS", "reflectivity", COL.rad], z5: ["GFS Z500", "→ satellite", COL.nwp], rc: ["GFS sim. refl.", "→ radar", COL.nwp] };
      const hiSat = sub === 0, hiRad = sub === 1, hiSlide = sub === 2;
      rows.forEach(r => { const y = rowY(r), [a, b, tok] = RN[r], off = r === "rad" && !radar;
        txt(svg, 0, y + 18, a, { "font-size": 12.5, "font-weight": 600, fill: css(off ? "--muted" : tok === COL.nwp ? "--fg" : tok) }); txt(svg, 0, y + 33, off ? "no radar" : b, { "font-size": 11, fill: css("--muted") }); });
      // time labels
      for (let s = 0; s <= 6; s++) { const t = slotT(s), m = Math.round(t * 60);
        txt(svg, X0 + s * SW + tw / 2, TOP - 8, now ? (m > 0 ? "+" : m < 0 ? "−" : "") + Math.abs(m) + "′" : (m > 0 ? "+" : m < 0 ? "−" : "") + Math.abs(m / 60) + " h", { "text-anchor": "middle", "font-size": 11, class: "mono", fill: css(t > 0 ? COL.mdl : "--muted") }); }
      txt(svg, OX + tw / 2, TOP - 8, (now ? "+" + Math.round(k * dt * 60) + "′" : "+" + k + " h"), { "text-anchor": "middle", "font-size": 11.5, class: "mono", "font-weight": 700, fill: css(COL.mdl) });
      // frames
      for (let s = 0; s <= 6; s++) { const t = slotT(s), fc = t > 1e-9, w = inWin(s), dropped = s === 0 && now || (!now && s < 6);
        rows.forEach(r => { if ((r === "z5" || r === "rc") && s !== 6) return; const y = rowY(r), x = X0 + s * SW, off = r === "rad" && !radar;
          const g = el("g", { opacity: off ? .18 : w ? 1 : (s === 0 && now ? (hiSlide ? .55 : .3) : .3) }, svg);
          if (!off) el("image", { href: thumb(r, t), x, y, width: tw, height: th, preserveAspectRatio: "none" }, g); else el("rect", { x, y, width: tw, height: th, fill: css("--well") }, g);
          el("rect", { x, y, width: tw, height: th, rx: 3, fill: "none", stroke: css(fc ? COL.mdl : "--fg"), "stroke-width": fc ? 1.8 : 1, "stroke-dasharray": fc ? "4 3" : "" }, g);
          if (s === 0 && now && hiSlide) { el("path", { d: `M${x + 8} ${y + 6}L${x + tw - 8} ${y + th - 6}M${x + tw - 8} ${y + 6}L${x + 8} ${y + th - 6}`, stroke: css(COL.rad), "stroke-width": 2.2 }, svg); } }); }
      if (now) txt(svg, X0 + tw / 2, TOP + rows.length * RH + 2, hiSlide ? "dropped" : "oldest", { "text-anchor": "middle", "font-size": 11, fill: css(hiSlide ? COL.rad : "--muted"), "font-weight": hiSlide ? 700 : 400 });
      else txt(svg, X0 + 2.5 * SW + tw / 2, TOP + rows.length * RH + 2, "earlier frames: not used by the nearcast", { "text-anchor": "middle", "font-size": 11, fill: css("--muted") });
      // window bracket
      const wx0 = X0 + (7 - nW) * SW - 6, wx1 = X0 + 6 * SW + tw + 6;
      el("rect", { x: wx0, y: TOP - 4, width: wx1 - wx0, height: rows.length * RH - 6, rx: 8, fill: "none", stroke: css(COL.mdl), "stroke-width": hiSlide ? 2.8 : 1.8, "stroke-dasharray": "6 4" }, svg);
      txt(svg, (wx0 + wx1) / 2, TOP + rows.length * RH + 2, `input window · ${nW} frame${nW > 1 ? "s" : ""}`, { "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: css(COL.mdl) });
      // DiT boxes
      const satRows = now ? ["sat"] : ["z5", "sat"], radRows = now ? ["rad"] : ["rad", "rc"];
      const sy0 = rowY(satRows[0]) - 2, sy1 = rowY(satRows[satRows.length - 1]) + th + 2, ry0 = rowY(radRows[0]) + 8, ry1 = rowY(radRows[radRows.length - 1]) + th + 2;
      box(svg, { x: DX, y: sy0, w: DW, h: sy1 - sy0, tok: COL.mdl, on: hiSat, fs: 13, t: "Satellite DiT", s: now ? ["1st"] : ["1st", "Z500 + GOES"] });
      box(svg, { x: DX, y: ry0, w: DW, h: ry1 - ry0, tok: COL.mdl, on: hiRad, dim: !radar, fs: 13, t: "Radar DiT", s: now ? ["2nd"] : ["2nd", "refc + MRMS"] });
      line(svg, `M${wx1 + 1} ${rowY("sat") + th / 2}H${DX - 3}`, "sat", M, { "stroke-width": hiSat ? 3 : 1.6 });
      if (!now) line(svg, `M${X0 + 6 * SW + tw + 1} ${rowY("z5") + th / 2}H${DX - 3}`, "nwp", M, { "stroke-width": hiSat ? 2.6 : 1.4 });
      if (radar) { line(svg, `M${wx1 + 1} ${rowY("rad") + th / 2 + 4}H${DX - 3}`, "rad", M, { "stroke-width": hiRad ? 3 : 1.6 });
        if (!now) line(svg, `M${X0 + 6 * SW + tw + 1} ${rowY("rc") + th / 2}H${DX - 3}`, "nwp", M, { "stroke-width": hiRad ? 2.6 : 1.4 });
        line(svg, `M${OX + tw / 2} ${rowY("sat") + th + 2}C${OX + tw / 2} ${ry0 - 2} ${DX + DW + 10} ${ry0 - 6} ${DX + DW - 22} ${ry0 - 1}`, "sat", M, { "stroke-width": hiRad ? 3 : 1.4, "stroke-dasharray": "4 3" });
        txt(svg, OX + tw + 4, rowY("sat") + th + 16, "x̃", { "font-size": 13, "font-weight": 700, fill: css(COL.sat) }); }
      // outputs
      const outT = k * dt, showSat = true, showRad = radar && sub >= 1;
      line(svg, `M${DX + DW + 1} ${rowY("sat") + th / 2}H${OX - 3}`, "sat", M, { "stroke-width": hiSat ? 3 : 1.6 });
      if (radar) line(svg, `M${DX + DW + 1} ${rowY("rad") + th / 2 + 4}H${OX - 3}`, "rad", M, { "stroke-width": hiRad ? 3 : 1.6 });
      [["sat", showSat, "x̃(t)"], ["rad", showRad, "ỹ(t)"]].forEach(([r, show, l]) => { const y = rowY(r);
        if (show) el("image", { href: thumb(r, outT), x: OX, y, width: tw, height: th, preserveAspectRatio: "none" }, svg);
        else { el("rect", { x: OX, y, width: tw, height: th, fill: css("--well") }, svg); txt(svg, OX + tw / 2, y + th / 2 + 4, r === "rad" && !radar ? "—" : l, { "text-anchor": "middle", "font-size": 12, fill: css("--muted") }); }
        el("rect", { x: OX, y, width: tw, height: th, rx: 3, fill: "none", stroke: css(COL.mdl), "stroke-width": (r === "sat" ? hiSat : hiRad) ? 3 : 1.8, "stroke-dasharray": show ? "" : "4 3" }, svg); });
      // slide-back arrow
      const by = TOP + rows.length * RH + 18;
      line(svg, `M${OX + tw / 2} ${rowY(rows[rows.length - 1]) + th + 4}V${by + 10}H${X0 + 6 * SW + tw / 2}V${by - 4}`, "mdl", M, { "stroke-width": hiSlide ? 3.2 : 1.6, "stroke-dasharray": hiSlide ? "" : "5 4" });
      txt(svg, (X0 + 6 * SW + OX) / 2 + 30, by + 26, "the new frames join the window next step", { "text-anchor": "middle", "font-size": 11.5, fill: css(COL.mdl), "font-weight": hiSlide ? 700 : 400 });
      // controls
      $$("button.chip", host).forEach((b, i) => { b.setAttribute("aria-pressed", i === sub ? "true" : "false"); b.disabled = !radar && i === 1; });
      host.querySelector('[data-d="-1"]').disabled = flat() === 0; host.querySelector('[data-d="1"]').disabled = flat() >= K() * 3 - 1;
      $(".sa-stl", host).textContent = `step ${k} of ${K()} · lead +${now ? leadTxt(Math.round(k * dt * 60)) : k + " h"}`;
      // card
      const winT = Array.from({ length: nW }, (_, i) => (k - nW + i) * dt), nObs = winT.filter(t => t <= 1e-9).length;
      const C = [
        [`1 · Satellite DiT samples x̃(t)`, now
          ? `It reads the 6 GOES frames in the window (${nObs} observed, ${6 - nObs} its own forecasts) and generates all 8 channels of the next frame, 10 min later. It never sees radar: the satellite model is trained and sampled on its own (§4.2.1).`
          : `It reads one GOES frame and GFS Z500 from the previous hour and generates all 8 channels one hour later (Fig. 11b). It never sees radar (§4.2.1).`],
        [`2 · Radar DiT samples ỹ(t)`, `It reads the radar window${now ? "" : " and GFS simulated reflectivity"} and is conditioned on the satellite images: in training the observed ones, now the satellite <b>forecast</b> just made (§4.1.2). That is why the two models run in sequence each step (§4.2.2).`],
        [`3 · Slide the window`, now
          ? `The new pair joins the window and the oldest frame drops out. After 6 steps the window holds only forecasts: the model then feeds entirely on its own output, and small errors can grow.`
          : `The new pair becomes the single input for the next hour; GFS supplies the next Z500 and simulated reflectivity. From step 2 on, the input is a forecast.`]];
      $("#saMCard").innerHTML = `<h4 class="sa-mdl">${C[sub][0]}</h4><p>${C[sub][1]}</p>` + (!radar ? `<p style="margin:0"><b class="sa-rad">No radar:</b> the radar DiT is skipped, but the satellite forecast runs unchanged; this independence is what lets the approach work where radar is missing (§4.2.1).</p>` : "");
      $("#saMRead").innerHTML = `<div><span>Observed in window</span><b class="c-ok">${nObs} / ${nW}</b></div><div><span>DiT runs so far</span><b>${(k - 1) * (radar ? 2 : 1) + 1 + (radar && sub >= 1 ? 1 : 0)}</b></div><div><span>≈ time</span><b class="c-arch">${fmt(((k - 1) * (radar ? 2 : 1) + 1 + (radar && sub >= 1 ? 1 : 0)) * 33 / 60, 1)} min</b></div>`;
    }
    render(); return render;
  });
}
