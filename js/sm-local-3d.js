// Maquete local de um empreendimento de Santa Maria (mesmo jeito da maquete da praia, só a vizinhança):
// construções reais do OpenStreetMap em volta, ruas e verde no chão, e o prédio do empreendimento no tamanho real, de frente para a rua,
// com fachada desenhada a partir das fotos. Escala real (1 unidade = 10 m). Dados: js/sm-local/<id>.json (C:/kr-cut/sm3d/local.mjs).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const U = 10, FHM = 3.0, FH = FHM / U; // 1 unidade = 10 m; andar = 3 m
const ST = { pronto: 0x5fd38a, obra: 0x79c2cd, lanc: 0xe2c77e };
const ICO = { escola: 'E', mercado: 'M' };

// ---------- fachada (desenho por código, a partir das fotos) ----------
function rnd(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function hash(t) { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 2147483647; return h || 1; }
function faceSvg(o, cols, side, lit, r) {
  const W = cols * 10, H = o.fl * 10 + 3, pn = (o.pod && o.pod.n) || 0, out = [], wall = side && o.side ? o.side : o.wall;
  const bands = (o.bands || []).filter((b) => b.f === 'a' || (side ? b.f === 's' : b.f === 'f'));
  const R = (x, y, w, h, c, ex = '') => out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${c}"${ex}/>`);
  const top = H - pn * 10;
  if (!lit) { R(0, 0, W, H, wall); bands.forEach((b) => { if (b.k === 'win') R(b.x * W, 3, b.w * W, top - 3, b.c); }); if (o.hs) for (let f = pn; f < o.fl; f++) R(0, H - (f + 1) * 10 + 2, W, 6.4, o.hs); }
  for (let f = pn; f < o.fl; f++) {
    const y = H - (f + 1) * 10;
    if (o.win === 'strip') { if (lit) { if (r() < 0.5) R(1, y + 2.4, W - 2, 5.4, '#ffd88a'); } else R(1, y + 2.4, W - 2, 5.4, 'url(#g)'); continue; }
    for (let c = 0; c < cols; c++) {
      const cx = c * 10; if (bands.some((b) => b.k !== 'win' && cx + 5 > b.x * W && cx + 5 < (b.x + b.w) * W)) continue;
      if (lit) { if (r() < 0.34) R(cx + 2.4, y + 2.4, 5.2, 5, r() < 0.8 ? '#ffd68a' : '#fff1c9'); } else R(cx + 2.4, y + 2.4, 5.2, 5, 'url(#g)');
    }
    if (!lit && o.bal) {
      if (o.bal.k === 'alt') { for (let c2 = 0; c2 < cols; c2 += 2) { const w = Math.min(10, W - c2 * 10); R(c2 * 10, y + 7.6, w, 2.4, o.bal.c); R(c2 * 10, y + 5.6, w, 2, o.bal.c, ' opacity=".45"'); } }
      else { const b0 = o.bal.k === 'col' ? o.bal.x0 * W : 0, b1 = o.bal.k === 'col' ? o.bal.x1 * W : W; R(b0, y + 7.6, b1 - b0, 2.4, o.bal.c); R(b0, y + 5.6, b1 - b0, 2, o.bal.c, ' opacity=".45"'); }
    }
  }
  if (!lit) {
    if (o.grid) for (let g = 0; g <= cols; g += 2) R(Math.min(g * 10, W - 1.4), 3, 1.4, top - 3, o.grid);
    bands.forEach((b) => { if (b.k === 'win') return; R(b.x * W, 3, b.w * W, top - 3, b.c); if (b.k === 'slit') R((b.x + b.w * 0.38) * W, 5, b.w * 0.24 * W, top - 8, 'url(#g)'); });
    if (o.crown) R(0, 0, W, 4.2, o.crown); else R(0, 2.2, W, 1, '#000', ' opacity=".18"');
  }
  if (pn) {
    const py = H - pn * 10, k = o.pod.k;
    if (!lit) {
      R(0, py, W, pn * 10, o.pod.c);
      if (k === 'glass') for (let p = 0; p < cols; p++) R(p * 10 + 1, py + 2, 8, pn * 10 - 3, 'url(#g)');
      if (k === 'wood') { for (let x = 0.6; x < W; x += 1.8) R(x, py + 1, 0.7, pn * 10 - 1, '#000', ' opacity=".22"'); R(W * 0.38, H - 7.5, W * 0.24, 7.5, 'url(#g)'); }
      if (k === 'green') for (let gg = 0; gg < W * pn * 1.4; gg++) out.push(`<circle cx="${(r() * W).toFixed(1)}" cy="${(py + 1 + r() * (pn * 10 - 2)).toFixed(1)}" r="${(0.8 + r() * 1.4).toFixed(1)}" fill="${['#3f7a3a', '#5c9a4a', '#2c5a2c'][gg % 3]}"/>`);
      if (k === 'solid' || k === 'neon') R(W * 0.38, H - 7.5, W * 0.24, 7.5, 'url(#g)');
      if (k === 'neon') for (let nn = 0; nn < 5; nn++) out.push(`<line x1="${(r() * W).toFixed(1)}" y1="${py + 1}" x2="${(r() * W).toFixed(1)}" y2="${H - 1}" stroke="#ff4fa3" stroke-width=".6"/>`);
      R(0, py, W, 0.8, '#000', ' opacity=".25"');
    } else if (k === 'glass') { for (let p = 0; p < cols; p++) R(p * 10 + 1, py + 2, 8, pn * 10 - 3, '#ffcf7a'); }
    else R(W * 0.38, H - 7.5, W * 0.24, 7.5, '#ffd88a');
  }
  const defs = lit ? '' : `<defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#a9bdd3"/><stop offset=".45" stop-color="${o.glass}"/><stop offset="1" stop-color="${o.glass}"/></linearGradient></defs>`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 3}" height="${H * 3}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${lit ? `<rect width="${W}" height="${H}" fill="#000"/>` : ''}${defs}${out.join('')}</svg>`, W, H };
}
function svgTex(svg) {
  return new Promise((res) => { const im = new Image(); im.onload = () => { const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; res(t); }; im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
}

// ---------- chão: ruas, verde e água desenhados num canvas ----------
function groundTex(data, px) {
  const RG = data.RG, cv = document.createElement('canvas'); cv.width = cv.height = px; const g = cv.getContext('2d'), k = px / (2 * RG);
  const T = (x) => (x + RG) * k;
  g.fillStyle = '#d9d3c6'; g.fillRect(0, 0, px, px); // terreno claro (quadras)
  const grain = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px * 0.7); grain.addColorStop(0, 'rgba(255,248,235,0.0)'); grain.addColorStop(1, 'rgba(120,110,100,0.18)'); g.fillStyle = grain; g.fillRect(0, 0, px, px);
  const path = (a) => { g.beginPath(); for (let i = 1; i < a.length; i += 2) { const x = T(a[i]), y = T(a[i + 1]); if (i === 1) g.moveTo(x, y); else g.lineTo(x, y); } };
  g.fillStyle = '#9fbf86'; data.g.forEach((a) => { path(a); g.closePath(); g.fill(); });
  data.w.forEach((a) => { path(a); if (a[0] === 0) { g.closePath(); g.fillStyle = '#6fa9c4'; g.fill(); } else { g.strokeStyle = '#6fa9c4'; g.lineWidth = Math.max(2, a[0] * k); g.lineCap = 'round'; g.stroke(); } });
  g.lineCap = 'round'; g.lineJoin = 'round';
  // calçada clara + asfalto
  const rs = data.r.slice().sort((a, b) => a[0] - b[0]);
  rs.forEach((a) => { if (a[0] < 4) return; path(a); g.strokeStyle = '#efebe4'; g.lineWidth = (a[0] + 4) * k; g.stroke(); });
  rs.forEach((a) => { path(a); g.strokeStyle = a[0] >= 10 ? '#5d5a63' : a[0] >= 4 ? '#6d6a72' : '#c9c1b2'; g.lineWidth = Math.max(1, a[0] * k); g.stroke(); });
  rs.forEach((a) => { if (a[0] < 9) return; path(a); g.strokeStyle = 'rgba(255,240,200,0.55)'; g.setLineDash([3 * k, 4 * k]); g.lineWidth = Math.max(1, 0.25 * k); g.stroke(); g.setLineDash([]); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function init(stage, o) {
  // o: { id, url (json), d: {n,f,lazer,sobre,t}, fac, perto: [{n,lab,d,dx,dz,fix}], onNum(n), hint: {pt...} }
  const canvas = stage.querySelector('canvas'), pinBox = stage.querySelector('.ml-pins');
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const data = await fetch(o.url).then((r) => r.json());
  const RG = data.RG / U, RB = data.R / U;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { stage.classList.add('nogl'); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !touch; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe7cfb0, 60, 150);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.2, 900);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x4a4438, 0.95));
  const sunOff = new THREE.Vector3(-55, 48, 38), sun = new THREE.DirectionalLight(0xffe0b2, 2.3); sun.castShadow = true; scene.add(sun); scene.add(sun.target);
  sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 220 }); sun.shadow.bias = -0.0005;
  // céu de fim de tarde (o mesmo da maquete da praia)
  const SKY = { zen: new THREE.Color(0x173f66), mid: new THREE.Color(0x6a9cbc), hc: new THREE.Color(0xe2cdb6), hw: new THREE.Color(0xf2b676), glow: new THREE.Color(0xff9c45), core: new THREE.Color(0xffe6a8) };
  const sunDir = sunOff.clone().normalize(); sunDir.y = 0.06; sunDir.normalize();
  const HZ = 'vec3 hz(vec3 d){ vec2 a = normalize(d.xz + 1e-5); vec2 s = normalize(sunDir.xz); return mix(hc, hw, pow(max(dot(a, s), 0.0), 2.5)); }';
  const skyU = { sunDir: { value: sunDir }, zen: { value: SKY.zen }, mid: { value: SKY.mid }, hc: { value: SKY.hc }, hw: { value: SKY.hw }, glow: { value: SKY.glow }, core: { value: SKY.core } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 sunDir, zen, mid, hc, hw, glow, core; varying vec3 vD; ' + HZ + ' void main(){ vec3 d = normalize(vD); float h = d.y; vec3 c = hz(d); c = mix(c, mid, smoothstep(0.0, 0.1, h)); c = mix(c, zen, smoothstep(0.1, 0.45, h)); float sd = max(dot(d, sunDir), 0.0); c += glow * (pow(sd, 8.0) * 0.22 * (1.0 - smoothstep(0.0, 0.3, h)) + pow(sd, 80.0) * 0.45 + pow(sd, 900.0) * 0.7); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

  // chão
  const gt = groundTex(data, touch ? 2048 : 3072); gt.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const land = new THREE.Mesh(new THREE.PlaneGeometry(2 * RG, 2 * RG), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.97 }));
  land.rotation.x = -Math.PI / 2; land.receiveShadow = true; scene.add(land);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0xcfc7b8, roughness: 1 })); under.rotation.x = -Math.PI / 2; under.position.y = -0.02; scene.add(under);

  // vizinhança: contorno real de cada construção, janelas por andar que acendem
  {
    const vp = [], vc = [], vi = [], ix = [], c = new THREE.Color();
    const hs = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
    data.b.forEach((b, bi) => {
      const fl = b[0], n = (b.length - 1) / 2; if (n < 3) return;
      const xs = [], zs = []; for (let i = 0; i < n; i++) { xs.push(b[1 + i * 2] / 2 / U); zs.push(b[2 + i * 2] / 2 / U); }
      let a2 = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; a2 += xs[i] * zs[j] - xs[j] * zs[i]; }
      const top = fl * FH + 0.05, r = hs(bi + 1), tower = fl >= 5;
      if (tower) c.setHex([0xf1ede6, 0xe6ded0, 0xd9d9d6, 0xcbd5da, 0xeee4d4][r * 5 | 0]); else c.setHSL(0.08 + r * 0.05, 0.18 + r * 0.18, 0.8 + r * 0.08);
      const roof = tower ? new THREE.Color(0xb3afa8) : new THREE.Color().setHSL(0.03 + r * 0.03, 0.4, 0.45 + r * 0.08);
      const v0 = vp.length / 3;
      for (let i = 0; i < n; i++) { vp.push(xs[i], 0, zs[i]); vc.push(c.r, c.g, c.b); vi.push(0, r, tower ? 1 : 0); }
      for (let i = 0; i < n; i++) { vp.push(xs[i], top, zs[i]); vc.push(c.r, c.g, c.b); vi.push(0, r, tower ? 1 : 0); }
      for (let i = 0; i < n; i++) { vp.push(xs[i], top, zs[i]); vc.push(roof.r, roof.g, roof.b); vi.push(0, r, -1); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (a2 > 0) ix.push(v0 + i, v0 + n + j, v0 + j, v0 + i, v0 + n + i, v0 + n + j); else ix.push(v0 + i, v0 + j, v0 + n + j, v0 + i, v0 + n + j, v0 + n + i); }
      const tri = THREE.ShapeUtils.triangulateShape(xs.map((x, i) => new THREE.Vector2(x, zs[i])), []);
      tri.forEach(([p, q, s]) => { const cy = (zs[q] - zs[p]) * (xs[s] - xs[p]) - (xs[q] - xs[p]) * (zs[s] - zs[p]); if (cy > 0) ix.push(v0 + 2 * n + p, v0 + 2 * n + q, v0 + 2 * n + s); else ix.push(v0 + 2 * n + p, v0 + 2 * n + s, v0 + 2 * n + q); });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(vc, 3)); g.setAttribute('aI', new THREE.Float32BufferAttribute(vi, 3));
    g.setIndex(vp.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(ix, 1) : new THREE.Uint16BufferAttribute(ix, 1));
    const cm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.02, flatShading: true });
    cm.onBeforeCompile = (sh) => {
      sh.uniforms.uFH = { value: FH };
      sh.vertexShader = 'attribute vec3 aI; varying vec3 vI; varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vI = aI;');
      sh.fragmentShader = 'uniform float uFH; varying vec3 vI; varying vec3 vWp;\n float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (vI.z > -0.5) {
          vec3 wn = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
          if (abs(wn.y) < 0.5) {
            vec2 tg = normalize(vec2(-wn.z, wn.x)); float u = dot(vWp.xz, tg) / (vI.z > 0.5 ? 0.34 : 0.42); float v = (vWp.y - vI.x) / uFH;
            vec2 cell = floor(vec2(u, v)), f = fract(vec2(u, v));
            float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.82);
            float aa = clamp(1.0 - (max(fwidth(u), fwidth(v)) - 0.1) * 4.5, 0.0, 1.0);
            float lit = step(vI.z > 0.5 ? 0.62 : 0.78, hh(cell + vI.y * 97.0));
            float wm = mix(0.3, win, aa) * (vI.z > 0.5 ? 1.0 : 0.6);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.23, 0.28), wm * 0.75);
            roughnessFactor = mix(roughnessFactor, 0.2, wm);
            totalEmissiveRadiance += vec3(1.0, 0.7, 0.4) * mix(0.33 * (vI.z > 0.5 ? 0.38 : 0.2), win * lit, aa) * 0.9;
          }
        }`);
    };
    const city = new THREE.Mesh(g, cm); city.castShadow = true; city.receiveShadow = true; scene.add(city);
  }

  // o empreendimento: tamanho real, fachada desenhada, sobe andar por andar
  const col = ST[o.d.f] || 0xc4b8f7, emp = new THREE.Group(); scene.add(emp);
  const E = data.emp, f = Object.assign({ fl: 8, w: 4, d: 4, wall: '#e7e5e1', glass: '#2c323b', pod: { n: 1, c: '#d0ccc4', k: 'solid' } }, o.fac || {});
  const pool = /piscina/i.test((o.d.lazer || []).join(' ')) && /rooftop|cobertura|terra[cç]o/i.test((o.d.lazer || []).join(' ') + ' ' + (o.d.sobre || ''));
  let topY = 0;
  if (E.lot) {
    // loteamento: a área marcada no chão, com lotes desenhados
    const lc = document.createElement('canvas'); lc.width = lc.height = 512; const lg = lc.getContext('2d');
    lg.fillStyle = 'rgba(159,191,134,0.55)'; lg.fillRect(0, 0, 512, 512); lg.strokeStyle = 'rgba(255,255,255,0.8)'; lg.lineWidth = 3; for (let i = 0; i <= 512; i += 51.2) { lg.beginPath(); lg.moveTo(i, 0); lg.lineTo(i, 512); lg.moveTo(0, i); lg.lineTo(512, i); lg.stroke(); }
    const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthWrite: false })); lm.rotation.x = -Math.PI / 2; lm.position.y = 0.03; emp.add(lm);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(24, 0.01, 24)), new THREE.LineBasicMaterial({ color: col })); edge.position.y = 0.05; emp.add(edge);
    topY = 1;
  } else {
    const r = rnd(hash(o.id));
    for (const t of E.tw) {
      const fo = Object.assign({}, f, { fl: t.fl || f.fl }), cw = Math.max(2, Math.round(t.w / 5)), cd = Math.max(2, Math.round(t.d / 5));
      const fa = faceSvg(fo, cw, false, false, r), fs = faceSvg(fo, cd, true, false, r), la = faceSvg(fo, cw, false, true, r), ls = faceSvg(fo, cd, true, true, r);
      const [ta, ts, tla, tls] = await Promise.all([svgTex(fa.svg), svgTex(fs.svg), svgTex(la.svg), svgTex(ls.svg)]);
      const h = fo.fl * FH, w = t.w / U, d = t.d / U;
      const mk = (map, em) => new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.55, metalness: 0.05 });
      const roofM = new THREE.MeshStandardMaterial({ color: new THREE.Color(f.crown || '#7a7680'), roughness: 0.8 });
      const mats = [mk(ts, tls), mk(ts, tls), roofM, roofM, mk(ta, tla), mk(ta, tla)];
      const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
      const m = new THREE.Mesh(geo, mats); m.castShadow = true; m.receiveShadow = true;
      const pv = new THREE.Group(); pv.position.set(t.x / U, 0, t.z / U); pv.rotation.y = -t.a; pv.add(m); emp.add(pv);
      // contorno na cor da fase
      const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.55 })); m.add(ed);
      if (pool && t === E.tw[0] && !E.casa) { const pm = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, 0.02, d * 0.3), new THREE.MeshStandardMaterial({ color: 0x4fd0e0, emissive: 0x1a8aa0, emissiveIntensity: 0.5, roughness: 0.1 })); pm.position.y = h + 0.02; m.add(pm); }
      pv.userData = { m, mats, h }; topY = Math.max(topY, h);
    }
  }
  // anel no chão e feixe de luz, para achar o empreendimento
  const ring = new THREE.Mesh(new THREE.RingGeometry(E.lot ? 13 : 2.6, E.lot ? 13.6 : 3.0, 64), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; emp.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.5, 14, 20, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(col) } },
    vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 c; varying float vY; void main(){ gl_FragColor = vec4(c, smoothstep(7.0, -7.0, vY) * 0.45); }' }));
  beam.position.y = topY + 7.4; emp.add(beam);

  // pinos: números dos lugares por perto (sempre por cima, nunca escondidos atrás do prédio) + nome do empreendimento
  const pins = [], v = new THREE.Vector3();
  const tag = document.createElement('span'); tag.className = 'ml-tag'; tag.innerHTML = '<i></i>' + o.d.n.replace(/</g, '&lt;'); tag.style.setProperty('--tc', '#' + col.toString(16).padStart(6, '0')); pinBox.appendChild(tag);
  pins.push({ el: tag, v: new THREE.Vector3(0, topY + 0.8, 0), tag: true });
  (o.perto || []).forEach((p, i) => {
    if (Math.abs(p.dx) > data.RG || Math.abs(p.dz) > data.RG) return;
    const b = document.createElement('b'); b.className = 'ml-n' + (p.fix ? ' u' : ''); b.textContent = i + 1; b.title = p.n; pinBox.appendChild(b);
    b.addEventListener('click', () => { if (o.onNum) o.onNum(i + 1); });
    pins.push({ el: b, v: new THREE.Vector3(p.dx / U, 0.2, p.dz / U), n: i + 1 });
  });
  (o.labels || []).forEach((l) => { const s2 = document.createElement('span'); s2.className = 'ml-lab'; s2.textContent = l.t; pinBox.appendChild(s2); pins.push({ el: s2, v: new THREE.Vector3(l.dx / U, l.y || 0.5, l.dz / U), lab: true }); });
  // caminho até o lugar escolhido na lista
  const pathM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, L: { value: 1 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float t, L; varying vec2 vU; void main(){ float d = fract(vU.x * L / 2.0 - t * 0.8); float a = step(0.45, d) * (1.0 - abs(vU.y - 0.5) * 1.6); gl_FragColor = vec4(1.0, 0.78, 0.3, a); }' });
  const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.9), pathM); pathMesh.rotation.x = -Math.PI / 2; pathMesh.position.y = 0.08; pathMesh.visible = false; scene.add(pathMesh);
  let hiN = 0;
  function hi(n) {
    dirty = true; hiN = n; pins.forEach((p) => { if (p.n) p.el.classList.toggle('hi', p.n === n); });
    const p = pins.find((x) => x.n === n); if (!p) { pathMesh.visible = false; return; }
    const L = Math.hypot(p.v.x, p.v.z); pathMesh.scale.set(L, 1, 1); pathMesh.position.set(p.v.x / 2, 0.08, p.v.z / 2); pathMesh.rotation.set(-Math.PI / 2, 0, -Math.atan2(p.v.z, p.v.x)); pathM.uniforms.L.value = L; pathMesh.visible = true;
  }

  // controles: como na maquete da praia (arrastar anda, botão direito/Shift/dois dedos giram, roda aproxima onde aponta)
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = true; controls.screenSpacePanning = false; controls.enableZoom = true; controls.zoomToCursor = true;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.minDistance = 4; controls.maxDistance = 140; controls.minPolarAngle = 0.2; controls.maxPolarAngle = 1.38;
  canvas.style.touchAction = 'pan-y'; // no celular, arrastar para cima/baixo continua rolando a página; de lado gira; dois dedos aproximam
  let wheelOk = false;
  canvas.addEventListener('wheel', (e) => { if (!wheelOk && !e.ctrlKey) { e.stopImmediatePropagation(); stage.classList.add('wh'); clearTimeout(stage._wh); stage._wh = setTimeout(() => stage.classList.remove('wh'), 1400); } }, { capture: true });
  canvas.addEventListener('pointerdown', () => { wheelOk = true; });
  stage.addEventListener('mouseleave', () => { wheelOk = false; });
  let fly = null, sway = true, swayBase = null, swayT0 = 0, dirty = true;
  controls.addEventListener('start', () => { fly = null; sway = false; });
  controls.addEventListener('change', () => { dirty = true; });

  // enquadramento: o prédio no centro, em diagonal, com os lugares mais perto na tela
  const UP = new THREE.Vector3(0, 1, 0);
  function home() {
    const pts = [new THREE.Vector3(0, topY, 0)], pn = pins.filter((p) => p.n).sort((p, q) => Math.hypot(p.v.x, p.v.z) - Math.hypot(q.v.x, q.v.z)); pn.forEach((p, i) => { const dd = Math.hypot(p.v.x, p.v.z); if (dd < 26 || (i < 3 && dd < 40)) pts.push(p.v); });
    const tg = new THREE.Vector3(0, Math.min(topY * 0.4, 2.5), 0), dir = new THREE.Vector3(0.62, 0.62, 0.48).normalize(), cam = camera.clone(), pv = new THREE.Vector3();
    let d = Math.max(pts.length > 1 ? 16 : 34, topY * 2.6);
    for (let i = 0; i < 60; i++) { cam.position.copy(dir).multiplyScalar(d).add(tg); cam.lookAt(tg); cam.updateMatrixWorld(); if (pts.every((p) => { pv.copy(p).project(cam); return Math.abs(pv.x) < 0.86 && Math.abs(pv.y) < 0.8; })) break; d *= 1.06; }
    return { tg, p: dir.multiplyScalar(d).add(tg) };
  }
  function go(to, dur = 1800) { fly = { t0: performance.now(), d: dur, p0: camera.position.clone(), q0: controls.target.clone(), p1: to.p, q1: to.tg }; }
  function zoomIn() { const tg = new THREE.Vector3(0, topY * 0.5, 0), off = camera.position.clone().sub(controls.target).setY(0).normalize(); go({ tg, p: tg.clone().add(off.multiplyScalar(Math.max(11, topY * 2.2))).setY(Math.max(5, topY * 1.25)) }, 1400); sway = false; }

  // tamanho
  function resize() { dirty = true; const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const H0 = home(); controls.target.copy(H0.tg); camera.position.copy(H0.tg).add(H0.p.clone().sub(H0.tg).multiplyScalar(2.2).setY(H0.p.y * 2.6));
  controls.maxDistance = Math.max(60, H0.p.distanceTo(H0.tg) * 2.2);

  let t0 = null, alive = true, visible = true, raf = 0;
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }); io.observe(stage);
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), clock = new THREE.Clock();
  function start() { if (t0) return; t0 = performance.now(); go(H0, 2400); stage.classList.add('on'); }
  function frame() {
    if (!alive) return; raf = requestAnimationFrame(frame); if (!visible) return;
    const now = performance.now(), dt = Math.min(clock.getDelta(), 0.05); pathM.uniforms.t.value += dt;
    if (sway && t0 && now - t0 > 14000) sway = false; // gira devagar só no começo; depois fica parada até mexer
    const anim = (t0 && now - t0 < 4200) || fly || (sway && t0) || pathMesh.visible;
    if (!anim && !dirty) { controls.update(); if (!dirty) return; }
    dirty = false;
    // sobe andar por andar e as janelas acendem
    const k = t0 ? Math.max(0, Math.min(1, (now - t0 - 900) / 1800)) : 0, e = 1 - Math.pow(1 - k, 3), lk = t0 ? Math.max(0, Math.min(1, (now - t0 - 2600) / 1200)) : 0;
    emp.children.forEach((ch) => { if (ch.userData.m) { ch.scale.y = Math.max(0.001, e); ch.userData.mats.forEach((m) => { if (m.emissiveMap) m.emissiveIntensity = 0.9 * lk; }); } });
    beam.visible = e > 0.95; ring.material.opacity = 0.5 + 0.35 * Math.sin(now / 500);
    if (fly) { const kk = Math.min(1, (now - fly.t0) / fly.d), ee = ease(kk); camera.position.lerpVectors(fly.p0, fly.p1, ee); controls.target.lerpVectors(fly.q0, fly.q1, ee); if (kk >= 1) { fly = null; swayBase = null; } }
    else if (sway && t0) { if (!swayBase) { swayBase = camera.position.clone().sub(controls.target); swayT0 = now; } camera.position.copy(swayBase).applyAxisAngle(UP, 0.22 * Math.sin((now - swayT0) / 5200)).add(controls.target); }
    controls.update();
    const tt = controls.target; tt.x = Math.max(-RG * 0.9, Math.min(RG * 0.9, tt.x)); tt.z = Math.max(-RG * 0.9, Math.min(RG * 0.9, tt.z)); tt.y = Math.max(0, Math.min(12, tt.y));
    const cd = camera.position.distanceTo(tt); scene.fog.near = cd + 25; scene.fog.far = cd + 110;
    sun.position.copy(tt).add(sunOff); sun.target.position.copy(tt); const sr = Math.max(25, Math.min(90, cd * 1.2)); const sc = sun.shadow.camera; sc.left = sc.bottom = -sr; sc.right = sc.top = sr; sc.updateProjectionMatrix();
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight, used = []; let tagXY = null;
    pins.forEach((p) => {
      v.copy(p.v).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02;
      let x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      if (!p.tag && !p.lab) { used.forEach((u) => { if (Math.abs(u[0] - x) < 24 && Math.abs(u[1] - y) < 26) y = u[1] - 26; }); used.push([x, y]); }
      let ok = on && (p.tag ? e > 0.9 : t0 && now - t0 > 2200); if (p.lab && tagXY && Math.abs(x - tagXY[0]) < 110 && Math.abs(y - tagXY[1]) < 40) ok = false; if (p.tag) tagXY = [x, y];
      p.el.style.opacity = ok ? '1' : '0'; p.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
  }
  raf = requestAnimationFrame(frame);
  stage.classList.add('gl');
  return {
    start, hi, zoom: () => { const near = camera.position.distanceTo(controls.target) < H0.p.distanceTo(H0.tg) * 0.7; if (near) go(H0, 1400); else zoomIn(); return !near; },
    home: () => go(H0, 1400),
    destroy() { alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); controls.dispose(); scene.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach((m) => { if (m.map) m.map.dispose(); if (m.emissiveMap) m.emissiveMap.dispose(); m.dispose(); }); }); renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {} pinBox.innerHTML = ''; stage.classList.remove('gl', 'on'); },
  };
}
