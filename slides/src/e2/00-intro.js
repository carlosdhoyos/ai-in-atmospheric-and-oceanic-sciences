/* ═════════ Earth-2 · section 1: the platform ═════════ */

/* highlight the current section in the header (data-sec starts with the section number) */
{
  const goBase = go;
  go = function (i) {
    goBase(i);
    const n = (slides[cur].dataset.sec || "").split(" ")[0];
    $$("nav.series .mod").forEach(b => b.classList.toggle("on", b.querySelector("span").textContent === n));
  };
}

/* cover: a rotating toy globe and cards that jump to each section */
demo("cover", slide => {
  const cards = [["s-platform", "1 · The platform", "The pipeline, physics vs emulator, the model map."],
    ["s-global", "2 · Global forecasting", "FourCastNet, SFNO, FourCastNet 3, Atlas: Fourier mixing, the sphere, ensembles, CRPS."],
    ["s-da", "3 · Data assimilation", "Initial conditions, observations, HEALPix, HealDA."],
    ["s-downscale", "4 · Downscaling", "CorrDiff: regression for the mean, diffusion for the detail."],
    ["s-nowcast", "5 · Nowcasting", "StormCast and StormScope: storms in the next 0–6 hours."],
    ["s-climate", "6 · Climate", "DLESyM, cBottle, huge ensembles for rare extremes."],
    ["s-studio", "7 · Earth2Studio", "Build a pipeline in Python; the model zoo; who uses it; limits."]];
  $("#pcCards").innerHTML = cards.map(([id, t, d]) => `<button class="pick" type="button" data-go="${id}" style="padding:7px 12px"><b>${t}</b><span>${d}</span></button>`).join("");
  const NL = 144, NB = 72; let t = 0, G = null, view = [-60, 25], timer = null;
  const field = () => { const g = ATM.grid(NL, NB, t); return (lat, lon) => { const j = clamp(Math.floor((90 - lat) / 180 * NB), 0, NB - 1), i = Math.floor(((lon + 360) % 360) / 360 * NL) % NL; return g[j * NL + i]; }; };
  function render() { G = VIZ.globe($("#pcGlobe"), field(), { size: 300, lon0: view[0], lat0: view[1], color: CM.temp, lo: ATM.RANGE[0], hi: ATM.RANGE[1], onRotate: (a, b) => view = [a, b] }); }
  $("#pcPlay").onclick = () => {
    if (timer) { clearInterval(timer); timer = null; $("#pcPlay").textContent = "▶ Play 5 days"; return; }
    t = 0; $("#pcPlay").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!slide.classList.contains("on") || t >= 120) { clearInterval(timer); timer = null; $("#pcPlay").textContent = "▶ Play 5 days"; return; }
      t += 3; view = G.view(); G.redraw(field()); }, 60);
  };
  render(); return render;
});

