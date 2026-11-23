# فوانيس الحارة · Lanterns of the Hara

A 30-episode interactive Ramadan series for EFB's COH app. Each day of Ramadan, the player walks through one hara, meets a neighbor who needs help, and makes at least five choices. Each episode sets how many of those choices are donation moments (`gives`, which defaults to 1). Each donation moment offers a free option and four amounts of real money.

This folder holds the **Day 1 prototype** (عم صابر) and the engine the other 29 episodes will use.

## Run it

- Quickest option: open `index.html` in a browser (it opens `walk.html`, the world version). Fonts load from Google, so you need internet.
- Local server, which also lets you test on a phone on the same Wi-Fi:

```powershell
node tools/serve.js
```

  Then open http://localhost:5173. The server also prints a link for phones on the same Wi-Fi, such as `http://192.168.1.20:5173`. If the phone can't load that link, Windows Firewall is blocking port 5173 on that network.

## The world version (prototype)

`walk.html` is the game as a world. There are no story screens: the whole day happens inside a pixel-art hara in a three-quarter view (every building faces south, and you see its roof above the front wall), and in the rooms you can walk into.

**Scenes, the way Stardew Valley tells its stories.** When the story needs you, a scene starts where you are: black bars slide in, the camera moves in close, and the people act it out. They walk in, turn to each other, jump, shiver, sit, hold things up (a basket, two loaves, a date) and show little bubbles (!, ?, a heart, a sweat drop, anger). The words come in a dialogue box with the speaker's portrait in a wooden frame and their name under it: painted portraits for the main characters, pixel portraits for everyone else and for you. Questions are asked in the same box. Nobody pops into place: people who are already in view walk to their marks, the next scene's people wait at their places while you're still on your way (as you get close to the mosque steps you overhear Rizq haggling), and anyone who has to appear does it behind a fade or out of sight. A few choices are made by walking: after iftar you walk to the mosque, the roof or Saber's workshop, and Saber walks along with you. Giving opens a small card that rises over the scene; press and hold an option to confirm it, and COH handles the money.

Day 1, staged this way (`episodes/w01.js`): Mama's kitchen and Nemat's basket swinging at the window (mama catches her: «شايفاكي يا نعمات!»); the football frozen in mid-air in front of your face while you choose; the queue inside Hassan's bakery and the empty board that fills with paper notes if you give; Nemat's kunafa from Zaki's griddle; home again with the bread, the kunafa going up to Nemat on her rope, and mama sending you to Saber with two loaves ("if he won't come to us, stay with him: nobody breaks their fast alone on the first day"); Rizq over Saber on the mosque steps; the hush a minute before maghrib, the cannon, and Saber at the mercy table, on the steps with you, at the ful cart, at a marble table in the koshari shop, or calling the kids to kebab; then mama and Nemat on their way to taraweeh (Nemat says "don't tell your mom" a third time, with mama standing right next to her), and taraweeh in a full mosque with them in the women's front row, the roof with the kids' lanterns, or Saber opening his dusty workshop and lighting the lamp. Every errand someone gives you is done on screen: the bread reaches the iftar table, Nemat gets her kunafa, Saber gets his two loaves. The day ends with its lantern lighting up on the string over the minaret, and a page of your day. Afterwards the hara at night is yours to walk.

**Rooms you can walk into** (`js/hara-rooms.js`). Tap a door to go in; a small sign shows near doors. Each room is painted in code and changes with the hour:

