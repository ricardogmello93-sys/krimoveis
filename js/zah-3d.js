// Maquete do portfólio ZAH: relevo real de Itapema e Porto Belo (SRTM), mar animado, vias principais (OpenStreetMap)
// e os prédios da ZAH subindo nos endereços. Alturas e posições aproximadas; o relevo é exagerado 2x e os prédios 3x.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const VE = 2.0, BX = 3.0; // exagero do relevo e dos prédios
const ST = { pronto: 0x5fd38a, obra: 0x79c2cd, lanc: 0xe2c77e };
const P = [
  { id: 'canvas', nome: 'Canvas', st: 'pronto', ll: [-27.1388, -48.5933], tw: [[0, 0, 16, 26, 22]] },
  { id: 'amrita', nome: 'Amrita', st: 'obra', ll: [-27.1545, -48.5699], tw: [[0, 0, 17, 30, 20]] },
  { id: 'tenet', nome: 'Tenet', st: 'obra', ll: [-27.0987, -48.6227], tw: [[-45, 0, 30, 24, 24, 'obra'], [45, 12, 30, 24, 24, 'obra'], [-135, -30, 36, 24, 24, 'lanc'], [130, 40, 36, 24, 24, 'lanc']], sub: 'Fase 1 em obras · Fase 2 em lançamento' },
  { id: 'veda', nome: 'Vedá', st: 'lanc', ll: [-27.0898, -48.6059], tw: [[0, 0, 22, 30, 24]] },
  { id: 'tekoa', nome: 'Tekoā', st: 'lanc', ll: [-27.0626, -48.5967], tw: [[-30, 0, 26, 24, 22], [34, 18, 20, 30, 26]] },
  { id: 'amazonia', nome: 'Amazônia', st: 'lanc', ll: [-27.1575, -48.5585], tw: [[0, 0, 8, 22, 18]], aprox: true },
];
const ZT = { pt: { st: { pronto: 'Pronto para morar', obra: 'Em obras', lanc: 'Lançamento' }, tenet: 'Fase 1 em obras · Fase 2 em lançamento', aprox: 'Frente mar em Porto Belo (posição aproximada).', ver: 'Toque em "Ver detalhes" para a ficha completa e a tabela.' },
  en: { st: { pronto: 'Move-in ready', obra: 'Under construction', lanc: 'New launch' }, tenet: 'Phase 1 under construction · Phase 2 new launch', aprox: 'Beachfront in Porto Belo (approximate position).', ver: 'Tap "View details" for the full specs and prices.' },
  es: { st: { pronto: 'Listo para vivir', obra: 'En construcción', lanc: 'Lanzamiento' }, tenet: 'Etapa 1 en obra · Etapa 2 en lanzamiento', aprox: 'Frente al mar en Porto Belo (posición aproximada).', ver: 'Toque "Ver detalles" para la ficha completa y la lista.' } };
const ZL = ZT[(document.documentElement.lang || 'pt').slice(0, 2)] || ZT.pt;
const PLACES = [['Itapema', -27.093, -48.616], ['Meia Praia', -27.124, -48.604], ['Porto Belo', -27.161, -48.556], ['BR-101', -27.118, -48.628], ['Balneário Camboriú ↑', -27.056, -48.606]];

