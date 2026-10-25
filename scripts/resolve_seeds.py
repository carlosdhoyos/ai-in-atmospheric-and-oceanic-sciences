"""Resolve curated seed titles to Semantic Scholar records (cached, resumable)."""
import difflib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import s2

ROOT = os.path.join(os.path.dirname(__file__), "..")
CACHE = os.path.join(ROOT, "data", "cache_seeds.json")


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def main():
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    seeds = [l.rstrip("\n").split("\t", 1) for l in open(os.path.join(ROOT, "data", "seeds.tsv"))
             if l.strip() and not l.startswith("#")]
    for i, (topic, title) in enumerate(seeds):
        if title in cache:
            continue
        rec = s2.match(title)
        score = difflib.SequenceMatcher(None, norm(title), norm(rec["title"])).ratio() if rec else 0
        cache[title] = {"topic": topic, "score": round(score, 3), "rec": rec}
        print(f"[{i+1}/{len(seeds)}] {score:.2f} {title[:70]}", flush=True)
        json.dump(cache, open(CACHE, "w"))
    bad = [(t, v["rec"]["title"] if v["rec"] else None) for t, v in cache.items() if v["score"] < 0.9]
    print(f"\n{len(bad)} weak matches:")
    for t, r in bad:
        print(f"  WANT: {t}\n  GOT:  {r}")


if __name__ == "__main__":
    main()