| Room | What's in it |
|---|---|
| بيتنا, home | Mama's kitchen with the soup on the stove, the window where Nemat's basket comes down, a canary, the glass niche with the good plates and a fanous on top, the TV on its cabinet with the kanaba facing it (a cooking show in the afternoon, the mosque before maghrib and the adhan at sunset, the series at night, cutting between its shots; at night mama watches from the kanaba, her back to you), the kilim, the iftar tabliya that gets laid as maghrib nears, a door up to the roof |
| فرن عم حسن, the bakery | The brick dome oven with its fire and Sobhy's peel going in and out, bread trays, the queue, the "suspended bread" board, flour in the light, a cat asleep on the sacks, and by the door, only in Ramadan, Zaki pouring kunafa in circles on his round griddle |
| جامع الحارة, the mosque | The tiled mihrab and its lamp, the minbar, stained glass that throws colours on the carpet in the afternoon, the chandelier, hanging lamps, slow ceiling fans, the prayer-times board, a water cooler on each side; at night taraweeh, with rows that stand, bow and prostrate after the imam's takbeer, each person a moment behind him. Men and women have their own halves: the women's rows are behind a closed mashrabiya screen with their own door in the middle; men come in by the door on the right and walk up a side passage to the front. A boy only ever enters the men's side and a girl the women's side, and tapping the other half says whose it is instead of walking there |
| كشري أبو ياسر, koshari | White tiles, the neon sign, the menu, the steel counter with the pots and the mountain of fried onions, marble tables |
| الكبابجي, kebab | The charcoal grill and its embers, the meat fridge, checked tablecloths, copper pans |
| ورشة عم صابر, the workshop | Dusty and shut on Day 1, with outlines on the pegboard where tools were sold and his father's photo; bright and full of wooden lanterns once it reopens |
| السطوح, the roof | The whole hara's skyline behind you, the minaret lit, the moon, lantern strings, kids with lanterns at night and a kite in the afternoon |

**Food places follow the fast.** In the afternoon the koshari and kebab shops are empty except for the cooks getting ready; before maghrib there's a takeaway queue; at iftar and after it every table is full and the sound fills up with it. Outside, the street is quiet in the afternoon, busy before iftar, empty at maghrib while everyone eats, and full at night with lines out of the food places.

The hara is a ring of small places. Each has its own ground, people, sound and light at night, and its name swings down on a painted sign when you walk in:

| Place | What makes it itself |
|---|---|
| ساحة الجامع, the mosque square | Limestone slabs and an inlaid star, the striped mosque and minaret, palms, the sabil, the mercy-table tent, the lantern seller, the drinks cart, and the lantern of the days |
| سوق الحارة, the market lane | Worn cobbles under bunting: the ful cart, koshari, kebab smoke, fruit, dates and qamar el-din, spices |
| فرن عم حسن, the bakery | The oven's glow, bread cooling in palm trays, the queue, the "suspended bread" board, flour on the ground |
| قهوة الحارة, the café | Under a huge old sycamore whose crown you can see through when you walk beneath it: tiled terrace, backgammon, the TV, the kiosk on the corner |
| ملعب العيال, the kids' lot | Dirt, stone goals, hopscotch, the mural wall; kids with lanterns at night |
| زقاق البيت, home | A narrow lane of plants, Hagga Nemat's balcony and basket, the water jar, her bench |
| ورشة عم صابر, Saber's yard | Shut, rusting and "for sale" at first; full of wooden lanterns once it reopens |
| جنينة الحارة, the garden lot | A locked lot of rubble and an old car that the neighbours turn into a garden |

Beyond the places, the flat concrete roofs of the houses to the south fill the bottom edge, the way Cairo's look from above: a low parapet around each one, painted like its house, with a row of breeze-block holes and a shadow on the roof; tar patches and cracks; column stubs with their rebar still sticking up; water tanks, satellite dishes, old TV aerials, pigeon towers, a room for the stairs, laundry, a pile of bricks, and kids flying kites. The street at their feet lies in their shade.

**The hara changes with the days of Ramadan.** The plan for the whole month (suhoor nights, gatherings, places that open, things you buy and keep) is in [MONTH.md](MONTH.md). `DAYS` at the top of `js/hara-world.js` says what happens when; change the numbers there:

- Day 7: Om Youssef (helped on Day 2) sells qatayef by the bakery.
- Day 10: the garden lot opens and the kids start planting. Day 20: it's green, with benches and a lantern.
- Day 12: Saber's workshop reopens. He works at his bench making wooden lanterns, and kids watch.
- Day 30: Eid swings and balloons.
- The lantern of the days, strung from the minaret, has 30 lanterns: one more is lit every day. The moon in the night sky follows the month too, from a thin crescent to full and back.
- The first time you open the map on a day with news, a red sign says what's new.

