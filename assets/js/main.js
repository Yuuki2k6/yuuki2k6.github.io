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
