/* فوانيس الحارة · the places you can walk into (walk.html).
   Every room is painted in code like the hara itself: a back wall you face, a floor, furniture that sorts
   with the people, and things that change with the hour and the day: the oven burns, the TV flickers,
   the bakery board fills with paid-for bread, the mosque fills for taraweeh, the koshari shop is empty
   while people fast and packed at iftar.
   H.rooms.build(id, day) gives js/map.js a location. H.rooms.DOORS: which spot on the hara opens which room. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world;
  if (!A || !WD) return;
  var PR = A.PROPS, sprite = A.sprite, dk = A.dk, lt = A.lt, rng = A.rng, Pt = A.Pt, cv = A.cv;
  var WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS, SK = A.SKIN;
  var DAYS = WD.DAYS;

  /* ---------------- a few more neighbours, for the crowds indoors ---------------- */
  var MORE = {
    sobhy: { skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, top: { kind: "tee", c: "#F1EDE4" }, legs: "#4A4A5A", apron: "#E8DCC4", shoes: "#5A3A2C" },
    kworker: { skin: SK.deep, hair: { style: "curly", c: "#1F1619" }, top: { kind: "tee", c: "#C8443A" }, legs: "#3A3550", apron: "#F1EDE4" },
    m6: { skin: SK.mid, hair: { style: "short", c: "#2B1F26" }, top: { kind: "shirt", c: "#4F7FB0" }, legs: "#3A3A48", mus: "#2B1F26" },
    m7: { build: "fat", skin: SK.tan, hair: { style: "grey", c: "#9A948E" }, head: { kind: "taqiyah" }, top: { kind: "robe", c: "#DCD4C2" }, beard: "#D8D2C8" },
    m8: { build: "thin", skin: SK.fair, hair: { style: "short", c: "#5A3A28" }, top: { kind: "robe", c: "#8A6A9A" } },
    w5: { skin: SK.mid, head: { kind: "hijab", c: "#E0A040" }, top: { kind: "robe", c: "#6A4A8A" } },
    w6: { skin: SK.fair, head: { kind: "hijab", c: "#4FA0B0" }, top: { kind: "robe", c: "#B5473B" } },
    k5: { kid: true, skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, top: { kind: "tee", c: "#F2C14A" }, legs: "#3A3A48", shoes: "#F2F0EA" },
    k6: { kid: true, skin: SK.deep, head: { kind: "hijab", c: "#F2F0EA" }, top: { kind: "dress", c: "#E8503F" }, shoes: "#F2C14A" },
    zaki: { build: "thin", skin: SK.tan, hair: { style: "grey", c: "#9A948E" }, head: { kind: "taqiyah", c: "#F4F1E8" }, top: { kind: "robe", c: "#5E7A9A" }, apron: "#F1EDE4", mus: "#D8D2C8", shoes: "#4A3328" }
  };
  Object.keys(MORE).forEach(function (k) { if (!WD.CAST[k]) WD.CAST[k] = MORE[k]; });

  /* ---------------- painting helpers ---------------- */
  function plaster(P, x, y, w, h, c, R, n) { P.r(x, y, w, h, c); P.dots(x, y, w, h, [lt(c, 0.1), dk(c, 0.07), dk(c, 0.04)], n || ((w * h / 9) | 0), R); }
  function grid(P, x, y, w, h, c, line, sx, sy) {
    P.r(x, y, w, h, c);
    for (var i = x; i < x + w; i += sx) P.r(i, y, 1, h, line);
    for (var j = y; j < y + h; j += (sy || sx)) P.r(x, j, w, 1, line);
  }
  function checker(P, x, y, w, h, c1, c2, s) {
    for (var j = 0; j < h; j += s) for (var i = 0; i < w; i += s) P.r(x + i, y + j, Math.min(s, w - i), Math.min(s, h - j), ((i + j) / s) % 2 ? c2 : c1);
  }
  // the Ramadan tent cloth: red ground, blue diamonds, gold dots, green edges
  function khayamiya(P, x, y, w, h) {
    P.r(x, y, w, h, "#C8343A"); P.r(x, y, w, 1, "#1F7A54"); P.r(x, y + h - 1, w, 1, "#1F7A54");
    var cy = y + (h >> 1);
    for (var i = x + 1; i < x + w - 5; i += 8) {
      P.r(i + 2, cy - 2, 1, 5, "#2F5FB0"); P.r(i + 1, cy - 1, 3, 3, "#2F5FB0"); P.r(i, cy, 5, 1, "#2F5FB0"); P.p(i + 2, cy, "#F2C14A");
      P.p(i + 6, y + 1, "#F2C14A"); P.p(i + 6, y + h - 2, "#F2C14A"); P.p(i + 5, cy, "#F4EFE4");
    }
  }
  function frame(P, x, y, w, h, fr, inner) { P.r(x, y, w, h, fr); P.r(x, y, w, 1, lt(fr, 0.25)); P.r(x + 1, y + 1, w - 2, h - 2, inner); }
  function windowAt(P, x, y, w, h, o) {
    o = o || {};
    var fr = o.fr || "#6A4530", sky = o.sky || "#A9DAEE";
    P.r(x - 1, y - 1, w + 2, h + 3, dk(fr, 0.35));
    P.r(x, y, w, h, fr);
    P.r(x + 2, y + 2, w - 4, h - 4, sky);
    P.r(x + 2, y + 2, w - 4, 2, lt(sky, 0.35));
    if (o.view) { // the building across the street
      P.r(x + 2, y + h - 2 - (h >> 1), (w >> 1) - 1, h >> 1, o.view);
      P.r(x + 4, y + h - (h >> 1) + 1, 2, 3, dk(o.view, 0.3));
    }
    P.r(x + (w >> 1), y + 2, 1, h - 4, fr); P.r(x + 2, y + (h >> 1), w - 4, 1, fr);
    P.p(x + 3, y + 3, "#FFFFFF"); P.p(x + 4, y + 4, "rgba(255,255,255,0.6)");
    P.r(x - 2, y + h, w + 4, 2, "#E8DCC4"); P.r(x - 2, y + h + 2, w + 4, 1, "#A8987C");
    if (o.shutters) {
      [x - 6, x + w + 1].forEach(function (sx) {
        P.r(sx, y, 5, h, o.shutters);
        for (var j = y + 1; j < y + h - 1; j += 2) P.r(sx + 1, j, 3, 1, dk(o.shutters, 0.25));
      });
    }
  }
  function doorAt(P, x, y, w, h, c, o) {
    o = o || {};
    P.r(x - 2, y - 2, w + 4, h + 2, dk(c, 0.45));
    P.r(x, y, w, h, c);
    P.r(x + 2, y + 2, w - 4, (h >> 1) - 3, dk(c, 0.15)); P.r(x + 2, y + (h >> 1) + 1, w - 4, (h >> 1) - 3, dk(c, 0.15));
    P.r(x + 2, y + 2, w - 4, 1, lt(c, 0.2));
    if (o.glass) { P.r(x + 3, y + 3, w - 6, 8, "#8AB8C8"); P.r(x + 3, y + 3, w - 6, 1, "#C8E8F0"); }
    P.r(x + w - 4, y + (h >> 1), 2, 2, BRASS[1]);
  }
  // the room's shell: floor, back wall, the cut side and front walls, a door in the front
  function shell(W, HG, WALL, o) {
    var c = cv(W, HG), P = Pt(c), R = rng(W * 7 + HG + (o.seed || 0)), cx = W >> 1;
    P.r(0, 0, W, HG, "#140E18");
    o.floor(P, R);
    o.wall(P, R);
    P.r(0, WALL, W, 1, "rgba(40,20,40,0.38)"); P.r(0, WALL + 1, W, 3, "rgba(40,20,40,0.14)");
    P.r(6, WALL, 3, HG - WALL - 6, "rgba(40,20,40,0.12)"); P.r(W - 9, WALL, 3, HG - WALL - 6, "rgba(40,20,40,0.12)");
    var cap = o.cap || "#2A1C26", capL = lt(cap, 0.18);
    P.r(0, 0, W, 5, cap); P.r(0, 5, W, 1, capL);
    P.r(0, 0, 5, HG, cap); P.r(5, 5, 1, HG - 11, capL);
    P.r(W - 5, 0, 5, HG, cap); P.r(W - 6, 5, 1, HG - 11, capL);
    if (!o.noDoor) {
      P.r(0, HG - 6, cx - 12, 6, cap); P.r(cx + 12, HG - 6, W - cx - 12, 6, cap);
      P.r(5, HG - 7, cx - 17, 1, capL); P.r(cx + 12, HG - 7, W - cx - 17, 1, capL);
      P.r(cx - 12, HG - 6, 24, 6, "#8A7460"); P.r(cx - 12, HG - 6, 24, 1, "#B8A088"); P.r(cx - 12, HG - 2, 24, 2, "#F2D8A8");
      // a woven mat inside the door
      P.r(cx - 9, HG - 14, 18, 7, "#B5473B"); P.r(cx - 8, HG - 13, 16, 5, "#D9A25E");
      for (var i = cx - 7; i < cx + 8; i += 3) P.r(i, HG - 12, 1, 3, "#B5473B");
    } else { P.r(0, HG - 6, W, 6, cap); P.r(5, HG - 7, W - 10, 1, capL); }
    return { c: c, P: P, R: R, cx: cx };
  }
  function exitAt(W, HG, spot) { var cx = W >> 1; return { r: [cx - 12, HG - 16, 24, 16], to: "hara", spot: spot }; }

  /* ---------------- furniture ---------------- */
  PR.stove = function () { // a gas cooker with tonight's soup
    return sprite(22, 30, function (P) {
      P.r(5, 1, 12, 9, "#B8BEC8"); P.r(5, 1, 12, 1, "#E4E8EE"); P.r(14, 2, 2, 7, "#D8DCE4"); P.r(5, 8, 12, 2, "#8A909E");
      P.r(3, 3, 2, 2, "#6A707E"); P.r(17, 3, 2, 2, "#6A707E"); P.r(10, 0, 2, 1, "#6A707E");
      P.r(1, 10, 20, 3, "#3A3A44"); P.r(3, 11, 4, 1, "#E86A3A"); P.r(15, 11, 4, 1, "#5A5A66");
      P.r(1, 13, 20, 15, "#F2EEE6"); P.r(17, 13, 4, 15, "#D8D2C8"); P.r(1, 13, 20, 1, "#FFFFFF");
      for (var k = 0; k < 4; k++) P.r(3 + k * 4, 14, 2, 2, "#4A4A54");
      P.r(3, 17, 16, 9, "#C8C2B8"); P.r(4, 19, 14, 5, "#3A2E36"); P.r(5, 20, 4, 1, "#7A6A70"); P.r(4, 17, 14, 1, "#9A948A");
      P.r(2, 28, 3, 2, "#3A3A44"); P.r(17, 28, 3, 2, "#3A3A44");
    }, [0, 26, 22, 4, 0.25]);
  };
  PR.fridge = function () {
    return sprite(18, 38, function (P) {
      P.r(1, 1, 16, 35, "#EFE8DA"); P.r(13, 1, 4, 35, "#D6CDBE"); P.r(1, 1, 16, 1, "#FFFFFF");
      P.r(1, 12, 16, 1, "#B8AE9E"); P.r(3, 5, 1, 5, "#9A9082"); P.r(3, 15, 1, 8, "#9A9082");
      P.r(6, 16, 5, 6, "#F4F0E4"); P.r(7, 17, 3, 1, "#C8443A"); P.r(7, 19, 3, 1, "#8A8A9A"); // a Ramadan calendar
      P.p(9, 4, "#E8503F"); P.p(11, 6, "#4CBF73"); P.p(7, 8, "#F2C14A"); P.p(10, 26, "#4F97E8");
      P.r(2, 36, 3, 2, "#5A5A66"); P.r(13, 36, 3, 2, "#5A5A66");
    }, [0, 34, 18, 4, 0.25]);
  };
  PR.sinkUnit = function () {
    return sprite(28, 24, function (P) {
      P.r(1, 4, 26, 4, "#E6E0D8"); P.r(1, 4, 26, 1, "#FFFFFF"); P.r(5, 5, 12, 2, "#9AA4B0"); P.r(6, 5, 10, 1, "#C8D2DC");
      P.r(10, 0, 2, 5, "#A8B0BC"); P.r(10, 0, 5, 1, "#A8B0BC"); P.p(14, 1, "#88C8F0");
      P.r(20, 1, 3, 3, "#4CBF73"); P.p(21, 0, "#6EBE58"); // a glass of mint by the tap
      P.r(1, 8, 26, 14, "#B98A5A"); P.r(1, 8, 26, 1, "#8A5A3A"); P.r(14, 9, 1, 13, "#8A5A3A");
      P.r(3, 10, 9, 10, "#C99A68"); P.r(16, 10, 9, 10, "#C99A68"); P.r(11, 14, 1, 2, BRASS[1]); P.r(16, 14, 1, 2, BRASS[1]);
      P.r(1, 22, 26, 1, "#6A4530");
    }, [0, 20, 28, 4, 0.25]);
  };
  PR.sofa = function (o) { // the kanaba: wooden arms, a long cushion, pillows against the wall
    var w = o.w || 56;
    return sprite(w, 26, function (P) {
      var cl = ["#C8343A", "#2F5FB0", "#F2C14A", "#1F7A54"];
      P.r(2, 3, w - 4, 10, "#8A3A3A");
      for (var i = 0; i < Math.floor((w - 12) / 11); i++) {
        var px = 6 + i * 11, c = cl[i % 4];
        P.r(px, 2, 10, 10, c); P.r(px, 2, 10, 1, lt(c, 0.3)); P.r(px + 4, 5, 2, 2, lt(c, 0.5)); P.r(px, 11, 10, 1, dk(c, 0.3));
      }
      P.r(2, 12, w - 4, 7, "#D9A25E"); P.r(2, 12, w - 4, 1, "#F0C888");
      for (var x = 4; x < w - 4; x += 6) { P.r(x, 14, 3, 1, "#C8443A"); P.r(x + 1, 16, 1, 1, "#2F5FB0"); }
      P.r(2, 19, w - 4, 3, WOOD[0]); P.r(2, 19, w - 4, 1, WOOD[1]);
      P.r(0, 6, 4, 16, WOOD[2]); P.r(0, 6, 4, 1, WOOD[1]); P.r(w - 4, 6, 4, 16, WOOD[2]); P.r(w - 4, 6, 4, 1, WOOD[1]);
      P.r(1, 22, 2, 3, WOOD[3]); P.r(w - 3, 22, 2, 3, WOOD[3]);
    }, [0, 21, w, 5, 0.28]);
  };
  // the kanaba seen from behind, facing the TV: a carved wooden frame, the cushioned back, a crochet doily on top.
  // Whoever sits on it shows their head and shoulders over the back.
  PR.sofaBack = function (o) {
    var w = o.w || 46;
    return sprite(w, 20, function (P) {
      P.r(0, 7, 5, 10, WOOD[2]); P.r(0, 7, 5, 1, WOOD[1]); P.r(w - 5, 7, 5, 10, WOOD[2]); P.r(w - 5, 7, 5, 1, WOOD[1]); // the arms
      P.r(1, 8, 3, 1, "#8A3A3A"); P.r(w - 4, 8, 3, 1, "#8A3A3A");
      P.r(4, 3, w - 8, 13, WOOD[2]); P.r(4, 3, w - 8, 1, WOOD[1]); P.r((w >> 1) - 6, 1, 12, 2, WOOD[2]); P.r((w >> 1) - 5, 1, 10, 1, WOOD[1]); // the frame and its crest
      P.r(6, 5, w - 12, 9, "#9A4040"); P.r(6, 5, w - 12, 1, "#B85A50");
      for (var x = 10; x < w - 8; x += 7) { P.p(x, 8, "#7A2E30"); P.p(x + 3, 11, "#7A2E30"); }
      P.r(w - 9, 5, 3, 9, "#7A3434"); // the shade on the right
      P.r((w >> 1) - 5, 3, 10, 3, "#F4EFE4"); for (var d = (w >> 1) - 5; d < (w >> 1) + 5; d += 2) P.p(d, 6, "#F4EFE4"); // the doily
      P.r(2, 15, w - 4, 3, WOOD[3]); P.r(2, 15, w - 4, 1, WOOD[2]);
      P.r(3, 18, 2, 2, WOOD[3]); P.r(w - 5, 18, 2, 2, WOOD[3]);
    }, [0, 17, w, 4, 0.28]);
  };
  // النيش: the glass cabinet with the good plates nobody eats from, a lace runner and the Ramadan lantern on top
  PR.niche = function () {
    return sprite(40, 52, function (P) {
      P.r(30, 0, 1, 2, BRASS[2]); P.r(28, 2, 5, 1, BRASS[1]); P.r(28, 3, 5, 5, "#FFD25A"); P.r(29, 4, 1, 3, "#FFF0B0"); P.r(28, 8, 5, 1, BRASS[1]); // the fanous
      P.r(1, 9, 38, 41, WOOD[2]); P.r(0, 9, 40, 2, WOOD[1]); P.r(14, 7, 12, 2, WOOD[2]); P.r(15, 7, 10, 1, WOOD[1]);
      P.r(6, 8, 18, 2, "#F4EFE4"); for (var l = 6; l < 24; l += 2) P.p(l, 10, "#F4EFE4"); // the lace runner
      [4, 21].forEach(function (gx) {
        P.r(gx, 12, 15, 21, "#A8C8D0"); P.r(gx, 22, 15, 1, WOOD[1]);
        for (var i = 0; i < 2; i++) { var px = gx + 1 + i * 7; P.el(px, 14, 6, 7, "#F4EFE4"); P.el(px + 1, 15, 4, 5, "#4F97C8"); P.el(px + 2, 16, 2, 3, "#F4EFE4"); P.p(px + 2, 17, "#C8443A"); }
        for (var j = 0; j < 3; j++) { var cx = gx + 1 + j * 5; P.r(cx, 27, 4, 4, "#F4EFE4"); P.r(cx, 27, 4, 1, "#E8C060"); P.p(cx + 4, 28, "#F4EFE4"); P.r(cx - 1, 31, 6, 1, "#E8E2D6"); }
        P.p(gx + 2, 13, "#E8F4F8"); P.p(gx + 3, 14, "#E8F4F8"); P.p(gx + 11, 24, "#E8F4F8"); P.p(gx + 12, 25, "#E8F4F8"); // the glass shines
        P.r(gx, 35, 15, 12, WOOD[0]); P.r(gx + 2, 37, 11, 8, WOOD[1]); P.r(gx + 3, 38, 9, 6, WOOD[0]);
      });
      P.p(18, 28, BRASS[1]); P.p(21, 28, BRASS[1]); P.p(18, 41, BRASS[1]); P.p(21, 41, BRASS[1]);
      P.r(1, 33, 38, 1, WOOD[3]); P.r(1, 47, 38, 1, WOOD[3]);
      P.r(2, 50, 3, 2, WOOD[3]); P.r(35, 50, 3, 2, WOOD[3]);
    }, [0, 48, 40, 4, 0.28]);
  };
  // صاج الكنافة: the big round griddle where kunafa is poured in circles every Ramadan, a tray of finished strands beside it
  PR.kunafaGriddle = function () {
    return sprite(46, 24, function (P) {
      var R = rng(31);
      P.r(4, 12, 26, 9, "#8E3E2E"); for (var y = 13; y < 20; y += 3) for (var x = 5 + (y % 2 ? 2 : 0); x < 28; x += 5) P.r(x, y, 4, 2, "#B5583E"); // the brick stove
      P.r(13, 17, 8, 4, "#2A1414"); P.r(14, 18, 6, 2, "#E8503F"); P.p(16, 18, "#FFD060");
      P.el(1, 4, 32, 11, "#4A4448"); P.el(2, 4, 30, 9, "#8A8E94"); P.el(4, 5, 26, 7, "#A8ACB2"); // the griddle
      for (var r = 0; r < 3; r++) P.el(9 + r * 2, 6 + r, 16 - r * 4, 5 - r * 2 > 1 ? 5 - r * 2 : 1, r % 2 ? "#F6D890" : "#E8C070"); // poured rings
      P.p(17, 8, "#A8ACB2");
      P.r(31, 10, 14, 3, "#D8D2C8"); P.r(31, 10, 14, 1, "#F4EFE4"); P.r(32, 13, 2, 8, WOOD[2]); P.r(42, 13, 2, 8, WOOD[2]); // the side table
      P.el(32, 5, 12, 6, "#E8B860"); P.dots(33, 5, 10, 5, ["#F6D890", "#C8903A"], 16, R); // a heap of kunafa
      P.r(36, 2, 4, 3, "#E8DCC0"); P.r(36, 2, 4, 1, "#F6EEDA"); // a paper cone
    }, [0, 20, 46, 4, 0.28]);
  };
  PR.tabliya = function (o) { // the low round table where iftar happens; o.set 0 bare, 1 half laid, 2 iftar
    var set = o.set || 0;
    return sprite(32, 16, function (P) {
      P.el(1, 2, 30, 10, "#B8862E"); P.el(2, 2, 28, 8, "#E0B050"); P.el(5, 3, 22, 5, "#EAC064");
      P.r(5, 11, 2, 4, WOOD[2]); P.r(25, 11, 2, 4, WOOD[2]); P.r(15, 11, 2, 4, WOOD[3]);
      if (set >= 1) {
        P.el(4, 3, 7, 4, "#F4EFE4"); P.el(5, 4, 5, 2, "#E89A3A"); // soup
        P.el(21, 3, 7, 4, "#F4EFE4"); P.el(22, 4, 5, 2, "#E89A3A");
        P.r(13, 2, 6, 3, "#8A4A2A"); P.p(14, 2, "#B86A3A"); P.p(16, 3, "#B86A3A"); // dates
      }
      if (set >= 2) {
        P.r(11, 5, 3, 4, "#C8343A"); P.r(11, 5, 3, 1, "#FFFFFF"); // karkadeh jug
        P.el(15, 5, 7, 4, "#D9A25E"); P.p(17, 6, "#F0C888"); // bread
        P.el(7, 6, 5, 3, "#6EBE58"); P.p(8, 7, "#E8503F"); // salad
        P.el(22, 7, 6, 3, "#E8D8B0"); P.r(23, 7, 3, 1, "#8A5A3A"); // rice and chicken
      }
    }, [0, 12, 32, 4, 0.25]);
  };
  PR.cushion = function (o) { var c = o.c || "#2F5FB0"; return sprite(12, 6, function (P) { P.r(1, 1, 10, 4, c); P.r(1, 1, 10, 1, lt(c, 0.3)); P.r(4, 2, 4, 1, "#F2C14A"); }); };
  PR.tvCab = function () { // a TV on a wooden cabinet with a lace cloth; js/map.js plays the screen
    return sprite(30, 34, function (P) {
      P.r(2, 1, 26, 16, "#1E1A22"); P.r(3, 2, 24, 13, "#2A3A4A"); P.r(13, 17, 4, 2, "#2A2630"); P.r(10, 18, 10, 1, "#2A2630");
      P.r(1, 19, 28, 13, WOOD[0]); P.r(1, 19, 28, 1, "#F4EFE4"); for (var x = 2; x < 28; x += 3) P.p(x, 20, "#F4EFE4");
      P.r(3, 22, 11, 8, WOOD[1]); P.r(16, 22, 11, 8, WOOD[1]); P.p(12, 26, BRASS[1]); P.p(17, 26, BRASS[1]);
      P.r(1, 31, 28, 1, WOOD[3]); P.r(2, 32, 2, 2, WOOD[3]); P.r(26, 32, 2, 2, WOOD[3]);
    }, [0, 30, 30, 4, 0.25]);
  };
  PR.birdcage = function () {
    return sprite(11, 17, function (P) {
      P.r(5, 0, 1, 3, BRASS[2]);
      P.el(1, 3, 9, 6, BRASS[0]); P.el(2, 4, 7, 5, "#3A2A24");
      P.r(1, 6, 9, 9, "#3A2A24"); for (var x = 1; x < 10; x += 2) P.r(x, 5, 1, 10, BRASS[0]);
      P.r(4, 9, 3, 2, "#FFD23A"); P.p(6, 8, "#FFD23A"); P.p(7, 8, "#E8803A"); // the canary
      P.r(1, 14, 9, 2, BRASS[2]); P.r(2, 11, 7, 1, BRASS[2]);
    });
  };
  PR.bakeryCounter = function (o) {
    var w = o.w || 70;
    return sprite(w, 30, function (P, ww, hh) {
      var R = rng(w);
      P.r(1, 12, w - 2, 16, "#8A5A3A"); for (var x = 4; x < w - 3; x += 6) P.r(x, 13, 1, 15, "#6A4028");
      P.r(1, 9, w - 2, 4, "#E8E2DA"); P.r(1, 9, w - 2, 1, "#FFFFFF"); P.r(1, 12, w - 2, 1, "#B8B0A6");
      for (var i = 0; i < 4; i++) for (var j = 0; j < 3 - (i % 2); j++) A.loaf(P, 4 + j * 6 + (i % 2) * 3, 6 - i * 2 + 2, R);
      for (var k = 0; k < 3; k++) for (var m = 0; m < 2; m++) A.loaf(P, w - 30 + k * 6 + m * 3, 6 - m * 2, R);
      P.r(w - 12, 3, 9, 6, BRASS[0]); P.r(w - 12, 3, 9, 1, BRASS[1]); P.r(w - 9, 1, 3, 2, BRASS[2]); // the scale
      P.r(24, 4, 10, 5, "#5A7A9A"); P.r(24, 4, 10, 1, "#8AAACA"); P.r(27, 6, 4, 1, "#2A3A4A"); // cash tin
    }, [0, 26, w, 4, 0.28]);
  };
  PR.doughTable = function () {
    return sprite(36, 18, function (P) {
      P.r(1, 2, 34, 8, "#C99A68"); P.r(1, 2, 34, 1, "#E0B888"); P.dots(2, 3, 32, 6, ["#F4EFE4", "#EDE4D0"], 30, rng(3));
      for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) { P.el(4 + i * 7, 3 + j * 3, 5, 3, "#F4E8D0"); P.p(5 + i * 7, 3 + j * 3, "#FFFFFF"); }
      P.r(1, 10, 34, 2, WOOD[2]); P.r(2, 12, 2, 5, WOOD[3]); P.r(32, 12, 2, 5, WOOD[3]);
    }, [0, 14, 36, 4, 0.25]);
  };
  PR.kosharyBar = function (o) { // steel counter, the pots, the mountain of fried onions, the dakka bottles
    var w = o.w || 110;
    return sprite(w, 36, function (P) {
      P.r(1, 16, w - 2, 18, "#B8C0C8"); P.r(1, 16, w - 2, 1, "#E8ECF0"); P.r(1, 19, w - 2, 3, "#C8443A"); P.r(1, 22, w - 2, 1, "#8A2A24");
      for (var x = 6; x < w - 4; x += 14) P.r(x, 24, 1, 9, "#9AA2AC");
      P.r(1, 13, w - 2, 3, "#D8DEE4"); P.r(1, 13, w - 2, 1, "#FFFFFF");
      function pot(x, wd, fill, spots) {
        P.r(x, 4, wd, 10, "#A8B0BC"); P.r(x, 4, wd, 1, "#E4E8EE"); P.r(x + wd - 2, 5, 2, 9, "#8A909E");
        P.el(x + 1, 3, wd - 2, 3, fill); if (spots) P.dots(x + 2, 3, wd - 4, 2, spots, 6, rng(x));
      }
      pot(4, 16, "#F4EFE4", ["#E8E0C8"]);               // rice
      pot(22, 14, "#E8C888", ["#D8A858", "#F4DCA8"]);   // pasta
      pot(38, 12, "#8A5A3A", ["#A86A40"]);              // lentils
      P.el(54, 4, 22, 9, "#7A4A28"); P.dots(56, 4, 18, 7, ["#A86A38", "#5A3018", "#C88A48"], 40, rng(9)); // the onions
      pot(80, 12, "#C8343A", ["#E8503F"]);              // the tomato sauce
      for (var b = 0; b < 4; b++) { P.el(w - 16, 9 - b * 2, 12, 3, "#C8D0D8"); P.r(w - 15, 10 - b * 2, 10, 1, "#9AA2AC"); } // bowls
      P.r(w - 22, 3, 3, 10, "#E8503F"); P.r(w - 22, 2, 3, 1, "#F4EFE4"); P.r(w - 19, 5, 3, 8, "#F4E8B0"); P.r(w - 19, 4, 3, 1, "#F4EFE4"); // dakka
    }, [0, 32, w, 4, 0.28]);
  };
  PR.marbleTable = function (o) { // o.set: bowls of koshari on it
    return sprite(20, 16, function (P) {
      P.el(1, 1, 18, 7, "#F2F0EC"); P.el(2, 1, 16, 5, "#FFFFFF"); P.r(5, 3, 4, 1, "#C8C8D0"); P.r(11, 5, 3, 1, "#D8D8E0");
      P.r(9, 7, 2, 7, "#5A5A66"); P.r(6, 13, 8, 2, "#3A3A44");
      if (o.set) { P.el(3, 1, 6, 3, "#C8D0D8"); P.r(4, 1, 4, 1, "#A86A38"); P.el(11, 2, 6, 3, "#C8D0D8"); P.r(12, 2, 4, 1, "#C8443A"); P.r(9, 0, 1, 3, "#E8503F"); }
    }, [0, 12, 20, 4, 0.25]);
  };
  PR.stool = function (o) { var c = o.c || WOOD[0]; return sprite(9, 10, function (P) { P.el(1, 1, 7, 3, lt(c, 0.15)); P.r(2, 3, 1, 6, dk(c, 0.2)); P.r(6, 3, 1, 6, dk(c, 0.2)); P.r(2, 6, 5, 1, dk(c, 0.3)); }); };
  PR.grillBar = function () { // charcoal, skewers, a fan of smoke
    return sprite(52, 30, function (P) {
      P.r(1, 12, 50, 16, "#9A4A34"); for (var y = 14; y < 28; y += 4) for (var x = 1 + (y % 8 ? 4 : 0); x < 50; x += 8) P.r(x, y, 7, 3, "#B5583E");
      P.r(1, 8, 50, 5, "#3A3A44"); P.r(2, 9, 48, 3, "#E8503F"); P.dots(2, 9, 48, 3, ["#FFD23A", "#8A2A1A", "#FF8F3F"], 40, rng(5));
      for (var s = 0; s < 7; s++) { P.r(4 + s * 6, 6, 1, 6, "#C8C0B8"); P.r(3 + s * 6, 7, 3, 4, s % 2 ? "#7A3A20" : "#9A5A2A"); P.p(4 + s * 6, 7, "#B86A3A"); }
      P.r(1, 28, 50, 1, "#5A2A1E");
    }, [0, 26, 52, 4, 0.28]);
  };
  PR.showFridge = function () {
    return sprite(28, 32, function (P) {
      P.r(1, 1, 26, 29, "#E8ECF0"); P.r(1, 1, 26, 1, "#FFFFFF"); P.r(3, 3, 22, 18, "#B8DCEA"); P.r(3, 3, 22, 1, "#E0F4FA");
      P.r(4, 6, 9, 4, "#8A4A2A"); P.dots(4, 6, 9, 4, ["#A86A3A", "#6A3A1E"], 10, rng(2)); P.r(15, 6, 9, 4, "#F2D0B0"); P.r(15, 6, 9, 1, "#FFE8D0");
      P.r(4, 13, 9, 4, "#6EBE58"); P.p(6, 14, "#E8503F"); P.p(9, 15, "#E8503F"); P.r(15, 13, 9, 4, "#C8343A"); P.p(17, 14, "#E8503F");
      P.r(3, 11, 22, 1, "#9AA2AC"); P.r(3, 18, 22, 1, "#9AA2AC");
      P.r(1, 22, 26, 8, "#C8D0D8"); P.r(4, 24, 20, 1, "#9AA2AC"); P.r(2, 30, 3, 2, "#5A5A66"); P.r(23, 30, 3, 2, "#5A5A66");
    }, [0, 28, 28, 4, 0.25]);
  };
  PR.woodTable = function (o) { // checked cloth; o.set: a kebab dinner
    var w = o.w || 30;
    return sprite(w, 18, function (P) {
      P.r(1, 1, w - 2, 9, "#F4EFE4"); for (var x = 1; x < w - 1; x += 4) for (var y = 1; y < 10; y += 4) P.r(x, y, 2, 2, "#C8443A");
      P.r(1, 10, w - 2, 2, "#B8343A"); for (var f = 2; f < w - 2; f += 3) P.p(f, 12, "#B8343A");
      P.r(3, 12, 2, 5, WOOD[2]); P.r(w - 5, 12, 2, 5, WOOD[2]);
      if (o.set) {
        P.el(3, 2, 9, 5, "#F4EFE4"); P.r(4, 3, 7, 1, "#7A3A20"); P.r(4, 5, 6, 1, "#9A5A2A"); // kebab and kofta
        P.el(w - 12, 2, 9, 5, "#F4EFE4"); P.r(w - 11, 3, 6, 2, "#6EBE58"); P.p(w - 9, 3, "#E8503F");
        P.el(13, 5, 5, 3, "#E8D8A8"); P.el(w - 18, 6, 6, 3, "#D9A25E");
      }
    }, [0, 14, w, 4, 0.25]);
  };
  PR.column = function () { // a mosque column, marble, with a carved capital
    return sprite(16, 70, function (P) {
      P.r(1, 0, 14, 5, "#D8CCB0"); P.r(1, 0, 14, 1, "#F4ECD8"); P.r(2, 5, 12, 3, "#C8B898"); P.r(4, 2, 2, 2, "#B8A888"); P.r(10, 2, 2, 2, "#B8A888");
      P.r(4, 8, 8, 54, "#EDE6D8"); P.r(4, 8, 2, 54, "#FFFFFF"); P.r(10, 8, 2, 54, "#CFC6B4"); P.r(7, 20, 1, 6, "#D8D0C0"); P.r(8, 40, 1, 8, "#D8D0C0");
      P.r(2, 62, 12, 3, "#C8B898"); P.r(1, 65, 14, 4, "#D8CCB0"); P.r(1, 65, 14, 1, "#F4ECD8");
    }, [0, 66, 16, 4, 0.28]);
  };
  PR.minbar = function () { // the pulpit: carved wood, a little dome on top
    return sprite(28, 58, function (P) {
      P.r(10, 0, 2, 3, BRASS[1]); P.el(6, 2, 10, 8, "#2E6A4E"); P.r(7, 4, 2, 3, "#4C9A6A");
      P.r(6, 9, 10, 2, BRASS[0]); P.r(6, 11, 1, 14, WOOD[2]); P.r(15, 11, 1, 14, WOOD[2]);
      P.r(4, 25, 14, 4, WOOD[1]); P.r(4, 25, 14, 1, lt(WOOD[1], 0.3));
      for (var s = 0; s < 7; s++) P.r(4 + s * 3, 29 + s * 4, 24 - s * 3, 4, s % 2 ? WOOD[0] : WOOD[2]);
      P.r(2, 29, 4, 27, WOOD[2]); P.r(3, 31, 2, 4, "#2E6A4E"); P.r(3, 38, 2, 4, "#2E6A4E"); P.r(3, 45, 2, 4, "#2E6A4E");
      for (var g = 0; g < 6; g++) P.line(4 + g * 3, 27 + g * 4, 6 + g * 3, 27 + g * 4, BRASS[0]);
      P.r(1, 54, 26, 3, WOOD[3]);
    }, [0, 54, 28, 4, 0.28]);
  };
  PR.shelfQuran = function () {
    return sprite(28, 34, function (P) {
      P.r(1, 1, 26, 31, WOOD[2]); P.r(1, 1, 26, 1, WOOD[1]);
      [4, 13, 22].forEach(function (y, row) {
        P.r(3, y, 22, 8, "#3A2420");
        for (var x = 3; x < 25; x += 3) { var c = ["#2E6A4E", "#8A2A2A", "#2A4A7A", "#2E6A4E"][(x + row) % 4]; P.r(x, y + 1, 2, 7, c); P.p(x, y + 3, BRASS[1]); }
        P.r(2, y + 8, 24, 1, WOOD[0]);
      });
      P.r(2, 32, 3, 2, WOOD[3]); P.r(23, 32, 3, 2, WOOD[3]);
    }, [0, 30, 28, 4, 0.25]);
  };
  PR.rehal = function () { return sprite(12, 9, function (P) { P.line(2, 7, 9, 2, WOOD[0]); P.line(2, 2, 9, 7, WOOD[2]); P.r(1, 1, 5, 3, "#F4EFE4"); P.r(6, 1, 5, 3, "#EAE2D0"); P.r(2, 2, 3, 1, "#8A8478"); P.r(7, 2, 3, 1, "#8A8478"); }); };
  PR.shoeRack = function () {
    return sprite(32, 18, function (P) {
      P.r(1, 1, 30, 15, WOOD[2]); P.r(1, 1, 30, 1, WOOD[1]); P.r(2, 6, 28, 1, WOOD[0]); P.r(2, 11, 28, 1, WOOD[0]);
      var cols = ["#3A2A26", "#8A5A3A", "#E8E2D6", "#2A3A5A", "#5A3A2C", "#C8443A"];
      for (var r = 0; r < 3; r++) for (var i = 0; i < 6; i++) if ((r * 7 + i * 3) % 5) P.r(3 + i * 5, 3 + r * 5, 3, 2, cols[(r + i) % 6]);
    }, [0, 14, 32, 4, 0.25]);
  };
  PR.cooler = function () {
    return sprite(12, 26, function (P) {
      P.r(2, 1, 8, 22, "#C8D0D8"); P.r(2, 1, 8, 1, "#F0F4F8"); P.r(8, 2, 2, 21, "#9AA2AC"); P.r(4, 10, 3, 2, "#5A6A7A"); P.p(5, 12, "#88C8F0");
      P.r(3, 4, 6, 3, "#5A9AC8"); P.r(1, 23, 10, 2, "#6A707E");
    }, [0, 22, 12, 4, 0.25]);
  };
  PR.toolbox = function (o) {
    return sprite(18, 11, function (P) {
      P.r(1, 3, 16, 7, WOOD[0]); P.r(1, 3, 16, 1, WOOD[1]); P.r(1, 3, 2, 2, BRASS[0]); P.r(15, 3, 2, 2, BRASS[0]);
      if (o.open) { P.r(3, 1, 5, 3, "#8A6A4A"); P.r(4, 0, 3, 1, "#B8B0A6"); P.r(10, 0, 1, 4, "#8A8A96"); P.r(12, 1, 3, 2, "#C8A060"); }
      else { P.r(1, 1, 16, 3, WOOD[2]); P.r(7, 0, 4, 1, "#5A4030"); }
      P.r(1, 9, 16, 1, WOOD[3]);
    });
  };
  PR.doorHalf = function () { // an unfinished door, leaning on the wall
    return sprite(18, 40, function (P) {
      for (var i = 0; i < 4; i++) { P.r(2 + i * 4, 2 + (i % 2), 3, 34, i % 2 ? "#C99A68" : "#B98A5A"); P.r(2 + i * 4, 2 + (i % 2), 3, 1, "#E0B888"); }
      P.r(2, 10, 15, 2, "#8A5A3A"); P.r(2, 28, 15, 2, "#8A5A3A"); P.line(3, 27, 15, 12, "#8A5A3A");
      P.r(1, 36, 17, 2, "#5C3524");
    }, [0, 36, 18, 4, 0.22]);
  };
  PR.screen = function (o) { // a low mashrabiya screen: the women's rows behind it
    var w = o.w || 60;
    return sprite(w, 24, function (P) {
      P.r(1, 3, w - 2, 18, WOOD[2]); P.r(1, 2, w - 2, 2, WOOD[1]); P.r(1, 2, w - 2, 1, lt(WOOD[1], 0.3));
      for (var y = 6; y < 19; y += 4) for (var x = 4; x < w - 4; x += 4) { P.r(x, y, 2, 2, "#2A1810"); P.p(x + 2, y + 1, WOOD[0]); }
      for (var px = 1; px < w; px += 18) P.r(px, 1, 3, 21, WOOD[3]);
      P.r(1, 21, w - 2, 2, WOOD[3]);
    }, [0, 20, w, 4, 0.22]);
  };
  PR.screenSide = function (o) { // the partition between the women's rows and the men's way in, seen end-on: a wooden rail
    var d = o.d || 10, end = !!o.end, h = d + 18;
    return sprite(6, h, function (P) {
      P.r(1, 0, 4, d, WOOD[2]); P.r(1, 0, 1, d, lt(WOOD[1], 0.25)); P.r(4, 0, 1, d, WOOD[3]);
      for (var y = 1; y < d; y += 3) P.p(2 + (y % 2), y, "#2A1810");
      if (end) { // its near end: the lattice face, as tall as the screens
        P.r(1, d, 4, 18, WOOD[2]); P.r(1, d, 4, 1, WOOD[1]);
        for (var yy = d + 3; yy < d + 16; yy += 3) { P.p(2, yy, "#2A1810"); P.p(3, yy + 1, "#2A1810"); }
        P.r(1, d + 16, 4, 2, WOOD[3]);
      } else { P.r(0, d - 2, 6, 3, WOOD[3]); P.r(1, d - 2, 4, 1, WOOD[1]); }
    });
  };
  PR.shoePairs = function (o) { // shoes left by the door, in pairs
    var n = o.n || 5, R = rng(o.seed || 3);
    return sprite(8, n * 7 + 2, function (P) {
      var cols = ["#3A2A26", "#8A5A3A", "#2A3A5A", "#5A3A2C", "#E8E2D6", "#6A6A74"];
      for (var i = 0; i < n; i++) { var c = cols[(R() * cols.length) | 0], y = 1 + i * 7; P.r(1, y, 2, 5, c); P.r(4, y + 1, 2, 5, c); P.p(1, y, lt(c, 0.3)); P.p(4, y + 1, lt(c, 0.3)); }
    });
  };
  PR.stairHut = function () { // the little room on the roof that hides the stairs
    return sprite(34, 46, function (P) {
      P.r(1, 2, 32, 4, "#B8A890"); P.r(1, 2, 32, 1, "#D8CCB8");
      P.r(2, 6, 30, 38, "#E2D2B4"); P.dots(2, 6, 30, 38, ["#D0BE9C", "#ECDEC4"], 60, rng(4)); P.r(26, 6, 6, 38, "#CDBB98");
      P.r(8, 16, 14, 28, "#4A3A5A"); P.r(9, 17, 12, 27, "#5E4A6E"); P.r(9, 17, 12, 1, "#7A6688"); P.r(18, 30, 2, 2, BRASS[1]);
      P.r(14, 10, 3, 3, "#FFE7A0"); P.r(13, 9, 5, 1, "#3A2E36");
    }, [0, 42, 34, 4, 0.3]);
  };

  /* ---------------- the rooms ---------------- */
  var ROOMS = {};

  // البيت: mama's kitchen, the kanaba, the TV, the window where Nemat's basket comes down
  ROOMS.home = function () {
    var W = 184, HG = 200, WALL = 64;
    var s = shell(W, HG, WALL, {
      floor: function (P, R) {
        checker(P, 0, WALL, W, HG - WALL, "#E2CDA8", "#D4BC94", 8);
        for (var y = WALL; y < HG; y += 8) for (var x = 0; x < W; x += 8) if (((x + y) / 8) % 4 === 1) { P.r(x + 3, y + 3, 2, 2, "#B86A4A"); }
        // the kilim
        P.r(40, 104, 110, 62, "#A8323A"); P.r(42, 106, 106, 58, "#C8443A"); P.r(46, 110, 98, 50, "#2F4F8A");
        for (var i = 50; i < 140; i += 12) { P.r(i + 3, 118, 5, 1, "#F2C14A"); P.r(i + 2, 119, 7, 1, "#F2C14A"); P.r(i + 3, 150, 5, 1, "#F2C14A"); P.r(i + 2, 149, 7, 1, "#F2C14A"); }
        P.r(78, 126, 34, 18, "#C8443A"); P.r(82, 129, 26, 12, "#F2C14A"); P.r(88, 132, 14, 6, "#2F4F8A");
        for (var f = 41; f < 150; f += 3) { P.p(f, 103, "#F4EFE4"); P.p(f, 166, "#F4EFE4"); }
      },
      wall: function (P, R) {
        plaster(P, 0, 6, W, WALL - 6, "#F0C9A0", R);
        P.r(0, 46, W, WALL - 46, "#C2705A"); P.r(0, 45, W, 1, "#F8E4C4"); P.dots(0, 47, W, WALL - 47, ["#B26450", "#CC7C64"], 80, R);
        khayamiya(P, 0, 7, W, 7);
        // the kitchen tiles
        grid(P, 6, 28, 70, WALL - 28, "#F2F4F0", "#C8D4D4", 5);
        for (var x = 6; x < 76; x += 10) P.r(x + 1, 38, 4, 4, "#4F97C8");
        // shelf with jars
        P.r(8, 24, 22, 2, WOOD[2]); [["#E8503F", 9], ["#F2C14A", 14], ["#6EBE58", 19], ["#E8E2D6", 24]].forEach(function (j) { P.r(j[1], 19, 4, 5, j[0]); P.r(j[1], 18, 4, 1, "#C8963E"); });
        // the photo, the clock is drawn live
        frame(P, 84, 18, 16, 14, "#8A6224", "#C8B8A0"); P.r(87, 23, 4, 7, "#3A2E3A"); P.r(92, 22, 4, 8, "#F4EFE4"); P.r(92, 21, 4, 2, "#3A2E3A");
        P.el(106, 16, 14, 14, "#8A6224"); P.el(107, 17, 12, 12, "#F4EFE4");
        // the door up to the roof
        doorAt(P, 134, 28, 18, 36, "#4F7FA0", { glass: true });
        P.r(136, 22, 14, 4, "#F4EFE4");
      },
      seed: 1
    });
    var P = s.P;
    windowAt(P, 32, 12, 24, 22, { sky: "#A9DAEE", view: "#E6B266", shutters: "#4F97A0" });
    return {
      id: "home", name: "بيتنا", sub: "ريحة شوربة لسان عصفور", W: W, HGT: HG, ground: s.c, bed: "homeIn", wall: WALL,
      props: [
        { k: "stove", x: 8, y: 94, block: [20, 6], steam: [11, -26] },
        { k: "sinkUnit", x: 32, y: 92, block: [26, 6] },
        { k: "fridge", x: 60, y: 94, block: [16, 6] },
        { k: "niche", x: 86, y: 96, block: [40, 6] },
        { k: "tvCab", x: 150, y: 96, block: [28, 6], id: "tv" },
        { k: "sofaBack", o: { w: 46 }, x: 134, y: 146, block: [46, 6] }, // facing the TV: mama's seat for the series
        { k: "tabliya", o: { set: 0 }, x: 79, y: 146, block: [28, 6], id: "tabliya", setBy: { pre: 1, maghrib: 2, night: 1 } },
        { k: "cushion", o: { c: "#2F5FB0" }, x: 62, y: 144, noblock: true },
        { k: "cushion", o: { c: "#1F7A54" }, x: 112, y: 144, noblock: true },
        { k: "birdcage", x: 64, y: 72, z: 30, noblock: true },
        { k: "plantPots", o: { n: 2, seed: 5 }, x: 150, y: 190, block: [16, 4] },
        { k: "shoes", x: 60, y: 192, noblock: true }
      ],
      fixtures: [
        { layer: "wall", draw: function (R) { // the clock, the window's basket, the TV
          var t = R.T, a1 = t * 0.05, a2 = t * 0.6;
          R.rect(113, 23, 1, 1, "#3A2E3A");
          for (var i = 1; i < 5; i++) R.rect(113 + Math.round(Math.cos(a1) * i * 0.7), 23 + Math.round(Math.sin(a1) * i * 0.7), 1, 1, "#3A2E3A");
          for (var j = 1; j < 6; j++) R.rect(113 + Math.round(Math.cos(a2) * j * 0.85), 23 + Math.round(Math.sin(a2) * j * 0.85), 1, 1, "#C8443A");
          var k = R.st.basket || 0, rp = R.st.rope || 0;
          if (rp > 0 && !(k > 0)) { // just the rope and its hook, come down for the basket you're carrying
            var sw2 = Math.round(Math.sin(t * 1.8) * 1.5 * Math.min(1, rp)), ry = 12 + Math.round(18 * Math.min(1, rp));
            for (var y2 = 12; y2 < ry; y2++) R.rect(44 + Math.round(sw2 * (y2 - 12) / 18), y2, 1, 1, "#F4ECE0");
            R.rect(43 + sw2, ry, 3, 1, "#8A8478"); R.rect(45 + sw2, ry - 2, 1, 2, "#8A8478");
          }
          if (k > 0) {
            var sw = Math.round(Math.sin(t * 1.8) * 1.5 * Math.min(1, k)), by = 12 + Math.round(16 * Math.min(1, k));
            for (var y = 12; y < by; y++) R.rect(44 + Math.round(sw * (y - 12) / 16), y, 1, 1, "#F4ECE0");
            R.rect(40 + sw, by, 9, 6, "#B98A55"); R.rect(40 + sw, by, 9, 1, "#D9AA70"); R.rect(41 + sw, by + 3, 7, 1, "#8A6238"); R.rect(43 + sw, by - 1, 3, 1, "#F4EFE4");
          }
        } }
      ],
      over: function (R) { // the ceiling lamp on its cord
        for (var y = 0; y < 36; y++) R.rect(96, y, 1, 1, "#3A2E36");
        R.rect(90, 36, 13, 4, "#F2C14A"); R.rect(91, 36, 11, 1, "#FFE7A0"); R.rect(92, 40, 9, 1, "#C8963E");
      },
      walk: [[8, 94, W - 16, HG - 100], [80, HG - 8, 24, 6], [134, 66, 18, 30]],
      lights: [
        { x: 96, y: 60, r: 120, c: [255, 214, 150], when: "on", g: 0.5 },
        { x: 18, y: 70, r: 26, c: [255, 150, 80], when: "always", g: 0.4, fl: 1 },
        { x: 165, y: 76, r: 46, c: [140, 180, 255], when: "on", g: 0.5, fl: 2 }
      ],
      wins: [{ x: 32, y: 12, w: 24, h: 22 }],
      exits: [exitAt(W, HG, "home"), { r: [134, 64, 18, 10], to: "roof" }],
      spawn: { hara: [92, 176, 1], roof: [143, 78, 0] },
      people: function (time) {
        var mama = { id: "mama", cast: "mama", name: "ماما", face: "mama" };
        if (time === "asr") mama.at = [19, 102, 1];
        else if (time === "pre") mama.at = [96, 136, 0];
        else if (time === "maghrib") mama.at = [66, 150, 3, "sit"];
        else { mama.at = [151, 137, 1, "sit"]; mama.talk = [126, 134]; } // on the kanaba, watching the series
        mama.say = [
          { when: "asr", t: "«الشوربة على النار. {روح|روحي} هات العيش بقى!»" },
          { when: "pre", t: "«{افرش|افرشي} معايا السفرة… لا استنى، العيش الأول!»" },
          { when: "maghrib", t: "«{كُل|كُلي} الشوربة وهي سخنة.»" },
          { t: "«المسلسل هيبدأ! {اقعد|اقعدي} جنبي.»" }];
        return [mama];
      }
    };
  };

  // فرن عم حسن: the dome oven, the queue, and the board of hung bread
  ROOMS.bakery = function () {
    var W = 184, HG = 184, WALL = 62;
    var s = shell(W, HG, WALL, {
      floor: function (P, R) { plaster(P, 0, WALL, W, HG - WALL, "#B8AC98", R); grid(P, 0, WALL, W, HG - WALL, "rgba(0,0,0,0)", "rgba(90,70,60,0.18)", 12); P.dots(0, WALL, W, HG - WALL, ["#F4EFE4", "#E8E0D0"], 160, R); },
      wall: function (P, R) {
        plaster(P, 0, 6, W, WALL - 6, "#E9E2D2", R);
        P.r(0, 44, W, WALL - 44, "#5E8A6A"); P.r(0, 43, W, 1, "#F4EFE4"); P.dots(0, 45, W, WALL - 45, ["#4E7A5A", "#6E9A7A"], 70, R);
        // soot over the oven, the brick dome, the fire mouth
        for (var r = 0; r < 14; r++) P.r(100 - r, 6 + r, 80 + r * 2, 1, "rgba(60,40,40," + (0.12 - r * 0.008).toFixed(3) + ")");
        P.el(102, 6, 78, 70, "#8E3E2E"); P.r(102, 41, 78, 21, "#8E3E2E");
        for (var y = 8; y < 62; y += 4) for (var x = 100 + ((y / 4) % 2 ? 3 : 0); x < 182; x += 7) {
          var ex = (x + 3 - 141) / 38, ey = (y + 1 - 41) / 34;
          if (y + 1 > 41 ? (x > 102 && x < 175) : ex * ex + ey * ey < 1) P.r(x, y, 6, 3, "#B5583E");
        }
        P.r(136, 0, 8, 8, "#5A4A4A"); P.r(136, 0, 2, 8, "#7A6A6A");
        P.el(124, 28, 34, 34, "#2A1414"); P.r(124, 45, 34, 17, "#2A1414"); P.el(127, 31, 28, 28, "#4A1E14"); P.r(127, 45, 28, 15, "#4A1E14");
        P.r(120, 58, 42, 4, "#E8E2DA"); P.r(120, 58, 42, 1, "#FFFFFF");
        // racks of bread trays
        P.r(56, 14, 40, 44, "#6A4530");
        for (var t = 0; t < 4; t++) { P.r(58, 16 + t * 10, 36, 8, "#C8A070"); P.r(58, 16 + t * 10, 36, 1, "#E0BC88"); for (var b = 0; b < 5; b++) A.loaf(P, 59 + b * 7, 18 + t * 10, R); }
        // the board frame (the notes are pinned live)
        frame(P, 8, 12, 44, 32, "#6A4530", "#C89A62"); P.dots(9, 13, 42, 30, ["#B8884E", "#D8AA72"], 60, R);
        P.r(10, 13, 40, 7, "#F4EFE4"); P.r(10, 19, 40, 1, "#C8443A");
      },
      seed: 2
    });
    return {
      id: "bakery", name: "فرن عم حسن", sub: "العيش طالع سخن", W: W, HGT: HG, ground: s.c, bed: "bakeryIn", wall: WALL,
      props: [
        { k: "bakeryCounter", o: { w: 70 }, x: 30, y: 104, block: [70, 8] },
        { k: "doughTable", x: 116, y: 98, block: [34, 6] },
        { k: "sacks", x: 8, y: 118, block: [16, 6] },
        { k: "sacks", x: 12, y: 128, block: [16, 6] },
        { k: "breadRack", x: 152, y: 160, block: [24, 6] },
        { k: "breadCage", o: { n: 2 }, x: 150, y: 132, block: [18, 6] },
        { k: "kunafaGriddle", x: 10, y: 176, block: [46, 6], steam: [17, -16], look: "kunafa" } // only in Ramadan: Zaki pours kunafa by the door
      ],
      fixtures: [
        { layer: "wall", draw: function (R) { // the board: one paper for every bread someone paid for
          R.text("العيش المعلّق", 30, 16.5, 6, "#B5473B", "sans");
          var n = Math.min(24, R.st.notes || 0), Rn = rng(77);
          for (var i = 0; i < n; i++) {
            var x = 11 + ((i % 6) * 6.5 | 0) + ((Rn() * 2) | 0), y = 22 + ((i / 6) | 0) * 5 + ((Rn() * 2) | 0), c = ["#F4EFE4", "#FFF2A8", "#FFD6E0", "#D8F0FF"][i % 4];
            var pop = R.st.noteT && i === n - 1 ? Math.min(1, (R.T - R.st.noteT) * 4) : 1;
            if (pop < 1) R.alpha(pop);
            R.rect(x, y, 5, 4, c); R.rect(x + 1, y + 1, 3, 1, "#A89878"); R.rect(x + 2, y, 1, 1, ["#E8503F", "#4F97E8", "#4CBF73"][i % 3]);
            R.alpha(1);
          }
        } },
        { layer: "wall", draw: function (R) { // the fire
          var t = R.T;
          for (var i = 0; i < 12; i++) {
            var fx = 130 + ((i * 7 + ((t * 9 + i * 3) | 0)) % 22), fh = 3 + (((t * 13 + i * 5) | 0) % 7);
            R.rect(fx, 57 - fh, 2, fh, fh > 6 ? "#FFE680" : fh > 4 ? "#FFB040" : "#E8503F");
          }
          R.rect(128, 56, 26, 2, "#FFD060");
        } },
        { layer: "sort", y: 96, draw: function (R) { // Sobhy's long peel going in and out of the oven
          if (R.time === "maghrib") return;
          var k = (Math.sin(R.T * 1.4) + 1) / 2, ex = 134 + Math.round(k * 8), ey = 56;
          for (var i = 0; i <= 24; i++) R.rect(Math.round(156 + (ex - 156) * i / 24), Math.round(80 + (ey - 80) * i / 24), 1, 1, WOOD[2]);
          R.rect(ex - 4, ey - 1, 8, 2, WOOD[1]);
        } },
        { layer: "sort", y: 177, draw: function (R) { // Zaki's pouring cup going round and round, a thin stream of batter under it
          if (R.time === "maghrib") return;
          var a = R.T * 2.2, cx = Math.round(27 + Math.cos(a) * 8), cy = Math.round(163 + Math.sin(a) * 2);
          R.rect(cx - 2, cy - 9, 5, 4, BRASS[1]); R.rect(cx - 2, cy - 9, 5, 1, BRASS[0]); R.rect(cx + 3, cy - 8, 2, 1, BRASS[2]);
          for (var s = cy - 5; s < cy; s++) R.rect(cx, s, 1, 1, "#F6E8C0");
        } }
      ],
      over: function (R) { for (var y = 0; y < 50; y++) R.rect(66, y, 1, 1, "#3A2E36"); R.rect(64, 50, 5, 4, "#FFF2C0"); R.rect(63, 49, 7, 1, "#5A4A4A"); },
      walk: [[8, 108, W - 16, HG - 114], [80, HG - 8, 24, 6], [100, 66, 76, 32], [8, 66, 22, 40]],
      lights: [
        { x: 141, y: 48, r: 90, c: [255, 150, 70], when: "always", g: 0.7, fl: 1 },
        { x: 66, y: 70, r: 80, c: [255, 220, 160], when: "on", g: 0.5 },
        { x: 92, y: 182, r: 60, c: [255, 220, 170], when: "day", g: 0.3 }
      ],
      wins: [],
      exits: [exitAt(W, HG, "bakery")],
      spawn: { hara: [92, 160, 1] },
      cats: [{ coat: "ginger", at: [16, 112], mode: "sleep", z: 8 }],
      people: function (time) {
        var out = [
          { id: "hassan", cast: "hassan", name: "عم حسن", face: "hassan", at: [64, 94, 0], talk: [64, 112], say: [
            { when: "night", t: "«العجين بيرتاح لحد السحور. {تعالى|تعالي} الساعة ٢ هتلاقي العيش طالع.»" },
            { if: "at_bakery", t: "«سلّم لي على عم صابر لو {شفته|شفتيه}.»" },
            { t: "«واحد واحد يا جماعة! العيش مش هيطير!»" }] }
        ];
        if (time !== "maghrib") out.push({ cast: "sobhy", name: "صبحي", at: [158, 96, 1], say: ["«سخن سخن! {حاسب|حاسبي} الفرن نار!»", "«عم حسن بيقول العجينة زي البني آدم، محتاجة صبر.»"] });
        if (time !== "maghrib") out.push({ cast: "zaki", name: "عم زكي", at: [27, 156, 0], talk: [62, 166], say: ["«الكنافة البلدي مش بتتعمل غير في رمضان. باقي السنة بستناه.»", "«لفّة… ولفّة… ولفّة. أربعين سنة بلفّ الكوز ده.»", "«الكنافة عايزة صاج سخن وإيد صبورة.»"] });
        if (time === "asr" || time === "pre") {
          out.push({ id: "omyoussef", cast: "omyoussef", name: "أم يوسف", face: "omyoussef", at: [70, 118, 1], say: [{ if: "at_bakery", t: "«ربنا يجبر بخاطرك يا {ابني|بنتي}.»" }, { t: "«الطابور طويل النهارده…»" }] });
          out.push({ cast: "w2", name: "أم كريم", at: [76, 134, 1], queue: true, say: ["«خمسة أرغفة بس يا عم حسن الله يخليك.»"] });
          out.push({ cast: "m6", name: "عم رمضان", at: [82, 150, 1], queue: true, say: ["«الطابور ده مش بيتحرك ليه؟»"] });
          if (time === "pre") out.push({ cast: "k5", name: "حودة", at: [86, 164, 1], queue: true, say: ["«ماما قالت عشرة… ولا خمستاشر؟»"] });
        }
        if (time === "night") out.push({ cast: "w5", name: "أم سمير", at: [74, 120, 1], say: ["«العيش ده للسحور. مفيش أحلى من فول وعيش سخن الساعة ٣.»"] });
        return out;
      },
      state: { notes: 0 }
    };
  };

  // الجامع: the mihrab, the minbar, rows on the carpet, the chandelier
  ROOMS.mosque = function () {
    var W = 232, HG = 262, WALL = 84;
    var s = shell(W, HG, WALL, {
      floor: function (P, R) {
        P.r(0, WALL, W, HG - WALL, "#9A2A34");
        for (var y = WALL + 10; y < HG - 6; y += 24) {
          P.r(0, y, W, 20, "#B23440"); P.r(0, y, W, 1, "#C84A52"); P.r(0, y + 19, W, 1, "#7A1E28");
          for (var x = 12; x < W - 10; x += 22) { P.r(x + 4, y + 3, 10, 13, "#9A2A34"); P.el(x + 4, y + 1, 10, 6, "#9A2A34"); P.r(x + 8, y + 5, 2, 2, "#E8B65A"); P.r(x + 5, y + 14, 8, 1, "#2E6A4E"); }
        }
        P.r(0, WALL, W, 4, "#6A1A22");
      },
      wall: function (P, R) {
        plaster(P, 0, 6, W, WALL - 6, "#EADFC6", R);
        for (var y = 30; y < WALL; y += 8) for (var x = (y / 8) % 2 ? 0 : 12; x < W; x += 24) P.r(x, y, 1, 8, "#D8CCB0");
        for (var y2 = 30; y2 < WALL; y2 += 8) P.r(0, y2, W, 1, "#D8CCB0");
        P.r(0, 10, W, 14, "#1F5A44"); P.r(0, 10, W, 1, "#E8B65A"); P.r(0, 23, W, 1, "#E8B65A"); P.r(0, 25, W, 2, "#C8B898");
        // the mihrab
        var mx = 98;
        P.r(mx, 28, 36, WALL - 28, "#2A6A8A"); P.el(mx, 20, 36, 20, "#2A6A8A");
        for (var ty = 30; ty < WALL; ty += 4) for (var tx = mx + 2 + ((ty / 4) % 2 ? 2 : 0); tx < mx + 34; tx += 4) P.r(tx, ty, 2, 2, ty % 8 ? "#4CA0B8" : "#E8B65A");
        P.r(mx + 7, 36, 22, WALL - 36, "#183A4A"); P.el(mx + 7, 28, 22, 16, "#183A4A"); P.r(mx + 9, 40, 18, WALL - 40, "#20485A");
        P.r(mx - 2, 28, 2, WALL - 28, "#E8B65A"); P.r(mx + 36, 28, 2, WALL - 28, "#E8B65A");
        // stained-glass windows
        [22, 182].forEach(function (wx) {
          P.r(wx - 1, 32, 30, 44, "#C8B898"); P.el(wx - 1, 26, 30, 16, "#C8B898");
          P.r(wx + 2, 36, 24, 38, "#2A3050"); P.el(wx + 2, 30, 24, 14, "#2A3050");
          var cols = ["#E8503F", "#4F97E8", "#FFD25A", "#4CBF73", "#B86BE0"];
          for (var gy = 34; gy < 72; gy += 5) for (var gx = wx + 4; gx < wx + 24; gx += 5) P.r(gx, gy, 3, 3, cols[((gx + gy) / 5 | 0) % 5]);
          P.r(wx + 13, 30, 2, 44, "#C8B898");
        });
        // the prayer times board
        frame(P, 62, 36, 28, 22, "#6A4530", "#1E1A22");
      },
      seed: 3
    });
    return {
      id: "mosque", name: "جامع الحارة", sub: "سكينة", W: W, HGT: HG, ground: s.c, bed: "mosqueIn", wall: WALL,
      // The men pray in front; the women's rows are behind the mashrabiya, with their own door in the middle of the
      // back wall. The men come in by the door on the right and walk up a side passage behind a partition, so the
      // two halves never meet.
      props: [
        { k: "minbar", x: 140, y: 112, block: [24, 10] },
        { k: "column", x: 10, y: 150, block: [12, 6] },
        { k: "column", x: 206, y: 150, block: [12, 6] },
        { k: "column", x: 10, y: 232, block: [12, 6] },
        { k: "shelfQuran", x: 28, y: 112, block: [26, 6] },
        { k: "rehal", x: 64, y: 110, noblock: true },
        { k: "rehal", x: 176, y: 180, noblock: true },
        { k: "rehal", x: 58, y: 222, noblock: true },
        { k: "screen", o: { w: 92 }, x: 8, y: 206, block: [92, 5] },
        { k: "screen", o: { w: 32 }, x: 100, y: 206, block: [32, 5] },
        { k: "screen", o: { w: 58 }, x: 132, y: 206, block: [58, 5] },
        { k: "screenSide", o: { d: 10 }, x: 186, y: 218, block: [5, 12] },
        { k: "screenSide", o: { d: 10 }, x: 186, y: 228, block: [5, 11] },
        { k: "screenSide", o: { d: 10 }, x: 186, y: 238, block: [5, 11] },
        { k: "screenSide", o: { d: 10 }, x: 186, y: 248, block: [5, 11] },
        { k: "screenSide", o: { d: 8, end: true }, x: 186, y: 256, block: [5, 9] },
        { k: "shoeRack", x: 38, y: 256, block: [30, 6] },
        { k: "cooler", x: 170, y: 254, block: [10, 5], look: "cooler" },
        { k: "cooler", x: 212, y: 218, block: [10, 5], look: "cooler" },
        { k: "shoePairs", o: { n: 4, seed: 5 }, x: 214, y: 254, noblock: true }
      ],
      fixtures: [
        { layer: "wall", draw: function (R) {
          R.text("بسم الله الرحمن الرحيم", 116, 17, 9, "#F2D27A");
          var dg = ["#FF5A4A", "#FF5A4A"];
          R.text("المغرب ٥:٤٦", 76, 42, 4.6, dg[0], "sans"); R.text("العشاء ٧:٠٤", 76, 48, 4.6, "#FFD25A", "sans"); R.text("الفجر ٤:٥٢", 76, 54, 4.6, "#8AD0FF", "sans");
          var gl = 0.6 + 0.3 * Math.sin(R.T * 1.3);
          R.alpha(gl); R.rect(115, 44, 2, 6, "#FFE7A0"); R.rect(113, 50, 6, 4, "#FFD25A"); R.rect(114, 54, 4, 1, "#C8963E"); R.alpha(1);
          for (var y = 28; y < 44; y++) R.rect(116, y, 1, 1, "#C8963E");
        } },
        { layer: "sort", y: 207, draw: function (R) { // a small plaque on the screen: who is behind it
          R.rect(98, 186, 36, 9, "#3A2216"); R.rect(99, 187, 34, 7, "#F3E6C6");
          R.text("مصلى السيدات", 116, 192.4, 4.4, "#5A3624", "sans");
        } },
        { layer: "wall", draw: function (R) { // the men's door, in the right of the back wall
          R.rect(196, HG - 6, 24, 6, "#8A7460"); R.rect(196, HG - 6, 24, 1, "#B8A088"); R.rect(196, HG - 2, 24, 2, "#F2D8A8");
          R.rect(199, HG - 14, 18, 7, "#B5473B"); R.rect(200, HG - 13, 16, 5, "#D9A25E");
        } }
      ],
      over: function (R) { // the chandelier, the hanging lamps, the fans
        var cx = 116;
        for (var y = 0; y < 76; y++) R.rect(cx, y, 1, 1, "#8A6224");
        R.rect(cx - 22, 76, 45, 2, BRASS[0]); R.rect(cx - 16, 82, 33, 2, BRASS[0]); R.rect(cx - 9, 87, 19, 2, BRASS[0]);
        R.rect(cx - 2, 89, 5, 4, BRASS[2]);
        for (var i = -20; i <= 20; i += 4) { R.rect(cx + i, 73, 1, 3, R.on > 0.3 ? "#FFF2C0" : "#E8E0D0"); }
        for (var j = -14; j <= 14; j += 4) R.rect(cx + j, 79, 1, 3, R.on > 0.3 ? "#FFF2C0" : "#E8E0D0");
        for (var k = -7; k <= 7; k += 4) R.rect(cx + k, 84, 1, 3, R.on > 0.3 ? "#FFF2C0" : "#E8E0D0");
        [[50, 120], [182, 120], [50, 200], [182, 200]].forEach(function (L, n) {
          for (var y2 = 0; y2 < L[1] - 40; y2++) R.rect(L[0], y2, 1, 1, "rgba(138,98,36,0.7)");
          var c = ["#4CBF73", "#4F97E8", "#FFD25A", "#E8503F"][n];
          R.rect(L[0] - 2, L[1] - 40, 5, 1, BRASS[0]); R.rect(L[0] - 3, L[1] - 39, 7, 5, R.on > 0.3 ? A.lt(c, 0.4) : c); R.rect(L[0] - 1, L[1] - 34, 3, 2, BRASS[2]);
        });
        [[80, 150], [152, 150]].forEach(function (F, n) {
          for (var y3 = 0; y3 < 96; y3++) R.rect(F[0], y3, 1, 1, "rgba(60,50,50,0.6)");
          var a = R.T * 2.2 + n;
          for (var b = 0; b < 3; b++) { var aa = a + b * 2.094; for (var r = 2; r < 13; r++) R.rect(F[0] + Math.round(Math.cos(aa) * r), 96 + Math.round(Math.sin(aa) * r * 0.35), 1, 1, "#E8E2D6"); }
          R.rect(F[0] - 1, 95, 3, 2, "#5A5A66");
        });
      },
      walk: [[8, 92, W - 16, HG - 98], [104, HG - 8, 24, 6], [196, HG - 8, 24, 6]],
      // the two halves: tapping the other one says so instead of walking there
      halves: [{ r: [8, 207, 178, HG - 207], who: "f", t: "ده مصلى السيدات. الرجالة بيصلوا قدام." },
              { r: [8, 84, W - 16, 122], who: "m", t: "ده مصلى الرجال. السيدات بيصلوا ورا المشربية." },
              { r: [191, 207, W - 199, HG - 207], who: "m", t: "ده مدخل الرجال." }],
      lights: [
        { x: 116, y: 100, r: 150, c: [255, 222, 160], when: "on", g: 0.55 },
        { x: 116, y: 52, r: 30, c: [255, 220, 130], when: "always", g: 0.6 },
        { x: 50, y: 82, r: 40, c: [120, 230, 160], when: "on", g: 0.7 }, { x: 182, y: 82, r: 40, c: [130, 180, 255], when: "on", g: 0.7 },
        { x: 50, y: 162, r: 40, c: [255, 220, 120], when: "on", g: 0.7 }, { x: 182, y: 162, r: 40, c: [255, 140, 120], when: "on", g: 0.7 }
      ],
      wins: [{ x: 24, y: 30, w: 26, h: 44, glass: 1 }, { x: 184, y: 30, w: 26, h: 44, glass: 1 }],
      exits: [{ r: [104, HG - 16, 24, 16], to: "hara", spot: "mosque", who: "f" },
              { r: [196, HG - 16, 24, 16], to: "hara", spot: "mosque", who: "m" }],
      spawn: { hara: [208, 244, 1], haraF: [116, 244, 1] },
      // taraweeh: rows of worshippers who stand, bow and prostrate together
      pray: { imam: [116, 102], rows: [124, 148, 172], women: [214, 238], xs: [38, 60, 82, 104, 128, 150, 172, 194] },
      people: function (time) {
        if (time === "night") {
          var men = ["m2", "m7", "m3", "m1", "m4", "m5", "m6", "m8", "k1", "k3", "fawzy", "maalem", "bashir", "sayed", "m2", "m7", "hassan", "m3", "m6", "k5"];
          var out = [{ id: "sheikh", cast: "sheikh", name: "الشيخ عبد الله", at: [116, 102, 1], pray: "imam", say: [{ t: "«تقبّل الله منا ومنكم.»" }] }], n = 0;
          [124, 148, 172].forEach(function (y, row) {
            [38, 60, 82, 104, 128, 150, 172, 194].forEach(function (x) {
              if (row === 2 && (x === 38 || x === 194)) return;
              if (row === 1 && x === 104) return; // a place left for you in the second row
              var c = men[n++ % men.length];
              out.push({ cast: c, name: "", at: [x, y, 1], pray: "row", slot: row + "," + x });
            });
          });
          // the women's rows, leaving the middle of the front row for you and the way in from their door clear
          [[34, 214], [52, 214], [70, 214], [88, 214], [124, 214], [142, 214], [160, 214], [176, 214],
           [44, 238], [62, 238], [80, 238], [150, 238], [168, 238]].forEach(function (p, i) {
            var c = ["w1", "w3", "w2", "w4", "w5", "w6", "omyoussef", "k6", "w3", "w1", "w4", "w2", "w6"][i];
            out.push({ cast: c, name: "", at: [p[0], p[1], 1], pray: "row", slot: "w," + i });
          });
          return out;
        }
        if (time === "maghrib") return [
          { cast: "m2", name: "عم فتحي", at: [70, 140, 1, "kneel"], say: ["«فطرنا على تمرة ونزلنا نصلي. الأكل مش هيطير.»"] },
          { cast: "m7", name: "الحاج سليمان", at: [150, 132, 1, "kneel"], say: ["«تقبّل الله.»"] },
          { cast: "w3", name: "الحاجة فاطمة", at: [140, 232, 1, "kneel"], say: ["«تقبّل الله يا {حبيبي|حبيبتي}.»"] }];
        return [
          { id: "sheikh", cast: "sheikh", name: "الشيخ عبد الله", at: [100, 118, 0, "sit"], say: [{ t: "«أهلًا يا {ابني|بنتي}. الجامع بيتك.»" }, { t: "«التراويح بعد العشا، {متتأخرش|متتأخريش}.»" }] },
          { cast: "m7", name: "الحاج سليمان", at: [178, 192, 1, "kneel"], say: ["«أنا بقرأ جزء كل يوم. الختمة يوم ٢٩ إن شاء الله.»"] },
          { cast: "m2", name: "عم فتحي", at: [24, 162, 0, "sit"], sleep: true, say: ["«…زززز… رمضان كريم… زززز»"] },
          { cast: "w3", name: "الحاجة فاطمة", at: [60, 234, 1, "kneel"], say: ["«بقرأ جزء عمّ للمرة الألف. كل مرة بلاقي فيه حاجة جديدة.»", "«الجامع ده اتجوزت فيه، وجوّزت فيه ولادي.»"] },
          { cast: "w1", name: "أم سعاد", at: [150, 230, 0, "sit"], say: ["«بنيجي من بدري عشان نلحق مكان في التراويح.»"] }];
      },
      women: { y: 202 }
    };
  };

  // كشري أبو ياسر: white tiles, the steel bar, marble tables. Empty while people fast, packed at iftar.
  ROOMS.koshari = function () {
    var W = 176, HG = 182, WALL = 60;
    var s = shell(W, HG, WALL, {
      floor: function (P) { checker(P, 0, WALL, W, HG - WALL, "#E8E6E0", "#2E2A30", 8); },
      wall: function (P, R) {
        grid(P, 0, 6, W, WALL - 6, "#F4F6F2", "#D0D8D8", 6);
        P.r(0, 40, W, 5, "#C8443A"); P.r(0, 40, W, 1, "#E8706A");
        frame(P, 10, 12, 30, 26, "#C8443A", "#C8D8E0"); P.r(13, 15, 24, 20, "#B8CCD8"); P.line(15, 33, 33, 15, "#E8F4F8"); P.line(19, 33, 35, 17, "#E8F4F8");
        frame(P, 118, 9, 50, 28, "#6A4530", "#B5473B");
        khayamiya(P, 0, 6, W, 5);
      },
      seed: 4
    });
    return {
      id: "koshari", name: "كشري أبو ياسر", sub: "الدقة والشطة على الحساب", W: W, HGT: HG, ground: s.c, bed: "koshariIn", wall: WALL,
      props: [
        { k: "kosharyBar", o: { w: 110 }, x: 56, y: 96, block: [110, 8], steam: [12, -30] },
        { k: "marbleTable", o: { set: 0 }, x: 18, y: 128, block: [16, 5], id: "t1", setBy: { maghrib: 1, night: 1 } },
        { k: "marbleTable", o: { set: 0 }, x: 18, y: 160, block: [16, 5], id: "t2", setBy: { maghrib: 1, night: 1 } },
        { k: "marbleTable", o: { set: 0 }, x: 86, y: 138, block: [16, 5], id: "t3", setBy: { maghrib: 1, night: 1 } },
        { k: "marbleTable", o: { set: 0 }, x: 138, y: 164, block: [16, 5], id: "t4", setBy: { maghrib: 1, night: 1 } },
        { k: "stool", x: 10, y: 126, noblock: true }, { k: "stool", x: 38, y: 126, noblock: true },
        { k: "stool", x: 10, y: 158, noblock: true }, { k: "stool", x: 38, y: 158, noblock: true },
        { k: "stool", x: 78, y: 136, noblock: true }, { k: "stool", x: 106, y: 136, noblock: true },
        { k: "stool", x: 130, y: 162, noblock: true }, { k: "stool", x: 158, y: 162, noblock: true }
      ],
      fixtures: [
        { layer: "wall", draw: function (R) {
          R.text("المنيو", 143, 14, 5, "#FFE7A0", "sans");
          R.text("كشري صغير ٢٠", 143, 21, 4.4, "#FFFFFF", "sans"); R.text("وسط ٣٠ · كبير ٤٥", 143, 27, 4.4, "#FFFFFF", "sans"); R.text("طاجن مكرونة ٥٠", 143, 33, 4.4, "#FFFFFF", "sans");
          var on = 0.75 + 0.25 * Math.sin(R.T * 7) * Math.sin(R.T * 3.1);
          R.alpha(on); R.text("أبو ياسر", 78, 22, 10, "#FF7AB0"); R.alpha(1);
          for (var i = 0; i < 4; i++) R.rect(50 + i * 18, 31, 10, 1, "#7AFFC8");
        } },
        { layer: "sort", y: 97, draw: function (R) { // Abu Yasser's spoon, clanging on the bowl
          var up = ((R.T * 2.6) | 0) % 2;
          R.rect(104, 74 - (up ? 3 : 0), 1, 6, "#C8D0D8"); R.rect(103, 73 - (up ? 3 : 0), 3, 2, "#E8ECF0");
        } }
      ],
      over: function (R) {
        R.rect(30, 6, 1, 18, "#3A2E36"); R.rect(146, 6, 1, 18, "#3A2E36");
        R.rect(26, 24, 128, 2, "#F4FAFF"); R.rect(26, 26, 128, 1, "#8A909E");
        var a = R.T * 3;
        for (var b = 0; b < 3; b++) { var aa = a + b * 2.094; for (var r = 2; r < 14; r++) R.rect(88 + Math.round(Math.cos(aa) * r), 44 + Math.round(Math.sin(aa) * r * 0.35), 1, 1, "#E8E2D6"); }
        R.rect(87, 43, 3, 2, "#5A5A66"); R.rect(88, 26, 1, 17, "#3A2E36");
      },
      strings: [{ k: "lanterns", x0: 6, y0: 52, x1: 170, y1: 52, sag: 10 }],
      walk: [[8, 100, W - 16, HG - 106], [76, HG - 8, 24, 6]],
      lights: [
        { x: 88, y: 60, r: 130, c: [235, 245, 255], when: "always", g: 0.25 },
        { x: 78, y: 22, r: 40, c: [255, 120, 180], when: "always", g: 0.6, fl: 2 }
      ],
      wins: [],
      exits: [exitAt(W, HG, "koshari")],
      spawn: { hara: [88, 158, 1] },
      people: function (time) {
        var out = [
          { id: "abuyasser", cast: "abuyasser", name: "أبو ياسر", at: [104, 79, 0], talk: [100, 106], say: [
            { when: "maghrib", t: "«بالهنا والشفا! كله ياكل، الأطباق جاية!»" },
            { when: "asr", t: "«لسه بحمّر البصل. بعد المغرب المحل ده بيتقلب فرح.»" },
            { t: "«كشري سخن! صحن ولا اتنين؟»" }] },
          { cast: "kworker", name: "عبده", at: [146, 79, 0], talk: [146, 106], say: ["«البصل ده سر الصنعة. ما {تقولش|تقوليش} لحد.»"] }];
        var seats = [[10, 126, 3], [38, 126, 2], [10, 158, 3], [38, 158, 2], [78, 136, 3], [106, 136, 2], [130, 162, 3], [158, 162, 2]];
        var who = ["m1", "w4", "m3", "k3", "m6", "w5", "m8", "k5"], names = ["حمادة", "أم هاني", "الأستاذ عادل", "عمر", "عم رمضان", "أم سمير", "أشرف", "حودة"];
        var lines = ["«ده أحلى كشري في مصر. أنا مسافر كتير وعارف.»", "«{دوق|دوقي} الدقة دي… نار!»", "«الصيام كان طويل النهارده.»", "«ماما قالت طبق صغير. أنا طلبت كبير.»"];
        if (time === "maghrib" || time === "night") seats.forEach(function (st, i) { out.push({ cast: who[i], name: names[i], at: [st[0] + 4, st[1] - 1, st[2], "sit"], say: [lines[i % 4]] }); });
        if (time === "night") { out.push({ cast: "m7", name: "الحاج سليمان", at: [60, 118, 1], say: ["«واحد كشري تيك أواي، وزوّد البصل.»"] }); out.push({ cast: "k6", name: "سلمى", at: [124, 120, 1], say: ["«بابا قال أطلب طبق ليا لوحدي!»"] }); }
        var take = ["«تلات علب تيك أواي للفطار، الله يكرمك.»", "«ريحة البصل دي امتحان للصايم.»", "«أنا جاي آخد طلب ماما بس… والله.»"];
        if (time === "pre") [[68, 112], [88, 114], [112, 112]].forEach(function (q, i) { out.push({ cast: ["w2", "m5", "k1"][i], name: ["أم كريم", "دكتور هشام", "زياد"][i], at: [q[0], q[1], 1], say: [take[i]] }); });
        return out;
      }
    };
  };

  // الكبابجي: the charcoal, the smoke, the family tables
  ROOMS.kebab = function () {
    var W = 176, HG = 182, WALL = 60;
    var s = shell(W, HG, WALL, {
      floor: function (P, R) { grid(P, 0, WALL, W, HG - WALL, "#C8704E", "#A85A3E", 10); P.dots(0, WALL, W, HG - WALL, ["#D8805E", "#B8603E"], 120, R); },
      wall: function (P, R) {
        plaster(P, 0, 6, W, WALL - 6, "#E8C898", R);
        P.r(0, 34, W, WALL - 34, "#7A4A31"); for (var x = 0; x < W; x += 8) P.r(x, 34, 1, WALL - 34, "#5C3524"); P.r(0, 33, W, 2, "#C8963E");
        P.r(6, 8, 64, 20, "#9AA2AC"); P.r(6, 8, 64, 2, "#C8D0D8"); P.r(10, 28, 56, 6, "#6A707E"); P.r(36, 0, 8, 8, "#6A707E"); // the hood
        frame(P, 78, 8, 52, 18, "#C8963E", "#1F5A3A");
        frame(P, 138, 10, 12, 14, "#8A6224", "#C8B8A0"); frame(P, 154, 14, 12, 10, "#8A6224", "#B8C8A0");
        [[84, 30], [96, 30], [108, 30]].forEach(function (p) { P.el(p[0], p[1], 9, 9, "#B86A3A"); P.el(p[0] + 1, p[1] + 1, 7, 7, "#D88A4A"); P.r(p[0] + 4, p[1] - 4, 1, 4, "#5A4030"); });
      },
      seed: 5
    });
    return {
      id: "kebab", name: "الكبابجي", sub: "الفحم ولّع", W: W, HGT: HG, ground: s.c, bed: "kebabIn", wall: WALL,
      props: [
        { k: "grillBar", x: 12, y: 94, block: [52, 8], smoke: [26, -20] },
        { k: "showFridge", x: 136, y: 94, block: [26, 6] },
        { k: "woodTable", o: { w: 30 }, x: 14, y: 134, block: [28, 6], id: "k1", setBy: { maghrib: 1, night: 1 } },
        { k: "woodTable", o: { w: 30 }, x: 84, y: 128, block: [28, 6], id: "k2", setBy: { maghrib: 1, night: 1 } },
        { k: "woodTable", o: { w: 30 }, x: 132, y: 160, block: [28, 6], id: "k3", setBy: { maghrib: 1, night: 1 } },
        { k: "chair", o: { c: "#C8443A", f: 3 }, x: 4, y: 132, noblock: true }, { k: "chair", o: { c: "#C8443A", f: 2 }, x: 44, y: 132, noblock: true },
        { k: "chair", o: { c: "#2F7A9A", f: 3 }, x: 74, y: 126, noblock: true }, { k: "chair", o: { c: "#2F7A9A", f: 2 }, x: 114, y: 126, noblock: true },
        { k: "chair", o: { c: "#C8963E", f: 3 }, x: 122, y: 158, noblock: true }, { k: "chair", o: { c: "#C8963E", f: 2 }, x: 162, y: 158, noblock: true }
      ],
      fixtures: [
        { layer: "wall", draw: function (R) { R.text("الكبابجي", 104, 17, 8, "#FFD98A"); } },
        { layer: "sort", y: 95, draw: function (R) { // embers breathing, the fan going
          for (var i = 0; i < 10; i++) { var on = Math.sin(R.T * 5 + i * 1.7) > 0.3; if (on) R.rect(16 + i * 5, 79, 2, 1, "#FFE680"); }
          var f = Math.sin(R.T * 9) > 0;
          R.rect(52, 70 + (f ? 0 : 2), 6, 4, "#C8A060"); R.rect(54, 74 + (f ? 0 : 2), 1, 3, WOOD[2]);
        } }
      ],
      over: function (R) { for (var x = 70; x < 176; x += 24) { R.rect(x, 6, 1, 26, "#3A2E36"); R.rect(x - 1, 32, 3, 3, R.on > 0.3 ? "#FFF2C0" : "#E8E0D0"); } },
      strings: [{ k: "flags", x0: 6, y0: 44, x1: 170, y1: 48, sag: 8 }],
      walk: [[8, 100, W - 16, HG - 106], [76, HG - 8, 24, 6]],
      lights: [
        { x: 38, y: 82, r: 70, c: [255, 140, 70], when: "always", g: 0.6, fl: 1 },
        { x: 94, y: 40, r: 50, c: [255, 220, 150], when: "on", g: 0.5 }, { x: 142, y: 40, r: 50, c: [255, 220, 150], when: "on", g: 0.5 },
        { x: 148, y: 78, r: 30, c: [220, 240, 255], when: "always", g: 0.3 }
      ],
      wins: [],
      exits: [exitAt(W, HG, "kebab")],
      spawn: { hara: [88, 158, 1] },
      people: function (time) {
        var out = [{ cast: "kebabgi", name: "الكبابجي", at: [38, 86, 0], talk: [40, 104], say: [
          { when: "asr", t: "«بنتبّل اللحمة من الضهر. الفحم بيولع ساعة المغرب بالظبط.»" },
          { t: "«كفتة ولا كباب؟ ولا الاتنين؟ الاتنين.»" }] }];
        var fam = [[8, 132, 3, "m4"], [48, 132, 2, "w2"], [78, 126, 3, "m3"], [118, 126, 2, "w1"], [126, 158, 3, "m5"], [166, 158, 2, "w6"]];
        var kids = [[28, 146, 1, "k1"], [98, 140, 1, "k4"], [146, 172, 1, "k2"]];
        if (time === "maghrib" || time === "night") {
          fam.forEach(function (f) { out.push({ cast: f[3], name: "الجيران", at: [f[0] + 4, f[1] - 1, f[2], "sit"], say: ["«{اتفضل|اتفضلي} معانا!»", "«الكفتة النهارده حكاية.»"] }); });
          kids.forEach(function (k) { out.push({ cast: k[3], name: "العيال", at: [k[0], k[1], k[2]], say: ["«أنا كلت ٣ أسياخ!»"] }); });
        }
        if (time === "pre") [[70, 110, "m6"], [96, 112, "w4"]].forEach(function (q) { out.push({ cast: q[2], name: "زبون", at: [q[0], q[1], 1], say: ["«نص كيلو كفتة للفطار، وما تنساش العيش.»"] }); });
        return out;
      }
    };
  };

  // ورشة عم صابر: dusty and shut at first; bright and full of lanterns once he opens it again
  ROOMS.workshop = function (day) {
    var open = day >= DAYS.workshopOpen, W = 176, HG = 176, WALL = 60;
    var s = shell(W, HG, WALL, {
      floor: function (P, R) {
        plaster(P, 0, WALL, W, HG - WALL, open ? "#C8A87E" : "#A89478", R);
        P.dots(0, WALL, W, HG - WALL, ["#E8D0A0", "#F2DEB0", "#D8B888"], open ? 260 : 120, R);
        for (var i = 0; i < 14; i++) { var x = (R() * (W - 20)) | 0, y = WALL + 4 + ((R() * (HG - WALL - 12)) | 0); P.r(x, y, 4 + ((R() * 4) | 0), 1, "#E8C890"); }
      },
      wall: function (P, R) {
        plaster(P, 0, 6, W, WALL - 6, open ? "#D8BC94" : "#B89A78", R);
        for (var b = 0; b < 6; b++) { var bx = (R() * (W - 20)) | 0, by = 10 + ((R() * 30) | 0); for (var j = 0; j < 3; j++) P.r(bx + (j % 2) * 3, by + j * 3, 8, 2, "#A86A4A"); }
        // pegboard with tools; on day one some are gone, only their outlines left
        P.r(14, 12, 60, 34, "#8A6A4A"); P.dots(15, 13, 58, 32, ["#6A4A30"], 120, R);
        var tools = [[18, 16, 3, 14, "#5A5A66"], [24, 16, 10, 4, "#C8A060"], [38, 16, 2, 16, "#8A8A96"], [44, 18, 8, 8, "#B8B0A6"], [56, 16, 3, 12, "#5A5A66"], [62, 18, 8, 5, "#C8A060"], [20, 34, 14, 3, "#8A6A4A"], [40, 34, 12, 6, "#7A7A86"], [58, 34, 10, 6, "#C8A060"]];
        tools.forEach(function (t, i) {
          if (!open && (i === 1 || i === 4 || i === 7)) { P.r(t[0], t[1], t[2], 1, "#C8B08A"); P.r(t[0], t[1] + t[3] - 1, t[2], 1, "#C8B08A"); P.r(t[0], t[1], 1, t[3], "#C8B08A"); P.r(t[0] + t[2] - 1, t[1], 1, t[3], "#C8B08A"); }
          else { P.r(t[0], t[1], t[2], t[3], t[4]); P.r(t[0], t[1], t[2], 1, lt(t[4], 0.3)); }
        });
        frame(P, 86, 14, 16, 20, "#5C3524", "#C8B8A0"); P.r(90, 18, 8, 6, "#8A7A6A"); P.r(91, 24, 6, 8, "#6A5A4A"); // his father
        frame(P, 108, 16, 14, 16, "#F4EFE4", "#F4EFE4"); P.r(109, 17, 12, 3, "#C8443A"); for (var c = 0; c < 9; c++) P.r(110 + (c % 3) * 4, 22 + ((c / 3) | 0) * 3, 2, 2, "#8A8A96");
        windowAt(P, 132, 12, 26, 24, { fr: "#5C3524", sky: open ? "#A9DAEE" : "#8AA0AA" });
        if (!open) { // cobwebs
          P.line(6, 6, 16, 6, "rgba(240,240,240,0.5)"); P.line(6, 6, 6, 16, "rgba(240,240,240,0.5)"); P.line(6, 14, 14, 6, "rgba(240,240,240,0.5)"); P.line(6, 10, 10, 6, "rgba(240,240,240,0.4)");
          P.line(W - 7, 6, W - 18, 6, "rgba(240,240,240,0.5)"); P.line(W - 7, 6, W - 7, 18, "rgba(240,240,240,0.5)"); P.line(W - 7, 15, W - 15, 6, "rgba(240,240,240,0.5)");
        }
      },
      seed: 6
    });
    var props = [
      { k: "workbench", x: 46, y: 104, block: [34, 6] },
      { k: "planks", x: 112, y: 112, block: [30, 5] },
      { k: "doorHalf", x: 150, y: 98, block: [16, 5] },
      { k: "sawhorse", x: 118, y: 150, block: [22, 4] },
      { k: "toolbox", o: { open: open }, x: 24, y: 150, block: [16, 4] }
    ];
    if (open) props.push({ k: "woodLanterns", o: { n: 6 }, x: 40, y: 72, z: 0, noblock: true, light: "own" }, { k: "woodLanterns", o: { n: 5 }, x: 100, y: 74, z: 0, noblock: true, light: "own" });
    return {
      id: "workshop", name: open ? "ورشة عم صابر" : "ورشة عم صابر", sub: open ? "رجعت تنوّر من تاني" : "تراب ونشارة وريحة خشب قديم", W: W, HGT: HG, ground: s.c, bed: open ? "workshopOpen" : "workshop", wall: WALL,
      dim: open ? 0 : 0.45,
      props: props,
      fixtures: [
        { layer: "wall", draw: function (R) { // a half-made wooden lantern on the bench, and the sign on the door
          if (!R.st.sign) return;
          R.rect(82, HG - 26, 14, 10, "#F4EFE4"); R.rect(82, HG - 26, 14, 1, "#C8B898"); R.text("للبيع", 89, HG - 21, 4.6, "#B5473B", "sans");
        } },
        { layer: "sort", y: 105, draw: function (R) {
          var x = 60, y = 76;
          R.rect(x, y, 7, 1, WOOD[1]); R.rect(x, y + 1, 1, 8, WOOD[0]); R.rect(x + 6, y + 1, 1, 8, WOOD[0]); R.rect(x, y + 9, 7, 1, WOOD[1]); R.rect(x + 3, y - 2, 1, 2, WOOD[2]);
          if (R.st.lamp || open) { R.alpha(0.8); R.rect(x + 1, y + 1, 5, 8, "#FFD25A"); R.alpha(1); }
        } }
      ],
      over: function (R) { for (var y = 0; y < 40; y++) R.rect(64, y, 1, 1, "#3A2E36"); var lit = open || R.st.lamp; R.rect(61, 40, 7, 4, lit ? "#FFF2C0" : "#8A8478"); R.rect(60, 39, 9, 1, "#5A4A4A"); },
      walk: [[8, 108, W - 16, HG - 114], [76, HG - 8, 24, 6]],
      lights: [{ x: 64, y: 70, r: 110, c: [255, 210, 140], when: "always", g: 0.6, need: open ? null : "lamp" }, { x: 145, y: 40, r: 50, c: [170, 190, 255], when: "night", g: 0.25 }],
      wins: [{ x: 132, y: 12, w: 26, h: 24 }],
      exits: [exitAt(W, HG, "workshop")],
      spawn: { hara: [88, 154, 1] },
      people: function (time) {
        if (!open) return [];
        var out = [{ id: "saber", cast: "saberWork", name: "عم صابر", face: "saber_smile", at: [62, 112, 1], work: true, say: [{ t: "«{شايف|شايفة} الفوانيس دي؟ كل واحد فيها فيه حتة من الحارة. {خد|خدي} واحد، ده عليا.»" }] }];
        if (time !== "maghrib") out.push({ cast: "k1", name: "زياد", at: [92, 124, 2], say: ["«عم صابر هيعلّمني أعمل فانوس!»"] }, { cast: "nourah", name: "نورة", face: "nourah", at: [36, 126, 3], say: ["«أنا اللي بلوّن الإزاز! شوف الأحمر ده!»"] });
        return out;
      },
      state: { sign: open ? 0 : 1, lamp: open ? 1 : 0 }
    };
  };

  // السطوح: the hara at your feet, lanterns, pigeons, kites in the afternoon
  ROOMS.roof = function () {
    var W = 208, HG = 196, TOP = 92;
    var sky = cv(W, TOP), SP = Pt(sky), R0 = rng(8), lit = [];
    // the skyline we look at: rooftops, water tanks, dishes, the minaret
    var hs = [[0, 52, 30], [28, 40, 26], [52, 58, 22], [72, 34, 30], [100, 50, 24], [122, 44, 28], [148, 60, 20], [166, 38, 24], [188, 52, 22]];
    hs.forEach(function (h, i) {
      var c = ["#D8B08A", "#C8A0A0", "#B8C0A8", "#D8C0A0", "#C0A890"][i % 5];
      SP.r(h[0], TOP - h[1], h[2], h[1], c); SP.r(h[0], TOP - h[1], h[2], 2, lt(c, 0.25)); SP.r(h[0] + h[2] - 3, TOP - h[1], 3, h[1], dk(c, 0.15));
      for (var wy = TOP - h[1] + 6; wy < TOP - 4; wy += 9) for (var wx = h[0] + 3; wx < h[0] + h[2] - 5; wx += 7) { SP.r(wx, wy, 3, 4, "#5A4A5E"); if ((wx * 7 + wy * 3 + i) % 5 < 2) lit.push([wx, wy]); }
      if (i % 3 === 1) { SP.r(h[0] + 4, TOP - h[1] - 7, 8, 7, "#9AA2AC"); SP.r(h[0] + 4, TOP - h[1] - 7, 8, 1, "#C8D0D8"); }
      if (i % 3 === 2) { SP.el(h[0] + h[2] - 10, TOP - h[1] - 6, 7, 6, "#E8E2D6"); }
    });
    SP.r(96, 2, 10, TOP - 36, "#E8DCC0"); SP.r(96, 2, 3, TOP - 36, "#F8F0DC"); SP.r(94, 22, 14, 3, "#D8CCB0"); SP.r(94, 40, 14, 3, "#D8CCB0"); SP.el(97, -2, 8, 8, "#2E6A4E"); SP.r(100, -4, 2, 3, BRASS[1]);
    var s = shell(W, HG, TOP, {
      floor: function (P, R) { plaster(P, 0, TOP, W, HG - TOP, "#BFB2A0", R); for (var i = 0; i < 8; i++) { var x = (R() * (W - 30)) | 0, y = TOP + 10 + ((R() * 80) | 0); P.r(x, y, 10 + ((R() * 14) | 0), 6, "rgba(60,50,60,0.12)"); } },
      wall: function (P, R) {
        P.r(0, 0, W, TOP, "rgba(0,0,0,0)");
        P.g.clearRect(0, 0, W, TOP - 8);
        P.r(0, TOP - 8, W, 8, "#E2D2B4"); P.r(0, TOP - 8, W, 2, "#F2E6CC"); P.dots(0, TOP - 6, W, 6, ["#D0BE9C"], 60, R);
      },
      noDoor: true, cap: "#3A2C34", seed: 7
    });
    s.P.g.clearRect(0, 0, W, 5); s.P.g.clearRect(0, 0, 5, TOP - 8); s.P.g.clearRect(W - 5, 0, 5, TOP - 8);
    return {
      id: "roof", name: "السطوح", sub: "الحارة كلها تحت رجليك", W: W, HGT: HG, ground: s.c, bed: "roof", wall: TOP, roof: true,
      props: [
        { k: "stairHut", x: 8, y: 168, block: [32, 8] },
        { k: "tank", x: 160, y: 112, block: [26, 6] },
        { k: "dish", x: 12, y: 104, block: [12, 4] },
        { k: "coop", x: 150, y: 178, block: [30, 8] },
        { k: "plantPots", o: { n: 3, seed: 9 }, x: 60, y: 104, block: [24, 4] }
      ],
      fixtures: [
        { layer: "under", draw: function (R) { // the sky behind the hara: it follows the hour
          var top = { asr: ["#7EC0E8", "#CDEAF6"], pre: ["#F2A86A", "#FFE0A8"], maghrib: ["#6A4A8A", "#F28A8A"], night: ["#141640", "#2A2A62"] }[R.time] || ["#7EC0E8", "#CDEAF6"];
          for (var y = 0; y < TOP; y += 4) R.rect(0, y, W, 4, A.mix(top[0], top[1], y / TOP));
          if (R.time === "night") {
            for (var i = 0; i < 30; i++) { var tw = Math.sin(R.T * 2 + i * 1.3); if (tw > 0.2) R.rect((i * 67 + 13) % W, (i * 37 + 5) % 50, 1, 1, tw > 0.8 ? "#FFFFFF" : "#C9CDF0"); }
            R.rect(170, 12, 8, 8, "#FFF4D0"); R.rect(168, 14, 12, 4, "#FFF4D0"); R.rect(173, 12, 5, 6, top[0]);
          }
          R.img(sky, 0, 0);
          if (R.st.workshopLit && R.on > 0.3) { // far away, Saber's workshop has its lamp on again
            R.alpha(0.35 + 0.15 * Math.sin(R.T * 2)); R.rect(144, 56, 14, 12, "#FFD98A"); R.alpha(1);
            R.rect(148, 60, 5, 6, "#FFE7A0"); R.rect(147, 59, 7, 1, "#5A3624"); R.rect(147, 66, 7, 1, "#5A3624");
          }
          if (R.on > 0.3) {
            lit.forEach(function (p, w) { if ((w + ((R.T * 0.15) | 0)) % 9) R.rect(p[0], p[1], 3, 4, w % 6 ? "#FFD98A" : "#9EC8FF"); });
            for (var r = 0; r < 3; r++) for (var x = 94; x < 108; x += 2) R.rect(x, 24 + r * 18, 1, 1, ((x + ((R.T * 4) | 0)) % 3) ? "#7CFFB0" : "#E8FFF0");
          }
        } },
        { layer: "sort", y: 132, draw: function (R) { // laundry on a line between two poles
          R.rect(70, 108, 1, 24, "#6A5A50"); R.rect(140, 106, 1, 26, "#6A5A50");
          for (var x = 71; x < 140; x++) R.rect(x, 110 + Math.round(Math.sin((x - 70) / 70 * Math.PI) * 3), 1, 1, "#4A3E3A");
          var cols = ["#E8503F", "#F4EFE4", "#4F97E8", "#F2C14A", "#4CBF73", "#E86AA0"];
          for (var i = 0, cx = 74; cx < 134; i++) { var w = 4 + (i % 3), sy = 111 + Math.round(Math.sin((cx - 70) / 70 * Math.PI) * 3), sw = Math.round(Math.sin(R.T * 2.4 + i) * 1.2); R.rect(cx, sy, w, 6, cols[i % 6]); R.rect(cx + sw, sy + 6, w, 1, A.dk(cols[i % 6], 0.2)); cx += w + 3; }
        } }
      ],
      strings: [{ k: "lanterns", x0: 0, y0: 90, x1: W, y1: 92, sag: 14 }, { k: "bulbs", x0: 6, y0: 120, x1: 202, y1: 150, sag: 18 }],
      walk: [[8, TOP + 2, W - 16, HG - TOP - 8]],
      lights: [{ x: 150, y: 63, r: 26, c: [255, 210, 120], when: "night", g: 0.8, need: "workshopLit" }].concat(lit.filter(function (p, i) { return i % 2 === 0; }).map(function (p) { return { x: p[0] + 1, y: p[1] + 2, r: 10, c: [255, 200, 120], when: "on", g: 0.55 }; })),
      wins: [],
      exits: [{ r: [12, 168, 26, 12], to: "home" }],
      spawn: { home: [26, 180, 0], hara: [26, 180, 0] },
      people: function (time) {
        if (time === "night") return [
          { id: "youssef", cast: "youssef+l", name: "يوسف", face: "youssef", at: [96, 140, 0], say: [{ t: "«السطوح فيه فوانيس كتير النهارده!»" }] },
          { id: "nourah", cast: "nourah+l", name: "نورة", face: "nourah", at: [120, 142, 2], say: [{ t: "«فانوسي خشب مش بلاستيك! ده هيعيش لحد ما أكبر!»" }] },
          { cast: "k2+l", name: "جنى", at: [76, 156, 3], say: ["«وحوي يا وحوي، إيوحا!»"] },
          { cast: "k3+l", name: "عمر", at: [140, 160, 2], say: ["«بص على الجامع من هنا! الفوانيس عاملة زي النجوم.»"] }];
        if (time === "asr" || time === "pre") return [{ cast: "k3", name: "عمر", at: [110, 130, 1], kite: true, say: ["«{شايف|شايفة} طيارتي؟ أعلى واحدة في الحارة!»"] }];
        return [];
      }
    };
  };

  // which spot on the hara is the door of which room, and when it lets you in
  var DOORS = {
    home: { room: "home", spot: "home" },
    roof: { room: "roof", spot: "roof" },
    bakery: { room: "bakery", spot: "bakery" },
    mosque: { room: "mosque", spot: "mosque" },
    steps: { room: "mosque", spot: "mosque" },
    koshari: { room: "koshari", spot: "koshari" },
    kebab: { room: "kebab", spot: "kebab" },
    workshop: { room: "workshop", spot: "workshop", open: function (day, flags) { return day >= DAYS.workshopOpen || !!flags.workshop; }, shut: "الباب مقفول بقفل صدي، وعليه ورقة: «للبيع». عم صابر ما بيفتحش من شهور." }
  };
  var cache = {};
  H.rooms = {
    DOORS: DOORS,
    LIST: Object.keys(ROOMS),
    build: function (id, day) {
      var key = id + "|" + (id === "workshop" ? (day >= DAYS.workshopOpen ? "open" : "shut") : "");
      if (!cache[key]) { cache[key] = ROOMS[id](day || 1); cache[key].st0 = JSON.stringify(cache[key].state || {}); }
      var r = cache[key];
      r.st = JSON.parse(r.st0);
      return r;
    },
    has: function (id) { return !!ROOMS[id]; },
    // another file can add a room and the hara spot that opens it (js/hara-sahra.js: the suhoor tent)
    add: function (id, make, spot, door) { ROOMS[id] = make; if (H.rooms.LIST.indexOf(id) < 0) H.rooms.LIST.push(id); if (spot) DOORS[spot] = door || { room: id, spot: spot }; },
    kit: { shell: shell, exitAt: exitAt, plaster: plaster, khayamiya: khayamiya, frame: frame, grid: grid, checker: checker }
  };
})();
