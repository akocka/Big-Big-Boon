/* BBB motion layer for the inner pages: a blueprint sketch that draws itself in each page header,
   word-by-word headings, staggered cards, gentle parallax, and the team "rail" on Echipa.
   Works only with code and SVG, no extra photos. Respects prefers-reduced-motion. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  if (page.indexOf('blog-') === 0) page = 'article';
  var P = function (d, i) { return '<path pathLength="1" style="--d:' + i + '" d="' + d + '"/>'; };
  var SK = {
    /* the workshop hall */
    despre: [P('M10 232H310', 0), P('M44 232V112L160 52L276 112V232', 1), P('M44 112H276M74 112L160 68L246 112', 2), P('M112 112V232M208 112V232', 3), P('M134 232V168H186V232', 4), P('M60 136h36v22H60zM224 136h36v22h-36z', 5), P('M60 176h36v22H60zM224 176h36v22h-36z', 6)],
    /* the kiosk from the intro */
    echipa: [P('M18 228H302', 0), P('M58 214H262V224H58Z', 1), P('M70 214V110H250V214', 2), P('M44 124L160 50L276 124M44 132L160 58L276 132', 3), P('M64 112H256M160 62V112M160 86L118 112M160 86L202 112', 4), P('M102 132H218V184H102ZM160 132V184', 5), P('M94 184H226V192H94Z', 6)],
    /* kiosk front with measuring lines */
    preturi: [P('M80 92H240V218H80Z', 0), P('M58 92L160 40L262 92', 1), P('M106 116H214V170H106Z', 2), P('M98 170H222V178H98Z', 3), P('M80 240H240M80 233V247M240 233V247', 4), P('M266 92V218M259 92H273M259 218H273', 5), P('M128 240h4M188 240h4M266 150v4', 6)],
    /* a route to the pin */
    contact: [P('M30 214H290', 0), P('M48 214V176L70 160L92 176V214ZM64 214V194H76V214', 1), P('M92 200C140 200 140 150 186 150S226 120 226 104', 2), P('M226 104C208 82 202 70 202 58A24 24 0 0 1 250 58C250 70 244 82 226 104Z', 3), P('M226 50a8 8 0 1 0 .01 0', 4), P('M180 214h40M240 214h30', 5)],
    /* an open notebook with a sketch */
    blog: [P('M160 78C130 64 90 62 50 70V204C90 196 130 198 160 212C190 198 230 196 270 204V70C230 62 190 64 160 78Z', 0), P('M160 78V212', 1), P('M72 98H138M72 116H130M72 134H138M72 152H120', 2), P('M184 150L224 120L264 150', 3), P('M190 146V184H258V146', 4), P('M214 184V164H234V184', 5)]
  };
  SK.article = SK.blog;

  /* 1. blueprint sketch in the page header */
  var hero = document.querySelector('.sub-hero');
  if (hero && SK[page]) {
    hero.insertAdjacentHTML('beforeend', '<div class="mo-grid" aria-hidden="true"></div><div class="mo-bp" aria-hidden="true"><svg viewBox="0 0 320 250">' + SK[page].join('') + '</svg></div>');
  }

  /* 2. headings rise word by word (keeps <em> and links intact) */
  function split(el) {
    if (el.dataset.moSplit) return; el.dataset.moSplit = 1; var n = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var o = document.createElement('span'); o.className = 'mo-w'; var i = document.createElement('span');
            i.textContent = w; i.style.transitionDelay = i.style.animationDelay = (n++ * 0.055).toFixed(3) + 's'; o.appendChild(i); frag.appendChild(o);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    })(el);
  }
  if (!RM) {
    var h1 = document.querySelector('.sub-hero h1'); if (h1) { split(h1); h1.classList.add('mo-h1'); }
    [].forEach.call(document.querySelectorAll('.h2.rv'), function (h) { split(h); h.classList.add('mo-h2'); });
  }

  /* 3. cards in a row come in one after another */
  [].forEach.call(document.querySelectorAll('.team,.blist,.posts,.grid,.cards,.pgrid,.vals'), function (g) {
    [].forEach.call(g.children, function (c, i) { if (c.classList.contains('rv') && !c.style.transitionDelay) c.style.transitionDelay = Math.min(i, 6) * 0.08 + 's'; });
  });

  /* 4. Echipa: a line runs from card to card, from the first phone call to installation */
  var team = document.querySelector('.team');
  if (team && page === 'echipa') {
    var rail = document.createElement('div'); rail.className = 'mo-rail'; rail.setAttribute('aria-hidden', 'true'); rail.innerHTML = '<i></i>';
    team.insertBefore(rail, team.firstChild);
    var cards = [].slice.call(team.querySelectorAll('.tm'));
    cards.forEach(function (c, i) { c.insertAdjacentHTML('afterbegin', '<span class="mo-step">0' + (i + 1) + '</span>'); });
  }

  if (RM) { document.documentElement.classList.add('mo-rm'); return; }

  /* 5. scroll: header parallax + team rail progress */
  var bg = hero && hero.querySelector('.bgimg'), bp = hero && hero.querySelector('.mo-bp'), ticking = false;
  function onScroll() {
    ticking = false; var y = scrollY, H = innerHeight;
    if (bg && y < H * 1.2) { bg.style.translate = '0 ' + (y * 0.28).toFixed(1) + 'px'; }
    if (bp && y < H * 1.2) { bp.style.translate = '0 ' + (y * -0.12).toFixed(1) + 'px'; bp.style.opacity = Math.max(0, 1 - y / (H * 0.7)).toFixed(3); }
    if (team && rail) {
      var r = team.getBoundingClientRect(), p = Math.min(1, Math.max(0, (H * 0.78 - r.top) / (r.height * 0.85)));
      rail.style.setProperty('--p', p.toFixed(3));
      cards.forEach(function (c, i) { c.classList.toggle('mo-lit', p >= (i + 0.35) / cards.length); });
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();
})();
