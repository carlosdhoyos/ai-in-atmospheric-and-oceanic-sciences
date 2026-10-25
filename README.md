# AI in Atmospheric and Oceanic Sciences

A curated, citation-ranked catalog of machine-learning research for weather, climate, ocean and sea ice, covering peer-reviewed journals, major ML conferences and arXiv preprints.

**Browse it:** open [`index.html`](index.html) in a browser (it is a single self-contained file), or enable GitHub Pages on this repository.

The page lets you:

- search titles, authors, abstracts, venues and DOIs/arXiv IDs;
- filter by subfield, publication type (journal / conference / arXiv-only) and year (or click a bar in the year histogram);
- sort by total citations, citations per year, date or title;
- expand abstracts, copy a formatted citation, copy BibTeX for one paper or for everything currently shown.

All entries are also available as [`papers.bib`](papers.bib) and [`data/papers.json`](data/papers.json).

## Subfields

Reviews & perspectives · Medium-range weather · Ensembles & generative models · Foundation models · Nowcasting · Post-processing · S2S, ENSO & MJO · Climate emulation & detection · Parameterization & hybrid models · Downscaling · Data assimilation · Remote sensing & clouds · Extremes & tropical cyclones · Explainability & causality · Ocean · Sea ice · Air quality & chemistry · Benchmarks & datasets · Core ML methods

A paper can belong to more than one subfield.

## How the catalog is built

1. **Curated seeds** — `data/seeds.tsv` lists landmark papers by subfield (one title per line).
2. **Discovery** — `scripts/discover.py` runs citation-ranked Semantic Scholar searches per subfield; relevant hits are screened by hand into `data/additions.tsv`.
3. **Identifier resolution** — `scripts/resolve_ids.py` matches titles to DOIs (Crossref) and arXiv IDs (arXiv API) with a fuzzy-title check.
4. **Metadata and citations** — `scripts/build.py` fetches authors, venue, abstract and citation counts from Semantic Scholar in batch, merges journal and preprint versions of the same work, and writes `index.html`, `papers.bib` and `data/papers.json`.

To refresh citation counts or add papers:

```bash
# add titles to data/seeds.tsv (topic<TAB>title) or IDs to data/additions.tsv (topic<TAB>DOI:...|ARXIV:...)
python3 scripts/resolve_ids.py
rm -f data/cache_s2.json      # force fresh citation counts
python3 scripts/build.py
```

No API keys are needed; the scripts back off automatically when rate-limited.

**About citation counts.** Counts are from Semantic Scholar (or Crossref, whichever is higher) on the retrieval date shown on the page. Google Scholar counts are typically higher. Use them to compare papers rather than as absolute figures.

## Contributing

Suggestions are welcome: open an issue or a pull request adding a line to `data/additions.tsv` with the subfield and DOI or arXiv ID.
