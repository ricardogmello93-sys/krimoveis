// Prédio do Levve Garden Living em 3D: térreo com comércio, 8 andares de apartamentos e rooftop. Clique num andar (ou na lista) para abrir
// o andar: os de cima sobem e ficam transparentes, e o painel mostra o que há ali (tipologias, lazer do térreo e do rooftop).
// Maquete ilustrativa feita a partir das imagens do projeto (Satre / Studio Prudêncio); proporções aproximadas.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const W = 8, D = 2.8, NB = 8, FH = 0.6, HG = 0.9, TS = 0.1, NF = 8; // largura, profundidade, vãos, altura do andar, térreo, laje, andares
const WA = '5555991346393';
const TIPOS = [
  { k: 'studio', n: 'Studio', a: '19,61 a 24,20 m²', d: 'Com churrasqueira, algo inédito em Camobi. Compacto, bem resolvido e pronto para a rotina.', img: 'studio-01' },
  { k: '1d', n: '1 dormitório', a: '28,65 a 35,92 m²', d: 'Quarto separado da sala, para quem estuda, trabalha e recebe.', img: '1d-01' },
  { k: '1da', n: '1 dormitório ampliado', a: '35,92 m²', d: 'A maior planta de 1 dormitório, com mais espaço para viver.', img: '1d-04' },
  { k: '2d', n: '2 dormitórios', a: '53,21 a 53,31 m²', d: 'Para dividir com um colega, montar um escritório ou investir.', img: '2d-01' },
];
const TERREO = { itens: ['Comércio voltado para a rua', 'Hall de entrada', 'Academia', 'Lavanderia', 'Bicicletário', 'Sala de podcast', 'Espaço delivery'], fotos: [['hall-estar', 'Hall de entrada'], ['academia', 'Academia'], ['lavanderia', 'Lavanderia'], ['bicicletario', 'Bicicletário']] };
const ROOF = { itens: ['Piscina', 'Cinema', 'Fire place', 'Espaço parrilha', 'Espaço pizza', 'Espaço churrasqueira', 'Drink lounge', 'Lounge', 'Solarium', 'Espaço zen'], fotos: [['rooftop-piscina', 'Piscina'], ['rooftop-cinema', 'Cinema'], ['rooftop-4', 'Fire place'], ['rooftop-2', 'Lounge']] };
const KEYS = ['roof', 8, 7, 6, 5, 4, 3, 2, 1, 'terreo'];
const NAME = (k) => (k === 'roof' ? 'Rooftop' : k === 'terreo' ? 'Térreo' : k + 'º andar');

// ---------- geometria: caixas com cor por vértice, juntas numa malha por material e por andar
const mkAcc = () => ({ p: [], n: [], c: [], i: [] });
const FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
function box(a, cx, cy, cz, sx, sy, sz, col) { // cy = base da caixa
  const c = new THREE.Color(col), hx = sx / 2, hy = sy / 2, hz = sz / 2;
  FACES.forEach(([nr, vs]) => { const o = a.p.length / 3; vs.forEach(([x, y, z]) => { a.p.push(cx + x * hx, cy + hy + y * hy, cz + z * hz); a.n.push(...nr); a.c.push(c.r, c.g, c.b); }); a.i.push(o, o + 1, o + 2, o, o + 2, o + 3); });
}
const toGeo = (a) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(a.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(a.c, 3)); g.setIndex(a.i); return g; };
let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const CONC = 0xf0ece4, COL = 0xb9b6b0, GLASS = 0x8a99a3, WALL = 0x5a6167, RUST = 0xa5563b, DARK = 0x2e3236;
const greens = [0x4d7a3a, 0x5d8a43, 0x6b9a4b, 0x3f6a33, 0x7aa356];
const bayX = (k) => -W / 2 + (k + 0.5) * (W / NB), BW = W / NB;

