/* 07 · NO TODAS LAS WEBS SON IGUALES — landing page · sitio web · web app (complejidad creciente) */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.tipos;

export default {
  steps: 5,
  cams: [
    { p: [0, 2.6, 19.5], t: [0, 0.1, 0] },
    { p: [-1.6, 2.4, 19], t: [-1.6, 0, 0] },
    { p: [0, 2.4, 19], t: [0, 0, 0] },
    { p: [1.4, 2.4, 19], t: [1.4, 0, 0] },
    { p: [0, 2.6, 21], t: [0, -0.6, 0] },
  ],
  fog: [24, 60],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl-wide"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <p class="tp-q h2" data-r>${esc(T.question)}</p>
      <div class="fallback flow" aria-hidden="true">${T.types.map((t) => `<span class="chip">${esc(t.name)} · ${esc(t.def)}</span>`).join('<span class="arrow">→</span>')}</div>
      <p class="sr-only">${T.types.map((t) => `${t.name}: ${t.def} ${t.ex}`).join(' ')}</p>
    `);
  },

  scene(K) {
    const M = K.M;
    const X = [-6.4, 0, 6.4];
    const sh = (x, w = 3.6, parent) => K.shadow(w, 2.6, { at: [0, -2.0, 0], opacity: 0.18, parent });
    const info = (i, x) => K.label(null, null, {
      at: [x, -2.35, 0], cls: 'tp-info',
      html: `<b>${esc(T.types[i].name)}</b><span>${esc(T.types[i].def)}</span><em>${esc(T.types[i].ex)}</em>`,
    });

    // Landing: una sola página, un objetivo (CTA)
    const landing = K.group([X[0], 0, 0]);
    K.mesh(K.rbox(2.3, 3.4, 0.12, 0.1), M.body, [0, 0, 0], landing);
    K.mesh(K.boxGeo(1.5, 0.22, 0.02), M.inset, [0, 1.1, 0.07], landing);
    K.mesh(K.boxGeo(1.1, 0.1, 0.02), M.inset, [0, 0.78, 0.07], landing);
    const cta = K.accentMat('signal');
    K.mesh(K.rbox(1.3, 0.42, 0.05, 0.08), cta, [0, 0.15, 0.08], landing);
    [-0.5, -0.85, -1.2].forEach((y) => K.mesh(K.boxGeo(1.6, 0.08, 0.02), M.inset, [0, y, 0.07], landing));
    const ctaLbl = K.label(T.cta, null, { at: [X[0] + 0.95, 0.15, 0.1], center: [0, 0.5], cls: 'pill is-signal' });
    sh(X[0], 3.6, landing);
    const landingInfo = info(0, X[0]);

    // Sitio web: varias páginas conectadas (árbol)
    const site = K.group([X[1], 0, 0]);
    const page = (x, y, s = 1) => {
      const g = K.group([x, y, 0], site);
      K.mesh(K.rbox(1.05 * s, 1.35 * s, 0.08, 0.06), M.body, [0, 0, 0], g);
      K.mesh(K.boxGeo(0.7 * s, 0.1 * s, 0.02), M.inset, [0, 0.38 * s, 0.05], g);
      K.mesh(K.boxGeo(0.55 * s, 0.07 * s, 0.02), M.inset, [0, 0.16 * s, 0.05], g);
      K.mesh(K.boxGeo(0.62 * s, 0.07 * s, 0.02), M.inset, [0, -0.02 * s, 0.05], g);
      return g;
    };
    const home = page(0, 1.25, 1.2);
    const kids = [-2.1, -0.7, 0.7, 2.1].map((x) => page(x, -0.95, 0.95));
    const siteLinks = kids.map((k) => K.link([[0, 0.4, 0], [k.position.x, -0.25, 0]], { arc: -0.1, width: 2, parent: site }));
    const pageLbls = [home, ...kids].map((g, i) => K.label(T.pages[i], null, { at: [g.position.x, g.position.y - (i ? 0.85 : 1.0), 0.1], parent: site, cls: 'tp-page' }));
    sh(X[1], 6, site);
    const siteInfo = info(1, X[1]);

    // Web app: interfaz + lógica + usuarios + datos (con datos circulando)
    const app = K.group([X[2], 0, 0]);
    K.mesh(K.rbox(2.8, 1.8, 0.12, 0.1), M.body, [0, 0.95, 0], app);
    K.mesh(K.rbox(0.7, 1.5, 0.03, 0.04), M.body2, [-0.95, 0.95, 0.07], app);
    [1.4, 1.1, 0.8].forEach((y, i) => K.mesh(K.boxGeo(1.4 - i * 0.2, 0.1, 0.02), M.inset, [0.35, y, 0.08], app));
    const logic = K.node('logic', { at: [-1.25, -0.7, 0.4], scale: 0.52, parent: app });
    const usersG = K.group([1.25, -0.6, 0.5], app);
    [[-0.42, 0], [0, 0.12], [0.42, 0]].forEach(([x, z]) => K.node('user', { at: [x, 0, z], scale: 0.38, parent: usersG }).s.show = 1);
    const data = K.node('db', { at: [0.05, -1.3, -0.2], scale: 0.5, parent: app });
    const loop = K.curveOf([[-1.2, 0.2, 0.5], [0, 0.4, 0.7], [1.3, 0.1, 0.6], [0.6, -1.0, 0.3], [-0.6, -1.0, 0.3], [-1.2, 0.2, 0.5]].map(([x, y, z]) => [X[2] + x, y, z]));
    const appFlow = K.flow(loop, { count: 7, speed: 0.12, size: 0.07 });
    sh(X[2], 3.6, app);
    const appInfo = info(2, X[2]);

    // Eje de complejidad
    const axis = K.link([[-8.2, -4.6, 0], [8.4, -4.6, 0]], { width: 2.2 });
    const axisLbl = K.label(`${T.axis} →`, null, { at: [8.4, -4.85, 0], center: [1, 0], cls: 'tp-axis' });

    const groups = [landing, site, app];
    const s = K.state({ a: 0, b: 0, c: 0, ax: 0 }, (st) => {
      [st.a, st.b, st.c].forEach((v, i) => { groups[i].scale.setScalar(Math.max(0.0001, v)); groups[i].visible = v > 0.002; });
      K.setAccent(cta, st.a);
      ctaLbl.s.o = st.a > 0.95 ? 1 : 0; ctaLbl.s.y = 0;
      landingInfo.s.o = st.a; landingInfo.s.y = (1 - st.a) * 10;
      siteInfo.s.o = st.b; siteInfo.s.y = (1 - st.b) * 10;
      appInfo.s.o = st.c; appInfo.s.y = (1 - st.c) * 10;
      siteLinks.forEach((l) => { l.s.draw = st.b; l.s.hot = st.b > 0.95 ? 0.5 : 0; });
      pageLbls.forEach((l) => { l.s.o = st.b > 0.9 ? 1 : 0; l.s.y = 0; });
      logic.s.show = st.c; data.s.show = st.c; data.s.on = st.c; logic.s.on = st.c;
      appFlow.s.on = st.c > 0.95 ? 1 : 0;
      axis.s.draw = st.ax; axisLbl.s.o = st.ax; axisLbl.s.y = 0;
    });
    return { s };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.show($(st, '.b-tl-wide h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.show($(st, '.tp-q'), ctx.at(4, 0.4));
    if (!r.s) return;
    ctx.to(r.s, { a: 1, duration: 0.5, ease: 'back.out(1.3)' }, ctx.at(1, 0.1));
    ctx.to(r.s, { b: 1, duration: 0.6, ease: 'back.out(1.2)' }, ctx.at(2, 0.1));
    ctx.to(r.s, { c: 1, duration: 0.6, ease: 'back.out(1.2)' }, ctx.at(3, 0.1));
    ctx.to(r.s, { ax: 1, duration: 0.5 }, ctx.at(4, 0.1));
  },
};
