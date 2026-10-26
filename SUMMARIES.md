# Paper summaries

Each paper is summarized as main goal, architecture, data, main result, open work and issues. Summaries are based on the abstract and, for well-known papers, the published paper. *Open work* and *Issues* are often an editorial assessment rather than the authors' own statement; each entry notes its basis. Papers are grouped by their first subfield and ordered by citations.

## Contents

- [Reviews & perspectives](#review)
- [Medium-range weather](#weather)
- [Ensembles & generative](#probabilistic)
- [Foundation models](#foundation)
- [Nowcasting](#nowcasting)
- [Post-processing](#postprocessing)
- [S2S, ENSO & MJO](#s2s)
- [Climate emulation & detection](#climate)
- [Parameterization & hybrid models](#parameterization)
- [Downscaling](#downscaling)
- [Data assimilation](#da)
- [Remote sensing & clouds](#remote_sensing)
- [Extremes & tropical cyclones](#extremes)
- [Explainability & causality](#xai)
- [Ocean](#ocean)
- [Sea ice](#seaice)
- [Air quality & chemistry](#chemistry)
- [Benchmarks & datasets](#benchmarks)
- [Core ML methods](#methods)

<a id="review"></a>
## Reviews & perspectives

### [Physics-informed machine learning](https://doi.org/10.1038/s42254-021-00314-5)
Karniadakis et al. (2021), *Nature Reviews Physics*. 9,236 citations.

- **Main goal:** Reviews how physical laws and domain knowledge can be built into machine learning to give data-efficient, generalizable models of physical systems.
- **Architecture:** Review of physics-informed ML: observational, inductive and learning biases; physics-informed neural networks (PINNs); operator learning (for example DeepONet); and related software.
- **Data:** No new data; draws on applications across fluid dynamics, materials, biophysics and other fields.
- **Main result:** Argues that adding physics through data, architecture or loss constraints improves accuracy, generalization and handling of noisy or incomplete data and of inverse problems.
- **Open work:** Identifies challenges in scalability, training of PINNs for multiscale and high-dimensional problems, uncertainty quantification and theory.
- **Issues:** General physics review, not specific to atmosphere or ocean. Abstract unavailable, so the summary relies on knowledge of the paper.
- *Basis: abstract+knowledge*

### [Deep learning and process understanding for data-driven Earth system science](https://doi.org/10.1038/s41586-019-0912-1)
Reichstein et al. (2019), *Nature*. 5,062 citations.

- **Main goal:** Perspective arguing how deep learning can advance Earth system science beyond classical machine learning, while retaining physical process understanding.
- **Architecture:** Review/perspective (not a new model): surveys deep learning for spatiotemporal Earth data and advocates hybrid modelling that couples physics-based models with data-driven components.
- **Data:** No new data; discusses Earth observation, reanalysis and model output as the data streams relevant to deep learning applications.
- **Main result:** Identifies key challenges for deep learning in geoscience (interpretability, physical consistency, complex and uncertain data, limited labels, computational demands) and proposes hybrid physics-ML modelling as the way forward.
- **Open work:** Development of physically consistent, interpretable hybrid models, e.g. learned parameterizations and emulators embedded in process models.
- **Issues:** Programmatic perspective without quantitative evaluation; abstract not available in the record, so the summary relies on knowledge of the paper.
- *Basis: abstract+knowledge*

### [The quiet revolution of numerical weather prediction](https://doi.org/10.1038/nature14956)
Bauer et al. (2015), *Nature*. 2,812 citations.

- **Main goal:** Reviews how numerical weather prediction steadily improved through scientific and computational advances, and what challenges lie ahead.
- **Architecture:** Review/perspective (not ML) covering physical process representation, ensemble forecasting, data assimilation and high-performance computing.
- **Data:** Draws on operational forecast skill records, notably from ECMWF and other major centres.
- **Main result:** Forecast skill has increased by roughly one day of lead time per decade, so a 6-day forecast today matches a 5-day forecast a decade earlier, driven by incremental improvements.
- **Open work:** Seamless prediction, higher resolution, Earth-system coupling, and computing/energy efficiency on future architectures.
- **Issues:** Predates the ML weather-model era, so it does not address data-driven forecasting. Abstract unavailable.
- *Basis: abstract+knowledge*

### [Machine learning and the physical sciences](https://doi.org/10.1103/revmodphys.91.045002)
Carleo et al. (2019), *Reviews of Modern Physics*. 1,975 citations.

- **Main goal:** Review the interface between machine learning and the physical sciences.
- **Architecture:** Broad review covering ML basics, statistical physics of learning, and applications in particle physics, cosmology, quantum many-body physics, quantum computing, chemistry and materials, plus ML hardware.
- **Data:** Literature review; no new data.
- **Main result:** Summarizes successes, domain-specific methodology and challenges across physics fields.
- **Open work:** Cross-fertilization between fields and new computing architectures for ML.
- **Issues:** Does not cover atmospheric or ocean sciences specifically; relevant mainly as general background.
- *Basis: abstract*

### [Theory-Guided Data Science: A New Paradigm for Scientific Discovery from Data](https://doi.org/10.1109/tkde.2017.2720168)
Karpatne et al. (2016), *IEEE Transactions on Knowledge and Data Engineering*. 1,594 citations.

- **Main goal:** Argues that purely data-driven models generalize poorly in science and proposes integrating scientific theory into data science.
- **Architecture:** Conceptual framework and taxonomy (theory-guided data science) covering theory-guided model design, learning, refinement, hybrid models and data assimilation.
- **Data:** No new data; illustrative examples from turbulence, hydrology, climate science, materials and biomedicine.
- **Main result:** Formalizes the TGDS paradigm and a taxonomy of ways to combine domain knowledge with ML, with illustrative examples.
- **Open work:** The paper highlights research avenues for each theme, such as physics-consistent losses and hybrid physics-ML models.
- **Issues:** Conceptual; no quantitative benchmarks, so practical gains are not demonstrated.
- *Basis: abstract*

### [Tackling Climate Change with Machine Learning](https://doi.org/10.1145/3485128)
Rolnick et al. (2019), *ACM Computing Surveys*. 1,305 citations.

- **Main goal:** Map where machine learning can help mitigate greenhouse gas emissions and support adaptation to climate change, to steer ML researchers toward high-impact problems.
- **Architecture:** Broad survey and position paper organized by application domain (electricity systems, transport, buildings, industry, land use, climate prediction, societal adaptation, etc.), flagging each idea by impact and maturity.
- **Data:** No new data; reviews published work across domains and points to relevant datasets.
- **Main result:** Identifies many high-impact problems where ML can fill gaps, including a section on climate prediction (emulation, parameterization, extremes), and frames research and business opportunities.
- **Open work:** Calls for interdisciplinary collaboration with domain experts; specific open problems are listed per domain, e.g. data-driven parameterizations and downscaling for climate modeling.
- **Issues:** Very broad scope, so atmospheric and ocean modeling receive limited depth; recommendations are qualitative and predate the 2022+ wave of ML weather models.
- *Basis: abstract+knowledge*

### [Integrating Scientific Knowledge with Machine Learning for Engineering and Environmental Systems](https://doi.org/10.1145/3514228)
Willard et al. (2020), *ACM Computing Surveys*. 945 citations.

- **Main goal:** Survey how scientific knowledge is integrated with machine learning in engineering and environmental systems.
- **Architecture:** Structured review and taxonomy of physics-guided ML and hybrid physics-ML methods (physics-guided loss, architecture, initialization, hybrid modeling, etc.) by application objective.
- **Data:** No new data; reviews literature across disciplines including climate, hydrology and fluid dynamics.
- **Main result:** Provides a taxonomy that reveals knowledge gaps and possible method crossovers between disciplines.
- **Open work:** Identifies opportunities for transferring techniques across fields and for further hybrid model development.
- **Issues:** Broad scope, so atmospheric and ocean applications receive limited depth; the field has evolved rapidly since publication.
- *Basis: abstract*

### [Physics-informed machine learning: case studies for weather and climate modelling](https://doi.org/10.1098/rsta.2020.0093)
Kashinath et al. (2021), *Philosophical Transactions of the Royal Society A*. 710 citations.

- **Main goal:** Addresses off-the-shelf ML models that violate physical laws and generalize poorly, by surveying ways to incorporate physics into ML for weather and climate.
- **Architecture:** Survey that groups physics-informed ML approaches into broad categories (for example physics-based losses, architectural constraints and hybrid modelling), illustrated with 10 case studies.
- **Data:** Varies by case study: emulation, downscaling and forecasting tasks using simulation and observational data.
- **Main result:** Physics-informed approaches improve physical consistency, reduce training time, improve data efficiency and generalize better.
- **Open work:** Identifies scientific, diagnostic, computational and resource challenges for robust, reliable physics-informed ML.
- **Issues:** Case studies are mostly the authors' own and differ widely in setting, so their benefits are not directly comparable.
- *Basis: abstract*

### [Can deep learning beat numerical weather prediction?](https://doi.org/10.1098/rsta.2020.0097)
Schultz et al. (2021), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 535 citations.

- **Main goal:** Asks whether deep learning could fully replace numerical weather models and data assimilation.
- **Architecture:** Review and discussion of deep learning concepts and their fit to weather data properties. Not a new model.
- **Data:** No new data.
- **Main result:** Concludes that replacing NWP is not inconceivable but requires fundamental breakthroughs.
- **Open work:** Physical constraints, uncertainty quantification, handling of extremes and end-to-end DL from observations.
- **Issues:** Pre-2022 perspective; ML global models have since matched or beaten NWP on many metrics, though still relying on reanalysis-based training.
- *Basis: assessment*

### [Machine learning and artificial intelligence to aid climate change research and preparedness](https://doi.org/10.1088/1748-9326/ab4e55)
Huntingford et al. (2019), *Environmental Research Letters*. 395 citations.

- **Main goal:** Argue for broader use of ML and AI to understand the climate system and support adaptation.
- **Architecture:** Perspective covering ML for teleconnection discovery, analysis of Earth system model output and enhanced warnings of extreme events.
- **Data:** No new data; refers to observations and ESM simulations.
- **Main result:** Recommends a parallel emphasis on ML/AI to exploit existing data and simulations alongside ESM development.
- **Open work:** Concrete demonstrations of ML-discovered teleconnections and AI-based early warning systems.
- **Issues:** Perspective without new quantitative results.
- *Basis: abstract*

### [Earth System Modeling 2.0: A Blueprint for Models That Learn From Observations and Targeted High‐Resolution Simulations](https://doi.org/10.1002/2017gl076101)
Schneider et al. (2017), *Geophysical Research Letters*. 388 citations.

- **Main goal:** Proposes reducing climate projection uncertainty by having Earth system model parameterizations learn from observations and high-resolution simulations.
- **Architecture:** Blueprint combining data assimilation and machine learning (e.g., ensemble Kalman inversion) to calibrate parameterizations by matching low-order statistics.
- **Data:** Illustration with a simple chaotic dynamical system (Lorenz 96 type); proposes global observations and targeted LES/cloud-resolving simulations.
- **Main result:** Shows with a toy system that parameters can be learned from time-averaged statistics; outlines the framework and its opportunities.
- **Open work:** Realizing the framework in a full ESM, designing targeted high-resolution simulations and quantifying uncertainty.
- **Issues:** Perspective with only a toy demonstration; scalability to real models is untested.
- *Basis: abstract+knowledge*

### [A digital twin of Earth for the green transition](https://doi.org/10.1038/s41558-021-00986-y)
Bauer et al. (2021), *Nature Climate Change*. 377 citations.

- **Main goal:** Argues for building digital twins of Earth to inform climate adaptation and mitigation decisions in the green transition.
- **Architecture:** Perspective on combining km-scale Earth system simulation, observations, data assimilation, ML and exascale computing into interactive information systems (linked to the EU Destination Earth initiative). Not a new ML method.
- **Data:** No new data.
- **Main result:** Outlines the vision, required computing and data infrastructure, and the role of ML for emulation and processing.
- **Open work:** Realize the infrastructure, international coordination and user interaction the vision requires.
- **Issues:** Vision paper without quantitative results; abstract not available here, so content is from knowledge of the paper.
- *Basis: assessment*

### [Using Artificial Intelligence to Improve Real-Time Decision-Making for High-Impact Weather](https://doi.org/10.1175/bams-d-16-0123.1)
McGovern et al. (2017), *Bulletin of the American Meteorological Society*. 372 citations.

- **Main goal:** Shows how AI and machine learning can support real-time forecaster decision-making for high-impact weather.
- **Architecture:** Review with examples, mainly tree-based methods (random forests, gradient boosted trees) and other ML used for diagnosing and predicting hazards.
- **Data:** Examples use NWP model output, radar and satellite observations for hazards such as severe hail, storm duration, precipitation and aviation turbulence.
- **Main result:** ML methods improve over traditional approaches in several high-impact weather applications and can be used in real time.
- **Open work:** Wider operational adoption, interpretability for forecasters, and integration with ensemble forecasts.
- **Issues:** Predates deep learning prevalence in the field; case-based evidence rather than systematic comparison. Abstract unavailable.
- *Basis: assessment*

### [Using Machine Learning to Parameterize Moist Convection: Potential for Modeling of Climate, Climate Change, and Extreme Events](https://doi.org/10.1029/2018ms001351)
O'Gorman et al. (2018), *Journal of Advances in Modeling Earth Systems*. 346 citations.

- **Main goal:** Test how ML convection parameterizations behave when coupled to a GCM and whether they can simulate climate change and extremes.
- **Architecture:** Random forest (ensemble of decision trees) trained to emulate a conventional moist convection scheme; predicting averages of training samples guarantees energy conservation and nonnegative precipitation.
- **Data:** Output from an idealized aquaplanet GCM with a conventional convection scheme, in control and warm climates.
- **Main result:** Coupled GCM runs stably and reproduces climate statistics including precipitation extremes; climate change is captured if training includes both climates or only the warm climate, but not with control-only training.
- **Open work:** Training on high-resolution or cloud-resolving data rather than a conventional scheme; realistic GCM configurations.
- **Issues:** Idealized setting emulating an existing scheme; poor extrapolation to unseen climates; random forests are memory-intensive.
- *Basis: abstract+knowledge*

### [Artificial intelligence for modeling and understanding extreme weather and climate events](https://doi.org/10.1038/s41467-025-56573-8)
Camps-Valls et al. (2025), *Nature Communications*. 306 citations.

- **Main goal:** Reviews AI for detecting, modeling and understanding extreme weather and climate events.
- **Architecture:** Review of AI methods for floods, droughts, wildfires, heatwaves and other extremes, with emphasis on explainability and reliability.
- **Data:** Literature review; no new data.
- **Main result:** Highlights challenges of limited and noisy data, real-time integration, and interpretable deployment, and how AI can help identify and explain extremes.
- **Open work:** Interdisciplinary development of practical, trustworthy AI for disaster readiness and risk reduction.
- **Issues:** Broad scope; qualitative synthesis without quantitative benchmarks.
- *Basis: abstract*

### [Machine Learning With Data Assimilation and Uncertainty Quantification for Dynamical Systems: A Review](https://doi.org/10.1109/jas.2023.123537)
Cheng et al. (2023), *IEEE/CAA Journal of Automatica Sinica*. 305 citations.

- **Main goal:** Reviews how machine learning is combined with data assimilation and uncertainty quantification for high-dimensional dynamical systems.
- **Architecture:** Review covering ML for system identification, reduced-order surrogate models, error covariance specification, and model error correction within DA and UQ.
- **Data:** Not applicable; covers applications from computational fluid dynamics to geoscience and climate.
- **Main result:** Provides a structured overview of how ML can address limits of DA and UQ and how DA and UQ can improve ML accuracy and interpretability.
- **Open work:** Perspectives on further integration of ML with DA and UQ, including scalability to operational systems.
- **Issues:** Broad scope across disciplines, so atmospheric- and ocean-specific depth is limited.
- *Basis: abstract*

### [Machine Learning in Weather Prediction and Climate Analyses—Applications and Perspectives](https://doi.org/10.3390/atmos13020180)
Bochenek et al. (2022), *Atmosphere*. 304 citations.

- **Main goal:** Map the recent literature on machine learning in numerical weather prediction and climate analysis to identify dominant topics and future directions.
- **Architecture:** Bibliometric review of the 500 most relevant articles since 2018 (Google Scholar) with topic extraction and critical discussion.
- **Data:** Database of 500 article abstracts, analysed for topics, variables, methods and countries.
- **Main result:** Most common topics: renewable energy forecasting and atmospheric processes in NWP; parameterizations, extremes and climate change in climate research; leading methods are deep learning, RF, ANN, SVM and XGBoost; China and the USA lead.
- **Open work:** Authors expect ML to become a key component of future weather forecasting.
- **Issues:** Search-engine-based selection may be biased; abstract-level topic analysis is shallow; predates the 2022-2023 surge of global ML weather models.
- *Basis: assessment*

### [The rise of data-driven weather forecasting: A first statistical assessment of machine learning-based weather forecasts in an operational-like context](https://doi.org/10.1175/bams-d-23-0162.1)
Bouallégue et al. (2023), *Bulletin of the American Meteorological Society*. 289 citations.

- **Main goal:** Assesses for the first time an ML weather model against operational NWP in an operational-like setup with identical initial conditions.
- **Architecture:** Verification study (not a new model) comparing Pangu-Weather with the ECMWF IFS using standard forecast verification tools.
- **Data:** Pangu-Weather and IFS forecasts initialized from the operational IFS analysis; verified against IFS analysis and synoptic observations.
- **Main result:** Comparable accuracy for global metrics and extreme events; drawbacks are overly smooth fields, bias growing with lead time, and poor tropical cyclone intensity.
- **Open work:** Probabilistic ML forecasts and operational integration of ML models initialized from analyses.
- **Issues:** Deterministic only; one ML model; evaluation partly against the IFS analysis, which favors IFS.
- *Basis: abstract*

### [Towards neural Earth system modelling by integrating artificial intelligence in Earth system science](https://doi.org/10.1038/s42256-021-00374-3)
Irrgang et al. (2021), *Nature Machine Intelligence*. 288 citations.

- **Main goal:** Examines how AI could augment or replace parts of Earth system models and proposes integrating them into hybrid systems.
- **Architecture:** Perspective that proposes 'neural Earth system modelling': learning, self-validating and interpretable hybrids that combine ESMs and deep neural networks.
- **Data:** No new data.
- **Main result:** Surveys achievements and limitations of process-based and AI approaches and discusses the potential and pitfalls of neural ESMs.
- **Open work:** Leaves open whether AI can bolster ESMs or ultimately make them obsolete; calls for hybrid systems that use observational data streams.
- **Issues:** Conceptual; offers no implementation or quantitative evidence.
- *Basis: abstract*

### [Statistical Postprocessing for Weather Forecasts: Review, Challenges, and Avenues in a Big Data World](https://doi.org/10.1175/bams-d-19-0308.1)
Vannitsem et al. (2020), *Bulletin of the American Meteorological Society*. 284 citations.

- **Main goal:** Reviews statistical postprocessing of weather forecasts and its challenges in a big-data, high-resolution ensemble era.
- **Architecture:** Review spanning bias correction, distribution-adjusting methods (EMOS, BMA, quantile regression), multivariate dependence reconstruction, ML methods and operational practice.
- **Data:** No new data; synthesizes literature and operational experience at national meteorological services.
- **Main result:** Identifies key challenges: km-scale ensembles with huge data volumes, preserving space-time correlations, model upgrades, blending forecasts, and research-to-operations transfer.
- **Open work:** Develop methods that scale, maintain multivariate coherence, and remain robust to NWP model changes.
- **Issues:** Review; ML methods are covered but the field has evolved quickly since publication.
- *Basis: abstract+knowledge*

### [Deep Learning-Based Weather Prediction: A Survey](https://doi.org/10.1016/j.bdr.2020.100178)
Ren et al. (2021), *Big Data Research*. 248 citations.

- **Main goal:** Surveys deep learning-based weather prediction (DLWP) as a supplement to numerical weather prediction, which faces gaps in physical understanding, observation use and computing cost.
- **Architecture:** Literature review organized by neural network architecture, spatial and temporal scales, and datasets and benchmarks; compares DLWP with conventional NWP.
- **Data:** No new data; covers published studies and the datasets and benchmarks they use.
- **Main result:** Summarizes the state of DLWP as of 2021, describing preliminary but promising results, and lists advantages and disadvantages relative to NWP.
- **Open work:** The authors list future research topics for DLWP; the review predates the 2022-2023 global ML forecast models.
- **Issues:** Predates GraphCast, Pangu-Weather and similar models, so its picture of the state of the art is now outdated; the abstract gives no quantitative synthesis.
- *Basis: assessment*

### [Machine Learning in Tropical Cyclone Forecast Modeling: A Review](https://doi.org/10.3390/atmos11070676)
Chen et al. (2020), *Atmosphere*. 223 citations.

- **Main goal:** Review how machine learning is used to overcome bottlenecks in tropical cyclone forecasting.
- **Architecture:** Literature review covering ML for TC genesis, track, intensity, associated wind and rain extremes, storm surge, and improvement of numerical forecast models.
- **Data:** No new data; synthesizes published studies using satellite, reanalysis, best-track and model data.
- **Main result:** ML shows promise both as pure data-driven models and in enhancing numerical models, but its potential and available multi-source data are not yet fully exploited.
- **Open work:** Exploit multi-source data more fully and improve predictability periods and stability of ML-based TC forecasts.
- **Issues:** Narrative review without quantitative comparison; predates recent global ML weather models with TC track skill.
- *Basis: assessment*

### [The digital revolution of Earth-system science](https://doi.org/10.1038/s43588-021-00023-0)
Bauer et al. (2021), *Nature Computational Science*. 214 citations.

- **Main goal:** Discusses how digital technologies (HPC, data handling and ML) must transform Earth system science and prediction.
- **Architecture:** Perspective covering computing hardware trends, software and programming models, data workflows, ML, and digital twins of the Earth.
- **Data:** No new data.
- **Main result:** Argues for co-design of models, software and hardware, wider use of ML and data-centric workflows, and building digital twins that combine high-resolution simulation with observations.
- **Open work:** Implement the vision through large programmes such as Destination Earth.
- **Issues:** Perspective without quantitative results. Abstract unavailable, so the summary relies on general knowledge of the paper.
- *Basis: assessment*

### [Machine Learning Methods in Weather and Climate Applications: A Survey](https://doi.org/10.20944/preprints202309.1764.v2)
Chen et al. (2023), *Applied Sciences*. 210 citations.

- **Main goal:** Surveys ML methods for weather and climate prediction across time scales, aiming to link short-term weather and long-term climate forecasting.
- **Architecture:** Literature survey of more than 20 methods, highlighting eight promising techniques for short-term weather and medium-to-long-term climate prediction.
- **Data:** Not applicable; based on published studies.
- **Main result:** ML is strong for short-term weather prediction but remains limited for medium-to-long-term climate forecasting because of complex variables and data limitations.
- **Open work:** Integrating models across time scales and paying more attention to model structure and recent advances.
- **Issues:** Broad survey with limited depth; selection criteria for the eight techniques are not clear from the abstract.
- *Basis: abstract*

### [Pushing the frontiers in climate modelling and analysis with machine learning](https://doi.org/10.1038/s41558-024-02095-y)
Eyring et al. (2024), *Nature Climate Change*. 188 citations.

- **Main goal:** Perspective on how machine learning can advance climate modelling and analysis of climate model output and observations.
- **Architecture:** Perspective/review spanning ML parameterizations, hybrid and fully data-driven emulators, and ML-based analysis and evaluation of climate data.
- **Data:** Draws on published studies; no new data. Abstract not available.
- **Main result:** Argues ML can reduce long-standing climate model biases and uncertainties, especially through hybrid physics-ML approaches, while noting limitations.
- **Open work:** Likely includes building stable hybrid models, physical consistency, interpretability, and robust generalization to future climates.
- **Issues:** Abstract not available; details inferred from title and general knowledge of this perspective.
- *Basis: assessment*

### [Machine learning for numerical weather and climate modelling: a review](https://doi.org/10.5194/gmd-16-6433-2023)
Burgh-Day et al. (2023), *Geoscientific Model Development*. 186 citations.

- **Main goal:** Provide a primer and chronological review of machine learning applied to numerical weather and climate modelling.
- **Architecture:** Review covering ML for solvers and preconditioners, parameterization emulation and replacement, and full ML prediction models, plus key ML terminology and ethical considerations.
- **Data:** No new data; synthesizes literature from early publications to about 2023.
- **Main result:** ML applications in weather and climate modelling have become competitive with knowledge-based alternatives in the last decade; summarizes progress and methods.
- **Open work:** Discusses future directions, including hybrid models and broader use of ML in model development.
- **Issues:** Fast-moving field means coverage is quickly dated; qualitative review.
- *Basis: assessment*

### [Opportunities and challenges for machine learning in weather and climate modelling: hard, medium and soft AI](https://doi.org/10.1098/rsta.2020.0083)
Chantry et al. (2021), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 151 citations.

- **Main goal:** Introduces a theme issue on ML for weather and climate modelling and outlines motivations, opportunities and challenges arising from a 2019 Oxford workshop.
- **Architecture:** Perspective and editorial. It categorizes ML uses as 'hard', 'medium' and 'soft' AI, according to how deeply ML replaces or augments physics-based components.
- **Data:** No new data.
- **Main result:** Provides a framing of opportunities (emulation, parametrization, postprocessing, data assimilation) and challenges for ML in weather and climate prediction.
- **Open work:** Points to the articles in the theme issue and to community efforts on benchmarks, trust and hybrid modelling.
- **Issues:** Short introductory piece without new results; the abstract gives few specifics.
- *Basis: assessment*

### [Early warning of complex climate risk with integrated artificial intelligence](https://doi.org/10.1038/s41467-025-57640-w)
Reichstein et al. (2025), *Nature Communications*. 149 citations.

*Summary pending.*

### [Bridging observations, theory and numerical simulation of the ocean using machine learning](https://doi.org/10.1088/1748-9326/ac0eb0)
Sonnewald et al. (2021), *Environmental Research Letters*. 143 citations.

- **Main goal:** Reviews how machine learning can advance physical oceanography across observations, theory and numerical modelling.
- **Architecture:** Review of ML tools (supervised, unsupervised, interpretable ML) applied to in situ and satellite observations, theoretical discovery, parameterizations, model bias correction and data assimilation.
- **Data:** No new data; literature synthesis.
- **Main result:** Identifies ocean-specific challenges (sparse, surface-limited observations, wide range of timescales, coastlines) and areas of imminent potential.
- **Open work:** Advance ML parameterizations, ML-aided data assimilation and interpretable ML for discovery.
- **Issues:** Review; risks of ML in oceanography are noted but not quantified.
- *Basis: abstract*

### [Machine Learning for Model Error Inference and Correction](https://doi.org/10.1029/2020ms002232)
Bonavita et al. (2020), *Journal of Advances in Modeling Earth Systems*. 137 citations.

- **Main goal:** Explores whether machine learning can estimate and correct systematic model error in operational NWP, building on weak-constraint 4D-Var model-error estimation.
- **Architecture:** Artificial neural networks trained to predict model error (as estimated from analysis increments / weak-constraint 4D-Var) from the model state, then used within the weak-constraint 4D-Var framework.
- **Data:** ECMWF IFS operational configuration: analysis and forecast fields and associated model-error estimates.
- **Main result:** ANNs reproduce the main results of weak-constraint 4D-Var model-error estimation and could extend model-error correction from the stratosphere to the whole atmospheric column.
- **Open work:** Full integration of ML model-error terms in operational DA cycles, and broader integration of ML within DA and forecasting rather than purely data-driven forecasting.
- **Issues:** Partly a perspective; corrections target systematic errors learned from the system's own analyses; flow-dependent random errors and tropospheric observability remain challenging.
- *Basis: assessment*

### [Artificial intelligence for climate prediction of extremes: State of the art, challenges, and future perspectives](https://doi.org/10.1002/wcc.914)
Materia et al. (2024), *WIREs Climate Change*. 129 citations.

- **Main goal:** Reviews AI methods for predicting extremes at subseasonal to decadal time scales.
- **Architecture:** Review of ML and deep learning predictions, causal discovery, explainable AI, and hybrid AI-climate model approaches.
- **Data:** Not applicable; based on published studies.
- **Main result:** AI shows potential for predicting extremes and linking them to drivers; hybrid approaches improve skill; best practices are proposed.
- **Open work:** Data curation, uncertainty, generalizability, and reproducibility of methods and workflows.
- **Issues:** Review-level; extremes are rare, so sample sizes are small in many reviewed studies.
- *Basis: abstract*

### [Enhancing Regional Climate Downscaling Through Advances in Machine Learning](https://doi.org/10.1175/aies-d-23-0066.1)
Rampal et al. (2024), *Artificial Intelligence for the Earth Systems*. 128 citations.

- **Main goal:** Reviews machine learning for regional climate downscaling, motivated by the cost of dynamical downscaling and doubts about empirical methods in future climates.
- **Architecture:** Review of ML downscaling approaches (perfect prognosis and RCM emulators), training strategies, and a proposed evaluation framework specific to ML downscaling.
- **Data:** Published downscaling studies using GCM, RCM and observational datasets; no new model is trained.
- **Main result:** Synthesizes how ML can emulate dynamical models or learn perfect-prognosis relationships, identifies training strategies that mitigate extrapolation issues, and proposes a transparent evaluation framework.
- **Open work:** Testing out-of-distribution performance in future climates, representation of extremes, and adoption of standardized evaluation protocols.
- **Issues:** Extrapolation to warmer climates and extreme events remains uncertain and cannot be fully verified with historical observations.
- *Basis: abstract*

### [Artificial Intelligence Revolutionises Weather Forecast, Climate Monitoring and Decadal Prediction](https://doi.org/10.3390/rs13163209)
Dewitte et al. (2021), *Remote Sensing*. 110 citations.

- **Main goal:** Reviews and argues for the transformative role of AI in weather forecasting, climate monitoring and decadal prediction.
- **Architecture:** Review/perspective of AI techniques applied across weather forecasting, climate monitoring and decadal prediction; no new model.
- **Data:** Not applicable; review of literature.
- **Main result:** AI can reduce development effort, use computing more efficiently and improve forecast quality; argues for training scientists combining atmospheric and AI expertise.
- **Open work:** Integration of AI as a cornerstone of observation and modelling systems; workforce training.
- **Issues:** Perspective piece with optimistic framing; no new quantitative evaluation.
- *Basis: assessment*

### [Machine learning for the physics of climate](https://doi.org/10.1038/s42254-024-00776-3)
Bracco et al. (2024), *Nature Reviews Physics*. 107 citations.

- **Main goal:** Reviews how machine learning advances understanding and prediction of the physical climate system.
- **Architecture:** Review focused on ML for observational reconstruction, sub-grid-scale parameterization, causal analysis and weather-to-interannual prediction.
- **Data:** Literature review; no new data.
- **Main result:** ML has extended observational records, enabled learned parameterizations toward hybrid models, and improved predictions from weather to ENSO at much lower computational cost.
- **Open work:** Building physically consistent hybrid models and addressing challenges of applying ML to complex, nonstationary systems.
- **Issues:** Review; claims of breaking predictability barriers depend on the cited studies and their evaluation setups.
- *Basis: abstract*

### [S2S reboot: An argument for greater inclusion of machine learning in subseasonal to seasonal forecasts](https://doi.org/10.1002/wcc.567)
Cohen et al. (2018), *WIREs Climate Change*. 99 citations.

- **Main goal:** Argue that subseasonal-to-seasonal (S2S) prediction should incorporate modern statistical and machine learning methods alongside dynamical models.
- **Architecture:** Opinion article with an illustrative unsupervised-learning seasonal forecast example and a summary of ML methods applicable to climate prediction; not a new model.
- **Data:** Seasonal forecast examples and real-time dynamical forecasts versus observations for winter 2017/2018, including a mid-winter polar vortex disruption.
- **Main result:** An unsupervised learning example beats dynamical systems in a seasonal case, and statistical forecasts better predicted surface impacts of the 2018 polar vortex disruption than dynamical models, which were largely insensitive to vortex variability.
- **Open work:** Develop hybrid dynamical-statistical S2S systems and test ML methods systematically on long hindcasts.
- **Issues:** Evidence is anecdotal (single season, selected examples) rather than a systematic verification; opinion piece.
- *Basis: abstract*

### [Machine learning for weather and climate are worlds apart](https://doi.org/10.1098/rsta.2020.0098)
Watson-Parris (2020), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 86 citations.

- **Main goal:** Argues that ML emulation of weather (initial-value problem) and climate (boundary-value problem) models should be approached differently, and surveys climate model emulation.
- **Architecture:** Perspective/review of climate-model emulation, including statistical emulators of steady-state responses and their use in parameter estimation and inverse problems. Not a new ML method.
- **Data:** No new data; draws on existing climate-model emulation literature.
- **Main result:** Concludes that emulating full atmospheric dynamics is often unnecessary for climate questions, and that recent ML advances offer new opportunities despite limited training data and nonlinearity.
- **Open work:** Develop emulators that handle limited training samples, provide uncertainty, and address inverse problems such as parameter calibration.
- **Issues:** Opinion piece without quantitative evaluation; the field has since moved quickly (e.g., autoregressive climate emulators).
- *Basis: assessment*

### [Harnessing AI and computing to advance climate modelling and prediction](https://doi.org/10.1038/s41558-023-01769-3)
Schneider et al. (2023), *Nature Climate Change*. 85 citations.

- **Main goal:** Perspective on how AI and advances in computing can be used to improve climate modeling and prediction.
- **Architecture:** Perspective/commentary, not a new model; discusses combining physics-based models, km-scale simulation, and machine learning (e.g., learned parameterizations, emulators).
- **Data:** Not applicable (no abstract available); draws on the published literature.
- **Main result:** Not reported in the abstract (abstract unavailable); argues for a strategic combination of physics, high-resolution simulation, and data-driven learning.
- **Open work:** Building community infrastructure and hybrid physics-ML models that remain trustworthy for climate projections.
- **Issues:** Opinion piece; content inferred from the title and author group, so the card should be checked against the full text.
- *Basis: assessment*

### [AI-empowered next-generation multiscale climate modelling for mitigation and adaptation](https://doi.org/10.1038/s41561-024-01527-w)
Eyring et al. (2024), *Nature Geoscience*. 84 citations.

- **Main goal:** Perspective on using AI with multiscale climate models to better support mitigation and adaptation.
- **Architecture:** Perspective; abstract unavailable. Discusses hybrid physics-AI climate modeling and km-scale simulation.
- **Data:** Not applicable.
- **Main result:** Not reported (no abstract available).
- **Open work:** Developing hybrid models that are physically consistent, interpretable, and useful for regional adaptation.
- **Issues:** Card is based on the title and author group only.
- *Basis: assessment*

### [Deep learning for spatiotemporal forecasting in Earth system science: a review](https://doi.org/10.1080/17538947.2024.2391952)
Yu et al. (2024), *International Journal of Digital Earth*. 82 citations.

- **Main goal:** Surveys how deep learning is used for spatiotemporal forecasting across Earth system science domains and what challenges remain.
- **Architecture:** Literature review of 69 studies covering common DL architectures (CNNs, RNN/LSTMs, transformers, graph networks, hybrids), technical innovations and applications.
- **Data:** Published studies spanning climate and weather prediction, disasters, air quality, hydrology, renewable energy, oceanography and environmental monitoring.
- **Main result:** DL handles spatiotemporal data well, with growing efforts to integrate physics, improve explainability, adapt architectures to domains and quantify uncertainty.
- **Open work:** Calls for interpretable hybrid DL-physics models, better generalization via domain adaptation and transfer learning, and advances in uncertainty quantification and missing-data handling.
- **Issues:** Broad multi-domain scope with a modest sample of 69 studies, so coverage of atmospheric and ocean ML (e.g. recent global weather models) is necessarily shallow.
- *Basis: assessment*

### [Leveraging Modern Artificial Intelligence for Remote Sensing and NWP: Benefits and Challenges](https://doi.org/10.1175/bams-d-18-0324.1)
Boukabara et al. (2019), *Bulletin of the American Meteorological Society*. 80 citations.

- **Main goal:** Discuss how modern AI/ML can transform satellite remote sensing and NWP and what challenges remain.
- **Architecture:** Review and perspective covering ML for quality control, retrievals, data fusion, forward/inverse problems, data assimilation and prediction.
- **Data:** Examples from NOAA satellite remote sensing and NWP applications.
- **Main result:** Argues ML can accelerate data exploitation and prediction by complementing existing systems and, where appropriate, replacing NWP chain components.
- **Open work:** Operational integration, handling new data streams (SmallSats, IoT), and validation of ML components.
- **Issues:** Perspective with illustrative examples rather than systematic evaluation.
- *Basis: abstract*

### [Towards implementing artificial intelligence post-processing in weather and climate: proposed actions from the Oxford 2019 workshop](https://doi.org/10.1098/rsta.2020.0091)
Haupt et al. (2021), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 77 citations.

- **Main goal:** Advances AI-based postprocessing of weather and climate model output, likely the most mature AI application in atmospheric science.
- **Architecture:** Review and position paper with proposed actions. It also creates a repository of five archived benchmark datasets with Jupyter notebooks and baseline methods.
- **Data:** Five datasets from real weather and climate postprocessing problems (details not given in the abstract).
- **Main result:** Proposes medium-term goals: trustworthy, interpretable algorithms; FAIR data; and physics-aware techniques. It initiates a shared dataset repository with baselines.
- **Open work:** Encourages the community to test algorithms against the baselines, archive results and expand the repository.
- **Issues:** Five datasets are a narrow benchmark, and community uptake determines its value.
- *Basis: abstract*

### [Analysis, characterization, prediction, and attribution of extreme atmospheric events with machine learning and deep learning techniques: a review](https://doi.org/10.1007/s00704-023-04571-5)
Salcedo-Sanz et al. (2023), *Theoretical and Applied Climatology*. 75 citations.

- **Main goal:** Review ML and deep learning for analysis, characterization, prediction and attribution of atmospheric extreme events.
- **Architecture:** Review of common ML/DL techniques and literature on extremes, plus a case study on extreme temperature prediction.
- **Data:** Review; covers rainfall/floods, heatwaves, droughts, severe weather and fog/low-visibility studies.
- **Main result:** Provides a critical review and case study, with conclusions and perspectives for the field.
- **Open work:** Outlooks for attribution and interpretability are discussed.
- **Issues:** Broad scope; case study is illustrative.
- *Basis: abstract*

### [Machine Learning for Climate Physics and Simulations](https://doi.org/10.1146/annurev-conmatphys-043024-114758)
Lai et al. (2024), *Annual Review of Condensed Matter Physics*. 64 citations.

- **Main goal:** Reviews machine learning for climate physics and for climate simulation, emphasizing generalizability in the small-data, nonstationary regime.
- **Architecture:** Review covering supervised learning, unsupervised learning and equation discovery for (a) discovering climate physics and (b) emulating and parameterizing climate simulations.
- **Data:** Literature review; no new data.
- **Main result:** Argues physics-free ML works when data are abundant and stationary, but long-term future climate is a small-data regime where physics knowledge and interpretability are crucial.
- **Open work:** Closer collaboration across climate physics, ML theory and numerical analysis to build reliable ML climate models.
- **Issues:** Perspective-style review; conclusions are qualitative.
- *Basis: abstract*

### [Challenges and benchmark datasets for machine learning in the atmospheric sciences: Definition, status and outlook](https://doi.org/10.1175/aies-d-21-0002.1)
Dueben et al. (2022), *Artificial Intelligence for the Earth Systems*. 62 citations.

- **Main goal:** Defines what benchmark datasets for ML in atmospheric sciences should be, since an unclear definition confuses domain scientists.
- **Architecture:** Perspective that gives a recipe for building benchmark datasets, plus a list of domain-specific challenges and the benchmarks needed for each.
- **Data:** No new data; reviews existing benchmarks (for example WeatherBench) across weather, climate and air quality.
- **Main result:** Provides a recipe and list of needed benchmarks to make ML efforts more coherent and aimed at key challenges.
- **Open work:** Create the proposed benchmarks and engage ML and HPC communities.
- **Issues:** Conceptual; the list of challenges is non-exclusive, and benchmarks risk narrowing research focus.
- *Basis: abstract*

### [Outlook for Exploiting Artificial Intelligence in the Earth and Environmental Sciences](https://doi.org/10.1175/bams-d-20-0031.1)
Boukabara et al. (2020), *Bulletin of The American Meteorological Society - (BAMS)*. 58 citations.

- **Main goal:** Identifies opportunities and obstacles for AI in Earth and environmental sciences, especially satellite data exploitation and NWP at NOAA.
- **Architecture:** Community report synthesizing the first NOAA workshop on AI for satellite Earth observations and NWP (April 2019), including discussions and polling. Not a new ML method.
- **Data:** Input from more than 400 participants across public, academic and private sectors.
- **Main result:** Describes paths to use AI on massive satellite and in situ data volumes for NWP and reports recommendations for scientists and decision-makers.
- **Open work:** Implement recommendations on infrastructure, training, data readiness and operational transition of AI tools.
- **Issues:** Workshop-based opinion and polling rather than quantitative evidence; recommendations predate the 2022+ wave of ML weather models.
- *Basis: assessment*

### [A Review of Recent and Emerging Machine Learning Applications for Climate Variability and Weather Phenomena](https://doi.org/10.1175/aies-d-22-0086.1)
Molina et al. (2023), *Artificial Intelligence for the Earth Systems*. 56 citations.

- **Main goal:** Review recent and emerging ML applications for climate variability and weather phenomena that cause extremes, following a community workshop.
- **Architecture:** Review spanning predictability of climate modes, feature detection, extreme prediction and precursors, observation-model integration, downscaling and bias correction.
- **Data:** Review; covered studies use observations, reanalysis and climate model output.
- **Main result:** Summarizes advances, challenges and research priorities for domain scientists and ML practitioners.
- **Open work:** Research priorities identified include interpretability, uncertainty, and physical consistency.
- **Issues:** Broad scope with limited depth per topic; qualitative.
- *Basis: abstract*

### [Advances and prospects of deep learning for medium-range extreme weather forecasting](https://doi.org/10.5194/gmd-17-2347-2024)
Olivetti et al. (2024), *Geoscientific Model Development*. 54 citations.

- **Main goal:** Assess whether deep learning medium-range weather models can forecast extreme weather robustly.
- **Architecture:** Review of recent deep learning weather forecasting models and the challenges extremes pose; proposes a foundational workflow for extreme-focused models.
- **Data:** Not applicable (review); covers models trained mostly on ERA5.
- **Main result:** Identifies limitations of leading models for extremes and argues data-driven models need to be tailored to extreme events.
- **Open work:** Implementing the proposed workflow, including extreme-aware losses, evaluation and data.
- **Issues:** Review; rapidly evolving field so specific model assessments may date quickly.
- *Basis: assessment*

### [Opinion: Optimizing climate models with process knowledge, resolution, and artificial intelligence](https://doi.org/10.5194/acp-24-7041-2024)
Schneider et al. (2024), *Atmospheric Chemistry and Physics*. 47 citations.

- **Main goal:** Argue for how to accelerate climate model improvement combining process knowledge, resolution and AI.
- **Architecture:** Opinion piece: AI-derived closure functions embedded in process-based parameterizations with conservation laws, plus moderately increased resolution around 10 km.
- **Data:** Not applicable (opinion); proposes learning from observations and high-resolution simulations.
- **Main result:** Recommends a balanced approach and argues resolution beyond about 10 km would hinder ensembles needed for calibration and uncertainty quantification.
- **Open work:** Implementing hybrid parameterizations and calibration frameworks in full climate models.
- **Issues:** Perspective rather than demonstration; trade-offs depend on future computing.
- *Basis: assessment*

### [A Review of Machine Learning for Convective Weather](https://doi.org/10.1175/aies-d-22-0077.1)
McGovern et al. (2023), *Artificial Intelligence for the Earth Systems*. 38 citations.

- **Main goal:** Review AI/ML for forecasting convective weather and hazards (tornadoes, hail, wind, lightning), which are damaging and hard to predict.
- **Architecture:** Review covering traditional ML (support vector machines, decision trees, random forests) and deep learning approaches for convective hazards.
- **Data:** Review; covered studies use radar, satellite, NWP output and storm reports.
- **Main result:** Synthesizes the state of the art and highlights challenges across spatial and temporal scales.
- **Open work:** Trustworthy AI usable by forecasters in real time, and cross-sector testbeds to validate ML operationally.
- **Issues:** Rapidly evolving field; review is largely US-focused and qualitative.
- *Basis: abstract*

### [Deep Learning and Foundation Models for Weather Prediction: A Survey](https://arxiv.org/abs/2501.06907)
Shi et al. (2025), *Proceedings of the Thirty-Fifth International Joint Conference on Artificial Intelligence*. 32 citations.

*Summary pending.*

### [Applications of Machine Learning and Artificial Intelligence in Tropospheric Ozone Research](https://doi.org/10.5194/gmd-18-8777-2025)
Hickman et al. (2025), *Geoscientific Model Development*. 17 citations.

*Summary pending.*

### [Artificial intelligence to support cross-disciplinary climate change research](https://doi.org/10.1038/s41558-026-02624-x)
Ou et al. (2026), *Nature Climate Change*. 7 citations.

*Summary pending.*

### [Rewiring climate modeling with machine learning emulators](https://doi.org/10.1038/s43247-026-03238-z)
Vankatwyk et al. (2026), *Communications Earth & Environment*. 6 citations.

*Summary pending.*

### [Recommendations for Comprehensive and Independent Evaluation of Machine Learning‐Based Earth System Models](https://doi.org/10.1029/2024jh000496)
Ullrich et al. (2025), *Journal of Geophysical Research*. 1 citations.

*Summary pending.*

### [2026 ECMWF-ESA workshop report: current status, progress and opportunities in machine learning for Earth system observation and prediction](https://doi.org/10.1038/s41612-026-01486-6)
Bonavita et al. (2026), *npj Climate and Atmospheric Science*. 0 citations.

*Summary pending.*

### [Artificial intelligence for atmospheric chemistry: from observation to process understanding](https://doi.org/10.1038/s41612-026-01559-6)
Wang et al. (2026), *npj Climate and Atmospheric Science*. 0 citations.

*Summary pending.*

<a id="weather"></a>
## Medium-range weather

### [Accurate medium-range global weather forecasting with 3D neural networks](https://doi.org/10.1038/s41586-023-06185-3)
Bi et al. (2023), *Nature*. 2,087 citations.

- **Main goal:** Achieve medium-range global weather forecasts more accurate than the best operational NWP with AI.
- **Architecture:** Pangu-Weather: 3D Earth-Specific Transformer with Earth-specific positional bias, plus hierarchical temporal aggregation using models at 1, 3, 6 and 24 h steps.
- **Data:** ERA5 at 0.25 degree, 39 years of data (training 1979-2017; testing on 2018).
- **Main result:** Better deterministic scores than ECMWF operational IFS on all tested variables against reanalysis; also better tropical cyclone tracking than ECMWF-HRES when initialized from reanalysis.
- **Open work:** Operational initial conditions, more variables (e.g. precipitation), and ensembles.
- **Issues:** Evaluated against reanalysis and initialized from reanalysis; smooth forecasts; underestimates extreme intensities; no precipitation output.
- *Basis: abstract+knowledge*

### [Learning skillful medium-range global weather forecasting](https://doi.org/10.1126/science.adi2336)
Lam et al. (2023), *Science*. 2,081 citations.

- **Main goal:** Builds a machine learning model that beats operational deterministic NWP for global medium-range forecasting at 0.25 degrees.
- **Architecture:** GraphCast: graph neural network encoder-processor-decoder on an icosahedral multimesh, autoregressive with 6 h steps, about 37M parameters.
- **Data:** ERA5 0.25 degrees, 37 pressure levels; trained on 1979-2017 and tested on 2018 against ECMWF HRES (verified against HRES analysis at t=0).
- **Main result:** Outperforms HRES on 90% of 1380 verification targets for 10-day forecasts, produced in under one minute on a single TPU; better tropical cyclone tracks, atmospheric rivers, and extreme temperatures.
- **Open work:** Probabilistic forecasts, reduced blurring at long leads, and operational use with real-time analyses.
- **Issues:** Deterministic MSE training leads to smoothing at long lead times; trained on reanalysis so inherits its biases; underestimates tropical cyclone intensity; relies on NWP-based initial conditions.
- *Basis: abstract+knowledge*

### [FourCastNet: A Global Data-driven High-resolution Weather Model using Adaptive Fourier Neural Operators](https://arxiv.org/abs/2202.11214)
Pathak et al. (2022), *arXiv*. 1,398 citations.

- **Main goal:** Build a fast, global, high-resolution (0.25 degree) data-driven weather model that forecasts fine-scale variables like surface wind and precipitation.
- **Architecture:** Adaptive Fourier Neural Operator (AFNO) token mixing within a vision-transformer backbone, applied autoregressively with 6-hour steps, plus a separate diagnostic precipitation network.
- **Data:** ERA5 at 0.25 degree, about 20 variables; training 1979-2015, validation 2016-2017, testing 2018 onward.
- **Main result:** Matches ECMWF IFS at short lead times for large-scale variables and beats it for precipitation; produces a week-long forecast in under 2 seconds, enabling ensembles of thousands of members.
- **Open work:** Coupling to more variables and Earth-system components, better probabilistic ensembles and longer lead times.
- **Issues:** Skill falls below IFS at longer lead times for many variables; trained and evaluated on ERA5, inheriting its biases; deterministic training gives smoothed forecasts.
- *Basis: abstract+knowledge*

### [Neural general circulation models for weather and climate](https://doi.org/10.1038/s41586-024-07744-y)
Kochkov et al. (2023), *Nature*. 627 citations.

- **Main goal:** Combines physics-based dynamics with ML to achieve skillful weather and ensemble forecasts and stable long climate simulations.
- **Architecture:** NeuralGCM: differentiable spectral dynamical core coupled with a neural network that learns physics tendencies, trained end to end over multi-step rollouts; deterministic and stochastic versions.
- **Data:** ERA5 reanalysis at 2.8, 1.4, and 0.7 degree resolutions; evaluated with WeatherBench 2 on 2020; AMIP-style multi-decade runs with prescribed SST.
- **Main result:** Competitive with ML models at 1-10 days and with the ECMWF ensemble at 1-15 days; tracks climate metrics for decades and produces realistic tropical cyclones at 140 km resolution, with large computational savings.
- **Open work:** Coupling to ocean and land models, and improving generalization to climates different from the training period.
- **Issues:** Does not extrapolate to substantially different future climates; trained on reanalysis; some runs become unstable over long integrations.
- *Basis: abstract+knowledge*

### [FuXi: a cascade machine learning forecasting system for 15-day global weather forecast](https://arxiv.org/abs/2306.12873)
Chen et al. (2023), *npj Climate and Atmospheric Science*. 598 citations.

- **Main goal:** Reduce error accumulation in ML weather models so that skill at 15-day lead times matches the ECMWF ensemble mean.
- **Architecture:** Cascade of three pretrained U-Transformer (Swin Transformer V2-based) models specialized for 0-5, 5-10 and 10-15 day lead times; ensemble from perturbed initial conditions and model parameters.
- **Data:** ECMWF ERA5 reanalysis, 39 years, 0.25 degree, 6-hourly; evaluated against ERA5 and ECMWF HRES and ensemble forecasts.
- **Main result:** Comparable to the ECMWF ensemble mean over 15 days; extends skillful lead time over HRES from 9.25 to 10.5 days for Z500 and from 10 to 14.5 days for T2M; ensemble spread is promising.
- **Open work:** Better calibrated ensembles, initialization from operational analyses rather than reanalysis, and extension to subseasonal ranges (later FuXi-S2S).
- **Issues:** Smoothing of forecasts at long leads typical of MSE-trained models; trained on reanalysis so inherits its biases; ensemble perturbations are ad hoc rather than flow-dependent.
- *Basis: abstract+knowledge*

### [Challenges and design choices for global weather and climate models based on machine learning](https://doi.org/10.5194/gmd-11-3999-2018)
Dueben et al. (2018), *Geoscientific Model Development*. 393 citations.

- **Main goal:** Examine whether deep learning models trained on atmospheric data could compete with physics-based global weather and climate models, and what design choices this entails.
- **Architecture:** Discussion paper with a toy neural-network model for global weather prediction on a coarse grid, used to explore design choices (global vs local networks, inputs, time stepping).
- **Data:** Reanalysis data at coarse resolution for a few variables such as Z500 (ERA-Interim, per knowledge of the paper).
- **Main result:** The toy model shows some short-range skill above persistence but is not competitive with operational NWP; key challenges include data volume, conservation, stability and representing the full system.
- **Open work:** Building larger, more complete networks with proper treatment of the sphere and conservation, and hybrid ML-physics systems.
- **Issues:** Very simple toy model at coarse resolution; results are qualitative and predate modern large ML weather models.
- *Basis: abstract+knowledge*

### [Spherical Fourier Neural Operators: Learning Stable Dynamics on the Sphere](https://arxiv.org/abs/2306.03838)
Bonev et al. (2023), *International Conference on Machine Learning*. 381 citations.

- **Main goal:** Removes the flat-geometry artifacts and dissipation of Fourier neural operators when learning dynamics on the sphere.
- **Architecture:** Spherical Fourier Neural Operator (SFNO), which replaces the discrete Fourier transform with spherical harmonic transforms for rotation-equivariant global convolutions.
- **Data:** Shallow-water equations on the sphere and ERA5 reanalysis for atmospheric forecasting.
- **Main result:** Stable autoregressive rollouts for a year of simulated time (1,460 six-hour steps) with physically plausible dynamics, avoiding the artifacts of standard FNOs.
- **Open work:** Use for long climate simulations and coupled Earth system emulation.
- **Issues:** Stability is shown but long rollouts still smooth small scales; deterministic training; skill comparisons with operational systems are limited.
- *Basis: abstract+knowledge*

### [The operational medium-range deterministic weather forecasting can be extended beyond a 10-day lead time](https://doi.org/10.1038/s43247-025-02502-y)
Chen et al. (2023), *Communications Earth &amp; Environment*. 357 citations.

- **Main goal:** Extends skillful global medium-range deterministic forecasts beyond 10 days and adds probabilistic forecasting.
- **Architecture:** FengWu: transformer-based multi-modal, multi-task model with a replay buffer to reduce error accumulation; FengWu-Ensemble uses a conditional diffusion model on deterministic forecasts.
- **Data:** ERA5 at 0.25 degrees on 13 pressure levels; compared with ECMWF HRES, Pangu-Weather, GraphCast, and the IFS ensemble.
- **Main result:** Outperforms HRES, Pangu-Weather, and GraphCast deterministically, with skillful forecasts beyond 10 days; FengWu-Ensemble beats the IFS ensemble on several variables and metrics.
- **Open work:** Higher resolution, more variables, and operational initialization from real-time analyses.
- **Issues:** Trained and verified against ERA5; deterministic forecasts likely smooth at long leads; ensemble built on deterministic output may limit spread realism.
- *Basis: assessment*

### [Improving Data‐Driven Global Weather Prediction Using Deep Convolutional Neural Networks on a Cubed Sphere](https://doi.org/10.1029/2020ms002109)
Weyn et al. (2020), *Journal of Advances in Modeling Earth Systems*. 352 citations.

- **Main goal:** Improve data-driven global weather prediction with CNNs so forecasts are stable and skilful, as a fast tool for large ensembles.
- **Architecture:** Deep U-Net-style CNN operating on a cubed-sphere grid with volume-conservative remapping and face-aware padding, trained with a loss over multiple steps of the prediction sequence.
- **Data:** Reanalysis (ERA5, coarse resolution) for a few basic atmospheric variables, with prescribed top-of-atmosphere solar forcing.
- **Main result:** Indefinitely stable forecasts with realistic patterns at multi-week leads and a realistic seasonal cycle; beats persistence, climatology and a coarse NWP model but is worse than high-resolution operational NWP.
- **Open work:** Adding variables (e.g. precipitation), higher resolution and ensemble generation for sub-seasonal forecasting (pursued in Weyn et al. 2021).
- **Issues:** Limited variable set and coarse resolution; not competitive with operational NWP at medium range; deterministic and smooth.
- *Basis: abstract+knowledge*

### [Can Machines Learn to Predict Weather? Using Deep Learning to Predict Gridded 500‐hPa Geopotential Height From Historical Weather Data](https://doi.org/10.1029/2019ms001705)
Weyn et al. (2019), *Journal of Advances in Modeling Earth Systems*. 325 citations.

- **Main goal:** Test whether CNNs trained only on historical data can forecast gridded 500-hPa geopotential height without physics.
- **Architecture:** Deep convolutional neural networks (including convolutional LSTM variants) forecasting one or two fields iteratively in time steps.
- **Data:** Climate Forecast System Reanalysis (CFSR) Northern Hemisphere grids (about 2.5 deg), with training on earlier decades and testing on later years.
- **Main result:** Up to 3 days CNNs beat persistence, climatology and barotropic vorticity models but not an operational full-physics model (GFS); adding 700-300 hPa thickness helps; realistic states up to 14 days.
- **Open work:** More variables and levels, global grids, and use of CNN efficiency for large ensembles.
- **Issues:** Coarse resolution and very few variables; well behind operational NWP; trained on reanalysis.
- *Basis: abstract+knowledge*

### [Forecasting Global Weather with Graph Neural Networks](https://arxiv.org/abs/2202.07575)
Keisler (2022), *arXiv*. 305 citations.

- **Main goal:** Develop a data-driven global weather forecasting model that steps the full 3D atmospheric state forward and is competitive with operational NWP.
- **Architecture:** Graph neural network with an encoder-processor-decoder design mapping the lat-lon grid to an icosahedral mesh; a 6-hour step applied autoregressively over several days.
- **Data:** ERA5 reanalysis or GFS forecast data at 1 degree with a small set of variables on multiple pressure levels; also tested with live operational GFS initial conditions.
- **Main result:** Improves on previous data-driven models for Z500 and T850 and is comparable to operational GFS and ECMWF forecasts when evaluated at 1-degree scales with reanalysis initial conditions.
- **Open work:** Higher resolution, more variables and levels, and better performance from operational (rather than reanalysis) initial conditions.
- **Issues:** Coarse 1-degree evaluation; comparison favours the model when initialized from reanalysis; forecasts smooth with lead time and are deterministic only.
- *Basis: abstract+knowledge*

### [AIFS -- ECMWF's data-driven forecasting system](https://arxiv.org/abs/2406.01465)
Lang et al. (2024), *arXiv*. 297 citations.

- **Main goal:** Describes ECMWF's operational data-driven global medium-range forecasting system.
- **Architecture:** AIFS: graph neural network encoder and decoder with a sliding-window transformer processor; modular design with several levels of parallelism.
- **Data:** ERA5 reanalysis and ECMWF operational NWP analyses; verified against analyses and observations.
- **Main result:** Highly skilled forecasts for upper-air variables, surface weather parameters, and tropical cyclone tracks; runs four times daily with open data.
- **Open work:** Probabilistic versions, higher resolution, and more variables.
- **Issues:** Deterministic version tends to smooth; depends on NWP analyses for initialization; much verification is against ECMWF's own analysis.
- *Basis: abstract*

### [Toward Data‐Driven Weather and Climate Forecasting: Approximating a Simple General Circulation Model With Deep Learning](https://doi.org/10.1029/2018gl080704)
Scher (2018), *Geophysical Research Letters*. 265 citations.

- **Main goal:** Test whether a deep neural network can emulate the full dynamics of a simple general circulation model for both weather-like forecasts and climate runs.
- **Architecture:** Convolutional encoder-decoder style neural network predicting the full model state ahead, iterated autoregressively for long runs.
- **Data:** Long simulation output from a simplified GCM (PUMA, dry dynamics without seasonal cycle) used for training and testing.
- **Main result:** The network predicts the model state several time steps ahead and, iterated from arbitrary states, produces a stable climate run with similar statistics and no long-term drift, without built-in conservation.
- **Open work:** Move to more complex models (moisture, seasonal cycle) and eventually real atmospheric data; study of the sources of stability.
- **Issues:** Simple, idealized model world with no seasonal cycle; forecast skill degrades quickly; results may not transfer to realistic atmospheres.
- *Basis: abstract+knowledge*

### [Data‐Driven Medium‐Range Weather Prediction With a Resnet Pretrained on Climate Simulations: A New Model for WeatherBench](https://doi.org/10.1029/2020ms002405)
Rasp et al. (2020), *Journal of Advances in Modeling Earth Systems*. 244 citations.

- **Main goal:** Advance purely data-driven medium-range weather prediction and set a stronger WeatherBench baseline.
- **Architecture:** Deep residual convolutional neural network (ResNet) predicting directly at each lead time, pretrained on climate model output and fine-tuned on reanalysis.
- **Data:** WeatherBench ERA5 at 5.625°, with pretraining on CMIP6 historical simulations; geopotential, temperature and precipitation up to 5 days.
- **Main result:** Outperforms earlier WeatherBench submissions and is comparable to a physical model run at similar coarse resolution (e.g. Z500 RMSE around 268 m2/s2 at 3 days and about 500 at 5 days); learned correlations look physically reasonable.
- **Open work:** Scaling experiments suggest higher resolution and more data could improve skill further.
- **Issues:** Coarse 5.625° resolution; far behind operational IFS; deterministic forecasts blur at longer leads.
- *Basis: abstract+knowledge*

### [End-to-end data-driven weather prediction](https://doi.org/10.1038/s41586-025-08897-0)
Allen et al. (2025), *Nature*. 206 citations.

- **Main goal:** Replaces the entire NWP pipeline (data assimilation, forecasting, post-processing) with a single end-to-end ML system.
- **Architecture:** Aardvark Weather: an encoder that maps raw observations to a gridded state, a processor for forecasting, and decoders for local station forecasts, fine-tuned end to end.
- **Data:** Raw satellite, in situ and station observations as inputs; ERA5 as gridded training target (about 1.5° resolution).
- **Main result:** Global forecasts beat an operational NWP baseline for some variables and lead times; station forecasts are skillful to 10 days, competing with post-processed NWP.
- **Open work:** Higher resolution, more observations and variables, and customized models for end users.
- **Issues:** Coarse resolution; trained against ERA5 so still depends on NWP-derived targets; does not beat the best operational systems overall.
- *Basis: abstract+knowledge*

### [Scaling transformer neural networks for skillful and reliable medium-range weather forecasting](https://arxiv.org/abs/2312.03876)
Nguyen et al. (2023), *Neural Information Processing Systems*. 171 citations.

- **Main goal:** Identify what makes data-driven medium-range weather models work by building a simple, scalable transformer with careful ablations.
- **Architecture:** Stormer: standard vision-transformer backbone with weather-specific variable embedding, randomized dynamics forecasting over varying intervals, and pressure-weighted loss; multiple interval combinations averaged at inference.
- **Data:** ERA5 reanalysis via WeatherBench 2 (coarse resolution relative to 0.25 degree models).
- **Main result:** Competitive at short-to-medium range and better than existing methods beyond 7 days on WeatherBench 2, with orders of magnitude less training data and compute; accuracy scales with model size and tokens.
- **Open work:** Higher resolution training, probabilistic forecasting and further scaling.
- **Issues:** Lower resolution than leading ML models; deterministic; ensemble-of-intervals mean may smooth forecasts; evaluated against reanalysis.
- *Basis: abstract+knowledge*

### [On Some Limitations of Current Machine Learning Weather Prediction Models](https://doi.org/10.1029/2023gl107377)
Bonavita (2024), *Geophysical Research Letters*. 152 citations.

- **Main goal:** Examines the fidelity and physical consistency of leading ML weather models beyond headline skill scores.
- **Architecture:** Diagnostic analysis (not a new ML model) of forecasts from Pangu-Weather, FourCastNet and GraphCast, e.g. spectra, balance relationships and small-scale structure.
- **Data:** ML model forecasts initialized from ERA5/operational analyses, compared with ECMWF IFS forecasts and analyses.
- **Main result:** The ML models fail to reproduce sub-synoptic and mesoscale phenomena and lack the fidelity and physical consistency of physics-based models, affecting interpretation of their skill.
- **Open work:** Designing ML models that balance forecast skill with physical realism, and evaluation metrics that reward realism.
- **Issues:** Evaluates early-generation deterministic models trained with MSE losses; newer probabilistic and generative models may address some issues.
- *Basis: abstract+knowledge*

### [Weather and climate forecasting with neural networks: using general circulation models (GCMs) with different complexity as a study ground](https://doi.org/10.5194/gmd-12-2797-2019)
Scher et al. (2019), *Geoscientific Model Development*. 148 citations.

- **Main goal:** Assess from the bottom up whether neural networks can, in principle, forecast weather and produce climate datasets, using GCMs of varying complexity as simplified reality.
- **Architecture:** Deep convolutional neural networks trained to predict model weather days ahead, run iteratively to test climate reproduction.
- **Data:** Output of the simple GCMs PUMA and PLASIM at different complexity levels and training-period lengths.
- **Main result:** Forecast skill depends on model complexity and training length; reproducing the GCM climate including a seasonal cycle remains challenging, unlike earlier results without seasonal cycle.
- **Open work:** More complex models, longer training data and architectures that maintain stable climates with seasonal cycles.
- **Issues:** Idealized, coarse GCM output rather than reality; limited variables and resolution.
- *Basis: abstract*

### [A Machine Learning‐Based Global Atmospheric Forecast Model](https://doi.org/10.1029/2020gl087776)
Arcomano et al. (2020), *Geophysical Research Letters*. 139 citations.

- **Main goal:** Tests whether machine learning can serve as a global atmospheric forecast model designed for massively parallel supercomputers.
- **Architecture:** Reservoir computing (echo state networks) applied in parallel over local horizontal patches of the globe, each reservoir predicting its local region with overlap from neighbors.
- **Data:** ERA5 reanalysis interpolated to the low-resolution grid and variables of the SPEEDY model; compared with SPEEDY at identical resolution and state variables.
- **Main result:** Hourly 20-day forecasts stay realistic; the model beats climatology and persistence for the first three days in the midlatitudes but not the tropics, and does best versus SPEEDY for variables dominated by parameterized processes.
- **Open work:** Higher resolution, longer stable integration for climate use, and hybrid coupling with physics models (pursued in later work).
- **Issues:** Low resolution; skill horizon only about three days and poor in the tropics; benchmark is a simple intermediate-complexity model rather than operational NWP.
- *Basis: abstract+knowledge*

### [Deep Learning for Day Forecasts from Sparse Observations](https://arxiv.org/abs/2306.06079)
Andrychowicz et al. (2023), *arXiv*. 134 citations.

- **Main goal:** Extend observation-based neural weather models beyond 12 h precipitation to 24 h forecasts of multiple surface variables.
- **Architecture:** MetNet-3: neural network combining dense (radar, satellite) and sparse (station) inputs with a densification technique that implicitly captures data assimilation.
- **Data:** CONUS observations: radar, satellite, weather stations and NWP analysis; targets include sparse station observations.
- **Main result:** Outperforms HRRR and ENS for precipitation, wind, temperature and dew point up to 24 h, at up to 2-minute and 1 km resolution; operational in Google Search.
- **Open work:** Longer leads and global coverage.
- **Issues:** Regional (CONUS); proprietary; evaluation against sparse stations.
- *Basis: abstract*

### [Do AI models produce better weather forecasts than physics-based models? A quantitative evaluation case study of Storm Ciarán](https://doi.org/10.1038/s41612-024-00638-w)
Charlton-Perez et al. (2023), *npj Climate and Atmospheric Science*. 98 citations.

- **Main goal:** Evaluate how well ML weather models forecast a high-impact European windstorm compared with NWP.
- **Architecture:** Case-study evaluation of four ML models (FourCastNet, Pangu-Weather, GraphCast, FourCastNet-v2) against NWP.
- **Data:** Storm Ciaran (November 2023) forecasts and analyses.
- **Main result:** ML models capture synoptic structure and jet dynamics but underestimate peak winds; only some resolve the warm seclusion and none capture the sharp bent-back front.
- **Open work:** More case studies of high-impact events and process-based evaluation.
- **Issues:** Single case; ML outputs have limited variables and resolution.
- *Basis: abstract*

### [Can Artificial Intelligence‐Based Weather Prediction Models Simulate the Butterfly Effect?](https://doi.org/10.1029/2023gl105747)
Selz et al. (2023), *Geophysical Research Letters*. 86 citations.

- **Main goal:** Tests whether AI weather models reproduce the rapid growth of small initial-condition errors (butterfly effect) that limits predictability.
- **Architecture:** Perturbation experiments with an AI-based weather model (Pangu-Weather) compared with physics-based numerical model simulations; not a new ML method.
- **Data:** Initial conditions from ECMWF analyses, with small- and analysis-uncertainty-size perturbations.
- **Main result:** The AI model fails to reproduce rapid initial growth of small perturbations, implying unlimited predictability; for realistic-size perturbations it largely agrees with physical models, with some deficits.
- **Open work:** Training or designing AI models that capture small-scale error growth, and caution in using them for predictability studies.
- **Issues:** Single AI model and limited case set; coarse 0.25° resolution may itself suppress small-scale growth.
- *Basis: abstract+knowledge*

### [Dynamical Tests of a Deep-Learning Weather Prediction Model](https://arxiv.org/abs/2309.10867)
Hakim et al. (2023), *Artificial Intelligence for the Earth Systems*. 70 citations.

- **Main goal:** Test whether a deep-learning weather model (Pangu-Weather) encodes atmospheric dynamics or merely pattern-matches, to judge its use for basic science.
- **Architecture:** No new model; Pangu-Weather is subjected to four classical dynamical experiments using localized perturbations added to steady time-averaged states.
- **Data:** Time-averaged (e.g. winter-mean) background states derived from the reanalysis-based climate on which Pangu-Weather operates; perturbation experiments are idealized.
- **Main result:** Reproduces a Matsuno-Gill response to tropical heating, realistic extratropical cyclones and fronts, geostrophic adjustment in about 6 h, and hurricane genesis above about 4 hPa initial amplitude that vanishes with zero humidity.
- **Open work:** Using such models as fast tools for testing a wide range of dynamical hypotheses, and testing other ML models similarly.
- **Issues:** Qualitative assessment for one model; perturbation responses may partly reflect training-data analogues; no conservation or balance diagnostics beyond the experiments shown.
- *Basis: assessment*

### [Advancing Parsimonious Deep Learning Weather Prediction Using the HEALPix Mesh](https://doi.org/10.1029/2023ms004021)
Karlbauer et al. (2023), *Journal of Advances in Modeling Earth Systems*. 64 citations.

- **Main goal:** Build a parsimonious deep-learning weather model that stays stable for very long autoregressive rollouts at modest cost.
- **Architecture:** DLWP-HPX: U-Net on the HEALPix mesh with inverted channel depth and gated recurrent units at each U-Net level; location-invariant convolutions.
- **Data:** ERA5 reanalysis, seven prognostic variables, 3-hourly, on a roughly 110 km HEALPix mesh.
- **Main result:** At 1-week lead, skill is about one day behind Pangu-Weather, GraphCast and ECMWF HRES; no loss of spectral power after day 2; realistic 1-year rollouts with seasonal cycle.
- **Open work:** Adding more variables, higher resolution and ocean coupling for subseasonal and climate applications.
- **Issues:** Coarser resolution and fewer variables than state-of-the-art models; deterministic; trained on reanalysis so inherits its biases.
- *Basis: assessment*

### [A data-to-forecast machine learning system for global weather](https://doi.org/10.1038/s41467-025-62024-1)
Sun et al. (2024), *Nature Communications*. 59 citations.

- **Main goal:** Remove the dependence of ML weather models on NWP-produced initial conditions by building an end-to-end ML data assimilation and forecasting system.
- **Architecture:** FuXi Weather: ML forecast model coupled with ML-based assimilation of multi-satellite observations in a cycling DA-forecast system.
- **Data:** Multi-satellite observations (fewer than used by conventional NWP); ERA5-type reanalysis for training; compared with ECMWF HRES.
- **Main result:** Reliable 10-day forecasts at 0.25 degree; outperforms ECMWF HRES beyond day one in observation-sparse regions such as central Africa; background forecasts help constrain analysis.
- **Open work:** Adding more observation types (e.g. conventional and in situ data) and probabilistic DA and forecasting.
- **Issues:** Uses fewer observations than operational systems, so global skill may lag HRES in data-rich regions; reliance on reanalysis for training.
- *Basis: assessment*

### [Regional data-driven weather modeling with a global stretched-grid](https://arxiv.org/abs/2409.02891)
Nipen et al. (2024), *Artificial Intelligence for the Earth Systems*. 58 citations.

- **Main goal:** Develop a data-driven model for high-resolution regional forecasting while keeping a global domain for boundary information.
- **Architecture:** Bris: graph neural network built on the AIFS framework with a stretched grid giving high resolution over the Nordics and coarse resolution elsewhere.
- **Data:** Pretrained on 43 years of global ERA5 at 31 km; fine-tuned on 3.3 years of 2.5 km MEPS operational analyses; verified against Norwegian station observations.
- **Main result:** 2.5 km, 6-hourly forecasts; lower 2 m temperature RMSE than both MEPS control and ensemble mean; competitive precipitation and wind speed.
- **Open work:** Improving extremes, increasing temporal resolution and adding probabilistic forecasts.
- **Issues:** Underestimates extreme events; 6-hour time step coarse for short-range needs; short high-resolution training record.
- *Basis: abstract*

### [Fixing the Double Penalty in Data-Driven Weather Forecasting Through a Modified Spherical Harmonic Loss Function](https://arxiv.org/abs/2501.19374)
Subich et al. (2025), *International Conference on Machine Learning*. 57 citations.

*Summary pending.*

### [Kilometer-scale convection-allowing model emulation using generative diffusion modeling](https://doi.org/10.1126/sciadv.adv0423)
Pathak et al. (2024), *Science Advances*. 56 citations.

- **Main goal:** Shows that machine learning can emulate a km-scale convection-allowing model, a regime where deterministic DL had struggled.
- **Architecture:** StormCast: a generative diffusion model that autoregressively predicts 99 state variables with a 1-hour step, conditioned on 26 synoptic-scale variables.
- **Data:** HRRR 3-km operational model output over a central US domain, with coarse ERA5 fields as synoptic conditioning.
- **Main result:** Competitive 1-6 hour forecast skill for composite radar reflectivity and physically realistic convective clusters, moist updrafts and cold pools.
- **Open work:** Improving regional km-scale ML prediction, longer rollouts, data assimilation, and use for climate hazard dynamical downscaling.
- **Issues:** Regional domain with lateral and synoptic conditioning from reanalysis; trained to emulate HRRR, so it inherits HRRR biases; skill limited to short lead times.
- *Basis: abstract+knowledge*

### [FengWu-GHR: Learning the Kilometer-scale Medium-range Global Weather Forecasting](https://arxiv.org/abs/2402.00059)
Han et al. (2024), *arXiv*. 52 citations.

- **Main goal:** Builds a data-driven global medium-range forecast model at kilometer-scale resolution beyond the 0.25° limit of reanalysis-trained models.
- **Architecture:** Transformer-based FengWu-family model that inherits knowledge from a pretrained low-resolution (0.25°) model and is adapted to 0.09° resolution.
- **Data:** Low-resolution pretraining on ERA5; high-resolution training on ECMWF operational analysis at about 0.09°. Hindcasts for 2022 and station observations used for evaluation.
- **Main result:** Running at 0.09°, FengWu-GHR is reported superior to IFS-HRES in 2022 hindcasts and competitive against station observations and in extreme-event case studies.
- **Open work:** Operational deployment, coupling with high-resolution data assimilation, and further resolution increases.
- **Issues:** High-resolution training data cover a short period; skill against own-type analysis may favor the model; effective resolution and small-scale realism are not fully demonstrated.
- *Basis: abstract+knowledge*

### [OneForecast: A Universal Framework for Global and Regional Weather Forecasting](https://arxiv.org/abs/2502.00338)
Gao et al. (2025), *International Conference on Machine Learning*. 50 citations.

*Summary pending.*

### [Graph-based Neural Weather Prediction for Limited Area Modeling](https://arxiv.org/abs/2309.17370)
Oskarsson et al. (2023), *arXiv*. 38 citations.

- **Main goal:** Adapts graph-based neural weather prediction, so far mostly global, to limited-area modeling with lateral boundary forcing.
- **Architecture:** GraphCast-style graph neural network encoder-processor-decoder on a regional mesh, plus a multi-scale hierarchical graph extension (Hi-LAM); boundaries forced from the driving data.
- **Data:** Forecast archive of the MEPS limited-area NWP system over the Nordic region (about 10 km grid), used as training data and verification target.
- **Main result:** The graph-based models produce skillful regional forecasts, and the hierarchical variant improves on single-level graphs; the abstract gives no quantitative scores.
- **Open work:** Training on analyses or observations instead of model forecasts, probabilistic extensions, and coupling to ML global models for boundaries.
- **Issues:** Emulates an existing NWP system rather than observations; boundary conditions taken from the target data in evaluation; deterministic MSE training causes smoothing.
- *Basis: abstract+knowledge*

### [Leveraging data-driven weather models for improving numerical weather prediction skill through large-scale spectral nudging](https://doi.org/10.1175/waf-d-24-0139.1)
Husain et al. (2024), *arXiv*. 35 citations.

*Summary pending.*

### [Generalizing Weather Forecast to Fine-grained Temporal Scales via Physics-AI Hybrid Modeling](https://arxiv.org/abs/2405.13796)
Xu et al. (2024), *Neural Information Processing Systems*. 32 citations.

- **Main goal:** Enables data-driven weather forecasts at finer time steps than the training data resolution by embedding physical evolution.
- **Architecture:** WeatherGFT: physics-AI hybrid with a PDE kernel integrating dynamics at small steps (e.g. 300 s) and parallel neural networks with a learnable router for bias correction, plus lead time-aware training.
- **Data:** Hourly reanalysis (ERA5) for training; evaluation across multiple lead times including sub-hourly.
- **Main result:** Generalizes forecasts across time scales, including 30-minute forecasts finer than the dataset resolution; weight analysis shows physics drives evolution while AI corrects.
- **Open work:** Verifying sub-hourly forecasts against independent high-frequency observations and extending physics to more processes.
- **Issues:** Ground truth at 30-minute scales is lacking in hourly data, so sub-hourly skill is hard to verify; simplified PDE kernel omits many physical processes.
- *Basis: assessment*

### [An artificial intelligence-based limited area model for forecasting of surface meteorological variables](https://doi.org/10.1038/s43247-025-02347-5)
Xu et al. (2025), *Communications Earth & Environment*. 32 citations.

*Summary pending.*

### [Improving AI Weather Prediction Models Using Global Mass and Energy Conservation Schemes](https://doi.org/10.1029/2025ms005138)
Sha et al. (2025), *Journal of Advances in Modeling Earth Systems*. 26 citations.

*Summary pending.*

### [Building Machine Learning Limited Area Models: Kilometer-Scale Weather Forecasting in Realistic Settings](https://arxiv.org/abs/2504.09340)
Adamov et al. (2025), *arXiv*. 25 citations.

*Summary pending.*

### [Analyzing and Exploring Training Recipes for Large-Scale Transformer-Based Weather Prediction](https://arxiv.org/abs/2404.19630)
Willard et al. (2024), *arXiv*. 23 citations.

*Summary pending.*

### [Robustness of AI-based weather forecasts in a changing climate](https://arxiv.org/abs/2409.18529)
Rackow et al. (2024), *arXiv*. 21 citations.

- **Main goal:** Tests whether ML weather models trained on present-day climate generalize to different climate states, a prerequisite for climate applications.
- **Architecture:** Evaluation of three state-of-the-art ML weather forecasting models run out of distribution; no new model is trained.
- **Data:** Initial conditions from climate simulations representing pre-industrial, present-day and 2.9 K warmer climates.
- **Main result:** Models remain skillful across climates, but two drift colder in the warmer climate and two of three warm in the pre-industrial case, pulling toward the training climate.
- **Open work:** Remedies for climate drift, including adding ocean, sea-ice and land-surface information and training on more diverse climate states.
- **Issues:** Short-range forecasts only; climate-state biases indicate incomplete generalization; missing boundary forcing in training data contributes to the biases.
- *Basis: abstract+knowledge*

### [HRRRCast: a data-driven emulator for regional weather forecasting at convection allowing scales](https://doi.org/10.1175/aies-d-25-0061.1)
Abdi et al. (2025), *Artificial Intelligence for the Earth Systems*. 20 citations.

*Summary pending.*

### [Neural general circulation models optimized to predict satellite-based precipitation observations](https://arxiv.org/abs/2412.11973)
Yuval et al. (2024), *arXiv*. 17 citations.

- **Main goal:** Improves GCM precipitation, especially extremes and the diurnal cycle, by training a hybrid model directly on satellite precipitation observations.
- **Architecture:** Hybrid differentiable GCM built on NeuralGCM: a dynamical core with learned physics trained end-to-end, at 2.8° resolution.
- **Data:** Satellite-based precipitation (IMERG) as the precipitation target, with ERA5 for atmospheric state; compared to GCMs, ERA5 and a global cloud-resolving model.
- **Main result:** Lower precipitation biases, more realistic precipitation distribution and extremes, better diurnal cycle than GCMs, ERA5 and a cloud-resolving model, and better mid-range precipitation forecasts than the ECMWF ensemble.
- **Open work:** Training on more observational datasets, finer resolution, and evaluating performance under climate change.
- **Issues:** Coarse 2.8° resolution; behavior in warmer climates untested; relies on satellite product accuracy, which has its own retrieval biases.
- *Basis: abstract+knowledge*

### [Comparative Analysis of Precipitation Forecasts between the ECMWF Artificial Intelligence System AIFS and Its Integrated Forecast System IFS](https://doi.org/10.1175/waf-d-24-0227.1)
Pan et al. (2025), *Weather and forecasting*. 17 citations.

*Summary pending.*

### [An update to ECMWF's machine-learned weather forecast model AIFS](https://arxiv.org/abs/2509.18994)
Moldovan et al. (2025), *arXiv*. 15 citations.

*Summary pending.*

### [Community Research Earth Digital Intelligence Twin: a scalable framework for AI-driven Earth System Modeling](https://doi.org/10.1038/s41612-025-01125-6)
Schreck et al. (2024), *npj Climate and Atmospheric Science*. 14 citations.

*Summary pending.*

### [FastNet: Improving the physical consistency of machine-learning weather prediction models through loss function design](https://doi.org/10.1175/aies-d-25-0090.1)
Dunstan et al. (2025), *Artificial Intelligence for the Earth Systems*. 10 citations.

*Summary pending.*

### [Efficient fine-tuning of 37-level GraphCast with the Canadian global deterministic analysis](https://doi.org/10.1175/aies-d-24-0101.1)
Subich (2024), *Artificial Intelligence for the Earth Systems*. 9 citations.

*Summary pending.*

### [Learning Coupled Earth System Dynamics with GraphDOP](https://arxiv.org/abs/2510.20416)
Boucher et al. (2025), *arXiv*. 9 citations.

*Summary pending.*

### [ArchesWeather: An efficient AI weather forecasting model at 1.5° resolution](https://arxiv.org/abs/2405.14527)
Couairon et al. (2024), *arXiv*. 8 citations.

- **Main goal:** Shows that Pangu-Weather's 3D local processing is computationally suboptimal and designs a more efficient model.
- **Architecture:** ArchesWeather: transformer with 2D attention plus a column-wise attention-based module for vertical interactions.
- **Data:** ERA5 at 1.5 degrees, 24 h lead time steps; compared with IFS HRES and NeuralGCM ensemble.
- **Main result:** An ensemble of four models has lower RMSE than IFS HRES and is competitive with the 50-member NeuralGCM ensemble at 1-3 days, at a few GPU-days of training.
- **Open work:** Probabilistic extension (done in ArchesWeatherGen) and higher resolution.
- **Issues:** Coarse resolution; evaluation mostly RMSE at short leads; RMSE favors smooth forecasts.
- *Basis: abstract*

### [Atmospheric Predictability Beyond 30 Days with Machine Learning](https://doi.org/10.1175/aies-d-26-0009.1)
Vonich et al. (2025), *Artificial Intelligence for the Earth Systems*. 8 citations.

*Summary pending.*

### [AIFS-DOP: End-to-End Medium-Range Weather Prediction from Observations Alone with Machine Learning](https://arxiv.org/abs/2606.19093)
Pinnington et al. (2026), *arXiv*. 6 citations.

*Summary pending.*

### [Northern Hemisphere Midlatitude Cyclone Intensity Biases in Machine Learning Weather Prediction Models](https://doi.org/10.1175/bams-d-25-0129.1)
Dacre et al. (2025), *Bulletin of The American Meteorological Society - (BAMS)*. 6 citations.

*Summary pending.*

### [On the effective resolution of AI weather prediction models](https://doi.org/10.1175/aies-d-25-0121.1)
Selz et al. (2026), *Artificial Intelligence for the Earth Systems*. 4 citations.

*Summary pending.*

### [Can AI‐Based Weather Prediction Models Simulate the Butterfly Effect? The Role of Architecture and Implementation](https://doi.org/10.1029/2025jh001180)
Selz et al. (2026), *Journal of Geophysical Research*. 4 citations.

*Summary pending.*

### [Representing the Surface Ocean in ECMWF's data-driven forecasting system AIFS](https://arxiv.org/abs/2604.25559)
Hahner et al. (2026), *arXiv*. 4 citations.

*Summary pending.*

### [Operational Verification of Artificial Intelligence Weather Prediction](https://doi.org/10.1175/bams-d-26-0054.1)
Casati et al. (2026), *Bulletin of The American Meteorological Society - (BAMS)*. 3 citations.

*Summary pending.*

### [WeatherNext 3: Increasing resolution and performance of global weather models with raw observations](https://arxiv.org/abs/2609.03582)
Rasp et al. (2026), *arXiv*. 3 citations.

*Summary pending.*

### [Integration of Emerging Data-Driven Models into the NOAA Research-to-Operations Pipeline for Numerical Weather Prediction](https://doi.org/10.1175/bams-d-24-0062.1)
Frolov et al. (2025), *Bulletin of The American Meteorological Society - (BAMS)*. 2 citations.

*Summary pending.*

### [Assessing the ability of a stretched‐grid deep‐learning weather prediction model to capture physical balances](https://doi.org/10.1002/qj.70315)
Pasquini et al. (2026), *Quarterly Journal of the Royal Meteorological Society*. 2 citations.

*Summary pending.*

### [Bridging short- and medium-range weather forecasting with machine learning](https://arxiv.org/abs/2608.26822)
Smith et al. (2026), *arXiv*. 2 citations.

*Summary pending.*

<a id="probabilistic"></a>
## Ensembles & generative

### [Probabilistic weather forecasting with machine learning](https://doi.org/10.1038/s41586-024-08252-9)
Price et al. (2024), *Nature*. 860 citations.

- **Main goal:** Develops a machine learning probabilistic weather model to outperform the best operational ensemble (ECMWF ENS).
- **Architecture:** GenCast: a conditional diffusion model with a graph-transformer denoiser on an icosahedral mesh, generating stochastic 12-hourly autoregressive trajectories.
- **Data:** ERA5 reanalysis at 0.25° (about 1979-2018 training; 2019 test), with ERA5 initial states and ENS as baseline.
- **Main result:** Ensemble 15-day forecasts for over 80 variables in 8 minutes; more skillful than ENS on 97.2% of 1,320 targets, with better extremes, tropical cyclone tracks and wind power forecasts.
- **Open work:** Operational use with operational analyses, finer time steps, and improved representation of initial-condition uncertainty.
- **Issues:** Trained on reanalysis and initialized from ERA5 (and ERA5 EDA perturbations), so it inherits their biases; 12-hour step and 0.25° limit small-scale detail; sampling cost exceeds deterministic ML.
- *Basis: abstract+knowledge*

### [Sub‐Seasonal Forecasting With a Large Ensemble of Deep‐Learning Weather Prediction Models](https://doi.org/10.1029/2021ms002502)
Weyn et al. (2021), *Journal of Advances in Modeling Earth Systems*. 242 citations.

- **Main goal:** Use a fast deep learning weather model to build a large ensemble for subseasonal-to-seasonal (2-6 week) forecasting.
- **Architecture:** DLWP: CNN on a cubed-sphere grid recursively predicting six atmospheric variables at 6 h steps; 32 models with randomized training plus initial perturbations give a 320-member ensemble.
- **Data:** ERA5 reanalysis at 1.4 degree resolution; two-year test set; compared with the ECMWF S2S ensemble.
- **Main result:** 320-member six-week ensemble in three minutes on one GPU; ensemble mean beats climatology beyond two weeks (ACC above 0.6 through six days); only modestly inferior to ECMWF S2S over land at weeks 4 and 5-6, worse at shorter leads.
- **Open work:** Adding precipitation and more variables, coupling to ocean and other slow components, and better ensemble generation.
- **Issues:** No precipitation forecast; coarse resolution and few variables; ensemble spread mainly from model weight randomization; inferior to ECMWF at short leads.
- *Basis: abstract*

### [DYffusion: A Dynamics-informed Diffusion Model for Spatiotemporal Forecasting](https://arxiv.org/abs/2306.01984)
Cachay et al. (2023), *Neural Information Processing Systems*. 169 citations.

- **Main goal:** Make diffusion models efficient and stable for probabilistic spatiotemporal forecasting with long rollouts.
- **Architecture:** DYffusion: replaces Gaussian-noise diffusion with a dynamics-informed process, using a stochastic time-conditioned interpolator (forward process) and a forecaster network (reverse process).
- **Data:** Sea surface temperature fields, Navier-Stokes flows and spring mesh systems.
- **Main result:** Competitive probabilistic forecast skill with improved computational efficiency, flexible continuous-time sampling and trade-off of accuracy for speed.
- **Open work:** Application to higher-dimensional weather and climate data and longer horizons.
- **Issues:** Benchmarks are limited in size and realism; calibration and long-term stability for climate-length rollouts not established.
- *Basis: assessment*

### [Generative emulation of weather forecast ensembles with diffusion models](https://doi.org/10.1126/sciadv.adk4489)
Li et al. (2024), *Science Advances*. 165 citations.

- **Main goal:** Reduces the cost of large weather forecast ensembles by generating extra members with a generative model.
- **Architecture:** SEEDS: a diffusion model conditioned on one or two operational ensemble members that samples many additional realistic members.
- **Data:** GEFS reforecasts for emulation, with ERA5 reanalysis used as a target in the bias-correcting variant.
- **Main result:** Generated ensembles match physics-based ensembles in statistics and skill; the bias-correcting version gives more reliable probabilities and better extreme-event probabilities.
- **Open work:** Extension to higher resolution, more variables and climate projection ensembles for risk assessment.
- **Issues:** Operates on a limited set of variables at coarse resolution; generated members depend on the seed members and cannot add information beyond them.
- *Basis: abstract+knowledge*

### [AIFS-CRPS: ensemble forecasting using a model trained with a loss function based on the continuous ranked probability score](https://doi.org/10.1038/s44387-026-00073-7)
Lang et al. (2024), *npj Artificial Intelligence*. 158 citations.

- **Main goal:** Builds an ML ensemble forecasting system that gives calibrated probabilistic forecasts.
- **Architecture:** AIFS-CRPS: stochastic AIFS variant trained with an almost fair CRPS loss that corrects for finite ensemble size; generates any number of exchangeable members.
- **Data:** ERA5 and ECMWF operational analyses; compared with the IFS ensemble for medium-range and subseasonal leads.
- **Main result:** Beats the IFS ensemble for most variables and lead times in the medium range; for subseasonal forecasts it beats the uncalibrated IFS ensemble and is competitive when evaluated as anomalies.
- **Open work:** Reducing model biases at subseasonal leads and increasing resolution.
- **Issues:** Subseasonal advantage depends on bias treatment; training data rely on NWP-based analyses.
- *Basis: abstract*

### [A generative adversarial network approach to (ensemble) weather prediction](https://doi.org/10.1016/j.neunet.2021.02.003)
Bihlo (2020), *Neural Networks*. 98 citations.

- **Main goal:** Test whether purely data-driven deep learning can produce deterministic and ensemble 24 h weather forecasts.
- **Architecture:** Conditional deep convolutional generative adversarial network, with Monte Carlo dropout to generate ensembles.
- **Data:** Four years of ERA5 reanalysis over Europe for training; 2019 for testing; Z500, 2 m temperature and total precipitation.
- **Main result:** Good agreement with reanalysis for Z500 and 2 m temperature but failure for precipitation; MC dropout ensembles improve skill and provide uncertainty estimates.
- **Open work:** Extend to longer lead times, more variables, and better-calibrated ensemble generation.
- **Issues:** Short training period, regional domain and 24 h lead only; precipitation not captured; MC dropout spread is not necessarily calibrated.
- *Basis: abstract*

### [FourCastNet 3: A geometric approach to probabilistic machine-learning weather forecasting at scale](https://arxiv.org/abs/2507.12144)
Bonev et al. (2025), *arXiv*. 80 citations.

- **Main goal:** Builds a scalable, calibrated probabilistic ML ensemble weather model that respects spherical geometry and keeps realistic spectra.
- **Architecture:** Purely convolutional spherical neural network (spherical neural operator style) trained as a probabilistic ensemble generator, with model- and data-parallel training inspired by domain decomposition.
- **Data:** ERA5 reanalysis at 0.25°, 6-hourly.
- **Main result:** Accuracy surpasses leading conventional ensembles and rivals diffusion models while 8–60x faster; well calibrated with stable spectra to 60 days; 90-day global forecast in under 20 s on one GPU.
- **Open work:** Operational early warning use, large ensembles, and subseasonal applications.
- **Issues:** Preprint; trained on reanalysis so inherits its biases; evaluation against ERA5; subseasonal skill not quantified in the abstract.
- *Basis: abstract*

### [Skillful joint probabilistic weather forecasting from marginals](https://arxiv.org/abs/2506.10772)
Alet et al. (2025), *arXiv*. 79 citations.

- **Main goal:** Improves ML ensemble weather forecasting with a simpler, scalable approach than diffusion models.
- **Architecture:** FGN: generates ensemble members via learned functional model perturbations (noise injected into model parameters) across an ensemble of constrained models, trained to minimize per-location CRPS.
- **Data:** Reanalysis-based global training data (ERA5 and operational analyses). Not detailed in the abstract.
- **Main result:** Significantly outperforms state-of-the-art models (including GenCast) on deterministic and probabilistic metrics, gives skillful ensemble TC tracks, and captures joint spatial structure despite marginal-only training.
- **Open work:** Further evaluation of multivariate and spatial coherence, and operational deployment.
- **Issues:** Trained only on marginal CRPS, so joint-structure fidelity needs careful verification; inherits reanalysis biases.
- *Basis: assessment*

### [SwinVRNN: A Data‐Driven Ensemble Forecasting Model via Learned Distribution Perturbation](https://doi.org/10.1029/2022ms003211)
Hu et al. (2022), *Journal of Advances in Modeling Earth Systems*. 78 citations.

- **Main goal:** Improve data-driven ensemble medium-range forecasting by learning how to perturb the model, rather than using ad hoc initial-condition perturbations or MC dropout.
- **Architecture:** SwinVRNN: Swin Transformer-based recurrent network (SwinRNN) with a VAE-style perturbation module learning a time-variant latent Gaussian distribution.
- **Data:** WeatherBench (ERA5-based) data; comparisons with operational ECMWF IFS.
- **Main result:** Learned distribution perturbation gives better accuracy and reasonable spread than fixed perturbations, MC dropout or multi-model ensembles; surpasses IFS for 2 m temperature and 6-hourly precipitation up to 5 days.
- **Open work:** Higher resolution, longer lead times and better spread-skill calibration.
- **Issues:** Coarse WeatherBench resolution; comparison against IFS on reanalysis targets; limited lead time.
- *Basis: abstract*

### [Ensemble Methods for Neural Network‐Based Weather Forecasts](https://doi.org/10.1029/2020ms002331)
Scher et al. (2020), *Journal of Advances in Modeling Earth Systems*. 73 citations.

- **Main goal:** Turn a deterministic neural network weather forecast into an ensemble with a useful spread-error relationship.
- **Architecture:** Comparison of four ensemble methods for a CNN forecast model: random initial perturbations, retraining, MC dropout, and singular vector initial perturbations.
- **Data:** Reanalysis data at coarse resolution (ERA5-based per the paper) for training and testing.
- **Main result:** All ensemble means beat the unperturbed forecast, with retraining giving the largest improvement; NN skill remains systematically below state-of-the-art NWP.
- **Open work:** Combine methods and apply to stronger NN forecast models for better calibration.
- **Issues:** Base model is weak relative to NWP; coarse resolution; spread calibration is method-dependent.
- *Basis: abstract+knowledge*

### [A Practical Probabilistic Benchmark for AI Weather Models](https://doi.org/10.1029/2024gl113656)
Brenowitz et al. (2024), *Geophysical Research Letters*. 54 citations.

- **Main goal:** Provides a fair, parameter-free way to compare the probabilistic skill of AI weather models.
- **Architecture:** Benchmark method that scores lagged initial-condition ensembles built from libraries of deterministic hindcasts.
- **Data:** Deterministic hindcasts from GraphCast and Pangu-Weather and an operational baseline, verified against reanalysis.
- **Main result:** Lagged ensembles of GraphCast and Pangu perform similarly even though GraphCast is better deterministically; multi-time-step loss functions damage ensemble calibration.
- **Open work:** Applying the benchmark to more models and to genuinely probabilistic AI ensembles.
- **Issues:** Lagged ensembles are a proxy and not how operational ensembles are made; results depend on hindcast library.
- *Basis: abstract*

### [Uncertainty quantification for data-driven weather models](https://doi.org/10.1175/aies-d-24-0049.1)
Bulte et al. (2024), *Artificial Intelligence for the Earth Systems*. 49 citations.

*Summary pending.*

### [Continuous Ensemble Weather Forecasting with Diffusion models](https://arxiv.org/abs/2410.05431)
Andrae et al. (2024), *International Conference on Learning Representations*. 40 citations.

- **Main goal:** Avoids the computational cost and error accumulation of autoregressive diffusion ensembles at fine temporal resolution.
- **Architecture:** Continuous Ensemble Forecasting: diffusion model conditioned on lead time that samples temporally consistent trajectories in parallel, optionally combined with autoregressive rollouts.
- **Data:** ERA5 global reanalysis; the resolution is not reported in the abstract.
- **Main result:** Competitive global forecasting with good probabilistic properties and arbitrary fine temporal resolution without loss of accuracy.
- **Open work:** Scaling to higher resolution and operational settings.
- **Issues:** Evaluation details not given in the abstract; likely coarse resolution.
- *Basis: assessment*

### [FuXi-ENS: A machine learning model for medium-range ensemble weather forecasting](https://arxiv.org/abs/2405.05925)
Zhong et al. (2024), *arXiv*. 35 citations.

- **Main goal:** Creates a machine learning ensemble forecast system that does not rely on NWP ensemble members and runs at higher resolution than prior ML ensembles.
- **Architecture:** Variational autoencoder-based model with flow-dependent perturbations, trained with a loss combining CRPS and KL divergence between predicted and target distributions.
- **Data:** ERA5 reanalysis at 0.25°, 5 upper-air variables on 13 pressure levels plus 13 surface variables; compared against ECMWF ensemble forecasts.
- **Main result:** FuXi-ENS produces 6-hourly 15-day global ensembles and beats ECMWF ENS in CRPS for 98.1% of 360 variable and lead-time combinations.
- **Open work:** Further development toward operational use, including better initial-condition perturbations and evaluation for extremes.
- **Issues:** Trained and verified against reanalysis, inheriting its biases; spread-skill and physical realism of individual members need scrutiny; comparisons are sensitive to verification choices.
- *Basis: abstract+knowledge*

### [Huge ensembles – Part 1: Design of ensemble weather forecasts using spherical Fourier neural operators](https://doi.org/10.5194/gmd-18-5575-2025)
Mahesh et al. (2025), *Geoscientific Model Development*. 29 citations.

- **Main goal:** Designs ML ensemble weather forecasts able to generate huge ensembles (1000-10000 members) to sample low-likelihood, high-impact extremes.
- **Architecture:** Large distributed spherical Fourier neural operators (1.1 billion parameters); model uncertainty via perturbed parameters (multiple trained checkpoints), initial-condition uncertainty via bred vectors.
- **Data:** ERA5 reanalysis for training; ECMWF IFS ensemble as baseline in an evaluation pipeline of mean, spectral and extreme diagnostics.
- **Main result:** Achieves calibrated probabilistic forecasts; members keep realistic spectra with lead time; extreme forecast indices similar to IFS, with reliable and discriminating extreme forecasts.
- **Open work:** Part 2 generates a huge ensemble initialized daily in summer 2023 and characterizes extremes; tail statistics remain to be established more generally.
- **Issues:** Skill still somewhat below IFS on some metrics; trained on reanalysis so inherits its biases; extreme verification limited by sample size.
- *Basis: abstract+knowledge*

### [A fast physics-based perturbation generator of machine learning weather model for efficient ensemble forecasts of tropical cyclone track](https://doi.org/10.1038/s41612-025-01009-9)
Pu et al. (2025), *npj Climate and Atmospheric Science*. 26 citations.

*Summary pending.*

### [ArchesWeatherGen: Skillful and compute-efficient probabilistic weather forecasting with machine learning](https://doi.org/10.1126/sciadv.adx2372)
Couairon et al. (2026), *Science Advances*. 20 citations.

*Summary pending.*

### [Diffusion-LAM: Probabilistic Limited Area Weather Forecasting with Diffusion](https://arxiv.org/abs/2502.07532)
Larsson et al. (2025), *arXiv*. 20 citations.

*Summary pending.*

### [Swift: an autoregressive consistency model for efficient weather forecasting](https://doi.org/10.1088/3049-4753/ae802a)
Stock et al. (2025), *Machine Learning: Earth*. 18 citations.

*Summary pending.*

### [AERIS: Argonne Earth Systems Model for Reliable and Skillful Predictions](https://doi.org/10.1145/3712285.3772094)
Hatanpää et al. (2025), *International Conference on Software Composition*. 17 citations.

*Summary pending.*

### [Demystifying Data-Driven Probabilistic Medium-Range Weather Forecasting](https://arxiv.org/abs/2601.18111)
Kossaifi et al. (2026), *arXiv*. 15 citations.

*Summary pending.*

### [High-Resolution Probabilistic Data-Driven Weather Modeling with a Stretched-Grid](https://arxiv.org/abs/2511.23043)
Nordhagen et al. (2025), *arXiv*. 13 citations.

*Summary pending.*

### [U-Cast: A Surprisingly Simple and Efficient Frontier Probabilistic AI Weather Forecaster](https://arxiv.org/abs/2604.09041)
Cachay et al. (2026), *arXiv*. 13 citations.

*Summary pending.*

### [Probabilistic Weather Forecasting with Hierarchical Graph Neural Networks](https://doi.org/10.52202/079017-1316)
Deisenroth et al. (2024), *Advances in Neural Information Processing Systems 37*. 9 citations.

- **Main goal:** Produces fast probabilistic ensemble weather forecasts with ML, both global and limited-area.
- **Architecture:** Graph-EFM: latent variable model on a hierarchical graph neural network, sampling ensemble members via latent noise.
- **Data:** ERA5 global (about 1.5 degree) and MEPS limited-area Nordic forecasts.
- **Main result:** Generates ensembles efficiently with good calibration and spread-skill, competitive CRPS versus deterministic and other ML baselines.
- **Open work:** Higher resolution, longer lead times, and comparison with operational ensembles.
- **Issues:** Abstract unavailable; coarse global resolution; ensemble members may be smooth.
- *Basis: abstract+knowledge*

### [Hybrid ensemble forecasting combining physics-based and machine-learning predictions through spectral nudging](https://arxiv.org/abs/2603.05570)
Polichtchouk et al. (2026), *arXiv*. 9 citations.

*Summary pending.*

### [(Sparse) Attention to the Details: Preserving Spectral Fidelity in ML-based Weather Forecasting Models](https://arxiv.org/abs/2604.16429)
Zhdanov et al. (2026), *arXiv*. 6 citations.

*Summary pending.*

### [Rigorous uncertainty quantification of probabilistic AI weather forecasts with conformal prediction](https://arxiv.org/abs/2606.19642)
Asch et al. (2026), *arXiv*. 5 citations.

*Summary pending.*

<a id="foundation"></a>
## Foundation models

### [ClimaX: A foundation model for weather and climate](https://arxiv.org/abs/2301.10343)
Nguyen et al. (2023), *International Conference on Machine Learning*. 538 citations.

- **Main goal:** Develop a foundation model for weather and climate that can be pretrained on heterogeneous datasets and fine-tuned for many tasks.
- **Architecture:** ClimaX: Vision Transformer extended with variable tokenization and variable aggregation, pretrained with self-supervised objectives.
- **Data:** Pretraining on CMIP6-derived datasets; fine-tuned on ERA5/WeatherBench forecasting, ClimateBench projections and downscaling at coarse resolutions.
- **Main result:** Outperforms existing data-driven baselines on weather forecasting and climate projection benchmarks, even with lower resolution and compute.
- **Open work:** Scaling to higher resolution, more data and tasks.
- **Issues:** Coarse resolution; below operational NWP skill; benefits of pretraining vary by task.
- *Basis: abstract+knowledge*

### [A foundation model for the Earth system](https://doi.org/10.1038/s41586-025-09005-y)
Bodnar et al. (2025), *Nature*. 507 citations.

- **Main goal:** Builds a single pretrained foundation model that can be fine-tuned cheaply for several Earth-system forecasting tasks instead of training a separate model for each.
- **Architecture:** Aurora: about 1.3B-parameter 3D Swin Transformer U-Net backbone with Perceiver-based encoder and decoder that handle variable sets, levels and resolutions; pretrained, then fine-tuned per task.
- **Data:** Pretraining on over a million hours of heterogeneous data (ERA5, CMIP6, operational analyses and forecasts such as IFS HRES and GFS, MERRA-2); fine-tuning on CAMS air quality, HRES-WAM ocean waves, tropical cyclone tracks and 0.1° IFS HRES weather.
- **Main result:** Outperforms operational systems on most targets: CAMS air quality (about 74% of targets), HRES-WAM waves (about 86%), official tropical cyclone track forecasts, and 0.1° HRES weather (about 92%), at orders of magnitude lower inference cost.
- **Open work:** Probabilistic and ensemble fine-tuning, initialization directly from observations rather than NWP analyses, and extension to more Earth-system components.
- **Issues:** Deterministic forecasts; pretraining is computationally expensive; fine-tuned models still depend on operational analyses for initial conditions; fine-tuning skill varies by task and data availability.
- *Basis: abstract+knowledge*

### [Climate in a Bottle: Towards a Generative Foundation Model for the Kilometer-Scale Global Atmosphere](https://arxiv.org/abs/2505.06474)
Brenowitz et al. (2025), *arXiv*. 54 citations.

- **Main goal:** Builds a generative emulator of km-scale global climate that avoids the drift and instability of autoregressive emulators.
- **Architecture:** cBottle: two-stage diffusion framework on the HEALPix grid, a coarse generator conditioned on SST and solar position followed by patch-based 16x super-resolution.
- **Data:** Global 5 km climate simulations and reanalysis data on HEALPix grids.
- **Main result:** Samples full atmospheric states at 12.5M pixels and passes tests of diurnal-to-seasonal variability, modes of variability, tropical cyclone statistics and climate trends; supports zero-shot bias correction, downscaling, infilling and guided TC sampling.
- **Open work:** Extending toward a full foundation model and new guidance methods for user queries.
- **Issues:** Samples lack temporal coherence since there is no autoregressive dynamics; depends on prescribed SST; limited by short km-scale training records.
- *Basis: assessment*

### [Prithvi WxC: Foundation Model for Weather and Climate](https://arxiv.org/abs/2409.13598)
Schmude et al. (2024), *arXiv*. 53 citations.

- **Main goal:** Builds a general-purpose foundation model for weather and climate that can be fine-tuned for multiple downstream tasks.
- **Architecture:** 2.3-billion-parameter transformer encoder-decoder with local and global attention, trained with a mixed masked-reconstruction and forecasting objective.
- **Data:** MERRA-2 reanalysis with 160 variables for pretraining; downstream tasks use task-specific datasets.
- **Main result:** Fine-tuned on autoregressive forecasting, downscaling, gravity wave flux parameterization and extreme event estimation; weights and fine-tuning workflows are openly released.
- **Open work:** More downstream tasks, higher resolution data, and systematic comparison with specialized models.
- **Issues:** Forecast skill is not shown to match leading specialized models; MERRA-2 resolution and biases limit the base model.
- *Basis: assessment*

### [Earth System Foundation Model (ESFM): A unified framework for heterogeneous data integration and forecasting](https://arxiv.org/abs/2605.00850)
Ozdemir et al. (2026), *arXiv*. 8 citations.

*Summary pending.*

### [Fine‐Tuning a Weather Foundation Model With Lightweight Decoders for Unseen Physical Processes](https://doi.org/10.1029/2025jh000837)
Lehmann et al. (2026), *Journal of Geophysical Research*. 4 citations.

*Summary pending.*

<a id="nowcasting"></a>
## Nowcasting

### [Convolutional LSTM Network: A Machine Learning Approach for Precipitation Nowcasting](https://arxiv.org/abs/1506.04214)
Shi et al. (2015), *Neural Information Processing Systems*. 10,289 citations.

- **Main goal:** Frames radar precipitation nowcasting as spatiotemporal sequence forecasting to predict short-term local rainfall intensity.
- **Architecture:** Convolutional LSTM (ConvLSTM), replacing the matrix multiplications of FC-LSTM with convolutions in input-to-state and state-to-state transitions, in an encoder-forecaster setup.
- **Data:** Moving MNIST synthetic sequences and a Hong Kong Observatory radar echo dataset (sequences of radar maps).
- **Main result:** ConvLSTM captures spatiotemporal correlations better than FC-LSTM and outperforms the operational optical-flow ROVER algorithm on nowcasting metrics.
- **Open work:** Handling location-variant motion, longer lead times and sharper predictions (addressed later by TrajGRU and successors).
- **Issues:** Predictions blur with lead time due to MSE-type training; evaluation limited to one region and short horizons; deterministic only.
- *Basis: abstract+knowledge*

### [Skilful precipitation nowcasting using deep generative models of radar](https://doi.org/10.1038/s41586-021-03854-z)
Ravuri et al. (2021), *Nature*. 1,163 citations.

- **Main goal:** Improves precipitation nowcasting (up to two hours) by avoiding the blurring of deterministic deep learning and the limits of advection methods for nonlinear events.
- **Architecture:** Deep Generative Model of Rainfall (DGMR): a conditional GAN with spatial and temporal discriminators that produces ensembles of radar precipitation fields.
- **Data:** UK radar composite (roughly 2016-2019) for training and evaluation, with additional tests on US radar.
- **Main result:** Gives realistic, skillful probabilistic nowcasts at 5-90 min leads over regions up to 1536 x 1280 km. In an evaluation by more than 50 Met Office meteorologists, it ranked first in 89% of cases.
- **Open work:** Extend lead times, improve heavy-rain skill further and integrate with NWP for longer horizons.
- **Issues:** CSI gains over baselines are modest for some thresholds. Skill drops at long leads, and GAN ensembles may be under-dispersed or poorly calibrated in some regimes.
- *Basis: abstract+knowledge*

### PredRNN: Recurrent Neural Networks for Predictive Learning using Spatiotemporal LSTMs
Wang et al. (2017), *Neural Information Processing Systems*. 1,095 citations.

- **Main goal:** Improves spatiotemporal predictive learning (video and radar sequence prediction) by better memorizing both spatial and temporal information.
- **Architecture:** PredRNN: stacked spatiotemporal LSTM (ST-LSTM) units with a zigzag memory flow across layers and time steps.
- **Data:** Moving MNIST, KTH human actions, and a radar echo dataset for precipitation nowcasting.
- **Main result:** Reports state-of-the-art results on the three benchmarks at the time, outperforming ConvLSTM.
- **Open work:** Better long-term prediction, reduced blur and deeper-in-time memory (addressed in PredRNN++ and later versions).
- **Issues:** Deterministic MSE training produces blurry long-range forecasts; radar evaluation is limited in scope. Abstract unavailable.
- *Basis: abstract+knowledge*

### [Deep Learning for Precipitation Nowcasting: A Benchmark and A New Model](https://arxiv.org/abs/1706.03458)
Shi et al. (2017), *Neural Information Processing Systems*. 1,091 citations.

- **Main goal:** Improves deep-learning precipitation nowcasting and sets up standard evaluation, since ConvLSTM is location-invariant and protocols were lacking.
- **Architecture:** Trajectory GRU (TrajGRU), a recurrent model that learns location-variant recurrent connections via flow fields, in an encoder-forecaster structure.
- **Data:** HKO-7 benchmark: multi-year Hong Kong Observatory radar echo dataset, with a weighted (balanced) loss and online/offline evaluation protocols.
- **Main result:** TrajGRU outperforms ConvLSTM, other deep models and optical-flow baselines on the benchmark, especially with the balanced loss emphasizing heavy rain.
- **Open work:** Better handling of heavy rain, longer horizons and reducing blurring, using the released benchmark.
- **Issues:** Deterministic, MSE-type training still blurs; single radar domain; skill for intense convection remains limited.
- *Basis: abstract+knowledge*

### [Skilful nowcasting of extreme precipitation with NowcastNet](https://doi.org/10.1038/s41586-023-06184-4)
Zhang et al. (2023), *Nature*. 582 citations.

- **Main goal:** Improves nowcasting of extreme precipitation, where physics-based models and pure deep learning both fail (blur, dissipation, intensity and location errors).
- **Architecture:** NowcastNet: neural evolution operator enforcing advective physics combined with a conditional generative (GAN-type) network for multiscale details, trained end to end.
- **Data:** Radar observations from the USA and China; forecasts over 2048 km x 2048 km domains with lead times up to 3 h.
- **Main result:** Produces sharp, physically plausible nowcasts; in an evaluation by 62 professional meteorologists it ranked first in 71% of cases against leading methods.
- **Open work:** Extending lead times beyond 3 h and including other data such as satellite or NWP.
- **Issues:** Subjective expert evaluation is central; generative outputs may not be calibrated probabilistically; limited to radar-observable precipitation.
- *Basis: abstract*

### [SmaAt-UNet: Precipitation Nowcasting using a Small Attention-UNet Architecture](https://doi.org/10.1016/j.patrec.2021.01.036)
Trebing et al. (2020), *Pattern Recognition Letters*. 488 citations.

- **Main goal:** Develops a lightweight neural network for precipitation nowcasting that uses the latest observations.
- **Architecture:** SmaAt-UNet: U-Net with convolutional block attention modules and depthwise-separable convolutions to reduce parameters.
- **Data:** Radar precipitation maps over the Netherlands (KNMI); also a cloud cover dataset in the paper.
- **Main result:** Accuracy comparable to other examined models (including standard U-Net) with only a quarter of the trainable parameters.
- **Open work:** Probabilistic outputs, longer lead times and evaluation on extremes.
- **Issues:** Deterministic MSE-trained output likely blurs at longer leads; single region evaluated.
- *Basis: assessment*

### [Earthformer: Exploring Space-Time Transformers for Earth System Forecasting](https://arxiv.org/abs/2207.05833)
Gao et al. (2022), *Neural Information Processing Systems*. 426 citations.

- **Main goal:** Adapt Transformers efficiently to high-dimensional spatiotemporal Earth system forecasting, where full attention is prohibitively expensive.
- **Architecture:** Earthformer: hierarchical encoder-decoder space-time Transformer built on Cuboid Attention (local self-attention within decomposed cuboids) connected through global vectors.
- **Data:** Synthetic MovingMNIST and a new chaotic N-body MNIST for design ablations; real benchmarks SEVIR (radar precipitation nowcasting) and ICAR-ENSO (Nino3.4 forecasting).
- **Main result:** Achieves state-of-the-art scores on SEVIR precipitation nowcasting and ENSO forecasting relative to ConvLSTM, U-Net and other baselines.
- **Open work:** Probabilistic forecasting to avoid blurring (later addressed by PreDiff), incorporation of physical constraints and scaling to global, multi-variable data.
- **Issues:** Deterministic MSE training produces blurry nowcasts and underestimates intense precipitation; evaluated only on fixed benchmark datasets.
- *Basis: abstract+knowledge*

### [MetNet: A Neural Weather Model for Precipitation Forecasting](https://arxiv.org/abs/2003.12140)
Sønderby et al. (2020), *arXiv*. 383 citations.

- **Main goal:** Develops a neural weather model for short-range precipitation forecasting that can beat NWP at high resolution with low latency.
- **Architecture:** MetNet: convolutional LSTM encoder plus axial self-attention over a large input patch (about 1 million km2), conditioned on lead time, producing a probabilistic (categorical) precipitation map.
- **Data:** Radar (MRMS) and GOES-16 satellite inputs over the continental United States; precipitation targets at 1 km and 2-minute resolution.
- **Main result:** Outperforms operational NWP (HRRR) at lead times up to 7-8 hours across precipitation thresholds, with forecasts produced in seconds.
- **Open work:** Extend lead time and add more inputs (later MetNet-2/3 incorporate NWP-like states and longer horizons).
- **Issues:** Skill advantage over NWP vanishes beyond about 8 hours; evaluated over CONUS only; outputs are marginal probabilities per pixel, not spatially coherent ensembles.
- *Basis: abstract+knowledge*

### [Deep learning for twelve hour precipitation forecasts](https://doi.org/10.1038/s41467-022-32483-x)
Espeholt et al. (2022), *Nature Communications*. 310 citations.

- **Main goal:** Extend neural precipitation forecasting (MetNet-2) to 12 h lead times at high resolution, testing whether learned models can beat operational physics-based NWP for precipitation.
- **Architecture:** MetNet-2: a large convolutional neural network with ConvLSTM encoding, dilated convolutions for a large spatial context, and lead-time conditioning, outputting probabilistic precipitation-rate categories.
- **Data:** Continental US; inputs include radar (MRMS), GOES-16 satellite imagery and NWP/assimilation fields; targets are radar and gauge-based precipitation estimates.
- **Main result:** Outperforms operational physics-based models over CONUS (HRRR and the HREF ensemble) for precipitation up to 12 h lead time, while running far faster.
- **Open work:** Extending lead time and variables beyond precipitation, and learning more directly from observations (later pursued in MetNet-3).
- **Issues:** Regional (CONUS only) and precipitation-only; relies on dense radar networks and NWP inputs; requires large compute to train.
- *Basis: abstract+knowledge*

### [Machine Learning for Precipitation Nowcasting from Radar Images](https://arxiv.org/abs/1912.12132)
Agrawal et al. (2019), *arXiv*. 276 citations.

- **Main goal:** High-resolution (1 km), short-term (1 h) precipitation nowcasting from radar.
- **Architecture:** U-Net convolutional neural network treating nowcasting as image-to-image translation.
- **Data:** NEXRAD radar (MRMS) precipitation imagery over the continental US.
- **Main result:** Performs favorably versus optical flow, persistence and the HRRR one-hour forecast, measured with precision/recall at several thresholds.
- **Open work:** Longer lead times, additional inputs (satellite, NWP), and probabilistic outputs.
- **Issues:** Very short lead time; deterministic predictions tend to blur; evaluation over a limited period.
- *Basis: abstract+knowledge*

### [RainNet v1.0: a convolutional neural network for radar-based precipitation nowcasting](https://doi.org/10.5194/gmd-13-2631-2020)
Ayzel et al. (2020), *Geoscientific Model Development*. 264 citations.

- **Main goal:** Develop and openly release a deep learning model for radar-based precipitation nowcasting up to one hour.
- **Architecture:** RainNet: U-Net/SegNet-inspired CNN predicting precipitation at 5 min lead time, applied recursively to reach 60 min.
- **Data:** Several years of DWD RADOLAN radar composites over Germany (900 km x 900 km, 1 km, 5 min); verification on 11 summer events from 2016-2017.
- **Main result:** Significantly outperforms persistence and the rainymotion optical-flow model up to 60 min for MAE and CSI at 0.125, 1 and 5 mm/h, but is worse for 10 and 15 mm/h thresholds.
- **Open work:** Adjusting the loss function, training for longer lead times, framing threshold exceedance as segmentation, and adding input data on precipitation dynamics.
- **Issues:** Strong spatial smoothing (loss of power below 16 km) that grows with recursive application, degrading heavy-rain prediction important for early warning.
- *Basis: abstract*

### [PreDiff: Precipitation Nowcasting with Latent Diffusion Models](https://arxiv.org/abs/2307.10422)
Gao et al. (2023), *Neural Information Processing Systems*. 179 citations.

- **Main goal:** Produce probabilistic, sharp and physically plausible precipitation nowcasts, avoiding blurry averaging of deterministic models.
- **Architecture:** PreDiff: conditional latent diffusion model (Earthformer-based denoiser in an autoencoder latent space) with a knowledge-alignment mechanism that adjusts each denoising step toward physical constraints.
- **Data:** Synthetic N-body MNIST (energy conservation constraint) and SEVIR radar/satellite precipitation nowcasting dataset (anticipated intensity constraint).
- **Main result:** Handles uncertainty, incorporates domain knowledge and generates sharp forecasts with high operational utility compared with deterministic and other generative baselines.
- **Open work:** Additional physical constraints, faster sampling and application to other Earth system forecasting tasks.
- **Issues:** Diffusion sampling is computationally costly; constraints must be specified and estimated; evaluated on limited benchmark datasets.
- *Basis: abstract+knowledge*

### [A Deep Learning‐Based Methodology for Precipitation Nowcasting With Radar](https://doi.org/10.1029/2019ea000812)
Chen et al. (2020), *Earth and Space Science*. 127 citations.

- **Main goal:** Improve radar-based precipitation nowcasting for severe convective weather using deep learning.
- **Architecture:** ConvLSTM with a star-shape bridge layer to pass features across time steps, a rain-oriented loss inspired by the critical success index, and group normalization.
- **Data:** Radar echo dataset; region and period not reported in the abstract.
- **Main result:** The model outperforms ConvLSTM trained with cross-entropy loss and conventional extrapolation; specific scores are not given in the abstract.
- **Open work:** Test on longer lead times and other regions, and compare with newer nowcasting architectures and probabilistic approaches.
- **Issues:** Deterministic output likely blurs at longer lead times; evaluation details and dataset size are not reported in the abstract.
- *Basis: assessment*

### [DiffCast: A Unified Framework via Residual Diffusion for Precipitation Nowcasting](https://doi.org/10.1109/cvpr52733.2024.02622)
Yu et al. (2023), *Computer Vision and Pattern Recognition*. 121 citations.

- **Main goal:** Improve precipitation nowcasting by avoiding blurring, fading high-value echoes and position errors of previous methods.
- **Architecture:** DiffCast: residual diffusion framework decomposing evolution into global deterministic motion (any spatiotemporal backbone) plus local stochastic residuals modelled by diffusion.
- **Data:** Four public radar datasets (e.g. SEVIR, MeteoNet, Shanghai radar, CIKM).
- **Main result:** Outperforms state-of-the-art nowcasting methods across all four datasets.
- **Open work:** Longer lead times and computational efficiency of diffusion sampling.
- **Issues:** Diffusion sampling is slow; radar-only inputs.
- *Basis: abstract+knowledge*

### [Nowcasting lightning occurrence from commonly available meteorological parameters using machine learning techniques](https://doi.org/10.1038/s41612-019-0098-0)
Mostajabi et al. (2019), *npj Climate and Atmospheric Science*. 119 citations.

- **Main goal:** Nowcast lightning occurrence from single-site, commonly available surface observations.
- **Architecture:** Machine learning classifier (boosted decision trees in the paper) using four surface variables: station pressure, air temperature, relative humidity and wind speed.
- **Data:** Surface weather station data with lightning location system observations for validation, from stations in Switzerland and elsewhere.
- **Main result:** Statistically significant skill up to 30 min lead; outperforms persistence, electrostatic field threshold and CAPE-threshold baselines; feature importance is physically consistent.
- **Open work:** Further data mining of lightning dependencies and application to other regions and longer leads.
- **Issues:** Short lead time; site-specific; limited predictors cannot represent storm dynamics aloft.
- *Basis: abstract+knowledge*

### [Improving Nowcasting of Convective Development by Incorporating Polarimetric Radar Variables Into a Deep‐Learning Model](https://doi.org/10.1029/2021gl095302)
Pan et al. (2021), *Geophysical Research Letters*. 111 citations.

- **Main goal:** Improves convective storm nowcasting beyond reflectivity extrapolation by adding polarimetric radar information on microphysics and dynamics.
- **Architecture:** FURENet, a U-Net-style deep network with separate encoders for multiple input variables (reflectivity, KDP, ZDR) that are fused to predict future reflectivity.
- **Data:** Polarimetric weather radar observations of convective storms in China (details not reported in the abstract).
- **Main result:** Using KDP and ZDR improves CSI by 13.2% at 30 min and 17.4% at 60 min lead time. Case studies show better forecasts of convective organization and initiation.
- **Open work:** Extend to longer lead times and other regions, and add other observations such as satellite or NWP fields.
- **Issues:** Deterministic output, likely blurred at longer leads. Evaluation is limited to one region and short leads, and the case studies are few.
- *Basis: assessment*

### [Latent diffusion models for generative precipitation nowcasting with accurate uncertainty quantification](https://arxiv.org/abs/2304.12891)
Leinonen et al. (2023), *arXiv*. 104 citations.

- **Main goal:** Develops a generative precipitation nowcasting model with better-calibrated uncertainty and more stable training than GANs.
- **Architecture:** Latent diffusion model (LDCast): an autoencoder compresses radar sequences and a conditional diffusion model generates future latent states.
- **Data:** Radar-based precipitation composites from MeteoSwiss over Switzerland and the surrounding region; benchmarked against DGMR and PySTEPS.
- **Main result:** The LDM gives more accurate precipitation predictions and more diverse ensembles than DGMR or PySTEPS; rank histograms show well-calibrated spread, while threshold exceedance scores are mixed.
- **Open work:** Faster sampling, longer lead times, and use of extra inputs (satellite, NWP) and other regions.
- **Issues:** Generation is computationally expensive; threshold-based skill is not clearly better; results are for one radar domain.
- *Basis: abstract+knowledge*

### [Advancing Radar Nowcasting Through Deep Transfer Learning](https://doi.org/10.1109/tgrs.2021.3056470)
Han et al. (2021), *IEEE Transactions on Geoscience and Remote Sensing*. 57 citations.

- **Main goal:** Transfers a deep learning radar nowcasting model trained in one region to another with different precipitation characteristics and little data.
- **Architecture:** CNN-based convective nowcasting model, transferred by fine-tuning and by maximum mean discrepancy (MMD) domain adaptation.
- **Data:** Radar data near Beijing (source) and Guangzhou (target), with varying amounts of target samples.
- **Main result:** Transfer learning models improve nowcasting skill in the target region; the effect of target sample size is quantified.
- **Open work:** Extend to more regions and model architectures.
- **Issues:** Two-region study; quantitative gains not reported in the abstract.
- *Basis: assessment*

### [Using a 10-Year Radar Archive for Nowcasting Precipitation Growth and Decay: A Probabilistic Machine Learning Approach](https://doi.org/10.1175/waf-d-18-0206.1)
Foresti et al. (2019), *Weather and forecasting*. 48 citations.

- **Main goal:** Nowcast precipitation growth and decay in the Lagrangian frame over the Swiss Alps, testing whether orography makes growth and decay more predictable.
- **Architecture:** Feed-forward artificial neural networks with predictors of location, mesoscale motion vectors, freezing level and time of day, plus persistence; prediction intervals from a combination of quantile decision trees and ANNs.
- **Data:** 10-year archive of composite weather radar images over Switzerland.
- **Main result:** ANNs reproduce long-term growth and decay climatology; adding recent growth/decay and intensity cuts RMSE by 20-30% versus persistence in mountainous regions, depending on flow direction.
- **Open work:** Integrate the growth/decay predictions and their uncertainty into operational extrapolation nowcasting systems and further address conditional bias.
- **Issues:** Intrinsic predictability of growth and decay is low, so real-time skill is modest; deterministic ML predictions suffer conditional bias; results are specific to the Alpine radar domain.
- *Basis: abstract*

### [WoFSCast: A Machine Learning Model for Predicting Thunderstorms at Watch‐to‐Warning Scales](https://doi.org/10.1029/2024gl112383)
Flora et al. (2025), *Geophysical Research Letters*. 16 citations.

*Summary pending.*

### [FlowCast: Advancing Precipitation Nowcasting with Conditional Flow Matching](https://arxiv.org/abs/2511.09731)
Ribeiro et al. (2025), *arXiv*. 13 citations.

*Summary pending.*

### [An Operational Deep Learning System for Satellite-Based High-Resolution Global Nowcasting](https://arxiv.org/abs/2510.13050)
Agrawal et al. (2025), *arXiv*. 9 citations.

*Summary pending.*

### [Four-hour thunderstorm nowcasting using a deep diffusion model for satellite data](https://doi.org/10.1073/pnas.2517520122)
Dai et al. (2024), *Proceedings of the National Academy of Sciences of the United States of America*. 8 citations.

*Summary pending.*

### [Learning Accurate Storm-Scale Evolution from Observations](https://arxiv.org/abs/2601.17268)
Pathak et al. (2026), *arXiv*. 8 citations.

*Summary pending.*

### [Generative machine learning for skilful 3D radar nowcasting](https://doi.org/10.1038/s41612-026-01407-7)
Wan et al. (2026), *npj Climate and Atmospheric Science*. 1 citations.

*Summary pending.*

<a id="postprocessing"></a>
## Post-processing

### [Neural networks for post-processing ensemble weather forecasts](https://doi.org/10.1175/mwr-d-18-0187.1)
Rasp et al. (2018), *Monthly Weather Review*. 470 citations.

- **Main goal:** Statistical postprocessing of ensemble forecasts to correct systematic errors and produce calibrated probabilistic forecasts, replacing distributional regression with prespecified link functions.
- **Architecture:** Fully connected neural network that outputs parameters of a Gaussian predictive distribution, trained by minimizing CRPS, with station embeddings and auxiliary predictors.
- **Data:** ECMWF ensemble 2-m temperature forecasts (48-h lead) at about 500 German surface stations, with training on 2007-2015 data and testing on 2016.
- **Main result:** The NN with auxiliary predictors and station embeddings significantly outperforms EMOS and other benchmarks (about 9% CRPS improvement over local EMOS) at lower computational cost; feature importance gives physical insight.
- **Open work:** Extension to other variables (e.g. precipitation, wind), non-Gaussian or distribution-free outputs, multivariate/spatial dependence, and longer training archives.
- **Issues:** Assumes a Gaussian predictive distribution suited to temperature; single variable and lead time; univariate postprocessing ignores spatial and inter-variable correlations.
- *Basis: abstract+knowledge*

### [Deep learning for post-processing ensemble weather forecasts](https://doi.org/10.1098/rsta.2020.0092)
Grönquist et al. (2020), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 217 citations.

- **Main goal:** Improve ensemble forecasts and reduce cost by post-processing a reduced subset of ensemble members with deep learning.
- **Architecture:** Deep neural networks (convolutional, U-Net/ResNet-style) post-processing a subset of ensemble trajectories to produce calibrated mean and spread.
- **Data:** Global ECMWF ensemble reforecast-type data with ERA5 as reference (variables such as Z500 and T850 per the paper).
- **Main result:** Over 14% relative improvement in CRPS on global data, larger gains in selected extreme cases, and comparable skill to the full ensemble with fewer members.
- **Open work:** Use saved computational cost to run ensembles at higher resolution and extend to more variables.
- **Issues:** Evaluation of extremes rests on select case studies; spread is learned rather than dynamically generated; tied to the specific ensemble system.
- *Basis: abstract+knowledge*

### [Predicting weather forecast uncertainty with machine learning](https://doi.org/10.1002/qj.3410)
Scher et al. (2018), *Quarterly Journal of the Royal Meteorological Society*. 214 citations.

- **Main goal:** Predict the uncertainty (expected skill) of medium-range forecasts from the initial atmospheric state without running a costly ensemble.
- **Architecture:** Convolutional neural network trained on past forecasts that maps the initial large-scale state to a scalar confidence measure relative to the seasonal norm.
- **Data:** Past ECMWF ensemble forecasts and analyses (reforecast-type archive) used to define forecast error/spread targets; specifics beyond this are not in the abstract.
- **Main result:** The CNN is less skillful than an ensemble at predicting uncertainty but is very cheap and beats several alternatives that do not require numerical forecasts.
- **Open work:** Larger training archives (e.g. long reforecast sets) and extension to spatially resolved or variable-specific uncertainty.
- **Issues:** Performance is limited by the small number of past forecasts available; outputs only a scalar confidence, not a full spatial uncertainty field.
- *Basis: abstract*

### [Comparative Assessment of Various Machine Learning‐Based Bias Correction Methods for Numerical Weather Prediction Model Forecasts of Extreme Air Temperatures in Urban Areas](https://doi.org/10.1029/2019ea000740)
Cho et al. (2020), *Earth and Space Science*. 189 citations.

- **Main goal:** Correct systematic biases in NWP forecasts of next-day maximum and minimum temperatures in urban Seoul, relevant for heat waves and tropical nights.
- **Architecture:** Random forest, support vector regression, artificial neural network, and a multi-model ensemble of them.
- **Data:** LDAPS (Korean local NWP) forecasts with 14 output variables, station observations of daily Tmax/Tmin and five auxiliary predictors in Seoul.
- **Main result:** For Tmax, RMSE drops from 2.08 to 1.55-1.66 °C and R2 rises from 0.69 to 0.75-0.78; for Tmin, RMSE from 1.43 to 0.98-1.02 °C; the ensemble generalizes best in leave-one-station-out tests.
- **Open work:** Extend to other cities, longer lead times and specific extreme-heat evaluation.
- **Issues:** Single city and short lead; extreme-temperature performance is not isolated; models must be retrained when the NWP system changes.
- *Basis: abstract*

### [Using machine learning to correct model error in data assimilation and forecast applications](https://doi.org/10.1002/qj.4116)
Farchi et al. (2020), *Quarterly Journal of the Royal Meteorological Society*. 160 citations.

- **Main goal:** Correct model error of an existing knowledge-based model using ML combined with data assimilation from sparse, noisy observations.
- **Architecture:** Iterative DA-ML scheme: strong-constraint 4D-Var analyses alternate with deep learning of a model-error correction, giving a hybrid physics-ML surrogate.
- **Data:** Synthetic experiments with a two-layer, two-dimensional quasi-geostrophic channel model, with model error introduced via perturbed parameters.
- **Main result:** ML learns a substantial part of the model error; hybrid models give better short- to mid-range forecasts and significantly better DA analyses than the original model.
- **Open work:** Application to operational-scale systems such as the ECMWF IFS and handling of more realistic model error.
- **Issues:** Idealized QG model with parametric model error only; cost of iterative 4D-Var plus training at scale not addressed.
- *Basis: abstract*

### [Machine learning methods for postprocessing ensemble forecasts of wind gusts: A systematic comparison](https://doi.org/10.1175/mwr-d-21-0150.1)
Schulz et al. (2021), *Monthly Weather Review*. 118 citations.

- **Main goal:** Improves probabilistic wind gust forecasts, which are important for severe weather warnings but rarely studied in ensemble postprocessing.
- **Architecture:** Compares eight methods: EMOS, member-by-member, isotonic distributional regression, gradient-boosted EMOS, quantile regression forests, and neural nets (distributional regression network, Bernstein quantile network, histogram estimation network).
- **Data:** Six years of COSMO-DE convection-permitting ensemble forecasts from the German Weather Service, plus hourly observations at 175 German surface stations.
- **Main result:** All methods calibrate the raw ensemble. Additional predictors give significant gains, and locally adaptive neural networks perform best while learning physically consistent diurnal-cycle relations.
- **Open work:** Extend to spatially and temporally coherent multivariate postprocessing, and to forecasts of extreme gusts and warnings.
- **Issues:** Point forecasts at stations only. Results are for one ensemble system and region, and rare extreme gusts are few in the sample.
- *Basis: abstract+knowledge*

### [Convolutional neural network-based statistical post-processing of ensemble precipitation forecasts](https://doi.org/10.1016/j.jhydrol.2021.127301)
Li et al. (2021), *Journal of Hydrology*. 102 citations.

- **Main goal:** Improves ensemble precipitation forecasts through CNN-based statistical postprocessing (inferred from title).
- **Architecture:** Convolutional neural network postprocessing of ensemble precipitation forecasts; details not available.
- **Data:** Not reported (abstract unavailable); likely ensemble NWP precipitation forecasts and gridded observations.
- **Main result:** Not reported in the abstract.
- **Open work:** Not reported; natural extensions are probabilistic calibration and hydrological applications.
- **Issues:** Cannot be assessed without the abstract; details should be checked in the paper.
- *Basis: assessment*

### [Ensemble Postprocessing Using Quantile Function Regression Based on Neural Networks and Bernstein Polynomials](https://doi.org/10.1175/mwr-d-19-0227.1)
Bremnes (2019), *Monthly Weather Review*. 79 citations.

- **Main goal:** Develop flexible, distribution-free probabilistic postprocessing of ensemble forecasts.
- **Architecture:** Neural network mapping ensemble predictors to coefficients of Bernstein polynomial quantile functions, trained with quantile loss and modern optimizers.
- **Data:** About 2 years of ensemble wind speed forecasts at 125 Norwegian stations, lead time +60 h.
- **Main result:** Improvement of nearly 1% in quantile skill score compared with two quantile regression methods; main appeal is versatility.
- **Open work:** Application to other variables and lead times and to longer training data.
- **Issues:** Modest gains; short training period and single lead time; univariate, station-wise postprocessing.
- *Basis: abstract*

### [Increasing the accuracy and resolution of precipitation forecasts using deep generative models](https://arxiv.org/abs/2203.12297)
Price et al. (2022), *International Conference on Artificial Intelligence and Statistics*. 72 citations.

- **Main goal:** Simultaneously bias-correct and downscale coarse global ensemble precipitation forecasts to produce actionable high-resolution probabilistic forecasts.
- **Architecture:** CorrectorGAN: a conditional GAN with a custom training procedure and augmented loss that generates ensembles of high-resolution, bias-corrected precipitation.
- **Data:** Coarse global ensemble forecasts (ECMWF IFS ensemble via TIGGE) plus other meteorological fields as inputs; high-resolution radar precipitation over the Continental US as ground truth.
- **Main result:** Beats interpolation, super-resolution-only and CNN baselines and approaches an operational regional high-resolution ensemble (HREF) on probabilistic metrics, running in seconds on one machine.
- **Open work:** Transfer to data-poor regions without radar, and assessment of extremes and longer lead times.
- **Issues:** Trained on radar-rich CONUS; GAN training can be unstable; still slightly below the regional model.
- *Basis: abstract+knowledge*

### [Improving Medium Range Severe Weather Prediction through Transformer Post-processing of AI Weather Forecasts](https://doi.org/10.1175/aies-d-25-0045.1)
Hua et al. (2025), *Artificial Intelligence for the Earth Systems*. 7 citations.

*Summary pending.*

### [Postprocessing East African Rainfall Forecasts Using a Generative Machine Learning Model](https://doi.org/10.1029/2024ms004796)
Antonio et al. (2025), *Journal of Advances in Modeling Earth Systems*. 6 citations.

*Summary pending.*

### [A composite‐loss graph neural network for the multivariate post‐processing of ensemble weather forecasts](https://doi.org/10.1002/qj.70119)
Lakatos (2025), *Quarterly Journal of the Royal Meteorological Society*. 5 citations.

*Summary pending.*

### [Statistical post-processing yields accurate probabilistic forecasts from Artificial Intelligence weather models](https://doi.org/10.1175/aies-d-25-0037.1)
Trotta et al. (2025), *Artificial Intelligence for the Earth Systems*. 2 citations.

*Summary pending.*

### [Improving Subseasonal to Seasonal Global 2-meter Temperature and Precipitation Forecasts Using a Deep-Learning-Based Post-Processing Approach](https://doi.org/10.1175/mwr-d-25-0179.1)
Mengist et al. (2026), *Monthly Weather Review*. 2 citations.

*Summary pending.*

<a id="s2s"></a>
## S2S, ENSO & MJO

### [Deep learning for multi-year ENSO forecasts](https://doi.org/10.1038/s41586-019-1559-7)
Ham et al. (2019), *Nature*. 1,158 citations.

- **Main goal:** Extend skillful ENSO forecasts beyond about one year lead, where dynamical models lose skill.
- **Architecture:** Convolutional neural network predicting the Nino3.4 index and ENSO type from SST and heat content anomalies, using transfer learning; heatmaps used for interpretation.
- **Data:** Trained on CMIP5 historical simulations then fine-tuned on reanalysis (1871-1973, e.g. SODA); validated on 1984-2017 observations.
- **Main result:** All-season correlation skill for Nino3.4 remains above 0.5 up to about 17 months lead, exceeding state-of-the-art dynamical forecast systems, and the CNN better predicts the zonal pattern (EP vs CP) of El Nino.
- **Open work:** Improving spring predictability barrier performance, probabilistic forecasts, and understanding the precursors identified by the CNN.
- **Issues:** Short observational validation record with few ENSO events; potential leakage between training and validation through decadal variability; deterministic outputs only.
- *Basis: abstract+knowledge*

### [Temporal Convolutional Networks for the Advance Prediction of ENSO](https://doi.org/10.1038/s41598-020-65070-5)
Yan et al. (2020), *Scientific Reports*. 265 citations.

- **Main goal:** Improves monthly ENSO index prediction (Nino 3.4 and SOI) at leads of 1-12 months.
- **Architecture:** Hybrid EEMD-TCN: ensemble empirical mode decomposition splits each index into subcomponents, each forecast by a temporal convolutional network, then recombined.
- **Data:** Nino 3.4 and SOI reanalysis indices; training 1871-1973, testing 1984-2019.
- **Main result:** EEMD-TCN beats TCN, LSTM and EEMD-LSTM at all leads; Nino 3.4 is more predictable than SOI, and worst-case (12-month SOI) correlation is 0.64.
- **Open work:** Add spatial predictors and compare with dynamical and other ML ENSO models (e.g., CNN-based).
- **Issues:** Applying EEMD to the full series before splitting can leak future information into the test period; univariate index-only approach.
- *Basis: assessment*

### [A self-attention–based neural network for three-dimensional multivariate modeling and its skillful ENSO predictions](https://doi.org/10.1126/sciadv.adf2827)
Zhou et al. (2023), *Science Advances*. 186 citations.

- **Main goal:** Improve ENSO prediction, where dynamical models retain large biases, using a transformer that models 3D upper-ocean and wind fields.
- **Architecture:** 3D-Geoformer: a Transformer with time-space self-attention predicting 3D upper-ocean temperature anomalies and wind stress anomalies.
- **Data:** Not detailed in the abstract; tropical Pacific ocean temperature and wind stress fields.
- **Main result:** High correlation skill for Nino 3.4 SST anomalies 18 months ahead, including for spring starts; sensitivity experiments show Bjerknes-feedback-consistent dynamics.
- **Open work:** Extending to other spatiotemporal geoscience problems and real-time forecasting.
- **Issues:** Short observational record limits independent verification; data sources not specified in abstract.
- *Basis: assessment*

### [A machine learning model that outperforms conventional global subseasonal forecast models](https://doi.org/10.1038/s41467-024-50714-1)
Chen et al. (2024), *Nature Communications*. 151 citations.

- **Main goal:** Improve global subseasonal forecasts (up to 42 days), where ML models had not yet surpassed conventional systems.
- **Architecture:** FuXi-S2S: ML model producing probabilistic global daily-mean forecasts, with a learned perturbation component to represent forecast uncertainty.
- **Data:** 72 years of daily statistics from ERA5; five upper-air variables at 13 levels and 11 surface variables; compared with the ECMWF S2S model.
- **Main result:** Outperforms ECMWF S2S in ensemble mean and ensemble forecasts for precipitation and OLR, and extends skillful MJO prediction from 30 to 36 days; captures MJO teleconnections.
- **Open work:** Use for discovering precursor signals and extension to seasonal timescales.
- **Issues:** Trained on reanalysis; ocean and land boundary forcings not explicitly coupled; daily-mean outputs only.
- *Basis: assessment*

### [Training machine learning models on climate model output yields skillful interpretable seasonal precipitation forecasts](https://doi.org/10.1038/s43247-021-00225-4)
Gibson et al. (2021), *Communications Earth &amp; Environment*. 147 citations.

- **Main goal:** Overcomes the small observational sample size for seasonal forecasting by training ML models on large climate model ensembles.
- **Architecture:** Several ML approaches (for example regularized regression, random forests and neural networks) trained on climate model simulations, with interpretability methods to identify physical sources of skill.
- **Data:** Thousands of seasons from a large climate model ensemble (CESM large ensemble) for training. Tested on observations from 1980-2020 for western US precipitation patterns and compared with NMME.
- **Main result:** ML models trained on model simulations match or exceed NMME dynamical models for large-scale western US seasonal precipitation patterns, and interpretability shows physically relevant processes.
- **Open work:** Apply to other regions and variables, and use transfer learning to correct for the training model's biases.
- **Issues:** Inherits biases of the training climate model. Skill is for large-scale patterns in one region, and the observational test sample is small.
- *Basis: abstract+knowledge*

### [Subseasonal Forecasts of Opportunity Identified by an Explainable Neural Network](https://doi.org/10.1029/2020gl092092)
Mayer et al. (2021), *Geophysical Research Letters*. 92 citations.

- **Main goal:** Identifies subseasonal forecasts of opportunity for North Atlantic midlatitude circulation via tropical-extratropical teleconnections.
- **Architecture:** Artificial neural network classifier using tropical inputs, with prediction confidence to select opportunities and layer-wise relevance propagation (LRP) for explanation.
- **Data:** Tropical input fields and North Atlantic (40°N, 325°E) circulation target at 22-day lead; the dataset source is not reported in the abstract.
- **Main result:** Higher-confidence predictions are more accurate; LRP highlights tropical hot spots matching known teleconnection source regions and suggests a new pattern.
- **Open work:** Testing in observations/reanalysis and other regions and leads; using opportunities in operational subseasonal forecasts.
- **Issues:** Classification of sign only at a single location; LRP interpretations can be method-sensitive.
- *Basis: assessment*

### [Using network theory and machine learning to predict El Niño](https://doi.org/10.5194/esd-9-969-2018)
Nooteboom et al. (2018), *Earth System Dynamics*. 91 citations.

- **Main goal:** Extends ENSO warm-phase prediction skill beyond 6 months to up to 1 year.
- **Architecture:** Hybrid of ARIMA and an artificial neural network with attributes derived from physical knowledge and climate network topological properties.
- **Data:** Zebiak–Cane-type model output and observations.
- **Main result:** Up to 6 months the hybrid is slightly better than the NCEP CFSv2 ensemble; 12-month lead skill is similar to shorter leads.
- **Open work:** Robust evaluation over more events and assessment of the spring predictability barrier.
- **Issues:** Short observational record risks overfitting; limited verification sample of El Niño events; skill measures not detailed in the abstract.
- *Basis: assessment*

### [Improving Subseasonal Forecasting in the Western U.S. with Machine Learning](https://doi.org/10.1145/3292500.3330674)
Hwang et al. (2018), *Knowledge Discovery and Data Mining*. 89 citations.

- **Main goal:** Improves subseasonal (weeks 3-4 and 5-6) temperature and precipitation forecasts for western US water management, in the Subseasonal Climate Forecast Rodeo.
- **Architecture:** Ensemble of two nonlinear regression models: multitask feature selection over many predictors, and a weighted local linear regression with multitask nearest-neighbor features.
- **Data:** SubseasonalRodeo dataset of meteorological measurements and dynamical forecasts (including CFSv2), 2011-2018 evaluation.
- **Main result:** Each model beats debiased CFSv2; the ensemble exceeds the top Rodeo competitor; combining with debiased CFSv2 improves its skill by 40-50% for temperature and 129-169% for precipitation.
- **Open work:** Extending to other regions and leads, and using richer dynamical model ensembles.
- **Issues:** Absolute subseasonal skill remains low; evaluation limited to western US; relative skill gains can look large from low baselines.
- *Basis: abstract*

### [Unified deep learning model for El Niño/Southern Oscillation forecasts by incorporating seasonality in climate data.](https://doi.org/10.1016/j.scib.2021.03.009)
Ham et al. (2021), *Science Bulletin*. 85 citations.

- **Main goal:** Improves deep learning ENSO forecasts by accounting for seasonality, avoiding separate per-season models that give inconsistent forecast time series.
- **Architecture:** All-season CNN (A_CNN) that includes calendar-season information in one unified model across target seasons and lead times; activation maps are used for diagnosis.
- **Data:** Training and testing follow Ham et al. (2019): CMIP5 historical simulations and reanalysis for training, observations for validation. The details are not given in the abstract.
- **Main result:** Improves correlation skill of the ENSO index, especially for boreal spring target seasons (the spring predictability barrier). Activation maps show clear time evolution of precursors with lead time.
- **Open work:** Use the model as a diagnostic tool for ENSO precursors, and extend to ENSO diversity and spatial patterns.
- **Issues:** Few independent observed ENSO events for validation, and depends on CMIP biases in training data.
- *Basis: assessment*

### [Deep learning for bias correction of MJO prediction](https://doi.org/10.1038/s41467-021-23406-3)
Kim et al. (2021), *Nature Communications*. 84 citations.

- **Main goal:** Improves subseasonal MJO prediction, which falls short of its potential predictability partly because of systematic errors in dynamical models.
- **Architecture:** Deep learning bias correction that blends dynamical forecasts with observations to correct forecast MJO amplitude and phase (RMM-based indices) over lead times up to four weeks.
- **Data:** Multi-model operational subseasonal reforecasts (S2S project models) and observed MJO indices.
- **Main result:** Over four weeks, the correction reduces multi-model errors in MJO amplitude by about 90% and in phase by about 77%. The largest gains are for events starting in the Indian Ocean and crossing the Maritime Continent.
- **Open work:** Extend the correction to real-time operational forecasts and to full fields rather than indices, and test how it affects downstream teleconnection skill.
- **Issues:** Corrects the index rather than the model physics. Reforecast samples are limited, so overfitting is a risk, and the gains depend on stationary model bias.
- *Basis: abstract+knowledge*

### [Sub-Seasonal Climate Forecasting via Machine Learning: Challenges, Analysis, and Advances](https://doi.org/10.1609/aaai.v35i1.16090)
He et al. (2020), *Proceedings of the AAAI Conference on Artificial Intelligence*. 70 citations.

- **Main goal:** Systematically assesses ML approaches for sub-seasonal (2 weeks to 2 months) temperature forecasting, a difficult and understudied range.
- **Architecture:** Comparison of 10 ML methods including linear models, XGBoost, and deep learning models (e.g., LSTM, CNN-type encoder-decoders).
- **Data:** A new sub-seasonal dataset over the contiguous US with atmospheric, oceanic and land variables, released with code.
- **Main result:** Well-chosen ML models such as XGBoost capture some sub-seasonal predictability and beat climatology; deep learning models barely match the best results.
- **Open work:** Better feature representation and architectures; comparison with dynamical S2S models.
- **Issues:** Limited observational sample; skill measured relative to climatology rather than operational S2S systems.
- *Basis: abstract*

### [A deep learning model for forecasting global monthly mean sea surface temperature anomalies](https://doi.org/10.3389/fclim.2022.932932)
Taylor et al. (2022), *Frontiers in Climate*. 58 citations.

- **Main goal:** Make long-range forecasts of global monthly SST anomalies, including ENSO and marine heatwaves.
- **Architecture:** Unet-LSTM deep learning time series model predicting 2-D global SST fields up to 24 months ahead.
- **Data:** ERA5 monthly mean SST and 2 m air temperature, 1950-2021.
- **Main result:** High skill in equatorial and subtropical Pacific; skill up to 18 months for 2019-2020 El Nino and 2016-2018 La Ninas; long-lead skill for the northeast Pacific Blob.
- **Open work:** Including subsurface ocean information to capture events like the 2015-2016 El Nino.
- **Issues:** Weak prediction of the 2015-2016 extreme El Nino; short-lead skill only for Ningaloo Nino; surface-only inputs; limited independent test period.
- *Basis: abstract*

### [The Application of Machine Learning Techniques to Improve El Niño Prediction Skill](https://doi.org/10.3389/fphy.2019.00153)
Dijkstra et al. (2019), *Frontiers in Physics*. 55 citations.

- **Main goal:** Review how machine learning can improve El Nino prediction beyond the roughly 6-month skill limit of classical methods.
- **Architecture:** Review of neural-network-based ENSO prediction, including attribute selection from complex network approaches.
- **Data:** Reviewed studies use observational and reanalysis tropical Pacific data and climate model output.
- **Main result:** Early ML results show enhanced skill for lead times beyond 12 months.
- **Open work:** Critical outlook on further developments, including better predictors and robust validation.
- **Issues:** Review predates many later deep learning ENSO studies; small observational sample size limits skill verification.
- *Basis: assessment*

### [ENSO analysis and prediction using deep learning: A review](https://doi.org/10.1016/j.neucom.2022.11.078)
Wang et al. (2022), *Neurocomputing*. 44 citations.

- **Main goal:** Survey deep learning approaches for analysing and predicting the El Nino-Southern Oscillation, a key source of seasonal-to-interannual predictability.
- **Architecture:** Literature review; per the title it covers deep learning methods (likely CNNs, recurrent networks and related models) used for ENSO analysis and prediction.
- **Data:** Review; covered studies typically use observations, reanalysis and climate-model (e.g. CMIP) simulations. Not reported in the abstract.
- **Main result:** Abstract not available; the paper presumably synthesizes reported skill and methods of deep-learning ENSO forecasts.
- **Open work:** Likely includes extending skillful lead times, interpretability and handling limited observational records.
- **Issues:** Content cannot be verified from an abstract; summary is inferred from the title only.
- *Basis: assessment*

### [Skilful global seasonal predictions from a machine learning weather model trained on reanalysis data](https://doi.org/10.1038/s41612-025-01198-3)
Kent et al. (2025), *npj Climate and Atmospheric Science*. 35 citations.

*Summary pending.*

### [An Interpretable Deep Learning Model for ENSO Forecast](https://doi.org/10.34133/olar.0012)
Wang et al. (2023), *Ocean-Land-Atmosphere Research*. 30 citations.

- **Main goal:** From the title, develops a deep learning model for ENSO forecasting that is interpretable, to link predictive skill to physical precursors.
- **Architecture:** Deep learning model with interpretability analysis; specific architecture not reported in available information.
- **Data:** Not reported in the abstract (abstract unavailable); likely climate model and reanalysis ocean-atmosphere fields.
- **Main result:** Not reported in the abstract.
- **Open work:** Not reported; natural steps include validating interpretations against ENSO theory and extending lead times.
- **Issues:** Abstract unavailable, so content cannot be verified from this record.
- *Basis: assessment*

### [Incorporating Uncertainty Into a Regression Neural Network Enables Identification of Decadal State‐Dependent Predictability in CESM2](https://doi.org/10.1029/2022gl098635)
Gordon et al. (2022), *Geophysical Research Letters*. 28 citations.

- **Main goal:** Identify state-dependent decadal predictability of SST, i.e. which initial states yield skillful 2-10 year predictions in a noisy climate system.
- **Architecture:** Regression neural network that outputs both a prediction and its uncertainty (a predicted distribution); low-uncertainty predictions are used to flag predictable initial states.
- **Data:** CESM2 pre-industrial control simulation; SST targets in the North Atlantic and North Pacific.
- **Main result:** The most confident (low-uncertainty) predictions are more skillful, and skillful initial states correspond to particular phases of Atlantic multidecadal variability and the Interdecadal Pacific Oscillation.
- **Open work:** Applying to observations and forced simulations and testing across models.
- **Issues:** Single model, pre-industrial control only, so no external forcing; predictability is model-dependent.
- *Basis: abstract*

### [Interpretable Deep Learning for Probabilistic MJO Prediction](https://doi.org/10.1029/2022gl098566)
Delaunay et al. (2022), *Geophysical Research Letters*. 26 citations.

- **Main goal:** Produces state-dependent probabilistic forecasts of the Madden-Julian oscillation and explains their sources of predictability.
- **Architecture:** Deep CNN predicting mean and standard deviation of MJO indices, with Monte Carlo dropout for model uncertainty and interpretability analysis.
- **Data:** Reanalysis and satellite fields of tropical atmospheric variables with RMM-type MJO indices as targets.
- **Main result:** Skillful probabilistic MJO forecasts whose uncertainty varies with instantaneous predictability; stronger initial MJO linked to more uncertainty, and Walker Circulation state affects predictability.
- **Open work:** Comparing with and combining with dynamical subseasonal ensembles, and testing robustness of the interpretations.
- **Issues:** Limited observational record for training; Gaussian uncertainty assumption; skill relative to operational models not established in the abstract.
- *Basis: assessment*

### [CirT: Global Subseasonal-to-Seasonal Forecasting with Geometry-inspired Transformer](https://arxiv.org/abs/2502.19750)
Liu et al. (2025), *International Conference on Learning Representations*. 24 citations.

*Summary pending.*

### [Toward long-range ENSO prediction with an explainable deep learning model](https://doi.org/10.1038/s41612-025-01159-w)
Chen et al. (2025), *npj Climate and Atmospheric Science*. 17 citations.

*Summary pending.*

### [Combined dynamical-deep learning ENSO forecasts](https://doi.org/10.1038/s41467-025-59173-8)
Chen et al. (2025), *Nature Communications*. 15 citations.

*Summary pending.*

### [Projection of ENSO using observation-informed deep learning](https://doi.org/10.1038/s41467-025-63157-z)
Zhu et al. (2025), *Nature Communications*. 14 citations.

*Summary pending.*

### [Explained predictions of strong eastern Pacific El Niño events using deep learning](https://doi.org/10.1038/s41598-023-45739-3)
Tello et al. (2023), *Scientific Reports*. 12 citations.

- **Main goal:** Predict ENSO diversity, particularly the onset of strong eastern Pacific El Nino events, and explain predictions.
- **Architecture:** Deep learning model (IGP-UHM AI model v1.0) predicting E and C indices with a classification output, plus XAI analysis.
- **Data:** Not detailed in abstract; tropical Pacific and global fields; real-time forecast initialized May 2023.
- **Main result:** Higher ENSO nonlinearity associated with better skill; forecasts El Nino persistence into 2024 with weakening; XAI identifies western Pacific precursors.
- **Open work:** Verification of the 2023-2024 forecast and implications for predictability in a warming climate.
- **Issues:** Limited strong El Nino samples; real-time forecast verification pending.
- *Basis: abstract*

### [OmniCast: A Masked Latent Diffusion Model for Weather Forecasting Across Time Scales](https://arxiv.org/abs/2510.18707)
Nguyen et al. (2025), *Neural Information Processing Systems*. 12 citations.

*Summary pending.*

### [Advancing seasonal prediction of tropical cyclone activity with a hybrid AI-physics climate model](https://doi.org/10.1088/1748-9326/adf864)
Zhang et al. (2025), *Environmental Research Letters*. 11 citations.

*Summary pending.*

### [Testing the reliability of interpretable neural networks in geoscience using the Madden–Julian oscillation](https://doi.org/10.5194/gmd-14-4495-2021)
Toms et al. (2021), *Geoscientific Model Development*. 10 citations.

- **Main goal:** Tests whether NN interpretation methods reliably recover known geophysical structure, using the MJO as test case.
- **Architecture:** Neural network classifying MJO phase, interpreted with backward optimization and layerwise relevance propagation.
- **Data:** Observed/reanalysis tropical atmospheric fields (e.g. OLR and winds) with MJO phase labels.
- **Main result:** NN identifies MJO phase twice as accurately as linear regression; interpretations recover known spatial structure and suggest extended seasons should shift one month later.
- **Open work:** Applying interpretable NNs to test other geoscientific hypotheses.
- **Issues:** Interpretation reliability shown for one well-known phenomenon; methods may behave differently where truth is unknown.
- *Basis: abstract*

### [Data-driven seasonal climate predictions via variational inference and transformers](https://doi.org/10.1038/s41612-026-01320-z)
Palma et al. (2025), *npj Climate and Atmospheric Science*. 5 citations.

*Summary pending.*

### [Using Deep Learning to Identify Initial Error Sensitivity for Interpretable ENSO Forecasts](https://doi.org/10.1175/aies-d-24-0045.1)
Toride et al. (2024), *Artificial Intelligence for the Earth Systems*. 5 citations.

*Summary pending.*

### [Predicting Atlantic and Benguela Niño events with deep learning](https://doi.org/10.1126/sciadv.ads5185)
Bachèlery et al. (2025), *Science Advances*. 3 citations.

*Summary pending.*

### [Prediction Beyond the Medium Range With an Atmosphere‐Ocean Model That Combines Physics‐Based Modeling and Machine Learning](https://doi.org/10.1029/2024ms004480)
Patel et al. (2024), *Journal of Advances in Modeling Earth Systems*. 2 citations.

*Summary pending.*

### [Advancing subseasonal forecasting with machine learning](https://doi.org/10.1038/s41586-026-11126-x)
Guan et al. (2026), *Nature*. 1 citations.

*Summary pending.*

### [Deep learning reveals enhanced ENSO predictability under historical anthropogenic forcing](https://doi.org/10.1126/sciadv.aec9518)
Lin et al. (2026), *Science Advances*. 1 citations.

*Summary pending.*

### [Tropical basin interactions reduce spring predictability barrier of ENSO in a deep learning model](https://doi.org/10.1126/sciadv.aeb0901)
Zhou et al. (2026), *Science Advances*. 1 citations.

*Summary pending.*

### [Deep learning with spatio-temporal conditioning improves global subseasonal precipitation forecasts](https://doi.org/10.1038/s41612-026-01430-8)
Noh et al. (2026), *npj Climate and Atmospheric Science*. 1 citations.

*Summary pending.*

### [On the importance of historical context and bias correction in deep learning MJO prediction models](https://doi.org/10.1038/s41612-026-01459-9)
Virji et al. (2026), *npj Climate and Atmospheric Science*. 0 citations.

*Summary pending.*

### [Skillful and interpretable ENSO prediction via a glass-box dynamical-deep learning model](https://doi.org/10.1038/s41612-026-01513-6)
Wang et al. (2026), *npj Climate and Atmospheric Science*. 0 citations.

*Summary pending.*

<a id="climate"></a>
## Climate emulation & detection

### [Climate change now detectable from any single day of weather at global scale](https://doi.org/10.1038/s41558-019-0666-7)
Sippel et al. (2020), *Nature Climate Change*. 229 citations.

- **Main goal:** Detect externally forced climate change from a single day of global weather rather than from decades of data.
- **Architecture:** Statistical learning (regularized linear regression, ridge-type) linking spatial patterns of daily temperature and humidity to global climate metrics, trained on climate model simulations; observations projected onto the fingerprint.
- **Data:** CMIP5 climate model simulations for training; observational daily temperature and humidity datasets for detection.
- **Main result:** Forced climate change is detected from any single day in the observed record since early 2012 and from any year since 1999, robust even when the global mean trend is removed.
- **Open work:** Use the framework for communicating regional weather events in a climate context and for extending detection to other variables.
- **Issues:** Depends on climate models correctly representing internal variability; detection is global, not attributing individual local events.
- *Basis: abstract+knowledge*

### [Artificial intelligence reconstructs missing climate information](https://doi.org/10.1038/s41561-020-0582-5)
Kadow et al. (2020), *Nature Geoscience*. 204 citations.

- **Main goal:** Reconstruct missing values in historical observational surface temperature records to reduce coverage gaps that bias climate trend estimates.
- **Architecture:** Image inpainting CNN (U-Net with partial convolutions) adapted to climate fields, transfer-learning knowledge from model data to observations.
- **Data:** Trained on climate model output (20th Century Reanalysis and CMIP5 historical simulations); applied to HadCRUT4 gridded temperature anomalies.
- **Main result:** Inpainting reconstructions outperform conventional methods such as kriging and PCA-based infilling in tests, and recover large-scale patterns in sparse periods, e.g. the 1877-78 El Nino.
- **Open work:** Applying the method to other variables and datasets and quantifying uncertainty of reconstructions.
- **Issues:** Reconstruction learns model-based spatial structure that may not hold in reality; uncertainty not fully quantified; abstract unavailable, so details rely on knowledge of the paper.
- *Basis: abstract+knowledge*

### [Data-driven predictions of the time remaining until critical global warming thresholds are reached](https://doi.org/10.1073/pnas.2207183120)
Diffenbaugh et al. (2023), *Proceedings of the National Academy of Sciences*. 139 citations.

- **Main goal:** Predict the time remaining until global warming thresholds (1.5 C and 2 C) are reached from observed temperature patterns.
- **Architecture:** Neural network trained to predict years-to-threshold from spatial maps of annual temperature anomalies, using transfer learning from climate models to observations.
- **Data:** CMIP6 simulations for training; historical temperature observations for out-of-sample prediction.
- **Main result:** 1.5 C is likely to be reached around the early-to-mid 2030s, even with reduced forcing; there is a possibility of exceeding 2 C even with substantial mitigation.
- **Open work:** Updating predictions as observations accumulate and testing other forcing pathways.
- **Issues:** Dependent on CMIP6 training and scenario assumptions; uncertainty in observational datasets.
- *Basis: abstract+knowledge*

### [ACE2: accurately learning subseasonal to decadal atmospheric variability and forced responses](https://doi.org/10.1038/s41612-025-01090-0)
Watt‐Meyer et al. (2024), *npj Climate and Atmospheric Science*. 134 citations.

- **Main goal:** Builds an ML atmosphere emulator that responds to external forcings (SST, greenhouse gases) and reproduces variability from days to decades.
- **Architecture:** ACE2: 450M-parameter autoregressive emulator (Spherical Fourier Neural Operator based) with 6 h steps, 1 degree resolution, and eight vertical layers; exactly conserves dry air mass and moisture.
- **Data:** ERA5 reanalysis over about 80 years, forced by SST and CO2.
- **Main result:** Stable for arbitrarily long runs at about 1500 simulated years per day; produces tropical cyclones, the MJO, and sudden stratospheric warmings; reproduces ENSO responses and 80-year temperature trends.
- **Open work:** Fixing unrealistic separate sensitivities to SST and CO2, and coupling to ocean models.
- **Issues:** Sensitivities to SST and CO2 changes individually are not realistic; coarse vertical resolution; inherits reanalysis biases.
- *Basis: abstract+knowledge*

### [ACE: A fast, skillful learned global atmospheric model for climate prediction](https://arxiv.org/abs/2310.02074)
Watt‐Meyer et al. (2023), *arXiv*. 113 citations.

- **Main goal:** Create a stable, physically consistent ML atmospheric model suitable for climate prediction rather than only weather.
- **Architecture:** ACE: a 200M-parameter autoregressive emulator based on Spherical Fourier Neural Operators with 6-hour steps.
- **Data:** Output of a comprehensive 100-km global atmospheric model (FV3GFS); tested also with an unseen historical SST dataset (AMIP-style).
- **Main result:** Stable for 100 years, nearly conserves column moisture, outperforms a challenging baseline on over 90% of variables, and is ~100x faster and more energy efficient.
- **Open work:** Coupling with ocean, responding to CO2 and forcings, and training on observations or reanalysis.
- **Issues:** Emulates one model, so inherits its biases; prescribed SST, no forcing change; climate change response untested.
- *Basis: abstract+knowledge*

### [Predicting global patterns of long-term climate change from short-term simulations using machine learning](https://doi.org/10.1038/s41612-020-00148-5)
Mansfield et al. (2020), *npj Climate and Atmospheric Science*. 113 citations.

- **Main goal:** Tests whether long-term regional temperature responses to forcing can be predicted from short-term climate model simulations, to cut scenario computation costs.
- **Architecture:** Statistical learning (ridge regression and Gaussian process regression) mapping short-term temperature responses to long-term response patterns across forcing scenarios.
- **Data:** An existing ensemble of GCM simulations with different forcing perturbations (greenhouse gases, aerosols), providing paired short- and long-term responses.
- **Main result:** ML predictions of long-term regional temperature change patterns outperform simple baselines (e.g., pattern scaling) and reveal early indicators of long-term responses.
- **Open work:** Use larger multi-model datasets and data sharing between institutes to build stronger climate response emulators.
- **Issues:** Small training set of scenarios from limited models; emulator only reproduces modelled responses and is not validated against observations.
- *Basis: abstract+knowledge*

### [Anthropogenic fingerprints in daily precipitation revealed by deep learning](https://doi.org/10.1038/s41586-023-06474-x)
Ham et al. (2023), *Nature*. 104 citations.

- **Main goal:** Tests whether anthropogenic climate change is already detectable in daily precipitation variability despite large natural fluctuations.
- **Architecture:** CNN trained to predict annual global mean surface air temperature from daily precipitation fields, analyzed with an explainable AI framework.
- **Data:** Ensemble of present-day and future climate model simulations for training; applied to observed daily precipitation records.
- **Main result:** Observed daily precipitation predicts planetary warming and departs clearly from natural variability since the mid-2010s; sub-10-day variability over the tropical eastern Pacific and midlatitude storm tracks is most sensitive.
- **Open work:** Regional attribution of extremes and testing robustness across observational datasets and models.
- **Issues:** Relies on climate models to represent forced and natural precipitation variability correctly; observational dataset uncertainties; detection is indirect via temperature prediction.
- *Basis: assessment*

### [Emulating Earth system model temperatures with MESMER: from global mean temperature trajectories to grid-point-level realizations on land](https://doi.org/10.5194/esd-11-139-2020)
Beusch et al. (2018), *Earth System Dynamics*. 98 citations.

- **Main goal:** Generates large ensembles of spatially resolved land temperature at negligible cost to emulate Earth system model (ESM) runs for uncertainty propagation.
- **Architecture:** MESMER: modular statistical emulator with global mean temperature, local temperature response, and local residual variability modules (not deep learning).
- **Data:** Yearly land temperature 1870–2100 from 40 CMIP5 models; single-model initial-condition ensembles for validation.
- **Main result:** Training on one ESM run suffices to mimic initial-condition ensembles at grid-point to regional scales; a superensemble of 40 CMIP5 emulators is built and suggests investing in multi-model rather than large single-model ensembles.
- **Open work:** Extension to other variables (e.g. precipitation), sub-annual timescales, ocean, and CMIP6.
- **Issues:** Yearly land temperature only; separate calibration per ESM; statistical assumptions on residual variability may miss nonlinear changes.
- *Basis: abstract*

### [Detecting Climate Signals Using Explainable AI With Single‐Forcing Large Ensembles](https://doi.org/10.1029/2021ms002464)
Labe et al. (2021), *Journal of Advances in Modeling Earth Systems*. 51 citations.

- **Main goal:** Disentangle the influences of aerosols and greenhouse gases on regional surface temperature trends.
- **Architecture:** Artificial neural network predicting the year from near-surface temperature maps, explained with layer-wise relevance propagation plus a simple uncertainty metric to mask noise.
- **Data:** CESM1 single-forcing initial-condition large ensembles with different aerosol and greenhouse gas forcing; observational temperature maps.
- **Main result:** North Atlantic, Southern Ocean and Southeast Asia are key regions; observations correlate better with the year after training on the ensemble with aerosols fixed at 1920 levels.
- **Open work:** Further use of XAI to understand nonlinear combinations of anthropogenic forcings across models.
- **Issues:** Single climate model; LRP relevance depends on network and method choice; attribution is indirect.
- *Basis: assessment*

### [Machine Learning Predictions of a Multiresolution Climate Model Ensemble](https://doi.org/10.1029/2018gl077049)
Anderson et al. (2018), *Geophysical Research Letters*. 48 citations.

- **Main goal:** Uses machine learning to predict climate model outputs across an ensemble spanning model resolutions, to reduce the cost of exploring resolution and parameters.
- **Architecture:** Machine learning regression models trained on ensemble members (specific method not confirmed).
- **Data:** A multiresolution climate model ensemble (likely perturbed-parameter runs at several resolutions); details not reported here.
- **Main result:** Machine learning can predict ensemble outputs, suggesting cheaper exploration of high-resolution behaviour. Specifics not available.
- **Open work:** Using such emulators for calibration and uncertainty quantification at high resolution.
- **Issues:** Abstract unavailable; details of model, variables and accuracy are not confirmed.
- *Basis: assessment*

### [A Deep Learning Earth System Model for Efficient Simulation of the Observed Climate](https://doi.org/10.1029/2025av001706)
Cresswell-Clay et al. (2024), *AGU Advances*. 46 citations.

- **Main goal:** Builds an efficient deep learning Earth system model that simulates the current climate stably for long periods.
- **Architecture:** DLESyM: coupled atmosphere and ocean deep learning model (convolutional networks on a HEALPix mesh) for atmosphere state and SST.
- **Data:** Historical reanalysis and satellite observations; compared with historical simulations from four CMIP6 models.
- **Main result:** Stable 1000-year simulations with little smoothing or drift; matches or beats CMIP6 models for tropical cyclogenesis, the Indian summer monsoon cycle, and mid-latitude blocking climatology.
- **Open work:** Use for subseasonal and seasonal forecasting and extension to forced climate change.
- **Issues:** Simulates current climate only, not forced changes; limited set of variables; inherits reanalysis biases.
- *Basis: abstract+knowledge*

### [Challenges of learning multi-scale dynamics with AI weather models: Implications for stability and one solution](https://arxiv.org/abs/2304.07029)
Chattopadhyay et al. (2023), *arXiv*. 41 citations.

- **Main goal:** Explain why AI weather models become unstable or unphysical on long integrations and propose a remedy.
- **Architecture:** Theoretical and numerical analysis linking instability to spectral bias of deep networks, plus a mitigation approach targeting small-scale learning.
- **Data:** Quasi-geostrophic turbulence simulations and ERA5 reanalysis.
- **Main result:** Identifies spectral bias as a universal cause of instability; the proposed solution gives accurate short-term forecasts and stable centuries-long integration with realistic mean and variability.
- **Open work:** Applying the mitigation to full-scale AI weather models and assessing climate change responses.
- **Issues:** Demonstrated on QG and limited ERA5 setting; mitigation may not generalize to all architectures.
- *Basis: abstract*

### [LUCIE: A Lightweight Uncoupled Climate Emulator With Long‐Term Stability and Physical Consistency](https://doi.org/10.1029/2025ms005152)
Guan et al. (2024), *Journal of Advances in Modeling Earth Systems*. 37 citations.

- **Main goal:** Builds a lightweight data-driven climate emulator that remains stable and physically consistent over century-long autoregressive runs, unlike most AI weather models.
- **Architecture:** Low-resolution SFNO-based emulator with a hard-constrained first-order integrator, spectral regularization for fine scales, and a training strategy for data-limited settings.
- **Data:** 6-hourly ERA5 at coarse resolution; can be trained on as little as 2 years of data.
- **Main result:** Stable for 100-year simulations with 100 ensemble members; climatology and variability of temperature, wind, precipitation and humidity match ERA5; trains in 2.4 hours on one A100.
- **Open work:** Using large ensembles to study extremes, responses to external forcing, and variable importance; adding forcing to represent climate change.
- **Issues:** Coarse resolution and no ocean coupling or time-varying forcing, so it reproduces present-day climate rather than projections; inherits ERA5 biases.
- *Basis: abstract+knowledge*

### [DiffESM: Conditional Emulation of Temperature and Precipitation in Earth System Models With 3D Diffusion Models](https://doi.org/10.1029/2023ms004194)
Bassetti et al. (2024), *Journal of Advances in Modeling Earth Systems*. 37 citations.

- **Main goal:** Generates daily temperature and precipitation from monthly ESM or emulator output so that daily extremes such as heat waves can be analyzed cheaply.
- **Architecture:** Conditional 3D (space-time) diffusion model that temporally downscales monthly means to daily fields.
- **Data:** A handful of ESM realizations spanning a range of radiative forcing scenarios (CMIP6 ESM output).
- **Main result:** Produces daily fields whose extremes (heat waves, dry spells, rainfall intensity) closely match ESM statistics in frequency and spatial characteristics.
- **Open work:** Coupling to monthly emulators for full pipelines, extending to more variables and multiple ESMs, and joint multivariate generation.
- **Issues:** Emulates a specific ESM so inherits its biases; skill outside the training forcing range and for rare extremes is uncertain.
- *Basis: assessment*

### [CAMulator: Fast Emulation of the Community Atmosphere Model](https://arxiv.org/abs/2504.06007)
Chapman et al. (2025), *arXiv*. 32 citations.

*Summary pending.*

### [SamudrACE: Fast and Accurate Coupled Climate Modeling With 3D Ocean and Atmosphere Emulators](https://doi.org/10.1029/2025gl119340)
Duncan et al. (2025), *Geophysical Research Letters*. 29 citations.

*Summary pending.*

### [The Impact of Internal Variability on Benchmarking Deep Learning Climate Emulators](https://doi.org/10.1029/2024ms004619)
Lutjens et al. (2024), *Journal of Advances in Modeling Earth Systems*. 28 citations.

*Summary pending.*

### [Application of the AI2 Climate Emulator to E3SMv2's Global Atmosphere Model, With a Focus on Precipitation Fidelity](https://doi.org/10.1029/2024jh000136)
Duncan et al. (2024), *Journal of Geophysical Research: Machine Learning and Computation*. 19 citations.

- **Main goal:** Tests whether the ACE ML climate emulator generalizes to a different atmospheric model, with focus on precipitation fidelity.
- **Architecture:** ACE (SFNO-based autoregressive emulator) applied without modification; also fine-tuning from a pretrained network.
- **Data:** E3SMv2 atmosphere (EAMv2) simulations at about 1 degree grid spacing forced by repeating annual cycle SSTs.
- **Main result:** Stable 10-year runs with small climate biases; faithful spatiotemporal precipitation structure; pretrained ACE adapts with 10 times fewer training steps and can interpolate between models.
- **Open work:** Extending to time-varying forcing and coupled ocean, and studying multi-model training.
- **Issues:** Climatological SST forcing only, so no climate change response; emulates a model and inherits its biases.
- *Basis: abstract*

### [HiRO-ACE: Fast and skillful AI emulation and downscaling trained on a 3 km global storm-resolving model](https://arxiv.org/abs/2512.18224)
Perkins et al. (2025), *arXiv*. 18 citations.

*Summary pending.*

### [Detection of Forced Change Within Combined Climate Fields Using Explainable Neural Networks](https://doi.org/10.1029/2021ms002941)
Rader et al. (2021), *Journal of Advances in Modeling Earth Systems*. 17 citations.

- **Main goal:** Detects forced climate change signals earlier by combining multiple variables and seasons with explainable neural networks.
- **Architecture:** Artificial neural networks predicting the year from single- and multi-variable maps, interpreted with layer-wise relevance propagation.
- **Data:** Forced climate model simulations from multiple CMIP models (e.g. temperature and precipitation maps across seasons).
- **Main result:** Combined fields allow earlier detection than single fields; LRP reveals multivariate indicator patterns that vary over time and between models.
- **Open work:** Using indicator patterns to investigate inter-model differences and applying to observations.
- **Issues:** Trained on model output; detection with observations not demonstrated in the abstract; LRP attribution can be ambiguous.
- *Basis: assessment*

### [FaIRGP: A Bayesian Energy Balance Model for Surface Temperatures Emulation](https://doi.org/10.1029/2023ms003926)
Bouabid et al. (2023), *Journal of Advances in Modeling Earth Systems*. 16 citations.

- **Main goal:** Combines physical interpretability of energy balance models with flexibility of data-driven emulators for surface temperature projections.
- **Architecture:** FaIRGP: Gaussian process emulator constrained by FaIR energy balance model response equations, Bayesian with tractable uncertainty.
- **Data:** ESM output (ScenarioMIP-type scenarios) for global mean and spatial surface temperature, with emissions/forcing inputs.
- **Main result:** Skillful emulation of global mean and spatial temperature across future scenarios, outperforming EBMs; yields estimates of TOA radiative forcing.
- **Open work:** Applications to detection and attribution and precipitation emulation.
- **Issues:** Temperature-only; linear energy balance structure may limit nonlinear responses; GP scalability.
- *Basis: assessment*

### [Reconstructing historical climate fields with deep learning](https://doi.org/10.1126/sciadv.adp0558)
Bochow et al. (2023), *Science Advances*. 16 citations.

*Summary pending.*

### [Probablistic Emulation of a Global Climate Model with Spherical DYffusion](https://doi.org/10.52202/079017-4052)
Cachay et al. (2024), *Neural Information Processing Systems*. 15 citations.

- **Main goal:** Builds a probabilistic, stable emulator of a global climate model that produces accurate climate ensembles, addressing deterministic emulators' biases and lack of ensembles.
- **Architecture:** Spherical DYffusion: dynamics-informed diffusion (DYffusion) combined with a spherical Fourier neural operator backbone.
- **Data:** Coarse (about 1 degree) FV3GFS simulations with climatological SST forcing, as used for ACE.
- **Main result:** Produces stable multi-year 6-hourly ensemble simulations and substantially reduces climate biases relative to baselines (reported as more than 50%), approaching the reference model's internal variability.
- **Open work:** Extending to time-varying forcing, coupled ocean and finer resolution.
- **Issues:** Abstract unavailable; climatological SST forcing only; emulator inherits FV3GFS biases.
- *Basis: abstract+knowledge*

### [ACE2‐SOM: Coupling an ML Atmospheric Emulator to a Slab Ocean and Learning the Sensitivity of Climate to Changed CO2](https://doi.org/10.1029/2024jh000575)
Clark et al. (2025), *Journal of Geophysical Research*. 15 citations.

*Summary pending.*

### [Reanalysis‐Based Global Radiative Response to Sea Surface Temperature Patterns: Evaluating the Ai2 Climate Emulator](https://doi.org/10.1029/2025gl115432)
Loon et al. (2025), *Geophysical Research Letters*. 13 citations.

*Summary pending.*

### [The Equilibrium Response of Atmospheric Machine‐Learning Models to Uniform Sea Surface Temperature Warming](https://doi.org/10.1029/2026ms005815)
Zhang et al. (2025), *Journal of Advances in Modeling Earth Systems*. 11 citations.

*Summary pending.*

### [Score‐Based Generative Emulation of Impact‐Relevant Earth System Model Outputs](https://doi.org/10.1029/2025ms005558)
Bouabid et al. (2025), *Journal of Advances in Modeling Earth Systems*. 11 citations.

*Summary pending.*

### [Probing forced responses and causality in data-driven climate emulators: conceptual limitations and the role of reduced-order models](https://arxiv.org/abs/2506.22552)
Falasca (2025), *arXiv*. 10 citations.

*Summary pending.*

### [Convolutional Neural Networks Trained on Internal Variability Predict Forced Response of TOA Radiation by Learning the Pattern Effect](https://doi.org/10.1029/2024gl109581)
Rugenstein et al. (2025), *Geophysical Research Letters*. 9 citations.

*Summary pending.*

### [Disentangling the effects of sea surface temperature and CO$_2$ in global machine learned weather-climate emulators](https://arxiv.org/abs/2606.07928)
Clark et al. (2026), *arXiv*. 6 citations.

*Summary pending.*

### [Modulation of Tropical Cyclogenesis by the Convectively Coupled Kelvin Waves: Insights From Data‐Driven Climate Emulator ACE2](https://doi.org/10.1029/2025gl117387)
Chien et al. (2026), *Geophysical Research Letters*. 4 citations.

*Summary pending.*

### [Evaluating Skill and Stability of ArchesWeather and ArchesWeatherGen under Multi-Decadal Climate Simulations](https://arxiv.org/abs/2605.29976)
Singh et al. (2026), *arXiv*. 3 citations.

*Summary pending.*

### [Extratropical Atmospheric Circulation Response to ENSO in Deep Learning Pacific Pacemaker Experiments](https://doi.org/10.1175/aies-d-25-0114.1)
Hua et al. (2025), *Artificial Intelligence for the Earth Systems*. 2 citations.

*Summary pending.*

<a id="parameterization"></a>
## Parameterization & hybrid models

### [Deep learning to represent subgrid processes in climate models](https://doi.org/10.1073/pnas.1810286115)
Rasp et al. (2018), *Proceedings of the National Academy of Sciences*. 927 citations.

- **Main goal:** Replaces heuristic subgrid parameterizations, especially for clouds and convection, with a neural network trained on explicit convection.
- **Architecture:** Fully connected deep neural network predicting all subgrid heating, moistening and radiative tendencies from column states, coupled online in a GCM.
- **Data:** Superparameterized Community Atmosphere Model (SPCAM) aquaplanet simulations with prescribed SSTs.
- **Main result:** Online multiyear simulations are stable and reproduce mean climate, precipitation extremes and the equatorial wave spectrum; energy is approximately conserved; generalizes to new SST patterns.
- **Open work:** Extending to real geography, ensuring stability and constraints, and handling out-of-distribution climates.
- **Issues:** Fails for temperatures well outside the training range; aquaplanet; later work showed online instability for other network configurations.
- *Basis: abstract*

### [Could Machine Learning Break the Convection Parameterization Deadlock?](https://doi.org/10.1029/2018gl078202)
Gentine et al. (2018), *Geophysical Research Letters*. 422 citations.

- **Main goal:** Tests whether ML trained on explicit convection can replace convection parameterizations, a key source of climate model bias.
- **Architecture:** Deep neural network (Cloud Brain, CBRAIN) mapping column states to convective heating, moistening and radiative tendencies.
- **Data:** Superparameterized climate model (SPCAM, embedded 2D cloud-resolving models) in an aquaplanet with prescribed SSTs; as little as three months of training data.
- **Main result:** CBRAIN skillfully predicts convective heating, moistening and radiative features, but reduces some of the superparameterization's variance.
- **Open work:** Online coupling in the host GCM and representing stochastic variability.
- **Issues:** Offline evaluation only; aquaplanet; variance underestimated; deterministic.
- *Basis: abstract*

### [Enforcing Analytic Constraints in Neural Networks Emulating Physical Systems.](https://doi.org/10.1103/physrevlett.126.098302)
Beucler et al. (2019), *Physical Review Letters*. 414 citations.

- **Main goal:** Make neural network emulators of physical systems respect analytic constraints such as conservation laws.
- **Architecture:** Constraints enforced either via the loss function (soft penalty) or via architecture with constraint layers that compute residual outputs to satisfy conservation exactly.
- **Data:** Convective parameterization emulation trained on output from an aquaplanet climate model with superparameterization (SPCAM).
- **Main result:** Architectural constraints enforce mass and energy conservation to within machine precision without degrading performance and reduce errors in outputs most affected by the constraints.
- **Open work:** Extending to other constraints, testing online coupled stability, and generalization to different climates.
- **Issues:** Only applies to constraints that can be written analytically; offline evaluation; does not guarantee stability or generalization.
- *Basis: abstract+knowledge*

### [A Neural Network Approach for a Fast and Accurate Computation of a Longwave Radiative Budget](https://doi.org/10.1175/1520-0450(1998)037<1385:annafa>2.0.co;2)
Chevallier et al. (1998), *Journal of Applied Meteorology*. 354 citations.

- **Main goal:** Speeds up longwave radiative transfer calculations in atmospheric models, which are costly when called at every grid point and time step.
- **Architecture:** Multilayer perceptron (the NeuroFlux approach) that maps atmospheric temperature, humidity and cloud profiles to longwave fluxes and cooling rates.
- **Data:** Trained on radiative transfer calculations over a large set of representative atmospheric profiles (the TIGR climatological dataset).
- **Main result:** The network reproduces longwave fluxes and cooling rates with accuracy close to the reference scheme at a much lower computational cost. Exact speed-up figures are not reported here.
- **Open work:** Extending the approach to more complex cloud representations and coupling it operationally in GCMs and NWP models.
- **Issues:** Fixed profile inputs and training set limit generalization to unseen climates; offline accuracy does not guarantee stable online coupling. Abstract unavailable.
- *Basis: assessment*

### [Subgrid modelling for two-dimensional turbulence using neural networks](https://doi.org/10.1017/jfm.2018.770)
Maulik et al. (2018), *Journal of Fluid Mechanics*. 350 citations.

- **Main goal:** Learn a data-driven subgrid closure for two-dimensional (Kraichnan) turbulence without heuristic assumptions.
- **Architecture:** Artificial neural network mapping local stencils of vorticity and streamfunction plus two eddy-viscosity kernel inputs to the subgrid vorticity source term.
- **Data:** Snapshots of high-fidelity direct numerical simulation of 2D decaying turbulence, coarse-grained to give subgrid targets.
- **Main result:** A priori PDF-based validation and a posteriori decaying turbulence runs show kinetic energy spectra consistent with the reference; a posteriori error must be included in model selection.
- **Open work:** Extension to 3D and geophysical flows, other Reynolds numbers, and more systematic a posteriori-aware training.
- **Issues:** Idealized 2D setting; a priori skill does not guarantee a posteriori accuracy; generalization beyond training regime not established.
- *Basis: abstract*

### [Prognostic Validation of a Neural Network Unified Physics Parameterization](https://doi.org/10.1029/2018gl078510)
Brenowitz et al. (2018), *Geophysical Research Letters*. 346 citations.

- **Main goal:** Replace human-designed parameterizations with a neural network that predicts subgrid heating and moistening and remains stable in prognostic use.
- **Architecture:** Feed-forward neural network unified physics parameterization predicting apparent heat and moisture sources, trained by minimizing error over multiple time steps rather than a single step.
- **Data:** Near-global aqua-planet cloud-resolving simulation at 4 km (NG-Aqua) coarse-grained to 160 km grid boxes.
- **Main result:** Multi-step training yields a numerically stable scheme; in prognostic single-column tests it reproduces NG-Aqua fluctuations and equilibrium better than the Community Atmosphere Model.
- **Open work:** Coupling to a full 3D GCM and testing stability and climate drift in online simulations.
- **Issues:** Only single-column prognostic tests; idealized aqua-planet with fixed SST; generalization to other climates and real geography untested.
- *Basis: assessment*

### [Stable machine-learning parameterization of subgrid processes for climate modeling at a range of resolutions](https://doi.org/10.1038/s41467-020-17142-3)
Yuval et al. (2020), *Nature Communications*. 284 citations.

- **Main goal:** Learns a subgrid parameterization from high-resolution simulations that is stable when coupled and examines performance across grid spacings.
- **Architecture:** Random forest parameterization predicting subgrid tendencies/fluxes from coarse-grained high-resolution output.
- **Data:** Coarse-grained output of a 3D high-resolution idealized atmospheric model (SAM on an equatorial beta-plane), at several coarse-graining factors.
- **Main result:** Coupled coarse simulations are stable and reproduce the high-resolution climate; performance is best at smaller horizontal grid spacings.
- **Open work:** Learn from emerging global high-resolution (storm-resolving) simulations and test in realistic GCM settings.
- **Issues:** Idealized domain; random forests are memory-heavy; generalization to warmer climates not tested here.
- *Basis: abstract+knowledge*

### [Spatially Extended Tests of a Neural Network Parametrization Trained by Coarse‐Graining](https://doi.org/10.1029/2019ms001711)
Brenowitz et al. (2019), *Journal of Advances in Modeling Earth Systems*. 181 citations.

- **Main goal:** Make a neural network parameterization trained on coarse-grained cloud-resolving model output stable when coupled to a GCM.
- **Architecture:** Neural network predicting residual heating and moistening in 160-km columns from coarse-resolution column state; linearized response analysis to diagnose instability.
- **Data:** Near-global cloud-resolving simulation (SAM) with 4-km grid coarse-grained to 160 km.
- **Main result:** Coupled runs crash within days due to exploiting synchrony with upper-level (above 10 km) variables; removing these inputs stabilizes simulations, which beat a coarse run without parameterization though the mean state drifts.
- **Open work:** Remove drift, ensure long-term stability, and develop systematic stability diagnostics.
- **Issues:** Slow mean-state drift; stability achieved by ad hoc input removal; near-global aquaplanet setting.
- *Basis: abstract+knowledge*

### [New Approach to Calculation of Atmospheric Model Physics: Accurate and Fast Neural Network Emulation of Longwave Radiation in a Climate Model](https://doi.org/10.1175/mwr2923.1)
Krasnopolsky et al. (2005), *Monthly Weather Review*. 165 citations.

- **Main goal:** Reduces the cost of the longwave radiation parameterization in a climate model by replacing it with an accurate, fast statistical emulator.
- **Architecture:** Shallow feed-forward neural network (single hidden layer MLP) emulating the full longwave radiation scheme, mapping column profiles to heating rates and fluxes.
- **Data:** Input/output pairs generated by the original longwave radiation scheme in the NCAR Community Atmospheric Model (CAM) climate simulations.
- **Main result:** The NN emulation is much faster than the original scheme while closely reproducing its outputs; multiyear runs with the emulator stay close to control simulations.
- **Open work:** Emulating shortwave radiation and other physics, and checking robustness in changed-climate conditions.
- **Issues:** Emulates an existing parameterization, so inherits its errors; generalization outside the training climate is not guaranteed. Abstract unavailable.
- *Basis: assessment*

### [Machine Learning for Stochastic Parameterization: Generative Adversarial Networks in the Lorenz '96 Model](https://doi.org/10.1029/2019ms001896)
Gagne et al. (2019), *Journal of Advances in Modeling Earth Systems*. 161 citations.

- **Main goal:** Build stochastic, data-driven subgrid parameterizations that represent uncertainty in unresolved processes.
- **Architecture:** Conditional generative adversarial network producing stochastic subgrid forcing, with different input noise configurations.
- **Data:** Output of the two-scale Lorenz '96 model.
- **Main result:** Some GAN configurations outperform a bespoke polynomial stochastic baseline at weather and climate time scales, reproducing spatiotemporal correlations and regimes; good forecast skill correlates with good climate.
- **Open work:** Scaling to more realistic models and higher-dimensional subgrid processes.
- **Issues:** Toy model; GAN training is unstable and sensitive to configuration; not all configurations beat the baseline.
- *Basis: abstract*

### [Climate-invariant machine learning](https://doi.org/10.1126/sciadv.adj7250)
Beucler et al. (2021), *Science Advances*. 140 citations.

- **Main goal:** Makes ML parameterizations generalize across climate regimes they were not trained on.
- **Architecture:** Climate-invariant ML: physically motivated rescaling of inputs (e.g., specific humidity to relative humidity, temperature to buoyancy-based variables, scaled surface fluxes) and outputs so that mappings are similar across climates; applied to neural networks.
- **Data:** Three atmospheric models (including SPCAM and SAM-based configurations) under cold and warm climates and different configurations.
- **Main result:** Maintains high offline accuracy across a wide range of climates and configurations, improving generalization and data efficiency over raw-variable models.
- **Open work:** Test online coupled stability and generalization; find invariant transformations for more processes.
- **Issues:** Results are mainly offline; transformations are hand-crafted.
- *Basis: abstract+knowledge*

### [Calibrate, emulate, sample](https://doi.org/10.1016/j.jcp.2020.109716)
Cleary et al. (2020), *Journal of Computational Physics*. 140 citations.

- **Main goal:** Enable Bayesian parameter estimation with uncertainty when the forward model is expensive, noisy and has no derivatives, as in climate model calibration.
- **Architecture:** Three-step Calibrate-Emulate-Sample: ensemble Kalman sampling for calibration, Gaussian process emulation of the parameter-to-data map using those runs, then MCMC sampling with the emulator.
- **Data:** Test problems in the paper include an idealized GCM convection-parameter problem and simpler inverse problems; not a data-driven training study.
- **Main result:** Provides approximate Bayesian posteriors with few forward model evaluations; EKS places training points where posterior mass is concentrated, making emulation efficient.
- **Open work:** Scale to high-dimensional parameters and data, and apply to full climate model parameterization calibration.
- **Issues:** Posterior is approximate and depends on emulator quality; GP emulators scale poorly to high dimensions.
- *Basis: abstract+knowledge*

### [Use of Neural Networks for Stable, Accurate and Physically Consistent Parameterization of Subgrid Atmospheric Processes With Good Performance at Reduced Precision](https://doi.org/10.1029/2020gl091363)
Yuval et al. (2020), *Geophysical Research Letters*. 128 citations.

- **Main goal:** Builds a neural-network subgrid parameterization that is stable, physically consistent and cheap, improving on random forests.
- **Architecture:** Neural networks predicting subgrid fluxes (rather than tendencies) to enforce physical constraints such as conservation, tested with various architectures and reduced numerical precision.
- **Data:** Coarse-grained high-resolution idealized atmospheric simulation (SAM) with accurately computed subgrid terms.
- **Main result:** Coupled simulations are stable and replicate the high-resolution climate with accuracy similar to a random forest while using far less memory; stable across resolutions and architectures, and reduced precision does not degrade results.
- **Open work:** Extend to global and realistic configurations and to climate change generalization.
- **Issues:** Idealized domain; evaluation against the same high-resolution model used for training.
- *Basis: abstract*

### [Stable a posteriori LES of 2D turbulence using convolutional neural networks: Backscattering analysis and generalization to higher Re via transfer learning](https://doi.org/10.1016/j.jcp.2022.111090)
Guan et al. (2021), *Journal of Computational Physics*. 128 citations.

- **Main goal:** Addresses instability and poor generalization of data-driven subgrid-scale (SGS) models for large-eddy simulation (LES) in online use.
- **Architecture:** Deep fully convolutional neural networks predicting SGS forcing from resolved fields, with transfer learning to new flows.
- **Data:** DNS of 2D decaying turbulence, filtered and coarse-grained; transfer to flows with 16x higher Reynolds number.
- **Main result:** With enough training samples the LES-CNN is stable and accurate a posteriori; instabilities trace to poor capture of backscatter with small training sets; retraining on about 1% new data enables accurate LES at 16x higher Re.
- **Open work:** Extension to 3D, forced, and geophysical (e.g. rotating, stratified) turbulence and to more complex flows.
- **Issues:** Idealized 2D decaying turbulence; requires large training sets for stability; generalization still needs some data from the target flow.
- *Basis: abstract*

### [Interpreting and Stabilizing Machine-Learning Parametrizations of Convection](https://doi.org/10.1175/jas-d-20-0082.1)
Brenowitz et al. (2020), *Journal of the Atmospheric Sciences*. 125 citations.

- **Main goal:** Explains why neural-network convection parameterizations become unstable when coupled to atmospheric dynamics and provides diagnostics to interpret and stabilize them.
- **Architecture:** Interpretability tools for NN parameterizations: nonlinear sensitivity to lower-tropospheric stability and mid-tropospheric moisture, plus linearized response functions coupled to simplified gravity-wave dynamics for spectral stability analysis.
- **Data:** Two sets of NNs, one trained on superparameterized CAM (SPCAM) output and one on a near-global cloud-resolving model (GCRM).
- **Main result:** Both NNs predict stronger heating/drying in moist, unstable environments, consistent with observations. Instability arises when coupled NNs support unstable propagating gravity waves with phase speeds above 5 m/s; standing unstable modes are not catastrophic.
- **Open work:** Use the diagnostics routinely during training or as constraints to design NNs that are stable online by construction, and test in full GCMs.
- **Issues:** Linearized gravity-wave analysis is a simplified framework and may miss nonlinear instability routes; the stability fixes are incremental rather than guaranteed.
- *Basis: abstract*

### [Correcting Weather and Climate Models by Machine Learning Nudged Historical Simulations](https://doi.org/10.1029/2021gl092555)
Watt‐Meyer et al. (2021), *Geophysical Research Letters*. 122 citations.

- **Main goal:** Reduces systematic biases in a coarse weather/climate model by learning corrective tendencies from a hindcast nudged toward observational analysis.
- **Architecture:** Random forest predicting nudging tendencies of temperature, humidity and horizontal winds from the column model state, coupled online to FV3GFS at each timestep.
- **Data:** Coarse-resolution (about 200 km) FV3GFS hindcast nudged toward an observational (GFS) analysis.
- **Main result:** Year-long coupled runs are stable; short-term forecast errors in 500 hPa height, surface pressure and near-surface temperature drop significantly and annual-mean precipitation RMSE falls about 20%.
- **Open work:** Better ML models (e.g. neural networks), reference data from storm-resolving simulations, and fixing drifts in the upper atmosphere.
- **Issues:** Nudging tendencies predicted with only moderate skill; some biases unchanged or worsened (e.g. upper-atmospheric temperature); targets inherit analysis errors.
- *Basis: abstract+knowledge*

### [Coupled online learning as a way to tackle instabilities and biases in neural network parameterizations: general algorithms and Lorenz 96 case study (v1.0)](https://doi.org/10.5194/gmd-2019-319)
Rasp (2019), *Geoscientific Model Development*. 118 citations.

- **Main goal:** Tackles instabilities and biases of offline-trained neural network parameterizations once coupled to Earth system models.
- **Architecture:** Coupled online learning: a pretrained NN parameterization runs alongside a high-resolution simulation kept in sync by nudging, so the NN learns from tendencies at the states it produces.
- **Data:** Lorenz 96 two-scale model; algorithms also described for 3D cloud-resolving models and superparameterization.
- **Main result:** In Lorenz 96, coupled learning recovers the true parameterization; detailed implementation algorithms for realistic models are presented.
- **Open work:** Implementing coupled learning in actual cloud-resolving or superparameterized climate models; challenges left open are discussed.
- **Issues:** Demonstrated only in a toy model; running high-resolution models in parallel is expensive; nudging may affect the learned tendencies.
- *Basis: abstract*

### [A Deep Learning Algorithm of Neural Network for the Parameterization of Typhoon‐Ocean Feedback in Typhoon Forecast Models](https://doi.org/10.1002/2018gl077004)
Jiang et al. (2018), *Geophysical Research Letters*. 111 citations.

- **Main goal:** Provides flow-dependent typhoon-induced SST cooling to atmosphere-only typhoon forecast models, which lack ocean feedback.
- **Architecture:** Neural network algorithms: a shallow single-layer network and a deep network (4x5 neuron matrix) separating atmospheric and oceanic factors in different layers.
- **Data:** Historical typhoon and ocean data (atmospheric factors such as winds, oceanic factors such as eddies); tested in four typhoon case simulations.
- **Main result:** The deep algorithm gives a stable crescent-shaped cooling pattern and reduces maximum wind intensity errors by 60-70% in four cases versus atmosphere-only runs.
- **Open work:** Testing on many more typhoons and in operational forecast systems.
- **Issues:** Only four case studies; very small network; compared against atmosphere-only runs rather than coupled models.
- *Basis: abstract*

### [A Moist Physics Parameterization Based on Deep Learning](https://doi.org/10.1029/2020ms002076)
Han et al. (2020), *Journal of Advances in Modeling Earth Systems*. 107 citations.

- **Main goal:** Reduce GCM precipitation and circulation biases by replacing moist physics (convection and clouds) with a deep learning parameterization.
- **Architecture:** Residual convolutional neural network (ResCu) over the vertical column, including moist static energy conservation and past history of atmospheric states, convection and clouds.
- **Data:** One year of SPCAM superparameterized GCM output for training, an independent year for testing; single-column model cases for midlatitude continental and tropical monsoon convection.
- **Main result:** ResCu reproduces SPCAM time mean and variance of heating, drying and cloud water, outperforms other network types, and in single-column prognostic tests gives smaller temperature and moisture biases than conventional schemes.
- **Open work:** Couple ResCu into a full 3D GCM and test long-term stability and climate simulation.
- **Issues:** Only single-column prognostic tests, not full GCM coupling; trained on one year of SPCAM, so inherits its biases and may not generalize to other climates.
- *Basis: abstract*

### [Correcting Coarse‐Grid Weather and Climate Models by Machine Learning From Global Storm‐Resolving Simulations](https://doi.org/10.1029/2021ms002794)
Bretherton et al. (2021), *Journal of Advances in Modeling Earth Systems*. 99 citations.

- **Main goal:** Corrects a coarse-grid global model toward a global storm-resolving model to reduce biases in regional precipitation and temperature.
- **Architecture:** ML (neural nets and random forests) of nudging tendencies of temperature, humidity and optionally winds from column state; also learns downwelling radiative surface fluxes.
- **Data:** FV3GFS at 200 km nudged to a 40-day X-SHiELD 3 km reference simulation with the same historical SSTs.
- **Main result:** Best setup corrects temperature and humidity only; 850 hPa temperature forecasts gain 18 h of skill at 3–7 day leads and time-mean precipitation patterns improve 30%; neural nets slightly beat random forests.
- **Open work:** Longer training sets, multiple climates, and stable inclusion of wind corrections.
- **Issues:** Only 40 days of reference data; wind corrections degrade time-mean upper tropospheric fields; generalization to other climates is untested.
- *Basis: abstract*

### [Machine Learning the Warm Rain Process](https://doi.org/10.1029/2020ms002268)
Gettelman et al. (2020), *Journal of Advances in Modeling Earth Systems*. 97 citations.

- **Main goal:** Combines accuracy of detailed bin warm-rain microphysics with the cost of a bulk scheme in a GCM by using neural network emulation.
- **Architecture:** Two-stage neural networks: a classifier identifies where autoconversion and accretion tendencies are nonzero (and sign), then a regressor predicts magnitudes.
- **Data:** Output from CAM6 running the bin (TAU) microphysics for warm rain; perfect-model experiments.
- **Main result:** Bin microphysics improves rain onset and light-rain frequency and changes cloud feedback; the emulators recover the bin-model solution in almost all respects at the control simulation's cost (bin scheme alone is 400% slower).
- **Open work:** Applying to other microphysical processes and ice; guarding against extrapolation under climate change.
- **Issues:** Risks of overfitting, extrapolation and linearization; emulates a model, not observations; tested in perfect-model setting.
- *Basis: abstract+knowledge*

### [A Posteriori Learning for Quasi‐Geostrophic Turbulence Parametrization](https://doi.org/10.1029/2022ms003124)
Frezat et al. (2022), *Journal of Advances in Modeling Earth Systems*. 93 citations.

- **Main goal:** Builds subgrid parametrizations that perform well in full simulations (a posteriori), not just on offline (a priori) metrics.
- **Architecture:** Neural network subgrid closures for 2D quasi-geostrophic turbulence trained end-to-end through a differentiable solver over model trajectories, compared with a priori supervised training.
- **Data:** High-resolution 2D QG turbulence simulations coarse-grained to provide reference trajectories.
- **Main result:** Closures trained a priori tend to be unstable online. End-to-end closures outperform empirical and data-driven schemes in accuracy and stability and generalize to other flow configurations.
- **Open work:** Adopt differentiable programming in climate models and scale to 3D ocean and atmosphere models.
- **Issues:** Idealized 2D setting. Requires a differentiable solver, and long unrolled training is costly.
- *Basis: abstract*

### [Machine Learning Emulation of Gravity Wave Drag in Numerical Weather Forecasting](https://doi.org/10.1029/2021ms002477)
Chantry et al. (2021), *Journal of Advances in Modeling Earth Systems*. 91 citations.

- **Main goal:** Assesses ML emulation as an accelerator of parameterization schemes in operational weather forecasting, focusing on non-orographic gravity wave drag.
- **Architecture:** Neural network emulators (various complexities) of the non-orographic gravity wave drag scheme in the ECMWF IFS.
- **Data:** Training data from the IFS parameterization, including a higher-complexity version of the scheme.
- **Main result:** Emulators are stable and accurate up to seasonal timescales; training on the more complex scheme gives more accurate forecasts; on GPU they are 10x faster than the CPU scheme, but similar cost on CPU.
- **Open work:** Extending to other parameterizations and GPU-accelerated operational systems.
- **Issues:** No speedup on current CPU hardware due to data movement; emulates an existing scheme rather than learning new physics.
- *Basis: abstract+knowledge*

### [A Hybrid Approach to Atmospheric Modeling That Combines Machine Learning With a Physics‐Based Numerical Model](https://doi.org/10.1029/2021ms002712)
Arcomano et al. (2022), *Journal of Advances in Modeling Earth Systems*. 85 citations.

- **Main goal:** Combines ML with a physics-based global atmospheric model to improve weather forecasts and climate simulation.
- **Architecture:** CHyPP hybrid: reservoir computing (parallel, localized reservoirs) combined with a low-resolution AGCM (SPEEDY).
- **Data:** ERA5 reanalysis used for training and verification.
- **Main result:** Gives more accurate forecasts than the host AGCM for the first 7-8 days, and longer near the surface. It beats ML-only and linear-regression hybrids, and a 10-year simulation has smaller systematic errors and more realistic variability.
- **Open work:** Apply to higher-resolution models and coupled systems, and train from data assimilation output.
- **Issues:** Host model is a coarse, simple AGCM, so gains may not transfer to state-of-the-art models.
- *Basis: abstract+knowledge*

### [ClimSim: A large multi-scale dataset for hybrid physics-ML climate emulation](https://doi.org/10.52202/075280-0968)
Yu et al. (2023), *Neural Information Processing Systems*. 76 citations.

- **Main goal:** Provides a large dataset to train and benchmark ML emulators of subgrid physics for hybrid physics-ML climate models.
- **Architecture:** Dataset and benchmark: input-output pairs of multi-scale model physics, with baseline ML emulators (e.g. MLP, CNN, others).
- **Data:** E3SM-MMF multiscale climate model simulations (low- and high-resolution versions), billions of samples.
- **Main result:** Releases the largest such dataset with baseline models and metrics for offline emulation.
- **Open work:** Online (coupled) testing of emulators and stability; physical constraints.
- **Issues:** Benchmark mainly offline; abstract truncated in input; online performance not ensured by offline scores.
- *Basis: abstract+knowledge*

### [Using Machine Learning at scale in numerical simulations with SmartSim: An application to ocean climate modeling](https://doi.org/10.1016/j.jocs.2022.101707)
Partee et al. (2022), *Journal of Computational Science*. 76 citations.

- **Main goal:** Enable machine learning inference at scale inside running numerical simulations, demonstrated with ocean climate modelling.
- **Architecture:** SmartSim, a software library coupling simulations to ML via an in-memory database, demonstrated with a neural network predicting eddy kinetic energy for an ocean-model mesoscale parameterization.
- **Data:** MOM6 global ocean simulations; network trained on higher-resolution model output.
- **Main result:** Abstract not available; the paper reports that online ML inference can be coupled to large ocean simulations on HPC with acceptable overhead.
- **Open work:** Broader use of online ML parameterizations and evaluation of climate impacts of the learned scheme.
- **Issues:** Primarily a software/infrastructure paper; scientific skill of the parameterization is secondary. Details here rely on partial knowledge.
- *Basis: assessment*

### [Stable climate simulations using a realistic general circulation model with neural network parameterizations for atmospheric moist physics and radiation processes](https://doi.org/10.5194/gmd-15-3923-2022)
Wang et al. (2022), *Geoscientific Model Development*. 72 citations.

- **Main goal:** Achieve stable, multi-year climate simulations with ML parameterizations of moist physics and radiation in a realistically configured GCM rather than aquaplanets.
- **Architecture:** Residual deep neural networks (ResDNNs) emulating super-parameterization (SP) inside a hybrid ML-physical CAM5 GCM; ensembles selected by trial and error for accuracy and online stability.
- **Data:** Training data from super-parameterized CAM (SPCAM) simulations with real geography at 1.9 x 2.5 degree resolution; compared against CAM5 and SP in prognostic runs.
- **Main result:** Stable simulations exceed 10 years, about 30x faster than SP; improves tropical land precipitation, extreme precipitation frequency and MJO propagation versus CAM5.
- **Open work:** Improve skill over tropical oceans and reduce mean-state biases; find principled rather than trial-and-error routes to stability.
- **Issues:** Larger mean-state biases than CAM5 in tropopause and high-latitude temperature and tropical ocean precipitation; network selection by trial and error; target is SP, not observations.
- *Basis: abstract*

### [Assessing the Potential of Deep Learning for Emulating Cloud Superparameterization in Climate Models With Real‐Geography Boundary Conditions](https://doi.org/10.1029/2020ms002385)
Mooers et al. (2020), *Journal of Advances in Modeling Earth Systems*. 62 citations.

- **Main goal:** Assess whether deep neural networks can emulate cloud superparameterization in a realistic-geography climate model, toward hybrid models.
- **Architecture:** Feed-forward deep neural network with formally optimized hyperparameters (about 250 trials), applied locally in space and time.
- **Data:** Offline output from the superparameterized Community Atmosphere Model (SPCAM) with real geography at 15-minute sampling.
- **Main result:** Explains over 70% of temporal variance in the mid-to-upper troposphere; weaker in the tropical marine boundary layer due to fast stochastic convection; skillful on diurnal to synoptic scales with some precipitation distortion.
- **Open work:** Combine positivity constraints with tuning for precipitation, and couple the emulator online in hybrid climate models.
- **Issues:** Offline evaluation only, with no online stability test; deterministic network struggles with stochastic convective signals.
- *Basis: abstract*

### [Implicit learning of convective organization explains precipitation stochasticity](https://doi.org/10.1073/pnas.2216158120)
Shamekh et al. (2023), *Proceedings of the National Academy of Sciences*. 60 citations.

- **Main goal:** Explain why climate models underestimate precipitation variance by learning the effect of convective organization on precipitation.
- **Architecture:** Neural network that implicitly learns a low-dimensional organization metric from high-resolution fields, combined with coarse-scale variables to predict precipitation.
- **Data:** High-resolution cloud-resolving simulation output, coarse-grained to climate-model scales.
- **Main result:** The learned organization metric explains precipitation stochasticity almost entirely, could replace a stochastic parameterization, and is temporally persistent so it can be predicted from its own history.
- **Open work:** Implementing the organization metric as a prognostic variable in a climate-model convection parameterization and testing online.
- **Issues:** Trained on idealized simulations; the metric is not directly observable; online coupled performance not shown in the abstract.
- *Basis: assessment*

### [Training Physics‐Based Machine‐Learning Parameterizations With Gradient‐Free Ensemble Kalman Methods](https://doi.org/10.1029/2022ms003105)
Lopez‐Gomez et al. (2022), *Journal of Advances in Modeling Earth Systems*. 55 citations.

- **Main goal:** Train physics-based and ML parameterizations without gradients or residual tendencies by posing learning as an inverse problem.
- **Architecture:** Unscented and ensemble Kalman inversion, gradient-free and parallelizable, applied to calibrate an eddy-diffusivity mass-flux (EDMF) turbulence and convection scheme, including hybrid closures with neural networks.
- **Data:** Large-eddy simulation data used as calibration targets.
- **Main result:** Methods converge quickly, are robust to noise and model failures, support batching, and calibrate hybrid parameterizations; unscented Kalman inversion gives parameter uncertainty.
- **Open work:** Calibrating parameterizations against observations and climate statistics within full Earth system models.
- **Issues:** Demonstrated in single-column setting with LES targets; scaling to very high-dimensional neural network parameter spaces is challenging.
- *Basis: assessment*

### [Data‐Driven Equation Discovery of a Cloud Cover Parameterization](https://doi.org/10.1029/2023ms003763)
Grundner et al. (2023), *Journal of Advances in Modeling Earth Systems*. 53 citations.

- **Main goal:** Find interpretable, transferable cloud cover parameterizations that avoid neural networks' poor out-of-distribution behavior.
- **Architecture:** Hierarchical framework combining symbolic regression, sequential feature selection and physical constraints to discover analytical cloud cover equations.
- **Data:** Coarse-grained global storm-resolving ICON simulations; transfer tested on ERA5 reanalysis.
- **Main result:** Best equation reaches R2 = 0.94 with 11 parameters, comparable to NNs, beats Xu-Randall across regimes (Hellinger distance below 0.09), and transfers better to ERA5 than other schemes.
- **Open work:** Online implementation in climate models and equation discovery for other parameterized processes.
- **Issues:** Diagnostic cloud cover only; online performance and climate-change generalization not shown in the abstract.
- *Basis: assessment*

### [Deep Learning Based Cloud Cover Parameterization for ICON](https://doi.org/10.1029/2021ms002959)
Grundner et al. (2021), *Journal of Advances in Modeling Earth Systems*. 52 citations.

- **Main goal:** Develop neural network cloud cover parameterizations for ICON from storm-resolving simulations.
- **Architecture:** Three NN types differing in vertical locality (cell-based, neighborhood-based, column-based), with SHAP interpretability analysis.
- **Data:** Coarse-grained regional (NARVAL) and global (QUBICC) ICON storm-resolving simulations.
- **Main result:** NNs accurately diagnose subgrid cloud cover in similar regimes; global NNs reproduce regional SRM cloud cover; SHAP shows column-based NN overemphasizes specific humidity and cloud ice.
- **Open work:** Online coupling in ICON and improving generalization, with neighborhood models as a compromise.
- **Issues:** Offline, diagnostic evaluation only; generalization limited outside training distribution.
- *Basis: abstract+knowledge*

### [Accelerating Radiation Computations for Dynamical Models With Targeted Machine Learning and Code Optimization](https://doi.org/10.1029/2020ms002226)
Ukkonen et al. (2020), *Journal of Advances in Modeling Earth Systems*. 52 citations.

- **Main goal:** Speed up radiative transfer in weather and climate models without sacrificing accuracy, especially with many greenhouse gases.
- **Architecture:** Neural networks replacing gas optics in the RTE+RRTMGP scheme, implemented in Fortran with BLAS batched inference, combined with a refactored radiative transfer solver.
- **Data:** Training data from carefully constructed atmospheric profiles spanning a wide range of conditions; validated against line-by-line benchmark calculations.
- **Main result:** NN gas optics is 1-6 times faster; clear-sky longwave and shortwave fluxes 3.5 and 1.8 times faster on Intel; heating-rate errors typically below 0.1 K/day and TOA forcing errors below 0.5 W/m2.
- **Open work:** Extend to cloudy-sky computations, GPU platforms and online testing in full models.
- **Issues:** Clear-sky only in the reported speedups; gains depend on hardware and software; accuracy outside the training distribution is not guaranteed.
- *Basis: abstract*

### [Non‐Local Parameterization of Atmospheric Subgrid Processes With Neural Networks](https://doi.org/10.1029/2022ms002984)
Wang et al. (2022), *Journal of Advances in Modeling Earth Systems*. 52 citations.

- **Main goal:** Test whether non-local (multi-column) inputs improve ML parameterizations of atmospheric subgrid processes compared with single-column ones.
- **Architecture:** Neural networks using inputs from 3x3 neighbouring columns, with interpretability analysis and experiments adding vertical velocity or divergence as inputs.
- **Data:** Coarse-grained output from high-resolution simulations (SAM, quasi-global aquaplanet) used to derive subgrid tendencies and momentum fluxes.
- **Main result:** Non-local inputs improve offline predictions, especially for subgrid momentum transport and near fronts and convective instability; much of the gain comes from horizontal divergence, and adding vertical velocity substantially helps.
- **Open work:** Online testing of non-local and vertical-velocity inputs in coupled simulations, as the authors note.
- **Issues:** Offline evaluation only; idealized aquaplanet; non-local inputs may complicate implementation and stability.
- *Basis: abstract+knowledge*

### [Improving Convection Trigger Functions in Deep Convective Parameterization Schemes Using Machine Learning](https://doi.org/10.1029/2020ms002365)
Zhang et al. (2021), *Journal of Advances in Modeling Earth Systems*. 46 citations.

- **Main goal:** Improves deep convection trigger functions in GCM convection schemes, whose deficiencies degrade climate simulations, for example the diurnal cycle of precipitation.
- **Architecture:** XGBoost gradient-boosted tree classifier that predicts whether convection occurs from large-scale environmental variables. It is trained per site and jointly, and interpreted to extract physical insight.
- **Data:** Long-term ARM constrained variational analysis forcing data at the Southern Great Plains (continental midlatitude) and Manaus (tropical) sites.
- **Main result:** F1 scores are 91% at SGP and 93% at MAO; the unified trigger reaches 91% with almost no degradation. It clearly outperforms dilute and undilute CAPE and dCAPE triggers and reduces overprediction of convection occurrence.
- **Open work:** Implement the ML trigger online in a GCM, test a global trigger, and use the insights to improve CAPE-based triggers.
- **Issues:** Trained on only two sites, so global generalization is unproven. The evaluation is offline (single column), not coupled climate simulation.
- *Basis: assessment*

### [Non‐Linear Dimensionality Reduction With a Variational Encoder Decoder to Understand Convective Processes in Climate Models](https://doi.org/10.1029/2022ms003130)
Behrens et al. (2022), *Journal of Advances in Modeling Earth Systems*. 41 citations.

- **Main goal:** Make ML convection parameterizations interpretable by compressing subgrid convective processes into a low-dimensional latent space.
- **Architecture:** Variational encoder-decoder (VED) with a 5-node latent space mapping large-scale state to subgrid convective tendencies and radiative outputs.
- **Data:** Aquaplanet superparameterized climate model (SPCAM) simulation with explicitly resolved convection.
- **Main result:** The VED reproduces convective processes about as well as earlier feed-forward networks; latent dimensions separate stable vs deep convection, cirrus vs low cumulus, and shallow convection linked to moisture and surface heating.
- **Open work:** Online coupling, use of the generative properties for stochastic parameterization, and extension to realistic geography.
- **Issues:** Aquaplanet setting only; offline evaluation; latent interpretation is partly subjective.
- *Basis: abstract+knowledge*

### [Machine Learning Gravity Wave Parameterization Generalizes to Capture the QBO and Response to Increased CO2](https://doi.org/10.1029/2022gl098174)
Espinosa et al. (2022), *Geophysical Research Letters*. 40 citations.

- **Main goal:** Test whether ML emulators of non-orographic gravity-wave drag generalize out of sample, including to the QBO and to increased CO2.
- **Architecture:** Single-column artificial neural networks of varying complexity and input sets emulating a conventional gravity-wave parameterization, coupled online to the host model.
- **Data:** Idealized climate model (MiMA) with the Alexander-Dunkerton scheme as target; training on one annual cycle and one QBO phase.
- **Main result:** Moderately complex networks coupled online generate full QBO cycles, and the climate response to enhanced CO2 matches the physics-based scheme.
- **Open work:** Learning gravity-wave schemes from observational or high-resolution estimates of momentum flux rather than from an existing scheme.
- **Issues:** Emulates an existing parameterization, so inherits its assumptions; idealized model; sensitivity to architecture and inputs.
- *Basis: abstract+knowledge*

### [Correcting a 200 km Resolution Climate Model in Multiple Climates by Machine Learning From 25 km Resolution Simulations](https://doi.org/10.1029/2022ms003219)
Clark et al. (2022), *Journal of Advances in Modeling Earth Systems*. 40 citations.

- **Main goal:** Extends ML correction of a coarse global atmosphere model toward fine-resolution behaviour to multiple climates and multi-year simulations.
- **Architecture:** ML models predict corrective temperature and humidity tendencies and surface radiative fluxes from the column state. Training targets come from nudging the coarse (~200 km) FV3GFS toward coarsened fine-resolution (~25 km) runs.
- **Data:** Four 2-year ~25 km FV3GFS simulations with SSTs perturbed by -4, 0, +4 and +8 K.
- **Main result:** In 5.25-year ML-corrected runs, pattern errors of land precipitation fall by 8-28% and of land surface temperature by 19-25% across climates. Impact on ocean precipitation is neutral.
- **Open work:** Improve ocean precipitation, test coupled ocean configurations, and generalize to unseen climates.
- **Issues:** Prescribed SSTs; reference is a model rather than observations. Short training runs, with no gain over ocean.
- *Basis: abstract*

### [Using Machine Learning to Generate a GISS ModelE Calibrated Physics Ensemble (CPE)](https://doi.org/10.1029/2024ms004713)
Elsaesser et al. (2025), *Journal of Advances in Modeling Earth Systems*. 26 citations.

*Summary pending.*

### [Simulating Atmospheric Processes in Earth System Models and Quantifying Uncertainties With Deep Learning Multi‐Member and Stochastic Parameterizations](https://doi.org/10.1029/2024ms004272)
Behrens et al. (2024), *Journal of Advances in Modeling Earth Systems*. 18 citations.

*Summary pending.*

### [Machine‐Learned Climate Model Corrections From a Global Storm‐Resolving Model: Performance Across the Annual Cycle](https://doi.org/10.1029/2022ms003400)
Kwa et al. (2022), *Journal of Advances in Modeling Earth Systems*. 17 citations.

- **Main goal:** Improves a coarse global climate model with ML corrections learned from a storm-resolving model across a full annual cycle.
- **Architecture:** ML models learning state-dependent nudging tendencies of temperature and humidity and surface radiative fluxes, added to the coarse model.
- **Data:** Year-long GFDL X-SHiELD 3 km GSRM simulation; 200 km FV3GFS coarse model.
- **Main result:** Corrected runs are stable for multiple years; time-mean pattern errors drop by 6-26% for land surface temperature and 9-25% for land precipitation versus no-ML.
- **Open work:** Reducing the new climate and circulation biases, and generalization to warmer climates.
- **Issues:** ML-corrected runs develop other biases of comparable amplitude to baseline; only one year of training data.
- *Basis: abstract*

### [Stable Machine‐Learning Parameterization of Subgrid Processes in a Comprehensive Atmospheric Model Learned From Embedded Convection‐Permitting Simulations](https://doi.org/10.1029/2024ms004618)
Hu et al. (2024), *Journal of Advances in Modeling Earth Systems*. 17 citations.

- **Main goal:** Emulates the embedded cloud-resolving model of a multiscale modeling framework (MMF) with ML to achieve stable, realistic hybrid climate simulations.
- **Architecture:** U-Net neural network parameterization of subgrid processes with physical thermodynamic constraints for microphysics, coupled online to the host model.
- **Data:** Embedded convection-permitting simulations from E3SM-MMF (ClimSim-type data) with coarse real geography, seasonality and land coupling.
- **Main result:** Stable for at least 5 years with zonal mean tropospheric temperature bias within 2 K, water vapor within 1 g/kg and precipitation RMSE of 0.96 mm/day; first realistic multi-year cloud condensate climatology.
- **Open work:** Reducing persistent regional biases through new strategies for online performance optimization.
- **Issues:** Persistent regional biases; 5-year runs are short for climate; tested only in the present-day configuration.
- *Basis: abstract+knowledge*

### [Perspectives on Systematic Cloud Microphysics Scheme Development With Machine Learning](https://doi.org/10.1029/2025ms005341)
Lamb et al. (2025), *Journal of Advances in Modeling Earth Systems*. 12 citations.

*Summary pending.*

### [CondensNet: enabling stable long-term climate simulations via hybrid deep learning models with adaptive physical constraints](https://doi.org/10.1038/s41612-025-01269-5)
Wang et al. (2025), *npj Climate and Atmospheric Science*. 12 citations.

*Summary pending.*

### [Beyond the Training Data: Confidence‐Guided Mixing of Parameterizations in a Hybrid AI‐Climate Model](https://doi.org/10.1029/2025ms005544)
Heuer et al. (2025), *Journal of Advances in Modeling Earth Systems*. 11 citations.

*Summary pending.*

### [Tuning the ICON-A 2.6.4 climate model with machine-learning-based emulators and history matching](https://doi.org/10.5194/gmd-18-3681-2025)
Bonnet et al. (2025), *Geoscientific Model Development*. 10 citations.

*Summary pending.*

### [SuperdropNet: A Stable and Accurate Machine Learning Proxy for Droplet‐Based Cloud Microphysics](https://doi.org/10.1029/2024ms004279)
Sharma et al. (2024), *Journal of Advances in Modeling Earth Systems*. 9 citations.

*Summary pending.*

### [Data‐Driven Probabilistic Air‐Sea Flux Parameterization](https://doi.org/10.1029/2025gl120472)
Wu et al. (2025), *Geophysical Research Letters*. 7 citations.

*Summary pending.*

### [Adjoint‐Based Online Learning of Two‐Layer Quasi‐Geostrophic Baroclinic Turbulence](https://doi.org/10.1029/2024ms004857)
Yan et al. (2024), *Journal of Advances in Modeling Earth Systems*. 7 citations.

*Summary pending.*

### [A Decadal Hybrid GCM Simulation Using Deep‐Learning‐Based Cloud and Convection Parameterization Generalized to a Warm Climate](https://doi.org/10.1029/2025ms005231)
Han et al. (2025), *Journal of Advances in Modeling Earth Systems*. 6 citations.

*Summary pending.*

### [CERA: A Framework for Improved Generalization of Machine Learning Models to Changed Climates](https://doi.org/10.1029/2025ms005431)
Liu et al. (2025), *Journal of Advances in Modeling Earth Systems*. 6 citations.

*Summary pending.*

### [Revisiting Machine Learning Approaches for Short‐ and Longwave Radiation Inference in Weather and Climate Models](https://doi.org/10.1029/2025ms004956)
Bertoli et al. (2025), *Journal of Advances in Modeling Earth Systems*. 5 citations.

*Summary pending.*

### [Stable Simulation of the Community Atmosphere Model Using Machine‐Learning Physical Parameterization Trained With Experience Replay](https://doi.org/10.1029/2024ms004722)
Chen et al. (2025), *Journal of Advances in Modeling Earth Systems*. 4 citations.

*Summary pending.*

### [Offline Performance of a Nonlocal Deep Learning Parameterization for Climate Model Representation of Atmospheric Gravity Waves](https://doi.org/10.1029/2025ms004977)
Gupta et al. (2025), *Journal of Advances in Modeling Earth Systems*. 2 citations.

*Summary pending.*

<a id="downscaling"></a>
## Downscaling

### [DeepSD: Generating High Resolution Climate Change Projections through Single Image Super-Resolution](https://doi.org/10.1145/3097983.3098004)
Vandal et al. (2017), *Knowledge Discovery and Data Mining*. 406 citations.

- **Main goal:** Downscales coarse Earth system model output to local scales for impact assessment using image super-resolution.
- **Architecture:** DeepSD: stacked super-resolution CNNs (SRCNN) applied in successive resolution steps, with auxiliary inputs such as elevation as extra channels.
- **Data:** Daily precipitation over the continental US (gridded observations, e.g., PRISM) at 1 degree upscaled to 1/8 degree; applied to CMIP5 models on NASA NEX.
- **Main result:** DeepSD compares favorably to BCSD and three automated statistical downscaling methods for daily precipitation from 1 degree to 1/8 degree.
- **Open work:** Applying to many ESMs and scenarios, adding uncertainty quantification and other variables.
- **Issues:** Deterministic output; performance for extremes and in a changed climate is uncertain; trained in a perfect-prognosis setting.
- *Basis: abstract+knowledge*

### [Statistical downscaling of precipitation using machine learning techniques](https://doi.org/10.1016/j.atmosres.2018.05.022)
Sachindra et al. (2018), *Atmospheric research*. 320 citations.

- **Main goal:** Compare machine learning techniques for downscaling reanalysis data to monthly station precipitation across climate regimes.
- **Architecture:** Four ML methods compared: genetic programming, artificial neural networks, support vector machines and relevance vector machines, built per station and calendar month.
- **Data:** Reanalysis predictors and monthly precipitation at 48 stations in Victoria, Australia (wet, intermediate, dry regimes); calibration 1950-1991, validation 1992-2014.
- **Main result:** All methods capture the mean better than variability, underestimate the standard deviation and maxima, overestimate low-to-mid percentiles and underestimate high percentiles; RVM/ANN recommended for floods, RVM for droughts, polynomial kernels best for SVM/RVM.
- **Open work:** Bias correction of extremes and application to GCM projections for future precipitation.
- **Issues:** Monthly resolution only; systematic underestimation of extremes; stationarity of predictor-precipitation relationships under climate change is untested.
- *Basis: abstract*

### [Adversarial super-resolution of climatological wind and solar data](https://doi.org/10.1073/pnas.1918964117)
Stengel et al. (2020), *Proceedings of the National Academy of Sciences*. 290 citations.

- **Main goal:** Super-resolve global climate model wind and solar outputs to scales needed for renewable energy resource assessment under climate scenarios.
- **Architecture:** Fully convolutional generative adversarial super-resolution network, trainable on small domains and applicable to arbitrarily sized inputs.
- **Data:** High-resolution wind (NREL WIND Toolkit) and solar (NSRDB) data for training; applied to CMIP5 / IPCC AR5 climate scenario output.
- **Main result:** Achieves up to 50x resolution enhancement; outputs are robust to input noise, reproduce turbulent spectra and solar irradiance statistics, and remain consistent with coarse fields.
- **Open work:** Apply to more variables and scenarios and assess impacts on energy-system planning decisions.
- **Issues:** GAN outputs may hallucinate fine-scale detail; training on present-day high-resolution data assumes the coarse-to-fine relationship holds under future climates.
- *Basis: abstract+knowledge*

### [Configuration and intercomparison of deep learning neural models for statistical downscaling](https://doi.org/10.5194/gmd-2019-278)
Baño-Medina et al. (2019), *Geoscientific Model Development*. 278 citations.

- **Main goal:** Systematically assess the added value of CNNs for continental-scale statistical downscaling, including extrapolation relevant to climate change.
- **Architecture:** CNN models of increasing complexity compared with linear and generalized linear benchmarks within the VALUE validation framework.
- **Data:** Large-scale reanalysis predictors (ERA-Interim) and gridded observations (E-OBS) over Europe for temperature and precipitation; a warm test period as a surrogate for future climate.
- **Main result:** CNNs add value for temperature mainly in reproducing extremes, and outperform classical methods for precipitation in most aspects; they can be applied to whole continents without predictor selection.
- **Open work:** Application to GCM predictors for climate-change projections, e.g. within CORDEX, and further tests of extrapolation.
- **Issues:** Perfect-prognosis setup with reanalysis predictors; a warm historical period is only a partial proxy for future climate; deterministic models.
- *Basis: abstract+knowledge*

### [Residual corrective diffusion modeling for km-scale atmospheric downscaling](https://doi.org/10.1038/s43247-025-02042-5)
Mardani et al. (2023), *Communications Earth &amp; Environment*. 232 citations.

- **Main goal:** Provides cost-effective km-scale downscaling of coarse global data as an alternative to expensive km-scale simulation.
- **Architecture:** CorrDiff: two-step model in which a UNet regresses the conditional mean and a score-based diffusion model generates the residual.
- **Data:** 25 km ERA5 as input and 2 km operational regional WRF output over Taiwan as target; about three years of training data with a held-out year for testing.
- **Main result:** Good deterministic and probabilistic skill, recovers power-law spectra and distributions, sharpens cold fronts, intensifies typhoons, and synthesizes rainbands.
- **Open work:** Better calibration of uncertainty and coupling with coarse global ML models for global-to-regional simulation.
- **Issues:** Uncertainty calibration remains challenging (under-dispersed); single region and short training record; target is a model, not observations.
- *Basis: abstract+knowledge*

### [Deep Learning for Daily Precipitation and Temperature Downscaling](https://doi.org/10.1029/2020wr029308)
Wang et al. (2021), *Water Resources Research*. 214 citations.

- **Main goal:** Downscales daily precipitation and temperature to local scale for impact assessment.
- **Architecture:** Super Resolution Deep Residual Network (SRDRN): deep CNN with residual blocks and batch normalization, plus data augmentation for imbalanced and extreme precipitation.
- **Data:** Synthetic experiments coarsening 4 km gridded data to 25, 50 and 100 km and downscaling back to 4 km; transfer to a second region.
- **Main result:** Captures spatial and temporal patterns and local extremes of precipitation and temperature; transfer learning to another region beats classic statistical downscaling.
- **Open work:** Apply to real GCM output and other Earth system variables.
- **Issues:** Synthetic coarsening setup avoids GCM biases and representativeness mismatch; deterministic outputs give no uncertainty.
- *Basis: abstract*

### [Stochastic Super-Resolution for Downscaling Time-Evolving Atmospheric Fields With a Generative Adversarial Network](https://doi.org/10.1109/tgrs.2020.3032790)
Leinonen et al. (2020), *IEEE Transactions on Geoscience and Remote Sensing*. 213 citations.

- **Main goal:** Develops stochastic, temporally consistent super-resolution (downscaling) of atmospheric fields that produces ensembles.
- **Architecture:** Recurrent conditional GAN (convolutional GRU-based generator and discriminator) generating ensembles of high-resolution image sequences from low-resolution sequences.
- **Data:** Swiss radar precipitation (MeteoSwiss) and GOES-16-derived cloud optical thickness.
- **Main result:** Generates realistic, temporally consistent sequences; rank statistics indicate near-correct ensemble spread; fully convolutional generator applies to larger domains and longer sequences.
- **Open work:** Apply to downscaling of model output (rather than coarsened observations) and to other variables.
- **Issues:** Trained on artificially coarsened observations, so performance on real model output is untested; GAN training stability and mode collapse are general risks.
- *Basis: abstract*

### [A Generative Deep Learning Approach to Stochastic Downscaling of Precipitation Forecasts](https://doi.org/10.1029/2022ms003120)
Harris et al. (2022), *Journal of Advances in Modeling Earth Systems*. 202 citations.

- **Main goal:** Improves the accuracy and resolution of global NWP precipitation forecasts, since key precipitation processes are sub-grid.
- **Architecture:** Conditional GAN and VAE-GAN that downscale and correct precipitation forecasts stochastically, producing ensembles of high-resolution fields.
- **Data:** ECMWF IFS forecast fields as inputs and high-resolution UK radar (NIMROD) precipitation as ground truth.
- **Main result:** Matches the statistical skill of state-of-the-art pointwise postprocessing while producing spatially coherent high-resolution maps. Compares favourably on pixelwise and pooled CRPS, power spectra and rank histograms, including heavy rain.
- **Open work:** Extend to other regions (for example East Africa), longer lead times and better calibration for extremes.
- **Issues:** Limited to one region and lead range. GAN training can be unstable, and calibration for rare extremes is challenging.
- *Basis: abstract+knowledge*

### [Intercomparison of machine learning methods for statistical downscaling: the case of daily and extreme precipitation](https://doi.org/10.1007/s00704-018-2613-3)
Vandal et al. (2017), *Theoretical and Applied Climatology*. 191 citations.

- **Main goal:** Tests whether modern ML methods improve statistical downscaling of daily and extreme precipitation from GCMs.
- **Architecture:** Comparison of perfect-prognosis methods (OLS, Elastic-Net, SVM, multi-task sparse structure learning, autoencoders) and a hybrid MSSL+BCSD approach.
- **Data:** Reanalysis predictors and gridded observed daily precipitation over the United States (details not confirmed).
- **Main result:** No method is consistently best; L1 sparsity helps; MSSL+BCSD improves daily to annual predictability over BCSD but worsens extremes.
- **Open work:** Developing methods that capture extremes and remain reliable under nonstationary climate.
- **Issues:** Limited set of methods and regions; perfect-prognosis evaluation does not test performance in future climates.
- *Basis: abstract*

### [A comparative study of convolutional neural network models for wind field downscaling](https://doi.org/10.1002/met.1961)
Höhlein et al. (2020), *Meteorological Applications*. 134 citations.

- **Main goal:** Downscale short-range near-surface (100 m) wind forecasts quickly from coarse to high resolution over complex terrain.
- **Architecture:** Comparison of four CNN architectures against multilinear regression, plus a proposed U-Net-based DeepRU model; tests adding atmospheric predictors and static fields like topography and land-sea mask.
- **Data:** Short-range forecasts from ERA5 initial conditions at 31 km as input, ECMWF HRES 9 km forecasts as target, over the Alpine region.
- **Main result:** DeepRU infers situation-dependent wind structures that other models miss; inference takes under 10 ms on a GPU versus minutes to hours for higher-resolution simulation.
- **Open work:** Extend to other variables, levels, and regions, and to probabilistic downscaling.
- **Issues:** Target is a model forecast (HRES), not observations; deterministic CNNs may smooth small-scale variability.
- *Basis: abstract*

### [High-resolution downscaling with interpretable deep learning: Rainfall extremes over New Zealand](https://doi.org/10.1016/j.wace.2022.100525)
Rampal et al. (2022), *Weather and Climate Extremes*. 133 citations.

- **Main goal:** Downscale rainfall, especially extremes, to high resolution over New Zealand with an interpretable deep-learning approach.
- **Architecture:** Deep-learning (likely convolutional) statistical downscaling model with interpretability analysis; details not available from an abstract.
- **Data:** Not reported in the abstract; presumably coarse reanalysis predictors and high-resolution gridded New Zealand rainfall.
- **Main result:** Abstract not available; the title suggests skillful high-resolution reproduction of rainfall extremes with interpretable predictor relationships.
- **Open work:** Application to climate-model projections and assessment of extrapolation under climate change.
- **Issues:** Summary inferred from the title only; regional focus and possible underestimation of extremes typical of regression-based downscaling.
- *Basis: assessment*

### [Deep-Learning-Based Gridded Downscaling of Surface Meteorological Variables in Complex Terrain. Part II: Daily Precipitation](https://doi.org/10.1175/jamc-d-20-0058.1)
Sha et al. (2020), *Journal of Applied Meteorology and Climatology*. 103 citations.

- **Main goal:** Downscale daily precipitation over complex terrain in western North America with deep learning.
- **Architecture:** UNet and a proposed Nest-UNet with deep-layer aggregation and nested skip connections; inputs include low-resolution precipitation, high-resolution precipitation climatology and elevation.
- **Data:** PRISM data from 0.25° to 4 km; training on south and central-western US 2015-2018, testing 2018-2019 on all domains; station observations for comparison.
- **Main result:** Both UNets generalize across regions and beat the BCSD baseline with lower error and finer textures; Nest-UNet shares the most information with stations and PRISM.
- **Open work:** Test with actual climate or NWP model inputs and assess extremes and probabilistic outputs.
- **Issues:** Deterministic output may underrepresent extremes; inputs are coarsened PRISM rather than model output; short training period.
- *Basis: abstract*

### [Regional climate model emulator based on deep learning: concept and first evaluation of a novel hybrid downscaling approach](https://doi.org/10.1007/s00382-022-06343-9)
Doury et al. (2021), *Climate Dynamics*. 102 citations.

- **Main goal:** Builds a cheap emulator of a regional climate model (RCM) to enlarge high-resolution downscaled ensembles for uncertainty exploration.
- **Architecture:** Hybrid downscaling: a neural network (U-Net-type) learns the RCM's downscaling function from large-scale predictors to daily near-surface temperature at 12 km.
- **Data:** RCM simulations (CNRM-ALADIN over a European domain driven by a GCM) for historical and future climate.
- **Main result:** The emulator reproduces spatial structure and daily variability of the RCM well; training on future climate is key; training takes about 2 h on GPU and prediction under a minute.
- **Open work:** Better reproduction of temperature extremes and climate change intensity; extension to other regions, GCMs, RCMs and variables.
- **Issues:** Underestimates some extremes and climate change signal; single RCM/variable; emulates the RCM, so inherits its biases.
- *Basis: abstract+knowledge*

### [Deep-Learning-Based Gridded Downscaling of Surface Meteorological Variables in Complex Terrain. Part I: Daily Maximum and Minimum 2-m Temperature](https://doi.org/10.1175/jamc-d-20-0057.1)
Sha et al. (2020), *Journal of Applied Meteorology and Climatology*. 99 citations.

- **Main goal:** Develop a generalizable deep learning downscaling of daily maximum and minimum 2 m temperature in complex terrain.
- **Architecture:** UNet modified into UNet-Autoencoder with an extra high-resolution elevation output branch, enabling semisupervised fine-tuning in unseen domains.
- **Data:** PRISM 4 km and 0.25° coarsened data with elevation; trained on south and central-western US 2015-2018; tested 2018-2019 including the unseen northwestern US.
- **Main result:** Original UNet lacks fine detail when transferred; UNet-AE reduces MAE by more than 10% relative to UNet.
- **Open work:** Apply to other variables (Part II covers precipitation) and to downscaling actual model output.
- **Issues:** Target is PRISM, itself an interpolated product; inputs are coarsened PRISM rather than real GCM or reanalysis output; short training period.
- *Basis: abstract*

### [Physically constrained generative adversarial networks for improving precipitation fields from Earth system models](https://doi.org/10.1038/s42256-022-00540-1)
Hess et al. (2022), *Nature Machine Intelligence*. 96 citations.

- **Main goal:** Correct both local distributions and spatial patterns of precipitation simulated by an Earth system model, which conventional post-processing cannot do.
- **Architecture:** Physically constrained generative adversarial network (cycle-consistent, unpaired) with a layer preserving global precipitation sums.
- **Data:** Daily precipitation from the CM2Mc-LPJmL ESM, with reanalysis (ERA5) precipitation as the target; tested on future scenarios.
- **Main result:** Outperforms existing methods for local distributions, strongly improves spatial patterns and intermittency, removes the double ITCZ, and generalizes to unseen future scenarios via the constraint.
- **Open work:** Application to other ESMs and variables and multivariate consistency.
- **Issues:** Applied to one coarse ESM; correction is statistical and does not fix model dynamics; unpaired mapping complicates verification.
- *Basis: abstract+knowledge*

### [Statistical downscaling of daily temperature and precipitation over China using deep learning neural models: Localization and comparison with other methods](https://doi.org/10.1002/joc.6769)
Sun et al. (2020), *International Journal of Climatology*. 88 citations.

- **Main goal:** Evaluates CNN-based statistical downscaling of daily temperature and precipitation across China and compares with established methods.
- **Architecture:** CNN models with different configurations mapping large-scale reanalysis predictors to high-resolution grids, compared with GLM, BCSD and BCCI quantile-mapping methods.
- **Data:** ERA-Interim predictors and high-resolution gridded observations over China; calibration 1979-1999, validation 2000-2017.
- **Main result:** CNN adds value over ERA-Interim in seasonal means, seasonal cycle and extreme percentiles and beats GLM for precipitation; bias-correction methods remain best for biases and temporal correlation.
- **Open work:** Apply to GCM projections and improve temporal correlation and precipitation extremes.
- **Issues:** Perfect-prognosis setting with reanalysis predictors; extrapolation tested only within a modestly warmer period.
- *Basis: abstract*

### [On the suitability of deep convolutional neural networks for continental-wide downscaling of climate change projections](https://doi.org/10.1007/s00382-021-05847-0)
Baño-Medina et al. (2021), *Climate Dynamics*. 82 citations.

- **Main goal:** Tests whether CNN-based perfect-prognosis downscaling can be trusted for future climate projections, given its black-box nature and possible extrapolation artifacts.
- **Architecture:** Deep CNNs for downscaling temperature and precipitation over Europe, compared with generalized linear models. The authors examine whether the downscaled climate change signal preserves the raw GCM delta.
- **Data:** Reanalysis predictors (ERA-Interim) and gridded observations (E-OBS) over Europe for training; GCM historical and future scenario output for application.
- **Main result:** Compared with GLMs, CNNs depart less from the raw GCM climate change signal at the end of the century and give more spatially homogeneous patterns, so projections are more plausible.
- **Open work:** Test the other perfect prognosis assumption (GCM reproduction of predictors), and use more GCMs and scenarios.
- **Issues:** Plausibility judged by consistency with the GCM signal rather than a ground truth. A limited set of GCMs is used, and extrapolation remains unverifiable.
- *Basis: abstract+knowledge*

### [Dynamical-generative downscaling of climate model ensembles](https://doi.org/10.1073/pnas.2420288122)
Lopez-Gomez et al. (2024), *Proceedings of the National Academy of Sciences*. 81 citations.

- **Main goal:** Reduces the cost of regional downscaling of large climate projection ensembles while keeping the skill of physics-based regional models, to better sample regional uncertainty.
- **Architecture:** Two-stage hybrid: a regional climate model (WRF) downscales GCM output to an intermediate resolution, then a conditional diffusion model generates the final high-resolution fields.
- **Data:** CMIP6 GCM projections downscaled with WRF over the western United States; the diffusion model is trained on high-resolution WRF simulations.
- **Main result:** The hybrid matches or approaches full dynamical downscaling skill, captures extremes and compound events better than statistical baselines, and cuts cost substantially, enabling downscaling of multi-model ensembles.
- **Open work:** Extending to more regions, variables and GCMs and using the larger ensembles for impact-oriented risk assessment.
- **Issues:** Still requires a coarse RCM run for every GCM member; trained on a single RCM, so inherits WRF biases; generalization to unseen climates depends on the physics-based intermediate stage.
- *Basis: abstract+knowledge*

### [Customized deep learning for precipitation bias correction and downscaling](https://doi.org/10.5194/gmd-16-535-2023)
Wang et al. (2023), *Geoscientific Model Development*. 74 citations.

- **Main goal:** Bias-correct and downscale hourly precipitation, where existing deep learning and statistical methods fail to reproduce small-scale features and extremes.
- **Architecture:** Customized deep learning model combining weighted loss functions, multitask learning and physically relevant atmospheric covariates; six scenarios compared against regular DL and quantile mapping.
- **Data:** MERRA-2 reanalysis as input and Stage IV radar precipitation as target, hourly, over the northern Gulf of Mexico coastal region.
- **Main result:** Weighted loss functions give the largest gains over conventional losses and quantile mapping at hourly, daily and monthly scales and for extremes; multitask learning helps fine features of extremes; covariates also improve skill.
- **Open work:** Transfer to other regions, climates and coarse model output (e.g. climate projections) and adding probabilistic outputs follow naturally.
- **Issues:** Single region and single reanalysis/observation pair; deterministic output; generalization to other climates or future conditions is not demonstrated.
- *Basis: assessment*

### [Fast, scale-adaptive and uncertainty-aware downscaling of Earth system model fields with generative machine learning](https://doi.org/10.1038/s42256-025-00980-5)
Hess et al. (2024), *Nature Machine Intelligence*. 73 citations.

*Summary pending.*

### [High-resolution meteorology with climate change impacts from global climate model data using generative machine learning](https://doi.org/10.1038/s41560-024-01507-9)
Buster et al. (2024), *Nature Energy*. 70 citations.

- **Main goal:** Generates high-resolution meteorological data reflecting climate change from coarse GCM output, for energy-system planning (wind, solar, temperature).
- **Architecture:** Generative adversarial network super-resolution (the Sup3rCC approach), downscaling GCM fields in space and time.
- **Data:** CMIP6 GCM projections as input; high-resolution historical datasets (e.g. NREL wind and solar resource data) for training, over the contiguous United States.
- **Main result:** Produces kilometer-scale, hourly meteorological data under future climate scenarios at much lower cost than dynamical downscaling. Abstract not available; specifics not verified here.
- **Open work:** Broader validation for extremes and additional GCMs/scenarios; use in energy-system planning studies.
- **Issues:** GAN outputs can hallucinate fine-scale detail; extrapolation to future climates and fidelity of extremes are hard to verify.
- *Basis: assessment*

### [Hard-Constrained Deep Learning for Climate Downscaling](https://arxiv.org/abs/2208.05424)
Harder et al. (2022), *arXiv*. 69 citations.

- **Main goal:** Make deep-learning downscaling physically consistent by guaranteeing that conservation constraints (e.g. coarse-cell averages) are satisfied.
- **Architecture:** Constraint layers (e.g. additive, multiplicative and softmax-based) appended to super-resolution networks, tested across several architectures such as CNNs, GANs and recurrent models.
- **Data:** Several climate and weather datasets (including ERA5-based fields), plus satellite and natural-image super-resolution datasets.
- **Main result:** Hard constraints guarantee conservation and also improve standard predictive metrics across architectures and datasets.
- **Open work:** Extending to more physical constraints, larger upsampling factors and real coarse-model outputs rather than synthetically coarsened data.
- **Issues:** Mostly trained on artificially coarsened data, so transfer to real model outputs is untested; constraints enforce only statistical/conservation relations, not dynamics.
- *Basis: abstract+knowledge*

### [Statistical downscaling of precipitation using long short-term memory recurrent neural networks](https://doi.org/10.1007/s00704-017-2307-2)
Misra et al. (2018), *Theoretical and Applied Climatology*. 69 citations.

- **Main goal:** Statistical downscaling of precipitation from coarse climate predictors to local scale, as suggested by the title.
- **Architecture:** Long short-term memory (LSTM) recurrent neural network for precipitation downscaling; architectural details not available.
- **Data:** Not reported (abstract unavailable); likely reanalysis or GCM predictors with observed precipitation for an Indian region, but this is not confirmed.
- **Main result:** Not reported in the abstract.
- **Open work:** Comparison with other downscaling approaches and application to climate projections would follow naturally.
- **Issues:** Details cannot be verified without the abstract; typical downscaling caveats (stationarity assumption, extremes underestimation) likely apply.
- *Basis: assessment*

### [ClimAlign: Unsupervised statistical downscaling of climate variables via normalizing flows](https://doi.org/10.1145/3429309.3429318)
Groenke et al. (2020), *International Conference on Climate Informatics*. 55 citations.

- **Main goal:** Perform statistical downscaling without paired low/high-resolution training data, and enable sampling of synthetic fields.
- **Architecture:** ClimAlign: unsupervised generative domain alignment using normalizing flows adapted from variational inference.
- **Data:** Two datasets of daily gridded temperature and precipitation at 1° (low) and finer (high) resolution; exact products not stated in the abstract.
- **Main result:** Predictive performance comparable to supervised statistical downscaling methods while allowing conditional and unconditional sampling of the joint distribution.
- **Open work:** Test on more variables and climate model output, and examine physical consistency and extremes.
- **Issues:** Evaluation on limited datasets; unsupervised alignment may not preserve physically meaningful correspondences; extremes and nonstationarity not addressed.
- *Basis: assessment*

### [Debias Coarsely, Sample Conditionally: Statistical Downscaling through Optimal Transport and Probabilistic Diffusion Models](https://arxiv.org/abs/2305.15618)
Wan et al. (2023), *Neural Information Processing Systems*. 52 citations.

- **Main goal:** Perform probabilistic statistical downscaling of biased coarse simulations without paired low/high-resolution data.
- **Architecture:** Two stages: optimal transport map for debiasing at coarse resolution, then a probabilistic diffusion model with conditional sampling for upsampling.
- **Data:** One- and two-dimensional fluid flow simulations representative of weather and climate difficulties.
- **Main result:** Produces realistic outputs at 8x and 16x upsampling and matches physical statistics even when low-frequency content of inputs and outputs differs.
- **Open work:** Application to real weather and climate model output and observations.
- **Issues:** Demonstrated on idealized fluid flows only; computational cost of diffusion sampling; no real-data validation.
- *Basis: assessment*

### [Precipitation Downscaling with Spatiotemporal Video Diffusion](https://doi.org/10.52202/079017-1795)
Srivastava et al. (2023), *Neural Information Processing Systems*. 32 citations.

- **Main goal:** Downscales precipitation while capturing the conditional distribution needed for reliable ensembles and unbiased extremes.
- **Architecture:** Deterministic downscaler followed by a temporally conditioned video diffusion model that adds stochastic high-frequency detail.
- **Data:** FV3GFS global atmosphere model output, coarse versus fine resolution; case regions include California and the Himalayas.
- **Main result:** Outperforms six state-of-the-art baselines in CRPS, MSE and precipitation distribution metrics.
- **Open work:** Applying to observations or other climate models and testing in climate change settings.
- **Issues:** Trained and evaluated within one model (perfect-model setting); computational cost of diffusion sampling; limited regions examined.
- *Basis: assessment*

### [Machine Learning Emulation of Precipitation From km‐Scale UK Regional Climate Simulations Using a Diffusion Model](https://doi.org/10.1029/2025ms005140)
Addison et al. (2024), *Journal of Advances in Modeling Earth Systems*. 29 citations.

- **Main goal:** Emulates precipitation from an expensive 2.2 km convection-permitting regional climate model at much lower cost.
- **Architecture:** CPMGEM: conditional diffusion model downscaling 60 km GCM-scale inputs to 8.8 km daily precipitation, stochastic sampling.
- **Data:** UKCP Local simulations over England and Wales, 1980-2080, high-emissions scenario.
- **Main result:** Matches CPM spatial structure and intensity distribution, shows skill for extremes with return periods up to about 100 years, and transfers from perfect-model to GCM inputs.
- **Open work:** Applying to large GCM ensembles and other GCMs/scenarios to sample uncertainty, and correcting the climate change magnitude error.
- **Issues:** Exhibits error in the magnitude of 21st-century change; daily means only; single region and single emission scenario.
- *Basis: abstract*

### [Potential for machine learning emulators to augment regional climate simulations in provision of local climate change information](https://doi.org/10.1175/bams-d-24-0114.1)
Kendon et al. (2025), *Bulletin of The American Meteorological Society - (BAMS)*. 21 citations.

*Summary pending.*

### [EnScale: Temporally‐Consistent Multivariate Generative Downscaling via Proper Scoring Rules](https://doi.org/10.1029/2025ms005593)
Schillinger et al. (2025), *Journal of Advances in Modeling Earth Systems*. 20 citations.

*Summary pending.*

### [Satellite Observations Guided Diffusion Model for Accurate Meteorological States at Arbitrary Resolution](https://doi.org/10.1109/cvpr52734.2025.02614)
Tu et al. (2025), *Computer Vision and Pattern Recognition*. 19 citations.

*Summary pending.*

### [Are Deep Learning Methods Suitable for Downscaling Global Climate Projections? An Intercomparison for Temperature and Precipitation over Spain](https://doi.org/10.1175/aies-d-24-0121.1)
González-Abad et al. (2024), *Artificial Intelligence for the Earth Systems*. 16 citations.

*Summary pending.*

### [Regional climate risk assessment from climate models using probabilistic machine learning](https://doi.org/10.1038/s42256-026-01308-7)
Wan et al. (2024), *Nature Machine Intelligence*. 15 citations.

*Summary pending.*

### [ORBIT-2: Scaling Exascale Vision Foundation Models for Weather and Climate Downscaling](https://doi.org/10.1145/3712285.3771989)
Wang et al. (2025), *International Conference on Software Composition*. 15 citations.

*Summary pending.*

### [An intercomparison of generative machine learning methods for downscaling precipitation at fine spatial scales](https://arxiv.org/abs/2512.13987)
Rampal et al. (2025), *arXiv*. 8 citations.

*Summary pending.*

### [Universal Diffusion-Based Probabilistic Downscaling](https://arxiv.org/abs/2602.11893)
Molinaro et al. (2026), *arXiv*. 6 citations.

*Summary pending.*

### [Intelligent Shanghai Typhoon Model (ISTM): A Diffusion‐Based Downscaling Emulator From AIFS to Kilometer‐Scale Regional Reanalysis for Typhoon Forecasts](https://doi.org/10.1029/2025jh001072)
Niu et al. (2026), *Journal of Geophysical Research*. 2 citations.

*Summary pending.*

### [Applying a standardised benchmarking framework to evaluate AI methods for precipitation downscaling over Australia](https://doi.org/10.1175/aies-d-25-0048.1)
Hobeichi et al. (2025), *Artificial Intelligence for the Earth Systems*. 1 citations.

*Summary pending.*

<a id="da"></a>
## Data assimilation

### [Combining data assimilation and machine learning to emulate a dynamical model from sparse and noisy observations: a case study with the Lorenz 96 model](https://doi.org/10.5194/gmd-2019-136)
Brajard et al. (2019), *Journal of Computational Science*. 291 citations.

- **Main goal:** Emulate a hidden chaotic dynamical model and predict its future states when only sparse, noisy observations are available.
- **Architecture:** Iterative hybrid of data assimilation (ensemble Kalman filter) and a neural network surrogate: DA produces complete analyses that train the NN, which then serves as the model for the next DA cycle.
- **Data:** Synthetic observations from the 40-variable Lorenz 96 model with varying noise and observation density.
- **Main result:** Method converges and yields forecast skill up to about two Lyapunov times, recovers positive Lyapunov exponents and the power spectrum; skill degrades smoothly with noise but drops abruptly if less than half the domain is observed.
- **Open work:** Scaling to higher-dimensional, more realistic dynamics and merging DA and ML more tightly.
- **Issues:** Low-dimensional toy system; sensitivity to observation coverage; computational cost of iteration in large systems not addressed.
- *Basis: abstract*

### [Learning earth system models from observations: machine learning or data assimilation?](https://doi.org/10.1098/rsta.2020.0089)
Geer (2021), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 194 citations.

- **Main goal:** Asks whether Earth system models should be learned from observations with ML or with data assimilation, and how the two fields can be unified.
- **Architecture:** Conceptual paper that maps DA and ML onto a common Bayesian network framework, for example showing that 4D-Var is equivalent to a recurrent neural network. Not a new model.
- **Data:** No new data; discussion grounded in operational DA practice (ECMWF) with real, sparse and indirect observations.
- **Main result:** Argues that DA treats uncertainty and prior physical knowledge more rigorously, while ML offers flexible learnable components. Bayesian networks give a practical framework to unify them.
- **Open work:** Build hybrid systems where DA learns model parameters or embedded ML components directly from observations.
- **Issues:** Perspective without quantitative demonstration. Full Bayesian solutions are computationally infeasible, so approximations are needed.
- *Basis: abstract*

### [Combining data assimilation and machine learning to infer unresolved scale parametrization](https://doi.org/10.1098/rsta.2020.0086)
Brajard et al. (2020), *Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 158 citations.

- **Main goal:** Learn ML parametrizations of unresolved processes from sparse, noisy observations rather than from dense high-resolution simulations.
- **Architecture:** Two-step hybrid: ensemble Kalman filter data assimilation estimates the full state with a truncated model, then a neural network learns model error (unresolved tendency) as a function of state; the NN is added to the truncated model.
- **Data:** Two-scale Lorenz model and MAOOAM, a reduced-order coupled ocean-atmosphere model, with synthetic noisy and sparse observations.
- **Main result:** The hybrid model forecasts better than the truncated model in both systems and reproduces the attractor significantly better.
- **Open work:** Apply to higher-dimensional and realistic models and iterate DA and learning jointly.
- **Issues:** Demonstrated only in low-order toy models; performance depends on the observation network and DA quality.
- *Basis: abstract*

### [Deep Data Assimilation: Integrating Deep Learning with Data Assimilation](https://doi.org/10.3390/app11031114)
Arcucci et al. (2021), *Applied Sciences*. 154 citations.

- **Main goal:** Learn the data assimilation correction so a dynamic model can be improved and used for prediction when observations are unavailable.
- **Architecture:** Deep Data Assimilation: a recurrent neural network trained on model states and DA results learns the misfit function, which is composed with the dynamical model.
- **Data:** Simulated data from a double integral mass-dot system and the Lorenz system.
- **Main result:** Proves the approach reduces model error at each iteration and validates it with examples and a sensitivity study.
- **Open work:** Application to real physics problems with other equations and state variables.
- **Issues:** Only low-dimensional toy systems; no comparison with realistic geophysical DA systems.
- *Basis: abstract*

### [Score-based Data Assimilation](https://arxiv.org/abs/2306.10574)
Rozet et al. (2023), *Neural Information Processing Systems*. 142 citations.

- **Main goal:** Infers full state trajectories of high-dimensional stochastic dynamical systems from noisy, incomplete observations without relying on costly sequential use of transition dynamics, as needed for ocean and atmosphere data assimilation.
- **Architecture:** Score-based (diffusion) generative model of trajectories whose score is decomposed into scores over short overlapping segments; observations guide sampling only at inference, generating all states non-autoregressively.
- **Data:** Simulated trajectories of toy chaotic systems; the paper's experiments use Lorenz-63 and a 2D Kolmogorov (turbulent) flow.
- **Main result:** Theoretical and empirical evidence shows plausible posterior trajectories under a variety of zero-shot observation operators (e.g. sparse, coarse, or nonlinear observations) without retraining.
- **Open work:** Scaling to realistic, full-dimensional geophysical systems and real observation networks, and calibration checks of posterior uncertainty.
- **Issues:** Demonstrated only on idealized systems with simulated data; diffusion sampling is computationally heavy and posterior calibration with approximate guidance is not guaranteed.
- *Basis: abstract+knowledge*

### [Bayesian inference of chaotic dynamics by merging data assimilation, machine learning and expectation-maximization](https://doi.org/10.3934/fods.2020004)
Bocquet et al. (2020), *Foundations of Data Science*. 135 citations.

- **Main goal:** Reconstructs high-dimensional chaotic dynamics from partial, noisy observations over long time series by combining data assimilation (DA) and machine learning.
- **Architecture:** Bayesian framework unifying DA and ML via expectation-maximization and coordinate descent, jointly estimating the surrogate model, state trajectory and model-error statistics; approximate implementations discussed.
- **Data:** Synthetic observations from two low-order chaotic models with distinct identifiability properties.
- **Main result:** The approach successfully recovers dynamics, states and error statistics in both test models.
- **Open work:** Scaling to realistic geophysical models and observation systems, and handling unresolved scales.
- **Issues:** Tested only on low-order models with synthetic data; computational cost and identifiability in high dimensions remain open.
- *Basis: assessment*

### [Data Learning: Integrating Data Assimilation and Machine Learning](https://doi.org/10.1016/j.jocs.2021.101525)
Buizza et al. (2021), *Journal of Computer Science*. 121 citations.

- **Main goal:** Integrates data assimilation and machine learning into a combined framework, termed Data Learning (inferred from title).
- **Architecture:** Combination of DA and ML methods; specific architecture not available.
- **Data:** Not reported (abstract unavailable).
- **Main result:** Not reported in the abstract.
- **Open work:** Not reported.
- **Issues:** Cannot be assessed without the abstract; details should be checked in the paper.
- *Basis: assessment*

### [Learning Variational Data Assimilation Models and Solvers](https://doi.org/10.1029/2021ms002572)
Fablet et al. (2020), *Journal of Advances in Modeling Earth Systems*. 110 citations.

- **Main goal:** Uses physics-informed deep learning to revisit variational data assimilation by jointly learning the dynamical prior and the solver of the assimilation problem.
- **Architecture:** End-to-end differentiable variational DA framework: a trainable dynamical/prior model plus a learned (recurrent, gradient-based) solver for the variational cost, trained supervised or unsupervised via automatic differentiation.
- **Data:** Idealized experiments with Lorenz-63 and Lorenz-96 systems with partial, noisy observations.
- **Main result:** Significant gains over classical gradient-based minimization of the variational cost in reconstruction accuracy and optimization cost; variational models based on the true ODEs are not always the best-performing priors.
- **Open work:** Scale to high-dimensional geophysical problems (e.g., satellite sea surface fields) and explore learned assimilation models for operational design.
- **Issues:** Demonstrated only on low-dimensional toy systems; supervised training requires ground-truth states rarely available in practice.
- *Basis: abstract+knowledge*

### [DiffDA: a diffusion model for weather-scale data assimilation](https://arxiv.org/abs/2401.05932)
Huang et al. (2024), *International Conference on Machine Learning*. 103 citations.

- **Main goal:** Produces global atmospheric initial conditions by data assimilation with a machine learning model, replacing costly variational/ensemble DA.
- **Architecture:** Denoising diffusion model whose backbone is the pretrained GraphCast graph neural network; sparse observations and a forecast background guide the sampling.
- **Data:** ERA5 reanalysis at 0.25°, with simulated sparse observations drawn from ERA5 (under 0.96% of grid points) and GraphCast 48-hour forecasts as background.
- **Main result:** Generates assimilated global states consistent with observations at 0.25°, the highest resolution for ML DA at the time; forecasts from these analyses lose at most 24 h of lead time versus ERA5 initial conditions.
- **Open work:** Applying the method to real, heterogeneous observations (satellite radiances, in situ) and to autoregressive DA cycling for building reanalyses.
- **Issues:** Observations are simulated from ERA5 rather than real instrument data, so observation operators, errors and biases are idealized; skill still trails operational DA.
- *Basis: abstract+knowledge*

### [Supervised learning from noisy observations: Combining machine-learning techniques with data assimilation](https://doi.org/10.1016/j.physd.2021.132911)
Gottwald et al. (2020), *Physica D: Nonlinear Phenomena*. 87 citations.

- **Main goal:** Learns forecast models of chaotic systems from noisy observations by combining machine learning and data assimilation.
- **Architecture:** Random feature map surrogate model learned sequentially within an ensemble Kalman filter.
- **Data:** Synthetic noisy observations from low-dimensional chaotic and multi-scale systems (e.g. Lorenz-63).
- **Main result:** The learned model has remarkably good forecast skill and low cost, yields reliable probabilistic ensembles, and can learn effective closures in multi-scale systems.
- **Open work:** Scaling to high-dimensional systems, e.g. using localization.
- **Issues:** Low-dimensional toy systems only; random feature models may not scale to geophysical dimensions.
- *Basis: assessment*

### [Latent space data assimilation by using deep learning](https://doi.org/10.1002/qj.4153)
Peyron et al. (2021), *Quarterly Journal of the Royal Meteorological Society*. 82 citations.

- **Main goal:** Reduces the cost of data assimilation in the big-data era by performing assimilation in a low-dimensional learned latent space.
- **Architecture:** An autoencoder provides the latent space. An ensemble transform Kalman filter with model error (ETKF-Q) runs in that space, and a surrogate neural network propagates latent dynamics (ETKF-Q-L).
- **Data:** Synthetic experiments with an augmented Lorenz 96 system that has a known latent structure.
- **Main result:** ETKF-Q-L lowers computational cost and gives better accuracy than the standard ETKF-Q on the test system.
- **Open work:** Test on higher-dimensional, realistic geophysical models and on systems without a clean latent structure.
- **Issues:** The toy system is designed to have a latent structure, which favours the method; transfer to real NWP is undemonstrated.
- *Basis: assessment*

### [Building Tangent‐Linear and Adjoint Models for Data Assimilation With Neural Networks](https://doi.org/10.1029/2021ms002521)
Hatfield et al. (2021), *Journal of Advances in Modeling Earth Systems*. 80 citations.

- **Main goal:** Simplifies construction of tangent-linear and adjoint models for 4D-Var by using differentiable neural network emulators of parameterizations.
- **Architecture:** Neural network emulator of the non-orographic gravity wave drag scheme, differentiated to obtain tangent-linear and adjoint versions.
- **Data:** ECMWF IFS parameterization inputs/outputs; 4D-Var assimilation experiments.
- **Main result:** NN-derived tangent-linear and adjoint models pass standard consistency tests and work successfully in 4D-Var data assimilation.
- **Open work:** Applying to more complex, nonsmooth schemes (convection, clouds) and operational maintenance.
- **Issues:** Demonstrated for a single, relatively smooth scheme; accuracy depends on emulator quality and smoothness of NN gradients.
- *Basis: abstract+knowledge*

### [Integrating Recurrent Neural Networks With Data Assimilation for Scalable Data‐Driven State Estimation](https://doi.org/10.1029/2021ms002843)
Penny et al. (2021), *Journal of Advances in Modeling Earth Systems*. 62 citations.

- **Main goal:** Perform fully data-driven state estimation by integrating ML surrogate models into the data assimilation cycle.
- **Architecture:** Recurrent neural networks (reservoir computing type) replace the forecast model, forecast error covariance, and tangent linear and adjoint models; DA updates the hidden/reservoir state; domain localization and parallelization for scaling.
- **Data:** Synthetic observations from chaotic test systems such as the Lorenz-96 model.
- **Main result:** RNN-DA can estimate the system state for repeated initialization of short-term forecasts without a numerical model, and scales to higher dimensions with localization.
- **Open work:** Application to realistic NWP-scale models and real observations.
- **Issues:** Demonstrated on idealized, low-dimensional systems with synthetic observations; robustness to model error and real observation networks untested.
- *Basis: abstract+knowledge*

### [Generative Data Assimilation of Sparse Weather Station Observations at Kilometer Scales](https://doi.org/10.1029/2024ms004505)
Manshausen et al. (2024), *Journal of Advances in Modeling Earth Systems*. 60 citations.

- **Main goal:** Tests whether score-based generative data assimilation can map sparse weather-station observations to full km-scale atmospheric states.
- **Architecture:** Unconditional diffusion model trained on analysis snapshots, combined with Score-based Data Assimilation (SDA) to condition on sparse observations at inference without retraining.
- **Data:** High-Resolution Rapid Refresh (HRRR) analyses over a central US testbed, and surface weather station observations.
- **Main result:** Generated precipitation and wind fields show plausible structures such as gust fronts; assimilating 40 stations gives about 10% lower RMSE at withheld stations than the HRRR baseline.
- **Open work:** Combining stronger regional state generators with more in situ, ground-based and satellite data streams, and improving ensemble calibration.
- **Issues:** Proof of concept with a small station network; ensemble DA estimates are under-dispersive; no time dimension or forecast cycling is shown.
- *Basis: abstract*

### [FuXi-DA: a generalized deep learning data assimilation framework for assimilating satellite observations](https://doi.org/10.1038/s41612-025-01039-3)
Xu et al. (2024), *npj Climate and Atmospheric Science*. 57 citations.

- **Main goal:** Develops a deep-learning data assimilation framework that ingests satellite observations to improve analyses and forecasts of ML weather models.
- **Architecture:** Deep learning DA network that fuses a background field from the FuXi forecast model with satellite observations in feature space to produce an analysis increment.
- **Data:** Advanced Geosynchronous Radiation Imager (AGRI) radiances from Fengyun-4B, FuXi background forecasts, and ERA5 as reference.
- **Main result:** Assimilating AGRI data consistently reduces analysis errors and significantly improves FuXi forecast performance; analysis increments are consistent with atmospheric physics.
- **Open work:** Extending to additional observation types (microwave, conventional, polar orbiters) and cycling DA.
- **Issues:** Single geostationary instrument only; evaluated within the FuXi system against reanalysis rather than an operational DA comparison.
- *Basis: abstract+knowledge*

### [A comparison of combined data assimilation and machine learning methods for offline and online model error correction](https://doi.org/10.1016/j.jocs.2021.101468)
Farchi et al. (2021), *Journal of Computer Science*. 57 citations.

- **Main goal:** Compares ways of combining ML and data assimilation to learn corrections to a physical model's error, offline and online.
- **Architecture:** Hybrid surrogate models with a neural-network correction added either to the model resolvent (integrated step) or inside the tendencies (requires adjoint); online learning formulated as a weak-constraint 4D-Var variant.
- **Data:** Two-scale Lorenz model with sparse, noisy observations.
- **Main result:** Both corrections give similar long-range forecast accuracy, but tendency correction is much better in DA experiments; online learning extracts all information from sparse, noisy observations.
- **Open work:** Implement in operational systems (e.g., IFS) where adjoints exist.
- **Issues:** Toy model; the tendency correction needs an adjoint of the physical model.
- *Basis: abstract*

### [Combining machine learning and data assimilation to forecast dynamical systems from noisy partial observations](https://doi.org/10.1063/5.0066080)
Gottwald et al. (2021), *Chaos*. 57 citations.

- **Main goal:** Learns the propagator of a dynamical system from partial, noisy observations cheaply.
- **Architecture:** RAFDA: random feature map network trained sequentially within an ensemble Kalman filter data assimilation procedure, using delay coordinates via Takens embedding.
- **Data:** Low-dimensional chaotic test systems (e.g., Lorenz-63) with partial noisy observations.
- **Main result:** RAFDA outperforms standard random feature maps trained on batch data in forecasting.
- **Open work:** Scale to high-dimensional geophysical systems.
- **Issues:** Toy problems only; random feature models may need many features in high dimensions.
- *Basis: abstract+knowledge*

### [FengWu-4DVar: Coupling the Data-driven Weather Forecasting Model with 4D Variational Assimilation](https://arxiv.org/abs/2312.12455)
Xiao et al. (2023), *arXiv*. 51 citations.

- **Main goal:** Couple a data-driven weather model with data assimilation so ML forecasting does not depend on traditional analysis systems.
- **Architecture:** FengWu-4DVar: the FengWu AI forecast model inside a 4D-Var assimilation cycle, using auto-differentiation instead of a hand-coded adjoint.
- **Data:** Simulated observations (derived from reanalysis) in cycling experiments.
- **Main result:** Generates reasonable analysis fields and accurate, efficient cycled forecasts without a physical model.
- **Open work:** Assimilating real observations and comparing against operational analyses.
- **Issues:** Tested only with simulated observations; background error covariance treatment and real-observation issues not addressed in the abstract.
- *Basis: assessment*

### [Variational Data Assimilation with a Learned Inverse Observation Operator](https://arxiv.org/abs/2102.11192)
Frerix et al. (2021), *International Conference on Machine Learning*. 49 citations.

- **Main goal:** Improves variational data assimilation, which is hard to optimize because observations are not invertibly related to physical states.
- **Architecture:** Learned inverse observation operator (neural network mapping observations to states), used to initialize 4D-Var-type optimization and to reformulate the objective in physical space.
- **Data:** Lorenz 96 model and a two-dimensional turbulent fluid flow, with synthetic observations.
- **Main result:** Significantly improves forecast quality for these chaotic systems compared with standard variational DA.
- **Open work:** Scale to realistic NWP observation networks and models, and combine with background error statistics.
- **Issues:** Idealized systems and synthetic observations; requires training data of paired observations and states.
- *Basis: abstract*

### [Using Data Assimilation to Train a Hybrid Forecast System that Combines Machine-Learning and Knowledge-Based Components](https://doi.org/10.1063/5.0048050)
Wikner et al. (2021), *Chaos*. 45 citations.

- **Main goal:** Trains hybrid ML and physics forecast models when only noisy, partial observations are available rather than full-state training data.
- **Architecture:** Hybrid model in which reservoir computing corrects an imperfect knowledge-based model. Training uses analyses from an Ensemble Transform Kalman Filter.
- **Data:** Synthetic observations from the Lorenz 1963 and Kuramoto-Sivashinsky systems, with model error introduced as a misspecified parameter.
- **Main result:** Training on DA analyses from partial measurements yields an ML correction that improves forecasts of the imperfect model.
- **Open work:** Scale to realistic atmospheric models (pursued in Arcomano et al. 2022) and iterate DA and training cycles.
- **Issues:** Low-dimensional toy systems and a simple parametric model error. Behaviour with realistic structural error is untested.
- *Basis: abstract+knowledge*

### [Data driven weather forecasts trained and initialised directly from observations](https://arxiv.org/abs/2407.15586)
McNally et al. (2024), *arXiv*. 33 citations.

- **Main goal:** Removes ML forecasts' dependence on reanalyses and physics-based data assimilation by learning directly from observations.
- **Architecture:** Neural network that ingests raw observations and forecasts future observations at arbitrary locations, working entirely in observation space.
- **Data:** Raw historical observations, e.g., SYNOP surface data and satellite observations; no reanalysis used.
- **Main result:** Preliminary 12-hour forecasts show the network learns time evolution of physical processes in real observations.
- **Open work:** Longer lead times, more observation types, and extension to the full Earth system.
- **Issues:** Preliminary; short lead times only; observation coverage gaps; no comparison with operational NWP reported.
- *Basis: abstract*

### [Physically consistent global atmospheric data assimilation with machine learning in latent space](https://doi.org/10.1126/sciadv.aea4248)
Fan et al. (2025), *Science Advances*. 29 citations.

*Summary pending.*

### [Generative assimilation and prediction for weather and climate](https://arxiv.org/abs/2503.03038)
Yang et al. (2025), *arXiv*. 23 citations.

*Summary pending.*

### [Appa: Bending Weather Dynamics with Latent Diffusion Models for Global Data Assimilation](https://arxiv.org/abs/2504.18720)
Andry et al. (2025), *arXiv*. 21 citations.

*Summary pending.*

### [Learning to Infer Weather States Using Partial Observations](https://doi.org/10.1029/2024jh000260)
Chao et al. (2025), *Journal of Geophysical Research*. 17 citations.

*Summary pending.*

### [Data Assimilation with Machine Learning Surrogate Models: A Case Study with FourCastNet](https://arxiv.org/abs/2405.13180)
Adrian et al. (2024), *arXiv*. 17 citations.

*Summary pending.*

### [PhyDA: Physics-Guided Diffusion Models for Data Assimilation in Atmospheric Systems](https://arxiv.org/abs/2505.12882)
Wang et al. (2025), *arXiv*. 15 citations.

*Summary pending.*

### [4D‐Var Using Hessian Approximation and Backpropagation Applied to Automatically Differentiable Numerical and Machine Learning Models](https://doi.org/10.1029/2024ms004608)
Solvik et al. (2024), *Journal of Advances in Modeling Earth Systems*. 14 citations.

*Summary pending.*

### [Using data assimilation tools to dissect GraphDOP](https://arxiv.org/abs/2510.27388)
Laloyaux et al. (2025), *arXiv*. 11 citations.

*Summary pending.*

### [A novel latent space data assimilation framework with Autoencoder-Observation to Latent space (AE-O2L) network. Part I: the observation-only analysis method](https://doi.org/10.1175/mwr-d-24-0057.1)
Fan et al. (2025), *Monthly Weather Review*. 9 citations.

*Summary pending.*

### [A Four‐Dimensional Variational Informed Generative Adversarial Network for Data Assimilation](https://doi.org/10.1029/2024ms004437)
Wang et al. (2025), *Journal of Advances in Modeling Earth Systems*. 7 citations.

*Summary pending.*

### [Four-dimensional variational data assimilation with a sea-ice thickness emulator](https://doi.org/10.5194/tc-19-5613-2025)
Durand et al. (2025), *The Cryosphere*. 7 citations.

*Summary pending.*

### [Evaluating Machine Learning Weather Models for Data Assimilation: Fundamental Limitations in Tangent Linear and Adjoint Properties](https://doi.org/10.1029/2025gl119402)
Tian et al. (2026), *Geophysical Research Letters*. 5 citations.

*Summary pending.*

### [A Unified Neural Background‐Error Covariance Model for Midlatitude and Tropical Atmospheric Data Assimilation](https://doi.org/10.1029/2025ms005360)
Melinc et al. (2025), *Journal of Advances in Modeling Earth Systems*. 4 citations.

*Summary pending.*

### [ADAF: An Artificial Intelligence Data Assimilation Framework for Weather Forecasting](https://doi.org/10.1029/2024ms004839)
Xiang et al. (2025), *Journal of Advances in Modeling Earth Systems*. 1 citations.

*Summary pending.*

<a id="remote_sensing"></a>
## Remote sensing & clouds

### [A cloud detection algorithm for satellite imagery based on deep learning](https://doi.org/10.1016/j.rse.2019.03.039)
Jeppesen et al. (2019), *Remote Sensing of Environment*. 387 citations.

- **Main goal:** Detect clouds in optical satellite imagery using spatial context, reducing misclassification over bright surfaces such as snow and ice.
- **Architecture:** RS-Net, a U-Net based convolutional segmentation network; also trained with noisy Fmask labels.
- **Data:** Landsat 8 Biome and SPARCS cloud-mask datasets, plus Fmask-generated annotations.
- **Main result:** State-of-the-art performance especially over snow/ice; RGB-only models perform well; training on Fmask labels yields better masks than Fmask itself; classifying a full Landsat 8 scene takes about 18 s.
- **Open work:** Application to small satellites with limited bands and to other sensors.
- **Issues:** Evaluated on limited labeled datasets; cloud shadow and thin cloud handling not detailed in the abstract.
- *Basis: abstract*

### [Improving Precipitation Estimation Using Convolutional Neural Network](https://doi.org/10.1029/2018wr024090)
Pan et al. (2019), *Water Resources Research*. 240 citations.

- **Main goal:** Improve daily precipitation estimation via statistical downscaling from dynamically resolved variables as an alternative to precipitation parameterizations.
- **Architecture:** Convolutional neural network learning precipitation-related features from surrounding resolved fields; architectures compared and interpreted.
- **Data:** Reanalysis dynamical fields as predictors and observed daily precipitation at 14 grid points across the contiguous US.
- **Main result:** With enough data, CNN beats reanalysis precipitation and downscaling by linear regression, nearest neighbor, random forest and fully connected networks.
- **Open work:** Using insights to improve precipitation parameterizations and integrating into NWP models.
- **Issues:** Only 14 locations; performance depends on data quantity; point-wise models rather than a spatially coherent field.
- *Basis: abstract*

### [A spatiotemporal deep fusion model for merging satellite and gauge precipitation in China](https://doi.org/10.1016/j.jhydrol.2020.124664)
Wu et al. (2020), *Journal of Hydrology*. 215 citations.

- **Main goal:** Improve quantitative precipitation estimation over China by merging satellite, gauge and infrared data while using spatial and temporal correlations together.
- **Architecture:** CNN-LSTM fusion model: CNN extracts spatial features of satellite, gauge and thermal infrared data; LSTM captures time dependence.
- **Data:** TRMM 3B42 V7, thermal infrared imagery, and 796 rain gauges in China; produces a daily 0.05° dataset for 2001-2005.
- **Main result:** Outperforms CNN, LSTM and MLP alone; reduces TRMM RMSE by 17.0% and MAE by 14.7%, raising correlation to 0.72, including for gauge-sparse regions.
- **Open work:** Extend to newer satellite products (e.g. IMERG), longer periods, and sub-daily resolution.
- **Issues:** Evaluation against gauges that also inform the merge needs careful independence; product covers only 2001-2005; extremes may be underestimated.
- *Basis: abstract*

### [PERSIANN-CNN: Precipitation Estimation from Remotely Sensed Information Using Artificial Neural Networks–Convolutional Neural Networks](https://doi.org/10.1175/jhm-d-19-0110.1)
Sadeghi et al. (2019), *Journal of Hydrometeorology*. 176 citations.

- **Main goal:** Improve satellite-based precipitation rate estimation using deep learning on geostationary imagery.
- **Architecture:** Convolutional neural network (encoder-decoder) using infrared and water vapor channels from GOES.
- **Data:** Summers 2012 and 2013 over central CONUS at 0.08 deg and hourly scale; NCEP Stage IV gauge-radar as reference.
- **Main result:** PERSIANN-CNN beats PERSIANN-CCS and PERSIANN-SDAE by 54% and 23% in CSI and reduces RMSE by 37% and 14%.
- **Open work:** Extension to other seasons, regions and additional channels; operational implementation.
- **Issues:** Evaluated only for warm-season central CONUS; IR/WV channels sense cloud tops, limiting skill for some rain types.
- *Basis: abstract*

### [A Deep Neural Network Modeling Framework to Reduce Bias in Satellite Precipitation Products](https://doi.org/10.1175/jhm-d-15-0075.1)
Tao et al. (2016), *Journal of Hydrometeorology*. 130 citations.

- **Main goal:** Reduces systematic bias in satellite infrared-based precipitation estimates, which suffer from a weak link between cloud-top properties and surface rain.
- **Architecture:** Deep neural network (stacked denoising autoencoder) that extracts features from satellite infrared imagery to correct precipitation estimates.
- **Data:** Geostationary infrared satellite imagery and the PERSIANN-CCS product, evaluated against radar-based precipitation over the central United States (details not confirmed).
- **Main result:** The deep network reduces bias in the satellite precipitation estimates relative to the baseline product. Specific numbers not reported here.
- **Open work:** Adding further channels such as water vapor and microwave data, and extending evaluation to other regions and seasons.
- **Issues:** Limited region and period; depends on radar reference data for training. Abstract unavailable.
- *Basis: assessment*

### [Development and Interpretation of a Neural Network-Based Synthetic Radar Reflectivity Estimator Using GOES-R Satellite Observations](https://doi.org/10.1175/jamc-d-20-0084.1)
Hilburn et al. (2020), *Journal of Applied Meteorology and Climatology*. 69 citations.

- **Main goal:** Make GOES-R observations usable in precipitating scenes for convective-scale data assimilation by converting them to synthetic radar reflectivity.
- **Architecture:** Convolutional neural network mapping ABI radiances and GLM lightning to radar reflectivity, interpreted with channel/spatial withholding, layerwise relevance propagation and synthetic inputs.
- **Data:** GOES-16 ABI radiances and GLM lightning with collocated MRMS radar reflectivity over the central and eastern US.
- **Main result:** Spatial context in CNNs gives a major improvement over pixel-by-pixel methods; skill at high reflectivity comes from radiance gradients and lightning, with lightning pinpointing strong echoes.
- **Open work:** Assimilate the synthetic reflectivity in convective-scale models and extend to regions without radar.
- **Issues:** Trained where radar exists, so performance in data-sparse regions is unverified; high reflectivity is rare and harder to capture.
- *Basis: abstract+knowledge*

### [Combining Crowdsourcing and Deep Learning to Explore the Mesoscale Organization of Shallow Convection](https://doi.org/10.1175/bams-d-19-0324.1)
Rasp et al. (2019), *Bulletin of the American Meteorological Society*. 69 citations.

- **Main goal:** Explore mesoscale organization of trade-wind shallow cumulus at scale by combining human labeling and deep learning.
- **Architecture:** Crowdsourced labeling of four patterns (Sugar, Flower, Fish, Gravel), then deep learning object detection/segmentation models to automate detection.
- **Data:** About 10,000 MODIS visible satellite images over trade-wind regions labeled by 67 scientists into almost 50,000 cloud clusters.
- **Main result:** Deep learning reproduces human labeling well enough to build global climatologies; the patterns partly overlap with open/closed cells but differ in important ways and relate to distinct large-scale environments.
- **Open work:** Studying the physical drivers and radiative effects of the patterns and their representation in models; dataset released for further work.
- **Issues:** Subjective pattern definitions with notable inter-labeler disagreement; labels limited to selected regions.
- *Basis: abstract+knowledge*

### [Using deep learning to emulate and accelerate a radiative-transfer model](https://doi.org/10.1175/jtech-d-21-0007.1)
Lagerquist et al. (2021), *Journal of Atmospheric and Oceanic Technology*. 60 citations.

- **Main goal:** Emulates the shortwave RRTM radiative transfer model at a fraction of its cost so it can serve as an NWP parameterization.
- **Architecture:** Knowledge-guided U-net++ networks that predict surface downwelling flux, TOA upwelling flux, net flux and heating-rate profiles.
- **Data:** RRTM calculations on atmospheric profiles from many sites. Experiment 1 trains on non-tropical sites and tests on tropical sites; Experiment 2 trains and tests on different sites from all regions.
- **Main result:** The models run about 10^4 times faster than RRTM. Experiment 2 fixes most deficiencies seen in Experiment 1, but large upper-stratospheric heating-rate errors remain.
- **Open work:** Couple the emulator online in NWP and fix the stratospheric heating-rate errors; extend to longwave radiation.
- **Issues:** Shortwave only and offline. Biases remain for certain cloud configurations and low zenith angles.
- *Basis: abstract*

### [Precipitation Identification with Bispectral Satellite Information Using Deep Learning Approaches](https://doi.org/10.1175/jhm-d-16-0176.1)
Tao et al. (2017), *Journal of Hydrometeorology*. 60 citations.

- **Main goal:** Improves identification of precipitating areas from geostationary satellites, a key step in satellite precipitation estimation.
- **Architecture:** Deep neural network (stacked denoising autoencoder) using bispectral infrared and water vapor channel information.
- **Data:** Geostationary satellite IR and water vapor imagery with radar-based precipitation as reference over the US (details not confirmed).
- **Main result:** Using both channels with deep learning improves rain/no-rain identification over the operational PERSIANN-CCS baseline. Numbers not reported here.
- **Open work:** Adding more channels and moving from rain detection to rain-rate estimation.
- **Issues:** Regional study; depends on radar reference; abstract unavailable.
- *Basis: assessment*

### [Discovering the Importance of Mesoscale Cloud Organization Through Unsupervised Classification](https://doi.org/10.1029/2019gl085190)
Denby (2020), *Geophysical Research Letters*. 56 citations.

- **Main goal:** Objectively discover shallow trade-wind cloud organization regimes from satellite images, given their importance for climate sensitivity.
- **Architecture:** Unsupervised neural network (triplet-loss convolutional embedding, Tile2Vec-style) followed by clustering of the embeddings.
- **Data:** 10,000 GOES-16 satellite images over the tropical Atlantic in boreal winter.
- **Main result:** Discovers a hierarchy of organization regimes across scales, with sub-clusters having distinct radiative properties, without hand-labeled data.
- **Open work:** Study environmental conditions and transitions between regimes, and compare models to observations through emergent cloud structures.
- **Issues:** Clusters require physical interpretation; trained on one region and season; links to climate sensitivity remain indirect.
- *Basis: abstract+knowledge*

### [Deep Learning for Precipitation Estimation from Satellite and Rain Gauges Measurements](https://doi.org/10.3390/rs11212463)
Moraux et al. (2019), *Remote Sensing*. 46 citations.

- **Main goal:** Estimates instantaneous precipitation from geostationary satellite infrared imagery, which lacks direct sensitivity to surface rain, using deep learning.
- **Architecture:** Multiscale encoder-decoder convolutional neural network that detects precipitating pixels and estimates rain rate.
- **Data:** SEVIRI/MSG channels at 8.7, 10.8 and 12.0 micron plus in situ rain gauge measurements over Belgium, the Netherlands and Germany as targets.
- **Main result:** Detects precipitating pixels with POD 0.75 and FAR 0.3; estimates instantaneous rain rate with RMSE of 1.6 mm/h.
- **Open work:** Testing over other regions and climates, adding more channels or radar targets, and comparison with operational satellite precipitation products.
- **Issues:** Regional training over western Europe; infrared-only inputs limit skill for warm rain; gauge point measurements versus pixel-scale estimates introduce representativeness error.
- *Basis: assessment*

### [GPROF-NN: a neural-network-based implementation of the Goddard Profiling Algorithm](https://doi.org/10.5194/amt-15-5033-2022)
Pfreundschuh et al. (2022), *Atmospheric Measurement Techniques*. 36 citations.

- **Main goal:** Improves the operational GPM passive microwave precipitation retrieval (GPROF) using modern neural networks.
- **Architecture:** Two probabilistic neural-network retrievals: GPROF-NN 1D (pixel-wise) and GPROF-NN 3D (convolutional, using spatial structure).
- **Data:** The same a priori database and inputs as GPROF for GMI and MHS sensors; independent check with Hurricane Harvey against GPM combined and ground radar.
- **Main result:** For GMI, 1D lowers MAE from 0.079 to 0.059 mm/h and raises correlation from 0.797 to 0.847; 3D reaches MAE 0.043 mm/h and correlation 0.897. Runtime is lower than GPROF.
- **Open work:** Validation against independent measurements, especially for MHS, and operational adoption in the GPM pipeline.
- **Issues:** Main evaluation uses a test set consistent with training data, so training-data representativeness errors are not assessed; MHS gains unclear on independent data.
- *Basis: abstract*

### [Data-Driven Cloud Clustering via a Rotationally Invariant Autoencoder](https://doi.org/10.1109/tgrs.2021.3098008)
Kurihana et al. (2021), *IEEE Transactions on Geoscience and Remote Sensing*. 23 citations.

- **Main goal:** Discovers cloud regimes in satellite imagery without predefined classes, to support understanding of cloud feedbacks.
- **Architecture:** Rotation-invariant cloud clustering (RICC): convolutional autoencoder with a rotation-invariant loss, followed by clustering in latent space.
- **Data:** Multispectral satellite cloud imagery (MODIS).
- **Main result:** Clusters are physically reasonable, capture texture and spatial information, are cohesive and separable in latent space, and are insensitive to image orientation.
- **Open work:** Use clusters to study cloud dynamics, trends and feedbacks in climate contexts.
- **Issues:** Unsupervised clusters are hard to validate objectively; evaluation relies on designed protocols rather than ground truth.
- *Basis: abstract+knowledge*

### [Fusion of multi-source precipitation records via coordinate-based generative models](https://doi.org/10.1038/s41467-025-67987-9)
Sun et al. (2025), *Nature Communications*. 12 citations.

*Summary pending.*

### [MSWEP V3: Machine Learning-Powered Global Precipitation Estimates at 0.1$^\circ$ Hourly Resolution (1979-Present)](https://arxiv.org/abs/2602.01436)
Wang et al. (2026), *arXiv*. 6 citations.

*Summary pending.*

### [SpecTf: Transformers enable data-driven imaging spectroscopy cloud detection](https://doi.org/10.1073/pnas.2502903122)
Lee et al. (2025), *Proceedings of the National Academy of Sciences of the United States of America*. 5 citations.

*Summary pending.*

<a id="extremes"></a>
## Extremes & tropical cyclones

### [Application of Deep Convolutional Neural Networks for Detecting Extreme Weather in Climate Datasets](https://arxiv.org/abs/1605.01156)
Liu et al. (2016), *arXiv*. 387 citations.

- **Main goal:** Replaces subjective threshold-based detection of extreme weather events in climate data with learned pattern recognition.
- **Architecture:** Deep convolutional neural network classifiers tuned with Bayesian hyperparameter optimization, one per event type.
- **Data:** Labeled image patches from climate simulations and reanalysis (e.g., CAM5 output) for tropical cyclones, atmospheric rivers and weather fronts.
- **Main result:** Classification accuracy of about 89% to 99% for tropical cyclones, atmospheric rivers and weather fronts.
- **Open work:** Moving from patch classification to localization and segmentation in full global fields, and reducing reliance on labels.
- **Issues:** Labels come from heuristic detection schemes, so the CNN learns those definitions; classification of pre-cropped patches, not detection in raw data.
- *Basis: abstract+knowledge*

### [Exascale Deep Learning for Climate Analytics](https://doi.org/10.1109/sc.2018.00054)
Kurth et al. (2018), *International Conference for High Performance Computing, Networking, Storage and Analysis*. 286 citations.

- **Main goal:** Scales deep learning for pixel-level segmentation of extreme weather patterns in climate data to the largest supercomputers.
- **Architecture:** Segmentation networks (Tiramisu and DeepLabv3+ variants) with improved software frameworks, input pipeline and distributed training algorithms.
- **Data:** High-resolution CAM5 climate simulation output with heuristic labels for tropical cyclones and atmospheric rivers.
- **Main result:** DeepLabv3+ scales to 27,360 V100 GPUs at 325.8 PF/s sustained (90.7% efficiency); FP16 reaches 1.13 EF/s peak and 999 PF/s sustained; Gordon Bell Prize winner.
- **Open work:** Improving label quality and using segmentations for scientific analysis of extremes under climate change.
- **Issues:** Focus is computing performance; labels from heuristic detectors; scientific accuracy evaluation is limited.
- *Basis: abstract+knowledge*

### [Tropical Cyclone Intensity Estimation Using a Deep Convolutional Neural Network](https://doi.org/10.1109/tip.2017.2766358)
Pradhan et al. (2018), *IEEE Transactions on Image Processing*. 229 citations.

- **Main goal:** Estimate tropical cyclone intensity directly from satellite imagery as an objective alternative to the subjective Dvorak technique.
- **Architecture:** Deep convolutional neural network regressing (or classifying) intensity from infrared satellite images of tropical cyclones.
- **Data:** Geostationary infrared hurricane images matched with best-track intensities (Atlantic and Pacific basins); exact period not available here.
- **Main result:** Reported RMSE of roughly 10 kt relative to best-track intensity, competitive with existing objective techniques; numbers should be checked against the paper.
- **Open work:** Adding temporal information, multiple channels and other basins; operational testing.
- **Issues:** Abstract unavailable; best-track labels are themselves uncertain (partly Dvorak-based); relatively small sample of intense storms.
- *Basis: assessment*

### [Analog Forecasting of Extreme‐Causing Weather Patterns Using Deep Learning](https://doi.org/10.1029/2019ms001958)
Chattopadhyay et al. (2019), *Journal of Advances in Modeling Earth Systems*. 187 citations.

- **Main goal:** Predict extreme-causing circulation patterns days ahead with a fast data-driven analog approach to complement NWP early warnings.
- **Architecture:** Capsule neural networks with impact-based auto-labeling of Z500 patterns (classes 0-4 by occurrence and region of surface temperature extremes), compared with CNNs and logistic regression.
- **Data:** Large-ensemble fully coupled Earth system model output (CESM Large Ensemble) for North America.
- **Main result:** Using Z500 only, accuracies (recalls) of 69-45% (77-48%) for cold and 62-41% (73-47%) for heat waves at 1-5 days; with surface temperature added, about 80% (88%); CapsNets beat CNN and logistic regression and degrade least with less data.
- **Open work:** Testing on reanalysis and observations and combining with NWP for early warning.
- **Issues:** Trained and evaluated on model data only; coarse categorical targets; accuracy drops quickly with lead time.
- *Basis: abstract+knowledge*

### [Interpretable Deep Learning for Spatial Analysis of Severe Hailstorms](https://doi.org/10.1175/mwr-d-18-0316.1)
Gagne et al. (2019), *Monthly Weather Review*. 166 citations.

- **Main goal:** Predict severe hail probability from storm-scale model fields and interpret what the deep learning model learns.
- **Architecture:** Convolutional neural network compared with logistic regression on spatial-mean or PCA inputs; interpretation via feature importance and feature optimization.
- **Data:** Storm-centered patches from NCAR convection-allowing ensemble runs, 3 May-3 June 2016; target is Thompson hail size diagnostic exceeding 25 mm in the next hour.
- **Main result:** CNN significantly outperforms all baselines in Brier skill score and ROC AUC; interpretation reveals physically consistent features (steep lapse rates, shear favoring wide updrafts) and storm modes.
- **Open work:** Verification against observed hail and longer, multi-season datasets.
- **Issues:** Target is a model diagnostic, not observed hail; one month of data; results tied to one model configuration.
- *Basis: abstract*

### [Using Deep Learning to Estimate Tropical Cyclone Intensity from Satellite Passive Microwave Imagery](https://doi.org/10.1175/mwr-d-18-0391.1)
Wimmers et al. (2019), *Monthly Weather Review*. 157 citations.

- **Main goal:** Estimate tropical cyclone intensity objectively from satellite passive microwave imagery, which sees inner-core structure under clouds.
- **Architecture:** Convolutional neural network (DeepMicroNet) with probabilistic output, able to work from partial scans and tolerant of imprecise storm-center fixes.
- **Data:** Passive microwave images at 37 GHz and 85-92 GHz from multiple sensors, trained against global best-track intensities; evaluated on two independent years and against aircraft reconnaissance-aided best track.
- **Main result:** RMSE of 14.3 kt against all independent best track, 10.6 kt against reconnaissance-aided best track, and 9.6 kt using only higher-resolution TMI and AMSR-E; the 85-92 GHz band contributes most.
- **Open work:** Expand training data, use more advanced architectures, and better characterize performance for the strongest storms.
- **Issues:** Too few category-5 cases for conclusive results at high intensities; the model reproduces known best-track biases because it is trained on best track; microwave overpasses are infrequent.
- *Basis: abstract*

### [ClimateNet: an expert-labeled open dataset and deep learning architecture for enabling high-precision analyses of extreme weather](https://doi.org/10.5194/gmd-2020-72)
Prabhat et al. (2020), *Geoscientific Model Development*. 133 citations.

- **Main goal:** Provides labeled data and a deep learning method for precise detection of tropical cyclones (TCs) and atmospheric rivers (ARs), since heuristic detection algorithms disagree strongly.
- **Architecture:** ClimateNet: community-sourced, expert-labeled segmentation dataset plus a semantic segmentation CNN (DeepLabv3+-style) for pixel-level TC/AR/background classification.
- **Data:** High-resolution CAM5.1 climate model output for a recent historical period (labeled), applied to historical and climate-change scenario CAM5.1 simulations.
- **Main result:** The trained model accurately segments TCs and ARs and enables event-conditioned statistics, e.g. regional distributions of extreme precipitation attributed to TCs or ARs.
- **Open work:** Extending to more event types and to observations and reanalysis via transfer learning; growing the labeled dataset.
- **Issues:** Labels are subjective and limited in number; trained on a single model's simulations, so transfer to other models or reanalysis is untested here.
- *Basis: abstract+knowledge*

### [Tropical Cyclone Track Forecasting Using Fused Deep Learning From Aligned Reanalysis Data](https://doi.org/10.3389/fdata.2020.00001)
Giffard-Roisin et al. (2019), *Frontiers in Big Data*. 112 citations.

- **Main goal:** Improves fast 24 h tropical cyclone track forecasts with deep learning as a complement to dynamical and statistical models.
- **Architecture:** Fused neural network combining past trajectory data with reanalysis wind and pressure 3D fields in a storm-centered moving frame, predicting latitude/longitude displacement.
- **Data:** Over 3,000 storms from both hemispheres since 1979 at 6 h frequency, with aligned reanalysis fields.
- **Main result:** The fused network outperforms single-input variants and is competitive/complementary with current forecast models, producing forecasts in seconds.
- **Open work:** Longer lead times, intensity forecasting, and use of operational analyses/forecast fields as inputs.
- **Issues:** Only 24 h lead time; reanalysis inputs are not available in real time; specific error numbers not reported in the abstract.
- *Basis: assessment*

### [Money Doesn't Grow on Trees, but Forecasts Do: Forecasting Extreme Precipitation with Random Forests](https://doi.org/10.1175/mwr-d-17-0250.1)
Herman et al. (2018), *Monthly Weather Review*. 111 citations.

- **Main goal:** Produces probabilistic forecasts of locally extreme precipitation, which raw ensemble forecasts handle poorly.
- **Architecture:** Random forests trained on ensemble forecast predictors, per region, giving probabilities of exceeding return-period thresholds.
- **Data:** GEFS reforecast data as predictors, with observed extreme precipitation (relative to return-period thresholds) over the contiguous US as targets.
- **Main result:** Random forest forecasts are skillful and reliable, outperforming raw ensemble guidance and competitive with or better than operational human forecasts at short leads.
- **Open work:** Using convection-allowing model inputs and extending to longer leads and sub-daily accumulations.
- **Issues:** Rare-event sample size limits training; regional dependence; tied to one ensemble system. Abstract unavailable.
- *Basis: assessment*

### [Deep Learning for Spatially Explicit Prediction of Synoptic-Scale Fronts](https://doi.org/10.1175/waf-d-18-0183.1)
Lagerquist et al. (2019), *Weather and Forecasting*. 98 citations.

- **Main goal:** Objectively identify synoptic-scale warm and cold fronts in gridded data.
- **Architecture:** Convolutional neural network producing front probability grids followed by a novel postprocessing that converts probabilities to front objects.
- **Data:** 1000-mb wind, temperature, humidity, wet-bulb potential temperature and geopotential height from the North American Regional Reanalysis; labels from WPC human-drawn fronts.
- **Main result:** At a 250-km matching distance, POD 0.73, success ratio 0.65 and CSI 0.52, far exceeding a traditional numerical frontal analysis baseline.
- **Open work:** Front climatologies and quantifying frontal spread across NWP ensemble members.
- **Issues:** Human-analyzed labels are subjective and inconsistent; single pressure level; regional (North America) domain.
- *Basis: abstract*

### [Can AI weather models predict out-of-distribution gray swan tropical cyclones?](https://doi.org/10.1073/pnas.2420914122)
Sun et al. (2024), *Proceedings of the National Academy of Sciences*. 96 citations.

- **Main goal:** Tests whether AI weather models can forecast extreme tropical cyclones stronger than anything in their training data (gray swans).
- **Architecture:** AI weather model (FourCastNet-type) retrained with Category 3-5 tropical cyclones removed from the training set.
- **Data:** ERA5 reanalysis with strong cyclones removed for training; tested on Category 5 storms.
- **Main result:** The model cannot accurately forecast unseen Category 5 cyclones, but it can learn strong storms in one basin and forecast them in another.
- **Open work:** Methods to improve extrapolation to rare extremes, such as physics constraints or synthetic data.
- **Issues:** One model architecture; coarse reanalysis underestimates TC intensity anyway.
- *Basis: abstract+knowledge*

### [Deep Learning-Based Extreme Heatwave Forecast](https://doi.org/10.3389/fclim.2022.789641)
Jacques-Dumas et al. (2021), *Frontiers in Climate*. 77 citations.

- **Main goal:** Forecasts the occurrence of rare, long-lasting extreme heatwaves using deep learning trained on climate model output.
- **Architecture:** CNN with large-class undersampling and transfer learning across intensity thresholds.
- **Data:** 1,000 years of climate model output (PlaSim) of surface temperature and 500 hPa geopotential height; heatwaves over France.
- **Main result:** The network forecasts long-lasting extreme heatwaves at three intensity levels up to 15 days before onset.
- **Open work:** Use as a proxy for rare-event resampling, climate change studies, and eventually real-world forecasting.
- **Issues:** Intermediate-complexity model; not tested on observations; class imbalance and limited number of extreme events.
- *Basis: abstract+knowledge*

### [Deep Learning on Three-Dimensional Multiscale Data for Next-Hour Tornado Prediction](https://doi.org/10.1175/mwr-d-19-0372.1)
Lagerquist et al. (2020), *Monthly Weather Review*. 75 citations.

- **Main goal:** Predict next-hour tornado occurrence for individual storms using deep learning on 3D radar and sounding data.
- **Architecture:** Convolutional neural networks on storm-centered 3D radar images plus Rapid Refresh proximity soundings, with hyperparameter experiments.
- **Data:** Multiradar composites MYRORSS and GridRad (separate models) with Rapid Refresh soundings; independent test data.
- **Main result:** AUC above 0.9 for both; CSI of 0.31 (GridRad, 3.52% event frequency) and 0.17 (MYRORSS, 0.24%); errors concentrate in nontornadic rotating supercells and tornadic QLCS cells.
- **Open work:** Implement in real-time forecasting and improve handling of QLCS tornadoes and rotating nontornadic supercells.
- **Issues:** Rare-event imbalance limits CSI; tornado reports used as labels have known reporting biases; performance varies strongly with dataset.
- *Basis: abstract*

### [Physics-augmented Deep Learning to Improve Tropical Cyclone Intensity and Size Estimation from Satellite Imagery](https://doi.org/10.1175/mwr-d-20-0333.1)
Zhuo et al. (2021), *Monthly Weather Review*. 74 citations.

- **Main goal:** Improves tropical cyclone intensity and wind-radii estimation from satellite infrared imagery by adding physical knowledge to deep learning.
- **Architecture:** DeepTCNet, a CNN augmented with auxiliary physical information (TC fullness) for single-task learning and with auxiliary tasks (intensity and wind radii) for multi-task learning.
- **Data:** Infrared satellite imagery of North Atlantic tropical cyclones with best-track intensity and wind-radii labels.
- **Main result:** Fullness augmentation improves intensity estimation by 12%, and multi-task learning improves wind radii by 6-9%. Intensity skill is 39% better than ADT on average and similar to SATCON; wind radii are 32% better than MTCSWA.
- **Open work:** Extend to other basins and add microwave imagery and other inputs.
- **Issues:** North Atlantic only. Labels come from best-track data with their own uncertainty, and fullness information may not be available in real time.
- *Basis: assessment*

### [Forecasting Severe Weather with Random Forests](https://doi.org/10.1175/mwr-d-19-0344.1)
Hill et al. (2020), *Monthly Weather Review*. 72 citations.

- **Main goal:** Produce probabilistic Day 1-3 severe weather forecasts over CONUS analogous to SPC convective outlooks.
- **Architecture:** Random forests with separate models for tornado, hail and severe wind (Day 1) and regional models, using spatiotemporal fields such as CAPE, CIN and shear.
- **Data:** GEFS reforecast ensemble 2003-2012 for training; testing April 2012-December 2016 against storm reports and SPC outlooks.
- **Main result:** RF outlooks are calibrated, slightly underperform SPC at Day 1 but significantly outperform at Days 2 and 3; blends with SPC beat SPC alone at all lead days.
- **Open work:** Operational integration and use of higher-resolution or convection-allowing inputs.
- **Issues:** Coarse GEFS/R inputs; storm reports have population and reporting biases; feature importance is not physical causation.
- *Basis: abstract*

### [Topological data analysis and machine learning for recognizing atmospheric river patterns in large climate datasets](https://doi.org/10.5194/gmd-12-613-2019)
Muszynski et al. (2019), *Geoscientific Model Development*. 71 citations.

- **Main goal:** Automatically recognize atmospheric rivers in large climate datasets without resolution-dependent detection thresholds.
- **Architecture:** Topological data analysis extracts shape features of integrated water vapor fields, which feed a supervised machine-learning classifier.
- **Data:** CAM5.1 climate model output and MERRA-2 reanalysis.
- **Main result:** Threshold-free method provides AR topology and statistics, applies across resolutions and scenarios without retuning, and is fast enough for large datasets.
- **Open work:** Applying the method to evaluate model AR biases and AR changes under different climate scenarios.
- **Issues:** Labels depend on an existing reference detection; classification of AR presence rather than full pixel-level segmentation; accuracy figures are not reported in the abstract.
- *Basis: assessment*

### [Validating Deep-Learning Weather Forecast Models on Recent High-Impact Extreme Events](https://doi.org/10.1175/aies-d-24-0033.1)
Pasche et al. (2024), *Artificial Intelligence for the Earth Systems*. 71 citations.

*Summary pending.*

### [Hurricane Forecasting: A Novel Multimodal Machine Learning Framework](https://doi.org/10.1175/waf-d-21-0091.1)
Boussioux et al. (2020), *Weather and Forecasting*. 64 citations.

- **Main goal:** Forecast tropical cyclone track and intensity with ML by combining diverse data sources.
- **Architecture:** Hurricast: multimodal framework using deep encoder-decoder (CNN/GRU/transformer) feature extraction from spatial-temporal reanalysis fields, combined with statistical features in gradient-boosted trees.
- **Data:** Historical storm data (best track) and reanalysis fields; evaluation in North Atlantic and Eastern Pacific for 2016-2019 at 24 h lead.
- **Main result:** Comparable mean absolute error and skill to operational models at 24 h, computed in seconds; adding Hurricast to a consensus could improve over NHC official forecasts.
- **Open work:** Extend to longer lead times, other basins, and operational real-time inputs.
- **Issues:** Only 24 h lead evaluated; reliance on reanalysis inputs differs from operational availability; rapid intensification not specifically addressed.
- *Basis: abstract+knowledge*

### [Regional Heatwave Prediction Using Graph Neural Network and Weather Station Data](https://doi.org/10.1029/2023gl103405)
Li et al. (2023), *Geophysical Research Letters*. 62 citations.

- **Main goal:** Gives timely, low-cost predictions of regional heatwave occurrence for preparedness.
- **Architecture:** Graph neural network over a network of weather stations, with an interpretable structure that reveals spatiotemporal links between locations.
- **Data:** Weather station observations; the region and period are not reported in the abstract.
- **Main result:** Reports high-accuracy real-time warnings of sudden regional heatwaves at low computational and data cost; no numbers in the abstract.
- **Open work:** Applying the framework to other extreme and compound climate events.
- **Issues:** Station-based, so spatial coverage depends on the network; comparison baselines and lead times are unclear from the abstract; causal interpretation of graph weights needs caution.
- *Basis: assessment*

### [Global Extreme Heat Forecasting Using Neural Weather Models](https://doi.org/10.1175/aies-d-22-0035.1)
Lopez‐Gomez et al. (2022), *Artificial Intelligence for the Earth Systems*. 59 citations.

- **Main goal:** Assess whether neural weather models can forecast extreme heat globally on short, medium and subseasonal timescales to support heat-wave warnings.
- **Architecture:** Convolutional neural weather models on the cubed sphere trained with candidate losses, including mean squared error and exponential losses that emphasize extremes, plus transfer learning.
- **Data:** ERA5 reanalysis, surface temperature anomalies at about 200 km resolution, 1-28 day lead times; compared with persistence and the ECMWF S2S control forecast.
- **Main result:** Extreme-focused losses significantly improve heat-wave skill with little loss in general skill; a symmetric exponential loss reduces smoothing; the best model beats persistence at all leads and the ECMWF S2S control after two weeks.
- **Open work:** Probabilistic ensembles, higher resolution and comparison with full ensemble S2S systems.
- **Issues:** Coarse resolution; comparison is against a single control forecast rather than the ensemble; regressive skill metrics only.
- *Basis: abstract*

### [Survey on the Application of Deep Learning in Extreme Weather Prediction](https://doi.org/10.3390/atmos12060661)
Fang et al. (2021), *Atmosphere*. 52 citations.

- **Main goal:** Summarize the use of deep learning for predicting extreme weather.
- **Architecture:** Survey of methods, mainly recurrent neural networks and convolutional neural networks applied to extreme weather prediction.
- **Data:** Not applicable (survey).
- **Main result:** Preliminary summary showing deep learning can extract image features of extreme weather and estimate occurrence likelihood.
- **Open work:** Not detailed in the abstract; more rigorous evaluation of DL for rare events follows naturally.
- **Issues:** Preliminary and broad; predates recent global ML weather models; limited critical assessment evident from the abstract.
- *Basis: assessment*

### [Tropical and Extratropical Cyclone Detection Using Deep Learning](https://doi.org/10.1175/jamc-d-20-0117.1)
Kumler-Bonfanti et al. (2020), *Journal of Applied Meteorology and Climatology*. 51 citations.

- **Main goal:** Speeds up and improves detection of tropical and extratropical cyclone regions in large meteorological datasets.
- **Architecture:** Four U-Net image-segmentation models trained with labels from IBTrACS or a heuristic detection method.
- **Data:** GFS total precipitable water and GOES water vapor radiance imagery.
- **Main result:** ROI detection accuracy of 80-99%, Dice 0.51-0.76, Tversky 0.56-0.74; the extratropical U-Net runs 3x faster than the heuristic and finds ROIs missed by heuristics and hand-labelling.
- **Open work:** Operational real-time use and improved labels.
- **Issues:** Moderate overlap scores; 'missed' detections beyond labels are hard to verify objectively.
- *Basis: abstract*

### [Probabilistic forecasts of extreme heatwaves using convolutional neural networks in a regime of lack of data](https://arxiv.org/abs/2208.00971)
Miloshevich et al. (2022), *Physical Review Fluids*. 49 citations.

- **Main goal:** Forecast probabilities of extreme long-lasting heatwaves and study how training-data length limits skill.
- **Architecture:** Convolutional neural networks taking 500 hPa geopotential height, soil moisture and related fields to predict heatwave occurrence probability.
- **Data:** Extremely long climate model simulations (thousands of years) from an intermediate-complexity climate model; heatwaves over France.
- **Main result:** Positive skill up to 15 days for 14-day heatwaves from geopotential, longer from soil moisture; NN identifies wavenumber-3 patterns; 100-year training sets yield much lower skill.
- **Open work:** Rare-event simulation and transfer learning to cope with the lack-of-data regime.
- **Issues:** Trained and tested in a climate model world, not observations; skill drops sharply with realistic data lengths.
- *Basis: abstract+knowledge*

### [Prediction of severe thunderstorm events with ensemble deep learning and radar data](https://doi.org/10.1038/s41598-022-23306-6)
Guastavino et al. (2021), *Scientific Reports*. 49 citations.

- **Main goal:** Nowcast severe thunderstorm events with timely warnings.
- **Architecture:** Deep learning on radar reflectivity videos plus lightning data, framed as classification with an ensemble method using value-weighted skill scores.
- **Data:** Weather radar and lightning data from Liguria, Italy.
- **Main result:** Produces a warning machine validated against radar data for the region.
- **Open work:** Testing at other regions and operational evaluation.
- **Issues:** Single region; quantitative skill not reported in the abstract; limited number of severe events.
- *Basis: assessment*

### [A Feed Forward Neural Network Based on Model Output Statistics for Short-Term Hurricane Intensity Prediction](https://doi.org/10.1175/waf-d-18-0173.1)
Cloud et al. (2019), *Weather and Forecasting*. 49 citations.

- **Main goal:** Improve short-term tropical cyclone intensity forecasts, including rapid intensification, by postprocessing HWRF output.
- **Architecture:** Feed-forward neural network using the operational current intensity estimate and HWRF-derived predictors, constrained to 6-h-old model data.
- **Data:** 2014-2016 HWRF reforecasts for Atlantic and eastern Pacific storms for training and cross-validation; real-time 2017 data for out-of-sample testing; best track for verification.
- **Main result:** Cross-validation shows lower MAE than HWFI at 3-57 h, but in 2017 HWFI was better at leads up to 24 h and similar later; the FFNN produced 4 times as many RI hits and higher Atlantic Brier skill than HWFI and SHIPS-RII.
- **Open work:** Retraining for newer HWRF versions, longer training sets and probabilistic intensity outputs.
- **Issues:** Short training period tied to a specific HWRF version; more RI false alarms; cross-validation gains did not fully hold in real-time testing.
- *Basis: abstract*

### [A deep learning ensemble approach for predicting tropical cyclone rapid intensification](https://doi.org/10.1002/asl.1151)
Chen et al. (2023), *Atmospheric Science Letters*. 44 citations.

- **Main goal:** Improve operational prediction of tropical cyclone rapid intensification by combining satellite imagery and environmental predictors with deep learning.
- **Architecture:** Ensemble of 20 deep-learning models with different network designs and input combinations, predicting 24 h intensity distributions.
- **Data:** Satellite images of TC convection plus conventional environmental and TC predictors for western North Pacific TCs.
- **Main result:** The ensemble achieves higher RI detection probability and lower false-alarm rate than operational forecasts for western Pacific TCs.
- **Open work:** Longer lead times, other basins and calibration of the predicted distributions.
- **Issues:** Single basin and limited sample of RI events; the ensemble spread is not necessarily calibrated.
- *Basis: abstract*

### [Benchmark dataset and deep learning method for global tropical cyclone forecasting](https://doi.org/10.1038/s41467-025-61087-4)
Huang et al. (2025), *Nature Communications*. 35 citations.

*Summary pending.*

### [Numerical models outperform AI weather forecasts of record-breaking extremes](https://arxiv.org/abs/2508.15724)
Zhang et al. (2025), *arXiv*. 27 citations.

*Summary pending.*

### [Advancing forecasting capabilities: A contrastive learning model for forecasting tropical cyclone rapid intensification](https://doi.org/10.1073/pnas.2415501122)
Wang et al. (2025), *Proceedings of the National Academy of Sciences of the United States of America*. 27 citations.

*Summary pending.*

### [AI-Boosted Rare Event Sampling to Characterize Extreme Weather.](https://doi.org/10.1103/b1gc-9c2q)
Lancelin et al. (2025), *Physical Review Letters*. 18 citations.

*Summary pending.*

### [Semi-Supervised Detection of Extreme Weather Events in Large Climate Datasets](https://arxiv.org/abs/1612.02095)
Racah et al. (2016), *arXiv*. 17 citations.

- **Main goal:** Detects and localizes many types of extreme weather in climate simulations when labeled data are scarce.
- **Architecture:** Multichannel spatiotemporal encoder-decoder (3D convolutional autoencoder) with a one-pass bounding-box regression loss, trained semi-supervised.
- **Data:** Multi-variable climate simulation output (CAM5) with bounding-box labels from heuristic detectors plus unlabeled data (released as the ExtremeWeather dataset).
- **Main result:** Temporal information and unlabeled data improve localization of extreme weather events; learned representations aid exploratory analysis.
- **Open work:** Improving detection of small or rare event classes and extending to more event types and observational data.
- **Issues:** Overall localization accuracy remains modest, especially for small events; labels inherit heuristic biases.
- *Basis: abstract+knowledge*

### [Evaluation of Tropical Cyclone Track and Intensity Forecasts from Artificial Intelligence Weather Prediction (AIWP) Models](https://arxiv.org/abs/2409.06735)
DeMaria et al. (2024), *arXiv*. 16 citations.

*Summary pending.*

### [Comparison of AI and NWP Models in Operational Severe Weather Forecasting: A Study on Tropical Cyclone Predictions](https://doi.org/10.1029/2024jh000481)
Shi et al. (2025), *Journal of Geophysical Research*. 15 citations.

*Summary pending.*

### [Predicting Beyond Training Data via Extrapolation versus Translocation: AI Weather Models and Dubai's Unprecedented 2024 Rainfall](https://arxiv.org/abs/2505.10241)
Sun et al. (2025), *arXiv*. 15 citations.

*Summary pending.*

### [Performance of the Pangu‐Weather Deep Learning Model in Forecasting Tornadic Environments](https://doi.org/10.1029/2024gl109611)
Hua et al. (2025), *Geophysical Research Letters*. 15 citations.

*Summary pending.*

### [Deep Learning Atmospheric Models Reliably Simulate Out‐of‐Sample Land Heat and Cold Wave Frequencies](https://doi.org/10.1029/2025gl117990)
Meng et al. (2025), *Geophysical Research Letters*. 11 citations.

*Summary pending.*

### [Evaluating Global Machine Learning Models for Tropical Cyclone Dynamics and Thermodynamics](https://doi.org/10.1029/2025jh000594)
Sahu et al. (2025), *Journal of Geophysical Research*. 11 citations.

*Summary pending.*

### [Constructing extreme heatwave storylines with differentiable climate models](https://doi.org/10.5194/wcd-7-393-2026)
Whittaker et al. (2025), *Weather and Climate Dynamics*. 10 citations.

*Summary pending.*

### [Harnessing AI data-driven global weather models for climate attribution: An analysis of the 2017 Oroville Dam extreme atmospheric river](https://arxiv.org/abs/2409.11605)
Baño-Medina et al. (2024), *arXiv*. 6 citations.

*Summary pending.*

### [FuXi-TC: a generative framework integrating deep learning and physics-based models for improved tropical cyclone forecasts](https://doi.org/10.1038/s41612-026-01501-w)
Guo et al. (2025), *npj Climate and Atmospheric Science*. 4 citations.

*Summary pending.*

### [Global Forecasting of Tropical Cyclone Intensity Using Neural Weather Models](https://doi.org/10.1175/aies-d-25-0073.1)
Gomez et al. (2025), *Artificial Intelligence for the Earth Systems*. 4 citations.

*Summary pending.*

### [On the Predictive Skill of Artificial Intelligence-based Weather Models for Extreme Events using Uncertainty Quantification](https://doi.org/10.1175/aies-d-25-0113.1)
Almeida et al. (2025), *Artificial Intelligence for the Earth Systems*. 3 citations.

*Summary pending.*

### [Global performance benchmarking of artificial intelligence models in atmospheric river forecasting](https://doi.org/10.1038/s43247-025-02823-y)
Zhang et al. (2025), *Communications Earth & Environment*. 3 citations.

*Summary pending.*

### [Quantifying Very Extreme Precipitation and Temperature Using Huge Ensembles Generated by Machine Learning-based Climate Model Emulators](https://doi.org/10.1175/bams-d-25-0178.1)
Paciorek et al. (2025), *Bulletin of The American Meteorological Society - (BAMS)*. 2 citations.

*Summary pending.*

### [Severe weather forecasts from artificial intelligence weather prediction models](https://doi.org/10.1175/aies-d-25-0065.1)
White et al. (2026), *Artificial Intelligence for the Earth Systems*. 2 citations.

*Summary pending.*

### [Evaluating machine learning and numerical models for wintertime atmospheric blocking prediction](https://doi.org/10.1175/aies-d-25-0067.1)
Huang et al. (2026), *Artificial Intelligence for the Earth Systems*. 1 citations.

*Summary pending.*

### [Atmospheric Rivers in Machine Learning Weather Models](https://doi.org/10.1175/waf-d-25-0142.1)
Swenson et al. (2026), *Weather and forecasting*. 1 citations.

*Summary pending.*

### [Evaluation of AI-based tropical cyclone forecasts in the western North Pacific: Insights from the 2024 Typhoon Committee ET-AITC multi model dataset](https://doi.org/10.1175/aies-d-25-0097.1)
Lee et al. (2026), *Artificial Intelligence for the Earth Systems*. 0 citations.

*Summary pending.*

<a id="xai"></a>
## Explainability & causality

### [Discovering governing equations from data by sparse identification of nonlinear dynamical systems](https://doi.org/10.1073/pnas.1517384113)
Brunton et al. (2015), *Proceedings of the National Academy of Sciences*. 5,674 citations.

- **Main goal:** Discovers governing equations of dynamical systems directly from measurement data, producing parsimonious, interpretable models.
- **Architecture:** SINDy: sparse regression (sequentially thresholded least squares) over a library of candidate nonlinear functions to select the few active terms in the dynamics. Not deep learning.
- **Data:** Simulated data from canonical systems: linear and nonlinear oscillators, the chaotic Lorenz system, and vortex shedding behind a cylinder (via a reduced POD basis).
- **Main result:** Recovers correct equations from noisy data, including the Lorenz system and the mean-field model of vortex shedding; extends to parameterized, time-varying and forced systems.
- **Open work:** Scaling to high-dimensional systems, choosing good coordinates and function libraries, and robustness to heavy noise.
- **Issues:** Relies on the dynamics being sparse in the chosen library; sensitive to noise in derivative estimation; demonstrated mostly on low-dimensional systems.
- *Basis: abstract+knowledge*

### [Detecting and quantifying causal associations in large nonlinear time series datasets](https://doi.org/10.1126/sciadv.aau4996)
Runge et al. (2017), *Science Advances*. 1,207 citations.

- **Main goal:** Estimates causal networks from large, high-dimensional, nonlinear time series where standard methods lose power or yield false positives.
- **Architecture:** PCMCI: a causal discovery algorithm combining PC-style condition selection with momentary conditional independence tests, using linear (partial correlation) or nonlinear tests. Not deep learning.
- **Data:** Climate time series with known mechanisms, human heart data, and large synthetic datasets mimicking real data properties.
- **Main result:** PCMCI outperforms state-of-the-art methods in detection power while controlling false positives.
- **Open work:** Handling contemporaneous links, hidden confounders and nonstationarity in Earth-system data.
- **Issues:** Assumes causal sufficiency and stationarity; results depend on the chosen variables and test.
- *Basis: abstract+knowledge*

### [Inferring causation from time series in Earth system sciences](https://doi.org/10.1038/s41467-019-10105-3)
Runge et al. (2019), *Nature Communications*. 1,087 citations.

- **Main goal:** Promote and organize data-driven causal inference beyond correlation analysis for Earth system science.
- **Architecture:** Perspective reviewing causal inference frameworks (Granger causality, nonlinear state-space methods, causal network learning such as PCMCI, etc.) and launching the causeme.net benchmark platform.
- **Data:** Illustrative Earth system examples and synthetic benchmark datasets on causeme.net.
- **Main result:** Identifies generic application cases and methodological challenges (e.g. nonlinearity, time delays, unobserved confounders, nonstationarity) and initiates a community benchmark.
- **Open work:** Methods robust to the identified challenges and broader benchmarking on realistic data.
- **Issues:** Perspective, not a single method evaluation; causal conclusions depend on assumptions that are often hard to verify in observational data.
- *Basis: abstract+knowledge*

### [Making the Black Box More Transparent: Understanding the Physical Implications of Machine Learning](https://doi.org/10.1175/bams-d-18-0195.1)
McGovern et al. (2019), *Bulletin of the American Meteorological Society*. 397 citations.

- **Main goal:** Make ML models in meteorology interpretable so forecasters and scientists can trust and learn from them.
- **Architecture:** Synthesis of model interpretation and visualization methods: permutation importance, forward/backward selection, saliency maps, class-activation maps, backward optimization and novelty detection.
- **Data:** Applied to tornado, hail, winter precipitation type and convective storm mode prediction datasets at several scales.
- **Main result:** Demonstrates that these techniques reveal physically meaningful relationships learned by traditional ML and deep learning models; serves as a toolbox.
- **Open work:** Quantitative evaluation of interpretation methods and their reliability.
- **Issues:** Interpretation methods can disagree and be misleading with correlated predictors; mostly qualitative demonstrations.
- *Basis: abstract*

### [Physically Interpretable Neural Networks for the Geosciences: Applications to Earth System Variability](https://doi.org/10.1029/2019ms002002)
Toms et al. (2019), *Journal of Advances in Modeling Earth Systems*. 278 citations.

- **Main goal:** Use neural network interpretation as a primary scientific tool to discover meaningful relationships in geoscience data.
- **Architecture:** Neural networks interpreted with backward optimization and layerwise relevance propagation (LRP), projecting decisions back to input space.
- **Data:** Climate fields such as SST anomalies for ENSO and other modes of variability (observational and model data).
- **Main result:** The interpretation methods reliably recover physically known climate patterns, suggesting they can support discovery.
- **Open work:** Combining interpretable networks with new scientific hypotheses.
- **Issues:** Demonstrations on known patterns; relevance maps depend on method choice and need careful validation.
- *Basis: abstract+knowledge*

### [Data‐Driven Equation Discovery of Ocean Mesoscale Closures](https://doi.org/10.1029/2020gl088376)
Zanna et al. (2020), *Geophysical Research Letters*. 257 citations.

- **Main goal:** Derive computationally efficient and interpretable parameterizations of ocean mesoscale eddies for coarse-resolution climate models.
- **Architecture:** Relevance vector machines (sparse Bayesian regression) for closed-form equation discovery with embedded conservation, compared with CNNs predicting subgrid eddy momentum forcing.
- **Data:** High-resolution idealized ocean model simulations, coarse-grained to provide subgrid forcing targets.
- **Main result:** All parameterizations improve coarse-resolution statistics in an idealized ocean model; the CNN is more stable and more skilful, while the RVM yields interpretable closed-form equations.
- **Open work:** Extending physics-aware interpretable closures to realistic ocean models and testing across regimes.
- **Issues:** Idealized configuration; RVM scheme less stable online; generalization to other resolutions and global ocean untested.
- *Basis: abstract*

### [Using Machine Learning to Analyze Physical Causes of Climate Change: A Case Study of U.S. Midwest Extreme Precipitation](https://doi.org/10.1029/2021gl093787)
Davenport et al. (2021), *Geophysical Research Letters*. 123 citations.

- **Main goal:** Uses ML to understand how circulation changes contribute to trends in US Midwest extreme precipitation.
- **Architecture:** CNN classifier of extreme-precipitation circulation patterns (EPCPs) from daily sea level pressure and 500 hPa geopotential height anomalies, with visualization methods for interpretation.
- **Data:** Daily reanalysis circulation fields and observed Midwest precipitation extremes over roughly four decades.
- **Main result:** The CNN identifies 91% of observed extremes. EPCPs have become more frequent over the past two decades, but trends over four decades are insignificant. Moisture transport and precipitation intensity during EPCPs have increased.
- **Open work:** Apply to climate model projections to reduce uncertainty about future changes in extremes.
- **Issues:** Short observational record for trends, a single region, and possible false positives from classification on daily maps.
- *Basis: assessment*

### [Viewing Forced Climate Patterns Through an AI Lens](https://doi.org/10.1029/2019gl084944)
Barnes et al. (2019), *Geophysical Research Letters*. 108 citations.

- **Main goal:** Extract forced climate change signals from internal variability and model uncertainty without explicit signal-noise separation.
- **Architecture:** Shallow artificial neural network trained to predict the year of a temperature or precipitation map, interpreted with layerwise relevance propagation to obtain indicator patterns.
- **Data:** Large multimodel climate simulations (CMIP-class) under historical and future scenarios, applied to observed surface temperature maps.
- **Main result:** The ANN identifies spatial indicator patterns of forced change and can date maps; forced patterns are detectable from the 1960s onward in simulated and observed temperature.
- **Open work:** Apply the approach to other variables and detection-attribution problems and to deeper diagnosis of model-observation differences.
- **Issues:** Indicator patterns are nonlinear mixtures of signal and noise and depend on the training ensemble; performance on observations relies on models capturing real forced patterns.
- *Basis: abstract+knowledge*

### [Investigating the fidelity of explainable artificial intelligence methods for applications of convolutional neural networks in geoscience](https://doi.org/10.1175/aies-d-22-0012.1)
Mamalakis et al. (2022), *Artificial Intelligence for the Earth Systems*. 106 citations.

- **Main goal:** Evaluate how faithfully popular explainable-AI methods explain CNN decisions in geoscience, to guide best practice.
- **Architecture:** Intercomparison of XAI attribution methods (e.g. gradient, SmoothGrad, input times gradient, integrated gradients, LRP variants, DeepSHAP) applied to CNNs.
- **Data:** An idealized synthetic attribution benchmark with known ground truth, and a CNN predicting the number of atmospheric rivers in climate-simulation snapshots.
- **Main result:** Reveals issues such as gradient shattering, inability to distinguish attribution sign and insensitivity to zero inputs that can distort interpretation of CNN strategies.
- **Open work:** Further study of XAI fidelity, better baselines, and benchmarks for other architectures and tasks.
- **Issues:** Limited to a subset of methods and CNNs; conclusions depend on the benchmark design.
- *Basis: abstract+knowledge*

### [Neural network attribution methods for problems in geoscience: A novel synthetic benchmark dataset](https://doi.org/10.1017/eds.2022.7)
Mamalakis et al. (2021), *Environmental Data Science*. 94 citations.

- **Main goal:** Enables objective evaluation of explainable AI (XAI) attribution methods for geoscience, where ground-truth attributions are usually unknown.
- **Architecture:** Framework that builds synthetic regression benchmarks from additively separable functions, giving a known ground-truth attribution. A fully connected network is trained, and XAI heatmaps (gradient-based, LRP variants and others) are compared with the ground truth.
- **Data:** Synthetic dataset with climate-like spatial inputs (for example SST-like anomaly fields) and outputs generated from known functions.
- **Main result:** Shows where specific XAI methods perform well or poorly against the known attribution, which makes XAI assessment less subjective.
- **Open work:** Extend benchmarks to non-additive functions, classification tasks and more complex architectures such as CNNs.
- **Issues:** Additive separability is a simplifying assumption, and real geophysical relations are often non-additive and interacting.
- *Basis: abstract+knowledge*

### [Indicator Patterns of Forced Change Learned by an Artificial Neural Network](https://doi.org/10.1029/2020ms002195)
Barnes et al. (2020), *Journal of Advances in Modeling Earth Systems*. 94 citations.

- **Main goal:** Identify reliable regional indicator patterns of forced climate change amid internal variability and model differences.
- **Architecture:** ANN trained to predict the year from annual-mean temperature or precipitation maps, visualized with layerwise relevance propagation and backward optimization; designed so indicators vary in time.
- **Data:** CMIP5 forced climate model simulations; observations used to compare with simulated patterns.
- **Main result:** Produces time-evolving indicator patterns of forced change, compared with signal-to-noise and multilinear regression; backward optimization highlights where model-observation disagreements matter most.
- **Open work:** Apply to other variables and use the indicators for model evaluation and detection.
- **Issues:** Patterns depend on the model ensemble and ANN design; LRP explanations can be method-dependent.
- *Basis: abstract+knowledge*

### [Creating and Evaluating Uncertainty Estimates with Neural Networks for Environmental-Science Applications](https://doi.org/10.1175/aies-d-22-0061.1)
Haynes et al. (2023), *Artificial Intelligence for the Earth Systems*. 70 citations.

- **Main goal:** Provide environmental scientists with practical methods to create and evaluate uncertainty estimates from neural networks.
- **Architecture:** Tutorial/review of six NN uncertainty-quantification approaches plus four evaluation graphics and eight scores for judging uncertainty quality; Jupyter notebooks provided.
- **Data:** Two demonstrations: vertical dewpoint profile estimation (regression) and convection prediction over Taiwan from Himawari-8 imagery (classification).
- **Main result:** Shows how the UQ methods and evaluation tools can be applied and compared on real regression and classification problems.
- **Open work:** Broader adoption and systematic comparison of UQ methods across environmental applications.
- **Issues:** Tutorial scope; method rankings are demonstration-specific and not a general benchmark.
- *Basis: assessment*

### [Observed Statistical Connections Overestimate the Causal Effects of Arctic Sea Ice Changes on Midlatitude Winter Climate](https://doi.org/10.1175/jcli-d-20-0293.1)
Blackport et al. (2021), *Journal of Climate*. 69 citations.

- **Main goal:** Quantifies how much Arctic sea ice variability causally affects midlatitude winter climate, separating cause from effect.
- **Architecture:** Non-ML study: regression analysis applied to observations and to large initial-condition ensembles of multiple climate models, in coupled and AMIP (prescribed sea ice/SST) configurations.
- **Data:** Observations and reanalysis plus large ensembles from several climate models, coupled and AMIP-style.
- **Main result:** Coupled models reproduce the observed sea ice and temperature links, but these are absent or much weaker in AMIP runs forced only by sea ice. Statistical links are inflated by circulation driving sea ice, so the causal effect is much weaker.
- **Open work:** Clarify whether models underestimate the true response, and refine estimates of the stratospheric pathway.
- **Issues:** Relies on models simulating the coupling correctly. Members span only 35 years, and internal variability makes individual estimates noisy.
- *Basis: abstract*

### [Evaluation, Tuning and Interpretation of Neural Networks for Meteorological Applications](https://doi.org/10.1175/bams-d-20-0097.1)
Ebert-Uphoff et al. (2020), *Bulletin of the American Meteorological Society*. 68 citations.

- **Main goal:** Provide practical guidance for evaluating, tuning and interpreting neural networks applied to meteorological imagery.
- **Architecture:** Tutorial and perspective covering receptive fields, meteorological performance measures, and interpretation via synthetic experiments and layerwise relevance propagation, for classification and image-to-image tasks.
- **Data:** Illustrated with examples such as satellite-to-radar translation (GOES to synthetic reflectivity).
- **Main result:** Frames interpretation as an iterative, meteorologist-driven discovery process with hypothesis testing; highlights underused strategies.
- **Open work:** Develop community best practices and interpretation tools for image-to-image networks.
- **Issues:** Guidance rather than systematic benchmarking; examples drawn from a limited set of applications.
- *Basis: abstract+knowledge*

### [Are AI weather models learning atmospheric physics? A sensitivity analysis of cyclone Xynthia](https://doi.org/10.1038/s41612-025-00949-6)
Baño-Medina et al. (2025), *npj Climate and Atmospheric Science*. 38 citations.

*Summary pending.*

### [Learning Closed‐Form Equations for Subgrid‐Scale Closures From High‐Fidelity Data: Promises and Challenges](https://doi.org/10.1029/2023ms003874)
Jakhar et al. (2023), *Journal of Advances in Modeling Earth Systems*. 29 citations.

- **Main goal:** Tests whether equation discovery can learn interpretable closed-form subgrid-scale closures from high-fidelity data, and why such closures fail online.
- **Architecture:** Sparse-regression equation discovery with expansive term libraries applied to filtered DNS fluxes.
- **Data:** Filtered direct numerical simulations of 2D turbulence and Rayleigh-Benard convection with Gaussian, box and other filters.
- **Main result:** Robustly recovers the nonlinear gradient model (leading Taylor-series term), with offline flux correlations above 0.95, but LES with these closures is unstable due to no inter-scale energy transfer (2D) and poor backscatter (RBC).
- **Open work:** Physics-informed libraries, loss functions and metrics to discover accurate, stable closures.
- **Issues:** Idealized flows; SGS 'truth' depends on filtering and is non-unique; offline accuracy does not guarantee online stability.
- *Basis: abstract*

### [Moving beyond post hoc explainable artificial intelligence: a perspective paper on lessons learned from dynamical climate modeling](https://doi.org/10.5194/gmd-18-787-2025)
O’Loughlin et al. (2025), *Geoscientific Model Development*. 19 citations.

*Summary pending.*

### [Towards mechanistic understanding in a data-driven weather model: internal activations reveal interpretable physical features](https://arxiv.org/abs/2512.24440)
MacMillan et al. (2025), *arXiv*. 18 citations.

*Summary pending.*

### [Learning Physically Interpretable Atmospheric Models From Data With WSINDy](https://doi.org/10.1029/2025jh000602)
Minor et al. (2024), *Journal of Geophysical Research*. 9 citations.

*Summary pending.*

<a id="ocean"></a>
## Ocean

### [Applications of Deep Learning to Ocean Data Inference and Subgrid Parameterization](https://doi.org/10.1029/2018ms001472)
Bolton et al. (2018), *Journal of Advances in Modeling Earth Systems*. 365 citations.

- **Main goal:** Uses ML to infer unresolved ocean processes: subgrid eddy momentum forcing for coarse models and subsurface flow from surface data.
- **Architecture:** Convolutional neural networks, optionally constrained to conserve global momentum.
- **Data:** Coarse-grained output from a high-resolution quasi-geostrophic ocean model (idealized double-gyre configuration).
- **Main result:** CNNs reproduce spatiotemporal variability of subgrid eddy forcing, generalize across dynamical regimes, work with 10-20% of the training data, and predict subsurface flow from surface fields.
- **Open work:** Implementing and testing the parameterization online in coarse-resolution ocean and climate models.
- **Issues:** Offline, idealized QG setting; online stability and realism in primitive-equation models untested.
- *Basis: abstract+knowledge*

### [A CFCC-LSTM Model for Sea Surface Temperature Prediction](https://doi.org/10.1109/lgrs.2017.2780843)
Yang et al. (2018), *IEEE Geoscience and Remote Sensing Letters*. 260 citations.

- **Main goal:** Predicts sea surface temperature by modelling both temporal evolution and spatial correlation of SST fields.
- **Architecture:** CFCC-LSTM: fully connected LSTM combined with a convolution layer to capture spatial and temporal information.
- **Data:** Satellite-based SST data over coastal seas of China (exact product not confirmed).
- **Main result:** The model outperforms comparison methods for short-range SST prediction. Specific errors not reported here.
- **Open work:** Longer lead times, larger domains and inclusion of atmospheric forcing.
- **Issues:** Purely data-driven regional model; limited lead times. Abstract unavailable.
- *Basis: assessment*

### [A neural network-based estimate of the seasonal to inter-annual variability of the Atlantic Ocean carbon sink](https://doi.org/10.5194/bg-10-7793-2013)
Landschützer et al. (2013), *Biogeosciences*. 243 citations.

- **Main goal:** Estimate the Atlantic Ocean CO2 sink and its seasonal to interannual variability from sparse surface pCO2 observations.
- **Architecture:** Two-step neural network approach: self-organizing map clustering into biogeochemical provinces followed by feed-forward networks per province to interpolate pCO2; fluxes from a gas-exchange parameterization.
- **Data:** SOCAT v1.5 surface ocean pCO2 observations, 1998-2007, with predictors such as SST, salinity, chlorophyll and mixed layer depth; independent check with time series and SOCAT v2.
- **Main result:** pCO2 RMSE about 10 uatm in fit and 22.8 uatm on independent data; decadal mean Atlantic uptake -0.45 +/- 0.15 Pg C/yr; strengthening South Atlantic sink (-0.14 Pg C/yr/decade) and small interannual variability (+/-0.04 Pg C/yr).
- **Open work:** Extension to the global ocean and longer periods (later SOM-FFN global products), and better constraints in data-poor regions.
- **Issues:** Sparse sampling in the tropics and South Atlantic; larger independent errors than fit errors; flux uncertainty from gas-exchange parameterization and winds.
- *Basis: abstract+knowledge*

### [A spatiotemporal deep learning model for sea surface temperature field prediction using time-series satellite data](https://doi.org/10.1016/j.envsoft.2019.104502)
Xiao et al. (2019), *Environmental Modelling & Software*. 236 citations.

- **Main goal:** Predict short- and mid-term daily SST fields while capturing spatial and temporal correlations.
- **Architecture:** ConvLSTM-based spatiotemporal deep learning model trained end-to-end.
- **Data:** 36 years of daily satellite-derived SST over a subarea of the East China Sea.
- **Main result:** Outperforms persistence, linear SVR and two LSTM baselines on multiple statistics.
- **Open work:** Larger domains, more predictors (e.g. atmospheric forcing) and longer lead times.
- **Issues:** Small regional domain; baselines are relatively weak and no comparison with dynamical ocean forecasts; data-only model lacks physical constraints.
- *Basis: abstract*

### [EddyNet: A Deep Neural Network For Pixel-Wise Classification of Oceanic Eddies](https://doi.org/10.1109/igarss.2018.8518411)
Lguensat et al. (2017), *IEEE International Geoscience and Remote Sensing Symposium*. 165 citations.

- **Main goal:** Automates detection and classification of ocean mesoscale eddies from altimetry.
- **Architecture:** EddyNet: convolutional encoder-decoder (U-Net-like) with pixel-wise classification into non-eddy, anticyclonic and cyclonic classes.
- **Data:** CMEMS sea surface height maps with labels from a conventional eddy detection algorithm.
- **Main result:** Produces pixel-wise eddy segmentation maps; code, data and weights are released. Quantitative accuracy not given in the abstract.
- **Open work:** Extending to 3D eddy structure, temporal tracking and other ocean variables.
- **Issues:** Labels come from a traditional detector, so the network inherits its definitions; limited to gridded altimetry resolution.
- *Basis: abstract*

### [Stochastic‐Deep Learning Parameterization of Ocean Momentum Forcing](https://doi.org/10.1029/2021ms002534)
Guillaumin et al. (2021), *Journal of Advances in Modeling Earth Systems*. 123 citations.

- **Main goal:** Develops a stochastic, data-driven parameterization of mesoscale ocean eddy momentum forcing for coarse climate models.
- **Architecture:** CNN predicting mean and standard deviation of a Gaussian distribution of subgrid momentum forcing from coarse surface velocities, trained with a negative log-likelihood loss.
- **Data:** Coarse-grained surface velocities from selected subdomains of the high-resolution CM2.6 coupled climate model; tests on global ocean and increased-CO2 climate.
- **Main result:** Offline, the parameterization generalizes to the global ocean and to higher CO2 without retraining; implemented in an idealized eddy-permitting shallow water model it is stable and improves some flow statistics.
- **Open work:** Implementation in full ocean general circulation models and multi-layer settings; better spatial/temporal correlation of the stochastic noise.
- **Issues:** Surface-only training data; online test only in an idealized shallow water model; Gaussian, spatially uncorrelated noise assumption.
- *Basis: abstract*

### [Deep learning for ocean remote sensing: an application of convolutional neural networks for super-resolution on satellite-derived SST data](https://doi.org/10.1109/prrs.2016.7867019)
Ducournau et al. (2016), *2016 9th IAPR Workshop on Pattern Recogniton in Remote Sensing (PRRS)*. 114 citations.

- **Main goal:** Improves the spatial resolution of satellite-derived sea surface temperature fields with deep learning.
- **Architecture:** Convolutional neural network for single-image super-resolution (SRCNN-type) applied to SST maps.
- **Data:** Satellite-derived SST products; low-resolution inputs generated by degrading higher-resolution fields (exact product not confirmed).
- **Main result:** The CNN reconstructs finer-scale SST structure better than standard interpolation baselines. Quantitative gains not reported here.
- **Open work:** Using multi-source inputs and handling real missing data (clouds) rather than synthetic degradation.
- **Issues:** Trained on synthetic degradation, which may not match real resolution differences; workshop-scale study. Abstract unavailable.
- *Basis: assessment*

### [Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model](https://doi.org/10.1029/2022ms003258)
Ross et al. (2022), *Journal of Advances in Modeling Earth Systems*. 93 citations.

- **Main goal:** Systematically benchmarks online performance and generalization of ML ocean subgrid parameterizations.
- **Architecture:** Framework comparing physical and NN-based parameterizations; also proposes equation discovery combining linear regression and genetic programming with spatial derivatives.
- **Data:** Idealized two-layer quasi-geostrophic model (pyqg) in eddy and jet configurations, with various filtering and coarse-graining operators.
- **Main result:** Filter/coarse-graining choice is critical; physics-constrained NNs are stable online but generalize poorly to new regimes; equation discovery matches NNs in-domain and generalizes better.
- **Open work:** Testing in more realistic ocean models and regimes; community use of released code and data for new parameterizations.
- **Issues:** Idealized QG setting; limited regimes; results may not carry over to primitive-equation models.
- *Basis: abstract+knowledge*

### [Forecasting the eddying ocean with a deep neural network](https://doi.org/10.1038/s41467-025-57389-2)
Cui et al. (2025), *Nature Communications*. 89 citations.

- **Main goal:** Develops an AI global ocean forecast system that resolves mesoscale eddies and outperforms numerical systems.
- **Architecture:** WenHai: deep neural network with bulk formulae for momentum, heat and freshwater fluxes embedded, and architecture choices preserving eddy variability.
- **Data:** Global eddy-resolving ocean reanalysis for training (GLORYS-type) and atmospheric forcing; evaluated against observations. Details not reported in the abstract.
- **Main result:** Outperforms a state-of-the-art eddy-resolving numerical GOFS and an AI GOFS for temperature and salinity profiles, SST, sea level anomaly and near-surface currents at 1-10 days.
- **Open work:** Coupling with data assimilation and atmospheric models, and extension to longer leads.
- **Issues:** Depends on reanalysis for training and initialization; forcing from atmospheric fields required; 10-day horizon limits assessment of long-term stability.
- *Basis: assessment*

### [XiHe: A Data-Driven Model for Global Ocean Eddy-Resolving Forecasting](https://arxiv.org/abs/2402.02995)
Wang et al. (2024), *arXiv*. 83 citations.

- **Main goal:** Builds a data-driven global eddy-resolving ocean forecasting system that matches or exceeds numerical operational systems.
- **Architecture:** XiHe: hierarchical transformer with a land-ocean mask mechanism and ocean-specific blocks capturing local information and global teleconnections.
- **Data:** 25 years of GLORYS12 daily reanalysis at 1/12° for training; evaluated with satellite and in situ observations and the IV-TT Class 4 framework for 2019-2020.
- **Main result:** Outperforms PSY4, GIOPS, BLUElinK and FOAM on all tested variables; 60-day current forecasts beat PSY4 at 10 days; 10-day forecast in 0.35 s.
- **Open work:** Coupling with data assimilation, more variables and depths, and longer-range forecasting.
- **Issues:** Initialized from reanalysis rather than real-time analysis; trained on GLORYS so inherits its biases; mesoscale eddy fidelity at long leads may smooth.
- *Basis: assessment*

### [Characteristics of Global Ocean Abnormal Mesoscale Eddies Derived From the Fusion of Sea Surface Height and Temperature Data by Deep Learning](https://doi.org/10.1029/2021gl094772)
Liu et al. (2021), *Geophysical Research Letters*. 74 citations.

- **Main goal:** Maps the global distribution of abnormal mesoscale eddies (warm cyclonic, cold anticyclonic) by combining SSH and SST observations.
- **Architecture:** Deep learning framework fusing satellite SSH and SST to detect and classify eddies; architecture details not given in the abstract.
- **Data:** Global satellite SSH and SST data, 1996-2015.
- **Main result:** Abnormal eddies are about one third of all eddies, active along equatorial and unstable currents; seasonal contrasts by hemisphere; daily counts of normal (abnormal) eddies change by +9.68 (-11.80) per year.
- **Open work:** Investigate mechanisms behind abnormal eddies and their trends, including subsurface structure.
- **Issues:** Depends on detection accuracy and SST signal quality; trends may be affected by changing satellite sampling.
- *Basis: assessment*

### [Improved Quantification of Ocean Carbon Uptake by Using Machine Learning to Merge Global Models and pCO2 Data](https://doi.org/10.1029/2021ms002620)
Gloege et al. (2021), *Journal of Advances in Modeling Earth Systems*. 66 citations.

- **Main goal:** Improve estimates of surface ocean pCO2 and air-sea CO2 flux by combining mechanistic biogeochemical models with sparse observations.
- **Architecture:** LDEO-HPD: XGBoost learns the model-data pCO2 misfit from observed predictors, then corrects global ocean biogeochemical model fields.
- **Data:** Global ocean biogeochemical model output and surface pCO2 observations (SOCAT-type data), 1982-2018; evaluated against independent pCO2 observations.
- **Main result:** Better agreement with independent pCO2 observations than other observation-based products; global uptake agrees with other products and the Global Carbon Budget 2020 within uncertainty.
- **Open work:** Reducing uncertainty in poorly sampled regions such as the Southern Ocean and extending the record.
- **Issues:** Correction relies on sparse observations, so data-poor regions and periods remain uncertain; inherits structural features of the underlying models.
- *Basis: assessment*

### [A Deep Learning Approach to Spatiotemporal Sea Surface Height Interpolation and Estimation of Deep Currents in Geostrophic Ocean Turbulence](https://doi.org/10.1029/2019ms001965)
Manucharyan et al. (2020), *Journal of Advances in Modeling Earth Systems*. 65 citations.

- **Main goal:** Reconstruct continuous sea surface height from sparse altimetry and infer unobserved deep ocean currents from SSH.
- **Architecture:** Convolutional neural networks with residual learning for spatiotemporal SSH interpolation and deep-current estimation.
- **Data:** Synthetic observations from an idealized two-layer quasigeostrophic model of baroclinic ocean turbulence.
- **Main result:** Residual CNNs outperform linear and dynamical interpolation for SSH reconstruction and provide skillful estimates of deep mesoscale currents, suggesting SSH eddy patterns carry information about the deep flow.
- **Open work:** Diversify training physics, use transfer learning and dynamically aware loss functions before applying to real satellite altimetry.
- **Issues:** Proof of concept on highly idealized QG physics only; transfer to real ocean with its additional processes and observation errors is untested.
- *Basis: abstract*

### [Developing a deep learning-based storm surge forecasting model](https://doi.org/10.1016/j.ocemod.2023.102179)
Xie et al. (2023), *Ocean Modelling*. 64 citations.

- **Main goal:** Develop a deep-learning model for storm surge forecasting as a fast alternative to numerical surge models.
- **Architecture:** Deep learning model (details not available from the abstract).
- **Data:** Not reported; likely tide-gauge observations and/or numerical model output with meteorological forcing.
- **Main result:** Abstract not available; presumably skillful surge prediction at lower cost.
- **Open work:** Generalization to other regions and extreme events.
- **Issues:** Summary inferred from title only; generalization to unprecedented storms is uncertain.
- *Basis: assessment*

### [Synthesizing Sea Surface Temperature and Satellite Altimetry Observations Using Deep Learning Improves the Accuracy and Resolution of Gridded Sea Surface Height Anomalies](https://doi.org/10.1029/2022ms003589)
Martin et al. (2023), *Journal of Advances in Modeling Earth Systems*. 57 citations.

- **Main goal:** Improves gridded SSH maps from sparse along-track altimetry, which optimal interpolation over-smooths in energetic regions.
- **Architecture:** Deep neural network that reconstructs 2D SSH by combining along-track altimetry with SST observations.
- **Data:** Satellite along-track altimetry and satellite SST in the Gulf Stream Extension region; evaluated against withheld altimeter observations and surface drifters.
- **Main result:** 17% lower RMSE than optimal interpolation and resolves spatial scales 30% smaller; geostrophic currents agree better with drifters and change estimates of eddy kinetic energy, vorticity, and strain.
- **Open work:** Producing a global SSH product with the method.
- **Issues:** Shown for one region; relies on SST-SSH relationships that weaken where SST gradients are weak or clouds block SST.
- *Basis: abstract*

### [Samudra: An AI Global Ocean Emulator for Climate](https://doi.org/10.1029/2024gl114318)
Dheeshjith et al. (2024), *Geophysical Research Letters*. 54 citations.

- **Main goal:** Builds an AI emulator for the ocean component of a climate model that is skillful and stable for long climate simulations.
- **Architecture:** Samudra: a modified ConvNeXt U-Net autoregressive emulator of full-depth ocean state.
- **Data:** Output of the GFDL OM4 ocean model at multiple depth levels: sea surface height, horizontal velocities, temperature and salinity.
- **Main result:** No drift relative to truth, reproduces depth structure and interannual variability, stable for centuries and about 150 times faster than OM4.
- **Open work:** Capturing the correct magnitude of forcing trends while remaining stable, and coupling with atmospheric emulators.
- **Issues:** Underestimates responses to forcing trends; emulates a single model so inherits its biases; atmospheric forcing is prescribed.
- *Basis: abstract+knowledge*

### [Unsupervised Learning Reveals Geography of Global Ocean Dynamical Regions](https://doi.org/10.1029/2018ea000519)
Sonnewald et al. (2019), *Earth and Space Science*. 54 citations.

- **Main goal:** Objectively identify dynamically similar regions of the global ocean, to understand which dynamical balances dominate where.
- **Architecture:** Unsupervised K-means clustering of the standardized terms of the barotropic vorticity equation.
- **Data:** 20-year mean of the ECCO (Estimating the Circulation and Climate of the Ocean) state estimate at 1° resolution.
- **Main result:** Finds five robust regimes: Cluster 1 (43% of ocean) with stress torques balanced by bottom pressure and nonlinear torques; Cluster 2 (24.8%) beta vs bottom pressure torque; Cluster 3 (14.6%) quasi-Sverdrupian; Cluster 4 (6.9%) baroclinic; Cluster 5 mainly Southern Ocean.
- **Open work:** Extend the analysis beyond the barotropic vorticity framework where residual nonlinear regions appear, and examine time-varying regimes or higher-resolution products.
- **Issues:** Uses a time mean at 1° resolution, so eddy-driven and transient dynamics are only partly represented; residual dominantly nonlinear regions (rough Southern Ocean topography, western boundaries) are poorly described; K-means requires choosing the number of clusters.
- *Basis: abstract*

### [A Deep Learning Network to Retrieve Ocean Hydrographic Profiles from Combined Satellite and In Situ Measurements](https://doi.org/10.3390/rs12193151)
Nardelli (2020), *Remote Sensing*. 54 citations.

- **Main goal:** Estimate 3-D ocean hydrographic structure by projecting satellite surface data to depth.
- **Architecture:** Stacked LSTM neural network with Monte Carlo dropout for uncertainty, trained on co-located in situ vertical profiles.
- **Data:** Satellite surface observations and in situ profiles over the North Atlantic, 2010-2018.
- **Main result:** Produces temperature and salinity profiles with uncertainties, outperforming simpler statistical methods and feed-forward networks.
- **Open work:** Extending to other basins and integrating with ocean reanalysis or assimilation systems.
- **Issues:** Regional application; depends on sparse in situ profiles; quantitative skill not reported in the abstract.
- *Basis: assessment*

### [AI-GOMS: Large AI-Driven Global Ocean Modeling System](https://arxiv.org/abs/2308.03152)
Xiong et al. (2023), *arXiv*. 53 citations.

- **Main goal:** Build an efficient AI-based global ocean model to overcome cost and instability bottlenecks of numerical ocean modelling.
- **Architecture:** Fourier-based Masked Autoencoder backbone for basic ocean variables, plus lightweight fine-tuned modules for regional downscaling, wave decoding and biochemistry coupling.
- **Data:** Global ocean data at 1/4 degree with 15 depth layers (likely reanalysis; not specified in abstract); regional downscaling to 1/12 degree in the Kuroshio.
- **Main result:** Best reported performance for 30-day global prediction of basic variables; simulates Kuroshio mesoscale eddies and tropical Pacific stratification.
- **Open work:** Extension to coupled Earth system modeling and longer lead times.
- **Issues:** Evaluation details and baselines are unclear from the abstract; preprint; physical consistency not established.
- *Basis: assessment*

### [Physical Knowledge-Enhanced Deep Neural Network for Sea Surface Temperature Prediction](https://doi.org/10.1109/tgrs.2023.3257039)
Meng et al. (2023), *IEEE Transactions on Geoscience and Remote Sensing*. 51 citations.

- **Main goal:** Improves SST prediction by transferring physical knowledge learned from historical observations into numerical model output.
- **Architecture:** Encoder combined with a generative adversarial network trained on observations; numerical model data are passed through it to create physics-enhanced fields used for SST prediction.
- **Data:** Historical SST observations and numerical model SST data; specific products and regions are not reported in the abstract.
- **Main result:** Reports considerably better SST prediction than several state-of-the-art baselines; numbers are not given in the abstract.
- **Open work:** Testing across regions and lead times and with other ocean variables.
- **Issues:** Unclear what physical knowledge the GAN actually transfers; dataset and evaluation details not given in the abstract; risk of overfitting to observation-era statistics.
- *Basis: assessment*

### [OceanNet: a principled neural operator-based digital twin for regional oceans](https://doi.org/10.1038/s41598-024-72145-0)
Chattopadhyay et al. (2023), *Scientific Reports*. 48 citations.

- **Main goal:** Builds a fast neural-operator emulator for regional sea surface height forecasting where ocean ML faces bathymetry, coastlines, and nonlinear flow.
- **Architecture:** OceanNet: Fourier neural operator with a predictor-evaluate-corrector time integration scheme and a spectral regularizer to limit autoregressive error growth and spectral bias.
- **Data:** Historical SSH data for the northwest Atlantic (Gulf Stream) and Gulf of Mexico (Loop Current eddies); compared with a dynamical ocean model forecast.
- **Main result:** Seasonal SSH forecast skill competitive with a state-of-the-art dynamical ocean model at about 500,000 times lower computational cost.
- **Open work:** Extending to 3D ocean state, more variables, and coupling with atmospheric forcing or data assimilation.
- **Issues:** Only SSH is emulated; regional and seasonal scope; no explicit uncertainty quantification.
- *Basis: abstract*

### [Generative Data‐Driven Approaches for Stochastic Subgrid Parameterizations in an Idealized Ocean Model](https://doi.org/10.1029/2023ms003681)
Perezhogin et al. (2023), *Journal of Advances in Modeling Earth Systems*. 47 citations.

- **Main goal:** Improves stochastic ocean mesoscale eddy parameterizations by relaxing the assumption that stochastic residuals are independent between grid points.
- **Architecture:** Generative ML models (GAN and VAE) that sample subgrid momentum forcing conditioned on the resolved flow, compared with the Guillaumin and Zanna (2021) mean-plus-variance CNN baseline.
- **Data:** High-resolution simulations of an idealized two-layer quasi-geostrophic ocean model (pyqg), filtered and coarse-grained to diagnose subgrid forcing; tested offline and online at several coarse resolutions.
- **Main result:** Generative models reproduce subgrid forcing and its uncertainty with spatially correlated noise; online they outperform the baseline ML model at the coarsest resolution.
- **Open work:** Extending generative stochastic closures to realistic, primitive-equation ocean models and to temporally correlated noise; reducing sampling cost.
- **Issues:** Idealized quasi-geostrophic setting only; the advantage appears mainly at the coarsest resolution; GAN training can be unstable.
- *Basis: abstract+knowledge*

### [Revealing the Impact of Global Heating on North Atlantic Circulation Using Transparent Machine Learning](https://doi.org/10.1029/2021ms002496)
Sonnewald et al. (2021), *Journal of Advances in Modeling Earth Systems*. 41 citations.

- **Main goal:** Identifies the physical mechanisms behind projected weakening of North Atlantic circulation under warming, using transparent ML to keep predictions physically tractable.
- **Architecture:** THOR: interpretable equation transform plus k-means to label dynamical regimes, then a multilayer perceptron explained with layerwise relevance propagation and theory.
- **Data:** Climate model output (CMIP6 abrupt 4xCO2 and 1% per year CO2 experiments) using only ocean depth, dynamic sea level and wind stress as inputs.
- **Main result:** Under abrupt CO2 quadrupling, weakening arises from shifted deep water formation regions, a northward Gulf Stream shift and an eastward North Atlantic Current shift; 1% CO2 runs show similar weaker patterns.
- **Open work:** Applying THOR across more climate models and to observations to test robustness of the identified regime shifts.
- **Issues:** Results rely on model simulations and a regime labeling built on a barotropic vorticity framework; regime shifts may be model-dependent.
- *Basis: abstract+knowledge*

### [Implementation and Evaluation of a Machine Learned Mesoscale Eddy Parameterization Into a Numerical Ocean Circulation Model](https://doi.org/10.1029/2023ms003697)
Zhang et al. (2023), *Journal of Advances in Modeling Earth Systems*. 35 citations.

- **Main goal:** Tests whether a CNN-based stochastic mesoscale eddy parameterization can be implemented and used like a conventional parameterization in an ocean GCM.
- **Architecture:** The Guillaumin and Zanna (2021) deep CNN predicting mean and variance of subgrid momentum forcing, implemented online in the MOM6 ocean model.
- **Data:** Parameterization trained on coarse-grained high-resolution CM2.6 data; evaluated online in idealized MOM6 configurations (e.g., double gyre and NeverWorld2) at several resolutions.
- **Main result:** The parameterization is stable without modification, injects energy and improves backscatter, and its effect diminishes as resolution increases; it needs depth-dependent tuning, is weaker near boundaries, and is prohibitively costly on CPUs.
- **Open work:** Retraining with boundaries and vertical structure, cheaper inference (e.g., GPUs or smaller networks), and testing in realistic climate configurations.
- **Issues:** Idealized configurations only; requires ad hoc tuning; high computational cost; generalization to a different model and regime is only partly successful.
- *Basis: abstract+knowledge*

### [Extended Reconstructed Sea Surface Temperature Version 6 (ERSSTv6): Part I. An Artificial Neural Network Approach](https://doi.org/10.1175/jcli-d-23-0707.1)
Huang et al. (2025), *Journal of Climate*. 33 citations.

*Summary pending.*

### [Data-driven global ocean modeling for seasonal to decadal prediction](https://doi.org/10.1126/sciadv.adu2488)
Guo et al. (2024), *Science Advances*. 32 citations.

*Summary pending.*

### [GLONET: Mercator's End‐to‐End Neural Global Ocean Forecasting System](https://doi.org/10.1029/2025jh000686)
Aouni et al. (2024), *Journal of Geophysical Research*. 25 citations.

*Summary pending.*

### [Ocean Wave Forecasting With Deep Learning as Alternative to Conventional Models](https://doi.org/10.1029/2025ms005285)
Zhang et al. (2024), *Journal of Advances in Modeling Earth Systems*. 16 citations.

*Summary pending.*

### [NeuralOM: Neural Ocean Model for Subseasonal-to-Seasonal Simulation](https://arxiv.org/abs/2505.21020)
Gao et al. (2025), *AAAI Conference on Artificial Intelligence*. 16 citations.

*Summary pending.*

### [Generalizable Neural‐Network Parameterization of Mesoscale Eddies in Idealized and Global Ocean Models](https://doi.org/10.1029/2025gl117046)
Perezhogin et al. (2025), *Geophysical Research Letters*. 14 citations.

*Summary pending.*

### [FuXi-Ocean: A Global Ocean Forecasting System with Sub-Daily Resolution](https://arxiv.org/abs/2506.03210)
Huang et al. (2025), *Neural Information Processing Systems*. 13 citations.

*Summary pending.*

### [Regional Modeling of Storm Surges Using Localized Features and Transfer Learning](https://doi.org/10.1029/2025jh000650)
Nagaraj et al. (2025), *Journal of Geophysical Research*. 12 citations.

*Summary pending.*

### [A Data‐Driven Approach for Parameterizing Ocean Submesoscale Buoyancy Fluxes](https://doi.org/10.1029/2025ms004991)
Bodner et al. (2023), *Journal of Advances in Modeling Earth Systems*. 10 citations.

*Summary pending.*

### [A Machine Learning‐Based Model Infers the Sea Surface Velocity of Surface Water and Ocean Topography (SWOT)](https://doi.org/10.1029/2024gl110731)
Zhou et al. (2025), *Geophysical Research Letters*. 8 citations.

*Summary pending.*

### [Online Learning in Idealized Ocean Gyres](https://doi.org/10.1029/2024ms004883)
Maddison (2024), *Journal of Advances in Modeling Earth Systems*. 8 citations.

*Summary pending.*

### [ORCAst: Operational High-Resolution Current Forecasts](https://arxiv.org/abs/2501.12054)
Garcia et al. (2025), *arXiv*. 7 citations.

*Summary pending.*

### [A deep learning global ocean forecasting model with sub-daily and eddy-resolving resolution](https://doi.org/10.1038/s41612-026-01444-2)
Niu et al. (2026), *npj Climate and Atmospheric Science*. 5 citations.

*Summary pending.*

### [Neural prediction of Lagrangian drift trajectories on the sea surface](https://doi.org/10.1175/aies-d-24-0052.1)
Botvynko et al. (2025), *Artificial Intelligence for the Earth Systems*. 5 citations.

*Summary pending.*

### [Data-driven global ocean model resolving atmospherically forced ocean dynamics](https://doi.org/10.1126/sciadv.aed1225)
Kim et al. (2025), *Science Advances*. 1 citations.

*Summary pending.*

<a id="seaice"></a>
## Sea ice

### [Seasonal Arctic sea ice forecasting with probabilistic deep learning](https://doi.org/10.1038/s41467-021-25257-4)
Andersson et al. (2021), *Nature Communications*. 267 citations.

- **Main goal:** Provide accurate seasonal forecasts of Arctic sea ice, where dynamical models struggle to beat statistical benchmarks beyond a few weeks.
- **Architecture:** IceNet: an ensemble of U-Net CNNs producing probabilistic (three-class) sea ice concentration forecasts for the next 6 months, with temperature-scaling calibration.
- **Data:** Pretrained on CMIP6 climate simulations, then fine-tuned on observational sea ice concentration (OSI-SAF) and ERA5 predictors; compared with ECMWF SEAS5.
- **Main result:** Outperforms the SEAS5 dynamical model for seasonal summer sea ice forecasts, especially for extreme ice events, extending the range of accurate forecasts.
- **Open work:** Daily or higher-resolution forecasts, operational deployment and use in conservation and risk tools.
- **Issues:** Monthly-mean ice edge-focused classification rather than full concentration; limited observational training period; ML trained partly on model simulations with their biases.
- *Basis: abstract+knowledge*

### [Prediction of Arctic Sea Ice Concentration Using a Fully Data Driven Deep Neural Network](https://doi.org/10.3390/rs9121305)
Chi et al. (2017), *Remote Sensing*. 141 citations.

- **Main goal:** Predicts Arctic sea ice concentration (SIC) purely from past observations, testing whether deep learning can match physical and statistical forecasts.
- **Architecture:** Fully data-driven deep neural network trained on historical SIC fields, with no physical inputs; compared with an autoregressive (AR) model.
- **Data:** Passive microwave satellite SIC record from 1978 onward; comparison with Sea Ice Prediction Network (SIPN) contributions.
- **Main result:** The deep learning predictions outperform the AR model and are comparable to the SIPN ensemble of diverse approaches.
- **Open work:** Adding physical predictors (atmosphere, ocean) and extending lead time and seasonal forecasting.
- **Issues:** Purely statistical with no physics; limited ability to anticipate anomalous years; quantitative skill details and lead times not reported in the abstract.
- *Basis: assessment*

### [Prediction of monthly Arctic sea ice concentrations using satellite and reanalysis data based on convolutional neural networks](https://doi.org/10.5194/tc-14-1083-2020)
Kim et al. (2019), *The Cryosphere*. 110 citations.

- **Main goal:** Provides 1-month-ahead Arctic sea ice concentration (SIC) prediction for applications like shipping and fisheries.
- **Architecture:** Convolutional neural network with eight predictors, compared to a random forest model and a trend-based persistence model.
- **Data:** Satellite passive microwave SIC and reanalysis meteorological and oceanographic variables; hindcast validation.
- **Main result:** CNN achieves MAE 2.28%, ACC 0.98, RMSE 5.76% versus RF RMSE 6.61% and persistence 10.54%; 2007 and 2012 extreme declines predicted with RMSE below 5%; past SIC is the most important predictor.
- **Open work:** Longer lead times and seasonal forecasting; better skill in the marginal ice zone.
- **Issues:** Only 1-month lead, where persistence-type information dominates; high ACC partly reflects the seasonal cycle; reanalysis inputs limit real-time use.
- *Basis: abstract*

### [Arctic sea ice cover data from spaceborne synthetic aperture radar by deep learning](https://doi.org/10.5194/essd-13-2723-2021)
Wang et al. (2021), *Earth System Science Data*. 69 citations.

- **Main goal:** Produce high-resolution Arctic sea ice cover data for navigation and research, beyond the km-scale resolution of radiometer and scatterometer products.
- **Architecture:** Modified U-Net classifiers combined in an integrated stacking ensemble to separate sea ice from open water in SAR imagery.
- **Data:** More than 28,000 Sentinel-1 EW HH/HV images from 2019; validation with visual interpretation, AMSR2 concentration and IMS ice cover.
- **Main result:** 400 m product with 96.10% overall accuracy on 96 visually interpreted cases, 5.55% mean absolute difference from AMSR2 and 93.98% agreement with IMS; more detail in the marginal ice zone.
- **Open work:** Extending the product to more years and to sea ice concentration or type rather than binary cover.
- **Issues:** Only one year; binary ice/water classification; validation sample of 96 cases is small; SAR ambiguities (wind-roughened water, melt) may cause errors.
- *Basis: assessment*

### [Deep Learning of Systematic Sea Ice Model Errors From Data Assimilation Increments](https://doi.org/10.1029/2023ms003757)
Gregory et al. (2023), *Journal of Advances in Modeling Earth Systems*. 36 citations.

- **Main goal:** Learns state-dependent systematic sea ice model errors from data assimilation increments as a basis for ML bias correction or parameterization.
- **Architecture:** Convolutional neural network mapping forecast states and tendencies to sea ice concentration analysis increments.
- **Data:** GFDL SPEAR ice-ocean DA system assimilating satellite sea ice concentration every 5 days, 1982-2017; inputs include SIC, SST, ice velocity, thickness, shortwave, skin temperature, salinity and land-sea mask.
- **Main result:** CNN predicts increments skillfully in both hemispheres and all seasons, consistently beating a climatological increment prediction.
- **Open work:** Implementing the CNN online in free-running SPEAR as a parameterization or bias correction and testing its effect on simulated sea ice.
- **Issues:** Offline only; increments mix model error with observation and DA errors; only concentration increments are learned.
- *Basis: abstract*

### [Data-driven surrogate modeling of high-resolution sea-ice thickness in the Arctic](https://doi.org/10.5194/tc-18-1791-2024)
Durand et al. (2024), *The Cryosphere*. 25 citations.

- **Main goal:** Builds a fast surrogate of the expensive neXtSIM elasto-brittle sea-ice model for Arctic sea-ice thickness.
- **Architecture:** U-Net with partial convolutions handling the land-sea mask, predicting thickness at 12 h lead and iterated autoregressively, with atmospheric forcing as input.
- **Data:** neXtSIM Arctic-wide simulations at about 10 km resolution plus atmospheric forcings.
- **Main result:** Beats persistence from 12 h to about 1 year with up to 50% lower error; gain over daily climatology extends beyond 6 months.
- **Open work:** Emulating additional sea-ice variables, reducing smoothing, and integrating with data assimilation or coupled systems.
- **Issues:** Iteration diffuses fine-scale structures (e.g. leads); trained on model output only, so inherits neXtSIM biases.
- *Basis: abstract*

### [SICNetseason V1.0: a transformer-based deep learning model for seasonal Arctic sea ice prediction by incorporating sea ice thickness data](https://doi.org/10.5194/gmd-18-2665-2025)
Ren et al. (2025), *Geoscientific Model Development*. 25 citations.

*Summary pending.*

### [Deep learning subgrid-scale parametrisations for short-term forecasting of sea-ice dynamics with a Maxwell elasto-brittle rheology](https://doi.org/10.5194/tc-17-2965-2023)
Finn et al. (2023), *The Cryosphere*. 19 citations.

- **Main goal:** Proof of concept for deep learning subgrid-scale parametrisation of sea-ice dynamics with brittle rheology.
- **Architecture:** U-Net correcting all model variables of a low-resolution sea-ice model toward high-resolution simulations, applied online every 10 minutes.
- **Data:** Twin experiments with a regional Maxwell elasto-brittle dynamics-only model in a 40 km x 200 km wind-forced domain.
- **Main result:** Reduces forecast errors by over 75% at about 10 minute lead; online hybrid improves forecasts up to an hour.
- **Open work:** Extending to realistic, longer (hourly to daily) forecasts and to models including thermodynamics.
- **Issues:** Idealized, small domain and dynamics-only model; improvements last only about an hour; long-term stability untested.
- *Basis: abstract*

### [Developing a deep learning forecasting system for short-term and high-resolution prediction of sea ice concentration](https://doi.org/10.5194/tc-19-4149-2025)
Kvanum et al. (2025), *The Cryosphere*. 13 citations.

*Summary pending.*

### [Seasonal forecasting of Pan-Arctic sea ice with state space model](https://doi.org/10.1038/s41612-025-01058-0)
Wang et al. (2025), *npj Climate and Atmospheric Science*. 13 citations.

*Summary pending.*

### [IceBench: A Benchmark for Deep Learning based Sea Ice Type Classification](https://arxiv.org/abs/2503.17877)
Taleghan et al. (2025), *arXiv*. 13 citations.

*Summary pending.*

### [Advancing global sea ice prediction capabilities using a fully coupled climate model with integrated machine learning](https://doi.org/10.1126/sciadv.ady8957)
Gregory et al. (2025), *Science Advances*. 11 citations.

*Summary pending.*

### [FloeNet: A Mass‐Conserving Global Sea Ice Emulator That Generalizes Across Climates](https://doi.org/10.1029/2026gl122981)
Gregory et al. (2026), *Geophysical Research Letters*. 7 citations.

*Summary pending.*

### [MET-AICE v1.0: an operational data-driven sea ice prediction system for the European Arctic](https://doi.org/10.5194/gmd-18-9751-2025)
Palerme et al. (2025), *Geoscientific Model Development*. 3 citations.

*Summary pending.*

### [Hybrid physics–data‐driven modeling for sea ice thermodynamics and transfer learning](https://doi.org/10.1002/qj.70200)
Cillis et al. (2026), *Quarterly Journal of the Royal Meteorological Society*. 2 citations.

*Summary pending.*

### [Machine Learning Eliminates Reanalysis Warm Bias and Reveals Weaker Winter Surface Cooling Over Arctic Sea Ice](https://doi.org/10.1029/2025gl121289)
Hossain et al. (2026), *Geophysical Research Letters*. 0 citations.

*Summary pending.*

<a id="chemistry"></a>
## Air quality & chemistry

### [An ensemble-based model of PM2.5 concentration across the contiguous United States with high spatiotemporal resolution.](https://doi.org/10.1016/j.envint.2019.104909)
Di et al. (2019), *Environment International*. 683 citations.

- **Main goal:** Produce high-resolution daily PM2.5 estimates across the contiguous US for health and epidemiology studies.
- **Architecture:** Ensemble of neural network, random forest and gradient boosting combined by a geographically weighted generalized additive model; separate model for uncertainty.
- **Data:** Satellite AOD, meteorology, land use, elevation, chemical transport model output, reanalyses and monitor PM2.5, 2000-2015.
- **Main result:** 10-fold cross-validated R2 of 0.86 for daily and 0.89 for annual PM2.5 at 1 km; good performance up to 60 ug/m3; downscaled to 100 m with uncertainty estimates.
- **Open work:** Explore other ensemble formats to merge estimates from different models or groups.
- **Issues:** Weaker performance at very high concentrations; cross-validation may overstate skill in monitor-sparse areas; 100 m downscaling relies only on land use.
- *Basis: abstract*

### [Improved 1 km resolution PM 2.5 estimates across China using enhanced space–time extremely randomized trees](https://doi.org/10.5194/acp-20-3273-2020)
Wei et al. (2020), *Atmospheric Chemistry and Physics*. 680 citations.

- **Main goal:** Produce high-quality, 1 km daily surface PM2.5 maps over China to support air-pollution monitoring at urban scale, where satellite and ground data alone are insufficient.
- **Architecture:** Enhanced space-time extremely randomized trees (STET), a tree ensemble augmented with spatiotemporal information and auxiliary predictors.
- **Data:** MODIS MAIAC 1 km AOD plus meteorological, topographic, land-use and emission data, with ground-station PM2.5 as targets; daily maps for 2018 over mainland China (ChinaHighPM2.5).
- **Main result:** Out-of-sample (out-of-station) cross-validation R2 of 0.89 (0.88), RMSE 10.33 (10.93) ug/m3, MAE 6.69 (7.15) ug/m3; outperforms most previous models and supports historical estimation (monthly R2 0.80).
- **Open work:** Extending the dataset to longer periods and other pollutants, and improving estimates where AOD retrievals are missing.
- **Issues:** Depends on AOD availability (cloud and snow gaps); only one year evaluated in detail; cross-validation at stations may overstate skill in sparsely monitored regions.
- *Basis: assessment*

### [Deep Air Quality Forecasting Using Hybrid Deep Learning Framework](https://doi.org/10.1109/tkde.2019.2954510)
Du et al. (2018), *IEEE Transactions on Knowledge and Data Engineering*. 441 citations.

- **Main goal:** Forecasts urban air quality (mainly PM2.5) from multivariate time series to support pollution early warning.
- **Architecture:** Hybrid deep model combining 1D CNNs for local trend and spatial features with bidirectional LSTMs for temporal dependencies.
- **Data:** Two real-world air quality datasets of pollutant and meteorological time series (Beijing-related data likely; not confirmed).
- **Main result:** The model forecasts PM2.5 with good accuracy and outperforms baseline methods. Numbers not given in the abstract.
- **Open work:** Longer forecast horizons, integration of meteorological forecasts and emissions.
- **Issues:** Station time-series focus without explicit chemistry or transport; limited datasets.
- *Basis: assessment*

### [Random forest meteorological normalisation models for Swiss PM 10 trend analysis](https://doi.org/10.5194/acp-18-6223-2018)
Grange et al. (2018), *Atmospheric Chemistry and Physics*. 422 citations.

- **Main goal:** Remove the influence of meteorological variability on air-quality time series so that PM10 trends reflect emission and chemistry changes.
- **Architecture:** Random forest regression of daily PM10 on meteorological, synoptic, boundary-layer-height and time variables; normalised trends tested with the Theil-Sen estimator; partial dependence plots for interpretation.
- **Data:** Daily PM10 at 31 Swiss monitoring sites, 1997-2016, with surface meteorology, synoptic classes and boundary layer height.
- **Main result:** Significant normalised PM10 decreases between -0.09 and -1.16 ug/m3/yr, largest at urban traffic sites (mean -0.77 ug/m3/yr); two high-PM10 regimes identified: poor dispersion and photochemical secondary production.
- **Open work:** Application to other pollutants and regions, and quantification of uncertainty in normalised trends.
- **Issues:** Normalisation assumes the RF captures all meteorological effects; covariate shift over decades and correlated predictors can bias trends; single-country scope.
- *Basis: assessment*

### [Application of random forest regression to the calculation of gas-phase chemistry within the GEOS-Chem chemistry model v10](https://doi.org/10.5194/gmd-12-1209-2019)
Keller et al. (2018), *Geoscientific Model Development*. 125 citations.

- **Main goal:** Tests replacing the costly gas-phase chemistry integrator of an atmospheric chemistry transport model with a machine-learning surrogate.
- **Architecture:** Random forest regression per transported species, predicting post-integrator concentration (change for long-lived, absolute for short-lived species), with chemical families (NOx).
- **Data:** One month (July 2013) of GEOS-Chem v10 output of chemical and physical state.
- **Main result:** Online ozone errors grow slowly: after 5 days NMB 4.2%, RMSE 35%, R2 0.9; after 30 days 13%, 67%, 0.75. Polluted regions are within 10%, but some species (inorganic bromine, short-lived nitrogen) have very large errors.
- **Open work:** Optimizing speed and implementation, improving error accumulation in remote regions, and operational air quality applications.
- **Issues:** Proof-of-concept is 1.8x slower than the numerical integrator; one month of training data; errors accumulate in remote areas and for several species; no mass conservation guarantees.
- *Basis: abstract*

### [A review of machine learning for modeling air quality: Overlooked but important issues](https://doi.org/10.1016/j.atmosres.2024.107261)
Tang et al. (2024), *Atmospheric research*. 125 citations.

- **Main goal:** Reviews ML for air quality modeling with a focus on issues the literature tends to overlook.
- **Architecture:** Review article; abstract unavailable, so scope is inferred from the title.
- **Data:** Not applicable; based on published air quality ML studies.
- **Main result:** Not reported (no abstract available).
- **Open work:** Likely concerns validation practice, generalization, and interpretability; check the full text.
- **Issues:** Card is based on the title only.
- *Basis: assessment*

### [A machine learning approach to quantify meteorological drivers of ozone pollution in China from 2015 to 2019](https://doi.org/10.5194/acp-22-8385-2022)
Weng et al. (2022), *Atmospheric Chemistry and Physics*. 111 citations.

- **Main goal:** Quantifies the meteorological contribution to surface ozone increases in China during 2015–2019.
- **Architecture:** Random forest regression and ridge regression (with local and nonlocal meteorological predictors), compared with multiple linear and stepwise regression.
- **Data:** Surface ozone observations across China, April–October 2015–2019, with meteorological predictor variables (reanalysis).
- **Main result:** RFR achieves R2 0.5–0.6 versus 0.4–0.5 for linear methods; nonlocal predictors raise RR R2 in southern China from 0.47 to 0.6; hot, dry, sunny conditions and surface solar radiation dominate; nearly half of 2015–2019 ozone trends may be meteorology-driven.
- **Open work:** Applying the framework under climate change and extremes (heatwaves) and separating emission versus meteorology effects more robustly.
- **Issues:** Statistical attribution with modest R2; meteorology and emissions may covary; short five-year record.
- *Basis: abstract*

### [Toward Stable, General Machine‐Learned Models of the Atmospheric Chemical System](https://doi.org/10.1029/2020jd032759)
Kelp et al. (2020), *Journal of Geophysical Research: Atmospheres*. 67 citations.

- **Main goal:** Build fast ML emulators of atmospheric chemistry solvers that remain stable over long simulations.
- **Architecture:** Neural network solver with recurrent training to limit error accumulation, plus reversible compression of chemical species (more than 80% reduction); random initial conditions for generality.
- **Data:** Simulations from a reference atmospheric chemical mechanism solver, initialized with random conditions.
- **Main result:** About 260x speedup (about 1,900x on specialized hardware); stable beyond one week; 24 h ozone median error 2.7 ppb and below 19 ppb in 99% of cases; PM median error 16 ug/m3.
- **Open work:** Further improvements before the ML models can replace traditional chemistry solvers, including handling extreme concentration fluctuations and coupling to 3-D models.
- **Issues:** Errors much larger in the remaining 1% of cases with extreme fluctuations; box-model setting; not yet a replacement for the reference solver.
- *Basis: abstract*

### [Statistical and machine learning methods for evaluating trends in air quality under changing meteorological conditions](https://doi.org/10.5194/acp-22-10551-2022)
Qiu et al. (2022), *Atmospheric Chemistry and Physics*. 57 citations.

- **Main goal:** Assess how well statistical methods remove meteorological variability when estimating emission-driven air quality trends.
- **Architecture:** Multiple linear regression and other methods, including random forest with local and regional meteorological features, tested against a chemical transport model ground truth; a GEOS-Chem-based correction method.
- **Data:** GEOS-Chem simulations as synthetic data for PM2.5 and O3 in the US (2011-2017) and China (2013-2017), including constant-meteorology and constant-emission runs.
- **Main result:** Common regression methods correct poorly; random forest reduces trend estimation error by 30-42%; emission and meteorological influences are partly inseparable.
- **Open work:** Recommendations for applying statistical approaches in policy evaluations with real observations.
- **Issues:** Evaluation relies on a model world, so results depend on GEOS-Chem fidelity; interaction effects limit any purely statistical separation.
- *Basis: abstract*

### [Improving 3-day deterministic air pollution forecasts using machine learning algorithms](https://doi.org/10.5194/acp-24-807-2024)
Zhang et al. (2024), *Atmospheric Chemistry and Physics*. 53 citations.

- **Main goal:** Improve 1-3 day deterministic air pollution forecasts used for public health communication.
- **Architecture:** Random forest, XGBoost and LSTM post-processing of deterministic forecasts, with four feature-importance methods including SHAP.
- **Data:** Deterministic dispersion and CAMS forecasts plus measurements of PM10, NOx and O3 at sites in Greater Stockholm, Sweden.
- **Main result:** ML improves forecasts for all sites and pollutants; NOx MSE at street canyons drops by up to 60%; gains depend more on pollutant and site than algorithm; tree models now used operationally.
- **Open work:** Better prediction of short high-concentration peaks and generic models using spatial as well as temporal variation.
- **Issues:** Struggles with peaks at street canyon sites; site-specific training; limited generalization for PM10 except with LSTM.
- *Basis: abstract*

### [Physics-informed learning of aerosol microphysics](https://doi.org/10.1017/eds.2022.22)
Harder et al. (2022), *Environmental Data Science*. 31 citations.

- **Main goal:** Emulate expensive aerosol microphysics in a global aerosol-climate model to reduce cost while keeping accuracy.
- **Architecture:** Neural network emulating M7 microphysics tendencies, with physics-informed variants that reduce mass violation and enforce positivity.
- **Data:** Input-output pairs generated by the M7 microphysics module of ECHAM-HAM.
- **Main result:** Average R^2 of 77.1% on tendencies, and up to over 64x speed-up on a GPU relative to the original model.
- **Open work:** Online coupling into ECHAM-HAM and assessing long-term stability.
- **Issues:** Offline evaluation only; moderate R^2 for some variables; mass conservation only partially enforced.
- *Basis: abstract*

### [Advancing operational global aerosol forecasting with machine learning](https://doi.org/10.1038/s41586-026-10234-y)
Gui et al. (2026), *Nature*. 17 citations.

*Summary pending.*

### [Enabling fast greenhouse gas emissions inference from satellites with GATES: a Graph-Neural-Network Atmospheric Transport Emulation System](https://doi.org/10.5194/gmd-19-1893-2026)
Fillola et al. (2026), *Geoscientific Model Development*. 10 citations.

*Summary pending.*

### [Advancing Sophisticated Photochemistry Simulation in Atmospheric Numerical Models With Artificial Intelligence PhotoChemistry (AIPC) Scheme Using the Feature‐Mapping Subspace Self‐Attention Algorithm](https://doi.org/10.1029/2024ms004646)
Xia et al. (2025), *Journal of Advances in Modeling Earth Systems*. 6 citations.

*Summary pending.*

### [mloz: A Highly Efficient Machine Learning‐Based Ozone Parameterization for Climate Sensitivity Simulations](https://doi.org/10.1029/2025ms005459)
Ma et al. (2025), *Journal of Advances in Modeling Earth Systems*. 4 citations.

*Summary pending.*

### [Zeeman: A Deep Learning Framework for Regional Atmospheric Chemistry Forecasting](https://doi.org/10.1029/2025gl117459)
Pang et al. (2026), *Geophysical Research Letters*. 4 citations.

*Summary pending.*

### [A deep learning model for predicting daily PM2.5 concentration in response to emission reduction](https://doi.org/10.1126/sciadv.aef5759)
Liu et al. (2026), *Science Advances*. 2 citations.

*Summary pending.*

### [Deep Learning Ensemble Emulation for NASA’s Goddard Earth Observing System (GEOS) Composition Forecast](https://doi.org/10.1175/aies-d-24-0117.1)
Sleeman et al. (2025), *Artificial Intelligence for the Earth Systems*. 1 citations.

*Summary pending.*

### [A chemistry-informed deep learning network for mitigating the stratospheric OH data gap](https://doi.org/10.1126/sciadv.aee2319)
Yin et al. (2026), *Science Advances*. 0 citations.

*Summary pending.*

<a id="benchmarks"></a>
## Benchmarks & datasets

### [The ERA5 global reanalysis](https://doi.org/10.1002/qj.3803)
Hersbach et al. (2020), *Quarterly Journal of the Royal Meteorological Society*. 26,664 citations.

- **Main goal:** Documents ERA5, ECMWF's fifth-generation global reanalysis replacing ERA-Interim.
- **Architecture:** Non-ML: 4D-Var data assimilation with IFS Cy41r2 at about 31 km, hourly output, plus a 10-member ensemble (3-hourly, half resolution) for uncertainty.
- **Data:** Global observations from 1950 onwards (paper focuses on 1979 onwards); atmosphere, land surface and ocean waves.
- **Main result:** Re-forecasts gain up to one day of skill over ERA-Interim; better tropospheric fit to radiosondes and much better wave heights; correlation with GPCP monthly precipitation rises from 67% to 77%.
- **Open work:** Complete the back extension to 1950 and address stratospheric and other known biases.
- **Issues:** No improvement in stratospheric fit; ensemble spread reflects observing-system changes. As the main training set for ML weather models, its biases propagate into them.
- *Basis: abstract+knowledge*

### [WeatherBench: A Benchmark Data Set for Data‐Driven Weather Forecasting](https://doi.org/10.1029/2020ms002203)
Rasp et al. (2020), *Journal of Advances in Modeling Earth Systems*. 797 citations.

- **Main goal:** Provides a common benchmark for data-driven medium-range (3-5 day) global weather forecasting to enable fair comparisons.
- **Architecture:** Benchmark dataset with evaluation metrics (latitude-weighted RMSE, mainly Z500 and T850) and baselines: persistence, climatology, linear regression, CNNs, and IFS physical models at coarse resolutions.
- **Data:** ERA5 regridded to 5.625, 2.8125 and 1.40625 degrees, 1979-2018, with 2017-2018 as test years.
- **Main result:** Simple deep learning baselines trail operational IFS by a wide margin, establishing a reference point for later models.
- **Open work:** Higher-resolution, probabilistic evaluation and more variables (later addressed by WeatherBench 2).
- **Issues:** Coarse resolution and few headline variables; deterministic RMSE favours smooth forecasts.
- *Basis: abstract+knowledge*

### [WeatherBench 2: A Benchmark for the Next Generation of Data‐Driven Global Weather Models](https://doi.org/10.1029/2023ms004019)
Rasp et al. (2023), *Journal of Advances in Modeling Earth Systems*. 469 citations.

- **Main goal:** Provides a common, updated benchmark to compare data-driven and physical global medium-range weather models fairly.
- **Architecture:** Benchmark: open-source evaluation framework, public training, ground-truth and baseline data, headline scores, and a continuously updated website.
- **Data:** ERA5 and operational analyses as ground truth; forecasts from IFS HRES and ENS and ML models such as Pangu-Weather, GraphCast, and others, mainly for 2020.
- **Main result:** Defines headline scores following operational practice and presents results for state-of-the-art physical and ML models.
- **Open work:** Better probabilistic and extreme-event evaluation, observation-based verification, and handling of caveats such as differing initial conditions.
- **Issues:** Verification against reanalysis or each model's own analysis can bias comparisons; standard metrics reward smooth forecasts.
- *Basis: abstract+knowledge*

### SEVIR : A Storm Event Imagery Dataset for Deep Learning Applications in Radar and Satellite Meteorology
Veillette et al. (2020), *Neural Information Processing Systems*. 230 citations.

- **Main goal:** Provides a curated, co-registered dataset of storm events to support deep learning in radar and satellite meteorology.
- **Architecture:** Benchmark dataset (SEVIR) with baseline deep learning models for tasks such as nowcasting and synthetic weather radar generation from satellite.
- **Data:** More than 10,000 events, each 4 hours at 5-minute steps over 384 km x 384 km patches across the US, with GOES-16 visible and infrared channels, NEXRAD vertically integrated liquid, and GLM lightning.
- **Main result:** Supplies standardized data and baseline results (e.g., U-Net style models) that became a widely used nowcasting benchmark.
- **Open work:** Benchmark more advanced generative and probabilistic nowcasting models and expand coverage beyond the US.
- **Issues:** US-only, event-centred sampling biases toward storms; abstract unavailable here, so details are from knowledge of the paper.
- *Basis: abstract+knowledge*

### [ClimateBench v1.0: A Benchmark for Data‐Driven Climate Projections](https://doi.org/10.1029/2021ms002954)
Watson-Parris et al. (2022), *Journal of Advances in Modeling Earth Systems*. 112 citations.

- **Main goal:** Provides a benchmark for ML emulators of climate model responses to emissions, so scenario space can be explored cheaply beyond pattern scaling.
- **Architecture:** Benchmark framework with baseline emulators (Gaussian process, random forest, neural network models) that map emissions and concentrations of CO2, CH4 and aerosols to climate fields.
- **Data:** NorESM2 simulations from ScenarioMIP, AerChemMIP and DAMIP. Targets are annual mean temperature, diurnal temperature range, precipitation and extreme precipitation.
- **Main result:** Baseline emulators predict global annual-mean fields for unseen scenarios with reasonable skill. Temperature is emulated much better than precipitation.
- **Open work:** Include physical constraints such as energy conservation directly in emulators, and use emulators for detection and attribution.
- **Issues:** Based on a single ESM, so the benchmark reflects its biases. Annual means only; held-out test scenario is limited.
- *Basis: abstract+knowledge*

### [EarthNet2021: A large-scale dataset and challenge for Earth surface forecasting as a guided video prediction task](https://doi.org/10.1109/cvprw53098.2021.00124)
Requena-Mesa et al. (2021), *2021 IEEE/CVF Conference on Computer Vision and Pattern Recognition Workshops (CVPRW)*. 82 citations.

- **Main goal:** Frames Earth surface forecasting as guided video prediction: predicting future satellite imagery conditioned on future weather, to capture localized impacts of extreme weather.
- **Architecture:** Dataset and challenge for model intercomparison rather than a single model. Baselines include persistence and video prediction networks.
- **Data:** Sentinel-2 imagery at 20 m, matched topography and mesoscale (1.28 km) E-OBS-style meteorological variables over Europe, packaged into about 32,000 samples.
- **Main result:** Releases a large ML-ready dataset with evaluation tracks (including out-of-distribution and seasonal tests), aiming at more than 50x finer resolution than numerical models.
- **Open work:** Develop models that exploit the weather conditioning, and link the forecasts to impacts such as crop yield, forest health and biodiversity.
- **Issues:** Cloud contamination and gaps in optical imagery. The meteorological guidance comes from observations or reanalysis rather than real forecasts, so operational skill is untested.
- *Basis: abstract+knowledge*

### [ChaosBench: A Multi-Channel, Physics-Based Benchmark for Subseasonal-to-Seasonal Climate Prediction](https://arxiv.org/abs/2402.00712)
Nathaniel et al. (2024), *Neural Information Processing Systems*. 61 citations.

- **Main goal:** Provide a benchmark for extending data-driven weather emulators to subseasonal-to-seasonal (S2S) timescales.
- **Architecture:** ChaosBench: multi-channel benchmark with deterministic, probabilistic and physics-based metrics, and operational physics-based baselines; evaluates ViT/ClimaX, Pangu-Weather, GraphCast and FourCastNetV2.
- **Data:** ERA5 atmosphere plus ocean, sea-ice and land reanalyses spanning over 45 years; S2S forecasts from four national weather agencies as baselines.
- **Main result:** Weather-scale ML models collapse to unskilled climatology at S2S leads; ensembles, error-propagation control and physics-informed models extend predictability somewhat.
- **Open work:** Developing coupled Earth-system emulators and probabilistic methods that retain skill at S2S leads.
- **Issues:** Benchmark findings depend on chosen metrics and baselines; ML models evaluated largely as designed for weather scales rather than retrained for S2S.
- *Basis: assessment*

### [ClimateSet: A Large-Scale Climate Model Dataset for Machine Learning](https://arxiv.org/abs/2311.03721)
Kaltenborn et al. (2023), *Neural Information Processing Systems*. 47 citations.

- **Main goal:** Provides a large, consistent, ML-ready multi-model climate dataset, since most ML emulation, downscaling and prediction work relies on output from a single climate model.
- **Architecture:** Dataset and modular retrieval/preprocessing pipeline; benchmarks several ML emulators (forcing-to-climate mapping) and a multi-model 'super emulator'.
- **Data:** Forcing inputs from Input4MIPs and outputs of 36 CMIP6 climate models across scenarios; pipeline can add further models and scenarios.
- **Main result:** Emulator benchmarks show that ML model performance and generalization vary substantially across climate models; training on several models at once is feasible.
- **Open work:** Extending to more variables, models and tasks (downscaling, prediction) and assessing whether super emulators generalize to unseen scenarios and models.
- **Issues:** Benchmarks are emulation of model output, so they inherit CMIP6 biases; coarse resolution and limited scenario set constrain conclusions about generalization.
- *Basis: assessment*

### [The EUPPBench postprocessing benchmark dataset v1.0](https://doi.org/10.5194/essd-15-2635-2023)
Demaeyer et al. (2023), *Earth System Science Data*. 43 citations.

- **Main goal:** Provides a common benchmark dataset so that statistical postprocessing methods for medium-range forecasts can be compared fairly for operational choices.
- **Architecture:** Benchmark dataset of time-aligned forecasts and observations with proposed evaluation methods; first benchmark compares several postprocessing methods for 2 m temperature.
- **Data:** ECMWF ensemble forecasts and reforecasts paired with station observations and gridded data over a central European domain (EUMETNET), distributed via climetlab and Zenodo.
- **Main result:** Releases the public EUPPBench v1.0 dataset with download examples, evaluation protocol and a first intercomparison of 2 m temperature correction methods.
- **Open work:** Extending to more variables (wind, precipitation), longer periods and larger domains, and broader method intercomparisons.
- **Issues:** Version 1 focuses on 2 m temperature and a limited region, so conclusions may not transfer to other variables or climates.
- *Basis: abstract+knowledge*

### [Digital Typhoon: Long-term Satellite Image Dataset for the Spatio-Temporal Modeling of Tropical Cyclones](https://arxiv.org/abs/2311.02665)
Kitamoto et al. (2023), *Neural Information Processing Systems*. 39 citations.

- **Main goal:** Supplies a long-term, homogeneous satellite image dataset of tropical cyclones for benchmarking spatio-temporal ML models.
- **Architecture:** Dataset with a processing workflow (typhoon-centered infrared crops in Lambert azimuthal equal-area projection, inter-satellite calibration) and benchmark tasks for analysis, forecasting and reanalysis of intensity.
- **Data:** Over 40 years of geostationary infrared imagery of western North Pacific typhoons, aligned with best track data.
- **Main result:** Benchmarks show the intensity tasks remain challenging for recent deep learning models, with performance sensitive to many design choices.
- **Open work:** Developing models for track and intensity forecasting, societal impact and climate change tasks using the dataset.
- **Issues:** Single infrared channel and western Pacific basin only; best track labels contain agency-dependent uncertainties.
- *Basis: abstract+knowledge*

### [SubseasonalClimateUSA: A Dataset for Subseasonal Forecasting and Benchmarking](https://doi.org/10.52202/075280-0349)
Mouatadid et al. (2021), *Neural Information Processing Systems*. 34 citations.

- **Main goal:** Streamlines data curation for subseasonal (2-6 week) forecasting in the US, where dynamical models have limited skill.
- **Architecture:** Curated dataset and benchmark comparing operational dynamical models, classical baselines and ten ML/deep learning methods.
- **Data:** Multi-source US subseasonal data (temperature, precipitation, climate indices and dynamical forecasts) at regular grid, accessible via a Python package.
- **Main result:** Benchmarks suggest simple, effective ways (e.g. learned corrections and ensembling) to improve on operational models.
- **Open work:** Regular updates, expansion to more targets and regions, and testing new deep learning methods on the benchmark.
- **Issues:** US-only domain; subseasonal skill is low overall so differences between methods may be small and period-dependent.
- *Basis: assessment*

### [RainBench: Towards Data-Driven Global Precipitation Forecasting from Satellite Imagery](https://doi.org/10.1609/aaai.v35i17.17749)
Witt et al. (2021), *Proceedings of the AAAI Conference on Artificial Intelligence*. 26 citations.

- **Main goal:** Provides a benchmark dataset for data-driven global precipitation forecasting, aimed at extreme precipitation in the developing world.
- **Architecture:** Multimodal benchmark dataset plus PyRain, a data-processing library, with baseline neural network models for medium-range precipitation forecasting.
- **Data:** Simulated satellite data (SimSat), selected ERA5 reanalysis variables and IMERG precipitation.
- **Main result:** Releases the dataset and library and reports baseline results for two medium-range forecasting tasks; the abstract does not give quantitative skill.
- **Open work:** Use real satellite observations and probabilistic models, and improve skill for extremes.
- **Issues:** Uses simulated rather than real satellite imagery. Baselines are coarse, and skill relative to NWP is not established in the abstract.
- *Basis: assessment*

### [ENS-10: A Dataset For Post-Processing Ensemble Weather Forecast](https://arxiv.org/abs/2206.14786)
Ashkboos et al. (2022), *Neural Information Processing Systems*. 25 citations.

- **Main goal:** Provides a dataset for ML post-processing of ensemble weather forecasts, which otherwise requires costly simulations to obtain.
- **Architecture:** Dataset and benchmark task (48 h prediction correction) with baseline post-processing models, including extreme event evaluation.
- **Data:** Ten ECMWF ensemble members (reforecasts), 1998-2017, 11 pressure levels plus surface at 0.5 degree, lead times 0, 24, 48 h, twice weekly.
- **Main result:** Baselines improve 48 h forecasts of three key variables and are evaluated for extreme events.
- **Open work:** More members, lead times and variables, and stronger architectures for ensemble post-processing.
- **Issues:** Only 10 members and twice-weekly initializations; limited lead times; targets are ERA5 rather than observations.
- *Basis: assessment*

### [Probabilistic measures afford fair comparisons of AIWP and NWP model output](https://doi.org/10.1175/aies-d-25-0054.1)
Gneiting et al. (2025), *Artificial Intelligence for the Earth Systems*. 14 citations.

*Summary pending.*

### [A Benchmark Dataset for Tornado Detection and Prediction using Full-Resolution Polarimetric Weather Radar Data](https://arxiv.org/abs/2401.16437)
Veillette et al. (2024), *arXiv*. 14 citations.

*Summary pending.*

### [Extreme Weather Bench: A framework and benchmark for evaluation of high-impact weather](https://arxiv.org/abs/2605.01126)
McGovern et al. (2026), *arXiv*. 7 citations.

*Summary pending.*

### [Can AI Weather Models Predict Beyond Two Weeks? A Quantitative Benchmark and Analysis of Long Rollouts](https://arxiv.org/abs/2605.30184)
Lehmann et al. (2026), *arXiv*. 7 citations.

*Summary pending.*

### [PhysMetrics.Weather: An Evaluation Framework for Physical Consistency in ML Weather Models](https://arxiv.org/abs/2606.10642)
Kasteleyn et al. (2026), *arXiv*. 6 citations.

*Summary pending.*

### [WP-MIP: An Artificial Intelligence, Hybrid, and Physically Based Model Intercomparison Project for Weather Prediction](https://doi.org/10.1175/bams-d-26-0012.1)
McTaggart-Cowan et al. (2026), *Bulletin of The American Meteorological Society - (BAMS)*. 4 citations.

*Summary pending.*

### [CORDEX-ML-Bench: A Benchmark for Data-Driven Regional Climate Downscaling -Experiment Design and Overview](https://arxiv.org/abs/2606.29172)
Rampal et al. (2026), *arXiv*. 4 citations.

*Summary pending.*

### [NNJA—a curated archive of Earth system observations from 1970s to present for reanalysis and data-driven model development](https://doi.org/10.1175/bams-d-25-0157.1)
Frolov et al. (2026), *Bulletin of The American Meteorological Society - (BAMS)*. 0 citations.

*Summary pending.*

<a id="methods"></a>
## Core ML methods

### [Physics-informed neural networks: A deep learning framework for solving forward and inverse problems involving nonlinear partial differential equations](https://doi.org/10.1016/j.jcp.2018.10.045)
Raissi et al. (2019), *Journal of Computational Physics*. 21,648 citations.

- **Main goal:** Solve forward and inverse problems for nonlinear PDEs using neural networks that respect physical laws.
- **Architecture:** Physics-informed neural networks (PINNs): networks trained with PDE residuals via automatic differentiation in continuous-time and discrete-time (implicit Runge-Kutta) forms.
- **Data:** Classical benchmark problems: Burgers, Schrodinger, Allen-Cahn, Navier-Stokes, Korteweg-de Vries and shallow-water waves.
- **Main result:** Accurate data-efficient solutions and identification of PDE parameters from sparse data across the benchmarks.
- **Open work:** Scaling to high-dimensional, multiscale and chaotic problems; training robustness.
- **Issues:** Training can be difficult for stiff or multiscale problems; computational cost versus classical solvers; geophysical applications not demonstrated here.
- *Basis: abstract+knowledge*

### [Fourier Neural Operator for Parametric Partial Differential Equations](https://arxiv.org/abs/2010.08895)
Li et al. (2020), *International Conference on Learning Representations*. 5,244 citations.

- **Main goal:** Learn solution operators of parametric PDEs (mappings between function spaces) so a whole family of PDE instances can be solved quickly, instead of one instance at a time.
- **Architecture:** Fourier Neural Operator: stacked layers that parameterize the integral kernel in Fourier space (FFT, learned weights on truncated low modes, inverse FFT) plus a pointwise linear path and nonlinearity.
- **Data:** Numerically generated solutions of 1D Burgers' equation, 2D Darcy flow and 2D incompressible Navier-Stokes (vorticity form, including turbulent regime) at varying resolutions.
- **Main result:** State-of-the-art accuracy among neural PDE surrogates on all benchmarks and up to three orders of magnitude faster than traditional solvers; discretization-invariant, enabling zero-shot super-resolution.
- **Open work:** Extending to irregular geometries, non-periodic boundaries and real geophysical systems; long autoregressive rollouts; it became the basis of FourCastNet-style weather emulators.
- **Issues:** Truncated Fourier modes limit representation of fine-scale features; FFT assumes regular periodic grids; tested on idealized PDE data with a single fixed setting, not on observations.
- *Basis: abstract+knowledge*

### [Learning to Simulate Complex Physics with Graph Networks](https://arxiv.org/abs/2002.09405)
Sanchez-Gonzalez et al. (2020), *International Conference on Machine Learning*. 1,723 citations.

- **Main goal:** Builds a general learned simulator for complex particle-based physics (fluids, rigid and deformable materials).
- **Architecture:** Graph Network-based Simulators (GNS): particles as graph nodes, encoder-processor-decoder with learned message passing, trained on single-step predictions with input noise injection.
- **Data:** Particle-based simulations of fluids (water, sand, goop), rigid solids and deformable materials from various physics solvers.
- **Main result:** Generalizes from single-step training with thousands of particles to thousands of rollout steps, new initial conditions and at least 10x more particles; long-term accuracy depends mainly on the number of message-passing steps and noise injection.
- **Open work:** Apply to inverse problems and larger-scale scientific simulations.
- **Issues:** Not an atmospheric study; Lagrangian particle setting differs from gridded geophysical models, and no physical conservation is enforced.
- *Basis: abstract*

### [Learning Mesh-Based Simulation with Graph Networks](https://arxiv.org/abs/2010.03409)
Pfaff et al. (2020), *International Conference on Learning Representations*. 1,544 citations.

- **Main goal:** Learns fast surrogate simulators for mesh-based physical simulations, which are costly and require per-system tuning.
- **Architecture:** MeshGraphNets: graph neural network encoder-processor-decoder that passes messages on the simulation mesh (mesh-space and world-space edges) and learns to adapt mesh resolution during rollout.
- **Data:** Simulated trajectories from conventional solvers for aerodynamics (incompressible and compressible flow), structural mechanics and cloth.
- **Main result:** Accurately predicts dynamics across domains, generalizes to larger and more complex state spaces at test time, and runs 1-2 orders of magnitude faster than the source simulator.
- **Open work:** Extension to larger 3D systems and longer horizons; the GNN-on-mesh design later underpins global weather models such as GraphCast.
- **Issues:** Not an atmospheric application; trained on the simulator it emulates, so accuracy is bounded by it, and long rollouts can still accumulate error.
- *Basis: abstract+knowledge*

### [Machine learning–accelerated computational fluid dynamics](https://doi.org/10.1073/pnas.2101784118)
Kochkov et al. (2021), *Proceedings of the National Academy of Sciences of the United States of America*. 1,351 citations.

- **Main goal:** Accelerates fluid simulations without losing accuracy by embedding ML inside traditional numerical solvers rather than replacing them.
- **Architecture:** End-to-end trained, differentiable CFD solver (JAX) with learned interpolation and learned correction components inside a finite-volume scheme.
- **Data:** Two-dimensional turbulent flows (for example forced Kolmogorov flow) from high-resolution direct numerical simulation and large-eddy simulation.
- **Main result:** Matches baseline solvers at 8 to 10x finer resolution in each dimension, giving 40 to 80x speedups. Stays stable over long runs and generalizes to new forcings and Reynolds numbers.
- **Open work:** Extend to 3D flows, more complex geometries, and atmospheric or climate models.
- **Issues:** Demonstrated only on 2D idealized turbulence. Requires differentiable solvers and gains may shrink for 3D or multi-physics flows.
- *Basis: abstract+knowledge*

### [Model-Free Prediction of Large Spatiotemporally Chaotic Systems from Data: A Reservoir Computing Approach.](https://doi.org/10.1103/physrevlett.120.024102)
Pathak et al. (2018), *Physical Review Letters*. 1,256 citations.

- **Main goal:** Predicts large spatiotemporally chaotic systems from data alone, without a physical model.
- **Architecture:** Parallel reservoir computing: many local reservoirs, each predicting a spatial patch with overlapping neighbor inputs.
- **Data:** Simulated data from the Kuramoto-Sivashinsky equation on large domains.
- **Main result:** The parallel scheme predicts the state for several Lyapunov times and reproduces long-term statistics, scaling to large systems.
- **Open work:** Application to weather and other real, partially observed spatiotemporal systems.
- **Issues:** Idealized 1D system with full noise-free observations. Abstract unavailable.
- *Basis: abstract+knowledge*

### [Learning data-driven discretizations for partial differential equations](https://doi.org/10.1073/pnas.1814058116)
Bar-Sinai et al. (2018), *Proceedings of the National Academy of Sciences*. 648 citations.

- **Main goal:** Learns accurate coarse-grid discretizations of PDEs so that solutions remain accurate at much lower resolution.
- **Architecture:** Neural networks that estimate spatial derivative coefficients, trained end to end within the numerical solver.
- **Data:** High-resolution solutions of 1D nonlinear PDEs (Burgers, Korteweg-de Vries, Kuramoto-Sivashinsky) coarse-grained for training.
- **Main result:** Learned discretizations allow time integration at 4x to 8x coarser resolution than standard finite-difference methods.
- **Open work:** Extending to 2D/3D problems and atmospheric or oceanic flows.
- **Issues:** Only 1D model equations; generalization to new regimes and higher dimensions not shown.
- *Basis: abstract+knowledge*

### [Data-driven forecasting of high-dimensional chaotic systems with long short-term memory networks](https://doi.org/10.1098/rspa.2017.0844)
Vlachas et al. (2018), *Proceedings of the Royal Society A: Mathematical, Physical and Engineering Sciences*. 587 citations.

- **Main goal:** Forecasts high-dimensional chaotic systems in a reduced-order space using data alone.
- **Architecture:** LSTM networks in reduced-order space, and a hybrid mean stochastic model plus LSTM (MSM-LSTM) to ensure convergence to the invariant measure.
- **Data:** Time series from Lorenz 96, the Kuramoto-Sivashinsky equation and a prototype barotropic climate model.
- **Main result:** LSTMs outperform Gaussian processes in short-term accuracy in all cases; the hybrid improves long-term statistical behaviour.
- **Open work:** Scaling to more realistic, higher-dimensional systems and quantifying forecast uncertainty.
- **Issues:** Toy systems; reduced-order truncation; long-term forecasts can drift without the hybrid stochastic component.
- *Basis: abstract*

### [Adaptive Fourier Neural Operators: Efficient Token Mixers for Transformers](https://arxiv.org/abs/2111.13587)
Guibas et al. (2021), *arXiv*. 430 citations.

- **Main goal:** Provides an efficient token mixer for vision transformers on high-resolution inputs, where self-attention scales quadratically.
- **Architecture:** Adaptive Fourier Neural Operator (AFNO): token mixing as a global convolution in the Fourier domain with block-diagonal channel mixing, adaptive weight sharing and soft-thresholded frequency modes.
- **Data:** Computer vision benchmarks such as few-shot segmentation and Cityscapes segmentation.
- **Main result:** Quasi-linear complexity and linear memory; outperforms other efficient attention mechanisms, handling sequences of 65k tokens.
- **Open work:** Applications to scientific data; AFNO became the backbone of FourCastNet for global weather forecasting.
- **Issues:** Evaluated only on vision tasks here; FFT-based mixing assumes periodic, regular grids, which is awkward for the sphere.
- *Basis: abstract+knowledge*

### [Hybrid Forecasting of Chaotic Processes: Using Machine Learning in Conjunction with a Knowledge-Based Model](https://doi.org/10.1063/1.5028373)
Pathak et al. (2018), *Chaos: An Interdisciplinary Journal of Nonlinear Science*. 364 citations.

- **Main goal:** Combines an imperfect knowledge-based model with machine learning to improve forecasts of chaotic systems.
- **Architecture:** Hybrid scheme coupling reservoir computing (echo state network) with an approximate physical model.
- **Data:** Simulated data from the Lorenz 63 system and the Kuramoto-Sivashinsky equation, with deliberately imperfect models.
- **Main result:** The hybrid predicts accurately for much longer than either the reservoir alone or the imperfect model alone.
- **Open work:** Applying the hybrid approach to weather prediction and other high-dimensional real systems.
- **Issues:** Low-dimensional or idealized tests; model error introduced by parameter perturbation; no noisy partial observations.
- *Basis: abstract*

### [Data-driven predictions of a multiscale Lorenz 96 chaotic system using machine-learning methods: reservoir computing, artificial neural network, and long short-term memory network](https://doi.org/10.5194/npg-27-373-2020)
Chattopadhyay et al. (2019), *Nonlinear Processes in Geophysics*. 204 citations.

- **Main goal:** Compare ML methods for short-term prediction and long-term statistics of a multiscale chaotic system when only large-scale variables are observed.
- **Architecture:** Echo state network (reservoir computing), deep feed-forward ANN and LSTM recurrent network trained on the slow variables only.
- **Data:** Simulations of a three-tier multiscale Lorenz 96 system; only the slow X variables used for training and testing.
- **Main result:** RC-ESN substantially outperforms ANN and LSTM for short-term forecasts, tracking trajectories for several Lyapunov times; ESN and LSTM reproduce the true pdf including tails, ANN does not.
- **Open work:** Scaling to high-dimensional weather and climate systems and use as data-driven or data-assisted surrogates.
- **Issues:** Low-dimensional toy system with perfect noise-free data; ESN scalability to large systems is an open question.
- *Basis: abstract*

### [Scaling Laws of Global Weather Models](https://arxiv.org/abs/2602.22962)
Yu et al. (2026), *arXiv*. 9 citations.

*Summary pending.*

### [Stop using root-mean-square error as a precipitation target!](https://doi.org/10.1175/aies-d-25-0083.1)
Hunt (2025), *Artificial Intelligence for the Earth Systems*. 7 citations.

*Summary pending.*
