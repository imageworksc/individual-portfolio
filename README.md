# Individual portfolio page — ImageWorks Creative

Eight layout options for the project page that sits behind every card in the
[ImageWorks Creative portfolio](https://imageworksc.github.io/portfolio-iwc/),
set in the portfolio's own type, colour and motion.

Live: **https://imageworksc.github.io/individual-portfolio/**

| Page | Option | Project shown |
|---|---|---|
| [`index.html`](index.html) | The chooser — all eight side by side | — |
| [`option-1.html`](option-1.html) | **Visual** — images only, text kept to a minimum: headline and chips, hero in a frame, six sections whole, three phones, the photography, "More work" cards | Casey Margenau Fine Homes & Estates |
| [`option-2.html`](option-2.html) | **Editorial split** — breadcrumb, split hero, long-scroll frame, sticky section nav with scroll tracking | Atlantic Sun Control |
| [`option-3.html`](option-3.html) | **Showcase** — device stage, brief, facts in a row, five numbered feature rows, photography band | Casey Margenau Fine Homes & Estates |
| [`option-4.html`](option-4.html) | **Simple** — category chips, the headline, and one full-page screenshot in a browser frame; no copy | Casey Margenau Fine Homes & Estates |
| [`option-6.html`](option-6.html) | **Print** — a wide stage photograph of the brochure, a blue band with one large row per piece, the client palette, next-project band | Center for Vascular Medicine |
| [`option-7.html`](option-7.html) | **Brand** — titles only: the logo on white and navy, four logo versions, business cards and envelopes on a blue band, palette and Montserrat specimen in one block, the portfolio's branding cards in tilted, drifting columns as on the ImageWorks home page | Spring Cove |
| [`option-8.html`](option-8.html) | **Simple** — option 4's layout (and its sheet): chips, headline, project label, one full-page screenshot | Crown Point Construction |
| [`option-9.html`](option-9.html) | **Interactive** — the project's own build, embedded in the page and running in frames: on white, the whole homepage drifting down by itself so its scroll animations play; on the blue band, a carousel of single sections (services, approach, work, FAQ), each held still and live to the pointer for its hovers | Crown Point Construction |
| [`atlantic-sun-control.html`](atlantic-sun-control.html) | **Interactive** — option 9's page | Atlantic Sun Control |
| [`silk-vision.html`](silk-vision.html) | **Interactive** — option 9's page | Silk Vision |
| [`casey-margenau.html`](casey-margenau.html) | **Interactive** — option 9's page | Casey Margenau |
| [`mason-dixon.html`](mason-dixon.html) | **Interactive** — option 9's page | Mason Dixon |
| [`highbrow-magazine.html`](highbrow-magazine.html) | **Interactive** — option 9's page | Highbrow Magazine |
| [`barr-group.html`](barr-group.html) | **Interactive** — option 9's page | Barr Group |
| [`wssa.html`](wssa.html) | **Interactive** — option 9's page | Wine & Spirits Shippers Association |
| [`st-michaels.html`](st-michaels.html) | **Interactive** — option 9's page | St. Michael's |

Every option opens with the portfolio's page wash, ends on its closing band,
links back to the grid, and leads on to the next project.

## Files

```
index.html            the chooser
option-1.html         Option 1 — visual, images only
option-2.html         Option 2 — editorial split
option-3.html         Option 3 — showcase
option-4.html         Option 4 — simple: chips, headline, one full-page screenshot
option-6.html         Option 6 — print
option-7.html         Option 7 — brand
option-8.html         Option 8 — option 4's layout, for Crown Point Construction
option-9.html         Option 9 — interactive: the live build in frames
atlantic-sun-control.html, silk-vision.html, casey-margenau.html, mason-dixon.html,
highbrow-magazine.html, barr-group.html, wssa.html, st-michaels.html
                      option 9's page for each of those projects
css/styles.css        shared: tokens, base, button, wash, chips, card, frames,
                      meta, stats, prose, gallery + lightbox, swatches,
                      next-project band, CTA, motion, responsive
css/option-N.css      what each option lays out differently
css/index.css         the chooser's cards
js/app.js             reveal on scroll, the lightbox, the sticky nav's scrollspy,
                      the live frames, the carousel
assets/casey/         Casey Margenau: hero, section and mobile captures, photography
assets/asc/           Atlantic Sun Control: hero, section and mobile captures
                      (both folders hold a few spare captures the pages do not
                      use yet — swap them in when adjusting an option)
assets/cvm/           Center for Vascular Medicine: brochure and
                      business-card mockups
assets/crownpoint/    Crown Point Construction: the full homepage capture, 1x and 2x;
                      site/ holds the images its embedded build uses
tools/embed_build.py  minifies a project's build and embeds it in a page (below)
assets/springcove/    Spring Cove: logo versions, business-card and envelope
                      mockups, the card strip
assets/works/         portfolio images for the "More work" row and the branding
                      columns (the same files the portfolio grid shows)
assets/options/       thumbnails of the eight options, for the chooser
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
for Atlantic Sun Control) are loaded only for the "palette & type" block.

## Publishing

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`
(the same workflow the `asc-sun-control` repo uses). Push to `main` and the site
rebuilds.

## Making a page for another project

Copy the option you chose, then replace:

1. `<title>`, `<meta name="description">`, the chips, `<h1>` and the lead.
2. The `assets/<project>/` images and their `alt` text.
3. The `.ip-meta` facts, the stats, and the case-study copy.
4. The palette swatches and the type specimen.
5. The "Next project" band (or the "More work" cards in Option 1).

## Embedding a project's build (option 9)

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
   `python3 tools/embed_build.py path/to/build/index.html option-N.html <name> assets/<project>/site/`
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
