/* Nguyen Duy portfolio — entrance, scroll reveal, data-driven reel (no dependencies) */
(function () {
  document.body.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(hover: none)").matches;

  /* Reduced motion: stop any autoplaying video loops (CSS can't pause video) */
  if (reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("video"), function (v) {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }

  /* Placeholder links shouldn't jump the page to the top */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (a && a.getAttribute("href") === "#") e.preventDefault();
  });

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
        Array.prototype.forEach.call(sub.children, function (el) {
          el.style.opacity = "1";
        });
      }
    });
  });

  /* ========================================================================
     Short-form reel — rendered from assets/data/shortform.json
     ======================================================================== */

  var marquee = document.querySelector(".marquee");
  var ARROW =
    '<svg viewBox="0 0 25 25" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(5.5 5.596) rotate(-45 7 7)"><path d="M 0 7 L 12.725 6.932"/><path d="M 7 0 L 14 7 L 7 14"/></g></svg>';
  var remeasure = null; /* set by initTouchReel; called when thumbnails swap */

  function tidyTitle(t, limit) {
    if (!t) return "";
    t = t.split("\n")[0].replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
    if (t.length > (limit || 58)) t = t.slice(0, limit || 58).replace(/\s+\S*$/, "") + "…";
    return t;
  }

  function makeItem(key, entry, hidden) {
    var fig = document.createElement("figure");
    fig.className = "m-item";
    fig.setAttribute("data-key", key);

    var img = document.createElement("img");
    img.src = entry.thumb;
    /* the figcaption carries title + description; a duplicate alt would
       make screen readers announce every card twice */
    img.alt = "";
    if (entry.width) img.width = entry.width;
    if (entry.height) img.height = entry.height;
    fig.appendChild(img);

    var cap = document.createElement("figcaption");
    cap.className = "m-overlay";
    var h3 = document.createElement("h3");
    h3.textContent = entry.title;
    var p = document.createElement("p");
    p.textContent = entry.description;
    var a = document.createElement("a");
    a.className = "btn btn-sm";
    a.href = entry.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = "View project" + ARROW;
    if (hidden) a.tabIndex = -1;
    cap.appendChild(h3);
    cap.appendChild(p);
    cap.appendChild(a);
    fig.appendChild(cap);
    return fig;
  }

  function renderReel(data) {
    var groups = marquee.querySelectorAll(".marquee-group");
    Object.keys(data).forEach(function (key) {
      groups[0].appendChild(makeItem(key, data[key], false));
      groups[1].appendChild(makeItem(key, data[key], true));
    });
  }

  /* On visitors' networks TikTok's oEmbed usually resolves — swap in the
     live cover and caption; the bundled placeholder stays as fallback. */
  function refreshTikTok(data) {
    Object.keys(data).forEach(function (key) {
      var entry = data[key];
      if (!entry.oembed) return;
      fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent(entry.url))
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
        .then(function (d) {
          if (!d || !d.thumbnail_url) return;
          var probe = new Image();
          probe.onload = function () {
            Array.prototype.forEach.call(
              marquee.querySelectorAll('.m-item[data-key="' + key + '"]'),
              function (item) {
                var img = item.querySelector("img");
                if (d.thumbnail_width) {
                  img.width = d.thumbnail_width;
                  img.height = d.thumbnail_height;
                }
                img.src = d.thumbnail_url;
                var t = tidyTitle(d.title);
                if (t) item.querySelector("h3").textContent = t;
              }
            );
            if (remeasure) remeasure();
          };
          probe.src = d.thumbnail_url;
        })
        .catch(function () { /* placeholder stays */ });
    });
  }

  /* Pointer devices — edge-reveal: hovering a thumbnail clipped by the
     viewport edge slides the track just enough to show it fully. The shift
     lives on the `translate` property, which composes with the animation's
     `transform`. */
  function initPointerReel() {
    /* Reduced motion: the CSS turns the reel into a plain manual scroller —
       no edge-reveal or scroll hijacking wanted. */
    if (reduced) return;

    var track = marquee.querySelector(".marquee-track");
    var edgeOffset = 0;
    var EDGE_PAD = 12;

    function appliedX() {
      var t = getComputedStyle(track).translate;
      return !t || t === "none" ? 0 : parseFloat(t) || 0;
    }

    function reset() {
      edgeOffset = 0;
      track.style.translate = "0px 0";
    }

    /* Slide a clipped item fully into view. Measures against the item's
       settled position so mid-transition re-fires don't double-count the
       not-yet-applied shift. */
    function revealItem(item) {
      var pending = edgeOffset - appliedX();
      var mr = marquee.getBoundingClientRect();
      var ir = item.getBoundingClientRect();
      var left = ir.left + pending;
      var right = ir.right + pending;
      var delta = 0;
      if (left < mr.left) {
        delta = mr.left + EDGE_PAD - left;
      } else if (right > mr.right) {
        delta = mr.right - EDGE_PAD - right;
      }
      if (delta) {
        edgeOffset += delta;
        track.style.translate = edgeOffset + "px 0";
      }
    }

    marquee.addEventListener("pointerover", function (e) {
      var item = e.target.closest(".m-item");
      if (item) revealItem(item);
    });
    marquee.addEventListener("focusin", function (e) {
      var item = e.target.closest(".m-item");
      if (item) revealItem(item);
    });
    marquee.addEventListener("pointerleave", reset);
    marquee.addEventListener("focusout", function (e) {
      if (!marquee.contains(e.relatedTarget)) reset();
    });

    /* keyboard focus scrolls the hidden-overflow container and would
       permanently desync the animation — convert that scroll into the
       translate mechanism and zero it out */
    marquee.addEventListener("scroll", function () {
      var sl = marquee.scrollLeft;
      if (!sl) return;
      edgeOffset -= sl;
      track.style.translate = edgeOffset + "px 0";
      marquee.scrollLeft = 0;
    });
  }

  /* Touch devices — the reel becomes a native horizontal scroller that
     drifts on its own, pauses while the user interacts, and wraps
     seamlessly (the aria-hidden duplicate group provides the runway). */
  function initTouchReel() {
    var group = marquee.querySelector(".marquee-group");
    var groupW = 0;
    var pausedUntil = 0;
    var overlayOpen = false;
    var expected = -1; /* scrollLeft after our last programmatic write */
    var SPEED = 110; /* px per second, matches the desktop pace */

    var measure = function () {
      groupW = group.getBoundingClientRect().width;
    };
    measure();
    remeasure = measure;
    window.addEventListener("resize", measure);

    var autoWrite = function (v) {
      marquee.scrollLeft = v;
      expected = marquee.scrollLeft;
    };

    var wrap = function () {
      if (!groupW) return;
      if (marquee.scrollLeft >= groupW) {
        autoWrite(marquee.scrollLeft - groupW);
      } else if (marquee.scrollLeft < 2 && pausedUntil > performance.now()) {
        autoWrite(marquee.scrollLeft + groupW);
      }
    };

    var endTouch = function () {
      pausedUntil = performance.now() + 2500;
    };
    marquee.addEventListener("touchstart", function () {
      pausedUntil = Infinity;
    }, { passive: true });
    marquee.addEventListener("touchend", endTouch, { passive: true });
    marquee.addEventListener("touchcancel", endTouch, { passive: true });

    marquee.addEventListener("scroll", function () {
      /* only a scroll that deviates from our own writes is the user's */
      if (pausedUntil !== Infinity && Math.abs(marquee.scrollLeft - expected) > 1.5) {
        pausedUntil = Math.max(pausedUntil, performance.now() + 2000);
      }
      wrap();
    }, { passive: true });

    var prev = null;
    var step = function (ts) {
      if (prev !== null && !reduced && !overlayOpen && performance.now() > pausedUntil) {
        var dt = Math.min(ts - prev, 100); /* ignore backgrounded-tab gaps */
        autoWrite(marquee.scrollLeft + (SPEED * dt) / 1000);
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
      if (inMarquee && !overlayOpen) {
        pausedUntil = Math.max(pausedUntil, performance.now() + 1500);
      }
    });
  }

  if (marquee) {
    fetch("./assets/data/shortform.json")
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (data) {
        renderReel(data);
        if (touch) {
          initTouchReel();
        } else {
          initPointerReel();
        }
        refreshTikTok(data);
      })
      .catch(function (err) {
        /* No data — hide the empty band rather than show a blank reel */
        var section = marquee.closest("section");
        if (section) section.style.display = "none";
        if (window.console) console.warn("short-form reel data unavailable:", err);
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
