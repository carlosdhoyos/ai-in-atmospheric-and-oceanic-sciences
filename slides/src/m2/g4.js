/* Module 2 · group g4: graph message passing, pooling, resampling, flatten, embedding, positional encoding */
(function () {
  /* sequential colour: token over the well colour */
  const ramp = (tok, lo, hi) => v => `color-mix(in srgb, ${css(tok)} ${Math.round(clamp((v - lo) / (hi - lo || 1), 0, 1) * 92)}%, ${css("--well")})`;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  /* draw a field (null = no data) at (x0, y0) inside an existing svg */
  function fieldAt(svg, F, x0, y0, cell, color, opts = {}) {
    const g = el("g", {}, svg);
    F.forEach((row, i) => row.forEach((v, j) => {
      if (v == null) return;
      const r = el("rect", { x: x0 + j * cell, y: y0 + i * cell, width: Math.max(cell - (opts.gap ?? 0.6), 0.5), height: Math.max(cell - (opts.gap ?? 0.6), 0.5), rx: cell > 8 ? 1.5 : 0, fill: color(v) }, g);
      if (opts.onCell) { r.style.cursor = "pointer"; r.addEventListener("mouseenter", () => opts.onCell(i, j)); r.addEventListener("click", () => opts.onCell(i, j)); }
      if (opts.label && cell >= 18) el("text", { x: x0 + j * cell + cell / 2, y: y0 + i * cell + cell / 2 + 4, "text-anchor": "middle", class: "mono", "font-size": Math.min(11, cell * 0.38) }, g, fmt(v, opts.digits ?? 0));
    }));
    return g;
  }
  const maskF = (F, m = DS.mask) => F.map((r, i) => r.map((v, j) => m[i][j] ? v : null));
  /* fill ocean cells with the nearest land value (so resampling has something to read) */
  const fillNearest = F => F.map((row, i) => row.map((v, j) => {
    if (v != null) return v; let b = null, bd = 1e9;
    F.forEach((rr, a) => rr.forEach((u, c) => { if (u != null) { const d = (a - i) ** 2 + (c - j) ** 2; if (d < bd) { bd = d; b = u; } } }));
    return b;
  }));

  /* ───────── 13 · graph message passing ───────── */
  demo("op-graph", () => {
    const cell = 19, OX = 4, OY = 6;
    const ST = [{ n: "A", c: 5, r: 7, v: 10 }, { n: "B", c: 4, r: 4, v: 20 }, { n: "C", c: 7, r: 10, v: 30 }, { n: "D", c: 9, r: 2, v: 4 },
      { n: "E", c: 3, r: 12, v: 42 }, { n: "F", c: 11, r: 6, v: 12 }, { n: "G", c: 9, r: 13, v: 24 }, { n: "H", c: 8, r: 16, v: 6 }];
    const P = ST.map(s => [OX + (s.c + 0.5) * cell, OY + (s.r + 0.5) * cell]);
    const E0 = [[0, 1], [0, 2], [1, 3], [3, 5], [2, 5], [2, 4], [2, 6], [4, 6], [6, 7]];
    const key = (a, b) => a < b ? a + "-" + b : b + "-" + a;
    let E, h, round, hist, sel = 0, pend = null, anim = null, playing = 0;
    const ga = slider("g4gnA", v => fmt(v, 2), () => draw());
    const mode = chips($("#g4gnMode"), () => { pend = null; draw(); });
    function reset() { E = new Set(E0.map(([a, b]) => key(a, b))); h = ST.map(s => s.v); round = 0; hist = [spread(h)]; }
    function spread(v) { return Math.max(...v) - Math.min(...v); }
    const nb = i => [...E].map(k => k.split("-").map(Number)).filter(e => e.includes(i)).map(e => e[0] === i ? e[1] : e[0]);
    function hops(src) { const d = ST.map(() => Infinity); d[src] = 0; const q = [src];
      while (q.length) { const u = q.shift(); nb(u).forEach(w => { if (d[w] === Infinity) { d[w] = d[u] + 1; q.push(w); } }); } return d; }
    function step() { const a = ga(); h = h.map((v, i) => { const N = nb(i); return N.length ? a * v + (1 - a) * mean(N.map(j => h[j])) : v; }); round++; hist.push(spread(h)); }
    function animate(n) {
      if (playing) return; playing = n;
      const one = () => { const t0 = performance.now();
        const tick = now => { anim = Math.min(1, (now - t0) / 420); draw();
          if (anim < 1) requestAnimationFrame(tick); else { anim = null; step(); playing--; draw(); if (playing > 0) setTimeout(one, 90); } };
        requestAnimationFrame(tick); };
      one();
    }
    $("#g4gnStep").onclick = () => animate(1);
    $("#g4gnPlay").onclick = () => animate(10);
    $("#g4gnReset").onclick = () => { if (playing) return; reset(); draw(); };
    function clickNode(i) {
      if (mode() === "inspect") { sel = i; draw(); return; }
      if (pend == null) { pend = i; draw(); return; }
      if (pend !== i) { const k = key(pend, i); E.has(k) ? E.delete(k) : E.add(k); }
      pend = null; draw();
    }
    function draw() {
      const W = 560, H = 360, svg = svgIn($("#g4gnFig"), W, H), col = ramp("--cool", 0, 45), d = hops(sel);
      /* outline of Colombia */
      DS.mask.forEach((row, i) => row.forEach((m, j) => { if (m) el("rect", { x: OX + j * cell, y: OY + i * cell, width: cell, height: cell, fill: css("--well") }, svg); }));
      /* edges */
      [...E].forEach(k => { const [a, b] = k.split("-").map(Number), act = a === sel || b === sel;
        el("line", { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: css(act ? "--arch" : "--muted"), "stroke-width": act ? 2.6 : 1.4, opacity: act ? 1 : 0.7 }, svg);
        if (mode() === "edit") { const hit = el("line", { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: "transparent", "stroke-width": 12, style: "cursor:pointer" }, svg);
          hit.addEventListener("click", () => { E.delete(k); pend = null; draw(); }); }
        if (anim != null) [[a, b], [b, a]].forEach(([s, t]) => {
          const x = P[s][0] + (P[t][0] - P[s][0]) * ease(anim), y = P[s][1] + (P[t][1] - P[s][1]) * ease(anim);
          el("circle", { cx: x, cy: y, r: 4, fill: col(h[s]), stroke: css("--arch"), "stroke-width": 1 }, svg); });
      });
      /* stations */
      h.forEach((v, i) => { const g = el("g", { style: "cursor:pointer" }, svg), reach = d[i] <= round && i !== sel;
        if (reach) el("circle", { cx: P[i][0], cy: P[i][1], r: 18, fill: "none", stroke: css("--arch"), "stroke-dasharray": "3 2", "stroke-width": 1.4 }, g);
        el("circle", { cx: P[i][0], cy: P[i][1], r: 14, fill: col(v), stroke: css(i === sel || i === pend ? "--fg" : "--line"), "stroke-width": i === sel || i === pend ? 2.4 : 1 }, g);
        el("text", { x: P[i][0], y: P[i][1] + 3.5, "text-anchor": "middle", class: "mono", "font-size": 9.5 }, g, fmt(v, 1));
        el("text", { x: P[i][0] + 15, y: P[i][1] - 11, "font-size": 11.5, "font-weight": 600, fill: css(i === sel ? "--arch" : "--fg") }, g, ST[i].n);
        g.addEventListener("click", () => clickNode(i)); });
      /* spread vs round chart */
      const cx0 = 310, cw = 240, ch = 150, cy0 = 26, R = Math.max(10, hist.length - 1), top = Math.max(...hist, 1);
      const x = lin(0, R, cx0 + 30, cx0 + cw), y = lin(0, top, cy0 + ch, cy0);
      el("text", { x: cx0 + 30, y: cy0 - 10, class: "mut", "font-size": 11 }, svg, "spread = max − min (mm)");
      [0, top / 2, top].forEach(v => { el("line", { x1: cx0 + 30, x2: cx0 + cw, y1: y(v), y2: y(v), class: "grid" }, svg);
        el("text", { x: cx0 + 25, y: y(v) + 4, "text-anchor": "end", class: "mut mono", "font-size": 10 }, svg, fmt(v, 0)); });
      el("line", { x1: cx0 + 30, x2: cx0 + cw, y1: y(0), y2: y(0), class: "ax" }, svg);
      [0, R].forEach(v => el("text", { x: x(v), y: cy0 + ch + 14, "text-anchor": "middle", class: "mut mono", "font-size": 10 }, svg, v));
      el("text", { x: cx0 + cw, y: cy0 + ch + 28, "text-anchor": "end", class: "mut", "font-size": 11 }, svg, "round");
      el("path", { d: path(hist.map((s, k) => [x(k), y(s)])), fill: "none", stroke: css("--arch"), "stroke-width": 2 }, svg);
      hist.forEach((s, k) => el("circle", { cx: x(k), cy: y(s), r: 2.5, fill: css("--arch") }, svg));
      /* value strip: all stations on one axis (they bunch up with over-smoothing) */
      const sx = lin(0, 45, cx0 + 30, cx0 + cw), sy = 268;
      el("text", { x: cx0 + 30, y: sy - 26, class: "mut", "font-size": 11 }, svg, "all station values (mm)");
      el("line", { x1: sx(0), x2: sx(45), y1: sy, y2: sy, class: "ax" }, svg);
      [0, 15, 30, 45].forEach(v => el("text", { x: sx(v), y: sy + 16, "text-anchor": "middle", class: "mut mono", "font-size": 10 }, svg, v));
      h.forEach((v, i) => { el("circle", { cx: sx(v), cy: sy - 6, r: 5, fill: col(v), stroke: css(i === sel ? "--fg" : "--muted"), "stroke-width": i === sel ? 2 : 0.8 }, svg); });
      el("text", { x: cx0 + 30, y: sy + 46, "font-size": 11.5, fill: css("--arch") }, svg, `dashed ring: stations within ${round} hop${round === 1 ? "" : "s"} of ${ST[sel].n}`);
      el("text", { x: cx0 + 30, y: sy + 62, class: "mut", "font-size": 11.5 }, svg, `${d.filter(v => v <= round).length} of 8 stations have reached ${ST[sel].n}`);
      /* readout + calc */
      const N = nb(sel), a = ga(), m = N.length ? mean(N.map(j => h[j])) : h[sel], nx = N.length ? a * h[sel] + (1 - a) * m : h[sel];
      $("#g4gnRead").innerHTML = `<div><span>Round</span><b>${round}</b></div><div><span>Spread</span><b class="c-arch">${fmt(spread(h), 1)} mm</b></div><div><span>Std of stations</span><b>${fmt(Math.sqrt(mean(h.map(v => (v - mean(h)) ** 2))), 2)} mm</b></div>`;
      $("#g4gnCalc").innerHTML = N.length
        ? `round ${round} · station ${ST[sel].n}: neighbours ${N.map(j => ST[j].n).join(", ")}\nmessages [${N.map(j => fmt(h[j], 1)).join(", ")}] → mean ${fmt(m, 2)}\nnew ${ST[sel].n} = ${fmt(a, 2)}·${fmt(h[sel], 1)} + ${fmt(1 - a, 2)}·${fmt(m, 2)} = <span class="k">${fmt(nx, 2)}</span>`
        : `station ${ST[sel].n} has no neighbours: it keeps ${fmt(h[sel], 1)} mm and hears nothing`;
      $("#g4gnHint").textContent = mode() === "edit"
        ? (pend == null ? "Edit mode: click an edge to remove it, or click two stations to add or remove the edge between them." : `Now click a second station to connect it with ${ST[pend].n}.`)
        : "Inspect mode: click a station to see its messages.";
    }
    reset(); draw(); return draw;
  });

  /* ───────── 14 · pooling ───────── */
  demo("op-pool", () => {
    const X0 = [[20, 22, 18, 17], [21, 25, 16, 19], [15, 14, 23, 24], [13, 12, 22, 26]];
    let X = X0.map(r => r.slice()), nudged = false, hov = [4, 3];
    const mode = chips($("#g4plMode"), () => render()), win = chips($("#g4plWin"), v => { hov = v === "g" ? [0, 0] : [Math.floor(8 / +v), Math.floor(6 / +v)]; render(); });
    $("#g4plNudge").onclick = () => { nudged = !nudged; X = X0.map(r => r.slice()); if (nudged) { X[1][1] = 21; X[1][0] = 25; }
      $("#g4plNudge").textContent = nudged ? "Put the 25 back" : "Move the 25 one cell"; render(); };
    function pool(F, k, m) { /* window k, stride k; null cells ignored; returns {out, arg} */
      const R = Math.ceil(F.length / k), C = Math.ceil(F[0].length / k), out = [], arg = [];
      for (let a = 0; a < R; a++) { out.push([]); arg.push([]);
        for (let b = 0; b < C; b++) { const vs = [];
          for (let i = a * k; i < Math.min(F.length, a * k + k); i++) for (let j = b * k; j < Math.min(F[0].length, b * k + k); j++) if (F[i][j] != null) vs.push([F[i][j], i, j]);
          if (!vs.length) { out[a].push(null); arg[a].push(null); continue; }
          const best = vs.reduce((p, q) => q[0] > p[0] ? q : p);
          out[a].push(m === "max" ? best[0] : mean(vs.map(v => v[0]))); arg[a].push(best.slice(1)); } }
      return { out, arg };
    }
    function example() {
      const m = mode(), W = 440, H = 176, cs = 36, ix = 6, iy = 22, ox = 300, oy = 22 + cs, svg = svgIn($("#g4plEx"), W, H), { out, arg } = pool(X, 2, m);
      const wc = ["--arch", "--cool", "--sw", "--ok"];
      el("text", { x: ix, y: 12, class: "mut", "font-size": 11 }, svg, "input 4 × 4");
      el("text", { x: ox, y: oy - 10, class: "mut", "font-size": 11 }, svg, `${m === "max" ? "max" : "average"} 2 × 2, stride 2`);
      /* connections first (behind the cells): line width = weight (max: winner 1, others 0; average: each 1/4) */
      X.forEach((row, i) => row.forEach((v, j) => { const a = i >> 1, b = j >> 1, win = arg[a][b], wgt = m === "max" ? (win[0] === i && win[1] === j ? 1 : 0) : 0.25;
        if (!wgt) return;
        el("line", { x1: ix + j * cs + cs / 2, y1: iy + i * cs + cs / 2, x2: ox, y2: oy + a * cs + cs / 2, stroke: css(wc[a * 2 + b]), "stroke-width": 0.6 + 3.4 * wgt, opacity: 0.75 }, svg); }));
      X.forEach((row, i) => row.forEach((v, j) => { const w = (i >> 1) * 2 + (j >> 1), win = arg[i >> 1][j >> 1], won = m === "max" && win[0] === i && win[1] === j;
        el("rect", { x: ix + j * cs, y: iy + i * cs, width: cs - 3, height: cs - 3, rx: 5, fill: `color-mix(in srgb, ${css(wc[w])} ${won ? 45 : 14}%, ${css("--bg")})`, stroke: won ? css("--fg") : css(wc[w]), "stroke-width": won ? 2.2 : 0.8 }, svg);
        el("text", { x: ix + j * cs + cs / 2 - 1.5, y: iy + i * cs + cs / 2 + 3, "text-anchor": "middle", class: "mono", "font-size": 12.5, "font-weight": won ? 600 : 400 }, svg, v); }));
      out.forEach((row, a) => row.forEach((v, b) => {
        el("rect", { x: ox + b * cs * 1.3, y: oy + a * cs, width: cs * 1.3 - 3, height: cs - 3, rx: 5, fill: `color-mix(in srgb, ${css(wc[a * 2 + b])} 35%, ${css("--bg")})`, stroke: css(wc[a * 2 + b]) }, svg);
        el("text", { x: ox + b * cs * 1.3 + cs * 0.65 - 1.5, y: oy + a * cs + cs / 2 + 3, "text-anchor": "middle", class: "mono", "font-size": 12.5, "font-weight": 600 }, svg, fmt(v, Number.isInteger(v) ? 0 : 2)); }));
      el("text", { x: ox, y: oy + 2 * cs + 14, class: "mut", "font-size": 11 }, svg, m === "max" ? "line = winner (weight 1)" : "4 lines of weight 1/4");
      return out;
    }
    function render() {
      const m = mode(), wv = win(), ex = example(), T = DS.temp, k = wv === "g" ? 18 : +wv;
      const { out, arg } = pool(T, k, m), col = ramp("--sw", 8, 28), W = 520, H = 250, cs = 12, svg = svgIn($("#g4plFig"), W, H), oy = 18;
      const R = out.length, C = out[0].length, ocs = wv === "g" ? 40 : 12, ox = 300;
      el("text", { x: 0, y: 12, class: "mut", "font-size": 11 }, svg, "input 18 × 14");
      fieldAt(svg, T, 0, oy, cs, col);
      const [ha, hb] = hov;
      /* window of the hovered output cell */
      if (wv !== "g") { el("rect", { x: hb * k * cs - 1, y: oy + ha * k * cs - 1, width: Math.min(k, 14 - hb * k) * cs + 1, height: Math.min(k, 18 - ha * k) * cs + 1, fill: "none", stroke: css("--fg"), "stroke-width": 2 }, svg);
        const w = arg[ha][hb]; if (w && m === "max") el("rect", { x: w[1] * cs, y: oy + w[0] * cs, width: cs - 0.6, height: cs - 0.6, fill: "none", stroke: css("--lw"), "stroke-width": 2 }, svg); }
      const ty = oy + (18 * cs - R * ocs) / 2;
      el("text", { x: ox, y: ty - 8, class: "mut", "font-size": 11 }, svg, wv === "g" ? "global → 1 × 1" : `output ${R} × ${C}`);
      el("line", { x1: 14 * cs + 12, y1: oy + 9 * cs, x2: ox - 12, y2: oy + 9 * cs, stroke: css("--muted"), "marker-end": "url(#g4plArr)" }, svg);
      arrowDefs(svg, "g4plArr", css("--muted"));
      el("text", { x: (14 * cs + ox) / 2, y: oy + 9 * cs - 8, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, wv === "g" ? "average all" : `${m} ${k}×${k}`);
      fieldAt(svg, out, ox, ty, ocs, col, { label: wv === "g", digits: 1, onCell: wv === "g" ? null : (a, b) => { if (a !== hov[0] || b !== hov[1]) { hov = [a, b]; render(); } } });
      if (wv !== "g") el("rect", { x: ox + hb * ocs - 1, y: ty + ha * ocs - 1, width: ocs + 1, height: ocs + 1, fill: "none", stroke: css("--fg"), "stroke-width": 2, "pointer-events": "none" }, svg);
      const land = T.flat().filter(v => v != null), nIn = 18 * 14, nOut = R * C;
      $("#g4plRead").innerHTML = `<div><span>Cells</span><b>${nIn} → ${nOut}</b></div><div><span>Weights</span><b class="c-ok">0</b></div>` +
        (wv === "g" ? `<div><span>Global mean</span><b class="c-arch">${fmt(mean(land), 1)} °C</b></div>` : `<div><span>Hovered output</span><b class="c-arch">${out[ha][hb] == null ? "ocean" : fmt(out[ha][hb], 1) + " °C"}</b></div>`);
      const gap = [DS.temp, DS.precip, maskF(DS.elev)].map(F => mean(F.flat().filter(v => v != null)));
      $("#g4plCalc").innerHTML = `example (${m}): [[${ex[0].map(v => fmt(v, Number.isInteger(v) ? 0 : 2)).join(", ")}], [${ex[1].map(v => fmt(v, Number.isInteger(v) ? 0 : 2)).join(", ")}]]${nudged ? `  <span class="g">25 moved, same output</span>` : ""}\n` +
        `global average pooling of 3 maps → one feature vector\n[temperature, precipitation, elevation] = [<span class="k">${fmt(gap[0], 1)} °C, ${fmtN(gap[1])} mm/yr, ${fmtN(gap[2])} m</span>]`;
    }
    render(); return render;
  });

  /* ───────── 15 · upsampling and downsampling ───────── */
  demo("op-resample", () => {
    const R = 18, C = 14, M = DS.mask, P = fillNearest(DS.precip), col = ramp("--cool", 600, 8000);
    const scaleMean = F => { const v = F.flat().filter((x, k) => M[Math.floor(k / C)][k % C]), m = mean(v); return F.map(r => r.map(x => x / m)); };
    const OTHER = [scaleMean(fillNearest(DS.temp)), scaleMean(fillNearest(maskF(DS.elev)))];
    const gf = slider("g4rsF", v => `${v}×`, () => render());
    const gd = chips($("#g4rsDown"), () => render());
    const gL = slider("g4rsDepth", v => v, () => unet());
    let src = "self";
    chips($("#g4rsSrc"), v => { src = v; render(); });
    function down(F, f, m) { const r = Math.ceil(R / f), c = Math.ceil(C / f), o = (f - 1) >> 1;
      return Array.from({ length: r }, (_, a) => Array.from({ length: c }, (_, b) => {
        if (m === "stride") return F[Math.min(R - 1, a * f + o)][Math.min(C - 1, b * f + o)];
        const v = []; for (let i = a * f; i < Math.min(R, a * f + f); i++) for (let j = b * f; j < Math.min(C, b * f + f); j++) v.push(F[i][j]); return mean(v); })); }
    const near = (G, f) => Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => G[Math.floor(i / f)][Math.floor(j / f)]));
    function bil(G, f, RR = R, CC = C) { const r = G.length, c = G[0].length;
      return Array.from({ length: RR }, (_, i) => Array.from({ length: CC }, (_, j) => {
        const y = clamp((i + 0.5) / f - 0.5, 0, r - 1), x = clamp((j + 0.5) / f - 0.5, 0, c - 1), y0 = Math.floor(y), x0 = Math.floor(x), y1 = Math.min(r - 1, y0 + 1), x1 = Math.min(c - 1, x0 + 1), fy = y - y0, fx = x - x0;
        return G[y0][x0] * (1 - fy) * (1 - fx) + G[y0][x1] * (1 - fy) * fx + G[y1][x0] * fy * (1 - fx) + G[y1][x1] * fy * fx; })); }
    /* transposed convolution: each coarse value is spread over a 2f × 2f patch by kernel K (stride f) */
    function terms(G, f, i, j) { const o = f >> 1, r = G.length, c = G[0].length, out = [];
      for (let a = Math.floor((i + o - 2 * f + 1) / f); a <= Math.floor((i + o) / f); a++) for (let b = Math.floor((j + o - 2 * f + 1) / f); b <= Math.floor((j + o) / f); b++) {
        const u = i - a * f + o, v = j - b * f + o; if (u < 0 || u >= 2 * f || v < 0 || v >= 2 * f) continue;
        out.push([u * 2 * f + v, G[clamp(a, 0, r - 1)][clamp(b, 0, c - 1)]]); }
      return out; }
    const tconv = (G, f, K) => Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => terms(G, f, i, j).reduce((s, [k, g]) => s + K[k] * g, 0)));
    const cache = {};
    function fit(fields, f, m) { /* least squares for the 4f² kernel weights, small ridge */
      const id = fields === OTHER ? "o" : "s", ck = id + f + m; if (cache[ck]) return cache[ck];
      const n = 4 * f * f, A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
      fields.forEach(F => { const G = down(F, f, m);
        for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) { if (!M[i][j]) continue; const t = terms(G, f, i, j);
          t.forEach(([k, g]) => { b[k] += g * F[i][j]; t.forEach(([k2, g2]) => { A[k][k2] += g * g2; }); }); } });
      const tr = A.reduce((s, r, i) => s + r[i], 0) / n; A.forEach((r, i) => { r[i] += 1e-3 * tr + 1e-9; });
      return (cache[ck] = solve(A, b)); }
    const rmse = F => { let s = 0, n = 0; for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) if (M[i][j]) { s += (F[i][j] - P[i][j]) ** 2; n++; } return Math.sqrt(s / n); };
    function render() {
      const f = gf(), m = gd(), G = down(P, f, m), K = fit(src === "self" ? [scaleMean(P)] : OTHER, f, m);
      const ups = [["nearest", near(G, f)], ["bilinear", bil(G, f)], ["learned", tconv(G, f, K)]];
      const cs = 7, mw = C * cs, gap = 14, W = 5 * mw + 4 * gap, H = 18 * cs + 50, svg = svgIn($("#g4rsFig"), W, H);
      const coarse = Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => G[Math.floor(i / f)][Math.floor(j / f)]));
      const maps = [["original", P, null], [`shrunk ${G.length} × ${G[0].length}`, coarse, null], ...ups.map(([n, F]) => [n, F, rmse(F)])];
      const best = Math.min(...maps.slice(2).map(x => x[2]));
      maps.forEach(([n, F, e], k) => { const x0 = k * (mw + gap);
        el("text", { x: x0, y: 12, "font-size": 11.5, "font-weight": k > 1 ? 600 : 400, fill: css(k > 1 ? "--fg" : "--muted") }, svg, n);
        if (k === 1) { /* coarse blocks drawn at their true size */
          G.forEach((row, a) => row.forEach((v, b) => { const w = Math.min(f, C - b * f) * cs, h = Math.min(f, R - a * f) * cs;
            if (!M.slice(a * f, a * f + f).some(rr => rr.slice(b * f, b * f + f).some(Boolean))) return;
            el("rect", { x: x0 + b * f * cs, y: 20 + a * f * cs, width: w - 0.6, height: h - 0.6, fill: col(v) }, svg); }));
        } else fieldAt(svg, maskF(F), x0, 20, cs, col);
        if (e != null) el("text", { x: x0, y: 20 + R * cs + 16, class: "mono", "font-size": 11, fill: css(Math.abs(e - best) < 1e-6 && f > 1 ? "--ok" : "--muted") }, svg, `error ${fmtN(e)}`);
      });
      el("text", { x: 2 * (mw + gap), y: H - 4, class: "mut", "font-size": 10.5 }, svg, "error = RMSE against the original, mm/yr (green = lowest)");
      $("#g4rsRead").innerHTML = `<div><span>Cells kept</span><b>${G.length * G[0].length} of ${R * C}</b></div><div><span>Learned kernel</span><b class="c-arch">${2 * f} × ${2 * f} = ${4 * f * f} weights</b></div>`;
      $("#g4rsNote").textContent = src === "self"
        ? "Learned upsampling: a transposed convolution whose 2f × 2f kernel was fitted by least squares on this same field, so it flatters itself. Switch to other fields to see how it does on data it has not seen."
        : "Learned upsampling: the kernel was fitted on the temperature and elevation fields, then applied to precipitation. A kernel only knows the patterns it was trained on.";
    }
    function unet() {
      const L = gL(), W = 440, H = 322, svg = svgIn($("#g4rsUnet"), W, H), cs0 = 4, mw = C * cs0, mh = R * cs0;
      arrowDefs(svg, "g4un", css("--muted"));
      const enc = [P];
      for (let i = 1; i <= L; i++) { const F = enc[i - 1], r = Math.ceil(F.length / 2), c = Math.ceil(F[0].length / 2);
        enc[i] = Array.from({ length: r }, (_, a) => Array.from({ length: c }, (_, b) => { const v = []; for (let y = 2 * a; y < Math.min(F.length, 2 * a + 2); y++) for (let x = 2 * b; x < Math.min(F[0].length, 2 * b + 2); x++) v.push(F[y][x]); return mean(v); })); }
      const dec = []; dec[L] = enc[L];
      for (let i = L - 1; i >= 0; i--) { const up = bil(dec[i + 1], 2, enc[i].length, enc[i][0].length); dec[i] = up.map((r, a) => r.map((v, b) => 0.5 * v + 0.5 * enc[i][a][b])); }
      const pos = (i, side) => i === L ? { x: W / 2 - mw / 2, y: 22 + i * 62 } : { x: side ? W - 4 - mw - i * 64 : 4 + i * 64, y: 22 + i * 62 };
      const drawMap = (F, p) => { const cs = mw / F[0].length;
        F.forEach((row, a) => row.forEach((v, b) => { if (v == null) return;
          el("rect", { x: p.x + b * cs, y: p.y + a * cs, width: cs - 0.3, height: Math.min(cs, mh - a * cs) - 0.3, fill: col(v) }, svg); })); };
      for (let i = 0; i <= L; i++) {
        const pe = pos(i, 0), F = enc[i];
        drawMap(i === 0 ? maskF(F) : F, pe);
        el("rect", { x: pe.x - 2, y: pe.y - 2, width: mw + 4, height: mh + 4, rx: 4, fill: "none", stroke: css("--arch"), "stroke-width": i === L ? 2 : 1 }, svg);
        el("text", { x: pe.x + mw / 2, y: pe.y + mh + 13, "text-anchor": "middle", class: "mono", "font-size": 10 }, svg, `${F.length}×${F[0].length}×${16 << i}`);
        if (i < L) {
          const pd = pos(i, 1); drawMap(i === 0 ? maskF(dec[0]) : dec[i], pd);
          el("rect", { x: pd.x - 2, y: pd.y - 2, width: mw + 4, height: mh + 4, rx: 4, fill: "none", stroke: css("--cool") }, svg);
          el("text", { x: pd.x + mw / 2, y: pd.y + mh + 13, "text-anchor": "middle", class: "mono", "font-size": 10 }, svg, `${dec[i].length}×${dec[i][0].length}`);
          el("line", { x1: pe.x + mw + 4, y1: pe.y + 10, x2: pd.x - 6, y2: pd.y + 10, stroke: css("--sw"), "stroke-dasharray": "5 4", "marker-end": "url(#g4un)" }, svg);
          const ne = pos(i + 1, 0), nd = pos(i + 1, 1);
          el("line", { x1: pe.x + mw + 3, y1: pe.y + mh - 6, x2: ne.x + mw / 2, y2: ne.y - 5, stroke: css("--muted"), "marker-end": "url(#g4un)" }, svg);
          el("line", { x1: nd.x + mw / 2, y1: nd.y - 5, x2: pd.x - 4, y2: pd.y + mh - 6, stroke: css("--muted"), "marker-end": "url(#g4un)" }, svg);
        }
      }
      el("text", { x: 4, y: 12, "font-size": 11.5, fill: css("--arch") }, svg, "encoder: shrink");
      el("text", { x: W - 4, y: 12, "text-anchor": "end", "font-size": 11.5, fill: css("--cool") }, svg, "decoder: grow");
      el("text", { x: W / 2, y: H - 4, "text-anchor": "middle", "font-size": 11, fill: css("--sw") }, svg, "- - skip connections carry the fine detail across");
    }
    const all = () => { render(); unet(); };
    all(); return all;
  });

  /* ───────── 16 · flatten and reshape ───────── */
  demo("op-flatten", () => {
    const shape = chips($("#g4flShape"), v => go(v)), order = chips($("#g4flOrder"), () => go(shape()));
    const W = 600, H = 210, cs = 36, rows = ["--arch", "--cool", "--sw", "--ok"];
    let pos = Array.from({ length: 16 }, (_, k) => target("4x4", "row", k)), from = pos, to = pos, t0 = null, busy = false;
    function target(s, o, k) { /* k = 4r + c is the cell; returns [x, y] of its slot in shape s */
      const r = k >> 2, c = k & 3, p = o === "row" ? k : 4 * c + r, [RR, CC] = s.split("x").map(Number);
      const i = s === "4x4" ? r : Math.floor(p / CC), j = s === "4x4" ? c : p % CC;
      return [(W - CC * cs) / 2 + j * cs, 20 + (4 * cs - RR * cs) / 2 + i * cs];
    }
    function go(s, done) {
      from = pos.map(p => p.slice()); to = Array.from({ length: 16 }, (_, k) => target(s, order(), k)); t0 = performance.now();
      const tick = now => { const T = now - t0; let fin = true;
        pos = from.map((f, k) => { const u = clamp((T - k * 35) / 650, 0, 1); if (u < 1) fin = false; const e = ease(u); return [f[0] + (to[k][0] - f[0]) * e, f[1] + (to[k][1] - f[1]) * e]; });
        draw(); if (!fin) requestAnimationFrame(tick); else if (done) done(); };
      requestAnimationFrame(tick);
    }
    $("#g4flPlay").onclick = () => { if (busy) return; busy = true;
      const b = $$("#g4flShape button.chip"); press(b, b[1]);
      go("1x16", () => setTimeout(() => { press(b, b[0]); go("4x4", () => { busy = false; }); }, 700)); };
    function draw() {
      const svg = svgIn($("#g4flFig"), W, H), s = shape(), o = order(), [RR, CC] = s.split("x").map(Number);
      pos.forEach(([x, y], k) => { const r = k >> 2, c = k & 3;
        el("rect", { x: x + 1.5, y: y + 1.5, width: cs - 3, height: cs - 3, rx: 6, fill: `color-mix(in srgb, ${css(rows[r])} ${80 - c * 15}%, ${css("--card")})`, stroke: css(rows[r]) }, svg);
        el("text", { x: x + cs / 2, y: y + cs / 2 + 4.5, "text-anchor": "middle", class: "mono", "font-size": 13, "font-weight": 600 }, svg, k + 1); });
      el("text", { x: W / 2, y: H - 8, "text-anchor": "middle", class: "mut", "font-size": 12 }, svg, `shape (${RR}, ${CC}) · ${RR * CC} numbers · colour = row of the original 4 × 4 grid`);
      const flat = Array.from({ length: 16 }, (_, p) => { const k = o === "row" ? p : 4 * (p & 3) + (p >> 2); return k + 1; });
      const nest = s === "4x4" ? [0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => 4 * r + c + 1)) : Array.from({ length: RR }, (_, i) => flat.slice(i * CC, i * CC + CC));
      $("#g4flRead").innerHTML = `<div><span>Shape</span><b>${RR} × ${CC}</b></div><div><span>Values changed</span><b class="c-ok">0</b></div><div><span>Weights</span><b class="c-ok">0</b></div>`;
      $("#g4flCalc").innerHTML = `${RR === 1 ? "[" + nest[0].join(", ") + "]" : "[" + nest.map(r => "[" + r.join(", ") + "]").join(",\n ") + "]"}\n<span class="m">${o === "row" ? "row-major: cell (r, c) of the 4 × 4 grid goes to position 4·r + c" : "column-major: cell (r, c) goes to position 4·c + r"}</span>`;
    }
    draw(); return draw;
  });

  /* ───────── 17 · embedding lookup ───────── */
  demo("op-embed", () => {
    const GR = { "Valle de Aburrá": "--cool", "Oriente": "--ok", "Urabá": "--sw", "Norte": "--arch" };
    const NM = [["Medellín", 1, "Valle de Aburrá", [1.3, 0.9, -0.2, 0.4]], ["Bello", 5, "Valle de Aburrá", [1.1, 0.6, -0.1, 0.3], "B"], ["Envigado", 9, "Valle de Aburrá", [1.45, 1.25, -0.3, 0.6], "T"],
      ["Itagüí", 13, "Valle de Aburrá", [0.85, 0.85, 0.0, 0.2], "L"], ["Rionegro", 21, "Oriente", [-0.2, 0.7, 0.5, -0.2]], ["Marinilla", 33, "Oriente", [-0.4, 0.9, 0.6, -0.3]],
      ["La Ceja", 45, "Oriente", [-0.3, 0.5, 0.4, -0.1]], ["Turbo", 101, "Urabá", [-1.3, -0.5, 0.2, 1.1]], ["Apartadó", 104, "Urabá", [-1.1, -0.3, 0.3, 1.0]],
      ["Necoclí", 110, "Urabá", [-1.5, -0.65, 0.1, 1.3], "B"], ["Yarumal", 17, "Norte", [0.2, -1.1, 0.7, 0.0]], ["Santa Rosa de Osos", 88, "Norte", [0.45, -0.9, 0.8, 0.1]],
      ["Belmira", 92, "Norte", [0.0, -1.35, 0.6, -0.1], "B"]];
    const r0 = rng(17), start = NM.map(() => [0, 1, 2, 3].map(() => +(0.9 * gauss(r0)).toFixed(2)));
    const r1 = rng(125), TBL = Array.from({ length: 126 }, () => [0, 1, 2, 3].map(() => +(0.6 * gauss(r1)).toFixed(1)));
    let cur = NM.map(m => m[3].slice()), epoch = 60, timer = null;
    const setRows = () => NM.forEach((m, i) => { TBL[m[1]] = cur[i].map(v => +v.toFixed(2)); });
    const gid = slider("g4emId", v => v, () => { left(); map(); });
    function train() { if (timer) return; const from = cur.map(v => v.slice()), r = rng(99 + epoch); epoch = 0;
      timer = setInterval(() => { epoch++; const t = ease(epoch / 60), noise = 0.25 * (1 - epoch / 60);
        cur = NM.map((m, i) => m[3].map((v, d) => from[i][d] + (v - from[i][d]) * t + noise * gauss(r) * (epoch < 60 ? 1 : 0)));
        setRows(); left(); map(); if (epoch >= 60) { clearInterval(timer); timer = null; } }, 45); }
    $("#g4emTrain").onclick = train;
    $("#g4emReset").onclick = () => { if (timer) { clearInterval(timer); timer = null; } cur = start.map(v => v.slice()); epoch = 0; setRows(); left(); map(); };
    setRows();
    function left() {
      const id = gid(), W = 440, H = 270, svg = svgIn($("#g4emFig"), W, H), rh = 1.7, y0 = 22, yr = k => y0 + (k - 1) * rh;
      const oh = el("g", {}, svg);
      el("text", { x: 10, y: 12, class: "mut", "font-size": 11 }, svg, "one-hot (125)");
      el("text", { x: 140, y: 12, class: "mut", "font-size": 11 }, svg, "table 125 × 4");
      el("text", { x: 300, y: 12, class: "mut", "font-size": 11 }, svg, "output (4)");
      for (let k = 1; k <= 125; k++) {
        el("rect", { x: 30, y: yr(k), width: 16, height: rh, fill: css(k === id ? "--arch" : "--well") }, oh);
        TBL[k].forEach((v, d) => el("rect", { x: 140 + d * 26, y: yr(k), width: 25, height: rh, fill: div(v, 1.5) }, svg));
      }
      el("rect", { x: 29, y: y0 - 1, width: 18, height: 125 * rh + 2, fill: "none", stroke: css("--line") }, svg);
      el("rect", { x: 138, y: yr(id) - 2, width: 4 * 26 + 2, height: rh + 4, fill: "none", stroke: css("--fg"), "stroke-width": 1.5 }, svg);
      el("text", { x: 26, y: yr(id) + 4, "text-anchor": "end", class: "mono", "font-size": 10.5, fill: css("--arch") }, svg, id);
      el("text", { x: 52, y: yr(id) - 6, class: "mono", "font-size": 10.5, fill: css("--arch") }, svg, "1");
      el("text", { x: 52, y: y0 + 125 * rh + 14, class: "mut", "font-size": 10.5 }, svg, "124 zeros: weight 0, no line");
      /* the only non-zero connection: weight 1 */
      el("line", { x1: 47, y1: yr(id) + rh / 2, x2: 137, y2: yr(id) + rh / 2, stroke: css("--arch"), "stroke-width": 3 }, svg);
      const oy = clamp(yr(id) - 14, 20, H - 50);
      el("path", { d: `M ${140 + 4 * 26 + 2} ${yr(id) + rh / 2} C 270 ${yr(id)}, 270 ${oy + 14}, 298 ${oy + 14}`, fill: "none", stroke: css("--arch"), "stroke-width": 3 }, svg);
      TBL[id].forEach((v, d) => { el("rect", { x: 300 + d * 34, y: oy, width: 32, height: 28, rx: 5, fill: div(v, 1.5), stroke: css("--arch") }, svg);
        el("text", { x: 316 + d * 34, y: oy + 18, "text-anchor": "middle", class: "mono", "font-size": 11 }, svg, fmt(v, 1)); });
      const nm = NM.find(m => m[1] === id);
      el("text", { x: 300, y: oy + 44, "font-size": 11.5, fill: css("--arch") }, svg, nm ? nm[0] : `municipality ${id}`);
      /* the one-hot product, computed in full */
      const x = Array.from({ length: 126 }, (_, k) => +(k === id)), prod = [0, 1, 2, 3].map(d => { let s = 0; for (let k = 1; k <= 125; k++) s += x[k] * TBL[k][d]; return s; });
      const diff = Math.max(...prod.map((v, d) => Math.abs(v - TBL[id][d])));
      $("#g4emCalc").innerHTML = `lookup: row ${id} of the table = [<span class="k">${TBL[id].map(v => fmt(v, 1)).join(", ")}</span>]  (4 reads)\n` +
        `one-hot × table, dim 1: ${id > 1 ? `0·${fmt(TBL[id - 1][0], 1)} + ` : ""}<span class="k">1·${fmt(TBL[id][0], 1)}</span>${id < 125 ? ` + 0·${fmt(TBL[id + 1][0], 1)}` : ""} + … = ${fmt(prod[0], 1)}\n` +
        `all 4 dims: [${prod.map(v => fmt(v, 1)).join(", ")}]  (500 multiply-adds)\n<span class="g">max difference = ${fmt(diff, 3)}: the same numbers</span>`;
    }
    function map() {
      const W = 520, H = 300, svg = svgIn($("#g4emMap"), W, H), id = gid();
      const { x, y } = axes(svg, { W, H, m: { l: 34, r: 12, t: 16, b: 26 }, x0: -2.2, x1: 2.2, y0: -2, y1: 2, xt: [-2, -1, 0, 1, 2], yt: [-2, -1, 0, 1, 2], xl: "dimension 1", yl: "dimension 2" });
      NM.forEach(([n, mid, g, , lp], i) => { const v = cur[i], on = mid === id, gg = el("g", { style: "cursor:pointer" }, svg);
        const lx = { L: -9, B: -4, T: -4 }[lp] ?? 9, ly = { B: 17, T: -9 }[lp] ?? 4, la = { L: "end" }[lp] ?? "start";
        el("circle", { cx: x(clamp(v[0], -2.2, 2.2)), cy: y(clamp(v[1], -2, 2)), r: on ? 7.5 : 5.5, fill: css(GR[g]), stroke: css(on ? "--fg" : "--card"), "stroke-width": on ? 2 : 1 }, gg);
        el("text", { x: x(clamp(v[0], -2.2, 2.2)) + lx, y: y(clamp(v[1], -2, 2)) + ly, "text-anchor": la, "font-size": 10.5, "font-weight": on ? 600 : 400 }, gg, `${n} (${mid})`);
        gg.addEventListener("click", () => { const r = $("#g4emId"); r.value = mid; r.dispatchEvent(new Event("input")); }); });
      const dist = (a, b) => Math.hypot(...a.map((v, d) => v - b[d]));
      let wi = [], bt = []; NM.forEach((a, i) => NM.forEach((b, j) => { if (j <= i) return; (a[2] === b[2] ? wi : bt).push(dist(cur[i], cur[j])); }));
      $("#g4emRead").innerHTML = `<div><span>Epoch</span><b>${epoch}</b></div><div><span>Same region</span><b class="c-ok">${fmt(mean(wi), 2)}</b></div><div><span>Different regions</span><b class="c-sw">${fmt(mean(bt), 2)}</b></div>` +
        `<div style="flex-basis:100%"><span>mean distance between vectors (all 4 dims)</span></div><div class="legend" style="flex-direction:row;flex-basis:100%;margin:0">${Object.entries(GR).map(([g, c]) => `<span><i style="background:${css(c)}"></i>${g}</span>`).join("")}</div>`;
    }
    const render = () => { left(); map(); };
    render(); return render;
  });

  /* ───────── 18 · positional encoding ───────── */
  demo("op-pos", () => {
    const D = 16, NP = 40, pe = (p, i) => { const k = i >> 1, w = 1 / 10000 ** (2 * k / D); return i % 2 ? Math.cos(p * w) : Math.sin(p * w); };
    let sel = 1;
    const words = DS.sentence, r = rng(7), EMB = words.map(() => [0, 1, 2, 3].map(() => 0.9 * gauss(r)));
    const pe4 = p => [Math.sin(p), Math.cos(p), Math.sin(p / 100), Math.cos(p / 100)];
    let perm = words.map((_, i) => i);
    const Q = words.indexOf("it");
    function attend(order, usePE) { /* returns weights of "it" over the words (by word id) and its output */
      const X = order.map((w, p) => EMB[w].map((v, d) => v + (usePE ? pe4(p)[d] : 0))), qi = order.indexOf(Q);
      const s = X.map(x => x.reduce((a, v, d) => a + v * X[qi][d], 0) / 2), a = softmax(s);
      const out = [0, 1, 2, 3].map(d => X.reduce((acc, x, k) => acc + a[k] * x[d], 0));
      const byWord = []; order.forEach((w, p) => { byWord[w] = a[p]; });
      return { byWord, out };
    }
    const base = { no: attend(words.map((_, i) => i), false), pe: attend(words.map((_, i) => i), true) };
    $("#g4peShuf").onclick = () => { const rr = rng(Date.now() & 0xffff); do { for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; } } while (perm.every((v, i) => v === i)); att(); };
    $("#g4peRestore").onclick = () => { perm = words.map((_, i) => i); att(); };
    function heat() {
      const cs = 11, ch = 9, W = NP * cs + 34, H = D * ch + 40, svg = svgIn($("#g4peFig"), W, H), x0 = 30, y0 = 6;
      for (let p = 0; p < NP; p++) for (let i = 0; i < D; i++) {
        const rc = el("rect", { x: x0 + p * cs, y: y0 + i * ch, width: cs - 0.6, height: ch - 0.6, fill: div(pe(p, i), 1), style: "cursor:pointer" }, svg);
        rc.addEventListener("click", () => { sel = p; heat(); }); rc.addEventListener("mouseenter", () => { if (sel !== p) { sel = p; heat(); } }); }
      el("rect", { x: x0 + sel * cs - 1, y: y0 - 1, width: cs + 1, height: D * ch + 1, fill: "none", stroke: css("--fg"), "stroke-width": 1.6, "pointer-events": "none" }, svg);
      el("text", { x: x0 - 4, y: y0 + ch - 1, "text-anchor": "end", class: "mut mono", "font-size": 9 }, svg, "0");
      el("text", { x: x0 - 4, y: y0 + D * ch - 1, "text-anchor": "end", class: "mut mono", "font-size": 9 }, svg, D - 1);
      el("text", { x: 0, y: y0 + D * ch / 2 + 3, class: "mut", "font-size": 10 }, svg, "dim");
      [0, 10, 20, 30, 39].forEach(p => el("text", { x: x0 + p * cs + cs / 2, y: y0 + D * ch + 13, "text-anchor": "middle", class: "mut mono", "font-size": 9.5 }, svg, p));
      el("text", { x: W, y: H - 2, "text-anchor": "end", class: "mut", "font-size": 10.5 }, svg, "position →  (top rows: fast waves, bottom rows: slow)");
      const pr = p => `[${fmt(Math.sin(p), 2)}, ${fmt(Math.cos(p), 2)}]`;
      $("#g4peCalc").innerHTML = `position 0 → ${pr(0)}\nposition 1 → ${pr(1)}\nposition 2 → ${pr(2)}\n<span class="k">position ${sel} → ${pr(sel)}</span> <span class="m">(first pair, frequency 1)</span>`;
    }
    function att() {
      const W = 520, H = 330, svg = svgIn($("#g4peAtt"), W, H), n = words.length, bw = 64, gx = (W - n * bw) / 2;
      const rows = [["Without positional encoding", false, 14], ["With positional encoding", true, 172]];
      const res = {};
      rows.forEach(([title, use, y0]) => {
        const { byWord, out } = attend(perm, use); res[use] = out;
        el("text", { x: 0, y: y0, "font-size": 12, "font-weight": 600, fill: css(use ? "--arch" : "--fg") }, svg, title);
        const qx = W / 2, qy = y0 + 110;
        perm.forEach((w, p) => { const x = gx + p * bw + bw / 2, y = y0 + 32;
          el("line", { x1: x, y1: y + 24, x2: qx, y2: qy - 2, stroke: css("--arch"), "stroke-width": 0.5 + 12 * byWord[w], opacity: 0.7 }, svg);
          el("rect", { x: x - bw / 2 + 3, y, width: bw - 6, height: 24, rx: 6, fill: css(w === Q ? "--arch-soft" : "--well"), stroke: css("--line") }, svg);
          el("text", { x, y: y + 16, "text-anchor": "middle", "font-size": 12 }, svg, words[w]);
          el("text", { x, y: y - 5, "text-anchor": "middle", class: "mut mono", "font-size": 9.5 }, svg, fmt(byWord[w], 2)); });
        el("rect", { x: qx - 30, y: qy, width: 60, height: 22, rx: 6, fill: css("--arch-soft"), stroke: css("--arch") }, svg);
        el("text", { x: qx, y: qy + 15, "text-anchor": "middle", "font-size": 12 }, svg, "“it”");
        el("text", { x: qx + 40, y: qy + 15, class: "mono", "font-size": 11 }, svg, `→ [${out.map(v => fmt(v, 2)).join(", ")}]`);
      });
      const dn = Math.hypot(...res[false].map((v, d) => v - base.no.out[d])), dp = Math.hypot(...res[true].map((v, d) => v - base.pe.out[d]));
      const same = perm.every((v, i) => v === i);
      $("#g4peRead").innerHTML = `<div><span>Change in “it” output, no PE</span><b class="${dn < 1e-9 ? "c-lw" : ""}">${fmt(dn, 3)}</b></div><div><span>Change, with PE</span><b class="c-arch">${fmt(dp, 3)}</b></div>` +
        `<div style="flex-basis:100%"><span>${same ? "original order · press Shuffle" : "shuffled: without PE the weights follow the words and the output is identical, so order is lost"}</span></div>`;
    }
    const render = () => { heat(); att(); };
    render(); return render;
  });
})();
