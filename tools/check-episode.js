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
    for (const t of texts(n)) {
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
process.exit(failed ? 1 : 0);
