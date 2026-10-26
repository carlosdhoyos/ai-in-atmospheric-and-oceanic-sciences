# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 2849 papers (1980–2026), not a census of the field. The analysis below uses its core set of 1578 papers: hand-picked landmark papers plus, in every publication year, the papers cited at or above that year's median rate. Searches reached different depths in different decades, and the core set makes periods comparable. It over-represents landmark and highly cited work. Recent years are covered (2025: 102, 2026: 59 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 10% of architecture tags in 2019–20 and 57% in 2025–26. CNN/U-Net went from 26% to 14% over the same periods.
2. **ERA5 and operational NWP / reforecasts are the main data sources, on par.** ERA5 appears in 8 papers in 2019–20 and 36 in 2025–26, where it is used by 26% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 18 papers in 2021–22 to 6 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 5% (≤1999), 12% (2000–09), 24% (2010–18), 27% (2019–20), 27% (2021–22), 43% (2023–24), 46% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (489 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+23 pts), Climate emulation & projection (+5 pts), Data assimilation & state estimation (+3 pts); the largest declines are Parameterization & physics emulation (-7 pts), Hydrological prediction (-8 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield among papers since 2019: Hydrology & water resources: RNN / LSTM (95 of 161 papers); Extremes & tropical cyclones: RNN / LSTM (26 of 82 papers); Medium-range weather: Transformers (34 of 72 papers); Climate emulation & detection: MLP / generic NN (16 of 49 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (34 of 46 papers); Parameterization & hybrid models: MLP / generic NN (31 of 44 papers); Downscaling: Generative (diffusion/GAN/VAE) (24 of 39 papers); S2S, ENSO & MJO: CNN / U-Net (11 of 34 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (17%); Classical ML: Limited evaluation (15%); RNN / LSTM: Limited evaluation (22%); CNN / U-Net: No or poorly calibrated uncertainty (19%); Generative (diffusion/GAN/VAE): Depends on reanalysis / NWP analyses (25%); Expert systems & fuzzy logic: Limited evaluation (14%); Transformers: Depends on reanalysis / NWP analyses (26%); Graph & operator nets: Depends on reanalysis / NWP analyses (29%). The most common open problems across all papers are Longer lead times (225), Generalization & transfer (221), Probabilistic forecasts & uncertainty (203).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Transformers 45 (n=41), RNN / LSTM 30 (n=116), Graph & operator nets 27 (n=37), Classical ML 25 (n=81), CNN / U-Net 24 (n=120), Generative (diffusion/GAN/VAE) 22 (n=66), MLP / generic NN 21 (n=125). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.
8. **Machine learning in these fields is older than deep learning.** The catalog has 778 papers from before 2010, starting with 1980 expert systems and pattern-recognition studies. Their methods were mostly MLP / generic NN (479), Classical ML (234), Expert systems & fuzzy logic (98), RNN / LSTM (34), applied above all to hydrology & water resources (347), remote sensing & clouds (132), weather & climate for energy (125). Many questions now revisited with deep learning (rainfall–runoff, satellite retrievals, emulating model physics, ENSO prediction) were first posed with these shallow models.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2020 (109 papers) and 2021 (108).

### Model families
![Model families](figures/02_architecture_families.png)

MLP is the most common family (399 papers), followed by Neural network (unspecified) (249) and RNN / LSTM (187). "Neural network (unspecified)" (249) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (111), data-assimilation schemes (13), XAI methods (26) and physics-informed constraints (36).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator | Expert & fuzzy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤1999 | 231 | 0% | 60% | 1% | 24% | 0% | 0% | 0% | 15% |
| 2000–09 | 615 | 0% | 55% | 5% | 29% | 0% | 0% | 0% | 10% |
| 2010–18 | 98 | 15% | 29% | 15% | 32% | 8% | 0% | 0% | 1% |
| 2019–20 | 219 | 26% | 20% | 22% | 22% | 6% | 2% | 1% | 0% |
| 2021–22 | 187 | 22% | 24% | 25% | 12% | 8% | 5% | 5% | 0% |
| 2023–24 | 197 | 15% | 16% | 12% | 5% | 20% | 17% | 15% | 0% |
| 2025–26 | 164 | 14% | 13% | 12% | 4% | 18% | 21% | 18% | 0% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 2, 12, 11, 17, 24, 25, 18 papers across the periods (≤1999, 2000–09, 2010–18, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (1, 5, 3, 6, 15, 33, 39), because ML weather models are verified against and fine-tuned on operational analyses.

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

The main homes of the catalog's papers are Hydrology & water journals (270), AGU journals (212), AMS journals (118). ML conferences account for 56 papers, and 83 exist only on arXiv.

## Journals

Venues with at least 5 papers in the catalog, ranked by **impact index**: the median, over a venue's papers, of
citations per year relative to the median for catalog papers from the same year (1 = typical). **Top 10%** is the
share of its papers among the most cited for their year. These describe each venue's papers in this catalog, not
the journal as a whole, and are not the Journal Impact Factor. The interactive version, with filters, trends and
each venue's most influential papers, is [`journals.html`](../journals.html).

| Venue | Group | Papers | Impact index | Top 10% | Median cites/yr | Tier |
|---|---|---:|---:|---:|---:|---|
| Nature | Nature & Science | 13 | 7.88 | 85% | 179.1 | Leading |
| ICML | ML conferences | 8 | 2.81 | 38% | 39.6 | Leading |
| Nature Machine Intelligence | Nature & Science | 5 | 2.16 | 20% | 52.4 | Leading |
| IEEE Transactions on Power Systems | Energy journals | 20 | 2.09 | 40% | 8.1 | Leading |
| ICLR | ML conferences | 6 | 1.78 | 33% | 45.4 | Leading |
| IEEE Trans. Neural Networks | IEEE & remote sensing | 5 | 1.78 | 40% | 6.6 | Leading |
| Nature Communications | Nature & Science | 19 | 1.73 | 26% | 43.7 | Leading |
| PNAS | PNAS & multidisciplinary | 13 | 1.69 | 15% | 38.4 | Strong |
| Communications Earth & Environment | Nature & Science | 5 | 1.68 | 20% | 26.7 | Leading |
| Water | Hydrology & water journals | 8 | 1.66 | 25% | 47.1 | Leading |
| Agricultural Water Management | Agricultural journals | 5 | 1.60 | 0% | 14.0 | Strong |
| Hydrological Sciences Journal-journal Des Sciences Hydrologiques | Hydrology & water journals | 8 | 1.51 | 25% | 5.5 | Leading |
| Applied Energy | Energy journals | 14 | 1.51 | 7% | 23.2 | Strong |
| Journal of Irrigation and Drainage Engineering-asce | Hydrology & water journals | 7 | 1.47 | 14% | 9.8 | Strong |
| Expert systems with applications | Soft computing & engineering | 5 | 1.46 | 0% | 10.5 | Strong |
| Renewable Energy | Energy journals | 28 | 1.44 | 4% | 12.4 | Strong |
| Science Advances | Nature & Science | 12 | 1.42 | 17% | 23.9 | Strong |
| Nature Climate Change | Nature & Science | 5 | 1.40 | 20% | 35.2 | Strong |
| Advances in Water Resources | Hydrology & water journals | 6 | 1.38 | 0% | 16.5 | Strong |
| Agricultural and Forest Meteorology | Agricultural journals | 6 | 1.37 | 0% | 30.1 | Strong |
| Energy Conversion and Management | Energy journals | 8 | 1.32 | 12% | 10.3 | Strong |
| Journal of Water Resources Planning and Management | Hydrology & water journals | 9 | 1.32 | 22% | 6.0 | Strong |
| International Journal of Climatology | RMetS / Royal Society | 8 | 1.23 | 12% | 9.6 | Strong |
| Atmospheric Environment | Other geoscience journals | 11 | 1.22 | 18% | 9.4 | Strong |
| Water Resources Management | Hydrology & water journals | 14 | 1.21 | 0% | 8.5 | Strong |
| Journal of Hydrologic Engineering | Hydrology & water journals | 29 | 1.20 | 14% | 8.3 | Strong |
| Atmospheric Chemistry and Physics | EGU / Copernicus journals | 5 | 1.18 | 20% | 24.7 | Strong |
| Solar Energy | Energy journals | 16 | 1.17 | 6% | 13.0 | Strong |
| Engineering applications of artificial intelligence | Soft computing & engineering | 6 | 1.17 | 0% | 9.5 | Strong |
| JAWRA Journal of the American Water Resources Association | Hydrology & water journals | 6 | 1.15 | 0% | 6.7 | Strong |
| Philosophical Transactions of the Royal Society A | RMetS / Royal Society | 9 | 1.13 | 22% | 27.4 | Strong |
| Energy | Energy journals | 7 | 1.12 | 0% | 8.9 | Strong |
| Journal of Atmospheric and Oceanic Technology | AMS journals | 12 | 1.11 | 0% | 8.2 | Strong |
| Environmental Research Letters | PNAS & multidisciplinary | 11 | 1.07 | 0% | 26.0 | Strong |
| Journal of Hydrology | Hydrology & water journals | 119 | 1.07 | 9% | 13.9 | Strong |
| Journal of Hydroinformatics | Hydrology & water journals | 6 | 1.07 | 0% | 9.1 | Strong |
| Ocean Engineering | Soft computing & engineering | 12 | 1.07 | 0% | 7.2 | Strong |
| Renewable & Sustainable Energy Reviews | Energy journals | 5 | 1.04 | 20% | 24.9 | Strong |
| Hydrology and Earth System Sciences | EGU / Copernicus journals | 65 | 1.04 | 6% | 20.4 | Strong |
| Water Resources Research | AGU journals | 77 | 1.03 | 16% | 15.7 | Strong |
| npj Climate and Atmospheric Science | Nature & Science | 16 | 1.01 | 6% | 19.9 | Strong |
| Environmental Modelling & Software | Other geoscience journals | 21 | 1.01 | 10% | 11.3 | Strong |
| Science of the Total Environment | Environmental science journals | 5 | 0.98 | 0% | 24.4 | Steady |
| Geoscientific Model Development | EGU / Copernicus journals | 24 | 0.98 | 0% | 17.9 | Steady |
| Hydrological Sciences Journal | Hydrology & water journals | 18 | 0.96 | 6% | 6.9 | Steady |
| Journal of Computational Physics | Physics & applied math | 5 | 0.96 | 20% | 23.3 | Steady |
| Remote Sensing of Environment | IEEE & remote sensing | 8 | 0.93 | 12% | 7.3 | Steady |
| Hydrological Processes | Hydrology & water journals | 26 | 0.92 | 4% | 7.0 | Steady |
| Journal of Applied Meteorology and Climatology | AMS journals | 19 | 0.92 | 11% | 5.2 | Steady |
| AAAI | ML conferences | 6 | 0.91 | 0% | 17.4 | Steady |
| Neurocomputing | Soft computing & engineering | 10 | 0.90 | 0% | 6.9 | Steady |
| International Journal of Remote Sensing | IEEE & remote sensing | 11 | 0.89 | 18% | 3.5 | Steady |
| NeurIPS | ML conferences | 27 | 0.89 | 11% | 21.7 | Steady |
| Artificial Intelligence for the Earth Systems | AMS journals | 15 | 0.82 | 0% | 16.0 | Steady |
| Journal of Hydrometeorology | AMS journals | 12 | 0.80 | 0% | 10.3 | Steady |
| Geophysical Research Letters | AGU journals | 38 | 0.80 | 0% | 18.5 | Steady |
| JGR (section not recorded) | AGU journals | 24 | 0.79 | 4% | 4.6 | Steady |
| IEEE Transactions on Geoscience and Remote Sensing | IEEE & remote sensing | 35 | 0.74 | 6% | 4.8 | Steady |
| Environmental Data Science | Other geoscience journals | 5 | 0.72 | 0% | 17.1 | Steady |
| Journal of Climate | AMS journals | 15 | 0.72 | 7% | 4.4 | Steady |
| Climate Dynamics | Other geoscience journals | 12 | 0.71 | 0% | 6.2 | Steady |
| Bulletin of the American Meteorological Society | AMS journals | 14 | 0.70 | 14% | 12.3 | Steady |
| Scientific Reports | PNAS & multidisciplinary | 9 | 0.69 | 0% | 17.1 | Steady |
| Monthly Weather Review | AMS journals | 11 | 0.67 | 0% | 11.5 | Steady |
| Weather and Forecasting | AMS journals | 18 | 0.67 | 6% | 5.2 | Steady |
| Journal of Advances in Modeling Earth Systems | AGU journals | 61 | 0.67 | 3% | 15.1 | Steady |
| Ecological Modelling | Environmental science journals | 5 | 0.66 | 0% | 4.0 | Steady |
| Quarterly Journal of the Royal Meteorological Society | RMetS / Royal Society | 5 | 0.48 | 20% | 4.2 | Lower impact |

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
| period | ≤1999, 2000–09, 2010–18, 2019–20, 2021–22, 2023–24, 2025–26 | `PERIODS` in `scripts/taxonomy.py` |

**Fixing a category.** For one paper, add a row to `data/category_overrides.csv` (`paper_id,dimension,label,action,note`, where action is `add`, `remove` or `set`). For a systematic problem, edit the regex in `scripts/taxonomy.py`. Then rerun `python3 scripts/build_db.py && python3 analysis/eda.py`. 3 manual corrections are applied.

**Known limitations.** The rules can only see what the summaries say. 545 summaries are partly editorial assessments, and 837 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
