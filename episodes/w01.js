/*
  Day 1 · عم صابر · played in the world (walk.html, js/world.js)
  ------------------------------------------------------------
  The story of episodes/ep01.js, staged as scenes in the hara: every path has 7 choices,
  two of them donation moments (give). Every errand someone gives you gets done on screen:
  mama's bread reaches the iftar table, Nemat gets her kunafa and Saber his two loaves.
  A running joke: Nemat keeps saying "don't tell your mom", and mama is always right there.
    1. home        mama's kitchen, Nemat's basket at the window            (choice)
    2. alley       the kids' lot, the football flying at your face         (choice)
    3. bakery      inside Hassan's bakery, the empty board                 (GIVE 1)
                   then Nemat's kunafa from Zaki's griddle, and home with the bread (home_back):
                   the kunafa goes up in her basket, and mama sends you to Saber
    4. steps       the mosque steps, Rizq buying Saber's tools             (choice)
    5. saber_talk  sitting with Saber                                      (choice)
    6. adhan       a minute before maghrib: where Saber breaks his fast    (GIVE 2)
    7. night       walk to: the mosque for taraweeh, the roof, or Saber's workshop (choice)

  A node: loc (room id or "hara"), time, clock, me [x, y, dir], cast { id: [cast, x, y, dir, pose] },
  lines, then one of next / choice / give / end.
  walk: { task, to } means you walk there yourself first; to is a goal (js/map.js objective):
        { loc, spot, zone } on the hara, or { enter: room }. walkFrom/at: where a resumed game starts.
  Stage directions are listed in js/world.js (run). dir: 0 down, 1 up, 2 left, 3 right.
*/
window.HARA = window.HARA || {}; HARA.worldEpisodes = HARA.worldEpisodes || {};
HARA.worldEpisodes[1] = {
  id: 1, day: 1, dayLabel: "أول يوم في رمضان", title: "عم صابر", start: "home", gives: 2,
  endTitle: "أول فانوس في حارتك نوّر",
  shareText: "عم صابر النجار كان أول واحد يعلّق عيش للغلابة في الحارة… النهارده هو اللي محتاج. العب الحلقة ١ من فوانيس الحارة على COH.",
  next: { id: 2, title: "سحور أم يوسف", face: "omyoussef",
    teaser: "الساعة ٣ الفجر. طبلة المسحراتي بتعدّي على بيت أم يوسف… وجوّه البيت مفيش غير شاي وتلات أرغفة." },

  quests: [
    { from: "mama", t: "هات ٢٠ رغيف من فرن عم حسن", done: "at_bakery" },
    { from: "nemat", if: "nemat", t: "هات كيلو كنافة من عند عم زكي في الفرن", done: "at_bakery" },
    { from: "mama", if: "at_bakery", t: "{رجّع|رجّعي} العيش البيت قبل المغرب", done: "at_homeback" },
    { from: "nemat", if: "nemat", t: "ودّي رغيفين لعم صابر", done: "at_steps" },
    { from: "mama", if: "mamaBread", t: "ودّي العيش لعم صابر على سلم الجامع", done: "at_steps" }
  ],

  nodes: {

    /* ---------- 1 · HOME ---------- */
    home: {
      loc: "home", place: "home", time: "asr", clock: "فاضل ساعة ونص على المغرب",
      me: [104, 150, 2], cast: { mama: ["mama", 19, 102, 1] }, props: { basket: 0, rope: 0 },
      lines: [
        ["cam", "me+mama", 1.5, 0],
        ["wait", 700],
        "أول يوم رمضان. البيت ريحته شوربة لسان عصفور… وريحة توتر.",
        ["cam", "mama", 2, 900],
        ["face", "mama", 0], ["emote", "mama", "!"], ["jump", "mama", 300],
        { who: "mama", t: "«{name}! العيش خلص! مين اللي أكل العيش وهو صايم؟!»" },
        ["cam", "me+mama", 1.6, 700], ["emote", "me", "sweat", 500],
        { who: "me", t: "«أنا؟! أنا {صايم|صايمة}… تقريبًا.»" },
        ["walk", "mama", 64, 132, 3],
        { who: "mama", t: "«{انزل|انزلي} لعم حسن {وهات|وهاتي} عشرين رغيف. وبسرعة، قبل ما الطابور يوصل للجامع!»" },
        { who: "nemat", t: "«يا {name}! يا {name}!!»" },
        ["face", "me", 1], ["emote", "me", "?"], ["face", "mama", 1],
        ["cam", [44, 44], 2.2, 1100],
        ["sfx", "basket"], ["tween", "basket", 0, 1, 1800],
        "الصوت جاي من فوق، من بلكونة الحاجة نعمات اللي جنب شباكنا. وسَبَت مربوط بحبل نازل بالراحة قدام الشباك المفتوح.",
        { who: "nemat", t: "«سمعت أمك بتبعتك الفرن! {خد|خدي} السبت ده {معاك|معاكي}، فيه فلوس وورقة. وما {تقولش|تقوليش} لأمك إني بستغلك!»" },
        ["face", "mama", 1], ["emote", "mama", "!"], ["jump", "mama", 200],
        { who: "mama", t: "«أنا سامعاكي يا نعمات!»" },
        ["tween", "basket", 1, 0.7, 200], ["tween", "basket", 0.7, 1, 260],
        { who: "nemat", t: "«…رمضان كريم يا ست الكل! ريحة الشوربة واصلة لحد عندي!»" },
        ["cam", "me+mama", 1.6, 700], ["face", "mama", "me"], ["emote", "mama", "…", 400],
        { who: "mama", t: "«براحتك. بس لو العيش اتأخر، {هتفطر|هتفطري} على الشوربة لوحدها.»" }
      ],
      choice: { prompt: "السبت بيتمرجح برا الشباك…", options: [
        { t: "{تاخد|تاخدي} السبت", set: { nemat: true }, log: "{شلت|شلتي} سبت الحاجة نعمات", next: "basket_yes" },
        { t: "{تعمل نفسك مش سامع|تعملي نفسك مش سامعة}", set: { dodged: true }, log: "{عملت نفسك مش سامع|عملتي نفسك مش سامعة} الحاجة نعمات", next: "basket_no" }
      ]}
    },

    basket_yes: {
      loc: "home", place: "home", time: "asr", clock: "فاضل ساعة ونص على المغرب",
      props: { basket: 1 },
      lines: [
        ["track", "me", 1.8, 700],
        ["walk", "me", 46, 99, 1],
        ["prop", "basket", 0], ["item", "me", "basket", 700],
        "{مديت|مديتي} إيدك برا الشباك، {وفكيت|وفكيتي} السبت من الحبل.",
        ["item", "me", "note"],
        "{فتحت|فتحتي} الورقة. خط مهزوز، ومكتوب بالقلم الرصاص:",
        "«كيلو كنافة بلدي من عند عم زكي اللي في الفرن… ورغيفين لعم صابر.»",
        { who: "nemat", t: "«عم صابر بقاله كام يوم مبيردش على التليفون. اديله العيش {وقوله|وقوليله} نعمات بتسلّم عليك.»" },
        { who: "nemat", t: "«والكنافة {هاتها|هاتيها} على هنا، وأنا أنزّلك الحبل.»" },
        ["item", "me", null], ["face", "me", 0], ["emote", "me", "…"],
        "عم صابر النجار؟ ده اللي كان بيدّيك ملبّس كل ما تعدّي على الورشة… من إمتى {ما شفتهوش|ما شفتيهوش}؟"
      ],
      next: "alley"
    },

    basket_no: {
      loc: "home", place: "home", time: "asr", clock: "فاضل ساعة ونص على المغرب",
      props: { basket: 1 },
      lines: [
        ["face", "me", 0], ["walk", "me", 128, 166, 3],
        "{عملت نفسك مشغول|عملتي نفسك مشغولة} جدًا… بتدوّر على فردة الشبشب.",
        ["tween", "basket", 1, 0.55, 260], ["tween", "basket", 0.55, 1, 260], ["tween", "basket", 1, 0.55, 260], ["tween", "basket", 0.55, 1, 260],
        { who: "nemat", t: "«{name}!! أنا عارفة إنك جوه! سامعة صوت الشبشب!»" },
        ["face", "mama", "me"], ["emote", "mama", "?", 300],
        { who: "mama", t: "«{سامع|سامعة} الست بتقول إيه؟»" },
        ["emote", "me", "sweat", 500],
        ["tween&", "basket", 1, 0, 1200],
        "السبت طلع تاني لفوق، والحاجة نعمات لسه بتنادي. العيش الأول… والحساب بعد الفطار."
      ],
      next: "alley"
    },

    /* ---------- 2 · THE KIDS' LOT ---------- */
    alley: {
      loc: "hara", place: "alley", time: "asr", clock: "فاضل ساعة وربع على المغرب",
      walk: { task: "{انزل|انزلي} {وهات|وهاتي} ٢٠ رغيف من فرن عم حسن، قبل ما الطابور يطول",
        to: { loc: "hara", spot: "bakery", zone: [182, 584, 184, 136] } },
      walkFrom: "home", at: [104, 150, 2],
      lines: [
        ["ball", "hold", "youssef"],
        ["walk&", "youssef", 244, 650, 3], ["walk&", "nourah", 336, 646, 2],
        ["walk", "me", 300, 654, 2],
        ["face", "youssef", 3],
        ["cam", "me+youssef", 1.6, 900],
        { fx: "kids", t: "والحارة صاحية: الزينة متعلقة من بلكونة لبلكونة، والحمام بيلف فوق، والعيال عاملين ماتش ولا كأس العالم." },
        ["emote", "youssef", "spark", 300],
        { who: "youssef", t: "«{خد|خدي} عندك!»" },
        ["pose", "youssef", "kick"], ["fx", "ball"],
        ["ball", "fly", "me", 16, 6, 620, 0.8],
        ["emote", "me", "!"], ["cam", "me", 2.5, 260],
        "الكورة جاية في وشك. بالظبط في وشك."
      ],
      choice: { prompt: "الكورة جاية!", options: [
        { t: "{تشوطها|تشوطيها} جون", set: { goal: true }, log: "{جبت|جبتي} جون في ماتش الحارة", next: "a_kick" },
        { t: "{تمسكها|تمسكيها} {وتساوم|وتساومي} عليها", set: { gossip: true }, log: "{مسكت|مسكتي} الكورة {وساومت|وساومتي} يوسف", next: "a_catch" }
      ]}
    },

    a_kick: {
      loc: "hara", place: "alley", time: "asr", clock: "فاضل ساعة وربع على المغرب",
      at: [300, 654, 2],
      lines: [
        ["face", "me", 3], ["pose", "me", "kick"], ["fx", "kick"],
        ["cam", [330, 640], 1.7, 500],
        ["ball", "fly", [360, 646], 0, 12, 620],
        ["jump", "nourah"], ["emote", "nourah", "sweat"],
        ["burst", "confetti", [356, 630], 16],
        "{شُطتها|شُطتيها} من غير تفكير. الكورة طارت… ودخلت بين الطوبتين اللي عاملينهم جون.",
        ["cam", "me+youssef", 1.6, 700],
        ["jump", "youssef"], ["emote", "youssef", "!"], ["jump", "k4"],
        { who: "youssef", t: "«جوووووون! يا {name}، {تعالى العب|تعالي العبي} معانا بعد الفطار!»" },
        ["walk&", "nourah", 322, 652, 2],
        ["cam", [390, 630], 1.6, 700], ["ball", "fly", [403, 627], 0, 2, 1400],
        { who: "nourah", t: "«يوه! الكورة كمّلت لحد ورشة عم صابر… وهو مبقاش بيفتح خالص.»" },
        ["face", "me", 3], ["cam", [432, 612], 1.9, 1000],
        "{بصيت|بصيتي} على باب الورشة. ورقة متلزقة بشريط بني: «للبيع».",
        ["cam", "me", 1.5, 800],
        ["ball", "free"]
      ],
      set: { sign: true },
      next: "bakery"
    },

    a_catch: {
      loc: "hara", place: "alley", time: "asr", clock: "فاضل ساعة وربع على المغرب",
      at: [300, 654, 2],
      lines: [
        ["ball", "hide"], ["item", "me", "ball", 300], ["fx", "catch"],
        "{مسكتها|مسكتيها} بإيد واحدة. يوسف وقف مذهول.",
        ["emote", "youssef", "angry"], ["walk", "youssef", 280, 652, 3],
        { who: "youssef", t: "«هاتها بقى! الماتش واقف!»" },
        { who: "me", t: "«هدّيهالك… بس قولّي الأول: إيه أخبار الحارة؟»" },
        ["walk", "nourah", 318, 652, 2], ["emote", "nourah", "…", 400],
        { who: "nourah", t: "«عم صابر قاعد على سلم الجامع من الضهر. وماما بتقول إنه صايم من غير سحور.»" },
        ["face", "youssef", "nourah"], ["emote", "youssef", "angry"], ["jump", "youssef"],
        { who: "youssef", t: "«نورة!! ماما قالت ما نقولش لحد!»" },
        ["item", "me", null], ["ball", "free"]
      ],
      next: "bakery"
    },

    /* ---------- 3 · INSIDE THE BAKERY · GIVE 1 ---------- */
    bakery: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل ساعة على المغرب",
      walk: { task: "{كمّل|كمّلي} على فرن عم حسن. الطابور بيطول", to: { enter: "bakery" } },
      walkFrom: "hara", at: [300, 654, 2],
      lines: [
        ["walk", "me", 108, 146, 1],
        ["cam", [80, 116], 1.45, 900],
        { fx: "bakery", t: "فرن عم حسن قبل الفطار بساعة: زحمة، وحر، وريحة عيش سخن تخلي الصيام امتحان." },
        ["emote", "hassan", "♪"],
        { who: "hassan", t: "«واحد واحد يا جماعة! العيش مش هيخلص! …هو بيخلص، بس مش دلوقتي!»" },
        ["cam", "omyoussef", 2, 900],
        "قدامك في الطابور… أم يوسف. أم الولد بتاع الكورة.",
        { who: "omyoussef", t: "«خمسة أرغفة يا عم حسن…»" },
        ["sfx", "coins"], ["item", "omyoussef", "coins", 1100],
        "بتعد الفكة اللي في إيدها. مرة، واتنين. وبعدين بصّت في الأرض.",
        ["item", "omyoussef", null], ["face", "omyoussef", 0], ["emote", "omyoussef", "…", 500],
        { who: "omyoussef", t: "«خليهم تلاتة. الولاد ياكلوا، وأنا مش جعانة.»" },
        ["face", "omyoussef", 1], ["face", "me", 2],
        ["cam", [30, 30], 2.2, 1300],
        "جنب الفرن لوحة فلين قديمة: «العيش المعلّق». اللي يقدر يدفع تمن رغيف زيادة يعلّقه، واللي محتاج ياخده من غير ما يسأل حد.",
        ["cam", "hassan+me", 1.5, 900],
        { who: "hassan", t: "«اللوحة فاضية النهارده… أول يوم، والناس لسه ما خدتش بالها.»" }
      ],
      give: { prompt: "اللوحة فاضية، وأم يوسف لسه واقفة.", options: [
        { key: "b_free", price: 0, icon: "📣", t: "تنادي على الطابور: «اللي يقدر يعلّق رغيف!»", log: "{ناديت|ناديتي} الطابور يعلّق عيش", next: "b_free" },
        { key: "b_10", price: 10, icon: "🍞", t: "{تدفع|تدفعي} عيش أم يوسف النهارده", log: "{دفعت|دفعتي} عيش أم يوسف", next: "b_10" },
        { key: "b_50", price: 50, icon: "🧺", t: "{تعلّق|تعلّقي} عيش لعشر بيوت", log: "{علّقت|علّقتي} عيش لعشر بيوت", next: "b_50" },
        { key: "b_200", price: 200, icon: "🗓️", t: "{تملا|تملي} اللوحة للأسبوع كله", log: "{ملّيت|ملّيتي} اللوحة للأسبوع", next: "b_200" },
        { key: "b_500", price: 500, icon: "🌙", t: "اللوحة والمائدة الليلة على حسابك", log: "{شلت|شلتي} عيش اللوحة والمائدة", next: "b_500" }
      ]}
    },

    b_free: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل ساعة على المغرب",
      lines: [
        ["cam", [80, 130], 1.5, 600],
        ["face", "me", 0], ["jump", "me"],
        { who: "me", t: "«يا جماعة! اللي معاه تمن رغيف زيادة، يعلّقه!»" },
        ["emote", "w2", "?"], ["emote", "m6", "?"], ["emote", "k5", "?", 700],
        "سكتة. وبعدين راجل في آخر الطابور طلّع عشرة جنيه. وست وراه طلّعت خمسة.",
        ["walk&", "m6", 34, 112, 1], ["walk", "w2", 48, 112, 1],
        ["cam", [32, 40], 2, 700],
        ["count", "notes", 1, 7, 300],
        "وفي دقيقة، اللوحة بقى عليها ورق.",
        ["cam", "hassan", 1.9, 700], ["emote", "hassan", "♥"],
        { who: "hassan", t: "«الله {ينوّر عليك|ينوّر عليكي}! والله الحارة دي لسه فيها خير.»" },
        ["walk&", "m6", 82, 150, 1], ["walk&", "w2", 76, 134, 1],
        ["walk", "omyoussef", 40, 112, 1], ["prop", "notes", 6], ["item", "omyoussef", "bread", 500],
        "أم يوسف خدت عيشها من اللوحة، من غير ما حد يبص لها. زي ما العادة بتقول.",
        ["item", "omyoussef", null]
      ],
      next: "bakery_saber"
    },

    b_10: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل ساعة على المغرب",
      lines: [
        ["walk", "me", 90, 116, 1], ["item", "me", "coins", 300], ["sfx", "coins"],
        ["cam", "me+omyoussef", 2, 600],
        "{حطيت|حطيتي} الفلوس على الرخامة قبل ما أم يوسف تلحق تعترض.",
        ["item", "me", null], ["prop", "notes", 1],
        ["face", "omyoussef", 3], ["emote", "omyoussef", "!"], ["jump", "omyoussef"],
        { who: "omyoussef", t: "«لأ لأ لأ، ما ينفعش…»" },
        ["face", "me", 2],
        { who: "me", t: "«دي مش مني. دي من اللوحة.»" },
        ["face", "me", 1], ["emote", "me", "spark", 400],
        "{قلتها|قلتيها} {وانت بتغمز|وانتي بتغمزي} لعم حسن.",
        ["emote", "hassan", "♪"],
        { who: "hassan", t: "«آه طبعًا، من اللوحة! خمسة أرغفة يا أم يوسف. سخنين.»" },
        ["item", "omyoussef", "bread", 400], ["emote", "omyoussef", "♥", 600], ["item", "omyoussef", null]
      ],
      next: "bakery_saber"
    },

    b_50: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل ساعة على المغرب",
      lines: [
        ["walk", "me", 34, 112, 1],
        ["cam", [30, 34], 2.1, 700],
        ["count", "notes", 1, 10, 220],
        "{علّقت|علّقتي} عشر ورقات على اللوحة. كل ورقة، عيش بيت.",
        ["burst", "twinkle", [30, 30], 10],
        ["cam", "hassan+omyoussef", 1.7, 800],
        { who: "hassan", t: "«عشر بيوت هتفطر بعيش سخن النهارده. وأم يوسف أولهم.»" },
        ["item", "omyoussef", "bread", 500],
        ["face", "omyoussef", "me"], ["emote", "omyoussef", "♥"],
        { who: "omyoussef", t: "«ربنا يجبر بخاطرك زي ما {جبرت|جبرتي} بخاطري.»" },
        ["burst", "heart", "omyoussef", 4], ["item", "omyoussef", null]
      ],
      next: "bakery_saber"
    },

    b_200: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل ساعة على المغرب",
      lines: [
        ["walk", "me", 34, 112, 1],
        ["cam", [30, 34], 2.1, 700],
        ["count", "notes", 1, 24, 120],
        "{ملّيت|ملّيتي} اللوحة لآخرها.",
        ["burst", "twinkle", [30, 30], 14],
        ["cam", "hassan+me", 1.6, 800],
        ["face", "hassan", "me"], ["emote", "hassan", "!", 500],
        "عم حسن وقف عن الشغل وبص لك.",
        { who: "hassan", t: "«أسبوع كامل محدش في الحارة هيقف قدام الفرن ويعد الفكة. والله ما هنسى.»" },
        ["item", "omyoussef", "bread", 600],
        "أم يوسف خدت عيشها… ورجعت خدت عيش جارتها كمان.",
        ["item", "omyoussef", null]
      ],
      next: "bakery_saber"
    },

    b_500: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل ساعة على المغرب",
      lines: [
        ["walk", "me", 90, 116, 1], ["item", "me", "coins", 300],
        "{دفعت|دفعتي} لعم حسن من غير كلام كتير. هو فهم.",
        ["item", "me", null],
        ["cam", [30, 34], 2, 600], ["count", "notes", 1, 24, 90], ["burst", "confetti", [30, 30], 16],
        ["cam", "hassan", 1.8, 700], ["jump", "hassan"],
        { who: "hassan", t: "«يبقى اللوحة مليانة، وعيش المائدة اللي برا كمان الليلة {عليك|عليكي}. ارفعوا إيديكم يا جماعة {وادعوا له|وادعوا لها}!»" },
        ["cam", [80, 140], 1.4, 700],
        ["crowd", [80, 130], 60, "emote", "♥"],
        "الطابور كله دعا. حتى الراجل اللي كان بيزق.",
        ["cam", "omyoussef", 2, 700], ["item", "omyoussef", "bread", 500],
        "وأم يوسف خدت خمسة أرغفة سخنين… من غير ما تعد الفكة.",
        ["item", "omyoussef", null]
      ],
      next: "bakery_saber"
    },

    bakery_saber: {
      loc: "bakery", place: "bakery", time: "pre", clock: "فاضل خمسة وأربعين دقيقة على المغرب",
      lines: [
        ["cam", "hassan+me", 1.6, 700], ["face", "hassan", 0],
        { who: "hassan", t: "«{عارف|عارفة} مين كان أول واحد يعلّق على اللوحة دي؟ عم صابر. كل يوم، عشرين سنة.»" },
        { who: "hassan", t: "«ومن شهرين بطّل ييجي. لا بيشتري، ولا بيعلّق.»" },
        ["emote", "me", "…", 400],
        { if: "nemat", t: "{افتكرت|افتكرتي} ورقة الحاجة نعمات: «ورغيفين لعم صابر»." },
        { if: "sign&nemat", t: "{وافتكرت|وافتكرتي} الورقة اللي على باب ورشته: «للبيع»." },
        { if: "sign&!nemat", t: "{افتكرت|افتكرتي} الورقة اللي على باب ورشته: «للبيع»." },
        { if: "gossip&nemat", t: "{وافتكرت|وافتكرتي} كلام نورة: قاعد على سلم الجامع من الضهر." },
        { if: "gossip&!nemat", t: "{افتكرت|افتكرتي} كلام نورة: قاعد على سلم الجامع من الضهر." },
        { if: "nemat", who: "me", t: "«عشرين رغيف للبيت يا عم حسن… ورغيفين لعم صابر، من الحاجة نعمات.»" },
        { if: "nemat", do: [["emote", "hassan", "!", 300]] },
        { if: "nemat", who: "hassan", t: "«لعم صابر؟» نقّى رغيفين من وش الفرن بإيده، ولفّهم لوحدهم في ورقة. «دول أحلى رغيفين في الفرن. {وسلّم|وسلّمي} لي عليه.»" },
        ["item", "me", "bread", 500], ["sfx", "rustle"],
        { if: "!nemat", who: "hassan", t: "«عشرين رغيف، سخنين. {وسلّم|وسلّمي} لي على أمك.»" },
        ["item", "me", null],
        { if: "nemat", do: [["walk", "me", 66, 166, 2], ["cam", "zaki+me", 1.9, 800], ["face", "zaki", "me"]] },
        { if: "nemat", who: "zaki", t: "«كنافة الحاجة نعمات؟ دي زبونتي من أربعين سنة! كيلو بالتمام، لسه نازل من على الصاج.»" },
        { if: "nemat", do: [["sfx", "rustle"], ["item", "me", "kunafa", 700], ["item", "me", null]] },
        "{طلعت|طلعتي} من الفرن. الشمس بدأت تحمر… والعيش لازم يوصل البيت قبل المغرب."
      ],
      next: "home_back"
    },

    /* ---------- HOME AGAIN: the bread on the table, the kunafa up to Nemat, and mama sends you to Saber ---------- */
    home_back: {
      loc: "home", place: "homeback", time: "pre", clock: "فاضل نص ساعة على المغرب",
      walk: { task: "{رجّع|رجّعي} العيش البيت. ماما مستنية", to: { enter: "home" } },
      walkFrom: "bakery", at: [108, 146, 1],
      lines: [
        ["walk", "me", 96, 158, 1],
        ["cam", "me+mama", 1.7, 800],
        ["face", "mama", 0], ["emote", "mama", "!"], ["jump", "mama"],
        { who: "mama", t: "«أخيرًا! {إنت رحت تجيب|إنتي رحتي تجيبي} العيش من أسوان؟!»" },
        { if: "goal", who: "me", t: "«كان فيه ماتش… وجبت جون!»" },
        { if: "gossip", who: "me", t: "«كنت بجمع أخبار الحارة… مهمة رسمية.»" },
        ["emote", "mama", "…", 300],
        ["item", "me", "bread", 400], ["item", "me", null], ["item", "mama", "bread", 600], ["item", "mama", null],
        "عشرين رغيف سخنين نزلوا على الطبلية. البيت كله بقى ريحته رمضان.",
        // Nemat's rope comes down for her kunafa
        { if: "nemat", do: [["sfx", "basket"], ["tween&", "rope", 0, 1, 1400], ["face", "me", 1], ["cam", [44, 60], 2, 1000]] },
        { if: "nemat", who: "nemat", t: "«{name}! الكنافة وصلت؟ {اربط|اربطي} السبت في الحبل يا {حبيبي|حبيبتي}… وما {تقولش|تقوليش} لأمك إنك اتأخرت عشاني!»" },
        { if: "nemat", do: [["cam", "me+mama", 1.6, 600], ["face", "mama", 1], ["jump", "mama"], ["emote", "mama", "!"]] },
        { if: "nemat", who: "mama", t: "«وأنا لسه سامعاكي يا نعمات!»" },
        { if: "nemat", who: "nemat", t: "«…كل سنة وانتي طيبة يا ست الكل!»" },
        { if: "nemat", do: [["cam", [44, 56], 2, 700], ["walk", "me", 46, 99, 1], ["item", "me", "basket", 500], ["item", "me", null], ["prop", "rope", 0], ["prop", "basket", 1], ["sfx", "basket"], ["tween", "basket", 1, 0, 1500]] },
        { if: "nemat", who: "nemat", t: "«الله! ريحة الكنافة البلدي! تسلم إيدك… والرغيفين بتوع صابر؟»" },
        { if: "nemat", who: "me", t: "«معايا. {رايح|رايحة} له دلوقتي.»" },
        // mama hears about Saber
        ["face", "me", 0], ["face", "mama", "me"], ["cam", "me+mama", 1.7, 700],
        { if: "nemat", who: "mama", t: "«صابر؟ صابر النجار؟»" },
        { if: "!nemat", who: "me", t: "«ماما… عم حسن بيقول إن عم صابر النجار بطّل ييجي الفرن من شهرين.»" },
        ["emote", "mama", "…", 500],
        { who: "mama", t: "«ده اللي عامل باب بيتنا ده بإيده. الباب اللي {بتقفله|بتقفليه} في وشي كل ما أقولك {ذاكر|ذاكري}.»" },
        ["emote", "me", "sweat", 400],
        { if: "!nemat", do: [["item", "mama", "bread", 400], ["item", "mama", null], ["item", "me", "bread", 500], ["item", "me", null], ["flag", "mamaBread"]] },
        { if: "!nemat", who: "mama", t: "«{خد|خدي} الرغيفين دول له.»" },
        { who: "mama", t: "«هتلاقيه على سلم الجامع، بقاله أيام بيقعد هناك. {روح اطمن|روحي اطمني} عليه… ولو ما رضيش ييجي يفطر معانا، {خليك|خليكي} معاه. محدش يفطر لوحده أول يوم رمضان.»" },
        ["emote", "me", "♥", 400],
        "{بصيت|بصيتي} من الشباك. السما بقت برتقالي."
      ],
      next: "steps"
    },

    /* ---------- 4 · THE MOSQUE STEPS ---------- */
    steps: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشرين دقيقة على المغرب",
      walk: { task: "{ودّي|ودّي} العيش لعم صابر على سلم الجامع، قبل المغرب",
        to: { loc: "hara", spot: "steps", zone: [196, 244, 150, 26] },
        murmur: [{ who: "rizq", t: "«ميتين جنيه يا حاج…»" }, { who: "saber", t: "«…»" }, { who: "rizq", t: "«ده كرم مني عشان رمضان!»" }] },
      walkFrom: "home", at: [96, 158, 1],
      cast: { saber: ["saber", 290, 247, 0, "sit"], rizq: ["rizq", 302, 263, 1] },
      lines: [
        ["walk", "me", 252, 262, 3],
        ["cam", "saber+rizq", 1.8, 1000],
        { fx: "street", t: "قدام الجامع، الحارة بتجري: صواني رايحة وجاية، وعيال بتعلّق زينة، والمائدة بتتفرش." },
        "وعلى السلم… عم صابر. وجنبه صندوق العِدّة بتاعه، مفتوح.",
        ["item", "rizq", "plane", 500],
        "وفوق دماغه المعلم رزق، تاجر الروبابيكيا، ماسك فارة النجارة وبيقلّبها في إيده.",
        { who: "rizq", t: "«ميتين جنيه في العدة كلها يا حاج. وده كرم مني عشان رمضان.»" },
        ["emote", "saber", "angry", 300],
        { who: "saber", t: "«دي عِدّة أبويا يا رزق. الفارة دي لوحدها أقدم منك.»" },
        ["emote", "rizq", "♪", 300],
        { who: "rizq", t: "«يبقى خليها تفطّرك. ميتين وخمسين. آخر كلام.»" },
        ["item", "rizq", "coins", 300], ["cam", "saber", 2.4, 800], ["shiver", "saber", 3],
        "إيد عم صابر بتترعش… وبتتمد للفلوس."
      ],
      choice: { prompt: "{هتعمل|هتعملي} إيه؟", options: [
        { t: "{تتدخل|تتدخلي}: «العدة دي مش للبيع»", set: { stood: true }, log: "{وقفت|وقفتي} قدام المعلم رزق", next: "st_stand" },
        { t: "{تستنى وتسيب|تستني وتسيبي} عم صابر يقرر", set: { waited: true }, log: "{سبت|سبتي} عم صابر يقرر بنفسه", next: "st_wait" },
        { if: "sign", t: "{تسأل|تسألي}: «والورشة كمان يا معلم؟»", set: { exposed: true }, log: "{كشفت|كشفتي} لعبة المعلم رزق", next: "st_expose" }
      ]}
    },

    st_stand: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشرين دقيقة على المغرب",
      at: [252, 262, 3], cast: { saber: ["saber", 290, 247, 0, "sit"], rizq: ["rizq", 302, 263, 1] },
      lines: [
        ["cam", "saber+rizq", 1.8, 500],
        ["walk", "me", 284, 262, 3], ["jump", "me"],
        { who: "me", t: "«العدة دي مش للبيع.»" },
        "صوتك طلع أعلى مما {كنت قاصد|كنتي قاصدة}.",
        ["face", "rizq", "me"], ["emote", "rizq", "angry", 300],
        { who: "rizq", t: "«{وانت|وانتي} مالك؟ الراجل حر في حاجته.»" },
        ["spawn", "tableman", "m3", 200, 304, 1], ["walk", "tableman", 262, 274, 3], ["emote", "tableman", "!", 300],
        "ناس وقفت تبص. واحد من بتوع المائدة ساب الترابيزة وقرّب.",
        ["emote", "rizq", "sweat", 300],
        { who: "rizq", t: "«ماشي يا جماعة… بكرة ييجي هو لوحده.»" },
        ["item", "rizq", null], ["sfx", "thud"], ["shake", 250, 1],
        "رمى الفارة في الصندوق ومشي.",
        ["walk&", "rizq", 430, 336], ["wait", 700],
        ["face", "saber", 0], ["emote", "saber", "…", 400],
        "وعم صابر ما رفعش عينه من الأرض.",
        ["walk&", "tableman", 120, 312]
      ],
      next: "saber_talk"
    },

    st_wait: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشرين دقيقة على المغرب",
      at: [252, 262, 3], cast: { saber: ["saber", 290, 247, 0, "sit"], rizq: ["rizq", 302, 263, 1] },
      lines: [
        ["emote", "me", "…", 500],
        "{وقفت|وقفتي} مكانك. فيه قرارات الواحد لازم ياخدها بنفسه.",
        ["shiver", "saber", 1.4], ["wait", 900], ["item", "saber", "coins", 700], ["item", "saber", null], ["wait", 300], ["item", "saber", "plane", 500],
        "عم صابر مسك الفلوس… وبعدين سابها. ومسك الفارة.",
        { who: "saber", t: "«لأ. مش النهارده. مش في أول يوم رمضان.»" },
        ["item", "rizq", null], ["emote", "rizq", "…", 300],
        { who: "rizq", t: "«براحتك يا حاج. انت اللي جعان، مش أنا.»" },
        ["walk&", "rizq", 430, 336], ["emote", "saber", "sad", 600],
        "الجملة وقعت تقيلة. ورزق مشي وهو بيعد فلوسه.",
        ["item", "saber", null]
      ],
      next: "saber_talk"
    },

    st_expose: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشرين دقيقة على المغرب",
      at: [252, 262, 3], cast: { saber: ["saber", 290, 247, 0, "sit"], rizq: ["rizq", 302, 263, 1] },
      lines: [
        ["walk", "me", 284, 262, 3],
        { who: "me", t: "«والورشة كمان يا معلم؟ اللي على بابها ورقة للبيع؟»" },
        ["emote", "rizq", "sweat"], ["jump", "rizq", 300],
        ["spawn", "tableman", "m3", 200, 304, 1], ["walk", "tableman", 258, 274, 3],
        "رزق اتلخبط. واحد من بتوع المائدة سمع، وبص له.",
        { who: "rizq", t: "«ده… ده بيزنس يا جماعة! أنا بساعده!»" },
        ["face", "saber", "rizq"], ["emote", "saber", "angry", 300],
        { who: "saber", t: "«بتساعدني؟ ده انت عايز العدة بميتين جنيه… والورشة ببلاش.»" },
        ["item", "rizq", null], ["walk&", "rizq", 430, 336, null, 1.7],
        "رزق مشي بسرعة.",
        ["face", "tableman", "rizq"],
        { who: "tableman", name: "الأستاذ ممدوح", t: "«رزق ده ما لوش أمان.»" },
        ["walk&", "tableman", 120, 312]
      ],
      next: "saber_talk"
    },

    /* ---------- 5 · WITH SABER ---------- */
    saber_talk: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل ربع ساعة على المغرب",
      at: [276, 256, 3], cast: { saber: ["saber", 290, 247, 0, "sit"] },
      lines: [
        ["gone", "rizq"], ["gone", "tableman"],
        ["walk", "me", 276, 256, 3],
        ["cam", "saber+me", 2, 900], ["face", "saber", "me"],
        { if: "!waited", who: "saber", t: "«متشكر يا {ابني|بنتي}. بس ما كانش لازم.»" },
        { if: "waited", who: "saber", t: "«{شفت|شفتي}؟ لسه فيّا حيل أقول لأ.» قالها وهو بيحاول يبتسم." },
        ["item", "me", "bread", 600],
        { if: "nemat", who: "me", t: "«الحاجة نعمات بعتالك العيش ده… وبتسلّم عليك.»" },
        { if: "!nemat", who: "me", t: "«ماما بعتالك العيش ده… وبتسلّم عليك كتير.»" },
        ["item", "me", null], ["item", "saber", "bread", 500], ["emote", "saber", "♥", 400],
        { if: "nemat", who: "saber", face: "saber_smile", t: "«نعمات… لسه فاكرة.» ضحكة صغيرة. أول مرة النهارده." },
        { if: "!nemat", who: "saber", face: "saber_smile", t: "«أمك؟ دي كانت بتيجي الورشة وهي قد كده، تلم النشارة في حجرها.» ضحكة صغيرة. أول مرة النهارده." },
        ["item", "saber", null],
        ["cam", [60, 314], 1.5, 1400],
        "عينيه راحت للمائدة اللي بتتفرش قدامه. وبعدين رجعت للأرض.",
        ["cam", "saber+me", 2, 900], ["face", "saber", 0]
      ],
      choice: { prompt: "{هتقوله|هتقوليله} إيه؟", options: [
        { t: "«مش هتفطر على المائدة؟»", set: { asked: true }, log: "{عزمت|عزمتي} عم صابر على المائدة", next: "t_invite" },
        { t: "«احكيلي حكاية العدة دي.»", set: { story: true }, log: "{سمعت|سمعتي} حكاية عم صابر", next: "t_story" },
        { t: "{تقعد|تقعدي} جنبه {وتطلّع|وتطلّعي} تمرة من جيبك", set: { date: true }, log: "{قعدت|قعدتي} جنب عم صابر بتمرة", next: "t_date" }
      ]}
    },

    t_invite: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشر دقايق",
      at: [276, 256, 3], cast: { saber: ["saber", 290, 247, 0, "sit"] },
      lines: [
        ["face", "saber", "me"],
        { who: "saber", t: "«المائدة؟ أنا يا {ابني|بنتي} اللي كنت بفرشها. عشرين سنة.»" },
        ["face", "saber", 0], ["emote", "saber", "sad", 400],
        { who: "saber", t: "«أقعد عليها إزاي دلوقتي والناس تبص لي؟ صابر النجار… اللي بقى ياكل من المائدة.»" },
        ["emote", "me", "…", 400],
        "ما {لقيتش|لقيتيش} رد. الكسوف ده أصعب من الجوع."
      ],
      next: "adhan"
    },

    t_story: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشر دقايق",
      at: [276, 256, 3], cast: { saber: ["saber", 290, 247, 0, "sit"] },
      lines: [
        ["item", "saber", "plane", 500],
        { who: "saber", t: "«الفارة دي بتاعة أبويا الله يرحمه. خمسين سنة في إيدي… والنهارده كنت هبيعها بميتين جنيه.»" },
        ["item", "saber", null], ["face", "saber", 0],
        { who: "saber", t: "«عينيا تعبت، والشغل قل، والفلوس خلصت. والورشة… هبيعها.»" },
        ["emote", "saber", "sad", 400],
        { who: "saber", t: "«بس اللي مزعلني مش الفلوس. اللي مزعلني إني بقيت عالة.»" }
      ],
      next: "adhan"
    },

    t_date: {
      loc: "hara", place: "steps", time: "pre", clock: "فاضل عشر دقايق",
      at: [276, 256, 3], cast: { saber: ["saber", 290, 247, 0, "sit"] },
      lines: [
        ["walk", "me", 278, 249, 3], ["pose", "me", "sit"], ["item", "me", "date", 500],
        "{قعدت|قعدتي} جنبه على السلمة الباردة، {وطلّعت|وطلّعتي} تمرة ملفوفة في منديل.",
        ["face", "saber", "me"], ["emote", "saber", "?", 300],
        { who: "saber", t: "«تمرة؟ {هتفطر|هتفطري} بيها لوحدك؟»" },
        { who: "me", t: "«لأ. هنفطر بيها احنا الاتنين. نصّ ونصّ.»" },
        ["item", "me", null], ["emote", "saber", "♥", 400],
        { who: "saber", face: "saber_smile", t: "ضحك. ضحكة حقيقية، طلعت منه غصب عنه. «ماشي يا {ابني|بنتي}. على التمرة.»" }
      ],
      next: "adhan"
    },

    /* ---------- 6 · A MINUTE BEFORE MAGHRIB · GIVE 2 ---------- */
    adhan: {
      loc: "hara", place: "steps", time: "pre", clock: "دقيقة على المغرب",
      at: [276, 256, 3], cast: { saber: ["saber", 290, 247, 0, "sit"] },
      lines: [
        ["hush"],
        ["fade", 1, 700], ["time", "maghrib", true], ["repop"],
        ["place", "me", 276, 256, 3], ["pose", "me", "stand"], ["place", "saber", 290, 247, 0], ["pose", "saber", "sit"],
        ["cam", [150, 300], 1.15, 0],
        ["fade", 0, 900],
        "الحارة سكتت فجأة. الكل قعد. الكل مستني.",
        ["cam", "saber+me", 1.9, 1400],
        ["pose", "saber", "stand"], ["walk", "saber", 292, 258, 0],
        "عم صابر قفل صندوق العدة، وقام بالراحة، كأنه هيمشي.",
        ["face", "saber", "me"],
        { if: "!date", who: "saber", t: "«أنا هروّح بقى. ربنا يتقبل منك.»" },
        { if: "date", do: [["item", "saber", "date", 400], ["item", "saber", null], ["item", "me", "date", 500]] },
        { if: "date", who: "saber", t: "«نص التمرة ده {ليك|ليكي}. {روّح افطر|روّحي افطري} مع أمك… وأنا هفطر على نصّي في البيت.»" },
        { if: "date", do: [["item", "me", null]] },
        ["walk&", "saber", 318, 262, 3, 0.4], ["cam", "saber+me", 1.5, 1400],
        "فاضل دقيقة. لازم {تقرر|تقرري} دلوقتي."
      ],
      give: { prompt: "عم صابر هيفطر فين النهارده؟", options: [
        { key: "g_free", price: 0, icon: "📣", t: "تنادي على المائدة: «عم صابر هو اللي عمل الكراسي دي!»", log: "{ناديت|ناديتي} المائدة تفسح لعم صابر", next: "g_free" },
        { key: "g_10", price: 10, icon: "🌴", t: "تمر وعصير على السلم، {انت|انتي} وهو", log: "{فطرت|فطرتي} معاه على السلم", next: "g_10" },
        { key: "g_50", price: 50, icon: "🫘", t: "فول وطعمية من عربية عم سيد", log: "{فطّرته|فطّرتيه} فول وطعمية", next: "g_50" },
        { key: "g_200", price: 200, icon: "🍲", t: "كشري أبو ياسر، وعلبة سحور", log: "{فطّرته|فطّرتيه} كشري {وسحّرته|وسحّرتيه}", next: "g_200" },
        { key: "g_500", price: 500, icon: "🍢", t: "عزومة كباب، وعم صابر هو اللي عازم", log: "{خليت|خليتي} عم صابر يعزم الحارة على كباب", next: "g_500" }
      ]}
    },

    g_free: {
      loc: "hara", place: "table", time: "maghrib", clock: "المغرب",
      at: [276, 256, 3], cast: { saber: ["saber", 318, 262, 3] },
      lines: [
        ["walk", "me", 262, 252, 0], ["jump", "me"],
        { who: "me", t: "«يا جماعة! الكراسي اللي انتوا قاعدين عليها دي… عم صابر هو اللي عاملها!»" },
        ["cam", [62, 300], 1.4, 1100],
        ["crowd", [60, 296], 70, "emote", "!"],
        "الناس بصت للكراسي. وبعدين بصت لعم صابر.",
        ["spawn", "hassan", "hassan", 124, 300, 2], ["jump", "hassan"], ["emote", "hassan", "!", 300],
        { who: "hassan", t: "«عم صابر؟! تعالى يا عم صابر، كرسيك لسه فاضي في النص! …{وانت|وانتي} كمان يا {name}، {تعالى|تعالي} جنبه.»" },
        ["track", "saber", 1.4, 700], ["walk", "saber", 56, 292, 0, 1.5], ["pose", "saber", "sit"],
        ["walk", "me", 73, 292, 0, 1.6], ["face", "me", 0], ["pose", "me", "sit"],
        ["cannon"],
        "ضرب المدفع. وعم صابر لقى نفسه في نص المائدة، والكل بيفسح له.",
        ["cam", "saber", 2.1, 900],
        { who: "saber", face: "saber_smile", t: "«الكرسي ده لسه شادد حيله… زيّي بالظبط.»" },
        ["crowd", [60, 296], 70, "emote", "♥"],
        "ولا حد بص له بشفقة. الكل بص له بفخر."
      ],
      next: "night"
    },

    g_10: {
      loc: "hara", place: "steps_iftar", time: "maghrib", clock: "المغرب",
      at: [276, 256, 3], cast: { saber: ["saber", 318, 262, 3] },
      lines: [
        ["walk", "me", 340, 300, 3, 1.6],
        "{جريت|جريتي} على الكشك {ورجعت|ورجعتي} بكيس تمر وإزازتين عصير.",
        ["fade", 1, 300], ["place", "me", 280, 250, 3], ["place", "saber", 292, 248, 2], ["pose", "saber", "sit"], ["cam", "saber+me", 2, 0], ["fade", 0, 400],
        ["item", "me", "juice", 300],
        ["cannon"],
        "ضرب المدفع. والحارة كلها قالت «اللهم لك صمت» في نفَس واحد.",
        ["pose", "me", "sit"], ["sfx", "pour"], ["item", "me", null], ["item", "saber", "date", 500],
        "{صبيت|صبيتي} العصير في كوبايتين بلاستيك. عم صابر مسك التمرة بإيده الاتنين.",
        ["cam", "saber+me", 2.3, 800],
        { who: "saber", face: "saber_smile", t: "«بقالي شهرين بفطر لوحدي. النهارده فطرت مع حد.»" },
        ["item", "saber", null], ["burst", "heart", "saber", 4]
      ],
      next: "night"
    },

    g_50: {
      loc: "hara", place: "fulcart", time: "maghrib", clock: "المغرب",
      at: [276, 256, 3], cast: { saber: ["saber", 318, 262, 3] },
      lines: [
        ["fade", 1, 500],
        ["place", "tayyar", 58, 521, 2],
        ["place", "me", 76, 520, 2], ["place", "saber", 86, 516, 2],
        ["cam", [34, 516], 2.1, 0], ["fade", 0, 600],
        { fx: "ladle", t: "{خدته|خدتيه} لعربية عم سيد. القدرة النحاس بتطقطق، وطاسة الطعمية بتطشطش، وراديو صغير ورا العيش بيقرا قرآن." },
        ["walk&", "saber", 44, 524, 2], ["walk", "me", 36, 520, 2],
        ["face", "sayed", "saber"], ["jump", "sayed"], ["emote", "sayed", "!", 300],
        { who: "sayed", t: "«الحاج صابر؟! بقالك شهرين ما عدّيتش عليّا! أنا قلت زعلان مني!»" },
        ["emote", "saber", "…", 400],
        { who: "saber", t: "«أزعل منك إزاي يا سيد… الدنيا هي اللي ضاقت شوية.»" },
        { who: "sayed", t: "«ضاقت على مين؟ اقعدوا! الكرسي الأزرق للحاج… ده كرسي الزباين الغاليين.»" },
        ["walk&", "saber", 31, 539, 2], ["walk", "me", 7, 539, 3], ["pose", "saber", "sit"], ["pose", "me", "sit"],
        ["cam", "saber+me", 2.2, 800],
        ["cannon"],
        "ضرب المدفع. والراديو قال «الله أكبر»… والحارة كلها سكتت في نفس اللحظة.",
        ["item", "saber", "date", 500], ["item", "saber", null],
        "الأول تمرة وبُق مية. وبعدين نزل الفول بالزيت الحار والكمون والليمون، وجنبه طعمية لسه بتطشطش.",
        ["sfx", "clink"], ["item", "me", "plate", 400], ["item", "saber", "plate", 500], ["item", "me", null],
        { who: "saber", face: "saber_smile", t: "«عشرين سنة بفطر الصبح من إيدك يا سيد… والطعم ما اتغيرش.»" },
        ["face", "sayed", 0],
        { who: "sayed", t: "«ولا الكرسي اتغير. ده مكانك يا حاج، كل يوم… والحساب لما الورشة تفتح.»" },
        ["item", "saber", null], ["emote", "saber", "♥", 400],
        ["spawn", "k1x", "k1", 100, 512, 2], ["spawn", "k2x", "k2", 112, 520, 2],
        ["walk&", "k1x", 36, 520, 1], ["walk", "k2x", 46, 525, 1], ["emote", "k1x", "!"], ["emote", "k2x", "♪"],
        "والعيال شمّوا ريحة الطعمية من آخر الحارة.",
        ["jump", "hamo"],
        { who: "hamo", t: "«واحدة لكل واحد… وما حدش يقول لأبويا!»" },
        ["face", "sayed", 3], ["emote", "sayed", "!", 300],
        { who: "sayed", t: "«أنا واقف جنبك يا حمو!»" },
        ["emote", "hamo", "sweat", 300], ["emote", "saber", "♪", 300],
        "وعم صابر ضحك. والقطة قعدت تحت الترابيزة، مستنية نصيبها."
      ],
      next: "night"
    },

    g_200: {
      loc: "koshari", place: "koshari", time: "maghrib", clock: "المغرب",
      lines: [
        ["go", "koshari", [96, 152, 1], true],
        ["spawn", "saber", "saber", 80, 152, 1],
        ["cam", [92, 118], 1.45, 0],
        ["fade", 0, 600],
        { fx: "clink", t: "{دخلته|دخلتيه} محل أبو ياسر. الأطباق بتطير، وكبشة أبو ياسر بتخبط على حرف الحلة زي الطبلة." },
        ["face", "m6", 0], ["emote", "m6", "!", 300], ["walk&", "m6", 60, 120, 0], ["emote", "w5", "♥"], ["walk", "w5", 128, 120, 0],
        { who: "m6", name: "عم رمضان", t: "«اتفضل يا حاج صابر! مكانك.»" },
        ["walk&", "saber", 82, 135, 3], ["walk", "me", 110, 135, 2], ["pose", "saber", "sit"], ["pose", "me", "sit"],
        ["cannon"],
        "ضرب المدفع. وأبو ياسر حط قدامه طبق كبير ودقة زيادة.",
        ["item", "saber", "plate", 500],
        { who: "abuyasser", t: "«وعلبة سحور كمان باسمك يا عم صابر. ولا كلمة.»" },
        ["cam", "saber+me", 2.1, 700],
        { who: "saber", face: "saber_smile", t: "«ده أنا كنت نازل النهارده أبيع عدتي…»" },
        ["item", "saber", null]
      ],
      next: "night"
    },

    g_500: {
      loc: "hara", place: "kebab", time: "maghrib", clock: "المغرب",
      at: [276, 256, 3], cast: { saber: ["saber", 318, 262, 3] },
      lines: [
        ["item", "me", "coins", 400],
        "{حطيت|حطيتي} الفلوس في إيد عم صابر: «انت اللي عازم الليلة.»",
        ["item", "me", null], ["item", "saber", "coins", 400], ["emote", "saber", "!", 400],
        ["go", "kebab", [104, 152, 1], true],
        ["gone", "m3"], ["gone", "w1"], ["gone", "k4"],
        ["spawn", "saber", "saber", 88, 166, 1],
        ["cam", [90, 130], 1.4, 0],
        ["fade", 0, 600],
        ["cannon"],
        "ضرب المدفع. وريحة الكباب على الفحم ملت المحل.",
        ["face", "saber", 0], ["jump", "saber"],
        { who: "saber", face: "saber_smile", t: "«يا يوسف! يا نورة! يا أم يوسف! الفطار عليّا!»" },
        "عم صابر وقف على باب المحل ونادى بصوت ما حدش سمعه من شهرين.",
        ["spawn", "youssef", "youssef", 84, 180, 1], ["spawn", "nourah", "nourah", 96, 180, 1], ["spawn", "omyoussef", "omyoussef", 90, 182, 1],
        ["walk&", "youssef", 80, 142, 1], ["walk&", "nourah", 112, 142, 1], ["walk", "omyoussef", 122, 124, 2],
        ["emote", "youssef", "!"], ["jump", "youssef"],
        { who: "youssef", t: "«كباب؟! بجد؟!»" },
        ["walk", "saber", 82, 125, 3], ["pose", "saber", "sit"],
        ["cam", "saber+youssef", 1.9, 700],
        { who: "saber", face: "saber_smile", t: "«بجد يا ابني. كلوا… ده أنا بقالي شهرين نفسي أعزم حد.»" },
        ["burst", "heart", "saber", 6]
      ],
      next: "night"
    },

    /* ---------- 7 · AFTER IFTAR ---------- */
    night: {
      loc: "hara", place: "steps", time: "night", clock: "بعد الفطار",
      at: [262, 300, 0],
      lines: [
        ["fade", 1, 800],
        ["go", "hara", [262, 300, 0], true],
        ["time", "night", true], ["repop"],
        ["spawn", "saber", "saber", 278, 298, 2],
        ["spawn", "mama", "mama", 178, 352, 3], ["spawn", "nemat", "nemat", 166, 344, 3],
        ["cam", [288, 190], 1.05, 0],
        ["fade", 0, 1200],
        { fx: "chime", t: "بعد الفطار، الحارة بتصحى من تاني. الفوانيس كلها نوّرت." },
        ["cam", "saber+me", 1.8, 1600],
        ["walk&", "mama", 238, 312, 3], ["walk", "nemat", 248, 322, 3],
        ["face", "me", 2], ["cam", "me+nemat", 1.7, 700],
        { if: "nemat", do: [["item", "nemat", "plate", 400]] },
        { if: "nemat", who: "nemat", t: "«{name}! الكنافة اتعملت، وده أول طبق طلع من الصينية… {ليك|ليكي}. {ما تقولش|ما تقوليش} لأمك!»" },
        { if: "nemat", do: [["face", "mama", "nemat"], ["jump", "mama"], ["emote", "mama", "!"]] },
        { if: "nemat", who: "mama", t: "«يا نعمات أنا واقفة جنبك!!»" },
        { if: "nemat", do: [["emote", "nemat", "sweat", 300], ["emote", "saber", "♪", 300]] },
        { if: "nemat", t: "الحاجة نعمات حطت إيدها على بُقها. وعم صابر ضحك لحد ما دمعت عينه." },
        { if: "nemat", do: [["item", "nemat", null], ["item", "me", "plate", 500], ["item", "me", null]] },
        { if: "dodged", who: "nemat", t: "«{name}! أنا {مسامحاك|مسامحاكي} على حكاية السبت. بس عشان رمضان.»" },
        { if: "dodged", do: [["face", "mama", "me"], ["emote", "mama", "…", 300]] },
        { if: "dodged", who: "mama", t: "«الست نزلت السلالم على رجليها عشان كيلو كنافة يا {name}.»" },
        { if: "dodged", do: [["emote", "me", "sweat", 300], ["emote", "nemat", "♪", 300]] },
        { if: "dodged", who: "nemat", t: "«ولا يهمك يا ست الكل. الحركة بركة… والكنافة طلعت تحفة!»" },
        ["face", "mama", "me"], ["cam", "me+mama", 1.8, 700],
        { who: "mama", t: "«{فطرت|فطرتي} برا أول يوم رمضان…»" },
        ["emote", "me", "sweat", 400],
        { who: "mama", t: "«…بس عم صابر ما فطرش لوحده. أنا مبسوطة منك يا {name}.»" },
        ["emote", "mama", "♥", 400],
        { who: "nemat", t: "«يلا يا ست الكل، التراويح هتفوتنا!»" },
        ["cam", [244, 270], 1.5, 900],
        ["walk&", "mama", 238, 246, 1], ["walk", "nemat", 250, 248, 1],
        ["gone", "mama"], ["gone", "nemat"],
        "ودخلوا الجامع من باب الستات، دراع في دراع.",
        ["cam", "saber+me", 1.8, 900], ["face", "me", 3], ["face", "saber", "me"],
        { who: "saber", face: "saber_smile", t: "«الليلة لسه طويلة يا {ابني|بنتي}.»" }
      ],
      choice: { prompt: "{هتروح|هتروحي} فين؟ {امشي|امشي} للمكان اللي {تختاره|تختاريه}", walk: true, follow: "saber", options: [
        { t: "التراويح في الجامع", walk: { enter: "mosque", where: "الجامع" }, log: "{صليت|صليتي} التراويح", next: "n_mosque" },
        { t: "السطوح مع العيال والفوانيس", walk: { enter: "roof", where: "السطوح" }, log: "{طلعت|طلعتي} السطوح مع العيال", next: "n_roof" },
        { t: "{تمشّي|تمشّي} عم صابر لحد ورشته", walk: { loc: "hara", spot: "workshop", where: "ورشة عم صابر" }, log: "{مشيت|مشيتي} عم صابر لورشته", next: "n_workshop" }
      ]}
    },

    n_mosque: {
      loc: "mosque", place: "mosque", time: "night", clock: "التراويح",
      cast: { saber: ["saber", 104, 124, 1], mama: ["mama", 88, 214, 1], nemat: ["nemat", 124, 214, 1] }, // already in their rows when you come in
      lines: [
        ["pose", "saber", "pray"], ["pose", "mama", "pray"], ["pose", "nemat", "pray"],
        { if: "!fem", do: [["clearAt", [104, 148]], ["walk", "me", 104, 148, 1]] },
        { if: "fem", do: [["clearAt", [106, 214]], ["walk", "me", 106, 214, 1]] },
        ["pose", "me", "pray"],
        ["cam", [116, 156], 1.2, 1600],
        "الجامع مليان لآخره. أول تراويح في رمضان دايمًا ليها طعم.",
        ["cam", "saber", 2, 1300],
        { if: "!fem", t: "في الصف اللي قدامك… عم صابر. ضهره مفرود الليلة." },
        { if: "fem", t: "ماما على شمالك، والحاجة نعمات على يمينك. ومن ورا المشربية، عم صابر في الصف الأول. ضهره مفرود الليلة." },
        ["cam", [116, 150], 1.3, 1200], ["wait", 4200],
        ["fade", 1, 600], ["pray", "end"], ["cam", "sheikh", 1.8, 0], ["fade", 0, 700],
        "بعد الصلاة، الشيخ عبد الله مسك المايك:",
        { who: "sheikh", t: "«يا جماعة، كراسي الجامع محتاجة تصليح. واللي يعرف نجار شاطر في الحارة… يقول.»" },
        { if: "!fem", do: [["cam", "saber+me", 1.6, 1000], ["face", "saber", "me"], ["emote", "saber", "♥", 600]] },
        { if: "!fem", t: "بصيت لعم صابر. هو كمان بص لك. وابتسم." },
        { if: "fem", do: [["cam", "saber", 1.8, 1000], ["emote", "saber", "♥", 600]] },
        { if: "fem", t: "بصيتي من ورا المشربية على عم صابر. كان بيبتسم… وعينه على كراسي الجامع." }
      ],
      end: true
    },

    n_roof: {
      loc: "roof", place: "roof", time: "night", clock: "وقت التراويح",
      lines: [
        ["cam", [104, 54], 1.35, 0], ["wait", 900],
        { fx: "kids", t: "السطوح مليان عيال وفوانيس، والحارة تحتك كلها نور." },
        ["walk", "me", 108, 160, 1],
        ["cam", "nourah+me", 1.9, 1000],
        ["face", "nourah", "me"], ["jump", "nourah"],
        { who: "nourah", t: "«{شوف|شوفي} فانوسي! عم صابر عمله لي السنة اللي فاتت. خشب بجد!»" },
        ["face", "youssef", "me"],
        { who: "youssef", t: "«ماما بتقول لو عم صابر رجع يشتغل، هيعمل فوانيس للحارة كلها.»" },
        ["prop", "workshopLit", 1], ["face", "me", 1],
        ["cam", [150, 66], 1.9, 1600],
        ["burst", "twinkle", [150, 64], 8],
        "{بصيت|بصيتي} تحت. لمبة الورشة القديمة… منوّرة."
      ],
      end: true
    },

    n_workshop: {
      loc: "hara", place: "workshop", time: "night", clock: "بالليل",
      at: [446, 662, 1],
      lines: [
        ["follow", "saber", false],
        ["spawn", "saber", "saber", 418, 662, 1], ["walk", "me", 446, 662, 1],
        ["cam", [432, 628], 1.8, 900],
        { fx: "door", t: "باب الورشة اتفتح بزيقة طويلة. ريحة نشارة وخشب قديم." },
        ["go", "workshop", [92, 150, 1], true],
        ["spawn", "saber", "saber", 80, 140, 1],
        ["cam", [88, 104], 1.4, 0], ["fade", 0, 900],
        { who: "saber", t: "«بقالي شهرين ما دخلتهاش.»" },
        ["walk", "saber", 64, 112, 1], ["sfx", "tap"], ["prop", "lamp", 1], ["burst", "twinkle", [64, 44], 6],
        ["walk", "me", 92, 120, 2], ["cam", "saber+me", 1.8, 900],
        ["item", "saber", "plane", 400], ["sfx", "plane"], ["burst", "dust", [62, 92], 12],
        "حط الفارة على لوح خشب، وزقها مرة واحدة. نشارة رفيعة طلعت ملفوفة زي الشريطة.",
        ["item", "saber", null], ["face", "saber", "me"], ["emote", "saber", "♥", 500],
        { who: "saber", face: "saber_smile", t: "«لسه فيها. ولسه فيّا.»" },
        ["walk", "saber", 89, 154, 0], ["prop", "sign", 0], ["item", "saber", "note", 500],
        "وبعدين فتح باب الورشة، وشال ورقة «للبيع» من عليه، وطبّقها، وحطها في جيبه.",
        ["item", "saber", null]
      ],
      set: { workshop: true },
      end: true
    }
  }
};
