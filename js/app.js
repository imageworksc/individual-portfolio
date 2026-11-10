/* ImageWorks Creative — Individual portfolio page
   Six small behaviours shared by every option. Nothing here writes a style;
   it only marks state, and css/styles.css decides what the marks mean. The
   exceptions are measurements, which depend on what has rendered and so
   cannot be known ahead of time: the headline's size when two lines will
   not fit (see TITLE), and a live frame's size and scale (see LIVE) — which
   also quiets the build inside a section frame with a style of its own.

     TITLE      the headline is held to two lines, whatever its length
     REVEAL     sections come up as they enter the viewport
     LIGHTBOX   a gallery figure opens full size in a <dialog>
     SCROLLSPY  the sticky sidebar (option 2) tracks the section in view
     LIVE       a project's build in a frame: the whole page drifting, or one
                section held still
     CAROUSEL   a row of slides, stepped by arrows, with a counter
     BOOT

   Each part looks for what it needs and stands down if the page has none of
   it, so the same file serves every option. Modern syntax throughout — const
   and let, arrow functions, template literals, optional chaining — which
   every browser that draws the rest of the page already runs. Wrapped in an
   IIFE rather than a module only so the pages open over file://. */
(() => {
  "use strict";

  /* ===== TITLE =====
     The stylesheet gives the headline a measure that breaks a long name into
     two lines. Where two will not fit, two things give, in this order: first
     the measure — the name may run to the content width, never the screen —
     and only then the size, a pixel at a time, down to half. The line count
     is the layout height over the line height; both are read in layout
     pixels, which is what keeps the count right under the large-screen zoom
     (a client rect would come back scaled and the line height would not).
     Runs again when the web font lands and when the window is resized. */
  const fitTitle = (el) => {
    const max = Number(el.dataset.lines) || 2;
    el.style.fontSize = "";
    el.style.maxWidth = "";
    const base = parseFloat(getComputedStyle(el).fontSize);
    const floor = base * 0.5;
    const lines = () => Math.round(el.offsetHeight / parseFloat(getComputedStyle(el).lineHeight));

    if (lines() <= max) return;
    el.style.maxWidth = "var(--wrap)";
    let size = base;
    while (lines() > max && size > floor) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
  };

  const watchTitles = () => {
    const titles = [...document.querySelectorAll("[data-lines]")];
    if (!titles.length) return;
    const fitAll = () => titles.forEach(fitTitle);
    fitAll();
    document.fonts?.ready.then(fitAll);
    let timer = null;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(fitAll, 120);
    }, { passive: true });
  };

  /* ===== REVEAL =====
     Anything marked .rv is hidden by the stylesheet until it is marked .in,
     which happens once, the first time it comes into view. Without an
     observer everything is simply shown. */
  const reveal = () => {
    const els = [...document.querySelectorAll(".rv")];
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      for (const el of els) el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("in");
        io.unobserve(target);
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    for (const el of els) io.observe(el);
  };

  /* ===== LIGHTBOX =====
     One <dialog>, built once for the page and filled on each open from the
     figure that was clicked: its image, its alt text, its caption. The page
     is marked is-locked while it is open so the document behind does not
     scroll. Escape closes it natively; so does the backdrop and the button. */
  const lightbox = () => {
    const triggers = [...document.querySelectorAll("[data-zoom]")];
    if (!triggers.length) return;

    const dlg = document.createElement("dialog");
    dlg.className = "ip-lightbox";
    dlg.setAttribute("aria-label", "Enlarged screenshot");
    dlg.innerHTML = `
      <div class="ip-lightbox__body">
        <div class="ip-lightbox__scroll"><img alt=""></div>
        <div class="ip-lightbox__cap"></div>
        <button type="button" class="ip-lightbox__close" aria-label="Close">
          <svg class="ic" aria-hidden="true"><use href="#i-close"/></svg>
        </button>
      </div>`;
    document.body.appendChild(dlg);

    const img = dlg.querySelector("img");
    const cap = dlg.querySelector(".ip-lightbox__cap");
    const scroll = dlg.querySelector(".ip-lightbox__scroll");
    const lock = (on) => document.documentElement.classList.toggle("is-locked", on);

    const open = (src, alt, caption) => {
      img.src = src;
      img.alt = alt ?? "";
      cap.textContent = caption;
      scroll.scrollTop = 0;
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      lock(true);
    };
    const close = () => {
      if (dlg.open) dlg.close(); else dlg.removeAttribute("open");
      lock(false);
    };
    // the caption's index and its text are separate nodes; join them with a dash
    const captionOf = (trigger) => {
      const fc = trigger.closest("figure")?.querySelector("figcaption");
      if (!fc) return "";
      return [...fc.childNodes]
        .map((n) => n.textContent.trim())
        .filter(Boolean)
        .join(" — ");
    };

    for (const trigger of triggers) {
      trigger.addEventListener("click", () => {
        const inner = trigger.querySelector("img");
        open(trigger.dataset.zoom || inner?.src, inner?.alt, captionOf(trigger));
      });
    }
    dlg.querySelector(".ip-lightbox__close").addEventListener("click", close);
    // a click on the backdrop lands on the dialog itself, not on its content
    dlg.addEventListener("click", ({ target }) => {
      if (target === dlg || target.classList.contains("ip-lightbox__body")) close();
    });
    // Escape closes the dialog natively; the lock still has to be lifted
    dlg.addEventListener("close", () => lock(false));
  };

  /* ===== SCROLLSPY =====
     The last section whose top has passed the upper third of the viewport
     is the one being read; above the first, the first; at the very bottom,
     the last, however short it is. One measurement per frame. */
  const scrollspy = () => {
    const nav = document.querySelector("[data-spy]");
    if (!nav) return;
    const links = [...nav.querySelectorAll("a[href^='#']")];
    const targets = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    if (!targets.length) return;

    let current = null;
    const mark = (id) => {
      if (id === current) return;
      current = id;
      for (const a of links) {
        const on = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("is-on", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      }
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.35;
      let active = targets[0];
      for (const t of targets) {
        if (t.getBoundingClientRect().top <= line) active = t;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) active = targets.at(-1);
      mark(active.id);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  };

  /* ===== LIVE =====
     A project's build in a frame, laid out at the width it was designed
     for — a desktop's, a tablet's, or a phone's as the frame narrows — and
     scaled to fit. Two kinds:

     The stage (data-autoscroll) shows the whole page. It drifts down by
     itself while on screen and asleep, so the build's scroll animations
     play; at the foot it rests, then starts again from the top. A click
     hands it the pointer, leaving the frame takes it back.

     A section frame (data-anchor) shows one section of the build and
     nothing else: the build's own scrolling and the elements named in
     data-hide (its sticky header) are switched off inside the frame, the
     frame is cut to the section's height and scrolled to it, and the
     pointer is the visitor's from the start — the section's hovers just
     work, and a wheel over it scrolls this page.

     Both need the page inside to be readable, which it is only when the
     two are served from the same origin (the published site). Opened from
     disk the stage sits at the top, and a section frame falls back to a
     fixed height and a #hash — safe there, since a hash in a frame of the
     same origin would scroll this page too. */
  const live = () => {
    const frames = [...document.querySelectorAll(".ip-live")];
    if (!frames.length) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const readable = (iframe) => {
      try { return iframe.contentWindow.document.documentElement ? iframe.contentWindow : null; } catch { return null; }
    };

    // the section a frame shows, with its top and height inside the build
    const sectionOf = (iframe) => {
      const win = readable(iframe);
      const el = win?.document.getElementById(iframe.dataset.anchor);
      if (!el) return null;
      const sec = el.closest("section") ?? el;
      return { win, top: sec.getBoundingClientRect().top + win.scrollY, height: sec.offsetHeight };
    };

    const fit = (frame) => {
      const view = frame.querySelector(".ip-live__view");
      const iframe = view.querySelector("iframe");
      const w = view.clientWidth;
      if (!w) return;
      // the build at a phone's width, a tablet's, or a desktop's — whichever
      // keeps its type closest to life size in a frame this wide
      const phone = w < 560;
      const tablet = !phone && w < 900;
      const pageW = phone ? 390 : tablet ? 768 : 1440;
      const scale = w / pageW;
      iframe.style.width = `${pageW}px`;
      iframe.style.transform = `scale(${scale})`;
      let pageH = phone ? 760 : tablet ? 1000 : 900;
      if (iframe.dataset.anchor) {
        const sec = sectionOf(iframe);
        if (sec) {
          pageH = sec.height;
          sec.win.scrollTo({ top: sec.top, behavior: "instant" });
        } else {
          pageH = phone ? 760 : tablet ? 900 : 720;
        }
      }
      iframe.style.height = `${pageH}px`;
      const h = `${Math.round(pageH * scale)}px`;
      if (view.style.height !== h) {
        view.style.height = h;
        // a carousel holding this frame takes its new height (see CAROUSEL)
        frame.dispatchEvent(new CustomEvent("ip:resize", { bubbles: true }));
      }
    };

    // switch the build's scrolling and sticky chrome off inside a section frame
    const quiet = (iframe) => {
      const win = readable(iframe);
      if (!win) {
        if (!iframe.src.includes("#")) iframe.src = `${iframe.src}#${iframe.dataset.anchor}`;
        return;
      }
      const doc = win.document;
      if (doc.getElementById("ip-live-quiet")) return;
      const style = doc.createElement("style");
      style.id = "ip-live-quiet";
      style.textContent = `html, body { overflow: hidden !important; scroll-behavior: auto !important; }${
        iframe.dataset.hide ? ` ${iframe.dataset.hide} { display: none !important; }` : ""}`;
      doc.head.appendChild(style);
    };

    for (const frame of frames) {
      const iframe = frame.querySelector("iframe");
      if (iframe.dataset.anchor) {
        // the build settles after it loads — fonts, images, reveals — and
        // the section grows when a visitor opens a tab or a question, so
        // the frame follows the section's height from then on
        const settle = () => {
          quiet(iframe);
          fit(frame);
          const win = readable(iframe);
          const sec = win?.document.getElementById(iframe.dataset.anchor)?.closest("section");
          if (sec && "ResizeObserver" in win) new win.ResizeObserver(() => fit(frame)).observe(sec);
          setTimeout(() => fit(frame), 600);
          setTimeout(() => fit(frame), 1800);
          // and after anything the visitor opens, once its transition is done
          const after = () => { setTimeout(() => fit(frame), 60); setTimeout(() => fit(frame), 450); };
          win?.document.addEventListener("click", after, true);
          win?.document.addEventListener("toggle", after, true);
        };
        iframe.addEventListener("load", settle);
        if (readable(iframe)?.document.readyState === "complete" && iframe.contentWindow.location.href !== "about:blank") settle();
      } else {
        frame.querySelector(".ip-live__on")?.addEventListener("click", () => {
          frame.classList.add("is-live");
          iframe.tabIndex = 0;
          iframe.focus();
        });
        frame.addEventListener("mouseleave", () => {
          frame.classList.remove("is-live");
          iframe.tabIndex = -1;
        });
      }
      fit(frame);
    }
    let timer = null;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => frames.forEach(fit), 120);
    }, { passive: true });

    if (still || !("IntersectionObserver" in window)) return;
    for (const frame of frames.filter((f) => f.hasAttribute("data-autoscroll"))) {
      const iframe = frame.querySelector("iframe");
      let onScreen = false;
      let restUntil = 0;
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }, { threshold: 0.2 }).observe(frame);
      const tick = (now) => {
        requestAnimationFrame(tick);
        if (!onScreen || frame.classList.contains("is-live") || now < restUntil) return;
        const win = readable(iframe);
        if (!win) return;
        const end = win.document.documentElement.scrollHeight - win.innerHeight;
        if (end <= 0) return;
        if (win.scrollY >= end - 1) {
          restUntil = now + 2500;
          setTimeout(() => win.scrollTo({ top: 0, behavior: "instant" }), 1800);
          return;
        }
        // instant: the build may ask for smooth scrolling, which would
        // restart a glide on every frame and barely move
        win.scrollBy({ top: 1.6, behavior: "instant" });
      };
      requestAnimationFrame(tick);
    }
  };

  /* ===== CAROUSEL =====
     A row of slides that scrolls sideways and snaps one slide at a time —
     by touch, trackpad, or the arrow keys once it has focus. The buttons
     step it by one slide and grey out at either end, the counter says
     which slide is in view, and the row takes that slide's height, so a
     short slide leaves no gap under it. Read from the scroll position,
     once a frame; slides that change size (a live frame settling) are
     watched for it. */
  const carousels = () => {
    for (const root of document.querySelectorAll("[data-carousel]")) {
      const track = root.querySelector(".ip-carousel__track");
      const prev = root.querySelector("[data-carousel-prev]");
      const next = root.querySelector("[data-carousel-next]");
      const count = root.querySelector("[data-carousel-count]");
      if (!track || !prev || !next) continue;
      const slides = [...track.children];

      const step = () => (slides[0]?.offsetWidth ?? track.clientWidth) + parseFloat(getComputedStyle(track).columnGap || "0");
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
        const index = Math.min(slides.length - 1, Math.round(track.scrollLeft / step()));
        if (count) count.textContent = `${index + 1} / ${slides.length}`;
        track.style.height = `${slides[index].offsetHeight}px`;
      };

      prev.addEventListener("click", () => track.scrollBy({ left: -step() }));
      next.addEventListener("click", () => track.scrollBy({ left: step() }));
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; update(); });
      };
      track.addEventListener("scroll", onScroll, { passive: true });
      // and once more where the scroll comes to rest, where the browser says so
      track.addEventListener("scrollend", update);
      root.addEventListener("ip:resize", onScroll);
      window.addEventListener("resize", onScroll, { passive: true });
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(onScroll);
        for (const slide of slides) ro.observe(slide);
      }
      update();
    }
  };

  /* ===== BOOT ===== */
  const boot = () => {
    watchTitles();
    reveal();
    lightbox();
    scrollspy();
    live();
    carousels();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
