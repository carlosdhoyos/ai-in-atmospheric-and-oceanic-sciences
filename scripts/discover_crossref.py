"""Discovery pass over Crossref: most relevant journal articles per subfield query since 2015.
Candidates are screened by hand into data/additions.tsv."""
import concurrent.futures as cf
import json
import os
import urllib.parse

from resolve_ids import get

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "data", "cache_discovery_crossref.json")

QUERIES = {
    "weather": ["deep learning global weather forecasting", "machine learning numerical weather prediction",
                "neural network weather prediction model data-driven"],
    "probabilistic": ["ensemble weather forecast neural network", "generative diffusion model weather"],
    "nowcasting": ["precipitation nowcasting deep learning radar", "convective nowcasting machine learning"],
    "postprocessing": ["postprocessing ensemble forecasts neural network", "machine learning bias correction weather forecast"],
    "s2s": ["deep learning ENSO prediction", "subseasonal forecast machine learning", "Madden-Julian oscillation deep learning",
            "seasonal forecast machine learning"],
    "climate": ["climate model emulator machine learning", "deep learning climate change detection",
                "neural network climate projections"],
    "parameterization": ["neural network parameterization climate model", "machine learning subgrid parameterization convection",
                         "machine learning cloud microphysics parameterization", "neural network radiation parameterization emulation"],
    "downscaling": ["deep learning statistical downscaling precipitation", "super-resolution climate downscaling neural network"],
    "da": ["data assimilation machine learning", "deep learning data assimilation"],
    "remote_sensing": ["satellite precipitation retrieval deep learning", "cloud classification deep learning satellite",
                       "convolutional neural network satellite meteorology"],
    "extremes": ["tropical cyclone deep learning", "extreme weather detection deep learning", "heat wave prediction machine learning",
                 "severe weather machine learning forecast"],
    "xai": ["explainable artificial intelligence geoscience", "interpretable neural network climate", "causal discovery climate"],
    "ocean": ["ocean deep learning", "sea surface temperature prediction deep learning", "ocean mesoscale eddies machine learning",
              "ocean subgrid parameterization machine learning", "ocean carbon machine learning"],
    "seaice": ["sea ice deep learning forecasting"],
    "chemistry": ["air quality forecasting deep learning", "PM2.5 machine learning estimation", "atmospheric chemistry machine learning"],
    "review": ["machine learning earth system science review", "artificial intelligence weather climate review",
               "machine learning atmospheric science"],
}


def search(q):
    p = urllib.parse.urlencode({"query.bibliographic": q, "rows": 100,
                                "filter": "from-pub-date:2015-01-01,type:journal-article",
                                "select": "DOI,title,container-title,issued,is-referenced-by-count"})
    raw = get(f"https://api.crossref.org/works?{p}")
    return json.loads(raw)["message"]["items"] if raw else []


def main():
    jobs = [(t, q) for t, qs in QUERIES.items() for q in qs]
    with cf.ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda j: search(j[1]), jobs))
    out = {}
    for (t, q), items in zip(jobs, res):
        out.setdefault(t, {})[q] = [{"doi": i["DOI"].lower(), "title": (i.get("title") or [""])[0],
                                     "venue": (i.get("container-title") or [""])[0],
                                     "year": (i.get("issued", {}).get("date-parts") or [[None]])[0][0],
                                     "cites": i.get("is-referenced-by-count")} for i in items]
    json.dump(out, open(OUT, "w"), indent=1)
    print("queries", len(jobs), "hits", sum(len(v) for d in out.values() for v in d.values()))


if __name__ == "__main__":
    main()
