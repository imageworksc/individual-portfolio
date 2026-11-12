# Individual portfolio page — ImageWorks Creative

Interactive project pages for the
[ImageWorks Creative portfolio](https://imageworksc.github.io/portfolio-iwc/),
set in the portfolio's own type, colour and motion. Each page carries the
project's own build: on white, the whole homepage drifting down by itself so
its scroll animations play; on the blue band, a carousel of single sections,
each held still and live to the pointer for its hovers.

Live: **https://imageworksc.github.io/individual-portfolio/**

| Page | Project |
|---|---|
| [`index.html`](index.html) | The list of pages |
| [`option-9.html`](option-9.html) | Crown Point Construction |
| [`atlantic-sun-control.html`](atlantic-sun-control.html) | Atlantic Sun Control |
| [`silk-vision.html`](silk-vision.html) | Silk Vision (Ziplyft and entropion subpages) |
| [`casey-margenau.html`](casey-margenau.html) | Casey Margenau Fine Homes & Estates |
| [`mason-dixon.html`](mason-dixon.html) | Mason Dixon Animal Emergency Hospital |
| [`highbrow-magazine.html`](highbrow-magazine.html) | Highbrow Magazine |
| [`barr-group.html`](barr-group.html) | Barr Group |
| [`wssa.html`](wssa.html) | Wine & Spirits Shippers Association |
| [`st-michaels.html`](st-michaels.html) | St. Michael's |

Every page opens with the portfolio's page wash, ends on its closing band,
links back to the grid, and leads on to the next project, in the order above.

## Files

```
index.html            the list of pages
*.html                one page per project (the table above)
css/styles.css        shared: tokens, base, button, wash, chips, card, frames,
                      live frames, carousel, CTA, motion, responsive
css/option-9.css      the project pages' layout: the stage and the blue band
css/index.css         the list's cards
js/app.js             reveal on scroll, the live frames, the carousel
assets/<project>/site/  the images, fonts and video each embedded build uses
assets/silkvision/    the same, for Silk Vision's two subpages
assets/options/       thumbnails of the pages, for the list
tools/embed_build.py  bundles a project's build and embeds it in a page (below)
DESIGN.md             the design contract — every token, primitive and motion value
```

No build step. Open any HTML file directly, or serve the folder.

## How the code is organised

- **HTML** carries structure only: no `style=` attributes, no inline
  scripts. Every icon is a `<symbol>` in a small sprite at the top of the body
  and is placed with `<svg class="ic"><use href="#i-…">`; its size and stroke
  come from `.ic` in the stylesheet. Each block opens with a `<!-- ===== -->`
  comment naming it.
- **CSS** is one shared sheet plus one small sheet per page. Each file opens
  with a table of contents and is divided into `/* ===== SECTION ===== */`
  blocks in page order. Colours that belong to a client project (the swatch
  strips) live in that option's sheet, not in the shared tokens.
- **JavaScript** is one file in modern syntax — `const`/`let`, arrow
  functions, template literals, optional chaining — an IIFE with six parts (title, reveal,
  lightbox, scrollspy, live frames, carousel). It marks state with classes and attributes and lets
  the stylesheet decide what they mean; the one value it writes directly is a
  measurement, the headline size when two lines will not fit.

## Design

`DESIGN.md` is the contract. Tokens, type scale, primitives, motion and
breakpoints were taken from the live portfolio (`portfolio-iwc/css/styles.css`)
and confirmed in a browser; nothing in the pages uses a value that is not on
that sheet. The project-specific type specimens (Inter for Casey Margenau, Jost
for Atlantic Sun Control) were loaded only for the "palette & type" block.

## Publishing

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`
(the same workflow the `asc-sun-control` repo uses). Push to `main` and the site
rebuilds.

## Making a page for another project

Copy one of the project pages, then replace `<title>`, `<meta
name="description">`, the `<h1>`, the project label, the browser-bar
addresses, the carousel slides and the next-project link, and embed the new
build (below).

## Embedding a project's build

The interactive frames run the project's real homepage, so its hovers and
scroll animations can be seen and tried. The build is not loaded from the
client's domain — a portfolio page usually may not read, or even frame, a
page on another domain — but carried inside the portfolio page itself,
minified, and handed to each frame as `srcdoc`. That makes the frames part
of the page's own origin wherever it is served, and it never touches the
client's site or its analytics.

To do it for another project:

1. Copy the build's images into `assets/<project>/site/`, keeping the
   folders they had under the build's own `assets/`.
2. Put the markers `<!-- BUILD:<name> -->` and `<!-- /BUILD:<name> -->`
   before the `app.js` script in the page.
3. Run
   `python3 tools/embed_build.py <URL or path/to/index.html> <page>.html <name> assets/<project>/site/`
   — it minifies the build, points its images at the new folder and writes
   it between the markers. Run it again whenever the build changes.
4. Give each frame's `<iframe>` `data-build="<name>"`; a section frame also
   takes `data-anchor` (an id inside the section to show, or a CSS selector
   for it) and `data-hide`
   (a selector for anything to switch off, such as a sticky header). For a
   build not cut into `<section>`s, `data-section` names what to frame
   instead (e.g. `.paragraph` for a Drupal paragraph).

Given the build's published URL instead of a file, the script bundles it
first: the site's own stylesheets and scripts are written inline, and every
image, font and video it uses is downloaded into `assets/<project>/site/`
and the references pointed there (Font Awesome, too big to carry, is
pointed at the same version on cdnjs). `--hide "<selectors>"` hides parts
of the live site in every frame of the build, such as a cookie banner.
Analytics and tracking scripts are left out, so portfolio visits never
count in the client's reports.
A page given a local file has to be one
page with its CSS and JS inline and its images under a relative `assets/`
path. Inside the
frame its `#` links scroll the frame, links to other sites open in a new
tab, and its other links and its form do nothing.
