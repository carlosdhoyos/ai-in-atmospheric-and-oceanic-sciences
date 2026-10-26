"""Homogenized categories for the catalog, assigned by transparent keyword rules.

Each dimension is a list of (label, regex) rules applied to one or more summary fields.
Multi-label dimensions keep every matching label; single-label dimensions keep the first match.
Manual fixes go in data/category_overrides.csv (paper_id, dimension, label, action=add|remove),
so the rules stay general and individual exceptions stay visible.
"""
import re

I = re.I

# Paper type (single label, first match wins). Checked against architecture + goal.
PAPER_TYPE = [
    ("review", r"^(a |an )?(\w+ )?(review|survey|perspective|commentary|synthesis|opinion|overview|blueprint|editorial|vision|"
               r"discussion paper)\b|"
               r"\breview(s|ing)? of\b|\bperspective (on|piece|article)\b|^literature review"),
    ("dataset_benchmark", r"^(a |an )?(benchmark|dataset|data set)\b|\b(benchmark|dataset) (with|and|framework|of)\b|"
                          r"\breanalysis dataset\b|^reanalysis\b"),
    ("evaluation", r"^(case[- ]study )?evaluation\b|^(systematic )?comparison of\b|^intercomparison\b|no new model|"
                   r"^perturbation experiments|retrained with|subjected to|^theoretical and numerical analysis|"
                   r"\bevaluat(es|ion of) (existing|four|several|three|multiple|state-of-the-art)\b|^statistical assessment"),
    ("method", r"."),
]

# Architecture families (multi-label). Order is the display order.
ARCHITECTURE = [
    ("Transformer", r"transformer|self-attention|\bvit\b|swin|attention-based|\battention\b|perceiver|earthformer"),
    ("Graph neural network", r"graph neural|\bgnn|graph network|message[- ]passing|graphcast|multimesh|graph-based"),
    ("Neural operator", r"neural operator|\bfno\b|\bsfno\b|\bafno\b|fourier neural|deeponet|spherical fourier"),
    ("Diffusion / flow matching", r"diffusion model|\bdiffusion\b|score-based|denoising diffusion|dyffusion|flow matching|"
                                  r"rectified flow|consistency model|stochastic interpolant"),
    ("GAN", r"\bgan\b|gans\b|generative adversarial|adversarial"),
    ("VAE / flow / autoencoder", r"autoencoder|variational encoder|\bvae\b|normalizing flow|encoder-decoder|encoder–decoder"),
    ("U-Net", r"u-?net"),
    ("CNN", r"convolution|\bcnn|resnet|residual (network|block)|super[- ]resolution (cnn|network)|srcnn|deeplab|capsule"),
    ("RNN / LSTM", r"lstm|\bgru\b|recurrent|\brnn|convlstm|predrnn|trajgru|temporal convolutional|\btcn\b|mamba|"
                   r"state[- ]space model"),
    ("MLP", r"feed[- ]?forward|fully[- ]connected|\bmlp|multilayer perceptron|dense (neural )?network|shallow neural|"
            r"single[- ]hidden|deep neural network"),
    ("Tree ensemble", r"random forest|gradient[- ]boost|xgboost|lightgbm|catboost|decision tree|extremely randomized|boosted trees"),
    ("Reservoir computing", r"reservoir|echo state"),
    ("Kernel / GP / SVM", r"gaussian process|support vector|\bsvm|kernel (ridge|method)|\bsvr\b"),
    ("Linear / statistical", r"linear regression|ridge|lasso|elastic[- ]net|logistic regression|\bols\b|regularized regression|"
                             r"\bpca\b|principal component|kriging|analog"),
    ("Clustering / unsupervised", r"k-means|clustering|self-organizing map|\bsom\b|unsupervised"),
    ("Equation discovery", r"symbolic regression|equation discovery|sparse regression|sindy|relevance vector|closed-form"),
    ("Physics-informed loss / constraints", r"physics-informed|physically constrained|hard[- ]constrain|conservation|"
                                            r"physical constraint|constraint layer|enforc\w+ (analytic|physical)"),
    ("Hybrid physics-ML model", r"hybrid|differentiable|coupled online|online coupl|neuralgcm|embedded in|inside (a|the) "
                                r"(gcm|model)|nudg|correction (to|of) (a|the)|learned correction|host model"),
    ("Causal / XAI method", r"causal|layerwise relevance|\blrp\b|saliency|shap\b|explainab|attribution method|pcmci"),
    ("Data assimilation scheme", r"kalman|4d-?var|variational (data )?assimilation|ensemble smoother|particle filter|\benkf"),
]
ARCH_GROUP = {  # coarser grouping for trend plots
    "Transformer": "Transformers", "Graph neural network": "Graph & operator nets", "Neural operator": "Graph & operator nets",
    "Diffusion / flow matching": "Generative (diffusion/GAN/VAE)", "GAN": "Generative (diffusion/GAN/VAE)",
    "VAE / flow / autoencoder": "Generative (diffusion/GAN/VAE)", "U-Net": "CNN / U-Net", "CNN": "CNN / U-Net",
    "RNN / LSTM": "RNN / LSTM", "MLP": "MLP", "Tree ensemble": "Classical ML", "Reservoir computing": "Classical ML",
    "Kernel / GP / SVM": "Classical ML", "Linear / statistical": "Classical ML", "Equation discovery": "Classical ML",
    "Clustering / unsupervised": "Classical ML", "Neural network (unspecified)": "MLP / generic NN",
}
ARCH_GROUP["MLP"] = "MLP / generic NN"
# Labels that describe an approach layered on any model, not the network family itself
APPROACHES = {"Hybrid physics-ML model", "Physics-informed loss / constraints", "Causal / XAI method",
              "Data assimilation scheme"}
