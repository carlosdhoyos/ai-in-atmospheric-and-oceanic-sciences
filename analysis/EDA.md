# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 5784 papers (1980–2026), not a census of the field. The analysis below uses its core set of 3097 papers: hand-picked landmark papers plus, in every publication year, the papers cited at or above that year's median rate. Searches reached different depths in different decades, and the core set makes periods comparable. It over-represents landmark and highly cited work. Recent years are covered (2025: 222, 2026: 86 papers); the most recent papers have had little time to accumulate citations. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were 7% of architecture tags in 2019–20 and 31% in 2025–26. CNN/U-Net went from 21% to 14% over the same periods.
2. **Satellite is now the most common data source, ahead of ERA5.** ERA5 appears in 10 papers in 2019–20 and 23 in 2025–26, where it is used by 10% of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from 19 papers in 2021–22 to 4 in 2025–26.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: 5% (≤1999), 12% (2000–09), 21% (2010–18), 25% (2019–20), 22% (2021–22), 27% (2023–24), 27% (2025–26).
4. **Goals have shifted.** Hydrological prediction is the most common goal overall (971 papers). Comparing papers from 2019–20 and 2021–22 with papers from 2023–24 and 2025–26, the fastest-growing goals are Medium-range weather forecasting (+5 pts), Process understanding & discovery (+2 pts), Benchmarking, evaluation & feasibility (+2 pts); the largest declines are Agricultural prediction (-2 pts), Parameterization & physics emulation (-3 pts).
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield among papers since 2019: Hydrology & water resources: Classical ML (180 of 397 papers); Weather & climate for energy: RNN / LSTM (163 of 287 papers); Extremes & tropical cyclones: Classical ML (87 of 172 papers); Medium-range weather: Transformers (31 of 98 papers); Remote sensing & clouds: CNN / U-Net (49 of 92 papers); Air quality & chemistry: Classical ML (44 of 73 papers); Climate & water for agriculture: Classical ML (51 of 73 papers); Climate emulation & detection: Classical ML (22 of 63 papers).
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: MLP / generic NN: Limited evaluation (22%); Classical ML: Limited evaluation (25%); RNN / LSTM: Limited evaluation (35%); CNN / U-Net: Limited evaluation (29%); Expert systems & fuzzy logic: Limited evaluation (19%); Transformers: Limited evaluation (25%); Generative (diffusion/GAN/VAE): Limited evaluation (23%); Graph & operator nets: Depends on reanalysis / NWP analyses (27%). The most common open problems across all papers are Probabilistic forecasts & uncertainty (505), Longer lead times (480), Generalization & transfer (474).
7. **Citation rates.** Among method papers from 2018–2024, which have had time to collect citations, median citations per year are Transformers 37 (n=99), RNN / LSTM 33 (n=370), Expert systems & fuzzy logic 31 (n=20), CNN / U-Net 30 (n=272), Classical ML 29 (n=370), Graph & operator nets 28 (n=53), Generative (diffusion/GAN/VAE) 28 (n=81), MLP / generic NN 27 (n=245). The leaders are carried by a few flagship models, and the interquartile ranges are wide and overlap. Papers from 2025 on are too recent to compare this way.
8. **Machine learning in these fields is older than deep learning.** The catalog has 778 papers from before 2010, starting with 1980 expert systems and pattern-recognition studies. Their methods were mostly MLP / generic NN (479), Classical ML (234), Expert systems & fuzzy logic (98), RNN / LSTM (34), applied above all to hydrology & water resources (347), remote sensing & clouds (132), weather & climate for energy (125). Many questions now revisited with deep learning (rainfall–runoff, satellite retrievals, emulating model physics, ENSO prediction) were first posed with these shallow models.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

Bar heights show search depth, not publication volume: every candidate up to 2009 was screened; from 2010 on, the most cited 30% of each year's candidates (at least 400 a year). The line shows the field's growth: papers per year in Semantic Scholar matching the same search terms (own scale; an index that includes off-topic matches). Read the bars for the subfield mix within a year, not for growth between years. Semantic Scholar has 937 papers in 1995, 3,457 papers in 2005, 6,322 papers in 2009, 6,857 papers in 2010, 11,012 papers in 2015, 32,744 papers in 2020, 64,197 papers in 2024 matching the same search terms, a smooth rise with no break at 2010; the catalog holds 3.7% of 1995, 3.1% of 2005, 2.6% of 2009, 1.7% of 2010, 1.5% of 2015, 1.2% of 2020, 0.6% of 2024.

