/* 13 · DE PÁGINA BONITA A SISTEMA REAL — web → formulario → webhook → n8n → IA → CRM / email·WhatsApp / database */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.sistema;

/* Posiciones compartidas con el capítulo 14 y el cierre (mismo grafo). */
export const GRAPH = {
  web: { kind: 'web', at: [0, 0.2, 3.2] },
  form: { kind: 'form', at: [-3.6, 1.7, 0.6], scale: 0.7 },
  hook: { kind: 'hook', at: [-1.4, 3.3, -1.6], scale: 0.7 },
  n8n: { kind: 'n8n', at: [2.2, 2.5, -2.6], scale: 0.9 },
  ai: { kind: 'orb', at: [5.2, 0.2, -3.2], scale: 0.72 },
  crm: { kind: 'crm', at: [3.2, -2.6, -2.0], scale: 0.75 },
  msg: { kind: 'chat', at: [-0.6, -3.3, -1.2], scale: 0.75 },
  db: { kind: 'db', at: [-4.6, -1.6, -2.4], scale: 0.7 },
};
export const EDGES = [['web', 'form'], ['form', 'hook'], ['hook', 'n8n'], ['n8n', 'ai'], ['ai', 'crm'], ['crm', 'msg'], ['crm', 'db']];

export function buildGraph(K, { labels = true, nodes = T.nodes } = {}) {
  const N = {};
  for (const k in GRAPH) {
    const g = GRAPH[k];
    const left = k === 'web';
    N[k] = K.node(g.kind, { at: g.at, scale: g.scale || 1, label: labels ? nodes[k][0] : null, sub: labels ? nodes[k][1] : null, labelAt: left ? [1.45, -0.2, 0] : undefined });
    if (left && N[k].label) N[k].label.obj.center.set(0, 0.5);
  }
  const E = EDGES.map(([a, b]) => {
    const pa = new K.THREE.Vector3(...GRAPH[a].at), pb = new K.THREE.Vector3(...GRAPH[b].at);
    const mid = pa.clone().lerp(pb, 0.5);
    mid.z += 0.8; mid.y += 0.35;
    const curve = new K.THREE.QuadraticBezierCurve3(pa, mid, pb);
    const link = K.link(null, { curve, width: 2.6 });
    const flow = K.flow(curve, { count: 3, speed: 0.2, size: 0.07 });
    return { a, b, curve, link, flow };
  });
  return { N, E };
}

export default {
  steps: 5,
  cams: [
    { p: [0, 0.35, 9.2], t: [0, 0.2, 3.2], fov: 32 },
    { p: [-0.8, 0.9, 13.5], t: [-1.4, 1.2, 1.2] },
    { p: [0.8, 1.3, 17], t: [0.6, 1.0, -0.8] },
    { p: [0.4, 1.0, 20.5], t: [0.2, -0.1, -1.2] },
    { p: [-2.6, 1.6, 23.5], t: [0.2, -1.3, -1.4] },
  ],
  fog: [24, 58],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <h2 class="sr-only" id="${entry.meta.id}-h">${esc(TEXT.sistema.statement)}</h2>
      <div class="block b-bl caps sy-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <p class="sy-statement h2" data-r>${esc(T.statement)}</p>
      <div class="fallback flow" aria-hidden="true">${Object.values(T.nodes).map((n) => `<span class="chip">${esc(n[0])}</span>`).join('<span class="arrow">→</span>')}</div>
    `);
  },

  scene(K) {
    return buildGraph(K);
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.caps($$(st, '.sy-caps > p'));
    ctx.show($(st, '.sy-statement'), ctx.at(4, 0.35));
    if (!r.N) return;
    const N = r.N;
    const pop = { show: 1, duration: 0.45, ease: 'back.out(1.4)' };
    const reveal = (k, list, base = 0.1) => list.forEach((key, j) => {
      const t = ctx.at(k, base + j * 0.14);
      const e = r.E.find((x) => x.b === key);
      if (e) ctx.to(e.link.s, { draw: 1, hot: 0.7, duration: 0.3 }, t);
      ctx.to(N[key].s, pop, t + 0.12);
      ctx.to(N[key].s, { on: 1, duration: 0.2 }, t + 0.3);
    });
    ctx.to(N.web.s, pop, ctx.at(0, 0.3));
    ctx.to(N.web.s, { on: 1, duration: 0.2 }, ctx.at(0, 0.6));
    reveal(1, ['form', 'hook']);
    reveal(2, ['n8n', 'ai']);
    reveal(3, ['crm', 'msg', 'db']);
    r.E.forEach((e) => ctx.to(e.flow.s, { on: 1, duration: 0.3 }, ctx.at(4, 0.1)));
  },
};
