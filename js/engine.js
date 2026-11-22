/*
  فوانيس الحارة · story engine
  ------------------------------------------------------------
  Reads an episode file (episodes/epNN.js), draws each node's place, reveals its lines,
  shows story choices and the one donation choice, remembers flags and the player's path,
  and ends with the lantern + recap screen.

  Player text (name) is only ever written with textContent.
*/
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var art = H.art, audio = H.audio, COH = window.COH;

  var CAST = {
    saber: { name: "عم صابر", color: "#FFD27A" },
    nemat: { name: "الحاجة نعمات", color: "#F4AFC0" },
    hassan: { name: "عم حسن", color: "#A6DDB0" },
    mama: { name: "ماما", color: "#F7C59F" },
    sheikh: { name: "الشيخ عبد الله", color: "#CFE3FF" },
    kids: { name: "يوسف وملك", color: "#FFB36B" },
    malak: { name: "ملك", color: "#FFB36B" },
    abuyasser: { name: "أبو ياسر", color: "#A9E4EA" }
  };
  var TOTAL = 30;
  var STORE_KEY = "hara.v1";
  var SAMPLE_COUNTER = 12430;

  /* ---------------- state ---------------- */
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  var saved = load();
  var S = {
    prefs: Object.assign({ name: "", gender: "", muted: false, noticeSeen: false }, saved.prefs || {}),
    done: saved.done || {},
    run: saved.run || null
  };
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------------- helpers ---------------- */
  var DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function ar(n) {
    var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
    return s.replace(/\d/g, function (d) { return DIGITS[d]; });
  }
  function T(str) {
    if (!str) return "";
    var f = S.prefs.gender === "f";
    var nm = (S.prefs.name || "").trim() || (f ? "بنتي" : "ابني");
    return str
      .replace(/\{([^{}|]*)\|([^{}]*)\}/g, function (_, m, fem) { return f ? fem : m; })
      .replace(/\{name\}/g, nm);
  }
  function cond(c) {
    if (!c) return true;
    var flags = (S.run && S.run.flags) || {};
    return c.charAt(0) === "!" ? !flags[c.slice(1)] : !!flags[c];
  }
  function $(id) { return document.getElementById(id); }
  function h(tag, a, kids) {
    var el = document.createElement(tag);
    if (a) for (var k in a) {
      var v = a[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function svgFrom(markup, cls) {
    var wrap = document.createElement("span");
    wrap.className = cls || "";
    wrap.innerHTML = markup; // constant markup defined in this file only
    return wrap;
  }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }

  var LANTERN_SVG =
    '<svg viewBox="-24 -46 48 84" aria-hidden="true" focusable="false">' +
    '<defs><radialGradient id="lg"><stop offset="0" stop-color="#FFC75E" stop-opacity=".9"/><stop offset="1" stop-color="#FFC75E" stop-opacity="0"/></radialGradient></defs>' +
    '<circle class="lan-glow" cx="0" cy="-2" r="23" fill="url(#lg)"/>' +
    '<path class="lan-glass" d="M-10.5 -22 H10.5 L14 -2 L10.5 17 H-10.5 L-14 -2 Z"/>' +
    '<g fill="#C08A2E" stroke="#C08A2E">' +
    '<circle cx="0" cy="-36" r="3" fill="none" stroke-width="1.6"/><path d="M-9 -26 L0 -33.5 L9 -26 Z" stroke="none"/>' +
    '<rect x="-11.5" y="-26" width="23" height="4" rx="1" stroke="none"/>' +
    '<path d="M-10.5 -22 H10.5 L14 -2 L10.5 17 H-10.5 L-14 -2 Z" fill="none" stroke-width="1.6"/>' +
    '<path d="M0 -22 V17 M-14 -2 H14 M-10.5 -22 L-6 -2 L-10.5 17 M10.5 -22 L6 -2 L10.5 17" fill="none" stroke-width="1.1"/>' +
    '<rect x="-11.5" y="17" width="23" height="4" rx="1" stroke="none"/><path d="M-8 21 H8 L0 32 Z" stroke="none"/></g></svg>';

  var ICON_SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_MUTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------------- layout ---------------- */
  var app = $("app");
  app.innerHTML =
    '<div class="stage" id="stage">' +
    '  <div class="art" id="art"></div>' +
    '  <div class="hud">' +
    '    <button class="icon-btn" id="homeBtn" type="button" aria-label="ارجع للحارة"></button>' +
    '    <span class="pill hud-ep" id="hudEp"></span>' +
    '    <span class="pill hud-clock" id="hudClock"></span>' +
    '    <button class="icon-btn" id="muteBtn" type="button"></button>' +
    '  </div>' +
    '  <div class="place" id="placeChip"></div>' +
    '</div>' +
    '<div class="panel" id="panel" tabindex="0" aria-label="الحكاية. اضغط للمتابعة">' +
    '  <div class="speaker" id="speaker"></div>' +
    '  <p class="text" id="text" aria-live="polite"></p>' +
    '  <div class="choices" id="choices"></div>' +
    '  <div class="hint" id="hint"><span>اضغط للمتابعة</span><span class="hint-arrow" aria-hidden="true">‹</span></div>' +
    '</div>' +
    '<div class="overlay" id="overlay" hidden></div>' +
    '<div class="sheet-wrap" id="sheetWrap" hidden></div>' +
    '<div class="toast" id="toast" role="status" hidden></div>';

  var stage = $("stage"), artEl = $("art"), panel = $("panel"), speaker = $("speaker"), textEl = $("text"),
      choicesEl = $("choices"), hint = $("hint"), overlay = $("overlay"), sheetWrap = $("sheetWrap"),
      placeChip = $("placeChip"), hudClock = $("hudClock"), hudEp = $("hudEp"), muteBtn = $("muteBtn"), homeBtn = $("homeBtn");
  homeBtn.innerHTML = ICON_HOME;

  function renderMute() {
    muteBtn.innerHTML = S.prefs.muted ? ICON_MUTE : ICON_SOUND;
    muteBtn.setAttribute("aria-label", S.prefs.muted ? "شغّل الصوت" : "اقفل الصوت");
    muteBtn.setAttribute("aria-pressed", S.prefs.muted ? "true" : "false");
  }
  function toggleMute(e) {
    if (e) e.stopPropagation();
    S.prefs.muted = !S.prefs.muted; save();
    audio.setMuted(S.prefs.muted); renderMute();
    document.querySelectorAll("[data-sound-label]").forEach(function (b) { b.textContent = S.prefs.muted ? "الصوت: مقفول" : "الصوت: شغّال"; });
  }
  muteBtn.addEventListener("click", toggleMute);
  homeBtn.addEventListener("click", function (e) { e.stopPropagation(); showHub(); });
  renderMute();
  audio.setMuted(S.prefs.muted);

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }

  /* ---------------- scene ---------------- */
  var sceneKey = "", curTime = "";
  function setScene(place, time, show) {
    var key = place + "|" + time + "|" + (show || []).join(",");
    if (key === sceneKey) return;
    sceneKey = key;
    var layer = h("div", { "class": "layer" });
    layer.appendChild(art.scene(place, time, show || []));
    artEl.appendChild(layer);
    requestAnimationFrame(function () { requestAnimationFrame(function () { layer.classList.add("on"); }); });
    var olds = Array.prototype.slice.call(artEl.children, 0, -1);
    setTimeout(function () { olds.forEach(function (o) { if (o.parentNode) o.parentNode.removeChild(o); }); }, 1200);
    var nm = art.places[place] ? art.places[place].name : "";
    if (placeChip.textContent !== nm) {
      placeChip.textContent = nm;
      placeChip.classList.remove("in"); void placeChip.offsetWidth; placeChip.classList.add("in");
    }
    if (time !== curTime) { curTime = time; audio.time(time); }
  }
  function setClock(txt) { hudClock.textContent = txt || ""; hudClock.hidden = !txt; }

  /* ---------------- story ---------------- */
  var cur = { ep: null, node: null, lines: [], li: -1, mode: "idle", revealing: false, revealTimer: 0 };

  function begin(epId, resume) {
    var ep = H.episodes[epId];
    if (!ep) return;
    if (!resume || !S.run || S.run.ep !== epId) S.run = { ep: epId, node: ep.start, flags: {}, log: [], gift: null };
    save();
    cur.ep = ep;
    hudEp.textContent = "الحلقة " + ar(ep.id);
    sceneKey = ""; curTime = "";
    hideOverlay();
    COH.track(resume ? "episode_resume" : "episode_start", { episode: epId });
    cur.mode = "lines";
    enterNode(S.run.node);
    focusEl(panel);
  }

  function enterNode(id) {
    var node = cur.ep.nodes[id];
    if (!node) { if (window.console) console.error("Missing node:", id); return; }
    S.run.node = id;
    if (node.set) for (var k in node.set) S.run.flags[k] = node.set[k];
    save();
    cur.node = node;
    cur.lines = (node.lines || []).filter(function (l) { return typeof l === "string" || cond(l.if); });
    cur.li = -1;
    cur.mode = "lines";
    choicesEl.textContent = "";
    app.classList.remove("choosing", "giving");
    setScene(node.place, node.time, node.show);
    setClock(node.clock);
    advance();
  }

  function advance() {
    if (cur.mode === "busy") return;
    if (cur.revealing) { finishReveal(); return; }
    if (cur.mode !== "lines") return;
    cur.li++;
    if (cur.li < cur.lines.length) showLine(cur.lines[cur.li]);
    else finishNode();
  }

  function finishNode() {
    var n = cur.node;
    if (n.choice) showChoices(n.choice, false);
    else if (n.give) showChoices(n.give, true);
    else if (n.next) enterNode(n.next);
    else if (n.end) endEpisode();
  }

  function showLine(l) {
    if (typeof l === "string") l = { t: l };
    if (l.go) setScene(l.go.place || cur.node.place, l.go.time || cur.node.time, l.go.show || cur.node.show);
    if (l.fx) doFx(l.fx);
    var who = l.who && CAST[l.who];
    speaker.textContent = who ? who.name : "";
    speaker.style.color = who ? who.color : "";
    textEl.className = "text" + (who ? " say" : "");
    reveal(T(l.t));
    hint.hidden = false;
    panel.scrollTop = 0;
  }

  function reveal(str) {
    textEl.textContent = "";
    var words = str.split(" ");
    var step = Math.max(16, Math.min(42, 1300 / words.length));
    words.forEach(function (w, i) {
      var sp = document.createElement("span");
      sp.className = "w";
      sp.textContent = w;
      sp.style.animationDelay = Math.round(i * step) + "ms";
      textEl.appendChild(sp);
      if (i < words.length - 1) textEl.appendChild(document.createTextNode(" "));
    });
    cur.revealing = true;
    clearTimeout(cur.revealTimer);
    cur.revealTimer = setTimeout(function () { cur.revealing = false; }, words.length * step + 380);
  }
  function finishReveal() {
    textEl.classList.add("done");
    cur.revealing = false;
    clearTimeout(cur.revealTimer);
  }

  function doFx(fx) {
    if (fx === "cannon") {
      audio.cannon();
      COH.haptic("heavy");
      stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
    } else audio.fx(fx);
  }

  function showChoices(ch, isGive) {
    cur.mode = isGive ? "give" : "choice";
    hint.hidden = true;
    choicesEl.textContent = "";
    app.classList.add(isGive ? "giving" : "choosing"); // make room so every option is visible without scrolling
    choicesEl.appendChild(h("p", { "class": "prompt", text: T(ch.prompt) }));
    var first = null;
    ch.options.filter(function (o) { return cond(o.if); }).forEach(function (o, i) {
      var b = h("button", { type: "button", "class": "opt" + (isGive ? " give" : "") }, [h("span", { "class": "opt-t", text: T(o.t) })]);
      b.style.animationDelay = (i * 0.06).toFixed(2) + "s";
      if (isGive) {
        b.appendChild(h("span", { "class": "price", text: o.price ? ar(o.price) + " جنيه" : "ببلاش" }));
        b.setAttribute("aria-label", T(o.t) + "، " + (o.price ? ar(o.price) + " جنيه" : "ببلاش") + ". اضغط مطوّل للاختيار");
        bindHold(b, function () { give(o); });
      } else {
        b.addEventListener("click", function (e) { e.stopPropagation(); choose(o); });
      }
      choicesEl.appendChild(b);
      if (!first) first = b;
    });
    if (isGive) choicesEl.appendChild(h("p", { "class": "hold-hint", id: "holdHint", text: "اضغط مطوّل على اختيارك" }));
    focusEl(first);
  }

  function applyOpt(o) {
    if (o.set) for (var k in o.set) S.run.flags[k] = o.set[k];
    if (o.log) S.run.log.push(o.log);
    save();
  }

  function choose(o) {
    if (cur.mode !== "choice") return;
    cur.mode = "busy";
    audio.tap(); COH.haptic("light");
    applyOpt(o);
    COH.track("choice", { episode: cur.ep.id, node: S.run.node, next: o.next });
    setTimeout(function () { enterNode(o.next); focusEl(panel); }, 200);
  }

  function give(o) {
    if (cur.mode !== "give") return;
    cur.mode = "busy";
    COH.haptic("heavy");
    function proceed(status) {
      S.run.gift = { key: o.key, price: o.price || 0, status: status };
      S.run.flags["gave_" + o.key] = true;
      applyOpt(o);
      COH.track("give", { episode: cur.ep.id, option: o.key, amount: o.price || 0, status: status });
      enterNode(o.next);
      focusEl(panel);
    }
    if (!o.price) { proceed("free"); return; }
    COH.donate({ episode: cur.ep.id, option: o.key, amount: o.price, currency: "EGP" }).then(function (res) {
      if (res && res.status === "paid") { proceed("paid"); return; }
      cur.mode = "give";
      choicesEl.querySelectorAll(".opt.give").forEach(function (b) { b.style.setProperty("--p", 0); });
      COH.track("give", { episode: cur.ep.id, option: o.key, amount: o.price, status: res ? res.status : "failed" });
      if (res && res.status === "failed") toast("الدفع ما اكتملش. جرّب تاني.");
    });
  }

  // Press and hold to commit a donation choice.
  function bindHold(btn, onDone) {
    var raf = 0, start = 0, t0 = 0, done = false, DUR = 700;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / DUR);
      btn.style.setProperty("--p", p);
      if (p >= 1) { done = true; raf = 0; onDone(); return; }
      raf = requestAnimationFrame(tick);
    }
    function begin() {
      if (raf || cur.mode !== "give") return;
      done = false; start = 0; t0 = Date.now();
      raf = requestAnimationFrame(tick);
    }
    function cancel() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!done) {
        btn.style.setProperty("--p", 0);
        if (t0 && Date.now() - t0 < 350) {
          var hh = $("holdHint");
          if (hh) { hh.classList.remove("nudge"); void hh.offsetWidth; hh.classList.add("nudge"); }
        }
      }
      t0 = 0;
    }
    btn.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); begin(); });
    btn.addEventListener("pointerup", function (e) { e.stopPropagation(); cancel(); });
    btn.addEventListener("pointerleave", cancel);
    btn.addEventListener("pointercancel", cancel);
    btn.addEventListener("click", function (e) { e.stopPropagation(); });
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    btn.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); e.stopPropagation(); begin(); } });
    btn.addEventListener("keyup", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cancel(); } });
  }

  panel.addEventListener("click", function () { if (cur.mode === "lines") advance(); });
  document.addEventListener("keydown", function (e) {
    if (!sheetWrap.hidden) { if (e.key === "Escape") { var back = sheetWrap.querySelector(".s-back"); if (back) back.click(); } return; }
    if (!overlay.hidden) return;
    var a = document.activeElement;
    if (a && a.tagName === "BUTTON") return;
    if (cur.mode === "lines" && (e.key === " " || e.key === "Enter" || e.key === "ArrowLeft")) { e.preventDefault(); advance(); }
  });

  /* ---------------- end of episode ---------------- */
  function endEpisode() {
    var ep = cur.ep, run = S.run, gift = run.gift, log = run.log.slice();
    cur.mode = "idle";
    S.done[ep.id] = { key: gift ? gift.key : null, price: gift ? gift.price : 0, at: Date.now() };
    S.run = null;
    save();
    COH.track("episode_complete", { episode: ep.id, option: gift ? gift.key : null });
    audio.time("end");
    setTimeout(function () { audio.chime(); }, 500);
    showEnd(ep, log, gift);
  }

  function showEnd(ep, log, gift) {
    var free = !gift || !gift.price;
    var lantern = svgFrom(LANTERN_SVG, "end-lantern");
    var recap = h("ol", { "class": "recap" }, log.map(function (l) { return h("li", { text: T(l) }); }));
    var giftCard = free
      ? h("div", { "class": "gift" }, [
          h("p", { "class": "gift-main", text: T("{اخترت|اخترتي} تنادي الحارة لعم صابر.") }),
          h("p", { "class": "gift-sub", text: "الدالّ على الخير كفاعله. ابعت الحكاية لحد يكمّلها." })
        ])
      : h("div", { "class": "gift" }, [
          h("p", { "class": "gift-main", text: "تبرعك: " + ar(gift.price) + " جنيه" }),
          h("p", { "class": "gift-sub", text: T("راح لحملات EFB في رمضان. الرقم ده بيظهر {ليك انت|ليكي انتي} بس، ومش بيظهر في المشاركة.") })
        ]);
    var shareBtn = h("button", {
      type: "button", "class": free ? "btn primary" : "btn", text: "شارك الحكاية",
      onclick: function () {
        COH.track("share", { episode: ep.id });
        COH.share({ episode: ep.id, title: "فوانيس الحارة", text: ep.shareText });
      }
    });
    var teaser = h("div", { "class": "teaser" }, [
      h("p", { "class": "teaser-k", text: "بكرة · الحلقة " + ar(ep.next.id) }),
      h("p", { "class": "teaser-t", text: ep.next.title }),
      h("p", { "class": "teaser-b", text: ep.next.teaser })
    ]);
    var body = h("div", { "class": "end" }, [
      lantern,
      h("h2", { "class": "end-title", text: ep.endTitle }),
      h("div", { "class": "end-sec" }, [h("p", { "class": "end-k", text: "حكايتك النهارده" }), recap]),
      giftCard,
      h("div", { "class": "end-actions" }, [shareBtn]),
      h("p", { "class": "counter" }, [
        "الليلة في الحارة: ", h("b", { text: ar(SAMPLE_COUNTER) }), " جار اتساعد ",
        h("span", { "class": "counter-note", text: "(رقم تجريبي)" })
      ]),
      teaser,
      h("div", { "class": "end-actions" }, [
        h("button", { type: "button", "class": "btn", text: "العب تاني باختيارات تانية", onclick: function () { showTitleCard(ep, function () { begin(ep.id, false); }); } }),
        h("button", { type: "button", "class": "btn ghost", text: "ارجع للحارة", onclick: showHub })
      ])
    ]);
    showOverlay("screen-end", [body]);
    setTimeout(function () { audio.drum(); }, 2600);
  }

  /* ---------------- screens ---------------- */
  function showOverlay(cls, kids) {
    overlay.className = "overlay " + cls;
    overlay.textContent = "";
    kids.forEach(function (k) { overlay.appendChild(k); });
    overlay.hidden = false;
    overlay.scrollTop = 0;
    var f = overlay.querySelector("button, input");
    focusEl(f);
  }
  function hideOverlay() { overlay.hidden = true; overlay.textContent = ""; }

  function showHub() {
    cur.mode = "idle";
    app.classList.remove("choosing", "giving");
    audio.time("hub");
    var ep = H.episodes[1];
    var done = !!S.done[1], inProg = S.run && S.run.ep === 1;
    var hubArt = h("div", { "class": "hub-art" });
    hubArt.appendChild(art.hub(function (i) { return !!S.done[i + 1]; }, done ? -1 : 0));
    var card = h("button", { type: "button", "class": "ep-card", onclick: function () { startFlow(1); } }, [
      svgFrom(LANTERN_SVG, "ep-card-lan" + (done ? " lit" : "")),
      h("span", { "class": "ep-card-main" }, [
        h("span", { "class": "ep-card-day", text: "اليوم " + ar(ep.day) + " · " + ep.dayLabel }),
        h("span", { "class": "ep-card-title", text: ep.title })
      ]),
      h("span", { "class": "ep-card-cta", text: inProg ? "كمّل" : done ? "العب تاني" : "ابدأ" })
    ]);
    var soundBtn = h("button", { type: "button", "class": "link-btn", "data-sound-label": "1", text: S.prefs.muted ? "الصوت: مقفول" : "الصوت: شغّال", onclick: toggleMute });
    var lit = Object.keys(S.done).length;
    showOverlay("screen-hub", [
      hubArt,
      h("div", { "class": "hub-body" }, [
        h("p", { "class": "hub-k", text: "نسخة تجريبية · الحلقة الأولى" }),
        h("h1", { "class": "hub-title", text: "فوانيس الحارة" }),
        h("p", { "class": "hub-sub", text: "كل يوم في رمضان، حد في الحارة محتاجك. نوّرت " + ar(lit) + " من " + ar(TOTAL) + " فانوس." }),
        card,
        h("p", { "class": "hub-note", text: "كل حلقة بتفتح فجر يومها. واللي فاته يوم، يقدر يلعبه في أي وقت ويكمّل." }),
        h("div", { "class": "hub-links" }, [
          h("button", { type: "button", "class": "link-btn", text: "اسمك وطريقة الكلام", onclick: function () { showProfile(showHub); } }),
          soundBtn,
          h("button", { type: "button", "class": "link-btn", text: "التبرعات بتروح فين؟", onclick: function () { showNotice(showHub); } })
        ])
      ])
    ]);
  }

  function startFlow(epId) {
    audio.init();
    audio.setMuted(S.prefs.muted);
    var ep = H.episodes[epId];
    var resume = S.run && S.run.ep === epId;
    var steps = [];
    if (!S.prefs.noticeSeen) steps.push(showNotice);
    if (!S.prefs.gender) steps.push(showProfile);
    if (!resume) steps.push(function (next) { showTitleCard(ep, next); });
    (function run(i) {
      if (i < steps.length) steps[i](function () { run(i + 1); });
      else begin(epId, resume);
    })(0);
  }

  function showNotice(next) {
    showOverlay("screen-card", [
      h("div", { "class": "card" }, [
        h("h2", { "class": "card-title", text: "قبل ما تبدأ" }),
        h("p", { text: "حكايات فوانيس الحارة مستوحاة من حياتنا، والشخصيات من خيالنا." }),
        h("p", { text: "كل تبرع بتعمله جوّه اللعبة بيروح لحملات EFB في رمضان: [اسم الحملة] و[اسم الحملة]." }),
        h("p", { text: "وكل اختيار بيساعد، حتى لو ببلاش." }),
        h("button", { type: "button", "class": "btn primary", text: "يلا بينا", onclick: function () { S.prefs.noticeSeen = true; save(); next(); } })
      ])
    ]);
  }

  function showProfile(next) {
    var gender = S.prefs.gender;
    var input = h("input", { id: "nameInput", type: "text", maxlength: "18", autocomplete: "off", placeholder: "اكتب اسمك", "aria-label": "اسمك", dir: "rtl" });
    input.value = S.prefs.name || "";
    var mBtn = h("button", { type: "button", "class": "seg", text: "انت", "aria-pressed": gender === "m" ? "true" : "false" });
    var fBtn = h("button", { type: "button", "class": "seg", text: "انتي", "aria-pressed": gender === "f" ? "true" : "false" });
    var ok = h("button", { type: "button", "class": "btn primary", text: "تمام" });
    ok.disabled = !gender;
    function pick(g) {
      gender = g;
      mBtn.setAttribute("aria-pressed", g === "m" ? "true" : "false");
      fBtn.setAttribute("aria-pressed", g === "f" ? "true" : "false");
      ok.disabled = false;
    }
    mBtn.addEventListener("click", function () { pick("m"); });
    fBtn.addEventListener("click", function () { pick("f"); });
    ok.addEventListener("click", function () {
      S.prefs.name = input.value.replace(/[{}|<>]/g, "").trim().slice(0, 18);
      S.prefs.gender = gender;
      save();
      next();
    });
    showOverlay("screen-card", [
      h("div", { "class": "card" }, [
        h("h2", { "class": "card-title", text: "أهلًا في الحارة" }),
        h("label", { "class": "field-k", "for": "nameInput", text: "اسمك إيه؟ الجيران هينادوك بيه." }),
        input,
        h("p", { "class": "field-k", text: "نكلّمك إزاي؟" }),
        h("div", { "class": "segs", role: "group", "aria-label": "نكلّمك إزاي" }, [mBtn, fBtn]),
        h("p", { "class": "fine", text: "جوّه COH، الاسم وطريقة الكلام هييجوا من حسابك تلقائي." }),
        ok
      ])
    ]);
  }

  function showTitleCard(ep, next) {
    var doneOnce = false;
    function go() { if (doneOnce) return; doneOnce = true; next(); }
    var card = h("div", { "class": "title-card", role: "button", tabindex: "0", "aria-label": "ابدأ الحلقة", onclick: go, onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } } }, [
      svgFrom(LANTERN_SVG, "tc-lantern"),
      h("p", { "class": "tc-day", text: ep.dayLabel }),
      h("p", { "class": "tc-ep", text: "الحلقة " + ar(ep.id) }),
      h("h2", { "class": "tc-title", text: ep.title })
    ]);
    showOverlay("screen-title", [card]);
    focusEl(card);
    setTimeout(go, 3400);
  }

  /* ---------------- mocks for running outside COH ---------------- */
  COH.mock.donate = function (o) {
    return new Promise(function (resolve) {
      sheetWrap.textContent = "";
      sheetWrap.hidden = false;
      function close(status) { sheetWrap.hidden = true; sheetWrap.textContent = ""; resolve({ status: status }); }
      var pay = h("button", { type: "button", "class": "s-pay", text: "ادفع " + ar(o.amount) + " جنيه", onclick: function () { close("paid"); } });
      var sheet = h("div", { "class": "sheet", role: "dialog", "aria-modal": "true", "aria-label": "شاشة التبرع" }, [
        h("span", { "class": "grab", "aria-hidden": "true" }),
        h("span", { "class": "s-app", text: "COH · تبرّع" }),
        h("span", { "class": "s-amt", text: "تبرّع بـ " + ar(o.amount) + " جنيه" }),
        h("span", { "class": "s-for", text: "فوانيس الحارة · الحلقة " + ar(o.episode) }),
        h("span", { "class": "s-note", text: "تبرعك بيروح لحملات EFB في رمضان." }),
        pay,
        h("button", { type: "button", "class": "s-back", text: "رجوع", onclick: function () { close("cancelled"); } }),
        h("span", { "class": "s-demo", text: "نسخة تجريبية: مفيش فلوس هتتدفع. جوّه COH هنا بتفتح شاشة الدفع الحقيقية." })
      ]);
      sheetWrap.onclick = function (e) { if (e.target === sheetWrap) close("cancelled"); };
      sheetWrap.appendChild(sheet);
      focusEl(pay);
    });
  };

  COH.mock.share = function (o) {
    var done = function () { toast("اتنسخ نص الحكاية. ابعته لحد."); };
    var fail = function () { toast("جوّه COH هنا بتفتح شاشة المشاركة بتاعة الموبايل."); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(o.text).then(done, fail);
      else fail();
    } catch (e) { fail(); }
    return Promise.resolve({ status: "shared" });
  };

  /* ---------------- start ---------------- */
  if (COH.isNative) {
    COH.user().then(function (u) {
      if (u && u.name && !S.prefs.name) S.prefs.name = String(u.name).replace(/[{}|<>]/g, "").slice(0, 18);
      if (u && (u.gender === "m" || u.gender === "f")) S.prefs.gender = u.gender;
      save();
    });
  }
  showHub();
})();
