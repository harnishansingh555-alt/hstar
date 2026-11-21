/* hstar color choice. Saved in Settings (profile page), read by every page that loads this file (login, profile...).
   Each choice has TWO colors: c1 (main) and c2 (second). The logo is never changed. */
(function () {
  var KEY = "pai_color";
  var LIST = [
    { id: "terracotta", n: "Terracotta", c1: "#C96442", c2: "#F2BE1A" },
    { id: "blue",       n: "Blue",       c1: "#2F6FEB", c2: "#4CC3F0" },
    { id: "green",      n: "Green",      c1: "#1E8E6A", c2: "#A6D95B" },
    { id: "purple",     n: "Purple",     c1: "#7B4FD6", c2: "#F08AC8" },
    { id: "rose",       n: "Rose",       c1: "#D6457A", c2: "#FFB347" }
  ];
  var root = document.documentElement;

  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hex(a) { return "#" + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function mix(h, t, p) { var a = rgb(h); return hex(a.map(function (v) { return v + (t - v) * p; })); }
  function find(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return LIST[0]; }
  function get() { var v = null; try { v = localStorage.getItem(KEY); } catch (e) {} return find(v); }

  function apply(c) {
    var s = root.style, a = rgb(c.c1), b = rgb(c.c2);
    s.setProperty("--a1", c.c1); s.setProperty("--a1d", mix(c.c1, 0, .14)); s.setProperty("--a1l", mix(c.c1, 255, .12));
    s.setProperty("--a1-rgb", a.join(",")); s.setProperty("--a2", c.c2); s.setProperty("--a2-rgb", b.join(","));
    root.dataset.color = c.id;
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", "#FAF9F5");
  }
  function set(id) { var c = find(id); try { localStorage.setItem(KEY, c.id); } catch (e) {} apply(c); return c; }

  window.PAIColor = { list: LIST, get: get, set: set, apply: apply };
  apply(get());
  document.addEventListener("DOMContentLoaded", function () { apply(get()); });
  window.addEventListener("storage", function (e) { if (e.key === KEY) apply(get()); });
})();
