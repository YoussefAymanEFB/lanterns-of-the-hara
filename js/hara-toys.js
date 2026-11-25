/* فوانيس الحارة · دكان عم شوقي: the toy shop (walk.html).
   On the corner of the square, under the wooden balcony, there's a shop with its shutter three quarters down and
   dusty glass: «لعب عم شوقي». Shawky made and mended toys for every child in the hara until his hands started to
   shake; his grandson lost the key ten years ago. It hides in the hara on day 18 (again on day 24). Open the shop and
   Shawky comes down from his balcony; Eid is coming and three children in the hara have no toy for it. His eyes still
   work, his hands don't: he tells you, you mend (a wooden horse that lost a wheel, a drum with a split skin, a doll
   missing an eye). Then you take each toy to its child and watch them play with it. Miss the key, and on Eid those
   three stand at the dusty window. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world, PL = H.places;
  if (!A || !WD || !H.rooms || !PL) return;
  var S = PL.S, ar = PL.ar, sprite = A.sprite, PROPS = A.PROPS, dk = A.dk, lt = A.lt, rng = A.rng, SK = A.SKIN, WOOD = A.WOOD, BRASS = A.BRASS, GLASS = A.GLASS;
  var K = H.rooms.kit;
  var TW = 200, TH = 184, WALL = 66;

  WD.CAST.shawky = { build: "thin", skin: SK.fair, hair: { style: "grey", c: "#D8D2C8" }, head: { kind: "taqiyah", c: "#E8E2D6" }, top: { kind: "robe", c: "#6A5A7A" }, glasses: true, beard: "#E8E2D6", shoes: "#4A3328" };

  /* ================= the toys ================= */
  var TOYS = [
    { id: "horse", kid: "k7", name: "مريم", at: [112, 674, 0, "sit"], where: "قاعدة على المصطبة جنب بيتنا", item: "toyHorse",
      ask: "الحصان ده كان بيمشي ورا العيل اللي يشده. ناقصه إيه؟", opts: ["عجلة", "ودن", "ديل"], right: 0,
      wrong: ["ودن؟! هو هيسمع العيال بيقولوا إيه؟ لأ يا {حبيبي|حبيبتي}… بص تحته. ناقصه عجلة.", "ديل؟ ده عنده ديل من خيط أهو. بص تحته… ناقصه عجلة."],
      done: "{ركّبت|ركّبتي} العجلة في محورها و{دقّيت|دقّيتي} المسمار. الحصان مشي على الترابيزة لوحده.",
      thanks: "«ده… ده ليا أنا؟! حصان بيمشي؟!»", play: "«شوف! الحصان بتاعي بيمشي ورايا! هسميه «عنتر» زي بتاع الملاهي.»" },
    { id: "drum", kid: "k8", name: "آدم", at: [326, 700, 2], where: "واقف جنب الكاوتش في الملعب", item: "toyDrum",
      ask: "الطبلة دي جلدها مشقوق. نعمل إيه؟", opts: ["مسمار", "جلد جديد", "صمغ"], right: 1,
      wrong: ["مسمار في الطبلة؟ يبقى هتعمل «طاخ» مرة واحدة وتسكت للأبد! لأ… جلد جديد.", "الصمغ هيخليها تقول «طب» مش «تك». جلد جديد يا {حبيبي|حبيبتي}."],
      done: "{شدّيت|شدّيتي} جلد جديد على الطبلة و{ربطت|ربطتي} الحبل حواليها. «دُم… تَك!» عم شوقي ضحك.",
      thanks: "«طبلة! هبقى زي عم زينهم المسحراتي!»", play: "«دُم دُم تَك! {اسمع|اسمعي}! أنا هصحّي الحارة على السحور!»" },
    { id: "doll", kid: "k5", name: "حودة", at: [456, 750, 0], where: "قاعد عند باب الجنينة", item: "toyDoll",
      ask: "العروسة دي ناقصها عين. نحط لها إيه؟", opts: ["حباية فول", "خرزة", "زرار"], right: 2,
      wrong: ["حباية فول؟! عم سيد هيزعل! لأ… زرار.", "خرزة هتلمع زيادة، العروسة هتبان بتغمز. زرار زي التانية."],
      done: "{خيّطت|خيّطتي} زرار بني مكان العين اللي وقعت. العروسة بقت بتبص بعينين الاتنين، وكأنها بتبتسم.",
      thanks: "«دي لأختي الصغيرة… هي كانت عايزة عروسة من زمان. أنا هديهالها في العيد!»", play: "«أختي مستنياها في البيت. أنا شايلها لحد العيد… ما بخليهاش تتوسخ!»" }
  ];
  var toyImg = {
    toyHorse: sprite(14, 11, function (P) { P.r(2, 3, 9, 4, "#C8443A"); P.r(9, 0, 3, 4, "#C8443A"); P.p(11, 1, "#2A1A24"); P.r(3, 4, 6, 1, "#F2C14A"); P.r(1, 3, 1, 3, "#E8E2D6"); P.r(2, 7, 1, 2, WOOD[2]); P.r(9, 7, 1, 2, WOOD[2]); P.el(1, 8, 3, 3, "#3A3440"); P.el(8, 8, 3, 3, "#3A3440"); }),
    toyDrum: sprite(11, 10, function (P) { P.el(0, 1, 11, 4, "#F4EFE4"); P.r(0, 3, 11, 6, "#C8963E"); P.r(0, 5, 11, 1, "#E8503F"); P.line(1, 4, 9, 8, "#8A5A2A"); P.line(9, 4, 1, 8, "#8A5A2A"); P.el(0, 7, 11, 3, "#8A6224"); }),
    toyDoll: sprite(9, 13, function (P) { P.r(2, 0, 5, 2, "#5A3524"); P.r(2, 2, 5, 4, "#F4CDA6"); P.p(3, 3, "#2A1A24"); P.p(5, 3, "#5A3A28"); P.p(4, 5, "#E8708A"); P.r(1, 6, 7, 6, "#E86AA0"); P.r(1, 6, 7, 1, "#F2A0C0"); P.r(0, 7, 1, 3, "#F4CDA6"); P.r(8, 7, 1, 3, "#F4CDA6"); })
  };
  WD.ITEMS = Object.assign(WD.ITEMS || {}, toyImg); // js/map.js lets people hold these up
  function fixed(id) { return S.q["toy_" + id] === "fixed" || S.q["toy_" + id] === "given"; }
  function given(id) { return S.q["toy_" + id] === "given"; }

  // the three children, out in the afternoon once the shop is open: waiting for a toy, then playing with it
  TOYS.forEach(function (t) {
    WD.EXTRAS.push({ id: "toykid_" + t.id, cast: t.kid, name: t.name, at: t.at, times: ["asr", "pre"],
      if: function () { return !!S.open.toys; }, hold: function () { return given(t.id) ? t.item : null; },
      say: function () { return given(t.id) ? [t.play] : ["«العيد قرّب… كل العيال جابولهم لعب جديدة.»"]; },
      talkFn: function (a) {
        if (fixed(t.id) && !given(t.id)) { giveToy(t, a); return; }
        H.map.cut.say({ who: a.cid, name: t.name, t: given(t.id) ? t.play : "«العيد قرّب… كل العيال جابولهم لعب جديدة.»" });
      } });
  });
  function giveToy(t, a) {
    var C = H.map.cut;
    PL.scene([
      function () { return C.cam({ on: a.cid, zoom: 1.8, ms: 600 }); },
      { who: "me", t: "دي من دكان عم شوقي… {علشانك|علشانك} {إنت|إنتي}." },
      function () { C.item("me", t.item); return C.wait(700); },
      function () { C.item("me", null); C.item(a.cid, t.item); C.jump(a.cid); C.emote(a.cid, "♥"); C.burst("heart", a.cid, 6); if (H.audio) H.audio.chime(); return C.wait(900); },
      { who: a.cid, name: t.name, t: t.thanks },
      function () {
        S.q["toy_" + t.id] = "given"; PL.save();
        a.lines = [t.play];
        var left = TOYS.filter(function (x) { return !given(x.id); }).length;
        if (!left) return PL.play([{ t: "{اديت|اديتي} التلات لعب لأصحابهم. من شباك البلكونة فوق الدكان، عم شوقي بيلوّح لك… وعينه بتلمع." }, function () { S.q.toys = "done"; PL.save(); PL.banner("✦ لعب العيد", "تلات عيال في الحارة هيفرحوا في العيد… بسببك", "deed"); }]);
        PL.banner("🎁 " + t.name + " اخد لعبته", left === 1 ? "فاضل لعبة واحدة" : "فاضل " + ar(left) + " لعب", "deed");
      }
    ]).then(function () { a.item = { k: t.item, t: 9 }; a.keepItem = true; }); // the toy stays in their hands from now on
  }

  /* ================= opening the shop ================= */
  PL.openToys = function () {
    var C = H.map.cut, at = WD.SPOTS.toys.stand;
    PL.scene([
      function () { return C.walk("me", at[0] - 22, at[1] - 2, { face: 1 }); },
      function () { C.sfx("knock"); return C.wait(500); },
      { t: "المفتاح دخل في القفل… ولفّ. صوت حديد قديم بيتكلّم بعد عشر سنين." },
      function () { C.sfx("creak"); S.open.toys = true; PL.save(); H.map.rebuild(); C.burst("dust", [22, 226], 14); return C.wait(900); },
      function () { C.emote("me", "!"); return C.wait(400); },
      { who: "shawky", name: "عم شوقي", t: "مين؟! مين بيفتح الدكان؟!" },
      function () { C.spawn("shawky", "shawky", 53, 241, 0); C.sfx("door"); return C.walk("shawky", 46, 252, { face: 2 }); },
      function () { return C.cam({ on: [36, 246], zoom: 1.9, ms: 700 }); },
      { who: "me", t: "{لقيت|لقيت} المفتاح ده في الملعب يا عم شوقي… عليه حصان خشب وحرف «ش»." },
      function () { C.emote("shawky", "!"); return C.wait(700); },
      { who: "shawky", name: "عم شوقي", t: "الحصان ده أنا اللي حفرته لحفيدي… وهو اللي ضيّع المفتاح وهو بيلعب، من عشر سنين." },
      { who: "shawky", name: "عم شوقي", t: "من ساعتها والدكان مقفول. إيدي بقت ترتعش، والعيال كبروا، وقلت: خلاص." },
      { who: "shawky", name: "عم شوقي", t: "بس العيد بعد كام يوم… وفي تلات عيال في الحارة مش هيبقى معاهم لعبة عيد. {ادخل|ادخلي}، عايزك." },
      function () { return C.fade(1, 600); },
      function () { return C.go("toys", [100, 172, 1], { keepDark: true }); },
      function () { C.spawn("shawky", "shawky", 120, 120, 2); C.cam({ on: [100, 120], zoom: 1.4, ms: 0 }); return C.fade(0, 800); },
      { who: "shawky", name: "عم شوقي", t: "التراب ده أنا مسامحه… بس اللعب دي لأ. كل واحدة فيها مستنية عيل." },
      function () { return mend(); }
    ]);
  };
  // at the bench: he tells you what's wrong, you fix it
  function mend() {
    var C = H.map.cut, steps = [];
    steps.push(function () { C.walk("me", 96, 134, { face: 1 }); return C.cam({ on: [104, 104], zoom: 2.1, ms: 900 }); });
    TOYS.forEach(function (t, i) {
      var pick = 0;
      steps.push({ who: "shawky", name: "عم شوقي", t: t.ask, opts: t.opts, pick: function (k) { pick = k; } });
      steps.push(function () {
        var wrongs = t.opts.map(function (o, k) { return k; }).filter(function (k) { return k !== t.right; });
        var line = pick === t.right ? (i === 0 ? "صح! عينك حلوة." : i === 1 ? "برافو! {إنت|إنتي} كده صنايعي." : "الله ينور! زرار زي أختها بالظبط.") : t.wrong[wrongs.indexOf(pick)];
        return C.say({ who: "shawky", name: "عم شوقي", t: line });
      });
      steps.push(function () { C.sfx("knock"); setTimeout(function () { C.sfx("knock"); }, 260); S.q["toy_" + t.id] = "fixed"; PL.save(); C.burst("twinkle", [80 + i * 18, 96], 8); return C.wait(700); });
      steps.push({ t: t.done });
    });
    steps.push({ who: "shawky", name: "عم شوقي", t: "تلات لعب لتلات عيال: الحصان لمريم، والطبلة لآدم، والعروسة لحودة… لأخته الصغيرة." });
    steps.push({ who: "shawky", name: "عم شوقي", t: "{ودّيهم|ودّيهم} {إنت|إنتي}. أنا عايز أشوف وشوشهم من البلكونة." });
    steps.push(function () { S.q.toys = "mended"; PL.save(); if (H.audio) H.audio.fx("musicbox"); PL.banner("🎁 تلات لعب جاهزة", "{ودّي|ودّي} كل لعبة لصاحبها في الحارة", "deed"); });
    return PL.play(steps);
  }
  PL.quests.push(function () {
    if (S.keys.toys && !S.open.toys) return { icon: "🔑", t: "{جرّب|جرّبي} مفتاح الحصان الخشب في الدكان المقفول اللي في الساحة", go: "toys" };
    if (S.q.toys === "mended") return TOYS.filter(function (t) { return !given(t.id); }).map(function (t) { return { icon: "🎁", t: "{ودّي|ودّي} " + (t.id === "horse" ? "الحصان" : t.id === "drum" ? "الطبلة" : "العروسة") + " لـ" + t.name + " (" + t.where + ")" }; });
    if (S.q.toys === "done") return { icon: "🎁", t: "التلات لعب وصلوا لأصحابهم", done: true };
    return null;
  });
  // Eid, and the key never found: the three of them at the dusty window
  PL.onStart.push(function (d) {
    if (d >= 30 && !S.open.toys && !S.told.toysEid) { S.told.toysEid = 1; return ["دكان عم شوقي", "يوم العيد… وتلات عيال واقفين قدام الإزاز المترب بتاع الدكان. المفتاح ما اتلقاش السنة دي."]; }
    return null;
  });

  /* ================= inside the shop ================= */
  PROPS.toyShelves = function () {
    return sprite(70, 46, function (P) {
      var R = rng(3);
      P.r(0, 0, 70, 46, WOOD[3]); P.r(2, 2, 66, 42, "#4A3028");
      for (var j = 0; j < 3; j++) {
        var y = 4 + j * 14; P.r(2, y + 12, 66, 2, WOOD[1]);
        for (var i = 0; i < 6; i++) {
          var x = 5 + i * 11, k = (i + j * 2) % 6, c = GLASS[(i + j) % 6];
          if (k === 0) { P.r(x, y + 5, 7, 4, c); P.r(x + 5, y + 2, 2, 4, c); P.el(x, y + 9, 3, 3, "#3A3440"); P.el(x + 4, y + 9, 3, 3, "#3A3440"); }
          else if (k === 1) { P.r(x + 1, y + 2, 6, 9, c); P.r(x + 2, y + 1, 4, 1, BRASS[0]); P.r(x + 2, y + 3, 1, 7, "#FFF0B0"); }
          else if (k === 2) { P.el(x, y + 4, 8, 8, c); P.r(x, y + 7, 8, 1, "#F4EFE4"); }
          else if (k === 3) { P.r(x + 2, y + 2, 4, 3, "#F4CDA6"); P.r(x + 1, y + 5, 6, 6, c); P.r(x + 2, y + 1, 4, 1, "#5A3524"); }
          else if (k === 4) { P.el(x, y + 5, 8, 6, "#C8963E"); P.r(x, y + 5, 8, 1, "#F4EFE4"); }
          else { P.r(x + 1, y + 6, 7, 4, c); P.r(x + 2, y + 3, 4, 3, lt(c, 0.4)); P.el(x + 1, y + 9, 2, 2, "#3A3440"); P.el(x + 6, y + 9, 2, 2, "#3A3440"); }
        }
      }
    }, null);
  };
  PROPS.rockingHorse = function () {
    return sprite(30, 26, function (P) {
      P.el(0, 20, 30, 6, WOOD[2]); P.el(2, 20, 26, 3, "rgba(0,0,0,0)");
      P.r(6, 8, 16, 7, "#E8DCC0"); P.r(6, 8, 16, 1, "#FFFFFF"); P.r(18, 2, 5, 8, "#E8DCC0"); P.r(21, 0, 4, 5, "#E8DCC0"); P.p(23, 2, "#2A1A24");
      P.r(17, 1, 2, 7, "#C8443A"); P.r(3, 8, 3, 6, "#C8443A");
      P.r(8, 15, 2, 7, WOOD[1]); P.r(18, 15, 2, 7, WOOD[1]);
      P.r(9, 8, 8, 3, "#2F6A8A"); P.r(9, 8, 8, 1, "#F2C14A");
    }, [2, 22, 26, 4, 0.22]);
  };
  PROPS.toyBench = function () {
    return sprite(56, 22, function (P) {
      P.r(1, 6, 54, 5, WOOD[0]); P.r(1, 6, 54, 1, WOOD[1]); P.r(3, 11, 3, 10, WOOD[2]); P.r(50, 11, 3, 10, WOOD[2]);
      P.r(4, 3, 8, 3, "#8A8E94"); P.r(44, 4, 6, 2, WOOD[2]); P.r(48, 2, 2, 3, "#6A6E74"); // tools
    }, [0, 18, 56, 4, 0.2]);
  };
  PROPS.counterToys = function () {
    return sprite(40, 20, function (P) {
      P.r(1, 6, 38, 13, "#8A5435"); P.r(1, 6, 38, 2, "#BA8155"); P.r(4, 10, 32, 6, "#6A3E27");
      P.r(6, 1, 9, 6, "#C8963E"); P.r(6, 1, 9, 1, "#F2C76C"); P.r(9, 3, 3, 2, "#5A3A20"); // the music box
      P.r(26, 3, 8, 4, "#F4EFE4"); P.r(27, 4, 6, 1, "#5A5A6A"); // the old ledger
    }, [0, 16, 40, 4, 0.2]);
  };
  WD.LOOK.musicbox = [{ t: "صندوق موسيقى نحاس. {لفّيت|لفّيتي} المفتاح… ولحن صغير طلع منه، زي ما يكون بيفتكر." }];
  WD.LOOK.toyhorse = [{ t: "حصان هزاز أبيض. عم شوقي بيقول: «كل عيل في الحارة دي ركبه مرة… حتى أبوك.»" }];
  WD.LOOK.toyshelves = [{ t: "رفوف مليانة لعب خشب وصفيح: فوانيس، وطبل، وعرايس، وعربيات. كل واحدة عليها ورقة صغيرة: اسم العيل اللي كانت هتروحله." }];
  WD.ACTS = WD.ACTS || {};
  WD.ACTS.musicbox = function () { if (H.audio) H.audio.fx("musicbox"); return false; };

  function makeShop() {
    var s = K.shell(TW, TH, WALL, {
      cap: "#3A2420", seed: 18,
      floor: function (P, R) { K.checker(P, 0, WALL, TW, TH - WALL, "#C8B48A", "#B8A078", 10); P.dots(0, WALL, TW, TH - WALL, ["#A89068", "#D8C49A"], 300, R); },
      wall: function (P, R) {
        K.plaster(P, 0, 0, TW, WALL, "#D8C4A0", R);
        P.r(0, WALL - 12, TW, 12, "#8A5A3A"); P.r(0, WALL - 12, TW, 1, "#A87048");
        // kites and paper lanterns on the wall, a calendar from ten years ago
        [[150, 8, "#E8503F"], [172, 14, "#4F97E8"]].forEach(function (k) { for (var r = 0; r < 11; r++) { var hw = r < 5 ? r : 10 - r; P.r(k[0] - hw, k[1] + r, hw * 2 + 1, 1, k[2]); } P.r(k[0], k[1] + 11, 1, 10, "#E8E2D6"); });
        P.r(124, 10, 14, 16, "#F4EFE4"); P.r(124, 10, 14, 4, "#C8302C"); P.r(126, 16, 10, 1, "#8A8478"); P.r(126, 19, 8, 1, "#8A8478");
      }
    });
    return {
      id: "toys", name: "دكان عم شوقي", sub: "كل لعبة فيه مستنية عيل", W: TW, HGT: TH, ground: s.c, bed: "toyshop", wall: WALL, suhoor: true,
      amb: { asr: [250, 236, 214], pre: [252, 222, 196], maghrib: [200, 170, 170], night: [176, 150, 160], suhoor: [170, 146, 158] },
      props: [
        { k: "toyShelves", x: 8, y: 62, noblock: true, look: "toyshelves" },
        { k: "toyShelves", x: 80, y: 62, noblock: true, look: "toyshelves" },
        { k: "toyBench", x: 72, y: 118, block: [56, 6] },
        { k: "rockingHorse", x: 150, y: 120, block: [26, 5], look: "toyhorse" },
        { k: "counterToys", x: 22, y: 150, block: [40, 5], look: "musicbox" },
        { k: "crate", x: 160, y: 160, block: [16, 4] }
      ],
      fixtures: [
        { layer: "sort", y: 118.5, draw: function (R) { // the three toys standing on the bench, broken or mended
          var top = 107; // the bench top
          if (!given("horse")) { R.img(toyImg.toyHorse, 80, top - 11); if (!fixed("horse")) R.rect(88, top - 3, 3, 3, "#BA8155"); }
          if (!given("drum")) { R.img(toyImg.toyDrum, 98, top - 10); if (!fixed("drum")) { R.rect(100, top - 9, 6, 1, "#8A6A48"); R.rect(103, top - 8, 1, 1, "#8A6A48"); } }
          if (!given("doll")) { R.img(toyImg.toyDoll, 114, top - 13); if (!fixed("doll")) R.rect(119, top - 10, 1, 1, "#F4CDA6"); }
        } },
        { layer: "wall", draw: function (R) { // a shaft of light through the shop window, dust turning in it
          R.alpha(0.12); for (var k = 0; k < 20; k++) R.rect(40 + k * 2, WALL + k * 4, 22, 4, "#FFF4D0"); R.alpha(1);
          for (var d = 0; d < 8; d++) { var u = (R.T * 0.04 + d * 0.13) % 1; R.rect(Math.round(46 + u * 40 + Math.sin(R.T + d) * 4), Math.round(WALL + u * 80), 1, 1, "#FFF4D0"); }
        } }
      ],
      strings: [{ k: "lanterns", x0: 6, y0: 10, x1: TW - 6, y1: 12, sag: 10 }],
      walk: [[8, WALL + 2, TW - 16, TH - WALL - 10], [88, TH - 12, 24, 6]],
      lights: [{ x: 60, y: 110, r: 60, c: [255, 230, 180], when: "always", g: 0.4 }, { x: 100, y: 100, r: 34, c: [255, 210, 140], when: "on", g: 0.7 }],
      wins: [],
      exits: [{ r: [88, TH - 16, 24, 14], to: "hara", spot: "toys" }],
      spawn: { hara: [100, 172, 1] },
      people: function (time) {
        if (!S.q.toys) return [];
        return [{ id: "shawky", cast: "shawky", name: "عم شوقي", at: [100, 126, 0], talk: [100, 140], say: [
          { t: S.q.toys === "done" ? "«شفتهم من البلكونة… مريم بتجري ورا الحصان، وآدم بيطبّل للحارة كلها. الدكان ده رجع يعيش.»" : "«{ودّي|ودّي} اللعب لأصحابها… أنا مستني أشوف وشوشهم.»" },
          { t: "«كل لعبة على الرف ده عليها اسم عيل. شوية منهم بقوا آباء دلوقتي… وجايين يشتروا لعيالهم.»" }] }];
      }
    };
  }
  H.rooms.add("toys", makeShop, null);
})();
