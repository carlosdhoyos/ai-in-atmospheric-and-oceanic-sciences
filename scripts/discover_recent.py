"""Find recent ML papers in atmospheric and oceanic science that are not yet in the catalog.

Sources: arXiv (physics.ao-ph and cross-lists, plus cs.LG/stat.ML with weather/climate/ocean terms) and Crossref
(key journals by ISSN). Output: data/candidates_<since>.csv, one row per paper not already in the catalog, with
an ID usable in data/additions.tsv (DOI:... or ARXIV:...). Screening the candidates is a judgment step; see
.claude/skills/update-catalog/SKILL.md.

    python3 scripts/discover_recent.py --since 2025-01-01 [--until 2026-12-31]
"""
import argparse
import csv
import json
import os
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET

from resolve_ids import get, norm

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ML = (r"deep learning|machine learning|neural|transformer|diffusion model|generative|graph network|emulat|"
      r"data-driven|foundation model|artificial intelligence|\bAI\b|random forest|super-resolution|operator learning|"
      r"learned|U-?Net|LSTM|convolutional|reinforcement")
# A candidate must name the atmosphere/ocean explicitly: one of these in the title, or two different ones in the abstract
STRONG = (r"weather|climat|atmospher|ocean|sea[- ]ice|sea surface|sea level|precipitation|rainfall|cloud|convecti|"
          r"\bENSO\b|el ni[nñ]o|monsoon|tropical cyclone|hurricane|typhoon|nowcast|reanalysis|ERA5|downscal|parameteri[sz]|"
          r"aerosol|air quality|pm2\.5|meteorolog|earth system|drought|heat ?wave|storm surge|\bMJO\b|madden|"
          r"data assimilation|teleconnection|lightning|snowfall|tornado|hail|extratropical|stratosph|tropospher|"
          r"boundary layer|mesoscale|subseasonal|sub-seasonal|seasonal forecast|numerical weather|\bNWP\b|\bGCM\b|cmip|"
          r"weatherbench|graphcast|radiative transfer|wind field|surface wind|ocean wave|significant wave height|"
          r"marine heatwave|eddy|eddies|arctic|antarctic")
# Neighbouring fields that share vocabulary but are out of scope (see the screening brief)
EXCLUDE = (r"wind (power|farm|turbine|energy)|solar (power|irradiance forecast|energy)|photovolt|electricity|"
           r"power (load|grid|system)|traffic|stock|financ|crop yield|agricultur|epidem|covid|disease|building energy|"
           r"load forecasting|battery|land use|land cover|wildfire spread|hydropower|streamflow|groundwater|"
           r"soil moisture|flood inundation|river discharge|exoplanet|martian|solar wind|space weather|ionospher")


def relevant(title, abstract):
    if re.search(EXCLUDE, title, re.I) or not re.search(ML, title + " " + abstract, re.I):
        return False
    return bool(re.search(STRONG, title, re.I)) or len({m.lower() for m in re.findall(STRONG, abstract, re.I)}) >= 2
ARXIV_QUERIES = [
    'cat:physics.ao-ph AND (abs:"deep learning" OR abs:"machine learning" OR abs:"neural" OR abs:"transformer" OR '
    'abs:"diffusion" OR abs:"data-driven" OR abs:"emulator" OR abs:"foundation model" OR abs:"artificial intelligence")',
    '(cat:cs.LG OR cat:stat.ML OR cat:cs.AI) AND (ti:weather OR ti:climate OR ti:precipitation OR ti:ocean OR '
    'ti:atmospheric OR ti:forecasting OR ti:"sea ice" OR ti:cyclone OR ti:"earth system" OR ti:downscaling)',
]
JOURNALS = {  # ISSN -> short name
    "1942-2466": "JAMES", "1944-8007": "GRL", "2769-7525": "AIES", "1991-9603": "GMD", "2397-3722": "npj CAS",
    "1520-0493": "MWR", "1520-0434": "WAF", "1477-870X": "QJRMS", "2041-1723": "Nat Commun", "1476-4687": "Nature",
    "1095-9203": "Science", "1520-0477": "BAMS", "2993-5210": "JGR ML&C", "2634-4602": "Env Data Sci",
    "2662-4435": "Commun Earth Environ", "2522-5839": "Nat Mach Intell", "1752-0908": "Nat Geosci",
    "1091-6490": "PNAS", "1520-0442": "J Climate", "1463-5003": "Ocean Modelling", "1994-0424": "The Cryosphere",
    "2375-2548": "Sci Adv", "1758-6798": "Nat Clim Change", "2328-4277": "Earth's Future", "2576-604X": "AGU Advances",
}
CROSSREF_TERMS = "deep learning machine learning neural network artificial intelligence data-driven emulator"


