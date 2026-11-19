// Santa Maria em 3D: relevo real (SRTM) com a serra ao norte, campo, mata, rios e ruas, e as construções da cidade com o
// contorno do OpenStreetMap. Os empreendimentos acendem no endereço, com a cor da fase da obra. Alturas aproximadas;
// relevo e prédios exagerados 1,6x.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const VE = 1.6, BX = 1.6, FH = 3 * BX / 100;
const ST = { pronto: 0x5fd38a, obra: 0x79c2cd, lanc: 0xe2c77e, x: 0xc4b8f7 };
const L = {
  st: { pronto: 'Pronto para morar', obra: 'Em obras', lanc: 'Lançamento', x: 'Consulte a fase atual' },
  tp: { ap: 'Apartamentos', cond: 'Condomínio de casas', lot: 'Loteamento' },
  zin: 'Aproximar', zout: 'Afastar', zall: 'Ver tudo', hint: 'Use + e − ou Ctrl + rolagem para aproximar',
  conf: 'Fase conferida em nov/2026', nconf: 'A Kamila confirma a fase e as condições atualizadas.',
};
const REG = {
  centro: { n: 'Centro e arredores', d: 'O coração da cidade: Centro, Bonfim, Fátima, Lourdes e Medianeira, perto da UFN, do calçadão e dos serviços.' },
  camobi: { n: 'Camobi, São José e UFSM', d: 'A região da universidade, que mais cresce na cidade: prédios novos, compactos para investir e condomínios de casas.' },
  sul: { n: 'Zona sul', d: 'Condomínios de casas e residenciais em áreas mais tranquilas, entre o Centro e Camobi.' },
  oeste: { n: 'Zona oeste', d: 'Loteamentos planejados e residenciais perto da Av. Walter Jobim e dos quartéis.' },
  norte: { n: 'Norte e serra', d: 'Loteamentos ao pé da serra, com vista para a cidade.' },
};

