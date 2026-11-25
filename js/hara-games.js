/* فوانيس الحارة · ألعاب الملاهي: the games at the fair (walk.html).
   A game opens over the hara in its own little frame: the stall seen close up, painted in the same pixels.
   You tap to play; points become tickets (تذاكر) that the prize stall swaps for prizes, the paper cone hat first.
     صيد البط      ducks float round a trough; drop the hook as one passes under it
     النيشان       a board of balloons; the sight wanders, tap to shoot (ten pellets)
     رمي الحلقات   a ring, a field of bottles; the aim swings, tap to throw (six rings)
     اضرب الجرس    the strongman's tower; tap at the top of the swing to ring the bell (three hits)
     المرجيحة      the boat swing; push at the bottom of each swing to go higher
   H.games.play(id) pauses the map and resolves with { points, tickets } when you're done. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix;
  if (!A) return;
  var GW = 120, GH = 150, SC = 2; // the game's own pixels (drawn twice as fine, so the words stay sharp)
  var DIG = "٠١٢٣٤٥٦٧٨٩";
  function ar(n) { return String(n).replace(/\d/g, function (d) { return DIG[d]; }); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmt(t) { return H.map && H.map.fmt ? H.map.fmt(t) : String(t).replace(/\{([^|}]*)\|[^}]*\}/g, "$1"); }
  function sfx(n, v) { var a = H.audio; if (a && a.fxv) a.fxv(n, v == null ? 1 : v); }
  function el(tag, cls, parent, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (parent) parent.appendChild(e); return e; }

  /* ================= the frame every game plays in ================= */
  var root = null, cvs, g2, titleEl, scoreEl, leftEl, howEl, resEl, cur = null, raf = 0, last = 0;
  function build() {
    root = el("div", "gm"); root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
    var box = el("div", "gm-box", root);
    var top = el("div", "gm-top", box);
    titleEl = el("b", "gm-title", top);
    var st = el("div", "gm-stats", top);
    scoreEl = el("span", "gm-score", st); leftEl = el("span", "gm-left", st);
    cvs = el("canvas", "gm-cv", box); cvs.width = GW * SC; cvs.height = GH * SC;
    g2 = cvs.getContext("2d");
    howEl = el("p", "gm-how", box);
    resEl = el("div", "gm-res", box); resEl.hidden = true;
    var x = el("button", "gm-x", box, "×"); x.type = "button"; x.setAttribute("aria-label", "اقفل اللعبة");
    x.addEventListener("click", function (e) { e.stopPropagation(); if (cur) finish(true); });
    cvs.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      if (!cur || cur.over) return;
      var r = cvs.getBoundingClientRect(), gx = (e.clientX - r.left) / r.width * GW, gy = (e.clientY - r.top) / r.height * GH;
      if (!cur.started) { cur.started = true; howEl.classList.add("dim"); }
      cur.game.tap(cur, gx, gy);
    });
  }
  // the painter: whole game-pixels, plus words drawn sharp
  var P = {
    r: function (x, y, w, h, c) { if (w <= 0 || h <= 0) return; g2.fillStyle = c; g2.fillRect(Math.round(x) * SC, Math.round(y) * SC, Math.round(w) * SC, Math.round(h) * SC); },
    p: function (x, y, c) { g2.fillStyle = c; g2.fillRect(Math.round(x) * SC, Math.round(y) * SC, SC, SC); },
    el: function (x, y, w, h, c) {
      g2.fillStyle = c;
      for (var j = 0; j < h; j++) { var yy = (j + 0.5 - h / 2) / (h / 2), hw = (w / 2) * Math.sqrt(Math.max(0, 1 - yy * yy)), x0 = Math.round(x + w / 2 - hw), x1 = Math.round(x + w / 2 + hw); if (x1 > x0) g2.fillRect(x0 * SC, (Math.round(y) + j) * SC, (x1 - x0) * SC, SC); }
    },
    img: function (c, x, y) { g2.drawImage(c, Math.round(x) * SC, Math.round(y) * SC, c.width * SC, c.height * SC); },
    alpha: function (a) { g2.globalAlpha = a; },
    text: function (t, x, y, size, c, o) {
      g2.font = "700 " + Math.round(size * SC) + 'px "IBM Plex Sans Arabic", sans-serif'; g2.textAlign = "center"; g2.textBaseline = "middle";
      if (!o) { g2.fillStyle = "rgba(30,15,20,0.6)"; g2.fillText(t, x * SC, y * SC + 2); }
      g2.fillStyle = c; g2.fillText(t, x * SC, y * SC);
    }
  };
  function hud() {
    scoreEl.textContent = "النقط: " + ar(cur.points);
    leftEl.textContent = cur.game.left(cur);
  }
  function frame(t) {
    raf = 0;
    if (!cur) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    cur.T += dt;
    if (cur.started && !cur.over) cur.game.step(cur, dt);
    cur.pops = cur.pops.filter(function (p) { p.t += dt; p.y -= dt * 14; return p.t < 1; });
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.imageSmoothingEnabled = false; g2.globalAlpha = 1;
    cur.game.draw(cur, P);
    cur.pops.forEach(function (p) { P.alpha(1 - p.t * p.t); P.text(p.t0, p.x, p.y, 7, p.c || "#FFE07A"); P.alpha(1); });
    if (!cur.started) { P.alpha(0.55 + 0.45 * Math.sin(cur.T * 4)); P.text(fmt("{اضغط|اضغطي} عشان {تبدأ|تبدأي}"), 60, 144, 6.5, "#FFFFFF"); P.alpha(1); }
    hud();
    raf = requestAnimationFrame(frame);
  }
  function finish(quit) {
    if (!cur || cur.over) return;
    cur.over = true;
    var c = cur, pts = c.points, tk = quit ? 0 : Math.max(pts > 0 ? 1 : 0, Math.round(pts / 5));
    if (quit) { close(c, { points: 0, tickets: 0 }); return; }
    setTimeout(function () {
      resEl.textContent = ""; resEl.hidden = false;
      el("p", "gm-res-k", resEl, c.game.verdict ? c.game.verdict(c) : "خلصت!");
      el("p", "gm-res-p", resEl, "جمعت " + ar(pts) + " نقطة");
      el("p", "gm-res-t", resEl, tk ? "🎟️ كسبت " + ar(tk) + " " + (tk > 10 || tk < 3 ? "تذكرة" : "تذاكر") : "المرة الجاية!");
      var acts = el("div", "gm-res-acts", resEl);
      var again = el("button", "wl-btn", acts, "العب تاني"); again.type = "button";
      var done = el("button", "wl-btn ghost", acts, "كفاية كده"); done.type = "button";
      again.addEventListener("click", function () { var cb = c.res; c.res = null; close(c, { points: pts, tickets: tk, again: true }, cb); });
      done.addEventListener("click", function () { close(c, { points: pts, tickets: tk }); });
      if (tk) sfx("ding", 0.8); else sfx("whoosh", 0.6);
    }, 700);
  }
  function close(c, out, cb) {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    cur = null; root.classList.remove("on");
    setTimeout(function () { if (!cur) root.hidden = true; }, 260);
    if (H.map && H.map.resume) H.map.resume();
    var r = cb || c.res; c.res = null;
    if (r) r(out);
  }
  function play(id) {
    var game = GAMES[id];
    if (!game) return Promise.resolve({ points: 0, tickets: 0 });
    if (!root) build();
    if (!root.isConnected) (document.getElementById("app") || document.body).appendChild(root);
    if (H.map && H.map.pause) H.map.pause();
    return new Promise(function (res) {
      cur = { game: game, points: 0, T: 0, pops: [], started: false, over: false, res: res };
      game.init(cur);
      titleEl.textContent = game.title; howEl.textContent = game.how; howEl.classList.remove("dim");
      resEl.hidden = true; root.hidden = false; void root.offsetWidth; root.classList.add("on");
      last = 0; raf = requestAnimationFrame(frame);
    });
  }
  function pop(c, x, y, t, col) { c.pops.push({ x: x, y: y, t0: t, t: 0, c: col }); }

  /* ================= the backdrops ================= */
  function tentBack(P, c1, c2) { // the stall's striped canvas back and its bulbs
    for (var x = 0; x < GW; x += 8) P.r(x, 0, 8, GH, ((x / 8) % 2) ? c1 : c2);
    P.alpha(0.55); P.r(0, 0, GW, GH, "#1A1030"); P.alpha(1);
  }
  function bulbs(P, T, y) { for (var x = 3; x < GW; x += 6) P.r(x, y, 2, 2, ((x + ((T * 8) | 0)) % 3) ? "#FFE07A" : "#FFFFFF"); }

  /* ================= the games ================= */
  var GAMES = {};

  // صيد البط: the hook hangs at the front of the trough; ducks drift round; tap to drop it
  GAMES.duck = {
    title: "صيد البط", how: "البط بيلف في المية. {اضغط|اضغطي} لما بطة تعدّي تحت السنارة. البطة الدهبي بخمسين!",
    init: function (c) {
      c.time = 25; c.ducks = [];
      for (var i = 0; i < 9; i++) c.ducks.push({ a: i / 9 * Math.PI * 2, v: [5, 10, 5, 20, 5, 10, 5, 10, 50][i], bob: rnd(0, 6) });
      c.hook = { drop: 0, got: null }; c.speed = 0.55;
    },
    left: function (c) { return "⏱ " + ar(Math.ceil(Math.max(0, c.time))); },
    step: function (c, dt) {
      c.time -= dt; c.speed = 0.55 + (25 - c.time) * 0.02;
      c.ducks.forEach(function (d) { if (!d.out) d.a += dt * c.speed; else { d.out -= dt; if (d.out <= 0) { d.out = 0; d.v = [5, 10, 20, 5, 10][(Math.random() * 5) | 0]; if (Math.random() < 0.15) d.v = 50; } } });
      if (c.hook.drop > 0) {
        c.hook.drop -= dt;
        if (c.hook.drop <= 0.2 && !c.hook.checked) {
          c.hook.checked = true;
          var best = null;
          c.ducks.forEach(function (d) { if (d.out) return; var p = duckPos(d); if (p.front && Math.abs(p.x - 60) < 7 && (!best || Math.abs(p.x - 60) < Math.abs(duckPos(best).x - 60))) best = d; });
          if (best) { c.points += best.v; best.out = 1.2; c.hook.got = best.v; pop(c, 60, 92, "+" + ar(best.v), best.v >= 50 ? "#FFE07A" : "#FFFFFF"); sfx("splash", 0.9); if (best.v >= 50) sfx("ding", 0.7); }
          else { pop(c, 60, 100, "فاتتك!", "#9ACCF4"); sfx("splash", 0.5); }
        }
      }
      if (c.time <= 0) finish();
    },
    tap: function (c) { if (c.hook.drop > 0) return; c.hook = { drop: 0.55, got: null, checked: false }; sfx("whoosh", 0.4); },
    draw: function (c, P) {
      tentBack(P, "#2F6A8A", "#F4EFE4"); bulbs(P, c.T, 4);
      // the trough: a round tub of water seen from above and in front
      P.el(6, 66, 108, 62, "#8A5A3A"); P.el(8, 66, 104, 56, "#B8743A"); P.el(12, 70, 96, 48, "#2F8AC8"); P.el(18, 74, 84, 38, "#3FA0D8");
      for (var w = 0; w < 6; w++) { var wy = 78 + w * 6, wx = 24 + ((c.T * 10 + w * 17) % 70); P.r(wx, wy, 6, 1, "#8AD0F4"); }
      // the ducks: those at the back first
      var list = c.ducks.filter(function (d) { return !d.out; }).map(function (d) { return { d: d, p: duckPos(d) }; }).sort(function (a, b) { return a.p.y - b.p.y; });
      list.forEach(function (o) { duck(P, o.p.x, o.p.y + Math.sin(c.T * 3 + o.d.bob) * 0.6, o.d.v, o.p.s); });
      // the front rim, over the ducks at the front
      P.r(8, 118, 104, 3, "#8A5A3A"); P.el(10, 112, 100, 14, "rgba(0,0,0,0)");
      // the rod and the hook
      var dropK = c.hook.drop > 0 ? 1 - Math.abs(c.hook.drop - 0.275) / 0.275 : 0, hy = 70 + dropK * 34;
      P.r(60, 22, 1, hy - 22, "#E8E2D6"); P.r(58, 18, 60, 2, "#C9A46A");
      P.r(59, hy, 3, 1, "#C8C8D0"); P.r(61, hy - 2, 1, 3, "#C8C8D0"); P.p(58, hy - 1, "#C8C8D0");
      if (c.hook.got && c.hook.drop > 0 && c.hook.drop < 0.2) duck(P, 60, hy + 6, c.hook.got, 1);
      P.alpha(0.35); P.r(56, 103, 9, 2, "#FFFFFF"); P.alpha(1); // where it lands
    },
    verdict: function (c) { return c.points >= 80 ? "صياد محترف!" : c.points >= 40 ? "صيد حلو!" : "البط شاطر النهارده…"; }
  };
  function duckPos(d) { var x = 60 + Math.cos(d.a) * 40, y = 92 + Math.sin(d.a) * 16; return { x: x, y: y, front: Math.sin(d.a) > 0.55, s: 0.85 + Math.sin(d.a) * 0.15 }; }
  function duck(P, x, y, v, s) {
    var gold = v >= 50, body = gold ? "#FFD24A" : "#FFE07A", dk2 = gold ? "#C8963E" : "#E8B840";
    P.el(x - 6, y - 3, 12, 7, body); P.r(x - 6, y + 1, 12, 1, dk2); P.el(x + 1, y - 8, 6, 6, body); P.p(x + 4, y - 6, "#2A1A24"); P.r(x + 6, y - 5, 3, 2, "#F08A2A");
    P.r(x - 5, y - 3, 7, 5, gold ? "#FFFFFF" : "#F4EFE4"); P.r(x - 5, y + 1, 7, 1, "#C8B8A0"); P.text(ar(v), x - 1.5, y - 0.4, 4.4, gold ? "#C8302C" : "#B5473B", true);
  }

  // النيشان: ten pellets, a board of balloons, a wandering sight
  GAMES.shoot = {
    title: "النيشان", how: "النيشان بيلف لوحده. {اضغط|اضغطي} لما يقف على بالونة. معاك عشر رصاصات… البالونة الدهبي بتلاتين!",
    init: function (c) {
      c.shots = 10; c.bal = [];
      var cols = ["#E8503F", "#4F97E8", "#4CBF73", "#F2C14A", "#B86BE0", "#FF8F3F"];
      for (var j = 0; j < 4; j++) for (var i = 0; i < 6; i++) c.bal.push({ x: 15 + i * 18, y: 36 + j * 18, c: cols[(i + j * 2) % 6], gold: false, hit: 0 });
      c.bal[(Math.random() * c.bal.length) | 0].gold = true; c.bal[(Math.random() * c.bal.length) | 0].gold = true;
      c.flash = 0;
    },
    left: function (c) { return "🎯 " + ar(c.shots); },
    sight: function (c) { var t = c.T; return [60 + Math.sin(t * 1.25) * 46 + Math.sin(t * 3.1) * 4, 63 + Math.sin(t * 1.9 + 1) * 28 + Math.cos(t * 2.7) * 3]; },
    step: function (c, dt) { if (c.flash > 0) c.flash -= dt; c.bal.forEach(function (b) { if (b.hit > 0) b.hit += dt; }); if (c.shots <= 0 && c.flash <= 0) finish(); },
    tap: function (c) {
      if (c.shots <= 0) return;
      c.shots--; c.flash = 0.12; sfx("thud", 0.5);
      var s = GAMES.shoot.sight(c), hit = null;
      c.bal.forEach(function (b) { if (!b.hit && Math.hypot(b.x - s[0], b.y - s[1]) < 6.5) hit = b; });
      if (hit) { hit.hit = 0.01; var v = hit.gold ? 30 : 10; c.points += v; pop(c, hit.x, hit.y - 6, "+" + ar(v), hit.gold ? "#FFE07A" : "#FFFFFF"); sfx("pop", 1); }
      else pop(c, s[0], s[1] - 6, "طاشت!", "#C8C0B0");
    },
    draw: function (c, P) {
      tentBack(P, "#8A2A34", "#F2C14A"); bulbs(P, c.T, 4);
      P.r(6, 22, 108, 84, "#6A4430"); P.r(8, 24, 104, 80, "#E8DCC0"); for (var y = 26; y < 104; y += 6) P.r(8, y, 104, 1, "#D8C8A8");
      c.bal.forEach(function (b) {
        if (b.hit > 0.25) return;
        if (b.hit > 0) { P.alpha(1 - b.hit * 4); for (var k = 0; k < 6; k++) P.r(b.x + Math.cos(k) * b.hit * 30, b.y + Math.sin(k) * b.hit * 30, 2, 1, b.c); P.alpha(1); return; }
        var col = b.gold ? "#FFD24A" : b.c, wob = Math.sin(c.T * 2 + b.x) * 0.5;
        P.el(b.x - 5, b.y - 6 + wob, 10, 12, col); P.r(b.x - 2, b.y - 4 + wob, 2, 3, "#FFFFFF"); P.r(b.x, b.y + 6 + wob, 1, 3, "#8A8478");
        if (b.gold) P.r(b.x + 2, b.y - 3, 1, 1, "#FFFFFF");
      });
      // the counter in front, with the air rifle resting on it
      P.r(0, 108, GW, 42, "#8A5A3A"); P.r(0, 108, GW, 2, "#B8743A"); for (var x = 0; x < GW; x += 10) P.r(x, 112, 1, 38, "#6A4430");
      P.r(70, 118, 44, 5, "#3A3440"); P.r(98, 116, 18, 9, "#6A4430"); P.r(70, 117, 30, 1, "#8A8E94");
      var s = GAMES.shoot.sight(c);
      P.r(s[0] - 6, s[1], 4, 1, "#E8303A"); P.r(s[0] + 3, s[1], 4, 1, "#E8303A"); P.r(s[0], s[1] - 6, 1, 4, "#E8303A"); P.r(s[0], s[1] + 3, 1, 4, "#E8303A");
      P.alpha(0.5); P.el(s[0] - 4, s[1] - 4, 9, 9, "rgba(255,255,255,0.15)"); P.alpha(1);
      if (c.flash > 0) { P.alpha(0.5); P.r(0, 0, GW, GH, "#FFF6E0"); P.alpha(1); }
      for (var i = 0; i < c.shots; i++) P.r(6 + i * 4, 140, 2, 4, "#C8963E");
    },
    verdict: function (c) { return c.points >= 90 ? "عين صقر!" : c.points >= 50 ? "نيشان حلو!" : "البالونات زعلانة منك شوية."; }
  };

  // رمي الحلقات: six rings; the aim swings across, the reach swings up and down; land one round a bottle neck
  GAMES.rings = {
    title: "رمي الحلقات", how: "العلامة بتتحرك. {اضغط|اضغطي} عشان {ترمي|ترمي} الحلقة عليها. لو لبست في رقبة إزازة… عشرين نقطة!",
    init: function (c) {
      c.rings = 6; c.fly = null; c.on = [];
      c.bottles = [];
      for (var j = 0; j < 3; j++) for (var i = 0; i < 5 - (j % 2); i++) c.bottles.push({ x: 18 + i * 21 + (j % 2) * 10, y: 50 + j * 17, c: ["#3FA86A", "#C8443A", "#4F97E8", "#F2C14A"][(i + j) % 4], ring: false });
    },
    left: function (c) { return "⭕ " + ar(c.rings); },
    aim: function (c) { return [60 + Math.sin(c.T * 1.6) * 48, 70 + Math.sin(c.T * 2.3 + 0.7) * 26]; },
    step: function (c, dt) {
      if (c.fly) {
        c.fly.t += dt / 0.6;
        if (c.fly.t >= 1) {
          var f = c.fly, hit = null; c.fly = null;
          c.bottles.forEach(function (b) { if (!b.ring && Math.hypot(b.x - f.x1, (b.y - 6) - f.y1) < 3.6) hit = b; });
          if (hit) { hit.ring = true; c.points += 20; pop(c, hit.x, hit.y - 16, "+٢٠", "#FFE07A"); sfx("clink", 1.2); sfx("ding", 0.5); }
          else { c.on.push({ x: f.x1 + rnd(-4, 4), y: f.y1 + rnd(2, 6) }); pop(c, f.x1, f.y1 - 6, "قرّبت!", "#C8C0B0"); sfx("clink", 0.6); }
          if (c.rings <= 0) setTimeout(function () { if (cur === c) finish(); }, 500);
        }
      }
    },
    tap: function (c) {
      if (c.fly || c.rings <= 0) return;
      var a = GAMES.rings.aim(c); c.rings--;
      c.fly = { x0: 60, y0: 138, x1: a[0] + rnd(-1.5, 1.5), y1: a[1] + rnd(-1.5, 1.5), t: 0 };
      sfx("whoosh", 0.5);
    },
    draw: function (c, P) {
      tentBack(P, "#3F8F5F", "#F4EFE4"); bulbs(P, c.T, 4);
      P.r(4, 30, 112, 78, "#C8A070"); for (var y = 32; y < 108; y += 5) P.r(4, y, 112, 1, "#B8905E"); P.r(4, 30, 112, 2, "#E0B880");
      c.bottles.forEach(function (b) {
        P.r(b.x - 3, b.y - 10, 7, 11, b.c); P.r(b.x - 3, b.y - 10, 2, 11, A.lt(b.c, 0.35)); P.r(b.x - 1, b.y - 15, 3, 5, b.c); P.r(b.x - 1, b.y - 16, 3, 1, "#E8E2D6");
        if (b.ring) { P.el(b.x - 5, b.y - 9, 11, 4, "#E8503F"); P.el(b.x - 3, b.y - 8, 7, 2, b.c); }
      });
      c.on.forEach(function (r) { P.el(r.x - 5, r.y - 2, 11, 4, "#E8503F"); P.el(r.x - 3, r.y - 1, 7, 2, "#C8A070"); });
      var a = GAMES.rings.aim(c);
      if (!c.fly && c.rings > 0) { P.alpha(0.7 + 0.3 * Math.sin(c.T * 8)); P.el(a[0] - 5, a[1] - 2, 11, 5, "#FFFFFF"); P.el(a[0] - 3, a[1] - 1, 7, 3, "#C8A070"); P.alpha(1); }
      if (c.fly) { var f = c.fly, t = f.t, x = f.x0 + (f.x1 - f.x0) * t, y = f.y0 + (f.y1 - f.y0) * t - Math.sin(t * Math.PI) * 30, s = 1.6 - t * 0.6; P.el(x - 5 * s, y - 2 * s, 11 * s, 5 * s, "#E8503F"); P.el(x - 3 * s, y - 1 * s, 7 * s, 3 * s, "rgba(0,0,0,0)"); }
      P.r(0, 112, GW, 38, "#6A4430"); P.r(0, 112, GW, 2, "#8A5A3A");
      for (var i = 0; i < c.rings; i++) { P.el(8 + i * 12, 130, 10, 6, "#E8503F"); P.el(10 + i * 12, 131, 6, 4, "#6A4430"); }
    },
    verdict: function (c) { return c.points >= 80 ? "إيدك تتلف في حرير!" : c.points >= 40 ? "حلو قوي!" : "الإزاز ده متدهن زيت أكيد."; }
  };

  // اضرب الجرس: three hits; the power swings; ring the bell at the top
  GAMES.hammer = {
    title: "اضرب الجرس", how: "العداد بيطلع وينزل. {اضغط|اضغطي} وهو في الأحمر فوق عشان الجرس يرن!",
    init: function (c) { c.hits = 3; c.puck = null; c.best = 0; },
    left: function (c) { return "🔨 " + ar(c.hits); },
    power: function (c) { var k = (c.T * 1.15) % 2; return k < 1 ? k : 2 - k; },
    step: function (c, dt) {
      if (!c.puck) return;
      var p = c.puck; p.t += dt;
      var up = Math.min(1, p.t / 0.55), h = p.pw * Math.sin(up * Math.PI / 2);
      p.h = p.t < 0.55 ? h : Math.max(0, p.pw - (p.t - 0.55) * 1.6);
      if (!p.scored && p.t >= 0.55) {
        p.scored = true;
        var v = p.pw > 0.95 ? 40 : p.pw > 0.8 ? 20 : p.pw > 0.55 ? 10 : 0;
        c.points += v; c.best = Math.max(c.best, p.pw);
        if (p.pw > 0.95) { sfx("ding", 1.3); c.ring = 0.8; pop(c, 60, 20, "دينننج! +٤٠", "#FFE07A"); }
        else pop(c, 60, 120 - p.pw * 90, v ? "+" + ar(v) : "ضعيف!", v ? "#FFFFFF" : "#C8C0B0");
      }
      if (c.ring > 0) c.ring -= dt;
      if (p.h <= 0 && p.t > 0.6) { c.puck = null; if (c.hits <= 0) setTimeout(function () { if (cur === c) finish(); }, 400); }
    },
    tap: function (c) {
      if (c.puck || c.hits <= 0) return;
      c.hits--; var pw = GAMES.hammer.power(c);
      c.puck = { pw: clamp(pw * 1.02, 0, 1), t: 0, h: 0 }; sfx("thud", 1); cvs.classList.remove("shake"); void cvs.offsetWidth; cvs.classList.add("shake");
    },
    draw: function (c, P) {
      tentBack(P, "#2A3F7A", "#E8503F"); bulbs(P, c.T, 4);
      // the tower with its scale, the bell on top
      P.r(52, 18, 16, 112, "#E8DCC0"); P.r(52, 18, 2, 112, "#FFFFFF"); P.r(66, 18, 2, 112, "#B8A888");
      for (var i = 0; i < 10; i++) { var y = 120 - i * 10; P.r(54, y, 12, 1, "#8A7A6A"); P.r(54, y - 9, 12, 9, ["#4CBF73", "#4CBF73", "#8AD04A", "#C8D040", "#F2C14A", "#F2A040", "#F08A2A", "#E8603A", "#E8503F", "#C8302C"][i]); }
      P.alpha(0.6); P.r(54, 20, 12, 100, "#E8DCC0"); P.alpha(1);
      P.r(59, 20, 2, 100, "#5A4A48");
      var ring = c.ring > 0, bx = 52 + (ring ? Math.round(Math.sin(c.T * 40)) : 0);
      P.el(bx, 6, 16, 14, "#F2C76C"); P.el(bx + 2, 7, 12, 10, "#C8963E"); P.r(bx + 7, 16, 2, 3, "#8A6224");
      if (ring) { P.alpha(0.6); P.el(36, -4, 48, 34, "#FFF6C0"); P.alpha(1); }
      var h = c.puck ? c.puck.h : 0; P.r(56, 118 - h * 100, 8, 5, "#E8503F"); P.r(56, 118 - h * 100, 8, 1, "#FF8A7A");
      P.r(40, 130, 40, 6, "#8A8E94"); P.r(46, 128, 28, 3, "#6A6E74");
      // the power swing on the side
      var pw = GAMES.hammer.power(c);
      P.r(90, 30, 10, 100, "#2A1C26"); P.r(91, 31, 8, 98, "#4A3A48");
      P.r(91, 31, 8, 8, "#E8503F");
      P.r(91, 129 - pw * 98, 8, pw * 98, pw > 0.92 ? "#FF5A4A" : pw > 0.7 ? "#F2C14A" : "#4CBF73");
      P.r(88, 129 - pw * 98, 14, 2, "#FFFFFF");
      // the strongman's mallet, ready
      var sw = c.puck && c.puck.t < 0.2 ? 1 : 0;
      P.r(20, 96 + sw * 22, 4, 34 - sw * 22, "#8A5A3A"); P.r(12, 90 + sw * 22, 20, 9, "#6A6E74"); P.r(12, 90 + sw * 22, 20, 2, "#9A9EA4");
    },
    verdict: function (c) { return c.best > 0.95 ? "الجرس رن! أقوى واحد في الحارة!" : c.best > 0.8 ? "قربت من الجرس!" : "الشاكوش تقيل… {جرّب|جرّبي} تاني."; }
  };

  // المرجيحة: the boat swing; push when it passes the bottom; the higher you go, the more points
  GAMES.swing = {
    title: "المرجيحة", how: "{اضغط|اضغطي} لما المركب يعدّي من تحت خالص عشان {تزقّه|تزقّيه}. كل ما تعلى… النقط تزيد!",
    init: function (c) { c.amp = 0.25; c.ph = 0; c.time = 18; c.best = 0; c.push = 0; },
    left: function (c) { return "⏱ " + ar(Math.ceil(Math.max(0, c.time))); },
    step: function (c, dt) {
      c.time -= dt; c.ph += dt * 2.4; c.amp = Math.max(0.2, c.amp - dt * 0.015);
      c.best = Math.max(c.best, c.amp); c.points = Math.round(Math.max(0, c.best - 0.25) / 1.1 * 100);
      if (c.push > 0) c.push -= dt;
      var top = Math.abs(Math.cos(c.ph)) > 0.995;
      if (top && c.amp > 1.1 && !c.cheered) { c.cheered = true; sfx("cheer", 0.6); }
      if (!top) c.cheered = false;
      if (c.time <= 0) finish();
    },
    tap: function (c) {
      var bottom = Math.abs(Math.sin(c.ph)) > 0.86; // passing the bottom: the angle is near zero there
      if (bottom) { c.amp = Math.min(1.35, c.amp + 0.14); c.push = 0.3; pop(c, 60, 120, "زقّة!", "#7CFFB0"); sfx("whoosh", 0.6); }
      else { c.amp = Math.max(0.15, c.amp - 0.05); pop(c, 60, 120, "مش دلوقتي", "#C8C0B0"); }
    },
    draw: function (c, P) {
      tentBack(P, "#B86BE0", "#F2C14A"); bulbs(P, c.T, 4);
      P.r(0, 128, GW, 22, "#8A6A48");
      // the frame and the bar
      P.r(10, 20, 100, 4, "#C8443A"); P.r(14, 24, 3, 104, "#8A2A34"); P.r(103, 24, 3, 104, "#8A2A34");
      var ang = Math.cos(c.ph) * c.amp, px = 60, py = 22, L = 70, bx = px + Math.sin(ang) * L, by = py + Math.cos(ang) * L;
      for (var k = 0; k <= 20; k++) { P.r(px + Math.sin(ang) * L * k / 20 - 4, py + Math.cos(ang) * L * k / 20, 1, 1, "#E8E2D6"); P.r(px + Math.sin(ang) * L * k / 20 + 4, py + Math.cos(ang) * L * k / 20, 1, 1, "#E8E2D6"); }
      // the boat: painted wood with a pattern, you in it
      P.r(bx - 13, by, 26, 9, "#2F6A8A"); P.r(bx - 15, by - 2, 30, 3, "#F2C14A"); P.r(bx - 11, by + 9, 22, 2, "#2F6A8A");
      for (var d = -10; d < 11; d += 5) P.r(bx + d, by + 3, 2, 2, "#E8503F");
      P.r(bx - 3, by - 12, 6, 6, "#E5B088"); P.r(bx - 3, by - 13, 6, 2, "#2B1F26"); P.r(bx - 4, by - 6, 8, 6, "#3F9A9A"); P.p(bx - 2, by - 10, "#2A1A24"); P.p(bx + 1, by - 10, "#2A1A24");
      // how high you've been
      var hk = Math.min(1, c.amp / 1.35);
      P.r(112, 30, 4, 90, "#2A1C26"); P.r(112, 120 - hk * 90, 4, hk * 90, hk > 0.9 ? "#FF5A4A" : "#7CFFB0");
      if (Math.abs(Math.sin(c.ph)) > 0.86) { P.alpha(0.7); P.r(52, 136, 16, 3, "#7CFFB0"); P.alpha(1); }
    },
    verdict: function (c) { return c.best > 1.2 ? "طرت لحد السما!" : c.best > 0.8 ? "عليت قوي!" : "{زقّ|زقّي} أقوى المرة الجاية!"; }
  };

  // the words of a game follow who you are (him or her)
  Object.keys(GAMES).forEach(function (k) {
    var g = GAMES[k];
    ["how"].forEach(function (f) { var raw = g[f]; Object.defineProperty(g, f, { get: function () { return H.map && H.map.fmt ? H.map.fmt(raw) : raw; } }); });
    var v = g.verdict; if (v) g.verdict = function (c) { var t = v(c); return H.map && H.map.fmt ? H.map.fmt(t) : t; };
  });

  H.games = { play: play, list: Object.keys(GAMES) };
})();