def arxiv(since, until):
    out, ns = [], {"a": "http://www.w3.org/2005/Atom"}
    window = f"submittedDate:[{since.replace('-', '')}0000 TO {until.replace('-', '')}2359]"
    for q in ARXIV_QUERIES:
        start = 0
        while True:
            params = urllib.parse.urlencode({"search_query": f"({q}) AND {window}", "start": start, "max_results": 200,
                                             "sortBy": "submittedDate", "sortOrder": "descending"})
            raw = get(f"https://export.arxiv.org/api/query?{params}")
            entries = ET.fromstring(raw).findall("a:entry", ns) if raw else []
            for e in entries:
                aid = re.sub(r"v\d+$", "", e.find("a:id", ns).text.rsplit("/abs/", 1)[-1])
                doi = e.find("{http://arxiv.org/schemas/atom}doi")
                out.append({"id": f"ARXIV:{aid}", "doi": (doi.text.lower() if doi is not None else ""),
                            "title": " ".join(e.find("a:title", ns).text.split()),
                            "date": e.find("a:published", ns).text[:10], "venue": "arXiv",
                            "abstract": " ".join(e.find("a:summary", ns).text.split()),
                            "source": "arxiv"})
            print(f"arxiv q{ARXIV_QUERIES.index(q)} start={start}: {len(entries)}", flush=True)
            if len(entries) < 200:
                break
            start += 200
            time.sleep(3)  # arXiv asks for one request every 3 s
        time.sleep(3)
    return out


def crossref(since, until):
    out = []
    for issn, name in JOURNALS.items():
        cursor = "*"
        for _ in range(5):  # up to 5 pages of 100 per journal
            params = urllib.parse.urlencode({
                "query.bibliographic": CROSSREF_TERMS, "rows": 100, "cursor": cursor,
                "filter": f"issn:{issn},from-pub-date:{since},until-pub-date:{until},type:journal-article",
                "select": "DOI,title,container-title,issued,abstract,is-referenced-by-count"})
            raw = get(f"https://api.crossref.org/works?{params}")
            if not raw:
                break
            msg = json.loads(raw)["message"]
            for it in msg["items"]:
                title = " ".join((it.get("title") or [""])[0].split())
                abstract = re.sub(r"<[^>]+>", " ", it.get("abstract") or "")
                if not re.search(ML, title + " " + abstract, re.I):
                    continue
                parts = (it.get("issued", {}).get("date-parts") or [[None]])[0]
                out.append({"id": f"DOI:{it['DOI'].lower()}", "doi": it["DOI"].lower(), "title": title,
                            "date": "-".join(str(x).zfill(2) for x in parts if x), "venue": name,
                            "abstract": " ".join(abstract.split()), "source": "crossref",
                            "cites": it.get("is-referenced-by-count") or 0})
            if len(msg["items"]) < 100:
                break
            cursor = msg.get("next-cursor")
        print(f"crossref {name}: {sum(1 for o in out if o['venue'] == name)}", flush=True)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", required=True)
    ap.add_argument("--until", default=time.strftime("%Y-%m-%d"))
    a = ap.parse_args()

    cat = json.load(open(os.path.join(ROOT, "data", "papers.json")))["papers"]
    have_titles = {norm(p["title"]) for p in cat}
    have_ids = {f"DOI:{p['doi']}" for p in cat if p["doi"]} | {f"ARXIV:{p['arxiv']}" for p in cat if p["arxiv"]}

    rows, seen = [], {}
    for r in crossref(a.since, a.until) + arxiv(a.since, a.until):
        if not relevant(r["title"], r["abstract"]):
            continue
        key = norm(r["title"])
        if key in have_titles or r["id"] in have_ids or (r["doi"] and f"DOI:{r['doi']}" in have_ids):
            continue
        if key in seen:  # prefer the journal record, keep the arXiv id as an alias
            prev = seen[key]
            if prev["source"] == "arxiv" and r["source"] == "crossref":
                r["alias"] = prev["id"]
                seen[key] = r
            elif r["source"] == "arxiv":
                prev["alias"] = r["id"]
            continue
        seen[key] = r
    rows = sorted(seen.values(), key=lambda r: r["date"], reverse=True)
    path = os.path.join(ROOT, "data", f"candidates_{a.since}.csv")
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, ["id", "alias", "date", "venue", "source", "cites", "title", "abstract"], extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({**r, "abstract": r["abstract"][:1200]})
    print(f"{len(rows)} new candidates -> {path}")


if __name__ == "__main__":
    main()
