// Maquete do portfólio ZAH: relevo real de Itapema e Porto Belo (SRTM), linha da costa, praias, ruas e o contorno real
// de cada construção (OpenStreetMap), mar com raso turquesa e ondas quebrando na areia, janelas acendendo no fim de tarde,
// e os prédios da ZAH subindo nos endereços. Alturas aproximadas; o relevo é exagerado 2x e as alturas dos prédios 1,8x.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const VE = 2.0, BX = 1.8; // exagero do relevo e da altura dos prédios
const FH = 3 * BX / 100; // altura de um andar (unidades: 1 = 100 m)
const ST = { pronto: 0x5fd38a, obra: 0x79c2cd, lanc: 0xe2c77e };
const P = [
  { id: 'canvas', nome: 'Canvas', st: 'pronto', ll: [-27.1388, -48.5933], tw: [[0, 0, 16, 26, 22]] },
  { id: 'amrita', nome: 'Amrita', st: 'obra', ll: [-27.1545, -48.5699], tw: [[0, 0, 17, 30, 20]] },
  { id: 'tenet', nome: 'Tenet', st: 'obra', ll: [-27.0987, -48.6227], tw: [[-45, 0, 30, 24, 24, 'obra'], [45, 12, 30, 24, 24, 'obra'], [-135, -30, 36, 24, 24, 'lanc'], [130, 40, 36, 24, 24, 'lanc']], sub: 'Fase 1 em obras · Fase 2 em lançamento' },
  { id: 'veda', nome: 'Vedá', st: 'lanc', ll: [-27.0898, -48.6059], tw: [[0, 0, 22, 30, 24]] },
  { id: 'tekoa', nome: 'Tekoā', st: 'lanc', ll: [-27.0626, -48.5967], tw: [[-30, 0, 26, 24, 22], [34, 18, 20, 30, 26]] },
  { id: 'amazonia', nome: 'Amazônia', st: 'lanc', ll: [-27.1575, -48.5585], tw: [[0, 0, 8, 22, 18]], aprox: true },
];
const ZT = { pt: { st: { pronto: 'Pronto para morar', obra: 'Em obras', lanc: 'Lançamento' }, tenet: 'Fase 1 em obras · Fase 2 em lançamento', aprox: 'Frente mar em Porto Belo (posição aproximada).', ver: 'Toque em "Ver detalhes" para a ficha completa e a tabela.', zin: 'Aproximar', zout: 'Afastar', zall: 'Ver tudo', poi: 'Pontos de referência', hint: 'Use + e − ou Ctrl + rolagem para aproximar', orla: ['Passeio', 'Orla de Meia Praia', 'Sobrevoando a beira-mar de Meia Praia, em Itapema, com os prédios de frente para o mar. Toque na maquete para parar.'] },
  en: { st: { pronto: 'Move-in ready', obra: 'Under construction', lanc: 'New launch' }, tenet: 'Phase 1 under construction · Phase 2 new launch', aprox: 'Beachfront in Porto Belo (approximate position).', ver: 'Tap "View details" for the full specs and prices.', zin: 'Zoom in', zout: 'Zoom out', zall: 'See all', poi: 'Landmarks', hint: 'Use + and − or Ctrl + scroll to zoom', orla: ['Ride', 'Meia Praia beachfront', 'Flying along the Meia Praia seafront in Itapema, with the buildings facing the sea. Tap the model to stop.'] },
  es: { st: { pronto: 'Listo para vivir', obra: 'En construcción', lanc: 'Lanzamiento' }, tenet: 'Etapa 1 en obra · Etapa 2 en lanzamiento', aprox: 'Frente al mar en Porto Belo (posición aproximada).', ver: 'Toque "Ver detalles" para la ficha completa y la lista.', zin: 'Acercar', zout: 'Alejar', zall: 'Ver todo', poi: 'Puntos de referencia', hint: 'Use + y − o Ctrl + rueda para acercar', orla: ['Paseo', 'Costanera de Meia Praia', 'Sobrevolando la costanera de Meia Praia, en Itapema, con los edificios frente al mar. Toque la maqueta para parar.'] } };

// pontos de referência: só entram os confirmados em duas fontes (OpenStreetMap + site/endereço oficial ou guia local), com a rua batendo no mapa
const POI = [
  { k: 'hosp', t: 1, ll: [-27.09534, -48.62440], n: ['Hospital Municipal Santo Antônio', 'Santo Antônio Municipal Hospital', 'Hospital Municipal Santo Antônio'] },
  { k: 'hall', t: 1, ll: [-27.09580, -48.61701], n: ['Prefeitura de Itapema', 'Itapema City Hall', 'Alcaldía de Itapema'] },
  { k: 'bus', t: 1, ll: [-27.10502, -48.61730], n: ['Rodoviária de Itapema', 'Itapema Bus Station', 'Terminal de buses de Itapema'] },
  { k: 'cart', t: 2, ll: [-27.10586, -48.61603], n: ['Comper', 'Comper', 'Comper'] },
  { k: 'view', t: 1, ll: [-27.08760, -48.60369], n: ['Mirante do Encanto', 'Mirante do Encanto lookout', 'Mirador Mirante do Encanto'] },
  { k: 'bag', t: 1, ll: [-27.11885, -48.61021], n: ['Havan', 'Havan', 'Havan'] },
  { k: 'mall', t: 1, ll: [-27.12853, -48.60103], n: ['Shopping Russi & Russi', 'Russi & Russi Shopping', 'Shopping Russi & Russi'] },
  { k: 'cart', t: 2, ll: [-27.12704, -48.60213], n: ['Supermercados Koch', 'Koch Supermarket', 'Supermercados Koch'] },
  { k: 'park', t: 2, ll: [-27.14276, -48.59424], n: ['Parque das Capivaras', 'Capivaras Park', 'Parque das Capivaras'] },
  { k: 'water', t: 1, ll: [-27.16043, -48.58663], n: ['Parque Porto das Águas', 'Porto das Águas water park', 'Parque Porto das Águas'] },
];
const POI_ICON = {
  hosp: '<path d="M12 6v12M6 12h12"/>', hall: '<path d="M3.5 10 12 4.5 20.5 10M5.5 20V10.5M10 20V10.5M14 20V10.5M18.5 20V10.5M3.5 20h17"/>',
  bus: '<rect x="5.5" y="4.5" width="13" height="11.5" rx="2.2"/><path d="M5.5 11h13M8.5 19.5V16M15.5 19.5V16"/>', cart: '<path d="M3.5 5h2.2l2 9.5h9.6l2-7H7"/><circle cx="9.5" cy="18.5" r="1.1"/><circle cx="16" cy="18.5" r="1.1"/>',
  view: '<path d="M12 20.5s6-5.2 6-9.8a6 6 0 0 0-12 0c0 4.600 6 9.800 6 9.800z"/><circle cx="12" cy="10.6" r="2.100"/>', bag: '<path d="M6 8.500h12l-1 11H7l-1-11zM9 8.500a3 3 0 0 1 6 0"/>',
  mall: '<path d="M6 8.500h12l-1 11H7l-1-11zM9 8.500a3 3 0 0 1 6 0"/>', park: '<path d="M12 3.800 17 12h-3l4 6H6l4-6H7l5-8.200zM12 18v3"/>', water: '<path d="M3 13.500c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 18.500c3 0 3-2 6-2s3 2 6 2 3-2 6-2"/><circle cx="12" cy="6.500" r="2.300"/>',
};
const ZL = ZT[(document.documentElement.lang || 'pt').slice(0, 2)] || ZT.pt;
const PLACES = [['Itapema', -27.093, -48.616], ['Meia Praia', -27.124, -48.604], ['Porto Belo', -27.161, -48.556], ['BR-101', -27.118, -48.628], ['Balneário Camboriú ↑', -27.056, -48.606]];

