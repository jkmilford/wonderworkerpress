/* Wonderworker Press — site behavior (forms, footer year, "look inside" carousel) */
(function () {
  var y = document.querySelectorAll("[data-year]");
  for (var i = 0; i < y.length; i++) y[i].textContent = new Date().getFullYear();

  function setBusy(btn, busy, busyText, idleText) {
    if (!btn) return;
    btn.disabled = busy;
    btn.textContent = busy ? busyText : idleText;
    btn.style.opacity = busy ? ".7" : "";
  }

  /* Newsletter → MailerLite */
  var nl = document.querySelector("form[data-nl]");
  if (nl) nl.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = nl.querySelector('button[type="submit"]'), err = nl.querySelector("[data-nl-error]");
    var data = new FormData(nl);
    if (!String(data.get("fields[name]") || "").trim()) data.delete("fields[name]");
    if (err) err.hidden = true;
    setBusy(btn, true, "Subscribing…", "Subscribe");
    function done(ok) {
      setBusy(btn, false, "Subscribing…", "Subscribe");
      if (ok) { document.querySelector("[data-nl-box]").hidden = true; document.querySelector("[data-nl-done]").hidden = false; }
      else if (err) err.hidden = false;
    }
    fetch(nl.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().then(function (j) { done(r.ok && j && j.success !== false); }, function () { done(r.ok); }); })
      .catch(function () {
        fetch(nl.action, { method: "POST", body: data, mode: "no-cors" }).then(function () { done(true); }, function () { done(false); });
      });
  });

  /* Contact → Formspree */
  var ct = document.querySelector("form[data-ct]");
  if (ct) ct.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = ct.querySelector('button[type="submit"]'), err = ct.querySelector("[data-ct-error]");
    if (err) err.hidden = true;
    setBusy(btn, true, "Sending…", "Send message");
    fetch(ct.action, { method: "POST", body: new FormData(ct), headers: { Accept: "application/json" } })
      .then(function (r) {
        setBusy(btn, false, "Sending…", "Send message");
        if (r.ok) { document.querySelector("[data-ct-box]").hidden = true; document.querySelector("[data-ct-done]").hidden = false; }
        else if (err) err.hidden = false;
      })
      .catch(function () { setBusy(btn, false, "Sending…", "Send message"); if (err) err.hidden = false; });
  });

  /* "Look inside" carousel + enlarged view (home page) */
  var slides = document.querySelectorAll("[data-slide]");
  if (!slides.length) return;
  var n = slides.length, cur = 0, open = false;
  var dots = document.querySelectorAll("[data-go]");
  function show(i) {
    cur = (i + n) % n;
    for (var k = 0; k < n; k++) {
      slides[k].style.opacity = k === cur ? 1 : 0;
      slides[k].style.pointerEvents = k === cur ? "auto" : "none";
      if (dots[k]) { dots[k].style.background = k === cur ? "#24382E" : "#D8CDB4"; dots[k].setAttribute("aria-current", k === cur ? "true" : "false"); }
    }
  }
  for (var d = 0; d < dots.length; d++) (function (k) { dots[k].addEventListener("click", function () { show(k); }); })(d);
  var pv = document.querySelector("[data-prev]"), nx = document.querySelector("[data-next]");
  if (pv) pv.addEventListener("click", function () { show(cur - 1); });
  if (nx) nx.addEventListener("click", function () { show(cur + 1); });
  setInterval(function () { if (!open && !document.hidden) show(cur + 1); }, 5000);

  var imgs = [];
  for (var s = 0; s < n; s++) imgs.push(slides[s].querySelector("img"));
  var ov, big, cap, mid, zoomed = false;
  function btn(label, txt) {
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", label); b.textContent = txt;
    b.style.cssText = "width:44px;height:44px;padding:0;background:transparent;border:1px solid rgba(239,232,216,.35);border-radius:2px;color:#EFE8D8;font-size:22px;line-height:1;cursor:pointer;font-family:inherit";
    return b;
  }
  function setZoom(z) {
    zoomed = z;
    big.style.maxWidth = z ? "none" : "100%"; big.style.maxHeight = z ? "none" : "100%";
    big.style.width = z ? "min(1800px,200%)" : "auto"; big.style.cursor = z ? "zoom-out" : "zoom-in";
    mid.style.alignItems = z ? "flex-start" : "center"; mid.style.justifyContent = z ? "flex-start" : "center";
  }
  function paint() { var im = imgs[cur]; big.src = im.currentSrc || im.src; big.alt = im.alt + ", enlarged"; cap.textContent = "Page " + (cur + 1) + " of " + n; setZoom(false); }
  function close() { if (!ov) return; ov.remove(); ov = null; open = false; document.documentElement.style.overflow = ""; document.body.style.overflow = ""; }
  function openBox() {
    open = true;
    ov = document.createElement("div"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Enlarged page");
    ov.style.cssText = "position:fixed;inset:0;z-index:1000;background:rgba(20,18,15,.94);display:flex;flex-direction:column;font-family:Lato,sans-serif";
    var top = document.createElement("div"); top.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px clamp(14px,3vw,28px)";
    cap = document.createElement("span"); cap.style.cssText = "font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:#C9A24A";
    var x = btn("Close", "×"); x.onclick = close; top.appendChild(cap); top.appendChild(x);
    mid = document.createElement("div"); mid.style.cssText = "flex:1;min-height:0;overflow:auto;display:flex;padding:0 clamp(8px,2vw,24px)";
    big = document.createElement("img"); big.style.cssText = "display:block;height:auto;object-fit:contain;box-shadow:0 20px 60px rgba(0,0,0,.5)";
    big.onclick = function (e) { e.stopPropagation(); setZoom(!zoomed); };
    mid.appendChild(big); mid.onclick = function (e) { if (e.target === mid) close(); };
    var bot = document.createElement("div"); bot.style.cssText = "display:flex;align-items:center;justify-content:center;gap:12px;padding:14px";
    var p = btn("Previous page", "‹"), q = btn("Next page", "›");
    p.onclick = function () { show(cur - 1); paint(); }; q.onclick = function () { show(cur + 1); paint(); };
    var hint = document.createElement("span"); hint.textContent = "Tap the page to zoom"; hint.style.cssText = "font-size:12px;color:#B9AF9C;letter-spacing:.04em";
    bot.appendChild(p); bot.appendChild(hint); bot.appendChild(q);
    ov.appendChild(top); ov.appendChild(mid); ov.appendChild(bot); document.body.appendChild(ov);
    document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
    paint(); x.focus();
  }
  var opener = document.querySelector("[data-open-zoom]");
  if (opener) {
    opener.addEventListener("click", openBox);
    opener.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBox(); } });
  }
  document.addEventListener("keydown", function (e) {
    if (!ov) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") { show(cur + 1); paint(); }
    if (e.key === "ArrowLeft") { show(cur - 1); paint(); }
  });
})();
