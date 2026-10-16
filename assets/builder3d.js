import { buildScene } from './kscene.js';

const sec = document.getElementById('build');
const stage = sec && sec.querySelector('.b3-stage');
const fail = (e) => { if (e) console.warn('3D fallback:', e); if (stage) stage.classList.add('nogl'); window.k3ready = true; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

(async function main() {
  if (!sec) return;
  if (reduce) return fail();
  const mobile = innerWidth < 900;
  let K;
  try { K = await buildScene(document.getElementById('k3c'), mobile); } catch (e) { return fail(e); }
  const { THREE, renderer, scene, camera, kiosk, parts, M, glows, eaveGlows, dl, inLight, pool, festoon, bulbM, bulbGlows, sun, hemi, rim, premiumOnly } = K;
  if (mobile) sun.shadow.mapSize.set(1024, 1024);
  /* blue-hour sky + concrete, same look as the hero film */
  const skyTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#060a14'); gr.addColorStop(.45, '#101c33'); gr.addColorStop(.72, '#243450'); gr.addColorStop(.86, '#3b3f52'); gr.addColorStop(1, '#4a3e3c');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  scene.background = skyTex; scene.fog = new THREE.Fog(new THREE.Color('#1c2536'), 13, 34);
  const conc = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#2a2d31'; g.fillRect(0, 0, 512, 512); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9000; i++) { const v = 30 + r() * 40 | 0; g.fillStyle = `rgba(${v},${v + 2},${v + 5},${.25 + r() * .3})`; g.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); }
    g.strokeStyle = 'rgba(10,10,12,.55)'; g.lineWidth = 2; for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  K.ground.geometry = new THREE.PlaneGeometry(60, 60); K.ground.material = new THREE.MeshStandardMaterial({ map: conc, roughness: .62, metalness: .05, color: 0x9aa0a8 });
  hemi.color.set('#8fa6d6'); hemi.groundColor.set('#2a2420'); sun.color.set('#c9d6f2'); rim.color.set('#9fb8ff');
  M.glass.envMapIntensity = .35; M.glass.opacity = .09; M.wool.color = new THREE.Color(0xa89a70);

  const STEP_Q = [0, 0.17, 0.33, 0.57, 0.73];
  const stepLis = [...document.querySelectorAll('.b3-list li')];
  const descLis = [...document.querySelectorAll('.b3-descs li')];
  const curEl = document.getElementById('b3cur'), barEl = document.getElementById('b3bar'), descEl = document.getElementById('b3desc'), bigEl = document.getElementById('b3big');
  let lastStep = -1, finish = 'black', dirty = true;
  window.k3setFinish = (f) => { finish = f; K.finishable.forEach(o => { o.mesh.material = f === 'wood' ? o.wood : (o.black || o.mesh.material); }); dirty = true; };
  window.b3relabel = () => { lastStep = -1; dirty = true; };

  const clamp = THREE.MathUtils.clamp, seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const inOut = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const outCubic = x => 1 - Math.pow(1 - x, 3);
  const camTgt = new THREE.Vector3(0, 1.6, 0);
  let portrait = false;
  function apply(p) {
    const q = seg(p, 0.02, 0.8), L = seg(p, 0.82, 0.95), fl = inOut(seg(p, 0.8, 0.92)), bulbs = seg(p, 0.86, 0.97);
    for (const g of parts) {
      const u = g.userData, k = inOut(seg(q, u.win[0], u.win[1]));
      g.visible = q >= u.win[0] - 0.001 && (finish !== 'wood' || !premiumOnly.includes(g));
      if (u.grow) { const sy = Math.max(0.001, k); g.scale.set(1, sy, 1); g.position.copy(u.base); g.position.y = u.base.y - (1 - sy) * u.h / 2; g.rotation.set(0, 0, 0); continue; }
      const f = 1 - k;
      g.position.copy(u.base).addScaledVector(u.dir, f * (u.dist + 1.2) * u.rand * u.k); g.position.y += f * 1.4;
      g.rotation.set(u.ax * u.spin * f * 1.6, u.ay * u.spin * f * 1.6, u.az * u.spin * f * 1.6);
    }
    kiosk.rotation.y = -0.3 + (1 - outCubic(seg(p, 0, 0.92))) * Math.PI * 2;
    let si = 0; STEP_Q.forEach((t, i) => { if (q >= t) si = i; }); if (p >= 0.8) si = 5;
    if (si !== lastStep) {
      lastStep = si;
      stepLis.forEach((li, i) => { li.classList.toggle('on', i === si); li.classList.toggle('done', i < si); });
      if (curEl && stepLis[si]) curEl.innerHTML = '<em>0' + (si + 1) + '</em>' + stepLis[si].innerHTML;
      if (descEl && descLis[si]) { descEl.classList.remove('in'); void descEl.offsetWidth; descEl.innerHTML = descLis[si].innerHTML; descEl.classList.add('in'); }
      if (bigEl) bigEl.textContent = '0' + (si + 1);
    }
    if (barEl) barEl.style.width = (p * 100).toFixed(1) + '%';
    const d = (portrait ? 1.6 : 1) * (12.6 - 2.2 * inOut(p)), hgt = 4.6 - 1.9 * inOut(p);
    camera.position.set(0, hgt * (portrait ? 1.2 : 1), d); camera.lookAt(camTgt);
    sun.intensity = 1.35 - .75 * L; hemi.intensity = .55 - .25 * L; rim.intensity = .9 - .3 * L;
    const lampsOn = finish === 'wood' ? 0 : L;
    M.lampOn.emissiveIntensity = 3.2 * lampsOn; glows.forEach(s => { s.material.opacity = 0.7 * lampsOn; });
    dl.emissiveIntensity = 2.8 * L; inLight.intensity = 10 * L;
    eaveGlows.forEach(s => { s.material.opacity = 0.8 * L; });
    pool.material.opacity = 0.6 * L;
    festoon.visible = fl > 0.001; festoon.position.y = -3.9 * (1 - fl);
    bulbM.emissiveIntensity = 4 * bulbs; bulbGlows.forEach(s => { s.material.opacity = 0.6 * bulbs; });
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    portrait = w / h < 0.9;
    camera.aspect = w / h; camera.fov = portrait ? 36 : 30;
    if (portrait) camera.setViewOffset(w, h, 0, h * 0.17, w, h);
    else if (w > 900) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix(); dirty = true;
  }
  addEventListener('resize', resize); resize();
  let cur = 0, goal = 0, running = false, visible = false, last = performance.now();
  const readGoal = () => { const r = sec.getBoundingClientRect(); goal = clamp(-r.top / (r.height - innerHeight), 0, 1); };
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    readGoal();
    const d = goal - cur;
    if (Math.abs(d) > 0.0004 || dirty) {
      cur += d * Math.min(1, dt * 7); if (Math.abs(goal - cur) < 0.0004) cur = goal;
      apply(cur); renderer.render(scene, camera); dirty = false;
    }
    if (visible && !document.body.classList.contains('menu')) requestAnimationFrame(tick); else running = false;
  }
  const kick = () => { if (visible && !running && !document.body.classList.contains('menu')) { running = true; last = performance.now(); requestAnimationFrame(tick); } };
  document.querySelector('.burger')?.addEventListener('click', () => setTimeout(kick, 50));
  new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }, { rootMargin: '100px 0px' }).observe(sec);
  readGoal(); cur = goal; apply(cur); renderer.render(scene, camera);
  stage.classList.add('ready'); window.k3ready = true;
  window.k3render = () => { dirty = true; kick(); if (!running) { apply(cur); renderer.render(scene, camera); } };
})().catch(fail);
