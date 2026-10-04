/* 06 · DATABASE · API · WEBHOOK — guardar · pedir y responder · avisar automáticamente */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.datos;

export default {
  steps: 5,
  cams: [
    { p: [0, 2.6, 26], t: [0, 0, 0] },
    { p: [-7.4, 1.6, 12.5], t: [-7.4, -0.1, 0] },
    { p: [0, 1.7, 12.5], t: [0, 0.1, 0] },
    { p: [8.2, 1.6, 12.5], t: [8.2, -0.1, 0] },
    { p: [0, 2.8, 26.5], t: [0, -0.5, 0] },
  ],
  fog: [26, 70],

  mount(stage, entry) {
    const def = (d, cls) => `<div class="dt-def ${cls}" data-r><p class="label accent">${esc(d.es)}</p><p class="h1">${esc(d.name)}</p><p class="lead strong">${esc(d.def)}</p></div>`;
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <div class="dt-defs">${def(T.db, 'db')}${def(T.api, 'api')}${def(T.hook, 'hook')}</div>
      <div class="dt-compare" data-r>${T.compare.map(([a, b]) => `<div><span class="label accent">${esc(a)}</span><p class="h2">${esc(b)}</p></div>`).join('')}</div>
      <p class="block b-br body dt-note" data-r>${esc(T.caps[4])}</p>
      <div class="fallback flow" aria-hidden="true"><span class="chip">${esc(T.db.name)}: guardar</span><span class="chip">${esc(T.api.name)}: preguntar y responder</span><span class="chip">${esc(T.hook.name)}: avisar</span></div>
    `);
  },

  scene(K) {
    const X = { db: -8.2, api: 0, hook: 8.2 };
    // ── Database
    const db = K.node('db', { at: [X.db, -0.2, 0], scale: 1.15 });
    K.shadow(3.2, 2.4, { at: [X.db, -1.15, 0], opacity: 0.4 });
    const rows = [0, 1, 2].map(() => K.mesh(K.rbox(1.1, 0.14, 0.55, 0.05), K.accentMat('signal'), [X.db, 3, 0]));
    rows.forEach((m) => K.setAccent(m.material, 1));
    const table = K.label(null, null, {
      at: [X.db + 2.2, 0.9, 0], center: [0, 0.5], cls: 'dt-table-l',
      html: `<span class="dt-tag">${esc(T.db.tag)}</span><table class="dt-table"><tr>${T.db.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>${T.db.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`,
    });

    // ── API: puente entre dos sistemas
    const a = K.node('browser', { at: [X.api - 2.6, 0, 0], scale: 0.75, label: T.api.a });
    const b = K.node('server', { at: [X.api + 2.6, 0, 0], scale: 0.75, label: T.api.b });
    const bridgeCurve = K.curveOf([[X.api - 1.6, 0.25, 0], [X.api + 1.6, 0.25, 0]], { arc: 1.3 });
    const bridge = K.link(null, { curve: bridgeCurve, width: 5 });
    const backCurve = K.curveOf([[X.api + 1.6, -0.15, 0], [X.api - 1.6, -0.15, 0]], { arc: -0.9 });
    const back = K.link(null, { curve: backCurve, width: 3, hotColor: K.P.ok });
    const q = K.pulse(bridgeCurve, { size: 0.15 });
    const rsp = K.pulse(backCurve, { color: 'ok', size: 0.15 });
    const qLbl = K.label(T.api.req, null, { at: [X.api, 1.75, 0], cls: 'pill sentence is-signal', center: [0.5, 1] });
    const rLbl = K.label(T.api.res, null, { at: [X.api, -1.3, 0], cls: 'pill sentence', center: [0.5, 0] });

    // ── Webhook: un evento dispara un aviso
    const ev = K.node('form', { at: [X.hook - 2.4, 0, 0], scale: 0.7, label: T.hook.event });
    const hook = K.node('hook', { at: [X.hook - 2.4, 1.3, 0.3], scale: 0.55 });
    const target = K.node('n8n', { at: [X.hook + 2.5, 0, 0], scale: 0.9, label: T.hook.target });
    const hookCurve = K.curveOf([[X.hook - 1.6, 1.0, 0.2], [X.hook, 1.7, 0], [X.hook + 1.6, 0.4, 0]]);
    const hookLine = K.link(null, { curve: hookCurve, width: 3 });
    const sig = K.pulse(hookCurve, { size: 0.15 });

    const s = K.state({ rows: 0, table: 0 }, (st) => {
      rows.forEach((m, i) => {
        const t = Math.min(1, Math.max(0, st.rows * 3 - i));
        m.visible = t > 0 && t < 1;
        m.position.y = 3 - t * 2.4;
        m.scale.setScalar(1 - t * 0.35);
      });
      table.s.o = st.table; table.s.y = (1 - st.table) * 10;
    });
    return { db, s, a, b, bridge, back, q, rsp, qLbl, rLbl, ev, hook, target, hookLine, sig };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.show($(st, '.b-tl h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.hide($(st, '.b-tl h2'), ctx.at(1, 0));
    ctx.seq($$(st, '.dt-def'), 1, { keepLast: false });
    ctx.show($(st, '.dt-compare'), ctx.at(4, 0.3));
    ctx.show($(st, '.dt-note'), ctx.at(4, 0.5));
    if (!r.db) return;
    const pop = { show: 1, duration: 0.45, ease: 'back.out(1.4)' };

    // 0 · las tres estaciones, apenas sugeridas
    ctx.to([r.db.s, r.a.s, r.b.s, r.ev.s, r.target.s], { show: 0.45, duration: 0.5, stagger: 0.04 }, ctx.at(0, 0.3));

    // 1 · Database: los registros entran al cilindro
    ctx.to(r.db.s, { ...pop }, ctx.at(1, 0));
    ctx.to(r.db.s, { on: 1, duration: 0.2 }, ctx.at(1, 0.2));
    ctx.to(r.s, { rows: 1, duration: 0.55, ease: 'none' }, ctx.at(1, 0.2));
    ctx.to(r.s, { table: 1, duration: 0.3 }, ctx.at(1, 0.55));
    ctx.to(r.s, { table: 0, duration: 0.25 }, ctx.at(2, 0));

    // 2 · API: pregunta y respuesta por el puente
    ctx.to([r.a.s, r.b.s], { ...pop, stagger: 0.06 }, ctx.at(2, 0));
    ctx.to(r.bridge.s, { draw: 1, duration: 0.3 }, ctx.at(2, 0.1));
    ctx.to(r.q.s, { show: 1, duration: 0.05 }, ctx.at(2, 0.2));
    ctx.to(r.q.s, { p: 1, duration: 0.35 }, ctx.at(2, 0.2));
    ctx.to(r.bridge.s, { hot: 1, duration: 0.2 }, ctx.at(2, 0.2));
    ctx.to(r.qLbl.s, { o: 1, y: 0, duration: 0.2 }, ctx.at(2, 0.2));
    ctx.to(r.b.s, { on: 1, duration: 0.15 }, ctx.at(2, 0.5));
    ctx.to(r.q.s, { show: 0, duration: 0.05 }, ctx.at(2, 0.55));
    ctx.to(r.back.s, { draw: 1, hot: 1, duration: 0.3 }, ctx.at(2, 0.55));
    ctx.to(r.rsp.s, { show: 1, duration: 0.05 }, ctx.at(2, 0.55));
    ctx.to(r.rsp.s, { p: 1, duration: 0.35 }, ctx.at(2, 0.58));
    ctx.to(r.rLbl.s, { o: 1, y: 0, duration: 0.2 }, ctx.at(2, 0.7));
    ctx.to(r.a.s, { on: 1, duration: 0.15 }, ctx.at(2, 0.9));

    // 3 · Webhook: el evento dispara el aviso, sin que nadie pregunte
    ctx.to([r.ev.s, r.target.s], { ...pop, stagger: 0.05 }, ctx.at(3, 0));
    ctx.to(r.hook.s, { ...pop }, ctx.at(3, 0.2));
    ctx.to([r.ev.s, r.hook.s], { on: 1, duration: 0.15 }, ctx.at(3, 0.35));
    ctx.to(r.hookLine.s, { draw: 1, hot: 1, duration: 0.35 }, ctx.at(3, 0.4));
    ctx.to(r.sig.s, { show: 1, duration: 0.05 }, ctx.at(3, 0.4));
    ctx.to(r.sig.s, { p: 1, duration: 0.35 }, ctx.at(3, 0.4));
    ctx.to(r.target.s, { on: 1, duration: 0.15 }, ctx.at(3, 0.75));
    ctx.to(r.sig.s, { show: 0, duration: 0.05 }, ctx.at(3, 0.8));
  },
};