function floorAccs(n) { // andar tipo, base em y = 0: laje com beiral, pilares, parede recuada com janelas, painéis cor de ferrugem e jardineiras
  const A = { conc: mkAcc(), glass: mkAcc(), lit: mkAcc(), rust: mkAcc(), plant: mkAcc() }, H = FH - TS, rec = 0.4;
  box(A.conc, 0, 0, 0, W + 0.22, TS, D + 0.34, CONC); // laje com beiral
  box(A.conc, 0, TS, 0, W - 0.3, 0.006, D - 0.3, 0xe4ddcf); // piso
  for (const z of [D / 2 - 0.08, -D / 2 + 0.08]) for (let k = 0; k <= NB; k++) box(A.conc, -W / 2 + k * BW, TS, z, 0.14, H, 0.14, COL);
  for (const x of [-W / 2 + 0.07, W / 2 - 0.07]) for (const z of [-D / 2 + 0.08, 0, D / 2 - 0.08]) box(A.conc, x, TS, z, 0.14, H, 0.14, COL);
  for (const s of [1, -1]) {
    const zw = s * (D / 2 - rec); box(A.glass, 0, TS, zw, W - 0.12, H, 0.05, WALL); // parede recuada
    for (let k = 0; k < NB; k++) {
      const x = bayX(k), r = rnd();
      box(A.glass, x, TS + 0.07, zw + s * 0.03, BW * 0.56, H * 0.6, 0.02, GLASS);
      if (r < 0.24) box(A.lit, x, TS + 0.1, zw + s * 0.045, BW * 0.4, H * 0.34, 0.004, 0xf2c78c);
      if (rnd() < 0.26) box(A.rust, x + BW * 0.3, TS, zw + s * 0.035, BW * 0.2, H, 0.012, RUST);
      box(A.conc, x, TS, s * (D / 2 + 0.03), BW * 0.86, 0.12, 0.012, DARK); // guarda-corpo
      if (rnd() < 0.72) box(A.plant, x + (rnd() - 0.5) * 0.2, TS, s * (D / 2 + 0.07), BW * (0.34 + rnd() * 0.34), 0.12 + rnd() * 0.1, 0.1, greens[(rnd() * greens.length) | 0]);
    }
  }
  for (const s of [1, -1]) { const x = s * (W / 2 - 0.2); box(A.glass, x, TS, 0, 0.05, H, D * 0.8, WALL); box(A.glass, x - s * 0.03, TS + 0.07, 0, 0.02, H * 0.58, D * 0.5, GLASS); if (rnd() < 0.5) box(A.lit, x - s * 0.045, TS + 0.1, 0, 0.004, H * 0.32, D * 0.3, 0xf2c78c); }
  return A;
}
function terreoAccs() {
  const A = { conc: mkAcc(), glass: mkAcc(), lit: mkAcc(), rust: mkAcc(), plant: mkAcc() };
  for (let k = 0; k <= NB; k++) box(A.conc, -W / 2 + k * BW, 0, D / 2 - 0.05, 0.14, HG, 0.14, COL);
  box(A.glass, 0, 0.02, D / 2 - 0.6, W * 0.92, HG - 0.06, 0.04, GLASS); // vitrine recuada
  for (let k = 0; k < NB; k++) { if (rnd() < 0.7) box(A.lit, bayX(k), 0.08, D / 2 - 0.58, BW * 0.7, HG * 0.6, 0.004, 0xffd0a0); if (rnd() < 0.3) box(A.rust, bayX(k) + BW * 0.34, 0, D / 2 - 0.4, BW * 0.24, HG - 0.04, 0.05, RUST); }
  box(A.conc, 0, 0, -D / 2 + 0.3, W * 0.9, HG, 0.08, DARK); box(A.conc, 0, 0, 0, W * 0.6, HG, 0.1, 0x6b6a66);
  for (let k = 0; k < 36; k++) box(A.plant, -W / 2 + 0.3 + k * (W - 0.6) / 35, HG - 0.12, D / 2 + 0.04 + rnd() * 0.04, 0.2, 0.1 + rnd() * 0.1, 0.1, greens[(rnd() * greens.length) | 0]); // trepadeira
  return A;
}
function roofAccs() {
  const A = { conc: mkAcc(), glass: mkAcc(), lit: mkAcc(), rust: mkAcc(), plant: mkAcc(), water: mkAcc() };
  box(A.conc, 0, 0, 0, W + 0.18, TS, D + 0.18, CONC);
  for (const z of [D / 2 - 0.05, -D / 2 + 0.05]) { for (let k = 0; k <= NB; k++) box(A.conc, -W / 2 + k * BW, TS, z, 0.1, FH - TS, 0.1, COL); box(A.conc, 0, FH, z, W + 0.18, TS, 0.12, CONC); }
  for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) { box(A.conc, x, TS, 0, 0.1, FH - TS, 0.1, COL); box(A.conc, x, FH, 0, 0.12, TS, D, CONC); }
  box(A.water, W * 0.22, TS, 0.1, 2.3, 0.03, 0.95, 0x38a9c9); box(A.conc, W * 0.22, TS, 0.1, 2.5, 0.05, 1.1, 0xe8e2d6);
  for (const x0 of [-W * 0.34, -W * 0.06]) for (let q = 0; q < 6; q++) box(A.rust, x0 + q * 0.13, FH - 0.04, 0, 0.05, 0.03, D * 0.85, 0x8a5a3a); // pérgola
  for (let k = 0; k < 18; k++) box(A.plant, -W / 2 + 0.4 + rnd() * (W - 0.8), TS, -D / 2 + 0.3 + rnd() * (D - 0.6), 0.2 + rnd() * 0.15, 0.08 + rnd() * 0.2, 0.2 + rnd() * 0.15, greens[(rnd() * greens.length) | 0]);
  for (const x of [-W * 0.42, -W * 0.14, W * 0.14, W * 0.42]) box(A.conc, x, TS, -D / 2 + 0.2, 0.07, 0.42, 0.07, DARK); // chaminés
  return A;
}

