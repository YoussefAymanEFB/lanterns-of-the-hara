/*
  فوانيس الحارة · the director (walk.html)
  ------------------------------------------------------------
  The whole game happens inside the hara (js/map.js). There are no story screens: each part of a day's story
  is a scene in the world, written in episodes/wNN.js. People walk in, turn, react; the camera moves in close;
  the words come in a dialogue box with the speaker's portrait. Between scenes you walk the hara yourself.
  Choices are asked in the dialogue box, or by walking to one of the places. Giving opens a small card in the
  world, and the money goes through COH (js/coh-bridge.js). The day ends with its lantern lighting up over the
  hara, and a page of your day.

  Scene lines (episodes/wNN.js):
    "words"                                narration, no portrait
    { who, t, face, name, if }             someone speaks ("me" is the player)
    { if, do: [ ... ] }                    some lines only if a flag is set
    ["cmd", ...]                           a stage direction, see run() below

  Player text (name) is only ever written with textContent.
*/
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var MAP = H.map, COH = window.COH, audio = H.audio;
  if (!MAP) return;
  var C = MAP.cut;
  var EPS = H.worldEpisodes || {};
  var STORE = "hara.world.v1", TOTAL = 30, SAMPLE_COUNTER = 12430;

  /* ---------------- memory ---------------- */
  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } }
  var saved = load(STORE) || {}, oldPrefs = (load("hara.walk.v1") || load("hara.v2") || {}).prefs || {};
  var S = {
    prefs: Object.assign({ name: oldPrefs.name || "", gender: oldPrefs.gender || "", muted: !!oldPrefs.muted, noticeSeen: !!oldPrefs.noticeSeen }, saved.prefs || {}),
    done: saved.done || {},
    run: saved.run || null,
    after: saved.after || {}
  };
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }

  var DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function ar(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "٬").replace(/\d/g, function (d) { return DIGITS[d]; }); }
  function T(str) {
    if (!str) return "";
    var f = S.prefs.gender === "f", nm = (S.prefs.name || "").trim() || (f ? "بنتي" : "ابني");
    return String(str).replace(/\{([^{}|]*)\|([^{}]*)\}/g, function (_, m, fem) { return f ? fem : m; }).replace(/\{name\}/g, nm);
  }
  function flags() { return (S.run && S.run.flags) || S.after.flags || {}; }
  function cond(c) {
    if (!c) return true;
    if (c.indexOf("&") > 0) return c.split("&").every(cond); // "nemat&!sign": all of them
    var fl = flags();
    return c.charAt(0) === "!" ? !fl[c.slice(1)] : !!fl[c];
  }
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
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- the screen ---------------- */
  var app = document.getElementById("app");
  app.className = "world";
  var stage = h("div", { "class": "stage", id: "stage" });
  var layer = h("div", { "class": "wl-layer" });
  var topBar = h("div", { "class": "wl-top" });
  var toastEl = h("div", { "class": "wl-toast", role: "status", hidden: true });
  app.appendChild(stage); app.appendChild(layer); app.appendChild(topBar); app.appendChild(toastEl);
  MAP.attach(stage);

  var ICON_SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_MUTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5c-.8 0-1.5.6-1.5 1.3V5.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.6 1.5 1.3V5.5z" fill="currentColor"/></svg>';
  var muteBtn = h("button", { type: "button", "class": "wl-ibtn", "aria-label": "الصوت" });
  var bookBtn = h("button", { type: "button", "class": "wl-ibtn", "aria-label": "القائمة" });
  muteBtn.innerHTML = S.prefs.muted ? ICON_MUTE : ICON_SOUND; // constant markup
  bookBtn.innerHTML = ICON_BOOK; // constant markup
  muteBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleMute(); });
  bookBtn.addEventListener("click", function (e) { e.stopPropagation(); showMenu(); });
  topBar.appendChild(bookBtn); topBar.appendChild(muteBtn);
  function toggleMute() {
    S.prefs.muted = !S.prefs.muted; save();
    audio.setMuted(S.prefs.muted);
    muteBtn.innerHTML = S.prefs.muted ? ICON_MUTE : ICON_SOUND; // constant markup
    document.querySelectorAll("[data-sound]").forEach(function (b) { b.textContent = S.prefs.muted ? "الصوت: مقفول" : "الصوت: شغّال"; });
  }
  var toastTimer = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800); }
  function sheet(cls, kids) {
    layer.textContent = "";
    var el = h("div", { "class": "wl-sheet " + cls }, kids);
    layer.appendChild(el);
    layer.hidden = false;
    var f = el.querySelector("button, input");
    if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
    return el;
  }
  function closeSheet() { layer.textContent = ""; layer.hidden = true; }
  function mode(m) { app.setAttribute("data-mode", m); }

  /* ---------------- the title: the hara at night, drifting ---------------- */
  var EP = null;
  function startMap(o) {
    MAP.start(Object.assign({
      day: (EP && EP.day) || 1, fem: S.prefs.gender === "f", name: (S.prefs.name || "").trim(),
      fmt: T, cond: cond, flags: flags, quests: quests,
      onMove: function (loc) { if (S.run) { S.run.at = loc; } },
      onLoad: function (loc) { prestage(loc, true); },
      onFlag: function (k) { if (S.run) { S.run.flags[k] = true; save(); } }
    }, o));
  }
  // walk.html?day=2&time=suhoor opens on a suhoor night (a preview of the suhoor days, before their stories are written)
  var URL_TIME = (function () { var m = /[?&]time=([a-z]+)/.exec(location.search); return m && /^(asr|pre|maghrib|night|suhoor)$/.test(m[1]) ? m[1] : ""; })();
  var URL_DAY = (function () { var m = /[?&]day=(\d+)/.exec(location.search); return m ? Math.max(1, Math.min(30, +m[1])) : 0; })();
  var PREVIEW = !!(URL_DAY || URL_TIME); // walk.html?day=15&time=night: a look at a day whose story isn't written yet
  var CLOCKS = { asr: "العصر", pre: "قبل المغرب", maghrib: "المغرب", night: "بالليل", suhoor: "السحور · ٢:٣٠" };
  function showTitle() {
    mode("title");
    EP = EPS[1];
    var sahra = URL_TIME === "suhoor";
    startMap({ title: true, time: sahra ? "suhoor" : "night", loc: "hara", at: [300, 330, 0] });
    var done = !!S.done[1], inProg = S.run && S.run.ep === 1, lit = Object.keys(S.done).length;
    var go = h("button", { type: "button", "class": "wl-btn" + (sahra ? "" : " big"), text: inProg ? "نكمّل الحكاية" : done ? "نلعب اليوم تاني" : "يلا نبدأ", onclick: function () { begin(); } });
    var kids = [
      h("p", { "class": "wl-t-k", text: "حكاية كل يوم في رمضان" }),
      h("h1", { "class": "wl-t-logo", text: "فوانيس الحارة" }),
      h("p", { "class": "wl-t-sub", text: "كل يوم، حد في الحارة محتاجك." + (lit ? T(" {نوّرت|نوّرتي} ") + ar(lit) + " من " + ar(TOTAL) + " فانوس." : "") }),
      h("div", { "class": "wl-t-acts" }, [
        sahra ? h("button", { type: "button", "class": "wl-btn big", text: "ليلة سحور في الحارة", onclick: function () { audioOn(); suhoorNight(); } }) : null,
        PREVIEW && !sahra ? h("button", { type: "button", "class": "wl-btn big", text: "امشي في الحارة · يوم " + ar(URL_DAY || 1) + " رمضان", onclick: function () { audioOn(); preview(); } }) : null,
        go,
        done && !sahra ? h("button", { type: "button", "class": "wl-btn", text: "امشي في الحارة بالليل", onclick: function () { audioOn(); freeRoam(true); } }) : null
      ]),
      h("div", { "class": "wl-t-links" }, [
        h("button", { type: "button", "class": "wl-link", text: "اسمك وطريقة الكلام", onclick: function () { profile(showTitle); } }),
        h("button", { type: "button", "class": "wl-link", "data-sound": "1", text: S.prefs.muted ? "الصوت: مقفول" : "الصوت: شغّال", onclick: function () { audioOn(); toggleMute(); } }),
        h("button", { type: "button", "class": "wl-link", text: "التبرعات بتروح فين؟", onclick: function () { notice(showTitle); } })
      ])
    ];
    sheet("wl-title", kids);
  }
  function audioOn() { audio.init(); audio.setMuted(S.prefs.muted); }

  function notice(next) {
    sheet("wl-card", [h("div", { "class": "wl-panel" }, [
      h("h2", { "class": "wl-h", text: "قبل البداية" }),
      h("p", { text: "حكايات فوانيس الحارة مستوحاة من حياتنا، والشخصيات من خيالنا." }),
      h("p", { text: "كل تبرع جوّه اللعبة بيروح لحملات EFB في رمضان." }),
      h("p", { text: "وكل اختيار بيساعد، حتى لو ببلاش." }),
      h("button", { type: "button", "class": "wl-btn", text: "يلا بينا", onclick: function () { S.prefs.noticeSeen = true; save(); next(); } })
    ])]);
  }
  // who are you: your name, and how the neighbours talk to you; a little you, turning around
  function profile(next) {
    var gender = S.prefs.gender;
    var input = h("input", { id: "wlName", type: "text", maxlength: "18", autocomplete: "off", placeholder: "اكتب اسمك", "aria-label": "اسمك", dir: "rtl" });
    input.value = S.prefs.name || "";
    var ok = h("button", { type: "button", "class": "wl-btn", text: "تمام" });
    ok.disabled = !gender;
    function pick(g) { gender = g; mB.setAttribute("aria-pressed", g === "m"); fB.setAttribute("aria-pressed", g === "f"); ok.disabled = false; }
    var mB = h("button", { type: "button", "class": "wl-who", "aria-pressed": gender === "m" ? "true" : "false", onclick: function () { pick("m"); } }, [spinner("boy"), h("span", { text: "انت" })]);
    var fB = h("button", { type: "button", "class": "wl-who", "aria-pressed": gender === "f" ? "true" : "false", onclick: function () { pick("f"); } }, [spinner("girl"), h("span", { text: "انتي" })]);
    ok.addEventListener("click", function () {
      S.prefs.name = input.value.replace(/[{}|<>]/g, "").trim().slice(0, 18);
      S.prefs.gender = gender; save();
      next();
    });
    sheet("wl-card", [h("div", { "class": "wl-panel" }, [
      h("h2", { "class": "wl-h", text: "أهلًا في الحارة" }),
      h("label", { "class": "wl-k", "for": "wlName", text: "اسمك إيه؟ ده الاسم اللي الجيران هينادوا بيه." }),
      input,
      h("p", { "class": "wl-k", text: "نكلّمك إزاي؟" }),
      h("div", { "class": "wl-whos", role: "group", "aria-label": "نكلّمك إزاي" }, [mB, fB]),
      h("p", { "class": "wl-fine", text: "جوّه COH، الاسم وطريقة الكلام هييجوا من حسابك تلقائي." }),
      ok
    ])]);
  }
  function spinner(cast) { // the pixel you, turning slowly
    var A = H.pix, sp = A.person(H.world.CAST[cast]), c = h("canvas", { "class": "wl-spin", width: 22, height: 32, "aria-hidden": "true" }), g = c.getContext("2d"), d = 0;
    function draw() { if (!c.isConnected && d > 0) return; g.clearRect(0, 0, 22, 32); g.drawImage(sp.f[[0, 3, 1, 2][d % 4]][0], 0, 0); d++; setTimeout(draw, 650); }
    draw();
    return c;
  }
  function showMenu() {
    var inStory = !!S.run;
    sheet("wl-card", [h("div", { "class": "wl-panel" }, [
      h("h2", { "class": "wl-h", text: "فوانيس الحارة" }),
      h("p", { "class": "wl-k", text: T(inStory ? "الحكاية بتتحفظ لوحدها. لما {ترجع|ترجعي} {هتكمّل|هتكمّلي} من نفس المشهد." : "الحارة {مستنياك|مستنياكي}.") }),
      h("button", { type: "button", "class": "wl-btn", text: "ارجع للحارة", onclick: closeSheet }),
      PREVIEW && MAP.isOpen() ? h("button", { type: "button", "class": "wl-btn ghost", text: "غيّر الوقت · " + (CLOCKS[MAP.time()] || ""), onclick: nextTime }) : null,
      S.done[1] ? h("button", { type: "button", "class": "wl-btn ghost", text: "صفحة يومك", onclick: function () { journal(EPS[1], S.done[1], true); } }) : null,
      h("button", { type: "button", "class": "wl-btn ghost", text: "الشاشة الأولى", onclick: function () { closeSheet(); showTitle(); } })
    ])]);
  }

  /* ---------------- a day ---------------- */
  function begin() {
    audioOn();
    var steps = [];
    if (!S.prefs.noticeSeen) steps.push(notice);
    if (!S.prefs.gender) steps.push(profile);
    (function run(i) { if (i < steps.length) steps[i](function () { run(i + 1); }); else startDay(); })(0);
  }
  var inCut = false;
  function startDay() {
    EP = EPS[1];
    var resume = S.run && S.run.ep === EP.id;
    if (!resume) S.run = { ep: EP.id, node: EP.start, flags: { fem: S.prefs.gender === "f" }, log: [], gifts: [], room: {} };
    S.run.flags.fem = S.prefs.gender === "f";
    save();
    COH.track(resume ? "episode_resume" : "episode_start", { episode: EP.id });
    closeSheet();
    mode("play");
    var first = EP.nodes[S.run.node];
    C.fade(1, 500).then(function () {
      startMap({ time: first.time, loc: first.walkFrom || first.loc || "hara", at: first.at || null, freeTask: null });
      Object.keys(S.run.room || {}).forEach(function (id) { MAP.roomState(id, S.run.room[id]); });
      C.begin(); inCut = true;
      MAP.clock(T(first.clock));
      if (resume) return wait(300);
      audio.music("title");
      return C.card({ k: "اليوم " + ar(EP.day) + " · " + EP.dayLabel, t: EP.title, s: "الحلقة " + ar(EP.id), ms: 3200 });
    }).then(function () { enterNode(S.run.node, false, true); });
  }

  function enterNode(id, arrived, fromStart) {
    var node = EP.nodes[id];
    S.run.node = id; save();
    if (node.walk && !arrived) { walkPhase(id, node, fromStart); return; }
    playNode(id, node, fromStart, arrived);
  }

  // between scenes you walk the hara yourself, with the errand on the card and the lantern over the place
  function walkPhase(id, node, fromStart) {
    var p = Promise.resolve();
    if (fromStart) p = C.fade(0, 600);
    p.then(function () {
      if (inCut) { C.end(); inCut = false; }
      MAP.setTime(node.time);
      MAP.clock(T(node.clock));
      var w = node.walk;
      walking = node;
      prestage(C.loc(), false);
      murmur(w.murmur);
      MAP.objective({ task: T(w.task), goals: [w.to], onReach: function () { walking = null; enterNode(id, true); } });
      if (w.follow) C.follow(w.follow, true);
      announce();
    });
  }
  // while you're on your way, the next scene's people already wait at their places (unless you'd see them pop there)
  var walking = null;
  function prestage(loc, dark) {
    [].concat(walking || []).forEach(function (n) {
      if (!n || !n.cast || (n.loc || "hara") !== loc) return;
      Object.keys(n.cast).forEach(function (k) {
        var c = n.cast[k];
        if (dark) C.stage(k, c[0], c[1], c[2], c[3], c[4], true); else C.prestage(k, c[0], c[1], c[2], c[3], c[4]);
      });
    });
  }
  // what you overhear as you get close to the next scene: a line every few seconds over someone's head
  var murmurT = null;
  function murmur(list) {
    if (murmurT) { clearInterval(murmurT); murmurT = null; }
    if (!list || !list.length) return;
    var i = 0;
    murmurT = setInterval(function () {
      var w = MAP.where(), m = list[i % list.length], a = C.actor(m.who);
      if (!a || inCut || w.loc !== (m.loc || "hara") || Math.hypot(a.x - w.x, a.y - w.y) > 110) return;
      C.says(m.who, T(m.t), 2600); i++;
    }, 3200);
  }
  var announced = {};
  function announce() {
    (EP.quests || []).forEach(function (q, i) {
      if (announced[i] || !cond(q.if) || cond(q.done)) return;
      announced[i] = true;
      setTimeout(function () { MAP.banner("مهمة جديدة", T(q.t), "deed"); audio.chime(); }, 600 + i * 300);
    });
  }
  function quests() {
    if (!S.run || !EP) return [];
    return (EP.quests || []).filter(function (q) { return cond(q.if); }).map(function (q) { return { t: T(q.t), face: q.from, done: cond(q.done) }; });
  }

  function playNode(id, node, fromStart, arrived) {
    MAP.objective(null);
    walking = null; murmur(null);
    var start = Promise.resolve();
    if (!inCut) { C.begin(); inCut = true; }
    if (node.place) S.run.flags["at_" + node.place] = true;
    MAP.clock(T(node.clock));
    // where the scene happens, who is already standing where
    if (fromStart) start = start.then(function () {
      if (node.loc && node.loc !== C.loc()) return C.go(node.loc, node.at || null, { keepDark: true });
    }).then(function () { setup(node, true); return C.fade(0, 700); });
    else if (arrived) start = start.then(function () { return setup(node, false); });
    start.then(function () { return lines(node.lines); }).then(function () {
      if (node.set) Object.assign(S.run.flags, node.set);
      save();
      if (node.choice) return choose(node.choice);
      if (node.give) return giveCard(node.give);
      if (node.end) return endDay();
      enterNode(node.next);
    });
  }
  // a scene's first moment: who stands where. When a saved game resumes mid-scene, also what was left on the stage.
  function setup(node, resumed) {
    if (node.me) C.place("me", node.me[0], node.me[1], node.me[2]);
    if (resumed) Object.keys(node.props || {}).forEach(function (k) { C.prop(k, node.props[k]); });
    // on a resume the screen is dark, so people just stand where they belong; otherwise nobody pops into place
    return Promise.all(Object.keys(node.cast || {}).map(function (k) { var c = node.cast[k]; return C.stage(k, c[0], c[1], c[2], c[3], c[4], resumed); }));
  }

  /* ---------------- the stage directions ---------------- */
  function lines(list) { return (list || []).reduce(function (p, l) { return p.then(function () { return line(l); }); }, Promise.resolve()); }
  function line(l) {
    if (typeof l === "string") return C.say({ t: l });
    if (Array.isArray(l)) return run(l);
    if (l.if && !cond(l.if)) return Promise.resolve();
    if (l.do) return lines(l.do);
    if (l.fx) doFx(l.fx);
    if (l.t) return C.say({ who: l.who, t: l.t, face: l.face, name: l.name });
    return Promise.resolve();
  }
  function doFx(fx) {
    if (fx === "cannon") return run(["cannon"]);
    audio.fx(fx);
    if (fx === "ball" || fx === "kick") COH.haptic("light");
  }
  function tween(key, a, b, ms) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function step() {
        var k = Math.min(1, (performance.now() - t0) / ms);
        C.prop(key, a + (b - a) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
        if (k < 1) requestAnimationFrame(step); else res();
      })();
    });
  }
  function rememberProp(key, v) {
    var loc = C.loc();
    if (!S.run) return;
    S.run.room = S.run.room || {};
    S.run.room[loc] = S.run.room[loc] || {};
    S.run.room[loc][key] = v;
  }
  function run(c) {
    var k = c[0], par = k.slice(-1) === "&", cmd = par ? k.slice(0, -1) : k, p;
    switch (cmd) {
      case "cam": p = C.cam({ on: c[1], zoom: c[2], ms: c[3] }); break;
      case "track": p = C.cam({ on: c[1], zoom: c[2], ms: c[3], track: true }); break;
      case "free": C.free(); break;
      case "walk": p = C.walk(c[1], c[2], c[3], { face: c[4], speed: c[5] }); break;
      case "step": p = C.walk(c[1], c[2], c[3], { rel: true, face: c[4], speed: c[5] }); break;
      case "face": C.face(c[1], c[2]); break;
      case "emote": C.emote(c[1], c[2]); if (c[3]) p = wait(c[3]); break;
      case "jump": C.jump(c[1]); p = wait(c[2] || 120); break;
      case "pose": C.pose(c[1], c[2]); break;
      case "item": C.item(c[1], c[2] || null); if (c[2]) p = wait(c[3] || 500); break;
      case "shiver": C.shiver(c[1], c[2]); break;
      case "wait": p = wait(c[1]); break;
      case "sfx": audio.fx(c[1]); break;
      case "fx": doFx(c[1]); break;
      case "music": audio.music(c[1]); break;
      case "bed": C.bed(c[1]); break;
      case "hush": C.hush(); break;
      case "time": C.time(c[1], c[2]); break;
      case "repop": C.repopulate(); break;
      case "fade": p = C.fade(c[1], c[2]); break;
      case "flash": C.flash(c[1], c[2]); break;
      case "shake": C.shake(c[1], c[2]); break;
      case "burst": C.burst(c[1], c[2], c[3]); break;
      // someone already in view walks to their place; behind a fade, or out of sight, they're simply there
      case "spawn": p = C.stage(c[1], c[2], c[3], c[4], c[5], c[6], C.dark()); break;
      case "gone": C.gone(c[1]); break;
      case "place": C.place(c[1], c[2], c[3], c[4]); break;
      case "clearAt": C.clearAt(c[1][0], c[1][1], c[2]); break;
      case "follow": C.follow(c[1], c[2] !== false); break;
      case "prop": C.prop(c[1], c[2]); rememberProp(c[1], c[2]); break;
      case "tween": p = tween(c[1], c[2], c[3], c[4] || 1000).then(function () { rememberProp(c[1], c[3]); }); break;
      case "count": // pin papers on the board one by one
        p = (function () { var q = Promise.resolve(); for (var i = c[2]; i <= c[3]; i++) (function (n) { q = q.then(function () { C.prop(c[1], n); rememberProp(c[1], n); audio.fx("rustle"); return wait(c[4] || 260); }); })(i); return q; })(); break;
      case "go": p = C.go(c[1], c[2] || null, { keepDark: !!c[3] }); break;
      case "says": C.says(c[1], c[2], c[3]); break;
      case "ball": p = C.ball(c[1], c[2], c[3], c[4], c[5], c[6]); break;
      case "card": p = C.card({ k: T(c[1]), t: T(c[2]), s: T(c[3]), ms: c[4] }); break;
      case "crowd": C.near(c[1], c[2]).forEach(function (a, i) { setTimeout(function () { if (c[3] === "emote") a.emote = { k: c[4], t: 0 }; else if (c[3] === "face") C.face(a.cid || a.cast, c[4]); else if (c[3] === "jump") a.jv = 70; }, i * 90); }); break;
      case "pray": C.each(function (a) { if (c[1] === "end" && a.pray) { a.pray = null; a.prayPose = a.cast === "sheikh" ? null : "jalsa"; if (a.cast === "sheikh") a.dir = 0; } }); if (c[1] === "end") C.pose("me", "jalsa"); break;
      case "cannon":
        audio.fx("cannon"); COH.haptic("heavy");
        C.flash("#FFF2D0", 1100); C.shake(700, 2.2);
        p = wait(900); break;
      case "flag": S.run.flags[c[1]] = c[2] !== false; save(); break; // remember something mid-scene, e.g. for the errands list
      case "fn": p = c[1](C, MAP); break;
    }
    return par || !p ? Promise.resolve() : p;
  }

  /* ---------------- choosing ---------------- */
  function choose(ch) {
    var opts = ch.options.filter(function (o) { return cond(o.if); });
    if (ch.walk) { // choose by walking to one of the places
      return lines(ch.before || []).then(function () {
        C.end(); inCut = false;
        if (ch.follow) C.follow(ch.follow, true);
        walking = opts.map(function (o) { return EP.nodes[o.next]; }); // whichever place you pick, its people are already there
        MAP.objective({ task: T(ch.prompt), key: T("{اختار|اختاري}"), goals: opts.map(function (o) {
          return Object.assign({}, o.walk, { label: T(o.t), pick: function () { walking = null; pickOpt(o, true); } });
        }) });
      });
    }
    return C.ask({ who: ch.who || null, t: ch.prompt, options: opts.map(function (o) { return T(o.t); }) }).then(function (i) { pickOpt(opts[i || 0]); });
  }
  function pickOpt(o, walked) {
    if (o.set) Object.assign(S.run.flags, o.set);
    if (o.log) S.run.log.push(o.log);
    COH.track("choice", { episode: EP.id, node: S.run.node, next: o.next });
    save();
    enterNode(o.next, !!walked);
  }

  /* ---------------- giving: a small card in the world ---------------- */
  var GIFT_ICON = ["📣", "🍞", "🧺", "🗓️", "🌙"];
  function giveCard(g) {
    var opts = g.options;
    return new Promise(function () {
      mode("give");
      var hold = h("p", { "class": "wl-g-hold", text: T("{اضغط|اضغطي} مطوّل على اختيارك عشان {تأكّده|تأكّديه}") });
      var list = h("div", { "class": "wl-g-list" }, opts.map(function (o, i) {
        var b = h("button", { type: "button", "class": "wl-g-opt" + (o.price ? "" : " free") }, [
          h("span", { "class": "wl-g-ic", text: o.icon || GIFT_ICON[i] || "✦", "aria-hidden": "true" }),
          h("span", { "class": "wl-g-t", text: T(o.t) }),
          h("span", { "class": "wl-g-p", text: o.price ? ar(o.price) + " ج" : "ببلاش" })
        ]);
        bindHold(b, function () { give(o, b); }, hold);
        return b;
      }));
      var card = sheet("wl-give", [h("div", { "class": "wl-panel" }, [
        h("p", { "class": "wl-g-k", text: "خير النهارده" }),
        h("h3", { "class": "wl-g-q", text: T(g.prompt) }),
        list, hold,
        h("p", { "class": "wl-g-note", text: "كل جنيه بيروح لحملات EFB في رمضان. وكل اختيار بيساعد، حتى لو ببلاش." })
      ])]);
      var busy = false;
      function give(o, btn) {
        if (busy) return;
        busy = true;
        COH.haptic("heavy");
        function proceed(status) {
          S.run.gifts.push({ key: o.key, price: o.price || 0, status: status, t: o.log || o.t });
          S.run.flags["gave_" + o.key] = true;
          if (o.set) Object.assign(S.run.flags, o.set);
          if (o.log) S.run.log.push(o.log);
          COH.track("give", { episode: EP.id, option: o.key, amount: o.price || 0, status: status });
          save();
          closeSheet(); mode("play");
          if (status === "paid") audio.chime();
          enterNode(o.next);
        }
        if (!o.price) { proceed("free"); return; }
        COH.donate({ episode: EP.id, option: o.key, amount: o.price, currency: "EGP" }).then(function (res) {
          if (res && res.status === "paid") { proceed("paid"); return; }
          busy = false;
          btn.style.setProperty("--p", 0);
          COH.track("give", { episode: EP.id, option: o.key, amount: o.price, status: res ? res.status : "failed" });
          if (res && res.status === "failed") toast(T("الدفع ما اكتملش. {جرّب|جرّبي} تاني."));
          if (!card.isConnected) layer.appendChild(card);
        });
      }
    });
  }
  function bindHold(btn, onDone, hintEl) {
    var raf = 0, start = 0, t0 = 0, done = false, DUR = 700;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / DUR);
      btn.style.setProperty("--p", p);
      if (p >= 1) { done = true; raf = 0; onDone(); return; }
      raf = requestAnimationFrame(tick);
    }
    function begin() { if (raf) return; done = false; start = 0; t0 = Date.now(); raf = requestAnimationFrame(tick); }
    function cancel() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!done) { btn.style.setProperty("--p", 0); if (t0 && Date.now() - t0 < 350 && hintEl) { hintEl.classList.remove("nudge"); void hintEl.offsetWidth; hintEl.classList.add("nudge"); } }
      t0 = 0;
    }
    btn.addEventListener("pointerdown", function (e) { e.preventDefault(); begin(); });
    btn.addEventListener("pointerup", cancel);
    btn.addEventListener("pointerleave", cancel);
    btn.addEventListener("pointercancel", cancel);
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    btn.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); begin(); } });
    btn.addEventListener("keyup", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cancel(); } });
  }

  /* ---------------- the end of a day: its lantern lights up over the hara ---------------- */
  function lanternAt(n) { var t = (n - 0.5) / 30; return [353 + 223 * t, 168 + 28 * t + 80 * t * (1 - t) + 6]; }
  function endDay() {
    var ep = EP, run = S.run, gifts = (run.gifts || []).slice(), log = run.log.slice();
    var total = gifts.reduce(function (a, g) { return a + (g.status === "paid" ? g.price : 0); }, 0);
    S.done[ep.id] = { gifts: gifts, total: total, log: log, at: Date.now() };
    S.after = { ep: ep.id, flags: Object.assign({}, run.flags, ep.after || {}) };
    S.run = null;
    save();
    COH.track("episode_complete", { episode: ep.id, options: gifts.map(function (g) { return g.key; }), total: total });
    var L = lanternAt(ep.day);
    return C.fade(1, 900).then(function () {
      return C.go("hara", [300, 340, 1], { keepDark: true });
    }).then(function () {
      C.time("night", true); C.repopulate();
      C.cam({ on: [L[0], L[1] + 20], zoom: 1.3, ms: 0 });
      return C.fade(0, 1200);
    }).then(function () { return C.cam({ on: [L[0], L[1] + 4], zoom: 2.4, ms: 2600 }); }).then(function () {
      audio.chime(); C.burst("twinkle", L, 14); C.burst("confetti", L, 10);
      setTimeout(function () { audio.music("end"); }, 600);
      return C.card({ k: "اليوم " + ar(ep.day), t: ep.endTitle, ms: 3400 });
    }).then(function () { journal(ep, S.done[ep.id], false); });
  }
  function journal(ep, rec, fromMenu) {
    var gifts = rec.gifts || [], total = rec.total || 0, free = total === 0;
    var recap = h("ol", { "class": "wl-recap" }, (rec.log || []).map(function (l) { return h("li", { text: T(l) }); }));
    var giftList = h("ul", { "class": "wl-gifts" }, gifts.map(function (g) { return h("li", null, [T(g.t), " · ", h("b", { text: g.price && g.status === "paid" ? ar(g.price) + " جنيه" : "ببلاش" })]); }));
    var giftCard = h("div", { "class": "wl-gift" }, [
      h("p", { "class": "wl-gift-main", text: free ? T("{اخترت|اخترتي} تنادي الحارة، مرتين.") : "تبرعاتك النهارده: " + ar(total) + " جنيه" }),
      h("p", { "class": "wl-gift-sub", text: free ? T("الدالّ على الخير كفاعله. {ابعت|ابعتي} الحكاية لحد يكمّلها.") : T("راحت لحملات EFB في رمضان. الرقم ده بيظهر {ليك انت|ليكي انتي} بس، ومش بيظهر في المشاركة.") }),
      giftList
    ]);
    var share = h("button", { type: "button", "class": "wl-btn" + (free ? "" : " ghost"), text: "شارك الحكاية", onclick: function () { COH.track("share", { episode: ep.id }); COH.share({ episode: ep.id, title: "فوانيس الحارة", text: ep.shareText }); } });
    var next = ep.next ? h("div", { "class": "wl-next" }, [
      ep.next.face ? h("img", { src: "assets/faces/" + ep.next.face + ".webp", alt: "" }) : null,
      h("div", null, [h("p", { "class": "wl-next-k", text: "بكرة · الحلقة " + ar(ep.next.id) }), h("p", { "class": "wl-next-t", text: ep.next.title }), h("p", { "class": "wl-next-b", text: ep.next.teaser })])
    ]) : null;
    sheet("wl-journal", [h("div", { "class": "wl-panel" }, [
      h("p", { "class": "wl-j-k", text: "صفحة اليوم " + ar(ep.day) }),
      h("h2", { "class": "wl-h", text: ep.endTitle }),
      h("p", { "class": "wl-j-sec", text: "حكايتك النهارده" }), recap,
      giftCard, share,
      h("p", { "class": "wl-counter" }, ["الليلة في الحارة: ", h("b", { text: ar(SAMPLE_COUNTER) }), " جار اتساعدوا ", h("span", { text: "(رقم تجريبي)" })]),
      next,
      h("button", { type: "button", "class": "wl-btn", text: fromMenu ? "ارجع للحارة" : "امشي في الحارة بالليل", onclick: function () { if (fromMenu) closeSheet(); else freeRoam(false); } }),
      h("button", { type: "button", "class": "wl-btn ghost", text: T("{العب|العبي} اليوم تاني باختيارات تانية"), onclick: function () { S.run = null; save(); closeSheet(); begin(); } })
    ])]);
  }
  // after the story, the hara at night is yours: walk, talk, go into places, find the secrets
  function freeRoam(fromTitle) {
    closeSheet(); mode("play");
    EP = EPS[1];
    var go = function () {
      if (fromTitle) startMap({ time: "night", loc: "hara", at: [300, 330, 0], freeTask: "الحارة بالليل. {اتمشى|اتمشي} {وسلّم|وسلّمي} على الجيران {وادخل|وادخلي} الأماكن.", hint: true });
      else { if (inCut) { C.end(); inCut = false; } MAP.objective(null); MAP.start({ day: EP.day, fem: S.prefs.gender === "f", name: S.prefs.name, fmt: T, cond: cond, flags: flags, quests: quests, time: "night", loc: "hara", at: MAP.where().loc === "hara" ? [MAP.where().x, MAP.where().y, 0] : [300, 330, 0], freeTask: "الحارة بالليل. {اتمشى|اتمشي} {وسلّم|وسلّمي} على الجيران {وادخل|وادخلي} الأماكن.", hint: true }); }
      MAP.clock("بالليل");
    };
    if (fromTitle) C.fade(1, 400).then(function () { go(); return C.fade(0, 700); });
    else go();
  }

  // a preview of a day: walk the hara at that day and hour, with its new places, keys and errands
  function preview() {
    closeSheet(); mode("play");
    EP = EPS[1];
    if (!S.prefs.gender) { profile(preview); return; }
    var t = URL_TIME || "asr";
    C.fade(1, 400).then(function () {
      startMap({ day: URL_DAY || 1, time: t, loc: "hara", at: t === "asr" || t === "pre" ? [268, 300, 0] : [300, 330, 0], freeTask: "يوم " + ar(URL_DAY || 1) + " رمضان. {اتمشى|اتمشي} في الحارة {ودوّر|ودوّري} على الخبايا.", hint: true });
      MAP.clock(CLOCKS[t]);
      return C.fade(0, 700);
    });
  }
  // in a preview, the menu can move the clock
  function nextTime() {
    var order = ["asr", "pre", "maghrib", "night", "suhoor"], t = order[(order.indexOf(MAP.time()) + 1) % order.length];
    closeSheet();
    C.fade(1, 300).then(function () { MAP.setTime(t, true); MAP.clock(CLOCKS[t]); return C.fade(0, 500); });
  }
  // a suhoor night: the hara awake at half past two, Sayed's tent lit up, the musaharati on his round
  function suhoorNight() {
    closeSheet(); mode("play");
    EP = EPS[1];
    C.fade(1, 400).then(function () {
      startMap({ time: "suhoor", loc: "hara", at: [104, 540, 2], freeTask: "ليلة سحور! الحارة صاحية لحد الفجر. {اتمشى|اتمشي} {وادخل|وادخلي} الخيمة.", hint: true });
      MAP.clock("السحور · ٢:٣٠");
      MAP.objective({ task: T("خيمة عم سيد منوّرة! {ادخل|ادخلي} {واتفرج|واتفرجي} على التنورة"), goals: [{ enter: "tent", label: "خيمة عم سيد" }], onReach: function () { MAP.objective(null); } });
      return C.fade(0, 700);
    });
  }

  /* ---------------- outside COH: pretend payment and sharing ---------------- */
  COH.mock.donate = function (o) {
    return new Promise(function (resolve) {
      var prev = Array.prototype.slice.call(layer.childNodes);
      var box = h("div", { "class": "wl-pay", role: "dialog", "aria-modal": "true", "aria-label": "تأكيد التبرع" });
      function close(st) { box.remove(); resolve({ status: st }); }
      box.appendChild(h("div", { "class": "wl-panel" }, [
        h("p", { "class": "wl-g-k", text: "COH · تجربة" }),
        h("h3", { "class": "wl-g-q", text: "تبرع " + ar(o.amount) + " جنيه" }),
        h("p", { "class": "wl-fine", text: "دي شاشة تجريبية. جوّه COH هتظهر شاشة الدفع الحقيقية." }),
        h("button", { type: "button", "class": "wl-btn", text: "ادفع " + ar(o.amount) + " جنيه", onclick: function () { close("paid"); } }),
        h("button", { type: "button", "class": "wl-btn ghost", text: "إلغاء", onclick: function () { close("cancelled"); } })
      ]));
      layer.appendChild(box);
      void prev;
    });
  };
  COH.mock.share = function () { toast("في COH هيفتح المشاركة. هنا: اتسجّل إنك {شاركت}".replace("{شاركت}", T("{شاركت|شاركتي}"))); return Promise.resolve({ status: "shared" }); };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !layer.hidden && app.getAttribute("data-mode") !== "give" && app.getAttribute("data-mode") !== "title") closeSheet();
  });

  showTitle();
  H.world.director = { S: S, enterNode: function (id) { enterNode(id); }, flags: flags }; // for checking from the console
})();
