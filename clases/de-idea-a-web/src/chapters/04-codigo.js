/* 04 · DE CÓDIGO A INTERFAZ — editor (izquierda) → el navegador interpreta → vista previa (derecha) */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$, highlight } from '../ui/shared.js';

const T = TEXT.codigo;
const V = T.preview;

const pane = (code, lang, i) => `
  <pre class="cd-pane" data-pane="${i}"><code>${code.split('\n').map((l, n) => `<span class="ln"><i>${n + 1}</i>${highlight(l, lang) || ' '}</span>`).join('')}</code></pre>`;

export default {
  steps: 5,

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl-wide"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <div class="cd-wrap" data-r>
        <div class="cd-editor" aria-label="Editor de código (ilustrativo)">
          <div class="cd-tabs">${T.tabs.map((t, i) => `<span class="cd-tab" data-tab="${i}">${esc(t)}</span>`).join('')}</div>
          <div class="cd-panes">${pane(T.html, 'html', 0)}${pane(T.css, 'css', 1)}${pane(T.js, 'js', 2)}</div>
        </div>
        <div class="cd-arrow"><span class="label">${esc(T.interprets)}</span><svg viewBox="0 0 80 16" aria-hidden="true"><path d="M0 8h72m-8-6 8 6-8 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>
        <div class="cd-browser">
          <div class="cd-chrome"><span></span><span></span><span></span><b>${esc(V.url)}</b></div>
          <div class="pv" data-state="blank" data-sent="0">
            <p class="pv-eyebrow">${esc(V.eyebrow)}</p>
            <h3 class="pv-h1">${esc(V.h1)}</h3>
            <button type="button" class="pv-btn" tabindex="-1"><span class="pv-t">${esc(V.button)}</span><span class="pv-s">${esc(V.sent)}</span></button>
            <svg class="pv-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2l15 9-7 1.5L9 20z" fill="#161616" stroke="#fff" stroke-width="1.5"/></svg>
          </div>
        </div>
      </div>
      <div class="block b-bl caps cd-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <p class="cd-lead h2" data-r>${esc(T.lead)}</p>
    `);
    // El botón de la vista previa funciona de verdad (para demostrarlo en vivo)
    const pv = $(stage, '.pv');
    $(stage, '.pv-btn').addEventListener('click', () => {
      if (pv.dataset.state === 'js') pv.dataset.sent = pv.dataset.sent === '1' ? '0' : '1';
    });
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const pv = $(st, '.pv');
    const tabs = $$(st, '.cd-tab');
    const panes = $$(st, '.cd-pane');
    const arrow = $(st, '.cd-arrow');
    const cursor = $(st, '.pv-cursor');

    ctx.show($(st, '.b-tl-wide h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.show($(st, '.cd-wrap'), ctx.at(0, 0.35), { y: 40, d: 0.6 });
    ctx.caps($$(st, '.cd-caps > p'));

    const stepFile = (k, i, state) => {
      ctx.set(tabs[i], { attr: { 'data-on': '1' } }, ctx.at(k, 0));
      if (i > 0) ctx.set(tabs[i - 1], { attr: { 'data-on': '0' } }, ctx.at(k, 0));
      ctx.to(panes, { opacity: 0, duration: 0.1 }, ctx.at(k, 0));
      ctx.to(panes[i], { opacity: 1, duration: 0.1 }, ctx.at(k, 0.05));
      ctx.fromTo(panes[i].querySelectorAll('.ln'), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.12, stagger: 0.045, ease: 'none' }, ctx.at(k, 0.1));
      ctx.fromTo(arrow, { '--pulse': 0 }, { '--pulse': 1, duration: 0.15, yoyo: true, repeat: 1 }, ctx.at(k, 0.55));
      ctx.set(pv, { attr: { 'data-state': state } }, ctx.at(k, 0.62));
    };
    stepFile(1, 0, 'html');
    stepFile(2, 1, 'css');
    stepFile(3, 2, 'js');

    // JavaScript: el cursor hace clic y el botón responde
    ctx.fromTo(cursor, { opacity: 0, x: 90, y: 70 }, { opacity: 1, x: 0, y: 0, duration: 0.18, ease: 'power2.out' }, ctx.at(3, 0.66));
    ctx.set(pv, { attr: { 'data-sent': '1' } }, ctx.at(3, 0.86));
    ctx.to(cursor, { opacity: 0, duration: 0.1 }, ctx.at(4, 0));

    ctx.to(arrow, { '--pulse': 1, duration: 0.2 }, ctx.at(4, 0.1));
    ctx.show($(st, '.cd-lead'), ctx.at(4, 0.3));
  },
};
