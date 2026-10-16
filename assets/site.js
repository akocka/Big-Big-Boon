(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const body = document.body;

/* ---------- always start at the top unless a #section was requested ---------- */
try { history.scrollRestoration = 'manual'; } catch (e) {}
if (!location.hash) scrollTo(0, 0);
addEventListener('pageshow', e => { body.classList.remove('leaving'); if (e.persisted) return; if (!location.hash) scrollTo(0, 0); });

/* ---------- i18n ---------- */
const RO = {};
$$('[data-t]').forEach(e => { if (!(e.dataset.t in RO)) RO[e.dataset.t] = e.innerHTML; });
$$('[data-tp]').forEach(e => { RO[e.dataset.tp] = e.placeholder; });
RO.bSend = RO.bSend || 'Trimite cererea';
let LANG = 'ro';
const t = k => LANG === 'ro' ? (RO[k] ?? '') : ((window.T && T[LANG] && T[LANG][k] !== undefined && T[LANG][k] !== '') ? T[LANG][k] : (RO[k] ?? ''));
window.bbbT = t;
function setLang(l, save = true) {
  LANG = l; document.documentElement.lang = l;
  $$('[data-t]').forEach(e => { const v = t(e.dataset.t); if (e.dataset.t === 'blLang' && l === 'ro') { e.innerHTML = ''; return; } e.innerHTML = v; });
  $$('[data-tp]').forEach(e => { e.placeholder = t(e.dataset.tp); });
  $$('.langs button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
  document.title = t(body.dataset.title) || document.title;
  if (save) try { localStorage.setItem('bbb-lang', l); } catch (e) {}
  splitAll(true); buildMarquee(); buildStmt();
  if (window.b3relabel) window.b3relabel();
  if (window.k3render) window.k3render();
}
$$('.langs button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.l)));

/* ---------- split headings into words ---------- */
function splitEl(el) {
  const src = el.innerHTML;
  const tmp = document.createElement('div'); tmp.innerHTML = src;
  const out = [];
  const walk = (node, wrapTag) => {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) out.push(' '); else out.push(`<span class="w"><span>${wrapTag ? `<${wrapTag}>${w}</${wrapTag}>` : w}</span></span>`); });
      } else if (n.nodeName === 'BR') out.push('<br>');
      else walk(n, n.nodeName.toLowerCase());
    });
  };
  walk(tmp, null);
  el.innerHTML = out.join('');
  $$('.w>span', el).forEach((s, i) => { s.style.transitionDelay = (i * 0.07) + 's'; });
}
function splitAll(relang) { $$('.split').forEach(el => { const was = el.classList.contains('in'); splitEl(el); if (was || relang) requestAnimationFrame(() => el.classList.add('in')); }); }

/* ---------- marquee ---------- */
function buildMarquee() {
  const tr = $('#marq'), tpl = $('#marqItems'); if (!tr || !tpl) return;
  const items = $$('span', tpl.content).map(s => `<span>${(LANG !== 'ro' && t(s.dataset.t)) || s.innerHTML}</span>`).join('');
  tr.innerHTML = items + items + items + items;
}

/* ---------- statement word highlight ---------- */
let stmtWords = [];
function buildStmt() {
  const el = $('#stmt'); if (!el) return;
  const tmp = document.createElement('div'); tmp.innerHTML = t('stmt');
  const out = [];
  tmp.childNodes.forEach(n => {
    const cu = n.nodeName === 'B';
    (n.textContent || '').split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) out.push(' '); else out.push(`<span class="sw${cu ? ' cu' : ''}">${w}</span>`); });
  });
  el.innerHTML = out.join(''); stmtWords = $$('.sw', el); onScroll();
}

/* ---------- header, menu ---------- */
const hdr = $('#hdr'); let lastY = scrollY;
$('.burger')?.addEventListener('click', () => { const on = body.classList.toggle('menu'); $('.burger').setAttribute('aria-expanded', on); document.documentElement.style.overflow = on ? 'hidden' : ''; });
const closeMenu = () => { body.classList.remove('menu'); $('.burger')?.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; };
const PAGE = body.dataset.page;
$$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === PAGE));

/* ---------- smooth in-page links + product preselect ---------- */
function goTo(id) { const el = document.getElementById(id); if (!el) return false; el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); return true; }
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) {
    if (g.dataset.prod) preselect(g.dataset.prod);
    if (document.getElementById(g.dataset.go)) { e.preventDefault(); closeMenu(); $('#lbx')?.classList.remove('on'); goTo(g.dataset.go); }
    return;
  }
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = a.getAttribute('href');
  if (href.startsWith('#')) { if (goTo(href.slice(1))) { e.preventDefault(); closeMenu(); } return; }
  if (/^(tel:|mailto:|https?:)/.test(href)) return;
  const [path, hash] = href.split('#');
  const norm = x => (x || 'index').replace(/\.html$/, '') || 'index';
  const here = norm(location.pathname.split('/').pop());
  if (norm(path) === here && hash) { if (goTo(hash)) { e.preventDefault(); closeMenu(); history.replaceState(null, '', '#' + hash); } return; }
  if (path.endsWith('.html') && !REDUCE) { e.preventDefault(); closeMenu(); body.classList.add('leaving'); setTimeout(() => { location.href = href; }, 320); }
});

