/*
  فوانيس الحارة · sound
  ------------------------------------------------------------
  Three layers, all quiet on purpose:
    1. Ambience per place: a bed (air, room tone, crowd murmur, oven roar, grill crackle...) plus
       small random events (cutlery, coins, a ball bouncing down the alley, pigeons' wings).
    2. Story effects, fired by `fx` in the episode: stairs, Nemat's basket coming down on its rope, the ball,
       coins on the counter, juice poured, the workshop door, the carpenter's plane, the iftar cannon.
    3. Music only at three moments (title, right after the cannon, the end screen): a short composed
       theme in maqam Bayati on a qanun-like plucked string. Nothing loops.

  Recorded clips live in assets/sfx/ (stairs, kids, bakery). Everything else is synthesized here.
*/
(function () {
  "use strict";
  var A = {};
  var ctx = null, master, comp, ambBus, sfxBus, musicBus, reverb, wet;
  var muted = false, samples = {}, noise = {}, cache = {};
  var bed = null, bedPlace = "", bedTime = "", hushed = false;

  /* ---------------- building blocks ---------------- */
  function now() { return ctx.currentTime; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function noiseBuf(kind) {
    if (noise[kind]) return noise[kind];
    var sec = kind === "brown" ? 6 : 3, n = Math.floor(ctx.sampleRate * sec);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.3; } else d[i] = w;
    }
    return (noise[kind] = buf);
  }
  function impulse(sec, decay) {
    var n = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return buf;
  }
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  // A filtered noise burst: footsteps, knocks, slaps, rustles, the plane's "shhk".
  function burst(o) {
    var t = o.t || now() + 0.01, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(o.brown ? "brown" : "white");
    f.type = o.type || "bandpass"; f.frequency.value = o.freq || 1000; f.Q.value = o.q || 1;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + (o.attack || 0.005) + (o.decay || 0.1));
    env(g, t, o.gain, o.attack || 0.004, o.decay || 0.1);
    s.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
    s.start(t, Math.random() * 2); s.stop(t + (o.attack || 0.004) + (o.decay || 0.1) + 0.05);
  }
  // A short pitched hit: thumps (low sine with a falling pitch) and woody knocks.
  function thump(o) {
    var t = o.t || now() + 0.01, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.wave || "sine";
    osc.frequency.setValueAtTime(o.from, t);
    osc.frequency.exponentialRampToValueAtTime(o.to || o.from * 0.6, t + (o.decay || 0.15));
    env(g, t, o.gain, o.attack || 0.004, o.decay || 0.15);
    osc.connect(g); g.connect(o.dest || sfxBus);
    osc.start(t); osc.stop(t + (o.decay || 0.15) + 0.05);
  }
  // Inharmonic partials: coins, cutlery, glasses, metal koshari bowls.
  function metal(o) {
    var t = o.t || now() + 0.01, base = o.base * rnd(0.97, 1.03);
    (o.ratios || [1, 1.59, 2.31, 3.08]).forEach(function (r, i) {
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.frequency.value = base * r;
      env(g, t, o.gain / (i + 1), 0.002, (o.decay || 0.3) / (1 + i * 0.35));
      osc.connect(g); g.connect(o.dest || sfxBus);
      osc.start(t); osc.stop(t + (o.decay || 0.3) + 0.05);
    });
  }
  function playSample(name, o) {
    o = o || {};
    var buf = samples[name];
    if (!buf) return;
    var t = o.t || now() + 0.01, s = ctx.createBufferSource(), g = ctx.createGain(), dest = o.dest || sfxBus, node = s;
    s.buffer = buf; s.playbackRate.value = o.rate || 1;
    if (o.lowpass) { var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lowpass; s.connect(f); node = f; }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.gain == null ? 0.5 : o.gain, t + (o.fade || 0.08));
    var dur = buf.duration / (o.rate || 1);
    g.gain.setValueAtTime(o.gain == null ? 0.5 : o.gain, t + Math.max(0.1, dur - 0.4));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    node.connect(g); g.connect(dest);
    s.start(t); s.stop(t + dur + 0.05);
    return s;
  }
  function loadSamples() {
    ["stairs", "kids", "bakery"].forEach(function (n) {
      fetch("assets/sfx/" + n + ".mp3").then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
        return new Promise(function (ok, bad) { var p = ctx.decodeAudioData(ab, ok, bad); if (p && p.then) p.then(ok, bad); });
      }).then(function (buf) { samples[n] = buf; }).catch(function () {});
    });
  }

  /* ---------------- one-shot effects ---------------- */
  var FX = {
    stairs: function () {
      if (samples.stairs) { playSample("stairs", { gain: 0.55 }); return; }
      for (var i = 0; i < 6; i++) FX.step(now() + 0.05 + i * 0.36, 0.5 - i * 0.04);
    },
    step: function (t, v) {
      burst({ t: t, freq: 520, q: 0.8, type: "lowpass", gain: 0.22 * v, decay: 0.09 });
      thump({ t: t, from: 95, to: 60, gain: 0.25 * v, decay: 0.08 });
    },
    kids: function () { playSample("kids", { gain: 0.8, lowpass: 5000 }); },
    bakery: function () { playSample("bakery", { gain: 0.7 }); },
    street: function () { if (samples.bakery) playSample("bakery", { gain: 0.45, rate: 0.9, lowpass: 1800 }); },
    basket: function () {
      var t = now() + 0.05;
      // the rope creaking over the balcony rail, then the wicker basket bumping softly on the open window's sill
      var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(190, t + 0.35); o.frequency.linearRampToValueAtTime(165, t + 0.6);
      f.type = "bandpass"; f.frequency.value = 1100; f.Q.value = 7;
      env(g, t, 0.05, 0.12, 0.5);
      o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.7);
      [0.8, 1.05].forEach(function (d, i) { thump({ t: t + d, from: 210, to: 120, gain: 0.12 / (i + 1), decay: 0.06 }); burst({ t: t + d, freq: 2400, q: 0.9, gain: 0.07 / (i + 1), decay: 0.05 }); });
    },
    ball: function () {
      var t = now() + 0.02;
      thump({ t: t, from: 150, to: 70, gain: 0.32, decay: 0.12 });          // the kick, over there
      burst({ t: t + 0.05, freq: 400, sweep: 1500, q: 1.4, gain: 0.12, attack: 0.5, decay: 0.12 }); // whoosh toward you
    },
    kick: function () {
      var t = now() + 0.02;
      thump({ t: t, from: 170, to: 65, gain: 0.5, decay: 0.14 });
      burst({ t: t, freq: 2000, q: 0.8, gain: 0.12, decay: 0.03 });
      [0.75, 1.15, 1.45, 1.65].forEach(function (d, i) { thump({ t: t + d, from: 120, to: 70, gain: 0.16 / (i + 1), decay: 0.1 }); });
      setTimeout(function () { playSample("kids", { gain: 0.38, lowpass: 5200 }); }, 700);
    },
    catch: function () {
      var t = now() + 0.02;
      burst({ t: t, freq: 1400, q: 1.2, gain: 0.22, decay: 0.06 });
      thump({ t: t, from: 110, to: 70, gain: 0.25, decay: 0.08 });
    },
    coins: function () {
      var t = now() + 0.05;
      [0, 0.09, 0.2, 0.26].forEach(function (d, i) { metal({ t: t + d, base: rnd(2300, 2900), ratios: [1, 1.48, 2.21, 3.06], gain: 0.07 - i * 0.01, decay: 0.35 }); });
      burst({ t: t + 0.32, freq: 3000, q: 1, gain: 0.03, decay: 0.08 });
    },
    thud: function () {
      var t = now() + 0.02;
      thump({ t: t, from: 120, to: 70, gain: 0.3, decay: 0.2 });
      metal({ t: t, base: 420, ratios: [1, 1.86, 2.9], gain: 0.12, decay: 0.16 });
      burst({ t: t, freq: 500, type: "lowpass", gain: 0.15, decay: 0.12 });
    },
    pour: function () {
      var t = now() + 0.05, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      s.buffer = noiseBuf("white");
      f.type = "bandpass"; f.Q.value = 6; f.frequency.setValueAtTime(450, t); f.frequency.exponentialRampToValueAtTime(1500, t + 1.6);
      lfo.frequency.value = 13; lg.gain.value = 0.07; lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.15); g.gain.setValueAtTime(0.16, t + 1.4); g.gain.linearRampToValueAtTime(0.0001, t + 1.7);
      s.connect(f); f.connect(g); g.connect(sfxBus);
      s.start(t); s.stop(t + 1.8); lfo.start(t); lfo.stop(t + 1.8);
    },
    clink: function (dest, v) { metal({ base: rnd(1700, 2300), ratios: [1, 1.63, 2.42], gain: 0.06 * (v || 1), decay: 0.3, dest: dest }); },
    glass: function (dest, v) { metal({ base: rnd(2500, 2900), ratios: [1, 1.57, 2.4], gain: 0.05 * (v || 1), decay: 0.7, dest: dest }); },
    bowl: function (dest, v) { metal({ base: rnd(850, 1050), ratios: [1, 1.52, 2.46, 3.3], gain: 0.07 * (v || 1), decay: 0.4, dest: dest }); burst({ freq: 3000, gain: 0.02 * (v || 1), decay: 0.02, dest: dest }); },
    ladle: function (dest, v) { metal({ base: rnd(620, 760), ratios: [1, 1.7, 2.6], gain: 0.07 * (v || 1), decay: 0.45, dest: dest }); },
    bounce: function (dest, v) { thump({ from: 120, to: 70, gain: 0.12 * (v || 1), decay: 0.1, dest: dest }); },
    flutter: function (dest, v) {
      var t = now() + 0.02, n = Math.round(rnd(7, 12));
      for (var i = 0; i < n; i++) burst({ t: t + i * 0.05, freq: rnd(900, 1400), q: 1.5, gain: 0.04 * (v || 1) * (1 - i / n), decay: 0.035, dest: dest });
    },
    rustle: function (dest, v) { burst({ freq: 3200, q: 0.7, gain: 0.02 * (v || 1), attack: 0.08, decay: 0.3, dest: dest }); },
    creak: function (dest, v) {
      var t = now() + 0.02, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(rnd(110, 140), t); o.frequency.linearRampToValueAtTime(rnd(150, 190), t + 0.5);
      f.type = "bandpass"; f.frequency.value = 800; f.Q.value = 8;
      env(g, t, 0.025 * (v || 1), 0.15, 0.4);
      o.connect(f); f.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + 0.6);
    },
    door: function () {
      var t = now() + 0.05, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(120, t + 0.6); o.frequency.linearRampToValueAtTime(88, t + 1.3);
      f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 9;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.2); g.gain.setValueAtTime(0.07, t + 1.1); g.gain.linearRampToValueAtTime(0.0001, t + 1.4);
      o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1.5);
      FX.thud && thump({ t: t + 1.45, from: 100, to: 65, gain: 0.18, decay: 0.15 });
    },
    plane: function () {
      var t = now() + 0.1;
      burst({ t: t, freq: 2600, q: 0.9, gain: 0.26, attack: 0.12, decay: 0.55 });
      burst({ t: t, freq: 900, q: 1.5, gain: 0.1, attack: 0.1, decay: 0.5 });
      metal({ t: t + 0.7, base: 520, ratios: [1, 2.1], gain: 0.04, decay: 0.12 });
    },
    chime: function () {
      var t = now() + 0.02;
      [[587.33, 0.1], [880, 0.06], [1174.66, 0.035]].forEach(function (p, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = p[0]; env(g, t + i * 0.11, p[1], 0.01, 2.4);
        o.connect(g); g.connect(sfxBus); o.start(t + i * 0.11); o.stop(t + 3);
      });
    },
    drum: function () {
      var t = now() + 0.05;
      [[0, "dum"], [0.5, "tak"], [0.72, "tak"], [0.95, "dum"]].forEach(function (hh) {
        if (hh[1] === "dum") thump({ t: t + hh[0], from: 120, to: 55, gain: 0.3, decay: 0.45 });
        else burst({ t: t + hh[0], freq: 2200, q: 1.2, gain: 0.15, decay: 0.11 });
      });
    },
    tap: function () { thump({ from: 640, to: 440, gain: 0.05, decay: 0.12 }); },
    blip: function () { // one letter of dialogue on the map
      var t = now() + 0.005, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(rnd(520, 620), t);
      env(g, t, 0.022, 0.004, 0.05);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.08);
    },
    meow: function () {
      var t = now() + 0.02, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(780, t + 0.16); o.frequency.linearRampToValueAtTime(470, t + 0.5);
      f.type = "bandpass"; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1600, t + 0.18); f.frequency.linearRampToValueAtTime(800, t + 0.5); f.Q.value = 3;
      env(g, t, 0.05, 0.06, 0.45);
      o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.6);
    },
    knock: function (dest, v) { // Saber's mallet on wood
      var t = now() + 0.01;
      thump({ t: t, from: rnd(760, 900), to: 420, gain: 0.07 * (v || 1), decay: 0.07, wave: "triangle", dest: dest });
      burst({ t: t, freq: 2400, q: 2, gain: 0.03 * (v || 1), decay: 0.025, dest: dest });
    },
    chirp: function (dest, v) { // a sparrow somewhere
      var t = now() + 0.02, n = 2 + ((Math.random() * 3) | 0), f0 = rnd(2600, 3400);
      for (var i = 0; i < n; i++) {
        var o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * rnd(0.08, 0.13);
        o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f0 * rnd(1.15, 1.4), s + 0.05);
        env(g, s, 0.018 * (v || 1), 0.008, 0.05);
        o.connect(g); g.connect(dest || sfxBus); o.start(s); o.stop(s + 0.08);
      }
    },
    dice: function (dest, v) { // backgammon dice on the board
      var t = now() + 0.02;
      [0, 0.07, 0.15, 0.2].forEach(function (d, i) { thump({ t: t + d, from: rnd(1300, 1700), to: 900, gain: 0.04 * (v || 1) / (i + 1), decay: 0.03, wave: "triangle", dest: dest }); });
    },
    // the musaharati's little drum (the baza), beaten with a leather strap: dum, dum, dum-dum
    baza: function (dest, v) {
      var t = now() + 0.02, g = v == null ? 1 : v;
      [[0, 1], [0.34, 0.8], [0.58, 0.9], [0.7, 0.75]].forEach(function (h) {
        thump({ t: t + h[0], from: 250, to: 150, gain: 0.2 * g * h[1], decay: 0.2, dest: dest });
        burst({ t: t + h[0], freq: 1300, q: 1.4, gain: 0.05 * g * h[1], decay: 0.05, dest: dest });
      });
    },
    // the aragoz's voice, squeaked through the reed in the puppeteer's mouth
    squeak: function (dest, v) {
      var t = now() + 0.02, g = v == null ? 1 : v;
      [0, 0.1, 0.2, 0.32].forEach(function (d, i) {
        var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), gg = ctx.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(1050 + i * 70, t + d); o.frequency.exponentialRampToValueAtTime(1450 + i * 90, t + d + 0.07);
        f.type = "bandpass"; f.frequency.value = 1700; f.Q.value = 2.2;
        env(gg, t + d, 0.035 * g, 0.01, 0.08);
        o.connect(f); f.connect(gg); gg.connect(dest || sfxBus); o.start(t + d); o.stop(t + d + 0.13);
      });
    },
    // a table of people clapping along on the beat
    clap: function (dest, v) {
      var t = now() + 0.02, g = v == null ? 1 : v, beat = 0.555;
      for (var b = 0; b < 4; b++) for (var p = 0; p < 5; p++) burst({ t: t + b * beat + rnd(0, 0.03), freq: rnd(1400, 2600), q: 1.1, gain: 0.03 * g, decay: 0.05, dest: dest });
    },
    // a pigeon: croo-croo, low and round
    coo: function (dest, v) {
      var t = now() + 0.02, g0 = v == null ? 1 : v;
      [[0, 1], [0.42, 0.8]].forEach(function (h) {
        var o = ctx.createOscillator(), trem = ctx.createOscillator(), tg = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain(), s = t + h[0];
        o.type = "triangle"; o.frequency.setValueAtTime(rnd(300, 340), s); o.frequency.linearRampToValueAtTime(rnd(380, 420), s + 0.12); o.frequency.linearRampToValueAtTime(rnd(270, 300), s + 0.34);
        trem.frequency.value = 22; tg.gain.value = 0.5; trem.connect(tg); tg.connect(g.gain);
        f.type = "lowpass"; f.frequency.value = 900;
        env(g, s, 0.05 * g0 * h[1], 0.05, 0.3);
        o.connect(f); f.connect(g); g.connect(dest || sfxBus); o.start(s); o.stop(s + 0.4); trem.start(s); trem.stop(s + 0.4);
      });
    },
    // a balloon popping
    pop: function (dest, v) { burst({ freq: 2400, q: 0.6, type: "highpass", gain: 0.16 * (v || 1), decay: 0.06, dest: dest }); thump({ from: 260, to: 120, gain: 0.08 * (v || 1), decay: 0.05, dest: dest }); },
    // the strongman's bell, the prize bell
    ding: function (dest, v) { metal({ base: rnd(1180, 1260), ratios: [1, 2.01, 2.74, 3.76], gain: 0.12 * (v || 1), decay: 1.6, dest: dest }); },
    splash: function (dest, v) { burst({ freq: 1600, sweep: 400, q: 0.5, type: "lowpass", gain: 0.12 * (v || 1), attack: 0.01, decay: 0.45, dest: dest }); burst({ t: now() + 0.12, freq: 3000, q: 1, gain: 0.04 * (v || 1), decay: 0.2, dest: dest }); },
    whoosh: function (dest, v) { burst({ freq: 700, sweep: 2600, q: 0.8, gain: 0.06 * (v || 1), attack: 0.08, decay: 0.2, dest: dest }); },
    whistle: function (dest, v) {
      var t = now() + 0.02, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(2300, t + 0.18); o.frequency.setValueAtTime(1700, t + 0.3); o.frequency.exponentialRampToValueAtTime(2500, t + 0.5);
      env(g, t, 0.05 * (v || 1), 0.02, 0.55);
      o.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + 0.65);
    },
    // a crowd going "ooooh!" then clapping
    cheer: function (dest, v) {
      burst({ freq: 900, q: 0.6, gain: 0.07 * (v || 1), attack: 0.25, decay: 0.9, dest: dest });
      var t = now() + 0.5; for (var p = 0; p < 18; p++) burst({ t: t + rnd(0, 1.2), freq: rnd(1400, 2600), q: 1.1, gain: 0.025 * (v || 1), decay: 0.05, dest: dest });
    },
    // a wave up the sand and back (the beach in Nabil's house)
    wave: function (dest, v) { burst({ freq: 500, sweep: 1400, q: 0.4, type: "lowpass", gain: 0.06 * (v || 1), attack: 0.9, decay: 1.6, brown: true, dest: dest }); burst({ t: now() + 1, freq: 3200, q: 0.5, gain: 0.012 * (v || 1), attack: 0.4, decay: 1.2, dest: dest }); },
    // the projector's clatter, the clock's tick
    crank: function (dest, v) { for (var i = 0; i < 6; i++) burst({ t: now() + i * 0.045, freq: 2600, q: 3, gain: 0.02 * (v || 1), decay: 0.015, dest: dest }); },
    tick: function (dest, v) { thump({ from: 2200, to: 1800, gain: 0.02 * (v || 1), decay: 0.02, wave: "triangle", dest: dest }); },
    // a few notes from a music box (our own little tune)
    musicbox: function (dest, v) {
      var t = now() + 0.02, tune = [1046.5, 1318.5, 1568, 1318.5, 1174.7, 1046.5, 987.8, 1046.5];
      tune.forEach(function (f, i) { metal({ t: t + i * 0.28, base: f, ratios: [1, 4.1], gain: 0.03 * (v || 1), decay: 0.6, dest: dest }); });
    },
    hush: function () { A.hush(); },
    cannon: function () { A.cannon(); }
  };

  /* ---------------- ambience per place ---------------- */
  // air: [lowpass Hz, level]. murmur: level of the crowd bed. roar/sizzle/hum: extra beds.
  // ev: [effect, min s, max s, volume]. kids: [min s, max s, volume].
  var BEDS = {
    home: { air: [240, 0.05], ev: [["clink", 6, 12, 0.5], ["creak", 14, 24, 0.6]] },
    alley: { air: [700, 0.07], kids: [7, 14, 0.3], ev: [["bounce", 3, 7, 0.7], ["flutter", 9, 17, 0.7]] },
    bakery: { air: [300, 0.05], roar: 0.06, murmur: 0.26, ev: [["coins", 6, 12, 0.6], ["rustle", 4, 8, 1]] },
    steps: { air: [620, 0.06], murmur: 0.1, ev: [["clink", 5, 10, 0.4], ["bounce", 12, 22, 0.4]] },
    table: { air: [600, 0.04], murmur: 0.3, ev: [["clink", 1.2, 3.5, 0.6], ["glass", 4, 9, 0.6]] },
    steps_iftar: { air: [480, 0.035], ev: [["clink", 7, 14, 0.25], ["glass", 12, 20, 0.2]] },
    fulcart: { air: [600, 0.05], murmur: 0.22, simmer: 0.035, sizzle: 0.018, ev: [["ladle", 3.5, 8, 0.7], ["clink", 3, 7, 0.4]] },
    koshari: { air: [320, 0.04], murmur: 0.3, sizzle: 0.025, ev: [["bowl", 1, 3, 0.7]] },
    kebab: { air: [520, 0.04], murmur: 0.22, sizzle: 0.05, kids: [11, 20, 0.22], ev: [["clink", 3, 7, 0.4]] },
    mosque: { air: [170, 0.05], room: true, ev: [["rustle", 5, 11, 0.6]] },
    roof: { air: [850, 0.05], kids: [10, 18, 0.22], ev: [["flutter", 20, 35, 0.3]] },
    workshop: { air: [200, 0.03], hum: 0.01, ev: [["creak", 8, 16, 0.6]] },
    map: { air: [650, 0.06], murmur: 0.07, kids: [9, 16, 0.18], ev: [["bounce", 6, 12, 0.35], ["flutter", 12, 22, 0.5], ["clink", 8, 14, 0.25]] },
    // the places of the walking hara
    square: { air: [620, 0.06], murmur: 0.12, ev: [["flutter", 8, 16, 0.5], ["clink", 6, 12, 0.3], ["chirp", 4, 10, 0.4]] },
    market: { air: [600, 0.05], murmur: 0.3, sizzle: 0.03, simmer: 0.02, ev: [["ladle", 4, 9, 0.5], ["bowl", 3, 7, 0.5], ["clink", 3, 7, 0.35]] },
    cafe: { air: [420, 0.04], murmur: 0.2, ev: [["glass", 2.5, 6, 0.6], ["dice", 3, 7, 0.8], ["clink", 2, 5, 0.4], ["chirp", 6, 14, 0.3]] },
    garden: { air: [900, 0.045], ev: [["chirp", 1.5, 5, 0.6], ["rustle", 4, 9, 0.6]] },
    workshopOpen: { air: [260, 0.03], murmur: 0.05, ev: [["creak", 9, 16, 0.4], ["chirp", 6, 14, 0.3]] },
    hub: { air: [750, 0.035], kids: [14, 24, 0.14] },
    // inside: food places follow the fast (byTime scales the crowd), the mosque is a hush with a long echo
    homeIn: { air: [260, 0.04], simmer: 0.012, ev: [["clink", 7, 14, 0.4], ["creak", 16, 28, 0.4], ["chirp", 9, 18, 0.25]] },
    bakeryIn: { air: [280, 0.05], roar: 0.08, murmur: 0.24, byTime: { asr: 0.7, pre: 1, maghrib: 0.1, night: 0.35 }, ev: [["coins", 5, 10, 0.6], ["rustle", 4, 8, 0.8]] },
    mosqueIn: { air: [160, 0.035], room: true, murmur: 0.05, byTime: { asr: 0.2, pre: 0.2, maghrib: 0.6, night: 1 }, ev: [["rustle", 6, 12, 0.5]] },
    koshariIn: { air: [320, 0.04], murmur: 0.34, sizzle: 0.025, byTime: { asr: 0.08, pre: 0.45, maghrib: 1, night: 1 }, ev: [["bowl", 1.2, 3.2, 0.7], ["clink", 2, 5, 0.4]] },
    kebabIn: { air: [480, 0.04], murmur: 0.28, sizzle: 0.06, byTime: { asr: 0.1, pre: 0.4, maghrib: 1, night: 1 }, kids: [12, 22, 0.18], ev: [["clink", 2.5, 6, 0.45]] },
    // the suhoor tent: the band (tabla, riq and a mizmar), the crowd clapping along; outside you hear it through the cloth
    tentIn: { air: [420, 0.04], murmur: 0.34, simmer: 0.015, band: { gain: 1, lp: 3400 }, ev: [["clap", 7, 14, 0.8], ["clink", 2, 5, 0.45], ["glass", 4, 9, 0.4]], kids: [14, 26, 0.16] },
    tentOut: { air: [600, 0.05], murmur: 0.24, band: { gain: 0.5, lp: 900 }, ev: [["clink", 4, 9, 0.3]], kids: [16, 28, 0.12] },
    // the new places: the pigeon roof, Nabil's house (the sea inside, the air conditioning), the fair, the cinema, the toy shop
    loft: { air: [900, 0.05], ev: [["coo", 2.5, 7, 0.8], ["flutter", 6, 14, 0.6], ["chirp", 5, 12, 0.3]] },
    villa: { air: [380, 0.03], hum: 0.005, ev: [["wave", 4.5, 8, 1], ["glass", 9, 18, 0.25]] },
    fairIn: { air: [700, 0.05], murmur: 0.36, organ: { gain: 1, lp: 3600 }, kids: [5, 11, 0.3], ev: [["pop", 5, 12, 0.5], ["ding", 8, 16, 0.4], ["cheer", 14, 26, 0.5], ["whistle", 18, 32, 0.25]] },
    fairOut: { air: [600, 0.05], murmur: 0.16, organ: { gain: 0.45, lp: 900 }, kids: [12, 22, 0.15] },
    cinemaIn: { air: [260, 0.03], hum: 0.008, murmur: 0.1, ev: [["crank", 0.9, 1.4, 0.5], ["rustle", 6, 12, 0.4]] },
    toyshop: { air: [240, 0.03], ev: [["tick", 1, 1.02, 0.6], ["musicbox", 14, 24, 0.7], ["creak", 12, 22, 0.4]] }
  };

  function loopNoise(kind, filterType, freq, level, dest) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(kind); s.loop = true;
    f.type = filterType; f.frequency.value = freq;
    g.gain.value = level;
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(now(), Math.random() * 2);
    return s;
  }
  function buildBed(place, time) {
    var c = BEDS[place] || BEDS.hub, b = { sources: [], timers: [], out: ctx.createGain() };
    b.out.gain.value = 0.0001;
    b.out.connect(ambBus);
    if (c.room) b.out.connect(reverb);
    var late = time === "night" || time === "suhoor", tk = c.byTime && c.byTime[time] == null && time === "suhoor" ? "night" : time;
    var nightDrop = late ? 0.7 : 1, crowd = c.byTime ? (c.byTime[tk] == null ? 1 : c.byTime[tk]) : 1;
    b.sources.push(loopNoise("brown", "lowpass", c.air[0], c.air[1] * nightDrop, b.out));
    if (c.roar) {
      var r = loopNoise("brown", "lowpass", 160, c.roar, b.out);
      b.sources.push(r);
    }
    if (c.sizzle) b.sources.push(loopNoise("white", "highpass", 3500, c.sizzle, b.out));
    if (c.simmer) b.sources.push(loopNoise("white", "bandpass", 700, c.simmer, b.out));
    if (c.hum) [100, 150].forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = c.hum / (i + 1);
      o.connect(g); g.connect(b.out); o.start(); b.sources.push(o);
    });
    // crowd murmur: the recorded bakery chatter, slowed a little, filtered far away, looped at two speeds
    if (c.murmur) {
      var startMurmur = function () {
        if (!samples.bakery) { b.timers.push(setTimeout(startMurmur, 500)); return; }
        [0.86, 0.97].forEach(function (rate, i) {
          var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          s.buffer = samples.bakery; s.loop = true; s.playbackRate.value = rate;
          f.type = "lowpass"; f.frequency.value = 1700 - i * 300;
          g.gain.value = c.murmur * crowd * (i ? 0.7 : 1);
          s.connect(f); f.connect(g); g.connect(b.out);
          s.start(now(), Math.random() * samples.bakery.duration);
          b.sources.push(s);
        });
      };
      startMurmur();
    }
    function every(min, max, fn) {
      (function go() { b.timers.push(setTimeout(function () { if (!b.dead && !hushed) fn(); go(); }, rnd(min, max) * 1000)); })();
    }
    (c.ev || []).forEach(function (e) {
      if (e[0] === "chirp" && late) return; // the sparrows sleep
      if (crowd < 0.15 && (e[0] === "bowl" || e[0] === "coins")) return; // nobody eating, nobody paying
      var slow = crowd < 0.5 ? 1.8 : 1;
      every(e[1] * slow, e[2] * slow, function () { FX[e[0]](b.out, e[3] * 1.8); });
    });
    if (c.kids) every(c.kids[0], c.kids[1], function () { playSample("kids", { gain: c.kids[2], lowpass: 3200, rate: rnd(0.94, 1.04), dest: b.out }); });
    if (c.band) band(b, c.band);
    if (c.organ) organ(b, c.organ);
    return b;
  }
  /* The fair's band: a bright street organ playing a tune of our own in maqam ajam (a major scale) over a quick
     maqsum on the tabla, the way the swings and the shooting stalls blare it at a Ramadan fair. */
  var AJ = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25 };
  var FAIR_TUNE = [
    [["E5", 1], ["D5", 1], ["C5", 1], ["G4", 1], ["A4", 1], ["C5", 1], ["G4", 2]],
    [["F4", 1], ["A4", 1], ["C5", 1], ["A4", 1], ["G4", 2], ["E4", 2]],
    [["C5", 1], ["C5", 1], ["D5", 1], ["E5", 1], ["D5", 1], ["C5", 1], ["A4", 2]],
    [["G4", 1], ["A4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1], ["C4", 2]]
  ];
  function organ(b, o) {
    var out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = o.lp || 3000; out.gain.value = o.gain || 1;
    out.connect(lp); lp.connect(b.out);
    var E = 0.22, bar = 0, next = now() + 0.3;
    function pipe(f, t, len, v) {
      [1, 2].forEach(function (m, i) {
        var os = ctx.createOscillator(), g = ctx.createGain();
        os.type = i ? "square" : "triangle"; os.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v / (i ? 5 : 1), t + 0.02);
        g.gain.setValueAtTime(v / (i ? 5 : 1), t + len - 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        os.connect(g); g.connect(out); os.start(t); os.stop(t + len + 0.03);
      });
    }
    function schedule() {
      if (b.dead) return;
      while (next < now() + 1.2) {
        var t0 = next;
        [[0, "D"], [1, "T"], [3, "T"], [4, "D"], [6, "T"]].forEach(function (h) {
          var t = t0 + h[0] * E;
          if (h[1] === "D") thump({ t: t, from: 120, to: 60, gain: 0.2, decay: 0.25, dest: out });
          else burst({ t: t, freq: 2600, q: 1.3, gain: 0.08, decay: 0.06, dest: out });
        });
        for (var k = 0; k < 4; k++) pipe(AJ[["C4", "G4", "A4", "F4"][bar % 4]] / 2, t0 + k * 2 * E, E * 1.6, 0.03); // oom-pah underneath
        var line = FAIR_TUNE[bar % FAIR_TUNE.length], pos = 0;
        line.forEach(function (n) { pipe(AJ[n[0]], t0 + pos * E, n[1] * E - 0.02, 0.04); pos += n[1]; });
        next += 8 * E; bar++;
      }
      b.timers.push(setTimeout(schedule, 400));
    }
    schedule();
  }
  /* The tent's band: maqsum on the tabla (dum tak . tak dum . tak .), the riq's jingles on every eighth,
     and a mizmar playing a short tune of our own in maqam hijaz, round and round. Scheduled a bar ahead. */
  var HJ = { D4: 293.66, Eb4: 311.13, Fs4: 369.99, G4: 392, A4: 440, Bb4: 466.16, C5: 523.25, D5: 587.33 };
  var TUNE = [
    [["D5", 2], ["C5", 1], ["Bb4", 1], ["A4", 2], ["G4", 1], ["A4", 1]],
    [["Bb4", 1], ["A4", 1], ["G4", 1], ["Fs4", 1], ["G4", 2], ["Eb4", 1], ["D4", 1]],
    [["Fs4", 1], ["G4", 1], ["A4", 2], ["Bb4", 1], ["A4", 1], ["G4", 1], ["A4", 1]],
    [["G4", 1], ["Fs4", 1], ["Eb4", 1], ["Fs4", 1], ["D4", 4]],
    [["A4", 1], ["A4", 1], ["Bb4", 1], ["C5", 1], ["D5", 2], ["C5", 1], ["Bb4", 1]],
    [["A4", 1], ["Bb4", 1], ["A4", 1], ["G4", 1], ["Fs4", 2], ["G4", 2]],
    [["Eb4", 1], ["Fs4", 1], ["G4", 1], ["A4", 1], ["Bb4", 1], ["A4", 1], ["G4", 1], ["Fs4", 1]],
    [["G4", 2], ["Fs4", 1], ["Eb4", 1], ["D4", 4]]
  ];
  function band(b, o) {
    var out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = o.lp || 3000;
    out.gain.value = o.gain || 1;
    out.connect(lp); lp.connect(b.out);
    var E = 0.278, bar = 0, next = now() + 0.3;
    function mizmar(f, t, len, v) {
      var os = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      os.type = "sawtooth"; os.frequency.value = f;
      vib.frequency.value = 5.5; vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(os.frequency);
      fl.type = "bandpass"; fl.frequency.value = 1500; fl.Q.value = 0.7;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03);
      g.gain.setValueAtTime(v, t + len - 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      os.connect(fl); fl.connect(g); g.connect(out);
      os.start(t); vib.start(t); os.stop(t + len + 0.05); vib.stop(t + len + 0.05);
    }
    function schedule() {
      if (b.dead) return;
      while (next < now() + 1.2) {
        var t0 = next;
        [[0, "D"], [1, "T"], [2, "k"], [3, "T"], [4, "D"], [5, "k"], [6, "T"], [7, "k"]].forEach(function (h) {
          var t = t0 + h[0] * E;
          if (h[1] === "D") thump({ t: t, from: 110, to: 58, gain: 0.26, decay: 0.32, dest: out });
          else if (h[1] === "T") burst({ t: t, freq: 2400, q: 1.3, gain: 0.11, decay: 0.07, dest: out });
          else burst({ t: t, freq: 3200, q: 1.5, gain: 0.035, decay: 0.04, dest: out });
          metal({ t: t + 0.01, base: 5200, ratios: [1, 1.34, 1.83], gain: h[0] % 4 ? 0.012 : 0.022, decay: 0.12, dest: out }); // the riq
        });
        var line = TUNE[bar % TUNE.length], pos = 0;
        if (bar % 16 >= 2) line.forEach(function (n) { mizmar(HJ[n[0]], t0 + pos * E, n[1] * E - 0.02, 0.035); pos += n[1]; });
        next += 8 * E; bar++;
      }
      b.timers.push(setTimeout(schedule, 400));
    }
    schedule();
  }
  function dropBed(b, fade) {
    if (!b) return;
    b.dead = true;
    b.timers.forEach(clearTimeout);
    b.out.gain.cancelScheduledValues(now());
    b.out.gain.setTargetAtTime(0.0001, now(), fade || 0.5);
    setTimeout(function () { b.sources.forEach(function (s) { try { s.stop(); } catch (e) {} }); try { b.out.disconnect(); } catch (e) {} }, 3500);
  }

  /* ---------------- music: three short cues, never looping ---------------- */
  // Maqam Bayati on D. 320.25 Hz is the E half-flat that makes it sound Egyptian.
  var N = { G3: 196, A3: 220, Bb3: 233.08, C4: 261.63, D4: 293.66, Eh4: 320.25, F4: 349.23, G4: 392, A4: 440, Bb4: 466.16, C5: 523.25, D5: 587.33 };
  var THEME = [
    ["A4", 1], ["G4", 0.5], ["F4", 0.5], ["G4", 1.5], ["A4", 0.5],
    ["Bb4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F4", 0.5], ["Eh4", 1], ["D4", 1],
    ["F4", 0.5], ["G4", 0.5], ["A4", 1], ["C5", 0.5], ["Bb4", 0.5], ["A4", 1],
    ["G4", 0.5], ["F4", 0.5], ["Eh4", 0.5], ["F4", 0.5], ["D4", 2]
  ];
  function pluck(freq) {
    var key = freq.toFixed(2);
    if (cache[key]) return cache[key];
    var sr = ctx.sampleRate, n = Math.floor(sr * 2.2), M = Math.max(2, Math.round(sr / freq));
    var buf = ctx.createBuffer(1, n, sr), out = buf.getChannelData(0), ring = new Float32Array(M), i;
    for (i = 0; i < M; i++) ring[i] = Math.random() * 2 - 1;
    for (i = 1; i < M; i++) ring[i] = 0.6 * ring[i] + 0.4 * ring[i - 1]; // a little softer than a raw pluck
    var idx = 0;
    for (i = 0; i < n; i++) { var a = ring[idx], b2 = ring[(idx + 1) % M]; ring[idx] = 0.4985 * (a + b2); out[i] = a; idx = (idx + 1) % M; }
    return (cache[key] = buf);
  }
  function note(freq, t, vol, len) {
    var s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = pluck(freq);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + Math.max(0.5, len));
    s.connect(g); g.connect(musicBus);
    s.start(t); s.stop(t + Math.max(0.6, len + 0.1));
  }
  function pad(t, dur, vol) {
    [N.D4 / 2, N.A3].forEach(function (f, i) {
      var o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = f; o.detune.value = i ? 4 : -4;
      fl.type = "lowpass"; fl.frequency.value = 600;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * (i ? 0.6 : 1), t + 2.5);
      g.gain.setValueAtTime(vol * (i ? 0.6 : 1), t + dur - 2.5);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.1);
    });
  }
  function playTheme(upTo, vol, beat, withDrum) {
    var t = now() + 0.25, start = t, list = THEME.slice(0, upTo);
    list.forEach(function (nt, i) {
      var f = N[nt[0]], len = nt[1] * beat;
      note(f, t, vol * (i % 2 ? 0.85 : 1), len + 0.6);
      if (nt[1] >= 1.5) for (var k = 1; k * 0.11 < len - 0.15; k++) note(f, t + k * 0.11, vol * 0.32 * (1 - k * 0.11 / len), 0.4); // qanun tremolo
      t += len;
    });
    var total = t - start + 2.2;
    pad(start, total, 0.028);
    if (withDrum) for (var b = 0; b < (t - start) / (beat * 2); b++) {
      thump({ t: start + b * beat * 2, from: 110, to: 60, gain: 0.12, decay: 0.35, dest: musicBus });
      burst({ t: start + b * beat * 2 + beat, freq: 2400, q: 1.2, gain: 0.04, decay: 0.08, dest: musicBus });
    }
  }
  A.music = function (cue) {
    if (!ctx || muted) return;
    if (cue === "title") playTheme(5, 0.16, 0.62, false);
    else if (cue === "iftar") playTheme(THEME.length, 0.15, 0.7, false);
    else if (cue === "end") playTheme(THEME.length, 0.16, 0.6, true);
  };

  /* ---------------- public ---------------- */
  A.init = function () {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    reverb = ctx.createConvolver(); reverb.buffer = impulse(2.2, 2.8);
    wet = ctx.createGain(); wet.gain.value = 0.22; reverb.connect(wet); wet.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 1; ambBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master); sfxBus.connect(reverb);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.8;
    var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 3200;
    musicBus.connect(tone); tone.connect(master); tone.connect(reverb);
    loadSamples();
    if (bedPlace) { var p = bedPlace; bedPlace = ""; A.scene(p, bedTime); }
  };

  // Called whenever the picture changes place or time of day.
  A.scene = function (place, time) {
    if (place === bedPlace && time === bedTime) return;
    bedPlace = place; bedTime = time;
    if (!ctx) return;
    hushed = false;
    var old = bed;
    bed = buildBed(place, time);
    bed.out.gain.setTargetAtTime(1, now(), 0.6);
    dropBed(old, 0.5);
  };
  A.time = function () {}; // kept for older callers

  A.hush = function () {
    if (!ctx || !bed) return;
    hushed = true;
    bed.out.gain.setTargetAtTime(0.12, now(), 0.7);
  };
  A.cannon = function () {
    if (!ctx) return;
    var t = now() + 0.02;
    [0, 0.42].forEach(function (delay, i) {
      var amp = i ? 0.22 : 0.85, tt = t + delay;
      thump({ t: tt, from: 95, to: 30, gain: amp, attack: 0.01, decay: 1.7 });
      burst({ t: tt, freq: 900, sweep: 70, type: "lowpass", gain: amp * 0.75, attack: 0.01, decay: 1.4 });
    });
    hushed = false;
    if (bed) bed.out.gain.setTargetAtTime(1, now() + 1.8, 1.2);
    setTimeout(function () { A.music("iftar"); }, 2600);
  };
  A.fx = function (name) {
    if (!ctx || !FX[name]) return;
    try { FX[name](); } catch (e) {}
  };
  A.fxv = function (name, v) { // an effect at a volume, for sounds that come from somewhere on the map
    if (!ctx || !FX[name] || muted) return;
    try { FX[name](null, v); } catch (e) {}
  };
  A.chime = function () { A.fx("chime"); };
  A.drum = function () { A.fx("drum"); };
  A.tap = function () { A.fx("tap"); };
  A.step = function () { if (ctx && !muted) try { FX.step(now() + 0.01, 0.22 + Math.random() * 0.08); } catch (e) {} }; // footsteps on the map
  A.setMuted = function (m) {
    muted = !!m;
    if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.15);
  };
  A.isMuted = function () { return muted; };
  A._ctx = function () { return ctx; }; // for level checks in dev tools
  A._meter = function () { var an = ctx.createAnalyser(); an.fftSize = 2048; comp.connect(an); return an; };

  window.HARA = window.HARA || {};
  HARA.audio = A;
})();
