/* Dream Catcher sounds: arcade music + sound effects, all made with WebAudio (no files). Exposes window.ClawSound. */
(function () {
  "use strict";
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var Sound = (function () {
    var ctx, master, musicG, sfxG, noiseBuf, motorG, motorO1, motorO2, motorF, timer;
    var musicOn = load("sf_claw_music", true), sfxOn = load("sf_claw_sfx", true), playing = false;
    function init() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
        musicG = ctx.createGain(); musicG.gain.value = musicOn ? 0.34 : 0; musicG.connect(master);
        sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 0.9 : 0; sfxG.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        // gantry motor: two detuned low oscillators through a resonant low-pass, gain at 0 until it moves
        motorG = ctx.createGain(); motorG.gain.value = 0;
        motorF = ctx.createBiquadFilter(); motorF.type = "lowpass"; motorF.frequency.value = 420; motorF.Q.value = 5;
        motorO1 = ctx.createOscillator(); motorO1.type = "sawtooth"; motorO1.frequency.value = 58;
        motorO2 = ctx.createOscillator(); motorO2.type = "square"; motorO2.frequency.value = 87.3;
        var o2g = ctx.createGain(); o2g.gain.value = 0.35;
        motorO1.connect(motorF); motorO2.connect(o2g); o2g.connect(motorF); motorF.connect(motorG); motorG.connect(sfxG);
        motorO1.start(); motorO2.start();
      }
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    function now() { return ctx.currentTime; }
    function tone(f, t, dur, type, vol, dest, slide, attack) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
    }
    function noise(t, dur, vol, ftype, freq, dest, q) {
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; f.type = ftype || "bandpass"; f.frequency.value = freq || 1000; f.Q.value = q || 1;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    function nf(n) {
      var m = /^([A-G])(b|#)?(\d)$/.exec(n);
      var semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
      return 440 * Math.pow(2, ((+m[3] + 1) * 12 + semi - 69) / 12);
    }

    /* ---- music: bouncy toy-arcade tune in F major, 16 bars, 136 BPM ---- */
    var BPM = 136, E8 = 60 / BPM / 2;
    var MEL = ("C5 - A4 C5 F5 - E5 F5|D5 - F5 - A5 G5 F5 -|Bb4 D5 F5 D5 G5 F5 D5 -|C5 E5 G5 - E5 - C5 -|" +
               "A5 - G5 F5 A5 - C6 -|A5 G5 F5 D5 F5 - A5 -|G5 F5 D5 Bb4 C5 E5 G5 Bb5|A5 - F5 - C5 - F5 -|" +
               "D6 - C6 Bb5 A5 - F5 -|E5 G5 C6 - Bb5 A5 G5 -|A5 - E5 - C6 - A5 -|F5 - D5 F5 A5 - D6 -|" +
               "D6 C6 Bb5 A5 G5 - F5 -|G5 - A5 - Bb5 - C6 -|C6 - Bb5 - G5 - E5 -|F5 - - - 0 0 C5 E5").replace(/\|/g, " ").split(" ");
    var CH = ["F", "Dm", "Bb", "C", "F", "Dm", "Bb", "F", "Bb", "C", "Am", "Dm", "Bb", "C", "C", "F"];
    var CHORD = { F: ["F4", "A4", "C5"], Dm: ["D4", "F4", "A4"], Bb: ["Bb3", "D4", "F4"], C: ["C4", "E4", "G4"], Am: ["A3", "C4", "E4"] };
    var ROOT = { F: "F3", Dm: "D3", Bb: "Bb2", C: "C3", Am: "A2" };
    var BASS = [0, -1, 7, -1, 0, 12, 7, -1]; // semitone offsets per eighth (-1 = rest)
    var step = 0, nextT = 0;
    function lead(f, t, dur) {
      tone(f, t, dur, "square", 0.05, musicG, 0, 0.01);
      tone(f * 2, t, dur * 0.7, "triangle", 0.035, musicG, 0, 0.01);
    }
    function schedule() {
      while (nextT < ctx.currentTime + 0.14) {
        var i = step % MEL.length, bar = Math.floor(i / 8), e = i % 8, ch = CH[bar], t = nextT;
        var n = MEL[i];
        if (n && n !== "-" && n !== "0") {
          var len = 1; while (MEL[(i + len) % MEL.length] === "-" && len < 4) len++;
          lead(nf(n), t, E8 * len * 0.92);
        }
        if (BASS[e] >= 0) tone(nf(ROOT[ch]) * Math.pow(2, BASS[e] / 12), t, E8 * 0.9, "triangle", 0.2, musicG);
        if (e % 2 === 1) CHORD[ch].forEach(function (c) { tone(nf(c), t, 0.09, "triangle", 0.03, musicG); });
        if (e === 0 || e === 4) tone(150, t, 0.16, "sine", 0.45, musicG, 45);
        if (e === 2 || e === 6) { noise(t, 0.12, 0.16, "bandpass", 1800, musicG, 0.8); tone(210, t, 0.06, "triangle", 0.08, musicG, 160); }
        noise(t, 0.03, e % 2 ? 0.05 : 0.03, "highpass", 7500, musicG);
        nextT += E8; step++;
      }
    }
    function musicStart() {
      if (!ctx || playing) return;
      playing = true; nextT = ctx.currentTime + 0.08;
      clearInterval(timer); timer = setInterval(schedule, 30); schedule();
    }
    function musicStop() { playing = false; clearInterval(timer); }
    function duck(sec) {
      if (!ctx || !musicOn) return;
      var t = now(); musicG.gain.cancelScheduledValues(t);
      musicG.gain.setTargetAtTime(0.1, t, 0.05); musicG.gain.setTargetAtTime(0.34, t + sec, 0.3);
    }
    function setMusic(on) {
      musicOn = on; save("sf_claw_music", on);
      if (ctx) { musicG.gain.cancelScheduledValues(now()); musicG.gain.setTargetAtTime(on ? 0.34 : 0, now(), 0.05); }
    }
    function setSfx(on) {
      sfxOn = on; save("sf_claw_sfx", on);
      if (ctx) sfxG.gain.setTargetAtTime(on ? 0.9 : 0, now(), 0.03);
    }

    /* ---- sound effects ---- */
    var lastBoing = 0;
    var fx = {
      coin: function () { var t = now(); tone(988, t, 0.09, "square", 0.12); tone(1319, t + 0.08, 0.32, "square", 0.12); noise(t, 0.05, 0.1, "highpass", 5000); },
      blip: function () { tone(660, now(), 0.07, "triangle", 0.15); },
      motor: function (level, pitch) {
        if (!ctx) return; var t = now();
        motorG.gain.setTargetAtTime(level * 0.11, t, 0.04);
        motorO1.frequency.setTargetAtTime(52 * pitch, t, 0.05); motorO2.frequency.setTargetAtTime(78 * pitch, t, 0.05);
        motorF.frequency.setTargetAtTime(300 + 260 * pitch, t, 0.05);
      },
      zip: function (up) { var t = now(); tone(up ? 300 : 900, t, 0.25, "sawtooth", 0.04, sfxG, up ? 700 : 260); },
      thunk: function (soft) { var t = now(); tone(soft ? 140 : 110, t, 0.18, "sine", soft ? 0.25 : 0.4, sfxG, 50); noise(t, 0.08, soft ? 0.08 : 0.15, "lowpass", 600); },
      clack: function () { var t = now(); noise(t, 0.04, 0.3, "bandpass", 2600, sfxG, 3); noise(t + 0.07, 0.05, 0.25, "bandpass", 1900, sfxG, 3); tone(1200, t, 0.04, "square", 0.05); },
      grip: function (q) { var t = now(); var base = q < 0.15 ? 784 : q < 0.4 ? 659 : 523; tone(base, t, 0.12, "triangle", 0.18); tone(base * 1.25, t + 0.09, 0.18, "triangle", 0.16); },
      slip: function () { var t = now(); tone(520, t, 0.5, "triangle", 0.2, sfxG, 180); tone(380, t + 0.18, 0.45, "triangle", 0.14, sfxG, 140); boingAt(t + 0.05, 0.25); },
      miss: function () { var t = now(); tone(330, t, 0.16, "square", 0.06); tone(262, t + 0.16, 0.3, "square", 0.06, sfxG, 220); },
      boing: function (v) { var t = now(); if (t - lastBoing < 0.07) return; lastBoing = t; boingAt(t, v); },
      win: function (gold) {
        var t = now(); duck(1.6);
        ["C5", "E5", "G5", "C6", "E6"].forEach(function (n, k) { tone(nf(n), t + k * 0.07, 0.3, "square", 0.08); tone(nf(n) * 2, t + k * 0.07, 0.25, "triangle", 0.05); });
        tone(nf("C6"), t + 0.38, 0.7, "triangle", 0.16); tone(nf("G5"), t + 0.38, 0.7, "triangle", 0.1);
        for (var k = 0; k < (gold ? 14 : 7); k++) tone(rnd(1800, 3800), t + 0.4 + k * 0.06, 0.12, "sine", 0.06);
        noise(t, 0.2, 0.2, "lowpass", 400);
      },
      tick: function (last) { tone(last ? 1320 : 990, now(), 0.06, "square", 0.08); },
      over: function () { var t = now(); duck(2.2); ["G4", "E4", "C4"].forEach(function (n, k) { tone(nf(n), t + k * 0.22, 0.3, "square", 0.08); }); tone(nf("C3"), t + 0.66, 0.6, "triangle", 0.2); },
      rain: function () { var t = now(); for (var k = 0; k < 8; k++) boingAt(t + 0.25 + k * 0.09 + Math.random() * 0.05, 0.12); noise(t, 0.5, 0.06, "bandpass", 900); },
      bonus: function () { var t = now(); tone(nf("A5"), t, 0.1, "square", 0.08); tone(nf("D6"), t + 0.1, 0.2, "square", 0.08); }
    };
    function boingAt(t, v) {
      var f = rnd(230, 330);
      tone(f, t, 0.22, "sine", 0.12 + v * 0.35, sfxG, f * 1.9, 0.004);
      tone(f * 0.5, t, 0.12, "triangle", 0.05 + v * 0.1, sfxG, f, 0.004);
    }
    var api = {
      init: init, musicStart: musicStart, musicStop: musicStop, setMusic: setMusic, setSfx: setSfx,
      musicOn: function () { return musicOn; }, sfxOn: function () { return sfxOn; },
      suspend: function () { if (ctx) { musicStop(); ctx.suspend(); } },
      resume: function () { if (ctx) { ctx.resume(); musicStart(); } }
    };
    Object.keys(fx).forEach(function (k) { api[k] = function () { if (ctx && ctx.state !== "closed") try { fx[k].apply(null, arguments); } catch (e) { console.warn("sound " + k, e); } }; });
    api.fxNames = Object.keys(fx);
    api.state = function () { return ctx ? ctx.state + (playing ? " playing" : " stopped") : "none"; };
    return api;
  })();
  window.ClawSound = Sound;
})();
