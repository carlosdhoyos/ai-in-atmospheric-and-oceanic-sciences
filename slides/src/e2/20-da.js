/* ═════════ Earth-2 · section 3: data assimilation ═════════ */

/* small helpers for this section */
const DA = (() => {
  const D2R = Math.PI / 180;
  // hex colour of a css token → [r, g, b]
  const rgbOf = tok => { const h = css(tok); if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const d = document.createElement("canvas").getContext("2d"); d.fillStyle = h; d.fillRect(0, 0, 1, 1); return [...d.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
  const hex = c => "#" + c.map(v => clamp(v, 0, 255).toString(16).padStart(2, "0")).join("");
  /* a colour map with flat plateaus, one per category: value(k) gives the input for category k (with lo = 0, hi = 1) */
  function cats(cols) { const stops = []; cols.forEach(c => stops.push(hex(c), hex(c))); const n = stops.length - 1;
    return { map: CM.ramp(stops), value: k => (2 * k + .5) / n }; }
  // Gauss-Jordan inverse of a small symmetric positive matrix (array of arrays)
  function inv(A) { const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => +(i === j))]);
    for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-12; for (let k = 0; k < 2 * n; k++) M[c][k] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f) for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]; } }
    return M.map(r => r.slice(n)); }
  return { D2R, rgbOf, mix, hex, cats, inv };
})();

/* ───────── 3.1 chaos: Lorenz-63, two runs from nearby starts ───────── */
demo("s-da", slide => {
  const dt = 0.01, T = 25, NS = Math.round(T / dt);
  const f = ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - 8 / 3 * z];
  const step = p => { const k1 = f(p), k2 = f(p.map((v, i) => v + dt / 2 * k1[i])), k3 = f(p.map((v, i) => v + dt / 2 * k2[i])), k4 = f(p.map((v, i) => v + dt * k3[i]));
    return p.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); };
  // three starting states on the attractor (after a spin-up)
  let p = [1, 1, 1]; for (let i = 0; i < 2000; i++) p = step(p);
  const starts = []; for (let k = 0; k < 3; k++) { starts.push(p); for (let i = 0; i < 617 + 211 * k; i++) p = step(p); }
  const run = p0 => { const out = [p0]; let q = p0; for (let i = 0; i < NS; i++) { q = step(q); out.push(q); } return out; };
  const runs = starts.map(run);                       // reference runs, computed once
  const LOST = 5;
  const sep = (a, eps) => { const b = run([a[0][0] + eps, a[0][1], a[0][2]]); const d = a.map((q, i) => Math.hypot(q[0] - b[i][0], q[1] - b[i][1], q[2] - b[i][2]));
    const k = d.findIndex(v => v > LOST); return { b, d, tLost: k < 0 ? null : k * dt }; };
  // average growth rate λ (largest Lyapunov exponent), once: straight-line fit of ln(distance) against time for a tiny
  // initial error, before saturation, pooled over the three starts
  const LAM = (() => { let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    runs.forEach(a => sep(a, 1e-9).d.forEach((v, i) => { if (v > 1e-8 && v < 0.5) { const t = i * dt, y = Math.log(v); n++; sx += t; sy += y; sxx += t * t; sxy += t * y; } }));
    return (n * sxy - sx * sy) / (n * sxx - sx * sx); })();
  const eps = slider("daLzEps", v => "10^" + (v % 1 ? v.toFixed(1) : v), render);
  let st = 0; chips($("#daLzStart"), v => { st = +v; render(); });
  function render() {
    const e = 10 ** eps(), a = runs[st], S = sep(a, e), S10 = sep(a, e / 10), every = 4;
    const tl = S.tLost, marks = tl != null ? [[tl, "lost at t = " + fmt(tl, 1), "--lw"]] : [];
    VIZ.curves($("#daLzFig"), [
      { pts: a.filter((_, i) => i % every === 0).map((q, i) => [i * every * dt, q[0]]), col: "--fg", w: 1.6 },
      { pts: S.b.filter((_, i) => i % every === 0).map((q, i) => [i * every * dt, q[0]]), col: "--accent", w: 1.6, dash: "5 3" }],
      { xr: [0, T], yr: [-22, 22], W: 520, H: 150, xl: "model time", yt: [-20, 0, 20], xt: [0, 5, 10, 15, 20, 25], xf: v => fmt(v, 0), yf: v => fmt(v, 0), marks });
    VIZ.curves($("#daLzErr"), [
      { pts: S.d.filter((_, i) => i % every === 0).map((v, i) => [i * every * dt, Math.max(v, 1e-12)]), col: "--accent" },
      { pts: S10.d.filter((_, i) => i % every === 0).map((v, i) => [i * every * dt, Math.max(v, 1e-12)]), col: "--muted", dash: "4 3" },
      { pts: [[0, LOST], [T, LOST]], col: "--lw", w: 1, dash: "2 3" }],
      { xr: [0, T], yr: [1e-10, 100], logy: true, W: 520, H: 150, xl: "model time", yt: [1e-10, 1e-6, 1e-2, 100], xt: [0, 5, 10, 15, 20, 25], xf: v => fmt(v, 0), yf: v => v >= 1 ? fmt(v, 0) : "1e" + Math.round(Math.log10(v)), marks: marks.map(([x, , c]) => [x, "", c]) });
    const gain = tl != null && S10.tLost != null ? S10.tLost - tl : null;
    $("#daLzRead").innerHTML = `<div><span>Lost at</span><b class="c-lw">${tl != null ? "t = " + fmt(tl, 1) : "> " + T}</b></div>` +
      `<div><span>10× better: this run</span><b class="c-ok">${gain != null ? "+" + fmt(gain, 1) : "> " + T}</b></div>` +
      `<div><span>On average, ln 10/λ</span><b class="c-ok">+${fmt(Math.log(10) / LAM, 1)}</b></div>`;
  }
  render(); return render;
});

