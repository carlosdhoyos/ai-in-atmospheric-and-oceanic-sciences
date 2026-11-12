/* ═════════ Earth-2 · section 2: global forecasting ═════════ */

/* shared toy helpers for this section */
const GF = (() => {
  const D2R = Math.PI / 180, envCache = {};
  // per-row wave envelopes and zonal-mean climatology for an ny-row grid (cached)
  function envs(ny) {
    if (!envCache[ny]) { const lats = ATM.lats(ny);
      envCache[ny] = { lats, base: lats.map(ATM.base), E: ATM.waves.map(w => lats.map(lat => Math.exp(-(((lat - w.lat) / w.w) ** 2)))) }; }
    return envCache[ny];
  }
  /* the ATM toy field on an nx × ny grid at day d (same formula as ATM.z500), with an optional extra phase off(k) (radians)
     for wave k: a wrong phase = a wave in the wrong place, the toy's way of making forecast errors */
  function field(nx, ny, d, off = null) {
    const { E, base } = envs(ny), a = new Float64Array(nx * ny), row = new Float64Array(nx);
    for (let j = 0; j < ny; j++) a.fill(base[j], j * nx, (j + 1) * nx);
    ATM.waves.forEach((w, k) => {
      const amp = w.A * (1 + w.g * Math.sin(d / 3 + w.ph)), ph = w.ph + (off ? off(k) : 0);
      for (let i = 0; i < nx; i++) row[i] = amp * Math.cos(w.m * ((i + .5) * 360 / nx - w.c * d) * D2R + ph);
      const e = E[k]; for (let j = 0; j < ny; j++) { const ej = e[j]; if (ej < 1e-3) continue; const o = j * nx; for (let i = 0; i < nx; i++) a[o + i] += ej * row[i]; }
    });
    return a;
  }
  // cos(latitude) weights and the climatology as full grids
  function weights(nx, ny) { const { lats, base } = envs(ny), w = new Float64Array(nx * ny), c = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { w[j * nx + i] = Math.cos(lats[j] * D2R); c[j * nx + i] = base[j]; }
    return { w, c }; }
  // a raster centred in its host, at most maxW css px wide
  function map(host, vals, nx, ny, opts) { const r = VIZ.raster(host, vals, nx, ny, opts); r.canvas.style.margin = "0 auto"; return r; }
  // inverse of the standard normal CDF (bisection; fine for a few dozen values)
  function qnorm(p) { let a = -8, b = 8; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (Phi(m) < p) a = m; else b = m; } return (a + b) / 2; }
  return { D2R, envs, field, weights, map, qnorm };
})();

/* 1 · autoregressive rollout: error growth, RMSE and ACC vs lead time against persistence and climatology */
demo("s-global", slide => {
  const NX = 96, NY = 48, NT = 61, { w: Wt, c: CL } = GF.weights(NX, NY), R = rng(11);
  const truth = Array.from({ length: NT }, (_, n) => GF.field(NX, NY, n / 4));
  // each wave gets a fixed wrong speed (deg lon / day) and a small initial phase error; both scale with the slider
  const dv = ATM.waves.map(() => (R() < .5 ? -1 : 1) * (1 + R())), d0 = ATM.waves.map(() => gauss(R));
  const sErr = slider("gfRoErr", v => v === 0 ? "none" : "×" + fmt(v, 2), () => { recompute(); render(); });
  const sLead = slider("gfRoLead", v => fmt(v / 4, 2) + " d", render);
  const show = chips($("#gfRoShow"), render);
  let fc = null, sc = null, timer = null;
  function recompute() {
    const e = sErr();
    fc = truth.map((_, n) => { const d = n / 4; // phase error grows a bit faster than linearly (errors feed on errors); capped at ±90°, where a wave is uncorrelated
      return GF.field(NX, NY, d, k => { const raw = e * (ATM.waves[k].m * 0.35 * dv[k] * GF.D2R * d * (1 + d / 4) + 0.03 * ATM.waves[k].m * d0[k] / 4); return (Math.PI / 2) * Math.tanh(raw / (Math.PI / 2)); }); });
    sc = truth.map((t, n) => ({ d: n / 4, rf: MET.rmse(fc[n], t, Wt), af: MET.acc(fc[n], t, CL, Wt), rp: MET.rmse(truth[0], t, Wt), ap: MET.acc(truth[0], t, CL, Wt), rc: MET.rmse(CL, t, Wt) }));
  }
  function render() {
    const n = sLead(), v = show(), d = n / 4;
    const T = { fc: "Toy forecast", tr: "Truth", err: "Error: forecast − truth (m)" }[v];
    $("#gfRoTitle").textContent = `${T} · day ${fmt(d, 2)} (${n} steps of 6 h)`;
    if (v === "err") { const e = fc[n].map((x, i) => x - truth[n][i]);
      GF.map($("#gfRoMap"), e, NX, NY, { color: CM.div, lo: -300, hi: 300, smooth: true, maxWidth: 400 });
      VIZ.legend($("#gfRoLeg"), { color: CM.div, min: -300, max: 300, label: "forecast − truth (m)" }); }
    else { GF.map($("#gfRoMap"), v === "tr" ? truth[n] : fc[n], NX, NY, { color: CM.temp, lo: ATM.RANGE[0], hi: ATM.RANGE[1], smooth: true, maxWidth: 400 });
      VIZ.legend($("#gfRoLeg"), { color: CM.temp, min: ATM.RANGE[0], max: ATM.RANGE[1], label: "500 hPa height (m)" }); }
    const ymax = Math.ceil(1.5 * Math.max(...sc.map(s => Math.max(s.rf, s.rp, s.rc))) / 50) * 50, mk = [[d, "", "--accent"]];
    VIZ.curves($("#gfRoRmse"), [{ pts: sc.map(s => [s.d, s.rc]), col: "--fg", dash: "2 3", label: "climatology" }, { pts: sc.map(s => [s.d, s.rp]), col: "--muted", dash: "6 4", label: "persistence" },
      { pts: sc.map(s => [s.d, s.rf]), col: "--accent", w: 2.6, label: "toy model" }], { xr: [0, 15], yr: [0, ymax], xl: "lead (days)", yl: "RMSE (m)", W: 300, H: 175, xt: [0, 5, 10, 15], xf: v => fmt(v, 0), yf: v => fmt(v, 0), marks: mk, legendAt: "tl" });
    VIZ.curves($("#gfRoAcc"), [{ pts: [[0, .6], [15, .6]], col: "--muted", dash: "2 3", w: 1 }, { pts: sc.map(s => [s.d, s.ap]), col: "--muted", dash: "6 4", label: "persistence" },
      { pts: sc.map(s => [s.d, s.af]), col: "--accent", w: 2.6, label: "toy model" }], { xr: [0, 15], yr: [-0.2, 1], xl: "lead (days)", yl: "ACC", W: 300, H: 175, xt: [0, 5, 10, 15], yt: [0, .6, 1], xf: v => fmt(v, 0), marks: mk, legendAt: "tr" });
    const s = sc[n], lost = sc.find(x => x.af < .6), cross = sc.find(x => x.rf > x.rc);
    $("#gfRoRead").innerHTML = `<div><span>RMSE</span><b>${fmtN(s.rf)} m</b></div><div><span>ACC</span><b>${fmt(s.af, 2)}</b></div>` +
      `<div><span>ACC &lt; 0.6</span><b class="c-sw">${lost ? "day " + fmt(lost.d, 1) : "> 15 d"}</b></div><div><span>RMSE &gt; clim.</span><b class="c-lw">${cross ? "day " + fmt(cross.d, 1) : "> 15 d"}</b></div>`;
  }
  $("#gfRoPlay").onclick = () => {
    const btn = $("#gfRoPlay"), r = $("#gfRoLead");
    if (timer) { clearInterval(timer); timer = null; btn.textContent = "▶ Play 15 days"; return; }
    if (+r.value >= NT - 1) r.value = 0;
    btn.textContent = "❚❚ Pause";
    timer = setInterval(() => {
      if (!slide.classList.contains("on") || +r.value >= NT - 1) { clearInterval(timer); timer = null; btn.textContent = "▶ Play 15 days"; return; }
      r.value = +r.value + 1; r.dispatchEvent(new Event("input"));
    }, 110);
  };
  recompute(); render(); return render;
});

