"""Resolve seed titles to DOIs (Crossref) and arXiv IDs (arXiv API). Cached, resumable."""
import concurrent.futures as cf
import difflib
import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.join(os.path.dirname(__file__), "..")
CACHE = os.path.join(ROOT, "data", "cache_ids.json")
UA = {"User-Agent": "ai-aos-papers/1.0 (mailto:cdhoyos0@unal.edu.co)"}


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def sim(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def get(url, tries=6):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception:
            time.sleep(2 * (i + 1))
    return None


# DOIs of conference abstracts and preprint servers, which often share the published paper's title
NON_FINAL_DOI = re.compile(r"^10\.(5194/egusphere|5194/ems|31223/|2139/ssrn|1002/essoar|22541/|21203/|20944/|48550/|1101/|36227/|31219/)")
TYPE_RANK = {"journal-article": 0, "proceedings-article": 1, "book-chapter": 2}


def crossref(title):
    q = urllib.parse.urlencode({"query.bibliographic": title, "rows": 10,
                                "select": "DOI,title,type,container-title,issued,is-referenced-by-count"})
    raw = get(f"https://api.crossref.org/works?{q}")
    if not raw:
        return None
    cands = []
    for it in json.loads(raw)["message"]["items"]:
        t = (it.get("title") or [""])[0]
        cands.append({"score": round(sim(title, t), 3), "doi": it["DOI"].lower(), "title": t, "type": it.get("type"),
                      "venue": (it.get("container-title") or [""])[0],
                      "cites": it.get("is-referenced-by-count") or 0})
    good = [c for c in cands if c["score"] >= 0.9 and not NON_FINAL_DOI.match(c["doi"])]
    if good:  # prefer the published version: journal > proceedings > other, then most cited
        return min(good, key=lambda c: (TYPE_RANK.get(c["type"], 9), -c["cites"]))
    best = max(cands, key=lambda c: c["score"], default=None)
    if best and NON_FINAL_DOI.match(best["doi"]):
        best["score"] = 0.0  # keep for inspection, never use as the paper's DOI
    return best


def arxiv(title):
    stop = {"and", "for", "the", "with", "from", "using", "via", "into", "that", "its", "are", "not", "but"}
    words = " AND ".join([f"ti:{w}" for w in norm(title).split() if len(w) > 2 and w not in stop][:6])
    q = urllib.parse.urlencode({"search_query": words, "max_results": 5})
    raw = get(f"https://export.arxiv.org/api/query?{q}")
    if not raw:
        return None
    ns = {"a": "http://www.w3.org/2005/Atom"}
    best = None
    for e in ET.fromstring(raw).findall("a:entry", ns):
        t = " ".join(e.find("a:title", ns).text.split())
        s = sim(title, t)
        aid = e.find("a:id", ns).text.rsplit("/abs/", 1)[-1]
        aid = re.sub(r"v\d+$", "", aid)
        if not best or s > best["score"]:
            best = {"score": round(s, 3), "id": aid, "title": t}
    return best


def main():
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    seeds = [l.rstrip("\n").split("\t", 1) for l in open(os.path.join(ROOT, "data", "seeds.tsv"))
             if l.strip() and not l.startswith("#")]
    todo = [t for _, t in seeds if t not in cache or "crossref" not in cache[t] or os.environ.get("REFRESH_CROSSREF")]
    with cf.ThreadPoolExecutor(4) as ex:
        for t, r in zip(todo, ex.map(crossref, todo)):
            cache.setdefault(t, {})["crossref"] = r
    json.dump(cache, open(CACHE, "w"), indent=1)
    todo = [t for _, t in seeds if cache[t].get("arxiv") is None
            and (cache[t]["crossref"] or {}).get("score", 0) < 0.9]  # S2 links arXiv ids for the rest
    for t in todo:  # arXiv asks for ~1 request / 3 s
        cache[t]["arxiv"] = arxiv(t)
        json.dump(cache, open(CACHE, "w"), indent=1)
        time.sleep(3)
    print("done", len(cache))


if __name__ == "__main__":
    main()