/* ───────── 3.2 optimal interpolation on a latitude circle ───────── */
demo("da-oi", slide => {
  const N = 180, LAT = 45, R = 6371, C = 2 * Math.PI * R * Math.cos(LAT * DA.D2R), dx = C / N;     // km around the circle
  const TRUE = { sb: 40, so: 15, L: 1500 };
  const truthAt = lon => ATM.z500(lon, LAT, 0);
  const truth = Float64Array.from({ length: N }, (_, i) => truthAt(i * 360 / N));
  const lo = Math.min(...truth) - 110, hi = Math.max(...truth) + 110;
  const kmBetween = (l1, l2) => { let d = Math.abs(l1 - l2) % 360; if (d > 180) d = 360 - d; return d / 360 * C; };
  // true background error: smoothed white noise with Gaussian correlation of length TRUE.L, std TRUE.sb
  let seed = 7, eb = null;
  function newError() { const r = rng(seed), w = Array.from({ length: N }, () => gauss(r)), s = TRUE.L / Math.SQRT2 / dx, K = Math.ceil(4 * s), e = new Float64Array(N);
    for (let i = 0; i < N; i++) { let a = 0; for (let k = -K; k <= K; k++) a += w[(i + k + N) % N] * Math.exp(-k * k / (2 * s * s)); e[i] = a; }
    const m = mean(e), d = sd(e) || 1; eb = e.map(v => (v - m) / d * TRUE.sb); }
  newError();
  const xbAt = (xb, lon) => { const u = ((lon % 360) + 360) % 360 / 360 * N, i = Math.floor(u) % N, t = u - Math.floor(u); return xb[i] * (1 - t) + xb[(i + 1) % N] * t; };   // H: linear interpolation
  // observations: value = truth + an error that is fixed for each position (so moving one back gives the same value)
  const obsErr = lon => gauss(rng(Math.round(lon * 37) + 9001)) * TRUE.so;
  const mk = lon => ({ lon, v: truthAt(lon) + obsErr(lon) });
  const NETS = { sparse: [20, 80, 140, 200, 260, 320], dense: Array.from({ length: 36 }, (_, i) => 5 + i * 10), one: [100],
    half: Array.from({ length: 15 }, (_, i) => 6 + i * 12) };
  let obs = NETS.sparse.map(mk), sel = 1;
  const sb = slider("daOiSb", v => v + " m", render), so = slider("daOiSo", v => v + " m", render), Ls = slider("daOiL", v => fmtN(v) + " km", render);
  chips($("#daOiNet"), v => { obs = NETS[v].map(mk); sel = Math.min(1, obs.length - 1); render(); });
  $("#daOiTrue").onclick = () => { [["daOiSb", TRUE.sb], ["daOiSo", TRUE.so], ["daOiL", TRUE.L]].forEach(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event("input")); }); };
  $("#daOiNew").onclick = () => { seed++; newError(); render(); };

  function analyse() {
    const xb = truth.map((t, i) => t + eb[i]), n = obs.length, s2b = sb() ** 2, s2o = so() ** 2, L = Ls();
    const rho = d => Math.exp(-d * d / (2 * L * L));
    if (!n) return { xb, xa: xb, sa: new Float64Array(N).fill(sb()), w: [], inc: [] };
    const A = obs.map(a => obs.map(b => s2b * rho(kmBetween(a.lon, b.lon)))); A.forEach((r, i) => r[i] += s2o);
    const Ai = DA.inv(A), inn = obs.map(o => o.v - xbAt(xb, o.lon)), wgt = Ai.map(r => r.reduce((s, v, j) => s + v * inn[j], 0));
    const xa = new Float64Array(N), sa = new Float64Array(N);
    for (let i = 0; i < N; i++) { const b = obs.map(o => s2b * rho(kmBetween(i * 360 / N, o.lon)));
      xa[i] = xb[i] + b.reduce((s, v, j) => s + v * wgt[j], 0);
      let q = 0; for (let j = 0; j < n; j++) { let t = 0; for (let k = 0; k < n; k++) t += Ai[j][k] * b[k]; q += b[j] * t; }
      sa[i] = Math.sqrt(Math.max(s2b - q, 0)); }
    // weight the analysis gives each observation: (H K)_kk
    const w = obs.map((a, k) => obs.reduce((s, b, j) => s + s2b * rho(kmBetween(a.lon, b.lon)) * Ai[j][k], 0));
    return { xb, xa, sa, w, inn };
  }
  const W = 560, H = 196, m = { l: 46, r: 10, t: 8, b: 22 };
  let X = null, Y = null;
  function render() {
    const { xb, xa, sa, w, inn } = analyse(), lons = Array.from({ length: N + 1 }, (_, i) => i * 360 / N), at = (a, i) => a[i % N];
    const svg = svgIn($("#daOiFig"), W, H);
    const A = axes(svg, { W, H, m, x0: 0, x1: 360, y0: lo, y1: hi, xt: [0, 90, 180, 270, 360], yt: [Math.ceil(lo / 100) * 100, Math.floor(hi / 100) * 100], xf: v => v + "°E", yf: v => fmtN(v) });
    X = A.x; Y = A.y;
    el("path", { d: path(lons.map((l, i) => [X(l), Y(at(xa, i) + at(sa, i))]).concat(lons.slice().reverse().map((l, k) => [X(l), Y(at(xa, N - k) - at(sa, N - k))]))) + "Z", fill: css("--data"), opacity: .18 }, svg);
    el("path", { d: path(lons.map((l, i) => [X(l), Y(at(truth, i))])), fill: "none", stroke: css("--fg"), "stroke-width": 1.4 }, svg);
    el("path", { d: path(lons.map((l, i) => [X(l), Y(at(xb, i))])), fill: "none", stroke: css("--muted"), "stroke-width": 1.6, "stroke-dasharray": "5 3" }, svg);
    el("path", { d: path(lons.map((l, i) => [X(l), Y(at(xa, i))])), fill: "none", stroke: css("--data"), "stroke-width": 2.4 }, svg);
    obs.forEach((o, k) => { const x = X(o.lon), y = Y(o.v), e = Y(o.v - so()) - y;
      el("line", { x1: x, x2: x, y1: y - e, y2: y + e, stroke: css("--fg"), "stroke-width": 1.2, opacity: .6 }, svg);
      el("circle", { cx: x, cy: y, r: k === sel ? 6.5 : 4.5, fill: css(k === sel ? "--sw" : "--fg"), stroke: css("--card"), "stroke-width": 1.5, style: "cursor:grab" }, svg); });
    // error panel
    const E = 3 * TRUE.sb, W2 = W, H2 = 84, s2 = svgIn($("#daOiErr"), W2, H2);
    const B = axes(s2, { W: W2, H: H2, m: { l: 46, r: 10, t: 4, b: 6 }, x0: 0, x1: 360, y0: -E, y1: E, xt: [], yt: [-E / 1.5, 0, E / 1.5], yf: v => fmt(v, 0) });
    el("path", { d: path(lons.map((l, i) => [B.x(l), B.y(clamp(at(sa, i), 0, E))])).concat(" " + path(lons.slice().reverse().map((l, k) => [B.x(l), B.y(-clamp(at(sa, N - k), 0, E))])).replace(/^M/, "L")) + "Z", fill: css("--data"), opacity: .14 }, s2);
    el("path", { d: path(lons.map((l, i) => [B.x(l), B.y(clamp(at(xb, i) - at(truth, i), -E, E))])), fill: "none", stroke: css("--muted"), "stroke-width": 1.4, "stroke-dasharray": "5 3" }, s2);
    el("path", { d: path(lons.map((l, i) => [B.x(l), B.y(clamp(at(xa, i) - at(truth, i), -E, E))])), fill: "none", stroke: css("--data"), "stroke-width": 2 }, s2);
    obs.forEach(o => el("line", { x1: B.x(o.lon), x2: B.x(o.lon), y1: H2 - 6, y2: H2 - 12, stroke: css("--fg") }, s2));
    const rb = MET.rmse(xb, truth), ra = MET.rmse(xa, truth);
    $("#daOiRead").innerHTML = `<div><span>RMSE background</span><b style="color:var(--muted)">${fmt(rb, 1)} m</b></div><div><span>RMSE analysis</span><b class="c-data">${fmt(ra, 1)} m</b></div>` +
      `<div><span>Improvement</span><b class="${ra < rb ? "c-ok" : "c-lw"}">${fmt(100 * (1 - ra / rb), 0)}%</b></div><div><span>Observations</span><b>${obs.length}</b></div>`;
    if (obs.length && sel >= 0 && sel < obs.length) { const o = obs[sel], k1 = sb() ** 2 / (sb() ** 2 + so() ** 2);
      $("#daOiCalc").innerHTML = `<span class="m">selected obs, ${fmt(o.lon, 0)}°E:</span> y − Hx<sub>b</sub> = <span class="k">${fmt(inn[sel], 1)} m</span>, expected σ<sub>a</sub> = <span class="g">${fmt(xbAt(sa, o.lon), 1)} m</span><br>` +
        `K alone = ${sb()}²/(${sb()}² + ${so()}²) = <span class="k">${fmt(k1, 2)}</span> <span class="m">· with neighbours</span> (HK)<sub>kk</sub> = <span class="g">${fmt(w[sel], 2)}</span>`;
    } else $("#daOiCalc").innerHTML = `<span class="m">No observations: the analysis is the background. Click the chart to add one.</span>`;
  }
  // pointer interaction on the main chart (listeners on the host, which survives re-renders)
  const host = $("#daOiFig"); let drag = null, moved = false, lastClick = 0;
  const toData = e => { const r = host.querySelector("svg").getBoundingClientRect(), px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height; return { px, py }; };
  const invX = px => clamp((px - m.l) / (W - m.l - m.r) * 360, 0, 359.9), invY = py => lo + (H - m.b - py) / (H - m.b - m.t) * (hi - lo);
  host.addEventListener("pointerdown", e => {
    const { px, py } = toData(e);
    let k = -1, best = 12; obs.forEach((o, i) => { const d = Math.hypot(X(o.lon) - px, Y(o.v) - py); if (d < best) { best = d; k = i; } });
    if (k < 0 && (px < m.l || px > W - m.r || py < m.t || py > H - m.b)) return;
    const now = Date.now();
    if (k >= 0 && k === sel && now - lastClick < 350) { obs.splice(k, 1); sel = Math.min(sel, obs.length - 1); render(); lastClick = 0; return; }   // double-click removes
    lastClick = now;
    if (k < 0) { obs.push(mk(invX(px))); k = obs.length - 1; }
    sel = k; drag = k; moved = false; host.setPointerCapture(e.pointerId); render();
  });
  host.addEventListener("pointermove", e => { if (drag == null) return; const { px, py } = toData(e); moved = true;
    obs[drag] = { lon: invX(px), v: clamp(invY(py), lo, hi) }; render(); });
  const up = () => { drag = null; };
  host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);
  render(); return render;
});