/* 2 · AFNO: Fourier mixing along one latitude circle; truncate modes or apply a learned per-mode complex weight */
demo("gf-afno", () => {
  const N = 128, lon = Array.from({ length: N }, (_, i) => (i + .5) * 360 / N), cache = {};
  const sig = (lat, d) => lon.map(l => ATM.z500(l, lat, d * 24));
  const sLat = slider("gfAfLat", v => v + "°N", render), sK = slider("gfAfK", v => v, render), mode = chips($("#gfAfMode"), render);
  // train W_k on 20 (day, day+1) pairs: least squares X_{d+1,k} ≈ W_k X_{d,k}
  function prep(lat) {
    if (cache[lat]) return cache[lat];
    const Fs = Array.from({ length: 21 }, (_, d) => FFT.dft(sig(lat, d)));
    const Wk = Fs[0].map((_, k) => { let nr = 0, ni = 0, den = 0;
      for (let d = 0; d < 20; d++) { const a = Fs[d][k], b = Fs[d + 1][k]; nr += b.re * a.re + b.im * a.im; ni += b.im * a.re - b.re * a.im; den += a.re * a.re + a.im * a.im; }
      return { re: nr / (den || 1), im: ni / (den || 1) }; });
    const now = sig(lat, 25), next = sig(lat, 26);
    return (cache[lat] = { Wk, now, next, F: FFT.dft(now) });
  }
  // inverse real DFT from the dft() convention (X_k = Σ x e^{-iθ}), keeping k ≤ K
  function inv(Y, K) { const x = new Float64Array(N);
    for (let k = 0; k <= Math.min(K, N / 2 - 1); k++) { const c = k ? 2 / N : 1 / N, y = Y[k];
      for (let i = 0; i < N; i++) { const t = 2 * Math.PI * k * i / N; x[i] += c * (y.re * Math.cos(t) - y.im * Math.sin(t)); } }
    return x; }
  const rms = (a, b) => Math.sqrt(mean(Array.from(a, (v, i) => (v - b[i]) ** 2)));
  function render() {
    const lat = sLat(), K = sK(), m = mode(), P = prep(lat);
    const Y = P.F.map((c, k) => m === "id" ? c : { re: P.Wk[k].re * c.re - P.Wk[k].im * c.im, im: P.Wk[k].re * c.im + P.Wk[k].im * c.re });
    const out = inv(Y, K), all = [...P.now, ...P.next, ...out], lo = Math.floor(Math.min(...all) / 50) * 50, hi = Math.ceil((Math.max(...all) + 0.45 * (Math.max(...all) - Math.min(...all))) / 50) * 50;
    const S = m === "id" ? [{ pts: P.now.map((v, i) => [lon[i], v]), col: "--fg", label: "input x (today)" }, { pts: Array.from(out, (v, i) => [lon[i], v]), col: "--accent", w: 2.6, label: `x′ (k ≤ ${K})` }]
      : [{ pts: P.now.map((v, i) => [lon[i], v]), col: "--muted", dash: "5 4", label: "today" }, { pts: P.next.map((v, i) => [lon[i], v]), col: "--fg", label: "tomorrow (truth)" }, { pts: Array.from(out, (v, i) => [lon[i], v]), col: "--accent", w: 2.6, label: "x′ = prediction" }];
    VIZ.curves($("#gfAfSig"), S, { xr: [0, 360], yr: [lo, hi], xl: "longitude (°E)", W: 520, H: 190, xt: [0, 90, 180, 270, 360], yt: [lo, hi], xf: v => fmt(v, 0), yf: v => fmt(v, 0), legendAt: "tl" });
    // amplitude bars + learned phase shift
    const W = 520, H = 170, mg = { l: 46, r: 40, t: 14, b: 34 }, KM = 40, svg = svgIn($("#gfAfSpec"), W, H), bw = (W - mg.l - mg.r) / KM;
    const amp = P.F.slice(1, KM + 1).map(c => c.amp), am = Math.max(...amp), Yb = lin(0, am, H - mg.b, mg.t), Yp = lin(-180, 180, H - mg.b, mg.t);
    [0, am / 2, am].forEach(v => { el("line", { x1: mg.l, x2: W - mg.r, y1: Yb(v), y2: Yb(v), class: "grid" }, svg); el("text", { x: mg.l - 6, y: Yb(v) + 4, "text-anchor": "end", class: "mut mono", "font-size": 11 }, svg, fmt(v, 0)); });
    el("text", { x: mg.l, y: mg.t - 2, class: "mut", "font-size": 11 }, svg, "amplitude (m)");
    amp.forEach((a, i) => { const k = i + 1, x = mg.l + i * bw, on = k <= K;
      const r = el("rect", { x: x + 1, y: Yb(a), width: bw - 2, height: Math.max(H - mg.b - Yb(a), .5), rx: 2, fill: css(on ? "--accent" : "--line"), opacity: on ? .85 : 1, style: "cursor:pointer" }, svg);
      el("title", {}, r, `k = ${k}: ${fmt(a, 1)} m — click to keep k ≤ ${k}`);
      if (k % 5 === 0 || k === 1) el("text", { x: x + bw / 2, y: H - mg.b + 15, "text-anchor": "middle", class: "mut mono", "font-size": 11 }, svg, k); });
    // a transparent hit area per column so even tiny bars are clickable
    for (let i = 0; i < KM; i++) { const r = el("rect", { x: mg.l + i * bw, y: mg.t, width: bw, height: H - mg.t - mg.b, fill: "transparent", style: "cursor:pointer" }, svg);
      r.addEventListener("click", () => { const s = $("#gfAfK"); s.value = i + 1; s.dispatchEvent(new Event("input")); }); }
    el("line", { x1: mg.l + K * bw, x2: mg.l + K * bw, y1: mg.t, y2: H - mg.b, stroke: css("--accent"), "stroke-dasharray": "4 3" }, svg);
    el("text", { x: (W + mg.l - mg.r) / 2, y: H - 2, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "zonal wavenumber k (click a bar to set K)");
    if (m === "learn") {
      el("text", { x: W - mg.r + 6, y: Yp(180) + 4, class: "mono", "font-size": 10.5, fill: css("--arch") }, svg, "+180°");
      el("text", { x: W - mg.r + 6, y: Yp(0) + 4, class: "mono", "font-size": 10.5, fill: css("--arch") }, svg, "0°");
      el("text", { x: W - mg.r + 6, y: Yp(-180) + 4, class: "mono", "font-size": 10.5, fill: css("--arch") }, svg, "−180°");
      el("text", { x: W - mg.r, y: mg.t - 2, "text-anchor": "end", "font-size": 11, fill: css("--arch") }, svg, "● phase of W_k (shift per day)");
      for (let k = 1; k <= KM; k++) { if (P.F[k].amp < .01 * am) continue; const p = Math.atan2(P.Wk[k].im, P.Wk[k].re) / GF.D2R;
        el("circle", { cx: mg.l + (k - .5) * bw, cy: Yp(p), r: 3, fill: css("--arch"), opacity: k <= K ? 1 : .3 }, svg); }
    }
    const tot = P.now.map(v => v - mean(P.now));
    $("#gfAfRead").innerHTML = m === "id"
      ? `<div><span>RMSE vs input</span><b>${fmt(rms(out, P.now), 1)} m</b></div><div><span>Variance kept</span><b class="c-ok">${fmt(100 * (1 - mean(Array.from(out, (v, i) => (v - P.now[i]) ** 2)) / mean(tot.map(v => v * v))), 1)} %</b></div><div><span>Modes kept</span><b class="c-data">${K + 1} of 65</b></div>`
      : `<div><span>RMSE, prediction</span><b>${fmt(rms(out, P.next), 1)} m</b></div><div><span>RMSE, persistence</span><b class="c-sw">${fmt(rms(P.now, P.next), 1)} m</b></div><div><span>Complex weights</span><b class="c-data">${K + 1}</b></div>`;
  }
  render(); return render;
});

/* 3 · SFNO: spherical harmonics vs flat FFT modes; a round storm on the lat-lon grid */
demo("gf-sfno", () => {
  const NL = 180, NB = 90, KM_CELL = 2 * Math.PI * 6371 / 1440;
  let what = "ylm", view = [-20, 40];
  const sL = slider("gfShL", v => v, render), sM = slider("gfShM", v => v, render), sLat = slider("gfShLat", v => v + "°N", render);
  chips($("#gfShWhat"), v => { what = v; $("#gfShCtlY").hidden = v === "blob"; $("#gfShCtlB").hidden = v !== "blob";
    $('label[for="gfShL"]').textContent = v === "fft" ? "Row wavenumber n" : "Degree ℓ";
    view = v === "blob" ? [180, 45] : v === "fft" ? [-20, 62] : [-20, 40]; render(); });
  // associated Legendre P_l^m(x), unnormalised (display rescales)
  function plm(l, m, x) {
    let pmm = 1; const s = Math.sqrt(Math.max(0, 1 - x * x));
    for (let i = 1; i <= m; i++) pmm *= -(2 * i - 1) * s;
    if (l === m) return pmm;
    let p1 = x * (2 * m + 1) * pmm; if (l === m + 1) return p1;
    let p0 = pmm; for (let ll = m + 2; ll <= l; ll++) { const p = ((2 * ll - 1) * x * p1 - (ll + m - 1) * p0) / (ll - m); p0 = p1; p1 = p; }
    return p1;
  }
  function grid() {
    const a = new Float64Array(NL * NB), l = sL(), m = sM(), n = sL(), lat0 = sLat() * GF.D2R, lon0 = 180 * GF.D2R;
    for (let j = 0; j < NB; j++) { const lat = (90 - (j + .5) * 180 / NB) * GF.D2R;
      const P = what === "ylm" ? plm(l, m, Math.sin(lat)) : what === "fft" ? Math.cos(2 * Math.PI * n * j / NB) : 0;
      for (let i = 0; i < NL; i++) { const lon = (i + .5) * 360 / NL * GF.D2R;
        if (what === "blob") { const c = Math.sin(lat) * Math.sin(lat0) + Math.cos(lat) * Math.cos(lat0) * Math.cos(lon - lon0), dd = Math.acos(clamp(c, -1, 1)) / GF.D2R;
          a[j * NL + i] = Math.exp(-((dd / 6) ** 2)); }
        else a[j * NL + i] = P * Math.cos(m * lon); } }
    let mx = 0; for (const v of a) mx = Math.max(mx, Math.abs(v)); return a.map(v => v / (mx || 1));
  }
  function render() {
    if (what === "ylm" && sM() > sL()) { const r = $("#gfShM"); r.value = sL(); r.parentElement.querySelector("output").textContent = r.value; }
    const g = grid(), lo = what === "blob" ? -1 : -1, look = (lat, lon) => g[clamp(Math.floor((90 - lat) / 180 * NB), 0, NB - 1) * NL + Math.floor(((lon + 360) % 360) / 360 * NL) % NL];
    VIZ.globe($("#gfShGlobe"), look, { size: 250, lon0: view[0], lat0: view[1], color: CM.div, lo, hi: 1, graticule: 30, onRotate: (a, b) => view = [a, b] });
    GF.map($("#gfShMap"), g, NL, NB, { color: CM.div, lo, hi: 1, smooth: true, round: 6, overlay: (ctx, sx, sy) => {
      ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 1;
      for (let i = 0; i <= NL; i += 15) { ctx.beginPath(); ctx.moveTo(i * sx, 0); ctx.lineTo(i * sx, NB * sy); ctx.stroke(); }
      for (let j = 0; j <= NB; j += 15) { ctx.beginPath(); ctx.moveTo(0, j * sy); ctx.lineTo(NL * sx, j * sy); ctx.stroke(); } } });
    const blat = what === "blob" ? sLat() : null;
    VIZ.curves($("#gfShArea"), [{ pts: [[0, 1], [90, 1]], col: "--muted", dash: "5 4", label: "cells per ring (1,440)" },
      { pts: Array.from({ length: 91 }, (_, i) => [i, Math.cos(i * GF.D2R)]), col: "--accent", label: "cell width" }],
      { xr: [0, 90], yr: [0, 1.2], W: 300, H: 130, xl: "latitude (°)", yl: "relative to equator", xt: [0, 30, 60, 90], yt: [0, .5, 1], xf: v => fmt(v, 0), yf: v => fmt(v, 1), legendAt: "bl", marks: blat != null ? [[blat, "", "--lw"]] : [] });
    let R;
    if (what === "ylm") { const l = sL(), m = sM();
      R = [["Meridian zero lines", m, ""], ["Latitude zero lines", l - m, ""], ["At the poles", m ? "0, smooth" : "one value", "c-ok"]]; }
    else if (what === "fft") { const m = sM();
      R = [["North pole value", m ? "depends on lon." : "one value", m ? "c-lw" : "c-ok"], ["Top row wraps to", "south pole", "c-lw"]]; }
    else { const lat = sLat(), w = KM_CELL * Math.cos(lat * GF.D2R);
      R = [["0.25° cell width", fmt(w, 1) + " km", ""], ["1,000 km storm: columns", fmtN(1000 / Math.max(w, 1e-6)), lat > 60 ? "c-lw" : "c-sw"], ["rows", fmtN(1000 / KM_CELL), "c-ok"]]; }
    $("#gfShRead").innerHTML = R.map(([a, b, c]) => `<div><span>${a}</span><b class="${c}" style="font-size:19px">${b}</b></div>`).join("");
  }
  render(); return render;
});

/* 4 · MSE → the mean of possible futures: members vs their mean, and the spectrum */
demo("gf-blur", () => {
  const NX = 128, NY = 64, { w: Wt } = GF.weights(NX, NY), { lats } = GF.envs(NY), S = 0.018, KS = ATM.waves.filter(w => w.h > 0).map(w => w.m);
  const sLead = slider("gfBlLead", v => "day " + fmt(v, 1), render), sN = slider("gfBlN", v => v, render), show = chips($("#gfBlShow"), render);
  let seed = 1, cacheKey = "", C = null;
  const offs = (z, d) => k => S * ATM.waves[k].m * d * z[k];
  function spec(f) { // cos-weighted zonal power spectrum at the toy's wavenumbers
    const P = new Float64Array(NX / 2 + 1); let ws = 0;
    for (let j = 0; j < NY; j++) { const re = Float64Array.from(f.subarray(j * NX, (j + 1) * NX)), im = new Float64Array(NX), mu = mean(re), w = Math.cos(lats[j] * GF.D2R);
      for (let i = 0; i < NX; i++) re[i] -= mu; FFT.fft(re, im); ws += w;
      for (let k = 1; k <= NX / 2; k++) P[k] += w * (re[k] ** 2 + im[k] ** 2) / (NX * NX); }
    return KS.map(k => [k, P[k] / ws]);
  }
  function compute() {
    const d = sLead(), N = sN(), key = [d, N, seed].join(); if (key === cacheKey) return C; cacheKey = key;
    const R = rng(1000 + seed), RT = rng(77), zT = ATM.waves.map(() => gauss(RT)), Z = Array.from({ length: N }, () => ATM.waves.map(() => gauss(R)));
    const truth = GF.field(NX, NY, d, offs(zT, d)), mem = Z.map(z => GF.field(NX, NY, d, offs(z, d))), mn = new Float64Array(NX * NY);
    mem.forEach(f => { for (let i = 0; i < f.length; i++) mn[i] += f[i] / N; });
    return (C = { truth, one: mem[0], mn, sp: { tr: spec(truth), mem: spec(mem[0]), mean: spec(mn) } });
  }
  $("#gfBlNew").onclick = () => { seed++; render(); };
  function render() {
    const v = show(), c = compute(), f = v === "tr" ? c.truth : v === "mem" ? c.one : c.mn;
    $("#gfBlTitle").textContent = { tr: "Truth (one possible future)", mem: "One member (another possible future)", mean: `Mean of ${sN()} members` }[v] + ` · day ${fmt(sLead(), 1)}`;
    GF.map($("#gfBlMap"), f, NX, NY, { color: CM.temp, lo: ATM.RANGE[0], hi: ATM.RANGE[1], smooth: true, maxWidth: 380 });
    const all = [...c.sp.tr, ...c.sp.mem, ...c.sp.mean].map(p => p[1]), hi = 10 ** Math.ceil(Math.log10(Math.max(...all))), lo = 10 ** Math.floor(Math.log10(Math.max(Math.min(...all), hi / 1e5)));
    const sel = k => v === k ? 3 : 1.6;
    VIZ.curves($("#gfBlSpec"), [{ pts: c.sp.tr, col: "--fg", w: sel("tr"), label: "truth" }, { pts: c.sp.mem, col: "--data", w: sel("mem"), dash: "5 3", label: "one member" },
      { pts: c.sp.mean.map(([k, p]) => [k, Math.max(p, lo)]), col: "--accent", w: sel("mean"), label: "mean of members (≈ MSE model)" }],
      { xr: [3, 23], yr: [lo, hi], logx: true, logy: true, W: 460, H: 165, xl: "zonal wavenumber", yl: "power (m²)", xt: [3, 6, 12, 23], yt: Array.from({ length: Math.round(Math.log10(hi / lo)) + 1 }, (_, i) => lo * 10 ** i), xf: v => fmt(v, 0), yf: v => "10" + String(Math.round(Math.log10(v))).replace(/-/g, "⁻").replace(/\d/g, c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]), legendAt: "bl" });
    const small = s => s.filter(([k]) => k >= 11).reduce((a, p) => a + p[1], 0), st = small(c.sp.tr);
    $("#gfBlRead").innerHTML = `<div><span>RMSE one member</span><b class="c-data">${fmtN(MET.rmse(c.one, c.truth, Wt))} m</b></div><div><span>RMSE mean</span><b>${fmtN(MET.rmse(c.mn, c.truth, Wt))} m</b></div>` +
      `<div><span>Power k ≥ 11, mean / truth</span><b class="c-lw">${fmtN(100 * small(c.sp.mean) / st)} %</b></div>`;
  }
  render(); return render;
});

