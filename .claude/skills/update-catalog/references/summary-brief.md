# Summary brief

Use this brief to write the structured summary cards for papers that do not have one yet, either yourself or by
handing one batch file per subagent. The cards feed the catalog page, `SUMMARIES.md`, the categories in the
database (goal, architecture, data, limitations, open problems are all derived from these texts by keyword rules)
and the EDA. Accuracy matters more than polish: the reader is a researcher triaging the literature.

## Input

A batch file `.update/sum_in/batch_NN.json`: a list of papers with `id`, `title`, `authors` (first 4), `year`,
`venue`, `abstract` (may be null).

## Output

`.update/sum_out/batch_NN.json` (same file name): a JSON object keyed by the paper `id` (copied exactly), each value

```json
{"goal": "...", "architecture": "...", "data": "...", "result": "...", "open_work": "...", "issues": "...", "basis": "..."}
```

Each field is 1–2 short sentences (about 15–40 words), plain and specific, present tense, no first person, no
markdown inside strings.

- **goal**: the problem the paper addresses and why.
- **architecture**: the model or method. Name the network family explicitly ("graph neural network",
  "U-Net", "diffusion model", "transformer", "random forest", "MLP"…) because the architecture categories are
  matched on these words. For reviews, datasets and benchmarks describe the scope or what the resource contains,
  and start with "Review…", "Benchmark dataset…", etc.; for non-ML methods say so.
- **data**: training and evaluation data, with product names when known ("ERA5 0.25°, 1979–2017 training; 2018
  test", "CMIP6", "MRMS radar", "GOES-16", "IFS HRES analyses", "Lorenz-96"). Product names drive the
  data-source categories.
- **result**: the main quantitative or qualitative finding, with numbers when the abstract or reliable knowledge
  gives them.
- **open_work**: next steps or open questions, stated by the authors or following naturally.
- **issues**: limitations and caveats (smoothing at long leads, no uncertainty, trained on reanalysis so inherits
  its biases, idealized setting, instability when coupled online, evaluation against its own analysis, few
  extreme events, offline-only tests…).
- **basis**: `abstract` (everything derivable from the abstract), `abstract+knowledge` (you also used reliable
  knowledge of this exact paper), or `assessment` (open_work/issues are your own reviewer-style assessment, or
  the abstract is missing and you do not know the paper). Choose honestly.

## Rules

- Do not invent specifics. Use your own knowledge of a paper only when you are confident it is that exact paper.
  If a detail is unknown, write a careful general statement or "Not reported in the abstract." instead of
  guessing numbers, resolutions or datasets.
- If the abstract is null and you do not know the paper, keep fields brief, say what the title implies, and set
  basis to `assessment`.
- Validate the file: `python3 -c "import json;d=json.load(open('<path>'));print(len(d))"` must print the number
  of input papers.
- Report the papers you were unsure about (id + title + which detail), so they can be spot-checked.
