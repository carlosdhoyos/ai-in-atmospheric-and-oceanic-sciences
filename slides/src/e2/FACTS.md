# Earth-2 facts for the deck (checked Nov 2026; cite the source next to every number)

Rule: a number on a slide comes from this file, with its source in the slide's `.note`. Vendor claims are said as
claims ("NVIDIA reports …"), with their baseline. Where sources disagree, say so (see CorrDiff).

## Platform
- NVIDIA Earth-2 page: https://www.nvidia.com/en-us/high-performance-computing/earth-2/ . Earth-2 cloud platform
  announced at GTC, 18 Mar 2024. Earth-2 NIM microservices (CorrDiff, FourCastNet) at SC24 (Nov 2024).
- 26 Jan 2026, AMS Annual Meeting: "Earth-2 family of open models" (blogs.nvidia.com/blog/nvidia-earth-2-open-models),
  billed as the first fully open AI weather stack. Product names → architectures:
  Earth-2 Medium Range = **Atlas**; Earth-2 Nowcasting = **StormScope**; Earth-2 Global Data Assimilation = **HealDA**;
  plus Earth-2 CorrDiff (downscaling) and Earth-2 FourCastNet3 (global ensemble). Also integrates open models from
  ECMWF, Microsoft, Google and others.
- Software: **Earth2Studio** (open-source, Apache-2.0, Python inference: data sources → prognostic/diagnostic/DA
  models → IO; github.com/NVIDIA/earth2studio); **PhysicsNeMo** (open-source training framework, formerly Modulus);
  **NIM** microservices; **Omniverse / OpenUSD** for visualisation ("Omniverse Blueprint for Earth-2 Weather Analytics").
  Weights on Hugging Face collection nvidia/earth-2: stormcast-v1-era5-hrrr, fourcastnet3, dlesym-v1-era5, cbottle,
  corrdiff-cmip6-era5, atlas-era5, stormscope-goes-mrms, fourcastnet1, healda, corrdiff-cosmo-era5, StormScope-NSRDB,
  stormcast-conus, interp-dit-crps-era5, healda-v2, corrdiff-era5-hrrr.
