# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 572 papers (1998–2026), not a census of the field. It over-represents landmark and highly cited work. Recent years are covered (2025: 124, 2026: 56 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 13% of architecture tags in 2019–20 and 62% in 2025–26. CNN/U-Net went from 35% to 15% over the same periods.
2. **ERA5 and operational NWP / reforecasts are the main data sources, on par.** ERA5 appears in 8 papers in 2019–20 and 45 in 2025–26, where it is used by 28% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 17 papers in 2021–22 to 6 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 27% (≤2018), 32% (2019–20), 39% (2021–22), 44% (2023–24), 48% (2025–26).
4. **Goals have shifted.** Medium-range weather forecasting is the most common goal overall (149 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+23 pts), Benchmarking, evaluation & feasibility (+5 pts), Climate emulation & projection (+5 pts); the largest declines are Process understanding & discovery (-5 pts), Parameterization & physics emulation (-8 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: Medium-range weather: Graph & operator nets (37 of 75 papers); Parameterization & hybrid models: MLP / generic NN (40 of 56 papers); Extremes & tropical cyclones: CNN / U-Net (19 of 50 papers); Ocean: MLP / generic NN (17 of 43 papers); Climate emulation & detection: MLP / generic NN (13 of 43 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (26 of 41 papers); S2S, ENSO & MJO: MLP / generic NN (14 of 41 papers); Downscaling: Generative (diffusion/GAN/VAE) (23 of 37 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: CNN / U-Net: Coarse resolution or few variables (21%); MLP / generic NN: Limited evaluation (17%); Generative (diffusion/GAN/VAE): Depends on reanalysis / NWP analyses (22%); Transformers: Smoothing, blurring or weak extremes (31%); Graph & operator nets: Depends on reanalysis / NWP analyses (30%); Classical ML: Coarse resolution or few variables (16%); RNN / LSTM: Smoothing, blurring or weak extremes (34%). The most common open problems across all papers are Probabilistic forecasts & uncertainty (108), More variables & Earth-system components (106), Operational use (78).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Transformers 53 (n=23), RNN / LSTM 24 (n=26), Graph & operator nets 23 (n=28), CNN / U-Net 22 (n=87), Generative (diffusion/GAN/VAE) 21 (n=50), Classical ML 18 (n=51), MLP / generic NN 15 (n=74). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2025 (124 papers) and 2024 (75).

### Model families
![Model families](figures/02_architecture_families.png)

CNN is the most common family (109 papers), followed by Neural network (unspecified) (83) and Transformer (70). "Neural network (unspecified)" (83) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (56), data-assimilation schemes (21), XAI methods (20) and physics-informed constraints (20).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 55 | 24% | 33% | 13% | 20% | 11% | 0% | 0% |
| 2019–20 | 120 | 35% | 20% | 11% | 21% | 8% | 2% | 2% |
| 2021–22 | 90 | 30% | 27% | 8% | 17% | 11% | 4% | 3% |
| 2023–24 | 123 | 15% | 16% | 2% | 6% | 24% | 15% | 20% |
| 2025–26 | 195 | 15% | 17% | 3% | 3% | 20% | 23% | 19% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 12, 17, 22, 24, 21 papers across the periods (≤2018, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (3, 7, 13, 27, 47), because ML weather models are verified against and fine-tuned on operational analyses.

### Research goals over time
![Goals by period](figures/09_goals_by_period.png)

### Architecture by subfield
![Architecture by subfield](figures/05_architecture_by_subfield.png)

### Limitations by architecture
![Limitations by architecture](figures/10_limitations_by_architecture.png)

Each cell is the share of a group's papers whose summary reports that limitation. Limitations come from the summaries, and many are an editorial assessment rather than the authors' own statement.

### Citation rate by architecture
![Citations by architecture](figures/06_citations_by_architecture.png)

Method papers from 2018 to 2024. Citations per year are total citations divided by years since publication (minimum one year); more recent papers are left out because they have not had time to be cited. Compare medians, not means.

### Probabilistic output
![Probabilistic share](figures/07_probabilistic_share.png)

### Venues
![Venue families](figures/08_venue_families.png)

The main homes of the catalog's papers are AGU journals (140), Nature & Science (88), AMS journals (76). ML conferences account for 42 papers, and 73 exist only on arXiv.

## Categories

| Dimension | Values | Where it comes from |
|---|---|---|
| `paper_type` | method, review, dataset_benchmark, evaluation | summary architecture/goal text and title |
| model family (`paper_architecture`, `tag_kind = 'model_family'`) | CNN, U-Net, RNN/LSTM, MLP, Transformer, GNN, neural operator, diffusion, GAN, VAE/flow/autoencoder, tree ensemble, kernel/GP/SVM, linear/statistical, reservoir computing, clustering, equation discovery, neural network (unspecified) | summary architecture field and title |
| approach (`tag_kind = 'approach'`) | hybrid physics-ML, physics-informed constraints, causal/XAI, data-assimilation scheme | same |
| `arch_group` | 7 coarse groups used in trend plots | mapping in `scripts/taxonomy.py` |
| data source (`paper_data_source`) | ERA5, other/unspecified reanalysis, CMIP/climate models, km-scale simulations, idealized models, operational NWP, radar, satellite, stations/in situ, ocean/sea-ice products, scheme output, generic PDE benchmarks | summary data field |
| goal (`paper_task`) | research goals, e.g. medium-range forecasting, parameterization, downscaling, detection & attribution | summary goal field and title |
| limitation (`paper_issue_theme`) | recurring limitation themes, e.g. idealized setting, reanalysis dependence, blurring, no uncertainty, instability | summary issues field |
| open problem (`paper_open_theme`) | research-agenda themes, e.g. probabilistic forecasts, operational use, online coupling, learning from observations | summary open-work field |
| `probabilistic` | true/false | summary architecture/goal/result and title |
| `venue_family` | publisher/community groups | venue string |
| period | ≤2018, 2019–20, 2021–22, 2023–24, 2025–26 | `PERIODS` in `scripts/taxonomy.py` |

**Fixing a category.** For one paper, add a row to `data/category_overrides.csv` (`paper_id,dimension,label,action,note`, where action is `add`, `remove` or `set`). For a systematic problem, edit the regex in `scripts/taxonomy.py`. Then rerun `python3 scripts/build_db.py && python3 analysis/eda.py`. 3 manual corrections are applied.

**Known limitations.** The rules can only see what the summaries say. 129 summaries are partly editorial assessments, and 40 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
