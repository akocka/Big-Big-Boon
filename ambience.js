/* Site ambience: a soft background soundscape generated live with Web Audio (no audio files), always on.
   <script src="ambience.js" data-preset="workshop|restaurant|garden"></script>
   Sound content sits between 300 Hz and 6 kHz so it is audible on phone speakers.
   Browsers block sound until the visitor taps/clicks/types once; it starts on that first interaction
   (and immediately, where the browser already allows it). Pauses while the tab is hidden. */
(function () {
  var me = document.currentScript, PRESET = (me && me.dataset.preset) || 'workshop';
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  function Engine(ctx, dest, preset) {
    var out = ctx.createGain(); out.gain.value = 0; out.connect(dest);
    var R = function (a, b) { return a + Math.random() * (b - a); };
    function noiseBuf(sec, pink) {
      var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate), d = b.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
      for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1;
        if (pink) { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; } else d[i] = w; }
      return b;
    }
    var PINK = noiseBuf(6, true), WHITE = noiseBuf(1, false);
    function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
    function tone(t, f, peak, a, d, type, to) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + d); env(g, t, a, peak, d); o.connect(g); g.connect(out); o.start(t); o.stop(t + a + d + 0.05); }
    function burst(t, f, q, peak, d, src) { var s = ctx.createBufferSource(); s.buffer = src || WHITE; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; var g = ctx.createGain(); env(g, t, 0.004, peak, d); s.connect(bp); bp.connect(g); g.connect(out); s.start(t, R(0, 0.5)); s.stop(t + d + 0.05); }
    function bed(f, q, level, lfoHz, lfoDepth) { /* continuous, slowly breathing noise layer */
      var s = ctx.createBufferSource(); s.buffer = PINK; s.loop = true; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      var g = ctx.createGain(); g.gain.value = level; s.connect(bp); bp.connect(g); g.connect(out); s.start(ctx.currentTime, R(0, 5));
      if (lfoHz) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfoHz; lg.gain.value = level * lfoDepth; l.connect(lg); lg.connect(g.gain); l.start(); }
    }

    var P = {
      workshop: {
        bed: function () { bed(700, 0.6, 0.20, 0.07, 0.5); bed(2400, 1.2, 0.05, 0.11, 0.6); },
        events: function (t) { /* distant work in the hall */
          var r = Math.random();
          if (r < 0.55) { var n = 2 + Math.floor(R(0, 4)), gap = R(0.28, 0.42); for (var i = 0; i < n; i++) { var tt = t + i * gap; tone(tt, 420, 0.10, 0.004, 0.16, 'triangle', 180); burst(tt, 2200, 3, 0.12, 0.05); } return n * gap + R(2.5, 5); }
          if (r < 0.8) { var len = R(0.8, 1.6), s = ctx.createBufferSource(); s.buffer = WHITE; s.loop = true; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 4;
            var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); var strokes = Math.floor(len * 4); for (var k = 0; k < strokes; k++) { g.gain.linearRampToValueAtTime(0.05, t + k * 0.25 + 0.08); g.gain.linearRampToValueAtTime(0.008, t + k * 0.25 + 0.24); }
            g.gain.linearRampToValueAtTime(0.0001, t + len + 0.1); s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + len + 0.2); return len + R(3, 6); }
          tone(t, 300, 0.05, 0.25, 0.9, 'sawtooth', 340); return R(3, 6); /* soft wood creak */
        },
        intro: function (t0) { /* the kiosk builds itself: drafting, drilling, nailing, the panel, lights, done */
          var now = ctx.currentTime - 0.03, Q = function (t, fn) { if (t0 + t >= now) fn(t0 + t); };
          for (var i = 0; i < 8; i++) Q(i * 0.09, function (t) { burst(t, R(4200, 5600), 2.5, 0.07, R(0.14, 0.22)); });           /* pencil strokes on the blueprint */
          Q(0.32, function (t) { var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth';      /* drill drives a screw */
            o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(430, t + 0.25); o.frequency.setValueAtTime(430, t + 0.5); o.frequency.exponentialRampToValueAtTime(200, t + 0.68);
            f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.2; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.06); g.gain.setValueAtTime(0.07, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
            o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 0.75); });
          [1.0, 1.14, 1.3, 1.44].forEach(function (h, k) { Q(h, function (t) { tone(t, 380 + k * 30, 0.16, 0.003, 0.14, 'triangle', 170); burst(t, 2600 + k * 150, 3, 0.16, 0.05); }); }); /* nails */
          Q(1.2, function (t) { tone(t, 230, 0.2, 0.004, 0.32, 'triangle', 95); burst(t, 900, 1, 0.14, 0.12); });                      /* the panel drops into place */
          Q(1.62, function (t) { burst(t, 3800, 6, 0.1, 0.03); burst(t + 0.07, 3600, 6, 0.08, 0.03); });                                 /* clamp ratchet */
          Q(1.75, function (t) { burst(t, 3500, 6, 0.18, 0.03);                                                                           /* switch + lights hum */
            var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 120; f.type = 'bandpass'; f.frequency.value = 480; f.Q.value = 1.5;
            var v = 0.06; g.gain.setValueAtTime(0.0001, t);[[0.24, v], [0.37, 0.006], [0.55, v], [0.68, 0.02], [1.1, v * 0.7], [2.6, 0.0001]].forEach(function (p) { g.gain.linearRampToValueAtTime(p[1], t + p[0]); });
            o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 2.8); });
          Q(2.1, function (t) { var s = ctx.createBufferSource(); s.buffer = PINK; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;   /* air rises under the logo */
            bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.9); var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
            s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + 1.3); });
          [2.7, 2.86].forEach(function (h) { Q(h, function (t) { tone(t, 300, 0.2, 0.003, 0.22, 'triangle', 120); burst(t, 2000, 2.5, 0.14, 0.06); }); }); /* done: two firm taps */
          return 3.4;
        }
      },
      restaurant: {
        bed: function () { /* warm room + a slow, quiet pad */
          bed(900, 0.5, 0.11, 0.05, 0.4);
          [220, 277.2, 329.6, 415.3].forEach(function (f, i) { var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = R(-6, 6);
            lp.type = 'lowpass'; lp.frequency.value = 1400; g.gain.value = 0.018; var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = R(0.05, 0.12); lg.gain.value = 0.012; l.connect(lg); lg.connect(g.gain); l.start();
            o.connect(lp); lp.connect(g); g.connect(out); o.start(); });
        },
        events: function (t) { /* glasses and cutlery across the room */
          var r = Math.random();
          if (r < 0.5) { var f = R(2400, 3600); tone(t, f, 0.05, 0.002, 0.9); tone(t, f * 2.76, 0.02, 0.002, 0.5); return R(1.8, 4); }
          if (r < 0.85) { var n = 1 + Math.floor(R(0, 3)); for (var i = 0; i < n; i++) burst(t + i * R(0.08, 0.2), R(3500, 5500), 8, 0.06, 0.04); return R(1.5, 3.5); }
          tone(t, 1760, 0.03, 0.002, 1.2); tone(t + 0.12, 2637, 0.025, 0.002, 1.1); return R(3, 5);
        },
        intro: function (t0) { [1318.5, 1975.5, 2637, 3951].forEach(function (f, i) { tone(t0 + 2.3 + i * 0.06, f, 0.07 / (i + 1), 0.003, 1.6); }); burst(t0 + 0.85, 6000, 1, 0.08, 0.5); }
      },
      garden: {
        bed: function () { bed(1200, 0.4, 0.10, 0.08, 0.7); bed(3500, 0.8, 0.03, 0.13, 0.8); },
        events: function (t) { /* birds and a wind chime */
          var r = Math.random();
          if (r < 0.75) { var n = 2 + Math.floor(R(0, 5)), base = R(2600, 4200), gap = R(0.09, 0.16);
            for (var i = 0; i < n; i++) { var tt = t + i * gap, up = Math.random() < 0.5; tone(tt, up ? base : base * 1.35, 0.045, 0.01, R(0.05, 0.1), 'sine', up ? base * 1.35 : base * 0.9); } return n * gap + R(1.2, 3.5); }
          var notes = [1568, 1760, 2093, 2349, 2637]; for (var k = 0; k < 3; k++) tone(t + k * R(0.15, 0.4), notes[Math.floor(R(0, 5))], 0.035, 0.003, 1.8); return R(3, 6);
        },
        intro: function (t0) { [2093, 2637, 3136].forEach(function (f, i) { tone(t0 + 0.6 + i * 0.12, f, 0.05, 0.003, 1.5); }); }
      }
    }[preset];

    /* Amaryllis hero: the zoom into the shop is "played" by the scroll: air that opens up as you go deeper,
       petals rustling with your scroll speed, and a bloom chord when "Totul începe cu o floare" appears */
    var hs = null, armed = true;
    function heroInit() { var s = ctx.createBufferSource(); s.buffer = PINK; s.loop = true; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.value = 700;
      var g = ctx.createGain(); g.gain.value = 0; s.connect(bp); bp.connect(g); g.connect(out); s.start(); hs = { bp: bp, g: g, last: 0 }; }
    function bloom(t) { [523.3, 659.3, 784, 1046.5, 1318.5, 1568].forEach(function (f, i) { tone(t + i * 0.09, f, 0.06 / (1 + i * 0.4), 0.004, 2.4); tone(t + i * 0.09, f * 2, 0.012, 0.004, 1.2); }); }
    var next = 0, LEVEL = preset === "garden" ? 1.8 : 1.45;
    return {
      start: function (introT0) {
        P.bed(); out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + 1.2);
        var hold = 0; if (introT0 != null) hold = (P.intro(introT0) || 0) + introT0 - ctx.currentTime;
        next = ctx.currentTime + Math.max(hold, 0) + R(0.4, 1.2);
      },
      hero: function (p, v) {
        if (!hs) heroInit(); var t = ctx.currentTime, inHero = p > 0.005 && p < 0.99;
        hs.bp.frequency.setTargetAtTime(600 + p * 3200, t, 0.15);
        hs.g.gain.setTargetAtTime(inHero ? Math.min(0.16, 0.02 + v * 0.05) : 0, t, inHero ? 0.12 : 0.4);
        if (inHero && v > 0.6 && t - hs.last > 0.09) { hs.last = t; burst(t, R(2500, 5000), 2, Math.min(0.06, 0.015 * v), R(0.05, 0.12)); }
        if (p > 0.82 && armed) { armed = false; bloom(t + 0.05); } if (p < 0.6) armed = true;
      },
      schedule: function (until) { while (next < until) next += P.events(next); },
      fade: function (v, sec) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(v * LEVEL, ctx.currentTime + sec); }
    };
  }
  window.__ambEngine = Engine; /* used for offline checks */

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = new AC(), eng = null, timer = null;
  function go() {
    if (eng || ctx.state !== 'running') return;
    eng = Engine(ctx, ctx.destination, PRESET);
    var introOn = document.querySelector('#intro,#ointro') && (document.body.classList.contains('intro-on') || document.documentElement.classList.contains('oi-on'));
    var t0 = window.__introT0 ? ctx.currentTime - (performance.now() - window.__introT0) / 1000 : null;
    eng.start(introOn && t0 != null && ctx.currentTime - t0 < 3.2 ? t0 : null);
    timer = setInterval(function () { eng.schedule(ctx.currentTime + 1.5); }, 500); eng.schedule(ctx.currentTime + 1.5);
    var zh = PRESET === 'garden' && document.getElementById('zh');
    if (zh) { var lastY = scrollY, lastT = performance.now(), vel = 0;
      var hero = function () { var now = performance.now(), dt = Math.max(16, now - lastT), dy = Math.abs(scrollY - lastY); lastY = scrollY; lastT = now;
        vel = vel * 0.7 + (dy / dt) * 0.3 * 3; var p = Math.min(1, Math.max(0, scrollY / Math.max(1, zh.offsetHeight - innerHeight))); eng.hero(p, vel); };
      addEventListener('scroll', hero, { passive: true }); setInterval(function () { vel *= 0.6; hero(); }, 120); }
  }
  function unlock() { ctx.resume().then(go).catch(function () {}); }
  if (ctx.state === 'running') go(); else unlock();
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (e) { addEventListener(e, unlock, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!eng) return;
    if (document.hidden) { eng.fade(0, 0.4); setTimeout(function () { if (document.hidden) ctx.suspend(); }, 450); }
    else ctx.resume().then(function () { eng.fade(1, 0.8); });
  });
})();
