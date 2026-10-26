"""Write analysis/EDA.md from the database, so every number in the report matches the current catalog.

Called at the end of analysis/eda.py. Sentences that depend on the data are generated here; the fixed prose
(method, categories, caveats) is in the template below. After an update, read the headlines once: they are
computed, but whether they are still the right headlines is a judgment call.
"""
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODERN = ("Transformers", "Graph & operator nets", "Generative (diffusion/GAN/VAE)")


def pct(x):
    return f"{round(100 * x)}%"


def write(con, periods_sql, order):
    q = lambda sql: con.sql(sql).fetchall()  # noqa: E731
    one = lambda sql: q(sql)[0][0]  # noqa: E731
    n_papers = one("SELECT count(*) FROM papers")
    y0, y1 = q("SELECT min(year), max(year) FROM papers")[0]
    per_year = dict(q("SELECT year, count(*) FROM papers GROUP BY 1"))
    recent = {y: per_year.get(y, 0) for y in (y1 - 1, y1)}
    first, last = order[1], order[-1]  # compare against 2019–20, the first period with broad coverage

    # architecture shift
    shares = {}
    for per, grp, n in q(f"""WITH t AS (SELECT DISTINCT a.paper_id, a.arch_group, {periods_sql} AS period
                                        FROM paper_architecture a JOIN papers p USING (paper_id) WHERE tag_kind = 'model_family')
                             SELECT period, arch_group, count(*) FROM t GROUP BY ALL"""):
        shares.setdefault(per, {})[grp] = n
    tot = {per: sum(v.values()) for per, v in shares.items()}
    share = lambda per, grps: sum(shares.get(per, {}).get(g, 0) for g in grps) / max(1, tot.get(per, 0))  # noqa: E731
    groups = ["CNN / U-Net", "MLP / generic NN", "RNN / LSTM", "Classical ML", "Generative (diffusion/GAN/VAE)",
              "Transformers", "Graph & operator nets"]
    shift_rows = "\n".join(
        f"| {per} | {tot.get(per, 0)} | " + " | ".join(pct(share(per, [g])) for g in groups) + " |" for per in order)

    # data sources
    era = dict(q(f"SELECT {periods_sql} AS period, count(DISTINCT paper_id) FROM paper_data_source JOIN papers USING (paper_id) "
                 f"WHERE source = 'ERA5' GROUP BY 1"))
    methods_last = one(f"SELECT count(*) FROM papers WHERE paper_type = 'method' AND {periods_sql} = '{last}'")
    era_m_last = one(f"""SELECT count(DISTINCT p.paper_id) FROM papers p JOIN paper_data_source d USING (paper_id)
                         WHERE d.source = 'ERA5' AND p.paper_type = 'method' AND {periods_sql.replace('year', 'p.year')} = '{last}'""")
    ideal = dict(q(f"SELECT {periods_sql} AS period, count(DISTINCT paper_id) FROM paper_data_source JOIN papers USING (paper_id) "
                   f"WHERE source = 'Idealized / toy model' GROUP BY 1"))
    cmip = dict(q(f"SELECT {periods_sql} AS period, count(DISTINCT paper_id) FROM paper_data_source JOIN papers USING (paper_id) "
                  f"WHERE source = 'CMIP / climate model output' GROUP BY 1"))
    nwp = dict(q(f"SELECT {periods_sql} AS period, count(DISTINCT paper_id) FROM paper_data_source JOIN papers USING (paper_id) "
                 f"WHERE source = 'Operational NWP / reforecasts' GROUP BY 1"))

    # probabilistic
    prob = q(f"SELECT {periods_sql} AS period, avg(probabilistic::INT) FROM papers WHERE paper_type = 'method' GROUP BY 1")
    prob = dict(prob)
    prob_line = ", ".join(f"{pct(prob[p])} ({p})" for p in order if p in prob)

    # subfield signatures: dominant architecture group per subfield (papers with a model-family tag)
    sig = []
    for sub, grp, n, total in q("""WITH t AS (SELECT DISTINCT s.label AS sub, a.arch_group, a.paper_id FROM subfields s
                                             JOIN paper_architecture a USING (paper_id) WHERE a.tag_kind = 'model_family'
                                             AND s.subfield NOT IN ('review', 'methods', 'benchmarks')),
                                     c AS (SELECT sub, arch_group, count(*) n FROM t GROUP BY ALL),
                                     s AS (SELECT sub, count(DISTINCT paper_id) total FROM t GROUP BY 1)
                                SELECT c.sub, c.arch_group, c.n, s.total FROM c JOIN s USING (sub)
                                QUALIFY row_number() OVER (PARTITION BY c.sub ORDER BY c.n DESC) = 1
                                ORDER BY s.total DESC LIMIT 8"""):
        sig.append(f"{sub}: {grp} ({n} of {total} papers)")

    # citation rate by group
    cites = q("""SELECT a.arch_group, median(p.citations_per_year), count(DISTINCT p.paper_id) FROM paper_architecture a
                 JOIN papers p USING (paper_id) WHERE a.tag_kind = 'model_family' AND p.paper_type = 'method' AND p.year >= 2018
                 GROUP BY 1 ORDER BY 2 DESC""")

    # goals
    goals_first = dict(q(f"""SELECT task, count(DISTINCT paper_id) FROM paper_task JOIN papers USING (paper_id)
                            WHERE {periods_sql} IN ('{order[1]}', '{order[2]}') GROUP BY 1"""))
    goals_last = dict(q(f"""SELECT task, count(DISTINCT paper_id) FROM paper_task JOIN papers USING (paper_id)
                           WHERE {periods_sql} IN ('{order[-2]}', '{order[-1]}') GROUP BY 1"""))
    n_early = one(f"SELECT count(*) FROM papers WHERE {periods_sql} IN ('{order[1]}', '{order[2]}')")
    n_late = one(f"SELECT count(*) FROM papers WHERE {periods_sql} IN ('{order[-2]}', '{order[-1]}')")
    goal_shift = sorted(((g, goals_last.get(g, 0) / max(1, n_late) - goals_first.get(g, 0) / max(1, n_early))
                         for g in set(goals_first) | set(goals_last)), key=lambda x: -x[1])
    top_goal = q("SELECT task, count(*) FROM paper_task GROUP BY 1 ORDER BY 2 DESC LIMIT 1")[0]

    # limitations by group
    lim = q("""WITH g AS (SELECT DISTINCT a.paper_id, a.arch_group FROM paper_architecture a JOIN papers p USING (paper_id)
                         WHERE a.tag_kind = 'model_family' AND p.paper_type <> 'review'),
                 c AS (SELECT g.arch_group, i.theme, count(*) n FROM g JOIN paper_issue_theme i USING (paper_id)
                       WHERE i.theme NOT IN ('Summary uncertain (no abstract)', 'Review dates quickly', 'Idealized or narrow setting')
                       GROUP BY ALL),
                 t AS (SELECT arch_group, count(*) total FROM g GROUP BY 1)
            SELECT c.arch_group, c.theme, c.n, t.total FROM c JOIN t USING (arch_group)
            QUALIFY row_number() OVER (PARTITION BY c.arch_group ORDER BY c.n DESC) = 1 ORDER BY t.total DESC""")
    open_top = q("SELECT theme, count(*) FROM paper_open_theme GROUP BY 1 ORDER BY 2 DESC LIMIT 3")

    # figure captions
    peak = sorted(per_year.items(), key=lambda x: -x[1])[:2]
    fam = q("""SELECT family, count(DISTINCT paper_id) FROM paper_architecture a JOIN papers p USING (paper_id)
               WHERE a.tag_kind = 'model_family' AND p.paper_type <> 'review' GROUP BY 1 ORDER BY 2 DESC""")
    fam_d = dict(fam)
    appr = dict(q("SELECT family, count(DISTINCT paper_id) FROM paper_architecture WHERE tag_kind = 'approach' GROUP BY 1"))
    venues = q("SELECT venue_family, count(*) FROM papers GROUP BY 1 ORDER BY 2 DESC")
    vd = dict(venues)
    n_over = one("SELECT count(*) FROM category_overrides")
    n_assess = one("SELECT count(*) FROM summaries WHERE basis = 'assessment'")
    n_noabs = one("SELECT count(*) FROM papers WHERE abstract IS NULL")
    thin = [y for y in (y1 - 1, y1) if per_year.get(y, 0) < 15]
    coverage = (f"Coverage of {', '.join(map(str, thin))} is thin ({', '.join(str(per_year.get(y, 0)) for y in thin)} papers), "
                "so treat the last period with care." if thin else
                f"Recent years are covered ({', '.join(f'{y}: {n}' for y, n in recent.items())} papers); the most recent "
                "papers have had little time to accumulate citations.")

    md = f"""# Exploratory analysis of the catalog

Built from `data/papers.duckdb` by [`analysis/eda.py`](eda.py), which also writes this report, so every number below matches the current catalog. Every figure has its data in [`analysis/tables/`](tables/).

**Interactive version.** Open [`eda.html`](../eda.html), the interactive EDA page with guided views, or the **Insights** tab of [`index.html`](../index.html). Every chart there recalculates for the current selection: search, subfield, years, and any number of "Slice by" filters (architecture, goal, data source, limitation, open problem, venue…). It includes:
- a timeline of when each architecture, goal or data source first appeared
- trends by year
- what is rising and what is fading since 2022
- citation impact by group
- a cross-tab explorer for any two categories
- the recurring limitations and open problems, with quotes from the most-cited papers

**Read this first.** This is a curated catalog of {n_papers} papers ({y0}–{y1}), not a census of the field. It over-represents landmark and highly cited work. {coverage} The trends below describe the catalog. They point in the direction the field has moved, but the percentages are not field-wide estimates. Categories come from keyword rules applied to the structured summaries (see [Categories](#categories)), so a paper is tagged by what its summary says.

## Headlines

1. **The architecture mix has turned over.** Transformers, graph/operator networks and generative models were {pct(share(first, MODERN))} of architecture tags in {first} and {pct(share(last, MODERN))} in {last}. CNN/U-Net went from {pct(share(first, ['CNN / U-Net']))} to {pct(share(last, ['CNN / U-Net']))} over the same periods.
2. **ERA5 is the default training set.** It appears in {era.get(first, 0)} papers in {first} and {era.get(last, 0)} in {last}, where it is used by {pct(era_m_last / max(1, methods_last))} of method papers. Idealized and toy-model studies (Lorenz-96, quasi-geostrophic turbulence, aquaplanets) went from {ideal.get(order[2], 0)} papers in {order[2]} to {ideal.get(last, 0)} in {last}.
3. **Probabilistic output keeps growing.** Share of method papers producing ensembles, distributions or other uncertainty: {prob_line}.
4. **Goals have shifted.** {top_goal[0]} is the most common goal overall ({top_goal[1]} papers). Comparing papers from {order[1]} and {order[2]} with papers from {order[-2]} and {order[-1]}, the fastest-growing goals are {', '.join(f'{g} (+{round(d * 100)} pts)' for g, d in goal_shift[:3])}; the largest declines are {', '.join(f'{g} ({round(d * 100)} pts)' for g, d in goal_shift[-2:])}.
5. **Subfields keep distinct architecture signatures.** Dominant group per subfield: {'; '.join(sig)}.
6. **Each architecture family has its own typical weakness.** Besides narrow or idealized test settings, which affect every group, the most frequent limitation per group is: {'; '.join(f'{g}: {t} ({pct(n / total)})' for g, t, n, total in lim)}. The most common open problems across all papers are {', '.join(f'{t} ({n})' for t, n in open_top)}.
7. **Citation rates follow the architecture shift, led by a few flagship models.** Since 2018, median citations per year for method papers: {', '.join(f'{g} {m:.0f} (n={n})' for g, m, n in cites)}. The interquartile ranges are wide and overlap.

## Figures

### Papers per year
![Papers per year by primary subfield](figures/01_papers_per_year_by_subfield.png)

The busiest years in the catalog are {peak[0][0]} ({peak[0][1]} papers) and {peak[1][0]} ({peak[1][1]}).

### Model families
![Model families](figures/02_architecture_families.png)

{fam[0][0]} is the most common family ({fam[0][1]} papers), followed by {fam[1][0]} ({fam[1][1]}) and {fam[2][0]} ({fam[2][1]}). "Neural network (unspecified)" ({fam_d.get('Neural network (unspecified)', 0)}) mostly covers dense networks whose summaries don't name the layer type. Approaches that sit on top of a model are tagged separately and excluded from this chart: hybrid physics-ML coupling ({appr.get('Hybrid physics-ML model', 0)}), data-assimilation schemes ({appr.get('Data assimilation scheme', 0)}), XAI methods ({appr.get('Causal / XAI method', 0)}) and physics-informed constraints ({appr.get('Physics-informed loss / constraints', 0)}).

### Architecture shift
![Architecture share by period](figures/03_architecture_share_by_period.png)

| Period | Tags | CNN / U-Net | MLP / generic | RNN / LSTM | Classical ML | Generative | Transformers | Graph & operator |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
{shift_rows}

### Data sources
![Data sources by period](figures/04_data_sources_by_period.png)

CMIP and other climate-model output appears in {', '.join(f'{cmip.get(p, 0)}' for p in order)} papers across the periods ({', '.join(order)}); it is used for emulation, detection and transfer learning. Operational NWP archives and reforecasts grow alongside ERA5 ({', '.join(f'{nwp.get(p, 0)}' for p in order)}), because ML weather models are verified against and fine-tuned on operational analyses.

### Research goals over time
![Goals by period](figures/09_goals_by_period.png)

### Architecture by subfield
![Architecture by subfield](figures/05_architecture_by_subfield.png)

### Limitations by architecture
![Limitations by architecture](figures/10_limitations_by_architecture.png)

Each cell is the share of a group's papers whose summary reports that limitation. Limitations come from the summaries, and many are an editorial assessment rather than the authors' own statement.

### Citation rate by architecture
![Citations by architecture](figures/06_citations_by_architecture.png)

Citations per year are total citations divided by years since publication (minimum one year). This favours recent landmark papers. Compare medians, not means.

### Probabilistic output
![Probabilistic share](figures/07_probabilistic_share.png)

### Venues
![Venue families](figures/08_venue_families.png)

The main homes of the catalog's papers are {', '.join(f'{v} ({n})' for v, n in venues[:3])}. ML conferences account for {vd.get('ML conferences', 0)} papers, and {vd.get('arXiv preprint', 0)} exist only on arXiv.

## Categories

| Dimension | Values | Where it comes from |
|---|---|---|
| `paper_type` | method, review, dataset_benchmark, evaluation | summary architecture/goal text and title |
| model family (`paper_architecture`, `tag_kind = 'model_family'`) | CNN, U-Net, RNN/LSTM, MLP, Transformer, GNN, neural operator, diffusion, GAN, VAE/flow/autoencoder, tree ensemble, kernel/GP/SVM, linear/statistical, reservoir computing, clustering, equation discovery, neural network (unspecified) | summary architecture field and title |
| approach (`tag_kind = 'approach'`) | hybrid physics-ML, physics-informed constraints, causal/XAI, data-assimilation scheme | same |
| `arch_group` | 7 coarse groups used in trend plots | mapping in `scripts/taxonomy.py` |
| data source (`paper_data_source`) | ERA5, other/unspecified reanalysis, CMIP/climate models, km-scale simulations, idealized models, operational NWP, radar, satellite, stations/in situ, ocean/sea-ice products, scheme output, generic PDE benchmarks | summary data field |
| goal (`paper_task`) | research goals, e.g. medium-range forecasting, parameterization, downscaling, detection & attribution | summary goal field and title |
| limitation (`paper_issue_theme`) | recurring limitation themes, e.g. idealized setting, reanalysis dependence, blurring, no uncertainty, instability | summary issues field |
| open problem (`paper_open_theme`) | research-agenda themes, e.g. probabilistic forecasts, operational use, online coupling, learning from observations | summary open-work field |
| `probabilistic` | true/false | summary architecture/goal/result and title |
| `venue_family` | publisher/community groups | venue string |
| period | {', '.join(order)} | `PERIODS` in `scripts/taxonomy.py` |

**Fixing a category.** For one paper, add a row to `data/category_overrides.csv` (`paper_id,dimension,label,action,note`, where action is `add`, `remove` or `set`). For a systematic problem, edit the regex in `scripts/taxonomy.py`. Then rerun `python3 scripts/build_db.py && python3 analysis/eda.py`. {n_over} manual corrections are applied.

**Known limitations.** The rules can only see what the summaries say. {n_assess} summaries are partly editorial assessments, and {n_noabs} papers had no abstract available. Multi-label tagging means a paper using a U-Net inside a diffusion model counts under both families.
"""
    open(os.path.join(ROOT, "analysis", "EDA.md"), "w").write(md)
    print("wrote analysis/EDA.md")
