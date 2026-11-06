/*! Consent manager — OHI Solutions. Self-hosted, no third parties until the visitor agrees.
 * GDPR + Legea 506/2004 (art. 4 alin. 5): non-essential storage only after consent.
 * Google Consent Mode v2: everything denied by default; GA loads only after "Statistici" is accepted.
 *
 * <script src="/consent.js" data-ga="G-XXXX" data-umami="uuid" data-policy="/confidentialitate"
 *         data-cookies="/cookie" data-accent="#c9a46a"></script>
 * Embeds: <iframe data-consent-src="https://maps…" title="…"></iframe>  (src is set only after consent)
 * Reopen: any element with [data-consent-open].   Events: window.ohiTrack('name', {props})
 */
(function () {
  'use strict';
  var S = document.currentScript || document.querySelector('script[src*="consent.js"]');
  var A = function (k) { return S && S.getAttribute('data-' + k) || ''; };
  var GA = A('ga'), UMAMI = A('umami'), UMAMI_SRC = A('umami-src') || 'https://cloud.umami.is/script.js';
  var POLICY = A('policy') || '/confidentialitate', COOKIES = A('cookies') || POLICY, ACC = A('accent') || '#1d1d1f';
  var KEY = 'consent', VER = 1, MAX_AGE = 1000 * 60 * 60 * 24 * 182; // re-ask after ~6 months

  /* ---- Consent Mode v2 defaults (must run before any Google tag) ---- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  /* ---- storage ---- */
  function read() { try { var c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.v === VER && Date.now() - c.ts < MAX_AGE) return c; } catch (e) {} return null; }
  function write(c) { c.v = VER; c.ts = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} return c; }
  var state = read();

  /* ---- texts ---- */
  var T = {
    ro: { t: 'Respectăm confidențialitatea ta', p: 'Folosim doar ce e necesar pentru ca site-ul să funcționeze. Cu acordul tău, putem folosi și statistici anonime de vizitare și putem încărca hărți Google.',
      acc: 'Accept toate', rej: 'Refuz', set: 'Personalizează', save: 'Salvează alegerea', pol: 'Politica de confidențialitate', ck: 'Politica de cookie-uri',
      n: 'Necesare', nd: 'Funcționarea site-ului, limba aleasă și alegerea ta privind cookie-urile. Mereu active.', on: 'Mereu active',
      a: 'Statistici', ad: 'Ne arată anonim ce pagini sunt vizitate, ca să îmbunătățim site-ul (Google Analytics). Fără publicitate.',
      x: 'Conținut extern', xd: 'Hărți Google Maps încorporate. Google poate seta propriile cookie-uri.',
      ml: 'Harta este găzduită de Google. Se încarcă doar cu acordul tău.', mb: 'Încarcă harta', mo: 'Deschide în Google Maps', h: 'Setări cookie' },
    hu: { t: 'Tiszteletben tartjuk az adataidat', p: 'Csak azt használjuk, ami a weboldal működéséhez szükséges. Hozzájárulásoddal névtelen látogatási statisztikát is használhatunk és Google-térképeket tölthetünk be.',
      acc: 'Összes elfogadása', rej: 'Elutasítom', set: 'Beállítások', save: 'Mentés', pol: 'Adatvédelmi tájékoztató', ck: 'Süti szabályzat',
      n: 'Szükséges', nd: 'A weboldal működése, a választott nyelv és a sütikkel kapcsolatos döntésed. Mindig aktív.', on: 'Mindig aktív',
      a: 'Statisztika', ad: 'Névtelenül mutatja, mely oldalakat látogatják, hogy javíthassuk az oldalt (Google Analytics). Nincs reklám.',
      x: 'Külső tartalom', xd: 'Beágyazott Google Maps térképek. A Google saját sütiket helyezhet el.',
      ml: 'A térképet a Google szolgáltatja. Csak a hozzájárulásoddal töltődik be.', mb: 'Térkép betöltése', mo: 'Megnyitás a Google Mapsben', h: 'Süti beállítások' },
    en: { t: 'We respect your privacy', p: 'We only use what is needed for the site to work. With your consent we may also use anonymous visit statistics and load Google maps.',
      acc: 'Accept all', rej: 'Reject', set: 'Customise', save: 'Save choice', pol: 'Privacy policy', ck: 'Cookie policy',
      n: 'Necessary', nd: 'Site functionality, your chosen language and your cookie choice. Always on.', on: 'Always on',
      a: 'Statistics', ad: 'Shows us anonymously which pages are visited so we can improve the site (Google Analytics). No advertising.',
      x: 'External content', xd: 'Embedded Google Maps. Google may set its own cookies.',
      ml: 'This map is hosted by Google and loads only with your consent.', mb: 'Load map', mo: 'Open in Google Maps', h: 'Cookie settings' }
  };
  function L() { var l = (document.documentElement.lang || 'ro').slice(0, 2).toLowerCase(); return T[l] ? l : 'ro'; }
  function t(k) { return T[L()][k]; }

  /* ---- apply consent ---- */
  var gaLoaded = false, umLoaded = false;
  function apply() {
    var a = !!(state && state.a), x = !!(state && state.x);
    gtag('consent', 'update', { analytics_storage: a ? 'granted' : 'denied' });
    if (a && GA && !gaLoaded) { gaLoaded = true; var s = document.createElement('script'); s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA); document.head.appendChild(s);
      gtag('js', new Date()); gtag('config', GA, { allow_google_signals: false, allow_ad_personalization_signals: false }); }
    if (!a && gaLoaded) clearGa();
    if (UMAMI && !umLoaded) { umLoaded = true; var u = document.createElement('script'); u.defer = true; u.src = UMAMI_SRC; // cookieless
      u.setAttribute('data-website-id', UMAMI); u.setAttribute('data-do-not-track', 'true'); document.head.appendChild(u); }
    embeds(x);
    try { document.dispatchEvent(new CustomEvent('consentchange', { detail: { analytics: a, external: x } })); } catch (e) {}
  }
  function clearGa() { // remove GA cookies when consent is withdrawn
    document.cookie.split(';').forEach(function (c) { var n = c.split('=')[0].trim(); if (/^_ga|^_gid|^_gat/.test(n)) {
      var h = location.hostname.split('.'); for (var i = 0; i < h.length; i++) { var d = h.slice(i).join('.');
        document.cookie = n + '=; Max-Age=0; path=/; domain=' + d; } document.cookie = n + '=; Max-Age=0; path=/'; } });
  }

  /* ---- click-to-load embeds ---- */
  function embeds(ok) {
    [].forEach.call(document.querySelectorAll('iframe[data-consent-src]'), function (f) {
      var ph = f.previousElementSibling && f.previousElementSibling.classList.contains('cm-ph') ? f.previousElementSibling : null;
      if (ok) { if (!f.src || f.src === 'about:blank') f.src = f.getAttribute('data-consent-src'); f.style.visibility = ''; if (ph) ph.remove(); return; }
      if (f.src && f.src !== 'about:blank') f.src = 'about:blank';
      f.style.visibility = 'hidden';
      if (!ph) { ph = document.createElement('div'); ph.className = 'cm-ph'; f.parentNode.insertBefore(ph, f);
        var p = f.parentNode; if (getComputedStyle(p).position === 'static') p.style.position = 'relative'; }
      var q = (f.getAttribute('data-consent-src').match(/[?&]q=([^&]+)/) || [])[1] || '';
      ph.innerHTML = '<div><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>' +
        '<p>' + t('ml') + '</p><button type="button">' + t('mb') + '</button>' +
        (q ? '<a href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener noreferrer">' + t('mo') + ' ↗</a>' : '') + '</div>';
      ph.querySelector('button').onclick = function () { save({ a: !!(state && state.a), x: true }); };
    });
  }

  /* ---- UI ---- */
  var css = '.cm{position:fixed;z-index:2147483000;left:16px;bottom:16px;width:min(440px,calc(100vw - 32px));font:400 14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d1d1f;background:#fff;border-radius:18px;box-shadow:0 24px 70px -20px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.06);padding:20px;transform:translateY(20px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}' +
    '.cm.in{transform:none;opacity:1}.cm h2{font-family:inherit;font-size:16px;font-weight:600;line-height:1.3;margin:0 0 6px;letter-spacing:0}.cm p{margin:0 0 14px;color:#4a4a4f}.cm a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
    '.cm .b{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cm button{font-family:inherit;font-size:14px;font-weight:600;line-height:1;border-radius:12px;padding:13px 10px;cursor:pointer;border:1.5px solid #1d1d1f;background:#fff;color:#1d1d1f;min-height:44px}' +
    '.cm button.p{background:' + ACC + ';border-color:' + ACC + ';color:#fff}.cm button.l{grid-column:1/-1;border:0;background:none;padding:8px;text-decoration:underline;text-underline-offset:3px;font-weight:500;min-height:0}' +
    '.cm .lk{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:12px;color:#6e6e73}' +
    '.cm .cat{border-top:1px solid #ececef;padding:12px 0;display:grid;grid-template-columns:1fr auto;gap:2px 14px;align-items:center}.cm .cat b{font-weight:600}.cm .cat small{grid-column:1;color:#6e6e73;font-size:12.5px;line-height:1.45}.cm .cat em{font-style:normal;font-size:12px;color:#6e6e73;grid-row:1;grid-column:2}' +
    '.cm .sw{grid-row:1/span 2;grid-column:2;position:relative;width:44px;height:26px}.cm .sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}.cm .sw i{position:absolute;inset:0;border-radius:99px;background:#d2d2d7;transition:.25s}.cm .sw i::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.25s}' +
    '.cm .sw input:checked+i{background:' + ACC + '}.cm .sw input:checked+i::after{transform:translateX(18px)}.cm .sw input:focus-visible+i{outline:2px solid ' + ACC + ';outline-offset:2px}' +
    '.cm button:focus-visible,.cm a:focus-visible{outline:2px solid ' + ACC + ';outline-offset:2px}' +
    '@media(max-width:560px){.cm{left:8px;right:8px;bottom:8px;width:auto;padding:18px;border-radius:16px;max-height:85vh;overflow:auto}}' +
    '.cm-ph{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:#f2efe9;color:#333;padding:20px;z-index:1;font:400 14px/1.5 system-ui,sans-serif}.cm-ph>div{max-width:320px;display:grid;justify-items:center;gap:10px}.cm-ph p{margin:0}' +
    '.cm-ph button{font-family:inherit;font-size:14px;font-weight:600;line-height:1;border:0;border-radius:99px;padding:12px 20px;background:' + ACC + ';color:#fff;cursor:pointer}.cm-ph a{font-size:13px;color:inherit}';
  var box;
  function mount() {
    if (!document.getElementById('cm-css')) { var st = document.createElement('style'); st.id = 'cm-css'; st.textContent = css; document.head.appendChild(st); }
  }
  function show(detail) {
    mount(); if (box) box.remove();
    box = document.createElement('div'); box.className = 'cm'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-labelledby', 'cm-t'); box.setAttribute('lang', L());
    var a = !!(state && state.a), x = !!(state && state.x);
    var links = '<div class="lk"><a href="' + POLICY + '">' + t('pol') + '</a>' + (COOKIES !== POLICY ? '<a href="' + COOKIES + '">' + t('ck') + '</a>' : '') + '</div>';
    if (!detail) {
      box.innerHTML = '<h2 id="cm-t">' + t('t') + '</h2><p>' + t('p') + '</p><div class="b"><button type="button" data-k="rej">' + t('rej') + '</button><button type="button" class="p" data-k="acc">' + t('acc') + '</button><button type="button" class="l" data-k="set">' + t('set') + '</button></div>' + links;
    } else {
      var cat = function (id, on, lock) { return '<div class="cat"><b>' + t(id) + '</b>' + (lock ? '<em>' + t('on') + '</em>' : '<span class="sw"><input type="checkbox" id="cm-' + id + '"' + (on ? ' checked' : '') + ' aria-label="' + t(id) + '"><i></i></span>') + '<small>' + t(id + 'd') + '</small></div>'; };
      box.innerHTML = '<h2 id="cm-t">' + t('h') + '</h2>' + cat('n', 1, 1) + cat('a', a) + cat('x', x) +
        '<div class="b" style="margin-top:6px"><button type="button" data-k="rej">' + t('rej') + '</button><button type="button" class="p" data-k="acc">' + t('acc') + '</button><button type="button" class="l" data-k="save">' + t('save') + '</button></div>' + links;
    }
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('in'); }); });
    box.addEventListener('click', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return;
      if (k === 'acc') save({ a: true, x: true }); else if (k === 'rej') save({ a: false, x: false });
      else if (k === 'set') show(true);
      else if (k === 'save') save({ a: box.querySelector('#cm-a').checked, x: box.querySelector('#cm-x').checked }); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state) hide(); });
    var f = box.querySelector('button.p'); if (f && detail) f.focus({ preventScroll: true });
  }
  function hide() { if (!box) return; var b = box; box = null; b.classList.remove('in'); setTimeout(function () { b.remove(); }, 400); }
  function save(c) { state = write(c); hide(); apply(); }

  /* ---- lead / click tracking (only reaches GA if consented; Umami is cookieless) ---- */
  window.ohiTrack = function (name, props) {
    try { if (gaLoaded) gtag('event', name, props || {}); } catch (e) {}
    try { if (window.umami && umami.track) umami.track(name, props || {}); } catch (e) {}
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a,[data-consent-open]'); if (!el) return;
    if (el.hasAttribute('data-consent-open')) { e.preventDefault(); show(true); return; }
    var h = el.getAttribute('href') || '';
    if (/^tel:/.test(h)) ohiTrack('click_phone'); else if (/^mailto:/.test(h)) ohiTrack('click_email');
    else if (/wa\.me|whatsapp/.test(h)) ohiTrack('click_whatsapp'); else if (/facebook\.com/.test(h)) ohiTrack('click_facebook');
  }, true);

  /* ---- boot ---- */
  window.ohiConsent = { open: function () { show(true); }, get: function () { return state; } };
  var framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
  function boot() { apply(); if (!state && !framed) show(false); // inside a preview frame: stay denied, no banner
    new MutationObserver(function () { if (box) show(box.querySelector('.cat') ? true : false); embeds(!!(state && state.x)); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
