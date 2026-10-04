/* ════════════════════════════════════════════════════════════════
   KIT 3D — piezas reutilizables con el mismo vocabulario visual en
   toda la clase (un concepto conserva su forma):
   usuario = cápsula · navegador/web = ventana · servidor = bloques
   apilados · database = cilindro segmentado · IA = orbe facetado ·
   n8n = glifo de 3 nodos · CRM = fichas · webhook = anillo con chispa
   · email = sobre · WhatsApp/chat = burbuja · formulario = tarjeta.
   Cada pieza expone un objeto `s` (estado) que GSAP anima; el
   escenario aplica ese estado antes de cada render.
   ════════════════════════════════════════════════════════════════ */
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PAL } from './palette.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

let sizeEpoch = 0;
if (typeof window !== 'undefined') window.addEventListener('resize', () => { sizeEpoch++; });

export function createKit({ THREE, motion, camera }) {
  const geo = new Map();
  const cached = (k, make) => { if (!geo.has(k)) geo.set(k, make()); return geo.get(k); };
  const rbox = (w, h, d, r = 0.08) => cached(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01)));
  const box = (w, h, d) => cached(`bx${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
  const ico = (r, d = 1) => cached(`ic${r}|${d}`, () => new THREE.IcosahedronGeometry(r, d));
  const sph = (r) => cached(`sp${r}`, () => new THREE.SphereGeometry(r, 24, 16));
  const cyl = (r, h, s = 48) => cached(`cy${r}|${h}|${s}`, () => new THREE.CylinderGeometry(r, r, h, s, 1));
  const tor = (r, t, s = 64) => cached(`to${r}|${t}`, () => new THREE.TorusGeometry(r, t, 10, s));
  const plane = (w, h) => cached(`pl${w}|${h}`, () => new THREE.PlaneGeometry(w, h));

  const glowTex = radialTexture(THREE, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  const shadowTex = radialTexture(THREE, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);

  const matCache = {};
  function mats(theme) {
    if (matCache[theme]) return matCache[theme];
    const P = PAL[theme];
    const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.06, ...extra });
    matCache[theme] = {
      body: std(P.body),
      body2: std(P.body2),
      top: std(P.top),
      inset: std(P.inset, { roughness: 0.8 }),
      ink: new THREE.MeshBasicMaterial({ color: P.ink, toneMapped: false }),
      mute: new THREE.MeshBasicMaterial({ color: P.mute, toneMapped: false }),
      signal: new THREE.MeshBasicMaterial({ color: P.signal, toneMapped: false }),
      ok: new THREE.MeshBasicMaterial({ color: P.ok, toneMapped: false }),
      facet: std(P.body, { flatShading: true, roughness: 0.38, metalness: 0.12 }),
      wire: new THREE.LineBasicMaterial({ color: P.line, transparent: true, opacity: 0.9 }),
      screen: new THREE.MeshBasicMaterial({ color: theme === 'dark' ? 0x1b1b1e : 0xf1ede5, toneMapped: false }),
    };
    return matCache[theme];
  }

  /* ── API ligada a una isla (capítulo) ── */
  function bind(island) {
    const P = island.pal;
    const M = mats(island.theme);
    const MM = M;
    const root = island.group;
    const track = (fn) => { island.updaters.push(fn); return fn; };
    const colA = new THREE.Color(), colB = new THREE.Color();
    const place = (o, at) => { if (at) o.position.set(at[0] || 0, at[1] || 0, at[2] || 0); return o; };
    const addTo = (o, parent) => { (parent || root).add(o); return o; };

    function mesh(g, m, at, parent) { return addTo(place(new THREE.Mesh(g, m), at), parent); }

    function accentMat(kind = 'signal', pal = P) {
      const m = new THREE.MeshBasicMaterial({ color: pal.mute, toneMapped: false });
      m.userData.on = kind === 'ok' ? pal.ok : pal.signal;
      m.userData.off = pal.mute;
      return m;
    }
    function setAccent(m, on) {
      colA.setHex(m.userData.off ?? P.mute); colB.setHex(m.userData.on);
      m.color.copy(colA).lerp(colB, clamp01(on));
    }

    /* Etiqueta HTML anclada a un punto 3D */
    function label(text, sub, { at = [0, 0, 0], parent, center = [0.5, 0], cls = '', html, theme } = {}) {
      const outer = document.createElement('div');
      outer.className = 'l3';
      const inner = document.createElement('div');
      inner.className = `l3-in ${theme ? PAL[theme].label : P.label} ${cls}`.trim();
      const nc = (t) => esc(t).replace(/n8n/g, '<span class="nocase">n8n</span>');
      inner.innerHTML = html ?? `${nc(text)}${sub ? `<small>${nc(sub)}</small>` : ''}`;
      outer.appendChild(inner);
      const obj = new CSS2DObject(outer);
      obj.center.set(center[0], center[1]);
      place(obj, at);
      addTo(obj, parent);
      const s = { o: 0, y: 10 };
      let lo = -1, ly = -1, ldx = 0, ldy = 0, w = 0, h = 0, epoch = -1;
      const v = new THREE.Vector3();
      track(() => {
        const o = Math.round(clamp01(s.o) * 1000) / 1000;
        const y = Math.round(s.y * 10) / 10;
        if (o !== lo) { inner.style.opacity = o; inner.style.visibility = o < 0.01 ? 'hidden' : 'visible'; lo = o; }
        if (y !== ly) { inner.style.transform = `translate(${ldx}px, ${y + ldy}px)`; ly = y; }
        // Mantener la etiqueta dentro de la pantalla (bordes en pantallas estrechas)
        if (o < 0.01 || !camera) return;
        if (epoch !== sizeEpoch || !w) { w = inner.offsetWidth; h = inner.offsetHeight; epoch = sizeEpoch; if (!w) return; }
        obj.updateWorldMatrix(true, false);
        v.setFromMatrixPosition(obj.matrixWorld).project(camera);
        if (v.z < -1 || v.z > 1) return;
        const vw = window.innerWidth, vh = window.innerHeight, m = 10;
        const left = (v.x * 0.5 + 0.5) * vw - obj.center.x * w;
        const top = (-v.y * 0.5 + 0.5) * vh - (1 - obj.center.y) * h;
        let dx = 0, dy = 0;
        if (left > -w && left < vw) { if (left < m) dx = m - left; else if (left + w > vw - m) dx = vw - m - left - w; }
        if (top > -h && top < vh) { if (top < m + 40) dy = m + 40 - top; else if (top + h > vh - m) dy = vh - m - top - h; }
        dx = Math.round(dx); dy = Math.round(dy);
        if (dx !== ldx || dy !== ldy) { ldx = dx; ldy = dy; inner.style.transform = `translate(${dx}px, ${y + dy}px)`; }
      });
      return { obj, el: inner, s };
    }

    /* Íconos del vocabulario visual */
    function icon(kind, accent, theme) {
      const M = theme ? mats(theme) : MM;
      const g = new THREE.Group();
      let h = 1.4;
      const A = accent;
      switch (kind) {
        case 'user': {
          mesh(sph(0.3), M.body, [0, 0.62, 0], g);
          mesh(cached('cap', () => new THREE.CapsuleGeometry(0.36, 0.38, 6, 20)), M.body, [0, -0.08, 0], g);
          const ring = mesh(tor(0.55, 0.025), A, [0, -0.62, 0], g); ring.rotation.x = Math.PI / 2;
          h = 1.7; break;
        }
        case 'browser': case 'web': case 'page': {
          const W = kind === 'page' ? 2.5 : 2.3, H = kind === 'page' ? 1.7 : 1.55;
          mesh(rbox(W, H, 0.14, 0.09), M.body, [0, 0, 0], g);
          mesh(rbox(W, 0.26, 0.16, 0.08), M.body2, [0, H / 2 - 0.13, 0.005], g);
          [0, 1, 2].forEach((i) => mesh(sph(0.045), M.mute, [-W / 2 + 0.2 + i * 0.13, H / 2 - 0.13, 0.09], g));
          mesh(box(W * 0.38, 0.1, 0.02), M.inset, [-W * 0.2, 0.22, 0.08], g);
          mesh(box(W * 0.6, 0.07, 0.02), M.inset, [-W * 0.09, 0.02, 0.08], g);
          mesh(box(W * 0.5, 0.07, 0.02), M.inset, [-W * 0.14, -0.14, 0.08], g);
          mesh(rbox(W * 0.3, 0.2, 0.04, 0.05), A, [-W * 0.24, -0.45, 0.08], g);
          h = H; break;
        }
        case 'globe': {
          const e = new THREE.LineSegments(cached('globeE', () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.95, 1))), M.wire);
          g.add(e);
          mesh(ico(0.42, 2), M.body, [0, 0, 0], g);
          const r = mesh(tor(1.15, 0.018), A, [0, 0, 0], g); r.rotation.x = Math.PI / 2.4;
          g.userData.spin = e;
          h = 2.0; break;
        }
        case 'server': {
          [-0.5, 0, 0.5].forEach((y) => {
            mesh(rbox(1.7, 0.42, 1.1, 0.06), M.body, [0, y, 0], g);
            mesh(sph(0.055), A, [0.62, y, 0.56], g);
            mesh(box(0.8, 0.05, 0.02), M.inset, [-0.25, y, 0.555], g);
          });
          h = 1.5; break;
        }
        case 'files': {
          [-0.62, 0, 0.62].forEach((x, i) => {
            const sg = new THREE.Group();
            mesh(rbox(0.8, 1.05, 0.05, 0.04), M.body, [0, 0, 0], sg);
            mesh(box(0.8, 0.12, 0.06), i === 0 ? A : M.body2, [0, 0.46, 0], sg);
            [0.18, 0.02, -0.14, -0.3].forEach((y, j) => mesh(box(j % 2 ? 0.4 : 0.55, 0.04, 0.06), M.inset, [-0.04, y, 0], sg));
            sg.position.set(x, -Math.abs(x) * 0.08, -Math.abs(x) * 0.2);
            sg.rotation.z = -x * 0.12;
            g.add(sg);
          });
          h = 1.2; break;
        }
        case 'db': {
          [-0.46, 0, 0.46].forEach((y) => mesh(cyl(0.78, 0.4), M.body, [0, y, 0], g));
          const r = mesh(tor(0.78, 0.03), A, [0, 0.67, 0], g); r.rotation.x = Math.PI / 2;
          h = 1.4; break;
        }
        case 'orb': {
          mesh(ico(0.82, 1), M.facet, [0, 0, 0], g);
          const r = mesh(tor(1.1, 0.02), A, [0, 0, 0], g); r.rotation.x = Math.PI / 2.2;
          mesh(sph(0.12), A, [1.1, 0, 0], r);
          g.userData.spin = g.children[0];
          h = 1.8; break;
        }
        case 'n8n': {
          const pts = [[-0.8, -0.15, 0], [0, 0.32, 0], [0.8, -0.05, 0]];
          pts.forEach((p, i) => mesh(sph(0.22), i === 1 ? A : M.body, p, g));
          for (let i = 0; i < 2; i++) {
            const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]);
            const len = a.distanceTo(b);
            const c = mesh(cyl(0.05, len, 12), M.top, [(a.x + b.x) / 2, (a.y + b.y) / 2, 0], g);
            c.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
          }
          mesh(rbox(2.2, 0.08, 0.9, 0.04), M.body2, [0, -0.55, 0], g);
          h = 1.2; break;
        }
        case 'crm': {
          [0, 1, 2].forEach((i) => {
            const c = mesh(rbox(1.7, 1.0, 0.06, 0.06), i === 0 ? M.body : M.body2, [i * 0.12, i * 0.1, -i * 0.18], g);
            if (i === 0) {
              mesh(cyl(0.16, 0.04, 24), A, [-0.5, 0.15, 0.04], c).rotation.x = Math.PI / 2;
              mesh(box(0.7, 0.06, 0.02), M.inset, [0.2, 0.2, 0.035], c);
              mesh(box(0.5, 0.06, 0.02), M.inset, [0.1, 0.04, 0.035], c);
              mesh(box(1.3, 0.05, 0.02), M.inset, [0, -0.28, 0.035], c);
            }
          });
          h = 1.3; break;
        }
        case 'mail': {
          mesh(rbox(1.7, 1.1, 0.1, 0.06), M.body, [0, 0, 0], g);
          const l = mesh(box(1.05, 0.05, 0.02), M.inset, [-0.4, 0.15, 0.06], g); l.rotation.z = -0.55;
          const r = mesh(box(1.05, 0.05, 0.02), M.inset, [0.4, 0.15, 0.06], g); r.rotation.z = 0.55;
          mesh(cyl(0.12, 0.03, 20), A, [0, -0.15, 0.07], g).rotation.x = Math.PI / 2;
          h = 1.1; break;
        }
        case 'chat': {
          mesh(rbox(1.6, 1.0, 0.14, 0.2), M.body, [0, 0.08, 0], g);
          const t = mesh(box(0.3, 0.3, 0.12), M.body, [-0.5, -0.38, 0], g); t.rotation.z = 0.8;
          [-0.35, 0, 0.35].forEach((x) => mesh(sph(0.08), A, [x, 0.08, 0.09], g));
          h = 1.2; break;
        }
        case 'hook': {
          mesh(tor(0.5, 0.08, 48), M.body, [0, 0, 0], g);
          mesh(sph(0.18), A, [0, 0, 0], g);
          const wave = mesh(tor(0.85, 0.016, 64), A, [0, 0, 0], g);
          g.userData.wave = wave;
          h = 1.6; break;
        }
        case 'form': {
          mesh(rbox(1.7, 2.1, 0.1, 0.08), M.body, [0, 0, 0], g);
          [0.62, 0.25, -0.12].forEach((y) => mesh(rbox(1.3, 0.22, 0.03, 0.04), M.inset, [0, y, 0.06], g));
          mesh(rbox(1.3, 0.28, 0.04, 0.05), A, [0, -0.62, 0.06], g);
          h = 2.1; break;
        }
        case 'logic': {
          mesh(tor(0.55, 0.16, 40), M.body, [0, 0, 0], g);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const t = mesh(box(0.22, 0.22, 0.3), M.body, [Math.cos(a) * 0.76, Math.sin(a) * 0.76, 0], g);
            t.rotation.z = a;
          }
          mesh(cyl(0.16, 0.34, 20), A, [0, 0, 0], g).rotation.x = Math.PI / 2;
          g.userData.spin = g;
          h = 1.8; break;
        }
        case 'phone': {
          mesh(rbox(0.9, 1.7, 0.1, 0.12), M.body, [0, 0, 0], g);
          mesh(rbox(0.78, 1.45, 0.02, 0.06), M.inset, [0, 0.02, 0.055], g);
          mesh(rbox(0.5, 0.14, 0.03, 0.05), A, [0, -0.45, 0.07], g);
          h = 1.7; break;
        }
        default: {
          mesh(rbox(1.6, 1.0, 0.3, 0.1), M.body, [0, 0, 0], g);
          mesh(rbox(0.5, 0.12, 0.04, 0.04), A, [-0.4, 0.3, 0.16], g);
          h = 1.0;
        }
      }
      g.userData.h = h;
      return g;
    }

    /* Nodo = ícono + etiqueta + estado {show, on, lift} */
    function node(kind, { at = [0, 0, 0], label: text, sub, labelAt, labelCls = '', scale = 1, parent, accent = 'signal', rot, theme } = {}) {
      const A = accentMat(accent, theme ? PAL[theme] : P);
      const pivot = new THREE.Group();
      place(pivot, at);
      addTo(pivot, parent);
      const ic = icon(kind, A, theme);
      ic.scale.setScalar(scale);
      if (rot) ic.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
      pivot.add(ic);
      const h = ic.userData.h * scale;
      const lbl = text ? label(text, sub, { at: labelAt || [0, -h / 2 - 0.28, 0], parent: pivot, cls: `${theme ? PAL[theme].label : ''} ${labelCls}`.trim() }) : null;
      const s = { show: 0, on: 0, lift: 0, spin: 0 };
      const baseY = pivot.position.y;
      const spinObj = ic.userData.spin;
      const wave = ic.userData.wave;
      track((time) => {
        const v = Math.max(0.0001, s.show);
        ic.scale.setScalar(scale * v);
        ic.visible = s.show > 0.002;
        pivot.position.y = baseY + s.lift;
        setAccent(A, s.on);
        if (lbl) { lbl.s.o = clamp01(s.show * 1.4 - 0.4); lbl.s.y = (1 - clamp01(s.show)) * 10; }
        if (spinObj && !motion.reduced) spinObj.rotation.y = time * 0.18 + s.spin;
        if (wave) {
          const k = motion.reduced ? 0.5 : (time * 0.8) % 1;
          wave.scale.setScalar(0.7 + k * 0.9 * clamp01(s.on));
          wave.material.opacity = 1;
        }
      });
      if (spinObj && !motion.reduced) island.live.add(spinObj);
      return { obj: pivot, icon: ic, s, label: lbl, accent: A };
    }

    /* Curva con línea gruesa (px), dibujable y «encendible» */
    function curveOf(points, { arc = 0 } = {}) {
      const v = points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)));
      if (v.length === 2) {
        const mid = v[0].clone().lerp(v[1], 0.5);
        mid.y += arc;
        return new THREE.QuadraticBezierCurve3(v[0], mid, v[1]);
      }
      return new THREE.CatmullRomCurve3(v, false, 'centripetal');
    }
    function link(points, { arc = 0, width = 2.6, color, hotColor, parent, samples = 64, dashed = false, curve } = {}) {
      const c = curve || curveOf(points, { arc });
      const pts = c.getSpacedPoints(samples);
      const flat = [];
      pts.forEach((p) => flat.push(p.x, p.y, p.z));
      const g = new LineGeometry();
      g.setPositions(flat);
      const m = new LineMaterial({ color: color ?? P.line, linewidth: width, worldUnits: false, dashed, dashSize: 0.18, gapSize: 0.14, transparent: true });
      m.fog = true;
      const line = new Line2(g, m);
      if (dashed) line.computeLineDistances();
      addTo(line, parent);
      const s = { draw: 0, hot: 0, o: 1 };
      const base = new THREE.Color(color ?? P.line), hot = new THREE.Color(hotColor ?? P.signal);
      const total = samples;
      track(() => {
        const n = Math.round(clamp01(s.draw) * total);
        line.visible = n > 0 && s.o > 0.01;
        g.instanceCount = n;
        m.color.copy(base).lerp(hot, clamp01(s.hot));
        m.opacity = s.o;
      });
      return { line, curve: c, s };
    }

    /* Un paquete de datos que recorre una curva (p: 0 → 1) */
    function pulse(curve, { color = 'signal', size = 0.12, parent } = {}) {
      const g = new THREE.Group();
      const mm = new THREE.MeshBasicMaterial({ color: P[color] ?? color, toneMapped: false });
      g.add(new THREE.Mesh(sph(size), mm));
      if (P.glow) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: P[color] ?? color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.75 }));
        sp.scale.setScalar(size * 7);
        g.add(sp);
      }
      addTo(g, parent);
      const s = { p: 0, show: 0 };
      const tmp = new THREE.Vector3();
      track(() => {
        g.visible = s.show > 0.01;
        if (!g.visible) return;
        curve.getPointAt(clamp01(s.p), tmp);
        g.position.copy(tmp);
        g.scale.setScalar(s.show);
      });
      return { obj: g, s, setColor: (c) => mm.color.setHex(P[c] ?? c) };
    }

    /* Flujo continuo de datos a lo largo de una curva */
    function flow(curve, { count = 6, speed = 0.22, color = 'signal', size = 0.07, parent } = {}) {
      const mm = new THREE.MeshBasicMaterial({ color: P[color] ?? color, toneMapped: false });
      const im = new THREE.InstancedMesh(sph(size), mm, count);
      im.frustumCulled = false;
      addTo(im, parent);
      const s = { on: 0 };
      const dummy = new THREE.Object3D();
      const tmp = new THREE.Vector3();
      const key = {};
      track((time) => {
        const on = clamp01(s.on);
        im.visible = on > 0.01;
        if (!im.visible) { island.live.delete(key); return; }
        if (!motion.reduced) island.live.add(key);
        for (let i = 0; i < count; i++) {
          const u = motion.reduced ? (i + 0.5) / count : (time * speed + i / count) % 1;
          curve.getPointAt(u, tmp);
          dummy.position.copy(tmp);
          dummy.scale.setScalar(on * Math.min(1, Math.sin(Math.PI * u) * 2.2));
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
      });
      return { obj: im, s };
    }

    function shadow(w, d, { at = [0, 0, 0], parent, opacity } = {}) {
      const m = new THREE.MeshBasicMaterial({ map: shadowTex, color: 0x000000, transparent: true, opacity: opacity ?? P.shadow, depthWrite: false, toneMapped: false });
      const p = mesh(plane(w, d), m, at, parent);
      p.rotation.x = -Math.PI / 2;
      p.renderOrder = -1;
      return p;
    }

    /* Estado genérico: anima un objeto existente con una función de aplicación */
    function state(initial, apply) {
      const s = { ...initial };
      track((time) => apply(s, time));
      return s;
    }

    /* Animación en reposo (se desactiva con movimiento reducido) */
    function idle(fn) {
      if (motion.reduced) return;
      const key = {};
      island.live.add(key);
      track(fn);
    }

    /* Laptop con pantalla dibujada en canvas */
    function laptop({ at = [0, 0, 0], parent, draw, width = 1280, height = 820 } = {}) {
      const g = new THREE.Group();
      place(g, at);
      addTo(g, parent);
      mesh(rbox(4.4, 0.16, 3.0, 0.08), M.body, [0, 0, 0], g);
      mesh(box(3.9, 0.012, 1.35), M.inset, [0, 0.083, -0.45], g);
      mesh(rbox(1.3, 0.012, 0.8, 0.04), M.body2, [0, 0.083, 0.88], g);
      const hinge = new THREE.Group();
      hinge.position.set(0, 0.08, -1.5);
      g.add(hinge);
      const lid = new THREE.Group();
      hinge.add(lid);
      mesh(rbox(4.4, 2.86, 0.1, 0.08), M.body, [0, 1.43, -0.02], lid);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const screen = mesh(plane(4.1, 2.62), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [0, 1.43, 0.035], lid);
      shadow(6.4, 4.4, { at: [0, -0.09, 0.2], parent: g });
      const s = { show: 1, open: 1, lift: 0 };
      const baseY = g.position.y;
      let lastKey = '';
      const handle = { obj: g, s, lid, screen, canvas, ctx, tex, data: {} };
      track(() => {
        g.scale.setScalar(Math.max(0.0001, s.show));
        g.visible = s.show > 0.002;
        g.position.y = baseY + s.lift;
        hinge.rotation.x = (1 - clamp01(s.open)) * (Math.PI / 2 - 0.02) - clamp01(s.open) * 0.2;
        if (draw) {
          const k = draw.key ? draw.key(handle.data) : '';
          if (k !== lastKey) { lastKey = k; draw(ctx, width, height, handle.data); tex.needsUpdate = true; }
        }
      });
      return handle;
    }

    return {
      THREE, P, M, root, island, theme: island.theme,
      mesh, box: (w, h, d, o = {}) => mesh(o.r ? rbox(w, h, d, o.r) : box(w, h, d), o.mat || M.body, o.at, o.parent),
      rbox, boxGeo: box, sph, cyl, tor, ico, plane,
      group(at, parent) { return addTo(place(new THREE.Group(), at), parent); },
      label, icon, node, curveOf, link, pulse, flow, shadow, state, idle, laptop, accentMat, setAccent,
      matsFor: mats, palFor: (t) => PAL[t],
      track,
    };
  }

  return { bind, mats };
}

function radialTexture(THREE, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
