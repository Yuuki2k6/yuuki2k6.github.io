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

  /* Marquee edge-reveal: hovering a thumbnail clipped by the viewport edge
     slides the track just enough to show it fully. The shift lives on the
     `translate` property, which composes with the animation's `transform`. */
  var marquee = document.querySelector(".marquee");
  if (marquee) {
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
