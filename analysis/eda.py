"""Exploratory analysis of the catalog database (data/papers.duckdb).

Writes figures to analysis/figures/ and the tables they are drawn from to analysis/tables/ (CSV),
so every chart has a table view. Run after scripts/build_db.py:

    python3 analysis/eda.py
"""
import os

import sys

import duckdb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator, PercentFormatter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from taxonomy import PERIODS as TAXONOMY_PERIODS, period_sql  # noqa: E402
FIG = os.path.join(ROOT, "analysis", "figures")
TAB = os.path.join(ROOT, "analysis", "tables")
os.makedirs(FIG, exist_ok=True)
os.makedirs(TAB, exist_ok=True)

# Validated categorical order (light mode) + one-hue sequential ramp; text never takes a series color.
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
OTHER = "#a8a7a1"
SEQ = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]
SURFACE, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e6e5e0"
PERIODS = period_sql()
PERIOD_ORDER = [label for label, _ in TAXONOMY_PERIODS]

plt.rcParams.update({
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
    "font.family": "DejaVu Sans", "font.size": 10, "text.color": INK, "axes.labelcolor": INK2,
    "axes.edgecolor": GRID, "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False,
    "axes.spines.right": False, "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8,
    "axes.axisbelow": True, "axes.titlesize": 12, "axes.titleweight": "bold", "axes.titlelocation": "left",
    "legend.frameon": False,
})

con = duckdb.connect(os.path.join(ROOT, "data", "papers.duckdb"), read_only=True)


def df(sql):
    return con.sql(sql).df()


def save(fig, name, note=None):
    if note:
        fig.text(0.01, 0.01, note, fontsize=8, color=INK2, ha="left", va="bottom")
    fig.savefig(os.path.join(FIG, name), dpi=160, bbox_inches="tight")
    plt.close(fig)


def table(frame, name):
    frame.to_csv(os.path.join(TAB, name), index=False)
    return frame


def stacked_bars(ax, pivot, colors, horizontal=False):
    """Stacked bars with a 2px surface gap between segments."""
    base = None
    for col, color in zip(pivot.columns, colors):
        vals = pivot[col].values
        kw = dict(color=color, edgecolor=SURFACE, linewidth=1.5, label=col)
        if horizontal:
            ax.barh(pivot.index, vals, left=base, height=0.62, **kw)
        else:
            ax.bar(pivot.index, vals, bottom=base, width=0.72, **kw)
        base = vals if base is None else base + vals


def fold(frame, key, value, keep):
    """Keep the `keep` largest categories, fold the rest into 'Other' (never cycle colors)."""
    top = frame.groupby(key)[value].sum().sort_values(ascending=False).index[:keep]
    frame = frame.copy()
    frame[key] = frame[key].where(frame[key].isin(top), "Other")
    return frame, list(top) + (["Other"] if (frame[key] == "Other").any() else [])


# 1. Papers per year by primary subfield (top 7 + Other)
d = df("SELECT year, primary_subfield_label AS subfield, count(*) AS n FROM papers WHERE year >= 2012 GROUP BY ALL")
d, order = fold(d, "subfield", "n", 7)
pv = d.pivot_table(index="year", columns="subfield", values="n", aggfunc="sum", fill_value=0)[order]
table(pv.reset_index(), "papers_per_year_by_subfield.csv")
fig, ax = plt.subplots(figsize=(10, 4.8))
stacked_bars(ax, pv, SERIES[:7] + [OTHER])
ax.set_title("Papers per year, by primary subfield")
ax.set_ylabel("Papers in catalog")
ax.xaxis.set_major_locator(MaxNLocator(integer=True))
ax.grid(axis="x", visible=False)
ax.legend(loc="upper left", fontsize=8.5, ncol=2)
save(fig, "01_papers_per_year_by_subfield.png",
     f"Curated catalog ({int(pv.values.sum())} papers since 2012), not a census of the field.")

# 2. Architecture families (model families only), method + benchmark papers
d = table(df("""SELECT family, count(DISTINCT paper_id) AS papers FROM paper_architecture a JOIN papers p USING (paper_id)
                WHERE tag_kind = 'model_family' AND p.paper_type IN ('method', 'dataset_benchmark', 'evaluation')
                GROUP BY family ORDER BY papers, family DESC"""), "architecture_families.csv")
