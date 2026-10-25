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
    ("Diffusion model", r"diffusion model|\bdiffusion\b|score-based|denoising diffusion|dyffusion"),
    ("GAN", r"\bgan\b|gans\b|generative adversarial|adversarial"),
    ("VAE / flow / autoencoder", r"autoencoder|variational encoder|\bvae\b|normalizing flow|encoder-decoder|encoder–decoder"),
    ("U-Net", r"u-?net"),
    ("CNN", r"convolution|\bcnn|resnet|residual (network|block)|super[- ]resolution (cnn|network)|srcnn|deeplab|capsule"),
    ("RNN / LSTM", r"lstm|\bgru\b|recurrent|\brnn|convlstm|predrnn|trajgru|temporal convolutional|\btcn\b"),
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
    "Diffusion model": "Generative (diffusion/GAN/VAE)", "GAN": "Generative (diffusion/GAN/VAE)",
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
        ptype = next(label for label, rx in PAPER_TYPE if re.search(rx, type_text.strip(), I))
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
            "probabilistic": probabilistic and ptype == "method", "venue_family": venue}
