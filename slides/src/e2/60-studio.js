/* ═════════ Earth-2 · section 7: Earth2Studio ═════════ */

/* pipeline builder → Python code */
demo("s-studio", () => {
  const DATA = { GFS: { reg: "global", d: "NOAA GFS analysis, 0.25°, global" }, IFS: { reg: "global", d: "ECMWF IFS HRES initial state, 0.25°" },
    ARCO_ERA5: { reg: "global", d: "ERA5 reanalysis (analysis-ready, cloud-optimised), for past dates" }, HRRR: { reg: "na", d: "NOAA HRRR, 3 km, hourly, CONUS" },
    GOES: { reg: "obs", d: "GOES satellite imagery (North America)" } };
  const PX = { FCN3: { reg: "global", dt: 6, vram: 80, dev: "NVIDIA", ens: true, d: "FourCastNet 3: probabilistic, 0.25°, 72 variables" },
    Atlas: { reg: "global", dt: 6, vram: 80, dev: "NVIDIA", ens: true, d: "Earth-2 Medium Range, 0.25°, 70+ variables" },
    SFNO: { reg: "global", dt: 6, vram: 40, dev: "NVIDIA", d: "Spherical Fourier neural operator, 73 channels" },
    GraphCastOperational: { reg: "global", dt: 6, vram: 40, dev: "Google DeepMind", d: "Graph network on an icosahedral mesh, 0.25°" },
    AIFS: { reg: "global", dt: 6, vram: 40, dev: "ECMWF", d: "ECMWF's AI Forecasting System" },
    Pangu6: { reg: "global", dt: 6, vram: 40, dev: "Huawei", d: "Pangu-Weather, 6-hour model" },
    StormCast: { reg: "na", dt: 1, vram: 40, dev: "NVIDIA", d: "Emulates 3 km HRRR, 1-h steps, central US" },
    StormScopeGOES: { reg: "obs", dt: 1 / 6, vram: 80, dev: "NVIDIA", d: "Earth-2 Nowcasting: GOES imagery on the HRRR grid, 10-min steps" } };
  const DX = { PrecipitationAFNOv2: "total precipitation from the atmospheric state", SolarRadiationAFNO6H: "surface solar radiation, 6-hourly",
    WindgustAFNO: "10 m wind gust", CorrDiffTaiwan: "2 km downscaling over Taiwan (CorrDiff)", TCTrackerWuDuan: "tropical-cyclone tracks" };
  const mk = (host, keys, on) => { $(host).innerHTML = keys.map(k => `<button class="chip" data-v="${k}" aria-pressed="${k === on}">${k}</button>`).join(""); };
  mk("#stData", Object.keys(DATA), "GFS"); mk("#stPx", Object.keys(PX), "FCN3"); mk("#stDx", Object.keys(DX), "PrecipitationAFNOv2");
  let data = "GFS", px = "FCN3", wf = "det", dx = "PrecipitationAFNOv2";
  chips($("#stData"), v => { data = v; render(); }); chips($("#stPx"), v => { px = v; render(); });
  chips($("#stRun"), v => { wf = v; render(); }); chips($("#stDx"), v => { dx = v; render(); });
  const nS = slider("stN", v => v, render);
  const span = (c, t) => `<span class="${c}">${t}</span>`, kw = t => span("k", t), str = t => span("g", `"${t}"`), cm = t => span("m", "# " + t);
  function render() {
    const n = nS(), P = PX[px], D = DATA[data];
    $("#stDxRow").style.display = wf === "dx" ? "" : "none";
    const L = [];
    L.push(`${kw("from")} earth2studio.models.px ${kw("import")} ${px}`);
    L.push(`${kw("from")} earth2studio.data ${kw("import")} ${data}`);
    L.push(`${kw("from")} earth2studio.io ${kw("import")} ZarrBackend`);
    if (wf === "ens") L.push(`${kw("from")} earth2studio.perturbation ${kw("import")} SphericalGaussian`);
    if (wf === "dx") L.push(`${kw("from")} earth2studio.models.dx ${kw("import")} ${dx}`);
    L.push(`${kw("from")} earth2studio.run ${kw("import")} ${{ det: "deterministic", ens: "ensemble", dx: "diagnostic" }[wf]} ${kw("as")} run`, "");
    L.push(`model = ${px}.load_model(${px}.load_default_package())`);
    if (wf === "dx") L.push(`diagnostic = ${dx}.load_model(${dx}.load_default_package())`);
    L.push(`data = ${data}()`);
    L.push(`io = ZarrBackend(${str(`outputs/${px.toLowerCase()}_${wf}.zarr`)})`);
    if (wf === "ens") L.push(`perturbation = SphericalGaussian(noise_amplitude=0.15)  ${cm("noise on the initial state")}`);
    L.push("");
    const t0 = str("2025-01-01T00:00:00");
    if (wf === "det") L.push(`run([${t0}], ${n}, model, data, io)`);
    if (wf === "ens") L.push(`run([${t0}], ${n}, 16, model, data, io, perturbation)  ${cm("16 members")}`);
    if (wf === "dx") L.push(`run([${t0}], ${n}, model, diagnostic, data, io)`);
    $("#stCode").innerHTML = L.join("\n");
    const lead = n * P.dt, leadTxt = lead < 1 ? `${fmtN(lead * 60)} min` : lead < 48 ? `${fmt(lead, 0)} h` : `${fmt(lead / 24, 1)} days`;
    $("#stRead").innerHTML = `<div><span>Lead time</span><b>${leadTxt}</b></div><div><span>Step</span><b>${P.dt < 1 ? "10 min" : P.dt + " h"}</b></div><div><span>GPU memory (rec.)</span><b>${P.vram} GB</b></div>`;
    const W = [];
    if (P.reg === "global" && D.reg !== "global") W.push(`<b style="color:var(--lw)">Mismatch:</b> ${px} is global and needs a global initial state; ${data} is ${D.reg === "na" ? "a regional (CONUS) model analysis" : "satellite imagery"}.`);
    if (P.reg === "na" && data !== "HRRR") W.push(`<b style="color:var(--lw)">Mismatch:</b> StormCast starts from a 3 km HRRR state, so use HRRR; it also takes a coarse global model for its conditioning variables (see its docs).`);
    if (P.reg === "obs" && data !== "GOES") W.push(`<b style="color:var(--lw)">Mismatch:</b> StormScope learns from observations (GOES imagery, and radar for the MRMS variant), not from model analyses.`);
    if (wf === "ens" && !P.ens) W.push(`<b style="color:var(--sw)">Note:</b> ${px} is deterministic: the ensemble comes only from perturbing the initial state, and its spread may be too small.`);
    if (wf === "ens" && P.ens) W.push(`<b style="color:var(--ok)">Good:</b> ${px} is trained to produce ensembles; members differ even from the same start.`);
    if (wf === "dx" && dx === "CorrDiffTaiwan" && P.reg !== "global") W.push(`<b style="color:var(--lw)">Mismatch:</b> CorrDiffTaiwan needs coarse fields over Taiwan; a CONUS model does not cover it.`);
    if (!W.length) W.push(`<b style="color:var(--ok)">Check passed.</b> ${px}: ${P.d}. Data: ${D.d}.`);
    $("#stWarn").innerHTML = W.join(" ");
  }
  render(); return render;
});

