/* 11 · EL PROYECTO POR DENTRO — carpeta nova-professional/ con index.html, styles.css, script.js, README.md */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.proyecto;

export default {
  steps: 7,
  cams: [
    { p: [-1.4, 1.6, 12.5], t: [-1.4, 0.2, 0] },
    { p: [-1.4, 2.4, 13], t: [-1.4, 1.2, 0] },
    { p: [-1.4, 2.4, 13], t: [-1.4, 1.2, 0] },
    { p: [-1.4, 2.4, 13], t: [-1.4, 1.2, 0] },
    { p: [-1.4, 2.4, 13], t: [-1.4, 1.2, 0] },
    { p: [-1.4, 2.4, 13], t: [-1.4, 1.2, 0] },
    { p: [-1.2, 2.6, 13.6], t: [-1.2, 1.1, 0] },
  ],
  fog: [18, 44],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <div class="pj-info">${T.files.map((f) => `
        <div class="pj-card" data-r>
          <p class="pj-file">${esc(f.name)}</p>
          <p class="h1">${esc(f.role)}</p>
          <p class="lead">${esc(f.desc)}</p>
        </div>`).join('')}
        <div class="pj-card pj-agent" data-r><p class="pj-file">${esc(T.diff[0])} ${esc(T.diff[1])}</p><p class="h2">${esc(T.agent)}</p></div>
      </div>
      <div class="block b-bl caps pj-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <p class="pj-hint label" data-r>${esc(T.hint)}</p>
      <ul class="fallback flow" aria-hidden="true">${T.files.map((f) => `<li class="chip">${esc(f.name)} · ${esc(f.role)}</li>`).join('')}</ul>
    `);
  },

  scene(K, entry) {
    const M = K.M;
    const F = K.group([-3.2, -0.4, 0]);
    K.mesh(K.rbox(3.6, 2.5, 0.08, 0.08), M.body2, [0, 0, -0.25], F);
    K.mesh(K.rbox(1.3, 0.34, 0.08, 0.08), M.body2, [-1.15, 1.32, -0.25], F);
    const hinge = K.group([0, -1.25, 0.18], F);
    const flap = K.mesh(K.rbox(3.6, 2.1, 0.08, 0.08), M.body, [0, 1.05, 0], hinge);
    const nameLbl = K.label(T.folder, null, { at: [0, 0.2, 0.06], parent: flap, center: [0.5, 0.5], cls: 'pill pj-folder' });
    K.shadow(5, 2.6, { at: [-3.2, -1.7, 0], opacity: 0.45 });

    const X = [-2.1, -0.7, 0.7, 2.1];
    const files = T.files.map((f, i) => {
      const g = K.group([0, 0, 0], F);
      K.mesh(K.rbox(1.0, 1.3, 0.035, 0.04), M.top, [0, 0, 0], g);
      const acc = K.accentMat('signal');
      K.mesh(K.boxGeo(1.0, 0.16, 0.04), acc, [0, 0.57, 0], g);
      [0.25, 0.08, -0.09, -0.26, -0.43].forEach((y, j) => K.mesh(K.boxGeo(j % 2 ? 0.5 : 0.7, 0.05, 0.04), M.inset, [-0.05, y, 0], g));
      const lbl = K.label(null, null, {
        at: [0, -0.8, 0], parent: g, center: [0.5, 0],
        html: `<button type="button" class="pj-btn" data-step="${i + 2}">${esc(f.name)}</button>`,
      });
      return { g, acc, lbl, x: X[i] };
    });
    // clic en un archivo → ir a su paso
    files.forEach((f) => f.lbl.el.querySelector('button').addEventListener('click', (e) => {
      document.dispatchEvent(new CustomEvent('presentacion:goto', { detail: { id: entry.meta.id, step: Number(e.currentTarget.dataset.step) } }));
    }));

    const s = K.state({ show: 0, open: 0, rise: 0, sel: -1, agent: 0, selV: 0 }, (st, time) => {
      F.scale.setScalar(Math.max(0.0001, st.show));
      F.visible = st.show > 0.002;
      hinge.rotation.x = st.open * 0.55;
      nameLbl.s.o = st.show; nameLbl.s.y = 0;
      files.forEach((f, i) => {
        const rise = Math.min(1, Math.max(0, st.rise * 1.6 - i * 0.2));
        const selected = Math.round(st.sel) === i;
        const lift = selected ? 0.35 * st.selV : 0;
        f.g.position.set(f.x * rise, -0.2 + rise * 2.35 + lift, -0.1 + rise * 0.55);
        f.g.scale.setScalar(Math.max(0.0001, 0.6 + rise * 0.4 + (selected ? 0.12 * st.selV : 0)));
        f.g.visible = st.open > 0.05;
        K.setAccent(f.acc, selected ? 1 : st.agent > 0 ? (Math.sin(time * 3 + i) * 0.5 + 0.5) * st.agent : 0.15);
        f.lbl.s.o = rise > 0.95 ? 1 : 0; f.lbl.s.y = 0;
        f.lbl.el.classList.toggle('is-on', selected);
      });
    });
    K.idle(() => {});
    return { s };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.show($(st, '.b-tl h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.caps($$(st, '.pj-caps > p'));
    ctx.seq($$(st, '.pj-card'), 2, { keepLast: true });
    ctx.show($(st, '.pj-hint'), ctx.at(2, 0.5));
    ctx.hide($(st, '.pj-hint'), ctx.at(6, 0));
    if (!r.s) return;
    ctx.to(r.s, { show: 1, duration: 0.5, ease: 'back.out(1.3)' }, ctx.at(0, 0.3));
    ctx.to(r.s, { open: 1, duration: 0.45, ease: 'power3.inOut' }, ctx.at(1, 0));
    ctx.to(r.s, { rise: 1, duration: 0.6, ease: 'power3.out' }, ctx.at(1, 0.25));
    for (let i = 0; i < 4; i++) {
      ctx.set(r.s, { sel: i }, ctx.at(i + 2, 0));
      ctx.fromTo(r.s, { selV: 0 }, { selV: 1, duration: 0.3, ease: 'back.out(1.6)' }, ctx.at(i + 2, 0.02));
    }
    ctx.set(r.s, { sel: -1 }, ctx.at(6, 0));
    ctx.to(r.s, { agent: 1, duration: 0.4 }, ctx.at(6, 0.2));
  },
};
