# فوانيس الحارة · Lanterns of the Hara

A 30-episode interactive Ramadan series for EFB's COH app. Each day of Ramadan, the player walks through one hara, meets a neighbor who needs help, and makes at least five choices. Exactly one of those choices is the donation choice, which can be free or real money.

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
- any path has fewer than 5 choices, or doesn't have exactly one donation choice;
- a `{m|f}` template is broken.

Day 1 currently has 28 scenes and 1,080 possible paths, with 7 choices on every path.

## What's where

| Path | What it is |
|---|---|
| `episodes/ep01.js` | Day 1 story: text, choices, flags, places. Writers work here. |
| `js/engine.js` | Story engine: scenes, text reveal, choices, press-and-hold donation, recap, hub, saving progress |
| `js/art.js` | The hara drawn in code (13 places × 4 times of day). Placeholder for final illustrations. |
| `js/audio.js` | Sound made in the browser: street hum, oud in maqam Bayati, iftar cannon, mesaharaty drum, lantern chime |
| `js/coh-bridge.js` | The only place that talks to the COH app (donate, share, analytics, haptics, user profile) |
| `css/game.css` | Layout and motion |
| `tools/` | Validator, local server, artifact builder |

## Writing an episode

Each episode is one file, `episodes/epNN.js`. A scene ("node") looks like this:

```js
corner: {
  place: "corner", time: "pre", show: ["saber"], clock: "فاضل ربع ساعة على المغرب",
  lines: [
    "عم صابر لسه مكانه على السلم.",
    { who: "saber", t: "«الساعة كام يا {ابني|بنتي}؟»" },
    { if: "knows", t: "a line that only shows if the player asked عم حسن earlier" }
  ],
  choice: { prompt: "{هتعمل|هتعملي} إيه؟", options: [
    { t: "{تقعد جنبه|تقعدي جنبه}", set: { sat: true }, log: "{قعدت|قعدتي} جنبه", next: "c_sit" }
  ]}
}
```

- `{m|f}` picks the masculine or feminine form. `{name}` is the player's name.
- `set` remembers a flag. `if: "flag"` or `if: "!flag"` shows a line or option only when the flag is (or isn't) set.
- `log` is what appears in the player's recap at the end.
- `give` is the donation choice: five options, the first free, with prices rising.
- `fx`: `"cannon"`, `"hush"`, `"chime"`, `"drum"`. `go` switches the scene in the middle of a node.
- Places: home, street, alley, bakery, corner, koshk, fulcart, table, koshari, kebab, mosque, roof, workshop.
- Times: asr, pre, maghrib, night.

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

Analytics events: `episode_start`, `episode_resume`, `choice`, `give` (with status), `episode_complete`, `share`.

## Still placeholder in this prototype

- **Art:** drawn in code. The final illustrations replace `HARA.art.scene()`.
- **Sound:** synthesized. Recorded ambience and a composed theme can replace it through the same calls.
- **Campaign names:** the start notice still shows "[اسم الحملة]".
- **Counter:** the "players helped tonight" number is a sample.
- **Daily unlock:** every episode opens at Fajr, but that isn't wired yet, because Day 1 is the only episode so far.
- **Fonts:** load from Google Fonts. For production, host them alongside the game.

## Shareable links

**Public link (any phone, no sign-in):** https://youssefaymanefb.github.io/lanterns-of-the-hara/

It is hosted on GitHub Pages from the `main` branch of [YoussefAymanEFB/lanterns-of-the-hara](https://github.com/YoussefAymanEFB/lanterns-of-the-hara). Anyone with the link can play it, and the repository is public. The page asks search engines not to list it. To update the live game, commit and push to `main`. The site refreshes in about a minute.

**claude.ai link (private):** `artifact.html` is generated from `index.html` and used to publish the prototype as a claude.ai link:

```powershell
node tools/build-artifact.js
```
