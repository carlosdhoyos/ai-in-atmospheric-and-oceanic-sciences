# Brief for Module 2 (Operations) slide groups

You are writing one group of slides for **Module 2: Operations** of an interactive class deck on neural networks
(English; audience: a Colombian university class; running examples: Medellín rainfall, climate fields over Colombia,
the student-attrition table, a short sentence). The spec for every operation is the uploaded guide:
`/root/.claude/uploads/bb5f4182-3098-593c-af4e-854b0c8c52db/e5275112-Neural_Network_Operations___Detailed_Guide.md`.
Read your operations' sections there and implement their **definition, worked numeric example (exact numbers), insights,
and the interactive spec** as faithfully as a single slide allows. Every slide should show input, operation and output
side by side, with connections drawn as lines whose thickness is the weight where that makes sense.

## Files you own (write only these)
- `slides/src/m2/gN.html` — your `<section class="slide">` elements, in the guide's order.
- `slides/src/m2/gN.js` — your demos.
Do not edit any other file. If you think something shared needs to change, say so in your report.

## Conventions (read the existing code first)
- Look at `slides/src/common/deck.css` (classes), `slides/src/common/core.js` (helpers + `demo()` registry),
  `slides/src/common/helpers.js` (heat, div, gridSVG, solve, arrowDefs, bindQuiz, erf, Phi, corr) and
  `slides/src/common/datasets.js` (DS.daily, DS.monthly, DS.mask/elev/temp/precip grids, DS.students, DS.sentence; fieldSVG).
- The previous single deck's demos are in `slides/src/legacy/arch.js` and `legacy/part2_arch.html`; reuse and upgrade
  code from there when your operation already had a demo (copy it into your file under your own IDs).
- Slide markup pattern (copy it):
  ```html
  <section class="slide" id="op-xxx" data-g="a" data-sec="2 · Operations · Group name">
    <p class="kicker k-arch"><span class="opnum">05</span>Convolution</p>
    <h2>A claim-style title in one sentence</h2>
    <div class="two"> <div>…text, .eq.arch equation, ul.pts, .callout …</div> <div class="panel">…controls + figure + .readout/.calc…</div> </div>
  </section>
  ```
  Use the operation number from the guide in `.opnum` (01–27, and 08b, 11b, 11c).
- Every element id in your HTML must start with your group prefix (`g1`, `g2`, …), e.g. `g2tcFig`, `g2tcRead`,
  so ids never collide with other groups. Slide ids are fixed (below).
- JS: register each slide's demo with `demo("op-xxx", slide => { …; render(); return render; })`. The function runs the
  first time the slide is shown and must return a render function (re-run on theme change). Wrap any extra top-level
  helpers inside your demo functions or in one IIFE so names never clash with other groups (all scripts share one global scope).
  Use the helpers: `slider(id, fmtFn, onInput)`, `chips(hostEl, onChange)`, `svgIn(host, W, H)`, `el(tag, attrs, parent, text)`,
  `axes(...)`, `path(...)`, `css("--token")` for colours, `fmt`, `fmtN`, `rng(seed)`, `gauss(r)`, `softmax`, `relu`, `sigm`, `gelu`.
- Colours only from tokens via `css("--…")` (both themes must work): --accent, --arch (violet, this module), --data, --sw (amber),
  --lw (red), --ok (green), --cool (blue), --pos/--neg (diverging), --muted, --line, --well, --card, --fg, --bg; soft fills
  --arch-soft, --cool-soft, --sw-soft, --lw-soft, --ok-soft, --data-soft. Positive weights warm (--pos), negative cool (--neg).
- Keep each slide fitting a 1280×800 screen where possible (the deck zooms tall slides down to 70%), and working at 390 px
  wide (no horizontal page scroll; wide figures go inside `.fig-wrap`). Use SVG for diagrams; canvas only for big grids.
- Writing: plain, direct English; short sentences; no em-dash asides; numbers with units. Synthetic data must not be
  presented as real observations.

## Test
- `cd /home/user/ai-in-atmospheric-and-oceanic-sciences && ONLY=gN python3 slides/build.py` builds Module 2 with only the
  intro and your group into `slides/operations.html` (other agents do the same; rebuild right before you test).
  To avoid clashing with other agents, copy the built file right away: `cp slides/operations.html /tmp/claude-0/-home-user-ai-in-atmospheric-and-oceanic-sciences/bb5f4182-3098-593c-af4e-854b0c8c52db/scratchpad/opsN.html`
  and test the copy.
- `node slides/tools/check_deck.js <copy> <screenshot dir> op-xxx op-yyy` must report no JS errors, no overflow, no empty hosts.
  Look at your screenshots once and fix what is broken (overlaps, clipped labels, unreadable colours). Screenshot dir:
  `/tmp/claude-0/-home-user-ai-in-atmospheric-and-oceanic-sciences/bb5f4182-3098-593c-af4e-854b0c8c52db/scratchpad/gN/`.
- Report briefly: slides written, anything from the guide you could not fit, and anything shared that should change.
