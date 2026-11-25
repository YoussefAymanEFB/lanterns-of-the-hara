/* فوانيس الحارة · ملاهي ليالي رمضان: the Ramadan fair (walk.html).
   From night 15 the gate past the minaret opens after iftar, and behind the houses there's a fairground: the big wheel
   you've watched over the roofs for two weeks, a carousel of painted horses, the boat swings, the shooting stall, ring
   toss, duck fishing, the strongman's bell, cotton candy, popcorn, roasted corn, bulbs strung over everything and the
   fair's band on the loudspeakers. Every stall is a game (js/hara-games.js); points become tickets; the prize stall
   swaps 60 tickets for the paper cone hat you then wear all over the hara. You can ride the carousel, and the wheel
   takes you up until you can see the whole hara lit up below you. Open maghrib and night (it shuts before suhoor). */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world, PL = H.places;
  if (!A || !WD || !H.rooms || !PL) return;
  var S = PL.S, ar = PL.ar, sprite = A.sprite, PROPS = A.PROPS, dk = A.dk, lt = A.lt, mix = A.mix, rng = A.rng, SK = A.SKIN, WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS;
  var K = H.rooms.kit;
  var FW = 300, FH = 262, TOP = 74;
  var HAT = 60, BALLOON = 30;
  var COLS = ["#E8503F", "#F2C14A", "#4CBF73", "#4F97E8", "#B86BE0", "#FF8F3F"];
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ================= the people of the fair ================= */
  var CAST = {
    burai: { build: "fat", skin: SK.tan, hair: { style: "grey", c: "#8A8480" }, head: { kind: "cap", c: "#2F6A8A" }, top: { kind: "shirt", c: "#F2C14A" }, legs: "#3A3550", mus: "#8A8480", shoes: "#2A2224" },
    kamal: { skin: SK.deep, hair: { style: "short", c: "#1F1619" }, head: { kind: "cap", c: "#E8503F" }, top: { kind: "shirt", c: "#2A3F7A" }, legs: "#2E2A36", mus: "#1F1619", shoes: "#2A2224" },
    sika: { build: "thin", skin: SK.mid, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "tee", c: "#4CBF73" }, legs: "#3A3A48", shoes: "#F2F0EA" },
    omshaimaa: { build: "fat", skin: SK.mid, head: { kind: "hijab", c: "#F48AB8" }, top: { kind: "robe", c: "#5A3A7A" }, apron: "#F4EFE4", shoes: "#3A2A26" },
    hanafy: { skin: SK.tan, hair: { style: "sides", c: "#2B1F26" }, top: { kind: "shirt", c: "#8A2A34" }, vest: "#3A3440", legs: "#2E2A36", mus: "#2B1F26", musBig: true },
    risha: { build: "thin", skin: SK.fair, hair: { style: "short", c: "#5A3A28" }, head: { kind: "cap", c: "#F2C14A" }, top: { kind: "tee", c: "#E8503F" }, legs: "#2F4A7A", shoes: "#F2F0EA" },
    antar: { build: "fat", skin: SK.deep, hair: { style: "short", c: "#1F1619" }, top: { kind: "tee", c: "#F4EFE4" }, legs: "#8A2A34", mus: "#1F1619", musBig: true, shoes: "#2A2224" },
    sawsan: { skin: SK.fair, head: { kind: "hijab", c: "#2F8A86" }, top: { kind: "robe", c: "#E8503F" }, glasses: true, shoes: "#3A2A26" },
    v1: { skin: SK.mid, hair: { style: "short", c: "#2B1F26" }, top: { kind: "shirt", c: "#5E8DC4" }, legs: "#3A3550", mus: "#2B1F26" },
    v2: { skin: SK.tan, head: { kind: "hijab", c: "#B86BE0" }, top: { kind: "robe", c: "#3F5A8A" } },
    v3: { build: "fat", skin: SK.deep, head: { kind: "hijab", c: "#F2C14A" }, top: { kind: "robe", c: "#2F6A5A" } },
    v4: { skin: SK.fair, hair: { style: "short", c: "#5A3A28" }, top: { kind: "shirt", c: "#C8443A" }, legs: "#2E2A36" },
    k9: { kid: true, skin: SK.mid, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "tee", c: "#F2C14A" }, legs: "#3A3A48", shoes: "#E8503F" },
    k10: { kid: true, skin: SK.tan, head: { kind: "hijab", c: "#4F97E8" }, top: { kind: "dress", c: "#F48AB8" }, shoes: "#F2F0EA" },
    // kids on the rides (only ever seen riding)
    r1: { kid: true, skin: SK.deep, hair: { style: "short", c: "#1F1619" }, top: { kind: "tee", c: "#E8503F" }, legs: "#2F4A7A" },
    r2: { kid: true, skin: SK.fair, hair: { style: "braids", c: "#7A4A2A" }, top: { kind: "dress", c: "#4CBF73" } },
    r3: { kid: true, skin: SK.mid, head: { kind: "hijab", c: "#F2C14A" }, top: { kind: "dress", c: "#B86BE0" } },
    r4: { kid: true, skin: SK.tan, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "tee", c: "#4F97E8" }, legs: "#3A3A48" }
  };
  Object.keys(CAST).forEach(function (k) { if (!WD.CAST[k]) WD.CAST[k] = CAST[k]; });
  var NAMES = { burai: "عم برعي", kamal: "الريس كمال", sika: "سيكا", omshaimaa: "أم شيماء", hanafy: "المعلم حنفي", risha: "ريشة", antar: "عنتر", sawsan: "مدام سوسن" };

  /* ================= the stalls ================= */
  PROPS.blank = function (o) { return A.cv(o.w || 1, o.h || 1); }; // an invisible footprint (and something to tap) for the rides
  function canopy(P, w, c1, c2, y) { // a striped canopy with a scalloped edge
    for (var x = 0; x < w; x++) { var c = ((x / 5) | 0) % 2 ? c1 : c2; P.r(x, y, 1, 7, c); if (x % 5 < 3) P.p(x, y + 7, c); }
    P.r(0, y, w, 1, "rgba(255,255,255,0.4)");
  }
  PROPS.shootStall = function () {
    return sprite(58, 50, function (P) {
      P.r(1, 8, 2, 40, WOOD[2]); P.r(55, 8, 2, 40, WOOD[3]);
      P.r(3, 10, 52, 28, "#E8DCC0"); for (var y = 12; y < 38; y += 5) P.r(3, y, 52, 1, "#D8C8A8");
      for (var i = 0; i < 10; i++) { var bx = 7 + (i % 5) * 10, by = 14 + ((i / 5) | 0) * 11, c = COLS[i % 6]; P.el(bx, by, 6, 8, c); P.p(bx + 1, by + 1, "#FFFFFF"); P.r(bx + 3, by + 8, 1, 2, "#8A8478"); }
      canopy(P, 58, "#8A2A34", "#F2C14A", 0);
      P.r(0, 38, 58, 10, "#8A5A3A"); P.r(0, 38, 58, 2, "#B8743A"); for (var x = 2; x < 58; x += 8) P.r(x, 40, 1, 8, "#6A4430");
      P.r(6, 36, 18, 3, "#3A3440"); P.r(20, 35, 7, 4, "#6A4430"); P.r(32, 36, 18, 3, "#3A3440"); P.r(46, 35, 7, 4, "#6A4430");
    }, [0, 46, 58, 5, 0.25]);
  };
  PROPS.ringStall = function () {
    return sprite(58, 48, function (P) {
      P.r(1, 8, 2, 38, WOOD[2]); P.r(55, 8, 2, 38, WOOD[3]);
      P.r(3, 10, 52, 26, "#2A3F7A");
      for (var j = 0; j < 3; j++) { P.r(5, 20 + j * 6, 48, 2, WOOD[1]); for (var i = 0; i < 7; i++) { var c = ["#3FA86A", "#C8443A", "#4F97E8", "#F2C14A"][(i + j) % 4]; P.r(7 + i * 7, 14 + j * 6, 3, 6, c); P.r(8, 0, 0, 0, c); P.r(7 + i * 7 + 1, 12 + j * 6, 1, 2, c); } }
      for (var r = 0; r < 4; r++) { P.el(42 + (r % 2) * 5, 2 + r * 2, 8, 4, "#E8503F"); }
      canopy(P, 58, "#3F8F5F", "#F4EFE4", 0);
      P.r(0, 36, 58, 10, "#6A4430"); P.r(0, 36, 58, 2, "#8A5A3A");
    }, [0, 44, 58, 5, 0.25]);
  };
  PROPS.duckStall = function () {
    return sprite(58, 42, function (P) {
      P.r(1, 4, 2, 36, WOOD[2]); P.r(55, 4, 2, 36, WOOD[3]);
      canopy(P, 58, "#2F6A8A", "#F4EFE4", 0);
      P.el(4, 20, 50, 20, "#8A5A3A"); P.el(6, 20, 46, 17, "#B8743A"); P.el(9, 22, 40, 12, "#2F8AC8"); P.el(13, 23, 32, 8, "#3FA0D8");
      P.r(44, 9, 1, 14, "#C9A46A"); P.r(30, 9, 14, 1, "#C9A46A"); P.r(30, 10, 1, 8, "#E8E2D6"); // a rod over the water
    }, [0, 36, 58, 6, 0.25]);
  };
  function duckSwim(R, x0, top) { // the little ducks going round
    for (var i = 0; i < 6; i++) {
      var a = R.T * 0.7 + i / 6 * Math.PI * 2, x = Math.round(x0 + 29 + Math.cos(a) * 15), y = Math.round(top + 28 + Math.sin(a) * 4);
      R.rect(x - 2, y - 1, 4, 2, i === 3 ? "#FFD24A" : "#FFE07A"); R.rect(x + 1, y - 3, 2, 2, "#FFE07A"); R.rect(x + 3, y - 2, 1, 1, "#F08A2A");
    }
  }
  PROPS.prizeStall = function () {
    return sprite(56, 50, function (P) {
      P.r(1, 8, 2, 40, WOOD[2]); P.r(53, 8, 2, 40, WOOD[3]);
      P.r(3, 10, 50, 28, "#5A2A5A");
      // paper cone hats in a row, teddy bears, pinwheels, balloons
      for (var i = 0; i < 5; i++) { var hx = 6 + i * 9; for (var r = 0; r < 8; r++) { var hw = Math.round(r * 0.4); P.r(hx + 3 - hw, 12 + r, hw * 2 + 1, 1, ((r >> 1) % 2) ? "#F2C14A" : COLS[i % 6]); } P.r(hx + 2, 10, 3, 2, "#FFFFFF"); }
      [[8, 24, "#C8874A"], [24, 24, "#F4EFE4"], [40, 24, "#E8A0B0"]].forEach(function (b) { P.el(b[0], b[1] + 3, 9, 9, b[2]); P.el(b[0] + 1, b[1], 3, 3, b[2]); P.el(b[0] + 5, b[1], 3, 3, b[2]); P.p(b[0] + 3, b[1] + 5, "#2A1A24"); P.p(b[0] + 5, b[1] + 5, "#2A1A24"); P.p(b[0] + 4, b[1] + 7, "#2A1A24"); });
      canopy(P, 56, "#B86BE0", "#F2C14A", 0);
      P.r(0, 38, 56, 10, "#C8443A"); P.r(0, 38, 56, 2, "#E8706A"); for (var x = 3; x < 56; x += 6) P.p(x, 44, "#F2C14A");
    }, [0, 46, 56, 5, 0.25]);
  };
  PROPS.hammerTower = function () {
    return sprite(24, 74, function (P) {
      P.r(8, 8, 8, 62, "#E8DCC0"); P.r(8, 8, 1, 62, "#FFFFFF"); P.r(15, 8, 1, 62, "#B8A888");
      for (var i = 0; i < 8; i++) P.r(9, 62 - i * 7, 6, 6, ["#4CBF73", "#8AD04A", "#C8D040", "#F2C14A", "#F2A040", "#F08A2A", "#E8603A", "#E8503F"][i]);
      P.r(11, 10, 2, 60, "#5A4A48");
      P.el(5, 0, 14, 10, "#F2C76C"); P.el(7, 1, 10, 7, "#C8963E");
      P.r(3, 68, 18, 5, "#8A8E94"); P.r(6, 66, 12, 3, "#6A6E74");
    }, [0, 70, 24, 4, 0.25]);
  };
  PROPS.popcornCart = function () {
    return sprite(30, 40, function (P) {
      P.r(3, 10, 24, 18, "#D8E8F0"); P.r(3, 10, 24, 1, "#FFFFFF"); P.r(3, 10, 2, 18, "#C8303A"); P.r(25, 10, 2, 18, "#C8303A");
      P.dots(6, 16, 18, 11, ["#FFF8E0", "#FFE8A0", "#F8F0D0"], 90, rng(4)); P.r(6, 24, 18, 3, "#FFF0C0");
      P.r(1, 4, 28, 6, "#C8303A"); P.r(1, 4, 28, 1, "#E8505A"); for (var x = 2; x < 29; x += 4) P.r(x, 8, 2, 2, "#F4EFE4");
      P.r(3, 28, 24, 6, "#C8303A"); P.el(4, 32, 7, 7, "#3A3440"); P.el(19, 32, 7, 7, "#3A3440"); P.p(7, 35, "#8A8E94"); P.p(22, 35, "#8A8E94");
      P.r(12, 0, 6, 4, "#F2C14A");
    }, [0, 36, 30, 4, 0.25]);
  };
  PROPS.cornGrill = function () {
    return sprite(26, 22, function (P) {
      P.r(1, 8, 24, 8, "#3A3440"); P.r(1, 8, 24, 1, "#6A6E74"); P.r(3, 16, 2, 6, "#3A3440"); P.r(21, 16, 2, 6, "#3A3440");
      for (var i = 0; i < 4; i++) { P.r(3 + i * 6, 4, 4, 5, "#E8B840"); P.p(3 + i * 6, 5, "#C8902A"); P.p(5 + i * 6, 7, "#8A5A2A"); P.r(4 + i * 6, 2, 2, 2, "#6EBE58"); }
      P.r(2, 9, 22, 2, "#FF8A2A");
    }, [0, 18, 26, 4, 0.25]);
  };

  /* ================= the rides, drawn every frame ================= */
  var ST = { ride: null, rideXY: null, calls: 6 };
  // the carousel: a striped tent roof on a centre pole, painted horses rising and falling as they go round
  var CX = 70, CY = 124, CRX = 48, CRY = 14;
  var HORSE = ["#F4EFE4", "#E8503F", "#4F97E8", "#F2C14A", "#B86BE0", "#4CBF73", "#FF8F3F", "#F4EFE4"];
  var RIDERS = [null, "r1", null, "r2", null, "r3", null, "r4"];
  function horse(R, x, y, c, face, rider, me) {
    var d = face; // 1: going right, -1: going left
    R.rect(x - 1, y - 30, 1, 30, "#F2C76C");
    R.rect(x - 5, y - 12, 10, 5, c); R.rect(x - 5, y - 12, 10, 1, lt(c, 0.3));
    R.rect(x + d * 4 - (d < 0 ? 2 : 0), y - 17, 3, 6, c); R.rect(x + d * 6 - (d < 0 ? 2 : 0), y - 18, 3, 3, c); R.rect(x + d * 7, y - 17, 1, 1, "#2A1A24");
    R.rect(x + d * 3, y - 18, 1, 5, "#8A2A34");
    R.rect(x - 4, y - 7, 1, 4, c); R.rect(x + 3, y - 7, 1, 4, c); R.rect(x - d * 6, y - 11, 2, 3, "#8A2A34");
    R.rect(x - 2, y - 13, 4, 2, "#C8443A");
    if (me) { var sp = me.sp, f = sp.sit[d > 0 ? 3 : 2]; R.img(f, x - 11, y - 35); R.wear({ x: x, y: y - 5, sp: sp, dir: d > 0 ? 3 : 2, sit: true, moving: false }); }
    else if (rider) { var sp2 = R.spr(rider), f2 = sp2.sit[d > 0 ? 3 : 2]; R.img(f2, x - 11, y - 33); }
  }
  function drawCarousel(R) {
    var spin = R.T * 0.55, i, list = [];
    // the platform
    for (var r = 0; r < 6; r++) { var c = r % 2 ? "#C8963E" : "#F2C76C"; ellipse(R, CX, CY + 4 + r * 0.6, CRX + 2 - r * 0.2, CRY + 1, r < 1 ? "#8A6224" : c, true); }
    ellipse(R, CX, CY + 4, CRX, CRY, "#B8743A", true);
    for (i = 0; i < 8; i++) {
      var a = spin + i / 8 * Math.PI * 2, x = Math.round(CX + Math.cos(a) * (CRX - 8)), y = Math.round(CY + Math.sin(a) * (CRY - 3)), bob = Math.round(Math.sin(R.T * 3 + i * 1.7) * 2);
      list.push({ i: i, x: x, y: y + bob, back: Math.sin(a) < 0, face: -Math.sin(a + Math.PI / 2) > 0 ? 1 : -1, a: a });
    }
    var me = ST.ride && ST.ride.k === "carousel" ? R.me : null;
    list.filter(function (h) { return h.back; }).sort(function (p, q) { return p.y - q.y; }).forEach(function (h) { horse(R, h.x, h.y, HORSE[h.i], h.face, RIDERS[h.i], me && h.i === 0 ? me : null); if (me && h.i === 0) ST.rideXY = [h.x, h.y - 20]; });
    // the centre: a mirrored drum with lights, the pole
    R.rect(CX - 7, CY - 44, 14, 40, "#8A2A34"); R.rect(CX - 7, CY - 44, 14, 2, "#F2C76C");
    for (var m = 0; m < 3; m++) R.rect(CX - 5 + m * 4, CY - 38, 2, 26, ((m + ((R.T * 3) | 0)) % 3) ? "#C8E8F8" : "#FFFFFF");
    list.filter(function (h) { return !h.back; }).sort(function (p, q) { return p.y - q.y; }).forEach(function (h) { horse(R, h.x, h.y, HORSE[h.i], h.face, RIDERS[h.i], me && h.i === 0 ? me : null); if (me && h.i === 0) ST.rideXY = [h.x, h.y - 20]; });
    // the roof: a striped cone with a scalloped edge and bulbs
    var ry = CY - 50;
    for (var y = 0; y < 22; y++) {
      var hw = Math.round(6 + y / 22 * (CRX + 2));
      for (var x2 = -hw; x2 <= hw; x2++) { var ang = Math.atan2(x2 / hw, 0.6) + spin * 0.7, s = Math.floor(ang * 4) % 2; R.rect(CX + x2, ry + y, 1, 1, s ? "#E8503F" : "#F4EFE4"); }
    }
    for (var e = -CRX - 2; e <= CRX + 2; e += 4) { R.rect(CX + e, ry + 22, 3, 2, "#F2C14A"); R.rect(CX + e + 1, ry + 24, 1, 1, ((e + ((R.T * 6) | 0)) % 3) ? "#FFE07A" : "#FFFFFF"); }
    R.rect(CX - 1, ry - 8, 2, 8, "#F2C76C"); R.rect(CX + 1, ry - 8, 5, 3, "#4CBF73");
  }
  function ellipse(R, cx, cy, rx, ry, col, fill) {
    for (var j = -ry; j <= ry; j++) { var hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); R.rect(cx - hw, cy + j, hw * 2 + 1, 1, col); }
  }
  // the big wheel at the back: twelve cabins, people in some of them, bulbs running down the spokes
  var WX = 238, WY = 66, WR = 50;
  function cabinPos(s, rot) { var a = rot + s / 12 * Math.PI * 2; return [WX + Math.cos(a) * WR, WY + Math.sin(a) * WR]; }
  function wheelRot(T) { return T * 0.16; }
  function drawWheel(R) {
    var rot = wheelRot(R.T), steel = "#4A4670", t = (R.T * 10) | 0;
    // the legs
    for (var i = 0; i < 64; i++) { R.rect(WX - 3 - Math.round(i * 0.5), WY + i, 2, 1, steel); R.rect(WX + 2 + Math.round(i * 0.5), WY + i, 2, 1, steel); }
    R.rect(WX - 36, 126, 72, 4, "#6A5A70"); R.rect(WX - 36, 126, 72, 1, "#8A7A90");
    for (var a = 0; a < 200; a++) { var th = a / 200 * Math.PI * 2; R.rect(Math.round(WX + Math.cos(th) * WR), Math.round(WY + Math.sin(th) * WR), 1, 1, ((a + t) % 8) < 2 ? "#FFFFFF" : "#FFD24A"); R.rect(Math.round(WX + Math.cos(th) * (WR - 3)), Math.round(WY + Math.sin(th) * (WR - 3)), 1, 1, steel); }
    for (var s = 0; s < 12; s++) {
      var ang = rot + s / 12 * Math.PI * 2;
      for (var k = 3; k < WR; k += 2) R.rect(Math.round(WX + Math.cos(ang) * k), Math.round(WY + Math.sin(ang) * k), 1, 1, ((k + s * 3 + t) % 7) < 2 ? "#FFF4C0" : COLS[s % 6]);
    }
    for (var s2 = 0; s2 < 12; s2++) {
      var p = cabinPos(s2, rot), x = Math.round(p[0]), y = Math.round(p[1]), gc = COLS[s2 % 6];
      R.rect(x, y, 1, 3, steel);
      R.rect(x - 5, y + 3, 11, 8, gc); R.rect(x - 5, y + 3, 11, 1, lt(gc, 0.4)); R.rect(x - 4, y + 5, 9, 3, "#2A2040"); R.rect(x - 6, y + 2, 13, 1, dk(gc, 0.2));
      if (ST.ride && ST.ride.k === "wheel" && s2 === 0) { var me = R.me; R.img(upperOf(me.sp), x - 11, y - 8); R.wear({ x: x, y: y + 22, sp: me.sp, dir: 0, sit: false, moving: false }); R.rect(x - 5, y + 8, 11, 3, gc); R.rect(x - 5, y + 8, 11, 1, lt(gc, 0.3)); ST.rideXY = [x, y + 2]; }
      else if (s2 % 3 === 1) { R.rect(x - 3, y + 4, 2, 2, "#E5B088"); R.rect(x + 1, y + 4, 2, 2, "#AD754D"); R.rect(x - 3, y + 3, 2, 1, "#2B1F26"); }
    }
    R.rect(WX - 3, WY - 3, 7, 7, "#FFE07A"); R.rect(WX - 1, WY - 1, 3, 3, "#FFFFFF");
  }
  function upperOf(sp) { // head and shoulders, for someone sitting in a cabin
    if (!sp.upper) { var c = A.cv(22, 17); c.getContext("2d").drawImage(sp.f[0][0], 0, 0, 22, 17, 0, 0, 22, 17); sp.upper = c; }
    return sp.upper;
  }
  // the boat swings: two boats on long arms, swinging against each other, kids shrieking
  var SWX = 150, SWY = 178;
  function drawSwings(R) {
    R.rect(SWX - 36, SWY - 34, 72, 3, "#C8443A"); R.rect(SWX - 36, SWY - 34, 72, 1, "#E8706A");
    [[-34, 1], [32, -1]].forEach(function (l) { for (var i = 0; i < 40; i++) R.rect(SWX + l[0] + Math.round(i * 0.12 * l[1]), SWY - 32 + i, 2, 1, "#8A2A34"); });
    [[-12, 0, "#2F6A8A", "k1"], [12, Math.PI, "#B8343A", "k4"]].forEach(function (b, bi) {
      var ang = Math.cos(R.T * 1.9 + b[1]) * 0.75, px = SWX + b[0], py = SWY - 32, L = 30, bx = px + Math.sin(ang) * L, by = py + Math.cos(ang) * L;
      for (var k = 0; k <= 12; k++) { R.rect(Math.round(px - 5 + Math.sin(ang) * L * k / 12), Math.round(py + Math.cos(ang) * L * k / 12), 1, 1, "#E8E2D6"); R.rect(Math.round(px + 5 + Math.sin(ang) * L * k / 12), Math.round(py + Math.cos(ang) * L * k / 12), 1, 1, "#E8E2D6"); }
      var sp = R.spr(bi ? "r3" : "r1"); R.img(upperOf(sp), Math.round(bx) - 11, Math.round(by) - 17);
      R.rect(Math.round(bx) - 9, Math.round(by) - 4, 18, 6, b[2]); R.rect(Math.round(bx) - 10, Math.round(by) - 5, 20, 2, "#F2C14A"); R.rect(Math.round(bx) - 7, Math.round(by) + 2, 14, 2, b[2]);
      for (var d = -6; d < 7; d += 4) R.rect(Math.round(bx) + d, Math.round(by) - 2, 2, 2, "#FFFFFF");
    });
  }
  // the hammer tower's puck jumps now and then when Antar shows off
  function hammerPuck(R, x0, top) { var k = (R.T % 6.5), h = k < 0.6 ? Math.sin(k / 0.6 * Math.PI / 2) : k < 1.6 ? Math.max(0, 1 - (k - 0.6)) : 0; R.rect(x0 + 9, top + 60 - Math.round(h * 50), 6, 3, "#E8503F"); if (k > 0.55 && k < 0.9) { R.alpha(0.5); R.rect(x0 + 2, top - 3, 20, 14, "#FFF6C0"); R.alpha(1); } }

  /* ================= what you can do here ================= */
  function sfx(n, v) { var a = H.audio; if (a && a.fxv) a.fxv(n, v == null ? 1 : v); }
  function tickets(n) {
    S.tickets += n; PL.save();
    var more = !S.owned.hat && S.tickets >= HAT ? " · كفاية للطرطور! {روح|روحي} لكشك الهدايا" : "";
    PL.banner("🎟️ +" + ar(n) + " تذكرة", "معاك " + ar(S.tickets) + " تذكرة" + more, "deed");
    H.map.refresh();
  }
  function playGame(id, who, intro) {
    var C = H.map.cut, again = false;
    function go() {
      return H.games.play(id).then(function (res) { if (res.tickets) tickets(res.tickets); if (res.again) return go(); });
    }
    PL.scene([
      { who: who, name: NAMES[who], t: intro },
      { who: who, name: NAMES[who], t: "{تلعب|تلعبي}؟", opts: ["يلا!", "مش دلوقتي"], pick: function (i) { again = i === 0; } }
    ]).then(function () { if (again) go(); });
  }
  var GAMEMAP = {
    duck: ["duck", "omshaimaa", "يا {حبيبي|حبيبتي} {تعالى|تعالي}! البطة اللي {تصطادها|تصطاديها} بنمرتها. والبطة الدهبي… دي بخمسين!"],
    shoot: ["shoot", "hanafy", "النيشان ده بيعرف الرجالة من العيال. عشر رصاصات… والبالونة الدهبي بتلاتين."],
    rings: ["rings", "risha", "حلقة في رقبة إزازة… وعشرين نقطة في جيبك! أنا بقالي سنة بحاول، والإزاز بيضحك عليا."],
    hammer: ["hammer", "antar", "ده جرس عنتر! محدش رنّه النهارده غيري. {ورّيني|ورّيني} {دراعك|دراعك}."],
    swings: ["swing", "sika", "المرجيحة دي طلعت لحد السما السنة اللي فاتت! {زقّ|زقّي} صح وهتطير."]
  };
  WD.ACTS = WD.ACTS || {};
  Object.keys(GAMEMAP).forEach(function (k) { var g = GAMEMAP[k]; WD.ACTS["fair_" + k] = function () { playGame(g[0], g[1], g[2]); return true; }; });
  function keeper(id) { return function () { var g = GAMEMAP[Object.keys(GAMEMAP).filter(function (k) { return GAMEMAP[k][1] === id; })[0]]; playGame(g[0], g[1], g[2]); }; }

  // the prize stall: tickets for the hat, or a balloon
  function prizes() {
    var C = H.map.cut, pick = null, items = [];
    if (!S.owned.hat) items.push(["hat", "الطرطور · " + ar(HAT) + " تذكرة", HAT]);
    if (!S.owned.balloon) items.push(["balloon", "بالونة · " + ar(BALLOON) + " تذكرة", BALLOON]);
    var opts = items.map(function (x) { return x[1]; }).concat(["بتفرّج بس"]);
    var hello = S.owned.hat ? "الطرطور لايق عليك! كأنك اتولدت بيه." : "الطرطور ده أشهر حاجة في الملاهي. اللي يلبسه، الحارة كلها تعرف إنه كسب.";
    PL.scene([
      { who: "sawsan", name: NAMES.sawsan, t: "معاك " + ar(S.tickets) + " تذكرة. " + hello },
      items.length ? { who: "sawsan", name: NAMES.sawsan, t: "{عايز|عايزة} إيه؟", opts: opts, pick: function (i) { pick = items[i] || null; } } : null,
      function () {
        if (!pick) return null;
        if (S.tickets < pick[2]) return C.say({ who: "sawsan", name: NAMES.sawsan, t: "ناقصك " + ar(pick[2] - S.tickets) + " تذكرة. {العب|العبي} نيشان ولا صيد بط و{تعالى|تعالي}، أنا مستنياك." });
        S.tickets -= pick[2]; S.owned[pick[0]] = true; PL.save();
        sfx("ding", 1); C.burst("confetti", "me", 16); C.emote("me", "♥");
        return C.cam({ on: "me", zoom: 1.9, ms: 600 }).then(function () {
          return C.say({ who: "sawsan", name: NAMES.sawsan, t: pick[0] === "hat" ? "{وطّي|وطّي} راسك… كده! {بقيت|بقيتي} ملك الملاهي." : "{امسك|امسكي} الخيط كويس، البالونة دي عايزة تطير." });
        }).then(function () {
          PL.banner(pick[0] === "hat" ? "✦ طرطور الملاهي" : "✦ بالونة الملاهي", pick[0] === "hat" ? "هتلبسه في الحارة كلها، لحد العيد" : "مربوطة في إيدك، في الحارة كلها", "deed");
          H.map.refresh();
        });
      }
    ]);
  }
  WD.ACTS.fair_prizes = function () { prizes(); return true; };

  // the rides
  function ridePt() { return ST.rideXY; }
  function rideCarousel() {
    var C = H.map.cut, me = H.map.me();
    PL.scene([
      { who: "burai", name: NAMES.burai, t: "{اركب|اركبي} الحصان الأبيض! ده أسرع واحد في الحصنة… بيقولوا." },
      function () { return C.fade(1, 300); },
      function () { ST.rideXY = [CX, CY - 20]; ST.ride = { k: "carousel" }; me.hidden = true; C.cam({ on: ridePt, zoom: 1.6, ms: 0, track: true }); sfx("whistle", 0.6); return C.fade(0, 400); },
      function () { return C.wait(4500); },
      function () { C.says("burai", "«لفة كمان؟ ماشي… عشان خاطرك!»", 2400); return C.wait(4500); },
      function () { return C.fade(1, 300); },
      function () { ST.ride = null; me.hidden = false; C.place("me", 124, 148, 2); C.cam({ on: "me", zoom: 1, ms: 0 }); return C.fade(0, 400); },
      { who: "me", t: "الدنيا لسه بتلف…" }
    ]);
  }
  function rideWheel() {
    var C = H.map.cut, me = H.map.me();
    PL.scene([
      { who: "kamal", name: NAMES.kamal, t: "العجلة دي لما {توصل|توصلي} لفوق، {هتشوف|هتشوفي} الحارة كلها. {اقعد|اقعدي} و{امسك|امسكي} في الحديدة." },
      function () { return C.fade(1, 300); },
      function () { ST.ride = { k: "wheel" }; ST.rideXY = cabinPos(0, wheelRot(0)); me.hidden = true; C.cam({ on: ridePt, zoom: 1.5, ms: 0, track: true }); return C.fade(0, 400); },
      function () { return C.wait(5200); },
      function () { return C.fade(1, 700); },
      function () { return C.go("hara", [379, 222, 1], { keepDark: true }); },
      function () { H.map.me().hidden = true; C.time("night", true); C.cam({ on: [300, 460], zoom: 0.5, ms: 0 }); return C.fade(0, 1100); },
      function () { C.cam({ on: [280, 380], zoom: 0.55, ms: 6500 }); return C.wait(1200); },
      "من فوق العجلة، الحارة كلها باينة: الجامع والمادنة منوّرين، والفرن، والقهوة تحت الجميزة، وبيتنا… والفوانيس متعلقة بين البيوت زي عقد نور.",
      function () { return C.wait(1800); },
      function () { return C.fade(1, 700); },
      function () { return C.go("fair", [214, 140, 1], { keepDark: true }); },
      function () { var m = H.map.me(); m.hidden = true; ST.ride = { k: "wheel" }; C.cam({ on: ridePt, zoom: 1.4, ms: 0, track: true }); return C.fade(0, 600); },
      function () { return C.wait(3200); },
      function () { return C.fade(1, 300); },
      function () { var m = H.map.me(); ST.ride = null; m.hidden = false; C.place("me", 212, 142, 0); C.cam({ on: "me", zoom: 1, ms: 0 }); return C.fade(0, 400); },
      { who: "me", t: "{شفت|شفتي} بيتنا من فوق! كان صغير قوي… بس منوّر." }
    ]);
  }
  WD.ACTS.fair_carousel = function () { rideCarousel(); return true; };
  WD.ACTS.fair_wheel = function () { rideWheel(); return true; };
  WD.LOOK.fair_popcorn = [{ t: "فشار سخن بالسكر والملح. الريحة واصلة لحد البوابة." }];
  WD.LOOK.fair_corn = [{ t: "درة مشوي على الفحم. الحبة بتطقطق وهي بتتشوي." }];

  /* ================= the room ================= */
  function makeFair() {
    var s = K.shell(FW, FH, TOP, {
      floor: function (P, R) {
        P.r(0, TOP, FW, FH - TOP, "#8A7058"); P.dots(0, TOP, FW, FH - TOP, ["#7A6048", "#9A8068", "#A88A68"], 1600, R);
        P.dots(0, TOP, FW, FH - TOP, COLS, 260, R); // confetti trodden into the dust
        for (var i = 0; i < 18; i++) P.el((R() * FW) | 0, TOP + 20 + ((R() * (FH - TOP - 30)) | 0), 16 + ((R() * 20) | 0), 5, "rgba(230,200,150,0.12)"); // sawdust
        P.el(110, 214, 80, 40, "rgba(240,210,160,0.12)");
      },
      wall: function (P) { P.g.clearRect(0, 0, FW, TOP); },
      noDoor: true, cap: "#2A1C30", seed: 15
    });
    s.P.g.clearRect(0, 0, FW, 5); s.P.g.clearRect(0, 0, 5, TOP); s.P.g.clearRect(FW - 5, 0, 5, TOP);
    s.P.r(0, FH - 6, FW, 6, "#2A1C30");
    var sky = A.cv(FW, TOP), SP = A.Pt(sky), R0 = rng(7);
    // far roofs of the hara behind the fair, the minaret, and the fair's own fence of painted boards
    [[0, 30, 40], [40, 22, 34], [74, 36, 30], [104, 26, 40], [190, 30, 30], [270, 24, 30]].forEach(function (h, i) { SP.r(h[0], TOP - h[1], h[2], h[1], ["#2A2A5A", "#262450", "#2E2C5E"][i % 3]); for (var w = 0; w < 4; w++) if (R0() < 0.6) SP.r(h[0] + 4 + ((R0() * (h[2] - 8)) | 0), TOP - h[1] + 4 + ((R0() * (h[1] - 10)) | 0), 2, 3, "#FFD98A"); });
    SP.r(150, 4, 8, TOP - 4, "#2E2C5E"); SP.r(147, 20, 14, 3, "#3A3868"); SP.el(150, 0, 8, 8, "#2E2C5E");
    for (var b = 0; b < FW; b += 10) { SP.r(b, TOP - 12, 9, 12, COLS[(b / 10) % 6]); SP.r(b, TOP - 12, 9, 1, "#FFFFFF"); SP.r(b + 9, TOP - 12, 1, 12, "#1A1030"); }
    var people = [], lights = [];
    var room = {
      id: "fair", name: "ملاهي ليالي رمضان", sub: "مراجيح وعجلة ونيشان… والجوايز!", W: FW, HGT: FH, ground: s.c, bed: "fairIn", wall: TOP, roof: true,
      props: [
        { k: "blank", o: { w: 100, h: 70 }, x: CX - 50, y: CY + 18, block: [100, 34], look: "fair_carousel" },
        { k: "blank", o: { w: 72, h: 96 }, x: WX - 36, y: 130, block: [72, 10], look: "fair_wheel" },
        { k: "blank", o: { w: 76, h: 44 }, x: SWX - 38, y: SWY + 6, block: [76, 10], look: "fair_swings" },
        { k: "prizeStall", x: 130, y: 120, block: [56, 6], look: "fair_prizes", sign: { dx: 28, dy: -44, t: "الجوايز", h: 5, fg: "#FFE07A" } },
        { k: "shootStall", x: 8, y: 178, block: [58, 6], look: "fair_shoot", sign: { dx: 29, dy: -46, t: "النيشان", h: 5, fg: "#FFE07A" } },
        { k: "ringStall", x: 234, y: 180, block: [58, 6], look: "fair_rings", sign: { dx: 29, dy: -44, t: "رمي الحلقات", h: 4.5, fg: "#FFE07A" } },
        { k: "duckStall", x: 10, y: 240, block: [58, 6], look: "fair_duck", anim: duckSwim, sign: { dx: 29, dy: -38, t: "صيد البط", h: 4.5, fg: "#FFE07A" } },
        { k: "hammerTower", x: 268, y: 240, block: [22, 5], look: "fair_hammer", anim: hammerPuck },
        { k: "popcornCart", x: 196, y: 248, block: [30, 5], look: "fair_popcorn", steam: [15, -32] },
        { k: "cornGrill", x: 92, y: 206, block: [26, 4], look: "fair_corn", smoke: [13, -14] },
        { k: "candyPole", x: 118, y: 250, block: [6, 3] }
      ],
      fixtures: [
        { layer: "under", draw: function (R) {
          for (var y = 0; y < TOP; y += 3) R.rect(0, y, FW, 3, A.mix("#0C0E34", "#3A2A6A", y / TOP));
          for (var i = 0; i < 40; i++) { var tw = Math.sin(R.T * 2 + i * 1.3); if (tw > 0.1) R.rect((i * 73 + 11) % FW, (i * 29 + 3) % 44, 1, 1, tw > 0.8 ? "#FFFFFF" : "#C9CDF0"); }
          R.rect(40, 10, 9, 9, "#FFF4D0"); R.rect(43, 10, 6, 7, "#151A48"); // the moon
          R.img(sky, 0, 0);
          // searchlights sweeping the sky from behind the wheel
          R.alpha(0.12); for (var k = 0; k < 2; k++) { var a = Math.sin(R.T * 0.5 + k * 2) * 0.6; for (var j = 0; j < 60; j++) R.rect(Math.round(WX + Math.sin(a) * j * 1.2) - 2, Math.round(60 - j), 4 + (j >> 3), 1, "#FFF4C0"); } R.alpha(1);
        } },
        { layer: "sort", y: 130, draw: drawWheel },
        { layer: "sort", y: CY + 18, draw: drawCarousel },
        { layer: "sort", y: SWY + 8, draw: drawSwings }
      ],
      over: function (R) { // fireworks over the fair now and then
        var k = R.T % 9;
        if (k < 1.4) { var fx = 60 + ((R.T / 9 | 0) * 97) % 180, fy = 26, r = k * 22; R.alpha(Math.max(0, 1 - k / 1.4)); for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2; R.rect(Math.round(fx + Math.cos(a) * r), Math.round(fy + Math.sin(a) * r * 0.8 + k * k * 3), 2, 1, COLS[i % 6]); } R.alpha(1); }
      },
      strings: [
        { k: "bulbs", x0: 6, y0: 20, x1: FW - 6, y1: 22, sag: 16 },
        { k: "flags", x0: 6, y0: 84, x1: 150, y1: 96, sag: 10 },
        { k: "flags", x0: 150, y0: 96, x1: FW - 6, y1: 84, sag: 10 },
        { k: "bulbs", x0: 6, y0: 130, x1: 150, y1: 108, sag: 14 },
        { k: "bulbs", x0: 150, y0: 108, x1: FW - 6, y1: 132, sag: 14 },
        { k: "lanterns", x0: 6, y0: 150, x1: FW - 6, y1: 150, sag: 22 },
        { k: "bulbs", x0: 70, y0: 196, x1: 230, y1: 196, sag: 18 }
      ],
      walk: [[8, 124, FW - 16, 128]],
      lights: [
        { x: CX, y: CY - 20, r: 70, c: [255, 210, 140], when: "always", g: 0.7, fl: 2 },
        { x: WX, y: WY, r: 90, c: [255, 120, 180], when: "always", g: 0.6, dyn: function (T) { return [0.8 + 0.2 * Math.sin(T * 2), [[255, 90, 160], [90, 180, 255], [255, 220, 90], [120, 255, 170]][((T * 0.8) | 0) % 4]]; } },
        { x: 158, y: 96, r: 40, c: [255, 220, 160], when: "always", g: 0.7 },
        { x: 36, y: 150, r: 40, c: [255, 200, 140], when: "always", g: 0.7 },
        { x: 262, y: 152, r: 40, c: [255, 200, 140], when: "always", g: 0.7 },
        { x: 38, y: 214, r: 38, c: [120, 200, 255], when: "always", g: 0.6 },
        { x: 278, y: 190, r: 34, c: [255, 160, 120], when: "always", g: 0.7, dyn: function (T) { var k = T % 6.5; return [k > 0.55 && k < 1 ? 1.6 : 0.8, null]; } },
        { x: 210, y: 226, r: 30, c: [255, 230, 180], when: "always", g: 0.6 },
        { x: 104, y: 196, r: 24, c: [255, 140, 60], when: "always", g: 0.6, fl: 1 },
        { x: SWX, y: SWY - 16, r: 56, c: [200, 120, 255], when: "always", g: 0.5, dyn: function (T) { return [0.7 + 0.3 * Math.sin(T * 3), [[200, 120, 255], [255, 120, 160]][((T * 0.5) | 0) % 2]]; } },
        { x: 150, y: 250, r: 50, c: [255, 200, 150], when: "always", g: 0.3 }
      ],
      wins: [],
      exits: [{ r: [136, 246, 28, 10], to: "hara", spot: "fair" }],
      spawn: { hara: [150, 244, 1] },
      tick: function (R, dt, api) {
        ST.calls -= dt;
        if (ST.calls <= 0 && !api.busy()) { // the stall keepers call out to the crowd
          ST.calls = rnd(5, 9);
          var calls = [["antar", "«مين يقدر يرن الجرس؟! مين؟!»"], ["hanafy", "«النيشان يا رجالة! عشر رصاصات بس!»"], ["sawsan", "«الطرطور بستين تذكرة بس! طرطور الأبطال!»"], ["omshaimaa", "«بطة دهبي في المية يا ولاد! مين يصطادها؟»"], ["sika", "«المرجيحة طايرة! مين يطير معانا؟»"], ["kamal", "«العجلة! الحارة كلها من فوق!»"]];
          var c = calls[(Math.random() * calls.length) | 0], a = api.by(c[0]);
          if (a && api.dist(a.x, a.y) < 150) api.say(a, c[1], 2.6);
        }
      },
      people: function (time) {
        ST.ride = null;
        return [
          { id: "burai", cast: "burai", name: NAMES.burai, at: [128, 138, 2], talkFn: rideCarousel },
          { id: "kamal", cast: "kamal", name: NAMES.kamal, at: [196, 134, 0], talkFn: rideWheel },
          { id: "sawsan", cast: "sawsan", name: NAMES.sawsan, at: [192, 126, 2], talkFn: prizes },
          { id: "hanafy", cast: "hanafy", name: NAMES.hanafy, at: [70, 184, 2], talkFn: keeper("hanafy") },
          { id: "risha", cast: "risha", name: NAMES.risha, at: [226, 186, 3], talkFn: keeper("risha") },
          { id: "omshaimaa", cast: "omshaimaa", name: NAMES.omshaimaa, at: [72, 244, 2], talkFn: keeper("omshaimaa") },
          { id: "antar", cast: "antar", name: NAMES.antar, at: [258, 246, 3], talkFn: keeper("antar") },
          { id: "sika", cast: "sika", name: NAMES.sika, at: [196, 190, 2], talkFn: keeper("sika") },
          { cast: "ghazl", name: "عم سعيد بتاع غزل البنات", at: [130, 250, 2], say: ["«غزل البنات بلون الملاهي!»", "«العيال بياكلوه، والكبار بيقولوا \"ده للعيال\"… وبعدين بياكلوه.»"] },
          { cast: "w4", name: "أم هاني", at: [210, 254, 1], say: ["«الفشار ده بيفكرني بالسيما زمان.»"] },
          // visitors from all over: families walking, kids pulling them to the next ride
          { cast: "v1", name: "أبو مازن", at: [100, 230, 3], loop: [[100, 230, 3], [180, 228, 2], [150, 176, 1], [100, 230, 3]], speed: 0.4, say: ["«الولاد قالولي ملاهي يا بابا… وأنا اللي ركبت المرجيحة مرتين.»"] },
          { cast: "k9", name: "مازن", at: [110, 232, 3], loop: [[110, 232, 3], [190, 230, 2], [160, 178, 1], [110, 232, 3]], speed: 0.45, say: ["«بابا! العجلة! العجلة!»"] },
          { cast: "v2", name: "أم مازن", at: [96, 236, 3], loop: [[96, 236, 3], [176, 234, 2], [146, 180, 1], [96, 236, 3]], speed: 0.38, say: ["«{خد|خدي} بالك من الزحمة يا {حبيبي|حبيبتي}.»"] },
          { cast: "v3", name: "الست زينب", at: [250, 214, 2], say: ["«أنا جاية من الحارة اللي جنبكم. الملاهي دي اتكلم عنها الكل!»"] },
          { cast: "v4", name: "شريف", at: [44, 200, 1], say: ["«أنا كسبت تلات بالونات! {خد|خدي} واحدة.»"] },
          { cast: "k10", name: "ليلى", at: [56, 252, 1], say: ["«البطة الدهبي هربت مني تاني!»"] },
          { cast: "k7", name: "مريم", at: [30, 252, 1], say: ["«ماما قالتلي لفة واحدة… أنا عملت أربعة.»"] },
          { cast: "k8", name: "آدم", at: [282, 224, 1], say: ["«عنتر ده أقوى من الجرس نفسه!»"] }
        ];
      }
    };
    return room;
  }
  H.rooms.add("fair", makeFair, null);

  // the errands list: your tickets, and what they buy
  PL.quests.push(function (day, time) {
    if (day < PL.OPEN.fair || !(time === "maghrib" || time === "night")) return null;
    if (S.owned.hat) return { icon: "🎟️", t: "معاك " + ar(S.tickets) + " تذكرة · لابس طرطور الملاهي", done: true };
    return { icon: "🎟️", t: "معاك " + ar(S.tickets) + " تذكرة. الطرطور بـ" + ar(HAT) + " تذكرة في كشك الجوايز بالملاهي", go: "fair" };
  });
})();