/* model table */
demo("st-zoo", () => {
  // name, kind, developer, region, year, vram, description
  const Z = [["FCN", "px", "NVIDIA", "Global", 2022, 40, "FourCastNet (AFNO), 0.25°, 6 h"], ["SFNO", "px", "NVIDIA", "Global", 2023, 40, "Spherical Fourier neural operator"],
    ["FCN3", "px", "NVIDIA", "Global", 2025, 80, "FourCastNet 3, probabilistic ensembles"], ["Atlas / AtlasCRPS", "px", "NVIDIA", "Global", 2026, 80, "Earth-2 Medium Range, 0.25°"],
    ["DLESyM", "px", "NVIDIA / U. Washington", "Global", 2025, 40, "Coupled atmosphere–ocean, S2S to climate"], ["StormCast / StormCastCONUS", "px", "NVIDIA", "N. America", 2024, 40, "HRRR emulator, 1-h steps"],
    ["StormScopeGOES / MRMS", "px", "NVIDIA", "N. America", 2026, 80, "Nowcasting from GOES / radar on the HRRR grid"], ["StormScopeMeteosatEU", "px", "NVIDIA", "Europe", 2026, 80, "Nowcasting from MTG FCI imagery"],
    ["CBottleVideo", "px", "NVIDIA", "Global", 2025, 40, "cBottle video model on HEALPix"], ["GraphCastOperational", "px", "Google DeepMind", "Global", 2022, 40, "GNN on icosahedral multimesh, 0.25°"],
    ["GenCastMini", "px", "Google DeepMind", "Global", 2024, 40, "Diffusion ensemble (mini variant)"], ["AIFS / AIFSENS", "px", "ECMWF", "Global", 2025, 40, "ECMWF AI Forecasting System"],
    ["Aurora", "px", "Microsoft", "Global", 2024, 48, "3-D Swin foundation model, 0.25°"], ["Pangu24 / 6 / 3", "px", "Huawei", "Global", 2023, 40, "3-D Earth-Specific Transformer"],
    ["FuXi", "px", "Fudan University", "Global", 2023, 40, "Cascaded U-Transformers, 6 h"], ["FengWu", "px", "Shanghai AI Lab", "Global", 2023, 40, "Autoregressive, 6 h"],
    ["ACE2ERA5", "px", "Ai2", "Global", 2024, 40, "Climate emulator"], ["CAMulator", "px", "NSF NCAR", "Global", 2025, 24, "Emulator of the CAM6 atmosphere"],
    ["CorrDiffTaiwan", "dx", "NVIDIA", "Asia (Taiwan)", 2023, 40, "25 km → 2 km downscaling"], ["CorrDiffEra5Hrrr", "dx", "NVIDIA", "N. America", 2026, 80, "ERA5 0.25° → 3 km HRRR"],
    ["CorrDiffCosmoEra5", "dx", "NVIDIA", "Europe", 2026, 80, "ERA5 → COSMO-REA"], ["CorrDiffCMIP6", "dx", "NVIDIA", "Global", 2026, 80, "CMIP6 → ERA5 downscaling"],
    ["CBottleInfill / SR / TCGuidance", "dx", "NVIDIA", "Global", 2025, 80, "Channel infilling, super-resolution, cyclone guidance"],
    ["PrecipitationAFNOv2", "dx", "NVIDIA", "Global", 2024, 40, "Precipitation from the state"], ["SolarRadiationAFNO", "dx", "NVIDIA", "Global", 2024, 40, "Surface solar radiation, 1 h / 6 h"],
    ["StormScopeDxNSRDB", "dx", "NVIDIA", "N. America", 2026, 48, "Solar irradiance (GHI) from GOES"], ["TCTrackerWuDuan / Vitart", "dx", "(classic algorithms)", "Global", 2023, 0, "Tropical-cyclone trackers"],
    ["HealDA / HealDAv2", "da", "NVIDIA", "Global", 2026, 40, "Observations → analysis (v2: 104 channels, 0.25°)"], ["StormCastSDA", "da", "NVIDIA", "N. America", 2024, 40, "StormCast with score-based assimilation"],
    ["CorrDiffCosmoEra5SDA", "da", "NVIDIA", "Europe", 2026, 80, "CorrDiff-COSMO with diffusion posterior sampling"]];
  let task = "all", dev = "all";
  chips($("#stTask"), v => { task = v; render(); }); chips($("#stDev"), v => { dev = v; render(); });
  const KIND = { px: ["prognostic", "--accent"], dx: ["diagnostic", "--sw"], da: ["assimilation", "--data"] };
  function render() {
    const rows = Z.filter(z => (task === "all" || z[1] === task) && (dev === "all" || (dev === "NVIDIA" ? z[2].startsWith("NVIDIA") : !z[2].startsWith("NVIDIA"))));
    $("#stTable").innerHTML = `<table class="zt"><thead><tr><th>Class</th><th>Kind</th><th>Developer</th><th>Region</th><th>Year</th><th>GPU mem.</th><th>What it does</th></tr></thead><tbody>${rows.map(z =>
      `<tr><td class="mono">${z[0]}</td><td><span class="tag" style="color:var(${KIND[z[1]][1]})">${KIND[z[1]][0]}</span></td><td>${z[2]}</td><td>${z[3]}</td><td class="mono">${z[4]}</td><td class="mono">${z[5] ? z[5] + " GB" : "–"}</td><td>${z[6]}</td></tr>`).join("")}</tbody></table>
      <p class="note" style="margin:6px 0 0">${rows.length} of ${Z.length} shown.</p>`;
  }
  render(); return render;
});

