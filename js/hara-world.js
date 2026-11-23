/* فوانيس الحارة · the hara for the walking version: its places, its people, and how it changes day by day.
   Painted in code with js/hara-art.js and js/hara-props.js (1 art pixel = 1 canvas pixel). js/map.js runs it.
   Three-quarter view: every building faces south and you see its roof above the front wall.

   The hara is a ring of small places, each with its own ground, light, sound and people:
     ساحة الجامع   the mosque square: limestone, palms, the sabil, the mercy table, the lantern of the days
     سوق الحارة    the market lane: ful cart, koshari, kebab smoke, fruit and dates under awnings
     فرن عم حسن    the bakery: the oven's glow, bread cooling in palm trays, the queue
     قهوة الحارة   the café under the old sycamore, with the kiosk on the corner
     ملعب العيال    the kids' dirt lot behind the mural wall
     زقاق البيت     home: a narrow lane of plants, Hagga Nemat's balcony
     ورشة عم صابر  Saber's yard: shut and "for sale" on Day 1, full of wooden lanterns from Day 12
     جنينة الحارة   an empty lot behind a wall that the neighbours turn into a garden through the month
   DAYS (below) says what opens when. Change the numbers there to move things around the month. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, SK = A.SKIN, cv = A.cv, Pt = A.Pt, rng = A.rng, dk = A.dk, lt = A.lt, mix = A.mix, pick = A.pick;
  var LEAF = A.LEAF, WOOD = A.WOOD, GLASS = A.GLASS, BRASS = A.BRASS;

  /* ================= the calendar of the hara ================= */
  // What changes on which day of Ramadan. Each place or person can say { from, to } days.
  var DAYS = {
    omyoussefStall: 7,     // Om Youssef sells qatayef by the bakery (she is helped on Day 2)
    gardenOpen: 10,        // the neighbours clear the empty lot
    gardenGreen: 20,       // the garden is green, with benches and flowers
    workshopOpen: 12,      // Saber's workshop opens again, now making wooden lanterns
    eid: 30                // Eid: swings, balloons, everyone out
  };
  // A line for the toast when the hara has something new today
  var NEWS = {
    7: "جديد في الحارة: أم يوسف فاتحة ترابيزة قطايف جنب الفرن",
    10: "جنينة الحارة اتفتحت! العيال بيزرعوا فيها",
    12: "ورشة عم صابر رجعت تنوّر من تاني!",
    20: "جنينة الحارة خضّرت. {تعالى|تعالي} {شوف|شوفي}",
    30: "عيد سعيد! الحارة كلها في الشارع"
  };
  function inDays(o, day) { return !o || ((o.from == null || day >= o.from) && (o.to == null || day <= o.to)); }

  /* ================= the people ================= */
  // Clothes and colours follow the painted portraits in assets/faces.
  var CAST = {
    boy: { skin: SK.mid, hair: { style: "short", c: "#2B1F26" }, top: { kind: "robe", c: "#EDE6D6", trim: "#5E8DC4" }, shoes: "#6A4430", lantern: true },
    girl: { skin: SK.mid, head: { kind: "hijab", c: "#E07A8A" }, top: { kind: "robe", c: "#3F9A9A" }, shoes: "#6A4430", lantern: true },
    nemat: { skin: SK.fair, head: { kind: "khimar", c: "#2C2734" }, top: { kind: "robe", c: "#2C2734" }, glasses: true, shoes: "#3A2A26" },
    youssef: { kid: true, skin: SK.tan, hair: { style: "curly", c: "#24191E" }, top: { kind: "tee", c: "#D23B33" }, legs: "#2F4A7A", shoes: "#F2F0EA" },
    malak: { kid: true, skin: SK.mid, hair: { style: "braids", c: "#5A3524" }, top: { kind: "dress", c: "#C266A8" }, shoes: "#F2C14A" },
    omyoussef: { skin: SK.mid, head: { kind: "hijab", c: "#2B3F78" }, top: { kind: "robe", c: "#33437A" }, shoes: "#3A2A26" },
    hassan: { build: "fat", skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, head: { kind: "cap" }, top: { kind: "robe", c: "#F1EDE4" }, apron: "#E8DCC4", mus: "#2B1F26", musBig: true, shoes: "#5A3A2C" },
    saber: { build: "thin", skin: SK.tan, hair: { style: "grey", c: "#B8B2AA" }, head: { kind: "taqiyah" }, top: { kind: "robe", c: "#9C8A66" }, vest: "#6E5A3C", beard: "#C9C2B8", shoes: "#4A3328" },
    saberWork: { build: "thin", skin: SK.tan, hair: { style: "grey", c: "#B8B2AA" }, head: { kind: "taqiyah" }, top: { kind: "robe", c: "#C8B48A" }, apron: "#7A5A3A", beard: "#C9C2B8", shoes: "#4A3328" },
    rizq: { build: "fat", skin: SK.tan, hair: { style: "sides", c: "#241A1E" }, top: { kind: "shirt", c: "#5C7FA6" }, legs: "#2E2A36", mus: "#241A1E", shoes: "#2A2224" },
    mama: { skin: SK.mid, head: { kind: "hijab", c: "#D9543F", pat: ["#2F8A86", "#F2C14A"] }, top: { kind: "robe", c: "#3F8F7A" }, apron: "#E9C46A" },
    sheikh: { skin: SK.tan, head: { kind: "turban" }, top: { kind: "robe", c: "#3A3550" }, beard: "#E8E2D6", shoes: "#2A2224" },
    sayed: { build: "fat", skin: SK.deep, hair: { style: "short", c: "#2B1F26" }, head: { kind: "taqiyah", c: "#E8E2D6" }, top: { kind: "robe", c: "#8EA6B8" }, apron: "#F1EDE4", mus: "#2B1F26" },
    abuyasser: { skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, top: { kind: "shirt", c: "#F1EDE4" }, apron: "#C8443A", legs: "#3A3550", mus: "#2B1F26" },
    kebabgi: { build: "fat", skin: SK.deep, hair: { style: "short", c: "#2B1F26" }, top: { kind: "tee", c: "#F1EDE4" }, legs: "#3D4266", mus: "#2B1F26" },
    bashir: { build: "thin", skin: SK.mid, hair: { style: "grey", c: "#8A8480" }, top: { kind: "shirt", c: "#C9A46A" }, glasses: true, mus: "#8A8480" },
    maalem: { build: "fat", skin: SK.tan, hair: { style: "sides", c: "#3A2A22" }, top: { kind: "robe", c: "#5A4A6A" }, mus: "#2B1F26", musBig: true, shoes: "#3A2A26" },
    fawzy: { skin: SK.deep, hair: { style: "short", c: "#2B1F26" }, head: { kind: "taqiyah", c: "#C8443A" }, top: { kind: "robe", c: "#E8D8B0" }, vest: "#2F5D9A", mus: "#2B1F26" },
    fakahani: { skin: SK.tan, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "shirt", c: "#3F8F5F" }, legs: "#3A3550", apron: "#E8DCC4" },
    mandour: { build: "thin", skin: SK.deep, hair: { style: "short", c: "#2B1F26" }, head: { kind: "cap", c: "#B5473B" }, top: { kind: "robe", c: "#E8E2D6" }, vest: "#B5473B", mus: "#2B1F26" },
    // neighbours who pass by
    w1: { skin: SK.fair, head: { kind: "hijab", c: "#8E5AA8" }, top: { kind: "robe", c: "#5A4A7A" } },
    w2: { skin: SK.tan, head: { kind: "hijab", c: "#F2C14A" }, top: { kind: "robe", c: "#3E78C2" } },
    w3: { skin: SK.mid, head: { kind: "khimar", c: "#6A3A4A" }, top: { kind: "robe", c: "#6A3A4A" } },
    w4: { skin: SK.deep, head: { kind: "hijab", c: "#3F9A62" }, top: { kind: "robe", c: "#C8B07A" } },
    m1: { skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, top: { kind: "shirt", c: "#C9773E" }, legs: "#3D4266", mus: "#2B1F26" },
    m2: { build: "thin", skin: SK.deep, hair: { style: "grey", c: "#8A8480" }, head: { kind: "taqiyah" }, top: { kind: "robe", c: "#B9A88A" }, beard: "#D8D2C8" },
    m3: { skin: SK.mid, hair: { style: "short", c: "#3A2A22" }, top: { kind: "robe", c: "#5E7A5A" } },
    m4: { build: "fat", skin: SK.tan, hair: { style: "sides", c: "#2B1F26" }, top: { kind: "robe", c: "#6E8EB0" }, mus: "#2B1F26" },
    m5: { skin: SK.fair, hair: { style: "short", c: "#5A3A28" }, top: { kind: "shirt", c: "#E8E2D6" }, legs: "#5A4A3A", glasses: true },
    k1: { kid: true, skin: SK.deep, hair: { style: "short", c: "#1F1619" }, top: { kind: "tee", c: "#3F9A62" }, legs: "#E8E2D6", shoes: "#2A2224" },
    k2: { kid: true, skin: SK.fair, hair: { style: "braids", c: "#2B1F26" }, top: { kind: "dress", c: "#F2C14A" }, shoes: "#D8473C" },
    k3: { kid: true, skin: SK.tan, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "tee", c: "#3E78C2" }, legs: "#2A2234", shoes: "#F2F0EA" },
    k4: { kid: true, skin: SK.mid, head: { kind: "hijab", c: "#E86AA0" }, top: { kind: "dress", c: "#4CBF73" }, shoes: "#F2F0EA" }
  };

  /* ================= colours ================= */
  var WALLS = {
    ochre: ["#E6B266", "#F3CD87", "#C99149", "#9E6B38"],
    pink: ["#E8A08E", "#F5BFAC", "#C97E70", "#9E5E56"],
    teal: ["#6DB7AC", "#93D3C6", "#4E9A92", "#387572"],
    cream: ["#EDDAB4", "#F8EBCD", "#D0B78F", "#A88F6E"],
    blue: ["#8EB1D2", "#B2CEE6", "#6E90B6", "#536F96"],
    terra: ["#D47C58", "#E89C74", "#B26246", "#8C4A37"],
    mint: ["#AFD3A2", "#CCE6BF", "#8BB383", "#6A8F66"],
    lilac: ["#B9A3CC", "#D3C3E2", "#9884B0", "#76658E"],
    stone: ["#E2CCA2", "#F2E2BE", "#C9B088", "#A08866"],
    sand: ["#D9B98A", "#ECD2A6", "#BE9C6C", "#967650"]
  };
  var DOORS = {
    green: ["#3F8B5C", "#5DAA77", "#2D6A46"], blue: ["#3F6FA6", "#5E8DC4", "#2E5380"], brown: ["#8A5435", "#A86D47", "#6A3E27"],
    red: ["#B5473B", "#D2665A", "#8C3530"], teal: ["#2F8A86", "#4FAAA4", "#226866"], olive: ["#7A7A3A", "#9A9A55", "#5A5A2A"]
  };
  var CURTAINS = ["#E8D7A8", "#D9A0B0", "#A8C8D8", "#F2C14A", "#C8E0B0", "#E8B0A0"];
  var FLOWERS = { bougainvillea: ["#E0408A", "#F27AB0"], jasmine: ["#FFFFFF", "#F2EEDC"], orange: ["#F08A2A", "#FFC46A"] };

  /* ================= the map ================= */
  var W = 576, HGT = 880;

  // Every building. base: the world y where its front wall meets the ground. fh: front wall height, rh: roof depth.
  var HOUSES = [
    // ---- north of the mosque square ----
    { id: "n1", x: 0, w: 66, base: 236, fh: 86, rh: 22, wall: "stone", dado: "#A08866", door: { x: 46, c: "green" }, balcony: { x: 8, w: 32, f: 2, kind: "wood", rug: "#2F5D9A" }, vine: [{ x: 60, len: 34 }], roof: ["tank", "dish"] },
    { id: "n2", x: 66, w: 78, base: 236, fh: 76, rh: 24, wall: "pink", dado: "#9E5E56", door: { x: 50, c: "brown", arch: true }, mash: { x: 12, f: 1 }, roof: ["coop"] },
    { id: "n3", x: 372, w: 82, base: 236, fh: 80, rh: 22, wall: "ochre", dado: "#9E6B38", door: { x: 10, c: "teal" }, balcony: { x: 36, w: 34, f: 1 }, vine: [{ x: 74, len: 40 }], roof: ["tank", "plants"] },
    { id: "n4", x: 454, w: 122, base: 236, fh: 92, rh: 20, wall: "stone", dado: "#A08866", door: { x: 54, c: "brown", arch: true, big: true }, mash: { x: 14, f: 1 }, mash2: { x: 90, f: 1 }, roof: ["hut", "tank"] },
    // ---- the market lane ----
    { id: "m1", x: 0, w: 54, base: 470, fh: 70, rh: 24, wall: "blue", dado: "#536F96", door: { x: 34, c: "brown" }, balcony: { x: 6, w: 28, f: 1 }, roof: ["laundry", "tank", "dish"], cables: true },
    { id: "m2", x: 54, w: 80, base: 470, fh: 74, rh: 20, wall: "cream", dado: "#C8443A", shop: { x: 10, w: 60, kind: "koshari" }, sign: { x: 12, w: 56, t: "كشري أبو ياسر", bg: "#C8443A", fg: "#FFF3D6" }, awn: ["#C8443A", "#F4EFE4"], roof: ["coop", "plants"], cables: true },
    { id: "m3", x: 134, w: 58, base: 470, fh: 68, rh: 22, wall: "mint", dado: "#4E7A4E", shop: { x: 6, w: 44, kind: "kebab" }, sign: { x: 6, w: 44, t: "الكبابجي", bg: "#2D6A46", fg: "#FFF3D6" }, awn: ["#2D6A46", "#F4EFE4"], roof: ["tank", "laundry"] },
    // ---- the bakery ----
    { id: "bk", x: 222, w: 138, base: 492, fh: 80, rh: 22, wall: "stone", dado: "#8A6A4A", shop: { x: 12, w: 96, kind: "bakery" }, sign: { x: 16, w: 60, t: "فرن عم حسن", bg: "#3F8B5C", fg: "#FFF3D6" }, board: { x: 114 }, roof: ["chimney", "tank", "laundry"], vine: [{ x: 132, len: 22 }] },
    // ---- the café under the sycamore ----
    { id: "cf", x: 392, w: 98, base: 452, fh: 76, rh: 22, wall: "terra", dado: "#7A3E2E", shop: { x: 8, w: 82, kind: "cafe" }, sign: { x: 30, w: 62, t: "قهوة الحارة", bg: "#1F4A3A", fg: "#FFE7A0" }, awn: "khayameya", roof: ["tank", "junk"], cafe: true },
    { id: "c2", x: 490, w: 86, base: 452, fh: 86, rh: 20, wall: "lilac", dado: "#76658E", door: { x: 8, c: "blue", arch: true }, balcony: { x: 30, w: 40, f: 2, kind: "wood", rug: "#B8343A" }, vine: [{ x: 4, len: 44, fl: "jasmine" }], roof: ["coop", "plants"] },
    // ---- home ----
    { id: "h1", x: 0, w: 92, base: 660, fh: 86, rh: 22, wall: "pink", dado: "#9E5E56", door: { x: 12, c: "green", arch: true }, balcony: { x: 36, w: 46, f: 1, nemat: true }, vine: [{ x: 88, len: 50 }], roof: ["laundry", "tank", "plants"], nemat: true },
    { id: "h2", x: 92, w: 84, base: 660, fh: 72, rh: 22, wall: "ochre", dado: "#8C4A37", door: { x: 34, c: "blue", arch: true, home: true }, roof: ["kidsroof"], home: true },
    // ---- Saber's yard ----
    { id: "w1", x: 392, w: 78, base: 640, fh: 66, rh: 20, wall: "sand", dado: "#7A5A3A", shop: { x: 8, w: 62, kind: "workshop" }, sign: { x: 12, w: 54, t: "نجارة صابر", bg: "#6A3E27", fg: "#E8D0A0" }, signOpen: { x: 8, w: 62, t: "فوانيس عم صابر", bg: "#6A3E27", fg: "#FFD98A" }, openFrom: DAYS.workshopOpen, roof: ["junk", "tank"], workshop: true },
    { id: "w2", x: 470, w: 106, base: 640, fh: 82, rh: 20, wall: "teal", dado: "#387572", door: { x: 14, c: "red" }, balcony: { x: 54, w: 38, f: 1 }, vine: [{ x: 100, len: 36 }], roof: ["laundry", "dish", "tank"], cables: true }
  ];

  /* ================= painting a building ================= */
  function brickPatch(P, x, y, w, h, R) {
    P.r(x, y, w, h, "#B8674A");
    for (var j = 0; j < h; j += 2) { P.r(x, y + j + 1, w, 1, "#E2C9A6"); for (var i = (j / 2) % 2 ? 0 : 2; i < w; i += 4) P.p(x + i, y + j, "#E2C9A6"); }
    P.dots(x, y, w, h, ["#C97A58", "#9E5038"], (w * h / 6) | 0, R);
  }
  function crack(P, x, y, n, col, R) { for (var i = 0; i < n; i++) { P.p(x, y, col); y++; x += R() < 0.33 ? -1 : R() < 0.5 ? 1 : 0; } }
  // limestone blocks in courses
  function ashlar(P, x0, y0, w, h, Wc, R) {
    P.r(x0, y0, w, h, dk(Wc[0], 0.16));
    for (var y = y0; y < y0 + h; y += 6) {
      var off = (((y - y0) / 6) | 0) % 2 ? 7 : 0;
      for (var x = x0 - off; x < x0 + w; x += 14) {
        var sx = Math.max(x0, x), ex = Math.min(x0 + w, x + 13), bh = Math.min(5, y0 + h - y);
        if (ex <= sx || bh <= 0) continue;
        var c = mix(Wc[0], pick(R, [Wc[1], Wc[2], Wc[0], Wc[0], "#E8C890"]), 0.3 + R() * 0.25);
        P.r(sx, y, ex - sx, bh, c); P.r(sx, y, ex - sx, 1, lt(c, 0.25)); P.r(ex - 1, y + 1, 1, bh - 1, dk(c, 0.1));
        if (R() < 0.3) P.p(sx + ((R() * (ex - sx)) | 0), y + 2, dk(c, 0.16));
        if (R() < 0.08) P.r(sx + 2, y + 1, 3, 2, dk(c, 0.2)); // a chipped corner
      }
    }
  }
  // bougainvillea or jasmine spilling down a wall
  function vineAt(P, x, y, len, R, kind) {
    var fl = FLOWERS[kind || "bougainvillea"];
    P.el(x - 9, y - 4, 20, 8, LEAF[4]); P.el(x - 7, y - 4, 15, 6, LEAF[2]); P.el(x - 5, y - 3, 8, 3, LEAF[0]);
    for (var i = 0; i < len; i += 2) {
      var dx = Math.round(Math.sin(i * 0.32 + x * 0.7) * 2.2), wv = i < len * 0.3 ? 9 : i < len * 0.7 ? 7 : 4;
      P.el(x + dx - (wv >> 1), y + i, wv, 4, i % 6 ? LEAF[2] : LEAF[4]);
      P.el(x + dx - (wv >> 1) + 1, y + i, wv - 3, 2, LEAF[0]);
      if (R() < 0.75) P.p(x + dx - 3 + ((R() * 6) | 0), y + i + ((R() * 3) | 0), fl[0]);
      if (R() < 0.45) P.p(x + dx - 3 + ((R() * 6) | 0), y + i + 1, fl[1]);
    }
    for (var k = 0; k < 10; k++) P.p(x - 8 + ((R() * 17) | 0), y - 3 + ((R() * 6) | 0), R() < 0.6 ? fl[0] : fl[1]);
  }
  function cablesAt(P, w, y, R) {
    P.line(0, y, w - 1, y + 2, "#3A3030");
    P.line(0, y + 3, ((w * 0.6) | 0), y + 4, "#4A3A3A");
    var bx = 6 + ((R() * (w - 16)) | 0); P.r(bx, y - 1, 5, 6, "#A8AEB4"); P.r(bx, y - 1, 5, 1, "#D0D6DA"); P.p(bx + 2, y + 2, "#3A3434");
  }

  function windowAt(P, x, y, ww, wh, Wc, R, o, out) {
    var D = DOORS[o.c || "green"];
    P.r(x - 2, y - 3, ww + 4, 2, Wc[1]); P.r(x - 2, y - 3, ww + 4, 1, lt(Wc[1], 0.35)); P.r(x - 2, y - 1, ww + 4, 1, Wc[2]);
    P.r(x - 1, y, 1, wh, Wc[1]); P.r(x + ww, y, 1, wh, Wc[2]);
    P.r(x - 2, y + wh, ww + 4, 1, lt(Wc[1], 0.2)); P.r(x - 2, y + wh + 1, ww + 4, 1, Wc[3]);
    if (o.kind === "shut") { // closed wooden shutters (شيش)
      P.r(x, y, ww, wh, D[0]);
      for (var j = 1; j < wh; j += 2) P.r(x, y + j, ww, 1, D[2]);
      P.r(x + (ww >> 1), y, 1, wh, D[2]); P.r(x, y, 1, wh, D[1]); P.r(x + (ww >> 1) + 1, y, 1, wh, D[1]);
      if (R() < 0.3) out.win.push({ x: x, y: y, w: ww, h: wh, glow: "slit" });
      return;
    }
    var cur = o.cur || pick(R, CURTAINS);
    if (o.arch) { P.r(x, y - 3, ww, 3, Wc[1]); P.el(x, y - 4, ww, 8, "#3A2838"); }
    P.r(x, y, ww, wh, "#3A2838"); P.r(x, y, ww, 2, "#2A1C2A");
    P.r(x, y, 2, wh, cur); P.r(x + ww - 2, y, 2, wh, dk(cur, 0.15)); P.r(x, y, ww, 1, dk(cur, 0.1));
    if (o.grille) { for (var g = x + 1; g < x + ww; g += 2) P.r(g, y, 1, wh, "#2A2224"); P.r(x, y + (wh >> 1), ww, 1, "#2A2224"); }
    else {
      P.r(x - 4, y, 3, wh, D[0]); P.r(x + ww + 1, y, 3, wh, D[0]);
      for (var k = 1; k < wh; k += 2) { P.r(x - 4, y + k, 3, 1, D[2]); P.r(x + ww + 1, y + k, 3, 1, D[2]); }
      P.r(x - 4, y, 1, wh, D[1]);
    }
    out.win.push({ x: x, y: y, w: ww, h: wh, glow: R() < 0.12 ? "tv" : R() < 0.8 ? "warm" : null, cur: cur });
    if (o.pot) { // a box of flowers on the sill
      var fl = pick(R, ["#E8503F", "#F2C14A", "#E86AA0", "#FFFFFF"]);
      P.r(x - 1, y + wh - 2, ww + 2, 3, "#C9683E"); P.r(x - 1, y + wh - 2, ww + 2, 1, "#DB7E50");
      P.el(x - 1, y + wh - 6, ww + 2, 5, LEAF[0]); P.p(x + 1, y + wh - 5, LEAF[3]);
      P.p(x, y + wh - 6, fl); P.p(x + 3, y + wh - 5, fl); P.p(x + ww - 1, y + wh - 6, fl);
    }
    if (o.ac) { var ax = x + ww + 5; P.r(ax, y + 2, 9, 7, "#E8E6E0"); P.r(ax, y + 2, 9, 1, "#FFFFFF"); P.r(ax + 1, y + 4, 7, 1, "#A8A6A0"); P.r(ax + 1, y + 6, 7, 1, "#A8A6A0"); P.r(ax + 8, y + 3, 1, 6, "#C8C6C0"); P.r(ax + 3, y + 9, 1, 5, "#5A5A5A"); }
  }

  function doorAt(P, x, y, dw, dh, Wc, o) {
    var D = DOORS[o.c || "brown"];
    P.r(x - 2, y - 3, dw + 4, dh + 3, Wc[1]); P.r(x + dw, y - 2, 2, dh + 2, Wc[2]); P.r(x - 2, y - 3, dw + 4, 1, lt(Wc[1], 0.3));
    P.r(x, y, dw, dh, D[0]);
    if (o.arch) {
      P.r(x - 2, y - 7, dw + 4, 4, Wc[1]); P.r(x - 1, y - 8, dw + 2, 1, Wc[1]);
      P.r(x + 1, y - 5, dw - 2, 5, D[0]); P.r(x + 2, y - 6, dw - 4, 1, D[0]);
      P.r(x + 3, y - 5, dw - 6, 3, "#F2C76C"); P.r(x + (dw >> 1), y - 5, 1, 3, dk("#F2C76C", 0.35)); // fanlight
    }
    var half = dw >> 1;
    P.r(x + half, y, 1, dh, D[2]);
    P.r(x + 1, y + 2, half - 2, (dh >> 1) - 3, D[2]); P.r(x + half + 1, y + 2, half - 2, (dh >> 1) - 3, D[2]);
    P.r(x + 1, y + (dh >> 1) + 1, half - 2, (dh >> 1) - 3, D[2]); P.r(x + half + 1, y + (dh >> 1) + 1, half - 2, (dh >> 1) - 3, D[2]);
    P.r(x + 2, y + 3, half - 4, (dh >> 1) - 5, D[0]); P.r(x + half + 2, y + 3, half - 4, (dh >> 1) - 5, D[0]);
    P.r(x + 1, y + 2, 1, dh - 4, D[1]); P.r(x + half + 1, y + 2, 1, dh - 4, D[1]);
    for (var s = y + 4; s < y + dh - 3; s += 5) { P.p(x + 2, s, "#E2B45A"); P.p(x + dw - 3, s, "#E2B45A"); } // studs
    P.p(x + half - 2, y + (dh >> 1), "#F2C76C"); P.p(x + half + 2, y + (dh >> 1), "#F2C76C");
    P.r(x - 3, y + dh - 1, dw + 6, 1, Wc[2]); P.r(x - 2, y + dh, dw + 4, 1, "#B8A888"); // threshold and step
  }

  function awning(P, x, y, w, cols) {
    var kh = cols === "khayameya";
    for (var i = 0; i < w; i++) {
      var c1 = kh ? ["#C8443A", "#2F5D9A", "#F2C14A", "#3F8F5F"][((i / 6) | 0) % 4] : cols[((i / 4) | 0) % 2];
      P.r(x + i, y, 1, 7, c1);
      if (kh && i % 6 === 3) { P.p(x + i, y + 2, "#F4EFE4"); P.p(x + i, y + 4, "#F4EFE4"); }
      if (i % 4 < 2) P.p(x + i, y + 7, c1);
    }
    P.r(x, y, w, 1, "rgba(255,255,255,0.35)");
    P.r(x, y + 8, w, 2, "rgba(40,20,40,0.3)");
  }

  function shopFront(P, b, s, base, out, R, state) {
    var x = s.x, w = s.w, y0 = base - 34, ih = base - y0, k = s.kind, iy = y0 + 4;
    P.r(x - 2, y0 - 3, w + 4, ih + 3, "#5A4A48");
    P.r(x, y0, w, ih, "#3A2830");
    var shutterUp = !(k === "workshop" && state !== "open");
    if (shutterUp) { P.r(x, y0, w, 3, "#9AA0A8"); P.r(x, y0, w, 1, "#C9CDD3"); P.r(x, y0 + 3, w, 1, "#2A1C22"); }
    if (k === "bakery") {
      P.r(x + 2, iy, w - 4, ih - 4, "#4A3430");
      for (var by = iy; by < base - 10; by += 3) for (var bx = x + 2 + ((by / 3) % 2 ? 2 : 0); bx < x + w - 2; bx += 5) P.r(bx, by, 4, 2, "#563A34");
      // the oven: a brick dome with a glowing mouth
      var ox = x + (w >> 1) - 15;
      P.el(ox - 4, iy, 38, 26, "#A0583A"); P.el(ox - 2, iy + 1, 34, 23, "#B8674A");
      for (var oy = iy + 3; oy < iy + 22; oy += 3) P.r(ox, oy, 30, 1, "#9A5038");
      P.el(ox + 5, iy + 8, 20, 16, "#2A1814"); P.r(ox + 5, iy + 16, 20, 9, "#2A1814");
      P.el(ox + 7, iy + 12, 16, 10, "#FF8A2A"); P.el(ox + 9, iy + 15, 12, 6, "#FFD05A"); P.r(ox + 9, iy + 19, 12, 5, "#FFB040");
      out.fire.push({ x: ox + 7, y: iy + 13, w: 16, h: 10 });
      out.glow.push({ x: ox + 15, y: iy + 18, r: 40, c: [255, 160, 70], k: "oven" });
      // racks of bread either side
      [x + 3, x + w - 17].forEach(function (rx) { for (var t = 0; t < 3; t++) { var ty = iy + 2 + t * 7; P.r(rx, ty + 5, 14, 1, "#8A6238"); A.loaf(P, rx, ty + 2, R); A.loaf(P, rx + 6, ty + 2, R); } });
      // the counter, piled with fresh bread
      P.r(x + 2, base - 9, w - 4, 9, "#B98A55"); P.r(x + 2, base - 9, w - 4, 1, "#D9AA70"); P.r(x + 2, base - 4, w - 4, 1, "#8A6238");
      for (var lx = x + 4; lx < x + w - 8; lx += 7) { A.loaf(P, lx, base - 12, R); A.loaf(P, lx + 3, base - 13, R); }
      P.r(x + w - 14, base - 17, 7, 5, "#C9CDD3"); P.p(x + w - 11, base - 18, "#8A8E94");
    } else if (k === "koshari") {
      P.r(x, iy, w, ih - 4, "#EDEBE4"); for (var ty = iy; ty < base; ty += 4) P.r(x, ty, w, 1, "#C9D6E0"); for (var tx = x; tx < x + w; tx += 4) P.r(tx, iy, 1, ih - 4, "#C9D6E0");
      P.r(x, iy + 9, w, 2, "#3F6FA6");
      P.r(x + 4, iy + 2, 14, 6, "#F8F4E8"); P.r(x + 5, iy + 3, 12, 1, "#C8302C"); P.r(x + 5, iy + 5, 9, 1, "#3A3A4A"); // the menu
      P.r(x + 2, base - 11, w - 4, 11, "#C9CDD3"); P.r(x + 2, base - 11, w - 4, 1, "#EEF0F2"); P.r(x + 2, base - 3, w - 4, 1, "#8A8E94");
      for (var px = x + 4; px < x + w - 12; px += 12) { P.el(px, base - 18, 11, 9, "#B9BEC6"); P.el(px + 1, base - 18, 9, 3, "#E8EAED"); P.el(px + 2, base - 17, 7, 2, pick(R, ["#C9753A", "#E8C26A", "#A8402A"])); }
      for (var st = 0; st < 4; st++) P.r(x + w - 9, base - 15 - st * 2, 7, 2, st % 2 ? "#F4F2EC" : "#D9D6CE");
      out.glow.push({ x: x + w / 2, y: base - 16, r: 32, c: [255, 240, 210], k: "shop" });
      out.steam.push({ x: x + 10, y: base - 20 }, { x: x + 34, y: base - 20 });
    } else if (k === "kebab") {
      P.r(x + 2, iy, w - 4, ih - 4, "#4A3430");
      for (var hx = x + 6; hx < x + w - 4; hx += 10) { P.r(hx, iy, 1, 4, "#2A1C22"); P.r(hx - 1, iy + 4, 3, 2, "#FFE7A0"); }
      P.r(x + 2, base - 9, w - 4, 9, "#7A4A31"); P.r(x + 2, base - 9, w - 4, 1, "#9C6542");
      P.r(x + 4, iy + 7, 12, 9, "#E8E2D6"); P.r(x + 5, iy + 8, 10, 1, "#C8443A"); P.r(x + 5, iy + 10, 7, 1, "#8A8484"); P.r(x + 5, iy + 12, 8, 1, "#8A8484");
      for (var sk = 0; sk < 4; sk++) P.r(x + 20, iy + 8 + sk * 3, 16, 1, sk % 2 ? "#8A4024" : "#A85A34"); // skewers ready
      out.glow.push({ x: x + w / 2, y: base - 14, r: 30, c: [255, 190, 120], k: "shop" });
    } else if (k === "cafe") {
      P.r(x + 2, iy, w - 4, ih - 4, "#4A2C30");
      for (var cs = x + 3; cs < x + w - 2; cs += 4) P.r(cs, iy, 1, ih - 14, "#55343A"); // striped wallpaper
      // a gilded mirror, shelves of tea glasses, the TV on its bracket, framed photos
      P.r(x + 4, iy + 2, 18, 13, "#C8963E"); P.r(x + 5, iy + 3, 16, 11, "#9CB8C8"); P.line(x + 7, iy + 12, x + 13, iy + 4, "#D8ECF4"); P.line(x + 9, iy + 12, x + 15, iy + 4, "#C0D8E4");
      for (var sh = 0; sh < 2; sh++) { var sy = iy + 5 + sh * 6; P.r(x + 26, sy + 4, 26, 1, "#7A4A31"); for (var gx = x + 27; gx < x + 51; gx += 3) { P.r(gx, sy + 1, 2, 3, sh ? "#E8E2D6" : "#C2552E"); P.p(gx, sy + 1, "#F2E2C8"); } }
      P.r(x + w - 24, iy + 1, 18, 12, "#1C1A24"); P.r(x + w - 23, iy + 2, 16, 10, "#4F6FA6"); P.r(x + w - 16, iy + 13, 2, 2, "#3A3434");
      out.tv.push({ x: x + w - 23, y: iy + 2, w: 16, h: 10 });
      [[x + 56, "#E8B08A"], [x + 61, "#D8A07A"]].forEach(function (ph) { P.r(ph[0], iy + 16, 4, 5, "#C8963E"); P.r(ph[0] + 1, iy + 17, 2, 3, ph[1]); P.p(ph[0] + 1, iy + 17, "#3A2A2A"); });
      // the counter with the copper kettle and the radio
      P.r(x + 2, base - 11, w - 4, 11, "#8A5435"); P.r(x + 2, base - 11, w - 4, 1, "#BA8155"); P.r(x + 2, base - 6, w - 4, 1, "#6A3E27");
      for (var pn = x + 6; pn < x + w - 4; pn += 8) P.r(pn, base - 9, 5, 3, "#9C6542");
      P.el(x + 8, base - 18, 8, 7, "#C8743A"); P.el(x + 9, base - 17, 3, 3, "#F2A86A"); P.r(x + 15, base - 15, 2, 1, "#C8743A");
      out.steam.push({ x: x + 12, y: base - 20 });
      P.r(x + 22, base - 16, 9, 5, "#8A5435"); P.r(x + 23, base - 15, 3, 3, "#3A3030"); P.r(x + 27, base - 15, 3, 1, "#F2C14A");
      for (var tg = x + 36; tg < x + 58; tg += 4) { P.r(tg, base - 14, 2, 3, "#C2552E"); P.p(tg, base - 14, "#F2E2C8"); }
      out.glow.push({ x: x + w / 2, y: base - 16, r: 38, c: [255, 196, 120], k: "shop" });
      out.decor.push({ k: "bulbs", x0: x - 2, x1: x + w + 2, y: y0 - 1, sag: 3 });
    } else if (k === "workshop") {
      if (state !== "open") {
        // the shutter is down: Saber's shop has been closed for months
        P.r(x, y0, w, ih, "#9AA6AE");
        for (var ly = y0 + 1; ly < base; ly += 2) P.r(x, ly, w, 1, "#7E8A92");
        P.r(x, y0, w, 1, "#C9D2D8"); P.dots(x, y0, w, ih, ["#B2723A", "#9A5A30", "#C9844A"], 34, R);
        P.r(x + (w >> 1) - 2, base - 5, 4, 3, "#3A3434"); P.r(x + (w >> 1) - 1, base - 7, 2, 2, "#6A6E74");
        var nx = x + (w >> 1) - 12; P.r(nx, y0 + 8, 11, 8, "#F8F4E8"); P.r(nx, y0 + 8, 11, 1, "#FFFFFF");
        P.r(nx + 1, y0 + 10, 9, 1, "#C8302C"); P.r(nx + 2, y0 + 12, 6, 1, "#3A3A4A"); P.r(nx + 2, y0 + 14, 4, 1, "#3A3A4A");
        P.p(nx - 1, y0 + 8, "#C9A46A"); P.p(nx + 11, y0 + 8, "#C9A46A");
        out.note = { x: nx + 5, y: y0 + 12 };
        P.dots(x - 2, base - 3, w + 4, 3, ["#B8A888", "#C8B898"], 14, R); // dust on the sill
      } else {
        P.r(x, y0, w, 4, "#9AA0A8"); P.r(x, y0, w, 1, "#C9CDD3"); P.r(x, y0 + 4, w, 1, "#2A1C22"); // shutter rolled up
        P.r(x + 1, iy + 1, w - 2, ih - 5, "#5A3A2C");
        P.r(x + 3, iy + 2, 22, 16, "#8A6A4A"); for (var hy = iy + 4; hy < iy + 18; hy += 3) for (var hx2 = x + 5; hx2 < x + 25; hx2 += 3) P.p(hx2, hy, "#5A4030"); // pegboard
        P.r(x + 5, iy + 4, 8, 2, "#9AA0A8"); P.r(x + 5, iy + 6, 1, 4, "#7A4A31"); P.r(x + 16, iy + 4, 1, 7, "#7A4A31"); P.r(x + 14, iy + 4, 5, 2, "#6A6E74"); P.r(x + 20, iy + 9, 3, 6, "#9AA0A8");
        for (var pl = 0; pl < 4; pl++) P.r(x + w - 14 + pl * 3, iy + 1 + pl, 2, ih - 6 - pl, ["#C08A5A", "#A8714A", "#D29A66", "#9A6440"][pl]);
        for (var wl = 0; wl < 4; wl++) { var lxx = x + 28 + wl * 7, lyy = iy + 2 + (wl % 2) * 4; P.r(lxx + 2, iy, 1, lyy - iy, "#3A2A20"); A.fanousWood(P, lxx, lyy, GLASS[(wl * 2 + 1) % 6]); out.glow.push({ x: lxx + 2, y: lyy + 3, r: 14, c: A.rgb(GLASS[(wl * 2 + 1) % 6]), k: "lantern" }); }
        P.r(x + 2, base - 9, w - 4, 9, "#B88A55"); P.r(x + 2, base - 9, w - 4, 1, "#D9AA70"); // the bench at the front
        for (var sl = 0; sl < 5; sl++) A.fanousWood(P, x + 6 + sl * 11, base - 16, GLASS[(sl + 3) % 6]);
        P.dots(x + 2, base - 4, w - 4, 4, ["#E8CC98", "#F2DEB0"], 22, R);
        out.glow.push({ x: x + w / 2, y: iy + 8, r: 34, c: [255, 200, 130], k: "shop" });
      }
    }
  }

  function balconyAt(P, x, y, w, Wc, R, out, o) {
    // y = slab top. A door behind, a railing in front.
    var wood = o.kind === "wood";
    P.r(x + (w >> 1) - 6, y - 20, 12, 20, "#3A2838"); P.r(x + (w >> 1) - 6, y - 20, 12, 2, "#2A1C2A");
    P.r(x + (w >> 1) - 6, y - 20, 3, 20, pick(R, CURTAINS)); P.r(x + (w >> 1) - 7, y - 22, 14, 2, Wc[1]);
    out.win.push({ x: x + (w >> 1) - 6, y: y - 20, w: 12, h: 20, glow: R() < 0.85 ? "warm" : null });
    if (wood) { // a wooden canopy with a fringe
      P.r(x - 3, y - 27, w + 6, 3, WOOD[0]); P.r(x - 3, y - 27, w + 6, 1, WOOD[1]);
      for (var f = x - 2; f < x + w + 2; f += 2) P.p(f, y - 24, WOOD[2]);
      P.r(x - 1, y - 24, 1, 24, WOOD[2]); P.r(x + w, y - 24, 1, 24, WOOD[3]);
    }
    P.r(x - 1, y, w + 2, 3, wood ? WOOD[0] : Wc[1]); P.r(x - 1, y, w + 2, 1, wood ? WOOD[1] : lt(Wc[1], 0.4)); P.r(x - 1, y + 2, w + 2, 1, wood ? WOOD[3] : Wc[2]);
    P.r(x, y + 3, w, 2, "rgba(40,20,40,0.28)");
    if (wood) {
      P.r(x - 1, y - 9, w + 2, 2, WOOD[0]); P.r(x - 1, y - 9, w + 2, 1, WOOD[1]);
      for (var i = 0; i < w; i += 3) { P.r(x + i, y - 7, 2, 7, WOOD[1]); P.p(x + i + 1, y - 7, WOOD[3]); P.r(x + i, y - 4, 2, 1, WOOD[3]); P.p(x + i, y - 5, lt(WOOD[1], 0.3)); }
    } else {
      P.r(x - 1, y - 8, w + 2, 1, "#2E3A3A");
      for (var j = 0; j < w; j += 3) P.r(x + j, y - 7, 1, 7, "#2E3A3A");
      for (var q = 1; q < w - 2; q += 6) { P.p(x + q + 1, y - 4, "#2E3A3A"); P.p(x + q + 2, y - 5, "#2E3A3A"); P.p(x + q + 3, y - 4, "#2E3A3A"); }
    }
    if (o.nemat) { // Nemat's rug over the railing
      P.r(x + 4, y - 7, 14, 10, "#B8343A"); P.r(x + 5, y - 6, 12, 8, "#2F5D9A"); P.r(x + 7, y - 4, 8, 4, "#F2C14A"); P.r(x + 9, y - 3, 4, 2, "#B8343A"); P.r(x + 4, y + 3, 14, 1, "#F4EFE4");
      P.r(x + w - 6, y - 4, 4, 4, "#C9683E"); P.el(x + w - 7, y - 10, 6, 7, LEAF[0]); P.p(x + w - 5, y - 9, "#E8503F");
    } else {
      if (o.rug) { var rx = x + 3 + ((R() * Math.max(1, w - 20)) | 0); P.r(rx, y - 8, 14, 11, o.rug); P.r(rx + 2, y - 6, 10, 7, lt(o.rug, 0.25)); P.r(rx + 4, y - 4, 6, 3, "#F2C14A"); for (var fz = rx; fz < rx + 14; fz += 2) P.p(fz, y + 3, "#F4EFE4"); }
      P.r(x + 2, y - 4, 4, 4, "#C9683E"); P.el(x + 1, y - 10, 7, 7, LEAF[1]); P.p(x + 3, y - 9, "#E8503F"); P.p(x + 5, y - 7, "#F2C14A");
      P.r(x + w - 6, y - 4, 4, 4, "#C9683E"); P.el(x + w - 7, y - 11, 6, 8, LEAF[0]); P.p(x + w - 5, y - 10, LEAF[3]);
    }
    out.decor.push({ k: "fanous", x: x + (o.nemat ? 26 : w - 4), y: y + 4, c: GLASS[(x + w) % GLASS.length] });
  }

  function mashrabiya(P, x, y) {
    var w = 18, h = 24;
    P.r(x - 1, y - 2, w + 2, 3, WOOD[2]); P.r(x - 1, y - 2, w + 2, 1, WOOD[1]);
    P.r(x, y + 1, w, h - 6, WOOD[0]);
    for (var j = 0; j < h - 7; j++) for (var i = 0; i < w - 2; i++) if ((i + j) % 2 === 0) P.p(x + 1 + i, y + 2 + j, (i % 4 === 0 || j % 4 === 0) ? WOOD[1] : "#2A1C22");
    P.r(x, y + 1, 1, h - 6, WOOD[1]); P.r(x + w - 1, y + 1, 1, h - 6, WOOD[3]);
    P.r(x - 1, y + h - 5, w + 2, 2, WOOD[2]); P.r(x - 1, y + h - 5, w + 2, 1, WOOD[1]);
    P.r(x + 1, y + h - 3, w - 2, 1, WOOD[3]); P.r(x + 3, y + h - 2, w - 6, 1, WOOD[3]); P.r(x + 5, y + h - 1, w - 10, 1, WOOD[3]);
    P.r(x, y + h, w, 2, "rgba(40,20,40,0.3)");
  }

  // A flat concrete roof seen from above, the way Cairo's are: a low parapet all round, painted like the house (its
  // top catches the light; along the back you see its inner face and the shadow it throws), worn concrete with tar
  // patches, damp and hairline cracks, and now and then a column stub at a corner with its rebar still sticking up,
  // waiting for the next floor.
  function concreteRoof(P, x, y, w, h, Wc, R, o) {
    o = o || {};
    var base = mix("#B2A797", Wc[0], 0.16), pc = Wc[0], pL = lt(Wc[1], 0.4), pS = Wc[2];
    P.r(x, y, w, h, base);
    P.dots(x, y, w, h, [dk(base, 0.07), lt(base, 0.08), dk(base, 0.12)], (w * h / 7) | 0, R);
    var i, n = Math.max(1, (w * h / 650) | 0);
    for (i = 0; i < n; i++) { // tar patches over old leaks
      var tx = x + 5 + ((R() * Math.max(1, w - 20)) | 0), ty = y + 8 + ((R() * Math.max(1, h - 14)) | 0), tw = 5 + ((R() * 8) | 0);
      P.el(tx, ty, tw, 3 + ((R() * 2) | 0), dk(base, 0.24)); P.p(tx + 2, ty, dk(base, 0.32)); P.p(tx + tw - 2, ty + 2, lt(base, 0.05));
    }
    for (i = 0; i < n; i++) P.el(x + 4 + ((R() * Math.max(1, w - 20)) | 0), y + 7 + ((R() * Math.max(1, h - 12)) | 0), 9 + ((R() * 9) | 0), 3, dk(base, 0.08)); // damp
    for (i = 0; i < 2; i++) { // a hairline crack
      var cx0 = x + 6 + ((R() * Math.max(1, w - 14)) | 0), cy0 = y + 7 + ((R() * Math.max(1, h - 12)) | 0), len = 4 + ((R() * 6) | 0);
      for (var q = 0; q < len && cy0 < y + h - 3; q++) { P.p(cx0, cy0, dk(base, 0.22)); if (R() < 0.5) cx0 += R() < 0.5 ? 1 : -1; cy0++; }
    }
    // the parapet. Along the back you see its top and its inner face, with a row of breeze-block holes; the sides
    // show their tops; each throws a shadow on the roof.
    var ph = Math.min(8, Math.max(6, (h / 3) | 0));
    if (o.edge) { P.r(x, y - 2, w, 2, "rgba(24,12,28,0.55)"); }        // the drop down to the street, behind it
    P.r(x, y, w, 2, pL); P.r(x, y + 2, w, ph - 3, pc); P.r(x, y + ph - 1, w, 1, pS);
    for (var hx = x + 5; hx < x + w - 5; hx += 4) P.r(hx, y + 3, 2, Math.max(1, ph - 5), dk(pc, 0.5));
    P.r(x, y + ph, w, 3, dk(base, 0.26)); P.r(x, y + ph + 3, w, 2, dk(base, 0.12));
    P.r(x, y, 3, h, pc); P.r(x, y, 2, h, pL); P.r(x + 3, y + ph, 3, h - ph, dk(base, 0.2)); P.r(x + 6, y + ph, 1, h - ph, dk(base, 0.08));
    P.r(x + w - 3, y, 3, h, lt(pS, 0.1)); P.r(x + w - 3, y, 1, h, pL); P.r(x + w - 1, y, 1, h, dk(pS, 0.3));
    if (o.front) { P.r(x + 1, y + h - 4, w - 2, 2, pL); P.r(x, y + h - 2, w, 2, pc); }   // front: its top, then the wall
    if (o.rebar !== false && R() < 0.5) [x + 1, x + w - 5].forEach(function (rx) {
      if (R() < 0.55) return;
      P.r(rx, y - 1, 4, 4, lt(base, 0.08)); P.r(rx, y - 1, 4, 1, lt(base, 0.3)); P.r(rx + 3, y, 1, 3, dk(base, 0.2));
      P.r(rx, y - 6, 1, 5, "#6A4A3A"); P.r(rx + 3, y - 7, 1, 6, "#7A5240"); P.p(rx + 1, y - 4, "#8A5A44"); P.p(rx + 3, y - 7, "#A8705A");
    });
  }
  function roofBand(P, b, x, y, w, h, R) {
    concreteRoof(P, x, y, w, h, b.Wc, R, { front: true });
    if (R() < 0.4 && h > 20) {
      [x + 3, x + w - 9].forEach(function (px) {
        P.r(px, y + 6, 6, 7, "#B8674A"); P.r(px, y + 6, 6, 1, "#D9876A"); P.r(px + 4, y + 7, 2, 6, "#8C4A37"); P.r(px, y + 9, 6, 1, "#E2C9A6");
        P.r(px + 1, y + 2, 1, 4, "#6A6E74"); P.r(px + 4, y + 1, 1, 5, "#6A6E74"); P.p(px + 2, y + 3, "#8A8E94");
      });
    }
  }

  // Paint one building in one state ("closed" / "open"). Returns its canvas and what the map needs.
  function paintHouse(b, state) {
    var Wc = b.Wc = WALLS[b.wall];
    var fh = b.fh, rh = b.rh, HEAD = 20, w = b.w, h = HEAD + rh + fh;
    var c = cv(w, h), P = Pt(c), R = rng(b.id.charCodeAt(0) * 31 + b.id.charCodeAt(1) * 7 + w);
    var top = HEAD + rh, base = h;
    var out = { win: [], glow: [], fire: [], tv: [], signs: [], decor: [], steam: [], note: null };
    roofBand(P, b, 0, HEAD, w, rh, R);
    // the front wall: limestone courses or painted plaster
    if (b.wall === "stone" || b.wall === "sand") ashlar(P, 0, top, w, fh, Wc, R);
    else {
      P.r(0, top, w, fh, Wc[0]);
      P.dots(0, top, w, fh, [Wc[1], Wc[2], lt(Wc[0], 0.12), dk(Wc[0], 0.08)], (w * fh / 9) | 0, R);
      for (var st = 0; st < 3; st++) P.r(((R() * w) | 0), top + 8 + ((R() * (fh - 20)) | 0), 1, 3 + ((R() * 5) | 0), dk(Wc[0], 0.12));
      if (R() < 0.8) brickPatch(P, 4 + ((R() * (w - 20)) | 0), top + 12 + ((R() * (fh - 40)) | 0), 8 + ((R() * 6) | 0) * 2, 4 + ((R() * 3) | 0) * 2, R);
      crack(P, ((R() * (w - 8)) | 0) + 4, top + 6, 5 + ((R() * 6) | 0), Wc[3], R);
    }
    P.r(0, top, w, 2, Wc[1]); P.r(0, top, w, 1, lt(Wc[1], 0.4)); P.r(0, top + 4, w, 1, Wc[2]); P.r(0, top + 5, w, 1, dk(Wc[0], 0.06));
    if (R() < 0.35 && !b.vine) { // a rug airing over the parapet
      var rx = 6 + ((R() * Math.max(1, w - 30)) | 0), rc = pick(R, ["#B8343A", "#2F5D9A", "#3F8F5F", "#8E4C9E"]);
      P.r(rx, top - 2, 16, 13, rc); P.r(rx + 2, top, 12, 9, lt(rc, 0.25)); P.r(rx + 4, top + 2, 8, 5, "#F2C14A"); P.r(rx + 6, top + 3, 4, 3, rc);
      for (var fz = rx; fz < rx + 16; fz += 2) P.p(fz, top + 11, "#F4EFE4");
    }
    // floors: a tall ground floor, then 24px storeys
    var gH = 38, upper = fh - 6 - gH, n = Math.max(0, Math.round(upper / 24)), uH = n ? Math.floor(upper / n) : 0;
    var floorY = [];
    for (var f = 0; f < n; f++) floorY.push(top + 6 + f * uH);
    for (var fl = 1; fl <= n; fl++) { var ly = fl === n ? base - gH - 1 : top + 6 + fl * uH - 1; P.r(0, ly, w, 1, lt(Wc[1], 0.2)); P.r(0, ly + 1, w, 1, Wc[2]); }
    // painted dado along the bottom
    P.r(0, base - 10, w, 10, b.dado); P.r(0, base - 10, w, 1, lt(b.dado, 0.25)); P.dots(0, base - 9, w, 9, [dk(b.dado, 0.15), lt(b.dado, 0.1)], w, R);
    P.r(0, base - 1, w, 1, dk(b.dado, 0.3));
    P.r(0, top, 1, fh, Wc[1]); P.r(w - 2, top, 2, fh, Wc[2]); P.r(w - 1, top, 1, fh, Wc[3]);
    // upper floors: windows, balconies, mashrabiyas
    floorY.forEach(function (fy, fi) {
      var floorNo = n - fi, wy = fy + 5, wh = Math.min(14, uH - 8), skip = [];
      if (b.balcony && b.balcony.f === floorNo) skip.push([b.balcony.x - 6, b.balcony.x + b.balcony.w + 6]);
      [b.mash, b.mash2].forEach(function (m) { if (m && m.f === floorNo) skip.push([m.x - 7, m.x + 25]); });
      var count = Math.max(1, Math.floor((w - 6) / 24)), slots = [];
      for (var i = 0; i < count; i++) {
        var wx = Math.round(((i + 0.5) * w) / count) - 5;
        if (skip.some(function (s) { return wx + 14 > s[0] && wx - 4 < s[1]; })) continue;
        slots.push(wx);
      }
      slots.forEach(function (wx) {
        windowAt(P, wx, wy, 10, wh, Wc, R, { kind: R() < 0.28 ? "shut" : "open", arch: b.wall === "stone" && R() < 0.5, c: pick(R, ["green", "blue", "brown", "teal"]), pot: R() < 0.4, ac: R() < 0.2 && wx + 24 < w }, out);
      });
      if (b.balcony && b.balcony.f === floorNo) { balconyAt(P, b.balcony.x, fy + uH - 4, b.balcony.w, Wc, R, out, b.balcony); out.balcony = { x: b.balcony.x, y: fy + uH - 4, w: b.balcony.w }; }
      [b.mash, b.mash2].forEach(function (m) { if (m && m.f === floorNo) mashrabiya(P, m.x, fy + 1); });
    });
    if (b.cables) cablesAt(P, w, base - gH - 4, R);
    // the ground floor
    var gy = base - gH;
    if (b.door) {
      var dw = b.door.big ? 18 : 14, dh = b.door.big ? 30 : 27, dx = b.door.x;
      doorAt(P, dx, base - dh, dw, dh, Wc, b.door);
      if (!b.door.big) { P.r(dx + dw + 4, base - 21, 5, 6, "#9AA0A8"); P.r(dx + dw + 4, base - 21, 5, 1, "#C9CDD3"); P.p(dx + dw + 6, base - 19, "#3A3434"); }
      P.p(dx + (dw >> 1) - 1, base - dh - 11, "#F2C76C"); P.p(dx + (dw >> 1), base - dh - 12, "#F2C76C"); P.p(dx + (dw >> 1), base - dh - 10, "#F2C76C");
      out.glow.push({ x: dx + dw / 2, y: base - dh - 5, r: 18, c: [255, 210, 140], k: "door" });
      out.door = { x: dx + dw / 2, y: base };
      var gwx = dx > w / 2 ? dx - 18 : dx + dw + 13;
      if (gwx > 3 && gwx + 12 < w - 3 && !b.door.home) windowAt(P, gwx, gy + 10, 10, 11, Wc, R, { grille: true }, out);
      if (b.door.home) {
        windowAt(P, dx + dw + 14, gy + 10, 10, 11, Wc, R, { grille: true, cur: "#E8D7A8" }, out);
        P.r(dx - 11, base - 20, 8, 19, "#5A3A2C"); P.r(dx - 10, base - 19, 6, 18, "#7A4A31"); P.r(dx - 11, base - 21, 8, 1, Wc[1]); // the door to the roof stairs
        out.decor.push({ k: "wallLamp", x: dx + dw / 2, y: base - dh - 16 });
      }
    }
    if (b.shop) {
      shopFront(P, b, b.shop, base, out, R, state);
      if (b.awn && !(b.workshop && state !== "open")) awning(P, b.shop.x - 3, base - 42, b.shop.w + 6, b.awn);
    }
    var sg = state === "open" && b.signOpen ? b.signOpen : b.sign;
    if (sg) {
      var sw = sg.w, sx = sg.x, sy = base - (b.awn ? 55 : 48);
      var bg = b.workshop && state !== "open" ? mix(sg.bg, "#9A8A7A", 0.45) : sg.bg;
      P.r(sx - 1, sy - 1, sw + 2, 13, dk(bg, 0.45)); P.r(sx, sy, sw, 11, bg); P.r(sx, sy, sw, 1, lt(bg, 0.3)); P.r(sx, sy + 10, sw, 1, dk(bg, 0.25));
      P.r(sx + 2, sy - 3, 1, 2, "#3A3434"); P.r(sx + sw - 3, sy - 3, 1, 2, "#3A3434");
      out.signs.push({ x: sx, y: sy, w: sw, h: 11, t: sg.t, fg: b.workshop && state !== "open" ? "#CFC2AE" : sg.fg });
    }
    if (b.board) { // العيش المعلّق: a cork board of paid-for loaves
      var bx0 = b.board.x, by0 = base - 30;
      P.r(bx0 - 1, by0 - 1, 18, 16, "#6A4430"); P.r(bx0, by0, 16, 14, "#C8A070"); P.dots(bx0, by0, 16, 14, ["#B88E60", "#D8B07E"], 30, R);
      for (var sl = 0; sl < 6; sl++) { var sxx = bx0 + 1 + (sl % 3) * 5, syy = by0 + 2 + ((sl / 3) | 0) * 6; P.r(sxx, syy, 4, 4, "#F8F4E8"); P.p(sxx + 1, syy + 1, "#C8302C"); }
      out.signs.push({ x: bx0 - 2, y: by0 - 9, w: 20, h: 6, t: "عيش معلّق", fg: "#FFE7A0", small: true });
    }
    if (!b.shop || b.door) out.decor.push({ k: "garland", x0: 0, x1: w, y: base - gH - 2, sag: 4 });
    (b.vine || []).forEach(function (v) { vineAt(P, v.x, top + 2, v.len, R, v.fl); });
    // roof things
    var items = b.roof || [], step = w / (items.length + 1);
    items.forEach(function (it, i) {
      var ix = Math.round(step * (i + 1)), iy = HEAD + rh - 3 - ((i % 2) ? 2 : 6);
      if (rh < 26) iy = HEAD + rh - 3;
      if (it === "laundry") { out.decor.push({ k: "laundry", x0: Math.max(3, ix - 16), x1: Math.min(w - 3, ix + 16), y: HEAD + Math.max(8, rh - 14), seed: i + w }); return; }
      if (it === "chimney") { P.r(ix - 3, iy - 18, 7, 18, "#B8674A"); P.r(ix - 3, iy - 18, 7, 1, "#D9876A"); P.r(ix + 2, iy - 17, 2, 17, "#8C4A37"); P.r(ix - 4, iy - 19, 9, 2, "#6A4440"); out.decor.push({ k: "smoke", x: ix, y: iy - 20 }); return; }
      if (it === "kidsroof") { out.decor.push({ k: "kidsroof", x: ix, y: HEAD + rh - 8 }); return; }
      var spr = A.prop(it, { c: R() < 0.5 ? "#2E2A30" : "#E8E6E0", w: 22 + ((R() * 6) | 0) });
      if (!spr) return;
      var px = Math.max(1, Math.min(w - spr.width - 1, ix - (spr.width >> 1)));
      P.img(spr, px, iy - spr.height + 3);
      if (it === "coop") out.decor.push({ k: "coop", x: px + 10, y: iy - 20 });
    });
    return { canvas: c, out: out, HEAD: HEAD };
  }

  /* ================= the mosque and its minaret ================= */
  var MOSQUE = { x: 148, w: 192, fh: 100, base: 236 };
  function paintMosque() {
    var m = MOSQUE, w = m.w, HEAD = 62, rh = 20, fh = m.fh, h = HEAD + rh + fh;
    var c = cv(w, h), P = Pt(c), R = rng(77), top = HEAD + rh, base = h;
    var out = { win: [], glow: [], fire: [], tv: [], signs: [], decor: [], steam: [] };
    var cream = "#ECDDBB", rose = "#D69A82", creamS = "#CDB892", roseS = "#B47A66";
    P.r(0, HEAD, w, rh, "#D9C7A4"); P.dots(0, HEAD, w, rh, ["#C9B794", "#E6D6B6"], 140, R); P.r(0, HEAD, w, 2, "#EADCBE");
    var dcx = 124;
    P.r(dcx - 24, HEAD - 6, 48, 20, cream); P.r(dcx - 24, HEAD - 6, 48, 1, "#F6ECD4"); P.r(dcx + 16, HEAD - 5, 8, 19, creamS);
    for (var dw = dcx - 20; dw < dcx + 20; dw += 8) { P.r(dw, HEAD - 2, 3, 8, "#3A2838"); P.r(dw, HEAD - 3, 3, 1, "#F6ECD4"); }
    P.el(dcx - 22, HEAD - 46, 44, 48, cream);
    for (var zy = 0; zy < 42; zy += 4) for (var zx = -22; zx < 22; zx += 4) { var px = dcx + zx + ((zy / 4) % 2 ? 2 : 0), py = HEAD - 44 + zy; P.p(px, py, rose); P.p(px + 1, py + 1, rose); }
    P.el(dcx + 4, HEAD - 42, 16, 40, "rgba(120,70,80,0.22)");
    P.el(dcx - 16, HEAD - 42, 9, 15, "rgba(255,250,235,0.35)");
    P.r(dcx - 1, HEAD - 54, 2, 9, "#C8963E"); P.el(dcx - 2, HEAD - 51, 4, 4, "#F2C76C");
    P.p(dcx - 2, HEAD - 58, "#F2C76C"); P.p(dcx - 1, HEAD - 59, "#F2C76C"); P.p(dcx, HEAD - 59, "#F2C76C"); P.p(dcx + 1, HEAD - 58, "#F2C76C"); P.p(dcx - 2, HEAD - 57, "#F2C76C");
    out.dome = { x: dcx, y: HEAD - 22 };
    for (var y = top; y < base; y++) P.r(0, y, w, 1, ((y - top) % 12) < 6 ? cream : rose);
    for (var y2 = top; y2 < base; y2++) P.r(w - 3, y2, 3, 1, ((y2 - top) % 12) < 6 ? creamS : roseS);
    P.dots(0, top, w, fh, ["#F6ECD4", "#C9B08A"], 300, R);
    for (var cx = 0; cx < w; cx += 8) { P.r(cx + 1, top - 5, 6, 5, cream); P.r(cx + 3, top - 7, 2, 2, cream); P.r(cx + 1, top - 5, 6, 1, "#F6ECD4"); P.r(cx + 6, top - 5, 1, 5, creamS); }
    P.r(0, top, w, 2, "#F6ECD4"); P.r(0, top + 2, w, 1, creamS);
    var pw = 48, px0 = (w - pw) >> 1;
    P.r(px0, top + 6, pw, fh - 6, "#C9B08A"); P.r(px0 + 2, top + 8, pw - 4, fh - 8, "#B39A76");
    for (var ay = 0; ay < 18; ay++) { var half = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((18 - ay) / 18, 2))) * (pw / 2 - 2)); P.r(px0 + pw / 2 - half, top + 8 + ay, half * 2, 1, "#8F7558"); }
    P.r(px0 + 2, top + 26, pw - 4, fh - 26, "#8F7558");
    for (var mq = 0; mq < 4; mq++) for (var mx = px0 + 6 + mq * 2; mx < px0 + pw - 6 - mq * 2; mx += 4) P.r(mx, top + 15 + mq * 3, 2, 2, mq % 2 ? "#E6D2AE" : "#A88E6C");
    var dwid = 26, dx0 = px0 + (pw - dwid) / 2, dy0 = base - 38;
    P.r(dx0 - 2, dy0 - 4, dwid + 4, 42, "#6A4A34");
    P.r(dx0, dy0, dwid, 38, "#7A4A2C"); P.r(dx0 + dwid / 2, dy0, 1, 38, "#4A2A1A");
    for (var sy = dy0 + 3; sy < base - 2; sy += 5) for (var sx = dx0 + 2; sx < dx0 + dwid - 1; sx += 4) P.p(sx, sy, "#E2B45A");
    P.r(dx0, dy0, dwid, 1, "#9A6440");
    P.r(dx0 - 4, dy0 - 11, dwid + 8, 6, "#E6D2AE"); for (var ix = dx0 - 2; ix < dx0 + dwid + 3; ix += 2) P.p(ix, dy0 - 9, "#3E7F86");
    out.door = { x: MOSQUE.x + dx0 + dwid / 2 };
    out.glow.push({ x: dx0 + dwid / 2, y: dy0 + 12, r: 40, c: [255, 220, 150], k: "mosqueDoor" });
    [14, 38, w - 50, w - 26].forEach(function (wx) {
      P.r(wx - 1, top + 14, 13, 22, "#C9B08A"); P.r(wx, top + 18, 11, 18, "#2A2440"); P.el(wx, top + 14, 11, 8, "#2A2440");
      for (var gy = top + 16; gy < top + 36; gy += 3) for (var gx = wx + 1; gx < wx + 11; gx += 3) P.r(gx, gy, 2, 2, "#ECDDBB");
      out.win.push({ x: wx, y: top + 16, w: 11, h: 20, glow: "mosque" });
      P.r(wx - 1, top + 52, 13, 18, "#C9B08A"); P.r(wx, top + 53, 11, 16, "#2A2440");
      for (var gx2 = wx + 1; gx2 < wx + 11; gx2 += 2) P.r(gx2, top + 53, 1, 16, "#3A3434");
      out.win.push({ x: wx, y: top + 53, w: 11, h: 16, glow: "mosque" });
    });
    P.r(0, top + 42, w, 5, "#3E7F86"); for (var ib = 2; ib < w; ib += 3) P.p(ib, top + 43 + (ib % 2), "#F2C76C");
    P.r(0, base - 6, w, 6, "#B39A76"); P.r(0, base - 6, w, 1, "#D9C29C");
    // lanterns hang either side of the door
    out.decor.push({ k: "fanous", x: px0 - 6, y: top + 30, c: GLASS[1] }, { k: "fanous", x: px0 + pw + 5, y: top + 30, c: GLASS[1] });
    out.signs.push({ x: px0 + 4, y: dy0 - 24, w: pw - 8, h: 10, t: "مسجد الحارة", fg: "#F2C76C", bg: null });
    m.canvas = c; m.y = m.base - h; m.out = out; m.HEAD = HEAD;
    return m;
  }
  var MINARET = { x: 340, w: 26 };
  function paintMinaret() {
    var w = MINARET.w, h = 186, c = cv(w, h), P = Pt(c), cx = 13;
    var cream = "#ECDDBB", rose = "#D69A82", creamS = "#CDB892";
    function shaft(y0, y1, hw) {
      for (var y = y0; y < y1; y++) { P.r(cx - hw, y, hw * 2, 1, ((y >> 2) % 3) === 0 ? rose : cream); P.r(cx + hw - 3, y, 3, 1, ((y >> 2) % 3) === 0 ? "#B47A66" : creamS); }
      P.r(cx - hw, y0, 1, y1 - y0, "#F6ECD4");
    }
    function balcony(y, hw) {
      P.r(cx - hw - 2, y, hw * 2 + 4, 3, "#D9C29C"); P.r(cx - hw - 2, y, hw * 2 + 4, 1, "#F6ECD4");
      for (var x = cx - hw - 1; x < cx + hw + 2; x += 2) P.r(x, y - 4, 1, 4, "#B39A76");
      P.r(cx - hw - 2, y - 5, hw * 2 + 4, 1, "#D9C29C");
      for (var k = 0; k < 3; k++) P.r(cx - hw + k, y + 3 + k, (hw - k) * 2, 1, k % 2 ? "#CDB892" : "#E6D2AE");
    }
    shaft(122, h, 10); P.r(cx - 10, h - 4, 20, 4, "#B39A76");
    for (var wy = 132; wy < h - 10; wy += 18) { P.r(cx - 2, wy, 4, 7, "#2A2440"); P.el(cx - 2, wy - 2, 4, 4, "#2A2440"); }
    balcony(120, 10);
    shaft(76, 115, 7);
    for (var wy2 = 84; wy2 < 112; wy2 += 14) P.r(cx - 1, wy2, 2, 6, "#2A2440");
    balcony(74, 7);
    for (var cy = 52; cy < 69; cy++) { P.p(cx - 5, cy, cream); P.p(cx - 1, cy, cream); P.p(cx + 3, cy, creamS); }
    P.r(cx - 6, 50, 12, 3, "#D9C29C"); P.r(cx - 6, 68, 12, 2, "#D9C29C");
    P.el(cx - 6, 30, 12, 22, cream); P.el(cx - 1, 32, 5, 18, creamS); P.el(cx - 4, 33, 3, 6, "#F6ECD4");
    P.r(cx - 1, 16, 2, 15, "#C8963E"); P.el(cx - 2, 22, 4, 4, "#F2C76C"); P.el(cx - 2, 27, 4, 3, "#F2C76C");
    P.p(cx - 3, 10, "#F2C76C"); P.p(cx - 3, 11, "#F2C76C"); P.p(cx - 2, 9, "#F2C76C"); P.p(cx - 1, 9, "#F2C76C"); P.p(cx + 1, 10, "#F2C76C"); P.p(cx - 2, 12, "#F2C76C"); P.p(cx - 1, 13, "#F2C76C");
    A.outline(c, 0.5);
    MINARET.canvas = c; MINARET.y = MOSQUE.base - h + 1; MINARET.base = MOSQUE.base + 1;
    MINARET.rings = [{ x: MINARET.x + cx, y: MINARET.y + 120, hw: 12 }, { x: MINARET.x + cx, y: MINARET.y + 74, hw: 9 }];
    MINARET.top = { x: MINARET.x + cx, y: MINARET.y + 42 };
    return MINARET;
  }

  /* ================= the ground, place by place ================= */
  function setts(P, x0, y0, w, h, R, tone, worn) {
    var t = tone || 0;
    var base = mix("#B9A68E", "#8F8070", t), sh = dk(base, 0.14), gap = dk(base, 0.34);
    P.r(x0, y0, w, h, gap);
    for (var y = y0; y < y0 + h; y += 4) {
      var off = ((y - y0) / 4) % 2 ? 3 : 0;
      for (var x = x0 - off; x < x0 + w; x += 6) {
        var c = R() < 0.18 ? mix(base, "#C9B79A", 0.6) : R() < 0.2 ? mix(base, "#A49078", 0.5) : base;
        if (worn && R() < 0.3) c = mix(c, worn, 0.35);
        var sx = Math.max(x0, x), ex = Math.min(x0 + w, x + 5);
        if (ex <= sx) continue;
        P.r(sx, y, ex - sx, 3, c); P.r(sx, y, ex - sx, 1, lt(c, 0.22)); P.r(sx, y + 2, ex - sx, 1, sh);
      }
    }
  }
  function slabs(P, x0, y0, w, h, R) {
    var grout = "#B8A07A";
    P.r(x0, y0, w, h, grout);
    for (var y = y0; y < y0 + h; y += 8) {
      var x = x0 - ((R() * 10) | 0);
      while (x < x0 + w) {
        var sw = 12 + ((R() * 3) | 0) * 4, c = mix("#E4D1AB", pick(R, ["#EADBBB", "#D9C49C", "#E8D2A6", "#DCCAA8"]), 0.6);
        var sx = Math.max(x0, x), ex = Math.min(x0 + w, x + sw - 1);
        if (ex > sx) {
          P.r(sx, y + 1, ex - sx, 7, c); P.r(sx, y + 1, ex - sx, 1, lt(c, 0.3)); P.r(sx, y + 7, ex - sx, 1, dk(c, 0.08));
          if (R() < 0.25) P.p(sx + ((R() * (ex - sx)) | 0), y + 3 + ((R() * 3) | 0), dk(c, 0.12));
        }
        x += sw;
      }
    }
  }
  function star(P, cx, cy) {
    P.el(cx - 42, cy - 16, 84, 32, "#B8A07A"); P.el(cx - 40, cy - 15, 80, 30, "#E8D8B6");
    P.el(cx - 32, cy - 12, 64, 24, "#C66E47"); P.el(cx - 29, cy - 11, 58, 22, "#E8D8B6");
    for (var k = 0; k < 16; k++) { var a = k / 16 * Math.PI * 2; P.r(Math.round(cx + Math.cos(a) * 22) - 1, Math.round(cy + Math.sin(a) * 8) - 1, 3, 2, k % 2 ? "#3F8C8C" : "#C66E47"); }
    P.el(cx - 12, cy - 5, 24, 10, "#3F8C8C"); P.el(cx - 8, cy - 3, 16, 6, "#F2E6C8"); P.el(cx - 3, cy - 1, 6, 2, "#C66E47");
  }
  // patterned cement tiles in front of the café (بلاط), worn soft by years of chairs
  function cementTiles(P, x0, y0, w, h, R) {
    for (var y = y0; y < y0 + h; y += 8) for (var x = x0; x < x0 + w; x += 8) {
      var odd = ((x - x0) / 8 + (y - y0) / 8) % 2, c = odd ? "#E4D6B8" : "#D6C6A6";
      if (R() < 0.12) c = mix(c, "#B8A486", 0.4);
      P.r(x, y, 8, 8, c);
      P.r(x + 3, y + 2, 2, 4, "#B97A62"); P.r(x + 2, y + 3, 4, 2, "#B97A62"); P.p(x + 3, y + 3, lt(c, 0.3));
      P.p(x, y, "#7A9A92"); P.p(x + 7, y, "#7A9A92"); P.p(x, y + 7, "#7A9A92"); P.p(x + 7, y + 7, "#7A9A92");
      P.r(x, y + 7, 8, 1, dk(c, 0.1)); P.r(x + 7, y, 1, 7, dk(c, 0.06));
    }
  }
  // packed earth: soft blotches, pebbles, little cracks
  function earth(P, x0, y0, w, h, R, col) {
    var c = col || "#C9A878";
    P.r(x0, y0, w, h, c);
    for (var b = 0; b < w * h / 700; b++) P.el(x0 + ((R() * w) | 0) - 12, y0 + ((R() * h) | 0) - 6, 16 + ((R() * 34) | 0), 6 + ((R() * 12) | 0), pick(R, [dk(c, 0.05), lt(c, 0.06), mix(c, "#B08A5A", 0.18), mix(c, "#D8C098", 0.25)]));
    P.dots(x0, y0, w, h, [dk(c, 0.07), lt(c, 0.09), dk(c, 0.13), lt(c, 0.15)], (w * h / 3) | 0, R);
    for (var p = 0; p < w * h / 120; p++) { var x = x0 + ((R() * w) | 0), y = y0 + ((R() * h) | 0); P.r(x, y, 2, 1, dk(c, 0.22)); P.p(x, y - 1, lt(c, 0.25)); }
    for (var k = 0; k < w * h / 2500; k++) { var cx = x0 + ((R() * w) | 0), cy = y0 + ((R() * h) | 0); for (var s = 0; s < 6; s++) { P.p(cx, cy, dk(c, 0.18)); cx += R() < 0.5 ? 1 : 0; cy += R() < 0.6 ? 1 : 0; } }
  }
  // tufts of grass where nobody steps: along walls and in corners
  function tufts(P, x0, x1, y, R, n) {
    for (var i = 0; i < (n || (x1 - x0) / 9); i++) {
      var x = x0 + ((R() * (x1 - x0)) | 0), yy = y + ((R() * 3) | 0);
      P.p(x, yy, LEAF[2]); P.p(x + 1, yy - 1, LEAF[0]); P.p(x - 1, yy - 1, LEAF[1]); P.p(x, yy - 2, LEAF[3]);
      if (R() < 0.3) P.p(x + 2, yy - 2, pick(R, ["#F2C14A", "#FFFFFF", "#E86AA0"]));
    }
  }
  function leaves(P, x0, y0, w, h, R, n) {
    for (var i = 0; i < n; i++) { var x = x0 + ((R() * w) | 0), y = y0 + ((R() * h) | 0), c = pick(R, ["#7A9A3A", "#A8A040", "#C9A84A", "#8A6A30", "#5A8A3A"]); P.p(x, y, c); P.p(x + 1, y, dk(c, 0.2)); }
  }
  function dirt(P, x0, y0, w, h, R) {
    P.r(x0, y0, w, h, "#D4B788");
    P.dots(x0, y0, w, h, ["#C8A876", "#DDC398", "#C09E6E", "#E4CDA3"], (w * h / 3) | 0, R);
    P.el(x0 + w * 0.2, y0 + h * 0.25, w * 0.6, h * 0.5, "rgba(150,110,70,0.12)");
    for (var p = 0; p < w * h / 160; p++) { var x = x0 + ((R() * w) | 0), y = y0 + ((R() * h) | 0); P.r(x, y, 2, 1, "#A8885E"); P.p(x, y - 1, "#EAD6AE"); }
    for (var g = 0; g < w / 6; g++) { var gx = x0 + ((R() * w) | 0), gy = y0 + 3 + ((R() * 4) | 0); P.p(gx, gy, LEAF[1]); P.p(gx + 1, gy - 1, LEAF[0]); P.p(gx - 1, gy - 1, LEAF[3]); }
  }
  function curb(P, x0, x1, y) {
    P.r(x0, y, x1 - x0, 3, "#D9C9AC"); P.r(x0, y, x1 - x0, 1, "#EDE0C6"); P.r(x0, y + 3, x1 - x0, 1, "#9C8A74");
    P.r(x0, y + 4, x1 - x0, 4, "rgba(40,22,46,0.18)"); // the shade at the foot of the wall
  }
  function chalk(P, x, y) {
    var c = "#F4F0E8", p = "#F2A0C0", yl = "#F2D06A";
    for (var i = 0; i < 4; i++) { P.r(x + i * 9, y, 9, 1, c); P.r(x + i * 9, y + 8, 9, 1, c); P.r(x + i * 9, y, 1, 9, c); }
    P.r(x + 36, y, 1, 9, c); P.r(x + 36, y - 4, 9, 1, c); P.r(x + 36, y + 12, 9, 1, c); P.r(x + 45, y - 4, 1, 17, c);
    P.r(x + 3, y + 3, 2, 3, p); P.r(x + 12, y + 3, 3, 1, yl); P.r(x + 12, y + 5, 3, 1, yl); P.r(x + 21, y + 3, 3, 3, p);
    P.el(x + 56, y - 2, 8, 8, yl); P.el(x + 58, y, 4, 4, "#D2B486");
    P.p(x + 60, y - 4, yl); P.p(x + 60, y + 7, yl); P.p(x + 54, y + 2, yl); P.p(x + 65, y + 2, yl);
    P.map(x + 68, y + 6, [".p.p.", "ppppp", ".ppp.", "..p.."], { p: p });
  }
  function stepsDown(P, x, y, w, n) { // stone steps going down to the south
    for (var s = 0; s < n; s++) { var yy = y + s * 5; P.r(x, yy, w, 5, s % 2 ? "#D2BE9A" : "#DECAA6"); P.r(x, yy, w, 1, "#F2E4C6"); P.r(x, yy + 4, w, 1, "#A8906C"); }
  }
  // The roofs of the houses to the south, seen from above: two rows at different heights,
  // so the nearer row shows a strip of its back wall with windows. Cairo's rooftops are busy:
  // tanks, dishes, pigeon towers, rooms, plants in tins, rugs and laundry.
  var ROOFS = { wins: [], coops: [], laundry: [] };
  function rooftops(P, x0, x1, y0, y1, R) {
    var mid = y0 + Math.max(30, Math.round((y1 - y0) * 0.5));
    [[y0, mid, true], [mid + 12, y1, false]].forEach(function (row) {
      if (row[1] - row[0] < 10) return;
      for (var x = x0; x < x1;) {
        var w = Math.min(x1 - x, 38 + ((R() * 5) | 0) * 8), ry0 = row[0], rh = row[1] - row[0];
        if (x1 - x - w < 20) w = x1 - x;
        var Wc = pick(R, [WALLS.ochre, WALLS.pink, WALLS.teal, WALLS.cream, WALLS.blue, WALLS.stone, WALLS.terra]);
        concreteRoof(P, x, ry0, w, rh, Wc, R, { edge: row[2] });
        // the back wall of the nearer row, with its windows
        if (row[2]) {
          var wy = row[1];
          P.r(x, wy, w, 12, Wc[0]); P.r(x, wy, w, 1, lt(Wc[1], 0.3)); P.r(x + w - 2, wy, 2, 12, Wc[2]);
          P.dots(x, wy, w, 12, [Wc[1], Wc[2]], w / 2 | 0, R);
          for (var wx = x + 6; wx < x + w - 8; wx += 14 + ((R() * 8) | 0)) {
            P.r(wx - 1, wy + 2, 7, 1, Wc[1]); P.r(wx, wy + 3, 5, 6, "#3A2838"); P.r(wx, wy + 3, 1, 6, pick(R, CURTAINS)); P.r(wx - 1, wy + 9, 7, 1, Wc[2]);
            if (R() < 0.75) ROOFS.wins.push([wx, wy + 3, 5, 6]);
          }
          P.r(x, wy + 12, w, 2, "rgba(40,22,46,0.3)");
        }
        // things on the roof
        var spots = [], n = 3 + ((R() * 3) | 0);
        // a water pipe along the back parapet, from the tank to the stairs
        if (R() < 0.6) { var py = ry0 + 9; P.r(x + 4, py, w - 8, 1, "#8A8E94"); P.r(x + 4, py + 1, w - 8, 1, "#5A5E66"); for (var pj = x + 10; pj < x + w - 6; pj += 14) P.r(pj, py - 1, 2, 3, "#6A6E76"); }
        for (var i = 0; i < n; i++) {
          var kind = pick(R, ["tank", "tank", "dish", "dish", "plants", "junk", "coop", "hut", "rug", "laundry", "chair", "antenna", "bricks"]);
          var ix = x + 4 + ((R() * Math.max(1, w - 30)) | 0), iy = ry0 + rh - 3 - ((R() * Math.max(1, rh - 24)) | 0);
          if (spots.some(function (s) { return Math.abs(s - ix) < 16; })) continue;
          spots.push(ix);
          if (kind === "laundry") { ROOFS.laundry.push([x + 4, Math.min(x + w - 4, x + 4 + 30), ry0 + 12]); continue; }
          if (kind === "rug") { var rc = pick(R, ["#B8343A", "#2F5D9A", "#3F8F5F", "#8E4C9E"]); P.r(ix, iy - 9, 14, 9, rc); P.r(ix + 2, iy - 7, 10, 5, lt(rc, 0.25)); P.r(ix + 4, iy - 6, 6, 3, "#F2C14A"); continue; }
          if (kind === "chair") { P.r(ix, iy - 7, 6, 2, "#D8473C"); P.r(ix, iy - 5, 1, 5, "#B8372C"); P.r(ix + 5, iy - 5, 1, 5, "#B8372C"); P.r(ix + 4, iy - 11, 2, 6, "#D8473C"); continue; }
          if (kind === "antenna") { // an old TV aerial on a pole, taller than anything
            P.r(ix + 1, iy - 1, 5, 2, "#8A8478"); P.r(ix + 3, iy - 24, 1, 23, "#4A4A54"); P.p(ix + 4, iy - 20, "#7A7A84");
            P.r(ix - 1, iy - 23, 9, 1, "#5A5A66"); P.r(ix, iy - 19, 7, 1, "#5A5A66"); P.r(ix + 1, iy - 15, 5, 1, "#5A5A66");
            P.p(ix - 1, iy - 24, "#5A5A66"); P.p(ix + 7, iy - 24, "#5A5A66"); continue;
          }
          if (kind === "bricks") { // what's left from the floor nobody built yet
            for (var bj = 0; bj < 3; bj++) for (var bi = 0; bi < 4 - bj; bi++) { P.r(ix + bi * 4 + bj * 2, iy - 3 - bj * 2, 4, 2, bj % 2 ? "#B85A3E" : "#C8684A"); P.p(ix + bi * 4 + bj * 2 + 3, iy - 3 - bj * 2, "#8C4030"); }
            continue;
          }
          var s = A.prop(kind, { c: R() < 0.5 ? "#2E2A30" : "#E8E6E0", w: 20 + ((R() * 6) | 0), c2: Wc[1] });
          if (!s) continue;
          var sy = Math.max(ry0 + 2, iy - s.height);
          P.img(s, ix, sy);
          if (kind === "coop") ROOFS.coops.push([ix + 10, sy]);
          if (kind === "hut" && R() < 0.8) ROOFS.wins.push([ix + 13, sy + 9, 5, 5]);
        }
        x += w;
      }
    });
  }
  // an abandoned lot: weeds, a dead stump, broken bricks
  function wasteland(P, x0, y0, w, h, R) {
    for (var i = 0; i < w * h / 90; i++) {
      var x = x0 + ((R() * w) | 0), y = y0 + ((R() * h) | 0), c = pick(R, ["#9AA050", "#B8A858", "#7A8A40", "#C8B070"]);
      P.p(x, y, c); P.p(x + 1, y - 1, dk(c, 0.15)); if (R() < 0.4) P.p(x - 1, y - 1, lt(c, 0.2));
    }
    for (var b = 0; b < 14; b++) { var bx = x0 + ((R() * w) | 0), by = y0 + ((R() * h) | 0); P.r(bx, by, 3, 2, pick(R, ["#C2553A", "#A84A34", "#B8AC98"])); }
  }

  // Places: name, a line under it, the area that counts as being there, the sound bed, the colour of its light at night.
  var PLACES = [
    { id: "workshop", name: "ورشة عم صابر", sub: "مقفولة من شهور", subOpen: "فوانيس خشب بتنوّر من تاني", r: [364, 600, 212, 124], bed: "workshop", bedOpen: "workshopOpen" },
    { id: "garden", name: "جنينة الحارة", sub: "أرض فاضية… لحد إمتى؟", subOpen: "العيال بيزرعوا", subGreen: "خضرا ومنوّرة", r: [384, 724, 192, 110], bed: "garden" },
    { id: "kids", name: "ملعب العيال", sub: "ماتش كل يوم لحد المغرب", r: [176, 576, 192, 148], bed: "alley" },
    { id: "home", name: "زقاق البيت", sub: "بيتنا وبيت الحاجة نعمات", r: [0, 560, 176, 190], bed: "home" },
    { id: "cafe", name: "قهوة الحارة", sub: "تحت الجميزة القديمة", r: [356, 340, 220, 196], bed: "cafe" },
    { id: "bakery", name: "فرن عم حسن", sub: "العيش طالع سخن", r: [196, 470, 160, 106], bed: "bakery" },
    { id: "market", name: "سوق الحارة", sub: "فول وكشري وكباب وطرشي", r: [0, 400, 196, 156], bed: "market" },
    { id: "square", name: "ساحة الجامع", sub: "هنا الكل بيتجمع قبل المغرب", r: [0, 150, 576, 250], bed: "square" }
  ];

  function paintGround() {
    var c = cv(W, HGT), P = Pt(c), R = rng(2027);
    P.r(0, 0, W, HGT, "#8F7D69");
    ROOFS.wins = []; ROOFS.coops = []; ROOFS.laundry = [];
    // the rooftops to the south fill in behind everything first
    rooftops(P, 0, 176, 742, HGT, R);
    rooftops(P, 176, 384, 724, HGT, R);
    rooftops(P, 384, W, 838, HGT, R);
    // the mosque square: slabs, a patterned border, the inlaid star
    slabs(P, 0, 236, W, 130, R);
    for (var bx = 0; bx < W; bx += 6) { P.r(bx, 240, 6, 5, (bx / 6) % 2 ? "#C66E47" : "#3F8C8C"); P.p(bx + 2, 242, "#F2E6C8"); P.p(bx + 3, 242, "#F2E6C8"); }
    star(P, MOSQUE.x + MOSQUE.w / 2, 296);
    var sx = MOSQUE.x + (MOSQUE.w >> 1) - 30, sw = 60;
    for (var s = 0; s < 3; s++) { P.r(sx - s * 3, 236 + s * 4, sw + s * 6, 4, s % 2 ? "#DCC9A6" : "#E8D8B8"); P.r(sx - s * 3, 236 + s * 4, sw + s * 6, 1, "#F6EBD2"); P.r(sx - s * 3, 236 + s * 4 + 3, sw + s * 6, 1, "#B9A27E"); }
    // the alley under the arch: dark old setts
    setts(P, 192, 352, 30, 124, R, 0.45);
    P.r(192, 352, 2, 124, "rgba(40,22,46,0.3)"); P.r(219, 352, 3, 124, "rgba(40,22,46,0.2)");
    // the market lane: worn cobbles, straw, a puddle by the ful cart, peel and crushed mint
    setts(P, 0, 470, 196, 90, R, 0.15, "#C9A878");
    P.dots(0, 480, 196, 70, ["#E8C870", "#D8B050", "#F08A2A", "#6AAA4A"], 70, R);
    P.el(46, 540, 22, 6, "#8FA6B0"); P.el(49, 541, 14, 3, "#B6CCD4"); P.p(52, 541, "#E8F2F6");
    P.el(150, 482, 34, 7, "rgba(40,30,30,0.16)");
    // the bakery forecourt: setts dusted with flour
    setts(P, 196, 476, 164, 104, R, 0.05);
    P.dots(220, 494, 130, 40, ["#EFE6D6", "#F6F0E4", "#E6DCC8"], 220, R);
    P.el(240, 500, 90, 26, "rgba(246,240,228,0.35)");
    // under the sycamore: packed earth with fallen leaves, the café's tiled terrace
    earth(P, 356, 340, 220, 200, R, "#C8A47A");
    cementTiles(P, 392, 452, 184, 64, R);
    P.r(392, 516, 184, 2, "#A89474"); P.r(392, 518, 184, 2, "rgba(40,22,46,0.16)");
    leaves(P, 300, 380, 150, 150, R, 260);
    tufts(P, 356, 576, 344, R, 18);
    // the east alley steps down to Saber's yard
    earth(P, 344, 536, 48, 110, R, "#C2A07A");
    stepsDown(P, 352, 590, 36, 5);
    tufts(P, 344, 352, 560, R, 4); tufts(P, 388, 392, 600, R, 3);
    // the short cut from the market, then the kids' lot: dirt, chalk, a worn pitch
    setts(P, 176, 540, 22, 40, R, 0.3);
    dirt(P, 176, 572, 192, 152, R);
    P.el(200, 610, 150, 90, "rgba(150,110,70,0.14)");
    P.el(214, 632, 120, 52, "rgba(150,110,70,0.1)");
    chalk(P, 196, 692);
    tufts(P, 176, 368, 720, R, 26); tufts(P, 360, 368, 600, R, 6);
    // home: a narrow lane of old setts, swept clean, a gutter in the middle
    setts(P, 0, 660, 184, 82, R, 0.25);
    P.r(0, 712, 184, 1, "rgba(60,40,50,0.22)");
    P.el(60, 696, 16, 5, "rgba(70,90,110,0.25)"); // water under the jar
    tufts(P, 0, 176, 668, R, 8);
    // Saber's yard: earth, sawdust, shavings
    earth(P, 364, 640, 212, 88, R, "#CDA97C");
    P.dots(380, 650, 120, 40, ["#E8CC98", "#F2DEB0", "#D9B47A"], 160, R);
    tufts(P, 392, 576, 648, R, 12);
    // the garden lot behind its wall: weeds and broken bricks, for now
    earth(P, 384, 728, 192, 110, R, "#B89870");
    wasteland(P, 388, 744, 184, 90, R);
    // curbs and the shade at the foot of every wall
    curb(P, 0, 148, 236); curb(P, 366, W, 236);
    curb(P, 0, 192, 470); curb(P, 222, 360, 492); curb(P, 392, W, 452);
    curb(P, 0, 176, 660); curb(P, 392, W, 640);
    tufts(P, 0, 148, 244, R, 6); tufts(P, 372, 576, 244, R, 10);
    // manholes
    [[90, 512], [300, 548], [470, 690], [120, 720]].forEach(function (m) { P.el(m[0], m[1], 10, 5, "#7E7468"); P.el(m[0] + 1, m[1] + 1, 8, 3, "#968A7C"); P.r(m[0] + 2, m[1] + 2, 6, 1, "#7E7468"); });
    // the houses to the south are tall: the street at their feet lies in their shade
    [[0, 176, 742], [176, 384, 724]].forEach(function (e) {
      for (var i = 1; i <= 14; i++) P.r(e[0], e[2] - 2 - i, e[1] - e[0], 1, "rgba(44,24,50," + (0.3 * Math.pow(1 - i / 15, 1.6)).toFixed(3) + ")");
    });
    return c;
  }

  /* ================= the sky, per time of day, with the moon of the day ================= */
  var SKIES = {
    asr: { g: ["#7EC3EC", "#A9D7F0", "#E6EED8", "#F6E8C2"], far: "#B9C4D6", near: "#A6B0C6", sun: [52, 30, 8, "#FFF6D8"] },
    pre: { g: ["#86B4DE", "#E8CFA0", "#F7B878", "#F79A62"], far: "#D9A68A", near: "#C08A7A", sun: [40, 52, 10, "#FFE6A0"] },
    maghrib: { g: ["#433878", "#9A4E86", "#EE7E62", "#FFBE6A"], far: "#8A527A", near: "#6E3E6A", sun: [30, 72, 12, "#FF8A4A"] },
    night: { g: ["#0C1034", "#151A48", "#202660", "#2C2E6E"], far: "#262A5C", near: "#1C1F4A" }
  };
  // The moon follows the days of Ramadan: a thin crescent on Day 1, full in the middle, waning at the end.
  function moon(P, mx, my, r, day, skyCol) {
    var p = Math.max(1, Math.min(29, day)) / 29.5, lit = p < 0.5 ? p / 0.5 : (1 - p) / 0.5;
    P.el(mx - r * 2, my - r * 2, r * 4, r * 4, "rgba(255,240,190,0.10)");
    P.el(mx - r, my - r, r * 2, r * 2, "#FFF0B8");
    P.el(mx - r + 2, my - r + 3, 3, 2, "#EEDCA0"); P.el(mx, my + 1, 3, 3, "#EEDCA0");
    if (lit < 0.96) {
      var off = Math.max(2, Math.round(lit * r * 2.2)), dir = p < 0.5 ? -1 : 1;
      P.el(mx - r + dir * off, my - r - 1, r * 2, r * 2 + 1, skyCol);
    }
  }
  function paintSky(time, day) {
    day = day || 1;
    var S = SKIES[time] || SKIES.asr, h = 150, c = cv(W, h), P = Pt(c), R = rng(99);
    for (var y = 0; y < h; y++) {
      var t = y / (h - 1) * (S.g.length - 1), i = Math.min(S.g.length - 2, Math.floor(t)), f = t - i;
      P.r(0, y, W, 1, mix(S.g[i], S.g[i + 1], Math.round(f * 6) / 6));
    }
    if (S.sun) { var s = S.sun; P.el(s[0] - s[2] * 2, s[1] - s[2] * 2, s[2] * 4, s[2] * 4, "rgba(255,240,200,0.18)"); P.el(s[0] - s[2], s[1] - s[2], s[2] * 2, s[2] * 2, s[3]); }
    if (time === "maghrib" && day <= 6) moon(P, 92, 40, 6, day, mix(S.g[0], S.g[1], 0.4)); // the new crescent, low in the west
    if (time === "night") {
      for (var k = 0; k < 120; k++) { var sx = (R() * W) | 0, sy = (R() * 110) | 0; P.p(sx, sy, R() < 0.2 ? "#FFF2C0" : "#C9CDF0"); }
      moon(P, day < 15 ? 120 : W - 100, 26 + Math.abs(15 - day), 8, day, S.g[0]);
    }
    function skyline(col, y0, seed, tall) {
      var r = rng(seed);
      for (var x = 0; x < W;) {
        var bw = 10 + ((r() * 22) | 0), bh = 6 + ((r() * 10) | 0);
        P.r(x, y0 - bh, bw, h - y0 + bh, col);
        if (r() < 0.35) P.el(x + 2, y0 - bh - 6, bw - 4, 10, col);
        if (r() < (tall ? 0.28 : 0.15)) { var mx2 = x + ((r() * bw) | 0), mh = 18 + ((r() * 16) | 0); P.r(mx2, y0 - bh - mh, 3, mh, col); P.r(mx2 - 1, y0 - bh - mh + 6, 5, 1, col); P.el(mx2 - 1, y0 - bh - mh - 4, 5, 6, col); P.p(mx2 + 1, y0 - bh - mh - 6, col); }
        x += bw;
      }
    }
    skyline(S.far, 92, 4, true);
    skyline(S.near, 104, 8, false);
    if (time === "night" || time === "maghrib") { // lit windows in the far city
      var r2 = rng(5);
      for (var n = 0; n < 60; n++) P.p((r2() * W) | 0, 96 + ((r2() * 50) | 0), r2() < 0.5 ? "#FFD98A" : "#FFC064");
    }
    return c;
  }

  /* ================= things in the places ================= */
  // k: prop, x: left, y: base (feet line). block: [w, h] footprint people walk around.
  // light: [dx, dy, rgb, radius]. days: { from, to }. canopy: drawn over people. place: the place it belongs to.
  var PROPS = [
    // ---- the mosque square ----
    { k: "tent", o: { w: 116 }, x: 4, y: 268, block: [116, 6] },
    { k: "iftarTable", o: { w: 96 }, x: 12, y: 300, block: [96, 10], id: "table1" },
    { k: "iftarTable", o: { w: 96 }, x: 12, y: 330, block: [96, 10], id: "table2" },
    { k: "fanousStall", x: 132, y: 300, block: [44, 6], light: "own" },
    { k: "palm", x: 368, y: 330, block: [10, 4], sway: true },
    { k: "palm", x: 514, y: 344, block: [10, 4], sway: true },
    { k: "bigLantern", x: 312, y: 292, block: [14, 5], light: [11, -26, [255, 200, 120], 50] },
    { k: "sabil", x: 500, y: 266, block: [30, 6], look: "sabil" },
    { k: "bench", x: 420, y: 300, block: [26, 4] },
    { k: "plantPots", o: { n: 4, seed: 3 }, x: 456, y: 246, noblock: true },
    { k: "lamp", x: 140, y: 246, block: [6, 3], light: [5, -40, [255, 214, 140], 54] },
    { k: "lamp", x: 352, y: 246, block: [6, 3], light: [5, -40, [255, 214, 140], 54] },
    { k: "shoes", x: 214, y: 243, noblock: true },
    { k: "shoes", x: 258, y: 244, noblock: true },
    { k: "arch", o: { w: 30, h: 58, open: 18 }, x: 192, y: 478, light: "own" },
    { k: "drinkCart", x: 424, y: 336, block: [30, 6], look: "drinks" },
    { k: "plantPots", o: { n: 3, seed: 41 }, x: 384, y: 248, noblock: true },
    { k: "bench", x: 280, y: 344, block: [26, 4] },
    // ---- the market lane ----
    { k: "fulCart", x: 4, y: 528, block: [44, 8], id: "fulcart", steam: [22, -36] },
    { k: "fruitStall", x: 58, y: 552, block: [44, 6] },
    { k: "datesStall", x: 108, y: 554, block: [44, 6] },
    { k: "spices", x: 148, y: 552, block: [24, 4] },
    { k: "grill", x: 150, y: 488, block: [24, 6], smoke: [12, -16], light: [12, -10, [255, 140, 60], 28] },
    { k: "crate", o: { fruit: "#F08A2A", seed: 2 }, x: 40, y: 484, block: [14, 4] },
    { k: "lamp", x: 186, y: 482, block: [6, 3], light: [5, -40, [255, 214, 140], 52] },
    // ---- the bakery ----
    { k: "breadCage", o: { seed: 1 }, x: 224, y: 506, block: [24, 4] },
    { k: "breadCage", o: { seed: 4 }, x: 330, y: 508, block: [24, 4] },
    { k: "breadRack", o: { tiers: 3, seed: 1 }, x: 236, y: 496, block: [20, 4] },
    { k: "sacks", x: 344, y: 524, block: [16, 4], look: "kitten" },
    { k: "bicycle", x: 200, y: 548, block: [24, 4] },
    { k: "qatayefStall", x: 248, y: 562, block: [40, 6], days: { from: DAYS.omyoussefStall }, steam: [10, -22], light: [20, -14, [255, 200, 130], 26] },
    { k: "mural", o: { w: 82 }, x: 196, y: 578, block: [82, 5], look: "mural", sign: { dx: 41, dy: -5, t: "رمضان كريم", h: 6, fg: "#FFE08A" } },
    { k: "lowWall", o: { w: 34, h: 18, pots: true }, x: 312, y: 578, block: [34, 5] },
    // ---- the café under the sycamore ----
    { k: "bigTrunk", x: 338, y: 504, block: [16, 6], look: "tree" },
    { k: "bigCanopy", o: { w: 114, h: 76 }, x: 304, y: 474, canopy: true, sway: true },
    { k: "kiosk", x: 366, y: 534, block: [48, 6], light: "own", look: "kiosk" },
    { k: "cafeTable", o: { tawla: true }, x: 432, y: 486, block: [10, 4] },
    { k: "chair", o: { f: 3, c: "#3E78C2" }, x: 420, y: 486, block: [8, 3], seat: "m2", sitDir: 3 },
    { k: "chair", o: { f: 2, c: "#D8473C" }, x: 444, y: 486, block: [8, 3], seat: "m4", sitDir: 2 },
    { k: "cafeTable", x: 490, y: 488, block: [10, 4] },
    { k: "chair", o: { f: 3, c: "#F2F0EA" }, x: 478, y: 488, block: [8, 3], seat: "m3", sitDir: 3 },
    { k: "chair", o: { f: 2, c: "#3F9A62" }, x: 502, y: 488, block: [8, 3], seat: "m5", sitDir: 2 },
    { k: "shisha", x: 462, y: 490, block: [6, 3], smoke: [4, -18] },
    { k: "cafeTable", o: { tawla: true }, x: 540, y: 514, block: [10, 4] },
    { k: "chair", o: { f: 3, c: "#F2C14A" }, x: 528, y: 514, block: [8, 3], seat: "m1", sitDir: 3 },
    { k: "shisha", x: 556, y: 516, block: [6, 3], smoke: [4, -18] },
    { k: "plantPots", o: { n: 3, seed: 9 }, x: 560, y: 468, noblock: true },
    // ---- the kids' lot ----
    { k: "stones", x: 186, y: 652, noblock: true },
    { k: "stones", x: 350, y: 650, noblock: true },
    { k: "tyre", x: 312, y: 712, block: [14, 4] },
    { k: "smallTrunk", x: 336, y: 600, block: [10, 4] },
    { k: "smallCanopy", o: { w: 74, h: 52 }, x: 310, y: 578, canopy: true, sway: true },
    { k: "bench", x: 236, y: 716, block: [26, 4] },
    { k: "lamp", x: 352, y: 718, block: [6, 3], light: [5, -40, [255, 214, 140], 56] },
    { k: "swing", x: 270, y: 640, block: [36, 5], days: { from: DAYS.eid }, sway: true },
    { k: "balloons", x: 220, y: 616, block: [8, 3], days: { from: DAYS.eid }, sway: true },
    // ---- home ----
    { k: "zeer", x: 54, y: 690, block: [14, 4], look: "zeer" },
    { k: "mastaba", o: { w: 26, rug: true }, x: 104, y: 672, block: [26, 3] },
    { k: "plantPots", o: { n: 4, seed: 14 }, x: 2, y: 676, noblock: true, look: "plants" },
    { k: "plantPots", o: { n: 3, seed: 21 }, x: 152, y: 674, noblock: true },
    { k: "lamp", x: 176, y: 700, block: [6, 3], light: [5, -40, [255, 214, 140], 52] },
    { k: "gas", x: 82, y: 672, block: [6, 3] },
    // ---- Saber's yard ----
    { k: "planks", x: 470, y: 652, noblock: true },
    { k: "sawhorse", x: 492, y: 670, block: [20, 4] },
    { k: "workbench", x: 410, y: 680, block: [34, 5], days: { from: DAYS.workshopOpen } },
    { k: "woodLanterns", o: { n: 6 }, x: 406, y: 642, z: 19, noblock: true, days: { from: DAYS.workshopOpen }, light: "own" },
    { k: "plantPots", o: { n: 2, seed: 30 }, x: 556, y: 652, noblock: true },
    { k: "donkeyCart", x: 512, y: 712, block: [48, 6] },
    // ---- the garden lot ----
    { k: "lowWall", o: { w: 66, h: 18, weeds: true }, x: 384, y: 734, block: [66, 6] },
    { k: "lowWall", o: { w: 102, h: 18, weeds: true }, x: 474, y: 734, block: [102, 6] },
    { k: "gate", o: { open: false }, x: 450, y: 734, block: [24, 6], look: "gate", days: { to: DAYS.gardenOpen - 1 } },
    { k: "gate", o: { open: true }, x: 450, y: 734, look: "gate", days: { from: DAYS.gardenOpen } },
    { k: "gardenGround", o: { stage: 1 }, x: 388, y: 742, decal: true, days: { from: DAYS.gardenOpen, to: DAYS.gardenGreen - 1 } },
    { k: "gardenGround", o: { stage: 2 }, x: 388, y: 742, decal: true, days: { from: DAYS.gardenGreen } },
    { k: "rubble", o: { seed: 33 }, x: 400, y: 790, block: [40, 6], days: { to: DAYS.gardenOpen - 1 } },
    { k: "rubble", o: { seed: 7 }, x: 520, y: 826, block: [40, 6], days: { to: DAYS.gardenOpen - 1 } },
    { k: "oldCar", x: 470, y: 790, block: [56, 8], days: { to: DAYS.gardenOpen - 1 }, look: "car" },
    { k: "gardenBed", o: { stage: 0, w: 40 }, x: 400, y: 786, block: [40, 5], days: { from: DAYS.gardenOpen, to: 14 } },
    { k: "gardenBed", o: { stage: 1, w: 40 }, x: 400, y: 786, block: [40, 5], days: { from: 15, to: DAYS.gardenGreen - 1 } },
    { k: "gardenBed", o: { stage: 2, w: 40 }, x: 400, y: 786, block: [40, 5], days: { from: DAYS.gardenGreen } },
    { k: "gardenBed", o: { stage: 0, w: 44 }, x: 500, y: 818, block: [44, 5], days: { from: DAYS.gardenOpen, to: DAYS.gardenGreen - 1 } },
    { k: "gardenBed", o: { stage: 2, w: 44 }, x: 500, y: 818, block: [44, 5], days: { from: DAYS.gardenGreen } },
    { k: "sapling", x: 540, y: 776, block: [8, 3], days: { from: DAYS.gardenOpen, to: DAYS.gardenGreen - 1 } },
    { k: "sapling", o: { big: true }, x: 540, y: 776, block: [8, 3], days: { from: DAYS.gardenGreen } },
    { k: "bench", x: 460, y: 770, block: [26, 4], days: { from: DAYS.gardenGreen } },
    { k: "bigLantern", x: 444, y: 820, block: [14, 5], light: [11, -26, [255, 200, 120], 46], days: { from: DAYS.gardenGreen } }
  ];

  // strings across the places: flags, lanterns, bulbs, a banner. "days" is the lantern of the days.
  var STRINGS = [
    { k: "banner", x0: 0, y0: 196, x1: 148, y1: 192, sag: 10, t: "رمضان كريم" },
    { k: "days", x0: 353, y0: 168, x1: 576, y1: 196, sag: 20 },
    { k: "bulbs", x0: 353, y0: 70, x1: 148, y1: 150, sag: 14 },
    { k: "flags", x0: 0, y0: 430, x1: 192, y1: 424, sag: 12 },
    { k: "lanterns", x0: 0, y0: 452, x1: 192, y1: 448, sag: 10 },
    { k: "bulbs", x0: 222, y0: 462, x1: 360, y1: 458, sag: 10 },
    { k: "bulbs", x0: 300, y0: 418, x1: 392, y1: 408, sag: 10 },
    { k: "bulbs", x0: 392, y0: 404, x1: 576, y1: 410, sag: 14 },
    { k: "flags", x0: 0, y0: 616, x1: 176, y1: 612, sag: 10 },
    { k: "lanterns", x0: 0, y0: 600, x1: 176, y1: 596, sag: 14 },
    { k: "flags", x0: 196, y0: 560, x1: 368, y1: 566, sag: 16 },
    { k: "lanterns", x0: 176, y0: 614, x1: 334, y1: 586, sag: 16 },
    { k: "lanterns", x0: 392, y0: 604, x1: 576, y1: 600, sag: 12 },
    { k: "bulbs", x0: 384, y0: 724, x1: 576, y1: 728, sag: 12, days: { from: DAYS.gardenGreen } }
  ];

  /* ================= where you can go ================= */
  // stand: where the player stops. mark: where the errand lantern floats. zone: passing through counts (for "trigger").
  var SPOTS = {
    home: { name: "البيت", stand: [133, 676], mark: [133, 622], tap: [124, 630, 20, 30] },
    roof: { name: "السطوح", stand: [118, 678], mark: [128, 560], tap: [96, 556, 80, 24] },
    kids: { name: "ملعب العيال", stand: [268, 652], mark: [268, 606], zone: [182, 584, 184, 136] },
    bakery: { name: "فرن عم حسن", stand: [292, 514], mark: [292, 452], tap: [246, 458, 92, 34] },
    workshop: { name: "ورشة عم صابر", stand: [432, 656], mark: [432, 592], tap: [400, 604, 62, 36] },
    fulcart: { name: "عربية الفول", stand: [26, 544], mark: [26, 476], tap: [4, 490, 44, 38] },
    koshari: { name: "كشري أبو ياسر", stand: [94, 492], mark: [94, 424], tap: [64, 436, 60, 34] },
    kebab: { name: "الكبابجي", stand: [168, 500], mark: [162, 424], tap: [140, 436, 44, 34] },
    square: { name: "مائدة الرحمن", stand: [118, 346], mark: [60, 236], tap: [8, 236, 110, 100] },
    steps: { name: "سلم الجامع", stand: [268, 252], mark: [270, 204], tap: [214, 236, 68, 14] },
    mosque: { name: "الجامع", stand: [244, 242], mark: [244, 168], tap: [222, 194, 44, 42] },
    cafe: { name: "قهوة الحارة", stand: [452, 470], mark: [440, 396], tap: [400, 418, 82, 34] }
  };

  /* ================= life ================= */
  // The story's people at each time of day: [x, y, facing (0 down,1 up,2 left,3 right), pose]. days: when this line applies.
  var PEOPLE = [
    { id: "nemat", name: "الحاجة نعمات", face: "nemat",
      pos: { asr: [0, 0, 0, "balcony"], pre: [0, 0, 0, "balcony"], maghrib: [0, 0, 0, "balcony"], night: [112, 674, 0, "sit"] },
      say: [
        { if: "dodged", t: "«أنا {شايفاك|شايفاكي} من فوق على فكرة!»" },
        { when: "night", t: "«القطايف مستنياك على السلم يا {name}!»" },
        { if: "nemat", t: "«ما {تنساش|تنسيش} الرغيفين بتوع عم صابر!»" },
        { t: "«رمضان كريم يا {name}! خلي بالك من الكورة.»" }] },
    { id: "youssef", name: "يوسف", face: "youssef",
      pos: { asr: [228, 648, 3, "play"], pre: [228, 648, 3, "play"], night: [116, 580, 0, "roof"] },
      say: [
        { when: "night", t: "«السطوح فيه فوانيس كتير النهارده! {تعالى|تعالي}!»" },
        { if: "goal", t: "«الجون بتاعك ده هيتحكي لحد العيد!»" },
        { t: "«{تعالى|تعالي} العب! ناقصنا واحد!»" }] },
    { id: "malak", name: "ملك", face: "malak",
      pos: { asr: [308, 644, 2, "play"], pre: [308, 644, 2, "play"], night: [142, 578, 0, "roof"] },
      say: [
        { when: "night", t: "«فانوسي خشب! عم صابر هو اللي عامله!»" },
        { if: "gossip", t: "«ما {تقولش|تقوليش} لماما إني قلتلك!»" },
        { t: "«الكورة دي بتاعتي على فكرة، مش بتاعة يوسف.»" }] },
    { id: "omyoussef", name: "أم يوسف", face: "omyoussef",
      pos: { asr: [262, 520, 1], pre: [262, 520, 1] },
      posLater: { from: DAYS.omyoussefStall, at: [268, 556, 0], times: ["asr", "pre", "night"] },
      say: [
        { minDay: DAYS.omyoussefStall, t: "«قطايف بالقشطة والمكسرات! أول طبق ليك هدية يا {name}.»" },
        { if: "at_bakery", t: "«ربنا يجبر بخاطرك يا {ابني|بنتي}.»" },
        { t: "«الطابور طويل النهارده…»" }] },
    { id: "hassan", name: "عم حسن", face: "hassan",
      pos: { asr: [300, 506, 0], pre: [300, 506, 0], maghrib: [300, 506, 0], night: [300, 506, 0] },
      say: [
        { when: "night", t: "«الفرن قفل. نشوفك على السحور!»" },
        { if: "at_bakery", t: "«سلّم لي على عم صابر لو {شفته|شفتيه}.»" },
        { t: "«العيش طالع سخن! {قرّب|قرّبي}!»" }] },
    { id: "saber", name: "عم صابر", face: "saber",
      pos: { asr: [290, 246, 0, "sit"], pre: [290, 246, 0, "sit"], maghrib: [52, 292, 0, "sit"], night: [150, 344, 0] },
      posLater: { from: DAYS.workshopOpen, at: [428, 670, 0, "work"], times: ["asr", "pre", "night"], cast: "saberWork", face: "saber_smile" },
      say: [
        { minDay: DAYS.workshopOpen, t: "«{شايف|شايفة} الفوانيس دي؟ كل واحد فيها فيه حتة من الحارة. {خد|خدي} واحد، ده عليا.»" },
        { when: "night", t: "«الليلة لسه طويلة يا {ابني|بنتي}.»" },
        { t: "عم صابر ساكت، وعينه في الأرض." }] },
    { id: "rizq", name: "المعلم رزق", face: "rizq",
      pos: { asr: [64, 504, 2], pre: [232, 262, 3] },
      say: [
        { when: "pre", t: "«{إنت|إنتي} {واقف|واقفة} كده ليه؟ ما {تشوف|تشوفي} حالك!»" },
        { t: "«روبابيكيا! أي حاجة قديمة للبيع!»" }] }
  ];
  // Shopkeepers and neighbours. role: stand | sit | queue. behind: drawn behind a counter, cut at that y.
  var EXTRAS = [
    { cast: "sayed", name: "عم سيد", at: [26, 518, 0], times: ["asr", "pre", "maghrib"], say: ["«الفول بالزيت الحار! على الفطار بالهنا.»", "«{خد|خدي} لقمة دوق!»"] },
    { cast: "abuyasser", name: "أبو ياسر", at: [94, 478, 0], times: ["asr", "pre", "night"], say: ["«كشري سخن! صحن ولا اتنين؟»", "«الدقة والشطة على حسابي!»"] },
    { cast: "kebabgi", name: "الكبابجي", at: [176, 484, 0], times: ["asr", "pre", "night"], say: ["«الفحم ولّع! بعد المغرب الطابور هيبقى للشارع.»"] },
    { cast: "fakahani", name: "عم عوض الفكهاني", at: [80, 538, 0], times: ["asr", "pre", "night"], say: ["«البرتقال ده عسل! {دوق|دوقي} واحدة.»", "«الجوافة ريحتها واصلة للجامع.»"] },
    { cast: "w4", name: "أم هاني", at: [130, 540, 0], times: ["asr", "pre"], say: ["«بلح وقمر الدين وزبيب. كل حاجة للخشاف.»"] },
    { cast: "fawzy", name: "عم فوزي الفوانيسي", at: [188, 300, 2], times: ["asr", "pre", "night"], say: ["«فانوس بالشمعة ولا بالحجارة؟ الاتنين بيغنّوا!»", "«ده فانوس جدي. مش للبيع.»"] },
    { cast: "bashir", name: "عم بشير", at: [384, 530, 0], behind: [517, 534.5], times: ["asr", "pre", "maghrib", "night"], say: ["«عندي كل حاجة: لبان، بسكوت، كارت شحن، وحكايات ببلاش.»", "«{خد|خدي} مصاصة، دي على حسابي.»"] },
    { cast: "maalem", name: "المعلم سعيد", at: [468, 464, 0], times: ["asr", "pre", "night"], say: ["«واحد شاي على الريحة! {اقعد|اقعدي} {يا بطل|يا ست البنات}.»", "«التلفزيون ده شاف ماتشات أكتر من أي حد في الحارة.»"] },
    { cast: "m2", name: "عم فتحي", sitAt: "m2", times: ["asr", "pre", "night"], say: ["«شيش بيش! الدور عليك يا عم محمود.»", "«رمضان كريم يا {ابني|بنتي}.»"] },
    { cast: "m4", name: "عم محمود", sitAt: "m4", times: ["asr", "pre", "night"], say: ["«الدومينو ده مش لعبك يا فتحي.»"] },
    { cast: "m3", name: "الأستاذ عادل", sitAt: "m3", times: ["pre", "night"], say: ["«المسلسل هيبدأ! حد يعلّي الصوت.»"] },
    { cast: "m5", name: "دكتور هشام", sitAt: "m5", times: ["night"], say: ["«قهوة مظبوط وحكاية حلوة. ده علاجي.»"] },
    { cast: "m1", name: "حمادة", sitAt: "m1", times: ["night"], say: ["«مين كسب امبارح؟ ما {تقولش|تقوليش}، أنا مسجّله!»"] },
    { cast: "mandour", name: "عم مندور", at: [464, 336, 2], times: ["asr", "pre", "night"], say: ["«كركديه ساقع! تمر هندي! سوبيا! {اشرب|اشربي} وادعيلي.»", "«الكوباية الأولى عليا، علشان خاطر رمضان.»"] },
    { cast: "k4", name: "نور", at: [206, 672, 3, "sit"], times: ["asr", "pre"], say: ["«أنا الحَكَم! الجون ده تسلل!»"] },
    { cast: "k1+l", name: "زياد", at: [236, 664, 3], times: ["night"], say: ["«وحوي يا وحوي، إيوحا!»", "«{تعالى|تعالي} نلف الحارة بالفوانيس!»"] },
    { cast: "k2+l", name: "نور", at: [262, 668, 2], times: ["night"], say: ["«فانوسي بيغني! {اسمع|اسمعي}!»"] },
    { cast: "k1", name: "زياد", at: [352, 690, 2], times: ["asr", "pre"], days: { to: DAYS.workshopOpen - 1 }, say: ["«أنا مستني دوري في الماتش…»"] },
    { cast: "w2", name: "أم كريم", at: [250, 522, 1], times: ["asr", "pre"], role: "queue", say: ["«خمسة أرغفة بس يا عم حسن الله يخليك.»"] },
    { cast: "m1", name: "كريم", at: [276, 528, 1], times: ["asr", "pre"], role: "queue", say: ["«الطابور ده مش بيتحرك ليه؟»"] },
    { cast: "sheikh", name: "الشيخ عبد الله", at: [222, 252, 0], times: ["maghrib", "night"], say: ["«تقبّل الله يا {ابني|بنتي}.»", "«التراويح بعد العشا، {متتأخرش|متتأخريش}.»"] },
    // after iftar the food places have a line out the door
    { cast: "m6", name: "عم رمضان", at: [84, 506, 1], times: ["night"], role: "queue", say: ["«الطابور ده كله على الكشري؟ يستاهل.»"] },
    { cast: "w5", name: "أم سمير", at: [98, 512, 1], times: ["night"], role: "queue", say: ["«بعد التراويح الكشري ليه طعم تاني.»"] },
    { cast: "k5", name: "حودة", at: [108, 506, 2], times: ["night"], say: ["«أنا طالب طبق لوحدي النهارده!»"] },
    { cast: "m8", name: "أشرف", at: [162, 512, 1], times: ["night"], role: "queue", say: ["«ريحة الفحم دي جابتني من آخر الحارة.»"] },
    { cast: "w6", name: "أم مازن", at: [176, 516, 2], times: ["night"], say: ["«نص كيلو كفتة وسلطة طحينة… لا خليهم كيلو.»"] },
    { cast: "m7", name: "الحاج سليمان", at: [60, 524, 0], times: ["night"], say: ["«الحارة بالليل في رمضان مفيش زيها.»"] },
    { cast: "k4", name: "سلمى", at: [450, 790, 0], times: ["asr", "pre"], days: { from: DAYS.gardenOpen }, say: ["«زرعت ريحان! هيطلع إمتى؟»", "«{تعالى|تعالي} {ساعدنا|ساعدينا} نسقي!»"] },
    { cast: "k3", name: "عمر", at: [492, 800, 2], times: ["asr", "pre"], days: { from: DAYS.gardenOpen }, say: ["«دي كانت زبالة! دلوقتي بقت جنينة!»"] },
    { cast: "k1", name: "زياد", at: [452, 690, 1], times: ["asr", "pre"], days: { from: DAYS.workshopOpen }, say: ["«عم صابر هيعلّمني أعمل فانوس!»"] }
  ];
  // People who walk the hara on their own errands
  var WALKERS = [
    { cast: "w1", name: "أم سعاد", say: ["«رمضان كريم!»", "«الله أكرم.»"] },
    { cast: "w3", name: "الحاجة فاطمة", say: ["«كل سنة وانت طيب يا {حبيبي|حبيبتي}.»"] },
    { cast: "m1", name: "حمادة", say: ["«{شفت|شفتي} الفوانيس اللي على الجامع؟»"] },
    { cast: "k1", name: "زياد", kid: true, say: ["«وحوي يا وحوي!»"] },
    { cast: "k2", name: "نور", kid: true, say: ["«بابا جابلي فانوس بيغني!»"] },
    { cast: "k3", name: "عمر", kid: true, say: ["«مين يسابقني لحد الجامع؟»"] },
    { cast: "m2", name: "عم رجب", say: ["«ربنا يتقبل.»"] },
    { cast: "w2", name: "مدام عفاف", say: ["«العيش النهارده سخن ومقمّر.»"] }
  ];
  // Points where walkers turn around or stop to chat, by place
  var WAYPOINTS = [
    [40, 350], [190, 330], [300, 320], [420, 330], [540, 300], [250, 270],
    [206, 420], [20, 500], [120, 512], [180, 520],
    [210, 530], [320, 540], [370, 470], [470, 520], [560, 500], [374, 380],
    [362, 600], [440, 700], [540, 690],
    [200, 600], [300, 700], [40, 720], [150, 704]
  ];
  var CATS = [
    { coat: "ginger", at: [344, 534], mode: "sleep" },
    { coat: "calico", at: [56, 538], mode: "beg", area: [40, 530, 80, 12] },
    { coat: "grey", at: [300, 690], mode: "wander", area: [190, 660, 160, 50] },
    { coat: "black", at: [22, 700], mode: "sit" },
    { coat: "ginger", at: [426, 646], mode: "sleep", days: { to: DAYS.workshopOpen - 1 } },
    { coat: "grey", at: [520, 470], mode: "wander", area: [470, 470, 90, 50] },
    { coat: "black", at: [498, 791], z: 17, mode: "sleep", days: { to: DAYS.gardenOpen - 1 } },
    { coat: "calico", at: [470, 806], mode: "sit", days: { to: DAYS.gardenOpen - 1 } }
  ];
  var FLOCKS = [
    { at: [292, 548], n: 6 },   // crumbs by the bakery
    { at: [240, 312], n: 6 },   // the square
    { at: [520, 690], n: 4 }    // Saber's yard
  ];
  // The kids' pitch: where the ball can go
  var FIELD = { x0: 190, y0: 600, x1: 360, y1: 712 };
  // Kids flying kites from the rooftops in the afternoon: where they stand, which way the wind takes the kite
  var KITES = [
    { cast: "k3", at: [300, 768], to: [-60, -230], c: "#E8503F" },
    { cast: "k2", at: [64, 800], to: [70, -250], c: "#4F97E8" }
  ];

  // What you notice when you tap something. flag: something you learn by looking.
  var LOOK = {
    home: [{ when: "night", t: "ماما بتنادي من الشباك: الشاي على السطوح!" }, { t: "ماما مستنية العيش. ما {ترجعش|ترجعيش} من غيره!" }],
    roof: [{ when: "night", t: "فوق على السطوح: العيال والفوانيس." }, { t: "سلم السطوح. الفوانيس متعلقة من إمبارح." }],
    bakery: [{ when: "night", t: "الفرن قفل. لوحة العيش المعلّق لسه على الحيطة." }, { if: "at_bakery", t: "لوحة العيش المعلّق جنب الباب." }, { t: "ريحة العيش السخن واصلة لآخر الحارة." }],
    workshop: [{ minDay: DAYS.workshopOpen, t: "الورشة مليانة نشارة وفوانيس خشب. ريحتها خشب وشاي." }, { when: "night", t: "باب الورشة مقفول، ولمبتها مطفية." }, { t: "ورشة عم صابر مقفولة. على الباب ورقة متلزقة بشريط بني: «للبيع».", flag: "sign", news: "عرفت حاجة جديدة عن عم صابر" }],
    fulcart: [{ t: "عم سيد بيقلّب قدرة الفول. الريحة تجنن." }],
    koshari: [{ t: "كشري أبو ياسر. صوت المعالق في الصاج واصل لبرا." }],
    kebab: [{ when: "night", t: "ريحة الكباب مالية الحارة." }, { t: "الكبابجي لسه بيولّع الفحم." }],
    square: [{ when: "night", t: "الترابيزات فضيت، والفوانيس منوّرة." }, { t: "المائدة بتتفرش: ترابيزات طويلة وكراسي ملونة." }],
    steps: [{ when: "night", t: "الجامع منوّر للتراويح." }, { t: "سلم الجامع. ناس قاعدة مستنية المغرب." }],
    mosque: [{ when: "night", t: "الجامع منوّر للتراويح." }, { t: "الجامع. لسه بدري على المغرب." }],
    kids: [{ t: "العيال عاملين ماتش ولا كأس العالم." }],
    cafe: [{ when: "night", t: "القهوة مليانة. الكل مستني المسلسل." }, { t: "قهوة الحارة. صوت الطاولة والشاي والراديو." }],
    zeer: [{ t: "زير مية قدام بيت الحاجة نعمات. أي حد عطشان يشرب." }],
    sabil: [{ t: "سبيل الجامع. المية ساقعة حتى في الحر." }],
    kunafa: [{ t: "صاج الكنافة. عم زكي بيلف الكوز فوقه لفّة ورا لفّة، والخيوط بتنشف في ثانية. ريحة سمنة وعجين." }],
    cooler: [{ when: "night", t: "كولدير الجامع. المية ساقعة، وجنبه كوباية معدن مربوطة بسلسلة." }, { t: "كولدير الجامع. صوت المكنة بيزنّ زي النحلة." }],
    kiosk: [{ t: "كشك عم بشير. التلاجة فيها كل الألوان." }],
    tree: [{ t: "الجميزة دي أكبر من الحارة نفسها. الحاجة نعمات بتقول إنها كانت هنا قبل الجامع." }],
    mural: [{ t: "جدارية رمضان. العيال رسموها السنة اللي فاتت." }],
    plants: [{ t: "زرع الحاجة نعمات. ريحان وصبّار وجيرانيوم." }],
    kitten: [{ t: "شوال الدقيق بيتحرك… لأ، دي قطة صغيرة نايمة." }],
    gate: [{ minDay: DAYS.gardenOpen, t: "باب الجنينة مفتوح." }, { t: "باب حديد مقفول بجنزير. ورا السور أرض فاضية مليانة طوب وزرع ناشف." }],
    drinks: [{ t: "عربية عم مندور: كركديه وتمر هندي وسوبيا. الكوبايات بتخبط في بعض وهو بيغني." }],
    car: [{ t: "عربية قديمة مركونة من قبل ما {تتولد|تتولدي}. القطط عاملينها بيت." }]
  };
  // Little secrets of the hara. Find each one once; they stay in your memories all month.
  var SECRETS = [
    { id: "carved", look: "tree", at: [352, 474], t: "على جذع الجميزة حروف محفورة من زمان: «ن + ع ١٩٧٤». مين ن ومين ع؟" },
    { id: "kitten", look: "kitten", at: [352, 516], t: "قطة صغيرة نايمة على شوال الدقيق، دافية من الفرن. عم حسن سايبها بمزاجه." },
    { id: "muralName", look: "mural", at: [236, 556], t: "تحت الهلال في الجدارية، بخط صغير: «ملك، ٨ سنين». ملك هي اللي رسمت الهلال!" },
    { id: "sabilCup", look: "sabil", at: [515, 250], t: "على السبيل كوباية نحاس مربوطة بسلسلة. محفور عليها: «اشرب وادعي لصاحبها»." },
    { id: "kioskRadio", look: "kiosk", at: [390, 500], t: "عم بشير مخبّي راديو قديم تحت الترابيزة. بيقول إنه بيجيب إذاعة القرآن أحسن من أي موبايل." },
    { id: "zeerNote", look: "zeer", at: [60, 672], t: "على الزير ورقة صغيرة: «المية دي صدقة على روح الحاج عبده». جوز الحاجة نعمات." },
    { id: "gateKey", look: "gate", at: [462, 716], t: "على باب الجنينة يافطة قديمة مكتوب عليها: «جنينة الحارة». يعني كانت جنينة زمان!" },
    { id: "plantsBasil", look: "plants", at: [16, 652], t: "الحاجة نعمات زارعة ريحان كفاية للحارة كلها. بتقول: «الريحان بيجيب الخير»." }
  ];

  // Small good deeds for each day, beside the story's errands. look: tap that thing. cat: pet a cat. talk: talk to that person.
  var DEED_POOL = [
    { id: "water", t: "{اسقي|اسقي} زرع الحاجة نعمات", look: "plants", hold: "can",
      did: "{سقيت|سقيتي} زرع الحاجة نعمات. الريحان شرب ولمع، وريحته طلعت في الحارة كلها." },
    // night: you're fasting until maghrib, so these wait for iftar
    { id: "sabil", t: "{اشرب|اشربي} من سبيل الجامع بعد الفطار", look: "sabil", also: ["cooler"], night: true, hold: "cup",
      did: "{شربت|شربتي} من السبيل بعد الفطار. المية ساقعة، و{دعيت|دعيتي} لصاحبه." },
    { id: "cat", t: "{دلّع|دلّعي} قطة من قطط الحارة", cat: true },
    { id: "bashir", t: "{سلّم|سلّمي} على عم بشير في الكشك", talk: "bashir" },
    { id: "tree", t: "{استريّح|استريّحي} شوية تحت الجميزة", look: "tree",
      did: "{قعدت|قعدتي} شوية في ضل الجميزة. الهوا هنا أبرد، والعصافير فوق مش ساكتة." },
    { id: "fawzy", t: "{اتفرّج|اتفرّجي} على فوانيس عم فوزي", talk: "fawzy" },
    { id: "kitten", t: "{دوّر|دوّري} على القطة الصغيرة اللي عند الفرن", look: "kitten" },
    { id: "zeer", t: "{اشرب|اشربي} من زير الحاجة نعمات بعد الفطار", look: "zeer", night: true, hold: "cup",
      did: "{شربت|شربتي} من الزير. الفخار مخلّي المية ساقعة من غير تلاجة." },
    { id: "maalem", t: "{سلّم|سلّمي} على المعلم سعيد في القهوة", talk: "maalem" },
    { id: "mural", t: "{دوّر|دوّري} على اسم اللي رسم الجدارية", look: "mural" },
    { id: "fruit", t: "{خد|خدي} برتقانة من عم عوض الفكهاني", talk: "fakahani" }
  ];
  var DEEDS = {
    1: ["water", "sabil", "cat"],
    2: ["bashir", "tree", "kitten"],
    3: ["fawzy", "zeer", "maalem"]
  };
  function deedsFor(day) {
    var ids = DEEDS[day];
    if (!ids) { ids = []; for (var i = 0; i < 3; i++) ids.push(DEED_POOL[(day * 3 + i * 4) % DEED_POOL.length].id); }
    return ids.map(function (id) { return DEED_POOL.filter(function (d) { return d.id === id; })[0]; }).filter(Boolean);
  }

  // Which places a story scene leaves you at
  var PLACE_SPOT = { home: "home", alley: "kids", bakery: "bakery", steps: "steps", table: "square", steps_iftar: "steps",
    fulcart: "fulcart", koshari: "koshari", kebab: "kebab", mosque: "mosque", roof: "roof", workshop: "workshop" };

  /* ================= walkable ground ================= */
  // Rectangles you can walk on. Props carve holes. days: only on those days.
  var WALK = [
    [0, 244, W, 108],                 // the mosque square
    [MOSQUE.x + 70, 232, 52, 12],     // up the steps to the door
    [197, 350, 20, 150],              // the alley, out under the arch into the market and the bakery
    [0, 476, 196, 70],                // the market lane
    [179, 540, 17, 48],               // a short cut from the market down to the kids' lot
    [196, 496, 164, 72],              // the bakery forecourt
    [278, 562, 34, 24],               // the gap in the mural wall
    [356, 350, 36, 110],              // under the sycamore, from the square
    [356, 458, W - 356, 78],          // the café terrace
    [344, 532, 48, 112],              // the east alley and its steps
    [182, 584, 184, 136],             // the kids' lot
    [0, 666, 184, 72],                // home
    [366, 646, W - 366, 76],          // Saber's yard
    { r: [452, 716, 22, 26], days: { from: DAYS.gardenOpen } },   // the garden gate, once it opens
    { r: [388, 742, 184, 88], days: { from: DAYS.gardenOpen } }   // the garden
  ];

  function build() {
    var houses = HOUSES.map(function (b) {
      var states = { closed: paintHouse(b, "closed") };
      if (b.openFrom) states.open = paintHouse(b, "open");
      b.states = states;
      b.stateFor = function (day) { return b.openFrom && day >= b.openFrom ? "open" : "closed"; };
      b.setDay = function (day) { var s = states[b.stateFor(day)]; b.canvas = s.canvas; b.out = s.out; b.y = b.base - s.canvas.height; };
      b.setDay(1);
      return b;
    });
    return {
      W: W, HGT: HGT, houses: houses, mosque: paintMosque(), minaret: paintMinaret(),
      ground: paintGround(), roofs: ROOFS, kites: KITES, sky: paintSky, SKIES: SKIES, props: PROPS, strings: STRINGS, walk: WALK
    };
  }

  H.world = {
    CAST: CAST, SPOTS: SPOTS, PEOPLE: PEOPLE, EXTRAS: EXTRAS, WALKERS: WALKERS, WAYPOINTS: WAYPOINTS, CATS: CATS, FLOCKS: FLOCKS,
    LOOK: LOOK, SECRETS: SECRETS, PLACES: PLACES, PLACE_SPOT: PLACE_SPOT, MOSQUE: MOSQUE, FIELD: FIELD, DAYS: DAYS, NEWS: NEWS,
    inDays: inDays, deedsFor: deedsFor, build: build, W: W, HGT: HGT
  };
})();
