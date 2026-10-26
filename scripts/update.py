"""One entry point for the mechanical steps of a catalog update (see .claude/skills/update-catalog/SKILL.md).

    python3 scripts/update.py status                      # what the catalog holds and what is pending
    python3 scripts/update.py screen-batches [--top 640 --n 4]  # batches of top-scored candidates for screening
    python3 scripts/update.py pending-summaries [--size 30]  # write batches of papers that need a summary
    python3 scripts/update.py merge-summaries             # validate + merge batch outputs into data/summaries.json
    python3 scripts/update.py build [--refresh-citations] # pages, BibTeX, SUMMARIES.md, DuckDB, EDA figures + report
    python3 scripts/update.py verify                      # consistency checks (+ browser checks if Playwright exists)

Work files live in .update/ (git-ignored): screening batches in .update/screen_in|screen_out, summary batches in
.update/sum_in|sum_out.
"""
import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORK = os.path.join(ROOT, ".update")
FIELDS = {"goal", "architecture", "data", "result", "open_work", "issues", "basis"}
BASES = {"abstract", "abstract+knowledge", "assessment"}


def load(rel):
    return json.load(open(os.path.join(ROOT, rel)))


def run(*cmd):
    print("$", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def status(_):
    cat = load("data/papers.json")
    papers, summ = cat["papers"], load("data/summaries.json")
    years = Counter(p["year"] for p in papers)
    print(f"catalog: {len(papers)} papers, citations retrieved {cat['retrieved']}")
    print("recent years:", ", ".join(f"{y}: {years[y]}" for y in sorted(years) if y >= max(years) - 4))
    print(f"papers without a summary: {sum(1 for p in papers if p['s2'] not in summ)}")
    cands = sorted(glob.glob(os.path.join(ROOT, "data", "candidates_*_scored.csv")))
    print("candidate files:", ", ".join(os.path.basename(c) for c in cands) or "none")
    adds = [l for l in open(os.path.join(ROOT, "data", "additions.tsv")) if l.strip() and not l.startswith("#")]
    print(f"additions.tsv: {len(adds)} entries")


def pending(a):
    papers, summ = load("data/papers.json")["papers"], load("data/summaries.json")
    todo = [{"id": p["s2"], "title": p["title"], "authors": p["authors"][:4], "year": p["year"], "venue": p["venue"],
             "abstract": p["abstract"]} for p in papers if p["s2"] not in summ]
    shutil.rmtree(os.path.join(WORK, "sum_in"), ignore_errors=True)
    os.makedirs(os.path.join(WORK, "sum_in"), exist_ok=True)
    os.makedirs(os.path.join(WORK, "sum_out"), exist_ok=True)
    for i in range(0, len(todo), a.size):
        json.dump(todo[i:i + a.size], open(os.path.join(WORK, "sum_in", f"batch_{i // a.size:02d}.json"), "w"),
                  indent=1, ensure_ascii=False)
    print(f"{len(todo)} papers need summaries -> {-(-len(todo) // a.size) if todo else 0} batches in .update/sum_in/")
    print("Each batch: summarize with the brief in .claude/skills/update-catalog/references/summary-brief.md,")
    print("writing .update/sum_out/<same file name>.")


def merge(_):
    summ = load("data/summaries.json")
    papers = {p["s2"] for p in load("data/papers.json")["papers"]}
    added, problems = 0, []
    for f in sorted(glob.glob(os.path.join(WORK, "sum_out", "*.json"))):
        try:
            batch = json.load(open(f))
        except json.JSONDecodeError as e:
            problems.append(f"{os.path.basename(f)}: invalid JSON ({e})")
            continue
        for pid, card in batch.items():
            missing = FIELDS - set(card)
            if pid not in papers:
                problems.append(f"{pid}: not in catalog")
            elif missing or card.get("basis") not in BASES or any(not str(card.get(k, "")).strip() for k in FIELDS):
                problems.append(f"{pid}: incomplete card (missing {sorted(missing) or 'values'})")
            elif pid not in summ:
                summ[pid] = {k: card[k] for k in ("goal", "architecture", "data", "result", "open_work", "issues", "basis")}
                added += 1
    # cards of records that left the catalog (e.g. a preprint replaced by its published version)
    orphans = [pid for pid in summ if pid not in papers]
    for pid in orphans:
        del summ[pid]
    json.dump(summ, open(os.path.join(ROOT, "data", "summaries.json"), "w"), indent=1, ensure_ascii=False)
    print(f"merged {added} new summaries; removed {len(orphans)} orphaned; {len(summ)} total")
    for p in problems:
        print("  PROBLEM:", p)
    if problems:
        sys.exit(1)


def screen_batches(a):
    """Interleave the top-N scored candidates into n batches so each batch has a similar mix of scores."""
    import csv
    path = sorted(glob.glob(os.path.join(ROOT, "data", "candidates_*_scored.csv")))[-1] if not a.file else a.file
    rows = list(csv.DictReader(open(path)))[:a.top]
    titles = [p["title"] for p in load("data/papers.json")["papers"] if p["year"] >= max(1, a.recent_from)]
    shutil.rmtree(os.path.join(WORK, "screen_in"), ignore_errors=True)
    os.makedirs(os.path.join(WORK, "screen_in"), exist_ok=True)
    os.makedirs(os.path.join(WORK, "screen_out"), exist_ok=True)
    keys = ("score", "cites", "months", "id", "venue", "date", "title")
    for i in range(a.n):
        batch = [{k: r[k] for k in keys} | {"abstract": r["abstract"][:600]} for r in rows[i::a.n]]
        json.dump({"candidates": batch, "catalog_titles_2022_on": titles},
                  open(os.path.join(WORK, "screen_in", f"batch_{i}.json"), "w"), indent=1, ensure_ascii=False)
    print(f"{len(rows)} candidates from {os.path.basename(path)} -> {a.n} batches in .update/screen_in/ "
          f"(lowest score included: {rows[-1]['score'] if rows else '-'})")
    print("Screen each with .claude/skills/update-catalog/references/screening.md, writing .update/screen_out/<same name>,")
    print("then: python3 scripts/apply_screening.py .update/screen_out/*.json")


def build(a):
    if a.refresh_citations:
        os.remove(os.path.join(ROOT, "data", "cache_s2.json"))
    run(sys.executable, "scripts/build.py")
    run(sys.executable, "scripts/build_db.py")
    run(sys.executable, "analysis/eda.py")


def verify(_):
    import duckdb
    cat = load("data/papers.json")
    papers, summ, errors = cat["papers"], load("data/summaries.json"), []
    no_sum = [p["title"] for p in papers if p["s2"] not in summ]
    if no_sum:
        errors.append(f"{len(no_sum)} papers without summary, e.g. {no_sum[:3]}")
    con = duckdb.connect(os.path.join(ROOT, "data", "papers.duckdb"), read_only=True)
    n_db = con.sql("SELECT count(*) FROM papers").fetchall()[0][0]
    if n_db != len(papers):
        errors.append(f"database has {n_db} papers, papers.json has {len(papers)} (rerun build)")
    for page in ("index.html", "eda.html"):
        html = open(os.path.join(ROOT, page)).read()
        n_page = len(json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>', html, re.S)
                                .group(1).replace("<\\/", "</"))["papers"])
        if n_page != len(papers):
            errors.append(f"{page} embeds {n_page} papers, papers.json has {len(papers)} (rerun build)")
    eda = open(os.path.join(ROOT, "analysis", "EDA.md")).read()
    if f"catalog of {len(papers)} papers" not in eda:
        errors.append("analysis/EDA.md is stale (rerun analysis/eda.py)")
    try:  # browser check: both pages render, every guided view works, no JS errors
        out = subprocess.run(["node", os.path.join(ROOT, "scripts", "verify_pages.js"), ROOT], capture_output=True,
                             text=True, timeout=180)
        print(out.stdout.strip())
        if out.returncode:
            errors.append("browser check failed: " + (out.stderr.strip() or out.stdout.strip())[-400:])
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        print(f"(browser check skipped: {e})")
    years = Counter(p["year"] for p in papers)
    print(f"{len(papers)} papers; latest years: " + ", ".join(f"{y}: {years[y]}" for y in sorted(years)[-3:]))
    for e in errors:
        print("  ERROR:", e)
    print("verify: " + ("FAILED" if errors else "OK"))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status").set_defaults(fn=status)
    p = sub.add_parser("pending-summaries"); p.add_argument("--size", type=int, default=30); p.set_defaults(fn=pending)
    sub.add_parser("merge-summaries").set_defaults(fn=merge)
    p = sub.add_parser("screen-batches"); p.add_argument("--top", type=int, default=640); p.add_argument("--n", type=int, default=4)
    p.add_argument("--file"); p.add_argument("--recent-from", type=int, default=2022); p.set_defaults(fn=screen_batches)
    p = sub.add_parser("build"); p.add_argument("--refresh-citations", action="store_true"); p.set_defaults(fn=build)
    sub.add_parser("verify").set_defaults(fn=verify)
    args = ap.parse_args()
    args.fn(args)
