#!/usr/bin/env python3
"""Embed a project's built homepage inside a portfolio page.

The live frames (css/styles.css LIVE FRAMES, js/app.js LIVE) can show a
project's own build. In production the build sits on the client's domain,
which the portfolio page may not read or even frame; so instead the build's
code is carried inside the portfolio page itself, minified, and app.js hands
it to each frame as `srcdoc` — a frame of the page's own origin, wherever the
page is served.

    python3 tools/embed_build.py BUILD.html PAGE.html NAME ASSET_DIR

  BUILD.html  the project's built index.html (one self-contained page:
              inline CSS and JS, with images under a relative assets/ path)
  PAGE.html   the portfolio page to embed it in; it must hold the markers
              <!-- BUILD:NAME --> and <!-- /BUILD:NAME -->
  NAME        the build's name — the frames ask for it with data-build
  ASSET_DIR   where the build's images now live, relative to PAGE.html
              (e.g. assets/crownpoint/site/); every relative assets/ path
              in the build is pointed there

What the minifier does is deliberately conservative — only changes that
cannot alter how the page renders or runs:
  * HTML comments go; runs of whitespace between tags become one space.
  * CSS loses its comments and the whitespace around braces, semicolons,
    colons and commas.
  * JS keeps its line breaks (so automatic semicolons still fall where they
    did) and loses indentation, blank lines and whole-line comments.
Then every `</script` is escaped so the build can sit inside a
<script type="text/plain"> without closing it; app.js undoes that.
"""
import re
import sys


def minify_css(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};,])\s*", r"\1", css)
    css = re.sub(r":\s+", ":", css)
    return css.replace(";}", "}").strip()


def minify_js(js):
    js = re.sub(r"^\s*/\*.*?\*/\s*$", "", js, flags=re.S | re.M)
    out = []
    for line in js.split("\n"):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        out.append(line)
    return "\n".join(out)


def minify_html(html):
    html = re.sub(r"<!--(?!\[if).*?-->", "", html, flags=re.S)
    parts = re.split(r"(<style\b[^>]*>.*?</style>|<script\b[^>]*>.*?</script>)", html, flags=re.S | re.I)
    out = []
    for part in parts:
        m = re.match(r"(<style\b[^>]*>)(.*?)(</style>)$", part, flags=re.S | re.I)
        if m:
            out.append(m.group(1) + minify_css(m.group(2)) + m.group(3))
            continue
        m = re.match(r"(<script\b[^>]*>)(.*?)(</script>)$", part, flags=re.S | re.I)
        if m:
            body = m.group(2)
            if "application/ld+json" in m.group(1):
                body = re.sub(r"\s+", " ", body).strip()
            else:
                body = minify_js(body)
            out.append(m.group(1) + body + m.group(3))
            continue
        out.append(re.sub(r"\s+", " ", part))
    return "".join(out).strip()


def main():
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    build_path, page_path, name, asset_dir = sys.argv[1:]
    asset_dir = asset_dir.rstrip("/") + "/"

    build = open(build_path, encoding="utf-8").read()
    # point the build's own images at their new home
    build = re.sub(r"""(?<=["'(\s])assets/""", asset_dir, build)
    small = minify_html(build)
    if re.search(r"<!--", small):
        sys.exit("the minified build still holds '<!--', which would upset the <script> it sits in")
    embedded = re.sub(r"</(script)", r"<\\/\1", small, flags=re.I)

    page = open(page_path, encoding="utf-8").read()
    start, end = f"<!-- BUILD:{name} -->", f"<!-- /BUILD:{name} -->"
    if start not in page or end not in page:
        sys.exit(f"{page_path} has no {start} … {end} markers")
    block = f'{start}\n  <script type="text/plain" id="build-{name}">{embedded}</script>\n  {end}'
    page = re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: block, page, flags=re.S)
    open(page_path, "w", encoding="utf-8").write(page)

    print(f"{name}: {len(build):,} bytes -> {len(small):,} minified, embedded in {page_path}")


if __name__ == "__main__":
    main()
