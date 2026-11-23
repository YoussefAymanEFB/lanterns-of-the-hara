/* فوانيس الحارة · سهرة السحور: the suhoor nights (walk.html).
   On a suhoor night (time "suhoor", 2–3 AM) Sayed's ful corner becomes خيمة عم سيد: a big khayamiya tent with
   bulbs running to the rooftops, loudspeakers at the door, music and confetti spilling out, Hamo at the door,
   kids with sparklers, the bread boy running hot bread from the oven. Inside: a stage with a band (tabla, riq,
   mizmar) and a tanoura dancer whose skirt spins, lifts over his head and lights up when the lights go down;
   the ful cart serving; a drinks bar; a puppet booth where the aragoz beats the policeman; families on floor
   cushions eating suhoor. Out in the hara the musaharati walks with his drum and calls people by name.
   Everything here only exists at suhoor (times / when: ["suhoor"]). js/map.js runs it. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world;
  if (!A || !WD || !H.rooms) return;
  var PROPS = A.PROPS, sprite = A.sprite, Pt = A.Pt, rng = A.rng, dk = A.dk, lt = A.lt, SK = A.SKIN;
  var WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS;
  var SUHOOR = ["suhoor"];
  var RED = "#C8343A", NAVY = "#2A3F7A", GOLD = "#F2C14A", GREEN = "#2F8A5A", CREAM = "#F2E6C8";
  var SKIRT = ["#E8503F", "#F2C14A", "#3FA86A", "#3E78C2", "#F08A2A", "#B86BE0"];
  var NEON = ["#FF3AA0", "#3AE8FF", "#FFE83A", "#7AFF5A", "#B85AFF", "#FF8A3A"];
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ================= the people of the suhoor nights ================= */
  var CAST = {
    mesa: { build: "thin", skin: SK.tan, head: { kind: "turban" }, top: { kind: "robe", c: "#3F5A8A" }, mus: "#E8E2D6", beard: "#E8E2D6", shoes: "#4A3328", drum: true },
    omhamo: { build: "fat", skin: SK.deep, head: { kind: "hijab", c: "#6A4A8A" }, top: { kind: "robe", c: "#2F6A5A" }, apron: "#F1EDE4", shoes: "#3A2A26" },
    tanoura: { build: "thin", skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, head: { kind: "cap", c: "#8A2A34" }, top: { kind: "robe", c: "#F4EFE6" }, mus: "#2B1F26" },
    tablaP: { build: "fat", skin: SK.deep, hair: { style: "short", c: "#1F1619" }, head: { kind: "taqiyah", c: "#F4F1E8" }, top: { kind: "robe", c: "#E8E2D6" }, mus: "#1F1619" },
    riqP: { skin: SK.mid, hair: { style: "curly", c: "#2B1F26" }, top: { kind: "robe", c: "#5E7A9A" }, mus: "#2B1F26" },
    zamarP: { build: "thin", skin: SK.tan, hair: { style: "grey", c: "#9A948E" }, head: { kind: "turban" }, top: { kind: "robe", c: "#8A5A3A" }, beard: "#D8D2C8" },
    ghazl: { skin: SK.tan, hair: { style: "short", c: "#2B1F26" }, head: { kind: "cap", c: "#F48AB8" }, top: { kind: "shirt", c: "#F4EFE6" }, legs: "#3A3550", mus: "#2B1F26", shoes: "#2A2224" },
    breadboy: { kid: true, skin: SK.mid, hair: { style: "short", c: "#2B1F26" }, head: { kind: "cap", c: "#F4F1E8" }, top: { kind: "tee", c: "#F1EDE4" }, legs: "#5A5A6A", shoes: "#2A2224" },
    bilya: { kid: true, skin: SK.deep, hair: { style: "curly", c: "#1F1619" }, top: { kind: "tee", c: "#3E78C2" }, legs: "#2A2234", shoes: "#F2F0EA" },
    k7: { kid: true, skin: SK.tan, hair: { style: "braids", c: "#3A2418" }, top: { kind: "dress", c: "#4F97E8" }, shoes: "#F2F0EA" },
    k8: { kid: true, skin: SK.fair, hair: { style: "short", c: "#5A3A28" }, top: { kind: "tee", c: "#E8503F" }, legs: "#2F4A7A", shoes: "#F2F0EA" }
  };
  Object.keys(CAST).forEach(function (k) { if (!WD.CAST[k]) WD.CAST[k] = CAST[k]; });

  /* ================= the tent, from outside ================= */
  // 86 x 96. The front wall is khayamiya panels, the roof is striped canvas seen from above, a scalloped valance
  // between them. The doorway is left open: js/map.js paints the inside through it (under), then the bulbs (anim).
  function panelArt(P, x, y, w, h, ground, R) {
    P.r(x, y, w, h, ground);
    P.r(x, y, w, 1, GOLD); P.r(x, y + h - 1, w, 1, GOLD); P.r(x, y, 1, h, GOLD); P.r(x + w - 1, y, 1, h, GOLD);
    var cx = x + (w >> 1), cy = y + (h >> 1), other = ground === RED ? NAVY : RED;
    // an eight-point star medallion, then corner triangles
    for (var r = -5; r <= 5; r++) { var hw = 5 - Math.abs(r); P.r(cx - hw, cy + r, hw * 2 + 1, 1, GOLD); }
    for (var r2 = -3; r2 <= 3; r2++) { var hw2 = 3 - Math.abs(r2); P.r(cx - hw2, cy + r2, hw2 * 2 + 1, 1, other); }
    P.r(cx - 4, cy - 4, 9, 1, GREEN); P.r(cx - 4, cy + 4, 9, 1, GREEN); P.p(cx, cy, CREAM);
    [[x + 2, y + 2, 1], [x + w - 3, y + 2, -1]].forEach(function (c) { for (var i = 0; i < 3; i++) P.r(c[2] > 0 ? c[0] : c[0] - (2 - i), c[1] + i, 3 - i, 1, CREAM); });
    [[x + 2, y + h - 3, 1], [x + w - 3, y + h - 3, -1]].forEach(function (c) { for (var i = 0; i < 3; i++) P.r(c[2] > 0 ? c[0] : c[0] - (2 - i), c[1] - i, 3 - i, 1, CREAM); });
    if (R) P.dots(x + 1, y + 1, w - 2, h - 2, [dk(ground, 0.12)], (w * h / 14) | 0, R);
  }
  PROPS.sahraTent = function () {
    var c = sprite(86, 96, function (P) {
      var R = rng(27), x, y, i;
      // the roof: canvas stripes fanning out from the ridge, lighter near the top
      for (y = 36; y <= 59; y++) {
        var t = (y - 36) / 23, xl = Math.round(7 - 6 * t), xr = Math.round(79 + 6 * t), sw = 5 + 2 * t;
        for (x = xl; x <= xr; x++) {
          var idx = Math.floor((x - 43) / sw + 100), col = idx % 2 ? RED : CREAM;
          P.p(x, y, t < 0.25 ? lt(col, 0.12) : t > 0.75 ? dk(col, 0.1) : col);
        }
      }
      P.r(7, 35, 73, 2, "#8C2E28"); P.r(9, 35, 69, 1, "#B5473B"); // the ridge
      // the valance: a gold band, then scalloped tabs in four colours with tassels
      P.r(1, 58, 84, 3, GOLD); P.r(1, 58, 84, 1, lt(GOLD, 0.4));
      var tabs = [RED, NAVY, GREEN, GOLD];
      for (x = 1, i = 0; x < 85; x += 6, i++) { P.el(x, 57, 6, 10, tabs[i % 4]); P.p(x + 2, 62, lt(tabs[i % 4], 0.4)); P.p(x + 3, 67, GOLD); }
      // the front wall: five khayamiya panels between the poles
      for (i = 0; i < 5; i++) panelArt(P, 3 + i * 16, 64, 16, 29, i % 2 ? NAVY : RED, R);
      P.r(3, 63, 80, 2, CREAM); for (x = 4; x < 82; x += 3) P.p(x, 63, i % 2 ? RED : GREEN), i++;
      // the doorway, its curtains pulled back and tied with gold rope
      P.el(33, 65, 21, 12, "#E0884A"); P.r(33, 71, 21, 22, "#E0884A");
      P.r(31, 64, 4, 29, RED); P.r(34, 64, 1, 29, GOLD); P.r(52, 64, 4, 29, RED); P.r(52, 64, 1, 29, GOLD);
      P.r(30, 79, 6, 1, GOLD); P.p(30, 80, GOLD); P.r(51, 79, 6, 1, GOLD); P.p(56, 80, GOLD);
      P.el(32, 62, 23, 6, GOLD); P.el(33, 62, 21, 4, RED); P.p(43, 63, GOLD); // the arch over it
      // the corner poles, a brass knob and a pennant on each
      [[0, 1], [83, -1]].forEach(function (p) {
        P.r(p[0], 30, 3, 63, WOOD[2]); P.r(p[0] + (p[1] > 0 ? 0 : 2), 30, 1, 63, WOOD[1]);
        P.el(p[0], 27, 3, 3, BRASS[1]);
        for (var r = 0; r < 5; r++) P.r(p[1] > 0 ? p[0] + 3 : p[0] - (5 - r), 22 + r, 5 - r, 1, r % 2 ? GOLD : "#E8503F");
        P.r(p[0] + 1, 20, 1, 8, WOOD[3]);
      });
      // two loudspeakers either side of the door (every Egyptian party has them)
      [21, 57].forEach(function (sx) {
        P.r(sx, 74, 8, 19, "#2A2630"); P.r(sx, 74, 8, 1, "#4A4650"); P.r(sx + 7, 75, 1, 18, "#1A1620");
        P.el(sx + 1, 76, 6, 6, "#5A5560"); P.el(sx + 2, 77, 4, 4, "#3A3640"); P.p(sx + 3, 78, "#8A8590");
        P.el(sx + 1, 84, 6, 7, "#5A5560"); P.el(sx + 2, 85, 4, 5, "#3A3640"); P.p(sx + 3, 87, "#8A8590");
      });
      // two lanterns hang from the valance
      A.fanousBig(P, 9, 66, GLASS[0]); A.fanousBig(P, 70, 66, GLASS[2]);
      P.r(12, 64, 1, 2, BRASS[2]); P.r(73, 64, 1, 2, BRASS[2]);
      // the sign over the door, framed in gold (the words are drawn by js/map.js)
      P.r(21, 41, 45, 13, GOLD); P.r(22, 42, 43, 11, "#1F4A3A"); P.r(22, 42, 43, 1, "#2F6A52");
      P.r(25, 53, 1, 4, WOOD[3]); P.r(61, 53, 1, 4, WOOD[3]);
      // the centre pole and its big lantern with a crescent on top
      P.r(42, 10, 2, 27, WOOD[2]); P.r(42, 10, 1, 27, WOOD[1]);
      P.map(39, 0, ["..yy....", ".y......", "y.......", "y.......", ".y......", "..yy...."], { y: GOLD });
      P.r(43, 4, 1, 2, BRASS[2]);
      P.el(38, 5, 11, 5, BRASS[0]); P.el(39, 5, 7, 3, BRASS[1]);
      P.r(37, 9, 13, 2, BRASS[2]);
      for (i = 0; i < 4; i++) { var gc = [GLASS[3], GLASS[0], GLASS[1], GLASS[4]][i]; P.r(38 + i * 3, 11, 3, 8, gc); P.r(38 + i * 3, 11, 1, 8, lt(gc, 0.45)); P.p(39 + i * 3, 14, lt(gc, 0.75)); }
      P.r(37, 11, 1, 8, BRASS[2]); P.r(49, 11, 1, 8, BRASS[2]); for (i = 40; i < 49; i += 3) P.r(i, 11, 1, 8, BRASS[0]);
      P.r(37, 19, 13, 2, BRASS[2]); P.r(39, 21, 9, 2, BRASS[0]); P.r(42, 23, 3, 2, BRASS[2]);
      // pennant ropes from the lantern pole down to the corner poles
      [[3, 24], [83, 24]].forEach(function (e) {
        for (var k = 0; k <= 20; k++) {
          var tt = k / 20, px = Math.round(43 + (e[0] - 43) * tt), py = Math.round(25 + (e[1] - 25) * tt + 5 * Math.sin(tt * Math.PI));
          P.p(px, py, "#5A4030");
          if (k % 3 === 1 && k < 20) { var fc = ["#E8503F", GOLD, "#4CBF73", "#4F97E8", "#F4EFE4"][k % 5]; P.r(px - 1, py + 1, 3, 1, fc); P.p(px, py + 2, fc); }
        }
      });
      // a red carpet out of the door
      P.r(36, 90, 15, 6, "#B8343A"); P.r(36, 90, 15, 1, "#D8545A"); P.r(36, 90, 1, 6, GOLD); P.r(50, 90, 1, 6, GOLD);
    }, [0, 87, 86, 9, 0.28]);
    // cut the doorway open, then sit a few people inside it, their backs to you
    var g = c.getContext("2d");
    g.clearRect(35, 70, 17, 20);
    var P2 = Pt(c);
    [[36, 85, "#3A1A24"], [41, 86, "#2E1620"], [47, 85, "#3A1A24"]].forEach(function (s) { P2.r(s[0], s[1], 4, 5, s[2]); P2.r(s[0] + 1, s[1] - 2, 2, 2, s[2]); });
    return c;
  };
  // what you see through the doorway: a warm glow, a coloured stage light, the dancer far inside spinning
  function tentDoor(R, x0, top) {
    var t = R.T, x = x0 + 35, y = top + 70, i;
    for (i = 0; i < 20; i++) R.rect(x, y + i, 17, 1, i < 6 ? "#7A3A3A" : i < 12 ? "#B85A3A" : "#E8904A");
    R.alpha(0.35); R.rect(x, y, 17, 20, ["#FF4A7A", "#4AA8FF", "#FFD24A", "#5AFF9A"][((t * 1.2) | 0) % 4]); R.alpha(1);
    var dx = x0 + 43, fy = top + 88, spin = t * 14, lift = ((t / 6) | 0) % 3 === 2;
    R.rect(dx - 1, fy - 16, 2, 3, "#8A2A34"); R.rect(dx - 1, fy - 13, 2, 2, "#C89070");
    R.rect(dx - 2, fy - 11, 4, 4, "#F4EFE6"); R.rect(dx - 3, fy - 13, 1, 3, "#C89070"); R.rect(dx + 2, fy - 13, 1, 3, "#C89070");
    for (var r = 0; r < 7; r++) {
      var hw = 2 + r;
      for (var cx = -hw; cx <= hw; cx++) R.rect(dx + cx, fy - 7 + r, 1, 1, SKIRT[(((cx + hw) >> 1) + (spin | 0)) % SKIRT.length]);
    }
    if (lift) for (var cx2 = -5; cx2 <= 5; cx2++) R.rect(dx + cx2, fy - 19, 1, 1, SKIRT[((cx2 + 5 + (spin | 0)) >> 1) % SKIRT.length]);
  }
  // the bulbs round the sign chase each other
  function tentBulbs(R, x0, top) {
    var t = (R.T * 9) | 0, n = 0, x, y;
    function bulb(px, py) { R.rect(px, py, 1, 1, (n++ + t) % 3 === 0 ? "#FFF6C0" : "#C8963E"); }
    for (x = x0 + 22; x < x0 + 66; x += 3) bulb(x, top + 40);
    for (y = top + 43; y < top + 54; y += 3) bulb(x0 + 66, y);
    for (x = x0 + 65; x > x0 + 21; x -= 3) bulb(x, top + 54);
    for (y = top + 52; y > top + 41; y -= 3) bulb(x0 + 20, y);
  }
  function cycle(cols, speed) { return function (T) { return [1, cols[((T * speed) | 0) % cols.length]]; }; }

  WD.PROPS.push({
    k: "sahraTent", x: 0, y: 532, block: [84, 48], times: SUHOOR, id: "tent",
    under: tentDoor, anim: tentBulbs,
    sign: { dx: 43, dy: -46, t: "خيمة عم سيد", h: 8, fg: "#FFE08A" },
    notes: [43, -64, 30], confetti: [43, -80],
    lights: [
      [43, -16, [255, 176, 110], 62, { fl: 1, g: 0.45 }],
      [43, -12, [255, 120, 160], 36, { g: 0.5, dyn: cycle([[255, 80, 130], [80, 160, 255], [255, 210, 80], [90, 255, 150]], 1.2) }],
      [43, -80, [255, 214, 120], 40, { g: 0.95 }],
      [12, -58, [232, 80, 63], 18], [73, -58, [79, 151, 232], 18],
      [43, -46, [255, 226, 150], 30, { g: 0.7, fl: 2 }]
    ]
  });
  // the cotton-candy pole: a stand, and pink bags tied all the way up
  PROPS.candyPole = function () {
    return sprite(16, 40, function (P) {
      P.r(7, 10, 1, 27, "#C9A46A"); P.r(8, 10, 1, 27, "#9C7A48");
      P.r(3, 36, 10, 2, WOOD[2]); P.r(6, 34, 4, 2, WOOD[3]);
      [[1, 2], [7, 0], [3, 7], [9, 6], [5, 12], [0, 13], [10, 12], [4, 18]].forEach(function (b, i) {
        P.el(b[0], b[1], 6, 7, i % 3 ? "#F7A8C8" : i % 2 ? "#F48AB8" : "#C8A8F0"); P.p(b[0] + 2, b[1] + 1, "#FFF0F6"); P.p(b[0] + 3, b[1] + 6, "#F2F0EA");
      });
    }, [3, 36, 10, 4, 0.25]);
  };
  WD.PROPS.push({ k: "candyPole", x: 118, y: 538, block: [6, 3], times: SUHOOR });
  // bulbs from the tent's lantern pole to the roofs around, and lanterns across the lane
  WD.STRINGS.push(
    { k: "bulbs", x0: 43, y0: 450, x1: 0, y1: 402, sag: 8, times: SUHOOR },
    { k: "bulbs", x0: 43, y0: 450, x1: 112, y1: 404, sag: 8, times: SUHOOR },
    { k: "bulbs", x0: 43, y0: 452, x1: 190, y1: 428, sag: 12, times: SUHOOR },
    { k: "lanterns", x0: 86, y0: 478, x1: 192, y1: 470, sag: 10, times: SUHOOR }
  );
  WD.SPOTS.tent = { name: "خيمة عم سيد", stand: [43, 540], mark: [43, 446], tap: [0, 444, 86, 90], times: SUHOOR };

  /* ================= the hara at suhoor ================= */
  WD.EXTRAS.push(
    { cast: "hamo", name: "حمو", at: [62, 537, 0], times: SUHOOR, say: [
      "«{اتفضل|اتفضلي}! الخيمة نوّرت! جوّه تنورة وأراجوز، وأبويا عامل فول يكفّي الحارة كلها.»",
      "«أبويا قال: اللي يدخل الخيمة ما يخرجش غير شبعان. وأنا مسؤول عن التنفيذ.»",
      "«أنا البوّاب النهارده. ما بدخّلش غير اللي بيضحك… خلاص {ادخل|ادخلي}، {ضحكت|ضحكتي}!»"] },
    { cast: "ghazl", name: "عم سعيد بتاع غزل البنات", at: [110, 534, 2], times: SUHOOR, say: [
      "«غزل البنات! بلون الفانوس وطعم العيد!»",
      "«العيال بياكلوه، والكبار بيقولوا \"ده للعيال\"… وبعدين بياكلوه.»"] },
    { cast: "k1", name: "زياد", at: [94, 524, 0], dance: true, times: SUHOOR, say: ["«الطبلة دي بتشد رجلي لوحدها!»"] },
    { cast: "k3", name: "عمر", at: [138, 545, 0], sparkle: true, times: SUHOOR, say: ["«ده شمروخ! بابا ولّعهولي، وقال ما أقربش من القماش.»"] },
    { cast: "w6", name: "أم سامح", at: [162, 530, 2], times: SUHOOR, say: ["«سلمى صحّتني الساعة اتنين: \"ماما الخيمة! الخيمة!\"… أهو صحينا.»"] },
    { cast: "k6", name: "سلمى", at: [152, 535, 2], times: SUHOOR, say: ["«أنا لابسة جزمة العيد! ماما قالت النهارده بس.»"] },
    { cast: "breadboy", name: "شادي صبي الفرن", at: [292, 522, 2], hold: "breadBoard", loop: [[70, 541, 2], [292, 522, 1]], pause: [1.5, 3], speed: 0.62, times: SUHOOR, say: [
      "«أول خبزة طالعة من الفرن رايحة على خيمة سيد على طول!»",
      "«عم حسن قال: العيش يوصل الخيمة سخن، وإلا ما {ترجعش|ترجعيش}… قصدي ما أرجعش.»"] },
    { cast: "m6", name: "عم رمضان", at: [172, 512, 2], times: SUHOOR, say: ["«قلت أتسحر وأنام… لقيت نفسي واقف قدام الخيمة.»", "«الساعة اتنين ونص والحارة صاحية كأنها الضهر.»"] }
  );
  // the musaharati's round: where he stops, and the name he calls up at the windows there
  WD.MESA = {
    cast: "mesa", name: "عم زينهم المسحراتي",
    say: [
      "«تلاتين سنة بلف الحارة دي بالطبلة. بعرف اسم كل عيل فيها… حتى {إنت|إنتي}!»",
      "«الطبلة دي ورثتها من أبويا. ولا ليلة نامت قبل الفجر.»",
      "«الناس فاكرة المسحراتي بيصحّي الناس. لأ… أنا بفكّرهم إنهم مش لوحدهم.»"],
    kids: [{ cast: "k2+l", name: "جنى", say: ["«إحنا ماشيين ورا عم زينهم لحد الفجر!»"] }, { cast: "k8+l", name: "آدم", say: ["«عم زينهم قال اسمي! {سمعته|سمعتيه}؟»"] }],
    route: [
      [128, 532, "«يا عم سيد! خلّيلي طبق فول… وخبّيه من حمو!»"],
      [270, 540, "«يا عم حسن! الفرن صاحي قبلي النهارده!»"],
      [250, 640, "«يا ولاد الحارة… اللي صاحي يقول رمضان كريم!»"],
      [134, 690, "«{اصحى|اصحي} يا {name}! السحور يا {حبيب|حبيبة} أمك!»"],
      [36, 690, "«يا حاجة نعمات… اصحي يا ست الكل! الزرع سهران معاكي!»"],
      [370, 600, "«رمضان كريم يا حارة… والله أكرم!»"],
      [440, 690, "«يا عم صابر… اصحى يا أطيب قلب في الحارة!»"],
      [470, 500, "«يا أهل القهوة… السحور قبل الدور الجاي!»"],
      [380, 420, "«اصحى يا نايم… وحّد الدايم!»"],
      [300, 330, "«السحور يا عباد الله… السحور!»"],
      [206, 430, "«اصحى يا نايم… وحّد الرزّاق!»"]
    ]
  };
  // the places say what's different at suhoor (each list is read from the top: suhoor first)
  function before(id, line) { WD.LOOK[id] = [line].concat(WD.LOOK[id] || []); }
  before("bakery", { when: "suhoor", t: "الفرن ولّع تاني الساعة اتنين. أول خبزة للسحور طالعة، وريحتها صحّت الحارة." });
  before("cafe", { when: "suhoor", t: "القهوة لسه صاحية: دور طاولة أخير قبل السحور، والراديو بيقرا قرآن الفجر." });
  before("home", { when: "suhoor", t: "ماما بتنادي من الشباك: السحور جاهز! فول وبيض وجبنة وزبادي." });
  before("steps", { when: "suhoor", t: "الجامع منوّر. فاضل ساعة على الفجر، والشيخ بيقرا." });
  before("mosque", { when: "suhoor", t: "الجامع منوّر. فاضل ساعة على الفجر، والشيخ بيقرا." });
  before("square", { when: "suhoor", t: "المائدة فاضية، بس الفوانيس لسه منوّرة. الحارة كلها عند خيمة سيد." });
  WD.LOOK.tanoura = [{ t: "مدحت بيلف من ربع ساعة ولسه ما وقفش. التنورة تقيلة سبعة كيلو، وكل طبقة لونها غير التانية." }];
  WD.LOOK.aragoz = [{ t: "الأراجوز! بيضرب الشاويش بالعصاية، والعيال بيموتوا من الضحك. صوته بيطلع من أمانة صغيرة في بُق اللاعب ورا الستارة." }];
  WD.LOOK.drinks = [{ t: "سوبيا بيضا، تمر هندي، عرقسوس، وكركديه. التلج بيخبط في الإزاز." }];

  /* ================= the tent, inside ================= */
  var TW = 232, TH = 214, WALL = 58;
  var C = 40, S = { t0: null, last: "", cn: 1, abCyc: -1 }; // the show runs on a 40-second loop from when you walk in
  function phase(T) {
    if (S.t0 == null) return { k: "spin", t: 0 };
    var t = (T - S.t0) % C;
    return t < 14 ? { k: "spin", t: t } : t < 22 ? { k: "lift", t: t - 14 } : t < 34 ? { k: "led", t: t - 22 } : { k: "bow", t: t - 34 };
  }

  // a big hanging lantern, for over everyone's heads
  var bigFanous = sprite(15, 26, function (P) {
    P.map(5, 0, [".yy..", "y....", "y....", ".yy.."], { y: GOLD });
    P.r(7, 3, 1, 2, BRASS[2]);
    P.el(2, 4, 11, 6, BRASS[0]); P.el(3, 4, 7, 4, BRASS[1]);
    P.r(1, 9, 13, 2, BRASS[2]);
    for (var i = 0; i < 4; i++) { var gc = [GLASS[0], GLASS[3], GLASS[1], GLASS[2]][i]; P.r(2 + i * 3, 11, 3, 9, gc); P.r(2 + i * 3, 11, 1, 9, lt(gc, 0.45)); P.p(3 + i * 3, 14, lt(gc, 0.8)); P.p(3 + i * 3, 18, dk(gc, 0.2)); }
    P.r(1, 11, 1, 9, BRASS[2]); P.r(13, 11, 1, 9, BRASS[2]); for (var j = 4; j < 13; j += 3) P.r(j, 11, 1, 9, BRASS[0]);
    P.r(1, 15, 13, 1, BRASS[0]);
    P.r(1, 20, 13, 2, BRASS[2]); P.r(3, 22, 9, 2, BRASS[0]); P.r(6, 24, 3, 2, BRASS[2]);
  });

  // the low tables of suhoor: ful, eggs, white cheese with tomato, yoghurt, pickles, bread, tea
  PROPS.suhoorTabliya = function () {
    return sprite(32, 16, function (P) {
      P.el(1, 2, 30, 10, "#B8862E"); P.el(2, 2, 28, 8, "#E0B050"); P.el(5, 3, 22, 5, "#EAC064");
      P.r(5, 11, 2, 4, WOOD[2]); P.r(25, 11, 2, 4, WOOD[2]); P.r(15, 11, 2, 4, WOOD[3]);
      P.el(4, 3, 8, 5, "#F4EFE4"); P.el(5, 4, 6, 3, "#8A4E26"); P.p(7, 4, "#E8B040"); P.p(8, 5, "#6EBE58"); // ful with oil and parsley
      P.el(13, 2, 6, 4, "#F4EFE4"); P.el(14, 3, 2, 2, "#F2C14A"); P.el(16, 3, 2, 2, "#F2C14A"); // eggs
      P.r(20, 3, 6, 3, "#F4EFE4"); P.r(21, 3, 2, 2, "#FFFFFF"); P.p(24, 4, "#E8503F"); P.p(23, 3, "#E8503F"); // cheese and tomato
      P.el(9, 7, 6, 4, "#D9A25E"); P.p(11, 7, "#F0C888"); P.el(17, 7, 6, 4, "#E0AE6A"); // bread
      P.el(23, 7, 5, 3, "#F4EFE4"); P.r(24, 7, 3, 1, "#FFFFFF"); // yoghurt
      P.p(5, 8, "#F08A2A"); P.p(6, 9, "#F08A2A"); P.p(7, 8, "#6EBE58"); // pickles
      P.r(27, 3, 2, 3, "#E8F2F4"); P.r(27, 4, 2, 2, "#B8452A"); P.r(2, 6, 2, 3, "#E8F2F4"); P.r(2, 7, 2, 2, "#B8452A"); // tea glasses
    }, [0, 12, 32, 4, 0.25]);
  };
  // the drinks bar: big glass jugs of sobia, tamarind, licorice and karkadeh, ice, cups, a brass licorice jug
  PROPS.drinksBar = function () {
    return sprite(48, 32, function (P) {
      var R = rng(3);
      P.r(1, 16, 46, 4, "#B88A5A"); P.r(1, 16, 46, 1, "#D9AA70");
      P.r(1, 20, 46, 9, RED);
      for (var k = 1; k < 47; k += 8) { P.r(k, 21, 8, 7, (k / 8 | 0) % 2 ? NAVY : RED); P.el(k + 2, 22, 4, 4, GOLD); P.p(k + 3, 23, CREAM); }
      P.r(1, 20, 46, 1, GOLD); P.r(1, 28, 46, 1, "#8C2E28"); for (var f = 2; f < 46; f += 3) P.p(f, 29, GOLD);
      [["#F4EEE0", "#FFFFFF"], ["#6A3A1E", "#8A5A30"], ["#2A1A14", "#4A3024"], ["#B8203A", "#E8506A"]].forEach(function (d, i) {
        var x = 3 + i * 9;
        P.r(x, 4, 7, 12, "#D8ECF0"); P.r(x + 1, 6, 5, 9, d[0]); P.r(x + 1, 6, 1, 9, d[1]); P.r(x, 3, 7, 1, "#B8D0D8"); P.p(x + 5, 5, "#FFFFFF");
        P.p(x + 2, 7, "#E8F8FF"); P.p(x + 4, 9, "#E8F8FF"); // ice
      });
      // the brass licorice jug with its long spout
      P.el(39, 2, 7, 13, BRASS[0]); P.el(40, 3, 3, 8, BRASS[1]); P.r(41, 0, 3, 3, BRASS[2]); P.line(45, 6, 47, 2, BRASS[2]);
      for (var c = 0; c < 3; c++) P.r(37 - c, 12 + c, 3, 1, "#E8E2D6"); // cups
      P.dots(2, 17, 44, 2, ["#9A7048"], 6, R);
    }, [0, 28, 48, 4, 0.25]);
  };
  // the puppet booth: striped cloth, a little stage window, a valance; js/map.js plays the puppets in the window
  PROPS.aragozBooth = function () {
    return sprite(36, 52, function (P) {
      for (var x = 2; x < 34; x += 4) P.r(x, 20, 4, 30, (x / 4) % 2 ? "#E8503F" : "#F2C14A");
      P.r(2, 20, 32, 1, dk("#E8503F", 0.2));
      P.r(1, 6, 2, 46, WOOD[2]); P.r(33, 6, 2, 46, WOOD[3]);
      P.r(3, 8, 30, 12, "#3A1E36"); P.r(4, 9, 28, 10, "#2A1428"); // the window, dark inside
      P.r(3, 8, 3, 12, "#8C2E28"); P.r(30, 8, 3, 12, "#8C2E28"); // curtains
      P.r(1, 4, 34, 4, NAVY); for (var s = 1; s < 35; s += 4) { P.el(s, 6, 4, 4, GOLD); }
      P.r(0, 0, 36, 5, "#1F4A3A"); P.r(0, 0, 36, 1, "#2F6A52"); P.r(0, 4, 36, 1, GOLD);
      P.r(3, 19, 30, 2, WOOD[1]); P.r(3, 20, 30, 1, WOOD[3]); // the ledge the puppets lean on
    }, [0, 48, 36, 5, 0.25]);
  };

  /* ---- the dancer, drawn by hand every frame, the size of everyone else (about 36 px with his cap) ---- */
  var SKIN_D = "#C89070", SHIRT = "#F4EFE6", CAPC = "#8A2A34";
  function drawDancer(R, x, y) {
    var ph = phase(R.T), t = ph.t, k = ph.k, pal = k === "led" ? NEON : SKIRT, r, dx;
    var speed = k === "bow" ? Math.max(0, 9 - t * 4) : k === "led" ? 11 : k === "lift" ? 10 : 8;
    var dt = S.lastT == null ? 0 : Math.min(0.1, R.T - S.lastT); S.lastT = R.T;
    S.spin = (S.spin || 0) + speed * dt;
    var spin = S.spin, flare = k === "bow" ? Math.max(0.45, 1 - t * 0.4) : 1, bob = k === "bow" ? 0 : Math.round(Math.sin(R.T * 5) * 0.5);
    var bend = k === "bow" && t > 1.2 && t < 5 ? 2 : 0, wy = y - 15 + bob; // the waist
    // light on the stage boards around him; in the dark it takes the colour of the skirt
    R.alpha(k === "led" ? 0.5 : 0.22); R.rect(x - 15, y - 1, 30, 3, k === "led" ? NEON[((R.T * 4) | 0) % 6] : "#FFE6A0"); R.rect(x - 11, y + 2, 22, 1, k === "led" ? NEON[((R.T * 4 + 2) | 0) % 6] : "#FFE6A0"); R.alpha(1);
    // the skirt: a bell from the waist to a round hem (seen from above, so the hem dips in the middle),
    // its stripes placed by angle round the body so they run sideways as it spins
    var first = k === "lift" ? 5 : 0, H = 14;
    function half(rr) { return Math.round((4 + Math.pow(Math.min(rr, H - 1) / (H - 1), 1.25) * 9) * (0.45 + 0.55 * flare)); }
    var hwMax = half(H - 1);
    for (r = first; r < H + 3; r++) {
      var hw = half(r);
      for (dx = -hw; dx <= hw; dx++) {
        var u = dx / (hw + 0.5), dip = r >= H - 1 ? Math.round(2.5 * (1 - u * u)) : 0;
        if (r > H - 1 + dip) continue;
        var a = Math.asin(Math.max(-1, Math.min(1, u))), band = Math.floor(a * 2.6 + spin);
        var col = pal[((band % 6) + 6) % 6];
        if (u < -0.6) col = lt(col, 0.22); else if (u > 0.55) col = dk(col, 0.25);
        if (r === 4 || r === 9 || r === H - 1 + dip) col = k === "led" && ((dx + ((R.T * 18) | 0)) % 3 === 0) ? "#FFFFFF" : GOLD;
        R.rect(x + dx, wy + r, 1, 1, col);
      }
    }
    if (k === "led") { R.alpha(0.18); R.rect(x - hwMax - 2, wy + 2, hwMax * 2 + 5, H, NEON[((R.T * 3) | 0) % 6]); R.alpha(1); }
    // his body: a white shirt with a sash, his face with eyes shut, the tall felt cap
    var by = wy + bend;
    R.rect(x - 3, by - 8, 7, 8, SHIRT); R.rect(x + 3, by - 8, 1, 8, "#D8D0C4"); R.rect(x - 3, by - 8, 1, 8, "#FFFFFF");
    R.rect(x - 3, by - 2, 7, 2, CAPC); R.rect(x - 3, by - 2, 7, 1, "#B5473B");
    R.rect(x - 1, by - 9, 3, 1, SKIN_D);
    R.rect(x - 3, by - 15, 6, 6, SKIN_D); R.rect(x + 2, by - 15, 1, 6, "#AE734C");
    R.rect(x - 2, by - 12, 2, 1, "#3A2A30"); R.rect(x + 1, by - 12, 1, 1, "#3A2A30"); R.rect(x - 1, by - 10, 2, 1, "#8A4A4A");
    R.rect(x - 3, by - 22, 6, 7, CAPC); R.rect(x - 2, by - 23, 4, 1, CAPC); R.rect(x - 3, by - 22, 1, 7, "#B5473B"); R.rect(x - 3, by - 16, 6, 1, "#5A1A24");
    // arms: right palm up to the sky, left palm down to the earth; both up when the skirt goes over his head; on his chest for the bow
    if (k === "lift") {
      var lift = Math.min(1, t / 1.2) * (t > 6.5 ? Math.max(0, 1 - (t - 6.5) / 1.5) : 1), dy = Math.round(by - 27 - lift * 6);
      R.rect(x - 5, dy + 3, 2, by - 6 - dy - 3, SHIRT); R.rect(x + 4, dy + 3, 2, by - 6 - dy - 3, SHIRT);
      R.rect(x - 5, dy + 2, 2, 2, SKIN_D); R.rect(x + 4, dy + 2, 2, 2, SKIN_D);
      for (r = 0; r < 6; r++) { // the top skirt, spinning over his head like a wheel
        var hw2 = Math.round(14 * Math.sqrt(1 - Math.pow((r - 2.5) / 3, 2)));
        for (var d2 = -hw2; d2 <= hw2; d2++) { var a2 = Math.atan2((r - 2.5) * 3, d2) + spin * 1.4; R.rect(x + d2, dy + r - 3, 1, 1, r === 5 ? GOLD : pal[((Math.floor(a2 * 1.9) % 6) + 6) % 6]); }
      }
    } else if (k === "bow") {
      R.rect(x - 4, by - 7, 2, 4, SHIRT); R.rect(x + 3, by - 7, 2, 4, SHIRT); R.rect(x - 2, by - 5, 5, 2, SKIN_D);
    } else {
      var sw = Math.round(Math.sin(R.T * 2.5));
      R.rect(x + 4, by - 13 + sw, 2, 6, SHIRT); R.rect(x + 5, by - 16 + sw, 2, 3, SKIN_D); // right hand up
      R.rect(x - 5, by - 7, 2, 4, SHIRT); R.rect(x - 7, by - 4, 3, 2, SKIN_D); // left hand down
    }
  }
  /* ---- the band's instruments, on the beat (an eighth is 0.278 s, like js/audio.js) ---- */
  function drawBand(R) {
    var E = 0.278, step = Math.floor(R.T / E) % 8, hit = (R.T % E) < 0.1, beat = [1, 1, 0, 1, 1, 0, 1, 0][step];
    // the tabla (darbuka) across the drummer's lap: a skin head facing out, a tapering brass body, his hand coming down
    var tx = 87, ty = 72;
    R.rect(tx - 3, ty - 8, 7, 3, "#C8963E"); R.rect(tx - 3, ty - 8, 7, 1, "#F2C76C"); R.rect(tx - 5, ty - 7, 2, 1, "#8A6224");
    R.rect(tx + 4, ty - 10, 3, 7, "#8A6224"); R.rect(tx + 5, ty - 10, 2, 7, "#F4EFE4"); R.rect(tx + 5, ty - 9, 1, 1, "#FFFFFF");
    R.rect(tx - 1, ty - 7, 1, 1, "#E8F2F4"); R.rect(tx + 1, ty - 7, 1, 1, "#E8F2F4");
    R.rect(tx + 6, ty - 13 + (beat && hit ? 3 : 0), 2, 2, "#8A5838");
    // the riq held up beside his face on a raised arm, shaking: a wooden ring, a skin, brass jingles
    var rx = 108 + (hit ? 1 : 0), ry = 49;
    R.rect(103, 57, 2, 3, "#5E7A9A"); R.rect(104, 55, 2, 2, "#C68862");
    R.rect(rx - 2, ry, 5, 1, "#8A6224"); R.rect(rx - 2, ry + 6, 5, 1, "#8A6224"); R.rect(rx - 3, ry + 1, 1, 5, "#8A6224"); R.rect(rx + 3, ry + 1, 1, 5, "#8A6224");
    R.rect(rx - 2, ry + 1, 5, 5, "#F2E2BE"); R.rect(rx - 1, ry + 2, 2, 1, "#FFF8E4");
    R.rect(rx - 3, ry + 3, 1, 1, "#FFE08A"); R.rect(rx + 3, ry + 2, 1, 1, "#FFE08A"); R.rect(rx, ry - 1, 1, 1, "#FFE08A"); R.rect(rx, ry + 7, 1, 1, "#FFE08A");
    // the mizmar from the piper's mouth, its bell bobbing with the tune
    var mx = 145, my = 51, bb = Math.round(Math.sin(R.T * 4));
    for (var i = 0; i < 7; i++) R.rect(mx - 1 - i, my + i + (i > 4 ? bb : 0), 1, 1, "#8A5A2A");
    R.rect(mx - 10, my + 6 + bb, 3, 2, "#C8963E"); R.rect(mx - 10, my + 6 + bb, 3, 1, "#F2C76C");
  }
  /* ---- the puppets in the booth window: the aragoz and the policeman (5.2 s loop, the whack at 3 s) ---- */
  function drawPuppets(R, x0, top) {
    var t = R.T % 5.2, wx = x0 + 4, wy = top + 9;
    var ar = t < 0.4 ? Math.round(10 - t * 25) : 0, bonk = t > 2.9 && t < 3.3, shDown = t > 3.0 && t < 4.4 ? Math.min(8, Math.round((t - 3.0) * 30)) : 0;
    var arx = wx + 8, ary = wy + 3 + ar + (t > 3.2 && t < 4.6 ? Math.round(Math.abs(Math.sin(t * 14))) * -1 : 0);
    // the policeman: black cap, moustache, khaki
    var sx = wx + 19, sy = wy + 3 + shDown;
    if (shDown < 8) {
      R.rect(sx, sy, 5, 2, "#1F1A24"); R.rect(sx - 1, sy + 1, 7, 1, "#1F1A24");
      R.rect(sx, sy + 2, 5, 4, "#E8B890"); R.rect(sx + 1, sy + 3, 1, 1, "#2A1A24"); R.rect(sx + 3, sy + 3, 1, 1, "#2A1A24"); R.rect(sx, sy + 5, 5, 1, "#2A1A24");
      R.rect(sx - 1, sy + 6, 7, Math.max(0, 5 - shDown), "#B8A26A");
    }
    // the aragoz: red tall hat, white face, big red nose, a stick
    if (ar < 10) {
      R.rect(arx + 1, ary - 3, 3, 3, "#D8303A"); R.rect(arx + 2, ary - 5, 1, 2, "#D8303A");
      R.rect(arx, ary, 5, 4, "#F6EEE4"); R.rect(arx + 1, ary + 1, 1, 1, "#2A1A24"); R.rect(arx + 3, ary + 1, 1, 1, "#2A1A24"); R.rect(arx + 4, ary + 2, 2, 1, "#E8303A");
      R.rect(arx, ary + 3, 4, 1, "#C83040"); R.rect(arx - 1, ary + 4, 7, Math.max(0, 6 - ar), "#D8303A");
      if (bonk) { R.rect(arx + 6, ary - 2, 7, 1, "#8A5A2A"); R.rect(sx + 2, sy - 3, 1, 1, "#FFF6C0"); R.rect(sx + 4, sy - 4, 1, 1, "#FFF6C0"); }
      else R.rect(arx + 5, ary - 4, 1, 6, "#8A5A2A");
    }
  }
  function dimmed(T) { return [phase(T).k === "led" ? 0.35 : 1, null]; } // the house lights, low while the skirt glows
  // each moment of the show sets the crowd off
  function audience(api) { return api.actors().filter(function (a) { return a.react; }); }
  function some(list, n) { return list.slice().sort(function () { return Math.random() - 0.5; }).slice(0, n); }
  function onPhase(k, api) {
    var crowd = audience(api);
    if (k === "lift") { some(crowd, 2).forEach(function (a) { api.say(a, "«الله!»", 1.6); }); some(crowd, 3).forEach(function (a) { api.jump(a); }); }
    if (k === "led") { some(crowd, 1).forEach(function (a) { api.say(a, "«ياااه! نوّر!»", 1.8); }); some(crowd, 5).forEach(function (a) { api.emote(a, "!"); }); }
    if (k === "bow") {
      api.burst("confetti", 116, 44, 18); api.burst("confetti", 100, 50, 10); api.burst("confetti", 132, 50, 10);
      if (api.dist(116, 100) < 140) api.sfx("clap", 1.3);
      some(crowd, 2).forEach(function (a, i) { api.say(a, i ? "«يا سلام!»" : "«الله! تاني!»", 2); });
      some(crowd, 6).forEach(function (a) { api.emote(a, "♥"); api.jump(a); });
    }
  }

  function makeTent() {
    var K = H.rooms.kit;
    var s = K.shell(TW, TH, WALL, {
      cap: "#7A2430", seed: 9,
      floor: function (P, R) {
        P.r(0, WALL, TW, TH - WALL, "#C9A46A"); P.dots(0, WALL, TW, TH - WALL, ["#B8935A", "#D9B47A"], 500, R);
        // kilims: a long one in front of the stage, two under the tables
        function kilim(x, y, w, h, a, b) {
          P.r(x, y, w, h, a); P.r(x, y, w, 2, GOLD); P.r(x, y + h - 2, w, 2, GOLD);
          for (var i = x + 3; i < x + w - 6; i += 9) for (var j = y + 4; j < y + h - 6; j += 8) { P.r(i + 2, j, 1, 5, b); P.r(i + 1, j + 1, 3, 3, b); P.r(i, j + 2, 5, 1, b); P.p(i + 2, j + 2, GOLD); }
          for (var f = x; f < x + w; f += 2) { P.p(f, y - 1, CREAM); P.p(f, y + h, CREAM); }
        }
        kilim(70, 94, 92, 36, "#9A2430", NAVY);
        kilim(26, 140, 96, 50, NAVY, "#C8443A");
        kilim(128, 140, 92, 50, "#2F6A52", GOLD);
        P.r(104, 190, 24, 18, "#B8935A"); for (var m = 104; m < 128; m += 3) P.r(m, 190, 1, 18, "#A88450"); // a straw mat in from the door
        // the stage: boards seen from above, a carpet, a khayamiya skirt and gold fringe down its front
        P.r(74, WALL, 84, 28, "#9C6542"); for (var b = WALL + 3; b < WALL + 28; b += 4) P.r(74, b, 84, 1, "#7A4A31");
        P.r(82, WALL + 2, 68, 22, "#8A1E2C"); P.r(84, WALL + 4, 64, 18, "#A8283A"); P.r(84, WALL + 4, 64, 1, GOLD); P.r(84, WALL + 21, 64, 1, GOLD);
        for (var o = 0; o < 8; o++) { var hw = 8 - Math.abs(o - 4) * 2; P.r(116 - hw, WALL + 9 + o, hw * 2, 1, GOLD); }
        for (var q = 0; q < 6; q++) { var hw3 = 5 - Math.abs(q - 3) * 2; if (hw3 > 0) P.r(116 - hw3, WALL + 10 + q, hw3 * 2, 1, "#8A1E2C"); }
        for (var pn = 0; pn < 6; pn++) panelArt(P, 74 + pn * 14, WALL + 28, 14, 7, pn % 2 ? NAVY : RED, null);
        for (var fr = 74; fr < 158; fr += 2) P.p(fr, WALL + 35, GOLD);
        P.r(74, WALL + 36, 84, 2, "rgba(40,20,40,0.3)");
      },
      wall: function (P, R) {
        for (var i = 0; i < 15; i++) panelArt(P, i * 16, 14, 16, WALL - 14, i % 2 ? NAVY : RED, R);
        P.r(0, 6, TW, 8, CREAM); P.r(0, 6, TW, 1, GOLD); P.r(0, 13, TW, 1, GOLD);
        for (var x = 2; x < TW; x += 6) { P.p(x, 9, RED); P.p(x + 1, 10, GREEN); P.p(x + 3, 9, RED); }
        // behind the stage: a navy backdrop with a gold crescent and star, and curtains of fairy lights either side
        P.r(92, 14, 48, WALL - 14, "#1A2450"); P.r(92, 14, 48, 1, GOLD); P.r(92, 14, 1, WALL - 14, GOLD); P.r(139, 14, 1, WALL - 14, GOLD);
        P.el(104, 18, 22, 22, GOLD); P.el(110, 17, 20, 20, "#1A2450");
        P.map(124, 22, ["..y..", ".yyy.", "yyyyy", ".yyy.", ".y.y."], { y: GOLD });
        P.dots(93, 15, 46, WALL - 16, ["#FFF6C0", "#C9CDF0"], 30, R);
        for (var c = 0; c < 7; c++) { P.r(76 + c * 2, 14, 1, WALL - 14, "#3A2A3A"); P.r(142 + c * 2, 14, 1, WALL - 14, "#3A2A3A"); }
      }
    });
    var tables = [[70, 168], [140, 168]];
    var cushions = [];
    function seats(tx, ty) { var cx = tx + 16; return [[cx - 20, ty - 4, 3], [cx + 20, ty - 4, 2], [cx, ty - 13, 0], [cx, ty + 9, 1]]; }
    tables.forEach(function (t) { seats(t[0], t[1]).forEach(function (st, i) { cushions.push({ k: "cushion", o: { c: [RED, NAVY, GREEN, "#E86AA0"][i] }, x: st[0] - 6, y: st[1] + 1, noblock: true }); }); });
    [[72, 102], [86, 104], [146, 104], [160, 102]].forEach(function (p, i) { cushions.push({ k: "cushion", o: { c: [GOLD, RED, NAVY, GREEN][i] }, x: p[0] - 6, y: p[1] + 1, noblock: true }); });
    var room = {
      id: "tent", name: "خيمة عم سيد", sub: "تنورة وأراجوز وفول لحد الفجر", W: TW, HGT: TH, ground: s.c, bed: "tentIn", wall: WALL, suhoor: true,
      amb: { suhoor: [212, 168, 150], night: [212, 168, 150] },
      showDim: function (T) { return phase(T).k === "led" ? 0.72 : 0; },
      props: [
        { k: "fulCart", x: 8, y: 124, block: [50, 30], steam: [11, -38], smoke: [41, -26], light: [42, -37, [255, 214, 150], 46], sign: { dx: 25, dy: -12, t: "فول سيد", h: 5, fg: "#B5473B" } },
        { k: "drinksBar", x: 178, y: 122, block: [46, 8], look: "drinks", sign: { dx: 24, dy: -33, t: "سوبيا · تمر · عرقسوس", h: 4.2, fg: "#FFE08A" } },
        { k: "aragozBooth", x: 8, y: 178, block: [34, 6], look: "aragoz", anim: drawPuppets, sign: { dx: 18, dy: -49, t: "الأراجوز", h: 4.4, fg: "#FFE08A" } },
        { k: "suhoorTabliya", x: tables[0][0], y: tables[0][1], block: [28, 6] },
        { k: "suhoorTabliya", x: tables[1][0], y: tables[1][1], block: [28, 6] },
        { k: "bigLantern", x: 206, y: 196, block: [14, 5] }
      ].concat(cushions),
      fixtures: [
        { layer: "wall", draw: function (R) {
          R.text("رمضان كريم", 116, 10, 6, "#9A2430");
          for (var i = 0; i < 7; i++) for (var j = 0; j < 9; j++) { // the fairy-light curtains twinkle
            var on = Math.sin(R.T * 3 + i * 1.7 + j * 2.3) > 0.2;
            R.rect(76 + i * 2, 17 + j * 4 + (i % 2) * 2, 1, 1, on ? "#FFF2B0" : "#7A6A4A");
            R.rect(142 + i * 2, 17 + j * 4 + ((i + 1) % 2) * 2, 1, 1, Math.sin(R.T * 3.4 + i * 2.1 + j * 1.3) > 0.2 ? "#FFF2B0" : "#7A6A4A");
          }
        } },
        { layer: "sort", y: 74, draw: drawBand }
      ],
      over: function (R) {
        [[44, 64, 0], [188, 64, 1.7]].forEach(function (f) { var sw = Math.round(Math.sin(R.T * 1.1 + f[2]) * 1.2); R.rect(f[0] + 7 + sw, 6, 1, f[1] - 6 - 26, "#5A4030"); R.img(bigFanous, f[0] + sw, f[1] - 26); });
      },
      strings: [
        { k: "bulbs", x0: 6, y0: 16, x1: TW - 6, y1: 16, sag: 10 },
        { k: "lanterns", x0: 6, y0: 22, x1: 88, y1: 30, sag: 8 },
        { k: "lanterns", x0: 144, y0: 30, x1: TW - 6, y1: 22, sag: 8 },
        { k: "flags", x0: 6, y0: 86, x1: 70, y1: 86, sag: 6 },
        { k: "flags", x0: 162, y0: 86, x1: TW - 6, y1: 86, sag: 6 }
      ],
      walk: [[8, 92, TW - 16, TH - 100], [104, TH - 8, 24, 6]],
      lights: [
        { x: 116, y: 130, r: 200, c: [255, 210, 160], when: "always", g: 0.18, dyn: function (T) { return [phase(T).k === "led" ? 0.15 : 1, null]; } },
        { x: 116, y: 64, r: 66, c: [255, 236, 200], when: "always", g: 0.85, dyn: function (T) { var p = phase(T); return p.k === "led" ? [1.25, A.rgb(NEON[((T * 3) | 0) % 6])] : p.k === "bow" ? [1.1, [255, 200, 220]] : [1, null]; } },
        { x: 70, y: 80, r: 70, c: [255, 80, 120], when: "always", g: 0.5, dyn: function (T) { return [0.6 + 0.4 * Math.sin(T * 2), [[255, 80, 120], [255, 200, 80], [120, 255, 160]][((T * 0.6) | 0) % 3]]; } },
        { x: 162, y: 80, r: 70, c: [80, 140, 255], when: "always", g: 0.5, dyn: function (T) { return [0.6 + 0.4 * Math.cos(T * 2), [[80, 140, 255], [200, 100, 255], [80, 230, 255]][((T * 0.6) | 0) % 3]]; } },
        { x: 26, y: 140, r: 36, c: [255, 190, 120], when: "always", g: 0.7, dyn: dimmed },
        { x: 200, y: 98, r: 38, c: [255, 224, 180], when: "always", g: 0.6, dyn: dimmed },
        { x: 51, y: 52, r: 30, c: [255, 120, 90], when: "always", g: 0.9 },
        { x: 195, y: 52, r: 30, c: [90, 160, 255], when: "always", g: 0.9 },
        { x: 82, y: 36, r: 26, c: [255, 236, 170], when: "always", g: 0.6, fl: 2 },
        { x: 148, y: 36, r: 26, c: [255, 236, 170], when: "always", g: 0.6, fl: 2 },
        { x: 213, y: 170, r: 40, c: [255, 200, 120], when: "always", g: 0.8, dyn: dimmed }
      ],
      wins: [],
      exits: [K.exitAt(TW, TH, "tent")],
      spawn: { hara: [116, 196, 1] },
      tick: function (R, dt, api) {
        if (S.t0 == null) S.t0 = R.T;
        var p = phase(R.T);
        if (p.k !== S.last) { S.last = p.k; onPhase(p.k, api); }
        S.cn -= dt;
        if (S.cn <= 0) { // the music lifts someone now and then
          S.cn = rnd(0.5, 1.2);
          if (Math.random() < 0.6) api.note(116 + rnd(-40, 40), 40);
          var crowd = audience(api);
          if (crowd.length && Math.random() < 0.5) api.emote(crowd[(Math.random() * crowd.length) | 0], Math.random() < 0.75 ? "♪" : "♥");
        }
        var cyc = Math.floor(R.T / 5.2); // the aragoz whacks the policeman: the kids in front of the booth fall about
        if (R.T % 5.2 > 3.0 && S.abCyc !== cyc) {
          S.abCyc = cyc;
          ["youssef", "nourah", "hoda"].forEach(function (id) { var a = api.by(id); if (a && Math.random() < 0.8) { api.jump(a); api.emote(a, Math.random() < 0.5 ? "!" : "♥"); } });
          var d = api.dist(26, 160);
          if (d < 90) { api.sfx("squeak", 1 - d / 110); if (Math.random() < 0.5) api.sfx("kids", 0.5); }
        }
      },
      people: function () {
        S.t0 = null; S.last = ""; S.spin = 0; S.lastT = null;
        var out = [
          // the stage: the dancer in the middle, the band around him
          { id: "medhat", cast: "tanoura", name: "مدحت راقص التنورة", at: [116, 80, 0], draw: drawDancer, talk: [116, 96], say: [
            { t: "«التنورة دي تقيلة سبعة كيلو. بلفها من وأنا عندي اتناشر سنة.»" },
            { t: "«الدنيا كلها بتلف حواليا… وأنا الوحيد اللي ثابت.»" }] },
          { cast: "tablaP", name: "عم سلامة الطبّال", at: [86, 72, 0, "sit"], talk: [88, 96], react: 0, say: ["«الإيقاع ده اسمه مقسوم. {اسأل|اسألي} رجليك، هي فاهماه.»"] },
          { cast: "riqP", name: "عزت بتاع الرق", at: [100, 70, 0, "sit"], talk: [100, 96], say: ["«الرق لو سكت ثانية، الخيمة كلها تحس إن في حاجة ناقصة.»"] },
          { cast: "zamarP", name: "عم فرج الزمّار", at: [146, 70, 0, "sit"], talk: [146, 96], say: ["«المزمار ده نفَسه طويل… زي ليالي رمضان.»"] },
          // the ful cart: Sayed at his pot, his wife at the ta'meya pan
          { cast: "sayed", name: "عم سيد", at: [30, 112, 0], serve: "ful", talk: [37, 140], say: [
            "«{نوّرت|نوّرتي} الخيمة! {اقعد|اقعدي} على أي طبلية، والفول جاي لحد عندك.»",
            "«فول بالزيت الحار، وبيض بالبسطرمة، وجبنة بالطماطم… وده لسه أول السحور.»",
            "«سنة كاملة بحوّش للخيمة دي. الحارة تستاهل ليلة زي دي.»"] },
          { cast: "omhamo", name: "أم حمو", at: [47, 109, 0], serve: "tameya", talk: [60, 134], say: [
            "«الطعمية دي بالسمسم والكزبرة. سيد بيقول إنها بتاعته… وأنا اللي بقليها من عشرين سنة.»",
            "«حمو فين؟ قال رايح يقف على الباب… أكيد بياكل طعمية من ورايا.»"] },
          { cast: "mandour", name: "عم مندور", at: [201, 108, 0], talk: [201, 132], say: [
            "«سبت العربية في الساحة وجيت الخيمة… الزباين كلهم هنا!»",
            "«سوبيا ولا تمر هندي ولا عرقسوس؟ {اشرب|اشربي} دلوقتي قبل الإمساك!»",
            "«العرقسوس ده بيروي يوم صيام كامل. ده كلام الجدود مش كلامي.»"] },
          { cast: "bilya", name: "بلية بتاع الشاي", at: [116, 186, 1], hold: "tea", loop: [[120, 134, 0], [64, 140, 2], [116, 140, 3], [192, 146, 3], [140, 192, 0], [116, 186, 1]], pause: [1, 2.5], speed: 0.55, say: [
            "«شاي بالنعناع؟ الكوباية بتلف الخيمة كلها وترجعلك سخنة.»",
            "«أنا ومدحت بنلف نفس اللفات… هو بيتسقف له، وأنا بيتقالي \"فين السكر؟\"»"] },
          // dancing in front of the stage
          { cast: "tayyar", name: "مصطفى الطيار", at: [98, 120, 0], dance: true, react: 1, say: ["«الليلة دي مفيش أوردرات. الليلة دي رقص!»"] },
          { cast: "m1", name: "حمادة", at: [134, 122, 0], dance: true, react: 1, say: ["«يا حلاوة! يا حلاوة!»"] },
          // the front row, on cushions, watching
          { cast: "w1", name: "أم أحمد", at: [72, 102, 3, "sit"], react: 1, say: ["«الولد ده بيلف من نص ساعة، وأنا اللي دايخة مكانه!»"] },
          { cast: "w3", name: "أم وليد", at: [86, 104, 3, "sit"], react: 1, say: ["«{استنى|استني} لما يرفع التنورة فوق راسه… هتشوف!»"] },
          { cast: "m8", name: "أشرف", at: [146, 104, 2, "sit"], react: 1, say: ["«هصوّره وأبعته لأخويا في الكويت. هيموت من الغيظ.»"] },
          { cast: "w4", name: "أم هاني", at: [160, 102, 2, "sit"], react: 1, say: ["«كل سنة وإنتو طيبين… والخيمة دي كل سنة!»"] },
          // the puppet booth, with Om Youssef's kids in front of it
          { id: "youssef", cast: "youssef", name: "يوسف", face: "youssef", at: [16, 194, 1], say: [{ t: "«الأراجوز ضرب الشاويش تلات مرات! والشاويش لسه مش فاهم!»" }] },
          { id: "nourah", cast: "nourah", name: "نورة", face: "nourah", at: [30, 196, 1], say: [{ t: "«أنا مش خايفة من الأراجوز… بس {امسك|امسكي} إيدي شوية.»" }] },
          { id: "hoda", cast: "k5", name: "حودة", at: [44, 194, 1, "sit"], say: [{ t: "«بيتكلم إزاي كده؟ صوته زي الصفارة!»" }] }
        ];
        // the two tables: who sits where, and what they say
        var who = [
          [["taxi", "عم شعبان السواق", "«سبت التاكسي برا والعداد واقف… كله يهون عشان فول سيد.»"],
           ["w5", "أم سمير", "«{كُل|كُلي} كويس يا {حبيبي|حبيبتي}. بكرة النهار طويل.»"],
           ["m7", "الحاج سليمان", "«ستين سنة بتسحر في الحارة دي، وعمري ما شفت خيمة كده.»"],
           ["k4", "هنا", "«أنا كلت تلات بيضات! بكرة مش هجوع خالص!»"]],
          [["m3", "أستاذ عادل", "«بكرة عندي حصة الساعة تمانية… مش مهم. التنورة أهم.»"],
           ["w2", "أم كريم", "«أنا كنت جاية آخد فول للبيت بس… والله.»"],
           ["saber", "عم صابر", "«أول مرة من شهور أتسحر وسط ناس… والفول طعمه أحلى كده.»"],
           ["k7", "مريم", "«أنا مش نايمة! أنا بس مغمّضة.»"]]
        ];
        tables.forEach(function (t, ti) {
          seats(t[0], t[1]).forEach(function (st, i) {
            var w = who[ti][i], e = { cast: w[0], name: w[1], at: [st[0], st[1], st[2], "sit"], react: 1, say: [w[2]], talk: [st[0] + (st[2] === 3 ? -10 : st[2] === 2 ? 10 : 0), st[1] + (st[2] === 1 ? 12 : st[2] === 0 ? 30 : 8)] };
            if (w[0] === "saber") { e.face = "saber_smile"; e.id = "saber"; e.say = [{ t: w[2] }]; delete e.react; }
            if (w[0] === "k7") { e.sleep = true; delete e.react; }
            out.push(e);
          });
        });
        return out;
      }
    };
    return room;
  }
  H.rooms.add("tent", makeTent, "tent", { room: "tent", spot: "tent", when: SUHOOR });
})();