export async function init(stage, opts = {}) {
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.vp-3d-pins'), card = stage.querySelector('.vp-3d-card');
  const touch = window.matchMedia('(pointer: coarse)').matches, big = !touch && Math.min(screen.width, screen.height) >= 700;
  const tUrl = stage.getAttribute('data-terrain'), root = tUrl.replace(/js\/zah-terreno\.json.*$/, '');
  const [data, city, vida] = await Promise.all([fetch(tUrl).then((r) => r.json()), fetch(root + 'js/zah-cidade.json?v=5').then((r) => r.json()).catch(() => null), fetch(root + 'js/zah-vida.json?v=2').then((r) => r.json()).catch(() => null)]);
  const [N, S, W, E] = data.box, nx = data.nx, ny = data.ny;
  const latC = (N + S) / 2, lonC = (W + E) / 2, kx = 111320 * Math.cos(latC * Math.PI / 180) / 100, kz = 110540 / 100;
  const X = (lon) => (lon - lonC) * kx, Z = (lat) => (latC - lat) * kz;
  const WU = (E - W) * kx, HU = (N - S) * kz;
  // relevo suavizado (interpolação cúbica do SRTM), em unidades; nunca abaixo de 1 m para a terra ficar acima da água
  const hR = (i, j) => data.h[Math.max(0, Math.min(ny - 1, j)) * nx + Math.max(0, Math.min(nx - 1, i))];
  const cub = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  const hXZ = (x, z) => {
    const fx = (x + WU / 2) / WU * (nx - 1), fy = (z + HU / 2) / HU * (ny - 1), i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    const r = (jj) => cub(hR(i - 1, jj), hR(i, jj), hR(i + 1, jj), hR(i + 2, jj), u);
    return Math.max(1, cub(r(j - 1), r(j), r(j + 1), r(j + 2), v)) * VE / 100;
  };
  const hAt = (lat, lon) => hXZ(X(lon), Z(lat));

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance' }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.4 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !touch; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9c79a, 90, 190);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1600);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x3a4a3a, 0.95));
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.4); sun.position.set(60, 70, 40); sun.castShadow = true;
  // céu de fim de tarde: o sol baixo a oeste, atrás dos morros (é onde ele se põe visto do mar de Itapema)
  const SKY = { zen: new THREE.Color(0x0f3d63), mid: new THREE.Color(0x5f98bb), hc: new THREE.Color(0xd9c8b6), hw: new THREE.Color(0xf0b273), glow: new THREE.Color(0xff9c45), core: new THREE.Color(0xffe6a8) };
  const sunDir = new THREE.Vector3(-0.78, 0.05, 0.62).normalize();
  const rim = new THREE.DirectionalLight(0xffb070, 0.9); rim.position.copy(sunDir).multiplyScalar(100); scene.add(rim);
  const HZ = 'vec3 hz(vec3 d){ vec2 a = normalize(d.xz + 1e-5); vec2 s = normalize(sunDir.xz); return mix(hc, hw, pow(max(dot(a, s), 0.0), 2.5)); }';
  const skyU = { sunDir: { value: sunDir }, zen: { value: SKY.zen }, mid: { value: SKY.mid }, hc: { value: SKY.hc }, hw: { value: SKY.hw }, glow: { value: SKY.glow }, core: { value: SKY.core } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 sunDir, zen, mid, hc, hw, glow, core; varying vec3 vD; ' + HZ + ' void main(){ vec3 d = normalize(vD); float h = d.y; vec3 c = hz(d); c = mix(c, mid, smoothstep(0.0, 0.1, h)); c = mix(c, zen, smoothstep(0.1, 0.45, h)); float sd = max(dot(d, sunDir), 0.0); c += glow * (pow(sd, 8.0) * 0.22 * (1.0 - smoothstep(0.0, 0.3, h)) + pow(sd, 80.0) * 0.45 + pow(sd, 900.0) * 0.7); c = mix(c, core * 1.35, smoothstep(0.99950, 0.99966, sd)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  sun.shadow.mapSize.set(big ? 4096 : 2048, big ? 4096 : 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 }); sun.shadow.bias = -0.0004; scene.add(sun);
  // a sombra acompanha o ponto para onde a câmera olha: perto, fica nítida
  const shadowFit = (tg, r) => { const c = sun.shadow.camera; c.left = c.bottom = -r; c.right = c.top = r; c.updateProjectionMatrix(); sun.target.position.copy(tg); sun.position.copy(tg).add(new THREE.Vector3(60, 70, 40)); sun.target.updateMatrixWorld(); };

  // texturas: chão (areia, mata, ruas, costa) e mapa do mar (distância até a praia)
  const tl = new THREE.TextureLoader(), maxAniso = renderer.capabilities.getMaxAnisotropy();
  const [chao, marT] = await Promise.all([tl.loadAsync(root + 'images/zah/' + (big ? 'chao.webp' : 'chao-m.webp') + '?v=2').catch(() => null), tl.loadAsync(root + 'images/zah/mar.png?v=2').catch(() => null)]);
  if (chao) { chao.colorSpace = THREE.SRGBColorSpace; chao.anisotropy = Math.min(8, maxAniso); }

  // relevo
  const GX = big ? 241 : touch ? 101 : 151, GY = Math.round(GX * HU / WU);
  const geo = new THREE.PlaneGeometry(WU, HU, GX - 1, GY - 1);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) { const i = k % GX, j = (k / GX) | 0; pos.setZ(k, hXZ(-WU / 2 + WU * i / (GX - 1), -HU / 2 + HU * j / (GY - 1))); }
  geo.computeVertexNormals();
  const landMat = chao ? new THREE.MeshStandardMaterial({ map: chao, alphaTest: 0.5, roughness: 0.95, metalness: 0 }) : new THREE.MeshStandardMaterial({ color: 0x8aa070, roughness: 0.95 });
  const land = new THREE.Mesh(geo, landMat);
  land.rotation.x = -Math.PI / 2; land.receiveShadow = true; scene.add(land);

  // mar: fundo raso turquesa perto da areia, azul profundo longe; ondas que quebram em espuma na beira; reflexo do céu e do sol
  const waterMat = new THREE.ShaderMaterial({ uniforms: Object.assign({ t: { value: 0 }, fN: { value: 90 }, fF: { value: 190 }, mar: { value: marT }, hasMar: { value: marT ? 1 : 0 }, box: { value: new THREE.Vector2(WU, HU) },
      deep: { value: new THREE.Color(0x0a3d55) }, midc: { value: new THREE.Color(0x13707f) }, shal: { value: new THREE.Color(0x2fb3aa) }, sand: { value: new THREE.Color(0x8fd3c0) } }, skyU),
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float t, fN, fF, hasMar; uniform vec2 box; uniform sampler2D mar; uniform vec3 sunDir, zen, mid, hc, hw, glow, core, deep, midc, shal, sand; varying vec3 vW; ' + HZ +
      ' float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
      ' float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }' +
      ' void main(){ vec2 uv = vec2((vW.x + box.x*0.5)/box.x, 1.0 - (vW.z + box.y*0.5)/box.y); vec2 m = vec2(1.0); if (hasMar > 0.5 && uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) { m = texture2D(mar, uv).rg; float eg = smoothstep(0.0, 0.12, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y))); m.g = mix(1.0, m.g, eg); } ' +
      ' float dS = m.r, dD = m.g; vec2 q = vW.xz; ' +
      ' vec3 c = mix(sand, shal, smoothstep(0.0, 0.05, dS)); c = mix(c, midc, smoothstep(0.08, 0.6, dS)); c = mix(c, deep, smoothstep(0.35, 1.0, dD)); ' +
      (touch ? ' float nz = vn(q*12.0 + vec2(t*0.15, -t*0.1)); c *= 0.94 + 0.1 * nz; ' : ' float nz = vn(q*9.0 + vec2(t*0.15, -t*0.1)) * 0.6 + vn(q*23.0 - vec2(t*0.2, t*0.12)) * 0.4; c *= 0.94 + 0.1 * nz; ') +
      (touch ? ' vec3 n = normalize(vec3(sin(q.x*1.7 + q.y*0.9 + t*1.3) * 0.035 + sin(q.x*4.3 - q.y*2.9 - t*1.7) * 0.025 + (nz - 0.5) * 0.05, 1.0, sin(q.y*1.9 - q.x*1.1 + t*1.1) * 0.035 + sin(q.y*5.3 + q.x*2.3 - t*1.9) * 0.025 + (nz - 0.5) * 0.05)); ' : ' vec3 n = normalize(vec3(sin(q.x*1.7 + q.y*0.9 + t*1.3) * 0.035 + sin(q.x*4.3 - q.y*2.9 - t*1.7) * 0.025 + sin(q.y*7.1 + q.x*3.7 + t*2.1) * 0.015 + (nz - 0.5) * 0.05, 1.0, sin(q.y*1.9 - q.x*1.1 + t*1.1) * 0.035 + sin(q.y*5.3 + q.x*2.3 - t*1.9) * 0.025 + sin(q.x*6.7 - q.y*4.1 + t*2.4) * 0.015 + (nz - 0.5) * 0.05)); ') +
      ' vec3 v = normalize(vW - cameraPosition); float fr = pow(1.0 - max(-v.y, 0.0), 5.0); c = mix(c, hz(reflect(v, n)) * 0.9, fr * 0.55); ' +
      ' float g = pow(max(dot(reflect(v, n), sunDir), 0.0), 260.0); c += glow * g * 1.8; ' +
      // ondas: faixas que andam em direção à praia e se desfazem em espuma na areia
      ' float w1 = dS * 70.0 - t * 1.25 + vn(q*4.0) * 2.5; float crest = pow(max(sin(w1), 0.0), 14.0) * (1.0 - smoothstep(0.03, 0.16, dS)) * smoothstep(0.004, 0.02, dS); ' +
      ' float br = vn(q*60.0 + t*0.6); float shore = (1.0 - smoothstep(0.0, 0.022 + 0.012 * sin(t*1.25 + vn(q*6.0)*6.0), dS)) * (0.55 + 0.45 * br); ' +
      ' float foam = clamp(crest * (0.5 + 0.7 * br) + shore, 0.0, 1.0); float px = fwidth(dS * 70.0); foam *= 1.0 - smoothstep(0.6, 2.5, px); c = mix(c, vec3(0.96, 0.98, 0.97), foam * 0.85); ' +
      ' float d = length(vW - cameraPosition); c = mix(c, hz(v), smoothstep(fN, fF, d)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
  waterMat.extensions = { derivatives: true };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = 0.0; scene.add(water);

  // cidade: cada construção com o contorno real do OpenStreetMap; janelas por andar que acendem no fim de tarde
  let orlaPath = null;
  if (city && city.b) {
    const ox = -WU / 2, oz = -HU / 2, vp = [], vc = [], vi = [], ix = [], c = new THREE.Color();
    const hs = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
    const lodF = touch ? P.map((p) => [X(p.ll[1]), Z(p.ll[0])]) : null; if (lodF && city.orla) city.orla.forEach((o, i) => { if (i % 3 === 0) lodF.push([o[0] / 100 + ox, o[1] / 100 + oz]); });
    const lodNear = (x, z, r2) => lodF.some((f) => (f[0] - x) * (f[0] - x) + (f[1] - z) * (f[1] - z) < r2);
    city.b.forEach((b, bi) => {
      const fl = b[0], n = (b.length - 1) / 2; if (n < 3) return;
      const xs = [], zs = []; for (let i = 0; i < n; i++) { xs.push(b[1 + i * 2] / 100 + ox); zs.push(b[2 + i * 2] / 100 + oz); }
      if (lodF && fl <= 4 && !lodNear(xs[0], zs[0], fl <= 2 ? 40 : 150)) return;
      let a2 = 0, base = 1e9; for (let i = 0; i < n; i++) { const j = (i + 1) % n; a2 += xs[i] * zs[j] - xs[j] * zs[i]; base = Math.min(base, hXZ(xs[i], zs[i])); }
      base -= 0.004; const top = base + fl * FH, r = hs(bi + 1), tower = fl >= 6;
      // cores: torres claras (branco, areia, cinza, algumas com vidro azulado); casas em tons quentes com telhado de barro
      if (tower) { const k = r * 5 | 0; c.setHex([0xf2eee6, 0xe9e1d2, 0xdcdcd8, 0xc9d6dc, 0xefe6d6][k]); } else c.setHSL(0.09 + r * 0.04, 0.25 + r * 0.2, 0.78 + r * 0.1);
      const roof = tower ? new THREE.Color(0xb9b5ae) : new THREE.Color().setHSL(0.03 + r * 0.03, 0.45, 0.42 + r * 0.08);
      const v0 = vp.length / 3, id = r;
      for (let i = 0; i < n; i++) { vp.push(xs[i], base, zs[i]); vc.push(c.r, c.g, c.b); vi.push(base, id, tower ? 1 : 0); }
      for (let i = 0; i < n; i++) { vp.push(xs[i], top, zs[i]); vc.push(c.r, c.g, c.b); vi.push(base, id, tower ? 1 : 0); }
      for (let i = 0; i < n; i++) { vp.push(xs[i], top, zs[i]); vc.push(roof.r, roof.g, roof.b); vi.push(base, id, -1); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (a2 > 0) ix.push(v0 + i, v0 + n + j, v0 + j, v0 + i, v0 + n + i, v0 + n + j); else ix.push(v0 + i, v0 + j, v0 + n + j, v0 + i, v0 + n + j, v0 + n + i); }
      const tri = THREE.ShapeUtils.triangulateShape(xs.map((x, i) => new THREE.Vector2(x, zs[i])), []);
      tri.forEach(([p, q, s]) => { const cy = (zs[q] - zs[p]) * (xs[s] - xs[p]) - (xs[q] - xs[p]) * (zs[s] - zs[p]); if (cy > 0) ix.push(v0 + 2 * n + p, v0 + 2 * n + q, v0 + 2 * n + s); else ix.push(v0 + 2 * n + p, v0 + 2 * n + s, v0 + 2 * n + q); });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(vc, 3)); g.setAttribute('aI', new THREE.Float32BufferAttribute(vi, 3));
    g.setIndex(vp.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(ix, 1) : new THREE.Uint16BufferAttribute(ix, 1));
    const cm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.02, flatShading: true });
    cm.onBeforeCompile = (sh) => {
      sh.uniforms.uFH = { value: FH };
      sh.vertexShader = 'attribute vec3 aI; varying vec3 vI; varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vI = aI;');
      sh.fragmentShader = 'uniform float uFH; varying vec3 vI; varying vec3 vWp;\n float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (vI.z > -0.5) {
          vec3 wn = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
          if (abs(wn.y) < 0.5) {
            vec2 tg = normalize(vec2(-wn.z, wn.x)); float u = dot(vWp.xz, tg) / (vI.z > 0.5 ? 0.034 : 0.045); float v = (vWp.y - vI.x) / uFH;
            vec2 cell = floor(vec2(u, v)), f = fract(vec2(u, v));
            float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.85) * step(0.6, v);
            float aa = clamp(1.0 - (max(fwidth(u), fwidth(v)) - 0.1) * 4.5, 0.0, 1.0);
            float lit = step(vI.z > 0.5 ? 0.62 : 0.8, hh(cell + vI.y * 97.0));
            float wm = mix(0.33, win, aa) * (vI.z > 0.5 ? 1.0 : 0.6);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.22, 0.27), wm * 0.8);
            roughnessFactor = mix(roughnessFactor, 0.18, wm);
            totalEmissiveRadiance += vec3(1.0, 0.7, 0.4) * mix(0.33 * (vI.z > 0.5 ? 0.38 : 0.2), win * lit, aa) * 1.1;
          }
        }`);
    };
    const cityMesh = new THREE.Mesh(g, cm); cityMesh.castShadow = !touch; cityMesh.receiveShadow = true; scene.add(cityMesh);
    if (city.orla && city.orla.length > 4) orlaPath = { cam: new THREE.CatmullRomCurve3(city.orla.map((p) => new THREE.Vector3(p[0] / 100 + ox, 0, p[1] / 100 + oz))), tg: new THREE.CatmullRomCurve3(city.orla.map((p) => new THREE.Vector3(p[2] / 100 + ox, 0, p[3] / 100 + oz))) };
  }

  // vida: carros e gente nas ruas, gente e guarda-sóis na areia, nadadores, barcos e gaivotas (dados em js/zah-vida.json)
  let vidaTick = null;
  if (vida) {
    const vox = -WU / 2, voz = -HU / 2, wx = (m) => m / 100 + vox, wz = (m) => m / 100 + voz;
    let sd = 5; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const pick = (a) => a[(rnd() * a.length) | 0];
    const q = touch ? 0.5 : 1; // celular: metade
    // onde a vida se concentra: perto dos prédios da ZAH e da orla de Meia Praia
    const focus = P.map((p) => [X(p.ll[1]), Z(p.ll[0])]); if (city && city.orla) city.orla.forEach((o, i) => { if (i % 4 === 0) focus.push([o[0] / 100 + vox, o[1] / 100 + voz]); });
    const prox = (x, z) => { let d = 1e9; for (const f of focus) d = Math.min(d, Math.hypot(x - f[0], z - f[1])); return d < 14 ? 1 : d < 35 ? 0.45 : 0.1; };
    const merge = (list) => { const pos = [], nor = [], col = [], ix = []; let o = 0; list.forEach(([g, c]) => { const p = g.attributes.position, nn = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); col.push(c, c, c); } for (let i = 0; i < g.index.count; i++) ix.push(g.index.getX(i) + o); o += p.count; }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(ix); return g; };
    const mkRoute = (pts, extra) => { const p = pts.map(([x, z]) => [wx(x), wz(z)]), L = [0]; for (let k = 1; k < p.length; k++) L.push(L[k - 1] + Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1])); return Object.assign({ p, L, len: L[L.length - 1] }, extra); };
    const pairs = (a, from) => { const o = []; for (let i = from; i + 1 < a.length; i += 2) o.push([a[i], a[i + 1]]); return o; };
    const seg = (r, o) => { const L = r.L, nS = L.length - 1; let k = o.k || 1; while (k < nS && L[k] < o.d) k++; while (k > 1 && L[k - 1] > o.d) k--; o.k = k; const [x1, z1] = r.p[k - 1], [x2, z2] = r.p[k], t = (o.d - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]), dx = x2 - x1, dz = z2 - z1, ln = Math.hypot(dx, dz) || 1; return [x1 + dx * t, z1 + dz * t, dx / ln, dz / ln]; };
    const aw = (a) => { while (a > Math.PI) a -= 6.2832; while (a < -Math.PI) a += 6.2832; return a; };
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), sc4 = new THREE.Vector3(1, 1, 1), p4 = new THREE.Vector3();
    const ticks = [];
    const roads = vida.roads.map((r) => mkRoute(pairs(r, 1), { c: r[0] })).filter((r) => r.len > 0.5);
    const RW = [0.12, 0.09, 0.07, 0.055, 0.03];

    const DENS = [0.6, 0.5, 0.4, 0.2], SPD = [0.5, 0.32, 0.27, 0.2];
    // carros: andam numa rede de ruas ligadas; escolhem o caminho nos cruzamentos, fazem retorno nas ruas sem saída e nunca somem nas pontas
    function buildNet(rts, tol) {
  const CS = tol * 4, grid = new Map(), K = (i, j) => i + ',' + j;
  const put = (i, j, v) => { const k = K(i, j); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(v); };
  rts.forEach((r, ri) => { for (let i = 1; i < r.p.length; i++) { const a = r.p[i - 1], b = r.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / (CS / 2))); for (let q = 0; q <= n; q++) { const x = a[0] + (b[0] - a[0]) * q / n, z = a[1] + (b[1] - a[1]) * q / n; put(Math.floor(x / CS), Math.floor(z / CS), ri * 100000 + i); } } });
  // pontos de corte por rua: { i (trecho), t, x, z }
  const cuts = rts.map(() => []), snap = rts.map(() => [null, null]);
  rts.forEach((r, ri) => {
    [0, r.p.length - 1].forEach((vi, side) => {
      const P0 = r.p[vi], ci = Math.floor(P0[0] / CS), cj = Math.floor(P0[1] / CS); let best = null; const seen = new Set();
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const code of grid.get(K(ci + a, cj + b)) || []) {
        if (seen.has(code)) continue; seen.add(code); const sj = Math.floor(code / 100000), si = code % 100000; if (sj === ri) continue;
        const A = rts[sj].p[si - 1], B = rts[sj].p[si], dx = B[0] - A[0], dz = B[1] - A[1], l2 = dx * dx + dz * dz || 1e-9;
        const t = Math.max(0, Math.min(1, ((P0[0] - A[0]) * dx + (P0[1] - A[1]) * dz) / l2)), qx = A[0] + dx * t, qz = A[1] + dz * t, d = Math.hypot(qx - P0[0], qz - P0[1]);
        if (d <= tol && (!best || d < best.d)) best = { d, sj, si, t, x: qx, z: qz };
      }
      if (best) { snap[ri][side] = [best.x, best.z]; cuts[best.sj].push({ i: best.si, t: best.t, x: best.x, z: best.z }); }
    });
  });
  // trechos entre cruzamentos

  const nodes = [], ngrid = new Map(), NK = (i, j) => i + ',' + j, NC = tol * 2;
  const nodeId = (x, z) => { const ci = Math.floor(x / NC), cj = Math.floor(z / NC); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const id of ngrid.get(NK(ci + a, cj + b)) || []) if (Math.hypot(nodes[id][0] - x, nodes[id][1] - z) <= tol) return id; const id = nodes.length; nodes.push([x, z]); const k = NK(ci, cj); let arr = ngrid.get(k); if (!arr) ngrid.set(k, arr = []); arr.push(id); return id; };
  const edges = [];
  rts.forEach((r, ri) => {
    // vértices com cortes inseridos
    const P = r.p.map((q) => q.slice()); if (snap[ri][0]) P[0] = snap[ri][0].slice(); if (snap[ri][1]) P[P.length - 1] = snap[ri][1].slice();
    const items = []; // { pos: i + t, x, z, node }
    P.forEach((q, i) => items.push({ pos: i, x: q[0], z: q[1], node: i === 0 || i === P.length - 1 }));
    cuts[ri].forEach((c) => items.push({ pos: (c.i - 1) + c.t, x: c.x, z: c.z, node: true }));
    items.sort((u, v) => u.pos - v.pos);
    // junta pontos repetidos (mesma posição) mantendo a marca de nó
    const pts = []; items.forEach((it) => { const l = pts[pts.length - 1]; if (l && Math.hypot(l.x - it.x, l.z - it.z) < 1e-6) { l.node = l.node || it.node; } else pts.push({ x: it.x, z: it.z, node: it.node }); });
    let a = 0;
    for (let i = 1; i < pts.length; i++) {
      if (!pts[i].node) continue;
      const seg = pts.slice(a, i + 1).map((q) => [q.x, q.z]); a = i;
      const na = nodeId(seg[0][0], seg[0][1]), nb = nodeId(seg[seg.length - 1][0], seg[seg.length - 1][1]); seg[0] = nodes[na].slice(); seg[seg.length - 1] = nodes[nb].slice(); // as pontas colam exatamente no nó
      const L = [0]; for (let k = 1; k < seg.length; k++) L.push(L[k - 1] + Math.hypot(seg[k][0] - seg[k - 1][0], seg[k][1] - seg[k - 1][1]));
      if (L[L.length - 1] < 1e-4) continue;
      edges.push({ p: seg, L, len: L[L.length - 1], c: r.c, w: r.w, na, nb, ri });
    }
  });
  const adj = nodes.map(() => []);
  edges.forEach((e, i) => { adj[e.na].push({ e: i, end: 0 }); adj[e.nb].push({ e: i, end: 1 }); });
  // componentes (rede ligada)
  const par = nodes.map((_, i) => i), find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  edges.forEach((e) => { par[find(e.na)] = find(e.nb); });
  const clen = new Map(); edges.forEach((e) => { const r = find(e.na); e.comp = r; clen.set(r, (clen.get(r) || 0) + e.len); });
  edges.forEach((e) => { e.compLen = clen.get(e.comp); });
  return { edges, adj, nodes };
}
    const net = buildNet(roads.filter((r) => r.c <= 3).map((r) => ({ p: r.p, c: r.c, w: RW[r.c] })), 0.08);
    const E = net.edges, okE = E.map((e) => e.compLen >= 20);
    const want = E.map((e, i) => { if (!okE[i]) return 0; const m = e.p[e.p.length >> 1]; return e.len * DENS[e.c] * prox(m[0], m[1]); });
    const wsum = want.reduce((x, y) => x + y, 0) || 1, fct = Math.min(1, 440 * q / wsum);
    const tanAt = (e, end) => { const n = e.p.length, a = end === 0 ? e.p[0] : e.p[n - 1], b = end === 0 ? e.p[1] : e.p[n - 2], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; }; // direção saindo do nó
    const C = [];
    E.forEach((e, i) => { const n = Math.floor(want[i] * fct + rnd()); for (let q = 0; q < n; q++) { const dir = rnd() < 0.5 ? 1 : -1, c = { e: i, dir, d: rnd() * e.len, k: 1, v: SPD[e.c] * (0.8 + rnd() * 0.4), lat: 0, yaw: 0 }, [px, pz, ux, uz] = seg(e, { d: c.d, k: 1 }); c.yaw = -Math.atan2(uz * dir, ux * dir); C.push(c); } });
    if (C.length) {
      const carG = merge([[new THREE.BoxGeometry(0.11, 0.026, 0.048).translate(0, 0.016, 0), 1], [new THREE.BoxGeometry(0.06, 0.022, 0.042).translate(-0.008, 0.04, 0), 0.5]]);
      const cars = new THREE.InstancedMesh(carG, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.3 }), C.length);
      const pal = [0xf2f2f2, 0x1d1f22, 0x9aa3ab, 0xb3262b, 0x2d4f8a, 0xdcdcd5, 0x6b6f72, 0xe0b33a, 0x2f7d4f];
      C.forEach((c, i) => cars.setColorAt(i, new THREE.Color(pal[(i * 7 + (i >> 3)) % pal.length])));
      cars.castShadow = false; cars.frustumCulled = false; scene.add(cars);
      ticks.push((dt) => {
        C.forEach((c, i) => {
          const e = E[c.e], o = { d: c.d, k: c.k }; let [px, pz, ux, uz] = seg(e, o); c.k = o.k;
          // gira para a direção do trecho e só anda forte quando já está alinhado (retornos viram curva, não deslize)
          const tgt = -Math.atan2(uz * c.dir, ux * c.dir), dy = aw(tgt - c.yaw); c.yaw += dy * Math.min(1, dt * 6);
          c.d += c.dir * c.v * Math.max(0.15, 1 - Math.abs(dy) / 1.1) * dt;
          const endNode = c.dir > 0 ? e.nb : e.na, adj = net.adj[endNode], margin = adj.length === 1 ? 0.05 : 0;
          if (c.dir > 0 ? c.d >= e.len - margin : c.d <= margin) {
            const arrive = c.dir > 0 ? 1 : 0, cand = adj.filter((a) => !(a.e === c.e && a.end === arrive));
            if (!cand.length) { c.dir = -c.dir; c.d = Math.max(margin, Math.min(e.len - margin, c.d)); }
            else {
              const ax = ux * c.dir, az = uz * c.dir; let tot = 0; const ws = cand.map((a) => { const [lx2, lz2] = tanAt(E[a.e], a.end); const w = Math.exp(1.6 * (ax * lx2 + az * lz2)) * (E[a.e].c === 0 ? 2 : E[a.e].c === 3 ? 1 : 1.5); tot += w; return w; });
              let r2 = rnd() * tot, pk = cand[cand.length - 1]; for (let j = 0; j < cand.length; j++) { r2 -= ws[j]; if (r2 <= 0) { pk = cand[j]; break; } }
              c.e = pk.e; c.dir = pk.end === 0 ? 1 : -1; c.d = pk.end === 0 ? 0 : E[pk.e].len; c.k = pk.end === 0 ? 1 : E[pk.e].L.length - 1;
            }
          }
          const e2 = E[c.e], o2 = { d: c.d, k: c.k }; [px, pz, ux, uz] = seg(e2, o2); c.k = o2.k;
          c.lat += (E[c.e].w * 0.22 * c.dir - c.lat) * Math.min(1, dt * 5);
          const x = px - uz * c.lat, z = pz + ux * c.lat;
          p4.set(x, hXZ(x, z) + 0.004, z); e4.set(0, c.yaw, 0); q4.setFromEuler(e4); m4.compose(p4, q4, sc4); cars.setMatrixAt(i, m4);
        });
        cars.instanceMatrix.needsUpdate = true;
      });
    }

    // gente: calçadas (ruas e passeios perto do mar), areia e água rasa
    const people = [], sandP = pairs3(vida.sand), swimP = pairs(vida.swim, 0);
    function pairs3(a) { const o = []; for (let i = 0; i + 2 < a.length; i += 3) o.push([a[i], a[i + 1], a[i + 2]]); return o; }
    const wlk = roads.filter((r) => r.c >= 2).map((r) => { const m = r.p[r.p.length >> 1]; return { r, w: r.len * (r.c === 4 ? 1.1 : r.c === 3 ? 0.35 : 0.5) * prox(m[0], m[1]) }; });
    const wsm = wlk.reduce((x, y) => x + y.w, 0) || 1, wf = Math.min(1, 150 * q / wsm);
    wlk.forEach(({ r, w }) => { const n = Math.min(6, Math.floor(w * wf + rnd())); for (let k = 0; k < n; k++) people.push({ k: 'r', r, o: { d: rnd() * r.len, k: 1 }, dir: rnd() < 0.5 ? 1 : -1, v: 0.05 + rnd() * 0.05, off: (rnd() < 0.5 ? 1 : -1) * (RW[r.c] / 2 + 0.018) }); });
    // areia: banhistas (alguns passeando, a maioria parada perto do guarda-sol)
    const sandOk = sandP.filter((p) => p[2] >= 5 && prox(wx(p[0]), wz(p[1])) > 0.2);
    const NS = Math.round(300 * q), umbrellas = [];
    for (let i = 0; i < NS && sandOk.length; i++) { const p = pick(sandOk), x = wx(p[0]) + (rnd() - 0.5) * 0.3, z = wz(p[1]) + (rnd() - 0.5) * 0.3, R = Math.max(0.03, Math.min(0.3, (p[2] - 4) / 100)); people.push({ k: 'w', c: [wx(p[0]), wz(p[1])], R, x, z, tx: 0, tz: 0, wait: 0.2 + rnd() * (rnd() < 0.7 ? 40 : 4), v: 0.05 + rnd() * 0.04 }); }
    for (let i = 0; i < Math.round(180 * q) && sandOk.length; i++) { const p = pick(sandOk).slice(); if (p[2] < 9) continue; umbrellas.push([wx(p[0]) + (rnd() - 0.5) * 0.2, wz(p[1]) + (rnd() - 0.5) * 0.2]); }
    // nadadores
    const swimmers = []; for (let i = 0; i < Math.round(70 * q) && swimP.length; i++) { const p = pick(swimP); if (prox(wx(p[0]), wz(p[1])) < 0.2 && rnd() < 0.7) continue; swimmers.push({ x: wx(p[0]), z: wz(p[1]), a: rnd() * 6.28, ph: rnd() * 6.28, v: 0.02 + rnd() * 0.03 }); }
    if (people.length) {
      const skin = [0xf2c9a5, 0xd9a27a, 0xb7794f, 0x8a5a3c, 0xf0d2b8], cloth = [0xf2f2f2, 0xc43c3c, 0x2d6fb5, 0xe2b53a, 0x3f9a5a, 0x7a4fb0, 0xe0701f, 0x2a2c30, 0xd96c9a, 0x49b3b0];
      const pm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });
      const bod = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0075, 0.0095, 0.03, 6).translate(0, 0.015, 0).scale(1.3, 1.3, 1.3), pm, people.length);
      const hed = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0085, 6, 4).translate(0, 0.038, 0).scale(1.3, 1.3, 1.3), pm, people.length);
      people.forEach((p, i) => { bod.setColorAt(i, new THREE.Color(cloth[(rnd() * cloth.length) | 0])); hed.setColorAt(i, new THREE.Color(skin[(rnd() * skin.length) | 0])); });
      bod.frustumCulled = hed.frustumCulled = false; scene.add(bod); scene.add(hed);
      const step = (p, dt) => {
        if (p.k === 'r') { p.o.d += p.dir * p.v * dt; if (p.o.d > p.r.len) { p.o.d = p.r.len; p.dir = -1; } else if (p.o.d < 0) { p.o.d = 0; p.dir = 1; } const [px, pz, ux, uz] = seg(p.r, p.o); p.x = px - uz * p.off; p.z = pz + ux * p.off; }
        else if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * p.R; p.tx = p.c[0] + Math.cos(a) * d; p.tz = p.c[1] + Math.sin(a) * d; } }
        else { const dx = p.tx - p.x, dz = p.tz - p.z, L = Math.hypot(dx, dz); if (L < 0.02) p.wait = 2 + rnd() * 14; else { p.x += dx / L * p.v * dt; p.z += dz / L * p.v * dt; } }
      };
      ticks.push((dt) => { people.forEach((p, i) => { step(p, dt); m4.identity(); m4.setPosition(p.x, hXZ(p.x, p.z) + 0.003, p.z); bod.setMatrixAt(i, m4); hed.setMatrixAt(i, m4); }); bod.instanceMatrix.needsUpdate = true; hed.instanceMatrix.needsUpdate = true; });
    }
    if (umbrellas.length) {
      const ug = merge([[new THREE.ConeGeometry(0.03, 0.014, 8).translate(0, 0.05, 0), 1], [new THREE.CylinderGeometry(0.0016, 0.0016, 0.05, 4).translate(0, 0.025, 0), 0.35]]).scale(1.4, 1.4, 1.4);
      const um = new THREE.InstancedMesh(ug, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), umbrellas.length);
      const up = [0xe2483c, 0xf2b705, 0x2d8fd6, 0xffffff, 0x2fb37a, 0xe66fa6, 0xff8a2b];
      umbrellas.forEach(([x, z], i) => { e4.set((rnd() - 0.5) * 0.18, rnd() * 6.28, (rnd() - 0.5) * 0.18); q4.setFromEuler(e4); p4.set(x, hXZ(x, z) + 0.001, z); m4.compose(p4, q4, sc4); um.setMatrixAt(i, m4); um.setColorAt(i, new THREE.Color(up[i % up.length])); });
      um.frustumCulled = false; scene.add(um);
    }
    if (swimmers.length) {
      const sw = new THREE.InstancedMesh(new THREE.SphereGeometry(0.011, 6, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true }), swimmers.length);
      const sk = [0xf2c9a5, 0xd9a27a, 0xb7794f, 0xe33b3b, 0xffffff, 0x2d8fd6]; swimmers.forEach((p, i) => sw.setColorAt(i, new THREE.Color(sk[i % sk.length])));
      sw.frustumCulled = false; scene.add(sw);
      ticks.push((dt, now) => { swimmers.forEach((p, i) => { p.a += (rnd() - 0.5) * dt * 2; p.x += Math.cos(p.a) * p.v * dt * 0.4; p.z += Math.sin(p.a) * p.v * dt * 0.4; m4.identity(); m4.setPosition(p.x, 0.004 + Math.sin(now / 700 + p.ph) * 0.003, p.z); sw.setMatrixAt(i, m4); }); sw.instanceMatrix.needsUpdate = true; });
    }

    // barcos: veleiros, lanchas e escunas andando nas faixas de mar paralelas à costa; pesqueiros fundeados perto da praia
    const lanes = vida.lanes.map((l) => mkRoute(pairs(l, 1), { d: l[0] })).filter((l) => l.len > 1.2);
    const lw = lanes.map((l) => { const m = l.p[l.p.length >> 1]; return l.len * prox(m[0], m[1]); }), lsum = lw.reduce((x, y) => x + y, 0) || 1;
    const pickLane = (ok) => { let t = rnd() * lsum, best = null; for (let i = 0; i < lanes.length; i++) { t -= lw[i]; if (ok(lanes[i])) best = lanes[i]; if (t <= 0 && best) return best; } return best; };
    const KINDS = [
      { n: Math.round(24 * q), v: [0.05, 0.1], ok: (l) => l.d >= 330, hull: [[new THREE.BoxGeometry(0.3, 0.036, 0.085).translate(0, 0.018, 0), 1]], top: () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0.02, 0.04, 0, 0.02, 0.4, 0, -0.12, 0.04, 0, 0.06, 0.05, 0.01, 0.06, 0.32, 0.01, 0.17, 0.05, 0.01], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); g.setIndex([0, 1, 2, 3, 4, 5]); return g; }, topMat: () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }), wake: 1 },
      { n: Math.round(16 * q), v: [0.12, 0.22], ok: (l) => l.d >= 200, hull: [[new THREE.BoxGeometry(0.27, 0.03, 0.08).translate(0, 0.015, 0), 1]], top: () => new THREE.BoxGeometry(0.11, 0.04, 0.06).translate(-0.02, 0.05, 0), topMat: () => new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.5 }), wake: 1.3 },
      { n: Math.round(5 * q) || 1, v: [0.04, 0.07], ok: (l) => l.d >= 200 && l.d <= 500, hull: [[new THREE.BoxGeometry(0.55, 0.05, 0.14).translate(0, 0.025, 0), 1]], top: () => merge([[new THREE.BoxGeometry(0.4, 0.012, 0.12).translate(0, 0.108, 0), 1], [new THREE.BoxGeometry(0.4, 0.05, 0.1).translate(-0.02, 0.07, 0), 0.8]]), topMat: () => new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6 }), wake: 1.8 },
      { n: Math.round(18 * q), v: [0, 0], ok: (l) => l.d <= 200, hull: [[new THREE.BoxGeometry(0.2, 0.03, 0.065).translate(0, 0.015, 0), 1]], top: () => new THREE.BoxGeometry(0.06, 0.035, 0.05).translate(0.03, 0.045, 0), topMat: () => new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.6 }), wake: 0 },
    ];
    const hullCol = [[0xffffff, 0xf2f2f2, 0xd9e3ea, 0x1f3a5f], [0xffffff, 0xf2f2f2, 0xc43c3c, 0x1f3a5f], [0x7a4a28, 0x8a5a33], [0x2d6fb5, 0xe2b53a, 0xc43c3c, 0xf2f2f2, 0x3f9a5a]];
    const boats = [];
    KINDS.forEach((K, ki) => { for (let i = 0; i < K.n; i++) { const l = pickLane(K.ok); if (!l) break; boats.push({ K, ki, l, o: { d: rnd() * l.len, k: 1 }, dir: rnd() < 0.5 ? 1 : -1, v: K.v[0] + rnd() * (K.v[1] - K.v[0]), yaw: rnd() * 6.28, ph: rnd() * 6.28, fix: K.v[1] === 0 }); } });
    if (boats.length) {
      const grp = KINDS.map((K, ki) => { const list = boats.filter((b) => b.ki === ki); if (!list.length) return null; const hull = new THREE.InstancedMesh(merge(K.hull), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.1 }), list.length), top = new THREE.InstancedMesh(K.top(), K.topMat(), list.length); list.forEach((b, i) => hull.setColorAt(i, new THREE.Color(hullCol[ki][(rnd() * hullCol[ki].length) | 0]))); hull.frustumCulled = top.frustumCulled = false; scene.add(hull); scene.add(top); return { list, hull, top }; }).filter(Boolean);
      const moving = boats.filter((b) => !b.fix), wg = new THREE.BufferGeometry();
      wg.setAttribute('position', new THREE.Float32BufferAttribute([-0.1, 0, 0, -1, 0, -0.16, -1, 0, 0.16], 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 0.55, 1, 1, 1, 0, 1, 1, 1, 0], 4)); wg.setIndex([0, 2, 1]);
      const wake = new THREE.InstancedMesh(wg, new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }), moving.length);
      wake.frustumCulled = false; scene.add(wake);
      ticks.push((dt, now) => {
        let wi = 0;
        grp.forEach((g) => { g.list.forEach((b, i) => {
          let x, z;
          if (b.fix) { const o = { d: b.o.d, k: b.o.k }, [px, pz] = seg(b.l, o); x = px; z = pz; b.yaw += Math.sin(now / 5000 + b.ph) * dt * 0.05; }
          else { const [qx, qz, vx, vz] = seg(b.l, b.o), tgt = -Math.atan2(vz, vx) + (b.dir < 0 ? Math.PI : 0), dy = aw(tgt - b.yaw); b.yaw += dy * Math.min(1, dt * 1.5); const fim = Math.max(0.12, Math.min(1, (b.dir > 0 ? b.l.len - b.o.d : b.o.d) / 0.8)); b.o.d += b.dir * b.v * fim * Math.max(0.05, 1 - Math.abs(dy) / 0.9) * dt; if (b.o.d >= b.l.len) { b.o.d = b.l.len; b.dir = -1; } else if (b.o.d <= 0) { b.o.d = 0; b.dir = 1; } const [px, pz] = seg(b.l, b.o); x = px; z = pz; }
          const bob = Math.sin(now / 900 + b.ph) * 0.003, roll = Math.sin(now / 1300 + b.ph) * 0.05 + (b.fix ? 0 : 0.04);
          e4.set(roll, b.yaw, Math.sin(now / 1100 + b.ph) * 0.02, 'YXZ'); q4.setFromEuler(e4); p4.set(x, 0.004 + bob, z); sc4.set(1.4, 1.4, 1.4); m4.compose(p4, q4, sc4); sc4.set(1, 1, 1); g.hull.setMatrixAt(i, m4); g.top.setMatrixAt(i, m4);
          if (!b.fix) { e4.set(0, b.yaw, 0, 'YXZ'); q4.setFromEuler(e4); p4.set(x, 0.012, z); sc4.set(b.K.wake * 1.4, 1, 1.4); m4.compose(p4, q4, sc4); sc4.set(1, 1, 1); wake.setMatrixAt(wi++, m4); }
        }); g.hull.instanceMatrix.needsUpdate = true; g.top.instanceMatrix.needsUpdate = true; });
        wake.instanceMatrix.needsUpdate = true;
      });
    }

    // gaivotas: giram devagar sobre a praia e o mar
    { const NG = Math.round(26 * q), gs = [], base = sandP.length ? sandP : [[5000, 9000, 20]];
      for (let i = 0; i < NG; i++) { const p = pick(base); gs.push({ c: [wx(p[0]), wz(p[1])], r: 0.4 + rnd() * 1.8, a: rnd() * 6.28, w: (0.25 + rnd() * 0.3) * (rnd() < 0.5 ? 1 : -1), h: 0.35 + rnd() * 0.7, ph: rnd() * 6.28 }); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.05, 0.012, 0.13, 0.02, 0, 0.02, 0, 0, 0, -0.05, 0.012, -0.13, 0.02, 0, -0.02], 3)); bg.computeVertexNormals();
      const gm = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), NG); gm.frustumCulled = false; scene.add(gm);
      ticks.push((dt, now) => { gs.forEach((g, i) => { g.a += g.w * dt; const x = g.c[0] + Math.cos(g.a) * g.r, z = g.c[1] + Math.sin(g.a) * g.r; e4.set(Math.sin(now / 180 + g.ph) * 0.35, -g.a + (g.w > 0 ? Math.PI / 2 : -Math.PI / 2), 0, 'YXZ'); q4.setFromEuler(e4); p4.set(x, g.h + Math.sin(now / 900 + g.ph) * 0.06, z); m4.compose(p4, q4, sc4); gm.setMatrixAt(i, m4); }); gm.instanceMatrix.needsUpdate = true; });
    }
    vidaTick = (dt) => { const now = performance.now(); ticks.forEach((f) => f(dt, now)); };
    vidaTick(0.01);
  }

  // prédios da ZAH (destacados: cor do status, contorno e feixe de luz)
  const risers = [];
  P.forEach((p) => {
    const g = new THREE.Group(); const base = hAt(p.ll[0], p.ll[1]); g.position.set(X(p.ll[1]), base, Z(p.ll[0]));
    p.tw.forEach(([dx, dz, fl, w, d, st]) => {
      const h = fl * FH, ww = w * 1.4 / 100, dd = d * 1.4 / 100;
      const geo = new THREE.BoxGeometry(ww, h, dd); geo.translate(0, h / 2, 0);
      const lanc = (st || p.st) === 'lanc';
      const mat = lanc ? new THREE.MeshStandardMaterial({ color: 0xe2c77e, emissive: 0xb8862b, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.3 }) : new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: ST[st || p.st], emissiveIntensity: 0.3, roughness: 0.45 });
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(dx * 1.4 / 100, 0, dz * 1.4 / 100);
      const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: ST[st || p.st], transparent: true, opacity: 0.9 })); m.add(ed);
      // faixas de andares
      const fg = new THREE.BufferGeometry(), fa = [];
      for (let k = 1; k < fl; k += 2) { const y = k * FH; fa.push(-ww / 2 - 0.002, y, dd / 2 + 0.002, ww / 2 + 0.002, y, dd / 2 + 0.002, ww / 2 + 0.002, y, dd / 2 + 0.002, ww / 2 + 0.002, y, -dd / 2 - 0.002); }
      fg.setAttribute('position', new THREE.Float32BufferAttribute(fa, 3)); m.add(new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: 0x8d9a98, transparent: true, opacity: 0.5 })));
      g.add(m);
    });
    // anel no chão marcando o lugar
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.72, 48), new THREE.MeshBasicMaterial({ color: ST[p.st], transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; g.add(ring);
    // feixe de luz acima do prédio, para achar cada empreendimento no meio da cidade
    const topH = Math.max(...p.tw.map((t) => t[2])) * FH;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.2, 6, 20, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(ST[p.st]) } },
      vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 c; varying float vY; void main(){ float a = smoothstep(3.0, -3.0, vY) * 0.5; gl_FragColor = vec4(c, a); }' }));
    beam.position.y = topH + 3.1; g.add(beam); g.userData.beam = beam;
    g.userData.ring = ring; scene.add(g); p.g = g; p.top = new THREE.Vector3(g.position.x, base + topH + 0.6, g.position.z);
    risers.push({ g, t0: null });
  });

  // controles
  // o zoom é nosso (suave e na direção do ponto apontado); o OrbitControls só gira
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false; controls.enableZoom = false; controls.minDistance = 1.2; controls.maxDistance = 120; controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.48;
  controls.enabled = !touch;

  // pinos
  const pins = [];
  P.forEach((p) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vp-pin zp ' + p.st; b.innerHTML = '<i></i><span>' + p.nome + '</span>'; b.addEventListener('click', () => go(p.id)); pinBox.appendChild(b); pins.push({ el: b, v: p.top }); });
  PLACES.forEach(([n, la, lo]) => { const s = document.createElement('span'); s.className = 'zp-place'; s.textContent = n; pinBox.appendChild(s); pins.push({ el: s, v: new THREE.Vector3(X(lo), hAt(la, lo) + 0.4, Z(la)) }); });

  // pontos de referência
  const li = ['pt', 'en', 'es'].indexOf((document.documentElement.lang || 'pt').slice(0, 2)); let poiOn = true;
  POI.forEach((o) => { const b = document.createElement('span'); b.className = 'zp-poi t' + o.t; b.innerHTML = '<i><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + POI_ICON[o.k] + '</svg></i><b>' + o.n[Math.max(0, li)] + '</b>'; pinBox.appendChild(b); pins.push({ el: b, v: new THREE.Vector3(X(o.ll[1]), hAt(o.ll[0], o.ll[1]) + 0.32, Z(o.ll[0])), poi: o }); });

  // voo, cartão
  let fly = null, ride = null, cardT = 0, cur = null, sway = false, swayBase = null, swayT0 = 0;
  const hideCard = () => { clearTimeout(cardT); card.classList.remove('show'); };
  // visão geral: vista do mar para a orla, o mais perto possível com todos os prédios na tela
  const UP = new THREE.Vector3(0, 1, 0);
  function geralView() {
    const pts = []; P.forEach((p) => { pts.push(p.g.position, p.top); });
    const box = new THREE.Box3().setFromPoints(pts), ctr = box.getCenter(new THREE.Vector3()); ctr.y = 0.5;
    const port = camera.aspect < 1; // tela em pé: olha ao longo da costa, de Porto Belo para Itapema
    const dir = (port ? new THREE.Vector3(0.42, 0.24, 0.9) : new THREE.Vector3(0.94, 0.21, -0.34)).normalize(), cam = camera.clone(), pv = new THREE.Vector3();
    const tg = new THREE.Vector3();
    let d = 30;
    for (let i = 0; i < 80; i++) {
      tg.copy(ctr);
      cam.position.copy(dir).multiplyScalar(d).add(ctr); cam.lookAt(tg); cam.updateMatrixWorld();
      if (pts.every((pt) => { pv.copy(pt).project(cam); return Math.abs(pv.x) < 0.84 && pv.y < (port ? 0.5 : 0.42) && pv.y > -0.84; })) break;
      d *= 1.04;
    }
    controls.maxDistance = d * 1.35;
    tg.copy(ctr);
    return { tgt: tg, off: dir.multiplyScalar(d).add(ctr).sub(tg) };
  }
  // zoom suave: cada giro da roda, pinça ou botão soma um pouco e a câmera desliza até lá
  let zq = 0; const za = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), zPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25), zPt = new THREE.Vector3(), busy = { until: 0 };
  function zoomBy(amt, cx, cy) {
    sway = false; fly = null; ride = null; hideCard(); busy.until = performance.now() + 1500;
    if (cx == null) za.copy(controls.target);
    else {
      const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (touch) { const pt = ray.ray.intersectPlane(zPlane, zPt); za.copy(pt || controls.target); }
      else { const hit = ray.intersectObjects([land, water], false)[0]; za.copy(hit ? hit.point : controls.target); }
    }
    zq = Math.max(-2.5, Math.min(2.5, zq + amt));
  }
  function stepZoom() {
    if (Math.abs(zq) < 1e-4) { zq = 0; return; }
    const s = zq * 0.16; zq -= s;
    const d = camera.position.distanceTo(controls.target), nd = Math.min(controls.maxDistance, Math.max(controls.minDistance, d * Math.exp(s))), f = nd / d;
    if (Math.abs(f - 1) < 1e-6) { zq = 0; return; }
    camera.position.sub(za).multiplyScalar(f).add(za); controls.target.sub(za).multiplyScalar(f).add(za);
    // segura a mira dentro do mapa, movendo a câmera junto (sem pulo)
    const tt = controls.target, cx2 = Math.max(-WU / 2, Math.min(WU / 2, tt.x)) - tt.x, cy2 = Math.max(0, Math.min(40, tt.y)) - tt.y, cz2 = Math.max(-HU / 2, Math.min(HU / 2, tt.z)) - tt.z;
    if (cx2 || cy2 || cz2) { tt.x += cx2; tt.y += cy2; tt.z += cz2; camera.position.x += cx2; camera.position.y += cy2; camera.position.z += cz2; }
  }
  function showCard(k, n, d) { const mb = card.querySelector('.zp-more'); if (mb) mb.style.display = cur ? '' : 'none'; card.querySelector('small').textContent = k; card.querySelector('strong').textContent = n; card.querySelector('p').textContent = d; card.classList.add('show'); clearTimeout(cardT); cardT = setTimeout(hideCard, 8000); }
  function go(id) {
    let tgt, off; ride = null;
    if (id === 'orla') {
      if (!orlaPath) return;
      // passeio: a câmera vem do mar e corre a orla de Meia Praia olhando para os prédios
      const L = orlaPath.cam.getLength(); sway = false; cur = null; zq = 0; fly = null;
      ride = { t0: performance.now() + 1600, d: Math.max(18000, L / 1.6 * 1000) };
      const p0 = orlaPath.cam.getPointAt(0), q0 = orlaPath.tg.getPointAt(0);
      fly = { t0: performance.now(), d: 1600, p0: camera.position.clone(), q0: controls.target.clone(), p1: new THREE.Vector3(p0.x + (p0.x - q0.x) * (camera.aspect < 1 ? 0.9 : 0), 1.0 + (camera.aspect < 1 ? 0.45 : 0), p0.z + (p0.z - q0.z) * (camera.aspect < 1 ? 0.9 : 0)), q1: new THREE.Vector3(q0.x, 0.45, q0.z) };
      showCard(ZL.orla[0], ZL.orla[1], ZL.orla[2]);
      try { gtag('event', 'maquete_zah', { ponto: id }); } catch (_) {}
    } else if (id === 'geral') { const gv = geralView(); tgt = gv.tgt; off = gv.off; hideCard(); cur = null; sway = true; swayBase = null; }
    else {
      const p = P.find((x) => x.id === id); if (!p) return; cur = p;
      tgt = p.g.position.clone().add(new THREE.Vector3(0, 0.6, 0)); off = new THREE.Vector3(4.6, 2.6, 2.4); sway = false;
      showCard(p.sub ? ZL.tenet : ZL.st[p.st], p.nome, p.aprox ? ZL.aprox : ZL.ver);
      risers.find((r) => r.g === p.g).t0 = performance.now() + 450;
      try { gtag('event', 'maquete_zah', { ponto: id }); } catch (_) {}
    }
    if (tgt) { zq = 0; fly = { t0: performance.now(), d: 1800, p0: camera.position.clone(), q0: controls.target.clone(), p1: tgt.clone().add(off), q1: tgt }; }
    stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-k') === id));
  }
  stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.addEventListener('click', () => go(b.getAttribute('data-k'))));
  const more = card.querySelector('.zp-more'); if (more) more.addEventListener('click', (e) => { e.stopPropagation(); if (cur && opts.open) opts.open(cur.id); });
  const cx = card.querySelector('.vp-3d-cx'); if (cx) cx.addEventListener('click', (e) => { e.stopPropagation(); hideCard(); });
  const live = stage.querySelector('.vp-3d-live');
  if (live) live.addEventListener('click', () => { const on = !stage.classList.contains('live'); stage.classList.toggle('live', on); controls.enabled = on || !touch; live.textContent = on ? 'Voltar à rolagem' : 'Toque para explorar'; });
  controls.addEventListener('start', () => { fly = null; ride = null; sway = false; hideCard(); busy.until = performance.now() + 1e9; });
  controls.addEventListener('end', () => { busy.until = performance.now() + 1800; });
  let downAt = null, wheelOk = false;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; wheelOk = true; busy.until = Math.max(busy.until, performance.now() + 1500); });
  canvas.addEventListener('pointerup', (e) => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 8) { hideCard(); ride = null; } downAt = null; });
  stage.addEventListener('mouseleave', () => { wheelOk = false; });

  // botões de zoom (bom no notebook com touch e no celular)
  const zb = document.createElement('div'); zb.className = 'zp-zoom';
  zb.innerHTML = '<button type="button" data-z="in" aria-label="' + ZL.zin + '">+</button><button type="button" data-z="out" aria-label="' + ZL.zout + '">−</button><button type="button" data-z="poi" class="on" aria-label="' + ZL.poi + '" title="' + ZL.poi + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.500s6-5.200 6-9.800a6 6 0 0 0-12 0c0 4.600 6 9.800 6 9.800z"/><circle cx="12" cy="10.600" r="2.100"/></svg></button><button type="button" data-z="all" aria-label="' + ZL.zall + '" title="' + ZL.zall + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>';
  zb.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = b.getAttribute('data-z'); if (k === 'poi') { poiOn = !poiOn; b.classList.toggle('on', poiOn); } else if (k === 'all') go('geral'); else zoomBy(k === 'in' ? -0.55 : 0.55); });
  stage.appendChild(zb);
  const hint = document.createElement('div'); hint.className = 'zp-hint'; hint.textContent = ZL.hint; stage.appendChild(hint); let hintT = 0;
  if (!document.getElementById('zpZoomCss')) { const st = document.createElement('style'); st.id = 'zpZoomCss'; st.textContent = '.zp-zoom{position:absolute;right:16px;top:16px;z-index:3;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;border:1px solid rgba(226,199,126,.5);background:rgba(6,24,32,.86);backdrop-filter:blur(8px)}.zp-zoom button{width:46px;height:46px;display:grid;place-items:center;border:0;background:none;color:#f1e3bd;font:300 26px/1 "DM Sans",sans-serif;cursor:pointer;transition:background .2s}.zp-zoom button+button{border-top:1px solid rgba(226,199,126,.22)}.zp-zoom button:hover{background:rgba(226,199,126,.14)}.zp-zoom button:active{background:rgba(226,199,126,.26)}.zp-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;padding:12px 18px;border-radius:100px;background:rgba(6,24,32,.88);border:1px solid rgba(226,199,126,.4);color:#f1e3bd;font:500 13px "DM Sans",sans-serif;opacity:0;pointer-events:none;transition:opacity .3s;white-space:nowrap}.zp-hint.on{opacity:1}@media (max-width:640px){.zp-zoom{right:12px;top:34%}.zp-zoom button{width:42px;height:42px}}'; document.head.appendChild(st); }

  // roda do mouse: dentro da maquete aproxima/afasta; antes de clicar nela, a página continua rolando (pinça do touchpad sempre aproxima)
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !wheelOk && !stage.classList.contains('fs')) { hint.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => hint.classList.remove('on'), 1400); return; }
    e.preventDefault(); const k = e.deltaMode === 1 ? 0.04 : e.deltaMode === 2 ? 0.8 : 0.0016;
    zoomBy(Math.max(-0.6, Math.min(0.6, e.deltaY * k * (e.ctrlKey ? 3 : 1))), e.clientX, e.clientY);
  }, { passive: false });
  // pinça com dois dedos (tela touch)
  const tp = new Map(); let pinch0 = 0;
  const spread = () => { const a = [...tp.values()]; return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); };
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; tp.set(e.pointerId, [e.clientX, e.clientY]); pinch0 = tp.size === 2 ? spread() : 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (!tp.has(e.pointerId)) return; tp.set(e.pointerId, [e.clientX, e.clientY]);
    if (tp.size === 2 && pinch0 && controls.enabled) { const s = spread(), a = [...tp.values()]; if (s > 0) { zoomBy(Math.log(pinch0 / s), (a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2); pinch0 = s; } }
  });
  const tpEnd = (e) => { tp.delete(e.pointerId); pinch0 = 0; };
  canvas.addEventListener('pointerup', tpEnd); canvas.addEventListener('pointercancel', tpEnd);

  // tela cheia (funciona em qualquer celular: a maquete ocupa a tela toda e gira com o dedo)
  const fsb = stage.querySelector('.vp-3d-fs');
  if (fsb) fsb.addEventListener('click', () => {
    const on = !stage.classList.contains('fs'); stage.classList.toggle('fs', on); document.documentElement.style.overflow = on ? 'hidden' : '';
    fsb.textContent = on ? '× Sair' : '⤢ Tela cheia'; controls.enabled = on || !touch || stage.classList.contains('live'); setTimeout(resize, 60);
    try { gtag('event', 'maquete_tela_cheia', { on: on ? 1 : 0 }); } catch (_) {}
  });
  let lastAsp = 0;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    // tela cheia ou celular virado: refaz o enquadramento da visão geral
    if (lastAsp && Math.abs(camera.aspect - lastAsp) > 0.15 && cur == null && !ride && stage.classList.contains('gl')) go('geral');
    lastAsp = camera.aspect;
  }
  new ResizeObserver(resize).observe(stage); resize();
  { const gv = geralView(); controls.target.copy(gv.tgt); camera.position.copy(gv.tgt).add(gv.off.clone().multiplyScalar(1.7)); }
  go('geral'); risers.forEach((r, i) => { r.t0 = performance.now() + 900 + i * 260; });
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); } catch (_) {}
  try { renderer.render(scene, camera); } catch (_) {}
  stage.classList.add('gl', 'ready');

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const fwd = new THREE.Vector3(), sh = new THREE.Vector2(), v = new THREE.Vector3(), clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  let lastR = 0;
  function frame() {
    if (touch) { const nw = performance.now(); if (!fly && !ride && Math.abs(zq) < 1e-4 && nw > busy.until && nw - lastR < 30) return; lastR = nw; }
    const dtv = Math.min(clock.getDelta(), 0.05); waterMat.uniforms.t.value += dtv; if (vidaTick) vidaTick(dtv);
    const now = performance.now();
    risers.forEach((r) => { const k = r.t0 == null ? 0 : Math.max(0, Math.min(1, (now - r.t0) / 1600)); const e = 1 - Math.pow(1 - k, 3); r.g.children.forEach((ch) => { if (ch !== r.g.userData.ring && ch !== r.g.userData.beam) ch.scale.y = Math.max(0.001, e); }); r.g.userData.beam.visible = e > 0.95; r.g.userData.ring.material.opacity = 0.5 + 0.4 * Math.sin(now / 500); });
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) fly = null; }
    else if (ride && orlaPath) { // passeio pela orla
      const k = Math.max(0, Math.min(1, (now - ride.t0) / ride.d)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const pc = orlaPath.cam.getPointAt(e), pt = orlaPath.tg.getPointAt(Math.min(1, e + 0.02));
      const far = camera.aspect < 1 ? 0.9 : 0; camera.position.set(pc.x + (pc.x - pt.x) * far, 1.0 + far * 0.5, pc.z + (pc.z - pt.z) * far); controls.target.set(pt.x, 0.45, pt.z);
      if (k >= 1) ride = null;
    }
    else if (sway) { // visão geral "respirando": balança devagar, sem sair do enquadramento
      if (!swayBase) { swayBase = camera.position.clone().sub(controls.target); swayT0 = now; }
      camera.position.copy(swayBase).applyAxisAngle(UP, 0.1 * Math.sin((now - swayT0) / 4200)).add(controls.target);
    }
    stepZoom();
    controls.update();
    const cd = camera.position.distanceTo(controls.target);
    scene.fog.near = waterMat.uniforms.fN.value = cd + 35; scene.fog.far = waterMat.uniforms.fF.value = cd + 150;
    // perto: plano de recorte mais próximo e sombra mais nítida em volta do que se vê
    const nn = Math.max(0.03, Math.min(0.5, cd * 0.012)); if (Math.abs(camera.near - nn) > 0.005) { camera.near = nn; camera.updateProjectionMatrix(); }
    shadowFit(controls.target, Math.max(6, Math.min(70, cd * 1.3)));
    sky.position.copy(camera.position); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); sh.set(sunDir.x, sunDir.z).normalize(); scene.fog.color.copy(SKY.hc).lerp(SKY.hw, Math.pow(Math.max(fwd.x * sh.x + fwd.z * sh.y, 0), 2.5));
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    pins.forEach((p) => { v.copy(p.v).project(camera); let on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; if (p.poi) { const d = camera.position.distanceTo(p.v); on = on && poiOn && d < (p.poi.t === 1 ? 30 : 12); p.el.classList.toggle('lab', d < (p.poi.t === 1 ? 8 : 5)); } p.el.style.opacity = on ? '1' : '0'; p.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)'; });
  }
  stage._frame = frame;
  (function loop() { requestAnimationFrame(loop); if (visible) frame(); })();
}
