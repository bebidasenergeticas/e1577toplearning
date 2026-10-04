/* 09 · FRAMEWORK CODEWEB — 7 decisiones antes de pedir una web (tarjeta final para captura) */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';
import { toast } from '../ui/menu.js';

const T = TEXT.codeweb;

export default {
  steps: 9,

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl-wide cw-head"><h2 class="h1" id="${entry.meta.id}-h" data-r>${esc(T.title)}</h2></div>
      <div class="cw-letters" aria-hidden="true">${T.items.map((it) => `<span class="cw-l" data-r>${esc(it.l)}</span>`).join('')}</div>
      <div class="cw-details">${T.items.map((it) => `
        <div class="cw-d" data-r>
          <p class="cw-d-name"><b class="accent">${esc(it.l)}</b> — ${esc(it.name)}</p>
          <p class="lead">${esc(it.q)}</p>
          <p class="cw-d-ex"><span class="label">Ejemplo</span> ${esc(it.ex)}</p>
        </div>`).join('')}
      </div>
      <section class="cw-card card" data-r aria-labelledby="cw-card-t">
        <header class="cw-card-head">
          <h3 id="cw-card-t" class="cw-card-title">${esc(T.cardTitle)}</h3>
          <div class="cw-card-actions"><span class="label">${esc(T.shot)}</span><button type="button" class="cw-copy">${esc(T.copy)}</button></div>
        </header>
        <table class="cw-table">
          ${T.items.map((it) => `<tr><th scope="row"><b>${esc(it.l)}</b></th><td class="cw-n">${esc(it.name)}</td><td class="cw-q">${esc(it.q)}</td><td class="cw-e">${esc(it.ex)}</td></tr>`).join('')}
        </table>
      </section>
    `);
    $(stage, '.cw-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(T.template);
        toast(T.copied);
      } catch {
        toast('No se pudo copiar: selecciona el texto de la tarjeta manualmente.');
      }
    });
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const letters = $$(st, '.cw-l');
    const details = $$(st, '.cw-d');
    ctx.show($(st, '.cw-head h2'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.show(letters, ctx.at(0, 0.35), { y: 60, d: 0.5, stagger: 0.04 });

    letters.forEach((l, i) => {
      const k = i + 1;
      ctx.to(l, { '--on': 1, y: -12, duration: 0.3, ease: 'power3.out' }, ctx.at(k, 0));
      if (k < 7) ctx.to(l, { '--on': 0.45, y: 0, duration: 0.25 }, ctx.at(k + 1, 0));
    });
    ctx.seq(details, 1, { keepLast: false });

    // 8 · tarjeta resumen (para captura de pantalla)
    ctx.to(letters, { '--on': 1, y: 0, duration: 0.25 }, ctx.at(8, 0));
    ctx.to($(st, '.cw-letters'), { opacity: 0, y: -30, duration: 0.3 }, ctx.at(8, 0.05));
    ctx.hide($(st, '.cw-head h2'), ctx.at(8, 0));
    ctx.fromTo($(st, '.cw-card'), { opacity: 0, y: 50, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, ctx.at(8, 0.25));
  },
};