export async function init(stage, opts = {}) {
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.vp-3d-pins'), card = stage.querySelector('.vp-3d-card');
  const data = await (await fetch(stage.getAttribute('data-terrain'))).json();
  const [N, S, W, E] = data.box, nx = data.nx, ny = data.ny;
  // mar = só o que está ligado à borda do mapa com altitude zero; áreas baixas da cidade continuam terra
  const sea = new Uint8Array(nx * ny), stack = [];
  for (let i = 0; i < nx; i++) for (const j of [0, ny - 1]) if (data.h[j * nx + i] <= 0) stack.push(j * nx + i);
  for (let j = 0; j < ny; j++) for (const i of [0, nx - 1]) if (data.h[j * nx + i] <= 0) stack.push(j * nx + i);
  while (stack.length) { const k = stack.pop(); if (sea[k] || data.h[k] > 0) continue; sea[k] = 1; const i = k % nx, j = (k / nx) | 0; if (i > 0) stack.push(k - 1); if (i < nx - 1) stack.push(k + 1); if (j > 0) stack.push(k - nx); if (j < ny - 1) stack.push(k + nx); }
  data.h = data.h.map((m, k) => (sea[k] ? -6 : Math.max(m, 3)));
  const latC = (N + S) / 2, lonC = (W + E) / 2, kx = 111320 * Math.cos(latC * Math.PI / 180) / 100, kz = 110540 / 100;
  const X = (lon) => (lon - lonC) * kx, Z = (lat) => (latC - lat) * kz;
  const WU = (E - W) * kx, HU = (N - S) * kz;
  const hAt = (lat, lon) => { // altura interpolada (unidades)
    const fx = (lon - W) / (E - W) * (nx - 1), fy = (N - lat) / (N - S) * (ny - 1);
    const i = Math.max(0, Math.min(nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(ny - 2, Math.floor(fy))), u = fx - i, v = fy - j;
    const g = (a, b) => Math.max(0.03, data.h[b * nx + a]);
    return ((g(i, j) * (1 - u) + g(i + 1, j) * u) * (1 - v) + (g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u) * v) * VE / 100;
  };

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x061820); scene.fog = new THREE.Fog(0x061820, 90, 190);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 500);
  scene.add(new THREE.HemisphereLight(0xe6f4ff, 0x1a3330, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(60, 70, 40); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 }); sun.shadow.bias = -0.0006; scene.add(sun);

  // relevo
  const geo = new THREE.PlaneGeometry(WU, HU, nx - 1, ny - 1);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  const cCity = new THREE.Color(0xd9cfbd), cLow = new THREE.Color(0x9fb27a), cMid = new THREE.Color(0x4f7a3c), cHigh = new THREE.Color(0x2d5130), cSand = new THREE.Color(0xe9dcc3);
  for (let k = 0; k < pos.count; k++) {
    const raw = data.h[k], m = Math.max(0, raw); pos.setZ(k, raw * VE / 100);
    if (raw < 0) c.set(0x0b3a44); else if (m < 4) c.copy(cSand); else if (m < 14) c.copy(cCity).lerp(cLow, (m - 4) / 10); else if (m < 90) c.copy(cLow).lerp(cMid, (m - 14) / 76); else c.copy(cMid).lerp(cHigh, Math.min(1, (m - 90) / 200));
    col.set([c.r, c.g, c.b], k * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false }));
  land.rotation.x = -Math.PI / 2; land.receiveShadow = true; scene.add(land);

  // mar
  const waterMat = new THREE.ShaderMaterial({ transparent: true, uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ vec2 p = vUv * vec2(90.0, 70.0); float w = sin(p.x*0.7 + p.y*0.35 + t*0.9) + sin(p.y*0.9 - p.x*0.2 - t*0.7)*0.6; float s = smoothstep(1.3, 1.6, w); float g = vUv.x * 0.25; vec3 deep = vec3(0.035,0.2+g*0.1,0.25+g*0.08); vec3 hi = vec3(0.6,0.85,0.88); gl_FragColor = vec4(mix(deep, hi, s*0.1), 0.93); }' });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WU * 1.6, HU * 1.4), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = 0.0; scene.add(water);

  // vias
  const roadMat = { motorway: 0xf3eadb, trunk: 0xf3eadb, primary: 0xe2c77e, secondary: 0xbfb39a };
  const groups = {};
  data.roads.forEach((r) => { const arr = groups[r.t] || (groups[r.t] = []); for (let i = 1; i < r.p.length; i++) { const a = r.p[i - 1], b = r.p[i]; arr.push(X(a[1]), hAt(a[0], a[1]) + 0.06, Z(a[0]), X(b[1]), hAt(b[0], b[1]) + 0.06, Z(b[0])); } });
  Object.entries(groups).forEach(([t, arr]) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: roadMat[t] || 0xbfb39a, transparent: true, opacity: t === 'secondary' ? 0.45 : 0.8 }))); });

  // cidade em volta: construções ao longo das ruas reais (altas perto da praia), num único desenho instanciado
  if (data.bf && data.bf.length) {
    const n = data.bf.length / 6, latC2 = (N + S) / 2, mxm = 111320 * Math.cos(latC2 * Math.PI / 180), mzm = 110540;
    const bg = new THREE.BoxGeometry(1, 1, 1); bg.translate(0, 0.5, 0);
    const im = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.02 }), n);
    im.castShadow = true; im.receiveShadow = true;
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), cc = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const xm = data.bf[k * 6], zm = data.bf[k * 6 + 1], fl = data.bf[k * 6 + 2], w = data.bf[k * 6 + 3], d = data.bf[k * 6 + 4], a = data.bf[k * 6 + 5];
      const lon = W + xm / mxm, lat = N - zm / mzm;
      ps.set(X(lon), hAt(lat, lon) - 0.02, Z(lat)); q.setFromAxisAngle(up, a * Math.PI / 180); sc.set(w / 100, fl * 3 * 1.8 / 100, d / 100);
      mtx.compose(ps, q, sc); im.setMatrixAt(k, mtx);
      const tone = 0.6 + ((k * 2654435761) % 1000) / 1000 * 0.16; cc.setRGB(tone * 0.97, tone * 0.96, tone * 0.93); im.setColorAt(k, cc);
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    scene.add(im);
  }

  // prédios
  const white = new THREE.MeshStandardMaterial({ color: 0xf3eee4, roughness: 0.5, metalness: 0.05 });
  const risers = [];
  P.forEach((p) => {
    const g = new THREE.Group(); const base = hAt(p.ll[0], p.ll[1]); g.position.set(X(p.ll[1]), base, Z(p.ll[0]));
    p.tw.forEach(([dx, dz, fl, w, d, st]) => {
      const h = fl * 3 * BX / 100, ww = w * 2.2 / 100, dd = d * 2.2 / 100;
      const geo = new THREE.BoxGeometry(ww, h, dd); geo.translate(0, h / 2, 0);
      const lanc = (st || p.st) === 'lanc';
      const mat = lanc ? new THREE.MeshStandardMaterial({ color: 0xe2c77e, emissive: 0xb8862b, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.3 }) : new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: ST[st || p.st], emissiveIntensity: 0.22, roughness: 0.45 });
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(dx * 2.2 / 100, 0, dz * 2.2 / 100);
      const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: ST[st || p.st], transparent: true, opacity: 0.9 })); m.add(ed);
      // faixas de andares
      const fg = new THREE.BufferGeometry(), fa = [];
      for (let k = 1; k < fl; k += 2) { const y = k * 3 * BX / 100; fa.push(-ww / 2 - 0.002, y, dd / 2 + 0.002, ww / 2 + 0.002, y, dd / 2 + 0.002, ww / 2 + 0.002, y, dd / 2 + 0.002, ww / 2 + 0.002, y, -dd / 2 - 0.002); }
      fg.setAttribute('position', new THREE.Float32BufferAttribute(fa, 3)); m.add(new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: 0x8d9a98, transparent: true, opacity: 0.5 })));
      g.add(m);
    });
    // anel no chão marcando o lugar
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.25, 48), new THREE.MeshBasicMaterial({ color: ST[p.st], transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
    // feixe de luz acima do prédio, para achar cada empreendimento no meio da cidade
    const topH = Math.max(...p.tw.map((t) => t[2])) * 3 * BX / 100;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.5, 7, 24, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(ST[p.st]) } },
      vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 c; varying float vY; void main(){ float a = smoothstep(3.5, -3.5, vY) * 0.38; gl_FragColor = vec4(c, a); }' }));
    beam.position.y = topH + 3.6; g.add(beam); g.userData.beam = beam;
    g.userData.ring = ring; scene.add(g); p.g = g; p.top = new THREE.Vector3(g.position.x, base + Math.max(...p.tw.map((t) => t[2])) * 3 * BX / 100 + 1.2, g.position.z);
    risers.push({ g, t0: null });
  });

  // controles
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false; controls.minDistance = 8; controls.maxDistance = 150; controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.35;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
  const touch = window.matchMedia('(pointer: coarse)').matches; controls.enabled = !touch;

  // pinos
  const pins = [];
  P.forEach((p) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vp-pin zp ' + p.st; b.innerHTML = '<i></i><span>' + p.nome + '</span>'; b.addEventListener('click', () => go(p.id)); pinBox.appendChild(b); pins.push({ el: b, v: p.top }); });
  PLACES.forEach(([n, la, lo]) => { const s = document.createElement('span'); s.className = 'zp-place'; s.textContent = n; pinBox.appendChild(s); pins.push({ el: s, v: new THREE.Vector3(X(lo), hAt(la, lo) + 0.4, Z(la)) }); });

  // voo, cartão
  let fly = null, idleT = 0, cardT = 0, cur = null;
  const hideCard = () => { clearTimeout(cardT); card.classList.remove('show'); };
  function go(id) {
    let tgt, off;
    if (id === 'geral') { tgt = new THREE.Vector3(3, 0, 10); off = new THREE.Vector3(58, 112, 40); hideCard(); cur = null; }
    else {
      const p = P.find((x) => x.id === id); if (!p) return; cur = p;
      tgt = p.g.position.clone().add(new THREE.Vector3(0, 1, 0)); off = new THREE.Vector3(9, 7, 8);
      card.querySelector('small').textContent = p.sub ? ZL.tenet : ZL.st[p.st];
      card.querySelector('strong').textContent = p.nome;
      card.querySelector('p').textContent = p.aprox ? ZL.aprox : ZL.ver;
      card.classList.add('show'); clearTimeout(cardT); cardT = setTimeout(hideCard, 8000);
      risers.find((r) => r.g === p.g).t0 = performance.now() + 450;
      try { gtag('event', 'maquete_zah', { ponto: id }); } catch (_) {}
    }
    fly = { t0: performance.now(), d: 1800, p0: camera.position.clone(), q0: controls.target.clone(), p1: tgt.clone().add(off), q1: tgt };
    controls.autoRotate = false; idleT = performance.now();
    stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-k') === id));
  }
  stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.addEventListener('click', () => go(b.getAttribute('data-k'))));
  const more = card.querySelector('.zp-more'); if (more) more.addEventListener('click', (e) => { e.stopPropagation(); if (cur && opts.open) opts.open(cur.id); });
  const cx = card.querySelector('.vp-3d-cx'); if (cx) cx.addEventListener('click', (e) => { e.stopPropagation(); hideCard(); });
  const live = stage.querySelector('.vp-3d-live');
  if (live) live.addEventListener('click', () => { const on = !stage.classList.contains('live'); stage.classList.toggle('live', on); controls.enabled = on || !touch; live.textContent = on ? 'Voltar à rolagem' : 'Toque para explorar'; });
  controls.addEventListener('start', () => { fly = null; controls.autoRotate = false; idleT = performance.now(); hideCard(); });
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 8) hideCard(); downAt = null; });

  // tela cheia (funciona em qualquer celular: a maquete ocupa a tela toda e gira com o dedo)
  const fsb = stage.querySelector('.vp-3d-fs');
  if (fsb) fsb.addEventListener('click', () => {
    const on = !stage.classList.contains('fs'); stage.classList.toggle('fs', on); document.documentElement.style.overflow = on ? 'hidden' : '';
    fsb.textContent = on ? '× Sair' : '⤢ Tela cheia'; controls.enabled = on || !touch || stage.classList.contains('live'); setTimeout(resize, 60);
    try { gtag('event', 'maquete_tela_cheia', { on: on ? 1 : 0 }); } catch (_) {}
  });  function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  camera.position.set(110, 120, 90); controls.target.set(0, 0, 2);
  go('geral'); risers.forEach((r, i) => { r.t0 = performance.now() + 900 + i * 260; });
  stage.classList.add('gl', 'ready');

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const v = new THREE.Vector3(), clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  (function loop() {
    requestAnimationFrame(loop); if (!visible) return;
    waterMat.uniforms.t.value += Math.min(clock.getDelta(), 0.05);
    const now = performance.now();
    risers.forEach((r) => { const k = r.t0 == null ? 0 : Math.max(0, Math.min(1, (now - r.t0) / 1600)); const e = 1 - Math.pow(1 - k, 3); r.g.children.forEach((ch) => { if (ch !== r.g.userData.ring && ch !== r.g.userData.beam) ch.scale.y = Math.max(0.001, e); }); r.g.userData.beam.material.uniforms.c.value; r.g.userData.beam.visible = e > 0.95; r.g.userData.ring.material.opacity = 0.5 + 0.4 * Math.sin(now / 500); });
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) fly = null; }
    else if (!controls.autoRotate && now - idleT > 8000) controls.autoRotate = true;
    controls.update(); renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    pins.forEach((p) => { v.copy(p.v).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; p.el.style.opacity = on ? '1' : '0'; p.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)'; });
  })();
}
