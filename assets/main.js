/* Lex Prima — main.js */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile-Navigation */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Sticky-Header-Schatten */
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Scroll-Reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Zähler-Animation für Statistiken (data-count) */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var target = parseInt(el.getAttribute("data-count"), 10);
          var suffix = el.getAttribute("data-suffix") || "";
          var start = null;
          var dur = 1100;
          function tick(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Kontaktformular: öffnet den Mail-Client (statische Seite, kein Backend) */
  var form = document.getElementById("kontakt-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = (document.getElementById("kf-name") || {}).value || "";
      var mail = (document.getElementById("kf-email") || {}).value || "";
      var topic = (document.getElementById("kf-thema") || {}).value || "Allgemeine Anfrage";
      var msg = (document.getElementById("kf-nachricht") || {}).value || "";
      var subject = encodeURIComponent("[Lex Prima] " + topic);
      var body = encodeURIComponent(msg + "\n\n—\n" + name + (mail ? " · " + mail : ""));
      /* PLATZHALTER: E-Mail-Adresse anpassen */
      window.location.href = "mailto:kontakt@lexprima.de?subject=" + subject + "&body=" + body;
      var note = document.getElementById("kf-note");
      if (note) note.hidden = false;
    });
  }

  /* Themen-Check: Live-Suche über alle Kapitel */
  var tcInput = document.getElementById("tc-input");
  if (tcInput && window.LEXPRIMA_KAPITEL) {
    var K = window.LEXPRIMA_KAPITEL;
    var results = document.getElementById("tc-results");
    var countEl = document.getElementById("tc-count");
    var MOD = {
      "ZR": { label: "ZR", cls: "badge-zr", url: "zivilrecht.html", name: "Zivilrecht" },
      "SR": { label: "SR", cls: "badge-sr", url: "strafrecht.html", name: "Strafrecht" },
      "ÖR": { label: "ÖR", cls: "badge-or", url: "oeffentliches-recht.html", name: "Öffentliches Recht NRW" }
    };
    function norm(s) {
      return s.toLowerCase()
        .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    }
    var normed = K.map(function (k) { return norm(k.t); });

    function esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function highlight(title, q) {
      var i = norm(title).indexOf(q);
      if (i < 0) return esc(title);
      return esc(title.slice(0, i)) + "<mark>" + esc(title.slice(i, i + q.length)) + "</mark>" + esc(title.slice(i + q.length));
    }
    function search() {
      var q = norm(tcInput.value.trim());
      if (q.length < 2) {
        results.innerHTML = "";
        countEl.textContent = K.length + " Kapitel";
        return;
      }
      var hits = [];
      for (var i = 0; i < K.length && hits.length < 30; i++) {
        if (normed[i].indexOf(q) !== -1) hits.push(K[i]);
      }
      countEl.textContent = hits.length + " Treffer";
      if (!hits.length) {
        results.innerHTML = '<div class="pr-empty">Kein Treffer für „' + esc(tcInput.value.trim()) + '“ – <a href="kontakt.html">frag uns direkt</a>, ob dein Thema abgedeckt ist.</div>';
        return;
      }
      results.innerHTML = hits.slice(0, 8).map(function (k) {
        var m = MOD[k.m];
        return '<a class="pr-row" href="' + m.url + '#inhalt">' +
          '<span class="badge-mod ' + m.cls + '">' + m.label + '</span>' +
          '<span>' + highlight(k.t, q) + '</span></a>';
      }).join("") + (hits.length > 8
        ? '<div class="pr-empty">+ ' + (hits.length - 8) + ' weitere Treffer in den Modulen</div>'
        : "");
    }
    tcInput.addEventListener("input", search);

    var chips = document.getElementById("tc-chips");
    if (chips) {
      chips.addEventListener("click", function (ev) {
        var b = ev.target.closest("button");
        if (!b) return;
        tcInput.value = b.textContent;
        tcInput.focus();
        search();
      });
    }
  }

  /* Aktuelles Jahr im Footer */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
