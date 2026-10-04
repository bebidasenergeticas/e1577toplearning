/* 05 · ¿QUÉ ES EL BACKEND? — formulario → request → backend → database / email / CRM / n8n / IA */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.backend;
const KINDS = ['db', 'mail', 'crm', 'n8n', 'orb'];

export default {
  steps: 6,
  cams: [
    { p: [0.6, 0.6, 15.5], t: [0.6, 0, 0] },
    { p: [-1.2, 0.8, 15.5], t: [-1.2, 0, 0] },
    { p: [-0.4, 0.9, 15.5], t: [-0.4, 0, 0] },
    { p: [0.8, 0.9, 15], t: [0.8, 0, 0] },
    { p: [1.6, 1.1, 16], t: [1.6, -0.1, 0] },
    { p: [4.4, 1.2, 15.5], t: [4.4, -0.4, 0] },
  ],
  fog: [20, 50],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <h2 class="be-q h1" id="${entry.meta.id}-h" data-r>${esc(T.question)}</h2>
      <div class="be-form card" data-r aria-hidden="true">
        ${T.form.fields.map((f, i) => `<div class="be-field ${i === 3 ? 'is-area' : ''}"><span class="label">${esc(f)}</span><span class="be-input"></span></div>`).join('')}
        <span class="be-btn">${esc(T.form.button)}</span>
      </div>
      <div class="block b-bl caps be-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <div class="block b-tl be-statement" data-r><p class="h2">${esc(T.statement[0])}</p><p class="h2 accent">${esc(T.statement[1])}</p></div>
      <div class="fallback flow" aria-hidden="true"><span class="chip">Formulario</span><span class="arrow">→</span><span class="chip is-signal">Backend</span><span class="arrow">→</span>${T.branches.map((b) => `<span class="chip">${esc(b[0])}</span>`).join('')}</div>
      <p class="sr-only">Al presionar enviar, el formulario manda una petición al backend. El backend decide qué hacer: guardar en una base de datos, enviar un email, registrar en un CRM, activar n8n o consultar a una IA.</p>
    `);
  },

  scene(K) {
    // Formulario 3D (aparece donde estaba el formulario HTML)
    const form = K.node('form', { at: [-5.4, 0, 0], scale: 0.9, label: 'Formulario' });
    // Núcleo del backend: bloque con anillo
    const hub = K.group([1.0, 0, 0]);
    const core = K.mesh(K.rbox(1.7, 1.7, 1.7, 0.18), K.M.body, [0, 0, 0], hub);
    const ringMat = K.accentMat('signal');
    const ring = K.mesh(K.tor(1.45, 0.035), ringMat, [0, 0, 0], hub);
    ring.rotation.x = Math.PI / 2.3;
    const ring2 = K.mesh(K.tor(1.75, 0.02), ringMat, [0, 0, 0], hub);
    ring2.rotation.x = Math.PI / 1.8; ring2.rotation.y = 0.5;
    const leds = [-0.45, 0, 0.45].map((y) => K.mesh(K.sph(0.07), ringMat, [0.55, y, 0.86], hub));
    K.shadow(3.2, 2.4, { at: [1.0, -1.3, 0], opacity: 0.4 });
    const hubLabel = K.label(T.hub[0], T.hub[1], { at: [1.0, -1.45, 0] });

    // Petición formulario → backend
    const reqCurve = K.curveOf([[-4.4, 0, 0], [-2.6, 0.7, 0], [-0.8, 0.3, 0], [0.1, 0, 0]]);
    const req = K.link(null, { curve: reqCurve, width: 3 });
    const pkt = K.pulse(reqCurve, { size: 0.16 });
    const reqLabel = K.label(T.request, null, { at: [-2.4, 0.95, 0], cls: 'pill is-signal', center: [0.5, 1] });

    // Ramas
    const ys = [2.9, 1.45, 0, -1.45, -2.9];
    const branches = T.branches.map(([name, verb], i) => {
      const at = [6.0, ys[i], i % 2 ? 0.3 : -0.3];
      const n = K.node(KINDS[i], { at, scale: 0.5, label: name, sub: verb, labelAt: [0.85, 0, 0] });
      n.label.obj.center.set(0, 0.5);
      const curve = K.curveOf([[1.95, ys[i] * 0.18, 0], [3.4, ys[i] * 0.55, 0], [5.1, ys[i], at[2]]]);
      const l = K.link(null, { curve, width: 2.4 });
      const f = K.flow(curve, { count: 4, speed: 0.28, size: 0.06 });
      return { n, l, f };
    });

    const s = K.state({ hub: 0, on: 0 }, (st, time) => {
      const v = Math.max(0.0001, st.hub);
      hub.scale.setScalar(v);
      hub.visible = st.hub > 0.002;
      K.setAccent(ringMat, st.on);
      hubLabel.s.o = Math.min(1, st.hub * 1.5 - 0.3); hubLabel.s.y = (1 - st.hub) * 10;
      ring.rotation.z = time * 0.35 * st.on;
      ring2.rotation.z = -time * 0.22 * st.on;
      core.rotation.y = 0.5 + Math.sin(time * 0.3) * 0.08 * st.on;
    });
    K.idle(() => {});
    return { form, req, pkt, reqLabel, branches, s, leds };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const formEl = $(st, '.be-form');
    const btn = $(st, '.be-btn');
    ctx.show($(st, '.be-q'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.show(formEl, ctx.at(0, 0.4), { y: 40, d: 0.6 });
    ctx.caps($$(st, '.be-caps > p'));
    ctx.show($(st, '.be-statement'), ctx.at(5, 0.3));

    // 1 · se presiona ENVIAR y el formulario se empaqueta
    ctx.to(btn, { '--press': 1, duration: 0.12 }, ctx.at(1, 0));
    ctx.hide($(st, '.be-q'), ctx.at(1, 0.05));
    ctx.to(formEl, { scale: 0.32, xPercent: -150, opacity: 0, duration: 0.55, ease: 'power3.inOut' }, ctx.at(1, 0.15));
    if (!r.form) return;
    ctx.to(r.form.s, { show: 1, duration: 0.45, ease: 'back.out(1.4)' }, ctx.at(1, 0.45));
    ctx.to(r.form.s, { on: 1, duration: 0.2 }, ctx.at(1, 0.75));

    // 2 · viaja la petición (request)
    ctx.to(r.s, { hub: 1, duration: 0.5, ease: 'back.out(1.3)' }, ctx.at(2, 0));
    ctx.to(r.req.s, { draw: 1, hot: 1, duration: 0.55 }, ctx.at(2, 0.1));
    ctx.to(r.pkt.s, { show: 1, duration: 0.05 }, ctx.at(2, 0.1));
    ctx.to(r.pkt.s, { p: 1, duration: 0.55, ease: 'power2.inOut' }, ctx.at(2, 0.1));
    ctx.to(r.reqLabel.s, { o: 1, y: 0, duration: 0.3 }, ctx.at(2, 0.2));

    // 3 · el backend recibe y decide
    ctx.to(r.pkt.s, { show: 0, duration: 0.1 }, ctx.at(3, 0));
    ctx.to(r.s, { on: 1, duration: 0.4 }, ctx.at(3, 0.05));

    // 4 · las ramas: database, email, CRM, n8n, IA
    r.branches.forEach((b, i) => {
      const t = ctx.at(4, i * 0.12);
      ctx.to(b.l.s, { draw: 1, hot: 0.6, duration: 0.3 }, t);
      ctx.to(b.n.s, { show: 1, duration: 0.35, ease: 'back.out(1.5)' }, t + 0.12);
      ctx.to(b.n.s, { on: 1, duration: 0.2 }, t + 0.3);
    });
    // 5 · flujo continuo hacia cada destino
    r.branches.forEach((b) => ctx.to(b.f.s, { on: 1, duration: 0.3 }, ctx.at(5, 0)));
    ctx.to(r.reqLabel.s, { o: 0, duration: 0.2 }, ctx.at(5, 0));
    ctx.to(r.form.s, { show: 0, duration: 0.3 }, ctx.at(5, 0));
    ctx.to(r.req.s, { o: 0, duration: 0.3 }, ctx.at(5, 0));
  },
};
