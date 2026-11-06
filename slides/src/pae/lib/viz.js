/* ═════════ PAE-Minas · shared drawing helpers ═════════
   Colours: positives warm (--lw), unlabeled / negatives cool (--cool or --muted), probability always VIZ.prob (viridis).
   VIZ.map(host, values, opts)        raster map of the study area on a <canvas>; returns { canvas, cellAt(evt) }
   VIZ.legend(host, opts)              colour bar with min/max labels
   VIZ.scatter(host, pts, opts)        2-D scatter with an optional probability background and threshold contour
   VIZ.curves(host, series, opts)      line chart (success-rate, PR, ROC, loss…) with a legend
   VIZ.bars(host, items, opts)         horizontal bars (importance, coefficients); negative values go left
   VIZ.quiz(host, questions)           multiple-choice quiz in Spanish                                               */
const VIZ = (() => {
  const VIR = ["#440154", "#482878", "#3e4989", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6ece58", "#b5de2b", "#fde725"];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lerpHex = (stops, t) => { t = clamp(t, 0, 1) * (stops.length - 1); const i = Math.min(Math.floor(t), stops.length - 2), f = t - i, a = hex(stops[i]), b = hex(stops[i + 1]); return `rgb(${a.map((v, k) => Math.round(v + f * (b[k] - v))).join(",")})`; };
  const prob = v => lerpHex(VIR, v);                                     // probability: one sequential colormap
  const seq = (v, lo, hi) => lerpHex(VIR, (v - lo) / (hi - lo || 1));
  const LITH = ["--well", "--data", "--sw-soft"], LITHNAME = ["Sedimentos", "Ultramáficas (peridotita serpentinizada)", "Aluvión"];
  const lith = v => css(LITH[v]);
  // a sensible default colour for each layer
  const RANGE = { ferric: [1.0, 2.0], clay: [1.08, 1.4], distUM: [0, 2.5], slope: [0, 10], mag: [-50, 300], ndvi: [0.2, 0.9], elev: [40, 190] };
  const layerColor = key => v => seq(v, RANGE[key][0], RANGE[key][1]);

  /* the study-area map. values: array (length N) or function(k); opts:
     color(v,k) → css colour (default: probability), valid (array: cells to draw; others in --well),
     deposits: 'known' | 'all' | false (outline known deposits solid, undiscovered dashed when 'all'),
     mine: true (hatch the mine), river: true, hi: array/Set of cells to outline, points: [{k, color, r}],
     scale: CSS px per cell for the canvas resolution (default 6) */
  function map(host, values, { color = prob, valid = null, deposits = "known", mine = true, river = true, hi = null, points = null, scale = 6 } = {}) {
    const { NX, NY, N, DEP, CELL } = AREA, s = scale, cv = document.createElement("canvas");
    cv.width = NX * s; cv.height = NY * s; cv.style.width = "100%"; cv.style.height = "auto"; cv.style.display = "block"; cv.style.borderRadius = "8px";
    host.innerHTML = ""; host.appendChild(cv);
    const g = cv.getContext("2d"), val = typeof values === "function" ? values : k => values[k], well = css("--well");
    for (let k = 0; k < N; k++) { const i = k % NX, j = Math.floor(k / NX); g.fillStyle = valid && !valid[k] ? well : color(val(k), k); g.fillRect(i * s, j * s, s, s); }
    if (mine) { g.save(); g.strokeStyle = css("--muted"); g.lineWidth = 1; for (let k = 0; k < N; k++) if (AREA.mine[k]) { const i = k % NX, j = Math.floor(k / NX); g.fillStyle = css("--card"); g.fillRect(i * s, j * s, s, s); g.beginPath(); g.moveTo(i * s, j * s + s); g.lineTo(i * s + s, j * s); g.stroke(); } g.restore(); }
    const outline = (set, col, dash, lw = 1.8) => { g.save(); g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash); g.beginPath();
      set.forEach(k => { const i = k % NX, j = Math.floor(k / NX), has = (a, b) => a >= 0 && b >= 0 && a < NX && b < NY && set.has(b * NX + a);
        if (!has(i, j - 1)) { g.moveTo(i * s, j * s); g.lineTo(i * s + s, j * s); } if (!has(i, j + 1)) { g.moveTo(i * s, j * s + s); g.lineTo(i * s + s, j * s + s); }
        if (!has(i - 1, j)) { g.moveTo(i * s, j * s); g.lineTo(i * s, j * s + s); } if (!has(i + 1, j)) { g.moveTo(i * s + s, j * s); g.lineTo(i * s + s, j * s + s); } });
      g.stroke(); g.restore(); };
    if (deposits) DEP.forEach(d => { if (!d.known && deposits !== "all") return; outline(new Set(d.cells), d.known ? css("--lw") : css("--fg"), d.known ? [] : [3, 2], d.known ? 2 : 1.4); });
    if (hi) outline(hi instanceof Set ? hi : new Set(hi), css("--fg"), [], 1);
    if (river) { g.save(); g.strokeStyle = css("--cool"); g.lineWidth = 2; g.beginPath(); for (let j = 0; j <= NY; j++) { const yk = (NY - j) * CELL, x = AREA.riverX(yk) / CELL * s; j ? g.lineTo(x, j * s) : g.moveTo(x, j * s); } g.stroke(); g.restore(); }
    if (points) points.forEach(p => { const i = p.k % NX, j = Math.floor(p.k / NX); g.beginPath(); g.arc(i * s + s / 2, j * s + s / 2, p.r || s * 0.6, 0, 2 * Math.PI); g.fillStyle = p.color || css("--lw"); g.fill(); g.lineWidth = 1; g.strokeStyle = css("--bg"); g.stroke(); });
    const cellAt = e => { const r = cv.getBoundingClientRect(), i = Math.floor((e.clientX - r.left) / r.width * NX), j = Math.floor((e.clientY - r.top) / r.height * NY); return i >= 0 && j >= 0 && i < NX && j < NY ? j * NX + i : -1; };
    return { canvas: cv, cellAt };
  }
  // a horizontal colour bar
  function legend(host, { color = prob, min = 0, max = 1, label = "probabilidad", digits = 1, width = 220 } = {}) {
    const svg = svgIn(host, width, 34), n = 40; svg.style.maxWidth = width + "px";
    for (let i = 0; i < n; i++) el("rect", { x: 4 + i * (width - 8) / n, y: 4, width: (width - 8) / n + .5, height: 10, fill: color(min + (max - min) * (i + .5) / n) }, svg);
    el("text", { x: 4, y: 28, "font-size": 11, class: "mono", fill: css("--muted") }, svg, fmt(min, digits));
    el("text", { x: width - 4, y: 28, "font-size": 11, class: "mono", fill: css("--muted"), "text-anchor": "end" }, svg, fmt(max, digits));
    el("text", { x: width / 2, y: 28, "font-size": 11, fill: css("--muted"), "text-anchor": "middle" }, svg, label);
  }
  /* 2-D scatter. pts: [{x, y, cls: 1|0, r?, hi?}]; opts: xr, yr ([min,max]), xl, yl, bg: (x,y) → probability (drawn as a
     heatmap), thr: draws the bg = thr contour, W, H, onPoint(i), onHover(x,y) */
  function scatter(host, pts, { xr, yr, xl = "", yl = "", bg = null, thr = null, W = 460, H = 300, nx = 46, ny = 30, xt = null, yt = null, xf = v => fmt(v, 1), yf = v => fmt(v, 1), onHover = null } = {}) {
    const svg = svgIn(host, W, H), m = { l: 44, r: 10, t: 10, b: 30 }, X = lin(xr[0], xr[1], m.l, W - m.r), Y = lin(yr[0], yr[1], H - m.b, m.t);
    if (bg) { const cw = (W - m.l - m.r) / nx, chh = (H - m.t - m.b) / ny, grid = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = xr[0] + (i + .5) * (xr[1] - xr[0]) / nx, y = yr[0] + (j + .5) * (yr[1] - yr[0]) / ny, p = bg(x, y); grid.push([i, j, p]);
        el("rect", { x: m.l + i * cw, y: H - m.b - (j + 1) * chh, width: cw + .4, height: chh + .4, fill: prob(p), opacity: .55 }, svg); }
      if (thr != null) grid.forEach(([i, j, p]) => { const nb = grid.find(q => q[0] === i + 1 && q[1] === j), up = grid.find(q => q[0] === i && q[1] === j + 1);
        if (nb && (p >= thr) !== (nb[2] >= thr)) el("line", { x1: m.l + (i + 1) * cw, x2: m.l + (i + 1) * cw, y1: H - m.b - j * chh, y2: H - m.b - (j + 1) * chh, stroke: css("--fg"), "stroke-width": 2 }, svg);
        if (up && (p >= thr) !== (up[2] >= thr)) el("line", { x1: m.l + i * cw, x2: m.l + (i + 1) * cw, y1: H - m.b - (j + 1) * chh, y2: H - m.b - (j + 1) * chh, stroke: css("--fg"), "stroke-width": 2 }, svg); }); }
    const ticks = (a, b) => { const st = (b - a) / 4; return [0, 1, 2, 3, 4].map(i => a + i * st); };
    (xt || ticks(...xr)).forEach(v => el("text", { x: X(v), y: H - m.b + 15, "text-anchor": "middle", class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, xf(v)));
    (yt || ticks(...yr)).forEach(v => el("text", { x: m.l - 6, y: Y(v) + 4, "text-anchor": "end", class: "mono", "font-size": 10.5, fill: css("--muted") }, svg, yf(v)));
    el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: "ax" }, svg); el("line", { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, class: "ax" }, svg);
    el("text", { x: W - m.r, y: H - 3, "text-anchor": "end", "font-size": 11, fill: css("--muted") }, svg, xl);
    el("text", { x: m.l + 4, y: m.t + 10, "font-size": 11, fill: css("--muted") }, svg, yl);
    pts.filter(p => !p.cls).concat(pts.filter(p => p.cls)).forEach(p => el("circle", { cx: X(clamp(p.x, xr[0], xr[1])), cy: Y(clamp(p.y, yr[0], yr[1])), r: p.r || (p.cls ? 4.2 : 2.6), fill: p.cls ? css("--lw") : css("--cool"), opacity: p.cls ? .95 : .55, stroke: p.hi ? css("--fg") : (p.cls ? css("--bg") : "none"), "stroke-width": p.hi ? 2 : 1 }, svg));
    if (onHover) { const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);
      hit.addEventListener("mousemove", e => { const r = svg.getBoundingClientRect(), sx = W / r.width, px = (e.clientX - r.left) * sx, py = (e.clientY - r.top) * sx; onHover(xr[0] + (px - m.l) / (W - m.l - m.r) * (xr[1] - xr[0]), yr[0] + (H - m.b - py) / (H - m.t - m.b) * (yr[1] - yr[0]), px, py, svg); }); }
    return { svg, X, Y };
  }
  /* curves: series [{ pts: [[x,y]…], col: token, label, dash?, w? }]; opts: xr, yr, xl, yl, W, H, diag (draw y = x), marks [[x, label, token]] */
  function curves(host, series, { xr = [0, 1], yr = [0, 1], xl = "", yl = "", W = 460, H = 240, diag = false, marks = [], xf = v => fmt(v, 1), yf = v => fmt(v, 1), xt = null, yt = null, legendAt = "br" } = {}) {
    const svg = svgIn(host, W, H);
    const A = axes(svg, { W, H, m: { l: 42, r: 12, t: 12, b: 28 }, x0: xr[0], x1: xr[1], y0: yr[0], y1: yr[1], xt: xt || [xr[0], (xr[0] + xr[1]) / 2, xr[1]], yt: yt || [yr[0], (yr[0] + yr[1]) / 2, yr[1]], xf, yf, xl, yl });
    if (diag) el("line", { x1: A.x(xr[0]), y1: A.y(yr[0]), x2: A.x(xr[1]), y2: A.y(yr[1]), stroke: css("--muted"), "stroke-dasharray": "4 4" }, svg);
    marks.forEach(([x, lab, tok]) => { el("line", { x1: A.x(x), x2: A.x(x), y1: 12, y2: H - 28, stroke: css(tok || "--muted"), "stroke-dasharray": "3 3" }, svg); el("text", { x: A.x(x) + 4, y: 24, "font-size": 10.5, fill: css(tok || "--muted") }, svg, lab); });
    series.forEach(s => el("path", { d: path(s.pts.map(([x, y]) => [A.x(clamp(x, xr[0], xr[1])), A.y(clamp(y, yr[0], yr[1]))])), fill: "none", stroke: css(s.col), "stroke-width": s.w || 2, "stroke-dasharray": s.dash || "" }, svg));
    const lx = legendAt.includes("r") ? W - 16 : 50, anchor = legendAt.includes("r") ? "end" : "start"; let ly = legendAt.includes("b") ? H - 36 - 14 * (series.length - 1) : 26;
    series.forEach(s => { if (!s.label) return; el("text", { x: lx, y: ly, "text-anchor": anchor, "font-size": 11, fill: css(s.col) }, svg, (s.dash ? "- - " : "— ") + s.label); ly += 14; });
    return { svg, ...A };
  }
  /* bars: items [{label, v, col?}]; opts: W, max (abs), digits, signed (negative to the left of a centre line) */
  function bars(host, items, { W = 420, rowH = 24, max = null, digits = 2, signed = false, labelW = 150 } = {}) {
    const H = items.length * rowH + 6, svg = svgIn(host, W, H), mx = max || Math.max(...items.map(i => Math.abs(i.v)), 1e-9), span = signed ? (W - labelW - 96) / 2 : W - labelW - 50, x0 = signed ? labelW + 46 + span : labelW;
    if (signed) el("line", { x1: x0, x2: x0, y1: 0, y2: H, stroke: css("--line") }, svg);
    items.forEach((it, r) => { const y = 4 + r * rowH, w = span * Math.abs(it.v) / mx, neg = it.v < 0;
      el("text", { x: labelW - 8, y: y + rowH / 2 + 3, "text-anchor": "end", "font-size": 11.5, fill: css("--fg") }, svg, it.label);
      el("rect", { x: neg ? x0 - w : x0, y: y + 3, width: Math.max(w, it.v ? 1 : 0), height: rowH - 8, rx: 3, fill: css(it.col || (neg ? "--neg" : "--pos")), opacity: .85 }, svg);
      el("text", { x: neg ? x0 - w - 4 : x0 + w + 4, y: y + rowH / 2 + 3, "text-anchor": neg ? "end" : "start", class: "mono", "font-size": 11, fill: css("--muted") }, svg, fmt(it.v, digits)); });
    return svg;
  }
  /* a short multiple-choice quiz in Spanish. questions: [{ q, opts: [...], right: index, why }] */
  function quiz(host, questions) {
    host.innerHTML = questions.map((Q, n) => `<div class="card" style="margin-bottom:8px"><p style="margin:0 0 6px"><b>${Q.q}</b></p><div class="chips">${Q.opts.map((o, i) => `<button class="chip" type="button" data-q="${n}" data-i="${i}">${o}</button>`).join("")}</div><p class="note" data-fb="${n}" style="margin:6px 0 0"></p></div>`).join("");
    $$("button[data-q]", host).forEach(b => b.addEventListener("click", () => {
      const Q = questions[+b.dataset.q], ok = +b.dataset.i === Q.right, fb = host.querySelector(`[data-fb="${b.dataset.q}"]`);
      $$(`button[data-q="${b.dataset.q}"]`, host).forEach(x => x.setAttribute("aria-pressed", x === b));
      fb.innerHTML = `<b style="color:var(${ok ? "--ok" : "--lw"})">${ok ? "Correcto." : "No: " + Q.opts[Q.right] + "."}</b> ${Q.why}`;
    }));
  }
  return { prob, seq, lith, LITHNAME, layerColor, RANGE, map, legend, scatter, curves, bars, quiz };
})();