/* 5 · CRPS: one case (CDF vs observation) and the average over many cases vs ensemble spread */
demo("gf-crps", () => {
  const M = 16, Z = Array.from({ length: M }, (_, i) => GF.qnorm((i + .5) / M));
  const PRE = { good: [1, 0], wide: [2, 0], narrow: [0.3, 0], det: [0, 0], bias: [1, 1.2] };
  const set = (id, v) => { const r = $("#" + id); r.value = v; r.parentElement.querySelector("output").textContent = fmt(+v, 2); };
  const free = () => $$("#gfCrPre .chip").forEach(b => b.setAttribute("aria-pressed", "false"));
  const sY = slider("gfCrY", v => fmt(v, 2), render), sS = slider("gfCrS", v => fmt(v, 2), () => { free(); render(); }), sB = slider("gfCrB", v => fmt(v, 2), () => { free(); render(); });
  chips($("#gfCrPre"), v => { set("gfCrS", PRE[v][0]); set("gfCrB", PRE[v][1]); render(); });
  // expected CRPS for y ~ N(0,1), by quadrature
  const YQ = Array.from({ length: 81 }, (_, i) => -5 + i * .125), WQ = YQ.map(y => Math.exp(-y * y / 2) * .125 / Math.sqrt(2 * Math.PI));
  const ens = (s, b) => Z.map(z => b + s * z), eCrps = (s, b) => { const e = ens(s, b); return YQ.reduce((a, y, i) => a + WQ[i] * MET.crps(e, y), 0); };
  function render() {
    const y = sY(), s = sS(), b = sB(), e = ens(s, b).sort((p, q) => p - q);
    const W = 520, H = 150, mg = { l: 40, r: 12, t: 10, b: 30 }, X = lin(-4, 4, mg.l, W - mg.r), Yv = lin(0, 1, H - mg.b, mg.t), svg = svgIn($("#gfCrFig"), W, H);
    [0, .5, 1].forEach(v => { el("line", { x1: mg.l, x2: W - mg.r, y1: Yv(v), y2: Yv(v), class: "grid" }, svg); el("text", { x: mg.l - 6, y: Yv(v) + 4, "text-anchor": "end", class: "mut mono", "font-size": 11 }, svg, fmt(v, 1)); });
    [-4, -2, 0, 2, 4].forEach(v => el("text", { x: X(v), y: H - mg.b + 15, "text-anchor": "middle", class: "mut mono", "font-size": 11 }, svg, v));
    el("text", { x: W - mg.r, y: H - 2, "text-anchor": "end", class: "mut", "font-size": 11 }, svg, "value (standardised)");
    // shade between the step CDF of the ensemble and the step of the observation
    const xs = [-4, ...e.filter(v => v > -4 && v < 4), y, 4].sort((p, q) => p - q), Fe = x => e.filter(v => v <= x).length / M, Hy = x => x >= y ? 1 : 0;
    for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], c = xs[i + 1], m = (a + c) / 2, f = Fe(m), h = Hy(m); if (c - a < 1e-9 || Math.abs(f - h) < 1e-9) continue;
      el("rect", { x: X(a), y: Yv(Math.max(f, h)), width: X(c) - X(a), height: Yv(Math.min(f, h)) - Yv(Math.max(f, h)), fill: css("--data"), opacity: .12 + .3 * (f - h) ** 2 }, svg); }
    const step = []; let F = 0; step.push([X(-4), Yv(0)]); e.forEach(v => { const xv = X(clamp(v, -4, 4)); step.push([xv, Yv(F)]); F += 1 / M; step.push([xv, Yv(F)]); }); step.push([X(4), Yv(F)]);
    el("path", { d: path(step), fill: "none", stroke: css("--data"), "stroke-width": 2.4 }, svg);
    el("path", { d: path([[X(-4), Yv(0)], [X(y), Yv(0)], [X(y), Yv(1)], [X(4), Yv(1)]]), fill: "none", stroke: css("--fg"), "stroke-width": 1.8, "stroke-dasharray": "5 3" }, svg);
    e.forEach(v => el("line", { x1: X(clamp(v, -4, 4)), x2: X(clamp(v, -4, 4)), y1: H - mg.b, y2: H - mg.b - 7, stroke: css("--data"), "stroke-width": 2 }, svg));
    el("circle", { cx: X(y), cy: H - mg.b, r: 5, fill: css("--fg") }, svg);
    el("text", { x: X(y) + 7, y: Yv(.5), "font-size": 11, fill: css("--fg") }, svg, "observation y");
    el("text", { x: mg.l + 4, y: mg.t + 12, "font-size": 11, fill: css("--data") }, svg, `ensemble CDF F (${M} members, ticks)`);
    const c = MET.crps(e, y), t1 = mean(e.map(v => Math.abs(v - y))), mae = Math.abs(mean(e) - y);
    $("#gfCrRead").innerHTML = `<div><span>CRPS</span><b class="c-data">${fmt(c, 3)}</b></div><div><span>E|X − y|</span><b>${fmt(t1, 3)}</b></div><div><span>½ E|X − X′|</span><b class="c-ok">${fmt(t1 - c, 3)}</b></div><div><span>|mean − y|</span><b class="c-sw">${fmt(mae, 3)}</b></div>`;
    // average CRPS vs spread, at the current bias; the ensemble mean's RMSE does not depend on spread
    const ss = Array.from({ length: 51 }, (_, i) => i * .05), cr = ss.map(sv => [sv, eCrps(sv, b)]), best = cr.reduce((p, q) => q[1] < p[1] ? q : p);
    VIZ.curves($("#gfCrAvg"), [{ pts: ss.map(sv => [sv, Math.sqrt(1 + b * b)]), col: "--sw", dash: "5 4", label: "RMSE of the ensemble mean" }, { pts: cr, col: "--data", w: 2.6, label: "mean CRPS" }],
      { xr: [0, 2.5], yr: [0.4, Math.sqrt(1 + b * b) + .45], W: 520, H: 140, xl: "ensemble spread (truth: 1)", xt: [0, 1, 2, 2.5], yt: [0.4, 0.8, 1.2], xf: v => fmt(v, 1), yf: v => fmt(v, 1), legendAt: "tr",
        marks: [[s, "", "--data"], [best[0], "", "--ok"]] });
    $("#gfCrAvgT").innerHTML = `yours <b style="color:var(--data)">${fmt(eCrps(s, b), 3)}</b> · best <b style="color:var(--ok)">${fmt(best[1], 3)}</b> at spread ${fmt(best[0], 2)}`;
  }
  render(); return render;
});

