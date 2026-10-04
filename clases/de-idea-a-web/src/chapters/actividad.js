/* ACTIVIDAD · TU PROFESIÓN — la misma arquitectura sirve para cualquier negocio. Nada se guarda ni se envía. */
import gsap from 'gsap';
import { TEXT } from '../content/chapters.js';
import { PROFESSIONS, GENERIC_PROFESSION } from '../content/professions.js';
import { esc, $, $$, norm } from '../ui/shared.js';
import { motion } from '../core/motion.js';

const T = TEXT.actividad;

function match(text) {
  const n = norm(text);
  if (!n) return null;
  const exact = PROFESSIONS.find((p) => norm(p.name) === n);
  if (exact) return exact;
  return PROFESSIONS.find((p) => p.keywords.some((k) => new RegExp(`(^|[^a-z])${k}`).test(n))) || null;
}

export default {
  steps: 2,

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="ac-wrap">
        <h2 class="h1" id="${entry.meta.id}-h">${esc(T.title)}</h2>
        <form class="ac-form" autocomplete="off">
          <label class="sr-only" for="ac-input">${esc(T.inputLabel)}</label>
          <input id="ac-input" class="ac-input" type="text" maxlength="60" placeholder="${esc(T.placeholder)}" />
          <button type="submit" class="ac-go">${esc(T.go)}</button>
        </form>
        <div class="ac-chips" role="group" aria-label="${esc(T.pick)}">
          <span class="label">${esc(T.pick)}</span>
          ${PROFESSIONS.map((p) => `<button type="button" class="ac-chip" data-id="${p.id}" aria-pressed="false">${esc(p.name)}</button>`).join('')}
        </div>
        <div class="ac-rows" aria-live="polite">
          <p class="label ac-row-l">${esc(T.yourLabel)} <span class="ac-who"></span></p>
          <ol class="ac-row ac-top">${[0, 1, 2, 3].map(() => '<li class="ac-node"><span>—</span></li>').join('<li class="ac-arr" aria-hidden="true">→</li>')}</ol>
          <ol class="ac-row ac-base" aria-label="${esc(T.genericLabel)}">${T.generic.map((g) => `<li class="ac-node is-base"><span>${esc(g)}</span></li>`).join('<li class="ac-arr" aria-hidden="true">→</li>')}</ol>
          <p class="label ac-row-l">${esc(T.genericLabel)}</p>
          <p class="ac-example body"></p>
        </div>
        <p class="ac-note h2" data-r>${esc(T.note)}</p>
        <p class="ac-privacy label">${esc(T.privacy)}</p>
      </div>
    `);

    const top = $$(stage, '.ac-top .ac-node span');
    const example = $(stage, '.ac-example');
    const who = $(stage, '.ac-who');
    const chips = $$(stage, '.ac-chip');
    const input = $(stage, '#ac-input');

    function render(prof, typed) {
      const flow = prof ? prof.flow : GENERIC_PROFESSION.flow;
      const ex = prof ? prof.example : GENERIC_PROFESSION.example.replace('{nombre}', typed);
      chips.forEach((c) => c.setAttribute('aria-pressed', String(prof?.id === c.dataset.id)));
      who.textContent = prof ? `· ${prof.name}${prof.adapted ? ' (adaptación)' : ''}` : typed ? `· ${typed}` : '';
      const apply = () => { top.forEach((el, i) => { el.textContent = flow[i]; }); example.textContent = ex; };
      if (motion.reduced) { apply(); return; }
      gsap.timeline()
        .to(top, { opacity: 0, y: -10, duration: 0.15, stagger: 0.03 })
        .add(apply)
        .fromTo(top, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07, ease: 'power3.out' })
        .fromTo($$(stage, '.ac-top .ac-node'), { '--pulse': 1 }, { '--pulse': 0, duration: 0.8, stagger: 0.07 }, '<');
    }

    chips.forEach((c) => c.addEventListener('click', () => {
      const p = PROFESSIONS.find((x) => x.id === c.dataset.id);
      input.value = '';
      render(p, p.name);
    }));
    $(stage, '.ac-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const typed = input.value.trim().slice(0, 60);
      if (!typed) { input.focus(); return; }
      render(match(typed), typed);
      input.blur();
    });
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.fromTo($(st, '.ac-wrap'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, ctx.at(0, 0.3));
    ctx.show($(st, '.ac-note'), ctx.at(1, 0.3));
    ctx.to($(st, '.ac-base'), { '--hl': 1, duration: 0.3 }, ctx.at(1, 0.3));
  },
};