fig, ax = plt.subplots(figsize=(8, 5.6))
ax.barh(d["family"], d["papers"], color=SERIES[0], height=0.62)
for y, v in enumerate(d["papers"]):
    ax.text(v + 0.8, y, str(v), va="center", fontsize=8.5, color=INK2)
ax.set_title("Model families used (papers can use several)")
ax.set_xlabel("Papers")
ax.grid(axis="y", visible=False)
save(fig, "02_architecture_families.png", "Method, benchmark and evaluation papers; reviews excluded.")

# 3. Architecture group share by period (100% stacked)
d = df(f"""WITH t AS (SELECT DISTINCT a.paper_id, a.arch_group, {PERIODS} AS period FROM paper_architecture a
             JOIN papers p USING (paper_id) WHERE tag_kind = 'model_family')
           SELECT period, arch_group, count(*) AS n FROM t GROUP BY ALL""")
groups = ["CNN / U-Net", "MLP / generic NN", "RNN / LSTM", "Classical ML", "Generative (diffusion/GAN/VAE)",
          "Transformers", "Graph & operator nets"]
pv = d.pivot_table(index="period", columns="arch_group", values="n", aggfunc="sum", fill_value=0).reindex(PERIOD_ORDER, fill_value=0).reindex(columns=groups, fill_value=0)
share = pv.div(pv.sum(axis=1), axis=0)
table(pv.assign(total=pv.sum(axis=1)).reset_index(), "architecture_groups_by_period.csv")
fig, ax = plt.subplots(figsize=(10, 4.6))
stacked_bars(ax, share.iloc[::-1], SERIES[:7], horizontal=True)
ax.xaxis.set_major_formatter(PercentFormatter(1.0))
ax.set_xlim(0, 1)
ax.set_title("Share of architecture tags by period")
ax.grid(axis="y", visible=False)
for i, (period, total) in enumerate(pv.sum(axis=1).iloc[::-1].items()):
    ax.text(1.01, i, f"n={total}", va="center", fontsize=8.5, color=INK2, transform=ax.get_yaxis_transform())
ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=4, fontsize=8.5)
save(fig, "03_architecture_share_by_period.png")

# 4. Data sources by period (heatmap, sequential)
d = df(f"""SELECT {PERIODS} AS period, source, count(DISTINCT paper_id) AS n FROM paper_data_source
           JOIN papers USING (paper_id) GROUP BY ALL""")
pv = d.pivot_table(index="source", columns="period", values="n", aggfunc="sum", fill_value=0).reindex(columns=PERIOD_ORDER, fill_value=0)
pv = pv.loc[pv.sum(axis=1).sort_values(ascending=False).index]
table(pv.reset_index(), "data_sources_by_period.csv")
fig, ax = plt.subplots(figsize=(8.5, 5.4))
from matplotlib.colors import BoundaryNorm, ListedColormap
bounds = [0, 1, 3, 6, 10, 15, 20, 30]
cmap = ListedColormap(["#f3f2ee"] + SEQ[:6])
im = ax.imshow(pv.values, cmap=cmap, norm=BoundaryNorm(bounds, cmap.N), aspect="auto")
ax.set_xticks(range(len(PERIOD_ORDER)), PERIOD_ORDER)
ax.set_yticks(range(len(pv.index)), pv.index)
ax.grid(False)
for s in ax.spines.values():
    s.set_visible(False)
for i in range(pv.shape[0]):
    for j in range(pv.shape[1]):
        v = pv.values[i, j]
        ax.text(j, i, v, ha="center", va="center", fontsize=8.5, color="#ffffff" if v >= 10 else INK)
ax.set_title("Training and evaluation data sources over time (papers)")
save(fig, "04_data_sources_by_period.png")

# 5. Architecture family x subfield (counts)
d = df("""SELECT s.label AS subfield, a.arch_group, count(DISTINCT a.paper_id) AS n FROM paper_architecture a
          JOIN subfields s USING (paper_id) WHERE a.tag_kind = 'model_family' AND s.subfield NOT IN ('review')
          GROUP BY ALL""")