/* adopters */
demo("st-users", () => {
  const U = { wx: [["Brightband", "Runs Earth-2 Medium Range (Atlas) to issue global forecasts daily; “among the first to run Earth-2 Medium Range operationally”.", ["Atlas"]],
      ["Israel Meteorological Service", "CorrDiff in operation: “a 90% reduction in compute time at 2.5-kilometer resolution” vs classic NWP on a CPU cluster; plans Nowcasting up to 8 times a day.", ["CorrDiff", "StormScope"]],
      ["Taiwan Central Weather Administration", "Named as a forecaster using Earth-2 (CorrDiff was first trained on its WRF data over Taiwan).", ["CorrDiff"]],
      ["The Weather Company", "Evaluating Earth-2 Nowcasting for localised severe-weather applications.", ["StormScope"]],
      ["US National Weather Service", "Evaluating the new models for its operational workflows.", ["Atlas", "StormScope"]]],
    en: [["Southwest Power Pool + Hitachi", "Nowcasting and FourCastNet 3 for intraday and day-ahead wind forecasting.", ["StormScope", "FCN3"]],
      ["TotalEnergies", "Evaluating Nowcasting for short-term risk awareness.", ["StormScope"]],
      ["Eni", "Testing FourCastNet and CorrDiff for semi-operational downscaling and gas demand weeks ahead.", ["FCN3", "CorrDiff"]],
      ["GCL", "Earth-2 models in operation in its photovoltaic prediction system.", ["FCN3"]]],
    fin: [["AXA", "FourCastNet to generate thousands of hypothetical hurricane scenarios.", ["FCN3"]],
      ["S&P Global Energy", "CorrDiff to turn climate data into local insights for risk assessment.", ["CorrDiff"]],
      ["JBA Risk Management · Jua · Metdesk", "Named for flood risk and energy trading (no detail given).", []]] };
  const COL = { Atlas: "--arch", CorrDiff: "--sw", StormScope: "--lw", FCN3: "--data" };
  let sec = "wx";
  chips($("#stSector"), v => { sec = v; render(); });
  function render() {
    $("#stUsers").innerHTML = U[sec].map(([n, d, m]) => `<div class="card cmp"><h4>${n}</h4><p>${d}</p>${m.length ? `<p style="margin-top:4px">${m.map(x => `<span class="tag" style="color:var(${COL[x]})">${x === "FCN3" ? "FourCastNet" : x}</span>`).join(" ")}</p>` : ""}</div>`).join("");
    const cnt = {}; U[sec].forEach(u => u[2].forEach(m => cnt[m] = (cnt[m] || 0) + 1));
    VIZ.bars($("#stUseBars"), Object.keys(COL).map(k => ({ label: k === "FCN3" ? "FourCastNet / FCN3" : k, v: cnt[k] || 0, col: COL[k] })), { digits: 0, max: 4, W: 420, labelW: 140 });
  }
  render(); return render;
});

