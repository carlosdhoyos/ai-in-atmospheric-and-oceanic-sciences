# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 897 papers (1998–2026), not a census of the field. It over-represents landmark and highly cited work. Recent years are covered (2025: 175, 2026: 98 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 12% of architecture tags in 2019–20 and 54% in 2025–26. CNN/U-Net went from 33% to 13% over the same periods.
2. **ERA5 and operational NWP / reforecasts are the main data sources, on par.** ERA5 appears in 8 papers in 2019–20 and 45 in 2025–26, where it is used by 17% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 17 papers in 2021–22 to 6 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 21% (≤2018), 22% (2019–20), 26% (2021–22), 30% (2023–24), 35% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (212 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+16 pts), Climate emulation & projection (+5 pts), Benchmarking, evaluation & feasibility (+3 pts); the largest declines are Process understanding & discovery (-3 pts), Parameterization & physics emulation (-5 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: Hydrology & water resources: MLP / generic NN (70 of 111 papers); Medium-range weather: Graph & operator nets (37 of 76 papers); Extremes & tropical cyclones: MLP / generic NN (23 of 76 papers); Parameterization & hybrid models: MLP / generic NN (42 of 59 papers); Climate emulation & detection: MLP / generic NN (25 of 58 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (29 of 48 papers); S2S, ENSO & MJO: MLP / generic NN (17 of 47 papers); Ocean: MLP / generic NN (17 of 43 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (9%); CNN / U-Net: Coarse resolution or few variables (19%); Generative (diffusion/GAN/VAE): Depends on reanalysis / NWP analyses (20%); Transformers: Smoothing, blurring or weak extremes (28%); Graph & operator nets: Depends on reanalysis / NWP analyses (28%); Classical ML: Coarse resolution or few variables (14%); RNN / LSTM: Smoothing, blurring or weak extremes (21%). The most common open problems across all papers are Probabilistic forecasts & uncertainty (108), More variables & Earth-system components (106), Operational use (78).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Transformers 51 (n=28), RNN / LSTM 27 (n=37), Graph & operator nets 23 (n=34), CNN / U-Net 22 (n=97), Classical ML 18 (n=57), Generative (diffusion/GAN/VAE) 16 (n=57), MLP / generic NN 16 (n=134). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2025 (175 papers) and 2024 (124).

### Model families
![Model families](figures/02_architecture_families.png)

Neural network (unspecified) is the most common family (171 papers), followed by CNN (118) and Transformer (79). "Neural network (unspecified)" (171) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (76), data-assimilation schemes (21), XAI methods (26) and physics-informed constraints (26).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 69 | 19% | 38% | 13% | 20% | 10% | 0% | 0% |
| 2019–20 | 138 | 33% | 25% | 12% | 19% | 8% | 2% | 2% |
| 2021–22 | 128 | 25% | 35% | 9% | 15% | 8% | 3% | 5% |
| 2023–24 | 171 | 12% | 29% | 4% | 5% | 21% | 14% | 16% |
| 2025–26 | 235 | 13% | 25% | 6% | 3% | 17% | 20% | 17% |

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

The main homes of the catalog's papers are AGU journals (226), arXiv preprint (105), EGU / Copernicus journals (99). ML conferences account for 59 papers, and 105 exist only on arXiv.

## Journals

Venues with at least 5 papers in the catalog, ranked by **impact index**: the median, over a venue's papers, of
citations per year relative to the median for catalog papers from the same year (1 = typical). **Top 10%** is the
share of its papers among the most cited for their year. These describe each venue's papers in this catalog, not
the journal as a whole, and are not the Journal Impact Factor. The interactive version, with filters, trends and
each venue's most influential papers, is [`journals.html`](../journals.html).

| Venue | Group | Papers | Impact index | Top 10% | Median cites/yr | Tier |
|---|---|---:|---:|---:|---:|---|
| Nature | Nature & Science | 14 | 10.96 | 79% | 177.8 | Leading |
| ICML | ML conferences | 8 | 4.46 | 62% | 39.6 | Leading |
| Nature Climate Change | Nature & Science | 5 | 3.50 | 20% | 35.2 | Leading |
| Communications Earth & Environment | Nature & Science | 6 | 2.83 | 17% | 24.0 | Strong |
| Nature Communications | Nature & Science | 17 | 2.22 | 35% | 43.7 | Leading |
| PNAS | PNAS & multidisciplinary | 14 | 2.17 | 14% | 35.4 | Strong |
| Applied Energy | Energy journals | 7 | 2.06 | 14% | 25.6 | Strong |
| Renewable Energy | Energy journals | 11 | 1.72 | 9% | 27.6 | Strong |
| Atmospheric Chemistry and Physics | EGU / Copernicus journals | 6 | 1.61 | 17% | 22.9 | Strong |
| Philosophical Transactions of the Royal Society A | RMetS / Royal Society | 8 | 1.60 | 25% | 30.4 | Leading |
| Journal of Hydrology | Hydrology & water journals | 17 | 1.37 | 0% | 20.6 | Strong |
| Hydrology and Earth System Sciences | EGU / Copernicus journals | 60 | 1.36 | 8% | 16.2 | Strong |
| Renewable & Sustainable Energy Reviews | Energy journals | 5 | 1.36 | 20% | 18.0 | Strong |
| Geoscientific Model Development | EGU / Copernicus journals | 20 | 1.22 | 5% | 16.3 | Strong |
| Geophysical Research Letters | AGU journals | 41 | 1.04 | 2% | 13.1 | Strong |
| Science Advances | Nature & Science | 16 | 1.02 | 19% | 10.1 | Strong |
| NeurIPS | ML conferences | 26 | 1.02 | 4% | 13.7 | Strong |
| Quarterly Journal of the Royal Meteorological Society | RMetS / Royal Society | 7 | 1.00 | 14% | 14.9 | Strong |
| JGR (section not recorded) | AGU journals | 12 | 1.00 | 0% | 5.7 | Strong |
| npj Climate and Atmospheric Science | Nature & Science | 22 | 0.92 | 9% | 8.3 | Steady |
| Environmental Modelling & Software | Other geoscience journals | 5 | 0.90 | 0% | 11.8 | Steady |
| Water Resources Research | AGU journals | 72 | 0.86 | 7% | 11.2 | Steady |
| Scientific Reports | PNAS & multidisciplinary | 6 | 0.86 | 0% | 15.4 | Steady |
| Monthly Weather Review | AMS journals | 12 | 0.82 | 0% | 12.3 | Steady |
| Journal of Advances in Modeling Earth Systems | AGU journals | 83 | 0.80 | 2% | 11.3 | Steady |
| IEEE Transactions on Geoscience and Remote Sensing | IEEE & remote sensing | 5 | 0.80 | 0% | 11.3 | Steady |
| Journal of Applied Meteorology and Climatology | AMS journals | 5 | 0.74 | 0% | 12.4 | Steady |
| Solar Energy | Energy journals | 7 | 0.73 | 0% | 9.8 | Steady |
| Artificial Intelligence for the Earth Systems | AMS journals | 31 | 0.67 | 3% | 5.3 | Steady |
| Environmental Research Letters | PNAS & multidisciplinary | 28 | 0.66 | 0% | 12.3 | Steady |
| The Cryosphere | EGU / Copernicus journals | 5 | 0.61 | 0% | 8.7 | Steady |
| Journal of Hydrometeorology | AMS journals | 10 | 0.54 | 0% | 6.2 | Lower impact |
| AAAI | ML conferences | 7 | 0.52 | 0% | 10.7 | Lower impact |
| Bulletin of the American Meteorological Society | AMS journals | 15 | 0.51 | 7% | 9.2 | Lower impact |
| Weather and Forecasting | AMS journals | 6 | 0.49 | 0% | 8.2 | Lower impact |
| Earth's Future | AGU journals | 12 | 0.45 | 0% | 4.0 | Lower impact |
| KDD | ML conferences | 7 | 0.31 | 0% | 5.5 | Lower impact |

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

**Known limitations.** The rules can only see what the summaries say. 129 summaries are partly editorial assessments, and 77 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
