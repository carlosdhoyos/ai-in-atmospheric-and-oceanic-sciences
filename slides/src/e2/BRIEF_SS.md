# Section 5b · StormScope step by step — brief for the two authors

The user asked for a **very detailed, step-by-step** walkthrough of StormScope, with interactive examples and very
visual, clear diagrams. It is a sub-section of the Earth-2 deck (read `slides/src/e2/BRIEF.md` for conventions, build,
checks and the shared library; it all applies). Language: English, like the rest of the deck.

**Source:** the full paper text is at
`/tmp/claude-0/-home-user-ai-in-atmospheric-and-oceanic-sciences/bb5f4182-3098-593c-af4e-854b0c8c52db/scratchpad/stormscope_pdf/ss.txt`
(Pathak, Abbas, Harrington, Hu, Brenowitz, Ravuri, Carpentieri, Leinonen, Adams, Hennigh, Geneva, Durran, Pritchard,
"Learning Accurate Storm-Scale Evolution from Observations", NVIDIA, 23 Jan 2026, arXiv:2601.17268). Read it all.
Every number on a slide must come from it, cited as "paper §x / Fig. y / Table z". Do not copy the paper's figures
(no images); **redraw** the ideas as SVG/canvas diagrams. Where a curve would need the paper's exact values, draw a
clearly labelled *schematic* and state the numbers the text gives. Toys run on synthetic fields; say "toy".

## Key facts (verify in the text)
- Two model classes (§1, §4.2.1, Table 2): **Nowcasting** 0–2 h, 10-min steps, observations only, input = 6 past states
  10 min apart; **Nearcasting** 0–12 h, 1-h steps, input = one state 1 h earlier + one GFS channel. Satellite model
  conditioned on Z500 (ERA5 in training, GFS at inference); radar model on GFS simulated composite reflectivity.
- Data (Table 1, §4.1): GOES-16 ABI, 8 channels: Blue 0.47, Red 0.64, Veggie 0.86 µm (visible/near-IR), Shortwave
  window 3.90, upper/mid/lower water vapour 6.19/6.95/7.34, clean IR longwave window 10.35 µm; MRMS max composite
  reflectivity; cos solar zenith angle; lat/lon. GOES 2018–2023, MRMS 2020–2023 for training; test year 2024. Remapped
  to the HRRR 3 km Lambert conformal grid, downsampled to 6 km; 10-min cadence.
- Two-stage multimodal design (§4.2.1, Fig. 11): satellite DiT is the backbone, trained/sampled independently; radar
  DiT is conditioned on the satellite (forecast at inference) → works where radar is missing. Autoregressive sliding
  window: predictions x̃(t), ỹ(t) recycled as inputs.
- Architecture (§4.2.2): Diffusion Transformer (DiT) on a 512 × 896 grid at 6 km; dense conditioning by channel
  concatenation (noisy state + previous states + lat/lon + solar zenith + NWP); 4 × 4 patch embedding (strided conv) →
  128 × 224 tokens, dim 768; 16 transformer blocks with adaptive (conditional) layer norm on the diffusion noise level;
  2-D **Neighborhood Attention** with a 31 × 31 window instead of global attention; 195 M parameters; ~70 GB training
  memory; 32 H100 × ~48 h, batch 32, ~6 M iterations, Stable AdamW, lr 5e-4 → 0 cosine.
- Diffusion (§4.2.3): EDM (Karras et al.); learns p(x_future | x_past; c); denoising loss eq. (1) with λ(σ) weighting
  and EDM pre-conditioning; noise sampled uniform in log σ; **two experts** (coarse / fine) split at σ_int; sampler: EDM
  ODE sampler with stochastic perturbations, 100 steps σ_max → σ_min, switching expert at σ_int.
- Cost (§4.2.2): inference ~5 GB, 33 s per forecast step at 100 sampling steps in fp32 on one H100 → ~7 min for a 12-h
  nearcast or 2-h nowcast (12 steps); multimodal runs the two models in sequence. 3 km version (§6.2): 1792 × 1024
  (~1.8 M pixels), domain parallelism with halo exchange for the NA kernels, 2 GPUs per model × 4 data-parallel,
  ~87.5 % scaling efficiency.
- Evaluation: test 2024. Nearcast vs HRRR (§2.2.1, Fig. 6–8, 12–13, 16–17): 360 initialisations; FSS (Roberts & Lean)
  at 20 dBZ/18 km and 30 dBZ/42 km; single member beats HRRR to 3 h, competitive to ~5 h; paired differences significant
  at all leads (20 dBZ/18 km) and all except 4 h (30 dBZ/42 km); CRPS of a 5-member StormScope ensemble beats a
  5-member lagged HRRR ensemble (t0, t0−1h … t0−4h); IR FSS at 235 K and 225 K better for first 3 h; reliability with 24
  members: over-confident (curves below diagonal) at 20/30 dBZ; CRPS in mm/h via Marshall–Palmer Z = 300 R^1.4; GFS
  simulated-reflectivity conditioning improves FSS at all leads, more at long leads.
  Nowcast vs pySTEPS (§2.2.2, Fig. 9–10): 250 initialisations in winter/spring 2024 with strong precipitation; pySTEPS
  = Lucas–Kanade optical flow from 4 past radar frames + semi-Lagrangian advection (Lagrangian persistence); FSS at 40
  dBZ with 6/18/30 km windows: all low at 6 km, StormScope notably better after 20 min at larger windows. Object-based
  (WoFSCast rules): objects = contiguous ≥ 40 dBZ with area > 108 km²; match if minimum boundary distance and centroid
  displacement ≤ 40 km; POD, SR, CSI, FB: FB closer to 1, CSI and POD higher, SR not uniformly better.
