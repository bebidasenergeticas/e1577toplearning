/* 12 · RESPONSIVE — la misma web se reorganiza de verdad (container queries) en desktop, tablet y smartphone */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.responsive;
const M = T.mini;

const mini = () => `
  <div class="rp">
    <div class="rp-nav"><b>${esc(M.brand)}</b><span class="rp-links">${M.links.map((l) => `<span>${esc(l)}</span>`).join('')}</span><span class="rp-burger" aria-hidden="true"><i></i><i></i><i></i></span></div>
    <div class="rp-hero">
      <div class="rp-copy"><p class="rp-h">${esc(M.h1)}</p><p class="rp-p">${esc(M.p)}</p><span class="rp-btn">${esc(M.button)}</span></div>
      <div class="rp-form">${M.form.map((f) => `<span class="rp-field">${esc(f)}</span>`).join('')}<span class="rp-send">Enviar</span></div>
    </div>
    <div class="rp-cards">${M.cards.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
  </div>`;

const SIZES = { desktop: [50, 29.5], tablet: [26, 29.5], phone: [15, 29] };

export default {
  steps: 5,

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl-wide rs-head">
        <h2 class="h1 rs-t1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2>
        <p class="h1 rs-t2 accent" data-r>${esc(T.title2)}</p>
      </div>
      <div class="rs-stage" data-r aria-hidden="true">
        <div class="rs-device is-main" style="--w:${SIZES.desktop[0]};--h:${SIZES.desktop[1]}"><div class="rs-screen">${mini()}</div><span class="rs-name label"></span></div>
        <div class="rs-trio">
          ${['desktop', 'tablet', 'phone'].map((k, i) => `<div class="rs-device rs-${k}" style="--w:${SIZES[k][0]};--h:${SIZES[k][1]}"><div class="rs-screen">${mini()}</div><span class="rs-name label">${esc(T.devices[i])}</span></div>`).join('')}
        </div>
      </div>
      <p class="rs-def lead strong" data-r>${esc(T.def)}</p>
      <div class="block b-bl caps rs-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <ul class="rs-concepts">${T.concepts.map(([a, b]) => `<li data-r><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
    `);
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const main = $(st, '.rs-device.is-main');
    const name = $(main, '.rs-name');
    const trio = $(st, '.rs-trio');
    const setName = (k, label) => ctx.set(name, { attr: { 'data-label': label } }, ctx.at(k, 0.5));
    ctx.show($(st, '.rs-t1'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.show($(st, '.rs-stage'), ctx.at(0, 0.35), { y: 40, d: 0.6 });
    ctx.set(name, { attr: { 'data-label': T.devices[0] } }, 0);
    ctx.caps($$(st, '.rs-caps > p'));
    ctx.show($(st, '.rs-def'), ctx.at(1, 0.5));
    ctx.hide($(st, '.rs-def'), ctx.at(3, 0));

    // 1 · tablet · 2 · smartphone (el contenido se reorganiza al cambiar el ancho)
    ctx.to(main, { '--w': SIZES.tablet[0], '--h': SIZES.tablet[1], duration: 0.7, ease: 'power3.inOut' }, ctx.at(1, 0));
    setName(1, T.devices[1]);
    ctx.to(main, { '--w': SIZES.phone[0], '--h': SIZES.phone[1], duration: 0.7, ease: 'power3.inOut' }, ctx.at(2, 0));
    setName(2, T.devices[2]);

    // 3 · los tres, lado a lado
    ctx.to(main, { opacity: 0, scale: 0.9, duration: 0.3 }, ctx.at(3, 0));
    ctx.fromTo(trio, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, ctx.at(3, 0.2));
    ctx.fromTo($$(trio, '.rs-device'), { rotationY: 0 }, { rotationY: (i) => [16, 0, -16][i], duration: 0.6, ease: 'power3.out' }, ctx.at(3, 0.3));
    ctx.hide($(st, '.rs-t1'), ctx.at(3, 0));
    ctx.show($(st, '.rs-t2'), ctx.at(3, 0.3));

    // 4 · conceptos clave
    ctx.show($$(st, '.rs-concepts li'), ctx.at(4, 0.15), { stagger: 0.08 });
  },
};
