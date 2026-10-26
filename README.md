# AI in Atmospheric and Oceanic Sciences

A curated, citation-ranked catalog of machine-learning research, from the first expert systems and neural networks of the 1980s to today's foundation models, for weather, climate, ocean and sea ice, and for the water, energy and agriculture problems tied to them, covering peer-reviewed journals, major ML conferences and arXiv preprints.

**Browse it:** three self-contained pages, each a single HTML file you can open in a browser or serve with GitHub Pages:

- [`index.html`](index.html) is the **paper catalog**, with search, filters, summaries and BibTeX, plus a **Key reviews** tab (the most cited reviews and perspectives overall, the fastest-rising recent ones, and the top three per subfield; open it directly with `index.html#reviews`) and an Insights tab.
- [`eda.html`](eda.html) is the **interactive exploratory analysis**. Guided views (architecture shift, research goals, training data, limitations by architecture, open problems, probabilistic turn, citation impact, venues) set up every chart to answer one question, with notes computed from the current selection. Every view can be bookmarked by its hash, e.g. `eda.html#data`.
- [`journals.html`](journals.html) is the **journal assessment**: which journals and conferences publish the most influential ML work in the catalog, measured by a year-normalized impact index and the share of top-10% papers, with a sortable scorecard, tiers, trends and each venue's subfield mix. All numbers follow the filters.

The page lets you:

- search titles, authors, abstracts, venues and DOIs/arXiv IDs;
- filter by subfield, publication type (journal / conference / arXiv-only / other, for older records whose venue is not indexed) and year (or click a bar in the year histogram);
- sort by total citations, citations per year, date or title;
- expand abstracts, copy a formatted citation, copy BibTeX for one paper or for everything currently shown;
- slice by any category (architecture, goal, data source, limitation, open problem, venue…) and combine filters;
- open the **Insights** tab for interactive charts that follow the current selection: when each architecture arrived, trends by year, what is rising and fading, citation impact, a two-way cross-tab explorer, and the recurring limitations and open problems with quotes.

All entries are also available as [`papers.bib`](papers.bib) and [`data/papers.json`](data/papers.json).

**Structured summaries.** Every paper has a short card (main goal, architecture, data, main result, open work, issues), shown under "Summary" on the page and collected in [`SUMMARIES.md`](SUMMARIES.md) by subfield. The cards are based on the abstract and, for well-known papers, the published paper; *open work* and *issues* are often an editorial assessment, and each card states its basis. Treat specific numbers as pointers to check in the paper itself.

## Database and analysis

[`data/papers.duckdb`](data/papers.duckdb) holds every paper with its metadata, authors, subfields and structured summary. It also adds standardized categories: paper type, model family, approach (hybrid, physics-informed, XAI, data assimilation), training data source, research goal, limitation themes, open-problem themes, a probabilistic flag and venue family. Open it with the `duckdb` CLI or from Python:

```python
import duckdb
con = duckdb.connect("data/papers.duckdb", read_only=True)
con.sql("SELECT arch_group, count(*) FROM paper_architecture GROUP BY 1").df()
```

The tables are `papers`, `authors`, `subfields`, `summaries`, `paper_architecture`, `paper_data_source`, `paper_task`, `paper_issue_theme`, `paper_open_theme` and `category_overrides`, plus a `v_papers_wide` view with list columns. Example queries are in [`analysis/queries.sql`](analysis/queries.sql).

Categories are assigned by keyword rules in [`scripts/taxonomy.py`](scripts/taxonomy.py). To fix a single paper, add a row to [`data/category_overrides.csv`](data/category_overrides.csv). [`analysis/EDA.md`](analysis/EDA.md) has the exploratory analysis (publication trends, architecture shift, data sources, citation rates, venues), with figures in `analysis/figures/` and their data in `analysis/tables/`.

```bash
python3 scripts/build_db.py   # rebuild the database from data/papers.json + data/summaries.json
python3 analysis/eda.py       # regenerate figures and tables (needs duckdb, pandas, matplotlib)
```

## Subfields

Reviews & perspectives · Medium-range weather · Ensembles & generative models · Foundation models · Nowcasting · Post-processing · S2S, ENSO & MJO · Climate emulation & detection · Parameterization & hybrid models · Downscaling · Data assimilation · Remote sensing & clouds · Extremes & tropical cyclones · Explainability & causality · Ocean · Sea ice · Air quality & chemistry · Benchmarks & datasets · Core ML methods · Hydrology & water resources · Weather & climate for energy · Climate & water for agriculture

The last three (the "applied" scope) include only work tied to water, weather or climate: for example streamflow and flood prediction, wind and solar forecasting from meteorological inputs, or climate-driven crop yield prediction.

A paper can belong to more than one subfield.

## Coverage

The catalog spans 1980–2026. Recent years come from window searches of arXiv and key journals; older work comes
from mining the reference lists of catalog papers (`scripts/snowball.py`) and from era searches that pair the
methods of each period (expert systems, fuzzy logic, genetic algorithms, nearest-neighbour and pattern-recognition
methods, early neural networks, SVMs) with the domains (`scripts/discover_era.py`). Many pre-2010 records have no
abstract in the indexes, so their summary cards rest on the title and on knowledge of the paper; each card states
its basis. Analyses use the periods ≤1999, 2000–09, 2010–18, 2019–20, 2021–22, 2023–24 and 2025–26.

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
python3 scripts/build_db.py && python3 analysis/eda.py
```

No API keys are needed; the scripts back off automatically when rate-limited.

**About citation counts.** Counts are from Semantic Scholar (or Crossref, whichever is higher) on the retrieval date shown on the page. Google Scholar counts are typically higher. Use them to compare papers rather than as absolute figures.

## Updating

The whole update (find new papers, screen them, summarize, recategorize, rebuild the database, EDA and pages,
verify) is packaged as a Claude Code skill in [`.claude/skills/update-catalog/`](.claude/skills/update-catalog/SKILL.md);
ask Claude to "update the catalog" in this repository. The mechanical steps are also available directly through
`python3 scripts/update.py {status,screen-batches,pending-summaries,merge-summaries,build,verify}`. Past updates are
recorded in [`data/updates.md`](data/updates.md).

## Contributing

Suggestions are welcome: open an issue or a pull request adding a line to `data/additions.tsv` with the subfield and DOI or arXiv ID.
