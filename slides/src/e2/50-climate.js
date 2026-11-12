/* ═════════ Earth-2 · section 6: climate (drift, DLESyM, cBottle, huge ensembles) ═════════
   Everything sits in a block so helper names do not collide with other sections. */
{
  const DAY = 30.4375;                                   // days per month (toy calendar)
  const dots = (svg, pts, X, Y, col, r = 2.4, op = 0.85) => pts.forEach(([x, y]) => el("circle", { cx: X(x), cy: Y(y), r, fill: css(col), opacity: op }, svg));
  // step outline of a histogram for VIZ.curves: counts c over bins starting at x0 with width w
  const stepPts = (c, x0, w) => { const p = []; c.forEach((v, i) => { p.push([x0 + i * w, v]); p.push([x0 + (i + 1) * w, v]); }); return p; };

  /* ───────── opener: trajectory vs statistics, drift in a long rollout ───────── */
  demo("s-climate", slide => {
    const A = 0.98, SIG = Math.sqrt(1 - A * A), N = 20000, H0 = 4000;
    let seed = 20, view = "30", T = null, M = null, blow = -1;
    const amp = slider("clDrAmp", v => fmt(v, 2) + " %", () => { run(); render(); });
    const bias = slider("clDrBias", v => fmt(v, 3), () => { run(); render(); });
    chips($("#clDrPre"), v => { const [a, b] = v.split(",").map(Number); $("#clDrAmp").value = a; $("#clDrBias").value = b;
      ["clDrAmp", "clDrBias"].forEach(id => { const r = document.getElementById(id); r.parentElement.querySelector("output").textContent = id === "clDrAmp" ? fmt(a, 2) + " %" : fmt(b, 3); });
      run(); render(); });
    chips($("#clDrView"), v => { view = v; render(); });
    $("#clDrNew").onclick = () => { seed += 1; run(); render(); };
    function run() {
      const rt = rng(seed), rm = rng(seed + 1000), a2 = A * (1 + amp() / 100), b = bias();
      T = new Float64Array(N); M = new Float64Array(N); T[0] = M[0] = 1.2; blow = -1;
      for (let n = 1; n < N; n++) { T[n] = A * T[n - 1] + SIG * gauss(rt);
        M[n] = blow >= 0 ? NaN : a2 * M[n - 1] + b + SIG * gauss(rm);
        if (blow < 0 && Math.abs(M[n]) > 1e4) { blow = n; M[n] = NaN; } }
    }
    const runMean = (x, every) => { const p = []; let s = 0; for (let n = 0; n < N; n++) { if (!isFinite(x[n])) break; s += x[n]; if (n % every === 0 && n > 40) p.push([n / 4, s / (n + 1)]); } return p; };
    function render() {
      const days = n => n / 4, fin = (x, n0, n1, k) => { const p = []; for (let n = n0; n < n1; n += k) { if (!isFinite(x[n])) break; p.push([days(n), x[n]]); } return p; };
      if (view === "30") {
        VIZ.curves($("#clDrFig"), [{ pts: fin(T, 0, 121, 1), col: "--fg", label: "truth", w: 1.8 }, { pts: fin(M, 0, 121, 1), col: "--accent", label: "emulator", w: 1.8 }],
          { xr: [0, 30], yr: [-4, 4], xl: "days", yl: "x (sd units)", W: 520, H: 170, xt: [0, 7, 14, 21, 28], yt: [-4, -2, 0, 2, 4], xf: v => fmt(v, 0), yf: v => fmt(v, 0), legendAt: "tr" });
      } else {
        const C = VIZ.curves($("#clDrFig"), [{ pts: fin(T, 0, N, 12), col: "--fg", w: .7, op: .25 }, { pts: fin(M, 0, N, 12), col: "--accent", w: .7, op: .28 },
          { pts: runMean(T, 40), col: "--fg", label: "truth, running mean", w: 2.4 }, { pts: runMean(M, 40), col: "--accent", label: "emulator, running mean", w: 2.4 }],
          { xr: [0, N / 4], yr: [-4, 4], xl: "years", yl: "x (sd units)", W: 520, H: 170, xt: [0, 2, 4, 6, 8, 10, 12].map(y => y * 365.25), yt: [-4, -2, 0, 2, 4], xf: v => fmt(v / 365.25, 0), yf: v => fmt(v, 0), legendAt: "bl",
            marks: blow >= 0 ? [[blow / 4, "blew up", "--lw"]] : [] });
      }
      // histograms of the second half
      const lo = -5, w = 0.25, nb = 40, ht = new Array(nb).fill(0), hm = new Array(nb).fill(0); let out = 0, nm = 0;
      for (let n = H0; n < N; n++) { ht[clamp(Math.floor((T[n] - lo) / w), 0, nb - 1)]++;
        if (isFinite(M[n])) { const k = Math.floor((M[n] - lo) / w); if (k < 0 || k >= nb) out++; else hm[k]++; nm++; } }
      const mx = Math.max(...ht, ...hm) * 1.12;
      VIZ.curves($("#clDrHist"), [{ pts: stepPts(ht, lo, w), col: "--fg", label: "truth", w: 2 }, { pts: stepPts(hm, lo, w), col: "--accent", label: blow >= 0 ? "emulator (blew up)" : "emulator", w: 2 }],
        { xr: [lo, -lo], yr: [0, mx], xl: "x", W: 520, H: 105, xt: [-4, -2, 0, 2, 4], yt: [0], xf: v => fmt(v, 0), yf: () => "", legendAt: "tr" });
      const half = x => Array.from(x.slice(H0)).filter(isFinite), mT = half(T), mM = half(M), a2 = A * (1 + amp() / 100);
      const relax = a2 < 1 ? 1 / (1 - a2) / 4 : Infinity;
      const mm = mM.length ? mean(mM) : NaN, sm = mM.length ? sd(mM) : NaN, off = blow >= 0 || Math.abs(mm) > 0.3 || sm > 1.25;
      $("#clDrRead").innerHTML = `<div><span>Truth mean · sd</span><b style="color:var(--fg)">${fmt(mean(mT), 2)} · ${fmt(sd(mT), 2)}</b></div>` +
        `<div><span>Emulator mean · sd</span><b class="${off ? "c-lw" : "c-ok"}">${blow >= 0 ? "blew up" : fmt(mm, 2) + " · " + fmt(sm, 2)}</b></div>` +
        `<div><span>Memory 1/(1 − a′)</span><b>${isFinite(relax) ? fmtN(relax) + " d" : "∞"}</b></div>`;
    }
    run(); render(); return render;
  });

  /* ───────── DLESyM: a fast atmosphere and a slow ocean with different clocks ───────── */
  demo("cl-dlesym", slide => {
    const MON = 1024, cache = new Map();
    let mode = 2, ms = 0;
    chips($("#clDlMode"), v => { mode = +v; render(); });
    const fb = slider("clDlFb", v => fmt(v, 2) + "×", render);
    // atmosphere: 6-h steps, memory 2 days; ocean: 48-h steps; exchange every 4 days (16 + 2 steps per window)
    function sim(mode, fb, seed = 3) {
      const key = mode + ":" + fb; if (cache.has(key)) return cache.get(key);
      const t0 = performance.now(), r = rng(seed), phi = Math.exp(-0.25 / 2), s = Math.sqrt(1 - phi * phi);
      const R0 = -1 / 60, F = 2 * Math.PI / (4 * 365), eps = 0.0005, mu = 0.03, g = 0.62 * fb, kap = 0.002;
      let u = 0, T = 0, h = 0; const out = new Float64Array(MON), cnt = new Float64Array(MON);
      for (let d = 0; d < MON * DAY; d += 4) {
        let ub = 0; const gT = mode === 2 ? g * T : 0;                       // the atmosphere sees the SST of the last exchange
        for (let k = 0; k < 16; k++) { u = phi * u + (1 - phi) * gT + s * gauss(r); ub += u / 16; }
        if (mode > 0) for (let k = 0; k < 2; k++) { const dT = R0 * T + mu * ub + F * h - kap * T * T * T, dh = -eps * h - F * T; T += 2 * dT; h += 2 * dh; }
        const m = Math.min(MON - 1, Math.floor(d / DAY)); out[m] += T; cnt[m]++;
      }
      for (let m = 0; m < MON; m++) out[m] /= cnt[m] || 1;
      const res = { x: out, ms: performance.now() - t0 }; cache.set(key, res); return res;
    }
    function spectrum(x) {
      const n = x.length, m = mean(x), re = Float64Array.from(x, v => v - m), im = new Float64Array(n); FFT.fft(re, im);
      const P = []; for (let k = 1; k < n / 2; k++) P.push(2 * (re[k] ** 2 + im[k] ** 2) / (n * n));
      const S = P.map((_, i) => { let s = 0, c = 0; for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < P.length) { s += P[j]; c++; } return s / c; });
      return S.map((p, i) => [n / (i + 1) / 12, p]);                     // [period in years, variance per bin]
    }
    function timeline() {
      const W = 470, H = 92, x = lin(0, 8, 92, W - 10), svg = svgIn($("#clDlTime"), W, H);
      el("text", { x: 0, y: 26, "font-size": 12, "font-weight": 600, fill: css("--ok") }, svg, "Atmosphere");
      el("text", { x: 0, y: 58, "font-size": 12, "font-weight": 600, fill: css("--cool") }, svg, "Ocean (SST)");
      for (let i = 0; i <= 32; i++) el("line", { x1: x(i / 4), x2: x(i / 4), y1: 14, y2: 30, stroke: css("--ok"), "stroke-width": 1.4 }, svg);
      for (let i = 0; i <= 4; i++) el("rect", { x: x(i * 2) - 4, y: 46, width: 8, height: 16, rx: 2, fill: css("--cool") }, svg);
      [4, 8].forEach(d => { el("line", { x1: x(d), x2: x(d), y1: 32, y2: 44, stroke: css("--mag"), "stroke-width": 2.4 }, svg);
        el("text", { x: x(d) - 4, y: 41, "font-size": 10.5, "text-anchor": "end", fill: css("--mag") }, svg, "exchange"); });
      for (let d = 0; d <= 8; d += 2) el("text", { x: x(d), y: 80, "font-size": 10.5, "text-anchor": "middle", class: "mono", fill: css("--muted") }, svg, d + " d");
      el("text", { x: W - 10, y: 91, "font-size": 10.5, "text-anchor": "end", fill: css("--muted") }, svg, "ticks: 6-h atmosphere states · 48-h ocean steps");
    }
    function render() {
      timeline();
      const R = sim(mode, mode === 2 ? fb() : 0), x = R.x, show = 720;
      const pts = Array.from(x.slice(0, show), (v, i) => [i / 12, v]);
      VIZ.curves($("#clDlFig"), [{ pts, col: "--cool", w: 1.4 }], { xr: [0, 60], yr: [-3, 3], xl: "years", W: 520, H: 105, xt: [0, 10, 20, 30, 40, 50, 60], yt: [-3, 0, 3], xf: v => fmt(v, 0), yf: v => fmt(v, 0) });
      const Sx = mode ? spectrum(x).filter(p => p[0] >= 0.4 && p[0] <= 40).reverse() : [];
      const ref = spectrum(sim(1, 0).x).filter(p => p[0] >= 0.4 && p[0] <= 40).reverse();
      const series = [{ pts: ref, col: "--muted", w: 1.4, dash: "4 3", label: "one-way (red noise)" }];
      if (mode === 2) series.push({ pts: Sx, col: "--cool", w: 2.2, label: "two-way coupled" });
      VIZ.curves($("#clDlSpec"), series, { xr: [0.4, 40], yr: [1e-5, 1], logx: true, logy: true, xl: "period (years, log)", yl: "power (log)", W: 520, H: 120,
        xt: [0.5, 1, 2, 5, 10, 20, 40], yt: [1e-5, 1e-3, 0.1], xf: v => fmt(v, v < 1 ? 1 : 0), yf: v => v >= 0.1 ? "0.1" : v >= 1e-3 ? "0.001" : "1e-5", legendAt: "tr" });
      let pk = null; if (mode === 2) { const inb = Sx.filter(p => p[0] >= 1.5 && p[0] <= 15); pk = inb.reduce((a, b) => b[1] > a[1] ? b : a); }
      $("#clDlRead").innerHTML = `<div><span>SST sd (toy)</span><b>${mode ? fmt(sd(x), 2) + " K" : "0 (fixed)"}</b></div>` +
        `<div><span>Spectral peak</span><b class="c-ok">${pk ? "≈ " + fmt(pk[0], 1) + " yr" : "none"}</b></div>` +
        `<div><span>85 toy years took</span><b class="c-data">${fmt(R.ms, 0)} ms</b></div>`;
      // reported cost of a 1,000-year run (log-free: hours)
      const W = 520, Hh = 62, svg = svgIn($("#clDlCost"), W, Hh), L = 150, sc = (W - L - 90) / (90 * 24);
      [["DLESyM, one A100", 12, "~12 h", "--ok"], ["CESM2", 90 * 24, "~90 days", "--muted"]].forEach(([lab, h, txt, col], i) => { const y = 4 + i * 28;
        el("text", { x: L - 8, y: y + 15, "text-anchor": "end", "font-size": 12, fill: css("--fg") }, svg, lab);
        el("rect", { x: L, y: y + 3, width: Math.max(3, h * sc), height: 18, rx: 3, fill: css(col), opacity: .85 }, svg);
        el("text", { x: L + Math.max(3, h * sc) + 6, y: y + 16, "font-size": 12, class: "mono", fill: css("--muted") }, svg, txt); });
      el("text", { x: W - 2, y: 18, "text-anchor": "end", "font-size": 11, fill: css("--ok") }, svg, "≈ 180× less wall time");
    }
    render(); return render;
  });

  /* ───────── cBottle: sample a state for given SST, month and hour (toy planet) ───────── */
  demo("cl-cbottle", slide => {
    const NX = 128, NY = 64, D2R = Math.PI / 180, MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const lat = j => 90 - (j + .5) * 180 / NY, lon = i => (i + .5) * 360 / NX;      // lon 0…360 east
    // toy continents: the top 30 % of a smooth random field between 60° S and 75° N, plus an Antarctic cap
    const L0 = FFT.noise2(128, { beta: 3.5, seed: 11, kmin: 2 }), LAND = new Uint8Array(NX * NY);
    const cut = Array.from(L0.slice(0, NX * NY)).sort((a, b) => a - b)[Math.floor(0.7 * NX * NY)];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) LAND[j * NX + i] = (L0[j * NX + i] > cut && lat(j) < 75 && lat(j) > -60) || lat(j) < -68 ? 1 : 0;
    // keep the ENSO region open ocean
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (Math.abs(lat(j)) < 22 && lon(i) > 165 && lon(i) < 265) LAND[j * NX + i] = 0;
    const NOISE = new Map(), noise = s => { if (!NOISE.has(s)) NOISE.set(s, FFT.noise2(128, { beta: 3, seed: 500 + s }).slice(0, NX * NY)); return NOISE.get(s); };
    let v = "T", mon = 0, sst = 0, nAvg = 1, seed = 1;
    chips($("#clCbVar"), x => { v = x; render(); });
    chips($("#clCbMon"), x => { mon = +x; render(); });
    chips($("#clCbSst"), x => { sst = +x; render(); });
    chips($("#clCbShow"), x => { nAvg = +x; render(); });
    const hr = slider("clCbHr", x => String(x).padStart(2, "0") + " UTC", render);
    $("#clCbNew").onclick = () => { seed += 16; render(); };
    const gs = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
    function field(var_, s) {
      const doy = mon * DAY + 15, dec = -23.44 * Math.cos(2 * Math.PI * (doy + 10) / 365), z = noise(s), out = new Float64Array(NX * NY);
      for (let j = 0; j < NY; j++) { const p = lat(j), sp = Math.sin(p * D2R);
        for (let i = 0; i < NX; i++) { const k = j * NX + i, ln = lon(i), land = LAND[k], enso = sst * gs(p, 0, 10) * gs(ln, 235, 40);
          if (var_ === "T") {
            const base = 28 - 52 * sp * sp, seas = 18 * (dec / 23.44) * sp * (land ? 1 : 0.35);
            const ha = (ln + 15 * hr() - 180 - 30) * D2R, diur = (land ? 6 : 0.4) * Math.cos(ha) * Math.cos(p * D2R);
            out[k] = base + seas + diur + (land ? 0 : enso) + z[k] * (1.5 + 7 * sp * sp) * (land ? 1.3 : 0.7) - (p < -68 ? 15 : 0);
          } else {
            const c = (land ? 0.6 : 0.35) * dec + 4, base = 9 * gs(p, c, 7) + 3.2 * gs(Math.abs(p), 45, 9) + 0.4;
            const shift = sst * (5 * gs(p, 0, 8) * gs(ln, 205, 35) - 4 * gs(p, 0, 10) * gs(ln, 130, 25));
            out[k] = Math.max(0, base + shift) * Math.exp(1.0 * z[k] - 0.5);
          } } }
      return out;
    }
    function sample() { if (nAvg === 1) return field(v, seed); const acc = new Float64Array(NX * NY);
      for (let n = 0; n < nAvg; n++) { const f = field(v, seed + n); for (let k = 0; k < acc.length; k++) acc[k] += f[k] / nAvg; } return acc; }
    const inBox = (i, j) => Math.abs(lat(j)) <= 5 && lon(i) >= 190 && lon(i) <= 240;
    function render() {
      const f = sample(), isT = v === "T", lo = isT ? -30 : 0, hi = isT ? 35 : 20, col = isT ? CM.temp : CM.precip;
      const fg = css("--fg");
      VIZ.raster($("#clCbMap"), f, NX, NY, { color: col, lo, hi, smooth: true, mask: isT ? null : val => val < 0.6,
        overlay: (g, sx, sy) => {
          g.save(); g.strokeStyle = fg; g.globalAlpha = .55; g.lineWidth = 1.2; g.beginPath();
          const L = (i, j) => i >= 0 && j >= 0 && i < NX && j < NY && LAND[j * NX + i];
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { if (!L(i, j)) continue;
            if (!L(i, j - 1)) { g.moveTo(i * sx, j * sy); g.lineTo((i + 1) * sx, j * sy); } if (!L(i, j + 1)) { g.moveTo(i * sx, (j + 1) * sy); g.lineTo((i + 1) * sx, (j + 1) * sy); }
            if (!L(i - 1, j)) { g.moveTo(i * sx, j * sy); g.lineTo(i * sx, (j + 1) * sy); } if (!L(i + 1, j)) { g.moveTo((i + 1) * sx, j * sy); g.lineTo((i + 1) * sx, (j + 1) * sy); } }
          g.stroke(); g.globalAlpha = 1;
          const x0 = 190 / 360 * NX * sx, x1 = 240 / 360 * NX * sx, y0 = (90 - 5) / 180 * NY * sy, y1 = (90 + 5) / 180 * NY * sy;
          g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(x0, y0 - 6, x1 - x0, y1 - y0 + 12);
          g.strokeStyle = "#111"; g.lineWidth = 2; g.setLineDash([6, 4]); g.strokeRect(x0, y0 - 6, x1 - x0, y1 - y0 + 12); g.restore(); } });
      VIZ.legend($("#clCbLeg"), { color: col, min: lo, max: hi, label: isT ? "2 m temperature (°C)" : "rain (mm/day)", width: 300 });
      $("#clCbTitle").textContent = `Toy ${nAvg > 1 ? "mean of 16 samples" : "sample"} · ${MONTHS[mon]} · ${sst > 0 ? "El Niño" : sst < 0 ? "La Niña" : "neutral"} SST · ${String(hr()).padStart(2, "0")} UTC`;
      let bx = 0, nb = 0, gm = 0, gw = 0;
      for (let j = 0; j < NY; j++) { const w = Math.cos(lat(j) * D2R); for (let i = 0; i < NX; i++) { const k = j * NX + i; gm += w * f[k]; gw += w; if (inBox(i, j)) { bx += f[k]; nb++; } } }
      const u = isT ? " °C" : " mm/d";
      $("#clCbRead").innerHTML = `<div><span>Box mean</span><b class="c-ok">${fmt(bx / nb, 1)}${u}</b></div><div><span>Global mean</span><b>${fmt(gm / gw, 1)}${u}</b></div><div><span>Samples</span><b>${nAvg}</b></div>`;
    }
    render(); return render;
  });

  /* ───────── cBottle: channel infilling (toy Gaussian fields) and HEALPix super-resolution ───────── */
  demo("cl-infill", slide => {
    const n = 64, A = FFT.noise2(n, { beta: 3, seed: 21 }), E = FFT.noise2(n, { beta: 1.4, seed: 22 }), SAMP = new Map();
    const samp = s => { if (!SAMP.has(s)) SAMP.set(s, FFT.noise2(n, { beta: 1.4, seed: 300 + s })); return SAMP.get(s); };
    let mode = "samp", s = 1, ns = 16, view = [-40, 40];
    const rho = slider("clInRho", x => fmt(x, 2), render);
    chips($("#clInMode"), x => { mode = x; render(); });
    $("#clInNew").onclick = () => { s++; render(); };
    chips($("#clSrNs"), x => { ns = +x; drawGlobe(); });
    function render() {
      const r = rho(), q = Math.sqrt(1 - r * r), B = A.map((a, k) => r * a + q * E[k]), Z = samp(s);
      const I = mode === "mean" ? A.map(a => r * a) : A.map((a, k) => r * a + q * Z[k]);
      const o = { color: CM.vir, lo: -3, hi: 3, round: 6 };
      VIZ.raster($("#clInA"), A, n, n, o); VIZ.raster($("#clInB"), I, n, n, o); VIZ.raster($("#clInT"), B, n, n, o);
      const c = corr(I, B), sr = sd(I) / sd(B);
      $("#clInRead").innerHTML = `<div><span>Correlation with truth</span><b class="c-ok">${fmt(c, 2)}</b></div><div><span>sd infill / sd truth</span><b class="${sr < 0.85 ? "c-lw" : "c-ok"}">${fmt(sr, 2)}</b></div><div><span>RMSE</span><b>${fmt(MET.rmse(I, B), 2)}</b></div>`;
      drawGlobe(); diagram();
    }
    // HEALPix: each pixel takes the toy field at its centre
    const VALS = new Map(), D2R = Math.PI / 180;
    // toy field: the analytic waves (m ≤ 23) plus two short ripples so that fine pixels have something to resolve
    const fz = (la, lo) => ATM.z500(lo, la, 0) - ATM.base(la) + 30 * Math.cos((37 * lo + 40) * D2R) * Math.cos(31 * la * D2R) + 22 * Math.sin((53 * lo) * D2R) * Math.sin(47 * la * D2R) * Math.cos(la * D2R);
    function vals(ns) { if (!VALS.has(ns)) VALS.set(ns, Float32Array.from(HPX.centers(ns), c => fz(90 - c.theta / D2R, c.phi / D2R))); return VALS.get(ns); }
    function drawGlobe() {
      const V = vals(ns), pix = (la, lo) => HPX.ang2pix(ns, (90 - la) * D2R, lo * D2R), e = 0.8;
      VIZ.globe($("#clSrGlobe"), (la, lo) => V[pix(la, lo)], { size: 215, lon0: view[0], lat0: view[1], color: CM.div, lo: -130, hi: 130, graticule: 0,
        onRotate: (a, b) => view = [a, b],
        edges: ns <= 8 ? (la, lo) => { const p = pix(la, lo); return p !== pix(Math.min(89.9, la + e), lo) || p !== pix(la, lo + e / Math.max(.15, Math.cos(la * D2R))); } : null });
      const np = HPX.npix(ns), km = Math.sqrt(4 * Math.PI * 6371 ** 2 / np);
      $("#clSrRead").innerHTML = `<div><span>Pixels 12·nside²</span><b>${fmtN(np)}</b></div><div><span>√(pixel area)</span><b class="c-ok">≈ ${fmtN(km)} km</b></div>`;
    }
    function diagram() {
      const W = 470, H = 92, svg = svgIn($("#clSrDiag"), W, H); arrowDefs(svg, "clSrAr", css("--muted"));
      const box = (x, w, t1, t2, col) => { el("rect", { x, y: 8, width: w, height: 58, rx: 10, fill: css("--card"), stroke: css(col), "stroke-width": 1.6 }, svg);
        el("text", { x: x + w / 2, y: 30, "text-anchor": "middle", "font-size": 12.5, "font-weight": 600, fill: css(col) }, svg, t1);
        el("text", { x: x + w / 2, y: 50, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, t2); };
      box(2, 150, "Stage 1: HPX64", "~100 km · 49k px", "--ok");
      box(W - 152, 150, "Stage 2: HPX1024", "~5 km · 12.5M px", "--ok");
      el("line", { x1: 158, x2: W - 158, y1: 37, y2: 37, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#clSrAr)" }, svg);
      el("text", { x: W / 2, y: 30, "text-anchor": "middle", "font-size": 11.5, fill: css("--fg") }, svg, "16× per side");
      el("text", { x: W / 2, y: 52, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, "patch by patch");
      el("text", { x: W / 2, y: 86, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, "cBottle's super-resolution: 4 more doublings of nside, 256× more pixels");
    }
    render(); return render;
  });

  /* ───────── huge ensembles: return periods and the uncertainty of a return level ───────── */
  demo("cl-extremes", slide => {
    const MEM = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000], MU = 60, BETA = 15, TRIALS = 300;
    const level = T => MU - BETA * Math.log(-Math.log(1 - 1 / T));
    let T = 100;
    chips($("#clExT"), x => { T = +x; render(); });
    const mem = slider("clExM", i => fmtN(MEM[i]), render), yrs = slider("clExY", x => x + (x > 1 ? " yr" : " yr"), render);
    // the k largest of N annual maxima, drawn directly as uniform order statistics (log scale), then mapped to Gumbel
    function topK(N, k, r) { const out = new Float64Array(k); let L = 0;
      for (let j = 0; j < k; j++) { L += Math.log(1 - r()) / (N - j); out[j] = MU - BETA * Math.log(-L); } return out; }
    function render() {
      const N = MEM[mem()] * yrs(), k = Math.max(1, Math.round(N / T)), truth = level(T), r = rng(4242);
      $("#clExTT").textContent = fmtN(T);
      const est = new Float64Array(TRIALS); let hit = 0;
      for (let t = 0; t < TRIALS; t++) { const top = topK(N, k, r); est[t] = top[k - 1]; if (top[0] >= truth) hit++; }
      // one ensemble for the return-level plot
      const one = topK(N, Math.min(N, 400), rng(99)), pts = Array.from(one, (x, i) => [(N + 1) / (i + 1), x]);
      const curve = []; for (let e = 0; e <= 5.001; e += 0.05) { const TT = 10 ** e; if (TT > 1.01) curve.push([TT, level(TT)]); }
      const C = VIZ.curves($("#clExFig"), [{ pts: curve, col: "--fg", w: 2, label: "true return level" }], { xr: [1, 1e5], yr: [40, 260], logx: true, xl: "return period (years, log)", yl: "rain (mm)",
        W: 520, H: 180, xt: [1, 10, 100, 1000, 1e4, 1e5], yt: [50, 100, 150, 200, 250], xf: v => fmtN(v), yf: v => fmt(v, 0), legendAt: "tl" });
      [[T, "1-in-" + fmtN(T), "--lw", 26], [N, "N = " + fmtN(N) + " yr", "--accent", 42]].forEach(([x, lab, tok, y]) => {
        el("line", { x1: C.X(x), x2: C.X(x), y1: 12, y2: 152, stroke: css(tok), "stroke-dasharray": "3 3" }, C.svg);
        const right = C.X(x) > 420; el("text", { x: C.X(x) + (right ? -4 : 4), y, "font-size": 10.5, "text-anchor": right ? "end" : "start", fill: css(tok) }, C.svg, lab); });
      dots(C.svg, pts, C.X, C.Y, "--accent", 2.2, .7);
      el("text", { x: 504, y: 140, "font-size": 11, "text-anchor": "end", fill: css("--accent") }, C.svg, "● largest annual maxima of one ensemble");
      // histogram of the estimates
      const sorted = Array.from(est).sort((a, b) => a - b), q05 = sorted[Math.floor(.05 * TRIALS)], q95 = sorted[Math.floor(.95 * TRIALS)];
      // bin width follows the spread so that narrow and wide distributions both show their shape
      const w = clamp(Math.max(q95 - truth, truth - q05) / 10, 0.25, 5), nb = 28, lo = truth - 14 * w, h = new Array(nb).fill(0); est.forEach(x => h[clamp(Math.floor((x - lo) / w), 0, nb - 1)]++);
      VIZ.curves($("#clExHist"), [{ pts: stepPts(h, lo, w), col: "--accent", w: 2, label: N < T ? "estimates (record maximum)" : "estimates" }], { xr: [lo, lo + nb * w], yr: [0, Math.max(...h) * 1.15], xl: "estimated level (mm)",
        W: 520, H: 110, xt: [lo + w, truth, lo + (nb - 1) * w], yt: [0], xf: v => fmt(v, w < 1 ? 1 : 0), yf: () => "", legendAt: "tl", marks: [[truth, "true " + fmt(truth, 0) + " mm", "--fg"]] });
      const p = 1 - Math.pow(1 - 1 / T, N);
      $("#clExRead").innerHTML = `<div><span>Years N</span><b>${fmtN(N)}</b></div><div><span>Expected events</span><b>${fmt(N / T, N / T < 10 ? 1 : 0)}</b></div>` +
        `<div><span>P(≥ 1 event)</span><b class="c-ok">${fmt(100 * p, p > 0.995 ? 1 : 0)} %</b></div><div><span>Monte Carlo</span><b class="c-data">${fmt(100 * hit / TRIALS, 0)} %</b></div>` +
        `<div><span>90 % range</span><b class="${q95 - q05 > 30 ? "c-lw" : "c-ok"}">${fmt(q05, 0)}–${fmt(q95, 0)}</b></div>`;
    }
    render(); return render;
  });

  /* ───────── quiz ───────── */
  demo("cl-quiz", () => {
    const Q = [
      { q: "An emulator has no skill beyond about two weeks. Why can a 100-year run of it still be useful?", opts: ["Its errors average out over 100 years", "A stable model can reproduce the statistics without following the true path", "Long runs are restarted from observations"], right: 1,
        why: "Weather paths diverge (chaos), but if the model keeps the right mean, variance and extremes, its long run samples the right climate." },
      { q: "Why does DLESyM step the ocean every 48 h but the atmosphere every few hours?", opts: ["The ocean network is too big", "SST changes slowly, so a long step is enough and cheaper", "HEALPix requires it"], right: 1,
        why: "Different components have different time scales; they exchange information every 4 days." },
      { q: "What does cBottle need to generate a global atmospheric state?", opts: ["The state 6 hours earlier", "Monthly SST and the solar position", "48 h of satellite observations"], right: 1,
        why: "It samples p(state | SST, time) with a diffusion model; it does not time-step, so there is nothing to drift." },
      { q: "You run 100 members for 10 years each. How many 1-in-100-year events do you expect?", opts: ["About 0.1", "About 1", "About 10"], right: 2,
        why: "1,000 simulated years × 1/100 = 10 expected events (if the members are independent and the model's tails are right)." }];
    Q.forEach((q, i) => VIZ.quiz($("#clQuiz" + (i + 1)), [q]));
    return () => {};
  });
}
