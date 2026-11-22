/*
  Sound for the hara, made in the browser (no audio files to download).
    - ambience: a soft street hum whose level follows the time of day
    - music: an oud-like plucked string improvising slowly in maqam Bayati on D,
             including the E half-flat that gives it an Egyptian sound
    - effects: the iftar cannon, a lantern chime, the mesaharaty's drum, a soft tap
  Final versions can swap in recorded sound and a composed theme with the same calls.
*/
(function () {
  "use strict";
  var A = {};
  var ctx = null, master, ambGain, ambFilter, musicBus, sfxBus, reverb;
  var muted = false, hushed = false, level = 0.35, musicTimer = null, cache = {};

  // Bayati on D (D3 up to G4). 160.12 Hz is the E half-flat.
  var SCALE = [146.83, 160.12, 174.61, 196.0, 220.0, 233.08, 261.63, 293.66, 320.25, 349.23, 392.0];
  var DRONE = 73.42;
  var AMB = { asr: 0.07, pre: 0.06, maghrib: 0.035, night: 0.04, hub: 0.025 };
  var MUSIC = { asr: 0.3, pre: 0.38, maghrib: 0.45, night: 0.5, hub: 0.4, end: 0.62 };

  function noiseBuffer(sec, brown) {
    var n = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w;
    }
    return buf;
  }

  function impulse(sec) {
    var n = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    }
    return buf;
  }

  // Karplus-Strong plucked string, rendered once per pitch and cached.
  function pluck(freq) {
    var key = freq.toFixed(2);
    if (cache[key]) return cache[key];
    var sr = ctx.sampleRate, n = Math.floor(sr * 2.4), N = Math.max(2, Math.round(sr / freq));
    var buf = ctx.createBuffer(1, n, sr), out = buf.getChannelData(0), ring = new Float32Array(N), i;
    for (i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    for (var p = 0; p < 2; p++) for (i = 1; i < N; i++) ring[i] = 0.5 * (ring[i] + ring[i - 1]); // mellower attack
    var idx = 0;
    for (i = 0; i < n; i++) {
      var a = ring[idx], b = ring[(idx + 1) % N];
      ring[idx] = 0.4978 * (a + b);
      out[i] = a;
      idx = (idx + 1) % N;
    }
    cache[key] = buf;
    return buf;
  }

  function playNote(freq, when, vol) {
    var s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = pluck(freq);
    s.playbackRate.value = 1 + (Math.random() - 0.5) * 0.004;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0008, when + 2.2);
    s.connect(g); g.connect(musicBus);
    s.start(when); s.stop(when + 2.4);
  }

  function phrase() {
    if (!ctx || hushed || muted) return schedule(2500);
    var t = ctx.currentTime + 0.05, beat = 0.38 + Math.random() * 0.08;
    var idx = Math.random() < 0.6 ? 0 : 4; // start on D or A
    var len = 4 + Math.floor(Math.random() * 4);
    for (var k = 0; k < len; k++) {
      var step = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      if (idx > 7) step = -Math.abs(step);
      idx = Math.max(0, Math.min(SCALE.length - 1, idx + step));
      if (k === len - 1) idx = [0, 4, 7][Math.floor(Math.random() * 3)];
      var vol = 0.22 + Math.random() * 0.12;
      playNote(SCALE[idx], t, vol);
      if (Math.random() < 0.18) playNote(SCALE[idx], t + beat * 0.25, vol * 0.6); // a quick double pluck
      t += beat * [1, 1, 1.5, 2, 0.75][Math.floor(Math.random() * 5)];
    }
    var rest = (t - ctx.currentTime) * 1000 + (3600 - level * 2600) + Math.random() * 1800;
    schedule(rest);
  }

  function schedule(ms) {
    clearTimeout(musicTimer);
    musicTimer = setTimeout(phrase, ms);
  }

  function drone() {
    [DRONE, DRONE * 1.5].forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i ? "sine" : "triangle";
      o.frequency.value = f;
      g.gain.value = i ? 0.012 : 0.022;
      o.connect(g); g.connect(musicBus);
      o.start();
    });
  }

  A.init = function () {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }

    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    reverb = ctx.createConvolver(); reverb.buffer = impulse(2.4);
    var wet = ctx.createGain(); wet.gain.value = 0.32; reverb.connect(wet); wet.connect(master);

    var amb = ctx.createBufferSource(); amb.buffer = noiseBuffer(5, true); amb.loop = true;
    ambFilter = ctx.createBiquadFilter(); ambFilter.type = "lowpass"; ambFilter.frequency.value = 700;
    ambGain = ctx.createGain(); ambGain.gain.value = 0;
    amb.connect(ambFilter); ambFilter.connect(ambGain); ambGain.connect(master); amb.start();

    musicBus = ctx.createGain(); musicBus.gain.value = 0.5;
    var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2400;
    musicBus.connect(tone); tone.connect(master); tone.connect(reverb);

    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master); sfxBus.connect(reverb);

    drone();
    schedule(600);
  };

  A.time = function (t) {
    if (!ctx) return;
    hushed = false;
    level = MUSIC[t] != null ? MUSIC[t] : 0.4;
    var now = ctx.currentTime;
    ambGain.gain.cancelScheduledValues(now);
    ambGain.gain.setTargetAtTime(AMB[t] != null ? AMB[t] : 0.04, now, 0.8);
    musicBus.gain.setTargetAtTime(level, now, 1.2);
  };

  A.hush = function () {
    if (!ctx) return;
    hushed = true;
    var now = ctx.currentTime;
    ambGain.gain.setTargetAtTime(0.008, now, 0.6);
    musicBus.gain.setTargetAtTime(0.06, now, 0.8);
  };

  A.cannon = function () {
    if (!ctx) return;
    var t = ctx.currentTime + 0.02;
    [0, 0.42].forEach(function (delay, i) {
      var amp = i ? 0.25 : 0.95, tt = t + delay;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(95, tt);
      o.frequency.exponentialRampToValueAtTime(30, tt + 0.7);
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(amp, tt + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.8);
      o.connect(g); g.connect(sfxBus); o.start(tt); o.stop(tt + 1.9);
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g2 = ctx.createGain();
      s.buffer = noiseBuffer(1.6, false);
      f.type = "lowpass";
      f.frequency.setValueAtTime(900, tt);
      f.frequency.exponentialRampToValueAtTime(70, tt + 1.3);
      g2.gain.setValueAtTime(0.0001, tt);
      g2.gain.exponentialRampToValueAtTime(amp * 0.8, tt + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, tt + 1.5);
      s.connect(f); f.connect(g2); g2.connect(sfxBus); s.start(tt);
    });
    // after the cannon the street wakes up again, warmer
    setTimeout(function () { A.time("maghrib"); }, 2200);
  };

  A.chime = function () {
    if (!ctx) return;
    var t = ctx.currentTime + 0.02;
    [[587.33, 0.16], [880, 0.1], [1174.66, 0.06], [1620, 0.035]].forEach(function (p, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t + i * 0.09);
      g.gain.exponentialRampToValueAtTime(p[1], t + i * 0.09 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 2.6);
      o.connect(g); g.connect(sfxBus); o.start(t + i * 0.09); o.stop(t + 3);
    });
  };

  A.drum = function () {
    if (!ctx) return;
    var t = ctx.currentTime + 0.05;
    // the mesaharaty's pattern: dum . tak tak dum
    [[0, "dum"], [0.5, "tak"], [0.72, "tak"], [0.95, "dum"]].forEach(function (h) {
      var tt = t + h[0];
      if (h[1] === "dum") {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(120, tt); o.frequency.exponentialRampToValueAtTime(55, tt + 0.25);
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.6, tt + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.5);
        o.connect(g); g.connect(sfxBus); o.start(tt); o.stop(tt + 0.55);
      } else {
        var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g2 = ctx.createGain();
        s.buffer = noiseBuffer(0.2, false); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 1.2;
        g2.gain.setValueAtTime(0.0001, tt); g2.gain.exponentialRampToValueAtTime(0.35, tt + 0.004); g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.12);
        s.connect(f); f.connect(g2); g2.connect(sfxBus); s.start(tt);
      }
    });
  };

  A.tap = function () {
    if (!ctx) return;
    var t = ctx.currentTime + 0.01, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(440, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2);
  };

  A.fx = function (name) {
    if (name === "cannon") A.cannon();
    else if (name === "hush") A.hush();
    else if (name === "chime") A.chime();
    else if (name === "drum") A.drum();
  };

  A.setMuted = function (m) {
    muted = !!m;
    if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.15);
  };
  A.isMuted = function () { return muted; };

  window.HARA = window.HARA || {};
  HARA.audio = A;
})();