export function init(stage) {
  const canvas = stage.querySelector('canvas'), IMG = stage.getAttribute('data-img') || '', panel = document.getElementById('lvPanel'), list = document.getElementById('lvFloors');
  const touch = window.matchMedia('(pointer: coarse)').matches;
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, alpha: true, powerPreference: 'high-performance' }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !touch; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xe3ecf6, 0x7a6850, 1.25));
  const sun = new THREE.DirectionalLight(0xffe0b5, 2.0); sun.position.set(9, 11, 7); sun.castShadow = !touch; Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -8, near: 1, far: 50 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; scene.add(sun);
  { const fill = new THREE.DirectionalLight(0xa9c4ff, 0.5); fill.position.set(-8, 4, -6); scene.add(fill); }

  // chão: lote, calçada e rua; árvores em volta
  const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 48), new THREE.MeshStandardMaterial({ color: 0x7e7a66, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const gm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), ga = mkAcc();
  box(ga, 0, 0.002, D / 2 + 1.0, 30, 0.01, 1.1, 0xb9b2a4); box(ga, 0, 0.004, D / 2 + 2.3, 30, 0.01, 1.7, 0x4a4846); box(ga, 0, 0.006, D / 2 + 2.3, 30, 0.01, 0.04, 0xe8dca8); box(ga, 0, 0.002, 0, W + 0.9, 0.012, D + 0.9, 0x9d9684);
  const gmesh = new THREE.Mesh(toGeo(ga), gm); gmesh.receiveShadow = true; scene.add(gmesh);
  const trees = []; for (let k = 0; k < (touch ? 16 : 30); k++) { const a = rnd() * 6.283, r = 7 + rnd() * 8; const x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r * 0.8 - 1; if (Math.abs(x) < W / 2 + 1.4 && z > -D / 2 - 1.5 && z < D / 2 + 4.5) continue; trees.push([x, z, 0.7 + rnd() * 0.7]); }
  const tg = new THREE.IcosahedronGeometry(0.55, 0).translate(0, 1.15, 0), tm = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), trees.length), trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.09, 0.7, 5).translate(0, 0.35, 0), new THREE.MeshStandardMaterial({ color: 0x5a4632 }), trees.length), m4 = new THREE.Matrix4();
  trees.forEach(([x, z, s], i) => { m4.makeScale(s, s, s); m4.setPosition(x, 0, z); tm.setMatrixAt(i, m4); trunk.setMatrixAt(i, m4); tm.setColorAt(i, new THREE.Color(greens[i % greens.length]).multiplyScalar(0.8)); }); tm.castShadow = !touch; scene.add(tm); scene.add(trunk);

  // andares
  const floors = {}; const MATS = [['conc', 0.85], ['glass', 0.25], ['lit', 0], ['rust', 0.9], ['plant', 1], ['water', 0.15]];
  function mkFloor(key, accs, y0) {
    const g = new THREE.Group(); g.position.y = y0; const meshes = [];
    for (const [nm, rough] of MATS) { const a = accs[nm]; if (!a || !a.p.length) continue; const mat = nm === 'lit' ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: nm === 'glass' ? 0.3 : 0 }); const m = new THREE.Mesh(toGeo(a), mat); m.castShadow = nm !== 'lit' && !touch; m.receiveShadow = true; m.userData.key = key; g.add(m); meshes.push(m); }
    scene.add(g); floors[key] = { key, g, meshes, y0, lift: 0, ghost: 0 };
  }
  mkFloor('terreo', terreoAccs(), 0);
  for (let n = 1; n <= NF; n++) mkFloor(n, floorAccs(n), HG + (n - 1) * FH);
  mkFloor('roof', roofAccs(), HG + NF * FH);
  const TOP = HG + NF * FH + FH;
  // contorno dourado do andar escolhido / sob o mouse
  const outl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.34, FH, D + 0.34)), new THREE.LineBasicMaterial({ color: 0xe2c77e })); outl.visible = false; scene.add(outl);
  const fl = (k) => floors[k], yMid = (k) => (k === 'terreo' ? HG / 2 : k === 'roof' ? HG + NF * FH + FH / 2 : HG + (k - 1) * FH + FH / 2), hOf = (k) => (k === 'terreo' ? HG : FH);

  // controles: gira na horizontal; a rolagem vertical da página continua funcionando no celular
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 30; controls.minPolarAngle = 0.55; controls.maxPolarAngle = 1.5;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.5; canvas.style.touchAction = 'pan-y';
  const home = () => ({ t: new THREE.Vector3(0, TOP * 0.46, 0), d: camera.aspect < 1 ? 31 : 19 });
  { const h = home(); controls.target.copy(h.t); camera.position.set(h.d * 0.62, TOP * 0.75, h.d * 0.8); }
  let fly = null, sel = null, busy = 0; const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function flyTo(t, d, elev) { const dir = camera.position.clone().sub(controls.target); dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(0.6, 0, 0.8); dir.normalize(); const p1 = t.clone().add(dir.multiplyScalar(d)); p1.y = t.y + elev; fly = { t0: performance.now(), d: 1100, p0: camera.position.clone(), q0: controls.target.clone(), p1, q1: t }; }
  controls.addEventListener('start', () => { fly = null; controls.autoRotate = false; busy = performance.now() + 1e9; }); controls.addEventListener('end', () => { busy = performance.now() + 1800; });

  // seleção
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const waUrl = (m) => 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Olá Kamila! ' + m);
  const img = (k, alt) => '<img src="' + IMG + k + '-md.webp" alt="' + esc(alt) + '" loading="lazy" decoding="async">';
  const chips = (a) => '<div class="lv3-chips">' + a.map((x) => '<span>' + esc(x) + '</span>').join('') + '</div>';
  const photos = (a) => '<div class="lv3-ph">' + a.map(([k, n]) => '<figure>' + img(k, n) + '<figcaption>' + esc(n) + '</figcaption></figure>').join('') + '</div>';
  const cta = (m, o) => '<a class="sm-btn sm-btn-gold lv3-cta" target="_blank" rel="noopener" data-corretor="Kamila" data-origem="levve3d_' + o + '" href="' + waUrl(m) + '"><span class="sm-dot"></span>Quero saber mais detalhes com a Kamila</a>';
  function showPanel(k, tipo) {
    let h;
    if (k === null) h = '<small>Maquete 3D</small><h3>Escolha um andar</h3><p>Toque num andar do prédio, ou na lista, para ver o que há nele. Arraste para girar.</p>' + cta('Vi o Levve Garden Living no site (maquete 3D) e quero saber mais detalhes.', 'geral');
    else if (k === 'roof') h = '<small>No alto do prédio</small><h3>Rooftop</h3><p>Entre a cidade e as montanhas, o rooftop reúne o lazer do prédio.</p>' + chips(ROOF.itens) + photos(ROOF.fotos) + cta('Vi o rooftop do Levve Garden Living na maquete 3D do site e quero saber mais detalhes.', 'rooftop');
    else if (k === 'terreo') h = '<small>Na rua e no dia a dia</small><h3>Térreo</h3><p>Comércio voltado para a rua e os espaços que facilitam a rotina.</p>' + chips(TERREO.itens) + photos(TERREO.fotos) + cta('Vi o térreo do Levve Garden Living na maquete 3D do site e quero saber mais detalhes.', 'terreo');
    else {
      const t = TIPOS.find((x) => x.k === tipo) || TIPOS[0];
      h = '<small>Andar</small><h3>' + k + 'º andar</h3><p>Escolha a tipologia para ver o apartamento.</p><div class="lv3-tp" role="tablist">' + TIPOS.map((x) => '<button type="button" role="tab" data-t="' + x.k + '" aria-selected="' + (x.k === t.k) + '" class="' + (x.k === t.k ? 'on' : '') + '">' + esc(x.n) + '</button>').join('') + '</div>'
        + '<div class="lv3-card">' + img(t.img, t.n + ' decorado') + '<div><b>' + esc(t.n) + '</b><span>' + esc(t.a) + '</span><p>' + esc(t.d) + '</p></div></div>'
        + '<p class="lv3-note">Imagem ilustrativa do apartamento decorado. Distribuição das unidades por andar e valores: fale com a Kamila.</p>' + cta('Vi o Levve Garden Living na maquete 3D do site e quero saber mais detalhes sobre o ' + k + 'º andar, tipologia ' + t.n + '.', 'andar' + k);
    }
    panel.innerHTML = h; panel.classList.toggle('open', k !== null);
    panel.querySelectorAll('.lv3-tp button').forEach((b) => b.addEventListener('click', () => { showPanel(k, b.getAttribute('data-t')); try { gtag('event', 'levve_3d', { andar: k, tipo: b.getAttribute('data-t') }); } catch (_) {} }));
  }
  function select(k) {
    sel = k; controls.autoRotate = false;
    list.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(b.getAttribute('data-k')) === String(k)));
    if (k === null) { const h = home(); flyTo(h.t, h.d, h.t.y * 0.5); showPanel(null); return; }
    const t = new THREE.Vector3(0, yMid(k), 0); flyTo(t, camera.aspect < 1 ? 24 : 13.5, k === 'terreo' ? 2.2 : 4.2);
    showPanel(k); try { gtag('event', 'levve_3d', { andar: k }); } catch (_) {}
    if (touch) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  list.innerHTML = KEYS.map((k) => '<button type="button" data-k="' + k + '">' + (k === 'roof' ? 'Rooftop' : k === 'terreo' ? 'Térreo' : k + 'º') + '</button>').join('');
  list.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const v = b.getAttribute('data-k'); select(v === 'roof' || v === 'terreo' ? v : +v); }));
  stage.querySelector('.lv3-reset').addEventListener('click', () => select(null));
  showPanel(null);

  // toque e mouse no prédio
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, hov = null; const all = Object.values(floors).flatMap((f) => f.meshes);
  const pick = (cx, cy) => { const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(all, false)[0]; return h ? h.object.userData.key : null; };
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 7) { const k = pick(e.clientX, e.clientY); if (k !== null) select(k); } down = null; });
  if (!touch) canvas.addEventListener('pointermove', (e) => { if (e.buttons) return; const k = pick(e.clientX, e.clientY); if (k !== hov) { hov = k; canvas.style.cursor = k !== null ? 'pointer' : 'grab'; } });
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  { const h = home(); controls.target.copy(h.t); camera.position.set(h.d * 0.62, TOP * 0.75, h.d * 0.8); } // enquadra de acordo com a tela (retrato ou paisagem)

  // laço
  const clock = new THREE.Clock(); let visible = true, lastR = 0; new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  function frame() {
    const nw = performance.now(); if (touch && !fly && nw > busy && nw - lastR < 30) return; lastR = nw;
    const dt = Math.min(clock.getDelta(), 0.05);
    // andares de cima sobem e ficam transparentes; o escolhido ganha contorno dourado
    const si = sel === null ? -1 : KEYS.indexOf(sel), ord = (k) => KEYS.length - 1 - KEYS.indexOf(k); // 0 = térreo ... 9 = rooftop
    for (const f of Object.values(floors)) {
      const above = sel !== null && ord(f.key) > ord(sel), tl = above ? 2.0 : 0, tg2 = above ? 1 : 0;
      f.lift += (tl - f.lift) * Math.min(1, dt * 5); f.ghost += (tg2 - f.ghost) * Math.min(1, dt * 6); f.g.position.y = f.y0 + f.lift;
      const op = 1 - f.ghost; f.g.visible = f.ghost < 0.97; f.meshes.forEach((m) => { m.castShadow = !touch && f.ghost < 0.3 && m.material.type !== 'MeshBasicMaterial'; const mt = m.material; const tr = f.ghost > 0.02; if (mt.transparent !== tr) { mt.transparent = tr; mt.depthWrite = !tr; mt.needsUpdate = true; } mt.opacity = op; });
    }
    const fo = sel !== null ? sel : hov; if (fo !== null && fo !== undefined) { outl.visible = true; outl.scale.y = hOf(fo) / FH; outl.position.set(0, floors[fo].y0 + floors[fo].lift + hOf(fo) / 2, 0); outl.material.opacity = 1; } else outl.visible = false;
    if (fly) { const k = Math.min(1, (nw - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) fly = null; }
    controls.update(); renderer.render(scene, camera);
  }
  stage._frame = frame;
  (function loop() { requestAnimationFrame(loop); if (visible) frame(); })();
  stage.classList.add('gl', 'ready');
}
