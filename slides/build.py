"""Assemble the interactive deck from slides/src into one self-contained HTML file.

    python3 slides/build.py                      # writes slides/neural-networks.html
    FRAGMENT_DIR=/some/dir python3 slides/build.py  # also writes a bare fragment for publishing as an artifact

Sources: shell_top.html (title, fonts, header, cover, contents), part1_data.html, part2_arch.html (slides),
shell_bottom.html (footer), deck.css, and the scripts core.js, data.js, arch.js, boot.js (concatenated in that order).
"""
import os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "neural-networks.html")


def read(name):
    return open(os.path.join(SRC, name), encoding="utf-8").read()


body = read("shell_top.html") + read("part1_data.html") + read("part2_arch.html") + read("shell_bottom.html")
body = body.replace("/*CSS*/", read("deck.css"))
body = body.replace("/*JS*/", "\n".join(read(f) for f in ("core.js", "data.js", "arch.js", "boot.js")))
head, _, rest = body.partition('<div class="deck">')
open(OUT, "w", encoding="utf-8").write(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + head + '</head>\n<body>\n<div class="deck">' + rest + "</body>\n</html>\n")
print(f"wrote {OUT} ({os.path.getsize(OUT) / 1024:.0f} KB)")
if os.environ.get("FRAGMENT_DIR"):
    frag = os.path.join(os.environ["FRAGMENT_DIR"], "neural-networks.html")
    open(frag, "w", encoding="utf-8").write(body)
    print(f"wrote {frag}")
