# فوانيس الحارة · Lanterns of the Hara

A 30-episode interactive Ramadan series for EFB's COH app. Each day of Ramadan, the player walks through one hara, meets a neighbor who needs help, and makes at least five choices. Each episode sets how many of those choices are donation moments (`gives`, which defaults to 1). Each donation moment offers a free option and four amounts of real money.

This folder holds the **Day 1 prototype** (عم صابر) and the engine the other 29 episodes will use.

## Run it

- Quickest option: open `index.html` in a browser. Fonts load from Google, so you need internet.
- Local server, which also lets you test on a phone on the same Wi-Fi:

```powershell
node tools/serve.js
```

  Then open http://localhost:5173. The server also prints a link for phones on the same Wi-Fi, such as `http://192.168.1.20:5173`. If the phone can't load that link, Windows Firewall is blocking port 5173 on that network.

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
- a `{m|f}` template is broken.

Day 1 has 31 scenes and 2,700 possible paths. Every path has 7 choices, and 2 of them are donation moments:

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
| `css/game.css` | Layout and motion |
| `assets/scenes/` | 12 painted places (WebP, about 80–130 KB each) |
| `assets/faces/` | 9 character portraits; Saber has two (sad and smiling) |
| `assets/sfx/` | Three generated sound clips: stairs, kids playing football, bakery chatter |
| `assets/raw/` | The original generated sheets. Kept locally and not published. |
| `tools/` | Validator, local server, asset cutter, artifact builder |

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

- It's hosted on GitHub Pages from the `main` branch of [YoussefAymanEFB/lanterns-of-the-hara](https://github.com/YoussefAymanEFB/lanterns-of-the-hara).
- Anyone with the link can play it, and the repository is public. The page asks search engines not to list it.
- To update the live game, commit and push to `main`. The site refreshes in about a minute.

**claude.ai link (private, older version):** `artifact.html` is generated from `index.html` and was used for the first code-drawn prototype.
