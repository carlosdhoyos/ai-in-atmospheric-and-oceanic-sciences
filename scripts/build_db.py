"""Build data/papers.duckdb from data/papers.json (+ summaries) with homogenized categories.

Tables
  papers            one row per paper (metadata, citations, primary subfield, paper type, venue family, flags)
  authors           paper_id, position, name
  subfields         paper_id, subfield, label, is_primary
  summaries         paper_id, goal, architecture, data, result, open_work, issues, basis
  paper_architecture  paper_id, family, arch_group, tag_kind ('model_family' or 'approach'; multi-label)
  paper_data_source   paper_id, source                   (multi-label)
  category_overrides  manual fixes applied on top of the rules (from data/category_overrides.csv)
Views
  v_papers_wide     papers with list columns for subfields, architectures and data sources
"""
import csv
import json
import os
import sys

import duckdb

sys.path.insert(0, os.path.dirname(__file__))
from taxonomy import APPROACHES, ARCH_GROUP, classify

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB = os.path.join(ROOT, "data", "papers.duckdb")
OVERRIDES = os.path.join(ROOT, "data", "category_overrides.csv")


def main():
    cat = json.load(open(os.path.join(ROOT, "data", "papers.json")))
    papers, topics, retrieved = cat["papers"], cat["topics"], cat["retrieved"]
    summaries = json.load(open(os.path.join(ROOT, "data", "summaries.json")))

    overrides = []
    if os.path.exists(OVERRIDES):
        overrides = [r for r in csv.DictReader(open(OVERRIDES)) if r.get("paper_id") and not r["paper_id"].startswith("#")]

    rows, auth, subf, summ, arch, data = [], [], [], [], [], []
    for p in papers:
        p["summary"] = summaries.get(p["s2"])
        c = classify(p)
        pid = p["s2"]
        for o in (o for o in overrides if o["paper_id"] == pid):
            dim, label, act = o["dimension"], o["label"], o["action"]
            if dim in ("architecture", "data_source"):
                if act == "add" and label not in c[dim]:
                    c[dim].append(label)
                if act == "remove" and label in c[dim]:
                    c[dim].remove(label)
            elif dim in ("paper_type", "venue_family"):
                c[dim] = label
            elif dim == "probabilistic":
                c[dim] = label.lower() == "true"
        age = max(1, int(retrieved[:4]) - p["year"] + 0.5) if p["year"] else None
        rows.append((pid, p["title"], p["year"], p["date"], p["venue"], c["venue_family"], p["kind"], c["paper_type"],
                     p["topics"][0], topics[p["topics"][0]], c["probabilistic"], p["doi"], p["arxiv"], p["cites"],
                     p["infl"], round(p["cites"] / age, 2) if age else None, len(p["authors"]),
                     p["authors"][0] if p["authors"] else None, p["abstract"], p["pdf"] is not None))
        auth += [(pid, i + 1, a) for i, a in enumerate(p["authors"])]
        subf += [(pid, t, topics[t], i == 0) for i, t in enumerate(p["topics"])]
        s = p["summary"] or {}
        summ.append((pid, s.get("goal"), s.get("architecture"), s.get("data"), s.get("result"),
                     s.get("open_work"), s.get("issues"), s.get("basis")))
        arch += [(pid, a, ARCH_GROUP.get(a, "Approach"), "approach" if a in APPROACHES else "model_family")
                 for a in c["architecture"]]
        data += [(pid, d) for d in c["data_source"]]

    if os.path.exists(DB):
        os.remove(DB)
    con = duckdb.connect(DB)
    con.execute("""CREATE TABLE papers (
        paper_id VARCHAR PRIMARY KEY, title VARCHAR, year INTEGER, pub_date DATE, venue VARCHAR, venue_family VARCHAR,
        kind VARCHAR, paper_type VARCHAR, primary_subfield VARCHAR, primary_subfield_label VARCHAR, probabilistic BOOLEAN,
        doi VARCHAR, arxiv VARCHAR, citations INTEGER, influential_citations INTEGER, citations_per_year DOUBLE,
        n_authors INTEGER, first_author VARCHAR, abstract VARCHAR, open_access_pdf BOOLEAN)""")
    con.executemany("INSERT INTO papers VALUES (" + ",".join("?" * 20) + ")", rows)
    con.execute("CREATE TABLE authors (paper_id VARCHAR, position INTEGER, name VARCHAR)")
    con.executemany("INSERT INTO authors VALUES (?,?,?)", auth)
    con.execute("CREATE TABLE subfields (paper_id VARCHAR, subfield VARCHAR, label VARCHAR, is_primary BOOLEAN)")
    con.executemany("INSERT INTO subfields VALUES (?,?,?,?)", subf)
    con.execute("""CREATE TABLE summaries (paper_id VARCHAR, goal VARCHAR, architecture VARCHAR, data VARCHAR,
        result VARCHAR, open_work VARCHAR, issues VARCHAR, basis VARCHAR)""")
    con.executemany("INSERT INTO summaries VALUES (?,?,?,?,?,?,?,?)", summ)
    con.execute("CREATE TABLE paper_architecture (paper_id VARCHAR, family VARCHAR, arch_group VARCHAR, tag_kind VARCHAR)")
    con.executemany("INSERT INTO paper_architecture VALUES (?,?,?,?)", arch)
    con.execute("CREATE TABLE paper_data_source (paper_id VARCHAR, source VARCHAR)")
    con.executemany("INSERT INTO paper_data_source VALUES (?,?)", data)
    con.execute("CREATE TABLE category_overrides (paper_id VARCHAR, dimension VARCHAR, label VARCHAR, action VARCHAR, note VARCHAR)")
    if overrides:
        con.executemany("INSERT INTO category_overrides VALUES (?,?,?,?,?)",
                        [(o["paper_id"], o["dimension"], o["label"], o["action"], o.get("note")) for o in overrides])
    con.execute("""CREATE VIEW v_papers_wide AS
        SELECT p.*,
          (SELECT list(label ORDER BY NOT is_primary, label) FROM subfields s WHERE s.paper_id = p.paper_id) AS subfields,
          (SELECT list(family ORDER BY family) FROM paper_architecture a WHERE a.paper_id = p.paper_id) AS architectures,
          (SELECT list(source ORDER BY source) FROM paper_data_source d WHERE d.paper_id = p.paper_id) AS data_sources
        FROM papers p""")
    con.close()
    print(f"wrote {DB}: {len(rows)} papers, {len(arch)} architecture tags, {len(data)} data-source tags, "
          f"{len(overrides)} overrides")


if __name__ == "__main__":
    main()
