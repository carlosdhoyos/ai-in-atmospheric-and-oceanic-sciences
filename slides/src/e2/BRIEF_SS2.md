# Section 5b, more depth: diffusion from scratch (Part D) and the architecture end to end (Part C)

The user asked for **much more detail about the architecture**, in particular StormScope: **what a diffusion model is,
how it is trained, with an example**; and asked whether StormScope can run on a **limited-area region** or must be global.

Read first: `slides/src/e2/BRIEF.md` (conventions, build, checks, library), `slides/src/e2/BRIEF_SS.md` (section 5b
facts and conventions; data-sec="5b · StormScope", modality colours), the paper text at
`/tmp/claude-0/-home-user-ai-in-atmospheric-and-oceanic-sciences/bb5f4182-3098-593c-af4e-854b0c8c52db/scratchpad/stormscope_pdf/ss.txt`
(read §4.2.2, §4.2.3, §6.2 closely), and the existing 5b slides `45-ss1.*` (Part A: pipeline, inputs, grid, modes,
two-stage rollout) and `46-ss2.*` (Part B: tokens, neighborhood attention, one DiT block, diffusion training with σ
slider, 100-step sampler, ensembles, FSS, objects, results, cost, Colombia, quiz). Build on them; do not repeat them —
link to them with `data-go="<slide id>"` buttons where useful. Do not edit their files.

Deck order after this work: Part A (45-ss1) → **Part D (45b-diff)** → **Part C (45c-arch)** → Part B (46-ss2).

Honesty rules (same as before): numbers come from the paper (cite §/Fig./Table) or are labelled "toy" / "our
estimate"; things the paper does not state (σ_min, σ_max, σ_int, σ_data, positional embedding, output head details,
exact channel counts per model) are said to be unstated, and any value we use is labelled as EDM's default or a toy.

## Part D · `45b-diff.html/.js` · prefix `sd` · "Diffusion models from scratch"
Goal: a student who has never seen a diffusion model understands it, and **watches one being trained in the browser**.
Suggested slides (≈ 8; each with a step control or live demo, big visuals, `.tryit`):
1. `sd-why` — why not plain regression: when the future is uncertain (a storm may go left or right, may or may not
   form), MSE training predicts the average → two half-storms, smeared, too weak. A generative model draws one
   plausible future per sample. Interactive: pick the spread of possible futures, compare "MSE prediction" vs samples.
2. `sd-forward` — the forward (noising) process on a toy storm image: x_σ = x + σ·n; σ slider (log); show the image,
   its histogram and its power spectrum: small scales drown first, large scales survive longer.
3. `sd-denoiser` — the denoiser D(x_σ; σ): its best possible answer is the average of all clean images consistent with
   the noisy one. With a small toy "training set" (e.g. 6–8 storm images), compute the exact optimal denoiser and show
   the weights it puts on each training image as σ changes (high σ → dataset mean; low σ → the nearest image).
4. `sd-field` — two-pixel picture: data are points in 2-D; at each σ the denoiser defines an arrow field
   (D(x) − x)/σ² (the score) pointing towards the data; slider for σ; click to drop a point and follow the arrows.
5. `sd-live` — **live training** in the browser: a tiny MLP (hand-written forward/backward + Adam, in your JS) learns
   to denoise a 2-D toy distribution (e.g. two or three clusters, or a ring) with the EDM loss: draw σ log-uniform,
   add noise, predict, weighted MSE. Play/pause, learning-rate and width controls, loss curve, the learned arrow field
   next to the exact one, and "sample now" with the current network. Keep each frame < 30 ms (train in small batches
   per animation frame). This is the central example: say clearly that StormScope does the same thing with 195 M
   parameters on 512 × 896 images.
