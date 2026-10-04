/* 03 · FRONTEND: LAS 3 PIEZAS — vista explosionada (CSS 3D): HTML (qué existe), CSS (cómo se ve), JS (qué sucede) */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$, highlight } from '../ui/shared.js';

const T = TEXT.frontend;
const P = T.page;

function pageHTML(mode) {
  const tag = (t) => (mode === 'html' ? `<i class="tg">&lt;${t}&gt;</i>` : '');
  return `
    <div class="mp-nav">${tag('nav')}<b class="mp-brand">${esc(P.brand)}</b><span class="mp-links">${P.links.map((l) => `<span>${esc(l)}</span>`).join('')}</span></div>
    <div class="mp-hero">
      <p class="mp-eyebrow">${tag('p')}${esc(P.eyebrow)}</p>
      <p class="mp-h1">${tag('h1')}${esc(P.h1)}</p>
      <p class="mp-p">${tag('p')}${esc(P.p)}</p>
      <span class="mp-btn">${tag('button')}<span class="mp-btn-t">${esc(P.button)}</span><span class="mp-btn-s">${esc(P.sent)}</span></span>
    </div>
    <div class="mp-cards">${P.cards.map((c) => `<span class="mp-card">${tag('div')}${esc(c)}</span>`).join('')}</div>`;
}

export default {
  steps: 6,

  mount(stage, entry) {
    const L = T.layers;
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl fe-head"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <div class="fe-scene" aria-hidden="true">
        <div class="fe-stack">
          <div class="fe-layer fe-html"><div class="mp mp-wire">${pageHTML('html')}</div><span class="fe-tag">HTML</span></div>
          <div class="fe-layer fe-css"><div class="mp mp-styled">${pageHTML('css')}</div><span class="fe-tag">CSS</span></div>
          <div class="fe-layer fe-js">
            <div class="mp-js">
              <span class="js-ring"></span>
              <svg class="js-cursor" viewBox="0 0 24 24" width="34" height="34"><path d="M4 2l15 9-7 1.5L9 20z" fill="#161616" stroke="#fff" stroke-width="1.5"/></svg>
              <span class="js-event">click → enviar()</span>
            </div>
            <span class="fe-tag">JavaScript</span>
          </div>
        </div>
      </div>
      <div class="fe-info">
        ${L.map((l) => `
          <div class="fe-card" data-r>
            <p class="label accent">${esc(l.name)}</p>
            <p class="h2">${esc(l.what)}</p>
            <p class="body">${esc(l.desc)}</p>
            <p class="fe-analogy"><span class="label">Analogía</span> <span class="chip is-signal">${esc(l.analogy)}</span></p>
            <pre class="code">${highlight(l.code, l.key === 'html' ? 'html' : l.key === 'css' ? 'css' : 'js')}</pre>
          </div>`).join('')}
      </div>
      <div class="block b-bl caps fe-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <div class="fe-formula" data-r>${T.formula.map((f, i) => `<span class="${i === 3 ? 'is-result' : ''}">${esc(f)}</span>`).join('<i>+</i>').replace(/<i>\+<\/i>(<span class="is-result">)/, '<i>=</i>$1')}</div>
      <p class="block b-br body fe-note" data-r>${esc(T.note)}</p>
      <p class="sr-only">Una página web se compone de tres capas: HTML define qué existe, CSS cómo se ve y JavaScript qué sucede al interactuar.</p>
    `);
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const stack = $(st, '.fe-stack');
    const [lh, lc, lj] = $$(st, '.fe-layer');
    const tags = $$(st, '.fe-tag');
    const cards = $$(st, '.fe-card');
    const ring = $(st, '.js-ring');
    const cursor = $(st, '.js-cursor');
    const evt = $(st, '.js-event');
    const btn = $(st, '.mp-styled .mp-btn');

    ctx.show($(st, '.fe-head h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.fromTo($(st, '.fe-scene'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, ctx.at(0, 0.3));
    ctx.caps($$(st, '.fe-caps > p'));
    ctx.show($(st, '.fe-note'), ctx.at(1, 0.5));
    ctx.hide($(st, '.fe-note'), ctx.at(2, 0));

    // 1 · se separan las capas (vista isométrica)
    ctx.to(stack, { rotationX: 54, rotationZ: -30, scale: 0.72, duration: 0.7, ease: 'power3.inOut' }, ctx.at(1, 0));
    ctx.to(lj, { borderColor: 'rgba(26,79,224,.6)', duration: 0.3 }, ctx.at(1, 0.4));
    ctx.to(lc, { z: 170, duration: 0.7, ease: 'power3.inOut' }, ctx.at(1, 0.1));
    ctx.to(lj, { z: 340, duration: 0.7, ease: 'power3.inOut' }, ctx.at(1, 0.15));
    ctx.to(tags, { opacity: 1, duration: 0.3 }, ctx.at(1, 0.6));
    ctx.to(st.querySelector('.fe-scene'), { xPercent: 8, duration: 0.6 }, ctx.at(2, 0));
    ctx.hide($(st, '.fe-head h2'), ctx.at(2, 0));
    ctx.show($(st, '.fe-head h2'), ctx.at(5, 0.3));

    // 2 · HTML · 3 · CSS · 4 · JavaScript
    const focus = (k, on) => {
      const others = [lh, lc, lj].filter((_, i) => i !== on);
      ctx.to(others, { opacity: 0.08, duration: 0.35 }, ctx.at(k, 0.05));
      ctx.to([lh, lc, lj][on], { opacity: 1, duration: 0.35 }, ctx.at(k, 0.05));
    };
    focus(2, 0); focus(3, 1); focus(4, 2);
    ctx.seq(cards, 2, { keepLast: false });

    // demostración de comportamiento: cursor → clic → estado enviado
    ctx.fromTo(cursor, { x: 120, y: 90, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, ctx.at(4, 0.2));
    ctx.fromTo(ring, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.15 }, ctx.at(4, 0.55));
    ctx.to(btn, { '--sent': 1, duration: 0.1 }, ctx.at(4, 0.6));
    ctx.fromTo(evt, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2 }, ctx.at(4, 0.62));

    // 5 · se juntan otra vez
    ctx.to([lh, lc, lj], { opacity: 1, duration: 0.3 }, ctx.at(5, 0));
    ctx.to([lc, lj], { z: 0, duration: 0.6, ease: 'power3.inOut' }, ctx.at(5, 0.05));
    ctx.to(stack, { rotationX: 0, rotationZ: 0, scale: 0.84, duration: 0.65, ease: 'power3.inOut' }, ctx.at(5, 0.1));
    ctx.to(lj, { borderColor: 'rgba(26,79,224,0)', duration: 0.3 }, ctx.at(5, 0));
    ctx.to(st.querySelector('.fe-scene'), { xPercent: 0, duration: 0.6 }, ctx.at(5, 0.1));
    ctx.to(tags, { opacity: 0, duration: 0.2 }, ctx.at(5, 0));
    ctx.to([evt, ring], { opacity: 0, duration: 0.2 }, ctx.at(5, 0));
    ctx.show($(st, '.fe-formula'), ctx.at(5, 0.55));
  },
};
