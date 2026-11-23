/* فوانيس الحارة · more things for the places of the hara (walk.html), painted in code like js/hara-art.js.
   Each place gets its own: the kiosk, the lantern stall, the fruit and date stalls, the café's big sycamore,
   Saber's bench and wooden lanterns, the garden in its stages, the kids' mural, Eid swings.
   A sprite can carry .lights = [[x, y, [r,g,b], radius], ...] for js/map.js to light at night. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix;
  if (!A) return;
  var cv = A.cv, Pt = A.Pt, rng = A.rng, dk = A.dk, lt = A.lt, mix = A.mix, pick = A.pick, sprite = A.sprite, flip = A.flip, outline = A.outline;
  var PROPS = A.PROPS, WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS, LEAF = A.LEAF;
  var CANDY = ["#E8503F", "#F2C14A", "#4CBF73", "#F08A2A", "#4F97E8", "#B86BE0"];

  // a small Ramadan lantern, 5 x 8, hung from its top
  function fanous(P, x, y, c) {
    P.map(x, y, ["..d..", ".bBb.", "dgGgd", "dGggd", "dgggd", ".bbb.", "..d.."], { d: BRASS[2], b: BRASS[0], B: BRASS[1], g: c, G: lt(c, 0.55) });
  }
  // a bigger one, 7 x 12, with a dome and a pointed foot
  function fanousBig(P, x, y, c) {
    P.map(x, y, ["...d...", "..bBb..", ".bbBbb.", "ddddddd", "dgGdggd", "dGgdgGd", "dggdggd", "ddddddd", ".dgggd.", "..bbb..", "...d..."],
      { d: BRASS[2], b: BRASS[0], B: BRASS[1], g: c, G: lt(c, 0.55) });
  }
  // a wooden lantern like the ones Saber makes: dark wood, coloured glass
  function fanousWood(P, x, y, c) {
    P.map(x, y, ["..w..", ".wWw.", "wgwgw", "wGwgw", "wgwgw", "wwwww", ".w.w."], { w: WOOD[3], W: WOOD[1], g: c, G: lt(c, 0.55) });
  }
  A.fanous = fanous; A.fanousBig = fanousBig; A.fanousWood = fanousWood;

  /* ---------------- the kiosk (كشك) ---------------- */
  PROPS.kiosk = function (o) {
    var c = sprite(50, 50, function (P) {
      var R = rng(o.seed || 41), body = "#2F7A74", bL = lt(body, 0.25), bS = dk(body, 0.3);
      // the fridge beside it: white, a red top, glass door full of bottles
      P.r(37, 14, 12, 31, "#EDEBE6"); P.r(37, 14, 12, 1, "#FFFFFF"); P.r(37, 14, 12, 5, "#D23B33"); P.r(38, 15, 10, 1, "#F06A5A");
      P.r(38, 20, 10, 22, "#A8D4E6"); P.r(38, 20, 1, 22, "#E8F6FA");
      for (var fy = 22; fy < 41; fy += 5) { P.r(38, fy + 3, 10, 1, "#D6E6EE"); for (var fx = 39; fx < 47; fx += 2) P.r(fx, fy, 1, 3, pick(R, ["#E8503F", "#F2C14A", "#4CBF73", "#F08A2A", "#4F97E8", "#7A3A20"])); }
      P.r(47, 27, 1, 6, "#9AA0A8"); P.r(37, 44, 12, 2, "#8A8E94");
      // the booth
      P.r(1, 10, 36, 35, body); P.r(1, 10, 1, 35, bL); P.r(34, 10, 3, 35, bS);
      for (var ry = 12; ry < 44; ry += 6) P.r(2, ry, 32, 1, dk(body, 0.12)); // ribbed tin
      // a striped roof overhang and the sign board on top
      P.r(3, 0, 32, 5, "#F2C14A"); P.r(3, 0, 32, 1, "#FFE08A"); P.r(3, 4, 32, 1, "#C8963E");
      P.r(0, 5, 38, 5, "#F4EFE4"); for (var i = 0; i < 38; i += 4) P.r(i, 5, 2, 5, "#D23B33");
      for (i = 0; i < 38; i += 4) { P.p(i, 10, "#D23B33"); P.p(i + 1, 10, "#D23B33"); P.p(i + 2, 10, "#F4EFE4"); }
      P.r(0, 5, 38, 1, "#FFFFFF");
      // the window: shelves of colour, packets hanging along the top
      P.r(4, 13, 29, 17, "#3A2830");
      for (var sy = 18; sy < 29; sy += 4) { P.r(4, sy + 3, 29, 1, "#7A5A44"); for (var sx = 5; sx < 32; sx += 2) P.r(sx, sy, 1, 3, pick(R, CANDY)); }
      for (var cx = 5; cx < 32; cx += 4) { var cc = pick(R, CANDY); P.p(cx + 1, 13, "#2A2224"); P.r(cx, 14, 3, 5, cc); P.p(cx + 1, 15, lt(cc, 0.5)); P.r(cx, 18, 3, 1, dk(cc, 0.25)); }
      P.r(17, 13, 4, 1, "#E8F6FF"); // the strip light
      // the counter: jars of sweets
      P.r(2, 30, 33, 3, "#C9A46A"); P.r(2, 30, 33, 1, "#E2C38C"); P.r(2, 32, 33, 1, "#8A6238");
      for (var jx = 5; jx < 31; jx += 7) { P.r(jx, 25, 5, 5, "#CFE6EE"); P.r(jx, 24, 5, 1, pick(R, ["#E8503F", "#3E78C2"])); P.r(jx + 1, 27, 3, 3, pick(R, CANDY)); P.p(jx, 26, "#FFFFFF"); }
      // posters on the lower panel
      [[4, "#E86A4A"], [14, "#4F97E8"], [24, "#4CBF73"]].forEach(function (p) {
        P.r(p[0], 34, 8, 9, "#F2E2C0"); P.r(p[0] + 1, 35, 6, 5, p[1]); P.el(p[0] + 2, 35, 4, 4, "#E8B08A"); P.r(p[0] + 2, 35, 4, 1, "#2A1A20"); P.r(p[0] + 1, 41, 6, 1, "#3A3A4A");
      });
    }, [0, 44, 50, 6, 0.3]);
    c.lights = [[19, 16, [215, 240, 255], 30], [42, 28, [200, 235, 255], 18]];
    return c;
  };

  /* ---------------- the lantern seller's stall ---------------- */
  PROPS.fanousStall = function (o) {
    var lights = [];
    var c = sprite(48, 50, function (P) {
      var R = rng(o.seed || 7);
      // the frame
      P.r(2, 4, 2, 42, WOOD[2]); P.r(2, 4, 1, 42, WOOD[1]); P.r(44, 4, 2, 42, WOOD[3]);
      P.r(0, 2, 48, 3, WOOD[0]); P.r(0, 2, 48, 1, WOOD[1]); P.r(0, 4, 48, 1, WOOD[3]);
      // big lanterns on strings, at different heights
      [[6, 7], [15, 11], [24, 6], [33, 10], [40, 6]].forEach(function (l, i) {
        var col = GLASS[(i * 2 + 1) % GLASS.length];
        P.r(l[0] + 3, 5, 1, l[1] - 5, "#5A4030");
        fanousBig(P, l[0], l[1], col);
        lights.push([l[0] + 3, l[1] + 6, A.rgb(col), 16]);
      });
      // a row of small ones on a lower bar
      P.r(4, 21, 40, 1, WOOD[2]);
      for (var x = 6; x < 42; x += 6) { var cc = GLASS[(x / 6 | 0) % GLASS.length]; fanous(P, x, 22, cc); }
      // the table, under a khayameya cloth
      P.r(3, 33, 42, 3, "#B88A5A"); P.r(3, 33, 42, 1, "#D9AA70");
      for (var t = 0; t < 4; t++) fanousBig(P, 6 + t * 10, 22 + 0, GLASS[(t + 3) % GLASS.length]);
      P.r(3, 36, 42, 8, "#C8443A");
      for (var k = 3; k < 45; k += 6) { P.r(k, 37, 6, 6, (k / 6 | 0) % 2 ? "#2F5D9A" : "#C8443A"); P.el(k + 1, 38, 4, 4, "#F2C14A"); P.p(k + 2, 39, "#F4EFE4"); }
      P.r(3, 36, 42, 1, "#F2C14A"); P.r(3, 43, 42, 1, "#8C2E28");
      for (var f = 4; f < 44; f += 3) P.p(f, 44, "#F2C14A"); // fringe
      P.r(5, 45, 2, 2, WOOD[3]); P.r(41, 45, 2, 2, WOOD[3]);
      P.dots(5, 33, 38, 2, ["#9A7048"], 6, R);
    }, [0, 44, 48, 6, 0.3]);
    c.lights = lights;
    return c;
  };

  /* ---------------- the fruit stall: oranges, bananas, guavas ---------------- */
  PROPS.fruitStall = function (o) {
    return sprite(44, 40, function (P) {
      var R = rng(o.seed || 12);
      // an awning on two poles
      P.r(2, 6, 1, 30, "#5A4030"); P.r(41, 6, 1, 30, "#5A4030");
      P.r(0, 2, 44, 6, "#3F8F5F"); for (var i = 0; i < 44; i += 6) P.r(i, 2, 3, 6, "#F4EFE4");
      P.r(0, 2, 44, 1, "#FFFFFF"); for (i = 0; i < 44; i += 3) P.p(i + 1, 8, i % 6 ? "#3F8F5F" : "#F4EFE4");
      // bananas hanging from the bar
      [[6, "#F2D04A"], [34, "#E8C23A"]].forEach(function (b) { P.r(b[0] + 2, 9, 1, 2, "#6A5A30"); P.el(b[0], 11, 6, 7, b[1]); P.p(b[0] + 1, 12, "#FFF0A0"); P.r(b[0] + 1, 17, 4, 1, dk(b[1], 0.3)); });
      // the table, tilted crates of fruit
      P.r(3, 26, 38, 3, "#B98A55"); P.r(3, 26, 38, 1, "#D9AA70"); P.r(5, 29, 2, 8, "#7A5A3A"); P.r(37, 29, 2, 8, "#7A5A3A");
      [[4, "#F08A2A"], [14, "#8CC04A"], [24, "#D8363A"], [33, "#F08A2A"]].forEach(function (cr, j) {
        var x = cr[0], y = 18 + (j % 2);
        P.r(x, y + 3, 9, 5, "#C9A46A"); P.r(x, y + 3, 9, 1, "#E2C38C"); P.r(x, y + 6, 9, 1, "#9C7A48");
        for (var n = 0; n < 7; n++) { var fx = x + ((R() * 7) | 0), fy = y + ((R() * 4) | 0); P.el(fx, fy, 3, 3, cr[1]); P.p(fx, fy, lt(cr[1], 0.45)); }
      });
      // a hand scale on the corner
      P.r(19, 13, 1, 5, "#6A6E74"); P.r(15, 13, 9, 1, "#6A6E74"); P.el(14, 16, 4, 2, "#C9CDD3"); P.el(21, 16, 4, 2, "#C9CDD3");
      // the price card
      P.r(26, 30, 8, 5, "#F8F4E8"); P.r(27, 31, 6, 1, "#C8302C"); P.r(27, 33, 4, 1, "#3A3A4A");
    }, [0, 34, 44, 6, 0.3]);
  };

  /* ---------------- dates, qamar el-din and nuts: the Ramadan stall ---------------- */
  PROPS.datesStall = function (o) {
    return sprite(44, 42, function (P) {
      var R = rng(o.seed || 19);
      // a bar with sheets of qamar el-din hanging, glowing orange
      P.r(1, 4, 1, 34, "#5A4030"); P.r(42, 4, 1, 34, "#5A4030"); P.r(0, 3, 44, 2, WOOD[0]); P.r(0, 3, 44, 1, WOOD[1]);
      for (var s = 4; s < 40; s += 8) { P.r(s, 5, 6, 10, "#F09A3A"); P.r(s, 5, 6, 1, "#FFC46A"); P.r(s + 1, 7, 1, 7, "#FFB04A"); P.r(s + 4, 6, 1, 8, "#D8782A"); P.r(s, 14, 6, 1, "#C86A20"); }
      // the table
      P.r(2, 28, 40, 3, "#B98A55"); P.r(2, 28, 40, 1, "#D9AA70"); P.r(4, 31, 2, 8, "#7A5A3A"); P.r(38, 31, 2, 8, "#7A5A3A");
      P.r(2, 31, 40, 5, "#3F8F5F"); P.r(2, 31, 40, 1, "#5FAE7A"); for (var k = 4; k < 42; k += 5) P.p(k, 33, "#F2C14A");
      // a pyramid of dates
      for (var row = 0; row < 5; row++) for (var dx = 0; dx < 10 - row * 2; dx++) { var x = 5 + row + dx, y = 26 - row * 2; P.r(x, y, 1, 2, (dx + row) % 3 ? "#6A3420" : "#8A4A2A"); if ((dx + row) % 4 === 0) P.p(x, y, "#B86A3A"); }
      // bowls of nuts, raisins, apricots
      [[19, "#C9A46A", "#E8C88A"], [26, "#6A3A4A", "#8A5A6A"], [33, "#F2A040", "#FFC870"]].forEach(function (b) {
        P.el(b[0], 23, 7, 5, "#E8E2D6"); P.el(b[0] + 1, 22, 5, 3, b[1]); P.dots(b[0] + 1, 22, 5, 3, [b[2]], 4, R); P.r(b[0] + 1, 27, 5, 1, "#B9B2A6");
      });
      // a hand-written card
      P.r(30, 17, 9, 5, "#F8F4E8"); P.r(31, 18, 7, 1, "#C8302C"); P.r(31, 20, 5, 1, "#3A3A4A");
    }, [0, 36, 44, 6, 0.3]);
  };

  /* ---------------- spice sacks (عطارة) ---------------- */
  PROPS.spices = function () {
    return sprite(32, 16, function (P) {
      [["#C8402A", 1], ["#E8B020", 9], ["#6A8A3A", 17], ["#8A5A30", 25]].forEach(function (s, i) {
        var x = s[1];
        P.el(x, 4, 7, 11, "#D8CBB0"); P.el(x + 1, 5, 3, 6, "#EDE3CC"); P.r(x, 4, 7, 2, "#C9BBA0");
        P.el(x + 1, 1 + (i % 2), 5, 5, s[0]); P.p(x + 2, 2 + (i % 2), lt(s[0], 0.4)); P.p(x + 3, 0 + (i % 2), s[0]);
      });
    }, [0, 12, 32, 4, 0.25]);
  };

  /* ---------------- sweets: qatayef on the griddle, konafa in the tray ---------------- */
  PROPS.qatayefStall = function () {
    return sprite(40, 30, function (P) {
      var R = rng(23);
      P.r(2, 14, 36, 3, "#E8E2D6"); P.r(2, 14, 36, 1, "#FFFFFF"); P.r(2, 17, 36, 6, "#C8443A"); for (var k = 3; k < 38; k += 4) P.p(k, 19, "#F2C14A");
      P.r(4, 23, 2, 5, "#7A5A3A"); P.r(34, 23, 2, 5, "#7A5A3A");
      // the round griddle with pancakes
      P.r(4, 11, 14, 3, "#4A4448"); P.el(4, 8, 14, 5, "#2A2428"); [[6, 9], [11, 9], [8, 10]].forEach(function (q) { P.el(q[0], q[1], 4, 2, "#E8C88A"); P.p(q[0] + 1, q[1], "#F6E0B0"); });
      // a big tray of konafa
      P.el(20, 9, 16, 6, "#B8B2AA"); P.el(21, 9, 14, 4, "#E8A040"); P.dots(22, 9, 12, 4, ["#F6C870", "#C87A2A"], 14, R); P.p(27, 10, "#6AB04A"); P.p(30, 11, "#6AB04A");
      // a stack of finished qatayef and a syrup jar
      for (var s = 0; s < 4; s++) P.el(13, 10 - s, 6, 2, s % 2 ? "#E8C88A" : "#D8B070");
      P.r(35, 6, 4, 8, "#E8D08A"); P.r(35, 5, 4, 1, "#8A6A3A"); P.p(36, 8, "#FFF0C0");
    }, [0, 25, 40, 5, 0.28]);
  };

  /* ---------------- Ramadan drinks: karkadeh, tamarind and sobia in big glass jars ---------------- */
  PROPS.drinkCart = function () {
    return sprite(34, 36, function (P) {
      // a little green cart with a striped top
      P.r(2, 22, 30, 8, "#2F7A5A"); P.r(2, 22, 30, 1, "#4FAE78"); P.r(2, 29, 30, 1, "#1F5A40");
      P.r(2, 25, 30, 2, "#F2C14A"); for (var i = 4; i < 32; i += 6) P.p(i, 25, "#D2413A");
      P.el(4, 28, 7, 7, "#3A2A26"); P.el(6, 30, 3, 3, "#8A6A4A"); P.el(23, 28, 7, 7, "#3A2A26"); P.el(25, 30, 3, 3, "#8A6A4A");
      P.r(1, 20, 32, 2, "#C9C2B6"); P.r(1, 20, 32, 1, "#EDE8DE");
      P.r(3, 1, 1, 19, "#5A4030"); P.r(30, 1, 1, 19, "#5A4030");
      P.r(1, 0, 32, 3, "#E8503F"); for (var s = 1; s < 33; s += 4) P.r(s, 0, 2, 3, "#F4EFE4");
      // the jars, with ice and a ladle
      [[6, "#B8233A", "#E86A7A"], [14, "#6A3A1E", "#A86A3A"], [22, "#F2EAD8", "#FFFFFF"]].forEach(function (j) {
        P.r(j[0], 9, 7, 11, j[1]); P.r(j[0], 8, 7, 1, "#D8E6EE"); P.r(j[0] + 1, 10, 1, 8, j[2]); P.p(j[0] + 4, 11, "#F8FCFF"); P.r(j[0], 19, 7, 1, dk(j[1], 0.3));
        P.r(j[0] + 1, 7, 5, 1, "#C9CDD3");
      });
      P.r(12, 4, 1, 5, "#C8963E"); // a brass ladle hanging
      for (var c = 0; c < 4; c++) P.r(30 - c * 3, 17, 2, 3, "#E8F2F6"); // glasses
    }, [1, 31, 32, 5, 0.28]);
  };

  /* ---------------- an old car nobody has driven in years ---------------- */
  PROPS.oldCar = function () {
    return sprite(58, 30, function (P) {
      var R = rng(128), body = "#6E8EA8", bS = dk(body, 0.25), bL = lt(body, 0.2);
      P.r(4, 14, 50, 10, body); P.r(4, 14, 50, 1, bL); P.r(4, 22, 50, 2, bS);
      P.r(14, 5, 28, 10, body); P.r(14, 5, 28, 1, bL); P.r(16, 6, 11, 7, "#8AA8B8"); P.r(29, 6, 11, 7, "#8AA8B8"); P.line(18, 7, 24, 12, "#C8DCE4"); P.line(32, 12, 37, 7, "#5A7080");
      P.r(12, 12, 3, 3, body); P.r(41, 12, 3, 3, body);
      P.r(2, 18, 4, 3, "#C9CDD3"); P.r(52, 18, 4, 3, "#C9CDD3"); P.p(3, 16, "#F2E6A0"); P.p(54, 16, "#C8443A");
      P.dots(4, 5, 50, 19, ["#B8723A", "#9A5A30", "#C9844A", "#8A7A68"], 70, R); // rust and dust
      P.el(7, 21, 11, 8, "#2A2428"); P.el(10, 24, 5, 3, "#5A5054"); P.el(40, 21, 11, 8, "#2A2428"); P.el(43, 24, 5, 3, "#5A5054");
      P.r(6, 27, 13, 2, "#2A2428"); P.r(39, 27, 13, 2, "#2A2428"); // flat tyres
      for (var g = 0; g < 12; g++) { var gx = 2 + ((R() * 54) | 0); P.p(gx, 28, LEAF[0]); P.p(gx, 27, LEAF[1]); }
    }, [0, 24, 58, 6, 0.3]);
  };

  /* ---------------- a low stone wall, with an optional gate ---------------- */
  PROPS.lowWall = function (o) {
    var w = o.w || 40, h = o.h || 16, st = o.c || "#D6BE98";
    return sprite(w, h + 4, function (P) {
      var R = rng(w * 7 + h);
      P.r(0, 3, w, h, st);
      for (var y = 3; y < h + 3; y += 4) {
        var off = ((y / 4) | 0) % 2 ? 5 : 0;
        for (var x = -off; x < w; x += 10) {
          var bx = Math.max(0, x), bw = Math.min(w, x + 9) - bx;
          if (bw <= 0) continue;
          var c = mix(st, pick(R, ["#E6D0AA", "#C8AE88", "#DCC49E", "#D0B890"]), 0.5);
          P.r(bx, y, bw, 3, c); P.r(bx, y, bw, 1, lt(c, 0.25)); P.r(bx, y + 3, bw, 1, dk(st, 0.22));
        }
      }
      P.r(0, 0, w, 3, lt(st, 0.18)); P.r(0, 0, w, 1, lt(st, 0.45)); P.r(0, 3, w, 1, dk(st, 0.3));
      if (o.weeds) for (var g = 0; g < w; g += 5 + ((R() * 6) | 0)) { P.p(g, h + 2, LEAF[0]); P.p(g + 1, h + 1, LEAF[1]); P.p(g + 2, h + 2, LEAF[2]); }
      if (o.pots) for (var p = 4; p < w - 6; p += 14) { P.r(p, -0, 5, 3, "#C9683E"); P.el(p - 1, -4, 7, 5, LEAF[(p / 14 | 0) % 2]); P.p(p + 1, -3, "#E8503F"); }
    });
  };

  /* ---------------- an iron garden gate, chained shut or swung open ---------------- */
  PROPS.gate = function (o) {
    return sprite(24, 28, function (P) {
      P.r(0, 2, 3, 24, "#D6BE98"); P.r(0, 2, 3, 1, "#F0DCB8"); P.r(21, 2, 3, 24, "#C2AA84"); P.r(21, 2, 3, 1, "#E0CCA8");
      P.r(0, 0, 3, 2, "#E8D4B0"); P.r(21, 0, 3, 2, "#E8D4B0");
      if (!o.open) {
        P.r(3, 5, 18, 1, "#2E3A3A"); P.r(3, 24, 18, 1, "#2E3A3A");
        for (var x = 4; x < 21; x += 3) { P.r(x, 5, 1, 20, "#2E3A3A"); P.p(x, 4, "#4A5A5A"); }
        P.line(4, 8, 20, 22, "#3A4646");
        P.r(9, 13, 6, 1, "#8A8E94"); P.r(10, 14, 4, 1, "#6A6E74"); P.r(11, 15, 2, 3, "#C8963E"); P.p(11, 15, "#F2C76C"); // chain and padlock
        P.r(6, 7, 12, 5, "#E8E0CC"); P.r(7, 8, 10, 1, "#B8342C"); P.r(7, 10, 7, 1, "#5A5A6A"); // a faded sign
      } else {
        for (var y = 5; y < 25; y += 3) P.p(2 + ((y / 3) % 2), y, "#2E3A3A");
        P.r(3, 5, 4, 20, "rgba(0,0,0,0)");
        P.line(3, 5, 7, 7, "#2E3A3A"); P.line(3, 24, 7, 23, "#2E3A3A"); P.r(7, 7, 1, 16, "#2E3A3A"); P.r(5, 6, 1, 18, "#2E3A3A");
        P.line(21, 5, 17, 7, "#2E3A3A"); P.line(21, 24, 17, 23, "#2E3A3A"); P.r(17, 7, 1, 16, "#2E3A3A"); P.r(19, 6, 1, 18, "#2E3A3A");
      }
    }, [0, 23, 24, 5, 0.22]);
  };

  /* ---------------- a stone arch over a passage (sorted like a building, open in the middle) ---------------- */
  PROPS.arch = function (o) {
    var w = o.w || 40, h = o.h || 54, ow = o.open || 22, st = o.c || "#E2CCA4";
    var c = cv(w, h), P = Pt(c), R = rng(w + h), x0 = (w - ow) >> 1;
    // the wall around the opening
    P.r(0, 6, w, h - 6, st);
    for (var y = 8; y < h; y += 5) for (var x = ((y / 5) | 0) % 2 ? -4 : 0; x < w; x += 9) { var bx = Math.max(0, x), bw = Math.min(w, x + 8) - bx; if (bw > 0) { var cc = mix(st, pick(R, ["#EED8B0", "#D4BC92", "#E6CEA6"]), 0.5); P.r(bx, y, bw, 4, cc); P.r(bx, y, bw, 1, lt(cc, 0.3)); } }
    // ablaq voussoirs
    var top = h - 34, rad = ow / 2 + 4;
    for (var a = 0; a <= 12; a++) {
      var t = Math.PI - a / 12 * Math.PI, vx = Math.round(w / 2 + Math.cos(t) * rad - 2), vy = Math.round(top + 14 - Math.sin(t) * rad * 0.8);
      P.r(vx, vy, 4, 4, a % 2 ? "#C2553A" : "#F2E4C4");
    }
    P.r(0, 2, w, 5, lt(st, 0.2)); P.r(0, 2, w, 1, lt(st, 0.5)); for (var m = 1; m < w; m += 6) { P.r(m, 0, 4, 2, lt(st, 0.2)); }
    P.r(w - 3, 6, 3, h - 6, dk(st, 0.18));
    // cut the opening out: a round top and straight sides down to the street
    var g = c.getContext("2d");
    for (var yy = top + 6; yy < h; yy++) {
      var dy = (top + 14 - yy) / (ow / 2 * 0.8), half = yy < top + 14 ? Math.sqrt(Math.max(0, 1 - dy * dy)) * ow / 2 : ow / 2;
      var xa = Math.round(w / 2 - half), xb = Math.round(w / 2 + half);
      if (xb > xa) g.clearRect(xa, yy, xb - xa, 1);
    }
    // a lantern hangs in the arch
    P.r((w >> 1), top + 7, 1, 4, "#4A3A30"); fanous(P, (w >> 1) - 2, top + 11, GLASS[3]);
    outline(c, 0.5);
    c.lights = [[w >> 1, top + 15, [255, 210, 130], 26]];
    c.open = [x0, ow];
    return c;
  };

  /* ---------------- the kids' mural wall ---------------- */
  PROPS.mural = function (o) {
    var w = o.w || 80, h = 34;
    return sprite(w, h, function (P) {
      var R = rng(w + 3);
      P.r(0, 2, w, h - 2, "#E8D6B4"); P.r(0, 2, w, 2, "#F4E6C8"); P.r(0, 4, w, 1, "#C9B08A");
      // the painted panel: a night sky, a big crescent, lanterns, kids
      P.r(4, 6, w - 8, h - 10, "#2C3A7A");
      for (var y = 6; y < h - 4; y++) P.r(4, y, w - 8, 1, mix("#2C3A7A", "#6A4A8A", (y - 6) / (h - 10)));
      P.dots(5, 7, w - 10, 12, ["#FFF2C0", "#C9CDF0"], 26, R);
      P.el(10, 8, 12, 12, "#FFE08A"); P.el(13, 7, 11, 11, mix("#2C3A7A", "#6A4A8A", 0.1)); // crescent
      [[30, "#E8503F"], [44, "#4CBF73"], [58, "#4F97E8"]].forEach(function (l, i) { if (l[0] + 8 > w - 6) return; P.r(l[0] + 3, 6, 1, 3 + i * 2, "#C9A46A"); fanousBig(P, l[0], 9 + i * 2, l[1]); });
      // two kids holding lanterns, a skyline of domes
      P.r(4, h - 9, w - 8, 5, "#1E2656"); P.el(w - 30, h - 15, 12, 12, "#1E2656"); P.r(w - 25, h - 21, 2, 6, "#1E2656");
      [[w - 46, "#E8503F"], [w - 16, "#F2C14A"]].forEach(function (k) { if (k[0] < 6) return; P.el(k[0], h - 16, 5, 5, "#E8B08A"); P.r(k[0], h - 12, 5, 6, k[1]); P.r(k[0] + 5, h - 12, 1, 3, "#E8B08A"); P.p(k[0] + 6, h - 10, "#FFD25A"); });
      // a painted border
      P.r(3, 5, w - 6, 1, "#F2C14A"); P.r(3, h - 4, w - 6, 1, "#F2C14A"); P.r(3, 5, 1, h - 8, "#F2C14A"); P.r(w - 4, 5, 1, h - 8, "#F2C14A");
      P.r(0, h - 3, w, 3, "#C9B08A");
      // chipped paint
      P.dots(0, 2, w, h - 2, ["#D8C29C", "#B89A74"], w / 3 | 0, R);
    });
  };

  /* ---------------- goals of stones, an old tyre ---------------- */
  PROPS.stones = function () {
    return sprite(10, 8, function (P) { P.el(0, 2, 6, 5, "#A8A098"); P.el(1, 2, 3, 2, "#C8C0B6"); P.el(4, 0, 5, 5, "#C2553A"); P.r(5, 0, 3, 1, "#E07A58"); }, [0, 5, 10, 3, 0.2]);
  };
  PROPS.tyre = function () {
    return sprite(14, 9, function (P) { P.el(0, 1, 14, 7, "#2A2428"); P.el(3, 3, 8, 3, "#5A5054"); P.el(4, 3, 6, 2, "#8A7A60"); P.r(2, 2, 3, 1, "#4A4448"); }, [0, 6, 14, 3, 0.2]);
  };

  /* ---------------- Saber's workbench and his wooden lanterns ---------------- */
  PROPS.workbench = function () {
    return sprite(34, 22, function (P) {
      var R = rng(29);
      P.r(2, 10, 30, 4, WOOD[0]); P.r(2, 10, 30, 1, WOOD[1]); P.r(2, 13, 30, 1, WOOD[3]);
      P.r(4, 14, 2, 7, WOOD[2]); P.r(28, 14, 2, 7, WOOD[3]); P.r(4, 18, 26, 1, WOOD[2]);
      P.r(26, 6, 6, 4, "#6A6E74"); P.r(27, 5, 4, 1, "#9AA0A8"); P.r(30, 7, 3, 1, "#3A3434"); // the vice
      P.r(6, 8, 10, 2, "#C08A5A"); P.r(6, 8, 10, 1, "#D9A774"); // a plank in work
      P.r(17, 8, 7, 2, "#9AA0A8"); P.r(17, 8, 2, 2, "#7A4A31"); // a plane
      P.r(9, 6, 1, 2, "#5A4030"); P.r(8, 5, 3, 1, "#6A6E74"); // a hammer
      P.dots(3, 14, 28, 6, ["#E8CC98", "#D9B47A", "#F2DEB0"], 18, R); // shavings
      P.el(10, 19, 14, 3, "#E8CC98");
    }, [0, 18, 34, 4, 0.28]);
  };
  PROPS.woodLanterns = function (o) {
    var n = o.n || 4, w = n * 9 + 4, lights = [];
    var c = sprite(w, 22, function (P) {
      P.r(0, 1, w, 1, "#4A3A30");
      for (var i = 0; i < n; i++) {
        var x = 3 + i * 9, y = 3 + (i % 2) * 4, col = GLASS[(i * 3 + 1) % GLASS.length];
        P.r(x + 2, 2, 1, y - 2, "#4A3A30"); fanousWood(P, x, y, col);
        lights.push([x + 2, y + 3, A.rgb(col), 14]);
      }
    });
    c.lights = lights;
    return c;
  };

  /* ---------------- the garden lot, in its stages ---------------- */
  PROPS.rubble = function (o) {
    return sprite(40, 18, function (P) {
      var R = rng(o.seed || 33);
      P.el(2, 6, 34, 11, "#9A8A74");
      for (var i = 0; i < 16; i++) { var x = 4 + ((R() * 28) | 0), y = 4 + ((R() * 9) | 0); P.r(x, y, 4, 3, pick(R, ["#C2553A", "#A84A34", "#B8AC98", "#8A8478"])); P.p(x, y, "#E07A58"); }
      P.r(26, 2, 2, 9, "#6A5A4A"); P.r(24, 4, 8, 1, "#6A5A4A"); // a broken chair
      P.el(6, 1, 9, 6, "#2A2428"); P.el(8, 3, 5, 2, "#6A6064"); // a tyre
      for (var g = 0; g < 10; g++) { var gx = (R() * 38) | 0; P.p(gx, 15, LEAF[0]); P.p(gx, 14, LEAF[1]); P.p(gx + 1, 13, LEAF[3]); }
    }, [0, 13, 40, 5, 0.25]);
  };
  PROPS.gardenBed = function (o) {
    var st = o.stage || 0, w = o.w || 36;
    return sprite(w, 16, function (P) {
      var R = rng(w + st * 13);
      P.r(0, 8, w, 7, "#7A5A3A"); P.r(0, 8, w, 1, "#9A7A54"); P.dots(0, 9, w, 6, ["#6A4A2E", "#8A6A44"], w, R);
      P.r(0, 14, w, 2, "#B8A27C"); P.r(0, 14, w, 1, "#D8C29C"); // a brick edge
      for (var x = 3; x < w - 2; x += 5) {
        if (st === 0) { P.p(x, 9, LEAF[1]); P.p(x + 1, 8, LEAF[3]); continue; }
        if (st === 1) { P.r(x, 6, 1, 3, LEAF[2]); P.p(x - 1, 6, LEAF[1]); P.p(x + 1, 5, LEAF[3]); P.p(x + 1, 7, LEAF[0]); continue; }
        P.el(x - 2, 1, 6, 7, LEAF[(x / 5 | 0) % 2]); P.p(x, 2, LEAF[3]);
        P.p(x - 1, 2, pick(R, ["#E8503F", "#F2C14A", "#E86AA0", "#FFFFFF", "#B86BE0"])); P.p(x + 2, 4, pick(R, ["#E8503F", "#F2C14A", "#E86AA0"]));
      }
    }, [0, 12, w, 4, 0.2]);
  };
  // the lot's ground once the neighbours clear it: raked soil and stepping stones, later a lawn with borders
  PROPS.gardenGround = function (o) {
    var w = o.w || 184, h = o.h || 88, st = o.stage || 1, c = cv(w, h), P = Pt(c), R = rng(91 + st);
    if (st === 1) {
      P.r(0, 0, w, h, "#9A7652");
      for (var y = 2; y < h; y += 3) P.r(0, y, w, 1, "#8A6846");
      P.dots(0, 0, w, h, ["#AA845C", "#7E5E40", "#B08A60"], (w * h / 4) | 0, R);
    } else {
      P.r(0, 0, w, h, "#7DA851");
      P.dots(0, 0, w, h, ["#6E9A46", "#8CB85C", "#5E8A3C", "#9CC86A"], (w * h / 2) | 0, R);
      for (var t = 0; t < w * h / 60; t++) { var tx = (R() * w) | 0, ty = (R() * h) | 0; P.p(tx, ty, pick(R, ["#F2C14A", "#FFFFFF", "#E86AA0", "#B86BE0"])); }
      P.r(0, 0, w, 2, "#5E8A3C");
    }
    // a path of stepping stones from the gate
    for (var s = 0; s < 6; s++) { var sx = 60 + Math.round(Math.sin(s * 0.9) * 6), sy = 4 + s * 14; P.el(sx, sy, 12, 6, "#D8CCB4"); P.el(sx + 1, sy, 10, 3, "#E8DECA"); P.r(sx + 2, sy + 5, 8, 1, "#A89A80"); }
    return c;
  };

  PROPS.sapling = function (o) {
    var big = o.big;
    return sprite(18, big ? 30 : 18, function (P, w, h) {
      P.r(8, h - 10, 2, 9, "#7A5236"); P.r(5, h - 3, 8, 2, "#7A5A3A");
      if (big) { P.el(1, 0, 16, 16, LEAF[2]); P.el(2, 1, 13, 12, LEAF[0]); P.el(4, 2, 7, 6, LEAF[1]); P.p(6, 3, LEAF[3]); P.p(10, 6, "#E86AA0"); P.p(5, 9, "#E86AA0"); }
      else { P.el(4, 1, 10, 8, LEAF[0]); P.el(5, 2, 5, 4, LEAF[1]); P.p(7, 3, LEAF[3]); }
    }, [3, (big ? 30 : 18) - 4, 12, 4, 0.22]);
  };

  /* ---------------- Eid: swings and a balloon seller ---------------- */
  PROPS.swing = function (o) {
    var sw = o.sway || 0;
    return sprite(40, 40, function (P) {
      // an A-frame painted in fair colours
      P.line(2, 38, 10, 2, "#D23B33"); P.line(3, 38, 11, 2, "#D23B33"); P.line(30, 38, 38, 2, "#3E78C2"); P.line(31, 38, 37, 2, "#3E78C2");
      P.r(8, 1, 26, 3, "#F2C14A"); P.r(8, 1, 26, 1, "#FFE08A");
      for (var i = 9; i < 34; i += 4) P.p(i, 4, ["#E8503F", "#4CBF73", "#4F97E8"][(i / 4 | 0) % 3]);
      // two seats on ropes
      [[13, "#4CBF73"], [25, "#E86AA0"]].forEach(function (s, k) {
        var dx = (k ? -sw : sw);
        P.line(s[0], 4, s[0] + dx, 26, "#6A5A4A"); P.line(s[0] + 5, 4, s[0] + 5 + dx, 26, "#6A5A4A");
        P.r(s[0] - 1 + dx, 26, 8, 3, s[1]); P.r(s[0] - 1 + dx, 26, 8, 1, lt(s[1], 0.35));
      });
    }, [2, 35, 36, 5, 0.25]);
  };
  PROPS.balloons = function (o) {
    var sw = o.sway || 0;
    return sprite(24, 44, function (P) {
      P.r(11, 18, 2, 24, "#7A5236");
      [[2, 4, "#E8503F"], [9, 0, "#F2C14A"], [16, 4, "#4F97E8"], [5, 10, "#4CBF73"], [13, 9, "#E86AA0"]].forEach(function (b) {
        var x = b[0] + sw;
        P.line(12, 18, x + 3, b[1] + 7, "#E8E2D6");
        P.el(x, b[1], 7, 8, b[2]); P.p(x + 2, b[1] + 1, lt(b[2], 0.6)); P.p(x + 3, b[1] + 8, dk(b[2], 0.3));
      });
    }, [6, 40, 12, 4, 0.22]);
  };

  /* ---------------- small things for doorsteps and cafés ---------------- */
  PROPS.mastaba = function (o) { // a stone bench by a door
    var w = o.w || 24;
    return sprite(w, 10, function (P) {
      P.r(0, 1, w, 4, "#DCC8A4"); P.r(0, 1, w, 1, "#F0E2C4"); P.r(0, 5, w, 4, "#C2AA84"); P.r(0, 8, w, 1, "#A08A68");
      if (o.rug) { P.r(3, 1, w - 6, 3, "#B8343A"); P.r(5, 2, w - 10, 1, "#F2C14A"); }
    }, [0, 6, w, 4, 0.2]);
  };
  PROPS.plantPots = function (o) { // a cluster of pots: aloe, basil, a geranium, a rubber plant
    var R0 = rng(o.seed || 5), n = o.n || 3, w = n * 8 + 4;
    return sprite(w, 22, function (P) {
      var R = rng(o.seed || 5);
      for (var i = 0; i < n; i++) {
        var x = 1 + i * 8, kind = pick(R, ["aloe", "basil", "geranium", "rubber", "jasmine"]), pot = pick(R, ["#C9683E", "#B8563A", "#E8E2D6", "#3E78C2"]);
        var py = 15 + (i % 2);
        P.r(x + 1, py, 6, 5, pot); P.r(x, py - 1, 8, 2, lt(pot, 0.15)); P.r(x + 5, py, 2, 5, dk(pot, 0.2));
        if (kind === "aloe") for (var a = 0; a < 5; a++) P.line(x + 4, py - 1, x + 1 + a * 1.5 | 0, py - 7 - (a % 2) * 2, a % 2 ? LEAF[0] : "#7AA86A");
        else if (kind === "rubber") { P.r(x + 3, py - 10, 1, 9, "#5A4030"); P.el(x, py - 12, 5, 5, LEAF[2]); P.el(x + 4, py - 9, 5, 5, LEAF[4]); P.el(x + 1, py - 6, 5, 4, LEAF[2]); P.p(x + 2, py - 11, LEAF[0]); }
        else { P.el(x, py - 7, 8, 7, LEAF[kind === "basil" ? 1 : 0]); P.p(x + 2, py - 6, LEAF[3]); P.p(x + 5, py - 4, LEAF[2]);
          if (kind === "geranium") { P.p(x + 2, py - 7, "#E8503F"); P.p(x + 5, py - 6, "#E8503F"); P.p(x + 3, py - 5, "#FF8A80"); }
          if (kind === "jasmine") { P.p(x + 1, py - 6, "#FFFFFF"); P.p(x + 5, py - 7, "#FFFFFF"); P.p(x + 4, py - 3, "#FFFFFF"); } }
      }
    }, [0, 18, w, 4, 0.22]);
  };
  PROPS.breadCage = function (o) { // a palm-rib tray of bread cooling on the ground
    return sprite(24, 10, function (P) {
      var R = rng(o.seed || 3);
      P.r(1, 4, 22, 4, "#C9A46A"); P.r(1, 4, 22, 1, "#E2C38C"); for (var i = 2; i < 23; i += 3) P.r(i, 5, 1, 3, "#9C7A48");
      for (var b = 2; b < 20; b += 5) A.loaf(P, b, 2 + ((b / 5) % 2), R);
    }, [0, 6, 24, 4, 0.22]);
  };
  PROPS.kettle = function () { // a copper kettle on a little gas ring
    return sprite(12, 16, function (P) {
      P.r(2, 12, 8, 3, "#3A3434"); P.r(1, 14, 10, 1, "#2A2224"); P.p(3, 11, "#4F97E8"); P.p(6, 11, "#4F97E8"); P.p(8, 11, "#7AC0FF");
      P.el(2, 4, 8, 8, "#C8743A"); P.el(3, 5, 3, 4, "#F2A86A"); P.p(4, 5, "#FFE0B0"); P.r(5, 2, 2, 2, "#8A4A20");
      P.r(9, 6, 2, 1, "#C8743A"); P.p(10, 5, "#C8743A"); P.r(3, 1, 6, 1, "#5A3A2A"); P.p(2, 2, "#5A3A2A"); P.p(9, 2, "#5A3A2A");
    }, [1, 13, 10, 3, 0.2]);
  };
  PROPS.radio = function () {
    return sprite(10, 8, function (P) { P.r(1, 2, 8, 5, "#8A5435"); P.r(1, 2, 8, 1, "#A86D47"); P.r(2, 3, 3, 3, "#3A3030"); P.p(3, 4, "#6A6060"); P.r(6, 3, 2, 1, "#F2C14A"); P.r(6, 5, 2, 1, "#E8E2D6"); P.r(8, 0, 1, 2, "#9AA0A8"); });
  };
  PROPS.donkeyCart = function () {
    return sprite(52, 30, function (P) {
      var R = rng(55);
      // the cart with watermelons and greens
      P.r(22, 12, 28, 8, "#B88A55"); P.r(22, 12, 28, 1, "#D9AA70"); P.r(22, 19, 28, 1, "#7A5A3A");
      for (var i = 0; i < 5; i++) { var x = 24 + i * 5; P.el(x, 6 + (i % 2), 7, 6, "#3F8F4A"); P.r(x + 1, 8 + (i % 2), 5, 1, "#2A6A34"); P.p(x + 2, 7 + (i % 2), "#7AC07A"); }
      P.el(28, 2, 8, 5, LEAF[1]); P.el(38, 3, 7, 4, LEAF[0]);
      P.el(26, 18, 10, 10, "#4A3328"); P.el(28, 20, 6, 6, "#8A6A4A"); P.p(31, 23, "#4A3328");
      P.r(10, 14, 14, 1, "#6A4A30"); // shafts
      // the donkey, grey, patient
      P.r(6, 12, 16, 7, "#8A8490"); P.r(6, 12, 16, 2, "#A8A2AE"); P.r(6, 18, 16, 1, "#6A6470");
      P.r(7, 19, 2, 8, "#6A6470"); P.r(11, 19, 2, 8, "#7A7480"); P.r(17, 19, 2, 8, "#6A6470"); P.r(20, 19, 2, 8, "#7A7480");
      P.r(1, 8, 7, 6, "#8A8490"); P.r(0, 11, 4, 4, "#A8A2AE"); P.p(1, 13, "#2A2224"); P.p(4, 9, "#2A2224");
      P.r(3, 3, 2, 6, "#8A8490"); P.r(6, 4, 2, 5, "#7A7480"); P.p(3, 4, "#C8B8C0");
      P.r(5, 9, 12, 2, "#C8443A"); P.p(9, 10, "#F2C14A"); P.p(13, 10, "#4F97E8"); // a bright harness
      P.r(21, 13, 2, 1, "#5A5056");
      P.dots(6, 12, 16, 6, ["#7A7480", "#9A94A0"], 10, R);
    }, [2, 26, 48, 5, 0.3]);
  };

  /* ---------------- the café's old sycamore: a trunk below, a canopy drawn over everything ---------------- */
  PROPS.bigTrunk = function () {
    return sprite(34, 52, function (P) {
      var R = rng(61);
      P.r(11, 0, 12, 46, "#7A5236");
      P.r(11, 0, 3, 46, "#9C7048"); P.r(19, 0, 4, 46, "#5E3E2A"); P.r(22, 2, 1, 44, "#4A3022");
      for (var y = 4; y < 44; y += 5) { P.r(13 + ((y / 5) % 2), y, 3, 1, "#5E3E2A"); P.r(17, y + 2, 2, 1, "#9C7048"); }
      // roots spreading into the ground
      P.r(5, 44, 24, 4, "#6A4630"); P.r(2, 47, 9, 3, "#6A4630"); P.r(23, 47, 10, 3, "#5E3E2A"); P.r(5, 44, 6, 1, "#8A6040"); P.p(1, 49, "#6A4630"); P.p(33, 49, "#5E3E2A");
      // a branch leaving the trunk, and an old name carved in it
      P.line(13, 6, 4, 0, "#7A5236"); P.line(13, 7, 5, 1, "#6A4630"); P.line(21, 4, 31, 0, "#6A4630");
      P.r(14, 24, 4, 1, "#C9A47A"); P.p(15, 26, "#C9A47A"); P.p(17, 26, "#C9A47A");
      P.dots(11, 0, 12, 46, ["#86603C", "#5E3E2A"], 30, R);
    }, [0, 46, 34, 6, 0.35]);
  };
  PROPS.bigCanopy = function (o) {
    var sw = o.sway || 0, w = o.w || 120, h = o.h || 74;
    return sprite(w, h, function (P) {
      var R = rng(73 + w);
      var blobs = [];
      for (var i = 0; i < 18; i++) {
        var a = i / 18 * Math.PI * 2, rx = w * 0.36, ry = h * 0.3;
        blobs.push([w / 2 + Math.cos(a) * rx * (0.7 + R() * 0.3) - 14, h / 2 + Math.sin(a) * ry * (0.7 + R() * 0.3) - 10, 26 + R() * 12, 20 + R() * 8]);
      }
      for (i = 0; i < 8; i++) blobs.push([w / 2 - 20 + R() * 30 - 15, h / 2 - 16 + R() * 22, 30 + R() * 10, 22 + R() * 8]);
      blobs.forEach(function (b) { P.el(Math.round(b[0] + sw), Math.round(b[1]), Math.round(b[2]), Math.round(b[3]), LEAF[4]); });
      blobs.forEach(function (b) { P.el(Math.round(b[0] + 1 + sw), Math.round(b[1]), Math.round(b[2] - 3), Math.round(b[3] - 5), LEAF[2]); });
      blobs.forEach(function (b, k) { if (k % 2) return; P.el(Math.round(b[0] + 3 + sw), Math.round(b[1] + 1), Math.round(b[2] - 9), Math.round(b[3] - 10), LEAF[0]); });
      blobs.forEach(function (b, k) { if (k % 3) return; P.el(Math.round(b[0] + 6 + sw), Math.round(b[1] + 2), Math.round(b[2] * 0.4), Math.round(b[3] * 0.3), LEAF[1]); });
      P.dots(4, 4, w - 8, h - 8, [LEAF[4], LEAF[2]], (w * h / 14) | 0, R);
      P.dots(10, 6, w - 20, h * 0.5, [LEAF[3], LEAF[1]], (w * h / 40) | 0, R);
      // sycamore figs here and there
      for (var f = 0; f < 14; f++) { var fx = 10 + ((R() * (w - 20)) | 0), fy = 10 + ((R() * (h - 22)) | 0); P.p(fx, fy, "#C9A84A"); }
      // clear the sides so the outline is leafy, not a box
      var g = P.g; g.clearRect(0, 0, 3, h); g.clearRect(w - 3, 0, 3, h); g.clearRect(0, 0, w, 2);
    });
  };

  // the old ficus by the kids' lot gets the same treatment, smaller
  PROPS.smallCanopy = function (o) { return PROPS.bigCanopy({ sway: o.sway, w: o.w || 70, h: o.h || 50 }); };
  PROPS.smallTrunk = function () {
    return sprite(20, 34, function (P) {
      P.r(7, 0, 7, 30, "#7A5236"); P.r(7, 0, 2, 30, "#9C7048"); P.r(12, 0, 2, 30, "#5E3E2A");
      P.r(3, 28, 14, 3, "#6A4630"); P.r(1, 30, 5, 2, "#6A4630"); P.r(15, 30, 5, 2, "#5E3E2A");
      P.line(8, 6, 2, 0, "#7A5236"); P.line(12, 5, 18, 0, "#6A4630");
    }, [0, 29, 20, 5, 0.3]);
  };
})();
