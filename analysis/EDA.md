# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 4683 papers (1980–2026), not a census of the field. The analysis below uses its core set of 2584 papers: hand-picked landmark papers plus, in every publication year, the papers cited at or above that year's median rate. Searches reached different depths in different decades, and the core set makes periods comparable. It over-represents landmark and highly cited work. Recent years are covered (2025: 102, 2026: 59 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 8% of architecture tags in 2019–20 and 57% in 2025–26. CNN/U-Net went from 21% to 14% over the same periods.
2. **ERA5 and operational NWP / reforecasts are the main data sources, on par.** ERA5 appears in 10 papers in 2019–20 and 36 in 2025–26, where it is used by 26% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 15 papers in 2021–22 to 6 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 5% (≤1999), 12% (2000–09), 20% (2010–18), 26% (2019–20), 24% (2021–22), 27% (2023–24), 46% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (776 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+14 pts), Climate emulation & projection (+5 pts), Benchmarking, evaluation & feasibility (+4 pts); the largest declines are Parameterization & physics emulation (-3 pts), Energy forecasting (-5 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield among papers since 2019: Hydrology & water resources: Classical ML (108 of 249 papers); Weather & climate for energy: RNN / LSTM (117 of 188 papers); Extremes & tropical cyclones: Classical ML (57 of 121 papers); Medium-range weather: Transformers (31 of 88 papers); Remote sensing & clouds: CNN / U-Net (30 of 53 papers); Climate emulation & detection: MLP / generic NN (16 of 50 papers); Ensembles & generative: Generative (diffusion/GAN/VAE) (26 of 48 papers); Air quality & chemistry: Classical ML (21 of 43 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (22%); Classical ML: Limited evaluation (23%); RNN / LSTM: Limited evaluation (34%); CNN / U-Net: Limited evaluation (25%); Expert systems & fuzzy logic: Limited evaluation (20%); Transformers: Limited evaluation (25%); Generative (diffusion/GAN/VAE): Limited evaluation (22%); Graph & operator nets: Depends on reanalysis / NWP analyses (28%). The most common open problems across all papers are Longer lead times (417), Probabilistic forecasts & uncertainty (415), Generalization & transfer (378).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Graph & operator nets 46 (n=37), Transformers 42 (n=79), RNN / LSTM 38 (n=277), Classical ML 35 (n=254), CNN / U-Net 34 (n=210), MLP / generic NN 33 (n=171), Expert systems & fuzzy logic 32 (n=15), Generative (diffusion/GAN/VAE) 31 (n=67). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.
8. **Machine learning in these fields is older than deep learning.** The catalog has 778 papers from before 2010, starting with 1980 expert systems and pattern-recognition studies. Their methods were mostly MLP / generic NN (479), Classical ML (234), Expert systems & fuzzy logic (98), RNN / LSTM (34), applied above all to hydrology & water resources (347), remote sensing & clouds (132), weather & climate for energy (125). Many questions now revisited with deep learning (rainfall–runoff, satellite retrievals, emulating model physics, ENSO prediction) were first posed with these shallow models.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are 2020 (181 papers) and 2024 (179).

### Model families
![Model families](figures/02_architecture_families.png)

MLP is the most common family (578 papers), followed by RNN / LSTM (369) and Neural network (unspecified) (333). "Neural network (unspecified)" (333) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (292), data-assimilation schemes (16), XAI methods (44) and physics-informed constraints (35).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator | Expert & fuzzy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤1999 | 231 | 0% | 60% | 1% | 24% | 0% | 0% | 0% | 15% |
| 2000–09 | 615 | 0% | 55% | 5% | 29% | 0% | 0% | 0% | 10% |
| 2010–18 | 672 | 4% | 37% | 7% | 43% | 2% | 0% | 0% | 6% |
| 2019–20 | 381 | 21% | 17% | 22% | 31% | 5% | 2% | 1% | 2% |
| 2021–22 | 337 | 21% | 15% | 29% | 23% | 3% | 6% | 2% | 1% |
| 2023–24 | 368 | 17% | 12% | 23% | 15% | 10% | 15% | 8% | 0% |
| 2025–26 | 164 | 14% | 13% | 12% | 4% | 18% | 21% | 18% | 0% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 2, 12, 17, 18, 24, 21, 18 papers across the periods (≤1999, 2000–09, 2010–18, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (1, 5, 26, 8, 17, 31, 39), because ML weather models are verified against and fine-tuned on operational analyses.

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

The main homes of the catalog's papers are Energy journals (451), Hydrology & water journals (430), AGU journals (217). ML conferences account for 59 papers, and 73 exist only on arXiv.

## Journals

Venues with at least 5 papers in the catalog, ranked by **impact index**: the median, over a venue's papers, of
citations per year relative to the median for catalog papers from the same year (1 = typical). **Top 10%** is the
share of its papers among the most cited for their year. These describe each venue's papers in this catalog, not
the journal as a whole, and are not the Journal Impact Factor. The interactive version, with filters, trends and
each venue's most influential papers, is [`journals.html`](../journals.html).

| Venue | Group | Papers | Impact index | Top 10% | Median cites/yr | Tier |
|---|---|---:|---:|---:|---:|---|
| Nature | Nature & Science | 16 | 5.75 | 81% | 171.3 | Leading |
| ICML | ML conferences | 8 | 2.76 | 62% | 39.6 | Leading |
| IEEE Transactions on Energy Conversion | Energy journals | 8 | 2.54 | 62% | 13.1 | Leading |
| IEEE Transactions on Power Systems | Energy journals | 32 | 1.81 | 31% | 12.5 | Leading |
| Communications Earth & Environment | Nature & Science | 5 | 1.68 | 20% | 26.7 | Leading |
| ICLR | ML conferences | 5 | 1.59 | 40% | 51.6 | Leading |
| KDD | ML conferences | 5 | 1.52 | 20% | 42.7 | Leading |
| Nature Machine Intelligence | Nature & Science | 5 | 1.50 | 20% | 52.4 | Strong |
| Journal of Water Resources Planning and Management | Hydrology & water journals | 10 | 1.48 | 30% | 7.7 | Strong |
| IEEE Transactions on Neural Networks | IEEE & remote sensing | 6 | 1.48 | 33% | 6.4 | Strong |
| Journal of Irrigation and Drainage Engineering | Hydrology & water journals | 7 | 1.47 | 14% | 9.8 | Strong |
| Nature Climate Change | Nature & Science | 9 | 1.40 | 11% | 40.7 | Strong |
| Solar Energy | Energy journals | 34 | 1.39 | 12% | 16.9 | Strong |
| Nature Communications | Nature & Science | 30 | 1.34 | 27% | 44.8 | Strong |
| PNAS | PNAS & multidisciplinary | 12 | 1.34 | 25% | 39.1 | Strong |
| Journal of Cleaner Production | Environmental science journals | 12 | 1.28 | 8% | 39.1 | Strong |
| Agricultural and Forest Meteorology | Agricultural journals | 13 | 1.28 | 0% | 34.9 | Strong |
| Journal of Hydrologic Engineering | Hydrology & water journals | 33 | 1.20 | 15% | 8.3 | Strong |
| Applied Energy | Energy journals | 58 | 1.20 | 10% | 31.9 | Strong |
| Renewable Energy | Energy journals | 85 | 1.20 | 8% | 19.9 | Strong |
| Neural Computing and Applications | Soft computing & engineering | 12 | 1.20 | 8% | 27.6 | Strong |
| Environmental Science & Technology | Environmental science journals | 6 | 1.18 | 33% | 44.1 | Strong |
| IEEE Transactions on Sustainable Energy | Energy journals | 23 | 1.17 | 0% | 25.7 | Strong |
| Scientific Reports | PNAS & multidisciplinary | 20 | 1.14 | 10% | 40.8 | Strong |
| Environmental Research Letters | PNAS & multidisciplinary | 8 | 1.13 | 12% | 41.2 | Strong |
| ISPRS Journal of Photogrammetry and Remote Sensing | IEEE & remote sensing | 5 | 1.12 | 0% | 37.6 | Strong |
| Journal of Atmospheric and Oceanic Technology | AMS journals | 12 | 1.11 | 0% | 8.2 | Strong |
| Atmospheric Chemistry and Physics | EGU / Copernicus journals | 8 | 1.11 | 25% | 40.3 | Strong |
| Bulletin of the American Meteorological Society | AMS journals | 15 | 1.10 | 20% | 14.0 | Strong |
| Science of The Total Environment | Environmental science journals | 35 | 1.10 | 3% | 32.8 | Strong |
| Advances in Water Resources | Hydrology & water journals | 7 | 1.10 | 29% | 12.9 | Strong |
| Neural Networks | Soft computing & engineering | 6 | 1.10 | 0% | 11.9 | Strong |
| Atmospheric Environment | Other geoscience journals | 20 | 1.10 | 15% | 15.3 | Strong |
| Atmospheric Pollution Research | Other geoscience journals | 5 | 1.09 | 0% | 30.0 | Strong |
| Scientific Data | Environmental science journals | 8 | 1.09 | 0% | 40.5 | Strong |
| Science Advances | Nature & Science | 13 | 1.07 | 23% | 31.7 | Strong |
| Energy Conversion and Management | Energy journals | 68 | 1.07 | 4% | 27.4 | Strong |
| Water Resources Research | AGU journals | 75 | 1.07 | 21% | 13.4 | Strong |
| Engineering Applications of Artificial Intelligence | Soft computing & engineering | 17 | 1.06 | 6% | 11.4 | Strong |
| Journal of Hydrology | Hydrology & water journals | 217 | 1.06 | 10% | 20.9 | Strong |
| Energy | Energy journals | 53 | 1.06 | 6% | 36.2 | Strong |
| Sustainability | MDPI & Frontiers | 7 | 1.05 | 0% | 34.2 | Strong |
| Environmental Modelling & Software | Other geoscience journals | 26 | 1.04 | 12% | 13.1 | Strong |
| Agricultural Water Management | Agricultural journals | 17 | 1.03 | 6% | 16.4 | Strong |
| Water | Hydrology & water journals | 20 | 1.03 | 10% | 36.4 | Strong |
| Hydrological Sciences Journal | Hydrology & water journals | 28 | 1.03 | 14% | 6.9 | Strong |
| Remote Sensing of Environment | IEEE & remote sensing | 29 | 1.02 | 7% | 27.7 | Strong |
| Atmospheric Research | Other geoscience journals | 11 | 1.02 | 0% | 22.9 | Strong |
| IEEE Access | IEEE & remote sensing | 18 | 1.02 | 0% | 36.5 | Strong |
| Renewable and Sustainable Energy Reviews | Energy journals | 29 | 1.01 | 14% | 23.9 | Strong |
| Journal of Hydroinformatics | Hydrology & water journals | 10 | 1.01 | 0% | 10.6 | Strong |
| Journal of Computing in Civil Engineering | Soft computing & engineering | 5 | 1.00 | 20% | 7.3 | Strong |
| Energies | Energy journals | 16 | 1.00 | 0% | 31.1 | Steady |
| Expert Systems with Applications | Soft computing & engineering | 17 | 0.99 | 0% | 11.7 | Steady |
| Applied Soft Computing | Soft computing & engineering | 15 | 0.99 | 20% | 25.1 | Steady |
| International Journal of Electrical Power & Energy Systems | Energy journals | 7 | 0.98 | 0% | 28.9 | Steady |
| Environment International | Other geoscience journals | 5 | 0.97 | 20% | 31.2 | Steady |
| CVPR | ML conferences | 5 | 0.96 | 0% | 16.5 | Steady |
| Computers & Geosciences | Soft computing & engineering | 10 | 0.96 | 0% | 11.1 | Steady |
| Remote Sensing | MDPI & Frontiers | 20 | 0.95 | 5% | 33.0 | Steady |
| Ocean Engineering | Soft computing & engineering | 20 | 0.94 | 0% | 7.9 | Steady |
| Philosophical Transactions of the Royal Society A | RMetS / Royal Society | 9 | 0.94 | 33% | 33.4 | Steady |
| JAWRA Journal of the American Water Resources Association | Hydrology & water journals | 6 | 0.93 | 0% | 6.7 | Steady |
| JGR: Oceans | AGU journals | 8 | 0.93 | 0% | 5.2 | Steady |
| Hydrology and Earth System Sciences | EGU / Copernicus journals | 54 | 0.92 | 7% | 18.0 | Steady |
| Journal of Applied Meteorology and Climatology | AMS journals | 19 | 0.92 | 11% | 5.2 | Steady |
| Earth System Science Data | EGU / Copernicus journals | 5 | 0.91 | 0% | 29.6 | Steady |
| Journal of Environmental Management | Environmental science journals | 5 | 0.91 | 0% | 31.8 | Steady |
| International Journal of Climatology | RMetS / Royal Society | 10 | 0.91 | 10% | 10.5 | Steady |
| Procedia Computer Science | Soft computing & engineering | 6 | 0.90 | 0% | 20.9 | Steady |
| Geoscientific Model Development | EGU / Copernicus journals | 19 | 0.89 | 0% | 16.7 | Steady |
| Applied Sciences | MDPI & Frontiers | 7 | 0.89 | 0% | 33.5 | Steady |
| Water Resources Management | Hydrology & water journals | 34 | 0.89 | 3% | 10.5 | Steady |
| International Journal of Remote Sensing | IEEE & remote sensing | 11 | 0.89 | 18% | 3.5 | Steady |
| Hydrological Processes | Hydrology & water journals | 30 | 0.89 | 7% | 7.1 | Steady |
| Energy Reports | Energy journals | 6 | 0.88 | 0% | 28.8 | Steady |
| Environmental Science and Pollution Research | Environmental science journals | 6 | 0.86 | 0% | 26.1 | Steady |
| Neurocomputing | Soft computing & engineering | 18 | 0.86 | 0% | 10.8 | Steady |
| Computers and Electronics in Agriculture | Agricultural journals | 14 | 0.86 | 14% | 19.6 | Steady |
| Stochastic Environmental Research and Risk Assessment | Hydrology & water journals | 9 | 0.85 | 0% | 10.9 | Steady |
| Environmental Pollution | Other geoscience journals | 6 | 0.84 | 0% | 23.7 | Steady |
| Electric Power Systems Research | Energy journals | 5 | 0.84 | 0% | 29.3 | Steady |
| IEEE Transactions on Industry Applications | IEEE & remote sensing | 8 | 0.83 | 0% | 18.8 | Steady |
| IEEE Geoscience and Remote Sensing Letters | IEEE & remote sensing | 6 | 0.83 | 0% | 30.3 | Steady |
| Journal of Hydrometeorology | AMS journals | 13 | 0.82 | 0% | 8.7 | Steady |
| IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing | IEEE & remote sensing | 6 | 0.82 | 0% | 28.0 | Steady |
| JGR: Machine Learning and Computation | AGU journals | 8 | 0.79 | 0% | 7.8 | Steady |
| npj Climate and Atmospheric Science | Nature & Science | 15 | 0.79 | 7% | 22.8 | Steady |
| Advances in Engineering Software | Soft computing & engineering | 7 | 0.77 | 0% | 10.3 | Steady |
| Geophysical Research Letters | AGU journals | 36 | 0.76 | 0% | 20.3 | Steady |
| IEEE Transactions on Industrial Informatics | IEEE & remote sensing | 6 | 0.76 | 0% | 27.6 | Steady |
| IEEE Transactions on Geoscience and Remote Sensing | IEEE & remote sensing | 42 | 0.76 | 7% | 6.3 | Steady |
| Journal of Climate | AMS journals | 18 | 0.73 | 6% | 4.8 | Steady |
| Theoretical and Applied Climatology | Other geoscience journals | 5 | 0.71 | 0% | 16.1 | Steady |
| NeurIPS | ML conferences | 26 | 0.68 | 15% | 18.3 | Steady |
| Weather and Forecasting | AMS journals | 18 | 0.67 | 6% | 5.2 | Steady |
| Ecological Modelling | Environmental science journals | 5 | 0.66 | 20% | 4.0 | Steady |
| Climate Dynamics | Other geoscience journals | 12 | 0.65 | 0% | 6.2 | Steady |
| JGR: Atmospheres | AGU journals | 18 | 0.63 | 6% | 6.2 | Steady |
| Artificial Intelligence for the Earth Systems | AMS journals | 14 | 0.62 | 0% | 14.9 | Steady |
| Quarterly Journal of the Royal Meteorological Society | RMetS / Royal Society | 6 | 0.58 | 17% | 14.4 | Lower impact |
| Monthly Weather Review | AMS journals | 12 | 0.58 | 0% | 12.3 | Lower impact |
| Journal of Advances in Modeling Earth Systems | AGU journals | 60 | 0.48 | 5% | 15.0 | Lower impact |
| The Cryosphere | EGU / Copernicus journals | 5 | 0.40 | 0% | 10.0 | Lower impact |

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

**Known limitations.** The rules can only see what the summaries say. 957 summaries are partly editorial assessments, and 1425 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
