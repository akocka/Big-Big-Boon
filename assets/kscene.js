import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export async function buildScene(cvs, mobile) {
  const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const BG_DAY = new THREE.Color('#15181c'), BG_NIGHT = new THREE.Color('#0b0d10');
  scene.background = BG_DAY.clone();
  scene.fog = new THREE.Fog(scene.background, 14, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xe4e9f0, 0x2b2520, 0.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.4);
  sun.position.set(-5, 9, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xbfd2ff, 0.7); rim.position.set(6, 5, -6); scene.add(rim);

  /* ---------- textures (cut from Big Big Boon's own photos) ---------- */
  const TL = new THREE.TextureLoader();
  const load = (src) => TL.loadAsync(src);
  let T;
  try {
    const [seam, planks, pine, slat] = await Promise.all(['img/tex-seam.jpg', 'img/tex-planks.jpg', 'img/tex-pine.jpg', 'img/tex-slat.jpg'].map(load));
    T = { seam, planks, pine, slat };
  } catch (e) { throw e; }
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const rep = (base, rx, ry, mirror = true) => {
    const t = base.clone();
    t.wrapS = t.wrapT = mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, maxAniso); t.needsUpdate = true;
    return t;
  };
  // real-world scale of each photo texture (metres covered by one tile)
  const SC = { seam: [0.5, 2.3], planks: [2.8, 0.74], pine: [0.45, 0.8], slat: [0.26, 1.2] };
  const mat = (kind, w, h, o = {}) => new THREE.MeshStandardMaterial({
    map: rep(T[kind], w / SC[kind][0], h / SC[kind][1], kind !== 'seam'),
    roughness: o.r ?? 0.62, metalness: o.m ?? 0, envMapIntensity: o.env ?? 0.8, color: o.c ?? 0xffffff
  });
  const plain = (c, r = 0.6, m = 0, env = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, envMapIntensity: env });

  // noise texture for mineral wool insulation
  const wool = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#cdb97c'; g.fillRect(0, 0, 128, 128);
    let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '120,100,50' : '240,225,170'},${0.15 + rnd() * 0.25})`; g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 3, 1 + rnd() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  /* ---------- dimensions (metres, from the premium kiosk photos) ---------- */
  const W = 3.0, D = 2.2, H = 2.3, y0 = 0.14, yt = y0 + H, t = 0.06, PEAK = 0.95, pitch = PEAK / (W / 2);
  const kiosk = new THREE.Group(); scene.add(kiosk);
  const parts = [];
  const box = (w, h, d, m, x, y, z) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); return g; };
  const beam = (ax, ay, bx, by, th, dz, z, m) => {
    const len = Math.hypot(bx - ax, by - ay);
    const g = new THREE.Mesh(new THREE.BoxGeometry(len, th, dz), m);
    g.position.set((ax + bx) / 2, (ay + by) / 2, z); g.rotation.z = Math.atan2(by - ay, bx - ax); return g;
  };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const part = (name, dir, dist, meshes, spin = 1) => {
    const g = new THREE.Group(); g.name = name;
    const bb = new THREE.Box3(); meshes.forEach(m => { m.updateMatrixWorld(); bb.expandByObject(m); });
    const c = bb.getCenter(new THREE.Vector3());
    meshes.forEach(m => { m.position.sub(c); m.castShadow = true; m.receiveShadow = true; g.add(m); });
    g.position.copy(c);
    const size = bb.getSize(new THREE.Vector3()).length();
    g.userData = {
      base: c.clone(), dir: new THREE.Vector3(...dir).normalize(), dist, size, h: bb.getSize(new THREE.Vector3()).y,
      rand: 0.8 + rnd() * 0.4, spin: (rnd() * 2 - 1) * 0.35 * spin, ax: rnd(), ay: rnd() * 0.5, az: rnd()
    };
    kiosk.add(g); parts.push(g); return g;
  };

  /* materials (two finishes) */
  const M = {
    base: plain(0x2a2d31, 0.55, 0.5),
    frame: mat('pine', 0.1, 2.3, { r: 0.7 }),
    wool: new THREE.MeshStandardMaterial({ map: wool, roughness: 0.95 }),
    pineIn: mat('pine', 3, 2.3, { r: 0.55, env: 0.6 }),
    roof: plain(0x24272c, 0.5, 0.5, 0.7),
    black: plain(0x15171a, 0.55, 0.35),
    wood: (w, h) => mat('planks', w, h, { r: 0.58 }),
    seam: (w, h) => mat('seam', w, h, { r: 0.5, m: 0.35, env: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xdfeefa, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, envMapIntensity: 2, depthWrite: false }),
    lampOn: new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffc27a, emissiveIntensity: 0 })
  };
  const finishable = []; // {mesh, black, wood}
  const fin = (mesh, black, wood) => { finishable.push({ mesh, black, wood }); return mesh; };

  /* base */
  part('base', [0, -1, 0], 0.7, [box(W + 0.14, y0, D + 0.14, M.base, 0, y0 / 2, 0)], 0.2);

  /* frame (stays as the core) */
  const fr = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fr.push(box(0.1, H, 0.1, M.frame, sx * (W / 2 - 0.12), y0 + H / 2, sz * (D / 2 - 0.12)));
  for (const sx of [-1, 1]) fr.push(box(0.09, H, 0.09, M.frame, sx * 1.05, y0 + H / 2, D / 2 - 0.12));
  for (const yy of [y0 + 0.05, yt - 0.05]) {
    fr.push(box(W - 0.2, 0.1, 0.1, M.frame, 0, yy, D / 2 - 0.12), box(W - 0.2, 0.1, 0.1, M.frame, 0, yy, -D / 2 + 0.12));
    fr.push(box(0.1, 0.1, D - 0.2, M.frame, -W / 2 + 0.12, yy, 0), box(0.1, 0.1, D - 0.2, M.frame, W / 2 - 0.12, yy, 0));
  }
  part('frame', [0, 1, 0], 0, fr, 0);

  /* interior pine lining (stays) */
  const inner = [];
  const pl = (w, h, m, x, y, z, ry = 0, rx = 0) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); g.position.set(x, y, z); g.rotation.set(rx, ry, 0); return g; };
  inner.push(pl(W - 0.3, H - 0.02, M.pineIn, 0, y0 + H / 2, -D / 2 + 0.18));
  inner.push(pl(D - 0.36, H - 0.02, M.pineIn, -W / 2 + 0.18, y0 + H / 2, 0, Math.PI / 2));
  inner.push(pl(D - 0.36, H - 0.02, M.pineIn, W / 2 - 0.18, y0 + H / 2, 0, -Math.PI / 2));
  inner.push(pl(W - 0.3, D - 0.36, M.pineIn, 0, yt - 0.02, 0, 0, Math.PI / 2));
  inner.push(pl(W - 0.3, D - 0.36, mat('planks', W, D, { r: 0.7, c: 0x9a8d80 }), 0, y0 + 0.01, 0, 0, -Math.PI / 2));
  const dl = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe0b0, emissiveIntensity: 0 });
  for (const x of [-0.8, 0, 0.8]) inner.push(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 20), dl)), inner.at(-1).position.set(x, yt - 0.03, 0.45);
  part('interior', [0, 1, 0], 0, inner, 0);

  /* insulation panels */
  const ins = (w, h, d, x, y, z, dir) => part('insulation', dir, 0.55, [box(w, h, d, M.wool, x, y, z)], 0.4);
  ins(W - 0.3, H - 0.25, 0.06, 0, y0 + H / 2, -D / 2 + 0.09, [0, 0, -1]);
  ins(0.06, H - 0.25, D - 0.3, -W / 2 + 0.09, y0 + H / 2, 0, [-1, 0, 0]);
  ins(0.06, H - 0.25, D - 0.3, W / 2 - 0.09, y0 + H / 2, 0, [1, 0, 0]);
  ins(2.1, 0.75, 0.06, 0, y0 + 0.45, D / 2 - 0.09, [0, -0.3, 1]);

  /* cladding: front wall with the serving window */
  const shape = new THREE.Shape(); shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H); shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const hole = new THREE.Path(); hole.moveTo(-1.0, 0.95); hole.lineTo(-1.0, 1.95); hole.lineTo(1.0, 1.95); hole.lineTo(1.0, 0.95); hole.lineTo(-1.0, 0.95); shape.holes.push(hole);
  const fg = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  const fBlack = M.seam(1, 1); fBlack.map.repeat.set(1 / SC.seam[0], 1 / SC.seam[1]);
  const fWood = M.wood(1, 1); fWood.map.repeat.set(1 / SC.planks[0], 1 / SC.planks[1]);
  const front = fin(new THREE.Mesh(fg, fBlack), fBlack, fWood); front.position.set(0, y0, D / 2 - t);
  part('front wall', [0, 0, 1], 1.25, [front]);

  const back = fin(box(W, H, t, M.seam(W, H), 0, y0 + H / 2, -D / 2 + t / 2), null, M.wood(W, H)); back.userData.f = 1;
  finishable.at(-1).black = back.material;
  part('back wall', [0, 0, -1], 1.3, [back]);
  for (const sx of [-1, 1]) {
    const sb = M.seam(D, H), sw = M.wood(D, H);
    const side = fin(box(t, H, D, sb, sx * (W / 2 - t / 2), y0 + H / 2, 0), sb, sw);
    part(sx < 0 ? 'left wall' : 'right wall', [sx, 0, 0], 1.35, [side]);
  }

  /* wooden slat pillars + wall lamps (premium finish only) */
  const premiumOnly = [];
  for (const sx of [-1, 1]) {
    const s = box(0.24, H - 0.02, 0.05, mat('slat', 0.24, H, { r: 0.6 }), sx * 1.25, y0 + H / 2, D / 2 + 0.025);
    premiumOnly.push(part('slats', [sx * 0.7, 0, 1], 1.55, [s], 0.6));
  }
  const glows = [], eaveGlows = [];
  const gtex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 64, 2, 32, 64, 62); r.addColorStop(0, 'rgba(255,214,150,1)'); r.addColorStop(0.35, 'rgba(255,180,95,.45)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 128); return new THREE.CanvasTexture(c); })();
  for (const sx of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 24), M.black);
    lamp.position.set(sx * 1.25, y0 + 1.55, D / 2 + 0.1);
    const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.01, 20), M.lampOn); capT.position.set(sx * 1.25, y0 + 1.66, D / 2 + 0.1);
    const capB = capT.clone(); capB.position.y = y0 + 1.44;
    const g = part('lamps', [sx, 0.2, 1], 1.8, [lamp, capT, capB], 1.4);
    for (const dy of [0.45, -0.45]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      sp.scale.set(0.42, 0.95, 1); sp.position.set(0, dy, -0.03); g.add(sp); glows.push(sp);
    }
    premiumOnly.push(g);
  }

  /* serving window: black frame + two sliding glass panes */
  const wf = [box(2.06, 0.05, 0.08, M.black, 0, y0 + 1.95, D / 2 + 0.02), box(2.06, 0.05, 0.08, M.black, 0, y0 + 0.95, D / 2 + 0.02),
    box(0.05, 1.05, 0.08, M.black, -1.03, y0 + 1.45, D / 2 + 0.02), box(0.05, 1.05, 0.08, M.black, 1.03, y0 + 1.45, D / 2 + 0.02), box(0.035, 0.98, 0.06, M.black, 0, y0 + 1.45, D / 2 + 0.03)];
  part('window frame', [0, 0.1, 1], 1.7, wf, 0.5);
  const gl = [];
  for (const [x, z] of [[-0.5, D / 2 + 0.005], [0.5, D / 2 + 0.035]]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.96), M.glass); g.position.set(x, y0 + 1.45, z); gl.push(g); }
  const glassPart = part('glass', [0, 0.15, 1], 2.0, gl, 0.5); glassPart.children.forEach(m => { m.castShadow = false; });

  /* wooden counter */
  part('counter', [0, -0.25, 1], 2.1, [box(2.34, 0.075, 0.44, M.wood(2.34, 0.44), 0, y0 + 0.92, D / 2 + 0.2), box(2.34, 0.11, 0.04, M.wood(2.34, 0.11), 0, y0 + 0.86, D / 2 + 0.41)], 0.5);

  /* gable triangle */
  const tri = new THREE.Shape(); tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, PEAK); tri.lineTo(-W / 2, 0);
  const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false });
  const gBlack = plain(0x1c1f23, 0.6, 0.3); const gWood = M.wood(1, 1); gWood.map.repeat.set(1 / SC.planks[0], 1 / SC.planks[1]);
  const gable = fin(new THREE.Mesh(tg, gBlack), gBlack, gWood); gable.position.set(0, yt, D / 2 - 0.04);
  const gableB = fin(new THREE.Mesh(tg, gBlack), gBlack, gWood); gableB.position.set(0, yt, -D / 2);
  part('gable', [0, 0.35, 1], 1.45, [gable]); part('gable', [0, 0.35, -1], 1.45, [gableB]);

  /* exposed timber truss + fascia rafters */
  const tw = M.wood(3.6, 0.2);
  const ex = W / 2 + 0.38, ey = yt + PEAK - ex * pitch;
  const truss = [box(3.4, 0.16, 0.14, tw, 0, yt + 0.02, D / 2 + 0.07), box(0.12, 0.74, 0.12, tw, 0, yt + 0.47, D / 2 + 0.07),
    beam(0, yt + 0.5, -0.78, yt + 0.1, 0.11, 0.11, D / 2 + 0.07, tw), beam(0, yt + 0.5, 0.78, yt + 0.1, 0.11, 0.11, D / 2 + 0.07, tw),
    beam(-ex, ey - 0.13, 0, yt + PEAK - 0.07, 0.15, 0.12, D / 2 + 0.24, tw), beam(ex, ey - 0.13, 0, yt + PEAK - 0.07, 0.15, 0.12, D / 2 + 0.24, tw)];
  part('truss', [0, 0.55, 1], 1.9, truss, 0.7);

  /* roof: two metal planes + wooden soffit + ridge */
  const rl = Math.hypot(ex, ex * pitch) + 0.02, ang = Math.atan(pitch), RD = D + 0.6;
  for (const sx of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(rl, 0.07, RD), M.roof);
    r.position.set(sx * ex / 2, yt + PEAK - (ex / 2) * pitch + 0.06, 0.08); r.rotation.z = -sx * ang;
    part('roof', [sx * 0.55, 1, 0], 1.6, [r], 0.5);
    const so = new THREE.Mesh(new THREE.BoxGeometry(rl - 0.05, 0.02, RD - 0.04), M.wood(rl, RD));
    so.position.set(sx * ex / 2, yt + PEAK - (ex / 2) * pitch - 0.0, 0.08); so.rotation.z = -sx * ang;
    part('soffit', [sx * 0.4, 1, 0], 1.15, [so], 0.4);
  }
  part('ridge', [0, 1, 0], 2.3, [box(0.2, 0.07, RD + 0.02, M.roof, 0, yt + PEAK + 0.11, 0.08)], 0.6);

  /* ground + warm light pool */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x1d2024, roughness: 0.92, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(255,190,110,.9)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.5), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.012, D / 2 + 1.1); scene.add(pool);

  /* interior light */
  const inLight = new THREE.PointLight(0xffc98a, 0, 4.5, 1.6); inLight.position.set(0, yt - 0.4, 0.2); scene.add(inLight);

  /* LED downlights under both eaves (ride with the soffit boards) */
  parts.filter(g => g.name === 'soffit').forEach((g, i) => {
    const sx = i === 0 ? -1 : 1, x = sx * (ex - 0.28), y = yt + PEAK - (ex - 0.28) * pitch - 0.035;
    for (const z of [-0.85, 0, 0.85]) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 16), dl);
      d.position.set(x - g.position.x, y - g.position.y, z + 0.08 - g.position.z); g.add(d);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      sp.scale.set(0.5, 0.9, 1); sp.position.set(d.position.x - sx * 0.08, d.position.y - 0.45, d.position.z); g.add(sp); eaveGlows.push(sp);
    }
  });

  /* market string lights (appear in the last stage) */
  const festoon = new THREE.Group(); scene.add(festoon);
  const wireM = plain(0x111214, 0.6, 0.2), poleM = plain(0x1b1d20, 0.5, 0.4);
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xffe2b5, emissive: 0xffbd70, emissiveIntensity: 0 });
  const bulbGlows = [];
  const P4 = [[-4.4, 3.5], [4.4, 3.5], [4.6, -3.4], [-4.6, -3.4]];
  P4.forEach(([x, z]) => { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.7, 12), poleM); pole.position.set(x, 1.85, z); pole.castShadow = true; festoon.add(pole); });
  const string = (a, b, sag) => {
    const A = new THREE.Vector3(a[0], 3.62, a[1]), Bv = new THREE.Vector3(b[0], 3.62, b[1]);
    const mid = A.clone().lerp(Bv, 0.5); mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, Bv);
    festoon.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.008, 5, false), wireM));
    const n = Math.round(A.distanceTo(Bv) / 0.5);
    for (let i = 1; i < n; i++) {
      const pt = curve.getPoint(i / n);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bulbM); bl.position.copy(pt).y -= 0.06; festoon.add(bl);
      const gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: poolTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      gs.scale.set(0.26, 0.26, 1); gs.position.copy(bl.position); festoon.add(gs); bulbGlows.push(gs);
    }
  };
  string(P4[3], P4[2], 0.5); string(P4[0], P4[3], 0.6); string(P4[1], P4[2], 0.6); string(P4[3], P4[1], 0.9);
  festoon.visible = false;

  /* size factor: small parts fly further */
  const modelSize = new THREE.Box3().setFromObject(kiosk).getSize(new THREE.Vector3()).length();
  parts.forEach(p => { p.userData.k = THREE.MathUtils.clamp(0.55 / (p.userData.size / modelSize), 0.75, 1.6); });

  /* build order: 6 steps, each part flies in during its own window */
  const ORDER = { base: [0, 0.07], frame: [0.04, 0.16], insulation: [0.18, 0.3], interior: [0.2, 0.32],
    'back wall': [0.34, 0.44], 'left wall': [0.38, 0.48], 'right wall': [0.4, 0.5], 'front wall': [0.46, 0.56],
    'window frame': [0.58, 0.66], glass: [0.6, 0.68], counter: [0.64, 0.72],
    gable: [0.74, 0.8], truss: [0.77, 0.85], slats: [0.8, 0.86], lamps: [0.83, 0.88], soffit: [0.86, 0.92], roof: [0.88, 0.96], ridge: [0.93, 1] };
  const seen = {};
  parts.forEach(p => { const w = ORDER[p.name] || [0, 0.05]; const i = seen[p.name] = (seen[p.name] ?? -1) + 1; p.userData.win = [Math.min(w[0] + i * 0.02, 0.98), Math.min(w[1] + i * 0.02, 1)]; p.userData.grow = (p.name === 'frame' || p.name === 'interior'); });
  const STEP_Q = [0, 0.17, 0.33, 0.57, 0.73];

  /* real part count */
  let meshCount = 0; kiosk.traverse(o => { if (o.isMesh) meshCount++; });

  /* ---------- finish switch ---------- */
  let finish = 'black';
  window.k3setFinish = (f) => {
    finish = f;
    finishable.forEach(o => { o.mesh.material = f === 'wood' ? o.wood : (o.black || o.mesh.material); });
  };

  return { THREE, renderer, scene, camera, kiosk, parts, M, glows, eaveGlows, dl, inLight, pool, festoon, bulbM, bulbGlows, sun, hemi, rim, BG_DAY, BG_NIGHT, finishable, premiumOnly, ground, meshCount, setFinish: (f) => window.k3setFinish(f), D, H, W };
}
