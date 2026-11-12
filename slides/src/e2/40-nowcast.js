/* ═════════ Earth-2 · section 5: nowcasting and km-scale (StormCast, StormScope) ═════════
   Everything sits in a block so that helper names do not collide with other sections. */
{
  /* ───────── the toy storm world ─────────
     96 × 96 px of 4 km, one frame every 10 min. Cells move with a steering wind (+ own drift), grow and decay with
     a sin-shaped life cycle, and initiate at random (Poisson in time), more often where a smooth "environment" field
     is high. Frame t is a reflectivity-like field in dBZ (linear Z of the cells summed, then 10 log10). */
  const N = 96, KM = 4, DT = 10, PAD = 50, LEAD = 36;
  const ENVS = {}, TEX = {};
  // FFT.noise2 needs a power-of-two size: make 128 × 128 and keep the top-left 96 × 96
  const crop = f => { const o = new Float64Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) o[j * N + i] = f[j * 128 + i]; return o; };
  const envOf = seed => ENVS[seed] || (ENVS[seed] = crop(FFT.noise2(128, { beta: 4, seed: 500 + seed })));
  const texOf = seed => TEX[seed] || (TEX[seed] = crop(FFT.noise2(128, { beta: 1.6, seed: 900 + seed, kmin: 5 })));
  const wrap = v => ((Math.round(v) % N) + N) % N;
  const envAt = (env, x, y) => env[wrap(y) * N + wrap(x)];
  const lifeDraw = R => 12 + Math.round(18 * Math.pow(R(), 1.2));          // 2–5 h, more short-lived cells
  const pois = (R, lam) => { let k = 0, p = Math.exp(-lam), s = p; const x = R(); while (x > s && k < 50) { k++; p *= lam / k; s += p; } return k; };
  const clock = k => { const m = k * DT, a = Math.abs(m); return (m < 0 ? "−" : "+") + Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0") + " h"; };
  const leadTxt = k => { const m = k * DT; return m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); };

  // a random initiation point in the padded box, accepted more often where the environment is favourable
  function spot(R, env) { let x, y;
    for (let k = 0; k < 60; k++) { x = -PAD + R() * (N + 2 * PAD); y = -PAD + R() * (N + 2 * PAD); if (R() < sigm(3.5 * envAt(env, x, y) - 2)) break; }
    return [x, y]; }
  function newCell(R, env, t, u, v, id) { const [x, y] = spot(R, env);
    return { id, x0: x, y0: y, tb: t, L: lifeDraw(R), A: 38 + 22 * R(), r: 3 + 3.2 * R(), u: u + 0.22 * gauss(R), v: v + 0.22 * gauss(R) }; }

  // a world: cell list from frame −48 to +40; wind towards the east-north-east, direction set by the seed
  function world(seed, kmh = 40, rate = 1.8) {
    const R = rng(seed * 7919 + 13), env = envOf(seed), dir = (8 + 40 * R()) * Math.PI / 180, sp = kmh / 60 * DT / KM;
    const u = sp * Math.cos(dir), v = -sp * Math.sin(dir), cells = [];
    for (let t = -48; t <= LEAD + 4; t++) { const n = pois(R, rate); for (let c = 0; c < n; c++) cells.push(newCell(R, env, t, u, v, cells.length)); }
    return { seed, kmh, rate, u, v, cells, env, tex: texOf(seed), cache: {} };
  }
  // state of a cell at frame t: position, intensity (dBZ), radius (px); I = 0 outside its life
  function state(c, t) { const a = t - c.tb, x = c.x0 + c.u * a, y = c.y0 + c.v * a;
    if (a < 0 || a > c.L) return { x, y, I: 0, r: c.r, a };
    const s = Math.max(0, Math.sin(Math.PI * a / c.L)); return { x, y, I: c.A * Math.pow(s, 0.35), r: c.r * (0.75 + 0.25 * s), a, s }; }
  // paint states [{x, y, I, r}] into a dBZ field; tex (optional) adds a few dBZ of texture that moves with the wind
  function paint(list, tex = null, sh = [0, 0]) {
    const Z = new Float32Array(N * N), out = new Float32Array(N * N);
    for (const c of list) { if (c.I < 3) continue; const R3 = 3 * c.r, z0 = Math.pow(10, c.I / 10), inv = 1 / (c.r * c.r);
      const i0 = Math.max(0, Math.floor(c.x - R3)), i1 = Math.min(N - 1, Math.ceil(c.x + R3)), j0 = Math.max(0, Math.floor(c.y - R3)), j1 = Math.min(N - 1, Math.ceil(c.y + R3));
      for (let j = j0; j <= j1; j++) { const dy = j + .5 - c.y; for (let i = i0; i <= i1; i++) { const dx = i + .5 - c.x; Z[j * N + i] += z0 * Math.exp(-(dx * dx + dy * dy) * inv); } } }
    for (let k = 0; k < N * N; k++) { let d = Z[k] > 1 ? 10 * Math.log10(Z[k]) : 0;
      if (tex && d > 12) { const i = k % N, j = (k - i) / N; d = Math.max(0, d + 1.5 * tex[wrap(j - sh[1]) * N + wrap(i - sh[0])]); }
      out[k] = d; }
    return out; }
  const truthStates = (W, t) => W.cells.map(c => state(c, t)).filter(s => s.I > 0);
  const frame = (W, t) => W.cache[t] || (W.cache[t] = paint(truthStates(W, t), W.tex, [W.u * t, W.v * t]));
  const inView = (s, m = 0) => s.x > -m && s.x < N + m && s.y > -m && s.y < N + m;

  /* toy "satellite": cloud fraction from each cell, wider than its echo, starting 3 frames (30 min) before the rain
     and keeping an anvil 4 frames after; shown as an IR brightness temperature (K) */
  function satellite(W, t) {
    const C = new Float32Array(N * N).fill(1);
    for (const c of W.cells) { const a = t - c.tb; if (a < -3 || a > c.L + 4) continue;
      const g = a < 0 ? 0.25 + 0.55 * (a + 3) / 3 : a <= c.L ? 0.8 + 0.18 * Math.sin(Math.PI * a / c.L) : 0.9 * (1 - (a - c.L) / 5);
      const rr = c.r * (a < 0 ? 1.1 + 0.3 * (a + 3) / 3 : a <= c.L ? 1.6 + 0.9 * a / c.L : 2.5), x = c.x0 + c.u * a, y = c.y0 + c.v * a, R3 = 2.6 * rr, inv = 1 / (rr * rr);
      const i0 = Math.max(0, Math.floor(x - R3)), i1 = Math.min(N - 1, Math.ceil(x + R3)), j0 = Math.max(0, Math.floor(y - R3)), j1 = Math.min(N - 1, Math.ceil(y + R3));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d2 = (i + .5 - x) ** 2 + (j + .5 - y) ** 2; C[j * N + i] *= 1 - g * Math.exp(-d2 * inv * 0.8); } }
    const bt = new Float32Array(N * N); for (let k = 0; k < N * N; k++) bt[k] = 295 - 90 * (1 - C[k]); return bt; }

  /* ───────── shared drawing bits ───────── */
  const DBZ = { color: CM.precip, lo: 10, hi: 60, mask: v => v < 10 };
  const IR0 = CM.ramp(["#3a3a3a", "#6b6b6b", "#a3a3a3", "#d8d8d8", "#ffffff", "#9fd6f5", "#3b82c4"]), IR = v => IR0(1 - v);   // warm = dark, cold tops = white/blue
  const lum = c => { const d = document.createElement("canvas").getContext("2d"); d.fillStyle = c; d.fillRect(0, 0, 1, 1); const p = d.getImageData(0, 0, 1, 1).data; return 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]; };
  // outline the set of pixels where test(k) is true, on a VIZ.raster canvas with scale S
  function outline(g, S, test, col, w = 1.6) {
    const has = (i, j) => i >= 0 && j >= 0 && i < N && j < N && test(j * N + i);
    g.save(); g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { if (!has(i, j)) continue;
      if (!has(i, j - 1)) { g.moveTo(i * S, j * S); g.lineTo(i * S + S, j * S); } if (!has(i, j + 1)) { g.moveTo(i * S, j * S + S); g.lineTo(i * S + S, j * S + S); }
      if (!has(i - 1, j)) { g.moveTo(i * S, j * S); g.lineTo(i * S, j * S + S); } if (!has(i + 1, j)) { g.moveTo(i * S + S, j * S); g.lineTo(i * S + S, j * S + S); } }
    g.stroke(); g.restore(); }
  // steering-wind arrow in the top-left corner of a raster
  function windArrow(g, S, u, v, kmh) {
    const x = 14 * S / 2, y = 14 * S / 2, sp = Math.hypot(u, v), L = 7 * S;
    g.save(); g.fillStyle = "rgba(255,255,255,.82)"; g.strokeStyle = "#222"; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, L * 0.95, 0, 2 * Math.PI); g.fill();
    if (sp > 1e-6) { const ex = x + u / sp * L * 0.7, ey = y + v / sp * L * 0.7, bx = x - u / sp * L * 0.55, by = y - v / sp * L * 0.55, a = Math.atan2(ey - by, ex - bx);
      g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - 9 * Math.cos(a - .45), ey - 9 * Math.sin(a - .45)); g.lineTo(ex - 9 * Math.cos(a + .45), ey - 9 * Math.sin(a + .45)); g.closePath(); g.fillStyle = "#222"; g.fill(); }
    g.fillStyle = "#222"; g.font = "600 13px system-ui, sans-serif"; g.textAlign = "center"; g.fillText(kmh + " km/h", x, y + L * 0.95 + 15); g.restore(); }
  // hover tooltip on a mapwrap
  function tip(host, tipEl, text) { return (i, j) => { if (i < 0) { tipEl.style.display = "none"; return; }
    const r = host.querySelector("canvas").getBoundingClientRect(), w = host.getBoundingClientRect();
    tipEl.textContent = text(i, j); tipEl.style.display = "block";
    const x = (i + .5) / N * r.width + r.left - w.left, y = (j + .5) / N * r.height + r.top - w.top;
    tipEl.style.left = Math.min(x + 12, r.width - 130) + "px"; tipEl.style.top = (y + 12) + "px"; }; }

    /* ───────── 1 · opener: schematic skill vs lead time ───────── */
  demo("s-nowcast", () => {
    const lead = slider("ncSkLead", v => v < 1 ? Math.round(v * 60) + " min" : fmt(v, v % 1 ? 2 : 0) + " h", render);
    let type = "pop"; chips($("#ncSkType"), v => { type = v; render(); });
    // schematic curves (shapes only): extrapolation decays with a storm-lifetime e-folding; NWP spins up then decays slowly
    const tau = () => type === "pop" ? 1.4 : 3.2;
    const ext = t => 0.95 * Math.exp(-t / tau());
    const nwp = t => (type === "pop" ? 0.48 : 0.6) * (1 - Math.exp(-(t + 0.15) / 1.3)) * Math.exp(-t / 40);
    const goal = t => Math.min(0.97, Math.max(ext(t), nwp(t)) + 0.08 * Math.exp(-((t - 2.5) ** 2) / 8));
    const cross = () => { for (let t = 0; t <= 12; t += 0.01) if (nwp(t) > ext(t)) return t; return null; };
    function render() {
      const L = lead(), xs = Array.from({ length: 121 }, (_, i) => i / 10), c = cross();
      const marks = [[L, "lead " + (L < 1 ? Math.round(L * 60) + " min" : fmt(L, L % 1 ? 2 : 0) + " h"), "--fg"]];
      const C = VIZ.curves($("#ncSkFig"), [
        { pts: xs.map(t => [t, ext(t)]), col: "--cool", label: "extrapolation of radar", w: 2.6 },
        { pts: xs.map(t => [t, nwp(t)]), col: "--muted", label: "km-scale NWP (spin-up)", w: 2.6 },
        { pts: xs.map(t => [t, goal(t)]), col: "--lw", label: "goal of a learned nowcast", dash: "6 4", w: 2 }],
        { xr: [0, 12], yr: [0, 1], xl: "lead time (h)", yl: "skill", W: 520, H: 280, xt: [0, 2, 4, 6, 8, 10, 12], yt: [0, 0.5, 1], xf: v => fmt(v, 0), yf: v => v === 0 ? "low" : v === 1 ? "high" : "", marks, legendAt: "tr" });
      // shade the 0–6 h nowcasting window
      const g = el("rect", { x: C.X(0), y: 12, width: C.X(6) - C.X(0), height: 280 - 40, fill: css("--lw"), opacity: .06 }, C.svg); C.svg.insertBefore(g, C.svg.firstChild);
      el("text", { x: C.X(6) - 6, y: C.Y(0.22), "text-anchor": "end", "font-size": 11, fill: css("--lw") }, C.svg, "nowcasting window 0–6 h");
      if (c != null) { el("circle", { cx: C.X(c), cy: C.Y(ext(c)), r: 5, fill: "none", stroke: css("--fg"), "stroke-width": 1.6 }, C.svg);
        el("text", { x: C.X(c) + 8, y: C.Y(ext(c)) + 16, "font-size": 11, fill: css("--fg") }, C.svg, "crossover"); }
      const e = ext(L), n = nwp(L), win = e > n ? ["Extrapolation", "c-data"] : ["NWP", "c-sw"];
      $("#ncSkRead").innerHTML = `<div><span>Better at this lead</span><b style="color:var(${e > n ? "--cool" : "--muted"})">${win[0]}</b></div><div><span>Crossover (schematic)</span><b class="c-lw">${c == null ? "—" : "≈ " + fmt(c, 1) + " h"}</b></div>`;
    }
    render(); return render;
  });

  /* ───────── 2 · the toy storm world ───────── */
  demo("nc-storms", slide => {
    let seed = 1, W = null, sel = null, timer = null, showTrk = true;
    const tS = slider("ncStT", clock, () => render()), wS = slider("ncStW", v => v + " km/h", () => { rebuild(); render(); });
    const rateG = chips($("#ncStRate"), () => { rebuild(); render(); });
    chips($("#ncStTrk"), v => { showTrk = v === "on"; render(); });
    const rebuild = () => { W = world(seed, wS(), +rateG()); sel = null; };
    $("#ncStNew").onclick = () => { seed = seed % 9 + 1; rebuild(); render(); };
    const stop = () => { clearInterval(timer); timer = null; $("#ncStPlay").textContent = "▶ Play 6 h"; };
    $("#ncStPlay").onclick = () => {
      if (timer) { stop(); return; }
      const r = $("#ncStT"); if (+r.value >= LEAD) r.value = 0;
      $("#ncStPlay").textContent = "❚❚ Pause";
      timer = setInterval(() => { if (!slide.classList.contains("on")) { stop(); return; }
        r.value = +r.value + 1; r.dispatchEvent(new Event("input")); if (+r.value >= LEAD) stop(); }, 260);
    };
    const hover = tip($("#ncStMap"), $("#ncStTip"), (i, j) => { const f = frame(W, tS()), v = f[j * N + i]; return v < 10 ? "clear" : fmt(v, 0) + " dBZ"; });
    rebuild();
    function pick(i, j) { const t = tS(); let best = null, bd = 1e9;
      W.cells.forEach(c => { const s = state(c, t); if (s.I < 10) return; const d = Math.hypot(s.x - i - .5, s.y - j - .5) / s.r; if (d < bd) { bd = d; best = c; } });
      sel = bd < 4 ? best : null; render(); }
    function render() {
      const t = tS(), f = frame(W, t), act = W.cells.map(c => [c, state(c, t)]).filter(([, s]) => s.I >= 10 && inView(s, 2));
      if (!sel || state(sel, t).I < 1) { sel = act.length ? act.reduce((a, b) => b[1].I > a[1].I ? b : a)[0] : null; }
      const ink = lum(css("--bg")) > 128 ? "#1d1d1f" : "#f2f2f2";
      VIZ.raster($("#ncStMap"), f, N, N, { ...DBZ, onCell: pick, onHover: hover, overlay: (g, S) => {
        if (showTrk) { g.save(); g.lineWidth = 1.6; g.strokeStyle = ink; g.globalAlpha = .7;
          act.forEach(([c, s]) => { const b = state(c, Math.max(c.tb, t - 18)); g.beginPath(); g.moveTo(b.x * S, b.y * S); g.lineTo(s.x * S, s.y * S); g.stroke();
            g.beginPath(); g.arc(s.x * S, s.y * S, 2.5, 0, 2 * Math.PI); g.fillStyle = ink; g.fill(); }); g.restore(); }
        if (sel) { const s = state(sel, t); g.save(); g.strokeStyle = ink; g.lineWidth = 2.5; g.setLineDash([5, 4]); g.beginPath(); g.arc(s.x * S, s.y * S, Math.max(3.2 * s.r, 3) * S, 0, 2 * Math.PI); g.stroke(); g.restore(); }
        windArrow(g, S, W.u, W.v, W.kmh); } });
      VIZ.legend($("#ncStLeg"), { color: CM.precip, min: 10, max: 60, label: "reflectivity-like value, dBZ (toy)", width: 370 });
      let a35 = 0, mx = 0; for (let k = 0; k < N * N; k++) { if (f[k] >= 35) a35++; if (f[k] > mx) mx = f[k]; }
      const born = W.cells.filter(c => c.tb > t - 6 && c.tb <= t && inView(state(c, t), 0)).length;
      const b = (cls, v) => `<b class="${cls}" style="font-size:20px">${v}</b>`;
      $("#ncStRead").innerHTML = `<div><span>Cells</span>${b("", act.length)}</div><div><span>New, last h</span>${b("c-ok", born)}</div><div><span>Area ≥ 35 dBZ</span>${b("c-sw", fmtN(a35 * KM * KM) + " km²")}</div><div><span>Max</span>${b("c-lw", fmt(mx, 0) + " dBZ")}</div>`;
      if (sel) { const pts = []; for (let k = 0; k <= sel.L; k++) pts.push([(sel.tb + k) * DT / 60, state(sel, sel.tb + k).I]);
        const age = t - sel.tb, ph = age < sel.L * 0.4 ? "growing" : age < sel.L * 0.6 ? "mature" : "decaying";
        $("#ncStLifeT").textContent = `Life cycle of the selected cell · ${ph}, age ${leadTxt(age)} of ${leadTxt(sel.L)}`;
        VIZ.curves($("#ncStLife"), [{ pts, col: "--lw", w: 2.4 }, { pts: [[pts[0][0], 35], [pts[pts.length - 1][0], 35]], col: "--muted", dash: "3 3", w: 1, label: "35 dBZ" }],
          { xr: [pts[0][0], pts[pts.length - 1][0]], yr: [0, 65], xl: "time (h)", yl: "peak dBZ", W: 440, H: 130, xf: v => fmt(v, 1), yt: [0, 30, 60], yf: v => fmt(v, 0), marks: [[t * DT / 60, "now", "--fg"]], legendAt: "br" });
      } else { $("#ncStLifeT").textContent = "Life cycle of the selected cell"; $("#ncStLife").innerHTML = `<p class="note">No active cell; move the time slider.</p>`; }
    }
    render(); return render;
  });

  /* ───────── 3 · StormCast: diagram + toy regression/diffusion ───────── */
  demo("nc-stormcast", () => {
    const B = {
      hrrr: { t: "HRRR state at t", s: ["99 variables, 3 km", "(winds, T, humidity, reflectivity…)"], col: "--fg",
        d: "The full km-scale state from NOAA's HRRR at hour <i>t</i>: 99 variables on the 3 km grid. During training, the target is HRRR one hour later. At run time the model feeds back its own output, so after the first hour it steps on its own forecast." },
      syn: { t: "Synoptic conditioning", s: ["26 variables, 0.25°", "ERA5 (training)"], s2: ["26 variables, 0.25°", "GFS forecast (real time)"], col: "--muted",
        d: "The regional model cannot see weather systems outside its box, so each step is told the large-scale state: 26 synoptic variables from a coarse global model. ERA5 during training; in real time the 0.25° GFS forecast (and Earth2Studio could use an AI global model instead). This keeps the regional rollout on track with the large-scale flow." },
      reg: { t: "Regression UNet", s: ["predicts the mean", "of the next hour"], col: "--accent",
        d: "A UNet trained with mean-squared error predicts the expected state one hour ahead. Alone it is blurry: MSE rewards the average of all possible storm positions." },
      dif: { t: "EDM diffusion", s: ["generates the residual", "18 denoising steps"], col: "--lw",
        d: "A diffusion model (the EDM formulation) starts from noise and, in 18 denoising steps, generates the residual: target minus the regression mean. That restores sharp storm cores and makes every run a different, plausible sample. Several runs give an ensemble (the paper uses 5 members, which turn out under-dispersive)." },
      out: { t: "State at t + 1 h", s: ["mean + residual", "fed back as input"], col: "--lw",
        d: "Mean plus residual is one sample of the next hour. It becomes the input for the next step: hour after hour (autoregressive rollout), with fresh synoptic conditioning at each hour." } };
    let sel = "dif", mode = "train";
    chips($("#ncScMode"), v => { mode = v; render(); });
    const kS = slider("ncScK", v => v + " / 18", () => drawToy());
    // toy target: a frame of the storm world; samples jitter the cells (position, intensity); the "mean" is their blurred average
    const W = world(3, 40, 1.4), T = 6, base = truthStates(W, T).filter(s => inView(s, 8));
    let sid = 0, sample = null, noise = null, mean = null;
    const jitter = (R) => paint(base.map(s => ({ x: s.x + 1.8 * gauss(R), y: s.y + 1.8 * gauss(R), I: s.I + 3 * gauss(R), r: s.r * (0.85 + 0.3 * R()) })));
    function makeMean() { const acc = new Float32Array(N * N); for (let m = 0; m < 12; m++) { const f = jitter(rng(4000 + m)); for (let k = 0; k < N * N; k++) acc[k] += f[k] / 12; } mean = FFT.blur(acc, N, 1); }
    function newSample() { const R = rng(77 + 31 * sid++); sample = jitter(R); noise = Float32Array.from({ length: N * N }, () => 14 * gauss(R)); }
    function drawToy() {
      if (!mean) makeMean(); if (!sample) newSample();
      const k = kS(), a = Math.pow(k / 18, 1.5), res = new Float32Array(N * N), sum = new Float32Array(N * N);
      for (let i = 0; i < N * N; i++) { res[i] = a * (sample[i] - mean[i]) + Math.sqrt(1 - a * a) * noise[i]; sum[i] = Math.max(0, mean[i] + res[i]); }
      VIZ.raster($("#ncScM1"), mean, N, N, DBZ);
      VIZ.raster($("#ncScM2"), res, N, N, { color: CM.div, lo: -30, hi: 30 });
      VIZ.raster($("#ncScM3"), sum, N, N, DBZ);
      $("#ncScM2L").textContent = k === 18 ? "residual (done)" : k === 0 ? "residual: pure noise" : `residual, step ${k} of 18`;
    }
    $("#ncScNew").onclick = () => { newSample(); drawToy(); };
    function render() {
      const Wd = 1000, H = 150, svg = svgIn($("#ncScFig"), Wd, H); arrowDefs(svg, "ncScAr", css("--muted"));
      const P = { syn: [0, 2, 200, 60], hrrr: [0, 76, 200, 60], reg: [300, 2, 200, 60], dif: [300, 76, 200, 60], out: [640, 39, 200, 60] };
      const line = (x1, y1, x2, y2) => el("path", { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: css("--muted"), "stroke-width": 1.6, fill: "none", "marker-end": "url(#ncScAr)" }, svg);
      line(200, 32, 296, 32); line(200, 106, 296, 106); line(200, 40, 296, 98); line(200, 98, 296, 40);
      line(500, 32, 601, 62); line(500, 106, 601, 76);
      el("circle", { cx: 616, cy: 69, r: 13, fill: css("--card"), stroke: css("--muted"), "stroke-width": 1.6 }, svg); el("text", { x: 616, y: 75, "text-anchor": "middle", "font-size": 18, fill: css("--fg") }, svg, "+");
      el("path", { d: "M740 99 L740 146 L100 146 L100 141", stroke: css("--lw"), "stroke-width": 1.6, fill: "none", "stroke-dasharray": "5 4", "marker-end": "url(#ncScAr)" }, svg);
      el("text", { x: 732, y: 140, "text-anchor": "end", "font-size": 11.5, fill: css("--lw") }, svg, "fed back every hour: autoregressive rollout");
      el("text", { x: 860, y: 62, "font-size": 11.5, fill: css("--muted") }, svg, "a sample, not");
      el("text", { x: 860, y: 77, "font-size": 11.5, fill: css("--muted") }, svg, "the mean");
      Object.entries(P).forEach(([k, [x, y, w, h]]) => { const b = B[k], on = k === sel, g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
        const sub = mode === "real" && b.s2 ? b.s2 : b.s, hot = mode === "real" && k === "syn";
        el("rect", { x: x + 1, y, width: w - 2, height: h, rx: 12, fill: on ? css(b.col) : css("--card"), "fill-opacity": on ? .16 : 1, stroke: css(hot ? "--sw" : on ? b.col : "--line"), "stroke-width": on || hot ? 2.4 : 1.2 }, g);
        el("text", { x: x + w / 2, y: y + 22, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css(b.col) }, g, b.t);
        sub.forEach((q, i) => el("text", { x: x + w / 2, y: y + 39 + 13 * i, "text-anchor": "middle", "font-size": 11, fill: css(hot && i === 1 ? "--sw" : "--muted") }, g, q));
        const go = () => { sel = k; render(); }; g.addEventListener("click", go); g.addEventListener("keydown", e => { if (e.key === "Enter") go(); }); });
      const b = B[sel];
      $("#ncScCard").innerHTML = `<h4 style="color:var(${b.col})">${b.t}</h4><p>${b.d}</p>`;
      const r = (k, v, c = "") => `<div><span>${k}</span><b class="${c}" style="font-size:19px">${v}</b></div>`;
      $("#ncScRead").innerHTML = r("Grid", "3 km", "c-lw") + r("Step", "1 h", "c-lw") + r("State", "99 vars") + r("Conditioning", "26 vars") + r("Training", "64 H100 × 120 h", "c-sw");
      drawToy();
    }
    render(); return render;
  });

  /* ───────── 4 · StormScope: two modes (diagram) + satellite vs radar toy ───────── */
  demo("nc-stormscope", slide => {
    const W = world(5, 35, 1.4); let timer = null, mode = "now";
    chips($("#ncSsMode"), v => { mode = v; render(); });
    const tS = slider("ncSsT", v => v < 0 ? -v * DT + " min before" : v === 0 ? "issue time" : "+" + leadTxt(v), () => draw());
    const stop = () => { clearInterval(timer); timer = null; $("#ncSsPlay").textContent = "▶ Play"; };
    $("#ncSsPlay").onclick = () => { if (timer) { stop(); return; } const r = $("#ncSsT"); if (+r.value >= 12) r.value = -4;
      $("#ncSsPlay").textContent = "❚❚ Pause";
      timer = setInterval(() => { if (!slide.classList.contains("on")) { stop(); return; } r.value = +r.value + 1; r.dispatchEvent(new Event("input")); if (+r.value >= 12) stop(); }, 450); };
    // cells that start raining between −30 min and +1 h, in view
    const fresh = W.cells.filter(c => c.tb >= -3 && c.tb <= 6 && inView(state(c, c.tb + 2), -4));
    function rings(g, S, t) { const ink = "#e0218a"; g.save(); g.strokeStyle = ink; g.lineWidth = 2.2;
      fresh.forEach(c => { const a = t - c.tb; if (a < -5 || a > 8) return; const x = c.x0 + c.u * a, y = c.y0 + c.v * a; g.beginPath(); g.arc(x * S, y * S, 7 * S, 0, 2 * Math.PI); g.stroke(); }); g.restore(); }
    function draw() {
      const t = tS(), sat = satellite(W, t), rad = frame(W, t);
      VIZ.raster($("#ncSsSat"), sat, N, N, { color: IR, lo: 205, hi: 295, overlay: (g, S) => rings(g, S, t) });
      VIZ.raster($("#ncSsRad"), rad, N, N, { ...DBZ, overlay: (g, S) => rings(g, S, t) });
      VIZ.legend($("#ncSsSatL"), { color: IR, min: 205, max: 295, label: "K (toy)", width: 220 });
      VIZ.legend($("#ncSsRadL"), { color: CM.precip, min: 10, max: 60, label: "dBZ (toy)", width: 220 });
      let onSat = 0, onRad = 0; fresh.forEach(c => { const a = t - c.tb; if (a >= -3 && a <= 8) onSat++; if (state(c, t).I >= 15) onRad++; });
      const L = Math.max(0, t), lt = L ? "+" + leadTxt(L) : "issue time";
      $("#ncSsRead").innerHTML = `circled cells now: <span class="g">${onSat} on satellite</span> · <span class="r">${onRad} on radar ≥ 15 dBZ</span><br>` +
        `steps to reach ${lt}: <span class="k">nowcasting ${L} × 10 min</span> · nearcasting ${Math.ceil(L / 6)} × 1 h · StormCast ${Math.ceil(L / 6)} × 1 h`;
    }
    function render() {
      const near = mode === "near", Wd = 1000, H = 132, svg = svgIn($("#ncSsFig"), Wd, H); arrowDefs(svg, "ncSsAr", css("--muted"));
      const box = (x, y, w, h, t, s, col, strong) => { el("rect", { x, y, width: w, height: h, rx: 12, fill: strong ? css(col) : css("--card"), "fill-opacity": strong ? .14 : 1, stroke: css(strong ? col : "--line"), "stroke-width": strong ? 2.2 : 1.2 }, svg);
        el("text", { x: x + w / 2, y: y + 22, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css(col) }, svg, t);
        s.forEach((q, i) => el("text", { x: x + w / 2, y: y + 40 + 13 * i, "text-anchor": "middle", "font-size": 11, fill: css("--muted") }, svg, q)); };
      const ar = (x1, y1, x2, y2) => el("line", { x1, y1, x2, y2, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#ncSsAr)" }, svg);
      box(0, 2, 210, 56, near ? "Observed state at t" : "Past hour of observations", [near ? "GOES or MRMS, one state 1 h earlier" : "6 states, 10 min apart (GOES or MRMS)"], "--data", false);
      box(0, 64, 210, 56, "GFS guidance", near ? ["one channel: Z500 (satellite model)", "or simulated reflectivity (radar)"] : ["not used: observations only"], near ? "--muted" : "--line", false);
      box(310, 22, 230, 78, "Transformer diffusion", ["generates the next state", "(noise → sample), 6 km"], "--lw", true);
      box(640, 30, 170, 62, near ? "State t + 1 h" : "State t + 10 min", ["fed back as input"], "--lw", false);
      ar(210, 30, 306, 52); if (near) ar(210, 92, 306, 72); ar(540, 61, 636, 61);
      el("path", { d: "M810 61 L870 61 L870 126 L105 126 L105 122", stroke: css("--lw"), "stroke-width": 1.6, fill: "none", "stroke-dasharray": "5 4" }, svg);
      el("text", { x: 880, y: 54, "font-size": 12, fill: css("--lw"), "font-weight": 600 }, svg, near ? "× 12 steps" : "× 12 steps");
      el("text", { x: 880, y: 70, "font-size": 11.5, fill: css("--muted") }, svg, near ? "= 0–12 h" : "= 0–2 h");
      el("text", { x: 880, y: 86, "font-size": 11.5, fill: css("--muted") }, svg, near ? "1-h steps" : "10-min steps");
      draw();
    }
    render(); return render;
  });

  /* ───────── 5 · persistence vs advection vs a generative ensemble ───────── */
  demo("nc-compare", () => {
    const THR = [20, 30, 40], M = 16, CACHE = {};
    // motion from two frames dt apart: maximise the normalised cross-correlation over integer shifts, refine by a parabola
    function motion(a, b, dt) {
      const S = 9, sc = {}; let best = -1, bx = 0, by = 0;
      for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) { let s = 0, p = 0, q = 0;
        for (let j = S; j < N - S; j += 1) for (let i = S; i < N - S; i += 1) { const x = a[(j - dy) * N + i - dx], y = b[j * N + i]; s += x * y; p += x * x; q += y * y; }
        const c = s / Math.sqrt(p * q || 1); sc[dx + "," + dy] = c; if (c > best) { best = c; bx = dx; by = dy; } }
      const par = (m, z, p) => { const d = m - 2 * z + p; return d < 0 ? 0.5 * (m - p) / d : 0; };
      const g = (x, y) => sc[x + "," + y] ?? best;
      return { u: (bx + clamp(par(g(bx - 1, by), best, g(bx + 1, by)), -.5, .5)) / dt, v: (by + clamp(par(g(bx, by - 1), best, g(bx, by + 1)), -.5, .5)) / dt, c: best };
    }
    function shift(f, dx, dy) { const o = new Float32Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i - dx, y = j - dy, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
        const g = (a, b) => a >= 0 && b >= 0 && a < N && b < N ? f[b * N + a] : 0;
        o[j * N + i] = (1 - fx) * (1 - fy) * g(x0, y0) + fx * (1 - fy) * g(x0 + 1, y0) + (1 - fx) * fy * g(x0, y0 + 1) + fx * fy * g(x0 + 1, y0 + 1); }
      return o; }
    // one ensemble member: the cells seen at issue time (age known ± 10 min, remaining life and peak drawn at random),
    // cells already outside the radar box, and new cells drawn from the same initiation rule
    function member(Wd, est, m) {
      const R = rng(Wd.seed * 1000 + m * 17 + 5), cells = [];
      Wd.cells.forEach(c => { const s = state(c, 0); if (!(s.I >= 12 && inView(s, 0))) return;
        const a = Math.max(1, s.a + Math.round(gauss(R))), L = Math.max(a + 1, Math.round(c.L * Math.exp(0.2 * gauss(R))));
        const sn = Math.pow(Math.max(0, Math.sin(Math.PI * a / L)), 0.35), A = clamp(s.I / Math.max(sn, .25), s.I, 64), u = est.u + 0.22 * gauss(R), v = est.v + 0.22 * gauss(R);
        cells.push({ x0: s.x - u * a, y0: s.y - v * a, tb: -a, L, A, r: c.r, u, v }); });
      for (let t = -24; t <= LEAD; t++) { const n = pois(R, Wd.rate);
        for (let k = 0; k < n; k++) { const c = newCell(R, Wd.env, t, est.u, est.v, 0); if (t <= 0 && inView(state(c, 0), 2)) continue; cells.push(c); } }
      return cells; }
    function compute(seed) {
      if (CACHE[seed]) return CACHE[seed];
      const Wd = world(seed, 40, 1.8), truth = [], adv = [], mem0 = [], cnt = THR.map(() => []), est = motion(frame(Wd, -3), frame(Wd, 0), 3);
      for (let k = 0; k <= LEAD; k++) { truth.push(frame(Wd, k)); adv.push(shift(truth[0], est.u * k, est.v * k)); THR.forEach((_, q) => cnt[q].push(new Uint8Array(N * N))); }
      const csiM = THR.map(() => new Float64Array(LEAD + 1));
      for (let m = 0; m < M; m++) { const cells = member(Wd, est, m);
        for (let k = 0; k <= LEAD; k++) { const f = paint(cells.map(c => state(c, k)).filter(s => s.I > 0));
          if (m === 0) mem0.push(f);
          THR.forEach((th, q) => { const C = cnt[q][k]; for (let i = 0; i < N * N; i++) if (f[i] >= th) C[i]++; csiM[q][k] += MET.csi(f, truth[k], th) / M; }); } }
      const prob = (q, k) => Float32Array.from(cnt[q][k], c => c / M);
      const curves = THR.map((th, q) => ({
        pers: truth.map((f, k) => MET.csi(truth[0], f, th)), adv: truth.map((f, k) => MET.csi(adv[k], f, th)),
        mem: Array.from(csiM[q]), p30: truth.map((f, k) => MET.csi(prob(q, k), f.map(v => v >= th ? 1 : 0), 0.3)) }));
      const trueMove = mean(Wd.cells.map(c => c.u)), trueMoveV = mean(Wd.cells.map(c => c.v));
      return CACHE[seed] = { Wd, truth, adv, mem0, prob, curves, est, trueMove: [trueMove, trueMoveV] };
    }
    let q = 1, seed = 1, view = "prob";
    const thrG = chips($("#ncCmThr"), v => { q = THR.indexOf(+v); render(); });
    chips($("#ncCmDay"), v => { seed = +v; $("#ncCmNote").textContent = "computing 16 members…"; setTimeout(render, 20); });
    chips($("#ncCmView"), v => { view = v; render(); });
    const lS = slider("ncCmLead", leadTxt, () => render());
    let D = null;
    const hover = tip($("#ncCmMap"), $("#ncCmTip"), (i, j) => { const k = lS(), p = j * N + i, th = THR[q];
      return `truth ${fmt(D.truth[k][p], 0)} dBZ\nadvection ${fmt(D.adv[k][p], 0)} dBZ\nP(≥ ${th} dBZ) ${fmt(100 * D.prob(q, k)[p], 0)} %`; });
    function render() {
      D = compute(seed); const k = lS(), th = THR[q], C = D.curves[q], T = D.truth[k];
      const ink = lum(css("--bg")) > 128 ? "#111" : "#fff";
      const halo = ink === "#111" ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.75)";
      const ov = (g, S) => { if (view !== "truth") { outline(g, S, i => T[i] >= th, halo, 4); outline(g, S, i => T[i] >= th, ink, 1.6); } };
      if (view === "prob") VIZ.raster($("#ncCmMap"), D.prob(q, k), N, N, { color: CM.vir, lo: 0, hi: 1, mask: v => v <= 0, overlay: ov, onHover: hover });
      else { const f = view === "truth" ? T : view === "pers" ? D.truth[0] : view === "adv" ? D.adv[k] : D.mem0[k];
        VIZ.raster($("#ncCmMap"), f, N, N, { ...DBZ, overlay: (g, S) => { ov(g, S); if (view === "truth") outline(g, S, i => T[i] >= th, ink, 1.2); }, onHover: hover }); }
      if (view === "prob") VIZ.legend($("#ncCmLeg"), { color: CM.vir, min: 0, max: 100, label: `% of members ≥ ${th} dBZ`, width: 400 });
      else VIZ.legend($("#ncCmLeg"), { color: CM.precip, min: 10, max: 60, label: "dBZ (toy)", width: 400 });
      const xs = i => i * DT / 60;
      VIZ.curves($("#ncCmFig"), [
        { pts: C.pers.map((v, i) => [xs(i), v]), col: "--muted", label: "persistence", w: 2 },
        { pts: C.adv.map((v, i) => [xs(i), v]), col: "--cool", label: "advection", w: 2.4 },
        { pts: C.mem.map((v, i) => [xs(i), v]), col: "--lw", label: "one member (avg of 16)", dash: "5 4", w: 1.8 },
        { pts: C.p30.map((v, i) => [xs(i), v]), col: "--lw", label: "ensemble P ≥ 30 %", w: 2.6 }],
        { xr: [0, 6], yr: [0, 1], xl: "lead time (h)", yl: `CSI at ${th} dBZ`, W: 460, H: 190, xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 0.5, 1], xf: v => fmt(v, 0), yf: v => fmt(v, 1), marks: [[xs(k), leadTxt(k), "--fg"]], legendAt: "tr" });
      $("#ncCmRead").innerHTML = `<div><span>Persistence</span><b style="color:var(--muted)">${fmt(C.pers[k], 2)}</b></div><div><span>Advection</span><b style="color:var(--cool)">${fmt(C.adv[k], 2)}</b></div><div><span>Ens. P ≥ 30 %</span><b class="c-lw">${fmt(C.p30[k], 2)}</b></div><div><span>One member</span><b class="c-lw">${fmt(C.mem[k], 2)}</b></div>`;
      const sp = Math.hypot(D.est.u, D.est.v) * KM * 60 / DT, tr = Math.hypot(...D.trueMove) * KM * 60 / DT;
      $("#ncCmNote").innerHTML = `Outline: where the truth is ≥ ${th} dBZ. Estimated motion ${fmt(sp, 0)} km/h (true mean cell motion ${fmt(tr, 0)} km/h). A single member is sharp, so a storm placed a little wrong counts twice (a miss and a false alarm): the <b>double penalty</b>. The ensemble curve uses the map "P ≥ 30 %", which keeps what enough members agree on.`;
    }
    render(); return render;
  });

  /* ───────── 6 · users, claims, quiz ───────── */
  demo("nc-users", () => {
    // [name, model(s), lead range in hours [a, b], status, text]
    const U = [
      ["The Weather Company", "Nowcasting", [0, 6], "evaluating", "Evaluating Earth-2 Nowcasting (StormScope) for <b>severe weather</b>: the first hours, where warnings are issued."],
      ["TotalEnergies", "Nowcasting", [0, 6], "evaluating", "Evaluating Earth-2 Nowcasting. Short-range weather matters for energy operations and trading."],
      ["Southwest Power Pool + Hitachi", "Nowcasting + FCN3", [0, 48], "named user", "Combines Nowcasting with <b>FourCastNet 3</b> for <b>intraday and day-ahead wind</b> power: the nowcast covers the first hours, the global ensemble the rest of the day ahead."],
      ["Israel Meteorological Service", "CorrDiff + Nowcasting", [0, 6], "plans", "Already runs CorrDiff in operation; <b>plans Nowcasting up to 8 times daily</b>."]];
    let sel = 2;
    function render() {
      const W = 500, H = 196, m = { l: 168, r: 12, t: 22, b: 30 }, X = v => m.l + Math.log10(v / (1 / 6)) / Math.log10(48 / (1 / 6)) * (W - m.l - m.r), svg = svgIn($("#ncUsFig"), W, H);
      el("rect", { x: X(1 / 6), y: m.t - 6, width: X(6) - X(1 / 6), height: H - m.t - m.b + 6, fill: css("--lw"), opacity: .07 }, svg);
      el("text", { x: (X(1 / 6) + X(6)) / 2, y: m.t + 3 - 12, "text-anchor": "middle", "font-size": 10.5, fill: css("--lw") }, svg, "nowcast window 0–6 h");
      [[1 / 6, "10 min"], [1, "1 h"], [6, "6 h"], [24, "1 d"], [48, "2 d"]].forEach(([h, l]) => { el("line", { x1: X(h), x2: X(h), y1: m.t - 6, y2: H - m.b, stroke: css("--line") }, svg);
        el("text", { x: X(h), y: H - m.b + 15, "text-anchor": "middle", "font-size": 10.5, class: "mono", fill: css("--muted") }, svg, l); });
      el("text", { x: W - m.r, y: H - 2, "text-anchor": "end", "font-size": 11, fill: css("--muted") }, svg, "lead time of interest (log) →");
      U.forEach((u, i) => { const y = m.t + 8 + i * 36, on = i === sel, g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
        el("rect", { x: 0, y: y - 12, width: W, height: 30, rx: 8, fill: on ? css("--lw") : "transparent", "fill-opacity": on ? .1 : 0 }, g);
        el("text", { x: m.l - 8, y: y + 2, "text-anchor": "end", "font-size": 12.5, "font-weight": on ? 600 : 500, fill: css("--fg") }, g, u[0]);
        el("text", { x: m.l - 8, y: y + 14, "text-anchor": "end", "font-size": 10, fill: css("--muted") }, g, u[1] + " · " + u[3]);
        const a = X(Math.max(u[2][0], 1 / 6)), b = X(u[2][1]);
        if (u[2][1] > 6) el("rect", { x: X(6), y: y - 5, width: b - X(6), height: 12, rx: 6, fill: css("--data"), opacity: on ? .75 : .45 }, g);
        el("rect", { x: a, y: y - 5, width: X(Math.min(u[2][1], 6)) - a, height: 12, rx: 6, fill: css("--lw"), opacity: on ? .9 : .5 }, g);
        const go = () => { sel = i; render(); }; g.addEventListener("click", go); g.addEventListener("keydown", e => { if (e.key === "Enter") go(); }); });
      const u = U[sel];
      $("#ncUsCard").innerHTML = `<h4 style="color:var(--lw)">${u[0]} <span class="note" style="font-weight:400">· ${u[3]}</span></h4><p>${u[4]}</p><p class="note" style="margin:6px 0 0"><span style="color:var(--lw)">■</span> hours ahead (Nowcasting) &nbsp; <span style="color:var(--data)">■</span> day ahead (FourCastNet 3)</p>`;
    }
    VIZ.quiz($("#ncQuiz"), [
      { q: "Why does radar extrapolation lose skill after an hour or two?", opts: ["The radar data arrive too late", "It moves storms but cannot grow, decay or start them", "It moves storms the wrong way"], right: 1,
        why: "Extrapolation keeps each echo's intensity and only shifts it; storm cells live tens of minutes to a few hours, so after that the map is full of storms that have died and is missing the new ones." },
      { q: "What does StormCast take as input at each 1-hour step?", opts: ["Only GOES images", "Previous HRRR-like state + 26 global-model variables", "A global state only"], right: 1,
        why: "It steps a 99-variable, 3 km HRRR-like state, conditioned on 26 synoptic variables from ERA5 (training) or GFS (real time). StormScope is the one that learns from GOES and MRMS directly." },
      { q: "A single sharp ensemble member often has a lower CSI than a blurry forecast. Why?", opts: ["Diffusion is inaccurate", "Double penalty: a displaced storm is a miss and a false alarm", "CSI ignores small storms"], right: 1,
        why: "Sharp but displaced storms are punished twice by point-wise scores. That is why ensembles are judged with probabilities (P ≥ threshold), neighbourhood scores such as FSS, or CRPS." }]);
    render(); return render;
  });
}
