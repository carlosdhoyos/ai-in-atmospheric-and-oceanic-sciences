"""Find ML papers that are not yet in the catalog, for one scope.

Scopes:
  core     atmosphere, ocean, sea ice and climate (arXiv physics.ao-ph and ML categories + ~25 key journals)
  applied  hydrology and water resources, energy, and agriculture, kept only when tied to water, weather or climate
           (domain journals such as WRR, HESS, J Hydrology, Applied Energy, Renewable Energy, Agricultural and Forest
           Meteorology, plus the Nature family and PNAS)

Output: data/candidates_<since>.csv (core) or data/candidates_applied_<since>.csv, one row per paper not already in
the catalog, with an ID usable in data/additions.tsv (DOI:... or ARXIV:...). Screening is a judgment step; see
.claude/skills/update-catalog/SKILL.md.

    python3 scripts/discover_recent.py --since 2025-01-01 [--until 2026-12-31] [--scope core|applied]
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
    return bool(re.search(STRONG, title, re.I)) or count_terms(STRONG, abstract) >= 2
# Applied scope: a domain term (hydrology, energy, agriculture) plus a link to water, weather or climate
DOMAIN_HYDRO = (r"hydrolog|streamflow|stream flow|runoff|rainfall-runoff|flood|groundwater|soil moisture|"
                r"evapotranspiration|snow water|snowmelt|water resource|reservoir (operation|inflow)|river (flow|discharge)|"
                r"catchment|watershed|baseflow|water table|terrestrial water storage|GRACE|drought|water level|"
                r"water supply|inundation")
DOMAIN_ENERGY = (r"wind power|wind energy|wind farm|wind turbine|solar power|solar energy|solar irradiance|"
                 r"photovolt|\bPV\b|irradiance forecast|energy (demand|load|consumption)|electricity (demand|load|price)|"
                 r"load forecasting|hydropower|power system|renewable energy|energy system")
DOMAIN_AGRI = (r"crop|yield|agricultur|wheat|maize|corn\b|rice|soybean|irrigation|farm|grassland|pasture|"
               r"food security|phenolog|vegetation productivity|gross primary production|\bGPP\b")
LINK_WATER_CLIMATE = (r"weather|climat|meteorolog|precipitation|rainfall|temperature|hydrolog|water|drought|flood|"
                      r"evapotranspiration|\bNWP\b|numerical weather|reanalysis|ERA5|CMIP|heat ?wave|snow|monsoon")
LINK_WEATHER = (r"weather|climat|meteorolog|\bNWP\b|numerical weather|reanalysis|ERA5|irradiance|wind speed|cloud|"
                r"temperature|precipitation|satellite|sky image|CMIP|forecast")
EXCLUDE_APPLIED = (r"stock|financ|traffic|epidem|covid|disease|medical|pest detection|weed|leaf disease|plant disease|"
                   r"fruit|livestock|battery|electric vehicle|building energy|smart grid security|fault diagnosis|"
                   r"water quality|wastewater|drinking water|leak detection|pipe|sewer|exoplanet|ionospher")


def count_terms(rx, text):
    return len({m.group(0).lower() for m in re.finditer(rx, text, re.I)})


def relevant_applied(title, abstract):
    text = title + " " + abstract
    if re.search(EXCLUDE_APPLIED, title, re.I) or not re.search(ML, text, re.I):
        return False
    hits = {name for name, rx in (("hydro", DOMAIN_HYDRO), ("energy", DOMAIN_ENERGY), ("agri", DOMAIN_AGRI))
            if re.search(rx, title, re.I) or count_terms(rx, abstract) >= 2}
    if not hits:
        return False
    if hits == {"energy"}:  # energy work counts only when it is about weather/climate-driven prediction
        return count_terms(LINK_WEATHER, text) >= 2
    return count_terms(LINK_WATER_CLIMATE, text) >= 2


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

APPLIED_ARXIV = [
    '(cat:cs.LG OR cat:stat.ML OR cat:cs.AI OR cat:physics.geo-ph OR cat:physics.ao-ph OR cat:eess.SP OR cat:eess.SY) AND '
    '(ti:streamflow OR ti:runoff OR ti:flood OR ti:hydrological OR ti:hydrology OR ti:groundwater OR ti:"soil moisture" OR '
    'ti:evapotranspiration OR ti:drought OR ti:"wind power" OR ti:"solar irradiance" OR ti:"solar power" OR '
    'ti:photovoltaic OR ti:"crop yield" OR ti:irrigation OR ti:snowmelt)',
]
APPLIED_JOURNALS = {
    "1944-7973": "WRR", "1607-7938": "HESS", "0022-1694": "J Hydrol", "1525-7541": "J Hydrometeorol",
    "2731-6084": "Nat Water", "1099-1085": "Hydrol Process", "1364-8152": "Env Model Softw", "1748-9326": "ERL",
    "0306-2619": "Applied Energy", "0960-1481": "Renewable Energy", "0038-092X": "Solar Energy", "0360-5442": "Energy",
    "2666-5468": "Energy and AI", "2058-7546": "Nat Energy", "1099-1824": "Wind Energy", "1364-0321": "RSER",
    "0168-1923": "Agric For Meteorol", "0378-3774": "Agric Water Manag", "2662-1355": "Nat Food",
    "0378-4290": "Field Crops Res", "0168-1699": "Comput Electron Agric", "2041-1723": "Nat Commun",
    "1476-4687": "Nature", "1091-6490": "PNAS", "2375-2548": "Sci Adv", "1758-6798": "Nat Clim Change",
    "2328-4277": "Earth's Future", "2662-4435": "Commun Earth Environ", "1095-9203": "Science",
}
APPLIED_TERMS = ("deep learning machine learning neural network artificial intelligence hydrology streamflow flood "
                 "forecasting climate weather crop yield wind solar")
SCOPES = {
    "core": {"arxiv": None, "journals": None, "terms": None, "relevant": relevant},
    "applied": {"arxiv": APPLIED_ARXIV, "journals": APPLIED_JOURNALS, "terms": APPLIED_TERMS, "relevant": relevant_applied},
}


def arxiv(since, until, queries=None):
    out, ns = [], {"a": "http://www.w3.org/2005/Atom"}
    queries = queries or ARXIV_QUERIES
    window = f"submittedDate:[{since.replace('-', '')}0000 TO {until.replace('-', '')}2359]"
    for q in queries:
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
            print(f"arxiv q{queries.index(q)} start={start}: {len(entries)}", flush=True)
            if len(entries) < 200:
                break
            start += 200
            time.sleep(3)  # arXiv asks for one request every 3 s
        time.sleep(3)
    return out


def crossref(since, until, journals=None, terms=None):
    out = []
    for issn, name in (journals or JOURNALS).items():
        cursor = "*"
        for _ in range(5):  # up to 5 pages of 100 per journal
            params = urllib.parse.urlencode({
                "query.bibliographic": terms or CROSSREF_TERMS, "rows": 100, "cursor": cursor,
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
    ap.add_argument("--scope", choices=sorted(SCOPES), default="core")
    a = ap.parse_args()
    sc = SCOPES[a.scope]

    cat = json.load(open(os.path.join(ROOT, "data", "papers.json")))["papers"]
    have_titles = {norm(p["title"]) for p in cat}
    have_ids = {f"DOI:{p['doi']}" for p in cat if p["doi"]} | {f"ARXIV:{p['arxiv']}" for p in cat if p["arxiv"]}

    # raw results are kept so that filtering can be rerun without downloading again
    raw_path = os.path.join(ROOT, ".update", f"raw_{a.scope}_{a.since}_{a.until}.json")
    if os.path.exists(raw_path):
        raw = json.load(open(raw_path))
    else:
        raw = crossref(a.since, a.until, sc["journals"], sc["terms"]) + arxiv(a.since, a.until, sc["arxiv"])
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        json.dump(raw, open(raw_path, "w"))
    rows, seen = [], {}
    for r in raw:
        if not sc["relevant"](r["title"], r["abstract"]):
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
    prefix = "candidates_" if a.scope == "core" else f"candidates_{a.scope}_"
    path = os.path.join(ROOT, "data", f"{prefix}{a.since}.csv")
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, ["id", "alias", "date", "venue", "source", "cites", "title", "abstract"], extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({**r, "abstract": r["abstract"][:1200]})
    print(f"{len(rows)} new candidates -> {path}")


if __name__ == "__main__":
    main()
