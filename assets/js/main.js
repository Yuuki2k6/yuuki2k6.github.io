/* Nguyen Duy portfolio — entrance + scroll reveal (no dependencies) */
(function () {
  document.body.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Reduced motion: stop the marquee video loops too (CSS can't pause video) */
  if (reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("video"), function (v) {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }

  /* Letter-by-letter reveal for the hero subline (progressive enhancement) */
  var sub = document.querySelector("[data-letters]");
  if (sub && !reduced) {
    var text = sub.textContent;
    sub.setAttribute("aria-label", text);
    sub.textContent = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.textContent = text[i];
      s.setAttribute("aria-hidden", "true");
      s.style.opacity = "0";
      s.style.transition = "opacity .5s ease " + (0.35 + i * 0.018) + "s";
      frag.appendChild(s);
    }
    sub.appendChild(frag);
  }

  /* Hero entrance */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add("loaded");
      if (sub && !reduced) {
        Array.prototype.forEach.call(sub.children, function (s) {
          s.style.opacity = "1";
        });
      }
    });
  });

  var touch = window.matchMedia("(hover: none)").matches;

  /* Placeholder overlay buttons shouldn't jump the page to the top */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (a && a.getAttribute("href") === "#") e.preventDefault();
  });

  var marquee = document.querySelector(".marquee");

  /* Pointer devices — edge-reveal: hovering a thumbnail clipped by the
     viewport edge slides the track just enough to show it fully. The shift
     lives on the `translate` property, which composes with the animation's
     `transform`. */
  if (marquee && !touch) {
    var track = marquee.querySelector(".marquee-track");
    var edgeOffset = 0;
    var EDGE_PAD = 12;
    marquee.addEventListener("pointerover", function (e) {
      var item = e.target.closest(".m-item");
      if (!item) return;
      var mr = marquee.getBoundingClientRect();
      var ir = item.getBoundingClientRect();
      var delta = 0;
      if (ir.left < mr.left) {
        delta = mr.left + EDGE_PAD - ir.left;
      } else if (ir.right > mr.right) {
        delta = mr.right - EDGE_PAD - ir.right;
      }
      if (delta) {
        edgeOffset += delta;
        track.style.translate = edgeOffset + "px 0";
      }
    });
    marquee.addEventListener("pointerleave", function () {
      edgeOffset = 0;
      track.style.translate = "0px 0";
    });
  }

  /* Touch devices — the reel becomes a native horizontal scroller that
     drifts on its own, pauses while the user interacts, and wraps
     seamlessly (the aria-hidden duplicate group provides the runway). */
  if (marquee && touch) {
    var group = marquee.querySelector(".marquee-group");
    var groupW = 0;
    var pausedUntil = 0;
    var overlayOpen = false;
    var lastAutoWrite = 0;
    var SPEED = 110; /* px per second, matches the desktop pace */

    var measure = function () {
      groupW = group.getBoundingClientRect().width;
    };
    measure();
    window.addEventListener("resize", measure);

    var wrap = function () {
      if (!groupW) return;
      if (marquee.scrollLeft >= groupW) {
        marquee.scrollLeft -= groupW;
      } else if (marquee.scrollLeft < 2 && pausedUntil > performance.now()) {
        marquee.scrollLeft += groupW;
      }
    };

    marquee.addEventListener("touchstart", function () {
      pausedUntil = Infinity;
    }, { passive: true });
    marquee.addEventListener("touchend", function () {
      pausedUntil = performance.now() + 2500;
    }, { passive: true });
    marquee.addEventListener("scroll", function () {
      var now = performance.now();
      if (now - lastAutoWrite > 60 && pausedUntil !== Infinity) {
        pausedUntil = Math.max(pausedUntil, now + 2000);
      }
      wrap();
    }, { passive: true });

    var prev = null;
    var step = function (ts) {
      if (prev !== null && !reduced && !overlayOpen && performance.now() > pausedUntil) {
        lastAutoWrite = performance.now();
        marquee.scrollLeft += (SPEED * (ts - prev)) / 1000;
        wrap();
      }
      prev = ts;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    /* Tap a thumbnail to reveal its card; tap elsewhere to dismiss.
       Swipes don't produce click events, so scrolling never toggles. */
    document.addEventListener("click", function (e) {
      var inMarquee = e.target.closest(".marquee");
      var item = e.target.closest(".m-item");
      if (e.target.closest(".m-overlay a")) return;
      var open = marquee.querySelectorAll(".m-item.show");
      Array.prototype.forEach.call(open, function (i) {
        if (i !== item) i.classList.remove("show");
      });
      if (inMarquee && item) {
        item.classList.toggle("show");
        if (item.classList.contains("show")) {
          item.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      }
      overlayOpen = !!marquee.querySelector(".m-item.show");
      if (!overlayOpen) pausedUntil = performance.now() + 1500;
    });
  }

  /* Touch devices — tap a tilted photo to straighten it and show its caption */
  if (touch) {
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".tilt");
      Array.prototype.forEach.call(document.querySelectorAll(".tilt.tap"), function (x) {
        if (x !== t) x.classList.remove("tap");
      });
      if (t) t.classList.toggle("tap");
    });
  }

  /* Scroll reveal */
  var targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduced) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("in");
    });
    return;
  }
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  Array.prototype.forEach.call(targets, function (el) {
    io.observe(el);
  });
})();
