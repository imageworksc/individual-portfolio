#!/usr/bin/env python3
"""Embed a project's built homepage inside a portfolio page.

The live frames (css/styles.css LIVE FRAMES, js/app.js LIVE) can show a
project's own build. In production the build sits on the client's domain,
which the portfolio page may not read or even frame; so instead the build's
code is carried inside the portfolio page itself, minified, and app.js hands
it to each frame as `srcdoc` — a frame of the page's own origin, wherever the
page is served.

    python3 tools/embed_build.py SOURCE PAGE.html NAME ASSET_DIR [--hide SELECTORS]

  SOURCE      the build: its published URL (https://…/index.html, or a
              folder URL ending in /, fetched as it is), or a local
              index.html
  PAGE.html   the portfolio page to embed it in; it must hold the markers
              <!-- BUILD:NAME --> and <!-- /BUILD:NAME -->
  NAME        the build's name — the frames ask for it with data-build
  ASSET_DIR   where the build's files are to live, relative to PAGE.html
              (e.g. assets/crownpoint/site/)
  --hide      elements of the live site that have no place in a portfolio
              frame, in every frame of the build (a cookie banner, say):
              a CSS selector list, hidden by a style added to its <head>

From a URL, the build is bundled into one page first: its own stylesheets
and scripts are fetched and written inline (a deferred script moves to the
end of the body, where it would have run), and every image, font and video
it uses — in the HTML, in its CSS, and named in its scripts — is downloaded
into ASSET_DIR under the path it had on the site, and the reference pointed
there. Stylesheets and scripts from other hosts (Google Fonts, a CDN) stay
links, and so does a large library the site serves itself when it is
listed in CDN (pointed at the same version on cdnjs). Favicons and preload
hints go, and so does analytics (ANALYTICS), which would otherwise count
portfolio visits in the client's reports. From a local file, only the build's
relative assets/ paths are pointed at ASSET_DIR (its files must already be
there).

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
import os
import re
import sys
import urllib.parse
import urllib.request

ASSET_EXT = r"(?:jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mov|woff2?|ttf|otf|eot|json)"
UA = {"User-Agent": "Mozilla/5.0 (portfolio embed)"}

# analytics and tracking have no place in a portfolio frame: run there, they
# would count portfolio visits in the client's own reports
ANALYTICS = r"googletagmanager|google-analytics|crazyegg|hotjar|clarity\.ms|connect\.facebook|google_tag/|doubleclick"
ANALYTICS_INLINE = r"\bgtag\(|\bdataLayer\b|\bfbq\(|_hjSettings|\bclarity\(|GoogleAnalyticsObject"

# well-known libraries a site may serve itself, too big to carry inline: the
# script is pointed at the same version on cdnjs instead ({v} from ?v=)
CDN = {
    r"/fontawesome/js/all\.min\.js": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/{v}/js/all.min.js",
    r"/fontawesome/js/v4-shims\.min\.js": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/{v}/js/v4-shims.min.js",
}


# ---------- minify ----------

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
    parts = re.split(r"(<style\b[^>]*>.*?</style>|<script\b[^>]*>.*?</script>|<textarea\b[^>]*>.*?</textarea>|<pre\b[^>]*>.*?</pre>)",
                     html, flags=re.S | re.I)
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
        if re.match(r"<(textarea|pre)\b", part, flags=re.I):
            out.append(part)
            continue
        out.append(re.sub(r"\s+", " ", part))
    return "".join(out).strip()


# ---------- bundle (from a URL) ----------

def fetch(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", errors="replace")


class Bundler:
    def __init__(self, page_url, asset_dir, page_dir):
        self.page_url = page_url
        # the site's root: the folder the page sits in
        self.root = page_url.rsplit("/", 1)[0] + "/"
        self.asset_dir = asset_dir
        self.disk_dir = os.path.join(page_dir, asset_dir)
        self.saved = {}

    def local(self, ref, base):
        """The new path for an asset the build refers to, saving it first;
        None for anything that is not one of the site's own files."""
        ref = ref.strip()
        if not ref or ref.startswith(("data:", "blob:", "#", "mailto:", "tel:", "javascript:", self.asset_dir)):
            return None
        absolute = urllib.parse.urljoin(base, ref)
        bare = absolute.split("#", 1)[0].split("?", 1)[0]
        if not bare.startswith(self.root) or not re.search(r"\." + ASSET_EXT + r"$", bare, flags=re.I):
            return None
        rel = bare[len(self.root):]
        if rel not in self.saved:
            # saved under its real name ("Group 2.png", not "Group%202.png"),
            # referred to by its URL-encoded one
            name = urllib.parse.unquote(rel)
            path = os.path.join(self.disk_dir, name)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            try:
                data = fetch(bare, binary=True)
            except Exception as err:  # a reference to a file the site does not have
                print(f"  skipped {rel}: {err}")
                self.saved[rel] = None
                return None
            open(path, "wb").write(data)
            self.saved[rel] = self.asset_dir + urllib.parse.quote(name)
        return self.saved[rel]

    def css(self, css, base):
        def url(m):
            new = self.local(m.group(2), base)
            return f"url({m.group(1)}{new}{m.group(1)})" if new else m.group(0)
        css = re.sub(r"""url\(\s*(['"]?)([^'")]+)\1\s*\)""", url, css)
        # an @import of the site's own sheet is written in place
        def imp(m):
            href = urllib.parse.urljoin(base, m.group(2))
            if not href.startswith(self.root):
                return m.group(0)
            return self.css(fetch(href), href)
        return re.sub(r"""@import\s+(?:url\()?\s*(['"])([^'"]+)\1\s*\)?\s*;""", imp, css)

    def js(self, js, base):
        # a path to one of the site's files written as a string in a script
        def string(m):
            new = self.local(m.group(2), base)
            return f"{m.group(1)}{new}{m.group(1)}" if new else m.group(0)
        return re.sub(r"""(['"`])([^'"`\s]+\.""" + ASSET_EXT + r"""(?:\?[^'"`\s]*)?)\1""", string, js, flags=re.I)

    def attrs(self, tag):
        def one(m):
            name, quote, value = m.group(1), m.group(2), m.group(3)
            if name.lower() in ("srcset", "data-srcset", "imagesrcset"):
                pieces = []
                for item in value.split(","):
                    bits = item.strip().split()
                    if bits:
                        new = self.local(bits[0], self.page_url)
                        pieces.append(" ".join([new or bits[0]] + bits[1:]))
                return f"{name}={quote}{', '.join(pieces)}{quote}"
            if name.lower() == "style":
                return f"{name}={quote}{self.css(value, self.page_url)}{quote}"
            new = self.local(value, self.page_url)
            return f"{name}={quote}{new}{quote}" if new else m.group(0)
        return re.sub(r"""\b(src|href|srcset|data-src|data-srcset|data-bg|poster|imagesrcset|style|content)=(["'])(.*?)\2""", one, tag, flags=re.I | re.S)

    def run(self):
        html = fetch(self.page_url)
        tail = []

        # favicons, manifests and preload hints have no place in a frame
        html = re.sub(r"""<link\b[^>]*\brel=["'](?:[^"']*\s)?(?:icon|apple-touch-icon|manifest|mask-icon|preload|prefetch|modulepreload)(?:\s[^"']*)?["'][^>]*>""", "", html, flags=re.I)

        # tracking scripts go, and so does their <noscript> fallback
        def tracker(m):
            tag, body = m.group(1), m.group(2)
            if re.search(r"""\bsrc=["'][^"']*(?:""" + ANALYTICS + ")", tag, flags=re.I):
                return ""
            if not re.search(r"\bsrc=", tag) and "json" not in tag.lower() and re.search(ANALYTICS_INLINE, body):
                return ""
            return m.group(0)
        html = re.sub(r"(<script\b[^>]*>)(.*?)</script>", tracker, html, flags=re.I | re.S)
        html = re.sub(r"<noscript\b[^>]*>(?:(?!</noscript>).)*?(?:" + ANALYTICS + r").*?</noscript>", "", html, flags=re.I | re.S)
        # the site's own code may still report a click: it reports to nothing
        html = re.sub(r"<head\b[^>]*>", lambda m: m.group(0) + "<script>window.dataLayer=[];window.gtag=function(){};</script>", html, count=1, flags=re.I)

        def stylesheet(m):
            tag = m.group(0)
            href = re.search(r"""href=["']([^"']+)["']""", tag)
            if not href:
                return tag
            url = urllib.parse.urljoin(self.page_url, href.group(1))
            if not url.startswith(self.root):
                return tag
            media = re.search(r"""media=["']([^"']+)["']""", tag)
            css = self.css(fetch(url), url)
            return f"<style{f' media={chr(34)}{media.group(1)}{chr(34)}' if media else ''}>{css}</style>"
        html = re.sub(r"""<link\b[^>]*\brel=["']stylesheet["'][^>]*>""", stylesheet, html, flags=re.I)

        def script(m):
            tag, body = m.group(1), m.group(2)
            src = re.search(r"""\bsrc=["']([^"']+)["']""", tag)
            if not src:
                if "ld+json" in tag:
                    return m.group(0)
                return tag + self.js(body, self.page_url) + "</script>"
            url = urllib.parse.urljoin(self.page_url, src.group(1))
            if not url.startswith(self.root):
                return m.group(0)
            for pattern, cdn in CDN.items():
                version = re.search(r"[?&]v=([\d.]+)", url)
                if re.search(pattern, url.split("?", 1)[0]) and version:
                    defer = " defer" if re.search(r"\bdefer\b", tag) else ""
                    return f'<script src="{cdn.format(v=version.group(1))}"{defer}></script>'
            code = self.js(fetch(url), url)
            module = re.search(r"""type=["']module["']""", tag)
            inline = f"<script{' type=' + chr(34) + 'module' + chr(34) if module else ''}>{code}</script>"
            if re.search(r"\bdefer\b", tag) and not module:
                tail.append(inline)   # where a deferred script would have run
                return ""
            return inline
        html = re.sub(r"(<script\b[^>]*>)(.*?)</script>", script, html, flags=re.I | re.S)

        # the site's own images, videos and fonts named in the markup
        html = re.sub(r"<(?:img|source|video|audio|link|div|section|figure|picture|a|span|header|meta|image|use)\b[^>]*>",
                      lambda m: self.attrs(m.group(0)), html, flags=re.I)
        html = re.sub(r"(<style\b[^>]*>)(.*?)(</style>)",
                      lambda m: m.group(1) + self.css(m.group(2), self.page_url) + m.group(3), html, flags=re.I | re.S)
        if tail:
            html = re.sub(r"</body>", lambda _: "".join(tail) + "</body>", html, count=1, flags=re.I)
        return html


# ---------- embed ----------

def main():
    args = sys.argv[1:]
    hide = None
    if "--hide" in args:
        i = args.index("--hide")
        hide = args[i + 1]
        del args[i:i + 2]
    if len(args) != 4:
        sys.exit(__doc__)
    source, page_path, name, asset_dir = args
    asset_dir = asset_dir.rstrip("/") + "/"

    if source.startswith(("http://", "https://")):
        url = source   # a folder URL is fetched as it is: the server picks its index
        bundler = Bundler(url, asset_dir, os.path.dirname(os.path.abspath(page_path)))
        build = bundler.run()
        saved = [p for p in bundler.saved.values() if p]
        print(f"{name}: bundled {url}, {len(saved)} files saved under {asset_dir}")
    else:
        build = open(source, encoding="utf-8").read()
        # point the build's own images at their new home
        build = re.sub(r"""(?<=["'(\s])assets/""", asset_dir, build)

    if hide:
        build = re.sub(r"</head>", lambda _: f"<style>{hide}{{display:none!important}}</style></head>", build, count=1, flags=re.I)

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