### Model families
![Model families](figures/02_architecture_families.png)

MLP is the most common family (635 papers), followed by RNN / LSTM (505) and Neural network (unspecified) (386). "Neural network (unspecified)" (386) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (389), data-assimilation schemes (16), XAI methods (74) and physics-informed constraints (53).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator | Expert & fuzzy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤1999 | 231 | 0% | 60% | 1% | 24% | 0% | 0% | 0% | 15% |
| 2000–09 | 615 | 0% | 55% | 5% | 29% | 0% | 0% | 0% | 10% |
| 2010–18 | 749 | 4% | 36% | 8% | 42% | 2% | 0% | 0% | 6% |
| 2019–20 | 474 | 21% | 17% | 21% | 33% | 4% | 1% | 1% | 1% |
| 2021–22 | 486 | 19% | 17% | 28% | 23% | 3% | 5% | 3% | 1% |
| 2023–24 | 481 | 17% | 12% | 23% | 16% | 9% | 15% | 8% | 0% |
| 2025–26 | 281 | 14% | 17% | 21% | 16% | 6% | 17% | 8% | 0% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in 2, 12, 20, 19, 31, 27, 14 papers across the periods (≤1999, 2000–09, 2010–18, 2019–20, 2021–22, 2023–24, 2025–26); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 (1, 5, 31, 9, 19, 36, 21), because ML weather models are verified against and fine-tuned on operational analyses.

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

The main homes of the catalog's papers are Energy journals (554), Hydrology & water journals (510), IEEE & remote sensing (224). ML conferences account for 66 papers, and 60 exist only on arXiv.

## Journals

Venues with at least 5 papers in the catalog, ranked by **impact index**: the median, over a venue's papers, of
citations per year relative to the median for catalog papers from the same year (1 = typical). **Top 10%** is the
share of its papers among the most cited for their year. These describe each venue's papers in this catalog, not
the journal as a whole, and are not the Journal Impact Factor. The interactive version, with filters, trends and
each venue's most influential papers, is [`journals.html`](../journals.html).