6. `sd-sample` — sampling: start at σ_max with pure noise, step σ down with Euler / Heun (EDM ODE), optional
   stochastic "churn"; trajectories of many samples in the 2-D toy; number of steps slider (too few → samples land
   between clusters). Then show the same on a toy storm image (or link to Part B's `sb-sample`).
7. `sd-cond` — conditioning: the denoiser also receives the past frames (+ lat/lon, sun angle, GFS for nearcast) as
   extra input channels, so it learns p(future | past). 2-D toy: a condition slider moves/reshapes the target
   distribution; samples follow. Map it to StormScope's dense channel concatenation (§4.2.2).
8. `sd-edm` — the EDM recipe used by StormScope (§4.2.3, Karras et al. 2022): preconditioning
   D = c_skip·x + c_out·F(c_in·x; c_noise) with the formulas and a plot of c_skip, c_out, c_in vs σ (σ_data as a
   labelled default); loss weight λ(σ); σ sampled uniform in log σ (paper) vs EDM's log-normal default; the
   **two experts** split at σ_int; the 100-step stochastic sampler. Calculator: pick σ, read the coefficients.

## Part C · `45c-arch.html/.js` · prefix `sc` · "The whole network, end to end"
Suggested slides (≈ 5):
1. `sc-arch` — the full denoiser with **tensor shapes at every stage**, clickable/steppable: inputs (noisy target,
   past frames, lat/lon, cos SZA, GFS) → concatenate → EDM c_in scaling → 4 × 4 strided-conv patch embedding →
   128 × 224 × 768 tokens → 16 DiT blocks (adaLN conditioned on the σ embedding; 31 × 31 neighborhood attention; MLP)
   → final norm + linear to 4·4·C_out per token → unpatchify → C_out × 512 × 896 → c_skip·x + c_out·F → denoised
   future. Model switch: satellite nowcast / satellite nearcast / radar nowcast / radar nearcast (use the same channel
   counts as Part B's `sb-tokens`; read its JS). A side card per stage says what it does and what the paper states vs
   what is standard DiT practice.
2. `sc-params` — where the 195 M parameters and the compute go (our estimate per component with standard DiT sizes,
   clearly labelled; the paper's total 195 M; training memory ~70 GB; inference ~5 GB).
3. `sc-iter` — **one training iteration, step by step, with shapes and toy numbers**: pick a time t from 2018–2023
   (MRMS 2020–2023), load past + future frames, draw σ (log-uniform), add noise, forward pass, weighted loss, backprop,
   Stable AdamW update; batch 32 on 32 H100s; ~6 M iterations; lr 5e-4 → 0 cosine (plot); ~48 h (§4.2.3).
4. `sc-forecast` — **one full forecast as nested loops**, animated: outer loop over lead steps (nowcast 12 × 10 min),
   inner loop over 100 σ steps, per step satellite DiT then radar DiT; counters of network evaluations (e.g. 12 × 100 ×
   2 = 2,400 per member), the 33 s per step and ~7 min per forecast (§4.2.2); members × GPUs.
5. `sc-domain` — **"Global or limited area?"** StormScope is a **limited-area** model: one fixed CONUS domain on the
   HRRR grid, 512 × 896 cells at 6 km (≈ 3,072 × 5,376 km), evaluation inside CONUS land (§2.2.1, §4.2.2); the paper
   calls it "the limited-area domain" (§4.2.1) and uses GFS conditioning in nearcast mode for large-scale context.
   Interactive toy: a domain rectangle, steering wind and lead-time sliders; storms entering through the inflow
   boundary are unknown to the model, so a "trustworthy interior" shrinks with lead time (wind × lead) — label this as
   our reasoning, not a paper result. Then the options for another region, each tagged *paper* / *Earth2Studio* /
   *our reasoning*: (a) train on a new domain — the method only needs geostationary imagery (+ radar where available)
   (Abstract, §3), and a Europe variant on MTG imagery exists (Earth2Studio StormScopeMeteosatEU); (b) bigger domains up
   to full disk via domain parallelism (§6.2, 3 km CONUS demo 1792 × 1024); (c) cropping the released CONUS model to a
   sub-region: the layers (strided conv, local attention) can in principle take other grid sizes that are multiples of
   4, but the model was trained with CONUS lat/lon, terrain and climate — untested, retrain or fine-tune instead. A
   Colombia example: a domain of your choice at 6 km (e.g. ~2,400 × 1,800 km → 400 × 300 cells, rounded to multiples of
   4), GOES-East coverage, IDEAM radars, what training data would be needed.