/* the pipeline: stages → models */
demo("s-platform", () => {
  const ST = [
    { k: "obs", t: "Observations", s: "satellite, radar, stations", col: "--fg",
      d: "Satellite radiances, radar reflectivity, surface stations, radiosondes and aircraft. Sparse, irregular and noisy.",
      m: [], io: "In: the real atmosphere. Out: millions of scattered measurements per day." },
    { k: "da", t: "Data assimilation", s: "HealDA", col: "--data",
      d: "<b>HealDA</b> (Earth-2 Global Data Assimilation) maps 48 h of satellite and conventional observations straight to a global analysis, with no background forecast. NVIDIA: initial conditions “in seconds on GPUs instead of hours on supercomputers”.",
      m: [["HealDA / HealDAv2", "s-da"]], io: "In: observations. Out: the initial state (v2: 104 channels at 0.25°)." },
    { k: "fc", t: "Global forecast", s: "FCN3 · Atlas · SFNO", col: "--accent",
      d: "Autoregressive neural operators and transformers trained on ERA5 step the whole globe at 0.25°, 6 h at a time. <b>FourCastNet 3</b> and <b>Atlas</b> (Earth-2 Medium Range) give ensembles to 15 days and beyond.",
      m: [["FourCastNet / SFNO", "s-global"], ["FourCastNet 3", "s-global"], ["Atlas", "s-global"]], io: "In: global state at 0.25°. Out: 6-hourly states, 70+ variables, to 15 days (FCN3 to 60 days)." },
    { k: "ds", t: "Downscaling", s: "CorrDiff", col: "--sw",
      d: "<b>CorrDiff</b> turns a 25 km field into a 2 km one: a regression network predicts the mean and a diffusion model generates the fine-scale residual, so each sample has realistic detail.",
      m: [["CorrDiff", "s-downscale"]], io: "In: coarse regional fields (ERA5, GFS, CMIP6). Out: km-scale wind, temperature, radar." },
    { k: "nc", t: "Nowcast / km-scale", s: "StormCast · StormScope", col: "--lw",
      d: "<b>StormCast</b> emulates the 3 km HRRR model hour by hour; <b>StormScope</b> (Earth-2 Nowcasting) learns straight from GOES satellite and radar images, 10 minutes at a time, out to 6 h.",
      m: [["StormCast", "s-nowcast"], ["StormScope", "s-nowcast"]], io: "In: recent satellite/radar frames (+ a global forecast). Out: storms 0–6 h ahead, km-scale." },
    { k: "cl", t: "Climate", s: "DLESyM · cBottle", col: "--ok",
      d: "<b>DLESyM</b> couples an atmosphere and an ocean network for 1,000-year runs; <b>cBottle</b> generates km-scale climate states from sea-surface temperature and time, without stepping.",
      m: [["DLESyM", "s-climate"], ["cBottle", "s-climate"]], io: "In: SST, forcing, time of year. Out: long runs / samples of the climate." },
    { k: "use", t: "Decisions", s: "energy, risk, agencies", col: "--mag",
      d: "Diagnostics (precipitation, solar radiation, wind gust, cyclone tracks) turn states into what users need: wind and solar power, flood and hurricane risk, warnings. <b>Earth2Studio</b> chains it all in Python.",
      m: [["Earth2Studio", "s-studio"]], io: "Users named by NVIDIA include Brightband, Israel Meteorological Service, Taiwan CWA, The Weather Company, AXA, S&P Global, Eni." }];
  let sel = 2;
  function render() {
    const W = 1000, H = 108, n = ST.length, bw = 128, gap = (W - n * bw) / (n - 1), svg = svgIn($("#ppFlow"), W, H);
    arrowDefs(svg, "ppAr", css("--muted"));
    ST.forEach((s, i) => { const x = i * (bw + gap), on = i === sel, g = el("g", { style: "cursor:pointer", tabindex: 0, role: "button" }, svg);
      el("rect", { x: x + 1, y: 14, width: bw - 2, height: 72, rx: 12, fill: on ? css(s.col) : css("--card"), "fill-opacity": on ? .16 : 1, stroke: css(on ? s.col : "--line"), "stroke-width": on ? 2.4 : 1.2 }, g);
      el("text", { x: x + bw / 2, y: 44, "text-anchor": "middle", "font-size": 14, "font-weight": 600, fill: css(s.col === "--fg" ? "--fg" : s.col) }, g, s.t);
      el("text", { x: x + bw / 2, y: 64, "text-anchor": "middle", "font-size": 10, fill: css("--muted") }, g, s.s);
      if (i < n - 1) el("line", { x1: x + bw + 3, x2: x + bw + gap - 4, y1: 50, y2: 50, stroke: css("--muted"), "stroke-width": 1.6, "marker-end": "url(#ppAr)" }, svg);
      g.addEventListener("click", () => { sel = i; render(); }); g.addEventListener("keydown", e => { if (e.key === "Enter") { sel = i; render(); } }); });
    el("text", { x: 2, y: 104, "font-size": 10.5, fill: css("--muted") }, svg, "global ←");
    el("text", { x: W - 2, y: 104, "font-size": 10.5, fill: css("--muted"), "text-anchor": "end" }, svg, "→ regional, local, long-term");
    const s = ST[sel];
    $("#ppCard").innerHTML = `<h4 style="color:var(${s.col})">${s.t}</h4><p>${s.d}</p>`;
    $("#ppIO").innerHTML = `<h4>Inputs and outputs</h4><p>${s.io}</p>` + (s.m.length ? `<div class="chips" style="margin:8px 0 0">${s.m.map(([n, id]) => `<button class="chip" type="button" data-go="${id}">${n} →</button>`).join("")}</div>` : "");
  }
  render(); return render;
});

