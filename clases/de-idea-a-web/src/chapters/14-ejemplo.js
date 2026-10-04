/* 14 · EJEMPLO CON DATOS SIMULADOS — formulario → JSON → webhook → n8n → IA (clasifica) → CRM */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$, jsonLines } from '../ui/shared.js';

const T = TEXT.ejemplo;
const KINDS = ['hook', 'n8n', 'orb', 'crm'];

export default {
  steps: 6,
  cams: [
    { p: [2.4, 0.4, 16], t: [2.4, -0.1, 0] },
  ],
  fog: [18, 46],

  mount(stage, entry) {
    const pairs = T.fields.map(([, k, v]) => [k, v]);
    stage.insertAdjacentHTML('beforeend', `
      <h2 class="sr-only" id="${entry.meta.id}-h">${esc(entry.meta.nav)}</h2>
      <div class="ex-left">
        <p class="label ex-tag" data-r>${esc(T.tag)}</p>
        <div class="ex-form card" data-r>
          ${T.fields.map(([label, , value], i) => `<div class="ex-field ${i === 3 ? 'is-area' : ''}"><span class="label">${esc(label)}</span><span class="ex-val">${esc(value)}</span></div>`).join('')}
          <span class="ex-btn">${esc(T.button)}</span>
        </div>
        <pre class="code ex-json" data-r><span class="tk-punc">{</span>\n${jsonLines(pairs).map((l) => `<span class="ex-jl">${l}</span>`).join('\n')}\n<span class="tk-punc">}</span></pre>
        <p class="ex-bridge body" data-r>${esc(T.bridge)}</p>
      </div>
      <div class="block b-bl caps ex-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <div class="ex-summary flow" data-r>${T.summary.map((s, i) => `<span class="chip ${i === 1 ? 'is-signal' : ''}">${esc(s)}</span>`).join('<span class="arrow">→</span>')}</div>
      <div class="fallback flow" aria-hidden="true">${T.route.map((s) => `<span class="chip">${esc(s)}</span>`).join('<span class="arrow">→</span>')}</div>
    `);
  },

  scene(K) {
    const X = 5.4;
    const ys = [2.35, 0.8, -0.8, -2.35];
    const nodes = T.route.map((name, i) => K.node(KINDS[i], { at: [X, ys[i], 0], scale: i === 1 ? 0.7 : 0.55, label: name, labelAt: [1.25, 0, 0] }));
    nodes.forEach((n) => n.label.obj.center.set(0, 0.5));
    const links = [0, 1, 2].map((i) => K.link([[X, ys[i] - 0.55, 0], [X, ys[i + 1] + 0.55, 0]], { width: 2.6, arc: 0 }));
    const inCurve = K.curveOf([[-0.2, 1.5, 0], [2.2, 2.6, 0], [X - 0.8, 2.35, 0]]);
    const inLink = K.link(null, { curve: inCurve, width: 3 });
    const route = K.curveOf([[X - 0.8, 2.35, 0.3], [X - 0.6, 0.8, 0.4], [X - 0.6, -0.8, 0.4], [X - 0.6, -2.35, 0.3]]);
    const pkt = K.pulse(inCurve, { size: 0.17 });
    const pkt2 = K.pulse(route, { size: 0.15 });
    const aiCard = K.label(null, null, {
      at: [X - 1.3, ys[2], 0], center: [1, 0.5], cls: 'ex-card',
      html: `<span class="ex-card-t">IA · clasificación</span>${T.ai.map(([k, v]) => `<span class="ex-kv"><b>${esc(k)}</b><em>${esc(v)}</em></span>`).join('')}`,
    });
    const crmCard = K.label(null, null, {
      at: [X - 1.3, ys[3] - 0.2, 0], center: [1, 0.5], cls: 'ex-card ex-crm',
      html: `<span class="ex-card-t">CRM · nuevo registro</span><table><tr>${T.crmCols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr><tr>${T.crmRow.map((c, i) => `<td${i === 4 ? ' class="ok"' : ''}>${esc(c)}</td>`).join('')}</tr></table>`,
    });
    return { nodes, links, inLink, pkt, pkt2, aiCard, crmCard };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const form = $(st, '.ex-form');
    const json = $(st, '.ex-json');
    const jl = $$(st, '.ex-jl');
    ctx.show($(st, '.ex-tag'), ctx.at(0, 0.2));
    ctx.show(form, ctx.at(0, 0.3), { y: 30, d: 0.5 });
    ctx.caps($$(st, '.ex-caps > p'));

    // 1 · el formulario se convierte en JSON
    ctx.to($(st, '.ex-btn'), { '--press': 1, duration: 0.1 }, ctx.at(1, 0));
    ctx.to(form, { opacity: 0, y: -30, scale: 0.96, duration: 0.35, ease: 'power2.in' }, ctx.at(1, 0.05));
    ctx.fromTo(json, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, ctx.at(1, 0.3));
    ctx.fromTo(jl, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.18, stagger: 0.07 }, ctx.at(1, 0.4));
    ctx.show($(st, '.ex-bridge'), ctx.at(1, 0.7));
    ctx.hide($(st, '.ex-bridge'), ctx.at(3, 0));

    if (r.nodes) {
      ctx.to(r.nodes.map((n) => n.s), { show: 1, duration: 0.45, ease: 'back.out(1.3)', stagger: 0.06 }, ctx.at(0, 0.4));
      ctx.to(r.links.map((l) => l.s), { draw: 1, duration: 0.4 }, ctx.at(0, 0.6));
      // 2 · webhook → n8n
      ctx.to(json, { '--sent': 1, duration: 0.2 }, ctx.at(2, 0));
      ctx.to(r.inLink.s, { draw: 1, hot: 1, duration: 0.35 }, ctx.at(2, 0.05));
      ctx.to(r.pkt.s, { show: 1, duration: 0.05 }, ctx.at(2, 0.05));
      ctx.to(r.pkt.s, { p: 1, duration: 0.35 }, ctx.at(2, 0.05));
      ctx.to(r.nodes[0].s, { on: 1, duration: 0.15 }, ctx.at(2, 0.4));
      ctx.to(r.pkt.s, { show: 0, duration: 0.05 }, ctx.at(2, 0.42));
      ctx.to(r.pkt2.s, { show: 1, duration: 0.05 }, ctx.at(2, 0.45));
      ctx.to(r.pkt2.s, { p: 0.33, duration: 0.3 }, ctx.at(2, 0.45));
      ctx.to(r.links[0].s, { hot: 1, duration: 0.2 }, ctx.at(2, 0.45));
      ctx.to(r.nodes[1].s, { on: 1, duration: 0.15 }, ctx.at(2, 0.75));
      // 3 · la IA clasifica
      ctx.to(r.pkt2.s, { p: 0.66, duration: 0.3 }, ctx.at(3, 0.05));
      ctx.to(r.links[1].s, { hot: 1, duration: 0.2 }, ctx.at(3, 0.05));
      ctx.to(r.nodes[2].s, { on: 1, duration: 0.15 }, ctx.at(3, 0.35));
      ctx.to(r.aiCard.s, { o: 1, y: 0, duration: 0.3 }, ctx.at(3, 0.45));
      // 4 · el CRM registra
      ctx.to(r.pkt2.s, { p: 1, duration: 0.3 }, ctx.at(4, 0.05));
      ctx.to(r.links[2].s, { hot: 1, duration: 0.2 }, ctx.at(4, 0.05));
      ctx.to(r.nodes[3].s, { on: 1, duration: 0.15 }, ctx.at(4, 0.35));
      ctx.to(r.pkt2.s, { show: 0, duration: 0.05 }, ctx.at(4, 0.4));
      ctx.to(r.crmCard.s, { o: 1, y: 0, duration: 0.3 }, ctx.at(4, 0.45));
    }
    // 5 · resumen del flujo
    ctx.show($(st, '.ex-summary'), ctx.at(5, 0.3), { y: 20 });
  },
};
