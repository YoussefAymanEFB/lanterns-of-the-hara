#!/usr/bin/env node
/*
  Checks every episode file in episodes/ before it ships.
    node tools/check-episode.js

  Rules:
    - every node has exactly one way out: next, choice, give, or end
    - every "next" points at a node that exists, and every node can be reached
    - no loops (each episode is a one-way walk through the hara)
    - every path from start to an end passes through at least 5 choices
    - every path passes through exactly ep.gives donation choices (give), 1 if not set
    - each give has 5 options, the first free, prices rising
    - {m|f} and {name} templates are well formed
    - walking version: walk spots exist on the map, walked choices are walked all the way, quests are well formed
*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const MIN_CHOICES = 5;
const root = path.resolve(__dirname, "..");
const dir = path.join(root, "episodes");
const sandbox = { window: {} };
sandbox.HARA = sandbox.window.HARA = { episodes: {} };
vm.createContext(sandbox);

const files = fs.readdirSync(dir).filter((f) => /^ep\d+\.js$/.test(f)).sort();
for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), sandbox, { filename: f });

const PLACES = ["home", "alley", "bakery", "steps", "table", "steps_iftar", "fulcart", "koshari", "kebab", "mosque", "roof", "workshop"];
const TIMES = ["asr", "pre", "maghrib", "night"];
const WTIMES = TIMES.concat(["suhoor"]); // the world version also has suhoor (2–3 AM); the classic story screens don't
// places on the walkable map (SPOTS in js/hara-world.js) and painted faces (assets/faces)
const SPOTS = ["home", "roof", "kids", "bakery", "workshop", "fulcart", "koshari", "kebab", "square", "steps", "mosque", "cafe", "tent"];
const FACES = ["saber", "saber_smile", "nemat", "hassan", "mama", "omyoussef", "youssef", "nourah", "rizq"];
let failed = false;

function texts(node) {
  const out = [];
  (node.lines || []).forEach((l) => out.push(typeof l === "string" ? l : l.t));
  const ch = node.choice || node.give;
  if (ch) { out.push(ch.prompt); ch.options.forEach((o) => { out.push(o.t); if (o.log) out.push(o.log); }); }
  return out.filter(Boolean);
}

for (const ep of Object.values(sandbox.HARA.episodes)) {
  const errors = [];
  const nodes = ep.nodes || {};
  const ids = Object.keys(nodes);
  const GIVES = ep.gives || 1;
  if (!nodes[ep.start]) errors.push(`start node "${ep.start}" does not exist`);

  for (const id of ids) {
    const n = nodes[id];
    const exits = ["next", "choice", "give", "end"].filter((k) => n[k]);
    if (exits.length !== 1) errors.push(`${id}: needs exactly one of next/choice/give/end (has ${exits.join(", ") || "none"})`);
    if (!PLACES.includes(n.place)) errors.push(`${id}: unknown place "${n.place}"`);
    if (!TIMES.includes(n.time)) errors.push(`${id}: unknown time "${n.time}"`);
    if (!n.lines || !n.lines.length) errors.push(`${id}: has no lines`);
    (n.lines || []).forEach((l, i) => {
      if (l && l.go && l.go.place && !PLACES.includes(l.go.place)) errors.push(`${id} line ${i + 1}: unknown place "${l.go.place}"`);
    });
    if (n.next && !nodes[n.next]) errors.push(`${id}: next "${n.next}" does not exist`);
    const ch = n.choice || n.give;
    if (ch) {
      if (ch.options.length < 2) errors.push(`${id}: a choice needs at least 2 options`);
      if (!ch.options.some((o) => !o.if)) errors.push(`${id}: at least one option must always be available`);
      ch.options.forEach((o) => { if (!nodes[o.next]) errors.push(`${id}: option "${o.t}" goes to missing node "${o.next}"`); });
    }
    if (n.give) {
      n.give.options.forEach((o) => { if (!o.key) errors.push(`${id}: every give option needs a key`); });
      const p = n.give.options.map((o) => o.price);
      if (p.length !== 5) errors.push(`${id}: give should have 5 options (has ${p.length})`);
      if (p[0] !== 0) errors.push(`${id}: the first give option should be free`);
      for (let i = 1; i < p.length; i++) if (!(p[i] > p[i - 1])) errors.push(`${id}: give prices should rise`);
    }
    // walking version (walk.html)
    if (n.walk) {
      if (!SPOTS.includes(n.walk.to)) errors.push(`${id}: walk.to "${n.walk.to}" is not a place on the map`);
      if (n.walk.goal && !SPOTS.includes(n.walk.goal)) errors.push(`${id}: walk.goal "${n.walk.goal}" is not a place on the map`);
      if (!n.walk.task) errors.push(`${id}: walk needs a task (what the player is asked to do)`);
    }
    if (ch && ch.options.some((o) => o.walk)) {
      if (n.give) errors.push(`${id}: donation choices can't be walked to`);
      if (!ch.options.every((o) => o.walk)) errors.push(`${id}: if one option is walked to, every option must be`);
      ch.options.forEach((o) => { if (o.walk && !SPOTS.includes(o.walk)) errors.push(`${id}: option walk "${o.walk}" is not a place on the map`); });
    }
    for (const t of texts(n).concat(n.walk && n.walk.task ? [n.walk.task] : [])) {
      const stripped = t.replace(/\{name\}/g, "").replace(/\{[^{}|]*\|[^{}]*\}/g, "");
      if (/[{}|]/.test(stripped)) errors.push(`${id}: broken template in "${t}"`);
    }
  }

  // Walk every path: count choices and gives, find loops and unreachable nodes.
  const seen = new Set();
  let paths = 0, minChoices = Infinity, maxChoices = 0;
  function walk(id, stack, choices, gives) {
    if (stack.includes(id)) { errors.push(`loop: ${stack.concat(id).join(" -> ")}`); return; }
    const n = nodes[id];
    if (!n) return;
    seen.add(id);
    const s = stack.concat(id);
    if (n.end) {
      paths++;
      minChoices = Math.min(minChoices, choices);
      maxChoices = Math.max(maxChoices, choices);
      if (choices < MIN_CHOICES) errors.push(`path with only ${choices} choices: ${s.join(" -> ")}`);
      if (gives !== GIVES) errors.push(`path with ${gives} donation choices (needs ${GIVES}): ${s.join(" -> ")}`);
      return;
    }
    if (n.next) return walk(n.next, s, choices, gives);
    const ch = n.choice || n.give;
    if (ch) ch.options.forEach((o) => walk(o.next, s, choices + 1, gives + (n.give ? 1 : 0)));
  }
  (ep.quests || []).forEach((q, i) => {
    if (!q.t || !q.done) errors.push(`quest ${i + 1}: needs t and done`);
    if (q.from && !FACES.includes(q.from)) errors.push(`quest ${i + 1}: "${q.from}" has no portrait`);
    const stripped = (q.t || "").replace(/\{name\}/g, "").replace(/\{[^{}|]*\|[^{}]*\}/g, "");
    if (/[{}|]/.test(stripped)) errors.push(`quest ${i + 1}: broken template in "${q.t}"`);
  });

  if (nodes[ep.start]) walk(ep.start, [], 0, 0);
  ids.filter((id) => !seen.has(id)).forEach((id) => errors.push(`node "${id}" can't be reached`));

  const label = `Episode ${ep.id} (${ep.title})`;
  if (errors.length) {
    failed = true;
    console.log(`✗ ${label}`);
    errors.slice(0, 40).forEach((e) => console.log("   - " + e));
    if (errors.length > 40) console.log(`   ... and ${errors.length - 40} more`);
  } else {
    console.log(`✓ ${label}: ${ids.length} nodes, ${paths} paths, ${minChoices}–${maxChoices} choices per path, ${GIVES} donation moments on every path`);
  }
}

if (!files.length) { console.log("No episode files found in episodes/"); failed = true; }

/* ---------- the world version: episodes/wNN.js, played inside the hara (walk.html, js/world.js) ---------- */
const ROOMS = ["home", "bakery", "mosque", "koshari", "kebab", "workshop", "roof"];
const LOCS = ["hara"].concat(ROOMS);
const CMDS = ["cam", "track", "free", "walk", "step", "face", "emote", "jump", "pose", "item", "shiver", "wait", "sfx", "fx", "music", "bed", "hush", "time",
  "repop", "fade", "flash", "shake", "burst", "spawn", "gone", "place", "clearAt", "follow", "prop", "tween", "count", "go", "says", "ball", "card", "crowd", "pray", "cannon", "flag", "fn"];
