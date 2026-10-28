"""Assemble the "Neural Networks" module decks from slides/src into self-contained HTML files.

    python3 slides/build.py                         # writes every module into slides/
    ONLY=g3 python3 slides/build.py                 # Module 2 with only its intro and group g3 (for testing one group)
    FRAGMENT_DIR=/some/dir python3 slides/build.py  # also writes the artifact version: index.html as a bare
                                                    # fragment and the other modules as full pages, all in one folder

Layout of slides/src:
  common/   deck.css, core.js (helpers, navigation), helpers.js, datasets.js (shared example data), boot.js
  m0 … m6/  one folder per module: its slides (*.html, order below) and demos (*.js, same order)
Each script file goes in its own <script> tag, so an error in one group's demos cannot stop the others.
"""
import html
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
# number, file, title, page <title>, html parts, js parts
MODULES = [
    ("0", "index.html", "Overview", "Neural Networks: Overview", ["m0/slides.html"], ["m0/demos.js"]),
    ("1", "data-foundation.html", "Data Foundation", "Neural Networks: Data Foundation", ["m1/slides.html"], ["m1/demos.js"]),
    ("2", "operations.html", "Operations", "Neural Networks: Operations",
     ["m2/intro.html"] + [f"m2/g{i}.html" for i in range(1, 7)] + ["m2/outro.html"], ["m2/intro.js"] + [f"m2/g{i}.js" for i in range(1, 7)]),
    ("3", "layers.html", "Layers", "Neural Networks: Layers", ["m3/slides.html"], ["m3/demos.js"]),
    ("6", "optimization.html", "Optimization", "Neural Networks: Optimization", ["m6/slides.html"], ["m6/demos.js"]),
]
LATER = [("4", "Blocks"), ("5", "Architecture Families")]
COMMON_JS = ["common/core.js", "common/helpers.js", "common/datasets.js"]


def read(name):
    p = os.path.join(SRC, name)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""


def page(num, title, doc_title, parts, js):
    series = sorted([(n, f, t) for n, f, t, *_ in MODULES] + [(n, None, t) for n, t in LATER], key=lambda m: int(m[0]))
    nav = "".join(
        f'<a href="{f}" class="mod{" on" if n == num else ""}"{" aria-current=\"page\"" if n == num else ""}><span>{n}</span> {t}</a>' if f
        else f'<span class="mod later" title="Coming next"><span>{n}</span> {t}</span>' for n, f, t in series)
    top = f"""<title>{html.escape(doc_title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Neural networks, Module {num}: {html.escape(title)}. Interactive class deck with worked numerical examples.">
<script>
(function(){{var d=document.documentElement,t;try{{t=localStorage.getItem('theme')}}catch(e){{}}if(t)d.dataset.theme=t;d.lang='en';}})()
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&display=swap" rel="stylesheet">
<style>
{read("common/deck.css")}
</style>
<div class="deck">
<header class="top">
  <a class="back" href="https://carlosdhoyos.github.io/semillero/ia-atmosfera-oceano/">← AI study group</a>
  <nav class="series" aria-label="Modules of the series">{nav}</nav>
  <div class="sec" id="secLabel"><b>{html.escape(title)}</b></div>
  <button class="theme-tg" id="themeTg" type="button" aria-label="Switch between light and dark mode"><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
</header>
<main id="main">
"""
    bottom = """
</main>
<footer class="nav-bar">
  <button class="nav" id="prev" type="button" aria-label="Previous slide">← <span class="navlbl">Previous</span></button>
  <div class="dots" id="dots"></div>
  <span class="counter" id="counter"></span>
  <button class="nav" id="next" type="button" aria-label="Next slide"><span class="navlbl">Next</span> →</button>
</footer>
</div>
""" + "".join(f"<script>/* {f} */\n{read(f)}\n</script>\n" for f in COMMON_JS + js + ["common/boot.js"] if read(f))
    return top + "".join(read(p) for p in parts) + bottom


def full(body):
    head, _, rest = body.partition('<div class="deck">')
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n<div class="deck">' + rest + "</body>\n</html>\n")


only = os.environ.get("ONLY")
frag_dir = os.environ.get("FRAGMENT_DIR")
for num, fname, title, doc_title, parts, js in MODULES:
    if only and num == "2":
        parts = ["m2/intro.html", f"m2/{only}.html"]
        js = ["m2/intro.js", f"m2/{only}.js"]
    body = page(num, title, doc_title, parts, js)
    out = os.path.join(ROOT, fname)
    open(out, "w", encoding="utf-8").write(full(body))
    print(f"wrote {fname} ({os.path.getsize(out) / 1024:.0f} KB)")
    if frag_dir:
        os.makedirs(frag_dir, exist_ok=True)
        open(os.path.join(frag_dir, fname), "w", encoding="utf-8").write(body if fname == "index.html" else full(body))
