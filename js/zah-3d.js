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
const ZT = { pt: { st: { pronto: 'Pronto para morar', obra: 'Em obras', lanc: 'Lançamento' }, tenet: 'Fase 1 em obras · Fase 2 em lançamento', aprox: 'Frente mar em Porto Belo (posição aproximada).', ver: 'Toque em "Ver detalhes" para a ficha completa e a tabela.', zin: 'Aproximar', zout: 'Afastar', zall: 'Ver tudo', hint: 'Use + e − ou Ctrl + rolagem para aproximar', orla: ['Passeio', 'Orla de Meia Praia', 'Sobrevoando a beira-mar de Meia Praia, em Itapema, com os prédios de frente para o mar. Toque na maquete para parar.'] },
  en: { st: { pronto: 'Move-in ready', obra: 'Under construction', lanc: 'New launch' }, tenet: 'Phase 1 under construction · Phase 2 new launch', aprox: 'Beachfront in Porto Belo (approximate position).', ver: 'Tap "View details" for the full specs and prices.', zin: 'Zoom in', zout: 'Zoom out', zall: 'See all', hint: 'Use + and − or Ctrl + scroll to zoom', orla: ['Ride', 'Meia Praia beachfront', 'Flying along the Meia Praia seafront in Itapema, with the buildings facing the sea. Tap the model to stop.'] },
  es: { st: { pronto: 'Listo para vivir', obra: 'En construcción', lanc: 'Lanzamiento' }, tenet: 'Etapa 1 en obra · Etapa 2 en lanzamiento', aprox: 'Frente al mar en Porto Belo (posición aproximada).', ver: 'Toque "Ver detalles" para la ficha completa y la lista.', zin: 'Acercar', zout: 'Alejar', zall: 'Ver todo', hint: 'Use + y − o Ctrl + rueda para acercar', orla: ['Paseo', 'Costanera de Meia Praia', 'Sobrevolando la costanera de Meia Praia, en Itapema, con los edificios frente al mar. Toque la maqueta para parar.'] } };
const ZL = ZT[(document.documentElement.lang || 'pt').slice(0, 2)] || ZT.pt;
const PLACES = [['Itapema', -27.093, -48.616], ['Meia Praia', -27.124, -48.604], ['Porto Belo', -27.161, -48.556], ['BR-101', -27.118, -48.628], ['Balneário Camboriú ↑', -27.056, -48.606]];

export async function init(stage, opts = {}) {
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.vp-3d-pins'), card = stage.querySelector('.vp-3d-card');
  const touch = window.matchMedia('(pointer: coarse)').matches, big = !touch && Math.min(screen.width, screen.height) >= 700;
  const tUrl = stage.getAttribute('data-terrain'), root = tUrl.replace(/js\/zah-terreno\.json.*$/, '');
  const [data, city] = await Promise.all([fetch(tUrl).then((r) => r.json()), fetch(root + 'js/zah-cidade.json?v=5').then((r) => r.json()).catch(() => null)]);
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
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const GX = big ? 241 : 151, GY = Math.round(GX * HU / WU);
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
      ' float nz = vn(q*9.0 + vec2(t*0.15, -t*0.1)) * 0.6 + vn(q*23.0 - vec2(t*0.2, t*0.12)) * 0.4; c *= 0.94 + 0.1 * nz; ' +
      ' vec3 n = normalize(vec3(sin(q.x*1.7 + q.y*0.9 + t*1.3) * 0.035 + sin(q.x*4.3 - q.y*2.9 - t*1.7) * 0.025 + sin(q.y*7.1 + q.x*3.7 + t*2.1) * 0.015 + (nz - 0.5) * 0.05, 1.0, sin(q.y*1.9 - q.x*1.1 + t*1.1) * 0.035 + sin(q.y*5.3 + q.x*2.3 - t*1.9) * 0.025 + sin(q.x*6.7 - q.y*4.1 + t*2.4) * 0.015 + (nz - 0.5) * 0.05)); ' +
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
    city.b.forEach((b, bi) => {
      const fl = b[0], n = (b.length - 1) / 2; if (n < 3) return;
      const xs = [], zs = []; for (let i = 0; i < n; i++) { xs.push(b[1 + i * 2] / 100 + ox); zs.push(b[2 + i * 2] / 100 + oz); }
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
  let zq = 0; const za = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function zoomBy(amt, cx, cy) {
    sway = false; fly = null; ride = null; hideCard();
    if (cx == null) za.copy(controls.target);
    else {
      const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
      ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects([land, water], false)[0];
      za.copy(hit ? hit.point : controls.target);
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
  controls.addEventListener('start', () => { fly = null; ride = null; sway = false; hideCard(); });
  let downAt = null, wheelOk = false;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; wheelOk = true; });
  canvas.addEventListener('pointerup', (e) => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 8) { hideCard(); ride = null; } downAt = null; });
  stage.addEventListener('mouseleave', () => { wheelOk = false; });

  // botões de zoom (bom no notebook com touch e no celular)
  const zb = document.createElement('div'); zb.className = 'zp-zoom';
  zb.innerHTML = '<button type="button" data-z="in" aria-label="' + ZL.zin + '">+</button><button type="button" data-z="out" aria-label="' + ZL.zout + '">−</button><button type="button" data-z="all" aria-label="' + ZL.zall + '" title="' + ZL.zall + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>';
  zb.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = b.getAttribute('data-z'); if (k === 'all') go('geral'); else zoomBy(k === 'in' ? -0.55 : 0.55); });
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
  stage.classList.add('gl', 'ready');

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const fwd = new THREE.Vector3(), sh = new THREE.Vector2(), v = new THREE.Vector3(), clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  function frame() {
    waterMat.uniforms.t.value += Math.min(clock.getDelta(), 0.05);
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
    pins.forEach((p) => { v.copy(p.v).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; p.el.style.opacity = on ? '1' : '0'; p.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)'; });
  }
  stage._frame = frame;
  (function loop() { requestAnimationFrame(loop); if (visible) frame(); })();
}
