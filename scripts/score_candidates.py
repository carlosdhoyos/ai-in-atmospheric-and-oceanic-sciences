"""Add Semantic Scholar citations to a candidates CSV and rank it for screening.

Merges arXiv and journal versions of the same work (same S2 paperId), drops papers already in the catalog, and
adds a recency-aware score so that recent papers are not buried under older ones:
    score = citations / months since publication (min 3) + venue bonus
Writes data/candidates_<since>_scored.csv sorted by score. Cached in data/cache_candidates_s2.json (resumable).

    python3 scripts/score_candidates.py data/candidates_2025-01-01.csv
"""
import csv
import datetime as dt
import json
import os
import sys

import s2

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CACHE = os.path.join(ROOT, "data", "cache_candidates_s2.json")
LITE = "title,year,venue,publicationDate,citationCount,influentialCitationCount,externalIds,publicationTypes"
# journals with a strong track record for ML-in-geoscience work get a small bonus (screening aid only)
VENUE_BONUS = {"Nature": 3, "Science": 3, "Nat Commun": 1.5, "Nat Mach Intell": 1.5, "PNAS": 1, "Sci Adv": 1,
               "npj CAS": 1, "JAMES": 1, "GRL": 1, "AIES": 1, "GMD": 0.5, "BAMS": 1, "QJRMS": 0.5, "MWR": 0.5,
               "WAF": 0.5, "JGR ML&C": 0.5, "Commun Earth Environ": 0.5, "Nat Clim Change": 1.5, "Nat Geosci": 1.5}


def main(path):
    rows = list(csv.DictReader(open(path)))
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    ids = [r["id"] for r in rows if r["id"] not in cache]
    for n, (i, rec) in enumerate(s2.batch(ids, fields=LITE, chunk=200), 1):
        cache[i] = rec
        if n % 200 == 0 or n == len(ids):
            json.dump(cache, open(CACHE, "w"))
            print(f"scored {n}/{len(ids)}", flush=True)

    catalog = json.load(open(os.path.join(ROOT, "data", "papers.json")))["papers"]
    have = {p["s2"] for p in catalog}
    today = dt.date.today()
    best = {}
    for r in rows:
        rec = cache.get(r["id"]) or {}
        pid = rec.get("paperId") or r["id"]
        if pid in have:
            continue
        date = rec.get("publicationDate") or r["date"] or f"{rec.get('year') or today.year}-06-01"
        try:
            d = dt.date.fromisoformat(date[:10] if len(date) >= 10 else date[:7] + "-15")
        except ValueError:
            d = today
        months = max(3.0, (today - d).days / 30.4)
        cites = max(int(rec.get("citationCount") or 0), int(r.get("cites") or 0))
        doi = ((rec.get("externalIds") or {}).get("DOI") or "").lower()
        venue = r["venue"] if r["venue"] != "arXiv" else (rec.get("venue") or "arXiv")
        score = cites / months + VENUE_BONUS.get(r["venue"], 0)
        out = {**r, "s2": pid if rec else "", "cites": cites, "infl": rec.get("influentialCitationCount") or 0,
               "months": round(months, 1), "venue": venue, "score": round(score, 2),
               "id": f"DOI:{doi}" if doi and not doi.startswith("10.48550") else r["id"]}
        if pid not in best or out["score"] > best[pid]["score"] or (r["source"] == "crossref" and best[pid]["source"] == "arxiv"):
            best[pid] = out
    ranked = sorted(best.values(), key=lambda x: -x["score"])
    dest = path.replace(".csv", "_scored.csv")
    with open(dest, "w", newline="") as f:
        w = csv.DictWriter(f, ["score", "cites", "infl", "months", "id", "s2", "date", "venue", "source", "title", "abstract"],
                           extrasaction="ignore")
        w.writeheader()
        w.writerows(ranked)
    print(f"{len(ranked)} unique candidates -> {dest}")


if __name__ == "__main__":
    main(sys.argv[1])
