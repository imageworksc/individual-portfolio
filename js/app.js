/* ImageWorks Creative — Individual portfolio page
   Three small behaviours shared by every option. Nothing here writes a style;
   it only marks state, and css/styles.css decides what the marks mean.

     TITLE      the headline is held to two lines, whatever its length
     REVEAL     sections come up as they enter the viewport
     LIGHTBOX   a gallery figure opens full size in a <dialog>
     SCROLLSPY  the sticky sidebar (option 2) tracks the section in view

   Wrapped in an IIFE rather than a module so index.html opens over file://. */
(function () {
  "use strict";

  /* ---------- title ----------
     The stylesheet gives the headline a measure that breaks a long name into
     two lines. Where two will not fit, two things give, in this order: first
     the measure — the name may run to the content width, never the screen —
     and only then the size, a pixel at a time, down to half. The line count is the layout
     height over the line height; both are read in layout pixels, which is
     what keeps the count right under the large-screen zoom (a client rect
     would come back scaled and the line height would not). Runs again when
     the web font lands and when the window is resized. */
  function fitTitles() {
    const els = Array.from(document.querySelectorAll("[data-lines]"));
    els.forEach(function (el) {
      const max = parseInt(el.getAttribute("data-lines"), 10) || 2;
      el.style.fontSize = "";
      el.style.maxWidth = "";
      const base = parseFloat(getComputedStyle(el).fontSize);
      const floor = base * 0.5;
      function lines() {
        return Math.round(el.offsetHeight / parseFloat(getComputedStyle(el).lineHeight));
      }
      if (lines() <= max) return;
      el.style.maxWidth = "var(--wrap)";
      let size = base;
      while (lines() > max && size > floor) {
        size -= 1;
        el.style.fontSize = size + "px";
      }
    });
  }
  function watchTitles() {
    if (!document.querySelector("[data-lines]")) return;
    fitTitles();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);
    let t = null;
    window.addEventListener("resize", function () {
      clearTimeout(t); t = setTimeout(fitTitles, 120);
    }, { passive: true });
  }

  /* ---------- reveal ---------- */
  function reveal() {
    const els = Array.from(document.querySelectorAll(".rv"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- lightbox ---------- */
  function lightbox() {
    const triggers = Array.from(document.querySelectorAll("[data-zoom]"));
    if (!triggers.length) return;

    const dlg = document.createElement("dialog");
    dlg.className = "ip-lightbox";
    dlg.setAttribute("aria-label", "Enlarged screenshot");
    dlg.innerHTML =
      '<div class="ip-lightbox__body">' +
        '<div class="ip-lightbox__scroll"><img alt=""></div>' +
        '<div class="ip-lightbox__cap"></div>' +
        '<button type="button" class="ip-lightbox__close" aria-label="Close">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(dlg);

    const img = dlg.querySelector("img");
    const cap = dlg.querySelector(".ip-lightbox__cap");
    const scroll = dlg.querySelector(".ip-lightbox__scroll");

    function open(src, alt, caption) {
      img.src = src; img.alt = alt || "";
      cap.textContent = caption || "";
      scroll.scrollTop = 0;
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      document.documentElement.style.overflow = "hidden";
    }
    function close() {
      if (dlg.open) dlg.close(); else dlg.removeAttribute("open");
      document.documentElement.style.overflow = "";
    }

    triggers.forEach(function (t) {
      t.addEventListener("click", function () {
        const src = t.getAttribute("data-zoom") || (t.querySelector("img") || {}).src;
        const alt = (t.querySelector("img") || {}).alt;
        const fig = t.closest("figure");
        const fc = fig && fig.querySelector("figcaption");
        // the caption's index and its text are separate nodes; join them with a dash
        const caption = fc ? Array.from(fc.childNodes).map(function (n) { return n.textContent.trim(); }).filter(Boolean).join(" — ") : "";
        open(src, alt, caption);
      });
    });
    dlg.querySelector(".ip-lightbox__close").addEventListener("click", close);
    // a click on the backdrop lands on the dialog itself, not on its content
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.classList.contains("ip-lightbox__body")) close(); });
    dlg.addEventListener("close", function () { document.documentElement.style.overflow = ""; });
  }

  /* ---------- scrollspy ---------- */
  function scrollspy() {
    const nav = document.querySelector("[data-spy]");
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll("a[href^='#']"));
    const targets = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
    if (!targets.length) return;

    let current = null;
    function mark(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) {
        const on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-on", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }
    // The last section whose top has passed the upper third of the viewport is
    // the one being read; above the first, the first. Read on scroll, one
    // measurement per frame.
    let ticking = false;
    function update() {
      ticking = false;
      const line = window.innerHeight * 0.35;
      let active = targets[0];
      for (let i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top <= line) active = targets[i];
      }
      // at the very bottom the last section is what's on screen, however short
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) active = targets[targets.length - 1];
      mark(active.id);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ---------- boot ---------- */
  function boot() { watchTitles(); reveal(); lightbox(); scrollspy(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
