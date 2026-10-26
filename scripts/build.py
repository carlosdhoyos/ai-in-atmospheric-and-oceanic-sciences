"""Build data/papers.json, papers.bib and index.html from the resolved caches.

Pipeline:
  1. resolve_ids.py  -> data/cache_ids.json   (seed title -> Crossref DOI / arXiv id)
  2. discover.py     -> data/cache_discovery.json (highly cited candidates, screened into data/additions.tsv)
  3. build.py        -> one Semantic Scholar batch call for metadata + citation counts, then outputs.
"""
import datetime as dt
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import s2
from resolve_ids import sim
from taxonomy import categorize, load_overrides

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
D = lambda *p: os.path.join(ROOT, "data", *p)

TOPICS = {
    "review": "Reviews & perspectives",
    "weather": "Medium-range weather",
    "probabilistic": "Ensembles & generative",
    "foundation": "Foundation models",
    "nowcasting": "Nowcasting",
    "postprocessing": "Post-processing",
    "s2s": "S2S, ENSO & MJO",
    "climate": "Climate emulation & detection",
    "parameterization": "Parameterization & hybrid models",
    "downscaling": "Downscaling",
    "da": "Data assimilation",
    "remote_sensing": "Remote sensing & clouds",
    "extremes": "Extremes & tropical cyclones",
    "xai": "Explainability & causality",
    "ocean": "Ocean",
    "seaice": "Sea ice",
    "chemistry": "Air quality & chemistry",
    "benchmarks": "Benchmarks & datasets",
    "methods": "Core ML methods",
}
CONFERENCES = re.compile(r"neural information processing|neurips|nips|international conference on machine learning|icml|"
                         r"learning representations|iclr|knowledge discovery|kdd|aaai|computer vision|cvpr|iccv|"
                         r"artificial intelligence and statistics|aistats|supercomputing|\bsc\b|igarss|ijcai", re.I)
PREPRINT_VENUES = re.compile(r"arxiv|essoar|ess open archive|research square|preprint|ssrn|biorxiv|egusphere", re.I)


PAGES = [
    {"mode": "catalog", "file": "index.html", "fragment": "ai-aos-papers.html", "title": "Atmosphere–Ocean AI Papers",
     "eyebrow": "Literature catalog", "h1": "AI in Atmospheric &amp; Oceanic Sciences",
     "lede": "Peer-reviewed papers and arXiv preprints on machine learning for weather, climate, ocean and sea ice. "
             "Citation counts come from Semantic Scholar and Crossref. Search titles, authors and abstracts, then filter "
             "by subfield, year or publication type.",
     "xlink": '<a class="back" href="eda.html">Exploratory analysis →</a>'},
    {"mode": "eda", "file": "eda.html", "fragment": "ai-aos-eda.html", "title": "Atmosphere–Ocean AI Trends",
     "eyebrow": "Exploratory analysis", "h1": "How AI for the atmosphere and ocean is changing",
     "lede": "An interactive analysis of the catalog: which architectures, goals and data dominate, since when, what is "
             "rising or fading, what limits current models and what the papers say comes next. Every chart follows the "
             "filters, and any chart element can be clicked to slice the data.",
     "xlink": '<a class="back" href="index.html">Paper catalog →</a>'},
]


def clean_title(t):
    t = t.replace("{\\deg}", "°").replace("\\deg", "°")
    return re.sub(r"\s+", " ", t).strip()


def load_tsv(path):
    if not os.path.exists(path):
        return []
    return [l.rstrip("\n").split("\t") for l in open(path) if l.strip() and not l.startswith("#")]