/* physics steps vs emulator steps */
demo("p-why", () => {
  const sl = slider("ppDays", v => v + (v > 1 ? " days" : " day"), render);
  function render() {
    const d = sl(), dtNwp = 5, nwp = d * 24 * 60 / dtNwp, ai = d * 4, W = 470, H = 230, svg = svgIn($("#ppSteps"), W, H);
    const rows = [["Physics NWP", "--muted", nwp, `${fmtN(nwp)} steps of ${dtNwp} min, each with the full physics`], ["AI emulator", "--accent", ai, `${ai} passes of 6 h through one network`]];
    rows.forEach(([lab, col, n, txt], r) => { const y = 24 + r * 98;
      el("text", { x: 0, y, "font-size": 13, "font-weight": 600, fill: css(col) }, svg, lab);
      const show = Math.min(n, 420), per = (W - 4) / show;
      for (let i = 0; i < show; i++) el("rect", { x: 2 + i * per, y: y + 8, width: Math.max(per - (per > 3 ? 1.5 : 0), .6), height: 34, rx: per > 6 ? 3 : 0, fill: css(col), opacity: r ? .85 : .5 }, svg);
      el("text", { x: 0, y: y + 62, "font-size": 11.5, fill: css("--muted") }, svg, txt + (n > show ? ` (first ${show} drawn)` : "")); });
    $("#ppRead").innerHTML = `<div><span>Physics steps</span><b>${fmtN(nwp)}</b></div><div><span>Network passes</span><b>${ai}</b></div><div><span>Ratio</span><b class="c-ok">${fmtN(nwp / ai)}×</b></div>`;
  }
  render(); return render;
});

