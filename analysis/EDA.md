# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py). Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of 373 papers, not a census of the field. It over-represents landmark and highly cited work and covers papers from 2025 onward thinly. The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **Architectures shifted sharply after 2022.** Transformers, graph/operator networks and generative models were 13% of architecture tags in 2019–20 and 63% in 2023–26. CNN/U-Net fell from 35% to 15% over the same periods.
2. **ERA5 became the default training set.** 8 papers in 2019–20 used it, rising to 41 in 2023–26, when it appeared in about half of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) fell from 17 to 7 papers between 2021–22 and 2023–26.
3. **Probabilistic output is now the norm.** Among method papers, the share producing ensembles, distributions or other uncertainty rose steadily: 27% (≤2018), 32%, 39%, 51% (2023–26).
4. **Subfields have distinct architecture signatures.** Parameterization work is dominated by column MLPs, coupled online to a host model. Downscaling splits between CNNs and generative models (GANs, then diffusion). Global medium-range weather is where transformers and graph/operator networks concentrate. Remote sensing, sea ice and extremes still rely mostly on CNNs.
5. **Citation rates follow the architecture shift, but are driven by a few flagship models.** Since 2018, method papers using transformers have a median of 67 citations/yr and graph/operator networks 53, against about 15–27 for the other groups. The interquartile ranges are wide and overlap, and these groups contain Pangu-Weather, GraphCast, FourCastNet and similar landmarks.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The catalog peaks in 2020–21 and again in 2023. The 2023 peak is driven by medium-range weather (13 papers in 2023, 10 in 2024), which barely existed as a subfield before 2022. The low count from 2025 onward reflects catalog coverage, not the field.

### Model families
![Model families](figures/02_architecture_families.png)

CNNs are the most common family overall (84 papers). "Neural network (unspecified)" (58) mostly covers dense networks in parameterization and XAI papers whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling (33), data-assimilation schemes (16), XAI methods (17) and physics-informed constraints (12).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ≤2018 | 55 | 24% | 33% | 13% | 20% | 11% | 0% | 0% |
| 2019–20 | 120 | 35% | 20% | 11% | 21% | 8% | 3% | 3% |
| 2021–22 | 90 | 30% | 27% | 8% | 17% | 11% | 4% | 3% |
| 2023–26 | 100 | 15% | 16% | 2% | 4% | 27% | 16% | 20% |

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output stays steady at about 20 papers per period. It's used for emulation, detection and transfer learning (for example the ENSO CNN of Ham et al. 2019). Operational NWP archives and reforecasts grow with ERA5, because ML weather models are verified against and fine-tuned on operational analyses. Radar peaks in 2019–20 with the deterministic nowcasting wave.

### Architecture by subfield
![Architecture by subfield](figures/05_architecture_by_subfield.png)

### Citation rate by architecture
![Citations by architecture](figures/06_citations_by_architecture.png)

Citations per year are total citations divided by years since publication (minimum one year). This favours recent landmark papers. Compare medians, not means.

### Probabilistic output
![Probabilistic share](figures/07_probabilistic_share.png)

### Venues
![Venue families](figures/08_venue_families.png)

AGU journals (JAMES and GRL above all) are the main home of the catalog's papers (88), followed by Nature/Science-family journals (48) and AMS journals (42). ML-for-weather work also appears at NeurIPS, ICML and ICLR (35). 28 papers exist only on arXiv, mostly 2022–2025 global models from industry labs.

## Categories

| Dimension | Values | Where it comes from |
|---|---|---|
| `paper_type` | method, review, dataset_benchmark, evaluation | summary architecture/goal text and title |
| model family (`paper_architecture`, `tag_kind = 'model_family'`) | CNN, U-Net, RNN/LSTM, MLP, Transformer, GNN, neural operator, diffusion, GAN, VAE/flow/autoencoder, tree ensemble, kernel/GP/SVM, linear/statistical, reservoir computing, clustering, equation discovery, neural network (unspecified) | summary architecture field and title |
| approach (`tag_kind = 'approach'`) | hybrid physics-ML, physics-informed constraints, causal/XAI, data-assimilation scheme | same |
| `arch_group` | 7 coarse groups used in trend plots | mapping in `scripts/taxonomy.py` |
| data source (`paper_data_source`) | ERA5, other/unspecified reanalysis, CMIP/climate models, km-scale simulations, idealized models, operational NWP, radar, satellite, stations/in situ, ocean/sea-ice products, scheme output, generic PDE benchmarks | summary data field |
| goal (`paper_task`) | 19 research goals, e.g. medium-range forecasting, parameterization, downscaling, detection & attribution | summary goal field and title |
| limitation (`paper_issue_theme`) | 16 recurring limitation themes, e.g. idealized setting, reanalysis dependence, blurring, no uncertainty, instability | summary issues field |
| open problem (`paper_open_theme`) | 11 research-agenda themes, e.g. probabilistic forecasts, operational use, online coupling, learning from observations | summary open-work field |
| `probabilistic` | true/false | summary architecture/goal/result and title |
| `venue_family` | 13 publisher/community groups | venue string |

**Fixing a category.** For one paper, add a row to `data/category_overrides.csv` (`paper_id,dimension,label,action,note`, where action is `add`, `remove` or `set`). For a systematic problem, edit the regex in `scripts/taxonomy.py`. Then rerun `python3 scripts/build_db.py && python3 analysis/eda.py`. Three manual corrections are applied so far (ClimaX paper type, GenCast GNN tag, FourCastNet probabilistic flag).

**Known limitations.** The rules can only see what the summaries say. About 104 summaries are partly editorial assessments, and around 30 papers had no abstract. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