- Case studies: 25 Jun 2024 12 UTC (CONUS visible composite, IR 10.35 µm, radar to 12 h — memory of small scales lost
  by 6–12 h, large scales kept); 15 May 2024 00 UTC MCS (3 members: one aggregates into an MCS like the truth, two don't
  — aggregation is stochastic); 14 Mar 2024 00 UTC Kansas storms (good match at 10 min–1 h, degrading by 2 h).
- Limitations (§3): sparse synoptic conditioning; parallax at steep viewing angles; no comparison with NowcastNet or
  DGMR (no claim of radar-only SOTA at 0–2 h); 6 km vs pySTEPS native 1–2 km; HRRR lagged ensemble is a weak
  probabilistic baseline (full ensembles e.g. Warn-on-Forecast in future). Opportunity: satellites are global →
  countries without km-scale DA/radar (relevant to Colombia: GOES-East covers it).
- Motivation (§1): convective-scale DA is hard (sparse obs vs scales; radar is indirect; geostationary IR constrains
  T/q only loosely and only in clear sky); error growth saturates in hours and is aliased with spin-up; initial shock,
  digital filters → the model's initial state is not the best guess. Extrapolation degrades after 1–2 h.

## Shared conventions for 5b
- data-sec="5b · StormScope" on every slide (the header has a "5b StormScope" button).
- Colours: GOES/satellite `--cool`, MRMS/radar `--lw`, GFS/NWP `--muted`, StormScope model `--accent`, HRRR `--sw`,
  pySTEPS `--data`, observations/truth `--fg`. Reflectivity colour scale: use `CM.precip` with 0–60 dBZ (draw the colour
  bar with dBZ ticks); IR brightness temperature: a grey or `CM.temp` reversed (cold cloud tops bright).
- A toy "storm world" is fine: e.g. a 128 × 224 (or smaller, 64 × 112) field on the same 4:7 aspect as the 512 × 896 grid,
  with storm cells as Gaussian blobs that move with a steering wind, grow/decay, aggregate; derive a toy IR (cold where
  reflectivity is high, plus anvil spread) and a toy water-vapour field from it. Make it deterministic with a seed.
- Big, clear diagrams: tensors drawn as stacked boxes with their shapes written on them (e.g. "6 × 8 channels ×
  512 × 896"), arrows with labels, colour-coded by modality. Each step-by-step slide should have a step control
  (chips 1 2 3 … or ◀ ▶) that highlights the current stage of the diagram and explains it in a side card.

## Split
- **Part A** · files `45-ss1.html/.js` · prefix `sa` · first slide id **`ss-intro`** (opener, kicker "5b · StormScope step
  by step"). Slides: (1) StormScope in one picture: the full pipeline diagram, clickable boxes; (2) why learn from
  observations: the nowcasting gap (schematic skill vs lead for extrapolation, NWP with spin-up, StormScope) + the DA
  problems listed above as a clickable list; (3) the inputs: the 8 ABI channels on a wavelength axis, click one to see a
  toy image of the same scene in that channel and what it measures (day-only for visible), plus MRMS, solar zenith,
  lat/lon, GFS; (4) the grid: GOES → HRRR 3 km Lambert grid → 6 km, 512 × 896, 10-min cadence; resolution slider showing
  a toy storm at 3/6/12/24 km; (5) two modes: nowcast vs nearcast (Table 2) with a timeline diagram of which frames go
  in (6 frames vs 1 frame + GFS) — toggle; (6) the two-stage multimodal design: satellite DiT then radar DiT conditioned
  on it, the sliding window over steps (step ◀ ▶ through 4–5 autoregressive steps, frames sliding left).
- **Part B** · files `46-ss2.html/.js` · prefix `sb` · first slide id `sb-tokens`. Slides: (1) from images to tokens:
  channel concatenation (count the input channels for nowcast and nearcast), 4 × 4 patches → 128 × 224 = 28,672 tokens
  × 768; patch-size control showing token count and cost; (2) neighborhood attention: click a token on a token grid,
  show its 31 × 31 window; slider for number of layers showing how the receptive field grows (in tokens and km); compare
  cost of global vs neighborhood attention (N² vs N·961); (3) one DiT block step by step (adaLN conditioned on σ, NA,
  MLP, residuals) as a clickable diagram; (4) diffusion training: noisy future frame at a σ slider, the denoiser's
  target, eq. (1), log-uniform σ sampling, the coarse/fine experts split at σ_int; (5) sampling: 100 steps from σ_max to
  σ_min on a toy field (step slider / play), expert switch marker; different seeds → different members; (6) ensembles and
  probability: toy 24-member rollout, probability of ≥ 30 dBZ map, the MCS aggregation story; reliability diagram idea
  (over-confidence); (7) verification: interactive FSS (threshold + window sliders on a toy forecast vs observation,
  showing the double penalty at small windows) and object matching (≥ 40 dBZ, > 108 km², 40 km rule) with hits /
  misses / false alarms → POD, SR, CSI, FB; (8) results as reported (schematics + exact statements and significance);
  (9) cost and scaling: calculator (members × steps × 33 s per step at 100 sampling steps) and the 3 km domain-parallel
  version with halo exchange diagram; (10) limitations and what it would take for Colombia (GOES-East coverage,
  IDEAM radars, training data, fine-tuning with PhysicsNeMo/Earth2Studio), and a short quiz.
