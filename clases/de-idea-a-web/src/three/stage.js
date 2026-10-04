/* ════════════════════════════════════════════════════════════════
   ESCENARIO 3D — un solo renderer WebGL para toda la presentación.
   · Render bajo demanda: solo dibuja si cambia el scroll, el tamaño
     o si hay una animación viva en la isla visible.
   · Las animaciones en reposo se dibujan a ~30 fps (suficiente para Meet).
   · DPR adaptativo: baja la resolución si los frames tardan demasiado.
   ════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createKit } from './kit.js';
import { PAL } from './palette.js';

export function createStage({ canvas, labelsEl, motion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const mobile = window.innerWidth < 760;
  let maxDpr = motion.lite || mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  let dpr = maxDpr;
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x111111, 22, 60);
  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 400);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(-6, 10, 8);
  scene.add(key);

  const labels = new CSS2DRenderer({ element: labelsEl });
  labels.sortObjects = false;

  const islands = [];
  let needs = true;
  let lastRender = 0;
  let activeIslands = [];
  const frameTimes = [];
  const kit = createKit({ THREE, renderer, scene, camera, motion });
  camera.updateMatrixWorld();

  // Partículas ambientales MUY discretas (solo islas oscuras, sin modo ligero ni reducido)
  let dust = null;
  if (!motion.reduced && !motion.lite && !mobile) {
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8a8f99, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.22, depthWrite: false, fog: true }));
    dust.visible = false;
    scene.add(dust);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needs = true;
  }
  resize();

  function createIsland(id, theme) {
    const group = new THREE.Group();
    group.name = id;
    group.visible = false;
    scene.add(group);
    const island = {
      id, group,
      theme: theme === 'light' ? 'light' : 'dark',
      updaters: [],
      live: new Set(),
      visible: false,
    };
    island.pal = PAL[island.theme];
    islands.push(island);
    return island;
  }

  function view(cam, entries, themeMix, bg) {
    camera.position.set(cam.px, cam.py, cam.pz);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    camera.updateMatrixWorld();
    if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    scene.fog.near = cam.fogNear;
    scene.fog.far = cam.fogFar;
    scene.fog.color.set(bg);
    const next = entries.filter(Boolean).map((e) => e.island).filter(Boolean);
    islands.forEach((isl) => {
      const v = next.includes(isl);
      if (isl.visible !== v) { isl.visible = v; isl.group.visible = v; }
    });
    activeIslands = next;
    if (dust) {
      dust.visible = themeMix < 0.5 && next.length > 0;
      dust.position.set(cam.tx, cam.ty, 0);
    }
    needs = true;
  }

  function tick(time, dt) {
    const live = activeIslands.some((i) => i.live.size > 0) || (dust && dust.visible && !motion.reduced);
    const now = performance.now();
    if (!needs && !(live && now - lastRender > 32)) return;
    const t0 = performance.now();
    for (const isl of activeIslands) for (const u of isl.updaters) u(time);
    if (dust && dust.visible) dust.rotation.y = time * 0.01;
    renderer.render(scene, camera);
    labels.render(scene, camera);
    lastRender = now;
    needs = false;
    adapt(performance.now() - t0, dt);
  }

  // Si los frames tardan > ~22 ms de forma sostenida, baja el DPR un paso.
  function adapt(cost, dt) {
    if (dpr <= 1) return;
    frameTimes.push(dt || cost);
    if (frameTimes.length < 90) return;
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    frameTimes.length = 0;
    if (avg > 22) {
      dpr = Math.max(1, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
    }
  }

  function precompile() {
    islands.forEach((i) => { i.group.visible = true; });
    try { renderer.compile(scene, camera); } catch { /* opcional */ }
    islands.forEach((i) => { i.group.visible = i.visible; });
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.body.classList.add('no-webgl');
  });

  return {
    THREE, renderer, scene, camera, kit, createIsland, view, tick, resize, precompile,
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, dpr }),
    request() { needs = true; },
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2')) || !!c.getContext('webgl');
  } catch { return false; }
}
