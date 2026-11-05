/* Big Big Boon intro ambience: a quiet workshop atmosphere generated live (Web Audio, no files):
   room tone of the hall, distant hammer knocks and a soft wood creak while the kiosk is drawn,
   a low hum when the lights come on. Always on, kept subtle. Browsers only allow sound after the
   visitor has tapped or clicked the site once, so it starts as soon as that is allowed. */
(function () {
  var intro = document.getElementById('intro');
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!intro || !AC || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var T0 = window.__introT0 || performance.now(), END = 3.9;
  var ctx = new AC(), out = ctx.createGain(), started = false;
  out.gain.value = 0; out.connect(ctx.destination);
  var el = function () { return (performance.now() - T0) / 1000; };
  var at = function (t) { return ctx.currentTime + Math.max(0, t - el()); };
  function noise(sec) { var b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } return b; } /* brown noise */
  var NB = null;

  function room() { /* the hall: low air, loops for the whole intro */
    var s = ctx.createBufferSource(); s.buffer = NB; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
    var g = ctx.createGain(); g.gain.value = 0.32;
    s.connect(f); f.connect(g); g.connect(out); s.start(); s.stop(ctx.currentTime + END + 1.5);
  }
  function knock(t, v) { /* distant hammer on timber */
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, at(t)); o.frequency.exponentialRampToValueAtTime(90, at(t + 0.12));
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(v, at(t + 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, at(t + 0.22));
    o.connect(f); f.connect(g); g.connect(out); o.start(at(t)); o.stop(at(t + 0.25));
    var s = ctx.createBufferSource(); s.buffer = NB; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2;
    var n = ctx.createGain(); n.gain.setValueAtTime(v * 0.6, at(t)); n.gain.exponentialRampToValueAtTime(0.0001, at(t + 0.06));
    s.connect(bp); bp.connect(n); n.connect(out); s.start(at(t), Math.random()); s.stop(at(t + 0.08));
  }
  function creak(t) { /* soft wood creak */
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, at(t)); o.frequency.linearRampToValueAtTime(110, at(t + 0.5)); o.frequency.linearRampToValueAtTime(85, at(t + 0.8));
    f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 6;
    g.gain.setValueAtTime(0.0001, at(t)); g.gain.linearRampToValueAtTime(0.035, at(t + 0.15)); g.gain.linearRampToValueAtTime(0.0001, at(t + 0.85));
    o.connect(f); f.connect(g); g.connect(out); o.start(at(t)); o.stop(at(t + 0.9));
  }
  function hum(t) { /* lights on: quiet mains hum that flickers with the animation */
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = 100; o2.type = 'sine'; o2.frequency.value = 150; f.type = 'lowpass'; f.frequency.value = 400;
    var v = 0.03; g.gain.setValueAtTime(0.0001, at(t));
    [[0.24, v], [0.37, 0.004], [0.55, v], [0.68, 0.012], [1.1, v * 0.8], [END - t + 0.6, 0.0001]].forEach(function (p) { g.gain.linearRampToValueAtTime(p[1], at(t + p[0])); });
    o.connect(f); o2.connect(f); f.connect(g); g.connect(out); o.start(at(t)); o2.start(at(t)); o.stop(at(END + 1)); o2.stop(at(END + 1));
  }

  function play() {
    if (started || ctx.state !== 'running') return; started = true;
    var t = el(); if (t > END) return;
    NB = noise(4);
    out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.8);
    room();
    [[0.6, 0.12], [0.95, 0.08], [1.25, 0.14], [2.6, 0.06], [2.95, 0.09]].forEach(function (k) { if (k[0] > t) knock(k[0], k[1]); });
    if (t < 1.5) creak(1.5);
    if (t < 1.75) hum(1.75);
    fade(END - t);
  }
  function fade(inSec) {
    var s = ctx.currentTime + Math.max(0, inSec);
    out.gain.setValueAtTime(0.55, s); out.gain.linearRampToValueAtTime(0, s + 1);
  }

  if (ctx.state === 'running') play(); else ctx.resume().then(play).catch(function () {});
  /* the first tap or key press anywhere starts it if the browser was holding it back */
  var unlock = function () { ctx.resume().then(play).catch(function () {}); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (e) { addEventListener(e, unlock, { once: true, passive: true }); });
  var sk = document.getElementById('iskip');
  if (sk) sk.addEventListener('click', function () { if (started) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6); } });
})();