/* ───────── 3.3 observation coverage on a globe ───────── */
demo("da-obs", slide => {
  const NX = 360, NY = 180, D = DA.D2R, WIN = [1, 2, 3, 6, 12, 24, 48];
  // unit vectors of 1° cells (row 0 = 89.5° N)
  const cx = new Float64Array(NX * NY), cy = new Float64Array(NX * NY), cz = new Float64Array(NX * NY), cw = new Float64Array(NY);
  for (let j = 0; j < NY; j++) { const la = (89.5 - j) * D; cw[j] = Math.cos(la);
    for (let i = 0; i < NX; i++) { const lo = (i + .5 - 180) * D, k = j * NX + i; cx[k] = Math.cos(la) * Math.cos(lo); cy[k] = Math.cos(la) * Math.sin(lo); cz[k] = Math.sin(la); } }
  // mark every cell within 'rad' degrees of (lat, lon) in array a
  function stamp(a, lat, lon, rad, bit) { const c = Math.cos(rad * D), sx = Math.cos(lat * D) * Math.cos(lon * D), sy = Math.cos(lat * D) * Math.sin(lon * D), sz = Math.sin(lat * D);
    const j0 = Math.max(0, Math.floor(89.5 - lat - rad - 1)), j1 = Math.min(NY - 1, Math.ceil(89.5 - lat + rad + 1));
    const sr = Math.sin(rad * D), cl0 = Math.cos(lat * D), span = cl0 <= sr ? 180 : Math.min(180, Math.asin(sr / cl0) / D + 1.5);   // widest longitude extent of the cap
    for (let j = j0; j <= j1; j++) {
      const i0 = Math.floor(lon + 180 - span), i1 = Math.ceil(lon + 180 + span);
      for (let ii = i0; ii <= i1; ii++) { const i = ((ii % NX) + NX) % NX, k = j * NX + i; if (cx[k] * sx + cy[k] * sy + cz[k] * sz >= c) a[k] |= bit; } } }
  // geostationary disks (fixed)
  const GEO = [-137, -75, 0, 45.5, 140.7], base = new Uint8Array(NX * NY);
  GEO.forEach(l => stamp(base, 0, l, 62, 1));
  // radiosonde stations: toy positions in populated regions
  const r = rng(1963), BOX = [[30, 62, -125, -68, 40], [37, 66, -10, 40, 55], [45, 70, 40, 140, 40], [20, 45, 100, 140, 35], [8, 30, 70, 92, 15],
    [-30, 15, -15, 40, 16], [-40, 5, -72, -38, 16], [-38, -15, 115, 152, 12], [-20, 20, 140, 220, 8], [60, 80, -150, -60, 10]];
  const SONDE = []; BOX.forEach(([a, b, c, d, n]) => { for (let k = 0; k < n; k++) SONDE.push([a + (b - a) * r(), c + (d - c) * r()]); });
  SONDE.forEach(([la, lo]) => stamp(base, la, ((lo + 540) % 360) - 180, 1.4, 4));
  // polar orbiters: 4 sun-synchronous satellites in 2 planes; ground track sampled every 2 minutes
  const inc = 98.7 * D, P = 101 / 60, wE = 2 * Math.PI / 23.934, HW = 10;
  const SATS = [[0, 0], [0, Math.PI], [Math.PI / 2.4, Math.PI / 2], [Math.PI / 2.4, 1.5 * Math.PI]];   // [node, phase]
  const cache = {};
  function polar(hours) { if (cache[hours]) return cache[hours]; const a = new Uint8Array(NX * NY);
    SATS.forEach(([Om, u0]) => { for (let t = 0; t <= hours; t += 1 / 30) { const u = u0 + 2 * Math.PI * t / P;
      const x = Math.cos(Om) * Math.cos(u) - Math.sin(Om) * Math.sin(u) * Math.cos(inc), y = Math.sin(Om) * Math.cos(u) + Math.cos(Om) * Math.sin(u) * Math.cos(inc), z = Math.sin(u) * Math.sin(inc);
      const lat = Math.asin(z) / D, lon = ((Math.atan2(y, x) - wE * t) / D % 360 + 540) % 360 - 180; stamp(a, lat, lon, HW, 2); } });
    return cache[hours] = a; }
  const on = { polar: true, geo: true, sonde: true };
  $$("#daObLay button").forEach(b => b.addEventListener("click", () => { on[b.dataset.v] = !on[b.dataset.v]; b.setAttribute("aria-pressed", on[b.dataset.v]); render(); }));
  const win = slider("daObWin", v => WIN[v] + " h", render);
  let view = [-30, 30], G = null;
  function render() {
    const pol = polar(WIN[win()]), none = DA.mix(DA.rgbOf("--well"), DA.rgbOf("--muted"), .28), geoC = DA.mix(DA.rgbOf("--data"), none, .35), polC = DA.rgbOf("--accent");
    const K = DA.cats([none, geoC, polC, DA.rgbOf("--sw")]);
    const cat = new Uint8Array(NX * NY); let aP = 0, aG = 0, aAny = 0, aW = 0;
    for (let k = 0; k < NX * NY; k++) { const w = cw[Math.floor(k / NX)], g = on.geo && (base[k] & 1), p = on.polar && pol[k], s = on.sonde && (base[k] & 4);
      cat[k] = s ? 3 : p ? 2 : g ? 1 : 0; aW += w; if (base[k] & 1) aG += w; if (pol[k]) aP += w; if (g || p) aAny += w; }
    const f = (lat, lon) => K.value(cat[clamp(Math.floor(90 - lat), 0, NY - 1) * NX + clamp(Math.floor(lon + 180), 0, NX - 1)]);
    G = VIZ.globe($("#daObGlobe"), f, { size: 320, lon0: view[0], lat0: view[1], color: K.map, lo: 0, hi: 1, graticule: 30, onRotate: (a, b) => view = [a, b] });
    $("#daObKey").innerHTML = [["Polar swath", polC], ["Geostationary", geoC], ["Radiosonde", DA.rgbOf("--sw")], ["Not seen", none]]
      .map(([t, c]) => `<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:12px;height:12px;border-radius:3px;background:${DA.hex(c)};display:inline-block;border:1px solid var(--line)"></i>${t}</span>`).join("");
    const nLaunch = SONDE.length * Math.max(1, Math.floor(WIN[win()] / 12));
    $("#daObRead").innerHTML = `<div><span>Polar</span><b>${fmt(100 * aP / aW, 0)}%</b></div><div><span>Geostationary</span><b class="c-data">${fmt(100 * aG / aW, 0)}%</b></div>` +
      `<div><span>Any shown</span><b class="c-ok">${fmt(100 * aAny / aW, 0)}%</b></div><div><span>Sonde profiles</span><b class="c-sw">${fmtN(nLaunch)}</b></div>`;
  }
  render(); return render;
});

