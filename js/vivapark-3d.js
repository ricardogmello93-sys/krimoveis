// Maquete digital do Vivapark: implantação geral como chão, prédios em 3D que sobem, lagos com água animada,
// passeio guiado por botões e giro livre (arrastar / pinça). Ilustrativa: posições e alturas aproximadas.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const IMG_W = 1860, IMG_H = 1202, S = 100; // 1 unidade = 100 px da planta
const P = (px, py, y = 0) => new THREE.Vector3((px - IMG_W / 2) / S, y, (py - IMG_H / 2) / S);

const STOPS = {
  geral: { t: [930, 640, 0], c: [0, 9.5, 10.5], k: 'Maquete digital', n: 'Vivapark visto de cima', d: 'Mais de 550 mil m² planejados por Jaime Lerner: casas, prédios, comércio, lagos e muito verde, sem muros.' },
  vertice: { t: [740, 530, 0.9], c: [0.9, 1.1, 4.2], k: 'Empreendimento', n: 'Vértice', d: 'Duas torres escalonadas, cheias de jardins, de frente para o lago e o boulevard, no centro do bairro.', rise: true },
  lago: { t: [720, 740, 0], c: [-1.6, 2.1, 3.4], k: 'Já pronto', n: 'Lago e boulevard', d: 'Restaurantes de frente para a água e o parque em volta: é onde o bairro se encontra no fim do dia.' },
  casas: { t: [1430, 620, 0], c: [3.2, 4.2, 4.6], k: 'Morar', n: 'Bairro de casas', d: 'Lotes para casas em ruas arborizadas, com fiação subterrânea e monitoramento 24 horas.' },
  mata: { t: [300, 330, 0], c: [-3.2, 3.6, 3.6], k: 'Natureza', n: 'Mata preservada', d: 'São 138 mil m² de áreas verdes no projeto, com parques de reserva ambiental em volta das casas e dos prédios.' },
  br: { t: [420, 900, 0], c: [-3.6, 2.8, 4.2], k: 'Localização', n: 'Acesso pela BR-101', d: 'Na entrada de Porto Belo, ao lado do Jardim Dourado. Itapema e Bombinhas ficam logo ali.' },
};
const PINS = [['vertice', 742, 500, 2.05], ['lago', 760, 790, 0.1], ['casas', 1430, 560, 0.1], ['mata', 260, 300, 0.1], ['br', 300, 860, 0.06]];

