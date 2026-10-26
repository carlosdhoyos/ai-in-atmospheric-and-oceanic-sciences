"""Find early ML/AI papers (by default 1980-1999) with Semantic Scholar keyword search.

Window-based discovery (discover_recent.py) and citation snowballing (snowball.py) both under-sample early work:
older indexes are thin and today's papers rarely cite the first neural-network, expert-system and pattern-recognition
studies. This script pairs the methods of that era with the catalog's domains, keeps the most cited hits per query,
drops papers already in the catalog, and writes data/candidates_era_<years>_scored.csv in the usual format
(score = log10(1 + citations) + number of queries that found the paper), ready for update.py screen-batches.

    python3 scripts/discover_era.py --years 1980-1999
"""
import argparse
import collections
import csv
import json
import math
import os
import re

import s2

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FIELDS = "title,abstract,year,venue,publicationDate,externalIds,citationCount,influentialCitationCount"
METHODS = ['"neural network"', '"neural networks"', '"expert system"', '"artificial intelligence"',
           '"pattern recognition"', '"machine learning"', '"fuzzy logic"', '"genetic algorithm"',
           '"self-organizing map"', '"support vector"', '"decision tree"', '"knowledge-based"',
           '"nearest neighbor"', '"classification tree"', '"genetic programming"', '"nonlinear principal component"',
           '"nonlinear canonical correlation"', '"perceptron"']
DOMAINS = ['weather', 'forecasting', 'precipitation', 'rainfall', 'cloud', 'satellite', 'radar', 'thunderstorm',
           'tornado', 'hail', 'fog', 'hurricane', 'wind', 'ocean', '"sea surface temperature"', '"El Nino"',
           'ENSO', '"sea ice"', 'climate', 'atmospheric', 'meteorology', 'ozone', '"air pollution"',
           'streamflow', 'runoff', 'flood', 'hydrology', 'rainfall-runoff', 'drought', 'evapotranspiration',
           '"soil moisture"', '"solar radiation"', 'groundwater', '"crop yield"', 'reservoir']
GEO = re.compile(r"weather|forecast|precipit|rain|cloud|satellite|radar|storm|tornado|hail|fog|hurrican|cyclone|wind|"
                 r"ocean|sea|el ni|enso|ice|climat|atmospher|meteor|ozone|pollut|stream|runoff|flood|hydrolog|drought|"
                 r"evapotransp|soil moisture|solar|groundwater|crop|reservoir|river|water|snow|temperature", re.I)


def main(a):
    os.makedirs(os.path.join(ROOT, ".update"), exist_ok=True)
    raw_path = os.path.join(ROOT, ".update", f"raw_era_{a.years}.json")
    raw = json.load(open(raw_path)) if os.path.exists(raw_path) else {}
    queries = [f"{m} + {d}" for m in METHODS for d in DOMAINS]
    for n, q in enumerate(queries, 1):
        if q in raw:
            continue
        raw[q] = s2.bulk_search(q, year=a.years, limit=a.per_query, fields=FIELDS)
        if n % 25 == 0 or n == len(queries):
            json.dump(raw, open(raw_path, "w"))
            print(f"queries {n}/{len(queries)}", flush=True)
    json.dump(raw, open(raw_path, "w"))

    catalog = json.load(open(os.path.join(ROOT, "data", "papers.json")))["papers"]
    have = {p["s2"] for p in catalog}
    hits, rec = collections.Counter(), {}
    for res in raw.values():
        for r in res:
            if r.get("paperId") and r["paperId"] not in have and GEO.search(r.get("title") or ""):
                hits[r["paperId"]] += 1
                rec[r["paperId"]] = r
    rows = []
    for pid, k in hits.items():
        r = rec[pid]
        ext = r.get("externalIds") or {}
        doi, cites = (ext.get("DOI") or "").lower(), int(r.get("citationCount") or 0)
        if cites < a.min_cites:
            continue
        rows.append({"score": round(math.log10(1 + cites) + k, 2), "cites": cites,
                     "infl": r.get("influentialCitationCount") or 0, "months": "",
                     "id": f"DOI:{doi}" if doi else (f"ARXIV:{ext['ArXiv']}" if ext.get("ArXiv") else pid), "s2": pid,
                     "date": r.get("publicationDate") or str(r.get("year") or ""), "venue": r.get("venue") or "",
                     "source": f"era_queries_{k}", "title": r.get("title"),
                     "abstract": (r.get("abstract") or "").replace("\n", " ")})
    rows.sort(key=lambda x: -x["score"])
    out = os.path.join(ROOT, "data", f"candidates_era_{a.years}_scored.csv")
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    years = collections.Counter((r["date"] or "?")[:3] + "0s" for r in rows)
    print(f"wrote {out}: {len(rows)} candidates (>= {a.min_cites} citations); by decade: {dict(sorted(years.items()))}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default="1980-1999", help="Semantic Scholar year range, e.g. 1980-1999")
    ap.add_argument("--per-query", type=int, default=100, help="most-cited hits kept per query")
    ap.add_argument("--min-cites", type=int, default=5)
    main(ap.parse_args())
