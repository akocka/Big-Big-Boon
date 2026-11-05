/* Big Big Boon intro sound: a soundtrack generated live (Web Audio, no music files) synced to the intro:
   drafting ticks while the blueprint draws, a deep timber thud when the kiosk fills in, the light switch
   and hum when the lights flicker on, a shimmer under the logo, and a voice line in the visitor's language.
   Browsers only allow sound after the visitor has interacted with the site; when sound is blocked, a small
   "Sound" button appears on the intro. The visitor's choice is remembered (localStorage "bbb-sound"). */
(function () {
  var intro = document.getElementById('intro');
  if (!intro || !window.AudioContext && !window.webkitAudioContext) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var pref = null; try { pref = localStorage.getItem('bbb-sound'); } catch (e) {}
  var T0 = window.__introT0 || performance.now();
  var lang = 'ro'; try { lang = localStorage.getItem('bbb-lang') || 'ro'; } catch (e) {}
  if (['ro', 'hu', 'en'].indexOf(lang) < 0) lang = 'ro';
  var LBL = { ro: ['Sunet', 'Fără sunet'], hu: ['Hang', 'Némítás'], en: ['Sound', 'Mute'] }[lang];

  var ctx = null, master = null, started = false, voiceBuf = null, nodes = [];
  function el() { return (performance.now() - T0) / 1000; }

  /* small sound button on the intro */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ib-snd';
  var icoOn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"/></svg>';
  var icoOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function label(on) { btn.innerHTML = (on ? icoOn : icoOff) + '<span>' + (on ? LBL[1] : LBL[0]) + '</span>'; btn.setAttribute('aria-pressed', on); }
  var css = document.createElement('style');
  css.textContent = '.ib-snd{position:absolute;left:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:3;display:flex;align-items:center;gap:8px;height:42px;padding:0 16px 0 12px;border-radius:999px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#F1EFEA;font:600 13px var(--fd,system-ui);cursor:pointer;opacity:0;animation:ibUp .5s .4s forwards}' +
    '.ib-snd svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ib-snd[aria-pressed="false"]{box-shadow:0 0 0 0 rgba(217,164,102,.5);animation:ibUp .5s .4s forwards,ibPing 1.8s 1s infinite}' +
    '@keyframes ibPing{70%{box-shadow:0 0 0 10px rgba(217,164,102,0)}100%{box-shadow:0 0 0 0 rgba(217,164,102,0)}}';
  document.head.appendChild(css);
  label(false); intro.appendChild(btn);

  function ac() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.9;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    fetch('audio/vo-' + lang + '.mp3').then(function (r) { return r.arrayBuffer(); })
      .then(function (b) { return new Promise(function (ok, no) { ctx.decodeAudioData(b, ok, no); }); })
      .then(function (buf) { voiceBuf = buf; if (started) voice(); }).catch(function () {});
    return ctx;
  }
  function track(n) { nodes.push(n); return n; }
  function noiseBuf(sec) { var b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function at(t) { return ctx.currentTime + Math.max(0, t - el()); }

  /* sound pieces */
  function drone(t) {
    var g = track(ctx.createGain()), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(0.11, at(t + 1.4)); g.gain.setValueAtTime(0.11, at(3.3)); g.gain.exponentialRampToValueAtTime(0.0001, at(5.2));
    [55, 82.4, 110.3].forEach(function (fr, i) { var o = track(ctx.createOscillator()); o.type = i ? 'sine' : 'triangle'; o.frequency.value = fr; o.detune.value = i * 4; o.connect(f); o.start(at(t)); o.stop(at(5.4)); });
    f.connect(g); g.connect(master);
  }
  function tick(t, pitch) {
    var s = track(ctx.createBufferSource()); s.buffer = noiseBuf(0.08);
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = pitch; f.Q.value = 9;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(0.22, at(t + 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, at(t + 0.07));
    s.connect(f); f.connect(g); g.connect(master); s.start(at(t)); s.stop(at(t + 0.09));
  }
  function thud(t) {
    var o = track(ctx.createOscillator()), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(150, at(t)); o.frequency.exponentialRampToValueAtTime(48, at(t + 0.35));
    g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(0.7, at(t + 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, at(t + 0.6));
    o.connect(g); g.connect(master); o.start(at(t)); o.stop(at(t + 0.65));
    var s = track(ctx.createBufferSource()); s.buffer = noiseBuf(0.3); var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    var n = ctx.createGain(); n.gain.setValueAtTime(0.25, at(t)); n.gain.exponentialRampToValueAtTime(0.0001, at(t + 0.22));
    s.connect(f); f.connect(n); n.connect(master); s.start(at(t)); s.stop(at(t + 0.3));
  }
  function lights(t) {
    tick(t - 0.02, 3200); tick(t + 0.01, 1800);
    var o = track(ctx.createOscillator()), o2 = track(ctx.createOscillator()), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 100; o2.type = 'sine'; o2.frequency.value = 50; f.type = 'lowpass'; f.frequency.value = 700;
    var v = 0.05, k = [[0, 0.0001], [0.24, v], [0.37, 0.006], [0.55, v], [0.68, 0.02], [1.1, v * 0.8], [2.2, v * 0.6], [3.4, 0.0001]];
    g.gain.setValueAtTime(0.0001, at(t)); k.forEach(function (p) { g.gain.linearRampToValueAtTime(p[1], at(t + p[0])); });
    o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(at(t)); o2.start(at(t)); o.stop(at(t + 3.5)); o2.stop(at(t + 3.5));
  }
  function shimmer(t) {
    [880, 1318.5, 1760, 2637].forEach(function (fr, i) {
      var o = track(ctx.createOscillator()), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = fr;
      var s = t + i * 0.07; g.gain.setValueAtTime(0.0001, at(s)); g.gain.exponentialRampToValueAtTime(0.06 / (i + 1), at(s + 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, at(s + 1.6));
      o.connect(g); g.connect(master); o.start(at(s)); o.stop(at(s + 1.7));
    });
  }
  var voiced = false;
  function voice() {
    if (voiced || !voiceBuf) return; voiced = true;
    var s = track(ctx.createBufferSource()), g = ctx.createGain(); s.buffer = voiceBuf; g.gain.value = 1.15;
    s.connect(g); g.connect(master);
    var when = Math.max(0, 2.35 - el()); if (el() > 4.2) return; /* too late, the intro is over */
    s.start(ctx.currentTime + when);
  }
  function play() {
    if (started) return; started = true;
    var t = el();
    if (t < 3.6) drone(Math.max(0, t));
    for (var i = 0; i < 8; i++) { var tt = i * 0.09 + 0.55; if (tt > t) tick(tt, 2400 + i * 260); }
    if (t < 1.2) thud(1.2);
    if (t < 1.75) lights(1.75);
    if (t < 2.1) shimmer(2.1);
    voice();
  }
  function stopAll(fade) {
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + (fade || 0.25));
  }
  function enable() {
    ac(); var go = function () { label(true); play(); };
    if (ctx.state === 'suspended') ctx.resume().then(go).catch(function () {}); else go();
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var on = btn.getAttribute('aria-pressed') === 'true';
    try { localStorage.setItem('bbb-sound', on ? 'off' : 'on'); } catch (x) {}
    if (on) { stopAll(0.2); label(false); } else { if (master) master.gain.value = 0.9; started = false; voiced = false; enable(); }
  });

  /* try to start on its own (works only where the browser allows sound without a tap) */
  if (pref !== 'off') {
    ac();
    var tryGo = function () { if (ctx.state === 'running') { label(true); play(); } };
    if (ctx.state === 'running') tryGo(); else ctx.resume().then(tryGo).catch(function () {});
    /* the first tap anywhere on the intro (except Skip) also unlocks it */
    intro.addEventListener('pointerdown', function (e) { if (!e.target.closest('.ib-skip') && !started) enable(); }, { once: true });
  }
  /* when the intro ends: let the voice finish, fade the rest */
  document.getElementById('iskip') && document.getElementById('iskip').addEventListener('click', function () { stopAll(0.35); });
})();