/* ---------- intro ---------- */
let introDone = false;
const startPage = () => {
  if (introDone) return; introDone = true;
  $$('.hero .split, .ph-hero .split').forEach(el => el.classList.add('in'));
  $$('.hero .fadein, .ph-hero .fadein').forEach((el, i) => setTimeout(() => el.classList.add('in'), 350 + i * 130));
  startHero();
};
(function () {
  const el = $('#intro'); if (!el) return startPage();
  let seen = false; try { seen = sessionStorage.getItem('bbb-intro2') === '1'; } catch (e) {}
  if (seen || REDUCE) { el.remove(); return startPage(); }
  document.documentElement.style.overflow = 'hidden';
  const end = () => { if (!el.isConnected || el.classList.contains('out')) return; el.classList.add('out'); document.documentElement.style.overflow = ''; try { sessionStorage.setItem('bbb-intro2', '1'); } catch (e) {} setTimeout(startPage, 150); setTimeout(() => el.remove(), 900); };
  el.addEventListener('click', end); setTimeout(end, 1900);
})();

/* ---------- hero video: builds once, then idles on a seamless loop ---------- */
function startHero() {
  const hero = $('.hero'); if (!hero) return;
  const v1 = $('.hv1', hero), v2 = $('.hv2', hero);
  const port = innerWidth / innerHeight < 1;
  const sfx = port ? '-m' : '';
  const saveData = navigator.connection && navigator.connection.saveData;
  if (REDUCE || saveData) { const p = $('.poster', hero); if (p) p.src = `img/hero-still${sfx}.jpg`; return; }
  const ext = v1.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
  v1.src = `video/hero-build${sfx}.${ext}`; v2.src = `video/hero-loop${sfx}.${ext}`;
  v2.load();
  const playLoop = () => { v2.currentTime = 0; v2.play().catch(() => {}); v2.classList.add('on'); };
  v1.addEventListener('ended', playLoop);
  v1.addEventListener('error', () => { const p = $('.poster', hero); if (p) p.src = `img/hero-still${sfx}.jpg`; });
  const pr = v1.play(); if (pr) pr.catch(() => { const p = $('.poster', hero); if (p) p.src = `img/hero-still${sfx}.jpg`; });
  new IntersectionObserver(es => { const vis = es[0].isIntersecting; [v1, v2].forEach(v => { if (!vis) v.pause(); }); if (vis) { if (v2.classList.contains('on')) v2.play().catch(() => {}); else if (!v1.ended) v1.play().catch(() => {}); } }, { threshold: 0.05 }).observe(hero);
}

/* ---------- reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
$$('.rv, .clip, .proc').forEach(e => io.observe(e));
$$('.split').forEach(el => { if (!el.closest('.hero') && !el.closest('.ph-hero')) io.observe(el); });

/* ---------- scroll loop: header, parallax, statement, mobile CTA ---------- */
const pars = $$('[data-par]');
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    hdr.classList.toggle('solid', y > 40);
    if (!body.classList.contains('menu')) hdr.classList.toggle('hide', y > lastY && y > 420 && !body.classList.contains('lbxon'));
    lastY = y;
    if (!REDUCE) pars.forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; const c = (r.top + r.height / 2 - vh / 2) / vh; el.style.transform = `translate3d(0,${(c * parseFloat(el.dataset.par) * 100).toFixed(2)}%,0)`; });
    if (stmtWords.length) { const el = $('#stmt'), r = el.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35))); const n = Math.round(p * stmtWords.length); stmtWords.forEach((w, i) => w.classList.toggle('on', i < n)); }
    const b3 = $('#build'); let inB3 = false; if (b3) { const r = b3.getBoundingClientRect(); inB3 = r.top < vh * 0.5 && r.bottom > vh * 0.5; }
    body.classList.toggle('inb3', inB3);
    const of = $('#oferta'); const nearForm = of ? of.getBoundingClientRect().top < vh * 0.9 : false;
    body.classList.toggle('showcta', y > vh * 0.7 && !nearForm);
  });
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);

/* ---------- magnetic buttons (desktop) ---------- */
if (FINE && !REDUCE) $$('.btn.p').forEach(b => {
  b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
  b.addEventListener('mouseleave', () => { b.style.transform = ''; });
});

