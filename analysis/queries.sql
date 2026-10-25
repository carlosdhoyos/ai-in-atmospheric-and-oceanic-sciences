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

-- 4. Trend of one family: diffusion models per year
SELECT p.year, count(*) AS papers
FROM paper_architecture a JOIN papers p USING (paper_id)
WHERE a.family = 'Diffusion model' GROUP BY ALL ORDER BY year;

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