export async function init(stage, opts = {}) {
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.vp-3d-pins'), card = stage.querySelector('.vp-3d-card');
  const touch = window.matchMedia('(pointer: coarse)').matches, big = !touch && Math.min(screen.width, screen.height) >= 700;
  const tUrl = stage.getAttribute('data-terrain'), root = tUrl.replace(/js\/sm-terreno\.json.*$/, ''), ver = stage.getAttribute('data-v') || '1';
  const [data, emp, quad] = await Promise.all([
    fetch(tUrl).then((r) => r.json()),
    fetch(root + 'js/sm-emp.json?v=' + ver).then((r) => r.json()),
    fetch(root + 'js/sm-cidade/quadras.json?v=' + ver).then((r) => r.json()).catch(() => null),
  ]);
  const [N, S, W, E] = data.box, nx = data.nx, ny = data.ny;
  const latC = (N + S) / 2, lonC = (W + E) / 2, kx = 111320 * Math.cos(latC * Math.PI / 180) / 100, kz = 110540 / 100;
  const X = (lon) => (lon - lonC) * kx, Z = (lat) => (latC - lat) * kz;
  const WU = (E - W) * kx, HU = (N - S) * kz;
  const hR = (i, j) => data.h[Math.max(0, Math.min(ny - 1, j)) * nx + Math.max(0, Math.min(nx - 1, i))];
  const cub = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  const H0 = Math.min(...data.h);
  const hXZ = (x, z) => {
    const fx = (x + WU / 2) / WU * (nx - 1), fy = (z + HU / 2) / HU * (ny - 1), i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    const r = (jj) => cub(hR(i - 1, jj), hR(i, jj), hR(i + 1, jj), hR(i + 2, jj), u);
    // perto da borda o relevo desce suave até o campo em volta (sem degrau no fim do mapa)
    const ed = Math.min(fx, nx - 1 - fx, (fy) * (nx / ny), (ny - 1 - fy) * (nx / ny)) / (nx * 0.07), fade = Math.max(0, Math.min(1, ed));
    return (cub(r(j - 1), r(j), r(j + 1), r(j + 2), v) - H0) * VE / 100 * (fade * fade * (3 - 2 * fade));
  };
  const hAt = (lat, lon) => hXZ(X(lon), Z(lat));

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { stage.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !touch; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xd9c9b4, 90, 220);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1600);
  scene.add(new THREE.HemisphereLight(0xeaf0ff, 0x4a4a3a, 0.95));
  // fim de tarde: sol baixo a oeste, céu dourado no horizonte
  const SKY = { zen: new THREE.Color(0x1d2f63), mid: new THREE.Color(0x6a86bd), hc: new THREE.Color(0xdcc9c0), hw: new THREE.Color(0xf2b27a), glow: new THREE.Color(0xff9c45), core: new THREE.Color(0xffe6a8) };
  const sunDir = new THREE.Vector3(-0.8, 0.07, 0.58).normalize();
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.3); sun.castShadow = !touch;
  const rim = new THREE.DirectionalLight(0xffb070, 0.8); rim.position.copy(sunDir).multiplyScalar(100); scene.add(rim);
  const HZ = 'vec3 hz(vec3 d){ vec2 a = normalize(d.xz + 1e-5); vec2 s = normalize(sunDir.xz); return mix(hc, hw, pow(max(dot(a, s), 0.0), 2.5)); }';
  const skyU = { sunDir: { value: sunDir }, zen: { value: SKY.zen }, mid: { value: SKY.mid }, hc: { value: SKY.hc }, hw: { value: SKY.hw }, glow: { value: SKY.glow }, core: { value: SKY.core } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 sunDir, zen, mid, hc, hw, glow, core; varying vec3 vD; ' + HZ + ' void main(){ vec3 d = normalize(vD); float h = d.y; vec3 c = hz(d); c = mix(c, mid, smoothstep(0.0, 0.1, h)); c = mix(c, zen, smoothstep(0.1, 0.45, h)); float sd = max(dot(d, sunDir), 0.0); c += glow * (pow(sd, 8.0) * 0.22 * (1.0 - smoothstep(0.0, 0.3, h)) + pow(sd, 80.0) * 0.45 + pow(sd, 900.0) * 0.7); c = mix(c, core * 1.35, smoothstep(0.99950, 0.99966, sd)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  sun.shadow.mapSize.set(big ? 4096 : 2048, big ? 4096 : 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 320 }); sun.shadow.bias = -0.0004; scene.add(sun); scene.add(sun.target);
  const SUNOFF = new THREE.Vector3(-70, 60, 50);
  const shadowFit = (tg, r) => { const c = sun.shadow.camera; c.left = c.bottom = -r; c.right = c.top = r; c.updateProjectionMatrix(); sun.target.position.copy(tg); sun.position.copy(tg).add(SUNOFF); sun.target.updateMatrixWorld(); };

  // chão
  const tl = new THREE.TextureLoader(), maxAniso = renderer.capabilities.getMaxAnisotropy();
  const chao = await tl.loadAsync(root + 'images/santa-maria/3d/' + (big ? 'chao.webp' : 'chao-m.webp') + '?v=' + ver).catch(() => null);
  if (chao) { chao.colorSpace = THREE.SRGBColorSpace; chao.anisotropy = Math.min(8, maxAniso); }
  const GX = big ? 281 : 181, GY = Math.round(GX * HU / WU);
  const geo = new THREE.PlaneGeometry(WU, HU, GX - 1, GY - 1);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) { const i = k % GX, j = (k / GX) | 0; pos.setZ(k, hXZ(-WU / 2 + WU * i / (GX - 1), -HU / 2 + HU * j / (GY - 1))); }
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, chao ? new THREE.MeshStandardMaterial({ map: chao, roughness: 0.95, metalness: 0 }) : new THREE.MeshStandardMaterial({ color: 0x8aa070, roughness: 0.95 }));
  land.rotation.x = -Math.PI / 2; land.receiveShadow = true; scene.add(land);
  // campo em volta da caixa, até sumir na névoa
  const out = new THREE.Mesh(new THREE.RingGeometry(Math.hypot(WU, HU) * 0.5 - 1, 900, 64, 1), new THREE.MeshStandardMaterial({ color: 0x6f8a52, roughness: 1 }));
  out.rotation.x = -Math.PI / 2; out.position.y = -0.02; scene.add(out);
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshStandardMaterial({ color: 0x6f8a52, roughness: 1 }));
  skirt.rotation.x = -Math.PI / 2; skirt.position.y = -0.05; scene.add(skirt);

  // empreendimentos: anel no chão + feixe de luz na cor da fase
  const P = emp.e;
  const beamGeo = new THREE.CylinderGeometry(0.05, 0.16, 5, 16, 1, true), ringGeo = new THREE.RingGeometry(0.42, 0.5, 40);
  const beamMat = {}, ringMat = {};
  for (const k of Object.keys(ST)) {
    beamMat[k] = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(ST[k]) }, a: { value: 0.45 } },
      vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 c; uniform float a; varying float vY; void main(){ gl_FragColor = vec4(c, smoothstep(2.5, -2.5, vY) * a); }' });
    ringMat[k] = new THREE.MeshBasicMaterial({ color: ST[k], transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
  }
  P.forEach((p) => {
    const g = new THREE.Group(), base = hAt(p.ll[0], p.ll[1]); g.position.set(X(p.ll[1]), base, Z(p.ll[0]));
    const k = p.f || 'x';
    const ring = new THREE.Mesh(ringGeo, ringMat[k]); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.renderOrder = 2; ring.scale.setScalar(p.t === 'ap' ? 1 : 1.6); g.add(ring);
    const beam = new THREE.Mesh(beamGeo, beamMat[k]); beam.position.y = 2.5 + (p.pav ? p.pav * FH : 0.2); g.add(beam);
    // prédio novo (em obras ou lançamento, com o número de andares conhecido): volume em holograma subindo
    if (p.pav && (p.f === 'obra' || p.f === 'lanc')) {
      const h = p.pav * FH, bg = new THREE.BoxGeometry(0.22, h, 0.22); bg.translate(0, h / 2, 0);
      const m = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: ST[k], emissive: ST[k], emissiveIntensity: 0.45, transparent: true, opacity: 0.55, roughness: 0.3 }));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(bg), new THREE.LineBasicMaterial({ color: ST[k] }))); g.add(m); g.userData.vol = m;
    }
    scene.add(g); p.g = g; p.top = new THREE.Vector3(g.position.x, base + (p.pav ? p.pav * FH : 0.15) + 0.25, g.position.z);
    g.userData.ring = ring; g.userData.beam = beam;
  });

  // cidade: só as quadras de 1 km em volta de onde a pessoa olha de perto; contornos reais, janelas acendendo no fim de tarde,
  // e o prédio do empreendimento destacado na cor da fase
  let cityMat = null; const quadOk = new Set(), quadMesh = [];
  function cityMesh(cityBuf) {
    const u = new Uint16Array(cityBuf), ox = -WU / 2, oz = -HU / 2, minA = touch ? 40 : 0;
    let nv = 0, ni = 0;
    // primeira passada: conta, para alocar de uma vez
    const list = [];
    for (let k = 0; k < u.length;) { const n = u[k] & 255, fl = u[k] >> 8; const s = k + 1; k += 1 + n * 2; list.push([s, n, fl]); }
    const keep = [];
    for (const [s, n, fl] of list) {
      if (n < 3) continue;
      let a2 = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; a2 += u[s + i * 2] * u[s + j * 2 + 1] - u[s + j * 2] * u[s + i * 2 + 1]; }
      const A = Math.abs(a2) / 8; if (A < minA && fl < 3) continue;
      keep.push([s, n, fl, a2]); nv += n * 3; ni += n * 6 + (n - 2) * 3;
    }
    const vp = new Float32Array(nv * 3), vc = new Float32Array(nv * 3), vi = new Float32Array(nv * 3), ix = new Uint32Array(ni);
    let pv = 0, pi = 0; const c = new THREE.Color(), roof = new THREE.Color(), xs = [], zs = [];
    const hs = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
    keep.forEach(([s, n, fl, a2], bi) => {
      xs.length = zs.length = 0; let base = 1e9;
      for (let i = 0; i < n; i++) { const x = u[s + i * 2] / 200 + ox, z = u[s + i * 2 + 1] / 200 + oz; xs.push(x); zs.push(z); base = Math.min(base, hXZ(x, z)); }
      base -= 0.004; const top = base + fl * FH, r = hs(bi + 1 + s), tower = fl >= 5;
      if (tower) c.setHex([0xf0ece4, 0xe6ddcc, 0xd9d8d4, 0xc8d3d8, 0xece2d0, 0xd8cdbb][r * 6 | 0]); else c.setHSL(0.08 + r * 0.05, 0.22 + r * 0.2, 0.76 + r * 0.12);
      if (tower) roof.setHex(0xb2aea6); else roof.setHSL(0.03 + r * 0.03, 0.42, 0.4 + r * 0.1);
      // é o prédio de um empreendimento? (o ponto cai dentro do contorno ou a menos de 18 m)
      let cx = 0, cz = 0; for (let i = 0; i < n; i++) { cx += xs[i] / n; cz += zs[i] / n; }
      const hit = P.find((p) => { if (p.f === 'obra' || p.f === 'lanc') return false; const px = p.g.position.x, pz = p.g.position.z; if (Math.abs(px - cx) > 0.6 || Math.abs(pz - cz) > 0.6) return false; let inn = false; for (let i = 0, j = n - 1; i < n; j = i++) if ((zs[i] > pz) !== (zs[j] > pz) && px < (xs[j] - xs[i]) * (pz - zs[i]) / (zs[j] - zs[i]) + xs[i]) inn = !inn; return inn || Math.hypot(px - cx, pz - cz) < 0.18; });
      if (hit) { c.setHex(ST[hit.f || 'x']); roof.copy(c).multiplyScalar(0.8); hit.hasB = true; }
      const v0 = pv / 3, ty = hit ? 2 : tower ? 1 : 0;
      for (let i = 0; i < n; i++) { vp.set([xs[i], base, zs[i]], pv); vc.set([c.r, c.g, c.b], pv); vi.set([base, r, ty], pv); pv += 3; }
      for (let i = 0; i < n; i++) { vp.set([xs[i], top, zs[i]], pv); vc.set([c.r, c.g, c.b], pv); vi.set([base, r, ty], pv); pv += 3; }
      for (let i = 0; i < n; i++) { vp.set([xs[i], top, zs[i]], pv); vc.set([roof.r, roof.g, roof.b], pv); vi.set([base, r, -1], pv); pv += 3; }
      // a2 > 0 = sentido horário na tela (z para baixo): ajusta a ordem para as paredes ficarem para fora
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (a2 < 0) ix.set([v0 + i, v0 + n + j, v0 + j, v0 + i, v0 + n + i, v0 + n + j], pi); else ix.set([v0 + i, v0 + j, v0 + n + j, v0 + i, v0 + n + j, v0 + n + i], pi); pi += 6; }
      if (n === 3 || n === 4) { const t = n === 3 ? [[0, 1, 2]] : [[0, 1, 2], [0, 2, 3]]; for (const [p, q, w] of t) { if (a2 < 0) ix.set([v0 + 2 * n + p, v0 + 2 * n + w, v0 + 2 * n + q], pi); else ix.set([v0 + 2 * n + p, v0 + 2 * n + q, v0 + 2 * n + w], pi); pi += 3; } }
      else {
        const tri = THREE.ShapeUtils.triangulateShape(xs.map((x, i) => new THREE.Vector2(x, zs[i])), []);
        for (const [p, q, w] of tri) { const cy = (zs[q] - zs[p]) * (xs[w] - xs[p]) - (xs[q] - xs[p]) * (zs[w] - zs[p]); if (cy > 0) ix.set([v0 + 2 * n + p, v0 + 2 * n + q, v0 + 2 * n + w], pi); else ix.set([v0 + 2 * n + p, v0 + 2 * n + w, v0 + 2 * n + q], pi); pi += 3; }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vp, 3)); g.setAttribute('color', new THREE.BufferAttribute(vc, 3)); g.setAttribute('aI', new THREE.BufferAttribute(vi, 3));
    g.setIndex(new THREE.BufferAttribute(ix.subarray(0, pi), 1));
    if (!cityMat) { cityMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.02, flatShading: true, side: THREE.DoubleSide });
    const cm = cityMat; cm.onBeforeCompile = (sh) => {
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
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.2, 0.26), wm * 0.8);
            roughnessFactor = mix(roughnessFactor, 0.18, wm);
            totalEmissiveRadiance += vec3(1.0, 0.7, 0.4) * mix(0.33 * (vI.z > 0.5 ? 0.38 : 0.2), win * lit, aa) * 1.1;
          }
          if (vI.z > 1.5) totalEmissiveRadiance += vColor.rgb * 0.45;
        }`);
    }; }
    const m = new THREE.Mesh(g, cityMat); m.castShadow = !touch; m.receiveShadow = !touch; scene.add(m); quadMesh.push(m);
  }
  // baixa as quadras a menos de r unidades (1 = 100 m) de um ponto
  function loadNear(x, z, r) {
    if (!quad) return;
    const C = quad.cell / 100, i0 = Math.floor((x + WU / 2 - r) / C), i1 = Math.floor((x + WU / 2 + r) / C), j0 = Math.floor((z + HU / 2 - r) / C), j1 = Math.floor((z + HU / 2 + r) / C);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = i + '_' + j; if (quadOk.has(k) || !quad.has.includes(k)) continue; quadOk.add(k); fetch(root + 'js/sm-cidade/c_' + k + '.bin?v=' + ver).then((r2) => r2.arrayBuffer()).then(cityMesh).catch(() => {}); }
  }

  // controles: o zoom é nosso (suave, para o ponto apontado); o OrbitControls só gira
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = !touch; controls.screenSpacePanning = false; controls.panSpeed = 0.8; controls.enableZoom = false; controls.minDistance = 1.2; controls.maxDistance = 160; controls.minPolarAngle = 0.05; controls.maxPolarAngle = 1.45;
  controls.enabled = !touch;

  // pinos (bolinha sempre; o nome aparece de perto, no escolhido ou ao passar o mouse)
  const pins = [];
  P.forEach((p) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'vp-pin smp ' + (p.f || 'x'); b.innerHTML = '<i></i><span>' + p.n + '</span>';
    b.addEventListener('click', (e) => { e.stopPropagation(); go(p.id); }); pinBox.appendChild(b); pins.push({ el: b, v: p.top, p });
  });
  (emp.places || []).forEach(([n, la, lo, kind]) => { const s = document.createElement('span'); s.className = 'zp-place' + (kind ? ' ' + kind : ''); s.textContent = n; pinBox.appendChild(s); pins.push({ el: s, v: new THREE.Vector3(X(lo), hAt(la, lo) + 0.35, Z(la)), place: true }); });

  // voo, cartão, filtros
  let fly = null, cardT = 0, cur = null, sway = false, swayBase = null, swayT0 = 0, filt = 'all';
  const hideCard = () => { clearTimeout(cardT); card.classList.remove('show'); };
  const UP = new THREE.Vector3(0, 1, 0);
  const visible = (p) => filt === 'all' || (p.f || 'x') === filt;
  // tela em pé: a cidade (comprida de leste a oeste) fica de pé também, com o Centro em cima
  const VG = () => (camera.aspect < 0.9 ? new THREE.Vector3(0.44, 0.9, 0.04) : new THREE.Vector3(0.05, 0.88, 0.45));
  const VR = () => (camera.aspect < 0.9 ? new THREE.Vector3(0.55, 0.78, 0.12) : new THREE.Vector3(0.15, 0.78, 0.6));
  function frameOn(list, dir0) {
    const pts = []; list.forEach((p) => { pts.push(p.g.position, p.top); });
    const box = new THREE.Box3().setFromPoints(pts), ctr = box.getCenter(new THREE.Vector3()); ctr.y = Math.max(0.3, box.min.y + 0.3);
    const port = camera.aspect < 1, dir = (dir0 || new THREE.Vector3(0.25, 0.55, 0.8)).clone().normalize(), cam = camera.clone(), pv = new THREE.Vector3();
    let d = 4;
    for (let i = 0; i < 160; i++) { cam.position.copy(dir).multiplyScalar(d).add(ctr); cam.lookAt(ctr); cam.updateMatrixWorld(); if (pts.every((pt) => { pv.copy(pt).project(cam); return Math.abs(pv.x) < (port ? 0.8 : 0.84) && pv.y < 0.6 && pv.y > -0.8; })) break; d *= 1.05; }
    controls.maxDistance = Math.max(controls.maxDistance, d * 1.3);
    return { tgt: ctr, off: dir.multiplyScalar(d) };
  }
  function zoomTo(tgt, off, ms = 1800) { fly = { t0: performance.now(), d: ms, p0: camera.position.clone(), q0: controls.target.clone(), p1: tgt.clone().add(off), q1: tgt.clone() }; }
  let zq = 0; const za = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function zoomBy(amt, cx, cy) {
    sway = false; fly = null; hideCard();
    if (cx == null) za.copy(controls.target);
    else { const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const hit = ray.intersectObject(land, false)[0]; za.copy(hit ? hit.point : controls.target); }
    zq = Math.max(-2.5, Math.min(2.5, zq + amt));
  }
  function clampT() { const tt = controls.target, cx2 = Math.max(-WU / 2, Math.min(WU / 2, tt.x)) - tt.x, cy2 = Math.max(0, Math.min(10, tt.y)) - tt.y, cz2 = Math.max(-HU / 2, Math.min(HU / 2, tt.z)) - tt.z; if (cx2 || cy2 || cz2) { tt.x += cx2; tt.y += cy2; tt.z += cz2; camera.position.x += cx2; camera.position.y += cy2; camera.position.z += cz2; } }
  function stepZoom() {
    if (Math.abs(zq) < 1e-4) { zq = 0; return; }
    const s = zq * 0.16; zq -= s;
    const d = camera.position.distanceTo(controls.target), nd = Math.min(controls.maxDistance, Math.max(controls.minDistance, d * Math.exp(s))), f = nd / d;
    if (Math.abs(f - 1) < 1e-6) { zq = 0; return; }
    camera.position.sub(za).multiplyScalar(f).add(za); controls.target.sub(za).multiplyScalar(f).add(za); clampT();
  }
  const wa = (p) => 'Olá Kamila! Vi o ' + p.n + ' no mapa 3D de Santa Maria no site e quero saber mais (fase da obra, unidades e condições).';
  function showCard(p) {
    const sm = card.querySelector('small'), st = card.querySelector('strong'), pp = card.querySelector('p'), cta = card.querySelector('.smp-cta');
    if (!p) return;
    sm.textContent = L.st[p.f || 'x'] + (p.c ? ' · ' + p.c : '');
    st.textContent = p.n;
    pp.textContent = [L.tp[p.t], p.b].filter(Boolean).join(' · ') + '. ' + (p.f ? (p.nota ? p.nota + ' ' : '') + L.conf + '.' : L.nconf);
    if (cta) { cta.href = (opts.wa ? opts.wa(wa(p)) : '#'); cta.setAttribute('data-origem', 'sm_3d_' + p.id); }
    card.classList.add('show'); clearTimeout(cardT); cardT = setTimeout(hideCard, 12000);
  }
  function go(id) {
    let tgt, off; sway = false; zq = 0;
    if (id === 'geral') { const fv = frameOn(P.filter(visible), VG()); tgt = fv.tgt; off = fv.off; hideCard(); cur = null; sway = false; }
    else if (REG[id]) {
      const list = P.filter((p) => p.reg === id && visible(p)); if (!list.length) return;
      const fv = frameOn(list, VR()); tgt = fv.tgt; off = fv.off; cur = null;
      const sm = card.querySelector('small'), st = card.querySelector('strong'), pp = card.querySelector('p'), cta = card.querySelector('.smp-cta');
      sm.textContent = list.length + (list.length > 1 ? ' empreendimentos' : ' empreendimento'); st.textContent = REG[id].n; pp.textContent = REG[id].d;
      if (cta) { cta.href = opts.wa ? opts.wa('Olá Kamila! Vi no mapa 3D do site os empreendimentos da região ' + REG[id].n + ' e quero opções.') : '#'; cta.setAttribute('data-origem', 'sm_3d_' + id); }
      card.classList.add('show'); clearTimeout(cardT); cardT = setTimeout(hideCard, 10000);
    } else {
      const p = P.find((x) => x.id === id); if (!p) return; cur = p;
      if (!visible(p)) setFilter('all');
      tgt = p.g.position.clone().add(new THREE.Vector3(0, 0.3 + (p.pav ? p.pav * FH * 0.4 : 0), 0)); off = new THREE.Vector3(2.6, 1.9, 2.9);
      showCard(p); p.g.userData.t0 = performance.now(); loadNear(p.g.position.x, p.g.position.z, 9);
    }
    try { gtag('event', 'maquete_sm', { ponto: id }); } catch (_) {}
    if (tgt) zoomTo(tgt, off);
    stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-k') === id));
    if (opts.onGo) opts.onGo(id);
  }
  function setFilter(k) {
    filt = k; P.forEach((p) => { p.g.visible = visible(p); });
    stage.parentNode.querySelectorAll('.smp-filt button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-f') === k));
    if (cur && !visible(cur)) { cur = null; hideCard(); }
  }
  stage.parentNode.querySelectorAll('.vp-3d-tour button').forEach((b) => b.addEventListener('click', () => go(b.getAttribute('data-k'))));
  stage.parentNode.querySelectorAll('.smp-filt button').forEach((b) => b.addEventListener('click', () => { setFilter(b.getAttribute('data-f')); if (!cur) go('geral'); }));
  const cx = card.querySelector('.vp-3d-cx'); if (cx) cx.addEventListener('click', (e) => { e.stopPropagation(); hideCard(); });
  const live = stage.querySelector('.vp-3d-live');
  if (live) live.addEventListener('click', () => { const on = !stage.classList.contains('live'); stage.classList.toggle('live', on); controls.enabled = on || !touch; live.textContent = on ? 'Voltar à rolagem' : 'Toque para explorar'; });
  controls.addEventListener('start', () => { fly = null; sway = false; });
  controls.addEventListener('change', clampT);
  let downAt = null, wheelOk = false;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; wheelOk = true; });
  canvas.addEventListener('pointerup', (e) => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 8) hideCard(); downAt = null; });
  stage.addEventListener('mouseleave', () => { wheelOk = false; });

  const zb = document.createElement('div'); zb.className = 'zp-zoom';
  zb.innerHTML = '<button type="button" data-z="in" aria-label="' + L.zin + '">+</button><button type="button" data-z="out" aria-label="' + L.zout + '">−</button><button type="button" data-z="all" aria-label="' + L.zall + '" title="' + L.zall + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>';
  zb.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = b.getAttribute('data-z'); if (k === 'all') go('geral'); else zoomBy(k === 'in' ? -0.55 : 0.55); });
  stage.appendChild(zb);
  const hint = document.createElement('div'); hint.className = 'zp-hint'; hint.textContent = L.hint; stage.appendChild(hint); let hintT = 0;
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !wheelOk && !stage.classList.contains('fs')) { hint.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => hint.classList.remove('on'), 1400); return; }
    e.preventDefault(); const k = e.deltaMode === 1 ? 0.04 : e.deltaMode === 2 ? 0.8 : 0.0016;
    zoomBy(Math.max(-0.6, Math.min(0.6, e.deltaY * k * (e.ctrlKey ? 3 : 1))), e.clientX, e.clientY);
  }, { passive: false });
  const tp = new Map(); let pinch0 = 0;
  const spread = () => { const a = [...tp.values()]; return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); };
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; tp.set(e.pointerId, [e.clientX, e.clientY]); pinch0 = tp.size === 2 ? spread() : 0; });
  canvas.addEventListener('pointermove', (e) => { if (!tp.has(e.pointerId)) return; tp.set(e.pointerId, [e.clientX, e.clientY]); if (tp.size === 2 && pinch0 && controls.enabled) { const s = spread(), a = [...tp.values()]; if (s > 0) { zoomBy(Math.log(pinch0 / s), (a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2); pinch0 = s; } } });
  const tpEnd = (e) => { tp.delete(e.pointerId); pinch0 = 0; };
  canvas.addEventListener('pointerup', tpEnd); canvas.addEventListener('pointercancel', tpEnd);

  const fsb = stage.querySelector('.vp-3d-fs');
  if (fsb) fsb.addEventListener('click', () => {
    const on = !stage.classList.contains('fs'); stage.classList.toggle('fs', on); document.documentElement.style.overflow = on ? 'hidden' : '';
    fsb.textContent = on ? '× Sair' : '⤢ Tela cheia'; controls.enabled = on || !touch || stage.classList.contains('live'); setTimeout(resize, 60);
    try { gtag('event', 'maquete_tela_cheia', { on: on ? 1 : 0, pagina: 'sm' }); } catch (_) {}
  });
  let lastAsp = 0;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (lastAsp && Math.abs(camera.aspect - lastAsp) > 0.15 && cur == null && stage.classList.contains('gl')) go('geral');
    lastAsp = camera.aspect;
  }
  new ResizeObserver(resize).observe(stage); resize();
  { const fv = frameOn(P, VG()); controls.target.copy(fv.tgt); camera.position.copy(fv.tgt).add(fv.off.clone().multiplyScalar(1.6)); }
  go('geral');
  stage.classList.add('gl', 'ready');
  stage._go = go;

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const fwd = new THREE.Vector3(), sh = new THREE.Vector2(), v = new THREE.Vector3(), clock = new THREE.Clock(); let onScreen = true, lastLoad = 0;
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; }).observe(stage);
  function frame() {
    clock.getDelta(); const now = performance.now();
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) fly = null; }
    else if (sway) { if (!swayBase) { swayBase = camera.position.clone().sub(controls.target); swayT0 = now; } camera.position.copy(swayBase).applyAxisAngle(UP, 0.1 * Math.sin((now - swayT0) / 4200)).add(controls.target); }
    stepZoom();
    controls.update();
    const cd = camera.position.distanceTo(controls.target);
    // de perto: baixa os prédios em volta; de longe: some com eles (visão geral leve)
    if (cd < 20 && now - lastLoad > 600) { lastLoad = now; loadNear(controls.target.x, controls.target.z, 7); }
    quadMesh.forEach((m) => { m.visible = cd < 45; });
    scene.fog.near = cd * 0.9 + 10; scene.fog.far = cd * 1.9 + 60;
    const nn = Math.max(0.03, Math.min(0.5, cd * 0.012)); if (Math.abs(camera.near - nn) > 0.005) { camera.near = nn; camera.updateProjectionMatrix(); }
    if (!touch) shadowFit(controls.target, Math.max(6, Math.min(70, cd * 1.3)));
    P.forEach((p) => {
      const ud = p.g.userData, sel = p === cur, pulse = 0.5 + 0.5 * Math.sin(now / 450);
      ud.ring.material.opacity = 0.55 + 0.35 * pulse; ud.ring.scale.setScalar((p.t === 'ap' ? 1 : 1.6) * (sel ? 1.35 + 0.15 * pulse : 1) * Math.max(0.6, Math.min(2.4, cd / 14)));
      { const bs = Math.max(0.06, Math.min(2.2, camera.position.distanceTo(p.g.position) / 20)); ud.beam.scale.set(bs, 1, bs); }
      if (ud.vol) { const k = ud.t0 == null ? 1 : Math.min(1, (now - ud.t0) / 1400); ud.vol.scale.y = Math.max(0.02, 1 - Math.pow(1 - k, 3)); }
    });
    sky.position.copy(camera.position); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); sh.set(sunDir.x, sunDir.z).normalize(); scene.fog.color.copy(SKY.hc).lerp(SKY.hw, Math.pow(Math.max(fwd.x * sh.x + fwd.z * sh.y, 0), 2.5));
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    // nomes de bairros e lugares: sem amontoar (o que encosta em outro já mostrado some); hospitais, shoppings etc. só de mais perto
    const taken = [];
    pins.forEach((pn) => {
      if (pn.p && !pn.p.g.visible) { pn.el.style.opacity = '0'; pn.el.style.pointerEvents = 'none'; return; }
      v.copy(pn.v).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      const sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h;
      pn.el.style.opacity = on ? '1' : '0'; pn.el.style.pointerEvents = on ? '' : 'none';
      pn.el.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      if (pn.p) { const near = camera.position.distanceTo(pn.v) < 11; pn.el.classList.toggle('named', near || pn.p === cur); pn.el.classList.toggle('sel', pn.p === cur); }
      else {
        let show = on && cd > 4 && (!pn.el.classList.contains('poi') || cd < (w < 640 ? 36 : 48));
        if (show) { if (!pn.bw) { pn.bw = pn.el.offsetWidth || 80; pn.bh = pn.el.offsetHeight || 20; } const r = [sx - pn.bw / 2 - 6, sy - pn.bh / 2 - 4, sx + pn.bw / 2 + 6, sy + pn.bh / 2 + 4]; if (taken.some((t) => r[0] < t[2] && r[2] > t[0] && r[1] < t[3] && r[3] > t[1])) show = false; else taken.push(r); }
        pn.el.style.opacity = show ? '1' : '0';
      }
    });
  }
  stage._frame = frame;
  (function loop() { requestAnimationFrame(loop); if (onScreen) frame(); })();
}