/* ───────── 3.4 the HEALPix grid ───────── */
demo("da-hpx", slide => {
  const D = DA.D2R, R = 6371;
  // fine 0.5° lookup of the toy field (for grids finer than the screen)
  const FX = 720, FY = 360, fine = ATM.grid(FX, FY, 0);
  const fineAt = (lat, lon) => fine[clamp(Math.floor((90 - lat) * 2), 0, FY - 1) * FX + clamp(Math.floor((lon + 180) * 2), 0, FX - 1)];
  const vals = {};      // per-nside pixel values (centre of each pixel)
  const pixVals = ns => vals[ns] || (vals[ns] = Float64Array.from(HPX.centers(ns), c => ATM.z500(c.phi / D, 90 - c.theta / D, 0)));
  const llVals = {};
  const ns = slider("daHpNs", v => "" + 2 ** v, render);
  let mode = "hpx"; chips($("#daHpMode"), v => { mode = v; render(); });
  let view = [10, 55];
  const pix = (n, lat, lon) => HPX.ang2pix(n, (90 - lat) * D, lon * D);
  function render() {
    const n = 2 ** ns(), np = HPX.npix(n), nlat = Math.max(1, Math.round(Math.sqrt(np / 2))), dl = 180 / nlat, nlon = 2 * nlat;
    const d = 0.55, edgesOn = (mode === "hpx" ? n <= 16 : nlat <= 50);
    let f, edges = null;
    if (mode === "hpx") {
      let memo = [NaN, NaN, 0];
      const P = n <= 64 ? pixVals(n) : null;
      if (edgesOn) edges = (lat, lon) => { const p = pix(n, lat, lon); memo = [lat, lon, p];
        if (pix(n, Math.min(lat + d, 89.99), lon) !== p) return true;
        return pix(n, lat, lon + d / Math.max(Math.cos(lat * D), .05)) !== p; };
      f = P ? (lat, lon) => P[(memo[0] === lat && memo[1] === lon) ? memo[2] : pix(n, lat, lon)] : fineAt;
    } else {
      const key = nlat, V = nlat <= 400 ? (llVals[key] || (llVals[key] = ATM.grid(nlon, nlat, 0))) : null;
      if (edgesOn) edges = (lat, lon) => { const a = (lat + 90) / dl, b = (lon + 180) / dl;
        return Math.abs(a - Math.round(a)) * dl < d / 2 || Math.abs(b - Math.round(b)) * dl * Math.max(Math.cos(lat * D), .01) < d / 2; };
      f = V ? (lat, lon) => V[clamp(Math.floor((90 - lat) / dl), 0, nlat - 1) * nlon + clamp(Math.floor((lon + 180) / dl), 0, nlon - 1)] : fineAt;
    }
    VIZ.globe($("#daHpGlobe"), f, { size: 300, lon0: view[0], lat0: view[1], color: CM.temp, lo: ATM.RANGE[0], hi: ATM.RANGE[1], graticule: 0, edges, onRotate: (a, b) => view = [a, b] });
    // area of lat-lon cells: Δλ (sin φ2 − sin φ1); relative to the mean
    const pts = [], mean = 4 * Math.PI / (nlat * nlon);
    for (let j = nlat - 1; j >= 0; j--) { const a = 90 - (j + 1) * dl, b = 90 - j * dl, area = dl * D * (Math.sin(b * D) - Math.sin(a * D)); pts.push([a, area / mean], [b, area / mean]); }
    const eqA = nlat % 2 ? 2 * Math.sin(dl / 2 * D) : Math.sin(dl * D), poleA = 1 - Math.cos(dl * D);
    VIZ.curves($("#daHpArea"), [{ pts, col: "--muted" }, { pts: [[-90, 1], [90, 1]], col: "--data", w: 2.5 }],
      { xr: [-90, 90], yr: [0, 1.8], W: 470, H: 104, xl: "latitude", xt: [-90, -45, 0, 45, 90], yt: [0, 1, 1.8], xf: v => fmt(v, 0) + "°", yf: v => fmt(v, 1), legendAt: "tl" });
    const size = Math.sqrt(4 * Math.PI * R * R / np), tag = n === 64 ? " · HPX64" : n === 1024 ? " · HPX1024" : "";
    $("#daHpRead").innerHTML = `<div><span>Pixels</span><b class="c-data">${fmtN(np)}</b></div><div><span>Pixel size</span><b>${size >= 100 ? fmtN(size) : fmt(size, 1)} km${tag}</b></div>` +
      `<div><span>Lat-lon Δ</span><b style="color:var(--muted)">${fmt(dl, dl < 1 ? 2 : 1)}°</b></div><div><span>Lat-lon max/min area</span><b class="c-lw">${nlat > 1 ? fmtN(eqA / poleA) + "×" : "1×"}</b></div>` +
      (edgesOn ? "" : `<div style="flex-basis:100%"><span style="text-transform:none;letter-spacing:0">Cells are now smaller than the drawing: edges hidden.</span></div>`);
  }
  render(); return render;
});

