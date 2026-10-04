/* 10 · DE LA IDEA AL AGENTE — cadena lineal → ciclo PLAN · ACT · TEST · OBSERVE · FIX ↺ → DONE */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.agente;

export default {
  steps: 6,
  cams: [
    { p: [0, 0.4, 15], t: [0, 0, 0] },
    { p: [-0.6, 0.8, 14], t: [-0.6, -0.2, 0] },
    { p: [-0.6, 0.8, 14], t: [-0.6, -0.2, 0] },
    { p: [-0.6, 0.8, 14], t: [-0.6, -0.2, 0] },
    { p: [-0.3, 0.6, 14.5], t: [-0.3, -0.5, 0] },
    { p: [0.4, 1.4, 17], t: [0.4, -0.6, 0] },
  ],
  fog: [18, 46],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl ag-head"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <ol class="ag-chain" aria-label="Del concepto al resultado">${T.chain.map(([en, es]) => `<li class="ag-tok" data-r><b>${esc(en)}</b><span>${esc(es)}</span></li>`).join('<li class="ag-arr" aria-hidden="true" data-r>→</li>')}</ol>
      <div class="ag-term" data-r aria-label="${esc(T.termTitle)}">
        <p class="ag-term-t"><span></span><span></span><span></span>${esc(T.termTitle)}</p>
        <ol class="ag-lines">${T.term.map(([m, t]) => `<li class="ag-line ${m === '✕' ? 'is-err' : m === '✓' ? 'is-ok' : ''}" data-r><i>${esc(m)}</i>${esc(t)}</li>`).join('')}</ol>
      </div>
      <div class="block b-bl caps ag-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <div class="ag-final" data-r>
        <p class="h2">${esc(T.statement)}</p>
        <div class="ag-bridge"><p class="label">${esc(T.bridge[0])}</p><p class="lead strong">${esc(T.bridge[1])}</p></div>
      </div>
      <div class="fallback flow" aria-hidden="true">${T.loop.map(([en]) => `<span class="chip">${esc(en)}</span>`).join('<span class="arrow">→</span>')}<span class="arrow">↺</span><span class="chip is-ok">${esc(T.done)}</span></div>
    `);
  },

  scene(K) {
    const C = [-3.4, -0.35, 0];
    const R = 1.95;
    const all = K.group([0, 0, 0]);
    const ringG = K.group(C, all);
    ringG.rotation.x = -0.32;
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = Math.PI / 2 - (i / 64) * Math.PI * 2;
      pts.push(new K.THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0));
    }
    const circle = new K.THREE.CatmullRomCurve3(pts, true);
    const ringLine = K.link(null, { curve: circle, width: 3, parent: ringG, samples: 96 });
    const orbit = K.pulse(circle, { size: 0.15, parent: ringG });
    const nodes = T.loop.map(([en, es], i) => {
      const a = Math.PI / 2 - (i / 5) * Math.PI * 2;
      const at = [Math.cos(a) * R, Math.sin(a) * R, 0];
      const g = K.group(at, ringG);
      g.rotation.x = 0.32;
      const n = K.node('chip', { at: [0, 0, 0], parent: g, scale: 0.62, label: en, sub: es, labelAt: [0, -0.62, 0] });
      return n;
    });
    const done = K.node('chip', { at: [0.4, -2.45, 0.4], scale: 0.7, accent: 'ok', label: T.done, sub: 'listo', parent: all });
    const exitCurve = K.curveOf([[C[0] + 1.35, C[1] - 1.6, 0.3], [-1.0, -2.45, 0.4], [-0.5, -2.45, 0.4]]);
    const exit = K.link(null, { curve: exitCurve, width: 3, hotColor: K.P.ok, parent: all });
    const s = K.state({ ring: 0, lap: 0, spin: 0, shift: 0 }, (st, time) => {
      all.position.x = st.shift * 6.4;
      ringG.scale.setScalar(Math.max(0.0001, st.ring));
      ringG.visible = st.ring > 0.002;
      orbit.s.p = ((st.lap % 1) + 1) % 1;
    });
    return { ringLine, orbit, nodes, done, exit, s };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const toks = $$(st, '.ag-chain > li');
    const lines = $$(st, '.ag-line');
    ctx.show($(st, '.ag-head h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.show(toks, ctx.at(0, 0.35), { y: 20, d: 0.3, stagger: 0.025 });
    ctx.caps($$(st, '.ag-caps > p'));

    // 1 · la cadena se convierte en ciclo
    ctx.to(toks, { opacity: 0, scale: 0.6, y: 40, duration: 0.4, stagger: { each: 0.02, from: 'center' } }, ctx.at(1, 0));
    if (r.s) {
      ctx.to(r.s, { ring: 1, duration: 0.6, ease: 'back.out(1.2)' }, ctx.at(1, 0.25));
      ctx.to(r.ringLine.s, { draw: 1, duration: 0.6 }, ctx.at(1, 0.25));
      r.nodes.forEach((n, i) => ctx.to(n.s, { show: 1, duration: 0.35, ease: 'back.out(1.5)' }, ctx.at(1, 0.35 + i * 0.07)));
    }

    // 2 · terminal: primera vuelta (plan → act → test)
    ctx.show($(st, '.ag-term'), ctx.at(2, 0.05), { y: 30 });
    lines.forEach((l, i) => {
      const k = i < 5 ? 2 : i < 8 ? 3 : 4;
      const j = i < 5 ? i : i < 8 ? i - 5 : 0;
      ctx.fromTo(l, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.12, ease: 'none' }, ctx.at(k, 0.15 + j * 0.13));
    });
    if (!r.s) { ctx.show($(st, '.ag-final'), ctx.at(5, 0.3)); return; }
    const lit = (k, idxs, base = 0.15, gap = 0.13) => idxs.forEach((n, j) => {
      ctx.to(r.nodes[n].s, { on: 1, duration: 0.1 }, ctx.at(k, base + j * gap));
      if (j < idxs.length - 1) ctx.to(r.nodes[n].s, { on: 0.25, duration: 0.1 }, ctx.at(k, base + (j + 1) * gap));
    });
    ctx.to(r.orbit.s, { show: 1, duration: 0.05 }, ctx.at(2, 0.1));
    ctx.to(r.ringLine.s, { hot: 0.8, duration: 0.2 }, ctx.at(2, 0.1));
    ctx.to(r.s, { lap: 0.6, duration: 0.7, ease: 'none' }, ctx.at(2, 0.12));
    lit(2, [0, 1, 2]);
    // 3 · el test falla: observar y corregir
    ctx.to(r.s, { lap: 1.6, duration: 0.75, ease: 'none' }, ctx.at(3, 0.1));
    ctx.to(r.nodes[2].s, { on: 0.25, duration: 0.1 }, ctx.at(3, 0.1));
    lit(3, [3, 4, 0, 1, 2], 0.12, 0.13);
    // 4 · todo funciona: sale del ciclo → DONE
    ctx.to(r.nodes.map((n) => n.s), { on: 0.25, duration: 0.15 }, ctx.at(4, 0.05));
    ctx.to(r.orbit.s, { show: 0, duration: 0.1 }, ctx.at(4, 0.1));
    ctx.to(r.exit.s, { draw: 1, hot: 1, duration: 0.35 }, ctx.at(4, 0.15));
    ctx.to(r.done.s, { show: 1, duration: 0.4, ease: 'back.out(1.6)' }, ctx.at(4, 0.35));
    ctx.to(r.done.s, { on: 1, duration: 0.2 }, ctx.at(4, 0.6));
    // 5 · frase y puente con la clase anterior
    ctx.hide([$(st, '.ag-term'), $(st, '.ag-head h2')], ctx.at(5, 0));
    ctx.show($(st, '.ag-final'), ctx.at(5, 0.3));
    ctx.to(r.s, { shift: 1, duration: 0.6, ease: 'power3.inOut' }, ctx.at(5, 0.05));
  },
};
