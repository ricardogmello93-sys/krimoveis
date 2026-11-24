// Prédio por dentro (Eclipse, Levve...): o andar escolhido na maquete vira 3D. A planta do andar é o piso e as paredes sobem
// a partir dela; toque num apartamento: a câmera vai até ele e abre a ficha (área, cômodos, sol, planta). "Entrar no
// apartamento" desce até o piso e troca para a planta humanizada daquela unidade em 3D (paredes subindo sobre os móveis);
// dali, "Ver o decorado" abre as fotos. Dados: js/sm-local/<id>-andares.json (C:/kr-cut/eclipse/build-*.mjs). Sem preço e sem
// situação de venda (regra: tabela não entra no site).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';

const WH = 1.5; // paredes cortadas a 1,5 m (como planta 3D: dá para ver dentro dos cômodos)
const CSS = `
.ea { position: fixed; inset: 0; z-index: 9990; background: radial-gradient(ellipse at 50% 35%, #2a2160 0%, #120e2a 55%, #08061a 100%); color: #f4f2ee; font-family: 'DM Sans', sans-serif; opacity: 0; transition: opacity .6s; overscroll-behavior: contain; }
.ea.on { opacity: 1; }
.ea canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; touch-action: none; }
.ea canvas.pt { cursor: pointer; }
.ea-pins { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.ea-pin { position: absolute; left: 0; top: 0; translate: -50% -50%; pointer-events: auto; cursor: pointer; border: 0; padding: 5px 10px 6px; border-radius: 100px; font: 600 12px 'DM Sans', sans-serif; color: #0b091c; background: rgba(243,234,219,.94); box-shadow: 0 6px 18px rgba(0,0,0,.4); white-space: nowrap; transition: opacity .4s, background .3s; }
.ea-pin small { font-weight: 400; opacity: .7; margin-left: 5px; font-size: 11px; }
.ea-pin:hover, .ea-pin.on { background: linear-gradient(135deg, #f3eadb, #e2c77e); }
.ea-pin.dim { opacity: .25; }
.ea-pins.mini .ea-pin { padding: 3px 7px 4px; font-size: 10.5px; } .ea-pins.mini .ea-pin small { display: none; }
.ea-top { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: linear-gradient(180deg, rgba(8,6,26,.85), rgba(8,6,26,0)); pointer-events: none; }
.ea-top > * { pointer-events: auto; }
.ea-b { border: 1px solid rgba(226,199,126,.45); background: rgba(11,9,28,.72); color: #f3eadb; font: 500 12px 'DM Sans', sans-serif; letter-spacing: 1.2px; text-transform: uppercase; padding: 10px 14px; border-radius: 100px; cursor: pointer; backdrop-filter: blur(8px); }
.ea-b:hover { background: rgba(226,199,126,.18); }
.ea-b.g { border: 0; color: #0b091c; background: linear-gradient(135deg, #f3eadb, #e2c77e 60%, #c9a84c); font-weight: 600; }
.ea-tt { flex: 1; min-width: 0; }
.ea-tt small { display: block; font-size: 10.5px; letter-spacing: 2.2px; text-transform: uppercase; color: #e2c77e; }
.ea-tt b { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 28px; line-height: 1.1; }
.ea-fl { display: flex; flex-direction: column; border-radius: 14px; overflow: hidden; border: 1px solid rgba(226,199,126,.45); background: rgba(11,9,28,.72); }
.ea-fl[hidden] { display: none; }
.ea-fl button { width: 44px; height: 30px; border: 0; background: none; color: #f1e3bd; cursor: pointer; font-size: 12px; }
.ea-fl button + button { border-top: 1px solid rgba(226,199,126,.22); }
.ea-fl button:hover { background: rgba(226,199,126,.16); } .ea-fl button:disabled { opacity: .3; cursor: default; }
.ea-x { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(226,199,126,.45); background: rgba(11,9,28,.72); color: #f3eadb; font-size: 22px; line-height: 1; cursor: pointer; }
.ea-hint { position: absolute; left: 50%; bottom: 22px; translate: -50% 0; padding: 10px 16px; border-radius: 100px; font-size: 13px; background: rgba(11,9,28,.82); border: 1px solid rgba(226,199,126,.35); pointer-events: none; transition: opacity .5s; white-space: nowrap; }
.ea-ub { position: absolute; left: 50%; bottom: 20px; translate: -50% 0; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: calc(100% - 24px); transition: opacity .4s; }
.ea-ub[hidden] { display: none; }
.ea-p { position: absolute; right: 16px; top: 78px; bottom: 16px; width: 360px; overflow: auto; padding: 22px 22px 18px; border-radius: 22px; background: rgba(13,10,34,.9); border: 1px solid rgba(226,199,126,.3); box-shadow: 0 30px 80px rgba(0,0,0,.5); backdrop-filter: blur(12px); transform: translateX(calc(100% + 30px)); transition: transform .55s cubic-bezier(.2,.8,.2,1); }
.ea-p.on { transform: none; }
.ea-p .px { position: absolute; right: 12px; top: 12px; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(226,199,126,.35); background: none; color: #f3eadb; font-size: 18px; cursor: pointer; }
.ea-p small.k { font-size: 10.5px; letter-spacing: 2.4px; text-transform: uppercase; color: #e2c77e; }
.ea-p h3 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 44px; line-height: 1; margin: 4px 0 2px; }
.ea-p .s { font-size: 13.5px; opacity: .75; }
.ea-st { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0 12px; }
.ea-st div { padding: 10px 8px; border-radius: 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(226,199,126,.18); text-align: center; }
.ea-st b { display: block; font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 24px; line-height: 1.1; color: #f3eadb; }
.ea-st small { font-size: 11.5px; opacity: .7; }
.ea-face { font-size: 13px; line-height: 1.5; padding: 9px 12px; border-radius: 12px; background: rgba(226,199,126,.08); border: 1px solid rgba(226,199,126,.2); margin: 0 0 14px; }
.ea-face small { opacity: .6; }
.ea-go { width: 100%; border: 0; cursor: pointer; padding: 15px 18px; border-radius: 100px; font: 600 12.5px 'DM Sans', sans-serif; letter-spacing: 1.6px; text-transform: uppercase; color: #0b091c; background: linear-gradient(135deg, #f3eadb, #e2c77e 60%, #c9a84c); box-shadow: 0 14px 34px rgba(201,168,76,.28); }
.ea-pl { display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 10px; padding: 8px; border-radius: 16px; border: 1px solid rgba(226,199,126,.3); background: rgba(255,255,255,.04); color: inherit; font: 500 13.5px 'DM Sans', sans-serif; cursor: pointer; text-align: left; }
.ea-pl img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; background: #fff; }
.ea-pl:hover { background: rgba(226,199,126,.12); }
.ea-c { list-style: none; margin: 16px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }
.ea-c li { display: flex; justify-content: space-between; gap: 8px; font-size: 12.5px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.07); }
.ea-c li span { opacity: .72; } .ea-c li b { font-weight: 500; white-space: nowrap; }
.ea-a { display: block; margin-top: 14px; font-size: 14px; color: #e2c77e; text-decoration: underline; text-decoration-color: rgba(226,199,126,.4); text-underline-offset: 4px; }
.ea-n { font-size: 11px; line-height: 1.5; opacity: .5; margin: 14px 0 0; }
.ea-lb, .ea-in { position: absolute; inset: 0; z-index: 5; background: rgba(6,4,16,.96); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .5s; }
.ea-lb.on, .ea-in.on { opacity: 1; }
.ea-lb[hidden], .ea-in[hidden] { display: none; }
.ea-lb .sc { position: absolute; inset: 64px 12px 12px; overflow: auto; display: flex; align-items: flex-start; justify-content: center; }
.ea-lb img { max-width: 100%; height: auto; border-radius: 12px; background: #fff; cursor: zoom-in; }
.ea-lb img.z { max-width: none; width: 200%; cursor: zoom-out; }
.ea-cl { position: absolute; right: 16px; top: 14px; z-index: 2; }
.ea-in { overflow: hidden; }
.ea-in img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1.2s; }
.ea-in img.on { opacity: 1; animation: eaKb 9s ease-out forwards; }
@keyframes eaKb { from { transform: scale(1.12) translate(1.5%, 1%); } to { transform: scale(1) translate(0, 0); } }
.ea-in .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 60px 24px 26px; background: linear-gradient(0deg, rgba(6,4,16,.9), rgba(6,4,16,0)); display: flex; align-items: flex-end; gap: 14px; }
.ea-in .cap div { flex: 1; } .ea-in .cap small { display: block; font-size: 10.5px; letter-spacing: 2.4px; text-transform: uppercase; color: #e2c77e; }
.ea-in .cap b { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 30px; }
.ea-in .cap p { font-size: 11.5px; opacity: .6; margin: 4px 0 0; }
.ea-in .nv { width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(226,199,126,.5); background: rgba(11,9,28,.6); color: #f3eadb; font-size: 20px; cursor: pointer; }
.ea-wh { position: absolute; inset: 0; z-index: 6; background: #fbf7f0; opacity: 0; pointer-events: none; transition: opacity .45s; }
.ea-wh.on { opacity: 1; }
@media (max-width: 760px) {
  .ea-top { padding: 10px 10px; gap: 8px; } .ea-tt b { font-size: 21px; } .ea-b { padding: 9px 11px; font-size: 11px; letter-spacing: .8px; }
  .ea-p { left: 0; right: 0; top: auto; bottom: 0; width: auto; max-height: 64vh; border-radius: 22px 22px 0 0; transform: translateY(calc(100% + 20px)); padding: 18px 18px 22px; }
  .ea-p h3 { font-size: 36px; } .ea-c { grid-template-columns: 1fr; }
  .ea-hint { bottom: 16px; font-size: 12px; }
  .ea-ub { flex-wrap: nowrap; gap: 6px; bottom: 14px; } .ea-ub .ea-b { padding: 10px 12px; font-size: 10.5px; letter-spacing: .6px; white-space: nowrap; }
  .ea-in .cap b { font-size: 22px; } .ea-in .cap { padding: 50px 14px 18px; }
}
`;
const fm = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; }
function centro(p) { let a = 0, cx = 0, cy = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const f = p[j][0] * p[i][1] - p[i][0] * p[j][1]; a += f; cx += (p[j][0] + p[i][0]) * f; cy += (p[j][1] + p[i][1]) * f; } a *= 3; return [cx / a, cy / a]; }
const curto = (d) => (!d.dorm ? 'studio' : d.su && d.su === d.dorm && d.dorm > 1 ? d.su + ' suítes' : d.dorm + ' dorm.');

