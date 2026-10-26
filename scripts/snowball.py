"""Find papers the catalog cites but does not contain (backward citation snowballing).

Downloads the reference lists of every catalog paper from Semantic Scholar, counts how many catalog papers cite
each referenced work, and keeps those that are not yet in the catalog (datasets, scores and generic ML among them
are dropped at screening). Works for any year, so it
catches older landmark papers that keyword searches over recent windows miss. Writes
data/candidates_snowball_scored.csv in the same format as score_candidates.py, ranked by
    score = catalog papers citing it + log10(1 + total citations)
so `update.py screen-batches --file data/candidates_snowball_scored.csv` can batch it for screening.
References are cached in .update/cache_refs.json (resumable; delete it to refetch).

    python3 scripts/snowball.py [--min-refs 3] [--exclude data/candidates_snowball_scored.csv --out data/candidates_snowball2_scored.csv]
"""
import argparse
import collections
import csv
import json
import math
import os
import re

import s2
from resolve_ids import NON_FINAL_DOI

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CACHE = os.path.join(ROOT, ".update", "cache_refs.json")
OUT = os.path.join(ROOT, "data", "candidates_snowball_scored.csv")
REF_FIELDS = "references.paperId,references.title,references.year,references.venue,references.externalIds,references.citationCount"
LITE = "title,abstract,publicationDate,year,venue,externalIds,citationCount,influentialCitationCount"
# titles that look like ML; used only to report how many candidates do (model-name titles such as
# "FengWu: Pushing the Skillful Global Medium-range Weather Forecast..." carry no ML term, so it is not a filter)
ML = re.compile(r"neural|learning|machine|deep|\bai\b|artificial intelligence|data[- ]driven|emulat|surrogate|"
                r"random forest|support vector|boost|decision tree|gaussian process|kernel|lstm|convolution|transformer|"
                r"diffusion model|generative|\bgan\b|autoencoder|reservoir comput|self[- ]organi[sz]ing|clustering|"
                r"equation discovery|sparse regression|operator|foundation model|explainab|interpretab|attention",
                re.I)


def main(a):
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    catalog = json.load(open(os.path.join(ROOT, "data", "papers.json")))["papers"]
    ids = [p["s2"] for p in catalog if p.get("s2") and p["s2"] not in cache]
    for n, (pid, rec) in enumerate(s2.batch(ids, fields=REF_FIELDS, chunk=20), 1):
        cache[pid] = [r for r in ((rec or {}).get("references") or []) if r.get("paperId")]
        if n % 100 == 0 or n == len(ids):
            json.dump(cache, open(CACHE, "w"))
            print(f"references {n}/{len(ids)}", flush=True)

    have = {p["s2"] for p in catalog}
    have_doi = {(p.get("doi") or "").lower() for p in catalog} - {""}
    have_arxiv = {p.get("arxiv") for p in catalog} - {None, ""}
    seen = set()  # candidates already screened in an earlier round
    for path in a.exclude:
        seen |= {row["s2"] for row in csv.DictReader(open(path))}
    count, meta = collections.Counter(), {}
    for refs in cache.values():
        for r in {r["paperId"]: r for r in refs}.values():
            count[r["paperId"]] += 1
            meta[r["paperId"]] = r
    keep = []
    for pid, k in count.items():
        r = meta[pid]
        ext = r.get("externalIds") or {}
        if (k < a.min_refs or pid in have or (ext.get("DOI") or "").lower() in have_doi
                or ext.get("ArXiv") in have_arxiv or NON_FINAL_DOI.match((ext.get("DOI") or "").lower())
                or pid in seen):
            continue
        keep.append(pid)
    n_ml = sum(bool(ML.search(meta[p].get("title") or "")) for p in keep)
    print(f"{len(count)} referenced works; {len(keep)} cited by >= {a.min_refs} catalog papers, not in catalog and not "
          f"screened before ({n_ml} with ML terms in the title)")

    detail = dict(s2.batch(keep, fields=LITE, chunk=200)) if keep else {}
    rows = []
    for pid in keep:
        r, d = meta[pid], detail.get(pid) or {}
        ext = d.get("externalIds") or r.get("externalIds") or {}
        doi, arx = (ext.get("DOI") or "").lower(), ext.get("ArXiv")
        cites = int(d.get("citationCount") or r.get("citationCount") or 0)
        rows.append({
            "score": round(count[pid] + math.log10(1 + cites), 2), "cites": cites,
            "infl": d.get("influentialCitationCount") or 0, "months": "",
            "id": f"DOI:{doi}" if doi and not doi.startswith("10.48550") else (f"ARXIV:{arx}" if arx else pid),
            "s2": pid, "date": d.get("publicationDate") or str(r.get("year") or ""),
            "venue": d.get("venue") or r.get("venue") or ("arXiv" if arx else ""), "source": f"cited_by_{count[pid]}",
            "title": d.get("title") or r.get("title"), "abstract": (d.get("abstract") or "").replace("\n", " "),
        })
    rows.sort(key=lambda x: -x["score"])
    with open(a.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else ["score"])
        w.writeheader()
        w.writerows(rows)
    years = collections.Counter((r["date"] or "?")[:4] for r in rows)
    print(f"wrote {a.out}: {len(rows)} candidates; by year: {dict(sorted(years.items()))}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--exclude", nargs="*", default=[], help="earlier candidate CSVs whose rows were already screened")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--min-refs", type=int, default=3, help="minimum number of catalog papers citing a work")
    main(ap.parse_args())
