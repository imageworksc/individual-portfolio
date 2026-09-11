# Individual portfolio page — ImageWorks Creative

Four layout options for the project page that sits behind every card in the
[ImageWorks Creative portfolio](https://imageworksc.github.io/portfolio-iwc/),
set in the portfolio's own type, colour and motion.

Live: **https://imageworksc.github.io/individual-portfolio/**

| Page | Option | Project shown |
|---|---|---|
| [`index.html`](index.html) | The chooser — all four side by side | — |
| [`option-1.html`](option-1.html) | **Visual** — images only, text kept to a minimum: headline and chips, hero in a frame, six sections whole, three phones, the photography, "More work" cards | Casey Margenau Fine Homes & Estates |
| [`option-2.html`](option-2.html) | **Editorial split** — breadcrumb, split hero, long-scroll frame, sticky section nav with scroll tracking | Atlantic Sun Control |
| [`option-3.html`](option-3.html) | **Showcase** — device stage, brief, facts in a row, five numbered feature rows, photography band | Casey Margenau Fine Homes & Estates |
| [`option-4.html`](option-4.html) | **Simple** — category chips, the headline, and one full-page screenshot in a browser frame; no copy | Casey Margenau Fine Homes & Estates |

Every option opens with the portfolio's page wash, ends on its closing band,
links back to the grid, and leads on to the next project.

## Files

```
index.html            the chooser
option-1.html         Option 1 — visual, images only
option-2.html         Option 2 — editorial split
option-3.html         Option 3 — showcase
option-4.html         Option 4 — simple: chips, headline, one full-page screenshot
css/styles.css        shared: tokens, base, button, wash, chips, card, frames,
                      meta, stats, prose, gallery + lightbox, swatches,
                      next-project band, CTA, motion, responsive
css/option-N.css      what each option lays out differently
css/index.css         the chooser's cards
js/app.js             reveal on scroll, the lightbox, the sticky nav's scrollspy
assets/casey/         Casey Margenau: hero, section and mobile captures, photography
assets/asc/           Atlantic Sun Control: hero, section and mobile captures
                      (both folders hold a few spare captures the pages do not
                      use yet — swap them in when adjusting an option)
assets/works/         two portfolio images for the "More work" row
assets/options/       thumbnails of the four options, for the chooser
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
- **JavaScript** is one file, an IIFE with four parts (title, reveal,
  lightbox, scrollspy). It marks state with classes and attributes and lets
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