export function init(stage) {
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.vp-3d-pins'), card = stage.querySelector('.vp-3d-card');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061820);
  scene.fog = new THREE.Fog(0x061820, 14, 30);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 14, 16);

  scene.add(new THREE.HemisphereLight(0xe6f4ff, 0x1d3a3a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
  sun.position.set(-7, 11, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0008; scene.add(sun);

  // chão: a implantação geral do bairro
  const tex = new THREE.TextureLoader().load(stage.getAttribute('data-tex'), () => stage.classList.add('ready'));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(IMG_W / S, IMG_H / S), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // borda: a planta "flutua" sobre o fundo, com uma base fina dourada
  const base = new THREE.Mesh(new THREE.BoxGeometry(IMG_W / S + 0.12, 0.18, IMG_H / S + 0.12), new THREE.MeshStandardMaterial({ color: 0x0c2a33, roughness: 0.8 }));
  base.position.y = -0.095; scene.add(base);
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry), new THREE.LineBasicMaterial({ color: 0xe2c77e, transparent: true, opacity: 0.55 }));
  rim.position.copy(base.position); scene.add(rim);

  // lagos com água animada
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ vec2 c = vUv - 0.5; float r = length(c); vec2 p = vUv * 9.0; float w = sin(p.x*1.7 + t*0.9) * sin(p.y*2.3 - t*0.7) + sin((p.x+p.y)*1.3 + t*1.2)*0.6; float s = smoothstep(0.55, 1.35, w); vec3 deep = vec3(0.07,0.27,0.27); vec3 hi = vec3(0.72,0.9,0.88); vec3 col = mix(deep, hi, s*0.55); float edge = smoothstep(0.5, 0.38, r); gl_FragColor = vec4(col, (0.55 + s*0.3)*edge); }',
  });
  [[603, 762, 74, 48], [838, 792, 96, 64]].forEach(([x, y, rx, ry]) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 64), waterMat);
    m.rotation.x = -Math.PI / 2; m.scale.set(rx * 2 / S, ry * 2 / S, 1); m.position.copy(P(x, y, 0.012)); scene.add(m);
  });

  // materiais
  const white = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.55, metalness: 0.04 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xc9d6d3, roughness: 0.35, metalness: 0.2 });
  const green = new THREE.MeshStandardMaterial({ color: 0x4f8a3f, roughness: 0.9 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x6b7378, roughness: 0.7 });
  const box = (w, h, d, mat) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  // Vértice: dois blocos em "V" (altos nas pontas, descendo para o meio), com jardins em cada terraço
  const risers = [];
  function vertice(x0, x1, z0, z1) {
    const g = new THREE.Group(), W = (x1 - x0) / S, D = (z1 - z0) / S, N = 26, fh = 0.07, pod = 0.04;
    const c = P((x0 + x1) / 2, (z0 + z1) / 2); g.position.copy(c);
    const podium = box(W, pod, D, glass); g.add(podium);
    const floors = [], B = 7, lineMat = new THREE.LineBasicMaterial({ color: 0x55605e, transparent: true, opacity: 0.35 });
    for (let i = 0; i < N; i++) {
      // base cheia de 7 andares e depois o "V": as alas sobem nas pontas e se abrem no meio, em terraços
      const k = i < B ? 0.97 : 0.97 - 0.78 * Math.pow((i - B + 1) / (N - B), 0.55), ww = (W / 2) * k, dd = D * 0.34;
      [-1, 1].forEach((side) => {
        const f = new THREE.Group();
        const slab = box(ww, fh * 0.82, dd, white); f.add(slab);
        const ln = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), lineMat); f.add(ln);
        const pl = box(0.06, 0.03, dd * 0.96, green); pl.position.set(-side * (ww / 2 - 0.03), fh * 0.82, 0); f.add(pl);
        f.position.set(side * (W / 2 - ww / 2), pod + i * fh, -D / 2 + dd / 2 + 0.05);
        f.userData.i = i; g.add(f); floors.push(f);
      });
    }
    scene.add(g); risers.push({ floors, N, p: 0 });
  }
  vertice(560, 725, 455, 615); vertice(755, 915, 455, 615);

  // outros volumes do projeto (baixos), para dar leitura de bairro
  [].forEach(([x, y, w, d, h, a]) => {
    const m = box(w / S, h, d / S, white); m.position.copy(P(x, y)); m.rotation.y = -a * Math.PI / 180; scene.add(m);
  });
  [[628, 668], [842, 668]].forEach(([x, y]) => { const m = box(1.25, 0.12, 0.55, roof); m.position.copy(P(x, y)); scene.add(m); });

  // controles: arrastar gira, pinça/scroll aproxima; giro automático lento quando parado
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false;
  controls.minDistance = 3; controls.maxDistance = 20; controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.32;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.45;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  controls.enabled = !touch; // no celular só gira depois de tocar em "Explorar", para não travar a rolagem da página

  // pinos
  const pins = PINS.map(([k, x, y, h]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vp-pin'; b.innerHTML = '<i></i><span>' + STOPS[k].n + '</span>'; b.addEventListener('click', () => go(k)); pinBox.appendChild(b); return { el: b, v: P(x, y, h) }; });

  // voo da câmera
  let fly = null, idleT = 0, cardT = 0;
  function hideCard() { clearTimeout(cardT); card.classList.remove('show'); }
  function go(k) {
    const s = STOPS[k]; if (!s) return;
    const tgt = P(s.t[0], s.t[1], s.t[2]);
    fly = { t0: performance.now(), d: 1700, p0: camera.position.clone(), q0: controls.target.clone(), p1: tgt.clone().add(new THREE.Vector3(...s.c)), q1: tgt };
    controls.autoRotate = false; idleT = performance.now();
    card.querySelector('small').textContent = s.k; card.querySelector('strong').textContent = s.n; card.querySelector('p').textContent = s.d; card.classList.add('show');
    clearTimeout(cardT); cardT = setTimeout(hideCard, 7000); // o cartão some sozinho para liberar a maquete
    stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-k') === k));
    if (s.rise) risers.forEach((r) => { r.t0 = performance.now() + 500; });
    try { gtag('event', 'maquete_3d', { ponto: k }); } catch (_) {}
  }
  stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.addEventListener('click', () => go(b.getAttribute('data-k'))));
  const live = stage.querySelector('.vp-3d-live');
  if (live) live.addEventListener('click', () => { const on = !stage.classList.contains('live'); stage.classList.toggle('live', on); controls.enabled = on || !touch; live.textContent = on ? 'Voltar à rolagem' : 'Toque para explorar'; });
  controls.addEventListener('start', () => { fly = null; controls.autoRotate = false; idleT = performance.now(); hideCard(); });
  // fechar o cartão: botão ×, toque fora dele na maquete
  const cx = card.querySelector('.vp-3d-cx'); if (cx) cx.addEventListener('click', (e) => { e.stopPropagation(); hideCard(); });
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

  // começo: câmera desce do alto e os prédios sobem do chão
  go('geral'); card.classList.remove('show');
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const v = new THREE.Vector3(); const clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  (function loop() {
    requestAnimationFrame(loop); if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05); waterMat.uniforms.t.value += dt;
    risers.forEach((r) => { if (r.t0 == null) r.t0 = performance.now(); r.p = Math.min(1, (performance.now() - r.t0) / 2200); const n = Math.max(0, r.p) * r.N; r.floors.forEach((f) => { const s = Math.max(0.0001, Math.min(1, n - f.userData.i)); f.scale.y = s; f.visible = s > 0.001; }); });
    if (fly) { const k = Math.min(1, (performance.now() - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) fly = null; }
    else if (!controls.autoRotate && performance.now() - idleT > 7000) controls.autoRotate = true;
    controls.update(); renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    pins.forEach((p) => { v.copy(p.v).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; p.el.style.opacity = on ? '1' : '0'; p.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)'; });
  })();
  stage.classList.add('gl');
}
