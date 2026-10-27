"""Count, per publication year, the Semantic Scholar papers that match the catalog's search vocabulary.

The catalog is a sample whose depth differs between searches (see data/updates.md), so its papers-per-year bars do
not show how the field grew. This script records an independent reference: the number of papers each year matching
one query that ORs every method term of both era vocabularies (scripts/discover_era.py) with every domain term. The
query also matches off-topic papers (e.g. power transformers, wind loads), so the counts are an index of the
field's growth, not a census. Output: data/field_volume.json, embedded in the pages and used by the EDA.

    python3 scripts/field_volume.py            # 1980 to the current year
    python3 scripts/field_volume.py --from 2020
"""
import argparse
import datetime as dt
import json
import os
import urllib.parse

import s2
from discover_era import DOMAINS, METHODS, MODERN_METHODS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "data", "field_volume.json")


def main(a):
    methods = list(dict.fromkeys(METHODS + MODERN_METHODS))
    query = f"({' | '.join(methods)}) + ({' | '.join(DOMAINS)})"
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    counts = {} if old.get("query") != query else old.get("counts", {})
    this_year = dt.date.today().year
    for y in range(a.start, this_year + 1):
        res = s2._request(f"{s2.API}/paper/search/bulk?" + urllib.parse.urlencode(
            {"query": query, "year": str(y), "fields": "year"}))
        if res and res.get("total") is not None:
            counts[str(y)] = res["total"]
        print(y, counts.get(str(y)), flush=True)
    json.dump({"retrieved": dt.date.today().isoformat(), "query": query,
               "counts": dict(sorted(counts.items()))}, open(OUT, "w"), indent=1)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="start", type=int, default=1980)
    main(ap.parse_args())
