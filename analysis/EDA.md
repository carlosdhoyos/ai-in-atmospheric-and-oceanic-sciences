# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 1366 papers (1995–2026), not a census of the field. It over-represents landmark and highly cited work. Recent years are covered (2025: 189, 2026: 100 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 12% of architecture tags in 2019–20 and 49% in 2025–26. CNN/U-Net went from 27% to 14% over the same periods.
2. **Operational NWP / reforecasts is now the most common data source, ahead of ERA5.** ERA5 appears in 8 papers in 2019–20 and 53 in 2025–26, where it is used by 20% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 17 papers in 2021–22 to 8 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 15% (≤2018), 25% (2019–20), 24% (2021–22), 32% (2023–24), 39% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (341 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+19 pts), Benchmarking, evaluation & feasibility (+6 pts), Climate emulation & projection (+5 pts); the largest declines are Hydrological prediction (-3 pts), Parameterization & physics emulation (-3 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: Hydrology & water resources: RNN / LSTM (118 of 302 papers); Extremes & tropical cyclones: CNN / U-Net (36 of 142 papers); Medium-range weather: Graph & operator nets (41 of 95 papers); Parameterization & hybrid models: MLP / generic NN (73 of 94 papers); Climate emulation & detection: MLP / generic NN (34 of 88 papers); S2S, ENSO & MJO: MLP / generic NN (32 of 84 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (45 of 81 papers); Downscaling: Generative (diffusion/GAN/VAE) (28 of 69 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (10%); CNN / U-Net: Depends on reanalysis / NWP analyses (16%); RNN / LSTM: Limited evaluation (14%); Classical ML: Generalization / out-of-distribution (15%); Generative (diffusion/GAN/VAE): Depends on reanalysis / NWP analyses (17%); Transformers: Limited evaluation (20%); Graph & operator nets: Depends on reanalysis / NWP analyses (26%). The most common open problems across all papers are Probabilistic forecasts & uncertainty (153), Generalization & transfer (151), More variables & Earth-system components (124).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Graph & operator nets 23 (n=44), Transformers 21 (n=56), RNN / LSTM 20 (n=128), CNN / U-Net 18 (n=154), Classical ML 17 (n=102), Generative (diffusion/GAN/VAE) 16 (n=86), MLP / generic NN 14 (n=228). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2025 (189 papers) and 2020 (174).

### Model families
![Model families](figures/02_architecture_families.png)

Neural network (unspecified) is the most common family (251 papers), followed by CNN (197) and RNN / LSTM (180). "Neural network (unspecified)" (251) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (133), data-assimilation schemes (27), XAI methods (50) and physics-informed constraints (44).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 147 | 14% | 47% | 11% | 23% | 5% | 0% | 0% |
| 2019–20 | 268 | 27% | 29% | 16% | 17% | 7% | 3% | 1% |
| 2021–22 | 241 | 22% | 29% | 22% | 12% | 6% | 5% | 4% |
| 2023–24 | 295 | 13% | 23% | 12% | 8% | 18% | 14% | 12% |
| 2025–26 | 302 | 14% | 18% | 11% | 8% | 15% | 20% | 14% |

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

The main homes of the catalog's papers are AGU journals (290), arXiv preprint (158), EGU / Copernicus journals (134). ML conferences account for 75 papers, and 158 exist only on arXiv.

## Journals

Venues with at least 5 papers in the catalog, ranked by **impact index**: the median, over a venue's papers, of
citations per year relative to the median for catalog papers from the same year (1 = typical). **Top 10%** is the
share of its papers among the most cited for their year. These describe each venue's papers in this catalog, not
the journal as a whole, and are not the Journal Impact Factor. The interactive version, with filters, trends and
each venue's most influential papers, is [`journals.html`](../journals.html).

| Venue | Group | Papers | Impact index | Top 10% | Median cites/yr | Tier |
|---|---|---:|---:|---:|---:|---|
| Nature | Nature & Science | 15 | 12.06 | 80% | 176.4 | Leading |
| ICML | ML conferences | 9 | 4.17 | 56% | 38.0 | Leading |
| Nature Climate Change | Nature & Science | 5 | 3.50 | 40% | 35.2 | Leading |
| ICLR | ML conferences | 6 | 3.02 | 50% | 45.4 | Leading |
| Communications Earth & Environment | Nature & Science | 6 | 2.83 | 33% | 24.0 | Leading |
| Nature Machine Intelligence | Nature & Science | 6 | 2.78 | 33% | 40.8 | Leading |
| PNAS | PNAS & multidisciplinary | 15 | 2.67 | 27% | 32.4 | Leading |
| Applied Energy | Energy journals | 10 | 2.63 | 20% | 47.2 | Leading |
| Nature Communications | Nature & Science | 22 | 2.49 | 32% | 34.4 | Leading |
| Renewable Energy | Energy journals | 11 | 2.07 | 9% | 27.6 | Strong |
| Atmospheric Chemistry and Physics | EGU / Copernicus journals | 6 | 1.74 | 17% | 22.9 | Strong |
| Renewable & Sustainable Energy Reviews | Energy journals | 6 | 1.52 | 17% | 21.4 | Strong |
| Journal of Hydrology | Hydrology & water journals | 56 | 1.46 | 2% | 23.4 | Strong |
| Agricultural and Forest Meteorology | Agricultural journals | 7 | 1.42 | 0% | 29.3 | Strong |
| Hydrology and Earth System Sciences | EGU / Copernicus journals | 71 | 1.42 | 13% | 18.0 | Strong |
| Environmental Modelling & Software | Other geoscience journals | 10 | 1.39 | 10% | 24.6 | Strong |
| Journal of Computational Physics | Physics & applied math | 6 | 1.37 | 17% | 22.4 | Strong |
| Geoscientific Model Development | EGU / Copernicus journals | 33 | 1.28 | 3% | 16.0 | Strong |
| CVPR | ML conferences | 6 | 1.26 | 0% | 15.7 | Strong |
| Philosophical Transactions of the Royal Society A | RMetS / Royal Society | 12 | 1.23 | 17% | 19.2 | Strong |
| npj Climate and Atmospheric Science | Nature & Science | 27 | 1.08 | 7% | 10.0 | Strong |
| Water | Hydrology & water journals | 12 | 1.07 | 25% | 18.3 | Strong |
| Geophysical Research Letters | AGU journals | 60 | 1.04 | 2% | 10.1 | Strong |
| Environmental Data Science | Other geoscience journals | 7 | 1.03 | 0% | 13.6 | Strong |
| Scientific Reports | PNAS & multidisciplinary | 11 | 1.03 | 0% | 17.1 | Strong |
| IEEE Transactions on Geoscience and Remote Sensing | IEEE & remote sensing | 8 | 1.03 | 0% | 14.8 | Strong |
| NeurIPS | ML conferences | 31 | 1.00 | 16% | 14.0 | Strong |
| Science Advances | Nature & Science | 21 | 1.00 | 19% | 12.8 | Strong |
| Water Resources Research | AGU journals | 81 | 1.00 | 9% | 11.6 | Steady |
| Climate Dynamics | Other geoscience journals | 6 | 0.97 | 0% | 10.6 | Steady |
| JGR (section not recorded) | AGU journals | 14 | 0.96 | 0% | 4.3 | Steady |
| Solar Energy | Energy journals | 10 | 0.95 | 0% | 13.7 | Steady |
| Quarterly Journal of the Royal Meteorological Society | RMetS / Royal Society | 11 | 0.92 | 9% | 9.1 | Steady |
| Journal of Applied Meteorology and Climatology | AMS journals | 6 | 0.89 | 0% | 13.8 | Steady |
| Atmosphere | MDPI & Frontiers | 7 | 0.84 | 14% | 14.3 | Steady |
| Environmental Research Letters | PNAS & multidisciplinary | 33 | 0.77 | 0% | 12.3 | Steady |
| The Cryosphere | EGU / Copernicus journals | 6 | 0.75 | 0% | 8.9 | Steady |
| Chaos | Physics & applied math | 7 | 0.75 | 0% | 12.5 | Steady |
| AAAI | ML conferences | 9 | 0.71 | 0% | 10.8 | Steady |
| Artificial Intelligence for the Earth Systems | AMS journals | 34 | 0.70 | 3% | 5.9 | Steady |
| Journal of Advances in Modeling Earth Systems | AGU journals | 110 | 0.70 | 3% | 10.0 | Steady |
| Monthly Weather Review | AMS journals | 20 | 0.68 | 0% | 10.6 | Steady |
| Bulletin of the American Meteorological Society | AMS journals | 18 | 0.63 | 6% | 9.1 | Steady |
| Journal of Hydrometeorology | AMS journals | 13 | 0.57 | 0% | 7.1 | Lower impact |
| Neural Networks | Other venues | 5 | 0.57 | 20% | 8.6 | Lower impact |
| Weather and Forecasting | AMS journals | 12 | 0.55 | 0% | 8.3 | Lower impact |
| Earth's Future | AGU journals | 13 | 0.50 | 8% | 4.0 | Lower impact |
| KDD | ML conferences | 10 | 0.44 | 0% | 8.8 | Lower impact |
| Remote Sensing | MDPI & Frontiers | 6 | 0.43 | 0% | 8.2 | Lower impact |
| Nonlinear Processes in Geophysics | EGU / Copernicus journals | 6 | 0.42 | 0% | 7.0 | Lower impact |

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

**Known limitations.** The rules can only see what the summaries say. 177 summaries are partly editorial assessments, and 189 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
