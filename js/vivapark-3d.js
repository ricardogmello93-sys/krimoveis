// Maquete digital do Vivapark feita do zero: relevo real, morros e mar, ruas, lagos, córregos e matas do OpenStreetMap, prédios em 3D que sobem,
// passeio guiado por botões e giro livre (arrastar / pinça). Ilustrativa: posições e alturas aproximadas.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const IMG_W = 1860, IMG_H = 1202, S = 100; // 1 unidade = 100 px da planta
const P = (px, py, y = 0) => new THREE.Vector3((px - IMG_W / 2) / S, y, (py - IMG_H / 2) / S);

const STOPS = {
  geral: { t: [930, 640, 0], c: [0, 8.4, 12.8], k: 'Maquete digital', n: 'Vivapark visto de cima', d: 'Mais de 550 mil m² planejados por Jaime Lerner: casas, prédios, comércio, lagos e muito verde, sem muros.' },
  vertice: { t: [740, 530, 0.9], c: [0.9, 1.1, 4.2], k: 'Empreendimento', n: 'Vértice', d: 'Duas torres escalonadas, cheias de jardins, de frente para o lago e o boulevard, no centro do bairro.', rise: true },
  lago: { t: [720, 740, 0], c: [-1.6, 2.1, 3.4], k: 'Já pronto', n: 'Lago e boulevard', d: 'Restaurantes de frente para a água e o parque em volta: é onde o bairro se encontra no fim do dia.' },
  casas: { t: [1430, 620, 0], c: [3.2, 4.2, 4.6], k: 'Morar', n: 'Bairro de casas', d: 'Lotes para casas em ruas arborizadas, com fiação subterrânea e monitoramento 24 horas.' },
  mata: { t: [300, 330, 0], c: [-3.2, 3.6, 3.6], k: 'Natureza', n: 'Mata preservada', d: 'São 138 mil m² de áreas verdes no projeto, com parques de reserva ambiental em volta das casas e dos prédios.' },
  br: { t: [1800, 1050, 0], c: [-4.4, 5.2, 6.0], k: 'Localização', n: 'Acesso pela BR-101', d: 'A rodovia passa logo depois das ruas de casas e cruza a Av. Gov. Celso Ramos. Na entrada de Porto Belo, ao lado do Jardim Dourado; Itapema e Bombinhas ficam logo ali.' },
  av: { t: [600, 1010, 0], c: [-2.2, 2.6, 3.6], k: 'Localização', n: 'Av. Gov. Celso Ramos', d: 'A avenida que passa na frente do bairro e segue até a BR-101.' },
};
// textos em inglês e espanhol (a página define o idioma no <html lang>)
const I18N = {
  en: { geral: ['Digital model', 'Vivapark from above', 'Over 550,000 m² planned by Jaime Lerner: houses, buildings, shops, lakes and lots of green, without walls.'], vertice: ['Development', 'Vértice', 'Two terraced towers full of gardens, facing the lake and the boulevard, in the heart of the neighborhood.'], lago: ['Open today', 'Lake and boulevard', 'Restaurants facing the water and the park around: where the neighborhood meets at the end of the day.'], casas: ['Live here', 'Houses', 'Lots for houses on tree-lined streets, with underground wiring and 24-hour monitoring.'], mata: ['Nature', 'Preserved forest', '138,000 m² of green areas in the project, with nature reserve parks around the houses and buildings.'], br: ['Location', 'BR-101 access', 'The highway runs just past the streets of houses and crosses Av. Gov. Celso Ramos. At the entrance of Porto Belo, next to Jardim Dourado; Itapema and Bombinhas are right there.'], av: ['Location', 'Av. Gov. Celso Ramos', 'The avenue that runs along the front of the neighborhood and leads to the BR-101 highway.'] },
  es: { geral: ['Maqueta digital', 'Vivapark desde arriba', 'Más de 550 mil m² planificados por Jaime Lerner: casas, edificios, comercios, lagos y mucho verde, sin muros.'], vertice: ['Emprendimiento', 'Vértice', 'Dos torres escalonadas llenas de jardines, frente al lago y al boulevard, en el centro del barrio.'], lago: ['Ya listo', 'Lago y boulevard', 'Restaurantes frente al agua y el parque alrededor: el punto de encuentro del barrio al final del día.'], casas: ['Vivir', 'Casas', 'Lotes para casas en calles arboladas, con cableado subterráneo y monitoreo las 24 horas.'], mata: ['Naturaleza', 'Bosque preservado', '138 mil m² de áreas verdes en el proyecto, con parques de reserva ambiental alrededor.'], br: ['Ubicación', 'Acceso por la BR-101', 'La carretera pasa justo después de las calles de casas y cruza la Av. Gov. Celso Ramos. En la entrada de Porto Belo, junto al Jardim Dourado; Itapema y Bombinhas quedan al lado.'], av: ['Ubicación', 'Av. Gov. Celso Ramos', 'La avenida que pasa frente al barrio y sigue hasta la BR-101.'] },
};
const LG = (document.documentElement.lang || 'pt').slice(0, 2);
if (I18N[LG]) for (const [k, [a, b, c]] of Object.entries(I18N[LG])) Object.assign(STOPS[k], { k: a, n: b, d: c });
const ZT = { pt: { zin: 'Aproximar', zout: 'Afastar', zall: 'Ver tudo', hint: 'Use + e − ou Ctrl + rolagem para aproximar' }, en: { zin: 'Zoom in', zout: 'Zoom out', zall: 'See all', hint: 'Use + and − or Ctrl + scroll to zoom' }, es: { zin: 'Acercar', zout: 'Alejar', zall: 'Ver todo', hint: 'Use + y − o Ctrl + rueda para acercar' } };
const ZL = ZT[LG] || ZT.pt;
const PINS = [['vertice', 742, 500, 2.05], ['lago', 760, 790, 0.1], ['casas', 1430, 560, 0.1], ['mata', 260, 300, 0.1], ['av', 520, 993, 0.06], ['br', 1935, 1215, 0.06]];