GENERIC_NN = r"neural network|deep learning|neural net"

# Data sources (multi-label), matched against the data field.
DATA_SOURCE = [
    ("ERA5", r"era5|era-5"),
    ("Other reanalysis", r"era-?interim|merra|ncep|cfsr|jra-?55|20th century reanalysis|20cr|narr|north american regional"),
    ("Ocean / sea-ice models & products", r"glorys|oras|soda\b|hycom|ocean reanalysis|cmems|copernicus marine|socat|argo|"
                                          r"altimetr|sea surface height|\bssh\b|mom6|ecco|nemo|nextsim|sea[- ]ice model|"
                                          r"ocean (model|simulation)|zebiak"),
    ("CMIP / climate model output", r"cmip|cesm|\be3sm(?!-mmf)|earth system model|climate model|large ensemble|\bgcm|noresm|"
                                    r"scenariomip|historical simulation|plasim|intermediate-complexity|\bcam\d?\b|echam|ukcp|"
                                    r"climate simulation|fv3gfs|shield"),
    ("Parameterization / scheme output", r"radiation scheme|radiative transfer|rrtm|line-by-line|microphysics (module|scheme)|"
                                         r"\bm7\b|gravity wave drag scheme|geos-chem|chemical mechanism|scheme (inputs|outputs)|"
                                         r"parameterization (inputs|outputs)|input/output pairs|tigr|atmospheric profiles"),
    ("Generic PDE / fluid benchmarks", r"navier-stokes|burgers|darcy|allen-cahn|schrodinger|korteweg|fluid flow simulation|"
                                       r"particle-based simulation|aerodynamics|cloth|spring mesh"),
    ("Km-scale / high-res simulation", r"storm-resolving|cloud-resolving|convection-permitting|\bles\b|large-eddy|"
                                       r"superparameteri|spcam|e3sm-mmf|\bmmf\b|\bsam\b|coarse-grain|high-resolution simulation|"
                                       r"km-scale|kilometer-scale|wrf|regional climate model|icon\b|x-shield|storm-resolving fv3"),
    ("Idealized / toy model", r"lorenz|idealized|quasi-geostrophic|aquaplanet|double[- ]gyre|toy model|2d turbulence|"
                              r"two-dimensional turbulence|kolmogorov|kuramoto|shallow water|low-order|synthetic"),
    ("Operational NWP / reforecasts", r"operational|\bifs\b|\bhres\b|\bgfs\b|gefs|reforecast|ensemble forecast|nwp|"
                                      r"forecast archive|ecmwf (ensemble|forecast)|\bens\b|cosmo|meps|hrrr|cams"),
    ("Hydrological observations", r"streamflow|discharge (records|observations|data)|camels|caravan|\bgrace\b|usgs|"
                                  r"gauging station|river gauge|soil moisture (product|observations|data)|\bsmap\b|"
                                  r"groundwater (level|well)|water table|lake level|catchment attributes"),
    ("Energy & power data", r"wind (power|farm|turbine) (data|output|measurements|records)|power output|scada|"
                            r"pv (output|generation|systems?)|photovolt\w* (output|generation|data)|load data|"
                            r"electricity (demand|consumption|load)|smart meter|solar farm"),
    ("Crop & agricultural data", r"yield (data|records|statistics)|crop (yield|statistics|data|model)|usda|nass|"
                                 r"faostat|field trials?|agricultural (census|statistics)|farm(er)? (data|survey)"),
    ("Radar", r"radar|mrms|nexrad|reflectivity"),
    ("Satellite", r"satellite|landsat|goes|himawari|modis|passive microwave|\bsar\b|imerg|\bgpm|persiann|brightness temperature|"
                  r"avhrr|sentinel|viirs|cloudsat|calipso|\bglm\b|\bsst\b product|oisst"),
    ("Stations / in situ", r"station|gauge|in situ|in-situ|buoy|synop|radiosonde|surface observation|best-track|best track|"
                           r"measurement site|monitoring site|\barm\b"),
]
REANALYSIS_FALLBACK = ("Reanalysis (unspecified)", r"reanalys[ie]s")

