"""Build the standalone PAE-Minas deck (Ni-laterite prospectivity with machine learning) from slides/src/pae.

    python3 slides/build_pae.py                          # writes slides/pae-minas/index.html
    ONLY=40-boost python3 slides/build_pae.py            # intro + one section only (for testing a section)
    FRAGMENT=/some/file.html python3 slides/build_pae.py  # also writes the artifact version (no <html>/<head> wrapper)

It reuses the series' look (common/deck.css, core.js, helpers.js, boot.js) with its own header and Spanish labels.
Sections live in src/pae as NN-name.html + NN-name.js, in file-name order; shared code is in src/pae/lib.
"""
import glob
import html
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
PAE = os.path.join(SRC, "pae")
TITLE = "Prospectividad de Ni-laterita con aprendizaje automático"
# section links in the header: (label, slide id of the section's first slide)
SECTIONS = [("1 Problema", "s-problema"), ("2 Regresión logística", "s-logistica"), ("3 Validación y mapas", "s-validacion"),
            ("4 Árboles y bosques", "s-bosques"), ("5 Boosting", "s-boosting"), ("6 SVM y otros", "s-svm"), ("7 Comparación", "s-comparacion")]
LIB = ["pae/lib/area.js", "pae/lib/ml.js", "pae/lib/viz.js"]


def read(name):
    p = os.path.join(SRC, name)
    t = open(p, encoding="utf-8").read() if os.path.exists(p) else ""
    # Spanish (Colombia) number format: decimal comma, dot for thousands
    return t.replace('toLocaleString("en-US"', 'toLocaleString("es-CO"') if name == "common/core.js" else t


def build():
    only = os.environ.get("ONLY")
    parts = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(PAE, "*.html")))
    if only:
        parts = [p for p in parts if p.startswith("00-") or p == only]
    nav = "".join(f'<button type="button" class="mod" data-go="{sid}"><span>{lab.split(" ", 1)[0]}</span> {html.escape(lab.split(" ", 1)[1])}</button>' for lab, sid in SECTIONS)
    js = ["common/core.js", "common/helpers.js"] + LIB + [f"pae/{p}.js" for p in parts] + ["common/boot.js"]
    body = f"""<title>{html.escape(TITLE)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="PAE-Minas: presentación interactiva sobre regresión logística, árboles, Random Forest, XGBoost, LightGBM y SVM para prospectividad de níquel laterítico (Cerro Matoso, datos sintéticos).">
<script>
(function(){{var d=document.documentElement,t;try{{t=localStorage.getItem('theme')}}catch(e){{}}if(t)d.dataset.theme=t;d.lang='es';}})()
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&display=swap" rel="stylesheet">
<style>
{read("common/deck.css")}
{read("pae/pae.css")}
</style>
<div class="deck">
<header class="top">
  <a class="back" href="https://carlosdhoyos.github.io/cursos/pae-minas/">← PAE-Minas</a>
  <nav class="series" aria-label="Secciones">{nav}</nav>
  <div class="sec" id="secLabel"><b></b></div>
  <button class="theme-tg" id="themeTg" type="button" aria-label="Cambiar entre modo claro y oscuro"><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
</header>
<main id="main">
""" + "".join(read(f"pae/{p}.html") for p in parts) + """
</main>
<footer class="nav-bar">
  <button class="nav" id="prev" type="button" aria-label="Diapositiva anterior">← <span class="navlbl">Anterior</span></button>
  <div class="dots" id="dots"></div>
  <span class="counter" id="counter"></span>
  <button class="nav" id="next" type="button" aria-label="Diapositiva siguiente"><span class="navlbl">Siguiente</span> →</button>
</footer>
</div>
""" + "".join(f"<script>/* {f} */\n{read(f)}\n</script>\n" for f in js if read(f))
    full = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + body.partition('<div class="deck">')[0] + '</head>\n<body>\n<div class="deck">' + body.partition('<div class="deck">')[2] + "</body>\n</html>\n")
    out = os.path.join(ROOT, "pae-minas", "index.html")
    # decks go to the public site: never link private claude.ai artifacts
    assert "claude.ai/artifact" not in full, "deck links a private claude.ai artifact"
    open(out, "w", encoding="utf-8").write(full)
    print(f"wrote pae-minas/index.html ({os.path.getsize(out) / 1024:.0f} KB, sections: {', '.join(parts)})")
    if os.environ.get("FRAGMENT"):
        open(os.environ["FRAGMENT"], "w", encoding="utf-8").write(body)


build()