const cache = {};
export async function abrir(cfg) {
  // cfg: { url, andar, K (WhatsApp), sim (link do simulador), onClose }
  const D = cache[cfg.url] || (cache[cfg.url] = await fetch(cfg.url).then((r) => r.json()));
  const AND = Object.keys(D.andares).map(Number).sort((a, b) => a - b), A0 = AND[0], A1 = AND[AND.length - 1];
  if (!document.getElementById('eaCss')) { const s = document.createElement('style'); s.id = 'eaCss'; s.textContent = CSS; document.head.appendChild(s); }
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const root = document.createElement('div'); root.className = 'ea'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', D.n + ' por dentro');
  root.innerHTML = `<canvas></canvas><div class="ea-pins"></div>
    <div class="ea-top"><button type="button" class="ea-b ea-bk">← Prédio</button><div class="ea-tt"><small>${esc(D.n)}</small><b></b></div>
      <div class="ea-fl"><button type="button" data-d="1" aria-label="Subir um andar">▲</button><button type="button" data-d="-1" aria-label="Descer um andar">▼</button></div>
      <button type="button" class="ea-x" aria-label="Fechar">×</button></div>
    <p class="ea-hint">Toque num apartamento para ver por dentro</p>
    <div class="ea-ub" hidden><button type="button" class="ea-b g" data-u="dec">Ver o decorado</button><button type="button" class="ea-b" data-u="fic">Ficha</button><button type="button" class="ea-b" data-u="vol">← Andar</button></div>
    <aside class="ea-p" aria-live="polite"></aside>
    <div class="ea-lb" hidden><button type="button" class="ea-b ea-cl">Fechar ×</button><div class="sc"><img alt=""></div></div>
    <div class="ea-in" hidden><button type="button" class="ea-b ea-cl">← Voltar</button><div class="cap"><div><small></small><b></b><p>${esc(D.fotoNota || 'Decorado ilustrativo')}</p></div><button type="button" class="nv" data-d="-1" aria-label="Anterior">‹</button><button type="button" class="nv" data-d="1" aria-label="Próxima">›</button></div></div>
    <div class="ea-wh"></div>`;
  document.body.appendChild(root); requestAnimationFrame(() => root.classList.add('on'));
  const q = (s) => root.querySelector(s), canvas = q('canvas'), pinBox = q('.ea-pins'), panel = q('.ea-p'), hint = q('.ea-hint'), ub = q('.ea-ub'), flb = q('.ea-fl');
  const prevOv = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { root.remove(); document.documentElement.style.overflow = prevOv; return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.6 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1200);
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x40384a, 1.0));
  const sun = new THREE.DirectionalLight(0xffe7c4, 2.2); sun.position.set(-14, 26, 10); sun.castShadow = true; scene.add(sun);
  sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  const fill = new THREE.DirectionalLight(0xc9d4ff, 0.35); fill.position.set(12, 10, -14); scene.add(fill);
  const world = new THREE.Group(); scene.add(world);
  const tl = new THREE.TextureLoader();
  const loadTex = (src) => new Promise((res) => tl.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); res(t); }, undefined, () => res(null)));
  function sombra(sz) { sun.shadow.camera.left = sun.shadow.camera.bottom = -sz; sun.shadow.camera.right = sun.shadow.camera.top = sz; sun.shadow.camera.far = 90; sun.shadow.camera.updateProjectionMatrix(); }
  function dispose(g) { g.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }); }

  // piso com a imagem + laje + sombra + paredes (retângulos escuros da planta viram blocos de topo escuro e lados claros)
  function laje(g, tex, Wm, Hm, slabCol, recorte) {
    // recorte: a imagem já vem só com o contorno do prédio (transparente em volta); sem a laje retangular
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(Wm, Hm), new THREE.MeshStandardMaterial(Object.assign({ map: tex, roughness: 0.82 }, recorte ? { transparent: true, alphaTest: 0.45 } : {}))); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    if (recorte) { const under = new THREE.Mesh(new THREE.PlaneGeometry(Wm, Hm), new THREE.MeshStandardMaterial({ map: tex, color: 0x8d8579, transparent: true, alphaTest: 0.45, roughness: 1 })); under.rotation.x = -Math.PI / 2; under.position.y = -0.32; g.add(under); }
    else { const slab = new THREE.Mesh(new THREE.BoxGeometry(Wm + Math.max(Wm, Hm) * 0.02, 0.3, Hm + Math.max(Wm, Hm) * 0.02), new THREE.MeshStandardMaterial({ color: slabCol || 0xe9e3d9, roughness: 0.9 })); slab.position.y = -0.155; slab.receiveShadow = true; g.add(slab); }
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sx = sc.getContext('2d'), gr = sx.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(Wm * 1.9, Hm * 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = -Math.max(Wm, Hm) * 0.09; g.add(sh);
  }
  function paredes(g, r, ppm, Wm, Hm, h, topHex, sideHex) {
    const X = (px) => px / ppm - Wm / 2, Z = (py) => py / ppm - Hm / 2;
    const pos = [], nor = [], col = [], top = new THREE.Color(topHex || 0x3b3936), side = new THREE.Color(sideHex || 0xf3eee7);
    const quad = (a, b, c, d, n, cl) => { for (const p of [a, b, c, a, c, d]) { pos.push(...p); nor.push(...n); col.push(cl.r, cl.g, cl.b); } };
    for (const [x, y, w, hh] of r) {
      const x0 = X(x), x1 = X(x + w), z0 = Z(y), z1 = Z(y + hh);
      quad([x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], [0, 1, 0], top);
      quad([x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], [0, 0, 1], side);
      quad([x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], [0, 0, -1], side);
      quad([x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1], [1, 0, 0], side);
      quad([x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0], [-1, 0, 0], side);
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const walls = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 })); walls.castShadow = true; walls.receiveShadow = true; walls.scale.y = 0.001; g.add(walls);
    return walls;
  }

  // ---- o andar
  let P = null, U = null, pavAtual = '', andar = AND.includes(cfg.andar) ? cfg.andar : A0;
  const info = (num) => { const e = D.andares[andar].un[num], t = D.tipos[e[1]]; return Object.assign({}, t, { num, zk: e[0], tk: e[1], face: e[2] || t.face, a: e[3] || t.a, t: e[4] || t.t }); };
  async function monta(pk) {
    if (P) { world.remove(P.g); dispose(P.g); } pinBox.innerHTML = ''; pavAtual = pk;
    const pv = D.pav[pk], ppm = pv.ppm, Wm = pv.W / ppm, Hm = pv.H / ppm, X = (px) => px / ppm - Wm / 2, Z = (py) => py / ppm - Hm / 2;
    const g = new THREE.Group(); world.add(g); laje(g, await loadTex(pv.img), Wm, Hm, pv.laje, pv.recorte); sombra(Math.max(Wm, Hm) * 0.75);
    const ph = pv.wh || WH, walls = paredes(g, pv.r, ppm, Wm, Hm, ph, pv.top, pv.lado);
    const zs = {};
    for (const [zk, pts] of Object.entries(pv.z)) {
      const shp = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(X(x), -Z(y))));
      const hl = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshBasicMaterial({ color: 0xf2cf7a, transparent: true, opacity: 0, depthWrite: false })); hl.rotation.x = -Math.PI / 2; hl.position.y = 0.03; g.add(hl);
      const vl = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshBasicMaterial({ color: 0x0b091c, transparent: true, opacity: 0, depthWrite: false })); vl.rotation.x = -Math.PI / 2; vl.position.y = ph + 0.03; g.add(vl);
      const c = centro(pts), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      zs[zk] = { zk, pts, hl, vl, c: new THREE.Vector3(X(c[0]), ph + 0.4, Z(c[1])), size: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / ppm, hlT: 0, vlT: 0, pin: null, num: null };
    }
    P = { pk, pv, Wm, Hm, g, walls, zs, rise: performance.now() };
    rotulos();
  }
  function rotulos() {
    pinBox.innerHTML = ''; const un = D.andares[andar].un;
    Object.values(P.zs).forEach((z) => { z.num = null; z.pin = null; });
    for (const num of Object.keys(un)) {
      const z = P.zs[un[num][0]]; if (!z) continue; const d = info(num);
      const pin = document.createElement('button'); pin.type = 'button'; pin.className = 'ea-pin'; pin.innerHTML = num + '<small>' + curto(d) + '</small>'; pin.addEventListener('click', () => escolhe(num)); pinBox.appendChild(pin);
      z.num = num; z.pin = pin;
    }
    pinBox.classList.toggle('mini', Object.keys(un).length > 12);
    q('.ea-tt b').textContent = D.andares[andar].nome || andar + 'º andar';
    q('[data-d="1"]').disabled = andar >= A1; q('[data-d="-1"]').disabled = andar <= A0;
  }
  const zonaDe = (num) => P && Object.values(P.zs).find((z) => z.num === num);

  // ---- câmera
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enableZoom = false; controls.screenSpacePanning = false;
  controls.minPolarAngle = 0.12; controls.maxPolarAngle = 1.32; controls.minDistance = 1.2; controls.maxDistance = 420;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  let dirty = true, fly = null, alive = true, raf = 0;
  controls.addEventListener('change', () => { dirty = true; }); controls.addEventListener('start', () => { fly = null; });
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const sph = (tg, r, pol, az) => new THREE.Vector3(Math.sin(pol) * Math.sin(az), Math.cos(pol), Math.sin(pol) * Math.cos(az)).multiplyScalar(r).add(tg);
  function go(tg, p, dur = 1400, then) { fly = { t0: performance.now(), d: dur, p0: camera.position.clone(), q0: controls.target.clone(), p1: p, q1: tg, then }; dirty = true; }
  const az = () => { const a = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z); return Number.isFinite(a) ? a : 0.35; };
  // distância para caber W x H (m) na tela, pelo campo de visão horizontal e vertical (celular em pé é estreito)
  const cabe = (W, H, a = az()) => { const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect), c = Math.abs(Math.cos(a)), s2 = Math.abs(Math.sin(a)), hx = W * c + H * s2, hz = W * s2 + H * c; return Math.max(hx * 0.54 / Math.tan(hf / 2), hz * 0.42 / Math.tan(vf / 2)) * 1.08; };
  const geral = (W, H, k = 1) => ({ tg: new THREE.Vector3(0, 0, 0), p: sph(new THREE.Vector3(0, 0, 0), cabe(W, H) * k, 0.78, az()) });
  let zq = 0;
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const k = e.deltaMode === 1 ? 0.03 : e.deltaMode === 2 ? 0.5 : 0.0011; zq = Math.max(-1.6, Math.min(1.6, zq + Math.max(-0.35, Math.min(0.35, e.deltaY * k)))); fly = null; dirty = true; }, { passive: false });
  const tp = new Map(); let pinch0 = 0; const spread = () => { const a = [...tp.values()]; return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); };
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; tp.set(e.pointerId, [e.clientX, e.clientY]); pinch0 = tp.size === 2 ? spread() : 0; });
  canvas.addEventListener('pointermove', (e) => { if (!tp.has(e.pointerId)) return; tp.set(e.pointerId, [e.clientX, e.clientY]); if (tp.size === 2 && pinch0) { const s = spread(); if (s > 0) { zq = Math.max(-1.6, Math.min(1.6, zq + Math.max(-0.3, Math.min(0.3, Math.log(pinch0 / s))))); pinch0 = s; dirty = true; } } });
  const tpEnd = (e) => { tp.delete(e.pointerId); pinch0 = 0; }; canvas.addEventListener('pointerup', tpEnd); canvas.addEventListener('pointercancel', tpEnd);
  function stepZoom() { if (Math.abs(zq) < 1e-4) { zq = 0; return; } const s = zq * 0.14; zq -= s; dirty = true; const off = camera.position.clone().sub(controls.target), d = off.length(), nd = Math.min(controls.maxDistance, Math.max(controls.minDistance, d * Math.exp(s))); camera.position.copy(controls.target).add(off.multiplyScalar(nd / d)); }

  // ---- escolher apartamento
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function zonaSob(cx, cy) {
    if (!P || U) return null; const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const pt = ray.ray.intersectPlane(plane, new THREE.Vector3()); if (!pt) return null;
    const px = (pt.x + P.Wm / 2) * P.pv.ppm, py = (pt.z + P.Hm / 2) * P.pv.ppm;
    return Object.values(P.zs).find((z) => z.num && inPoly(px, py, z.pts)) || null;
  }
  let hov = null, sel = null, down = null;
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; const z = zonaSob(e.clientX, e.clientY); if (z !== hov) { hov = z; dirty = true; canvas.classList.toggle('pt', !!z); } });
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY, performance.now()]; });
  canvas.addEventListener('pointerup', (e) => { if (!down || U) { down = null; return; } const mv = Math.hypot(e.clientX - down[0], e.clientY - down[1]), dt = performance.now() - down[2]; down = null; if (mv > 7 || dt > 600 || tp.size) return; const z = zonaSob(e.clientX, e.clientY); if (z) escolhe(z.num); else if (sel) solta(); });

  function foca(z, dur = 1300) {
    const tg = new THREE.Vector3(z.c.x, 0, z.c.z), r = cabe(z.size, z.size) * 1.6 + 4;
    if (camera.aspect < 0.8) tg.z += z.size * 0.45; // no celular a ficha cobre a parte de baixo
    go(tg, sph(tg, r, 0.6, az()), dur);
  }
  function escolhe(num) {
    const z = zonaDe(num); if (!z) return; sel = z; dirty = true; hint.style.opacity = '0'; foca(z); ficha(num);
    try { gtag('event', 'predio_apto', { emp: D.id, apto: num }); } catch (_) {}
  }
  function solta() { sel = null; dirty = true; panel.classList.remove('on'); const h = geral(P.Wm, P.Hm); go(h.tg, h.p, 1200); }

  // ---- ficha
  const nomeAndar = () => D.andares[andar].nome || andar + 'º andar';
  function ficha(num) {
    const d = info(num), sim = (cfg.sim || '/simulador-financiamento-santa-maria.html') + '?modo=direto&emp=' + D.id + '&un=' + num + '#direto';
    const msg = 'Olá ' + (D.corretor || 'Kamila') + '! Vi o apartamento ' + num + ' do ' + D.n + ' no site (' + nomeAndar().toLowerCase() + ', ' + d.t.toLowerCase() + ', ' + fm(d.a) + ' m²) e quero saber mais detalhes.';
    const dl = !d.dorm ? ['Studio', 'integrado'] : [d.dorm, (d.su === d.dorm ? (d.su > 1 ? 'suítes' : 'suíte') : d.dorm > 1 ? 'dormitórios' : 'dormitório') + (d.su && d.su !== d.dorm ? ', 1 suíte' : '')];
    panel.innerHTML = `<button type="button" class="px" aria-label="Fechar a ficha">×</button><small class="k">Apartamento</small><h3>${esc(num)}</h3><div class="s">${esc(nomeAndar())} · ${esc(d.t)}</div>
      <div class="ea-st"><div><b>${fm(d.a)}</b><small>m² privativos</small></div><div><b>${dl[0]}</b><small>${dl[1]}</small></div><div><b>${d.ban}</b><small>${d.ban > 1 ? 'banheiros' : 'banheiro'}${d.lav ? ' + lavabo' : ''}</small></div></div>
      ${d.face ? `<p class="ea-face">☀ ${esc(d.face)} <small>(pela planta)</small></p>` : ''}
      <button type="button" class="ea-go">${U ? 'Ver o decorado' : 'Entrar no apartamento'}</button>
      <button type="button" class="ea-pl"><img src="${d.pl}" alt="" loading="lazy"><span>Ver a planta humanizada<br><small style="opacity:.6">${fm(d.a)} m² privativos</small></span></button>
      <ul class="ea-c">${(d.c || []).map(([t, a]) => `<li><span>${esc(t)}</span><b>${fm(a)} m²</b></li>`).join('')}</ul>
      <a class="ea-a" href="${sim}">Montar minha proposta para o ${esc(num)} →</a>
      <a class="ea-a" href="https://wa.me/${cfg.K}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" data-corretor="${esc(D.corretor || 'Kamila')}" data-origem="sm_${D.id}_apto">Falar com a ${esc(D.corretor || 'Kamila')} sobre o ${esc(num)}</a>
      <p class="ea-n">${esc(D.aviso || 'Imagens ilustrativas.')}</p>`;
    panel.classList.add('on'); panel.scrollTop = 0;
    panel.querySelector('.ea-go').addEventListener('click', () => (U ? galeria() : entra(num)));
    panel.querySelector('.ea-pl').addEventListener('click', () => planta(d.pl));
    panel.querySelector('.px').addEventListener('click', () => { panel.classList.remove('on'); if (!U) solta(); });
  }
  const lb = q('.ea-lb'), lbi = lb.querySelector('img');
  function planta(src) { lbi.src = src; lbi.classList.remove('z'); lb.hidden = false; requestAnimationFrame(() => lb.classList.add('on')); }
  lbi.addEventListener('click', () => lbi.classList.toggle('z'));
  lb.querySelector('.ea-cl').addEventListener('click', () => { lb.classList.remove('on'); setTimeout(() => { lb.hidden = true; }, 500); });

  // ---- entrar: desce até o piso do apartamento e troca para a planta humanizada dele em 3D
  const wh = q('.ea-wh');
  function entra(num) {
    const z = zonaDe(num), d = info(num); panel.classList.remove('on');
    const tg = new THREE.Vector3(z.c.x, 0.6, z.c.z);
    go(tg, sph(tg, 2.2, 1.15, az() + 0.5), 1400, async () => {
      wh.classList.add('on');
      await new Promise((r) => setTimeout(r, 420));
      await unidade(num, d);
      wh.classList.remove('on');
    });
    try { gtag('event', 'predio_entrar', { emp: D.id, apto: num }); } catch (_) {}
  }
  async function unidade(num, d) {
    const pu = d.pu; if (!pu) { galeria(); return; }
    const Wm = pu.W / pu.ppm, Hm = pu.H / pu.ppm, g = new THREE.Group();
    laje(g, await loadTex(d.pl), Wm, Hm, 0xf4f0ea); const walls = paredes(g, pu.r, pu.ppm, Wm, Hm, Math.min(1.25, Math.max(Wm, Hm) * 0.12), 0x2f2d2b, 0xf6f2ec);
    P.g.visible = false; pinBox.style.display = 'none'; world.add(g); sombra(Math.max(Wm, Hm) * 0.8);
    U = { num, d, g, walls, Wm, Hm, rise: performance.now() };
    flb.hidden = true; ub.hidden = false; hint.style.opacity = '0';
    q('.ea-tt b').textContent = 'Apartamento ' + num;
    const h = geral(Wm, Hm, 0.95); controls.target.set(0, 0, 0); camera.position.copy(sph(h.tg, Math.max(Wm, Hm) * 0.55, 0.35, az())); go(h.tg, h.p, 1800);
    dirty = true;
  }
  function saiUnidade() {
    if (!U) return; world.remove(U.g); dispose(U.g); const num = U.num; U = null;
    P.g.visible = true; pinBox.style.display = ''; flb.hidden = false; ub.hidden = true; sombra(Math.max(P.Wm, P.Hm) * 0.75); rotulos();
    const z = zonaDe(num); if (z) { sel = z; const tg = new THREE.Vector3(z.c.x, 0, z.c.z); camera.position.copy(sph(tg, 2.5, 1.1, az())); controls.target.copy(tg); foca(z, 1200); ficha(num); }
    dirty = true;
  }
  ub.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !U) return; const a = b.getAttribute('data-u'); if (a === 'dec') galeria(); else if (a === 'fic') ficha(U.num); else saiUnidade(); });

  // ---- decorado (fotos)
  const inn = q('.ea-in'); let fi = 0, fT = 0, fotos = [], numF = '';
  function galeria() {
    const num = U ? U.num : sel && sel.num; if (!num) return; const d = info(num); numF = num;
    fotos = (d.f && d.f.length ? d.f : D.fotos.map((_, i) => i)).map((i) => D.fotos[i]).filter(Boolean); fi = 0;
    inn.querySelectorAll('img').forEach((x) => x.remove());
    fotos.forEach((f) => { const im = document.createElement('img'); im.alt = f[2]; im.src = touch ? f[1] : f[0]; inn.insertBefore(im, inn.firstChild); });
    inn.hidden = false; requestAnimationFrame(() => inn.classList.add('on')); mostra(0);
    try { gtag('event', 'predio_decorado', { emp: D.id, apto: num }); } catch (_) {}
  }
  function mostra(i) {
    fi = (i + fotos.length) % fotos.length; const ims = [...inn.querySelectorAll('img')].reverse();
    ims.forEach((im, j) => { im.classList.remove('on'); if (j === fi) { void im.offsetWidth; im.classList.add('on'); } });
    inn.querySelector('.cap small').textContent = 'Apartamento ' + numF + ' · ' + (fi + 1) + ' de ' + fotos.length; inn.querySelector('.cap b').textContent = fotos[fi][2];
    clearTimeout(fT); fT = setTimeout(() => mostra(fi + 1), 6500);
  }
  inn.querySelectorAll('.nv').forEach((b) => b.addEventListener('click', () => mostra(fi + +b.getAttribute('data-d'))));
  function saiGaleria() { clearTimeout(fT); inn.classList.remove('on'); setTimeout(() => { inn.hidden = true; }, 500); }
  inn.querySelector('.ea-cl').addEventListener('click', saiGaleria);

  // ---- trocar de andar
  async function vaiAndar(a) {
    if (!AND.includes(a) || a === andar || U) return;
    const sobe = a > andar, era = sel && sel.num; andar = a; panel.classList.remove('on');
    if (D.andares[a].pav !== pavAtual) { sel = null; await monta(D.andares[a].pav); const h = geral(P.Wm, P.Hm); go(h.tg, h.p, 900); hint.style.opacity = '1'; }
    else {
      rotulos(); world.position.y = sobe ? -2.4 : 2.4; P.drop = performance.now();
      const n2 = era && Object.keys(D.andares[a].un).find((n) => D.andares[a].un[n][0] === sel.zk);
      sel = n2 ? zonaDe(n2) : null; if (sel) ficha(n2);
    }
    dirty = true;
    try { gtag('event', 'predio_andar', { emp: D.id, andar: a }); } catch (_) {}
  }
  flb.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) vaiAndar(andar + +b.getAttribute('data-d')); });

  // ---- fechar
  function fecha() {
    alive = false; cancelAnimationFrame(raf); clearTimeout(fT); window.removeEventListener('keydown', tecla); ro.disconnect(); controls.dispose(); dispose(world); renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
    root.classList.remove('on'); setTimeout(() => root.remove(), 600); document.documentElement.style.overflow = prevOv; if (cfg.onClose) cfg.onClose();
  }
  q('.ea-x').addEventListener('click', fecha); q('.ea-bk').addEventListener('click', fecha);
  function tecla(e) { if (e.key !== 'Escape') return; if (!lb.hidden) lb.querySelector('.ea-cl').click(); else if (!inn.hidden) saiGaleria(); else if (U) saiUnidade(); else if (sel) solta(); else fecha(); }
  window.addEventListener('keydown', tecla);

  // ---- tamanho e laço (só desenha quando algo muda)
  function resize() { const w = root.clientWidth, h = root.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; }
  const ro = new ResizeObserver(resize); ro.observe(root); resize();
  await monta(D.andares[andar].pav);
  { // celular em pé e andar comprido: gira a vista 90° para o andar ficar na vertical
    const a0 = camera.aspect < 0.8 && P.Wm > P.Hm * 1.3 ? Math.PI / 2 : 0.35; controls.target.set(0, 0, 0); camera.position.copy(sph(controls.target, 50, 0.25, a0));
    const h = geral(P.Wm, P.Hm); camera.position.copy(sph(h.tg, h.p.distanceTo(h.tg) * 1.9, 0.25, a0)); go(h.tg, h.p, 2200); }
  const v = new THREE.Vector3();
  function frame() {
    if (!alive) return; raf = requestAnimationFrame(frame);
    const now = performance.now(), riseK = P ? Math.min(1, (now - P.rise - 250) / 1300) : 1, dropK = P && P.drop ? Math.min(1, (now - P.drop) / 650) : 1, uK = U ? Math.min(1, (now - U.rise - 350) / 1400) : 1;
    let anim = fly || riseK < 1 || dropK < 1 || uK < 1 || Math.abs(zq) > 1e-4;
    if (P) {
      P.walls.scale.y = Math.max(0.001, 1 - Math.pow(1 - Math.max(0, riseK), 3));
      if (dropK < 1) world.position.y *= 0.82; else world.position.y = 0;
      Object.values(P.zs).forEach((z) => {
        const hlT = z === sel ? 0.16 : z === hov ? 0.22 : 0, vlT = sel && z !== sel ? 0.62 : 0;
        z.hlT += (hlT - z.hlT) * 0.18; z.vlT += (vlT - z.vlT) * 0.14;
        if (Math.abs(z.hlT - hlT) > 0.003 || Math.abs(z.vlT - vlT) > 0.003) anim = true;
        z.hl.material.opacity = z.hlT; z.vl.material.opacity = z.vlT;
      });
    }
    if (U) U.walls.scale.y = Math.max(0.001, 1 - Math.pow(1 - Math.max(0, uK), 3));
    if (!anim && !dirty) { controls.update(); if (!dirty) return; }
    dirty = false;
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.d), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e); if (k >= 1) { const t = fly.then; fly = null; if (t) t(); } }
    stepZoom(); controls.update();
    renderer.render(scene, camera);
    if (P && !U) { const w = root.clientWidth, h = root.clientHeight, ok = riseK > 0.85; Object.values(P.zs).forEach((z) => { if (!z.pin) return; v.copy(z.c); v.y += world.position.y; v.project(camera); const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h, on = ok && v.z < 1 && x > -40 && x < w + 40 && y > 40 && y < h + 40; z.pin.style.opacity = on ? '' : '0'; z.pin.style.pointerEvents = on ? '' : 'none'; z.pin.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; z.pin.classList.toggle('on', z === sel); z.pin.classList.toggle('dim', !!sel && z !== sel); }); }
  }
  raf = requestAnimationFrame(frame);
  try { gtag('event', 'predio_andar', { emp: D.id, andar }); } catch (_) {}
  return { fecha, andar: vaiAndar };
}