PROBABILISTIC = (r"probabilis|ensemble|diffusion|\bgan|generative|uncertaint|quantile|crps|stochastic|distribution(al)?\b|"
                 r"monte carlo dropout|bayesian|variance")

# Venue families for normalizing ~150 venue strings.
VENUE_FAMILY = [
    ("Nature & Science", r"^nature$|^science$|nature (geoscience|climate change|communications|machine intelligence|reviews|"
                         r"computational|energy|water)|science advances|npj|communications earth"),
    ("AGU journals", r"journal of advances in modeling earth|geophysical research letters|jgr|journal of geophysical|"
                     r"earth and space science|water resources research|space weather|agu advances|reviews of geophysics|"
                     r"earth's future|geophysical research"),
    ("AMS journals", r"monthly weather review|weather and forecasting|journal of (the )?atmospheric sciences|journal of climate|"
                     r"bulletin of the american meteorological|journal of applied meteorology|journal of hydrometeorology|"
                     r"artificial intelligence for the earth systems|journal of atmospheric and oceanic technology|"
                     r"weather, climate, and society"),
    ("EGU / Copernicus journals", r"geoscientific model development|atmospheric chemistry and physics|earth system dynamics|"
                                  r"the cryosphere|earth system science data|biogeosciences|nonlinear processes|"
                                  r"atmospheric measurement|hydrology and earth|natural hazards and earth"),
    ("RMetS / Royal Society", r"quarterly journal|philosophical transactions|atmospheric science letters|meteorological "
                              r"applications|international journal of climatology|proceedings of the royal society"),
    ("ML conferences", r"neural information|neurips|international conference on machine learning|learning representations|"
                       r"knowledge discovery|aaai|computer vision|artificial intelligence and statistics|ijcai"),
    ("arXiv preprint", r"^arxiv"),
    ("Hydrology & water journals", r"journal of hydrology|hydrological processes|advances in water resources|"
                                   r"hydroinformatics|hydrological sciences|water resources management|journal of flood|"
                                   r"water research|^water$|nature water|hydrology research|vadose|groundwater"),
    ("Energy journals", r"applied energy|renewable energy|solar energy|^energy$|energy and ai|energy conversion|"
                        r"renewable and sustainable energy|wind energy|energy reports|sustainable energy|"
                        r"electric power|power systems|energies|nature energy|journal of renewable"),
    ("Agricultural journals", r"agricultural and forest meteorology|agricultural water management|field crops|"
                              r"computers and electronics in agriculture|agricultural systems|european journal of agronomy|"
                              r"nature food|agronomy|precision agriculture|plant science|global food security"),
    ("PNAS & multidisciplinary", r"proceedings of the national academy|scientific reports|science bulletin|"
                                 r"environmental research letters|wires|annual review|acm computing surveys"),
    ("IEEE & remote sensing", r"ieee|remote sensing of environment|geoscience and remote sensing|pattern recogni"),
    ("MDPI & Frontiers", r"^remote sensing$|^atmosphere$|applied sciences|frontiers|^sensors$|^water$|^algorithms$|"
                         r"sustainability|energies|^climate$|^axioms$|^electronics$|^ai$"),
    ("Physics & applied math", r"physical review|reviews of modern physics|computational physics|fluid mechanics|chaos|"
                               r"physica d|foundations of data science|journal of computational science"),
    ("Other geoscience journals", r"climate dynamics|theoretical and applied climatology|atmospheric research|"
                                  r"weather and climate extremes|ocean modelling|journal of hydrology|environmental (data science|"
                                  r"modelling)|ocean-land-atmosphere|international journal of digital earth|"
                                  r"atmospheric environment|environment international|environmental pollution|"
                                  r"atmospheric pollution|climate informatics"),
]


