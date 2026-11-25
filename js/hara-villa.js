/* فوانيس الحارة · بيت الأستاذ نبيل: the house by the café (walk.html).
   Nabil is a quiet man in a faded galabeya who buys one loaf a day. The café says he's mean; nobody has been inside.
   From day 6 he drops his keys by the bakery in the afternoon. Pick them up, ask Hassan whose they are, take them back:
   he lets you in, and behind the plain lilac front there's a house from another world: a pool, a beach of real sand
   with palm trees, a wall painted as the sea that moves, an aquarium, a television the size of a wall. He made money
   abroad, came home, and wouldn't leave the hara, so he brought the sea to it. Four letters lie about the house; read
   them and you learn what nobody knows: the mercy table every Ramadan and the hung bread at Hassan's are his, paid in
   secret for twenty years. He asks you to keep it. You do; afterwards you catch him at the mercy table, a guest like
   everyone else, and he winks. */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var A = H.pix, WD = H.world, PL = H.places;
  if (!A || !WD || !H.rooms || !PL) return;
  var S = PL.S, ar = PL.ar, sprite = A.sprite, PROPS = A.PROPS, dk = A.dk, lt = A.lt, mix = A.mix, rng = A.rng, SK = A.SKIN, WOOD = A.WOOD, BRASS = A.BRASS;
  var K = H.rooms.kit;
  var VW = 260, VH = 214, WALL = 62;
  var FROM = PL.OPEN.villa;
  function dark(t) { return t === "night" || t === "suhoor"; }
  function day() { return H.map && H.map.day ? H.map.day() : 1; }

  WD.CAST.nabil = { build: "thin", skin: SK.tan, hair: { style: "grey", c: "#B8B2AA" }, top: { kind: "robe", c: "#8A7A5A" }, glasses: true, mus: "#B8B2AA", shoes: "#4A3328" };

  /* ================= in the hara ================= */
  // the afternoon: from his door to Hassan's for one loaf, and home again
  WD.EXTRAS.push(
    { id: "nabil", cast: "nabil", name: "الأستاذ نبيل", at: [505, 470, 0], times: ["asr", "pre"], days: { from: FROM }, if: function () { return S.q.villa !== "found" && S.q.villa !== "told"; }, loop: [[505, 470, 0], [300, 532, 1], [505, 470, 1]], pause: [3, 6], speed: 0.38,
      say: function () { return S.q.villa === "secret" ? ["«الحمد لله… رغيف واحد بيكفّي. والباقي ربنا بيدبّره.»", "«{إنت|إنتي} فاكر السر؟ … أنا عارف إنك فاكره.»"] : ["«مساء الخير.»", "«رمضان كريم يا {ابني|بنتي}.»", "«الرغيف ده كفاية عليا… الحمد لله.»"]; } },
    // at sunset he stands a little apart from the mercy tables, watching; once you know, he's a guest like anyone
    { id: "nabilT", cast: "nabil", name: "الأستاذ نبيل", at: [124, 344, 1], times: ["maghrib"], days: { from: FROM },
      say: function () { return S.q.villa === "secret" ? ["«{بص|بصي} الناس بتاكل إزاي… ده أحلى من أي بحر.»", "«شش… محدش يعرف. {اقعد|اقعدي} {افطر|افطري} معانا.»"] : ["«أنا بس بتفرّج… المائدة دي حلوة قوي السنة دي، صح؟»"]; } }
  );
  // the café has opinions
  var GOSSIP = "«{شايف|شايفة} البيت البنفسجي ده؟ صاحبه الأستاذ نبيل عمره ما قعد معانا ولا شرب شاي. بس كل سنة لما المائدة تتفرش… بلاقيه واقف من بعيد بيبص.»";
  WD.EXTRAS.forEach(function (x) { // only once Nabil is out and about (day 6 on)
    if (x.cast !== "maalem" || !Array.isArray(x.say)) return;
    var base = x.say.slice();
    x.say = function (d) { return d >= FROM ? base.concat([GOSSIP]) : base; };
  });

  // the keys he drops on the way back from the bakery
  var ringImg = sprite(11, 9, function (P) {
    P.el(0, 0, 6, 6, BRASS[2]); P.el(1, 1, 4, 4, "rgba(0,0,0,0)"); P.r(1, 1, 4, 4, "rgba(0,0,0,0)");
    P.r(4, 3, 6, 1, "#C9CDD3"); P.r(8, 4, 1, 2, "#C9CDD3"); P.r(3, 5, 5, 1, BRASS[0]); P.r(6, 6, 1, 2, BRASS[0]);
    P.el(1, 5, 5, 3, BRASS[1]); P.p(5, 6, BRASS[1]); P.p(2, 6, "#3A2A20"); // a little brass fish
  });
  WD.PICKUPS.push({
    id: "nabil-keys", x: 336, y: 532, img: ringImg,
    ok: function (d, t) { return d >= FROM && !S.q.villa && (t === "asr" || t === "pre"); },
    pick: function () {
      S.q.villa = "found"; PL.save();
      PL.scene([
        "ميدالية فيها تلات مفاتيح، ومعلّق فيها سمكة نحاس صغيرة. على السمكة حرفين محفورين: «ن. ع».",
        { who: "me", t: "حد وقّعها وهو ماشي… مين «ن. ع»؟ عم حسن بيعرف كل اللي بيعدّوا على الفرن." }
      ]);
    }
  });
  PL.talk.push(function (a) {
    if (a.cast !== "hassan" || S.q.villa !== "found") return false;
    S.q.villa = "told"; PL.save();
    PL.scene([
      function (C) { return C.cam({ on: "hassan", zoom: 1.7, ms: 600 }); },
      { who: "me", t: "يا عم حسن… {لقيت|لقيت} الميدالية دي قدام الفرن. عليها «ن. ع»." },
      { who: "hassan", t: "«ن. ع»؟ دي ميدالية الأستاذ نبيل عبد العظيم! لسه واخد رغيفه ومشي." },
      { who: "hassan", t: "ساكن في البيت البنفسجي اللي جنب القهوة. راجل في حاله… بيشتري رغيف واحد بس كل يوم." },
      { who: "hassan", t: "بس تعرف الغريبة؟ مرة في السنة بييجي يسألني: «العيش المعلّق مكفّي الناس؟»… ويمشي." }
    ]);
    return true;
  });
  PL.quests.push(function (d) {
    if (d < FROM) return null;
    if (S.q.villa === "found") return { icon: "🗝️", t: "مين صاحب الميدالية؟ {اسأل|اسألي} عم حسن في الفرن", go: "bakery" };
    if (S.q.villa === "told") return { icon: "🗝️", t: "{رجّع|رجّعي} الميدالية للأستاذ نبيل، البيت البنفسجي جنب القهوة", go: "villa" };
    if (S.q.villa === "inside" || S.q.villa === "read") { var n = Object.keys(S.letters).length; return { icon: "✉️", t: "جوابات في بيت الأستاذ نبيل: " + ar(n) + " من ٤", done: n >= 4 }; }
    return null;
  });

  // at his door: he opens, he hesitates, he lets you in
  PL.returnKeys = function () {
    var C = H.map.cut;
    PL.scene([
      function () { C.sfx("knock"); return C.wait(500); },
      function () { C.sfx("knock"); return C.wait(900); },
      function () { C.sfx("door"); return C.wait(900); },
      function () { return C.stage("nabil", "nabil", 505, 462, 0, null, true); },
      function () { C.face("me", 1); C.emote("nabil", "?"); return C.cam({ on: [505, 450], zoom: 1.8, ms: 700 }); },
      { who: "nabil", name: "الأستاذ نبيل", t: "أيوه؟" },
      { who: "me", t: "{لقيت|لقيت} مفاتيحك قدام الفرن يا أستاذ نبيل." },
      function () { C.emote("nabil", "!"); return C.wait(600); },
      { who: "nabil", name: "الأستاذ نبيل", t: "يا خبر… أنا كنت فاكرها في جيبي! تسلم إيدك." },
      { who: "nabil", name: "الأستاذ نبيل", t: "{إنت|إنتي} أول حد في الحارة يخبّط على الباب ده من غير ما يسأل: «هو جوّه فيه إيه؟»" },
      function () { return C.wait(700); },
      { who: "nabil", name: "الأستاذ نبيل", t: "{تعالى|تعالي}. بس اللي هتشوفه… يفضل بيني وبينك." },
      function () { return C.fade(1, 700); },
      function () { S.open.villa = true; S.q.villa = "inside"; PL.save(); return C.go("villa", [130, 198, 1], { keepDark: true }); },
      function () { C.spawn("nabil", "nabil", 146, 194, 2); C.cam({ on: [130, 180], zoom: 2, ms: 0 }); return C.fade(0, 800); },
      function () { return C.wait(400); },
      function () { C.emote("me", "!"); C.jump("me"); return C.cam({ on: [130, 128], zoom: 1.05, ms: 2600 }); },
      function () { C.sfx("wave"); return C.wait(700); },
      { who: "me", t: "ده… ده بحر؟ جوّه الحارة؟!" },
      { who: "nabil", name: "الأستاذ نبيل", t: "اتولدت في الحارة دي. أبويا كان شيّال في السوق، وأمي كانت بتخبز للجيران." },
      { who: "nabil", name: "الأستاذ نبيل", t: "سافرت عشرين سنة، واشتغلت ليل ونهار، وربنا كرمني. ورجعت." },
      { who: "nabil", name: "الأستاذ نبيل", t: "الكل قالي: «{اشتري|اشتري} فيلا على البحر، في كمبوند، {عيش|عيش} زي الناس.»" },
      { who: "nabil", name: "الأستاذ نبيل", t: "بس أنا ما بعرفش أنام غير على صوت الحارة: طبلة المسحراتي، وكورة العيال، والأدان من الجامع اللي قدامي." },
      function () { C.emote("nabil", "♥"); return C.wait(500); },
      { who: "nabil", name: "الأستاذ نبيل", t: "فقلت: لو أنا مش هروح للبحر… البحر ييجي لحد عندي." },
      { who: "nabil", name: "الأستاذ نبيل", t: "{اتفرّج|اتفرّجي} براحتك. {اقعد|اقعدي} على الرملة، {حط|حطي} رجلك في المية. البيت ده عمره ما جاله ضيوف." },
      function () { PL.banner("✦ بيت الأستاذ نبيل", "{اتفرّج|اتفرّجي} براحتك… وفي البيت جوابات مستخبية", "deed"); }
    ]);
  };

  /* ================= the house inside ================= */
  // the letters: on his desk, under the deck chair, on the fridge, in a book by the pool
  var letterImg = sprite(10, 8, function (P) { P.r(0, 1, 10, 7, "#F4EFE4"); P.r(0, 1, 10, 1, "#FFFFFF"); P.line(0, 1, 5, 5, "#C8C0B0"); P.line(9, 1, 5, 5, "#C8C0B0"); P.p(5, 5, "#C8302C"); });
  var LETTERS = [
    { id: "committee", at: [44, 120], from: "من لجنة مائدة الرحمن", t: "إلى فاعل الخير… وصلنا المبلغ زي كل سنة. المائدة هتكفّي ميتين صايم كل يوم لحد آخر رمضان. الناس بتدعي لـ«فاعل الخير» من غير ما يعرفوا اسمه. نفسنا نعرف اسمك عشان ندعيلك بيه… بس هنحترم طلبك. — الشيخ عبد الله" },
    { id: "bakery", at: [222, 112], from: "فاتورة من فرن عم حسن", t: "فاتورة: ٣٠٠ رغيف معلّق في الشهر · مدفوعة. وتحتها بخط عم حسن: «يا أستاذ نبيل، اللوحة اتملت. ربنا يباركلك. محدش يعرف، زي ما طلبت»." },
    { id: "company", at: [100, 92], from: "جواب من شركة عقارات", t: "عرض خاص لحضرتك: فيلا على البحر في كمبوند هادي بعيد عن الزحمة. وعلى الجواب، بخط إيد الأستاذ نبيل، كلمة واحدة بقلم أحمر: «لأ.»" },
    { id: "mother", at: [178, 186], from: "جواب قديم، ورقه أصفر", t: "يا نبيل يا ابني، لو ربنا فتحها عليك، ما تنساش الحارة اللي ربّتك. كل رغيف أكلته وانت صغير جه من إيد حد فيها. وعيش بيهم ولهم… — أمك" }
  ];
  var pickups = LETTERS.map(function (L) {
    return { id: "letter-" + L.id, x: L.at[0], y: L.at[1], img: letterImg, bob: true,
      ok: function () { return S.q.villa && S.q.villa !== "told" && !S.letters[L.id]; },
      pick: function () {
        S.letters[L.id] = 1; PL.save();
        var n = Object.keys(S.letters).length;
        PL.scene([function () { return H.map.talk({ name: "✉️ " + L.from, text: H.map.fmt(L.t), secret: true }); }, function () { if (n >= 4 && S.q.villa !== "secret") return theSecret(); PL.banner("✉️ جواب " + ar(n) + " من ٤", "في البيت جوابات تانية…", "deed"); }]);
      } };
  });
  // all four read: he finds you with the last one in your hand
  function theSecret() {
    var C = H.map.cut, why = false;
    S.q.villa = "read"; PL.save();
    return Promise.resolve()
      .then(function () { var me = H.map.me(), to = [Math.min(240, me.x + 18), me.y + 4]; if (!C.actor("nabil")) C.spawn("nabil", "nabil", 159, 104, 0); C.sfx("door"); return C.walk("nabil", to[0], to[1], { face: 2 }); })
      .then(function () { C.face("me", 3); return C.cam({ on: "me", zoom: 1.8, ms: 600 }); })
      .then(function () { return PL.play([
        { who: "nabil", name: "الأستاذ نبيل", t: "{قريت|قريتي} الجوابات." },
        { who: "me", t: "إنت «فاعل الخير»؟ المائدة اللي في الساحة… والعيش المعلّق عند عم حسن… كل ده إنت؟" },
        { who: "nabil", name: "الأستاذ نبيل", t: "مش أنا. ده رزق ربنا، وأنا بس بوصّله لصحابه." },
        { who: "nabil", name: "الأستاذ نبيل", t: "أمي كانت بتقول: الصدقة اللي في السر بتفضل بينك وبين ربنا. ولو الناس عرفت، هيقعدوا على المائدة مكسوفين." },
        { who: "nabil", name: "الأستاذ نبيل", t: "{تقدر|تقدري} تشيل السر ده معايا؟", opts: ["سرّك في بير يا أستاذ نبيل", "ليه ما تقولش للناس؟"], pick: function (i) { why = i === 1; } },
        function () { if (!why) return null; return PL.play([
          { who: "nabil", name: "الأستاذ نبيل", t: "عشان الحاج سليمان لما يقعد على المائدة، يقعد وهو رافع راسه. وعشان أم سمير لما تاخد العيش المعلّق، ما تحسش إنها مديونة لحد." },
          { who: "me", t: "…فهمت. سرّك في بير." }
        ]); },
        function () { C.emote("nabil", "♥"); C.burst("twinkle", "nabil", 10); return C.wait(600); },
        { who: "nabil", name: "الأستاذ نبيل", t: "{تعالى|تعالي} البيت ده وقت ما {تحب|تحبي}. ده بقى بيتك {إنت|إنتي} كمان." },
        function () { S.q.villa = "secret"; PL.save(); PL.banner("✦ سر الأستاذ نبيل", "فاعل الخير ساكن جنب القهوة… وإنت الوحيد اللي يعرف", "deed"); if (H.audio) H.audio.chime(); }
      ]); });
  }

  // the furniture of another world
  PROPS.deckChair = function () {
    return sprite(30, 16, function (P) {
      P.r(2, 6, 24, 5, "#F4EFE4"); for (var x = 2; x < 26; x += 4) P.r(x, 6, 2, 5, "#4F97E8");
      P.line(22, 6, 28, 0, "#F4EFE4"); P.line(23, 7, 29, 1, "#4F97E8"); P.r(24, 1, 5, 5, "#F4EFE4");
      P.r(3, 11, 1, 4, "#C8C8D0"); P.r(24, 11, 1, 4, "#C8C8D0");
      P.r(5, 5, 6, 2, "#F2C14A"); // a towel
    }, [0, 12, 30, 4, 0.2]);
  };
  PROPS.parasol = function () {
    return sprite(34, 44, function (P) {
      P.r(16, 10, 2, 34, "#E8E2D6");
      for (var y = 0; y < 10; y++) { var hw = Math.round(4 + y * 1.3); for (var x = -hw; x <= hw; x++) P.p(17 + x, y, ((x + 40) / 4 | 0) % 2 ? "#E8503F" : "#F4EFE4"); }
      for (var e = 4; e < 31; e += 4) P.r(e, 10, 2, 2, "#E8503F");
    }, null);
  };
  PROPS.sofaWhite = function () {
    return sprite(60, 26, function (P) {
      P.r(2, 4, 56, 12, "#E8E6E0"); P.r(2, 4, 56, 2, "#FFFFFF"); P.r(2, 14, 56, 8, "#D8D6D0"); P.r(0, 6, 4, 16, "#C8C6C0"); P.r(56, 6, 4, 16, "#C8C6C0");
      [[8, "#4F97E8"], [22, "#F2C14A"], [40, "#2F8A86"]].forEach(function (c) { P.r(c[0], 6, 9, 7, c[1]); P.r(c[0], 6, 9, 1, lt(c[1], 0.3)); });
      P.r(4, 22, 2, 3, "#8A8E94"); P.r(54, 22, 2, 3, "#8A8E94");
    }, [0, 22, 60, 4, 0.22]);
  };
  PROPS.glassTable = function () {
    return sprite(30, 12, function (P) { P.r(1, 2, 28, 4, "rgba(170,220,240,0.7)"); P.r(1, 2, 28, 1, "#FFFFFF"); P.r(4, 6, 1, 5, "#C9CDD3"); P.r(25, 6, 1, 5, "#C9CDD3"); P.r(10, 0, 4, 3, "#F2C14A"); P.p(20, 1, "#4CBF73"); P.p(21, 0, "#4CBF73"); }, [0, 8, 30, 4, 0.2]);
  };
  PROPS.palmPot = function () {
    return sprite(24, 40, function (P) {
      P.r(8, 32, 8, 8, "#E8E6E0"); P.r(8, 32, 8, 1, "#FFFFFF");
      P.r(11, 14, 2, 18, "#8A6A48"); for (var y = 16; y < 32; y += 3) P.r(10, y, 4, 1, "#6A4A30");
      [[-10, -3], [10, -3], [-8, 3], [8, 3], [0, -6]].forEach(function (d) { P.line(12, 14, 12 + d[0], 14 + d[1], "#3F8F4F"); P.line(12, 15, 12 + d[0], 15 + d[1] + 1, "#4CBF73"); });
    }, [4, 36, 16, 4, 0.2]);
  };
  PROPS.bigFridge = function () {
    return sprite(22, 40, function (P) { P.r(1, 1, 20, 37, "#D8DCE0"); P.r(1, 1, 20, 1, "#FFFFFF"); P.r(10, 1, 1, 37, "#A8ACB0"); P.r(8, 12, 1, 8, "#8A8E94"); P.r(12, 12, 1, 8, "#8A8E94"); P.r(3, 5, 4, 3, "#4CBF73"); }, [0, 36, 22, 4, 0.22]);
  };
  PROPS.desk = function () {
    return sprite(34, 24, function (P) {
      P.r(1, 8, 32, 4, WOOD[0]); P.r(1, 8, 32, 1, WOOD[1]); P.r(2, 12, 4, 11, WOOD[2]); P.r(28, 12, 4, 11, WOOD[2]);
      P.r(4, 2, 12, 7, "#3A3440"); P.r(5, 3, 10, 5, "#5A8AC8"); P.r(9, 9, 2, 1, "#3A3440"); // a computer
      P.r(20, 4, 3, 5, "#C8963E"); P.el(19, 2, 5, 3, "#F2C76C"); // a brass lamp
      P.r(25, 6, 6, 2, "#F4EFE4"); // papers
    }, [0, 20, 34, 4, 0.2]);
  };
  PROPS.oldBench = function () { // by the door: the wooden bench from his mother's house, his old slippers under it
    return sprite(28, 14, function (P) { P.r(1, 3, 26, 4, WOOD[1]); P.r(1, 3, 26, 1, WOOD[0]); P.r(2, 7, 2, 6, WOOD[3]); P.r(24, 7, 2, 6, WOOD[3]); P.el(8, 10, 5, 3, "#6A4A30"); P.el(14, 10, 5, 3, "#6A4A30"); }, [0, 10, 28, 4, 0.2]);
  };
  WD.LOOK.v_pool = [{ t: "مية زرقا صافية، والنور بيرقص على القاع. ريحة كلور… جوّه حارة!" }];
  WD.LOOK.v_tv = [{ t: "تلفزيون قد الحيطة. شغال على قناة القرآن… والصوت واطي." }];
  WD.LOOK.v_tank = [{ t: "حوض سمك قد الحيطة: سمك أحمر ودهبي وأزرق، وشعب مرجانية. ورا الإزاز، فقاقيع بتطلع لفوق." }];
  WD.LOOK.v_fridge = [{ t: "تلاجة قد الدولاب، فاضية تقريبًا. جواها رغيف واحد ملفوف في فوطة." }];
  WD.LOOK.v_desk = [{ t: "مكتب عليه كمبيوتر وأوراق كتير، ولمبة نحاس قديمة… ده نفس الفانوس اللي كان في البيت زمان." }];
  WD.LOOK.v_bench = [{ t: "دكة خشب قديمة، وتحتها شبشب بلاستيك. الحاجة الوحيدة في البيت شكلها من الحارة… ومن هنا بيخرج كل يوم." }];
  WD.LOOK.v_photo = [{ t: "صورة قديمة بالأبيض والأسود: الحارة سنة ١٩٨٥، وعيل صغير لابس جلابية واقف جنب ست بتخبز. تحت الصورة بخط إيد: «ماما»." }];
  WD.ACTS = WD.ACTS || {};
  WD.ACTS.v_sand = function () {
    var C = H.map.cut;
    PL.scene([function () { C.walk("me", 214, 142, { face: 0 }); return C.wait(900); }, function () { C.pose("me", "sit"); C.sfx("wave"); return C.cam({ on: "me", zoom: 1.6, ms: 700 }); }, function () { return C.wait(1600); },
      "الرملة سخنة كأنها شمس بجد… بس دي لمبات في السقف. والموج المرسوم على الحيطة بيتحرك، وصوته جاي من سماعات مستخبية في الزرع.",
      function () { C.pose("me", null); }]);
    return true;
  };
  WD.ACTS.v_feet = function () {
    var C = H.map.cut;
    PL.scene([function () { C.walk("me", 124, 160, { face: 1 }); return C.wait(800); }, function () { C.pose("me", "sit"); C.sfx("splash"); C.burst("dust", [124, 150], 6); return C.cam({ on: "me", zoom: 1.6, ms: 700 }); }, function () { return C.wait(1400); },
      "{حطيت|حطيتي} رجلك في المية. ساقعة وحلوة. والحارة كلها برا الحيطة… بتسمع صوت الكورة من الملعب.",
      function () { C.pose("me", null); }]);
    return true;
  };

  var FISH = [["#E8503F", 1.1, 0], ["#F2C14A", 0.8, 2], ["#4F97E8", 1.3, 4], ["#FF8F3F", 0.9, 1], ["#F4EFE4", 1.6, 3]];
  function makeVilla() {
    var s = K.shell(VW, VH, WALL, {
      cap: "#3A3A48", seed: 31,
      floor: function (P, R) {
        // white marble in big squares, veined
        P.r(0, WALL, VW, VH - WALL, "#E8E6E2");
        for (var y = WALL; y < VH; y += 16) for (var x = 0; x < VW; x += 16) { P.r(x, y, 16, 16, ((x + y) / 16) % 2 ? "#ECEAE6" : "#E2E0DC"); P.r(x, y, 16, 1, "#D0CEC8"); P.r(x, y, 1, 16, "#D8D6D0"); }
        for (var v = 0; v < 30; v++) { var vx = (R() * VW) | 0, vy = WALL + ((R() * (VH - WALL)) | 0); P.line(vx, vy, vx + 6 + ((R() * 8) | 0), vy + 2 + ((R() * 4) | 0), "#C8C6C0"); }
        // the beach: real sand on the right, under the painted sea
        P.r(176, WALL, 84, 92, "#E8D2A0"); P.dots(176, WALL, 84, 92, ["#D8C090", "#F2E0B0", "#C8B080"], 900, R);
        for (var e = 0; e < 92; e += 2) P.p(176 + ((e * 7) % 5), WALL + e, "#E8E6E2");
        // the pool: tiles round a sunken rectangle
        P.r(70, 108, 100, 48, "#C8D8E0"); P.r(72, 110, 96, 44, "#2A8AC8"); P.r(72, 110, 96, 3, "#1A6AA0");
        for (var t = 72; t < 168; t += 6) P.r(t, 110, 1, 44, "rgba(255,255,255,0.08)");
        P.r(72, 150, 96, 4, "#1A6AA0");
        P.r(158, 112, 2, 14, "#C9CDD3"); P.r(164, 112, 2, 14, "#C9CDD3"); for (var l = 114; l < 126; l += 4) P.r(158, l, 8, 1, "#C9CDD3"); // the ladder
        // a rug in front of the sofa
        P.r(8, 124, 54, 30, "#3A5A8A"); P.r(10, 126, 50, 26, "#4F7AB0"); P.r(10, 126, 50, 1, "#F2C14A");
        // the old mat at the door, from the hara
        P.r(118, VH - 15, 24, 8, "#B5473B"); P.r(119, VH - 14, 22, 6, "#D9A25E");
      },
      wall: function (P, R) {
        // left: grey stone with the aquarium and the TV; right: the sea, painted to the ceiling
        P.r(0, 0, VW, WALL, "#5A5A68");
        for (var y = 6; y < WALL; y += 8) P.r(0, y, 176, 1, "#4A4A58");
        P.r(176, 0, 84, WALL, "#7EC6EC");
        P.r(4, 10, 56, 40, "#2A4A6A"); P.r(4, 10, 56, 2, "#8A8E94"); P.r(4, 48, 56, 3, "#8A8E94"); // the aquarium's frame
        P.r(68, 12, 44, 26, "#1A1A22"); P.r(70, 14, 40, 22, "#2A3A5A"); // the TV
        P.r(122, 14, 18, 22, WOOD[2]); P.r(124, 16, 14, 18, "#D8D0C0"); // the photo frame
        P.r(146, 20, 26, 26, "#4A4A58"); P.r(148, 22, 22, 22, "#3A3A48"); // a door to the kitchen
      }
    });
    return {
      id: "villa", name: "بيت الأستاذ نبيل", sub: "البحر جه لحد الحارة", W: VW, HGT: VH, ground: s.c, bed: "villa", wall: WALL, suhoor: true,
      amb: { asr: [250, 248, 244], pre: [252, 238, 222], maghrib: [220, 210, 230], night: [170, 176, 210], suhoor: [160, 166, 206] },
      props: [
        { k: "sofaWhite", x: 6, y: 120, block: [60, 8] },
        { k: "glassTable", x: 20, y: 140, block: [30, 5], look: "v_tv" },
        { k: "desk", x: 86, y: 98, block: [34, 6], look: "v_desk" },
        { k: "bigFridge", x: 148, y: 100, block: [22, 6], look: "v_fridge" },
        { k: "deckChair", x: 206, y: 118, block: [30, 5], look: "v_sand" },
        { k: "parasol", x: 196, y: 112, noblock: true, look: "v_sand" },
        { k: "palmPot", x: 236, y: 100, block: [12, 4] },
        { k: "palmPot", x: 180, y: 176, block: [12, 4] },
        { k: "palmPot", x: 234, y: 196, block: [12, 4] },
        { k: "oldBench", x: 150, y: 202, block: [28, 4], look: "v_bench" },
        { k: "blank", o: { w: 96, h: 40 }, x: 72, y: 152, block: [96, 40], look: "v_feet" },
        { k: "blank", o: { w: 54, h: 40 }, x: 4, y: 52, noblock: true, look: "v_tank" },
        { k: "blank", o: { w: 18, h: 22 }, x: 122, y: 38, noblock: true, look: "v_photo" }
      ],
      pickups: pickups,
      fixtures: [
        { layer: "wall", draw: function (R) {
          var T = R.T, i;
          // the aquarium: water, coral, fish going back and forth, bubbles
          for (i = 0; i < 38; i += 2) R.rect(6, 12 + i, 52, 2, mix("#3AA0D8", "#1A5A8A", i / 38));
          R.rect(10, 42, 8, 6, "#E8607A"); R.rect(12, 38, 3, 4, "#E8607A"); R.rect(40, 40, 10, 8, "#F2A040"); R.rect(44, 36, 2, 4, "#F2A040"); R.rect(26, 44, 6, 4, "#8AD04A");
          FISH.forEach(function (f, k) { var x = 32 + Math.sin(T * 0.5 * f[1] + f[2]) * 22, y = 18 + k * 5 + Math.sin(T * 1.3 + k) * 1.5, dir = Math.cos(T * 0.5 * f[1] + f[2]) > 0 ? 1 : -1; R.rect(Math.round(x) - 2, Math.round(y), 4, 2, f[0]); R.rect(Math.round(x) - 2 - dir * 2, Math.round(y), 1, 2, f[0]); R.rect(Math.round(x) + dir * 1, Math.round(y), 1, 1, "#1A1A22"); });
          for (i = 0; i < 5; i++) { var by = 46 - ((T * 8 + i * 9) % 34); R.rect(14 + i * 9, Math.round(by), 1, 1, "#C8F0FF"); }
          // the TV: the Quran channel, a mosque and words going by
          R.rect(70, 14, 40, 22, "#1A3A5A"); R.rect(84, 20, 12, 10, "#2A5A8A"); R.rect(88, 16, 4, 4, "#2A5A8A"); R.rect(78, 30, 24, 2, "#F2C14A"); R.rect(70 + ((T * 6) % 36), 33, 4, 1, "#FFFFFF");
          // the photo of his mother, black and white
          R.rect(126, 18, 10, 14, "#A8A098"); R.rect(129, 20, 4, 4, "#7A7068"); R.rect(128, 24, 6, 6, "#5A5048");
          // the painted sea: sky, horizon, waves coming in, a sail far off, gulls
          for (i = 0; i < 30; i++) R.rect(176, i, 84, 1, mix(R.time === "night" || R.time === "suhoor" ? "#1A2A5A" : "#7EC6EC", R.time === "night" || R.time === "suhoor" ? "#2A3A7A" : "#CFEFFA", i / 30));
          R.rect(176, 30, 84, 32, R.time === "night" || R.time === "suhoor" ? "#1A4A7A" : "#2A8AC8");
          for (i = 0; i < 6; i++) { var wy = 34 + i * 5, off = Math.round((T * (4 + i)) % 12); for (var x = 176 - 12 + off; x < 260; x += 12) R.rect(x, wy, 6, 1, i % 2 ? "#8AD0F4" : "#FFFFFF"); }
          var surf = Math.sin(T * 0.9) * 4; R.rect(176, Math.round(56 + surf), 84, 3, "#F4FAFF"); R.rect(176, Math.round(59 + surf), 84, 3, "rgba(255,255,255,0.5)");
          R.rect(Math.round(200 + Math.sin(T * 0.1) * 30), 24, 3, 5, "#F4EFE4"); R.rect(Math.round(199 + Math.sin(T * 0.1) * 30), 28, 5, 1, "#8A6A48");
          if (!(R.time === "night" || R.time === "suhoor")) for (i = 0; i < 2; i++) { var gx = Math.round(190 + ((T * 6 + i * 40) % 70)), gy = 10 + i * 6, up = Math.sin(T * 6 + i) > 0; R.rect(gx, gy, 1, 1, "#FFFFFF"); R.rect(gx - 1, gy + (up ? -1 : 1), 1, 1, "#FFFFFF"); R.rect(gx + 1, gy + (up ? -1 : 1), 1, 1, "#FFFFFF"); }
        } },
        { layer: "sort", y: 112, draw: function (R) { // light dancing on the bottom of the pool
          for (var i = 0; i < 24; i++) { var x = 74 + ((i * 37 + Math.round(R.T * 9)) % 92), y = 114 + ((i * 19) % 36), w = 2 + (i % 3); R.alpha(0.35 + 0.25 * Math.sin(R.T * 3 + i)); R.rect(x, y, w, 1, "#BFEAFF"); R.alpha(1); }
        } }
      ],
      strings: [],
      walk: [[8, WALL + 4, VW - 16, VH - WALL - 12], [118, VH - 12, 24, 6]],
      lights: [
        { x: 120, y: 132, r: 70, c: [90, 190, 255], when: "always", g: 0.5, dyn: function (T) { return [0.85 + 0.15 * Math.sin(T * 2.3), null]; } },
        { x: 32, y: 30, r: 36, c: [90, 180, 255], when: "always", g: 0.6 },
        { x: 90, y: 26, r: 30, c: [150, 200, 255], when: "always", g: 0.5, fl: 2 },
        { x: 218, y: 90, r: 70, c: [255, 236, 190], when: "always", g: 0.4 },
        { x: 104, y: 92, r: 22, c: [255, 210, 140], when: "on", g: 0.8 }
      ],
      wins: [],
      exits: [{ r: [118, VH - 16, 24, 14], to: "hara", spot: "villa" }],
      spawn: { hara: [130, 198, 1] },
      people: function (time) {
        if (S.q.villa !== "secret" && S.q.villa !== "read") return [];
        var say = [{ t: "«البيت ده بقى بيتك {إنت|إنتي} كمان. {تعالى|تعالي} وقت ما {تحب|تحبي}.»" }, { t: "«الموج اللي على الحيطة ده؟ رسمه فنان من إسكندرية. قعد شهر يرسمه، وكل يوم يقولي: «إنت متأكد إنك مش عايز تسيب الحارة؟»»" }, { t: "«على فكرة… المائدة السنة دي فيها كنافة. ما {تقولش|تقوليش} لحد إنك عارف مين.»" }];
        if (time === "asr" || time === "pre") return [{ id: "nabil", cast: "nabil", name: "الأستاذ نبيل", at: [244, 150, 2], say: say }];
        if (time === "night" || time === "suhoor") return [{ id: "nabil", cast: "nabil", name: "الأستاذ نبيل", at: [36, 118, 0, "sit"], sortY: 121, talk: [36, 150], say: say }];
        return [];
      }
    };
  }
  H.rooms.add("villa", makeVilla, null);
})();
