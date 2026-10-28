/* Module 2 · group g3: recurrence, gated recurrence, self-attention, multi-head attention, causal masking, cross-attention */
(function () {
  const isOn = s => s.classList.contains("on");
  const sup = n => String(n).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]).join("");
  const mix = (tok, pct, base = "--well") => `color-mix(in srgb, ${css(tok)} ${Math.round(clamp(pct, 0, 100))}%, ${css(base)})`;

  /* ───────── 09 simple RNN ───────── */
  demo("op-rnn", slide => {
    const P = { ex: [1, 0, 2], gap: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], big: [1, 3, 5, 0, 2, 5] }, CYC = [0, 1, 2, 3, 5];
    let x = P.ex.slice(), k = 3, timer = null;
    const ga = slider("g3rnA", v => fmt(v, 2), () => render()), gb = slider("g3rnB", v => fmt(v, 1), () => render());
    const stop = () => { clearInterval(timer); timer = null; $("#g3rnPlay").textContent = "Play"; };
    const play = () => {
      if (timer) return stop();
      if (k >= x.length) k = 0;
      $("#g3rnPlay").textContent = "Pause";
      timer = setInterval(() => { if (!isOn(slide) || k >= x.length) return stop(); k++; render(); }, 650);
    };
    chips($("#g3rnSet"), v => { stop(); x = P[v].slice(); k = 0; build(); render(); play(); });
    $("#g3rnStep").onclick = () => { stop(); k = k >= x.length ? 1 : k + 1; render(); };
    $("#g3rnPlay").onclick = play;
    $("#g3rnReset").onclick = () => { stop(); k = 0; render(); };
    function build() {
      $("#g3rnIn").innerHTML = x.map((v, i) => `<button class="cell" type="button" data-i="${i}" aria-label="day ${i + 1}: ${v}" style="cursor:pointer;${v ? "border-color:var(--cool);background:var(--cool-soft)" : ""}">${v}</button>`).join("");
      $$("#g3rnIn button").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i; x[i] = CYC[(CYC.indexOf(x[i]) + 1) % CYC.length]; k = Math.max(k, i + 1); build(); render(); }));
    }
    function render() {
      const a = ga(), b = gb(), n = x.length, h = [], z = [];
      let hp = 0; x.forEach(v => { const zz = a * hp + b * v; z.push(zz); hp = Math.tanh(zz); h.push(hp); });
      const W = 580, H = 250, svg = svgIn($("#g3rnFig"), W, H), L = 40, Rr = 420, cw = (Rr - L) / n, cx = i => L + cw * (i + 0.5), bw = Math.min(30, cw * 0.6);
      const mx = Math.max(3, ...x), yx = 84, yh = 214;
      arrowDefs(svg, "g3rnAr", css("--arch"));
      el("text", { x: 4, y: yx - 20, class: "mut", "font-size": 11 }, svg, "input x");
      el("text", { x: 4, y: yh - 40, class: "mut", "font-size": 11 }, svg, "memory h");
      el("line", { x1: L, x2: Rr, y1: yx, y2: yx, class: "ax" }, svg); el("line", { x1: L, x2: Rr, y1: yh, y2: yh, class: "ax" }, svg);
      for (let i = 0; i < n; i++) {
        const shown = i < k, cur = i === k - 1;
        if (cur) el("rect", { x: cx(i) - cw / 2 + 1, y: 4, width: cw - 2, height: H - 8, rx: 8, fill: css("--arch-soft") }, svg);
        const hx = 50 * x[i] / mx;
        el("rect", { x: cx(i) - bw / 2, y: yx - hx, width: bw, height: Math.max(hx, 1), rx: 3, fill: css("--cool"), opacity: .75 }, svg);
        el("text", { x: cx(i), y: yx - hx - 5, "text-anchor": "middle", class: "mono", "font-size": 11 }, svg, x[i]);
        el("text", { x: cx(i), y: H - 2, "text-anchor": "middle", class: "mut mono", "font-size": 10.5 }, svg, "d" + (i + 1));
        if (shown) {
          const hh = 90 * h[i];
          el("line", { x1: cx(i), y1: yx + 3, x2: cx(i), y2: yh - hh - 16, stroke: css("--cool"), "stroke-width": 0.6 + 2.5 * b, opacity: .55 }, svg);
          el("rect", { x: cx(i) - bw / 2, y: yh - hh, width: bw, height: Math.max(hh, 1), rx: 3, fill: css("--arch"), opacity: cur ? 1 : .7 }, svg);
          el("text", { x: cx(i), y: yh - hh - 4, "text-anchor": "middle", class: "mono", "font-size": 11, "font-weight": cur ? 600 : 400 }, svg, fmt(h[i], 2));
          if (i > 0) {
            const x0 = cx(i - 1) + bw / 2 + 1, x1 = cx(i) - bw / 2 - 3, yy = yh - 45 * (h[i - 1] + h[i]) / 2 - 18;
            el("path", { d: `M${x0} ${yh - 90 * h[i - 1] + 8} Q${(x0 + x1) / 2} ${yy - 10} ${x1} ${yh - 90 * h[i] + 8}`, fill: "none", stroke: css("--arch"), "stroke-width": 0.5 + 4 * a, opacity: .6, "marker-end": "url(#g3rnAr)" }, svg);
          }
        } else {
          el("rect", { x: cx(i) - bw / 2, y: yh - 40, width: bw, height: 40, rx: 3, fill: "none", stroke: css("--line"), "stroke-dasharray": "3 3" }, svg);
          el("text", { x: cx(i), y: yh - 16, "text-anchor": "middle", class: "mut", "font-size": 12 }, svg, "?");
        }
      }
      /* tanh curve with the current pre-activations z */
      const gx0 = 448, gx1 = 572, gy0 = 214, gy1 = 70, zx = v => gx0 + (gx1 - gx0) * clamp(v, 0, 8) / 8, zy = v => gy0 + (gy1 - gy0) * v;
      el("text", { x: gx0, y: 46, class: "mut", "font-size": 11 }, svg, "h = tanh(z)");
      el("rect", { x: zx(3), y: gy1 - 6, width: gx1 - zx(3), height: gy0 - gy1 + 6, fill: css("--sw-soft") }, svg);
      el("text", { x: (zx(3) + gx1) / 2, y: gy0 - 6, "text-anchor": "middle", "font-size": 10, fill: css("--sw") }, svg, "saturated");
      el("line", { x1: gx0, x2: gx1, y1: gy0, y2: gy0, class: "ax" }, svg); el("line", { x1: gx0, x2: gx1, y1: zy(1), y2: zy(1), class: "grid" }, svg);
      el("path", { d: path(Array.from({ length: 41 }, (_, j) => [zx(j / 5), zy(Math.tanh(j / 5))])), fill: "none", stroke: css("--fg"), "stroke-width": 1.6 }, svg);
      [0, 3, 8].forEach(v => el("text", { x: zx(v), y: gy0 + 14, "text-anchor": "middle", class: "mut mono", "font-size": 10 }, svg, v));
      el("text", { x: gx0 - 4, y: zy(1) + 4, "text-anchor": "end", class: "mut mono", "font-size": 10 }, svg, "1");
      for (let i = 0; i < k; i++) el("circle", { cx: zx(z[i]), cy: zy(h[i]), r: i === k - 1 ? 5.5 : 3.5, fill: css("--arch"), opacity: i === k - 1 ? 1 : .45 }, svg);
      /* calc lines for the revealed steps */
      let hp2 = 0; const lines = [];
      for (let i = 0; i < k; i++) { lines.push(`day ${i + 1}: tanh(${fmt(a, 2)}×${fmt(hp2, 2)} + ${fmt(b, 1)}×${x[i]}) = tanh(${fmt(z[i], 2)}) = <span class="k">${fmt(h[i], 2)}</span>`); hp2 = h[i]; }
      $("#g3rnCalc").innerHTML = k ? (lines.length > 4 ? `<span class="m">… ${lines.length - 4} earlier days</span>\n` : "") + lines.slice(-4).join("\n") : `<span class="m">h₀ = 0. Press Step or Play.</span>`;
      $("#g3rnRead").innerHTML = `<div><span>Memory h now</span><b class="c-arch">${k ? fmt(h[k - 1], 2) : "0.00"}</b></div><div><span>Day-1 influence after 10 days ≈ a${sup(10)}</span><b class="${a ** 10 < 0.01 ? "c-lw" : ""}">${a ** 10 < 0.0005 && a > 0 ? (a ** 10).toExponential(1) : fmt(a ** 10, 3)}</b></div>`;
    }
    build(); render(); return render;
  });

  /* ───────── 10 LSTM ───────── */
  demo("op-lstm", slide => {
    const Rn = DS.monthly.rain, Q = DS.monthly.streamflow, N = Rn.length;
    const gf = slider("g3lsF", v => fmt(v, 2), () => render()), ga = slider("g3lsA", v => fmt(v, 2), () => render());
    const gm = slider("g3lsM", v => "month " + v, () => render());
    let timer = null;
    const stop = () => { clearInterval(timer); timer = null; $("#g3lsPlay").textContent = "Play"; };
    $("#g3lsPlay").onclick = () => {
      if (timer) return stop();
      const m = $("#g3lsM"); if (+m.value >= N) m.value = 1;
      $("#g3lsPlay").textContent = "Pause";
      timer = setInterval(() => { if (!isOn(slide) || +m.value >= N) return stop(); m.value = +m.value + 1; m.dispatchEvent(new Event("input")); }, 280);
    };
    const fit = (h) => { // least-squares q ≈ α + β h (the dense layer on top of the cell)
      const mh = mean(h), mq = mean(Q); let sxy = 0, sxx = 0; h.forEach((v, i) => { sxy += (v - mh) * (Q[i] - mq); sxx += (v - mh) ** 2; });
      const be = sxx ? sxy / sxx : 0; return h.map(v => mq + be * (v - mh));
    };
    function run(f, a) {
      const S = []; let c = 0, hr = 0;
      Rn.forEach(r => {
        const x = r / 300, i = sigm(6 * (x - 0.45)), g = Math.tanh(0.15 * x), o = sigm(1.5 + x), cp = c;
        c = f * c + i * g; const h = o * Math.tanh(c); hr = Math.tanh(a * hr + x);
        S.push({ x, i, g, o, f, cp, c, h, hr });
      });
      return S;
    }
    function valve(svg, cxp, cyp, v, tok, label) {
      el("circle", { cx: cxp, cy: cyp, r: 20, fill: css("--card"), stroke: css(tok), "stroke-width": 2 }, svg);
      const ang = 2 * Math.PI * Math.min(v, 0.999), ex = cxp + 16 * Math.sin(ang), ey = cyp - 16 * Math.cos(ang);
      el("path", { d: `M${cxp} ${cyp} L${cxp} ${cyp - 16} A16 16 0 ${ang > Math.PI ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`, fill: css(tok), opacity: .75 }, svg);
      el("text", { x: cxp, y: cyp + 36, "text-anchor": "middle", "font-size": 11.5, fill: css(tok) }, svg, `${label} ${fmt(v, 2)}`);
    }
    function render() {
      const f = gf(), a = ga(), m = gm() - 1, S = run(f, a), pl = fit(S.map(s => s.h)), pr = fit(S.map(s => s.hr));
      /* time series */
      const W = 580, H = 190, svg = svgIn($("#g3lsFig"), W, H), ymax = Math.max(...Q, ...pl) * 1.1;
      const { x: X, y: Y } = axes(svg, { W, H, m: { l: 36, r: 10, t: 14, b: 24 }, x0: 0, x1: N - 1, y0: 0, y1: ymax, xt: [0, 12, 24, 36, 48, 59], xf: v => v + 1, yt: [0, 20, 40, 60, 80].filter(v => v < ymax), xl: "month", yl: "streamflow (m³/s)" });
      el("rect", { x: X(23.5), y: 14, width: X(35.5) - X(23.5), height: H - 38, fill: css("--sw-soft") }, svg);
      el("text", { x: X(29.5), y: 28, "text-anchor": "middle", "font-size": 10.5, fill: css("--sw") }, svg, "dry El Niño year");
      const rmax = Math.max(...Rn), bw = (X(1) - X(0)) * 0.7;
      Rn.forEach((r, t) => el("rect", { x: X(t) - bw / 2, y: Y(0) - 50 * r / rmax, width: bw, height: 50 * r / rmax, fill: css("--cool"), opacity: .3 }, svg));
      el("path", { d: path(Q.map((v, t) => [X(t), Y(v)])), fill: "none", stroke: css("--data"), "stroke-width": 2.4 }, svg);
      el("path", { d: path(pr.map((v, t) => [X(t), Y(clamp(v, 0, ymax))])), fill: "none", stroke: css("--lw"), "stroke-width": 1.6, "stroke-dasharray": "5 3" }, svg);
      el("path", { d: path(pl.map((v, t) => [X(t), Y(v)])), fill: "none", stroke: css("--arch"), "stroke-width": 2 }, svg);
      el("line", { x1: X(m), x2: X(m), y1: 14, y2: Y(0), stroke: css("--fg"), "stroke-width": 1, "stroke-dasharray": "2 2" }, svg);
      el("circle", { cx: X(m), cy: Y(pl[m]), r: 4, fill: css("--arch") }, svg);
      /* valves for month m */
      const s = S[m], V = svgIn($("#g3lsValve"), 580, 170), cy = 38, wmax = 12, wc = v => 1 + wmax * clamp(v / 0.8, 0, 1);
      arrowDefs(V, "g3lsAr", css("--muted"));
      el("text", { x: 4, y: cy - 16, class: "mut", "font-size": 11 }, V, "cell state c (the memory)");
      el("line", { x1: 30, x2: 130, y1: cy, y2: cy, stroke: css("--arch"), "stroke-width": wc(s.cp), "stroke-linecap": "round", opacity: .8 }, V);
      el("line", { x1: 170, x2: 290, y1: cy, y2: cy, stroke: css("--arch"), "stroke-width": wc(s.f * s.cp), "stroke-linecap": "round", opacity: .8 }, V);
      el("line", { x1: 310, x2: 420, y1: cy, y2: cy, stroke: css("--arch"), "stroke-width": wc(s.c), "stroke-linecap": "round", opacity: .8 }, V);
      el("text", { x: 30, y: cy + 24, class: "mono", "font-size": 11 }, V, `c${"ₜ₋₁"} = ${fmt(s.cp, 2)}`);
      valve(V, 150, cy, s.f, "--sw", "forget f");
      el("circle", { cx: 300, cy, r: 11, fill: css("--card"), stroke: css("--fg") }, V); el("text", { x: 300, y: cy + 5, "text-anchor": "middle", "font-size": 15 }, V, "+");
      el("text", { x: 360, y: cy - 12, "text-anchor": "middle", class: "mono", "font-size": 11 }, V, `cₜ = ${fmt(s.c, 2)}`);
      /* input path */
      el("text", { x: 196, y: 150, "text-anchor": "middle", class: "mono", "font-size": 11 }, V, `rain ${fmtN(Rn[m])} mm`);
      el("text", { x: 196, y: 164, "text-anchor": "middle", class: "mut mono", "font-size": 10 }, V, `g = ${fmt(s.g, 3)}`);
      el("path", { d: `M196 136 L196 116 L278 116`, fill: "none", stroke: css("--cool"), "stroke-width": 1 + 20 * s.g, opacity: .6 }, V);
      valve(V, 300, 116, s.i, "--ok", "input i");
      el("line", { x1: 300, x2: 300, y1: 96, y2: cy + 13, stroke: css("--ok"), "stroke-width": 1 + 20 * s.i * s.g, "marker-end": "url(#g3lsAr)" }, V);
      /* output path */
      el("path", { d: `M420 ${cy} L470 ${cy} L470 96`, fill: "none", stroke: css("--arch"), "stroke-width": wc(s.c), opacity: .5 }, V);
      el("text", { x: 476, y: cy + 30, class: "mut", "font-size": 10.5 }, V, "tanh");
      valve(V, 470, 116, s.o, "--cool", "output o");
      el("line", { x1: 490, x2: 540, y1: 116, y2: 116, stroke: css("--cool"), "stroke-width": 1 + 14 * s.h, "marker-end": "url(#g3lsAr)" }, V);
      el("text", { x: 548, y: 112, class: "mono", "font-size": 11 }, V, "h");
      el("text", { x: 548, y: 127, class: "mono", "font-size": 11 }, V, fmt(s.h, 2));
      const nino = t => t >= 24 && t < 40, cL = corr(pl, Q), cR = corr(pr, Q), idx = [...Array(N).keys()].filter(nino);
      const cLn = corr(idx.map(t => pl[t]), idx.map(t => Q[t])), cRn = corr(idx.map(t => pr[t]), idx.map(t => Q[t]));
      $("#g3lsRead").innerHTML = `<div><span>Fit, all months (r)</span><b class="c-arch">${fmt(cL, 2)}</b></div><div><span>Simple RNN (r)</span><b class="c-lw">${fmt(cR, 2)}</b></div>` +
        `<div><span>El Niño year + 4 months</span><b class="c-arch">${fmt(cLn, 2)} <small style="font-size:15px;color:var(--lw)">vs ${fmt(cRn, 2)}</small></b></div>` +
        `<div><span>Memory after 12 months</span><b style="font-size:19px">f${sup(12)} = ${fmt(f ** 12, 2)} · a${sup(12)} = ${a ** 12 < 0.005 ? fmt(a ** 12, 4) : fmt(a ** 12, 2)}</b></div>`;
    }
    render(); return render;
  });

  /* ───────── 11 self-attention ───────── */
  demo("op-self", () => {
    const Wd = DS.sentence, n = Wd.length;
    const S = [[2, 2, 0, -1, 0, -1, -1], [1, 2, 2, 0, 1, 0, 1], [0, 3, 1, 1, 0, 0, 0], [-1, 0, 2, 1, 0, 1, 2],
      [0, 3, 1, -2, -1, -2, 2], [-1, 1, 0, 0, 2, 1, 3], [-1, 2, 0, 1, 2, 2, 1]];
    const EXK = [0, 1, 2, 6], ex = [0, 3, 1, 2], NL = [10, 100, 365, 1000, 10000];
    let q = 4;
    const gm = chips($("#g3saMode"), () => { buildScores(); render(); });
    const gt = slider("g3saT", v => fmt(v, 1), () => render());
    slider("g3saN", i => fmtN(NL[i]), i => cost(i)); cost(+$("#g3saN").value);
    function cost(i) { const v = NL[i]; $("#g3saCost").innerHTML = `<b>${fmtN(v)}</b> ${v === 365 ? "days" : "elements"} → <b>${fmtN(v * v)}</b> scores.`; }
    function keys() { return gm() === "ex" ? { q: 4, k: EXK, s: ex } : { q, k: [...Array(n).keys()], s: S[q] }; }
    function buildScores() {
      const K = keys(), host = $("#g3saScores");
      host.innerHTML = K.k.map((j, m) => `<label class="cell" style="gap:4px;display:flex;padding:2px 6px"><span class="note" style="font-size:12px">${Wd[j]}</span><input type="number" step="0.5" value="${K.s[m]}" data-m="${m}" aria-label="score of ${Wd[K.q]} for ${Wd[j]}" style="width:3.6em;padding:2px 4px"></label>`).join("");
      $$("input", host).forEach(inp => inp.addEventListener("input", () => { const v = parseFloat(inp.value); if (isFinite(v)) { K.s[+inp.dataset.m] = v; render(); } }));
    }
    function render() {
      const T = gt(), K = keys(), w = softmax(K.s, T), W = 580, H = 200, svg = svgIn($("#g3saFig"), W, H), nk = K.k.length;
      const kx = m => W / 2 + (m - (nk - 1) / 2) * Math.min(80, (W - 60) / nk), topIdx = gm() === "ex" ? [4] : [...Array(n).keys()];
      const qx = j => gm() === "ex" ? W / 2 : kx(j);
      $("#g3saHint").textContent = gm() === "ex" ? `Query "it" on top, the 4 keys below · line thickness = weight` : `Click a word on top to make it the query · line thickness = weight`;
      K.k.forEach((j, m) => {
        el("path", { d: `M${qx(K.q)} 40 C${qx(K.q)} 90 ${kx(m)} 80 ${kx(m)} 122`, fill: "none", stroke: css("--arch"), "stroke-width": 0.5 + 14 * w[m], opacity: .2 + .8 * w[m], "stroke-linecap": "round" }, svg);
      });
      topIdx.forEach(j => {
        const g = el("g", { style: "cursor:pointer" }, svg), on = j === K.q;
        el("rect", { x: qx(j) - 32, y: 10, width: 64, height: 28, rx: 14, fill: on ? css("--arch") : css("--card"), stroke: css(on ? "--arch" : "--line") }, g);
        el("text", { x: qx(j), y: 29, "text-anchor": "middle", "font-size": 13, fill: on ? css("--bg") : css("--fg") }, g, Wd[j]);
        g.addEventListener("click", () => { q = j; buildScores(); render(); });
      });
      K.k.forEach((j, m) => {
        el("rect", { x: kx(m) - 32, y: 124, width: 64, height: 26, rx: 13, fill: css("--card"), stroke: css("--line") }, svg);
        el("text", { x: kx(m), y: 142, "text-anchor": "middle", "font-size": 13 }, svg, Wd[j]);
        el("rect", { x: kx(m) - 24, y: 158, width: 48 * w[m], height: 10, rx: 3, fill: css("--arch") }, svg);
        el("rect", { x: kx(m) - 24, y: 158, width: 48, height: 10, rx: 3, fill: "none", stroke: css("--line") }, svg);
        el("text", { x: kx(m), y: 186, "text-anchor": "middle", class: "mono", "font-size": 12, "font-weight": 500 }, svg, fmt(w[m], 2));
      });
      /* full matrix */
      const M = S.map(r => softmax(r, T)), c = 30, Lw = 62, Th = 58, ms = svgIn($("#g3saMap"), Lw + n * c + 4, Th + n * c + 4);
      Wd.forEach((t, j) => el("text", { x: 0, y: 0, transform: `translate(${Lw + j * c + c / 2 + 4},${Th - 6}) rotate(-50)`, "font-size": 11, class: "mut" }, ms, t));
      M.forEach((row, i) => {
        const g = el("g", { style: "cursor:pointer" }, ms), sel = gm() !== "ex" && i === q;
        el("text", { x: Lw - 6, y: Th + i * c + c / 2 + 4, "text-anchor": "end", "font-size": 11.5, "font-weight": sel ? 600 : 400 }, g, Wd[i]);
        row.forEach((v, j) => {
          el("rect", { x: Lw + j * c + 1, y: Th + i * c + 1, width: c - 2, height: c - 2, rx: 3, fill: mix("--arch", 8 + 92 * v), stroke: sel ? css("--fg") : "none", "stroke-width": 1.2 }, g);
          if (c >= 28) el("text", { x: Lw + j * c + c / 2, y: Th + i * c + c / 2 + 4, "text-anchor": "middle", "font-size": 9, class: "mono", fill: v > 0.45 ? css("--bg") : css("--fg") }, g, fmt(v, 2).replace(/^0/, ""));
        });
        g.addEventListener("click", () => { q = i; const b = $$("#g3saMode button")[1]; press($$("#g3saMode button"), b); buildScores(); render(); });
      });
      const top = w.indexOf(Math.max(...w));
      $("#g3saCalc").innerHTML = `query "${Wd[K.q]}"\nscores  [${K.s.map(v => fmt(v, 1)).join(", ")}]\nsoftmax(s ÷ ${fmt(T, 1)})\n= [${w.map(v => fmt(v, 2)).join(", ")}]\n<span class="m">most weight on </span><span class="k">"${Wd[K.k[top]]}"</span>` +
        (T < 0.5 ? `\n<span class="m">low temperature: sharp</span>` : T > 2 ? `\n<span class="m">high temperature: flat</span>` : "");
    }
    buildScores(); render(); return render;
  });

  /* ───────── 11b multi-head attention ───────── */
  demo("op-mha", () => {
    const r = rng(311), N = 731, season = t => 0.5 + 0.5 * Math.cos(4 * Math.PI * (t - 120) / 365);
    const p = [], y = []; let pe = 0, e = 0;
    for (let t = 0; t < N; t++) { pe = 0.85 * pe + 0.5 * gauss(r); p.push(pe); e = 0.6 * e + 0.6 * gauss(r); y.push(Math.max(0, 3 + 6 * season(t) - 1.6 * pe + e)); }
    const names = ["Head 1: recent", "Head 2: last year", "Head 3: similar pressure"], toks = ["--arch", "--data", "--sw"];
    const scoreFns = [
      (T, s) => -(T - s) / 3,
      (T, s) => -((s + 1 - (T + 1 - 365)) ** 2) / (2 * 6 ** 2),
      (T, s) => -((p[s] - p[T]) ** 2) / (2 * 0.2 ** 2) - (T - s) / 2000];
    const weights = (h, T) => softmax(Array.from({ length: T }, (_, s) => scoreFns[h](T, s))); // keys: days 0 … T−1, value: the day after
    const fc = w => w.reduce((acc, v, s) => acc + v * y[s + 1], 0);
    const F = [0, 1, 2].map(h => { const o = {}; for (let T = 380; T < N - 1; T++) o[T] = fc(weights(h, T)); return o; });
    const on = [true, true, true];
    const btns = $$("#g3mhHeads button");
    btns.forEach(b => b.addEventListener("click", () => { const h = +b.dataset.h; if (on[h] && on.filter(Boolean).length === 1) return; on[h] = !on[h]; b.setAttribute("aria-pressed", on[h]); render(); }));
    const gT = slider("g3mhT", v => "day " + (v + 1), () => render());
    function split() {
      const W = 400, H = 52, svg = svgIn($("#g3mhSplit"), W, H), bw = (W - 2) / 8;
      for (let k = 0; k < 8; k++) {
        const act = k < 3 && on[k];
        el("rect", { x: 1 + k * bw, y: 6, width: bw - 3, height: 22, rx: 4, fill: k < 3 ? (act ? css(toks[k]) : css("--well")) : css("--well"), stroke: css("--line"), opacity: act ? .85 : 1 }, svg);
        el("text", { x: 1 + k * bw + bw / 2 - 1.5, y: 21, "text-anchor": "middle", "font-size": 10.5, class: "mono", fill: act ? css("--bg") : css("--fg") }, svg, "64");
        el("text", { x: 1 + k * bw + bw / 2 - 1.5, y: 44, "text-anchor": "middle", "font-size": 10, class: "mut" }, svg, "head " + (k + 1));
      }
    }
    function mini(host, w, T, tok, x0) {
      const W = 160, H = 100, svg = svgIn(host, W, H), X = lin(x0, T, 4, W - 4), mxy = 16, Y = v => H - 18 - (H - 30) * clamp(v / mxy, 0, 1);
      el("path", { d: path(y.slice(x0, T + 1).map((v, i) => [X(x0 + i), Y(v)])), fill: "none", stroke: css("--muted"), "stroke-width": .6, opacity: .4 }, svg);
      const mw = Math.max(...w.slice(x0));
      el("path", { d: `M${X(x0)} ${H - 18} ` + w.slice(x0).map((v, i) => `L${X(x0 + i).toFixed(1)} ${(H - 18 - 56 * v / mw).toFixed(1)}`).join(" ") + ` L${X(T - 1)} ${H - 18}Z`, fill: css(tok), opacity: .5, stroke: css(tok), "stroke-width": 1.6 }, svg);
      el("line", { x1: 4, x2: W - 4, y1: H - 18, y2: H - 18, class: "ax" }, svg);
      return { svg, X, H };
    }
    function render() {
      split();
      const T = gT(), Wh = [0, 1, 2].map(h => weights(h, T)), act = [0, 1, 2].filter(h => on[h]);
      Wh.forEach((w, h) => {
        const host = $("#g3mhFig" + h); const { svg, H } = mini(host, w, T, toks[h], 0);
        host.style.opacity = on[h] ? 1 : .35;
        el("text", { x: 4, y: 12, "font-size": 12, fill: css(toks[h]), "font-weight": 600 }, svg, names[h].replace("similar ", ""));
        el("text", { x: 4, y: H - 4, class: "mut", "font-size": 11 }, svg, "2 yr ago"); el("text", { x: 156, y: H - 4, "text-anchor": "end", class: "mut", "font-size": 11 }, svg, "today");
      });
      /* combined, zoom to last 400 days */
      const x0 = T - 400, comb = Wh[0].map((_, s) => act.reduce((a, h) => a + Wh[h][s], 0) / act.length);
      const W = 580, H = 190, svg = svgIn($("#g3mhFig"), W, H);
      const { x: X, y: Y } = axes(svg, { W, H, m: { l: 34, r: 10, t: 14, b: 22 }, x0, x1: T + 1, y0: 0, y1: 16, xt: [T - 365, T - 180, T], xf: v => v === T ? "today" : v === T - 365 ? "1 yr ago" : "6 mo ago", yt: [0, 8, 16], yl: "mm/day" });
      el("path", { d: path(y.slice(x0, T + 1).map((v, i) => [X(x0 + i), Y(v)])), fill: "none", stroke: css("--muted"), "stroke-width": 1, opacity: .8 }, svg);
      act.forEach(h => {
        const w = Wh[h], mw = Math.max(...w.slice(x0));
        el("path", { d: `M${X(x0)} ${Y(0)} ` + w.slice(x0).map((v, i) => `L${X(x0 + i).toFixed(1)} ${(Y(0) - 70 * v / mw).toFixed(1)}`).join(" ") + ` L${X(T - 1)} ${Y(0)}Z`, fill: css(toks[h]), opacity: .28, stroke: css(toks[h]), "stroke-width": 1.2 }, svg);
      });
      const days = Object.keys(F[0]).map(Number), X1 = t => [1, ...act.map(h => F[h][t])];
      const A = X1(0).map((_, i) => X1(0).map((_, j) => days.reduce((s, t) => s + X1(t)[i] * X1(t)[j], 0))), bv = X1(0).map((_, i) => days.reduce((s, t) => s + X1(t)[i] * y[t + 1], 0));
      const cf = solve(A, bv), mixf = t => X1(t).reduce((s, v, i) => s + v * cf[i], 0);
      const truth = y[T + 1], fcomb = mixf(T);
      el("circle", { cx: X(T + 1), cy: Y(truth), r: 4, fill: css("--fg") }, svg);
      el("circle", { cx: X(T + 1), cy: Y(clamp(fcomb, 0, 16)), r: 5, fill: "none", stroke: css("--accent"), "stroke-width": 2 }, svg);
      const mae = f => mean(days.map(t => Math.abs(f(t) - y[t + 1])));
      const maes = [0, 1, 2].map(h => mae(t => F[h][t])), maeC = mae(mixf);
      $("#g3mhRead").innerHTML = `<div><span>Tomorrow (truth)</span><b style="color:var(--fg)">${fmt(truth, 1)}</b></div><div><span>Active heads' forecast</span><b>${fmt(fcomb, 1)}</b></div>` +
        `<div><span>Mean error: heads 1 · 2 · 3</span><b style="font-size:19px">${maes.map((v, h) => `<span style="color:var(${toks[h]});font:inherit;letter-spacing:0;text-transform:none">${fmt(v, 2)}</span>`).join(" · ")}</b></div>` +
        `<div><span>Mean error, active heads mixed</span><b class="c-ok">${fmt(maeC, 2)}</b></div>`;
      $("#g3mhMix").textContent = `Dense mixing layer (fitted): forecast = ${fmt(cf[0], 2)} + ` + act.map((h, i) => `${fmt(cf[i + 1], 2)} × head ${h + 1}`).join(" + ");
    }
    render(); return render;
  });

  /* ───────── 11c causal masking ───────── */
  demo("op-causal", () => {
    const S = [[3, 1, 2, 0.5, 2], [1, 2.5, 1, 3, 2], [1, 2, 0.5, 3, 4], [0.5, 1, 2, 2.5, 3], [1, 0.5, 1, 2, 3]];
    let sel = 2;
    const gm = chips($("#g3cmMode"), () => render());
    /* synthetic daily rain and an attention forecast of tomorrow: same scoring rule, only the mask differs */
    const r = rng(77), N = 60, y = []; let e = 0;
    for (let t = 0; t < N + 2; t++) { e = 0.55 * e + gauss(r); y.push(Math.max(0, 6 + 3.2 * e)); }
    const forecast = (t, masked) => { // forecast for day t+1 made at day t
      const idx = [...Array(N + 2).keys()].filter(s => !masked || s <= t);
      const w = softmax(idx.map(s => 3 - 1.5 * Math.abs(s - (t + 1)))); return idx.reduce((a, s, k) => a + w[k] * y[s], 0);
    };
    const days = [...Array(N - 2).keys()].map(t => t + 1), FM = days.map(t => forecast(t, true)), FU = days.map(t => forecast(t, false));
    const mae = F => mean(F.map((v, k) => Math.abs(v - y[days[k] + 1])));
    function render() {
      const masked = gm() === "on", c = 52, L = 56, Tp = 28, svg = svgIn($("#g3cmMap"), L + 5 * c + 4, Tp + 5 * c + 4);
      for (let j = 0; j < 5; j++) el("text", { x: L + j * c + c / 2, y: Tp - 8, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, "day " + (j + 1));
      S.forEach((row, i) => {
        const w = masked ? softmax(row.slice(0, i + 1)).concat(Array(4 - i).fill(0)) : softmax(row), g = el("g", { style: "cursor:pointer" }, svg);
        el("text", { x: L - 8, y: Tp + i * c + c / 2 + 4, "text-anchor": "end", "font-size": 11.5, "font-weight": i === sel ? 600 : 400 }, g, "day " + (i + 1));
        row.forEach((s, j) => {
          const dark = masked && j > i;
          el("rect", { x: L + j * c + 1, y: Tp + i * c + 1, width: c - 2, height: c - 2, rx: 5, fill: dark ? `color-mix(in srgb, ${css("--fg")} 78%, ${css("--bg")})` : mix("--arch", 6 + 94 * w[j]), stroke: i === sel ? css("--fg") : "none", "stroke-width": 1.5 }, g);
          el("text", { x: L + j * c + c / 2, y: Tp + i * c + c / 2 + 1, "text-anchor": "middle", class: "mono", "font-size": 12, fill: dark || w[j] > 0.5 ? css("--bg") : css("--fg") }, g, dark ? "0" : fmt(w[j], 2));
          el("text", { x: L + j * c + c / 2, y: Tp + i * c + c / 2 + 15, "text-anchor": "middle", class: "mono", "font-size": 9, fill: dark || w[j] > 0.5 ? css("--bg") : css("--muted") }, g, dark ? "−∞" : "s " + s);
        });
        g.addEventListener("click", () => { sel = i; render(); });
      });
      const row = S[sel], w = masked ? softmax(row.slice(0, sel + 1)) : softmax(row);
      $("#g3cmCalc").innerHTML = `day ${sel + 1} scores [${row.join(", ")}]\n` + (masked
        ? (sel < 4 ? `mask days ${sel + 2}${sel < 3 ? "–5" : ""} → softmax over [${row.slice(0, sel + 1).join(", ")}]\n` : `no future days to mask → softmax over all\n`) + `= [<span class="k">${w.map(v => fmt(v, 2)).join(", ")}</span>${sel < 4 ? `, <span class="m">${Array(4 - sel).fill("0").join(", ")}</span>` : ""}]`
        : `no mask → softmax over all 5\n= [<span class="r">${w.map(v => fmt(v, 2)).join(", ")}</span>]  <span class="r">day ${sel + 1} reads the future</span>`);
      /* forecast chart */
      const W = 580, H = 180, f = masked ? FM : FU, fs = svgIn($("#g3cmFig"), W, H), ym = Math.ceil(Math.max(...y) / 5) * 5;
      const { x: X, y: Y } = axes(fs, { W, H, m: { l: 34, r: 10, t: 14, b: 22 }, x0: 1, x1: N, y0: 0, y1: ym, xt: [1, 20, 40, 59], yt: [0, ym / 2, ym], xl: "day", yl: "mm/day" });
      el("path", { d: path(days.map(t => [X(t + 1), Y(y[t + 1])])), fill: "none", stroke: css("--fg"), "stroke-width": 1.4, opacity: .8 }, fs);
      el("path", { d: path(days.map((t, k) => [X(t + 1), Y(f[k])])), fill: "none", stroke: css(masked ? "--arch" : "--lw"), "stroke-width": 2.2 }, fs);
      const mM = mae(FM), mU = mae(FU), sk = F => 1 - mean(F.map((v, k) => (v - y[days[k] + 1]) ** 2)) / sd(days.map(t => y[t + 1])) ** 2;
      $("#g3cmRead").innerHTML = `<div><span>Mean error, mask on</span><b class="c-arch">${fmt(mM, 2)} mm</b></div><div><span>Mean error, mask off</span><b class="c-lw">${fmt(mU, 2)} mm</b></div>` +
        `<div><span>R², mask ${masked ? "on" : "off"}</span><b class="${masked ? "c-arch" : "c-lw"}">${fmt(sk(masked ? FM : FU), 2)}</b></div>` +
        (masked ? `<p class="note" style="flex-basis:100%;margin:0">Black line: truth. Violet: forecast from today and the past only, an honest score.</p>`
          : `<p class="note" style="flex-basis:100%;margin:0;color:var(--lw)">Suspiciously good: without the mask, the forecast for tomorrow attends to tomorrow itself. It would fail in real use, where tomorrow is unknown.</p>`);
    }
    render(); return render;
  });

  /* ───────── 12 cross-attention ───────── */
  demo("op-cross", () => {
    const M = DS.mask, R = M.length, C = M[0].length, r = rng(33);
    const blobs = Array.from({ length: 7 }, () => [r() * R, r() * C, 0.35 + 0.5 * r(), 1.2 + 2 * r()]);
    const cloud = M.map((row, i) => row.map((_, j) => clamp(0.08 + 0.3 * Math.exp(-((i - 10) ** 2) / 10) + blobs.reduce((a, [bi, bj, A, s]) => a + A * Math.exp(-((i - bi) ** 2 + (j - bj) ** 2) / (2 * s * s)), 0), 0, 1)));
    let st = [6, 4];
    const gst = chips($("#g3caSt"), v => { st = v.split(",").map(Number); render(); });
    const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const gw = slider("g3caW", v => `${DIRS[Math.round(v / 45) % 8]} ${v}°`, () => render()), gb = slider("g3caB", v => fmt(v, 2), () => render());
    function attn() {
      const th = gw() * Math.PI / 180, ux = Math.sin(th), uy = -Math.cos(th), be = gb(), sc = [], cells = [];
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        const dx = j - st[1], dy = i - st[0], d = Math.hypot(dx, dy), cs = d ? (dx * ux + dy * uy) / d : 0;
        sc.push(-d / 2.2 + be * cs); cells.push([i, j, cs]);
      }
      return { w: softmax(sc), cells, ux, uy };
    }
    function coast(svg, cell) {
      const on = (i, j) => i >= 0 && i < R && j >= 0 && j < C && M[i][j];
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) if (M[i][j]) {
        const x0 = 1 + j * cell, y0 = 1 + i * cell, s = { stroke: css("--fg"), "stroke-width": 1.3, opacity: .7 };
        if (!on(i - 1, j)) el("line", { x1: x0, x2: x0 + cell, y1: y0, y2: y0, ...s }, svg);
        if (!on(i + 1, j)) el("line", { x1: x0, x2: x0 + cell, y1: y0 + cell, y2: y0 + cell, ...s }, svg);
        if (!on(i, j - 1)) el("line", { x1: x0, x2: x0, y1: y0, y2: y0 + cell, ...s }, svg);
        if (!on(i, j + 1)) el("line", { x1: x0 + cell, x2: x0 + cell, y1: y0, y2: y0 + cell, ...s }, svg);
      }
    }
    const cell = 18;
    function marker(svg) {
      const cx = 1 + st[1] * cell + cell / 2, cy = 1 + st[0] * cell + cell / 2;
      el("circle", { cx, cy, r: 6.5, fill: css("--lw"), stroke: css("--bg"), "stroke-width": 2 }, svg);
      return [cx, cy];
    }
    function bindDrag(host) {
      let down = false;
      const pick = ev => {
        const s = host.querySelector("svg"); if (!s) return; const b = s.getBoundingClientRect(), k = (C * cell + 2) / b.width;
        const j = clamp(Math.floor(((ev.clientX - b.left) * k - 1) / cell), 0, C - 1), i = clamp(Math.floor(((ev.clientY - b.top) * k - 1) / cell), 0, R - 1);
        if (i !== st[0] || j !== st[1]) { st = [i, j]; press($$("#g3caSt button"), null); render(); }
      };
      host.addEventListener("pointerdown", ev => { down = true; try { host.setPointerCapture(ev.pointerId); } catch (e) {} pick(ev); });
      host.addEventListener("pointermove", ev => { if (down) pick(ev); });
      ["pointerup", "pointercancel"].forEach(t => host.addEventListener(t, () => { down = false; }));
    }
    bindDrag($("#g3caMap1")); bindDrag($("#g3caMap2"));
    function render() {
      const { w, cells, ux, uy } = attn(), mw = Math.max(...w);
      const m1 = fieldSVG($("#g3caMap1"), cloud, { cell, color: v => mix("--cool", 5 + 90 * v) });
      coast(m1, cell); marker(m1);
      const W2 = cells.map(([i, j], k) => w[k]), F2 = M.map((row, i) => row.map((_, j) => W2[i * C + j]));
      const m2 = fieldSVG($("#g3caMap2"), F2, { cell, color: v => mix("--arch", 4 + 96 * Math.sqrt(v / mw)) });
      coast(m2, cell);
      const [sx, sy] = [1 + st[1] * cell + cell / 2, 1 + st[0] * cell + cell / 2];
      const top = w.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]).slice(0, 10);
      top.forEach(([v, k]) => { const [i, j] = cells[k]; el("line", { x1: sx, y1: sy, x2: 1 + j * cell + cell / 2, y2: 1 + i * cell + cell / 2, stroke: css("--fg"), "stroke-width": 0.4 + 5 * v / mw, opacity: .55, "stroke-linecap": "round" }, m2); });
      marker(m2);
      /* wind arrow: blows from the chosen direction toward the opposite side */
      const ax = C * cell - 26, ay = 30;
      arrowDefs(m2, "g3caAr", css("--fg"));
      el("circle", { cx: ax, cy: ay, r: 20, fill: css("--card"), stroke: css("--line") }, m2);
      el("line", { x1: ax + 14 * ux, y1: ay + 14 * uy, x2: ax - 12 * ux, y2: ay - 12 * uy, stroke: css("--fg"), "stroke-width": 2, "marker-end": "url(#g3caAr)" }, m2);
      el("text", { x: ax, y: ay + 34, "text-anchor": "middle", "font-size": 10, class: "mut" }, m2, "wind");
      const avg = w.reduce((a, v, k) => a + v * cloud[cells[k][0]][cells[k][1]], 0), up = w.reduce((a, v, k) => a + (cells[k][2] > 0.2 ? v : 0), 0);
      $("#g3caRead").innerHTML = `<div><span>Attended cloud (weighted avg)</span><b class="c-arch">${fmt(avg, 2)}</b></div><div><span>Cloud at the station</span><b>${fmt(cloud[st[0]][st[1]], 2)}</b></div><div><span>Weight on upwind cells</span><b class="c-sw">${fmtN(100 * up)}%</b></div>`;
      $("#g3caCalc").innerHTML = `score = −distance ÷ 2.2 + ${fmt(gb(), 2)} × cos(angle to upwind)\nweights = softmax over all ${R * C} cells (sum = 1)\nout = Σ w × cloud = <span class="k">${fmt(avg, 2)}</span>  <span class="m">top cell w = ${fmt(top[0][0], 3)}</span>`;
    }
    render(); return render;
  });
})();