# Canonical journal / venue names (first match wins); anything else keeps its own name, cleaned up.
JOURNAL_ALIASES = [
    (r"^arxiv", "arXiv (preprint only)"),
    (r"neural information processing|neurips|\bnips\b", "NeurIPS"),
    (r"international conference on machine learning|^icml", "ICML"),
    (r"learning representations|^iclr", "ICLR"),
    (r"computer vision and pattern recognition|\bcvpr", "CVPR"),
    (r"\baaai\b", "AAAI"),
    (r"knowledge discovery|\bkdd\b", "KDD"),
    (r"artificial intelligence and statistics|aistats", "AISTATS"),
    (r"joint conference on artificial intelligence|ijcai", "IJCAI"),
    (r"high performance computing, networking", "SC (Supercomputing)"),
    (r"bulletin of the american meteorological", "Bulletin of the American Meteorological Society"),
    (r"proceedings of the national academy", "PNAS"),
    (r"philosophical transactions of the royal society a", "Philosophical Transactions of the Royal Society A"),
    (r"journal of applied meteorology", "Journal of Applied Meteorology and Climatology"),
    (r"journal of geophysical research: machine learning", "JGR: Machine Learning and Computation"),
    (r"journal of geophysical research: atmospheres", "JGR: Atmospheres"),
    (r"journal of geophysical research: oceans", "JGR: Oceans"),
    (r"^journal of geophysical research$", "JGR (section not recorded)"),
    (r"^chaos", "Chaos"),
    (r"^weather and forecasting$", "Weather and Forecasting"),
    (r"^atmospheric research$", "Atmospheric Research"),
]


def journal_name(venue):
    import html
    v = re.sub(r"\s+", " ", html.unescape(venue or "")).strip()
    for rx, name in JOURNAL_ALIASES:
        if re.search(rx, v, I):
            return name
    return v or "Unknown venue"


def match_all(rules, text):
    return [label for label, rx in rules if re.search(rx, text or "", I)]


