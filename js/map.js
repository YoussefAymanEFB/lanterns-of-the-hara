/* فوانيس الحارة · the world (walk.html).
   The hara in three-quarter pixel art (js/hara-art.js, js/hara-props.js, js/hara-world.js) and the rooms you can
   walk into (js/hara-rooms.js). Tap to walk, tap people to talk, tap a door to go in. Every place has its own ground,
   sound and light; neighbours keep their routines; food places are quiet while people fast and packed at iftar;
   the hara changes with the days of Ramadan (?day=N previews a day); secrets wait to be found.
   The story plays here too, as scenes (H.map.cut): people walk, turn and react, the camera moves in close, and the
   words come in a dialogue box with the speaker's portrait. js/world.js directs it. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world;
  if (!A || !WD) return;

  var SPEED = 60;                       // art pixels per second
  if (/[?&]fast\b/.test(location.search)) SPEED *= 6;
  var TURBO = /[?&]turbo/.test(location.search); // testing in a background tab: big steps, real time
  var URL_DAY = (function () { var m = /[?&]day=(\d+)/.exec(location.search); return m ? Math.max(1, Math.min(30, +m[1])) : 0; })();
  var REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var CELL = 4, GROUND_TOP = 150, LS = 2;

  // the light over the hara at each time of day
  var TIMES = {
    asr: { amb: [255, 247, 234], on: 0, glow: 0.08, flecks: 1 },
    pre: { amb: [255, 214, 170], on: 0.3, glow: 0.3, long: 1, motes: 1, rays: 1, flecks: 1 },
    maghrib: { amb: [188, 136, 176], on: 1, glow: 0.75 },
    night: { amb: [80, 86, 156], on: 1, glow: 0.9, moths: 1 },
    // two or three in the morning, before fajr: the deepest blue of the night, every lamp in the hara still on
    suhoor: { amb: [62, 70, 146], on: 1, glow: 1, moths: 1 }
  };
  var CLOUD = { asr: ["#FFFFFF", "#E2ECF4"], pre: ["#FFE9C8", "#F2C49A"], maghrib: ["#F2A0A0", "#B86A8A"], night: ["#3A3E74", "#2A2C5A"], suhoor: ["#2C3068", "#20224E"] };
  var DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function ar(n) { return String(n).replace(/\d/g, function (d) { return DIGITS[d]; }); }

  /* ---------------- state ---------------- */
  var G = null, W = 576, HG = 912;
  var stage, root, view, cvs, ctx, lightC, lctx, glowC, gctx, ui;
  var taskEl, taskK, taskT, dayEl, goBtn, qBtn, qList, arrow, choiceBox, hint, dlg, dlgImg, dlgName, dlgText, placeEl, placeName, placeSub;
  var dpr = 1, K = 3, cssW = 1, cssH = 1, viewW = 1, viewH = 1;
  var cam = { x: 0, y: 600 }, camFree = false, intro = null, ptr = null;
  var O = null, isOpen = false, raf = 0, lastT = 0, T = 0;
  var time = "asr", TM = TIMES.asr, lightsOn = 0, amb = TIMES.asr.amb.slice();
  var day = 1, dayBuilt = 0, skyKey = "";
  var sky = null, skyOld = null, skyFade = 1;
  var grid, GW, GH;
  var props = [], canopies = [], statics = [], strings = [], lights = [], looks = [], emitters = [], dapples = [];
  var player = null, actors = [], cats = [], pigeons = [], coopBirds = [], parts = [], clouds = [], skyBirds = [], ball = null, rings = [], kites = [];
  var talk = null, sprites = {}, propSprites = {}, pigeonSprCache = {}, fontsReady = false, lastFlap = -9;
  var skyMask = null, shadowImg, ballImg, heartImg, markerImg, bubbles = {}, catSprites = {}, pigeonSpr, zImg, noteImg;
  var place = null, placeCand = null, placeT = 0, bannerQ = [], bannerTimer = 0, bannerSeen = {};
  var memories = load("hara.memories") || {}, deeds = load("hara.deeds") || {};
  var HARA = null, LOC = "hara", RM = null, roomState = {}, groundTop = GROUND_TOP;   // the hara, or the room you're in
  var baseK = 3, zoom = 1, zoomGoal = 1, shot = null, liftNow = 0, shakeT = 0, shakeAmp = 0; // the camera of the scenes
  var OB = null, cutOn = false, autoGo = false, busy = false, clockTxt = "", lastClose = 0;
  var dlgOpts, dlgP, bars, fadeEl, flashEl, cardEl, cardK, cardT, cardS, clockEl;
  var itemImg = {}, busts = {}, says = [], pray = { t: 0, ph: "qiyam", last: -1 };
  var track = null, deedGo = null, hl = null, starImg = null; // the small deed you asked to see, a highlight on what you tapped
  var AMB_IN = { asr: [246, 238, 224], pre: [248, 220, 190], maghrib: [164, 136, 160], night: [122, 112, 152], suhoor: [116, 106, 150] };
  var ON_IN = { asr: 0.35, pre: 0.5, maghrib: 1, night: 1, suhoor: 1 };
  var NAMES = { mama: "ماما", sheikh: "الشيخ عبد الله", abuyasser: "أبو ياسر", sayed: "عم سيد", kebabgi: "الكبابجي", bashir: "عم بشير", sobhy: "صبحي", mesa: "عم زينهم المسحراتي",
    hassan: "عم حسن", saber: "عم صابر", hamo: "حمو", tayyar: "مصطفى الطيار", nemat: "الحاجة نعمات", youssef: "يوسف", nourah: "نورة", omyoussef: "أم يوسف", rizq: "المعلم رزق", m3: "أستاذ عادل", zaki: "عم زكي" };
  var FACES = { mama: "mama", hassan: "hassan", saber: "saber", nemat: "nemat", youssef: "youssef", nourah: "nourah", omyoussef: "omyoussef", rizq: "rizq" };

  /* ---------------- small helpers ---------------- */
  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function hyp(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function fmt(t) { return O && O.fmt ? O.fmt(t) : String(t).replace(/\{([^|}]*)\|[^}]*\}/g, "$1"); }
  function cond(c) { return O && O.cond ? O.cond(c) : !c; }
  function flags() { return O && O.flags ? O.flags() : {}; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // Suhoor is the end of the night: anything set for "night" is still there then, unless it says hideAt: ["suhoor"].
  // Something only for suhoor says times: ["suhoor"] (or when: "suhoor" for a line), and comes first in its list.
  function dark() { return time === "night" || time === "suhoor"; }
  function isNow(w) { return w === time || (w === "night" && time === "suhoor"); }
  function timeOk(o) {
    if (o.hideAt && o.hideAt.indexOf(time) >= 0) return false;
    return !o.times || o.times.some(isNow);
  }
  function setOf(by) { return by[time] != null ? by[time] : time === "suhoor" && by.night != null ? by.night : 0; }
  function doorNow(d) { return !d.when || d.when.indexOf(time) >= 0; }
  function pickLine(list) {
    for (var i = 0; i < (list || []).length; i++) {
      var e = list[i];
      if (e.when && !isNow(e.when)) continue;
      if (e.minDay && day < e.minDay) continue;
      if (e.if && !cond(e.if)) continue;
      return e;
    }
    return null;
  }
  function audio() { return H.audio || null; }
  function sfx(name) { var a = audio(); if (a) a.fx(name); }
  function spr(id) {
    if (sprites[id]) return sprites[id];
    var base = id.replace(/\+l$/, ""), spec = WD.CAST[base];
    if (id !== base) spec = Object.assign({}, spec, { lantern: A.GLASS[base === "nourah" ? 4 : 0] });
    return (sprites[id] = A.person(spec));
  }
  function propSprite(p, variant) {
    var key = p.k + "|" + JSON.stringify(p.o || {}) + "|" + (variant || "");
    if (!propSprites[key]) {
      var o = Object.assign({}, p.o || {});
      if (variant === "sway-1") o.sway = -1;
      if (variant === "sway1") o.sway = 1;
      if (p.k === "iftarTable") { o.set = variant === "set" || variant === "diners"; o.noChairs = variant === "diners"; }
      if (variant && variant.charAt(0) === "#") o.set = +variant.slice(1);
      propSprites[key] = A.prop(p.k, o);
    }
    return propSprites[key];
  }
  function propTop(p, sp) { return p.y - (p.z || 0) - sp.height + 3; }
  function houseBy(flag) { return G.houses.filter(function (b) { return b[flag]; })[0]; }

  /* ---------------- the path grid ---------------- */
  function makeGrid() {
    GW = Math.ceil(W / CELL); GH = Math.ceil(HG / CELL);
    grid = new Uint8Array(GW * GH);
    function fill(r, v) {
      for (var cy = Math.floor(r[1] / CELL); cy <= Math.floor((r[1] + r[3] - 1) / CELL); cy++)
        for (var cx = Math.floor(r[0] / CELL); cx <= Math.floor((r[0] + r[2] - 1) / CELL); cx++) {
          if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
          grid[cy * GW + cx] = v;
        }
    }
    G.walk.forEach(function (w) { var r = Array.isArray(w) ? w : (WD.inDays(w.days, day) ? w.r : null); if (r) fill(r, 1); });
    props.forEach(function (p) {
      if (!p.block || p.canopy) return;
      var sp = propSprite(p), bw = p.block[0], bh = p.block[1];
      fill([p.x + (sp.width - bw) / 2, p.y - bh, bw, bh + 1], 0);
    });
    gScore = null;
  }
  function walkable(x, y) {
    var cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    return cx >= 0 && cy >= 0 && cx < GW && cy < GH && grid[cy * GW + cx] === 1;
  }
  function nearestCell(x, y, maxR) {
    var cx = clamp(Math.floor(x / CELL), 0, GW - 1), cy = clamp(Math.floor(y / CELL), 0, GH - 1);
    if (grid[cy * GW + cx]) return cy * GW + cx;
    for (var r = 1; r <= (maxR || 30); r++) {
      var best = -1, bd = 1e9;
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        var nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || !grid[ny * GW + nx]) continue;
        var d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = ny * GW + nx; }
      }
      if (best >= 0) return best;
    }
    return -1;
  }
  function cellPos(c) { return [(c % GW) * CELL + CELL / 2, ((c / GW) | 0) * CELL + CELL / 2]; }
  function snap(a) { if (!walkable(a.x, a.y)) { var c = nearestCell(a.x, a.y, 14); if (c >= 0) { var cp = cellPos(c); a.x = cp[0]; a.y = cp[1]; } } }
  var gScore, came, closed;
  function findPath(sx, sy, tx, ty) {
    var s = nearestCell(sx, sy, 8), t = nearestCell(tx, ty, 30);
    if (s < 0 || t < 0) return null;
    var N = GW * GH;
    if (!gScore) { gScore = new Float32Array(N); came = new Int32Array(N); closed = new Uint8Array(N); }
    gScore.fill(1e9); closed.fill(0);
    var tcx = t % GW, tcy = (t / GW) | 0;
    function hfn(i) { var dx = Math.abs(i % GW - tcx), dy = Math.abs(((i / GW) | 0) - tcy); return (dx + dy) - 0.586 * Math.min(dx, dy); }
    var heap = [];
    function push(f, i) { heap.push([f, i]); var k = heap.length - 1; while (k > 0) { var p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; var tmp = heap[p]; heap[p] = heap[k]; heap[k] = tmp; k = p; } }
    function pop() {
      var top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (var k = 0; ;) { var l = 2 * k + 1, r = l + 1, m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; var tmp = heap[m]; heap[m] = heap[k]; heap[k] = tmp; k = m; }
      }
      return top;
    }
    gScore[s] = 0; came[s] = -1; push(hfn(s), s);
    var DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], found = false, guard = 0;
    while (heap.length && guard++ < 80000) {
      var cur = pop()[1];
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === t) { found = true; break; }
      var cx = cur % GW, cy = (cur / GW) | 0;
      for (var d = 0; d < 8; d++) {
        var nx = cx + DX[d], ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        var ni = ny * GW + nx;
        if (!grid[ni] || closed[ni]) continue;
        if (d >= 4 && (!grid[cy * GW + nx] || !grid[ny * GW + cx])) continue;
        var ng = gScore[cur] + (d >= 4 ? 1.414 : 1);
        if (ng < gScore[ni]) { gScore[ni] = ng; came[ni] = cur; push(ng + hfn(ni), ni); }
      }
    }
    if (!found) return null;
    var cells = [];
    for (var c = t; c !== -1; c = came[c]) cells.push(c);
    cells.reverse();
    var pts = cells.map(cellPos);
    if (walkable(tx, ty)) pts[pts.length - 1] = [tx, ty];
    var out = [], at = [sx, sy], i0 = -1;
    while (i0 < pts.length - 1) {
      var j = pts.length - 1;
      while (j > i0 + 1 && !sight(at[0], at[1], pts[j][0], pts[j][1])) j--;
      out.push(pts[j]); at = pts[j]; i0 = j;
    }
    return out;
  }
  function sight(x0, y0, x1, y1) {
    var d = hyp(x0, y0, x1, y1), n = Math.ceil(d / 2);
    for (var i = 1; i < n; i++) {
      var x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      if (!walkable(x, y) || !walkable(x - 2, y) || !walkable(x + 2, y)) return false;
    }
    return true;
  }

  /* ---------------- building the scene once ---------------- */
  function build() {
    HARA = WD.build(); HARA.id = "hara"; G = HARA; W = G.W; HG = G.HGT;
    root = el("div", "map");
    view = el("div", "mp-view", root);
    cvs = el("canvas", "mp-cv", view); ctx = cvs.getContext("2d", { alpha: false });
    lightC = el("canvas", "mp-light", view); lctx = lightC.getContext("2d");
    glowC = el("canvas", "mp-glow", view); gctx = glowC.getContext("2d");
    [cvs, lightC, glowC].forEach(function (c) { c.setAttribute("aria-hidden", "true"); });
    ui = el("div", "mp-ui", root);

    taskEl = el("div", "mp-task", ui);
    dayEl = el("span", "mp-day", taskEl);
    clockEl = el("span", "mp-clock", taskEl);
    var tx = el("div", "mp-task-tx", taskEl);
    taskK = el("span", "mp-task-k", tx); taskT = el("p", "mp-task-t", tx);
    var acts = el("div", "mp-task-acts", taskEl);
    goBtn = el("button", "mp-go", acts); goBtn.type = "button"; goBtn.textContent = "يلا";
    goBtn.addEventListener("click", function (e) { e.stopPropagation(); qOpen(false); goTarget(); });
    qBtn = el("button", "mp-qbtn", acts); qBtn.type = "button";
    qBtn.addEventListener("click", function (e) { e.stopPropagation(); qOpen(qList.hidden); });
    qList = el("ul", "mp-qlist", ui); qList.hidden = true; qList.id = "mp-qlist";
    qBtn.setAttribute("aria-controls", "mp-qlist");
    var placeWrap = el("div", "mp-place-wrap", ui); placeWrap.setAttribute("aria-live", "polite");
    placeEl = el("div", "mp-place", placeWrap);
    placeName = el("b", "", placeEl); placeSub = el("span", "", placeEl);
    arrow = el("button", "mp-arrow", ui); arrow.type = "button"; arrow.setAttribute("aria-label", "روح للمهمة");
    var ai = el("span", "mp-arrow-i", arrow);
    ai.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L20 15 H14.5 V21 H9.5 V15 H4 Z" fill="#3A2418"/></svg>'; // constant markup
    arrow.addEventListener("click", function (e) { e.stopPropagation(); var td = track && deedById(track); if (td) goDeed(td); else goTarget(); });
    choiceBox = el("div", "mp-choices", ui);
    hint = el("p", "mp-hint", ui); hint.textContent = "اضغط على أي حتة عشان تمشي، أو على حد عشان تكلّمه. في الحارة خبايا مستخبية ✦";
    // the dialogue box: the words, and the speaker's portrait in its own frame with the name under it
    dlg = el("div", "mp-dlg", ui); dlg.hidden = true; dlg.setAttribute("aria-live", "polite");
    var body = el("div", "mp-dlg-b", dlg);
    dlgText = el("p", "mp-dlg-t", body); dlgOpts = el("div", "mp-dlg-o", body); dlgOpts.hidden = true; el("i", "mp-dlg-more", body);
    dlgP = el("div", "mp-dlg-p", dlg);
    var face = el("div", "mp-dlg-f", dlgP); dlgImg = el("img", "", face); dlgImg.alt = "";
    dlgName = el("b", "mp-dlg-n", dlgP);
    dlg.addEventListener("click", function (e) { e.stopPropagation(); advanceTalk(); });
    // the frame of a scene: black bars, a fade to black, a flash, and the big title card
    bars = el("div", "mp-bars"); el("i", "", bars); el("i", "", bars); root.insertBefore(bars, ui);
    flashEl = el("div", "mp-flash"); root.insertBefore(flashEl, ui);
    fadeEl = el("div", "mp-fade", root);
    cardEl = el("div", "mp-card", root); cardK = el("p", "mp-card-k", cardEl); cardT = el("h2", "mp-card-t", cardEl); cardS = el("p", "mp-card-s", cardEl);

    view.addEventListener("pointerdown", function (e) {
      if (!isOpen) return;
      ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    });
    view.addEventListener("pointermove", function (e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
      if (!ptr.moved && Math.hypot(dx, dy) > 10) { ptr.moved = true; camFree = true; intro = null; }
      if (ptr.moved) { cam.x = ptr.cx - dx * dpr / K; cam.y = ptr.cy - dy * dpr / K; clampCam(); }
    });
    view.addEventListener("pointerup", function (e) { if (!ptr || e.pointerId !== ptr.id) return; var p = ptr; ptr = null; if (!p.moved) tap(e); });
    view.addEventListener("pointercancel", function () { ptr = null; });
    window.addEventListener("resize", function () { if (isOpen) measure(); });
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('700 20px "Aref Ruqaa"'), document.fonts.load('600 16px "IBM Plex Sans Arabic"')]).then(function () { fontsReady = true; }, function () { fontsReady = true; });
    } else fontsReady = true;

    shadowImg = (function () { var c = A.cv(14, 5), P = A.Pt(c); P.el(0, 0, 14, 5, "rgba(40,22,46,0.32)"); return c; })();
    ballImg = A.ball(); heartImg = A.heart(); markerImg = A.marker(); pigeonSpr = A.pigeon();
    ["!", "?", "♥", "…", "♪"].forEach(function (k) { bubbles[k] = A.bubble(k); });
    function bubble2(rows, pal) { var c = A.bubble("…"), P = A.Pt(c); P.r(1, 1, 11, 7, "#FFF8EA"); P.map(4, 2, rows, pal); return c; }
    bubbles.sweat = bubble2([".....", "..b..", ".bbb.", "bbBbb", ".bbb."], { b: "#5AA8E8", B: "#D8F0FF" });
    bubbles.angry = bubble2(["rr.rr", "r...r", ".....", "r...r", "rr.rr"], { r: "#E8503F" });
    bubbles.spark = bubble2(["..y..", ".yYy.", "yYYYy", ".yYy.", "..y.."], { y: "#F2B23E", Y: "#FFE7A0" });
    bubbles.sad = bubble2(["b...b", ".....", ".bbb.", "b...b", "....."], { b: "#3E78C2" });
    bubbles.zz = bubble2(["zzz..", "..z..", ".zzzz", "...z.", "..zzz"], { z: "#6A5A9A" });
    // things people hold up when they get them
    itemImg.basket = A.sprite(13, 11, function (P) { P.r(3, 1, 7, 1, "#8A6238"); P.r(2, 2, 1, 3, "#8A6238"); P.r(10, 2, 1, 3, "#8A6238"); P.r(1, 4, 11, 5, "#B98A55"); P.r(1, 4, 11, 1, "#D9AA70"); P.r(2, 6, 9, 1, "#8A6238"); P.r(4, 3, 3, 2, "#F4EFE4"); });
    itemImg.bread = A.sprite(14, 8, function (P) { P.el(1, 2, 7, 5, "#D9A25E"); P.el(6, 1, 7, 5, "#E0AE6A"); P.r(8, 2, 3, 1, "#F0C888"); P.r(3, 3, 2, 1, "#F0C888"); });
    itemImg.date = A.sprite(11, 8, function (P) { P.el(1, 3, 9, 4, "#F4EFE4"); P.el(3, 1, 5, 4, "#7A3A20"); P.p(4, 2, "#B86A3A"); });
    itemImg.juice = A.sprite(11, 10, function (P) { P.r(1, 2, 4, 7, "#E8E2D6"); P.r(1, 4, 4, 5, "#C8343A"); P.r(6, 2, 4, 7, "#E8E2D6"); P.r(6, 4, 4, 5, "#E8A040"); });
    itemImg.plane = A.sprite(14, 8, function (P) { P.r(1, 3, 12, 3, "#B98A55"); P.r(1, 3, 12, 1, "#D9AA70"); P.r(3, 1, 3, 2, "#8A5A3A"); P.r(8, 2, 1, 4, "#B8C0C8"); });
    itemImg.coins = A.sprite(12, 8, function (P) { P.el(1, 3, 5, 4, "#C8963E"); P.el(5, 2, 5, 4, "#F2C76C"); P.el(3, 1, 5, 4, "#FFE08A"); });
    itemImg.plate = A.sprite(14, 9, function (P) { P.el(1, 3, 12, 5, "#F4EFE4"); P.el(3, 2, 8, 4, "#C8A060"); P.r(5, 2, 4, 1, "#E8503F"); P.p(7, 1, "#6EBE58"); });
    itemImg.lantern = A.sprite(9, 13, function (P) { P.r(4, 1, 1, 2, "#8A6224"); P.r(2, 3, 5, 1, "#C8963E"); P.r(2, 4, 5, 5, "#FFD25A"); P.r(3, 5, 1, 3, "#FFF0B0"); P.r(2, 9, 5, 1, "#C8963E"); P.r(4, 10, 1, 1, "#8A6224"); });
    itemImg.kunafa = A.sprite(14, 10, function (P) { P.r(1, 5, 12, 4, "#E8DCC0"); P.r(1, 5, 12, 1, "#F6EEDA"); P.r(1, 8, 12, 1, "#C8B898"); P.el(2, 1, 10, 6, "#E8B860"); P.r(4, 2, 2, 1, "#F6D890"); P.r(7, 3, 3, 1, "#F6D890"); P.p(5, 4, "#C8903A"); P.p(9, 2, "#C8903A"); P.p(3, 3, "#C8903A"); });
    itemImg.note = A.sprite(10, 9, function (P) { P.r(1, 2, 8, 6, "#F4EFE4"); P.r(2, 4, 5, 1, "#8A8478"); P.r(2, 6, 4, 1, "#8A8478"); P.p(5, 1, "#E8503F"); });
    ["ginger", "grey", "calico", "black"].forEach(function (k) { catSprites[k] = A.cat(k); });
    itemImg.ball = ballImg;
    itemImg.can = A.sprite(15, 11, function (P) { P.r(3, 3, 8, 7, "#4F97E8"); P.r(3, 3, 8, 1, "#9ACCF4"); P.r(9, 4, 2, 6, "#3A78C0"); P.r(11, 4, 2, 1, "#4F97E8"); P.r(12, 3, 2, 1, "#4F97E8"); P.r(13, 2, 1, 2, "#3A78C0"); P.r(4, 1, 6, 1, "#3A78C0"); P.p(3, 2, "#3A78C0"); P.p(10, 2, "#3A78C0"); P.p(5, 5, "#BFE0FA"); });
    // carried high at suhoor: the tea boy's brass tray, the cotton-candy pole, the bakery boy's bread board
    itemImg.tea = A.sprite(15, 8, function (P) { P.r(1, 5, 13, 2, "#C8963E"); P.r(1, 5, 13, 1, "#F2C76C"); [2, 6, 10].forEach(function (x) { P.r(x, 1, 3, 4, "#E8F2F4"); P.r(x, 2, 3, 3, "#B8452A"); P.p(x, 1, "#FFFFFF"); }); });
    itemImg.candy = A.sprite(15, 16, function (P) { P.r(7, 9, 1, 7, "#C9A46A"); [[2, 1], [8, 0], [4, 5], [10, 5], [6, 2]].forEach(function (c, i) { P.el(c[0], c[1], 6, 6, i % 2 ? "#F7A8C8" : "#F48AB8"); P.p(c[0] + 2, c[1] + 1, "#FFE0EE"); }); });
    itemImg.breadBoard = A.sprite(18, 7, function (P) { P.r(0, 4, 18, 2, "#9C6542"); P.r(0, 4, 18, 1, "#BA8155"); [1, 6, 11].forEach(function (x, i) { P.el(x, 1 + (i % 2), 6, 3, "#D9A25E"); P.p(x + 2, 1 + (i % 2), "#EFC88A"); }); });
    itemImg.cup = A.sprite(9, 10, function (P) { P.r(1, 2, 7, 7, "#C8963E"); P.r(1, 2, 7, 1, "#F2C76C"); P.r(6, 3, 2, 6, "#8A6224"); P.r(2, 1, 5, 1, "#9AD0F0"); P.p(3, 4, "#FFE08A"); });
    starImg = A.sprite(11, 11, function (P) { P.r(5, 0, 1, 11, "#FFD25A"); P.r(0, 5, 11, 1, "#FFD25A"); P.r(4, 2, 3, 7, "#FFE08A"); P.r(2, 4, 7, 3, "#FFE08A"); P.r(4, 4, 3, 3, "#FFF6D0"); P.p(5, 5, "#FFFFFF"); });
    zImg = (function () { var c = A.cv(4, 4); A.Pt(c).map(0, 0, ["zzzz", "..z.", ".z..", "zzzz"], { z: "#F4F0FF" }); return c; })();
    noteImg = (function () { var c = A.cv(4, 6); A.Pt(c).map(0, 0, [".nnn", ".n.n", ".n.n", "nn.n", "nnnn", "nn.."], { n: "#FFE7A0" }); return c; })();
    for (var i = 0; i < 6; i++) clouds.push({ x: rnd(-40, W), y: rnd(8, 58), s: rnd(1.5, 3.5), w: rnd(26, 48) | 0 });
    player = { id: "player", sp: null, x: 133, y: 676, dir: 0, frame: 0, dist: 0, speed: SPEED, kind: "player" };
  }

  // Everything that depends on the day: open shops, the garden, the lantern of the days.
  function setDay(d) {
    day = d;
    if (dayBuilt === d) return;
    dayBuilt = d;
    HARA.houses.forEach(function (b) { b.setDay(d); });
    if (RM) loadLoc(RM.id, true); else rebuild();
  }
  var builtFor = "";
  function rebuild() {
    builtFor = time === "suhoor" ? "suhoor" : "";
    props = G.props.filter(function (p) { return WD.inDays(p.days, day) && timeOk(p); });
    canopies = props.filter(function (p) { return p.canopy; });
    emitters = []; coopBirds = [];
    makeGrid();
    makeStatics();
    makeSkyMask();
    makeStrings();
    makeLights();
    makeLooks();
    makeDapples();
  }
  // The hara, or one of the rooms (js/hara-rooms.js). A room remembers what happened in it (the board, the lamp).
  function loadLoc(id, keepPeople) {
    if (id === "hara" || !H.rooms || !H.rooms.has(id)) { G = HARA; RM = null; LOC = "hara"; }
    else {
      RM = H.rooms.build(id, day); LOC = id; G = RM;
      var key = id + "|" + (id === "workshop" && day >= WD.DAYS.workshopOpen ? "open" : "");
      if (roomState[key]) RM.st = roomState[key]; else roomState[key] = RM.st;
      RM.houses = RM.houses || []; RM.strings = RM.strings || []; RM.exits = RM.exits || [];
    }
    W = G.W; HG = G.HGT; groundTop = RM ? 0 : GROUND_TOP;
    rebuild();
    if (!keepPeople) populate();
    parts = []; rings = []; says = [];
  }

  function makeSkyMask() {
    if (RM) { skyMask = null; return; }
    // where the sky shows between the rooftops: it keeps its painted colours at every hour
    skyMask = A.cv(W, GROUND_TOP);
    var sg = skyMask.getContext("2d");
    sg.fillStyle = "#FFFFFF"; sg.fillRect(0, 0, W, GROUND_TOP);
    sg.globalCompositeOperation = "destination-out";
    G.houses.concat([G.mosque, G.minaret]).forEach(function (b) { if (b.y < GROUND_TOP) sg.drawImage(b.canvas, b.x, b.y); });
  }

  function makeStatics() {
    statics = [];
    G.houses.forEach(function (b) { statics.push({ y: b.base, x0: b.x, x1: b.x + b.w, y0: b.y, y1: b.base, draw: function () { drawHouse(b); } }); });
    if (G.mosque) {
      var m = G.mosque, mn = G.minaret;
      statics.push({ y: m.base, x0: m.x, x1: m.x + m.w, y0: m.y, y1: m.base, draw: function () { drawMosque(m); } });
      statics.push({ y: mn.base, x0: mn.x, x1: mn.x + mn.w, y0: mn.y, y1: mn.base, draw: function () { drawMinaret(mn); } });
    }
    (G.fixtures || []).forEach(function (f) { if (f.layer === "sort") statics.push({ y: f.y, x0: 0, x1: W, y0: 0, y1: HG, draw: function () { f.draw(RA()); } }); });
    props.forEach(function (p) {
      if (p.canopy || p.decal) return;
      var sp = propSprite(p), top = propTop(p, sp);
      statics.push({ y: p.y, x0: p.x - 4, x1: p.x + sp.width + 4, y0: top, y1: p.y + 4, draw: function () { drawProp(p); } });
      if (p.steam) emitters.push({ k: "steam", x: p.x + p.steam[0], y: p.y + p.steam[1], every: 0.22, t: 0 });
      if (p.smoke) emitters.push({ k: p.k === "shisha" ? "puff" : "smoke", x: p.x + p.smoke[0], y: p.y + p.smoke[1], every: p.k === "shisha" ? 2.4 : 0.3, t: rnd(0, 1) });
      if (p.k === "grill") emitters.push({ k: "spark", x: p.x + 12, y: p.y - 13, every: 0.18, t: 0 });
      if (p.k === "sabil") emitters.push({ k: "drip", x: p.x + 15, y: p.y - 13, every: 0.5, t: 0 });
    });
    G.houses.forEach(function (b) {
      b.out.decor.forEach(function (d) {
        if (d.k === "smoke") emitters.push({ k: "smoke", x: b.x + d.x, y: b.y + d.y, every: 0.5, t: rnd(0, 1) });
        if (d.k === "coop") for (var i = 0; i < 4; i++) coopBirds.push({ cx: b.x + d.x, cy: b.y + d.y - 14, r: rnd(14, 22), a: rnd(0, 6.3), s: rnd(1.1, 1.6) * (i % 2 ? 1 : -1), ph: rnd(0, 1) });
      });
      b.out.fire.forEach(function (f) { emitters.push({ k: "ember", x: b.x + f.x + f.w / 2, y: b.y + f.y, every: 0.5, t: 0 }); });
      (b.out.steam || []).forEach(function (s) { emitters.push({ k: "steam", x: b.x + s.x, y: b.y + s.y, every: 0.35, t: rnd(0, 1) }); });
    });
    ((G.roofs && G.roofs.coops) || []).forEach(function (c) { for (var i = 0; i < 3; i++) coopBirds.push({ cx: c[0], cy: c[1] - 8, r: rnd(12, 20), a: rnd(0, 6.3), s: rnd(1.1, 1.6) * (i % 2 ? 1 : -1), ph: rnd(0, 1) }); });
  }

  // strings of flags, lanterns, bulbs, the banner, and the lantern of the days
  function makeStrings() {
    strings = G.strings.filter(function (s) { return WD.inDays(s.days, day) && timeOk(s); }).map(function (s, si) {
      var len = hyp(s.x0, s.y0, s.x1, s.y1), n = Math.ceil(len), pts = [], items = [];
      for (var i = 0; i <= n; i++) { var t = i / n; pts.push([s.x0 + (s.x1 - s.x0) * t, s.y0 + (s.y1 - s.y0) * t + s.sag * 4 * t * (1 - t)]); }
      if (s.k === "days") {
        for (var k = 0; k < 30; k++) {
          var p0 = pts[Math.round((k + 0.5) / 30 * n)];
          items.push({ x: p0[0], y: p0[1], c: A.GLASS[k % A.GLASS.length], ph: rnd(0, 6.3), lit: k < day, today: k === day - 1 });
        }
      } else {
        var gap = s.k === "bulbs" ? 6 : s.k === "lanterns" ? 11 : 6;
        for (var d = gap / 2, j = 0; d < n; d += gap, j++) {
          if (s.k === "banner" && Math.abs(d / n - 0.5) < 0.26) continue;
          var p = pts[Math.round(d)];
          items.push({ x: p[0], y: p[1], c: s.k === "lanterns" ? A.GLASS[(j + si) % A.GLASS.length] : ["#E8503F", "#F2C14A", "#4CBF73", "#4F97E8", "#F4EFE4", "#B86BE0"][(j + si) % 6], ph: rnd(0, 6.3) });
        }
      }
      return { k: s.k, t: s.t, pts: pts, items: items, x0: Math.min(s.x0, s.x1), x1: Math.max(s.x0, s.x1), y0: Math.min(s.y0, s.y1), y1: Math.max(s.y0, s.y1) + s.sag + 16 };
    });
  }

  // every light in the hara, with when it is on
  function makeLights() {
    lights = [];
    function add(x, y, r, c, when, o) { lights.push(Object.assign({ x: x, y: y, r: r, c: c, when: when, fl: 0, g: 0.5 }, o || {})); }
    G.houses.forEach(function (b) {
      var o = b.out;
      o.win.forEach(function (w) {
        if (!w.glow) return;
        var c = w.glow === "tv" ? [140, 180, 255] : [255, 196, 120];
        add(b.x + w.x + w.w / 2, b.y + w.y + w.h / 2, w.glow === "slit" ? 10 : 16, c, "on", { fl: w.glow === "tv" ? 2 : 0, g: 0.45 });
      });
      o.glow.forEach(function (g) { add(b.x + g.x, b.y + g.y, g.r, g.c, g.k === "oven" ? "always" : "on", { fl: g.k === "oven" ? 1 : 0, g: g.k === "oven" ? 0.55 : g.k === "lantern" ? 0.8 : 0.4 }); });
      o.tv.forEach(function (t) { add(b.x + t.x + t.w / 2, b.y + t.y + t.h / 2, 26, [150, 190, 255], "on", { fl: 2, g: 0.5 }); });
      o.decor.forEach(function (d) {
        if (d.k === "wallLamp") add(b.x + d.x, b.y + d.y + 2, 30, [255, 210, 140], "on", { g: 0.7 });
        if (d.k === "fanous") add(b.x + d.x, b.y + d.y + 5, 18, A.rgb(d.c), "on", { g: 0.8, sway: d });
        if (d.k === "bulbs") for (var bx = d.x0 + 4; bx < d.x1; bx += 12) add(b.x + bx, b.y + d.y + 3, 12, [255, 226, 150], "on", { g: 0.8 });
      });
    });
    if (G.mosque) {
      var m = G.mosque;
      m.out.win.forEach(function (w) { add(m.x + w.x + w.w / 2, m.y + w.y + w.h / 2, 12, [255, 226, 160], "on", { g: 0.45 }); });
      m.out.glow.forEach(function (g) { add(m.x + g.x, m.y + g.y, g.r, g.c, "on", { g: 0.6 }); });
      m.out.decor.forEach(function (d) { if (d.k === "fanous") add(m.x + d.x, m.y + d.y + 5, 22, A.rgb(d.c), "on", { g: 0.9 }); });
      add(m.x + m.out.dome.x, m.y + m.out.dome.y, 44, [170, 220, 200], "on", { g: 0.3 });
      G.minaret.rings.forEach(function (r) { add(r.x, r.y, 28, [120, 255, 160], "on", { g: 0.9 }); });
      ((G.roofs && G.roofs.wins) || []).forEach(function (w) { add(w[0] + w[2] / 2, w[1] + w[3] / 2, 11, [255, 196, 120], "on", { g: 0.4 }); });
      add(G.minaret.top.x, G.minaret.top.y, 24, [255, 240, 200], "on", { g: 0.8 });
    }
    (G.lights || []).forEach(function (L) { if (timeOk(L)) add(L.x, L.y, L.r, L.c, L.when, { fl: L.fl || 0, g: L.g == null ? 0.5 : L.g, need: L.need || null, dyn: L.dyn || null }); });
    props.forEach(function (p) {
      // more lights on one thing: [dx, dy, rgb, radius, { fl, g, dyn }] from its base (the suhoor tent)
      (p.lights || []).forEach(function (L) { add(p.x + L[0], p.y + L[1], L[3], L[2], "on", Object.assign({ g: 0.8 }, L[4] || {})); });
      if (!p.light) return;
      var sp = propSprite(p), top = propTop(p, sp);
      if (p.light === "own") { (sp.lights || []).forEach(function (L) { add(p.x + L[0], top + L[1], L[3], L[2], "on", { g: 0.85 }); }); return; }
      var L = p.light;
      add(p.x + L[0], p.y + L[1], L[3], L[2], p.k === "grill" ? "always" : "on", { fl: p.k === "grill" ? 1 : 0, g: p.k === "grill" ? 0.5 : 0.8, lamp: p.k === "lamp" || p.k === "bigLantern" });
    });
    strings.forEach(function (s) {
      if (s.k === "flags" || s.k === "banner") return;
      s.items.forEach(function (it, i) {
        if (s.k === "days") { if (it.lit) add(it.x, it.y + 6, it.today ? 22 : 14, A.rgb(it.c), "on", { g: it.today ? 1 : 0.8, item: it }); return; }
        if (s.k === "bulbs" && i % 3) return;
        add(it.x, it.y + 3, s.k === "bulbs" ? 9 : 14, A.rgb(s.k === "bulbs" ? "#FFE7A0" : it.c), "on", { g: s.k === "bulbs" ? 0.8 : 0.7, item: it });
      });
    });
  }

  // things you can tap to look at
  function makeLooks() {
    looks = [];
    props.forEach(function (p) {
      if (!p.look) return;
      var sp = propSprite(p), top = propTop(p, sp), st = { x: p.x + sp.width / 2, y: p.y + 8 };
      snap(st);
      looks.push({ id: p.look, r: [p.x, top, sp.width, p.y - top], stand: [st.x, st.y] });
    });
    G.houses.forEach(function (b) {
      if (b.cafe) looks.push({ id: "cafe", r: [b.x + b.shop.x, b.base - 40, b.shop.w, 40], stand: [b.x + b.shop.x + b.shop.w / 2, b.base + 16] });
    });
  }

  // soft leaf shadows on the ground under the big trees
  function makeDapples() {
    dapples = canopies.map(function (p) {
      var sp = propSprite(p), w = sp.width, h = 40, c = A.cv(w, h), P = A.Pt(c), R = A.rng(p.x + 7);
      P.el(6, 4, w - 12, h - 8, "rgba(46,30,56,0.13)");
      for (var i = 0; i < 16; i++) P.el((R() * (w - 18)) | 0, (R() * (h - 10)) | 0, 10 + ((R() * 12) | 0), 4 + ((R() * 5) | 0), "rgba(46,30,56,0.12)");
      var flecks = [];
      for (var j = 0; j < 10; j++) flecks.push([10 + ((R() * (w - 24)) | 0), 6 + ((R() * (h - 14)) | 0), 2 + ((R() * 3) | 0), R() * 6]);
      return { p: p, c: c, w: w, h: h, flecks: flecks, fade: 1, top: propTop(p, sp), sw: sp.width, sh: sp.height };
    });
  }

  /* ---------------- the people of this moment ---------------- */
  function actor(sid, x, y, dir) {
    return { sid: sid, sp: spr(sid), x: x, y: y, dir: dir || 0, frame: 0, dist: 0, speed: SPEED * 0.6, blink: rnd(1, 4), look: rnd(2, 6), wait: rnd(0, 3) };
  }
  function populate() {
    actors = [player];
    if (RM) { populateRoom(); return; }
    var tm = time, nematH = houseBy("nemat"), homeH = houseBy("home");
    WD.PEOPLE.forEach(function (p) {
      // at suhoor people stay where they were at night, unless their pos says suhoor (null: not out in the hara)
      var away = tm === "suhoor" && p.pos.hasOwnProperty("suhoor");
      var pos = away ? p.pos.suhoor : p.pos[tm] || (tm === "suhoor" ? p.pos.night : null), sid = p.id, face = p.face, later = p.posLater;
      if (later && !away && day >= later.from && later.times.some(isNow)) { pos = later.at; if (later.cast) sid = later.cast; if (later.face) face = later.face; }
      if (!pos) return;
      var pose = pos[3] || null;
      if (pose === "roof") sid = sid + "+l";
      var a = actor(sid, pos[0], pos[1], pos[2]);
      a.kind = "story"; a.person = p; a.name = p.name; a.face = face; a.pose = pose; a.homeDir = pos[2]; a.cast = p.id;
      if (pose === "balcony" && nematH && nematH.out.balcony) {
        var bal = nematH.out.balcony;
        a.x = nematH.x + bal.x + 14; a.y = nematH.y + bal.y; a.clip = a.y - 7; a.sortY = nematH.base + 0.5; a.talkAt = [a.x + 4, WD.SPOTS.home.stand[1]];
      }
      if (pose === "roof" && homeH) { a.sortY = homeH.base + 0.6; a.talkAt = WD.SPOTS.roof.stand; }
      if (pose === "sit") a.sit = true;
      if (pose === "play") a.play = true;
      if (pose === "work") a.work = 1;
      actors.push(a);
    });
    WD.EXTRAS.forEach(function (x) {
      if (!timeOk(x) || !WD.inDays(x.days, day)) return;
      var a;
      if (x.sitAt) {
        var ch = props.filter(function (p) { return p.seat === x.sitAt; })[0];
        if (!ch) return;
        a = actor(x.cast, ch.x + 5, ch.y - 1, ch.sitDir); a.sit = true; a.sortY = ch.y + 0.3; a.talkAt = [ch.x + 4, ch.y + 12];
      } else { a = actor(x.cast, x.at[0], x.at[1], x.at[2]); if (x.at[3] === "sit") a.sit = true; }
      if (x.behind) { a.clip = x.behind[0]; a.sortY = x.behind[1]; a.talkAt = [a.x, x.behind[1] + 10]; }
      if (x.talk) a.talkAt = x.talk;
      if (x.serve) { a.serve = rnd(0.4, 2); a.serveK = x.serve; }
      if (x.dance) a.dance = rnd(0, 1);
      if (x.sparkle) a.sparkle = true;
      if (x.loop) { a.route = { pts: x.loop, i: 0, wait: rnd(0.5, 2), pause: x.pause || [1.5, 3.5] }; a.speed = SPEED * (x.speed || 0.45); }
      if (x.hold) a.item = { k: x.hold, t: 9 };
      a.kind = "extra"; a.name = x.name; a.lines = x.say; a.homeDir = a.dir; a.queue = x.role === "queue"; a.cast = x.cast;
      actors.push(a);
    });
    // at suhoor the musaharati walks the whole hara with his drum, calling people by name, two kids behind him
    if (tm === "suhoor" && WD.MESA) {
      var M = WD.MESA, r0 = M.route[0], ms = actor(M.cast, r0[0], r0[1], 3);
      ms.kind = "extra"; ms.name = M.name; ms.lines = M.say; ms.cast = M.cast; ms.homeDir = 0;
      ms.route = { i: 0, wait: 2, first: true }; ms.speed = SPEED * 0.42;
      actors.push(ms);
      M.kids.forEach(function (k, i) {
        var kd = actor(k.cast, r0[0] - 10 - i * 9, r0[1] + 3 + i * 2, 3);
        kd.kind = "extra"; kd.name = k.name; kd.lines = k.say; kd.cast = k.cast.replace(/\+l$/, ""); kd.homeDir = 0;
        kd.trail = { lead: ms, dx: -11 - i * 9, dy: 2 + i * 3, t: i * 0.2 }; kd.speed = SPEED * 0.5;
        actors.push(kd);
      });
    }
    // at sunset the street empties: everyone is at the mercy tables
    if (tm === "maghrib") {
      var diners = ["w1", "m1", "k2", "m3", "w3", "k1", "m2", "w2", "k3", "m4"];
      ["table1", "table2"].forEach(function (id, ti) {
        var t = props.filter(function (p) { return p.id === id; })[0];
        if (!t) return;
        for (var i = 0; i < 5; i++) {
          if (ti === 0 && i === 2) continue; // Saber's seat
          var dx = t.x + 10 + i * 17, a = actor(diners[ti * 5 + i], dx, t.y - 8, 0);
          a.sit = true; a.kind = "extra"; a.name = "الجيران"; a.lines = ["«{اتفضل|اتفضلي} معانا!»", "«تقبّل الله!»"]; a.homeDir = 0; a.talkAt = [dx, t.y + 6];
          actors.push(a);
        }
      });
    }
    var n = { asr: 4, pre: 9, maghrib: 1, night: 11, suhoor: 12 }[tm] || 4;
    var pool = WD.WALKERS.slice().sort(function () { return Math.random() - 0.5; });
    for (var w = 0; w < n && w < pool.length; w++) {
      var wp = WD.WAYPOINTS[(Math.random() * WD.WAYPOINTS.length) | 0];
      var a2 = actor(pool[w].cast, wp[0] + rnd(-6, 6), wp[1], (Math.random() * 4) | 0);
      snap(a2);
      a2.kind = "walker"; a2.name = pool[w].name; a2.lines = pool[w].say; a2.speed = SPEED * (pool[w].kid ? 0.8 : 0.5); a2.wait = rnd(0, 4); a2.cast = pool[w].cast;
      actors.push(a2);
    }
    var kids = actors.filter(function (a) { return a.play; });
    ball = kids.length === 2 ? { x: kids[0].x + 5, y: kids[0].y + 1, z: 0, vx: 0, vy: 0, vz: 0, holder: kids[0], other: kids[1], wait: 1, kids: kids } : null;
    cats = WD.CATS.filter(function (c) { return WD.inDays(c.days, day) && timeOk(c); }).map(function (c) {
      return { coat: c.coat, x: c.at[0], y: c.at[1], z: c.z || 0, mode: dark() && c.mode === "wander" ? "sit" : c.mode, area: c.area, dir: Math.random() < 0.5 ? 0 : 1, t: rnd(1, 5), walk: null, zt: rnd(0, 2) };
    });
    // kids flying kites from the rooftops, in the afternoon
    kites = (tm === "asr" || tm === "pre") ? (G.kites || []).map(function (k, i) {
      var a = actor(k.cast, k.at[0], k.at[1], 1);
      a.kind = "extra"; a.name = ["عمر", "جنى"][i] || "طفل"; a.lines = ["«{شايف|شايفة} طيارتي؟ أعلى واحدة في الحارة!»", "«الهوا حلو النهارده!»"]; a.homeDir = 1; a.kite = k; a.noTurn = true;
      actors.push(a);
      return { a: a, k: k, ph: Math.random() * 6 };
    }) : [];
    pigeons = [];
    if (!dark()) WD.FLOCKS.forEach(function (f) {
      for (var i = 0; i < f.n; i++) {
        var tint = ["#9C98A6", "#B4B0BC", "#8A8494", "#C9C2B8"][i % 4];
        if (!pigeonSprCache[tint]) pigeonSprCache[tint] = A.pigeon(tint);
        var hx = f.at[0] + rnd(-14, 14), hy = f.at[1] + rnd(-5, 5);
        pigeons.push({ hx: hx, hy: hy, x: hx, y: hy, z: 0, st: "peck", t: rnd(0, 2), dir: Math.random() < 0.5 ? 0 : 1, f: 0, tint: tint });
      }
    });
  }

  // the people of a room, from js/hara-rooms.js, for this hour
  function populateRoom() {
    kites = []; pigeons = []; ball = null;
    var rt = RM.suhoor || time !== "suhoor" ? time : "night"; // rooms that don't know suhoor yet keep their night
    (RM.people ? RM.people(rt, day, flags()) : []).forEach(function (e) {
      var a = actor(e.cast, e.at[0], e.at[1], e.at[2]);
      a.cid = e.id || null; a.cast = e.cast.replace(/\+l$/, ""); a.name = e.name || NAMES[a.cast] || ""; a.face = e.face || null; a.homeDir = e.at[2];
      if (e.id) { a.kind = "story"; a.person = { id: e.id, name: a.name, face: e.face, say: e.say || [] }; } else { a.kind = "extra"; a.lines = e.say && e.say.length ? e.say : null; }
      if (e.at[3] === "sit") { a.sit = true; a.sortY = a.y + 1.3; }
      if (e.at[3] === "kneel") { a.sit = true; a.prayPose = "jalsa"; } // on the carpet facing the qibla, seen from behind
      if (e.talk) a.talkAt = e.talk;
      if (e.queue) a.queue = true;
      if (e.work) a.work = 1;
      if (e.pray) a.pray = e.pray;
      if (e.sleep) a.sleepZ = 1;
      if (e.kite) { a.noTurn = true; kites.push({ a: a, k: { to: [-56, -110], c: "#E8503F" }, ph: Math.random() * 6 }); }
      if (e.serve) { a.serve = rnd(0.4, 2); a.serveK = e.serve; }
      if (e.dance) a.dance = rnd(0, 1);
      if (e.sparkle) a.sparkle = true;
      if (e.draw) { a.custom = e.draw; a.noTurn = true; }
      if (e.loop) { a.route = { pts: e.loop, i: 0, wait: rnd(0.5, 2), pause: e.pause || [1.5, 3.5] }; a.speed = SPEED * (e.speed || 0.45); }
      if (e.hold) a.item = { k: e.hold, t: 9 };
      if (e.sortY) a.sortY = e.sortY;
      if (e.react) a.react = e.react;
      actors.push(a);
    });
    cats = (RM.cats || []).map(function (c) { return { coat: c.coat, x: c.at[0], y: c.at[1], z: c.z || 0, mode: c.mode, area: c.area, dir: 0, t: rnd(1, 5), walk: null, zt: rnd(0, 2) }; });
  }

  /* ---------------- moving about ---------------- */
  function moveActor(a, dt) {
    if (!a.path || !a.path.length) { a.moving = false; a.path = null; return false; }
    var p = a.path[0], dx = p[0] - a.x, dy = p[1] - a.y, d = Math.hypot(dx, dy), step = a.speed * dt;
    if (d > 0.01) {
      if (Math.abs(dx) > Math.abs(dy) * 1.15) a.dir = dx < 0 ? 2 : 3;
      else if (Math.abs(dy) > Math.abs(dx) * 0.85) a.dir = dy < 0 ? 1 : 0;
    }
    if (d <= step) { a.x = p[0]; a.y = p[1]; a.path.shift(); a.dist += d; }
    else { a.x += dx / d * step; a.y += dy / d * step; a.dist += step; }
    a.moving = true;
    var f = Math.floor(a.dist / 7) % 4;
    if (f !== a.frame) {
      a.frame = f;
      if (a === player && (f === 1 || f === 3)) { var au = audio(); if (au && au.step) au.step(); if (Math.random() < 0.5) dust(a.x, a.y); }
    }
    if (!a.path.length) {
      a.path = null; a.moving = false; a.frame = 0;
      if (a.onArrive) { var fn = a.onArrive; a.onArrive = null; fn(); }
      return true;
    }
    return false;
  }
  function walkTo(x, y, dest) {
    var path = findPath(player.x, player.y, x, y);
    if (!path) return false;
    player.path = path; player.dest = dest || null; camFree = false;
    var end = path[path.length - 1];
    rings.push({ x: end[0], y: end[1], t: 0 });
    hint.classList.add("gone");
    return true;
  }
  function goToSpot(id) {
    var sp = WD.SPOTS[id];
    if (!sp || !isOpen || talk || cutOn || busy) return;
    if (H.audio) H.audio.tap();
    if (hyp(player.x, player.y, sp.stand[0], sp.stand[1]) < 4) { player.dest = { spot: id }; arrived(); return; }
    walkTo(sp.stand[0], sp.stand[1], { spot: id });
  }
  function nearestSpot() {
    if (RM) return LOC;
    var best = "home", bd = 1e9;
    Object.keys(WD.SPOTS).forEach(function (k) { if (!timeOk(WD.SPOTS[k])) return; var s = WD.SPOTS[k].stand, d = hyp(player.x, player.y, s[0], s[1]); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  // Errands: a goal is a spot on the hara, a point or a zone in a room, or walking into a room.
  function goalLoc(g) { return g.enter || g.loc || "hara"; }
  // some doors and some halves of a room are only for men or only for women (the mosque)
  function gsex() { return O && O.fem ? "f" : "m"; }
  function myExits() { return RM ? RM.exits.filter(function (x) { return !x.who || x.who === gsex(); }) : []; }
  function spawnFor(from) { return RM.spawn[(from || "hara") + (O && O.fem ? "F" : "")] || RM.spawn[from] || RM.spawn.hara; }
  function mySide(x, y) { var h = halfAt(x, y); return !h || h.who === gsex(); }
  function halfAt(x, y) {
    if (!RM || !RM.halves) return null;
    for (var i = 0; i < RM.halves.length; i++) { var r = RM.halves[i].r; if (x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return RM.halves[i]; }
    return null;
  }
  function doorSpotFor(room) {
    var D = (H.rooms && H.rooms.DOORS) || {};
    for (var k in D) if (D[k].room === room && WD.SPOTS[k] && k !== "steps") return k;
    return null;
  }
  function markOf(g) {
    var gl = goalLoc(g);
    if (gl === LOC) {
      if (g.enter) return null;
      if (g.spot) { var s = WD.SPOTS[g.spot]; return { stand: s.stand, mark: s.mark, name: g.label || s.name }; }
      if (g.at) return { stand: g.at, mark: g.mark || [g.at[0], g.at[1] - 34], name: g.label };
      if (g.zone) { var z = g.zone, c = g.stand || [z[0] + z[2] / 2, z[1] + z[3] / 2]; return { stand: c, mark: g.mark || [c[0], c[1] - 40], name: g.label }; }
      return null;
    }
    if (RM) {
      var mine = myExits(), ex = mine.filter(function (x) { return x.to === gl; })[0] || mine.filter(function (x) { return x.to === "hara"; })[0] || mine[0];
      if (!ex) return null;
      var c2 = [ex.r[0] + ex.r[2] / 2, ex.r[1] + ex.r[3] / 2];
      return { stand: c2, mark: [c2[0], c2[1] - 24], name: g.label || "اخرج", exit: ex };
    }
    var k = doorSpotFor(gl);
    if (!k) return null;
    var s2 = WD.SPOTS[k];
    return { stand: s2.stand, mark: s2.mark, name: g.label || s2.name, spot: k };
  }
  function goTarget(g) {
    if (!isOpen || talk || cutOn || busy || !OB) return;
    g = g || OB.goals[0];
    var m = g && markOf(g);
    if (!m) return;
    autoGo = true;
    if (H.audio) H.audio.tap();
    var dest = m.exit ? { exit: m.exit } : m.spot ? { spot: m.spot } : { goal: g };
    if (hyp(player.x, player.y, m.stand[0], m.stand[1]) < 4) { player.dest = dest; arrived(); return; }
    walkTo(m.stand[0], m.stand[1], dest);
  }
  function reach(g) {
    if (!OB) return;
    var ob = OB;
    OB = null; autoGo = false;
    player.path = null; player.moving = false; player.frame = 0; player.dest = null;
    closeTalk();
    refreshHud();
    if (H.audio) H.audio.tap();
    setTimeout(function () { if (g.pick) g.pick(); else if (ob.onReach) ob.onReach(g); }, 260);
  }
  function arrived() {
    var dest = player.dest; player.dest = null;
    if (cutOn || busy) return;
    if (O && O.onMove) O.onMove(LOC, nearestSpot());
    if (OB) {
      if (dest && dest.goal) { reach(dest.goal); return; }
      for (var i = 0; i < OB.goals.length; i++) {
        var g = OB.goals[i];
        if (g.enter || goalLoc(g) !== LOC) continue;
        var st = g.spot ? WD.SPOTS[g.spot].stand : g.at;
        if (st && (hyp(player.x, player.y, st[0], st[1]) < 12 || (g.spot && dest && dest.spot === g.spot))) { reach(g); return; }
      }
    }
    if (dest && dest.exit) { useExit(dest.exit); return; }
    if (dest && dest.person) startTalk(dest.person);
    else if (dest && dest.cat) pet(dest.cat);
    else if (dest && dest.look) look(dest.look);
    else if (dest && dest.spot) spotAction(dest.spot);
    else if (RM) { var ex = exitHere(); if (ex) useExit(ex); }
  }
  function exitHere() {
    if (!RM) return null;
    var ex = myExits();
    for (var i = 0; i < ex.length; i++) { var r = ex[i].r; if (player.x >= r[0] && player.x <= r[0] + r[2] && player.y >= r[1] && player.y <= r[1] + r[3]) return ex[i]; }
    return null;
  }
  function spotAction(id) {
    var d = H.rooms && H.rooms.DOORS[id];
    if (d && H.rooms.has(d.room) && doorNow(d)) { tryDoor(d); return; }
    look(id);
  }
  function tryDoor(d) {
    if (d.open && !d.open(day, flags())) { openTalk({ name: WD.SPOTS[d.spot].name, text: fmt(d.shut), portrait: null }); sfx("knock"); return; }
    goLoc(d.room, null, { from: "hara" });
  }
  function useExit(ex) {
    if (ex.to === "hara") { var s = WD.SPOTS[ex.spot] || WD.SPOTS.home; goLoc("hara", [s.stand[0], s.stand[1] + 6, 0], { from: LOC }); }
    else goLoc(ex.to, null, { from: LOC });
  }
  function checkTrigger() {
    if (!OB || cutOn || busy || talk) return;
    for (var i = 0; i < OB.goals.length; i++) {
      var g = OB.goals[i], z = g.zone;
      if (!z || g.enter || goalLoc(g) !== LOC) continue;
      if (player.x > z[0] && player.x < z[0] + z[2] && player.y > z[1] && player.y < z[1] + z[3]) { reach(g); return; }
    }
  }
  function fade(v, ms) {
    ms = ms == null ? 280 : ms;
    fadeEl.style.transitionDuration = ms + "ms";
    fadeEl.classList.toggle("on", v > 0);
    return wait(ms + 30);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // walk through a door: a short fade, a new place, its sound and its name
  function goLoc(id, at, o) {
    o = o || {};
    busy = true;
    var wasRoom = !!RM;
    return fade(1, o.ms || 260).then(function () {
      loadLoc(id);
      var p = at;
      if (!p) p = RM ? spawnFor(o.from) : WD.SPOTS.home.stand.concat([0]);
      placePlayer(p);
      shot = null; liftNow = 0; zoom = zoomGoal = o.zoom || 1;
      applyZoom(); snapCam();
      if (O && O.onLoad) O.onLoad(LOC); // still dark: the story can set people on their marks
      if (!RM) { var P0 = placeAt(player.x, player.y); place = placeCand = P0 ? P0.id : null; if (P0) bannerSeen[P0.id] = T; }
      playBed();
      if (!o.quiet && RM) showBanner(RM.name, fmt(RM.sub), "");
      if (!o.quiet && (wasRoom || RM)) sfx("door");
      refreshHud();
      return wait(o.hold || 60);
    }).then(function () { return o.keepDark ? null : fade(0, o.ms || 280); }).then(function () {
      busy = false;
      if (O && O.onMove) O.onMove(LOC, nearestSpot());
      if (deedGo && !cutOn) { var dg = deedById(deedGo); deedGo = null; if (dg) setTimeout(function () { goDeed(dg); }, 220); }
      if (OB && !cutOn) {
        var hit = OB.goals.filter(function (g) { return g.enter === LOC; })[0];
        if (hit) { reach(hit); return; }
        if (autoGo) setTimeout(function () { if (OB && !cutOn) goTarget(); }, 160);
      }
    });
  }
  function placePlayer(p) {
    player.x = p[0]; player.y = p[1]; player.dir = p[2] || 0;
    player.path = null; player.moving = false; player.frame = 0; player.dest = null; player.sit = false; player.pray = null; player.prayPose = null;
    snap(player);
  }
  function playBed() {
    var a = audio();
    if (!a || !a.scene) return;
    if (RM) { a.scene(RM.bed, time); return; }
    var P0 = placeAt(player.x, player.y);
    a.scene(P0 ? placeText(P0).bed : "square", time);
  }

  /* ---------------- tapping ---------------- */
  function tap(e) {
    if (talk) { advanceTalk(); return; }
    if (!isOpen || cutOn || busy || (O && O.title)) return;
    if (!qList.hidden) qOpen(false); // the list folds away as soon as you move
    var r = view.getBoundingClientRect(), wx = cam.x + (e.clientX - r.left) * dpr / K, wy = cam.y + (e.clientY - r.top) * dpr / K;
    var half = halfAt(wx, wy);
    if (half && half.who !== gsex() && halfAt(player.x, player.y) !== half) {
      says = says.filter(function (s) { return s.a !== player; });
      says.push({ a: player, t: half.t, until: T + 2.6 });
      if (H.audio) H.audio.tap();
      return;
    }
    var best = null;
    actors.forEach(function (a) {
      if (a === player) return;
      var h = a.sp.kid ? 22 : 27, top = a.y - h - (a.sit ? -3 : 0), bot = a.clip || a.y;
      if (wx > a.x - 9 && wx < a.x + 9 && wy > top - 4 && wy < bot + 4 && (!best || a.y > best.y)) best = a;
    });
    if (best) { autoGo = false; hl = { r: [best.x - 9, best.y - (best.sp.kid ? 24 : 30), 18, best.sp.kid ? 26 : 32], t: T }; approach(best); return; }
    for (var i = 0; i < cats.length; i++) { var c = cats[i]; if (wx > c.x - 9 && wx < c.x + 9 && wy > c.y - 11 - c.z && wy < c.y + 4) { var to = { x: c.x + (player.x < c.x ? -12 : 12), y: c.y + 3 }; snap(to); walkTo(to.x, to.y, { cat: c }); return; } }
    if (OB) for (var gi = 0; gi < OB.goals.length; gi++) { var m = markOf(OB.goals[gi]); if (m && hyp(wx, wy, m.mark[0], m.mark[1] - 8) < 14) { goTarget(OB.goals[gi]); return; } }
    autoGo = false;
    if (RM) {
      var exs = myExits();
      for (var x = 0; x < exs.length; x++) {
        var er = exs[x].r;
        if (wx > er[0] - 4 && wx < er[0] + er[2] + 4 && wy > er[1] - 12 && wy < er[1] + er[3] + 6) { walkTo(er[0] + er[2] / 2, er[1] + er[3] / 2, { exit: exs[x] }); return; }
      }
    } else {
      var keys = Object.keys(WD.SPOTS);
      for (var k = 0; k < keys.length; k++) {
        var s = WD.SPOTS[keys[k]];
        if (s.tap && timeOk(s) && wx > s.tap[0] && wx < s.tap[0] + s.tap[2] && wy > s.tap[1] && wy < s.tap[1] + s.tap[3]) { goToSpot(keys[k]); return; }
      }
    }
    for (var j = 0; j < looks.length; j++) {
      var L = looks[j];
      if (wx > L.r[0] - 5 && wx < L.r[0] + L.r[2] + 5 && wy > L.r[1] - 6 && wy < L.r[1] + L.r[3] + 6) {
        hl = { r: L.r, t: T };
        if (H.audio) H.audio.tap();
        if (hyp(player.x, player.y, L.stand[0], L.stand[1]) < 5) { player.dest = { look: L.id }; arrived(); return; }
        walkTo(L.stand[0], L.stand[1], { look: L.id });
        return;
      }
    }
    walkTo(wx, wy, null);
  }
  function approach(a) {
    var to = a.talkAt;
    if (!to) {
      var side = player.x < a.x ? -13 : 13;
      to = [a.x + side, a.y + 1];
      if (!walkable(to[0], to[1])) to = [a.x - side, a.y + 1];
      if (!walkable(to[0], to[1])) to = [a.x, a.y + 10];
    }
    if (hyp(player.x, player.y, to[0], to[1]) < 6) { startTalk(a); return; }
    walkTo(to[0], to[1], { person: a });
  }

  /* ---------------- talking, looking, secrets, small deeds ---------------- */
  function startTalk(a) {
    var line;
    if (a.person) { var l = pickLine(a.person.say); line = l && l.t; }
    else if (a.lines) line = a.lines[(Math.random() * a.lines.length) | 0];
    if (!line) return;
    faceEach(a);
    a.emote = { k: "!", t: 0 };
    a.talking = true;
    var face = a.face || (a.person && a.person.face) || null;
    openTalk({ name: a.name, face: face, portrait: face ? null : bust(a.sp, a.sid), text: fmt(line), who: a });
    deedCheck({ talk: a.cast });
  }
  function faceEach(a) {
    if (a.sit || a.clip || a.pose === "roof" || a.work) { player.dir = player.y > a.y + 6 ? 1 : player.x < a.x ? 3 : 2; return; }
    var dx = player.x - a.x, dy = player.y - a.y;
    if (Math.abs(dx) > Math.abs(dy)) { a.dir = dx < 0 ? 2 : 3; player.dir = dx < 0 ? 3 : 2; }
    else { a.dir = dy < 0 ? 1 : 0; player.dir = dy < 0 ? 0 : 1; }
  }
  function look(id) {
    var thirsty = (id === "sabil" || id === "zeer" || id === "cooler") && fasting();
    var did = deedCheck({ look: id });
    if (did && did.did) { openTalk({ name: WD.SPOTS[id] ? WD.SPOTS[id].name : null, text: fmt(did.did) }); return; }
    if (thirsty && todaysDeeds().some(function (x) { return !x.done && x.d.night && (x.d.look === id || (x.d.also && x.d.also.indexOf(id) >= 0)); })) {
      openTalk({ name: WD.SPOTS[id] ? WD.SPOTS[id].name : null, text: fmt("المية ساقعة ومغرية… بس {إنت|إنتي} صايم! {استنى|استني} لحد المغرب، والسبيل مش هيطير.") });
      player.emote = { k: "sweat", t: 0 };
      return;
    }
    var sec = WD.SECRETS.filter(function (s) { return s.look === id && !memories[s.id]; })[0];
    if (sec) {
      memories[sec.id] = 1; save("hara.memories", memories);
      openTalk({ name: "✦ ذكرى جديدة · " + ar(memCount()) + " من " + ar(WD.SECRETS.length), text: fmt(sec.t), secret: true });
      for (var i = 0; i < 10; i++) parts.push({ k: "twinkle", x: sec.at[0] + rnd(-8, 8), y: sec.at[1] + rnd(-8, 6), vx: rnd(-6, 6), vy: rnd(-14, -4), life: -i * 0.05, max: 1.1 });
      sfx("chime");
      refreshQuests();
      return;
    }
    var line = pickLine(WD.LOOK[id]);
    if (!line) return;
    var sp = WD.SPOTS[id];
    openTalk({ name: sp ? sp.name : null, text: fmt(line.t) });
    if (line.flag && !cond(line.flag) && O && O.onFlag) O.onFlag(line.flag, line.news);
    if (id === "zeer" || id === "sabil") sfx("pour");
  }
  function memCount() { return WD.SECRETS.filter(function (s) { return memories[s.id]; }).length; }
  // Where a small deed is in the place you're in: the thing to look at, the person, or the nearest cat. null if it's elsewhere.
  function deedTarget(d) {
    if (d.look) for (var i = 0; i < looks.length; i++) {
      var L = looks[i];
      if ((L.id === d.look || (d.also && d.also.indexOf(L.id) >= 0)) && mySide(L.stand[0], L.stand[1])) return { x: L.r[0] + L.r[2] / 2, y: L.r[1] - 3, stand: L.stand, dest: { look: L.id }, r: L.r };
    }
    if (d.talk) for (var j = 0; j < actors.length; j++) {
      var a = actors[j];
      if (a !== player && a.cast === d.talk && mySide(a.x, a.y)) return { x: a.x, y: a.y - (a.sp.kid ? 30 : 37) - (a.sit ? -3 : 0), actor: a, r: [a.x - 9, a.y - 30, 18, 32] };
    }
    if (d.cat && cats.length) {
      var best = null, bd = 1e9;
      cats.forEach(function (c) { var dd = hyp(c.x, c.y, player.x, player.y); if (dd < bd) { bd = dd; best = c; } });
      if (best) return { x: best.x, y: best.y - 14 - best.z, cat: best, r: [best.x - 7, best.y - 10 - best.z, 14, 12] };
    }
    return null;
  }
  function deedById(id) { var x = todaysDeeds().filter(function (y) { return y.d.id === id; })[0]; return x && !x.done ? x.d : null; }
  // show where it is (a quick look over there if it's off screen), then walk there
  function goDeed(d) {
    if (!isOpen || talk || cutOn || busy) return;
    qOpen(false);
    track = d.id; autoGo = false;
    if (H.audio) H.audio.tap();
    var t = deedTarget(d);
    if (!t) { // out in the hara: go out the door first, then on
      var ex = myExits().filter(function (x) { return x.to === "hara"; })[0] || myExits()[0];
      if (!ex) return;
      deedGo = d.id;
      walkTo(ex.r[0] + ex.r[2] / 2, ex.r[1] + ex.r[3] / 2, { exit: ex });
      return;
    }
    hl = { r: t.r, t: T + 0.2, long: true };
    peek(t.x, t.y + 10).then(function () {
      var t2 = deedTarget(d);
      if (!t2 || talk || cutOn) return;
      if (t2.actor) approach(t2.actor);
      else if (t2.cat) { var c = t2.cat, to = { x: c.x + (player.x < c.x ? -12 : 12), y: c.y + 3 }; snap(to); walkTo(to.x, to.y, { cat: c }); }
      else if (hyp(player.x, player.y, t2.stand[0], t2.stand[1]) < 5) { player.dest = t2.dest; arrived(); }
      else walkTo(t2.stand[0], t2.stand[1], t2.dest);
    });
  }
  // the camera glides over to something and back, so you see where it is
  function peek(x, y) {
    if (seen(x, y)) return wait(250);
    busy = true;
    var c0 = { x: cam.x + viewW / 2, y: cam.y + viewH / 2 - liftNow };
    return new Promise(function (res) { shot = { x0: c0.x, y0: c0.y, z0: zoom, x1: x, y1: y, z1: zoom, t0: performance.now(), dur: 800, res: res }; })
      .then(function () { return wait(700); })
      .then(function () {
        var tg = camTarget();
        return new Promise(function (res) { shot = { x0: x, y0: y, z0: zoom, x1: tg.x + viewW / 2, y1: tg.y + viewH / 2 - liftNow, z1: zoom, t0: performance.now(), dur: 650, res: res }; });
      })
      .then(function () { shot = null; busy = false; });
  }
  // fasting hours: no drinking from the sabil or the zeer until maghrib
  function fasting() { return time === "asr" || time === "pre"; }
  function todaysDeeds() { var done = deeds[day] || {}; return WD.deedsFor(day).map(function (d) { return { d: d, done: !!done[d.id] }; }); }
  function deedCheck(ev) {
    var did = null;
    todaysDeeds().forEach(function (x) {
      if (x.done || did) return;
      var d = x.d;
      if ((d.look && (ev.look === d.look || (d.also && d.also.indexOf(ev.look) >= 0))) || (d.cat && ev.cat) || (d.talk && ev.talk === d.talk)) {
        if (d.night && fasting()) return;
        did = d;
        if (track === d.id) track = null;
        if (d.hold) { player.item = { k: d.hold, t: 0 }; player.itemUntil = T + 1.8; }
        deeds[day] = deeds[day] || {}; deeds[day][d.id] = 1; save("hara.deeds", deeds);
        setTimeout(function () { showBanner("✓ " + fmt(d.t), "خير صغير يفرق", "deed"); sfx("chime"); }, 600);
        for (var i = 0; i < 4; i++) parts.push({ k: "heart", x: player.x + rnd(-5, 5), y: player.y - 30, vx: rnd(-5, 5), vy: -14 - i * 3, life: -i * 0.2, max: 1.4 });
        if (d.look === "plants") { sfx("pour"); for (var j = 0; j < 22; j++) parts.push({ k: "drop", x: 8 + rnd(0, 26), y: 652 + rnd(-6, 2), vx: 0, vy: rnd(10, 30), life: -j * 0.06, max: 0.7 }); }
        refreshQuests();
      }
    });
    return did;
  }
  // the dialogue box. A scene waits on it: res() when it closes, res(i) when one of t.opts is picked.
  function openTalk(t, res) {
    if (talk && talk.res) { var r0 = talk.res; talk.res = null; r0(); }
    talk = { t: t, shown: 0, full: t.text || "", last: 0, acc: 0, res: res || null, opts: t.opts || null };
    var pop = dlg.hidden && performance.now() - lastClose > 140;
    dlg.hidden = false;
    var hasP = !!(t.face || t.portrait);
    dlg.classList.toggle("noface", !hasP);
    dlg.classList.toggle("narr", !!t.narr);
    dlg.classList.toggle("secret", !!t.secret);
    dlg.classList.toggle("ask", !!t.opts);
    dlg.classList.toggle("me", !!t.me);
    if (t.face) { dlgImg.src = "assets/faces/" + t.face + ".webp"; dlgImg.className = ""; }
    else if (t.portrait) { dlgImg.src = t.portrait; dlgImg.className = "px"; }
    dlgName.textContent = t.name || "";
    dlgName.hidden = !t.name;
    dlgText.textContent = "";
    dlgOpts.textContent = ""; dlgOpts.hidden = true;
    dlg.classList.remove("done");
    if (pop) { dlg.style.animation = "none"; void dlg.offsetWidth; dlg.style.animation = ""; }
    choiceBox.classList.add("dim");
    if (!talk.full) { talk.shown = 0; dlg.classList.add("done"); showOpts(); }
  }
  function showOpts() {
    if (!talk || !talk.opts || !dlgOpts.hidden) return;
    dlgOpts.hidden = false;
    talk.opts.forEach(function (o, i) {
      var b = el("button", "mp-opt", dlgOpts);
      b.type = "button"; b.textContent = o;
      b.style.animationDelay = (i * 0.06) + "s";
      b.addEventListener("click", function (e) { e.stopPropagation(); pickOpt(i); });
    });
  }
  function pickOpt(i) {
    if (!talk) return;
    var r = talk.res; talk.res = null;
    if (H.audio) H.audio.tap();
    closeTalk();
    if (r) r(i);
  }
  function advanceTalk() {
    if (!talk) return;
    if (talk.shown < talk.full.length) { talk.shown = talk.full.length; dlgText.textContent = talk.full; dlg.classList.add("done"); showOpts(); return; }
    if (talk.opts) return;
    var r = talk.res; talk.res = null;
    closeTalk();
    if (r) r();
  }
  function closeTalk() {
    if (!talk) return;
    if (talk.t.who) { talk.t.who.talking = false; talk.t.who.look = rnd(2, 4); }
    var r = talk.res;
    talk = null;
    lastClose = performance.now();
    dlg.hidden = true;
    choiceBox.classList.remove("dim");
    if (r) r();
  }
  function stepTalk(dt) {
    if (!talk || talk.shown >= talk.full.length) return;
    talk.acc += dt * (talk.t.narr ? 48 : 40);
    var n = Math.min(talk.full.length, Math.floor(talk.acc));
    if (n > talk.shown) {
      talk.shown = n;
      dlgText.textContent = talk.full.slice(0, n);
      if (n - talk.last >= 3) { talk.last = n; if (!talk.t.narr) sfx("blip"); }
      if (n >= talk.full.length) { dlg.classList.add("done"); showOpts(); }
    }
  }
  // a little pixel portrait for people who don't have a painted one
  function bust(sp, key) {
    if (!sp) return null;
    var k = key + (sp === player.sp ? "|" + (O && O.fem ? "f" : "m") : "");
    if (busts[k]) return busts[k];
    var src = sp.f[0][0], w = src.width, h = src.height, d = src.getContext("2d").getImageData(0, 0, w, h).data, top = h;
    for (var y = 0; y < h && top === h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { top = y; break; }
    var c = A.cv(24, 22), g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, Math.max(0, top - 1), w, 22, 1, 1, w, 22);
    try { busts[k] = c.toDataURL(); } catch (e) { busts[k] = null; }
    return busts[k];
  }
  function pet(c) {
    if (c.mode !== "sleep") { c.walk = null; c.t = 4; }
    player.dir = player.x < c.x ? 3 : 2;
    for (var i = 0; i < 3; i++) parts.push({ k: "heart", x: c.x + rnd(-4, 4), y: c.y - 8, vx: rnd(-4, 4), vy: -14 - i * 3, life: -i * 0.25, max: 1.4 });
    sfx("meow");
    deedCheck({ cat: true });
  }

  /* ---------------- the place you are in ---------------- */
  function placeAt(x, y) {
    for (var i = 0; i < WD.PLACES.length; i++) { var r = WD.PLACES[i].r; if (x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return WD.PLACES[i]; }
    return null;
  }
  function placeText(P) {
    var D = WD.DAYS, sub = P.sub, bed = P.bed;
    if (P.id === "workshop" && day >= D.workshopOpen) { sub = P.subOpen; bed = P.bedOpen; }
    if (P.id === "garden" && day >= D.gardenOpen) sub = day >= D.gardenGreen ? P.subGreen : P.subOpen;
    if (time === "suhoor") { if (P.subSuhoor) sub = P.subSuhoor; if (P.bedSuhoor) bed = P.bedSuhoor; }
    return { name: P.name, sub: sub, bed: bed };
  }
  function checkPlace(dt) {
    if (RM || (O && O.title)) return;
    var P = placeAt(player.x, player.y), id = P ? P.id : null;
    if (id !== placeCand) { placeCand = id; placeT = 0; }
    placeT += dt;
    if (placeCand !== place && placeT > 0.4) {
      place = placeCand;
      if (!P) return;
      var info = placeText(P), a = audio();
      if (a && a.scene) a.scene(info.bed, time);
      if (intro || (bannerSeen[id] && T - bannerSeen[id] < 45)) return;
      bannerSeen[id] = T;
      showBanner(info.name, fmt(info.sub), "");
    }
  }
  function showBanner(name, sub, kind) {
    bannerQ = bannerQ.filter(function (b, i) { return i === 0 || b.kind; });
    bannerQ.push({ name: name, sub: sub, kind: kind });
    if (bannerQ.length === 1) nextBanner();
  }
  function nextBanner() {
    var b = bannerQ[0];
    if (!b) return;
    placeName.textContent = b.name; placeSub.textContent = b.sub || ""; placeSub.hidden = !b.sub;
    placeEl.className = "mp-place" + (b.kind ? " " + b.kind : "");
    void placeEl.offsetWidth;
    placeEl.classList.add("on");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () {
      placeEl.classList.remove("on");
      bannerTimer = setTimeout(function () { bannerQ.shift(); nextBanner(); }, 420);
    }, b.kind === "news" ? 4600 : 2700);
  }

  /* ---------------- life ---------------- */
  // someone with a round to walk: the musaharati through the hara at suhoor, the tea boy between the tables
  function stepRoute(a, dt) {
    var r = a.route, M = WD.MESA, pts = r.pts || (M && M.route) || [];
    if (!pts.length) return;
    if (!r.pts) { // the musaharati beats his drum as he goes: dum, dum, dum-dum
      r.drum = (r.drum == null ? 1 : r.drum) - dt;
      if (r.drum <= 0) {
        r.drum = a.path ? 2.4 : 1.6; a.kick = 0.22;
        var d = hyp(player.x, player.y, a.x, a.y), au = audio();
        if (d < 150 && au && au.fxv) au.fxv("baza", Math.max(0.12, 1 - d / 150));
      }
    }
    function stop() {
      if (r.pts) { r.wait = rnd(r.pause[0], r.pause[1]); a.dir = pts[r.i][2] != null ? pts[r.i][2] : a.dir; return; }
      // the musaharati stops, looks up at the windows and calls the names of the people who live there
      r.wait = 3.6; a.dir = 1;
      says = says.filter(function (s) { return s.a !== a; });
      if (pts[r.i][2]) says.push({ a: a, t: fmt(pts[r.i][2]), until: T + 3.2 });
      actors.forEach(function (k) { if (k.trail && k.trail.lead === a && Math.random() < 0.7) { k.jv = 70; k.emote = { k: "♪", t: 0 }; } });
    }
    if (r.first) { r.first = false; stop(); return; }
    if (a.path) { if (moveActor(a, dt)) stop(); return; }
    r.wait -= dt;
    if (r.wait <= 0) {
      r.i = (r.i + 1) % pts.length;
      var p = pts[r.i];
      a.path = findPath(a.x, a.y, p[0], p[1]);
      if (!a.path) r.wait = 1;
    }
  }
  function thinkActors(dt) {
    actors.forEach(function (a) {
      if (a === player) return;
      a.blink -= dt;
      if (a.blink < -0.13) a.blink = rnd(2.5, 5.5);
      if (a.emote) { a.emote.t += dt; if (a.emote.t > 1.6) a.emote = null; }
      if (a.follow && !cutOn && !a.scripted) { // walking along with you
        a.ft = (a.ft || 0) - dt;
        if (a.path) moveActor(a, dt);
        if (a.ft <= 0) {
          a.ft = 0.35;
          var fd = hyp(a.x, a.y, player.x, player.y);
          if (fd > 24) {
            var bx = player.x + (player.dir === 3 ? -14 : player.dir === 2 ? 14 : 6), by = player.y + (player.dir === 0 ? -10 : player.dir === 1 ? 10 : 2);
            a.path = findPath(a.x, a.y, bx, by); a.speed = SPEED * (fd > 60 ? 1.15 : 0.9);
          } else if (!a.path) { var fx = player.x - a.x, fy = player.y - a.y; a.dir = Math.abs(fx) > Math.abs(fy) ? (fx < 0 ? 2 : 3) : (fy < 0 ? 1 : 0); }
        }
        return;
      }
      if (a.scripted) { if (a.path) moveActor(a, dt); return; }
      if (a.pray) return;
      if (a.talking) return;
      if (a.route) { stepRoute(a, dt); return; }
      if (a.trail) { // a kid behind the musaharati, lantern up
        var ld = a.trail.lead;
        a.trail.t -= dt;
        if (a.path) moveActor(a, dt);
        if (a.trail.t <= 0) {
          a.trail.t = 0.4;
          var tx = ld.x + (ld.dir === 2 ? -a.trail.dx : a.trail.dx), ty = ld.y + a.trail.dy;
          if (hyp(a.x, a.y, tx, ty) > 7) { a.path = findPath(a.x, a.y, tx, ty); a.speed = SPEED * (hyp(a.x, a.y, tx, ty) > 30 ? 0.75 : 0.5); }
          else if (!a.path) a.dir = ld.moving ? ld.dir : (ld.x < a.x ? 2 : 3);
        }
        return;
      }
      if (a.dance != null) { // on their feet with the music: a step, a turn, a step
        a.dance += dt;
        a.danceF = ((a.dance * 4.2) | 0) % 4;
        var turn = ((a.dance / 1.1) | 0) % 4;
        a.dir = [0, 2, 0, 3][turn];
        return;
      }
      if (a.noTurn) { a.dir = 1; return; }
      if (a.work) { // Saber at his bench: tap, tap, sawdust
        a.work -= dt;
        if (a.work <= 0) {
          a.work = rnd(0.55, 1.1); a.kick = 0.16;
          for (var s = 0; s < 3; s++) parts.push({ k: "dust", x: a.x + rnd(-4, 4), y: a.y - 12, vx: rnd(-8, 8), vy: rnd(-10, -4), life: 0, max: rnd(0.4, 0.7), c: "#F2DEB0" });
          if (near(a.x, a.y, 40)) sfx("knock");
        }
        return;
      }
      if (a.serve) { // behind the ful cart: Sayed turns to his pot and ladles; Hamo flips ta'meya and the oil spits
        a.serve -= dt;
        if (a.serve <= 0) {
          if (a.serveK === "ful") {
            if (a.dir !== 2) {
              a.dir = 2; a.kick = 0.25; a.serve = rnd(0.6, 0.9);
              for (var q = 0; q < 2; q++) parts.push({ k: "dust", x: a.x - 10 + rnd(-2, 2), y: a.y - 30, vx: rnd(-3, 3), vy: rnd(-12, -7), life: 0, max: rnd(0.6, 0.9), c: "#F4EFE6" });
              if (near(a.x, a.y, 44)) sfx("ladle");
            } else { a.dir = 0; a.serve = rnd(1.6, 3.4); }
          } else {
            a.dir = 0; a.kick = 0.18; a.serve = rnd(0.7, 1.5);
            for (var o2 = 0; o2 < 3; o2++) parts.push({ k: "dust", x: a.x + rnd(-4, 4), y: a.y - 18, vx: rnd(-9, 9), vy: rnd(-14, -6), life: 0, max: rnd(0.25, 0.45), c: "#FFE6A0" });
          }
        }
        return;
      }
      if (a.kind === "walker") {
        if (a.path) { if (moveActor(a, dt)) { a.wait = rnd(1.5, 5); a.dir = (Math.random() * 4) | 0; } return; }
        a.wait -= dt;
        if (!a.chat) {
          for (var i = 0; i < actors.length; i++) {
            var b = actors[i];
            if (b !== a && b.kind === "walker" && !b.path && !b.chat && hyp(a.x, a.y, b.x, b.y) < 22 && Math.random() < 0.02) {
              a.chat = b.chat = rnd(3, 6); a.wait = b.wait = a.chat;
              var dx = b.x - a.x; a.dir = dx < 0 ? 2 : 3; b.dir = dx < 0 ? 3 : 2;
              a.emote = { k: "…", t: 0 }; break;
            }
          }
        } else { a.chat = Math.max(0, a.chat - dt); if (Math.random() < dt * 0.35) a.emote = { k: Math.random() < 0.6 ? "…" : "♪", t: 0 }; }
        if (a.wait <= 0) {
          a.chat = 0;
          var wp = WD.WAYPOINTS[(Math.random() * WD.WAYPOINTS.length) | 0];
          a.path = findPath(a.x, a.y, wp[0] + rnd(-8, 8), wp[1] + rnd(-4, 4));
          if (!a.path) a.wait = 1;
        }
        return;
      }
      if (a.play) return;
      if (a.path) { moveActor(a, dt); return; }
      var close = !a.sit && !a.clip && a.pose !== "roof" && hyp(player.x, player.y, a.x, a.y) < 30;
      if (close) {
        var dx2 = player.x - a.x, dy2 = player.y - a.y;
        a.dir = Math.abs(dx2) > Math.abs(dy2) ? (dx2 < 0 ? 2 : 3) : (dy2 < 0 ? 1 : 0);
        if (!a.greeted) { a.greeted = true; if (a.kind === "story" && Math.random() < 0.7) a.emote = { k: "!", t: 0 }; }
      } else {
        a.greeted = false;
        a.look -= dt;
        if (a.look < 0) {
          a.look = rnd(2.5, 7);
          if (a.sit || a.clip) return;
          a.dir = Math.random() < 0.55 ? a.homeDir : (Math.random() * 4) | 0;
          if (a.queue && Math.random() < 0.5) a.dir = 1;
        }
      }
    });
  }

  function thinkBall(dt) {
    if (!ball) return;
    var b = ball, g = 160, F = WD.FIELD;
    if (b.script) { // a kick in a scene: a set arc, it can stop in mid-air for a choice
      var sc = b.script, k = Math.min(1, (sc.t += dt) / sc.dur);
      if (sc.stop && k > sc.stop) k = sc.stop;
      b.x = sc.x0 + (sc.x1 - sc.x0) * k; b.y = sc.y0 + (sc.y1 - sc.y0) * k; b.z = sc.z0 + (sc.z1 - sc.z0) * k + sc.peak * 4 * k * (1 - k);
      if ((k >= 1 || (sc.stop && k >= sc.stop)) && sc.res) { var rr = sc.res; sc.res = null; if (k >= 1 && sc.bounce) sfx("bounce"); rr(); }
      return;
    }
    if (b.frozen) { if (b.holder) { b.x = b.holder.x + (b.holder.dir === 2 ? -5 : 5); b.y = b.holder.y + 1; b.z = 0; } return; }
    if (b.holder) {
      var h = b.holder, o = b.other;
      if (h.path) moveActor(h, dt * 1.5);
      b.x = h.x + (h.dir === 2 ? -5 : 5); b.y = h.y + 1; b.z = 0;
      if (h.path) return;
      var dx = o.x - h.x; h.dir = dx < 0 ? 2 : 3;
      if (!o.path) o.dir = dx < 0 ? 3 : 2;
      b.wait -= dt;
      if (b.wait <= 0) {
        var tx = o.x + rnd(-10, 10), ty = clamp(o.y + rnd(-8, 8), F.y0 + 2, F.y1 - 2), d = hyp(b.x, b.y, tx, ty), ft = clamp(d / 75, 0.5, 1.2);
        var lob = Math.random() < 0.4;
        b.vx = (tx - b.x) / ft; b.vy = (ty - b.y) / ft; b.vz = lob ? g * ft / 2 : 0; b.holder = null;
        h.kick = 0.25;
        if (near(b.x, b.y, 120)) sfx("bounce");
      }
      return;
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= g * dt;
    if (b.z <= 0) {
      b.z = 0;
      if (Math.abs(b.vz) > 18) { b.vz = -b.vz * 0.38; b.vx *= 0.8; b.vy *= 0.8; if (near(b.x, b.y, 100)) sfx("bounce"); }
      else { b.vz = 0; var fr = Math.pow(0.35, dt); b.vx *= fr; b.vy *= fr; }
    }
    if (b.x < F.x0 || b.x > F.x1) b.vx = -b.vx;
    if (b.y < F.y0 || b.y > F.y1) b.vy = -b.vy;
    b.x = clamp(b.x, F.x0, F.x1); b.y = clamp(b.y, F.y0, F.y1);
    var o2 = b.other;
    if (Math.hypot(b.vx, b.vy) < 34 && b.z === 0 && !o2.path && hyp(o2.x, o2.y, b.x, b.y) > 7) o2.path = findPath(o2.x, o2.y, b.x + (b.vx > 0 ? 4 : -4), b.y);
    if (o2.path) moveActor(o2, dt * 1.7);
    if (hyp(o2.x, o2.y, b.x, b.y) < 8 && b.z < 3) {
      o2.path = null; o2.moving = false; o2.frame = 0;
      b.holder = o2; b.other = b.kids[0] === o2 ? b.kids[1] : b.kids[0]; b.wait = rnd(0.6, 1.6); b.vx = b.vy = b.vz = 0;
      var k2 = b.other;
      if (Math.random() < 0.5 && !k2.path) k2.path = findPath(k2.x, k2.y, clamp(k2.x + rnd(-20, 20), F.x0 + 6, F.x1 - 6), clamp(k2.y + rnd(-12, 12), F.y0 + 4, F.y1 - 4));
    }
    if (b.other.path && b.holder === null && b.other !== o2) moveActor(b.other, dt);
  }

  function thinkCats(dt) {
    cats.forEach(function (c) {
      c.t -= dt;
      if (c.mode === "sleep") { c.zt -= dt; if (c.zt < 0) { c.zt = 2.2; parts.push({ k: "z", x: c.x + 3, y: c.y - 7, vx: 3, vy: -6, life: 0, max: 2 }); } return; }
      if (c.walk) {
        var dx = c.walk[0] - c.x, dy = c.walk[1] - c.y, d = Math.hypot(dx, dy), st = 16 * dt;
        c.dir = dx < 0 ? 0 : 1; c.ft = (c.ft || 0) + dt;
        if (d < st) { c.walk = null; c.t = rnd(2, 6); } else { c.x += dx / d * st; c.y += dy / d * st; }
        return;
      }
      if (c.t <= 0) {
        if ((c.mode === "wander" || c.mode === "beg") && c.area) { var r = c.area; c.walk = [r[0] + rnd(0, r[2]), r[1] + rnd(0, r[3])]; }
        else { c.dir = 1 - c.dir; c.t = rnd(3, 7); }
      }
    });
  }

  function thinkPigeons(dt) {
    pigeons.forEach(function (p) {
      p.t -= dt;
      if (p.st === "peck") {
        var scare = player.moving && hyp(p.x, p.y, player.x, player.y) < 24;
        if (!scare) actors.forEach(function (a) { if (a.kind === "walker" && a.moving && hyp(p.x, p.y, a.x, a.y) < 14) scare = true; });
        if (scare) {
          var ax = p.x - player.x, ay = p.y - player.y, d = Math.hypot(ax, ay) || 1;
          p.st = "fly"; p.vx = ax / d * rnd(40, 60) + rnd(-10, 10); p.vy = ay / d * rnd(10, 20) - 8; p.vz = rnd(40, 60); p.t = rnd(2.5, 4); p.dir = p.vx < 0 ? 0 : 1;
          if (T - lastFlap > 0.6) { lastFlap = T; sfx("flutter"); }
          return;
        }
        if (p.t < 0) { p.t = rnd(0.3, 1.6); p.f = p.f ? 0 : 1; if (Math.random() < 0.3) { p.x += rnd(-3, 3); p.dir = Math.random() < 0.5 ? 0 : 1; } }
        return;
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.f = ((T * 10 + p.hx) | 0) % 2 ? 2 : 3;
      if (p.t > 0) p.vz = Math.max(0, p.vz - 30 * dt);
      else {
        var dx = p.hx - p.x, dy = p.hy - p.y, dd = Math.hypot(dx, dy) || 1;
        p.vx += (dx / dd * 60 - p.vx) * dt * 1.5; p.vy += (dy / dd * 30 - p.vy) * dt * 1.5; p.vz = -Math.min(30, p.z * 1.2);
        p.dir = p.vx < 0 ? 0 : 1;
        if (dd < 4 && p.z < 2) { p.st = "peck"; p.z = 0; p.x = p.hx; p.y = p.hy; p.t = 1; p.f = 0; }
      }
      if (p.z < 0) p.z = 0;
    });
  }

  function dust(x, y) { for (var i = 0; i < 2; i++) parts.push({ k: "dust", x: x + rnd(-3, 3), y: y - 1, vx: rnd(-6, 6), vy: rnd(-6, -2), life: 0, max: rnd(0.35, 0.6) }); }
  function near(x, y, m) { return x > cam.x - m && x < cam.x + viewW + m && y > cam.y - m && y < cam.y + viewH + m; }
  function stepParts(dt) {
    emitters.forEach(function (e) {
      if (!near(e.x, e.y, 30)) return;
      e.t -= dt;
      if (e.t > 0) return;
      e.t = e.every * rnd(0.7, 1.3);
      if (e.k === "steam") parts.push({ k: "steam", x: e.x + rnd(-3, 3), y: e.y, vx: rnd(-2, 3), vy: rnd(-12, -8), life: 0, max: rnd(1.2, 1.8) });
      else if (e.k === "smoke") parts.push({ k: "smoke", x: e.x + rnd(-2, 2), y: e.y, vx: rnd(1, 5), vy: rnd(-11, -7), life: 0, max: rnd(1.8, 2.8) });
      else if (e.k === "puff") for (var i = 0; i < 3; i++) parts.push({ k: "smoke", x: e.x + rnd(-1, 1), y: e.y, vx: rnd(0, 4), vy: rnd(-7, -4), life: -i * 0.2, max: rnd(1.6, 2.2), soft: 1 });
      else if (e.k === "spark") parts.push({ k: "spark", x: e.x + rnd(-8, 8), y: e.y, vx: rnd(-4, 4), vy: rnd(-26, -14), life: 0, max: rnd(0.4, 0.8) });
      else if (e.k === "ember") parts.push({ k: "spark", x: e.x + rnd(-5, 5), y: e.y + 2, vx: rnd(-2, 2), vy: rnd(-10, -5), life: 0, max: rnd(0.3, 0.6) });
      else if (e.k === "drip") parts.push({ k: "drop", x: e.x + rnd(-1, 1), y: e.y, vx: 0, vy: 18, life: 0, max: 0.45 });
    });
    if (TM.motes && parts.length < 240 && Math.random() < dt * 9) parts.push({ k: "mote", x: cam.x + rnd(0, viewW), y: cam.y + rnd(0, viewH), vx: rnd(2, 5), vy: rnd(-3, 1), life: 0, max: rnd(3, 6), ph: rnd(0, 6) });
    // leaves drifting down from the big trees
    canopies.forEach(function (p) {
      var sp = propSprite(p);
      if (!near(p.x + sp.width / 2, p.y, 40) || Math.random() > dt * 0.7) return;
      parts.push({ k: "leaf", x: p.x + rnd(12, sp.width - 12), y: p.y - rnd(4, 20), vx: rnd(-4, 4), vy: rnd(5, 9), life: 0, max: rnd(3.5, 5), ph: rnd(0, 6), c: ["#6EBE58", "#9AB04A", "#C9A84A", "#4C9A4C"][(Math.random() * 4) | 0] });
    });
    // secrets twinkle now and then, for whoever looks closely
    if (!RM && Math.random() < dt * 0.9) WD.SECRETS.forEach(function (s) { if (!memories[s.id] && near(s.at[0], s.at[1], 0) && Math.random() < 0.35) parts.push({ k: "twinkle", x: s.at[0] + rnd(-5, 5), y: s.at[1] + rnd(-5, 5), vx: 0, vy: -2, life: 0, max: 0.9 }); });
    // the café radio at night
    // a kid waving a sparkler (شمروخ): gold sparks in every direction
    actors.forEach(function (a) {
      if (!a.sparkle || !near(a.x, a.y, 20) || Math.random() > dt * 22) return;
      var hx = a.x + (a.dir === 2 ? -6 : 6) + Math.sin(T * 7) * 2, hy = a.y - (a.sp.kid ? 22 : 27) + Math.cos(T * 7) * 2;
      parts.push({ k: "spark", x: hx, y: hy, vx: rnd(-22, 22), vy: rnd(-26, 8), life: 0, max: rnd(0.25, 0.5) });
    });
    // music spilling out of a place (the suhoor tent): notes rising over it, and now and then a pop of confetti
    props.forEach(function (p) {
      if (!p.notes || !near(p.x + p.notes[0], p.y + p.notes[1], 30)) return;
      if (Math.random() < dt * 1.6) parts.push({ k: "note", x: p.x + p.notes[0] + rnd(-p.notes[2], p.notes[2]), y: p.y + p.notes[1], vx: rnd(-4, 4), vy: rnd(-12, -8), life: 0, max: rnd(1.8, 2.6) });
      if (p.confetti && Math.random() < dt * 0.12) burst("confetti", p.x + p.confetti[0], p.y + p.confetti[1], 8);
    });
    if (dark() && Math.random() < dt * 0.35) { var cf = houseBy("cafe"); if (cf && near(cf.x + 40, cf.base - 20, 20)) parts.push({ k: "note", x: cf.x + rnd(16, 70), y: cf.base - 26, vx: rnd(-3, 3), vy: -8, life: 0, max: 2.2 }); }
    for (var i2 = parts.length - 1; i2 >= 0; i2--) {
      var p = parts[i2];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i2, 1); continue; }
      if (p.life < 0) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === "smoke" || p.k === "steam") p.vx += dt * 2;
      if (p.k === "spark") p.vy += dt * 10;
      if (p.k === "dust") p.vy += dt * 20;
      if (p.k === "leaf") p.vx = Math.sin(T * 2.2 + p.ph) * 8;
      if (p.k === "drop") p.vy += dt * 80;
      if (p.k === "confetti") { p.vy += dt * 60; p.vx *= Math.pow(0.4, dt); }
    }
    rings = rings.filter(function (r) { r.t += dt; return r.t < 0.6; });
  }

  function stepSky(dt) {
    clouds.forEach(function (c) { c.x += c.s * dt; if (c.x > W + 10) { c.x = -c.w - rnd(0, 60); c.y = rnd(8, 58); } });
    if (!dark() && !skyBirds.length && Math.random() < dt * 0.06) {
      var dir = Math.random() < 0.5 ? 1 : -1, y = rnd(14, 50);
      for (var i = 0; i < 4 + ((Math.random() * 3) | 0); i++) skyBirds.push({ x: dir > 0 ? -20 - i * 9 : W + 20 + i * 9, y: y + (i % 2) * 5 + i * 2, v: dir * rnd(16, 20), ph: rnd(0, 6) });
    }
    skyBirds.forEach(function (b) { b.x += b.v * dt; });
    skyBirds = skyBirds.filter(function (b) { return b.x > -80 && b.x < W + 80; });
    coopBirds.forEach(function (b) { b.a += b.s * dt; });
  }

  /* ---------------- camera ---------------- */
  function measure() {
    var keep = viewW > 1 ? { x: cam.x + viewW / 2, y: cam.y + viewH / 2 } : null;
    cssW = Math.max(1, root.clientWidth); cssH = Math.max(1, root.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    baseK = Math.max(2, Math.round(Math.min(dpr * cssW / 190, dpr * cssH / 250)));
    cvs.width = Math.round(cssW * dpr); cvs.height = Math.round(cssH * dpr);
    lightC.width = Math.ceil(cssW / LS); lightC.height = Math.ceil(cssH / LS);
    glowC.width = lightC.width; glowC.height = lightC.height;
    applyZoom(keep);
  }
  // the scenes zoom in: K is the size of one art pixel on screen
  function applyZoom(c) {
    c = c || { x: cam.x + viewW / 2, y: cam.y + viewH / 2 };
    K = baseK * zoom; viewW = cvs.width / K; viewH = cvs.height / K;
    cam.x = c.x - viewW / 2; cam.y = c.y - viewH / 2;
    clampCam();
  }
  function clampCam() {
    cam.x = viewW >= W ? (W - viewW) / 2 : clamp(cam.x, 0, W - viewW);
    // while someone talks the box covers the bottom of the screen, so the camera may go that far past the bottom edge
    // (otherwise whoever stands near a room's front wall would be talking from under the box)
    cam.y = viewH >= HG ? clamp(cam.y, (HG - viewH) / 2, (HG - viewH) / 2 + liftNow) : clamp(cam.y, 0, HG - viewH + liftNow);
  }
  function camTarget() {
    var lead = player.moving ? 10 : 0, lx = player.dir === 2 ? -lead : player.dir === 3 ? lead : 0, ly = player.dir === 1 ? -lead : player.dir === 0 ? lead : 0;
    return { x: player.x - viewW / 2 + lx, y: player.y - 16 - viewH * 0.5 + ly + liftNow };
  }
  function snapCam() { var t = camTarget(); cam.x = t.x; cam.y = t.y; clampCam(); }
  function pointOf(on) {
    if (!on) return null;
    if (typeof on === "string" && on.indexOf("+") > 0) on = on.split("+");
    if (Array.isArray(on) && typeof on[0] === "number") return { x: on[0], y: on[1] };
    if (Array.isArray(on)) {
      var ps = on.map(pointOf).filter(Boolean);
      if (!ps.length) return null;
      return { x: ps.reduce(function (a, p) { return a + p.x; }, 0) / ps.length, y: ps.reduce(function (a, p) { return a + p.y; }, 0) / ps.length };
    }
    var a = findActor(on);
    return a ? { x: a.x, y: a.y - 14 - (a.jz || 0) } : null;
  }
  function follow(dt) {
    var f = 1 - Math.exp(-dt * 4);
    var liftGoal = talk && !dlg.hidden ? Math.min(viewH * 0.3, dlg.offsetHeight * dpr / K * 0.5) : 0;
    liftNow += (liftGoal - liftNow) * f;
    if (shot) {
      var k = shot.dur ? clamp((performance.now() - shot.t0) / shot.dur, 0, 1) : 1, e = ease(k);
      var tp = shot.track ? pointOf(shot.track) : null, tx = tp ? tp.x : shot.x1, ty = tp ? tp.y : shot.y1;
      zoom = shot.z0 + (shot.z1 - shot.z0) * e;
      K = baseK * zoom; viewW = cvs.width / K; viewH = cvs.height / K;
      var cx = shot.x0 + (tx - shot.x0) * e, cy = shot.y0 + (ty - shot.y0) * e;
      cam.x = cx - viewW / 2; cam.y = cy - viewH / 2 + liftNow;
      clampCam();
      if (k >= 1 && shot.res) { var r = shot.res; shot.res = null; r(); }
      return;
    }
    if (Math.abs(zoom - zoomGoal) > 0.002) { zoom += (zoomGoal - zoom) * (1 - Math.exp(-dt * 3)); if (Math.abs(zoom - zoomGoal) < 0.003) zoom = zoomGoal; applyZoom(); }
    if (O && O.title) { // the title screen drifts slowly over the rooftops
      var tt = T * 0.05, tgx = 300 + Math.sin(tt) * 170 - viewW / 2, tgy = 330 + Math.sin(tt * 0.63) * 150 - viewH / 2;
      cam.x += (tgx - cam.x) * f * 0.4; cam.y += (tgy - cam.y) * f * 0.4; clampCam();
      return;
    }
    if (camFree && !cutOn) return;
    var tgt = camTarget(), f2 = 1 - Math.exp(-dt * 4.5);
    cam.x += (tgt.x - cam.x) * f2; cam.y += (tgt.y - cam.y) * f2;
    clampCam();
  }

  /* ---------------- drawing ---------------- */
  function X(x) { return Math.round((x - cam.x) * K); }
  function Y(y) { return Math.round((y - cam.y) * K); }
  function img(c, x, y) { var x0 = X(x), y0 = Y(y); ctx.drawImage(c, x0, y0, X(x + c.width) - x0, Y(y + c.height) - y0); }
  function rect(x, y, w, h, col) { var x0 = X(x), y0 = Y(y); ctx.fillStyle = col; ctx.fillRect(x0, y0, X(x + w) - x0, Y(y + h) - y0); }
  function visible(x0, y0, x1, y1) { return x1 > cam.x - 4 && x0 < cam.x + viewW + 4 && y1 > cam.y - 4 && y0 < cam.y + viewH + 4; }
  function seen(x, y) { return visible(x - 10, y - 34, x + 10, y + 4); } // could you see someone standing here?
  function text(t, wx, wy, hpx, fg, font) {
    if (!fontsReady) return;
    var x = X(wx), y = Y(wy), size = Math.round(hpx * K * 0.78);
    ctx.font = font === "sans" ? ("600 " + Math.round(hpx * K * 0.86) + 'px "IBM Plex Sans Arabic", sans-serif') : font || ("700 " + size + 'px "Aref Ruqaa", serif');
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(30,15,20,0.45)"; ctx.fillText(t, x, y + Math.max(1, K / 2));
    ctx.fillStyle = fg; ctx.fillText(t, x, y);
  }

  // what a room's own drawings get to paint with, in art pixels
  var RAo = { rect: function (x, y, w, h, c) { rect(x, y, w, h, c); }, img: function (c, x, y) { img(c, x, y); }, text: function (t, x, y, h, fg, f) { text(t, x, y, h, fg, f); }, alpha: function (a) { ctx.globalAlpha = a; } };
  function RA() { RAo.T = T; RAo.on = lightsOn; RAo.time = time; RAo.day = day; RAo.st = RM ? RM.st : {}; return RAo; }
  // what a room's tick (RM.tick) may do with its people: the crowd in the tent cheers the dancer
  var roomApi = {
    actors: function () { return actors; },
    by: function (id) { return actors.filter(function (a) { return a.cid === id; })[0] || null; },
    emote: function (a, k) { if (a && !a.talking && bubbles[k]) a.emote = { k: k, t: 0 }; },
    say: function (a, t, s) { if (!a || a.talking) return; says = says.filter(function (x) { return x.a !== a; }); says.push({ a: a, t: fmt(t), until: T + (s || 2) }); },
    jump: function (a) { if (a && !a.talking) { a.jv = 66; a.jz = Math.max(0.01, a.jz || 0); } },
    sfx: function (n, v) { var au = audio(); if (au && au.fxv) au.fxv(n, v == null ? 1 : v); },
    burst: function (k, x, y, n) { burst(k, x, y, n); },
    note: function (x, y) { parts.push({ k: "note", x: x + rnd(-3, 3), y: y, vx: rnd(-4, 4), vy: -10, life: 0, max: 2 }); },
    busy: function () { return !!talk || cutOn; },
    dist: function (x, y) { return hyp(player.x, player.y, x, y); }
  };
  function drawGround() {
    if (RM) {
      (RM.fixtures || []).forEach(function (f) { if (f.layer === "under") f.draw(RA()); });
      img(RM.ground, 0, 0);
      (RM.fixtures || []).forEach(function (f) { if (f.layer === "wall") f.draw(RA()); });
      return;
    }
    var sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(groundTop, Math.floor(cam.y));
    var sw = Math.min(W - sx, Math.ceil(viewW) + 2), sh = Math.min(HG - sy, Math.ceil(viewH) + 2);
    if (sw > 0 && sh > 0) ctx.drawImage(G.ground, sx, sy, sw, sh, X(sx), Y(sy), X(sx + sw) - X(sx), Y(sy + sh) - Y(sy));
    props.forEach(function (p) { if (!p.decal) return; var sp = propSprite(p); if (visible(p.x, p.y, p.x + sp.width, p.y + sp.height)) img(sp, p.x, p.y); });
    // leaf shadows and flecks of sun under the trees
    dapples.forEach(function (d) {
      var p = d.p, gx = p.x, gy = p.y - 14;
      if (!visible(gx, gy, gx + d.w, gy + d.h)) return;
      img(d.c, gx + Math.round(Math.sin(T * 0.6 + p.x) * 1), gy);
      if (TM.flecks) {
        ctx.globalAlpha = 0.2;
        d.flecks.forEach(function (f) { var s = 0.6 + 0.4 * Math.sin(T * 0.9 + f[3]); if (s > 0.45) rect(gx + f[0] + Math.round(Math.sin(T * 0.7 + f[3]) * 1.5), gy + f[1], f[2], 1, "#FFF4D0"); });
        ctx.globalAlpha = 1;
      }
    });
  }
  function drawSky() {
    if (RM || cam.y > 150) return;
    if (skyOld && skyFade < 1) { img(skyOld, 0, 0); ctx.globalAlpha = skyFade; img(sky, 0, 0); ctx.globalAlpha = 1; }
    else img(sky, 0, 0);
    if (dark()) for (var i = 0; i < 18; i++) { var tw = Math.sin(T * 2 + i * 1.7); if (tw > 0.3) rect((i * 97 + 31) % W, (i * 53 + 11) % 90, 1, 1, tw > 0.8 ? "#FFFFFF" : "#C9CDF0"); }
    var cc = CLOUD[time] || CLOUD.asr;
    clouds.forEach(function (c) {
      var x = Math.round(c.x), y = Math.round(c.y);
      rect(x + 2, y + 4, c.w - 4, 3, cc[1]);
      rect(x, y + 2, c.w, 3, cc[0]); rect(x + 6, y, Math.round(c.w * 0.45), 3, cc[0]); rect(x + Math.round(c.w * 0.45), y - 2, Math.round(c.w * 0.35), 4, cc[0]);
    });
    skyBirds.forEach(function (b) {
      var up = Math.sin(T * 9 + b.ph) > 0, x = Math.round(b.x), y = Math.round(b.y), col = time === "maghrib" ? "#3A2440" : "#4A4058";
      rect(x, y, 1, 1, col); rect(x + 1, y + (up ? -1 : 1), 1, 1, col); rect(x - 1, y + (up ? -1 : 1), 1, 1, col);
    });
  }

  function drawHouse(b) {
    img(b.canvas, b.x, b.y);
    var o = b.out;
    if (lightsOn > 0.02) {
      ctx.globalAlpha = Math.min(1, lightsOn * 1.1);
      o.win.forEach(function (w, i) {
        if (!w.glow) return;
        var x = b.x + w.x, y = b.y + w.y;
        if (w.glow === "tv") rect(x + 2, y + 1, w.w - 4, w.h - 1, ["#9EC8FF", "#C8E0FF", "#7AA8F0", "#E0F0FF"][((T * 3 + i) | 0) % 4]);
        else if (w.glow === "slit") { for (var j = 1; j < w.h; j += 2) rect(x, y + j, w.w, 1, "#FFC86A"); }
        else { rect(x + 2, y + 1, w.w - 4, w.h - 1, "#FFD98A"); rect(x + 2, y + w.h - 3, w.w - 4, 2, "#FFC064"); }
      });
      ctx.globalAlpha = 1;
    }
    o.fire.forEach(function (f) {
      var x = b.x + f.x, y = b.y + f.y;
      for (var i = 0; i < 8; i++) { var fx = x + 1 + ((i * 2 + ((T * 13 + i) | 0)) % (f.w - 2)), fh = 2 + (((T * 17 + i * 3) | 0) % 4); rect(fx, y + f.h - fh - 1, 1, fh, fh > 3 ? "#FFE680" : "#FF9A2A"); }
    });
    o.tv.forEach(function (t, i) { rect(b.x + t.x, b.y + t.y, t.w, t.h, ["#9EC8FF", "#E0F0FF", "#6A9AE8", "#C8E0FF", "#F2C88A"][((T * 2.5 + i) | 0) % 5]); rect(b.x + t.x + 2, b.y + t.y + t.h - 3, t.w - 4, 1, "#FFFFFF"); });
    o.decor.forEach(function (d) {
      if (d.k === "laundry") drawLaundry(b.x + d.x0, b.x + d.x1, b.y + d.y, d.seed);
      else if (d.k === "garland" && (b.id.charCodeAt(1) % 2)) drawGarland(b.x + d.x0 + 2, b.x + d.x1 - 2, b.y + d.y, d.sag);
      else if (d.k === "wallLamp") drawWallLamp(b.x + d.x, b.y + d.y);
      else if (d.k === "kidsroof") drawRoofLights(b);
      else if (d.k === "fanous") drawFanous(b.x + d.x, b.y + d.y, d.c, b.x);
      else if (d.k === "bulbs") drawBulbs(b.x + d.x0, b.x + d.x1, b.y + d.y, d.sag);
    });
    if (b.nemat && (time === "asr" || time === "pre")) drawBasket(b);
    drawSigns(b);
  }
  function drawMosque(m) {
    img(m.canvas, m.x, m.y);
    if (lightsOn > 0.02) {
      ctx.globalAlpha = lightsOn;
      m.out.win.forEach(function (w) {
        var x = m.x + w.x, y = m.y + w.y;
        for (var gy = 0; gy < w.h; gy += 3) for (var gx = 1; gx < w.w; gx += 3) rect(x + gx, y + gy, 2, 2, "#FFE7A8");
      });
      ctx.globalAlpha = 1;
    }
    m.out.decor.forEach(function (d) { if (d.k === "fanous") drawFanous(m.x + d.x, m.y + d.y, d.c, d.x); });
    drawSigns(m);
  }
  function drawMinaret(mn) {
    img(mn.canvas, mn.x, mn.y);
    if (lightsOn > 0.02) {
      ctx.globalAlpha = lightsOn;
      mn.rings.forEach(function (r) { for (var x = -r.hw; x <= r.hw; x += 2) rect(r.x + x, r.y + 1, 1, 1, (x / 2 + ((T * 4) | 0)) % 3 ? "#7CFFB0" : "#E8FFF0"); });
      ctx.globalAlpha = 1;
    }
  }
  function drawProp(p) {
    var v = "";
    if (p.sway) { var s = Math.sin(T * 1.3 + p.x); v = s > 0.55 ? "sway1" : s < -0.55 ? "sway-1" : ""; }
    if (p.k === "iftarTable") v = time === "maghrib" ? "diners" : time === "pre" ? "set" : "";
    if (p.setBy) v = "#" + setOf(p.setBy);
    var sp = propSprite(p, v), top = propTop(p, sp);
    if (p.under) p.under(RA(), p.x, top, p); // what you see through an opening in it (the tent's doorway)
    img(sp, p.x, top);
    if (p.anim) p.anim(RA(), p.x, top, p); // things that move on a prop: bulbs chasing round a sign, puppets
    if (p.sign) text(p.sign.t, p.x + p.sign.dx, p.y + p.sign.dy, p.sign.h, p.sign.fg || "#FFE7A0");
    if (p.k === "kiosk" && lightsOn > 0.3) { ctx.globalAlpha = 0.5 * lightsOn; rect(p.x + 17, top + 13, 4, 1, "#FFFFFF"); ctx.globalAlpha = 1; }
    if (p.k === "tvCab") drawTv(p.x + 3, top + 2);
  }
  // what's on TV (24 x 13): a cooking show in the afternoon, the mosque before maghrib and the adhan at sunset,
  // the Ramadan series at night, cutting between its shots
  function drawTv(x, y) {
    var t = T, i;
    if (time === "asr") {
      rect(x, y, 24, 13, "#8ED0C4"); for (i = 0; i < 24; i += 4) rect(x + i, y, 1, 9, "#7ABCB0"); rect(x, y + 9, 24, 4, "#E8E2D6"); rect(x, y + 9, 24, 1, "#C8C0B4");
      rect(x + 5, y + 1, 4, 2, "#FFFFFF"); rect(x + 5, y + 3, 4, 3, "#D9A27A"); rect(x + 6, y + 4, 1, 1, "#3A2E3A"); rect(x + 8, y + 4, 1, 1, "#3A2E3A"); rect(x + 4, y + 6, 6, 3, "#FFFFFF"); // the chef
      var stir = Math.round(Math.sin(t * 5)); rect(x + 10 + stir, y + 5, 1, 4, "#8A5A3A");
      rect(x + 11, y + 7, 7, 3, "#5A5A66"); rect(x + 11, y + 7, 7, 1, "#E89A3A"); // the pot
      for (i = 0; i < 3; i++) { var sy = (t * 4 + i * 3) % 6; rect(x + 12 + i * 2, y + 6 - Math.round(sy), 1, 1, "rgba(255,255,255," + (0.8 - sy / 8).toFixed(2) + ")"); }
      rect(x + 1, y + 1, 2, 2, "#E8503F");
    } else if (time === "pre" || time === "maghrib") {
      rect(x, y, 24, 4, "#4A3A6A"); rect(x, y + 4, 24, 3, "#C8606A"); rect(x, y + 7, 24, 3, "#F2A060"); rect(x, y + 10, 24, 3, "#2A1E30");
      rect(x + 7, y + 5, 10, 5, "#2A1E30"); rect(x + 9, y + 3, 6, 3, "#2A1E30"); rect(x + 11, y + 2, 2, 1, "#2A1E30"); rect(x + 19, y + 1, 2, 9, "#2A1E30"); rect(x + 18, y + 3, 4, 1, "#2A1E30"); // dome and minaret
      rect(x + 3, y + 1, 1, 1, "#FFF0C0"); rect(x + 2, y + 2, 1, 1, "#FFF0C0");
      if (time === "maghrib" || ((t * 1.2) | 0) % 2) { rect(x + 10, y + 7, 1, 1, "#FFD25A"); rect(x + 13, y + 7, 1, 1, "#FFD25A"); rect(x + 19, y + 4, 2, 1, "#7AF0A0"); }
    } else {
      var shot = ((t / 3.4) | 0) % 4, talk = ((t * 6) | 0) % 2;
      if (shot === 0) { // two of them in a living room, arguing kindly
        rect(x, y, 24, 13, "#C8906A"); rect(x + 9, y + 2, 6, 5, "#2A3A6A"); rect(x + 10, y + 3, 1, 1, "#FFE7A0"); rect(x, y + 10, 24, 3, "#7A4A3A");
        rect(x + 3, y + 3, 3, 3, "#D9A27A"); rect(x + 3, y + 3, 3, 1, "#2A1E26"); rect(x + 2, y + 6, 5, 6, "#3A5A8A"); if (talk) rect(x + 4, y + 5, 1, 1, "#7A3A3A");
        rect(x + 17, y + 3, 3, 3, "#D9A27A"); rect(x + 16, y + 2, 5, 2, "#B5473B"); rect(x + 16, y + 3, 1, 3, "#B5473B"); rect(x + 16, y + 6, 5, 6, "#B5473B"); if (!talk) rect(x + 18, y + 5, 1, 1, "#7A3A3A");
      } else if (shot === 1) { // close on her face
        rect(x, y, 24, 13, "#5A4A6A"); rect(x + 7, y + 1, 10, 12, "#B5473B"); rect(x + 9, y + 3, 6, 8, "#D9A27A");
        var bl = ((t * 2) | 0) % 5 === 0; rect(x + 10, y + 6, 1, bl ? 1 : 1, bl ? "#B8846A" : "#2A1E26"); rect(x + 13, y + 6, 1, 1, bl ? "#B8846A" : "#2A1E26");
        if (((t * 1.5) | 0) % 3 === 1) rect(x + 10, y + 7, 1, 2, "#9AD0F0"); // a tear
        rect(x + 11, y + 9, 2, 1, "#8A4A4A");
      } else if (shot === 2) { // the hara at night, lanterns swinging
        rect(x, y, 24, 13, "#1E2448"); rect(x, y + 9, 24, 4, "#4A3A4A"); rect(x, y + 3, 5, 7, "#8A6A5A"); rect(x + 19, y + 2, 5, 8, "#7A5A6A");
        for (i = 0; i < 4; i++) rect(x + 6 + i * 4, y + 3 + Math.round(Math.sin(t * 2 + i)), 2, 2, ["#FFD25A", "#E8503F", "#4CBF73", "#4F97E8"][i]);
        rect(x + 20, y + 4, 1, 1, "#FFE7A0"); rect(x + 2, y + 5, 1, 1, "#FFE7A0");
      } else { // close on the old man
        rect(x, y, 24, 13, "#6A5A4A"); rect(x + 8, y + 2, 8, 9, "#C89070"); rect(x + 8, y + 1, 8, 2, "#E8E2D6");
        rect(x + 10, y + 5, 1, 1, "#2A1E26"); rect(x + 13, y + 5, 1, 1, "#2A1E26"); rect(x + 9, y + 7, 6, 1, "#E8E2D6"); if (talk) rect(x + 11, y + 8, 2, 1, "#7A3A3A");
        rect(x + 7, y + 11, 10, 2, "#3A3550");
      }
    }
    ctx.globalAlpha = 0.18; rect(x, y, 24, 1, "#FFFFFF"); rect(x, y + 2 + (((t * 20) | 0) % 11), 24, 1, "#FFFFFF"); ctx.globalAlpha = 1; // glass and a scan line
  }
  function drawSigns(b) {
    if (!fontsReady || !b.out.signs.length) return;
    b.out.signs.forEach(function (s) {
      var x = X(b.x + s.x + s.w / 2), y = Y(b.y + s.y + s.h / 2 + 0.6), size = Math.round(s.h * K * (s.small ? 0.9 : 0.78));
      ctx.font = (s.small ? "600 " : "700 ") + size + (s.small ? 'px "IBM Plex Sans Arabic", sans-serif' : 'px "Aref Ruqaa", serif');
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(30,15,20,0.45)"; ctx.fillText(s.t, x, y + Math.max(1, K / 2));
      ctx.fillStyle = s.fg; ctx.fillText(s.t, x, y);
    });
  }
  function drawLaundry(x0, x1, y, seed) {
    rect(x0, y - 10, 1, 14, "#6A5A50"); rect(x1, y - 10, 1, 14, "#6A5A50");
    var cols = ["#E8503F", "#F4EFE4", "#4F97E8", "#F2C14A", "#4CBF73", "#E86AA0", "#2F5D9A"];
    for (var x = x0 + 1; x < x1; x++) rect(x, y - 10 + Math.round(Math.sin((x - x0) / (x1 - x0) * Math.PI) * 2), 1, 1, "#4A3E3A");
    for (var i = 0, cx = x0 + 3; cx < x1 - 4; i++) {
      var w = 3 + ((seed + i * 7) % 3), h = 4 + ((seed + i * 5) % 4), c = cols[(seed + i) % cols.length];
      var sy = y - 10 + Math.round(Math.sin((cx - x0) / (x1 - x0) * Math.PI) * 2) + 1, sw = Math.round(Math.sin(T * 2.4 + i + seed) * 1.2);
      rect(cx, sy, w, h - 1, c); rect(cx + sw, sy + h - 1, w, 1, A.dk(c, 0.2));
      cx += w + 2;
    }
  }
  function drawGarland(x0, x1, y, sag) {
    for (var x = x0; x <= x1; x++) { var t = (x - x0) / (x1 - x0); rect(x, y + Math.round(sag * 4 * t * (1 - t)), 1, 1, "#5A4040"); }
    for (var i = 0, gx = x0 + 3; gx < x1 - 2; gx += 6, i++) {
      var t2 = (gx - x0) / (x1 - x0), gy = y + Math.round(sag * 4 * t2 * (1 - t2)) + 1, c = A.GLASS[i % A.GLASS.length];
      rect(gx, gy, 2, 1, "#C8963E"); rect(gx, gy + 1, 2, 2, lightsOn > 0.3 ? A.lt(c, 0.35) : c);
    }
  }
  function drawBulbs(x0, x1, y, sag) {
    for (var x = x0; x <= x1; x++) { var t = (x - x0) / (x1 - x0); rect(x, y + Math.round(sag * 4 * t * (1 - t)), 1, 1, "#3A2C30"); }
    for (var bx = x0 + 4; bx < x1; bx += 6) { var t2 = (bx - x0) / (x1 - x0); rect(bx, y + Math.round(sag * 4 * t2 * (1 - t2)) + 1, 1, 2, lightsOn > 0.3 ? "#FFF2C0" : "#E8E0D0"); }
  }
  function drawFanous(x, y, c, seed) {
    var sw = Math.round(Math.sin(T * 1.5 + seed) * 0.8), lx = x + sw;
    rect(x, y - 3, 1, 3, "#4A3A30");
    rect(lx - 1, y, 3, 1, "#C8963E"); rect(lx - 2, y + 1, 5, 4, lightsOn > 0.3 ? A.lt(c, 0.4) : c); rect(lx, y + 2, 1, 2, A.lt(c, 0.7));
    rect(lx - 1, y + 5, 3, 1, "#8A6224"); rect(lx, y + 6, 1, 1, "#8A6224");
  }
  function drawWallLamp(x, y) { rect(x - 1, y - 2, 3, 1, "#2E3A3A"); rect(x - 1, y - 1, 3, 3, lightsOn > 0.3 ? "#FFE7A0" : "#E8D8A8"); rect(x - 1, y + 2, 3, 1, "#2E3A3A"); }
  function drawRoofLights(b) {
    var x0 = b.x + 6, x1 = b.x + b.w - 6, y = b.y + 28;
    for (var x = x0; x <= x1; x++) { var t = (x - x0) / (x1 - x0); rect(x, y + Math.round(20 * t * (1 - t)), 1, 1, "#4A3A3A"); }
    for (var i = 0, gx = x0 + 3; gx < x1; gx += 6, i++) { var t2 = (gx - x0) / (x1 - x0); rect(gx, y + Math.round(20 * t2 * (1 - t2)) + 1, 1, 2, lightsOn > 0.3 ? A.GLASS[i % 6] : "#D8D0C0"); }
  }
  function drawBasket(b) {
    var bal = b.out.balcony;
    if (!bal) return;
    var x = b.x + bal.x + bal.w - 8, y0 = b.y + bal.y + 2;
    var cyc = (T % 18) / 18, k = cyc < 0.25 ? cyc / 0.25 : cyc < 0.45 ? 1 : cyc < 0.7 ? 1 - (cyc - 0.45) / 0.25 : 0;
    var y1 = y0 + 4 + ease(k) * 24, sw = Math.round(Math.sin(T * 1.7) * k);
    for (var y = y0; y < y1; y++) rect(x + Math.round(sw * (y - y0) / (y1 - y0 || 1)), y, 1, 1, "#E8DCC4");
    var bx = x + sw - 3;
    rect(bx, y1, 7, 5, "#B98A55"); rect(bx, y1, 7, 1, "#D9AA70"); rect(bx + 1, y1 + 2, 5, 1, "#8A6238"); rect(bx + 2, y1 - 1, 3, 1, "#F2C14A");
  }

  // the rows in the mosque stand, bow and prostrate together; these are their shapes, seen from behind
  function prayFrames(sp) {
    if (sp.prayF) return sp.prayF;
    if (sp.spec && A.prayPoses) return (sp.prayF = A.prayPoses(sp.spec));
    var src = sp.f[1][0], w = src.width, h = src.height, d = src.getContext("2d").getImageData(0, 0, w, h).data, top = h, bot = 0;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (y < top) top = y; bot = y; }
    var body = bot - top + 1, waist = top + Math.round(body * 0.58);
    function make(fn) { var c = A.cv(w, h), g = c.getContext("2d"); g.imageSmoothingEnabled = false; fn(g); return c; }
    var th = waist - top, legs = bot + 1 - waist;
    return (sp.prayF = {
      qiyam: src,
      ruku: make(function (g) { g.drawImage(src, 0, waist, w, legs, 0, waist, w, legs); var nh = Math.max(4, Math.round(th * 0.42)); g.drawImage(src, 0, top, w, th, -1, waist - nh + 2, w + 2, nh); }),
      sujood: make(function (g) { var nh = Math.max(5, Math.round(body * 0.3)); g.drawImage(src, 0, top, w, body, -2, bot + 1 - nh, w + 4, nh); }),
      jalsa: make(function (g) { var lg = Math.max(3, Math.round(legs * 0.3)); g.drawImage(src, 0, waist, w, legs, -1, bot + 1 - lg, w + 2, lg); g.drawImage(src, 0, top, w, th, 0, bot + 2 - lg - th, w, th); })
    });
  }
  var PRAY = [["qiyam", 7, "الله أكبر"], ["ruku", 3, "الله أكبر"], ["qiyam", 2.2, "سمع الله لمن حمده"], ["sujood", 3, "الله أكبر"], ["jalsa", 2, "الله أكبر"], ["sujood", 3, "الله أكبر"]];
  var PRAY_TOT = PRAY.reduce(function (s, p) { return s + p[1]; }, 0);
  // where someone is in the prayer at time t: everyone follows the imam a moment after his takbeer,
  // and passes through the moment in between (halfway down to ruku, kneeling on the way to sujood)
  function prayPoseAt(t) {
    var tt = ((t % PRAY_TOT) + PRAY_TOT) % PRAY_TOT, acc = 0;
    for (var i = 0; i < PRAY.length; i++) {
      var d = PRAY[i][1];
      if (tt < acc + d) {
        var into = tt - acc, cur = PRAY[i][0], prev = PRAY[(i + PRAY.length - 1) % PRAY.length][0];
        if (into < 0.28 && ((cur === "ruku" && prev === "qiyam") || (cur === "qiyam" && prev === "ruku"))) return "bow";
        if (into < 0.45 && ((cur === "sujood" && prev === "qiyam") || (cur === "qiyam" && prev === "sujood"))) return into < 0.22 ? "bow" : "jalsa";
        return cur;
      }
      acc += d;
    }
    return "qiyam";
  }
  function stepPray(dt) {
    pray.t += dt;
    var tot = 0; PRAY.forEach(function (p) { tot += p[1]; });
    var t = pray.t % tot, acc = 0, i = 0;
    for (; i < PRAY.length; i++) { acc += PRAY[i][1]; if (t < acc) break; }
    if (i !== pray.last) {
      pray.last = i; pray.ph = PRAY[i][0];
      var im = actors.filter(function (a) { return a.pray === "imam"; })[0];
      if (im) says.push({ a: im, t: PRAY[i][2], until: T + 1.7 });
    }
  }
  function drawActor(a) {
    if (a.custom) { // someone drawn by hand, every frame (the tanoura dancer)
      a.custom(RA(), a.x, a.y, a);
      if (a.emote && bubbles[a.emote.k] && a.emote.t > 0.08) img(bubbles[a.emote.k], a.x - 6, a.y - 48);
      return;
    }
    if (a.pray && a.prayLag == null) a.prayLag = a.pray === "imam" ? 0 : a === player ? 0.35 : 0.15 + Math.random() * 0.45;
    var sp = a.sp, f, pp = a.prayPose || (a.pray ? prayPoseAt(pray.t - (a.prayLag || 0)) : null);
    if (pp) f = prayFrames(sp)[pp] || sp.f[1][0];
    else if (a.sit) f = sp.sit[a.dir];
    else if (a.kick > 0) f = sp.f[a.dir][1];
    else if (a.moving) f = sp.f[a.dir][a.frame];
    else if (a.dance != null) f = sp.f[a.dir][a.danceF || 0];
    else if (a.blink < 0 && a.dir !== 1) f = sp.blink[a.dir];
    else f = sp.f[a.dir][0];
    var bob = (a.moving && (a.frame === 1 || a.frame === 3)) || (a.dance != null && a.danceF % 2) ? -1 : 0, jz = a.jz || 0;
    var shx = a.shiver > 0 ? (((T * 28) | 0) % 2 ? 0.5 : -0.5) : 0;
    if (!a.clip && !a.sit) {
      if (jz > 0) ctx.globalAlpha = Math.max(0.3, 1 - jz / 14);
      if (TM.long && !RM) { ctx.globalAlpha = 0.8; var sx = X(a.x - 5), sy = Y(a.y - 2); ctx.drawImage(shadowImg, sx, sy, X(a.x + 15) - sx, Y(a.y + 2) - sy); }
      else img(shadowImg, a.x - 7, a.y - 2.5);
      ctx.globalAlpha = 1;
    }
    var x = a.x - sp.ax + shx, y = a.y - sp.ay + bob - jz;
    if (a.clip) {
      var cut = Math.round(a.clip - y);
      if (cut > 0) { var x0 = X(x), y0 = Y(y); ctx.drawImage(f, 0, 0, f.width, cut, x0, y0, X(x + f.width) - x0, Y(y + cut) - y0); }
    } else img(f, x, y);
    var head = a.y - (sp.kid ? 24 : 30) - jz + (a.sit ? 3 : 0) + (pp === "ruku" ? 6 : pp === "bow" ? 3 : pp === "sujood" ? 13 : pp === "jalsa" ? 6 : 0);
    if (a.emote && bubbles[a.emote.k] && a.emote.t > 0.08) img(bubbles[a.emote.k], a.x - 6, head - 12);
    if (a.itemUntil && T > a.itemUntil && !cutOn) { a.item = null; a.itemUntil = 0; }
    if (a.item) {
      var im = itemImg[a.item.k];
      if (im) {
        var iy = head - im.height - 1 + Math.round(Math.sin(T * 3) * 1);
        if (a.item.t < 0.6) { ctx.globalAlpha = 0.35 + a.item.t; }
        img(im, a.x - (im.width >> 1), iy);
        ctx.globalAlpha = 1;
      }
    }
  }
  function drawCat(c) {
    var s = catSprites[c.coat], im;
    if (c.mode === "sleep") im = s.sleep;
    else if (c.walk) im = s.walk[c.dir][((c.ft || 0) * 6 | 0) % 2];
    else im = s.sit[c.dir];
    if (!c.z) img(shadowImg, c.x - 6, c.y - 2);
    img(im, c.x - (im.width >> 1), c.y - im.height + 1 - c.z);
  }
  // a kite on a long string, dancing in the wind
  function drawKites() {
    kites.forEach(function (K2) {
      var a = K2.a, k = K2.k, hx = a.x + 2, hy = a.y - 20;
      var kx = a.x + k.to[0] + Math.sin(T * 0.7 + K2.ph) * 6, ky = a.y + k.to[1] + Math.cos(T * 0.9 + K2.ph) * 4;
      if (!visible(Math.min(hx, kx) - 10, ky - 10, Math.max(hx, kx) + 10, hy + 4)) return;
      ctx.globalAlpha = 0.5;
      for (var i = 0; i <= 90; i++) { var t = i / 90; rect(Math.round(hx + (kx - hx) * t), Math.round(hy + (ky - hy) * t + Math.sin(t * Math.PI) * 18), 1, 1, "#F4ECE0"); }
      ctx.globalAlpha = 1;
      var x = Math.round(kx), y = Math.round(ky), tilt = Math.round(Math.sin(T * 1.3 + K2.ph));
      for (var r = 0; r < 11; r++) { var hw = r < 5 ? r : 10 - r; rect(x - hw + (r === 5 ? tilt : 0), y - 5 + r, hw * 2 + 1, 1, r < 5 ? k.c : A.dk(k.c, 0.15)); }
      rect(x, y - 5, 1, 11, A.lt(k.c, 0.55)); rect(x - 4, y, 9, 1, A.lt(k.c, 0.3));
      for (var j = 1; j <= 5; j++) rect(Math.round(x + Math.sin(T * 3 + j + K2.ph) * j * 0.9), y + 5 + j * 3, 2, 1, ["#F2C14A", "#4CBF73", "#F4EFE4", "#E86AA0", "#4F97E8"][j - 1]);
    });
  }
  // windows on the rooftops to the south light up at night; laundry sways up there too
  function drawRoofs() {
    var R = G.roofs;
    if (!R) return;
    if (lightsOn > 0.02) {
      ctx.globalAlpha = Math.min(1, lightsOn * 1.1);
      R.wins.forEach(function (w, i) { if (visible(w[0], w[1], w[0] + w[2], w[1] + w[3])) rect(w[0] + 1, w[1] + 1, w[2] - 1, w[3] - 1, i % 5 === 0 ? ["#9EC8FF", "#C8E0FF"][((T * 3 + i) | 0) % 2] : "#FFD98A"); });
      ctx.globalAlpha = 1;
    }
    R.laundry.forEach(function (l, i) { if (visible(l[0], l[2] - 12, l[1], l[2] + 6)) drawLaundry(l[0], l[1], l[2], 7 + i * 3); });
  }
  function drawPigeon(p) {
    var set = pigeonSprCache[p.tint] || pigeonSpr, im = (p.dir ? set.R : set.L)[p.f];
    if (p.z > 0.5) { ctx.globalAlpha = 0.6; img(shadowImg, p.x - 3, p.y - 1); ctx.globalAlpha = 1; }
    img(im, p.x - (im.width >> 1), p.y - im.height + 1 - p.z);
  }
  function drawBall() {
    if (!ball || ball.hidden) return;
    img(shadowImg, ball.x - 4, ball.y - 2);
    img(ballImg, ball.x - 3, ball.y - 5 - ball.z);
  }
  // the big trees' crowns, over everything; you can see through them when you walk underneath
  function drawCanopies(dt) {
    dapples.forEach(function (d) {
      var p = d.p, sp = propSprite(p, p.sway ? (Math.sin(T * 0.9 + p.x) > 0.6 ? "sway1" : Math.sin(T * 0.9 + p.x) < -0.6 ? "sway-1" : "") : "");
      var under = player.x > p.x + 8 && player.x < p.x + d.sw - 8 && player.y - 24 < p.y - 6 && player.y > d.top + 10;
      d.fade += ((under ? 0.42 : 1) - d.fade) * Math.min(1, dt * 6);
      if (!visible(p.x, d.top, p.x + d.sw, p.y)) return;
      ctx.globalAlpha = d.fade; img(sp, p.x, d.top); ctx.globalAlpha = 1;
    });
  }
  function drawStrings() {
    strings.forEach(function (s) {
      if (!visible(s.x0, s.y0 - 4, s.x1, s.y1)) return;
      ctx.globalAlpha = 0.55;
      for (var i = 0; i < s.pts.length; i++) { var p = s.pts[i]; rect(Math.round(p[0]), Math.round(p[1]), 1, 1, "#3A2C30"); }
      ctx.globalAlpha = 1;
      if (s.k === "banner") drawBanner(s);
      s.items.forEach(function (it) {
        var sw = Math.sin(T * 1.6 + it.ph), x = Math.round(it.x), y = Math.round(it.y);
        if (s.k === "flags") { rect(x - 1, y + 1, 3, 2, it.c); rect(x + Math.round(sw * 0.6), y + 3, 1, 1, it.c); }
        else if (s.k === "lanterns") {
          var lx = x + Math.round(sw * 0.7), c = it.c;
          rect(lx, y + 1, 1, 1, "#8A6224"); rect(lx - 1, y + 2, 3, 1, "#C8963E");
          rect(lx - 1, y + 3, 3, 3, lightsOn > 0.3 ? A.lt(c, 0.35) : c); rect(lx, y + 4, 1, 1, A.lt(c, 0.6));
          rect(lx - 1, y + 6, 3, 1, "#8A6224");
        } else if (s.k === "days") { // the lantern of the days: one more lit for every day of Ramadan
          var dx = x + Math.round(sw * 0.8), lit = it.lit, gc = lit ? it.c : "#4A4458", br = lit ? "#C8963E" : "#7A6A58", brd = lit ? "#8A6224" : "#5A4E44";
          rect(dx, y, 1, 2, brd); rect(dx - 1, y + 2, 3, 1, br); rect(dx - 2, y + 3, 5, 1, brd);
          rect(dx - 2, y + 4, 5, 4, lit && lightsOn > 0.3 ? A.lt(gc, 0.4) : gc); rect(dx - 1, y + 5, 1, 2, lit ? A.lt(gc, 0.65) : "#6A6276"); rect(dx, y + 4, 1, 4, brd);
          rect(dx - 2, y + 8, 5, 1, brd); rect(dx - 1, y + 9, 3, 1, br); rect(dx, y + 10, 1, 1, brd);
          if (it.today) { var pulse = 0.5 + 0.5 * Math.sin(T * 3); ctx.globalAlpha = 0.25 + 0.4 * pulse; rect(dx - 3, y + 3, 7, 6, "#FFF0B0"); ctx.globalAlpha = 1; }
        } else rect(x, y + 1, 1, 1, lightsOn > 0.3 ? "#FFF2C0" : "#E8E0D0");
      });
    });
  }
  function drawBanner(s) {
    var mid = s.pts[Math.round(s.pts.length / 2)], w = 64, h = 13, sw = Math.round(Math.sin(T * 1.1) * 1);
    var x = Math.round(mid[0] - w / 2) + sw, y = Math.round(mid[1]) + 1;
    rect(x, y, w, h, "#2A2560"); rect(x, y, w, 1, "#F2C14A"); rect(x, y + h - 1, w, 1, "#F2C14A");
    for (var i = 0; i < w; i += 3) rect(x + i, y + h, 2, 2, i % 6 ? "#C8443A" : "#F2C14A");
    rect(x + 3, y + 3, 3, 3, "#F2C14A"); rect(x + w - 6, y + 3, 3, 3, "#F2C14A");
    text(s.t, x + w / 2, y + h / 2 + 0.5, 9, "#FFD98A");
  }
  function drawParts() {
    parts.forEach(function (p) {
      if (p.life < 0) return;
      var k = p.life / p.max, x = Math.round(p.x), y = Math.round(p.y);
      if (p.k === "smoke") { ctx.globalAlpha = (1 - k) * (p.soft ? 0.5 : 0.62); var s = 1 + Math.round(k * 3); rect(x - (s >> 1), y, s, s, k < 0.4 ? "#C8C0C8" : "#A8A0AE"); }
      else if (p.k === "steam") { ctx.globalAlpha = (1 - k) * 0.55; var s2 = 1 + Math.round(k * 2); rect(x, y, s2, s2, "#FFFFFF"); }
      else if (p.k === "spark") { ctx.globalAlpha = 1 - k; rect(x, y, 1, 1, k < 0.5 ? "#FFE680" : "#FF8A3A"); }
      else if (p.k === "dust") { ctx.globalAlpha = (1 - k) * 0.7; rect(x, y, 1, 1, p.c || "#E8D8B8"); }
      else if (p.k === "mote") { ctx.globalAlpha = Math.max(0, Math.sin(k * Math.PI) * (0.5 + 0.5 * Math.sin(T * 3 + p.ph))); rect(x, y, 1, 1, "#FFF0B0"); }
      else if (p.k === "heart") { ctx.globalAlpha = 1 - k * k; img(heartImg, x - 3, y); }
      else if (p.k === "z") { ctx.globalAlpha = 1 - k; img(zImg, x, y); }
      else if (p.k === "note") { ctx.globalAlpha = 1 - k; img(noteImg, x, y); }
      else if (p.k === "leaf") { ctx.globalAlpha = Math.min(1, (1 - k) * 3); rect(x, y, 2, 1, p.c); rect(x + (Math.sin(T * 4 + p.ph) > 0 ? 1 : 0), y + 1, 1, 1, A.dk(p.c, 0.25)); }
      else if (p.k === "drop") { ctx.globalAlpha = 0.85 * (1 - k); rect(x, y, 1, 2, "#9AD0F0"); }
      else if (p.k === "confetti") { ctx.globalAlpha = Math.min(1, (1 - k) * 2.5); rect(x, y, Math.sin(T * 9 + p.ph) > 0 ? 2 : 1, 1, p.c); }
      else if (p.k === "twinkle") { var a = Math.sin(k * Math.PI); ctx.globalAlpha = a; rect(x, y - 1, 1, 3, "#FFF4C0"); rect(x - 1, y, 3, 1, "#FFF4C0"); rect(x, y, 1, 1, "#FFFFFF"); }
      ctx.globalAlpha = 1;
    });
  }
  function drawMoths() {
    if (!TM.moths) return;
    lights.forEach(function (L, i) {
      if (!L.lamp || !visible(L.x - 10, L.y - 10, L.x + 10, L.y + 10)) return;
      for (var m = 0; m < 3; m++) { var a = T * (2.2 + m * 0.7) + i + m * 2.1; rect(Math.round(L.x + Math.cos(a) * (4 + m * 2)), Math.round(L.y + Math.sin(a * 1.3) * (3 + m)), 1, 1, "#F4ECE0"); }
    });
  }
  function drawCoopBirds() {
    if (dark()) return;
    coopBirds.forEach(function (b) {
      var x = b.cx + Math.cos(b.a) * b.r, y = b.cy + Math.sin(b.a) * b.r * 0.35 - 6;
      if (!visible(x - 4, y - 4, x + 4, y + 4)) return;
      var im = (Math.sin(b.a) * b.s > 0 ? pigeonSpr.R : pigeonSpr.L)[((T * 8 + b.ph * 10) | 0) % 2 ? 2 : 3];
      img(im, Math.round(x) - 4, Math.round(y) - 3);
    });
  }
  function drawMarks() {
    if (!OB || cutOn || busy) return;
    var bob = Math.round(Math.sin(T * 3) * 1.5), many = OB.goals.length > 1;
    OB.goals.forEach(function (g) {
      var m = markOf(g);
      if (!m) return;
      var ph = (T * 1.1) % 1, rw = 6 + ph * 9;
      ctx.globalAlpha = 0.75 * (1 - ph);
      ellipse(m.stand[0], m.stand[1], rw, rw * 0.38, "#FFE7A0");
      ctx.globalAlpha = 1;
      img(markerImg, m.mark[0] - 5, m.mark[1] - 17 + bob);
      if ((many || m.exit) && fontsReady && m.name) label(m.name, m.mark[0], m.mark[1] + 2);
    });
  }
  function drawDeedMarks() {
    if (cutOn || (O && O.title) || !starImg) return;
    todaysDeeds().forEach(function (x, i) {
      if (x.done || (x.d.night && fasting())) return;
      var t = deedTarget(x.d);
      if (!t || !visible(t.x - 8, t.y - 14, t.x + 8, t.y + 4)) return;
      var on = x.d.id === track, bob = Math.round(Math.sin(T * 2.6 + i) * 1.5), tw = 0.75 + 0.25 * Math.sin(T * 5 + i * 2);
      if (on && t.stand) { var ph = (T * 1.1) % 1, rw = 6 + ph * 9; ctx.globalAlpha = 0.8 * (1 - ph); ellipse(t.stand[0], t.stand[1], rw, rw * 0.38, "#FFE7A0"); }
      ctx.globalAlpha = tw;
      img(starImg, t.x - 5, t.y - 12 + bob);
      ctx.globalAlpha = 1;
    });
  }
  // what you just tapped: four little gold corners that blink twice
  function drawHighlight() {
    if (!hl) return;
    var k = T - hl.t, life = hl.long ? 2.4 : 0.9;
    if (k > life) { hl = null; return; }
    if (k < 0) return;
    var r = hl.r, a = Math.max(0, 1 - k / life) * (0.6 + 0.4 * Math.abs(Math.sin(k * 7))), g = 1 + Math.round(Math.max(0, 0.3 - k) * 10);
    var x0 = r[0] - g - 1, y0 = r[1] - g - 1, x1 = r[0] + r[2] + g, y1 = r[1] + r[3] + g, c = "#FFE7A0", L = 4;
    ctx.globalAlpha = a;
    rect(x0, y0, L, 1, c); rect(x0, y0, 1, L, c); rect(x1 - L + 1, y0, L, 1, c); rect(x1, y0, 1, L, c);
    rect(x0, y1, L, 1, c); rect(x0, y1 - L + 1, 1, L, c); rect(x1 - L + 1, y1, L, 1, c); rect(x1, y1 - L + 1, 1, L, c);
    ctx.globalAlpha = 1;
  }
  // near a door, a small sign says you can go in
  function drawDoorHints() {
    if (cutOn || talk || busy || (O && O.title) || !fontsReady) return;
    if (RM) {
      myExits().forEach(function (e) {
        var cx = e.r[0] + e.r[2] / 2, cy = e.r[1] + e.r[3] / 2;
        if (hyp(player.x, player.y, cx, cy) < 30) label(e.to === "hara" ? "اخرج للحارة" : e.to === "roof" ? "اطلع السطوح" : "انزل البيت", cx, e.r[1] - 26);
      });
      return;
    }
    var D = (H.rooms && H.rooms.DOORS) || {};
    Object.keys(D).forEach(function (k) {
      if (k === "steps" || k === "roof") return;
      var s = WD.SPOTS[k];
      if (!s || !doorNow(D[k]) || !timeOk(s) || hyp(player.x, player.y, s.stand[0], s.stand[1]) > 36) return;
      if (OB && OB.goals.some(function (g) { var m = markOf(g); return m && m.spot === k; })) return;
      label((D[k].open && !D[k].open(day, flags()) ? "مقفول · " : "ادخل · ") + s.name, s.mark[0], s.mark[1] + 8);
    });
  }
  // short words over a head, like the imam's takbeer
  function drawSays() {
    if (!fontsReady) return;
    says = says.filter(function (s) { return s.until > T; });
    says.forEach(function (s) { var a = s.a; label(s.t, a.x, a.y - (a.sp.kid ? 24 : 30) - 22); });
  }
  function ellipse(cx, cy, rx, ry, col) {
    var n = Math.max(16, Math.round(rx * 3));
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; rect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1, col); }
  }
  function label(t, wx, wy) {
    var size = Math.round(Math.max(12 * dpr, 6 * K));
    ctx.font = "600 " + size + 'px "IBM Plex Sans Arabic", sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var lines = [t], pad = 8 * dpr;
    if (ctx.measureText(t).width + size * 1.1 > cvs.width - pad * 2) { // too long for one line: break it near the middle
      var mid = t.length >> 1, cut = t.lastIndexOf(" ", mid);
      if (cut < 0) cut = t.indexOf(" ", mid);
      if (cut > 0) lines = [t.slice(0, cut), t.slice(cut + 1)];
    }
    var tw = 0; lines.forEach(function (l) { tw = Math.max(tw, ctx.measureText(l).width); });
    var w = tw + size * 1.1, lh = size * 1.3, h = size * 0.3 + lh * lines.length, y = Y(wy) + h / 2;
    var x = clamp(X(wx), w / 2 + pad, Math.max(w / 2 + pad, cvs.width - w / 2 - pad)); // stays on screen
    ctx.fillStyle = "rgba(42,22,30,0.84)";
    roundRect(x - w / 2, y - h / 2, w, h, Math.min(h / 2, size * 0.8)); ctx.fill();
    ctx.fillStyle = "#FFE7A0";
    lines.forEach(function (l, i) { ctx.fillText(l, x, y - h / 2 + size * 0.15 + lh * (i + 0.5) + size * 0.05); });
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawRings() {
    rings.forEach(function (r) { var k = r.t / 0.6; ctx.globalAlpha = 1 - k; ellipse(r.x, r.y, 3 + k * 7, (3 + k * 7) * 0.4, "#FFF4D0"); ctx.globalAlpha = 1; });
  }

  function render(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = RM ? "#0E0A12" : "#1E1622"; ctx.fillRect(0, 0, cvs.width, cvs.height);
    drawSky();
    drawGround();
    if (!RM) drawRoofs();
    drawRings();
    var list = [];
    statics.forEach(function (s) { if (visible(s.x0, s.y0, s.x1, s.y1)) list.push({ y: s.y, s: s }); });
    actors.forEach(function (a) { if (visible(a.x - 12, a.y - 46, a.x + 12, a.y + 4)) list.push({ y: a.sortY || a.y, a: a }); });
    cats.forEach(function (c) { if (visible(c.x - 8, c.y - 10, c.x + 8, c.y + 2)) list.push({ y: c.y, c: c }); });
    pigeons.forEach(function (p) { if (p.z < 14 && visible(p.x - 6, p.y - 20, p.x + 6, p.y + 2)) list.push({ y: p.y, p: p }); });
    if (ball) list.push({ y: ball.y + 0.1, b: 1 });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (o) { if (o.s) o.s.draw(); else if (o.a) drawActor(o.a); else if (o.c) drawCat(o.c); else if (o.p) drawPigeon(o.p); else drawBall(); });
    drawCanopies(dt);
    drawStrings();
    if (RM && RM.over) RM.over(RA());
    drawKites();
    pigeons.forEach(function (p) { if (p.z >= 14) drawPigeon(p); });
    if (!RM) drawCoopBirds();
    drawParts();
    drawMoths();
    drawDoorHints();
    drawMarks();
    drawDeedMarks();
    drawHighlight();
    drawSays();
    renderLight();
  }

  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")"; }
  function renderLight() {
    var lw = lightC.width, lh = lightC.height, s = K / dpr / LS;
    lctx.globalCompositeOperation = "source-over";
    lctx.fillStyle = rgba(amb, 1); lctx.fillRect(0, 0, lw, lh);
    if (skyMask && cam.y < GROUND_TOP) lctx.drawImage(skyMask, (0 - cam.x) * s, (0 - cam.y) * s, W * s, GROUND_TOP * s);
    lctx.globalCompositeOperation = "lighter";
    gctx.globalCompositeOperation = "source-over";
    gctx.clearRect(0, 0, lw, lh);
    gctx.globalCompositeOperation = "lighter";
    var on = lightsOn, gl = TM.glow;
    function light(x, y, r, c, a, ga) {
      var lx = (x - cam.x) * s, ly = (y - cam.y) * s, lr = r * s;
      if (lx < -lr || ly < -lr || lx > lw + lr || ly > lh + lr) return;
      if (a > 0.01) {
        var g1 = lctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        g1.addColorStop(0, rgba(c, a)); g1.addColorStop(0.45, rgba(c, a * 0.5)); g1.addColorStop(1, rgba(c, 0));
        lctx.fillStyle = g1; lctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
      }
      if (ga > 0.01) {
        var gr2 = lr * 0.55, g2 = gctx.createRadialGradient(lx, ly, 0, lx, ly, gr2);
        g2.addColorStop(0, rgba(c, ga)); g2.addColorStop(0.35, rgba(c, ga * 0.35)); g2.addColorStop(1, rgba(c, 0));
        gctx.fillStyle = g2; gctx.fillRect(lx - gr2, ly - gr2, gr2 * 2, gr2 * 2);
      }
    }
    var daytime = time === "asr" || time === "pre";
    lights.forEach(function (L, i) {
      if (L.need && !(RM && RM.st[L.need])) return;
      var k = L.when === "always" ? Math.max(0.55, on) : L.when === "day" ? (daytime ? 0.7 : 0) : L.when === "night" ? (dark() ? 1 : 0) : on;
      if (k <= 0.01) return;
      var fl = L.fl === 1 ? 0.82 + 0.18 * Math.sin(T * 13 + i) * Math.sin(T * 7.3 + i * 2) : L.fl === 2 ? 0.7 + 0.3 * Math.sin(T * 5 + i) : 1;
      var x = L.x, c = L.c;
      if (L.dyn) { var dy = L.dyn(T, RM ? RM.st : null); if (!dy || dy[0] <= 0.01) return; fl *= dy[0]; if (dy[1]) c = dy[1]; } // a light that pulses or changes colour (the stage)
      if (L.item) x += Math.sin(T * 1.6 + L.item.ph) * 0.7;
      light(x, L.y, L.r, c, k * 0.9 * fl, k * gl * L.g * fl * 0.75);
    });
    actors.forEach(function (a) {
      if (!a.sp.lan || !a.sp.lan[a.dir] || a.sit) return;
      var lp = a.sp.lan[a.dir], k = Math.max(on, time === "pre" ? 0.25 : 0) * (RM && !RM.roof ? 0.6 : 1);
      if (k <= 0.01) return;
      var c = a === player ? [255, 214, 120] : [255, 190, 150];
      light(a.x + lp[0], a.y + lp[1] - (a.moving && (a.frame === 1 || a.frame === 3) ? 1 : 0), 34, c, k * 0.9, k * gl * 0.9);
    });
    if (OB && !cutOn) OB.goals.forEach(function (g) { var m = markOf(g); if (m) light(m.mark[0], m.mark[1] - 9, 26, [255, 210, 110], Math.max(0.35, on * 0.8), 0.55 + 0.15 * Math.sin(T * 3)); });
    if (!cutOn && !(O && O.title)) todaysDeeds().forEach(function (x) { if (x.done || (x.d.night && fasting())) return; var t = deedTarget(x.d); if (t) light(t.x, t.y - 6, x.d.id === track ? 26 : 16, [255, 220, 120], Math.max(0.3, on * 0.7), x.d.id === track ? 0.6 : 0.35); });
    // sun through a room's windows: a slanted shaft and the patch it lands on (stained glass throws its colours)
    if (RM && RM.wins) RM.wins.forEach(function (w) {
      if (daytime) {
        var warm = time === "pre" ? [255, 186, 110] : [255, 238, 200], x0 = (w.x - cam.x) * s, y0 = (w.y - cam.y) * s, ww = w.w * s, hh = w.h * s, drop = Math.max(20, RM.wall + 36 - w.y - w.h) * s, sl = 22 * s;
        var gg = gctx.createLinearGradient(0, y0, 0, y0 + hh + drop);
        gg.addColorStop(0, rgba(warm, 0.3)); gg.addColorStop(1, rgba(warm, 0));
        gctx.fillStyle = gg; gctx.beginPath(); gctx.moveTo(x0, y0); gctx.lineTo(x0 + ww, y0); gctx.lineTo(x0 + ww + sl, y0 + hh + drop); gctx.lineTo(x0 + sl, y0 + hh + drop); gctx.closePath(); gctx.fill();
        light(w.x + w.w / 2 + 22, RM.wall + 26, w.w * 1.3, warm, 0.55, 0.12);
        if (w.glass) [[255, 90, 80], [90, 150, 255], [255, 220, 90], [90, 220, 130], [200, 120, 255]].forEach(function (c, i) { light(w.x + 4 + i * 5 + 22, RM.wall + 20 + (i % 2) * 8, 9, c, 0.6, 0.4); });
      } else if (dark()) light(w.x + w.w / 2, w.y + w.h / 2, w.w, [120, 150, 255], 0.3, 0.12);
    });
    if (TM.rays && !RM) {
      for (var r = 0; r < 4; r++) {
        var period = lw / s + 200, bx = ((((r * 140 + 40) - cam.x * 0.4) % period) + period) % period * s - 60 * s, a = 0.08 + 0.04 * Math.sin(T * 0.4 + r * 1.7);
        var gg = gctx.createLinearGradient(bx, 0, bx + 60 * s, lh);
        gg.addColorStop(0, "rgba(255,214,150," + a.toFixed(3) + ")"); gg.addColorStop(1, "rgba(255,190,120,0)");
        gctx.fillStyle = gg;
        gctx.beginPath(); gctx.moveTo(bx, 0); gctx.lineTo(bx + 26 * s, 0); gctx.lineTo(bx + 110 * s, lh); gctx.lineTo(bx + 70 * s, lh); gctx.closePath(); gctx.fill();
      }
    }
  }

  /* ---------------- the loop ---------------- */
  function kick() { if (!raf && isOpen) { lastT = 0; raf = requestAnimationFrame(frame); } }
  function onGoal() { return RM && !RM.roof ? ON_IN[time] : TM.on; }
  function ambGoal() {
    if (!RM || RM.roof) return TM.amb;
    var a = (RM.amb && RM.amb[time]) || AMB_IN[time]; // a room can have its own light (the tent is warm and bright)
    if (RM.dim && !RM.st.lamp) a = a.map(function (v) { return v * (1 - RM.dim); });
    if (RM.showDim) { var sd = RM.showDim(T); if (sd) a = a.map(function (v) { return v * (1 - sd); }); } // the lights go down for the show
    return a;
  }
  function stepFx(a, dt) {
    if (a.jv || a.jz > 0) { a.jz += a.jv * dt; a.jv -= 340 * dt; if (a.jz <= 0) { a.jz = 0; a.jv = 0; } }
    if (a.shiver > 0) a.shiver -= dt;
    if (a.item) a.item.t += dt;
    if (a === player && a.emote) { a.emote.t += dt; if (a.emote.t > 1.8) a.emote = null; }
    if (a.sleepZ && Math.random() < dt * 0.45) parts.push({ k: "z", x: a.x + 3, y: a.y - 24, vx: 3, vy: -6, life: 0, max: 2 });
  }
  function frame(t) {
    raf = 0;
    if (!isOpen) return;
    var dt = lastT ? Math.min(TURBO ? 0.5 : 0.05, (t - lastT) / 1000) : 0.016;
    lastT = t; T += dt;
    if (root.clientWidth !== cssW || root.clientHeight !== cssH) measure();
    var f = 1 - Math.exp(-dt * 0.9), ag = ambGoal();
    lightsOn += (onGoal() - lightsOn) * f;
    for (var i = 0; i < 3; i++) amb[i] += (ag[i] - amb[i]) * f;
    if (skyFade < 1) skyFade = Math.min(1, skyFade + dt * 0.4);
    if (player.path && (cutOn || !talk)) { if (moveActor(player, dt)) arrived(); }
    else if (!talk && player.dest && !cutOn && !busy) arrived(); // an empty path still counts as getting there
    checkTrigger();
    if (talk) stepTalk(dt);
    actors.forEach(function (a) { if (a.kick > 0) a.kick -= dt; stepFx(a, dt); });
    if (RM && RM.pray && dark()) stepPray(dt);
    if (RM && RM.tick) RM.tick(RA(), dt, roomApi);
    thinkActors(dt); thinkBall(dt); thinkCats(dt); thinkPigeons(dt); stepParts(dt);
    if (!RM) stepSky(dt);
    checkPlace(dt);
    follow(dt);
    var sx = 0, sy = 0;
    if (shakeT > 0) { shakeT -= dt; sx = rnd(-shakeAmp, shakeAmp); sy = rnd(-shakeAmp, shakeAmp); }
    cam.x += sx; cam.y += sy;
    render(dt);
    cam.x -= sx; cam.y -= sy;
    pointArrow();
    raf = requestAnimationFrame(frame);
  }

  function pointArrow() {
    var g = OB && OB.goals.length === 1 && !cutOn && !busy ? OB.goals[0] : null, m = g && markOf(g);
    var td = track && !cutOn && !busy ? deedById(track) : null;
    if (track && !td) track = null;
    if (td) { // the small deed you asked about wins until you do it
      var t = deedTarget(td);
      if (t) m = { mark: [t.x, t.y + 14] };
      else { var ex = myExits()[0]; m = ex ? { mark: [ex.r[0] + ex.r[2] / 2, ex.r[1]] } : null; }
    }
    arrow.classList.toggle("deed", !!td);
    if (!m) { arrow.classList.remove("on"); return; }
    var gx = (m.mark[0] - cam.x) * K / dpr, gy = (m.mark[1] - 10 - cam.y) * K / dpr;
    var top = taskEl.offsetTop + taskEl.offsetHeight + 18, mg = 34;
    var bottom = dlg.hidden ? cssH - mg : dlg.offsetTop - 30;
    if (gx > mg && gx < cssW - mg && gy > top && gy < bottom) { arrow.classList.remove("on"); return; }
    var cx = cssW / 2, cy = (top + bottom) / 2, ang = Math.atan2(gy - cy, gx - cx);
    var ax = clamp(gx, mg, cssW - mg), ay = clamp(gy, top + 4, bottom);
    arrow.style.transform = "translate(" + ax.toFixed(0) + "px," + ay.toFixed(0) + "px)";
    arrow.firstChild.style.transform = "rotate(" + (ang * 180 / Math.PI + 90).toFixed(0) + "deg)";
    arrow.classList.add("on");
  }

  function qOpen(v) {
    if (!qList) return;
    qList.hidden = !v; qBtn.setAttribute("aria-expanded", String(!!v)); qBtn.classList.toggle("on", !!v);
    if (v && H.audio) H.audio.tap();
  }
  // the errands list: the story's, then today's small deeds, then the secrets you've found
  function refreshQuests() {
    var qs = O && O.quests ? O.quests() : [], ds = todaysDeeds();
    var left = qs.filter(function (q) { return !q.done; }).length + ds.filter(function (d) { return !d.done; }).length;
    qBtn.textContent = "مهامك";
    var badge = el("span", "mp-qn" + (left ? "" : " ok"), qBtn);
    badge.textContent = left ? ar(left) : "✓";
    qList.textContent = "";
    var top = el("li", "mp-qtop", qList);
    el("b", "", top).textContent = "مهامك النهارده";
    var x0 = el("button", "mp-qx", top); x0.type = "button"; x0.setAttribute("aria-label", "اقفل المهام"); x0.textContent = "×";
    x0.addEventListener("click", function (e) { e.stopPropagation(); qOpen(false); });
    qs.forEach(function (q) {
      var li = el("li", q.done ? "done" : "", qList);
      if (q.face) { var fimg = el("img", "", li); fimg.src = "assets/faces/" + q.face + ".webp"; fimg.alt = ""; }
      var sp = el("span", "", li); sp.textContent = q.t;
      el("i", "ck", li).setAttribute("aria-hidden", "true");
    });
    if (ds.length) {
      el("li", "mp-qh", qList).textContent = "خير صغير النهارده";
      ds.forEach(function (x) {
        var li = el("li", "deed" + (x.done ? " done" : "") + (x.d.id === track ? " on" : ""), qList);
        el("b", "mp-qstar", li).textContent = "✦";
        var sp = el("span", "", li); sp.textContent = fmt(x.d.t);
        if (x.done) { el("i", "ck", li).setAttribute("aria-hidden", "true"); return; }
        var go = el("button", "mp-qgo", li); go.type = "button"; go.textContent = "فين؟";
        go.setAttribute("aria-label", "وريني فين: " + fmt(x.d.t));
        go.addEventListener("click", function (e) { e.stopPropagation(); goDeed(x.d); });
      });
    }
    var mem = el("li", "mp-qmem", qList);
    mem.textContent = "فوانيس الشهر المنوّرة: " + ar(day) + " من ٣٠ · خبايا لقيتها: " + ar(memCount()) + " من " + ar(WD.SECRETS.length);
  }
  function refreshHud() {
    if (!taskEl) return;
    dayEl.textContent = ar(day) + " رمضان";
    clockEl.textContent = clockTxt; clockEl.hidden = !clockTxt;
    var many = OB && OB.goals.length > 1;
    if (OB) { taskK.textContent = OB.key || (many ? "اختار" : "المهمة"); taskT.textContent = OB.task || ""; }
    else { taskK.textContent = (O && O.freeKey) || "الحارة"; taskT.textContent = O && O.freeTask ? fmt(O.freeTask) : ""; }
    goBtn.hidden = !OB || many;
    choiceBox.textContent = "";
    choiceBox.hidden = !many;
    if (many) OB.goals.forEach(function (g) {
      var b = el("button", "mp-ch", choiceBox);
      b.type = "button";
      el("span", "mp-ch-t", b).textContent = g.label || "";
      var m = markOf(g);
      el("span", "mp-ch-w", b).textContent = g.where || (m ? m.name : "");
      b.addEventListener("click", function (e) { e.stopPropagation(); goTarget(g); });
    });
    refreshQuests();
  }

  /* ---------------- the scenes: what js/world.js can do with the world ---------------- */
  function findActor(id) {
    if (!id) return null;
    if (id === "me" || id === "player") return player;
    for (var i = 0; i < actors.length; i++) if (actors[i].cid === id) return actors[i];
    for (var j = 0; j < actors.length; j++) { var a = actors[j]; if (a !== player && (a.cast === id || (a.person && a.person.id === id))) return a; }
    return null;
  }
  function talkSpec(o) {
    var who = o.who, a = who ? findActor(who) : null, t = { text: fmt(o.t || ""), who: a && a !== player ? a : null };
    if (!who) { t.narr = true; return t; }
    if (who === "me") { t.me = true; t.name = (O && O.name) || "أنا"; t.portrait = bust(player.sp, "me"); return t; }
    var meta = WD.PEOPLE.filter(function (p) { return p.id === who; })[0];
    t.name = o.name || (a && a.name) || NAMES[who] || (meta && meta.name) || "";
    t.face = o.face || (meta && meta.face) || FACES[who] || (a && a.face) || null;
    if (!t.face) t.portrait = bust(a ? a.sp : (WD.CAST[who] ? spr(who) : null), who);
    if (a && a !== player) { a.talking = true; }
    return t;
  }
  function burst(k, x, y, n) {
    for (var i = 0; i < (n || 8); i++) {
      if (k === "confetti") parts.push({ k: "confetti", x: x + rnd(-10, 10), y: y + rnd(-6, 4), vx: rnd(-30, 30), vy: rnd(-50, -20), life: -i * 0.01, max: rnd(1.4, 2.2), ph: rnd(0, 6), c: ["#E8503F", "#F2C14A", "#4CBF73", "#4F97E8", "#E86AA0", "#FFFFFF"][i % 6] });
      else if (k === "heart") parts.push({ k: "heart", x: x + rnd(-6, 6), y: y, vx: rnd(-5, 5), vy: -14 - (i % 4) * 3, life: -i * 0.15, max: 1.4 });
      else if (k === "dust") parts.push({ k: "dust", x: x + rnd(-6, 6), y: y + rnd(-3, 3), vx: rnd(-10, 10), vy: rnd(-12, -3), life: 0, max: rnd(0.5, 0.9), c: "#F2DEB0" });
      else parts.push({ k: "twinkle", x: x + rnd(-8, 8), y: y + rnd(-8, 6), vx: rnd(-6, 6), vy: rnd(-14, -4), life: -i * 0.05, max: 1.1 });
    }
  }
  function ballCmd(cmd, a, b, c, d, e) {
    if (!ball) return Promise.resolve();
    if (cmd === "hold") { var h = findActor(a); if (h) { ball.holder = h; ball.frozen = true; ball.script = null; ball.hidden = false; } return Promise.resolve(); }
    if (cmd === "hide") { ball.hidden = true; ball.frozen = true; ball.holder = null; return Promise.resolve(); }
    if (cmd === "free") {
      ball.frozen = false; ball.script = null; ball.hidden = false;
      ball.kids.forEach(function (k) { k.play = true; k.scripted = false; });
      ball.holder = ball.kids[0]; ball.other = ball.kids[1]; ball.wait = 1.5;
      return Promise.resolve();
    }
    if (cmd === "fly") { // fly(to, height at the end, arc height, ms, stop at 0..1)
      var tp = pointOf(a) || { x: ball.x, y: ball.y }, ground = Array.isArray(a) && typeof a[0] === "number" ? tp.y : tp.y + 15;
      return new Promise(function (res) {
        ball.holder = null; ball.frozen = true; ball.hidden = false;
        ball.script = { x0: ball.x, y0: ball.y, z0: ball.z, x1: tp.x, y1: ground, z1: b || 0, peak: c == null ? 10 : c, t: 0, dur: (d || 800) / 1000, stop: e || 0, res: res, bounce: !b };
      });
    }
    return Promise.resolve();
  }
  var CUT = {
    begin: function () {
      cutOn = true; autoGo = false; camFree = false;
      root.classList.add("cut");
      player.path = null; player.dest = null; player.moving = false; player.frame = 0;
      qOpen(false); track = null; deedGo = null;
    },
    end: function () {
      cutOn = false;
      root.classList.remove("cut");
      shot = null; zoomGoal = 1;
      actors.forEach(function (a) { a.scripted = false; a.item = null; a.onArrive = null; if (a !== player && a.path && !a.kind) a.path = null; });
      player.item = null; player.sit = false; player.prayPose = null; player.pray = null;
      refreshHud();
    },
    actor: findActor,
    spawn: function (id, cast, x, y, dir, pose) {
      var a = findActor(id);
      if (!a || a === player) {
        a = actor(cast || id, x, y, dir);
        a.cid = id; a.kind = "story"; a.cast = (cast || id).replace(/\+l$/, "");
        var meta = WD.PEOPLE.filter(function (p) { return p.id === id; })[0];
        a.name = NAMES[id] || (meta && meta.name) || ""; a.face = FACES[id] || null;
        if (meta) a.person = meta;
        actors.push(a);
      } else if (cast && a.sid !== cast) { a.sid = cast; a.sp = spr(cast); }
      a.x = x; a.y = y; a.dir = dir || 0; a.path = null; a.moving = false; a.scripted = true; a.clip = null; a.play = false; a.queue = false; a.pray = null; a.prayPose = null;
      a.sit = pose === "sit"; a.sortY = null; a.work = pose === "work" ? 1 : 0; a.cid = a.cid || id;
      actors = actors.filter(function (b) { return b === a || b === player || hyp(b.x, b.y, x, y) > 4; });
      return a;
    },
    // put someone on their mark for a scene without anyone seeing them pop there:
    // if you can see them, they walk to it; if you can see the mark but not them, they walk in from off screen
    stage: function (id, cast, x, y, dir, pose, force) {
      var a = findActor(id);
      if (force || !a || a === player || hyp(a.x, a.y, x, y) <= 3) { CUT.spawn(id, cast, x, y, dir, pose); return Promise.resolve(); }
      var seenA = seen(a.x, a.y), seenT = seen(x, y);
      if (!seenA && !seenT) { CUT.spawn(id, cast, x, y, dir, pose); return Promise.resolve(); }
      if (!seenA) { // start them just out of view, on their way
        var line = [[a.x, a.y]].concat(findPath(a.x, a.y, x, y) || [[x, y]]), from = null;
        for (var i = line.length - 1; i > 0 && !from; i--) { // back along the way from the mark, to the first point out of view
          var p0 = line[i], p1 = line[i - 1], n = Math.max(1, Math.ceil(hyp(p0[0], p0[1], p1[0], p1[1]) / 4));
          for (var s = 1; s <= n; s++) { var px = p0[0] + (p1[0] - p0[0]) * s / n, py = p0[1] + (p1[1] - p0[1]) * s / n; if (!seen(px, py)) { from = [px, py]; break; } }
        }
        if (!from) { CUT.spawn(id, cast, x, y, dir, pose); return Promise.resolve(); }
        a.x = from[0]; a.y = from[1]; a.path = null;
      }
      var done = CUT.walk(id, x, y, { face: dir });
      var late = wait(7000);
      return Promise.race([done, late]).then(function () { CUT.spawn(id, cast, x, y, dir, pose); });
    },
    // only if nobody would see it: for setting up a scene while you're still on your way
    prestage: function (id, cast, x, y, dir, pose) {
      var a = findActor(id);
      if (seen(x, y) || (a && a !== player && seen(a.x, a.y))) return false;
      CUT.spawn(id, cast, x, y, dir, pose);
      return true;
    },
    dark: function () { return fadeEl.classList.contains("on"); },
    gone: function (id) { var a = findActor(id); if (a && a !== player) actors = actors.filter(function (b) { return b !== a; }); },
    walk: function (id, x, y, o) {
      o = o || {};
      var a = findActor(id);
      if (!a) return Promise.resolve();
      a.scripted = true; a.sit = false; a.work = 0; a.play = false; a.pray = null; a.prayPose = null; a.clip = null; a.sortY = null;
      if (o.rel) { x += a.x; y += a.y; }
      var path = o.direct ? [[x, y]] : (findPath(a.x, a.y, x, y) || [[x, y]]);
      var base = a === player ? SPEED : SPEED * 0.6;
      a.speed = base * (o.speed || 1);
      return new Promise(function (res) {
        if (hyp(a.x, a.y, x, y) < 0.5) { if (o.face != null) a.dir = o.face; res(); return; }
        a.path = path;
        a.onArrive = function () { if (o.face != null) a.dir = o.face; a.speed = base; res(); };
      });
    },
    face: function (id, d) {
      var a = findActor(id);
      if (!a) return;
      if (typeof d === "string") { var b = findActor(d); if (!b) return; var dx = b.x - a.x, dy = b.y - a.y; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); }
      else a.dir = d;
      a.scripted = true; a.work = 0;
    },
    emote: function (id, k) { var a = findActor(id); if (a && bubbles[k]) a.emote = { k: k, t: 0 }; },
    jump: function (id) { var a = findActor(id); if (a) { a.jv = 78; a.jz = Math.max(0.01, a.jz || 0); } },
    shiver: function (id, sec) { var a = findActor(id); if (a) a.shiver = sec || 1.4; },
    pose: function (id, p) {
      var a = findActor(id);
      if (!a) return;
      a.scripted = true;
      a.sit = p === "sit"; a.sortY = p === "sit" ? a.y + 1.3 : null;
      a.pray = p === "pray" ? "row" : null;
      a.prayPose = ["qiyam", "ruku", "sujood", "jalsa"].indexOf(p) >= 0 ? p : null;
      a.work = p === "work" ? 1 : 0;
      a.sleepZ = p === "sleep" ? 1 : 0;
      if (p === "kick") a.kick = 0.35;
    },
    item: function (id, k) {
      var a = findActor(id);
      if (!a) return;
      a.item = k ? { k: k, t: 0 } : null;
      if (k) { sfx("chime"); burst("twinkle", a.x, a.y - 34, 6); }
    },
    cam: function (o) {
      o = o || {};
      var cx = cam.x + viewW / 2, cy = cam.y + viewH / 2 - liftNow, tp = pointOf(o.on) || { x: cx, y: cy }, z1 = o.zoom || 1;
      zoomGoal = z1;
      return new Promise(function (res) {
        shot = { x0: cx, y0: cy, z0: zoom, x1: tp.x, y1: tp.y, z1: z1, t0: performance.now(), dur: o.ms == null ? 1000 : o.ms, track: o.track ? o.on : null, res: res };
      });
    },
    free: function () { if (shot) { shot = null; } },
    say: function (o) { return new Promise(function (res) { openTalk(talkSpec(o), res); }); },
    ask: function (o) { return new Promise(function (res) { var t = talkSpec(o); t.opts = o.options; openTalk(t, res); }); },
    fade: fade,
    go: function (loc, at, o) { o = o || {}; o.quiet = o.quiet !== false; return goLoc(loc, at, o); },
    time: function (t, instant) { setTime(t, instant); },
    repopulate: function () {
      var keep = actors.filter(function (a) { return a.scripted && a !== player; });
      populate();
      keep.forEach(function (k) {
        var id = k.cid || k.cast;
        actors = actors.filter(function (b) { return b === player || !(b.cid === id || b.cast === id || (b.person && b.person.id === id) || hyp(b.x, b.y, k.x, k.y) <= 4); });
        actors.push(k);
      });
    },
    place: function (id, x, y, dir) { var a = findActor(id); if (!a) return; a.x = x; a.y = y; if (dir != null) a.dir = dir; a.path = null; a.moving = false; a.frame = 0; if (a !== player) a.scripted = true; if (a.sit) a.sortY = y + 1.3; },
    clearAt: function (x, y, r) { actors = actors.filter(function (b) { return b === player || hyp(b.x, b.y, x, y) > (r || 4); }); },
    each: function (fn) { actors.forEach(function (a) { if (a !== player) fn(a); }); },
    near: function (at, r) { var p = pointOf(at); return p ? actors.filter(function (a) { return a !== player && hyp(a.x, a.y - 14, p.x, p.y) < r; }) : []; },
    follow: function (id, on) { var a = findActor(id); if (a && a !== player) { a.follow = !!on; a.scripted = false; a.sit = false; } },
    wait: wait,
    shake: function (ms, amp) { shakeT = (ms || 400) / 1000; shakeAmp = amp || 1.5; },
    flash: function (c, ms) {
      flashEl.style.background = c || "#FFF6E0";
      flashEl.style.transitionDuration = "0ms"; flashEl.classList.add("on"); void flashEl.offsetWidth;
      flashEl.style.transitionDuration = (ms || 900) + "ms"; flashEl.classList.remove("on");
    },
    sfx: sfx,
    bed: function (name) { var a = audio(); if (a && a.scene) a.scene(name, time); },
    hush: function () { var a = audio(); if (a && a.hush) a.hush(); },
    burst: function (k, at, n) { var p = pointOf(at); if (p) burst(k, p.x, p.y, n); },
    prop: function (key, v) { if (!RM) return; RM.st[key] = v; if (key === "notes") RM.st.noteT = T; },
    card: function (o) {
      cardK.textContent = o.k || ""; cardT.textContent = o.t || ""; cardS.textContent = o.s || "";
      cardK.hidden = !o.k; cardS.hidden = !o.s;
      cardEl.classList.add("on");
      return wait(o.ms || 2800).then(function () { cardEl.classList.remove("on"); return wait(650); });
    },
    says: function (id, t, ms) { var a = findActor(id); if (a) says.push({ a: a, t: t, until: T + (ms || 1800) / 1000 }); },
    ball: ballCmd,
    loc: function () { return LOC; },
    close: closeTalk
  };
  function setTime(t, instant) {
    var nt = TIMES[t] ? t : "asr", key = nt + "|" + day;
    if (key !== skyKey) {
      skyOld = instant ? null : sky; skyFade = instant || !sky ? 1 : 0; skyKey = key;
      sky = HARA.sky(nt, day);
    }
    time = nt; TM = TIMES[time];
    if (G && !RM && builtFor !== (time === "suhoor" ? "suhoor" : "")) rebuild(); // the hara at suhoor has its own things up (the tent)
    if (instant) { lightsOn = onGoal(); amb = ambGoal().slice(); }
    if (root) root.className = "map on t-" + time + (cutOn ? " cut" : "") + (O && O.title ? " title" : "");
  }

  /* ---------------- public ---------------- */
  H.map = {
    SPOTS: WD.SPOTS,
    attach: function (stageEl) {
      stage = stageEl;
      if (!G) build();
      stage.appendChild(root);
    },
    /*
      o.day, o.time, o.fem, o.name     who and when
      o.loc, o.at [x, y, dir]          where you start (a room id or "hara")
      o.fmt, o.cond, o.flags(), o.quests()   the story's words and memory
      o.onMove(loc, spot), o.onFlag(flag)    the story hears where you are
      o.title                          the title screen: no HUD, the camera drifts over the rooftops
      o.freeTask                       what the errand card says when there's no errand
    */
    start: function (o) {
      if (!G) build();
      O = o || {}; isOpen = true; OB = null; cutOn = false; busy = false; autoGo = false; shot = null; zoom = zoomGoal = 1;
      root.classList.remove("cut");
      setDay(URL_DAY || O.day || 1);
      player.sp = spr(O.fem ? "girl" : "boy");
      loadLoc(O.loc || "hara");
      setTime(O.time || "asr", true);
      populate();
      var p = O.at || (RM ? spawnFor("hara") : WD.SPOTS.home.stand.concat([0]));
      placePlayer(p);
      measure(); snapCam();
      if (O.title) { cam.x = 300 - viewW / 2; cam.y = 300; clampCam(); }
      var P0 = RM ? null : placeAt(player.x, player.y);
      place = placeCand = P0 ? P0.id : null; placeT = 0;
      playBed();
      qList.hidden = true; qBtn.hidden = false;
      hint.classList.toggle("gone", !O.hint);
      refreshHud();
      kick();
    },
    stop: function () {
      isOpen = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      closeTalk();
    },
    setDay: function (d) { setDay(URL_DAY || d); refreshHud(); },
    setTime: function (t, instant) { setTime(t, instant); if (!cutOn) { populate(); playBed(); } },
    clock: function (t) { clockTxt = t || ""; refreshHud(); },
    // { task, key, goals: [{ loc, spot | at | zone | enter, label, pick }], onReach(goal) }; null clears it
    objective: function (o) { OB = o && o.goals && o.goals.length ? o : null; refreshHud(); },
    news: function () {
      var seen = load("hara.news") || {};
      if (WD.NEWS[day] && !seen[day]) { seen[day] = 1; save("hara.news", seen); showBanner("جديد في الحارة", fmt(WD.NEWS[day]), "news"); }
    },
    banner: function (n, s, k) { showBanner(n, s, k || ""); },
    roomState: function (id, patch) {
      var key = id + "|" + (id === "workshop" && day >= WD.DAYS.workshopOpen ? "open" : "");
      if (!roomState[key] && H.rooms && H.rooms.has(id)) roomState[key] = H.rooms.build(id, day).st;
      if (roomState[key]) Object.assign(roomState[key], patch || {});
      if (RM && RM.id === id) RM.st = roomState[key];
    },
    refresh: refreshHud,
    cut: CUT,
    go: function (loc, at, o) { return goLoc(loc, at, o); },
    where: function () { return { loc: LOC, x: player.x, y: player.y, dir: player.dir }; },
    isOpen: function () { return isOpen; },
    // for checking things from the browser console
    _dbg: function () { return { pray: pray, cam: cam, player: player, actors: actors, day: day, place: place, loc: LOC, RM: RM, OB: OB, zoom: zoom, setFree: function (x, y) { camFree = true; cam.x = x; cam.y = y; clampCam(); }, walk: walkTo, path: findPath, T: T, go: goLoc }; }
  };
})();
