# DESIGN.md — Individual portfolio page

The visual contract for the three project-page options in this repo. Every value
here was read from the live portfolio at
https://imageworksc.github.io/portfolio-iwc/ (its `css/styles.css` is authored,
unminified CSS with a token block, so the source is the rendered truth) and
confirmed in a real browser at 1440 / 390 px. Nothing in the pages may use a
colour, size or motion value that is not on this sheet.

## 1. Tokens

| Token | Value | Source / use |
|---|---|---|
| `--navy` | `#143C66` | links, segment fill, hover panel ground |
| `--navy-deep` | `#0F2E4F` | the dark end of things |
| `--blue` | `#1266B5` | the page headline, eyebrows |
| `--green` | `#80C34A` | CTA button, link hover, focus ring |
| `--green-dark` | `#5A9E2F` | reserved (contrast fails at small sizes) |
| `--ink` | `#333E46` | body text |
| `--muted` | `#4A5E72` | lead copy, secondary text |
| `--muted-2` | `#7C8CA0` | labels, captions |
| `--card-bg` | `#EDF1F7` | card and tile ground |
| `--line` | `rgba(20,60,102,.10)` | hairlines (from the segmented control's inset ring) |
| `--r` | `2px` | buttons and chips — the branding page squares its controls |
| `--r-card` | `8px` | cards, frames, tiles |
| `--cta-band` | `linear-gradient(135deg, #1266b5, #0a2c4d)` | closing band |
| `--ease` | `cubic-bezier(.16,.84,.44,1)` | the button lift |
| card shadow | `inset 0 0 0 1px rgba(20,60,102,.04), 0 4px 20px rgba(9,40,80,.04)` | resting |
| card shadow, hover | `inset 0 0 0 1px rgba(20,60,102,.05), 0 10px 30px rgba(9,40,80,.07)` | lifted 6px |

## 2. Type

Family: `'Plus Jakarta Sans'`, weights 400 / 500 / 600 / 700 / 800, from Google
Fonts. Body is antialiased, `line-height: 1.65`.

| Step | Size | Weight / leading / tracking | Used for |
|---|---|---|---|
| `--step-3` | `clamp(32px, 4.2vw, 48px)` | 800 / 1.12 / -.8px, `--blue` | page headline |
| `--step-2` | `clamp(26px, 3vw, 38px)` | 800 / 1.15 / -.5px | section heads |
| `--step-1` | `18px` | 400 / 1.75, `--muted` | lead and hero copy, max-width 720px |
| `--step-0` | `clamp(15.5px, .25vw + 15px, 17px)` | 400 / 1.65, `--ink` | body |
| `--step-sm` | `14px` | 600–700 | chips, labels, small UI |
| item head | `20px` | 700 / 1.25 / -.3px | card and feature titles |

Project-specific type samples (Inter for Casey Margenau, Jost for Atlantic Sun
Control) are loaded only for the "palette & type" specimen and never used for
page chrome.

## 3. Spacing and layout

- Content measure `1160px` (`.iw-wrap`), narrow measure `720px` for lead copy.
- Section padding `clamp(56px, 7vw, 96px)` vertical, `16–24px` horizontal.
- Grid gap `28px` (the work grid's gap). Cards are `368 × 274.5` in a 3-up grid,
  2-up under 1100px, 1-up under 720px.
- Side gutter never below 16px at any width.

## 4. Primitives

| Primitive | Anatomy | States |
|---|---|---|
| `.iw-btn` (+ `--primary`, `--ghost`, `--navy`) | inline-flex, height 52px (58px in the CTA band), padding 0 28–36px, radius 2px, 700 weight | hover: `translateY(-3px)`, `brightness(1.04)`, shadow `0 4px 12px rgba(20,40,80,.18)`; active: `translateY(-1px)`; focus-visible: 2px green outline, 2px offset; reduced motion: no transform |
| `.ip-chip` | inline-flex, height 30px, padding 0 12px, radius 2px, frosted white ring, 13px 600 muted | `--on`: navy fill, white text; hover (links only): navy text on `rgba(20,60,102,.07)` |
| `.iw-card` | 8px radius, `--card-bg`, image cover, navy `.82` panel with blur on hover | hover: lift 6px, image greyscale, panel scales .86→1, title and CTA rise with 60/100 ms delays |
| `.ip-browser` | 8px radius frame, 34px chrome bar with three dots and a URL pill, card shadow | none (a container) |
| `.ip-phone` | 390:844 aspect, 34px outer radius, 10px navy-deep bezel, 26px inner radius | none |
| `.ip-scroller` | fixed-height frame over a full-page capture | fine pointer: hover translates the image to its end over 9s linear and back over 1.2s; coarse pointer: native vertical scroll |
| `.ip-meta` | definition list, 12px 700 uppercase `.08em` labels in `--muted-2`, 15.5px 600 values, hairline rows | — |
| `.ip-stat` | tile on `--card-bg`, 8px radius, number `clamp(28px, 3vw, 36px)` 800 blue -.5px, label 14px 600 muted | — |
| `.ip-eyebrow` | 13px 700 uppercase `.12em`, `--blue` | — |
| `.ip-shot` | figure in a card frame, image at natural aspect, caption 14px 600 muted with an index | hover: lift 6px (it opens the lightbox); focus-visible: green ring |
| `.ip-lightbox` | `<dialog>` with a `rgba(15,46,79,.92)` backdrop, image at max 92vw × 88vh | opens on click/Enter, closes on Escape, backdrop click, or the close button |
| `.ip-nextproj` | band on `--card-bg`, 2-col: eyebrow + title + lead + arrow link / browser frame | hover on the whole band lifts the frame 6px |
| `.iw-cta` | ported band: gradient, 1px white dots at .07 every 24px, white h2, pale-blue lead, 58px green button | button as `.iw-btn` |

## 5. Motion

- Page wash: three radial washes (green top-left, blue top-right, sky low) drifting
  on 71 / 97 / 127 s linear loops with a 47 s sheen; masked out by 88% of 1040px.
- Entrance: `iwRise` (`opacity 0→1`, `translateY 20px→0`, .7s `cubic-bezier(.2,.75,.25,1)`),
  headline at .05 s, lead at .16 s. Sections below the fold use the same curve on
  intersection (`.rv` → `.rv.in`).
- Cards: `iwCardIn` 1.05 s, staggered 130 ms by grid position.
- Everything moving is `transform` / `opacity` / `filter` only.
- `prefers-reduced-motion: reduce` removes all transforms and animations and
  keeps only colour and shadow transitions.

## 6. Responsive

- `≤1100px`: 3-up grids become 2-up; the option-2 sidebar drops below the hero and
  stops sticking; alternating feature rows stack.
- `≤720px`: everything single column; chips lose their icons; hero buttons stack
  full-width; stats go 2-up.
- `≤420px`: chip and button padding tighten as the reference's segmented control does.

## 7. Accessibility and accepted debt

- All text on navy/blue grounds is white or `rgba(226,238,252,.82)`, ≥ 6:1.
- Eyebrows are `--blue` (5.5:1) rather than the brand green, which fails at 13px.
- Every interactive element has a `:focus-visible` green ring.
- Screenshots are of real work; alt text describes the section shown.
- Debt: the full-page scroller is hover-driven on desktop (a keyboard user reaches
  the same content through the gallery below it). The lightbox traps focus via the
  native `<dialog>`.