def main():
    ids = json.load(open(D("cache_ids.json")))
    seeds = load_tsv(D("seeds.tsv"))
    # overrides: title<TAB>ID (DOI:..., ARXIV:..., or S2 paperId) for seeds the automatic matching missed
    overrides = {r[0]: r[1] for r in load_tsv(D("overrides.tsv"))}
    # additions: topic<TAB>S2-style ID<TAB>note, screened by hand from the discovery pass
    additions = load_tsv(D("additions.tsv"))

    entries = []  # (topics, [lookup ids], crossref record or None)
    for topic, title in seeds:
        c = ids.get(title, {})
        cr = c.get("crossref") if (c.get("crossref") or {}).get("score", 0) >= 0.9 else None
        ax = c.get("arxiv") if (c.get("arxiv") or {}).get("score", 0) >= 0.9 else None
        look = []
        if title in overrides:
            look.append(overrides[title])
        if cr:
            look.append("DOI:" + cr["doi"])
        if ax:
            look.append("ARXIV:" + ax["id"])
        entries.append({"seed": title, "topics": [topic], "look": look, "cr": cr, "check": True})
    for topic, pid, *_ in additions:
        entries.append({"seed": pid, "topics": topic.split(","), "look": [pid], "cr": None, "check": False})

    fetched = False  # True when this run downloads anything new from Semantic Scholar
    cache_path = D("cache_s2.json")
    s2cache = json.load(open(cache_path)) if os.path.exists(cache_path) else {}
    for e in entries:
        if not e["look"]:
            key = "TITLE:" + e["seed"]
            if key not in s2cache:
                s2cache[key] = s2.match(e["seed"]); fetched = True
                json.dump(s2cache, open(cache_path, "w"))
            e["look"] = [key]
    all_ids = sorted({i for e in entries for i in e["look"]})
    missing = [i for i in all_ids if i not in s2cache]
    fetched = fetched or bool(missing)
    for n, (i, rec) in enumerate(s2.batch(missing), 1):
        s2cache[i] = rec
        if n % 50 == 0 or n == len(missing):
            json.dump(s2cache, open(cache_path, "w"))
            print(f"fetched {n}/{len(missing)}", flush=True)

    papers, unresolved, mismatched = {}, [], []
    for e in entries:
        recs = [s2cache.get(i) for i in e["look"]]
        recs = [r for r in recs if r]
        if e["check"]:  # drop records whose title does not match the seed (wrong ID or bad fuzzy match)
            bad = [r for r in recs if sim(e["seed"], r["title"]) < 0.8]
            mismatched.extend((e["seed"], r["title"]) for r in bad)
            recs = [r for r in recs if r not in bad]
        if not recs and e["check"]:  # identifiers missing or wrong: fall back to a title match
            key = "TITLE:" + e["seed"]
            if key not in s2cache:
                s2cache[key] = s2.match(e["seed"]); fetched = True
                json.dump(s2cache, open(cache_path, "w"))
            r = s2cache[key]
            recs = [r] if r and sim(e["seed"], r["title"]) >= 0.8 else []
        if not recs:
            unresolved.append(e["seed"])
            continue
        # Journal and arXiv versions are sometimes separate S2 records: keep the most cited one's
        # metadata and fill identifiers from the others.
        recs.sort(key=lambda r: r.get("citationCount") or 0, reverse=True)
        main = recs[0]
        ext = {}
        for r in reversed(recs):
            ext.update({k: v for k, v in (r.get("externalIds") or {}).items() if v})
        doi = (ext.get("DOI") or "").lower() or None
        if doi and doi.startswith("10.48550/"):
            doi = None
        arxiv = ext.get("ArXiv")
        cr = e["cr"]
        jr = main.get("journal") or {}
        s2venue = main.get("venue") or jr.get("name") or ""
        types = set(main.get("publicationTypes") or [])
        if cr and cr.get("type") == "journal-article" and not PREPRINT_VENUES.search(cr["venue"]):
            kind, venue = "journal", cr["venue"]
        elif cr and cr.get("type") == "proceedings-article" or CONFERENCES.search(s2venue) or "Conference" in types:
            kind, venue = "conference", (s2venue if s2venue and not PREPRINT_VENUES.search(s2venue) else (cr or {}).get("venue", ""))
        elif doi and not PREPRINT_VENUES.search(s2venue or ""):
            kind, venue = "journal", s2venue or jr.get("name") or ""
        elif arxiv:
            kind, venue = "preprint", "arXiv"
        else:
            kind, venue = ("journal" if doi else "preprint"), s2venue or "Preprint"
        if not venue:
            venue = "arXiv" if arxiv else "Preprint"
        cites = max([r.get("citationCount") or 0 for r in recs] + [(cr or {}).get("cites") or 0])
        pid = main["paperId"]
        p = papers.get(pid)
        if p:  # same paper listed under several topics
            p["topics"] = sorted(set(p["topics"]) | set(e["topics"]), key=list(TOPICS).index)
            continue
        pdf = (main.get("openAccessPdf") or {}).get("url") or None
        papers[pid] = {
            "id": pid[:12], "s2": pid,
            "title": clean_title(main["title"]),
            "authors": [a["name"] for a in main.get("authors") or []],
            "year": main.get("year") or int((main.get("publicationDate") or "0000")[:4]) or
                    next((r.get("year") for r in recs if r.get("year")), 0),
            "date": main.get("publicationDate"),
            "venue": venue, "kind": kind,
            "volume": (jr.get("volume") or "").strip() or None,
            "pages": re.sub(r"\s+", "", jr.get("pages") or "") or None,
            "doi": doi, "arxiv": arxiv, "pdf": pdf,
            "cites": cites, "infl": main.get("influentialCitationCount") or 0,
            "abstract": (main.get("abstract") or "").strip() or None,
            "topics": e["topics"],
        }

    out = sorted(papers.values(), key=lambda p: -p["cites"])
    # Structured summaries (goal, architecture, data, result, open work, issues), keyed by S2 paperId
    summaries = json.load(open(D("summaries.json"))) if os.path.exists(D("summaries.json")) else {}
    for p in out:
        if p["s2"] in summaries:
            p["summary"] = summaries[p["s2"]]
    # Homogenized categories (same rules as the DuckDB database) for the Insights view
    cats = categorize(out, summaries, load_overrides(D("category_overrides.csv")))
    keep = ("paper_type", "venue_family", "probabilistic", "model_family", "arch_group", "approach", "data_source",
            "task", "issue_theme", "open_theme")
    for p in out:
        p["cat"] = {k: cats[p["s2"]][k] for k in keep}
    # The retrieval date shown on the pages only advances when this run fetched new metadata/citations
    previous = json.load(open(D("papers.json"))).get("retrieved") if os.path.exists(D("papers.json")) else None
    retrieved = dt.date.today().isoformat() if fetched or not previous else previous
    json.dump({"retrieved": retrieved, "topics": TOPICS, "papers": out},
              open(D("papers.json"), "w"), indent=1, ensure_ascii=False)

    template = open(os.path.join(ROOT, "scripts", "template.html")).read()
    frag_dir = os.environ.get("FRAGMENT_DIR")
    for page in PAGES:
        blob = json.dumps({"retrieved": retrieved, "topics": TOPICS, "papers": out, "page": {"mode": page["mode"]}},
                          ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        tpl = template.replace("/*DATA*/", blob)
        for k in ("TITLE", "EYEBROW", "H1", "LEDE"):
            tpl = tpl.replace(f"__{k}__", page[k.lower()])
        # Standalone page for the repo / GitHub Pages, with a link to its sibling page
        repo = tpl.replace("__XLINK__", page["xlink"])
        head, _, body = repo.partition('<div class="wrap">')
        open(os.path.join(ROOT, page["file"]), "w").write(
            "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
            + head + "</head>\n<body>\n<div class=\"wrap\">" + body + "</body>\n</html>\n")
        # The artifact viewer wraps a bare fragment itself; sibling links are relative files, so they are dropped there
        if frag_dir:
            open(os.path.join(frag_dir, page["fragment"]), "w").write(tpl.replace("__XLINK__", ""))

    write_summaries_md(out)
    with open(os.path.join(ROOT, "papers.bib"), "w") as f:
        for p in out:
            f.write(bibtex(p) + "\n\n")

    kinds = {k: sum(p["kind"] == k for p in out) for k in ("journal", "conference", "preprint")}
    print(f"{len(out)} papers {kinds}; {len(unresolved)} unresolved")
    for u in unresolved:
        print("  UNRESOLVED:", u)
    for want, got in mismatched:
        print(f"  MISMATCH: wanted {want!r}\n            got    {got!r}")


def write_summaries_md(papers):
    fields = [("goal", "Main goal"), ("architecture", "Architecture"), ("data", "Data"),
              ("result", "Main result"), ("open_work", "Open work"), ("issues", "Issues")]
    lines = ["# Paper summaries", "",
             "Each paper is summarized as main goal, architecture, data, main result, open work and issues. "
             "Summaries are based on the abstract and, for well-known papers, the published paper. "
             "*Open work* and *Issues* are often an editorial assessment rather than the authors' own statement; "
             "each entry notes its basis. Papers are grouped by their first subfield and ordered by citations.", ""]
    lines += ["## Contents", ""] + [f"- [{label}](#{key})" for key, label in TOPICS.items()] + [""]
    for key, label in TOPICS.items():
        group = [p for p in papers if p["topics"][0] == key]
        if not group:
            continue
        lines += [f'<a id="{key}"></a>', f"## {label}", ""]
        for p in group:
            link = f"https://doi.org/{p['doi']}" if p["doi"] else f"https://arxiv.org/abs/{p['arxiv']}" if p["arxiv"] else ""
            first = p["authors"][0].split()[-1] if p["authors"] else ""
            etal = " et al." if len(p["authors"]) > 1 else ""
            lines.append(f"### [{p['title']}]({link})" if link else f"### {p['title']}")
            lines.append(f"{first}{etal} ({p['year']}), *{p['venue']}*. {p['cites']:,} citations.")
            lines.append("")
            s = p.get("summary")
            if not s:
                lines += ["*Summary pending.*", ""]
                continue
            for k, l in fields:
                lines.append(f"- **{l}:** {s.get(k) or 'Not reported.'}")
            lines += [f"- *Basis: {s.get('basis', 'abstract')}*", ""]
    open(os.path.join(ROOT, "SUMMARIES.md"), "w").write("\n".join(lines))


def bibtex(p):
    last = (p["authors"][0].split()[-1] if p["authors"] else "anon")
    word = (re.findall(r"[A-Za-z]{4,}", p["title"]) or ["paper"])[0]
    key = re.sub(r"[^A-Za-z0-9]", "", f"{last}{p['year']}{word}")
    f = [("title", "{" + p["title"] + "}"), ("author", " and ".join(p["authors"])), ("year", p["year"])]
    if p["kind"] == "journal":
        typ = "article"; f.append(("journal", p["venue"]))
    elif p["kind"] == "conference":
        typ = "inproceedings"; f.append(("booktitle", p["venue"]))
    else:
        typ = "misc"; f.append(("howpublished", f"arXiv:{p['arxiv']}"))
    f += [("volume", p["volume"]), ("pages", p["pages"]), ("doi", p["doi"])]
    if p["arxiv"]:
        f += [("eprint", p["arxiv"]), ("archivePrefix", "arXiv")]
    body = ",\n".join(f"  {k} = {{{v}}}" for k, v in f if v)
    return f"@{typ}{{{key},\n{body}\n}}"


if __name__ == "__main__":
    main()
