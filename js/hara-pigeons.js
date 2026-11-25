/* فوانيس الحارة · برج الحمام: Hagg Abdo's pigeon tower (walk.html).
   On the roof of the old family house next to the mosque stands the tower (غية) Hagga Nemat's husband kept. Since
   he died the key has been lost, and Nemat feeds the birds from her window. Find the key (day 4, or day 9), take it
   to Nemat, and she climbs up with you for the first time in years: she opens the cage, the flock wheels round the
   minaret and comes home, and she gives you a pigeon of your own. You let it go; it comes back to your shoulder.
   From then on it follows you round the hara: it flies after you, lands by your feet, rides on your shoulder at
   night (js/map.js draws it). Up here you can scatter grain and wave Abdo's flag to send the flock up. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world, PL = H.places;
  if (!A || !WD || !H.rooms || !PL) return;
  var S = PL.S, sprite = A.sprite, PROPS = A.PROPS, dk = A.dk, lt = A.lt, rng = A.rng, WOOD = A.WOOD, BRASS = A.BRASS;
  var K = H.rooms.kit;
  var W = 216, HG = 192, TOP = 90;
  var TINTS = { white: "#F4F0E8", grey: "#9C98A6", brown: "#B07A50" };
  var FLOCK_T = ["#C9C2B8", "#9C98A6", "#F4F0E8", "#8A8494", "#B4B0BC", "#C9C2B8", "#A8744E", "#9C98A6", "#F4F0E8", "#8A8494"];
  var SPR = {};
  function birds(tint) { return SPR[tint] || (SPR[tint] = A.pigeon(tint)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function dark(t) { return t === "night" || t === "suhoor"; }

  /* ---------------- the room's things ---------------- */
  PROPS.grainSack = function () {
    return sprite(16, 16, function (P) {
      P.el(1, 3, 14, 12, "#C8B07A"); P.el(2, 4, 10, 9, "#DCC490"); P.r(4, 1, 8, 4, "#B89A60"); P.r(5, 0, 6, 2, "#C8B07A");
      P.r(3, 8, 10, 1, "#A88A50"); P.p(6, 2, "#F2D890"); P.p(8, 1, "#E8C878"); P.p(9, 3, "#F2D890");
    }, [0, 12, 16, 4, 0.25]);
  };
  PROPS.rayaPole = function () { // Abdo's flag: a long reed with a rag tied on, leaning on the parapet
    return sprite(16, 52, function (P) {
      P.line(3, 50, 12, 2, "#C9A46A"); P.line(4, 50, 13, 2, "#9C7A48");
      P.r(10, 2, 6, 5, "#E8503F"); P.r(11, 7, 4, 2, "#C8443A"); P.p(15, 3, "#F2C14A");
    }, null);
  };
  PROPS.waterDish = function () {
    return sprite(14, 6, function (P) { P.el(0, 0, 14, 6, "#8A8E94"); P.el(1, 1, 12, 4, "#5FB0C8"); P.p(4, 2, "#BFEAF4"); }, null);
  };
  PROPS.stool = function () {
    return sprite(10, 9, function (P) { P.r(0, 0, 10, 3, WOOD[1]); P.r(0, 0, 10, 1, WOOD[0]); P.r(1, 3, 1, 6, WOOD[3]); P.r(8, 3, 1, 6, WOOD[3]); P.r(4, 3, 1, 5, WOOD[2]); }, [0, 7, 10, 2, 0.2]);
  };

  /* ---------------- the flock: perched on the tower, pecking grain, or wheeling over the roofs ---------------- */
  var TX = 122, TB = 150; // the tower's left edge and its feet
  var F = { birds: [], mode: "perch", t: 0, grain: [], rel: null };
  function perchAt(i) { // on the tower's roof, or along its landing board
    if (i < 4) return [TX + 6 + i * 7, TB - 58];
    return [TX + 2 + (i - 4) * 6, TB - 21];
  }
  function resetFlock() {
    F.birds = FLOCK_T.map(function (c, i) { var p = perchAt(i); return { i: i, tint: c, x: p[0], y: p[1], z: 0, st: "perch", f: 0, dir: i % 2, a: rnd(0, 6.3), r: rnd(44, 70), s: rnd(0.9, 1.3), t: rnd(0, 2) }; });
    F.mode = "perch"; F.grain = []; F.rel = null;
  }
  function flyUp() { F.mode = "fly"; F.t = 0; F.birds.forEach(function (b) { b.st = "fly"; b.t = rnd(0, 0.6); }); var a = H.audio; if (a && a.fxv) a.fxv("flutter", 1.2); }
  function comeHome() { F.mode = "home"; F.birds.forEach(function (b) { b.st = "home"; }); }
  function scatter(x, y) {
    F.grain = []; for (var g = 0; g < 26; g++) F.grain.push([x + rnd(-14, 14), y + rnd(-5, 6)]);
    F.mode = "feed"; F.t = 0;
    F.birds.forEach(function (b, i) { b.st = "down"; b.gx = x + rnd(-14, 14); b.gy = y + rnd(-4, 6); b.t = i * 0.12; });
    var a = H.audio; if (a && a.fxv) { a.fxv("rustle", 1.4); setTimeout(function () { a.fxv("flutter", 1); }, 300); }
  }
  function tickFlock(R, dt) {
    F.t += dt;
    if (dark(R.time) && F.mode === "perch") return;
    F.birds.forEach(function (b) {
      b.t -= dt;
      var home = perchAt(b.i);
      if (b.st === "perch") { if (b.t < 0) { b.t = rnd(0.5, 2.5); b.f = b.f ? 0 : 1; if (Math.random() < 0.3) b.dir = 1 - b.dir; } return; }
      if (b.st === "fly") { // round and round over the roofs, wide circles
        if (b.t > 0) return;
        b.a += dt * b.s * 1.2;
        var cx = 118, cy = 44, tx = cx + Math.cos(b.a) * b.r, ty = cy + Math.sin(b.a) * b.r * 0.32;
        b.x += (tx - b.x) * Math.min(1, dt * 3); b.y += (ty - b.y) * Math.min(1, dt * 3);
        b.dir = -Math.sin(b.a) > 0 ? 1 : 0; b.f = ((R.T * 10 + b.i) | 0) % 2 ? 2 : 3;
        return;
      }
      if (b.st === "home" || b.st === "up") {
        var dx = home[0] - b.x, dy = home[1] - b.y, d = Math.hypot(dx, dy);
        if (d < 1.5) { b.x = home[0]; b.y = home[1]; b.st = "perch"; b.f = 0; b.t = rnd(0.5, 2); return; }
        var k = Math.min(1, 70 * dt / d); b.x += dx * k; b.y += dy * k; b.dir = dx < 0 ? 0 : 1; b.f = ((R.T * 10 + b.i) | 0) % 2 ? 2 : 3;
        return;
      }
      if (b.st === "down") {
        if (b.t > 0) return;
        var ex = b.gx - b.x, ey = b.gy - b.y, e = Math.hypot(ex, ey);
        if (e < 1.5) { b.st = "peck"; b.t = rnd(6, 11); b.f = 0; return; }
        var k2 = Math.min(1, 80 * dt / e); b.x += ex * k2; b.y += ey * k2; b.dir = ex < 0 ? 0 : 1; b.f = ((R.T * 10 + b.i) | 0) % 2 ? 2 : 3;
        return;
      }
      if (b.st === "peck") {
        if (Math.random() < dt * 2) { b.f = b.f ? 0 : 1; if (Math.random() < 0.4) { b.x += rnd(-2, 2); b.dir = Math.random() < 0.5 ? 0 : 1; } }
        if (b.t < 0) { b.st = "up"; if (Math.random() < 0.5) F.grain.shift(); }
      }
    });
    if (F.mode === "feed" && F.birds.every(function (b) { return b.st === "perch"; })) F.mode = "perch";
  }
  function drawBird(R, b) {
    var set = birds(b.tint), im = (b.dir ? set.R : set.L)[b.f || 0];
    if (b.st === "peck" || b.st === "down") { R.alpha(0.4); R.rect(Math.round(b.x) - 2, Math.round(b.y), 5, 1, "#3A2A30"); R.alpha(1); }
    R.img(im, Math.round(b.x - im.width / 2), Math.round(b.y - im.height + 1));
  }

  /* ---------------- the first time up: Nemat, the flock, a pigeon of your own ---------------- */
  // the one you let go: up past the minaret, round, and back down to your shoulder
  function drawRelease(R) {
    var r = F.rel;
    if (!r) return;
    var me = R.me, k = Math.min(1, (R.T - r.t0) / 7), x, y, set = birds(r.tint);
    if (r.t0 == null) { r.t0 = R.T; k = 0; }
    var sx = me.x + 5, sy = me.y - 26;
    if (k < 0.15) { var q = k / 0.15; x = sx + q * 20; y = sy - q * 50; }
    else if (k < 0.82) { var a = (k - 0.15) / 0.67 * Math.PI * 2.6 - Math.PI / 2; x = 120 + Math.cos(a) * 60; y = 34 + Math.sin(a) * 20; }
    else { var q2 = (k - 0.82) / 0.18, ax = 120 + Math.cos(Math.PI * 2.6 * 1 - Math.PI / 2) * 60, ay = 34 + Math.sin(Math.PI * 2.1) * 20; x = ax + (me.x + 4 - ax) * q2; y = ay + (me.y - 22 - ay) * q2; }
    var im = (Math.cos(R.T) > 0 ? set.R : set.L)[((R.T * 10) | 0) % 2 ? 2 : 3];
    R.img(im, Math.round(x - im.width / 2), Math.round(y - im.height + 1));
    if (k >= 1 && !r.done) { r.done = true; r.res(); }
  }
  function releaseFlight(tint) { return new Promise(function (res) { F.rel = { tint: tint, t0: null, res: res }; }); }

  function firstClimb() {
    var C = H.map.cut, ch = null;
    S.q.pigeons = "up"; PL.save();
    return PL.scene([
      function () { return C.cam({ on: "nemat", zoom: 1.7, ms: 700 }); },
      { who: "me", t: "يا حاجة نعمات… {لقيت|لقيت} المفتاح ده مستخبي جنب المية. مكتوب على الشريط: «البرج»." },
      function () { C.emote("nemat", "!"); return C.wait(700); },
      { who: "nemat", t: "{وريني|وريني}…" },
      { who: "nemat", t: "يا الله… ده مفتاح برج عبده. أنا اللي رابطة الشريط ده بإيدي من أربعين سنة." },
      { who: "nemat", t: "كان بيطلع كل يوم العصر. يصفّر، والحمام يلف الحارة كلها ويرجعله. من يوم ما مات والمفتاح ضاع، وأنا بأكّل الحمام من الشباك وبس." },
      { who: "nemat", t: "{تطلع|تطلعي} معايا؟ رجلي تقيلة على السلم… بس النهارده هطلع." },
      function () { return C.fade(1, 700); },
      function () { return C.go("pigeons", [70, 170, 1], { keepDark: true }); },
      function () { C.spawn("nemat", "nemat", 92, 166, 1); resetFlock(); C.cam({ on: [112, 110], zoom: 1.25, ms: 0 }); return C.fade(0, 900); },
      function () { return C.wait(400); },
      { who: "nemat", t: "ياااه… السطح زي ما هو. والبرج زي ما هو. بس التراب علاه." },
      function () { return C.walk("nemat", 116, 160, { face: 1 }); },
      { who: "nemat", t: "{افتح|افتحي} البوابة الصغيرة دي… و{ابعد|ابعدي} شوية." },
      function () { C.sfx("creak"); return C.wait(500); },
      function () { flyUp(); C.cam({ on: [118, 70], zoom: 1.1, ms: 1600 }); C.emote("me", "!"); return C.wait(2600); },
      { who: "nemat", t: "شوف! شوف ازاي بيلفّوا حوالين المادنة!" },
      { who: "nemat", t: "عبده كان بيقول: الحمام مش بيرجع للبرج… الحمام بيرجع للي بيحبه." },
      function () { return C.wait(1200); },
      function () { C.sfx("chime"); comeHome(); C.cam({ on: [130, 120], zoom: 1.4, ms: 1400 }); return C.wait(2600); },
      { who: "nemat", t: "رجعوا. كلهم. كأنهم كانوا مستنيين حد يفتح لهم." },
      function () { return C.walk("nemat", 104, 162, { face: 2 }); },
      function () { C.face("me", 3); return C.cam({ on: [96, 140], zoom: 1.7, ms: 700 }); },
      { who: "nemat", t: "{اختار|اختاري} واحدة. تبقى بتاعتك {إنت|إنتي}." },
      { who: "nemat", t: "أي واحدة؟", opts: ["البيضا… هسميها «قطنة»", "الرمادي… هسميه «رصاص»", "البني المنقّط… هسميه «بندق»"], pick: function (i) { ch = ["white", "grey", "brown"][i]; S.petName = ["قطنة", "رصاص", "بندق"][i]; } },
      function () { C.item("me", null); C.emote("me", "♥"); return C.wait(700); },
      { who: "nemat", t: "{امسكها|امسكيها} كده… بالراحة. دلوقتي {سيبها|سيبيها} تطير." },
      { who: "nemat", t: "لو رجعتلك، يبقى بقت بتاعتك بجد." },
      function () { C.cam({ on: [118, 70], zoom: 1.05, ms: 1200 }); C.jump("me"); var a = H.audio; if (a && a.fxv) a.fxv("flutter", 1); return releaseFlight(TINTS[ch]); },
      function () {
        F.rel = null; S.pet = TINTS[ch]; S.open.pigeons = true; S.q.pigeons = "done"; PL.save();
        H.map.resetBuddy(); C.burst("heart", "me", 6); var a = H.audio; if (a && a.fxv) a.fxv("coo", 1.2);
        return C.cam({ on: "me", zoom: 1.8, ms: 900 });
      },
      function () { C.emote("nemat", "♥"); return C.wait(600); },
      { who: "nemat", t: "شفت؟ رجعتلك على كتفك. الحمام بيعرف صاحبه من أول مرة." },
      { who: "nemat", t: "خلي بالك منها. هتمشي وراك في كل حتة… وأنا هطلع كل عصر أأكّل الباقيين. البرج رجع يعيش." },
      function () { PL.banner("✦ " + S.petName + " بقت بتاعتك", "حمامة من برج الحاج عبده. هتلاقيها وراك في كل حتة في الحارة", "deed"); if (H.audio) H.audio.chime(); }
    ]);
  }
  PL.talk.push(function (a) {
    if (a.cast !== "nemat" || !S.keys.pigeons || S.open.pigeons) return false;
    firstClimb();
    return true;
  });
  PL.quests.push(function () {
    if (S.keys.pigeons && !S.open.pigeons) return { icon: "🔑", t: "{ودّي|ودّي} مفتاح البرج للحاجة نعمات", go: "home" };
    return null;
  });

  /* ---------------- up here, any time after: grain, the flag, Nemat in the afternoon ---------------- */
  WD.LOOK.grain = [{ t: "شوال حَب. الحمام بيستناه كل عصر." }];
  WD.LOOK.flag = [{ t: "راية الحاج عبده: قصبة طويلة وفي آخرها قماشة حمرا." }];
  WD.LOOK.pigeonWater = [{ t: "طبق مية للحمام. الحاجة نعمات بتغيّره كل يوم." }];
  WD.ACTS = WD.ACTS || {};
  WD.ACTS.grain = function (day, time) {
    var me = H.map.me();
    if (dark(time)) { H.map.talk({ text: H.map.fmt("الحمام نايم في البرج. {سيبه|سيبيه} يرتاح لحد الصبح.") }); return true; }
    scatter(me.x + (me.dir === 2 ? -16 : 16), me.y + 2);
    return true;
  };
  WD.ACTS.flag = function (day, time) {
    if (dark(time)) { H.map.talk({ text: H.map.fmt("الحمام نايم. بالليل الراية بتفضل ساكتة.") }); return true; }
    if (F.mode === "fly") { comeHome(); H.map.talk({ text: H.map.fmt("{صفّرت|صفّرتي} زي الحاج عبده… والحمام لف لفة أخيرة ونزل على البرج.") }); return true; }
    flyUp();
    H.map.talk({ text: H.map.fmt("{هزّيت|هزّيتي} الراية الحمرا، والحمام طلع كله مرة واحدة. بيلف فوق الحارة… {اضغط|اضغطي} على الراية تاني عشان {تصفّر|تصفّري} لهم يرجعوا.") });
    return true;
  };

  function makeLoft() {
    var sky = A.cv(W, TOP), SP = A.Pt(sky);
    // what you see from up here: the mosque's dome close by on the left, the minaret, the roofs of the hara
    var cream = "#ECDDBB", rose = "#D69A82";
    SP.el(-20, 20, 96, 100, cream);
    for (var zy = 22; zy < 80; zy += 5) for (var zx = -16; zx < 72; zx += 6) SP.r(zx + (((zy / 5) | 0) % 2 ? 3 : 0), zy, 2, 2, rose);
    SP.el(40, 26, 20, 60, "rgba(120,70,80,0.2)"); SP.r(27, 6, 2, 16, BRASS[0]); SP.el(25, 12, 6, 6, BRASS[1]);
    SP.r(170, 0, 16, TOP, cream); SP.r(182, 0, 4, TOP, "#CDB892"); SP.r(166, 30, 24, 4, "#D9C29C"); SP.r(167, 26, 22, 1, "#B39A76"); SP.r(176, 8, 4, 10, "#2A2440");
    [[78, 50, 30], [108, 44, 24], [132, 56, 22], [192, 40, 24]].forEach(function (h, i) {
      var c = ["#D8B08A", "#C8A0A0", "#B8C0A8", "#D8C0A0"][i];
      SP.r(h[0], TOP - h[1], h[2], h[1], c); SP.r(h[0], TOP - h[1], h[2], 2, lt(c, 0.25));
      for (var wy = TOP - h[1] + 6; wy < TOP - 4; wy += 9) for (var wx = h[0] + 3; wx < h[0] + h[2] - 5; wx += 7) SP.r(wx, wy, 3, 4, "#5A4A5E");
    });
    var s = K.shell(W, HG, TOP, {
      floor: function (P, R) {
        K.plaster(P, 0, TOP, W, HG - TOP, "#C2B4A0", R);
        for (var i = 0; i < 40; i++) P.r(110 + ((R() * 60) | 0), 140 + ((R() * 16) | 0), 1, 1, "#E8E2D6"); // droppings under the tower
        P.el(96, 148, 70, 10, "rgba(60,40,50,0.12)");
      },
      wall: function (P, R) {
        P.g.clearRect(0, 0, W, TOP - 8);
        P.r(0, TOP - 8, W, 8, "#E6B0A0"); P.r(0, TOP - 8, W, 2, "#F6D0C2"); P.dots(0, TOP - 6, W, 6, ["#D09888"], 60, R);
        for (var hx = 6; hx < W - 6; hx += 5) P.r(hx, TOP - 5, 2, 3, "#B87A6A");
      },
      noDoor: true, cap: "#5A3A40", seed: 12
    });
    s.P.g.clearRect(0, 0, W, 5); s.P.g.clearRect(0, 0, 5, TOP - 8); s.P.g.clearRect(W - 5, 0, 5, TOP - 8);
    return {
      id: "pigeons", name: "برج الحمام", sub: "برج الحاج عبده، الله يرحمه", W: W, HGT: HG, ground: s.c, bed: "loft", wall: TOP, roof: true, suhoor: true,
      props: [
        { k: "ghiya", o: { open: true }, x: TX, y: TB, block: [36, 10] },
        { k: "grainSack", x: 70, y: 128, block: [16, 4], look: "grain" },
        { k: "waterDish", x: 166, y: 160, noblock: true, look: "pigeonWater" },
        { k: "rayaPole", x: 180, y: 140, block: [10, 4], look: "flag" },
        { k: "stool", x: 98, y: 156, noblock: true },
        { k: "stairHut", x: 8, y: 168, block: [32, 8] },
        { k: "plantPots", o: { n: 2, seed: 4 }, x: 186, y: 104, block: [20, 4] }
      ],
      fixtures: [
        { layer: "under", draw: function (R) {
          var top = { asr: ["#7EC0E8", "#CDEAF6"], pre: ["#F2A86A", "#FFE0A8"], maghrib: ["#6A4A8A", "#F28A8A"], night: ["#141640", "#2A2A62"], suhoor: ["#0E1238", "#2A2A5A"] }[R.time] || ["#7EC0E8", "#CDEAF6"];
          for (var y = 0; y < TOP; y += 4) R.rect(0, y, W, 4, A.mix(top[0], top[1], y / TOP));
          if (dark(R.time)) for (var i = 0; i < 30; i++) { var tw = Math.sin(R.T * 2 + i * 1.3); if (tw > 0.2) R.rect((i * 67 + 13) % W, (i * 37 + 5) % 40, 1, 1, tw > 0.8 ? "#FFFFFF" : "#C9CDF0"); }
          R.img(sky, 0, 0);
          if (R.on > 0.3) for (var r = 0; r < 2; r++) for (var x = 168; x < 188; x += 2) R.rect(x, 26 + r * 4, 1, 1, ((x + ((R.T * 4) | 0)) % 3) ? "#7CFFB0" : "#E8FFF0");
        } },
        { layer: "sort", y: TB + 0.5, draw: function (R) { F.birds.forEach(function (b) { if (b.st === "perch" && !dark(R.time)) drawBird(R, b); }); if (dark(R.time)) for (var z = 0; z < 3; z++) { var k = (R.T * 0.5 + z * 0.33) % 1; R.alpha(1 - k); R.rect(TX + 20 + z * 3 + Math.round(k * 4), TB - 40 - Math.round(k * 10), 2, 1, "#F4F0FF"); R.alpha(1); } } },
        { layer: "sort", y: 170, draw: function (R) {
          F.grain.forEach(function (g) { R.rect(Math.round(g[0]), Math.round(g[1]), 1, 1, "#E8C878"); });
          F.birds.forEach(function (b) { if (b.st === "peck" || (b.st === "down" && b.t <= 0)) drawBird(R, b); });
        } }
      ],
      over: function (R) { F.birds.forEach(function (b) { if (b.st === "fly" || b.st === "home" || b.st === "up") drawBird(R, b); }); drawRelease(R); },
      strings: [{ k: "flags", x0: 0, y0: 86, x1: W, y1: 88, sag: 12 }, { k: "lanterns", x0: 40, y0: 98, x1: 120, y1: 92, sag: 8 }],
      walk: [[8, TOP + 2, W - 16, HG - TOP - 8]],
      lights: [{ x: 178, y: 28, r: 24, c: [120, 255, 160], when: "on", g: 0.6 }],
      wins: [],
      exits: [{ r: [12, 168, 26, 12], to: "hara", spot: "pigeons" }],
      spawn: { hara: [26, 180, 0] },
      tick: function (R, dt) { if (!F.birds.length) resetFlock(); tickFlock(R, dt); },
      people: function (time) {
        if (!F.birds.length || F.mode !== "perch") resetFlock();
        if (S.q.pigeons !== "done" || dark(time)) return [];
        if (time === "asr" || time === "pre") return [{ id: "nemat", cast: "nemat", name: "الحاجة نعمات", face: "nemat", at: [103, 158, 3, "sit"], talk: [92, 172], say: [
          { t: "«{بص|بصي}… " + (S.petName || "حمامتك") + " جت زارتني الصبح وأكلت من إيدي. بس قلبها معاك.»" },
          { t: "«عبده كان بيقعد على الكرسي ده بالساعات. أنا دلوقتي فاهمة ليه.»" },
          { t: "«{هزّ|هزّي} الراية الحمرا، الحمام هيطير. و{اضغط|اضغطي} عليها تاني يرجعوا.»" }] }];
        return [];
      }
    };
  }
  H.rooms.add("pigeons", makeLoft, null);
})();