sandbox.HARA.worldEpisodes = {};
const wfiles = fs.readdirSync(dir).filter((f) => /^w\d+\.js$/.test(f)).sort();
for (const f of wfiles) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), sandbox, { filename: f });
function goalOk(g) {
  if (!g) return "missing";
  if (g.enter) return ROOMS.includes(g.enter) ? "" : `unknown room "${g.enter}"`;
  if (!LOCS.includes(g.loc || "hara")) return `unknown place "${g.loc}"`;
  if ((g.loc || "hara") === "hara" && !g.zone && !SPOTS.includes(g.spot)) return `spot "${g.spot}" is not on the map`;
  return "";
}
for (const ep of Object.values(sandbox.HARA.worldEpisodes)) {
  const errors = [], nodes = ep.nodes || {}, ids = Object.keys(nodes), GIVES = ep.gives || 1;
  if (!nodes[ep.start]) errors.push(`start node "${ep.start}" does not exist`);
  const tpl = (id, t) => { const st = String(t).replace(/\{name\}/g, "").replace(/\{[^{}|]*\|[^{}]*\}/g, ""); if (/[{}|]/.test(st)) errors.push(`${id}: broken template in "${t}"`); };
  function lines(id, list) {
    (list || []).forEach((l, i) => {
      if (typeof l === "string") return tpl(id, l);
      if (Array.isArray(l)) {
        const c = String(l[0]).replace(/&$/, "");
        if (!CMDS.includes(c)) errors.push(`${id} line ${i + 1}: unknown stage direction "${l[0]}"`);
        if (c === "go" && !LOCS.includes(l[1])) errors.push(`${id} line ${i + 1}: can't go to "${l[1]}"`);
        if (c === "time" && !WTIMES.includes(l[1])) errors.push(`${id} line ${i + 1}: unknown time "${l[1]}"`);
        return;
      }
      if (l.do) return lines(id, l.do);
      if (l.t) tpl(id, l.t);
      if (l.face && !FACES.includes(l.face)) errors.push(`${id} line ${i + 1}: no portrait "${l.face}"`);
    });
  }
  for (const id of ids) {
    const n = nodes[id];
    const exits = ["next", "choice", "give", "end"].filter((k) => n[k]);
    if (exits.length !== 1) errors.push(`${id}: needs exactly one of next/choice/give/end (has ${exits.join(", ") || "none"})`);
    if (!LOCS.includes(n.loc)) errors.push(`${id}: unknown place "${n.loc}"`);
    if (!WTIMES.includes(n.time)) errors.push(`${id}: unknown time "${n.time}"`);
    if (!n.lines || !n.lines.length) errors.push(`${id}: has no lines`);
    lines(id, n.lines);
    if (n.next && !nodes[n.next]) errors.push(`${id}: next "${n.next}" does not exist`);
    if (n.walk) { const e = goalOk(n.walk.to); if (e) errors.push(`${id}: walk.to ${e}`); if (!n.walk.task) errors.push(`${id}: walk needs a task`); else tpl(id, n.walk.task); }
    const ch = n.choice || n.give;
    if (ch) {
      tpl(id, ch.prompt);
      if (ch.options.length < 2) errors.push(`${id}: a choice needs at least 2 options`);
      if (!ch.options.some((o) => !o.if)) errors.push(`${id}: at least one option must always be available`);
      ch.options.forEach((o) => { tpl(id, o.t); if (o.log) tpl(id, o.log); if (!nodes[o.next]) errors.push(`${id}: option "${o.t}" goes to missing node "${o.next}"`); });
      if (ch.walk) ch.options.forEach((o) => { const e = goalOk(o.walk); if (e) errors.push(`${id}: walked option "${o.t}": ${e}`); });
    }
    if (n.give) {
      const p = n.give.options.map((o) => o.price);
      if (p.length !== 5) errors.push(`${id}: give should have 5 options (has ${p.length})`);
      if (p[0] !== 0) errors.push(`${id}: the first give option should be free`);
      for (let i = 1; i < p.length; i++) if (!(p[i] > p[i - 1])) errors.push(`${id}: give prices should rise`);
      n.give.options.forEach((o) => { if (!o.key) errors.push(`${id}: every give option needs a key`); });
    }
  }
  const seen = new Set();
  let paths = 0, minC = Infinity, maxC = 0;
  (function walk(id, stack, choices, gives) {
    if (stack.includes(id)) { errors.push(`loop: ${stack.concat(id).join(" -> ")}`); return; }
    const n = nodes[id];
    if (!n) return;
    seen.add(id);
    const st = stack.concat(id);
    if (n.end) {
      paths++; minC = Math.min(minC, choices); maxC = Math.max(maxC, choices);
      if (choices < MIN_CHOICES) errors.push(`path with only ${choices} choices: ${st.join(" -> ")}`);
      if (gives !== GIVES) errors.push(`path with ${gives} donation choices (needs ${GIVES}): ${st.join(" -> ")}`);
      return;
    }
    if (n.next) return walk(n.next, st, choices, gives);
    const ch = n.choice || n.give;
    if (ch) ch.options.forEach((o) => walk(o.next, st, choices + 1, gives + (n.give ? 1 : 0)));
  })(ep.start, [], 0, 0);
  ids.filter((id) => !seen.has(id)).forEach((id) => errors.push(`node "${id}" can't be reached`));
  const label = `World episode ${ep.id} (${ep.title})`;
  if (errors.length) { failed = true; console.log(`✗ ${label}`); errors.slice(0, 40).forEach((e) => console.log("   - " + e)); }
  else console.log(`✓ ${label}: ${ids.length} nodes, ${paths} paths, ${minC}–${maxC} choices per path, ${GIVES} donation moments on every path`);
}
process.exit(failed ? 1 : 0);
