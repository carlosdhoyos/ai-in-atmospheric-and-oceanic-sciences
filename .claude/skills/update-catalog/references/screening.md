# Screening brief

Use this brief when deciding which discovered candidates join the catalog, whether you screen them yourself or give
a batch to a subagent. The catalog is a curated reference for researchers in atmospheric and oceanic science, so
the question for each candidate is: *would a researcher in this field want to know this paper exists?*

## Input

A batch of rows from `data/candidates_<since>_scored.csv`: `score, cites, months, id, venue, date, title, abstract`.
`score` is citations per month since publication plus a small bonus for strong venues. It is a hint for ordering,
not a verdict: a two-month-old Nature paper can have 2 citations and still belong.

## Include a paper when all of these hold

1. **On topic.** It applies or develops machine learning / AI for the atmosphere, ocean, sea ice or the climate
   system: weather and climate prediction, emulation, parameterization, downscaling, data assimilation,
   nowcasting, extremes, remote sensing of atmosphere/ocean, air quality and composition, or the ML methods
   built specifically for these. Also include reviews, perspectives, benchmarks and datasets for these.
2. **It adds something.** A new model or system, a substantial evaluation of existing ones (for example how AI
   weather models handle extremes, physics or out-of-distribution events), a benchmark or dataset others will
   use, a review that maps the area, or an influential application.
3. **It has a signal of significance**: notable citations for its age, a strong venue (Nature/Science family,
   PNAS, JAMES, GRL, AIES, npj CAS, BAMS, QJRMS, MWR, GMD, top ML conferences), a widely used system (operational
   centre or major lab model), or it fills a gap in a subfield the catalog covers thinly.

## Applied scope: water, energy and agriculture

Candidates from `--scope applied` (files `candidates_applied_*.csv`) follow the same three tests, with the topic test
replaced by this one: the paper applies ML/AI to **hydrology and water resources** (streamflow, floods,
groundwater, soil moisture, evapotranspiration, snow, drought, reservoirs), **energy** (wind and solar power,
energy demand) or **agriculture** (crop yield, irrigation, phenology, food security), *and* the problem is tied to
water, weather or climate: it uses meteorological or climate inputs, predicts a hydrological quantity, or studies
climate/weather impacts. For energy the tie must be meteorological (NWP, irradiance, wind speed, climate
scenarios); a load-forecasting paper that only uses calendar features does not qualify. Leave out water quality,
wastewater, pipes and plant-disease or pest detection from images. Use the topics `hydrology`, `energy` or
`agriculture`, adding a core topic when it fits (e.g. `hydrology,extremes` for flood forecasting,
`agriculture,s2s` for seasonal yield forecasts). Landmark methods papers in these areas (e.g. LSTM rainfall–runoff
modelling, global flood forecasting) belong even when they are years old, because this scope was added in 2026.

## Leave out

- In the core scope: hydrology, energy and agriculture papers (they are screened under the applied scope above),
  glaciers and ice sheets unless they concern the ocean or sea ice, health, urban planning, finance, space weather,
  planetary science.
- Generic ML papers that only use a weather dataset as one benchmark among many (unless the paper is about
  weather/climate forecasting itself).
- Incremental regional applications (an LSTM for one station's temperature) with no strong signal.
- Duplicates. If a candidate is the **published version of a preprint already in the catalog** (same model name or
  near-identical title, e.g. "FuXi-ENS", "ArchesWeatherGen"), do not add it as new; report it under
  `published_versions` so the existing entry is pointed at the published record.

When unsure, prefer fewer, clearly relevant papers. A batch of 160 candidates has typically yielded 25–45
inclusions, but that is an observation, not a quota: do not drop a paper that meets the criteria just to stay in
that range, and favour subfields the catalog covers thinly (sea ice, S2S/MJO, post-processing, chemistry).

## Output

A JSON object:

```json
{
  "include": [
    {"id": "DOI:10.1038/...", "topics": ["weather", "probabilistic"], "reason": "Operational ML ensemble from ECMWF; strong venue"}
  ],
  "published_versions": [
    {"id": "DOI:10.1126/sciadv....", "catalog_title": "FuXi-ENS: A machine learning model for medium-range ensemble weather forecasting"}
  ]
}
```

`id` is copied exactly from the candidate row. `topics` uses one to three keys from this list, most relevant
first: review, weather, probabilistic, foundation, nowcasting, postprocessing, s2s, climate, parameterization,
downscaling, da, remote_sensing, extremes, xai, ocean, seaice, chemistry, benchmarks, methods, hydrology, energy,
agriculture.
(Meaning: review = reviews & perspectives; weather = global/regional medium-range weather; probabilistic =
ensembles & generative; foundation = foundation models; s2s = subseasonal-to-decadal, ENSO, MJO; climate =
climate emulation, projection, detection & attribution; parameterization = subgrid/physics emulation and hybrid
models; da = data assimilation; remote_sensing = satellite/radar retrievals and clouds; extremes = tropical
cyclones, heatwaves, severe weather; xai = explainability, causality, equation discovery; chemistry = air quality,
aerosols, composition; benchmarks = datasets and benchmarks; methods = ML methods developed for these problems;
hydrology = hydrology and water resources; energy = weather and climate for energy; agriculture = climate and water
for agriculture.)