/* ---------- projects: filter + lightbox ---------- */
$$('.filters button').forEach(btn => btn.addEventListener('click', () => {
  $$('.filters button').forEach(b => b.classList.toggle('on', b === btn));
  const f = btn.dataset.filter;
  $$('#prjGrid .pj').forEach(p => { const show = f === 'all' || p.dataset.f === f; p.classList.toggle('hidden', !show); if (show) { p.classList.remove('in'); requestAnimationFrame(() => p.classList.add('in')); } });
}));
const lbx = $('#lbx');
$$('.pj').forEach(p => p.addEventListener('click', () => {
  const im = $('img', p); const [tk, sk] = (p.dataset.cap || '|').split('|');
  $('img', lbx).src = im.currentSrc || im.src; $('img', lbx).alt = im.alt;
  $('.lc', lbx).innerHTML = `<b>${t(tk)}</b>${t(sk)}`;
  lbx.classList.add('on'); body.classList.add('lbxon'); $('.x', lbx).focus();
}));
const closeLbx = () => { lbx?.classList.remove('on'); body.classList.remove('lbxon'); };
lbx?.addEventListener('click', e => { if (e.target === lbx || e.target.classList.contains('x')) closeLbx(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { closeLbx(); closeMenu(); } });

/* ---------- quote wizard ---------- */
const wz = $('#wz');
function preselect(k) { if (!wz) return; const i = $(`input[name=product][data-k="${k}"]`, wz); if (i) { i.checked = true; i.closest('fieldset')?.classList.remove('bad'); } }
window.bbbPreselect = preselect;
if (wz) {
  let step = 1; const steps = $$('.stp', wz), bars = $$('.prog span', wz);
  const back = $('.back', wz), next = $('.next', wz);
  const show = n => { step = n; steps.forEach(s => s.classList.toggle('on', +s.dataset.step === n)); bars.forEach((b, i) => b.classList.toggle('on', i < n)); back.classList.toggle('on', n > 1); $('span', next).dataset.t = n === 3 ? 'bSend' : 'bNext'; $('span', next).innerHTML = t(n === 3 ? 'bSend' : 'bNext'); };
  const val = n => {
    let ok = true; const s = steps[n - 1];
    $$('[data-req]', s).forEach(f => {
      const k = f.dataset.req; let good = true;
      if (k === 'product') good = !!$('input[name=product]:checked', wz);
      else if (k === 'name') good = $('input[name=name]', wz).value.trim().length > 1;
      else if (k === 'phone') good = /^[+\d][\d\s().-]{7,}$/.test($('input[name=phone]', wz).value.trim());
      else if (k === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('input[name=email]', wz).value.trim());
      else if (k === 'consent') good = $('input[name=consent]', wz).checked;
      f.classList.toggle('bad', !good);
      if (k === 'consent') { const er = f.nextElementSibling; if (er) er.style.display = good ? 'none' : 'block'; }
      if (!good && ok) { ok = false; const inp = $('input', f); if (inp) inp.focus({ preventScroll: true }); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
    return ok;
  };
  wz.addEventListener('input', e => { const f = e.target.closest('[data-req]'); if (f) f.classList.remove('bad'); });
  wz.addEventListener('change', e => { const f = e.target.closest('[data-req]'); if (f) { f.classList.remove('bad'); if (f.dataset.req === 'consent') { const er = f.nextElementSibling; if (er) er.style.display = 'none'; } } });
  back.addEventListener('click', () => show(Math.max(1, step - 1)));
  next.addEventListener('click', () => {
    if (!val(step)) return;
    if (step < 3) { show(step + 1); wz.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const fd = new FormData(wz); const lines = [];
    const lab = { product: 'fProd', use: 'fUse', qty: 'fQty', dim: 'fDim', loc: 'fLoc', finish: 'fFin', ext: 'fExt', when: 'fWhen', budget: 'fBud', mount: 'fMont', name: 'fName', company: 'fCo', phone: 'fPhone', email: 'Email', pref: 'fPref', msg: 'fMsg' };
    const seen = {};
    for (const [k, v] of fd.entries()) { if (!v || k === 'consent') continue; const key = lab[k] || k; seen[key] = seen[key] ? seen[key] + ', ' + v : v; }
    Object.entries(seen).forEach(([k, v]) => lines.push(`${(k === 'Email' ? 'Email' : t(k)).replace(/\s*\*$/, '').replace(/\s*\(.*\)$/, '')}: ${v}`));
    $('#wzSum').textContent = lines.join('\n');
    wz.classList.add('ok'); wz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.bbbLead = Object.fromEntries(fd.entries());
  });
  show(1);
}

/* ---------- 3D builder glue ---------- */
$$('[data-b3f]').forEach(c => c.addEventListener('click', () => { $$('[data-b3f]').forEach(x => x.classList.toggle('on', x === c)); if (window.k3setFinish) window.k3setFinish(c.dataset.b3f); if (window.k3render) window.k3render(); }));
$('#b3send')?.addEventListener('click', () => {
  preselect('o1');
  const fin = $('[data-b3f].on')?.dataset.b3f === 'wood' ? 'fi2' : 'fi1';
  const fi = $(`input[name=finish][data-k="${fin}"]`); if (fi) fi.checked = true;
  goTo('oferta');
});
setTimeout(() => { if (!window.k3ready) $('.b3-stage')?.classList.add('nogl'); }, 15000);

/* ---------- init ---------- */
let saved = 'ro'; try { saved = localStorage.getItem('bbb-lang') || 'ro'; } catch (e) {}
if (saved !== 'ro') setLang(saved, false); else { splitAll(false); buildMarquee(); buildStmt(); }
onScroll();
})();
