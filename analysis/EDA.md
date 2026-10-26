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

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 11% of architecture tags in 2019–20 and 49% in 2025–26. CNN/U-Net went from 29% to 14% over the same periods.
2. **Operational NWP / reforecasts is now the most common data source, ahead of ERA5.** ERA5 appears in 9 papers in 2019–20 and 53 in 2025–26, where it is used by 21% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 17 papers in 2021–22 to 8 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 23% (≤2018), 29% (2019–20), 32% (2021–22), 35% (2023–24), 40% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (222 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+17 pts), Climate emulation & projection (+4 pts), Subseasonal to decadal prediction (+3 pts); the largest declines are Agricultural prediction (-2 pts), Parameterization & physics emulation (-5 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: Hydrology & water resources: RNN / LSTM (90 of 200 papers); Extremes & tropical cyclones: CNN / U-Net (32 of 100 papers); Medium-range weather: Graph & operator nets (38 of 78 papers); Climate emulation & detection: MLP / generic NN (26 of 73 papers); Parameterization & hybrid models: MLP / generic NN (49 of 68 papers); S2S, ENSO & MJO: MLP / generic NN (18 of 59 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (31 of 51 papers); Weather & climate for energy: MLP / generic NN (22 of 43 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (16%); CNN / U-Net: Depends on reanalysis / NWP analyses (19%); RNN / LSTM: Limited evaluation (17%); Classical ML: Generalization / out-of-distribution (18%); Generative (diffusion/GAN/VAE): Depends on reanalysis / NWP analyses (21%); Transformers: Depends on reanalysis / NWP analyses (24%); Graph & operator nets: Depends on reanalysis / NWP analyses (29%). The most common open problems across all papers are Probabilistic forecasts & uncertainty (153), Generalization & transfer (151), More variables & Earth-system components (124).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Transformers 31 (n=37), Graph & operator nets 21 (n=38), CNN / U-Net 20 (n=123), RNN / LSTM 20 (n=94), Classical ML 17 (n=90), Generative (diffusion/GAN/VAE) 17 (n=61), MLP / generic NN 16 (n=123). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2025 (175 papers) and 2024 (124).

### Model families
![Model families](figures/02_architecture_families.png)

CNN is the most common family (161 papers), followed by RNN / LSTM (143) and Neural network (unspecified) (121). "Neural network (unspecified)" (121) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (108), data-assimilation schemes (22), XAI methods (38) and physics-informed constraints (34).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 81 | 17% | 37% | 14% | 23% | 9% | 0% | 0% |
| 2019–20 | 182 | 29% | 20% | 18% | 22% | 7% | 3% | 2% |
| 2021–22 | 167 | 26% | 21% | 23% | 16% | 6% | 3% | 5% |
| 2023–24 | 234 | 15% | 20% | 12% | 10% | 17% | 14% | 13% |
| 2025–26 | 297 | 14% | 19% | 11% | 8% | 15% | 20% | 14% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 13, 18, 25, 30, 31 papers across the periods (≤2018, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (5, 8, 18, 34, 61), because ML weather models are verified against and fine-tuned on operational analyses.

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
| NeurIPS | ML conferences | 26 | 1.02 | 4% | 13.7 | Strong |
| Science Advances | Nature & Science | 16 | 1.02 | 19% | 10.1 | Strong |
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

**Known limitations.** The rules can only see what the summaries say. 177 summaries are partly editorial assessments, and 77 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