pv = d.pivot_table(index="subfield", columns="arch_group", values="n", aggfunc="sum", fill_value=0)[groups]
pv = pv.loc[pv.sum(axis=1).sort_values(ascending=False).index]
table(pv.reset_index(), "architecture_by_subfield.csv")
fig, ax = plt.subplots(figsize=(10, 6.4))
im = ax.imshow(pv.values, cmap=cmap, norm=BoundaryNorm(bounds, cmap.N), aspect="auto")
ax.set_xticks(range(len(groups)), [g.replace(" (", "\n(") for g in groups], fontsize=8.5)
ax.set_yticks(range(len(pv.index)), pv.index)
ax.grid(False)
for s in ax.spines.values():
    s.set_visible(False)
for i in range(pv.shape[0]):
    for j in range(pv.shape[1]):
        v = pv.values[i, j]
        if v:
            ax.text(j, i, v, ha="center", va="center", fontsize=8.5, color="#ffffff" if v >= 10 else INK)
ax.set_title("Which architectures each subfield uses (papers, all subfield tags)")
save(fig, "05_architecture_by_subfield.png")

# 6. Citation impact by architecture group (median citations/year, 2018+ method papers)
d = table(df("""SELECT a.arch_group, count(DISTINCT p.paper_id) AS papers,
                  median(p.citations_per_year) AS median_cites_per_year,
                  quantile_cont(p.citations_per_year, 0.25) AS q25, quantile_cont(p.citations_per_year, 0.75) AS q75
                FROM paper_architecture a JOIN papers p USING (paper_id)
                WHERE a.tag_kind = 'model_family' AND p.paper_type = 'method'
                  AND p.year BETWEEN 2018 AND (SELECT max(year) - 2 FROM papers)
                GROUP BY ALL ORDER BY median_cites_per_year"""), "citations_by_architecture.csv")
fig, ax = plt.subplots(figsize=(8, 4.4))
y = range(len(d))
ax.hlines(y, d["q25"], d["q75"], color=SEQ[2], linewidth=2)
ax.plot(d["median_cites_per_year"], y, "o", color=SERIES[0], markersize=8, markeredgecolor=SURFACE, markeredgewidth=2)
ax.set_yticks(list(y), [f"{g}  (n={n})" for g, n in zip(d["arch_group"], d["papers"])])
ax.set_xlabel("Citations per year (dot = median, bar = interquartile range)")
ax.set_title("Citation rate by architecture group, method papers 2018 to two years ago")
ax.grid(axis="y", visible=False)
save(fig, "06_citations_by_architecture.png")

# 7. Probabilistic share among method papers, by period
d = df(f"""SELECT {PERIODS} AS period, count(*) AS method_papers,
            sum(probabilistic::INT)::INT AS probabilistic, round(avg(probabilistic::INT), 3) AS share
          FROM papers WHERE paper_type = 'method' GROUP BY ALL""")
d = table(d.set_index("period").reindex(PERIOD_ORDER).reset_index(), "probabilistic_share_by_period.csv")
fig, ax = plt.subplots(figsize=(7, 3.8))
ax.plot(d["period"], d["share"], color=SERIES[0], linewidth=2, marker="o", markersize=8,
        markeredgecolor=SURFACE, markeredgewidth=2)
for x, (s, n) in enumerate(zip(d["share"], d["method_papers"])):
    ax.annotate(f"{s:.0%} of {n}", (x, s), textcoords="offset points", xytext=(0, 10), ha="center", fontsize=8.5, color=INK2)
ax.yaxis.set_major_formatter(PercentFormatter(1.0))
ax.set_ylim(0, max(1.0, d["share"].max() + 0.1))
ax.set_title("Share of method papers with probabilistic output")
ax.grid(axis="x", visible=False)
save(fig, "07_probabilistic_share.png")