def classify(paper):
    s = paper.get("summary") or {}
    arch_text = " ".join([s.get("architecture", ""), paper["title"]])
    data_text = s.get("data", "")
    type_text = s.get("architecture", "") + " " + s.get("goal", "")

    if re.search(r"(:|\.|-)\s*(a )?(review|survey)\b|^(a )?(review|survey) of", paper["title"], I):
        ptype = "review"
    elif "review" in paper["topics"] and re.search(r"review|survey|perspective|overview|opinion|outlook|towards|challenges|"
                                                 r"opportunities|tackling|revolution|digital twin|rise of", paper["title"], I):
        ptype = "review"
    else:
        ptype = next((label for label, rx in PAPER_TYPE if re.search(rx, type_text.strip(), I)), "method")
    if ptype == "method" and "benchmarks" in paper["topics"]:
        ptype = "dataset_benchmark"

    arch = match_all(ARCHITECTURE, arch_text)
    if ptype == "review":
        arch = []  # reviews mention many architectures; don't count them as using them
    model_arch = [a for a in arch if a in ARCH_GROUP]
    if not model_arch and ptype in ("method", "dataset_benchmark") and re.search(GENERIC_NN, arch_text, I):
        arch.append("Neural network (unspecified)")
    data = match_all(DATA_SOURCE, data_text) if ptype != "review" else []
    if ptype != "review" and not {"ERA5", "Other reanalysis", "Ocean / sea-ice models & products"} & set(data) \
            and re.search(REANALYSIS_FALLBACK[1], data_text, I):
        data.append(REANALYSIS_FALLBACK[0])
    probabilistic = bool(re.search(PROBABILISTIC, " ".join([s.get("architecture", ""), s.get("goal", ""),
                                                            s.get("result", ""), paper["title"]]), I))
    venue = next((label for label, rx in VENUE_FAMILY if re.search(rx, paper["venue"] or "", I)), "Other venues")
    return {"paper_type": ptype, "architecture": arch, "data_source": data,
            "probabilistic": probabilistic and ptype == "method", "venue_family": venue,
            "journal": journal_name(paper["venue"])}


# Research goal / task (multi-label), matched against the goal field and title.
TASK = [
    ("Medium-range weather forecasting", r"medium-range|global weather|weather (forecast|prediction)|\bnwp\b|"
                                         r"forecast\w* .*(global|weather)|data-driven weather|weather model"),
    ("Nowcasting (0–12 h)", r"nowcast|radar extrapolation|twelve[- ]hour|0-2 ?h|next-hour|short-term precipitation"),
    ("Subseasonal to decadal prediction", r"subseasonal|sub-seasonal|seasonal|\bs2s\b|enso|el ni|\bmjo\b|madden|decadal|"
                                          r"interannual|multi-year"),
    ("Climate emulation & projection", r"climate (emulat|projection|simulation|model output)|emulat\w* .*climate|"
                                       r"long(-term)? climate|scenario|projections?\b|climate prediction"),
    ("Parameterization & physics emulation", r"parameteri|subgrid|sub-grid|closure|radiative transfer|radiation|"
                                             r"microphysics|convection scheme|gravity wave|physics (scheme|emulat)|"
                                             r"chemistry (solver|mechanism)|moist physics"),
    ("Model error & bias correction", r"\bbias|model error|correct(ion|ing|s)? (model|forecast|bias|systematic)"),
    ("Post-processing & calibration", r"post-?process|calibrat"),
    ("Downscaling & super-resolution", r"downscal|super-resolution|higher resolution|high-resolution (fields|projections|"
                                       r"climate)|km-scale"),
    ("Data assimilation & state estimation", r"assimilat|state estimation|initial condition|analysis system|"
                                             r"from (raw |sparse )?observations"),
    ("Detection & classification", r"detect(?!.*(climate|forced|anthropogenic))|classif|identif|segment|track(ing)? "
                                   r"(fronts|cyclone|eddies)|front(s)?\b|atmospheric river"),
    ("Retrieval & estimation from observations", r"retriev|estimat\w* .*(satellite|radar|microwave|observation)|"
                                                 r"satellite (precipitation|estimat)|intensity estimation|from satellite"),
    ("Reconstruction & gap filling", r"reconstruct|gap|missing|infill|interpolat|fill"),
    ("Climate change detection & attribution", r"(detect|identif)\w* .*(climate|forced|anthropogenic)|attribution of|"
                                               r"fingerprint|forced (change|response|signal)|warming threshold|time remaining"),
    ("Process understanding & discovery", r"interpret|explain|discover|understand|mechanism|causal|insight|physical "
                                          r"relationship|governing equations"),
    ("Extreme events", r"extreme|heatwave|heat wave|hail|tornado|tropical cyclone|hurricane|typhoon|severe|gray swan|flood"),
    ("Air quality & atmospheric composition", r"air quality|pm2|pm10|ozone|pollut|chemistry|aerosol|dust"),
    ("Ocean & sea-ice prediction", r"ocean|sea surface|sea ice|eddy|eddies|sea level|wave|storm surge|carbon (sink|uptake)"),
    ("Hydrological prediction", r"streamflow|runoff|flood|groundwater|soil moisture|evapotranspiration|hydrolog|"
                                r"snowmelt|snow water|water (level|table|storage|resource|supply)|catchment|watershed|"
                                r"reservoir|river (flow|discharge)|drought"),
    ("Energy forecasting", r"wind power|wind energy|wind farm|solar (power|energy|irradiance|radiation)|photovolt|"
                           r"energy (demand|load|consumption|system)|electricity|load forecast|hydropower|renewable"),
    ("Agricultural prediction", r"crop|yield|agricultur|wheat|maize|corn\b|rice|soybean|irrigation|food security|"
                                r"phenolog|grassland|pasture|gross primary production"),
    ("Benchmarking, evaluation & feasibility", r"benchmark|dataset|^(\w+ )?(evaluat|assess|compar|test|ask|examin|investigat|quantif)|"
                                  r"intercompar|whether"),
    ("Computational speed-up", r"speed|accelerat|faster|cheap|computational (cost|efficien)|cost-effective|efficient"),
]

