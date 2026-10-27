"""Apply screening decisions (JSON files from the screening step) to the catalog's input lists.

- "include" entries are appended to data/additions.tsv (skipping IDs already listed).
- "published_versions" point an existing catalog entry at its published record: for a seed paper an override
  (seed title -> new ID) is added to data/overrides.tsv; for a paper that came from additions.tsv its ID is
  replaced. The build then merges both records into one entry with the journal metadata.

    python3 scripts/apply_screening.py .update/screen_out/*.json
"""
import difflib
import json
import os
import sys

from resolve_ids import norm

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
D = lambda *p: os.path.join(ROOT, "data", *p)  # noqa: E731
from build import TOPICS as _TOPICS  # noqa: E402  (source of truth for subfield keys)
TOPICS = set(_TOPICS)


def best_match(title, options):
    scored = [(difflib.SequenceMatcher(None, norm(title), norm(o)).ratio(), o) for o in options]
    return max(scored, default=(0, None))


def main(paths):
    adds_path, over_path = D("additions.tsv"), D("overrides.tsv")
    adds = open(adds_path).read().splitlines()
    listed = {l.split("\t")[1] for l in adds if l.strip() and not l.startswith("#")}
    seeds = [l.split("\t", 1)[1] for l in open(D("seeds.tsv")).read().splitlines() if l.strip() and not l.startswith("#")]
    catalog = json.load(open(D("papers.json")))["papers"]
    overrides = open(over_path).read().splitlines()
    new_adds, new_over, replaced, skipped = [], [], 0, []

    for path in paths:
        dec = json.load(open(path))
        for inc in dec.get("include", []):
            topics = [t for t in inc.get("topics", []) if t in TOPICS][:3]
            if not topics:
                skipped.append(f"{inc.get('id')}: no valid topic")
                continue
            if inc["id"] in listed:
                continue
            listed.add(inc["id"])
            new_adds.append(f"{','.join(topics)}\t{inc['id']}\t{inc.get('reason', '').strip()[:160]}")
        for pv in dec.get("published_versions", []):
            if pv["id"].upper().startswith("ARXIV:") or "10.48550" in pv["id"]:
                skipped.append(f"{pv['id']}: an arXiv preprint is never the published version")
                continue
            score, cat_title = best_match(pv["catalog_title"], [p["title"] for p in catalog])
            if score < 0.8:
                skipped.append(f"{pv['id']}: no catalog entry matches '{pv['catalog_title']}'")
                continue
            entry = next(p for p in catalog if p["title"] == cat_title)
            s_score, seed = best_match(cat_title, seeds)
            if s_score >= 0.85:
                new_over.append(f"{seed}\t{pv['id']}")
                continue
            ids = {f"DOI:{entry['doi']}" if entry["doi"] else None, f"ARXIV:{entry['arxiv']}" if entry["arxiv"] else None,
                   entry["s2"]}
            for i, line in enumerate(adds):
                parts = line.split("\t")
                if len(parts) > 1 and parts[1] in ids:
                    parts[1] = pv["id"]
                    adds[i] = "\t".join(parts)
                    replaced += 1
                    break
            else:
                skipped.append(f"{pv['id']}: matched '{cat_title}' but could not find its source line")

    open(adds_path, "w").write("\n".join(adds + new_adds) + "\n")
    existing = {l.split("\t")[0] for l in overrides if "\t" in l}
    overrides += [o for o in new_over if o.split("\t")[0] not in existing]
    open(over_path, "w").write("\n".join(overrides) + "\n")
    print(f"additions.tsv: +{len(new_adds)} papers; overrides.tsv: +{len(new_over)} published versions; "
          f"{replaced} addition IDs replaced by published versions")
    for s in skipped:
        print("  SKIPPED:", s)


if __name__ == "__main__":
    main(sys.argv[1:])