/* which model for which question */
demo("st-choose", () => {
  const C = [{ q: "A wind-farm operator in Oklahoma wants hourly 3 km wind for tomorrow.", o: ["FourCastNet 3", "StormCast", "cBottle"], r: [1],
      w: "StormCast steps a 3 km HRRR state hour by hour over the US. A 0.25° global model is too coarse for one wind farm; cBottle samples climate, not tomorrow's weather. (SPP + Hitachi combine Nowcasting and FCN3.)" },
    { q: "A ministry needs the probability of a heatwave 10 days ahead, worldwide.", o: ["CorrDiff", "FCN3 or Atlas ensemble", "StormScope"], r: [1],
      w: "Ten days ahead is medium range and needs an ensemble: FCN3 and Atlas are trained to give calibrated ensembles. CorrDiff only adds local detail; StormScope stops at 6 h." },
    { q: "A city has a 25 km forecast and wants 2 km rain and wind detail.", o: ["CorrDiff", "HealDA", "DLESyM"], r: [0],
      w: "Downscaling is CorrDiff's job, but a new region needs training data: the released versions cover Taiwan, CONUS (HRRR), Europe (COSMO) and CMIP6 → ERA5." },
    { q: "An insurer wants 10,000 plausible hurricane seasons.", o: ["Huge ensemble of FourCastNet/SFNO", "cBottle with cyclone guidance", "Either, with care"], r: [2],
      w: "No single answer: AXA uses FourCastNet to generate thousands of scenarios; cBottle can be guided to sample cyclones. Both need checking against observed statistics (section 6)." },
    { q: "IDEAM wants thunderstorm warnings for the next 2 h over Colombia.", o: ["StormScope as released", "StormScope after fine-tuning on local data", "FourCastNet 3"], r: [1],
      w: "StormScope was trained over the US (GOES + MRMS radar) and Europe (MTG). GOES-East sees Colombia, but storms, radar and terrain differ: verify, and fine-tune with local data (PhysicsNeMo) before relying on it." }];
  $("#stCases").innerHTML = C.map((c, n) => `<div class="card cmp"><p style="margin:0 0 6px"><b>${n + 1}. ${c.q}</b></p><div class="chips" style="margin:0">${c.o.map((o, i) => `<button class="chip" type="button" data-c="${n}" data-i="${i}" style="padding:4px 10px;font-size:12.5px">${o}</button>`).join("")}</div><p class="note" data-cf="${n}" style="margin:6px 0 0"></p></div>`).join("");
  $$("#stCases button[data-c]").forEach(b => b.addEventListener("click", () => {
    const c = C[+b.dataset.c], ok = c.r.includes(+b.dataset.i);
    $$(`#stCases button[data-c="${b.dataset.c}"]`).forEach(x => x.setAttribute("aria-pressed", x === b));
    $(`#stCases [data-cf="${b.dataset.c}"]`).innerHTML = `<b style="color:var(${ok ? "--ok" : "--lw"})">${ok ? "Yes." : "Better: " + c.r.map(i => c.o[i]).join(" / ") + "."}</b> ${c.w}`;
  }));
  return () => {};
});

demo("st-summary", () => {
  VIZ.quiz($("#stQuiz"), [{ q: "Why do deterministic AI forecasts look smoother at day 10 than at day 1?", opts: ["The network is too small", "MSE training predicts the mean of possible futures", "ERA5 is smooth"], right: 1,
    why: "When the future is uncertain, the forecast that minimises squared error is the average of the possible outcomes, which has lost the small scales. CRPS and diffusion training fix this by producing samples." }]);
  return () => {};
});