# 8. Venue families by publication type
d = df("SELECT venue_family, kind, count(*) AS n FROM papers GROUP BY ALL")
pv = d.pivot_table(index="venue_family", columns="kind", values="n", aggfunc="sum", fill_value=0)
pv = pv[[k for k in ["journal", "conference", "preprint"] if k in pv.columns]]
pv = pv.loc[pv.sum(axis=1).sort_values().index]
table(pv.reset_index(), "venue_families.csv")
fig, ax = plt.subplots(figsize=(8, 5))
stacked_bars(ax, pv, SERIES[:3], horizontal=True)
ax.set_title("Where the papers are published")
ax.set_xlabel("Papers")
ax.grid(axis="y", visible=False)
ax.legend(["Journal", "Conference", "arXiv only"], loc="lower right")
save(fig, "08_venue_families.png")



def heat(ax, pv, fmt=lambda v: v, scale=None):
    """Sequential heatmap with cell labels (table view lives in analysis/tables/)."""
    from matplotlib.colors import BoundaryNorm, ListedColormap
    vals = pv.values.astype(float)
    top = scale or max(1.0, vals.max())
    bounds = [0] + [top * f for f in (0.02, 0.1, 0.2, 0.35, 0.5, 0.7)] + [top * 1.0001]
    cm = ListedColormap(["#f3f2ee"] + SEQ[:6])
    ax.imshow(vals, cmap=cm, norm=BoundaryNorm(bounds, cm.N), aspect="auto")
    ax.grid(False)
    for sp in ax.spines.values():
        sp.set_visible(False)
    for i in range(vals.shape[0]):
        for j in range(vals.shape[1]):
            v = vals[i, j]
            if v:
                ax.text(j, i, fmt(v), ha="center", va="center", fontsize=8.5, color="#ffffff" if v >= top * 0.35 else INK)


# 9. Research goals by period (papers)
d = df(f"""SELECT {PERIODS} AS period, task, count(DISTINCT paper_id) AS n FROM paper_task JOIN papers USING (paper_id)
           GROUP BY ALL""")
pv = d.pivot_table(index="task", columns="period", values="n", aggfunc="sum", fill_value=0).reindex(columns=PERIOD_ORDER, fill_value=0)
pv = pv.loc[pv.sum(axis=1).sort_values(ascending=False).index]
table(pv.reset_index(), "goals_by_period.csv")
fig, ax = plt.subplots(figsize=(8.5, 6.4))
heat(ax, pv, fmt=lambda v: f"{v:.0f}")
ax.set_xticks(range(len(PERIOD_ORDER)), PERIOD_ORDER)
ax.set_yticks(range(len(pv.index)), pv.index)
ax.set_title("Research goals over time (papers)")
save(fig, "09_goals_by_period.png")

# 10. Limitation themes by architecture group (% of each group's papers)
d = df("""WITH g AS (SELECT DISTINCT a.paper_id, a.arch_group FROM paper_architecture a JOIN papers p USING (paper_id)
                    WHERE a.tag_kind = 'model_family' AND p.paper_type <> 'review')
          SELECT g.arch_group, i.theme, count(*) AS n, any_value((SELECT count(*) FROM g g2 WHERE g2.arch_group = g.arch_group)) AS total
          FROM g JOIN paper_issue_theme i USING (paper_id)
          WHERE i.theme NOT IN ('Summary uncertain (no abstract)', 'Review dates quickly') GROUP BY ALL""")
d["share"] = d["n"] / d["total"]
groups_present = [g for g in groups if g in set(d["arch_group"])]
pv = d.pivot_table(index="theme", columns="arch_group", values="share", aggfunc="sum", fill_value=0)[groups_present]
pv = pv.loc[pv.mean(axis=1).sort_values(ascending=False).index]
table((pv * 100).round(1).reset_index(), "limitations_by_architecture_pct.csv")
fig, ax = plt.subplots(figsize=(10, 6.2))
heat(ax, pv * 100, fmt=lambda v: f"{v:.0f}%", scale=50)
ax.set_xticks(range(len(groups_present)), [g.replace(" (", "\n(") for g in groups_present], fontsize=8.5)
ax.set_yticks(range(len(pv.index)), pv.index)
ax.set_title("Reported limitations by architecture group (% of the group's papers)")
save(fig, "10_limitations_by_architecture.png")

print("figures:", sorted(os.listdir(FIG)))

import report  # noqa: E402  (writes analysis/EDA.md from the same database)
report.write(con, PERIODS, PERIOD_ORDER)
