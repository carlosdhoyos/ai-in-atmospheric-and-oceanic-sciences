# Earth-2 deck: brief for section authors

A standalone interactive HTML deck (English) about **NVIDIA Earth-2**: the AI models NVIDIA builds and hosts for
weather and climate, and how each one works. Audience: graduate students in atmospheric and ocean sciences who have
seen the neural-network series in this repo (`slides/src/m0 … m6`: operations, layers, attention, optimisation). Same
look and level of interactivity as those decks (see `slides/src/m2/g*.html/js` and `slides/src/pae/*` for examples).

**Facts:** read `slides/src/e2/FACTS.md` first. Every number shown on a slide comes from it, with its source (arXiv id
or blog) in a `.note` on that slide. Vendor claims are worded as claims with their baseline. Do not invent numbers.
**Toys:** demos run on synthetic toy fields in the browser (no real model weights); say "toy" where a result could be
mistaken for the real model's. A toy should show the *mechanism* (why a spherical transform, why diffusion on the
residual, why CRPS gives sharp ensembles…), with the real numbers from FACTS.md next to it.

## Files and build

- Write **only** your own `slides/src/e2/NN-name.html` and `slides/src/e2/NN-name.js`. Do not edit anything else (not
  `lib/`, `00-intro.*`, `common/`, the build). If you find a bug or a gap in `lib/`, work around it in your file and
  report it in your final message.
- Build only your section (plus the intro): `ONLY=NN-name python3 slides/build_e2.py` → `slides/earth2/index.html`.
  Copy that file into your own scratch directory before checking (other authors rebuild the same file).
- Check: `node slides/tools/check_deck.js <copy.html> <outdir> <slide ids…>` → JS errors, horizontal overflow, empty
  hosts, duplicate ids, and screenshots (1280 px light) of the listed slides. Look at every screenshot and fix
  overlaps, clipped labels, unreadable text. Also click through your controls with a small Playwright script
  (Chromium is preinstalled; `require('playwright')` works) and check dark mode (`colorScheme: 'dark'`).
- A slide should fit 1280 × 820 with little or no zoom (`fitSlide` shrinks tall slides; avoid needing it).
- Do not commit; the lead integrates.

## Conventions

- **Slide markup:** `<section class="slide" id="…" data-g="a" data-sec="N · Section name">` (the header highlights
  section N from the first token of data-sec). Your first slide is the section opener with the fixed id below and
  kicker `N · Title`. Use `.two` (left text/controls, right `.panel` figure), `.chips`, `.ctl` sliders, `.readout`,
  `.calc`, `.callout`, `.eq`, `.note`, `ul.pts`, `.card`, `.three`.
- **Every interactive element gets a one-line `<p class="tryit">…</p>`** (CSS adds "Try this ·").
- **Ids:** prefix every element id and slide id (except the fixed opener) with your prefix.
- **Demos:** `demo(slideId, slide => { …; render(); return render; })`. `render` redraws everything from state (it is
  called again on theme change). Heavy work lazily on first show, cached; any interaction under ~0,3 s if possible
  (sliders feel bad above that). Animations: `setInterval`/`requestAnimationFrame`, stop when
  `!slide.classList.contains("on")`; offer play/pause, never autoplay forever.
- **Colours:** css tokens only (`css("--accent")` …): `--accent --accent-2 --data --arch --ok --sw --lw --mag --cool
  --muted --fg --line --well --card` and `*-soft`. Fields use the `CM` maps: `CM.vir` (generic), `CM.div`
  (anomalies/errors, symmetric limits), `CM.temp`, `CM.precip`. Model colours used across the deck: truth / observations
  `--fg`, FourCastNet/SFNO `--accent`, FCN3 `--data`, Atlas `--arch`, CorrDiff `--sw`, StormCast/StormScope `--lw`,
  cBottle/DLESyM `--ok`, physics NWP `--muted`.
- Note: `slider(id, fmtFn, onInput)` returns a getter function (`const s = slider(…); s()`), `chips(host, onChange)` too.
- Helpers available globally: `$ $$ fmt fmtN clamp css el svgIn press chips slider relu sigm softmax mean sd rng gauss
  lin axes path` (common/core.js), `arrowDefs heat div gridSVG solve erf Phi corr` (common/helpers.js).
- Write plainly; short sentences; define a term when first used; English key terms in **bold** once.

## Shared library `slides/src/e2/lib/e2.js` (read it)

- `ATM.z500(lon, lat, tHours, {kmax, amp})` analytic 500 hPa-like height (m) on the sphere: zonal mean + Rossby-like
  waves (m = 3…23, both hemispheres) drifting east at m-dependent speeds. `ATM.grid(nlon, nlat, t, opts)` → row-major
  array (row 0 north). `ATM.RANGE` ≈ [4950, 5950]. Use as "truth" for toy forecasts; errors can be added by perturbing
  phases/speeds or by `kmax` (dropping small scales = blur).