/* ───────── 3.5 HealDA: pipeline and the lead-time cost ───────── */
demo("da-healda", slide => {
  const CARD = {
    cl: `<h4 style="color:var(--muted)">Classical cycle</h4><p style="margin:0">Every few hours the previous analysis is run forward as a <b>background</b> and corrected by new observations, weighted by B and R (4D-Var) or by ensemble statistics (EnKF). It needs H (and for 4D-Var its adjoint) for every instrument and the forecast model inside the loop.</p>`,
    hd: `<h4 style="color:var(--data)">HealDA</h4><p style="margin:0">A neural network reads the observations of the last 48 h and outputs the analysis on a HEALPix grid in one pass. No background forecast and no hand-built H or B: the mapping is learned from data. AI forecast models then start from it.</p>` };
  let mode = "hd"; chips($("#daHdMode"), v => { mode = v; render(); });
  const shift = slider("daHdShift", v => fmt(v, 2) + " d", render);
  const acc = t => 1 / (1 + Math.exp((t - 8.5) / 1.5)) * 1.004;   // toy skill curve
  function flow() {
    const W = 1000, H = 122, svg = svgIn($("#daHdFlow"), W, H), bw = 172, bh = 58, y = 6;
    arrowDefs(svg, "daHdAr", css("--muted"));
    const box = (x, t, s, col, dash) => { el("rect", { x, y, width: bw, height: bh, rx: 12, fill: css(col), "fill-opacity": .1, stroke: css(col), "stroke-width": 1.6, "stroke-dasharray": dash || "" }, svg);
      el("text", { x: x + bw / 2, y: y + 24, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css(col) }, svg, t);
      el("text", { x: x + bw / 2, y: y + 44, "text-anchor": "middle", "font-size": 11.5, fill: css("--muted") }, svg, s); };
    const arrow = (x1, x2) => el("line", { x1, x2, y1: y + bh / 2, y2: y + bh / 2, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#daHdAr)" }, svg);
    const xs = [0, 207, 414, 621, 828];
    if (mode === "cl") {
      box(xs[0], "Observations", "assimilation window", "--fg");
      box(xs[1], "Background x_b", "forecast from last analysis", "--muted", "5 3");
      box(xs[2], "Solver", "4D-Var / EnKF: B, R, H, adjoint", "--muted");
      box(xs[3], "Analysis x_a", "model grid", "--muted");
      box(xs[4], "Forecast model", "physics NWP or AI", "--muted");
      arrow(xs[0] + bw + 2, xs[1] - 4); arrow(xs[1] + bw + 2, xs[2] - 4); arrow(xs[2] + bw + 2, xs[3] - 4); arrow(xs[3] + bw + 2, xs[4] - 4);
      el("path", { d: `M ${xs[4] + bw / 2} ${y + bh + 2} V ${H - 22} H ${xs[1] + bw / 2} V ${y + bh + 8}`, fill: "none", stroke: css("--lw"), "stroke-width": 1.8, "stroke-dasharray": "5 3", "marker-end": "url(#daHdAr)" }, svg);
      el("text", { x: (xs[1] + xs[4] + bw) / 2, y: H - 4, "text-anchor": "middle", "font-size": 11.5, fill: css("--lw") }, svg, "6–12 h forecast becomes the next background (the cycle)");
    } else {
      box(xs[0], "Observations", "satellite + conventional, 48 h", "--fg");
      box(xs[1] + 52, "HealDA network", "learned map, HEALPix grid", "--data");
      box(xs[3] - 52, "Analysis", "v1 1° HEALPix · v2 0.25°", "--data");
      box(xs[4], "AI forecast", "FCN3, Aurora, FengWu, Atlas", "--accent");
      arrow(xs[0] + bw + 2, xs[1] + 48); arrow(xs[1] + 52 + bw + 2, xs[3] - 56); arrow(xs[3] - 52 + bw + 2, xs[4] - 4);
      el("text", { x: W / 2, y: H - 6, "text-anchor": "middle", "font-size": 11.5, fill: css("--data") }, svg, "no background forecast, no cycle: each analysis comes from observations alone");
    }
    $("#daHdCard").innerHTML = CARD[mode];
  }
  function chart() {
    const s = shift(), T = 14, thr = 0.6, ts = Array.from({ length: 141 }, (_, i) => i * T / 140);
    const cross = g => { for (let i = 1; i < ts.length; i++) if (g(ts[i]) < thr) { const a = g(ts[i - 1]), b = g(ts[i]); return ts[i - 1] + (a - thr) / (a - b) * (ts[i] - ts[i - 1]); } return T; };
    const tE = cross(acc), tH = cross(t => acc(t + s));
    const C = VIZ.curves($("#daHdFig"), [
      { pts: ts.map(t => [t, Math.min(acc(t), 1)]), col: "--fg" },
      { pts: ts.map(t => [t, Math.min(acc(t + s), 1)]), col: "--data", dash: "6 3", w: 2.4 },
      { pts: [[0, thr], [T, thr]], col: "--muted", w: 1, dash: "2 3" }],
      { xr: [0, T], yr: [0, 1.05], W: 470, H: 168, xl: "lead time (days)", yl: "skill (toy ACC)", xt: [0, 2, 4, 6, 8, 10, 12, 14], yt: [0, 0.6, 1], xf: v => fmt(v, 0), yf: v => fmt(v, 1) });
    const svg = $("#daHdFig svg"), X = C.X, Y = C.Y;
    [[tE, "--fg", "ERA5: " + fmt(tE, 1) + " d", 1], [tH, "--data", "HealDA: " + fmt(tH, 1) + " d", -1]].forEach(([t, c, lab, side]) => {
      el("circle", { cx: X(t), cy: Y(thr), r: 4, fill: css(c) }, svg);
      el("text", { x: X(t) + side * 7, y: Y(thr) + (side > 0 ? -8 : 17), "text-anchor": side > 0 ? "start" : "end", "font-size": 11.5, "font-weight": 600, fill: css(c) }, svg, lab); });
    el("text", { x: X(T) - 2, y: Y(thr) - 5, "text-anchor": "end", "font-size": 10.5, fill: css("--muted") }, svg, "skill threshold (toy)");
  }
  function render() { flow(); chart(); }
  render(); return render;
});

/* ───────── 3.6 quiz ───────── */
demo("da-quiz", () => {
  VIZ.quiz($("#daQuiz"), [
    { q: "In a chaotic model, the initial error is made 10× smaller. The forecast stays useful…", opts: ["10× longer", "a fixed amount longer", "no longer at all"], right: 1,
      why: "Errors grow roughly exponentially, so dividing the start error by 10 adds about ln(10)/λ of time, the same amount each time you divide by 10." },
    { q: "One observation sits on a grid point and σ_b = σ_o. What is the gain K there?", opts: ["0", "0.5", "1"], right: 1,
      why: "K = σ_b²/(σ_b² + σ_o²) = 1/2: the analysis lands halfway between background and observation, and its error variance halves." },
    { q: "Why do HealDA, DLESyM and cBottle use HEALPix rather than a lat-lon grid?", opts: ["Fewer pixels at the equator", "Equal-area pixels on latitude rings", "ERA5 is stored on it"], right: 1,
      why: "Every HEALPix pixel has the same area and centres lie on rings of constant latitude; lat-lon cells shrink towards the poles. ERA5 is distributed on a regular 0.25° lat-lon grid." },
    { q: "What does HealDA not need that 4D-Var does?", opts: ["Observations", "A background forecast", "A GPU"], right: 1,
      why: "HealDA maps 48 h of observations directly to an analysis; there is no background and no cycle (arXiv:2601.17636)." }]);
  return () => {};
});