# Recurring limitations (issues field) and research agenda (open_work field).
ISSUE_THEME = [
    ("Generalization / out-of-distribution", r"out-of-distribution|generaliz|extrapolat|unseen|non-?stationar|"
                                             r"outside the training|new (regimes|climates)|transfer\w* (to|across)|"
                                             r"warmer climate|climate change"),
    ("Idealized or narrow setting", r"idealized|toy|aqua-?planet|lorenz|single (region|site|case|season|column|model)|"
                                    r"small (domain|region|sample)|limited (domain|region|data|dataset)|one (region|model|"
                                    r"case|dataset|year|country|basin)|regional|\b1d\b|two-dimensional|2d|site-specific|"
                                    r"basin only|short lead|single-country|only one"),
    ("Trained or tested on model data only", r"(trained|tested|evaluated)\w* (and \w+ )?(only )?on (model|simulat)|"
                                             r"model (world|data only|output)|perfect-model|simulated observations|"
                                             r"depend\w* on (the )?(climate |cmip\w* )?model|relies? on model"),
    ("Offline testing only", r"offline"),
    ("Coarse resolution or few variables", r"coarse|resolution|single (variable|channel|level|pressure)|few variables|"
                                           r"limited (predictors|variables)|only (ssh|shortwave|one variable|sst)|"
                                           r"shortwave only|univariate"),
    ("Label or ground-truth quality", r"label|best[- ]track|reports? (have|bias)|ground truth|subjective"),
    ("Depends on reanalysis / NWP analyses", r"reanalysis|inherit|analys[ie]s (for|as) initial|relies on (nwp|operational|"
                                              r"analys)|nwp-based|initial conditions from|initialized from"),
    ("Smoothing, blurring or weak extremes", r"blur|smooth|underestimat|damp|spectral|loss of (fine|small)|extremes?\b"),
    ("Instability or drift in long runs", r"instab|unstable|drift|stability|blow|online (coupling|simulation)|long rollout"),
    ("No or poorly calibrated uncertainty", r"deterministic|no (uncertainty|probabilistic)|uncertainty (is )?not|"
                                            r"calibrat|under-?dispers|spread"),
    ("Physical consistency / conservation", r"conserv|physical(ly)? (consisten|constraint|realism|balance|plausib)|"
                                            r"energy|mass\b|balance"),
    ("Interpretability / black box", r"interpret|black[- ]box|explain|saliency|relevance map|attribution map"),
    ("Limited evaluation", r"short (record|test|validation|period)|few (events|cases|samples)|limited (evaluation|"
                           r"validation|verification)|baselines?\b|selected (examples|cases)|favou?rs|single (season|event)|"
                           r"anecdotal|metrics|overfit|leak|not (reported|given|established|demonstrated|shown)|"
                           r"no comparison|relative to climatology|overstate|small (validation|sample)|"
                           r"no quantitative"),
    ("Compute or data demands", r"comput\w* (cost|expens|demand)|expensive|gpu|large (amounts|training)|data-hungry|"
                                r"training data (volume|requirement)|costly"),
    ("Review dates quickly", r"rapidly (evolving|moving)|evolv\w* quickly|predates|may date|pre-20\d\d"),
    ("Summary uncertain (no abstract)", r"abstract (is )?unavailable|cannot be verified|inferred from the title|"
                                        r"not confirmed|abstract-level"),
]
OPEN_THEME = [
    ("Probabilistic forecasts & uncertainty", r"probabilis|ensemble|uncertaint|stochastic|calibrat"),
    ("Operational use", r"operational|real-time|deploy"),
    ("Online coupling & hybrid models", r"coupl\w* (to|with|in)|online|hybrid|host model|full (gcm|model)|"
                                        r"integrat\w* (into|with)|inside (a|the)"),
    ("Generalization & transfer", r"generaliz|transfer|other (regions|climates|models|domains|basins)|real geography|"
                                  r"climate change|out-of-distribution|robust"),
    ("Higher resolution & larger domains", r"resolution|larger domain|global (grid|domain|scale)|km-scale|finer|"
                                           r"extend\w* to (global|3d)"),
    ("More variables & Earth-system components", r"more (variables|predictors|levels|processes)|additional (variables|"
                                                 r"predictors)|precipitation|coupled (ocean|atmosphere)|land|chemistry|"
                                                 r"earth system|sea ice|ocean"),
    ("Learning directly from observations", r"observation|end-to-end|raw|satellite|in situ"),
    ("Extremes & rare events", r"extreme|tail|rare|high-impact|tropical cyclone|heatwave"),
    ("Physical constraints & interpretability", r"physic\w*[- ](constrain|informed|consisten)|conserv|interpret|explain|"
                                                r"mechanism|causal"),
    ("Longer lead times", r"lead time|longer (horizon|range|leads)|extend\w* .*lead|beyond \d+ days"),
    ("Benchmarks & evaluation", r"benchmark|evaluat|verification|metric|intercompar|validat"),
]


