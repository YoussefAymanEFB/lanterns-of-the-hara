/*
  فوانيس الحارة · living scenes
  ------------------------------------------------------------
  Each place is one painted image (assets/scenes/<id>.webp) plus a "life" layer drawn on top:
  flickering lantern light, sun glow, steam and smoke, embers, dust in the light, pigeons,
  twinkling stars, and blurred passers-by crossing in front of the camera.

  All positions are fractions (0–1) of the square painting, so the life layer stays glued to the
  picture however the stage is cropped. HARA.art.layout() keeps the square "world" covering the stage
  with the scene's focus point in view (same idea as CSS object-position).

  Add ?debug to the URL to outline every light.
*/
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};
  var DEBUG = /[?&]debug\b/.test(location.search);
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var WARM = "255,196,110", FIRE = "255,140,60", SUN = "255,214,150", BULB = "255,226,160", PALE = "220,230,255";

  function bulbs(points, r, colors) {
    return points.map(function (p, i) { return [p[0], p[1], r, colors ? colors[i % colors.length] : BULB, "bulb"]; });
  }

  // [x, y, radius, rgb, kind]  kinds: lantern (warm flicker), bulb (twinkle), fire (fast flicker), sun (slow breath), lamp (steady)
  var SCENES = {
    home: { name: "البيت", focus: [0.62, 0.45], painted: "asr",
      glows: [[0.05, 0.56, 0.09, WARM, "lantern"], [0.2, 0.13, 0.22, SUN, "sun"]],
      dust: [0.12, 0.05, 0.5, 0.62, 22] },
    alley: { name: "الحارة", focus: [0.42, 0.7], painted: "asr",
      glows: [[0.43, 0.2, 0.07, WARM, "lantern"], [0.447, 0.43, 0.04, WARM, "lantern"], [0.76, 0.8, 0.07, WARM, "lantern"], [0.45, 0.36, 0.26, SUN, "sun"]],
      birds: [0.03, 0.26], walkers: 1, ballFrom: [0.437, 0.915] },
    bakery: { name: "فرن عم حسن", focus: [0.55, 0.6], painted: "pre",
      glows: [[0.07, 0.37, 0.17, FIRE, "fire"], [0.07, 0.37, 0.07, "255,200,120", "fire"]],
      embers: [[0.08, 0.36]], dust: [0.3, 0.08, 0.78, 0.55, 26, "flour"], steam: [[0.46, 0.27, 1.4]], walkers: 0.5 },
    steps: { name: "سلم الجامع", focus: [0.45, 0.62], painted: "pre",
      glows: [[0.075, 0.12, 0.07, WARM, "lantern"], [0.36, 0.135, 0.07, WARM, "lantern"], [0.066, 0.57, 0.06, WARM, "lantern"],
        [0.525, 0.264, 0.035, WARM, "lantern"], [0.482, 0.322, 0.035, WARM, "lantern"],
        [0.82, 0.34, 0.045, WARM, "lantern"], [0.9, 0.38, 0.045, WARM, "lantern"], [0.97, 0.34, 0.045, WARM, "lantern"]],
      stars: [0.42, 0, 1, 0.22, 16], walkers: 1 },
    table: { name: "مائدة الرحمن", focus: [0.5, 0.48], painted: "maghrib",
      glows: [[0.5, 0.135, 0.085, WARM, "lantern"], [0.064, 0.185, 0.06, WARM, "lantern"], [0.93, 0.185, 0.06, WARM, "lantern"], [0.5, 0.33, 0.18, SUN, "sun"]]
        .concat(bulbs([[0.245, 0.17], [0.3, 0.16], [0.355, 0.15], [0.415, 0.145], [0.58, 0.15], [0.63, 0.17], [0.685, 0.19], [0.74, 0.2]], 0.022)),
      steam: [[0.48, 0.76, 1.2], [0.47, 0.88, 1]] },
    steps_iftar: { name: "سلم الجامع", focus: [0.62, 0.45], painted: "maghrib",
      glows: [[0.18, 0.15, 0.08, WARM, "lantern"], [0.58, 0.08, 0.04, WARM, "lantern"], [0.28, 0.38, 0.2, SUN, "sun"]] },
    fulcart: { name: "عربية عم سيد", focus: [0.55, 0.5], painted: "maghrib",
      glows: [[0.81, 0.165, 0.07, WARM, "lantern"]]
        .concat(bulbs([[0.146, 0.095], [0.24, 0.1], [0.337, 0.105], [0.436, 0.1], [0.55, 0.1], [0.68, 0.095], [0.43, 0.18], [0.475, 0.19], [0.53, 0.19], [0.585, 0.185], [0.645, 0.18]], 0.025)),
      steam: [[0.4, 0.4, 1.6]], stars: [0.25, 0, 0.75, 0.1, 6], walkers: 0.6 },
    koshari: { name: "كشري أبو ياسر", focus: [0.62, 0.55], painted: "maghrib",
      glows: [[0.205, 0.07, 0.07, WARM, "lamp"], [0.525, 0.085, 0.07, WARM, "lamp"], [0.82, 0.045, 0.07, WARM, "lamp"]],
      steam: [[0.55, 0.5, 1.3], [0.12, 0.47, 0.8]] },
    kebab: { name: "كبابجي الحارة", focus: [0.5, 0.45], painted: "night",
      glows: [[0.3, 0.09, 0.05, BULB, "bulb"], [0.5, 0.11, 0.05, BULB, "bulb"], [0.89, 0.1, 0.05, BULB, "bulb"],
        [0.16, 0.41, 0.13, FIRE, "fire"], [0.75, 0.39, 0.11, FIRE, "fire"]],
      smoke: [[0.18, 0.36], [0.78, 0.31]], embers: [[0.16, 0.4], [0.75, 0.38]], stars: [0, 0, 0.6, 0.2, 10] },
    mosque: { name: "الجامع", focus: [0.5, 0.6], painted: "night",
      glows: [[0.074, 0.19, 0.06, WARM, "lamp"], [0.21, 0.26, 0.05, WARM, "lamp"], [0.33, 0.32, 0.05, WARM, "lamp"], [0.51, 0.2, 0.08, WARM, "lamp"],
        [0.67, 0.32, 0.05, WARM, "lamp"], [0.79, 0.26, 0.05, WARM, "lamp"], [0.92, 0.2, 0.06, WARM, "lamp"]],
      dust: [0.2, 0.1, 0.8, 0.6, 14] },
    roof: { name: "السطوح", focus: [0.5, 0.62], painted: "night",
      glows: [[0.49, 0.22, 0.09, WARM, "lantern"], [0.39, 0.64, 0.05, WARM, "lantern"], [0.59, 0.75, 0.05, WARM, "lantern"], [0.77, 0.6, 0.04, WARM, "lantern"], [0.81, 0.1, 0.07, PALE, "lamp"]]
        .concat(bulbs([[0.018, 0.222], [0.078, 0.228], [0.14, 0.222], [0.194, 0.211], [0.254, 0.188], [0.315, 0.165], [0.397, 0.108], [0.454, 0.068], [0.517, 0.074],
          [0.574, 0.091], [0.625, 0.125], [0.682, 0.154], [0.739, 0.177], [0.796, 0.194], [0.853, 0.2], [0.916, 0.194], [0.973, 0.194]], 0.022,
          ["255,150,90", "255,215,110", "130,225,160", "255,130,180", "140,205,255"])),
      stars: [0, 0, 1, 0.3, 26] },
    workshop: { name: "ورشة عم صابر", focus: [0.62, 0.55], painted: "night",
      glows: [[0.507, 0.13, 0.16, BULB, "lamp"]], dust: [0.3, 0.12, 0.72, 0.62, 18], bulbFlicker: true }
  };

  var places = {};
  Object.keys(SCENES).forEach(function (k) { places[k] = { name: SCENES[k].name }; });

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pct(v) { return (v * 100).toFixed(2) + "%"; }

  /* ---------- pigeons and passers-by (SVG silhouettes) ---------- */
  var BIRD = '<svg viewBox="0 0 40 20" aria-hidden="true"><g fill="#3b3550"><ellipse cx="20" cy="12" rx="7" ry="3.2"/><circle cx="27" cy="10.5" r="2.4"/>' +
    '<path class="wing" d="M20 11 C14 2 7 1 1 4 C8 6 13 9 18 13 Z"/><path class="wing w2" d="M20 11 C26 2 33 1 39 4 C32 6 27 9 22 13 Z"/></g></svg>';
  var BALL = '<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="47" fill="#f4f1ea" stroke="#2a2733" stroke-width="3"/>' +
    '<path d="M0-17 16-5 10 14H-10L-16-5Z" fill="#2a2733"/><path d="M0-17V-44M16-5 42-14M10 14 26 38M-10 14-26 38M-16-5-42-14" stroke="#2a2733" stroke-width="3" fill="none"/>' +
    '<path d="M-14-44 0-47 14-44 8-36H-8Z M42-14 46 2 40 16 34 6Z M-42-14-46 2-40 16-34 6Z M26 38 12 45 6 36 18 30Z M-26 38-12 45-6 36-18 30Z" fill="#2a2733"/></svg>';
  var WALKERS = [
    // man in galabeya and cap
    '<svg viewBox="0 0 100 220" aria-hidden="true"><path fill="currentColor" d="M50 8c9 0 15 6 15 15s-6 17-15 17-15-8-15-17 6-15 15-15zM34 14c4-7 28-7 32 0-3 2-29 2-32 0zM28 50c6-6 38-6 44 0l10 60 6 110H12l6-110z"/></svg>',
    // woman in headscarf with a shopping bag
    '<svg viewBox="0 0 110 220" aria-hidden="true"><path fill="currentColor" d="M50 6c12 0 20 9 20 21 0 9-4 15-8 19l14 8 8 58 6 108H16l6-108 8-58 12-8c-5-4-10-10-10-19 0-12 8-21 18-21z"/><path fill="currentColor" d="M86 104h20l3 34H83z"/></svg>',
    // kid running
    '<svg viewBox="0 0 100 220" aria-hidden="true"><path fill="currentColor" d="M52 70c8 0 13 5 13 13s-5 14-13 14-13-6-13-14 5-13 13-13zM38 104h30l8 50-8 6 10 60H62l-8-48-10 48H30l8-60-8-6z"/></svg>'
  ];

  /* ---------- scene ---------- */
  function Scene(place, time) {
    var d = SCENES[place] || SCENES.alley;
    this.d = d; this.place = place; this.time = time; this.timers = []; this.anims = [];
    var root = this.root = el("div", "scene scene-" + place + " t-" + time);
    var world = this.world = el("div", "world", root);
    if (!REDUCED) world.style.animationDelay = (-rnd(0, 20)).toFixed(1) + "s";
    var img = el("img", "paint", world);
    img.alt = ""; img.decoding = "async"; img.src = "assets/scenes/" + place + ".webp";
    var night = time === "night" && d.painted !== "night";
    if (night) el("div", "tint tint-night", world);
    var light = el("div", "lights" + (night ? " boost" : ""), world);
    this.fxLayer = el("div", "fxl", world);
    (d.glows || []).forEach(function (g) {
      var e = el("i", "glow g-" + g[4], light);
      e.style.left = pct(g[0]); e.style.top = pct(g[1]);
      e.style.width = e.style.height = pct(g[2] * 2);
      e.style.setProperty("--c", g[3]);
      e.style.animationDuration = (g[4] === "fire" ? rnd(0.9, 1.6) : g[4] === "bulb" ? rnd(2.5, 5) : rnd(2.2, 3.8)).toFixed(2) + "s";
      e.style.animationDelay = (-rnd(0, 4)).toFixed(2) + "s";
      if (DEBUG) e.classList.add("dbg");
    });
    if (d.bulbFlicker) el("div", "bulb-dim", world);
    if (d.dust) this.dust(d.dust);
    (d.steam || []).forEach(function (s) { this.steam(s[0], s[1], s[2] || 1, false); }, this);
    (d.smoke || []).forEach(function (s) { this.steam(s[0], s[1], 1.8, true); }, this);
    (d.embers || []).forEach(function (s) { this.embers(s[0], s[1]); }, this);
    if (d.stars && (d.painted === "night" || time === "night" || place === "steps")) this.stars(d.stars, place === "steps" && time !== "night" ? 0.45 : 1);
    this.walkLayer = el("div", "walkers", root);
    if (!REDUCED) {
      if (d.birds && time !== "night") this.loop(function () { this.birds(d.birds); }, 3000, 9000, 16000);
      if (d.walkers) this.loop(function () { this.walker(); }, 2500, 9000 / d.walkers, 17000 / d.walkers);
    }
  }
  Scene.prototype.loop = function (fn, first, min, max) {
    var self = this;
    function go() { if (self.dead) return; fn.call(self); self.timers.push(setTimeout(go, rnd(min, max))); }
    this.timers.push(setTimeout(go, first));
  };
  Scene.prototype.dust = function (r) {
    var n = REDUCED ? 0 : r[4];
    for (var i = 0; i < n; i++) {
      var m = el("i", "mote" + (r[5] === "flour" ? " flour" : ""), this.fxLayer);
      m.style.left = pct(rnd(r[0], r[2])); m.style.top = pct(rnd(r[1], r[3]));
      var s = rnd(2, 4.5); m.style.width = m.style.height = s.toFixed(1) + "px";
      m.style.animationDuration = rnd(7, 14).toFixed(1) + "s";
      m.style.animationDelay = (-rnd(0, 14)).toFixed(1) + "s";
    }
  };
  Scene.prototype.steam = function (x, y, size, smoke) {
    var n = REDUCED ? 1 : 4;
    for (var i = 0; i < n; i++) {
      var p = el("i", smoke ? "puff smoke" : "puff", this.fxLayer);
      p.style.left = pct(x + rnd(-0.015, 0.015)); p.style.top = pct(y);
      p.style.width = p.style.height = pct(0.07 * size);
      p.style.animationDuration = (smoke ? rnd(5, 7) : rnd(3.4, 4.6)).toFixed(2) + "s";
      p.style.animationDelay = (-(i * (smoke ? 1.5 : 1.1)) - rnd(0, 0.5)).toFixed(2) + "s";
    }
  };
  Scene.prototype.embers = function (x, y) {
    if (REDUCED) return;
    for (var i = 0; i < 9; i++) {
      var e = el("i", "ember", this.fxLayer);
      e.style.left = pct(x + rnd(-0.04, 0.04)); e.style.top = pct(y + rnd(-0.02, 0.03));
      e.style.setProperty("--dx", rnd(-18, 18).toFixed(0) + "px");
      e.style.animationDuration = rnd(1.6, 3).toFixed(2) + "s";
      e.style.animationDelay = (-rnd(0, 3)).toFixed(2) + "s";
    }
  };
  Scene.prototype.stars = function (r, alpha) {
    for (var i = 0; i < r[4]; i++) {
      var s = el("i", "star", this.fxLayer);
      s.style.left = pct(rnd(r[0], r[2])); s.style.top = pct(rnd(r[1], r[3]));
      s.style.setProperty("--a", alpha);
      s.style.animationDuration = rnd(2, 5).toFixed(1) + "s";
      s.style.animationDelay = (-rnd(0, 5)).toFixed(1) + "s";
    }
  };
  Scene.prototype.birds = function (band) {
    var n = Math.round(rnd(1, 3.4)), ltr = Math.random() < 0.5, y = rnd(band[0], band[1]);
    for (var i = 0; i < n; i++) {
      var b = el("div", "bird", this.fxLayer);
      b.innerHTML = BIRD; // constant markup
      if (!ltr) b.style.transform = "scaleX(-1)";
      var by = y + rnd(-0.04, 0.04), dur = rnd(5.5, 8.5) * 1000, delay = i * rnd(150, 500);
      b.style.top = pct(by); b.style.width = pct(rnd(0.03, 0.045));
      var a = b.animate([
        { left: ltr ? "-6%" : "104%", marginTop: "0%" },
        { left: "50%", marginTop: rnd(-4, 2).toFixed(1) + "%" },
        { left: ltr ? "106%" : "-8%", marginTop: rnd(-6, 0).toFixed(1) + "%" }
      ], { duration: dur, delay: delay, easing: "linear", fill: "both" });
      this.track(a, b);
    }
  };
  Scene.prototype.walker = function () {
    if (this.hushed) return;
    var w = el("div", "walker", this.walkLayer), ltr = Math.random() < 0.5;
    w.innerHTML = WALKERS[Math.floor(Math.random() * WALKERS.length)]; // constant markup
    var big = rnd(0.95, 1.25);
    w.style.height = (62 * big).toFixed(0) + "%";
    if (!ltr) w.firstChild.style.transform = "scaleX(-1)";
    var a = w.animate([{ left: ltr ? "-30%" : "110%" }, { left: ltr ? "110%" : "-30%" }],
      { duration: rnd(5200, 7600) / big, easing: "linear", fill: "both" });
    this.track(a, w);
  };
  Scene.prototype.track = function (a, node) {
    var self = this;
    this.anims.push(a);
    a.onfinish = function () { if (node.parentNode) node.parentNode.removeChild(node); var i = self.anims.indexOf(a); if (i >= 0) self.anims.splice(i, 1); };
  };
  // Story moments drawn on top of the picture.
  Scene.prototype.event = function (name) {
    var self = this, fx = this.fxLayer;
    if (name === "ball" && this.d.ballFrom) {
      var from = this.d.ballFrom;
      var ball = this.ball = el("i", "ball", fx);
      ball.innerHTML = BALL; // constant markup
      ball.style.left = pct(from[0]); ball.style.top = pct(from[1]);
      ball.animate([
        { transform: "translate(-50%,-50%) scale(0.12) rotate(0deg)", left: pct(from[0]), top: pct(from[1]), filter: "blur(0)" },
        { transform: "translate(-50%,-50%) scale(0.55) rotate(260deg)", left: "52%", top: "66%", offset: 0.55, filter: "blur(0.5px)" },
        { transform: "translate(-50%,-50%) scale(1) rotate(400deg)", left: "54%", top: "80%", filter: "blur(1.5px)" }
      ], { duration: 900, easing: "cubic-bezier(.3,.1,.5,1)", fill: "forwards" });
    } else if (name === "kick" && this.ball) {
      var b = this.ball; this.ball = null;
      var a = b.animate([
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", left: "54%", top: "80%", filter: "blur(1.5px)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(0.35) rotate(-300deg)", left: "40%", top: "30%", offset: 0.5, filter: "blur(0)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(0.08) rotate(-500deg)", left: "47%", top: "52%", filter: "blur(0)", opacity: 0 }
      ], { duration: 1100, easing: "ease-out", fill: "forwards" });
      this.track(a, b);
    } else if (name === "catch" && this.ball) {
      var c = this.ball; this.ball = null;
      var a2 = c.animate([{ top: "80%", opacity: 1 }, { top: "112%", opacity: 0.6 }], { duration: 500, easing: "ease-in", fill: "forwards" });
      this.track(a2, c);
    } else if (name === "hush") {
      this.hushed = true; this.root.classList.add("hush");
    } else if (name === "cannon") {
      this.hushed = false; this.root.classList.remove("hush");
      var f = el("i", "flash", this.root);
      var a3 = f.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 900, easing: "ease-out", fill: "forwards" });
      this.track(a3, f);
    }
  };
  Scene.prototype.layout = function (W, H) {
    var d = this.d, S = Math.ceil(Math.max(W, H) * 1.04);
    var x = (W - S) * d.focus[0], y = (H - S) * d.focus[1];
    var w = this.world;
    w.style.width = w.style.height = S + "px";
    w.style.left = Math.round(x) + "px"; w.style.top = Math.round(y) + "px";
    w.style.transformOrigin = pct(d.focus[0]) + " " + pct(d.focus[1]);
  };
  Scene.prototype.destroy = function () {
    this.dead = true;
    this.timers.forEach(clearTimeout);
    this.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
  };

  /* ---------- public ---------- */
  var current = null, stageEl = null, ro = null;
  function layoutAll() {
    if (!stageEl) return;
    var W = stageEl.clientWidth, Hh = stageEl.clientHeight;
    Array.prototype.forEach.call(stageEl.querySelectorAll(".scene"), function (n) { if (n._scene) n._scene.layout(W, Hh); });
  }

  H.art = {
    places: places,
    attach: function (stage) {
      stageEl = stage;
      if (window.ResizeObserver) { ro = new ResizeObserver(layoutAll); ro.observe(stage); }
      else window.addEventListener("resize", layoutAll);
    },
    // Returns the new scene's root element. The engine fades it in over the old one.
    scene: function (place, time) {
      var old = current;
      var sc = new Scene(place, time);
      sc.root._scene = sc;
      current = sc;
      if (stageEl) sc.layout(stageEl.clientWidth, stageEl.clientHeight);
      if (old) setTimeout(function () { old.destroy(); }, 1300);
      return sc.root;
    },
    relayout: layoutAll,
    event: function (name) { if (current) current.event(name); },
    // A self-contained living picture for the hub screen.
    hub: function (box) {
      var sc = new Scene("roof", "night");
      sc.root.classList.add("hub-scene");
      function fit() { sc.layout(box.clientWidth || 400, box.clientHeight || 300); }
      setTimeout(fit, 0);
      if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
      return { el: sc.root, destroy: function () { sc.destroy(); } };
    },
    preload: function () {
      Object.keys(SCENES).forEach(function (k) { var i = new Image(); i.decoding = "async"; i.src = "assets/scenes/" + k + ".webp"; });
    }
  };
})();
