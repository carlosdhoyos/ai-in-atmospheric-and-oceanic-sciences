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

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 13% of architecture tags in 2019–20 and 41% in 2025–26. CNN/U-Net went from 35% to 6% over the same periods.
2. **ERA5 is the default training set.** It appears in 8 papers in 2019–20 and 5 in 2025–26, where it is used by 3% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 17 papers in 2021–22 to 0 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 27% (≤2018), 32% (2019–20), 39% (2021–22), 42% (2023–24), 21% (2025–26).
4. **Goals have shifted.** Medium-range weather forecasting is the most common goal overall (124 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+16 pts), Ocean & sea-ice prediction (+3 pts), Climate emulation & projection (+2 pts); the largest declines are Benchmarking, evaluation & feasibility (-9 pts), Parameterization & physics emulation (-9 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: Parameterization & hybrid models: MLP / generic NN (28 of 41 papers); Extremes & tropical cyclones: CNN / U-Net (16 of 33 papers); Medium-range weather: Transformers (10 of 31 papers); S2S, ENSO & MJO: MLP / generic NN (18 of 31 papers); Downscaling: Generative (diffusion/GAN/VAE) (17 of 30 papers); Ocean: MLP / generic NN (13 of 28 papers); Climate emulation & detection: MLP / generic NN (12 of 26 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (12 of 22 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (13%); CNN / U-Net: Coarse resolution or few variables (23%); Generative (diffusion/GAN/VAE): Coarse resolution or few variables (19%); Classical ML: Generalization / out-of-distribution (18%); Transformers: Depends on reanalysis / NWP analyses (33%); RNN / LSTM: Smoothing, blurring or weak extremes (28%); Graph & operator nets: Depends on reanalysis / NWP analyses (43%). The most common open problems across all papers are Probabilistic forecasts & uncertainty (68), More variables & Earth-system components (65), Generalization & transfer (51).
7. **Citation rates follow the architecture shift, led by a few flagship models.** Since 2018, median citations per year for method papers: Transformers 49 (n=29), Graph & operator nets 47 (n=26), RNN / LSTM 27 (n=25), CNN / U-Net 22 (n=86), Classical ML 19 (n=50), Generative (diffusion/GAN/VAE) 16 (n=57), MLP / generic NN 12 (n=97). The interquartile ranges are wide and overlap.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2025 (124 papers) and 2024 (75).

### Model families
![Model families](figures/02_architecture_families.png)

Neural network (unspecified) is the most common family (89 papers), followed by CNN (85) and Transformer (30). "Neural network (unspecified)" (89) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (42), data-assimilation schemes (17), XAI methods (19) and physics-informed constraints (14).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 55 | 24% | 33% | 13% | 20% | 11% | 0% | 0% |
| 2019–20 | 120 | 35% | 20% | 11% | 21% | 8% | 2% | 2% |
| 2021–22 | 90 | 30% | 27% | 8% | 17% | 11% | 4% | 3% |
| 2023–24 | 102 | 13% | 21% | 2% | 5% | 26% | 15% | 19% |
| 2025–26 | 51 | 6% | 51% | 0% | 2% | 20% | 16% | 6% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 12, 17, 22, 18, 2 papers across the periods (≤2018, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (3, 7, 13, 23, 3), because ML weather models are verified against and fine-tuned on operational analyses.

### Research goals over time
![Goals by period](figures/09_goals_by_period.png)

### Architecture by subfield
![Architecture by subfield](figures/05_architecture_by_subfield.png)

### Limitations by architecture
![Limitations by architecture](figures/10_limitations_by_architecture.png)

Each cell is the share of a group's papers whose summary reports that limitation. Limitations come from the summaries, and many are an editorial assessment rather than the authors' own statement.

### Citation rate by architecture
![Citations by architecture](figures/06_citations_by_architecture.png)

Citations per year are total citations divided by years since publication (minimum one year). This favours recent landmark papers. Compare medians, not means.

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

**Known limitations.** The rules can only see what the summaries say. 104 summaries are partly editorial assessments, and 40 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
