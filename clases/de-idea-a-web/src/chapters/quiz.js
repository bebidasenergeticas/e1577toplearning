/* QUIZ — 5 preguntas, retroalimentación inmediata, sin guardar datos. Teclas 1–4 y Enter. */
import { TEXT, CHAPTERS } from '../content/chapters.js';
import { QUIZ } from '../content/quiz.js';
import { esc, $, keyHandlers } from '../ui/shared.js';

const T = TEXT.quiz;

export default {
  steps: 1,

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <section class="qz card" aria-labelledby="${entry.meta.id}-h">
        <header class="qz-head">
          <div><h2 class="qz-title" id="${entry.meta.id}-h">${esc(T.title)}</h2><p class="label">${esc(T.sub)}</p></div>
          <ol class="qz-dots" aria-hidden="true">${QUIZ.map(() => '<li></li>').join('')}</ol>
        </header>
        <div class="qz-body" aria-live="polite"></div>
        <footer class="qz-foot"><span class="label qz-keys">${esc(T.keys)}</span><button type="button" class="qz-next" hidden></button></footer>
      </section>
    `);
    const body = $(stage, '.qz-body');
    const next = $(stage, '.qz-next');
    const dots = [...stage.querySelectorAll('.qz-dots li')];
    let i = -1, score = 0, answered = false;
    const wrong = [];

    function intro() {
      i = -1; score = 0; wrong.length = 0; answered = false;
      dots.forEach((d) => { d.className = ''; });
      body.innerHTML = `<p class="qz-q h2">5 preguntas sobre lo que vimos hoy.</p>`;
      next.hidden = false; next.textContent = T.start;
    }
    function show(n) {
      i = n; answered = false;
      const q = QUIZ[n];
      dots.forEach((d, j) => d.classList.toggle('is-now', j === n));
      body.innerHTML = `
        <p class="label qz-count">Pregunta ${n + 1} de ${QUIZ.length}</p>
        <p class="qz-q h2">${esc(q.q)}</p>
        <div class="qz-opts">${q.options.map((o, j) => `<button type="button" class="qz-opt" data-j="${j}"><kbd>${j + 1}</kbd><span>${esc(o)}</span><i class="qz-mark" aria-hidden="true"></i></button>`).join('')}</div>
        <p class="qz-fb" role="status"></p>`;
      next.hidden = true;
      body.querySelectorAll('.qz-opt').forEach((b) => b.addEventListener('click', () => answer(Number(b.dataset.j))));
    }
    function answer(j) {
      if (answered || i < 0 || i >= QUIZ.length) return;
      answered = true;
      const q = QUIZ[i];
      const ok = j === q.correct;
      if (ok) score++; else wrong.push(q);
      dots[i].classList.add(ok ? 'is-ok' : 'is-bad');
      body.querySelectorAll('.qz-opt').forEach((b, k) => {
        b.disabled = true;
        if (k === q.correct) b.classList.add('is-ok');
        if (k === j && !ok) b.classList.add('is-bad');
      });
      body.querySelector('.qz-fb').innerHTML = `<b class="${ok ? 'ok' : 'bad'}">${ok ? '✓ Correcto.' : '✕ No exactamente.'}</b> ${esc(q.why)}`;
      next.hidden = false;
      next.textContent = i < QUIZ.length - 1 ? T.next : T.finish;
      next.focus({ preventScroll: true });
    }
    function result() {
      i = QUIZ.length;
      dots.forEach((d) => d.classList.remove('is-now'));
      const reviews = [...new Map(wrong.map((q) => [q.review, q])).values()];
      body.innerHTML = `
        <p class="label qz-count">Resultado</p>
        <p class="qz-score"><b>${score}</b> / ${QUIZ.length}</p>
        <p class="lead">${score === QUIZ.length ? '¡Excelente! Dominas los conceptos clave.' : score >= 3 ? 'Muy bien. Repasa lo que falló:' : 'Vale la pena repasar estos capítulos:'}</p>
        ${reviews.length ? `<div class="qz-review">${reviews.map((q) => `<button type="button" class="chip qz-go" data-id="${q.review}">${esc(T.review)}: ${esc(CHAPTERS.find((c) => c.id === q.review)?.nav || q.review)}</button>`).join('')}</div>` : ''}`;
      body.querySelectorAll('.qz-go').forEach((b) => b.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('presentacion:goto', { detail: { id: b.dataset.id, step: 0 } }));
      }));
      next.hidden = false; next.textContent = T.restart;
    }
    next.addEventListener('click', () => {
      if (i === -1) show(0);
      else if (i >= QUIZ.length) intro();
      else if (answered) (i < QUIZ.length - 1 ? show(i + 1) : result());
    });
    keyHandlers.push((e) => {
      if (document.body.dataset.chapter !== entry.meta.id) return false;
      if (/^[1-4]$/.test(e.key) && i >= 0 && i < QUIZ.length && !answered) { answer(Number(e.key) - 1); return true; }
      if (e.key === 'Enter' && !next.hidden && document.activeElement !== next) { next.click(); return true; }
      return false;
    });
    intro();
  },

  build(ctx, r, entry) {
    ctx.fromTo($(entry.stage, '.qz'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, ctx.at(0, 0.3));
  },
};