/* bubble map: grid spacing vs lead time */
demo("p-map", () => {
  // [name, task, km, lead min (hours), lead max (hours), col, note]
  const M = [["FourCastNet", "fc", 28, 6, 24 * 14, "--accent", "AFNO, 0.25°, 6-h steps, 20 variables (2022)."],
    ["SFNO", "fc", 28, 6, 24 * 365, "--accent", "Spherical Fourier neural operator, 73 channels; stable 1-year rollouts (2023)."],
    ["FourCastNet 3", "fc", 28, 6, 24 * 60, "--data", "Probabilistic, CRPS-trained ensembles, 72 variables; 60-day forecast in < 4 min on one GPU (2025)."],
    ["Atlas", "fc", 28, 6, 24 * 15, "--arch", "Earth-2 Medium Range: latent transformer, 70+ variables, 15 days (2026)."],
    ["HealDA", "da", 110, 0.2, 0.5, "--data", "Earth-2 Global Data Assimilation: observations → analysis (v1 1° HEALPix; v2 0.25°) (2026)."],
    ["CorrDiff", "ds", 2, 0.2, 0.5, "--sw", "Generative downscaling 25 km → 2 km (Taiwan); variants for HRRR, COSMO, CMIP6 (2023–26)."],
    ["StormCast", "nc", 3, 1, 12, "--lw", "Emulates 3 km HRRR with 1-h steps, regression + diffusion (2024)."],
    ["StormScope", "nc", 6, 1 / 6, 6, "--lw", "Earth-2 Nowcasting: from GOES + radar, 10-min steps, 0–6 h (2026)."],
    ["DLESyM", "cl", 110, 24 * 30, 24 * 365 * 1000, "--ok", "Coupled atmosphere–ocean on HEALPix; 1,000-year runs without drift (2024)."],
    ["cBottle", "cl", 5, 24 * 365, 24 * 365 * 30, "--ok", "Generative climate states, 100 km → 5 km on HEALPix, conditioned on SST and time (2025)."]];
  let task = "all", hov = -1;
  chips($("#ppTask"), v => { task = v; render(); });
  const info = i => { const m = M[i]; $("#ppInfo").innerHTML = `<b style="color:var(${m[5]})">${m[0]}</b> · ~${m[2]} km · ${m[6]}`; };
  function render() {
    const W = 520, H = 340, m = { l: 56, r: 14, t: 14, b: 40 }, X = lin(Math.log10(0.1), Math.log10(24 * 365 * 1000), m.l, W - m.r), Y = lin(Math.log10(1), Math.log10(200), H - m.b, m.t), svg = svgIn($("#ppBub"), W, H);
    [[1 / 6, "10 min"], [1, "1 h"], [24, "1 d"], [24 * 15, "15 d"], [24 * 365, "1 yr"], [24 * 365 * 100, "100 yr"]].forEach(([h, l]) => {
      el("line", { x1: X(Math.log10(h)), x2: X(Math.log10(h)), y1: m.t, y2: H - m.b, stroke: css("--line") }, svg);
      el("text", { x: X(Math.log10(h)), y: H - m.b + 15, "text-anchor": "middle", "font-size": 10.5, class: "mono", fill: css("--muted") }, svg, l); });
    [1, 2, 5, 10, 25, 50, 100].forEach(k => { el("line", { x1: m.l, x2: W - m.r, y1: Y(Math.log10(k)), y2: Y(Math.log10(k)), stroke: css("--line") }, svg);
      el("text", { x: m.l - 6, y: Y(Math.log10(k)) + 4, "text-anchor": "end", "font-size": 10.5, class: "mono", fill: css("--muted") }, svg, k + " km"); });
    el("text", { x: W - m.r, y: H - 6, "text-anchor": "end", "font-size": 11, fill: css("--muted") }, svg, "lead time / length of run (log) →");
    el("text", { x: m.l + 4, y: m.t + 10, "font-size": 11, fill: css("--muted") }, svg, "grid spacing (log)");
    M.forEach((d, i) => { const on = task === "all" || d[1] === task, x0 = X(Math.log10(d[3])), x1 = X(Math.log10(d[4])), y = Y(Math.log10(d[2])) + (d[1] === "fc" ? [-30, -10, 10, 30][i] : 0), g = el("g", { style: "cursor:pointer", opacity: on ? 1 : .15 }, svg);
      el("rect", { x: x0, y: y - 8, width: Math.max(x1 - x0, 18), height: 16, rx: 8, fill: css(d[5]), "fill-opacity": i === hov ? .5 : .25, stroke: css(d[5]), "stroke-width": i === hov ? 2.4 : 1.4 }, g);
      const left = x1 > W - 110 || d[1] === "fc", lx = left ? x0 - 6 : Math.max(x1, x0 + 18) + 6;
      el("text", { x: lx, y: y + 4, "font-size": 11.5, "font-weight": 600, "text-anchor": left ? "end" : "start", fill: css(d[5]) }, g, d[0]);
      const pick = () => { hov = i; info(i); $$("#ppBub rect[data-b]").forEach(r => { const on = +r.dataset.b === i; r.setAttribute("fill-opacity", on ? .5 : .25); r.setAttribute("stroke-width", on ? 2.4 : 1.4); }); };
      g.firstChild.dataset.b = i; g.addEventListener("mouseenter", pick); g.addEventListener("click", pick); });
    if (hov >= 0) info(hov); else $("#ppInfo").innerHTML = "Hover or tap a bubble. Bars span the lead times each model is built for; positions are approximate.";
  }
  render(); return render;
});
