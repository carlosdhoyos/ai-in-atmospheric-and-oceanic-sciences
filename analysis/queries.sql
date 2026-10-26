-- Example queries for data/papers.duckdb
-- Run with:  duckdb data/papers.duckdb < analysis/queries.sql
-- or in Python: duckdb.connect("data/papers.duckdb", read_only=True).sql("...").df()

-- 1. Everything about one paper, with its categories as lists
SELECT title, year, venue, citations, paper_type, probabilistic, subfields, architectures, data_sources
FROM v_papers_wide WHERE title ILIKE '%graphcast%' OR title ILIKE 'Learning skillful medium-range%';

-- 2. Papers per year and paper type
SELECT year, paper_type, count(*) AS n FROM papers GROUP BY ALL ORDER BY year, paper_type;

-- 3. Model families per subfield (counts each paper once per family/subfield pair)
SELECT s.label AS subfield, a.family, count(DISTINCT a.paper_id) AS papers
FROM paper_architecture a JOIN subfields s USING (paper_id)
WHERE a.tag_kind = 'model_family'
GROUP BY ALL ORDER BY subfield, papers DESC;

-- 4. Trend of one family: diffusion and flow-matching models per year
SELECT p.year, count(*) AS papers
FROM paper_architecture a JOIN papers p USING (paper_id)
WHERE a.family = 'Diffusion / flow matching' GROUP BY ALL ORDER BY year;

-- 5. Most-cited papers trained on ERA5 that produce probabilistic output
SELECT p.title, p.year, p.citations
FROM papers p JOIN paper_data_source d USING (paper_id)
WHERE d.source = 'ERA5' AND p.probabilistic ORDER BY p.citations DESC LIMIT 15;

-- 6. Co-occurrence of architecture and data source
SELECT a.arch_group, d.source, count(DISTINCT a.paper_id) AS papers
FROM paper_architecture a JOIN paper_data_source d USING (paper_id)
WHERE a.tag_kind = 'model_family'
GROUP BY ALL HAVING papers >= 3 ORDER BY papers DESC;

-- 7. Search the structured summaries (e.g. what papers say about instability)
SELECT p.title, s.issues FROM summaries s JOIN papers p USING (paper_id)
WHERE s.issues ILIKE '%instab%' OR s.open_work ILIKE '%stabil%' ORDER BY p.citations DESC;

-- 8. Most prolific authors in the catalog
SELECT name, count(*) AS papers, sum(p.citations) AS citations
FROM authors JOIN papers p USING (paper_id) GROUP BY name HAVING papers >= 4 ORDER BY papers DESC, citations DESC;

-- 9. Papers whose category was changed by hand
SELECT p.title, o.dimension, o.label, o.action, o.note FROM category_overrides o JOIN papers p USING (paper_id);

-- 10. Goals by architecture group (the cross-tab shown in the Insights tab)
SELECT t.task, a.arch_group, count(DISTINCT t.paper_id) AS papers
FROM paper_task t JOIN paper_architecture a USING (paper_id)
WHERE a.tag_kind = 'model_family' GROUP BY ALL ORDER BY papers DESC;

-- 11. Which limitations are reported for which architecture groups (share of each group's papers)
WITH g AS (SELECT DISTINCT paper_id, arch_group FROM paper_architecture WHERE tag_kind = 'model_family')
SELECT g.arch_group, i.theme, count(*) AS papers,
       round(100.0 * count(*) / any_value((SELECT count(*) FROM g g2 WHERE g2.arch_group = g.arch_group)), 1) AS pct_of_group
FROM g JOIN paper_issue_theme i USING (paper_id) GROUP BY ALL ORDER BY arch_group, papers DESC;

-- 12. First paper in the catalog for each architecture family ("since when")
SELECT family, min(p.year) AS since, arg_min(p.title, p.year) AS first_paper, count(*) AS papers
FROM paper_architecture a JOIN papers p USING (paper_id) GROUP BY family ORDER BY since;
