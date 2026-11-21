/* hstar language picker.
   - Searchable list of 140+ languages (all Indian languages, Punjabi in Gurmukhi and Shahmukhi, and the world).
   - English and Punjabi use the hand-written texts that are built into every page (no reload).
   - Every other language translates the whole page with Google Website Translator (page reloads once),
     and the chat AI answers in that language (the server gets it as "lc").
   - Languages marked "nopage" (Bodo, Santali, ...) are not offered by Google for pages: the page stays in English,
     but the AI still replies in that language. */
(function () {
  var GM = { zh: "zh-CN", "zh-TW": "zh-TW", he: "iw", fil: "tl", mni: "mni-Mtei", kok: "gom" };
  var gcode = function (c) { return GM[c] || c; };
  var DATA = null, loading = null;
  var NATIVE = { en: 1, pa: 1 };

  var css = ".lp{position:relative;display:inline-block}" +
    ".lp>button{display:flex;align-items:center;gap:8px;border:1px solid var(--line,#E6E3D8);background:var(--paper,#fff);color:var(--ink,#1F1E1D);border-radius:999px;padding:8px 14px;font:inherit;font-weight:600;font-size:.92rem;cursor:pointer;max-width:100%}" +
    ".lp>button:hover{border-color:#C96442}.lp>button svg{width:18px;height:18px;flex:none}.lp>button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}" +
    ".lpp{position:fixed;z-index:2147483000;display:none;flex-direction:column;width:min(320px,calc(100vw - 24px));max-height:min(460px,calc(100vh - 24px));background:var(--paper,#fff);color:var(--ink,#1F1E1D);border:1px solid var(--line,#E6E3D8);border-radius:16px;box-shadow:0 14px 40px rgba(31,30,29,.2);overflow:hidden;text-align:left}" +
    ".lpp.open{display:flex}" +
    ".lpp .lps{padding:10px;border-bottom:1px solid var(--line,#E6E3D8)}" +
    ".lpp input{width:100%;font:inherit;font-size:.95rem;padding:9px 12px;border:1px solid var(--line,#E6E3D8);border-radius:10px;background:var(--bg,#FAF9F5);color:inherit}" +
    ".lpp input:focus{outline:2px solid #C96442;outline-offset:0}" +
    ".lpp .lpl{overflow:auto;padding:4px 6px 8px;overscroll-behavior:contain}" +
    ".lpp h4{margin:10px 8px 4px;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#6B6A64);font-weight:700}" +
    ".lpp .lpo{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;text-align:left;border:0;background:none;padding:8px 10px;border-radius:9px;font:inherit;font-size:.95rem;color:inherit;cursor:pointer}" +
    ".lpp .lpo small{color:var(--muted,#6B6A64);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48%}.lpp .lpo span{overflow:hidden;text-overflow:ellipsis}" +
    ".lpp .lpo:hover,.lpp .lpo:focus-visible{background:rgba(201,100,66,.12);outline:none}" +
    ".lpp .lpo[aria-current=true]{background:rgba(201,100,66,.18);font-weight:700}" +
    ".lpp .lpe{padding:16px;text-align:center;color:var(--muted,#6B6A64);font-size:.9rem}" +
    ".lpp .lpn{margin:6px 8px 2px;font-size:.78rem;color:var(--muted,#6B6A64)}" +
    "#google_translate_element{display:none!important}.skiptranslate>iframe,.goog-te-banner-frame,.goog-te-balloon-frame,#goog-gt-tt,.goog-tooltip,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{display:none!important}body{top:0!important}.goog-text-highlight{background:none!important;box-shadow:none!important}font{background:none!important}";

  function stored() { try { return localStorage.getItem("lang2") || (localStorage.getItem("lang") === "pa" ? "pa" : "en"); } catch (e) { return "en"; } }
  function find(c) { var a = (DATA && DATA.langs) || []; for (var i = 0; i < a.length; i++) if (a[i].c === c) return a[i]; return null; }
  function labelOf(c) { var f = find(c); if (f) return f.n; return c === "pa" ? "ਪੰਜਾਬੀ" : "English"; }

  // ---- Google Website Translator (cookie googtrans=/en/<code>) ----
  function setCookie(val) {
    var exp = val ? "" : ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
    var v = val ? "/en/" + val : "";
    try {
      document.cookie = "googtrans=" + v + ";path=/;SameSite=Lax" + exp;
      if (location.hostname.indexOf(".") > -1) {
        document.cookie = "googtrans=" + v + ";path=/;domain=" + location.hostname + ";SameSite=Lax" + exp;
        document.cookie = "googtrans=" + v + ";path=/;domain=." + location.hostname + ";SameSite=Lax" + exp;
      }
    } catch (e) {}
  }
  function hasCookie() { return /(?:^|;\s*)googtrans=\/en\//.test(document.cookie); }
  function loadGoogle() {
    if (window.__hsGT) return; window.__hsGT = 1;
    var d = document.createElement("div"); d.id = "google_translate_element"; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d);
    window.hsGoogleInit = function () { try { new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element"); } catch (e) {} };
    var s = document.createElement("script"); s.async = true; s.src = "https://translate.google.com/translate_a/element.js?cb=hsGoogleInit"; document.head.appendChild(s);
  }

  // Keep code, brand and chat text out of the page translation.
  function protect() {
    var mark = function (root) {
      (root.querySelectorAll ? root.querySelectorAll("pre,code,.brand,.msg.bot,.msg.user,.code,.lp") : []).forEach(function (el) { el.setAttribute("translate", "no"); el.classList.add("notranslate"); });
    };
    mark(document);
    try { new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches && n.matches(".msg,.code,pre")) { n.setAttribute("translate", "no"); n.classList.add("notranslate"); } mark(n); } }); }); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }

  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (loading) return loading;
    loading = fetch("/langs.json").then(function (r) { return r.json(); }).then(function (j) { DATA = j; return j; }).catch(function () {
      DATA = { langs: [{ c: "en", n: "English", e: "English", g: "India" }, { c: "pa", n: "ਪੰਜਾਬੀ", e: "Punjabi", g: "India" }, { c: "hi", n: "हिन्दी", e: "Hindi", g: "India" }] }; return DATA;
    });
    return loading;
  }

  var panel = null, openFor = null;
  function closePanel() { if (panel) panel.classList.remove("open"); if (openFor) openFor.setAttribute("aria-expanded", "false"); openFor = null; }

  function build() {
    panel = document.createElement("div"); panel.className = "lpp"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Language"); panel.setAttribute("translate", "no");
    panel.innerHTML = '<div class="lps"><input type="search" placeholder="Search language / ਭਾਸ਼ਾ / भाषा" aria-label="Search language" autocomplete="off" spellcheck="false"></div><div class="lpl" role="listbox"></div>';
    document.body.appendChild(panel);
    var inp = panel.querySelector("input");
    inp.addEventListener("input", render);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { var f = panel.querySelector(".lpo"); if (f) f.click(); } if (e.key === "ArrowDown") { var f2 = panel.querySelector(".lpo"); if (f2) { e.preventDefault(); f2.focus(); } } });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { var b = openFor; closePanel(); if (b) b.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        var items = [].slice.call(panel.querySelectorAll(".lpo")), i = items.indexOf(document.activeElement);
        if (i > -1) { e.preventDefault(); var n = items[i + (e.key === "ArrowDown" ? 1 : -1)]; if (n) n.focus(); else if (e.key === "ArrowUp") inp.focus(); }
      }
    });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", closePanel);
    addEventListener("resize", closePanel);
    addEventListener("scroll", function (e) { if (panel && panel.contains(e.target)) return; closePanel(); }, true);
  }

  function render() {
    var q = panel.querySelector("input").value.trim().toLowerCase(), box = panel.querySelector(".lpl"), cur = stored();
    box.innerHTML = "";
    var list = DATA.langs.filter(function (x) { return !q || x.n.toLowerCase().indexOf(q) > -1 || x.e.toLowerCase().indexOf(q) > -1 || x.c.toLowerCase() === q; });
    if (!list.length) { var e = document.createElement("div"); e.className = "lpe"; e.textContent = "No language found"; box.appendChild(e); return; }
    var lastG = null;
    list.forEach(function (x) {
      if (!q && x.g !== lastG) { var h = document.createElement("h4"); h.textContent = x.g; box.appendChild(h); lastG = x.g; }
      var o = document.createElement("button"); o.type = "button"; o.className = "lpo"; o.setAttribute("role", "option"); o.setAttribute("data-c", x.c);
      var a = document.createElement("span"); a.textContent = x.n; if (x.rtl) a.dir = "rtl";
      var b = document.createElement("small"); b.textContent = x.e === x.n ? "" : x.e;
      o.appendChild(a); o.appendChild(b);
      if (x.c === cur) o.setAttribute("aria-current", "true");
      o.onclick = function () { choose(x); };
      box.appendChild(o);
    });
    if (!q) {
      var cur2 = find(cur);
      if (cur2 && cur2.nopage) { var n = document.createElement("div"); n.className = "lpn"; n.textContent = "Page text stays in English for some languages. The AI still answers in your language."; box.appendChild(n); }
    }
  }

  function choose(x) {
    var c = x.c, was = hasCookie();
    try {
      if (NATIVE[c]) { localStorage.removeItem("lang2"); localStorage.setItem("lang", c); }
      else { localStorage.setItem("lang2", c); localStorage.setItem("lang", "en"); }
    } catch (e) {}
    closePanel();
    if (NATIVE[c]) {
      setCookie(null);
      if (was) { location.reload(); return; }
      document.querySelectorAll(".lp").forEach(function (w) { w.querySelector("span").textContent = labelOf(c); });
      var t = document.querySelector('.lang[role=group] [data-lang="' + c + '"]'); if (t) t.click();
      return;
    }
    setCookie(x.nopage ? null : gcode(c));
    location.reload();
  }

  function place(btn) {
    var r = btn.getBoundingClientRect(), pw = Math.min(320, innerWidth - 24), ph = Math.min(460, innerHeight - 24);
    var left = Math.max(12, Math.min(r.right - pw, innerWidth - pw - 12));
    var top = r.bottom + 6; if (top + ph > innerHeight - 8) top = Math.max(12, r.top - ph - 6);
    panel.style.left = left + "px"; panel.style.top = top + "px";
  }

  function init() {
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var c = stored(), f = find(c);
    var active = !NATIVE[c];
    if (active) { document.documentElement.setAttribute("data-xlang", c); }
    // Keep the saved language and the translation cookie in step (the cookie ends when the browser closes).
    if (active) load().then(function () {
      var l = find(c);
      if (l && l.nopage) { if (hasCookie()) setCookie(null); return; }
      if (!hasCookie()) setCookie(gcode(c));
      loadGoogle();
    });
    if (!active && hasCookie()) setCookie(null);
    protect();
    document.querySelectorAll(".lang[role=group]").forEach(function (g) {
      var w = document.createElement("div"); w.className = "lp"; w.setAttribute("translate", "no");
      w.innerHTML = '<button type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Language"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg><span></span></button>';
      var b = w.firstChild; b.querySelector("span").textContent = f ? f.n : labelOf(c);
      b.onclick = function (e) {
        e.stopPropagation();
        if (openFor === b) { closePanel(); return; }
        load().then(function () {
          if (!panel) build();
          panel.querySelector("input").value = ""; render(); openFor = b; b.setAttribute("aria-expanded", "true");
          place(b); panel.classList.add("open");
          if (!matchMedia("(pointer:coarse)").matches) panel.querySelector("input").focus();
          var on = panel.querySelector("[aria-current=true]"); if (on) on.scrollIntoView({ block: "center" });
        });
      };
      g.style.display = "none"; g.parentNode.insertBefore(w, g);
    });
    if (!f) load().then(function () { var l = find(c); if (l) document.querySelectorAll(".lp>button span").forEach(function (s) { s.textContent = l.n; }); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
