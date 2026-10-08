// PriMoRetarget project page behaviour. No dependencies.
(function () {
  "use strict";

  // ---------------------------------------------------------------- videos
  // Every result clip is preload="none" with a poster, so the page loads fast.
  // A clip starts playing when it scrolls into view and pauses when it leaves,
  // so a dozen looping videos never all decode at once.
  const visible = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && isShown(v)) {
        visible.add(v);
        play(v);
      } else {
        visible.delete(v);
        v.pause();
      }
    }
  }, { threshold: 0.25 });

  function isShown(v) {
    // a video inside an inactive tab is laid out but hidden
    return v.offsetParent !== null;
  }
  function play(v) {
    if (v.preload === "none") v.preload = "auto";
    const p = v.play();
    if (p && p.catch) p.catch(() => {});   // autoplay can be refused; ignore
  }
  document.querySelectorAll("video.lazy-video").forEach((v) => observer.observe(v));

  // ------------------------------------------------------- teaser in sync
  // The four teaser clips are the same box lift, time-aligned to the hardware
  // footage. Looping them independently lets them drift apart over a few
  // cycles, so the first clip leads and the others follow it.
  document.querySelectorAll(".sync-group").forEach((group) => {
    const vids = Array.from(group.querySelectorAll("video"));
    if (vids.length < 2) return;
    const lead = vids[0];
    lead.addEventListener("timeupdate", () => {
      for (const v of vids.slice(1)) {
        if (Math.abs(v.currentTime - lead.currentTime) > 0.15) {
          v.currentTime = lead.currentTime;
        }
      }
    });
    lead.addEventListener("play", () => vids.slice(1).forEach(play));
    lead.addEventListener("pause", () => vids.slice(1).forEach((v) => v.pause()));
  });

  // ------------------------------------------------------------------ tabs
  document.querySelectorAll(".tab-group").forEach((group) => {
    const tabs = group.querySelectorAll(".tabs li");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        group.querySelectorAll(".tab-pane").forEach((pane) => {
          const on = pane.id === tab.dataset.tab;
          pane.classList.toggle("is-active", on);
          pane.querySelectorAll("video").forEach((v) => {
            if (on) { v.currentTime = 0; play(v); } else { v.pause(); }
          });
        });
      });
    });
  });

  // ------------------------------------------------------------------ math
  // KaTeX typesets only these elements; if the CDN is unreachable the raw TeX
  // stays visible rather than the page breaking.
  if (window.katex) {
    document.querySelectorAll(".math, .math-display").forEach((el) => {
      katex.render(el.textContent, el, {
        displayMode: el.classList.contains("math-display"),
        throwOnError: false,
      });
    });
  }

  // ---------------------------------------------------------------- BibTeX
  const copyBtn = document.querySelector(".copy-bibtex");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = document.getElementById("bibtex").innerText;
      navigator.clipboard.writeText(text).then(() => {
        const label = copyBtn.querySelector("span:last-child");
        label.textContent = "Copied";
        setTimeout(() => { label.textContent = "Copy"; }, 1500);
      });
    });
  }
})();