export function init(stage) {
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.vp-3d-pins'), card = stage.querySelector('.vp-3d-card');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // fundo: céu de pôr do sol numa esfera fixa em volta da maquete; o sol fica parado no lugar quando a câmera gira
  const sunDir = new THREE.Vector3(-0.44, -0.315, -0.83).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(45, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { sunDir: { value: sunDir }, zen: { value: new THREE.Color(0x174a70) }, mid: { value: new THREE.Color(0x6f9fba) }, deep: { value: new THREE.Color(0x123b55) }, hc: { value: new THREE.Color(0xe4c6a2) }, hw: { value: new THREE.Color(0xf2b06c) }, glow: { value: new THREE.Color(0xff9e4a) }, core: { value: new THREE.Color(0xffe8b0) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 sunDir, zen, mid, deep, hc, hw, glow, core; varying vec3 vD; void main(){ vec3 d = normalize(vD); vec2 a = normalize(d.xz + 1e-5), s = normalize(sunDir.xz); vec3 c = mix(hc, hw, pow(max(dot(a, s), 0.0), 2.0)); float u = d.y - sunDir.y; c = u > 0.0 ? mix(mix(c, mid, smoothstep(0.0, 0.25, u)), zen, smoothstep(0.25, 0.75, u)) : mix(mix(c, mid, smoothstep(0.0, 0.16, -u)), deep, smoothstep(0.16, 0.55, -u)); float sd = max(dot(d, sunDir), 0.0); c += glow * (pow(sd, 8.0) * 0.25 + pow(sd, 80.0) * 0.45 + pow(sd, 900.0) * 0.7); c = mix(c, core * 1.35, smoothstep(0.99935, 0.99952, sd)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 14, 16);

  scene.add(new THREE.HemisphereLight(0xe6f4ff, 0x1d3a3a, 1.15));
  const sun = new THREE.DirectionalLight(0xffe4bd, 2.3);
  sun.position.set(-7, 11, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0008; scene.add(sun);

  // chão feito do zero (sem a planta da construtora): relevo real (SRTM), morros e mar em volta, ruas, lagos, córregos,
  // matas e construções do OpenStreetMap. Dados em js/vivapark-mapa.json (C:/kr-cut/viva/maquete-dados.mjs).
  scene.fog = new THREE.Fog(0xcbb79b, 26, 120);
  camera.far = 400; camera.updateProjectionMatrix();
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float t; varying vec3 vW; void main(){ vec2 p = vW.xz * 4.0; float w = sin(p.x*1.7 + t*0.9) * sin(p.y*2.3 - t*0.7) + sin((p.x+p.y)*1.3 + t*1.2)*0.6; float s = smoothstep(0.75, 1.45, w); vec3 c = mix(vec3(0.09,0.33,0.38), vec3(0.17,0.50,0.55), 0.5 + 0.3*sin(p.x*0.35 + p.y*0.2 + t*0.25)); c += s * vec3(0.75,0.72,0.6) * 0.35; gl_FragColor = vec4(c, 0.94); }'
  });
  const seaMat = new THREE.ShaderMaterial({
    uniforms: { t: waterMat.uniforms.t },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float t; varying vec3 vW; void main(){ vec2 p = vW.xz * 0.9; float w = sin(p.x*1.1 + t*0.6) * sin(p.y*1.5 - t*0.45) + sin((p.x-p.y)*0.8 + t*0.8)*0.5; vec3 c = mix(vec3(0.05,0.24,0.33), vec3(0.10,0.38,0.45), 0.5 + 0.25*w); c += smoothstep(1.0, 1.45, w) * vec3(0.9,0.75,0.55) * 0.25; gl_FragColor = vec4(c, 1.0); }'
  });
  let ground = null, tick = null;
  const loadGround = fetch(stage.getAttribute('data-mapa')).then((r) => r.json()).then((M) => {
    const HU = 1 / (M.mpx * 100), VE = 1.6; let H0 = 0; // metros -> unidades; relevo exagerado 1,6x; o Vivapark fica na cota 0
    const yOf = (h) => (h <= 0 ? -0.32 : (h - H0) * VE * HU);
    const sampler = (G) => (x, z) => { const fx = (x - G.x0) / (G.x1 - G.x0) * (G.nx - 1), fz = (z - G.z0) / (G.z1 - G.z0) * (G.ny - 1); if (fx < 0 || fz < 0 || fx > G.nx - 1 || fz > G.ny - 1) return null; const i = Math.min(G.nx - 2, Math.floor(fx)), j = Math.min(G.ny - 2, Math.floor(fz)), u = fx - i, v = fz - j, h = (a, b) => G.h[b * G.nx + a]; return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v; };
    const hIn = sampler(M.grid), hFar = sampler(M.far);
    { const v = P(740, 560); H0 = hIn(v.x, v.z) ?? 4; }
    const tri = (G, drop) => (x, z) => { const fx = (x - G.x0) / (G.x1 - G.x0) * (G.nx - 1), fz = (z - G.z0) / (G.z1 - G.z0) * (G.ny - 1); if (fx < 0 || fz < 0 || fx > G.nx - 1 || fz > G.ny - 1) return null; const i = Math.min(G.nx - 2, Math.floor(fx)), j = Math.min(G.ny - 2, Math.floor(fz)), u = fx - i, v = fz - j, Y = (a, b) => yOf(G.h[b * G.nx + a]) - drop; const ya = Y(i, j), yb = Y(i + 1, j), yd = Y(i, j + 1), ye = Y(i + 1, j + 1); return u + v <= 1 ? ya + u * (yb - ya) + v * (yd - ya) : ye + (1 - u) * (yd - ye) + (1 - v) * (yb - ye); };
    const yIn = tri(M.grid, 0), yFar = tri(M.far, 0.04);
    const yAt = (x, z) => yIn(x, z) ?? yFar(x, z) ?? 0;
    // terreno: grade com cores pelo relevo (várzea verde-clara, morros de mata, areia junto ao mar)
    const cLow = new THREE.Color(0x6f8a52), cField = new THREE.Color(0x87995e), cHill = new THREE.Color(0x3b5a34), cTop = new THREE.Color(0x56664a), cSand = new THREE.Color(0xd8c79e), cDeep = new THREE.Color(0x0b2c38);
    function terrain(G, drop, near) {
      const pos = [], col = [], idx = [], c = new THREE.Color();
      for (let j = 0; j < G.ny; j++) for (let i = 0; i < G.nx; i++) {
        const x = G.x0 + (G.x1 - G.x0) * i / (G.nx - 1), z = G.z0 + (G.z1 - G.z0) * j / (G.ny - 1), h = G.h[j * G.nx + i];
        pos.push(x, yOf(h) - drop, z);
        const nz = (Math.sin(i * 1.7 + j * 0.9) + Math.sin(i * 0.6 - j * 1.3)) * 0.12 + 0.3; if (h <= 0) c.copy(cDeep); else if (!near && h <= 2) c.copy(cSand); else if (h < 25) c.copy(cLow).lerp(cField, nz); else if (h < 260) c.copy(cLow).lerp(cHill, Math.min(1, (h - 25) / 120)); else c.copy(cHill).lerp(cTop, Math.min(1, (h - 260) / 300));
        col.push(c.r, c.g, c.b);
      }
      for (let j = 0; j < G.ny - 1; j++) for (let i = 0; i < G.nx - 1; i++) { const a = j * G.nx + i, b = a + 1, d = a + G.nx, e = d + 1; idx.push(a, d, b, b, d, e); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: !near })); m.receiveShadow = true; scene.add(m); return m;
    }
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.2; scene.add(sea);
    terrain(M.far, 0.04, false);
    ground = terrain(M.grid, 0, true);
    // faixas (ruas, BR, córregos) acompanhando o relevo
    function ribbon(pts, w, mat, lift) {
      const pos = [], idx = []; let n = 0;
      for (let k = 1; k < pts.length; k++) {
        const [x1, z1] = pts[k - 1], [x2, z2] = pts[k], dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz); if (L < 1e-4) continue;
        const nx = -dz / L * w / 2, nz = dx / L * w / 2, y1 = yAt(x1, z1) + lift, y2 = yAt(x2, z2) + lift;
        pos.push(x1 + nx, y1, z1 + nz, x1 - nx, y1, z1 - nz, x2 + nx, y2, z2 + nz, x2 - nx, y2, z2 - nz); idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4;
        if (k < pts.length - 1) { const disc = 6; for (let q = 0; q < disc; q++) { const a1 = q / disc * Math.PI * 2, a2 = (q + 1) / disc * Math.PI * 2; pos.push(x2, y2, z2, x2 + Math.cos(a1) * w / 2, y2, z2 + Math.sin(a1) * w / 2, x2 + Math.cos(a2) * w / 2, y2, z2 + Math.sin(a2) * w / 2); idx.push(n, n + 1, n + 2); n += 3; } }
      }
      if (!n) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m);
    }
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
    const brMat = new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
    const brLine = new THREE.MeshBasicMaterial({ color: 0xf2e6c8, polygonOffset: true, polygonOffsetFactor: -3, side: THREE.DoubleSide });
    const obraMat = new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 1, transparent: true, opacity: 0.7, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
    const streamMat = new THREE.MeshStandardMaterial({ color: 0x3f8fae, roughness: 0.4, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
    M.streams.forEach((r) => ribbon(r.p, r.w, streamMat, 0.01));
    M.roads.forEach((r) => { if (r.t === 'br') { ribbon(r.p, r.w * 0.75, brMat, 0.014); ribbon(r.p, 0.012, brLine, 0.018); } else ribbon(r.p, Math.max(r.w * 0.62, 0.04), r.t === 'obra' ? obraMat : roadMat, 0.012); });
    // polígonos no chão (lagos, gramados, matas, lotes em obra)
    const flat = (pts, mat, lift, level) => { if (pts.length < 3) return null; const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; let lv = -1e9; if (level) for (let k = 0; k < pa.count; k++) lv = Math.max(lv, yAt(pa.getX(k), pa.getZ(k))); for (let k = 0; k < pa.count; k++) pa.setY(k, (level ? lv : yAt(pa.getX(k), pa.getZ(k))) + lift); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m; };
    const grass = new THREE.MeshStandardMaterial({ color: 0x7fa05a, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, side: THREE.DoubleSide });
    const woodGround = new THREE.MeshStandardMaterial({ color: 0x3f6534, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, side: THREE.DoubleSide });
    const lotMat = new THREE.MeshStandardMaterial({ color: 0xb9a37a, roughness: 1, transparent: true, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, side: THREE.DoubleSide });
    M.lots.forEach((l) => flat(l.p, lotMat, 0.008));
    M.green.forEach((g) => flat(g.p, g.k === 'mata' ? woodGround : grass, 0.009));
    M.water.forEach((p) => flat(p, waterMat, 0.03, true));
    // os dois lagos do Vivapark (o do Vértice e o do boulevard) ainda não estão no mapa aberto: desenhados por nós
    [[603, 762, 74, 48], [838, 792, 96, 64]].forEach(([x, y, rx, ry]) => { const pts = []; for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, wob = 1 + 0.08 * Math.sin(a * 3 + x); const q = P(x + Math.cos(a) * rx * wob, y + Math.sin(a) * ry * wob); pts.push([q.x, q.z]); } flat(pts, waterMat, 0.03, true); });
    // construções existentes (contorno real, altura pelos andares)
    const bMat = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.7 });
    M.build.forEach((b) => { if (b.p.length < 3) return; const sh = new THREE.Shape(b.p.map(([x, z]) => new THREE.Vector2(x, -z))); const h = Math.max(0.05, b.lv * 0.075); const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); let cx = 0, cz = 0; b.p.forEach(([x, z]) => { cx += x; cz += z; }); const m = new THREE.Mesh(g, bMat); m.position.y = yAt(cx / b.p.length, cz / b.p.length); m.castShadow = true; m.receiveShadow = true; scene.add(m); });
    // árvores: matas do mapa e os morros em volta
    const inPoly = (x, z, P) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) o = !o; } return o; };
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const T = [];
    // mapa de ocupação (ruas, lagos e prédios) para as árvores não invadirem nada
    const OC = 0.12, occ = new Set(), ok = (x, z) => !occ.has(Math.round(x / OC) + ':' + Math.round(z / OC));
    const mark = (x, z, r) => { for (let a = -r; a <= r; a += OC) for (let b = -r; b <= r; b += OC) occ.add(Math.round((x + a) / OC) + ':' + Math.round((z + b) / OC)); };
    M.roads.forEach((r) => { const hw = (r.t === 'br' ? r.w * 0.75 : Math.max(r.w * 0.62, 0.04)) / 2 + 0.05; for (let k = 1; k < r.p.length; k++) { const [x1, z1] = r.p[k - 1], [x2, z2] = r.p[k], L = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(L / 0.08); for (let q = 0; q <= n; q++) mark(x1 + (x2 - x1) * q / n, z1 + (z2 - z1) * q / n, hw); } });
    [[603, 762, 80, 54], [838, 792, 102, 70]].forEach(([x, y, rx, ry]) => { for (let a = -rx; a <= rx; a += 10) for (let b = -ry; b <= ry; b += 10) if ((a * a) / (rx * rx) + (b * b) / (ry * ry) <= 1) { const q = P(x + a, y + b); mark(q.x, q.z, 0.06); } });
    M.water.forEach((p) => { const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]); for (let x = Math.min(...xs); x <= Math.max(...xs); x += OC) for (let z = Math.min(...zs); z <= Math.max(...zs); z += OC) if (inPoly(x, z, p)) mark(x, z, 0.05); });
    { const v0 = P(545, 440), v1 = P(930, 640); mark((v0.x + v1.x) / 2, (v0.z + v1.z) / 2, 2.1); }
    EMPS.forEach(([, , x, y]) => { const q = P(x, y); mark(q.x, q.z, 0.6); });
    // árvores nas calçadas das ruas do bairro e em volta
    M.roads.forEach((r) => { if (!/^(residential|living_street|tertiary|unclassified|secondary)$/.test(r.t)) return; const off = Math.max(r.w * 0.62, 0.04) / 2 + 0.07; for (let k = 1; k < r.p.length; k++) { const [x1, z1] = r.p[k - 1], [x2, z2] = r.p[k], L = Math.hypot(x2 - x1, z2 - z1); if (L < 0.2) continue; const ux = (x2 - x1) / L, uz = (z2 - z1) / L; for (let d = 0.16; d < L - 0.12; d += 0.3) for (const sd of [-1, 1]) { const x = x1 + ux * d - uz * off * sd, z = z1 + uz * d + ux * off * sd; if (Math.abs(x) > 16 || Math.abs(z) > 14 || !ok(x, z) || rnd() < 0.12) continue; T.push([x, z, 0.55 + rnd() * 0.3]); } } });
    // mata ciliar nos córregos
    M.streams.forEach((r) => { for (let k = 1; k < r.p.length; k++) { const [x1, z1] = r.p[k - 1], [x2, z2] = r.p[k], L = Math.hypot(x2 - x1, z2 - z1); for (let d = 0; d < L; d += 0.13) { const x = x1 + (x2 - x1) * d / L + (rnd() - 0.5) * 0.5, z = z1 + (z2 - z1) * d / L + (rnd() - 0.5) * 0.5; if (rnd() < 0.75 && ok(x, z) && yIn(x, z) != null) T.push([x, z, 0.75 + rnd() * 0.6]); } } });
    // grupos de árvores nos campos
    for (let k = 0; k < 14000 && T.length < 16000; k++) { const x = M.grid.x0 + rnd() * (M.grid.x1 - M.grid.x0), z = M.grid.z0 + rnd() * (M.grid.z1 - M.grid.z0); const n = Math.sin(x * 0.55 + 1.3) * Math.sin(z * 0.7 - 0.4) + Math.sin((x - z) * 0.31) * 0.6; if (n < 0.55 || !ok(x, z)) continue; T.push([x, z, 0.8 + rnd() * 0.7]); }
    M.green.forEach((g) => { const xs = g.p.map((p) => p[0]), zs = g.p.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs); const n = Math.min(900, Math.round((x1 - x0) * (z1 - z0) * (g.k === 'mata' ? 26 : 6))); for (let k = 0; k < n * 2 && T.length < 9000; k++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (inPoly(x, z, g.p)) T.push([x, z, 0.7 + rnd() * 0.6]); } });
    for (let k = 0; k < 7000; k++) { const x = M.far.x0 + rnd() * (M.far.x1 - M.far.x0), z = M.far.z0 + rnd() * (M.far.z1 - M.far.z0); const h = hFar(x, z); if (h == null || h < 22 || hIn(x, z) != null) continue; T.push([x, z, 1.4 + rnd() * 1.4]); }
    if (window.matchMedia('(pointer: coarse)').matches) { let a = 0; for (let b = 0; b < T.length; b += 2) T[a++] = T[b]; T.length = a; }
    const treeG = new THREE.IcosahedronGeometry(0.07, 0); treeG.translate(0, 0.07, 0);
    const treeM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
    const trees = new THREE.InstancedMesh(treeG, treeM, T.length), mtx = new THREE.Matrix4(), tc = new THREE.Color();
    T.forEach(([x, z, s], i) => { mtx.makeScale(s, s * (1.1 + rnd() * 0.5), s); mtx.setPosition(x, yAt(x, z) - 0.01, z); trees.setMatrixAt(i, mtx); tc.setHSL(0.25 + rnd() * 0.08, 0.32 + rnd() * 0.18, 0.24 + rnd() * 0.12); trees.setColorAt(i, tc); });
    trees.castShadow = !window.matchMedia('(pointer: coarse)').matches; trees.receiveShadow = true; scene.add(trees);
    // carros: andam pelas vias principais (BR-101, marginais, Av. Gov. Celso Ramos e ruas maiores)
    const routes = M.roads.filter((r) => /^(br|primary|secondary|tertiary)$/.test(r.t) && r.p.length > 1).map((r) => { const L = [0]; for (let k = 1; k < r.p.length; k++) L.push(L[k - 1] + Math.hypot(r.p[k][0] - r.p[k - 1][0], r.p[k][1] - r.p[k - 1][1])); return { p: r.p, L, len: L[L.length - 1], br: r.t === 'br', w: r.w }; }).filter((r) => r.len > 1.5);
    const NC = routes.length ? Math.min(window.matchMedia('(pointer: coarse)').matches ? 70 : 140, routes.length * 6) : 0;
    if (NC) {
      const carG = new THREE.BoxGeometry(0.075, 0.035, 0.035); carG.translate(0, 0.0175, 0);
      const cars = new THREE.InstancedMesh(carG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.3 }), NC);
      const pal = [0xf2f2f2, 0x1d1f22, 0x9aa3ab, 0xb3262b, 0x2d4f8a, 0xdcdcd5, 0x6b6f72];
      const C = []; for (let i = 0; i < NC; i++) { const r = routes[i % routes.length]; C.push({ r, d: rnd() * r.len, v: (r.br ? 0.55 : 0.28) * (0.8 + rnd() * 0.4) * (rnd() < 0.5 ? 1 : -1), side: rnd() < 0.5 ? 1 : -1 }); cars.setColorAt(i, new THREE.Color(pal[i % pal.length])); }
      cars.castShadow = false; scene.add(cars);
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), sc4 = new THREE.Vector3(1, 1, 1), p4 = new THREE.Vector3();
      tick = (dt) => { C.forEach((c, i) => { c.d += c.v * dt; if (c.d > c.r.len) c.d -= c.r.len; if (c.d < 0) c.d += c.r.len; const L = c.r.L; let k = 1; while (k < L.length - 1 && L[k] < c.d) k++; const [x1, z1] = c.r.p[k - 1], [x2, z2] = c.r.p[k], t = (c.d - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]), dx = x2 - x1, dz = z2 - z1, ln = Math.hypot(dx, dz) || 1, off = (c.r.br ? c.r.w * 0.2 : c.r.w * 0.15) * (c.v > 0 ? 1 : -1); const x = x1 + dx * t - dz / ln * off, z = z1 + dz * t + dx / ln * off; p4.set(x, yAt(x, z) + 0.016, z); e4.set(0, -Math.atan2(dz, dx) + (c.v < 0 ? Math.PI : 0), 0); q4.setFromEuler(e4); m4.compose(p4, q4, sc4); cars.setMatrixAt(i, m4); }); cars.instanceMatrix.needsUpdate = true; };
      tick(0);
    }
    stage.classList.add('ready');
  }).catch(() => stage.classList.add('nogl'));

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

  // os outros prédios do bairro, no lugar de cada um (mapa de lotes do Vivapark, posições aproximadas)
  // pronto = contorno aceso sobre o prédio que já está na planta; os demais "sobem" andar por andar, em holograma dourado;
  // perto da entrega (2027) ganham grua girando
  const EL = { pt: { pronto: 'Pronto para morar', lanc: 'Lançamento', ent: 'entrega', inc: 'Incorporação', aprox: 'Posição aproximada, conforme o mapa de lotes do bairro.', f2: 'Fase 2' },
    en: { pronto: 'Move-in ready', lanc: 'New launch', ent: 'delivery', inc: 'Developer:', aprox: 'Approximate position, based on the neighborhood lot map.', f2: 'Phase 2' },
    es: { pronto: 'Listo para vivir', lanc: 'Lanzamiento', ent: 'entrega', inc: 'Incorporación:', aprox: 'Posición aproximada, según el mapa de lotes del barrio.', f2: 'Fase 2' } }[LG] || null;
  const L2 = EL || { pronto: 'Pronto para morar', lanc: 'Lançamento', ent: 'entrega', inc: 'Incorporação', aprox: 'Posição aproximada, conforme o mapa de lotes do bairro.', f2: 'Fase 2' };
  const EMPS = [ // id, nome, x, y (px da planta), entrega (0 = pronto), incorporadora, andares (ilustrativo)
    ['vistajardins', 'Vista Jardins', 930, 990, 0, 'Torresani', 0],
    ['voz', 'Voz', 699, 252, 2027, 'Torresani', 14],
    ['ventura', 'Ventura', 619, 262, 2028, 'Famex', 16],
    ['vitta27', 'VITTA 27', 565, 391, 2031, 'Famex', 20],
    ['veleiros', 'Veleiros Residence', 818, 393, 2029, 'Eccel', 18],
    ['videiras', 'Videiras Residence', 1038, 364, 2028, 'Eccel', 30],
    ['veccel', 'Veccel Corporate', 411, 536, 2030, 'Eccel', 12],
    ['inc31', 'INC 31', 739, -60, 2033, 'ASRAMOS', 34],
    ['vision', 'Vision Home Club', -147, 489, 2030, 'Grupo N1', 23],
    ['verenna', 'Verenna', -525, 257, 2031, 'Conrado', 20],
    ['valence', 'Valence', -830, 590, 2031, 'RDO', 20],
  ];
  const holoMat = new THREE.MeshBasicMaterial({ color: 0xe2c77e, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
  const holoTop = new THREE.MeshBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xe8cf8a, transparent: true, opacity: 0.85 });
  const floorLine = new THREE.LineBasicMaterial({ color: 0xe8cf8a, transparent: true, opacity: 0.3 });
  const lineMatSoft = new THREE.LineBasicMaterial({ color: 0x6b6f6a, transparent: true, opacity: 0.35 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xd9d3c7, roughness: 0.8 });
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.5, metalness: 0.2 });
  const obras = [], cranes = [];
  function crane(g, h, side) {
    const c = new THREE.Group(); c.position.set(side * 0.62, 0, -0.1); g.add(c);
    const H = h + 0.55; const mast = box(0.045, H, 0.045, craneMat); c.add(mast);
    const top = new THREE.Group(); top.position.y = H; c.add(top);
    const jib = box(1.5, 0.035, 0.035, craneMat); jib.position.x = 0.55; jib.position.y = -0.0175; top.add(jib);
    const cj = box(0.45, 0.035, 0.035, craneMat); cj.position.x = -0.32; cj.position.y = -0.0175; top.add(cj);
    const cw = box(0.12, 0.08, 0.08, concrete); cw.position.set(-0.48, -0.06, 0); top.add(cw);
    const cab = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.9, 0, 0), new THREE.Vector3(0.9, -H * 0.55, 0)]), new THREE.LineBasicMaterial({ color: 0x333333 })); top.add(cab);
    cranes.push({ top, ph: Math.random() * 6 });
  }
  const empPins = [];
  EMPS.forEach(([id, nome, x, y, ano, inc, fl], idx) => {
    const g = new THREE.Group(); g.position.copy(P(x, y)); scene.add(g);
    STOPS[id] = { t: [x, y, ano ? 0.6 : 0.2], c: [1.8, 2.1, 2.7], k: ano ? L2.lanc + ' · ' + L2.ent + ' ' + ano : L2.pronto, n: nome, d: L2.inc + ' ' + inc + '. ' + L2.aprox };
    if (!ano) { // pronto: contorno aceso em volta do prédio da planta, alinhado com a BR
      const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3, 0.02, 0.9)), new THREE.LineBasicMaterial({ color: 0x5fd38a, transparent: true, opacity: 0.9 }));
      ring.rotation.y = -0.45; ring.position.y = 0.05; g.add(ring); obras.push({ ring });
      const vj = new THREE.Group(); vj.rotation.y = -0.45; g.add(vj);
      for (let i = 0; i < 8; i++) { const w = 2.1 - (i % 2) * 0.06, d = 0.7 - (i % 3) * 0.04; const f = box(w, 0.068, d, white); f.position.y = i * 0.075; vj.add(f); const pl = box(w * 0.96, 0.02, 0.06, green); pl.position.set(0, i * 0.075 + 0.068, d / 2 - 0.02); vj.add(pl); }
      empPins.push([id, nome, P(x, y, 0.85), 'ok']); return;
    }
    const W = 0.8, D = 0.52, fh = 0.075, H = fl * fh, floors = [];
    const sol = ano <= 2027; // perto da entrega: concreto; os demais, holograma
    for (let i = 0; i < fl; i++) {
      const f = new THREE.Group(); f.position.y = i * fh; f.userData.i = i;
      const slab = box(W, fh * 0.9, D, sol ? concrete : holoMat); f.add(slab);
      f.add(new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), sol ? lineMatSoft : floorLine));
      f.visible = false; g.add(f); floors.push(f);
    }
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D).translate(0, H / 2, 0)), edgeMat); shell.visible = false; g.add(shell);
    const scan = new THREE.Mesh(new THREE.BoxGeometry(W * 1.08, 0.012, D * 1.08), holoTop); g.add(scan);
    const foot = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.5, D * 1.6), new THREE.MeshBasicMaterial({ color: 0xe2c77e, transparent: true, opacity: 0.18, depthWrite: false })); foot.rotation.x = -Math.PI / 2; foot.position.y = 0.015; g.add(foot);
    if (sol) crane(g, H, idx % 2 ? 1 : -1);
    obras.push({ floors, shell, scan, H, fl, t0: null, delay: 600 + idx * 380 });
    empPins.push([id, nome, P(x, y, H + 0.25), x < 0 ? 'f2' : '']);
  });
  { const vg = new THREE.Group(); vg.position.copy(P(546, 610)); scene.add(vg); crane(vg, 1.9, 0); } // grua ao lado do Vértice (entrega 2027)
  // o que já funciona no bairro (posições do Google Maps, convertidas para a maquete)
  const LUG = { pt: { k: 'Já funciona', colegio: ['Colégio Bom Jesus', 'Desde fevereiro de 2025, da educação infantil ao ensino médio, com capacidade para mil alunos. Fica ao lado do Vértice.'], boulevard: ['Gastronomia do boulevard', 'Restaurantes e cafés de frente para o lago: o ponto de encontro do bairro no fim do dia.'], wave: ['Academia Wave', 'A academia do bairro, a poucos passos do lago e do boulevard.'], quadras: ['Quadras e MUV Arena', 'Tênis, padel, beach tennis e vôlei de praia, abertos desde a inauguração do bairro.'], psg: ['PSG Academy', 'A escola oficial do Paris Saint-Germain, inaugurada em agosto de 2026: um campo society oficial e um campo coberto, ao lado do Voz (posição aproximada).'] },
    en: { k: 'Open today', colegio: ['Colégio Bom Jesus school', 'Since February 2025, from early childhood to high school, for up to a thousand students. Right next to Vértice.'], boulevard: ['Boulevard dining', 'Restaurants and cafés facing the lake: where the neighborhood meets at the end of the day.'], wave: ['Wave gym', 'The neighborhood gym, a few steps from the lake and the boulevard.'], quadras: ['Courts and MUV Arena', 'Tennis, padel, beach tennis and beach volleyball, open since the neighborhood opened.'], psg: ['PSG Academy', 'Paris Saint-Germain’s official football school, opened in August 2026: an official-size society pitch and a covered pitch, next to Voz (approximate position).'] },
    es: { k: 'Ya funciona', colegio: ['Colegio Bom Jesus', 'Desde febrero de 2025, de la educación infantil a la secundaria, con capacidad para mil alumnos. Junto al Vértice.'], boulevard: ['Gastronomía del boulevard', 'Restaurantes y cafés frente al lago: el punto de encuentro del barrio al final del día.'], wave: ['Gimnasio Wave', 'El gimnasio del barrio, a pocos pasos del lago y del boulevard.'], quadras: ['Canchas y MUV Arena', 'Tenis, pádel, beach tennis y vóley de playa, abiertos desde la inauguración del barrio.'], psg: ['PSG Academy', 'La escuela oficial del Paris Saint-Germain, inaugurada en agosto de 2026: una cancha society oficial y una cancha techada, junto al Voz (posición aproximada).'] } }[LG === 'en' || LG === 'es' ? LG : 'pt'];
  const lit = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffc46b, emissiveIntensity: 0.55, roughness: 0.6 });
  const court = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  const place = (id, x, y, build, h, a = 0, cam = [1.4, 1.5, 2.0], sc = 1) => { const g = new THREE.Group(); g.position.copy(P(x, y)); g.rotation.y = a; g.scale.setScalar(sc); scene.add(g); build(g); STOPS[id] = { t: [x, y, h * 0.5], c: cam, k: LUG.k, n: LUG[id][0], d: LUG[id][1] }; empPins.push([id, LUG[id][0], P(x, y, h + 0.22), 'ok']); };
  // Colégio Bom Jesus: blocos de 3 andares em "L", faixas de janelas e quadra
  place('colegio', 508, 506, (g) => {
    const a = box(1.15, 0.24, 0.36, white); a.position.set(0, 0, -0.18); g.add(a);
    const b = box(0.36, 0.24, 0.8, white); b.position.set(-0.4, 0, 0.3); g.add(b);
    for (let i = 0; i < 3; i++) { const w1 = box(1.16, 0.02, 0.37, lit); w1.position.set(0, 0.035 + i * 0.075, -0.18); g.add(w1); const w2 = box(0.37, 0.02, 0.81, lit); w2.position.set(-0.4, 0.035 + i * 0.075, 0.3); g.add(w2); }
    const q = box(0.55, 0.008, 0.36, court(0x3d7fae)); q.position.set(0.25, 0, 0.35); g.add(q);
  }, 0.24, -0.45, [-1.1, 2.9, 1.5], 0.62);
  // gastronomia do boulevard: quiosques com pérgolas, de frente para o lago
  place('boulevard', 808, 626, (g) => {
    for (let i = -2; i <= 2; i++) { const k = box(0.24, 0.1, 0.2, glass); k.position.set(i * 0.3, 0, 0); g.add(k); const r = box(0.3, 0.02, 0.26, roof); r.position.set(i * 0.3, 0.1, 0); g.add(r); const l = box(0.22, 0.03, 0.005, lit); l.position.set(i * 0.3, 0.05, 0.103); g.add(l); }
  }, 0.12, -0.45);
  // PSG Academy: campo society oficial e campo coberto, ao lado do Voz
  place('psg', 845, 238, (g) => {
    const f1 = box(0.85, 0.008, 0.52, court(0x3f8f45)); f1.position.set(0, 0, -0.32); g.add(f1);
    const l1 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.78, 0.001, 0.46)), new THREE.LineBasicMaterial({ color: 0xffffff })); l1.position.set(0, 0.012, -0.32); g.add(l1);
    const mid = box(0.006, 0.002, 0.46, new THREE.MeshBasicMaterial({ color: 0xffffff })); mid.position.set(0, 0.009, -0.32); g.add(mid);
    const f2 = box(0.62, 0.008, 0.38, court(0x3f8f45)); f2.position.set(0, 0, 0.26); g.add(f2);
    const cov = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.66, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })); cov.rotation.z = Math.PI / 2; cov.position.set(0, 0, 0.26); cov.castShadow = true; g.add(cov);
    const ln = box(0.66, 0.012, 0.012, new THREE.MeshStandardMaterial({ color: 0x1d3b6e })); ln.position.set(0, 0.24, 0.26); g.add(ln);
  }, 0.26, -0.45, [1.0, 1.9, -1.9]);
  // academia Wave
  place('wave', 706, 589, (g) => { const m = box(0.5, 0.14, 0.32, glass); g.add(m); const t = box(0.52, 0.02, 0.34, white); t.position.y = 0.14; g.add(t); const l = box(0.5, 0.05, 0.005, lit); l.position.set(0, 0.06, 0.161); g.add(l); }, 0.16, -0.45);
  // quadras (tênis, padel, beach tennis, vôlei) e a MUV Arena
  place('quadras', 1293, 751, (g) => {
    const cs = [[-0.75, -0.2, 0.36, 0.2, 0xb8613f], [-0.35, -0.2, 0.36, 0.2, 0xb8613f], [0.05, -0.2, 0.24, 0.14, 0x3d7fae], [0.35, -0.2, 0.24, 0.14, 0x3d7fae], [-0.6, 0.18, 0.26, 0.16, 0xe3cf9a], [-0.25, 0.18, 0.26, 0.16, 0xe3cf9a], [0.1, 0.18, 0.26, 0.16, 0xe3cf9a]];
    cs.forEach(([x, z, w, d, c]) => { const q = box(w, 0.008, d, court(c)); q.position.set(x, 0, z); g.add(q); const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 0.86, 0.001, d * 0.8)), new THREE.LineBasicMaterial({ color: 0xffffff })); e.position.set(x, 0.012, z); g.add(e); });
    const arena = box(0.42, 0.12, 0.3, white); arena.position.set(0.55, 0, 0.15); g.add(arena); const l = box(0.4, 0.04, 0.005, lit); l.position.set(0.55, 0.05, 0.302); g.add(l);
  }, 0.14, -0.45);
  const LZ = { pt: ['Lançamentos', 'Os prédios do bairro', 'Além do Vértice, mais onze prédios no lugar de cada lote: o Vista Jardins já pronto e os lançamentos subindo, inclusive o Vision Home Club, na fase 2, do outro lado do parque.'],
    en: ['New launches', 'The neighborhood’s buildings', 'Besides Vértice, eleven more buildings, each on its own lot: Vista Jardins already finished and the new launches rising, including Vision Home Club in phase 2, across the park.'],
    es: ['Lanzamientos', 'Los edificios del barrio', 'Además del Vértice, once edificios más, cada uno en su lote: el Vista Jardins ya listo y los lanzamientos subiendo, incluido el Vision Home Club, en la fase 2, al otro lado del parque.'] }[LG === 'en' || LG === 'es' ? LG : 'pt'];
  STOPS.lanc = { t: [330, 560, 0], c: [2.5, 11.5, 10.5], k: LZ[0], n: LZ[1], d: LZ[2] };

  // controles: arrastar gira, pinça/scroll aproxima; giro automático lento quando parado
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false; controls.enableZoom = false;
  controls.minDistance = 3; controls.maxDistance = 24; controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.32;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.45;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  controls.enabled = !touch; // no celular só gira depois de tocar em "Explorar", para não travar a rolagem da página

  // pinos
  const pins = PINS.map(([k, x, y, h]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vp-pin'; b.innerHTML = '<i></i><span>' + STOPS[k].n + '</span>'; b.addEventListener('click', () => go(k)); pinBox.appendChild(b); return { el: b, v: P(x, y, h) }; });
  empPins.forEach(([k, nome, v, cls]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vp-pin em ' + cls; b.innerHTML = '<i></i><span>' + nome.replace(' Residence', '').replace(' Corporate', '') + '</span>'; b.addEventListener('click', () => go(k)); pinBox.appendChild(b); pins.push({ el: b, v }); });
  { const s = document.createElement('span'); s.className = 'vp-f2'; s.textContent = L2.f2; pinBox.appendChild(s); pins.push({ el: s, v: P(-500, 760, 0.05) }); }
  if (!document.getElementById('vpEmCss')) { const st = document.createElement('style'); st.id = 'vpEmCss'; st.textContent = '.vp-pin.em span{font-size:10px;padding:5px 9px;background:rgba(6,24,32,.82);border-color:rgba(226,199,126,.45)}.vp-pin.em i{background:#e2c77e;box-shadow:0 0 0 4px rgba(226,199,126,.25)}.vp-pin.em.ok i{background:#5fd38a;box-shadow:0 0 0 4px rgba(95,211,138,.25)}.vp-pin.em.dot span{opacity:0;transform:scale(.9);transition:opacity .2s}.vp-pin.em.dot:hover span,.vp-pin.em.dot:focus span{opacity:1}.vp-f2{position:absolute;left:0;top:0;font:600 11px "DM Sans",sans-serif;letter-spacing:3px;text-transform:uppercase;color:#f1e3bd;opacity:.85;pointer-events:none;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.7);margin:-8px 0 0 -30px}@media (max-width:640px){.vp-pin.em span{font-size:8.5px;padding:4px 7px}}'; document.head.appendChild(st); }

  // voo da câmera
  let fly = null, cardT = 0, touched = false;
  function hideCard() { clearTimeout(cardT); card.classList.remove('show'); }
  function go(k) {
    const s = STOPS[k]; if (!s) return;
    const tgt = P(s.t[0], s.t[1], s.t[2]);
    fly = { t0: performance.now(), d: 1700, p0: camera.position.clone(), q0: controls.target.clone(), p1: tgt.clone().add(new THREE.Vector3(...s.c)), q1: tgt };
    controls.autoRotate = false; zq = 0;
    card.querySelector('small').textContent = s.k; card.querySelector('strong').textContent = s.n; card.querySelector('p').textContent = s.d; card.classList.add('show');
    clearTimeout(cardT); cardT = setTimeout(hideCard, 7000); // o cartão some sozinho para liberar a maquete
    stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-k') === k));
    if (s.rise) risers.forEach((r) => { r.t0 = performance.now() + 500; });
    try { gtag('event', 'maquete_3d', { ponto: k }); } catch (_) {}
  }
  stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.addEventListener('click', () => go(b.getAttribute('data-k'))));
  const live = stage.querySelector('.vp-3d-live');
  if (live) live.addEventListener('click', () => { const on = !stage.classList.contains('live'); stage.classList.toggle('live', on); controls.enabled = on || !touch; live.textContent = on ? 'Voltar à rolagem' : 'Toque para explorar'; });
  controls.addEventListener('start', () => { fly = null; controls.autoRotate = false; touched = true; hideCard(); });

  // zoom suave: roda, pinça e botões somam um pouco e a câmera desliza até lá, na direção do ponto apontado
  let zq = 0, wheelOk = false; const za = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function zoomBy(amt, cx, cy) {
    fly = null; controls.autoRotate = false; touched = true; hideCard();
    if (cx == null) za.copy(controls.target);
    else { const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const hit = ground ? ray.intersectObject(ground, false)[0] : null; za.copy(hit ? hit.point : controls.target); }
    zq = Math.max(-2.5, Math.min(2.5, zq + amt));
  }
  function stepZoom() {
    if (Math.abs(zq) < 1e-4) { zq = 0; return; }
    const s = zq * 0.16; zq -= s;
    const d = camera.position.distanceTo(controls.target), nd = Math.min(controls.maxDistance, Math.max(controls.minDistance, d * Math.exp(s))), f = nd / d;
    if (Math.abs(f - 1) < 1e-6) { zq = 0; return; }
    camera.position.sub(za).multiplyScalar(f).add(za); controls.target.sub(za).multiplyScalar(f).add(za);
    const tt = controls.target, dx = Math.max(-IMG_W / S / 2 - 9, Math.min(IMG_W / S / 2 + 3, tt.x)) - tt.x, dy = Math.max(0, Math.min(3, tt.y)) - tt.y, dz = Math.max(-IMG_H / S / 2 - 1.5, Math.min(IMG_H / S / 2 + 2, tt.z)) - tt.z;
    if (dx || dy || dz) { tt.x += dx; tt.y += dy; tt.z += dz; camera.position.x += dx; camera.position.y += dy; camera.position.z += dz; }
  }
  const zb = document.createElement('div'); zb.className = 'zp-zoom';
  zb.innerHTML = '<button type="button" data-z="in" aria-label="' + ZL.zin + '">+</button><button type="button" data-z="out" aria-label="' + ZL.zout + '">−</button><button type="button" data-z="all" aria-label="' + ZL.zall + '" title="' + ZL.zall + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>';
  zb.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = b.getAttribute('data-z'); if (k === 'all') go('geral'); else zoomBy(k === 'in' ? -0.5 : 0.5); });
  stage.appendChild(zb);
  const hint = document.createElement('div'); hint.className = 'zp-hint'; hint.textContent = ZL.hint; stage.appendChild(hint); let hintT = 0;
  if (!document.getElementById('zpZoomCss')) { const st = document.createElement('style'); st.id = 'zpZoomCss'; st.textContent = '.zp-zoom{position:absolute;right:16px;top:16px;z-index:3;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;border:1px solid rgba(226,199,126,.5);background:rgba(6,24,32,.86);backdrop-filter:blur(8px)}.zp-zoom button{width:46px;height:46px;display:grid;place-items:center;border:0;background:none;color:#f1e3bd;font:300 26px/1 "DM Sans",sans-serif;cursor:pointer;transition:background .2s}.zp-zoom button+button{border-top:1px solid rgba(226,199,126,.22)}.zp-zoom button:hover{background:rgba(226,199,126,.14)}.zp-zoom button:active{background:rgba(226,199,126,.26)}.zp-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;padding:12px 18px;border-radius:100px;background:rgba(6,24,32,.88);border:1px solid rgba(226,199,126,.4);color:#f1e3bd;font:500 13px "DM Sans",sans-serif;opacity:0;pointer-events:none;transition:opacity .3s;white-space:nowrap}.zp-hint.on{opacity:1}@media (max-width:640px){.zp-zoom{right:12px;top:34%}.zp-zoom button{width:42px;height:42px}}'; document.head.appendChild(st); }
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !wheelOk && !stage.classList.contains('fs')) { hint.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => hint.classList.remove('on'), 1400); return; }
    e.preventDefault(); const k = e.deltaMode === 1 ? 0.04 : e.deltaMode === 2 ? 0.8 : 0.0016;
    zoomBy(Math.max(-0.6, Math.min(0.6, e.deltaY * k * (e.ctrlKey ? 3 : 1))), e.clientX, e.clientY);
  }, { passive: false });
  canvas.addEventListener('pointerdown', () => { wheelOk = true; });
  stage.addEventListener('mouseleave', () => { wheelOk = false; });
  const tp = new Map(); let pinch0 = 0;
  const spread = () => { const a = [...tp.values()]; return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); };
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; tp.set(e.pointerId, [e.clientX, e.clientY]); pinch0 = tp.size === 2 ? spread() : 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (!tp.has(e.pointerId)) return; tp.set(e.pointerId, [e.clientX, e.clientY]);
    if (tp.size === 2 && pinch0 && controls.enabled) { const s = spread(), a = [...tp.values()]; if (s > 0) { zoomBy(Math.log(pinch0 / s), (a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2); pinch0 = s; } }
  });
  const tpEnd = (e) => { tp.delete(e.pointerId); pinch0 = 0; };
  canvas.addEventListener('pointerup', tpEnd); canvas.addEventListener('pointercancel', tpEnd);
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
  });
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();

  // começo: câmera desce do alto e os prédios sobem do chão
  go('geral'); card.classList.remove('show');
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const v = new THREE.Vector3(); const clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05); waterMat.uniforms.t.value += dt; if (tick) tick(dt);
    risers.forEach((r) => { if (r.t0 == null) r.t0 = performance.now(); r.p = Math.min(1, (performance.now() - r.t0) / 2200); const n = Math.max(0, r.p) * r.N; r.floors.forEach((f) => { const s = Math.max(0.0001, Math.min(1, n - f.userData.i)); f.scale.y = s; f.visible = s > 0.001; }); });
    // obras: cada prédio "imprime" andar por andar, com a faixa de luz subindo; depois a faixa passeia pelo prédio pronto
    const now = performance.now();
    obras.forEach((o) => {
      if (o.ring) { o.ring.material.opacity = 0.55 + 0.4 * Math.sin(now / 450); return; }
      if (o.t0 == null) o.t0 = now + o.delay;
      const p = Math.max(0, Math.min(1, (now - o.t0) / 3400)), n = p * o.fl;
      o.floors.forEach((f) => { const s = Math.max(0.0001, Math.min(1, n - f.userData.i)); f.scale.y = s; f.visible = s > 0.001; });
      o.shell.visible = p >= 1; o.scan.visible = p > 0;
      o.scan.position.y = p < 1 ? n * (o.H / o.fl) : o.H * (0.5 - 0.5 * Math.cos((now - o.t0 - 3400) / 1300));
    });
    cranes.forEach((c) => { c.top.rotation.y = Math.sin(now / 3200 + c.ph) * 1.1; });
    if (fly) { const k = Math.min(1, (performance.now() - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) fly = null; }
    stepZoom(); controls.update(); sky.position.copy(camera.position); renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    const placed = [];
    pins.forEach((p) => {
      v.copy(p.v).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05, sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h;
      p.el.style.opacity = on ? '1' : '0'; p.el.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      // nomes que se encostam: o de trás fica só com o ponto (o nome aparece ao aproximar ou passar o mouse)
      if (!on || !p.el.classList.contains('vp-pin')) return;
      if (!p.lw) p.lw = (p.el.textContent.length * 7 + 34);
      const r = [sx - 8, sy - 12, sx + p.lw, sy + 12], hit = placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
      p.el.classList.toggle('dot', hit && p.el.classList.contains('em')); if (!hit || !p.el.classList.contains('em')) placed.push(r);
    });
  }
  stage._frame = frame;
  (function loop() { requestAnimationFrame(loop); if (visible) frame(); })();
  stage.classList.add('gl');
}