| Venue | Group | Papers | Impact index | Top 10% | Median cites/yr | Tier |
|---|---|---:|---:|---:|---:|---|
| Nature | Nature & Science | 19 | 5.60 | 74% | 154.4 | Leading |
| Frontiers in Plant Science | Agricultural journals | 5 | 2.55 | 60% | 88.0 | Leading |
| IEEE Transactions on Energy Conversion | Energy journals | 8 | 2.54 | 62% | 13.1 | Leading |
| Atmosphere | MDPI & Frontiers | 7 | 2.21 | 43% | 40.0 | Leading |
| Geoscience Frontiers | MDPI & Frontiers | 5 | 2.10 | 40% | 67.1 | Leading |
| IEEE Transactions on Knowledge and Data Engineering | IEEE & remote sensing | 5 | 1.95 | 20% | 51.9 | Leading |
| Nature Machine Intelligence | Nature & Science | 5 | 1.77 | 20% | 52.4 | Leading |
| ICML | ML conferences | 8 | 1.67 | 38% | 39.6 | Leading |
| Environmental Science & Technology | Environmental science journals | 6 | 1.50 | 33% | 44.1 | Leading |
| KDD | ML conferences | 6 | 1.49 | 17% | 33.7 | Strong |
| Journal of Water Resources Planning and Management | Hydrology & water journals | 10 | 1.48 | 30% | 7.7 | Strong |
| IEEE Transactions on Neural Networks | IEEE & remote sensing | 6 | 1.48 | 33% | 6.4 | Strong |
| IEEE Transactions on Power Systems | Energy journals | 36 | 1.47 | 28% | 14.1 | Strong |
| Journal of Irrigation and Drainage Engineering | Hydrology & water journals | 7 | 1.47 | 14% | 9.8 | Strong |
| ICLR | ML conferences | 6 | 1.42 | 33% | 36.8 | Strong |
| Nature Communications | Nature & Science | 34 | 1.42 | 26% | 43.6 | Strong |
| Bulletin of the American Meteorological Society | AMS journals | 13 | 1.38 | 31% | 16.2 | Strong |
| Solar Energy | Energy journals | 38 | 1.30 | 11% | 19.4 | Strong |
| PNAS | PNAS & multidisciplinary | 12 | 1.30 | 33% | 39.1 | Strong |
| Engineering Applications of Computational Fluid Mechanics | Physics & applied math | 5 | 1.29 | 0% | 33.8 | Strong |
| Geomatics, Natural Hazards and Risk | Other geoscience journals | 5 | 1.28 | 0% | 34.4 | Strong |
| Scientific Data | Environmental science journals | 11 | 1.28 | 18% | 35.6 | Strong |
| Water Research | Hydrology & water journals | 5 | 1.25 | 20% | 32.8 | Strong |
| Nature Climate Change | Nature & Science | 10 | 1.24 | 20% | 38.0 | Strong |
| ISPRS Journal of Photogrammetry and Remote Sensing | IEEE & remote sensing | 6 | 1.21 | 0% | 34.4 | Strong |
| Journal of Hydrologic Engineering | Hydrology & water journals | 33 | 1.20 | 15% | 8.3 | Strong |
| Agricultural and Forest Meteorology | Agricultural journals | 16 | 1.19 | 0% | 30.1 | Strong |
| Scientific Reports | PNAS & multidisciplinary | 46 | 1.19 | 11% | 27.3 | Strong |
| Social Science Research Network | Other venues | 5 | 1.18 | 0% | 30.9 | Strong |
| Science Advances | Nature & Science | 14 | 1.16 | 21% | 33.2 | Strong |
| Renewable Energy | Energy journals | 101 | 1.15 | 8% | 21.7 | Strong |
| Reviews of Geophysics | AGU journals | 5 | 1.14 | 20% | 36.6 | Strong |
| Energy Conversion and Management | Energy journals | 78 | 1.14 | 6% | 25.4 | Strong |
| International Journal of Electrical Power & Energy Systems | Energy journals | 8 | 1.12 | 0% | 28.5 | Strong |
| Journal of Atmospheric and Oceanic Technology | AMS journals | 12 | 1.11 | 0% | 8.2 | Strong |
| Neural Computing and Applications | Soft computing & engineering | 14 | 1.11 | 14% | 25.6 | Strong |
| Applied Energy | Energy journals | 76 | 1.11 | 11% | 28.0 | Strong |
| PLOS ONE | Environmental science journals | 6 | 1.11 | 33% | 34.8 | Strong |
| Energy | Energy journals | 69 | 1.10 | 7% | 32.4 | Strong |
| Neural Networks | Soft computing & engineering | 6 | 1.10 | 17% | 11.9 | Strong |
| Energies | Energy journals | 24 | 1.10 | 4% | 28.8 | Strong |
| Sustainable Cities and Society | Environmental science journals | 8 | 1.09 | 0% | 28.8 | Strong |
| Renewable and Sustainable Energy Reviews | Energy journals | 33 | 1.08 | 15% | 23.9 | Strong |
| Water Resources Research | AGU journals | 83 | 1.08 | 19% | 17.3 | Strong |
| Atmospheric Environment | Other geoscience journals | 22 | 1.07 | 14% | 17.5 | Strong |
| Energy Reports | Energy journals | 8 | 1.06 | 0% | 28.1 | Strong |
| Water | Hydrology & water journals | 35 | 1.06 | 9% | 27.4 | Strong |
| Journal of Hydrology | Hydrology & water journals | 259 | 1.06 | 10% | 21.1 | Strong |
| Procedia Computer Science | Soft computing & engineering | 6 | 1.06 | 0% | 20.9 | Strong |
| Philosophical Transactions of the Royal Society A | RMetS / Royal Society | 9 | 1.05 | 22% | 33.4 | Strong |
| Journal of Cleaner Production | Environmental science journals | 15 | 1.05 | 20% | 33.2 | Strong |
| Earth System Science Data | EGU / Copernicus journals | 9 | 1.04 | 0% | 17.3 | Strong |
| IEEE Transactions on Sustainable Energy | Energy journals | 31 | 1.03 | 0% | 22.0 | Strong |
| Engineering Applications of Artificial Intelligence | Soft computing & engineering | 19 | 1.03 | 5% | 11.4 | Strong |
| Hydrological Sciences Journal | Hydrology & water journals | 28 | 1.03 | 14% | 6.9 | Strong |
| Atmospheric Research | Other geoscience journals | 15 | 1.02 | 0% | 21.0 | Strong |
| JAWRA Journal of the American Water Resources Association | Hydrology & water journals | 6 | 1.01 | 0% | 6.7 | Strong |
| Ocean Engineering | Soft computing & engineering | 23 | 1.01 | 0% | 8.1 | Strong |
| Remote Sensing of Environment | IEEE & remote sensing | 41 | 1.00 | 7% | 25.1 | Strong |
| Nature Geoscience | Nature & Science | 5 | 1.00 | 0% | 31.4 | Strong |
| IJCAI | ML conferences | 5 | 1.00 | 0% | 21.9 | Strong |
| Applied Soft Computing | Soft computing & engineering | 17 | 1.00 | 18% | 23.7 | Strong |
| IEEE Access | IEEE & remote sensing | 25 | 1.00 | 4% | 30.6 | Strong |
| Journal of Hydroinformatics | Hydrology & water journals | 11 | 1.00 | 0% | 10.9 | Strong |
| Science of The Total Environment | Environmental science journals | 51 | 1.00 | 4% | 26.8 | Strong |
| Journal of Computing in Civil Engineering | Soft computing & engineering | 5 | 1.00 | 20% | 7.3 | Strong |
| Remote Sensing | MDPI & Frontiers | 35 | 0.99 | 6% | 27.1 | Steady |
| Electric Power Systems Research | Energy journals | 5 | 0.99 | 0% | 29.3 | Steady |
| Expert Systems with Applications | Soft computing & engineering | 22 | 0.99 | 5% | 14.3 | Steady |
| IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing | IEEE & remote sensing | 9 | 0.97 | 0% | 22.0 | Steady |
| Communications Earth & Environment | Nature & Science | 10 | 0.97 | 10% | 20.7 | Steady |
| Atmospheric Chemistry and Physics | EGU / Copernicus journals | 15 | 0.96 | 13% | 22.7 | Steady |
| Environmental Modelling & Software | Other geoscience journals | 31 | 0.96 | 10% | 18.0 | Steady |
| CVPR | ML conferences | 5 | 0.96 | 0% | 21.6 | Steady |
| Environmental Research Letters | PNAS & multidisciplinary | 11 | 0.95 | 9% | 30.1 | Steady |
| Atmospheric Pollution Research | Other geoscience journals | 7 | 0.94 | 0% | 27.8 | Steady |
| IEEE Transactions on Industry Applications | IEEE & remote sensing | 8 | 0.94 | 0% | 18.8 | Steady |
| JGR: Oceans | AGU journals | 8 | 0.93 | 0% | 5.2 | Steady |
| Journal of Applied Meteorology and Climatology | AMS journals | 19 | 0.92 | 11% | 5.2 | Steady |
| Environmental Pollution | Other geoscience journals | 8 | 0.91 | 0% | 20.2 | Steady |
| IEEE Transactions on Neural Networks and Learning Systems | IEEE & remote sensing | 5 | 0.91 | 20% | 18.2 | Steady |
| Geocarto International | Other geoscience journals | 5 | 0.90 | 0% | 28.4 | Steady |
| Advances in Engineering Software | Soft computing & engineering | 7 | 0.90 | 0% | 10.3 | Steady |
| Sensors | MDPI & Frontiers | 5 | 0.90 | 20% | 27.9 | Steady |
| Artificial Intelligence Review | Soft computing & engineering | 5 | 0.90 | 20% | 24.4 | Steady |
| Hydrology and Earth System Sciences | EGU / Copernicus journals | 61 | 0.90 | 7% | 23.3 | Steady |
| Computers & Geosciences | Soft computing & engineering | 11 | 0.90 | 0% | 12.7 | Steady |
| International Journal of Remote Sensing | IEEE & remote sensing | 11 | 0.89 | 18% | 3.5 | Steady |
| Agricultural Water Management | Agricultural journals | 24 | 0.89 | 0% | 18.0 | Steady |
| Hydrological Processes | Hydrology & water journals | 30 | 0.89 | 7% | 7.1 | Steady |
| IEEE Transactions on Industrial Informatics | IEEE & remote sensing | 8 | 0.89 | 0% | 26.5 | Steady |
| IEEE Geoscience and Remote Sensing Letters | IEEE & remote sensing | 7 | 0.88 | 0% | 30.0 | Steady |
| Environmental Science and Pollution Research | Environmental science journals | 7 | 0.88 | 0% | 26.2 | Steady |
| Water Resources Management | Hydrology & water journals | 46 | 0.88 | 2% | 12.6 | Steady |
| npj Climate and Atmospheric Science | Nature & Science | 14 | 0.88 | 7% | 24.3 | Steady |
| Journal of Hydrometeorology | AMS journals | 12 | 0.87 | 0% | 8.8 | Steady |
| Sustainability | MDPI & Frontiers | 16 | 0.87 | 6% | 22.6 | Steady |
| Advances in Water Resources | Hydrology & water journals | 10 | 0.87 | 20% | 20.3 | Steady |
| Environment International | Other geoscience journals | 11 | 0.86 | 9% | 23.4 | Steady |
| Computers and Electronics in Agriculture | Agricultural journals | 18 | 0.86 | 11% | 19.6 | Steady |
| Stochastic Environmental Research and Risk Assessment | Hydrology & water journals | 10 | 0.86 | 0% | 15.1 | Steady |
| Neurocomputing | Soft computing & engineering | 19 | 0.85 | 5% | 11.0 | Steady |
| Journal of Hydrology: Regional Studies | Hydrology & water journals | 7 | 0.85 | 0% | 24.0 | Steady |
| Journal of Environmental Management | Environmental science journals | 16 | 0.84 | 0% | 22.0 | Steady |
| International Journal of Climatology | RMetS / Royal Society | 12 | 0.84 | 8% | 11.7 | Steady |
| Applied Sciences | MDPI & Frontiers | 13 | 0.83 | 0% | 25.7 | Steady |
| Environmental Earth Sciences | Environmental science journals | 6 | 0.82 | 17% | 18.4 | Steady |
| International Journal of Applied Earth Observation and Geoinformation | Other geoscience journals | 5 | 0.80 | 0% | 23.3 | Steady |
| Theoretical and Applied Climatology | Other geoscience journals | 6 | 0.80 | 0% | 17.4 | Steady |
| Geoscientific Model Development | EGU / Copernicus journals | 20 | 0.79 | 0% | 18.0 | Steady |
| IEEE Transactions on Geoscience and Remote Sensing | IEEE & remote sensing | 48 | 0.78 | 8% | 7.1 | Steady |
| Geophysical Research Letters | AGU journals | 33 | 0.76 | 0% | 21.6 | Steady |
| AAAI | ML conferences | 7 | 0.75 | 0% | 22.7 | Steady |
| Journal of Climate | AMS journals | 18 | 0.73 | 6% | 4.8 | Steady |
| NeurIPS | ML conferences | 25 | 0.68 | 20% | 21.7 | Steady |
| Climate Dynamics | Other geoscience journals | 13 | 0.68 | 0% | 6.5 | Steady |
| Ecological Modelling | Environmental science journals | 5 | 0.66 | 20% | 4.0 | Steady |
| Weather and Forecasting | AMS journals | 18 | 0.65 | 6% | 5.2 | Steady |
| Monthly Weather Review | AMS journals | 11 | 0.64 | 0% | 13.1 | Steady |
| JGR: Atmospheres | AGU journals | 19 | 0.63 | 5% | 6.7 | Steady |
| Artificial Intelligence for the Earth Systems | AMS journals | 10 | 0.62 | 0% | 20.0 | Steady |
| Journal of Advances in Modeling Earth Systems | AGU journals | 57 | 0.53 | 4% | 16.6 | Lower impact |

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

**Known limitations.** The rules can only see what the summaries say. 1141 summaries are partly editorial assessments, and 1600 papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
