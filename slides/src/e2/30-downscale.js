/* ═════════ Earth-2 · section 4: downscaling (CorrDiff) ═════════
   One synthetic "2 km truth" (128 × 128 cells, a toy 2 m temperature) is shared by every slide of the section.
   Toy stand-ins: regression mean μ = truth blurred to the coarse scale; diffusion residual r = a fresh random field with
   the power spectrum of (truth − μ). The diffusion slide samples r with an exact denoiser (Wiener filter).            */
{
  const N = 128, KM = 2, DOM = N * KM;           // cells, km per cell, domain size (km)
  const TOK = { truth: "--fg", near: "--muted", bil: "--cool", mu: "--mag", x: "--sw", avg: "--arch" };

  /* ───── shared toy data (built lazily, cached) ───── */
  const DS = (() => {
    let T = null; const byFac = {};
    function truth() {
      if (T) return T;
      const h0 = FFT.noise2(N, { beta: 3.3, seed: 401 }), h = new Float64Array(N * N);
      const h1 = FFT.noise2(N, { beta: 4.5, seed: 404 });                     // ridged noise: sharp crests, wide valleys
      for (let i = 0; i < N * N; i++) h[i] = Math.pow(1 - Math.min(1, Math.abs(h0[i]) / 2.2), 3) * (0.6 + 0.4 * Math.tanh(h1[i] + 0.5));
      let hm = 0; for (const v of h) hm = Math.max(hm, v);
      for (let i = 0; i < N * N; i++) h[i] *= 2.2 / hm;                         // terrain height 0 … 2.2 km
      const L = FFT.noise2(N, { beta: 4, seed: 402 }), S = FFT.noise2(N, { beta: 2, seed: 403, kmin: 6 });
      const t = h.map((v, i) => 24 - 6.5 * v + 1.4 * L[i] + 0.55 * S[i]);      // lapse rate 6.5 °C/km + weather
      let lo = Infinity, hi = -Infinity; for (const v of t) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      T = { t, h, lo: Math.floor(lo), hi: Math.ceil(hi), spec: FFT.spectrum2(t, N) };
      return T;
    }
    // a random field with the radial power spectrum P (spectrum2 output), zero mean, std sdT
    function shaped(P, seed, sdT) {
      const r = rng(seed), w = new Float64Array(N * N); for (let i = 0; i < N * N; i++) w[i] = gauss(r);
      const F = FFT.fft2(w, N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const kx = i <= N / 2 ? i : i - N, ky = j <= N / 2 ? j : j - N, k = Math.round(Math.hypot(kx, ky)),
        a = k < 1 ? 0 : Math.sqrt(P[Math.min(k, N / 2) - 1][1]); F.re[j * N + i] *= a; F.im[j * N + i] *= a; }
      const x = FFT.fft2(F.re, N, true, F.im).re, m = mean(x), s = sd(x) || 1;
      return x.map(v => (v - m) / s * sdT);
    }
    function fac(f) {
      if (byFac[f]) return byFac[f];
      const t = truth().t, m = N / f, c = FFT.coarsen(t, N, f);
      const near = FFT.upsample(c, m, f, false), bil = FFT.upsample(c, m, f, true), mu = FFT.blur(t, N, f / 2);
      const R = t.map((v, i) => v - mu[i]), PR = FFT.spectrum2(R, N);
      return byFac[f] = { f, m, c, near, bil, mu, R, PR, sR: sd(R), samp: [], specs: {} };
    }
    function sample(F, s) {
      if (!F.samp[s]) { const r = shaped(F.PR, 900 + 31 * s + F.f, F.sR); F.samp[s] = { r, x: F.mu.map((v, i) => v + r[i]) }; }
      return F.samp[s];
    }
    const spec = (F, key, f) => F.specs[key] || (F.specs[key] = FFT.spectrum2(f, N));
    // share of the truth's power at wavenumbers finer than the coarse grid can hold (k > N / 2f)
    function finePower(P, f) { const kc = N / (2 * f), Pt = truth().spec; let a = 0, b = 0;
      for (let k = 1; k <= N / 2; k++) if (k > kc) { a += P[k - 1][1]; b += Pt[k - 1][1]; } return a / b; }
    return { truth, fac, sample, spec, finePower, shaped };
  })();

  const tLeg = (host, lab, w) => VIZ.legend(host, { color: CM.temp, min: DS.truth().lo, max: DS.truth().hi, label: lab || "2 m temperature (°C), toy", width: w || 300 });
  const tMap = (host, v, n, extra = {}) => VIZ.raster(host, v, n, n, Object.assign({ color: CM.temp, lo: DS.truth().lo, hi: DS.truth().hi, round: 6 }, extra));
  const PBW = 190;                                 // max width of the four maps on the first slide
  const pct = v => fmt(100 * v, 0) + "%";
  const lamTicks = [1, 2, 4, 8, 16, 32, 64];
  const lam = k => fmt(DOM / k, 0) + " km";

  /* ───── 1 · the problem: coarsen, then upsample ───── */
  demo("s-downscale", slide => {
    let f = 16, meth = "bil";
    chips($("#dsPbFac"), v => { f = +v; render(); });
    chips($("#dsPbMeth"), v => { meth = v; render(); });
    const row = slider("dsPbRow", v => fmt(v * KM, 0) + " km", render);
    function render() {
      const T = DS.truth(), F = DS.fac(f), up = meth === "bil" ? F.bil : F.near, j = row(), err = up.map((v, i) => v - T.t[i]);
      const line = (n, rr) => (ctx, sx, sy) => { ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = Math.max(2, sx * n / 80); ctx.setLineDash([sx * n / 25, sx * n / 40]);
        ctx.beginPath(); ctx.moveTo(0, (rr + .5) * sy); ctx.lineTo(n * sx, (rr + .5) * sy); ctx.stroke(); ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.stroke(); ctx.restore(); };
      tMap($("#dsPbTruth"), T.t, N, { overlay: line(N, j), maxWidth: PBW });
      tMap($("#dsPbCoarse"), F.c, F.m, { overlay: line(F.m, Math.floor(j / f)), maxWidth: PBW });
      tMap($("#dsPbUp"), up, N, { overlay: line(N, j), maxWidth: PBW });
      VIZ.raster($("#dsPbErr"), err, N, N, { color: CM.div, lo: -4, hi: 4, round: 6, overlay: line(N, j), maxWidth: PBW });
      $("#dsPbCoarseT").textContent = `Coarse input · ${f * KM} km (${F.m} × ${F.m})`;
      $("#dsPbUpT").textContent = (meth === "bil" ? "Bilinear" : "Nearest") + " back to 2 km";
      tLeg($("#dsPbLeg1"), "2 m T (°C), toy", 260); VIZ.legend($("#dsPbLeg2"), { color: CM.div, min: -4, max: 4, label: "error (°C)", width: 260 });
      const pt = Array.from({ length: N }, (_, i) => [(i + .5) * KM, T.t[j * N + i]]), pu = Array.from({ length: N }, (_, i) => [(i + .5) * KM, up[j * N + i]]);
      let lo = Infinity, hi = -Infinity; pt.concat(pu).forEach(p => { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
      const sp = hi - lo; lo = Math.floor(lo - .1 * sp); hi = Math.ceil(hi + .45 * sp);
      VIZ.curves($("#dsPbFig"), [{ pts: pt, col: TOK.truth, label: "truth (2 km)", w: 1.6 }, { pts: pu, col: TOK[meth], label: (meth === "bil" ? "bilinear" : "nearest") + " from " + f * KM + " km", w: 2.4 }],
        { xr: [0, DOM], yr: [lo, hi], xl: "distance along the row (km)", yl: "°C", W: 540, H: 128, xt: [0, 64, 128, 192, 256], xf: v => fmt(v, 0), yf: v => fmt(v, 0), legendAt: "tl" });
      const P = DS.spec(F, meth, up), e = Math.sqrt(mean(err.map(v => v * v)));
      let mx = 0; for (const v of err) mx = Math.max(mx, Math.abs(v));
      $("#dsPbRead").innerHTML = `<div><span>RMSE</span><b>${fmt(e, 2)} °C</b></div><div><span>Max |error|</span><b class="c-lw">${fmt(mx, 1)} °C</b></div><div><span>Fine-scale power kept</span><b class="c-sw">${pct(DS.finePower(P, f))}</b></div>`;
    }
    render(); return render;
  });

  /* ───── 2 · CorrDiff step by step ───── */
  demo("ds-steps", slide => {
    const f = 16; let stage = 0, seed = 0;
    chips($("#dsStStage"), v => { stage = +v; render(); });
    chips($("#dsStSeed"), v => { seed = +v; render(); });
    const TXT = [
      ["1 · The coarse input", "A 25 km field, e.g. ERA5 (here: the toy truth block-averaged to 32 km, 8 × 8 cells). For Taiwan the real input has 12 channels on a 36 × 36 grid. It fixes the large scale but says nothing about what happens inside each cell."],
      ["2 · Regression UNet → mean μ", "A <b>UNet</b> trained with mean-squared error predicts the <b>conditional mean</b> μ = E[2 km field | input]: the best single guess. MSE punishes a detail placed in the wrong spot twice (once where it is, once where it should have been), so the network learns to leave uncertain detail out. μ is smooth. <i>Toy: the truth blurred.</i>"],
      ["3 · Diffusion → residual r", "A diffusion model (<b>EDM</b>) learns the distribution of the residual r = truth − μ: zero mean, mostly small scales, roughly the same statistics everywhere, which is easier to learn than the full field. It draws r from noise by repeated denoising (next slide). <i>Toy: a random field with the true residual's spectrum.</i>"],
      ["4 · Sample x = μ + r", "Large scales from the regression, small scales from the diffusion sample. The field now looks like weather. Its RMSE is a little <i>worse</i> than μ's, because a sharp detail in a slightly wrong place is penalised twice: the price of realism."],
      ["5 · Several samples", "Each new noise draw gives another equally plausible residual. The samples agree on the large scale (it comes from μ) and differ in the details: an ensemble that says how uncertain the small scales are. Their average is μ again."]];
    const BOX = [ // [x, y, w, label, sub, stages where active, col]
      [4, 8, 112, "Coarse input", "25 km, 12 ch.", [0, 1, 2], "--fg"], [150, 8, 130, "Regression UNet", "MSE loss", [1], "--mag"], [314, 8, 92, "Mean μ", "smooth", [1, 3, 4], "--mag"],
      [4, 78, 112, "Noise", "Gaussian", [2], "--muted"], [150, 78, 130, "Diffusion (EDM)", "denoise in steps", [2], "--sw"], [314, 78, 92, "Residual r", "fine detail", [2, 3, 4], "--sw"],
      [452, 43, 104, "Sample μ + r", "2 km, 4 outputs", [3, 4], "--sw"]];
    function flow() {
      const W = 560, H = 128, svg = svgIn($("#dsStFlow"), W, H); arrowDefs(svg, "dsStAr", css("--muted"));
      const ar = (x1, y1, x2, y2, d) => el("path", { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: css("--muted"), "stroke-width": 1.4, fill: "none", "marker-end": "url(#dsStAr)", "stroke-dasharray": d || "" }, svg);
      ar(116, 28, 148, 28); ar(280, 28, 312, 28); ar(116, 98, 148, 98); ar(280, 98, 312, 98); ar(406, 28, 450, 56); ar(406, 98, 450, 74);
      ar(70, 48, 168, 76, "3 3"); el("text", { x: 92, y: 68, "text-anchor": "end", "font-size": 9.5, fill: css("--muted") }, svg, "condition");
      BOX.forEach(([x, y, w, t, s, st, col]) => { const on = st.includes(stage), c = css(col);
        el("rect", { x, y, width: w, height: 40, rx: 9, fill: on ? c : css("--card"), "fill-opacity": on ? .16 : 1, stroke: on ? c : css("--line"), "stroke-width": on ? 2.2 : 1.1 }, svg);
        el("text", { x: x + w / 2, y: y + 17, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: on ? c : css("--muted") }, svg, t);
        el("text", { x: x + w / 2, y: y + 32, "text-anchor": "middle", "font-size": 9.5, fill: css("--muted") }, svg, s); });
      if (stage === 4) el("text", { x: 504, y: 100, "text-anchor": "middle", "font-size": 10.5, fill: css("--sw") }, svg, "× 4 noise draws");
    }
    function render() {
      const T = DS.truth(), F = DS.fac(f), S = DS.sample(F, seed), host = $("#dsStNow");
      flow();
      $("#dsStCard").innerHTML = `<h4>${TXT[stage][0]}</h4><p style="font-size:14px">${TXT[stage][1]}</p>`;
      $("#dsStSeed").style.opacity = stage === 2 || stage === 3 ? 1 : .45;
      tMap($("#dsStTruth"), T.t, N);
      const rl = 3 * F.sR;
      const titles = ["Coarse input · 32 km", "Regression mean μ", "Residual r (draw " + "ABCD"[seed] + ")", "Sample μ + r (draw " + "ABCD"[seed] + ")", "Four samples A–D"];
      $("#dsStNowT").textContent = titles[stage];
      let field = null, P = null;
      if (stage === 0) { tMap(host, F.c, F.m); field = F.near; P = DS.spec(F, "near", F.near); }
      if (stage === 1) { tMap(host, F.mu, N); field = F.mu; P = DS.spec(F, "mu", F.mu); }
      if (stage === 2) { VIZ.raster(host, S.r, N, N, { color: CM.div, lo: -rl, hi: rl, round: 6 }); P = DS.spec(F, "r" + seed, S.r); }
      if (stage === 3) { tMap(host, S.x, N); field = S.x; P = DS.spec(F, "x" + seed, S.x); }
      if (stage === 4) { host.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${[0, 1, 2, 3].map(s => `<div id="dsStQ${s}"></div>`).join("")}</div>`;
        [0, 1, 2, 3].forEach(s => tMap($("#dsStQ" + s), DS.sample(F, s).x, N, { round: 4 })); }
      if (stage === 2) VIZ.legend($("#dsStLeg"), { color: CM.div, min: -rl, max: rl, digits: 1, label: "residual (°C)", width: 300 });
      else tLeg($("#dsStLeg"));
      const rmse = a => Math.sqrt(mean(a.map((v, i) => (v - T.t[i]) ** 2)));
      let html = "";
      if (field) html = `<div><span>RMSE vs truth</span><b>${fmt(rmse(field), 2)} °C</b></div><div><span>Fine-scale power kept</span><b class="c-sw">${pct(DS.finePower(P, f))}</b></div>`;
      if (stage === 0) html += `<div><span>Shown as</span><b style="font-size:16px">8 × 8 cells</b></div>`;
      if (stage === 2) html = `<div><span>Std of r</span><b class="c-sw">${fmt(sd(S.r), 2)} °C</b></div><div><span>Mean of r</span><b>${fmt(mean(S.r), 2)} °C</b></div><div><span>Fine-scale power</span><b class="c-sw">${pct(DS.finePower(P, f))}</b></div>`;
      if (stage === 4) { const xs = [0, 1, 2, 3].map(s => DS.sample(F, s)), big = xs.map(s => FFT.blur(s.x, N, 8));
        let cb = 0, cf = 0, n = 0; for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { cb += corr(big[a], big[b]); cf += corr(xs[a].r, xs[b].r); n++; }
        html = `<div><span>Corr. between samples, large scale</span><b class="c-ok">${fmt(cb / n, 2)}</b></div><div><span>… fine scale</span><b class="c-lw">${fmt(cf / n, 2)}</b></div>`; }
      $("#dsStRead").innerHTML = html;
    }
    render(); return render;
  });

  /* ───── 3 · diffusion toy: sample the residual from noise with an exact denoiser ───── */
  demo("ds-diff", slide => {
    const f = 16, F = DS.fac(f), sR = F.sR, SMAX = 40, SMIN = 0.01;           // σ in units of the residual std
    // per-coefficient signal power A² (same radial shape as the true residual), scaled so the field has std sR
    const A2 = new Float64Array(N * N), KK = new Int32Array(N * N); let tot = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const kx = i <= N / 2 ? i : i - N, ky = j <= N / 2 ? j : j - N, k = Math.round(Math.hypot(kx, ky)), q = j * N + i;
      KK[q] = k; A2[q] = k < 1 ? 0 : F.PR[Math.min(k, N / 2) - 1][1]; tot += A2[q]; }
    for (let q = 0; q < N * N; q++) A2[q] *= sR * sR * N * N / tot;
    const A2r = Array.from({ length: N / 2 }, (_, k) => F.PR[k][1] * sR * sR * N * N / tot);   // radial, k = 1 … N/2
    const denoise = (x, s) => { const X = FFT.fft2(x, N), s2 = s * s; for (let q = 0; q < N * N; q++) { const g = A2[q] / (A2[q] + s2); X.re[q] *= g; X.im[q] *= g; } return FFT.fft2(X.re, N, true, X.im).re; };
    let nSt = 18, seed = 1, view = "r", traj = null, timer = null;
    const sched = n => { const a = Math.pow(SMAX * sR, 1 / 7), b = Math.pow(SMIN * sR, 1 / 7); return Array.from({ length: n }, (_, i) => Math.pow(a + i / (n - 1) * (b - a), 7)).concat([0]); };
    function run() {
      const sg = sched(nSt), r = rng(7000 + seed); let x = new Float64Array(N * N); for (let q = 0; q < N * N; q++) x[q] = sg[0] * gauss(r);
      traj = [];
      for (let i = 0; i < nSt; i++) { const D = denoise(x, sg[i]); traj.push({ x, D, s: sg[i] });
        const nx = new Float64Array(N * N), h = (sg[i + 1] - sg[i]) / sg[i]; for (let q = 0; q < N * N; q++) nx[q] = x[q] + h * (x[q] - D[q]); x = nx; }
      traj.push({ x, D: x, s: 0 });
    }
    const st = $("#dsDfStep"), stO = st.parentElement.querySelector("output");
    const step = slider("dsDfStep", v => v + " / " + nSt, () => { stop(); render(); });
    const setStep = v => { st.max = nSt; st.value = v; stO.textContent = v + " / " + nSt; };
    chips($("#dsDfN"), v => { nSt = +v; stop(); traj = null; setStep(0); render(); });
    chips($("#dsDfView"), v => { view = v; render(); });
    $("#dsDfNew").onclick = () => { seed++; stop(); traj = null; setStep(0); render(); };
    function stop() { if (timer) { clearInterval(timer); timer = null; } $("#dsDfPlay").textContent = "▶ Play"; }
    $("#dsDfPlay").onclick = () => {
      if (timer) { stop(); return; }
      if (step() >= nSt) setStep(0);
      $("#dsDfPlay").textContent = "❚❚ Pause"; render();
      timer = setInterval(() => { if (!slide.classList.contains("on") || step() >= nSt) { stop(); return; } setStep(step() + 1); render(); }, Math.max(90, 2400 / nSt));
    };
    function render() {
      if (!traj) run();
      const i = Math.min(step(), nSt), S = traj[i], fin = traj[nSt].x, rl = 3 * sR, tot2 = Math.sqrt(sR * sR + S.s * S.s);
      const xs = S.x.map(v => v * sR / tot2), Dv = view === "x" ? S.D.map((v, q) => v + F.mu[q]) : S.D, Fv = view === "x" ? fin.map((v, q) => v + F.mu[q]) : fin;
      VIZ.raster($("#dsDfX"), xs, N, N, { color: CM.div, lo: -rl, hi: rl, round: 6 });
      if (view === "x") { tMap($("#dsDfD"), Dv, N); tMap($("#dsDfF"), Fv, N); }
      else { VIZ.raster($("#dsDfD"), Dv, N, N, { color: CM.div, lo: -rl, hi: rl, round: 6 }); VIZ.raster($("#dsDfF"), Fv, N, N, { color: CM.div, lo: -rl, hi: rl, round: 6 }); }
      const sg = traj.slice(0, nSt).map((t, k) => [k, t.s / sR]);
      VIZ.curves($("#dsDfSched"), [{ pts: sg, col: "--sw", label: "σ / std(r)", w: 2.2 }, { pts: [[0, 1], [nSt, 1]], col: "--muted", dash: "4 4", label: "σ = signal std", w: 1.2 }],
        { xr: [0, nSt], yr: [SMIN, 400], logy: true, yt: [0.01, 0.1, 1, 10, 100], yf: v => v >= 1 ? fmt(v, 0) : v >= 0.1 ? fmt(v, 1) : fmt(v, 2), xt: [0, Math.round(nSt / 2), nSt], xf: v => fmt(v, 0),
          xl: "step i", W: 460, H: 128, marks: [[i, i < nSt ? "now: σ = " + fmt(S.s / sR, S.s / sR < 1 ? 2 : 1) : "done: σ = 0", "--lw"]], legendAt: "bl" });
      const g = A2r.map((a, k) => [k + 1, S.s ? a / (a + S.s * S.s) : 1]);
      VIZ.curves($("#dsDfGain"), [{ pts: g, col: "--sw", label: "share of x that D keeps", w: 2.4 }],
        { xr: [1, N / 2], yr: [0, 1], logx: true, xt: lamTicks, xf: lam, yt: [0, .5, 1], yf: v => fmt(v, 1), xl: "wavelength", W: 540, H: 108, legendAt: "tr", marks: [[N / (2 * f), "coarse-grid limit", "--muted"]] });
      $("#dsDfRead").innerHTML = `<div><span>Step</span><b>${i} / ${nSt}</b></div><div><span style="text-transform:none">σ / std(r)</span><b class="c-sw">${S.s ? fmt(S.s / sR, S.s / sR < 1 ? 2 : 1) : "0"}</b></div><div><span>Corr. guess vs final</span><b class="c-ok">${fmt(corr(S.D, fin), 2)}</b></div>`;
    }
    setStep(0); render(); return render;
  });

  /* ───── 4 · power spectra ───── */
  demo("ds-spec", slide => {
    let f = 16; const on = { truth: true, bil: true, mu: true, x: true, avg: false };
    $$("#dsSpShow button").forEach(b => b.addEventListener("click", () => { on[b.dataset.s] = !on[b.dataset.s]; b.setAttribute("aria-pressed", on[b.dataset.s]); render(); }));
    chips($("#dsSpFac"), v => { f = +v; render(); });
    const nS = slider("dsSpN", v => String(v), render);
    function render() {
      const T = DS.truth(), F = DS.fac(f), n = nS(), S0 = DS.sample(F, 0), avg = new Float64Array(N * N);
      for (let s = 0; s < n; s++) { const x = DS.sample(F, s).x; for (let q = 0; q < N * N; q++) avg[q] += x[q] / n; }
      const P = { truth: T.spec, bil: DS.spec(F, "bil", F.bil), mu: DS.spec(F, "mu", F.mu), x: DS.spec(F, "x0", S0.x), avg: DS.spec(F, "avg" + n, avg) };
      const LAB = { truth: "truth", bil: "bilinear", mu: "regression μ", x: "μ + r (one sample)", avg: `mean of ${n} sample${n > 1 ? "s" : ""}` };
      const top = Math.max(...T.spec.map(p => p[1])), yr = [top * 1e-7, top * 3];
      const ser = Object.keys(P).filter(k => on[k]).map(k => ({ pts: P[k].map(([k2, p]) => [k2, Math.max(p, yr[0])]), col: TOK[k], label: LAB[k], w: k === "truth" ? 3 : 2, dash: k === "avg" ? "5 4" : "" }));
      VIZ.curves($("#dsSpFig"), ser, { xr: [1, N / 2], yr, logx: true, logy: true, xt: lamTicks, xf: lam, yt: [yr[0], top * 1e-5, top * 1e-3, top * 1e-1], yf: v => "10" + sup(Math.round(Math.log10(v / top))),
        xl: "wavelength (log) → finer", yl: "power (relative)", W: 560, H: 250, legendAt: "bl", marks: [[N / (2 * f), "coarse-grid limit (" + 2 * f * KM + " km)", "--lw"]] });
      tMap($("#dsSpMu"), F.mu, N, { round: 4 }); tMap($("#dsSpOne"), S0.x, N, { round: 4 }); tMap($("#dsSpAvg"), avg, N, { round: 4 });
      $("#dsSpAvgT").textContent = `Mean of ${n} sample${n > 1 ? "s" : ""}`;
      const rm = a => Math.sqrt(mean(a.map((v, q) => (v - T.t[q]) ** 2)));
      const rows = [["bilinear", F.bil, "bil"], ["regression μ", F.mu, "mu"], ["one sample μ + r", S0.x, "x"], [`mean of ${n} sample${n > 1 ? "s" : ""}`, avg, "avg"]];
      $("#dsSpCalc").innerHTML = `<span class="k">field                  RMSE °C   fine power kept</span>\n` +
        rows.map(([l, a, k]) => `<span style="color:var(${TOK[k]})">${l.padEnd(22)}</span> ${fmt(rm(a), 2).padStart(6)}    ${pct(DS.finePower(P[k], f)).padStart(5)}`).join("\n");
    }
    const sup = e => String(e).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c] ?? (c === "-" ? "⁻" : c)).join("");
    render(); return render;
  });

  /* ───── 5 · variants and users ───── */
  demo("ds-var", slide => {
    const V = {
      tw: { t: "CorrDiffTaiwan · the original", d: "ERA5 at 25 km → 2 km over Taiwan, trained on CWA-WRF regional runs (2018–2020; tested on 2021). 36 × 36 input points → 448 × 448 output points: about 155× more points. 12 input channels; 4 outputs. The radar reflectivity is <b>not an input</b>: the model generates a field the coarse data never contained, learned as a function of the large-scale state.",
        inp: ["ERA5", "25 km", "36 × 36 · 12 channels"], out: ["CWA-WRF-like", "2 km", "448 × 448"], vars: [["2 m temperature", 1], ["10 m wind u", 1], ["10 m wind v", 1], ["1-h max radar reflectivity", 0]] },
      hrrr: { t: "CorrDiffEra5Hrrr", d: "0.25° ERA5 → 3 km, trained to reproduce NOAA's HRRR (High-Resolution Rapid Refresh) model over the contiguous US (CONUS). Hugging Face: nvidia/corrdiff-era5-hrrr.",
        inp: ["ERA5", "0.25°", "global reanalysis"], out: ["HRRR-like", "3 km", "CONUS"], vars: null },
      cosmo: { t: "CorrDiffCosmoEra5", d: "ERA5 → COSMO-REA, the regional reanalysis made with the COSMO model, over Europe. Hugging Face: nvidia/corrdiff-cosmo-era5.",
        inp: ["ERA5", "0.25°", "global reanalysis"], out: ["COSMO-REA-like", "km-scale", "Europe"], vars: null },
      sda: { t: "CorrDiffCosmoEra5SDA", d: "The COSMO variant with <b>score-based data assimilation</b>: the diffusion model's denoiser (its score) is also steered toward local observations while sampling, so the km-scale field can respect station data.",
        inp: ["ERA5 + observations", "0.25°", "Europe"], out: ["COSMO-REA-like", "km-scale", "Europe"], vars: null },
      cmip: { t: "CorrDiffCMIP6", d: "CMIP6 climate-model output → ERA5-like fields. Same recipe, different job: a climate projection is mapped onto what the reanalysis would look like, so impact studies can use future scenarios. Hugging Face: nvidia/corrdiff-cmip6-era5.",
        inp: ["CMIP6", "climate model", "scenarios"], out: ["ERA5-like", "0.25°", "global"], vars: null } };
    const U = [["Israel Meteorological Service", "CorrDiff in operation. NVIDIA reports 90% less compute time at 2.5 km vs classic NWP on a CPU cluster.", "--sw"],
      ["Taiwan Central Weather Administration", "Named as an adopter; CorrDiff was first trained on CWA-WRF runs over Taiwan.", "--sw"],
      ["S&P Global Energy", "CorrDiff for climate-risk analysis.", "--mag"],
      ["Eni", "Testing FourCastNet and CorrDiff for downscaling and gas demand.", "--mag"]];
    $("#dsVaUsers").innerHTML = U.map(([n, d, c]) => `<div class="card" style="padding:8px 10px;border-left:4px solid var(${c})"><h4 style="margin:0 0 3px;font-size:14px">${n}</h4><p style="margin:0;font-size:12.5px;line-height:1.4">${d}</p></div>`).join("");
    let v = "tw";
    chips($("#dsVaPick"), x => { v = x; render(); });
    function render() {
      const s = V[v];
      $("#dsVaCard").innerHTML = `<h4 style="color:var(--sw)">${s.t}</h4><p style="font-size:14px;margin:0">${s.d}</p>`;
      const W = 520, H = s.vars ? 190 : 100, svg = svgIn($("#dsVaFig"), W, H); arrowDefs(svg, "dsVaAr", css("--muted"));
      const box = (x, [a, b, c], col) => { el("rect", { x, y: 6, width: 150, height: 86, rx: 10, fill: css("--card"), stroke: css(col), "stroke-width": 1.6 }, svg);
        el("text", { x: x + 75, y: 32, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css(col) }, svg, a);
        el("text", { x: x + 75, y: 54, "text-anchor": "middle", "font-size": 13, class: "mono", fill: css("--fg") }, svg, b);
        el("text", { x: x + 75, y: 74, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, c); };
      box(0, s.inp, "--muted"); box(W - 150, s.out, "--sw");
      el("rect", { x: W / 2 - 53, y: 30, width: 106, height: 38, rx: 19, fill: css("--sw"), "fill-opacity": .16, stroke: css("--sw") }, svg);
      el("text", { x: W / 2, y: 54, "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: css("--sw") }, svg, "CorrDiff");
      el("line", { x1: 152, x2: W / 2 - 55, y1: 49, y2: 49, stroke: css("--muted"), "stroke-width": 1.5, "marker-end": "url(#dsVaAr)" }, svg);
      el("line", { x1: W / 2 + 55, x2: W - 154, y1: 49, y2: 49, stroke: css("--muted"), "stroke-width": 1.5, "marker-end": "url(#dsVaAr)" }, svg);
      if (s.vars) { el("text", { x: 0, y: 116, "font-size": 11.5, fill: css("--muted") }, svg, "Outputs (4):");
        s.vars.forEach(([n, inInput], k) => { const x = (k % 2) * 262, y = 124 + Math.floor(k / 2) * 32;
          el("rect", { x, y, width: 258, height: 26, rx: 13, fill: inInput ? css("--card") : css("--lw"), "fill-opacity": inInput ? 1 : .14, stroke: css(inInput ? "--line" : "--lw"), "stroke-width": inInput ? 1 : 1.8 }, svg);
          el("text", { x: x + 129, y: y + 17, "text-anchor": "middle", "font-size": 12, "font-weight": inInput ? 400 : 600, fill: css(inInput ? "--fg" : "--lw") }, svg, n + (inInput ? "" : " · not in input")); }); }
    }
    render(); return render;
  });

  /* ───── 6 · speed claims and their baselines ───── */
  demo("ds-speed", slide => {
    const C = [
      { s: "Paper, arXiv:2309.15214 v4", speed: 22, energy: 1300, pre: "at least", base: "WRF on 928 CPU cores (the regional physics model that made the training data).", kind: "peer-reviewed paper", col: "--sw" },
      { s: "NVIDIA blog, Jun 2024", speed: 1000, energy: 3000, pre: "", base: "Not stated next to the figure in our sources: check the original post before quoting.", kind: "vendor blog", col: "--mag" },
      { s: "SC24 NIM / Earth-2 page", speed: 500, energy: 10000, pre: "", base: "Not stated next to the figure in our sources: check the original page before quoting.", kind: "vendor product page", col: "--mag" },
      { s: "NVIDIA blog, Jan 2026", speed: 500, energy: null, pre: "up to", base: "Not stated next to the figure in our sources. “Up to” marks a best case.", kind: "vendor blog", col: "--mag" },
      { s: "Israel Met. Service (Jan 2026 blog)", speed: 10, energy: null, pre: "90% less time =", base: "Classic NWP on a CPU cluster at 2.5 km, in operation. A 90% reduction in compute time means a factor of 10.", kind: "user report, via vendor blog", col: "--ok" }];
    let m = "speed", sc = "log", sel = 0;
    chips($("#dsSpdM"), v => { m = v; render(); });
    chips($("#dsSpdScale"), v => { sc = v; render(); });
    function render() {
      const W = 560, rowH = 46, lw = 200, H = C.length * rowH + 30, svg = svgIn($("#dsSpdFig"), W, H), x0 = lw, x1 = W - 70, mx = 10000;
      const X = v => sc === "log" ? x0 + (Math.log10(v)) / Math.log10(mx) * (x1 - x0) : x0 + v / mx * (x1 - x0);
      (sc === "log" ? [1, 10, 100, 1000, 10000] : [0, 2500, 5000, 7500, 10000]).forEach(t => { const x = sc === "log" && t === 1 ? x0 : X(t);
        el("line", { x1: x, x2: x, y1: 4, y2: H - 22, class: "grid" }, svg);
        el("text", { x, y: H - 6, "text-anchor": "middle", "font-size": 11, class: "mono mut" }, svg, fmtN(t) + "×"); });
      C.forEach((c, k) => { const y = 6 + k * rowH, v = c[m], g = el("g", { style: "cursor:pointer" }, svg), on = k === sel;
        el("rect", { x: 0, y: y - 2, width: W, height: rowH - 4, rx: 8, fill: on ? css("--sw") : "transparent", "fill-opacity": on ? .1 : 0 }, g);
        el("text", { x: lw - 10, y: y + 17, "text-anchor": "end", "font-size": 12.5, "font-weight": on ? 600 : 400, fill: css("--fg") }, g, c.s);
        el("text", { x: lw - 10, y: y + 32, "text-anchor": "end", "font-size": 10.5, fill: css("--muted") }, g, c.kind);
        if (v) { const w = Math.max(X(v) - x0, 1.5);
          el("rect", { x: x0, y: y + 8, width: w, height: 22, rx: 4, fill: css(c.col), opacity: .85 }, g);
          el("text", { x: x0 + w + 6, y: y + 24, "font-size": 12, class: "mono", fill: css("--fg") }, g, (m === "speed" && c.pre ? c.pre + " " : "") + fmtN(v) + "×"); }
        else el("text", { x: x0 + 6, y: y + 24, "font-size": 11.5, fill: css("--muted") }, g, "no " + (m === "speed" ? "speed" : "energy") + " figure given");
        g.addEventListener("click", () => { sel = k; render(); }); });
      const c = C[sel];
      $("#dsSpdCard").innerHTML = `<h4 style="color:var(${c.col})">${c.s}</h4><p style="font-size:14px;margin:0 0 4px"><b>Speed:</b> ${c.pre ? c.pre + " " : ""}${fmtN(c.speed)}× &nbsp; <b>Energy efficiency:</b> ${c.energy ? fmtN(c.energy) + "×" : "not given"}</p><p style="font-size:14px;margin:0"><b>Baseline:</b> ${c.base}</p>`;
    }
    render(); return render;
  });

  /* ───── 7 · quiz ───── */
  demo("ds-quiz", () => {
    const Q = [
      { q: "Why can't bilinear interpolation of a 25 km field give a realistic 2 km field?", opts: ["It adds no variance below the coarse grid scale", "It is too slow", "It shifts the mean"], right: 0,
        why: "Interpolation only blends known coarse values; its spectrum falls off past the coarse-grid limit." },
      { q: "CorrDiff's regression UNet, trained with MSE, outputs…", opts: ["one plausible 2 km field", "the conditional mean: smooth", "the input, copied to 2 km"], right: 1,
        why: "MSE is minimised by the average of all plausible fields: lowest RMSE, but averaging washes out uncertain small-scale detail." },
      { q: "What does the diffusion model generate in CorrDiff?", opts: ["The full 2 km field", "The coarse input", "The residual r = truth − μ"], right: 2,
        why: "The residual has zero mean and mostly small scales, so it is easier to learn; the large scale stays anchored to the regression mean." },
      { q: "You average 8 CorrDiff samples. The result…", opts: ["has the best spectrum", "looks like μ again", "is the truth"], right: 1,
        why: "The residuals are independent draws; averaging cancels them, so the result is smooth again, with lower RMSE and little fine-scale power." },
      { q: "One source says CorrDiff is at least 22× faster than WRF, another says 1,000×. Best reading?", opts: ["One is false", "Average them", "Quote each with its baseline"], right: 2,
        why: "A ratio depends on its baseline and setup. The 22× (peer-reviewed) is against WRF on 928 CPU cores; check what each vendor figure is compared with before quoting it. A ratio means nothing without its denominator." }];
    VIZ.quiz($("#dsQzBox1"), Q.slice(0, 1)); VIZ.quiz($("#dsQzBox2"), Q.slice(1));
  });
}
