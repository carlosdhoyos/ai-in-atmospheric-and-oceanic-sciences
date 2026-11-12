"""Build the standalone Earth-2 deck (NVIDIA Earth-2 AI weather and climate models) from slides/src/e2.

    python3 slides/build_e2.py                           # writes slides/earth2/index.html
    ONLY=30-downscale python3 slides/build_e2.py         # intro + one section only (for testing a section)
    FRAGMENT=/some/file.html python3 slides/build_e2.py  # also writes the artifact version (no <html>/<head> wrapper)

It reuses the series' look (common/deck.css, core.js, helpers.js, boot.js) with its own header.
Sections live in src/e2 as NN-name.html + NN-name.js, in file-name order; shared code is in src/e2/lib.
"""
import glob
import html
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
E2 = os.path.join(SRC, "e2")
TITLE = "NVIDIA Earth-2: AI weather and climate models"
# section links in the header: (label, slide id of the section's first slide)
SECTIONS = [("1 Platform", "s-platform"), ("2 Global forecast", "s-global"), ("3 Data assimilation", "s-da"),
            ("4 Downscaling", "s-downscale"), ("5 Nowcasting", "s-nowcast"), ("6 Climate", "s-climate"), ("7 Earth2Studio", "s-studio")]
LIB = ["e2/lib/e2.js"]


def read(name):
    p = os.path.join(SRC, name)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""


def build():
    only = os.environ.get("ONLY")
    parts = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(E2, "*.html")))
    if only:
        parts = [p for p in parts if p.startswith("00-") or p == only]
    nav = "".join(f'<button type="button" class="mod" data-go="{sid}"><span>{lab.split(" ", 1)[0]}</span> {html.escape(lab.split(" ", 1)[1])}</button>' for lab, sid in SECTIONS)
    js = ["common/core.js", "common/helpers.js"] + LIB + [f"e2/{p}.js" for p in parts] + ["common/boot.js"]
    body = f"""<title>{html.escape(TITLE)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Interactive class deck on NVIDIA Earth-2: FourCastNet, SFNO, FourCastNet 3, Atlas, HealDA, CorrDiff, StormCast, StormScope, cBottle, DLESyM and Earth2Studio, with toy demos of how each works.">
<script>
(function(){{var d=document.documentElement,t;try{{t=localStorage.getItem('theme')}}catch(e){{}}if(t)d.dataset.theme=t;d.lang='en';}})()
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&display=swap" rel="stylesheet">
<style>
{read("common/deck.css")}
{read("e2/e2.css")}
</style>
<div class="deck">
<header class="top">
  <span class="back">Earth-2</span>
  <nav class="series" aria-label="Sections">{nav}</nav>
  <div class="sec" id="secLabel"><b></b></div>
  <button class="theme-tg" id="themeTg" type="button" aria-label="Switch between light and dark mode"><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
</header>
<main id="main">
""" + "".join(read(f"e2/{p}.html") for p in parts) + """
</main>
<footer class="nav-bar">
  <button class="nav" id="prev" type="button" aria-label="Previous slide">← <span class="navlbl">Previous</span></button>
  <div class="dots" id="dots"></div>
  <span class="counter" id="counter"></span>
  <button class="nav" id="next" type="button" aria-label="Next slide"><span class="navlbl">Next</span> →</button>
</footer>
</div>
""" + "".join(f"<script>/* {f} */\n{read(f)}\n</script>\n" for f in js if read(f))
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + body.partition('<div class="deck">')[0] + '</head>\n<body>\n<div class="deck">' + body.partition('<div class="deck">')[2] + "</body>\n</html>\n")
    out = os.path.join(ROOT, "earth2", "index.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(full)
    print(f"wrote earth2/index.html ({os.path.getsize(out) / 1024:.0f} KB, sections: {', '.join(parts)})")
    if os.environ.get("FRAGMENT"):
        open(os.environ["FRAGMENT"], "w", encoding="utf-8").write(body)


build()
