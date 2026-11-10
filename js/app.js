/* ImageWorks Creative — Individual portfolio page
   Five small behaviours shared by every option. Nothing here writes a style;
   it only marks state, and css/styles.css decides what the marks mean. The
   one exception is a measurement: the headline's size when two lines will
   not fit, which depends on the rendered text and so cannot be known ahead
   of time (see TITLE).

     TITLE      the headline is held to two lines, whatever its length
     REVEAL     sections come up as they enter the viewport
     LIGHTBOX   a gallery figure opens full size in a <dialog>
     SCROLLSPY  the sticky sidebar (option 2) tracks the section in view
     LIVE       a project's build in a frame: fitted, anchored, woken by a
                click, drifting
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
     A project's build in a frame. The page inside is laid out at the width
     it was designed for — a desktop's, or a phone's when the frame is
     narrow — and scaled to fit; the frame's height follows. A click hands
     the iframe the pointer, leaving the frame takes it back.

     A frame marked data-autoscroll drifts down the page inside by itself
     while it is on screen and asleep, so the build's scroll animations
     play without anyone touching it; at the foot it rests, then starts
     again from the top. That needs the page inside to be readable, which
     it is only when both are served from the same origin (the published
     site); opened from disk, the frame simply sits at the top. */
  const live = () => {
    const frames = [...document.querySelectorAll(".ip-live")];
    if (!frames.length) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fit = (frame) => {
      const view = frame.querySelector(".ip-live__view");
      const iframe = view.querySelector("iframe");
      const w = view.clientWidth;
      const phone = w < 560;
      const pageW = phone ? 390 : 1440;
      const pageH = phone ? 760 : (frame.matches(".ip-live--stage") ? 900 : 760);
      const scale = w / pageW;
      iframe.style.width = `${pageW}px`;
      iframe.style.height = `${pageH}px`;
      iframe.style.transform = `scale(${scale})`;
      view.style.height = `${Math.round(pageH * scale)}px`;
    };

    // A frame opens on the section its data-anchor names. Not with a #hash
    // in the src: when the build shares this page's origin, following a
    // hash inside the frame scrolls this page too. Scrolled from here, only
    // the frame moves — clear of the build's sticky header. Where the page
    // inside cannot be read (opened from disk) the hash is safe, so it is
    // used instead.
    const toAnchor = (iframe) => {
      const id = iframe.dataset.anchor;
      if (!id) return;
      try {
        const win = iframe.contentWindow;
        const el = win.document.getElementById(id);
        if (el) win.scrollTo({ top: el.getBoundingClientRect().top + win.scrollY - 96, behavior: "instant" });
      } catch {
        if (!iframe.src.includes("#")) iframe.src = `${iframe.src}#${id}`;
      }
    };

    for (const frame of frames) {
      const iframe = frame.querySelector("iframe");
      // the build settles after it loads — fonts, images, its own scroll
      // restoration — so the jump is made again once it has
      const anchor = () => { toAnchor(iframe); setTimeout(() => toAnchor(iframe), 600); setTimeout(() => toAnchor(iframe), 1800); };
      iframe.addEventListener("load", anchor);
      try { if (iframe.contentDocument?.readyState === "complete" && iframe.contentWindow.location.href !== "about:blank") anchor(); } catch { /* not readable yet */ }
      frame.querySelector(".ip-live__on")?.addEventListener("click", () => {
        frame.classList.add("is-live");
        iframe.tabIndex = 0;
        iframe.focus();
      });
      frame.addEventListener("mouseleave", () => {
        frame.classList.remove("is-live");
        iframe.tabIndex = -1;
      });
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
        let win;
        try { win = iframe.contentWindow; win.document; } catch { return; }
        if (!win) return;
        const doc = win.document.documentElement;
        const end = doc.scrollHeight - win.innerHeight;
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

  /* ===== BOOT ===== */
  const boot = () => {
    watchTitles();
    reveal();
    lightbox();
    scrollspy();
    live();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
