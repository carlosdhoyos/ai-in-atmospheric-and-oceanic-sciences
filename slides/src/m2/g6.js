/* ═════════ Group 6 · Modern extras: 25 mixture of experts, 26 state space models, 27 Fourier neural operators ═════════ */
(function () {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MSTART = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const dayName = d => { let m = 11; while (MSTART[m] > d) m--; return (d - MSTART[m] + 1) + " " + MONTHS[m]; };
  const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
  const fmtDeg = v => (Math.round(v) === 0 ? 0 : Math.round(v)) + "°";

  /* small DFT on real input: returns arrays of real and imaginary parts (no normalization) */
  function dft(u) {
    const N = u.length, re = new Array(N).fill(0), im = new Array(N).fill(0);
    for (let k = 0; k < N; k++) for (let n = 0; n < N; n++) { const a = -2 * Math.PI * k * n / N; re[k] += u[n] * Math.cos(a); im[k] += u[n] * Math.sin(a); }
    return { re, im };
  }
  /* inverse DFT, real part only, divided by N */
  function idft(re, im) {
    const N = re.length, out = new Array(N).fill(0);
    for (let n = 0; n < N; n++) { let s = 0; for (let k = 0; k < N; k++) { const a = 2 * Math.PI * k * n / N; s += re[k] * Math.cos(a) - im[k] * Math.sin(a); } out[n] = s / N; }
    return out;
  }
  /* apply complex weights W[k] = [re, im] to modes k = 0..W.length−1 (and their mirror images); all other modes dropped */
  function spectral(u, W) {
    const N = u.length, F = dft(u), re = new Array(N).fill(0), im = new Array(N).fill(0);
    W.forEach(([wr, wi], k) => {
      if (k > N / 2) return;
      re[k] = F.re[k] * wr - F.im[k] * wi; im[k] = F.re[k] * wi + F.im[k] * wr;
      if (k > 0 && k < N / 2) { const j = N - k; re[j] = F.re[j] * wr + F.im[j] * wi; im[j] = -F.re[j] * wi + F.im[j] * wr; }
    });
    return { y: idft(re, im), F, G: { re, im } };
  }
  /* size and angle of mode k as a cosine: amplitude·cos(kx + angle) */
  const modeOf = (F, k, N) => { const s = k === 0 || k === N / 2 ? 1 : 2; return [s * Math.hypot(F.re[k], F.im[k]) / N, Math.atan2(F.im[k], F.re[k])]; };

  /* ───────── 25 · mixture of experts ───────── */
  demo("op-moe", () => {
    const rain = DS.daily.rain, D = rain.length;
    const sea = Array.from({ length: D }, (_, d) => Math.cos(4 * Math.PI * (d - 120) / 365));
    const r7 = rain.map((_, d) => { let s = 0, c = 0; for (let j = Math.max(0, d - 6); j <= d; j++) { s += rain[j]; c++; } return s / c; });
    const m7 = mean(r7), s7 = sd(r7), rz = r7.map(v => (v - m7) / s7);
    const COLS = ["--cool", "--sw", "--data", "--lw", "--arch", "--ok", "--mag", "--rose"];
    const P_EXPERT = 1.0e6;
    let N = 4, K = 1, mix = 0, Wrand = [], sel = 120, anim = null;
    const newRand = () => { const r = rng(Date.now() & 0xffff); Wrand = Array.from({ length: 8 }, () => [1.2 * gauss(r), 1.2 * gauss(r), 1.5 * gauss(r)]); };
    newRand();
    const ws = slider("g6moeWs", v => fmt(v, 1), () => render()), wr = slider("g6moeWr", v => fmt(v, 1), () => render());
    const getN = chips($("#g6moeN"), v => { N = +v; render(); }), getK = chips($("#g6moeK"), v => { K = +v; render(); });
    N = +getN(); K = +getK();
    const setSl = (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event("input")); };
    function animateTo(target) {
      if (anim) cancelAnimationFrame(anim);
      const a0 = { ws: ws(), wr: wr(), mix }, t0 = performance.now(), dur = 1400;
      const stepf = now => { const t = clamp((now - t0) / dur, 0, 1), e = t * (2 - t);
        mix = a0.mix + (target.mix - a0.mix) * e;
        document.getElementById("g6moeWs").value = a0.ws + (target.ws - a0.ws) * e; document.getElementById("g6moeWr").value = a0.wr + (target.wr - a0.wr) * e;
        setSl("g6moeWs", document.getElementById("g6moeWs").value); setSl("g6moeWr", document.getElementById("g6moeWr").value);
        if (t < 1) anim = requestAnimationFrame(stepf); else anim = null; };
      anim = requestAnimationFrame(stepf);
    }
    $("#g6moeUn").onclick = () => { newRand(); animateTo({ ws: 0.2, wr: 0.2, mix: 1 }); };
    $("#g6moeTr").onclick = () => animateTo({ ws: 2.5, wr: 0.6, mix: 0 });
    const phi = k => 2 * Math.PI * k / N + Math.PI / 4;
    function gates(d) {
      const logits = Array.from({ length: N }, (_, k) => ws() * sea[d] * Math.cos(phi(k)) + wr() * rz[d] * Math.sin(phi(k))
        + mix * (Wrand[k][0] * sea[d] + Wrand[k][1] * rz[d] + Wrand[k][2]));
      const p = softmax(logits), order = p.map((v, k) => k).sort((a, b) => p[b] - p[a]), top = order.slice(0, K);
      const s = top.reduce((a, k) => a + p[k], 0), g = p.map((v, k) => top.includes(k) ? v / s : 0);
      return { p, g, top, logits };
    }
    function render() {
      const G = Array.from({ length: D }, (_, d) => gates(d)), col = k => css(COLS[k]);
      /* time series */
      const W = 540, H = 200, svg = svgIn($("#g6moeFig"), W, H), m = { l: 34, r: 8, t: 14, b: 40 };
      const ax = axes(svg, { W, H, m, x0: 0, x1: D, y0: 0, y1: 60, yt: [0, 20, 40, 60], yl: "rain (mm/day)" });
      MSTART.forEach((s, i) => el("text", { x: ax.x(s + 15), y: H - m.b + 28, "text-anchor": "middle", class: "mut", "font-size": 11 }, svg, MONTHS[i][0]));
      const bw = (W - m.l - m.r) / D;
      for (let d = 0; d < D; d++) {
        const k = G[d].top[0], c = col(k);
        el("rect", { x: ax.x(d), y: H - m.b + 3, width: bw + 0.4, height: 9, fill: c }, svg);
        if (rain[d] > 0) el("rect", { x: ax.x(d), y: ax.y(Math.min(60, rain[d])), width: Math.max(1, bw - 0.2), height: ax.y(0) - ax.y(Math.min(60, rain[d])), fill: c, opacity: 0.85 }, svg);
      }
      el("path", { d: path(sea.map((v, d) => [ax.x(d), ax.y(46 + 10 * v)])), fill: "none", stroke: css("--muted"), "stroke-width": 1.2, "stroke-dasharray": "3 3" }, svg);
      el("text", { x: W - m.r, y: ax.y(58), "text-anchor": "end", class: "mut", "font-size": 11 }, svg, "seasonal feature (dashed)");
      el("line", { x1: ax.x(sel + 0.5), x2: ax.x(sel + 0.5), y1: m.t, y2: H - m.b + 12, stroke: css("--fg"), "stroke-width": 1.2 }, svg);
      const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b + 12, fill: "transparent", style: "cursor:crosshair" }, svg);
      const pick = e => { const b = svg.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W; sel = clamp(Math.floor((x - m.l) / bw), 0, D - 1); render(); };
      hit.addEventListener("mousemove", pick); hit.addEventListener("click", pick);
      /* legend: days per expert */
      const cnt = Array(N).fill(0), sSum = Array(N).fill(0); G.forEach((g, d) => { cnt[g.top[0]]++; sSum[g.top[0]] += sea[d]; });
      $("#g6moeLeg").innerHTML = cnt.map((c, k) => `<span><i style="background:${col(k)}"></i>E${k + 1}: ${c} days${c ? (sSum[k] / c > 0.3 ? " · mostly rainy season" : sSum[k] / c < -0.3 ? " · mostly dry season" : "") : ""}</span>`).join("");
      /* router diagram for the selected day */
      const g = G[sel], nW = 540, nH = 150, net = svgIn($("#g6moeNet"), nW, nH);
      const inY = [45, 105], rX = 175, rY = 75, eX = 330, oX = 480;
      const eY = k => N === 1 ? rY : 14 + k * (nH - 28) / (N - 1);
      const feats = [["season", sea[sel]], ["recent rain", rz[sel]]];
      feats.forEach(([n, v], i) => {
        el("line", { x1: 92, y1: inY[i], x2: rX - 22, y2: rY, stroke: css("--line"), "stroke-width": 2 }, net);
        el("rect", { x: 4, y: inY[i] - 15, width: 88, height: 30, rx: 8, fill: css("--data-soft"), stroke: css("--data") }, net);
        el("text", { x: 48, y: inY[i] - 2, "text-anchor": "middle", "font-size": 11, class: "mut" }, net, n);
        el("text", { x: 48, y: inY[i] + 11, "text-anchor": "middle", "font-size": 11.5, class: "mono" }, net, fmt(v, 2));
      });
      for (let k = 0; k < N; k++) {
        const on = g.g[k] > 0, y = eY(k), bh = Math.min(26, (nH - 20) / N - 3);
        el("line", { x1: rX + 22, y1: rY, x2: eX - 30, y2: y, stroke: on ? col(k) : css("--line"), "stroke-width": on ? 1 + 7 * g.g[k] : 1, "stroke-dasharray": on ? "" : "3 3" }, net);
        if (on) el("line", { x1: eX + 30, y1: y, x2: oX - 24, y2: rY, stroke: col(k), "stroke-width": 1 + 7 * g.g[k] }, net);
        el("rect", { x: eX - 30, y: y - bh / 2, width: 60, height: bh, rx: 6, fill: on ? col(k) : css("--well"), stroke: col(k), opacity: on ? 1 : 0.6 }, net);
        el("text", { x: eX, y: y + 4, "text-anchor": "middle", "font-size": bh < 16 ? 9.5 : 11, class: "mono", style: on ? `fill:${css("--bg")}` : "" }, net, `E${k + 1}${on ? " " + fmt(g.g[k], 2) : ""}`);
      }
      el("circle", { cx: rX, cy: rY, r: 22, fill: css("--arch-soft"), stroke: css("--arch"), "stroke-width": 1.5 }, net);
      el("text", { x: rX, y: rY + 4, "text-anchor": "middle", "font-size": 11 }, net, "router");
      el("circle", { cx: oX, cy: rY, r: 22, fill: css("--card"), stroke: css("--fg") }, net);
      el("text", { x: oX, y: rY + 4, "text-anchor": "middle", "font-size": 12 }, net, "y");
      el("text", { x: oX, y: rY + 40, "text-anchor": "middle", "font-size": 11, class: "mut" }, net, "Σ gate · expert");
      el("text", { x: rX, y: nH - 4, "text-anchor": "middle", "font-size": 11, class: "mut" }, net, "line width = gate");
      const tot = N * P_EXPERT + 3 * N, act = K * P_EXPERT + 3 * N;
      $("#g6moeRead").innerHTML = `<div><span>Day (click series)</span><b class="c-data">${dayName(sel)}</b></div>
        <div><span>Experts used</span><b>${g.top.map(k => "E" + (k + 1)).join(" + ")}</b></div>
        <div><span>Total parameters</span><b class="c-arch">${fmt(tot / 1e6, 1)} M</b></div>
        <div><span>Active per prediction</span><b class="c-ok">${fmt(act / 1e6, 1)} M (${Math.round(100 * act / tot)}%)</b></div>`;
    }
    render();
    return render;
  });

  /* ───────── 26 · state space models ───────── */
  demo("op-ssm", () => {
    const L = 60, T0 = 3, rainIn = DS.daily.rain.slice(90, 90 + L).map(v => v / 10);
    let mode = "real", inp = "imp";
    const A = slider("g6ssmA", v => fmt(v, 2), () => render()), B = slider("g6ssmB", v => fmt(v, 2), () => render()), C = slider("g6ssmC", v => fmt(v, 2), () => render());
    const R = slider("g6ssmR", v => fmt(v, 2), () => render()), TH = slider("g6ssmTh", v => v + "°", () => render()), SEL = slider("g6ssmSel", v => fmt(v, 1), () => render());
    chips($("#g6ssmMode"), v => { mode = v; if (v === "sel" && inp === "imp") { inp = "rain"; press($$("button.chip", $("#g6ssmIn")), $('#g6ssmIn [data-v="rain"]')); }
      $("#g6ssmRealCtl").hidden = v !== "real"; $("#g6ssmCplxCtl").hidden = v !== "cplx"; $("#g6ssmSelCtl").hidden = v !== "sel"; render(); });
    chips($("#g6ssmIn"), v => { inp = v; render(); });
    const LAM = 0.2, C0 = Math.log(Math.E - 1);
    const softplus = z => Math.log1p(Math.exp(z));
    function run(sel) {
      const x = Array.from({ length: L }, (_, t) => inp === "imp" ? +(t === T0) : inp === "step" ? +(t >= T0) : rainIn[t]);
      const y = [], h1s = [], As = [], Bs = []; let h1 = 0, h2 = 0;
      for (let t = 0; t < L; t++) {
        if (mode === "real") { h1 = A() * h1 + B() * x[t]; As.push(A()); Bs.push(B()); }
        else if (mode === "cplx") { const a = R() * Math.cos(rad(TH())), b = R() * Math.sin(rad(TH())), n1 = a * h1 - b * h2 + B() * x[t], n2 = b * h1 + a * h2; h1 = n1; h2 = n2; As.push(R()); Bs.push(B()); }
        else { const dl = softplus(sel * Math.min(x[t], 3) + C0), At = Math.exp(-LAM * dl), Bt = B() * (1 - At) / LAM; h1 = At * h1 + Bt * x[t]; As.push(At); Bs.push(Bt); }
        h1s.push(h1); y.push(C() * h1);
      }
      return { x, y, h: h1s, As, Bs };
    }
    function render() {
      const r = run(SEL()), base = mode === "sel" ? run(0) : null;
      /* unrolled diagram: 7 steps */
      const W = 540, H = 112, net = svgIn($("#g6ssmNet"), W, H), S = 7, dx = (W - 60) / S, xs = i => 52 + i * dx + dx / 2;
      el("text", { x: 0, y: 18, "font-size": 11, class: "mut" }, net, "y");
      el("text", { x: 0, y: 60, "font-size": 11, class: "mut" }, net, "h");
      el("text", { x: 0, y: 102, "font-size": 11, class: "mut" }, net, "x");
      const wcol = v => css(v >= 0 ? "--pos" : "--neg");
      for (let i = 0; i < S; i++) {
        const t = T0 - 1 + i, cx = xs(i);
        if (i > 0) { const a = r.As[t]; el("line", { x1: xs(i - 1) + 22, y1: 56, x2: cx - 22, y2: 56, stroke: wcol(a), "stroke-width": 0.8 + 3.5 * Math.min(1.2, Math.abs(a)) }, net);
          if (i === 1) el("text", { x: (xs(0) + cx) / 2, y: 40, "text-anchor": "middle", "font-size": 11, class: "mut" }, net, "A"); }
        el("line", { x1: cx, y1: 88, x2: cx, y2: 68, stroke: wcol(r.Bs[t]), "stroke-width": 0.8 + 3 * Math.min(2, Math.abs(r.Bs[t])), opacity: r.x[t] ? 1 : 0.35 }, net);
        el("line", { x1: cx, y1: 44, x2: cx, y2: 28, stroke: wcol(C()), "stroke-width": 0.8 + 2 * Math.abs(C()) }, net);
        el("rect", { x: cx - 22, y: 44, width: 44, height: 24, rx: 6, fill: div(r.h[t], 2), stroke: css("--arch") }, net);
        el("text", { x: cx, y: 60, "text-anchor": "middle", "font-size": 11, class: "mono" }, net, Math.abs(r.h[t]) > 999 ? "big" : fmt(r.h[t], 2));
        el("text", { x: cx, y: 104, "text-anchor": "middle", "font-size": 11, class: "mono" }, net, fmt(r.x[t], inp === "rain" ? 1 : 0));
        el("text", { x: cx, y: 20, "text-anchor": "middle", "font-size": 11, class: "mono" }, net, Math.abs(r.y[t]) > 999 ? "big" : fmt(r.y[t], 2));
      }
      /* response chart */
      const fH = 190, svg = svgIn($("#g6ssmFig"), W, fH), cap = (mode === "real" && Math.abs(A()) > 1) || (mode === "cplx" && R() > 1) ? 8 : 1e9;
      const all = [...r.x, ...r.y, ...(base ? base.y : [])].map(v => Math.min(cap, Math.abs(v))), ym = Math.max(1, ...all) * 1.1;
      const lo = Math.min(0, ...r.y, ...(base ? base.y : [])) < -1e-9 ? -ym : 0;
      const ax = axes(svg, { W, H: fH, m: { l: 34, r: 8, t: 14, b: 26 }, x0: 0, x1: L, y0: lo, y1: ym, xt: [0, 10, 20, 30, 40, 50], yt: lo ? [-ym, 0, ym].map(v => +v.toFixed(1)) : [0, +(ym / 2).toFixed(1), +ym.toFixed(1)], xl: inp === "rain" ? "day (from 1 Apr)" : "step t", yf: v => fmt(v, 1) });
      const bw = (W - 42) / L;
      r.x.forEach((v, t) => v && el("rect", { x: ax.x(t) + 1, y: ax.y(Math.max(0, Math.min(v, ym))), width: bw - 2, height: Math.abs(ax.y(0) - ax.y(Math.min(v, ym))), fill: css("--data"), opacity: 0.35 }, svg));
      const cl = v => ax.y(clamp(v, lo, ym));
      if (base) el("path", { d: path(base.y.map((v, t) => [ax.x(t + 0.5), cl(v)])), fill: "none", stroke: css("--muted"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
      el("path", { d: path(r.y.map((v, t) => [ax.x(t + 0.5), cl(v)])), fill: "none", stroke: css("--arch"), "stroke-width": 2.2 }, svg);
      if (mode === "sel") el("path", { d: path(r.As.map((v, t) => [ax.x(t + 0.5), ax.y(lo) - 2 - 30 * (1 - v)])), fill: "none", stroke: css("--sw"), "stroke-width": 1.3 }, svg);
      const blown = r.y.some(v => Math.abs(v) > ym);
      if (blown) el("text", { x: W - 10, y: 30, "text-anchor": "end", "font-size": 12, style: `fill:${css("--lw")}` }, svg, "off the chart: explodes");
      const lg = [["--data", "input x"], ["--arch", "output y"]].concat(mode === "sel" ? [["--muted", "same, not selective"], ["--sw", "forgetting (1 − Aₜ)"]] : []);
      const LX = [44, 124, 210, 345]; lg.forEach(([c, t], i) => { el("rect", { x: LX[i], y: 2, width: 10, height: 10, rx: 2, fill: css(c) }, svg); el("text", { x: LX[i] + 14, y: 11, "font-size": 11, class: "mut" }, svg, t); });
      /* readouts */
      let beh, mem;
      if (mode === "real") {
        const a = A(), aa = Math.abs(a);
        beh = aa > 1 ? "explodes" : aa === 1 ? "never forgets" : a === 0 ? "no memory" : a < 0 ? "decays, flips sign" : a >= 0.9 ? "long memory" : "decays";
        mem = aa < 1 && aa > 0 ? fmt(Math.log(0.5) / Math.log(aa), 1) + " steps" : aa >= 1 ? "∞" : "0";
      } else if (mode === "cplx") {
        const rr = R(); beh = rr > 1 ? "growing oscillation" : TH() === 0 ? "decays" : "damped oscillation";
        mem = TH() > 0 ? fmt(360 / TH(), 1) + " steps" : "none";
      } else {
        const mn = Math.min(...r.As), mx = Math.max(...r.As); beh = "input decides"; mem = fmt(mn, 2) + "–" + fmt(mx, 2);
      }
      $("#g6ssmRead").innerHTML = `<div><span>Behaviour</span><b class="c-arch" style="font-size:20px">${beh}</b></div>
        <div><span>${mode === "real" ? "Half-life of memory" : mode === "cplx" ? "Period" : "Aₜ range"}</span><b style="font-size:20px">${mem}</b></div>`;
      const t1 = T0, h = r.h, a = fmt(r.As[t1], 2);
      const lines = mode === "cplx"
        ? `<span class="m">two states rotate by ${TH()}° and shrink by ${fmt(R(), 2)} each step: y = C·${fmt(B(), 2)}·${fmt(R(), 2)}ᵗ·cos(${TH()}°·t)</span>`
        : `h<sub>${t1}</sub> = ${a}·${fmt(h[t1 - 1], 2)} + ${fmt(r.Bs[t1], 2)}·${fmt(r.x[t1], 2)} = <span class="k">${fmt(h[t1], 2)}</span>, y<sub>${t1}</sub> = ${fmt(C(), 2)}·${fmt(h[t1], 2)} = <span class="k">${fmt(r.y[t1], 2)}</span>\n` +
          `h<sub>${t1 + 1}</sub> = ${mode === "real" ? a : fmt(r.As[t1 + 1], 2)}·${fmt(h[t1], 2)} + ${fmt(r.Bs[t1 + 1], 2)}·${fmt(r.x[t1 + 1], 2)} = <span class="k">${fmt(h[t1 + 1], 2)}</span>`;
      $("#g6ssmCalc").innerHTML = lines + `\n<span class="m">10 years of daily data, L = 3,650:</span> SSM <span class="g">3,650 updates</span> · attention <span class="r">13,322,500 pairs</span>`;
    }
    render();
    return render;
  });

  /* ───────── 27 · Fourier neural operator, worked example ───────── */
  demo("op-fno", () => {
    const N = 8, u = Array.from({ length: N }, (_, n) => 2 + Math.cos(2 * Math.PI * n / N) + 0.5 * Math.cos(6 * Math.PI * n / N));
    let actF = "relu", selOut = null;
    const K = slider("g6fnoK", v => v === 1 ? "0" : "0–" + (v - 1), () => render()), M = slider("g6fnoM", v => fmt(v, 2), () => render());
    const P = slider("g6fnoP", v => v + "°", () => render()), LW = slider("g6fnoL", v => fmt(v, 2), () => render());
    chips($("#g6fnoAct"), v => { actF = v; render(); });
    $("#g6fnoReset").onclick = () => { [["g6fnoK", 2], ["g6fnoM", 0.8], ["g6fnoP", -45], ["g6fnoL", 0.1]].forEach(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event("input")); }); selOut = null; };
    const act = { none: v => v, relu, gelu };
    const ringXY = (cx, cy, r, n) => { const a = 2 * Math.PI * n / N - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    function compute() {
      const k = K(), w1 = [M() * Math.cos(rad(P())), M() * Math.sin(rad(P()))];
      const W = Array.from({ length: k }, (_, j) => j === 1 ? w1 : [1, 0]);
      const { y, F, G } = spectral(u, W), kept = spectral(u, Array.from({ length: k }, () => [1, 0])).y;
      const z = y.map((v, n) => v + LW() * u[n]), out = z.map(act[actF]);
      /* circulant kernel: out_j = Σ_i ker[(j − i) mod N] · u_i */
      const ker = Array.from({ length: N }, (_, m) => { const e = Array(N).fill(0); e[0] = 1; return spectral(e, W).y[m] + (m === 0 ? LW() : 0); });
      return { y, F, G, kept, z, out, ker, W };
    }
    function render() {
      const c = compute(), Wd = 540, H = 272, svg = svgIn($("#g6fnoFig"), Wd, H);
      const L = [120, 140], Rr = [420, 140], rad0 = 82, lo = 0.5, hi = 3.5;
      const j = selOut == null ? c.out.indexOf(Math.max(...c.out)) : selOut, kmax = Math.max(...c.ker.map(Math.abs));
      /* connection lines from every input point to the selected output point */
      for (let i = 0; i < N; i++) {
        const w = c.ker[((j - i) % N + N) % N], [x1, y1] = ringXY(...L, rad0, i), [x2, y2] = ringXY(...Rr, rad0, j);
        el("line", { x1, y1, x2, y2, stroke: css(w >= 0 ? "--pos" : "--neg"), "stroke-width": 0.3 + 6 * Math.abs(w) / kmax, opacity: 0.55 }, svg);
      }
      [[L, u, "Input u (today)"], [Rr, c.out, "Output (tomorrow)"]].forEach(([[cx, cy], vals, title], side) => {
        el("circle", { cx, cy, r: rad0, fill: "none", stroke: css("--line"), "stroke-width": 1.5 }, svg);
        el("text", { x: cx, y: 12, "text-anchor": "middle", "font-size": 12 }, svg, title);
        el("path", { d: `M ${cx + 34} ${cy - 22} A 40 40 0 0 1 ${cx + 34} ${cy + 22}`, fill: "none", stroke: css("--muted"), "stroke-width": 1, "marker-end": "url(#g6fnoArr)" }, svg);
        el("text", { x: cx, y: cy + 4, "text-anchor": "middle", "font-size": 11, class: "mut" }, svg, "east →");
        const pk = vals.indexOf(Math.max(...vals));
        vals.forEach((v, n) => {
          const [x, y] = ringXY(cx, cy, rad0, n), [lx, ly] = ringXY(cx, cy, rad0 + 28, n), g = el("g", side ? { style: "cursor:pointer" } : {}, svg);
          el("circle", { cx: x, cy: y, r: 18, fill: heat(v, lo, hi), stroke: n === pk ? css("--fg") : (side && n === j ? css("--arch") : css("--line")), "stroke-width": n === pk || (side && n === j) ? 2.2 : 1 }, g);
          el("text", { x, y: y + 3.5, "text-anchor": "middle", "font-size": 10, class: "mono", style: (v - lo) / (hi - lo) > 0.55 ? `fill:${css("--bg")}` : "" }, g, fmt(v, 2));
          el("text", { x: lx, y: ly + 4, "text-anchor": "middle", "font-size": 11, class: "mut mono" }, g, n);
          if (side) { const f = () => { selOut = n; render(); }; g.addEventListener("mouseenter", f); g.addEventListener("click", f); }
        });
      });
      arrowDefs(svg, "g6fnoArr", css("--muted"));
      el("text", { x: Wd / 2, y: H - 4, "text-anchor": "middle", "font-size": 11, class: "mut" }, svg, `lines into output point ${j}: weight of each input point (width = |weight|)`);
      /* spectrum */
      const S = svgIn($("#g6fnoSpec"), Wd, 160), ax = axes(S, { W: Wd, H: 160, m: { l: 34, r: 8, t: 34, b: 24 }, x0: -0.5, x1: 4.5, y0: 0, y1: 2.2, yt: [0, 1, 2], xt: [0, 1, 2, 3, 4], xf: v => "mode " + v, yf: v => fmt(v, 0) });
      const k = K(), bw = 34;
      for (let m = 0; m <= 4; m++) {
        const [ai] = modeOf(c.F, m, N), [ao, po] = modeOf(c.G, m, N), x = ax.x(m), dropped = m >= k;
        el("rect", { x: x - bw - 5, y: ax.y(ai), width: bw, height: ax.y(0) - ax.y(ai), rx: 3, fill: dropped ? "none" : css("--data"), stroke: css("--data"), "stroke-dasharray": dropped ? "3 2" : "", opacity: dropped ? 0.8 : 0.85 }, S);
        el("rect", { x: x + 5, y: ax.y(ao), width: bw, height: ax.y(0) - ax.y(ao), rx: 3, fill: css("--arch") }, S);
        if (ai > 0.01) el("text", { x: x - bw / 2 - 5, y: ax.y(ai) - 4, "text-anchor": "middle", "font-size": 11, class: "mono" }, S, fmt(ai, 2) + (dropped ? " ✕" : ""));
        if (ao > 0.01) { const hasA = m > 0 && Math.abs(deg(po)) > 0.5; el("text", { x: x + bw / 2 + 5, y: ax.y(ao) - (hasA ? 15 : 4), "text-anchor": "middle", "font-size": 11, class: "mono" }, S, fmt(ao, 2));
          if (hasA) el("text", { x: x + bw / 2 + 5, y: ax.y(ao) - 4, "text-anchor": "middle", "font-size": 11, class: "mono", style: `fill:${css("--arch")}` }, S, "∠" + fmtDeg(deg(po))); }
      }
      [["--data", "input spectrum (dashed = dropped)"], ["--arch", "after truncation × weights"]].forEach(([cc, t], i) => {
        el("rect", { x: 40 + i * 230, y: 4, width: 10, height: 10, rx: 2, fill: css(cc) }, S); el("text", { x: 54 + i * 230, y: 13, "font-size": 11, class: "mut" }, S, t); });
      /* step-by-step readout */
      const v8 = a => "[" + a.map(v => fmt(v, 2)).join(", ") + "]";
      const modes = [0, 1, 2, 3, 4].map(m => { const [a, p] = modeOf(c.F, m, N); return a < 1e-9 ? `m${m} 0` : `m${m} ${fmt(a, 2)}`; }).join(" · ");
      const ws = c.W.map((w, m) => `m${m} × ${fmt(Math.hypot(...w), 2)}${m > 0 && Math.abs(Math.atan2(w[1], w[0])) > 1e-6 ? "∠" + fmtDeg(deg(Math.atan2(w[1], w[0]))) : ""}`).join(" · ");
      const p0 = u.indexOf(Math.max(...u)), p1 = c.out.indexOf(Math.max(...c.out));
      $("#g6fnoCalc").innerHTML = `<span class="k">1 FFT</span>      ${modes}
<span class="k">2 keep</span>     modes ${k === 1 ? "0" : "0–" + (k - 1)} → ${v8(c.kept)}
<span class="k">3 weights</span>  ${ws}
<span class="k">4 inverse</span>  ${v8(c.y)}
<span class="k">5 local</span>    + ${fmt(LW(), 2)}·u = ${v8(c.z)}
  <span class="k">${actF === "none" ? "no act." : actF === "relu" ? "ReLU" : "GELU"}</span>    ${v8(c.out)}
<span class="g">peak: point ${p0} → point ${p1}</span>`;
    }
    render();
    return render;
  });

  /* ───────── 27 · Fourier neural operator, training and resolution ───────── */
  demo("op-fno-train", () => {
    const N = 8, KM = 4, SHIFT = rad(45), damp = k => Math.pow(0.8, k * k);
    const trueW = k => [damp(k) * Math.cos(-k * SHIFT), damp(k) * Math.sin(-k * SHIFT)];
    let r = rng(7), num, den, hist, last, timer = null, day = 0, res = 8;
    const noise = slider("g6ftNoise", v => fmt(v, 2) + " °C", () => {});
    function reset() { r = rng(7); num = Array.from({ length: KM }, () => [0, 0]); den = Array(KM).fill(0); hist = []; last = null; day = 0; }
    reset();
    const learned = () => den.map((d, k) => d > 0 ? [num[k][0] / d, num[k][1] / d] : [0, 0]);
    function addPair() {
      const a = [2 + 0.4 * gauss(r), ...[1, 2, 3].map(() => 0.3 + r())], p = [0, ...[1, 2, 3].map(() => 2 * Math.PI * r())];
      const today = [], tom = [];
      for (let n = 0; n < N; n++) {
        const x = 2 * Math.PI * n / N;
        today.push(a[0] + [1, 2, 3].reduce((s, k) => s + a[k] * Math.cos(k * x + p[k]), 0));
        tom.push(a[0] + [1, 2, 3].reduce((s, k) => s + damp(k) * a[k] * Math.cos(k * (x - SHIFT) + p[k]), 0) + noise() * gauss(r));
      }
      const U = dft(today), Y = dft(tom);
      for (let k = 0; k < KM; k++) { num[k][0] += Y.re[k] * U.re[k] + Y.im[k] * U.im[k]; num[k][1] += Y.im[k] * U.re[k] - Y.re[k] * U.im[k]; den[k] += U.re[k] ** 2 + U.im[k] ** 2; }
      const w = learned()[1]; hist.push([Math.hypot(...w), deg(Math.atan2(w[1], w[0])), w]); last = { today, tom };
    }
    const stop = () => { if (timer) clearInterval(timer); timer = null; $("#g6ftPlay").textContent = "Train (animate)"; };
    $("#g6ftStep").onclick = () => { stop(); addPair(); render(); };
    $("#g6ftPlay").onclick = () => {
      if (timer) { stop(); return; }
      $("#g6ftPlay").textContent = "Pause";
      timer = setInterval(() => { if (hist.length >= 60 || !document.getElementById("op-fno-train").classList.contains("on")) { stop(); return; } addPair(); render(); }, 140);
    };
    $("#g6ftReset").onclick = () => { stop(); reset(); render(); };
    chips($("#g6ftRes"), v => { res = +v; day = 0; render(); });
    $("#g6ftDay").onclick = () => { day = (day + 1) % 9; render(); };
    function render() {
      const Wd = 540, H = 300, svg = svgIn($("#g6ftFig"), Wd, H), n = hist.length, Wl = learned();
      /* complex plane for mode 1 */
      const cx = 100, cy = 112, sc = 70;
      el("circle", { cx, cy, r: sc, fill: "none", stroke: css("--line") }, svg);
      el("line", { x1: cx - 92, x2: cx + 92, y1: cy, y2: cy, class: "ax" }, svg); el("line", { x1: cx, x2: cx, y1: cy - 92, y2: cy + 92, class: "ax" }, svg);
      el("text", { x: cx + 90, y: cy - 4, "text-anchor": "end", "font-size": 11, class: "mut" }, svg, "real");
      el("text", { x: cx + 4, y: cy - 84, "font-size": 11, class: "mut" }, svg, "imag");
      el("text", { x: cx, y: 11, "text-anchor": "middle", "font-size": 11.5 }, svg, "mode‑1 weight (complex plane)");
      const tw = trueW(1), P = w => [cx + sc * w[0], cy - sc * w[1]];
      el("line", { x1: cx, y1: cy, x2: P(tw)[0], y2: P(tw)[1], stroke: css("--ok"), "stroke-width": 1.2, "stroke-dasharray": "3 3" }, svg);
      el("circle", { cx: P(tw)[0], cy: P(tw)[1], r: 7, fill: "none", stroke: css("--ok"), "stroke-width": 2 }, svg);
      el("text", { x: P(tw)[0] + 10, y: P(tw)[1] + 14, "font-size": 11, style: `fill:${css("--ok")}` }, svg, "true 0.8∠−45°");
      if (n) {
        el("path", { d: path([[cx, cy], ...hist.map(h => P(h[2]))]), fill: "none", stroke: css("--arch"), "stroke-width": 1, opacity: 0.6 }, svg);
        const cur = P(hist[n - 1][2]); el("circle", { cx: cur[0], cy: cur[1], r: 5, fill: css("--arch") }, svg);
      }
      /* latest pair */
      const py0 = 215, ph = 75, pw = 190, px = x => 10 + x * pw / (N - 1), pyS = v => py0 + ph - (v + 1) / 6 * ph;
      el("text", { x: 10, y: py0 - 6, "font-size": 11, class: "mut" }, svg, n ? `pair ${n}: today → tomorrow` : "no pairs yet");
      el("rect", { x: 8, y: py0, width: pw + 4, height: ph, fill: "none", stroke: css("--line"), rx: 4 }, svg);
      if (last) {
        [[last.today, "--data", ""], [last.tom, "--ok", "4 3"]].forEach(([v, c, da]) => el("path", { d: path(v.map((y, i) => [px(i), pyS(y)])), fill: "none", stroke: css(c), "stroke-width": 2, "stroke-dasharray": da }, svg));
      }
      /* convergence charts */
      const X0 = 240, cw = Wd - X0;
      const mk = (y0, hh, lo, hi, target, idx, lab, yf, yt) => {
        const g = el("g", { transform: `translate(${X0},${y0})` }, svg);
        const a = axes(g, { W: cw, H: hh, m: { l: 40, r: 8, t: 16, b: 22 }, x0: 0, x1: 60, y0: lo, y1: hi, yt, xt: [0, 20, 40], yf, yl: lab, xl: "pairs" });
        el("line", { x1: a.x(0), x2: a.x(60), y1: a.y(target), y2: a.y(target), stroke: css("--ok"), "stroke-dasharray": "4 3", "stroke-width": 1.3 }, g);
        if (n) el("path", { d: path(hist.map((h, i) => [a.x(i + 1), a.y(clamp(h[idx], lo, hi))])), fill: "none", stroke: css("--arch"), "stroke-width": 2 }, g);
      };
      mk(0, 145, 0, 1.2, 0.8, 0, "size", v => fmt(v, 1), [0, 0.4, 0.8, 1.2]);
      mk(150, 145, -90, 0, -45, 1, "angle", v => v + "°", [-90, -45, 0]);
      const w1 = n ? hist[n - 1] : null;
      const others = [0, 2, 3].map(k => { const w = Wl[k], t = trueW(k); return `m${k} ${n ? fmt(Math.hypot(...w), 2) + "∠" + fmtDeg(deg(Math.atan2(w[1], w[0]))) : "–"} (true ${fmt(Math.hypot(...t), 2)}∠${fmtDeg(deg(Math.atan2(t[1], t[0])))})`; }).join(" · ");
      $("#g6ftRead").innerHTML = `<div><span>Pairs</span><b class="c-data">${n}</b></div>
        <div><span>Mode‑1 size</span><b class="c-arch">${w1 ? fmt(w1[0], 3) : "–"}</b></div>
        <div><span>Mode‑1 angle</span><b class="c-arch">${w1 ? fmt(w1[1], 1) + "°" : "–"}</b></div>
        <div style="flex-basis:100%"><span>Other modes</span><span class="mono" style="font-size:12.5px;text-transform:none;letter-spacing:0;color:var(--fg)">${others}</span></div>`;
      /* resolution demo: rolling forecast with the learned weights on N = 8, 16 or 64 points */
      const RH = 175, rs = svgIn($("#g6ftResFig"), Wd, RH);
      const ax = axes(rs, { W: Wd, H: RH, m: { l: 34, r: 18, t: 12, b: 26 }, x0: 0, x1: 360, y0: 0, y1: 4, xt: [0, 90, 180, 270, 360], yt: [0, 1, 2, 3, 4], xf: v => v + "°", yf: v => fmt(v, 0) });
      const truthAt = (x, d) => 2 + Math.pow(0.8, d) * Math.cos(x - d * SHIFT) + 0.5 * Math.pow(damp(3), d) * Math.cos(3 * (x - d * SHIFT));
      const xsG = Array.from({ length: res }, (_, i) => 2 * Math.PI * i / res);
      let today = xsG.map(x => 2 + Math.cos(x) + 0.5 * Math.cos(3 * x));
      for (let d = 0; d < day; d++) today = n ? spectral(today, Wl).y : today;
      const fc = n ? spectral(today, Wl).y : null, fine = Array.from({ length: 181 }, (_, i) => i * 2);
      const truthNow = fine.map(xd => [ax.x(xd), ax.y(truthAt(rad(xd), day))]), truthNext = fine.map(xd => [ax.x(xd), ax.y(truthAt(rad(xd), day + 1))]);
      el("path", { d: path(truthNow), fill: "none", stroke: css("--muted"), "stroke-width": 1, opacity: 0.5 }, rs);
      el("path", { d: path(truthNext), fill: "none", stroke: css("--ok"), "stroke-width": 1.6, "stroke-dasharray": "5 4" }, rs);
      const pts = (vals, c, rr) => { const P2 = vals.map((v, i) => [ax.x(360 * i / res), ax.y(v)]).concat([[ax.x(360), ax.y(vals[0])]]);
        el("path", { d: path(P2), fill: "none", stroke: css(c), "stroke-width": 1.8 }, rs);
        if (res <= 16) P2.slice(0, -1).forEach(([x, y]) => el("circle", { cx: x, cy: y, r: rr, fill: css(c) }, rs)); };
      pts(today, "--data", 3.5);
      if (fc) pts(fc, "--arch", 3.5);
      else el("text", { x: Wd / 2, y: 30, "text-anchor": "middle", "font-size": 12, style: `fill:${css("--sw")}` }, rs, "add some pairs first: no weights learned yet");
      el("text", { x: Wd - 10, y: 24, "text-anchor": "end", "font-size": 11, class: "mut" }, rs, `${res} points · day ${day} → ${day + 1}`);
      $("#g6ftLeg").innerHTML = `<span><i style="background:${css("--data")}"></i>today (${res} points)</span><span><i style="background:${css("--arch")}"></i>learned FNO forecast</span><span><i style="background:${css("--ok")}"></i>true tomorrow (dashed)</span>`;
    }
    render();
    return render;
  });
})();
