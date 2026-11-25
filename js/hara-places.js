/* فوانيس الحارة · الأماكن المقفولة: the places that open later in the month (walk.html).
   The hara keeps some doors shut so you keep wondering what's behind them. Three ways in:
     a day        ملاهي ليالي رمضان opens on night 15, سينما النصر on night 22. Before that their fronts count down.
     a key        hidden somewhere in the hara on one day (and once more on a second-chance day). Each player's key
                  hides in one of a few spots, so a friend can't just tell you. Miss it, and the hara tells you so.
                    برج الحمام (Hagg Abdo's pigeon tower, on the roof by the mosque): key on day 4, again on day 9
                    دكان اللعب (Shawky's shut toy shop): key on day 18, again on day 24
     an errand    بيت الأستاذ نبيل (the plain lilac house by the café): from day 6 he drops his keys by the bakery.
   This file keeps your progress (hara.places.v1), paints the outside of each place, hides the keys and runs the
   doors. Each place's inside is its own file: hara-pigeons.js, hara-villa.js, hara-fair.js, hara-cinema.js,
   hara-toys.js. Games you play there are in hara-games.js. js/map.js reads the hooks set on H.world here. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world;
  if (!A || !WD || !H.rooms) return;
  var PROPS = A.PROPS, sprite = A.sprite, dk = A.dk, lt = A.lt, rng = A.rng, mix = A.mix;
  var WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS;
  var DIG = "٠١٢٣٤٥٦٧٨٩";
  function ar(n) { return String(n).replace(/\d/g, function (d) { return DIG[d]; }); }
  function dark(t) { return t === "night" || t === "suhoor"; }
  function evening(t) { return t === "maghrib" || dark(t); }

  /* ================= your progress with the places (saved on this phone) ================= */
  var STORE = "hara.places.v1";
  var S0 = (function () { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } })();
  var S = {
    seed: S0.seed || ((Math.random() * 1e6) | 0),   // where your keys hide
    keys: S0.keys || {},       // keys you found: { pigeons: day }
    told: S0.told || {},       // which "you missed it" notes you've had
    open: S0.open || {},       // places you've opened for good
    q: S0.q || {},             // how far along each errand is
    owned: S0.owned || {},     // things you won or were given (the hat)
    tickets: S0.tickets || 0,  // the fair's tickets
    pet: S0.pet || null,       // your pigeon's colour
    petName: S0.petName || "",
    letters: S0.letters || {}, // Nabil's letters you've read
    seen: S0.seen || {}
  };
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }

  /* ================= the calendar of the places ================= */
  var OPEN = { fair: 15, cinema: 22, villa: 6 };
  // Keys: the days they hide, a riddle for where, and the spots they might be in (each player gets one per day).
  var KEYS = {
    pigeons: {
      days: [4, 9], name: "مفتاح برج الحمام", place: "برج الحمام",
      riddle: "مفتاح نحاس قديم مستخبي النهارده في الحارة… جنب حاجة فيها مية.",
      spots: [[72, 696], [544, 272], [50, 545]],
      found: "مفتاح نحاس قديم، مربوط فيه شريط أحمر باهت. على الشريط بخط إيد: «البرج».",
      lost: "المفتاح ضاع تاني. برج الحمام هيفضل مقفول السنة دي."
    },
    toys: {
      days: [18, 24], name: "مفتاح دكان اللعب", place: "دكان اللعب",
      riddle: "مفتاح صغير مستخبي النهارده في حتة العيال بيلعبوا فيها.",
      spots: [[327, 718], [262, 719], [214, 640]],
      found: "مفتاح صغير عليه ميدالية حصان خشب، لونه باهت من الشمس. على ضهر الحصان: «ش».",
      lost: "المفتاح ضاع تاني. دكان اللعب هيفضل مقفول، وعيال الحارة مش هيلاقوا لعبة العيد."
    }
  };
  function keyDayIndex(id, day) { return KEYS[id].days.indexOf(day); }
  function keySpot(id, chance) { var k = KEYS[id]; return k.spots[(S.seed + chance * 2 + (id === "toys" ? 1 : 0)) % k.spots.length]; }
  function lastChance(id) { var d = KEYS[id].days; return d[d.length - 1]; }

  /* ================= little things ================= */
  var keyImg = sprite(9, 7, function (P) {
    P.el(0, 1, 4, 4, BRASS[0]); P.p(1, 2, "#3A2A20"); P.p(2, 2, "#3A2A20"); P.p(1, 1, BRASS[1]);
    P.r(4, 2, 5, 1, BRASS[0]); P.r(4, 2, 5, 1, BRASS[1]); P.r(6, 3, 1, 2, BRASS[0]); P.r(8, 3, 1, 1, BRASS[0]);
    P.p(2, 5, "#C8343A"); P.p(1, 6, "#C8343A"); P.p(3, 6, "#A82A30");
  });
  H.places = { S: S, save: save, KEYS: KEYS, OPEN: OPEN, ar: ar, keyImg: keyImg };

  // Run a few lines of a scene. "words" narrate; { who, t } speaks; { ask, opts, then: [[...], [...]] } asks;
  // a function gets the camera (C) and may return a promise.
  function play(list) { return (list || []).reduce(function (p, l) { return p.then(function () { return step(l); }); }, Promise.resolve()); }
  function step(l) {
    var C = H.map.cut;
    if (!l) return Promise.resolve();
    if (typeof l === "string") return C.say({ t: l });
    if (typeof l === "function") return Promise.resolve(l(C));
    if (l.opts) return C.ask({ who: l.who || null, t: l.t, name: l.name, face: l.face, options: l.opts.map(function (o) { return H.map.fmt(o); }) }).then(function (i) { return l.then ? play(l.then[i || 0]) : (l.pick ? l.pick(i || 0) : null); });
    return C.say(l);
  }
  // a whole scene: the black bars come down, the lines play, then the hara is yours again
  var inScene = false;
  function scene(list) {
    if (inScene) return Promise.resolve();
    inScene = true;
    var C = H.map.cut;
    C.begin();
    return play(list).then(function () { C.end(); inScene = false; H.map.refresh(); }, function (e) { C.end(); inScene = false; if (window.console) console.error(e); });
  }
  H.places.play = play; H.places.scene = scene;
  function banner(n, s, k) { if (H.map && H.map.banner) H.map.banner(n, H.map.fmt(s), k || "news"); }
  function chime() { if (H.audio) H.audio.chime(); }
  H.places.banner = banner;

  /* ================= what the hara shows of each place ================= */

  // ---- برج الحمام: Hagg Abdo's pigeon tower, a tall lattice cage on the roof of the old family house (n2) ----
  PROPS.ghiya = function (o) {
    return sprite(36, 60, function (P) {
      var R = rng(5);
      // the pole and its flag (the راية he waved to bring the flock home)
      P.r(30, 0, 1, 30, "#5A3A2A"); P.r(31, 1, 5, 3, o.open ? "#E8503F" : "#A8585A"); P.r(31, 4, 3, 1, o.open ? "#C8443A" : "#8A4A4A");
      // stilts and their cross bracing
      [5, 14, 21, 30].forEach(function (x, i) { P.r(x, 40, 1, 18, i % 2 ? "#5A3A28" : "#6A4430"); });
      P.line(5, 44, 30, 54, "#7A5236"); P.line(30, 44, 5, 54, "#7A5236"); P.r(5, 49, 26, 1, "#7A5236");
      // the cage: slats of old wood, lighter on top where the sun hits
      P.r(2, 12, 32, 28, "#3A2830");
      for (var x = 2; x < 34; x += 2) P.r(x, 12, 1, 28, x < 18 ? "#C9A46A" : "#A8844E");
      for (var y = 12; y < 40; y += 3) P.r(2, y, 32, 1, y < 18 ? "#D9B47A" : "#B08A54");
      P.r(2, 12, 1, 28, "#E2C38C"); P.r(33, 12, 1, 28, "#8A6238");
      if (!o.open) P.dots(2, 12, 32, 28, ["#8A7A6A", "#6A5A4A"], 40, R); // dust and droppings, years of them
      // the landing board out front, and the little doors the pigeons use
      P.r(0, 39, 36, 2, "#8A5A3A"); P.r(0, 39, 36, 1, "#A8714A");
      [8, 18, 26].forEach(function (dx) { P.r(dx, 32, 4, 5, "#2A1C22"); P.r(dx, 31, 4, 1, "#7A5236"); });
      // a pitched roof of planks
      P.r(0, 8, 36, 4, "#9C6542"); P.r(1, 6, 34, 2, "#BA8155"); P.r(4, 4, 28, 2, "#9C6542"); P.r(8, 2, 20, 2, "#BA8155"); P.r(0, 11, 36, 1, "#6A4430");
      if (!o.open) { P.r(16, 33, 6, 1, "#8A8E94"); P.r(17, 34, 4, 3, "#C8963E"); P.p(18, 34, "#F2C76C"); } // a padlock on the hatch
      // pigeons sitting on the roof of it
      [[6, 1, "#C9C2B8"], [13, 0, "#9C98A6"], [24, 1, "#F4F0E8"]].forEach(function (b) { P.r(b[0], b[1] + 2, 4, 2, b[2]); P.r(b[0] + 3, b[1] + 1, 2, 2, b[2]); P.p(b[0] + 4, b[1] + 1, "#2A1A24"); P.p(b[0] + 5, b[1] + 2, "#E8A040"); });
    }, null);
  };
  // the pigeons wheeling round the tower in the afternoon (only once someone keeps them again)
  function flock(R, x0, top) {
    if (dark(R.time)) return;
    var n = S.open.pigeons ? 7 : 2, cx = x0 + 18, cy = top + 8;
    for (var i = 0; i < n; i++) {
      var a = R.T * (0.9 + (i % 3) * 0.15) + i * 0.9, rx = 26 + (i % 3) * 8, x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy - 10 + Math.sin(a) * rx * 0.32 - (i % 2) * 6);
      var up = Math.sin(R.T * 11 + i) > 0, c = ["#C9C2B8", "#9C98A6", "#F4F0E8"][i % 3];
      R.rect(x, y, 2, 1, c); R.rect(x - 1, y + (up ? -1 : 1), 1, 1, c); R.rect(x + 2, y + (up ? -1 : 1), 1, 1, c);
    }
  }
  WD.PROPS.push({ k: "ghiya", o: { open: false }, x: 90, y: 236.6, z: 78.6, noblock: true, skyCut: true, anim: flock, if: function () { return !S.open.pigeons; } });
  WD.PROPS.push({ k: "ghiya", o: { open: true }, x: 90, y: 236.6, z: 78.6, noblock: true, skyCut: true, anim: flock, if: function () { return !!S.open.pigeons; } });
  // a chain and a padlock across a door
  PROPS.doorChain = function (o) {
    var w = o.w || 14;
    return sprite(w + 2, 12, function (P) {
      for (var x = 1; x < w + 1; x += 2) { P.p(x, 3 + ((x / 2) % 2), "#8A8E94"); P.p(x + 1, 4 - ((x / 2) % 2), "#6A6E74"); }
      var m = (w >> 1) - 1;
      P.r(m + 1, 4, 3, 1, "#6A6E74"); P.r(m, 5, 5, 5, BRASS[0]); P.r(m, 5, 5, 1, BRASS[1]); P.p(m + 2, 7, "#3A2A20"); P.r(m + 1, 3, 1, 2, "#8A8E94"); P.r(m + 3, 3, 1, 2, "#8A8E94");
    }, null);
  };
  WD.PROPS.push({ k: "doorChain", o: { w: 14 }, x: 115, y: 236.4, z: 21, noblock: true, if: function () { return !S.open.pigeons; } });
  WD.SPOTS.pigeons = { name: "برج الحمام", stand: [123, 250], mark: [123, 196], tap: [110, 196, 26, 42] };

  // ---- دكان اللعب: Shawky's toy shop on the ground floor of the corner house (n1), shut for ten years ----
  PROPS.toyFront = function (o) {
    var open = !!o.open;
    return sprite(40, 34, function (P) {
      var R = rng(11);
      // the frame and the sign board
      P.r(0, 0, 40, 34, "#5A4A48"); P.r(1, 9, 38, 25, "#2A1C26");
      P.r(0, 0, 40, 9, open ? "#2F6A8A" : "#6A7A84"); P.r(0, 0, 40, 1, lt(open ? "#2F6A8A" : "#6A7A84", 0.3)); P.r(0, 8, 40, 1, "#3A2A30");
      // the window: toys on two shelves
      var toys = [
        function (x, y) { P.r(x, y + 3, 6, 3, "#C8443A"); P.r(x + 1, y + 1, 4, 2, "#E8C26A"); P.r(x + 5, y, 2, 3, "#C8443A"); P.p(x + 1, y + 6, "#3A2A30"); P.p(x + 4, y + 6, "#3A2A30"); }, // a rocking horse
        function (x, y) { P.r(x, y + 1, 5, 5, GLASS[3]); P.r(x + 1, y, 3, 1, BRASS[0]); P.r(x + 1, y + 2, 1, 3, "#FFF0B0"); }, // a toy fanous
        function (x, y) { P.el(x, y + 1, 6, 5, "#4F97E8"); P.r(x, y + 3, 6, 1, "#F2C14A"); P.p(x + 2, y + 1, "#FFFFFF"); }, // a ball
        function (x, y) { P.r(x + 1, y, 3, 3, "#E5B088"); P.r(x, y + 3, 5, 4, "#E86AA0"); P.p(x + 1, y + 1, "#2A1A24"); P.p(x + 3, y + 1, "#2A1A24"); P.r(x, y - 1, 5, 1, "#5A3524"); }, // a doll
        function (x, y) { P.r(x, y + 2, 7, 3, "#3E78C2"); P.r(x + 1, y, 4, 2, "#9ACCF4"); P.p(x + 1, y + 5, "#2A2234"); P.p(x + 5, y + 5, "#2A2234"); }, // a tin car
        function (x, y) { P.el(x, y + 1, 5, 6, "#C8963E"); P.r(x, y + 1, 5, 1, "#F4EFE4"); P.r(x + 1, y + 3, 3, 1, "#8A5A2A"); } // a little drum
      ];
      P.r(2, 20, 36, 1, WOOD[0]); P.r(2, 31, 36, 1, WOOD[0]);
      toys.forEach(function (f, i) { f(3 + (i % 3) * 12, i < 3 ? 13 : 24); });
      if (!open) {
        // the shutter is three quarters down, and the glass below it is grey with dust
        P.r(1, 9, 38, 17, "#9AA6AE"); for (var y = 10; y < 26; y += 2) P.r(1, y, 38, 1, "#7E8A92");
        P.dots(1, 9, 38, 17, ["#B2723A", "#9A5A30"], 26, R);
        P.r(1, 26, 38, 1, "#5A6A72");
        P.r(1, 27, 38, 6, "rgba(190,180,160,0.72)"); P.dots(1, 27, 38, 6, ["#C8C0B0", "#A89C88"], 30, R);
        P.r(32, 10, 7, 7, "rgba(240,240,240,0.5)"); P.line(32, 10, 38, 16, "#E8E8E8"); P.line(38, 10, 32, 16, "#E8E8E8"); // a cobweb
        P.r(14, 28, 12, 4, "#F4EFE4"); P.r(15, 29, 7, 1, "#C8302C"); P.r(15, 31, 9, 1, "#5A5A6A"); // a paper in the window
      } else {
        P.r(1, 9, 38, 3, "#9AA0A8"); P.r(1, 9, 38, 1, "#C9CDD3");
        for (var b = 2; b < 39; b += 4) P.p(b, 9, ["#E8503F", "#F2C14A", "#4CBF73", "#4F97E8"][(b >> 2) % 4]); // bulbs round the window
        P.r(2, 12, 2, 19, "rgba(255,240,200,0.3)");
      }
    }, null);
  };
  WD.PROPS.push({ k: "toyFront", o: { open: false }, x: 3, y: 236.5, z: 3.5, noblock: true, look: "toyshop", if: function () { return !S.open.toys; }, sign: { dx: 20, dy: -30, t: "لعب عم شوقي", h: 5.5, fg: "#CFC2AE" } });
  WD.PROPS.push({ k: "toyFront", o: { open: true }, x: 3, y: 236.5, z: 3.5, noblock: true, light: "own", if: function () { return !!S.open.toys; }, sign: { dx: 20, dy: -30, t: "لعب عم شوقي", h: 5.5, fg: "#FFE7A0" } });
  WD.PROPS.push({ k: "doorChain", o: { w: 14 }, x: 45, y: 236.4, z: 19, noblock: true, if: function () { return !S.open.toys; } });
  WD.SPOTS.toys = { name: "دكان اللعب", stand: [53, 250], mark: [36, 196], tap: [2, 200, 62, 40] };

  // ---- ملاهي ليالي رمضان: an alley past the minaret, a gate of lights, a ticket booth, the big wheel over the roofs ----
  function fairOpen(day) { return day >= OPEN.fair; }
  function fairHours(t) { return t === "maghrib" || t === "night"; } // it shuts before suhoor (the tent's night)
  PROPS.fairGate = function (o) {
    var open = !!o.open;
    var c = sprite(28, 62, function (P) {
      // two pillars wrapped in stripes, a crescent on each
      [[0, 1], [23, -1]].forEach(function (pl) {
        var x = pl[0];
        for (var y = 14; y < 60; y++) P.r(x, y, 5, 1, ((y >> 2) % 2) ? "#E8503F" : "#F4EFE4");
        P.r(x, 14, 5, 1, "#F2C14A"); P.r(x + (pl[1] > 0 ? 4 : 0), 14, 1, 46, "rgba(40,20,40,0.25)");
        P.r(x - 1, 59, 7, 3, "#8A7A6A");
        P.map(x, 6, [".yy..", "y....", "y....", ".yy.."], { y: "#F2C14A" });
      });
      // the arched board over the gate
      P.el(1, 8, 26, 14, "#2A3F7A"); P.r(1, 15, 26, 7, "#2A3F7A"); P.el(3, 10, 22, 10, "#1F2F60"); P.r(3, 15, 22, 6, "#1F2F60");
      P.r(1, 21, 26, 1, "#F2C14A");
      // the gate itself
      if (!open) {
        P.r(5, 24, 18, 36, "#3A3440");
        for (var gx = 6; gx < 23; gx += 3) P.r(gx, 24, 1, 36, "#6A6E74");
        P.r(5, 30, 18, 1, "#6A6E74"); P.r(5, 52, 18, 1, "#6A6E74");
        P.r(13, 24, 1, 36, "#2A2428");
        P.r(10, 40, 8, 1, "#8A8E94"); P.r(12, 41, 4, 4, BRASS[0]); P.p(13, 42, BRASS[1]); // chain and padlock
        P.r(7, 33, 14, 6, "#F4EFE4"); P.r(8, 34, 9, 1, "#C8302C"); P.r(8, 36, 11, 1, "#4A4A5A"); // the opening date on a paper
      } else {
        P.r(5, 24, 2, 36, "#6A6E74"); P.r(21, 24, 2, 36, "#6A6E74"); // the gates folded back against the pillars
      }
    }, null);
    if (open) c.getContext("2d").clearRect(7, 23, 14, 37); // the way in, open: the fair shows through it (under)
    return c;
  };
  // what you see through the open gate at night: the alley lit up in colours, people going in
  function gateGlow(R, x0, top) {
    if (!fairOpen(R.day)) return;
    var x = x0 + 7, y = top + 23, n = fairHours(R.time);
    for (var i = 0; i < 37; i++) R.rect(x, y + i, 14, 1, n ? mix("#3A1E4A", "#E8784A", i / 37) : mix("#8A7A6A", "#C9A878", i / 37));
    if (!n) return;
    R.alpha(0.45); R.rect(x, y, 14, 37, ["#FF4A7A", "#4AA8FF", "#FFD24A", "#5AFF9A"][((R.T * 1.3) | 0) % 4]); R.alpha(1);
    for (var b = 0; b < 5; b++) R.rect(x + 1 + b * 3, y + 3 + ((b * 7 + ((R.T * 6) | 0)) % 6), 1, 1, "#FFF2B0"); // far bulbs
    [[x + 4, 0], [x + 9, 1.3]].forEach(function (p) { var k = ((R.T * 0.4 + p[1]) % 1), py = y + 34 - k * 14; if (k < 0.85) { R.rect(p[0], py - 5, 2, 2, "#3A2030"); R.rect(p[0], py - 3, 2, 3, "#5A3048"); } }); // people walking in
  }
  function gateBulbs(R, x0, top) { // bulbs round the board, chasing at night once it's open
    var on = fairOpen(R.day) && fairHours(R.time), t = (R.T * 8) | 0, n = 0;
    for (var a = 0; a <= 14; a++) {
      var ang = Math.PI - a / 14 * Math.PI, bx = Math.round(x0 + 14 + Math.cos(ang) * 12), by = Math.round(top + 15 - Math.sin(ang) * 7);
      R.rect(bx, by, 1, 1, on ? ((n++ + t) % 3 === 0 ? "#FFFFFF" : ["#FFE07A", "#FF7A9A", "#7AE8FF"][a % 3]) : "#7A7068");
    }
    for (var y = 16; y < 58; y += 4) { R.rect(x0 + 2, top + y, 1, 1, on && ((y + t) % 3) ? "#FFE07A" : "#8A7A6A"); R.rect(x0 + 25, top + y, 1, 1, on && ((y + t + 1) % 3) ? "#FFE07A" : "#8A7A6A"); }
  }
  WD.PROPS.push({ k: "fairGate", o: { open: false }, x: 365, y: 206, block: [28, 4], under: gateGlow, anim: gateBulbs, sign: { dx: 14, dy: -46, t: "ملاهي", h: 7, fg: "#FFD98A" }, if: function (d) { return !fairOpen(d); } });
  WD.PROPS.push({ k: "fairGate", o: { open: true }, x: 365, y: 206, block: [7, 4], under: gateGlow, anim: gateBulbs, sign: { dx: 14, dy: -46, t: "ملاهي", h: 7, fg: "#FFE07A" }, if: function (d) { return fairOpen(d); } });
  // the ticket booth in the square: a little striped hut with a window and a board that counts the days
  PROPS.ticketBooth = function () {
    return sprite(26, 38, function (P) {
      P.r(1, 12, 24, 23, "#F4EFE4"); for (var x = 1; x < 25; x += 4) P.r(x, 12, 2, 23, "#E8503F");
      P.r(1, 12, 24, 1, "#FFFFFF"); P.r(22, 13, 3, 22, "rgba(40,20,40,0.2)");
      P.r(5, 15, 16, 9, "#3A2830"); P.r(5, 15, 16, 1, "#2A1C22"); P.r(4, 24, 18, 2, WOOD[1]); P.r(4, 25, 18, 1, WOOD[3]);
      P.el(10, 17, 6, 4, "#5A4A6A"); // a round hole in the glass
      // the roof: a little dome with a pennant
      P.el(0, 3, 26, 12, "#2A3F7A"); P.r(0, 9, 26, 4, "#2A3F7A"); P.r(0, 12, 26, 1, "#F2C14A");
      for (var s = 1; s < 26; s += 4) P.p(s, 13, "#F2C14A");
      P.r(12, 0, 1, 5, "#5A4030"); P.r(13, 0, 4, 2, "#F2C14A");
      P.r(1, 34, 24, 2, "#8A7A6A");
      // the date board, hung on the front
      P.r(4, 27, 18, 7, "#1F2F60"); P.r(4, 27, 18, 1, "#F2C14A");
    }, [0, 34, 26, 4, 0.25]);
  };
  function boothBoard(R, x0, top) {
    var d = OPEN.fair - R.day, open = d <= 0, on = fairHours(R.time);
    R.text(open ? (on ? "فاتحين!" : "بعد الفطار") : d === 1 ? "بكرة!" : "باقي " + ar(d), x0 + 13, top + 30.6, 4.2, open ? "#7CFFB0" : "#FFE07A", "sans");
    if (open && on) { var t = ((R.T * 1.5) | 0) % 2; R.rect(x0 + 8, top + 18, 2, 3, "#C89070"); R.rect(x0 + 8, top + 17, 3, 1, "#2B1F26"); R.rect(x0 + 15 + t, top + 21, 3, 2, "#F2C14A"); } // the man in the window, a ticket
  }
  WD.PROPS.push({ k: "ticketBooth", x: 424, y: 266, block: [26, 5], anim: boothBoard, look: "fairbooth", light: [13, -14, [255, 210, 150], 30] });
  WD.SPOTS.fair = { name: "ملاهي ليالي رمضان", stand: [379, 214], mark: [379, 140], tap: [364, 144, 30, 66] };
  // walking up the alley: its own name, and the fair's music through the gate once it's open
  WD.PLACES.unshift({ id: "fairgate", name: "ملاهي ليالي رمضان", sub: "", r: [362, 150, 34, 98], bed: "square", fn: function (day, time) {
    if (!fairOpen(day)) return { sub: "الافتتاح ليلة ١٥ رمضان · " + (OPEN.fair - day === 1 ? "بكرة!" : "باقي " + ar(OPEN.fair - day)), bed: "square" };
    return fairHours(time) ? { sub: "مراجيح وعجلة ونيشان وصيد البط… والجوايز!", bed: "fairOut" } : time === "suhoor" ? { sub: "قفلت… الكل راح خيمة عم سيد", bed: "square" } : { sub: "بتفتح بعد الفطار", bed: "square" };
  } });
  // the big wheel, standing beyond the roofs: dark and still until night 15, then turning in lights
  function wheel(R) {
    var cx = 418, cy = 92, r = 31, open = fairOpen(R.day), on = open && fairHours(R.time), rot = open ? R.T * 0.12 : 0.3;
    var steel = on ? "#3A3660" : R.time === "maghrib" ? "#5A4060" : dark(R.time) ? "#2A2A50" : "#8A8EA0";
    // the legs, down behind the houses
    for (var i = 0; i < 46; i++) { R.rect(cx - 2 - Math.round(i * 0.42), cy + i, 1, 1, steel); R.rect(cx + 2 + Math.round(i * 0.42), cy + i, 1, 1, steel); }
    // the rim and the spokes
    for (var a = 0; a < 96; a++) { var t = a / 96 * Math.PI * 2; R.rect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 1, 1, steel); }
    for (var s = 0; s < 12; s++) {
      var ang = rot + s / 12 * Math.PI * 2, ex = cx + Math.cos(ang) * r, ey = cy + Math.sin(ang) * r;
      for (var k = 2; k < r; k += 2) {
        var px = Math.round(cx + Math.cos(ang) * k), py = Math.round(cy + Math.sin(ang) * k);
        R.rect(px, py, 1, 1, on ? (((k + s * 3 + ((R.T * 10) | 0)) % 6) < 2 ? "#FFF4C0" : ["#FF5A8A", "#FFD24A", "#5AE8FF", "#7AFF7A"][s % 4]) : steel);
      }
      // the cabins hang level as the wheel turns
      var gc = ["#E8503F", "#F2C14A", "#4CBF73", "#4F97E8", "#B86BE0", "#FF8F3F"][s % 6];
      R.rect(Math.round(ex) - 2, Math.round(ey) + 1, 5, 3, on ? gc : open ? dk(gc, 0.3) : "#6A6A78"); R.rect(Math.round(ex), Math.round(ey), 1, 1, steel);
      if (on) R.rect(Math.round(ex) - 1, Math.round(ey) + 1, 1, 1, "#FFF2C0");
    }
    R.rect(cx - 2, cy - 2, 5, 5, on ? "#FFE07A" : steel);
  }
  WD.SKY = WD.SKY || [];
  WD.SKY.push(wheel);

  // ---- سينما النصر: the old cinema in the stone house (n4), shut since 2002 ----
  function cinemaOpen(day) { return day >= OPEN.cinema; }
  PROPS.cinemaFront = function (o) {
    var open = !!o.open;
    return sprite(102, 58, function (P) {
      var R = rng(22);
      // the marquee over the door: a deep red box with a gold edge
      P.r(18, 0, 70, 16, "#2A1018"); P.r(19, 1, 68, 14, open ? "#9A1E2C" : "#6A3A3A"); P.r(19, 1, 68, 1, open ? "#C83A48" : "#7A4A48");
      P.r(18, 16, 70, 2, "#3A2228"); P.r(26, 18, 1, 6, "#3A3434"); P.r(80, 18, 1, 6, "#3A3434"); // its brackets to the wall
      if (!open) P.dots(19, 1, 68, 14, ["#5A2A2A", "#8A5A4A"], 30, R);
      // two poster frames either side of the door, and the ticket window
      function frame(x, y, w, h) { P.r(x - 2, y - 2, w + 4, h + 4, "#C8963E"); P.r(x - 1, y - 1, w + 2, h + 2, "#8A6224"); }
      frame(4, 24, 20, 28); frame(78, 24, 20, 28);
      if (open) {
        // our own posters: the hara long ago (a sepia street under lanterns), and a cartoon of a cat with a fanous
        P.r(4, 24, 20, 28, "#C8A878"); P.r(4, 38, 20, 14, "#8A6A48"); P.r(6, 30, 5, 10, "#6A4A30"); P.r(16, 28, 6, 12, "#7A5A3A");
        for (var l = 0; l < 4; l++) P.r(5 + l * 5, 27 + (l % 2), 2, 2, "#F2D08A");
        P.r(4, 24, 20, 3, "#3A2418");
        P.r(78, 24, 20, 28, "#2A3F7A"); P.el(82, 34, 12, 10, "#F2A040"); P.r(83, 31, 3, 4, "#F2A040"); P.r(90, 31, 3, 4, "#F2A040"); P.p(85, 37, "#2A1A24"); P.p(90, 37, "#2A1A24");
        P.r(93, 40, 3, 5, GLASS[3]); P.r(93, 39, 3, 1, BRASS[0]); P.r(78, 48, 20, 4, "#F2C14A");
      } else {
        // old posters, torn and grey; a board nailed across
        P.r(4, 24, 20, 28, "#A89C88"); P.dots(4, 24, 20, 28, ["#8A7E6A", "#C8BCA8"], 60, R); P.r(4, 24, 9, 12, "#C8C0B0");
        P.r(78, 24, 20, 28, "#9A8E7A"); P.dots(78, 24, 20, 28, ["#7A6E5A", "#B8AC98"], 60, R); P.r(86, 40, 12, 12, "#C8C0B0");
        P.r(2, 35, 24, 3, WOOD[2]); P.r(76, 31, 24, 3, WOOD[2]); P.p(3, 36, "#3A3434"); P.p(24, 36, "#3A3434"); P.p(77, 32, "#3A3434"); P.p(98, 32, "#3A3434");
      }
      // the ticket window beside the door
      P.r(64, 30, 10, 12, "#5A4A48"); P.r(65, 31, 8, 8, open ? "#FFE7A0" : "#3A3440"); P.r(65, 39, 8, 2, WOOD[1]);
      if (!open) { P.r(65, 31, 8, 8, "#6A5A58"); P.line(65, 31, 72, 38, "#8A7A78"); }
      // a red carpet out of the door, once it's open
      if (open) { P.r(42, 52, 22, 6, "#B8343A"); P.r(42, 52, 22, 1, "#D8545A"); P.r(42, 52, 1, 6, "#F2C14A"); P.r(63, 52, 1, 6, "#F2C14A"); }
      else { P.r(46, 30, 12, 8, "#F4EFE4"); P.r(47, 31, 8, 1, "#C8302C"); P.r(47, 33, 10, 1, "#4A4A5A"); P.r(47, 35, 7, 1, "#4A4A5A"); } // a new paper on the old door
    }, null);
  };
  function marquee(R, x0, top) {
    var open = cinemaOpen(R.day), on = open && evening(R.time), t = (R.T * 7) | 0, n = 0;
    for (var x = 20; x < 88; x += 3) { R.rect(x0 + x, top + 1, 1, 1, on ? ((n++ + t) % 4 === 0 ? "#FFFFFF" : "#FFD24A") : open ? "#E8C878" : "#6A5A50"); R.rect(x0 + x, top + 14, 1, 1, on ? ((n + t) % 4 === 2 ? "#FFFFFF" : "#FFD24A") : open ? "#E8C878" : "#6A5A50"); }
    R.text("سينما النصر", x0 + 53, top + 8.3, 7, open ? "#FFE7A0" : "#B8A898");
    if (!open) return;
    R.text("الحارة زمان", x0 + 14, top + 47, 3.2, "#3A2418", "sans");
    R.text("عرض خاص", x0 + 88, top + 50, 3, "#3A2418", "sans");
  }
  WD.PROPS.push({ k: "cinemaFront", o: { open: false }, x: 460, y: 236.5, z: 3.5, noblock: true, anim: marquee, if: function (d) { return !cinemaOpen(d); } });
  WD.PROPS.push({ k: "cinemaFront", o: { open: true }, x: 460, y: 236.5, z: 3.5, noblock: true, anim: marquee, if: function (d) { return cinemaOpen(d); } });
  WD.SPOTS.cinema = { name: "سينما النصر", stand: [517, 250], mark: [517, 168], tap: [478, 176, 78, 62] };

  // ---- بيت الأستاذ نبيل: a plain lilac house by the café (c2). A few things don't add up. ----
  PROPS.villaFront = function () {
    return sprite(86, 70, function (P) {
      // an air conditioner on every window (the café says he has more of them than windows)
      [[10, 8], [56, 8], [70, 34]].forEach(function (a) {
        var x = a[0], y = a[1];
        P.r(x, y, 11, 8, "#ECEAE4"); P.r(x, y, 11, 1, "#FFFFFF"); P.r(x + 1, y + 2, 9, 1, "#A8A6A0"); P.r(x + 1, y + 4, 9, 1, "#A8A6A0"); P.r(x + 10, y + 1, 1, 7, "#C8C6C0");
        P.r(x + 4, y + 8, 1, 5, "#5A5A5A"); P.p(x + 4, y + 13, "#7AB8E0");
      });
      // a little camera over the door, and a brass plate with two letters
      P.r(2, 38, 6, 3, "#E8E6E0"); P.r(7, 39, 2, 1, "#3A3A44"); P.r(3, 41, 1, 3, "#8A8A90"); P.p(8, 39, "#E8303A");
      P.r(24, 52, 7, 4, BRASS[0]); P.r(24, 52, 7, 1, BRASS[1]); P.p(26, 54, "#5A3A20"); P.p(28, 54, "#5A3A20");
      // two potted palms by the door, in glazed pots too good for this street
      [[0, 58], [24, 58]].forEach(function (p) {
        P.r(p[0] + 1, p[1] + 5, 6, 6, "#2F6A8A"); P.r(p[0] + 1, p[1] + 5, 6, 1, "#4F8AAA"); P.r(p[0] + 2, p[1] + 7, 4, 1, "#F2C14A");
        P.line(p[0] + 4, p[1] + 5, p[0], p[1] - 2, "#3F8F4F"); P.line(p[0] + 4, p[1] + 5, p[0] + 8, p[1] - 1, "#4CBF73"); P.line(p[0] + 4, p[1] + 5, p[0] + 4, p[1] - 4, "#3F8F4F"); P.line(p[0] + 4, p[1] + 5, p[0] + 1, p[1] + 1, "#6EBE58");
      });
    }, null);
  };
  // one window glows blue at night and the light moves, as if there were water inside
  function villaWater(R, x0, top) {
    if (!dark(R.time)) return;
    var x = x0 + 58, y = top + 18, k = R.T;
    R.alpha(0.85); R.rect(x, y, 8, 9, "#3A8AC8"); R.alpha(1);
    for (var i = 0; i < 4; i++) R.rect(x + ((i * 3 + Math.round(k * 2)) % 8), y + 1 + i * 2, 2, 1, "#9AE8FF");
  }
  WD.PROPS.push({ k: "villaFront", x: 490, y: 452.5, z: 3.5, noblock: true, anim: villaWater, look: "villaHouse" });
  WD.SPOTS.villa = { name: "بيت الأستاذ نبيل", stand: [505, 468], mark: [505, 398], tap: [492, 404, 28, 50] };
  WD.LIGHTS = WD.LIGHTS || [];
  WD.LIGHTS.push(
    { x: 552, y: 444, r: 26, c: [90, 180, 255], when: "night", g: 0.8, dyn: function (T) { return [0.75 + 0.25 * Math.sin(T * 2.1), null]; } }, // the blue window
    { x: 379, y: 190, r: 46, c: [255, 120, 180], when: "on", g: 0.6, if: function (d, t) { return fairOpen(d) && fairHours(t); }, dyn: function (T) { return [0.8 + 0.2 * Math.sin(T * 3), [[255, 90, 150], [90, 170, 255], [255, 210, 90], [110, 255, 160]][((T * 1.3) | 0) % 4]]; } },
    { x: 513, y: 190, r: 40, c: [255, 210, 120], when: "on", g: 0.8, if: function (d) { return cinemaOpen(d); }, fl: 2 }
  );

  /* ================= the alley to the fair: setts up between the minaret and the house ================= */
  WD.onBuilt = function (G) {
    var P = A.Pt(G.ground), R = rng(66);
    for (var y = 150; y < 244; y += 4) {
      var off = ((y / 4) | 0) % 2 ? 3 : 0;
      for (var x = 366 - off; x < 392; x += 6) {
        var sx = Math.max(366, x), ex = Math.min(392, x + 5);
        if (ex <= sx) continue;
        var c = mix("#9A8A78", "#B9A68E", Math.min(1, (y - 150) / 90)); if (R() < 0.2) c = mix(c, "#C9B79A", 0.5);
        P.r(sx, y, ex - sx, 3, c); P.r(sx, y, ex - sx, 1, lt(c, 0.2)); P.r(sx, y + 2, ex - sx, 1, dk(c, 0.14));
      }
    }
    P.r(366, 150, 3, 94, "rgba(40,22,46,0.3)"); P.r(389, 150, 3, 94, "rgba(40,22,46,0.22)");
    G.walk.push([368, 208, 22, 40]);
  };

  /* ================= keys in the dust ================= */
  WD.PICKUPS = WD.PICKUPS || [];
  Object.keys(KEYS).forEach(function (id) {
    KEYS[id].days.forEach(function (d, chance) {
      var at = keySpot(id, chance);
      WD.PICKUPS.push({
        id: "key-" + id + "-" + d, x: at[0], y: at[1], img: keyImg,
        ok: function (day) { return day === d && !S.keys[id]; },
        pick: function (day) {
          S.keys[id] = day; save();
          banner("🔑 " + KEYS[id].name, "لقيته! خبايا الحارة بتتفتح لللي بيدوّر", "deed");
          scene([KEYS[id].found, id === "pigeons" ? "«البرج»… مفيش في الحارة غير برج واحد: برج الحمام اللي فوق بيت الحاج عبده الله يرحمه. الحاجة نعمات أكيد تعرفه." : "«ش»… والدكان المقفول اللي في الساحة مكتوب عليه «لعب عم شوقي». يمكن؟"]);
        }
      });
    });
  });

  /* ================= what the hara says about them ================= */
  function L(id, list) { WD.LOOK[id] = list; }
  L("toyshop", [
    { t: "دكان «لعب عم شوقي». الشيش نازل لتلت أرباعه، والإزاز اللي تحته عليه تراب سنين. من ورا التراب: حصان خشب، وعروسة، وطبلة صغيرة… مستنيين حد." }
  ]);
  L("fairbooth", [
    { minDay: OPEN.fair, t: "كشك التذاكر بتاع الملاهي. الراجل اللي جوّه بيعدّ تذاكر كأنها فلوس." },
    { t: "كشك التذاكر بتاع الملاهي. على اللوحة: الافتتاح ليلة ١٥ رمضان. الشباك مقفول لحد ساعتها." }
  ]);
  L("villaHouse", [
    { when: "night", t: "شباك من شبابيك البيت بينوّر أزرق… والنور بيتحرك كأن جوّه مية. مين في الحارة عنده حمّام سباحة جوّه بيته؟" },
    { t: "بيت بنفسجي عادي… بس كل شباك عليه تكييف، وفوق الباب كاميرا صغيرة نورها أحمر. والزرع اللي جنب الباب في قصاري ملوّنة غالية." }
  ]);
  WD.NEWS[OPEN.fair] = "ملاهي ليالي رمضان فتحت! بعد الفطار، العجلة الكبيرة نوّرت فوق البيوت";
  WD.NEWS[OPEN.cinema] = "سينما النصر بتفتح الليلة بعد ٢٥ سنة! عرض خاص لأهل الحارة بعد التراويح";

  /* ================= the doors ================= */
  function soon(day, from, what) {
    var d = from - day;
    return d === 1 ? "بكرة!" : d === 2 ? "باقي يومين." : "باقي " + ar(d) + " " + (d <= 10 ? "أيام." : "يوم.");
  }
  // the fair: shut until night 15, then open from maghrib to fajr
  H.rooms.DOORS.fair = { room: "fair", spot: "fair",
    open: function (day, f, t) { return fairOpen(day) && fairHours(t); },
    shut: function (day, t) {
      if (fairOpen(day) && t === "suhoor") return "الملاهي قفلت قبل السحور. الأنوار مطفية، وعنتر نايم على كرسي جنب البوابة. الحارة كلها راحت خيمة عم سيد.";
      if (!fairOpen(day)) return "البوابة مقفولة بجنزير. على الورقة: «ملاهي ليالي رمضان · الافتتاح ليلة ١٥ رمضان». " + soon(day, OPEN.fair) + " ومن ورا السور صوت حد بيدق مسامير ويغني.";
      return "الملاهي بتفتح بعد الفطار. من ورا البوابة صوت حد بيجرّب الميكروفون: «ألو… ألو… واحد اتنين… الليلة ليلتكم يا حارة!»";
    } };
  // the cinema: shut since 2002; opens on night 22 after taraweeh
  H.rooms.DOORS.cinema = { room: "cinema", spot: "cinema",
    open: function (day, f, t) { return cinemaOpen(day) && t === "night"; },
    shut: function (day, t) {
      if (cinemaOpen(day) && t === "suhoor") return "العرض خلص. عم مرسي قافل البوابة وبيصفّر، وشايل علب الفيلم تحت باطه زي العيال.";
      if (!cinemaOpen(day)) return "سينما النصر. مقفولة من سنة ٢٠٠٢. على الباب ورقة جديدة: «افتتاح ليلة ٢٢ رمضان · عرض خاص لأهل الحارة». " + soon(day, OPEN.cinema) + " مين اللي هيفتحها؟";
      return "العرض بعد التراويح. عم مرسي جوّه بيمسح العدسة للمرة العاشرة.";
    } };
  // the pigeon tower: Nemat has to see the key first
  H.rooms.DOORS.pigeons = { room: "pigeons", spot: "pigeons",
    open: function () { return !!S.open.pigeons; },
    shut: function (day) {
      if (S.keys.pigeons) return "المفتاح في جيبك، بس ده برج الحاج عبده الله يرحمه. {ودّي|ودّي} المفتاح للحاجة نعمات الأول.";
      var k = KEYS.pigeons, left = k.days.filter(function (d) { return d >= day; });
      return "باب السطوح مقفول بجنزير وقفل نحاس قديم. فوق على السطح، برج الحمام بتاع الحاج عبده الله يرحمه. مفتاحه ضاع من سنين" + (left.length ? "… بيقولوا لسه مستخبي في حتة في الحارة." : ".");
    } };
  // the toy shop: the key opens it
  H.rooms.DOORS.toys = { room: "toys", spot: "toys",
    open: function () { return !!S.open.toys; },
    shut: function (day) {
      var left = KEYS.toys.days.filter(function (d) { return d >= day; });
      return "دكان عم شوقي مقفول من عشر سنين. الحاجة نعمات بتقول: «كان أحلى دكان في الحارة… كل عيل فيها كان عنده لعبة من عنده.»" + (left.length ? " المفتاح ضاع… بس الحارة ما بتضيّعش حاجة للأبد." : "");
    },
    onShut: function () { if (S.keys.toys && H.places.openToys) { H.places.openToys(); return true; } return false; } };
  // Nabil's house: shut, unless you bring him his keys (js/hara-villa.js)
  H.rooms.DOORS.villa = { room: "villa", spot: "villa",
    open: function () { return !!S.open.villa; },
    shut: "باب حديد تقيل، وجرس بكاميرا. محدش في الحارة دخل البيت ده. حتى المعلم سعيد بيقول: «نبيل ده عايش لوحده… وبيشتري رغيف واحد كل يوم.»",
    onShut: function () { if (S.q.villa === "told" && H.places.returnKeys) { H.places.returnKeys(); return true; } return false; } };

  /* ================= people who have something for you ================= */
  WD.TALK = function (a) {
    var hs = H.places.talk || [];
    for (var i = 0; i < hs.length; i++) if (hs[i](a) === true) return true;
    return false;
  };
  H.places.talk = [];

  /* ================= the errands list: today's hidden things ================= */
  WD.QUESTS = function (day, time) {
    var out = [];
    Object.keys(KEYS).forEach(function (id) {
      var k = KEYS[id];
      if (!S.keys[id] && keyDayIndex(id, day) >= 0) out.push({ icon: "🔑", t: k.riddle + (keyDayIndex(id, day) > 0 ? " (آخر فرصة!)" : "") });
    });
    (H.places.quests || []).forEach(function (f) { var q = f(day, time); if (q) out = out.concat(q); });
    return out;
  };
  H.places.quests = [];

  /* ================= when you come out into the hara ================= */
  WD.onStart = function (day, time) {
    var notes = [];
    if (H.map.news) H.map.news(); // "new in the hara today": the fair opened, the cinema, the garden
    Object.keys(KEYS).forEach(function (id) {
      var k = KEYS[id];
      if (S.keys[id]) return;
      if (keyDayIndex(id, day) >= 0 && !S.told[id + "@" + day]) { S.told[id + "@" + day] = 1; notes.push(["🔑 في مفتاح مستخبي في الحارة النهارده", k.riddle]); }
      k.days.forEach(function (d, i) {
        if (day <= d || S.told[id + "-missed-" + d]) return;
        S.told[id + "-missed-" + d] = 1;
        var next = k.days[i + 1];
        if (next && day < next) notes.push(["فاتك " + k.name, "كان مستخبي يوم " + ar(d) + " رمضان، و{ما لقيتوش|ما لقيتيهوش}. بيقولوا هيبان تاني يوم " + ar(next) + "… {خلّي|خلّي} عينك مفتوحة."]);
        else if (!next || day > next) { if (i === k.days.length - 1 || !next) notes.push(["فاتك " + k.name, k.lost]); }
      });
    });
    (H.places.onStart || []).forEach(function (f) { var n = f(day, time); if (n) notes.push(n); });
    if (notes.length) save();
    notes.forEach(function (n, i) { setTimeout(function () { banner(n[0], n[1], "news"); }, 400 + i * 5400); });
  };
  H.places.onStart = [];

  /* ================= what you carry: your pigeon, your hat ================= */
  WD.PET = function () { return S.pet; };
  WD.WEAR = function () { return { hat: !!S.owned.hat }; };
  H.places.give = function (k) { S.owned[k] = true; save(); };

  // for checking from the console: H.places._reset() forgets it all
  H.places._reset = function () { try { localStorage.removeItem(STORE); } catch (e) {} location.reload(); };
})();
