/* 15 · LA PIRÁMIDE DE PROFUNDIDAD — lo que ya puedes hacer (arriba, iluminado) y las capas que siguen */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.profundidad;
/* Niveles: de arriba (pequeño) hacia abajo (ancho) */
const TIERS = [
  { y: 2.25, rt: 0.5, rb: 1.05, h: 0.72 },
  { y: 1.38, rt: 1.12, rb: 1.67, h: 0.72 },
  { y: 0.51, rt: 1.74, rb: 2.29, h: 0.72 },
  { y: -0.36, rt: 2.36, rb: 2.91, h: 0.72 },
];

export default {
  steps: 5,
  cams: [
    { p: [-2.3, 4.6, 9.5], t: [-2.3, 2.0, 0] },
    { p: [-2.6, 4.0, 11], t: [-2.6, 1.3, 0] },
    { p: [-2.9, 3.4, 12.5], t: [-2.9, 0.7, 0] },
    { p: [-3.2, 2.8, 14], t: [-3.2, 0.2, 0] },
    { p: [-3.0, 3.6, 15], t: [-3.0, -0.4, 0] },
  ],
  fog: [20, 52],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <h2 class="sr-only" id="${entry.meta.id}-h">${esc(entry.meta.nav)}</h2>
      <div class="py-levels">${T.levels.map((l, i) => `
        <div class="py-level ${l.done ? 'is-done' : ''}" data-r>
          <p class="label ${l.done ? 'accent' : ''}">Nivel ${i + 1}</p>
          <p class="h1">${esc(l.name)}</p>
          <ul class="py-items">${l.items.map((it) => `<li>${l.done ? '<i>✓</i>' : '<i>·</i>'}${esc(it)}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <div class="py-statement" data-r><p class="h1">${esc(T.statement[0])}</p><p class="h2 muted-2">${esc(T.statement[1])}</p></div>
      <ol class="fallback flow" aria-hidden="true">${T.levels.map((l) => `<li class="chip">${esc(l.name)}</li>`).join('')}</ol>
    `);
  },

  scene(K) {
    const THREE = K.THREE;
    const tiers = TIERS.map((t, i) => {
      const geo = new THREE.CylinderGeometry(t.rt, t.rb, t.h, 4, 1);
      geo.rotateY(Math.PI / 4);
      const mat = new THREE.MeshStandardMaterial({ color: i === 0 ? 0x34343a : 0x26262a, roughness: 0.5, metalness: 0.08 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, t.y, 0);
      K.root.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: K.P.line, transparent: true }));
      mesh.add(edges);
      const lbl = K.label(T.levels[i].name, null, { at: [0, t.y, (t.rt + t.rb) / 2 * 0.74], center: [0.5, 0.5], cls: `py-tier ${i === 0 ? 'is-signal' : ''}` });
      return { mesh, mat, edges, lbl };
    });
    const glow = K.mesh(K.tor(0.62, 0.022), K.M.signal, [0, TIERS[0].y + 0.4, 0]);
    glow.rotation.x = Math.PI / 2;
    K.shadow(7, 7, { at: [0, -0.74, 0], opacity: 0.5 });
    const colOff = new THREE.Color(K.P.line), colSig = new THREE.Color(K.P.signal), colMid = new THREE.Color(0x8a8a92);
    const s = K.state({ l0: 0, l1: 0, l2: 0, l3: 0, lit: 0 }, (st, time) => {
      const lv = [st.l0, st.l1, st.l2, st.l3];
      tiers.forEach((t, i) => {
        const v = lv[i];
        t.mesh.visible = v > 0.002;
        t.mesh.scale.set(Math.max(0.0001, 0.85 + v * 0.15), Math.max(0.0001, v), Math.max(0.0001, 0.85 + v * 0.15));
        t.edges.material.color.copy(colOff).lerp(i === 0 ? colSig : colMid, v);
        t.lbl.s.o = v > 0.9 ? 1 : 0; t.lbl.s.y = 0;
      });
      glow.visible = st.lit > 0.01;
      glow.scale.setScalar(1 + Math.sin(time * 1.6) * 0.03 * st.lit);
    });
    K.idle(() => {});
    return { s };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.seq($$(st, '.py-level'), 0, { keepLast: false });
    ctx.show($(st, '.py-statement'), ctx.at(4, 0.3));
    if (!r.s) return;
    ctx.to(r.s, { l0: 1, duration: 0.5, ease: 'back.out(1.3)' }, ctx.at(0, 0.3));
    ctx.to(r.s, { lit: 1, duration: 0.3 }, ctx.at(0, 0.6));
    ctx.to(r.s, { l1: 1, duration: 0.5, ease: 'power3.out' }, ctx.at(1, 0.1));
    ctx.to(r.s, { l2: 1, duration: 0.5, ease: 'power3.out' }, ctx.at(2, 0.1));
    ctx.to(r.s, { l3: 1, duration: 0.5, ease: 'power3.out' }, ctx.at(3, 0.1));
  },
};