- Adopters named in the Jan 2026 blog: Brightband runs Medium Range daily ("among the first to run Earth-2 Medium
  Range operationally"); Israel Meteorological Service uses CorrDiff in operation, "90% reduction in compute time at
  2.5-kilometer resolution" vs classic NWP on a CPU cluster, plans Nowcasting up to 8 times daily; Taiwan Central
  Weather Administration; The Weather Company evaluating Nowcasting for severe weather; US NWS evaluating; TotalEnergies
  evaluating Nowcasting; Eni testing FourCastNet and CorrDiff for downscaling and gas demand; GCL (photovoltaic
  prediction, in operation); Southwest Power Pool with Hitachi (Nowcasting + FCN3 for intraday/day-ahead wind); S&P
  Global Energy (CorrDiff for climate-risk); AXA (FourCastNet to generate thousands of hypothetical hurricanes);
  Jua, Metdesk (energy trading), JBA Risk Management (flood). MITRE + Tomorrow.io (GTC DC 2025): sparse obs → weather states.

## FourCastNet (FCN, 2022) — Pathak et al., arXiv:2202.11214
- Adaptive Fourier Neural Operator (AFNO) on a ViT-style patch backbone: token mixing done by FFT → per-mode MLP → iFFT.
- Global 0.25° (721 × 1440), 6-h step, autoregressive. 20 variables (U10, V10, T2m, sp, MSLP, TCWV; z/u/v/T/RH at
  1000/850/500 hPa; z50). Precipitation from a separate diagnostic model. ERA5, trained 1979–2015.
- Week-long forecast in < 2 s; ~45,000× faster per node-hour and ~12,000× less energy than IFS (paper's estimate vs an
  extrapolated 18 km IFS). Experiments with 100-member ensembles. Training ~16 h on 64 A100.

## SFNO / FourCastNet v2 (2023) — Bonev et al., ICML 2023, arXiv:2306.03838
- Spherical Fourier Neural Operator: replaces the FFT on the lat-lon rectangle (which "incorrectly assumes a flat
  geometry": artefacts and dissipation, the poles are not edges) by the spherical harmonic transform.
- 73 channels, ERA5 0.25°, 6 h. Stable autoregressive rollouts for 1 year (1,460 six-hour steps); year-long rollout in
  12.8 min on one A6000 (~5,000× faster than IFS, different hardware). Skill comparable to IFS to ~2 weeks.
- Used for "Huge Ensembles" (bred-vector perturbations; Earth2Studio has HemisphericCentredBredVector).

## FourCastNet 3 (2025) — Bonev, Kurth et al., arXiv:2507.12144
- Probabilistic (hidden-Markov view: noise in, sample out); purely convolutional on the sphere: global spherical-
  harmonic filters + local DISCO convolutions; encoder, 8 neural-operator blocks, decoder; ~711M parameters.
- 72 variables (7 surface + 5 × 13 levels), 0.25°, 6 h. Trained with point-wise CRPS + spectral CRPS; 16 members in
  training, 50 in evaluation. 15-day forecast ≈ 60 s on one H100; 60-day forecast < 4 min on one GPU; ~8× faster than
  GenCast, ~60× faster than IFS-ENS. Beats IFS-ENS, close to GenCast; calibrated with realistic spectra to 60 days.
  Jan 2026 blog: "up to 60x faster" than diffusion-based approaches.

## Atlas = Earth-2 Medium Range (2026) — arXiv:2601.18111 "Demystifying Data-Driven Probabilistic Medium-Range Weather Forecasting"
- Atmospheric Transformer in Latent Space: a latent transformer that can be trained as diffusion, stochastic
  interpolant or CRPS; 15-day forecasts, 70+ variables, 0.25°. NVIDIA: statistically significant gains over IFS and
  GenCast on most variables. Earth2Studio: Atlas, AtlasCRPS (80 GB VRAM). HF: nvidia/atlas-era5.

## HealDA = Earth-2 Global Data Assimilation (2026) — arXiv:2601.17636
- Learns analysis directly from satellite + conventional observations (48 h window in v2), no background forecast;
  output on a 1° HEALPix grid (v1); HealDAv2: "104-channel, 0.25 degree atmospheric analysis". Initial conditions "in
  seconds on GPUs instead of hours on supercomputers". Initialising FCN3/Aurora/FengWu from HealDA costs < 1 day of
  effective lead time vs ERA5 initial conditions. With Medium Range: "the most skillful … open, entirely AI pipeline".

## CorrDiff (2023/2025) — Mardani et al., arXiv:2309.15214; Commun. Earth Environ. 2025, doi:10.1038/s43247-025-02042-5
- Residual corrective diffusion: a UNet regression predicts the conditional mean; an EDM diffusion model generates
  the residual (fine-scale variability). 25 km ERA5 → 2 km over Taiwan (CWA-WRF targets), 36×36 → 448×448; 12 input
  channels, 4 outputs (T2m, u10, v10, 1-h max radar reflectivity — not an input). Trained 2018–2020, tested 2021.
- Speed: sources disagree; quote with baseline: paper v4 "at least 22x faster, 1,300x more energy efficient" than WRF
  on 928 CPU cores; NVIDIA blog Jun 2024 "1,000x faster, 3,000x more energy efficient"; SC24 NIM / Earth-2 page "500x
  faster, 10,000x energy efficiency"; Jan 2026 blog "up to 500x faster".
- Earth2Studio variants: CorrDiffTaiwan, CorrDiffEra5Hrrr (0.25° ERA5 → 3 km HRRR over CONUS), CorrDiffCosmoEra5
  (ERA5 → COSMO-REA, Europe), CorrDiffCMIP6 (CMIP6 → ERA5), CorrDiffCosmoEra5SDA (with score-based assimilation).

## StormCast (2024) — Pathak et al., arXiv:2408.10958
- Emulates NOAA HRRR (3 km, convection-allowing), 1-h autoregressive steps, central US 1,536 × 1,920 km; regression
  UNet + EDM diffusion residual (18 denoising steps); 99 state variables conditioned on 26 synoptic variables (ERA5 in
  training, 0.25° GFS in real time). Composite-reflectivity FSS comparable to or better than HRRR to 6 h at 20/30/40 dBZ.
  5-member ensembles, under-dispersive. Training 64 H100 × 120 h. StormCastCONUS (2026) covers all of CONUS.

## StormScope = Earth-2 Nowcasting (2026) — arXiv:2601.17268 "Learning accurate storm-scale evolution from observations"
- Transformer diffusion models trained directly on GOES multi-band satellite imagery and radar (MRMS) over CONUS;
  6 km. NVIDIA: first AI model to outperform physics-based models on short-term precipitation.
- From the paper (Pathak et al., NVIDIA, 23 Jan 2026; full text read): TWO model classes. **Nowcasting** 0–2 h, 10-min
  steps, observations only, input = 6 past states 10 min apart (the preceding hour). **Nearcasting** 0–12 h, 1-h steps,
  input = one state 1 h earlier + one GFS channel (satellite model: Z500, ERA5 in training / GFS at inference; radar
  model: GFS simulated composite reflectivity). Paper's headline: competitive with mesoscale NWP up to 6 h; single-member
  radar FSS beats HRRR to 3 h, competitive to 5 h (significant except 4 h at 30 dBZ/42 km). Full details for the deep
  dive (section 5b) are in the paper text; see BRIEF_SS.md.
  Variants: StormScopeGOES, StormScopeMRMS, StormScopeMeteosatEU (MTG FCI imagery over Europe), StormScopeDxNSRDB
  (solar irradiance GHI from GOES).

## cBottle, Climate in a Bottle (2025) — Brenowitz, Ge et al., arXiv:2505.06474
- Generative diffusion model that samples atmospheric states (not time-stepping). Two stages: global coarse generator
  on HEALPix HPX64 (~100 km, 49k pixels) conditioned on monthly SST and solar position (time of day/year); patch-based
  16× super-resolution to HPX1024 (~5 km, 12.5M pixels). Trained on ICON km-scale simulation (2020–2024) and ERA5
  (1980–2017). Zero-shot bias correction, downscaling, channel infilling, guided tropical-cyclone sampling. Compresses
  petabytes of output into a few GB of weights. Earth2Studio: CBottle3D (data source), CBottleInfill, CBottleSR,
  CBottleTCGuidance, CBottleVideo.

## DLESyM (2024) — Cresswell-Clay, Liu, Durran et al., arXiv:2409.16247
- Deep Learning Earth System Model: coupled atmosphere (9 variables: z1000/700/500/300/250, T2m, T850, TCWV, OLR; 6 h
  steps, 12 h) and ocean (SST, 48 h steps), coupled every 4 days, on HEALPix (12 faces × 64 × 64 = 49,152 cells, ~110
  km). 1,000-year runs with no drift in ~12 h on one A100 (CESM2: ~90 days). Variability comparable to CMIP6 models
  (tropical cyclogenesis, Indian monsoon, blocking). DLWP (2021) was the cubed-sphere predecessor.

## Other models runnable in Earth2Studio
GraphCast (Google DeepMind; GNN on icosahedral multimesh; 0.25°, 37 levels, 6 h; arXiv:2212.12794) · GenCast
(DeepMind diffusion ensemble; GenCastMini) · Pangu-Weather (Huawei; 3-D Earth-Specific Transformer; 1/3/6/24-h models;
arXiv:2211.02556) · FuXi (Fudan; cascaded U-Transformer; 15 days; arXiv:2306.12873) · FengWu (Shanghai AI Lab) ·
AIFS / AIFS-ENS (ECMWF; GNN encoder/decoder + transformer processor; operational 2025; arXiv:2406.01465) · Aurora
(Microsoft; 1.3B 3-D Swin foundation model; arXiv:2405.13063) · ACE2 (Ai2) · CAMulator (NSF NCAR) · WeatherNext 2.

## Earth2Studio usage (README, exact)
```python
from earth2studio.models.px import FCN3
from earth2studio.data import GFS
from earth2studio.io import ZarrBackend
from earth2studio.run import deterministic as run

model = FCN3.load_model(FCN3.load_default_package())
data = GFS()
io = ZarrBackend("outputs/fcn3_forecast.zarr")
run(["2025-01-01T00:00:00"], 10, model, data, io)
```
Components: data sources (GFS, IFS, IFS_ENS, ARCO_ERA5, CDS_ERA5, HRRR, GOES, MRMS, CMIP6 …), prognostic `px`
(time-stepping), diagnostic `dx` (map a state to other variables: PrecipitationAFNO, SolarRadiationAFNO, WindgustAFNO,
CorrDiff*, TC trackers, derived RH/wind speed), data assimilation `da` (HealDA, StormCastSDA …), perturbations
(Gaussian, SphericalGaussian, BredVector, HemisphericCentredBredVector, LaggedEnsemble …), IO (ZarrBackend,
NetCDF4Backend, XarrayBackend …), workflows run.deterministic / run.ensemble / run.diagnostic. Note: README says the
release after 0.20.0 will be 1.0.0 and not backward compatible.