Add `?day=12` (any day from 1 to 30) to the link to see the hara on that day. In the real game the day comes from the episode number.

**Things to do besides the story:**

- Tap a person to walk up and talk. Story characters answer with their painted portrait in a dialogue box; neighbours say a short line.
- Tap things to look at them: the sabil, the water jar, the tree, the mural, the kiosk, the gate, the drinks cart. Tap a cat to pet it.
- Every day has three small good deeds (water Nemat's plants, greet Uncle Bashir at the kiosk, find the kitten at the bakery...). They're in **مهامك** under the story's errands, and a small gold sparkle hangs over each one in the hara. **فين؟** next to a deed glides the camera over to show you where it is, then walks you there (out of a room first if you need to); the edge arrow turns gold and points at it until you've done it. Doing one shows what you did (you water the plants with a can, you drink from a brass cup) and a green sign. Drinking from the sabil or the zeer waits until after iftar: you're fasting. The list folds away as soon as you tap the map, and has its own × to close it.
- Whatever you tap lights up with four small gold corners, so you know what you're walking to.
- Eight secrets are hidden around the hara, twinkling faintly. Finding one opens a gold "new memory" note; they stay found all month.
- A lantern floats over today's errand, and an arrow at the edge points to it when it's off screen. The **يلا** button walks you there, through doors too. Reaching it starts the next scene.
- After iftar, you choose where to spend the night by walking to the mosque, the roof or Saber's workshop. Reading the "for sale" note on Saber's workshop door unlocks the option to expose Rizq at the mosque steps.

The hara lives on its own while you walk: neighbours run errands and stop to chat, shopkeepers stand at their stalls, men play backgammon, kids play football, Saber hammers, cats nap and beg, pigeons scatter, leaves fall from the sycamore, steam and smoke rise, laundry and lanterns sway, moths circle the lamps at night. The light follows the story's clock: a warm afternoon, a golden hour with low sun rays, a purple sunset with everyone at the mercy tables, and a blue night of lit windows and lantern strings. Each place has its own sound bed (market chatter, dice at the café, sparrows in the garden).

Everything is painted in code, with no image files:

| File | What it holds |
|---|---|
| `js/hara-art.js` | The pixel painter: palette, people (4 directions, walking, blinking, sitting), cats, pigeons, basic props |
| `js/hara-props.js` | Each place's own things: kiosk, lantern stall, fruit and date stalls, the sycamore, Saber's bench and lanterns, garden stages, mural, arch, Eid swings |
| `js/hara-world.js` | The hara: the calendar of days, places, buildings, ground, sky and moon, people and what they say, secrets and small deeds |
| `js/hara-rooms.js` | The rooms you can walk into, their furniture, who is in them at each hour, and which door opens which room |
| `js/map.js` | Runs it: camera and zoom, tap-to-walk and pathfinding, doors, routines, place signs and sounds, days, secrets, lighting, dialogue, and the scene controls (`H.map.cut`) |
| `js/world.js` | The director: title screen, your name, scenes, choices, the giving card, the end of the day, saving |
| `episodes/w01.js` | Day 1 staged in the world: where each scene happens, who stands where, and its stage directions |
| `css/map.css`, `css/world.css` | The panels: errand card, day and clock tabs, place signs, the dialogue box and its portrait frame, scene bars, title, giving card, the day's page |

To look at the art on its own, open http://localhost:5173/tools/sprites.html (every person, animal and prop, enlarged) or http://localhost:5173/tools/world.html (the whole hara without its lighting). world.html takes `?t=night` for the sky, `?d=12` for the day, `?grid` to show where you can walk and `?places` to outline the places.

The world version saves its progress separately from `classic.html` (it picks up from the scene you left), and keeps found secrets and deeds in the browser. For testing, add `?fast` to the link to walk six times faster; `?turbo` also lets the game take big steps when the tab is in the background.

`episodes/w01.js` is the world version of `episodes/ep01.js`: the same choices, plus staging and one more scene (coming home with the bread before going to Saber), so it has 32 scenes. A line can be words (narration), `{ who, t }` (someone speaks; `"me"` is the player), or a stage direction such as `["walk", "saber", 56, 292, 0]`, `["emote", "malak", "♥"]`, `["cam", "saber+me", 2, 900]`, `["item", "me", "bread"]` or `["cannon"]`; `["flag", "name"]` remembers something mid-scene (for the errands list). The full list is in `js/world.js` (`run`). `classic.html`, the older story-screen version, still plays `episodes/ep01.js`. `node tools/check-episode.js` checks both.

## Check an episode before it ships

```powershell
node tools/check-episode.js
```

It checks every file in `episodes/`. It fails when:

- a scene is missing or can't be reached;
- the episode loops;
- any path has fewer than 5 choices;
- any path has a different number of donation moments than the episode's `gives`;
- a donation moment doesn't have 5 options, the first free and the prices rising;
- a `{m|f}` template is broken;
- in the walking version, a place doesn't exist on the map, a choice mixes walked and tapped options, or an errand is malformed.

Day 1 has 2,700 possible paths (31 scenes in `ep01.js`, 32 in the world version). Every path has 7 choices, and 2 of them are donation moments:

1. Hagga Nemat's basket
2. the football flying at you
3. **the empty "suspended bread" board at the bakery** (first donation)
4. Rizq buying Saber's tools
5. what you say to Saber
6. **where Saber breaks his fast** (second donation)
7. where you go after iftar

## What's where

| Path | What it is |
|---|---|
| `episodes/ep01.js` | Day 1 story: text, choices, flags, places. Writers work here. |
| `js/engine.js` | Story engine: scenes, speaker faces, text reveal, choices, press-and-hold donation, recap, hub, saving progress |
| `js/scenes.js` | Living scenes: each painting plus flickering lantern light, sun glow, steam, smoke, embers, dust, pigeons, stars, passers-by, and the football |
| `js/audio.js` | Sound: ambience for each place, story sound effects, the iftar cannon, and three short music cues |
| `js/coh-bridge.js` | The only place that talks to the COH app (donate, share, analytics, haptics, user profile) |
| `js/hara-art.js`, `js/hara-props.js`, `js/hara-world.js`, `js/hara-rooms.js`, `js/map.js`, `js/world.js`, `episodes/w01.js`, `css/map.css`, `css/world.css`, `walk.html` | World version: the pixel-art hara and its rooms, people, days and light, and the story played as scenes inside it |
| `css/game.css` | Layout and motion |
| `assets/scenes/` | 12 painted places (WebP, about 80–130 KB each) |
| `assets/faces/` | 9 character portraits; Saber has two (sad and smiling) |
| `assets/sfx/` | Three generated sound clips: stairs, kids playing football, bakery chatter |
| `assets/raw/` | The original generated sheets. Kept locally and not published. |
| `tools/` | Validator, local server, asset cutter, artifact builder, previews of the walking version's pixel art |

### Art and sound sources

- The faces and scenes were generated with Higgsfield (Nano Banana) as sheets: one 3×3 sheet of faces, then three 2×2 sheets of scenes that used the face sheet as a reference, so the same people appear in the places.
- `tools/assets.html` cuts the sheets into single images and compresses them. Open http://localhost:5173/tools/assets.html while `tools/serve.js` is running and press **Run**.
- The stairs, kids and bakery clips were generated with Mirelo through Higgsfield.
- Everything else is synthesized in `js/audio.js`: the crowd beds (built from the bakery clip), oven, grill, cutlery, coins, pigeons' wings, door, plane, pouring juice, cannon, drum, and a short theme in maqam Bayati on a qanun-like string.

## Writing an episode

Each episode is one file, `episodes/epNN.js`. A scene ("node") looks like this:

```js
steps: {
  place: "steps", time: "pre", clock: "فاضل نص ساعة على المغرب",
  lines: [
    "وعلى السلم… عم صابر. وجنبه صندوق العِدّة بتاعه، مفتوح.",
    { who: "rizq", t: "«ميتين جنيه في العدة كلها يا حاج.»" },
    { who: "saber", face: "saber_smile", t: "a line where Saber smiles" },
    { if: "sign", t: "a line that only shows if the player saw the 'for sale' sign" }
  ],
  choice: { prompt: "{هتعمل|هتعملي} إيه؟", options: [
    { t: "{تتدخل|تتدخلي}", set: { stood: true }, log: "{وقفت|وقفتي} قدام المعلم رزق", next: "st_stand" }
  ]}
}
```

- `{m|f}` picks the masculine or feminine form. `{name}` is the player's name.
- `who` shows the speaker's name and face. Speakers: saber, nemat, hassan, mama, omyoussef, youssef, malak, rizq, sheikh, abuyasser. Use `face` to change the expression, for example `saber_smile`.
- `set` remembers a flag. `if: "flag"` or `if: "!flag"` shows a line or option only when the flag is (or isn't) set.
- `log` is what appears in the player's recap at the end.
- `give` is a donation moment. Each option needs a `key` and a `price`. The first option is free, and the prices rise.
- `fx` options:
  - sounds: `stairs`, `kids`, `bakery`, `street`, `basket`, `coins`, `thud`, `pour`, `clink`, `door`, `plane`, `chime`, `drum`;
  - sound plus a moment drawn on the picture: `ball`, `kick`, `catch`, `hush`, `cannon`.
- `go` switches the picture in the middle of a node.
- Places: home, alley, bakery, steps, table, steps_iftar, fulcart, koshari, kebab, mosque, roof, workshop.
- Times: asr, pre, maghrib, night. A place painted in daylight that is used at `night` is darkened automatically, and its lanterns glow brighter.
- Episode fields:
  - `gives`: the number of donation moments on every path;
  - `cover`: the painting behind the title card;
  - `endFace`: the portrait on the end screen;
  - `next.face`: the portrait in the teaser for the next episode.

## COH integration (for the app team)

The game runs as a web page inside a COH WebView. It never touches money or card details.

The game posts JSON messages to COH:

```
{ type: "donate", id, episode, option, amount, currency: "EGP" }
{ type: "share",  id, episode, title, text }
{ type: "user",   id }                      // optional: COH returns { name, gender: "m" | "f" }
{ type: "track",  name, props }             // analytics events
{ type: "haptic", kind: "light" | "heavy" }
```

COH replies with `window.COH.receive({ id, status: "paid" | "cancelled" | "failed" | "shared" | "ok" })`.

The bridge detects React Native, Flutter InAppWebView, an iOS `WKScriptMessageHandler` named `coh`, or an Android JS interface named `CohAndroid`. Outside COH, the game shows a mock donation screen, and no money moves.

Analytics events:

- `episode_start`, `episode_resume`
- `choice`
- `give`, sent for each donation moment with its status
- `episode_complete`, with every option chosen and the total paid
- `share`

## Still placeholder in this prototype

- **Art:** AI-generated paintings, good enough for a pitch. For launch, an illustrator should paint or retouch them in the same style. One example: the boy's shirt shows a small sports-brand-like logo.
- **Sound:** three generated clips plus synthesized effects. Recorded Cairo ambience and a composed theme would be the next step up.
- **Campaign names:** the start notice still shows "[اسم الحملة]".
- **Counter:** the "players helped tonight" number is a sample.
- **Daily unlock:** each episode opens 2 hours before Maghrib (Cairo time), with one notification. That isn't wired yet, because Day 1 is the only episode so far.
- **Fonts:** load from Google Fonts. For production, host them alongside the game.

## Shareable links

**Public link (any phone, no sign-in):** https://youssefaymanefb.github.io/lanterns-of-the-hara/

- It opens the world version (`index.html` forwards to `walk.html`). The older story-screen version is still at https://youssefaymanefb.github.io/lanterns-of-the-hara/classic.html.

- It's hosted on GitHub Pages from the `main` branch of [YoussefAymanEFB/lanterns-of-the-hara](https://github.com/YoussefAymanEFB/lanterns-of-the-hara).
- Anyone with the link can play it, and the repository is public. The page asks search engines not to list it.
- To update the live game, commit and push to `main`. The site refreshes in about a minute.

**claude.ai link (private, older version):** `artifact.html` is generated from `classic.html` and was used for the first code-drawn prototype.