- `FFT.fft/fft2` (radix-2), `FFT.dft/idft` (real 1-D, any n; keep(k) filter), `FFT.noise2(n, {beta, seed, kmin, kmax})`
  periodic power-law random field (unit variance), `FFT.spectrum2(f, n)` radial power spectrum, `FFT.blur(f, n, r)`,
  `FFT.coarsen(f, n, fac)`, `FFT.upsample(c, m, fac, bilinear)`.
- `HPX.npix(ns)`, `HPX.centers(ns)` → [{theta, phi, ring}], `HPX.ang2pix(ns, theta, phi)` (ring scheme, verified).
- `MET.rmse(f, o, w)`, `MET.bias`, `MET.acc(f, o, clim, w)`, `MET.crps(ens, y)`, `MET.csi(f, o, thr)`.
- `VIZ.raster(host, values, nx, ny, {color, lo, hi, mask, smooth, onCell(i,j), onHover(i,j), overlay(ctx, sx, sy)})`
  canvas field; `VIZ.globe(host, f(latDeg, lonDeg), {size, lon0, lat0, color, lo, hi, graticule, drag, edges})` →
  orthographic globe, drag to rotate (~70k evaluations per draw: keep f cheap, or precompute on a grid and look up);
  `VIZ.legend`, `VIZ.curves(host, series, {xr, yr, xl, yl, marks, logx, logy, band})`, `VIZ.bars`,
  `VIZ.quiz(host, [{q, opts, right, why}])`.

## Sections (number · opener id · files · prefix · content)

1. Platform · `s-platform` · `00-intro` · `p` · lead (cover, toc, the pipeline, AI vs physics NWP, model map).
2. Global forecasting · `s-global` · `10-global` · `gf` · autoregressive rollout and error growth (ACC/RMSE vs lead);
   FourCastNet/AFNO (token mixing in Fourier space, on a latitude circle: keep/learn modes); SFNO (why the sphere:
   lat-lon FFT treats the map as a flat periodic rectangle; spherical harmonics on a globe; long stable rollouts);
   deterministic models blur at long lead (MSE → the mean of possible futures; spectra lose small scales); FCN3
   ensembles and CRPS (interactive CRPS: sharp vs blurry vs under-dispersed ensembles); Atlas = Earth-2 Medium Range
   (latent transformer, diffusion / interpolant / CRPS training); short quiz.
3. Data assimilation · `s-da` · `20-da` · `da` · why initial conditions matter (same model, perturbed start →
   divergence); classical analysis = background + observations weighted by their errors (1-D toy with draggable
   observations, optimal interpolation); observation coverage (satellite swaths, radiosondes) on a globe; HEALPix grid
   (equal-area pixels vs lat-lon cells; nside slider; used by HealDA, DLESyM, cBottle); HealDA (learned map from 48 h of
   observations to an analysis without a background forecast; the "< 1 day of lead time" result); short quiz.
4. Downscaling · `s-downscale` · `30-downscale` · `ds` · the problem (25 km → 2 km; bilinear interpolation cannot
   invent detail); CorrDiff step by step (regression UNet → mean; diffusion → residual; sum; several samples); a
   diffusion toy (noise → field over denoising steps); spectra (regression alone is too smooth, diffusion restores
   small-scale power); variants and users (Taiwan, ERA5 → HRRR, COSMO, CMIP6; IMS, S&P, Eni) with the speed claims
   and their baselines; short quiz.
5. Nowcasting and km-scale · `s-nowcast` · `40-nowcast` · `nc` · 0–6 h problem (convection, NWP spin-up,
   extrapolation baseline); StormCast (emulates 3 km HRRR, 1-h steps, conditioned on a global model, regression +
   diffusion); StormScope (learns directly from GOES + radar, 6 km, 10-min steps): toy storm field where cells move,
   grow and decay; compare persistence, advection (extrapolation) and a generative ensemble with CSI vs lead time and
   thresholds; short quiz.
6. Climate · `s-climate` · `50-climate` · `cl` · weather vs climate (trajectory vs statistics; drift in long
   autoregressive rollouts; toy where a slightly unstable model drifts and a stable one keeps its climate); DLESyM
   (coupled atmosphere + ocean, different time steps, coupling every 4 days, 1,000-year runs); cBottle (generates states
   conditioned on SST and time instead of stepping; infilling a missing channel; super-resolution 100 → 5 km on
   HEALPix); huge ensembles for rare extremes (return periods: how many members you need to see a 1-in-100 event;
   AXA hurricane scenarios); short quiz.
7. Earth2Studio · `s-studio` · `60-studio` · `st` · lead (pipeline builder → code, model table, adoption, limits, summary).
