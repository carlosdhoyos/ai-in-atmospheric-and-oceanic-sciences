# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 1792 papers (1980–2026), not a census of the field. It over-represents landmark and highly cited work. Recent years are covered (2025: 189, 2026: 100 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 11% of architecture tags in 2019–20 and 49% in 2025–26. CNN/U-Net went from 26% to 13% over the same periods.
2. **Operational NWP / reforecasts is now the most common data source, ahead of ERA5.** ERA5 appears in 13 papers in 2019–20 and 54 in 2025–26, where it is used by 20% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 32 papers in 2021–22 to 9 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 11% (≤2018), 34% (2019–20), 33% (2021–22), 38% (2023–24), 40% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (451 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+17 pts), Benchmarking, evaluation & feasibility (+5 pts), Climate emulation & projection (+5 pts); the largest declines are Hydrological prediction (-3 pts), Parameterization & physics emulation (-4 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: Hydrology & water resources: MLP / generic NN (174 of 414 papers); Extremes & tropical cyclones: MLP / generic NN (54 of 194 papers); Remote sensing & clouds: MLP / generic NN (102 of 159 papers); Medium-range weather: Transformers (48 of 141 papers); Parameterization & hybrid models: MLP / generic NN (80 of 118 papers); Climate emulation & detection: MLP / generic NN (46 of 117 papers); S2S, ENSO & MJO: MLP / generic NN (38 of 100 papers); Ocean: MLP / generic NN (55 of 94 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (17%); CNN / U-Net: Limited evaluation (18%); Classical ML: Limited evaluation (16%); RNN / LSTM: Limited evaluation (20%); Generative (diffusion/GAN/VAE): Limited evaluation (22%); Transformers: Depends on reanalysis / NWP analyses (24%); Graph & operator nets: Depends on reanalysis / NWP analyses (27%). The most common open problems across all papers are Generalization & transfer (246), Operational use (241), Probabilistic forecasts & uncertainty (228).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Graph & operator nets 20 (n=50), RNN / LSTM 19 (n=178), Transformers 17 (n=69), Classical ML 16 (n=145), Generative (diffusion/GAN/VAE) 15 (n=104), CNN / U-Net 15 (n=208), MLP / generic NN 14 (n=209). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2025 (189 papers) and 2020 (174).

### Model families
![Model families](figures/02_architecture_families.png)

Neural network (unspecified) is the most common family (296 papers), followed by MLP (289) and CNN (257). "Neural network (unspecified)" (296) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (157), data-assimilation schemes (35), XAI methods (50) and physics-informed constraints (53).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 504 | 5% | 65% | 6% | 22% | 2% | 0% | 0% |
| 2019–20 | 353 | 26% | 22% | 20% | 20% | 7% | 3% | 1% |
| 2021–22 | 286 | 24% | 22% | 23% | 14% | 7% | 5% | 4% |
| 2023–24 | 347 | 16% | 18% | 12% | 9% | 17% | 16% | 12% |
| 2025–26 | 306 | 13% | 18% | 11% | 8% | 15% | 20% | 15% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 26, 27, 35, 47, 34 papers across the periods (≤2018, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (15, 15, 24, 48, 64), because ML weather models are verified against and fine-tuned on operational analyses.

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

The main homes of the catalog's papers are Other venues (344), AGU journals (315), arXiv preprint (159). ML conferences account for 81 papers, and 159 exist only on arXiv.

## Journals

Venues with at least 5 papers in the catalog, ranked by **impact index**: the median, over a venue's papers, of
citations per year relative to the median for catalog papers from the same year (1 = typical). **Top 10%** is the
share of its papers among the most cited for their year. These describe each venue's papers in this catalog, not
the journal as a whole, and are not the Journal Impact Factor. The interactive version, with filters, trends and
each venue's most influential papers, is [`journals.html`](../journals.html).

| Venue | Group | Papers | Impact index | Top 10% | Median cites/yr | Tier |
|---|---|---:|---:|---:|---:|---|
| Nature | Nature & Science | 15 | 12.06 | 80% | 176.4 | Leading |
| IEEE Transactions on Power Systems | Energy journals | 15 | 6.31 | 60% | 7.7 | Leading |
| IEEE Trans. Neural Networks | IEEE & remote sensing | 5 | 5.25 | 60% | 6.6 | Leading |
| Journal of Water Resources Planning and Management | Other venues | 5 | 5.00 | 60% | 6.0 | Leading |
| ICML | ML conferences | 9 | 4.17 | 44% | 38.0 | Leading |
| Hydrological Sciences Journal-journal Des Sciences Hydrologiques | Hydrology & water journals | 8 | 3.92 | 38% | 5.5 | Leading |
| Nature Climate Change | Nature & Science | 5 | 3.50 | 20% | 35.2 | Leading |
| Journal of Hydrologic Engineering | Other venues | 5 | 3.31 | 20% | 17.0 | Leading |
| ICLR | ML conferences | 6 | 3.02 | 33% | 45.4 | Leading |
| Communications Earth & Environment | Nature & Science | 6 | 2.83 | 17% | 24.0 | Strong |
| Nature Machine Intelligence | Nature & Science | 6 | 2.78 | 33% | 40.8 | Leading |
| PNAS | PNAS & multidisciplinary | 15 | 2.67 | 20% | 32.4 | Leading |
| Applied Energy | Energy journals | 10 | 2.63 | 10% | 47.2 | Strong |
| Remote Sensing of Environment | IEEE & remote sensing | 5 | 2.49 | 0% | 5.8 | Strong |
| Nature Communications | Nature & Science | 22 | 2.49 | 32% | 34.4 | Leading |
| Renewable Energy | Energy journals | 13 | 2.12 | 23% | 15.9 | Leading |
| Atmospheric Chemistry and Physics | EGU / Copernicus journals | 6 | 1.74 | 17% | 22.9 | Strong |
| Agricultural and Forest Meteorology | Agricultural journals | 8 | 1.57 | 12% | 27.6 | Strong |
| Renewable & Sustainable Energy Reviews | Energy journals | 6 | 1.52 | 17% | 21.4 | Strong |
| Journal of Hydrology | Hydrology & water journals | 66 | 1.49 | 9% | 20.1 | Strong |
| Hydrology and Earth System Sciences | EGU / Copernicus journals | 72 | 1.42 | 7% | 17.2 | Strong |
| Journal of Applied Meteorology and Climatology | AMS journals | 19 | 1.40 | 26% | 4.3 | Strong |
| Environmental Modelling & Software | Other geoscience journals | 10 | 1.39 | 0% | 24.6 | Strong |
| Journal of Climate | AMS journals | 12 | 1.39 | 8% | 4.4 | Strong |
| Journal of Computational Physics | Physics & applied math | 6 | 1.37 | 17% | 22.4 | Strong |
| Geoscientific Model Development | EGU / Copernicus journals | 33 | 1.28 | 3% | 16.0 | Strong |
| CVPR | ML conferences | 6 | 1.26 | 0% | 15.7 | Strong |
| Philosophical Transactions of the Royal Society A | RMetS / Royal Society | 12 | 1.23 | 17% | 19.2 | Strong |
| Ecological Modelling | Other venues | 5 | 1.22 | 0% | 2.4 | Strong |
| IEEE Transactions on Geoscience and Remote Sensing | IEEE & remote sensing | 25 | 1.15 | 12% | 2.8 | Strong |
| Solar Energy | Energy journals | 12 | 1.14 | 8% | 12.4 | Strong |
| npj Climate and Atmospheric Science | Nature & Science | 27 | 1.08 | 4% | 10.0 | Strong |
| Water | Hydrology & water journals | 12 | 1.07 | 25% | 18.3 | Strong |
| Geophysical Research Letters | AGU journals | 62 | 1.04 | 2% | 9.7 | Strong |
| Environmental Data Science | Other geoscience journals | 7 | 1.03 | 0% | 13.6 | Strong |
| Scientific Reports | PNAS & multidisciplinary | 11 | 1.03 | 0% | 17.1 | Strong |
| Climate Dynamics | Other geoscience journals | 10 | 1.02 | 10% | 6.7 | Strong |
| NeurIPS | ML conferences | 36 | 1.00 | 8% | 12.0 | Strong |
| Water Resources Research | AGU journals | 95 | 1.00 | 14% | 11.1 | Strong |
| JGR (section not recorded) | AGU journals | 23 | 1.00 | 9% | 3.0 | Strong |
| Science Advances | Nature & Science | 21 | 1.00 | 19% | 12.8 | Strong |
| Quarterly Journal of the Royal Meteorological Society | RMetS / Royal Society | 11 | 0.92 | 9% | 9.1 | Steady |
| Transactions of the ASABE | Other venues | 5 | 0.89 | 0% | 1.0 | Steady |
| Computers and Electronics in Agriculture | Agricultural journals | 5 | 0.86 | 20% | 19.4 | Steady |
| Atmosphere | MDPI & Frontiers | 7 | 0.84 | 14% | 14.3 | Steady |
| Environmental Research Letters | PNAS & multidisciplinary | 33 | 0.77 | 0% | 12.3 | Steady |
| The Cryosphere | EGU / Copernicus journals | 6 | 0.75 | 0% | 8.9 | Steady |
| Chaos | Physics & applied math | 7 | 0.75 | 0% | 12.5 | Steady |
| International Journal of Remote Sensing | Other venues | 16 | 0.74 | 6% | 1.1 | Steady |
| Weather and Forecasting | AMS journals | 22 | 0.73 | 0% | 3.4 | Steady |
| AAAI | ML conferences | 9 | 0.71 | 0% | 10.8 | Steady |
| Preprint | Other venues | 26 | 0.71 | 8% | 0.5 | Steady |
| Artificial Intelligence for the Earth Systems | AMS journals | 34 | 0.70 | 0% | 5.9 | Steady |
| Journal of Advances in Modeling Earth Systems | AGU journals | 110 | 0.70 | 2% | 10.0 | Steady |
| Monthly Weather Review | AMS journals | 21 | 0.68 | 0% | 10.5 | Steady |
| IEEE International Geoscience and Remote Sensing Symposium | IEEE & remote sensing | 6 | 0.64 | 0% | 0.7 | Steady |
| Bulletin of the American Meteorological Society | AMS journals | 19 | 0.63 | 11% | 8.9 | Steady |
| Journal of Hydrometeorology | AMS journals | 13 | 0.57 | 0% | 7.1 | Lower impact |
| Neural Networks | Other venues | 5 | 0.57 | 0% | 8.6 | Lower impact |
| Journal of Atmospheric and Oceanic Technology | AMS journals | 6 | 0.54 | 0% | 0.4 | Lower impact |
| Earth's Future | AGU journals | 13 | 0.50 | 8% | 4.0 | Lower impact |
| Remote Sensing | MDPI & Frontiers | 6 | 0.43 | 0% | 8.2 | Lower impact |
| Nonlinear Processes in Geophysics | EGU / Copernicus journals | 6 | 0.42 | 0% | 7.0 | Lower impact |
| KDD | ML conferences | 11 | 0.38 | 0% | 7.2 | Lower impact |
| IGARSS '98. Sensing and Managing the Environment. 1998 IEEE International Geoscience and Remote Sensing. Symposium Proceedings. (Cat. No.98CH36174) | IEEE & remote sensing | 7 | 0.17 | 0% | 0.4 | Lower impact |

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

**Known limitations.** The rules can only see what the summaries say. 571 summaries are partly editorial assessments, and 596 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