# Trend periods: (label, last year). Shared by the database, the EDA report and both HTML pages.
PERIODS = [("≤2018", 2018), ("2019–20", 2020), ("2021–22", 2022), ("2023–24", 2024), ("2025–26", 2026)]


def period(year):
    return next((label for label, last in PERIODS if year <= last), PERIODS[-1][0])


def period_sql(col="year"):
    whens = " ".join(f"WHEN {col} <= {last} THEN '{label}'" for label, last in PERIODS[:-1])
    return f"CASE {whens} ELSE '{PERIODS[-1][0]}' END"


def categorize(papers, summaries, overrides=()):
    """All categories for every paper, keyed by S2 paperId, with manual overrides applied."""
    out = {}
    for p in papers:
        p = dict(p, summary=summaries.get(p["s2"]))
        s = p["summary"] or {}
        c = classify(p)
        goal_text = s.get("goal", "") + " " + p["title"]
        c["task"] = match_all(TASK, goal_text) if c["paper_type"] != "review" else []
        c["issue_theme"] = match_all(ISSUE_THEME, s.get("issues", ""))
        c["open_theme"] = match_all(OPEN_THEME, s.get("open_work", "")) if c["paper_type"] != "review" else []
        for o in (o for o in overrides if o["paper_id"] == p["s2"]):
            dim, label, act = o["dimension"], o["label"], o["action"]
            if isinstance(c.get(dim), list):
                if act == "add" and label not in c[dim]:
                    c[dim].append(label)
                if act == "remove" and label in c[dim]:
                    c[dim].remove(label)
            elif dim == "probabilistic":
                c[dim] = label.lower() == "true"
            else:
                c[dim] = label
        c["arch_group"] = sorted({ARCH_GROUP[a] for a in c["architecture"] if a in ARCH_GROUP})
        c["model_family"] = [a for a in c["architecture"] if a not in APPROACHES]
        c["approach"] = [a for a in c["architecture"] if a in APPROACHES]
        c["period"] = period(p["year"]) if p["year"] else None
        out[p["s2"]] = c
    return out


def load_overrides(path):
    import csv
    import os
    if not os.path.exists(path):
        return []
    return [r for r in csv.DictReader(open(path)) if r.get("paper_id") and not r["paper_id"].startswith("#")]
