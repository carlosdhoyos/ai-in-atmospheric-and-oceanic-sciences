/* Module 2 · group g2: the convolution family
   05 convolution 1D and 2D, learned vs fixed filters · 06 dilated · 07 transposed · 08 depthwise separable · 08b 1×1 */
(() => {
  /* ───────── local helpers (kept inside this IIFE so names never clash with other groups) ───────── */
  const isDark = () => parseInt(css("--bg").replace("#", "").slice(0, 2), 16) < 128;
  // grayscale for the photo-like scene: 0 = dark, 1 = light, in both themes
  const gray = t => `color-mix(in srgb, ${css(isDark() ? "--fg" : "--bg")} ${Math.round(clamp(t, 0, 1) * 100)}%, ${css(isDark() ? "--bg" : "--fg")})`;
  // sequential and diverging fills, capped so labels stay readable
  const seq = (v, lo, hi, tok = "--accent", cap = 60) => `color-mix(in srgb, ${css(tok)} ${Math.round(clamp((v - lo) / (hi - lo || 1), 0, 1) * cap)}%, ${css("--well")})`;
  const dv = (v, m, cap = 70) => `color-mix(in srgb, ${css(v >= 0 ? "--pos" : "--neg")} ${Math.round(clamp(Math.abs(v) / (m || 1), 0, 1) * cap)}%, ${css("--well")})`;
  const nf = (v, d = 2) => Math.abs(v - Math.round(v)) < 1e-9 ? fmt(Math.round(v), 0) : fmt(v, d);
  const wcol = v => css(v >= 0 ? "--pos" : "--neg");
  const lbl = (svg, x, y, t, o = {}) => el("text", Object.assign({ x, y, "font-size": 11.5, class: "mut" }, o), svg, t);
  const halo = () => `paint-order:stroke;stroke:${css("--card")};stroke-width:3px`;
  // draw a grid of cells into an existing svg
  function cells(svg, M, o) {
    const { x0 = 0, y0 = 0, cell = 20, color, label = false, digits = 0, stroke = null, onCell = null, fs = null, dash = null, op = null } = o;
    const g = el("g", {}, svg), f = fs || Math.min(11, cell * 0.4);
    M.forEach((row, i) => row.forEach((v, j) => {
      const x = x0 + j * cell, y = y0 + i * cell, st = stroke && stroke(i, j), ds = dash && dash(i, j);
      const r = el("rect", { x: x + 0.5, y: y + 0.5, width: cell - 1, height: cell - 1, rx: Math.min(3, cell / 6),
        fill: v == null || ds ? "none" : color(v, i, j), stroke: st || (ds ? css("--muted") : "none"), "stroke-width": st ? 2.2 : 1,
        "stroke-dasharray": ds && !st ? "2 2" : "none", "pointer-events": "all" }, g);
      if (op) r.setAttribute("opacity", op(i, j));
      if (label && v != null) el("text", { x: x + cell / 2, y: y + cell / 2 + f * 0.36, "text-anchor": "middle", "font-size": f, class: ds ? "mono mut" : "mono", "pointer-events": "none" }, g,
        typeof label === "function" ? label(v, i, j) : nf(v, digits));
      if (onCell) { r.style.cursor = "pointer"; r.addEventListener("mouseenter", () => onCell(i, j)); r.addEventListener("click", () => onCell(i, j)); }
    }));
    return g;
  }
  function conv2(X, K, p = 0, s = 1) {
    const n = X.length, m = X[0].length, k = K.length, oh = Math.floor((n + 2 * p - k) / s) + 1, ow = Math.floor((m + 2 * p - k) / s) + 1;
    const at = (i, j) => (i < 0 || j < 0 || i >= n || j >= m) ? 0 : X[i][j];
    return Array.from({ length: oh }, (_, i) => Array.from({ length: ow }, (_, j) => {
      let t = 0; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) t += K[a][b] * at(i * s - p + a, j * s - p + b); return t; }));
  }
  const ext = M => { const f = M.flat().filter(v => v != null); return [Math.min(...f), Math.max(...f)]; };
  const PRE = {
    identity: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)),
    sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], sobelx: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], sobely: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
    laplacian: [[0, 1, 0], [1, -4, 1], [0, 1, 0]], emboss: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]] };
  const kf = v => Math.abs(v * 9 - Math.round(v * 9)) < 1e-9 && Math.abs(v) < 1 && v !== 0 ? `${Math.round(v * 9)}/9` : nf(v, 2);
  // photo-like grayscale scene drawn in code (brightness 0–100): sky, sun, mountains, a house, ground
  const SCENE = (() => {
    const S = [];
    for (let i = 0; i < 16; i++) { S.push([]); for (let j = 0; j < 16; j++) {
      let v = 88 - 2 * i;
      if ((i - 3) ** 2 + (j - 12) ** 2 <= 3.3) v = 100;
      const ridge = 9 - 5 * Math.exp(-((j - 4) ** 2) / 9) - 2.5 * Math.exp(-((j - 11) ** 2) / 5);
      if (i >= ridge) v = 38 + 3 * (i - ridge);
      if (i >= 13) v = 60;
      if (i >= 9 && i <= 12 && j >= 8 && j <= 12) v = 82;
      if ((i === 8 && j >= 8 && j <= 12) || (i === 7 && j >= 9 && j <= 11)) v = 18;
      if (i === 10 && (j === 9 || j === 11)) v = 8;
      if (i >= 11 && j === 10) v = i >= 13 ? 60 : 25;
      S[i].push(Math.round(v));
    } }
    return S;
  })();
  // three synthetic 6 × 6 channel maps; pixel (row 3, col 4) is the worked example (25 °C, 0.8, 4 m/s)
  const CH = [
    { name: "temperature", short: "T", unit: "°C", d: 1, M: [[29.5, 29.0, 28.2, 27.5, 27.0, 26.4], [28.4, 27.8, 27.0, 26.1, 25.6, 25.0], [27.2, 26.5, 25.8, 25.0, 24.3, 23.8], [26.0, 25.1, 24.2, 23.5, 22.9, 22.4], [24.6, 23.8, 22.9, 22.0, 21.4, 21.0], [23.5, 22.4, 21.6, 20.8, 20.1, 19.6]], tok: "--lw" },
    { name: "humidity", short: "H", unit: "", d: 2, M: [[0.62, 0.66, 0.70, 0.74, 0.78, 0.81], [0.64, 0.69, 0.73, 0.77, 0.80, 0.84], [0.66, 0.71, 0.75, 0.80, 0.83, 0.86], [0.69, 0.73, 0.78, 0.82, 0.86, 0.89], [0.71, 0.76, 0.80, 0.85, 0.88, 0.92], [0.74, 0.78, 0.83, 0.87, 0.91, 0.94]], tok: "--cool" },
    { name: "wind", short: "W", unit: "m/s", d: 1, M: [[6.1, 5.4, 4.8, 4.2, 3.6, 3.1], [5.8, 5.0, 4.5, 4.6, 3.3, 2.9], [5.2, 4.7, 4.1, 4.0, 3.0, 2.6], [4.9, 4.3, 3.8, 3.5, 2.8, 2.4], [4.6, 3.9, 3.4, 3.1, 2.5, 2.0], [4.2, 3.6, 3.0, 2.7, 2.2, 1.8]], tok: "--data" }];

  /* ───────── 05 · convolution in 1D ───────── */
  demo("op-conv1d", () => {
    const EX = [0, 2, 8, 3, 0], ST = DS.daily.rain.slice(100, 120).map(v => Math.round(v));
    const P = { sum: [1, 1, 1], avg: [1 / 3, 1 / 3, 1 / 3], diff: [-1, 0, 1] };
    let xs = EX.slice(), w = P.sum.slice(), pos = 0;
    chips($("#g2c1Ser"), v => { xs = (v === "ex" ? EX : ST).slice(); pos = v === "ex" ? 0 : 5; buildIn(); render(); });
    chips($("#g2c1Pick"), v => { w = P[v].slice(); buildW(); render(); });
    const posR = $("#g2c1Pos");
    posR.addEventListener("input", () => { pos = +posR.value; render(); });
    function buildIn() {
      $("#g2c1In").innerHTML = xs.map((v, i) => `<input type="number" class="cell" data-i="${i}" value="${v}" min="0" max="200" aria-label="day ${i + 1} rainfall" style="width:${xs.length > 10 ? 3.3 : 3.8}em;text-align:center">`).join("");
      $$("#g2c1In input").forEach(e => e.addEventListener("input", () => { xs[+e.dataset.i] = Math.max(0, parseFloat(e.value) || 0); render(); }));
    }
    function buildW() {
      $("#g2c1W").innerHTML = w.map((v, i) => `<input type="number" class="cell out" data-k="${i}" value="${+v.toFixed(3)}" step="0.1" aria-label="filter weight ${i + 1}" style="width:4.6em;text-align:center">`).join("");
      $$("#g2c1W input").forEach(e => e.addEventListener("input", () => { w[+e.dataset.k] = parseFloat(e.value) || 0; $$("#g2c1Pick button").forEach(b => b.setAttribute("aria-pressed", "false")); render(); }));
    }
    function render() {
      const n = xs.length, no = n - 2; pos = clamp(pos, 0, no - 1);
      posR.max = no - 1; posR.value = pos; posR.parentElement.querySelector("output").textContent = `day ${pos + 2}`;
      const out = Array.from({ length: no }, (_, i) => w[0] * xs[i] + w[1] * xs[i + 1] + w[2] * xs[i + 2]);
      $$("#g2c1In input").forEach((e, i) => e.classList.toggle("hot", i >= pos && i < pos + 3));
      const W = 520, H = 292, svg = svgIn($("#g2c1Fig"), W, H), cw = (W - 40) / n, x = i => 30 + (i + 0.5) * cw, big = n > 10;
      const yb = 106, hI = 76, mxI = Math.max(1, ...xs);
      el("rect", { x: 30 + pos * cw + 1, y: 6, width: 3 * cw - 2, height: 122, rx: 8, fill: css("--arch-soft"), stroke: css("--arch"), "stroke-dasharray": "4 3" }, svg);
      lbl(svg, 0, 16, "input", { "font-size": 11 });
      xs.forEach((v, i) => {
        const h = hI * v / mxI, on = i >= pos && i < pos + 3;
        el("rect", { x: x(i) - cw * 0.32, y: yb - h, width: cw * 0.64, height: Math.max(h, 0.8), rx: 2, fill: css("--cool"), opacity: on ? 1 : 0.4 }, svg);
        el("text", { x: x(i), y: yb - h - 4, "text-anchor": "middle", "font-size": big ? 9.5 : 12, class: "mono" }, svg, nf(v, 1));
        if (!big || i % 2 === 1) el("text", { x: x(i), y: yb + 15, "text-anchor": "middle", "font-size": 10, class: "mut mono" }, svg, i + 1);
      });
      el("line", { x1: 30, x2: W - 10, y1: yb, y2: yb, class: "ax" }, svg);
      const mo = Math.max(1e-9, ...out.map(Math.abs)), neg = out.some(v => v < -1e-9), yo = neg ? 230 : 268, ho = neg ? 40 : 78, top = 182;
      lbl(svg, 0, top + 4, "output", { "font-size": 11 });
      el("line", { x1: 30, x2: W - 10, y1: yo, y2: yo, class: "ax" }, svg);
      out.forEach((v, i) => {
        const h = ho * Math.abs(v) / mo, xc = x(i + 1), on = i === pos;
        const r = el("rect", { x: xc - cw * 0.32, y: v >= 0 ? yo - h : yo, width: cw * 0.64, height: Math.max(h, 0.8), rx: 2, fill: css(v >= 0 ? "--arch" : "--neg"), opacity: on ? 1 : 0.4, style: "cursor:pointer" }, svg);
        r.addEventListener("click", () => { pos = i; render(); });
        el("text", { x: xc, y: v >= 0 ? yo - h - 4 : yo + h + 12, "text-anchor": "middle", "font-size": big ? 9.5 : 12, class: "mono", "font-weight": on ? 600 : 400 }, svg, nf(v, big ? 1 : 2));
      });
      const mw = Math.max(1, ...w.map(Math.abs));
      [0, 1, 2].forEach(k => {
        const x1 = x(pos + k), x2 = x(pos + 1), y1 = yb + 20, y2 = top - 4;
        el("line", { x1, y1, x2, y2, stroke: wcol(w[k]), "stroke-width": 0.6 + 5 * Math.abs(w[k]) / mw, opacity: Math.abs(w[k]) < 1e-9 ? 0.25 : 0.85, "stroke-linecap": "round" }, svg);
        el("text", { x: x1 + (x2 - x1) * 0.22 + (k - 1) * 4, y: y1 + (y2 - y1) * 0.22 + 4, "text-anchor": "middle", "font-size": 11, class: "mono", style: halo(), fill: wcol(w[k]) }, svg, kf(w[k]));
      });
      const ws = w.map(v => kf(v));
      $("#g2c1Calc").innerHTML = `y(day ${pos + 2}) = ${[0, 1, 2].map(k => `${ws[k]}×${nf(xs[pos + k], 1)}`).join(" + ")} = <span class="k">${nf(out[pos], 2)}</span>\n` +
        `<span class="m">all outputs: ${out.map(v => nf(v, big ? 1 : 2)).join(", ")} · ${no} outputs from ${n} days, the same 3 weights each time</span>`;
    }
    buildIn(); buildW(); render(); return render;
  });

  /* ───────── 05 · convolution in 2D ───────── */
  demo("op-conv2d", () => {
    let K = PRE.blur.map(r => r.slice()), src = "scene", p = 0, s = 1, hi = [6, 6];
    const kHost = $("#g2c2K");
    kHost.innerHTML = [0, 1, 2].map(a => [0, 1, 2].map(b => `<input type="number" step="0.5" data-a="${a}" data-b="${b}" aria-label="filter row ${a + 1} column ${b + 1}" style="width:5.4em;text-align:center">`).join("")).join("");
    const kin = $$("input", kHost);
    const syncK = () => kin.forEach(e => { e.value = +K[e.dataset.a][e.dataset.b].toFixed(3); });
    kin.forEach(e => e.addEventListener("input", () => { K[e.dataset.a][e.dataset.b] = parseFloat(e.value) || 0; $$("#g2c2Pick button").forEach(b => b.setAttribute("aria-pressed", "false")); render(); }));
    chips($("#g2c2Pick"), v => { K = PRE[v].map(r => r.slice()); syncK(); render(); });
    chips($("#g2c2Src"), v => { src = v; render(); });
    chips($("#g2c2Pad"), v => { p = +v; render(); });
    chips($("#g2c2Str"), v => { s = +v; render(); });
    function input() {
      if (src === "scene") return { X: SCENE, raw: SCENE, unit: "brightness 0–100", d: 0, ocean: false };
      const F = src === "temp" ? DS.temp : DS.precip.map(r => r.map(v => v == null ? null : +(v / 1000).toFixed(2)));
      const mu = mean(F.flat().filter(v => v != null)), d = src === "temp" ? 1 : 2;
      return { X: F.map(r => r.map(v => v == null ? +mu.toFixed(d) : v)), raw: F, unit: src === "temp" ? "°C" : "m/yr", d, ocean: true };
    }
    function render() {
      const { X, raw, unit, d, ocean } = input(), n = X.length, m = X[0].length, O = conv2(X, K, p, s), oh = O.length, ow = O[0].length;
      hi = [Math.min(hi[0], oh - 1), Math.min(hi[1], ow - 1)];
      const cen = (i, j) => [i * s - p + 1, j * s - p + 1];
      const masked = (i, j) => { if (!ocean) return false; const [a, b] = cen(i, j); return raw[a] == null || raw[a][b] == null; };
      const nP = n + 2 * p, mP = m + 2 * p, cell = Math.floor(Math.min(234 / mP, 290 / nP)), W = 520, top = 22, H = top + nP * cell + 6;
      const svg = svgIn($("#g2c2Fig"), W, H);
      const PX = Array.from({ length: nP }, (_, i) => Array.from({ length: mP }, (_, j) => { const a = i - p, b = j - p; return a < 0 || b < 0 || a >= n || b >= m ? 0 : X[a][b]; }));
      const isPad = (i, j) => i < p || j < p || i >= n + p || j >= m + p;
      const isOcean = (i, j) => ocean && !isPad(i, j) && raw[i - p][j - p] == null;
      const [lo, hiV] = ext(X);
      const colIn = v => src === "scene" ? gray(v / 100) : seq(v, lo, hiV, src === "temp" ? "--lw" : "--cool", 85);
      const [wi, wj] = [hi[0] * s, hi[1] * s];
      lbl(svg, 0, 12, `Input ${n} × ${m}${p ? " + padding" : ""} · ${unit}`);
      cells(svg, PX, { x0: 0, y0: top, cell, color: colIn, dash: isPad, label: p && cell >= 12 ? (v, i, j) => isPad(i, j) ? "0" : "" : false, fs: 8, op: (i, j) => isOcean(i, j) ? 0.3 : 1 });
      el("rect", { x: wj * cell, y: top + wi * cell, width: 3 * cell, height: 3 * cell, rx: 3, fill: "none", stroke: css("--arch"), "stroke-width": 2.5 }, svg);
      const ox = 270, oc = cell * s, ks = K.flat().reduce((a, b) => a + b, 0), zeroSum = Math.abs(ks) < 1e-6;
      const vals = O.flat().filter((v, idx) => !masked(Math.floor(idx / ow), idx % ow)), [olo, ohi] = [Math.min(...vals), Math.max(...vals)], omx = Math.max(...vals.map(Math.abs));
      const colOut = v => zeroSum ? dv(v, omx, 90) : src === "scene" ? gray((v - olo) / (ohi - olo || 1)) : seq(v, olo, ohi, src === "temp" ? "--lw" : "--cool", 85);
      lbl(svg, ox, 12, `Output ${oh} × ${ow}${zeroSum ? " · red +, blue −" : ""}`);
      cells(svg, O.map((r, i) => r.map((v, j) => masked(i, j) ? null : v)), { x0: ox, y0: top + p * cell * 0, cell: oc, color: colOut,
        stroke: (i, j) => i === hi[0] && j === hi[1] ? css("--fg") : null, onCell: (i, j) => { if (hi[0] !== i || hi[1] !== j) { hi = [i, j]; render(); } } });
      el("line", { x1: wj * cell + 3 * cell, y1: top + (wi + 1.5) * cell, x2: ox + hi[1] * oc, y2: top + (hi[0] + 0.5) * oc, stroke: css("--arch"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
      // multiply-and-add for the highlighted output cell
      const win = [0, 1, 2].map(a => [0, 1, 2].map(b => PX[wi + a][wj + b]));
      const term = (a, b) => `${kf(K[a][b])}×${isPad(wi + a, wj + b) ? "0" : nf(win[a][b], d)}`;
      $("#g2c2Calc").innerHTML = `output row ${hi[0] + 1}, col ${hi[1] + 1}${masked(hi[0], hi[1]) ? " (ocean, not shown)" : ""}:\n` +
        [0, 1, 2].map(a => "  " + [0, 1, 2].map(b => term(a, b)).join(" + ")).join(" +\n") + `\n= <span class="k">${fmt(O[hi[0]][hi[1]], 2)}</span>` +
        (ocean ? `\n<span class="m">ocean cells (faded) are filled with the land mean before filtering</span>` : "");
      const sz = (nn, label) => `${label} ⌊(${nn} + ${2 * p} − 3) / ${s}⌋ + 1 = ${Math.floor((nn + 2 * p - 3) / s) + 1}`;
      $("#g2c2Size").innerHTML = (n === m ? sz(n, "this grid: ") : sz(n, "rows: ") + "\n" + sz(m, "cols: ")) +
        `\nn = 28 with this p, s: ⌊(28 + ${2 * p} − 3) / ${s}⌋ + 1 = <span class="k">${Math.floor((28 + 2 * p - 3) / s) + 1}</span>\n<span class="m">(with p = 1: s = 1 → 28, s = 2 → 14)</span>` +
        `\n<span class="m">9 weights reused at ${oh * ow} positions</span>`;
    }
    syncK(); render(); return render;
  });

  /* ───────── 05 · learned vs fixed filters ───────── */
  demo("op-conv-learned", () => {
    const T = [["vertical edge", PRE.sobelx], ["horizontal edge", PRE.sobely], ["diagonal edge", [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]]], ["blur", PRE.blur]];
    const r = rng(7), R0 = T.map(() => [0, 1, 2].map(() => [0, 1, 2].map(() => +(0.9 * gauss(r)).toFixed(2))));
    const FT = T.map(([, K]) => { const s = Math.max(...K.flat().map(Math.abs)); return K.map(row => row.map(v => +(v + 0.18 * s * gauss(r)).toFixed(3))); });
    const LT = T.map(([, K]) => { const s = Math.max(...K.flat().map(Math.abs)); return K.map(row => row.map(v => +(v + 0.07 * s * gauss(r)).toFixed(3))); });
    let mode = "learn", sel = 0, stencil = "dx", hi = [8, 6], timer = null;
    const tR = $("#g2lrT"), gt = slider("g2lrT", v => `${v}%`, () => { stop(); render(); });
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $("#g2lrPlay").textContent = "Train ▶"; } };
    const setT = v => { tR.value = v; tR.parentElement.querySelector("output").textContent = `${v}%`; };
    $("#g2lrPlay").addEventListener("click", () => {
      if (timer) { stop(); return; }
      if (gt() >= 100) setT(0);
      $("#g2lrPlay").textContent = "Pause ❚❚";
      timer = setInterval(() => { const v = Math.min(100, gt() + 2); setT(v); render(); if (v >= 100) stop(); }, 50);
    });
    chips($("#g2lrMode"), v => { mode = v; stop(); setT(0); render(); });
    chips($("#g2lrSt"), v => { stencil = v; render(); });
    const ease = t => t * t * (3 - 2 * t);
    const cosim = (A, B) => { const a = A.flat(), b = B.flat(); let n = 0, x = 0, y = 0; a.forEach((v, i) => { n += v * b[i]; x += v * v; y += b[i] * b[i]; }); return n / Math.sqrt(x * y || 1); };
    function filters() {
      const e = ease(gt() / 100);
      return T.map(([, K], f) => { const A = mode === "learn" ? R0[f] : K, B = mode === "learn" ? LT[f] : FT[f]; return A.map((row, a) => row.map((v, b) => v + (B[a][b] - v) * e)); });
    }
    const ST = {
      dx: { K: [[0, 0, 0], [-0.5, 0, 0.5], [0, 0, 0]], name: "∂T/∂x", unit: "°C per 100 km" },
      dy: { K: [[0, 0.5, 0], [0, 0, 0], [0, -0.5, 0]], name: "∂T/∂y", unit: "°C per 100 km" },
      lap: { K: [[0, 1, 0], [1, -4, 1], [0, 1, 0]], name: "∇²T", unit: "°C per (100 km)²" } };
    function renderLearn() {
      const F = filters(), W = 520, H = 252, svg = svgIn($("#g2lrFig"), W, H), cw = 130, fc = 24, mc = 7;
      F.forEach((K, f) => {
        const x0 = f * cw + 4, mk = Math.max(...K.flat().map(Math.abs));
        lbl(svg, x0, 12, `filter ${f + 1}`, { class: f === sel ? "" : "mut", "font-weight": f === sel ? 600 : 400 });
        cells(svg, K, { x0, y0: 20, cell: fc, color: v => dv(v, mk, 85), label: v => nf(v, 1), fs: 8.5, onCell: () => { if (sel !== f) { sel = f; render(); } } });
        const M = conv2(SCENE, K, 0, 1), [lo, hiV] = ext(M);
        cells(svg, M, { x0, y0: 20 + 3 * fc + 14, cell: mc, color: v => gray((v - lo) / (hiV - lo || 1)) });
        const c = cosim(K, T[f][1]);
        lbl(svg, x0, H - 8, `${T[f][0]} · ${fmt(c, 2)}`, { "font-size": 10.5, fill: css(c > 0.95 ? "--ok" : "--muted"), class: "" });
        if (f === sel) el("rect", { x: x0 - 3, y: 1, width: cw - 6, height: H - 4, rx: 8, fill: "none", stroke: css("--arch"), "stroke-dasharray": "4 3" }, svg);
      });
      const n = F.length;
      $("#g2lrRead").innerHTML = `<div><span>Trainable weights</span><b class="c-arch">${n} × 9 + ${n} = ${n * 10}</b></div><div><span>Mean similarity to preset</span><b>${fmt(mean(F.map((K, f) => cosim(K, T[f][1]))), 2)}</b></div>`;
      const K = F[sel];
      $("#g2lrCalc").innerHTML = `filter ${sel + 1} now: [${K.map(row => row.map(v => fmt(v, 2)).join(", ")).join(" ; ")}]\n` +
        `<span class="m">${mode === "learn" ? `starts random; ends close to the ${T[sel][0]} preset (similarity = cosine of the 9 weights; click a filter to inspect it)` : `starts exactly at the ${T[sel][0]} preset; fine-tuning nudges each weight a little for this task`}</span>\n` +
        `<span class="m">Schematic: the morph is drawn by interpolation, not computed by gradient descent.</span>`;
    }
    function renderFrozen() {
      const Tm = DS.temp, St = ST[stencil], R = Tm.length, C = Tm[0].length;
      const D = Tm.map((row, i) => row.map((v, j) => {
        let t = 0;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { if (!St.K[a][b]) continue; const x = (Tm[i + a - 1] || [])[j + b - 1]; if (x == null) return null; t += St.K[a][b] * x; }
        return v == null ? null : t; }));
      const cell = 15, W = 520, H = R * cell + 24, svg = svgIn($("#g2lrFig"), W, H), [lo, hiV] = ext(Tm), mx = Math.max(...D.flat().filter(v => v != null).map(Math.abs));
      if (D[hi[0]][hi[1]] == null) hi = [8, 6];
      const st = (i, j) => i === hi[0] && j === hi[1] ? css("--fg") : null, pick = (i, j) => { if (D[i][j] != null && (i !== hi[0] || j !== hi[1])) { hi = [i, j]; render(); } };
      lbl(svg, 0, 12, "temperature (°C)");
      cells(svg, Tm, { x0: 0, y0: 20, cell, color: v => seq(v, lo, hiV, "--lw", 90), onCell: pick, stroke: (i, j) => Math.abs(i - hi[0]) <= 1 && Math.abs(j - hi[1]) <= 1 && St.K[i - hi[0] + 1][j - hi[1] + 1] ? css("--arch") : null });
      // stencil in the middle
      const sx = 238, sy = 70;
      lbl(svg, sx, sy - 10, "frozen stencil", { "font-size": 10.5 });
      cells(svg, St.K, { x0: sx, y0: sy, cell: 22, color: v => dv(v, 4, 85), label: v => nf(v, 1), fs: 8.5 });
      el("text", { x: sx + 33, y: sy + 92, "text-anchor": "middle", "font-size": 11, fill: css("--arch") }, svg, "0 trainable");
      const ox = 300;
      lbl(svg, ox, 12, `${St.name} (${St.unit}) · red +, blue −`);
      cells(svg, D, { x0: ox, y0: 20, cell, color: v => dv(v, mx, 90), onCell: pick, stroke: st });
      const [i, j] = hi, terms = [];
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (St.K[a][b]) terms.push(`${nf(St.K[a][b], 1)}×${fmt(Tm[i + a - 1][j + b - 1], 1)}`);
      $("#g2lrCalc").innerHTML = `cell row ${i + 1}, col ${j + 1}: ${St.name} = ${terms.join(" + ")} = <span class="k">${fmt(D[i][j], 2)}</span> ${St.unit}\n` +
        `<span class="m">grid spacing about 100 km per cell (schematic grid); cells next to the ocean are left blank. Click a land cell.</span>`;
      $("#g2lrRead").innerHTML = `<div><span>Trainable weights</span><b class="c-arch">0 (frozen)</b></div><div><span>Strongest ${St.name}</span><b>${fmt(mx, 1)}</b></div>`;
    }
    function render() {
      $("#g2lrCtlA").hidden = mode === "frozen"; $("#g2lrCtlB").hidden = mode !== "frozen";
      if (mode === "frozen") renderFrozen(); else renderLearn();
    }
    render(); return render;
  });

  /* ───────── 06 · dilated convolution ───────── */
  demo("op-dilated", () => {
    const xs = DS.daily.rain.slice(96, 128).map(v => Math.round(v)), w = [0.5, 0.3, 0.2];
    let mode = "one", d = 2, plain = false;
    const tR = $("#g2dlT"), gt = slider("g2dlT", v => `day ${v + 1}`, () => render()), gL = slider("g2dlL", v => v, () => render());
    chips($("#g2dlMode"), v => { mode = v; render(); });
    chips($("#g2dlD"), v => { d = +v; render(); });
    chips($("#g2dlNo"), v => { plain = v === "plain"; render(); });
    function renderOne() {
      tR.min = 2 * d; if (gt() < 2 * d) tR.value = 2 * d; tR.parentElement.querySelector("output").textContent = `day ${gt() + 1}`;
      const t = gt(), n = xs.length, W = 520, H = 250, svg = svgIn($("#g2dlFig"), W, H), cw = (W - 30) / n, x = i => 26 + (i + 0.5) * cw;
      const yb = 100, mx = Math.max(...xs), feed = [t, t - d, t - 2 * d];
      const out = xs.map((_, i) => i >= 2 * d ? w[0] * xs[i] + w[1] * xs[i - d] + w[2] * xs[i - 2 * d] : null), mo = Math.max(...out.filter(v => v != null));
      lbl(svg, 0, 12, "rainfall (mm/day)", { "font-size": 11 });
      xs.forEach((v, i) => {
        const h = 78 * v / mx, on = feed.includes(i);
        el("rect", { x: x(i) - cw * 0.34, y: yb - h, width: cw * 0.68, height: Math.max(h, 0.8), rx: 1.5, fill: css("--cool"), opacity: on ? 1 : 0.3 }, svg);
        if (on) el("text", { x: x(i), y: yb - h - 4, "text-anchor": "middle", "font-size": 10, class: "mono" }, svg, v);
        if (i % 4 === 0 || on) el("text", { x: x(i), y: yb + 13, "text-anchor": "middle", "font-size": 9.5, class: on ? "mono" : "mut mono", "font-weight": on ? 600 : 400 }, svg, i + 1);
      });
      el("line", { x1: 26, x2: W - 4, y1: yb, y2: yb, class: "ax" }, svg);
      const yo = 232;
      lbl(svg, 0, 166, "output", { "font-size": 11 });
      out.forEach((v, i) => {
        if (v == null) { el("text", { x: x(i), y: yo - 2, "text-anchor": "middle", "font-size": 9, class: "mut" }, svg, "·"); return; }
        const h = 54 * v / (mo || 1), on = i === t;
        const rr = el("rect", { x: x(i) - cw * 0.34, y: yo - h, width: cw * 0.68, height: Math.max(h, 0.8), rx: 1.5, fill: css("--arch"), opacity: on ? 1 : 0.3, style: "cursor:pointer" }, svg);
        rr.addEventListener("click", () => { tR.value = i; render(); });
        if (on) el("text", { x: x(i), y: yo - h - 4, "text-anchor": "middle", "font-size": 10, class: "mono", "font-weight": 600 }, svg, fmt(v, 1));
      });
      el("line", { x1: 26, x2: W - 4, y1: yo, y2: yo, class: "ax" }, svg);
      feed.forEach((i, k) => el("line", { x1: x(i), y1: yb + 18, x2: x(t), y2: yo - 54 * out[t] / (mo || 1) - 16, stroke: css("--pos"), "stroke-width": 1 + 8 * w[k], opacity: 0.8, "stroke-linecap": "round" }, svg));
      $("#g2dlRead").innerHTML = `<div><span>Weights</span><b class="c-arch">3</b></div><div><span>Days covered</span><b>${2 * d + 1}</b></div>`;
      $("#g2dlCalc").innerHTML = `y(day ${t + 1}) = 0.5·rain(day ${t + 1}) + 0.3·rain(day ${t + 1 - d}) + 0.2·rain(day ${t + 1 - 2 * d})\n` +
        `             = 0.5×${xs[t]} + 0.3×${xs[t - d]} + 0.2×${xs[t - 2 * d]} = <span class="k">${fmt(out[t], 1)}</span>\n<span class="m">dilation ${d}: reads days t, t−${d}, t−${2 * d}; line thickness = weight</span>`;
    }
    function renderStack() {
      const L = gL(), dl = [1, 2, 4, 8].slice(0, L).map(v => plain ? 1 : v), N = 16, W = 520, rowH = 44, H = 36 + L * rowH, svg = svgIn($("#g2dlFig"), W, H);
      const x = i => 112 + i * 25.5, y = l => H - 18 - l * rowH;
      // which nodes feed the final output (layer L, position N−1)
      const on = Array.from({ length: L + 1 }, () => new Set()); on[L].add(N - 1);
      for (let l = L; l >= 1; l--) on[l].forEach(tau => { on[l - 1].add(tau); if (tau - dl[l - 1] >= 0) on[l - 1].add(tau - dl[l - 1]); });
      for (let l = 1; l <= L; l++) for (let tau = 0; tau < N; tau++) [tau, tau - dl[l - 1]].forEach(src => {
        if (src < 0) return; const hot = on[l].has(tau);
        el("line", { x1: x(src), y1: y(l - 1) - 6, x2: x(tau), y2: y(l) + 6, stroke: css(hot ? "--arch" : "--line"), "stroke-width": hot ? 2.2 : 1, opacity: hot ? 0.95 : 0.8 }, svg);
      });
      for (let l = 0; l <= L; l++) {
        lbl(svg, 0, y(l) + 4, l === 0 ? "input days" : `layer ${l} · d = ${dl[l - 1]}`, { "font-size": 11 });
        for (let tau = 0; tau < N; tau++) {
          const hot = on[l].has(tau);
          el("circle", { cx: x(tau), cy: y(l), r: 6, fill: hot ? css(l === 0 ? "--cool" : "--arch") : css("--card"), stroke: css(hot ? (l === 0 ? "--cool" : "--arch") : "--line"), "stroke-width": 1.5 }, svg);
        }
      }
      for (let tau = 0; tau < N; tau += 3) el("text", { x: x(N - 1 - tau), y: H - 2, "text-anchor": "middle", "font-size": 9.5, class: "mut mono" }, svg, tau ? `t−${tau}` : "t");
      const rf = on[0].size, need = rf - 1;
      $("#g2dlRead").innerHTML = `<div><span>Receptive field</span><b>${rf} days</b></div><div><span>Weights</span><b class="c-arch">${2 * L}</b></div><div><span>Layers of size 2 without dilation</span><b class="c-sw">${need}</b></div>`;
      $("#g2dlCalc").innerHTML = plain ? `no dilation: ${L} layer${L > 1 ? "s" : ""} of size 2 see only ${rf} days. Reaching 16 days would take <span class="r">15 layers</span>.`
        : `dilations ${dl.join(", ")}: the receptive field doubles with each layer, 2^${L} = <span class="k">${rf} days</span> with ${2 * L} weights.\n<span class="m">with all 4 layers: 16 days, 8 weights; without dilation the same span needs 15 layers</span>`;
    }
    function render() {
      $("#g2dlCtlA").hidden = mode !== "one"; $("#g2dlCtlB").hidden = mode === "one";
      if (mode === "one") renderOne(); else renderStack();
    }
    render(); return render;
  });

  /* ───────── 07 · transposed convolution ───────── */
  demo("op-tconv", () => {
    const C = [[12, 4], [6, 2]], Kt = [[1, 1], [1, 1]], CB = Array.from({ length: 4 }, () => [5, 5, 5, 5]), K3 = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
    let mode = "pr", sel = [0, 0];
    $("#g2tcK").innerHTML = [0, 1].map(a => [0, 1].map(b => `<input type="number" step="0.1" data-a="${a}" data-b="${b}" value="${Kt[a][b]}" aria-label="filter weight row ${a + 1} column ${b + 1}" style="width:4.4em;text-align:center">`).join("")).join("");
    $$("#g2tcK input").forEach(e => e.addEventListener("input", () => { Kt[e.dataset.a][e.dataset.b] = parseFloat(e.value) || 0; render(); }));
    chips($("#g2tcMode"), v => { mode = v; sel = [0, 0]; render(); });
    // transposed convolution: out[s·i + a][s·j + b] += X[i][j] · K[a][b]
    const tconv = (X, K, s) => { const n = X.length, k = K.length, o = (n - 1) * s + k, O = Array.from({ length: o }, () => Array(o).fill(0));
      X.forEach((row, i) => row.forEach((v, j) => K.forEach((kr, a) => kr.forEach((w, b) => { O[s * i + a][s * j + b] += v * w; })))); return O; };
    // bilinear 2× upsampling (half-pixel centres, edges clamped)
    const bil = X => { const n = X.length, o = 2 * n; return Array.from({ length: o }, (_, i) => Array.from({ length: o }, (_, j) => {
      const y = clamp((i + 0.5) / 2 - 0.5, 0, n - 1), x = clamp((j + 0.5) / 2 - 0.5, 0, n - 1), y0 = Math.floor(y), x0 = Math.floor(x), y1 = Math.min(n - 1, y0 + 1), x1 = Math.min(n - 1, x0 + 1), fy = y - y0, fx = x - x0;
      return X[y0][x0] * (1 - fy) * (1 - fx) + X[y0][x1] * (1 - fy) * fx + X[y1][x0] * fy * (1 - fx) + X[y1][x1] * fy * fx; })); };
    function renderPr() {
      $("#g2tcCtl").hidden = false;
      const O = tconv(C, Kt, 2), B = bil(C), W = 520, H = 210, svg = svgIn($("#g2tcFig"), W, H), top = 30, mx = Math.max(12, ...O.flat()), [si, sj] = sel;
      const cc = 50, oc = 38, ox = 170, bx = 364;
      lbl(svg, 0, 14, "coarse 2 × 2 (mm/day)"); lbl(svg, ox, 14, "transposed conv 4 × 4"); lbl(svg, bx, 14, "bilinear interpolation 4 × 4");
      const land = (i, j) => (i >> 1) === si && (j >> 1) === sj;
      cells(svg, C, { x0: 0, y0: top + 27, cell: cc, color: v => seq(v, 0, mx, "--cool", 75), label: true, fs: 13, stroke: (i, j) => i === si && j === sj ? css("--arch") : null, onCell: (i, j) => { if (si !== i || sj !== j) { sel = [i, j]; render(); } } });
      const mw = Math.max(1, ...Kt.flat().map(Math.abs));
      [0, 1].forEach(a => [0, 1].forEach(b => el("line", { x1: 2 * cc + 2, y1: top + 27 + (si + 0.5) * cc, x2: ox + (2 * sj + b + 0.5) * oc, y2: top + (2 * si + a + 0.5) * oc,
        stroke: wcol(Kt[a][b]), "stroke-width": 0.8 + 4 * Math.abs(Kt[a][b]) / mw, opacity: 0.75, "stroke-linecap": "round" }, svg)));
      cells(svg, O, { x0: ox, y0: top, cell: oc, color: v => seq(v, 0, mx, "--cool", 75), label: v => nf(v, 1), fs: 11, stroke: (i, j) => land(i, j) ? css("--arch") : null });
      cells(svg, B, { x0: bx, y0: top, cell: oc, color: v => seq(v, 0, mx, "--cool", 75), label: v => nf(v, 1), fs: 10.5 });
      const v = C[si][sj];
      $("#g2tcCalc").innerHTML = `coarse cell (${si + 1}, ${sj + 1}) = ${v} mm/day × filter [${Kt.map(r => r.map(w => nf(w, 2)).join(", ")).join(" ; ")}]\n` +
        `→ lands on fine rows ${2 * si + 1}–${2 * si + 2}, cols ${2 * sj + 1}–${2 * sj + 2}: ${[0, 1].map(a => [0, 1].map(b => nf(v * Kt[a][b], 2)).join(", ")).join(" ; ")}\n` +
        `<span class="m">bilinear uses fixed distance weights and no training; the transposed conv weights are learned</span>`;
      $("#g2tcRead").innerHTML = `<div><span>Learned weights</span><b class="c-arch">4</b></div><div><span>Numbers in</span><b>4</b></div><div><span>Numbers out</span><b>16</b></div>`;
    }
    function renderCb() {
      $("#g2tcCtl").hidden = true;
      const O = tconv(CB, K3, 2), W = 520, H = 210, svg = svgIn($("#g2tcFig"), W, H), top = 30, [si, sj] = sel, oc = 18, ox = 128, fx = 330;
      lbl(svg, 0, 14, "constant 4 × 4 (5 mm)"); lbl(svg, ox, 14, "3 × 3 filter, stride 2 → 9 × 9"); lbl(svg, fx, 14, "fix: interpolate, then conv");
      cells(svg, CB, { x0: 0, y0: top + 33, cell: 24, color: () => seq(5, 0, 20, "--cool", 75), label: true, fs: 10, stroke: (i, j) => i === si && j === sj ? css("--arch") : null, onCell: (i, j) => { if (si !== i || sj !== j) { sel = [i, j]; render(); } } });
      cells(svg, O, { x0: ox, y0: top, cell: oc, color: v => seq(v, 0, 20, "--cool", 85), label: true, fs: 8, stroke: (i, j) => i >= 2 * si && i < 2 * si + 3 && j >= 2 * sj && j < 2 * sj + 3 ? css("--arch") : null });
      const U = Array.from({ length: 9 }, () => Array(9).fill(5));
      cells(svg, U, { x0: fx, y0: top, cell: oc, color: () => seq(5, 0, 20, "--cool", 85), label: true, fs: 8 });
      el("line", { x1: (sj + 0.5) * 24, y1: top + 33 + (si + 0.5) * 24, x2: ox + (2 * sj + 1.5) * oc, y2: top + (2 * si + 1.5) * oc, stroke: css("--arch"), "stroke-width": 2, opacity: 0.8 }, svg);
      $("#g2tcCalc").innerHTML = `every input is 5 mm and every weight is 1, yet the output is 5, 10 or 20:\n` +
        `each 3 × 3 footprint steps by 2, so a fine cell is covered by 1, 2 or 4 footprints.\n<span class="m">uneven overlap → checkerboard. Interpolating first, then a normal convolution, gives a flat 5.</span>`;
      $("#g2tcRead").innerHTML = `<div><span>Filter size / stride</span><b>3 / 2</b></div><div><span>Overlap counts</span><b class="c-sw">1, 2, 4</b></div>`;
    }
    const render = () => mode === "pr" ? renderPr() : renderCb();
    render(); return render;
  });

  /* ───────── 08 · depthwise separable convolution ───────── */
  demo("op-sep", () => {
    const g = ["g2spK", "g2spCi", "g2spCo"].map(id => slider(id, v => v, () => counter()));
    const DK = [["blur", PRE.blur], ["Laplacian", PRE.laplacian], ["Sobel x", PRE.sobelx]];
    const r = rng(11), PW = Array.from({ length: 16 }, () => [0, 1, 2].map(() => +(gauss(r) * 0.6).toFixed(2)));
    let sel = 0;
    function fig() {
      const D = CH.map((c, k) => conv2(c.M, DK[k][1], 0, 1)), Ds = D.map(M => { const m = mean(M.flat()), s = sd(M.flat()) || 1; return M.map(r => r.map(v => (v - m) / s)); });
      const W = 520, H = 250, svg = svgIn($("#g2spFig"), W, H), ic = 9, dc = 12, oc = 9, rowY = k => 22 + k * 76;
      lbl(svg, 0, 12, "input channels"); lbl(svg, 120, 12, "depthwise · 3×3 each"); lbl(svg, 330, 12, "pointwise 1×1 → 16");
      CH.forEach((c, k) => {
        const [lo, hi] = ext(c.M);
        cells(svg, c.M, { x0: 0, y0: rowY(k), cell: ic, color: v => seq(v, lo, hi, c.tok, 85) });
        lbl(svg, 0, rowY(k) + 6 * ic + 12, c.name, { "font-size": 10.5 });
        const mk = Math.max(...DK[k][1].flat().map(Math.abs));
        cells(svg, DK[k][1], { x0: 78, y0: rowY(k) + 12, cell: 10, color: v => dv(v, mk, 85) });
        lbl(svg, 78, rowY(k) + 56, DK[k][0], { "font-size": 9.5 });
        el("line", { x1: 56, x2: 76, y1: rowY(k) + 27, y2: rowY(k) + 27, stroke: css("--muted") }, svg);
        el("line", { x1: 110, x2: 140, y1: rowY(k) + 27, y2: rowY(k) + 27, stroke: css("--muted") }, svg);
        cells(svg, Ds[k], { x0: 144, y0: rowY(k) + 3, cell: dc, color: v => dv(v, 2, 85) });
      });
      // pointwise: 4 of the 16 outputs drawn, lines thickness = |weight|
      const outs = [0, 1, 2, 3], oy = o => 20 + o * 54, oxs = 400;
      outs.forEach(o => {
        const Y = Ds[0].map((row, i) => row.map((_, j) => PW[o].reduce((s, w, k) => s + w * Ds[k][i][j], 0)));
        [0, 1, 2].forEach(k => el("line", { x1: 144 + 4 * dc, y1: rowY(k) + 3 + 2 * dc, x2: oxs, y2: oy(o) + 2 * oc + 1, stroke: wcol(PW[o][k]), "stroke-width": 0.6 + 4 * Math.abs(PW[o][k]), opacity: o === sel ? 0.95 : 0.22 }, svg));
        cells(svg, Y, { x0: oxs, y0: oy(o), cell: oc + 1, color: v => dv(v, 2, 85), onCell: () => { if (sel !== o) { sel = o; fig(); } } });
        if (o === sel) el("rect", { x: oxs - 2, y: oy(o) - 2, width: 4 * (oc + 1) + 4, height: 4 * (oc + 1) + 4, rx: 4, fill: "none", stroke: css("--fg"), "stroke-width": 1.5 }, svg);
        lbl(svg, oxs + 46, oy(o) + 24, `out ${o + 1}`, { "font-size": 10 });
      });
      lbl(svg, oxs + 46, oy(3) + 40, "… 12 more", { "font-size": 10.5 });
      lbl(svg, 78, H - 6, "27 weights (3 × 3 × 3)", { "font-size": 10.5, fill: css("--arch"), class: "" });
      lbl(svg, 330, H - 6, "48 weights (3 × 16)", { "font-size": 10.5, fill: css("--arch"), class: "" });
      $("#g2spCalc").innerHTML = `out ${sel + 1} = ${PW[sel].map((w, k) => `${fmt(w, 2)}·${CH[k].short}'`).join(" + ")}\n<span class="m">T', H', W' = each channel after its own depthwise filter (standardized). Click an output map.</span>`;
    }
    function counter() {
      const [k, ci, co] = g.map(f => f()), std = k * k * ci * co, sep = k * k * ci + ci * co, W = 520, H = 92, svg = svgIn($("#g2spBar"), W, H), mx = Math.max(std, sep);
      [[std, "standard", "--lw", `${k}·${k}·${ci}·${co}`], [sep, "separable", "--ok", `${k}·${k}·${ci} + ${ci}·${co}`]].forEach(([v, t, c, f], i) => {
        lbl(svg, 0, 24 + i * 44, t, { "font-size": 12.5, class: "" });
        el("rect", { x: 84, y: 8 + i * 44, width: Math.max(2, 290 * v / mx), height: 28, rx: 6, fill: css(c), opacity: 0.85 }, svg);
        el("text", { x: 90 + Math.max(2, 290 * v / mx), y: 27 + i * 44, class: "mono", "font-size": 12 }, svg, `${fmtN(v)} = ${f}`);
      });
      $("#g2spRead").innerHTML = `<div><span>Fewer weights</span><b class="c-ok">${fmt(std / sep, 1)}×</b></div><div><span>Saved</span><b>${fmt(100 * (1 - sep / std), 1)}%</b></div>`;
    }
    const render = () => { fig(); counter(); };
    render(); return render;
  });

  /* ───────── 08b · 1 × 1 convolution ───────── */
  demo("op-1x1", () => {
    const g = ["g2pwT", "g2pwH", "g2pwW"].map(id => slider(id, v => fmt(v, 2), () => render()));
    let hi = [2, 3];
    function render() {
      const w = g.map(f => f()), Y = CH[0].M.map((row, i) => row.map((_, j) => CH.reduce((s, c, k) => s + w[k] * c.M[i][j], 0)));
      const W = 520, ic = 17, mapW = 6 * ic, gap = (W - 3 * mapW) / 2, oc = 24, ox = (W - 6 * oc) / 2, oy = 196, H = oy + 6 * oc + 4, svg = svgIn($("#g2pwFig"), W, H);
      const [hi0, hj] = hi, pick = (i, j) => { if (i !== hi0 || j !== hj) { hi = [i, j]; render(); } };
      const mw = Math.max(1, ...w.map(Math.abs));
      CH.forEach((c, k) => {
        const x0 = k * (mapW + gap), [lo, hv] = ext(c.M);
        lbl(svg, x0, 12, `${c.name}${c.unit ? ` (${c.unit})` : ""}`, { "font-size": 11 });
        cells(svg, c.M, { x0, y0: 20, cell: ic, color: v => seq(v, lo, hv, c.tok, 85), stroke: (i, j) => i === hi0 && j === hj ? css("--fg") : null, onCell: pick });
        const x1 = x0 + (hj + 0.5) * ic, y1 = 20 + (hi0 + 0.5) * ic, x2 = ox + (hj + 0.5) * oc, y2 = oy + (hi0 + 0.5) * oc;
        el("line", { x1, y1: 20 + 6 * ic + 4, x2, y2: oy - 4, stroke: wcol(w[k]), "stroke-width": 0.6 + 6 * Math.abs(w[k]) / mw, opacity: Math.abs(w[k]) < 1e-9 ? 0.2 : 0.85, "stroke-linecap": "round" }, svg);
        el("line", { x1, y1, x2: x1, y2: 20 + 6 * ic + 4, stroke: css("--fg"), "stroke-width": 1, "stroke-dasharray": "2 2" }, svg);
        el("text", { x: x1 + (x2 - x1) * 0.18 + (k - 1) * 16, y: 20 + 6 * ic + 4 + (oy - 24 - 6 * ic) * 0.18 + 12, "text-anchor": "middle", "font-size": 11.5, class: "mono", fill: wcol(w[k]), style: halo() }, svg, `${fmt(w[k], 2)}×${nf(c.M[hi0][hj], c.d)}`);
      });
      const mx = Math.max(...Y.flat().map(Math.abs)), anyNeg = Y.flat().some(v => v < 0), [ylo, yhi] = ext(Y);
      lbl(svg, ox, oy - 6 + 0, "", {});
      cells(svg, Y, { x0: ox, y0: oy, cell: oc, color: v => anyNeg ? dv(v, mx, 85) : seq(v, ylo, yhi, "--arch", 80), stroke: (i, j) => i === hi0 && j === hj ? css("--fg") : null, onCell: pick });
      el("text", { x: ox + (hj + 0.5) * oc, y: oy + (hi0 + 0.5) * oc + 4, "text-anchor": "middle", "font-size": 9, class: "mono", "font-weight": 600 }, svg, fmt(Y[hi0][hj], 1));
      el("text", { x: ox + 6 * oc + 10, y: oy + 14, "font-size": 11.5, class: "mut" }, svg, "output map");
      el("text", { x: ox + 6 * oc + 10, y: oy + 30, "font-size": 11, class: "mut" }, svg, "same 3 weights");
      el("text", { x: ox + 6 * oc + 10, y: oy + 44, "font-size": 11, class: "mut" }, svg, "at every pixel");
      const v = CH.map(c => c.M[hi0][hj]), prod = v.map((x, k) => w[k] * x);
      $("#g2pwCalc").innerHTML = `pixel (row ${hi0 + 1}, col ${hj + 1}): T = ${nf(v[0], 1)}, H = ${nf(v[1], 2)}, W = ${nf(v[2], 1)}\n` +
        `y = ${w.map((x, k) => `${fmt(x, 2)}×${nf(v[k], CH[k].d)}`).join(" + ")} = ${prod.map(p => fmt(p, 2)).join(" + ")} = <span class="k">${fmt(prod.reduce((a, b) => a + b, 0), 2)}</span>\n` +
        `<span class="m">temperature dominates because its numbers are largest; real models standardize the channels first</span>`;
    }
    render(); return render;
  });
})();
