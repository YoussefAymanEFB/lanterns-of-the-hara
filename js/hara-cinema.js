/* فوانيس الحارة · سينما النصر: the cinema that shows the hara to itself (walk.html).
   The old cinema in the stone house on the square shut in 2002. From day 18 Am Morsy, who ran its projector, is out
   front scrubbing the posters; on night 22 it opens with one film nobody has seen: الحارة زمان, the reels he shot
   himself in Ramadan 1999 and kept in a tin under his bed. Young Saber with black hair carving a lantern; Hassan,
   thin as a stick, running bread from his father's oven; Nemat on a roof with Abdo and his pigeons; and a woman
   laying the very first mercy table in the square with her small son, Nabil. The neighbours in the seats see
   themselves and call out. Morsy's hands shake now, so you turn the crank: too slow and the film drags, too fast and
   everyone runs like ants. After taraweeh only (Saber, Hassan and Nemat are in the seats those nights). */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world, PL = H.places;
  if (!A || !WD || !H.rooms || !PL) return;
  var S = PL.S, ar = PL.ar, sprite = A.sprite, PROPS = A.PROPS, dk = A.dk, lt = A.lt, mix = A.mix, rng = A.rng, SK = A.SKIN, WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS;
  var K = H.rooms.kit;
  var OPENS = PL.OPEN.cinema;
  var CW = 240, CH = 222, WALL = 76;
  var FW = 128, FH = 58, SX = 56, SY = 9; // the film's own pixels, and where the screen is on the wall
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function sfx(n, v) { var a = H.audio; if (a && a.fxv) a.fxv(n, v == null ? 1 : v); }

  /* ================= who's who ================= */
  var CAST = {
    morsy: { build: "thin", skin: SK.fair, hair: { style: "grey", c: "#C8C2BA" }, top: { kind: "shirt", c: "#C8B07A" }, vest: "#6A4A3A", legs: "#4A4A5A", glasses: true, mus: "#C8C2BA" },
    au1: { skin: SK.mid, hair: { style: "short", c: "#2B1F26" }, top: { kind: "robe", c: "#5E7A9A" } },
    au2: { skin: SK.tan, head: { kind: "hijab", c: "#8A4A6A" }, top: { kind: "robe", c: "#3A3A5A" } },
    au3: { build: "fat", skin: SK.deep, hair: { style: "grey", c: "#8A8480" }, top: { kind: "robe", c: "#B9A88A" } },
    au4: { skin: SK.fair, head: { kind: "hijab", c: "#4F97E8" }, top: { kind: "robe", c: "#7A3A4A" } },
    au5: { kid: true, skin: SK.mid, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "tee", c: "#E8503F" } },
    au6: { kid: true, skin: SK.tan, head: { kind: "hijab", c: "#F2C14A" }, top: { kind: "dress", c: "#4CBF73" } },
    // in the film, 25 years younger
    ySaber: { build: "thin", skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, top: { kind: "robe", c: "#C8B48A" }, apron: "#7A5A3A", mus: "#2B1F26" },
    yHassan: { build: "thin", skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, head: { kind: "cap" }, top: { kind: "tee", c: "#F1EDE4" }, legs: "#4A4A5A" },
    hDad: { build: "fat", skin: SK.tan, hair: { style: "grey", c: "#8A8480" }, head: { kind: "cap" }, top: { kind: "robe", c: "#F1EDE4" }, mus: "#8A8480", musBig: true },
    yNemat: { skin: SK.fair, head: { kind: "hijab", c: "#E8E2D6" }, top: { kind: "robe", c: "#8A6A9A" } },
    abdo: { skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, head: { kind: "taqiyah" }, top: { kind: "robe", c: "#6A7A5A" }, mus: "#2B1F26" },
    nMom: { skin: SK.mid, head: { kind: "khimar", c: "#3A3440" }, top: { kind: "robe", c: "#3A3440" } },
    boyNabil: { kid: true, skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, top: { kind: "robe", c: "#E8E2D6" } },
    fk1: { kid: true, skin: SK.deep, hair: { style: "curly", c: "#1F1619" }, top: { kind: "tee", c: "#8A8A8A" } },
    fk2: { kid: true, skin: SK.fair, hair: { style: "braids", c: "#5A3A28" }, top: { kind: "dress", c: "#C8A0A0" } }
  };
  Object.keys(CAST).forEach(function (k) { if (!WD.CAST[k]) WD.CAST[k] = CAST[k]; });
  var SP = {};
  function sp(id) { return SP[id] || (SP[id] = A.person(WD.CAST[id])); }

  // the nights of the cinema: Saber, Hassan and Nemat are in the seats, not out in the hara
  function cinemaNight(d, t) { return d >= OPENS && t === "night"; }
  WD.PEOPLE.forEach(function (p) { if (p.id === "saber" || p.id === "hassan" || p.id === "nemat") p.awayIf = cinemaNight; });

  /* ================= the film ================= */
  var film = A.cv(FW, FH), fg = film.getContext("2d"), FP = A.Pt(film);
  var BG = {};
  function bg(id, paint) { if (!BG[id]) { var c = A.cv(FW, FH); paint(A.Pt(c), rng(id.length * 9)); BG[id] = c; } return BG[id]; }
  function lanternsAcross(P, y, n) { for (var i = 0; i < n; i++) { var x = 6 + i * (FW - 12) / (n - 1); P.r(x, y + Math.round(Math.sin(i) * 2), 2, 3, GLASS[i % 6]); } P.r(0, y - 1, FW, 1, "#5A4A40"); }
  function who(P, id, x, y, d, f) { var s = sp(id), im = s.f[d][f || 0]; fg.drawImage(im, Math.round(x - 11), Math.round(y - 30)); }
  var SCENES = [
    { t: 4.5, draw: function (P, k, T) { // the title cards
      P.r(0, 0, FW, FH, "#1A1410");
      fg.font = "700 9px 'Aref Ruqaa', serif"; fg.textAlign = "center"; fg.fillStyle = "#E8DCC0";
      fg.fillText(k < 0.45 ? "سينما النصر تقدم" : "الحارة · رمضان ١٩٩٩", FW / 2, 30);
      P.r(30, 38, 68, 1, "#8A7A60");
    } },
    { t: 7, draw: function (P, k, T) { // the workshop: Saber, young, carving a lantern; two kids watching
      fg.drawImage(bg("shop", function (Q, R) {
        Q.r(0, 0, FW, FH, "#8A6A4A"); for (var x = 0; x < FW; x += 7) Q.r(x, 0, 1, 40, "#7A5A3A");
        Q.r(0, 40, FW, 18, "#C8A878"); Q.dots(0, 40, FW, 18, ["#B8986A", "#E0C090"], 120, R);
        for (var i = 0; i < 5; i++) { Q.r(10 + i * 22, 8, 1, 6, "#3A2A20"); Q.r(7 + i * 22, 14, 7, 9, GLASS[i % 6]); Q.r(7 + i * 22, 14, 7, 1, "#C8963E"); }
        Q.r(50, 40, 36, 6, WOOD[0]); Q.r(52, 46, 3, 8, WOOD[3]); Q.r(82, 46, 3, 8, WOOD[3]);
      }), 0, 0);
      var hit = ((T * 3) | 0) % 2;
      who(P, "ySaber", 46, 52, 3, hit); P.r(56, 36 - hit, 6, 7, GLASS[3]); P.r(55, 35 - hit, 8, 1, "#C8963E");
      who(P, "fk1", 92, 54, 2, 0); who(P, "fk2", 104, 55, 2, ((T * 2) | 0) % 5 === 0 ? 1 : 0);
      if (hit) { P.p(62, 34, "#FFF4C0"); P.p(64, 32, "#FFF4C0"); }
    } },
    { t: 7, draw: function (P, k, T) { // the bakery: Hassan's father at the oven, young Hassan running with the bread board
      fg.drawImage(bg("bakery", function (Q, R) {
        Q.r(0, 0, FW, FH, "#6A4A40"); Q.el(30, 6, 56, 40, "#A0583A"); Q.el(34, 8, 48, 34, "#B8674A"); Q.el(44, 18, 28, 22, "#2A1814"); Q.r(44, 30, 28, 12, "#2A1814");
        Q.r(0, 44, FW, 14, "#B8A888"); Q.dots(0, 44, FW, 14, ["#E8E2D6", "#F4EFE4"], 80, R);
      }), 0, 0);
      var fl = 0.7 + 0.3 * Math.sin(T * 13); fg.globalAlpha = fl; P.el(48, 24, 20, 14, "#FF9A3A"); P.el(52, 28, 12, 8, "#FFE07A"); fg.globalAlpha = 1;
      who(P, "hDad", 30, 52, 0, 0);
      var x = -20 + k * 170, f = ((T * 8) | 0) % 4;
      who(P, "yHassan", x, 54, 3, f); P.r(x - 7, 22, 16, 2, "#9C6542"); [0, 5, 10].forEach(function (d) { P.el(x - 6 + d, 19, 5, 3, "#D9A25E"); });
    } },
    { t: 7.5, draw: function (P, k, T) { // a roof: Nemat and Abdo, the tower, the flock going round
      fg.drawImage(bg("roof", function (Q, R) {
        for (var y = 0; y < 34; y++) Q.r(0, y, FW, 1, mix("#BFD8E8", "#F2E8D0", y / 34));
        [[0, 20, 22], [22, 26, 18], [96, 22, 32]].forEach(function (h) { Q.r(h[0], 34 - h[1] + 8, h[2], h[1], "#B8A890"); });
        Q.r(0, 34, FW, 24, "#C8BCA8"); Q.dots(0, 34, FW, 24, ["#B8AC98"], 80, R);
        Q.r(86, 12, 24, 22, "#8A6A48"); for (var x = 86; x < 110; x += 2) Q.r(x, 12, 1, 22, "#C9A46A"); Q.r(84, 10, 28, 3, "#9C6542"); Q.r(88, 34, 1, 8, "#5A3A28"); Q.r(106, 34, 1, 8, "#5A3A28");
      }), 0, 0);
      for (var i = 0; i < 7; i++) { var a = T * 1.6 + i * 0.9, x = 64 + Math.cos(a) * (34 + i % 3 * 6), y = 12 + Math.sin(a) * 6 - i % 2 * 3, up = Math.sin(T * 12 + i) > 0; P.r(x, y, 2, 1, "#F4F0E8"); P.p(x - 1, y + (up ? -1 : 1), "#F4F0E8"); P.p(x + 2, y + (up ? -1 : 1), "#F4F0E8"); }
      who(P, "yNemat", 40, 54, 0, 0);
      who(P, "abdo", 60, 54, 2, 0); var w = Math.sin(T * 5) * 4; P.r(51, 20, 1, 14, "#C9A46A"); P.r(46 + w, 16, 6, 4, "#E8503F");
    } },
    { t: 8.5, draw: function (P, k, T) { // the square: the very first mercy table, a mother and her son setting it
      fg.drawImage(bg("square", function (Q, R) {
        Q.r(0, 0, FW, 22, "#D8C8A8"); Q.r(40, 0, 48, 22, "#E8DCC0"); Q.el(54, -8, 20, 16, "#E8DCC0"); Q.r(60, 6, 8, 16, "#5A4A40");
        Q.r(0, 22, FW, 36, "#E4D1AB"); for (var x = 0; x < FW; x += 12) Q.r(x, 22, 1, 36, "#CDB892");
        lanternsAcross(Q, 4, 9);
        Q.r(10, 40, 108, 5, "#F4EFE4"); Q.r(10, 40, 108, 1, "#FFFFFF"); Q.r(14, 45, 2, 6, WOOD[2]); Q.r(112, 45, 2, 6, WOOD[2]); Q.r(62, 45, 2, 6, WOOD[2]);
      }), 0, 0);
      var plates = Math.min(8, Math.floor(k * 12));
      for (var i = 0; i < plates; i++) { P.el(16 + i * 12, 40, 7, 3, "#FFFFFF"); P.p(19 + i * 12, 40, "#C8903A"); }
      var mx = 20 + Math.min(1, k * 1.3) * 80, f = k < 0.77 ? ((T * 6) | 0) % 4 : 0;
      who(P, "nMom", mx, 38, k < 0.77 ? 3 : 0, f);
      who(P, "boyNabil", mx - 12, 41, k < 0.77 ? 3 : 0, f); P.r(mx - 8, 22, 3, 5, "#C8963E");
      if (k > 0.55) { var n = Math.min(4, Math.floor((k - 0.55) * 14)); for (var j = 0; j < n; j++) who(P, ["au1", "au3", "au2", "fk1"][j], 26 + j * 24, 57, 1, 0); }
    } },
    { t: 7, draw: function (P, k, T) { // all of them, under the lanterns, waving at the camera
      fg.drawImage(bg("all", function (Q, R) {
        Q.r(0, 0, FW, FH, "#8A7A68"); Q.r(0, 0, 30, 40, "#A89878"); Q.r(98, 0, 30, 40, "#9A8A70");
        Q.r(0, 40, FW, 18, "#C8B898"); lanternsAcross(Q, 6, 11);
      }), 0, 0);
      ["ySaber", "yNemat", "abdo", "hDad", "yHassan", "nMom", "boyNabil", "fk1", "fk2"].forEach(function (id, i) {
        var x = 10 + i * 13, j = Math.abs(Math.sin(T * 5 + i)) > 0.8 ? 2 : 0;
        who(P, id, x, 56 - j, 0, 0);
        if (Math.sin(T * 4 + i * 1.3) > 0) P.r(x + 5, 30 - j - (WD.CAST[id].kid ? -4 : 0), 1, 4, "#E8C8A0"); // a hand waving
      });
      if (k > 0.7) { fg.globalAlpha = Math.min(1, (k - 0.7) * 4); P.r(0, 0, FW, FH, "#1A1410"); fg.font = "700 10px 'Aref Ruqaa', serif"; fg.textAlign = "center"; fg.fillStyle = "#E8DCC0"; fg.fillText("الحارة… هي الناس", FW / 2, 32); fg.globalAlpha = 1; }
    } }
  ];
  var FILM_LEN = SCENES.reduce(function (s, x) { return s + x.t; }, 0);
  // paint a frame at film time ft, then age it: brown tones, flicker, scratches, dust, a dark edge
  function frameAt(ft, T, speed) {
    var acc = 0, sc = SCENES[SCENES.length - 1], k = 1;
    for (var i = 0; i < SCENES.length; i++) { if (ft < acc + SCENES[i].t) { sc = SCENES[i]; k = (ft - acc) / SCENES[i].t; break; } acc += SCENES[i].t; }
    fg.globalAlpha = 1; fg.setTransform(1, 0, 0, 1, 0, Math.random() < 0.04 ? 1 : 0);
    fg.clearRect(0, 0, FW, FH);
    sc.draw(FP, Math.max(0, Math.min(1, k)), T);
    fg.setTransform(1, 0, 0, 1, 0, 0);
    var im = fg.getImageData(0, 0, FW, FH), d = im.data, flick = 0.86 + Math.random() * 0.14 - (speed < 0.55 ? 0.25 : 0);
    for (var p = 0; p < d.length; p += 4) {
      var x = (p >> 2) % FW, y = ((p >> 2) / FW) | 0, ex = Math.min(x, FW - 1 - x), ey = Math.min(y, FH - 1 - y), vig = Math.min(1, Math.min(ex, ey * 2) / 14) * 0.35 + 0.65;
      var l = (d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11) * flick * vig + (Math.random() - 0.5) * 14;
      d[p] = Math.min(255, l * 1.08 + 18); d[p + 1] = Math.min(255, l * 0.9 + 8); d[p + 2] = Math.min(255, l * 0.66); d[p + 3] = 255;
    }
    fg.putImageData(im, 0, 0);
    fg.fillStyle = "rgba(40,24,12,0.55)";
    if (Math.random() < 0.6) fg.fillRect((Math.random() * FW) | 0, 0, 1, FH);
    for (var s = 0; s < 3; s++) if (Math.random() < 0.5) fg.fillRect((Math.random() * FW) | 0, (Math.random() * FH) | 0, 1 + (Math.random() * 2 | 0), 1);
    if (Math.random() < 0.15) { fg.fillStyle = "rgba(255,248,230,0.6)"; fg.fillRect((Math.random() * FW) | 0, (Math.random() * FH) | 0, 2, 1); }
  }

  /* ================= the show: the film, the crank, the crowd ================= */
  var SH = { on: false, ft: 0, speed: 1, manual: false, green: 0, total: 0, cued: {}, res: null, ended: false };
  var crankEl = null, gaugeEl = null, tipEl = null;
  function crankUI(show) {
    if (!crankEl) {
      crankEl = document.createElement("div"); crankEl.className = "cin-crank";
      var g = document.createElement("div"); g.className = "cin-gauge"; gaugeEl = document.createElement("i"); g.appendChild(gaugeEl);
      var b = document.createElement("button"); b.type = "button"; b.className = "cin-btn"; b.textContent = "لُف البكرة";
      tipEl = document.createElement("p"); tipEl.className = "cin-tip";
      crankEl.appendChild(tipEl); crankEl.appendChild(g); crankEl.appendChild(b);
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); SH.speed = Math.min(1.9, SH.speed + 0.2); sfx("crank", 0.9); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit"); });
    }
    if (show) { (document.getElementById("app") || document.body).appendChild(crankEl); crankEl.classList.add("on"); }
    else if (crankEl.parentNode) crankEl.parentNode.removeChild(crankEl);
  }
  function startShow(manual) {
    SH.on = true; SH.ft = 0; SH.speed = 1; SH.manual = !!manual; SH.green = 0; SH.total = 0; SH.cued = {}; SH.ended = false;
    if (manual) crankUI(true);
    return new Promise(function (res) { SH.res = res; });
  }
  function endShow() {
    SH.on = false; crankUI(false);
    var r = SH.res; SH.res = null; if (r) r(SH.total ? SH.green / SH.total : 1);
  }
  // what the seats say, and when (film seconds)
  var CUES = [
    [6.2, function (api) { var a = api.by("saber"); api.say(a, "«ده أنا! بص كان عندي شعر إزاي!»", 2.8); api.jump(a); laugh(api); }],
    [9.5, function (api) { api.say(api.by("nemat"), "«وكنت بتعمل الفانوس في يوم… دلوقتي في ساعة.»", 2.6); }],
    [13.5, function (api) { var a = api.by("hassan"); api.say(a, "«أنا كنت رفيع كده؟!»", 2.6); api.jump(a); laugh(api); }],
    [16.2, function (api) { api.say(api.by("nemat"), "«كنت بتجري زي العصفور يا حسن.»", 2.6); }],
    [21, function (api) { var a = api.by("nemat"); api.say(a, "«عبده…»", 2.8); api.emote(a, "♥"); if (H.map.hasBuddy()) api.sfx("coo", 0.8); }],
    [23.5, function (api) { api.say(api.by("saber"), "«الله يرحمه… كان بيصفّر والحمام يرجعله من آخر الدنيا.»", 3); }],
    [28.5, function (api) { api.say(api.by("au3"), "«مين الست دي اللي بتفرش الترابيزة؟»", 2.6); }],
    [31, function (api) { api.say(api.by("nemat"), "«دي أم نبيل الله يرحمها… هي اللي بدأت المائدة. وده نبيل الصغير شايل القلة.»", 3.4); if (S.q.villa === "secret") { var me = api.me(); api.emote(me, "!"); } }],
    [35.5, function (api) { api.actors().forEach(function (a) { if (a.react && Math.random() < 0.6) { api.jump(a); api.emote(a, "♪"); } }); api.say(api.by("au5"), "«وحوي يا وحوي!»", 2.4); }],
    [40, function (api) { api.sfx("cheer", 1); api.actors().forEach(function (a) { if (a.react) api.emote(a, "♥"); }); }]
  ];
  function laugh(api) { api.actors().forEach(function (a) { if (a.react && Math.random() < 0.5) api.emote(a, "♪"); }); }
  function tickShow(R, dt, api) {
    if (!SH.on) return;
    if (SH.manual) {
      SH.speed = Math.max(0, SH.speed - dt * 0.42);
      var ok = SH.speed > 0.7 && SH.speed < 1.3;
      SH.total += dt; if (ok) SH.green += dt;
      if (gaugeEl) { gaugeEl.style.width = Math.round(Math.min(1, SH.speed / 1.9) * 100) + "%"; gaugeEl.className = ok ? "ok" : SH.speed < 0.7 ? "slow" : "fast"; }
      if (tipEl) tipEl.textContent = SH.speed < 0.45 ? "الفيلم بيقف! {لف|لفي} أسرع!" : SH.speed < 0.7 ? "أسرع شوية…" : SH.speed > 1.45 ? "بالراحة! الناس بقت بتجري!" : SH.speed > 1.3 ? "شوية بالراحة" : "كده تمام";
      if (tipEl) tipEl.textContent = H.map.fmt(tipEl.textContent);
      if (SH.speed < 0.4 && Math.random() < dt * 0.8) { var a = api.actors().filter(function (x) { return x.react; })[(Math.random() * 6) | 0]; if (a) api.emote(a, "…"); }
      if (SH.speed > 1.45 && Math.random() < dt * 0.8) { var b = api.actors().filter(function (x) { return x.react; })[(Math.random() * 6) | 0]; if (b) api.say(b, "«ههههه!»", 1.2); }
    }
    var rate = SH.manual ? Math.max(0.15, Math.min(1.9, SH.speed)) : 1;
    SH.ft += dt * rate;
    CUES.forEach(function (c, i) { if (!SH.cued[i] && SH.ft >= c[0]) { SH.cued[i] = 1; c[1](api); } });
    if (SH.ft >= FILM_LEN && !SH.ended) { SH.ended = true; endShow(); }
  }

  /* ================= the cinema itself ================= */
  PROPS.seatRow = function (o) {
    var n = o.n || 8;
    return sprite(n * 12 + 2, 16, function (P) {
      for (var i = 0; i < n; i++) { var x = 1 + i * 12; P.r(x, 2, 11, 10, "#8A1E2C"); P.r(x, 2, 11, 2, "#B8343A"); P.r(x + 1, 4, 9, 7, "#A8283A"); P.r(x, 12, 11, 2, "#5A1A20"); P.r(x + 10, 2, 1, 12, "#3A1018"); }
      P.r(0, 13, n * 12 + 2, 2, WOOD[3]);
    }, null);
  };
  PROPS.projector = function () {
    return sprite(30, 34, function (P) {
      P.r(6, 26, 18, 6, WOOD[3]); P.r(9, 18, 2, 9, "#3A3440"); P.r(19, 18, 2, 9, "#3A3440");
      P.r(4, 10, 22, 10, "#3A3440"); P.r(4, 10, 22, 1, "#6A6E74"); P.r(12, 4, 6, 6, "#2A2830"); P.el(12, 2, 6, 4, "#5A5E66"); // the lens, pointing at the screen
      P.el(0, 0, 12, 12, "#2A2830"); P.el(2, 2, 8, 8, "#4A4E56"); P.p(5, 5, "#8A8E94");
      P.el(18, 0, 12, 12, "#2A2830"); P.el(20, 2, 8, 8, "#4A4E56"); P.p(23, 5, "#8A8E94");
      P.r(24, 14, 5, 2, "#8A8E94"); P.r(28, 14, 1, 6, "#8A8E94"); // the crank
    }, [2, 30, 26, 4, 0.25]);
  };
  WD.LOOK.cin_screen = [{ t: "الشاشة القماش اللي اتخيطت من جديد. الضو بيترعش عليها زي زمان." }];
  WD.LOOK.cin_tins = [{ t: "علب فيلم صفيح قديمة، عليها ورق بخط عم مرسي: «رمضان ٩٩ · الحارة · بكرة ١، ٢، ٣». العلب كانت تحت سريره ٢٥ سنة." }];

  function seatsPeople() {
    // the rows from the front: who sits where, all seen from behind, faces to the screen
    // seats 0-6 are left of the aisle, 7-13 right of it; rows at y 108, 130, 152
    var seat = function (row, i) { var y = 108 + row * 22; return i < 7 ? [(row === 1 ? 34 : 30) + 6 + i * 12, y] : [136 + (i - 7) * 12, y]; };
    var list = [
      ["saber", 0, 3, { id: "saber", name: "عم صابر", face: "saber_smile", say: [{ t: "«ده أنا يا {ابني|بنتي}! والفانوس اللي في إيدي… لسه عندي لحد النهارده.»" }] }],
      ["hassan", 0, 5, { id: "hassan", name: "عم حسن", face: "hassan", say: [{ t: "«أبويا الله يرحمه… كان بيقولي: العيش لازم يوصل سخن. وأنا لسه بجري بيه.»" }] }],
      ["nemat", 1, 4, { id: "nemat", name: "الحاجة نعمات", face: "nemat", say: [{ t: "«ما كنتش أعرف إن مرسي صوّرنا. أنا شفت عبده تاني… الله يخليك يا مرسي.»" }] }],
      ["au1", 1, 1, { name: "الأستاذ فكري", say: ["«السينما دي اتقفلت وأنا في تانية إعدادي. أول فيلم أشوفه فيها من ٢٥ سنة… طلع عننا!»"] }],
      ["au2", 1, 9, { name: "أم عادل", say: ["«ده بيت أمي اللي ورا الست دي! لسه بالبلكونة الخشب!»"] }],
      ["au3", 2, 2, { name: "الحاج منصور", say: ["«مرسي ده كان شايل الكاميرا في كل حتة، وكنا بنضحك عليه. أهو ضحك هو في الآخر.»"] }],
      ["au4", 2, 10, { name: "أم سيف", say: ["«العيال دول بيضحكوا على الهدوم… كانت أحلى من بتاعتكم.»"] }],
      ["au5", 0, 8, { name: "سيف", kid: 1, say: ["«الفيلم ده من غير ألوان ليه؟ هو التلفزيون كان كده؟»"] }],
      ["au6", 0, 11, { name: "ملك الصغيرة", kid: 1, say: ["«أنا شايفة عم صابر! بس ليه شعره إسود؟»"] }]
    ];
    return list.map(function (e) {
      var p = seat(e[1], e[2]), o = Object.assign({ cast: e[0], at: [p[0], p[1] - 4, 1, "sit"], react: 1, sortY: p[1] - 3, talk: [p[0], p[1] + 8] }, e[3]);
      if (!o.id) { o.id = e[0]; o.say = o.say.map(function (t) { return { t: t }; }); }
      return o;
    });
  }
  function makeCinema() {
    var s = K.shell(CW, CH, WALL, {
      cap: "#2A1018", seed: 22,
      floor: function (P, R) {
        P.r(0, WALL, CW, CH - WALL, "#3A2A30"); P.dots(0, WALL, CW, CH - WALL, ["#4A3038", "#2E2026"], 600, R);
        P.r(0, WALL, CW, 14, "#4A2A30"); // in front of the screen
        P.r(112, WALL + 14, 16, CH - WALL - 14, "#6A1E2A"); for (var y = WALL + 14; y < CH; y += 6) P.r(112, y, 16, 1, "#5A1824"); // the aisle carpet
      },
      wall: function (P, R) {
        P.r(0, 0, CW, WALL, "#3A1A22");
        // velvet curtains either side of the screen, pulled back with gold rope, and a pelmet
        for (var x = 0; x < 52; x++) P.r(x, 4, 1, WALL - 4, ((x / 3) | 0) % 2 ? "#8A1E2C" : "#A8283A");
        for (var x2 = CW - 52; x2 < CW; x2++) P.r(x2, 4, 1, WALL - 4, ((x2 / 3) | 0) % 2 ? "#8A1E2C" : "#A8283A");
        P.r(0, 0, CW, 6, "#6A1420"); for (var t = 2; t < CW; t += 6) P.el(t, 4, 6, 5, "#C8963E");
        P.r(44, 40, 10, 2, "#F2C14A"); P.r(CW - 54, 40, 10, 2, "#F2C14A");
        P.r(SX - 3, SY - 2, FW + 6, FH + 4, "#1A1014"); P.r(SX - 1, SY - 1, FW + 2, FH + 2, "#E8E0D0");
        P.r(SX, SY + FH + 4, FW, 8, "#2A1418"); // the stage lip under it
        // the old exit lights
        P.r(6, 54, 16, 6, "#2A1A1A"); P.r(CW - 22, 54, 16, 6, "#2A1A1A");
      }
    });
    return {
      id: "cinema", name: "سينما النصر", sub: "الحارة زمان · عرض خاص", W: CW, HGT: CH, ground: s.c, bed: "cinemaIn", wall: WALL,
      amb: { night: [150, 120, 130], suhoor: [150, 120, 130] },
      showDim: function () { return SH.on ? 0.62 : 0; },
      props: [
        { k: "seatRow", o: { n: 7 }, x: 30, y: 108, block: [86, 6] }, { k: "seatRow", o: { n: 7 }, x: 130, y: 108, block: [86, 6] },
        { k: "seatRow", o: { n: 7 }, x: 34, y: 130, block: [86, 6] }, { k: "seatRow", o: { n: 7 }, x: 130, y: 130, block: [86, 6] },
        { k: "seatRow", o: { n: 7 }, x: 30, y: 152, block: [86, 6] }, { k: "seatRow", o: { n: 7 }, x: 130, y: 152, block: [86, 6] },
        { k: "projector", x: 106, y: 196, block: [26, 5], look: "cin_tins" },
        { k: "blank", o: { w: FW, h: FH }, x: SX, y: SY + FH, noblock: true, look: "cin_screen" }
      ],
      fixtures: [
        { layer: "wall", draw: function (R) {
          if (SH.on) { frameAt(SH.ft, R.T, SH.manual ? SH.speed : 1); R.img(film, SX, SY); }
          else { R.rect(SX, SY, FW, FH, "#D8D0C0"); R.alpha(0.3 + 0.1 * Math.sin(R.T * 9)); R.rect(SX, SY, FW, FH, "#FFF8E8"); R.alpha(1); R.text("سينما النصر", SX + FW / 2, SY + FH / 2, 7, "#8A6A5A"); }
          var on = Math.sin(R.T * 2) > -0.6; R.text("خروج", 14, 57.5, 3.6, on ? "#7CFF9A" : "#3A6A4A", "sans"); R.text("خروج", CW - 14, 57.5, 3.6, on ? "#7CFF9A" : "#3A6A4A", "sans");
        } }
      ],
      over: function (R) { // the beam from the projector to the screen, dust turning in it
        if (!SH.on) return;
        var px = 116, py = 172;
        R.alpha(0.11 + 0.03 * Math.sin(R.T * 30));
        for (var k = 0; k < 30; k++) { var t = k / 30, y = py + (SY + FH / 2 - py) * t, hw = 2 + t * (FW / 2 - 2); R.rect(Math.round(px - hw), Math.round(y), Math.round(hw * 2), 3, "#FFF4D8"); }
        R.alpha(0.6);
        for (var d = 0; d < 10; d++) { var u = ((R.T * 0.05 + d * 0.1) % 1), dy = py + (SY + FH / 2 - py) * u, dx = px + Math.sin(R.T + d * 2) * (2 + u * 40); R.rect(Math.round(dx), Math.round(dy), 1, 1, "#FFFFFF"); }
        R.alpha(1);
      },
      strings: [],
      walk: [[8, WALL + 4, CW - 16, CH - WALL - 12], [108, CH - 12, 24, 6]],
      lights: [
        { x: SX + FW / 2, y: SY + FH / 2, r: 110, c: [255, 236, 200], when: "always", g: 0.35, dyn: function (T) { return SH.on ? [0.75 + Math.random() * 0.25, null] : [0.25, null]; } },
        { x: 14, y: 57, r: 16, c: [120, 255, 160], when: "always", g: 0.8 }, { x: CW - 14, y: 57, r: 16, c: [120, 255, 160], when: "always", g: 0.8 },
        { x: 120, y: 186, r: 30, c: [255, 220, 160], when: "always", g: 0.6 },
        { x: 48, y: 40, r: 30, c: [255, 120, 120], when: "always", g: 0.3, dyn: function () { return [SH.on ? 0.3 : 1, null]; } },
        { x: CW - 48, y: 40, r: 30, c: [255, 120, 120], when: "always", g: 0.3, dyn: function () { return [SH.on ? 0.3 : 1, null]; } }
      ],
      wins: [],
      exits: [{ r: [108, CH - 16, 24, 14], to: "hara", spot: "cinema" }],
      spawn: { hara: [120, 204, 1] },
      tick: function (R, dt, api) { api.me = function () { return H.map.me(); }; tickShow(R, dt, api); },
      people: function () {
        if (SH.on) { SH.on = false; crankUI(false); }
        return seatsPeople().concat([{ id: "morsy", cast: "morsy", name: "عم مرسي", at: [138, 194, 2], talkFn: replay }]);
      }
    };
  }
  H.rooms.add("cinema", makeCinema, null);

  /* ================= the first night, and the nights after ================= */
  function theShow(manual) {
    var C = H.map.cut;
    return Promise.resolve()
      .then(function () { C.cam({ on: [120, 70], zoom: 1.15, ms: 1400 }); return C.wait(900); })
      .then(function () { sfx("crank", 1); return startShow(manual); })
      .then(function (q) { return C.wait(600).then(function () { return q; }); });
  }
  function firstNight() {
    var C = H.map.cut;
    S.q.cinema = "in"; PL.save();
    return PL.scene([
      function () { return C.fade(1, 500); },
      function () { return C.go("cinema", [120, 204, 1], { keepDark: true }); },
      function () { C.cam({ on: [120, 150], zoom: 1.5, ms: 0 }); return C.fade(0, 800); },
      function () { return C.walk("morsy", 130, 200, { face: 2 }); },
      { who: "morsy", name: "عم مرسي", t: "{تعالى|تعالي} {تعالى|تعالي}! الحارة كلها جوّه… فاضل حاجة واحدة." },
      { who: "morsy", name: "عم مرسي", t: "٢٥ سنة وأنا شايل العلب دي تحت سريري. صوّرت الحارة في رمضان ٩٩ بالكاميرا بتاعة السينما… ومحدش شاف الفيلم لحد النهارده." },
      { who: "morsy", name: "عم مرسي", t: "بس إيدي بقت ترتعش على المانيفلا. {لف|لفي} البكرة {إنت|إنتي}: لا بسرعة ولا ببطء. زي القلب." },
      function () { C.walk("morsy", 138, 194, { face: 2 }); return C.walk("me", 100, 196, { face: 3 }); },
      function () { PL.banner("لُف البكرة", "{اضغط|اضغطي} على «لُف البكرة» عشان الفيلم يمشي. خلّي العداد في الأخضر", "deed"); return C.wait(800); },
      function () { return theShow(true); },
      function (C2) { return after(SH.total ? SH.green / SH.total : 1); }
    ]);
  }
  function after(q) {
    var C = H.map.cut;
    S.q.cinema = "seen"; PL.save();
    return PL.play([
      function () { sfx("cheer", 1); C.cam({ on: [120, 140], zoom: 1.2, ms: 1400 }); return C.wait(1400); },
      function () { var s = C.actor("saber"); if (s) { C.emote("saber", "♥"); } return C.cam({ on: "morsy", zoom: 1.7, ms: 800 }); },
      { who: "morsy", name: "عم مرسي", t: q > 0.7 ? "إيدك تتلف في حرير! الفيلم مشي ولا كإنه اتصوّر امبارح." : q > 0.4 ? "حلو! وقف مرتين… بس الأفلام القديمة كانت بتقف برضه." : "الفيلم وقف وجري… بس محدش زعل. الناس كانت بتضحك وبتعيط في نفس الوقت." },
      { who: "morsy", name: "عم مرسي", t: "السينما مش شاشة وكراسي. السينما إن الناس تقعد جنب بعض في الضلمة… ويشوفوا نفسهم." },
      function () { PL.banner("✦ سينما النصر", "بتعرض «الحارة زمان» كل ليلة بعد التراويح لحد العيد", "deed"); if (H.audio) H.audio.chime(); }
    ]);
  }
  function replay() {
    PL.scene([
      { who: "morsy", name: "عم مرسي", t: "{عايز|عايزة} {تشوف|تشوفي} الفيلم تاني؟ أنا مش بزهق منه.", opts: ["شغّله يا عم مرسي، وأنا ألف", "شغّله {إنت|إنتي}", "بعدين"], pick: function (i) { SH.choice = i; } },
      function () { if (SH.choice === 2) return null; return theShow(SH.choice === 0).then(function (q) { if (SH.choice === 0) return H.map.cut.say({ who: "morsy", name: "عم مرسي", t: q > 0.7 ? "تمام التمام!" : "مش بطال… الفيلم عاش." }); }); }
    ]);
  }
  H.rooms.DOORS.cinema.onTry = function (d, t) { if (!S.q.cinema || S.q.cinema === "in") { firstNight(); return true; } return false; };

  // the days before: Morsy outside scrubbing the posters and fixing the bulbs
  WD.EXTRAS.push({ id: "morsyOut", cast: "morsy", name: "عم مرسي", at: [486, 252, 1], times: ["asr", "pre"], days: { from: 17, to: OPENS - 1 },
    say: ["«بنضّف السينما للافتتاح! ليلة ٢٢… {تعالى|تعالي} بدري، الكراسي محدودة.»", "«٢٥ سنة مقفولة. والعلب اللي تحت سريري لسه فيها الحارة زي ما كانت.»", "«{شايف|شايفة} اللمبات دي؟ كل واحدة فيهم هنوّرها بإيدي.»"] });
  WD.EXTRAS.push({ id: "morsyNight", cast: "morsy", name: "عم مرسي", at: [534, 252, 2], times: ["maghrib"], days: { from: OPENS },
    say: ["«العرض بعد التراويح! الحارة كلها هتبقى جوّه.»"] });
  PL.quests.push(function (d, t) {
    if (d < OPENS) return d >= 17 ? { icon: "🎞️", t: "سينما النصر بتفتح ليلة ٢٢. عم مرسي قدامها بينضّفها", go: "cinema" } : null;
    if (S.q.cinema === "seen") return { icon: "🎞️", t: "{شفت|شفتي} «الحارة زمان» في سينما النصر", done: true };
    return { icon: "🎞️", t: "سينما النصر فاتحة الليلة بعد التراويح: «الحارة زمان»", go: "cinema" };
  });
})();
