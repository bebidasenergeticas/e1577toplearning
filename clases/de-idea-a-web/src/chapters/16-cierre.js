/* 16 · CIERRE — la misma laptop del inicio; detrás, la arquitectura completa. ANTES → AHORA → frase final. */
import { TEXT, COURSE } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';
import { roundRect } from './00-intro.js';
import { GRAPH, EDGES } from './13-sistema.js';

const T = TEXT.cierre;

function drawFinal(ctx, w, h, d) {
  ctx.fillStyle = '#f3f0e9';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e4dfd4';
  ctx.fillRect(0, 0, w, 120);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 170, 26, w - 220, 68, 34); ctx.fill();
  ctx.font = '500 40px "Geist Mono Variable", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#161616';
  ctx.fillText('www.ejemplo.com', 206, 61);
  if (d.ready > 0.5) {
    ctx.fillStyle = '#1a4fe0';
    ctx.font = '500 26px "Geist Mono Variable", monospace';
    ctx.fillText('CONSULTORÍA PARA PYMES', 110, 230);
    ctx.fillStyle = '#161616';
    ctx.font = '650 92px "Geist Variable", sans-serif';
    ctx.fillText('Ordenamos tus', 104, 330);
    ctx.fillText('procesos.', 104, 430);
    ctx.fillStyle = '#161616';
    roundRect(ctx, 110, 500, 360, 84, 18); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 32px "Geist Variable", sans-serif';
    ctx.fillText('Agendar llamada', 150, 543);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 760, 200, 420, 400, 22); ctx.fill();
    ctx.fillStyle = '#ece8df';
    [250, 330, 410].forEach((y) => { roundRect(ctx, 800, y, 340, 56, 12); ctx.fill(); });
    ctx.fillStyle = '#1a4fe0';
    roundRect(ctx, 800, 500, 340, 64, 14); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('Enviar', 925, 533);
  } else {
    ctx.fillStyle = '#e8e3d9';
    roundRect(ctx, w / 2 - 170, h / 2 - 10, 340, 26, 13); ctx.fill();
  }
}
drawFinal.key = (d) => String(d.ready > 0.5);

export default {
  steps: 4,
  cams: [
    { p: [0, 2.6, 12.5], t: [0, 1.2, -1] },
    { p: [0, 3.0, 16.5], t: [0, 1.7, -2] },
    { p: [-5.2, 4.6, 18.5], t: [-5.2, 3.7, -2] },
    { p: [-5.2, 4.6, 18.5], t: [-5.2, 3.7, -2] },
  ],
  fog: [16, 46],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <h2 class="sr-only" id="${entry.meta.id}-h">${esc(entry.meta.nav)}</h2>
      <div class="cl-before" data-r><p class="label">${esc(T.before)}</p><p class="cl-bad h2">“${esc(T.bad)}”</p></div>
      <div class="cl-now" data-r>
        <p class="label accent">${esc(T.now)}</p>
        <ol class="cl-chain">${T.chain.map((c, i) => `<li data-r><i>${String(i + 1).padStart(2, '0')}</i>${esc(c)}</li>`).join('')}</ol>
      </div>
      <div class="cl-final" data-r>
        <p class="h-display cl-f1">${esc(T.final[0])}</p>
        <p class="h1 cl-f2">${esc(T.final[1])}</p>
      </div>
      <div class="cl-sign" data-r><p class="h2">${esc(T.sign)}</p><p class="label">${esc(T.org)} · ${esc(COURSE.title)}</p></div>
    `);
  },

  scene(K) {
    const lap = K.laptop({ at: [0, 0, 1.6], draw: drawFinal });
    lap.data = { ready: 0 };
    lap.s.show = 1;
    // Constelación de la arquitectura detrás de la laptop
    const back = K.group([0, 2.0, -5.5]);
    back.scale.setScalar(0.95);
    const N = {};
    for (const k in GRAPH) {
      if (k === 'web') continue;
      N[k] = K.node(GRAPH[k].kind, { at: GRAPH[k].at, scale: (GRAPH[k].scale || 1) * 0.9, parent: back });
    }
    N.web = K.node('web', { at: [0, -2.6, 3.2], scale: 0.5, parent: back });
    const links = EDGES.map(([a, b]) => {
      const pa = N[a].obj.position.clone(), pb = N[b].obj.position.clone();
      const mid = pa.clone().lerp(pb, 0.5); mid.z += 0.8;
      const curve = new K.THREE.QuadraticBezierCurve3(pa, mid, pb);
      return { link: K.link(null, { curve, width: 2, parent: back }), flow: K.flow(curve, { count: 3, speed: 0.18, size: 0.08, parent: back }) };
    });
    return { lap, N, links };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.show($(st, '.cl-before'), ctx.at(0, 0.3));
    // 1 · AHORA: del problema al resultado, con la arquitectura detrás
    ctx.to($(st, '.cl-before'), { opacity: 0.35, duration: 0.3 }, ctx.at(1, 0));
    ctx.to($(st, '.cl-bad'), { '--strike': 1, duration: 0.3 }, ctx.at(1, 0));
    ctx.show($(st, '.cl-now'), ctx.at(1, 0.1), { y: 10 });
    ctx.show($$(st, '.cl-chain li'), ctx.at(1, 0.2), { y: 14, d: 0.25, stagger: 0.06 });
    if (r.lap) {
      ctx.to(r.lap.data, { ready: 1, duration: 0.05 }, ctx.at(1, 0.15));
      const nodes = Object.values(r.N);
      ctx.to(nodes.map((n) => n.s), { show: 1, duration: 0.4, ease: 'back.out(1.3)', stagger: 0.05 }, ctx.at(1, 0.2));
      ctx.to(nodes.map((n) => n.s), { on: 0.8, duration: 0.3 }, ctx.at(1, 0.5));
      ctx.to(r.links.map((l) => l.link.s), { draw: 1, hot: 0.5, duration: 0.5 }, ctx.at(1, 0.3));
      ctx.to(r.links.map((l) => l.flow.s), { on: 1, duration: 0.3 }, ctx.at(1, 0.7));
    }
    // 2 · la frase final
    ctx.hide([$(st, '.cl-before'), $(st, '.cl-now')], ctx.at(2, 0));
    ctx.show($(st, '.cl-final'), ctx.at(2, 0.25), { y: 30, d: 0.6 });
    // 3 · firma
    ctx.show($(st, '.cl-sign'), ctx.at(3, 0.3));
  },
};