/* 6 · Atlas: encode → latent transformer → decode; three training recipes; toy samplers in a 2-D latent space */
demo("gf-atlas", slide => {
  const obj = chips($("#gfAtObj"), () => { samples = []; render(); }), sSt = slider("gfAtSteps", v => v, () => { samples = []; render(); });
  const R0 = rng(5), C0 = [0.25, -0.05], Z0 = [-1.05, -0.75];
  // the toy "possible futures" of z_{t+1}: two regimes on an arc (say, the trough deepens or the ridge builds);
  // a CRPS-trained generator maps noise straight onto them in one pass
  const gen = (e1, e2, e3) => { const th = Math.PI / 4 + (e1 > 0 ? .8 : -.8) + .2 * e2, r = .8 + .05 * e3; return [C0[0] + r * Math.cos(th), C0[1] + r * Math.sin(th)]; };
  const PTS = Array.from({ length: 320 }, () => gen(gauss(R0), gauss(R0), gauss(R0)));
  const kmean = (x, sig, shift = null) => { let sx = 0, sy = 0, sw = 0; PTS.forEach(p => { const q = shift ? shift(p) : p, d2 = (x[0] - q[0]) ** 2 + (x[1] - q[1]) ** 2, w = Math.exp(-d2 / (2 * sig * sig)); sx += w * p[0]; sy += w * p[1]; sw += w; });
    return sw > 1e-300 ? [sx / sw, sy / sw] : [mean(PTS.map(p => p[0])), mean(PTS.map(p => p[1]))]; };
  let samples = [], frame = 1, timer = null, R = rng(9);
  function sample(kind, S) {
    if (kind === "crps") return [Z0.slice(), gen(gauss(R), gauss(R), gauss(R))];
    if (kind === "diff") { // Euler on the probability-flow ODE of the empirical distribution, sigma 2.5 → 0.05
      const sg = Array.from({ length: S + 1 }, (_, i) => (2.5 ** (1 / 7) + i / S * (0.05 ** (1 / 7) - 2.5 ** (1 / 7))) ** 7);
      let x = [C0[0] + 2.5 * gauss(R), C0[1] + 2.5 * gauss(R)]; const P = [x];
      for (let i = 0; i < S; i++) { const D = kmean(x, sg[i]), k = (sg[i + 1] - sg[i]) / sg[i]; x = [x[0] + k * (x[0] - D[0]), x[1] + k * (x[1] - D[1])]; P.push(x); }
      return P; }
    // stochastic interpolant from z_t: x_s = (1-s) z_t + s z_{t+1} + γ(s) ε; predict the end point, step, re-noise
    // the noise is correlated from step to step (rho), so a path wanders smoothly instead of jumping
    const g = s => .6 * Math.sqrt(s * (1 - s)), rho = Math.pow(.2, 1 / S); let x = Z0.slice(), eta = [gauss(R), gauss(R)]; const P = [x];
    for (let i = 0; i < S; i++) { const s = i / S, s2 = (i + 1) / S, gs = g(s);
      const E = gs < 1e-6 ? kmean(x, 1e3) : kmean(x, gs, p => [(1 - s) * Z0[0] + s * p[0], (1 - s) * Z0[1] + s * p[1]]);
      eta = eta.map(v => rho * v + Math.sqrt(1 - rho * rho) * gauss(R));
      x = [(1 - s2) * Z0[0] + s2 * E[0] + g(s2) * eta[0], (1 - s2) * Z0[1] + s2 * E[1] + g(s2) * eta[1]]; P.push(x); }
    return P;
  }
  const CARD = {
    diff: ["Diffusion", "Training: add noise to the true z<sub>t+1</sub> and teach the transformer, given z<sub>t</sub>, to remove it. Sampling starts from <b>pure noise</b> and denoises step by step; every step is one pass through the network. Sharp samples, but the cost grows with the number of steps, and too few steps leave samples between the possible states."],
    si: ["Stochastic interpolant", "Training: build a noisy path that starts at <b>today's latent z<sub>t</sub></b> and ends at the true z<sub>t+1</sub>, and learn how to move along it. Sampling walks that path from the current state, adding fresh noise on the way, so different walks end at different plausible futures."],
    crps: ["CRPS", "Training: the transformer takes z<sub>t</sub> plus a random noise vector and outputs a sample in <b>one pass</b>; several samples are scored together with CRPS, as in FourCastNet 3. Fastest to sample. Earth2Studio ships this version as AtlasCRPS (80 GB of GPU memory)."] };
  function flow() {
    const k = obj(), W = 1000, H = 124, svg = svgIn($("#gfAtFlow"), W, H); arrowDefs(svg, "gfAtAr", css("--muted"));
    const B = [[0, 130, "xₜ", "0.25°, 70+ variables", "--fg"], [168, 104, "Encoder", "compress", "--muted"], [308, 84, "zₜ", "latent", "--arch"],
      [430, 210, "Latent transformer", "", "--arch"], [678, 84, "zₜ₊₁", "a sample", "--arch"], [800, 104, "Decoder", "expand", "--muted"], [942, 58, "xₜ₊₁", "", "--fg"]];
    B.forEach(([x, w, t, s, col], i) => { const y = 40, h = 54, big = i === 3;
      el("rect", { x, y, width: w, height: h, rx: 10, fill: big ? css("--arch") : css("--card"), "fill-opacity": big ? .16 : 1, stroke: css(col), "stroke-width": big ? 2.2 : 1.2 }, svg);
      el("text", { x: x + w / 2, y: y + (s ? 22 : 30), "text-anchor": "middle", "font-size": 17, "font-weight": 600, fill: css(col) }, svg, t);
      if (s) el("text", { x: x + w / 2, y: y + 42, "text-anchor": "middle", "font-size": 12.5, fill: css("--muted") }, svg, s);
      if (i < B.length - 1) el("line", { x1: x + w + 3, x2: B[i + 1][0] - 4, y1: y + h / 2, y2: y + h / 2, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#gfAtAr)" }, svg); });
    const sub = { diff: `× ${sSt()} denoising passes`, si: `× ${sSt()} steps along the path`, crps: "× 1 pass" }[k];
    el("text", { x: 535, y: 84, "text-anchor": "middle", "font-size": 12.5, fill: css("--muted") }, svg, sub);
    const noise = { diff: "noisy zₜ₊₁ and its noise level σ (step 1: pure noise)", si: "a point on the noisy path zₜ → zₜ₊₁", crps: "a random noise vector" }[k];
    el("text", { x: 535, y: 14, "text-anchor": "middle", "font-size": 13, fill: css("--arch") }, svg, "+ " + noise);
    el("line", { x1: 535, x2: 535, y1: 20, y2: 37, stroke: css("--arch"), "stroke-width": 1.6, "marker-end": "url(#gfAtAr)" }, svg);
    el("path", { d: `M971 96 L971 108 L65 108 L65 97`, fill: "none", stroke: css("--muted"), "stroke-dasharray": "4 3", "stroke-width": 1.3, "marker-end": "url(#gfAtAr)" }, svg);
    el("text", { x: 517, y: 122, "text-anchor": "middle", "font-size": 12.5, fill: css("--muted") }, svg, "the sample becomes the next input: roll forward to 15 days");
  }
  function render() {
    const k = obj(), S = sSt(); flow();
    $("#gfAtSteps").disabled = k === "crps";
    $("#gfAtCard").innerHTML = `<h4 style="color:var(--arch)">${CARD[k][0]}</h4><p>${CARD[k][1]}</p>`;
    const W = 460, H = 200, X = lin(-1.9, 1.9, 0, W), Y = lin(-1.25, 1.2, H, 0), svg = svgIn($("#gfAtFig"), W, H); svg.style.overflow = "hidden";
    el("rect", { x: 0, y: 0, width: W, height: H, rx: 10, fill: css("--well") }, svg);
    PTS.forEach(p => el("circle", { cx: X(p[0]), cy: Y(p[1]), r: 2, fill: css("--muted"), opacity: .45 }, svg));
    el("text", { x: X(.95), y: Y(.95), "font-size": 11, fill: css("--muted") }, svg, "possible zₜ₊₁");
    el("circle", { cx: X(Z0[0]), cy: Y(Z0[1]), r: 6, fill: css("--fg") }, svg);
    el("text", { x: X(Z0[0]) + 9, y: Y(Z0[1]) + 4, "font-size": 11.5, fill: css("--fg") }, svg, "zₜ (today)");
    samples.forEach(P => { const n = Math.max(1, Math.round(frame * (P.length - 1))), Q = P.slice(0, n + 1);
      el("path", { d: path(Q.map(p => [X(p[0]), Y(p[1])])), fill: "none", stroke: css("--arch"), "stroke-width": 1.4, opacity: .7 }, svg);
      const e = Q[Q.length - 1]; el("circle", { cx: X(e[0]), cy: Y(e[1]), r: 4.5, fill: css("--arch"), stroke: css("--card"), "stroke-width": 1.2 }, svg); });
    const off = samples.length && frame >= 1 ? samples.filter(P => { const e = P[P.length - 1]; return Math.min(...PTS.map(p => Math.hypot(p[0] - e[0], p[1] - e[1]))) > .1; }).length : null;
    $("#gfAtRead").innerHTML = `<div><span>Passes / sample</span><b class="c-arch">${k === "crps" ? 1 : S}</b></div><div><span>Starts from</span><b>${k === "diff" ? "noise" : "zₜ"}</b></div>` +
      `<div><span>Landed off both regimes</span><b class="${off ? "c-lw" : "c-ok"}">${off == null ? "–" : off + " of " + samples.length}</b></div>`;
  }
  $("#gfAtGo").onclick = () => {
    const k = obj(), S = sSt(); samples = Array.from({ length: 8 }, () => sample(k, S)); frame = 0; clearInterval(timer);
    timer = setInterval(() => { frame = Math.min(1, frame + 1 / 30); render(); if (frame >= 1 || !slide.classList.contains("on")) { clearInterval(timer); frame = 1; } }, 30);
  };
  render(); return render;
});

/* 7 · summary cards + quiz */
demo("gf-quiz", () => {
  const C = [["gf-afno", "--accent", "FourCastNet · 2022", "AFNO: FFT token mixing; 0.25°, 6 h, 20 variables."],
    ["gf-sfno", "--accent", "SFNO · 2023", "Spherical harmonics; 73 channels; stable 1-year rollouts."],
    ["gf-crps", "--data", "FourCastNet 3 · 2025", "Ensembles trained with CRPS + spectral CRPS; 72 variables."],
    ["gf-atlas", "--arch", "Atlas · 2026", "Latent transformer; diffusion, interpolant or CRPS; 15 days."]];
  $("#gfQzCards").innerHTML = C.map(([id, col, t, d]) => `<button class="btn" type="button" data-go="${id}" title="${d}" style="border-color:var(${col});color:var(${col})">← ${t}</button>`).join("");
  VIZ.quiz($("#gfQzBox"), [
    { q: "A deterministic model trained on MSE looks smooth at day 10 because it predicts…", opts: ["a too-coarse grid", "the mean of the possible futures", "too few variables"], right: 1,
      why: "Averaging many sharp but shifted futures cancels the small waves; MSE rewards exactly that average." },
    { q: "What does the FFT across tokens give AFNO that a small convolution does not?", opts: ["Mass conservation", "A global receptive field", "A longer time step"], right: 1,
      why: "Each Fourier mode spans the whole circle, so one per-mode multiplication mixes all longitudes at once." },
    { q: "SFNO replaced the 2-D FFT on the lat-lon grid because that FFT…", opts: ["assumes a flat periodic map", "is slow on GPUs", "limits the channels"], right: 0,
      why: "Poles become edges and the top row wraps to the bottom; the spherical harmonic transform respects the geometry, which helps keep 1-year rollouts stable." },
    { q: "All 16 members of an ensemble are identical. Its CRPS equals…", opts: ["zero", "|x − y|, the absolute error", "half its spread"], right: 1,
      why: "With no spread the ½ E|X − X′| term is zero: CRPS generalises the absolute error." },
    { q: "Atlas trained with CRPS instead of diffusion needs, per sample…", opts: ["one network pass", "many denoising passes", "no latent space"], right: 0,
      why: "A CRPS generator maps noise to a sample in one pass; diffusion needs many passes, which is why FCN3 reports large speed-ups over GenCast." }]);
  return () => {};
});
