/* 08 · ANTES DE PEDIRLE ALGO A LA IA — el prompt vago vs. la especificación sólida */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.error;

export default {
  steps: 5,

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="er-head">
        <p class="er-big h1" data-r>${esc(T.label)}</p>
        <h2 class="er-st h2" id="${entry.meta.id}-h" data-r>${esc(T.statement[0])} <span class="accent">${esc(T.statement[1])}</span></h2>
      </div>
      <div class="er-bubble" data-r><span class="er-avatar" aria-hidden="true"></span><p>${esc(T.bad)}</p></div>
      <div class="er-spec" aria-label="${esc(T.specTitle)}">
        <p class="er-spec-title label" data-r>${esc(T.specTitle)}</p>
        <ol class="er-pieces">${T.pieces.map(([k, v]) => `<li class="er-piece" data-r><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join('')}</ol>
      </div>
      <figure class="er-result" data-r aria-hidden="true">
        <figcaption class="label er-cap"><span class="er-cap-a">${esc(T.generic)}</span><span class="er-cap-b">${esc(T.result)}</span></figcaption>
        <div class="er-page">
          <div class="er-generic">
            <i class="w60"></i><i class="w90"></i><i class="w75"></i><i class="box"></i><i class="w80"></i><i class="w50"></i>
          </div>
          <div class="er-specific">
            <div class="es-nav"><b>Nova</b><span>Servicios · Proceso · Contacto</span></div>
            <p class="es-eye">Consultoría para PyMEs</p>
            <p class="es-h">Ordenamos tus procesos para que vendas más.</p>
            <span class="es-btn">Agendar llamada</span>
            <div class="es-row"><span>Diagnóstico</span><span>Proceso</span><span>Formulario</span></div>
          </div>
        </div>
      </figure>
      <p class="er-final h2" data-r>${esc(T.final)}</p>
    `);
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const pieces = $$(st, '.er-piece');
    const bubble = $(st, '.er-bubble');
    const result = $(st, '.er-result');

    // 0 · el prompt malo, pequeño y solo
    ctx.show($(st, '.er-big'), ctx.at(0, 0.2));
    ctx.hide($(st, '.er-big'), ctx.at(1, 0));
    ctx.fromTo(bubble, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, ctx.at(0, 0.35));

    // 1 · resultado genérico + la frase
    ctx.fromTo(result, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, ctx.at(1, 0.1));
    ctx.show($(st, '.er-st'), ctx.at(1, 0.35));

    // 2 y 3 · las 7 piezas entran desde la profundidad
    ctx.show($(st, '.er-spec-title'), ctx.at(2, 0.2));
    pieces.forEach((p, i) => {
      const k = i < 4 ? 2 : 3;
      const j = i < 4 ? i : i - 4;
      ctx.fromTo(p, { opacity: 0, z: -420, rotationX: -18 }, { opacity: 1, z: 0, rotationX: 0, duration: 0.42, ease: 'power3.out' }, ctx.at(k, 0.2 + j * 0.12));
    });

    // 4 · especificación sólida → resultado específico
    ctx.to(bubble, { '--strike': 1, duration: 0.3 }, ctx.at(4, 0));
    ctx.to($(st, '.er-spec'), { '--solid': 1, duration: 0.35 }, ctx.at(4, 0.05));
    ctx.to(result, { '--spec': 1, duration: 0.45, ease: 'power2.inOut' }, ctx.at(4, 0.2));
    ctx.show($(st, '.er-final'), ctx.at(4, 0.45));
  },
};
