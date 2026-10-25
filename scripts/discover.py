"""Discovery pass: highly cited papers per subfield via Semantic Scholar bulk search.
Output is a candidate list that is screened by hand into data/additions.tsv."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import s2

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "data", "cache_discovery.json")
LITE = "title,year,venue,citationCount,externalIds"

QUERIES = {
    "weather": '("deep learning" | "machine learning" | "neural network") + ("weather forecasting" | "weather prediction")',
    "weather2": '("data-driven" | "AI" ) + ("global weather" | "medium-range")',
    "probabilistic": '("diffusion model" | "generative" | "ensemble") + ("weather" | "climate") + ("deep learning" | "machine learning")',
    "nowcasting": '("nowcasting") + ("deep learning" | "neural network" | "machine learning")',
    "postprocessing": '("postprocessing" | "post-processing" | "bias correction") + ("neural network" | "machine learning") + (forecast | weather)',
    "s2s": '("subseasonal" | "seasonal" | "ENSO" | "El Nino" | "MJO") + ("deep learning" | "machine learning" | "neural network")',
    "climate": '("climate model" | "earth system model") + ("emulator" | "emulation" | "deep learning" | "machine learning")',
    "parameterization": '("parameterization" | "parametrization" | "subgrid") + ("neural network" | "machine learning" | "deep learning")',
    "downscaling": '("downscaling" | "super-resolution") + ("deep learning" | "neural network" | "machine learning") + (climate | precipitation | weather)',
    "da": '("data assimilation") + ("machine learning" | "deep learning" | "neural network")',
    "remote_sensing": '("satellite" | "radar") + ("precipitation" | "cloud") + ("deep learning" | "convolutional neural network")',
    "extremes": '("tropical cyclone" | "hurricane" | "heatwave" | "extreme weather" | "tornado" | "hail") + ("deep learning" | "machine learning")',
    "xai": '("explainable" | "interpretable" | "causal discovery" | "equation discovery") + (climate | weather | geoscience | ocean)',
    "ocean": '("ocean" | "sea surface temperature" | "mesoscale eddies" | "sea level") + ("deep learning" | "machine learning" | "neural network")',
    "seaice": '("sea ice") + ("deep learning" | "machine learning" | "neural network")',
    "chemistry": '("air quality" | "PM2.5" | "atmospheric chemistry" | "aerosol") + ("machine learning" | "deep learning")',
    "review": '("review" | "perspective" | "survey") + ("machine learning" | "artificial intelligence" | "deep learning") + (climate | weather | atmospheric | ocean)',
}


def main():
    cache = json.load(open(OUT)) if os.path.exists(OUT) else {}
    for topic, q in QUERIES.items():
        if topic in cache:
            continue
        cache[topic] = s2.bulk_search(q, year="2015-", limit=60, fields=LITE)
        print(topic, len(cache[topic]), flush=True)
        json.dump(cache, open(OUT, "w"), indent=1)


if __name__ == "__main__":
    main()
