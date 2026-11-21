/* hstar light/dark theme. One choice, saved in the browser, shared by the login page, chat and profile.
   Also puts the sun/moon button on the page (login top bar, chat top bar). */
(function () {
  var KEY = "pai_theme", root = document.documentElement;
  function get() { var v = null; try { v = localStorage.getItem(KEY); } catch (e) {} return v === "dark" ? "dark" : "light"; }
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function paint(t) {
    root.dataset.theme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#1A1715" : "#FAF9F5");
    var bs = document.querySelectorAll(".thmbtn");
    for (var i = 0; i < bs.length; i++) {
      bs[i].innerHTML = t === "dark" ? SUN : MOON; // shows the theme you will switch to
      bs[i].setAttribute("aria-pressed", String(t === "dark"));
    }
  }
  function set(t) { try { localStorage.setItem(KEY, t); } catch (e) {} paint(t); }
  root.dataset.theme = get(); // before the page paints, so there is no flash
  window.PAITheme = { get: get, set: set };
  function mount() {
    if (!document.querySelector(".thmbtn")) {
      var host = document.querySelector(".bar") || document.querySelector(".top");
      if (host) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "thmbtn";
        b.title = b.ariaLabel = "Light / dark theme";
        b.onclick = function () { set(get() === "dark" ? "light" : "dark"); };
        var gear = host.querySelector(".gearlink"), lang = host.querySelector(".lang");
        if (gear) host.insertBefore(b, gear); else if (lang) host.insertBefore(b, lang); else host.appendChild(b);
      }
    }
    paint(get());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  addEventListener("storage", function (e) { if (e.key === KEY) paint(get()); });
})();
