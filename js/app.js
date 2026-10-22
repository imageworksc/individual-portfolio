/* ImageWorks Creative — Individual portfolio page
   Four small behaviours shared by every option. Nothing here writes a style;
   it only marks state, and css/styles.css decides what the marks mean. The
   one exception is a measurement: the headline's size when two lines will
   not fit, which depends on the rendered text and so cannot be known ahead
   of time (see TITLE).

     TITLE      the headline is held to two lines, whatever its length
     REVEAL     sections come up as they enter the viewport
     LIGHTBOX   a gallery figure opens full size in a <dialog>
     SCROLLSPY  the sticky sidebar (option 2) tracks the section in view
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

  /* ===== BOOT ===== */
  const boot = () => {
    watchTitles();
    reveal();
    lightbox();
    scrollspy();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
